import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

/** Everything focusable a dialog can contain. Order is DOM order, which is tab order. */
const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * Puts focus back where it came from once a dialog closes.
 *
 * In this simulation the control that opened a dialog is usually already gone: an
 * overlay opens only after the engine has accepted the intent, and that stage change has
 * re-rendered the action sheet underneath. `<body>` is therefore treated as no target at
 * all - restoring to it would strand a keyboard user at the top of the document - and
 * focus goes to the main region instead. The result is checked rather than assumed,
 * because a detached or disabled node accepts `focus()` without taking it.
 */
function restoreFocus(target) {
  if (
    target &&
    target !== document.body &&
    document.contains(target) &&
    typeof target.focus === 'function'
  ) {
    target.focus()
    if (document.activeElement === target) return
  }

  const main = document.querySelector('main')
  if (!main) return
  main.setAttribute('tabindex', '-1')
  // Without preventScroll the browser scrolls <main> to the top of the viewport, pushing
  // the header out of view every time a dialog opened from the header menu closes.
  main.focus({ preventScroll: true })
}

/**
 * Modal dialog with a real focus trap.
 *
 * The client acceptance list requires keyboard-only completion, so every overlay in the
 * simulation - trusted directory, sender details, browser, file viewer - goes through
 * here: focus moves in on open, Tab cycles inside, Escape closes, and focus returns to
 * whatever opened it.
 */
export function Modal({ open, title, description, onClose, contained = false, className, children }) {
  const panelRef = useRef(null)
  const returnFocusTo = useRef(null)
  /**
   * Held in a ref so the trap depends only on `open`. A caller passing an inline arrow
   * would otherwise re-run this effect on every render, and each cleanup would hand focus
   * straight back out of the dialog.
   */
  const closeRef = useRef(onClose)

  // Declared before the trap below so the handler always sees the current callback.
  useEffect(() => {
    closeRef.current = onClose
  })
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!open) return undefined

    // Only a real control is worth returning to; see `restoreFocus`.
    returnFocusTo.current =
      document.activeElement === document.body ? null : document.activeElement
    const panel = panelRef.current
    // The panel itself is focusable, so a dialog with no controls still receives focus.
    const first = panel?.querySelector(FOCUSABLE) ?? panel
    first?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        closeRef.current?.()
        return
      }
      if (event.key !== 'Tab' || !panel) return

      const items = [...panel.querySelectorAll(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      )
      if (items.length === 0) {
        event.preventDefault()
        panel.focus()
        return
      }

      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault()
        lastItem.focus()
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault()
        firstItem.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      restoreFocus(returnFocusTo.current)
    }
  }, [open])

  if (!open) return null

  return (
    /**
     * `contained` positions the dialog inside its nearest positioned ancestor instead of
     * the viewport, so a sheet rendered within the simulated device is clipped to the
     * device screen and reads as part of the phone. The focus trap is unaffected: it is
     * a document-level key handler, not a layout concern.
     */
    <div
      className={cn(
        'z-50 flex justify-center',
        contained
          ? 'absolute inset-0 items-end p-2'
          : 'fixed inset-0 items-end p-0 sm:items-center sm:p-6',
      )}
    >
      {/* Backdrop. Presentational: Escape and the Close button do the closing. */}
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-overlay"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full overflow-y-auto overscroll-contain border border-border bg-surface shadow-lg',
          contained
            ? 'animate-sheet-up max-h-full rounded-2xl'
            : 'max-h-[90dvh] rounded-t-xl sm:max-w-md sm:rounded-xl',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-bold">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-0.5 text-sm text-text-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="grid size-9 shrink-0 place-items-center rounded-md text-text-muted hover:bg-secondary-soft"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
