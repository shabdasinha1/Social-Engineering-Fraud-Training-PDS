import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import {
  ASSESSMENT_TIME_LIMIT_MS,
  EXPIRED_OUTCOME_CODE,
  RUN_EXPIRED_EVENT_CODE,
} from '../src/constants/attemptTiming.js'
import { OUTCOME_CLASSES } from '../src/constants/resultProjection.js'
import { Attempt } from '../src/models/Attempt.js'
import { ProgressSnapshot } from '../src/models/ProgressSnapshot.js'
import { ScenarioDefinition } from '../src/models/ScenarioDefinition.js'
import { ScenarioEvent } from '../src/models/ScenarioEvent.js'
import { ScenarioRun } from '../src/models/ScenarioRun.js'
import {
  assertAttemptLive,
  enforceDeadline,
  expireAttempt,
  expireDueAttempts,
  isExpirable,
  isPastDeadline,
  recoverExpiredAttemptsOnStartup,
  remainingMs,
  startExpirySweeper,
  stopExpirySweeper,
} from '../src/services/attemptExpiryService.js'
import { buildAttemptResult, classifyOutcome } from '../src/services/attemptResultService.js'
import { completeAttempt, createAttempt } from '../src/services/attemptService.js'
import { getProgressSnapshot } from '../src/services/progressService.js'
import {
  loadSourceScenarios,
  loadTaxonomies,
  toScenarioDefinition,
} from '../src/services/scenarioDefinitionImportService.js'
import { submitIntent } from '../src/services/scenarioEngineService.js'
import { detectTransactionSupport } from '../src/utils/transactions.js'

/**
 * IMMERSIVE-001 - the authoritative 90-minute assessment timer.
 *
 * Real transactions, real documents, real concurrency. Requires a replica set and SKIPS
 * loudly rather than mocking, exactly like the other engine suites:
 *
 *   npm run test:engine
 *
 * ### How expiry is simulated
 *
 * NEVER by waiting, and never by shortening the production limit. Every test back-dates
 * `expires_at` with `Attempt.updateOne`, which is a direct collection write and therefore
 * bypasses the model's freeze hook. That is deliberate and is the whole trick: a fixture
 * may construct any state it likes, while no application code path can move a deadline -
 * a `save()` carrying a modified `expires_at` throws, and there is a test below for that.
 */

const URI = process.env.ENGINE_TEST_MONGO_URI
const PROFILE = new mongoose.Types.ObjectId('0000000000000000000000f1')
const OTHER_PROFILE = new mongoose.Types.ObjectId('0000000000000000000000f2')

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
      ready = true
    }
  } catch (error) {
    skipReason = `could not connect: ${error.message.split('\n')[0]}`
  }
}

if (!ready) {
  // eslint-disable-next-line no-console
  console.warn(`\n[IMMERSIVE-001] assessment timer tests SKIPPED - ${skipReason}\n`)
}

const it = (name, fn) => test(name, { skip: ready ? false : skipReason }, fn)

async function reset() {
  await Promise.all([
    Attempt.deleteMany({}),
    ScenarioRun.deleteMany({}),
    ScenarioEvent.deleteMany({}),
    ProgressSnapshot.deleteMany({}),
  ])
}

test.after(async () => {
  stopExpirySweeper()
  if (ready) {
    await reset()
    await ScenarioDefinition.deleteMany({})
    await mongoose.disconnect()
  }
})

/** Moves a deadline into the past. A fixture-only path - see the suite header. */
async function backdate(attemptId, msAgo = 1000) {
  const past = new Date(Date.now() - msAgo)
  await Attempt.updateOne({ _id: attemptId }, { $set: { expires_at: past } })
  return past
}

