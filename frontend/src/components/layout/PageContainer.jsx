import { cn } from '@/utils/cn'

export function PageContainer({ size = 'lg', className, children }) {
  const widths = { sm: 'max-w-2xl', md: 'max-w-4xl', lg: 'max-w-6xl', full: 'max-w-none' }

  return (
    <div className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', widths[size], className)}>
      {children}
    </div>
  )
}
