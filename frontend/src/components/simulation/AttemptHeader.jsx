import { useEffect, useRef, useState } from 'react'
import { Accessibility, ClipboardList, UserRound } from 'lucide-react'
import { SegmentedProgress } from '@/components/simulation/SegmentedProgress'
import { TimeRemaining } from '@/components/simulation/TimeRemaining'
import { cn } from '@/utils/cn'

/**
 * Attempt information bar (client specification section 3: learner chip + progress card).
 *
 * Shows position, remaining time and who is signed in. It never shows the running score -
 * section 3 hides it in assessment mode - and never shows difficulty, disposition,
 * attack family or any other selection metadata.
 */

function LearnerMenu({ candidate, onHistory, onAccessibility }) {
  const [open, setOpen] = useState(false)
  const wrapper = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDocument = (event) => {
      if (!wrapper.current?.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocument)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocument)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  /**
   * The chip menu: attempt history and accessibility, in that order. The client removed
   * "Restarting (instructor only)" and "Log out" from this menu, so the assessment screen
   * offers no sign-out; logout lives on the dashboard.
   *
   *   - history opens a read-only panel in this shell instead of navigating away, so a
   *     clocked assessment is never left behind to look at past results (IMMERSIVE-002);
   *   - accessibility opens immediately, with no confirmation and no gate: an
   *     accommodation that becomes harder to reach under time pressure is not an
   *     accommodation.
   */
  const items = [
    { key: 'history', label: 'Attempt history', icon: ClipboardList, onSelect: onHistory },
    { key: 'a11y', label: 'Accessibility', icon: Accessibility, onSelect: onAccessibility },
  ].filter((item) => item.onSelect)

  return (
    // `ml-auto` keeps the chip at the right edge on a phone too, where the progress strip
    // wraps to its own row and no longer pushes it across.
    <div ref={wrapper} className="relative ml-auto">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'flex min-h-11 items-center gap-2 rounded-full border border-border',
          'bg-surface py-1.5 pr-3.5 pl-1.5 text-left hover:bg-secondary-soft',
        )}
      >
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary"
        >
          <UserRound size={16} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold">{candidate?.display_name}</span>
          <span className="block text-[0.65rem] text-text-muted tabular-nums">
            <span className="sr-only">Service number ending </span>
            {candidate?.service_no_masked}
          </span>
        </span>
      </button>

      {open && (
        <ul
          role="menu"
          className="absolute right-0 z-40 mt-1 w-52 overflow-hidden rounded-md border border-border bg-surface shadow-lg"
        >
          {items.map(({ key, label, icon: Icon, onSelect }) => (
            <li key={key} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  onSelect()
                }}
                className="flex min-h-11 w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm hover:bg-secondary-soft"
              >
                <Icon size={16} aria-hidden="true" className="text-text-muted" />
                {label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function AttemptHeader({
  candidate,
  ordinal,
  resolved,
  total,
  /** IMMERSIVE-001. Both null on an attempt created before the limit existed. */
  expiresAt = null,
  serverNow = null,
  onExpired,
  onHistory,
  onAccessibility,
}) {
  return (
    <div className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3">
        <div className="min-w-0">
          <h1 className="text-sm font-bold sm:text-base">
            {ordinal ? (
              <>
                Scenario <span className="tabular-nums">{ordinal}</span> of{' '}
                <span className="tabular-nums">{total}</span>
              </>
            ) : (
              'Assessment'
            )}
          </h1>
          {/*
            Only REMAINING time is shown. The client asked for the elapsed (count-up)
            reading to be removed so the learner sees a single clock: the countdown.
          */}
          <p className="flex flex-wrap items-center gap-x-2 text-xs font-semibold text-text-muted">
            {expiresAt && (
              <TimeRemaining
                expiresAt={expiresAt}
                serverNow={serverNow}
                onExpired={onExpired}
              />
            )}
          </p>
        </div>

        <SegmentedProgress
          className="order-last w-full sm:order-none sm:w-auto sm:flex-1"
          current={ordinal}
          resolved={resolved}
          total={total}
        />

        <LearnerMenu
          candidate={candidate}
          onHistory={onHistory}
          onAccessibility={onAccessibility}
        />
      </div>
    </div>
  )
}
