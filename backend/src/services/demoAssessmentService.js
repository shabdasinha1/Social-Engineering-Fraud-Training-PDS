import {
  DEMO_SELECTION_VERSION,
  DEMO_SKIP_BODY_FIELDS,
  DEMO_SKIP_EVENT_CODE,
  DEMO_SKIPPED_OUTCOME_CODE,
} from '../constants/demoAssessment.js'
import { SCENARIO_POINTS, STAGE_KEYS } from '../constants/scenarioDefinition.js'
import { RESUMABLE_STATUSES } from '../constants/scenarioEngine.js'
import { Candidate } from '../models/Candidate.js'
import { ScenarioEvent } from '../models/ScenarioEvent.js'
import { ScenarioRun } from '../models/ScenarioRun.js'
import { ApiError } from '../utils/ApiError.js'
import {
  assertTransactionSupport,
  isDuplicateKeyError,
  withEngineTransaction,
} from '../utils/transactions.js'
import { createAttempt } from './attemptService.js'
import { demoIdentifier, selectDemoScenarios } from './demoSelectionService.js'

/**
 * The Demo User's assessment (ENHANCEMENT-003).
 *
 * Two operations and nothing else. Neither changes how a normal learner is selected,
 * scored or resolved: the selection solver, the engine, the scoring table and the learner
 * action contract are all untouched, and nothing here is reachable for a profile that is
 * not the configured Demo User.
 */

/**
 * Starts the fixed ten-scenario demonstration.
 *
 * Persisted by the ordinary `createAttempt()` - same transaction, same 90-minute deadline,
 * same ten runs, same in-progress guard - with only the selector swapped. So a demo attempt
 * is a real attempt: it resumes after a reload, it expires, an instructor can reset it, and
 * it appears in the admin attempt list like any other.
 */
export async function createDemoAttempt({ profileId, mode = 'assessment' } = {}) {
  return createAttempt({ profileId, mode, selector: selectDemoScenarios })
}

/* ------------------------------------------------------------------ *
 * Analytics isolation (ENHANCEMENT-003-FINAL)
 * ------------------------------------------------------------------ */

/**
 * The Demo User's profile id(s): the profile keyed on the CONFIGURED demo service number,
 * found by the same normalised comparison `isDemoCandidate()` makes. Empty when the demo is
 * disabled or nobody has signed in as the Demo User yet. Nothing from a request reaches it.
 */
export async function demoProfileIds() {
  const identifier = demoIdentifier()
  if (!identifier) return []
  return Candidate.find({ identifierNormalised: identifier }).distinct('_id')
}

/**
 * The attempt filter that keeps demonstrations out of learner-performance analytics.
 *
 * Two independent conditions, both server-side: not the Demo User's profile, and not built
 * by the demo selector. The second still holds if the configured demo number is ever
 * changed, so an earlier demo profile's fixed-set attempts cannot drift back into the
 * figures. It is applied ONLY by the instructor dashboard; the attempt list, attempt
 * detail, results and exports still show every demo attempt.
 */
export function excludeDemoAttempts(profileIds = []) {
  return {
    profile_id: { $nin: profileIds },
    'selection.selection_algorithm_version': { $ne: DEMO_SELECTION_VERSION },
  }
}

/** The skip body is an allowlist of one field. Anything else is refused, not ignored. */
export function assertDemoSkipBody(body) {
  if (body !== undefined && body !== null && (typeof body !== 'object' || Array.isArray(body))) {
    throw ApiError.unprocessable('INVALID_ACTION', 'That action is not available here.')
  }
  const offending = Object.keys(body ?? {}).filter((key) => !DEMO_SKIP_BODY_FIELDS.includes(key))
  if (offending.length) {
    throw ApiError.unprocessable(
      'FORBIDDEN_FIELD',
      'The server decides these values; they cannot be supplied by the client.',
      { rejected_fields: offending },
    )
  }
  const stage = body?.expected_stage
  if (typeof stage !== 'string' || !STAGE_KEYS.includes(stage)) {
    throw ApiError.unprocessable('INVALID_ACTION', 'That action is not available here.')
  }
  return stage
}

const clampScenarioScore = (value) =>
  Math.max(SCENARIO_POINTS.min, Math.min(SCENARIO_POINTS.max, value))

