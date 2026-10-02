import { Alert } from '@/components/ui/Alert'
import { CONSEQUENCE_TEXT } from '@/constants/simulation'

/**
 * What the learner is told after a branch-stage action (stage 4).
 *
 * The engine returns a consequence as a **rendering instruction** -
 * `{ kind, target, inert: true, executes: false }` - never as an execution. UI-002 moved
 * the rendering of that instruction onto the device, where a browser page or a payment
 * screen belongs; what stays here is the one-line notice that says an action was recorded
 * and points at the screen now showing on the phone.
 *
 * It deliberately does not say whether the action was wise. Assessment mode defers that;
 * the outcome card at the end of the scenario is where feedback belongs.
 */
export function ConsequenceNotice({ consequence }) {
  if (!consequence) return null

  return (
    <Alert variant="info" title="Recorded in this simulation">
      {CONSEQUENCE_TEXT[consequence.kind] ?? 'Your action was recorded in this simulation.'}
    </Alert>
  )
}
