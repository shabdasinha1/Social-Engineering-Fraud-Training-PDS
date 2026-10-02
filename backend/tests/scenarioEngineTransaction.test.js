import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import { ScenarioDefinition } from '../src/models/ScenarioDefinition.js'
import { ScenarioEvent } from '../src/models/ScenarioEvent.js'
import { ScenarioRun } from '../src/models/ScenarioRun.js'
import {
  EngineError,
  getRunState,
  recomputeScoreFromEvents,
  resumeScenarioRun,
  startScenarioRun,
  submitIntent,
  verifyRunIntegrity,
} from '../src/services/scenarioEngineService.js'
import {
  loadSourceScenarios,
  loadTaxonomies,
  toScenarioDefinition,
} from '../src/services/scenarioDefinitionImportService.js'
import {
  MAX_TRANSACTION_ATTEMPTS,
  assertTransactionSupport,
  detectTransactionSupport,
} from '../src/utils/transactions.js'

/**
 * ENGINE-001 - transaction, idempotency, concurrency and recovery integration tests.
 *
 * These exercise REAL MongoDB transaction semantics; they are never mocked. A transaction
 * needs a replica set, so the suite requires one and SKIPS (loudly) rather than silently
 * downgrading when none is configured.
 *
 *   ENGINE_TEST_MONGO_URI=mongodb://127.0.0.1:27018/engine_test?replicaSet=rsTest npm test
 *
 * To start a throwaway single-node replica set without touching the local MongoDB
 * service - see docs/SCENARIO_ENGINE.md:
 *   mongod --port 27018 --dbpath <tmp> --replSet rsTest --bind_ip 127.0.0.1
 *   rs.initiate({_id:"rsTest",members:[{_id:0,host:"127.0.0.1:27018"}]})
 */

const URI = process.env.ENGINE_TEST_MONGO_URI
const ATTEMPT = new mongoose.Types.ObjectId('0000000000000000000000a1')

let ready = false
let skipReason = 'ENGINE_TEST_MONGO_URI is not set'

if (URI) {
  try {
    await mongoose.connect(URI, { serverSelectionTimeoutMS: 4000 })
    const topology = await detectTransactionSupport()
    if (!topology.supported) {
      skipReason = `configured MongoDB does not support transactions (${topology.topology ?? topology.reason})`
      await mongoose.disconnect()
    } else {
      // Load the real client scenarios used by these tests.
      const taxonomies = await loadTaxonomies()
      const { scenarios } = await loadSourceScenarios()
      const wanted = ['W01', 'W03', 'W19', 'S25']
      await ScenarioDefinition.deleteMany({ scenario_id: { $in: wanted } })
      await ScenarioDefinition.insertMany(
        scenarios.filter((r) => wanted.includes(r.scenario_id))
          .map((r) => toScenarioDefinition(r, taxonomies).doc),
      )
      await ScenarioRun.deleteMany({ attempt_id: ATTEMPT })
      ready = true
    }
  } catch (error) {
    skipReason = `could not connect: ${error.message.split('\n')[0]}`
  }
}

if (!ready) {
  // eslint-disable-next-line no-console
  console.warn(`\n[ENGINE-001] transaction integration tests SKIPPED - ${skipReason}\n`)
}

const it = (name, fn) => test(name, { skip: ready ? false : skipReason }, fn)

let ordinalCounter = 0
const nextOrdinal = () => (ordinalCounter += 1)
let keyCounter = 0
const key = (label) => `${label}-${(keyCounter += 1)}`

async function newRun(scenarioId = 'W01') {
  return startScenarioRun({
    attemptId: ATTEMPT, ordinal: nextOrdinal(), scenarioId, version: 1,
  })
}

/** Drives a run to the given stage, returning the run id. */
async function driveTo(run, stage) {
  const path = [
    ['notify', 'open_item'], ['open', 'read'], ['inspect', 'inspect_sender'],
    ['branch', 'safe_pivot'], ['verify', 'verify_trusted_directory'],
  ]
  for (const [from, intent] of path) {
    if (from === stage) break
    await submitIntent({ runId: run.id, intent, intentKey: key(intent) })
  }
  return run
}

test.after(async () => {
  if (ready) {
    await ScenarioRun.deleteMany({ attempt_id: ATTEMPT })
    await ScenarioEvent.deleteMany({})
    await ScenarioDefinition.deleteMany({})
    await mongoose.disconnect()
  }
})

/* ------------------------------------------------------------------ *
 * 26-30  transactions and the topology guard
 * ------------------------------------------------------------------ */

it('the configured test topology supports transactions', async () => {
  const result = await detectTransactionSupport()
  assert.equal(result.supported, true)
  assert.match(result.topology, /replica set/)
  await assertTransactionSupport()
})

