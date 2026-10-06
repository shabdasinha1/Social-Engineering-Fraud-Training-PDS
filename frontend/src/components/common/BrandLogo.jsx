import satarkLogo from '@/assets/images/logo_satark.jpeg'
import { BRAND_NAME } from '@/constants/app'
import { cn } from '@/utils/cn'

/**
 * SATARK logo plus product name. `tone="light"` is for dark backgrounds. The logo is the
 * shared asset, sized to the height of the shield mark it replaced.
 */
export function BrandLogo({ tone = 'dark', showText = true, className }) {
  const light = tone === 'light'

  return (
    <div className={cn('flex shrink-0 items-center gap-3', className)}>
      <img
        src={satarkLogo}
        alt={showText ? '' : `${BRAND_NAME} logo`}
        width={813}
        height={496}
        className="h-8 w-auto max-w-none shrink-0 rounded-md sm:h-11"
      />

      {showText && (
        <span
          className={cn(
            'text-base leading-tight font-bold tracking-[0.08em] sm:text-lg',
            light ? 'text-white' : 'text-text',
          )}
        >
          {BRAND_NAME}
        </span>
      )}
    </div>
  )
}
