import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import { createApp } from '../src/app.js'
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
import { effectiveFeedbackTiming, resetAttempt } from '../src/services/instructorControlService.js'
import { detectTransactionSupport } from '../src/utils/transactions.js'
import { codeFor } from './helpers/learnerActions.js'

/**
 * ADMIN-004 - the three instructor controls over real HTTP, against a real replica set.
 *
 * Attempts are played through the REAL candidate API, so what a reset acts on is state the
 * engine actually committed. The properties that matter cannot be shown without a database:
 * that a reset and its audit entry commit together or not at all, that a reset attempt is
 * genuinely unreachable to the learner, and that archiving a profile destroys nothing.
 *
 *   npm run test:engine
 */

const URI = process.env.ENGINE_TEST_MONGO_URI
let ready = false
let skipReason = 'ENGINE_TEST_MONGO_URI is not set'
let server
let base

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
      await createAdminUser({ username: 'controls-admin', password: 'a-long-training-password' })
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
  console.warn(`\n[ADMIN-004] instructor control tests SKIPPED - ${skipReason}\n`)
}

const it = (name, fn) => test(name, { skip: ready ? false : skipReason }, fn)

/* ------------------------------------------------------------------ *
 * helpers
 * ------------------------------------------------------------------ */

async function call(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  return { status: res.status, data, cookie: res.headers.getSetCookie?.()[0]?.split(';')[0] }
}

async function adminCookie() {
  const res = await call('/admin/login', {
    method: 'POST',
    body: { username: 'controls-admin', password: 'a-long-training-password' },
  })
  assert.equal(res.status, 200, `admin login failed: ${JSON.stringify(res.data)}`)
  return res.cookie
}

let idSeq = 0
const nextIdentifier = () => `IC${String(500000 + (idSeq += 1))}`
let keySeq = 0
const key = (label) => `${label}-${Date.now()}-${(keySeq += 1)}`

async function signIn(name, identifier) {
  const res = await call('/candidates', { method: 'POST', body: { name, identifier } })
  assert.equal(res.status, 201, `sign-in failed: ${JSON.stringify(res.data)}`)
  return res.cookie
}

const TYPED_RATIONALE = 'MY-TYPED-RATIONALE-otp-482915'

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

async function dispositionOf(runId) {
  const run = await ScenarioRun.findById(runId)
  const def = await ScenarioDefinition.findOne({
    scenario_id: run.scenario_id, version: run.definition_version,
  })
  return def.disposition
}

/** Plays `count` scenarios of an attempt, all safely. */
async function playScenarios(cookie, attemptId, count) {
  for (let i = 0; i < count; i += 1) {
    const cur = await call(`/attempts/${attemptId}/current-run`, { cookie })
    assert.ok(cur.data.run, `expected a run at position ${i + 1}`)
    const runId = cur.data.run.run_id
    const disposition = await dispositionOf(runId)
    const done = await walkSafely(cookie, attemptId, runId,
      disposition === 'malicious' ? 'report' : 'continue')
    assert.equal(done.status, 200, `resolve failed: ${JSON.stringify(done.data)}`)
  }
}

/** An attempt with `resolved` scenarios done and the rest outstanding. */
async function partialAttempt(name, resolved) {
  const cookie = await signIn(name, nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  if (resolved) await playScenarios(cookie, attemptId, resolved)
  const attempt = await Attempt.findById(attemptId)
  return { attemptId, cookie, profileId: attempt.profile_id.toString() }
}

async function completedAttempt(name) {
  const cookie = await signIn(name, nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playScenarios(cookie, attemptId, 10)
  const done = await call(`/attempts/${attemptId}/complete`, { method: 'POST', cookie })
  assert.equal(done.status, 200, `complete failed: ${JSON.stringify(done.data)}`)
  const attempt = await Attempt.findById(attemptId)
  return { attemptId, cookie, profileId: attempt.profile_id.toString() }
}

async function reset() {
  await Promise.all([
    Attempt.deleteMany({}), ScenarioRun.deleteMany({}), ScenarioEvent.deleteMany({}),
    Candidate.deleteMany({}), Configuration.deleteMany({}),
  ])
  await AuditEvent.collection.deleteMany({})
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
  }
})

/* ------------------------------------------------------------------ *
 * 1-3  authentication
 * ------------------------------------------------------------------ */

it('every control route refuses an anonymous request', async () => {
  const routes = [
    ['POST', '/admin/attempts/6a9e40cac3c410903d1c8f00/reset'],
    ['POST', '/admin/learners/6a9e40c5c3c410903d1c8eff/archive'],
    ['GET', '/admin/config/feedback'],
    ['PATCH', '/admin/config/feedback'],
  ]
  for (const [method, path] of routes) {
    const res = await call(path, { method, body: method === 'GET' ? undefined : {} })
    assert.equal(res.status, 401, `${method} ${path} was reachable`)
    assert.equal(res.data.error.code, 'NO_ADMIN_SESSION')
  }
})

