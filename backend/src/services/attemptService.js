import { ASSESSMENT_TIME_LIMIT_MS } from '../constants/attemptTiming.js'
import {
  ATTEMPT_MODES,
  ATTEMPT_SCENARIO_COUNT,
  RECENT_EXCLUSION_WINDOW,
} from '../constants/scenarioSelection.js'
import { Attempt } from '../models/Attempt.js'
import { Candidate } from '../models/Candidate.js'
import { ScenarioDefinition } from '../models/ScenarioDefinition.js'
import { ScenarioRun } from '../models/ScenarioRun.js'
import { ApiError } from '../utils/ApiError.js'
import { assertTransactionSupport, withEngineTransaction } from '../utils/transactions.js'
import { createSeed } from '../utils/seededRandom.js'
import { SelectionError, selectAttemptScenarios } from './scenarioSelectionService.js'
import { buildAttemptResult } from './attemptResultService.js'
import { actionCodesForRun } from './learnerActionService.js'
import { refreshProgressAfterCompletion } from './progressService.js'
import { isDemoAttempt } from './demoSelectionService.js'

/**
 * Attempt creation (SELECT-002).
 *
 * Owns the database side of selection: reading the pool and the learner's history,
 * persisting the frozen attempt, and creating the ten ScenarioRun records ENGINE-001 will
 * execute. The solver itself stays pure in scenarioSelectionService.
 *
 * The legacy `Assessment` pipeline is untouched.
 */

const fail = (code, message, details) => {
  throw new SelectionError(code, message, details)
}

/**
 * Only the fields selection needs. `evaluation` is `select: false` and is never pulled
 * in: the solver has no business reading expected actions or scoring rules.
 */
const POOL_PROJECTION =
  'scenario_id platform level disposition canonical_family canonical_triggers military_flag version'

/**
 * Retry budget for the creation transaction. Concurrent Starts for one learner serialise on
 * that learner's profile (see `createAttempt`); with the helper's 25 ms doubling backoff,
 * six tries wait up to ~0.8 s for the winning Start to commit before giving up.
 */
const CREATE_TRANSACTION_ATTEMPTS = 6

/**
 * The learner's most recent scenario ids, newest first.
 *
 * Read from the NEW pipeline's own history - Attempt joined to ScenarioRun - not from
 * `Candidate.seenScenarios`, which references legacy `Scenario` ObjectIds rather than
 * `scenario_id` strings and belongs to the old journey.
 */
export async function recentScenarioIdsFor(profileId, limit = RECENT_EXCLUSION_WINDOW) {
  const attempts = await Attempt.find({ profile_id: profileId })
    .select('_id')
    .sort({ started_at: -1 })
    .limit(10)
    .lean()
  if (!attempts.length) return []

  const runs = await ScenarioRun.find({ attempt_id: { $in: attempts.map((a) => a._id) } })
    .select('scenario_id started_at')
    .sort({ started_at: -1 })
    .limit(limit * 2)
    .lean()

  const seen = []
  for (const run of runs) {
    if (!seen.includes(run.scenario_id)) seen.push(run.scenario_id)
    if (seen.length === limit) break
  }
  return seen
}

/** How many attempts this learner has already started - drives the platform rotation. */
export async function attemptIndexFor(profileId) {
  return Attempt.countDocuments({ profile_id: profileId })
}

/**
 * Loads the eligible pool.
 *
 * Only ACTIVE definitions, and only one content version per logical scenario. DATA-002
 * enforces a single active version per `scenario_id`, so `active: true` already yields a
 * coherent bank; the explicit uniqueness check below turns a future data fault into a
 * clear error instead of a silently mixed pool.
 */
export async function loadSelectionPool() {
  const pool = await ScenarioDefinition.find({ active: true }).select(POOL_PROJECTION).lean()

  const byScenario = new Map()
  for (const s of pool) {
    if (byScenario.has(s.scenario_id)) {
      fail('SELECTION_INVALID_CONTENT_VERSION',
        `scenario ${s.scenario_id} has more than one active version; the bank must be coherent`)
    }
    byScenario.set(s.scenario_id, s)
  }
  return pool
}

