import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import { createApp } from '../src/app.js'
import { ASSESSMENT_DURATION_OPTIONS_MINUTES } from '../src/constants/attemptTiming.js'
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
  expireDueAttempts,
  recoverExpiredAttemptsOnStartup,
} from '../src/services/attemptExpiryService.js'
import {
  loadSourceScenarios,
  loadTaxonomies,
  toScenarioDefinition,
} from '../src/services/scenarioDefinitionImportService.js'
import { detectTransactionSupport } from '../src/utils/transactions.js'

/**
 * Admin -> Settings: the configurable assessment duration, over real HTTP against a real
 * replica set.
 *
 * The properties defended here:
 *   - the setting holds one of five values (30/45/60/75/90 minutes), default 30;
 *   - a NEW attempt snapshots the setting into its own frozen deadline;
 *   - a change is refused server-side while any assessment is running;
 *   - nothing - a setting change, another learner, a restart - moves a running deadline.
 *
 *   npm run test:engine
 */

const URI = process.env.ENGINE_TEST_MONGO_URI
const MINUTE = 60 * 1000
let ready = false
let skipReason = 'ENGINE_TEST_MONGO_URI is not set'
let server
let base

async function listen() {
  server = createApp().listen(0, '127.0.0.1')
  await new Promise((r) => server.once('listening', r))
  base = `http://127.0.0.1:${server.address().port}/api`
}

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
      await createAdminUser({ username: 'duration-admin', password: 'a-long-training-password' })
      await listen()
      ready = true
    }
  } catch (error) {
    skipReason = `could not start: ${error.message.split('\n')[0]}`
  }
}

if (!ready) {
  // eslint-disable-next-line no-console
  console.warn(`\n[assessment duration] tests SKIPPED - ${skipReason}\n`)
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
    body: { username: 'duration-admin', password: 'a-long-training-password' },
  })
  assert.equal(res.status, 200, `admin login failed: ${JSON.stringify(res.data)}`)
  return res.cookie
}

const setDuration = (cookie, body) =>
  call('/admin/config/assessment-duration', { method: 'PATCH', cookie, body })

const durationIs = (cookie, minutes) =>
  setDuration(cookie, { assessment_duration_minutes: minutes })

let idSeq = 0
const nextIdentifier = () => `AD${String(700000 + (idSeq += 1))}`

/** Signs a new learner in and starts their assessment through the real API. */
async function startAssessment(name) {
  const signedIn = await call('/candidates', {
    method: 'POST', body: { name, identifier: nextIdentifier() },
  })
  assert.equal(signedIn.status, 201, `sign-in failed: ${JSON.stringify(signedIn.data)}`)
  const created = await call('/attempts', { method: 'POST', cookie: signedIn.cookie })
  assert.equal(created.status, 201, `start failed: ${JSON.stringify(created.data)}`)
  const attemptId = created.data.attempt.attempt_id
  return { cookie: signedIn.cookie, attemptId, attempt: await Attempt.findById(attemptId).lean() }
}

/** Asserts the stored limit, and that the deadline is exactly start + limit. */
function assertDeadline(attempt, minutes) {
  assert.equal(attempt.time_limit_ms, minutes * MINUTE)
  assert.equal(attempt.expires_at.getTime() - attempt.started_at.getTime(), minutes * MINUTE)
}

/** Snapshot of what must never move on a running attempt. */
const deadlineOf = async (attemptId) => {
  const a = await Attempt.findById(attemptId).lean()
  return { time_limit_ms: a.time_limit_ms, expires_at: a.expires_at.getTime(), status: a.status }
}

/** Simulates a setting that changed under a running attempt, bypassing the API guard. */
const forceStoredDuration = (minutes) =>
  Configuration.updateOne(
    { scope: 'instructor' },
    { $set: { assessment_duration_minutes: minutes } },
    { upsert: true },
  )

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
 * The setting
 * ------------------------------------------------------------------ */

it('1. the default duration is 30 minutes, and a new attempt receives it', async () => {
  await reset()
  const cookie = await adminCookie()

  const res = await call('/admin/config/assessment-duration', { cookie })
  assert.equal(res.status, 200)
  assert.equal(res.data.config.assessment_duration_minutes, 30)
  assert.equal(res.data.default_duration_minutes, 30)
  assert.deepEqual(res.data.allowed_durations_minutes, [30, 45, 60, 75, 90])
  assert.equal(res.data.running_assessments, 0)

  // With no settings document at all, a Start gets the 30-minute default.
  await Configuration.deleteMany({})
  const { attempt } = await startAssessment('Default Learner')
  assertDeadline(attempt, 30)
  assert.equal(await Configuration.countDocuments({}), 0, 'a learner Start never creates settings')
})

