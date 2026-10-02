import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import mongoose from 'mongoose'
import { createApp } from '../src/app.js'
import { env } from '../src/config/env.js'
import { AdminUser } from '../src/models/AdminUser.js'
import { Attempt } from '../src/models/Attempt.js'
import { AuditEvent } from '../src/models/AuditEvent.js'
import { Candidate } from '../src/models/Candidate.js'
import { Configuration } from '../src/models/Configuration.js'
import { ScenarioDefinition } from '../src/models/ScenarioDefinition.js'
import { ScenarioEvent } from '../src/models/ScenarioEvent.js'
import { ScenarioRun } from '../src/models/ScenarioRun.js'
import { createAdminUser } from '../src/services/adminService.js'
import {
  loadSourceScenarios,
  loadTaxonomies,
  toScenarioDefinition,
} from '../src/services/scenarioDefinitionImportService.js'
import { detectTransactionSupport } from '../src/utils/transactions.js'
import { OFFLINE_MARKER, TRAINING_MARKER } from '../src/constants/export.js'
import { codeFor } from './helpers/learnerActions.js'

/**
 * ADM-007 - the admin completion fixes, over real HTTP against a real replica set.
 *
 *   1. Feedback timing (ADM-FIX-1): the instructor's setting now changes what the learner's
 *      resolve response carries, and nothing else.
 *   2. Learner export (ADM-FIX-2): every completed attempt of ONE learner, CSV and PDF,
 *      admin-only, audited, and carrying no other learner's data.
 *   3. Difficulty and military context (ADM-FIX-3) in the viewer and both exports, taken
 *      from the pinned ScenarioDefinition.
 *
 * Attempts are played through the real candidate API. Exports land in a throwaway
 * directory, never in backend/exports.
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
        Candidate.deleteMany({}), AdminUser.deleteMany({}), Configuration.deleteMany({}),
      ])
      await AuditEvent.collection.deleteMany({})
      await createAdminUser({ username: 'adm007-admin', password: 'a-long-training-password' })

      exportDir = await mkdtemp(path.join(tmpdir(), 'adm007-'))
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
  console.warn(`\n[ADM-007] admin completion tests SKIPPED - ${skipReason}\n`)
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
  if (raw) return { status: res.status, headers: res.headers, buffer: Buffer.from(await res.arrayBuffer()) }
  const data = await res.json().catch(() => null)
  return { status: res.status, data, cookie: res.headers.getSetCookie?.()[0]?.split(';')[0] }
}

async function adminCookie() {
  const res = await call('/admin/login', {
    method: 'POST',
    body: { username: 'adm007-admin', password: 'a-long-training-password' },
  })
  assert.equal(res.status, 200, `admin login failed: ${JSON.stringify(res.data)}`)
  return res.cookie
}

let idSeq = 0
const nextIdentifier = () => `AC${String(700000 + (idSeq += 1))}`
let keySeq = 0
const key = (label) => `${label}-${Date.now()}-${(keySeq += 1)}`

async function signIn(name, identifier) {
  const res = await call('/candidates', { method: 'POST', body: { name, identifier } })
  assert.equal(res.status, 201, `sign-in failed: ${JSON.stringify(res.data)}`)
  return res.cookie
}

const TYPED_RATIONALE = 'ADM007-TYPED-RATIONALE-otp-771204'

const event = async (cookie, attemptId, runId, intent) => call(
  `/attempts/${attemptId}/runs/${runId}/events`,
  { method: 'POST', cookie, body: { action_code: await codeFor(runId, intent), intent_key: key(intent) } },
)

async function definitionOf(runId) {
  const run = await ScenarioRun.findById(runId)
  return ScenarioDefinition.findOne({
    scenario_id: run.scenario_id, version: run.definition_version,
  }).select('+evaluation')
}

/** Plays one scenario safely; returns every response, the resolve one last. */
async function playOne(cookie, attemptId) {
  const cur = await call(`/attempts/${attemptId}/current-run`, { cookie })
  assert.ok(cur.data.run, 'expected a current run')
  const runId = cur.data.run.run_id
  const definition = await definitionOf(runId)
  const responses = []
  for (const intent of ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_trusted_directory']) {
    const r = await event(cookie, attemptId, runId, intent)
    assert.equal(r.status, 200, `${intent} failed: ${JSON.stringify(r.data)}`)
    responses.push(r)
  }
  const resolution = definition.disposition === 'malicious' ? 'report' : 'continue'
  const done = await call(`/attempts/${attemptId}/runs/${runId}/resolve`, {
    method: 'POST',
    cookie,
    body: {
      action_code: await codeFor(runId, `resolve_${resolution}`),
      intent_key: key('resolve'),
      rationale: TYPED_RATIONALE,
    },
  })
  assert.equal(done.status, 200, `resolve failed: ${JSON.stringify(done.data)}`)
  responses.push(done)
  return { runId, definition, responses, resolved: done }
}

