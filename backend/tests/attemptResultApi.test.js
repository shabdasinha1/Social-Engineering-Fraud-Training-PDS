import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import { createApp } from '../src/app.js'
import { Attempt } from '../src/models/Attempt.js'
import { Candidate } from '../src/models/Candidate.js'
import { ScenarioDefinition } from '../src/models/ScenarioDefinition.js'
import { ScenarioEvent } from '../src/models/ScenarioEvent.js'
import { ScenarioRun } from '../src/models/ScenarioRun.js'
import {
  loadSourceScenarios,
  loadTaxonomies,
  toScenarioDefinition,
} from '../src/services/scenarioDefinitionImportService.js'
import { detectTransactionSupport } from '../src/utils/transactions.js'
import { OUTCOME_CLASSES, REMEDIATION_MAX } from '../src/constants/resultProjection.js'
import { codeFor } from './helpers/learnerActions.js'

/**
 * RESULT-001 - the candidate result over real HTTP.
 *
 * Same posture as the API-001 suite: a real Express app, a real replica set, real signed
 * cookies, the real 100-scenario bank. Nothing is mocked, because the two things being
 * proven here - the ownership boundary and what may leave the server - are exactly the
 * things a mock would let through.
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
        Attempt.deleteMany({}), ScenarioRun.deleteMany({}),
        ScenarioEvent.deleteMany({}), Candidate.deleteMany({}),
      ])
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
  console.warn(`\n[RESULT-001] result API tests SKIPPED - ${skipReason}\n`)
}

const it = (name, fn) => test(name, { skip: ready ? false : skipReason }, fn)

/* ------------------------------------------------------------------ *
 * helpers - mirrored from the API-001 suite
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

async function signIn(name, identifier) {
  const res = await call('/candidates', { method: 'POST', body: { name, identifier } })
  assert.equal(res.status, 201, `sign-in failed: ${JSON.stringify(res.data)}`)
  return res.cookie
}

let idSeq = 0
const nextIdentifier = () => `RC${String(200000 + (idSeq += 1))}`
let keySeq = 0
const key = (label) => `${label}-${Date.now()}-${(keySeq += 1)}`

/** The safe path: inspect, decline, verify independently, then resolve as required. */
async function walkSafely(cookie, attemptId, runId, resolution) {
  for (const intent of ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_trusted_directory']) {
    const r = await call(`/attempts/${attemptId}/runs/${runId}/events`, {
      method: 'POST', cookie, body: { action_code: await codeFor(runId, intent), intent_key: key(intent) },
    })
    assert.equal(r.status, 200, `${intent} failed: ${JSON.stringify(r.data)}`)
  }
  return call(`/attempts/${attemptId}/runs/${runId}/resolve`, {
    method: 'POST', cookie, body: { action_code: await codeFor(runId, `resolve_${resolution}`), intent_key: key('resolve') },
  })
}

/** The unsafe path: submit data at the branch, then resolve however the caller says. */
async function walkUnsafely(cookie, attemptId, runId, resolution) {
  for (const intent of ['open_item', 'read', 'skip_inspection', 'submit_data', 'verify_in_message_contact']) {
    await call(`/attempts/${attemptId}/runs/${runId}/events`, {
      method: 'POST', cookie, body: { action_code: await codeFor(runId, intent), intent_key: key(intent) },
    })
  }
  return call(`/attempts/${attemptId}/runs/${runId}/resolve`, {
    method: 'POST', cookie, body: { action_code: await codeFor(runId, `resolve_${resolution}`), intent_key: key('resolve') },
  })
}

/** The disposition of the run currently in play. Server-side lookup, test-side only. */
async function dispositionOf(runId) {
  const run = await ScenarioRun.findById(runId)
  const def = await ScenarioDefinition.findOne({
    scenario_id: run.scenario_id, version: run.definition_version,
  })
  return def.disposition
}

/**
 * Plays a whole attempt. `strategy(disposition, ordinal)` returns
 * `{ safe, resolution }` for each scenario, so a test can shape the outcome mix it needs.
 */
