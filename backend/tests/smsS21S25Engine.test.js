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
import {
  getRunState,
  recomputeScoreFromEvents,
  resumeScenarioRun,
  startScenarioRun,
  submitIntent,
  verifyRunIntegrity,
} from '../src/services/scenarioEngineService.js'
import {
  actionCodeFor,
  actionCodesForRun,
  controlsForScenario,
  translateActionCode,
} from '../src/services/learnerActionService.js'
import {
  loadSourceScenarios,
  loadSyntheticContent,
  loadTaxonomies,
  toScenarioDefinition,
} from '../src/services/scenarioDefinitionImportService.js'
import { detectTransactionSupport } from '../src/utils/transactions.js'

/**
 * IMMERSIVE-014 - SMS S21-S25 through the REAL engine, a REAL MongoDB transaction and the REAL
 * attempt API.
 *
 * Part one does exactly what the attempt controller does with a learner's request: an opaque
 * per-run action code, translated by the server map into the stage and intent for that neutral
 * control, handed to `submitIntent` with that stage as the expected stage. Nothing here passes an
 * intent a scene could have chosen.
 *
 * Part two goes over HTTP with a signed session cookie against the Express app, and tries every way
 * a learner could tamper with an S21-S25 run: a canonical intent in the body or in metadata, a point
 * value, an unknown metadata key, a code from another run, a code for another stage, a stale view
 * a retried request, a malformed code and a replay after the run has finished.
 *
 * Requires an ISOLATED replica-set database and SKIPS loudly without one:
 *
 *   ENGINE_TEST_MONGO_URI=mongodb://127.0.0.1:27017/<isolated_db>?replicaSet=rs0 node --test ...
 *
 * It refuses the production database name outright.
 */

const URI = process.env.ENGINE_TEST_MONGO_URI
const ATTEMPT = new mongoose.Types.ObjectId('000000000000000000140121')
const IDS = ['S21', 'S22', 'S23', 'S24', 'S25']

let ready = false
let skipReason = 'ENGINE_TEST_MONGO_URI is not set'
let server
let base

if (URI && /cyber_awareness_training(\?|$)/.test(URI)) {
  skipReason = 'refusing to run against the production database name'
} else if (URI) {
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
      // The whole bank: the attempt API selects ten scenarios from it.
      await ScenarioDefinition.deleteMany({})
      await ScenarioDefinition.insertMany(
        scenarios.map((r) => toScenarioDefinition(r, taxonomies, { synthetic: byScenario.get(r.scenario_id) }).doc),
      )
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
    skipReason = `could not connect: ${error.message.split('\n')[0]}`
  }
}

if (!ready) console.warn(`\n[IMMERSIVE-014] S21-S25 engine tests SKIPPED - ${skipReason}\n`)

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
 * Part one - the engine, exactly as the controller calls it
 * ------------------------------------------------------------------ */

let ordinal = 0
let keyCounter = 0
const key = (label) => `s21s25-${label}-${(keyCounter += 1)}`

/** The server map's authoring names, read from the file (the service keeps only stage/intent). */
const SMS_MAP = JSON.parse(readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '../data/learner-actions/v1/sms.json'), 'utf8',
)).scenes

/** The neutral control id whose server-map authoring name is `name`. */
function controlId(scenarioId, name) {
  for (const [id, entry] of Object.entries(SMS_MAP[scenarioId])) {
    if (entry.name === name) {
      assert.ok(controlsForScenario(scenarioId).has(id), `${id} is not loaded by the server`)
      return id
    }
  }
  throw new Error(`${scenarioId} has no control named ${name}`)
}

async function newRun(scenarioId) {
  ordinal += 1
  return startScenarioRun({ attemptId: ATTEMPT, ordinal, scenarioId, version: 1 })
}

const codeFor = (run, id) => actionCodeFor({
  runId: String(run._id ?? run.id), scenarioId: run.scenario_id, version: run.definition_version ?? 1, controlId: id,
})

