import { RotateCw } from 'lucide-react'
import { ACTIVITY } from '@/state/dashboardOrchestrator'

/**
 * The orchestrator status line (UI-004, client specification section 3).
 *
 * "Display 'New activity will arrive shortly' and a Resume button after interruption. Do
 * not reveal difficulty, malicious/legitimate label or attack family."
 *
 * Two things share this row because section 3 puts them in one zone: the queue window,
 * and the fact that an attempt was picked back up. It sits beside the device rather than
 * on it, because the interruption notice has to be reachable from every stage - a learner
 * who reloads at the branch stage is looking at the app, not the home screen.
 *
 * Neither message ever names the app, the sender, or anything about the item that is
 * coming. The whole point of the queue state is that the learner knows something is on
 * its way and nothing else.
 */
export function QueueStatus({ state, interrupted, onResume, busy }) {
  const queued = state === ACTIVITY.QUEUED
  if (!queued && !interrupted) return null

  return (
    <div className="space-y-3">
      {queued && (
        <p
          role="status"
          data-testid="queue-status"
          className="flex items-center gap-2.5 rounded-md border border-dashed border-border-strong p-3.5 text-sm text-text-muted"
        >
          <span className="flex shrink-0 gap-1" aria-hidden="true">
            <span className="size-1.5 animate-pulse rounded-full bg-text-muted/80" />
            <span className="size-1.5 animate-pulse rounded-full bg-text-muted/55" />
            <span className="size-1.5 animate-pulse rounded-full bg-text-muted/30" />
          </span>
          New activity will arrive shortly
        </p>
      )}

      {interrupted && (
        <div
          data-testid="resume-status"
          className="rounded-md border border-info/25 bg-info-soft p-3.5 text-sm text-info"
        >
          <p role="status" className="text-balance-pretty">
            This assessment was interrupted. Your place was kept, and nothing you have
            already done was lost.
          </p>
          <button
            type="button"
            onClick={onResume}
            disabled={busy}
            className="mt-2.5 inline-flex min-h-11 items-center gap-2 rounded-md bg-info px-4 text-sm font-semibold text-white disabled:opacity-55"
          >
            <RotateCw size={15} aria-hidden="true" />
            Resume
          </button>
        </div>
      )}
    </div>
  )
}
