/**
 * The instructor dashboard vocabulary (ENHANCEMENT-001, MOM 24 September 2026).
 *
 * The dashboard is an AGGREGATE, READ-ONLY view over completed-attempt data that already
 * exists. It invents no metric: every rate below is a ratio of counts produced by the
 * authoritative RESULT-001 outcome classifier (`classifyOutcome`) over committed
 * `ScenarioRun` scores - the same classification the learner's result screen and the
 * instructor attempt viewer show. See docs/ADMIN_DASHBOARD.md for each calculation.
 *
 * What it may never publish: a learner name, a service number, a profile or attempt id, a
 * scenario id, an event code, an outcome code, a learner action or a typed rationale. The
 * response is counts and ratios per platform, per score band and per day - nothing that
 * identifies a person or a scenario.
 */

/**
 * `GET /api/admin/dashboard` accepts NO query parameters (ENHANCEMENT-001B). Any key is
 * refused rather than ignored, so a stale client that still sends `mode` is told plainly.
 */
export const DASHBOARD_PARAMS = []

/**
 * The product is an assessment system, so the dashboard reports assessment attempts only.
 * The attempt model still carries `mode` and the candidate API still accepts `training`
 * (that architecture is unchanged); such attempts are simply outside these figures.
 */
export const DASHBOARD_MODE = 'assessment'

/**
 * Score distribution bands over the 0-100 attempt total: 0-9, 10-19, ... 80-89, 90-100.
 * The last band is inclusive of 100 so a perfect score has somewhere to go.
 */
export const SCORE_BAND_WIDTH = 10
export const SCORE_MAX = 100

/** The completion activity window, in whole UTC days ending today. */
export const ACTIVITY_DAYS = 14

/**
 * Highest/lowest comparisons are only offered when at least this many platforms have data
 * for the metric. With one platform there is nothing to compare, and naming it both the
 * highest and the lowest would read as a finding when it is not one.
 */
export const EXTREMES_MIN_PLATFORMS = 2

/** Rates are published as fractions 0-1, rounded to this many decimal places. */
export const RATE_DECIMALS = 4
