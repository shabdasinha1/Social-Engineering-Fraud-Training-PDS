import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import { createApp } from '../src/app.js'
import {
  DEMO_DISPOSITION_QUOTA,
  DEMO_SCENARIO_SEQUENCE,
  DEMO_SELECTION_VERSION,
  DEMO_SKIP_EVENT_CODE,
  DEMO_SKIPPED_OUTCOME_CODE,
} from '../src/constants/demoAssessment.js'
import { AdminUser } from '../src/models/AdminUser.js'
import { Attempt } from '../src/models/Attempt.js'
import { Candidate } from '../src/models/Candidate.js'
import { ScenarioDefinition } from '../src/models/ScenarioDefinition.js'
import { ScenarioEvent } from '../src/models/ScenarioEvent.js'
import { ScenarioRun } from '../src/models/ScenarioRun.js'
import { createAdminUser } from '../src/services/adminService.js'
import { createAttempt } from '../src/services/attemptService.js'
import {
  loadSourceScenarios,
  loadTaxonomies,
  toScenarioDefinition,
} from '../src/services/scenarioDefinitionImportService.js'
import { detectTransactionSupport } from '../src/utils/transactions.js'
import { codeFor } from './helpers/learnerActions.js'

/**
 * ENHANCEMENT-003 - the Demo User, the fixed demonstration assessment and Demo Skip.
 *
 * Real HTTP against a real Express app and a real replica set, through the real Login
 * endpoint and the real signed session cookie. Nothing is mocked: the point is to prove the
 * demo boundary holds over the wire, for the demo profile and against everyone else.
 *
 *   npm run test:engine
 */

const URI = process.env.ENGINE_TEST_MONGO_URI
let ready = false
let skipReason = 'ENGINE_TEST_MONGO_URI is not set'
let server
let base

const DEMO = { name: 'demo user', identifier: '1223334444' }
const ADMIN = { username: 'demo-test-admin', password: 'a-long-training-password' }

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
      await ScenarioDefinition.insertMany(scenarios.map((r) => toScenarioDefinition(r, taxonomies).doc))
      await Promise.all([
        Attempt.deleteMany({}), ScenarioRun.deleteMany({}), ScenarioEvent.deleteMany({}),
        Candidate.deleteMany({}), AdminUser.deleteMany({}),
      ])
      await createAdminUser(ADMIN)
      server = createApp().listen(0, '127.0.0.1')
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
  console.warn(`\n[ENHANCEMENT-003] demo assessment API tests SKIPPED - ${skipReason}\n`)
}

const it = (name, fn) => test(name, { skip: ready ? false : skipReason }, fn)

test.after(async () => {
  if (ready) {
    server?.close()
    await Promise.all([
      Attempt.deleteMany({}), ScenarioRun.deleteMany({}), ScenarioEvent.deleteMany({}),
      Candidate.deleteMany({}), ScenarioDefinition.deleteMany({}), AdminUser.deleteMany({}),
    ])
    await mongoose.disconnect()
  }
})

/* ------------------------------------------------------------------ *
 * HTTP helpers
 * ------------------------------------------------------------------ */

async function call(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  return { status: res.status, data, cookie: res.headers.getSetCookie?.()[0]?.split(';')[0] }
}

/** The normal Login endpoint - the only way anyone, demo or not, gets a session. */
async function signIn(name, identifier, extra = {}) {
  const res = await call('/candidates', { method: 'POST', body: { name, identifier, ...extra } })
  assert.ok([200, 201].includes(res.status), `sign-in failed: ${JSON.stringify(res.data)}`)
  return res.cookie
}

const demoSignIn = () => signIn(DEMO.name, DEMO.identifier)

let idSeq = 0
const nextIdentifier = () => `DM${String(700000 + (idSeq += 1))}`
let keySeq = 0
const key = (label) => `${label}-${Date.now()}-${(keySeq += 1)}`

async function reset() {
  await Promise.all([Attempt.deleteMany({}), ScenarioRun.deleteMany({}), ScenarioEvent.deleteMany({})])
}

async function start(cookie) {
  const res = await call('/attempts', { method: 'POST', cookie })
  assert.ok([200, 201].includes(res.status), `start failed: ${JSON.stringify(res.data)}`)
  return res.data.attempt
}

const skip = (cookie, attemptId, runId, body) =>
  call(`/attempts/${attemptId}/runs/${runId}/demo-skip`, { method: 'POST', cookie, body })

async function currentRun(cookie, attemptId) {
  const res = await call(`/attempts/${attemptId}/current-run`, { cookie })
  assert.equal(res.status, 200)
  return res.data
}

async function runsOf(attemptId) {
  return ScenarioRun.find({ attempt_id: attemptId }).sort({ ordinal: 1 })
}

