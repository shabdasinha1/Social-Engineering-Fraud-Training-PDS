import { useEffect, useState } from 'react'
import { BatteryMedium, SignalHigh, Wifi } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * The simulated handset (UI-002).
 *
 * A device body, a bezel, a clipped screen, a status bar and a home indicator - drawn
 * entirely in CSS and the icon set the project already ships. No image, no external
 * asset, and nothing copied from a real vendor's design language: this is a generic
 * modern handset, not an imitation of a specific one.
 *
 * The screen is the containment boundary the client specification asks for. It is
 * `relative` and `overflow-hidden`, so app content, sheets and overlays are all clipped
 * to it and scenario content cannot escape into the page.
 *
 * Sizing: 390 x 844 is the target, not a floor. The frame keeps the device's aspect ratio
 * and shrinks to fit a narrow window or a 200% zoom rather than forcing the page sideways.
 */

/**
 * The host's local time. Only a fallback now: the status bar shows the scenario's own time
 * whenever one is known (see `StatusBar`), which is always the case inside a scenario.
 */
function DeviceClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(timer)
  }, [])

  return (
    <span className="tabular-nums">
      {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  )
}

/** Hours and minutes in the phone's usual locale format, e.g. "07:45 AM" from "07:45". */
const SCENARIO_CLOCK = new Intl.DateTimeFormat([], {
  hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
})

function ScenarioClock({ time }) {
  const [hours, minutes] = time.split(':').map(Number)
  // A fixed synthetic instant, formatted in UTC so the host's timezone cannot shift it.
  return (
    <span className="tabular-nums">
      {SCENARIO_CLOCK.format(Date.UTC(2000, 0, 1, hours, minutes))}
    </span>
  )
}

/**
 * The status bar.
 *
 * `clock` is the current scenario's synthetic time ("07:45"): the time its notification
 * announces and its app lists the item at. The phone used to show the host's real time,
 * which put "5:18 PM" on a screen whose message had just arrived at 07:45. The host's clock
 * is only a fallback for a phone with no scenario time at all.
 *
 * The icons are fixed decoration: an ordinary phone's signal, Wi-Fi and battery. They
 * describe the fictional phone, never the host - showing the machine's real network state
 * here would tell the learner something about their computer while they are looking at a
 * fictional phone. (They previously read "offline", from before the application was
 * hosted online.)
 */
function StatusBar({ carrier = 'TRAINING NET', clock = null }) {
  return (
    <div
      className="relative z-20 flex h-11 shrink-0 items-center justify-between px-5 pt-1 text-[0.7rem] font-semibold text-device-status"
      data-testid="device-status-bar"
    >
      <span className="flex items-center gap-1.5">
        {clock ? <ScenarioClock time={clock} /> : <DeviceClock />}
      </span>

      {/* The island. Presentational, and never a control. */}
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1.5 h-6 w-24 -translate-x-1/2 rounded-full bg-device-body"
      />

      <span className="flex items-center gap-1.5">
        <span className="sr-only">Simulated carrier {carrier}. Battery 78 per cent.</span>
        <SignalHigh size={14} aria-hidden="true" />
        <Wifi size={13} aria-hidden="true" />
        <BatteryMedium size={16} aria-hidden="true" />
      </span>
    </div>
  )
}

export function DeviceFrame({ label, clock = null, className, children }) {
  return (
    <div
      className={cn(
        // The device keeps its proportions; width gives way first, then height.
        'mx-auto w-full max-w-[390px]',
        className,
      )}
    >
      <div
        className={cn(
          'rounded-[2.5rem] bg-device-body p-2.5',
          'shadow-lg ring-1 ring-device-edge/60',
        )}
      >
        {/* The bezel: a thin inner edge so the screen reads as inset, not painted on. */}
        <div className="overflow-hidden rounded-[2rem] bg-device-edge p-px">
          <section
            aria-label={label}
            data-testid="device-screen"
            className={cn(
              'relative flex flex-col overflow-hidden rounded-[calc(2rem-1px)]',
              'bg-device-screen',
              // 844px is the target height; the viewport yields before the page does.
              'h-[min(844px,74dvh)] min-h-[30rem]',
            )}
          >
            <StatusBar clock={clock} />

            {/* Everything an app draws lives here, clipped to the screen. */}
            <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>

            {/* Home indicator. Presentational only - there is no home gesture to make. */}
            <div className="relative z-20 flex h-5 shrink-0 items-end justify-center pb-1.5">
              <span
                aria-hidden="true"
                className="h-1 w-32 rounded-full bg-device-status/25"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