it('2-6. each allowed duration can be set, persisted and audited', async () => {
  await reset()
  const cookie = await adminCookie()

  // 30 is the default, so it is set last (from 90) to prove it is a real change too.
  const sequence = [45, 60, 75, 90, 30]
  let previous = 30
  for (const [i, minutes] of sequence.entries()) {
    const res = await durationIs(cookie, minutes)
    assert.equal(res.status, 200, `${minutes}: ${JSON.stringify(res.data)}`)
    assert.equal(res.data.changed, true)
    assert.equal(res.data.config.assessment_duration_minutes, minutes)
    assert.equal(res.data.config.config_version, i + 2)

    const stored = await Configuration.findOne({ scope: 'instructor' }).lean()
    assert.equal(stored.assessment_duration_minutes, minutes, 'the value is persisted')

    const entry = await AuditEvent.findOne({ action: 'CONFIG_CHANGED' }).sort({ _id: -1 }).lean()
    assert.equal(entry.resource_id, 'assessment_duration_minutes')
    assert.deepEqual(entry.metadata, {
      config_key: 'assessment_duration_minutes',
      config_previous_value: previous,
      config_new_value: minutes,
    })
    previous = minutes
  }
  assert.deepEqual([...sequence].sort((x, y) => x - y), ASSESSMENT_DURATION_OPTIONS_MINUTES)

  // Setting the value already in force changes and records nothing.
  const same = await durationIs(cookie, 30)
  assert.equal(same.status, 200)
  assert.equal(same.data.changed, false)
  assert.equal(await AuditEvent.countDocuments({ action: 'CONFIG_CHANGED' }), 5)
})

it('7. an invalid duration or body is rejected and nothing is stored', async () => {
  await reset()
  const cookie = await adminCookie()
  await durationIs(cookie, 45)
  const auditBefore = await AuditEvent.countDocuments({})

  const cases = [
    [{ assessment_duration_minutes: 0 }, 'INVALID_ASSESSMENT_DURATION'],
    [{ assessment_duration_minutes: 15 }, 'INVALID_ASSESSMENT_DURATION'],
    [{ assessment_duration_minutes: 46 }, 'INVALID_ASSESSMENT_DURATION'],
    [{ assessment_duration_minutes: 120 }, 'INVALID_ASSESSMENT_DURATION'],
    [{ assessment_duration_minutes: -30 }, 'INVALID_ASSESSMENT_DURATION'],
    [{ assessment_duration_minutes: 45.5 }, 'INVALID_ASSESSMENT_DURATION'],
    [{ assessment_duration_minutes: '60' }, 'INVALID_ASSESSMENT_DURATION'],
    [{ assessment_duration_minutes: null }, 'INVALID_ASSESSMENT_DURATION'],
    [{ assessment_duration_minutes: [60] }, 'INVALID_ASSESSMENT_DURATION'],
    [{ assessment_duration_minutes: { $gt: 0 } }, 'INVALID_ASSESSMENT_DURATION'],
    [{}, 'EMPTY_CONFIG_UPDATE'],
    [{ assessment_duration_minutes: 60, time_limit_ms: 1 }, 'FORBIDDEN_FIELD'],
    [{ assessment_duration_minutes: 60, config_version: 9 }, 'FORBIDDEN_FIELD'],
    [{ assessment_duration_minutes: 60, expected_config_version: 'x' }, 'FORBIDDEN_FIELD'],
  ]
  for (const [body, code] of cases) {
    const res = await setDuration(cookie, body)
    assert.equal(res.status, 422, `${JSON.stringify(body)} -> ${res.status}`)
    assert.equal(res.data.error.code, code, JSON.stringify(body))
  }

  const stored = await Configuration.findOne({ scope: 'instructor' }).lean()
  assert.equal(stored.assessment_duration_minutes, 45, 'a refused update changed the value')
  assert.equal(await AuditEvent.countDocuments({}), auditBefore, 'a refused update was audited')

  // The model is the second layer: even a direct save cannot store an arbitrary value.
  const doc = await Configuration.findOne({ scope: 'instructor' })
  doc.assessment_duration_minutes = 50
  await assert.rejects(() => doc.save(), /assessment_duration_minutes/)
})

it('the duration endpoints require an administrator', async () => {
  await reset()
  const learner = await startAssessment('Not An Admin')
  for (const [method, body] of [['GET', undefined], ['PATCH', { assessment_duration_minutes: 30 }]]) {
    const anon = await call('/admin/config/assessment-duration', { method, body })
    assert.equal(anon.status, 401)
    const asLearner = await call('/admin/config/assessment-duration', { method, body, cookie: learner.cookie })
    assert.equal(asLearner.status, 401)
  }
})

/* ------------------------------------------------------------------ *
 * The running-assessment lock
 * ------------------------------------------------------------------ */