it('a candidate session is rejected, not downgraded', async () => {
  await reset()
  const learner = await signIn('Control Learner', nextIdentifier())
  for (const [method, path] of [
    ['POST', '/admin/attempts/6a9e40cac3c410903d1c8f00/reset'],
    ['GET', '/admin/config/feedback'],
  ]) {
    const res = await call(path, { method, cookie: learner, body: method === 'GET' ? undefined : {} })
    assert.equal(res.status, 401)
    assert.equal(res.data.error.code, 'NO_ADMIN_SESSION')
  }
})

it('there is no DELETE and no candidate-facing control', async () => {
  await reset()
  const cookie = await adminCookie()
  const learner = await signIn('No Control', nextIdentifier())
  const { attemptId, profileId } = await partialAttempt('Verb Check', 1)

  for (const path of [`/admin/attempts/${attemptId}`, `/admin/learners/${profileId}`,
    '/admin/config/feedback']) {
    const res = await call(path, { method: 'DELETE', cookie })
    assert.equal(res.status, 404, `DELETE ${path} was routed`)
  }
  for (const path of [`/attempts/${attemptId}/reset`, '/config/feedback']) {
    const res = await call(path, { method: 'POST', cookie: learner, body: {} })
    assert.equal(res.status, 404, `${path} exists for a learner`)
  }
})

/* ------------------------------------------------------------------ *
 * 4-9  reset
 * ------------------------------------------------------------------ */

it('an in-progress attempt is reset, and nothing is deleted', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await partialAttempt('Reset One', 3)

  const before = {
    runs: await ScenarioRun.countDocuments({ attempt_id: attemptId }),
    events: await ScenarioEvent.countDocuments({}),
    resolved: await ScenarioRun.find({ attempt_id: attemptId, status: 'resolved' }).sort({ ordinal: 1 }),
  }

  const res = await call(`/admin/attempts/${attemptId}/reset`, {
    method: 'POST', cookie, body: { reason_code: 'technical_fault' },
  })
  assert.equal(res.status, 200, JSON.stringify(res.data))
  assert.equal(res.data.reset.changed, true)
  assert.equal(res.data.reset.previous_status, 'in_progress')
  assert.equal(res.data.reset.status, 'abandoned')
  assert.equal(res.data.reset.total_score, null)
  assert.equal(res.data.reset.result_available, false)
  assert.equal(res.data.reset.scenarios_discarded, 7)
  assert.equal(res.data.reset.scenarios_preserved, 3)

  const attempt = await Attempt.findById(attemptId)
  assert.equal(attempt.status, 'abandoned')
  assert.equal(attempt.total_score, null)
  assert.equal(attempt.completed_at, null)

  // NOTHING was deleted, and the resolved work is untouched.
  assert.equal(await ScenarioRun.countDocuments({ attempt_id: attemptId }), before.runs)
  assert.equal(await ScenarioEvent.countDocuments({}), before.events)
  const after = await ScenarioRun.find({ attempt_id: attemptId, status: 'resolved' }).sort({ ordinal: 1 })
  assert.deepEqual(after.map((r) => [r.ordinal, r.score_0_10, r.outcome_code]),
    before.resolved.map((r) => [r.ordinal, r.score_0_10, r.outcome_code]))

  // The unresolved runs are abandoned, so no run contradicts the attempt.
  assert.equal(await ScenarioRun.countDocuments({ attempt_id: attemptId, status: 'active' }), 0)
  assert.equal(await ScenarioRun.countDocuments({ attempt_id: attemptId, status: 'abandoned' }), 7)
})

it('a completed attempt can never be reset', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await completedAttempt('Reset Completed')
  const before = (await Attempt.findById(attemptId)).toObject()

  const res = await call(`/admin/attempts/${attemptId}/reset`, { method: 'POST', cookie, body: {} })
  assert.equal(res.status, 409)
  assert.equal(res.data.error.code, 'ATTEMPT_NOT_RESETTABLE')

  assert.deepEqual((await Attempt.findById(attemptId)).toObject(), before)
  assert.equal(await AuditEvent.countDocuments({}), 0, 'a refused reset was recorded')
})

