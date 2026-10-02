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
import { codeFor } from './helpers/learnerActions.js'

/**
 * API-001 - candidate attempt and scenario orchestration API.
 *
 * Real HTTP against a real Express app and a real replica set, using the real signed
 * session cookie. Nothing is mocked: the point is to prove the ownership boundary and the
 * candidate-safe projection actually hold over the wire.
 *
 *   npm run test:engine        (starts a throwaway replica set and runs this suite)
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
  console.warn(`\n[API-001] attempt API tests SKIPPED - ${skipReason}\n`)
}

const it = (name, fn) => test(name, { skip: ready ? false : skipReason }, fn)

/* ------------------------------------------------------------------ *
 * HTTP helpers - real cookies, no mocking
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

/** Registers a candidate and returns its session cookie - the real auth path. */
async function signIn(name, identifier) {
  const res = await call('/candidates', { method: 'POST', body: { name, identifier } })
  assert.equal(res.status, 201, `sign-in failed: ${JSON.stringify(res.data)}`)
  assert.ok(res.cookie, 'expected a session cookie')
  return res.cookie
}

let idSeq = 0
const nextIdentifier = () => `IC${String(100000 + (idSeq += 1))}`
let keySeq = 0
const key = (label) => `${label}-${Date.now()}-${(keySeq += 1)}`

/** Drives one run to resolution through the API. Returns the final response. */
async function resolveRunViaApi(cookie, attemptId, runId, disposition = 'report') {
  const steps = ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_trusted_directory']
  for (const intent of steps) {
    const r = await call(`/attempts/${attemptId}/runs/${runId}/events`, {
      method: 'POST', cookie, body: { action_code: await codeFor(runId, intent), intent_key: key(intent) },
    })
    assert.equal(r.status, 200, `${intent} failed: ${JSON.stringify(r.data)}`)
  }
  return call(`/attempts/${attemptId}/runs/${runId}/resolve`, {
    method: 'POST',
    cookie,
    body: { action_code: await codeFor(runId, `resolve_${disposition}`), intent_key: key('resolve') },
  })
}

