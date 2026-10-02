import { PATH_ACTION_LABELS, STAGE_LABELS, label } from '@/constants/result'
import { cn } from '@/utils/cn'

/**
 * The section 7 decision-path replay (UI-003).
 *
 * The server sends `{ step, stage, action }` and nothing else - no event code, no point
 * delta, no metadata, no event id, no timestamp - so this renders exactly what it is
 * given, in the order it is given. The ordering is the engine's own ledger sequence; the
 * client never sorts or reinterprets it.
 *
 * REVIEW-001 reuses it unchanged for the CORRECT path, with `tone="expected"`. One
 * component draws both columns on purpose: a learner comparing what they did against what
 * was expected should be comparing the content of the two lists, not decoding two
 * different visual languages. The only difference is the dot colour, and the heading above
 * each column - not the colour - is what says which is which.
 */

const TONES = {
  actual: { dot: 'bg-primary', empty: 'No actions were recorded.' },
  expected: { dot: 'bg-success', empty: 'This scenario declared no expected path.' },
}

export function PathReplay({ path, className, tone = 'actual' }) {
  const style = TONES[tone] ?? TONES.actual
  if (!path?.length) {
    return (
      <p className={className}>
        <span className="text-sm text-text-muted">{style.empty}</span>
      </p>
    )
  }

  return (
    <ol className={className}>
      {path.map((step, index) => (
        <li key={step.step} className="flex items-start gap-2.5">
          <span className="flex shrink-0 flex-col items-center self-stretch" aria-hidden="true">
            <span className={cn('mt-1.5 size-2 rounded-full', style.dot)} />
            {index < path.length - 1 && <span className="w-px flex-1 bg-border-strong" />}
          </span>

          <span className="min-w-0 pb-3">
            <span className="block text-[0.65rem] font-bold tracking-wide text-text-muted uppercase">
              {label(STAGE_LABELS, step.stage)}
            </span>
            <span className="block text-sm">
              {label(PATH_ACTION_LABELS, step.action)}
            </span>
          </span>
        </li>
      ))}
    </ol>
  )
}
