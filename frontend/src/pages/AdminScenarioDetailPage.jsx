import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, EyeOff, Power, PowerOff, Save } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import {
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  PageHeading,
  Pill,
  SectionCard,
  TerminalWarning,
} from '@/components/admin/AdminPrimitives'
import {
  DISPOSITION_LABELS,
  LEVEL_LABELS,
  LIFECYCLE,
  PLATFORM_LABELS,
  formatDateTime,
  label,
} from '@/constants/admin'
import { ROUTES } from '@/constants/routes'
import { useAdminDocumentTitle } from '@/hooks/useDocumentTitle'
import { adminApi } from '@/services/adminApi'

/**
 * One scenario's version history and lifecycle controls (ADMIN-001, ADMIN-006).
 *
 * ### What is shown, and what is deliberately not
 *
 * The API returns the full authoring record including `evaluation` — the answer key. This
 * screen shows the **classification and provenance** openly, and puts the answer-bearing
 * material behind an explicit disclosure that is collapsed by default and labelled as
 * such. An instructor reviewing which version is live should not have the correct answers
 * on screen by accident, and the specification's own privacy posture is that evaluation
 * data is released deliberately or not at all.
 *
 * Stage prose, synthetic assets and the scoring table are summarised by count rather than
 * reproduced: they are client-supplied content that DATA-002 imported verbatim, and this
 * screen is not an authoring surface for them.
 *
 * ### Editing
 *
 * Only `owner` and `review_date` are editable here — the provenance metadata. Editing a
 * **draft** rewrites it; editing a **published or retired** version branches the next
 * version as a draft, which is ADMIN-001's rule, and the response says which happened.
 */

