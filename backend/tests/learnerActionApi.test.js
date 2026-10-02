import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'
import { createApp } from '../src/app.js'
import { ACTION_CODE_PATTERN } from '../src/constants/learnerAction.js'
import { Attempt } from '../src/models/Attempt.js'
import { Candidate } from '../src/models/Candidate.js'
import { ScenarioDefinition } from '../src/models/ScenarioDefinition.js'
import { ScenarioEvent } from '../src/models/ScenarioEvent.js'
import { ScenarioRun } from '../src/models/ScenarioRun.js'
import { classifyOutcome, pathFromEvents } from '../src/services/attemptResultService.js'
import { actionCodesForRun, controlsForScenario } from '../src/services/learnerActionService.js'
import { buildScenarioReview } from '../src/services/scenarioReviewService.js'
import {
  loadSourceScenarios,
  loadSyntheticContent,
  loadTaxonomies,
  toScenarioDefinition,
} from '../src/services/scenarioDefinitionImportService.js'
import { detectTransactionSupport } from '../src/utils/transactions.js'

/**
 * SECURITY-001 - the neutral learner action contract over real HTTP.
 *
 * Real Express app, real replica set, real signed session cookie. A learner's request
 * carries an opaque per-run action code; these tests prove the server translates it, runs
 * the unchanged engine, scores a WhatsApp and an Instagram scene exactly as before, and
 * refuses every way a code or an intent can be misused - without saying what anything means.
 *
 *   ENGINE_TEST_MONGO_URI=mongodb://127.0.0.1:27017/<isolated>?replicaSet=rs0 node --test tests/learnerActionApi.test.js
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const BASELINE = JSON.parse(readFileSync(path.join(HERE, 'fixtures/learnerActionBaseline.json'), 'utf8'))
const MAPS = Object.assign({}, ...['whatsapp', 'instagram', 'email'].map((platform) => JSON.parse(
  readFileSync(path.join(HERE, `../data/learner-actions/v1/${platform}.json`), 'utf8'),
).scenes))

/** Canonical vocabulary no learner-facing request or response may carry. */
const TOKENS = new RegExp(`\\b(${[
  'inspect_sender', 'inspect_profile', 'inspect_link', 'preview_file', 'inspect_qr',
  'read_thread', 'skip_inspection', 'safe_pivot', 'reject_ignore', 'open_link', 'open_file',
  'scan_qr', 'call_number', 'submit_data', 'attempt_payment', 'attempt_install',
  'approve_device_link', 'share_secret', 'share_location', 'verify_trusted_directory',
  'verify_known_app', 'verify_known_number', 'verify_in_message_contact', 'in_message_contact',
  'SAFE_PIVOT', 'CORRECT_USE', 'TRUSTED_VERIFY', 'RESOLVE_CORRECT', 'VERIFY_THROUGH_MESSAGE',
  'NEEDLESS_REJECT_IGNORE', 'RISKY_OPEN_REPLY', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE',
  'FALSE_REPORT_BLOCK', 'REPORT_ONLY_WITHOUT_CHECK', 'CONTRADICTORY_UNSAFE_FINAL',
  'PREMATURE_REPLY', 'INSPECT_CONTEXT', 'UNSAFE_EXTERNAL_ACTION', 'NOTIFY_SEEN', 'ITEM_OPEN',
].join('|')})\\b`)

const URI = process.env.ENGINE_TEST_MONGO_URI
let ready = false
let skipReason = 'ENGINE_TEST_MONGO_URI is not set'
let server
let base
let definitions = {}

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
      const { byScenario } = await loadSyntheticContent()
      const docs = scenarios.map((r) =>
        toScenarioDefinition(r, taxonomies, { synthetic: byScenario.get(r.scenario_id) }).doc)
      definitions = Object.fromEntries(docs.map((doc) => [doc.scenario_id, doc]))
      await ScenarioDefinition.deleteMany({})
      await ScenarioDefinition.insertMany(docs)
      await Promise.all([
        Attempt.deleteMany({}), ScenarioRun.deleteMany({}),
        ScenarioEvent.deleteMany({}), Candidate.deleteMany({}),
      ])
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
  console.warn(`\n[SECURITY-001] learner action API tests SKIPPED - ${skipReason}\n`)
}