async function startAttempt(cookie, mode) {
  const created = await call('/attempts', { method: 'POST', cookie, body: mode ? { mode } : undefined })
  assert.ok([200, 201].includes(created.status), JSON.stringify(created.data))
  return created.data.attempt.attempt_id
}

async function completeAttempt(cookie, mode) {
  const attemptId = await startAttempt(cookie, mode)
  for (let i = 0; i < 10; i += 1) await playOne(cookie, attemptId)
  const done = await call(`/attempts/${attemptId}/complete`, { method: 'POST', cookie })
  assert.equal(done.status, 200, `complete failed: ${JSON.stringify(done.data)}`)
  return attemptId
}

async function setTiming(cookie, body) {
  const res = await call('/admin/config/feedback', { method: 'PATCH', cookie, body })
  assert.equal(res.status, 200, JSON.stringify(res.data))
}

/** A minimal RFC 4180 reader: enough for quoted cells with commas and doubled quotes. */
function parseCsv(textIn) {
  const input = textIn.replace(/^\uFEFF/, '')
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i]
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') { cell += '"'; i += 1 } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') { row.push(cell); cell = '' } else if (ch === '\r') { /* CRLF */ } else if (ch === '\n') {
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += ch
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows
}

/** One `#SECTION` block as objects keyed by its header row. */
function sectionRows(rows, name) {
  const start = rows.findIndex((r) => r[0] === '#SECTION' && r[1] === name)
  assert.ok(start >= 0, `no ${name} section`)
  const header = rows[start + 1]
  const out = []
  for (let i = start + 2; i < rows.length && rows[i].length > 1 && rows[i][0] !== '#SECTION'; i += 1) {
    out.push(Object.fromEntries(header.map((h, j) => [h, rows[i][j] ?? ''])))
  }
  return out
}

async function reset() {
  await Promise.all([
    Attempt.deleteMany({}), ScenarioRun.deleteMany({}), ScenarioEvent.deleteMany({}),
    Candidate.deleteMany({}), Configuration.deleteMany({}),
  ])
  await AuditEvent.collection.deleteMany({})
  await rm(exportDir, { recursive: true, force: true })
}

async function artifactCount() {
  try {
    return (await readdir(exportDir, { withFileTypes: true })).filter((e) => e.isFile()).length
  } catch {
    return 0
  }
}

test.after(async () => {
  if (ready) {
    server?.close()
    await Promise.all([
      Attempt.deleteMany({}), ScenarioRun.deleteMany({}), ScenarioEvent.deleteMany({}),
      Candidate.deleteMany({}), ScenarioDefinition.deleteMany({}), AdminUser.deleteMany({}),
      Configuration.deleteMany({}),
    ])
    await AuditEvent.collection.deleteMany({})
    await mongoose.disconnect()
    await rm(exportDir, { recursive: true, force: true })
  }
})

/* ------------------------------------------------------------------ *
 * ADM-FIX-1  feedback timing
 * ------------------------------------------------------------------ */

it('unset configuration keeps the shipped behaviour: feedback is held, and no config is created', async () => {
  await reset()
  const cookie = await signIn('Timing Default', nextIdentifier())
  const attemptId = await startAttempt(cookie)
  const { resolved, responses } = await playOne(cookie, attemptId)

  assert.equal(resolved.data.feedback_timing, 'on_completion')
  assert.equal(resolved.data.feedback, null)
  // A response that did not resolve the run carries neither key.
  for (const r of responses.slice(0, -1)) {
    assert.equal('feedback' in r.data, false)
    assert.equal('feedback_timing' in r.data, false)
  }
  // Reading the policy on the learner path wrote nothing.
  assert.equal(await Configuration.countDocuments({}), 0)
})

