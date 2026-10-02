import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import { createApp } from '../src/app.js'
import { AdminUser } from '../src/models/AdminUser.js'
import { Attempt } from '../src/models/Attempt.js'
import { AuditEvent } from '../src/models/AuditEvent.js'
import { Candidate } from '../src/models/Candidate.js'
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
import { codeFor } from './helpers/learnerActions.js'

/**
 * ENHANCEMENT-001 - the instructor dashboard over real HTTP, against a real replica set.
 *
 * Attempts are played through the REAL candidate API, so the dashboard is aggregating what
 * the engine actually committed. The central claim is then checked directly: every
 * dashboard count equals the sum of the same counts in each attempt's authoritative
 * result, as the instructor attempt viewer reports it. If the dashboard ever classified a
 * scenario differently from the result screen, these sums would disagree.
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
        Candidate.deleteMany({}), AdminUser.deleteMany({}),
        AuditEvent.collection.deleteMany({}),
      ])
      await createAdminUser({ username: 'dashboard-admin', password: 'a-long-training-password' })
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
  console.warn(`\n[ENHANCEMENT-001] dashboard API tests SKIPPED - ${skipReason}\n`)
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
    body: { username: 'dashboard-admin', password: 'a-long-training-password' },
  })
  assert.equal(res.status, 200, `admin login failed: ${JSON.stringify(res.data)}`)
  return res.cookie
}

let idSeq = 0
const nextIdentifier = () => `DB${String(500000 + (idSeq += 1))}`
let keySeq = 0
const key = (label) => `${label}-${Date.now()}-${(keySeq += 1)}`

const LEARNER_NAME = 'Dashboard Learner Zeta'
const TYPED_RATIONALE = 'DASHBOARD-TYPED-RATIONALE-otp-771203'

async function signIn(name, identifier) {
  const res = await call('/candidates', { method: 'POST', body: { name, identifier } })
  assert.equal(res.status, 201, `sign-in failed: ${JSON.stringify(res.data)}`)
  return res.cookie
}

async function walk(cookie, attemptId, runId, intents, resolution) {
  for (const intent of intents) {
    await call(`/attempts/${attemptId}/runs/${runId}/events`, {
      method: 'POST', cookie, body: { action_code: await codeFor(runId, intent), intent_key: key(intent) },
    })
  }
  return call(`/attempts/${attemptId}/runs/${runId}/resolve`, {
    method: 'POST',
    cookie,
    body: {
      action_code: await codeFor(runId, `resolve_${resolution}`),
      intent_key: key('resolve'),
      rationale: TYPED_RATIONALE,
    },
  })
}

const SAFE = ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_trusted_directory']
const UNSAFE = ['open_item', 'read', 'skip_inspection', 'submit_data', 'verify_in_message_contact']

async function dispositionOf(runId) {
  const run = await ScenarioRun.findById(runId)
  const def = await ScenarioDefinition.findOne({
    scenario_id: run.scenario_id, version: run.definition_version,
  })
  return def.disposition
}

/** Plays a whole attempt. `strategy(disposition, ordinal)` returns `{ safe, resolution }`. */
async function completedAttempt(strategy, { mode } = {}) {
  const cookie = await signIn(LEARNER_NAME, nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie, body: mode ? { mode } : undefined })
  assert.equal(created.status, 201, `create failed: ${JSON.stringify(created.data)}`)
  const attemptId = created.data.attempt.attempt_id
  for (let i = 0; i < 10; i += 1) {
    const cur = await call(`/attempts/${attemptId}/current-run`, { cookie })
    const runId = cur.data.run.run_id
    const disposition = await dispositionOf(runId)
    const { safe, resolution } = strategy(disposition, i + 1)
    const done = await walk(cookie, attemptId, runId, safe ? SAFE : UNSAFE, resolution)
    assert.equal(done.status, 200, `resolve failed: ${JSON.stringify(done.data)}`)
  }
  const done = await call(`/attempts/${attemptId}/complete`, { method: 'POST', cookie })
  assert.equal(done.status, 200, `complete failed: ${JSON.stringify(done.data)}`)
  return attemptId
}

const PERFECT = (d) => ({ safe: true, resolution: d === 'malicious' ? 'report' : 'continue' })
const WORST = (d) => ({ safe: false, resolution: d === 'malicious' ? 'continue' : 'report' })
/** Alternates, so every platform ends up with a mix of outcomes. */
const MIXED = (d, ordinal) => (ordinal % 2 ? PERFECT(d) : WORST(d))

