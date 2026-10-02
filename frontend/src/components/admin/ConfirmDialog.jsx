import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ErrorState } from '@/components/admin/AdminPrimitives'

/**
 * The confirmation step every consequential instructor action goes through (ADMIN-006).
 *
 * Reuses the simulation's `Modal`, which already has a real focus trap, Escape handling
 * and focus restoration - the client acceptance list requires keyboard-only completion,
 * and there is no reason the instructor area should have a weaker dialog than the learner
 * one.
 *
 * Two properties this adds on top:
 *
 * 1. **The dialog cannot be dismissed while the request is in flight.** Closing mid-flight
 *    would leave the instructor unsure whether a reset happened, and this area's actions
 *    are ones you must not be unsure about.
 * 2. **The error is shown inside the dialog, not behind it.** A failure belongs where the
 *    decision was made, and the dialog stays open so the action can be retried or
 *    abandoned deliberately.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmVariant = 'primary',
  busy = false,
  error = null,
  onConfirm,
  onClose,
  children,
}) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={busy ? () => {} : onClose}
    >
      <div className="space-y-4">
        {children}

        <ErrorState error={error} />

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