it('the retry policy is bounded', () => {
  assert.equal(MAX_TRANSACTION_ATTEMPTS, 3)
  assert.ok(MAX_TRANSACTION_ATTEMPTS < 10, 'retries must be bounded, never open-ended')
})

it('an event and the run update commit together', async () => {
  const run = await newRun()
  await submitIntent({ runId: run.id, intent: 'open_item', intentKey: key('open') })

  const stored = await ScenarioRun.findById(run.id)
  const events = await ScenarioEvent.find({ run_id: run.id })
  assert.equal(events.length, 1)
  assert.equal(stored.last_sequence, 1)
  assert.equal(stored.current_stage, 'open')
  assert.equal(events[0].sequence, stored.last_sequence)
})

it('a rejected intent leaves neither an event nor a state change', async () => {
  const run = await newRun()
  const before = await ScenarioRun.findById(run.id)

  await assert.rejects(
    submitIntent({ runId: run.id, intent: 'resolve_report', intentKey: key('bad') }),
    (e) => e instanceof EngineError && e.code === 'INVALID_TRANSITION',
  )

  const after = await ScenarioRun.findById(run.id)
  assert.equal(await ScenarioEvent.countDocuments({ run_id: run.id }), 0, 'no event may be written')
  assert.equal(after.current_stage, before.current_stage)
  assert.equal(after.last_sequence, 0)
  assert.equal(after.score_running, 0)
})

/* ------------------------------------------------------------------ *
 * 1-8  full lifecycle
 * ------------------------------------------------------------------ */

it('the safe path drives NOTIFY to RESOLVE and scores 10', async () => {
  const run = await newRun('W01')
  const steps = ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_trusted_directory', 'resolve_report']
  let last
  for (const intent of steps) {
    last = await submitIntent({ runId: run.id, intent, intentKey: key(intent) })
  }
  assert.equal(last.run.status, 'resolved')
  assert.equal(last.score_0_10, 10)
  assert.equal(last.outcome_code, 'resolve_report')
  assert.equal(last.score_visibility, 'final')

  const events = await ScenarioEvent.find({ run_id: run.id }).sort({ sequence: 1 })
  assert.deepEqual(events.map((e) => e.sequence), [1, 2, 3, 4, 5, 6])
  assert.deepEqual(events.map((e) => e.event_code), [
    'NOTIFY_SEEN', 'ITEM_OPEN', 'INSPECT_CONTEXT', 'SAFE_PIVOT', 'TRUSTED_VERIFY', 'RESOLVE_CORRECT',
  ])
})

it('a legitimate scenario resolves correctly by being kept', async () => {
  const run = await newRun('W03')
  for (const intent of ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_trusted_directory']) {
    await submitIntent({ runId: run.id, intent, intentKey: key(intent) })
  }
  const done = await submitIntent({ runId: run.id, intent: 'resolve_continue', intentKey: key('res') })
  assert.equal(done.score_0_10, 10)
  assert.equal(done.run.status, 'resolved')
})

it('a risky branch returns an inert local consequence and still reaches VERIFY', async () => {
  const run = await newRun('S25')
  await submitIntent({ runId: run.id, intent: 'open_item', intentKey: key('a') })
  await submitIntent({ runId: run.id, intent: 'read', intentKey: key('b') })
  await submitIntent({ runId: run.id, intent: 'inspect_sender', intentKey: key('c') })
  const risky = await submitIntent({ runId: run.id, intent: 'attempt_install', intentKey: key('d') })

  assert.deepEqual(risky.consequence, {
    kind: 'simulated_install', target: null, inert: true, executes: false,
  })
  assert.equal(risky.run.current_stage, 'verify')
  const stored = await ScenarioRun.findById(run.id)
  assert.equal(stored.score_running, 2 - 8)
})

it('a run that goes badly still clamps to 0 at resolution', async () => {
  const run = await newRun('W01')
  await submitIntent({ runId: run.id, intent: 'open_item', intentKey: key('a') })
  await submitIntent({ runId: run.id, intent: 'reply', intentKey: key('b') })        // -1
  await submitIntent({ runId: run.id, intent: 'submit_data', intentKey: key('c') })  // -8
  await submitIntent({ runId: run.id, intent: 'report', intentKey: key('d') })       // +1
  const done = await submitIntent({ runId: run.id, intent: 'resolve_continue', intentKey: key('e') }) // -4

  const stored = await ScenarioRun.findById(run.id)
  assert.equal(stored.score_running, -12)
  assert.equal(done.score_0_10, 0, 'the final score is clamped, the raw total is kept')
})

/* ------------------------------------------------------------------ *
 * 13  resolved runs are terminal
 * ------------------------------------------------------------------ */