it('a nonexistent or malformed attempt id is a 404 and writes nothing', async () => {
  await reset()
  const cookie = await adminCookie()
  for (const id of ['6a9e40cac3c410903d1c8fff', 'not-an-id', '123', 'null']) {
    const res = await call(`/admin/attempts/${id}/reset`, { method: 'POST', cookie, body: {} })
    assert.equal(res.status, 404, `${id} produced ${res.status}`)
    assert.equal(res.data.error.code, 'ATTEMPT_NOT_FOUND')
  }
  assert.equal(await AuditEvent.countDocuments({}), 0)
})

it('a reset request accepts only the documented fields', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await partialAttempt('Reset Fields', 1)

  for (const body of [
    { status: 'completed' }, { total_score: 100 }, { profile_id: 'x' },
    { scenario_sequence: [] }, { seed: 'abc' }, { completed_at: new Date().toISOString() },
  ]) {
    const res = await call(`/admin/attempts/${attemptId}/reset`, { method: 'POST', cookie, body })
    assert.equal(res.status, 422, `${JSON.stringify(body)} was accepted`)
    assert.equal(res.data.error.code, 'FORBIDDEN_FIELD')
    assert.deepEqual(res.data.error.details.rejected_fields, Object.keys(body))
  }

  const badReason = await call(`/admin/attempts/${attemptId}/reset`, {
    method: 'POST', cookie, body: { reason_code: 'because the learner was ill' },
  })
  assert.equal(badReason.status, 422)
  assert.equal(badReason.data.error.code, 'INVALID_REASON_CODE')

  // Still in progress after every refusal.
  assert.equal((await Attempt.findById(attemptId)).status, 'in_progress')
})

it('a reset appends exactly one ATTEMPT_RESET entry, carrying no learner content', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await partialAttempt('Reset Audit', 2)

  await call(`/admin/attempts/${attemptId}/reset`, {
    method: 'POST', cookie, body: { reason_code: 'learner_request' },
  })

  const entries = await AuditEvent.find({})
  assert.equal(entries.length, 1)
  const entry = entries[0]
  assert.equal(entry.action, 'ATTEMPT_RESET')
  assert.equal(entry.resource_type, 'attempt')
  assert.equal(entry.resource_id, attemptId)
  assert.equal(entry.status, 'succeeded')
  assert.equal(entry.actor_username, 'controls-admin')
  assert.equal(entry.metadata.attempt_status, 'in_progress')
  assert.equal(entry.metadata.scenarios_discarded, 8)
  assert.equal(entry.metadata.reason_code, 'learner_request')
  assert.deepEqual(Object.keys(entry.metadata).sort(),
    ['attempt_id', 'attempt_status', 'reason_code', 'scenarios_discarded'])

  const text = JSON.stringify(entry.toObject())
  assert.ok(!text.includes(TYPED_RATIONALE))
  assert.ok(!text.includes('otp-482915'))
  for (const field of ['rationale', 'event_code', 'points_delta', 'seed', 'identifier',
    'password', 'metadata_allowlist']) {
    assert.ok(!text.includes(`"${field}":`), `the audit entry carries "${field}"`)
  }
})

it('the reset and its audit entry commit together or not at all', async () => {
  await reset()
  const { attemptId } = await partialAttempt('Reset Rollback', 2)
  const admin = await AdminUser.findOne({ username: 'controls-admin' })

  // The attempt and the runs are written FIRST, then the audit entry - so an actor that
  // ADMIN-005 refuses makes `append()` throw after both writes, inside the transaction.
  // That is the only way to prove the two halves are genuinely coupled rather than merely
  // adjacent.
  await assert.rejects(
    () => resetAttempt(attemptId, {
      actor: { _id: admin._id, username: null }, // append() refuses an actor with no name
      body: {},
    }),
    (error) => error.code === 'INVALID_AUDIT_ACTOR',
  )
  const attempt = await Attempt.findById(attemptId)
  assert.equal(attempt.status, 'in_progress', 'the attempt was left reset after a failure')
  assert.equal(await ScenarioRun.countDocuments({ attempt_id: attemptId, status: 'abandoned' }), 0,
    'runs were left abandoned after a failed reset')
  assert.equal(await AuditEvent.countDocuments({}), 0, 'a failed reset was recorded')

  // And a valid reset still works afterwards.
  const cookie = await adminCookie()
  const ok = await call(`/admin/attempts/${attemptId}/reset`, { method: 'POST', cookie, body: {} })
  assert.equal(ok.status, 200)
  assert.equal(await AuditEvent.countDocuments({ action: 'ATTEMPT_RESET' }), 1)
})

/* ------------------------------------------------------------------ *
 * 10-13  reset: idempotency, races and the learner consequence
 * ------------------------------------------------------------------ */

