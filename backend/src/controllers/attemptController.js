import {
  attemptResultFor,
  attemptStateFor,
  completeAttempt,
  createAttempt,
  findActiveAttempt,
  findCompletedAttempts,
  findCurrentRun,
  findOwnAttempt,
  findRecentlyExpiredAttempt,
  findOwnRun,
  runPayloadFor,
} from '../services/attemptService.js'
import { assertAttemptLive, enforceDeadline } from '../services/attemptExpiryService.js'
import { assertDemoSkipBody, createDemoAttempt, skipDemoRun } from '../services/demoAssessmentService.js'
import { isDemoAttempt, isDemoCandidate } from '../services/demoSelectionService.js'
import { resolvedRunFeedback } from '../services/attemptResultService.js'
import { effectiveFeedbackTiming } from '../services/instructorControlService.js'
import { submitIntent } from '../services/scenarioEngineService.js'
import { translateActionCode } from '../services/learnerActionService.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { RESOLVE_INTENTS } from '../constants/scenarioEngine.js'
import { CLIENT_METADATA_KEYS, NEUTRALISED_ENGINE_ERRORS } from '../constants/learnerAction.js'

/**
 * Candidate attempt and scenario orchestration (API-001).
 *
 * These handlers translate HTTP into the existing service contracts and nothing more.
 * They never compute a score, decide a stage transition, choose a scenario or read
 * evaluation data - selection lives in scenarioSelectionService, the state machine and
 * all scoring in scenarioEngineService.
 *
 * Ownership always comes from `req.candidate`, which `requireCandidate` resolves from the
 * signed httpOnly session cookie. A profile id in a request body is never consulted.
 */

/** Fields the client is never allowed to send. Present = rejected, not ignored. */
const FORBIDDEN_BODY_FIELDS = [
  'profile_id', 'profileId', 'seed', 'scenario_ids', 'scenario_sequence', 'composition',
  'selection', 'selection_algorithm_version', 'points_delta', 'points', 'score',
  'score_running', 'score_0_10', 'total_score', 'event_code', 'next_stage',
  'current_stage', 'stage', 'sequence', 'outcome_code', 'status', 'expected_action',
  'evaluation', 'canonical_family', 'canonical_triggers', 'disposition', 'level',
  'military_flag', 'definition_version',
  /**
   * IMMERSIVE-001. The deadline is server-authoritative: a client that tries to send one
   * is REJECTED rather than ignored, so an attempt to extend an assessment fails loudly
   * instead of silently having no effect.
   */
  'expires_at', 'expiresAt', 'time_limit_ms', 'timeLimitMs', 'duration_ms', 'durationMs',
  'end_reason', 'endReason', 'expired_at', 'expiredAt', 'unresolved_at_expiry',
  'server_now', 'serverNow',
  /**
   * SECURITY-001. A client names an action only by its opaque `action_code`. The canonical
   * intent is derived here, so a request that carries one is refused - there is no request
   * in which a client can offer both and have the convenient one chosen.
   */
  'intent', 'verify_source',
]

function rejectAuthoritativeFields(body = {}) {
  const offending = FORBIDDEN_BODY_FIELDS.filter((key) => key in (body ?? {}))
  if (offending.length) {
    throw ApiError.unprocessable(
      'FORBIDDEN_FIELD',
      'The server decides these values; they cannot be supplied by the client.',
      { rejected_fields: offending },
    )
  }
}

/* ------------------------------------------------------------------ *
 * SECURITY-001 - the neutral learner action contract
 * ------------------------------------------------------------------ */

/** Metadata a client may attach. Server-written keys are refused, not overwritten. */
function clientMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return metadata
  const offending = Object.keys(metadata).filter((k) => !CLIENT_METADATA_KEYS.includes(k))
  if (offending.length) {
    throw ApiError.unprocessable(
      'FORBIDDEN_FIELD',
      'The server decides these values; they cannot be supplied by the client.',
      { rejected_fields: offending.map((k) => `metadata.${k}`) },
    )
  }
  return metadata
}

/**
 * Translates the request's action code for this run, then runs the UNCHANGED engine.
 *
 * - The canonical intent never comes from the request.
 * - The control's own stage is the engine's expected stage. The engine checks it inside its
 *   transaction and after its duplicate replay, so a retried request still replays, a stale
 *   tab still gets 409 STALE_STATE, and a code for any other stage is refused the same way.
 *   A request whose `expected_stage` disagrees with its own code is malformed: 422.
 * - `verify_source` is written from the intent, as the client used to send it.
 * - Engine messages that could name the intent are replaced with a neutral one.
 * - The accepted response drops the event code (the scoring verdict on the choice just
 *   made) and adds `view`, the neutral name of the inert panel the device should open.
 */
