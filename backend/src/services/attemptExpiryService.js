import {
  ATTEMPT_EXPIRED_CODE,
  ATTEMPT_EXPIRED_MESSAGE,
  EXPIRED_OUTCOME_CODE,
  EXPIRY_SWEEP_BATCH,
  EXPIRY_SWEEP_INTERVAL_MS,
  RUN_EXPIRED_EVENT_CODE,
} from '../constants/attemptTiming.js'
import { SCENARIO_POINTS } from '../constants/scenarioDefinition.js'
import { Attempt } from '../models/Attempt.js'
import { ScenarioEvent } from '../models/ScenarioEvent.js'
import { ScenarioRun } from '../models/ScenarioRun.js'
import { ApiError } from '../utils/ApiError.js'
import { assertTransactionSupport, withEngineTransaction } from '../utils/transactions.js'
import { refreshProgressAfterCompletion } from './progressService.js'

/**
 * Authoritative assessment expiry (IMMERSIVE-001).
 *
 * The client's 90-minute limit, enforced entirely server-side. Nothing in this file reads
 * a clock the client controls, and nothing the client can send reaches it.
 *
 * ### The three layers, and which one is load-bearing
 *
 *   1. LAZY GUARD   - `assertAttemptLive()` on every attempt route. THIS is correctness.
 *   2. SWEEPER      - `startExpirySweeper()`, every 30s. Finalises attempts nobody is
 *                     looking at, which is the only way "the browser was closed" works.
 *   3. STARTUP SWEEP- one pass on boot, so a process that was down over a deadline still
 *                     finalises it. The deadline is an absolute timestamp, never elapsed
 *                     time, so a machine switched off for two hours needs no special case.
 *
 * Layers 2 and 3 are convenience. Disable both and a learner still cannot act after the
 * deadline, because layer 1 runs inside the request that would carry the action.
 *
 * ### C2, as approved: what happens to an unresolved scenario
 *
 * "Preserve all score already legitimately earned. Do not fabricate a decision for an
 * unresolved scenario. Unresolved work at expiry receives no additional earned points."
 *
 * That is exactly `clamp(score_running, 0, 10)` - the engine's OWN resolution rule, reused
 * verbatim rather than reimplemented:
 *
 *   - a run never opened holds `score_running = 0` and scores 0. Nothing is invented.
 *   - a run part-way through keeps what its ledger shows it earned (an INSPECT_CONTEXT
 *     +2, say) and gains nothing further - it cannot earn RESOLVE_CORRECT, because the
 *     learner never resolved it.
 *   - `outcome_code` is `resolve_expired`, which is deliberately NOT one of the six
 *     resolve intents and is absent from `CORRECT_RESOLUTION`. No code path can read it as
 *     a decision the learner made, and the result projection gives it its own class rather
 *     than scoring it right or wrong.
 *
 * The run is `resolved` afterwards because section 5 requires "exactly 10 resolved
 * scenarios" and `assertResultIntegrity()` enforces it. "Resolved" here means closed, not
 * answered; `outcome_code` carries the difference.
 */

/* ------------------------------------------------------------------ *
 * Predicates
 * ------------------------------------------------------------------ */

/**
 * Has this attempt's deadline passed?
 *
 * A null `expires_at` is NOT an expired attempt - it is an attempt created before the
 * limit existed, and it never expires. Treating null as "expired at the epoch" would have
 * silently finalised every historical record on the first sweep.
 */
export function isPastDeadline(attempt, now = new Date()) {
  if (!attempt?.expires_at) return false
  return attempt.expires_at.getTime() <= now.getTime()
}

/** True when the attempt is running and its deadline has passed. */
export function isExpirable(attempt, now = new Date()) {
  return attempt?.status === 'in_progress' && isPastDeadline(attempt, now)
}

/** Milliseconds left, or null when the attempt has no deadline. Never negative. */
export function remainingMs(attempt, now = new Date()) {
  if (!attempt?.expires_at) return null
  return Math.max(0, attempt.expires_at.getTime() - now.getTime())
}

/* ------------------------------------------------------------------ *
 * Finalisation
 * ------------------------------------------------------------------ */

/** The engine's clamp, applied to an expiring run exactly as a resolution would. */
function clampScenarioScore(value) {
  return Math.max(SCENARIO_POINTS.min, Math.min(SCENARIO_POINTS.max, value))
}

