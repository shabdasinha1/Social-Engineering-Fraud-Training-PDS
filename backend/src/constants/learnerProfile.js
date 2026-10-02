/**
 * LearnerProfile constants (PROFILE-001, client specification section 2 - closes
 * ACCEPTANCE-001 gap G3).
 */

/**
 * The briefing the learner is currently required to acknowledge.
 *
 * ONE constant, declared once. Section 2 asks for the acknowledgement to be recorded "as a
 * versioned boolean and timestamp", and the version is the whole point: raising this number
 * makes every stored acknowledgement stale, so the briefing is requested again without a
 * single learner record, attempt, run or event being touched. Re-consent is a comparison,
 * never a deletion.
 *
 * Deliberately NOT a content hash and NOT a per-section version. This is a compliance
 * marker for "the learner was shown, and accepted, briefing revision N", not a
 * content-management system.
 */
export const BRIEFING_VERSION = 1

/**
 * How stale `last_seen_at` may get before a session read refreshes it.
 *
 * `GET /candidates/me` runs on every mount of the learner shell - every reload, every
 * route that remounts the provider - so writing on each one would put a database write
 * behind a page render. Fifteen minutes is far finer than the eight-hour session it
 * describes, and it makes the write rate a property of elapsed time rather than of how
 * often the learner refreshes.
 */
export const LAST_SEEN_THROTTLE_MS = 15 * 60 * 1000