it('8-9. a change succeeds with no assessment running and is refused while one is', async () => {
  await reset()
  const cookie = await adminCookie()

  // 8. 90 -> 45 with nobody testing: allowed.
  assert.equal((await durationIs(cookie, 45)).status, 200)

  // 9. 45 -> 60 while someone is testing: refused, server-side.
  const running = await startAssessment('Running Learner')
  const status = await call('/admin/config/assessment-duration', { cookie })
  assert.equal(status.data.running_assessments, 1)

  const refused = await durationIs(cookie, 60)
  assert.equal(refused.status, 409)
  assert.equal(refused.data.error.code, 'ASSESSMENT_IN_PROGRESS')
  assert.match(refused.data.error.message, /cannot be changed while an assessment is currently running/)

  const stored = await Configuration.findOne({ scope: 'instructor' }).lean()
  assert.equal(stored.assessment_duration_minutes, 45, 'the setting is unchanged')
  assert.equal(await AuditEvent.countDocuments({ resource_id: 'assessment_duration_minutes' }), 1)
  assertDeadline(await Attempt.findById(running.attemptId).lean(), 45)
})

it('5. an assessment that has ended no longer blocks a change', async () => {
  await reset()
  const cookie = await adminCookie()

  // Ended by an instructor reset (status abandoned).
  const resetOne = await startAssessment('Reset Learner')
  assert.equal((await durationIs(cookie, 90)).status, 409)
  const resetRes = await call(`/admin/attempts/${resetOne.attemptId}/reset`, {
    method: 'POST', cookie, body: {},
  })
  assert.equal(resetRes.status, 200, JSON.stringify(resetRes.data))
  assert.equal((await durationIs(cookie, 90)).status, 200)

  // Ended by its deadline: past-deadline already counts as over, then the sweep completes it.
  const timedOut = await startAssessment('Timed Out Learner')
  assert.equal((await durationIs(cookie, 45)).status, 409)
  await Attempt.updateOne({ _id: timedOut.attemptId },
    { $set: { expires_at: new Date(Date.now() - 1000) } })
  assert.equal((await durationIs(cookie, 45)).status, 200,
    'an attempt past its stored deadline is not running')
  await expireDueAttempts()
  assert.equal((await Attempt.findById(timedOut.attemptId)).status, 'completed')
  assert.equal((await durationIs(cookie, 60)).status, 200)
})

/* ------------------------------------------------------------------ *
 * Snapshots and frozen deadlines
 * ------------------------------------------------------------------ */

it('10. a newly started assessment receives the currently configured duration', async () => {
  await reset()
  const cookie = await adminCookie()

  for (const minutes of [45, 30, 75, 60, 90]) {
    assert.equal((await durationIs(cookie, minutes)).status, 200)
    const learner = await startAssessment(`Learner ${minutes}`)
    assertDeadline(learner.attempt, minutes)

    // The learner's own view carries the same server deadline.
    const current = await call('/attempts/current', { cookie: learner.cookie })
    assert.equal(new Date(current.data.attempt.expires_at).getTime(),
      learner.attempt.expires_at.getTime())

    // End it so the next change is allowed.
    await call(`/admin/attempts/${learner.attemptId}/reset`, { method: 'POST', cookie, body: {} })
  }
})

it('11. an active assessment keeps its original deadline when the setting changes', async () => {
  await reset()
  const cookie = await adminCookie()

  // Admin setting = 30 (the default). Learner A starts and gets 30 minutes.
  const a = await startAssessment('Learner A')
  assertDeadline(a.attempt, 30)
  const before = await deadlineOf(a.attemptId)

  // The API refuses 30 -> 45 while A is testing...
  assert.equal((await durationIs(cookie, 45)).status, 409)
  assert.deepEqual(await deadlineOf(a.attemptId), before)

  // ...and even if the stored setting did change underneath A, A is unaffected.
  await forceStoredDuration(45)
  const current = await call('/attempts/current', { cookie: a.cookie })
  assert.equal(current.status, 200)
  assert.equal(new Date(current.data.attempt.expires_at).getTime(), before.expires_at)
  assert.deepEqual(await deadlineOf(a.attemptId), before, 'A keeps its 30-minute deadline')

  // A learner starting after the change gets the new value.
  const b = await startAssessment('Learner B')
  assertDeadline(b.attempt, 45)
  assert.deepEqual(await deadlineOf(a.attemptId), before)

  // The model refuses to move a running deadline through any application save.
  const doc = await Attempt.findById(a.attemptId)
  doc.time_limit_ms = 45 * MINUTE
  doc.expires_at = new Date(doc.started_at.getTime() + 45 * MINUTE)
  await assert.rejects(() => doc.save(), /deadline is frozen/)
})

