import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import mongoose from 'mongoose'
import { createApp } from '../src/app.js'
import { env } from '../src/config/env.js'
import { AdminUser } from '../src/models/AdminUser.js'
import { Attempt } from '../src/models/Attempt.js'
import { AuditEvent } from '../src/models/AuditEvent.js'
import { Candidate } from '../src/models/Candidate.js'
import { ScenarioDefinition } from '../src/models/ScenarioDefinition.js'
import { ScenarioEvent } from '../src/models/ScenarioEvent.js'
import { ScenarioRun } from '../src/models/ScenarioRun.js'
import { createAdminUser } from '../src/services/adminService.js'
import { createAttemptExport } from '../src/services/exportService.js'
import { buildAttemptReport } from '../src/services/exportReportService.js'
import {
  loadSourceScenarios,
  loadTaxonomies,
  toScenarioDefinition,
} from '../src/services/scenarioDefinitionImportService.js'
import { detectTransactionSupport } from '../src/utils/transactions.js'
import { ARTIFACT_TEMP_DIR, OFFLINE_MARKER, TRAINING_MARKER } from '../src/constants/export.js'
import { codeFor } from './helpers/learnerActions.js'

/**
 * ADMIN-003 - offline exports over real HTTP, against a real replica set and a real
 * filesystem.
 *
 * Attempts are played through the REAL candidate API, so the figures in an exported report
 * are the ones the engine actually committed. The export directory is redirected to a
 * throwaway temporary directory for the whole suite, so no test ever writes into the
 * repository's own `backend/exports`.
 *
 *   npm run test:engine
 */

const URI = process.env.ENGINE_TEST_MONGO_URI
let ready = false
let skipReason = 'ENGINE_TEST_MONGO_URI is not set'
let server
let base
let exportDir

if (URI) {
  try {
    await mongoose.connect(URI, { serverSelectionTimeoutMS: 4000 })
    const topology = await detectTransactionSupport()
    if (!topology.supported) {
      skipReason = `configured MongoDB does not support transactions (${topology.topology ?? topology.reason})`
      await mongoose.disconnect()
    } else {
      const taxonomies = await loadTaxonomies()
      const { scenarios } = await loadSourceScenarios()
      await ScenarioDefinition.deleteMany({})
      await ScenarioDefinition.insertMany(
        scenarios.map((r) => toScenarioDefinition(r, taxonomies).doc),
      )
      await Promise.all([
        Attempt.deleteMany({}), ScenarioRun.deleteMany({}), ScenarioEvent.deleteMany({}),
        Candidate.deleteMany({}), AdminUser.deleteMany({}),
      ])
      await AuditEvent.collection.deleteMany({})
      await createAdminUser({ username: 'export-admin', password: 'a-long-training-password' })

      // Every artifact this suite writes lands here, never in backend/exports.
      exportDir = await mkdtemp(path.join(tmpdir(), 'admin003-'))
      env.exportDir = exportDir

      const app = createApp()
      server = app.listen(0, '127.0.0.1')
      await new Promise((r) => server.once('listening', r))
      base = `http://127.0.0.1:${server.address().port}/api`
      ready = true
    }
  } catch (error) {
    skipReason = `could not start: ${error.message.split('\n')[0]}`
  }
}

if (!ready) {
  // eslint-disable-next-line no-console
  console.warn(`\n[ADMIN-003] export tests SKIPPED - ${skipReason}\n`)
}

const it = (name, fn) => test(name, { skip: ready ? false : skipReason }, fn)

/* ------------------------------------------------------------------ *
 * helpers
 * ------------------------------------------------------------------ */