const it = (name, fn) => test(name, { skip: ready ? false : skipReason }, fn)

test.after(async () => {
  if (ready) {
    server?.close()
    await Promise.all([
      Attempt.deleteMany({}), ScenarioRun.deleteMany({}), ScenarioEvent.deleteMany({}),
      Candidate.deleteMany({}), ScenarioDefinition.deleteMany({}),
    ])
    await mongoose.disconnect()
  }
})

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/** Every error body any test saw, checked once at the end for canonical vocabulary. */
const errorBodies = []

async function call(route, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(`${base}${route}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  if (res.status >= 400) errorBodies.push(JSON.stringify(data))
  return { status: res.status, data, cookie: res.headers.getSetCookie?.()[0]?.split(';')[0] }
}

let seq = 0
const key = (label) => `${label}-${Date.now()}-${(seq += 1)}`

async function signIn(name) {
  seq += 1
  const res = await call('/candidates', {
    method: 'POST', body: { name, identifier: `SA${String(300000 + seq)}` },
  })
  assert.equal(res.status, 201, JSON.stringify(res.data))
  return res.cookie
}

/** A new learner with a new attempt, and its ten runs from the database. */
async function freshAttempt(name) {
  const cookie = await signIn(name)
  const created = await call('/attempts', { method: 'POST', cookie })
  assert.equal(created.status, 201, JSON.stringify(created.data))
  const attemptId = created.data.attempt.attempt_id
  const runs = await ScenarioRun.find({ attempt_id: attemptId }).sort({ ordinal: 1 }).lean()
  return { cookie, attemptId, runs }
}

const postEvent = (ctx, runId, body) =>
  call(`/attempts/${ctx.attemptId}/runs/${runId}/events`, { method: 'POST', cookie: ctx.cookie, body })
const postResolve = (ctx, runId, body) =>
  call(`/attempts/${ctx.attemptId}/runs/${runId}/resolve`, { method: 'POST', cookie: ctx.cookie, body })

const genericCode = (run, stage, intent) => {
  const entry = [...controlsForScenario(run.scenario_id).values()]
    .find((c) => c.controlId.startsWith('gen-') && c.stage === stage && c.intent === intent)
  return actionCodesForRun(run)[entry.controlId]
}

/**
 * A scene route chosen from the pre-migration baseline: at each stage, the control that
 * scored highest (`best`) or lowest (`worst`) when the scene still carried its intent.
 */
function routeFor(scenarioId, pick) {
  const byStage = {}
  for (const [controlId, entry] of Object.entries(MAPS[scenarioId])) {
    const before = BASELINE.scenes[scenarioId][entry.name]
    const current = byStage[entry.stage]
    // The open stage always reads first: a premature action there skips the inspect stage.
    const better = pick === 'best' || entry.stage === 'open'
      ? !current || before.points_delta > current.before.points_delta
      : !current || before.points_delta < current.before.points_delta
    if (better) byStage[entry.stage] = { controlId, entry, before }
  }
  return ['open', 'inspect', 'branch', 'verify', 'resolve'].map((stage) => byStage[stage])
}

/** Plays a scene route over HTTP with codes only; returns what the server committed. */
async function playRoute(ctx, run, route) {
  const codes = actionCodesForRun(run)
  const responses = []
  const opened = await postEvent(ctx, run._id, {
    action_code: codes['gen-c01'], intent_key: key('open'), expected_stage: 'notify',
  })
  assert.equal(opened.status, 200, JSON.stringify(opened.data))
  responses.push(opened)
  for (const step of route) {
    const body = {
      action_code: codes[step.controlId],
      intent_key: key(step.entry.name),
      expected_stage: step.entry.stage,
      ...(step.entry.stage === 'resolve' ? { rationale: 'Checked it first.' } : {}),
    }
    const res = step.entry.stage === 'resolve'
      ? await postResolve(ctx, run._id, body)
      : await postEvent(ctx, run._id, body)
    assert.equal(res.status, 200, `${step.entry.name}: ${JSON.stringify(res.data)}`)
    responses.push(res)
  }
  const events = await ScenarioEvent.find({ run_id: run._id }).sort({ sequence: 1 }).lean()
  const stored = await ScenarioRun.findById(run._id).lean()
  return { responses, events, stored }
}

/** The review the engine's own services build from a ledger, as sceneAffordance does. */
function reviewFrom(definition, events, outcomeCode) {
  const ledger = events.map((e) => ({
    sequence: e.sequence, stage: e.stage, event_code: e.event_code, points: e.points_delta,
  }))
  const outcomeClass = classifyOutcome({
    disposition: definition.disposition,
    outcomeCode,
    eventCodes: ledger.map((e) => e.event_code),
  })
  return buildScenarioReview({
    definition, run: { outcome_code: outcomeCode }, events: ledger, outcomeClass,
    path: pathFromEvents(ledger),
  })
}

/* ------------------------------------------------------------------ *
 * What the client is given
 * ------------------------------------------------------------------ */

it('current-run issues an opaque code per control, and names no intent', async () => {
  const a = await freshAttempt('Neutral Issue A')
  const b = await freshAttempt('Neutral Issue B')

  const cur = await call(`/attempts/${a.attemptId}/current-run`, { cookie: a.cookie })
  assert.equal(cur.status, 200)
  const run = a.runs[0]
  const { actions } = cur.data
  assert.deepEqual(actions, actionCodesForRun(run))
  assert.deepEqual(Object.keys(actions), [...controlsForScenario(run.scenario_id).keys()])
  for (const [controlId, code] of Object.entries(actions)) {
    assert.match(controlId, /^(?:[wies]\d{2}|gen)-c\d{2}$/)
    assert.match(code, ACTION_CODE_PATTERN)
  }
  assert.doesNotMatch(JSON.stringify(actions), TOKENS)
  // Local navigation has no code: only scored controls are ever named.
  assert.ok(!Object.keys(actions).some((id) => /nav/.test(id)))
  // The whole payload outside the scenario content is free of scoring vocabulary.
  const { scenario, ...rest } = cur.data
  assert.doesNotMatch(JSON.stringify(rest), TOKENS)
  assert.doesNotMatch(JSON.stringify(scenario.synthetic), TOKENS)

  // A reload receives the same codes; another learner's run of anything receives others.
  const again = await call(`/attempts/${a.attemptId}/current-run`, { cookie: a.cookie })
  assert.deepEqual(again.data.actions, actions)
  const theirs = (await call(`/attempts/${b.attemptId}/current-run`, { cookie: b.cookie })).data.actions
  assert.notDeepEqual(theirs['gen-c01'], actions['gen-c01'])
})

/* ------------------------------------------------------------------ *
 * WhatsApp and Instagram, scored exactly as before
 * ------------------------------------------------------------------ */

for (const platform of ['W', 'I']) {
  for (const pick of ['best', 'worst']) {
    const label = `${platform === 'W' ? 'WhatsApp' : 'Instagram'} ${pick === 'best' ? 'safe' : 'unsafe'}`
    it(`a ${label} route resolves through codes and scores exactly as the baseline`, async () => {
      const ctx = await freshAttempt(`Neutral ${label}`)
      const run = ctx.runs.find((r) => r.scenario_id.startsWith(platform))
      assert.ok(run, `the attempt dealt no ${platform} scenario`)
      const route = routeFor(run.scenario_id, pick)
      const { responses, events, stored } = await playRoute(ctx, run, route)

      // The ledger holds exactly what the canonical-intent implementation produced.
      assert.deepEqual(
        events.map((e) => [e.stage, e.event_code, e.points_delta]),
        [
          ['notify', 'NOTIFY_SEEN', events[0].points_delta],
          ...route.map((s) => [s.before.stage, s.before.event_code, s.before.points_delta]),
        ],
      )
      assert.deepEqual(events.map((e) => e.metadata.intent),
        ['open_item', ...route.map((s) => s.entry.intent)])
      for (const e of events) {
        if (e.metadata.intent.startsWith('verify_')) {
          assert.ok(e.metadata.verify_source, `${e.metadata.intent} lost its source`)
        }
      }

      const total = events.reduce((sum, e) => sum + e.points_delta, 0)
      assert.equal(stored.status, 'resolved')
      assert.equal(stored.score_running, total)
      assert.equal(stored.score_0_10, Math.max(0, Math.min(10, total)))
      if (pick === 'best') assert.equal(stored.score_0_10, 10)
      assert.equal(stored.outcome_code, route.at(-1).entry.intent)
      assert.equal(stored.rationale, 'Checked it first.')

      // Responses carry no verdict and no vocabulary; the view is neutral.
      for (const res of responses) {
        assert.equal(res.data.event.event_code, undefined)
        assert.ok('view' in res.data)
        const { outcome_code: outcome, ...rest } = res.data
        assert.doesNotMatch(JSON.stringify(rest), TOKENS)
        if (outcome) assert.match(outcome, /^resolve_(report|block|continue|retain|ignore)$/)
      }

      // The training review built from this ledger is the one the old ledger produced.
      const definition = definitions[run.scenario_id]
      const before = reviewFrom(definition, [
        { sequence: 1, stage: 'notify', event_code: 'NOTIFY_SEEN', points_delta: events[0].points_delta },
        ...route.map((s, index) => ({
          sequence: index + 2, stage: s.before.stage, event_code: s.before.event_code,
          points_delta: s.before.points_delta,
        })),
      ], route.at(-1).entry.intent)
      assert.deepEqual(reviewFrom(definition, events, stored.outcome_code), before)
    })
  }
}

/* ------------------------------------------------------------------ *
 * Refusals
 * ------------------------------------------------------------------ */

it('an intent is refused, alone or beside a code, and nothing is written', async () => {
  const ctx = await freshAttempt('Neutral Intent')
  const run = ctx.runs[0]
  const code = genericCode(run, 'notify', 'open_item')
  for (const body of [
    { intent: 'open_item', intent_key: key('i') },
    { intent: 'open_item', action_code: code, intent_key: key('i') },
    { action_code: code, intent_key: key('i'), metadata: { intent: 'open_item' } },
    { action_code: code, intent_key: key('i'), metadata: { verify_source: 'known_app' } },
    { action_code: code, intent_key: key('i'), verify_source: 'known_app' },
  ]) {
    const res = await postEvent(ctx, run._id, body)
    assert.equal(res.status, 422, JSON.stringify(body))
    assert.equal(res.data.error.code, 'FORBIDDEN_FIELD')
  }
  const resolve = await postResolve(ctx, run._id, { intent: 'resolve_report', intent_key: key('r') })
  assert.equal(resolve.status, 422)
  assert.equal(resolve.data.error.code, 'FORBIDDEN_FIELD')
  assert.equal(await ScenarioEvent.countDocuments({ run_id: run._id }), 0)

  // Client telemetry is still accepted.
  const ok = await postEvent(ctx, run._id, {
    action_code: code, intent_key: key('ok'), metadata: { open_latency_ms: 1200 },
  })
  assert.equal(ok.status, 200, JSON.stringify(ok.data))
})

it('a missing, malformed or unknown code is refused with one neutral error', async () => {
  const ctx = await freshAttempt('Neutral Malformed')
  const run = ctx.runs[0]
  const nav = Object.keys(MAPS.W01)[0]
  for (const actionCode of [undefined, '', 'open_item', 'gen-c01', nav, 'choice_1',
    'ac_00000000000000000000', 'AC_0123456789ABCDEF0123', 42, { code: 1 }]) {
    const res = await postEvent(ctx, run._id, { action_code: actionCode, intent_key: key('m') })
    assert.equal(res.status, 422, String(actionCode))
    assert.equal(res.data.error.code, 'INVALID_ACTION')
    assert.equal(res.data.error.message, 'That action is not available here.')
  }
  assert.equal(await ScenarioEvent.countDocuments({ run_id: run._id }), 0)
})

it('a code from another run, attempt, learner or scenario is refused', async () => {
  const a = await freshAttempt('Neutral Cross A')
  const b = await freshAttempt('Neutral Cross B')
  const [first, second] = a.runs

  // Another learner's run - same generic control, same stage.
  const theirs = genericCode(b.runs[0], 'notify', 'open_item')
  let res = await postEvent(a, first._id, { action_code: theirs, intent_key: key('x') })
  assert.equal(res.status, 422)
  assert.equal(res.data.error.code, 'INVALID_ACTION')

  // Another run of the same attempt, which is always another scenario.
  assert.notEqual(first.scenario_id, second.scenario_id)
  res = await postEvent(a, first._id, {
    action_code: genericCode(second, 'notify', 'open_item'), intent_key: key('x'),
  })
  assert.equal(res.status, 422)

  // Every scene code of another scenario, on this run.
  const sceneRun = a.runs.find((r) => MAPS[r.scenario_id])
  const other = a.runs.find((r) => MAPS[r.scenario_id] && r.scenario_id !== sceneRun.scenario_id)
  for (const code of Object.values(actionCodesForRun(other))) {
    res = await postEvent(a, sceneRun._id, { action_code: code, intent_key: key('x') })
    assert.equal(res.status, 422)
  }
  assert.equal(await ScenarioEvent.countDocuments({ run_id: { $in: a.runs.map((r) => r._id) } }), 0)
})

it('a code for another stage is refused, before and after that stage', async () => {
  const ctx = await freshAttempt('Neutral Stage')
  const run = ctx.runs[0]
  const verifyCode = genericCode(run, 'verify', 'verify_trusted_directory')

  // Without an expected stage the engine's own check refuses it inside its transaction.
  let res = await postEvent(ctx, run._id, { action_code: verifyCode, intent_key: key('s') })
  assert.equal(res.status, 409)
  assert.equal(res.data.error.code, 'STALE_STATE')
  assert.equal(res.data.error.details.current_stage, 'notify')
  // A request that claims the current stage but carries another stage's code is malformed.
  res = await postEvent(ctx, run._id, {
    action_code: verifyCode, intent_key: key('s'), expected_stage: 'notify',
  })
  assert.equal(res.status, 422)
  assert.equal(res.data.error.code, 'INVALID_ACTION')
  // The resolve route refuses anything that is not a resolve-stage control.
  res = await postResolve(ctx, run._id, {
    action_code: genericCode(run, 'notify', 'open_item'), intent_key: key('s'),
  })
  assert.equal(res.status, 422)
  assert.equal(res.data.error.code, 'INVALID_ACTION')
  assert.equal(await ScenarioEvent.countDocuments({ run_id: run._id }), 0)

  // Once the notify stage has passed, its code is spent.
  const open = genericCode(run, 'notify', 'open_item')
  assert.equal((await postEvent(ctx, run._id, { action_code: open, intent_key: key('o') })).status, 200)
  res = await postEvent(ctx, run._id, { action_code: open, intent_key: key('again') })
  assert.equal(res.status, 409)
  assert.equal(res.data.error.code, 'STALE_STATE')
  assert.equal(await ScenarioEvent.countDocuments({ run_id: run._id }), 1)
})

it('a duplicate retry still replays, and a stale view still gets 409', async () => {
  const ctx = await freshAttempt('Neutral Retry')
  const run = ctx.runs[0]
  await postEvent(ctx, run._id, { action_code: genericCode(run, 'notify', 'open_item'), intent_key: key('o') })
  await postEvent(ctx, run._id, { action_code: genericCode(run, 'open', 'read'), intent_key: key('r') })

  const inspect = genericCode(run, 'inspect', 'inspect_sender')
  const k = key('inspect-once')
  const first = await postEvent(ctx, run._id, { action_code: inspect, intent_key: k, expected_stage: 'inspect' })
  assert.equal(first.status, 200)
  assert.equal(first.data.view, 'sender')
  // The response was "lost"; the client resends the identical request after the stage moved.
  const again = await postEvent(ctx, run._id, { action_code: inspect, intent_key: k, expected_stage: 'inspect' })
  assert.equal(again.status, 200)
  assert.equal(again.data.duplicate, true)
  assert.equal(again.data.event.sequence, first.data.event.sequence)
  assert.equal(again.data.event.event_code, undefined)
  assert.equal(again.data.view, 'sender')
  assert.equal(await ScenarioEvent.countDocuments({ run_id: run._id }), 3)
  assert.equal((await ScenarioRun.findById(run._id)).score_running,
    (await ScenarioEvent.find({ run_id: run._id })).reduce((s, e) => s + e.points_delta, 0))

  // A second tab still showing the inspect stage sends a different action: stale.
  const stale = await postEvent(ctx, run._id, {
    action_code: genericCode(run, 'inspect', 'read_thread'), intent_key: key('tab2'), expected_stage: 'inspect',
  })
  assert.equal(stale.status, 409)
  assert.equal(stale.data.error.code, 'STALE_STATE')
  assert.equal(stale.data.error.details.current_stage, 'branch')
  assert.equal(await ScenarioEvent.countDocuments({ run_id: run._id }), 3)

  // The ledger kept the server-derived intent; the client never sent it.
  const stored = await ScenarioEvent.findOne({ run_id: run._id, sequence: 3 })
  assert.equal(stored.metadata.intent, 'inspect_sender')
})

it('a resolved run spends every code', async () => {
  const ctx = await freshAttempt('Neutral Spent')
  const run = ctx.runs[0]
  const steps = [
    ['notify', 'open_item'], ['open', 'read'], ['inspect', 'inspect_sender'],
    ['branch', 'safe_pivot'], ['verify', 'verify_trusted_directory'],
  ]
  for (const [stage, intent] of steps) {
    const res = await postEvent(ctx, run._id, { action_code: genericCode(run, stage, intent), intent_key: key(intent) })
    assert.equal(res.status, 200, `${intent}: ${JSON.stringify(res.data)}`)
    if (intent === 'verify_trusted_directory') assert.equal(res.data.view, 'directory')
  }
  const done = await postResolve(ctx, run._id, {
    action_code: genericCode(run, 'resolve', 'resolve_report'), intent_key: key('res'),
  })
  assert.equal(done.status, 200, JSON.stringify(done.data))
  const verifyEvent = await ScenarioEvent.findOne({ run_id: run._id, sequence: 5 })
  assert.equal(verifyEvent.metadata.verify_source, 'trusted_directory')

  for (const code of Object.values(actionCodesForRun(run))) {
    const res = await postEvent(ctx, run._id, { action_code: code, intent_key: key('late') })
    assert.equal(res.status, 409)
    assert.ok(['RUN_NOT_ACTIVE', 'STALE_STATE'].includes(res.data.error.code), res.data.error.code)
  }
  assert.equal(await ScenarioEvent.countDocuments({ run_id: run._id }), 6)
})

it('no refusal in this suite named an intent or an event code', () => {
  assert.ok(errorBodies.length > 20, 'the suite should have collected refusals')
  for (const body of errorBodies) assert.doesNotMatch(body, TOKENS)
})