it('training set to immediate releases the scenario feedback card on resolve', async () => {
  await reset()
  const admin = await adminCookie()
  await setTiming(admin, { training_feedback_timing: 'immediate' })

  const cookie = await signIn('Timing Training', nextIdentifier())
  const attemptId = await startAttempt(cookie, 'training')
  const { resolved, responses, definition, runId } = await playOne(cookie, attemptId)

  assert.equal(resolved.data.feedback_timing, 'immediate')
  const authored = definition.evaluation.feedback
  assert.deepEqual(resolved.data.feedback, {
    result: authored.result ?? null,
    cues: [...(authored.cues ?? [])],
    safe_action: authored.safe_action ?? null,
    impact: authored.impact ?? null,
    prevention_habit: authored.prevention_habit ?? null,
  })

  // Nothing before the resolve step released anything.
  for (const r of responses.slice(0, -1)) assert.equal('feedback' in r.data, false)

  // Only the feedback card crosses the wire: no answer-key or classification field.
  const text = JSON.stringify(resolved.data)
  for (const field of ['evaluation', 'canonical_family', 'canonical_triggers', 'disposition',
    'level', 'military_flag', 'expected_safe_behavior', 'event_code']) {
    assert.ok(!text.includes(`"${field}"`), `resolve exposed "${field}"`)
  }

  // Scoring is untouched: the response score is what the engine committed.
  const run = await ScenarioRun.findById(runId)
  assert.equal(resolved.data.score_0_10, run.score_0_10)
})

it('assessment follows its own setting, independently of training', async () => {
  await reset()
  const admin = await adminCookie()
  await setTiming(admin, { training_feedback_timing: 'immediate' })

  const cookie = await signIn('Timing Assessment', nextIdentifier())
  const heldAttempt = await startAttempt(cookie, 'assessment')
  const held = await playOne(cookie, heldAttempt)
  assert.equal(held.resolved.data.feedback_timing, 'on_completion')
  assert.equal(held.resolved.data.feedback, null)

  await setTiming(admin, { assessment_feedback_timing: 'immediate' })
  const released = await playOne(cookie, heldAttempt)
  assert.equal(released.resolved.data.feedback_timing, 'immediate')
  assert.ok(released.resolved.data.feedback?.result, 'assessment feedback was not released')

  // And switching training back to on_completion holds training feedback again.
  await setTiming(admin, { training_feedback_timing: 'on_completion' })
  const other = await signIn('Timing Training Two', nextIdentifier())
  const trainingAttempt = await startAttempt(other, 'training')
  const trainingHeld = await playOne(other, trainingAttempt)
  assert.equal(trainingHeld.resolved.data.feedback_timing, 'on_completion')
  assert.equal(trainingHeld.resolved.data.feedback, null)
})

it('the same play scores the same whichever timing is in force', async () => {
  await reset()
  const admin = await adminCookie()

  const a = await signIn('Score Held', nextIdentifier())
  const heldAttempt = await startAttempt(a, 'training')
  const held = await playOne(a, heldAttempt)

  await setTiming(admin, { training_feedback_timing: 'immediate' })
  const b = await signIn('Score Released', nextIdentifier())
  const releasedAttempt = await startAttempt(b, 'training')
  const released = await playOne(b, releasedAttempt)

  // Both played the identical safe path; the score depends only on the definition's rules.
  const expected = async (runId) => (await ScenarioRun.findById(runId)).score_0_10
  assert.equal(held.resolved.data.score_0_10, await expected(held.runId))
  assert.equal(released.resolved.data.score_0_10, await expected(released.runId))
})

it('the result screen still carries feedback at completion under either timing', async () => {
  await reset()
  const admin = await adminCookie()
  await setTiming(admin, { assessment_feedback_timing: 'immediate' })

  const cookie = await signIn('Timing Result', nextIdentifier())
  const attemptId = await completeAttempt(cookie)
  const result = await call(`/attempts/${attemptId}/result`, { cookie })
  assert.equal(result.status, 200)
  for (const s of result.data.result.scenarios) assert.ok(s.feedback.result)
})

it('the admin settings screen states that both timings are enforced', async () => {
  await reset()
  const admin = await adminCookie()
  const res = await call('/admin/config/feedback', { cookie: admin })
  assert.equal(res.status, 200)
  assert.ok(res.data.enforcement.immediate.startsWith('enforced'))
  assert.ok(res.data.enforcement.on_completion.startsWith('enforced'))
})