/** Plays one run to a resolution so it carries a real, earned score. */
async function resolveRunFully(run) {
  const steps = [
    ['open_item', 'notify'], ['read', 'open'], ['inspect_sender', 'inspect'],
    ['safe_pivot', 'branch'], ['verify_trusted_directory', 'verify'], ['resolve_report', 'resolve'],
  ]
  for (const [intent, stage] of steps) {
    await submitIntent({
      runId: run._id, intent, intentKey: `${run._id}:${intent}`, expectedStage: stage,
    })
  }
}

/** Earns partial credit on a run, then leaves it unresolved. */
async function partiallyWork(run) {
  for (const [intent, stage] of [['open_item', 'notify'], ['read', 'open'], ['inspect_sender', 'inspect']]) {
    await submitIntent({
      runId: run._id, intent, intentKey: `${run._id}:${intent}`, expectedStage: stage,
    })
  }
}

/* ================================================================== *
 * Model
 * ================================================================== */

it('a new attempt carries the default 30-minute deadline derived from the server clock', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })

  assert.equal(attempt.time_limit_ms, ASSESSMENT_TIME_LIMIT_MS)
  assert.equal(ASSESSMENT_TIME_LIMIT_MS, 30 * 60 * 1000, 'the default limit is 30 minutes')
  assert.equal(
    attempt.expires_at.getTime() - attempt.started_at.getTime(),
    ASSESSMENT_TIME_LIMIT_MS,
    'expires_at must be exactly started_at + the limit',
  )
  assert.equal(attempt.end_reason, null)
  assert.equal(attempt.expired_at, null)
  assert.equal(attempt.unresolved_at_expiry, null)
})

it('the deadline is frozen once the attempt exists', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })

  /**
   * The realistic attack: move BOTH values so they stay internally consistent, which is
   * what someone trying to buy another hour would have to do. Only the freeze hook can
   * catch this - the arithmetic still checks out.
   */
  const extended = await Attempt.findById(attempt._id)
  extended.time_limit_ms = ASSESSMENT_TIME_LIMIT_MS + 60 * 60 * 1000
  extended.expires_at = new Date(extended.started_at.getTime() + extended.time_limit_ms)
  await assert.rejects(() => extended.save(), /deadline is frozen/,
    'a self-consistent extension must still be refused')

  // Moving one value alone is refused too.
  const shifted = await Attempt.findById(attempt._id)
  shifted.expires_at = new Date(Date.now() + 999 * 60 * 1000)
  await assert.rejects(() => shifted.save(), /deadline is frozen|expires_at must equal/)

  const fresh = await Attempt.findById(attempt._id)
  assert.equal(fresh.time_limit_ms, ASSESSMENT_TIME_LIMIT_MS, 'the stored limit is unchanged')
  assert.equal(fresh.expires_at.getTime() - fresh.started_at.getTime(), ASSESSMENT_TIME_LIMIT_MS)
})

it('a NEW attempt may not be created with a deadline that does not match its limit', async () => {
  await reset()
  const base = await createAttempt({ profileId: PROFILE })
  const doc = base.attempt.toObject()
  delete doc._id

  const mismatched = new Attempt({
    ...doc,
    started_at: new Date('2026-09-09T10:00:00.000Z'),
    time_limit_ms: ASSESSMENT_TIME_LIMIT_MS,
    expires_at: new Date('2026-09-09T11:59:00.000Z'), // not start + limit
  })
  await assert.rejects(() => mismatched.validate(), /expires_at must equal started_at/)

  const halfSet = new Attempt({ ...doc, time_limit_ms: ASSESSMENT_TIME_LIMIT_MS, expires_at: null })
  await assert.rejects(() => halfSet.validate(), /must be set together/)
})

