import { CircleCheckBig, CircleDashed, Clock } from 'lucide-react'
import { ASSESSMENT_STATUS } from '@/constants/assessment'
import { cn } from '@/utils/cn'

const STATUSES = {
  [ASSESSMENT_STATUS.NOT_STARTED]: {
    label: 'Not started',
    icon: CircleDashed,
    tone: 'bg-secondary-soft text-secondary ring-border-strong',
  },
  [ASSESSMENT_STATUS.IN_PROGRESS]: {
    label: 'In progress',
    icon: Clock,
    tone: 'bg-info-soft text-info ring-info/25',
  },
  [ASSESSMENT_STATUS.COMPLETED]: {
    label: 'Completed',
    icon: CircleCheckBig,
    tone: 'bg-success-soft text-success ring-success/25',
  },
}

export function StatusBadge({ status, className }) {
  const { label, icon: Icon, tone } = STATUSES[status] ?? STATUSES[ASSESSMENT_STATUS.NOT_STARTED]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1',
        'text-sm font-semibold ring-1',
        tone,
        className,
      )}
    >
      <Icon size={15} aria-hidden="true" />
      {label}
    </span>
  )
}