async function reset() {
  await Promise.all([
    Attempt.deleteMany({}), ScenarioRun.deleteMany({}), ScenarioEvent.deleteMany({}),
    Candidate.deleteMany({}),
  ])
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
  }
})

/* ------------------------------------------------------------------ *
 * authorisation
 * ------------------------------------------------------------------ */

it('the dashboard refuses an anonymous request', async () => {
  const res = await call('/admin/dashboard')
  assert.equal(res.status, 401)
  assert.equal(res.data.error.code, 'NO_ADMIN_SESSION')
})

it('a candidate session is rejected, not downgraded', async () => {
  await reset()
  const learner = await signIn('Dashboard Candidate', nextIdentifier())
  const res = await call('/admin/dashboard', { cookie: learner })
  assert.equal(res.status, 401)
  assert.equal(res.data.error.code, 'NO_ADMIN_SESSION')
})

it('the dashboard exposes no write verb', async () => {
  const cookie = await adminCookie()
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    const res = await call('/admin/dashboard', { method, cookie, body: { x: 1 } })
    assert.equal(res.status, 404, `${method} /admin/dashboard was routed`)
  }
})

it('an unknown filter or an operator is refused before any query', async () => {
  const cookie = await adminCookie()
  const unknown = await call('/admin/dashboard?profile_id=abc', { cookie })
  assert.equal(unknown.status, 422)
  assert.equal(unknown.data.error.code, 'FORBIDDEN_FILTER')

  const operator = await call('/admin/dashboard?mode[$ne]=training', { cookie })
  assert.equal(operator.status, 422)

  // ENHANCEMENT-001B: the mode switch is gone, so `mode` is refused like any other key.
  for (const mode of ['training', 'assessment', 'practice']) {
    const res = await call(`/admin/dashboard?mode=${mode}`, { cookie })
    assert.equal(res.status, 422, `mode=${mode} was accepted`)
    assert.equal(res.data.error.code, 'FORBIDDEN_FILTER')
  }
})

/* ------------------------------------------------------------------ *
 * empty installation
 * ------------------------------------------------------------------ */

it('an installation with no attempts returns a complete, empty dashboard', async () => {
  await reset()
  const res = await call('/admin/dashboard', { cookie: await adminCookie() })
  assert.equal(res.status, 200)
  assert.equal(res.data.attempts.total, 0)
  assert.equal(res.data.scores.attempts.count, 0)
  assert.equal(res.data.platforms.length, 4)
  assert.equal(res.data.extremes.attack_success_rate, null)
})

/* ------------------------------------------------------------------ *
 * the numbers agree with the authoritative per-attempt result
 * ------------------------------------------------------------------ */

it('every dashboard figure equals the sum of the attempts\' own results', async () => {
  await reset()
  const cookie = await adminCookie()

  const ids = [
    await completedAttempt(PERFECT),
    await completedAttempt(WORST),
    await completedAttempt(MIXED),
  ]
  // One unfinished attempt: counted as started, never scored.
  const learner = await signIn(LEARNER_NAME, nextIdentifier())
  await call('/attempts', { method: 'POST', cookie: learner })

  const details = []
  for (const id of ids) {
    const res = await call(`/admin/attempts/${id}`, { cookie })
    assert.equal(res.status, 200)
    details.push(res.data)
  }

  const res = await call('/admin/dashboard', { cookie })
  assert.equal(res.status, 200)
  const dash = res.data

  // Attempts and learners.
  assert.equal(dash.attempts.total, 4)
  assert.equal(dash.attempts.by_status.completed, 3)
  assert.equal(dash.attempts.by_status.in_progress, 1)
  assert.equal(dash.learners.total, 4)
  assert.equal(dash.learners.with_completed_attempt, 3)

  // Scores: the committed totals, unrecomputed.
  const totals = details.map((d) => d.attempt.total_score)
  assert.equal(dash.scores.attempts.count, 3)
  assert.equal(dash.scores.attempts.min, Math.min(...totals))
  assert.equal(dash.scores.attempts.max, Math.max(...totals))
  assert.equal(dash.scores.attempt_bands.reduce((s, b) => s + b.count, 0), 3)
  assert.equal(totals[0], 100, 'the safe route should score 100')

  // Outcome classes: identical to the sum of the result projection's own summary.
  const sum = (field) => details.reduce((s, d) => s + d.summary[field], 0)
  assert.equal(dash.scenarios.classified, 30)
  assert.equal(dash.scenarios.unclassified, 0)
  assert.equal(dash.scenarios.outcomes.handled_safely, sum('handled_safely'))
  assert.equal(dash.scenarios.outcomes.missed_threat, sum('missed_threats'))
  assert.equal(dash.scenarios.outcomes.false_positive, sum('false_positives'))
  assert.equal(dash.scenarios.outcomes.unsafe_handling, sum('unsafe_handling'))

  // Per platform: scenarios and points equal the per-attempt scenario scores.
  const scenarios = details.flatMap((d) => d.scenarios)
  for (const row of dash.platforms) {
    const mine = scenarios.filter((s) => s.platform === row.platform)
    assert.equal(row.scenarios, mine.length, `${row.platform} scenario count`)
    assert.equal(row.points, mine.reduce((s, x) => s + x.score_0_10, 0), `${row.platform} points`)

    const malicious = mine.filter((s) => s.disposition === 'malicious')
    const missed = malicious.filter((s) => s.outcome_class === 'missed_threat')
    assert.equal(row.attack_success_rate.denominator, malicious.length)
    assert.equal(row.attack_success_rate.numerator, missed.length)
  }

  // Highest/lowest are drawn from the published rates.
  const ex = dash.extremes.attack_success_rate
  if (ex) {
    const rates = dash.platforms.map((p) => p.attack_success_rate.rate).filter((r) => r !== null)
    assert.equal(ex.highest.rate, Math.max(...rates))
    assert.equal(ex.lowest.rate, Math.min(...rates))
  }
})