/** Exactly the controller's path: code -> translate -> submitIntent(expectedStage = code's stage). */
async function send(run, id, intentKey = key('step')) {
  const doc = await ScenarioRun.findById(run._id ?? run.id).lean()
  const action = translateActionCode({ run: doc, actionCode: codeFor(doc, id) })
  return submitIntent({
    runId: doc._id,
    intent: action.intent,
    intentKey,
    expectedStage: action.stage,
    metadata: action.verifySource ? { verify_source: action.verifySource } : undefined,
  })
}

async function play(scenarioId, names) {
  const run = await newRun(scenarioId)
  await send(run, 'gen-c01')
  for (const name of names) await send(run, controlId(scenarioId, name))
  const state = await getRunState(run._id ?? run.id)
  return { run, state }
}

const refusedWith = async (promise, code) => {
  await assert.rejects(promise, (error) => {
    assert.equal(error.code, code)
    return true
  })
}

const ROUTES = [
  // [scenario, route, expected score]
  // S21 is the legitimate control: keeping DEV-204 is the 10; opening the Spam text's address costs
  // 7; ending the session costs 5; reporting the portal's alerts header floors the run at 0.
  ['S21', ['s21-open-read', 's21-inspect-message', 's21-branch-keep', 's21-verify-history', 's21-resolve-retain'], 10],
  ['S21', ['s21-open-read', 's21-inspect-sender', 's21-branch-keep', 's21-verify-meera', 's21-resolve-continue'], 10],
  ['S21', ['s21-open-read', 's21-inspect-message', 's21-branch-spamlink', 's21-verify-history', 's21-resolve-retain'], 3],
  ['S21', ['s21-open-read', 's21-inspect-message', 's21-branch-end', 's21-verify-history', 's21-resolve-retain'], 5],
  ['S21', ['s21-open-read', 's21-inspect-sender', 's21-branch-keep', 's21-verify-report', 's21-resolve-report'], 0],
  ['S22', ['s22-open-read', 's22-inspect-link', 's22-branch-close', 's22-verify-duty', 's22-resolve-report'], 10],
  ['S22', ['s22-open-read', 's22-inspect-sender', 's22-branch-voicemail', 's22-verify-mail', 's22-resolve-block'], 10],
  ['S22', ['s22-open-read', 's22-inspect-link', 's22-branch-callback', 's22-verify-duty', 's22-resolve-report'], 4],
  ['S22', ['s22-open-read', 's22-inspect-sender', 's22-branch-signin', 's22-verify-mail', 's22-resolve-report'], 0],
  ['S23', ['s23-open-read', 's23-inspect-card', 's23-branch-decline', 's23-verify-shop', 's23-resolve-report'], 10],
  ['S23', ['s23-open-read', 's23-inspect-card', 's23-branch-reply', 's23-verify-shop', 's23-resolve-report'], 4],
  ['S23', ['s23-open-read', 's23-inspect-sender', 's23-branch-pay', 's23-verify-trainpay', 's23-resolve-block'], 0],
  ['S24', ['s24-open-read', 's24-inspect-sender', 's24-branch-keep', 's24-verify-legal', 's24-resolve-report'], 10],
  ['S24', ['s24-open-read', 's24-inspect-sender', 's24-branch-officer', 's24-verify-legal', 's24-resolve-report'], 4],
  ['S24', ['s24-open-read', 's24-inspect-link', 's24-branch-fee', 's24-verify-portal', 's24-resolve-report'], 0],
  ['S24', ['s24-open-read', 's24-inspect-sender', 's24-branch-upload', 's24-verify-legal', 's24-resolve-block'], 0],
  ['S25', ['s25-open-read', 's25-inspect-file', 's25-branch-delete', 's25-verify-issuer', 's25-resolve-report'], 10],
  ['S25', ['s25-open-read', 's25-inspect-file', 's25-branch-link', 's25-verify-issuer', 's25-resolve-report'], 4],
  ['S25', ['s25-open-read', 's25-inspect-sender', 's25-branch-install', 's25-verify-support', 's25-resolve-report'], 0],
]

