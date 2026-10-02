import { cn } from '@/utils/cn'

/**
 * The attempt progress bar from the client specification: one segment per scenario,
 * "Scenario n/10".
 *
 * Meaning is never carried by colour alone - each segment has a distinct fill AND a
 * distinct border weight, and the whole strip is summarised in text for screen readers.
 * It shows position only; the running score stays hidden in assessment mode.
 */
export function SegmentedProgress({ current, resolved, total, className }) {
  const segments = Array.from({ length: total }, (_, index) => index + 1)

  return (
    <div className={cn('min-w-0', className)}>
      <ol className="flex items-center gap-1" aria-hidden="true">
        {segments.map((ordinal) => {
          const done = ordinal <= resolved
          const active = ordinal === current && !done

          return (
            <li
              key={ordinal}
              className={cn(
                'h-2 flex-1 rounded-full border',
                done && 'border-primary bg-primary',
                active && 'border-primary border-dashed bg-primary-soft',
                !done && !active && 'border-border bg-secondary-soft',
              )}
            />
          )
        })}
      </ol>

      <p className="sr-only" role="status">
        {resolved} of {total} scenarios resolved
        {current ? `. Now on scenario ${current}.` : '.'}
      </p>
    </div>
  )
}
