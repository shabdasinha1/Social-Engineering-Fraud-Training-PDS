import { CircleCheckBig } from 'lucide-react'
import { FeedbackDetails } from '@/components/result/ScenarioResultCard'
import { Button } from '@/components/ui/Button'

/**
 * The end of one scenario (stage 6).
 *
 * The candidate-safe contract releases only what the engine committed: the final action
 * and, once the run resolves, the scenario's points. Nothing is invented here.
 *
 * ADM-007: when the instructor's feedback timing for this mode is `immediate`, the server
 * also sends the scenario's authored feedback card with the resolving response, and it is
 * shown below. With `on_completion` it is absent and waits for the result screen.
 *
 * Points appear only in training mode. Section 3 of the specification hides the running
 * score in assessment mode, so `scoreVisible` - not the payload - decides.
 */

const OUTCOME_LABELS = {
  resolve_report: 'You reported it.',
  resolve_block: 'You blocked the sender.',
  resolve_continue: 'You carried on with the request.',
  resolve_retain: 'You kept it, with no further action.',
  resolve_ignore: 'You ignored it.',
}

export function ScenarioOutcome({ resolution, ordinal, total, scoreVisible, onContinue, busy }) {
  const last = ordinal >= total

  return (
    <section
      aria-labelledby="scenario-outcome"
      className="rounded-lg border border-border bg-card p-5 shadow-sm"
    >
      <span
        aria-hidden="true"
        className="grid size-11 place-items-center rounded-full bg-success-soft text-success"
      >
        <CircleCheckBig size={22} />
      </span>

      <h2 id="scenario-outcome" className="mt-3 text-lg font-bold">
        Scenario <span className="tabular-nums">{ordinal}</span> recorded
      </h2>

      <p className="mt-1 text-balance-pretty text-text-muted" role="status">
        {OUTCOME_LABELS[resolution?.outcome_code] ?? 'Your final action was recorded.'}
      </p>

      {scoreVisible && resolution?.score_0_10 !== null && (
        <p className="mt-3 font-semibold">
          <span className="tabular-nums">{resolution.score_0_10}</span> out of{' '}
          <span className="tabular-nums">10</span> for this scenario
        </p>
      )}

      {resolution?.feedback && (
        <div
          aria-labelledby="scenario-feedback"
          role="region"
          className="mt-4 rounded-md border border-border bg-surface p-4"
        >
          <h3 id="scenario-feedback" className="mb-3 text-sm font-bold">
            Feedback on this scenario
          </h3>
          <FeedbackDetails feedback={resolution.feedback} />
        </div>
      )}

      <Button className="mt-5" fullWidth loading={busy} onClick={onContinue}>
        {last ? 'Finish and see results' : 'Continue to the next scenario'}
      </Button>
    </section>
  )
}