async function act(cookie, attemptId, runId, intent) {
  const res = await call(`/attempts/${attemptId}/runs/${runId}/events`, {
    method: 'POST', cookie, body: { action_code: await codeFor(runId, intent), intent_key: key(intent) },
  })
  assert.equal(res.status, 200, `${intent} failed: ${JSON.stringify(res.data)}`)
  return res
}

/** Plays one run to the correct resolution through the normal learner endpoints. */
async function resolveCorrectly(cookie, attemptId, runId) {
  for (const intent of ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_trusted_directory']) {
    await act(cookie, attemptId, runId, intent)
  }
  const run = await ScenarioRun.findById(runId)
  const def = await ScenarioDefinition.findOne({ scenario_id: run.scenario_id, version: run.definition_version })
  const resolution = def.disposition === 'malicious' ? 'resolve_report' : 'resolve_continue'
  const res = await call(`/attempts/${attemptId}/runs/${runId}/resolve`, {
    method: 'POST', cookie, body: { action_code: await codeFor(runId, resolution), intent_key: key('resolve') },
  })
  assert.equal(res.status, 200, `resolve failed: ${JSON.stringify(res.data)}`)
}

/* ------------------------------------------------------------------ *
 * Demo identity and the fixed set
 * ------------------------------------------------------------------ */

