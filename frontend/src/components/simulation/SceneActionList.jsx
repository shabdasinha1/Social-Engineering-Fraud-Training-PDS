import { useId, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { SceneControl } from '@/components/simulation/SceneControl'
import { RATIONALE_MAX_LENGTH } from '@/constants/simulation'
import { affordancesFor } from '@/simulation/sceneModel'
import { cn } from '@/utils/cn'

/**
 * The panel beside the device, for a scenario with an authored scene (IMMERSIVE-003A).
 *
 * The client's objection was that the panel had become the game: a question, then four
 * answers. So on these scenarios it stops being where the scenario happens and goes back
 * to being what it was meant to be - it says where the learner is, points at the phone,
 * and keeps one thing the phone cannot give: a flat list of everything available right
 * now, for anyone who would rather read the options than hunt for them.
 *
 * That list is deliberately retained rather than deleted, for three reasons.
 *
 * - **It is the same actions.** Every entry is the same scene affordance the device
 *   draws, so choosing from here and choosing on the phone submit identical requests.
 *   The paired assertion in the tests is what keeps that true.
 * - **It is an accessibility route.** Every device control is a real button and reachable
 *   by keyboard, but a linear list of the six-to-ten things available is easier to work
 *   through with a screen reader than a chat transcript with controls inside it.
 * - **It is the rollback.** If an authored scene ever has to be withdrawn, this list is
 *   already the path the other ninety-five scenarios use.
 *
 * It starts collapsed. The phone is the interface; this is the alternative to it.
 */
export function SceneActionList({
  scene, stage, busy, pendingAction, onSelect, rationale, onRationaleChange,
}) {
  const [open, setOpen] = useState(false)
  const listId = useId()
  const fieldId = useId()
  const hintId = useId()

  const affordances = affordancesFor(scene, stage).filter((item) => !item.local)

  /**
   * The stage's device instruction is not repeated here: `TrainingPanel` already states it
   * as the panel's subtitle (`onDevice`), and printing the same sentence again directly
   * below read as a rendering fault.
   */
  return (
    <div className="min-w-0">
      {stage === 'resolve' && (
        /**
         * Section 4's optional rationale, kept off the simulated phone on purpose: the
         * device must contain no text input, and a note the learner writes for the
         * assessment is not part of the fiction anyway.
         */
        <div>
          <label htmlFor={fieldId} className="text-sm font-semibold">
            Why did you choose this? <span className="font-normal text-text-muted">(optional)</span>
          </label>
          <input
            id={fieldId}
            type="text"
            value={rationale}
            disabled={busy}
            maxLength={RATIONALE_MAX_LENGTH}
            aria-describedby={hintId}
            autoComplete="off"
            onChange={(event) => onRationaleChange(event.target.value.replace(/[\r\n]+/g, ' '))}
            className={cn(
              'mt-1.5 min-h-11 w-full rounded-md border border-border-strong bg-surface px-3 text-sm',
              'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-focus',
              'disabled:opacity-55',
            )}
          />
          <p id={hintId} className="mt-1 text-xs text-text-muted">
            One line. Do not enter passwords, codes or personal details.{' '}
            <span className="tabular-nums">{RATIONALE_MAX_LENGTH - rationale.length}</span>{' '}
            characters left.
          </p>
        </div>
      )}

      {affordances.length > 0 && (
        <div className="mt-4 border-t border-border pt-4 first:mt-0 first:border-t-0 first:pt-0">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex min-h-11 items-center gap-1 rounded-md px-1 text-sm font-semibold text-primary hover:underline"
          >
            {open
              ? <ChevronDown size={16} aria-hidden="true" />
              : <ChevronRight size={16} aria-hidden="true" />}
            Actions list
            <span className="font-normal text-text-muted">
              ({affordances.length} available)
            </span>
          </button>

          <ul id={listId} hidden={!open} className="mt-3 grid gap-2">
            {affordances.map((affordance) => (
              <li key={affordance.id}>
                <SceneControl
                  affordance={affordance}
                  busy={busy}
                  pendingAction={pendingAction}
                  onSelect={onSelect}
                  variant="menu"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