it('plays every S21-S25 safe and unsafe route through six committed stages with the pinned score', async () => {
  for (const [scenarioId, route, expected] of ROUTES) {
    const { run, state } = await play(scenarioId, route)
    const id = run._id ?? run.id
    assert.equal(state.status, 'resolved', `${scenarioId} ${route[2]}`)
    const events = await ScenarioEvent.find({ run_id: id }).sort({ sequence: 1 }).lean()
    assert.deepEqual(events.map((e) => e.stage), ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve'])
    const recomputed = await recomputeScoreFromEvents(id)
    assert.equal(recomputed.score_0_10, expected, `${scenarioId} ${route[2]}`)
    assert.equal(state.score_0_10, expected, `${scenarioId} ${route[2]} cached score`)
    const integrity = await verifyRunIntegrity(id)
    assert.equal(integrity.score_matches, true, `${scenarioId} integrity`)
    assert.equal(integrity.sequence_contiguous, true, `${scenarioId} sequence`)
    // The ledger never stores an action code or a scene control id.
    const serialised = JSON.stringify(events.map(({ intent_key: _key, ...rest }) => rest))
    assert.doesNotMatch(serialised, /ac_[0-9a-f]{20}|s2[1-5]-c\d{2}/)
  }
})

it('scores a premature act from the list, and moves straight to the branch', async () => {
  for (const [scenarioId, name] of [['S21', 's21-open-call'], ['S22', 's22-open-link'], ['S23', 's23-open-quickreply'], ['S24', 's24-open-call'], ['S25', 's25-open-install']]) {
    const run = await newRun(scenarioId)
    await send(run, 'gen-c01')
    const result = await send(run, controlId(scenarioId, name))
    assert.equal(result.event.event_code, 'PREMATURE_REPLY', scenarioId)
    assert.equal((await getRunState(run._id ?? run.id)).current_stage, 'branch', scenarioId)
  }
})

it('never lets a control id, an action code or authored text reach the ledger on the release routes', async () => {
  for (const [scenarioId, route] of [
    ['S21', ['s21-open-read', 's21-inspect-message', 's21-branch-spamlink', 's21-verify-history', 's21-resolve-retain']],
    ['S22', ['s22-open-read', 's22-inspect-link', 's22-branch-signin', 's22-verify-duty', 's22-resolve-report']],
    ['S23', ['s23-open-read', 's23-inspect-card', 's23-branch-pay', 's23-verify-shop', 's23-resolve-report']],
    ['S24', ['s24-open-read', 's24-inspect-link', 's24-branch-upload', 's24-verify-legal', 's24-resolve-report']],
    ['S25', ['s25-open-read', 's25-inspect-file', 's25-branch-install', 's25-verify-issuer', 's25-resolve-report']],
  ]) {
    const { run } = await play(scenarioId, route)
    const events = await ScenarioEvent.find({ run_id: run._id ?? run.id }).lean()
    const serialised = JSON.stringify(events)
    for (const value of ['DEV-204', 'tp-verify', 'Hunter2Falcon', '46120', 'skrefund', '2,499', 'CC/2026/0417', 'passbook', 'TollTag', '.apk']) {
      assert.ok(!serialised.includes(value), `${scenarioId} ledger holds ${value}`)
    }
    assert.doesNotMatch(serialised, /ac_[0-9a-f]{20}/)
  }
})

it('refuses a stale view: a control prepared for an earlier stage after the run moved on', async () => {
  const run = await newRun('S23')
  await send(run, 'gen-c01')
  await send(run, controlId('S23', 's23-open-read'))
  await refusedWith(send(run, controlId('S23', 's23-open-quickreply')), 'STALE_STATE')
  const state = await getRunState(run._id ?? run.id)
  assert.equal(state.current_stage, 'inspect')
  assert.equal(state.last_sequence, 2)
})

it('refuses a control used at the wrong stage without scoring it', async () => {
  const run = await newRun('S24')
  await send(run, 'gen-c01')
  await send(run, controlId('S24', 's24-open-read'))
  await send(run, controlId('S24', 's24-inspect-sender'))
  await refusedWith(send(run, controlId('S24', 's24-verify-legal')), 'STALE_STATE')
  await refusedWith(send(run, controlId('S24', 's24-resolve-report')), 'STALE_STATE')
  const state = await getRunState(run._id ?? run.id)
  assert.equal(state.current_stage, 'branch')
  assert.equal(state.last_sequence, 3)
})

it('refuses a code issued for another run, or for another scenario, as the same neutral 422', async () => {
  const mine = await ScenarioRun.findById((await newRun('S22'))._id).lean()
  const theirs = await ScenarioRun.findById((await newRun('S22'))._id).lean()
  const other = await ScenarioRun.findById((await newRun('S23'))._id).lean()
  const id = controlId('S22', 's22-branch-close')
  const refused = (fn) => assert.throws(fn, (error) => {
    assert.equal(error.code, 'INVALID_ACTION')
    assert.equal(error.status, 422)
    assert.equal(error.message, 'That action is not available here.')
    return true
  })
  refused(() => translateActionCode({ run: mine, actionCode: codeFor(theirs, id) }))
  refused(() => translateActionCode({ run: mine, actionCode: codeFor(other, controlId('S23', 's23-branch-decline')) }))
  refused(() => translateActionCode({ run: mine, actionCode: 'ac_00000000000000000000' }))
  refused(() => translateActionCode({ run: mine, actionCode: 'safe_pivot' }))
  refused(() => translateActionCode({ run: mine, actionCode: 's22-c07' }))
  assert.equal(translateActionCode({ run: mine, actionCode: codeFor(mine, id) }).stage, 'branch')
})

it('replays a retried request with the same key instead of scoring it twice', async () => {
  const run = await newRun('S21')
  await send(run, 'gen-c01')
  await send(run, controlId('S21', 's21-open-read'))
  await send(run, controlId('S21', 's21-inspect-sender'))
  const retryKey = key('retry')
  const first = await send(run, controlId('S21', 's21-branch-keep'), retryKey)
  const second = await send(run, controlId('S21', 's21-branch-keep'), retryKey)
  assert.equal(second.duplicate, true)
  assert.equal(second.event.sequence, first.event.sequence)
  assert.equal(second.run.last_sequence, 4)
  const events = await ScenarioEvent.find({ run_id: run._id ?? run.id }).lean()
  assert.equal(events.filter((e) => e.stage === 'branch').length, 1)
})

it('rebuilds a run mid-scenario after a reload from the ledger alone', async () => {
  const run = await newRun('S25')
  await send(run, 'gen-c01')
  await send(run, controlId('S25', 's25-open-read'))
  await send(run, controlId('S25', 's25-inspect-file'))
  const id = run._id ?? run.id
  const before = await getRunState(id)
  const resumed = await resumeScenarioRun(id)
  const after = await getRunState(id)
  assert.equal(before.current_stage, 'branch')
  assert.equal(after.current_stage, 'branch')
  assert.equal(after.last_sequence, before.last_sequence)
  assert.equal(resumed.current_stage, 'branch')
  await send(run, controlId('S25', 's25-branch-delete'))
  assert.equal((await getRunState(id)).current_stage, 'verify')
})

/* ------------------------------------------------------------------ *
 * Part two - the attempt API, with a real session cookie
 * ------------------------------------------------------------------ */

/**
 * Canonical vocabulary no learner-facing request or response may carry. The five resolve_* names
 * are left out on purpose: SECURITY-001 returns the learner's OWN final act once a run is
 * terminal, and nothing else.
 */
const TOKENS = new RegExp(`\\b(${[
  'open_item', 'inspect_sender', 'read_thread', 'inspect_link', 'skip_inspection', 'safe_pivot',
  'reject_ignore', 'call_number', 'submit_data', 'attempt_payment', 'attempt_install',
  'share_secret', 'share_location', 'verify_trusted_directory', 'verify_known_app',
  'verify_known_number', 'verify_in_message_contact', 'in_message_contact', 'known_app',
  'known_number', 'SAFE_PIVOT', 'CORRECT_USE', 'TRUSTED_VERIFY', 'RESOLVE_CORRECT',
  'VERIFY_THROUGH_MESSAGE', 'NEEDLESS_REJECT_IGNORE', 'RISKY_OPEN_REPLY',
  'SECRET_PAYMENT_INSTALL_DATA_RELEASE', 'FALSE_REPORT_BLOCK', 'REPORT_ONLY_WITHOUT_CHECK',
  'CONTRADICTORY_UNSAFE_FINAL', 'PREMATURE_REPLY', 'INSPECT_CONTEXT', 'UNSAFE_EXTERNAL_ACTION',
  'NOTIFY_SEEN', 'ITEM_OPEN',
].join('|')})\\b`)

const responses = []

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
  /**
   * `scenario.stages` is the bank's generic stage description (the same transition labels for all
   * one hundred scenarios, per SECURITY-001 outside this batch's scope); everything else a learner
   * is sent is checked.
   */
  const { scenario, ...rest } = data ?? {}
  responses.push({ status: res.status, body: JSON.stringify({ ...rest, synthetic: scenario?.synthetic ?? null }) })
  return { status: res.status, data, cookie: res.headers.getSetCookie?.()[0]?.split(';')[0] }
}