it('the Demo User signs in on the normal Login endpoint and gets the fixed ten, in order', async () => {
  await reset()
  const cookie = await demoSignIn()
  const attempt = await start(cookie)

  assert.equal(attempt.is_demo, true)
  assert.equal(attempt.total_scenarios, 10)
  assert.equal(attempt.mode, 'assessment')

  const stored = await Attempt.findById(attempt.attempt_id)
  assert.equal(stored.selection.selection_algorithm_version, DEMO_SELECTION_VERSION)
  assert.deepEqual(stored.scenario_sequence.map((s) => s.scenario_id), [...DEMO_SCENARIO_SEQUENCE])
  assert.ok(stored.expires_at, 'a demo attempt keeps the normal deadline')

  const runs = await runsOf(attempt.attempt_id)
  assert.deepEqual(runs.map((r) => r.scenario_id), [...DEMO_SCENARIO_SEQUENCE])
  assert.deepEqual(runs.map((r) => r.ordinal), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

  const defs = await ScenarioDefinition.find({ scenario_id: { $in: runs.map((r) => r.scenario_id) }, active: true })
  assert.equal(defs.length, 10, 'every demo id is an active bank definition')
  assert.equal(defs.filter((d) => d.disposition === 'malicious').length, DEMO_DISPOSITION_QUOTA.malicious)
  assert.equal(defs.filter((d) => d.disposition === 'legitimate').length, DEMO_DISPOSITION_QUOTA.legitimate)
})

it('signing in as the Demo User with another name keeps the demo profile and its name (N1)', async () => {
  await reset()
  await demoSignIn()
  const res = await call('/candidates', {
    method: 'POST', body: { name: 'Presenter Name', identifier: ` ${DEMO.identifier.slice(0, 4)} ${DEMO.identifier.slice(4)} ` },
  })
  assert.equal(res.status, 200)
  assert.equal(res.data.created, false)
  assert.equal(res.data.candidate.display_name, DEMO.name)

  const profiles = await Candidate.find({ identifierNormalised: DEMO.identifier })
  assert.equal(profiles.length, 1)
  assert.equal(profiles[0].name, DEMO.name)

  const attempt = await start(res.cookie)
  assert.equal(attempt.is_demo, true)
  const stored = await Attempt.findById(attempt.attempt_id)
  assert.deepEqual(stored.scenario_sequence.map((s) => s.scenario_id), [...DEMO_SCENARIO_SEQUENCE])
})

it('the demo learner payload never carries a classification or the demo internals', async () => {
  await reset()
  const cookie = await demoSignIn()
  const attempt = await start(cookie)
  const payload = await currentRun(cookie, attempt.attempt_id)
  const text = JSON.stringify({ attempt, payload })
  for (const leaked of ['malicious', 'legitimate', 'disposition', 'canonical_family', 'canonical_triggers',
    'selection', DEMO_SELECTION_VERSION, 'demo-fixed', 'expected_action', 'evaluation', 'seed']) {
    assert.ok(!text.includes(leaked), `learner payload leaked ${leaked}`)
  }
  assert.equal(payload.run.scenario_id, 'W14')
})

it('a normal learner is not a demo learner and keeps the unchanged selector', async () => {
  await reset()
  const cookie = await signIn('Normal Learner', nextIdentifier())
  const attempt = await start(cookie)
  assert.ok(!('is_demo' in attempt), 'a normal learner payload must not mention demo at all')
  const stored = await Attempt.findById(attempt.attempt_id)
  assert.equal(stored.selection.selection_algorithm_version, '1.0.0')
  assert.equal(stored.selection.composition.disposition_counts.malicious, 8)
  assert.equal(stored.selection.composition.disposition_counts.legitimate, 2)
})

it('a learner cannot become the Demo User by sending a demo flag', async () => {
  await reset()
  const cookie = await signIn('Spoofing Learner', nextIdentifier(), { is_demo: true, isDemo: true, demo: true })
  const res = await call('/attempts', { method: 'POST', cookie, body: { is_demo: true, demo: true } })
  assert.equal(res.status, 201)
  assert.ok(!('is_demo' in res.data.attempt))
  const stored = await Attempt.findById(res.data.attempt.attempt_id)
  assert.equal(stored.selection.selection_algorithm_version, '1.0.0')
  // And the skip route stays closed to them.
  const runId = res.data.attempt.current_run.run_id
  const refused = await skip(cookie, res.data.attempt.attempt_id, runId, { expected_stage: 'notify', is_demo: true })
  assert.equal(refused.status, 404)
})

it('a new demo attempt repeats the same ten scenarios in the same order', async () => {
  await reset()
  const cookie = await demoSignIn()
  const first = await start(cookie)
  // Finish the first one quickly with the demo skip, then start again.
  for (let i = 0; i < 10; i += 1) {
    const { run } = await currentRun(cookie, first.attempt_id)
    assert.equal((await skip(cookie, first.attempt_id, run.run_id, { expected_stage: run.current_stage })).status, 200)
  }
  assert.equal((await call(`/attempts/${first.attempt_id}/complete`, { method: 'POST', cookie })).status, 200)

  const second = await start(cookie)
  assert.notEqual(second.attempt_id, first.attempt_id)
  const a = (await runsOf(first.attempt_id)).map((r) => r.scenario_id)
  const b = (await runsOf(second.attempt_id)).map((r) => r.scenario_id)
  assert.deepEqual(a, [...DEMO_SCENARIO_SEQUENCE])
  assert.deepEqual(b, a)
  assert.equal(await Candidate.countDocuments({ identifierNormalised: '1223334444' }), 1, 'one demo profile, never duplicated')
})

/* ------------------------------------------------------------------ *
 * Skip - what it does
 * ------------------------------------------------------------------ */

it('the Demo User can skip: one 0-point ledger event, run closed, next scenario served', async () => {
  await reset()
  const cookie = await demoSignIn()
  const attempt = await start(cookie)
  const { run } = await currentRun(cookie, attempt.attempt_id)

  const res = await skip(cookie, attempt.attempt_id, run.run_id, { expected_stage: 'notify' })
  assert.equal(res.status, 200, JSON.stringify(res.data))
  assert.equal(res.data.skipped, true)
  assert.equal(res.data.attempt.progress.resolved, 1)
  assert.equal(res.data.attempt.current_run.ordinal, 2)
  // Nothing about the verdict, the score or the ledger leaves the server.
  const text = JSON.stringify(res.data)
  for (const leaked of [DEMO_SKIP_EVENT_CODE, DEMO_SKIPPED_OUTCOME_CODE, 'score_0_10', 'score_running',
    'points', 'intent', 'event_code', 'feedback', 'outcome_code', 'disposition']) {
    assert.ok(!text.includes(leaked), `skip response leaked ${leaked}`)
  }
  // The attempt projection is the ordinary one; its total stays hidden until completion.
  assert.equal(res.data.attempt.total_score, null)

  const stored = await ScenarioRun.findById(run.run_id)
  assert.equal(stored.status, 'resolved')
  assert.equal(stored.outcome_code, DEMO_SKIPPED_OUTCOME_CODE)
  assert.equal(stored.score_0_10, 0)
  assert.equal(stored.last_sequence, 1)

  const events = await ScenarioEvent.find({ run_id: run.run_id }).sort({ sequence: 1 })
  assert.equal(events.length, 1)
  assert.equal(events[0].event_code, DEMO_SKIP_EVENT_CODE)
  assert.equal(events[0].points_delta, 0)
  assert.equal(events[0].sequence, 1)
  assert.equal(events[0].stage, 'notify')
  assert.equal(events[0].metadata.intent, undefined)

  const next = await currentRun(cookie, attempt.attempt_id)
  assert.equal(next.run.ordinal, 2)
  assert.equal(next.run.scenario_id, 'E08')
})

it('a skip mid-scenario keeps the ledger valid and awards and deducts nothing itself', async () => {
  await reset()
  const cookie = await demoSignIn()
  const attempt = await start(cookie)
  const { run } = await currentRun(cookie, attempt.attempt_id)
  for (const intent of ['open_item', 'read', 'inspect_sender']) await act(cookie, attempt.attempt_id, run.run_id, intent)

  const before = await ScenarioRun.findById(run.run_id)
  assert.equal(before.current_stage, 'branch')
  const res = await skip(cookie, attempt.attempt_id, run.run_id, { expected_stage: 'branch' })
  assert.equal(res.status, 200)

  const after = await ScenarioRun.findById(run.run_id)
  const events = await ScenarioEvent.find({ run_id: run.run_id }).sort({ sequence: 1 })
  assert.deepEqual(events.map((e) => e.sequence), [1, 2, 3, 4], 'strictly increasing, no gaps')
  assert.equal(events.at(-1).event_code, DEMO_SKIP_EVENT_CODE)
  assert.equal(events.at(-1).points_delta, 0)
  // The cache equals the ledger, and the final score is the engine's own clamp of it.
  const ledgerSum = events.reduce((sum, e) => sum + e.points_delta, 0)
  assert.equal(after.score_running, ledgerSum)
  assert.equal(after.score_running, before.score_running, 'the skip itself changed nothing')
  assert.equal(after.score_0_10, Math.max(0, Math.min(10, ledgerSum)))
  // No resolution and no penalty was fabricated.
  const codes = events.map((e) => e.event_code)
  for (const code of ['RESOLVE_CORRECT', 'CONTRADICTORY_UNSAFE_FINAL', 'RISKY_OPEN_REPLY',
    'SECRET_PAYMENT_INSTALL_DATA_RELEASE', 'UNSAFE_EXTERNAL_ACTION', 'FALSE_REPORT_BLOCK']) {
    assert.ok(!codes.includes(code), `skip fabricated ${code}`)
  }
})

/* ------------------------------------------------------------------ *
 * Skip - what it refuses
 * ------------------------------------------------------------------ */

it('a normal learner cannot skip, and nothing is written', async () => {
  await reset()
  const cookie = await signIn('Normal Skipper', nextIdentifier())
  const attempt = await start(cookie)
  const runId = attempt.current_run.run_id
  const res = await skip(cookie, attempt.attempt_id, runId, { expected_stage: 'notify' })
  assert.equal(res.status, 404)
  // Indistinguishable from a route that does not exist: no oracle for the demo feature.
  const unknown = await call(`/attempts/${attempt.attempt_id}/runs/${runId}/no-such-route`, { method: 'POST', cookie, body: {} })
  assert.equal(unknown.status, 404)
  assert.equal(res.data.error.code, unknown.data.error.code)
  assert.match(res.data.error.message, /^Route not found: POST /)
  const run = await ScenarioRun.findById(runId)
  assert.equal(run.status, 'active')
  assert.equal(await ScenarioEvent.countDocuments({ run_id: runId }), 0)
})

it('an unauthenticated skip is rejected', async () => {
  await reset()
  const cookie = await demoSignIn()
  const attempt = await start(cookie)
  const res = await skip(null, attempt.attempt_id, attempt.current_run.run_id, { expected_stage: 'notify' })
  assert.equal(res.status, 401)
  const forged = await skip('candidate_session=s%3Aabc.def', attempt.attempt_id, attempt.current_run.run_id, { expected_stage: 'notify' })
  assert.equal(forged.status, 401)
  assert.equal(await ScenarioEvent.countDocuments({}), 0)
})

it('the Demo User cannot skip in another learner\'s attempt', async () => {
  await reset()
  const other = await signIn('Other Learner', nextIdentifier())
  const theirs = await start(other)
  const demo = await demoSignIn()
  const res = await skip(demo, theirs.attempt_id, theirs.current_run.run_id, { expected_stage: 'notify' })
  assert.equal(res.status, 404)
  assert.equal((await ScenarioRun.findById(theirs.current_run.run_id)).status, 'active')
})

it('the Demo User cannot skip a run that belongs to a different attempt', async () => {
  await reset()
  const other = await signIn('Run Owner', nextIdentifier())
  const theirs = await start(other)
  const demo = await demoSignIn()
  const mine = await start(demo)
  const res = await skip(demo, mine.attempt_id, theirs.current_run.run_id, { expected_stage: 'notify' })
  assert.equal(res.status, 404)
  assert.equal((await ScenarioRun.findById(theirs.current_run.run_id)).status, 'active')
})

it('only the current scenario can be skipped, never an arbitrary later one', async () => {
  await reset()
  const cookie = await demoSignIn()
  const attempt = await start(cookie)
  const runs = await runsOf(attempt.attempt_id)
  const res = await skip(cookie, attempt.attempt_id, String(runs[4]._id), { expected_stage: 'notify' })
  assert.equal(res.status, 409)
  assert.equal(res.data.error?.code, 'RUN_NOT_CURRENT')
  assert.equal((await ScenarioRun.findById(runs[4]._id)).status, 'active')
  assert.equal(await ScenarioEvent.countDocuments({}), 0)
})

it('a skip at the wrong stage is refused as stale', async () => {
  await reset()
  const cookie = await demoSignIn()
  const attempt = await start(cookie)
  const runId = attempt.current_run.run_id
  const res = await skip(cookie, attempt.attempt_id, runId, { expected_stage: 'verify' })
  assert.equal(res.status, 409)
  assert.equal(res.data.error?.code, 'STALE_STATE')
  assert.equal((await ScenarioRun.findById(runId)).status, 'active')
})

it('a skip with no stage, a bad stage, or any extra field is refused', async () => {
  await reset()
  const cookie = await demoSignIn()
  const attempt = await start(cookie)
  const runId = attempt.current_run.run_id
  const bad = [
    undefined,
    {},
    { expected_stage: 'end' },
    { expected_stage: 'notify', intent: 'resolve_report' },
    { expected_stage: 'notify', action_code: 'x' },
    { expected_stage: 'notify', score_0_10: 10 },
    { expected_stage: 'notify', outcome_code: 'resolve_report' },
    { expected_stage: 'notify', event_code: 'RESOLVE_CORRECT' },
    { expected_stage: 'notify', profile_id: 'x' },
  ]
  for (const body of bad) {
    const res = await skip(cookie, attempt.attempt_id, runId, body)
    assert.equal(res.status, 422, `accepted ${JSON.stringify(body)}`)
  }
  assert.equal((await ScenarioRun.findById(runId)).status, 'active')
  assert.equal(await ScenarioEvent.countDocuments({}), 0)
})

it('a skip cannot be replayed, sequentially or concurrently', async () => {
  await reset()
  const cookie = await demoSignIn()
  const attempt = await start(cookie)
  const runId = attempt.current_run.run_id
  assert.equal((await skip(cookie, attempt.attempt_id, runId, { expected_stage: 'notify' })).status, 200)
  const again = await skip(cookie, attempt.attempt_id, runId, { expected_stage: 'notify' })
  assert.equal(again.status, 409)
  assert.equal(again.data.error?.code, 'RUN_NOT_ACTIVE')
  assert.equal(await ScenarioEvent.countDocuments({ run_id: runId }), 1)

  // Two at once on the next run: exactly one wins.
  const { run } = await currentRun(cookie, attempt.attempt_id)
  const results = await Promise.all([
    skip(cookie, attempt.attempt_id, run.run_id, { expected_stage: 'notify' }),
    skip(cookie, attempt.attempt_id, run.run_id, { expected_stage: 'notify' }),
  ])
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409])
  assert.equal(await ScenarioEvent.countDocuments({ run_id: run.run_id }), 1)
  assert.equal((await currentRun(cookie, attempt.attempt_id)).run.ordinal, 3)
})