it('a repeated reset changes nothing and records nothing', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await partialAttempt('Reset Repeat', 2)

  const first = await call(`/admin/attempts/${attemptId}/reset`, { method: 'POST', cookie, body: {} })
  assert.equal(first.data.reset.changed, true)

  for (let i = 0; i < 3; i += 1) {
    const again = await call(`/admin/attempts/${attemptId}/reset`, { method: 'POST', cookie, body: {} })
    assert.equal(again.status, 200)
    assert.equal(again.data.reset.changed, false)
    assert.equal(again.data.reset.status, 'abandoned')
    assert.equal(again.data.reset.total_score, null)
  }
  assert.equal(await AuditEvent.countDocuments({ action: 'ATTEMPT_RESET' }), 1)
})

it('two concurrent resets produce one state change and one audit entry', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await partialAttempt('Reset Race', 2)

  const results = await Promise.all([
    call(`/admin/attempts/${attemptId}/reset`, { method: 'POST', cookie, body: {} }),
    call(`/admin/attempts/${attemptId}/reset`, { method: 'POST', cookie, body: {} }),
    call(`/admin/attempts/${attemptId}/reset`, { method: 'POST', cookie, body: {} }),
  ])

  const changed = results.filter((r) => r.status === 200 && r.data.reset.changed)
  assert.equal(changed.length, 1, 'more than one caller reset the same attempt')
  for (const other of results.filter((r) => !(r.status === 200 && r.data.reset.changed))) {
    assert.ok([200, 409].includes(other.status), `unexpected status ${other.status}`)
  }
  assert.equal(await AuditEvent.countDocuments({ action: 'ATTEMPT_RESET' }), 1)
  assert.equal((await Attempt.findById(attemptId)).status, 'abandoned')
})

it('the learner cannot resume a reset attempt, and can start a fresh one', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId, cookie: learner } = await partialAttempt('Reset Learner', 4)

  // Before: resumable, and the next scenario is served.
  const beforeCurrent = await call('/attempts/current', { cookie: learner })
  assert.equal(beforeCurrent.data.attempt.attempt_id, attemptId)
  const beforeRun = await call(`/attempts/${attemptId}/current-run`, { cookie: learner })
  assert.ok(beforeRun.data.run)
  const runId = beforeRun.data.run.run_id

  await call(`/admin/attempts/${attemptId}/reset`, { method: 'POST', cookie, body: {} })

  // After: no resumable attempt, no current run, and no way to act on the old one.
  const afterCurrent = await call('/attempts/current', { cookie: learner })
  assert.equal(afterCurrent.data.attempt, null, 'the reset attempt is still resumable')

  const afterRun = await call(`/attempts/${attemptId}/current-run`, { cookie: learner })
  assert.equal(afterRun.status, 200)
  assert.equal(afterRun.data.run, null, 'a reset attempt still served a scenario')
  assert.equal(afterRun.data.scenario, null)

  const event = await call(`/attempts/${attemptId}/runs/${runId}/events`, {
    method: 'POST', cookie: learner, body: { action_code: await codeFor(runId, 'open_item'), intent_key: key('after') },
  })
  assert.equal(event.status, 409)
  assert.equal(event.data.error.code, 'ATTEMPT_NOT_IN_PROGRESS')

  const complete = await call(`/attempts/${attemptId}/complete`, { method: 'POST', cookie: learner })
  assert.equal(complete.status, 409, 'a reset attempt could be completed')

  const result = await call(`/attempts/${attemptId}/result`, { cookie: learner })
  assert.equal(result.status, 409)
  assert.equal(result.data.error.code, 'ATTEMPT_NOT_COMPLETE')
  assert.ok(!JSON.stringify(result.data).includes('total_score'), 'a result was fabricated')

  // And the learner may start a new attempt straight away.
  const fresh = await call('/attempts', { method: 'POST', cookie: learner })
  assert.equal(fresh.status, 201)
  assert.notEqual(fresh.data.attempt.attempt_id, attemptId)
  assert.equal(fresh.data.attempt.status, 'in_progress')
})

it('a reset names one attempt, so a replacement attempt is never touched', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId, cookie: learner } = await partialAttempt('Reset Stale', 2)

  await call(`/admin/attempts/${attemptId}/reset`, { method: 'POST', cookie, body: {} })
  const fresh = await call('/attempts', { method: 'POST', cookie: learner })
  const freshId = fresh.data.attempt.attempt_id

  // A stale client retrying the ORIGINAL reset must not touch the new attempt.
  const stale = await call(`/admin/attempts/${attemptId}/reset`, { method: 'POST', cookie, body: {} })
  assert.equal(stale.data.reset.changed, false)
  assert.equal((await Attempt.findById(freshId)).status, 'in_progress')
  assert.equal(await AuditEvent.countDocuments({ action: 'ATTEMPT_RESET' }), 1)
})

