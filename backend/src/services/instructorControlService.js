import mongoose from 'mongoose'
import {
  ARCHIVE_BODY_FIELDS,
  ARCHIVE_REASON_CODES,
  CONFIG_BODY_FIELDS,
  CONFIG_SCOPE,
  FEEDBACK_CONFIG_KEYS,
  FEEDBACK_KEY_FOR_MODE,
  FEEDBACK_TIMINGS,
  FEEDBACK_TIMING_DEFAULTS,
  IDEMPOTENCY_KEY_PATTERN,
  RESET_BODY_FIELDS,
  RESET_REASON_CODES,
  RESET_SOURCE_STATUS,
  RESET_TARGET_STATUS,
} from '../constants/instructorControls.js'
import { Attempt } from '../models/Attempt.js'
import { Candidate } from '../models/Candidate.js'
import { Configuration } from '../models/Configuration.js'
import { ScenarioRun } from '../models/ScenarioRun.js'
import { ApiError } from '../utils/ApiError.js'
import { assertTransactionSupport, withEngineTransaction } from '../utils/transactions.js'
import { append } from './auditService.js'

/**
 * Instructor controls (ADMIN-004).
 *
 * Specification section 6: "Controls: reset incomplete attempt, archive profile under
 * local policy, configure training vs assessment feedback timing."
 *
 * Three operations, and each one is the smallest change that achieves its effect:
 *
 *   RESET    moves an in-progress attempt to `abandoned` and abandons its unresolved runs.
 *            Nothing is deleted, no score is written, no result is fabricated.
 *   ARCHIVE  sets three fields on a profile. Nothing is deleted; every attempt, run,
 *            event and audit entry survives untouched.
 *   CONFIG   writes two enum fields on one settings document.
 *
 * ### Every change commits with its audit entry
 *
 * All three run inside `withEngineTransaction` and pass the session to ADMIN-005's
 * `append()`, which opens no transaction of its own. If the write rolls back, the audit
 * entry disappears with it; if the audit fails, the change does. The log can therefore
 * never claim a reset that did not happen, nor miss one that did.
 *
 * ### An operation that changes nothing records nothing
 *
 * Re-archiving an archived profile, or setting a configuration value to what it already
 * is, reports `changed: false` and writes no entry - the same convention ADMIN-001 uses
 * for republication. An audit log full of no-ops is an audit log nobody reads.
 */

const fail = (status, code, message, details = null) => {
  throw new ApiError(status, code, message, details)
}

/* ------------------------------------------------------------------ *
 * Shared input rules
 * ------------------------------------------------------------------ */

/**
 * Rejects a body carrying anything outside its allowlist.
 *
 * Rejected, never ignored: an instructor who believes they sent `status: "completed"` and
 * got a 200 has been told something untrue about what happened to a learner's attempt.
 */
function takeBody(body, allowed) {
  if (body === null || body === undefined) return {}
  if (typeof body !== 'object' || Array.isArray(body)) {
    fail(422, 'FORBIDDEN_FIELD', 'A request body must be an object.')
  }
  const unknown = Object.keys(body).filter((key) => !allowed.includes(key))
  if (unknown.length) {
    fail(422, 'FORBIDDEN_FIELD', 'That is not part of this request.',
      { rejected_fields: unknown, allowed_fields: allowed })
  }
  return body
}

/** An optional reason, checked against a closed vocabulary. Never free text. */
function takeReasonCode(value, allowed) {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string' || !allowed.includes(value)) {
    fail(422, 'INVALID_REASON_CODE', `reason_code must be one of: ${allowed.join(', ')}.`)
  }
  return value
}

/** An optional opaque idempotency token. Same rule ADMIN-003 uses. */
function takeIdempotencyKey(value) {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string' || !IDEMPOTENCY_KEY_PATTERN.test(value)) {
    fail(422, 'INVALID_IDEMPOTENCY_KEY',
      'An idempotency key must be 8-128 characters of letters, digits, "_", ".", ":" or "-".')
  }
  return value
}

