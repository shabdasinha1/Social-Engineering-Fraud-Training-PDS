import { cn } from '@/utils/cn'

export function Card({ as: Tag = 'div', className, children, ...props }) {
  return (
    <Tag
      className={cn(
        'rounded-lg border border-border bg-card shadow-md',
        'p-6 sm:p-8',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}