it('an attempt created before the timer existed has no deadline and never expires', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })
  // Exactly the shape of the five production attempts: no timer fields at all.
  await Attempt.updateOne({ _id: attempt._id },
    { $unset: { expires_at: '', time_limit_ms: '' } })

  const legacy = await Attempt.findById(attempt._id)
  assert.equal(legacy.expires_at, null)
  assert.equal(isPastDeadline(legacy), false, 'null must mean "no deadline", never "long overdue"')
  assert.equal(isExpirable(legacy), false)
  assert.equal(remainingMs(legacy), null)

  const swept = await expireDueAttempts()
  assert.equal(swept.expired, 0, 'the sweeper must never touch a null-deadline attempt')
  assert.equal((await Attempt.findById(attempt._id)).status, 'in_progress')
})

/* ================================================================== *
 * Deadline arithmetic and boundaries
 * ================================================================== */

it('an attempt is live before the deadline and expirable at or after it', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })
  const deadline = attempt.expires_at

  assert.equal(isExpirable(attempt, new Date(deadline.getTime() - 1)), false, 'one ms before')
  assert.equal(isExpirable(attempt, new Date(deadline.getTime())), true, 'exactly at the deadline')
  assert.equal(isExpirable(attempt, new Date(deadline.getTime() + 1)), true, 'one ms after')

  assert.equal(remainingMs(attempt, new Date(deadline.getTime() - 5000)), 5000)
  assert.equal(remainingMs(attempt, deadline), 0)
  assert.equal(remainingMs(attempt, new Date(deadline.getTime() + 60_000)), 0,
    'remaining time is clamped at zero, never negative')
})

/* ================================================================== *
 * Expiry - C2 semantics
 * ================================================================== */

it('expiry with nothing resolved scores zero and invents no decisions', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })
  await backdate(attempt._id)

  const outcome = await expireAttempt(attempt._id)
  assert.equal(outcome.changed, true)
  assert.equal(outcome.expired_runs, 10)

  const finalised = await Attempt.findById(attempt._id)
  assert.equal(finalised.status, 'completed')
  assert.equal(finalised.end_reason, 'expired')
  assert.equal(finalised.total_score, 0)
  assert.equal(finalised.unresolved_at_expiry, 10)
  assert.ok(finalised.expired_at >= finalised.expires_at, 'expired_at is at or after the deadline')

  const runs = await ScenarioRun.find({ attempt_id: attempt._id })
  assert.equal(runs.length, 10)
  for (const run of runs) {
    assert.equal(run.status, 'resolved', 'section 5 requires ten resolved scenarios')
    assert.equal(run.score_0_10, 0)
    assert.equal(run.outcome_code, EXPIRED_OUTCOME_CODE)
    // C2: no fabricated learner action.
    assert.ok(!['resolve_report', 'resolve_block', 'resolve_continue', 'resolve_retain',
      'resolve_ignore'].includes(run.outcome_code))
  }
})

it('expiry preserves every point already earned and adds none', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })
  const runs = await ScenarioRun.find({ attempt_id: attempt._id }).sort({ ordinal: 1 })

  await resolveRunFully(runs[0])
  const resolvedScore = (await ScenarioRun.findById(runs[0]._id)).score_0_10
  assert.ok(resolvedScore > 0, 'the fixture must actually earn something')

  await partiallyWork(runs[1])
  const partialBefore = (await ScenarioRun.findById(runs[1]._id)).score_running
  assert.ok(partialBefore > 0, 'the partial run must have earned INSPECT_CONTEXT')

  await backdate(attempt._id)
  await expireAttempt(attempt._id)

  const after = await ScenarioRun.find({ attempt_id: attempt._id }).sort({ ordinal: 1 })
  assert.equal(after[0].score_0_10, resolvedScore, 'a resolved run keeps its own score')
  assert.notEqual(after[0].outcome_code, EXPIRED_OUTCOME_CODE, 'and keeps its own outcome')
  assert.equal(after[1].score_0_10, partialBefore, 'earned evidence survives, clamped')
  assert.equal(after[1].outcome_code, EXPIRED_OUTCOME_CODE)
  assert.equal(after[2].score_0_10, 0, 'an untouched run scores zero naturally')

  const finalised = await Attempt.findById(attempt._id)
  assert.equal(finalised.total_score, resolvedScore + partialBefore)
  assert.equal(finalised.unresolved_at_expiry, 9)
})

