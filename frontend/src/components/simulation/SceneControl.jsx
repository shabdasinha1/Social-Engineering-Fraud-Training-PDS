import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

/** Variants that set their own corner radius below; every other variant is a pill. */
const SHAPED_VARIANTS = new Set(['cta', 'menu', 'row'])

/**
 * One scene affordance, drawn as a control (IMMERSIVE-003A).
 *
 * Every affordance in the simulation goes through this component, on the chat screen and
 * on every pushed surface, which is what makes the two rules below structural rather than
 * a habit each renderer has to remember:
 *
 * 1. **Nothing is styled by risk.** One shape, one weight, one colour per variant. The
 *    variant is chosen by WHERE the control sits - a chip in a bubble, a banner under the
 *    thread, a row in the overflow menu - never by what the control does.
 * 2. **Nothing is disabled to steer.** Controls disable only while a submission is in
 *    flight, and the one in flight shows the spinner. The specification is explicit that
 *    the unwise option must stay selectable.
 *
 * SECURITY-001: the markup carries nothing about what a control submits - no intent, no
 * control id. `data-control` only says whether the control records an action (`act`) or
 * just moves around the device (`nav`), which the learner can see for themselves.
 */
export function SceneControl({ affordance, busy, pendingAction, onSelect, variant = 'chip' }) {
  const pending = !affordance.local && pendingAction === affordance.id
  const disabled = Boolean(busy) && !pending

  return (
    <button
      type="button"
      disabled={disabled}
      aria-busy={pending || undefined}
      data-control={affordance.local ? 'nav' : 'act'}
      onClick={() => onSelect(affordance)}
      className={cn(
        /**
         * `py-1.5` and a 1.5rem radius only show once a long label wraps: a one-line control
         * still sits inside `min-h-11` and still reads as a full pill, but a wrapped one no
         * longer runs its text into the pill's curved ends.
         */
        'inline-flex min-h-11 items-center gap-1.5 px-3.5 py-1.5 text-left text-[0.78rem]',
        'font-semibold transition-colors duration-150 disabled:opacity-55',
        !SHAPED_VARIANTS.has(variant) && 'rounded-3xl',
        variant === 'chip'
          && 'border border-channel-whatsapp/45 bg-surface text-channel-whatsapp hover:bg-channel-whatsapp/10',
        /** The same chip in Instagram's own colours (IMMERSIVE-004A); position, not risk. */
        variant === 'ig'
          && 'border border-ig-border bg-ig-surface text-ig-accent hover:bg-ig-bubble-in',
        /**
         * The mail app's chip, and the button an HTML email draws in its own body
         * (IMMERSIVE-005). Chosen by where the control sits - under an attachment, or inside
         * the sender's message - never by what it does.
         */
        variant === 'mail'
          && 'border border-mail-border bg-mail-surface text-mail-accent hover:bg-mail-tint',
        variant === 'cta'
          && 'justify-center rounded-md bg-mail-accent px-5 text-center text-white hover:opacity-90',
        variant === 'banner'
          && 'flex-1 justify-center border border-border-strong bg-surface text-primary hover:bg-primary-soft',
        variant === 'surface'
          && 'border border-border-strong bg-surface text-primary hover:bg-primary-soft',
        variant === 'menu'
          && 'min-h-12 w-full justify-start rounded-lg border border-border bg-surface px-3.5 text-[0.85rem] text-text hover:bg-secondary-soft',
        /**
         * A button attached to the bottom of a business message (IMMERSIVE-003C). Full
         * width and borderless because that is how the app draws a message's reply
         * buttons - every one of them the same, whatever it does.
         */
        variant === 'row'
          && 'w-full justify-center rounded-none text-center text-channel-whatsapp hover:bg-black/5',
      )}
    >
      {pending && <Loader2 size={14} className="shrink-0 animate-spin" aria-hidden="true" />}
      <span className="min-w-0">
        {affordance.label}
        {affordance.hint && (variant === 'menu' || variant === 'surface') && (
          <span className="mt-0.5 block text-[0.72rem] font-normal text-text-muted">
            {affordance.hint}
          </span>
        )}
      </span>
    </button>
  )
}