/* ------------------------------------------------------------------ *
 * ADM-FIX-2  learner export - access
 * ------------------------------------------------------------------ */

it('the learner export is admin-only: anonymous and learner sessions are refused', async () => {
  await reset()
  const learner = await signIn('Not An Admin', nextIdentifier())
  const profile = await Candidate.findOne({ name: 'Not An Admin' })

  const anon = await call(`/admin/exports/learners/${profile._id}`,
    { method: 'POST', body: { format: 'csv' } })
  assert.equal(anon.status, 401)
  assert.equal(anon.data.error.code, 'NO_ADMIN_SESSION')

  const asLearner = await call(`/admin/exports/learners/${profile._id}`,
    { method: 'POST', cookie: learner, body: { format: 'csv' } })
  assert.equal(asLearner.status, 401)

  assert.equal(await artifactCount(), 0)
  assert.equal(await AuditEvent.countDocuments({}), 0)
})

it('an unknown or malformed learner is a 404, and a learner with no completed attempt a 409', async () => {
  await reset()
  const admin = await adminCookie()

  for (const id of ['not-an-id', '6a9e40c5c3c410903d1c8eff']) {
    const res = await call(`/admin/exports/learners/${id}`,
      { method: 'POST', cookie: admin, body: { format: 'csv' } })
    assert.equal(res.status, 404, id)
    assert.equal(res.data.error.code, 'PROFILE_NOT_FOUND')
  }

  const cookie = await signIn('Only In Progress', nextIdentifier())
  const attemptId = await startAttempt(cookie)
  await playOne(cookie, attemptId)
  const profile = await Candidate.findOne({ name: 'Only In Progress' })
  const res = await call(`/admin/exports/learners/${profile._id}`,
    { method: 'POST', cookie: admin, body: { format: 'csv' } })
  assert.equal(res.status, 409)
  assert.equal(res.data.error.code, 'NO_COMPLETED_ATTEMPTS')

  // Nothing was written and nothing was recorded for any refusal.
  assert.equal(await artifactCount(), 0)
  assert.equal(await AuditEvent.countDocuments({}), 0)
})

it('a destination cannot be supplied', async () => {
  await reset()
  const admin = await adminCookie()
  const res = await call('/admin/exports/learners/6a9e40c5c3c410903d1c8eff',
    { method: 'POST', cookie: admin, body: { format: 'csv', path: 'C:/Reports/out.csv' } })
  assert.equal(res.status, 422)
  assert.equal(res.data.error.code, 'FORBIDDEN_FIELD')
})

/* ------------------------------------------------------------------ *
 * ADM-FIX-2  learner export - content
 * ------------------------------------------------------------------ */

/** Learner A: two completed attempts and one in progress. Learner B: one completed. */
async function twoLearners() {
  const idA = nextIdentifier()
  const a = await signIn('Learner Alpha', idA)
  const a1 = await completeAttempt(a)
  const a2 = await completeAttempt(a)
  const aOpen = await startAttempt(a)
  await playOne(a, aOpen)

  const idB = nextIdentifier()
  const b = await signIn('Learner Bravo', idB)
  const b1 = await completeAttempt(b)

  const profileA = await Candidate.findOne({ name: 'Learner Alpha' })
  const profileB = await Candidate.findOne({ name: 'Learner Bravo' })
  return { idA, idB, a1, a2, aOpen, b1, profileA, profileB, cookieA: a }
}

