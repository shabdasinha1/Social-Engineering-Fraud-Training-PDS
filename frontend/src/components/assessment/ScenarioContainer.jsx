import { cn } from '@/utils/cn'

/**
 * The phone frame the scenario is shown inside. The channel specific
 * renderers (FE-008 to FE-011) are rendered as children - this component
 * never knows which channel it is showing.
 */
export function ScenarioContainer({ className, children }) {
  return (
    <div className={cn('mx-auto w-full max-w-sm', className)}>
      <div className="rounded-xl border border-border-strong bg-surface p-2 shadow-md">
        <div className="h-[28rem] overflow-hidden rounded-lg border border-border bg-background sm:h-[32rem]">
          {children}
        </div>
      </div>
    </div>
  )
}
