import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import { createApp } from '../src/app.js'
import { Attempt } from '../src/models/Attempt.js'
import { Candidate } from '../src/models/Candidate.js'
import { ProgressSnapshot } from '../src/models/ProgressSnapshot.js'
import { ScenarioDefinition } from '../src/models/ScenarioDefinition.js'
import { ScenarioRun } from '../src/models/ScenarioRun.js'
import { completeAttempt, createAttempt } from '../src/services/attemptService.js'
import {
  getProgressSnapshot,
  rebuildProgressSnapshot,
} from '../src/services/progressService.js'
import {
  loadSourceScenarios,
  loadTaxonomies,
  toScenarioDefinition,
} from '../src/services/scenarioDefinitionImportService.js'
import { detectTransactionSupport } from '../src/utils/transactions.js'

/**
 * `ProgressSnapshot` service and API (PROGRESS-001, sections 6 and 7 - gap G2).
 *
 * Real attempts, real runs and real completion against a real replica set. The aggregates
 * are checked against the authoritative `Attempt.total_score` and `ScenarioRun.score_0_10`
 * rather than against numbers this suite computed itself.
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
  console.warn(`\n[PROGRESS-001] progress snapshot tests SKIPPED - ${skipReason}\n`)
}

const it = (name, fn) => test(name, { skip: ready ? false : skipReason }, fn)

/* ------------------------------------------------------------------ *
 * Helpers - real services, no invented scoring
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

let idSeq = 0
const nextIdentifier = () => `PR${String(800000 + (idSeq += 1))}`

async function signIn(name = 'Progress Learner', identifier = nextIdentifier()) {
  const res = await call('/candidates', { method: 'POST', body: { name, identifier } })
  assert.ok(res.cookie, `sign-in failed: ${JSON.stringify(res.data)}`)
  const profile = await Candidate.findOne({ identifierNormalised: identifier })
  return { cookie: res.cookie, profile }
}

/**
 * Marks every run of an attempt resolved with a chosen per-scenario score, then completes it
 * through the real `completeAttempt`. The engine's own scoring is not re-implemented: the
 * runs are given scores directly and the attempt total is whatever `completeAttempt` sums,
 * which is the behaviour under test.
 */
async function completeAttemptWithScores(profileId, scorePerRun = 7) {
  const { attempt } = await createAttempt({ profileId, mode: 'assessment' })
  const runs = await ScenarioRun.find({ attempt_id: attempt._id }).sort({ ordinal: 1 })
  for (const run of runs) {
    run.status = 'resolved'
    run.score_0_10 = scorePerRun
    run.outcome_code = 'RESOLVE_CORRECT'
    run.resolved_at = new Date()
    run.current_stage = 'resolve'
    await run.save()
  }
  return completeAttempt(attempt)
}

async function reset() {
  await Promise.all([
    Attempt.deleteMany({}), ScenarioRun.deleteMany({}), ProgressSnapshot.deleteMany({}),
  ])
}

test.after(async () => {
  if (!ready) return
  await reset()
  await Promise.all([Candidate.deleteMany({}), ScenarioDefinition.deleteMany({})])
  server?.close()
  await mongoose.disconnect()
})

/* ------------------------------------------------------------------ *
 * 1-4  a learner with nothing yet
 * ------------------------------------------------------------------ */

it('a learner with no attempts gets a real, empty snapshot', async () => {
  await reset()
  const { profile } = await signIn()

  const snapshot = await getProgressSnapshot(profile._id)
  assert.equal(snapshot.attempt_count, 0)
  assert.equal(snapshot.scenarios_completed, 0)
  assert.equal(snapshot.last_score, null)
  assert.equal(snapshot.best_score, null)
  assert.deepEqual(snapshot.by_platform, [])
  assert.deepEqual(snapshot.by_family, [])
  assert.ok(snapshot.generated_at instanceof Date)
})

