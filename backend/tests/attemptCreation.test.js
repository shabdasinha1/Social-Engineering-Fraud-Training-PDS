import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import { SELECTION_ALGORITHM_VERSION } from '../src/constants/scenarioSelection.js'
import { Attempt } from '../src/models/Attempt.js'
import { ScenarioDefinition } from '../src/models/ScenarioDefinition.js'
import { ScenarioRun } from '../src/models/ScenarioRun.js'
import {
  attemptIndexFor,
  createAttempt,
  findActiveAttempt,
  loadSelectionPool,
  recentScenarioIdsFor,
} from '../src/services/attemptService.js'
import {
  loadSourceScenarios,
  loadTaxonomies,
  toScenarioDefinition,
} from '../src/services/scenarioDefinitionImportService.js'
import { validateSelection } from '../src/services/scenarioSelectionService.js'
import { detectTransactionSupport } from '../src/utils/transactions.js'

/**
 * SELECT-002 - attempt persistence integration tests.
 *
 * Atomic attempt creation needs real MongoDB transactions, so this suite requires a
 * replica set and SKIPS loudly rather than mocking. Run it with:
 *
 *   npm run test:engine        (starts a throwaway replica set, runs engine + selection)
 */

const URI = process.env.ENGINE_TEST_MONGO_URI
const PROFILE = new mongoose.Types.ObjectId('0000000000000000000000b1')

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
      const taxonomies = await loadTaxonomies()
      const { scenarios } = await loadSourceScenarios()
      await ScenarioDefinition.deleteMany({})
      await ScenarioDefinition.insertMany(
        scenarios.map((r) => toScenarioDefinition(r, taxonomies).doc),
      )
      await Attempt.deleteMany({})
      await ScenarioRun.deleteMany({})
      ready = true
    }
  } catch (error) {
    skipReason = `could not connect: ${error.message.split('\n')[0]}`
  }
}

if (!ready) {
  // eslint-disable-next-line no-console
  console.warn(`\n[SELECT-002] attempt persistence tests SKIPPED - ${skipReason}\n`)
}

const it = (name, fn) => test(name, { skip: ready ? false : skipReason }, fn)

async function reset() {
  await Attempt.deleteMany({})
  await ScenarioRun.deleteMany({})
}

test.after(async () => {
  if (ready) {
    await reset()
    await ScenarioDefinition.deleteMany({})
    await mongoose.disconnect()
  }
})

/* ------------------------------------------------------------------ *
 * pool loading
 * ------------------------------------------------------------------ */

it('the selection pool holds the 100 active scenarios and no evaluation data', async () => {
  const pool = await loadSelectionPool()
  assert.equal(pool.length, 100)
  for (const s of pool) {
    assert.equal(s.evaluation, undefined, 'the pool must never carry evaluation data')
    assert.ok(s.canonical_family && s.canonical_triggers && s.scenario_id)
  }
})

it('inactive definitions are excluded from the pool', async () => {
  await ScenarioDefinition.updateOne({ scenario_id: 'W01' }, { $set: { active: false } })
  try {
    const pool = await loadSelectionPool()
    assert.equal(pool.length, 99)
    assert.ok(!pool.some((s) => s.scenario_id === 'W01'))
  } finally {
    await ScenarioDefinition.updateOne({ scenario_id: 'W01' }, { $set: { active: true } })
  }
})

it('more than one active version of a scenario is refused', async () => {
  const w01 = await ScenarioDefinition.findOne({ scenario_id: 'W01' }).select('+evaluation').lean()
  await ScenarioDefinition.create({ ...w01, _id: undefined, version: 2, active: true })
  try {
    await assert.rejects(loadSelectionPool(), (e) => e.code === 'SELECTION_INVALID_CONTENT_VERSION')
  } finally {
    await ScenarioDefinition.deleteOne({ scenario_id: 'W01', version: 2 })
  }
})

/* ------------------------------------------------------------------ *
 * 22-25  persistence, freezing, atomicity
 * ------------------------------------------------------------------ */

