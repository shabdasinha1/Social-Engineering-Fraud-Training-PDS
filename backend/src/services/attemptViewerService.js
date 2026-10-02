import mongoose from 'mongoose'
import {
  ATTEMPT_FILTER_MODES,
  ATTEMPT_FILTER_STATUSES,
  ATTEMPT_LIST_FILTERS,
  ATTEMPT_LIST_PARAMS,
  ATTEMPT_LIST_SORT,
  ATTEMPT_PAGE_SIZE_DEFAULT,
  ATTEMPT_PAGE_SIZE_MAX,
  BEHAVIOUR_SCOPE,
  DATE_ONLY_PATTERN,
  DATE_TIME_PATTERN,
  DAY_END_SUFFIX,
  DAY_START_SUFFIX,
  LEARNER_LOOKUP_LIMIT_DEFAULT,
  LEARNER_LOOKUP_LIMIT_MAX,
  LEARNER_LOOKUP_MAX_QUERY_LENGTH,
  LEARNER_LOOKUP_MIN_QUERY_LENGTH,
  LEARNER_LOOKUP_PARAMS,
  MAX_DATE_RANGE_MS,
  VIEWER_UNAVAILABLE,
} from '../constants/attemptViewer.js'
import { SCENARIO_POINTS } from '../constants/scenarioDefinition.js'
import { maskServiceNumber } from '../utils/serviceNumber.js'
import {
  DEMO_SKIPPED_OUTCOME_CLASS,
  FAMILY_LABELS,
  PLATFORM_LABELS,
  TRIGGER_LABELS,
} from '../constants/resultProjection.js'
import { ATTEMPT_SCENARIO_COUNT } from '../constants/scenarioSelection.js'
import { Attempt } from '../models/Attempt.js'
import { Candidate, normaliseIdentifier } from '../models/Candidate.js'
import { ScenarioDefinition } from '../models/ScenarioDefinition.js'
import { ScenarioEvent } from '../models/ScenarioEvent.js'
import { ScenarioRun } from '../models/ScenarioRun.js'
import { ApiError } from '../utils/ApiError.js'
import {
  behaviourBreakdown,
  buildAttemptResult,
  classifyOutcome,
  pathFromEvents,
} from './attemptResultService.js'
import { isDemoSkippedRun } from './demoSelectionService.js'

/**
 * The instructor attempt viewer (ADMIN-002).
 *
 * Specification section 6: "Attempt viewer: filter by learner/date; show scores, action
 * path, remediation without sensitive typed content."
 *
 * ### This service computes no result of its own
 *
 * For a COMPLETED attempt the authority is `buildAttemptResult()` - the same RESULT-001
 * projection the learner's own result screen is built from. Scoring, the missed-threat /
 * false-positive classification, the behaviour breakdown, the path replay, remediation and
 * the comparability gate all come from there, unchanged and unrepeated. This file adds the
 * instructor-only classification (disposition, family and trigger per scenario) and
 * re-serialises the whole thing through an allowlist.
 *
 * There is deliberately **no second authoritative result model**. If the two ever
 * disagreed, an instructor and a learner would be looking at different scores for the same
 * attempt, and neither would be wrong on its own terms.
 *
 * For an IN-PROGRESS attempt the result service correctly refuses to build a result at
 * all, so this file assembles a partial view from the same exported pure helpers -
 * `pathFromEvents`, `classifyOutcome`, `behaviourBreakdown`. It sums nothing the engine
 * has not already committed, invents no total, and reports unresolved scenarios as
 * pending rather than as scored.
 *
 * ### What it may never do
 *
 * Read-only, in every sense: no attempt, run, event, profile or definition is written,
 * completed, reset or repaired, and no audit entry is appended - ADMIN-005 records
 * administrative CHANGES, and reading is not one.
 */

/* ------------------------------------------------------------------ *
 * Input - filters, dates, pagination
 * ------------------------------------------------------------------ */

const fail = (status, code, message, details = null) => {
  throw new ApiError(status, code, message, details)
}