let seq = 0
const hkey = (label) => `imm014-${label}-${Date.now()}-${(seq += 1)}`

/**
 * A learner, an attempt, and its first five runs pointed at S21-S25 in this ISOLATED database.
 * Selection is random and the frozen sequence is not consulted by the event routes, so the test
 * retargets the runs directly rather than relying on the dice.
 */
async function attemptOnBatch(name) {
  seq += 1
  const signIn = await call('/candidates', { method: 'POST', body: { name, identifier: `SA${String(414000 + seq)}` } })
  assert.equal(signIn.status, 201, JSON.stringify(signIn.data))
  const cookie = signIn.cookie
  const created = await call('/attempts', { method: 'POST', cookie })
  assert.equal(created.status, 201, JSON.stringify(created.data))
  const attemptId = created.data.attempt.attempt_id
  const runs = await ScenarioRun.find({ attempt_id: attemptId }).sort({ ordinal: 1 }).lean()
  for (const [index, scenarioId] of IDS.entries()) {
    await ScenarioRun.collection.updateOne(
      { _id: runs[index]._id }, { $set: { scenario_id: scenarioId, platform: 'sms', definition_version: 1 } },
    )
  }
  const retargeted = await ScenarioRun.find({ attempt_id: attemptId }).sort({ ordinal: 1 }).lean()
  return { cookie, attemptId, runs: retargeted }
}

