import { cn } from '@/utils/cn'

export function StepCard({ step, icon: Icon, title, text, className, style }) {
  return (
    <div
      style={style}
      className={cn(
        'rounded-md border border-border bg-surface p-4 sm:p-5',
        'transition-[box-shadow,border-color,transform] duration-200',
        'hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
          <Icon size={20} aria-hidden="true" />
        </span>
        <span className="text-sm font-bold text-text-muted tabular-nums">{step}</span>
      </div>

      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-balance-pretty text-text-muted">{text}</p>
    </div>
  )
}
