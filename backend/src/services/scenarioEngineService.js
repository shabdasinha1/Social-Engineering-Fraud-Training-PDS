import { SCENARIO_POINTS, STAGE_KEYS } from '../constants/scenarioDefinition.js'
import {
  CORRECT_RESOLUTION,
  ENGINE_ERRORS,
  ENGINE_TELEMETRY_CODES,
  INTENTS,
  METADATA_ALLOWLIST,
  RATIONALE_MAX_LENGTH,
  STAGE_INTENTS,
} from '../constants/scenarioEngine.js'
import { ScenarioDefinition } from '../models/ScenarioDefinition.js'
import { ScenarioEvent } from '../models/ScenarioEvent.js'
import { ScenarioRun } from '../models/ScenarioRun.js'
import {
  assertTransactionSupport,
  duplicateKeyFields,
  isDuplicateKeyError,
  withEngineTransaction,
} from '../utils/transactions.js'

/**
 * The server-authoritative six-stage scenario engine (ENGINE-001).
 *
 * The browser sends an INTENT and an idempotency key. Everything else - the event code,
 * the points, the next stage, the outcome - is decided here from the pinned
 * ScenarioDefinition. A payload field named score, points_delta, event_code, next_stage
 * or current_stage is not merely ignored: it is rejected, so a client that tries to steer
 * the engine finds out immediately instead of silently having no effect.
 *
 * Isolated by design: it does not touch the legacy Scenario/Assessment pipeline, and adds
 * no routes. See docs/SCENARIO_ENGINE.md.
 */

/* ------------------------------------------------------------------ *
 * Errors
 * ------------------------------------------------------------------ */

export class EngineError extends Error {
  constructor(code, message, details = null) {
    super(message)
    this.name = 'EngineError'
    this.code = code
    this.status = ENGINE_ERRORS[code] ?? 500
    this.details = details
    /** Marks this as a decision, not a fault: never retried inside a transaction. */
    this.isDomainError = true
  }
}

const fail = (code, message, details) => {
  throw new EngineError(code, message, details)
}

/* ------------------------------------------------------------------ *
 * Structured logging - run_id only, never learner content
 * ------------------------------------------------------------------ */

function log(event, fields) {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ engine: event, ...fields }))
}

/* ------------------------------------------------------------------ *
 * Input validation
 * ------------------------------------------------------------------ */

/** Fields the client is never allowed to send. Present = rejected, not ignored. */
const FORBIDDEN_INPUT = [
  'points_delta', 'points', 'score', 'score_running', 'score_0_10',
  'event_code', 'next_stage', 'current_stage', 'stage', 'sequence',
  'outcome_code', 'expected_action', 'evaluation', 'status',
  /**
   * IMMERSIVE-001. The 90-minute deadline is server state. A client sending any of these
   * is rejected outright - the same treatment `score` gets - so an attempt to buy more
   * time fails loudly rather than being quietly dropped.
   */
  'expires_at', 'expiresAt', 'time_limit_ms', 'timeLimitMs', 'duration_ms', 'durationMs',
  'end_reason', 'endReason', 'expired_at', 'expiredAt', 'unresolved_at_expiry', 'server_now',
]

export function assertNoAuthoritativeInput(payload = {}) {
  const offending = FORBIDDEN_INPUT.filter((key) => key in payload)
  if (offending.length) {
    fail('INVALID_INTENT',
      'The client may not supply authoritative fields; the server decides them.',
      { rejected_fields: offending })
  }
}

/** Section 4: optional, one line, max 250 characters. Never scored. */
export function validateRationale(rationale) {
  if (rationale === undefined || rationale === null) return null
  if (typeof rationale !== 'string') fail('INVALID_RATIONALE', 'rationale must be a string')
  if (/[\r\n]/.test(rationale)) fail('INVALID_RATIONALE', 'rationale must be a single line')
  if (/[<>]/.test(rationale)) fail('INVALID_RATIONALE', 'rationale must not contain markup')
  const trimmed = rationale.trim()
  if (trimmed.length > RATIONALE_MAX_LENGTH) {
    fail('INVALID_RATIONALE', `rationale must be at most ${RATIONALE_MAX_LENGTH} characters`)
  }
  return trimmed.length ? trimmed : null
}