async function call(path_, { method = 'GET', body, cookie, raw = false } = {}) {
  const res = await fetch(`${base}${path_}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (raw) {
    return {
      status: res.status,
      headers: res.headers,
      buffer: Buffer.from(await res.arrayBuffer()),
    }
  }
  const data = await res.json().catch(() => null)
  return { status: res.status, data, cookie: res.headers.getSetCookie?.()[0]?.split(';')[0] }
}

async function adminCookie() {
  const res = await call('/admin/login', {
    method: 'POST',
    body: { username: 'export-admin', password: 'a-long-training-password' },
  })
  assert.equal(res.status, 200, `admin login failed: ${JSON.stringify(res.data)}`)
  return res.cookie
}

let idSeq = 0
const nextIdentifier = () => `EX${String(400000 + (idSeq += 1))}`
let keySeq = 0
const key = (label) => `${label}-${Date.now()}-${(keySeq += 1)}`

async function signIn(name, identifier) {
  const res = await call('/candidates', { method: 'POST', body: { name, identifier } })
  assert.equal(res.status, 201, `sign-in failed: ${JSON.stringify(res.data)}`)
  return res.cookie
}

/** CRLF or LF, whichever the writer emitted. */
const SPLIT_LINES = /\r?\n/

/** Deliberately hostile typed content: a formula lead-in and a fake secret. */
const TYPED_RATIONALE = '=cmd|"/c calc"!A1 MY-TYPED-RATIONALE-otp-482915'

async function walkSafely(cookie, attemptId, runId, resolution) {
  for (const intent of ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_trusted_directory']) {
    const r = await call(`/attempts/${attemptId}/runs/${runId}/events`, {
      method: 'POST', cookie, body: { action_code: await codeFor(runId, intent), intent_key: key(intent) },
    })
    assert.equal(r.status, 200, `${intent} failed: ${JSON.stringify(r.data)}`)
  }
  return call(`/attempts/${attemptId}/runs/${runId}/resolve`, {
    method: 'POST',
    cookie,
    body: { action_code: await codeFor(runId, `resolve_${resolution}`), intent_key: key('resolve'), rationale: TYPED_RATIONALE },
  })
}

async function walkUnsafely(cookie, attemptId, runId, resolution) {
  for (const intent of ['open_item', 'read', 'skip_inspection', 'submit_data', 'verify_in_message_contact']) {
    await call(`/attempts/${attemptId}/runs/${runId}/events`, {
      method: 'POST', cookie, body: { action_code: await codeFor(runId, intent), intent_key: key(intent) },
    })
  }
  return call(`/attempts/${attemptId}/runs/${runId}/resolve`, {
    method: 'POST',
    cookie,
    body: { action_code: await codeFor(runId, `resolve_${resolution}`), intent_key: key('resolve'), rationale: TYPED_RATIONALE },
  })
}

async function dispositionOf(runId) {
  const run = await ScenarioRun.findById(runId)
  const def = await ScenarioDefinition.findOne({
    scenario_id: run.scenario_id, version: run.definition_version,
  })
  return def.disposition
}

async function playScenarios(cookie, attemptId, count, strategy) {
  for (let i = 0; i < count; i += 1) {
    const cur = await call(`/attempts/${attemptId}/current-run`, { cookie })
    assert.ok(cur.data.run, `expected a run at position ${i + 1}`)
    const runId = cur.data.run.run_id
    const disposition = await dispositionOf(runId)
    const { safe = true, resolution } = strategy(disposition, i + 1)
    const finalAction = resolution ?? (disposition === 'malicious' ? 'report' : 'continue')
    const done = safe
      ? await walkSafely(cookie, attemptId, runId, finalAction)
      : await walkUnsafely(cookie, attemptId, runId, finalAction)
    assert.equal(done.status, 200, `resolve failed: ${JSON.stringify(done.data)}`)
  }
}

const PERFECT = () => ({ safe: true })
const MIXED = (disposition, ordinal) => (ordinal % 2 === 0
  ? { safe: false, resolution: disposition === 'malicious' ? 'continue' : 'report' }
  : { safe: true })

async function completedAttempt(name, strategy = PERFECT) {
  const cookie = await signIn(name, nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playScenarios(cookie, attemptId, 10, strategy)
  const done = await call(`/attempts/${attemptId}/complete`, { method: 'POST', cookie })
  assert.equal(done.status, 200, `complete failed: ${JSON.stringify(done.data)}`)
  return { attemptId, cookie }
}

async function partialAttempt(name, resolved) {
  const cookie = await signIn(name, nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playScenarios(cookie, attemptId, resolved, PERFECT)
  return { attemptId, cookie }
}

/**
 * Every artifact currently in the export directory, excluding the pending area.
 *
 * A missing directory is an empty list, not an error: `reset()` removes it, and the
 * service recreates it only when it actually writes something - which is exactly the
 * property several of these tests are asserting.
 */
async function artifacts() {
  try {
    const entries = await readdir(exportDir, { withFileTypes: true })
    return entries.filter((e) => e.isFile()).map((e) => e.name).sort()
  } catch {
    return []
  }
}

async function pending() {
  try {
    return (await readdir(path.join(exportDir, ARTIFACT_TEMP_DIR))).sort()
  } catch {
    return []
  }
}

async function reset() {
  await Promise.all([
    Attempt.deleteMany({}), ScenarioRun.deleteMany({}), ScenarioEvent.deleteMany({}),
    Candidate.deleteMany({}),
  ])
  await AuditEvent.collection.deleteMany({})
  await rm(exportDir, { recursive: true, force: true })
}

test.after(async () => {
  if (ready) {
    server?.close()
    await Promise.all([
      Attempt.deleteMany({}), ScenarioRun.deleteMany({}), ScenarioEvent.deleteMany({}),
      Candidate.deleteMany({}), ScenarioDefinition.deleteMany({}), AdminUser.deleteMany({}),
    ])
    await AuditEvent.collection.deleteMany({})
    await mongoose.disconnect()
    await rm(exportDir, { recursive: true, force: true })
  }
})

/* ------------------------------------------------------------------ *
 * 1-4  authentication and authorisation
 * ------------------------------------------------------------------ */

it('an anonymous request cannot create or read an export', async () => {
  const created = await call('/admin/exports/attempts/6a9e40cac3c410903d1c8f00',
    { method: 'POST', body: { format: 'csv' } })
  assert.equal(created.status, 401)
  assert.equal(created.data.error.code, 'NO_ADMIN_SESSION')

  const read = await call('/admin/exports/training-attempt-6a9e40cac3c410903d1c8f00-20260907T120000Z-aabbccdd.csv')
  assert.equal(read.status, 401)
})

it('a candidate session is rejected, not downgraded', async () => {
  await reset()
  const learner = await signIn('Export Learner', nextIdentifier())
  const res = await call('/admin/exports/attempts/6a9e40cac3c410903d1c8f00',
    { method: 'POST', cookie: learner, body: { format: 'csv' } })
  assert.equal(res.status, 401)
  assert.equal(res.data.error.code, 'NO_ADMIN_SESSION')
})

it('an administrator may export an attempt belonging to any learner', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await completedAttempt('Export Owner')

  const res = await call(`/admin/exports/attempts/${attemptId}`,
    { method: 'POST', cookie, body: { format: 'csv' } })
  assert.equal(res.status, 201, JSON.stringify(res.data))
  assert.equal(res.data.export.attempt_id, attemptId)
})

it('there is no candidate-facing export route', async () => {
  await reset()
  const learner = await signIn('No Export', nextIdentifier())
  for (const path_ of ['/attempts/exports', '/exports']) {
    const res = await call(path_, { method: 'POST', cookie: learner, body: { format: 'csv' } })
    assert.equal(res.status, 404)
  }
})

/* ------------------------------------------------------------------ *
 * 5-9  request boundary: format, attempt, paths
 * ------------------------------------------------------------------ */

it('only csv and pdf are accepted', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await completedAttempt('Format Check')

  for (const format of ['csv', 'pdf']) {
    const ok = await call(`/admin/exports/attempts/${attemptId}`,
      { method: 'POST', cookie, body: { format } })
    assert.equal(ok.status, 201, `${format} was refused: ${JSON.stringify(ok.data)}`)
    assert.equal(ok.data.export.format, format)
  }

  for (const format of ['xlsx', 'docx', 'html', 'exe', 'CSV', '', 'csv;pdf']) {
    const bad = await call(`/admin/exports/attempts/${attemptId}`,
      { method: 'POST', cookie, body: { format } })
    assert.equal(bad.status, 422, `${format} was accepted`)
    assert.equal(bad.data.error.code, 'INVALID_EXPORT_FORMAT')
  }
})

it('a nonexistent or malformed attempt id is refused before anything is written', async () => {
  await reset()
  const cookie = await adminCookie()

  const missing = await call('/admin/exports/attempts/6a9e40cac3c410903d1c8fff',
    { method: 'POST', cookie, body: { format: 'csv' } })
  assert.equal(missing.status, 404)
  assert.equal(missing.data.error.code, 'ATTEMPT_NOT_FOUND')

  for (const id of ['not-an-id', '123', 'null', '..']) {
    const res = await call(`/admin/exports/attempts/${id}`,
      { method: 'POST', cookie, body: { format: 'csv' } })
    assert.equal(res.status, 404, `${id} did not produce a 404`)
  }

  assert.deepEqual(await artifacts(), [], 'a failed export left a file behind')
  assert.equal(await AuditEvent.countDocuments({}), 0, 'a failed export was recorded')
})

it('a client-supplied destination is refused, not ignored', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await completedAttempt('Path Attack')

  const destinations = [
    { path: '../../../../Windows/System32/drivers/etc/hosts' },
    { file_path: 'C:\\Windows\\win.ini' },
    { destination: '\\\\attacker-share\\drop\\report.csv' },
    { output_path: '/etc/cron.d/evil' },
    { directory: 'D:/Social Engineering Fraud Training PDS/backend' },
    { filename: '../.env' },
    { filename: 'report\u0000.csv' },
    { export_dir: '//server/share' },
    { url: 'https://attacker.example/upload' },
    { upload_url: 'http://127.0.0.1:9/collect' },
  ]

  for (const extra of destinations) {
    const res = await call(`/admin/exports/attempts/${attemptId}`, {
      method: 'POST', cookie, body: { format: 'csv', ...extra },
    })
    assert.equal(res.status, 422, `${JSON.stringify(extra)} was accepted`)
    assert.equal(res.data.error.code, 'FORBIDDEN_FIELD')
    assert.deepEqual(res.data.error.details.rejected_fields, Object.keys(extra))
  }

  assert.deepEqual(await artifacts(), [], 'a refused request still wrote a file')
})

it('every artifact is written inside the export directory and nowhere else', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await completedAttempt('Containment')

  const res = await call(`/admin/exports/attempts/${attemptId}`,
    { method: 'POST', cookie, body: { format: 'pdf' } })
  assert.equal(res.status, 201)

  const { location, filename, artifact_id: artifactId } = res.data.export
  assert.equal(location.kind, 'local_export_directory')
  assert.equal(path.dirname(location.path), path.resolve(exportDir))
  assert.equal(path.basename(location.path), filename)
  assert.equal(filename, `${artifactId}.pdf`)
  assert.match(artifactId, /^training-attempt-[0-9a-f]{24}-\d{8}T\d{6}Z-[0-9a-f]{8}$/)

  assert.deepEqual(await artifacts(), [filename])
  assert.equal((await stat(location.path)).size, res.data.export.bytes)
  // The part-file was cleaned up by the rename.
  assert.deepEqual(await pending(), [])
})

it('an artifact reference outside the export directory is refused', async () => {
  await reset()
  const cookie = await adminCookie()

  for (const name of [
    '..%2F..%2F.env',
    '..\\..\\.env',
    'C:%5CWindows%5Cwin.ini',
    'training-attempt-6a9e40cac3c410903d1c8f00-20260907T120000Z-aabbccdd.exe',
    'training-attempt-6a9e40cac3c410903d1c8f00-20260907T120000Z-aabbccdd',
    '.env',
    'package.json',
  ]) {
    const res = await call(`/admin/exports/${name}`, { cookie })
    assert.ok([404, 422].includes(res.status), `${name} produced ${res.status}`)
    if (res.status === 422) assert.equal(res.data.error.code, 'INVALID_ARTIFACT_ID')
  }
})

/* ------------------------------------------------------------------ *
 * 10-14  the artifacts themselves
 * ------------------------------------------------------------------ */

it('the CSV artifact is a real, marked, versioned CSV', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await completedAttempt('CSV Artifact', MIXED)

  const res = await call(`/admin/exports/attempts/${attemptId}`,
    { method: 'POST', cookie, body: { format: 'csv' } })
  const csv = await readFile(res.data.export.location.path, 'utf8')

  assert.ok(csv.startsWith('\uFEFF'), 'missing the UTF-8 BOM')
  assert.ok(csv.includes(TRAINING_MARKER))
  assert.ok(csv.includes(OFFLINE_MARKER))
  assert.ok(csv.includes('SYNTHETIC TRAINING DATA'))
  assert.ok(csv.includes('#SECTION,SCENARIOS'))

  const attempt = await Attempt.findById(attemptId)
  assert.ok(csv.includes(`content_version,${attempt.content_version}`))
  assert.ok(csv.includes(`total_score,${attempt.total_score}`))
  assert.ok(csv.includes(attemptId))

  // Every scenario's committed score appears.
  const runs = await ScenarioRun.find({ attempt_id: attemptId }).sort({ ordinal: 1 })
  const scenarioBlock = csv.split('#SECTION,SCENARIOS')[1].split('#SECTION,REMEDIATION')[0]
  for (const run of runs) {
    const row = scenarioBlock.split('\r\n').find((line) => line.startsWith(`${run.ordinal},`))
    assert.ok(row, `no row for ordinal ${run.ordinal}`)
    assert.ok(row.split(',')[5] === String(run.score_0_10),
      `ordinal ${run.ordinal}: expected ${run.score_0_10} in ${row.slice(0, 60)}`)
  }

  // Nothing in the file can execute in a spreadsheet.
  for (const line of csv.split('\r\n')) assert.ok(!/^[=+@]/.test(line), `formula record: ${line}`)
})

it('the PDF artifact is a real, marked, versioned, multi-page PDF', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await completedAttempt('PDF Artifact', MIXED)

  const res = await call(`/admin/exports/attempts/${attemptId}`,
    { method: 'POST', cookie, body: { format: 'pdf' } })
  const buffer = await readFile(res.data.export.location.path)
  const body = buffer.toString('latin1')

  assert.ok(body.startsWith('%PDF-'), 'not a PDF')
  assert.ok(body.trimEnd().endsWith('%%EOF'))
  assert.ok(body.includes('/Type /Catalog'))
  assert.ok(body.includes('/BaseFont /Courier'))
  assert.ok(body.includes(TRAINING_MARKER))
  assert.ok(body.includes(OFFLINE_MARKER))
  assert.ok(body.includes('SYNTHETIC DATA'))

  const attempt = await Attempt.findById(attemptId)
  assert.ok(body.includes(`CONTENT VERSION ${attempt.content_version}`))
  assert.ok(body.includes(`${attempt.total_score} / 100`))

  const pageCount = Number(body.match(/\/Count (\d+)/)[1])
  assert.ok(pageCount >= 2, `a ten-scenario report should span pages, got ${pageCount}`)
  assert.ok(body.includes(`Page ${pageCount} of ${pageCount}`))

  // Nothing external, nothing executable.
  for (const marker of ['/JavaScript', '/JS', '/URI', '/Launch', '/EmbeddedFile',
    '/OpenAction', 'http://', 'https://', '/FontFile']) {
    assert.ok(!body.includes(marker), `the PDF carries "${marker}"`)
  }
})

it('CSV and PDF of one attempt agree on every authoritative figure', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId, cookie: learner } = await completedAttempt('Consistency', MIXED)

  const csvRes = await call(`/admin/exports/attempts/${attemptId}`,
    { method: 'POST', cookie, body: { format: 'csv' } })
  const pdfRes = await call(`/admin/exports/attempts/${attemptId}`,
    { method: 'POST', cookie, body: { format: 'pdf' } })

  const csv = await readFile(csvRes.data.export.location.path, 'utf8')
  const pdf = (await readFile(pdfRes.data.export.location.path)).toString('latin1')

  // Both agree with the learner's own authoritative result.
  const own = await call(`/attempts/${attemptId}/result`, { cookie: learner })
  const result = own.data.result

  assert.ok(csv.includes(`total_score,${result.total_score}`))
  assert.ok(pdf.includes(`${result.total_score} / ${result.max_score}`))

  for (const scenario of result.scenarios) {
    assert.ok(csv.includes(scenario.outcome_class))
    assert.ok(pdf.includes(scenario.outcome_class))
  }
  for (const bucket of result.behaviour.by_family) {
    assert.ok(csv.includes(bucket.label), `CSV missing family ${bucket.label}`)
    assert.ok(pdf.includes(bucket.label), `PDF missing family ${bucket.label}`)
  }
  for (const recommendation of result.remediation) {
    assert.ok(csv.includes(recommendation.family_key))
    assert.ok(pdf.includes(recommendation.label))
  }
  assert.equal(csvRes.data.export.content_version, pdfRes.data.export.content_version)
})

it('an artifact can be read back, with its own content type', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await completedAttempt('Read Back')

  const created = await call(`/admin/exports/attempts/${attemptId}`,
    { method: 'POST', cookie, body: { format: 'pdf' } })
  const { filename, bytes } = created.data.export

  const fetched = await call(`/admin/exports/${filename}`, { cookie, raw: true })
  assert.equal(fetched.status, 200)
  assert.equal(fetched.headers.get('content-type'), 'application/pdf')
  assert.equal(fetched.headers.get('x-content-type-options'), 'nosniff')
  assert.ok(fetched.headers.get('content-disposition').includes(filename))
  assert.equal(fetched.buffer.length, bytes)
  assert.ok(fetched.buffer.toString('latin1').startsWith('%PDF-'))

  const missing = await call(
    '/admin/exports/training-attempt-6a9e40cac3c410903d1c8f00-20260907T120000Z-aabbccdd.csv',
    { cookie },
  )
  assert.equal(missing.status, 404)
  assert.equal(missing.data.error.code, 'ARTIFACT_NOT_FOUND')
})

it('the export marks an attempt taken on superseded content', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await completedAttempt('Version Mark')

  // Publish a notional newer bank the way ADMIN-001 would: the version-1 documents are
  // RETIRED, not rewritten, and version-2 copies become the active bank. The attempt's
  // runs stay pinned to version 1 and must still resolve.
  const originals = await ScenarioDefinition.find({}).select('+evaluation').lean()
  await ScenarioDefinition.collection.updateMany({}, { $set: { active: false } })
  await ScenarioDefinition.collection.insertMany(originals.map((doc) => {
    const copy = { ...doc, version: 2, active: true }
    delete copy._id
    return copy
  }))

  try {
    const res = await call(`/admin/exports/attempts/${attemptId}`,
      { method: 'POST', cookie, body: { format: 'csv' } })
    assert.equal(res.status, 201, JSON.stringify(res.data))
    const csv = await readFile(res.data.export.location.path, 'utf8')

    assert.equal(res.data.export.content_version, 1)
    assert.equal(res.data.export.content_is_current, false)
    assert.ok(csv.includes('content_version,1'))
    assert.ok(csv.includes('current_content_version,2'))
    assert.ok(csv.includes('content_is_current,false'))
    assert.ok(csv.includes('EARLIER content version'))
  } finally {
    await ScenarioDefinition.collection.deleteMany({ version: 2 })
    await ScenarioDefinition.collection.updateMany({ version: 1 }, { $set: { active: true } })
  }
})

/* ------------------------------------------------------------------ *
 * 15-18  audit and idempotency
 * ------------------------------------------------------------------ */

it('a successful export appends exactly one EXPORT_CREATED entry', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await completedAttempt('Audit One')

  const res = await call(`/admin/exports/attempts/${attemptId}`,
    { method: 'POST', cookie, body: { format: 'csv' } })

  const entries = await AuditEvent.find({})
  assert.equal(entries.length, 1)
  const entry = entries[0]
  assert.equal(entry.action, 'EXPORT_CREATED')
  assert.equal(entry.resource_type, 'export')
  assert.equal(entry.resource_id, res.data.export.artifact_id)
  assert.equal(entry.status, 'succeeded')
  assert.equal(entry.actor_username, 'export-admin')
  assert.equal(entry.metadata.export_format, 'csv')
  assert.equal(entry.metadata.export_scope, 'attempt')
  assert.equal(entry.metadata.export_record_count, 10)
  assert.equal(entry.metadata.attempt_id, attemptId)
})

it('the audit entry carries no report content and no local path', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await completedAttempt('Audit Privacy')
  await call(`/admin/exports/attempts/${attemptId}`,
    { method: 'POST', cookie, body: { format: 'pdf' } })

  const entry = await AuditEvent.findOne({})
  const text = JSON.stringify(entry.toObject())

  assert.ok(!text.includes(TYPED_RATIONALE))
  assert.ok(!text.includes('otp-482915'))
  assert.ok(!text.includes(exportDir), 'the audit entry carries a filesystem path')
  assert.ok(!text.includes('%PDF'))
  for (const field of ['path', 'filename', 'directory', 'rationale', 'feedback',
    'password', 'event_code', 'points_delta', 'seed']) {
    assert.ok(!text.includes(`"${field}":`), `the audit entry carries "${field}"`)
  }
  // Only allowlisted metadata keys.
  assert.deepEqual(Object.keys(entry.metadata).sort(),
    ['attempt_id', 'attempt_status', 'export_format', 'export_record_count', 'export_scope'])
})

it('a retry with the same idempotency key produces no second artifact or entry', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await completedAttempt('Idempotent')
  const idempotencyKey = 'export-retry-key-0001'

  const first = await call(`/admin/exports/attempts/${attemptId}`, {
    method: 'POST', cookie, body: { format: 'csv', idempotency_key: idempotencyKey },
  })
  assert.equal(first.status, 201)
  assert.equal(first.data.export.replayed, false)

  const retries = await Promise.all([
    call(`/admin/exports/attempts/${attemptId}`, {
      method: 'POST', cookie, body: { format: 'csv', idempotency_key: idempotencyKey },
    }),
    call(`/admin/exports/attempts/${attemptId}`, {
      method: 'POST', cookie, body: { format: 'csv', idempotency_key: idempotencyKey },
    }),
  ])
  for (const retry of retries) {
    assert.equal(retry.status, 200, JSON.stringify(retry.data))
    assert.equal(retry.data.export.replayed, true)
    assert.equal(retry.data.export.artifact_id, first.data.export.artifact_id)
    assert.equal(retry.data.export.bytes, first.data.export.bytes)
    assert.equal(retry.data.export.location.artifact_present, true)
  }

  assert.equal(await AuditEvent.countDocuments({ action: 'EXPORT_CREATED' }), 1)
  assert.deepEqual(await artifacts(), [first.data.export.filename])

  // A different key is a different export.
  const other = await call(`/admin/exports/attempts/${attemptId}`, {
    method: 'POST', cookie, body: { format: 'csv', idempotency_key: 'export-retry-key-0002' },
  })
  assert.equal(other.status, 201)
  assert.notEqual(other.data.export.artifact_id, first.data.export.artifact_id)
  assert.equal(await AuditEvent.countDocuments({ action: 'EXPORT_CREATED' }), 2)
})

it('an export that cannot be recorded leaves no artifact behind', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await completedAttempt('Audit Failure')
  const admin = await AdminUser.findOne({ username: 'export-admin' })

  // The service is called directly so the audit writer can be made to fail: this is the
  // one property that cannot be shown over HTTP without breaking the database.
  await assert.rejects(
    () => createAttemptExport(
      { attemptId, format: 'csv', actor: admin },
      { auditAppend: async () => { throw new Error('audit unavailable') } },
    ),
    /audit unavailable/,
  )

  assert.deepEqual(await artifacts(), [], 'an unaudited export was left on disk')
  assert.deepEqual(await pending(), [], 'a part-file was left behind')
  assert.equal(await AuditEvent.countDocuments({}), 0)

  // And the feature still works afterwards.
  const ok = await call(`/admin/exports/attempts/${attemptId}`,
    { method: 'POST', cookie, body: { format: 'csv' } })
  assert.equal(ok.status, 201)
  assert.equal(await AuditEvent.countDocuments({ action: 'EXPORT_CREATED' }), 1)
})

/* ------------------------------------------------------------------ *
 * 19-21  incomplete attempts
 * ------------------------------------------------------------------ */

it('an incomplete attempt exports with no total and no fabricated outcome', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await partialAttempt('Partial Export', 3)

  const res = await call(`/admin/exports/attempts/${attemptId}`,
    { method: 'POST', cookie, body: { format: 'csv' } })
  assert.equal(res.status, 201)
  const csv = await readFile(res.data.export.location.path, 'utf8')

  assert.ok(csv.includes('status,in_progress'))
  assert.ok(csv.includes('result_available,false'))
  assert.ok(csv.includes('the attempt is not complete'))
  assert.ok(csv.includes('scenarios_resolved,3'))

  const runs = await ScenarioRun.find({ attempt_id: attemptId, status: 'resolved' })
  const resolvedPoints = runs.reduce((sum, r) => sum + r.score_0_10, 0)
  assert.ok(csv.includes(`resolved_points,${resolvedPoints}`))

  // The attempt block must not carry a total_score value.
  const attemptBlock = csv.split('#SECTION,ATTEMPT')[1].split('#SECTION,OUTCOME_SUMMARY')[0]
  assert.match(attemptBlock, /\r\ntotal_score,\r\n/, 'a total was fabricated')

  assert.ok(csv.includes('#SECTION,REMEDIATION'))
  assert.ok(csv.includes('attempt_not_complete'))
})

it('an unresolved scenario leaks no score, disposition or feedback into an export', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await partialAttempt('Partial Leak', 2)

  const csvRes = await call(`/admin/exports/attempts/${attemptId}`,
    { method: 'POST', cookie, body: { format: 'csv' } })
  const pdfRes = await call(`/admin/exports/attempts/${attemptId}`,
    { method: 'POST', cookie, body: { format: 'pdf' } })

  const csv = await readFile(csvRes.data.export.location.path, 'utf8')
  const pdf = (await readFile(pdfRes.data.export.location.path)).toString('latin1')

  const scenarioBlock = csv.split('#SECTION,SCENARIOS')[1].split('#SECTION,REMEDIATION')[0]
  const rows = scenarioBlock.split('\r\n').filter((line) => /^\d+,/.test(line))
  assert.equal(rows.length, 10)

  for (const row of rows.slice(2)) {
    const cells = row.split(',')
    assert.equal(cells[3], 'no', `ordinal ${cells[0]} should be unresolved`)
    assert.equal(cells[5], '', 'an unresolved scenario carries a score')
    assert.equal(cells[7], '', 'an unresolved scenario carries an outcome class')
    assert.equal(cells[8], '', 'an unresolved scenario carries a disposition')
  }

  // The answer for a scenario still in play appears in neither artifact.
  const unresolved = await ScenarioRun.find({ attempt_id: attemptId, status: { $ne: 'resolved' } })
  for (const run of unresolved) {
    const definition = await ScenarioDefinition.findOne({
      scenario_id: run.scenario_id, version: run.definition_version,
    }).select('+evaluation')
    const safeAction = definition.evaluation?.feedback?.safe_action
    if (safeAction && safeAction.length > 20) {
      assert.ok(!csv.includes(safeAction), 'the CSV published an unresolved safe action')
      assert.ok(!pdf.includes(safeAction.slice(0, 30)), 'the PDF published an unresolved safe action')
    }
  }
  assert.ok(pdf.includes('NOT RESOLVED'))
})

it('viewing or exporting an attempt does not change it', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId, cookie: learner } = await partialAttempt('Untouched', 4)
  const before = (await Attempt.findById(attemptId)).toObject()

  await call(`/admin/exports/attempts/${attemptId}`, { method: 'POST', cookie, body: { format: 'csv' } })
  await call(`/admin/exports/attempts/${attemptId}`, { method: 'POST', cookie, body: { format: 'pdf' } })

  assert.deepEqual((await Attempt.findById(attemptId)).toObject(), before)
  assert.equal(await ScenarioRun.countDocuments({ attempt_id: attemptId, status: 'resolved' }), 4)
  const current = await call(`/attempts/${attemptId}/current-run`, { cookie: learner })
  assert.equal(current.data.run.ordinal, 5)
})

/* ------------------------------------------------------------------ *
 * 22-24  privacy
 * ------------------------------------------------------------------ */

it('no typed learner content reaches either artifact or the API response', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await completedAttempt('Rationale Privacy', MIXED)

  // It really was stored, or this proves nothing.
  const stored = await ScenarioRun.findOne({ attempt_id: attemptId, ordinal: 1 })
  assert.equal(stored.rationale, TYPED_RATIONALE)

  const csvRes = await call(`/admin/exports/attempts/${attemptId}`,
    { method: 'POST', cookie, body: { format: 'csv' } })
  const pdfRes = await call(`/admin/exports/attempts/${attemptId}`,
    { method: 'POST', cookie, body: { format: 'pdf' } })

  const csv = await readFile(csvRes.data.export.location.path, 'utf8')
  const pdf = (await readFile(pdfRes.data.export.location.path)).toString('latin1')

  for (const [label, body] of [['csv', csv], ['pdf', pdf],
    ['response', JSON.stringify(csvRes.data)], ['response', JSON.stringify(pdfRes.data)]]) {
    assert.ok(!body.includes('MY-TYPED-RATIONALE'), `${label} published the typed rationale`)
    assert.ok(!body.includes('otp-482915'), `${label} published typed content`)
    assert.ok(!body.includes('/c calc'), `${label} published typed content`)
  }
})

/**
 * Every key the report model carries, at any depth.
 *
 * The model is the single dataset both renderings are built from, so a forbidden key
 * absent here cannot appear in either artifact. This is checked STRUCTURALLY rather than
 * by searching the rendered text for words: the report legitimately carries the client's
 * own authored feedback, and that prose contains words like "password" - "A consent screen
 * can grant access without asking for a password" is scenario E15's feedback, and the
 * specification requires the export to include it. Searching for the word would fail
 * whenever that scenario happened to be selected, and would be testing the client's
 * writing rather than this feature's privacy boundary.
 */
function deepKeys(value, found = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) deepKeys(item, found)
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      found.add(key)
      deepKeys(child, found)
    }
  }
  return found
}

it('the report dataset carries no ledger, selection or identity field', async () => {
  await reset()
  const { attemptId } = await completedAttempt('Model Privacy', MIXED)

  const model = await buildAttemptReport(attemptId, { generatedBy: 'export-admin', format: 'csv' })
  const keys = deepKeys(model)

  for (const field of [
    'seed', 'selection', 'scenario_sequence', 'composition', 'relaxations',
    'intent_key', 'idempotency_key', 'event_id', 'event_code', 'points_delta', 'metadata',
    'synthetic_target_id', 'client_ts', 'server_ts', 'sequence', 'last_sequence',
    'score_running', 'run_id', 'rationale',
    'evaluation', 'expected_actions', 'scoring', 'stages', 'end_state',
    'identifier', 'identifierNormalised', 'service_no_normalized', 'seenScenarios',
    'password', 'password_hash', 'otp', 'aadhaar', 'biometric', 'phone', 'email',
    '_id', '__v',
  ]) {
    assert.ok(!keys.has(field), `the report model carries the field "${field}"`)
  }

  // `title` is checked per SCENARIO rather than across the model: the report has a title
  // of its own ("Instructor Attempt Report"), and what must never appear is the SCENARIO's
  // authoring title, which DATA-001 classified as evaluation data because a name like
  // "Cloned Friend in Distress" states the answer outright.
  for (const field of ['title', 'evaluation', 'stages', 'scoring', 'rationale', '_id']) {
    assert.ok(!deepKeys(model.scenarios).has(field),
      `a scenario entry carries the field "${field}"`)
  }
})

it('no ledger internal, seed or raw identifier reaches an artifact', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await completedAttempt('Field Privacy', MIXED)

  const csvRes = await call(`/admin/exports/attempts/${attemptId}`,
    { method: 'POST', cookie, body: { format: 'csv' } })
  const pdfRes = await call(`/admin/exports/attempts/${attemptId}`,
    { method: 'POST', cookie, body: { format: 'pdf' } })
  const csv = await readFile(csvRes.data.export.location.path, 'utf8')
  const pdf = (await readFile(pdfRes.data.export.location.path)).toString('latin1')

  const attempt = await Attempt.findById(attemptId)
  const runs = await ScenarioRun.find({ attempt_id: attemptId })
  const events = await ScenarioEvent.find({ run_id: { $in: runs.map((r) => r._id) } })
  const profile = await Candidate.findById(attempt.profile_id)

  // VALUES, which are unambiguous: a real secret either appears or it does not.
  for (const [label, body] of [['csv', csv], ['pdf', pdf]]) {
    assert.ok(!body.includes(attempt.seed), `${label} published the selection seed`)
    assert.ok(!body.includes(profile.identifier), `${label} published the raw service number`)
    assert.ok(!body.includes(profile.identifierNormalised), `${label} published the profile key`)

    for (const run of runs) {
      assert.ok(!body.includes(String(run._id)), `${label} published a run id`)
    }
    for (const event of events) {
      assert.ok(!body.includes(String(event._id)), `${label} published an event id`)
      assert.ok(!body.includes(event.intent_key), `${label} published an idempotency key`)
      assert.ok(!body.includes(event.event_code), `${label} published a raw event code`)
    }
  }

  // And structurally, in the CSV: no key or column is a forbidden field name.
  const cells = csv.split(SPLIT_LINES).flatMap((line) => line.split(','))
  for (const field of ['seed', 'selection', 'rationale', 'intent_key', 'event_code',
    'points_delta', 'metadata', 'evaluation', 'identifier', 'password', '_id']) {
    assert.ok(!cells.includes(field), `the CSV uses "${field}" as a key or column`)
  }

  // No scenario's AUTHORING TITLE appears: it states the answer outright (DATA-001).
  for (const run of runs) {
    const definition = await ScenarioDefinition.findOne({
      scenario_id: run.scenario_id, version: run.definition_version,
    }).select('+evaluation')
    assert.ok(!csv.includes(definition.title), `the CSV published the title "${definition.title}"`)
    assert.ok(!pdf.includes(definition.title), `the PDF published the title "${definition.title}"`)
  }

  // The masked service number IS present, and the raw one is not.
  assert.ok(csv.includes(profile.identifier.slice(-4)))
})

it('the API response exposes no filesystem internals beyond the export directory', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await completedAttempt('Response Shape')

  const res = await call(`/admin/exports/attempts/${attemptId}`,
    { method: 'POST', cookie, body: { format: 'csv' } })

  assert.deepEqual(Object.keys(res.data.export).sort(), [
    'artifact_id', 'attempt_id', 'audit', 'bytes', 'content_is_current', 'content_version',
    'filename', 'format', 'generated_at', 'location', 'network_marker', 'replayed',
    'scope', 'training_marker',
  ])
  assert.deepEqual(Object.keys(res.data.export.location).sort(),
    ['artifact_present', 'directory', 'kind', 'note', 'path'])
  // The only paths named are the configured export directory and the artifact in it.
  assert.equal(res.data.export.location.directory, path.resolve(exportDir))
  assert.ok(res.data.export.location.path.startsWith(path.resolve(exportDir)))
})