/** Plays a whole attempt to completion, choosing the correct resolution per scenario. */
async function completeWholeAttempt(cookie, attemptId) {
  for (let i = 0; i < 10; i += 1) {
    const cur = await call(`/attempts/${attemptId}/current-run`, { cookie })
    assert.equal(cur.status, 200)
    assert.ok(cur.data.run, `expected a run at position ${i + 1}`)
    const run = await ScenarioRun.findById(cur.data.run.run_id)
    const def = await ScenarioDefinition.findOne({
      scenario_id: run.scenario_id, version: run.definition_version,
    })
    const correct = def.disposition === 'malicious' ? 'report' : 'continue'
    const done = await resolveRunViaApi(cookie, attemptId, cur.data.run.run_id, correct)
    assert.equal(done.status, 200, `resolve failed: ${JSON.stringify(done.data)}`)
  }
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

async function reset() {
  await Promise.all([
    Attempt.deleteMany({}), ScenarioRun.deleteMany({}), ScenarioEvent.deleteMany({}),
  ])
}

/* ------------------------------------------------------------------ *
 * 1-5  auth, start, ownership
 * ------------------------------------------------------------------ */

it('an authenticated candidate can start an attempt', async () => {
  await reset()
  const cookie = await signIn('Alpha One', nextIdentifier())
  const res = await call('/attempts', { method: 'POST', cookie })

  assert.equal(res.status, 201)
  assert.equal(res.data.created, true)
  assert.equal(res.data.attempt.status, 'in_progress')
  assert.equal(res.data.attempt.total_scenarios, 10)
  assert.equal(res.data.attempt.progress.resolved, 0)
  assert.ok(res.data.attempt.current_run.run_id)
  assert.equal(res.data.attempt.current_run.ordinal, 1)
  assert.equal(res.data.attempt.current_run.current_stage, 'notify')
})

it('starting creates exactly ten runs via the existing selection service', async () => {
  await reset()
  const cookie = await signIn('Alpha Two', nextIdentifier())
  const res = await call('/attempts', { method: 'POST', cookie })

  const attempt = await Attempt.findById(res.data.attempt.attempt_id)
  const runs = await ScenarioRun.find({ attempt_id: attempt._id }).sort({ ordinal: 1 })
  assert.equal(runs.length, 10)
  assert.deepEqual(runs.map((r) => r.ordinal), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

  // Proof the deterministic selector ran rather than being re-implemented in the API.
  assert.ok(attempt.seed, 'a seed must have been generated server-side')
  assert.equal(attempt.selection.selection_algorithm_version, '1.0.0')
  const c = attempt.selection.composition
  assert.equal(c.disposition_counts.malicious, 8)
  assert.equal(c.disposition_counts.legitimate, 2)
  assert.deepEqual(c.difficulty_counts, { easy: 3, medium: 4, hard: 3 })
  assert.ok(c.military_count >= 2 && c.military_count <= 4)
})

it('unauthenticated requests are rejected on every route', async () => {
  const routes = [
    ['POST', '/attempts'],
    ['GET', '/attempts/current'],
    ['GET', '/attempts/000000000000000000000001'],
    ['GET', '/attempts/000000000000000000000001/current-run'],
    ['POST', '/attempts/000000000000000000000001/runs/000000000000000000000002/events'],
    ['POST', '/attempts/000000000000000000000001/runs/000000000000000000000002/resolve'],
    ['POST', '/attempts/000000000000000000000001/complete'],
    ['GET', '/attempts/000000000000000000000001/result'],
  ]
  for (const [method, path] of routes) {
    const res = await call(path, { method })
    assert.equal(res.status, 401, `${method} ${path}`)
    assert.equal(res.data.error.code, 'NO_SESSION')
  }
})

it('a candidate cannot reach another candidate attempt, run or result', async () => {
  await reset()
  const alice = await signIn('Alice Owner', nextIdentifier())
  const mallory = await signIn('Mallory Other', nextIdentifier())

  const created = await call('/attempts', { method: 'POST', cookie: alice })
  const attemptId = created.data.attempt.attempt_id
  const runId = created.data.attempt.current_run.run_id

  for (const [method, path] of [
    ['GET', `/attempts/${attemptId}`],
    ['GET', `/attempts/${attemptId}/current-run`],
    ['GET', `/attempts/${attemptId}/result`],
    ['POST', `/attempts/${attemptId}/complete`],
  ]) {
    const res = await call(path, { method, cookie: mallory })
    assert.equal(res.status, 404, `${method} ${path} leaked existence`)
  }

  const evt = await call(`/attempts/${attemptId}/runs/${runId}/events`, {
    method: 'POST', cookie: mallory, body: { action_code: await codeFor(runId, 'open_item'), intent_key: key('x') },
  })
  assert.equal(evt.status, 404)
  assert.equal(await ScenarioEvent.countDocuments({ run_id: runId }), 0,
    'another candidate must not be able to write an event')
})

it('a run from another attempt is rejected even for its own owner', async () => {
  await reset()
  const a = await signIn('Owner A', nextIdentifier())
  const first = await call('/attempts', { method: 'POST', cookie: a })
  const firstRun = first.data.attempt.current_run.run_id
  await Attempt.updateOne({ _id: first.data.attempt.attempt_id },
    { $set: { status: 'completed', completed_at: new Date() } })
  const second = await call('/attempts', { method: 'POST', cookie: a })

  const res = await call(`/attempts/${second.data.attempt.attempt_id}/runs/${firstRun}/events`, {
    method: 'POST', cookie: a, body: { action_code: await codeFor(firstRun, 'open_item'), intent_key: key('cross') },
  })
  assert.equal(res.status, 404, 'a run must belong to the attempt in the path')
})

/* ------------------------------------------------------------------ *
 * 6-8  retrieval and the candidate-safe projection
 * ------------------------------------------------------------------ */

it('the current attempt can be retrieved and is never created by a GET', async () => {
  await reset()
  const cookie = await signIn('Beta One', nextIdentifier())

  const empty = await call('/attempts/current', { cookie })
  assert.equal(empty.status, 200)
  assert.equal(empty.data.attempt, null)
  assert.equal(await Attempt.countDocuments(), 0, 'a GET must never create an attempt')

  await call('/attempts', { method: 'POST', cookie })
  const now = await call('/attempts/current', { cookie })
  assert.equal(now.data.attempt.status, 'in_progress')
})

it('starting twice resumes rather than creating a second attempt', async () => {
  await reset()
  const cookie = await signIn('Beta Two', nextIdentifier())
  const first = await call('/attempts', { method: 'POST', cookie })
  const second = await call('/attempts', { method: 'POST', cookie })

  assert.equal(first.status, 201)
  assert.equal(second.status, 200)
  assert.equal(second.data.created, false)
  assert.equal(second.data.attempt.attempt_id, first.data.attempt.attempt_id)
  assert.equal(await Attempt.countDocuments(), 1)
  assert.equal(await ScenarioRun.countDocuments(), 10)
})

it('concurrent Starts (double click, two tabs) create exactly one attempt (release audit)', async () => {
  await reset()
  const cookie = await signIn('Beta Race', nextIdentifier())
  const starts = await Promise.all(
    Array.from({ length: 8 }, () => call('/attempts', { method: 'POST', cookie })),
  )

  const statuses = starts.map((r) => r.status)
  assert.ok(statuses.every((s) => s === 200 || s === 201), `statuses ${statuses.join(',')}`)
  assert.equal(statuses.filter((s) => s === 201).length, 1)
  assert.equal(new Set(starts.map((r) => r.data.attempt.attempt_id)).size, 1)
  assert.equal(await Attempt.countDocuments({ status: 'in_progress' }), 1)
  assert.equal(await ScenarioRun.countDocuments(), 10)
})

it('malformed JSON is a 400, not a 500 (release audit)', async () => {
  const res = await fetch(`${base}/candidates`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{not json',
  })
  const data = await res.json()
  assert.equal(res.status, 400)
  assert.equal(data.error.code, 'INVALID_JSON')
  assert.equal(data.error.details, null)
})

it('current-run returns the pinned definition and no hidden data', async () => {
  await reset()
  const cookie = await signIn('Gamma One', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id

  const res = await call(`/attempts/${attemptId}/current-run`, { cookie })
  assert.equal(res.status, 200)
  assert.equal(res.data.run.current_stage, 'notify')
  assert.ok(res.data.scenario.stages.length === 6)

  const run = await ScenarioRun.findById(res.data.run.run_id)
  assert.equal(res.data.scenario.version, run.definition_version, 'must use the PINNED version')
  assert.equal(res.data.scenario.scenario_id, run.scenario_id)

  // Nothing that reveals the answer may cross the wire.
  const text = JSON.stringify(res.data)
  const def = await ScenarioDefinition.findOne({
    scenario_id: run.scenario_id, version: run.definition_version,
  }).select('+evaluation')
  for (const secret of [
    def.evaluation.title, def.family, def.trigger, def.canonical_family,
    def.evaluation.end_state, def.evaluation.stages[5].expected_safe_behavior,
  ]) {
    assert.ok(!text.includes(secret), `current-run leaked "${String(secret).slice(0, 40)}"`)
  }
  for (const field of ['evaluation', 'canonical_family', 'canonical_triggers', 'military_flag',
    'disposition', 'level', 'score_running', 'seed', 'selection']) {
    assert.ok(!text.includes(`"${field}"`), `current-run exposed field "${field}"`)
  }
})

it('the attempt projection never carries the seed or selection metadata', async () => {
  await reset()
  const cookie = await signIn('Gamma Two', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attempt = await Attempt.findById(created.data.attempt.attempt_id)

  for (const res of [created, await call(`/attempts/${attempt.id}`, { cookie })]) {
    const text = JSON.stringify(res.data)
    assert.ok(!text.includes(attempt.seed), 'the selection seed must never reach the learner')
    for (const field of ['seed', 'selection', 'scenario_sequence', 'profile_id', 'composition']) {
      assert.ok(!text.includes(`"${field}"`), `attempt payload exposed "${field}"`)
    }
  }
})

/* ------------------------------------------------------------------ *
 * 9-15  events go through the engine
 * ------------------------------------------------------------------ */

it('a valid event reaches the engine and advances the run', async () => {
  await reset()
  const cookie = await signIn('Delta One', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const { attempt_id: attemptId, current_run: cur } = created.data.attempt

  const res = await call(`/attempts/${attemptId}/runs/${cur.run_id}/events`, {
    method: 'POST', cookie, body: { action_code: await codeFor(cur.run_id, 'open_item'), intent_key: key('a') },
  })
  assert.equal(res.status, 200)
  // SECURITY-001: the verdict on the choice stays in the ledger, not in the response.
  assert.equal(res.data.event.event_code, undefined)
  assert.equal(res.data.event.sequence, 1)
  assert.equal(res.data.run.current_stage, 'open')
  assert.equal(res.data.score_visibility, 'hidden')
  assert.equal(res.data.score_0_10, null, 'no score before resolution')

  const stored = await ScenarioEvent.findOne({ run_id: cur.run_id, sequence: 1 })
  assert.equal(stored.event_code, 'NOTIFY_SEEN')
})

it('an action for another stage, or an unknown one, is rejected and writes nothing', async () => {
  await reset()
  const cookie = await signIn('Delta Two', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const { attempt_id: attemptId, current_run: cur } = created.data.attempt

  const res = await call(`/attempts/${attemptId}/runs/${cur.run_id}/events`, {
    method: 'POST', cookie, body: { action_code: await codeFor(cur.run_id, 'resolve_report'), intent_key: key('bad') },
  })
  // SECURITY-001: a resolve-stage control at notify is refused by the engine's own stage check.
  assert.equal(res.status, 409)
  assert.equal(res.data.error.code, 'STALE_STATE')
  assert.equal(await ScenarioEvent.countDocuments({ run_id: cur.run_id }), 0)

  const unknown = await call(`/attempts/${attemptId}/runs/${cur.run_id}/events`, {
    method: 'POST', cookie, body: { action_code: 'ac_00000000000000000000', intent_key: key('u') },
  })
  assert.equal(unknown.status, 422)
  assert.equal(unknown.data.error.code, 'INVALID_ACTION')
  const named = await call(`/attempts/${attemptId}/runs/${cur.run_id}/events`, {
    method: 'POST', cookie, body: { intent: 'open_item', intent_key: key('n') },
  })
  assert.equal(named.status, 422)
  assert.equal(named.data.error.code, 'FORBIDDEN_FIELD')
  assert.equal(await ScenarioEvent.countDocuments({ run_id: cur.run_id }), 0)
})

it('the client cannot inject points, a stage, a score or a seed', async () => {
  await reset()
  const cookie = await signIn('Echo One', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const { attempt_id: attemptId, current_run: cur } = created.data.attempt

  for (const injected of [
    { points_delta: 99 }, { score: 100 }, { score_0_10: 10 }, { event_code: 'RESOLVE_CORRECT' },
    { next_stage: 'resolve' }, { current_stage: 'resolve' }, { sequence: 99 },
    { outcome_code: 'resolve_report' }, { status: 'resolved' }, { evaluation: {} },
  ]) {
    const res = await call(`/attempts/${attemptId}/runs/${cur.run_id}/events`, {
      method: 'POST',
      cookie,
      body: { action_code: await codeFor(cur.run_id, 'open_item'), intent_key: key('inj'), ...injected },
    })
    assert.equal(res.status, 422, `${Object.keys(injected)[0]} was not rejected`)
    assert.equal(res.data.error.code, 'FORBIDDEN_FIELD')
  }
  assert.equal(await ScenarioEvent.countDocuments({ run_id: cur.run_id }), 0)

  // A seed cannot be forced onto attempt creation either.
  const seeded = await call('/attempts', { method: 'POST', cookie, body: { seed: 'chosen' } })
  assert.equal(seeded.status, 422)
  assert.equal(seeded.data.error.code, 'FORBIDDEN_FIELD')
})

it('a duplicate intent_key is idempotent over HTTP', async () => {
  await reset()
  const cookie = await signIn('Echo Two', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const { attempt_id: attemptId, current_run: cur } = created.data.attempt
  await call(`/attempts/${attemptId}/runs/${cur.run_id}/events`, {
    method: 'POST', cookie, body: { action_code: await codeFor(cur.run_id, 'open_item'), intent_key: key('o') },
  })
  await call(`/attempts/${attemptId}/runs/${cur.run_id}/events`, {
    method: 'POST', cookie, body: { action_code: await codeFor(cur.run_id, 'read'), intent_key: key('r') },
  })

  const k = key('inspect-once')
  const first = await call(`/attempts/${attemptId}/runs/${cur.run_id}/events`, {
    method: 'POST', cookie, body: { action_code: await codeFor(cur.run_id, 'inspect_sender'), intent_key: k },
  })
  const again = await call(`/attempts/${attemptId}/runs/${cur.run_id}/events`, {
    method: 'POST', cookie, body: { action_code: await codeFor(cur.run_id, 'inspect_sender'), intent_key: k },
  })

  assert.equal(again.status, 200)
  assert.equal(again.data.duplicate, true)
  assert.equal(again.data.event.sequence, first.data.event.sequence)
  assert.equal(await ScenarioEvent.countDocuments({ run_id: cur.run_id }), 3)
  const run = await ScenarioRun.findById(cur.run_id)
  assert.equal(run.score_running, 2, 'INSPECT_CONTEXT must be awarded once')
})

it('a stale expected_stage is rejected with a resync payload', async () => {
  await reset()
  const cookie = await signIn('Foxtrot One', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const { attempt_id: attemptId, current_run: cur } = created.data.attempt
  await call(`/attempts/${attemptId}/runs/${cur.run_id}/events`, {
    method: 'POST', cookie, body: { action_code: await codeFor(cur.run_id, 'open_item'), intent_key: key('o') },
  })

  const stale = await call(`/attempts/${attemptId}/runs/${cur.run_id}/events`, {
    method: 'POST',
    cookie,
    // SECURITY-001: a stale tab still shows notify, so it sends a notify control's code.
    body: { action_code: await codeFor(cur.run_id, 'dismiss'), intent_key: key('r'), expected_stage: 'notify' },
  })
  assert.equal(stale.status, 409)
  assert.equal(stale.data.error.code, 'STALE_STATE')
  assert.equal(stale.data.error.details.current_stage, 'open')
  assert.equal(await ScenarioEvent.countDocuments({ run_id: cur.run_id }), 1)
})

it('a resolved run accepts no further events', async () => {
  await reset()
  const cookie = await signIn('Foxtrot Two', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const { attempt_id: attemptId, current_run: cur } = created.data.attempt

  const done = await resolveRunViaApi(cookie, attemptId, cur.run_id)
  assert.equal(done.status, 200)
  assert.equal(done.data.run.status, 'resolved')

  const after = await call(`/attempts/${attemptId}/runs/${cur.run_id}/events`, {
    method: 'POST', cookie, body: { action_code: await codeFor(cur.run_id, 'open_item'), intent_key: key('after') },
  })
  assert.equal(after.status, 409)
  assert.equal(after.data.error.code, 'RUN_NOT_ACTIVE')
})

it('the resolve route only accepts resolve-stage actions', async () => {
  await reset()
  const cookie = await signIn('Golf One', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const { attempt_id: attemptId, current_run: cur } = created.data.attempt

  const res = await call(`/attempts/${attemptId}/runs/${cur.run_id}/resolve`, {
    method: 'POST', cookie, body: { action_code: await codeFor(cur.run_id, 'open_item'), intent_key: key('nope') },
  })
  assert.equal(res.status, 422)
  assert.equal(res.data.error.code, 'INVALID_ACTION')
  assert.ok(!/open_item|resolve_/.test(res.data.error.message), 'the refusal names no intent')
})

it('rationale is accepted, validated and never echoed back', async () => {
  await reset()
  const cookie = await signIn('Golf Two', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const { attempt_id: attemptId, current_run: cur } = created.data.attempt
  for (const intent of ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_trusted_directory']) {
    await call(`/attempts/${attemptId}/runs/${cur.run_id}/events`, {
      method: 'POST', cookie, body: { action_code: await codeFor(cur.run_id, intent), intent_key: key(intent) },
    })
  }

  const tooLong = await call(`/attempts/${attemptId}/runs/${cur.run_id}/resolve`, {
    method: 'POST',
    cookie,
    body: { action_code: await codeFor(cur.run_id, 'resolve_report'), intent_key: key('long'), rationale: 'x'.repeat(251) },
  })
  assert.equal(tooLong.status, 422)
  assert.equal(tooLong.data.error.code, 'INVALID_RATIONALE')

  const secret = 'I reported it because the code request was wrong.'
  const ok = await call(`/attempts/${attemptId}/runs/${cur.run_id}/resolve`, {
    method: 'POST',
    cookie,
    body: { action_code: await codeFor(cur.run_id, 'resolve_report'), intent_key: key('ok'), rationale: secret },
  })
  assert.equal(ok.status, 200)
  assert.ok(!JSON.stringify(ok.data).includes(secret), 'rationale must not be echoed back')
  const run = await ScenarioRun.findById(cur.run_id)
  assert.equal(run.rationale, secret, 'but it must be stored')
})

/* ------------------------------------------------------------------ *
 * 16-17  resume and commit ordering
 * ------------------------------------------------------------------ */

it('a refresh reconstructs state from the database, not from memory', async () => {
  await reset()
  const cookie = await signIn('Hotel One', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const { attempt_id: attemptId, current_run: cur } = created.data.attempt
  for (const intent of ['open_item', 'read', 'inspect_sender']) {
    await call(`/attempts/${attemptId}/runs/${cur.run_id}/events`, {
      method: 'POST', cookie, body: { action_code: await codeFor(cur.run_id, intent), intent_key: key(intent) },
    })
  }

  const resumed = await call(`/attempts/${attemptId}/current-run`, { cookie })
  assert.equal(resumed.data.run.run_id, cur.run_id)
  assert.equal(resumed.data.run.current_stage, 'branch')
  assert.equal(resumed.data.run.last_sequence, 3)
  assert.equal(resumed.data.attempt.progress.resolved, 0)
})

it('the next scenario is only exposed after the previous one commits', async () => {
  await reset()
  const cookie = await signIn('Hotel Two', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  const firstRun = created.data.attempt.current_run.run_id

  // Part-way through the scenario the current run must still be the first one.
  for (const intent of ['open_item', 'read', 'inspect_sender', 'safe_pivot']) {
    const step = await call(`/attempts/${attemptId}/runs/${firstRun}/events`, {
      method: 'POST', cookie, body: { action_code: await codeFor(firstRun, intent), intent_key: key(intent) },
    })
    assert.equal(step.status, 200, `${intent}: ${JSON.stringify(step.data)}`)
    const mid = await call(`/attempts/${attemptId}/current-run`, { cookie })
    assert.equal(mid.data.run.run_id, firstRun, `advanced early after ${intent}`)
    assert.equal(mid.data.attempt.progress.resolved, 0)
  }

  await call(`/attempts/${attemptId}/runs/${firstRun}/events`, {
    method: 'POST', cookie, body: { action_code: await codeFor(firstRun, 'verify_trusted_directory'), intent_key: key('v') },
  })
  const done = await call(`/attempts/${attemptId}/runs/${firstRun}/resolve`, {
    method: 'POST', cookie, body: { action_code: await codeFor(firstRun, 'resolve_report'), intent_key: key('res') },
  })
  assert.equal(done.status, 200, JSON.stringify(done.data))
  assert.equal(done.data.run.status, 'resolved')
  assert.equal(done.data.attempt.progress.resolved, 1, 'progress reflects the committed state')

  const next = await call(`/attempts/${attemptId}/current-run`, { cookie })
  assert.notEqual(next.data.run.run_id, firstRun)
  assert.equal(next.data.run.ordinal, 2)
  assert.equal(next.data.run.current_stage, 'notify')
})

/* ------------------------------------------------------------------ *
 * 18-22  completion and result
 * ------------------------------------------------------------------ */

it('an attempt cannot complete before all ten scenarios are resolved', async () => {
  await reset()
  const cookie = await signIn('India One', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id

  const early = await call(`/attempts/${attemptId}/complete`, { method: 'POST', cookie })
  assert.equal(early.status, 409)
  assert.equal(early.data.error.code, 'SCENARIOS_OUTSTANDING')
  assert.equal(early.data.error.details.outstanding_ordinals.length, 10)

  await resolveRunViaApi(cookie, attemptId, created.data.attempt.current_run.run_id)
  const still = await call(`/attempts/${attemptId}/complete`, { method: 'POST', cookie })
  assert.equal(still.status, 409)
  assert.equal(still.data.error.details.outstanding_ordinals.length, 9)

  const attempt = await Attempt.findById(attemptId)
  assert.equal(attempt.status, 'in_progress')
  assert.equal(attempt.total_score, null)
})

it('the result is unavailable until the attempt completes', async () => {
  await reset()
  const cookie = await signIn('India Two', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const res = await call(`/attempts/${created.data.attempt.attempt_id}/result`, { cookie })
  assert.equal(res.status, 409)
  assert.equal(res.data.error.code, 'ATTEMPT_NOT_COMPLETE')
})

it('a full ten-scenario attempt completes once and scores 100 on the safe path', async () => {
  await reset()
  const cookie = await signIn('Juliet One', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id

  await completeWholeAttempt(cookie, attemptId)

  const noRun = await call(`/attempts/${attemptId}/current-run`, { cookie })
  assert.equal(noRun.data.run, null, 'no run remains once all ten are resolved')
  assert.equal(noRun.data.attempt.progress.all_resolved, true)

  const done = await call(`/attempts/${attemptId}/complete`, { method: 'POST', cookie })
  assert.equal(done.status, 200)
  assert.equal(done.data.attempt.status, 'completed')
  assert.equal(done.data.result.total_score, 100, 'ten safe paths at 10 points each')
  assert.equal(done.data.result.max_score, 100)
  assert.equal(done.data.result.scenarios_resolved, 10)
  assert.equal(done.data.result.scenarios.length, 10)

  // Completion is idempotent, and the transition happened exactly once.
  const again = await call(`/attempts/${attemptId}/complete`, { method: 'POST', cookie })
  assert.equal(again.status, 200)
  assert.equal(again.data.attempt.status, 'completed')
  assert.equal(again.data.result.total_score, 100)
  const attempt = await Attempt.findById(attemptId)
  assert.equal(attempt.completed_at.getTime(), done.data.result.completed_at
    ? new Date(done.data.result.completed_at).getTime() : attempt.completed_at.getTime())
})

it('a completed attempt cannot be modified', async () => {
  await reset()
  const cookie = await signIn('Juliet Two', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  const runs = await ScenarioRun.find({ attempt_id: attemptId }).sort({ ordinal: 1 })
  await completeWholeAttempt(cookie, attemptId)
  await call(`/attempts/${attemptId}/complete`, { method: 'POST', cookie })

  const res = await call(`/attempts/${attemptId}/runs/${runs[0].id}/events`, {
    method: 'POST', cookie, body: { action_code: await codeFor(runs[0].id, 'open_item'), intent_key: key('post') },
  })
  assert.equal(res.status, 409)
  assert.equal(res.data.error.code, 'ATTEMPT_NOT_IN_PROGRESS')

  // A new attempt is allowed once the previous one is finished.
  const next = await call('/attempts', { method: 'POST', cookie })
  assert.equal(next.status, 201)
  assert.notEqual(next.data.attempt.attempt_id, attemptId)
})

/**
 * RESULT-001 moved this boundary, deliberately and only for a FINISHED attempt.
 *
 * Specification section 7 requires the learner to be told, per case, what the item
 * actually was and what the safe response would have been - so the scenario's authored
 * `feedback` is released, and family and trigger labels appear in the AGGREGATE
 * breakdown for the ten scenarios just completed.
 *
 * The list below is therefore narrower than it was, but nothing was merely dropped: what
 * left it is asserted as released-on-purpose here, and the far stricter check - which
 * searches for the actual server-only STRINGS of the ten definitions in play, not just
 * key names - lives in `attemptResultApi.test.js`.
 */
it('the candidate-safe result exposes no taxonomy or evaluation data', async () => {
  await reset()
  const cookie = await signIn('Kilo One', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await completeWholeAttempt(cookie, attemptId)
  await call(`/attempts/${attemptId}/complete`, { method: 'POST', cookie })

  const res = await call(`/attempts/${attemptId}/result`, { cookie })
  assert.equal(res.status, 200)
  const text = JSON.stringify(res.data)

  // Still never released: classification per scenario, evaluation internals, selection.
  for (const field of ['canonical_family', 'canonical_triggers', 'military_flag', 'disposition',
    'level', 'evaluation', 'family', 'trigger', 'seed', 'selection', 'score_running',
    'expected_actions', 'expected_safe_behavior', 'learner_flow', 'end_state',
    'points_delta', 'event_code', 'rationale']) {
    assert.ok(!text.includes(`"${field}"`), `result exposed "${field}"`)
  }

  // Released on purpose by RESULT-001 - and each is asserted, so it cannot vanish quietly.
  const scenario = res.data.result.scenarios[0]
  assert.equal(scenario.score_0_10, 10)
  assert.ok(scenario.platform)
  assert.match(scenario.scenario_ref, /^[WIES]\d{2}$/, 'the learner-visible scenario reference')
  assert.ok(scenario.feedback.result, 'section 7 per-case disposition sentence')
  assert.ok(scenario.feedback.cues.length > 0, 'section 7 observed cues')
  assert.ok(Array.isArray(scenario.path), 'section 7 path replay')
  assert.ok(res.data.result.behaviour.by_family.length > 0, 'section 7 family breakdown')
  assert.equal(res.data.result.comparison.available, false)
  assert.ok(Array.isArray(res.data.result.remediation))
})

it('a partly unsafe attempt scores below the maximum', async () => {
  await reset()
  const cookie = await signIn('Kilo Two', nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id

  // First scenario: act badly on purpose.
  const first = created.data.attempt.current_run.run_id
  for (const intent of ['open_item', 'reply', 'submit_data', 'report']) {
    await call(`/attempts/${attemptId}/runs/${first}/events`, {
      method: 'POST', cookie, body: { action_code: await codeFor(first, intent), intent_key: key(intent) },
    })
  }
  await call(`/attempts/${attemptId}/runs/${first}/resolve`, {
    method: 'POST', cookie, body: { action_code: await codeFor(first, 'resolve_ignore'), intent_key: key('bad') },
  })

  for (let i = 0; i < 9; i += 1) {
    const cur = await call(`/attempts/${attemptId}/current-run`, { cookie })
    const run = await ScenarioRun.findById(cur.data.run.run_id)
    const def = await ScenarioDefinition.findOne({
      scenario_id: run.scenario_id, version: run.definition_version,
    })
    await resolveRunViaApi(cookie, attemptId, cur.data.run.run_id,
      def.disposition === 'malicious' ? 'report' : 'continue')
  }

  const done = await call(`/attempts/${attemptId}/complete`, { method: 'POST', cookie })
  assert.equal(done.data.result.total_score, 90, 'nine perfect scenarios plus one clamped to 0')
  assert.equal(done.data.result.scenarios[0].score_0_10, 0, 'the bad run clamps to 0, never negative')
})