/**
 * Every filter value must arrive as a plain string.
 *
 * This is the injection boundary and it sits BEFORE any query is built. Express parses
 * `?status[$ne]=completed` into `{ $ne: 'completed' }` and `?status=a&status=b` into an
 * array; both are refused here, so no object, array or operator can ever reach Mongo -
 * not because a later `String()` would defuse it, but because it is never carried that
 * far.
 */
function scalar(key, value) {
  if (typeof value === 'string') return value.trim()
  fail(422, 'INVALID_FILTER',
    'A filter must be given once, as a plain value.', { rejected_filters: [key] })
  return null
}

/**
 * One date bound, in one of two documented UTC shapes.
 *
 * `endOfDay` applies only to a calendar day given as the upper bound: `started_to=2026-09-07`
 * means the end of the 7th, not its first instant. An instant is used exactly as given.
 */
export function parseDateBound(key, raw, { endOfDay = false } = {}) {
  const value = scalar(key, raw)

  let iso
  if (DATE_ONLY_PATTERN.test(value)) {
    iso = `${value}${endOfDay ? DAY_END_SUFFIX : DAY_START_SUFFIX}`
  } else if (DATE_TIME_PATTERN.test(value)) {
    iso = value
  } else {
    fail(422, 'INVALID_DATE',
      'A date must be YYYY-MM-DD or a full ISO-8601 instant such as 2026-09-07T04:42:50Z.',
      { rejected_filters: [key] })
  }

  // The calendar day, checked arithmetically BEFORE parsing.
  //
  // `new Date('2026-02-30T00:00:00Z')` does not fail - it rolls silently into 2 March,
  // which would quietly move an instructor's filter two days without telling them. The
  // components are therefore verified to survive a round trip; only `2026-13-01` and
  // friends are caught by `Date` itself.
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  const roundTrip = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(roundTrip.getTime())
    || roundTrip.getUTCFullYear() !== year
    || roundTrip.getUTCMonth() !== month - 1
    || roundTrip.getUTCDate() !== day) {
    fail(422, 'INVALID_DATE', 'That is not a real date.', { rejected_filters: [key] })
  }

  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) {
    // Catches what the calendar check cannot: an impossible hour, minute or offset.
    fail(422, 'INVALID_DATE', 'That is not a real date.', { rejected_filters: [key] })
  }
  return parsed
}

/** Bounded, strictly validated pagination. A non-integer page is refused, not rounded. */
export function parsePagination(query = {}) {
  const read = (key, fallback, max) => {
    if (query[key] === undefined) return fallback
    const value = scalar(key, query[key])
    if (!/^\d+$/.test(value)) {
      fail(422, 'INVALID_PAGINATION', 'Page and page size must be whole numbers.',
        { rejected_filters: [key] })
    }
    const number = Number(value)
    if (number < 1 || number > max) {
      fail(422, 'INVALID_PAGINATION', `${key} must be between 1 and ${max}.`,
        { rejected_filters: [key] })
    }
    return number
  }

  return {
    page: read('page', 1, Number.MAX_SAFE_INTEGER),
    pageSize: read('page_size', ATTEMPT_PAGE_SIZE_DEFAULT, ATTEMPT_PAGE_SIZE_MAX),
  }
}

/**
 * The attempt list query, built entirely from an allowlist.
 *
 * Returns a plain description of what was asked for - not a Mongo query - so it can be
 * unit-tested without a database, and so the only place a query document is assembled is
 * `listAttempts()` below.
 */