async function submitLearnerAction({ attempt, run, body, resolveOnly = false }) {
  const action = translateActionCode({ run, actionCode: body.action_code })
  if (resolveOnly && !RESOLVE_INTENTS.includes(action.intent)) {
    throw ApiError.unprocessable('INVALID_ACTION', 'That action is not available here.')
  }
  const expected = body.expected_stage
  if (expected !== undefined && expected !== null && expected !== action.stage) {
    throw ApiError.unprocessable('INVALID_ACTION', 'That action is not available here.')
  }

  let metadata = clientMetadata(body.metadata)
  if (action.verifySource) {
    const isObject = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    // A malformed value is passed through untouched so the engine refuses it as before.
    if (isObject || metadata === undefined || metadata === null) {
      metadata = { ...(metadata ?? {}), verify_source: action.verifySource }
    }
  }

  let result
  try {
    result = await submitIntent({
      runId: run._id,
      intent: action.intent,
      intentKey: body.intent_key,
      expectedStage: action.stage,
      syntheticTargetId: resolveOnly ? null : (body.synthetic_target_id ?? null),
      rationale: body.rationale,
      metadata,
      clientTs: body.client_ts,
      elapsedMs: body.elapsed_ms,
    })
  } catch (error) {
    if (error?.isDomainError && NEUTRALISED_ENGINE_ERRORS.includes(error.code)
      && (error.code !== 'INVALID_INTENT' || String(error.message).includes(action.intent))) {
      error.message = 'That action is not available here.'
    }
    throw error
  }

  const { event, ...rest } = result
  return {
    ...rest,
    event: event
      ? { sequence: event.sequence, stage: event.stage, accepted_at: event.accepted_at }
      : null,
    view: action.view,
    ...(await feedbackRelease(attempt, run, result)),
  }
}

/**
 * ADM-007: the instructor's feedback-timing control, applied when a run resolves.
 *
 * `immediate` releases this scenario's authored feedback card with the response that
 * resolved it; `on_completion` holds it for the result screen, as before. Only a RESOLVED
 * run is ever considered, so nothing about a scenario still in play can leave early.
 * Adds nothing to a response that did not resolve the run.
 */
async function feedbackRelease(attempt, run, result) {
  if (result.run?.status !== 'resolved') return {}
  const timing = await effectiveFeedbackTiming(attempt.mode)
  if (timing !== 'immediate') return { feedback_timing: timing, feedback: null }
  const feedback = await resolvedRunFeedback({
    status: result.run.status,
    scenario_id: run.scenario_id,
    definition_version: run.definition_version,
  })
  return { feedback_timing: timing, feedback }
}

/**
 * POST /api/attempts
 *
 * Starts a new attempt, or returns the in-progress one rather than creating a second.
 * Selection, the seed and the ten runs all come from the existing services.
 */
export const startAttempt = asyncHandler(async (req, res) => {
  rejectAuthoritativeFields(req.body)

  /**
   * IMMERSIVE-001, and the latent bug the architecture audit found.
   *
   * `createAttempt()` refuses while an `in_progress` attempt exists. Before the timer that
   * meant an abandoned attempt blocked its learner PERMANENTLY, until an instructor reset
   * it; with a deadline it would have become the common case. Enforcing the deadline here
   * finalises an overdue attempt first, so it stops being in progress and stops blocking.
   *
   * This is the smallest safe lifecycle change: no status was added, no reset semantics
   * were touched, and an attempt that is genuinely still running is still returned rather
   * than duplicated.
   */
  const existing = await findActiveAttempt(req.candidate._id)
  if (existing) {
    const { expired, attempt: settled } = await enforceDeadline(existing)
    if (!expired) {
      return res.status(200).json({ attempt: await attemptStateFor(settled), created: false })
    }
  }

  const mode = req.body?.mode ?? 'assessment'
  /**
   * ENHANCEMENT-003. The Demo User - recognised from the SESSION's profile, never from the
   * request - gets the fixed demonstration set; everyone else gets the unchanged solver.
   * Both paths persist through the same `createAttempt()`.
   */
  let attempt
  try {
    ({ attempt } = isDemoCandidate(req.candidate)
      ? await createDemoAttempt({ profileId: req.candidate._id, mode })
      : await createAttempt({ profileId: req.candidate._id, mode }))
  } catch (error) {
    /**
     * A concurrent Start (double click, second tab) lost the race inside the creation
     * transaction to one that has just committed. Answer it exactly as the check above
     * answers a repeat Start - the attempt that is running - rather than with a 409.
     */
    const winner = error?.code === 'SELECTION_ATTEMPT_IN_PROGRESS'
      ? await findActiveAttempt(req.candidate._id)
      : null
    if (!winner) throw error
    return res.status(200).json({ attempt: await attemptStateFor(winner), created: false })
  }
  return res.status(201).json({ attempt: await attemptStateFor(attempt), created: true })
})