it('the CSV carries every completed attempt of one learner, and no other learner', async () => {
  await reset()
  const admin = await adminCookie()
  const { idA, idB, a1, a2, aOpen, b1, profileA } = await twoLearners()

  const res = await call(`/admin/exports/learners/${profileA._id}`,
    { method: 'POST', cookie: admin, body: { format: 'csv' } })
  assert.equal(res.status, 201, JSON.stringify(res.data))
  assert.equal(res.data.export.scope, 'learner')
  assert.equal(res.data.export.profile_id, String(profileA._id))
  assert.equal(res.data.export.attempts_included, 2)
  assert.match(res.data.export.artifact_id, /^training-learner-[0-9a-f]{24}-\d{8}T\d{6}Z-[0-9a-f]{8}$/)

  const csv = await readFile(res.data.export.location.path, 'utf8')
  const rows = parseCsv(csv)

  // Marked as training data, with its version.
  assert.ok(csv.startsWith('\uFEFF'))
  assert.ok(csv.includes(TRAINING_MARKER))
  assert.ok(csv.includes(OFFLINE_MARKER))
  assert.ok(csv.includes('SYNTHETIC TRAINING DATA'))
  const report = Object.fromEntries(sectionRows(rows, 'REPORT').map((r) => [r.field, r.value]))
  assert.equal(report.export_scope, 'learner')
  const attemptDoc = await Attempt.findById(a1)
  assert.equal(report.content_versions, String(attemptDoc.content_version))

  // Learner header: masked number only.
  const learner = Object.fromEntries(sectionRows(rows, 'LEARNER').map((r) => [r.field, r.value]))
  assert.equal(learner.learner_display_name, 'Learner Alpha')
  assert.equal(learner.service_no_masked, profileA.service_no_masked)
  assert.equal(learner.attempts_started, '3')
  assert.equal(learner.attempts_completed, '2')
  assert.equal(learner.attempts_not_completed, '1')
  assert.equal(learner.archived, 'no')
  assert.ok(!csv.includes(idA), 'the raw service number was exported')

  // Attempt summary: the two completed attempts, oldest first, with the committed totals.
  const attempts = sectionRows(rows, 'ATTEMPTS')
  assert.deepEqual(attempts.map((r) => r.attempt_id), [a1, a2])
  for (const row of attempts) {
    const doc = await Attempt.findById(row.attempt_id)
    assert.equal(row.total_score, String(doc.total_score))
    assert.equal(row.status, 'completed')
  }

  // Scenario rows for both attempts, with scores that match the ledger.
  const scenarios = sectionRows(rows, 'SCENARIOS')
  assert.equal(scenarios.length, 20)
  for (const row of scenarios) {
    const run = await ScenarioRun.findOne({ attempt_id: row.attempt_id, ordinal: Number(row.ordinal) })
    assert.equal(row.score, String(run.score_0_10))
    assert.equal(row.scenario_ref, run.scenario_id)
    assert.ok(row.path_replay.length > 0, 'no path replay')
    assert.ok(row.feedback_result.length > 0, 'no feedback')
  }
  for (const name of ['BEHAVIOUR_BY_PLATFORM', 'BEHAVIOUR_BY_CASE_FAMILY', 'BEHAVIOUR_BY_TRIGGER',
    'BEHAVIOUR_BY_ACTION_STAGE', 'REMEDIATION']) {
    const block = sectionRows(rows, name)
    assert.deepEqual([...new Set(block.map((r) => r.attempt_id))].sort(), [a1, a2].sort(), name)
  }

  // Nothing from the other learner or the unfinished attempt; nothing the learner typed.
  assert.ok(!csv.includes(b1), 'another learner\'s attempt was exported')
  assert.ok(!csv.includes('Learner Bravo'))
  assert.ok(!csv.includes(idB))
  assert.ok(!csv.includes(aOpen), 'an unfinished attempt was exported')
  assert.ok(!csv.includes('ADM007-TYPED-RATIONALE'))
  assert.ok(!csv.includes('otp-771204'))

  // Nothing in the file can execute in a spreadsheet.
  for (const line of csv.split('\r\n')) assert.ok(!/^[=+@]/.test(line), `formula record: ${line}`)
})

it('the PDF is a real, marked, multi-attempt report of the same learner', async () => {
  await reset()
  const admin = await adminCookie()
  const { idA, a1, a2, b1, profileA } = await twoLearners()

  const res = await call(`/admin/exports/learners/${profileA._id}`,
    { method: 'POST', cookie: admin, body: { format: 'pdf' } })
  assert.equal(res.status, 201, JSON.stringify(res.data))

  const pdf = (await readFile(res.data.export.location.path)).toString('latin1')
  assert.ok(pdf.startsWith('%PDF-'))
  assert.ok(pdf.includes(TRAINING_MARKER))
  assert.ok(pdf.includes('INSTRUCTOR LEARNER REPORT'))
  assert.ok(pdf.includes('ATTEMPT 1 OF 2'))
  assert.ok(pdf.includes('ATTEMPT 2 OF 2'))
  assert.ok(pdf.includes(a1) && pdf.includes(a2))
  assert.ok(!pdf.includes(b1))
  assert.ok(!pdf.includes(idA))
  assert.ok(pdf.includes(profileA.service_no_masked.slice(-4)))

  // The artifact reads back through the existing admin route.
  const fetched = await call(`/admin/exports/${res.data.export.filename}`, { cookie: admin, raw: true })
  assert.equal(fetched.status, 200)
  assert.equal(fetched.headers.get('content-type'), 'application/pdf')
})