/* ------------------------------------------------------------------ *
 * Control 1 - reset an incomplete attempt
 * ------------------------------------------------------------------ */

/**
 * The instructor-safe view of a reset. An allowlist; no learner data of any kind.
 */
const resetResult = ({ attempt, previousStatus, scenariosDiscarded, changed }) => ({
  attempt_id: attempt._id.toString(),
  previous_status: previousStatus,
  status: attempt.status,
  reset_at: attempt.status === RESET_TARGET_STATUS ? (attempt.updatedAt ?? null) : null,
  scenarios_discarded: scenariosDiscarded,
  scenarios_preserved: attempt.scenario_sequence.length - scenariosDiscarded,
  result_available: false,
  total_score: null,
  changed,
})

/**
 * Resets one incomplete attempt.
 *
 * ### What "reset" means here, and why
 *
 * The attempt moves to `abandoned` - the third value `ATTEMPT_STATUSES` has declared since
 * SELECT-002 and which nothing produced until now - and its unresolved runs move to
 * `abandoned` too. **Nothing is deleted.** The attempt, all ten runs, every resolved
 * score and the whole event ledger stay exactly where they are, so the instructor can
 * still inspect what happened and the ledger stays the audit source of truth.
 *
 * Deleting would have been simpler and much worse: the events are the record the score is
 * reproducible from, and a reset that erases them destroys the evidence of the thing being
 * reset.
 *
 * ### Why no query had to change
 *
 * Every learner path already asks for `status: 'in_progress'`:
 *
 *   findActiveAttempt      -> no resumable attempt, so `GET /attempts/current` is null
 *   createAttempt guard    -> the learner may start a fresh attempt immediately
 *   submitIntent / resolve -> 409 ATTEMPT_NOT_IN_PROGRESS
 *   completeAttempt        -> 409, so a reset attempt can never become completed
 *   buildAttemptResult     -> 409 ATTEMPT_NOT_COMPLETE, so no result is ever produced
 *
 * The one path that did not check was `GET /:attemptId/current-run`, which is read-only;
 * ADMIN-004 added the status guard there so a reset attempt cannot even look resumable.
 *
 * ### What is never done
 *
 * No score is written, no total is computed, no completed result is produced, no
 * replacement attempt is created, no ScenarioDefinition is touched, and no other learner
 * is read or written.
 */
