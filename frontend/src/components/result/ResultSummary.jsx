import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react'
import { COMPARISON_REASONS, OUTCOME_CLASS, label } from '@/constants/result'
import { cn } from '@/utils/cn'

/**
 * The headline score, the outcome mix and the attempt comparison (UI-003).
 *
 * Every number here is read straight from the RESULT-001 payload. Nothing is summed,
 * classified or inferred on the client - the server already decided what counts as a
 * missed threat and what counts as a false positive, and this only renders it.
 */

const TONES = {
  success: 'border-success/30 bg-success-soft text-success',
  warning: 'border-warning/30 bg-warning-soft text-warning',
  danger: 'border-danger/30 bg-danger-soft text-danger',
  /** IMMERSIVE-001: not reached in time is not an error, so it carries no alarm colour. */
  neutral: 'border-border bg-secondary-soft text-text-muted',
}

/** One outcome count. Meaning is carried by the label, never by the colour alone. */
function OutcomeTile({ classKey, count }) {
  const meta = OUTCOME_CLASS[classKey]
  if (!meta) return null

  return (
    <li className={cn('rounded-md border p-3.5', TONES[meta.tone])}>
      <p className="text-2xl font-bold tabular-nums">{count}</p>
      <p className="mt-0.5 text-sm font-semibold">{meta.label}</p>
      <p className="mt-1 text-xs leading-snug text-balance-pretty opacity-90">
        {meta.description}
      </p>
    </li>
  )
}

function Comparison({ comparison }) {
  if (!comparison) return null

  if (!comparison.available) {
    return (
      <p className="mt-4 rounded-md border border-border bg-secondary-soft p-3 text-sm text-text-muted">
        {label(COMPARISON_REASONS, comparison.reason, 'No comparable previous attempt.')}
      </p>
    )
  }

  const { delta } = comparison
  const Icon = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : ArrowRight
  const word = delta > 0 ? 'higher than' : delta < 0 ? 'lower than' : 'the same as'

  return (
    <p className="mt-4 flex items-center gap-2 rounded-md border border-border bg-secondary-soft p-3 text-sm">
      <Icon size={16} aria-hidden="true" className="shrink-0 text-text-muted" />
      <span>
        <span className="font-semibold tabular-nums">
          {delta > 0 ? '+' : ''}
          {delta}
        </span>{' '}
        {word} your previous comparable attempt
        <span className="text-text-muted">
          {' '}
          (<span className="tabular-nums">{comparison.previous_total_score}</span>/100)
        </span>
        .
      </span>
    </p>
  )
}

/**
 * Section 7's exposure count, beside the trend it is named with (PROGRESS-001, gap G2).
 *
 * "Exposure" here is the number of assessments the learner has COMPLETED - the
 * `attempt_count` the section 6 entity names, and the figure the acceptance matrix asks for
 * in row 7.5. It is deliberately not a count of scenarios by family, difficulty or
 * disposition: those would tell the learner what the bank contains.
 *
 * Omitted entirely when the snapshot could not be fetched, rather than showing a zero that
 * would be wrong.
 */
function ExposureCount({ progress }) {
  if (!progress) return null

  const { attempt_count: attempts, best_score: best, max_score: max } = progress

  return (
    <p className="mt-2 text-sm text-text-muted">
      <span className="tabular-nums font-semibold text-text">{attempts}</span>{' '}
      {attempts === 1 ? 'assessment' : 'assessments'} completed so far
      {typeof best === 'number' && (
        <>
          {' · best '}
          <span className="tabular-nums font-semibold text-text">
            {best}/{max}
          </span>
        </>
      )}
      {progress.mixed_versions && (
        <span className="block text-xs">
          Your assessments were not all built from the same scenario content, so your best
          score is not a like-for-like comparison.
        </span>
      )}
    </p>
  )
}

export function ResultSummary({ result, progress = null }) {
  const { summary, comparison } = result
  const counts = [
    ['handled_safely', summary.handled_safely],
    ['missed_threat', summary.missed_threats],
    ['false_positive', summary.false_positives],
    ['unsafe_handling', summary.unsafe_handling],
  ]
  /**
   * IMMERSIVE-001. Shown only when it happened, so an ordinary result is unchanged.
   *
   * A fifth tile rather than folding these into an existing count: a scenario the clock
   * closed is not a missed threat and is certainly not a false positive, and saying so
   * plainly is what C2's "do not fabricate a decision" means on screen.
   */
  if (result.timed_out && summary.not_resolved > 0) {
    counts.push(['not_resolved', summary.not_resolved])
  }
  /** ENHANCEMENT-003. The server sends `skipped` only when the Demo User skipped something. */
  if (summary.skipped > 0) {
    counts.push(['demo_skipped', summary.skipped])
  }

  return (
    <section aria-labelledby="result-headline" className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
      <p className="text-[0.68rem] font-bold tracking-[0.09em] text-text-muted uppercase">
        Assessment result
      </p>

      {/*
        Factual and blame-free, per section 5's interpretation safeguard: it states what
        happened to the ASSESSMENT and infers nothing about the learner.
      */}
      {result.timed_out && (
        <p
          role="status"
          className="mt-3 rounded-md border border-warning/40 bg-warning-soft px-3.5 py-2.5 text-sm text-warning"
          data-testid="timeout-notice"
        >
          <span className="font-semibold">This assessment ended when the time limit was
            reached.</span>{' '}
          The allowed time was{' '}
          <span className="tabular-nums font-semibold">
            {Math.round((result.time_limit_ms ?? 0) / 60000)}
          </span>{' '}
          minutes.{' '}
          {result.unresolved_at_expiry > 0 ? (
            <>
              <span className="tabular-nums font-semibold">{result.unresolved_at_expiry}</span>
              {result.unresolved_at_expiry === 1
                ? ' scenario was not completed before time ran out. '
                : ' scenarios were not completed before time ran out. '}
              Everything you did complete has been scored.
            </>
          ) : (
            'Every scenario had been completed by then.'
          )}
        </p>
      )}

      <h1 id="result-headline" className="mt-1 flex items-baseline gap-2">
        <span className="text-5xl font-bold tabular-nums sm:text-6xl">{summary.total_score}</span>
        <span className="text-2xl font-semibold text-text-muted">/ {summary.max_score}</span>
      </h1>

      <p className="mt-1 text-text-muted">
        <span className="tabular-nums">{result.scenarios_resolved}</span> of{' '}
        <span className="tabular-nums">{result.scenarios_total}</span> scenarios resolved
      </p>

      <ExposureCount progress={progress} />

      <Comparison comparison={comparison} />

      <h2 className="mt-7 text-base font-bold">How your decisions landed</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {counts.map(([key, count]) => (
          <OutcomeTile key={key} classKey={key} count={count} />
        ))}
      </ul>
    </section>
  )
}