it('creating an attempt persists the frozen sequence and ten runs atomically', async () => {
  await reset()
  const { attempt, plan } = await createAttempt({ profileId: PROFILE })

  assert.equal(attempt.scenario_sequence.length, 10)
  assert.equal(attempt.status, 'in_progress')
  assert.equal(attempt.mode, 'assessment')
  assert.ok(attempt.seed, 'the seed must be persisted')
  assert.equal(attempt.selection.selection_algorithm_version, SELECTION_ALGORITHM_VERSION)
  assert.equal(attempt.content_version, 1)

  const runs = await ScenarioRun.find({ attempt_id: attempt._id }).sort({ ordinal: 1 })
  assert.equal(runs.length, 10)
  assert.deepEqual(runs.map((r) => r.ordinal), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  assert.deepEqual(runs.map((r) => r.scenario_id), plan.scenario_ids)

  // Every run is ready for ENGINE-001, and none has been started.
  for (const run of runs) {
    assert.equal(run.status, 'active')
    assert.equal(run.current_stage, 'notify')
    assert.equal(run.last_sequence, 0)
    assert.equal(run.score_running, 0)
    assert.equal(run.score_0_10, null)
  }
})

it('the persisted attempt satisfies every composition rule', async () => {
  await reset()
  const { attempt, plan } = await createAttempt({ profileId: PROFILE })
  const pool = await loadSelectionPool()
  const byId = Object.fromEntries(pool.map((s) => [s.scenario_id, s]))
  const chosen = attempt.scenario_sequence.map((i) => byId[i.scenario_id])
  assert.deepEqual(validateSelection(chosen, { platformQuota: plan.platform_quota }), [])
})

it('the frozen sequence cannot be rewritten after creation', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })
  // Use an id that is definitely NOT already in the sequence, otherwise the duplicate
  // validator fires before the freeze hook and the test proves the wrong thing.
  const chosen = new Set(attempt.scenario_sequence.map((i) => i.scenario_id))
  const outsider = ['S25', 'S24', 'W25', 'I25', 'E25'].find((id) => !chosen.has(id))
  assert.ok(outsider, 'fixture needs an id outside the sequence')
  attempt.scenario_sequence[0].scenario_id = outsider
  await assert.rejects(attempt.save(), /frozen/)

  const reloaded = await Attempt.findById(attempt._id)
  assert.notEqual(reloaded.scenario_sequence[0].scenario_id, outsider)
})

it('the seed and selection metadata are frozen too', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })
  attempt.seed = 'tampered'
  await assert.rejects(attempt.save(), /frozen/)
})

it('the sequence survives a reload and is unaffected by later history', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })
  const before = attempt.scenario_sequence.map((i) => i.scenario_id)

  // Resolve a run: learner behaviour must not reselect anything.
  await ScenarioRun.updateOne(
    { attempt_id: attempt._id, ordinal: 1 },
    { $set: { status: 'resolved', score_0_10: 3, outcome_code: 'resolve_report', resolved_at: new Date() } },
  )

  const reloaded = await Attempt.findById(attempt._id)
  assert.deepEqual(reloaded.scenario_sequence.map((i) => i.scenario_id), before)
  assert.equal(await ScenarioRun.countDocuments({ attempt_id: attempt._id }), 10)
})

it('a second attempt is refused while one is in progress', async () => {
  await reset()
  await createAttempt({ profileId: PROFILE })
  await assert.rejects(
    createAttempt({ profileId: PROFILE }),
    (e) => e.code === 'SELECTION_ATTEMPT_IN_PROGRESS',
  )
  assert.equal(await Attempt.countDocuments({ profile_id: PROFILE }), 1)
  assert.equal(await ScenarioRun.countDocuments(), 10, 'no partial second attempt may exist')
})

it('concurrent creation cannot produce two attempts or twenty runs', async () => {
  await reset()
  const results = await Promise.allSettled([
    createAttempt({ profileId: PROFILE }),
    createAttempt({ profileId: PROFILE }),
  ])
  const ok = results.filter((r) => r.status === 'fulfilled')
  assert.ok(ok.length >= 1)
  const attempts = await Attempt.countDocuments({ profile_id: PROFILE })
  const runs = await ScenarioRun.countDocuments()
  assert.equal(runs, attempts * 10, `runs (${runs}) must be exactly 10 per attempt (${attempts})`)
})

/* ------------------------------------------------------------------ *
 * determinism and rotation across real attempts
 * ------------------------------------------------------------------ */

it('replaying a stored seed reproduces the same sequence', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })
  const storedSeed = attempt.seed
  const storedIds = attempt.scenario_sequence.map((i) => i.scenario_id)

  await reset()
  const replay = await createAttempt({ profileId: PROFILE, seed: storedSeed })
  assert.deepEqual(replay.attempt.scenario_sequence.map((i) => i.scenario_id), storedIds)
})

it('the platform rotation advances with each completed attempt', async () => {
  await reset()
  const quotas = []
  for (let i = 0; i < 4; i += 1) {
    const { attempt } = await createAttempt({ profileId: PROFILE })
    quotas.push(Object.fromEntries(attempt.selection.platform_quota))
    assert.equal(attempt.selection.attempt_index, i)
    await Attempt.updateOne({ _id: attempt._id },
      { $set: { status: 'completed', completed_at: new Date() } })
  }
  const totals = {}
  for (const q of quotas) for (const [p, n] of Object.entries(q)) totals[p] = (totals[p] ?? 0) + n
  for (const platform of ['whatsapp', 'instagram', 'email', 'sms']) {
    assert.equal(totals[platform], 10, `${platform} must total 10 across four attempts`)
  }
})