/**
 * Creates one attempt: selects, persists and materialises its ten runs.
 *
 * Atomic. The attempt and all ten runs commit together, so an attempt claiming ten
 * scenarios can never exist alongside seven runs. Requires the replica-set topology from
 * 15.25 and refuses to run without it rather than falling back to a non-atomic path.
 *
 * `profileId` comes from the authenticated session, never from a request body, and the
 * caller may not supply scenario ids, composition, seed or selection version - the server
 * decides all of them.
 *
 * `selector` is a SERVER-SIDE seam, never reachable from a request (ENHANCEMENT-003). It
 * defaults to the SELECT-002 solver, so every normal attempt is selected exactly as before;
 * the only other caller is `createDemoAttempt()`, which passes the fixed demo selector so a
 * demo attempt is persisted by this same code - one transaction, one deadline, ten runs.
 */
export async function createAttempt({
  profileId, mode = 'assessment', seed = null, selector = selectAttemptScenarios,
} = {}) {
  if (!profileId) fail('SELECTION_INVALID_PROFILE', 'a profile id is required')
  if (!ATTEMPT_MODES.includes(mode)) {
    fail('SELECTION_INVALID_MODE', `mode must be one of ${ATTEMPT_MODES.join(', ')}`)
  }

  await assertTransactionSupport()

  const existing = await Attempt.findOne({ profile_id: profileId, status: 'in_progress' })
  if (existing) {
    fail('SELECTION_ATTEMPT_IN_PROGRESS',
      'this learner already has an attempt in progress', { attempt_id: existing.id })
  }

  const pool = await loadSelectionPool()
  const [recentScenarioIds, attemptIndex] = await Promise.all([
    recentScenarioIdsFor(profileId),
    attemptIndexFor(profileId),
  ])

  const plan = selector({
    pool,
    seed: seed ?? createSeed(),
    attemptIndex,
    recentScenarioIds,
  })

  const versionOf = new Map(pool.map((s) => [s.scenario_id, s.version]))
  const contentVersions = new Set(plan.scenario_ids.map((id) => versionOf.get(id)))
  if (contentVersions.size !== 1) {
    fail('SELECTION_INVALID_CONTENT_VERSION',
      'the selected scenarios span more than one content version')
  }
  const contentVersion = [...contentVersions][0]

  /**
   * IMMERSIVE-001: the deadline is established here, from the SERVER clock, inside the
   * creation transaction - the one moment the assessment can be said to have begun.
   *
   * Both values are computed locally and written together. No request body reaches them,
   * and the model's freeze hook stops anything moving them afterwards, so a refresh, a
   * reconnect, a reopened browser and a restarted process all find the same deadline.
   */
  const startedAt = new Date()
  const timeLimitMs = ASSESSMENT_TIME_LIMIT_MS
  const expiresAt = new Date(startedAt.getTime() + timeLimitMs)

  const { result } = await withEngineTransaction(async (session) => {
    /**
     * One in-progress attempt per learner, enforced INSIDE the transaction.
     *
     * The check above runs outside it, so on its own two concurrent Starts (a double click,
     * two tabs) both pass it and each commit an attempt - there is no unique index on
     * `(profile_id, in_progress)` to stop the second. Writing the learner's own profile
     * makes that document the serialisation point: a concurrent creation that also writes
     * it gets a WriteConflict (the other's write is uncommitted, or committed after this
     * snapshot), `withEngineTransaction` retries it on a fresh snapshot, and the re-check
     * then sees the attempt that won and refuses. Checked BEFORE the write, so once the
     * winner has committed the others stop at the read instead of conflicting again.
     *
     * The write is a real one - the learner is starting an assessment, which is the moment
     * `last_seen_at` exists to record - so it needs no new field and changes no schema.
     */
    const running = await Attempt.findOne({ profile_id: profileId, status: 'in_progress' })
      .select('_id').session(session).lean()
    if (running) {
      fail('SELECTION_ATTEMPT_IN_PROGRESS',
        'this learner already has an attempt in progress', { attempt_id: String(running._id) })
    }
    await Candidate.updateOne({ _id: profileId }, { $set: { last_seen_at: startedAt } }, { session })

    const [attempt] = await Attempt.create([{
      profile_id: profileId,
      seed: plan.seed,
      mode,
      status: 'in_progress',
      scenario_sequence: plan.scenario_ids.map((scenario_id, i) => ({
        ordinal: i + 1,
        scenario_id,
        definition_version: versionOf.get(scenario_id),
      })),
      selection: {
        selection_algorithm_version: plan.selection_algorithm_version,
        attempt_index: plan.attempt_index,
        platform_quota: plan.platform_quota,
        composition: plan.composition,
        recent_exclusion: plan.recent_exclusion,
        relaxations: plan.relaxations,
      },
      content_version: contentVersion,
      started_at: startedAt,
      time_limit_ms: timeLimitMs,
      expires_at: expiresAt,
    }], { session, ordered: true })

    const runs = plan.scenarios.map((scenario, i) => ({
      attempt_id: attempt._id,
      ordinal: i + 1,
      scenario_id: scenario.scenario_id,
      definition_version: scenario.version,
      platform: scenario.platform,
      status: 'active',
      current_stage: 'notify',
      last_sequence: 0,
      score_running: 0,
      started_at: new Date(),
    }))
    await ScenarioRun.create(runs, { session, ordered: true })

    return { attempt, runCount: runs.length }
  }, { maxAttempts: CREATE_TRANSACTION_ATTEMPTS })

  if (result.runCount !== ATTEMPT_SCENARIO_COUNT) {
    fail('SELECTION_INTERNAL_ERROR', 'attempt was created without ten runs')
  }

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    selection: 'attempt_created',
    attempt_id: result.attempt.id,
    profile_id: String(profileId),
    selector_version: plan.selection_algorithm_version,
    content_version: contentVersion,
    seed: plan.seed,
    attempt_index: plan.attempt_index,
    relaxations: plan.relaxations,
  }))

  return { attempt: result.attempt, plan }
}