it('the dashboard is assessment-only: a training attempt is left out of every figure', async () => {
  const cookie = await adminCookie()
  const before = (await call('/admin/dashboard', { cookie })).data
  assert.equal(before.scope.mode, 'assessment')

  // The candidate API still accepts training mode; the dashboard must not count it.
  const learner = await signIn(LEARNER_NAME, nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie: learner, body: { mode: 'training' } })
  assert.equal(created.status, 201, `training attempt not created: ${JSON.stringify(created.data)}`)
  assert.equal(created.data.attempt.mode, 'training')

  const after = (await call('/admin/dashboard', { cookie })).data
  assert.deepEqual(after.attempts, before.attempts)
  assert.deepEqual(after.scores, before.scores)
  assert.equal(after.learners.with_any_attempt, before.learners.with_any_attempt)
  await Attempt.deleteOne({ _id: created.data.attempt.attempt_id })
  await ScenarioRun.deleteMany({ attempt_id: created.data.attempt.attempt_id })
})

it('the dashboard publishes no identity, no typed content and no scoring vocabulary', async () => {
  const cookie = await adminCookie()
  const res = await call('/admin/dashboard', { cookie })
  const json = JSON.stringify(res.data)

  const attempts = await Attempt.find({}).select('_id profile_id').lean()
  const runs = await ScenarioRun.find({}).select('scenario_id').lean()
  const events = await ScenarioEvent.find({}).select('event_code').lean()

  assert.ok(!json.includes(LEARNER_NAME), 'learner name leaked')
  assert.ok(!json.includes(TYPED_RATIONALE), 'typed rationale leaked')
  assert.ok(!json.includes('DB5'), 'service number leaked')
  for (const a of attempts) {
    assert.ok(!json.includes(String(a._id)), 'attempt id leaked')
    assert.ok(!json.includes(String(a.profile_id)), 'profile id leaked')
  }
  for (const r of runs) assert.ok(!json.includes(`"${r.scenario_id}"`), `scenario id ${r.scenario_id} leaked`)
  for (const code of new Set(events.map((e) => e.event_code))) {
    assert.ok(!json.includes(code), `event code ${code} leaked`)
  }
  for (const field of ['outcome_code', 'intent', 'action_code', 'rationale', 'seed']) {
    assert.ok(!json.includes(field), `${field} leaked`)
  }
})

it('reading the dashboard writes nothing and appends no audit entry', async () => {
  const cookie = await adminCookie()
  const before = {
    audit: await AuditEvent.countDocuments(),
    attempts: await Attempt.countDocuments(),
    runs: await ScenarioRun.countDocuments(),
    events: await ScenarioEvent.countDocuments(),
  }
  await call('/admin/dashboard', { cookie })
  await call('/admin/dashboard', { cookie })
  assert.deepEqual({
    audit: await AuditEvent.countDocuments(),
    attempts: await Attempt.countDocuments(),
    runs: await ScenarioRun.countDocuments(),
    events: await ScenarioEvent.countDocuments(),
  }, before)
})
