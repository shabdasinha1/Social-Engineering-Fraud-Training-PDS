import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

const VARIANTS = {
  info: { icon: Info, wrapper: 'bg-info-soft text-info border-info/25' },
  success: { icon: CheckCircle2, wrapper: 'bg-success-soft text-success border-success/25' },
  warning: { icon: AlertTriangle, wrapper: 'bg-warning-soft text-warning border-warning/25' },
  danger: { icon: XCircle, wrapper: 'bg-danger-soft text-danger border-danger/25' },
}

export function Alert({ variant = 'info', title, className, children }) {
  const { icon: Icon, wrapper } = VARIANTS[variant]

  return (
    <div
      role={variant === 'danger' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-md border p-3.5 text-sm', wrapper, className)}
    >
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="text-balance-pretty">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5' : undefined}>{children}</div>}
      </div>
    </div>
  )
}