export async function resetAttempt(attemptId, { actor, body = {} } = {}) {
  const clean = takeBody(body, RESET_BODY_FIELDS)
  const reasonCode = takeReasonCode(clean.reason_code, RESET_REASON_CODES)
  const idempotencyKey = takeIdempotencyKey(clean.idempotency_key)

  if (!mongoose.isValidObjectId(attemptId)) {
    fail(404, 'ATTEMPT_NOT_FOUND', 'Attempt not found.')
  }
  const existing = await Attempt.findById(attemptId).catch(() => null)
  if (!existing) fail(404, 'ATTEMPT_NOT_FOUND', 'Attempt not found.')

  // Already reset: report it, change nothing, record nothing. A retry is not a second act.
  if (existing.status === RESET_TARGET_STATUS) {
    return resetResult({
      attempt: existing,
      previousStatus: RESET_TARGET_STATUS,
      scenariosDiscarded: await ScenarioRun.countDocuments({
        attempt_id: existing._id, status: RESET_TARGET_STATUS,
      }),
      changed: false,
    })
  }

  // A completed attempt is history. It is never reopened, reset or rewritten.
  if (existing.status !== RESET_SOURCE_STATUS) {
    fail(409, 'ATTEMPT_NOT_RESETTABLE',
      'Only an attempt that is still in progress can be reset.',
      { status: existing.status })
  }

  await assertTransactionSupport()

  const { result } = await withEngineTransaction(async (session) => {
    // Re-read under the guard: an attempt the learner completed a moment ago must not be
    // reset by a request that was prepared before they finished.
    const fresh = await Attempt.findOne({ _id: existing._id, status: RESET_SOURCE_STATUS })
      .session(session)
    if (!fresh) {
      const now = await Attempt.findById(existing._id).session(session)
      return { attempt: now, previousStatus: now?.status ?? null, discarded: 0, changed: false }
    }

    const discarded = await ScenarioRun.updateMany(
      { attempt_id: fresh._id, status: { $ne: 'resolved' } },
      { $set: { status: RESET_TARGET_STATUS } },
      { session },
    )

    fresh.status = RESET_TARGET_STATUS
    // completed_at and total_score are deliberately left null: a reset attempt was never
    // completed, and writing either would invent a result.
    /**
     * IMMERSIVE-001: say WHY it ended, in the same write as the status.
     *
     * This is what keeps an instructor reset distinguishable from a timeout now that both
     * are terminal. They are already different statuses - `abandoned` versus `completed` -
     * but recording the reason explicitly means a reader never has to infer intent from a
     * status, and the attempt viewer can label the two differently without guessing.
     */
    fresh.end_reason = 'instructor_reset'
    await fresh.save({ session })

    await append({
      actor,
      action: 'ATTEMPT_RESET',
      resourceType: 'attempt',
      resourceId: fresh._id.toString(),
      status: 'succeeded',
      metadata: {
        attempt_id: fresh._id.toString(),
        attempt_status: RESET_SOURCE_STATUS,
        scenarios_discarded: discarded.modifiedCount ?? 0,
        ...(reasonCode ? { reason_code: reasonCode } : {}),
      },
      idempotencyKey,
      session,
    })

    return {
      attempt: fresh,
      previousStatus: RESET_SOURCE_STATUS,
      discarded: discarded.modifiedCount ?? 0,
      changed: true,
    }
  })

  // The learner finished it between the read and the transaction: nothing was reset.
  if (!result.changed) {
    fail(409, 'ATTEMPT_NOT_RESETTABLE',
      'This attempt is no longer in progress and was not reset.',
      { status: result.attempt?.status ?? null })
  }

  return resetResult({
    attempt: result.attempt,
    previousStatus: result.previousStatus,
    scenariosDiscarded: result.discarded,
    changed: true,
  })
}

/* ------------------------------------------------------------------ *
 * Control 2 - archive a learner profile
 * ------------------------------------------------------------------ */

/** The instructor-safe view of a profile's archival state. No identity data. */
const archiveResult = (profile, changed) => ({
  profile_id: profile._id.toString(),
  archived: profile.archived === true,
  archived_at: profile.archived_at ?? null,
  archived_by: profile.archived_by ? profile.archived_by.toString() : null,
  changed,
})

/**
 * Archives one learner profile.
 *
 * **This is not deletion, and there is no delete.** Three fields are set. The profile
 * document, its attempts, its runs, its events, its exported reports and its audit history
 * are all left exactly as they are, and an instructor can still list and inspect every one
 * of them through ADMIN-002.
 *
 * What changes is normal learner access:
 *
 *   sign-in           -> 403 PROFILE_ARCHIVED, and signing in NEVER un-archives
 *   an open session   -> 401 PROFILE_ARCHIVED on the next request
 *
 * An in-progress attempt belonging to an archived profile is **left intact and is not
 * reset**. Archiving is a statement about the person's access, not about their work; an
 * instructor who also wants the attempt closed resets it deliberately, and that is a
 * separate audited act. The attempt simply becomes unreachable by the learner.
 *
 * There is no unarchive route. Specification section 6 asks for archival and says nothing
 * about reinstatement, and inventing a lifecycle the client did not ask for is how an
 * "archive" quietly becomes a toggle.
 */