const postEvent = (ctx, runId, body) =>
  call(`/attempts/${ctx.attemptId}/runs/${runId}/events`, { method: 'POST', cookie: ctx.cookie, body })
const postResolve = (ctx, runId, body) =>
  call(`/attempts/${ctx.attemptId}/runs/${runId}/resolve`, { method: 'POST', cookie: ctx.cookie, body })

const SAFE = {
  S21: ['s21-open-read', 's21-inspect-message', 's21-branch-keep', 's21-verify-history', 's21-resolve-retain'],
  S22: ['s22-open-read', 's22-inspect-link', 's22-branch-close', 's22-verify-duty', 's22-resolve-report'],
  S23: ['s23-open-read', 's23-inspect-card', 's23-branch-decline', 's23-verify-shop', 's23-resolve-report'],
  S24: ['s24-open-read', 's24-inspect-sender', 's24-branch-keep', 's24-verify-legal', 's24-resolve-report'],
  S25: ['s25-open-read', 's25-inspect-file', 's25-branch-delete', 's25-verify-issuer', 's25-resolve-report'],
}

async function playOverHttp(ctx, run, names) {
  const codes = actionCodesForRun(run)
  const opened = await postEvent(ctx, run._id, { action_code: codes['gen-c01'], intent_key: hkey('open'), expected_stage: 'notify' })
  assert.equal(opened.status, 200, JSON.stringify(opened.data))
  for (const name of names) {
    const id = controlId(run.scenario_id, name)
    const stage = SMS_MAP[run.scenario_id][id].stage
    const body = {
      action_code: codes[id], intent_key: hkey(name), expected_stage: stage,
      ...(stage === 'resolve' ? { rationale: 'Checked it in the app first.' } : {}),
    }
    const res = stage === 'resolve' ? await postResolve(ctx, run._id, body) : await postEvent(ctx, run._id, body)
    assert.equal(res.status, 200, `${name}: ${JSON.stringify(res.data)}`)
    assert.doesNotMatch(JSON.stringify(res.data), TOKENS, name)
  }
}