/** Only allowlisted keys survive; an unknown key is rejected rather than dropped. */
export function validateMetadata(metadata) {
  if (metadata === undefined || metadata === null) return {}
  if (typeof metadata !== 'object' || Array.isArray(metadata)) {
    fail('INVALID_METADATA', 'metadata must be an object')
  }
  const unknown = Object.keys(metadata).filter((k) => !METADATA_ALLOWLIST.includes(k))
  if (unknown.length) {
    fail('INVALID_METADATA', 'metadata contains keys outside the allowlist',
      { rejected_keys: unknown })
  }
  return { ...metadata }
}

/** Telemetry only - never used to decide a transition, a score or an outcome. */
function validateTelemetry({ client_ts, elapsed_ms }) {
  const out = { client_ts: null, elapsed_ms: null }
  if (client_ts !== undefined && client_ts !== null) {
    const parsed = new Date(client_ts)
    if (Number.isNaN(parsed.getTime())) fail('INVALID_INTENT', 'client_ts is not a valid timestamp')
    out.client_ts = parsed
  }
  if (elapsed_ms !== undefined && elapsed_ms !== null) {
    if (typeof elapsed_ms !== 'number' || !Number.isFinite(elapsed_ms) || elapsed_ms < 0 || elapsed_ms > 86_400_000) {
      fail('INVALID_INTENT', 'elapsed_ms must be a number between 0 and 86400000')
    }
    out.elapsed_ms = Math.round(elapsed_ms)
  }
  return out
}

/* ------------------------------------------------------------------ *
 * Pure transition resolution - the heart of the engine, no I/O
 * ------------------------------------------------------------------ */

/**
 * Resolves an intent against the pinned definition. Pure and synchronous, so the whole
 * state machine is testable without a database.
 *
 * The scenario's own per-stage scoring list decides which of an intent's candidate event
 * codes applies. That is what makes `safe_pivot` score SAFE_PIVOT on a malicious scenario
 * and CORRECT_USE on a legitimate one without the engine hard-coding either.
 */
export function resolveIntent({ definition, stage, intent, syntheticTargetId = null }) {
  if (!INTENTS.includes(intent)) {
    fail('INVALID_INTENT', `"${intent}" is not a recognised learner intent`)
  }
  if (!STAGE_KEYS.includes(stage)) {
    fail('INVALID_SCENARIO_STATE', `run is in an unknown stage "${stage}"`)
  }

  const rule = STAGE_INTENTS[stage]?.[intent]
  if (!rule) {
    fail('INVALID_TRANSITION', `intent "${intent}" is not available at the "${stage}" stage`)
  }

  const stageIndex = STAGE_KEYS.indexOf(stage)
  const evalStage = definition.evaluation?.stages?.[stageIndex]
  if (!evalStage || evalStage.key !== stage) {
    fail('INVALID_SCENARIO_STATE', `scenario definition has no evaluation data for "${stage}"`)
  }

  // A synthetic target must be one the pinned definition declares.
  if (syntheticTargetId !== null && syntheticTargetId !== undefined) {
    const known = (definition.synthetic?.assets ?? []).some((a) => a.asset_id === syntheticTargetId)
    if (!known) {
      fail('INVALID_TARGET', 'synthetic_target_id does not name an asset in this scenario')
    }
  }

  const declared = new Map((evalStage.scoring ?? []).map((s) => [s.event_code, s]))

  let eventCode = null
  let pointsDelta = 0

  if (rule.telemetry) {
    eventCode = rule.codes[0]
    pointsDelta = 0
  } else if (rule.resolution) {
    // Section 5: correct resolution is whatever the verified disposition requires.
    const correct = (CORRECT_RESOLUTION[definition.disposition] ?? []).includes(intent)
    const wanted = correct ? 'RESOLVE_CORRECT' : 'CONTRADICTORY_UNSAFE_FINAL'
    const hit = declared.get(wanted)
    if (!hit) {
      fail('INVALID_SCENARIO_STATE', `scenario does not define "${wanted}" at the resolve stage`)
    }
    eventCode = wanted
    pointsDelta = hit.points_delta
  } else {
    const match = rule.codes.find((code) => declared.has(code))
    if (!match) {
      fail('INVALID_TRANSITION',
        `intent "${intent}" is not available on this scenario at the "${stage}" stage`)
    }
    eventCode = match
    pointsDelta = declared.get(match).points_delta
  }

  return {
    intent,
    event_code: eventCode,
    points_delta: pointsDelta,
    stage,
    next_stage: rule.next === 'end' ? 'resolve' : rule.next,
    resolves: Boolean(rule.resolution) && !rule.abandon,
    abandons: Boolean(rule.abandon),
    consequence: rule.consequence
      ? { kind: rule.consequence, target: syntheticTargetId ?? null, inert: true, executes: false }
      : null,
    telemetry: Boolean(rule.telemetry) || ENGINE_TELEMETRY_CODES.includes(eventCode),
  }
}

