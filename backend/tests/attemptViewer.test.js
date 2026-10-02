import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ATTEMPT_LIST_FILTERS,
  ATTEMPT_LIST_SORT,
  ATTEMPT_PAGE_SIZE_DEFAULT,
  ATTEMPT_PAGE_SIZE_MAX,
  MAX_DATE_RANGE_DAYS,
} from '../src/constants/attemptViewer.js'
import {
  maskServiceNumber,
  parseAttemptListQuery,
  parseDateBound,
  parsePagination,
  toAttemptSummary,
  toProfileDetail,
  toProfileSummary,
} from '../src/services/attemptViewerService.js'

/**
 * ADMIN-002 - the attempt viewer's input boundary and its serialisers, without a database.
 *
 * Everything here is a pure function on purpose. The two things that decide whether this
 * feature is safe - which filters reach a query, and which fields leave the server - are
 * both decidable from the arguments alone, so they are tested where a failure is
 * unambiguous. The HTTP and database behaviour is proven separately, against a real
 * replica set, in `attemptViewerApi.test.js`.
 */

const rejects = (fn, code) => {
  try {
    fn()
    assert.fail(`expected ${code}`)
  } catch (error) {
    assert.equal(error.code, code, `expected ${code}, got ${error.code}: ${error.message}`)
    return error
  }
  return null
}

/* ------------------------------------------------------------------ *
 * 1-8  filter allowlist and injection
 * ------------------------------------------------------------------ */

test('an empty query is the first page, default size, no filters', () => {
  const parsed = parseAttemptListQuery({})
  assert.deepEqual(parsed.filters, {})
  assert.equal(parsed.page, 1)
  assert.equal(parsed.pageSize, ATTEMPT_PAGE_SIZE_DEFAULT)
})

test('an unknown filter is rejected, not ignored', () => {
  const error = rejects(() => parseAttemptListQuery({ rationale: 'x' }), 'FORBIDDEN_FILTER')
  assert.deepEqual(error.details.rejected_filters, ['rationale'])
  assert.deepEqual(error.details.allowed_filters, ATTEMPT_LIST_FILTERS)
})

test('a Mongo field name is not a filter', () => {
  for (const key of ['seed', 'selection', 'total_score', 'profile_id_', '$where', 'sort']) {
    rejects(() => parseAttemptListQuery({ [key]: 'x' }), 'FORBIDDEN_FILTER')
  }
})

test('an operator object cannot reach a query', () => {
  // What Express produces for ?status[$ne]=completed
  rejects(() => parseAttemptListQuery({ status: { $ne: 'completed' } }), 'INVALID_FILTER')
  rejects(() => parseAttemptListQuery({ started_from: { $gt: '2020-01-01' } }), 'INVALID_FILTER')
  rejects(() => parseAttemptListQuery({ profile_id: { $exists: true } }), 'INVALID_FILTER')
})

test('a repeated parameter (an array) is refused', () => {
  rejects(() => parseAttemptListQuery({ status: ['completed', 'in_progress'] }), 'INVALID_FILTER')
})

test('status and mode are closed vocabularies', () => {
  assert.equal(parseAttemptListQuery({ status: 'completed' }).filters.status, 'completed')
  assert.equal(parseAttemptListQuery({ mode: 'training' }).filters.mode, 'training')
  rejects(() => parseAttemptListQuery({ status: 'COMPLETED' }), 'INVALID_FILTER')
  rejects(() => parseAttemptListQuery({ mode: 'practice' }), 'INVALID_FILTER')
})

test('profile_id must look like an id', () => {
  const ok = parseAttemptListQuery({ profile_id: '6a9e40c5c3c410903d1c8eff' })
  assert.equal(ok.filters.profileId, '6a9e40c5c3c410903d1c8eff')
  rejects(() => parseAttemptListQuery({ profile_id: 'not-an-id' }), 'INVALID_FILTER')
  rejects(() => parseAttemptListQuery({ profile_id: '' }), 'INVALID_FILTER')
})