it('expiry writes exactly one zero-point ledger entry per unresolved run', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })
  await backdate(attempt._id)
  await expireAttempt(attempt._id)

  const events = await ScenarioEvent.find({ event_code: RUN_EXPIRED_EVENT_CODE })
  assert.equal(events.length, 10)
  for (const event of events) {
    assert.equal(event.points_delta, 0, 'running out of time neither credits nor penalises')
    assert.equal(event.metadata.resolution_code, EXPIRED_OUTCOME_CODE)
    assert.ok(String(event.intent_key).startsWith('expiry:'))
  }
})

it('an attempt whose ten runs all resolved a moment before expiry completes normally', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })
  const runs = await ScenarioRun.find({ attempt_id: attempt._id }).sort({ ordinal: 1 })
  for (const run of runs) await resolveRunFully(run)

  const completed = await completeAttempt(await Attempt.findById(attempt._id))
  assert.equal(completed.end_reason, 'learner_completed')
  assert.equal(completed.unresolved_at_expiry, null)

  // The deadline passing afterwards must not rewrite a finished attempt.
  await backdate(attempt._id)
  const outcome = await expireAttempt(attempt._id)
  assert.equal(outcome.changed, false)
  const still = await Attempt.findById(attempt._id)
  assert.equal(still.end_reason, 'learner_completed')
  assert.equal(still.total_score, completed.total_score)
})

/* ================================================================== *
 * Idempotency and concurrency
 * ================================================================== */

it('expiring twice changes nothing and writes nothing', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })
  await backdate(attempt._id)

  const first = await expireAttempt(attempt._id)
  const snapshot = await Attempt.findById(attempt._id)
  const eventsAfterFirst = await ScenarioEvent.countDocuments({})

  const second = await expireAttempt(attempt._id)
  assert.equal(first.changed, true)
  assert.equal(second.changed, false)

  const again = await Attempt.findById(attempt._id)
  assert.equal(await ScenarioEvent.countDocuments({}), eventsAfterFirst, 'no duplicate ledger entry')
  assert.equal(again.total_score, snapshot.total_score)
  assert.deepEqual(again.expired_at, snapshot.expired_at, 'expired_at is not rewritten')
})

it('concurrent expiries settle on exactly one finalisation', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })
  await backdate(attempt._id)

  const results = await Promise.allSettled([
    expireAttempt(attempt._id), expireAttempt(attempt._id), expireAttempt(attempt._id),
  ])
  const changed = results.filter((r) => r.status === 'fulfilled' && r.value.changed)
  assert.equal(changed.length, 1, 'exactly one caller may finalise the attempt')
  assert.equal(await ScenarioEvent.countDocuments({ event_code: RUN_EXPIRED_EVENT_CODE }), 10)
})

it('expiry racing completion cannot double-score or produce two end reasons', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })
  const runs = await ScenarioRun.find({ attempt_id: attempt._id }).sort({ ordinal: 1 })
  for (const run of runs) await resolveRunFully(run)
  await backdate(attempt._id)

  const [a, b] = await Promise.allSettled([
    completeAttempt(await Attempt.findById(attempt._id)),
    expireAttempt(attempt._id),
  ])
  assert.ok(a.status === 'fulfilled' || b.status === 'fulfilled')

  const finalised = await Attempt.findById(attempt._id)
  assert.equal(finalised.status, 'completed')
  assert.ok(['learner_completed', 'expired'].includes(finalised.end_reason))
  const sum = (await ScenarioRun.find({ attempt_id: attempt._id }))
    .reduce((t, r) => t + r.score_0_10, 0)
  assert.equal(finalised.total_score, sum, 'the total always equals the sum of run scores')
})