it('the snapshot is created on first read - no backfill needed', async () => {
  await reset()
  const { profile } = await signIn()

  assert.equal(await ProgressSnapshot.countDocuments({ profile_id: profile._id }), 0)
  await getProgressSnapshot(profile._id)
  assert.equal(await ProgressSnapshot.countDocuments({ profile_id: profile._id }), 1)
})

it('an in-progress attempt counts for nothing', async () => {
  await reset()
  const { profile } = await signIn()
  await createAttempt({ profileId: profile._id, mode: 'assessment' })

  const snapshot = await getProgressSnapshot(profile._id)
  assert.equal(snapshot.attempt_count, 0, 'an unfinished attempt is not an exposure')
  assert.equal(snapshot.scenarios_completed, 0)
  assert.equal(snapshot.last_score, null)
})

it('an abandoned attempt - the ADMIN-004 reset state - counts for nothing', async () => {
  await reset()
  const { profile } = await signIn()
  const { attempt } = await createAttempt({ profileId: profile._id, mode: 'assessment' })
  await Attempt.updateOne({ _id: attempt._id }, { $set: { status: 'abandoned' } })

  const snapshot = await rebuildProgressSnapshot(profile._id)
  assert.equal(snapshot.attempt_count, 0, 'an instructor reset must not read as an exposure')
})

/* ------------------------------------------------------------------ *
 * 5-10  aggregates over completed attempts
 * ------------------------------------------------------------------ */

it('one completed attempt gives an attempt count, a last score and a best score', async () => {
  await reset()
  const { profile } = await signIn()
  const attempt = await completeAttemptWithScores(profile._id, 7)

  const snapshot = await getProgressSnapshot(profile._id)
  assert.equal(snapshot.attempt_count, 1)
  assert.equal(snapshot.scenarios_completed, 10)
  assert.equal(snapshot.last_score, attempt.total_score, 'last_score must be the attempt total')
  assert.equal(snapshot.best_score, attempt.total_score)
  assert.equal(attempt.total_score, 70)
})

it('best_score keeps the highest and last_score follows the latest', async () => {
  await reset()
  const { profile } = await signIn()

  await completeAttemptWithScores(profile._id, 9)   // 90 - the best
  const second = await completeAttemptWithScores(profile._id, 4)   // 40 - the latest

  const snapshot = await getProgressSnapshot(profile._id)
  assert.equal(snapshot.attempt_count, 2)
  assert.equal(snapshot.best_score, 90, 'a later, worse attempt must not lower the best')
  assert.equal(snapshot.last_score, 40)
  assert.equal(snapshot.last_score, second.total_score)
  assert.equal(snapshot.scenarios_completed, 20)
})

it('platform aggregates come from the resolved runs and stay counts-and-points only', async () => {
  await reset()
  const { profile } = await signIn()
  await completeAttemptWithScores(profile._id, 6)

  const snapshot = await getProgressSnapshot(profile._id)
  const totalScenarios = snapshot.by_platform.reduce((n, b) => n + b.scenarios, 0)
  const totalPoints = snapshot.by_platform.reduce((n, b) => n + b.points, 0)

  assert.equal(totalScenarios, 10, 'every resolved run belongs to exactly one platform bucket')
  assert.equal(totalPoints, 60)
  for (const bucket of snapshot.by_platform) {
    assert.equal(bucket.max_points, bucket.scenarios * 10)
    assert.deepEqual(Object.keys(bucket.toObject()).sort(),
      ['key', 'label', 'max_points', 'points', 'scenarios'])
  }
})

it('family aggregates are derived from the pinned definitions', async () => {
  await reset()
  const { profile } = await signIn()
  await completeAttemptWithScores(profile._id, 6)

  const snapshot = await getProgressSnapshot(profile._id)
  const totalScenarios = snapshot.by_family.reduce((n, b) => n + b.scenarios, 0)
  assert.equal(totalScenarios, 10)
  assert.ok(snapshot.by_family.length > 0)

  // Each family key must be a real canonical family from the bank, not an invented label.
  const known = new Set(await ScenarioDefinition.distinct('canonical_family'))
  for (const bucket of snapshot.by_family) {
    assert.ok(known.has(bucket.key), `unknown family "${bucket.key}"`)
    assert.ok(bucket.label && bucket.label.length > 0)
  }
})

