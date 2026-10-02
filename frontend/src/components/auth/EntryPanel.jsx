import { LogIn } from 'lucide-react'
import { PanelFrame } from '@/components/auth/EntryVisuals'
import { cn } from '@/utils/cn'

const TONES = {
  ready: 'bg-entry-ready',
  active: 'bg-console-accent',
  success: 'bg-success',
  danger: 'bg-danger',
}

/**
 * The learner entry panel (ENHANCEMENT-002): the white working surface lifted off the dark
 * canvas, with a thin accent strip along its top edge and a one-line readout of what the
 * screen is doing.
 *
 * The readout is `aria-hidden` on purpose. It restates the screen's real state - awaiting
 * details, checking them, a record found, the store unreachable - which the panel's own
 * heading, alerts and live region already announce. Voicing it too would say everything
 * twice, and a second `role="status"` would compete with the Retry live region.
 *
 * `busy` turns the top strip into an indeterminate progress bar while a request is in
 * flight. It follows the request; it never holds anything up.
 */
export function EntryPanel({ status, busy = false, className, children }) {
  return (
    <div className={cn('relative motion-safe:animate-entry-panel', className)}>
      <PanelFrame />

      <section
        aria-label="Learner entry"
        className="relative overflow-hidden rounded-xl bg-card text-text shadow-entry"
      >
        <div aria-hidden="true" className="relative h-1 overflow-hidden bg-primary">
          <div className="absolute inset-0 bg-linear-to-r from-primary via-console-accent to-primary opacity-80" />
          {busy && (
            <div className="absolute inset-y-0 left-0 w-2/5 bg-linear-to-r from-transparent via-white to-transparent motion-safe:animate-entry-progress motion-reduce:w-full motion-reduce:opacity-40" />
          )}
        </div>

        <div
          aria-hidden="true"
          className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border bg-background/60 px-5 py-2.5 font-mono min-[400px]:px-6 text-[0.66rem] tracking-[0.14em] text-text-muted uppercase sm:px-8"
        >
          {/*
            On a phone the longer readouts ("Existing record found", "Record store
            unreachable") do not fit beside the label, so the readout wraps onto its own line
            rather than squeezing the label onto two lines and cutting itself off.
          */}
          <span className="flex items-center gap-2 whitespace-nowrap">
            <LogIn size={13} className="text-signal" />
            Assessment entry
          </span>
          <span className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                'size-1.5 shrink-0 rounded-full',
                TONES[status.tone],
                (status.tone === 'active' || status.tone === 'ready') &&
                  'motion-safe:animate-entry-pulse',
              )}
            />
            <span className="truncate">{status.label}</span>
          </span>
        </div>

        <div className="p-5 min-[400px]:p-6 sm:p-8">{children}</div>
      </section>
    </div>
  )
}
