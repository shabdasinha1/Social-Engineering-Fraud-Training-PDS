import { randomBytes } from 'node:crypto'
import { mkdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import mongoose from 'mongoose'
import {
  ARTIFACT_ID_PATTERN,
  ARTIFACT_ID_PREFIXES,
  ARTIFACT_RANDOM_BYTES,
  ARTIFACT_TEMP_DIR,
  ARTIFACT_TEMP_SUFFIX,
  EXPORT_BODY_FIELDS,
  EXPORT_FILE_EXTENSIONS,
  EXPORT_FORMATS,
  EXPORT_SCOPE_ATTEMPT,
  EXPORT_SCOPE_LEARNER,
  FORBIDDEN_EXPORT_FIELDS,
  IDEMPOTENCY_KEY_PATTERN,
  MAX_ARTIFACT_BYTES,
  OFFLINE_MARKER,
  TRAINING_MARKER,
} from '../constants/export.js'
import { env } from '../config/env.js'
import { Attempt } from '../models/Attempt.js'
import { AuditEvent } from '../models/AuditEvent.js'
import { ApiError } from '../utils/ApiError.js'
import { toCsvBuffer } from '../utils/csvWriter.js'
import { assertTransactionSupport, withEngineTransaction } from '../utils/transactions.js'
import { append } from './auditService.js'
import {
  buildAttemptReport,
  buildLearnerReport,
  learnerReportToCsvRows,
  learnerReportToPdfDocument,
  reportToCsvRows,
  reportToPdfDocument,
} from './exportReportService.js'

/**
 * Offline instructor exports (ADMIN-003).
 *
 * Specification section 6: "Exports: offline CSV/PDF summary to instructor-selected local
 * path; clearly mark training data and version."
 *
 * ### Where the file goes, and what "instructor-selected local path" means here
 *
 * The application is a Vite browser frontend talking to a local Node API. **Browser
 * JavaScript cannot choose a path on the host filesystem, and this task does not invent an
 * Electron layer to pretend otherwise.** So the backend writes into ONE controlled
 * directory - `env.exportDir`, server configuration, never client input - and returns a
 * safe artifact reference.
 *
 * That is honest rather than complete: because DEPLOY-001 runs the API on the instructor's
 * own machine at 127.0.0.1, the artifact genuinely is a local file on the instructor's
 * computer. What is missing is the native "Save As" dialog, which belongs to the desktop
 * integration layer that does not exist yet. `docs/ADMIN_EXPORTS.md` says so plainly.
 *
 * **No client-supplied path ever reaches the filesystem.** There is no code path from a
 * request body to a directory, a filename or an extension: the name is built from the
 * attempt id, the server clock and random bytes, and a request carrying a path-shaped
 * field is refused outright.
 *
 * ### The filesystem is not transactional, and this does not pretend it is
 *
 * A file write and a MongoDB commit cannot be made atomic. The sequence is therefore
 * ordered so that the failure modes are the safe ones:
 *
 *   1. build the whole report in memory
 *   2. write it to a `.pending` part-file, and verify its size on disk
 *   3. append EXPORT_CREATED inside a transaction
 *      -> if this fails, DELETE the part-file: no unaudited export is left behind
 *   4. rename the part-file into place
 *      -> if this fails, delete the part-file and report the failure loudly
 *
 * Step 4 is a rename within one directory on one filesystem, which is the cheapest and
 * most reliable operation available; it is not, however, impossible to fail, so the
 * limitation is documented rather than glossed over.
 */

const fail = (status, code, message, details = null) => {
  throw new ApiError(status, code, message, details)
}

/* ------------------------------------------------------------------ *
 * Request boundary
 * ------------------------------------------------------------------ */

/**
 * The export request, validated.
 *
 * A path-shaped field is REJECTED rather than ignored. A caller that believes it chose
 * `C:\Reports\out.csv` and got a 200 has been misled about where its data went, and where
 * the data went is the whole security question for an export.
 */
export function takeExportRequest(body = {}) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    fail(422, 'FORBIDDEN_FIELD', 'An export request must be an object.')
  }

  const keys = Object.keys(body)

  const pathShaped = keys.filter((key) => FORBIDDEN_EXPORT_FIELDS.includes(key.toLowerCase()))
  if (pathShaped.length) {
    fail(422, 'FORBIDDEN_FIELD',
      'The server decides where an export is written; a destination cannot be supplied by '
      + 'the client.', { rejected_fields: pathShaped })
  }

  const unknown = keys.filter((key) => !EXPORT_BODY_FIELDS.includes(key))
  if (unknown.length) {
    fail(422, 'FORBIDDEN_FIELD', 'That is not part of an export request.',
      { rejected_fields: unknown })
  }

  const format = body.format
  if (typeof format !== 'string' || !EXPORT_FORMATS.includes(format)) {
    fail(422, 'INVALID_EXPORT_FORMAT', `format must be one of: ${EXPORT_FORMATS.join(', ')}.`)
  }

  let idempotencyKey = null
  if (body.idempotency_key !== undefined && body.idempotency_key !== null) {
    if (typeof body.idempotency_key !== 'string'
      || !IDEMPOTENCY_KEY_PATTERN.test(body.idempotency_key)) {
      fail(422, 'INVALID_IDEMPOTENCY_KEY',
        'An idempotency key must be 8-128 characters of letters, digits, "_", ".", ":" or "-".')
    }
    idempotencyKey = body.idempotency_key
  }

  return { format, idempotencyKey }
}