function VersionCard({
  version,
  onPublish,
  onDeactivate,
  onClone,
  onEdit,
  busy,
}) {
  const [showEvaluation, setShowEvaluation] = useState(false)
  const lifecycle = LIFECYCLE[version.lifecycle]

  return (
    <SectionCard
      title={`Version ${version.version}`}
      description={lifecycle?.description}
      action={
        <Pill tone={lifecycle?.tone}>{lifecycle?.label ?? version.lifecycle}</Pill>
      }
    >
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Platform">{label(PLATFORM_LABELS, version.platform)}</Field>
        <Field label="Level">{label(LEVEL_LABELS, version.level)}</Field>
        <Field label="Disposition">{label(DISPOSITION_LABELS, version.disposition)}</Field>
        <Field label="Case family">{version.canonical_family}</Field>
        <Field label="Triggers">{version.canonical_triggers?.join(', ') || '—'}</Field>
        <Field label="Military context">{version.military_flag ? 'Yes' : 'No'}</Field>
        <Field label="Synthetic assets">{version.asset_count}</Field>
        <Field label="Stages">{version.stages?.length ?? 0} of 6</Field>
        <Field label="Owner">{version.owner || '—'}</Field>
        <Field label="Review date">{version.review_date ? formatDateTime(version.review_date) : '—'}</Field>
        <Field label="Published">{version.published_at ? formatDateTime(version.published_at) : '—'}</Field>
        <Field label="Updated">{formatDateTime(version.updated_at)}</Field>
      </dl>

      <div className="mt-5 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => setShowEvaluation((open) => !open)}
          aria-expanded={showEvaluation}
          className="flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <EyeOff size={16} aria-hidden="true" />
          {showEvaluation ? 'Hide answer key' : 'Show answer key (evaluation)'}
        </button>
        <p className="mt-1 text-sm text-text-muted">
          The expected outcome and the feedback a learner receives after finishing. Hidden by
          default so it is never on screen by accident.
        </p>

        {showEvaluation && (
          <div className="mt-3 rounded-md border border-warning/25 bg-warning-soft/40 p-4">
            {version.evaluation?.feedback ? (
              <dl className="grid gap-3">
                <Field label="What it was">{version.evaluation.feedback.result}</Field>
                <Field label="Cues">
                  <ul className="list-disc space-y-0.5 pl-5">
                    {(version.evaluation.feedback.cues ?? []).map((cue) => (
                      <li key={cue}>{cue}</li>
                    ))}
                  </ul>
                </Field>
                <Field label="Safe response">{version.evaluation.feedback.safe_action}</Field>
                <Field label="Likely impact">{version.evaluation.feedback.impact}</Field>
                <Field label="Prevention habit">
                  {version.evaluation.feedback.prevention_habit}
                </Field>
              </dl>
            ) : (
              <p className="text-sm text-text-muted">
                This version carries no feedback block.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
        {version.lifecycle !== 'published' && (
          <Button size="sm" className="min-h-11" onClick={onPublish} disabled={busy}>
            <Power size={16} aria-hidden="true" />
            Publish
          </Button>
        )}
        {version.lifecycle === 'published' && (
          <Button
            size="sm"
            variant="outline"
            className="min-h-11"
            onClick={onDeactivate}
            disabled={busy}
          >
            <PowerOff size={16} aria-hidden="true" />
            Deactivate
          </Button>
        )}
        <Button size="sm" variant="outline" className="min-h-11" onClick={onClone} disabled={busy}>
          <Copy size={16} aria-hidden="true" />
          Clone to new draft
        </Button>
        <Button size="sm" variant="ghost" className="min-h-11" onClick={onEdit} disabled={busy}>
          <Save size={16} aria-hidden="true" />
          Edit metadata
        </Button>
      </div>
    </SectionCard>
  )
}

export function AdminScenarioDetailPage() {
  const { scenarioId } = useParams()
  useAdminDocumentTitle()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState('')

  /** `{ kind, version }` — which confirmation is open, if any. */
  const [dialog, setDialog] = useState(null)
  const [dialogError, setDialogError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [editForm, setEditForm] = useState({ owner: '', review_date: '' })
  const [cloneTarget, setCloneTarget] = useState('')

  const load = useCallback((signal) => {
    /**
     * No state is set synchronously here: an effect that calls setState on the way in
     * starts a second render before the request has even left. `loading` starts true and
     * is cleared by whichever branch settles; a refetch raises it from the event that
     * caused it.
     */
    return adminApi
      .getScenario(scenarioId, { signal })
      .then((result) => {
        setData(result)
        setError(null)
        setLoading(false)
      })
      .catch((requestError) => {
        if (requestError.name === 'AbortError') return
        setError(requestError)
        setLoading(false)
      })
  }, [scenarioId])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const openDialog = (kind, version) => {
    setDialogError(null)
    if (kind === 'edit') {
      setEditForm({
        owner: version.owner ?? '',
        review_date: version.review_date ? String(version.review_date).slice(0, 10) : '',
      })
    }
    if (kind === 'clone') setCloneTarget('')
    setDialog({ kind, version })
  }

  const closeDialog = () => {
    if (busy) return
    setDialog(null)
    setDialogError(null)
  }

  /** Runs one lifecycle call, then re-reads from the server. Nothing is updated optimistically. */
  const run = async (action, successMessage) => {
    setBusy(true)
    setDialogError(null)
    try {
      const result = await action()
      setDialog(null)
      setNotice(typeof successMessage === 'function' ? successMessage(result) : successMessage)
      await load()
    } catch (actionError) {
      setDialogError(actionError)
    } finally {
      setBusy(false)
    }
  }

  const version = dialog?.version

  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.ADMIN_SCENARIOS}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        All scenarios
      </Link>

      <PageHeading
        eyebrow="Scenario bank"
        title={`Scenario ${scenarioId}`}
        description="Every version, newest first. A published version is never rewritten — editing one creates the next version as a draft."
      />

      {notice && (
        <Alert variant="success" className="items-start">
          {notice}
        </Alert>
      )}

      {loading && <LoadingState label="Loading scenario" />}
      {!loading && error && <ErrorState error={error} onRetry={() => { setLoading(true); load() }} />}

      {!loading && !error && (data?.versions ?? []).length === 0 && (
        <EmptyState title="No versions found">
          This scenario id does not exist in the bank.
        </EmptyState>
      )}

      {!loading && !error
        && (data?.versions ?? []).map((entry) => (
          <VersionCard
            key={`${entry.scenario_id}-${entry.version}`}
            version={entry}
            busy={busy}
            onPublish={() => openDialog('publish', entry)}
            onDeactivate={() => openDialog('deactivate', entry)}
            onClone={() => openDialog('clone', entry)}
            onEdit={() => openDialog('edit', entry)}
          />
        ))}

      {/* --- publish ------------------------------------------------ */}
      <ConfirmDialog
        open={dialog?.kind === 'publish'}
        title={`Publish version ${version?.version ?? ''}?`}
        description={`Scenario ${scenarioId}`}
        confirmLabel="Publish"
        busy={busy}
        error={dialogError}
        onClose={closeDialog}
        onConfirm={() =>
          run(
            () => adminApi.publishScenarioVersion(scenarioId, version.version),
            (result) =>
              result.changed
                ? `Version ${version.version} is now live.`
                : `Version ${version.version} was already live. Nothing changed.`,
          )
        }
      >
        <p className="text-sm text-balance-pretty">
          Publishing makes this version the one learners receive. Whichever version is live
          now is retired — it is preserved, not deleted, so attempts already scored against
          it still resolve.
        </p>
        <p className="text-sm text-text-muted">
          The scenario is validated before it goes live. If validation fails nothing is
          published, and the reason is shown here.
        </p>
      </ConfirmDialog>

      {/* --- deactivate --------------------------------------------- */}
      <ConfirmDialog
        open={dialog?.kind === 'deactivate'}
        title={`Deactivate version ${version?.version ?? ''}?`}
        description={`Scenario ${scenarioId}`}
        confirmLabel="Deactivate"
        confirmVariant="danger"
        busy={busy}
        error={dialogError}
        onClose={closeDialog}
        onConfirm={() =>
          run(
            () => adminApi.deactivateScenarioVersion(scenarioId, version.version),
            (result) =>
              result.changed
                ? `Version ${version.version} is retired and no longer selected.`
                : `Version ${version.version} was already inactive. Nothing changed.`,
          )
        }
      >
        <TerminalWarning>
          A retired version cannot be republished. Clone it into a new draft first.
        </TerminalWarning>
        <p className="text-sm text-balance-pretty">
          Nothing is deleted. The version stays exactly where it is and every attempt pinned
          to it still resolves — it simply stops being offered to learners.
        </p>
      </ConfirmDialog>

      {/* --- clone --------------------------------------------------- */}
      <ConfirmDialog
        open={dialog?.kind === 'clone'}
        title={`Clone version ${version?.version ?? ''}`}
        description={`Scenario ${scenarioId}`}
        confirmLabel="Create draft"
        busy={busy}
        error={dialogError}
        onClose={closeDialog}
        onConfirm={() =>
          run(
            () =>
              adminApi.cloneScenarioVersion(scenarioId, version.version, {
                targetScenarioId: cloneTarget.trim() ? cloneTarget.trim().toUpperCase() : undefined,
              }),
            (result) => `Created ${result.scenario.scenario_id} version ${result.scenario.version} as a draft.`,
          )
        }
      >
        <p className="text-sm text-balance-pretty">
          A clone copies the authoring content into a new <strong>draft</strong>. Nothing is
          published and the version cloned from is untouched.
        </p>

        <FormField
          id="clone-target"
          label="New scenario id (optional)"
          hint="Leave blank to add a draft version to this scenario. All 100 ids are currently in use, so a new id will be refused."
        >
          {({ id, describedBy }) => (
            <Input
              id={id}
              value={cloneTarget}
              onChange={(event) => setCloneTarget(event.target.value)}
              aria-describedby={describedBy}
              placeholder="e.g. W18"
              maxLength={4}
            />
          )}
        </FormField>
      </ConfirmDialog>

      {/* --- edit metadata ------------------------------------------- */}
      <ConfirmDialog
        open={dialog?.kind === 'edit'}
        title={`Edit version ${version?.version ?? ''} metadata`}
        description={`Scenario ${scenarioId}`}
        confirmLabel="Save"
        busy={busy}
        error={dialogError}
        onClose={closeDialog}
        onConfirm={() =>
          run(
            () =>
              adminApi.editScenarioVersion(scenarioId, version.version, {
                owner: editForm.owner.trim() || null,
                review_date: editForm.review_date || null,
              }),
            (result) =>
              result.edited_in_place
                ? `Draft version ${version.version} updated.`
                : `Version ${version.version} is published, so the edit created draft version ${result.created_version}.`,
          )
        }
      >
        {version?.lifecycle !== 'draft' && (
          <Alert variant="warning">
            This version is {version?.lifecycle}. It will not be rewritten — the edit creates
            the next version as a draft.
          </Alert>
        )}

        <p className="text-sm text-text-muted text-balance-pretty">
          Only provenance metadata is editable here. Scenario content — the six stages, the
          synthetic assets, the scoring table and the evaluation block — is client-supplied
          and is not authored through this screen.
        </p>

        <FormField id="edit-owner" label="Owner">
          {({ id, describedBy }) => (
            <Input
              id={id}
              value={editForm.owner}
              onChange={(event) =>
                setEditForm((previous) => ({ ...previous, owner: event.target.value }))
              }
              aria-describedby={describedBy}
              placeholder="Who maintains this scenario"
              maxLength={80}
            />
          )}
        </FormField>

        <FormField id="edit-review-date" label="Review date">
          {({ id, describedBy }) => (
            <Input
              id={id}
              type="date"
              value={editForm.review_date}
              onChange={(event) =>
                setEditForm((previous) => ({ ...previous, review_date: event.target.value }))
              }
              aria-describedby={describedBy}
            />
          )}
        </FormField>
      </ConfirmDialog>
    </div>
  )
}