/** The learner's in-progress attempt, or null. Read-only - never creates one. */
export async function findActiveAttempt(profileId) {
  return Attempt.findOne({ profile_id: profileId, status: 'in_progress' })
}

/**
 * The learner's finished attempts, newest first - the Past Assessments list (DEMO-004).
 * Same `completed` filter the progress snapshot counts, so the history and the dashboard
 * total always agree. Read-only.
 */
export async function findCompletedAttempts(profileId) {
  return Attempt.find({ profile_id: profileId, status: 'completed' })
    .sort({ completed_at: -1 })
}

/**
 * The learner's most recent attempt if it ended on the clock, or null (IMMERSIVE-001).
 *
 * Needed for one specific and entirely normal case: the learner closed the browser, the
 * sweeper finalised the attempt while they were away, and they came back. There is no
 * in-progress attempt to find, so `findActiveAttempt` returns null and - without this -
 * they would be told they have no assessment, with no explanation and no route to the
 * result that already exists.
 *
 * Deliberately narrow. Only an attempt that ended because time ran out is reported, and
 * only the most recent one: a normally completed attempt is history, and the learner has
 * already seen its result.
 */
export async function findRecentlyExpiredAttempt(profileId) {
  return Attempt.findOne({ profile_id: profileId, end_reason: 'expired' })
    .sort({ completed_at: -1 })
}

/** The frozen sequence with its runs, for the orchestrator. Server-side only. */
export async function getAttemptPlan(attemptId) {
  const attempt = await Attempt.findById(attemptId).catch(() => null)
  if (!attempt) fail('SELECTION_INVALID_PROFILE', 'attempt not found')
  const runs = await ScenarioRun.find({ attempt_id: attempt._id }).sort({ ordinal: 1 })
  return { attempt, runs }
}

