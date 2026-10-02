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
 * IMMERSIVE-010 - SMS S01-S05 through the REAL engine and a REAL MongoDB transaction.
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
const ATTEMPT = new mongoose.Types.ObjectId('000000000000000000050105')
const IDS = ['S01', 'S02', 'S03', 'S04', 'S05']

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

if (!ready) console.warn(`\n[IMMERSIVE-010] S01-S05 engine tests SKIPPED - ${skipReason}\n`)

const it = (name, fn) => test(name, { skip: ready ? false : skipReason }, fn)

let ordinal = 0
let keyCounter = 0
const key = (label) => `s01s05-${label}-${(keyCounter += 1)}`

/** The server map's authoring names, read from the file (the service keeps only stage/intent). */
const EMAIL_MAP = JSON.parse(readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '../data/learner-actions/v1/sms.json'), 'utf8',
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
  // S03 is the legitimate control: marking the matching transaction reviewed is the 10, blocking
  // the header costs 5, and ringing the gateway number costs 7.
  ['S01', ['s01-open-read', 's01-inspect-sender', 's01-branch-app', 's01-verify-app', 's01-resolve-report'], 10],
  ['S01', ['s01-open-read', 's01-inspect-sender', 's01-branch-submit', 's01-verify-app', 's01-resolve-report'], 0],
  ['S01', ['s01-open-read', 's01-inspect-link', 's01-branch-open', 's01-verify-card', 's01-resolve-report'], 4],
  ['S02', ['s02-open-read', 's02-inspect-sender', 's02-branch-endcall', 's02-verify-bill', 's02-resolve-report'], 10],
  ['S02', ['s02-open-read', 's02-inspect-sender', 's02-branch-install', 's02-verify-bill', 's02-resolve-report'], 0],
  ['S02', ['s02-open-read', 's02-inspect-thread', 's02-branch-pay', 's02-verify-app', 's02-resolve-report'], 0],
  ['S03', ['s03-open-read', 's03-inspect-sender', 's03-branch-reviewed', 's03-verify-app', 's03-resolve-continue'], 10],
  ['S03', ['s03-open-read', 's03-inspect-sender', 's03-branch-block', 's03-verify-app', 's03-resolve-continue'], 5],
  ['S03', ['s03-open-read', 's03-inspect-sender', 's03-branch-callgateway', 's03-verify-card', 's03-resolve-retain'], 3],
  ['S04', ['s04-open-read', 's04-inspect-sender', 's04-branch-portal', 's04-verify-portal', 's04-resolve-report'], 10],
  ['S04', ['s04-open-read', 's04-inspect-sender', 's04-branch-pay', 's04-verify-portal', 's04-resolve-report'], 0],
  ['S04', ['s04-open-read', 's04-inspect-link', 's04-branch-open', 's04-verify-helpline', 's04-resolve-report'], 4],
  ['S05', ['s05-open-read', 's05-inspect-sender', 's05-branch-courier', 's05-verify-app', 's05-resolve-report'], 10],
  ['S05', ['s05-open-read', 's05-inspect-sender', 's05-branch-address', 's05-verify-app', 's05-resolve-report'], 0],
  ['S05', ['s05-open-read', 's05-inspect-link', 's05-branch-mandate', 's05-verify-courier', 's05-resolve-report'], 0],
]

it('plays every S01-S05 safe and unsafe route through six committed stages with the pinned score', async () => {
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
    assert.doesNotMatch(serialised, /ac_[0-9a-f]{20}|s0[1-5]-c\d{2}/)
  }
})

it('refuses a stale view: a control prepared for an earlier stage after the run moved on', async () => {
  const run = await newRun('S05')
  await send(run, 'gen-c01')
  await send(run, controlId('S05', 's05-open-read'))
  // The learner is now at inspect; a second tab still shows the list and taps the row.
  await refusedWith(send(run, controlId('S05', 's05-open-quickreply')), 'STALE_STATE')
  const state = await getRunState(run._id ?? run.id)
  assert.equal(state.current_stage, 'inspect')
  assert.equal(state.last_sequence, 2)
})

it('refuses a control used at the wrong stage without scoring it', async () => {
  const run = await newRun('S04')
  await send(run, 'gen-c01')
  await send(run, controlId('S04', 's04-open-read'))
  await send(run, controlId('S04', 's04-inspect-sender'))
  // At branch, a verify control and a resolve control are both refused.
  await refusedWith(send(run, controlId('S04', 's04-verify-portal')), 'STALE_STATE')
  await refusedWith(send(run, controlId('S04', 's04-resolve-report')), 'STALE_STATE')
  const state = await getRunState(run._id ?? run.id)
  assert.equal(state.current_stage, 'branch')
  assert.equal(state.last_sequence, 3)
})

it('refuses a code issued for another run, or for another scenario, as the same neutral 422', async () => {
  const mine = await ScenarioRun.findById((await newRun('S02'))._id).lean()
  const theirs = await ScenarioRun.findById((await newRun('S02'))._id).lean()
  const other = await ScenarioRun.findById((await newRun('S04'))._id).lean()
  const id = controlId('S02', 's02-branch-endcall')
  const refused = (fn) => assert.throws(fn, (error) => {
    assert.equal(error.code, 'INVALID_ACTION')
    assert.equal(error.status, 422)
    assert.equal(error.message, 'That action is not available here.')
    return true
  })
  // Same scenario, another run's code.
  refused(() => translateActionCode({ run: mine, actionCode: codeFor(theirs, id) }))
  // Another scenario's run.
  refused(() => translateActionCode({ run: mine, actionCode: codeFor(other, controlId('S04', 's04-branch-portal')) }))
  // Tampered / malformed.
  refused(() => translateActionCode({ run: mine, actionCode: 'ac_00000000000000000000' }))
  refused(() => translateActionCode({ run: mine, actionCode: 'safe_pivot' }))
  // Its own code still works.
  assert.equal(translateActionCode({ run: mine, actionCode: codeFor(mine, id) }).stage, 'branch')
})

it('replays a retried request with the same key instead of scoring it twice', async () => {
  const run = await newRun('S01')
  await send(run, 'gen-c01')
  await send(run, controlId('S01', 's01-open-read'))
  await send(run, controlId('S01', 's01-inspect-link'))
  const retryKey = key('retry')
  const first = await send(run, controlId('S01', 's01-branch-app'), retryKey)
  const second = await send(run, controlId('S01', 's01-branch-app'), retryKey)
  assert.equal(second.duplicate, true)
  assert.equal(second.event.sequence, first.event.sequence)
  assert.equal(second.run.last_sequence, 4)
  const events = await ScenarioEvent.find({ run_id: run._id ?? run.id }).lean()
  assert.equal(events.filter((e) => e.stage === 'branch').length, 1)
})

it('rebuilds a run mid-scenario after a reload from the ledger alone', async () => {
  const run = await newRun('S03')
  await send(run, 'gen-c01')
  await send(run, controlId('S03', 's03-open-read'))
  await send(run, controlId('S03', 's03-inspect-thread'))
  const id = run._id ?? run.id
  const before = await getRunState(id)
  const resumed = await resumeScenarioRun(id)
  const after = await getRunState(id)
  assert.equal(before.current_stage, 'branch')
  assert.equal(after.current_stage, 'branch')
  assert.equal(after.last_sequence, before.last_sequence)
  assert.equal(resumed.current_stage, 'branch')
  // The run continues from where it was.
  await send(run, controlId('S03', 's03-branch-reviewed'))
  assert.equal((await getRunState(id)).current_stage, 'verify')
})