/* ------------------------------------------------------------------ *
 * 14-18  archive
 * ------------------------------------------------------------------ */

it('archiving a profile deletes nothing and preserves every record', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId, profileId } = await completedAttempt('Archive One')
  const partial = await partialAttempt('Archive One', 2)

  // Give the same profile a second, incomplete attempt by reusing its own session.
  const before = {
    profile: (await Candidate.findById(profileId)).toObject(),
    attempts: await Attempt.countDocuments({}),
    runs: await ScenarioRun.countDocuments({}),
    events: await ScenarioEvent.countDocuments({}),
    definitions: await ScenarioDefinition.countDocuments({}),
  }

  const res = await call(`/admin/learners/${profileId}/archive`, {
    method: 'POST', cookie, body: { reason_code: 'course_complete' },
  })
  assert.equal(res.status, 200, JSON.stringify(res.data))
  assert.equal(res.data.profile.archived, true)
  assert.equal(res.data.profile.changed, true)
  assert.ok(res.data.profile.archived_at)
  assert.equal(res.data.profile.profile_id, profileId)

  // The profile still exists, with its identity intact.
  const after = await Candidate.findById(profileId)
  assert.ok(after, 'the profile was deleted')
  assert.equal(after.name, before.profile.name)
  assert.equal(after.identifier, before.profile.identifier)
  assert.equal(after.archived, true)

  // Every other record survives.
  assert.equal(await Attempt.countDocuments({}), before.attempts)
  assert.equal(await ScenarioRun.countDocuments({}), before.runs)
  assert.equal(await ScenarioEvent.countDocuments({}), before.events)
  assert.equal(await ScenarioDefinition.countDocuments({}), before.definitions)
  assert.equal((await Attempt.findById(attemptId)).status, 'completed')
  assert.equal((await Attempt.findById(partial.attemptId)).status, 'in_progress')

  // And an instructor can still inspect the archived learner's attempt.
  const viewed = await call(`/admin/attempts/${attemptId}`, { cookie })
  assert.equal(viewed.status, 200)
  assert.equal(viewed.data.attempt.profile.profile_id, profileId)
})

it('an archived learner cannot sign in, and signing in does not un-archive', async () => {
  await reset()
  const cookie = await adminCookie()
  const identifier = nextIdentifier()
  const learner = await signIn('Archive Access', identifier)
  const profile = await Candidate.findOne({ name: 'Archive Access' })

  await call(`/admin/learners/${profile._id}/archive`, { method: 'POST', cookie, body: {} })

  // A fresh sign-in is refused...
  const again = await call('/candidates', {
    method: 'POST', body: { name: 'Archive Access', identifier },
  })
  assert.equal(again.status, 403)
  assert.equal(again.data.error.code, 'PROFILE_ARCHIVED')
  assert.equal((await Candidate.findById(profile._id)).archived, true,
    'signing in un-archived the profile')

  // ...and the session that was already open stops working.
  const withOldCookie = await call('/attempts/current', { cookie: learner })
  assert.equal(withOldCookie.status, 401)
  assert.equal(withOldCookie.data.error.code, 'PROFILE_ARCHIVED')
})

it('archiving is idempotent and records once', async () => {
  await reset()
  const cookie = await adminCookie()
  await signIn('Archive Repeat', nextIdentifier())
  const profile = await Candidate.findOne({ name: 'Archive Repeat' })

  const first = await call(`/admin/learners/${profile._id}/archive`, { method: 'POST', cookie, body: {} })
  assert.equal(first.data.profile.changed, true)
  const archivedAt = first.data.profile.archived_at

  for (let i = 0; i < 3; i += 1) {
    const again = await call(`/admin/learners/${profile._id}/archive`, { method: 'POST', cookie, body: {} })
    assert.equal(again.status, 200)
    assert.equal(again.data.profile.changed, false)
    assert.equal(again.data.profile.archived, true)
    assert.equal(again.data.profile.archived_at, archivedAt, 'the archive timestamp moved')
  }
  assert.equal(await AuditEvent.countDocuments({ action: 'PROFILE_ARCHIVED' }), 1)

  const concurrent = await Promise.all([
    call(`/admin/learners/${profile._id}/archive`, { method: 'POST', cookie, body: {} }),
    call(`/admin/learners/${profile._id}/archive`, { method: 'POST', cookie, body: {} }),
  ])
  for (const res of concurrent) assert.equal(res.data.profile.changed, false)
  assert.equal(await AuditEvent.countDocuments({ action: 'PROFILE_ARCHIVED' }), 1)
})

