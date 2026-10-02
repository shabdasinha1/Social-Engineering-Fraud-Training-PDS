import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ClipboardList, LogOut } from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { AppLayout } from '@/components/layout/AppLayout'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Spinner } from '@/components/ui/Spinner'
import { ASSESSMENT_SCENARIO_COUNT, SCENARIOS_PER_CHANNEL } from '@/constants/app'
import { ASSESSMENT_STATUS } from '@/constants/assessment'
import { CHANNELS } from '@/constants/channels'
import { ROUTES } from '@/constants/routes'
import { useCandidate } from '@/hooks/useCandidate'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { attemptApi } from '@/services/attemptApi'
import { progressApi } from '@/services/progressApi'

/**
 * Section 7's exposure count on the dashboard (PROGRESS-001).
 *
 * One line, deliberately. The count of completed assessments is the requirement; the last
 * and best scores are shown beside it because the learner has already been given both on
 * their own result screens, and nothing else from the snapshot is rendered here. No chart,
 * no platform or family breakdown, no ranking - this is not a statistics dashboard.
 *
 * It reports only COMPLETED attempts, so an assessment in progress contributes nothing and
 * no running score can appear.
 */
function ProgressLine({ progress, loading }) {
  if (loading) {
    return (
      <p className="mt-5 border-t border-border pt-4 text-sm text-text-muted">
        Loading your progress...
      </p>
    )
  }

  // The request failed. Progress is supplementary, so the card simply says nothing.
  if (!progress) return null

  const { attempt_count: attempts, best_score: best, last_score: last } = progress

  return (
    <div className="mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-1 border-t border-border pt-4 text-sm">
      <p className="font-semibold">
        <span className="tabular-nums">{attempts}</span>{' '}
        {attempts === 1 ? 'assessment' : 'assessments'} completed
      </p>

      {attempts === 0 ? (
        <p className="text-text-muted">This will be your first.</p>
      ) : (
        <>
          <p className="text-text-muted">
            Last score{' '}
            <span className="font-semibold tabular-nums text-text">
              {last}/{progress.max_score}
            </span>
          </p>
          <p className="text-text-muted">
            Best score{' '}
            <span className="font-semibold tabular-nums text-text">
              {best}/{progress.max_score}
            </span>
          </p>
        </>
      )}
    </div>
  )
}

