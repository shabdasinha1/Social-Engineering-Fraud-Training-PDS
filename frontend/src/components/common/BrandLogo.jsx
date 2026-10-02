import { ShieldCheck } from 'lucide-react'
import { APP_NAME, APP_TAGLINE } from '@/constants/app'
import { cn } from '@/utils/cn'

/**
 * Logo mark plus product name. `tone="light"` is for dark backgrounds.
 */
export function BrandLogo({ tone = 'dark', showText = true, className }) {
  const light = tone === 'light'

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span
        className={cn(
          'grid size-11 shrink-0 place-items-center rounded-md',
          light ? 'bg-white/12 text-white' : 'bg-primary text-primary-contrast',
        )}
      >
        <ShieldCheck size={24} aria-hidden="true" />
      </span>

      {showText && (
        <span className="leading-tight">
          <span
            className={cn(
              'block text-base font-bold tracking-tight sm:text-lg',
              light ? 'text-white' : 'text-text',
            )}
          >
            {APP_NAME}
          </span>
          <span
            className={cn(
              'block text-xs font-medium sm:text-sm',
              light ? 'text-text-on-dark-muted' : 'text-text-muted',
            )}
          >
            {APP_TAGLINE}
          </span>
        </span>
      )}
    </div>
  )
}
