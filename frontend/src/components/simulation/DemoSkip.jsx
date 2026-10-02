import { useEffect, useRef, useState } from 'react'
import { SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/Button'

/**
 * ENHANCEMENT-003: Skip, for the Demo User only.
 *
 * Rendered by the simulation page only when the server marked the attempt `is_demo`. The
 * server independently refuses a skip from anyone else, so leaving this component out is
 * presentation, and never the only thing standing between a normal learner and a skip.
 *
 * Deliberately quieter than the scenario's own decisions: a small ghost button under the
 * decision panel, never in the action list and never on the phone, so it cannot be read as
 * one of the choices being assessed. One short inline confirmation - skipping cannot be
 * undone - and no dialog. It says nothing about the scenario being skipped.
 *
 * The page keys it by run, so every scenario starts unconfirmed.
 */
export function DemoSkip({ ordinal, busy = false, onSkip }) {
  const [confirming, setConfirming] = useState(false)
  const confirmRef = useRef(null)
  const skipRef = useRef(null)
  const wasConfirming = useRef(false)

  useEffect(() => {
    if (confirming) confirmRef.current?.focus()
    else if (wasConfirming.current) skipRef.current?.focus()
    wasConfirming.current = confirming
  }, [confirming])

  return (
    <section
      aria-label="Demonstration controls"
      data-testid="demo-skip"
      className="rounded-lg border border-dashed border-border-strong px-4 py-3"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && confirming) {
          event.stopPropagation()
          setConfirming(false)
        }
      }}
    >
      {confirming ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="min-w-0 flex-1 text-sm text-text-muted" id="demo-skip-confirm">
            Skip scenario <span className="tabular-nums">{ordinal}</span>? No decision is recorded.
          </p>
          <div className="flex gap-2">
            <Button
              ref={confirmRef}
              size="sm"
              variant="outline"
              loading={busy}
              aria-describedby="demo-skip-confirm"
              onClick={onSkip}
            >
              Skip
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="text-xs font-semibold tracking-wide text-text-muted uppercase">
            Demonstration
          </p>
          <Button
            ref={skipRef}
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => setConfirming(true)}
          >
            <SkipForward size={15} aria-hidden="true" />
            Skip this scenario
          </Button>
        </div>
      )}
    </section>
  )
}