/* ================================================================== *
 * Guards
 * ================================================================== */

it('the guard finalises an overdue attempt and refuses the action', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })
  await backdate(attempt._id)

  await assert.rejects(
    async () => assertAttemptLive(await Attempt.findById(attempt._id)),
    (error) => {
      assert.equal(error.code, 'ATTEMPT_EXPIRED')
      assert.equal(error.status, 409)
      assert.equal(error.details.result_available, true)
      return true
    },
  )
  assert.equal((await Attempt.findById(attempt._id)).status, 'completed')
})

it('the guard leaves a live attempt completely alone', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })
  const before = await Attempt.findById(attempt._id)
  const settled = await assertAttemptLive(before)
  assert.equal(settled.status, 'in_progress')
  assert.equal(settled.end_reason, null)
  assert.equal(await ScenarioEvent.countDocuments({ event_code: RUN_EXPIRED_EVENT_CODE }), 0)
})

it('an expired attempt refuses new scenario actions', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })
  const run = await ScenarioRun.findOne({ attempt_id: attempt._id, ordinal: 1 })
  await backdate(attempt._id)
  await expireAttempt(attempt._id)

  await assert.rejects(
    () => submitIntent({
      runId: run._id, intent: 'open_item', intentKey: 'after-expiry', expectedStage: 'notify',
    }),
    /already resolved|not active/i,
    'the engine refuses a run the expiry already closed',
  )
})

/* ================================================================== *
 * Result projection
 * ================================================================== */

it('an expired legitimate scenario is NOT reported as a false positive', async () => {
  assert.equal(
    classifyOutcome({ disposition: 'legitimate', outcomeCode: EXPIRED_OUTCOME_CODE, eventCodes: [] }),
    OUTCOME_CLASSES.NOT_RESOLVED,
  )
  assert.equal(
    classifyOutcome({ disposition: 'malicious', outcomeCode: EXPIRED_OUTCOME_CODE, eventCodes: [] }),
    OUTCOME_CLASSES.NOT_RESOLVED,
  )
  // Ordinary outcomes are untouched by the new branch.
  assert.equal(
    classifyOutcome({ disposition: 'malicious', outcomeCode: 'resolve_report', eventCodes: [] }),
    OUTCOME_CLASSES.HANDLED_SAFELY,
  )
})

it('the timed-out result states the timeout and stays integrity-clean', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })
  const runs = await ScenarioRun.find({ attempt_id: attempt._id }).sort({ ordinal: 1 })
  await resolveRunFully(runs[0])
  await backdate(attempt._id)
  await expireAttempt(attempt._id)

  // buildAttemptResult runs assertResultIntegrity internally; reaching a value proves it.
  const result = await buildAttemptResult(await Attempt.findById(attempt._id))
  assert.equal(result.timed_out, true)
  assert.equal(result.end_reason, 'expired')
  assert.equal(result.time_limit_ms, ASSESSMENT_TIME_LIMIT_MS)
  assert.equal(result.unresolved_at_expiry, 9)
  assert.equal(result.scenarios_resolved, 10, 'all ten are closed')
  assert.equal(result.summary.not_resolved, 9, 'nine were closed by the clock, not answered')
  assert.equal(result.summary.false_positives + result.summary.missed_threats
    + result.summary.handled_safely + result.summary.unsafe_handling, 1,
  'only the one genuinely resolved scenario carries a judged outcome')

  const expiredPaths = result.scenarios.filter((s) => s.outcome_code === EXPIRED_OUTCOME_CODE)
  assert.equal(expiredPaths.length, 9)
  for (const scenario of expiredPaths) {
    assert.equal(scenario.outcome_class, OUTCOME_CLASSES.NOT_RESOLVED)
    assert.ok(scenario.path.some((step) => step.action === 'time_ran_out'),
      'the replay must explain why the timeline stops')
  }
})

