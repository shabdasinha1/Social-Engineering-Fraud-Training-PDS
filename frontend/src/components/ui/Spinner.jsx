import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

export function Spinner({ size = 22, label = 'Loading', className }) {
  return (
    <span role="status" aria-label={label} className={cn('inline-flex', className)}>
      <Loader2 size={size} className="animate-spin text-primary" aria-hidden="true" />
    </span>
  )
}