/**
 * Finalises one overdue attempt. Idempotent, concurrency-safe, and a no-op unless the
 * attempt is genuinely both in progress and past its deadline.
 *
 * ### Why the guard is inside the transaction
 *
 * The re-read under the session IS the concurrency control. Two callers can arrive at once
 * - a sweeper tick and a learner's last request, or two sweepers - and both run this
 * query; the one that commits second finds no document matching
 * `{ status: 'in_progress', expires_at: { $lte: now } }` and returns `changed: false`.
 * There is no lock and no external coordination, which is the same pattern
 * `completeAttempt()` and `resetAttempt()` already use.
 *
 * ### Why `intent_key` is deterministic
 *
 * `ScenarioEvent.intent_key` carries a unique index. `expiry:<attemptId>:<runId>` means a
 * second concurrent expiry collides on that index and aborts, instead of writing a
 * duplicate ledger entry - the ledger is the audit source the score is replayed from, so a
 * double write there would be worse than a failed expiry. It also makes a retry after a
 * crashed transaction free.
 */
export async function expireAttempt(attemptId, { now = new Date() } = {}) {
  await assertTransactionSupport()

  const { result } = await withEngineTransaction(async (session) => {
    const fresh = await Attempt.findOne({
      _id: attemptId,
      status: 'in_progress',
      expires_at: { $ne: null, $lte: now },
    }).session(session)

    // Already finalised, not due, or has no deadline. Nothing to do, nothing written.
    if (!fresh) return { changed: false, attempt: null, expired_runs: 0 }

    const outstanding = await ScenarioRun.find({
      attempt_id: fresh._id,
      status: { $ne: 'resolved' },
    }).sort({ ordinal: 1 }).session(session)

    for (const run of outstanding) {
      const sequence = run.last_sequence + 1

      await ScenarioEvent.create([{
        run_id: run._id,
        sequence,
        event_code: RUN_EXPIRED_EVENT_CODE,
        stage: run.current_stage,
        points_delta: 0,
        synthetic_target_id: null,
        intent_key: `expiry:${fresh._id}:${run._id}`,
        client_ts: null,
        elapsed_ms: null,
        server_ts: now,
        /**
         * `intent` is deliberately absent. `metadataSchema.intent` is enum-constrained to
         * the learner INTENTS vocabulary, and expiry is not something a learner intended -
         * putting a value there would have required widening the intent vocabulary the
         * engine validates client requests against. The transition and the resolution code
         * say everything that needs saying.
         */
        metadata: {
          transition: `${run.current_stage}->end`,
          resolution_code: EXPIRED_OUTCOME_CODE,
        },
      }], { session, ordered: true })

      run.last_sequence = sequence
      run.status = 'resolved'
      run.score_0_10 = clampScenarioScore(run.score_running)
      run.outcome_code = EXPIRED_OUTCOME_CODE
      run.resolved_at = now
      run.last_event_at = now
      await run.save({ session })
    }

    const all = await ScenarioRun.find({ attempt_id: fresh._id }).session(session)

    fresh.status = 'completed'
    fresh.completed_at = now
    fresh.expired_at = now
    fresh.end_reason = 'expired'
    fresh.unresolved_at_expiry = outstanding.length
    fresh.total_score = all.reduce((sum, run) => sum + (run.score_0_10 ?? 0), 0)
    await fresh.save({ session })

    return { changed: true, attempt: fresh, expired_runs: outstanding.length }
  })

  if (result.changed) {
    /**
     * C3: a timed-out assessment counts as an attempt and an exposure.
     *
     * Called AFTER the commit and deliberately outside the transaction, exactly as
     * `completeAttempt()` does and for the recorded reason: the snapshot is a derived read
     * model rebuilt by full recomputation, and it must never be able to abort a transition
     * that has already succeeded. Because it recomputes rather than increments, running it
     * twice cannot double-count - which is also what makes a retried expiry safe.
     */
    await refreshProgressAfterCompletion(result.attempt.profile_id)

    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
      attempt: 'attempt_expired',
      attempt_id: String(result.attempt._id),
      total_score: result.attempt.total_score,
      unresolved_at_expiry: result.expired_runs,
      expires_at: result.attempt.expires_at,
      expired_at: result.attempt.expired_at,
    }))
  }

  return result
}