export function parseAttemptListQuery(query = {}) {
  const unknown = Object.keys(query).filter((key) => !ATTEMPT_LIST_PARAMS.includes(key))
  if (unknown.length) {
    fail(422, 'FORBIDDEN_FILTER',
      'The attempt viewer accepts only the documented filters.',
      { rejected_filters: unknown, allowed_filters: ATTEMPT_LIST_FILTERS })
  }

  const filters = {}

  if (query.profile_id !== undefined) {
    const value = scalar('profile_id', query.profile_id)
    if (!mongoose.isValidObjectId(value)) {
      fail(422, 'INVALID_FILTER', 'That is not a profile id.',
        { rejected_filters: ['profile_id'] })
    }
    filters.profileId = value
  }

  if (query.service_no !== undefined) {
    const value = scalar('service_no', query.service_no)
    if (value.length === 0 || value.length > LEARNER_LOOKUP_MAX_QUERY_LENGTH) {
      fail(422, 'INVALID_FILTER', 'A service number filter must be a short identifier.',
        { rejected_filters: ['service_no'] })
    }
    filters.serviceNoNormalised = normaliseIdentifier(value)
  }

  if (query.status !== undefined) {
    const value = scalar('status', query.status)
    if (!ATTEMPT_FILTER_STATUSES.includes(value)) {
      fail(422, 'INVALID_FILTER',
        `status must be one of: ${ATTEMPT_FILTER_STATUSES.join(', ')}.`,
        { rejected_filters: ['status'] })
    }
    filters.status = value
  }

  if (query.mode !== undefined) {
    const value = scalar('mode', query.mode)
    if (!ATTEMPT_FILTER_MODES.includes(value)) {
      fail(422, 'INVALID_FILTER', `mode must be one of: ${ATTEMPT_FILTER_MODES.join(', ')}.`,
        { rejected_filters: ['mode'] })
    }
    filters.mode = value
  }

  if (query.started_from !== undefined) {
    filters.startedFrom = parseDateBound('started_from', query.started_from)
  }
  if (query.started_to !== undefined) {
    filters.startedTo = parseDateBound('started_to', query.started_to, { endOfDay: true })
  }

  if (filters.startedFrom && filters.startedTo) {
    if (filters.startedTo.getTime() < filters.startedFrom.getTime()) {
      fail(422, 'INVALID_DATE_RANGE', 'The end of the range is before its start.')
    }
    if (filters.startedTo.getTime() - filters.startedFrom.getTime() > MAX_DATE_RANGE_MS) {
      fail(422, 'DATE_RANGE_TOO_LARGE',
        'Ask for a shorter period; a single page cannot span more than a year.')
    }
  }

  return { filters, ...parsePagination(query) }
}

/* ------------------------------------------------------------------ *
 * Learner profile
 * ------------------------------------------------------------------ */

/**
 * Section 2: only the last four characters of a service number are ever shown.
 *
 * The same rule the learner's own screens use, applied server-side here because an
 * instructor viewer must not be able to read a number back off the wire even if a future
 * frontend forgets to mask it.
 *
 * The implementation moved to `utils/serviceNumber.js` in PROFILE-001 - `Candidate` now
 * stores the masked form and has to compute it, and this service imports `Candidate`, so
 * keeping it here would have made the two import each other. Re-exported unchanged so
 * every existing import site still resolves.
 */
export { maskServiceNumber }

/**
 * The ONLY learner fields the admin surface publishes.
 *
 * Specification section 2's LearnerProfile contract. `display_name` and `created_at` map to
 * the model's `name` and `createdAt`; `service_no_masked` is now STORED (PROFILE-001) and
 * read from the document, falling back to deriving it so a profile written before that
 * migration still projects correctly.
 *
 * The raw and normalised service numbers stay server-side: the normalised value is the
 * profile key and is what a filter is matched against, never what a response carries.
 *
 * Since PROFILE-001 the queries feeding this do not even SELECT the raw `identifier` - they
 * fetch `service_no_masked` and, only as a fallback for a document written before the mask
 * was stored, `identifierNormalised`. The unmasked number no longer leaves the database on
 * this path at all, so it cannot be published by an oversight further up.
 */
export function toProfileSummary(profile) {
  if (!profile) return null
  return {
    profile_id: profile._id.toString(),
    display_name: profile.name ?? null,
    service_no_masked: profile.service_no_masked ?? maskServiceNumber(profile.identifierNormalised),
  }
}

/**
 * The detail view adds the profile's dates. Still no identity fields.
 *
 * `last_seen_at` is published now that PROFILE-001 stores it. A null is meaningful rather
 * than ambiguous: it means the profile has not signed in since the field existed, which is
 * the honest state for one created before it and is not a value that could be invented.
 */
export function toProfileDetail(profile) {
  if (!profile) return null
  return {
    ...toProfileSummary(profile),
    created_at: profile.createdAt ?? null,
    last_seen_at: profile.last_seen_at ?? null,
  }
}

/** Anchored, escaped, bounded. Never a free-substring scan and never a client regex. */
function prefixMatcher(value) {
  return new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
}