export async function archiveProfile(profileId, { actor, body = {} } = {}) {
  const clean = takeBody(body, ARCHIVE_BODY_FIELDS)
  const reasonCode = takeReasonCode(clean.reason_code, ARCHIVE_REASON_CODES)
  const idempotencyKey = takeIdempotencyKey(clean.idempotency_key)

  if (!mongoose.isValidObjectId(profileId)) {
    fail(404, 'PROFILE_NOT_FOUND', 'Learner profile not found.')
  }
  const existing = await Candidate.findById(profileId).catch(() => null)
  if (!existing) fail(404, 'PROFILE_NOT_FOUND', 'Learner profile not found.')

  // Already archived: idempotent, and no second entry claiming a second archival.
  if (existing.archived) return archiveResult(existing, false)

  await assertTransactionSupport()

  const { result } = await withEngineTransaction(async (session) => {
    const fresh = await Candidate.findOne({ _id: existing._id, archived: { $ne: true } })
      .session(session)
    if (!fresh) {
      return { profile: await Candidate.findById(existing._id).session(session), changed: false }
    }

    fresh.archived = true
    fresh.archived_at = new Date()
    fresh.archived_by = actor?._id ?? null
    await fresh.save({ session })

    await append({
      actor,
      action: 'PROFILE_ARCHIVED',
      resourceType: 'learner_profile',
      resourceId: fresh._id.toString(),
      status: 'succeeded',
      // No name, no service number, no attempt count - an identifier and a category.
      metadata: reasonCode ? { reason_code: reasonCode } : {},
      idempotencyKey,
      session,
    })

    return { profile: fresh, changed: true }
  })

  return archiveResult(result.profile, result.changed)
}

/* ------------------------------------------------------------------ *
 * Control 3 - training vs assessment feedback timing
 * ------------------------------------------------------------------ */

/**
 * The one settings document, created on first read with the documented defaults.
 *
 * Created rather than assumed: a GET before any change must return the values actually in
 * force, and inventing them in the response while the database held nothing would make
 * the first PATCH's "previous value" a guess.
 */
export async function loadFeedbackConfig({ session = null } = {}) {
  const found = await Configuration.findOne({ scope: CONFIG_SCOPE }).session(session)
  if (found) return found

  try {
    const [created] = await Configuration.create(
      [{ scope: CONFIG_SCOPE }], session ? { session } : {},
    )
    return created
  } catch (error) {
    // Two first reads at once: the unique index rejects the loser, which then reads it.
    const raced = await Configuration.findOne({ scope: CONFIG_SCOPE }).session(session)
    if (raced) return raced
    throw error
  }
}

/** The whole configuration surface, plus the vocabulary a client needs to render it. */
export async function getFeedbackConfig() {
  const config = await loadFeedbackConfig()
  return {
    config: config.toAdminJSON(),
    allowed_timings: [...FEEDBACK_TIMINGS],
    defaults: { ...FEEDBACK_TIMING_DEFAULTS },
    /**
     * Said plainly, because an instructor setting `immediate` is entitled to know whether
     * anything will act on it. See docs/ADMIN_INSTRUCTOR_CONTROLS.md section 9.
     */
    enforcement: {
      on_completion: 'enforced - feedback is held until the attempt completes',
      immediate: 'enforced - each scenario\'s feedback card is released as it resolves',
    },
  }
}

/**
 * The timing in force for one attempt mode (ADM-007: read by the learner resolve path).
 *
 * The single read point, so the policy is never re-derived in two places. Read-only: a
 * learner's request never creates the settings document, and an unset key falls back to
 * the documented default, so behaviour is unchanged until an instructor changes it.
 */
export async function effectiveFeedbackTiming(mode) {
  const key = FEEDBACK_KEY_FOR_MODE[mode]
  if (!key) return FEEDBACK_TIMING_DEFAULTS.assessment
  const config = await Configuration.findOne({ scope: CONFIG_SCOPE }).select(key).lean()
  return FEEDBACK_TIMINGS.includes(config?.[key]) ? config[key] : FEEDBACK_TIMING_DEFAULTS[mode]
}

