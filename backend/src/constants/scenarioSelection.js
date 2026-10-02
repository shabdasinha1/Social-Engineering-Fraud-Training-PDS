/**
 * Attempt composition rules (SELECT-002).
 *
 * Every value here is quoted from the client specification section 5, "Scoring,
 * Randomization and Attempt Rules". None of it is an engineering preference, so none of
 * it may be tuned without a specification change.
 */

/** Bump when the ALGORITHM changes, so old attempts stay reproducible under their own version. */
export const SELECTION_ALGORITHM_VERSION = '1.0.0'

/** "Exactly 10 resolved scenarios." */
export const ATTEMPT_SCENARIO_COUNT = 10

/** "Exactly 8 malicious/deceptive and 2 legitimate, with legitimate items from different platforms." */
export const DISPOSITION_QUOTA = { malicious: 8, legitimate: 2 }
export const LEGITIMATE_PLATFORM_MINIMUM = 2

/** "Target 3 Easy, 4 Medium and 3 Hard." */
export const DIFFICULTY_QUOTA = { easy: 3, medium: 4, hard: 3 }

/** "Use a rotating 3/3/2/2 allocation so every platform appears and long-run exposure is balanced." */
export const PLATFORM_PATTERN = [3, 3, 2, 2]

/**
 * Fixed canonical order the rotation is applied over. Not learner-facing, and not the
 * order scenarios are presented in - that is shuffled separately.
 */
export const PLATFORM_ORDER = ['whatsapp', 'instagram', 'email', 'sms']

/** "Include 2-4 fictional military-context cases per attempt." */
export const MILITARY_RANGE = { min: 2, max: 4 }

/** "At least five psychological triggers" - counted over canonical trigger ids. */
export const MIN_DISTINCT_TRIGGERS = 5

/** "no attack family more than twice" - counted over canonical families. */
export const MAX_PER_CANONICAL_FAMILY = 2

/** "Exclude the learner's most recent 20 scenario IDs where possible." */
export const RECENT_EXCLUSION_WINDOW = 20

/** "Adaptive practice is a separate mode so comparisons remain meaningful." */
export const ATTEMPT_MODES = ['assessment', 'training']

export const ATTEMPT_STATUSES = ['in_progress', 'completed', 'abandoned']

/**
 * Presentation ordering: section 3 says "Do not lock apps into a fixed sequence", so the
 * ten scenarios are shuffled and long single-platform runs are broken up.
 */
export const MAX_CONSECUTIVE_SAME_PLATFORM = 2

/** Bounded so a pathological pool fails fast instead of searching forever. */
export const MAX_SEARCH_STEPS = 200_000

export const SELECTION_ERRORS = {
  SELECTION_POOL_INSUFFICIENT: 409,
  SELECTION_CONSTRAINT_UNSATISFIABLE: 409,
  SELECTION_TRANSACTION_UNAVAILABLE: 503,
  SELECTION_INVALID_PROFILE: 400,
  SELECTION_INVALID_CONTENT_VERSION: 409,
  SELECTION_INVALID_MODE: 422,
  SELECTION_ATTEMPT_IN_PROGRESS: 409,
  SELECTION_INTERNAL_ERROR: 500,
}

/** Not an error: recorded on the attempt when the recent-20 window had to be relaxed. */
export const RELAXATION_RECENT_EXCLUSION = 'SELECTION_RECENT_EXCLUSION_RELAXED'