it('12. multiple active assessments each keep their own deadline', async () => {
  await reset()
  const learners = []
  for (const minutes of [90, 45, 30, 75]) {
    await forceStoredDuration(minutes)
    const learner = await startAssessment(`Concurrent ${minutes}`)
    learners.push({ ...learner, minutes, before: await deadlineOf(learner.attemptId) })
  }
  await forceStoredDuration(60)

  for (const learner of learners) {
    assertDeadline(await Attempt.findById(learner.attemptId).lean(), learner.minutes)
    assert.deepEqual(await deadlineOf(learner.attemptId), learner.before)
    const current = await call('/attempts/current', { cookie: learner.cookie })
    assert.equal(new Date(current.data.attempt.expires_at).getTime(), learner.before.expires_at)
  }

  const cookie = await adminCookie()
  const status = await call('/admin/config/assessment-duration', { cookie })
  assert.equal(status.data.running_assessments, 4)
})

it('13. a server restart does not change an active assessment deadline', async () => {
  await reset()
  const cookie = await adminCookie()
  assert.equal((await durationIs(cookie, 45)).status, 200)
  const learner = await startAssessment('Restart Learner')
  const before = await deadlineOf(learner.attemptId)

  // Restart: stop the HTTP server, drop and re-open the database connection, run the
  // startup recovery exactly as server.js does, then serve again.
  await new Promise((r) => server.close(r))
  await mongoose.disconnect()
  await mongoose.connect(URI, { serverSelectionTimeoutMS: 4000 })
  const recovery = await recoverExpiredAttemptsOnStartup()
  assert.equal(recovery.expired, 0, 'a live attempt is not swept on boot')
  await listen()

  assert.deepEqual(await deadlineOf(learner.attemptId), before)
  const current = await call('/attempts/current', { cookie: learner.cookie })
  assert.equal(current.status, 200)
  assert.equal(current.data.attempt.status, 'in_progress')
  assert.equal(new Date(current.data.attempt.expires_at).getTime(), before.expires_at)

  // The setting survived the restart too.
  const status = await call('/admin/config/assessment-duration', { cookie: await adminCookie() })
  assert.equal(status.data.config.assessment_duration_minutes, 45)
})

it('a learner request cannot choose or move its own deadline', async () => {
  await reset()
  await forceStoredDuration(30)
  const signedIn = await call('/candidates', {
    method: 'POST', body: { name: 'Sneaky Learner', identifier: nextIdentifier() },
  })
  const res = await call('/attempts', {
    method: 'POST', cookie: signedIn.cookie, body: { time_limit_ms: 240 * MINUTE },
  })
  assert.notEqual(res.status, 201, 'a client-supplied limit must not be accepted')
  assert.equal(await Attempt.countDocuments({}), 0)
})

/* ------------------------------------------------------------------ *
 * Concurrency
 * ------------------------------------------------------------------ */

it('9 (edge). two administrators saving at once leave one consistent value', async () => {
  await reset()
  const cookie = await adminCookie()
  const read = await call('/admin/config/assessment-duration', { cookie })
  const version = read.data.config.config_version

  const [first, second] = await Promise.all([
    setDuration(cookie, { assessment_duration_minutes: 45, expected_config_version: version }),
    setDuration(cookie, { assessment_duration_minutes: 60, expected_config_version: version }),
  ])
  const statuses = [first.status, second.status].sort()
  assert.deepEqual(statuses, [200, 409], 'exactly one save wins against the same version')
  const loser = first.status === 409 ? first : second
  assert.equal(loser.data.error.code, 'CONFIG_VERSION_CONFLICT')

  const winner = first.status === 200 ? first : second
  const stored = await Configuration.findOne({ scope: 'instructor' }).lean()
  assert.equal(stored.assessment_duration_minutes, winner.data.config.assessment_duration_minutes)
  assert.equal(stored.config_version, version + 1)
  assert.equal(await AuditEvent.countDocuments({ resource_id: 'assessment_duration_minutes' }), 1)

  // Without a version, concurrent saves serialise: the result is one allowed value.
  const results = await Promise.all([75, 90].map((minutes) => durationIs(cookie, minutes)))
  for (const res of results) assert.equal(res.status, 200, JSON.stringify(res.data))
  const final = await Configuration.findOne({ scope: 'instructor' }).lean()
  assert.ok([75, 90].includes(final.assessment_duration_minutes))
})

it('the feedback timing control is unaffected by a running assessment', async () => {
  await reset()
  const cookie = await adminCookie()
  await startAssessment('Feedback Learner')
  const res = await call('/admin/config/feedback', {
    method: 'PATCH', cookie, body: { training_feedback_timing: 'immediate' },
  })
  assert.equal(res.status, 200, JSON.stringify(res.data))
  assert.equal(res.data.config.assessment_duration_minutes, 30)
})