it('the archive audit entry names the profile and nothing about the person', async () => {
  await reset()
  const cookie = await adminCookie()
  const identifier = nextIdentifier()
  await signIn('Archive Audit', identifier)
  const profile = await Candidate.findOne({ name: 'Archive Audit' })

  await call(`/admin/learners/${profile._id}/archive`, {
    method: 'POST', cookie, body: { reason_code: 'local_policy' },
  })

  const entry = await AuditEvent.findOne({ action: 'PROFILE_ARCHIVED' })
  assert.equal(entry.resource_type, 'learner_profile')
  assert.equal(entry.resource_id, profile._id.toString())
  assert.equal(entry.status, 'succeeded')
  assert.deepEqual(Object.keys(entry.metadata), ['reason_code'])

  const text = JSON.stringify(entry.toObject())
  assert.ok(!text.includes('Archive Audit'), 'the entry carries the learner name')
  assert.ok(!text.includes(identifier), 'the entry carries the service number')
})

it('an archive request accepts only the documented fields, and a bad id is a 404', async () => {
  await reset()
  const cookie = await adminCookie()
  await signIn('Archive Fields', nextIdentifier())
  const profile = await Candidate.findOne({ name: 'Archive Fields' })

  for (const body of [{ archived: false }, { name: 'x' }, { identifier: 'y' },
    { archived_at: null }, { deleted: true }]) {
    const res = await call(`/admin/learners/${profile._id}/archive`, { method: 'POST', cookie, body })
    assert.equal(res.status, 422, `${JSON.stringify(body)} was accepted`)
    assert.equal(res.data.error.code, 'FORBIDDEN_FIELD')
  }
  assert.equal((await Candidate.findById(profile._id)).archived, false)

  for (const id of ['6a9e40cac3c410903d1c8fff', 'not-an-id']) {
    const res = await call(`/admin/learners/${id}/archive`, { method: 'POST', cookie, body: {} })
    assert.equal(res.status, 404)
    assert.equal(res.data.error.code, 'PROFILE_NOT_FOUND')
  }
})

it('an admin can still reset the in-progress attempt of an archived learner', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId, profileId } = await partialAttempt('Archive Then Reset', 3)

  await call(`/admin/learners/${profileId}/archive`, { method: 'POST', cookie, body: {} })
  // Archiving on its own does NOT touch the attempt.
  assert.equal((await Attempt.findById(attemptId)).status, 'in_progress')

  const res = await call(`/admin/attempts/${attemptId}/reset`, { method: 'POST', cookie, body: {} })
  assert.equal(res.status, 200)
  assert.equal(res.data.reset.changed, true)
  assert.equal((await Attempt.findById(attemptId)).status, 'abandoned')
})

/* ------------------------------------------------------------------ *
 * 19-25  feedback timing configuration
 * ------------------------------------------------------------------ */

it('the configuration reads back with the documented defaults', async () => {
  await reset()
  const cookie = await adminCookie()

  const res = await call('/admin/config/feedback', { cookie })
  assert.equal(res.status, 200)
  assert.equal(res.data.config.training_feedback_timing, 'on_completion')
  assert.equal(res.data.config.assessment_feedback_timing, 'on_completion')
  assert.equal(res.data.config.config_version, 1)
  assert.deepEqual(res.data.allowed_timings, ['immediate', 'on_completion'])
  // ADM-007: both timings now take effect on the learner's resolve step.
  assert.ok(res.data.enforcement.immediate.startsWith('enforced'))

  // Reading is not a change: it writes no audit entry.
  assert.equal(await AuditEvent.countDocuments({}), 0)
  // And it is stable.
  const again = await call('/admin/config/feedback', { cookie })
  assert.deepEqual(again.data.config, res.data.config)
})

it('a valid update changes the value, bumps the version and records it', async () => {
  await reset()
  const cookie = await adminCookie()

  const res = await call('/admin/config/feedback', {
    method: 'PATCH', cookie, body: { training_feedback_timing: 'immediate' },
  })
  assert.equal(res.status, 200, JSON.stringify(res.data))
  assert.equal(res.data.changed, true)
  assert.deepEqual(res.data.changed_keys, ['training_feedback_timing'])
  assert.equal(res.data.config.training_feedback_timing, 'immediate')
  assert.equal(res.data.config.assessment_feedback_timing, 'on_completion')
  assert.equal(res.data.config.config_version, 2)
  assert.equal(res.data.config.updated_by_username, 'controls-admin')

  const entries = await AuditEvent.find({ action: 'CONFIG_CHANGED' })
  assert.equal(entries.length, 1)
  assert.equal(entries[0].resource_type, 'configuration')
  assert.equal(entries[0].resource_id, 'training_feedback_timing')
  assert.deepEqual(entries[0].metadata, {
    config_key: 'training_feedback_timing',
    config_previous_value: 'on_completion',
    config_new_value: 'immediate',
  })

  // The service's own read agrees with what was stored.
  assert.equal(await effectiveFeedbackTiming('training'), 'immediate')
  assert.equal(await effectiveFeedbackTiming('assessment'), 'on_completion')
})