it('a resolved run accepts no further intents and cannot be resumed', async () => {
  const run = await newRun('W01')
  for (const intent of ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_trusted_directory', 'resolve_report']) {
    await submitIntent({ runId: run.id, intent, intentKey: key(intent) })
  }
  await assert.rejects(
    submitIntent({ runId: run.id, intent: 'resolve_report', intentKey: key('again') }),
    (e) => e.code === 'RUN_NOT_ACTIVE',
  )
  await assert.rejects(resumeScenarioRun(run.id), (e) => e.code === 'RUN_NOT_ACTIVE')
})

/* ------------------------------------------------------------------ *
 * 22-25  idempotency
 * ------------------------------------------------------------------ */

it('the same intent_key twice creates one event and scores once', async () => {
  const run = await newRun('W01')
  await submitIntent({ runId: run.id, intent: 'open_item', intentKey: key('a') })
  await submitIntent({ runId: run.id, intent: 'read', intentKey: key('b') })

  const k = key('inspect-once')
  const first = await submitIntent({ runId: run.id, intent: 'inspect_sender', intentKey: k })
  const second = await submitIntent({ runId: run.id, intent: 'inspect_sender', intentKey: k })

  assert.equal(second.duplicate, true)
  assert.equal(second.event.sequence, first.event.sequence)
  assert.equal(await ScenarioEvent.countDocuments({ run_id: run.id }), 3)

  const stored = await ScenarioRun.findById(run.id)
  assert.equal(stored.score_running, 2, 'INSPECT_CONTEXT must be awarded once, not twice')
  assert.equal(stored.current_stage, 'branch')
  assert.equal(stored.last_sequence, 3)
})

it('a duplicate intent_key on a different run is rejected', async () => {
  const a = await newRun('W01')
  const b = await newRun('W01')
  const k = key('shared')
  await submitIntent({ runId: a.id, intent: 'open_item', intentKey: k })
  await assert.rejects(
    submitIntent({ runId: b.id, intent: 'open_item', intentKey: k }),
    (e) => e.code === 'DUPLICATE_INTENT',
  )
})

it('concurrent intents cannot both advance the run', async () => {
  const run = await newRun('W01')
  const results = await Promise.allSettled([
    submitIntent({ runId: run.id, intent: 'open_item', intentKey: key('c1') }),
    submitIntent({ runId: run.id, intent: 'open_item', intentKey: key('c2') }),
  ])
  const ok = results.filter((r) => r.status === 'fulfilled')
  const failed = results.filter((r) => r.status === 'rejected')

  assert.equal(ok.length, 1, 'exactly one concurrent intent may win')
  assert.equal(failed.length, 1)
  assert.ok(['STALE_STATE', 'INVALID_TRANSITION'].includes(failed[0].reason.code),
    `unexpected error: ${failed[0].reason.code}`)

  const stored = await ScenarioRun.findById(run.id)
  assert.equal(stored.last_sequence, 1)
  assert.equal(await ScenarioEvent.countDocuments({ run_id: run.id }), 1)
})

it('a stale expected_stage is rejected deterministically', async () => {
  const run = await newRun('W01')
  await submitIntent({ runId: run.id, intent: 'open_item', intentKey: key('a') })
  await assert.rejects(
    submitIntent({ runId: run.id, intent: 'read', intentKey: key('b'), expectedStage: 'notify' }),
    (e) => e.code === 'STALE_STATE' && e.details.current_stage === 'open',
  )
  assert.equal(await ScenarioEvent.countDocuments({ run_id: run.id }), 1)
})

/* ------------------------------------------------------------------ *
 * 38-42  resume and recovery
 * ------------------------------------------------------------------ */

it('run state survives a service restart and comes from the database', async () => {
  const run = await newRun('W19')
  await submitIntent({ runId: run.id, intent: 'open_item', intentKey: key('a') })
  await submitIntent({ runId: run.id, intent: 'read', intentKey: key('b') })
  await submitIntent({ runId: run.id, intent: 'inspect_sender', intentKey: key('c') })

  // Simulate a restart: drop every in-memory model instance and re-read.
  const reloaded = await getRunState(run.id)
  assert.equal(reloaded.current_stage, 'branch')
  assert.equal(reloaded.last_sequence, 3)
  assert.equal(reloaded.status, 'active')
  assert.equal(reloaded.score_visibility, 'hidden')
  assert.equal(reloaded.score_0_10, null, 'the running score is never exposed mid-run')

  const replay = await recomputeScoreFromEvents(run.id)
  assert.equal(replay.score_running, 2)
  assert.deepEqual(replay.sequences, [1, 2, 3])
})