it('current-run hands S21-S25 their own neutral codes and nothing that says what they mean', async () => {
  const ctx = await attemptOnBatch('Imm014 Codes')
  const cur = await call(`/attempts/${ctx.attemptId}/current-run`, { cookie: ctx.cookie })
  assert.equal(cur.status, 200)
  assert.equal(cur.data.scenario.scenario_id, 'S21')
  const { actions } = cur.data
  assert.deepEqual(actions, actionCodesForRun(ctx.runs[0]))
  const sceneIds = Object.keys(actions).filter((id) => id.startsWith('s21-'))
  assert.equal(sceneIds.length, Object.keys(SMS_MAP.S21).length)
  for (const [id, code] of Object.entries(actions)) {
    assert.match(id, /^(?:s21|gen)-c\d{2}$/)
    assert.match(code, ACTION_CODE_PATTERN)
  }
  const { scenario, ...rest } = cur.data
  assert.doesNotMatch(JSON.stringify(rest), TOKENS)
  assert.doesNotMatch(JSON.stringify(scenario.synthetic), TOKENS)
  assert.doesNotMatch(JSON.stringify(cur.data), /evaluation|expected_safe_behavior|scoring_event|disposition|canonical_family/)
})

it('plays all five safe routes over HTTP to ten, and stores only what the engine committed', async () => {
  const ctx = await attemptOnBatch('Imm014 Safe')
  for (const [index, id] of IDS.entries()) {
    const run = ctx.runs[index]
    assert.equal(run.scenario_id, id)
    await playOverHttp(ctx, run, SAFE[id])
    const state = await getRunState(run._id)
    assert.equal(state.status, 'resolved', id)
    assert.equal(state.score_0_10, 10, id)
    const events = await ScenarioEvent.find({ run_id: run._id }).sort({ sequence: 1 }).lean()
    assert.deepEqual(events.map((e) => e.stage), ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve'], id)
    assert.doesNotMatch(JSON.stringify(events.map(({ intent_key: _k, ...rest }) => rest)), /ac_[0-9a-f]{20}|s2[1-5]-c\d{2}/)
  }
})

it('refuses an injected intent, point value, verification source or metadata key, and writes nothing', async () => {
  const ctx = await attemptOnBatch('Imm014 Inject')
  const run = ctx.runs[0]
  const codes = actionCodesForRun(run)
  const open = codes['gen-c01']
  const forbidden = [
    { intent: 'open_item', intent_key: hkey('i') },
    { intent: 'safe_pivot', action_code: open, intent_key: hkey('i') },
    { action_code: open, intent_key: hkey('i'), points_delta: 10 },
    { action_code: open, intent_key: hkey('i'), points: 10 },
    { action_code: open, intent_key: hkey('i'), score: 10 },
    { action_code: open, intent_key: hkey('i'), event_code: 'SAFE_PIVOT' },
    { action_code: open, intent_key: hkey('i'), next_stage: 'resolve' },
    { action_code: open, intent_key: hkey('i'), verify_source: 'known_app' },
    { action_code: open, intent_key: hkey('i'), disposition: 'legitimate' },
  ]
  for (const body of forbidden) {
    const res = await postEvent(ctx, run._id, body)
    assert.equal(res.status, 422, JSON.stringify(body))
    assert.equal(res.data.error.code, 'FORBIDDEN_FIELD', JSON.stringify(body))
  }
  for (const metadata of [
    { intent: 'safe_pivot' }, { points_delta: 10 }, { verify_source: 'known_app' },
    { transition: 'safe_action' }, { resolution_code: 'resolve_report' }, { typed: 'Hunter2Falcon' },
  ]) {
    const res = await postEvent(ctx, run._id, { action_code: open, intent_key: hkey('m'), metadata })
    assert.equal(res.status, 422, JSON.stringify(metadata))
    assert.ok(['FORBIDDEN_FIELD', 'INVALID_METADATA'].includes(res.data.error.code), res.data.error.code)
  }
  assert.equal(await ScenarioEvent.countDocuments({ run_id: run._id }), 0)
  // The legitimate telemetry keys are still accepted, and carry no score.
  const ok = await postEvent(ctx, run._id, { action_code: open, intent_key: hkey('ok'), metadata: { open_latency_ms: 900 } })
  assert.equal(ok.status, 200, JSON.stringify(ok.data))
  assert.equal(await ScenarioEvent.countDocuments({ run_id: run._id }), 1)
})

it('refuses a code from another S21-S25 run, another learner, or a canonical name', async () => {
  const a = await attemptOnBatch('Imm014 Cross A')
  const b = await attemptOnBatch('Imm014 Cross B')
  const [s16, s17] = a.runs
  assert.equal(s16.scenario_id, 'S21')
  await postEvent(a, s16._id, { action_code: actionCodesForRun(s16)['gen-c01'], intent_key: hkey('o'), expected_stage: 'notify' })
  for (const actionCode of [
    ...Object.values(actionCodesForRun(s17)),
    ...Object.values(actionCodesForRun(b.runs[0])),
    'safe_pivot', 's21-c06', 'SAFE_PIVOT', 'ac_00000000000000000000', 'ac_XYZ', '', 42,
  ]) {
    const res = await postEvent(a, s16._id, { action_code: actionCode, intent_key: hkey('cross') })
    assert.ok([422, 409].includes(res.status), `${actionCode}: ${res.status}`)
    if (res.status === 422) assert.equal(res.data.error.code, 'INVALID_ACTION')
    assert.doesNotMatch(JSON.stringify(res.data), TOKENS)
  }
  // Nothing beyond what the learner legitimately did was written.
  assert.equal(await ScenarioEvent.countDocuments({ run_id: s16._id }), 1)
  assert.equal(await ScenarioEvent.countDocuments({ run_id: s17._id }), 0)
})

it('refuses a wrong-stage code and a stale view, and replays a duplicate without rescoring', async () => {
  const ctx = await attemptOnBatch('Imm014 Stage')
  const run = ctx.runs[0]
  const codes = actionCodesForRun(run)
  const c = (name) => codes[controlId('S21', name)]

  // A branch code at the notify stage: the engine refuses it inside its transaction.
  let res = await postEvent(ctx, run._id, { action_code: c('s21-branch-keep'), intent_key: hkey('w') })
  assert.equal(res.status, 409)
  assert.equal(res.data.error.code, 'STALE_STATE')
  // A request that claims one stage but carries another stage's code is malformed.
  res = await postEvent(ctx, run._id, { action_code: c('s21-branch-keep'), intent_key: hkey('w'), expected_stage: 'notify' })
  assert.equal(res.status, 422)
  assert.equal(res.data.error.code, 'INVALID_ACTION')
  // The resolve route refuses a branch code.
  res = await postResolve(ctx, run._id, { action_code: c('s21-branch-keep'), intent_key: hkey('w') })
  assert.equal(res.status, 422)
  assert.equal(await ScenarioEvent.countDocuments({ run_id: run._id }), 0)

  await postEvent(ctx, run._id, { action_code: codes['gen-c01'], intent_key: hkey('o'), expected_stage: 'notify' })
  await postEvent(ctx, run._id, { action_code: c('s21-open-read'), intent_key: hkey('r'), expected_stage: 'open' })
  const k = hkey('inspect-once')
  const first = await postEvent(ctx, run._id, { action_code: c('s21-inspect-sender'), intent_key: k, expected_stage: 'inspect' })
  assert.equal(first.status, 200)
  const again = await postEvent(ctx, run._id, { action_code: c('s21-inspect-sender'), intent_key: k, expected_stage: 'inspect' })
  assert.equal(again.status, 200)
  assert.equal(again.data.duplicate, true)
  assert.equal(again.data.event.sequence, first.data.event.sequence)
  assert.equal(await ScenarioEvent.countDocuments({ run_id: run._id }), 3)
  // A second tab still showing inspect sends a different control: stale.
  const stale = await postEvent(ctx, run._id, { action_code: c('s21-inspect-message'), intent_key: hkey('tab2'), expected_stage: 'inspect' })
  assert.equal(stale.status, 409)
  assert.equal(stale.data.error.code, 'STALE_STATE')
  assert.equal(stale.data.error.details.current_stage, 'branch')
  const stored = await ScenarioRun.findById(run._id).lean()
  assert.equal(stored.score_running,
    (await ScenarioEvent.find({ run_id: run._id })).reduce((s, e) => s + e.points_delta, 0))
})

it('refuses malformed action requests as the same neutral 422, and writes nothing', async () => {
  const ctx = await attemptOnBatch('Imm014 Malformed')
  const run = ctx.runs[1]
  assert.equal(run.scenario_id, 'S22')
  for (const body of [
    {}, { intent_key: hkey('x') }, { action_code: null, intent_key: hkey('x') },
    { action_code: ['ac_00000000000000000000'], intent_key: hkey('x') },
    { action_code: { $ne: null }, intent_key: hkey('x') },
    { action_code: 'AC_' + '0'.repeat(20), intent_key: hkey('x') },
    { action_code: actionCodesForRun(run)['gen-c01'] + ' ', intent_key: hkey('x') },
  ]) {
    const res = await postEvent(ctx, run._id, body)
    assert.equal(res.status, 422, JSON.stringify(body))
    assert.doesNotMatch(JSON.stringify(res.data), TOKENS)
  }
  assert.equal(await ScenarioEvent.countDocuments({ run_id: run._id }), 0)
})

it('replays a finished run’s last request without rescoring, and refuses anything new', async () => {
  const ctx = await attemptOnBatch('Imm014 Replay')
  const run = ctx.runs[2]
  assert.equal(run.scenario_id, 'S23')
  const codes = actionCodesForRun(run)
  const c = (name) => codes[controlId('S23', name)]
  await playOverHttp(ctx, run, SAFE.S23.slice(0, 4))
  const lastKey = hkey('resolve-once')
  const done = await postResolve(ctx, run._id, { action_code: c('s23-resolve-report'), intent_key: lastKey, expected_stage: 'resolve' })
  assert.equal(done.status, 200, JSON.stringify(done.data))
  const before = await ScenarioEvent.countDocuments({ run_id: run._id })
  const scored = (await getRunState(run._id)).score_0_10
  assert.equal(scored, 10)
  // The same request again (a lost response) is replayed, not rescored.
  const again = await postResolve(ctx, run._id, { action_code: c('s23-resolve-report'), intent_key: lastKey, expected_stage: 'resolve' })
  assert.ok([200, 409].includes(again.status), String(again.status))
  if (again.status === 200) assert.equal(again.data.duplicate, true)
  // A new request on the finished run - any code, any stage - is refused.
  for (const [name, route] of [['s23-resolve-continue', postResolve], ['s23-branch-pay', postEvent], ['s23-verify-shop', postEvent]]) {
    const res = await route(ctx, run._id, { action_code: c(name), intent_key: hkey('late') })
    assert.ok([409, 422].includes(res.status), name + ' ' + res.status)
    assert.doesNotMatch(JSON.stringify(res.data), TOKENS)
  }
  assert.equal(await ScenarioEvent.countDocuments({ run_id: run._id }), before)
  assert.equal((await getRunState(run._id)).score_0_10, scored)
})

it('never answered any S21-S25 request with canonical vocabulary', () => {
  assert.ok(responses.length > 20)
  for (const { status, body } of responses) {
    assert.doesNotMatch(body, TOKENS)
    // A refusal may name the field the client itself sent; an accepted response never carries a
    // point value or an event code.
    if (status < 400) {
      assert.doesNotMatch(body, /"(points_delta|score_running|event_code)"/)
      // The run's own score appears once the run is terminal (`final`), and never before it.
      if (/"score_0_10":-?\d/.test(body)) assert.match(body, /"score_visibility":"final"/)
      if (/"score_visibility":"hidden"/.test(body)) assert.match(body, /"score_0_10":null/)
    }
  }
})
