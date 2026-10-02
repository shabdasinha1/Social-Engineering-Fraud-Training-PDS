import { ATTEMPT_MODES, ATTEMPT_STATUSES } from './scenarioSelection.js'

/**
 * The instructor attempt-viewer vocabulary (ADMIN-002).
 *
 * Specification section 6, second admin capability:
 *
 *   "Attempt viewer: filter by learner/date; show scores, action path, remediation
 *    without sensitive typed content."
 *
 * Everything an instructor may filter on, page through or receive is named here, so the
 * surface cannot widen by accident. Three rules this file exists to enforce:
 *
 * 1. **Filters are an allowlist, and an unknown one is REJECTED.** Not ignored - a client
 *    that thinks it filtered by `rationale` and got a 200 has been told something untrue
 *    about which attempts it is looking at.
 * 2. **No client-supplied Mongo operator can reach a query.** Every value must arrive as
 *    a string; `?status[$ne]=x` parses to an object and is refused before any query is
 *    built, and no filter value is ever spread into a query document.
 * 3. **Dates are explicit, bounded and UTC.** One documented convention, validated
 *    against a fixed pattern - never a natural-language date and never a raw
 *    `new Date(anything)`.
 *
 * The viewer is READ-ONLY. There is no write vocabulary here because there is no write
 * endpoint: ADMIN-005's audit log records administrative CHANGES, and looking at an
 * attempt changes nothing.
 */

/* ------------------------------------------------------------------ *
 * Attempt list
 * ------------------------------------------------------------------ */

/**
 * The ONLY filters `GET /api/admin/attempts` accepts.
 *
 * `service_no` is resolved to profile ids through the learner profile before it reaches
 * the attempt query, so a service number is never matched against an attempt document and
 * never appears in one.
 */
export const ATTEMPT_LIST_FILTERS = [
  'profile_id',
  'service_no',
  'status',
  'mode',
  'started_from',
  'started_to',
]

/** Pagination parameters, kept separate so a filter loop cannot treat them as filters. */
export const ATTEMPT_LIST_PAGINATION = ['page', 'page_size']

/** Every query-string key the list endpoint tolerates. Anything else is a 422. */
export const ATTEMPT_LIST_PARAMS = [...ATTEMPT_LIST_FILTERS, ...ATTEMPT_LIST_PAGINATION]

/**
 * The closed value vocabularies. Reused from the selection constants rather than restated,
 * so a status added to the model can never be silently unfilterable here.
 */
export const ATTEMPT_FILTER_STATUSES = ATTEMPT_STATUSES
export const ATTEMPT_FILTER_MODES = ATTEMPT_MODES

export const ATTEMPT_PAGE_SIZE_DEFAULT = 25
export const ATTEMPT_PAGE_SIZE_MAX = 100

/**
 * The list is ordered newest-started first, with the attempt id as a stable tie-break.
 *
 * A single fixed order, not a client-chosen one: paging is only stable if two attempts
 * started in the same millisecond can never swap places between page 1 and page 2, and an
 * instructor-selected sort would be a second thing to validate for no requirement.
 */
export const ATTEMPT_LIST_SORT = { started_at: -1, _id: -1 }

/* ------------------------------------------------------------------ *
 * Dates
 * ------------------------------------------------------------------ */

/**
 * The two accepted date shapes, and nothing else.
 *
 *   `2026-09-07`                  a calendar day, UTC
 *   `2026-09-07T04:42:50.425Z`    an instant (offset or `Z`, seconds and millis optional)
 *
 * Anything else - "yesterday", "07/09/2026", a bare epoch number - is refused rather than
 * guessed at. `new Date()` accepts far more than this and interprets several of those
 * formats in the machine's local timezone, which would make the same request mean
 * different things on two machines.
 */
export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
export const DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/

/**
 * A calendar day given as `started_to` means the END of that UTC day.
 *
 * The alternative - treating it as midnight - silently excludes everything that happened
 * on the day the instructor asked for, which is the single most likely way to read a date
 * filter wrongly.
 */
export const DAY_END_SUFFIX = 'T23:59:59.999Z'
export const DAY_START_SUFFIX = 'T00:00:00.000Z'

/** A range longer than this is refused, so no single request can scan an unbounded span. */
export const MAX_DATE_RANGE_DAYS = 366
export const MAX_DATE_RANGE_MS = MAX_DATE_RANGE_DAYS * 24 * 60 * 60 * 1000

/* ------------------------------------------------------------------ *
 * Learner lookup
 * ------------------------------------------------------------------ */

/**
 * The learner lookup exists ONLY so an instructor can find the profile id to filter by.
 * It is bounded, admin-only, and matches on an ANCHORED prefix - never a free substring
 * search, and never across a field that is not the learner's own name or service number.
 */
export const LEARNER_LOOKUP_PARAMS = ['service_no', 'display_name', 'limit']
export const LEARNER_LOOKUP_LIMIT_DEFAULT = 20
export const LEARNER_LOOKUP_LIMIT_MAX = 50
export const LEARNER_LOOKUP_MIN_QUERY_LENGTH = 2
export const LEARNER_LOOKUP_MAX_QUERY_LENGTH = 60

/**
 * Section 2 of the specification: only the last four characters of a service number are
 * shown after login. The admin viewer holds itself to the same rule - an instructor needs
 * to recognise a learner, not to read their number back.
 *
 * Mirrors `frontend/src/utils/maskIdentifier.js` exactly, so one convention exists.
 */
export const SERVICE_NO_VISIBLE_CHARS = 4
export const SERVICE_NO_MASK_CHAR = '•'
export const SERVICE_NO_MASK_MAX = 8

/* ------------------------------------------------------------------ *
 * Availability reasons
 * ------------------------------------------------------------------ */

/**
 * Why a block of the instructor projection is not there.
 *
 * An absent block always carries a stable reason rather than a zero, an empty object or a
 * plausible-looking placeholder: an instructor must be able to tell "nothing to report"
 * from "not finished yet", and a fabricated total is worse than no total.
 */
export const VIEWER_UNAVAILABLE = {
  ATTEMPT_NOT_COMPLETE: 'attempt_not_complete',
}

/** How much of the attempt the behaviour breakdown was computed from. */
export const BEHAVIOUR_SCOPE = {
  COMPLETE: 'complete',
  PARTIAL: 'partial',
}

/* ------------------------------------------------------------------ *
 * Errors
 * ------------------------------------------------------------------ */

/** Stable domain codes. No message echoes an instructor's input back to them. */
export const ATTEMPT_VIEWER_ERRORS = {
  FORBIDDEN_FILTER: 422,
  INVALID_FILTER: 422,
  INVALID_DATE: 422,
  INVALID_DATE_RANGE: 422,
  DATE_RANGE_TOO_LARGE: 422,
  INVALID_PAGINATION: 422,
  ATTEMPT_NOT_FOUND: 404,
}