it('a learner export records one EXPORT_CREATED entry naming only the profile', async () => {
  await reset()
  const admin = await adminCookie()
  const { profileA } = await twoLearners()

  const res = await call(`/admin/exports/learners/${profileA._id}`,
    { method: 'POST', cookie: admin, body: { format: 'csv' } })

  const entries = await AuditEvent.find({ action: 'EXPORT_CREATED' })
  assert.equal(entries.length, 1)
  const entry = entries[0]
  assert.equal(entry.resource_type, 'export')
  assert.equal(entry.resource_id, res.data.export.artifact_id)
  assert.equal(entry.status, 'succeeded')
  assert.equal(entry.actor_username, 'adm007-admin')
  assert.deepEqual(Object.keys(entry.metadata).sort(),
    ['export_format', 'export_record_count', 'export_scope', 'profile_id'])
  assert.equal(entry.metadata.export_scope, 'learner')
  assert.equal(entry.metadata.profile_id, String(profileA._id))
  assert.equal(entry.metadata.export_record_count, 20)

  const text = JSON.stringify(entry.toObject())
  assert.ok(!text.includes('Learner Alpha'))
  assert.ok(!text.includes(exportDir))

  // It shows up in the admin audit log read route.
  const log = await call('/admin/audit?action=EXPORT_CREATED', { cookie: admin })
  assert.equal(log.status, 200)
  assert.ok(JSON.stringify(log.data).includes(res.data.export.artifact_id))
})

it('an idempotency key replays the same learner export and refuses any other operation', async () => {
  await reset()
  const admin = await adminCookie()
  const { profileA, profileB, a1 } = await twoLearners()
  const idem = key('learner-export')

  const first = await call(`/admin/exports/learners/${profileA._id}`,
    { method: 'POST', cookie: admin, body: { format: 'csv', idempotency_key: idem } })
  assert.equal(first.status, 201)
  const again = await call(`/admin/exports/learners/${profileA._id}`,
    { method: 'POST', cookie: admin, body: { format: 'csv', idempotency_key: idem } })
  assert.equal(again.status, 200)
  assert.equal(again.data.export.replayed, true)
  assert.equal(again.data.export.artifact_id, first.data.export.artifact_id)
  assert.equal(again.data.export.profile_id, String(profileA._id))

  // The same key for another learner, or for an attempt export, is a conflict - never a
  // replay of learner A's file under someone else's name.
  const other = await call(`/admin/exports/learners/${profileB._id}`,
    { method: 'POST', cookie: admin, body: { format: 'csv', idempotency_key: idem } })
  assert.equal(other.status, 409)
  assert.equal(other.data.error.code, 'IDEMPOTENCY_KEY_REUSED')
  const cross = await call(`/admin/exports/attempts/${a1}`,
    { method: 'POST', cookie: admin, body: { format: 'csv', idempotency_key: idem } })
  assert.equal(cross.status, 409)

  assert.equal(await AuditEvent.countDocuments({ action: 'EXPORT_CREATED' }), 1)
  assert.equal(await artifactCount(), 1)
})

it('an archived learner stays archived and masked, and can still be exported', async () => {
  await reset()
  const admin = await adminCookie()
  const { idA, profileA } = await twoLearners()

  const archived = await call(`/admin/learners/${profileA._id}/archive`,
    { method: 'POST', cookie: admin, body: { reason_code: 'course_complete' } })
  assert.equal(archived.status, 200)

  const res = await call(`/admin/exports/learners/${profileA._id}`,
    { method: 'POST', cookie: admin, body: { format: 'csv' } })
  assert.equal(res.status, 201)
  const csv = await readFile(res.data.export.location.path, 'utf8')
  const learner = Object.fromEntries(sectionRows(parseCsv(csv), 'LEARNER').map((r) => [r.field, r.value]))
  assert.equal(learner.archived, 'yes')
  assert.ok(learner.archived_at_utc)
  assert.ok(!csv.includes(idA))

  // Exporting did not un-archive, and the learner still cannot sign in.
  assert.equal((await Candidate.findById(profileA._id)).archived, true)
  const signInAgain = await call('/candidates',
    { method: 'POST', body: { name: 'Learner Alpha', identifier: idA } })
  assert.equal(signInAgain.status, 403)
  assert.equal(signInAgain.data.error.code, 'PROFILE_ARCHIVED')
})