/**
 * The bounded learner lookup that makes "filter by learner" usable.
 *
 * Exists only to turn a name or a service number into a `profile_id`. It is admin-only,
 * capped, matches on an anchored prefix of the learner's OWN name or normalised service
 * number, and returns nothing but the profile summary.
 */
export async function lookupLearners(query = {}) {
  const unknown = Object.keys(query).filter((key) => !LEARNER_LOOKUP_PARAMS.includes(key))
  if (unknown.length) {
    fail(422, 'FORBIDDEN_FILTER', 'The learner lookup accepts only the documented filters.',
      { rejected_filters: unknown, allowed_filters: LEARNER_LOOKUP_PARAMS })
  }

  const criteria = {}

  if (query.service_no !== undefined) {
    const value = scalar('service_no', query.service_no)
    if (value.length < LEARNER_LOOKUP_MIN_QUERY_LENGTH
      || value.length > LEARNER_LOOKUP_MAX_QUERY_LENGTH) {
      fail(422, 'INVALID_FILTER',
        `A service number lookup must be ${LEARNER_LOOKUP_MIN_QUERY_LENGTH}-${LEARNER_LOOKUP_MAX_QUERY_LENGTH} characters.`,
        { rejected_filters: ['service_no'] })
    }
    criteria.identifierNormalised = prefixMatcher(normaliseIdentifier(value))
  }

  if (query.display_name !== undefined) {
    const value = scalar('display_name', query.display_name)
    if (value.length < LEARNER_LOOKUP_MIN_QUERY_LENGTH
      || value.length > LEARNER_LOOKUP_MAX_QUERY_LENGTH) {
      fail(422, 'INVALID_FILTER',
        `A name lookup must be ${LEARNER_LOOKUP_MIN_QUERY_LENGTH}-${LEARNER_LOOKUP_MAX_QUERY_LENGTH} characters.`,
        { rejected_filters: ['display_name'] })
    }
    criteria.name = prefixMatcher(value)
  }

  let limit = LEARNER_LOOKUP_LIMIT_DEFAULT
  if (query.limit !== undefined) {
    const value = scalar('limit', query.limit)
    if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > LEARNER_LOOKUP_LIMIT_MAX) {
      fail(422, 'INVALID_PAGINATION', `limit must be between 1 and ${LEARNER_LOOKUP_LIMIT_MAX}.`,
        { rejected_filters: ['limit'] })
    }
    limit = Number(value)
  }

  const profiles = await Candidate.find(criteria)
    .select('name service_no_masked identifierNormalised createdAt last_seen_at')
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)

  return { learners: profiles.map(toProfileDetail), limit }
}

/* ------------------------------------------------------------------ *
 * List
 * ------------------------------------------------------------------ */

const MAX_SCORE = ATTEMPT_SCENARIO_COUNT * SCENARIO_POINTS.max

const durationMs = (from, to) =>
  (from && to ? new Date(to).getTime() - new Date(from).getTime() : null)

/**
 * Resolved / total run counts for a page of attempts, in ONE aggregate.
 *
 * The obvious implementation - a count per attempt - is an N+1 over the page. This is a
 * single grouped query over the runs of the twenty-five attempts actually being shown.
 */
async function runCountsFor(attemptIds) {
  if (!attemptIds.length) return new Map()
  const rows = await ScenarioRun.aggregate([
    { $match: { attempt_id: { $in: attemptIds } } },
    {
      $group: {
        _id: '$attempt_id',
        total: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
      },
    },
  ])
  return new Map(rows.map((row) => [String(row._id), row]))
}

/**
 * One row of the attempt list. An ALLOWLIST, built by hand.
 *
 * Carries no seed, no selection metadata, no frozen sequence, no run, no event and no
 * scenario id - a list is for locating an attempt, and the moment it starts carrying event
 * data it becomes a bulk export of the ledger.
 */
