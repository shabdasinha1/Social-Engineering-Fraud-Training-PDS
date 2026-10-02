import { MonitorPlay } from 'lucide-react'
import { SIMULATION_LABEL } from '@/constants/app'
import { cn } from '@/utils/cn'

/**
 * The specification's required, permanent identification that every communication on
 * screen is simulated. Shown on every screen of the application.
 *
 * Required by the product specification and NOT removable. The CLIENT-POLISH-001 feedback
 * was about avoiding casual "practice" framing in prose, never about dropping this marker -
 * a learner must always be able to tell the environment is simulated.
 */
export function SimulationBadge({ tone = 'dark', className }) {
  const light = tone === 'light'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1',
        'text-[0.68rem] font-bold tracking-[0.09em] uppercase',
        light
          ? 'bg-white/12 text-white ring-1 ring-white/20'
          : 'bg-warning-soft text-warning ring-1 ring-warning/25',
        className,
      )}
    >
      <MonitorPlay size={13} aria-hidden="true" />
      {SIMULATION_LABEL}
    </span>
  )
}