test('a service number filter is normalised the same way a login is', () => {
  const parsed = parseAttemptListQuery({ service_no: 'ic-45872 h' })
  assert.equal(parsed.filters.serviceNoNormalised, 'IC45872H')
  // The raw value never survives parsing.
  assert.equal(parsed.filters.service_no, undefined)
})

/* ------------------------------------------------------------------ *
 * 9-15  dates
 * ------------------------------------------------------------------ */

test('a calendar day is the start of that UTC day', () => {
  assert.equal(parseDateBound('started_from', '2026-09-07').toISOString(),
    '2026-09-07T00:00:00.000Z')
})

test('a calendar day as the upper bound is the END of that UTC day', () => {
  assert.equal(parseDateBound('started_to', '2026-09-07', { endOfDay: true }).toISOString(),
    '2026-09-07T23:59:59.999Z')
})

test('a full instant is taken exactly as given', () => {
  assert.equal(parseDateBound('started_from', '2026-09-07T04:42:50.425Z').toISOString(),
    '2026-09-07T04:42:50.425Z')
  assert.equal(parseDateBound('started_from', '2026-09-07T10:12:50+05:30').toISOString(),
    '2026-09-07T04:42:50.000Z')
})

test('a natural-language or ambiguous date is refused, never guessed at', () => {
  for (const value of ['yesterday', '07/09/2026', 'Sept 7 2026', '1757222570000',
    '2026-9-7', '2026-09-07 04:42', '2026-09-07T04:42:50']) {
    rejects(() => parseDateBound('started_from', value), 'INVALID_DATE')
  }
})

test('an impossible date is refused', () => {
  rejects(() => parseDateBound('started_from', '2026-02-30'), 'INVALID_DATE')
  rejects(() => parseDateBound('started_from', '2026-13-01'), 'INVALID_DATE')
})

test('an inverted range is refused', () => {
  rejects(
    () => parseAttemptListQuery({ started_from: '2026-09-07', started_to: '2026-09-01' }),
    'INVALID_DATE_RANGE',
  )
})

test('a range longer than a year is refused', () => {
  rejects(
    () => parseAttemptListQuery({ started_from: '2020-01-01', started_to: '2026-01-01' }),
    'DATE_RANGE_TOO_LARGE',
  )
  // The boundary itself is allowed.
  const to = new Date(Date.UTC(2026, 0, 1) + MAX_DATE_RANGE_DAYS * 86_400_000)
  assert.ok(parseAttemptListQuery({
    started_from: '2026-01-01T00:00:00.000Z',
    started_to: to.toISOString(),
  }).filters.startedTo)
})

/* ------------------------------------------------------------------ *
 * 16-19  pagination
 * ------------------------------------------------------------------ */

test('page size is capped', () => {
  assert.equal(parsePagination({ page_size: String(ATTEMPT_PAGE_SIZE_MAX) }).pageSize,
    ATTEMPT_PAGE_SIZE_MAX)
  rejects(() => parsePagination({ page_size: String(ATTEMPT_PAGE_SIZE_MAX + 1) }),
    'INVALID_PAGINATION')
})

test('a non-integer page is refused rather than rounded', () => {
  for (const value of ['0', '-1', '1.5', 'two', '1e3', '']) {
    rejects(() => parsePagination({ page: value }), 'INVALID_PAGINATION')
  }
})

test('pagination accepts plain whole numbers', () => {
  const parsed = parsePagination({ page: '3', page_size: '10' })
  assert.equal(parsed.page, 3)
  assert.equal(parsed.pageSize, 10)
})

test('the list order is fixed and carries a stable tie-break', () => {
  assert.deepEqual(ATTEMPT_LIST_SORT, { started_at: -1, _id: -1 })
})

/* ------------------------------------------------------------------ *
 * 20-24  serialisers
 * ------------------------------------------------------------------ */

