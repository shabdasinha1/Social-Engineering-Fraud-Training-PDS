/**
 * The instructor-controls vocabulary (ADMIN-004).
 *
 * Specification section 6, fourth admin capability:
 *
 *   "Controls: reset incomplete attempt, archive profile under local policy, configure
 *    training vs assessment feedback timing."
 *
 * Three controls, and deliberately nothing else. Every value an instructor may send is
 * named here, so the surface cannot widen by accident.
 *
 * ### What an instructor may NOT configure
 *
 * Not scoring values, not the attack-family or trigger taxonomy, not selection rules, not
 * evaluation keys, not a security boundary and not anything about the network. Those are
 * either client content (DATA-001/002), a resolved design decision (15.23/15.24), or the
 * deployment boundary (DEPLOY-001). The configuration surface here is two enum fields.
 *
 * ### Nothing new was added to the audit vocabulary
 *
 * ADMIN-005 already defines `ATTEMPT_RESET`, `PROFILE_ARCHIVED` and `CONFIG_CHANGED`, the
 * resource types `attempt`, `learner_profile` and `configuration`, and every metadata key
 * used below. No action, resource type or metadata key was invented for this task.
 */

/* ------------------------------------------------------------------ *
 * Reset
 * ------------------------------------------------------------------ */

/**
 * The only body fields a reset request may carry.
 *
 * There is no `status`, no `score`, no `profile_id` and no attempt field of any kind: the
 * server decides the resulting state, and the attempt is named by the URL.
 */
export const RESET_BODY_FIELDS = ['reason_code', 'idempotency_key']

/**
 * Why an attempt was reset. A closed vocabulary, stored in the audit log's existing
 * `reason_code` metadata key.
 *
 * Stable categories, never free text: a reason field that accepts prose eventually
 * accepts a learner's name, an incident description, or a note about someone's health.
 */
export const RESET_REASON_CODES = [
  'learner_request',
  'technical_fault',
  'session_interrupted',
  'instructor_policy',
  'duplicate_attempt',
]

/**
 * The status a reset attempt is moved to.
 *
 * `abandoned` is NOT a new state - it is the third value `ATTEMPT_STATUSES` has declared
 * since SELECT-002, and until now nothing produced it. Using it rather than inventing a
 * `reset` status keeps one lifecycle: every existing query that asks for `in_progress`
 * already excludes it, so the learner's resume path closes without a single query change.
 */
export const RESET_TARGET_STATUS = 'abandoned'

/** Only an attempt in this status may be reset. A completed attempt never may. */
export const RESET_SOURCE_STATUS = 'in_progress'

/* ------------------------------------------------------------------ *
 * Archive
 * ------------------------------------------------------------------ */

/** The only body fields an archive request may carry. */
export const ARCHIVE_BODY_FIELDS = ['reason_code', 'idempotency_key']

/** Why a profile was archived. Same closed-vocabulary rule as a reset reason. */
export const ARCHIVE_REASON_CODES = [
  'course_complete',
  'posting_change',
  'local_policy',
  'duplicate_profile',
  'instructor_policy',
]

/* ------------------------------------------------------------------ *
 * Feedback timing
 * ------------------------------------------------------------------ */

/**
 * Section 4: "training mode immediate, assessment mode may defer detail until attempt
 * completion."
 *
 * Two values, because the specification names two. `immediate` means feedback may be
 * shown as each scenario resolves; `on_completion` means it is held until the attempt
 * finishes and the RESULT-001 result is produced.
 *
 * This governs WHEN feedback may be shown. It never governs what the feedback says, what
 * the correct action is, or what anything scores.
 */
export const FEEDBACK_TIMINGS = ['immediate', 'on_completion']

/**
 * The defaults, and why they are these.
 *
 * **They preserve the behaviour the product shipped with.** Until ADM-007 no surface
 * released feedback mid-attempt, so both modes are `on_completion` and an unset
 * configuration still behaves exactly as before.
 *
 * ADM-007 made the setting take effect: when a mode's timing is `immediate`, the resolve
 * response carries that scenario's authored feedback card, and the learner sees it before
 * moving on. `on_completion` holds it for the result screen. The specification expects
 * training to be `immediate`; an instructor sets that here. See
 * docs/ADMIN_INSTRUCTOR_CONTROLS.md §9.
 */
export const FEEDBACK_TIMING_DEFAULTS = {
  training: 'on_completion',
  assessment: 'on_completion',
}

/** The two configurable keys. Each is audited under its own name. */
export const FEEDBACK_CONFIG_KEYS = ['training_feedback_timing', 'assessment_feedback_timing']

/** Mode -> the configuration key that governs it. */
export const FEEDBACK_KEY_FOR_MODE = {
  training: 'training_feedback_timing',
  assessment: 'assessment_feedback_timing',
}

/**
 * The only body fields a configuration update may carry.
 *
 * `expected_config_version` is optional optimistic concurrency: an instructor editing a
 * stale view is told to re-read rather than silently overwriting a colleague's change.
 */
export const CONFIG_BODY_FIELDS = [
  ...FEEDBACK_CONFIG_KEYS,
  'expected_config_version',
  'idempotency_key',
]

/** One settings document. The scope names it; there is never a second row. */
export const CONFIG_SCOPE = 'instructor'

/* ------------------------------------------------------------------ *
 * Shared input rules
 * ------------------------------------------------------------------ */

/** Same shape ADMIN-003 uses. An idempotency key is an opaque token, not a payload. */
export const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_.:-]{8,128}$/

/* ------------------------------------------------------------------ *
 * Errors
 * ------------------------------------------------------------------ */

/** Stable domain codes. No message echoes an instructor's input or a learner's data. */
export const INSTRUCTOR_CONTROL_ERRORS = {
  FORBIDDEN_FIELD: 422,
  INVALID_REASON_CODE: 422,
  INVALID_IDEMPOTENCY_KEY: 422,
  INVALID_FEEDBACK_TIMING: 422,
  EMPTY_CONFIG_UPDATE: 422,
  ATTEMPT_NOT_FOUND: 404,
  PROFILE_NOT_FOUND: 404,
  ATTEMPT_NOT_RESETTABLE: 409,
  CONFIG_VERSION_CONFLICT: 409,
}

/** What a learner is told when their profile has been archived. Never why. */
export const PROFILE_ARCHIVED_CODE = 'PROFILE_ARCHIVED'
export const PROFILE_ARCHIVED_MESSAGE =
  'This profile is not available for training. Please speak to your instructor.'