it('the cached score always agrees with a replay of the ledger', async () => {
  const run = await newRun('W01')
  for (const intent of ['open_item', 'read', 'inspect_sender', 'open_link', 'verify_trusted_directory']) {
    await submitIntent({ runId: run.id, intent, intentKey: key(intent) })
  }
  const integrity = await verifyRunIntegrity(run.id)
  assert.equal(integrity.score_matches, true)
  assert.equal(integrity.sequence_contiguous, true)
  assert.equal(integrity.last_sequence_matches, true)
  assert.equal(integrity.replayed.score_running, 0 + 0 + 2 - 3 + 3)
})

it('an abandoned run is resumable and keeps its progress', async () => {
  const run = await newRun('W01')
  await driveTo(run, 'resolve')
  const abandoned = await submitIntent({ runId: run.id, intent: 'abandon', intentKey: key('ab') })
  assert.equal(abandoned.run.status, 'abandoned')

  const stored = await ScenarioRun.findById(run.id)
  assert.equal(stored.status, 'abandoned')
  assert.equal(stored.resolved_at, null, 'abandonment is not a resolution')
  assert.equal(stored.score_0_10, null)

  await assert.rejects(
    submitIntent({ runId: run.id, intent: 'resolve_report', intentKey: key('x') }),
    (e) => e.code === 'RUN_NOT_ACTIVE',
  )

  const resumed = await resumeScenarioRun(run.id)
  assert.equal(resumed.status, 'active')
  assert.equal(resumed.current_stage, 'resolve')

  const done = await submitIntent({ runId: run.id, intent: 'resolve_report', intentKey: key('fin') })
  assert.equal(done.run.status, 'resolved')
  assert.equal(done.score_0_10, 10)
})

/* ------------------------------------------------------------------ *
 * security and version pinning
 * ------------------------------------------------------------------ */

it('a run stays pinned to its content version even if that version is deactivated', async () => {
  const run = await newRun('W01')
  await ScenarioDefinition.updateOne({ scenario_id: 'W01', version: 1 }, { $set: { active: false } })
  try {
    const ok = await submitIntent({ runId: run.id, intent: 'open_item', intentKey: key('pin') })
    assert.equal(ok.run.version, 1, 'the in-flight run continues on its pinned version')
    await assert.rejects(
      startScenarioRun({ attemptId: ATTEMPT, ordinal: nextOrdinal(), scenarioId: 'W01' }),
      (e) => e.code === 'SCENARIO_DEFINITION_NOT_FOUND' || e.code === 'SCENARIO_DEFINITION_INACTIVE',
      'a NEW run may not start on an inactive version',
    )
  } finally {
    await ScenarioDefinition.updateOne({ scenario_id: 'W01', version: 1 }, { $set: { active: true } })
  }
})

it('the candidate state never carries evaluation or classification data', async () => {
  const run = await newRun('W19')
  const accepted = await submitIntent({ runId: run.id, intent: 'open_item', intentKey: key('sec') })
  const text = JSON.stringify([accepted, await getRunState(run.id)])

  for (const secret of ['evaluation', 'canonical_family', 'canonical_triggers', 'military_flag',
    'disposition', 'expected_safe_behavior', 'learner_flow', 'FICTIONAL MILITARY',
    'operational_elicitation', 'score_running']) {
    assert.ok(!text.includes(secret), `candidate payload leaked "${secret}"`)
  }
})

it('a run cannot be started for a scenario definition that does not exist', async () => {
  await assert.rejects(
    startScenarioRun({ attemptId: ATTEMPT, ordinal: nextOrdinal(), scenarioId: 'I25', version: 1 }),
    (e) => e.code === 'SCENARIO_DEFINITION_NOT_FOUND',
  )
})

it('an unknown run id is reported, not silently created', async () => {
  const ghost = new mongoose.Types.ObjectId()
  await assert.rejects(getRunState(ghost), (e) => e.code === 'RUN_NOT_FOUND')
  await assert.rejects(
    submitIntent({ runId: ghost, intent: 'open_item', intentKey: key('ghost') }),
    (e) => e.code === 'RUN_NOT_FOUND',
  )
})

it('rationale is stored only on resolution and never echoed to the candidate', async () => {
  const run = await newRun('W01')
  await driveTo(run, 'resolve')
  const done = await submitIntent({
    runId: run.id, intent: 'resolve_report', intentKey: key('r'),
    rationale: 'The code was requested by someone else, so I reported it.',
  })
  assert.ok(!JSON.stringify(done).includes('someone else'), 'rationale must not be echoed back')

  const stored = await ScenarioRun.findById(run.id)
  assert.equal(stored.rationale, 'The code was requested by someone else, so I reported it.')
  assert.equal(done.score_0_10, 10, 'rationale does not change the score')

  const events = await ScenarioEvent.find({ run_id: run.id })
  const eventText = JSON.stringify(events)
  assert.ok(!eventText.includes('someone else'), 'rationale must never enter the event ledger')
})