/* ------------------------------------------------------------------ *
 * Paths
 * ------------------------------------------------------------------ */

/** The one directory an export may be written to. Server configuration, never a request. */
export const exportRoot = () => path.resolve(env.exportDir)

const pendingRoot = () => path.join(exportRoot(), ARTIFACT_TEMP_DIR)

/**
 * A server-generated artifact id: `training-attempt-<attempt>-<utc>-<random>`, or for a
 * learner export (ADM-007) `training-learner-<profile>-<utc>-<random>`.
 *
 * Every component is ours. Nothing a learner typed, nothing an administrator typed, and
 * nothing from a request body reaches it - which is why the id can safely BE the filename
 * stem, and why an artifact resolves without a catalog or a directory scan.
 */
export function newArtifactId(resourceId, at = new Date(), scope = EXPORT_SCOPE_ATTEMPT) {
  const stamp = new Date(at).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  return `${ARTIFACT_ID_PREFIXES[scope]}-${String(resourceId)}-${stamp}-${randomBytes(ARTIFACT_RANDOM_BYTES).toString('hex')}`
}

/**
 * An artifact id that is safe to turn into a filename.
 *
 * The pattern is an allowlist of hex, digits and two literal words, so it structurally
 * cannot contain `..`, a separator of either kind, a drive letter, a UNC prefix, a null
 * byte or a Windows reserved device name. The containment check below is the second layer,
 * not the first.
 */
export function assertSafeArtifactId(artifactId) {
  if (typeof artifactId !== 'string' || !ARTIFACT_ID_PATTERN.test(artifactId)) {
    fail(422, 'INVALID_ARTIFACT_ID', 'That is not an export artifact id.')
  }
  return artifactId
}

export const artifactFilename = (artifactId, format) =>
  `${artifactId}.${EXPORT_FILE_EXTENSIONS[format]}`

/**
 * Splits `<artifact id>.<csv|pdf>` back into its two validated halves.
 *
 * The filename is the artifact's whole identity on the read route, so it is parsed here
 * rather than pattern-matched in a route: the stem must satisfy the artifact-id allowlist
 * and the extension must be one of the two known formats. Everything else - a second dot,
 * a directory separator, a drive letter, a null byte - fails one of those two checks.
 */
export function parseArtifactFilename(filename) {
  if (typeof filename !== 'string' || filename.length > 160) {
    fail(422, 'INVALID_ARTIFACT_ID', 'That is not an export artifact.')
  }
  const dot = filename.lastIndexOf('.')
  if (dot <= 0) fail(422, 'INVALID_ARTIFACT_ID', 'That is not an export artifact.')

  const artifactId = filename.slice(0, dot)
  const extension = filename.slice(dot + 1)
  const format = EXPORT_FORMATS.find((f) => EXPORT_FILE_EXTENSIONS[f] === extension)

  if (!format) fail(422, 'INVALID_ARTIFACT_ID', 'That is not an export artifact.')
  assertSafeArtifactId(artifactId)
  return { artifactId, format }
}

/**
 * The absolute path of an artifact, proven to sit inside the export root.
 *
 * `path.resolve` collapses any traversal that survived validation, and the relative check
 * then refuses anything that escaped - including an absolute path, a different drive, and
 * a UNC path, all of which `path.relative` reports as leaving the root.
 */
export function artifactPathFor(artifactId, format) {
  assertSafeArtifactId(artifactId)
  if (!EXPORT_FORMATS.includes(format)) {
    fail(422, 'INVALID_EXPORT_FORMAT', 'That is not an export format.')
  }

  const root = exportRoot()
  const resolved = path.resolve(root, artifactFilename(artifactId, format))
  const relative = path.relative(root, resolved)

  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)
    || relative.includes(path.sep)) {
    fail(422, 'INVALID_ARTIFACT_ID', 'That artifact is not inside the export directory.')
  }
  return resolved
}

