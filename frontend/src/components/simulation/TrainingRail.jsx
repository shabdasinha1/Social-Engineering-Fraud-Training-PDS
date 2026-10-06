import { useEffect, useState } from 'react'
import { MonitorPlay, ShieldCheck } from 'lucide-react'
import { SIMULATION_LABEL } from '@/constants/app'
import { cn } from '@/utils/cn'

/**
 * The persistent low-salience training rail (client specification sections 1 and 3).
 *
 * It sits outside the simulated app and stays on screen for the whole attempt, so the
 * learner can navigate naturally without mistaking any of this for a live service. It
 * carries the local clock and the synthetic-content marker.
 *
 * The application is hosted online, so the rail no longer claims to be offline or to have
 * its network switched off. What it still states is the simulation boundary: everything on
 * the phone is synthetic, and nothing in it reaches a real person. That marker is a
 * statement about the content, never a probe of the host's connection.
 */
export function TrainingRail({ className, children }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(timer)
  }, [])

  const clock = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-warning/25',
        'bg-warning-soft px-4 py-1.5 text-warning',
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-bold tracking-[0.09em] uppercase">
        <MonitorPlay size={13} aria-hidden="true" />
        {SIMULATION_LABEL}
      </span>

      <span className="ml-auto flex items-center gap-3 text-[0.7rem] font-semibold">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck size={13} aria-hidden="true" />
          <span>Synthetic content</span>
        </span>
        <span className="tabular-nums">
          <span className="sr-only">Local time </span>
          {clock}
        </span>
      </span>

      {children}
    </div>
  )
}