it('a demo profile cannot skip inside an attempt the demo selector did not build', async () => {
  await reset()
  const cookie = await demoSignIn()
  const demo = await Candidate.findOne({ identifierNormalised: '1223334444' })
  // e.g. an attempt that existed on this profile before ENHANCEMENT-003.
  const { attempt } = await createAttempt({ profileId: demo._id })
  const runs = await runsOf(attempt._id)
  const res = await skip(cookie, attempt.id, String(runs[0]._id), { expected_stage: 'notify' })
  assert.equal(res.status, 404)
  assert.equal((await ScenarioRun.findById(runs[0]._id)).status, 'active')
})

it('a skip after the deadline is refused as expired', async () => {
  await reset()
  const cookie = await demoSignIn()
  const attempt = await start(cookie)
  await Attempt.updateOne({ _id: attempt.attempt_id }, { $set: { expires_at: new Date(Date.now() - 1000) } })
  const res = await skip(cookie, attempt.attempt_id, attempt.current_run.run_id, { expected_stage: 'notify' })
  assert.equal(res.status, 409)
  assert.equal(res.data.error?.code, 'ATTEMPT_EXPIRED')
})

it('the normal learner action endpoints still refuse every non-code field and name no skip', async () => {
  await reset()
  const cookie = await demoSignIn()
  const attempt = await start(cookie)
  const runId = attempt.current_run.run_id
  for (const body of [
    { intent: 'open_item', intent_key: key('x') },
    { action_code: 'demo-skip', intent_key: key('x') },
    { action_code: DEMO_SKIP_EVENT_CODE, intent_key: key('x') },
  ]) {
    const res = await call(`/attempts/${attempt.attempt_id}/runs/${runId}/events`, { method: 'POST', cookie, body })
    assert.equal(res.status, 422, JSON.stringify(body))
  }
  const { actions } = await currentRun(cookie, attempt.attempt_id)
  assert.ok(!JSON.stringify(actions).toLowerCase().includes('skip_scenario'))
})