export function DashboardPage() {
  useDocumentTitle('Dashboard')

  const navigate = useNavigate()
  const { candidate, clearSession, signOut } = useCandidate()
  const firstName = candidate?.display_name?.trim().split(/\s+/)[0]

  /**
   * What `GET /attempts/current` returned. NOT necessarily something to resume: when no
   * attempt is in progress the endpoint deliberately reports the learner's most recent
   * EXPIRED attempt (IMMERSIVE-001), so the simulation screen can explain a timeout to
   * someone reopening the browser. That attempt is already `completed`.
   */
  const [current, setCurrent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  /**
   * PROGRESS-001. `null` while it is being fetched, and stays `null` if the request fails -
   * progress is supplementary, so the dashboard renders and the assessment stays startable
   * whether or not it arrives. A failure here never becomes the page's error banner.
   */
  const [progress, setProgress] = useState(null)
  const [progressLoading, setProgressLoading] = useState(true)

  const handleApiError = useCallback(
    (apiError) => {
      if (apiError.isSessionExpired) {
        clearSession()
        navigate(ROUTES.LOGIN, { replace: true })
        return
      }
      setError(apiError.message)
    },
    [clearSession, navigate],
  )

  // Read-only. This never creates an attempt - only the button does.
  useEffect(() => {
    const controller = new AbortController()

    attemptApi
      .current({ signal: controller.signal })
      .then((data) => {
        setCurrent(data.attempt)
        setLoading(false)
      })
      .catch((apiError) => {
        // Aborted means this effect was cleaned up; the next run will settle it.
        if (apiError.name === 'AbortError') return
        handleApiError(apiError)
        setLoading(false)
      })

    return () => controller.abort()
  }, [handleApiError])

  // Progress is fetched separately so a failure cannot take the assessment card down with it.
  useEffect(() => {
    const controller = new AbortController()

    progressApi
      .mine({ signal: controller.signal })
      .then((data) => {
        setProgress(data.progress)
        setProgressLoading(false)
      })
      .catch((apiError) => {
        if (apiError.name === 'AbortError') return
        setProgressLoading(false)
      })

    return () => controller.abort()
  }, [])

  const handleStart = async () => {
    setStarting(true)
    setError('')
    try {
      await attemptApi.start()
      navigate(ROUTES.ASSESSMENT)
    } catch (apiError) {
      handleApiError(apiError)
      setStarting(false)
    }
  }

  /** The existing candidate sign-out (`POST /api/candidates/logout`), then back to login. */
  const handleLogout = async () => {
    setSigningOut(true)
    try {
      await signOut()
      navigate(ROUTES.LOGIN, { replace: true })
    } finally {
      setSigningOut(false)
    }
  }

  /**
   * FINAL-PRE-CLIENT-FIX-001. Only an attempt the SERVER says is still in progress can be
   * resumed. Reading "any attempt came back" as "resume it" left every learner whose last
   * attempt timed out on a Resume button that led only to "Time is up", with no way to
   * start again. An expired (or otherwise finished) attempt now falls through to the same
   * Start state as having none, and its result stays in past assessments.
   */
  const active = current?.status === 'in_progress' ? current : null

  const answered = active?.progress?.resolved ?? 0
  const total = active?.progress?.total ?? ASSESSMENT_SCENARIO_COUNT
  const percent = Math.round((answered / total) * 100)
  const status = active ? ASSESSMENT_STATUS.IN_PROGRESS : ASSESSMENT_STATUS.NOT_STARTED

  return (
    <AppLayout
      actions={
        <Button
          variant="outline"
          size="sm"
          className="min-h-11 shrink-0 whitespace-nowrap"
          onClick={handleLogout}
          loading={signingOut}
        >
          {!signingOut && <LogOut size={17} aria-hidden="true" />}
          Logout
        </Button>
      }
    >
      <header className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
          Welcome{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="mt-2 text-balance-pretty text-text-muted sm:text-lg">
          Your fraud awareness assessment is ready.
        </p>
      </header>

      <Card className="mt-6 animate-fade-up sm:mt-8" style={{ animationDelay: '60ms' }}>
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div>
            <h2 className="text-lg font-bold sm:text-xl">Your assessment</h2>
            <p className="mt-1 max-w-xl text-balance-pretty text-text-muted">
              {ASSESSMENT_SCENARIO_COUNT} six-stage scenarios, chosen from all four apps
              and mixed together. You take one assessment, not a separate test for each app.
            </p>
          </div>
          {!loading && <StatusBadge status={status} />}
        </div>

        {error && (
          <Alert variant="danger" className="mt-5">
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="mt-6 flex items-center gap-3 text-text-muted">
            <Spinner size={20} label="Loading your assessment" />
            Checking your assessment...
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-6">
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-semibold">
                  <span className="tabular-nums">{answered}</span> of{' '}
                  <span className="tabular-nums">{total}</span> completed
                </p>
                <p className="text-sm font-semibold text-text-muted tabular-nums">{percent}%</p>
              </div>
              <ProgressBar
                className="mt-2.5"
                value={answered}
                max={total}
                label={`${answered} of ${total} scenarios completed`}
              />
            </div>

            <Button
              size="lg"
              className="w-full sm:w-auto"
              loading={starting}
              onClick={active ? () => navigate(ROUTES.ASSESSMENT) : handleStart}
            >
              {active ? 'Resume Assessment' : 'Start Assessment'}
              {!starting && <ArrowRight size={19} aria-hidden="true" />}
            </Button>
          </div>
        )}
        <ProgressLine progress={progress} loading={progressLoading} />
      </Card>

      <div className="mt-4 animate-fade-up" style={{ animationDelay: '90ms' }}>
        <Button variant="ghost" onClick={() => navigate(ROUTES.HISTORY)}>
          <ClipboardList size={18} aria-hidden="true" />
          View your past assessments
        </Button>
      </div>

      <section className="mt-8 animate-fade-up lg:mt-10" style={{ animationDelay: '120ms' }}>
        <h2 className="text-lg font-bold sm:text-xl">Where the scenarios come from</h2>
        <p className="mt-1 max-w-2xl text-balance-pretty text-text-muted">
          Your {ASSESSMENT_SCENARIO_COUNT} scenarios are picked from these four apps.
          Each app has {SCENARIOS_PER_CHANNEL} scenarios available.
        </p>

        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {CHANNELS.map(({ key, label, icon: Icon, accent, description }, index) => (
            <li
              key={key}
              className="animate-fade-up rounded-lg border border-border bg-card p-5 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-border-strong hover:shadow-md"
              style={{ animationDelay: `${160 + index * 60}ms` }}
            >
              <div className="flex items-start gap-3.5">
                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-md ${accent}`}
                >
                  <Icon size={22} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold">{label}</h3>
                  <p className="mt-0.5 text-sm text-balance-pretty text-text-muted">
                    {description}
                  </p>
                </div>
              </div>

              <p className="mt-4 border-t border-border pt-3 text-sm font-medium text-text-muted">
                <span className="tabular-nums">{SCENARIOS_PER_CHANNEL}</span> scenarios
                available
              </p>
            </li>
          ))}
        </ul>
      </section>
    </AppLayout>
  )
}