/**
 * Changes feedback timing.
 *
 * Every value is checked against a closed enum before anything is written, so no arbitrary
 * JSON, no JavaScript value and no unknown key can reach the document - `strict: 'throw'`
 * on the schema is the second layer.
 *
 * **One audit entry per key that actually changed**, all inside one transaction. That is
 * what ADMIN-005's metadata allowlist is shaped for: `config_key`,
 * `config_previous_value`, `config_new_value` are singular, and one entry per key keeps
 * each record a complete statement rather than a diff needing another record to read.
 * A request that changes nothing writes nothing.
 */
export async function updateFeedbackConfig({ actor, body = {} } = {}) {
  const clean = takeBody(body, CONFIG_BODY_FIELDS)
  const idempotencyKey = takeIdempotencyKey(clean.idempotency_key)

  const wanted = {}
  for (const key of FEEDBACK_CONFIG_KEYS) {
    if (clean[key] === undefined) continue
    if (typeof clean[key] !== 'string' || !FEEDBACK_TIMINGS.includes(clean[key])) {
      fail(422, 'INVALID_FEEDBACK_TIMING',
        `${key} must be one of: ${FEEDBACK_TIMINGS.join(', ')}.`, { rejected_fields: [key] })
    }
    wanted[key] = clean[key]
  }
  if (!Object.keys(wanted).length) {
    fail(422, 'EMPTY_CONFIG_UPDATE',
      `Set at least one of: ${FEEDBACK_CONFIG_KEYS.join(', ')}.`)
  }

  let expectedVersion = null
  if (clean.expected_config_version !== undefined && clean.expected_config_version !== null) {
    if (!Number.isInteger(clean.expected_config_version) || clean.expected_config_version < 1) {
      fail(422, 'FORBIDDEN_FIELD', 'expected_config_version must be a whole number.',
        { rejected_fields: ['expected_config_version'] })
    }
    expectedVersion = clean.expected_config_version
  }

  await assertTransactionSupport()

  const { result } = await withEngineTransaction(async (session) => {
    const config = await loadFeedbackConfig({ session })

    // Optimistic concurrency: an instructor editing a stale view is told to re-read
    // rather than silently overwriting a colleague's change.
    if (expectedVersion !== null && expectedVersion !== config.config_version) {
      fail(409, 'CONFIG_VERSION_CONFLICT',
        'This configuration has changed since it was read. Re-read it and try again.',
        { expected_config_version: expectedVersion, config_version: config.config_version })
    }

    const changes = Object.entries(wanted)
      .filter(([key, value]) => config[key] !== value)
      .map(([key, value]) => ({ key, previous: config[key], next: value }))

    // Setting a value to what it already is changes nothing and records nothing.
    if (!changes.length) return { config, changes: [] }

    for (const change of changes) config[change.key] = change.next
    config.config_version += 1
    config.updated_by = actor?._id ?? null
    config.updated_by_username = actor?.username ?? null
    await config.save({ session })

    for (const change of changes) {
      await append({
        actor,
        action: 'CONFIG_CHANGED',
        resourceType: 'configuration',
        resourceId: change.key,
        status: 'succeeded',
        metadata: {
          config_key: change.key,
          config_previous_value: change.previous,
          config_new_value: change.next,
        },
        // One key per entry, so a multi-key change cannot collide on one idempotency key.
        idempotencyKey: idempotencyKey ? `${idempotencyKey}:${change.key}` : null,
        session,
      })
    }

    return { config, changes }
  })

  return {
    config: result.config.toAdminJSON(),
    allowed_timings: [...FEEDBACK_TIMINGS],
    changed: result.changes.length > 0,
    changed_keys: result.changes.map((change) => change.key),
  }
}