const profileFixture = {
  _id: { toString: () => '6a9e40c5c3c410903d1c8eff' },
  name: 'Test Learner',
  identifier: 'IC45872H',
  identifierNormalised: 'IC45872H',
  createdAt: new Date('2026-09-01T00:00:00.000Z'),
}

test('a service number is masked to its last four characters', () => {
  assert.equal(maskServiceNumber('52364356'), '••••4356')
  assert.equal(maskServiceNumber('IC45872H'), '••••872H')
  assert.equal(maskServiceNumber('1234'), '1234')
  assert.equal(maskServiceNumber(''), '')
  assert.equal(maskServiceNumber(null), '')
  // Never longer than the mask cap, so length is not a hint either.
  assert.equal(maskServiceNumber('A'.repeat(24)), `${'•'.repeat(8)}AAAA`)
})

test('the profile projection publishes three fields and no identity data', () => {
  assert.deepEqual(Object.keys(toProfileSummary(profileFixture)).sort(),
    ['display_name', 'profile_id', 'service_no_masked'])
  // PROFILE-001 added `last_seen_at` to the detail view; the field now exists on the model.
  assert.deepEqual(Object.keys(toProfileDetail(profileFixture)).sort(),
    ['created_at', 'display_name', 'last_seen_at', 'profile_id', 'service_no_masked'])

  const text = JSON.stringify(toProfileDetail(profileFixture))
  assert.ok(!text.includes('IC45872H'), 'the unmasked service number was published')
  assert.ok(!text.includes('identifierNormalised'))
  for (const field of ['identifier', 'seenScenarios', 'password', 'phone', 'email',
    'rank', 'aadhaar', 'biometric', '_id', '__v']) {
    assert.ok(!text.includes(`"${field}"`), `the profile exposed "${field}"`)
  }
})

test('an in-progress attempt summary carries no total score', () => {
  const summary = toAttemptSummary({
    _id: { toString: () => '6a9e40cac3c410903d1c8f00' },
    profile_id: 'x',
    mode: 'assessment',
    status: 'in_progress',
    // Even if the cache were somehow populated, an unfinished attempt reports null.
    total_score: 77,
    started_at: new Date('2026-09-07T04:42:50.425Z'),
    completed_at: null,
    content_version: 1,
    scenario_sequence: new Array(10).fill({}),
  }, { profile: profileFixture, counts: { total: 10, resolved: 3 } })

  assert.equal(summary.total_score, null)
  assert.equal(summary.result_available, false)
  assert.equal(summary.duration_ms, null)
  assert.equal(summary.scenarios_resolved, 3)
  assert.equal(summary.scenarios_total, 10)
})

test('an attempt summary is an allowlist: no seed, selection, sequence or event data', () => {
  const summary = toAttemptSummary({
    _id: { toString: () => '6a9e40cac3c410903d1c8f00' },
    profile_id: 'x',
    seed: 'super-secret-seed',
    selection: { composition: { malicious: 7 } },
    mode: 'assessment',
    status: 'completed',
    total_score: 88,
    started_at: new Date('2026-09-07T04:00:00.000Z'),
    completed_at: new Date('2026-09-07T04:30:00.000Z'),
    content_version: 1,
    scenario_sequence: [{ scenario_id: 'W01' }],
  }, { profile: profileFixture, counts: { total: 10, resolved: 10 } })

  /** IMMERSIVE-001 adds the four timeout facts. `duration_ms` (time taken) is untouched. */
  assert.deepEqual(Object.keys(summary).sort(), [
    'attempt_id', 'completed_at', 'content_version', 'duration_ms', 'end_reason', 'max_score',
    'mode', 'profile', 'result_available', 'scenarios_resolved', 'scenarios_total',
    'started_at', 'status', 'time_limit_ms', 'timed_out', 'total_score',
    'unresolved_at_expiry',
  ].sort())
  const text = JSON.stringify(summary)
  assert.ok(!text.includes('super-secret-seed'))
  assert.ok(!text.includes('W01'))
  assert.equal(summary.total_score, 88)
  assert.equal(summary.duration_ms, 30 * 60 * 1000)
})