it('changing both keys writes one entry per key, in one transaction', async () => {
  await reset()
  const cookie = await adminCookie()

  const res = await call('/admin/config/feedback', {
    method: 'PATCH',
    cookie,
    body: { training_feedback_timing: 'immediate', assessment_feedback_timing: 'immediate' },
  })
  assert.equal(res.status, 200)
  assert.deepEqual(res.data.changed_keys.sort(),
    ['assessment_feedback_timing', 'training_feedback_timing'])
  assert.equal(res.data.config.config_version, 2, 'one change bumps the version once')

  const entries = await AuditEvent.find({ action: 'CONFIG_CHANGED' }).sort({ resource_id: 1 })
  assert.equal(entries.length, 2)
  assert.deepEqual(entries.map((e) => e.resource_id),
    ['assessment_feedback_timing', 'training_feedback_timing'])
  for (const entry of entries) {
    assert.equal(entry.metadata.config_previous_value, 'on_completion')
    assert.equal(entry.metadata.config_new_value, 'immediate')
  }
})

it('an invalid timing, an unknown field or an empty update is refused', async () => {
  await reset()
  const cookie = await adminCookie()

  for (const [body, code] of [
    [{ training_feedback_timing: 'whenever' }, 'INVALID_FEEDBACK_TIMING'],
    [{ training_feedback_timing: 'IMMEDIATE' }, 'INVALID_FEEDBACK_TIMING'],
    [{ training_feedback_timing: true }, 'INVALID_FEEDBACK_TIMING'],
    [{ training_feedback_timing: { $ne: null } }, 'INVALID_FEEDBACK_TIMING'],
    [{ scoring_multiplier: 2 }, 'FORBIDDEN_FIELD'],
    [{ config_version: 99 }, 'FORBIDDEN_FIELD'],
    [{ canonical_family: 'x' }, 'FORBIDDEN_FIELD'],
    [{ session_secret: 'x' }, 'FORBIDDEN_FIELD'],
    [{}, 'EMPTY_CONFIG_UPDATE'],
  ]) {
    const res = await call('/admin/config/feedback', { method: 'PATCH', cookie, body })
    assert.equal(res.status, 422, `${JSON.stringify(body)} was accepted`)
    assert.equal(res.data.error.code, code, JSON.stringify(res.data))
  }

  const config = await Configuration.findOne({})
  assert.ok(!config || config.config_version === 1, 'a refused update changed the version')
  assert.equal(await AuditEvent.countDocuments({}), 0)
})

it('setting a value to what it already is changes nothing and records nothing', async () => {
  await reset()
  const cookie = await adminCookie()

  const first = await call('/admin/config/feedback', {
    method: 'PATCH', cookie, body: { training_feedback_timing: 'immediate' },
  })
  assert.equal(first.data.config.config_version, 2)

  for (let i = 0; i < 3; i += 1) {
    const again = await call('/admin/config/feedback', {
      method: 'PATCH', cookie, body: { training_feedback_timing: 'immediate' },
    })
    assert.equal(again.status, 200)
    assert.equal(again.data.changed, false)
    assert.deepEqual(again.data.changed_keys, [])
    assert.equal(again.data.config.config_version, 2, 'a no-op bumped the version')
  }
  assert.equal(await AuditEvent.countDocuments({ action: 'CONFIG_CHANGED' }), 1)
})

it('a stale configuration version is refused rather than overwriting', async () => {
  await reset()
  const cookie = await adminCookie()

  await call('/admin/config/feedback', {
    method: 'PATCH', cookie, body: { training_feedback_timing: 'immediate' },
  })

  const stale = await call('/admin/config/feedback', {
    method: 'PATCH',
    cookie,
    body: { assessment_feedback_timing: 'immediate', expected_config_version: 1 },
  })
  assert.equal(stale.status, 409)
  assert.equal(stale.data.error.code, 'CONFIG_VERSION_CONFLICT')
  assert.equal((await Configuration.findOne({})).assessment_feedback_timing, 'on_completion')

  const current = await call('/admin/config/feedback', {
    method: 'PATCH',
    cookie,
    body: { assessment_feedback_timing: 'immediate', expected_config_version: 2 },
  })
  assert.equal(current.status, 200)
  assert.equal(current.data.config.config_version, 3)
  assert.equal(await AuditEvent.countDocuments({ action: 'CONFIG_CHANGED' }), 2)
})

