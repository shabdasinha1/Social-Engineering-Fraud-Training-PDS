import { EXPORT_CONTENT_TYPES } from '../constants/export.js'
import {
  createAttemptExport,
  createLearnerExport,
  parseArtifactFilename,
  readArtifact,
  takeExportRequest,
} from '../services/exportService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/**
 * The instructor export HTTP surface (ADMIN-003).
 *
 * Two routes, both behind `requireAdmin`. The handlers translate a request into a service
 * call and nothing more: no path is built here, no format is inferred here, and no
 * filesystem call is made here.
 *
 * **There is no candidate-facing export.** A learner sees their own result through the
 * RESULT-001 screen; a report file naming a learner, their score and their weak families
 * is an instructor artefact.
 */

/**
 * POST /api/admin/exports/attempts/:attemptId
 *
 * Body: `{ "format": "csv" | "pdf", "idempotency_key"?: "..." }` and nothing else. A
 * path-shaped field is rejected rather than ignored - the server decides where an export
 * is written, and a client that thinks otherwise must be told.
 */
export const postAttemptExport = asyncHandler(async (req, res) => {
  const { format, idempotencyKey } = takeExportRequest(req.body ?? {})

  const result = await createAttemptExport({
    attemptId: req.params.attemptId,
    format,
    idempotencyKey,
    actor: req.admin,
  })

  // A replayed export created nothing, so it is a 200; a new one is a 201.
  res.status(result.replayed ? 200 : 201).json({ export: result })
})

/**
 * POST /api/admin/exports/learners/:profileId  (ADM-007)
 *
 * Every completed attempt of one learner, as one CSV or PDF. Same body contract as the
 * attempt export - `format` and an optional `idempotency_key`, a path-shaped field refused.
 */
export const postLearnerExport = asyncHandler(async (req, res) => {
  const { format, idempotencyKey } = takeExportRequest(req.body ?? {})

  const result = await createLearnerExport({
    profileId: req.params.profileId,
    format,
    idempotencyKey,
    actor: req.admin,
  })

  res.status(result.replayed ? 200 : 201).json({ export: result })
})

/**
 * GET /api/admin/exports/:filename
 *
 * Returns the bytes of an artifact this server wrote, so a later admin UI can offer the
 * instructor a "save a copy" without a second mechanism. The only input is the filename,
 * whose stem must satisfy the artifact-id allowlist and whose extension must be a known
 * format; nothing else can address a file.
 *
 * Read-only, and it appends no audit entry - ADMIN-005 records changes, and re-reading a
 * file that was already recorded when it was created is not one.
 */
export const getExportArtifact = asyncHandler(async (req, res) => {
  const { artifactId, format } = parseArtifactFilename(req.params.filename)
  const { buffer, filename, bytes } = await readArtifact(artifactId, format)

  res.setHeader('Content-Type', EXPORT_CONTENT_TYPES[format])
  res.setHeader('Content-Length', bytes)
  // `attachment` with a server-generated filename: the name contains only hex, digits and
  // two literal words, so it cannot carry a header injection or a misleading extension.
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.send(buffer)
})
