import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'
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
 * IMMERSIVE-008 - Email E16-E20 through the REAL engine and a REAL MongoDB transaction.
 *
 * Every step is exactly what the attempt controller does with a learner's request: the browser
 * sends an opaque per-run action code, `translateActionCode` turns it into the stage and intent
 * the server map holds for that neutral control, and `submitIntent` is called with that stage as
 * the expected stage. Nothing here passes an intent the scene could have chosen.
 *
 * Covers, for the five new scenes: the safe and unsafe scores, six committed stages, a stale
 * view, a control used at the wrong stage, a code from another run or scenario, a retried
 * request, and rebuilding the run after a reload. Requires an ISOLATED replica-set database:
 *
 *   ENGINE_TEST_MONGO_URI=mongodb://127.0.0.1:27017/<isolated_db>?replicaSet=rs0 node --test ...
 *
 * and SKIPS loudly without one. Never point it at the production database.
 */

const URI = process.env.ENGINE_TEST_MONGO_URI
const ATTEMPT = new mongoose.Types.ObjectId('0000000000000000000e1620')
const IDS = ['E16', 'E17', 'E18', 'E19', 'E20']

let ready = false
let skipReason = 'ENGINE_TEST_MONGO_URI is not set'

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
      await ScenarioDefinition.deleteMany({ scenario_id: { $in: IDS } })
      await ScenarioDefinition.insertMany(
        scenarios.filter((r) => IDS.includes(r.scenario_id))
          .map((r) => toScenarioDefinition(r, taxonomies, { synthetic: byScenario.get(r.scenario_id) }).doc),
      )
      await ScenarioRun.deleteMany({ attempt_id: ATTEMPT })
      ready = true
    }
  } catch (error) {
    skipReason = `could not connect: ${error.message.split('\n')[0]}`
  }
}

if (!ready) console.warn(`\n[IMMERSIVE-008] E16-E20 engine tests SKIPPED - ${skipReason}\n`)

const it = (name, fn) => test(name, { skip: ready ? false : skipReason }, fn)

let ordinal = 0
let keyCounter = 0
const key = (label) => `e16e20-${label}-${(keyCounter += 1)}`

/** The server map's authoring names, read from the file (the service keeps only stage/intent). */
const EMAIL_MAP = JSON.parse(readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '../data/learner-actions/v1/email.json'), 'utf8',
)).scenes

