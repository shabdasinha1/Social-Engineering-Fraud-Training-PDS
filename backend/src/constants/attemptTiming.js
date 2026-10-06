/**
 * Attempt timing vocabulary (IMMERSIVE-001).
 *
 * The 90-minute assessment limit. Approved by the client on 9 September 2026 as decisions
 * C1/C2/C3 in `docs/IMMERSIVE_ASSESSMENT_ARCHITECTURE_PLAN.md` section 21.
 *
 * ### This is an AMENDMENT to client specification v1.0, not a requirement from it
 *
 * The specification contains no time limit anywhere - verified by full-text search of all
 * 116 pages and every other client artefact during the immersive architecture audit. Every
 * value here is therefore a client decision recorded after handoff, and it is kept in its
 * own file precisely so that provenance stays visible: nothing in this file may be quoted
 * as a section reference.
 *
 * What the amendment does NOT change: section 5's nine scoring events and their deltas,
 * the per-scenario 0-10 clamp, the 0-100 attempt sum, "exactly 10 resolved scenarios", and
 * section 6's "closing/reopening resumes at the last committed state". The timer is built
 * on top of those, never around them.
 */

/* ------------------------------------------------------------------ *
 * Duration
 * ------------------------------------------------------------------ */

/**
 * C1: "Assessment duration: 90 minutes."
 *
 * ### Why this field is called `time_limit_ms` and not `duration_ms`
 *
 * The architecture plan (section 5.2) proposed `duration_ms`. Inspecting the code first -
 * which is what the plan's own task definition asks for - found that name already taken,
 * with the OPPOSITE meaning: `attemptViewerService` publishes `duration_ms` as
 * `completed_at - started_at`, the time the learner actually TOOK, and
 * `exportReportService` prints it as "Duration" in both the CSV and the PDF, and
 * `attemptResultService` uses it the same way.
 *
 * Reusing the name for the time ALLOWED would have put two contradictory meanings on one
 * key in one domain, and the first instructor export to read the wrong one would have
 * printed "90 minutes" as every learner's completion time. The deviation from the plan is
 * deliberate and is recorded in PROJECT_MASTER_PLAN.md 16.12.
 */
export const ASSESSMENT_TIME_LIMIT_MS = 30 * 60 * 1000

/**
 * Instructor-configurable assessment duration (Admin -> Settings).
 *
 * A closed list, in minutes: these five values are the ONLY durations the configuration
 * may hold, and the server rejects anything else. The default for a fresh or unset
 * configuration is 30 minutes (ASSESSMENT_TIME_LIMIT_MS; changed from C1's original 90 on
 * client request, 5 Oct 2026). A stored setting is never rewritten by this default.
 *
 * The configured value is a DEFAULT for new attempts only. `createAttempt()` snapshots it
 * into the attempt's own `time_limit_ms` / `expires_at`, and the model freezes both, so a
 * later change can never lengthen or shorten an attempt that has already started.
 */
export const ASSESSMENT_DURATION_OPTIONS_MINUTES = [30, 45, 60, 75, 90]
export const ASSESSMENT_DURATION_DEFAULT_MINUTES = ASSESSMENT_TIME_LIMIT_MS / 60000

/**
 * Bounds for any future instructor-configurable duration.
 *
 * Nothing reads these yet - the limit is a constant in this task. They exist so that when
 * ADMIN-004's `Configuration` model does own the value, the clamp is already defined here
 * beside the default rather than invented at the call site.
 *
 * Deliberately NOT overridable from the environment. A shorter duration for testing is
 * achieved by back-dating `expires_at` directly in an isolated database - a fixture
 * concern - rather than by giving production code a switch that shortens real assessments.
 */
export const ASSESSMENT_TIME_LIMIT_MIN_MS = 15 * 60 * 1000
export const ASSESSMENT_TIME_LIMIT_MAX_MS = 240 * 60 * 1000

/** Clamps a proposed limit into the supported range. */
export function clampTimeLimit(ms) {
  if (!Number.isFinite(ms)) return ASSESSMENT_TIME_LIMIT_MS
  return Math.min(ASSESSMENT_TIME_LIMIT_MAX_MS, Math.max(ASSESSMENT_TIME_LIMIT_MIN_MS, Math.round(ms)))
}

/* ------------------------------------------------------------------ *
 * Lifecycle
 * ------------------------------------------------------------------ */

/**
 * Why an attempt stopped being in progress. Null while it is running.
 *
 * `status` alone cannot answer this: a timed-out attempt and a learner-finished attempt
 * are both `completed`, because both produce a real, scoreable, comparable result. The
 * distinction the instructor and the learner need lives here.
 */
export const ATTEMPT_END_REASONS = ['learner_completed', 'expired', 'instructor_reset']

/**
 * The `outcome_code` written on a run the expiry had to close.
 *
 * C2: "Do not fabricate a decision for an unresolved scenario." This code is therefore
 * NOT one of the six resolve intents - it is deliberately outside `CORRECT_RESOLUTION`, so
 * no code path can mistake it for a learner's final action, and `classifyOutcome` gives it
 * its own outcome class rather than scoring it as a right or wrong answer.
 */
export const EXPIRED_OUTCOME_CODE = 'resolve_expired'

/** Engine telemetry written to the ledger for each run the expiry closed. Zero points. */
export const RUN_EXPIRED_EVENT_CODE = 'RUN_EXPIRED'

/* ------------------------------------------------------------------ *
 * Enforcement
 * ------------------------------------------------------------------ */

/** How often the background sweeper looks for overdue attempts. */
export const EXPIRY_SWEEP_INTERVAL_MS = 30 * 1000

/**
 * How many overdue attempts one sweep may finalise.
 *
 * Bounded so a pathological backlog cannot monopolise the event loop on a machine that is
 * also serving a learner. Whatever is left is picked up on the next tick.
 */
export const EXPIRY_SWEEP_BATCH = 50

/**
 * Client-facing error code when an action arrives after the deadline.
 *
 * Distinct from `ATTEMPT_NOT_IN_PROGRESS`, which covers an instructor reset and an
 * ordinary completion: the frontend shows a different screen for "your time ran out" than
 * for "this attempt was reset", and a shared code would make that impossible.
 */
export const ATTEMPT_EXPIRED_CODE = 'ATTEMPT_EXPIRED'
export const ATTEMPT_EXPIRED_MESSAGE =
  'The time limit for this assessment has been reached. Your result has been saved.'

/* ------------------------------------------------------------------ *
 * Presentation
 * ------------------------------------------------------------------ */

/** Remaining-time thresholds at which the learner is warned. Frontend only. */
export const EXPIRY_WARNINGS_MS = [10 * 60 * 1000, 2 * 60 * 1000]