/**
 * GET /api/attempts - this learner's completed attempts, newest first (DEMO-004).
 *
 * Ownership comes from the session, as everywhere else here. Each item is the allowlisted
 * `toCandidateJSON()` projection, so nothing beyond what the result page already shows
 * (status, dates, score out of 100) leaves the server.
 */
export const listCompletedAttempts = asyncHandler(async (req, res) => {
  const attempts = await findCompletedAttempts(req.candidate._id)
  res.json({ attempts: attempts.map((attempt) => attempt.toCandidateJSON()) })
})

/** GET /api/attempts/current - the resumable attempt, or null. Never creates one. */
export const getCurrentAttempt = asyncHandler(async (req, res) => {
  const attempt = await findActiveAttempt(req.candidate._id)
  if (!attempt) {
    /**
     * No attempt is running. Before reporting nothing, check whether the last one ended on
     * the clock - the sweeper may have finalised it while the learner had the browser
     * closed. Reporting `null` there would tell someone who has just been timed out that
     * they never had an assessment.
     */
    const expired = await findRecentlyExpiredAttempt(req.candidate._id)
    return res.json({ attempt: expired ? await attemptStateFor(expired) : null })
  }

  /**
   * The reopen path. A learner who closed the browser and came back after the deadline
   * gets the finalised attempt here, not a resumable one - and because expiry commits the
   * result in the same transaction, it is readable the moment this returns.
   */
  const { expired, attempt: settled } = await enforceDeadline(attempt)
  return res.json({ attempt: await attemptStateFor(settled), expired: expired || undefined })
})

/** GET /api/attempts/:attemptId - candidate-safe projection, after ownership check. */
export const getAttempt = asyncHandler(async (req, res) => {
  const attempt = await findOwnAttempt(req.params.attemptId, req.candidate._id)
  const { attempt: settled } = await enforceDeadline(attempt)
  res.json({ attempt: await attemptStateFor(settled) })
})

/**
 * GET /api/attempts/:attemptId/current-run
 *
 * The current run plus its pinned scenario content. Returns `run: null` once all ten are
 * resolved, which is the frontend's signal to complete the attempt.
 */
export const getCurrentRun = asyncHandler(async (req, res) => {
  const found = await findOwnAttempt(req.params.attemptId, req.candidate._id)

  /**
   * IMMERSIVE-001: enforce the deadline before deciding there is a run to serve.
   *
   * An expired attempt becomes `completed` here, and the existing terminal-state branch
   * below then answers `run: null` - which is exactly the shape the frontend reducer
   * already treats as "this attempt is over", so no new client path was needed.
   */
  const { attempt } = await enforceDeadline(found)

  /**
   * Only an attempt that is still in progress has a current run (ADMIN-004).
   *
   * Without this, an attempt an instructor has RESET would keep serving its next scenario
   * to a learner holding the id - read-only, because the event and resolve endpoints
   * already refuse a non-`in_progress` attempt, but it would still look resumable. A
   * completed attempt already returned `null` here, because all ten runs are resolved;
   * this makes that true for every terminal state rather than as a side effect.
   */
  if (attempt.status !== 'in_progress') {
    return res.json({ run: null, scenario: null, attempt: await attemptStateFor(attempt) })
  }

  const run = await findCurrentRun(attempt)
  if (!run) {
    return res.json({ run: null, scenario: null, attempt: await attemptStateFor(attempt) })
  }
  return res.json({ ...(await runPayloadFor(run)), attempt: await attemptStateFor(attempt) })
})

/**
 * POST /api/attempts/:attemptId/runs/:runId/events
 *
 * One learner action. The body carries an opaque `action_code` and an idempotency key
 * (SECURITY-001); the server translates the code, the engine decides the event code, the
 * points and the next stage inside its own transaction, and this handler returns only
 * what the engine committed.
 */
export const submitRunEvent = asyncHandler(async (req, res) => {
  rejectAuthoritativeFields(req.body)

  const attempt = await findOwnAttempt(req.params.attemptId, req.candidate._id)
  /**
   * IMMERSIVE-001. Order matters: enforce the deadline BEFORE the status check, so a
   * learner acting after expiry is told their time ran out (`ATTEMPT_EXPIRED`) rather than
   * the generic "no longer in progress" an instructor reset produces. The two need
   * different screens.
   */
  await assertAttemptLive(attempt)
  if (attempt.status !== 'in_progress') {
    throw ApiError.conflict('ATTEMPT_NOT_IN_PROGRESS', 'This attempt is no longer in progress.')
  }
  const run = await findOwnRun(req.params.runId, attempt)

  const result = await submitLearnerAction({ attempt, run, body: req.body ?? {} })

  // Only after the engine transaction has committed is the next state reported.
  res.json({ ...result, attempt: await attemptStateFor(attempt) })
})