/* ------------------------------------------------------------------ *
 * ADM-FIX-3  difficulty and military context
 * ------------------------------------------------------------------ */

it('the attempt viewer shows each finished scenario\'s difficulty and military flag', async () => {
  await reset()
  const admin = await adminCookie()
  const cookie = await signIn('Viewer Level', nextIdentifier())
  const attemptId = await completeAttempt(cookie)

  const res = await call(`/admin/attempts/${attemptId}`, { cookie: admin })
  assert.equal(res.status, 200)
  for (const scenario of res.data.scenarios) {
    const run = await ScenarioRun.findOne({ attempt_id: attemptId, ordinal: scenario.ordinal })
    const def = await ScenarioDefinition.findOne({
      scenario_id: run.scenario_id, version: run.definition_version,
    })
    assert.equal(scenario.level, def.level)
    assert.equal(scenario.military_flag, def.military_flag)
  }

  // Still instructor-only: the learner's own result carries neither.
  const own = await call(`/attempts/${attemptId}/result`, { cookie })
  const text = JSON.stringify(own.data)
  assert.ok(!text.includes('"level"'))
  assert.ok(!text.includes('"military_flag"'))
})

it('an unfinished scenario still publishes no difficulty or military flag', async () => {
  await reset()
  const admin = await adminCookie()
  const cookie = await signIn('Viewer Partial', nextIdentifier())
  const attemptId = await startAttempt(cookie)
  await playOne(cookie, attemptId)

  const res = await call(`/admin/attempts/${attemptId}`, { cookie: admin })
  const resolved = res.data.scenarios.filter((s) => s.resolved)
  const pending = res.data.scenarios.filter((s) => !s.resolved)
  assert.equal(resolved.length, 1)
  assert.ok(['easy', 'medium', 'hard'].includes(resolved[0].level))
  for (const scenario of pending) {
    assert.equal('level' in scenario, false)
    assert.equal('military_flag' in scenario, false)
  }
})

it('both exports carry difficulty and military flag from the pinned definition', async () => {
  await reset()
  const admin = await adminCookie()
  const cookie = await signIn('Export Level', nextIdentifier())
  const attemptId = await completeAttempt(cookie)
  const profile = await Candidate.findOne({ name: 'Export Level' })

  const attemptRes = await call(`/admin/exports/attempts/${attemptId}`,
    { method: 'POST', cookie: admin, body: { format: 'csv' } })
  const learnerRes = await call(`/admin/exports/learners/${profile._id}`,
    { method: 'POST', cookie: admin, body: { format: 'csv' } })
  assert.equal(attemptRes.status, 201)
  assert.equal(learnerRes.status, 201)

  for (const res of [attemptRes, learnerRes]) {
    const rows = sectionRows(parseCsv(await readFile(res.data.export.location.path, 'utf8')), 'SCENARIOS')
    assert.equal(rows.length, 10)
    for (const row of rows) {
      const run = await ScenarioRun.findOne({ attempt_id: attemptId, ordinal: Number(row.ordinal) })
      const def = await ScenarioDefinition.findOne({
        scenario_id: run.scenario_id, version: run.definition_version,
      })
      assert.equal(row.level, def.level)
      assert.equal(row.military_flag, def.military_flag ? 'yes' : 'no')
    }
  }

  // The existing attempt-export columns kept their positions: score is still column 5.
  const attemptCsv = await readFile(attemptRes.data.export.location.path, 'utf8')
  const header = parseCsv(attemptCsv).find((r) => r[0] === 'ordinal')
  assert.deepEqual(header.slice(0, 11), ['ordinal', 'scenario_ref', 'platform', 'resolved',
    'status', 'score', 'max_score', 'outcome_class', 'disposition', 'level', 'military_flag'])

  // And the PDF says it too.
  const pdfRes = await call(`/admin/exports/attempts/${attemptId}`,
    { method: 'POST', cookie: admin, body: { format: 'pdf' } })
  const pdf = (await readFile(pdfRes.data.export.location.path)).toString('latin1')
  assert.ok(pdf.includes('Difficulty'))
  assert.ok(pdf.includes('Military context'))
})
