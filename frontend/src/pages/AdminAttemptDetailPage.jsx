import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronRight, CircleDashed, Gauge, GitCompare, Layers, ListOrdered, Target } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { BehaviourBreakdown } from '@/components/result/BehaviourBreakdown'
import { PathReplay } from '@/components/result/PathReplay'
import { AttemptControls } from '@/components/admin/AttemptControls'
import { AttemptExportPanel } from '@/components/admin/AttemptExportPanel'
import {
  ErrorState,
  Field,
  LoadingState,
  PageHeading,
  Pill,
  SectionCard,
  TableScroll,
  Td,
  Th,
} from '@/components/admin/AdminPrimitives'
import { enter, rowClass, staggerStyle } from '@/components/admin/adminUi'
import {
  ATTEMPT_STATUS,
  DISPOSITION_LABELS,
  LEVEL_LABELS,
  MODE_LABELS,
  PLATFORM_LABELS,
  UNAVAILABLE_REASONS,
  formatDateTime,
  formatDuration,
  label,
} from '@/constants/admin'
import { OUTCOME_CLASS, OUTCOME_CODE_LABELS } from '@/constants/result'
import { ROUTES } from '@/constants/routes'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { adminApi } from '@/services/adminApi'
import { cn } from '@/utils/cn'

/**
 * One attempt, as the instructor sees it (ADMIN-002, ADMIN-006).
 *
 * ### This screen calculates nothing
 *
 * Every number on it — the total, each scenario score, each outcome class, every
 * breakdown bucket, the remediation families and the comparison — arrives already decided
 * by the server, from the same authoritative result the learner is shown. The behaviour
 * breakdown and the path replay reuse the learner result components unchanged, because the
 * payload shape is the same one.
 *
 * ### An unfinished attempt says so
 *
 * `result_available` is the server's own flag. When it is false there is **no total
 * score**: the resolved points are shown under their own name, unresolved scenarios are
 * listed as pending with no score and no disposition, and remediation and comparison carry
 * the server's stable unavailable reason. Nothing is filled in.
 *
 * ### Privacy
 *
 * There is no raw event viewer, and there is nothing to build one from: the payload
 * carries no event id, event code, point delta, metadata, intent key, seed or frozen
 * sequence, and no typed learner rationale. The path replay is the compact
 * `{step, stage, action}` projection and nothing more.
 */

function ScenarioCard({ scenario }) {
  if (!scenario.resolved) {
    return (
      <li className="rounded-md border border-dashed border-border bg-surface p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <CircleDashed size={16} className="text-text-muted" aria-hidden="true" />
          <span className="font-semibold">
            {scenario.ordinal}. {label(PLATFORM_LABELS, scenario.platform)} · {scenario.scenario_ref}
          </span>
          <Pill>Not resolved</Pill>
        </div>
        <p className="mt-1.5 text-sm text-balance-pretty text-text-muted">
          Reached the <strong>{scenario.current_stage}</strong> stage. No score, outcome,
          classification or feedback is reported for a scenario the learner has not finished.
        </p>
      </li>
    )
  }

  const outcome = OUTCOME_CLASS[scenario.outcome_class]

  /**
   * ENHANCEMENT-001B: each finished scenario is a native <details>, so the ten cards read
   * as a scannable list of outcomes and scores and open one at a time on demand. Closed
   * content stays in the document, so nothing is hidden from assistive technology or print.
   */
  return (
    <li className="rounded-md border border-border bg-surface transition-colors duration-200 hover:border-border-strong">
      <details className="group/scenario">
      <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md px-3.5 py-2.5 marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        <span className="flex min-w-0 items-center gap-2">
          <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-text-muted transition-transform duration-200 group-open/scenario:rotate-90" />
          <span className="min-w-0">
            <span className="block font-semibold">
              {scenario.ordinal}. {scenario.platform_label} · {scenario.scenario_ref}
            </span>
            <span className="block truncate text-sm text-text-muted">
              {[scenario.sender, scenario.preview].filter(Boolean).join(' — ') || 'No preview recorded'}
            </span>
          </span>
        </span>
        <span className="flex flex-wrap items-center gap-2 pl-6 sm:pl-0">
          <Pill
            tone={
              outcome?.tone === 'success'
                ? 'bg-success-soft text-success ring-success/25'
                : outcome?.tone === 'danger'
                  ? 'bg-danger-soft text-danger ring-danger/25'
                  : 'bg-warning-soft text-warning ring-warning/25'
            }
          >
            {outcome?.label ?? scenario.outcome_class}
          </Pill>
          <span className="text-sm font-bold tabular-nums">
            {scenario.score_0_10}
            <span className="font-normal text-text-muted">/{scenario.max_score}</span>
          </span>
        </span>
      </summary>

      <div className="border-t border-border px-3.5 pb-3.5 pt-3">
      <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-3 xl:grid-cols-6">
        <Field label="What it was">{label(DISPOSITION_LABELS, scenario.disposition)}</Field>
        <Field label="Difficulty">{label(LEVEL_LABELS, scenario.level, '—')}</Field>
        <Field label="Military context">
          {scenario.military_flag == null ? '—' : scenario.military_flag ? 'Yes' : 'No'}
        </Field>
        <Field label="Case family">{scenario.family_label}</Field>
        <Field label="Triggers">{scenario.trigger_labels?.join(', ') || '—'}</Field>
        <Field label="Final action">
          {label(OUTCOME_CODE_LABELS, scenario.outcome_code)}
        </Field>
      </dl>

      <div className="mt-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Decision path
        </h4>
        <PathReplay path={scenario.path} className="mt-2 space-y-1.5" />
      </div>

      {scenario.feedback?.result && (
        <div className="mt-3 rounded-md bg-secondary-soft/50 p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Feedback the learner receives
          </h4>
          <p className="mt-1 text-sm">{scenario.feedback.result}</p>
          {scenario.feedback.safe_action && (
            <p className="mt-1.5 text-sm text-text-muted">
              <strong className="text-text">Safe response:</strong> {scenario.feedback.safe_action}
            </p>
          )}
        </div>
      )}
      </div>
      </details>
    </li>
  )
}