export function toAttemptSummary(attempt, { profile, counts }) {
  const complete = attempt.status === 'completed'
  return {
    attempt_id: attempt._id.toString(),
    profile: toProfileSummary(profile),
    mode: attempt.mode,
    status: attempt.status,
    started_at: attempt.started_at,
    completed_at: attempt.completed_at ?? null,
    duration_ms: durationMs(attempt.started_at, attempt.completed_at),
    /**
     * IMMERSIVE-001. `duration_ms` above is the time the learner TOOK; `time_limit_ms` is
     * the time they were ALLOWED. Two different facts, deliberately two different names.
     *
     * `unresolved_at_expiry` is the number an instructor actually needs: it separates
     * "scored 42 having worked all ten scenarios" from "scored 42 having reached
     * scenario six before the clock stopped them".
     */
    end_reason: attempt.end_reason ?? null,
    timed_out: attempt.end_reason === 'expired',
    time_limit_ms: attempt.time_limit_ms ?? null,
    unresolved_at_expiry: attempt.unresolved_at_expiry ?? null,
    // A total exists only for a finished attempt. Never a partial sum wearing its name.
    total_score: complete ? attempt.total_score : null,
    max_score: MAX_SCORE,
    scenarios_total: counts?.total ?? attempt.scenario_sequence?.length ?? 0,
    scenarios_resolved: counts?.resolved ?? 0,
    content_version: attempt.content_version,
    result_available: complete,
  }
}

/**
 * A bounded, deterministically ordered page of attempts.
 *
 * Three queries, whatever the page size: the profiles behind a `service_no` filter, the
 * attempts themselves (plus their count), and one grouped run count. No events are read.
 */
export async function listAttempts(query = {}) {
  const { filters, page, pageSize } = parseAttemptListQuery(query)

  const criteria = {}

  if (filters.profileId) criteria.profile_id = new mongoose.Types.ObjectId(filters.profileId)

  if (filters.serviceNoNormalised) {
    const matches = await Candidate.find({ identifierNormalised: filters.serviceNoNormalised })
      .select('_id')
      .limit(LEARNER_LOOKUP_LIMIT_MAX)
    const ids = matches.map((m) => m._id)
    // An unknown service number is an empty page, not an error: browsing is not a failure.
    if (!ids.length) return emptyPage(page, pageSize)
    if (criteria.profile_id && !ids.some((id) => id.equals(criteria.profile_id))) {
      return emptyPage(page, pageSize)
    }
    if (!criteria.profile_id) criteria.profile_id = { $in: ids }
  }

  if (filters.status) criteria.status = filters.status
  if (filters.mode) criteria.mode = filters.mode

  if (filters.startedFrom || filters.startedTo) {
    criteria.started_at = {}
    if (filters.startedFrom) criteria.started_at.$gte = filters.startedFrom
    if (filters.startedTo) criteria.started_at.$lte = filters.startedTo
  }

  const [attempts, total] = await Promise.all([
    Attempt.find(criteria)
      // `toAttemptSummary` reads the IMMERSIVE-001 timing fields too; without them every row
      // reported `timed_out: false` and a null limit, even for an attempt that expired.
      .select('profile_id mode status started_at completed_at total_score content_version scenario_sequence '
        + 'end_reason time_limit_ms unresolved_at_expiry')
      .sort(ATTEMPT_LIST_SORT)
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    Attempt.countDocuments(criteria),
  ])

  const [profiles, counts] = await Promise.all([
    Candidate.find({ _id: { $in: attempts.map((a) => a.profile_id) } })
      .select('name service_no_masked identifierNormalised createdAt last_seen_at'),
    runCountsFor(attempts.map((a) => a._id)),
  ])
  const profileById = new Map(profiles.map((p) => [String(p._id), p]))

  return {
    attempts: attempts.map((attempt) => toAttemptSummary(attempt, {
      profile: profileById.get(String(attempt.profile_id)),
      counts: counts.get(String(attempt._id)),
    })),
    page,
    page_size: pageSize,
    total,
    total_pages: Math.max(Math.ceil(total / pageSize), 1),
  }
}

const emptyPage = (page, pageSize) => ({
  attempts: [], page, page_size: pageSize, total: 0, total_pages: 1,
})

/* ------------------------------------------------------------------ *
 * Detail
 * ------------------------------------------------------------------ */

