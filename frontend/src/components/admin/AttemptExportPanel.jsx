import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, FolderOpen } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { ErrorState, Field, SectionCard } from '@/components/admin/AdminPrimitives'
import { formatDateTime } from '@/constants/admin'
import { adminApi } from '@/services/adminApi'

/**
 * Offline CSV and PDF export for one attempt (ADMIN-003, ADMIN-006) or one learner (ADM-007).
 *
 * ### What this screen does not pretend
 *
 * A browser cannot choose a path on the host filesystem, and this does not imply
 * otherwise. The server writes the artifact into its own configured local export
 * directory and returns where it put it; that path is shown as a fact, not offered as a
 * choice, and there is no "Save as…" here because the desktop layer that would provide one
 * does not exist. The wording says so plainly rather than leaving an instructor to work it
 * out.
 *
 * "Save a copy" is a second, separate thing: it re-reads the artifact the server already
 * wrote and hands it to the browser's own download. It creates nothing.
 *
 * Every artifact is marked TRAINING SIMULATION / OFFLINE and carries the content version;
 * that is repeated here so an instructor knows what they are about to hand someone.
 */
export function AttemptExportPanel({ attemptId }) {
  return (
    <ExportPanel
      title="Export this attempt"
      description="A report file, written by the training server. Both formats contain the same figures."
      create={(format) => adminApi.createAttemptExport(attemptId, { format })}
    />
  )
}

/**
 * ADM-007: every COMPLETED attempt of one learner in one file - learner header, attempt
 * summary, every scenario row, breakdowns and remediation. Same server contract, same
 * markers and the same audit entry as an attempt export.
 */
export function LearnerExportPanel({ learner }) {
  return (
    <ExportPanel
      key={learner.profile_id}
      title="Export learner"
      description={`All completed attempts for ${learner.display_name} (${learner.service_no_masked}) in one report file.`}
      create={(format) => adminApi.createLearnerExport(learner.profile_id, { format })}
    />
  )
}

function ExportPanel({ title, description, create }) {
  const [busyFormat, setBusyFormat] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)

  const createExport = async (format) => {
    setBusyFormat(format)
    setError(null)
    setResult(null)
    try {
      const data = await create(format)
      setResult(data.export)
    } catch (exportError) {
      setError(exportError)
    } finally {
      setBusyFormat(null)
    }
  }

  /**
   * Saves a copy through the browser's own download.
   *
   * The object URL is revoked immediately after the click: leaving it alive keeps the
   * whole file in memory for the life of the tab, and an instructor may export many.
   */
  const saveCopy = async () => {
    if (!result?.filename) return
    setDownloading(true)
    setError(null)
    try {
      const blob = await adminApi.downloadExportArtifact(result.filename)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = result.filename
      document.body.append(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (downloadError) {
      setError(downloadError)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <SectionCard title={title} description={description} icon={Download}>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="min-h-11"
          onClick={() => createExport('csv')}
          loading={busyFormat === 'csv'}
          disabled={busyFormat !== null}
        >
          {busyFormat !== 'csv' && <FileSpreadsheet size={17} aria-hidden="true" />}
          Export CSV
        </Button>
        <Button
          variant="outline"
          className="min-h-11"
          onClick={() => createExport('pdf')}
          loading={busyFormat === 'pdf'}
          disabled={busyFormat !== null}
        >
          {busyFormat !== 'pdf' && <FileText size={17} aria-hidden="true" />}
          Export PDF
        </Button>
      </div>

      <p className="mt-3 text-sm text-balance-pretty text-text-muted">
        Exports contain <strong>synthetic training data</strong> and are marked TRAINING
        SIMULATION and OFFLINE. They carry the learner&apos;s display name and a masked
        service number, never the full number and never anything they typed.
      </p>

      <div aria-live="polite" className="space-y-3 [&:not(:empty)]:mt-3">
        <ErrorState error={error} />

        {result && (
          <Alert variant="success" title={`${result.format.toUpperCase()} export ready`}>
            <dl className="mt-2 grid gap-3 sm:grid-cols-2">
              <Field label="File">{result.filename}</Field>
              <Field label="Size">{`${Math.max(Math.round(result.bytes / 1024), 1)} KB`}</Field>
              <Field label="Generated">{formatDateTime(result.generated_at)}</Field>
              {result.attempts_included != null && (
                <Field label="Completed attempts">{result.attempts_included}</Field>
              )}
              <Field label="Content version">
                {result.content_version}
                {result.content_is_current === false && ' (superseded)'}
              </Field>
              <Field label="Marked" className="sm:col-span-2">
                {result.training_marker} · {result.network_marker}
              </Field>
            </dl>

            <p className="mt-3 flex items-start gap-2 text-sm">
              <FolderOpen size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span className="break-all">
                Written to the server&apos;s export folder:{' '}
                <code className="rounded bg-secondary-soft px-1">{result.location?.path}</code>
              </span>
            </p>
            <p className="mt-1 text-sm">
              Choosing a different folder needs the desktop integration that is not built
              yet. Use <strong>Save a copy</strong> to download it through the browser
              instead.
            </p>

            <Button
              variant="outline"
              size="sm"
              className="mt-3 min-h-11"
              onClick={saveCopy}
              loading={downloading}
            >
              {!downloading && <Download size={16} aria-hidden="true" />}
              Save a copy
            </Button>
          </Alert>
        )}
      </div>
    </SectionCard>
  )
}
