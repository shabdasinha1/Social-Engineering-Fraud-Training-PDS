import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AssessmentReview } from '@/components/result/AssessmentReview'
import { BehaviourBreakdown } from '@/components/result/BehaviourBreakdown'
import { RemediationList } from '@/components/result/RemediationList'
import { ResultSummary } from '@/components/result/ResultSummary'
import { ScenarioResultCard } from '@/components/result/ScenarioResultCard'
import { ROUTES } from '@/constants/routes'
import { AppLayout } from '@/components/layout/AppLayout'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useCandidate } from '@/hooks/useCandidate'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { attemptApi } from '@/services/attemptApi'
import { progressApi } from '@/services/progressApi'

/**
 * The completed-attempt result (UI-003).
 *
 * A presentation layer over the RESULT-001 projection and nothing more: no score is
 * summed here, no outcome is classified here, and no taxonomy is reconstructed here. Every
 * number, label and classification arrives ready to render, and a field the server omits
 * is simply not shown rather than filled in.
 *
 * Ownership is checked server-side: another candidate's attempt id returns 404, not their
 * result.
 */

export function ResultPage() {
  useDocumentTitle('Your result')

  const navigate = useNavigate()
  const { attemptId } = useParams()
  const { clearSession } = useCandidate()

  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  /**
   * Section 7 asks the result screen for "trend and exposure count" (PROGRESS-001, G2).
   * The trend already arrives inside the result projection; the exposure count is the
   * learner's completed-attempt total, which lives on the progress snapshot.
   *
   * Fetched separately and allowed to fail: a missing progress snapshot must never stop a
   * learner seeing the score they just earned, so `ResultSummary` simply omits the line.
   */
  const [progress, setProgress] = useState(null)

  const load = useCallback(
    async (signal) => {
      try {
        const data = await attemptApi.result(attemptId, { signal })
        setResult(data.result)
        setLoading(false)
        progressApi.mine({ signal })
          .then((p) => setProgress(p.progress))
          .catch(() => {})
      } catch (apiError) {
        if (apiError.name === 'AbortError') return
        if (apiError.isSessionExpired) {
          clearSession()
          navigate(ROUTES.LOGIN, { replace: true })
          return
        }
        setError(apiError.message)
        setLoading(false)
      }
    },
    [attemptId, clearSession, navigate],
  )

  useEffect(() => {
    // A missing id is decided during render below, so this effect only ever fetches.
    if (!attemptId) return undefined
    const controller = new AbortController()
    // Data fetch on mount. `load` is async and sets nothing before its first await;
    // LOADING is already the initial state, so no synchronous render is triggered.
    // eslint-disable-next-line react/set-state-in-effect
    load(controller.signal)
    return () => controller.abort()
  }, [attemptId, load])

  if (!attemptId) {
    return (
      <AppLayout size="sm">
        <Card>
          <h1 className="text-xl font-bold">Your result is not available</h1>
          <Alert variant="danger" className="mt-4">
            No attempt was named. Open your result from the dashboard.
          </Alert>
          <Button className="mt-6" onClick={() => navigate(ROUTES.DASHBOARD)}>
            Back to dashboard
          </Button>
        </Card>
      </AppLayout>
    )
  }

  if (loading) {
    return (
      <AppLayout size="sm">
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <Spinner size={26} label="Loading your result" />
          <p className="text-text-muted">Loading your result...</p>
        </Card>
      </AppLayout>
    )
  }

  if (error || !result) {
    return (
      <AppLayout size="sm">
        <Card>
          <h1 className="text-xl font-bold">Your result is not available</h1>
          <Alert variant="danger" className="mt-4">
            {error || 'This attempt has no result yet.'}
          </Alert>
          <Button className="mt-6" onClick={() => navigate(ROUTES.DASHBOARD)}>
            Back to dashboard
          </Button>
        </Card>
      </AppLayout>
    )
  }

  return (
    <AppLayout size="lg">
      <div className="space-y-6">
        <ResultSummary result={result} progress={progress} />

        {/*
          REVIEW-001. The learning review sits between the score and the breakdown, in that
          order on purpose: what happened, then what went wrong and what to do instead, then
          the aggregate patterns. A learner who reads no further than the second block has
          still been told the thing the assessment exists to teach them.
        */}
        <AssessmentReview summary={result.review_summary} />

        <section aria-labelledby="scenarios-heading">
          <h2 id="scenarios-heading" className="text-lg font-bold">
            Scenario by scenario
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            In the order you met them. Each one shows what you did, anything that went wrong,
            the cue you missed and the action that was expected.
          </p>

          <ul className="mt-4 space-y-3">
            {result.scenarios.map((scenario) => (
              <ScenarioResultCard key={scenario.ordinal} scenario={scenario} />
            ))}
          </ul>
        </section>

        <BehaviourBreakdown behaviour={result.behaviour} />

        <RemediationList remediation={result.remediation} />

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate(ROUTES.DASHBOARD)}>Back to dashboard</Button>
          <Button variant="outline" onClick={() => navigate(ROUTES.HISTORY)}>
            Past assessments
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