/** The attempt, or 404. A malformed id is a 404, never a cast error surfacing as a 500. */
export async function findAttemptForAdmin(attemptId) {
  if (!mongoose.isValidObjectId(attemptId)) {
    fail(404, 'ATTEMPT_NOT_FOUND', 'Attempt not found.')
  }
  const attempt = await Attempt.findById(attemptId).catch(() => null)
  if (!attempt) fail(404, 'ATTEMPT_NOT_FOUND', 'Attempt not found.')
  return attempt
}

const triggerLabelsFor = (triggers) =>
  (triggers ?? []).map((key) => TRIGGER_LABELS[key] ?? key)

/**
 * The classification an instructor may see and a learner may not.
 *
 * Loaded from the PINNED `(scenario_id, definition_version)` of each run - never "the
 * latest active version" - so a republished scenario cannot change what an old attempt is
 * reported as. `evaluation` is `select: false` and is NOT requested here: the feedback the
 * instructor sees comes from the result projection, which is the one place allowed to read
 * it.
 */
async function classificationFor(runs) {
  if (!runs.length) return new Map()
  const definitions = await ScenarioDefinition.find({
    $or: runs.map((r) => ({ scenario_id: r.scenario_id, version: r.definition_version })),
  }).select('scenario_id version level military_flag disposition canonical_family canonical_triggers')

  return new Map(definitions.map((d) => [`${d.scenario_id}:${d.version}`, {
    level: d.level,
    military_flag: d.military_flag === true,
    disposition: d.disposition,
    canonical_family: d.canonical_family,
    family_label: FAMILY_LABELS[d.canonical_family] ?? d.canonical_family,
    canonical_triggers: [...d.canonical_triggers],
    trigger_labels: triggerLabelsFor(d.canonical_triggers),
  }]))
}

/** How many of the attempt's scenarios sit on each platform, and how many are finished. */
function platformCoverage(runs) {
  const byPlatform = new Map()
  for (const run of runs) {
    if (!byPlatform.has(run.platform)) {
      byPlatform.set(run.platform, {
        platform: run.platform,
        label: PLATFORM_LABELS[run.platform] ?? run.platform,
        scenarios: 0,
        resolved: 0,
      })
    }
    const row = byPlatform.get(run.platform)
    row.scenarios += 1
    if (run.status === 'resolved') row.resolved += 1
  }
  return [...byPlatform.values()].sort((a, b) => a.label.localeCompare(b.label))
}

/** A scenario the learner has not finished. No disposition, no feedback, no path. */
function pendingScenario(run) {
  return {
    ordinal: run.ordinal,
    scenario_ref: run.scenario_id,
    platform: run.platform,
    platform_label: PLATFORM_LABELS[run.platform] ?? run.platform,
    status: run.status,
    resolved: false,
    current_stage: run.current_stage,
    started_at: run.started_at,
    // Explicit nulls, so a pending scenario can never be mistaken for a zero-scoring one.
    score_0_10: null,
    max_score: SCENARIO_POINTS.max,
  }
}

/**
 * One finished scenario, for the instructor.
 *
 * `result` is the RESULT-001 entry for this ordinal when one exists (a completed attempt);
 * `classification` is the instructor-only half. Every key is written out by hand - nothing
 * is spread from a Mongoose document, a definition or an event.
 */
function resolvedScenario(run, { result = null, classification = null, path = [], outcomeClass = null }) {
  return {
    ordinal: run.ordinal,
    scenario_ref: run.scenario_id,
    platform: run.platform,
    platform_label: PLATFORM_LABELS[run.platform] ?? run.platform,
    status: run.status,
    resolved: true,

    score_0_10: run.score_0_10,
    max_score: SCENARIO_POINTS.max,

    // The learner's final action and how it is classified. Both server-decided.
    outcome_code: run.outcome_code,
    outcome_class: result?.outcome_class ?? outcomeClass,
    final_stage: run.current_stage,

    // Instructor-only: what the item actually was.
    // ADM-007: difficulty and military context, from the pinned definition, so an
    // instructor reads a click or report rate against how hard the item was (section 5).
    level: classification?.level ?? null,
    military_flag: classification?.military_flag ?? null,
    disposition: classification?.disposition ?? null,
    canonical_family: classification?.canonical_family ?? null,
    family_label: classification?.family_label ?? null,
    canonical_triggers: classification?.canonical_triggers ?? [],
    trigger_labels: classification?.trigger_labels ?? [],

    // What the learner saw, never the authoring title.
    sender: result?.sender ?? null,
    preview: result?.preview ?? null,

    started_at: run.started_at,
    resolved_at: run.resolved_at,
    duration_ms: durationMs(run.started_at, run.resolved_at),

    // The compact replay: {step, stage, action} only.
    path: result?.path ?? path,

    // The section 7 feedback card, verbatim from the scenario's authored feedback.
    feedback: result?.feedback ?? null,
  }
}