/* ------------------------------------------------------------------ *
 * Rendering
 * ------------------------------------------------------------------ */

/** The report model plus its bytes. One model, two renderings - never two datasets. */
export async function renderExport(attemptId, { format, generatedAt, generatedBy }) {
  const model = await buildAttemptReport(attemptId, { generatedAt, generatedBy, format })
  const buffer = format === 'csv'
    ? toCsvBuffer(reportToCsvRows(model))
    : reportToPdfDocument(model).buffer

  assertArtifactSize(buffer)
  return { model, buffer }
}

/** ADM-007: every completed attempt of one learner. Same two renderings, one model. */
export async function renderLearnerExport(profileId, { format, generatedAt, generatedBy }) {
  const model = await buildLearnerReport(profileId, { generatedAt, generatedBy, format })
  const buffer = format === 'csv'
    ? toCsvBuffer(learnerReportToCsvRows(model))
    : learnerReportToPdfDocument(model).buffer

  assertArtifactSize(buffer)
  return { model, buffer }
}

function assertArtifactSize(buffer) {
  if (buffer.length > MAX_ARTIFACT_BYTES) {
    fail(422, 'EXPORT_TOO_LARGE', 'This report is larger than an export is allowed to be.')
  }
}

/* ------------------------------------------------------------------ *
 * Idempotent replay
 * ------------------------------------------------------------------ */

/**
 * The result of an export that already happened, rebuilt from its audit entry.
 *
 * ADMIN-005 already stores an idempotency key under a unique index, so the audit log IS
 * the idempotency record. No second collection, no export catalog, no new model - the
 * task explicitly rules those out, and one of them would have to be kept consistent with
 * the log anyway.
 *
 * `artifact_present` is reported honestly: an instructor may have moved or deleted the
 * file, and saying it is still there would be a guess.
 */
async function replayFrom(entry) {
  if (entry.metadata?.export_scope === EXPORT_SCOPE_LEARNER) return learnerReplayFrom(entry)

  const format = entry.metadata?.export_format
  const attemptId = entry.metadata?.attempt_id ?? null
  const filePath = EXPORT_FORMATS.includes(format)
    ? artifactPathFor(entry.resource_id, format)
    : null

  let bytes = null
  let present = false
  if (filePath) {
    try {
      bytes = (await stat(filePath)).size
      present = true
    } catch {
      present = false
    }
  }

  const attempt = attemptId && mongoose.isValidObjectId(attemptId)
    ? await Attempt.findById(attemptId).select('content_version').catch(() => null)
    : null

  return {
    artifact_id: entry.resource_id,
    format,
    filename: filePath ? path.basename(filePath) : null,
    bytes,
    generated_at: entry.occurred_at,
    scope: entry.metadata?.export_scope ?? EXPORT_SCOPE_ATTEMPT,
    attempt_id: attemptId,
    content_version: attempt?.content_version ?? null,
    training_marker: TRAINING_MARKER,
    network_marker: OFFLINE_MARKER,
    location: locationFor(filePath, present),
    audit: {
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id,
      status: entry.status,
    },
    replayed: true,
  }
}

/** A learner export that already happened (ADM-007), rebuilt from its audit entry. */
async function learnerReplayFrom(entry) {
  const format = entry.metadata?.export_format
  const filePath = EXPORT_FORMATS.includes(format)
    ? artifactPathFor(entry.resource_id, format)
    : null

  let bytes = null
  let present = false
  if (filePath) {
    try {
      bytes = (await stat(filePath)).size
      present = true
    } catch {
      present = false
    }
  }

  return {
    artifact_id: entry.resource_id,
    format,
    filename: filePath ? path.basename(filePath) : null,
    bytes,
    generated_at: entry.occurred_at,
    scope: EXPORT_SCOPE_LEARNER,
    profile_id: entry.metadata?.profile_id ?? null,
    attempts_included: null,
    content_version: null,
    content_is_current: null,
    training_marker: TRAINING_MARKER,
    network_marker: OFFLINE_MARKER,
    location: locationFor(filePath, present),
    audit: {
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id,
      status: entry.status,
    },
    replayed: true,
  }
}

/**
 * An idempotency key names ONE operation. Replaying it for a different scope or a
 * different learner would hand back someone else's report, so that is a conflict.
 */
