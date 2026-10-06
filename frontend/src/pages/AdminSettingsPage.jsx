import { useCallback, useEffect, useState } from 'react'
import { Clock, Info, Save, Timer } from 'lucide-react'
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
import { FEEDBACK_TIMING_LABELS, formatDateTime, formatDurationMinutes } from '@/constants/admin'
import { useAdminDocumentTitle } from '@/hooks/useDocumentTitle'
import { adminApi } from '@/services/adminApi'
import { cn } from '@/utils/cn'

/**
 * Feedback timing (ADMIN-004, ADMIN-006).
 *
 * SATARK is a direct assessment flow, so only the assessment feedback timing is offered.
 * ADMIN-004's configuration contract still stores a training value; it is no longer shown
 * or sent from here (a PATCH carries only the keys it changes), so the stored value is left
 * as it is and the API is unchanged. There is deliberately nothing here for
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
 *
 * ### Assessment duration
 *
 * The default time limit for NEW assessments, one of the five values the server allows.
 * The server snapshots it into each attempt when it starts, and refuses a change (409
 * ASSESSMENT_IN_PROGRESS) while any assessment is running - the warning and the disabled
 * button here only mirror that rule, they do not enforce it.
 */
/** "On completion — when the attempt finishes" -> "On completion", for the summary strip. */
const shortTiming = (value) => (FEEDBACK_TIMING_LABELS[value] ?? value).split(' — ')[0]

export function AdminSettingsPage() {
  useAdminDocumentTitle()

  const [data, setData] = useState(null)
  const [form, setForm] = useState({ assessment: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [duration, setDuration] = useState(null)
  const [durationForm, setDurationForm] = useState('')
  const [durationError, setDurationError] = useState(null)
  const [durationNotice, setDurationNotice] = useState('')
  const [savingDuration, setSavingDuration] = useState(false)

  const apply = useCallback((result) => {
    setData(result)
    setForm({ assessment: result.config.assessment_feedback_timing })
  }, [])

  const load = useCallback((signal) => {
    /**
     * No state is set synchronously here: an effect that calls setState on the way in
     * starts a second render before the request has even left. `loading` starts true and
     * is cleared by whichever branch settles; a refetch raises it from the event that
     * caused it.
     */
    return Promise.all([
      adminApi.getFeedbackConfig({ signal }),
      adminApi.getAssessmentDuration({ signal }),
    ])
      .then(([result, durationResult]) => {
        apply(result)
        setDuration(durationResult)
        setDurationForm(String(durationResult.config.assessment_duration_minutes))
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

  const saveDuration = async () => {
    setSavingDuration(true)
    setDurationError(null)
    setDurationNotice('')
    try {
      const result = await adminApi.updateAssessmentDuration({
        minutes: Number(durationForm),
        expectedConfigVersion: data.config.config_version,
      })
      // One settings document: keep the shared version current without touching the
      // feedback form's unsaved edits.
      setData((previous) => ({ ...previous, config: result.config }))
      setDuration((previous) => ({ ...previous, config: result.config }))
      setDurationForm(String(result.config.assessment_duration_minutes))
      setDurationNotice(
        result.changed
          ? `Saved. New assessments will run for ${formatDurationMinutes(result.config.assessment_duration_minutes)}.`
          : 'Nothing changed — that duration was already in force.',
      )
    } catch (updateError) {
      setDurationError(updateError)
      if (updateError.code === 'ASSESSMENT_IN_PROGRESS') {
        setDuration((previous) => ({
          ...previous,
          running_assessments: updateError.details?.running_assessments ?? 1,
        }))
      }
    } finally {
      setSavingDuration(false)
    }
  }

  if (loading) return <LoadingState label="Loading configuration" />
  if (error) return <ErrorState error={error} onRetry={() => { setLoading(true); load() }} />
  if (!data) return null

  const options = (data.allowed_timings ?? []).map((value) => ({
    value,
    label: FEEDBACK_TIMING_LABELS[value] ?? value,
  }))
  const dirty = form.assessment !== data.config.assessment_feedback_timing
  const stale = saveError?.code === 'CONFIG_VERSION_CONFLICT'

  const currentDuration = data.config.assessment_duration_minutes ?? duration?.default_duration_minutes
  const durationOptions = (duration?.allowed_durations_minutes ?? []).map((minutes) => ({
    value: String(minutes),
    label: formatDurationMinutes(minutes),
  }))
  const running = duration?.running_assessments ?? 0
  const durationDirty = durationForm !== String(currentDuration)

  return (
    <div className="space-y-section">
      <PageHeading
        eyebrow="Configuration"
        title="Settings"
        description="Feedback timing and the assessment duration are the only configurable settings. Scoring, the taxonomies and scenario selection are fixed and cannot be changed here."
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
              label="Assessment"
              value={form.assessment}
              options={options}
              onChange={(value) => setForm((previous) => ({ ...previous, assessment: value }))}
            />
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

          <dl className="mt-3 grid gap-3 rounded-md bg-secondary-soft/60 px-3 py-2.5 sm:grid-cols-3">
            <Field label="Assessment">
              {shortTiming(data.config.assessment_feedback_timing)}
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

        <SectionCard
          icon={Timer}
          title="Assessment duration"
          description="The time limit for assessments started from now on. An assessment that has already started keeps the time it started with."
          className={cn('lg:col-span-2', enter)}
          style={staggerStyle(3)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectFilter
              id="assessment-duration"
              label="Assessment duration"
              value={durationForm}
              options={durationOptions}
              onChange={setDurationForm}
            />
          </div>

          <div aria-live="polite" className="space-y-3 [&:not(:empty)]:mt-3">
            {running > 0 && (
              <Alert variant="warning" title="An assessment is currently running">
                The assessment duration cannot be changed while an assessment is currently
                running ({running === 1 ? '1 assessment' : `${running} assessments`} in progress).
                Try again once they have finished.
              </Alert>
            )}
            {durationNotice && <Alert variant="success">{durationNotice}</Alert>}
            {/* ASSESSMENT_IN_PROGRESS is already explained by the warning above. */}
            {durationError?.code !== 'ASSESSMENT_IN_PROGRESS' && <ErrorState error={durationError} />}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3">
            <Button
              size="sm"
              className="min-h-11"
              onClick={saveDuration}
              loading={savingDuration}
              disabled={!durationDirty || running > 0}
            >
              {!savingDuration && <Save size={16} aria-hidden="true" />}
              Save duration
            </Button>
          </div>

          <dl className="mt-3 grid gap-3 rounded-md bg-secondary-soft/60 px-3 py-2.5 sm:grid-cols-2">
            <Field label="Current duration">
              {currentDuration ? formatDurationMinutes(currentDuration) : '—'}
            </Field>
            <Field label="Assessments running">{running}</Field>
          </dl>
        </SectionCard>
      </div>
    </div>
  )
}
