import { useCallback, useEffect, useState } from 'react'
import {
  awaitingDelivery,
  deliveryDelayMs,
  wasInterrupted,
} from '@/state/dashboardOrchestrator'

/**
 * The post-idle activity timer (UI-004, client specification section 3).
 *
 * Section 3: "Deliver the next event 1-4 seconds after the dashboard becomes idle."
 *
 * What this hook does and does not do matters more than how it does it:
 *
 *   - it does NOT fetch, create, select or advance anything. The engine has already
 *     materialised all ten runs and issues them by ordinal; this only decides when the
 *     notification for the run the server already gave us appears on the home screen;
 *   - it therefore cannot create a second scenario run, duplicate one, or alter the frozen
 *     sequence, however often it fires;
 *   - it holds nothing authoritative. If the timer never fires - a suspended tab, a killed
 *     process - server state is untouched and a reload re-derives the whole hub.
 *
 * The delay is a pure hash of the run id, so it is deterministic per run and a test can
 * assert the exact millisecond value rather than tolerate a range.
 */
export function useActivityDelivery({ run, interactedThisSession }) {
  const runId = run?.run_id ?? null

  /** The run whose activity has already been presented on the home screen. */
  const [deliveredRunId, setDeliveredRunId] = useState(null)
  /** The run whose interruption notice the learner has cleared with Resume. */
  const [resumedRunId, setResumedRunId] = useState(null)

  const pending = Boolean(runId) && awaitingDelivery(run) && deliveredRunId !== runId

  useEffect(() => {
    if (!pending) return undefined

    // setState happens in the timer callback, never synchronously in this effect.
    const timer = setTimeout(() => setDeliveredRunId(runId), deliveryDelayMs(runId))
    return () => clearTimeout(timer)
  }, [pending, runId])

  /**
   * Section 3's Resume control. It clears the interruption notice; the caller pairs it
   * with a fresh read of the server's current state, because a resumed view must come
   * from the server rather than from whatever this tab still held in memory.
   */
  const resume = useCallback(() => setResumedRunId(runId), [runId])

  /**
   * "After interruption" is derived, not remembered.
   *
   * A run that is already under way can be reached two ways: the learner walked it here
   * in this session, or the learner came back to it. `interactedThisSession` separates
   * them: it is true once the engine has committed a transition for this learner in this
   * tab, and it is false again whenever a run is loaded fresh. A mid-scenario view with no
   * interaction behind it is therefore a return - which is what section 3 means by an
   * interruption.
   */
  const interrupted =
    wasInterrupted(run) && !interactedThisSession && resumedRunId !== runId

  return { delivered: !pending, interrupted, resume }
}