/**
 * The instructor view of a COMPLETED attempt.
 *
 * `buildAttemptResult()` is the authority; this re-serialises it and adds the
 * instructor-only classification. Nothing here recomputes a score, reclassifies an
 * outcome, rebuilds a path or re-selects a remediation family.
 */
async function completedView(attempt, runs, profile) {
  const result = await buildAttemptResult(attempt)
  const classification = await classificationFor(runs)
  const byOrdinal = new Map(result.scenarios.map((s) => [s.ordinal, s]))

  return {
    attempt: attemptHeader(attempt, runs, profile, { totalScore: result.total_score }),
    summary: {
      total_score: result.summary.total_score,
      max_score: result.summary.max_score,
      scenarios: result.summary.scenarios,
      handled_safely: result.summary.handled_safely,
      missed_threats: result.summary.missed_threats,
      false_positives: result.summary.false_positives,
      unsafe_handling: result.summary.unsafe_handling,
      /**
       * IMMERSIVE-001. Kept in step with the learner's own summary deliberately: an
       * instructor test asserts the two are deep-equal, because a report that disagreed
       * with what the learner was shown would be worse than no report.
       */
      not_resolved: result.summary.not_resolved,
      duration_ms: result.summary.duration_ms,
    },
    platform_coverage: platformCoverage(runs),
    scenarios: runs.map((run) => resolvedScenario(run, {
      result: byOrdinal.get(run.ordinal),
      classification: classification.get(`${run.scenario_id}:${run.definition_version}`),
    })),
    behaviour: result.behaviour,
    behaviour_scope: {
      scope: BEHAVIOUR_SCOPE.COMPLETE,
      scenarios_included: runs.length,
      scenarios_total: runs.length,
    },
    remediation: {
      available: true,
      reason: null,
      recommendations: result.remediation,
    },
    comparison: result.comparison,
  }
}

/**
 * The instructor view of an attempt still in progress.
 *
 * Section 6 asks for scores, path and remediation; an unfinished attempt has some of the
 * first, some of the second and none of the third, and this says so rather than filling
 * the gaps. Specifically:
 *
 *   - `total_score` stays **null**. The sum of the resolved scenarios is published
 *     separately, as `resolved_points`, so it can never be read as a 0-100 total.
 *   - unresolved scenarios are listed as pending, with no disposition, no feedback and no
 *     path - the learner has not finished them and the answers stay server-side.
 *   - the breakdown is computed from the resolved scenarios only and is labelled
 *     `partial`.
 *   - remediation and comparison are marked unavailable with a stable reason. Weak
 *     families cannot be judged from an unfinished attempt, and the specification's
 *     comparability gate is about finished ones.
 */
