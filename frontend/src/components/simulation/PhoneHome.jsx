import { useState } from 'react'
import { AppSurface } from '@/components/simulation/AppSurfaces'
import { NotificationTray } from '@/components/simulation/NotificationTray'
import { CHANNELS } from '@/constants/channels'
import { TILE_STATUS } from '@/state/dashboardOrchestrator'
import { cn } from '@/utils/cn'

/**
 * The device home screen: the app grid and the notification tray (UI-002, UI-004).
 *
 * This is section 3's "persistent simulated communication hub", drawn on the device where
 * the specification puts it. It is presentation only. It holds no attempt state, no stage
 * and no timer - `dashboardOrchestrator` computes the tiles and the tray from the run the
 * server issued, and this renders them, which is what makes "badge count, toast preview
 * and app list must all reflect the same scenario state" structurally true rather than a
 * thing three components have to remember separately.
 *
 * The engine semantics are untouched. Opening the toast or the tile that carries activity
 * submits the notification's open control; dismissing submits its dismiss control, and the scenario stays in the attempt
 * with its badge intact. Opening any other app is local navigation that submits nothing
 * and shows a benign, empty inbox - and while activity is still queued, NO app carries a
 * badge, so the hub cannot be used to find out where the next item will land before it
 * lands.
 */

/**
 * One app tile: icon, unread badge, status dot and last-event preview.
 *
 * All four tiles are built from this one component with the same geometry, so no platform
 * can become visually dominant - the only difference between an active and a quiet tile is
 * the badge, the dot and the preview line, which section 3 asks for by name.
 *
 * The status is never conveyed by the dot alone. Each tile carries a screen-reader word
 * for its state, and the unread count is in the button's accessible name.
 */
function AppTile({ tile, busy, onSelect }) {
  const { label, icon: Icon, unread, status, preview } = tile
  const active = status === TILE_STATUS.ACTIVITY

  return (
    <li className="flex min-w-0 flex-col items-center gap-1.5">
      <button
        type="button"
        disabled={busy}
        onClick={onSelect}
        aria-label={unread ? `Open ${label}, ${unread} unread item` : `Open ${label}`}
        data-status={status}
        className={cn(
          'relative grid size-14 place-items-center rounded-[1.1rem] bg-white/95 text-primary',
          'shadow-md ring-1 ring-black/5 transition-transform duration-100',
          'active:scale-95 disabled:opacity-55',
        )}
      >
        <Icon size={26} aria-hidden="true" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-danger text-[0.6rem] font-bold text-white tabular-nums ring-2 ring-white/90"
          >
            {unread}
          </span>
        )}
      </button>

      <span className="flex max-w-full items-center gap-1">
        <span
          aria-hidden="true"
          className={cn(
            'size-1.5 shrink-0 rounded-full',
            active ? 'bg-white' : 'bg-white/35',
          )}
        />
        <span className="max-w-full truncate text-[0.65rem] font-medium text-white/90">
          {label}
        </span>
      </span>

      <span className="sr-only">{active ? 'New activity' : 'Nothing new'}</span>
      <span
        className="line-clamp-2 max-w-full text-center text-[0.58rem] leading-tight text-white/60"
        aria-hidden="true"
      >
        {preview}
      </span>
    </li>
  )
}

export function PhoneHome({ tiles, tray, onOpen, onDismiss, dismissed, busy }) {
  const [openedApp, setOpenedApp] = useState(null)

  const grid = tiles ?? CHANNELS.map(({ key, label, icon }) => ({
    key,
    label,
    icon,
    unread: 0,
    status: TILE_STATUS.QUIET,
    preview: 'No new items',
  }))

  if (openedApp) {
    const label = grid.find((tile) => tile.key === openedApp)?.label ?? openedApp
    return (
      <AppSurface
        platform={openedApp}
        label={label}
        onBack={() => setOpenedApp(null)}
      />
    )
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#243044] to-[#38506e] px-4 pb-3 pt-2">
      <h2 className="sr-only">Your apps</h2>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <ul className="grid grid-cols-4 gap-x-3 gap-y-4 pt-2">
          {grid.map((tile) => (
            <AppTile
              key={tile.key}
              tile={tile}
              busy={busy}
              /**
               * The tile carrying activity is the deep link into the scenario; every other
               * tile is local navigation only. Deriving this from the tile's own state - not
               * from the scenario's platform - is what keeps a queued item invisible: before
               * delivery no tile has activity, so no tile opens anything.
               */
              onSelect={() =>
                (tile.unread > 0 ? onOpen?.() : setOpenedApp(tile.key))}
            />
          ))}
        </ul>
      </div>

      <div className="mt-3 space-y-2">
        <NotificationTray items={tray ?? []} busy={busy} onOpen={onOpen} onDismiss={onDismiss} />

        {dismissed && (
          <p
            role="status"
            className="rounded-xl bg-black/25 px-3 py-2 text-center text-[0.72rem] text-white/90"
          >
            Alert dismissed. The item is still waiting in{' '}
            {grid.find((tile) => tile.unread > 0)?.label ?? 'your apps'}.
          </p>
        )}
      </div>
    </div>
  )
}