/* ------------------------------------------------------------------ *
 * The demo result
 * ------------------------------------------------------------------ */

it('a demo with skips completes to an internally consistent result that reveals nothing about skipped items', async () => {
  await reset()
  const cookie = await demoSignIn()
  const attempt = await start(cookie)
  const skippedOrdinals = [2, 5, 9]

  for (let i = 1; i <= 10; i += 1) {
    const { run } = await currentRun(cookie, attempt.attempt_id)
    assert.equal(run.ordinal, i)
    if (skippedOrdinals.includes(i)) {
      assert.equal((await skip(cookie, attempt.attempt_id, run.run_id, { expected_stage: run.current_stage })).status, 200)
    } else {
      await resolveCorrectly(cookie, attempt.attempt_id, run.run_id)
    }
  }

  const done = await call(`/attempts/${attempt.attempt_id}/complete`, { method: 'POST', cookie })
  assert.equal(done.status, 200, JSON.stringify(done.data))
  const { result } = done.data

  // Integrity: the total is the sum of the committed scenario scores.
  const runs = await runsOf(attempt.attempt_id)
  const sum = runs.reduce((total, r) => total + r.score_0_10, 0)
  assert.equal(result.total_score, sum)
  assert.equal((await Attempt.findById(attempt.attempt_id)).total_score, sum)
  assert.equal(result.scenarios_resolved, 10)

  // Every non-skipped scenario was answered correctly; every skipped one scored 0.
  for (const s of result.scenarios) {
    if (skippedOrdinals.includes(s.ordinal)) {
      assert.equal(s.score_0_10, 0)
      assert.equal(s.skipped, true)
      assert.equal(s.outcome_class, 'demo_skipped')
      assert.equal(s.review.status, 'skipped')
      assert.equal(s.review.what_it_was, null)
      assert.deepEqual(s.review.correct_path, [])
      assert.equal(s.feedback.result, null)
      assert.deepEqual(s.feedback.cues, [])
      assert.deepEqual(s.path.at(-1), { step: s.path.at(-1).step, stage: 'resolve', action: 'skipped_in_demonstration' })
      const card = JSON.stringify(s)
      for (const leaked of ['malicious', 'legitimate', DEMO_SKIP_EVENT_CODE, 'canonical_family', 'disposition']) {
        assert.ok(!card.includes(leaked), `skipped card leaked ${leaked}`)
      }
    } else {
      assert.equal(s.outcome_class, 'handled_safely')
      assert.ok(!('skipped' in s))
    }
  }

  // Counts add up to ten, and skips are neither threats missed nor genuine items rejected.
  const sm = result.summary
  assert.equal(sm.skipped, 3)
  assert.equal(sm.handled_safely, 7)
  assert.equal(sm.missed_threats, 0)
  assert.equal(sm.false_positives, 0)
  assert.equal(sm.not_resolved, 0)
  assert.equal(result.review_summary.skipped, 3)
  assert.equal(result.review_summary.correct_decisions, 7)

  // Skipped items are left out of the family / trigger / platform breakdown.
  const inBreakdown = result.behaviour.by_platform.reduce((n, b) => n + b.scenarios, 0)
  assert.equal(inBreakdown, 7)
  assert.ok(!JSON.stringify(result).includes(DEMO_SKIP_EVENT_CODE))

  // The same result is served again on read.
  const read = await call(`/attempts/${attempt.attempt_id}/result`, { cookie })
  assert.equal(read.status, 200)
  assert.deepEqual(read.data.result.summary, result.summary)
})