async function inProgressView(attempt, runs, profile) {
  const resolved = runs.filter((r) => r.status === 'resolved')
  const classification = await classificationFor(resolved)

  const events = resolved.length
    ? await ScenarioEvent.find({ run_id: { $in: resolved.map((r) => r._id) } })
      .select('run_id sequence event_code')
    : []
  const eventsByRun = new Map()
  for (const event of events) {
    const key = String(event.run_id)
    if (!eventsByRun.has(key)) eventsByRun.set(key, [])
    eventsByRun.get(key).push(event)
  }

  const entries = resolved.map((run) => {
    const runEvents = eventsByRun.get(String(run._id)) ?? []
    const meta = classification.get(`${run.scenario_id}:${run.definition_version}`)
    const path = pathFromEvents(runEvents)
    return {
      run,
      meta,
      path,
      score: run.score_0_10 ?? 0,
      platform: run.platform,
      canonical_family: meta?.canonical_family,
      canonical_triggers: meta?.canonical_triggers ?? [],
      /**
       * ENHANCEMENT-003: the same `skipped` label the completed view takes from the result
       * projection, so a demo skip reads identically before and after completion.
       */
      outcome_class: isDemoSkippedRun(run)
        ? DEMO_SKIPPED_OUTCOME_CLASS
        : meta
        ? classifyOutcome({
          disposition: meta.disposition,
          outcomeCode: run.outcome_code,
          eventCodes: runEvents.map((e) => e.event_code),
        })
        : null,
    }
  })

  // ENHANCEMENT-003: a demo skip is left out of the breakdown, as the completed view does.
  const scored = entries.filter((entry) => entry.canonical_family && !isDemoSkippedRun(entry.run))
  const byOrdinal = new Map(entries.map((entry) => [entry.run.ordinal, entry]))

  return {
    attempt: attemptHeader(attempt, runs, profile, { totalScore: null }),
    summary: null,
    platform_coverage: platformCoverage(runs),
    scenarios: runs.map((run) => {
      if (run.status !== 'resolved') return pendingScenario(run)
      const entry = byOrdinal.get(run.ordinal)
      return resolvedScenario(run, {
        classification: entry?.meta,
        path: entry?.path ?? [],
        outcomeClass: entry?.outcome_class ?? null,
      })
    }),
    behaviour: behaviourBreakdown(scored),
    behaviour_scope: {
      scope: BEHAVIOUR_SCOPE.PARTIAL,
      scenarios_included: scored.length,
      scenarios_total: runs.length,
    },
    remediation: {
      available: false,
      reason: VIEWER_UNAVAILABLE.ATTEMPT_NOT_COMPLETE,
      recommendations: [],
    },
    comparison: {
      available: false,
      reason: VIEWER_UNAVAILABLE.ATTEMPT_NOT_COMPLETE,
    },
  }
}

/**
 * The attempt header. An allowlist, and the one place `total_score` is decided.
 *
 * The seed and the whole `selection` block are deliberately absent: neither is needed to
 * read an attempt, and both describe how the bank was sampled. `content_version` and the
 * two taxonomy versions ARE published, because they are what makes a comparison legitimate
 * and an instructor needs to see why one was refused.
 */
function attemptHeader(attempt, runs, profile, { totalScore }) {
  const resolved = runs.filter((r) => r.status === 'resolved')
  return {
    attempt_id: attempt._id.toString(),
    profile: toProfileDetail(profile),
    mode: attempt.mode,
    status: attempt.status,
    started_at: attempt.started_at,
    completed_at: attempt.completed_at ?? null,
    duration_ms: durationMs(attempt.started_at, attempt.completed_at),

    scenarios_total: runs.length,
    scenarios_resolved: resolved.length,

    result_available: attempt.status === 'completed',
    total_score: totalScore,
    max_score: MAX_SCORE,
    /** What the engine has already committed. Never presented as a 0-100 total. */
    resolved_points: resolved.reduce((sum, run) => sum + (run.score_0_10 ?? 0), 0),

    content_version: attempt.content_version,
    taxonomy_version: attempt.taxonomy_version,
    trigger_taxonomy_version: attempt.trigger_taxonomy_version,
  }
}

/**
 * The whole instructor detail for one attempt.
 *
 * Pure read. Four to six bounded queries: the attempt, its runs, its profile, the pinned
 * definitions for its resolved scenarios, and - only where a path is being replayed - the
 * events of those runs. Never the events of an attempt that has none resolved, and never
 * an event of a scenario still in play.
 */
export async function getAttemptForAdmin(attemptId) {
  const attempt = await findAttemptForAdmin(attemptId)
  const [runs, profile] = await Promise.all([
    ScenarioRun.find({ attempt_id: attempt._id }).sort({ ordinal: 1 }),
    Candidate.findById(attempt.profile_id)
      .select('name service_no_masked identifierNormalised createdAt last_seen_at')
      .catch(() => null),
  ])

  return attempt.status === 'completed'
    ? completedView(attempt, runs, profile)
    : inProgressView(attempt, runs, profile)
}