/* ------------------------------------------------------------------ *
 * Orchestration (API-001)
 *
 * Ownership resolution, current-run assembly, completion and the candidate-safe
 * result. All selection and state-machine logic stays in scenarioSelectionService
 * and scenarioEngineService - nothing below re-implements a rule either already owns.
 * ------------------------------------------------------------------ */

/**
 * The candidate's own attempt, or 404.
 *
 * Returns NOT FOUND rather than FORBIDDEN for another candidate's attempt, matching the
 * existing `findOwnAssessment` convention: a 403 confirms the id exists and turns the
 * endpoint into an enumeration oracle. Ownership always comes from the authenticated
 * session, never from the request body.
 */
export async function findOwnAttempt(attemptId, profileId) {
  const attempt = await Attempt.findOne({ _id: attemptId, profile_id: profileId }).catch(() => null)
  if (!attempt) throw ApiError.notFound('Attempt not found.')
  return attempt
}

/** A run belonging to this attempt, or 404. The second ownership hop. */
export async function findOwnRun(runId, attempt) {
  const run = await ScenarioRun.findOne({ _id: runId, attempt_id: attempt._id }).catch(() => null)
  if (!run) throw ApiError.notFound('Scenario run not found.')
  return run
}

/** The lowest-ordinal run not yet resolved, or null when all ten are done. */
export async function findCurrentRun(attempt) {
  return ScenarioRun.findOne({ attempt_id: attempt._id, status: { $ne: 'resolved' } })
    .sort({ ordinal: 1 })
}

/** Resolved / total, for the progress card. Never carries a running score. */
export async function attemptProgress(attempt) {
  const resolved = await ScenarioRun.countDocuments({ attempt_id: attempt._id, status: 'resolved' })
  return {
    resolved,
    total: attempt.scenario_sequence.length,
    all_resolved: resolved === attempt.scenario_sequence.length,
  }
}

/** Candidate-safe attempt view: the model projection plus progress and the current run. */
export async function attemptStateFor(attempt) {
  const [progress, current] = await Promise.all([
    attemptProgress(attempt),
    findCurrentRun(attempt),
  ])
  return {
    ...attempt.toCandidateJSON(),
    /**
     * ENHANCEMENT-003. Present ONLY on the Demo User's fixed demonstration attempt, where it
     * lets the page offer Skip. Absent - not `false` - for everyone else, so a normal
     * learner's payload is byte-for-byte what it was. It authorises nothing: the skip
     * endpoint re-checks the session's profile and the attempt's frozen selection itself.
     */
    ...(isDemoAttempt(attempt) ? { is_demo: true } : {}),
    progress,
    current_run: current
      ? {
        run_id: current.id,
        ordinal: current.ordinal,
        platform: current.platform,
        current_stage: current.current_stage,
        status: current.status,
      }
      : null,
  }
}

/**
 * The current run plus the scenario content the simulation needs.
 *
 * The definition is loaded by the run's PINNED `(scenario_id, definition_version)` - never
 * "the latest active version" - so a content republish cannot change the rules under a run
 * already in flight. `evaluation` is `select: false` and is not requested, and
 * `toCandidateJSON()` rebuilds the payload from an allowlist, so no classification,
 * expected action or scoring rule can reach the learner.
 *
 * SECURITY-001: `actions` maps each neutral control id to this run's opaque action code.
 * It is the only way a client can name an action, and it carries no canonical intent.
 */
export async function runPayloadFor(run) {
  const definition = await ScenarioDefinition.findOne({
    scenario_id: run.scenario_id,
    version: run.definition_version,
  })
  if (!definition) throw ApiError.notFound('The scenario content for this run is missing.')

  return {
    // `ordinal` is added here rather than in ScenarioRun.toCandidateJSON(): the frontend
    // needs it for the "Scenario n of 10" progress card (specification section 3), but it
    // is a position within an attempt, not run state, so ENGINE-001's projection - which
    // has its own key-exact test - is left untouched.
    run: { ...run.toCandidateJSON(), ordinal: run.ordinal },
    scenario: definition.toCandidateJSON(),
    actions: actionCodesForRun(run),
  }
}