it('a normal learner result is unchanged: no skipped keys anywhere', async () => {
  await reset()
  const cookie = await signIn('Normal Finisher', nextIdentifier())
  const attempt = await start(cookie)
  for (let i = 0; i < 10; i += 1) {
    const { run } = await currentRun(cookie, attempt.attempt_id)
    await resolveCorrectly(cookie, attempt.attempt_id, run.run_id)
  }
  const done = await call(`/attempts/${attempt.attempt_id}/complete`, { method: 'POST', cookie })
  assert.equal(done.status, 200)
  const { result } = done.data
  assert.ok(!('skipped' in result.summary))
  assert.ok(!('skipped' in result.review_summary))
  assert.ok(result.scenarios.every((s) => !('skipped' in s)))
  assert.equal(result.summary.handled_safely, 10)
  assert.equal(result.total_score, 100)
})

/* ------------------------------------------------------------------ *
 * Admin
 * ------------------------------------------------------------------ */

async function adminSession() {
  const login = await call('/admin/login', { method: 'POST', body: ADMIN })
  assert.equal(login.status, 200)
  return login.cookie
}

/** A normal learner who plays a whole attempt correctly and completes it. */
async function completedNormalAttempt(name) {
  const cookie = await signIn(name, nextIdentifier())
  const attempt = await start(cookie)
  for (let i = 0; i < 10; i += 1) {
    const { run } = await currentRun(cookie, attempt.attempt_id)
    await resolveCorrectly(cookie, attempt.attempt_id, run.run_id)
  }
  const done = await call(`/attempts/${attempt.attempt_id}/complete`, { method: 'POST', cookie })
  assert.equal(done.status, 200)
  return attempt.attempt_id
}

/**
 * A demo attempt that alternates skip / play, so both kinds of run are in the ledger.
 * `complete: false` leaves it in progress after two scenarios.
 */