export const clampScenarioScore = (value) =>
  Math.min(SCENARIO_POINTS.max, Math.max(SCENARIO_POINTS.min, value))

/* ------------------------------------------------------------------ *
 * Definition loading
 * ------------------------------------------------------------------ */

/**
 * Loads the pinned content version, evaluation included.
 *
 * A run stays on the version it started with even if that version is later deactivated:
 * silently switching a live run to different content would change the rules mid-scenario.
 * `active` is therefore only enforced when a run is CREATED.
 */
async function loadDefinition({ scenarioId, version, session = null, requireActive = false }) {
  const definition = await ScenarioDefinition
    .findOne({ scenario_id: scenarioId, version })
    .select('+evaluation')
    .session(session)

  if (!definition) {
    fail('SCENARIO_DEFINITION_NOT_FOUND', `no scenario definition ${scenarioId} v${version}`)
  }
  if (requireActive && !definition.active) {
    fail('SCENARIO_DEFINITION_INACTIVE', `scenario ${scenarioId} v${version} is not active`)
  }
  return definition
}

/* ------------------------------------------------------------------ *
 * Run lifecycle
 * ------------------------------------------------------------------ */

/** Starts a run at NOTIFY, pinned to the active content version. */
export async function startScenarioRun({ attemptId, ordinal, scenarioId, version }) {
  let resolvedVersion = version
  if (resolvedVersion === undefined) {
    const active = await ScenarioDefinition.findOne({ scenario_id: scenarioId, active: true })
      .select('version')
      .sort({ version: -1 })
    if (!active) fail('SCENARIO_DEFINITION_NOT_FOUND', `no active scenario definition ${scenarioId}`)
    resolvedVersion = active.version
  }

  const definition = await loadDefinition({
    scenarioId, version: resolvedVersion, requireActive: true,
  })

  const run = await ScenarioRun.create({
    attempt_id: attemptId,
    ordinal,
    scenario_id: definition.scenario_id,
    definition_version: definition.version,
    platform: definition.platform,
    status: 'active',
    current_stage: 'notify',
    last_sequence: 0,
    score_running: 0,
    started_at: new Date(),
  })

  log('run_created', {
    run_id: run.id, scenario_id: run.scenario_id, version: run.definition_version, ordinal,
  })
  return run
}

/** Candidate-safe state for resume. Reads from the database, never from memory. */
export async function getRunState(runId) {
  const run = await ScenarioRun.findById(runId).catch(() => null)
  if (!run) fail('RUN_NOT_FOUND', 'scenario run not found')
  return {
    ...run.toCandidateJSON(),
    // Section 3 hides the running score in assessment mode; the final score is
    // released only once the run is resolved.
    score_visibility: run.status === 'resolved' ? 'final' : 'hidden',
    score_0_10: run.status === 'resolved' ? run.score_0_10 : null,
    outcome_code: run.status === 'resolved' ? run.outcome_code : null,
  }
}