/**
 * POST /api/attempts/:attemptId/runs/:runId/resolve
 *
 * The same engine call as the events endpoint, restricted to the resolve-stage intents.
 * It exists because resolution is where the learner submits their rationale and where the
 * frontend needs an unambiguous "finish this scenario" call; it adds no rules of its own
 * and cannot resolve a run the engine would not.
 */
export const resolveRun = asyncHandler(async (req, res) => {
  rejectAuthoritativeFields(req.body)

  const attempt = await findOwnAttempt(req.params.attemptId, req.candidate._id)
  /**
   * IMMERSIVE-001. Order matters: enforce the deadline BEFORE the status check, so a
   * learner acting after expiry is told their time ran out (`ATTEMPT_EXPIRED`) rather than
   * the generic "no longer in progress" an instructor reset produces. The two need
   * different screens.
   */
  await assertAttemptLive(attempt)
  if (attempt.status !== 'in_progress') {
    throw ApiError.conflict('ATTEMPT_NOT_IN_PROGRESS', 'This attempt is no longer in progress.')
  }
  const run = await findOwnRun(req.params.runId, attempt)

  // Only a code for a resolve-stage control is accepted here; which one is never echoed.
  const result = await submitLearnerAction({ attempt, run, body: req.body ?? {}, resolveOnly: true })

  res.json({ ...result, attempt: await attemptStateFor(attempt) })
})

/**
 * POST /api/attempts/:attemptId/runs/:runId/demo-skip  (ENHANCEMENT-003)
 *
 * The Demo User's Skip. A dedicated route, so the learner action endpoints and their
 * neutral action-code contract are untouched: no intent, action code or event code is sent
 * or returned, and the body is an allowlist of one field, `expected_stage`.
 *
 * Refused with the same 404 as an unknown route unless the SESSION's profile is the Demo
 * User AND the attempt was built by the demo selector - a normal learner cannot learn from
 * the response that the route exists, and the demo profile cannot skip in any other
 * attempt. Ownership, the deadline and the in-progress check are the ones every other
 * attempt route uses; the service then re-checks run state, currency and stage inside its
 * transaction.
 */
export const skipDemoScenario = asyncHandler(async (req, res) => {
  const notFound = () => ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`)
  if (!isDemoCandidate(req.candidate)) throw notFound()

  const expectedStage = assertDemoSkipBody(req.body)

  const attempt = await findOwnAttempt(req.params.attemptId, req.candidate._id)
  if (!isDemoAttempt(attempt)) throw notFound()
  await assertAttemptLive(attempt)
  if (attempt.status !== 'in_progress') {
    throw ApiError.conflict('ATTEMPT_NOT_IN_PROGRESS', 'This attempt is no longer in progress.')
  }
  const run = await findOwnRun(req.params.runId, attempt)

  await skipDemoRun({ attempt, run, expectedStage })

  // No score, outcome or feedback: the page simply loads the next scenario.
  res.json({ skipped: true, attempt: await attemptStateFor(attempt) })
})

/**
 * POST /api/attempts/:attemptId/complete
 *
 * Only valid once all ten runs are resolved. Idempotent: a repeat call returns the already
 * completed attempt rather than erroring.
 */
export const finishAttempt = asyncHandler(async (req, res) => {
  rejectAuthoritativeFields(req.body)

  const attempt = await findOwnAttempt(req.params.attemptId, req.candidate._id)
  /**
   * If the deadline passed before this call arrived, expiry finalises the attempt and this
   * request is refused. It is not a lost result: expiry commits one in the same
   * transaction, and `result_available` on the error says so.
   */
  await assertAttemptLive(attempt)
  const completed = await completeAttempt(attempt)
  res.json({
    attempt: await attemptStateFor(completed),
    result: await attemptResultFor(completed),
  })
})

/** GET /api/attempts/:attemptId/result - candidate-safe result for a completed attempt. */
export const getAttemptResult = asyncHandler(async (req, res) => {
  const found = await findOwnAttempt(req.params.attemptId, req.candidate._id)
  /**
   * `enforceDeadline`, not `assertAttemptLive`: asking for a result must never be refused.
   * If the attempt is overdue this finalises it and then serves the result it produced, so
   * a learner who returns after the deadline sees their score rather than an error.
   * Reading a result cannot extend an assessment, so there is nothing to guard against.
   */
  const { attempt } = await enforceDeadline(found)
  res.json({ result: await attemptResultFor(attempt) })
})