it('a normally completed result is not marked as timed out', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })
  for (const run of await ScenarioRun.find({ attempt_id: attempt._id })) await resolveRunFully(run)
  const completed = await completeAttempt(await Attempt.findById(attempt._id))

  const result = await buildAttemptResult(completed)
  assert.equal(result.timed_out, false)
  assert.equal(result.end_reason, 'learner_completed')
  assert.equal(result.unresolved_at_expiry, null)
  assert.equal(result.summary.not_resolved, 0)
})

/* ================================================================== *
 * ProgressSnapshot - C3
 * ================================================================== */

it('a timed-out attempt counts once as an attempt and an exposure', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })
  const runs = await ScenarioRun.find({ attempt_id: attempt._id }).sort({ ordinal: 1 })
  await resolveRunFully(runs[0])
  await backdate(attempt._id)
  await expireAttempt(attempt._id)

  const progress = await getProgressSnapshot(PROFILE)
  assert.equal(progress.attempt_count, 1, 'C3: a timed-out assessment is an attempt')
  assert.ok(progress.last_score !== null, 'and it produces a real last score')

  // Repeating the expiry must not double-count: the snapshot is recomputed, not incremented.
  await expireAttempt(attempt._id)
  const again = await getProgressSnapshot(PROFILE)
  assert.equal(again.attempt_count, 1)
  assert.equal(again.last_score, progress.last_score)
  assert.equal(again.best_score, progress.best_score)
})

it('a timed-out attempt does not displace a better completed score', async () => {
  await reset()
  const first = await createAttempt({ profileId: OTHER_PROFILE })
  for (const run of await ScenarioRun.find({ attempt_id: first.attempt._id })) {
    await resolveRunFully(run)
  }
  const good = await completeAttempt(await Attempt.findById(first.attempt._id))

  const second = await createAttempt({ profileId: OTHER_PROFILE })
  await backdate(second.attempt._id)
  await expireAttempt(second.attempt._id)

  const progress = await getProgressSnapshot(OTHER_PROFILE)
  assert.equal(progress.attempt_count, 2)
  assert.equal(progress.best_score, good.total_score, 'best_score stays authoritative')
  assert.equal(progress.last_score, 0, 'last_score reflects the most recent, timed-out attempt')
})

/* ================================================================== *
 * The abandoned-attempt blocker
 * ================================================================== */

it('an overdue attempt stops blocking the learner once the deadline is enforced', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })

  // Before enforcement, the existing rule still refuses a second attempt.
  await assert.rejects(() => createAttempt({ profileId: PROFILE }),
    /already has an attempt in progress/)

  await backdate(attempt._id)
  const { expired } = await enforceDeadline(await Attempt.findById(attempt._id))
  assert.equal(expired, true)

  const next = await createAttempt({ profileId: PROFILE })
  assert.ok(next.attempt, 'the learner is no longer permanently blocked')
  assert.notEqual(String(next.attempt._id), String(attempt._id))
  assert.equal((await Attempt.findById(attempt._id)).status, 'completed')
})

/* ================================================================== *
 * Sweeper, restart and recovery
 * ================================================================== */

it('the sweeper finalises overdue attempts and ignores live ones', async () => {
  await reset()
  const overdue = await createAttempt({ profileId: PROFILE })
  const live = await createAttempt({ profileId: OTHER_PROFILE })
  await backdate(overdue.attempt._id)

  const outcome = await expireDueAttempts()
  assert.equal(outcome.expired, 1)
  assert.equal((await Attempt.findById(overdue.attempt._id)).status, 'completed')
  assert.equal((await Attempt.findById(live.attempt._id)).status, 'in_progress',
    'a live attempt must never be swept')

  const second = await expireDueAttempts()
  assert.equal(second.expired, 0, 'a repeated sweep is a no-op')
})

