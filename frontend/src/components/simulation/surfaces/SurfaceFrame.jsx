import { ChevronLeft, Lock } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * The frame every pushed screen shares: a full-height local screen with a Back
 * affordance, clipped to the device.
 *
 * `onBack` is LOCAL navigation. It submits nothing and retracts nothing - the engine has
 * already recorded whatever opened this screen, and leaving it is leaving a page.
 *
 * `tone` picks the chrome the screen belongs to, which is what makes an app switch legible:
 * the messenger's own screens wear the messenger's header, the browser wears browser
 * chrome, and another application wears its own colour.
 */
export function Screen({
  title, subtitle, onBack, backLabel = 'Back', tone = 'light', actions = null,
  children, footer, testId = 'scene-surface', animation = 'animate-screen-in',
}) {
  return (
    <div
      className={cn('flex h-full min-h-0 flex-col bg-background', animation)}
      data-testid={testId}
    >
      <div
        className={cn(
          'flex shrink-0 items-center gap-1 px-1.5 py-2',
          tone === 'wa' && 'bg-wa-header text-white',
          tone === 'wallet' && 'bg-app-wallet text-white',
          tone === 'browser' && 'border-b border-border bg-browser-bar',
          tone === 'light' && 'border-b border-border bg-surface',
          tone === 'mail' && 'border-b border-mail-border bg-mail-surface',
        )}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className={cn(
            'flex min-h-11 items-center gap-0.5 rounded-full pr-3 pl-1.5 text-sm font-semibold',
            tone === 'wa' || tone === 'wallet'
              ? 'text-white hover:bg-white/15'
              : 'text-primary hover:bg-primary-soft',
          )}
        >
          <ChevronLeft size={20} aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Back</span>
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{title}</p>
          {subtitle && (
            <p
              className={cn(
                'truncate text-[0.68rem]',
                tone === 'wa' || tone === 'wallet' ? 'text-white/75' : 'text-text-muted',
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
        {actions}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>

      {footer}
    </div>
  )
}

/**
 * The one line of product voice allowed inside a pushed screen.
 *
 * It says what the screen IS - a local, inert simulation - and never what the scenario is.
 * Deliberately not attached to individual form fields: the specification asks for a
 * believable application, and a warning wrapped around every input is the opposite of one.
 */
export function InertNote({ children }) {
  return (
    <p className="flex items-center gap-1.5 border-t border-border bg-secondary-soft px-3.5 py-2 text-[0.68rem] font-medium text-text-muted">
      <Lock size={12} aria-hidden="true" className="shrink-0" />
      {children}
    </p>
  )
}

/** A labelled key/value list, used by contact, group, app and browser screens alike. */
export function DetailRows({ rows = [] }) {
  return (
    <dl className="divide-y divide-border">
      {/*
        Keyed by position: labels are not unique (W01's account log lists two events at
        "Today, 11:32"), and an authored row list never reorders.
      */}
      {rows.map((row, index) => (
        <div key={index} className="flex flex-wrap gap-x-3 px-3.5 py-2">
          <dt className="w-32 shrink-0 text-[0.78rem] font-semibold text-text-muted">{row.label}</dt>
          <dd className="min-w-0 flex-1 text-[0.82rem] break-words">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}
