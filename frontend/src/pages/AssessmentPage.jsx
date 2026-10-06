import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CircleCheckBig } from 'lucide-react'
import { AssessmentHeader } from '@/components/assessment/AssessmentHeader'
import { ChannelIndicator } from '@/components/assessment/ChannelIndicator'
import { DecisionPanel } from '@/components/assessment/DecisionPanel'
import { PhoneSimulator } from '@/components/assessment/PhoneSimulator'
import { ScenarioContainer } from '@/components/assessment/ScenarioContainer'
import { AppLayout } from '@/components/layout/AppLayout'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { ASSESSMENT_UI_STATE, judgementOptionsFrom } from '@/constants/assessment'
import { ROUTES } from '@/constants/routes'
import { useCandidate } from '@/hooks/useCandidate'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { assessmentApi } from '@/services/assessmentApi'

const EMPTY_ANSWER = { judgement: '', action: '', reason: '' }

/**
 * The backend owns the sequence, the current question, timing and scoring.
 * This screen renders whatever the server says is current and posts back the
 * candidate's three choices - nothing else.
 */
export function AssessmentPage() {
  useDocumentTitle()

  const navigate = useNavigate()
  const { clearSession } = useCandidate()

  const [uiState, setUiState] = useState(ASSESSMENT_UI_STATE.LOADING)
  const [assessmentId, setAssessmentId] = useState(null)
  const [question, setQuestion] = useState(null)
  const [progress, setProgress] = useState(null)
  const [answer, setAnswer] = useState(EMPTY_ANSWER)
  const [feedback, setFeedback] = useState(null)
  const [completion, setCompletion] = useState(null)
  const [error, setError] = useState('')

  const interactions = useRef([])

  const handleApiError = useCallback(
    (apiError) => {
      if (apiError.isSessionExpired) {
        clearSession()
        navigate(ROUTES.LOGIN, { replace: true })
        return
      }
      setError(apiError.message)
      setUiState(ASSESSMENT_UI_STATE.ERROR)
    },
    [clearSession, navigate],
  )

  const applyPayload = useCallback((payload) => {
    setProgress(payload.progress)
    setAssessmentId(payload.progress.assessmentId)
    setQuestion(payload.question)
    setAnswer(EMPTY_ANSWER)
    setFeedback(null)
    interactions.current = []
    setUiState(ASSESSMENT_UI_STATE.ACTIVE)
  }, [])

  /**
   * On load and on refresh: ask which assessment is active and resume it.
   * A new assessment is only ever created from the dashboard button, so a
   * refresh here can never start a second one.
   */
  const load = useCallback(
    async (signal, { showLoading = true } = {}) => {
      if (showLoading) {
        setUiState(ASSESSMENT_UI_STATE.LOADING)
        setError('')
      }
      try {
        const { assessment } = await assessmentApi.getActive({ signal })
        if (!assessment) {
          navigate(ROUTES.DASHBOARD, { replace: true })
          return
        }
        applyPayload(await assessmentApi.get(assessment.assessmentId, { signal }))
      } catch (apiError) {
        if (apiError.name !== 'AbortError') handleApiError(apiError)
      }
    },
    [applyPayload, handleApiError, navigate],
  )

  useEffect(() => {
    const controller = new AbortController()
    // Data fetch on mount. LOADING is already the initial state, so `load` is
    // called with showLoading:false and sets nothing until its first await.
    // eslint-disable-next-line react/set-state-in-effect
    load(controller.signal, { showLoading: false })
    return () => controller.abort()
  }, [load])

  const canSubmit = Boolean(answer.judgement && answer.action && answer.reason)
  const submitting = uiState === ASSESSMENT_UI_STATE.SUBMITTING

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return

    setUiState(ASSESSMENT_UI_STATE.SUBMITTING)
    setError('')
    try {
      const result = await assessmentApi.submitAnswer(assessmentId, {
        questionNumber: question.questionNumber,
        judgement: answer.judgement,
        actionKey: answer.action,
        reasonKey: answer.reason,
        interactions: interactions.current,
      })
      setFeedback(result.feedback)
      setProgress(result.progress)
      setUiState(ASSESSMENT_UI_STATE.ACTIVE)
    } catch (apiError) {
      // The server moved on without us (a stale tab, a double submit) - resync.
      if (apiError.code === 'NOT_CURRENT_QUESTION' || apiError.code === 'ALREADY_ANSWERED') {
        await load()
        return
      }
      handleApiError(apiError)
    }
  }

  const handleContinue = async () => {
    setUiState(ASSESSMENT_UI_STATE.SUBMITTING)
    try {
      if (progress?.allAnswered) {
        setCompletion(await assessmentApi.complete(assessmentId))
        setUiState(ASSESSMENT_UI_STATE.COMPLETED)
        return
      }
      applyPayload(await assessmentApi.get(assessmentId))
    } catch (apiError) {
      handleApiError(apiError)
    }
  }

  if (uiState === ASSESSMENT_UI_STATE.LOADING) {
    return (
      <AppLayout size="sm">
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <Spinner size={26} label="Loading your question" />
          <p className="text-text-muted">Getting your question ready...</p>
        </Card>
      </AppLayout>
    )
  }

  if (uiState === ASSESSMENT_UI_STATE.ERROR) {
    return (
      <AppLayout size="sm">
        <Card className="animate-fade-up">
          <h1 className="text-xl font-bold sm:text-2xl">Something went wrong</h1>
          <Alert variant="danger" className="mt-4">
            {error}
          </Alert>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => load()}>Try Again</Button>
            <Button variant="outline" onClick={() => navigate(ROUTES.DASHBOARD)}>
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </AppLayout>
    )
  }

  if (uiState === ASSESSMENT_UI_STATE.COMPLETED) {
    return (
      <AppLayout size="sm">
        <Card className="animate-fade-up text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-success-soft text-success">
            <CircleCheckBig size={28} aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-xl font-bold sm:text-2xl">Assessment finished</h1>
          <p className="mt-2 text-text-muted">
            You have answered all {completion?.totalQuestions ?? 10} questions. Your
            answers have been saved.
          </p>

          <Alert variant="info" className="mt-5 text-left" title="Your result is not ready yet">
            The result screen - score, feedback and EVI profile - is built in FE-012.
          </Alert>

          <Button className="mt-6" onClick={() => navigate(ROUTES.DASHBOARD)}>
            Back to Dashboard
          </Button>
        </Card>
      </AppLayout>
    )
  }

  if (!question) return null

  return (
    <AppLayout
      subHeader={
        <AssessmentHeader
          current={question.questionNumber}
          total={question.totalQuestions}
        />
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-start lg:gap-8">
        <section className="min-w-0 animate-fade-up" aria-labelledby="scenario-heading">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <ChannelIndicator channel={question.scenario.channel} />
          </div>

          <h2 id="scenario-heading" className="mt-3 text-lg font-bold sm:text-xl">
            {question.scenario.title}
          </h2>
          {question.scenario.instruction && (
            <p className="mt-1 text-sm text-balance-pretty text-text-muted">
              {question.scenario.instruction}
            </p>
          )}

          <ScenarioContainer className="mt-4">
            <PhoneSimulator
              key={question.scenario.id}
              channel={question.scenario.channel}
              simulation={question.scenario.simulation}
              onInteraction={(event) =>
                interactions.current.push({ ...event, atMs: Date.now() })
              }
            />
          </ScenarioContainer>
        </section>

        <Card className="min-w-0 animate-fade-up" style={{ animationDelay: '60ms' }}>
          {feedback ? (
            <>
              <h2 className="text-lg font-bold sm:text-xl">
                {feedback.wasCorrect ? 'Correct' : 'Not quite'}
              </h2>
              <p className="mt-1 font-semibold text-text-muted">
                You scored <span className="text-text tabular-nums">{feedback.awarded}</span>{' '}
                out of <span className="tabular-nums">{feedback.maxMarks}</span>
              </p>

              <Alert
                variant={feedback.wasCorrect ? 'success' : 'warning'}
                className="mt-5"
                title={`This message was ${feedback.correctJudgement.replace('_', ' ')}`}
              >
                {feedback.explanation}
              </Alert>

              {feedback.warningSigns?.length > 0 && (
                <div className="mt-5">
                  <h3 className="font-semibold">What to look for</h3>
                  <ul className="mt-2 space-y-2 text-sm">
                    {feedback.warningSigns.map((sign) => (
                      <li key={sign} className="flex gap-2 text-balance-pretty">
                        <span
                          aria-hidden="true"
                          className="mt-2 size-1.5 shrink-0 rounded-full bg-warning"
                        />
                        {sign}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                size="lg"
                fullWidth
                className="mt-7"
                loading={submitting}
                onClick={handleContinue}
              >
                {progress?.allAnswered ? 'Finish Assessment' : 'Next Question'}
                {!submitting && <ArrowRight size={19} aria-hidden="true" />}
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold sm:text-xl">What do you think?</h2>
              <p className="mt-1 text-balance-pretty text-text-muted">
                Answer these three questions about the message above.
              </p>

              {error && (
                <Alert variant="danger" className="mt-5">
                  {error}
                </Alert>
              )}

              <div className="mt-6">
                <DecisionPanel
                  answer={answer}
                  onChange={setAnswer}
                  judgementOptions={judgementOptionsFrom(question.judgementOptions)}
                  actionOptions={question.scenario.actionOptions.map((option) => ({
                    value: option.key,
                    label: option.label,
                  }))}
                  reasonOptions={question.scenario.reasonOptions.map((option) => ({
                    value: option.key,
                    label: option.label,
                  }))}
                />
              </div>

              <div className="mt-7 border-t border-border pt-5">
                <Button
                  size="lg"
                  fullWidth
                  disabled={!canSubmit}
                  loading={submitting}
                  onClick={handleSubmit}
                >
                  Submit Answer
                </Button>
                <p className="mt-4 text-sm text-text-muted">
                  Answer all three questions above to continue. You cannot change an
                  answer once it is submitted.
                </p>
              </div>
            </>
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