/**
 * Closes the CURRENT run of a demo attempt without a learner decision.
 *
 * The caller (the controller) has already established that the session is the Demo User,
 * that the attempt is theirs, was built by the demo selector, is live and in progress, and
 * that the run belongs to it. Everything that can race is re-checked here, inside the
 * transaction:
 *
 *   - the run is still unresolved                    -> else 409 RUN_NOT_ACTIVE
 *   - it is the attempt's current (lowest) run       -> else 409 RUN_NOT_CURRENT
 *   - it is still at the stage the page was showing  -> else 409 STALE_STATE
 *
 * ### Scoring - the IMMERSIVE-001 / C2 rule, reused rather than reinvented
 *
 * A skip is treated exactly as the approved expiry treats a run the clock closed: no
 * decision is fabricated. One ledger event with `points_delta: 0`, then
 * `score_0_10 = clamp(score_running, 0, 10)` - the engine's own resolution clamp.
 *
 *   - skipped before any scored action (the usual case): 0. No points are awarded.
 *   - the skip itself adds nothing and removes nothing; whatever the ledger already holds
 *     from actions genuinely taken before it stands, as it does at expiry.
 *   - no RESOLVE_CORRECT and no CONTRADICTORY_UNSAFE_FINAL: the outcome code is outside
 *     CORRECT_RESOLUTION, so it is neither a correct nor an unsafe final action, and no
 *     malicious-action penalty is triggered.
 *
 * The run ends `resolved` because the attempt needs "exactly 10 resolved scenarios" to
 * complete; `outcome_code` says it was skipped, not answered.
 *
 * ### Replay
 *
 * `intent_key` is `demo-skip:<attempt>:<run>` and carries a unique index, so a second skip
 * of the same run cannot write a second event even if two requests race past the status
 * check; the loser is refused. A skip of an already-resolved run is refused before that.
 */
export async function skipDemoRun({ attempt, run, expectedStage }) {
  await assertTransactionSupport()

  try {
    const { result } = await withEngineTransaction(async (session) => {
      const fresh = await ScenarioRun.findOne({
        _id: run._id,
        attempt_id: attempt._id,
        status: { $in: RESUMABLE_STATUSES },
      }).session(session)
      if (!fresh) {
        throw ApiError.conflict('RUN_NOT_ACTIVE', 'This scenario has already been completed.')
      }

      const current = await ScenarioRun.findOne({
        attempt_id: attempt._id,
        status: { $ne: 'resolved' },
      }).sort({ ordinal: 1 }).select('_id').session(session)
      if (!current || String(current._id) !== String(fresh._id)) {
        throw ApiError.conflict('RUN_NOT_CURRENT', 'Only the current scenario can be skipped.')
      }

      if (fresh.current_stage !== expectedStage) {
        throw ApiError.conflict('STALE_STATE',
          'This scenario moved on while you were deciding. Reloading its current state.')
      }

      const now = new Date()
      const sequence = fresh.last_sequence + 1
      await ScenarioEvent.create([{
        run_id: fresh._id,
        sequence,
        event_code: DEMO_SKIP_EVENT_CODE,
        stage: fresh.current_stage,
        points_delta: 0,
        synthetic_target_id: null,
        intent_key: `demo-skip:${attempt._id}:${fresh._id}`,
        client_ts: null,
        elapsed_ms: null,
        server_ts: now,
        /**
         * No `intent`, as with expiry: a skip is not a learner intent, and naming one would
         * mean widening the intent vocabulary the engine validates client requests against.
         */
        metadata: {
          transition: `${fresh.current_stage}->end`,
          resolution_code: DEMO_SKIPPED_OUTCOME_CODE,
        },
      }], { session, ordered: true })

      fresh.last_sequence = sequence
      fresh.status = 'resolved'
      fresh.score_0_10 = clampScenarioScore(fresh.score_running)
      fresh.outcome_code = DEMO_SKIPPED_OUTCOME_CODE
      fresh.resolved_at = now
      fresh.last_event_at = now
      await fresh.save({ session })
      return fresh
    })

    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
      demo: 'scenario_skipped',
      attempt_id: String(attempt._id),
      run_id: String(result._id),
      ordinal: result.ordinal,
    }))
    return result
  } catch (error) {
    // A concurrent skip of the same run lost the race on the unique intent_key.
    if (isDuplicateKeyError(error)) {
      throw ApiError.conflict('RUN_NOT_ACTIVE', 'This scenario has already been completed.')
    }
    throw error
  }
}