/** Reactivates an abandoned run. A resolved run is terminal and can never reopen. */
export async function resumeScenarioRun(runId) {
  const run = await ScenarioRun.findById(runId).catch(() => null)
  if (!run) fail('RUN_NOT_FOUND', 'scenario run not found')
  if (run.status === 'resolved') {
    fail('RUN_NOT_ACTIVE', 'a resolved run cannot be resumed')
  }
  if (run.status === 'abandoned') {
    run.status = 'active'
    await run.save()
    log('run_resumed', { run_id: run.id, stage: run.current_stage })
  }
  return getRunState(runId)
}

/**
 * Replays the ledger. `ScenarioRun.score_running` is a cache; this is the audit source,
 * and the two must always agree.
 */
export async function recomputeScoreFromEvents(runId) {
  const events = await ScenarioEvent.find({ run_id: runId }).sort({ sequence: 1 }).lean()
  const running = events.reduce((sum, e) => sum + e.points_delta, 0)
  return {
    event_count: events.length,
    sequences: events.map((e) => e.sequence),
    score_running: running,
    score_0_10: clampScenarioScore(running),
  }
}

/** True when the cached score matches a replay of the ledger. */
export async function verifyRunIntegrity(runId) {
  const run = await ScenarioRun.findById(runId)
  if (!run) fail('RUN_NOT_FOUND', 'scenario run not found')
  const replay = await recomputeScoreFromEvents(runId)
  const expected = [...Array(replay.event_count).keys()].map((i) => i + 1)
  return {
    run_id: String(runId),
    score_matches: run.score_running === replay.score_running,
    sequence_contiguous: JSON.stringify(replay.sequences) === JSON.stringify(expected),
    last_sequence_matches: run.last_sequence === replay.event_count,
    cached: { score_running: run.score_running, last_sequence: run.last_sequence },
    replayed: replay,
  }
}

/** The response shape after an accepted (or de-duplicated) intent. */
async function acceptedResponse(run, event, consequence) {
  return {
    run: run.toCandidateJSON(),
    event: {
      sequence: event.sequence,
      event_code: event.event_code,
      stage: event.stage,
      accepted_at: event.server_ts,
    },
    consequence: consequence ?? null,
    score_visibility: run.status === 'resolved' ? 'final' : 'hidden',
    score_0_10: run.status === 'resolved' ? run.score_0_10 : null,
    outcome_code: run.status === 'resolved' ? run.outcome_code : null,
  }
}

/* ------------------------------------------------------------------ *
 * The authoritative hot path
 * ------------------------------------------------------------------ */

/**
 * Submits one learner intent.
 *
 * Transaction boundary (15.25): read run -> assert active -> assert legal -> decide event
 * code, points and next stage -> insert Event -> update ScenarioRun. Two documents,
 * committed together with `{w:1, j:true}`. Nothing else is in the transaction; the
 * caller receives the next state only after commit.
 *
 * Idempotent: a repeated `intent_key` returns the original outcome and scores once.
 */