async function demoAttempt({ complete = true } = {}) {
  const cookie = await demoSignIn()
  const attempt = await start(cookie)
  const upto = complete ? 10 : 2
  for (let i = 0; i < upto; i += 1) {
    const { run } = await currentRun(cookie, attempt.attempt_id)
    if (i % 2 === 0) {
      const res = await skip(cookie, attempt.attempt_id, run.run_id, { expected_stage: run.current_stage })
      assert.equal(res.status, 200)
    } else {
      await resolveCorrectly(cookie, attempt.attempt_id, run.run_id)
    }
  }
  if (complete) {
    const done = await call(`/attempts/${attempt.attempt_id}/complete`, { method: 'POST', cookie })
    assert.equal(done.status, 200)
  }
  return attempt.attempt_id
}

/** The dashboard minus its timestamp, for exact before/after comparison. */
async function dashboardFigures(admin) {
  const res = await call('/admin/dashboard', { cookie: admin })
  assert.equal(res.status, 200)
  const { generated_at: _ignored, ...figures } = res.data
  return figures
}

/* ------------------------------------------------------------------ *
 * Admin (ENHANCEMENT-003-FINAL)
 * ------------------------------------------------------------------ */

it('demo attempts stay visible to the instructor, labelled as demo skips', async () => {
  await reset()
  const cookie = await demoSignIn()
  const attempt = await start(cookie)
  const { run } = await currentRun(cookie, attempt.attempt_id)
  await skip(cookie, attempt.attempt_id, run.run_id, { expected_stage: 'notify' })
  const admin = await adminSession()

  const list = await call('/admin/attempts', { cookie: admin })
  assert.equal(list.status, 200)
  assert.ok(JSON.stringify(list.data).includes(attempt.attempt_id), 'demo attempt missing from the admin list')

  // In progress: the admin viewer's partial view.
  const detail = await call(`/admin/attempts/${attempt.attempt_id}`, { cookie: admin })
  assert.equal(detail.status, 200)
  const first = detail.data.scenarios.find((s) => s.ordinal === 1)
  assert.equal(first.outcome_code, DEMO_SKIPPED_OUTCOME_CODE)
  assert.equal(first.outcome_class, 'demo_skipped')
})

it('a completed demo attempt opens in Attempt Detail, with skips distinct from time-limit closures', async () => {
  await reset()
  const id = await demoAttempt()
  const admin = await adminSession()

  const detail = await call(`/admin/attempts/${id}`, { cookie: admin })
  assert.equal(detail.status, 200)
  const skipped = detail.data.scenarios.filter((s) => s.outcome_code === DEMO_SKIPPED_OUTCOME_CODE)
  assert.equal(skipped.length, 5)
  for (const s of skipped) {
    assert.equal(s.outcome_class, 'demo_skipped')
    assert.equal(s.score_0_10, 0)
  }
  assert.equal(detail.data.summary.not_resolved, 0, 'a demo skip is not a time-limit closure')
  assert.ok(!JSON.stringify(detail.data).includes(DEMO_SKIP_EVENT_CODE), 'no event code in the viewer')
})

it('a normal time-limit closure still reads as not_resolved, never as a demo skip', async () => {
  await reset()
  const cookie = await signIn('Clock Runner', nextIdentifier())
  const attempt = await start(cookie)
  await Attempt.updateOne({ _id: attempt.attempt_id }, { $set: { expires_at: new Date(Date.now() - 1000) } })
  const settled = await call('/attempts/current', { cookie })
  assert.equal(settled.data.attempt.end_reason, 'expired')

  const admin = await adminSession()
  const detail = await call(`/admin/attempts/${attempt.attempt_id}`, { cookie: admin })
  assert.equal(detail.status, 200)
  for (const s of detail.data.scenarios) {
    assert.equal(s.outcome_class, 'not_resolved')
    assert.equal(s.outcome_code, 'resolve_expired')
  }
  const dash = await dashboardFigures(admin)
  assert.equal(dash.scenarios.outcomes.not_resolved, 10)
  assert.ok(!('demo_skipped' in dash.scenarios.outcomes))
})

it('a normal learner attempt appears in Dashboard analytics', async () => {
  await reset()
  await Candidate.deleteMany({})
  await completedNormalAttempt('Counted Learner')
  const dash = await dashboardFigures(await adminSession())

  assert.equal(dash.learners.total, 1)
  assert.equal(dash.learners.with_any_attempt, 1)
  assert.equal(dash.learners.with_completed_attempt, 1)
  assert.equal(dash.attempts.total, 1)
  assert.equal(dash.attempts.by_status.completed, 1)
  assert.equal(dash.scores.attempts.count, 1)
  assert.equal(dash.scores.attempts.mean, 100)
  assert.equal(dash.scenarios.classified, 10)
  assert.equal(dash.scenarios.outcomes.handled_safely, 10)
  assert.equal(dash.activity.completions_by_day.at(-1).completed, 1)
})