/** Opens or closes every scenario card at once. */
function ExpandAll({ listRef }) {
  const [open, setOpen] = useState(false)
  const toggle = () => {
    const next = !open
    listRef.current?.querySelectorAll('details').forEach((element) => { element.open = next })
    setOpen(next)
  }
  return (
    <Button variant="ghost" size="sm" className="min-h-11" onClick={toggle} aria-expanded={open}>
      {open ? 'Collapse all' : 'Expand all'}
    </Button>
  )
}

export function AdminAttemptDetailPage() {
  const { attemptId } = useParams()
  useDocumentTitle('Attempt')

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const scenarioList = useRef(null)

  const load = useCallback((signal) => {
    /**
     * No state is set synchronously here: an effect that calls setState on the way in
     * starts a second render before the request has even left. `loading` starts true and
     * is cleared by whichever branch settles; a refetch raises it from the event that
     * caused it.
     */
    return adminApi
      .getAttempt(attemptId, { signal })
      .then((result) => {
        setData(result)
        setError(null)
        setLoading(false)
      })
      .catch((requestError) => {
        if (requestError.name === 'AbortError') return
        setError(requestError)
        setLoading(false)
      })
  }, [attemptId])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  if (loading) return <LoadingState label="Loading attempt" />
  if (error) return <ErrorState error={error} onRetry={() => { setLoading(true); load() }} />
  if (!data) return null

  const { attempt, summary, platform_coverage: coverage, scenarios, behaviour,
    behaviour_scope: scope, remediation, comparison } = data
  const status = ATTEMPT_STATUS[attempt.status]

  return (
    <div className="space-y-section">
      <Link
        to={ROUTES.ADMIN_ATTEMPTS}
        className="-mb-2 -mt-1 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        All attempts
      </Link>

      <PageHeading
        eyebrow="Attempt viewer"
        title={attempt.profile?.display_name ?? 'Attempt'}
        description={`Service number ${attempt.profile?.service_no_masked ?? '—'}${attempt.mode === 'assessment' ? '' : ` · ${label(MODE_LABELS, attempt.mode)} mode`}`}
      >
        <Pill tone={status?.tone}>{status?.label ?? attempt.status}</Pill>
      </PageHeading>

      {/* --- headline + coverage, side by side on a wide screen ------- */}
      <div className="grid items-start gap-grid xl:grid-cols-3">
      <SectionCard title="Result" icon={Gauge} className={cn('xl:col-span-2', enter)} style={staggerStyle(1)}>
        {attempt.result_available ? (
          <p className="text-3xl font-bold">
            {attempt.total_score}
            <span className="text-lg font-normal text-text-muted"> / {attempt.max_score}</span>
          </p>
        ) : (
          <>
            <p className="text-lg font-bold">No total score</p>
            <p className="mt-1 text-sm text-balance-pretty text-text-muted">
              This attempt is not complete, so there is no 0–100 total. The points already
              earned are shown separately and are not a final score.
            </p>
          </>
        )}

        <dl className="mt-3 grid gap-x-4 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-4">
          <Field label="Scenarios resolved">
            {attempt.scenarios_resolved} of {attempt.scenarios_total}
          </Field>
          {!attempt.result_available && (
            <Field label="Points from resolved">{attempt.resolved_points}</Field>
          )}
          <Field label="Started">{formatDateTime(attempt.started_at)}</Field>
          <Field label="Completed">
            {attempt.completed_at ? formatDateTime(attempt.completed_at) : '—'}
          </Field>
          <Field label="Duration">{formatDuration(attempt.duration_ms)}</Field>
          <Field label="Content version">{attempt.content_version}</Field>
          <Field label="Taxonomy">{attempt.taxonomy_version}</Field>
          <Field label="Trigger taxonomy">{attempt.trigger_taxonomy_version}</Field>
        </dl>

        {summary && (
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-border pt-3 sm:grid-cols-4">
            <Field label="Handled safely">{summary.handled_safely}</Field>
            <Field label="Threats missed">{summary.missed_threats}</Field>
            <Field label="Genuine items rejected">{summary.false_positives}</Field>
            <Field label="Unsafe steps">{summary.unsafe_handling}</Field>
          </dl>
        )}
      </SectionCard>

      {/* --- platform coverage --------------------------------------- */}
      <SectionCard title="Platform coverage" icon={Layers} className={enter} style={staggerStyle(2)}>
        <TableScroll bleed>
          <caption className="sr-only">Scenarios per platform in this attempt</caption>
          <thead>
            <tr>
              <Th>Platform</Th>
              <Th>Scenarios</Th>
              <Th>Resolved</Th>
            </tr>
          </thead>
          <tbody>
            {coverage.map((row) => (
              <tr key={row.platform} className={rowClass}>
                <Td>{row.label}</Td>
                <Td>{row.scenarios}</Td>
                <Td>{row.resolved}</Td>
              </tr>
            ))}
          </tbody>
        </TableScroll>
      </SectionCard>
      </div>

      {/* --- behaviour ------------------------------------------------ */}
      <div>
        {scope?.scope === 'partial' && (
          <Alert variant="warning" className="mb-3">
            This breakdown covers the {scope.scenarios_included} resolved{' '}
            {scope.scenarios_included === 1 ? 'scenario' : 'scenarios'} only, out of{' '}
            {scope.scenarios_total}. It is not a full picture of the attempt.
          </Alert>
        )}
        <BehaviourBreakdown behaviour={behaviour} />
      </div>

      {/* --- scenarios ------------------------------------------------ */}
      <SectionCard
        title="Scenarios"
        icon={ListOrdered}
        description="In the order the learner met them. Open one for its path and feedback."
        action={<ExpandAll listRef={scenarioList} />}
      >
        <ol ref={scenarioList} className="space-y-2">
          {scenarios.map((scenario) => (
            <ScenarioCard key={scenario.ordinal} scenario={scenario} />
          ))}
        </ol>
      </SectionCard>

      {/* --- remediation + comparison ------------------------------------ */}
      <div className="grid items-start gap-grid lg:grid-cols-2">
      <SectionCard
        icon={Target}
        title="Recommended practice"
        description="Weak case families, not individual scenarios — the report carries no answer key."
      >
        {remediation.available && remediation.recommendations.length > 0 ? (
          <ul className="space-y-2">
            {remediation.recommendations.map((item) => (
              <li key={item.family_key} className="rounded-md border border-border px-3 py-2.5">
                <p className="font-semibold">{item.label}</p>
                <p className="mt-0.5 text-sm text-text-muted">{item.reason}</p>
                <p className="mt-1 text-sm">
                  {item.points} of {item.max_points} points · {item.practice_scenarios_available}{' '}
                  practice scenarios available
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-muted">
            {label(UNAVAILABLE_REASONS, remediation.reason,
              'Nothing stood out as needing focused practice from this attempt.')}
          </p>
        )}
      </SectionCard>

      {/* --- comparison ----------------------------------------------- */}
      <SectionCard title="Compared with the previous attempt" icon={GitCompare}>
        {comparison.available ? (
          <dl className="grid gap-3 sm:grid-cols-3">
            <Field label="Previous total">{comparison.previous_total_score}</Field>
            <Field label="Completed">{formatDateTime(comparison.previous_completed_at)}</Field>
            <Field label="Change">
              {comparison.delta > 0 ? `+${comparison.delta}` : comparison.delta}
            </Field>
          </dl>
        ) : (
          <>
            <p className="text-sm text-text-muted">
              {label(UNAVAILABLE_REASONS, comparison.reason, 'No comparison is available.')}
            </p>
            {comparison.incomparable_on?.length > 0 && (
              <p className="mt-1 text-sm text-text-muted">
                Differs on: {comparison.incomparable_on.join(', ')}
              </p>
            )}
          </>
        )}
      </SectionCard>
      </div>

      {/* --- export + instructor controls --------------------------------- */}
      <div className="grid items-start gap-grid lg:grid-cols-2">
        <AttemptExportPanel attemptId={attempt.attempt_id} />
        <AttemptControls attempt={attempt} onChanged={() => load()} />
      </div>
    </div>
  )
}