/**
 * Route guard. Finalises the attempt if its deadline has passed, then reports what the
 * caller should do.
 *
 * Returns `{ expired, attempt }`. `expired` true means the attempt is now terminal and the
 * caller must not let the request proceed as an assessment action. The attempt returned is
 * the re-read, finalised document - never the stale one the caller was holding.
 */
export async function enforceDeadline(attempt) {
  if (!isExpirable(attempt)) return { expired: false, attempt }

  const outcome = await expireAttempt(attempt._id)
  const fresh = outcome.attempt ?? await Attempt.findById(attempt._id)
  return { expired: true, attempt: fresh ?? attempt }
}

/**
 * The guard for a MUTATING route: enforce, then refuse.
 *
 * Throws `409 ATTEMPT_EXPIRED` rather than the generic `ATTEMPT_NOT_IN_PROGRESS`, so the
 * frontend can send the learner to their result with an explanation instead of a dead end.
 * `result_available` tells it the result already exists - expiry finalises in the same
 * transaction, so there is never a window where the attempt is over but unreadable.
 */
export async function assertAttemptLive(attempt) {
  const { expired, attempt: fresh } = await enforceDeadline(attempt)
  if (expired) {
    throw ApiError.conflict(ATTEMPT_EXPIRED_CODE, ATTEMPT_EXPIRED_MESSAGE, {
      attempt_id: String(fresh._id),
      expires_at: fresh.expires_at,
      result_available: true,
    })
  }
  return fresh
}

/* ------------------------------------------------------------------ *
 * Sweeper
 * ------------------------------------------------------------------ */

/**
 * One bounded pass over overdue attempts. Safe to call at any time, from anywhere.
 *
 * Served by the `{ status: 1, expires_at: 1 }` index, so it is an index scan over the
 * in-progress attempts whose deadline has passed - not a collection scan.
 */
export async function expireDueAttempts({ now = new Date(), limit = EXPIRY_SWEEP_BATCH } = {}) {
  const due = await Attempt.find({
    status: 'in_progress',
    expires_at: { $ne: null, $lte: now },
  }).select('_id').limit(limit).lean()

  let expired = 0
  for (const { _id } of due) {
    try {
      const outcome = await expireAttempt(_id, { now })
      if (outcome.changed) expired += 1
    } catch (error) {
      // One bad attempt must not stop the sweep. The next tick retries it; expiry is
      // idempotent, so a retry costs nothing.
      // eslint-disable-next-line no-console
      console.error(JSON.stringify({
        attempt: 'expiry_failed', attempt_id: String(_id), message: error.message,
      }))
    }
  }
  return { examined: due.length, expired }
}

let sweepTimer = null
let sweepInFlight = false

/**
 * Starts the periodic sweeper. Returns a stop function.
 *
 * Three properties the tests depend on:
 *
 *   - NO OVERLAP. `sweepInFlight` means a slow sweep cannot be re-entered by the next
 *     tick, so two passes never process the same attempt concurrently.
 *   - DOES NOT HOLD THE PROCESS OPEN. `timer.unref()` keeps a forgotten interval from
 *     turning a finished test run into a hang.
 *   - IDEMPOTENT START. Calling twice does not create a second interval.
 */
export function startExpirySweeper({ intervalMs = EXPIRY_SWEEP_INTERVAL_MS } = {}) {
  if (sweepTimer) return stopExpirySweeper

  sweepTimer = setInterval(async () => {
    if (sweepInFlight) return
    sweepInFlight = true
    try {
      await expireDueAttempts()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(JSON.stringify({ attempt: 'expiry_sweep_failed', message: error.message }))
    } finally {
      sweepInFlight = false
    }
  }, intervalMs)

  sweepTimer.unref?.()
  return stopExpirySweeper
}

/** Stops the sweeper. Safe to call when it was never started. */
export function stopExpirySweeper() {
  if (!sweepTimer) return
  clearInterval(sweepTimer)
  sweepTimer = null
}

/**
 * Startup recovery: one sweep before the server accepts traffic.
 *
 * This is what makes a restart safe. An attempt whose deadline passed while the process
 * was down is finalised here, using its stored absolute deadline - so downtime is not
 * credited back to the learner, and no timer is "resumed".
 */
export async function recoverExpiredAttemptsOnStartup() {
  const outcome = await expireDueAttempts()
  if (outcome.expired > 0) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ attempt: 'startup_expiry_recovery', ...outcome }))
  }
  return outcome
}