function assertSameOperation(entry, { scope, profileId = null }) {
  const entryScope = entry.metadata?.export_scope ?? EXPORT_SCOPE_ATTEMPT
  const sameLearner = scope !== EXPORT_SCOPE_LEARNER
    || entry.metadata?.profile_id === String(profileId)
  if (entry.action !== 'EXPORT_CREATED' || entryScope !== scope || !sameLearner) {
    fail(409, 'IDEMPOTENCY_KEY_REUSED',
      'That idempotency key was already used for a different operation.')
  }
}

/**
 * Where the file is.
 *
 * The absolute path is returned deliberately: the API is bound to 127.0.0.1 on the
 * instructor's own machine, so this IS the local path they need in order to open or copy
 * the report. It is admin-only, and it is the export directory the server configured -
 * never a location a client asked for.
 */
const locationFor = (filePath, present) => ({
  kind: 'local_export_directory',
  directory: exportRoot(),
  path: filePath,
  artifact_present: present,
  note: 'Written to the local export directory on this machine. Choosing an arbitrary '
    + 'destination needs the desktop integration layer, which is not built yet.',
})

/* ------------------------------------------------------------------ *
 * Create
 * ------------------------------------------------------------------ */

/**
 * Produces one export artifact and records it.
 *
 * `deps.auditAppend` exists purely so a test can prove the compensation path: that a
 * failure to record the export deletes the file rather than leaving an unaudited one on
 * disk. It defaults to the real ADMIN-005 writer and is never injected in production.
 */
export async function createAttemptExport({
  attemptId,
  format,
  idempotencyKey = null,
  actor,
} = {}, deps = {}) {
  const auditAppend = deps.auditAppend ?? append

  if (!EXPORT_FORMATS.includes(format)) {
    fail(422, 'INVALID_EXPORT_FORMAT', 'That is not an export format.')
  }

  // A retry of the same operation must not produce a second artifact or a second entry.
  if (idempotencyKey) {
    const existing = await AuditEvent.findOne({ idempotency_key: idempotencyKey })
    if (existing) {
      assertSameOperation(existing, { scope: EXPORT_SCOPE_ATTEMPT })
      return replayFrom(existing)
    }
  }

  // Checked BEFORE anything is written: an export that cannot be recorded must not reach
  // the disk in the first place, and this is the cheapest place to find that out.
  await assertTransactionSupport()

  const generatedAt = new Date()
  // Builds - and therefore validates that the attempt exists - before anything is written.
  const { model, buffer } = await renderExport(attemptId, {
    format,
    generatedAt,
    generatedBy: actor?.username ?? null,
  })

  const artifactId = newArtifactId(model.attempt.attempt_id, generatedAt)
  const finalPath = await persistArtifact({
    artifactId,
    format,
    buffer,
    actor,
    idempotencyKey,
    auditAppend,
    metadata: {
      export_format: format,
      export_scope: EXPORT_SCOPE_ATTEMPT,
      export_record_count: model.scenarios.length,
      attempt_id: model.attempt.attempt_id,
      attempt_status: model.attempt.status,
    },
  })

  return {
    artifact_id: artifactId,
    format,
    filename: artifactFilename(artifactId, format),
    bytes: buffer.length,
    generated_at: generatedAt.toISOString(),
    scope: EXPORT_SCOPE_ATTEMPT,
    attempt_id: model.attempt.attempt_id,
    content_version: model.report.content_version,
    content_is_current: model.report.content_currency.is_current,
    training_marker: TRAINING_MARKER,
    network_marker: OFFLINE_MARKER,
    location: locationFor(finalPath, true),
    audit: {
      action: 'EXPORT_CREATED',
      resource_type: 'export',
      resource_id: artifactId,
      status: 'succeeded',
    },
    replayed: false,
  }
}

/**
 * ADM-007: every completed attempt of ONE learner, as one CSV or PDF.
 *
 * The same write-verify-audit-rename sequence as an attempt export, the same controlled
 * directory, the same `EXPORT_CREATED` entry - scoped `learner` and naming the profile id.
 */