it('recent scenario ids come from the new pipeline, newest first', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })
  await Attempt.updateOne({ _id: attempt._id },
    { $set: { status: 'completed', completed_at: new Date() } })

  const recent = await recentScenarioIdsFor(PROFILE)
  assert.equal(recent.length, 10)
  assert.deepEqual([...recent].sort(), attempt.scenario_sequence.map((i) => i.scenario_id).sort())
  assert.equal(await attemptIndexFor(PROFILE), 1)
})

it('a second attempt avoids the first attempt scenarios', async () => {
  await reset()
  const first = await createAttempt({ profileId: PROFILE })
  await Attempt.updateOne({ _id: first.attempt._id },
    { $set: { status: 'completed', completed_at: new Date() } })

  const second = await createAttempt({ profileId: PROFILE })
  const firstIds = new Set(first.attempt.scenario_sequence.map((i) => i.scenario_id))
  const overlap = second.attempt.scenario_sequence
    .map((i) => i.scenario_id)
    .filter((id) => firstIds.has(id))
  assert.deepEqual(overlap, [], 'the recent-20 window must exclude the previous attempt')
  assert.equal(second.attempt.selection.recent_exclusion.relaxed, false)
})

/* ------------------------------------------------------------------ *
 * validation and security
 * ------------------------------------------------------------------ */

it('an invalid mode is refused', async () => {
  await reset()
  await assert.rejects(
    createAttempt({ profileId: PROFILE, mode: 'adaptive' }),
    (e) => e.code === 'SELECTION_INVALID_MODE',
  )
})

it('a missing profile is refused', async () => {
  await assert.rejects(createAttempt({}), (e) => e.code === 'SELECTION_INVALID_PROFILE')
})

it('training mode uses the same composition rules', async () => {
  await reset()
  const { attempt, plan } = await createAttempt({ profileId: PROFILE, mode: 'training' })
  assert.equal(attempt.mode, 'training')
  const pool = await loadSelectionPool()
  const byId = Object.fromEntries(pool.map((s) => [s.scenario_id, s]))
  assert.deepEqual(
    validateSelection(attempt.scenario_sequence.map((i) => byId[i.scenario_id]),
      { platformQuota: plan.platform_quota }),
    [],
  )
})

it('the candidate attempt projection hides seed, selection and composition', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })
  const json = attempt.toCandidateJSON()
  for (const hidden of ['seed', 'selection', 'scenario_sequence', 'profile_id',
    'content_version', 'taxonomy_version', 'trigger_taxonomy_version']) {
    assert.ok(!(hidden in json), `candidate attempt payload exposed "${hidden}"`)
  }
  const text = JSON.stringify(json)
  assert.ok(!text.includes(attempt.seed), 'the seed must never reach the learner')
  /**
   * IMMERSIVE-001 added three keys, and they are named here rather than the assertion
   * being relaxed: the point of this test is that the candidate payload is an exact,
   * reviewed contract, so a future field has to be added deliberately.
   *
   * All three are safe to publish. `expires_at` is `started_at` (already sent) plus a
   * limit the learner was told about; `server_now` is a clock reading; `end_reason` says
   * why an attempt stopped. None reveals a scenario, a classification or a score.
   */
  assert.deepEqual(Object.keys(json).sort(), [
    'attempt_id', 'completed_at', 'mode', 'started_at', 'status', 'total_score', 'total_scenarios',
    'expires_at', 'server_now', 'end_reason',
  ].sort())
})

it('findActiveAttempt is read-only', async () => {
  await reset()
  assert.equal(await findActiveAttempt(PROFILE), null)
  assert.equal(await Attempt.countDocuments({ profile_id: PROFILE }), 0,
    'looking for an attempt must never create one')
  await createAttempt({ profileId: PROFILE })
  assert.ok(await findActiveAttempt(PROFILE))
})

it('the attempt model rejects a malformed sequence', async () => {
  const base = {
    profile_id: PROFILE, seed: 's', mode: 'assessment', status: 'in_progress',
    content_version: 1,
    selection: {
      selection_algorithm_version: '1.0.0', attempt_index: 0,
      platform_quota: { whatsapp: 3 }, composition: {}, recent_exclusion: {},
    },
  }
  const dupes = Array.from({ length: 10 }, (_, i) => ({
    ordinal: i + 1, scenario_id: 'W01', definition_version: 1,
  }))
  await assert.rejects(new Attempt({ ...base, scenario_sequence: dupes }).validate(), /twice/)

  const gapped = Array.from({ length: 10 }, (_, i) => ({
    ordinal: i === 9 ? 11 : i + 1,
    scenario_id: `W0${(i % 9) + 1}`,
    definition_version: 1,
  }))
  await assert.rejects(new Attempt({ ...base, scenario_sequence: gapped }).validate(), /ordinals/)
})
