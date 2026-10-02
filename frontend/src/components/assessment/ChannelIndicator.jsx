import { CHANNELS } from '@/constants/channels'
import { cn } from '@/utils/cn'

/**
 * Says which app the current scenario came from. Questions in one assessment
 * are mixed across channels, so this changes from question to question.
 */
export function ChannelIndicator({ channel, className }) {
  const match = CHANNELS.find((item) => item.key === channel)
  if (!match) return null

  const { label, icon: Icon, accent } = match

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full py-1.5 pr-4 pl-1.5',
        'text-sm font-semibold ring-1 ring-border',
        'bg-surface text-text',
        className,
      )}
    >
      <span className={cn('grid size-7 shrink-0 place-items-center rounded-full', accent)}>
        <Icon size={15} aria-hidden="true" />
      </span>
      <span>
        <span className="sr-only">This message came from </span>
        {label}
      </span>
    </span>
  )
}