export async function createLearnerExport({
  profileId,
  format,
  idempotencyKey = null,
  actor,
} = {}, deps = {}) {
  const auditAppend = deps.auditAppend ?? append

  if (!EXPORT_FORMATS.includes(format)) {
    fail(422, 'INVALID_EXPORT_FORMAT', 'That is not an export format.')
  }

  if (idempotencyKey) {
    const existing = await AuditEvent.findOne({ idempotency_key: idempotencyKey })
    if (existing) {
      assertSameOperation(existing, { scope: EXPORT_SCOPE_LEARNER, profileId })
      return replayFrom(existing)
    }
  }

  await assertTransactionSupport()

  const generatedAt = new Date()
  // Validates the learner, and that they have a completed attempt, before anything is written.
  const { model, buffer } = await renderLearnerExport(profileId, {
    format,
    generatedAt,
    generatedBy: actor?.username ?? null,
  })

  const scenarioRows = model.attempts.reduce((sum, a) => sum + a.scenarios.length, 0)
  const artifactId = newArtifactId(model.learner.profile_id, generatedAt, EXPORT_SCOPE_LEARNER)
  const finalPath = await persistArtifact({
    artifactId,
    format,
    buffer,
    actor,
    idempotencyKey,
    auditAppend,
    metadata: {
      export_format: format,
      export_scope: EXPORT_SCOPE_LEARNER,
      export_record_count: scenarioRows,
      profile_id: model.learner.profile_id,
    },
  })

  const currency = model.attempts.map((a) => a.report.content_currency.is_current)

  return {
    artifact_id: artifactId,
    format,
    filename: artifactFilename(artifactId, format),
    bytes: buffer.length,
    generated_at: generatedAt.toISOString(),
    scope: EXPORT_SCOPE_LEARNER,
    profile_id: model.learner.profile_id,
    attempts_included: model.attempts.length,
    content_version: model.report.content_versions.join(', '),
    content_is_current: currency.includes(false) ? false
      : (currency.includes(null) ? null : true),
    training_marker: TRAINING_MARKER,
    network_marker: OFFLINE_MARKER,
    location: locationFor(finalPath, true),
    audit: {
      action: 'EXPORT_CREATED',
      resource_type: 'export',
      resource_id: artifactId,
      status: 'succeeded',
    },
    replayed: false,
  }
}

/**
 * Writes an artifact and records it, in the order that keeps the failure modes safe (see
 * the header): part-file, verify, audit inside a transaction, rename. Returns the final path.
 */
async function persistArtifact({
  artifactId, format, buffer, actor, idempotencyKey, auditAppend, metadata,
}) {
  const finalPath = artifactPathFor(artifactId, format)
  const partPath = path.join(pendingRoot(), `${artifactFilename(artifactId, format)}${ARTIFACT_TEMP_SUFFIX}`)

  await mkdir(pendingRoot(), { recursive: true })

  // --- 1. write, and verify what actually landed on disk ---------------
  try {
    // `wx` - never overwrite. A collision is a fault to surface, not a file to replace.
    await writeFile(partPath, buffer, { flag: 'wx' })
    const written = await stat(partPath)
    if (written.size !== buffer.length) {
      throw new Error(`wrote ${written.size} bytes, expected ${buffer.length}`)
    }
  } catch (error) {
    await unlink(partPath).catch(() => {})
    fail(500, 'EXPORT_WRITE_FAILED', 'The export could not be written to the export directory.',
      { reason: error.message })
  }

  // --- 2. record it. If this fails, the artifact must not survive ------
  try {
    await withEngineTransaction(async (session) => auditAppend({
      actor,
      action: 'EXPORT_CREATED',
      resourceType: 'export',
      resourceId: artifactId,
      status: 'succeeded',
      metadata,
      idempotencyKey,
      session,
    }))
  } catch (error) {
    // No unaudited export is left behind. This is the compensation the ordering exists for.
    await unlink(partPath).catch(() => {})
    throw error
  }

  // --- 3. finalise -----------------------------------------------------
  try {
    await rename(partPath, finalPath)
  } catch (error) {
    await unlink(partPath).catch(() => {})
    fail(500, 'EXPORT_FINALISE_FAILED',
      'The export was recorded but could not be placed in the export directory. '
      + 'The audit entry stands; run the export again.', { reason: error.message })
  }

  return finalPath
}

/* ------------------------------------------------------------------ *
 * Read back
 * ------------------------------------------------------------------ */

/**
 * The bytes of an artifact this server wrote.
 *
 * The only input is an artifact id, which must match the strict pattern and must resolve
 * inside the export root. Read-only, admin-only, and it appends nothing to the audit log -
 * ADMIN-005 records changes, and re-reading a file is not one.
 */
export async function readArtifact(artifactId, format) {
  const filePath = artifactPathFor(artifactId, format)
  try {
    const buffer = await readFile(filePath)
    return { buffer, filename: path.basename(filePath), bytes: buffer.length }
  } catch {
    fail(404, 'ARTIFACT_NOT_FOUND', 'No such export artifact.')
  }
  return null
}