export async function submitIntent({
  runId,
  intent,
  intentKey,
  expectedStage = null,
  syntheticTargetId = null,
  rationale,
  metadata,
  clientTs,
  elapsedMs,
  ...rest
}) {
  assertNoAuthoritativeInput(rest)

  if (typeof intentKey !== 'string' || !intentKey.trim()) {
    fail('INVALID_INTENT', 'intent_key is required for idempotency')
  }
  const key = intentKey.trim()
  const cleanMetadata = validateMetadata(metadata)
  const cleanRationale = validateRationale(rationale)
  const telemetry = validateTelemetry({ client_ts: clientTs, elapsed_ms: elapsedMs })

  await assertTransactionSupport()

  // Fast path: an already-recorded key is a retry, not a new action.
  const replayed = await replayIfDuplicate(runId, key)
  if (replayed) return replayed

  try {
    const { result } = await withEngineTransaction(async (session) => {
      const run = await ScenarioRun.findById(runId).session(session)
      if (!run) fail('RUN_NOT_FOUND', 'scenario run not found')
      if (run.status === 'resolved') fail('RUN_NOT_ACTIVE', 'this run is already resolved')
      if (run.status === 'abandoned') {
        fail('RUN_NOT_ACTIVE', 'this run is abandoned; resume it before sending intents')
      }

      // Optimistic concurrency: a client acting on a superseded view is told to resync.
      if (expectedStage !== null && expectedStage !== run.current_stage) {
        fail('STALE_STATE', 'the run has moved on since this action was prepared', {
          current_stage: run.current_stage, last_sequence: run.last_sequence,
        })
      }

      const definition = await loadDefinition({
        scenarioId: run.scenario_id, version: run.definition_version, session,
      })

      const decision = resolveIntent({
        definition, stage: run.current_stage, intent, syntheticTargetId,
      })

      const sequence = run.last_sequence + 1
      const [event] = await ScenarioEvent.create([{
        run_id: run._id,
        sequence,
        event_code: decision.event_code,
        stage: decision.stage,
        points_delta: decision.points_delta,
        synthetic_target_id: syntheticTargetId ?? null,
        intent_key: key,
        client_ts: telemetry.client_ts,
        elapsed_ms: telemetry.elapsed_ms,
        server_ts: new Date(),
        metadata: {
          ...cleanMetadata,
          intent,
          transition: `${decision.stage}->${decision.next_stage}`,
          ...(decision.consequence ? { consequence: decision.consequence.kind } : {}),
          ...(decision.resolves ? { resolution_code: intent } : {}),
        },
      }], { session, ordered: true })

      run.last_sequence = sequence
      run.score_running += decision.points_delta
      run.current_stage = decision.next_stage
      run.last_event_at = event.server_ts

      if (decision.abandons) {
        run.status = 'abandoned'
      } else if (decision.resolves) {
        run.status = 'resolved'
        run.score_0_10 = clampScenarioScore(run.score_running)
        run.outcome_code = intent
        run.resolved_at = event.server_ts
        if (cleanRationale) run.rationale = cleanRationale
      }

      await run.save({ session })
      return { run, event, consequence: decision.consequence }
    })

    log(result.run.status === 'resolved' ? 'run_resolved' : 'transition_accepted', {
      run_id: String(runId),
      stage: result.event.stage,
      next_stage: result.run.current_stage,
      event_code: result.event.event_code,
      sequence: result.event.sequence,
    })
    return acceptedResponse(result.run, result.event, result.consequence)
  } catch (error) {
    // A duplicate key here means a concurrent request won the race. Distinguish the two
    // unique indexes: intent_key is idempotency, (run_id, sequence) is concurrency.
    if (isDuplicateKeyError(error)) {
      const fields = duplicateKeyFields(error)
      if (fields.includes('intent_key')) {
        const replay = await replayIfDuplicate(runId, key)
        if (replay) return replay
        fail('DUPLICATE_INTENT', 'this intent has already been recorded')
      }
      if (fields.includes('sequence') || fields.includes('run_id')) {
        const current = await ScenarioRun.findById(runId)
        log('transition_rejected', { run_id: String(runId), reason: 'STALE_STATE' })
        fail('STALE_STATE', 'another action for this run committed first', {
          current_stage: current?.current_stage ?? null,
          last_sequence: current?.last_sequence ?? null,
        })
      }
    }
    if (error?.isDomainError) {
      log('transition_rejected', { run_id: String(runId), code: error.code, intent })
    }
    throw error
  }
}

/** Returns the original outcome for an already-recorded intent key, or null. */
async function replayIfDuplicate(runId, intentKey) {
  const existing = await ScenarioEvent.findOne({ intent_key: intentKey })
  if (!existing) return null
  if (String(existing.run_id) !== String(runId)) {
    fail('DUPLICATE_INTENT', 'this intent_key was already used on a different run')
  }
  const run = await ScenarioRun.findById(runId)
  if (!run) fail('RUN_NOT_FOUND', 'scenario run not found')
  log('duplicate_intent', { run_id: String(runId), sequence: existing.sequence })
  return {
    ...(await acceptedResponse(run, existing, null)),
    duplicate: true,
  }
}

export { loadDefinition }
