import { useEffect, useRef, useState } from 'react'
import { WARN_AT_MS, formatRemaining, remainingFrom } from '@/utils/assessmentClock'
import { cn } from '@/utils/cn'

/**
 * The assessment countdown (IMMERSIVE-001).
 *
 * ### This component decides nothing
 *
 * It renders a number and, once, calls `onExpired`. It does not end the attempt, submits
 * nothing, and cannot extend anything. When it reaches zero it asks the page to re-read the
 * server, and the SERVER decides what happens next. Delete this component, or set the
 * machine's clock wrong, or suspend the tab for an hour, and the assessment still ends at
 * exactly the same moment: the route guard and the sweeper enforce the deadline, and
 * neither of them consults the browser.
 *
 * ### The clock offset
 *
 * The backend sends `server_now` beside `expires_at`. Measuring the difference once means a
 * machine whose local clock is minutes out still shows the right remaining time. It is a
 * display correction only - moving the local clock changes what this shows and changes
 * nothing about when the attempt actually ends.
 */

/**
 * The countdown: measures the clock offset once, then ticks against it.
 *
 * Three deliberate details, each of which the linter is right to care about:
 *
 *   - the offset lives in a REF, not in state. It is measured once inside the effect and
 *     read by the interval, so nothing about it happens during render and a drifting local
 *     clock cannot walk the number around.
 *   - the first tick is scheduled with `setTimeout(..., 0)` rather than called inline, so
 *     no `setState` runs synchronously inside the effect. The learner still sees the value
 *     immediately - it lands on the next macrotask, well inside a frame.
 *   - `onZero` is held in a ref so that a caller passing a new function identity on every
 *     render cannot restart the interval, which would reset the "already fired" guard and
 *     turn one expiry into a request every second.
 */
function useCountdown(expiresAt, serverNow, onZero) {
  const [remaining, setRemaining] = useState(null)
  const offsetRef = useRef(null)
  const firedRef = useRef(false)
  const onZeroRef = useRef(onZero)

  useEffect(() => {
    onZeroRef.current = onZero
  }, [onZero])

  useEffect(() => {
    firedRef.current = false
    if (!expiresAt) return undefined

    if (offsetRef.current === null) {
      const parsed = serverNow ? new Date(serverNow).getTime() : Number.NaN
      offsetRef.current = Number.isNaN(parsed) ? 0 : parsed - Date.now()
    }

    const tick = () => {
      const left = remainingFrom(expiresAt, { offsetMs: offsetRef.current })
      setRemaining(left)
      if (left === 0 && !firedRef.current) {
        firedRef.current = true
        onZeroRef.current?.()
      }
    }

    const first = setTimeout(tick, 0)
    const timer = setInterval(tick, 1000)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [expiresAt, serverNow])

  return expiresAt ? remaining : null
}

export function TimeRemaining({ expiresAt, serverNow, onExpired, className }) {
  const remaining = useCountdown(expiresAt, serverNow, onExpired)

  if (remaining === null) return null

  const critical = remaining <= WARN_AT_MS[WARN_AT_MS.length - 1]

  return (
    <span
      className={cn('tabular-nums', critical && 'font-bold text-danger', className)}
      data-testid="time-remaining"
    >
      <span className="sr-only">Time remaining </span>
      {formatRemaining(remaining)} left
    </span>
  )
}

/**
 * The non-blocking warning banner.
 *
 * Deliberately not a modal, and deliberately `role="status"` (polite). A dialog seizing
 * focus two minutes before the deadline would interrupt the decision being assessed, which
 * is both an accessibility failure and a measurement failure - it would change the very
 * behaviour the assessment exists to observe.
 */
export function TimeWarning({ expiresAt, serverNow }) {
  const remaining = useCountdown(expiresAt, serverNow, undefined)

  if (remaining === null || remaining <= 0) return null
  if (!WARN_AT_MS.some((threshold) => remaining <= threshold)) return null

  const minutes = Math.ceil(remaining / 60000)

  return (
    <p
      role="status"
      className="rounded-md border border-warning/40 bg-warning-soft px-3 py-2 text-sm font-semibold text-warning"
    >
      {minutes === 1
        ? 'About 1 minute of assessment time remains.'
        : `About ${minutes} minutes of assessment time remain.`}{' '}
      <span className="font-normal">
        Anything you have already done is saved. Scenarios you do not reach are recorded as
        not completed.
      </span>
    </p>
  )
}
