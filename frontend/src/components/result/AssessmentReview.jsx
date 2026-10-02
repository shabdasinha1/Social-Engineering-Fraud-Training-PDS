import {
  CircleAlert,
  CircleCheckBig,
  Clock,
  ShieldAlert,
  ShieldCheck,
  SkipForward,
  TriangleAlert,
} from 'lucide-react'

/**
 * The head of the learning review (REVIEW-001).
 *
 * The counts that frame everything below it: how many scenarios were handled correctly,
 * how many carried a mistake, and how those mistakes split between missing a threat and
 * rejecting something genuine.
 *
 * Every figure arrives in `result.review_summary`, counted server-side from the same
 * entries the cards below are built from - so the number at the top and the cards under it
 * cannot disagree. Nothing is summed here, and this is deliberately NOT a second score:
 * the score is the engine's, stated once at the top of the page, and this explains how it
 * was arrived at.
 *
 * A tile is omitted when its count is zero and it would only be noise - a learner with no
 * false positives is not told "false positives: 0" four different ways. The two that
 * always show are the ones that frame the attempt: correct decisions, and mistakes.
 */

const TILES = [
  {
    key: 'correct_decisions',
    label: 'Correct decisions',
    icon: ShieldCheck,
    tone: 'border-success/30 bg-success-soft text-success',
    always: true,
  },
  {
    key: 'scenarios_with_mistakes',
    label: 'Scenarios with mistakes',
    icon: CircleAlert,
    tone: 'border-danger/30 bg-danger-soft text-danger',
    always: true,
  },
  {
    key: 'missed_threats',
    label: 'Missed threats',
    icon: ShieldAlert,
    tone: 'border-danger/30 bg-danger-soft text-danger',
  },
  {
    key: 'false_positives',
    label: 'Genuine items rejected',
    icon: TriangleAlert,
    tone: 'border-warning/30 bg-warning-soft text-warning',
  },
  {
    key: 'unsafe_handling',
    label: 'Unsafe steps taken',
    icon: TriangleAlert,
    tone: 'border-warning/30 bg-warning-soft text-warning',
  },
  {
    key: 'verification_successes',
    label: 'Verified independently',
    icon: CircleCheckBig,
    tone: 'border-border bg-secondary-soft text-text-muted',
    always: true,
  },
  {
    key: 'not_resolved',
    label: 'Not reached in time',
    icon: Clock,
    tone: 'border-border bg-secondary-soft text-text-muted',
  },
  /** ENHANCEMENT-003. Sent, and so shown, only when the Demo User skipped something. */
  {
    key: 'skipped',
    label: 'Skipped (Demo)',
    icon: SkipForward,
    tone: 'border-border bg-secondary-soft text-text-muted',
  },
]

export function AssessmentReview({ summary }) {
  if (!summary) return null

  const tiles = TILES.filter((tile) => tile.always || summary[tile.key] > 0)

  return (
    <section
      aria-labelledby="review-heading"
      data-testid="assessment-review"
      className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      <h2 id="review-heading" className="text-lg font-bold">
        Assessment review
      </h2>
      <p className="mt-1 text-sm text-balance-pretty text-text-muted">
        <span className="tabular-nums font-semibold text-text">{summary.scenarios}</span>{' '}
        {summary.scenarios === 1 ? 'scenario' : 'scenarios'} completed. Below, each one in the
        order you met it: what you did, what was wrong with it, and what the correct action
        was.
      </p>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => {
          const Icon = tile.icon
          return (
            <li
              key={tile.key}
              data-testid={`review-count-${tile.key}`}
              className={`flex items-center gap-3 rounded-md border p-3.5 ${tile.tone}`}
            >
              <Icon size={20} aria-hidden="true" className="shrink-0" />
              <span className="min-w-0">
                <span className="block text-xl font-bold tabular-nums leading-none">
                  {summary[tile.key] ?? 0}
                </span>
                <span className="mt-1 block text-xs font-semibold leading-snug">{tile.label}</span>
              </span>
            </li>
          )
        })}
      </ul>

      {summary.mistakes > 0 && (
        <p className="mt-4 text-sm text-text-muted">
          <span className="tabular-nums font-semibold text-text">{summary.mistakes}</span>{' '}
          {summary.mistakes === 1 ? 'individual mistake was' : 'individual mistakes were'} recorded
          across{' '}
          <span className="tabular-nums font-semibold text-text">
            {summary.scenarios_with_mistakes}
          </span>{' '}
          {summary.scenarios_with_mistakes === 1 ? 'scenario' : 'scenarios'}.
        </p>
      )}
    </section>
  )
}