it('the sweep is bounded so a backlog cannot monopolise the process', async () => {
  await reset()
  const profiles = [PROFILE, OTHER_PROFILE, new mongoose.Types.ObjectId()]
  for (const profileId of profiles) {
    const { attempt } = await createAttempt({ profileId })
    await backdate(attempt._id)
  }
  const outcome = await expireDueAttempts({ limit: 2 })
  assert.equal(outcome.examined, 2, 'the batch limit is respected')
  assert.equal(outcome.expired, 2)
  assert.equal(await Attempt.countDocuments({ status: 'in_progress' }), 1, 'the rest waits')
})

it('startup recovery finalises an attempt whose deadline passed while the process was down', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })
  // The machine was off for two hours: the deadline is absolute, not elapsed-since-boot.
  await backdate(attempt._id, 2 * 60 * 60 * 1000)

  const outcome = await recoverExpiredAttemptsOnStartup()
  assert.equal(outcome.expired, 1)
  const finalised = await Attempt.findById(attempt._id)
  assert.equal(finalised.status, 'completed')
  assert.equal(finalised.end_reason, 'expired')
})

it('starting the sweeper twice creates one timer, and stopping is always safe', async () => {
  stopExpirySweeper()
  const stop = startExpirySweeper({ intervalMs: 60_000 })
  const again = startExpirySweeper({ intervalMs: 60_000 })
  assert.equal(typeof stop, 'function')
  assert.equal(typeof again, 'function')
  stopExpirySweeper()
  stopExpirySweeper() // must not throw when already stopped
})

/* ================================================================== *
 * Multiple tabs - one deadline, discovered by whoever asks next
 * ================================================================== */

it('every reader sees one identical deadline, and the second discovers the timeout', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })

  // Two "tabs" reading the same attempt independently.
  const tabA = await Attempt.findById(attempt._id)
  const tabB = await Attempt.findById(attempt._id)
  assert.equal(tabA.expires_at.getTime(), tabB.expires_at.getTime(),
    'a deadline is a server fact, so no two readers can disagree about it')
  assert.equal(tabA.toCandidateJSON().expires_at.getTime(),
    tabB.toCandidateJSON().expires_at.getTime())

  await backdate(attempt._id)
  // Tab A acts first and triggers the finalisation.
  await assert.rejects(async () => assertAttemptLive(await Attempt.findById(attempt._id)))

  // Tab B is holding a stale in-progress document; its next call discovers the truth.
  const { expired, attempt: settled } = await enforceDeadline(tabB)
  assert.equal(expired, false, 'the attempt was already finalised, so there is nothing to enforce')
  assert.equal(settled.status, 'in_progress', 'the stale copy is what tab B still holds...')
  const authoritative = await Attempt.findById(attempt._id)
  assert.equal(authoritative.status, 'completed', '...but the database is authoritative')
  assert.equal(await ScenarioEvent.countDocuments({ event_code: RUN_EXPIRED_EVENT_CODE }), 10,
    'and the second tab caused no second expiry')
})

/* ================================================================== *
 * The candidate contract
 * ================================================================== */

it('the learner payload carries the deadline and a clock reference, and no secrets', async () => {
  await reset()
  const { attempt } = await createAttempt({ profileId: PROFILE })
  const json = attempt.toCandidateJSON()

  assert.ok(json.expires_at instanceof Date)
  assert.ok(json.server_now instanceof Date)
  assert.equal(json.end_reason, null)
  assert.equal(json.expires_at.getTime() - new Date(json.started_at).getTime(),
    ASSESSMENT_TIME_LIMIT_MS)

  const text = JSON.stringify(json)
  assert.ok(!text.includes(attempt.seed))
  for (const hidden of ['seed', 'selection', 'scenario_sequence', 'profile_id',
    'time_limit_ms', 'expired_at', 'unresolved_at_expiry']) {
    assert.ok(!(hidden in json), `the learner payload must not carry "${hidden}"`)
  }
})