it('concurrent configuration updates leave one coherent state', async () => {
  await reset()
  const cookie = await adminCookie()

  const results = await Promise.all([
    call('/admin/config/feedback', { method: 'PATCH', cookie, body: { training_feedback_timing: 'immediate' } }),
    call('/admin/config/feedback', { method: 'PATCH', cookie, body: { training_feedback_timing: 'immediate' } }),
    call('/admin/config/feedback', { method: 'PATCH', cookie, body: { training_feedback_timing: 'immediate' } }),
  ])
  for (const res of results) assert.ok([200, 409].includes(res.status), `status ${res.status}`)

  const config = await Configuration.findOne({})
  assert.equal(config.training_feedback_timing, 'immediate')
  assert.equal(await Configuration.countDocuments({}), 1, 'a second settings row was created')
  // Exactly one entry per change that actually happened.
  assert.equal(await AuditEvent.countDocuments({ action: 'CONFIG_CHANGED' }),
    config.config_version - 1)
})

/* ------------------------------------------------------------------ *
 * 26-27  privacy and non-interference
 * ------------------------------------------------------------------ */

it('no control response carries learner identity or content', async () => {
  await reset()
  const cookie = await adminCookie()
  const identifier = nextIdentifier()
  const learner = await signIn('Privacy Check', identifier)
  const created = await call('/attempts', { method: 'POST', cookie: learner })
  const attemptId = created.data.attempt.attempt_id
  await playScenarios(learner, attemptId, 1)
  const profile = await Candidate.findOne({ name: 'Privacy Check' })
  const attempt = await Attempt.findById(attemptId)

  const responses = [
    await call(`/admin/attempts/${attemptId}/reset`, { method: 'POST', cookie, body: {} }),
    await call(`/admin/learners/${profile._id}/archive`, { method: 'POST', cookie, body: {} }),
    await call('/admin/config/feedback', { cookie }),
    await call('/admin/config/feedback', {
      method: 'PATCH', cookie, body: { training_feedback_timing: 'immediate' },
    }),
  ]

  for (const res of responses) {
    const text = JSON.stringify(res.data)
    assert.ok(!text.includes(identifier), 'a control response published the service number')
    assert.ok(!text.includes('Privacy Check'), 'a control response published the learner name')
    assert.ok(!text.includes(TYPED_RATIONALE))
    assert.ok(!text.includes(attempt.seed), 'a control response published the seed')
    for (const field of ['password', 'password_hash', 'identifier', 'rationale', 'seed',
      'selection', 'scenario_sequence', 'event_code', 'points_delta', 'metadata',
      'intent_key', 'evaluation', '_id', '__v']) {
      assert.ok(!text.includes(`"${field}":`), `a control response carries "${field}"`)
    }
  }

  assert.deepEqual(Object.keys(responses[0].data.reset).sort(), [
    'attempt_id', 'changed', 'previous_status', 'reset_at', 'result_available',
    'scenarios_discarded', 'scenarios_preserved', 'status', 'total_score',
  ])
  assert.deepEqual(Object.keys(responses[1].data.profile).sort(),
    ['archived', 'archived_at', 'archived_by', 'changed', 'profile_id'])
})

it('the controls touch no scenario definition and no other learner', async () => {
  await reset()
  const cookie = await adminCookie()
  const mine = await partialAttempt('Isolation Mine', 2)
  const theirs = await partialAttempt('Isolation Theirs', 3)

  const definitionsBefore = await ScenarioDefinition.countDocuments({})
  const theirAttemptBefore = (await Attempt.findById(theirs.attemptId)).toObject()
  const theirProfileBefore = (await Candidate.findById(theirs.profileId)).toObject()

  await call(`/admin/attempts/${mine.attemptId}/reset`, { method: 'POST', cookie, body: {} })
  await call(`/admin/learners/${mine.profileId}/archive`, { method: 'POST', cookie, body: {} })
  await call('/admin/config/feedback', {
    method: 'PATCH', cookie, body: { assessment_feedback_timing: 'immediate' },
  })

  assert.equal(await ScenarioDefinition.countDocuments({}), definitionsBefore)
  assert.equal(await ScenarioDefinition.countDocuments({ active: true }), definitionsBefore)
  assert.deepEqual((await Attempt.findById(theirs.attemptId)).toObject(), theirAttemptBefore)
  assert.deepEqual((await Candidate.findById(theirs.profileId)).toObject(), theirProfileBefore)

  // The other learner is entirely unaffected.
  const stillWorking = await call('/attempts/current', { cookie: theirs.cookie })
  assert.equal(stillWorking.status, 200)
  assert.equal(stillWorking.data.attempt.attempt_id, theirs.attemptId)
})
