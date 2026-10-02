import { MAX_TOASTS } from '@/constants/simulation'

/**
 * The stacked toast tray (UI-004, client specification section 3).
 *
 * "Queue at most three. Clicking a toast deep-links to its scenario; dismiss logs an
 * event but does not remove the required scenario."
 *
 * The cap is applied here as well as in `trayFor`, because a tray that silently grew
 * past three would be a specification breach that no single caller owns. Deep-linking is
 * the notification's own open control, the same one the badged tile submits - the toast is
 * a second route to one scenario, never a second scenario.
 *
 * Nothing in a toast names difficulty, disposition or attack family: an entry carries the
 * app it arrived in, the synthetic sender, the synthetic body and the synthetic time.
 */
export function NotificationTray({ items, busy, onOpen, onDismiss }) {
  const visible = items.slice(0, MAX_TOASTS)
  if (visible.length === 0) return null

  return (
    <ul
      aria-label="Notifications"
      className="space-y-2"
      data-testid="notification-tray"
    >
      {visible.map((item) => (
        <li key={item.id}>
          <div className="animate-notify-in rounded-2xl bg-white/95 p-3 shadow-lg ring-1 ring-black/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-[0.65rem] font-semibold tracking-wide text-text-muted uppercase">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
              {item.appLabel}
              {item.receivedAt && (
                <span className="ml-auto tabular-nums normal-case">{item.receivedAt}</span>
              )}
            </div>

            <p className="mt-1 truncate text-sm font-bold">{item.sender}</p>
            <p className="mt-0.5 text-[0.8rem] leading-snug text-balance-pretty text-text">
              {item.body}
            </p>

            <div className="mt-2.5 flex gap-2">
              <button
                type="button"
                onClick={onOpen}
                disabled={busy}
                aria-label={`Open ${item.sender}, in ${item.appLabel}`}
                className="min-h-11 flex-1 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-contrast transition-transform duration-100 active:scale-[0.98] disabled:opacity-55"
              >
                Open
              </button>
              <button
                type="button"
                onClick={onDismiss}
                disabled={busy}
                aria-label={`Dismiss ${item.sender}, in ${item.appLabel}`}
                className="min-h-11 flex-1 rounded-xl bg-secondary-soft px-4 text-sm font-semibold text-secondary transition-transform duration-100 active:scale-[0.98] disabled:opacity-55"
              >
                Dismiss
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
