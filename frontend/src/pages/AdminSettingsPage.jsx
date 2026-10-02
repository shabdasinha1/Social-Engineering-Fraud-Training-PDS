import { useCallback, useEffect, useState } from 'react'
import { Clock, Info, Save } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import {
  ErrorState,
  Field,
  LoadingState,
  PageHeading,
  SectionCard,
  SelectFilter,
} from '@/components/admin/AdminPrimitives'
import { enter, staggerStyle } from '@/components/admin/adminUi'
import { FEEDBACK_TIMING_LABELS, formatDateTime } from '@/constants/admin'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { adminApi } from '@/services/adminApi'
import { cn } from '@/utils/cn'

/**
 * Feedback timing (ADMIN-004, ADMIN-006).
 *
 * The whole configurable surface of this product is two enum fields — when feedback may be
 * shown in assessment mode and in training mode. The assessment flow only ever uses the
 * first; the training value is kept (and still editable) because ADMIN-004's configuration
 * contract stores and validates both, and removing it would be an API change
 * (ENHANCEMENT-001B lists it first and labels the second as unused, and changes nothing else). There is deliberately nothing here for
 * scoring, either taxonomy, scenario selection, evaluation keys or any security or network
 * setting; the server would refuse those, and offering them would misrepresent what an
 * instructor controls.
 *
 * ### The options come from the server
 *
 * `allowed_timings` is read from the API rather than hard-coded, so the form cannot offer
 * a value the backend would reject.
 *
 * ### No optimistic update
 *
 * This is authoritative configuration. The form shows what the server last confirmed; on
 * save it re-reads the response and re-renders from that. `expected_config_version` is sent
 * from the value that was read, so an instructor working from a stale screen gets a
 * conflict and a prompt to reload rather than silently overwriting a colleague.
 *
 * ### The enforcement note is the server's, not ours
 *
 * ADMIN-004 returns an `enforcement` block saying what each timing does. It is rendered
 * verbatim, so the screen can never claim more than the server does. Since ADM-007 both
 * timings take effect on the learner's resolve step.
 */
/** "On completion — when the attempt finishes" -> "On completion", for the summary strip. */
const shortTiming = (value) => (FEEDBACK_TIMING_LABELS[value] ?? value).split(' — ')[0]

export function AdminSettingsPage() {
  useDocumentTitle('Settings')

  const [data, setData] = useState(null)
  const [form, setForm] = useState({ training: '', assessment: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  const apply = useCallback((result) => {
    setData(result)
    setForm({
      training: result.config.training_feedback_timing,
      assessment: result.config.assessment_feedback_timing,
    })
  }, [])

  const load = useCallback((signal) => {
    /**
     * No state is set synchronously here: an effect that calls setState on the way in
     * starts a second render before the request has even left. `loading` starts true and
     * is cleared by whichever branch settles; a refetch raises it from the event that
     * caused it.
     */
    return adminApi
      .getFeedbackConfig({ signal })
      .then((result) => {
        apply(result)
        setError(null)
        setLoading(false)
      })
      .catch((requestError) => {
        if (requestError.name === 'AbortError') return
        setError(requestError)
        setLoading(false)
      })
  }, [apply])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const save = async () => {
    setSaving(true)
    setSaveError(null)
    setNotice('')
    try {
      const result = await adminApi.updateFeedbackConfig({
        trainingTiming: form.training,
        assessmentTiming: form.assessment,
        expectedConfigVersion: data.config.config_version,
      })
      // Re-render from what the server confirmed, never from the local form.
      apply({ ...data, config: result.config, allowed_timings: result.allowed_timings })
      setNotice(
        result.changed
          ? `Saved. ${result.changed_keys.length === 1 ? 'One setting' : `${result.changed_keys.length} settings`} updated.`
          : 'Nothing changed — those values were already in force.',
      )
    } catch (updateError) {
      setSaveError(updateError)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Loading configuration" />
  if (error) return <ErrorState error={error} onRetry={() => { setLoading(true); load() }} />
  if (!data) return null

  const options = (data.allowed_timings ?? []).map((value) => ({
    value,
    label: FEEDBACK_TIMING_LABELS[value] ?? value,
  }))
  const dirty =
    form.training !== data.config.training_feedback_timing
    || form.assessment !== data.config.assessment_feedback_timing
  const stale = saveError?.code === 'CONFIG_VERSION_CONFLICT'

  return (
    <div className="space-y-section">
      <PageHeading
        eyebrow="Configuration"
        title="Settings"
        description="Feedback timing is the only configurable setting. Scoring, the taxonomies and scenario selection are fixed and cannot be changed here."
      />

      <div className="grid items-start gap-grid lg:grid-cols-3">
        <SectionCard
          icon={Clock}
          title="Feedback timing"
          description="When a learner may be shown the feedback for a scenario."
          className={cn('lg:col-span-2', enter)}
          style={staggerStyle(1)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectFilter
              id="assessment-timing"
              label="Assessment mode"
              value={form.assessment}
              options={options}
              onChange={(value) => setForm((previous) => ({ ...previous, assessment: value }))}
            />
            <div className="min-w-0">
              <SelectFilter
                id="training-timing"
                label="Training mode"
                value={form.training}
                options={options}
                onChange={(value) => setForm((previous) => ({ ...previous, training: value }))}
              />
              <p className="mt-1 text-xs text-text-muted">
                Not used by the assessment flow. Kept because the configuration contract
                stores both values.
              </p>
            </div>
          </div>

          <div aria-live="polite" className="space-y-3 [&:not(:empty)]:mt-3">
            {notice && <Alert variant="success">{notice}</Alert>}

            {stale ? (
              <Alert variant="warning" title="This page is out of date">
                Someone else changed the configuration since this screen loaded. Reload to see
                the current values, then make the change again.
                <div className="mt-3">
                  <Button variant="outline" size="sm" className="min-h-11" onClick={() => { setLoading(true); load() }}>
                    Reload configuration
                  </Button>
                </div>
              </Alert>
            ) : (
              <ErrorState error={saveError} />
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3">
            <Button size="sm" className="min-h-11" onClick={save} loading={saving} disabled={!dirty}>
              {!saving && <Save size={16} aria-hidden="true" />}
              Save changes
            </Button>
            {!dirty && (
              <p className="text-sm text-text-muted">No changes to save.</p>
            )}
          </div>

          <dl className="mt-3 grid gap-3 rounded-md bg-secondary-soft/60 px-3 py-2.5 sm:grid-cols-4">
            <Field label="Assessment">
              {shortTiming(data.config.assessment_feedback_timing)}
            </Field>
            <Field label="Training">
              {shortTiming(data.config.training_feedback_timing)}
            </Field>
            <Field label="Version">{data.config.config_version}</Field>
            <Field label="Last changed">
              {data.config.updated_at ? formatDateTime(data.config.updated_at) : 'Never'}
              {data.config.updated_by_username ? ` by ${data.config.updated_by_username}` : ''}
            </Field>
          </dl>
        </SectionCard>

        <SectionCard title="What takes effect" icon={Info} className={enter} style={staggerStyle(2)}>
          <ul className="space-y-2.5 text-sm">
            {Object.entries(data.enforcement ?? {}).map(([timing, note]) => (
              <li key={timing} className="text-balance-pretty">
                <strong className="block text-text">{FEEDBACK_TIMING_LABELS[timing] ?? timing}</strong>
                <span className="text-text-muted">{note}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  )
}