async function playAttempt(cookie, attemptId, strategy) {
  for (let i = 0; i < 10; i += 1) {
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
  return call(`/attempts/${attemptId}/complete`, { method: 'POST', cookie })
}

/** A perfect attempt: everything resolved the way the disposition requires. */
const PERFECT = () => ({ safe: true })

async function reset() {
  await Promise.all([
    Attempt.deleteMany({}), ScenarioRun.deleteMany({}), ScenarioEvent.deleteMany({}),
  ])
}

test.after(async () => {
  if (ready) {
    server?.close()
    await Promise.all([
      Attempt.deleteMany({}), ScenarioRun.deleteMany({}),
      ScenarioEvent.deleteMany({}), Candidate.deleteMany({}),
      ScenarioDefinition.deleteMany({}),
    ])
    await mongoose.disconnect()
  }
})

/* ------------------------------------------------------------------ *
 * 1-4  availability and ownership
 * ------------------------------------------------------------------ */

it('the result is refused until the attempt is complete', async () => {
  await reset()
  const cookie = await signIn('Result One', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id

  const res = await call(`/attempts/${attemptId}/result`, { cookie })
  assert.equal(res.status, 409)
  assert.equal(res.data.error.code, 'ATTEMPT_NOT_COMPLETE')
  assert.ok(!JSON.stringify(res.data).includes('total_score'), 'a partial result was fabricated')
})

it('an unauthenticated request cannot reach a result', async () => {
  await reset()
  const cookie = await signIn('Result Two', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  await playAttempt(cookie, created.data.attempt.attempt_id, PERFECT)

  const res = await call(`/attempts/${created.data.attempt.attempt_id}/result`)
  assert.equal(res.status, 401)
})

it('another candidate cannot retrieve the result, and is not told it exists', async () => {
  await reset()
  const owner = await signIn('Result Owner', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie: owner })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(owner, attemptId, PERFECT)

  const stranger = await signIn('Result Stranger', nextIdentifier())
  const res = await call(`/attempts/${attemptId}/result`, { cookie: stranger })

  // 404, not 403: a 403 would confirm the attempt exists (API-001 section 3).
  assert.equal(res.status, 404)
  assert.equal(res.data.error.code, 'NOT_FOUND')
  assert.ok(!JSON.stringify(res.data).includes(attemptId))
})

it('GET is idempotent: the same request returns the same result', async () => {
  await reset()
  const cookie = await signIn('Result Three', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, PERFECT)

  const first = await call(`/attempts/${attemptId}/result`, { cookie })
  const second = await call(`/attempts/${attemptId}/result`, { cookie })
  assert.equal(first.status, 200)
  assert.deepEqual(first.data, second.data)

  // And reading it changed nothing in the ledger.
  const attempt = await Attempt.findById(attemptId)
  assert.equal(attempt.total_score, first.data.result.total_score)
  assert.equal(await ScenarioEvent.countDocuments({
    run_id: { $in: (await ScenarioRun.find({ attempt_id: attempt._id })).map((r) => r._id) },
  }), 60, 'ten runs of six events each')
})

/* ------------------------------------------------------------------ *
 * 5-8  score authority and integrity
 * ------------------------------------------------------------------ */

it('the total is the server sum of the ten scenario scores', async () => {
  await reset()
  const cookie = await signIn('Result Four', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, PERFECT)

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
  const result = data.result
  assert.equal(result.total_score, 100)
  assert.equal(result.max_score, 100)
  assert.equal(result.scenarios.length, 10)
  assert.equal(result.scenarios.reduce((s, x) => s + x.score_0_10, 0), result.total_score)
  assert.deepEqual(result.scenarios.map((s) => s.ordinal), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
})

it('a tampered stored total is refused rather than reported', async () => {
  await reset()
  const cookie = await signIn('Result Five', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, PERFECT)

  // Simulate drift between the attempt cache and the ledger.
  await Attempt.updateOne({ _id: attemptId }, { $set: { total_score: 55 } })
  const res = await call(`/attempts/${attemptId}/result`, { cookie })

  assert.equal(res.status, 500)
  assert.equal(res.data.error.code, 'RESULT_INTEGRITY')
  // The bad value is not silently repaired.
  assert.equal((await Attempt.findById(attemptId)).total_score, 55)
})

it('a missing scenario run is refused rather than reported as a short attempt', async () => {
  await reset()
  const cookie = await signIn('Result Six', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, PERFECT)

  const attempt = await Attempt.findById(attemptId)
  const victim = await ScenarioRun.findOne({ attempt_id: attempt._id, ordinal: 7 })
  await ScenarioRun.deleteOne({ _id: victim._id })

  const res = await call(`/attempts/${attemptId}/result`, { cookie })
  assert.equal(res.status, 500)
  assert.equal(res.data.error.code, 'RESULT_INTEGRITY')
})

/**
 * The projection refuses a repeated position (proved in `attemptResult.test.js`), but the
 * database refuses it first: `{attempt_id, ordinal}` is unique. This asserts that outer
 * guard actually holds, so the two lines of defence are both accounted for.
 */
it('the database itself prevents a duplicated scenario position', async () => {
  await reset()
  const cookie = await signIn('Result Seven', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, PERFECT)

  const attempt = await Attempt.findById(attemptId)
  const [a, b] = await ScenarioRun.find({ attempt_id: attempt._id }).sort({ ordinal: 1 }).limit(2)

  await assert.rejects(
    () => ScenarioRun.collection.updateOne({ _id: b._id }, { $set: { ordinal: a.ordinal } }),
    (error) => error.code === 11000,
    'the unique index should have rejected the collision',
  )

  // And the result is still correct afterwards.
  const res = await call(`/attempts/${attemptId}/result`, { cookie })
  assert.equal(res.status, 200)
  assert.deepEqual(res.data.result.scenarios.map((x) => x.ordinal), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
})

/* ------------------------------------------------------------------ *
 * 9-12  missed threat vs false positive, over the wire
 * ------------------------------------------------------------------ */

it('a perfect attempt reports ten safe scenarios and no misses', async () => {
  await reset()
  const cookie = await signIn('Result Eight', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, PERFECT)

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
  assert.equal(data.result.summary.handled_safely, 10)
  assert.equal(data.result.summary.missed_threats, 0)
  assert.equal(data.result.summary.false_positives, 0)
  assert.ok(data.result.scenarios.every((s) => s.outcome_class === OUTCOME_CLASSES.HANDLED_SAFELY))
})

it('reporting every item produces false positives on the legitimate ones', async () => {
  await reset()
  const cookie = await signIn('Result Nine', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id

  // Report everything - the strategy the specification says must not win.
  await playAttempt(cookie, attemptId, () => ({ safe: true, resolution: 'report' }))

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
  const result = data.result

  // SELECT-002 puts exactly two legitimate scenarios in every attempt.
  assert.equal(result.summary.false_positives, 2)
  assert.equal(result.summary.missed_threats, 0)
  assert.equal(result.summary.handled_safely, 8)
  assert.ok(result.total_score < 100, 'reporting everything should not score full marks')
})

it('carrying out a malicious request is reported as a missed threat', async () => {
  await reset()
  const cookie = await signIn('Result Ten', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id

  await playAttempt(cookie, attemptId, (disposition) =>
    disposition === 'malicious'
      ? { safe: false, resolution: 'continue' }
      : { safe: true, resolution: 'continue' })

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
  assert.equal(data.result.summary.missed_threats, 8)
  assert.equal(data.result.summary.false_positives, 0)
  assert.equal(data.result.summary.handled_safely, 2)
})

it('a malicious item reported only after releasing details is still a missed threat', async () => {
  await reset()
  const cookie = await signIn('Result Eleven', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id

  await playAttempt(cookie, attemptId, (disposition) =>
    disposition === 'malicious' ? { safe: false, resolution: 'report' } : { safe: true })

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
  assert.equal(data.result.summary.missed_threats, 8,
    'the correct final action must not mask the unsafe step before it')
  assert.equal(data.result.summary.handled_safely, 2)
})

/* ------------------------------------------------------------------ *
 * 13-15  path replay
 * ------------------------------------------------------------------ */

it('the path replays the six stages in ledger order', async () => {
  await reset()
  const cookie = await signIn('Result Twelve', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, PERFECT)

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
  const path = data.result.scenarios[0].path

  assert.deepEqual(path.map((s) => s.step), [1, 2, 3, 4, 5, 6])
  assert.deepEqual(path.map((s) => s.stage),
    ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve'])
  assert.equal(path[2].action, 'inspected_the_details')
  assert.equal(path[4].action, 'verified_independently')
  assert.equal(path[5].action, 'resolved_as_required')
})

it('the path matches the ledger even when rows are read out of order', async () => {
  await reset()
  const cookie = await signIn('Result Thirteen', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, PERFECT)

  const attempt = await Attempt.findById(attemptId)
  const run = await ScenarioRun.findOne({ attempt_id: attempt._id, ordinal: 1 })
  const ledger = await ScenarioEvent.find({ run_id: run._id }).sort({ sequence: 1 })

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
  assert.deepEqual(
    data.result.scenarios[0].path.map((s) => s.step),
    ledger.map((e) => e.sequence),
  )
})

it('a path step carries no event code, point value or metadata', async () => {
  await reset()
  const cookie = await signIn('Result Fourteen', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, PERFECT)

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
  for (const scenario of data.result.scenarios) {
    for (const step of scenario.path) {
      assert.deepEqual(Object.keys(step).sort(), ['action', 'stage', 'step'])
    }
  }
})

/* ------------------------------------------------------------------ *
 * 16-18  feedback and behaviour breakdown
 * ------------------------------------------------------------------ */

it('every scenario carries the five specification feedback fields', async () => {
  await reset()
  const cookie = await signIn('Result Fifteen', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, PERFECT)

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
  for (const scenario of data.result.scenarios) {
    assert.deepEqual(
      Object.keys(scenario.feedback).sort(),
      ['cues', 'impact', 'prevention_habit', 'result', 'safe_action'],
    )
    assert.ok(scenario.feedback.result, 'disposition sentence missing')
    assert.ok(scenario.feedback.cues.length > 0, 'cues missing')
    assert.ok(scenario.feedback.safe_action, 'safe action missing')
    assert.ok(scenario.feedback.impact, 'impact missing')
    assert.ok(scenario.feedback.prevention_habit, 'prevention habit missing')
  }
})

it('the behaviour breakdown covers platform, family, trigger and stage', async () => {
  await reset()
  const cookie = await signIn('Result Sixteen', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, PERFECT)

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
  const behaviour = data.result.behaviour

  assert.equal(behaviour.by_platform.reduce((s, b) => s + b.scenarios, 0), 10)
  assert.equal(behaviour.by_family.reduce((s, b) => s + b.scenarios, 0), 10)
  assert.ok(behaviour.by_trigger.length > 0)
  assert.deepEqual(behaviour.by_stage.map((s) => s.stage), ['inspect', 'branch', 'verify', 'resolve'])
  for (const stage of behaviour.by_stage) {
    assert.equal(stage.scenarios_reached, 10)
    assert.equal(stage.constructive_actions, 10)
  }
})

it('the breakdown aggregates the same ten scenarios the learner just saw', async () => {
  await reset()
  const cookie = await signIn('Result Seventeen', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, PERFECT)

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
  const byPlatform = Object.fromEntries(
    data.result.behaviour.by_platform.map((b) => [b.key, b.scenarios]),
  )
  const actual = {}
  for (const scenario of data.result.scenarios) {
    actual[scenario.platform] = (actual[scenario.platform] ?? 0) + 1
  }
  assert.deepEqual(byPlatform, actual)
})

/* ------------------------------------------------------------------ *
 * 19-22  comparison
 * ------------------------------------------------------------------ */

it('a first attempt reports no previous attempt to compare with', async () => {
  await reset()
  const cookie = await signIn('Result Eighteen', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, PERFECT)

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
  assert.equal(data.result.comparison.available, false)
  assert.equal(data.result.comparison.reason, 'no_previous_attempt')
})

it('a second comparable attempt is compared, and reports the delta', async () => {
  await reset()
  const cookie = await signIn('Result Nineteen', nextIdentifier())

  const first = await call('/attempts', { method: 'POST', cookie })
  await playAttempt(cookie, first.data.attempt.attempt_id,
    () => ({ safe: true, resolution: 'report' })) // some false positives

  const second = await call('/attempts', { method: 'POST', cookie })
  const secondId = second.data.attempt.attempt_id
  await playAttempt(cookie, secondId, PERFECT)

  const { data } = await call(`/attempts/${secondId}/result`, { cookie })
  const comparison = data.result.comparison

  assert.equal(comparison.available, true)
  assert.equal(comparison.previous_attempt_id, first.data.attempt.attempt_id)
  assert.equal(comparison.delta, data.result.total_score - comparison.previous_total_score)
  assert.ok(comparison.delta > 0, 'the perfect attempt should improve on the first')
})

it('an attempt built on a different content version is not compared', async () => {
  await reset()
  const cookie = await signIn('Result Twenty', nextIdentifier())

  const first = await call('/attempts', { method: 'POST', cookie })
  await playAttempt(cookie, first.data.attempt.attempt_id, PERFECT)
  // The earlier attempt was built against different content.
  await Attempt.updateOne({ _id: first.data.attempt.attempt_id }, { $set: { content_version: 99 } })

  const second = await call('/attempts', { method: 'POST', cookie })
  const secondId = second.data.attempt.attempt_id
  await playAttempt(cookie, secondId, PERFECT)

  const { data } = await call(`/attempts/${secondId}/result`, { cookie })
  assert.equal(data.result.comparison.available, false)
  assert.equal(data.result.comparison.reason, 'not_comparable')
  assert.deepEqual(data.result.comparison.incomparable_on, ['content_version'])
  // Only the field name is named; no value from the other attempt is echoed.
  assert.ok(!JSON.stringify(data.result.comparison).includes('99'))
})

it('another learner completed attempt is never used for comparison', async () => {
  await reset()
  const other = await signIn('Result Other', nextIdentifier())
  const theirs = await call('/attempts', { method: 'POST', cookie: other })
  await playAttempt(other, theirs.data.attempt.attempt_id, PERFECT)

  const cookie = await signIn('Result TwentyOne', nextIdentifier())
  const mine = await call('/attempts', { method: 'POST', cookie })
  const mineId = mine.data.attempt.attempt_id
  await playAttempt(cookie, mineId, PERFECT)

  const { data } = await call(`/attempts/${mineId}/result`, { cookie })
  assert.equal(data.result.comparison.available, false)
  assert.equal(data.result.comparison.reason, 'no_previous_attempt')
  assert.ok(!JSON.stringify(data.result).includes(theirs.data.attempt.attempt_id))
})

/* ------------------------------------------------------------------ *
 * 23-25  remediation
 * ------------------------------------------------------------------ */

it('a perfect attempt is given nothing to practise', async () => {
  await reset()
  const cookie = await signIn('Result TwentyTwo', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, PERFECT)

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
  assert.deepEqual(data.result.remediation, [])
})

it('a weak attempt is given at most three recommendations, all blame-free', async () => {
  await reset()
  const cookie = await signIn('Result TwentyThree', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, () => ({ safe: false, resolution: 'continue' }))

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
  const remediation = data.result.remediation

  assert.ok(remediation.length > 0, 'a poor attempt should have something to practise')
  assert.ok(remediation.length <= REMEDIATION_MAX, `expected at most ${REMEDIATION_MAX}`)

  for (const item of remediation) {
    assert.ok(item.family_key && item.label && item.reason)
    assert.ok(item.practice_scenarios_available > 0, 'recommended a family with no scenarios')
    // No diagnosis, no trait, no profiling.
    for (const word of ['vulnerable', 'susceptible', 'manipulable', 'gullible', 'personality',
      'weakness of', 'you are', 'prone to']) {
      assert.ok(!item.reason.toLowerCase().includes(word), `remediation reason used "${word}"`)
    }
  }
})

it('remediation never recommends a family with no active scenarios', async () => {
  await reset()
  const cookie = await signIn('Result TwentyFour', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, () => ({ safe: false, resolution: 'continue' }))

  // Deactivate every scenario in the family the learner did worst in.
  const first = (await call(`/attempts/${attemptId}/result`, { cookie }))
    .data.result.remediation[0]
  assert.ok(first, 'expected at least one recommendation to suppress')
  await ScenarioDefinition.updateMany(
    { canonical_family: first.family_key }, { $set: { active: false } },
  )

  try {
    const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
    assert.ok(
      !data.result.remediation.some((r) => r.family_key === first.family_key),
      'recommended a family with no active scenarios',
    )
    for (const item of data.result.remediation) {
      assert.ok(item.practice_scenarios_available > 0)
    }
  } finally {
    await ScenarioDefinition.updateMany(
      { canonical_family: first.family_key }, { $set: { active: true } },
    )
  }
})

/* ------------------------------------------------------------------ *
 * 26-28  the security boundary
 * ------------------------------------------------------------------ */

/**
 * Field names AND values. A key-name check alone would pass a payload that carried the
 * scenario title under a different key, so the actual server-only strings from the ten
 * definitions in play are searched for in the serialised response.
 */
it('the result leaks no server-only field name', async () => {
  await reset()
  const cookie = await signIn('Result TwentyFive', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, PERFECT)

  const res = await call(`/attempts/${attemptId}/result`, { cookie })
  const text = JSON.stringify(res.data)

  for (const field of [
    'evaluation', 'expected_actions', 'expected_safe_behavior', 'learner_flow',
    'scoring_text', 'points_delta', 'score_running', 'end_state', 'canonical_family',
    'canonical_triggers', 'military_flag', 'legitimate_control', 'disposition', 'level',
    'seed', 'selection', 'scenario_sequence', 'profile_id', 'intent_key', 'rationale',
    'metadata', 'event_code', 'quality', 'owner', 'schema_version',
  ]) {
    assert.ok(!text.includes(`"${field}"`), `result exposed the field "${field}"`)
  }
})

it('the result leaks no server-only value from the scenarios in play', async () => {
  await reset()
  const cookie = await signIn('Result TwentySix', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, PERFECT)

  const res = await call(`/attempts/${attemptId}/result`, { cookie })
  const text = JSON.stringify(res.data)

  const attempt = await Attempt.findById(attemptId)
  const runs = await ScenarioRun.find({ attempt_id: attempt._id })
  const scenarioByRef = Object.fromEntries(
    res.data.result.scenarios.map((s) => [s.scenario_ref, s]),
  )

  for (const run of runs) {
    const def = await ScenarioDefinition.findOne({
      scenario_id: run.scenario_id, version: run.definition_version,
    }).select('+evaluation')
    const shown = scenarioByRef[run.scenario_id]

    // The authoring title states the answer outright (DATA-001), so it stays server-side.
    assert.ok(!text.includes(def.evaluation.title),
      `result exposed the title "${def.evaluation.title}"`)

    /**
     * Per-stage evaluation prose must not appear - with one exemption, and it is a narrow
     * one: the client authored some stage-6 boilerplate ("Complete the resolution and
     * return to the dashboard.") as the same sentence it used for the section 7 safe
     * response, so an EXACT match with a released feedback field is allowed. Anything
     * else, including every answer-bearing stage-3 to stage-5 line, still fails.
     */
    const released = new Set([
      shown.feedback.result, shown.feedback.safe_action, shown.feedback.impact,
      shown.feedback.prevention_habit, ...shown.feedback.cues,
    ].filter(Boolean))

    for (const stage of def.evaluation.stages) {
      for (const [label, value] of [
        ['expected safe behaviour', stage.expected_safe_behavior],
        ['learner flow', stage.learner_flow],
        ['per-stage scoring text', stage.scoring_text],
      ]) {
        if (!value || released.has(value)) continue
        assert.ok(!text.includes(value),
          `result exposed ${label} at the ${stage.key} stage: "${value.slice(0, 60)}"`)
      }
    }

    // The decision signals - the actual answer key - are never released, exemption or not.
    for (const stage of def.evaluation.stages) {
      if (/^Check this decision signal/i.test(stage.expected_safe_behavior)) {
        assert.ok(!text.includes(stage.expected_safe_behavior),
          'result exposed an answer-bearing decision signal')
      }
    }

    /**
     * `end_state` DOES appear - because the client authored the same sentence as the
     * section 7 "likely impact", and DATA-002 imported it into both fields. That is a
     * required release, not a leak, so the identity is asserted: if the two ever diverge,
     * this fails and the appearance becomes a real leak again.
     */
    assert.equal(shown.feedback.impact, def.evaluation.feedback.impact)
    assert.equal(def.evaluation.feedback.impact, def.evaluation.end_state,
      'end_state and feedback.impact are the same client sentence')

    /**
     * No SCENARIO ENTRY may carry its own classification. That is the property that
     * matters: a learner must not be able to read a scenario's family or trigger off its
     * row, because that is what would turn the result into an answer key.
     *
     * Three places legitimately contain those strings and are therefore outside this check:
     *   - per-case `feedback.result`, the authored disposition line section 7 requires
     *     ("Malicious - Account takeover / OTP theft");
     *   - REVIEW-001's `review.what_it_was`, which is that SAME string and nothing else -
     *     the review card restates it so it is self-contained, and the identity is
     *     asserted below, so the exemption cannot become a route for anything new;
     *   - the aggregate trigger breakdown, whose display labels are English words that
     *     collide with one-word raw triggers ("Familiarity", "Routine expectation").
     */
    assert.equal(shown.review.what_it_was, shown.feedback.result,
      'the review restated the disposition line as something other than feedback.result')
    const entryOnly = JSON.stringify({ ...shown, feedback: undefined, review: undefined })
    assert.ok(!entryOnly.includes(def.family),
      `the scenario entry carried its raw family "${def.family}"`)
    assert.ok(!entryOnly.includes(def.trigger),
      `the scenario entry carried its raw trigger "${def.trigger}"`)
    assert.ok(!entryOnly.includes(def.canonical_family),
      'the scenario entry carried its canonical family')
    for (const canonical of def.canonical_triggers) {
      assert.ok(!entryOnly.includes(canonical), 'the scenario entry carried a canonical trigger')
    }
    assert.ok(!('canonical_family' in shown), 'a scenario entry carried a canonical family')
    assert.ok(!('canonical_triggers' in shown), 'a scenario entry carried canonical triggers')
  }
  assert.ok(!text.includes(attempt.seed), 'result exposed the selection seed')
})

it('the result names the scenarios only by what the learner already saw', async () => {
  await reset()
  const cookie = await signIn('Result TwentySeven', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, PERFECT)

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
  for (const scenario of data.result.scenarios) {
    // scenario_ref is the same identifier /current-run already published during play.
    assert.match(scenario.scenario_ref, /^[WIES]\d{2}$/)
    assert.ok(scenario.platform_label)
    // No canonical taxonomy field per scenario. (The authored disposition line inside
    // `feedback.result` does name the family in prose - that is the section 7 debrief for
    // the ten scenarios just completed, and it is asserted in the value-leak test above.)
    assert.ok(!('canonical_family' in scenario))
    assert.ok(!('family' in scenario))
    assert.ok(!('trigger' in scenario))
    assert.ok(!('level' in scenario))
  }
})

/* ------------------------------------------------------------------ *
 * 28-37  the learning review (REVIEW-001)
 * ------------------------------------------------------------------ */

/**
 * REVIEW-001 widens the release boundary by exactly one item, and only for a scenario in
 * which the learner actually went wrong: the authored `expected_safe_behavior` for the
 * STAGE the mistake happened at. That is what lets the card say what should have been done
 * at the step where it went wrong, in the scenario's own words, rather than as a lecture.
 *
 * The tests below fix that boundary precisely rather than loosening it. A stage line may
 * appear ONLY as the `correct_action` of a mistake at that same stage, in a scenario that
 * has a mistake there; a scenario handled correctly releases nothing new at all. The
 * title, the scoring text, the learner flow and the per-stage prose of a stage the learner
 * got right all still fail.
 */

/** An attempt where every scenario is walked unsafely, so every card carries mistakes. */
const RECKLESS = () => ({ safe: false })

/** The pinned definition behind one published scenario entry, evaluation included. */
async function definitionBehind(attemptId, ordinal) {
  const run = await ScenarioRun.findOne({
    attempt_id: new mongoose.Types.ObjectId(attemptId), ordinal,
  })
  return ScenarioDefinition.findOne({
    scenario_id: run.scenario_id, version: run.definition_version,
  }).select('+evaluation')
}

/** The feedback fields RESULT-001 already released for one scenario entry. */
const releasedFor = (scenario) => new Set([
  scenario.feedback.result, scenario.feedback.safe_action, scenario.feedback.impact,
  scenario.feedback.prevention_habit, ...scenario.feedback.cues,
].filter(Boolean))

it('a completed attempt carries a review for every scenario and a review summary', async () => {
  await reset()
  const cookie = await signIn('Review One', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, PERFECT)

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
  const { result } = data

  assert.equal(result.scenarios.length, 10)
  for (const scenario of result.scenarios) {
    assert.ok(scenario.review, `scenario ${scenario.ordinal} has no review`)
    assert.ok(['correct', 'mistake', 'not_resolved'].includes(scenario.review.status))
    assert.ok(Array.isArray(scenario.review.mistakes))
    assert.ok(Array.isArray(scenario.review.correct_path))
    assert.ok(scenario.review.headline, 'a review with no headline')
  }

  assert.equal(result.review_summary.scenarios, 10)
  assert.equal(result.review_summary.correct_decisions, 10)
  assert.equal(result.review_summary.scenarios_with_mistakes, 0)
  assert.equal(result.review_summary.mistakes, 0)
  assert.equal(result.review_summary.verification_successes, 10)
})

it('a perfectly played attempt shows no mistake anywhere', async () => {
  await reset()
  const cookie = await signIn('Review Two', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, PERFECT)

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
  for (const scenario of data.result.scenarios) {
    assert.equal(scenario.review.status, 'correct')
    assert.deepEqual(scenario.review.mistakes, [])
    assert.equal(scenario.review.learning_issue, null)
    assert.ok(scenario.review.key_cue, 'a correct card still names the key cue')
    assert.ok(scenario.review.safe_response, 'a correct card still names the habit')
  }
})

it('an unsafe walk produces mistakes tied to the stages the learner went wrong at', async () => {
  await reset()
  const cookie = await signIn('Review Three', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, RECKLESS)

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
  const { result } = data

  assert.equal(result.review_summary.scenarios_with_mistakes, 10)
  assert.ok(result.review_summary.mistakes >= 30, 'each unsafe walk carries several mistakes')
  assert.equal(result.review_summary.verification_successes, 0)

  for (const scenario of result.scenarios) {
    assert.equal(scenario.review.status, 'mistake')
    // skip_inspection, submit_data and verify_in_message_contact all leave a mark.
    const kinds = scenario.review.mistakes.map((m) => m.kind)
    assert.ok(kinds.includes('skipped_inspection'), 'the skipped inspection was not reported')
    /**
     * `submit_data` resolves to whichever branch code the SCENARIO declares - the release
     * code where the scenario offers one, the external-action code otherwise. Which of the
     * two applies is the scenario's decision, not the review's, so both are accepted here.
     */
    assert.ok(kinds.some((k) => ['released_details_or_paid', 'unsafe_external_action'].includes(k)),
      'the unsafe branch action was not reported')
    assert.ok(kinds.includes('verified_through_the_message'), 'the in-message check was not reported')

    for (const mistake of scenario.review.mistakes) {
      assert.ok(mistake.what_you_did, 'a mistake with no description of what was done')
      assert.ok(mistake.why_it_mattered, 'a mistake with no consequence')
      assert.ok(mistake.label && mistake.stage)
    }
  }
})

it('mistakes are listed in the order the learner made them', async () => {
  await reset()
  const cookie = await signIn('Review Eleven', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, RECKLESS)

  const stageOrder = ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve']
  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })

  for (const scenario of data.result.scenarios) {
    const positions = scenario.review.mistakes.map((m) => stageOrder.indexOf(m.stage))
    assert.deepEqual(positions, [...positions].sort((a, b) => a - b),
      `scenario ${scenario.ordinal} listed its mistakes out of order`)
  }
})

it('the review preserves the missed-threat and false-positive distinction', async () => {
  await reset()
  const cookie = await signIn('Review Four', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id

  // Malicious items continued, legitimate items reported: one of each kind of error.
  await playAttempt(cookie, attemptId, (disposition) => ({
    safe: true,
    resolution: disposition === 'malicious' ? 'continue' : 'report',
  }))

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
  const { result } = data

  const issues = result.scenarios.map((s) => s.review.learning_issue?.key)
  assert.ok(issues.includes('missed_threat'), 'no missed threat was named')
  assert.ok(issues.includes('false_positive'), 'no false positive was named')

  // The review agrees with the classification RESULT-001 already made.
  for (const scenario of result.scenarios) {
    const named = scenario.review.learning_issue?.key ?? null
    const expected = [OUTCOME_CLASSES.MISSED_THREAT, OUTCOME_CLASSES.FALSE_POSITIVE,
      OUTCOME_CLASSES.UNSAFE_HANDLING].includes(scenario.outcome_class)
      ? scenario.outcome_class
      : null
    assert.equal(named, expected, `scenario ${scenario.ordinal} disagreed with its outcome class`)
  }

  assert.equal(result.review_summary.missed_threats, result.summary.missed_threats)
  assert.equal(result.review_summary.false_positives, result.summary.false_positives)
})

it('a legitimate scenario is told to keep the item, a malicious one to report it', async () => {
  await reset()
  const cookie = await signIn('Review Five', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, PERFECT)

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })

  for (const scenario of data.result.scenarios) {
    const def = await definitionBehind(attemptId, scenario.ordinal)
    const resolve = scenario.review.correct_path.find((s) => s.stage === 'resolve')
    assert.equal(
      resolve.action,
      def.disposition === 'malicious' ? 'reported_or_blocked_it' : 'kept_it_and_continued',
      `scenario ${scenario.ordinal} was given the wrong expected resolution`,
    )
  }
})

it('the replayed path is exactly the ledger, with no step the learner did not take', async () => {
  await reset()
  const cookie = await signIn('Review Six', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, RECKLESS)

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
  for (const scenario of data.result.scenarios) {
    // `your_path` is the same object the projection already published as `path`.
    assert.deepEqual(scenario.review.your_path, scenario.path)
    // The reckless walk never inspects and never verifies independently.
    assert.ok(!scenario.review.your_path.some((s) => s.action === 'inspected_the_details'))
    assert.ok(!scenario.review.your_path.some((s) => s.action === 'verified_independently'))
    // ...but the correct path still shows both, because the scenario declares them.
    assert.ok(scenario.review.correct_path.some((s) => s.action === 'inspected_the_details'))
    assert.ok(scenario.review.correct_path.some((s) => s.action === 'verified_independently'))
  }
})

it('the review publishes no event code, point delta or internal identifier', async () => {
  await reset()
  const cookie = await signIn('Review Seven', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, RECKLESS)

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
  const reviews = JSON.stringify(data.result.scenarios.map((s) => s.review))

  for (const code of [
    'NOTIFY_SEEN', 'ITEM_OPEN', 'INSPECT_CONTEXT', 'SAFE_PIVOT', 'CORRECT_USE',
    'TRUSTED_VERIFY', 'RESOLVE_CORRECT', 'PREMATURE_REPLY', 'NEEDLESS_REJECT_IGNORE',
    'RISKY_OPEN_REPLY', 'FALSE_REPORT_BLOCK', 'UNSAFE_EXTERNAL_ACTION',
    'CONTRADICTORY_UNSAFE_FINAL', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE',
    'VERIFY_THROUGH_MESSAGE', 'REPORT_ONLY_WITHOUT_CHECK', 'STAGE_SKIPPED',
    'RUN_ABANDONED', 'RUN_EXPIRED',
  ]) {
    assert.ok(!reviews.includes(code), `the review published the event code ${code}`)
  }

  for (const field of ['event_id', 'run_id', 'intent_key', 'points_delta', 'sequence',
    'severity', 'metadata', 'rationale', 'scoring_text', 'learner_flow', 'expected_actions',
    'disposition', 'canonical_family', 'score_running']) {
    assert.ok(!reviews.includes(`"${field}"`), `the review published the field "${field}"`)
  }
})

it('per-stage authored prose appears only as the correct action of a mistake at that stage', async () => {
  await reset()
  const cookie = await signIn('Review Eight', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, RECKLESS)

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
  const text = JSON.stringify(data.result)

  for (const scenario of data.result.scenarios) {
    const def = await definitionBehind(attemptId, scenario.ordinal)

    // The authoring title never appears, mistake or not.
    assert.ok(!text.includes(def.evaluation.title), `the title "${def.evaluation.title}" leaked`)

    const mistakeStages = new Set(scenario.review.mistakes.map((m) => m.stage))
    const released = releasedFor(scenario)

    for (const stage of def.evaluation.stages) {
      // The scoring text carries the point values, and is never released at any stage.
      if (stage.scoring_text) {
        assert.ok(!text.includes(stage.scoring_text), `the ${stage.key} scoring text leaked`)
      }
      // The learner flow is the authoring narration, and is never released either.
      if (stage.learner_flow && !released.has(stage.learner_flow)) {
        assert.ok(!text.includes(stage.learner_flow), `the ${stage.key} learner flow leaked`)
      }

      const behaviour = stage.expected_safe_behavior
      if (!behaviour || released.has(behaviour)) continue
      if (!text.includes(behaviour)) continue
      // `feedback.safe_action` is imported FROM the resolve stage, so an exact match with
      // an already-released field is not a new release. `released` covers that above.
      if (behaviour === scenario.review.correct_action) continue

      // It appeared. It is permitted only at a stage this learner actually got wrong,
      // and only as that mistake's own correct action.
      assert.ok(mistakeStages.has(stage.key),
        `the ${stage.key} behaviour was released without a mistake at that stage`)
      const owner = scenario.review.mistakes.find((m) => m.correct_action === behaviour)
      assert.ok(owner, `the ${stage.key} behaviour appeared outside a mistake's correct action`)
      assert.equal(owner.stage, stage.key, 'a stage line was attached to the wrong stage')
    }
  }
})

it('a scenario the learner handled correctly releases no per-stage prose at all', async () => {
  await reset()
  const cookie = await signIn('Review Nine', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, PERFECT)

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
  const text = JSON.stringify(data.result)

  for (const scenario of data.result.scenarios) {
    assert.deepEqual(scenario.review.mistakes, [])
    const def = await definitionBehind(attemptId, scenario.ordinal)
    const released = releasedFor(scenario)

    for (const stage of def.evaluation.stages) {
      const behaviour = stage.expected_safe_behavior
      if (!behaviour || released.has(behaviour)) continue
      assert.ok(!text.includes(behaviour),
        `a clean scenario released the ${stage.key} behaviour: "${behaviour.slice(0, 50)}"`)
    }
  }
})

it('the review explains the score and never restates or contradicts it', async () => {
  await reset()
  const cookie = await signIn('Review Ten', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, (disposition, ordinal) => ({
    safe: ordinal % 2 === 0,
    resolution: disposition === 'malicious' ? 'report' : 'continue',
  }))

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
  const { result } = data

  // No second score anywhere in the review.
  const reviewText = JSON.stringify({
    s: result.review_summary, r: result.scenarios.map((x) => x.review),
  })
  for (const field of ['total_score', 'score_0_10', 'max_score', 'points']) {
    assert.ok(!reviewText.includes(`"${field}"`), `the review published "${field}"`)
  }

  // And the counts reconcile with the authoritative summary.
  const { review_summary: review, summary } = result
  assert.equal(review.scenarios, summary.scenarios)
  assert.equal(review.missed_threats, summary.missed_threats)
  assert.equal(review.false_positives, summary.false_positives)
  assert.equal(review.unsafe_handling, summary.unsafe_handling)
  assert.equal(review.correct_decisions + review.scenarios_with_mistakes + review.not_resolved,
    review.scenarios, 'every scenario is in exactly one review bucket')

  // A scenario that scored full marks cannot be carrying a mistake.
  for (const scenario of result.scenarios) {
    if (scenario.score_0_10 === scenario.max_score) {
      assert.equal(scenario.review.mistakes.length, 0,
        `scenario ${scenario.ordinal} scored full marks but the review reports a mistake`)
    }
  }
})

it('the existing result contract is unchanged by the review', async () => {
  await reset()
  const cookie = await signIn('Review Twelve', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playAttempt(cookie, attemptId, PERFECT)

  const { data } = await call(`/attempts/${attemptId}/result`, { cookie })
  const { result } = data

  // Every key API-001 and RESULT-001 published is still published, with its meaning.
  for (const key of ['attempt_id', 'status', 'mode', 'total_score', 'max_score',
    'scenarios_resolved', 'scenarios_total', 'started_at', 'completed_at',
    'summary', 'scenarios', 'behaviour', 'comparison', 'remediation']) {
    assert.ok(key in result, `the result no longer publishes "${key}"`)
  }
  for (const key of ['ordinal', 'platform', 'score_0_10', 'outcome_code', 'final_stage',
    'resolved_at', 'scenario_ref', 'platform_label', 'outcome_class', 'max_score',
    'path', 'feedback']) {
    assert.ok(key in result.scenarios[0], `a scenario entry no longer publishes "${key}"`)
  }

  // `/complete` and `/result` return the same projection, review included.
  const again = await call(`/attempts/${attemptId}/result`, { cookie })
  assert.deepEqual(again.data.result, result)
})
