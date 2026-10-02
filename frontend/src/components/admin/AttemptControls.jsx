import { useState } from 'react'
import { Archive, RotateCcw, ShieldAlert } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { SectionCard, SelectFilter, TerminalWarning } from '@/components/admin/AdminPrimitives'
import { ARCHIVE_REASONS, RESET_REASONS } from '@/constants/admin'
import { adminApi } from '@/services/adminApi'

/**
 * The two instructor controls that act on one attempt's learner (ADMIN-004, ADMIN-006).
 *
 * ### Reset is offered only where it is possible
 *
 * The button exists only for an attempt the server would actually reset - one still
 * `in_progress`. For a completed attempt the control is **absent**, with a sentence saying
 * why, rather than present-and-disabled: a disabled destructive control invites an
 * instructor to hunt for the way to enable it, and there isn't one. An already-reset
 * attempt says so too.
 *
 * ### Nothing is updated optimistically
 *
 * Both actions re-read the attempt from the server afterwards through `onChanged`. These
 * are audited state transitions on a learner's record; showing a hoped-for outcome and
 * reconciling later is the wrong trade here.
 *
 * ### The language is accurate
 *
 * A reset is terminal and says so. An archive is **not** a deletion, and the copy never
 * uses delete language - it says what is preserved, because that is the property an
 * instructor is actually being asked to accept.
 */
export function AttemptControls({ attempt, onChanged }) {
  const [dialog, setDialog] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState('')
  const [resetReason, setResetReason] = useState('')
  const [archiveReason, setArchiveReason] = useState('')

  const resettable = attempt.status === 'in_progress'
  const alreadyReset = attempt.status === 'abandoned'
  const profileId = attempt.profile?.profile_id

  const close = () => {
    if (busy) return
    setDialog(null)
    setError(null)
  }

  const run = async (action, message) => {
    setBusy(true)
    setError(null)
    try {
      const result = await action()
      setDialog(null)
      setNotice(typeof message === 'function' ? message(result) : message)
      await onChanged?.()
    } catch (actionError) {
      setError(actionError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SectionCard
      icon={ShieldAlert}
      title="Instructor controls"
      description="Each action is recorded in the audit log. Neither can be undone from this screen."
    >
      {notice && (
        <Alert variant="success" className="mb-4">
          {notice}
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        {resettable && (
          <Button
            variant="danger"
            className="min-h-11"
            onClick={() => {
              setResetReason('')
              setError(null)
              setDialog('reset')
            }}
          >
            <RotateCcw size={17} aria-hidden="true" />
            Reset attempt
          </Button>
        )}

        <Button
          variant="outline"
          className="min-h-11"
          disabled={!profileId}
          onClick={() => {
            setArchiveReason('')
            setError(null)
            setDialog('archive')
          }}
        >
          <Archive size={17} aria-hidden="true" />
          Archive learner profile
        </Button>
      </div>

      {!resettable && (
        <p className="mt-3 text-sm text-balance-pretty text-text-muted">
          {alreadyReset
            ? 'This attempt has already been reset. It cannot be reset again, and it cannot be resumed.'
            : 'Reset is not offered: only an attempt that is still in progress can be reset. A completed attempt is history and is never reopened.'}
        </p>
      )}

      {/* --- reset --------------------------------------------------- */}
      <ConfirmDialog
        open={dialog === 'reset'}
        title="Reset this attempt?"
        description="The learner will not be able to resume it."
        confirmLabel="Reset attempt"
        confirmVariant="danger"
        busy={busy}
        error={error}
        onClose={close}
        onConfirm={() =>
          run(
            () => adminApi.resetAttempt(attempt.attempt_id, {
              reasonCode: resetReason || undefined,
            }),
            (result) =>
              result.reset.changed
                ? 'The attempt was reset. The learner can now start a new one.'
                : 'This attempt had already been reset. Nothing changed.',
          )
        }
      >
        <TerminalWarning>
          A reset cannot be undone. The learner starts a fresh attempt instead — this one is
          never reopened.
        </TerminalWarning>

        <ul className="list-disc space-y-1 pl-5 text-sm text-balance-pretty">
          <li>Nothing is deleted. The scenarios already resolved keep their scores.</li>
          <li>No total score is produced, and no result is created for this attempt.</li>
          <li>It stays visible here, and it can still be exported.</li>
        </ul>

        <SelectFilter
          id="reset-reason"
          label="Reason (optional)"
          value={resetReason}
          options={RESET_REASONS}
          onChange={setResetReason}
        />
      </ConfirmDialog>

      {/* --- archive -------------------------------------------------- */}
      <ConfirmDialog
        open={dialog === 'archive'}
        title="Archive this learner profile?"
        description={attempt.profile?.display_name ?? undefined}
        confirmLabel="Archive profile"
        busy={busy}
        error={error}
        onClose={close}
        onConfirm={() =>
          run(
            () => adminApi.archiveProfile(profileId, {
              reasonCode: archiveReason || undefined,
            }),
            (result) =>
              result.profile.changed
                ? 'The profile is archived. The learner can no longer sign in.'
                : 'This profile was already archived. Nothing changed.',
          )
        }
      >
        <Alert variant="info" title="Archiving is not deletion">
          The profile and every record it holds are kept: completed attempts, attempts still
          in progress, all scenario runs, the event ledger and the audit history. You can
          still open and export them here.
        </Alert>

        <ul className="list-disc space-y-1 pl-5 text-sm text-balance-pretty">
          <li>The learner can no longer sign in, and any session they have open stops working.</li>
          <li>Signing in again will not reinstate the profile.</li>
          <li>
            An attempt still in progress is left exactly as it is. Reset it separately if it
            should also be closed.
          </li>
          <li>There is no way to reinstate a profile from this screen.</li>
        </ul>

        <SelectFilter
          id="archive-reason"
          label="Reason (optional)"
          value={archiveReason}
          options={ARCHIVE_REASONS}
          onChange={setArchiveReason}
        />
      </ConfirmDialog>
    </SectionCard>
  )
}