/**
 * Completes the attempt once all ten runs are resolved.
 *
 * Total score is the sum of the ten per-scenario 0-10 scores the engine already clamped
 * and persisted from the event ledger - specification section 5, "sum 10 scenarios for a
 * 0-100 attempt score". Nothing is recomputed from client input.
 *
 * Idempotent: a repeat call on an already-completed attempt returns it unchanged rather
 * than erroring, so a retried request is safe. The status guard inside the transaction is
 * what makes the transition happen exactly once.
 */
export async function completeAttempt(attempt) {
  if (attempt.status === 'completed') return attempt
  if (attempt.status !== 'in_progress') {
    throw ApiError.conflict('ATTEMPT_NOT_IN_PROGRESS', 'This attempt can no longer be completed.')
  }

  const runs = await ScenarioRun.find({ attempt_id: attempt._id }).sort({ ordinal: 1 })
  if (runs.length !== ATTEMPT_SCENARIO_COUNT) {
    throw ApiError.conflict('ATTEMPT_INCOMPLETE',
      `This attempt has ${runs.length} scenarios, expected ${ATTEMPT_SCENARIO_COUNT}.`)
  }
  const unresolved = runs.filter((r) => r.status !== 'resolved')
  if (unresolved.length) {
    throw ApiError.conflict('SCENARIOS_OUTSTANDING',
      `${unresolved.length} scenario(s) still need to be resolved.`,
      { outstanding_ordinals: unresolved.map((r) => r.ordinal) })
  }

  const totalScore = runs.reduce((sum, r) => sum + (r.score_0_10 ?? 0), 0)

  await assertTransactionSupport()
  const { result } = await withEngineTransaction(async (session) => {
    // Re-read under the guard so two concurrent completions cannot both transition.
    const fresh = await Attempt.findOne({ _id: attempt._id, status: 'in_progress' }).session(session)
    if (!fresh) {
      return { attempt: await Attempt.findById(attempt._id).session(session), already: true }
    }
    fresh.status = 'completed'
    fresh.completed_at = new Date()
    fresh.total_score = totalScore
    /**
     * IMMERSIVE-001: `status` alone cannot tell a finished assessment from a timed-out
     * one, because both are `completed` - both produce a real, comparable result. This is
     * what separates them, and it is written in the same transaction as the status so the
     * two can never disagree.
     */
    fresh.end_reason = 'learner_completed'
    await fresh.save({ session })
    return { attempt: fresh, already: false }
  })

  if (!result.already) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
      selection: 'attempt_completed',
      attempt_id: String(attempt._id),
      total_score: totalScore,
      scenarios: runs.length,
    }))
  }

  /**
   * PROGRESS-001: refresh the derived snapshot, AFTER the completion transaction committed
   * and deliberately outside it.
   *
   * The deployment strategy is explicit that this snapshot is "never a write that must be
   * atomic with anything", so it must not be able to abort a completion that has already
   * succeeded - `refreshProgressAfterCompletion` swallows its own failures for exactly that
   * reason, and the read path repairs a missed refresh anyway.
   *
   * Run unconditionally rather than only when `!result.already`. The rebuild is a
   * recomputation from the completed attempts, so a repeated completion recomputes the same
   * totals rather than counting the attempt twice; running it on the already-complete path
   * is what makes a retried request self-healing instead of merely harmless.
   */
  await refreshProgressAfterCompletion(result.attempt.profile_id)

  return result.attempt
}

/**
 * Candidate-safe result.
 *
 * API-001 built a deliberately minimal payload here. RESULT-001 replaced the body with
 * the full projection in `attemptResultService`, which keeps every key this function used
 * to return and adds the section 7 blocks around them - so the contract grew rather than
 * changed, and the existing caller needed no edit.
 *
 * The name and the signature stay because both call sites (`/complete` and `/result`) use
 * them, and one projection for both keeps the two responses identical.
 */
export async function attemptResultFor(attempt) {
  return buildAttemptResult(attempt)
}
