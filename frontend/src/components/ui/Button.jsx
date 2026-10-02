import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

const VARIANTS = {
  primary:
    'bg-primary text-primary-contrast hover:bg-primary-hover active:bg-primary-active shadow-xs',
  secondary:
    'bg-secondary-soft text-secondary hover:bg-primary-soft active:bg-primary-soft',
  outline:
    'border border-border-strong bg-surface text-text hover:bg-secondary-soft active:bg-primary-soft',
  ghost: 'text-primary hover:bg-primary-soft active:bg-primary-soft',
  danger: 'bg-danger text-white hover:brightness-110 active:brightness-95 shadow-xs',
}

const SIZES = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-[0.95rem] gap-2',
  lg: 'h-12 px-6 text-base gap-2 sm:h-13',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  type = 'button',
  className,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-semibold',
        'transition-[background-color,color,box-shadow,transform] duration-200',
        'active:translate-y-px disabled:pointer-events-none disabled:opacity-55',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}