it('aggregates accumulate across attempts rather than being replaced', async () => {
  await reset()
  const { profile } = await signIn()
  await completeAttemptWithScores(profile._id, 5)
  await completeAttemptWithScores(profile._id, 5)

  const snapshot = await getProgressSnapshot(profile._id)
  assert.equal(snapshot.by_platform.reduce((n, b) => n + b.scenarios, 0), 20)
  assert.equal(snapshot.by_platform.reduce((n, b) => n + b.points, 0), 100)
})

it('one learner never sees another learner in their own aggregates', async () => {
  await reset()
  const a = await signIn('Learner A')
  const b = await signIn('Learner B')
  await completeAttemptWithScores(a.profile._id, 9)
  await completeAttemptWithScores(b.profile._id, 3)

  const snapshotA = await getProgressSnapshot(a.profile._id)
  const snapshotB = await getProgressSnapshot(b.profile._id)
  assert.equal(snapshotA.attempt_count, 1)
  assert.equal(snapshotA.best_score, 90)
  assert.equal(snapshotB.attempt_count, 1)
  assert.equal(snapshotB.best_score, 30)
})

/* ------------------------------------------------------------------ *
 * 11-15  idempotency and the authority boundary
 * ------------------------------------------------------------------ */

it('completing an attempt refreshes the snapshot exactly once', async () => {
  await reset()
  const { profile } = await signIn()
  await completeAttemptWithScores(profile._id, 8)

  // No read has happened yet: completion itself must have written the snapshot.
  const stored = await ProgressSnapshot.findOne({ profile_id: profile._id })
  assert.ok(stored, 'completion did not refresh the snapshot')
  assert.equal(stored.attempt_count, 1)
})

it('completing the same attempt again does not count it twice', async () => {
  await reset()
  const { profile } = await signIn()
  const attempt = await completeAttemptWithScores(profile._id, 8)

  for (let i = 0; i < 4; i += 1) await completeAttempt(attempt)

  const snapshot = await getProgressSnapshot(profile._id)
  assert.equal(snapshot.attempt_count, 1, 'a retried completion double-counted')
  assert.equal(snapshot.last_score, 80)
  assert.equal(await ProgressSnapshot.countDocuments({ profile_id: profile._id }), 1)
})

it('rebuilding repeatedly is deterministic', async () => {
  await reset()
  const { profile } = await signIn()
  await completeAttemptWithScores(profile._id, 7)

  const first = (await rebuildProgressSnapshot(profile._id)).toCandidateJSON()
  const second = (await rebuildProgressSnapshot(profile._id)).toCandidateJSON()
  const third = (await rebuildProgressSnapshot(profile._id)).toCandidateJSON()

  // Everything but the regeneration stamp must be identical.
  const stable = ({ generated_at: _ignored, ...rest }) => rest
  assert.deepEqual(stable(second), stable(first))
  assert.deepEqual(stable(third), stable(first))
  assert.ok(third.generated_at >= first.generated_at)
})

it('a stale snapshot is repaired on read rather than served', async () => {
  await reset()
  const { profile } = await signIn()
  await completeAttemptWithScores(profile._id, 7)

  // Simulate a refresh that never landed - the completion is authoritative, the cache is not.
  await ProgressSnapshot.updateOne({ profile_id: profile._id },
    { $set: { attempt_count: 0, last_score: null, best_score: null } })

  const snapshot = await getProgressSnapshot(profile._id)
  assert.equal(snapshot.attempt_count, 1, 'a stale snapshot must not be served')
  assert.equal(snapshot.last_score, 70)
})

