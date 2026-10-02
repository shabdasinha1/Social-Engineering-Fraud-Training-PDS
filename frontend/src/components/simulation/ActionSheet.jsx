import { useId, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { RATIONALE_MAX_LENGTH, STAGE_META } from '@/constants/simulation'
import { cn } from '@/utils/cn'

/**
 * The contextual action sheet (client specification section 4).
 *
 * Every control here has a neutral id; only the server knows what it submits, and the
 * engine decides what that means for the scenario on screen (SECURITY-001). Two rules follow from that, and both
 * are visible in the markup:
 *
 * 1. **Nothing is styled by risk.** Every option at a decision stage gets the same
 *    variant, the same weight and the same order every time. A control that looked
 *    safer than its neighbour would answer the question for the learner.
 * 2. **Nothing is disabled to steer.** The specification says to avoid disabling the
 *    wrong option; controls are only disabled while a submission is in flight.
 */

function RationaleField({ value, onChange, disabled }) {
  const fieldId = useId()
  const hintId = useId()
  const remaining = RATIONALE_MAX_LENGTH - value.length

  return (
    <div className="mt-5 border-t border-border pt-4">
      <label htmlFor={fieldId} className="text-sm font-semibold">
        Why did you choose this? <span className="font-normal text-text-muted">(optional)</span>
      </label>
      <input
        id={fieldId}
        type="text"
        value={value}
        disabled={disabled}
        maxLength={RATIONALE_MAX_LENGTH}
        aria-describedby={hintId}
        autoComplete="off"
        // Sanitised locally: one line, no markup, and never a place for a real secret.
        onChange={(event) => onChange(event.target.value.replace(/[\r\n]+/g, ' '))}
        className={cn(
          'mt-1.5 min-h-11 w-full rounded-md border border-border-strong bg-surface px-3 text-sm',
          'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-focus',
          'disabled:opacity-55',
        )}
      />
      <p id={hintId} className="mt-1 text-xs text-text-muted">
        One line. Do not enter passwords, codes or personal details.{' '}
        <span className="tabular-nums">{remaining}</span> characters left.
      </p>
    </div>
  )
}

export function ActionSheet({
  stage,
  actions,
  onSelect,
  pendingAction,
  busy = false,
  withRationale = false,
}) {
  const [rationale, setRationale] = useState('')
  const meta = STAGE_META[stage]

  if (!actions?.length) return null

  return (
    <div className="min-w-0">
      {/* The stage heading lives in TrainingPanel; this is the control list under it. */}
      <h3 id={`stage-${stage}`} className="sr-only">
        {meta?.label} actions
      </h3>

      <ul className="grid gap-2.5">
        {actions.map((action) => (
          <li key={action.id}>
            <Button
              variant={action.primary ? 'primary' : 'outline'}
              fullWidth
              className="justify-start text-left"
              disabled={busy && pendingAction !== action.id}
              loading={pendingAction === action.id}
              data-control="act"
              onClick={() => onSelect(action, { rationale: rationale.trim() })}
            >
              {action.label}
            </Button>
          </li>
        ))}
      </ul>

      {withRationale && (
        <RationaleField value={rationale} onChange={setRationale} disabled={busy} />
      )}
    </div>
  )
}