/** The neutral control id whose server-map authoring name is `name`. */
function controlId(scenarioId, name) {
  for (const [id, entry] of Object.entries(EMAIL_MAP[scenarioId])) {
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

test.after(async () => {
  if (ready) {
    const runs = await ScenarioRun.find({ attempt_id: ATTEMPT }, { _id: 1 }).lean()
    await ScenarioEvent.deleteMany({ run_id: { $in: runs.map((r) => r._id) } })
    await ScenarioRun.deleteMany({ attempt_id: ATTEMPT })
    await ScenarioDefinition.deleteMany({ scenario_id: { $in: IDS } })
    await mongoose.disconnect()
  }
})

const ROUTES = [
  // [scenario, route, expected score]
  ['E16', ['e16-open-read', 'e16-inspect-sender', 'e16-branch-reminder', 'e16-verify-board', 'e16-resolve-continue'], 10],
  ['E16', ['e16-open-read', 'e16-inspect-sender', 'e16-branch-forward', 'e16-verify-board', 'e16-resolve-continue'], 3],
  ['E17', ['e17-open-read', 'e17-inspect-sender', 'e17-branch-cancel', 'e17-verify-statement', 'e17-resolve-report'], 10],
  ['E17', ['e17-open-read', 'e17-inspect-sender', 'e17-branch-call', 'e17-verify-statement', 'e17-resolve-report'], 4],
  ['E18', ['e18-open-read', 'e18-inspect-sender', 'e18-branch-hold', 'e18-verify-call', 'e18-resolve-report'], 10],
  ['E18', ['e18-open-read', 'e18-inspect-sender', 'e18-branch-release', 'e18-verify-call', 'e18-resolve-report'], 0],
  ['E19', ['e19-open-read', 'e19-inspect-file', 'e19-branch-closedoc', 'e19-verify-pio', 'e19-resolve-report'], 10],
  ['E19', ['e19-open-read', 'e19-inspect-file', 'e19-branch-answer', 'e19-verify-pio', 'e19-resolve-report'], 0],
  ['E20', ['e20-open-read', 'e20-inspect-sender', 'e20-branch-close', 'e20-verify-lookup', 'e20-resolve-report'], 10],
  ['E20', ['e20-open-read', 'e20-inspect-sender', 'e20-branch-pay', 'e20-verify-lookup', 'e20-resolve-report'], 0],
]

it('plays every E16-E20 safe and unsafe route through six committed stages with the pinned score', async () => {
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
    assert.doesNotMatch(serialised, /ac_[0-9a-f]{20}|e(1[6-9]|20)-c\d{2}/)
  }
})

it('refuses a stale view: a control prepared for an earlier stage after the run moved on', async () => {
  const run = await newRun('E18')
  await send(run, 'gen-c01')
  await send(run, controlId('E18', 'e18-open-read'))
  // The learner is now at inspect; a second tab still shows the open stage and taps the row.
  await refusedWith(send(run, controlId('E18', 'e18-open-quickreply')), 'STALE_STATE')
  const state = await getRunState(run._id ?? run.id)
  assert.equal(state.current_stage, 'inspect')
  assert.equal(state.last_sequence, 2)
})

it('refuses a control used at the wrong stage without scoring it', async () => {
  const run = await newRun('E20')
  await send(run, 'gen-c01')
  await send(run, controlId('E20', 'e20-open-read'))
  await send(run, controlId('E20', 'e20-inspect-sender'))
  // At branch, a verify control and a resolve control are both refused.
  await refusedWith(send(run, controlId('E20', 'e20-verify-lookup')), 'STALE_STATE')
  await refusedWith(send(run, controlId('E20', 'e20-resolve-report')), 'STALE_STATE')
  const state = await getRunState(run._id ?? run.id)
  assert.equal(state.current_stage, 'branch')
  assert.equal(state.last_sequence, 3)
})

it('refuses a code issued for another run, or for another scenario, as the same neutral 422', async () => {
  const mine = await ScenarioRun.findById((await newRun('E17'))._id).lean()
  const theirs = await ScenarioRun.findById((await newRun('E17'))._id).lean()
  const other = await ScenarioRun.findById((await newRun('E19'))._id).lean()
  const id = controlId('E17', 'e17-branch-cancel')
  const refused = (fn) => assert.throws(fn, (error) => {
    assert.equal(error.code, 'INVALID_ACTION')
    assert.equal(error.status, 422)
    assert.equal(error.message, 'That action is not available here.')
    return true
  })
  // Same scenario, another run's code.
  refused(() => translateActionCode({ run: mine, actionCode: codeFor(theirs, id) }))
  // Another scenario's run.
  refused(() => translateActionCode({ run: mine, actionCode: codeFor(other, controlId('E19', 'e19-branch-leave')) }))
  // Tampered / malformed.
  refused(() => translateActionCode({ run: mine, actionCode: 'ac_00000000000000000000' }))
  refused(() => translateActionCode({ run: mine, actionCode: 'safe_pivot' }))
  // Its own code still works.
  assert.equal(translateActionCode({ run: mine, actionCode: codeFor(mine, id) }).stage, 'branch')
})

it('replays a retried request with the same key instead of scoring it twice', async () => {
  const run = await newRun('E19')
  await send(run, 'gen-c01')
  await send(run, controlId('E19', 'e19-open-read'))
  await send(run, controlId('E19', 'e19-inspect-file'))
  const retryKey = key('retry')
  const first = await send(run, controlId('E19', 'e19-branch-closedoc'), retryKey)
  const second = await send(run, controlId('E19', 'e19-branch-closedoc'), retryKey)
  assert.equal(second.duplicate, true)
  assert.equal(second.event.sequence, first.event.sequence)
  assert.equal(second.run.last_sequence, 4)
  const events = await ScenarioEvent.find({ run_id: run._id ?? run.id }).lean()
  assert.equal(events.filter((e) => e.stage === 'branch').length, 1)
})

it('rebuilds a run mid-scenario after a reload from the ledger alone', async () => {
  const run = await newRun('E16')
  await send(run, 'gen-c01')
  await send(run, controlId('E16', 'e16-open-read'))
  await send(run, controlId('E16', 'e16-inspect-ics'))
  const id = run._id ?? run.id
  const before = await getRunState(id)
  const resumed = await resumeScenarioRun(id)
  const after = await getRunState(id)
  assert.equal(before.current_stage, 'branch')
  assert.equal(after.current_stage, 'branch')
  assert.equal(after.last_sequence, before.last_sequence)
  assert.equal(resumed.current_stage, 'branch')
  // The run continues from where it was.
  await send(run, controlId('E16', 'e16-branch-reminder'))
  assert.equal((await getRunState(id)).current_stage, 'verify')
})
