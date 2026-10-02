import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ClipboardList } from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { AppLayout } from '@/components/layout/AppLayout'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { ASSESSMENT_STATUS } from '@/constants/assessment'
import { ROUTES, resultPath } from '@/constants/routes'
import { useCandidate } from '@/hooks/useCandidate'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { attemptApi } from '@/services/attemptApi'

function formatDate(value) {
  if (!value) return 'Date not recorded'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date not recorded'
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(ms) {
  if (!ms || ms < 0) return null
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.round((ms % 60000) / 1000)
  return minutes > 0 ? `${minutes} min ${seconds} sec` : `${seconds} sec`
}

export function HistoryPage() {
  useDocumentTitle('Assessment History')

  const navigate = useNavigate()
  const { clearSession } = useCandidate()

  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  useEffect(() => {
    const controller = new AbortController()

    attemptApi
      .history({ signal: controller.signal })
      .then((data) => {
        setAssessments(data.attempts ?? [])
        setLoading(false)
      })
      .catch((apiError) => {
        if (apiError.name === 'AbortError') return
        handleApiError(apiError)
        setLoading(false)
      })

    return () => controller.abort()
  }, [handleApiError])

  return (
    <AppLayout>
      <header className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
          Your past assessments
        </h1>
        <p className="mt-2 max-w-2xl text-balance-pretty text-text-muted sm:text-lg">
          Every assessment you finish is kept here so you can see how often you have
          practised.
        </p>
      </header>

      {error && (
        <Alert variant="danger" className="mt-6">
          {error}
        </Alert>
      )}

      {loading ? (
        <Card className="mt-6 flex items-center gap-3 sm:mt-8">
          <Spinner size={20} label="Loading your history" />
          <span className="text-text-muted">Loading your past assessments...</span>
        </Card>
      ) : assessments.length === 0 ? (
        <Card className="mt-6 animate-fade-up text-center sm:mt-8">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-secondary-soft text-text-muted">
            <ClipboardList size={26} aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-bold sm:text-xl">No finished assessments yet</h2>
          <p className="mx-auto mt-2 max-w-md text-balance-pretty text-text-muted">
            Once you complete an assessment it will appear here. An assessment you are
            part way through stays on the dashboard until you finish it.
          </p>
          <Button className="mt-6" onClick={() => navigate(ROUTES.DASHBOARD)}>
            Go to Dashboard
          </Button>
        </Card>
      ) : (
        <ul className="mt-6 space-y-4 sm:mt-8">
          {assessments.map((item, index) => {
            const duration = formatDuration(
              new Date(item.completed_at) - new Date(item.started_at),
            )

            return (
              <li key={item.attempt_id}>
                <Card
                  className="animate-fade-up p-5 sm:p-6"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                    <div className="min-w-0">
                      <h2 className="font-bold">{formatDate(item.completed_at)}</h2>
                      <p className="mt-0.5 text-sm text-text-muted">
                        <span className="tabular-nums">{item.total_scenarios ?? 0}</span>{' '}
                        scenarios
                        {duration ? ` · ${duration}` : ''}
                      </p>
                    </div>
                    <StatusBadge status={ASSESSMENT_STATUS.COMPLETED} />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                    <p className="text-sm text-text-muted">
                      Score{' '}
                      <span className="text-lg font-bold tabular-nums text-text">
                        {item.total_score ?? '–'}
                      </span>{' '}
                      / 100
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => navigate(resultPath(item.attempt_id))}
                    >
                      View result
                      <ArrowRight size={18} aria-hidden="true" />
                    </Button>
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <Button
        variant="outline"
        className="mt-8"
        onClick={() => navigate(ROUTES.DASHBOARD)}
      >
        <ArrowLeft size={18} aria-hidden="true" />
        Back to Dashboard
      </Button>
    </AppLayout>
  )
}