it('the snapshot never becomes the score authority', async () => {
  await reset()
  const { profile } = await signIn()
  const attempt = await completeAttemptWithScores(profile._id, 7)

  // Corrupt the derived cache; the attempt and its runs must be unmoved.
  await ProgressSnapshot.updateOne({ profile_id: profile._id }, { $set: { best_score: 100 } })

  const fresh = await Attempt.findById(attempt._id)
  assert.equal(fresh.total_score, 70, 'the attempt score was influenced by the snapshot')
  const runs = await ScenarioRun.find({ attempt_id: attempt._id })
  assert.equal(runs.reduce((n, r) => n + r.score_0_10, 0), 70)

  // And the next read repairs the cache from the authority.
  const repaired = await rebuildProgressSnapshot(profile._id)
  assert.equal(repaired.best_score, 70)
})

/* ------------------------------------------------------------------ *
 * 16-21  the HTTP surface
 * ------------------------------------------------------------------ */

it('a learner can read their own progress', async () => {
  await reset()
  const { cookie, profile } = await signIn()
  await completeAttemptWithScores(profile._id, 8)

  const res = await call('/progress', { cookie })
  assert.equal(res.status, 200)
  assert.equal(res.data.progress.attempt_count, 1)
  assert.equal(res.data.progress.last_score, 80)
  assert.equal(res.data.progress.best_score, 80)
  assert.equal(res.data.progress.max_score, 100)
})

it('progress requires a session', async () => {
  const res = await call('/progress')
  assert.equal(res.status, 401)
})

it('the endpoint answers for the session holder, and takes no profile parameter', async () => {
  await reset()
  const a = await signIn('Learner A')
  const b = await signIn('Learner B')
  await completeAttemptWithScores(a.profile._id, 9)
  await completeAttemptWithScores(b.profile._id, 2)

  const asB = await call('/progress', { cookie: b.cookie })
  assert.equal(asB.data.progress.best_score, 20, 'B received progress that was not theirs')

  // There is no parameter to smuggle another profile id through.
  const injected = await call(`/progress?profile_id=${a.profile._id}`, { cookie: b.cookie })
  assert.equal(injected.data.progress.best_score, 20)
})

it('the response carries no identifier, ledger, scoring internal or classification', async () => {
  await reset()
  const { cookie, profile } = await signIn()
  await completeAttemptWithScores(profile._id, 8)

  const res = await call('/progress', { cookie })
  const text = JSON.stringify(res.data)

  assert.ok(!text.includes(profile._id.toString()), 'the profile ObjectId was published')
  assert.ok(!/\b[0-9a-f]{24}\b/.test(text), 'an ObjectId reached the learner')
  for (const field of ['profile_id', '_id', '__v', 'seed', 'selection', 'scenario_sequence',
    'disposition', 'difficulty', 'level', 'canonical_triggers', 'trigger',
    'expected_safe_behavior', 'points_delta', 'event_code', 'intent_key', 'outcome_code',
    'evaluation', 'identifier', 'seenScenarios', 'metadata']) {
    assert.ok(!text.includes(`"${field}"`), `the progress response exposed "${field}"`)
  }
})

it('the published buckets name a platform and a family, never a scenario', async () => {
  await reset()
  const { cookie, profile } = await signIn()
  await completeAttemptWithScores(profile._id, 8)

  const res = await call('/progress', { cookie })
  const { by_platform: platforms, by_family: families } = res.data.progress

  const scenarioIds = await Attempt.findOne({ profile_id: profile._id })
    .then((a) => a.scenario_sequence.map((s) => s.scenario_id))
  const text = JSON.stringify({ platforms, families })
  for (const scenarioId of scenarioIds) {
    assert.ok(!text.includes(`"${scenarioId}"`), `bucket named scenario ${scenarioId}`)
  }
  for (const bucket of [...platforms, ...families]) {
    assert.deepEqual(Object.keys(bucket).sort(),
      ['key', 'label', 'max_points', 'points', 'scenarios'])
  }
})

it('an archived profile cannot read progress either', async () => {
  await reset()
  const { cookie, profile } = await signIn()
  await completeAttemptWithScores(profile._id, 8)
  await Candidate.updateOne({ _id: profile._id }, { $set: { archived: true } })

  const res = await call('/progress', { cookie })
  assert.equal(res.status, 401, 'an archived profile must stop being usable immediately')
})