it('demo attempts - one or several, finished or not - do not move a single Dashboard figure', async () => {
  await reset()
  await Candidate.deleteMany({})
  await completedNormalAttempt('Baseline Learner')
  const admin = await adminSession()
  const before = await dashboardFigures(admin)

  await demoAttempt()
  assert.deepEqual(await dashboardFigures(admin), before, 'one demo attempt changed the dashboard')

  await demoAttempt()
  await demoAttempt({ complete: false })
  assert.deepEqual(await dashboardFigures(admin), before, 'several demo attempts changed the dashboard')

  // They are all still there for the instructor to inspect.
  const demoProfile = await Candidate.findOne({ identifierNormalised: '1223334444' })
  const demoAttempts = await Attempt.find({ profile_id: demoProfile._id })
  assert.equal(demoAttempts.length, 3)
  const list = await call('/admin/attempts', { cookie: admin })
  assert.equal(list.status, 200)
  for (const a of demoAttempts) {
    assert.ok(JSON.stringify(list.data).includes(a.id), `demo attempt ${a.id} missing from the admin list`)
    assert.equal((await call(`/admin/attempts/${a.id}`, { cookie: admin })).status, 200)
  }

  // A normal learner added afterwards still counts, exactly once.
  await completedNormalAttempt('Second Learner')
  const withSecond = await dashboardFigures(admin)
  assert.equal(withSecond.learners.total, before.learners.total + 1)
  assert.equal(withSecond.attempts.total, before.attempts.total + 1)
  assert.equal(withSecond.scenarios.classified, before.scenarios.classified + 10)
})

it('a request cannot pull demo attempts back into the Dashboard', async () => {
  await reset()
  await demoAttempt()
  const admin = await adminSession()
  for (const query of ['?include_demo=true', '?is_demo=true', '?demo=1']) {
    const res = await call(`/admin/dashboard${query}`, { cookie: admin })
    assert.equal(res.status, 422, query)
  }
  const dash = await dashboardFigures(admin)
  assert.equal(dash.attempts.total, 0)
  assert.equal(dash.scenarios.classified, 0)
})

/* ------------------------------------------------------------------ *
 * After expiry (FINAL-PRE-CLIENT-FIX-001)
 * ------------------------------------------------------------------ */

/** Back-dates the deadline the way every timer test does, then lets the server settle it. */
async function expire(cookie, attemptId) {
  await Attempt.updateOne({ _id: attemptId }, { $set: { expires_at: new Date(Date.now() - 1000) } })
  const settled = await call('/attempts/current', { cookie })
  assert.equal(settled.status, 200)
  assert.equal(settled.data.attempt.status, 'completed')
  assert.equal(settled.data.attempt.end_reason, 'expired')
  return settled.data.attempt
}

it('after a normal attempt expires, Start creates a new attempt through the unchanged selector', async () => {
  await reset()
  const cookie = await signIn('Expired Learner', nextIdentifier())
  const first = await start(cookie)
  const reported = await expire(cookie, first.attempt_id)
  // The expired attempt is REPORTED (for the timeout notice) but is not in progress.
  assert.equal(reported.attempt_id, first.attempt_id)
  assert.equal(reported.current_run, null)

  const res = await call('/attempts', { method: 'POST', cookie })
  assert.equal(res.status, 201)
  assert.equal(res.data.created, true)
  assert.notEqual(res.data.attempt.attempt_id, first.attempt_id)
  assert.equal(res.data.attempt.status, 'in_progress')
  assert.ok(!('is_demo' in res.data.attempt))

  const stored = await Attempt.findById(res.data.attempt.attempt_id)
  assert.equal(stored.selection.selection_algorithm_version, '1.0.0')
  assert.deepEqual(stored.selection.composition.disposition_counts, { malicious: 8, legitimate: 2 })

  const now = await call('/attempts/current', { cookie })
  assert.equal(now.data.attempt.attempt_id, res.data.attempt.attempt_id)
  assert.equal(now.data.attempt.status, 'in_progress')
})

it('after a demo attempt expires, the Demo User starts a fresh fixed demo in which Skip still works', async () => {
  await reset()
  const cookie = await demoSignIn()
  const first = await start(cookie)
  await expire(cookie, first.attempt_id)

  const res = await call('/attempts', { method: 'POST', cookie })
  assert.equal(res.status, 201)
  assert.equal(res.data.created, true)
  assert.equal(res.data.attempt.is_demo, true)
  assert.notEqual(res.data.attempt.attempt_id, first.attempt_id)

  const runs = await runsOf(res.data.attempt.attempt_id)
  assert.deepEqual(runs.map((r) => r.scenario_id), [...DEMO_SCENARIO_SEQUENCE])

  const { run } = await currentRun(cookie, res.data.attempt.attempt_id)
  const skipped = await skip(cookie, res.data.attempt.attempt_id, run.run_id, { expected_stage: 'notify' })
  assert.equal(skipped.status, 200)
  assert.equal(skipped.data.attempt.current_run.ordinal, 2)
})
