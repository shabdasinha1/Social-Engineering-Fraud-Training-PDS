import assert from 'node:assert/strict'
import test from 'node:test'
import { OUTCOME_CLASSES } from '../src/constants/resultProjection.js'
import {
  aggregateDashboard,
  completionsByDay,
  extremesOf,
  latestPerLearner,
  parseDashboardQuery,
  platformPerformance,
  ratio,
  scoreBands,
  summarise,
} from '../src/services/adminDashboardService.js'

/**
 * ENHANCEMENT-001 - the dashboard's arithmetic, without a database.
 *
 * Every figure the dashboard publishes is a count or a ratio of counts, so each is checked
 * here against a hand-computed answer. The integration suite (adminDashboardApi.test.js)
 * then proves the inputs are the authoritative ones.
 */

const { HANDLED_SAFELY, MISSED_THREAT, FALSE_POSITIVE, UNSAFE_HANDLING, NOT_RESOLVED } = OUTCOME_CLASSES

const entry = (platform, disposition, outcome_class, score) =>
  ({ platform, disposition, outcome_class, score })

test('query: the dashboard is assessment-only and accepts no parameter at all', () => {
  assert.deepEqual(parseDashboardQuery({}), { mode: 'assessment' })
  // ENHANCEMENT-001B: a leftover mode switch is refused, not silently honoured.
  for (const query of [{ mode: 'training' }, { mode: '' }, { mode: { $ne: 'x' } }, { profile_id: 'x' }]) {
    assert.throws(() => parseDashboardQuery(query), { code: 'FORBIDDEN_FILTER' })
  }
})

test('ratio carries its evidence and never divides by zero', () => {
  assert.deepEqual(ratio(1, 4), { numerator: 1, denominator: 4, rate: 0.25 })
  assert.deepEqual(ratio(2, 3), { numerator: 2, denominator: 3, rate: 0.6667 })
  assert.deepEqual(ratio(0, 0), { numerator: 0, denominator: 0, rate: null })
})

test('summary statistics, including an even-length median and an empty list', () => {
  assert.deepEqual(summarise([70, 10, 40, 100]),
    { count: 4, mean: 55, median: 55, min: 10, max: 100 })
  assert.deepEqual(summarise([33]), { count: 1, mean: 33, median: 33, min: 33, max: 33 })
  assert.deepEqual(summarise([]), { count: 0, mean: null, median: null, min: null, max: null })
})

test('score bands cover 0-100 in ten bands, with 100 in the last', () => {
  const bands = scoreBands([0, 9, 10, 55, 89, 90, 100])
  assert.equal(bands.length, 10)
  assert.deepEqual(bands[0], { from: 0, to: 9, count: 2 })
  assert.deepEqual(bands[1], { from: 10, to: 19, count: 1 })
  assert.deepEqual(bands[5], { from: 50, to: 59, count: 1 })
  assert.deepEqual(bands[8], { from: 80, to: 89, count: 1 })
  assert.deepEqual(bands[9], { from: 90, to: 100, count: 2 })
  assert.equal(bands.reduce((sum, b) => sum + b.count, 0), 7)
})

test('each learner is represented by their most recent completed attempt', () => {
  const at = (iso) => new Date(iso)
  const latest = latestPerLearner([
    { _id: 'a1', profile_id: 'p1', completed_at: at('2026-09-01T10:00:00Z'), total_score: 40 },
    { _id: 'a2', profile_id: 'p1', completed_at: at('2026-09-03T10:00:00Z'), total_score: 80 },
    { _id: 'a3', profile_id: 'p2', completed_at: at('2026-09-02T10:00:00Z'), total_score: 60 },
  ])
  assert.deepEqual(latest.map((a) => a._id).sort(), ['a2', 'a3'])
})

test('completions are bucketed by UTC day across a fixed window ending today', () => {
  const now = new Date('2026-09-24T08:00:00Z')
  const rows = completionsByDay([
    { completed_at: new Date('2026-09-24T01:00:00Z') },
    { completed_at: new Date('2026-09-24T23:59:00Z') },
    { completed_at: new Date('2026-09-11T00:00:00Z') },
    { completed_at: new Date('2026-09-10T23:59:59Z') }, // outside the 14-day window
  ], now)
  assert.equal(rows.length, 14)
  assert.equal(rows[0].date, '2026-09-11')
  assert.equal(rows[0].completed, 1)
  assert.equal(rows[13].date, '2026-09-24')
  assert.equal(rows[13].completed, 2)
  assert.equal(rows.reduce((sum, r) => sum + r.completed, 0), 3)
})

test('platform rates are ratios over decided runs of the right disposition', () => {
  const rows = platformPerformance([
    entry('whatsapp', 'malicious', MISSED_THREAT, 2),
    entry('whatsapp', 'malicious', HANDLED_SAFELY, 10),
    entry('whatsapp', 'malicious', HANDLED_SAFELY, 9),
    entry('whatsapp', 'malicious', NOT_RESOLVED, 3), // closed by the clock: not decided
    entry('whatsapp', 'legitimate', FALSE_POSITIVE, 4),
    entry('whatsapp', 'legitimate', UNSAFE_HANDLING, 6),
  ])
  const wa = rows.find((r) => r.platform === 'whatsapp')

  assert.equal(wa.scenarios, 6)
  assert.equal(wa.points, 34)
  assert.equal(wa.max_points, 60)
  assert.equal(wa.average_score, 5.7)
  assert.deepEqual(wa.score_rate, { numerator: 34, denominator: 60, rate: 0.5667 })
  // 1 missed of 3 decided malicious - the unresolved one is in neither half.
  assert.deepEqual(wa.attack_success_rate, { numerator: 1, denominator: 3, rate: 0.3333 })
  // 2 handled safely of 5 decided runs.
  assert.deepEqual(wa.safe_handling_rate, { numerator: 2, denominator: 5, rate: 0.4 })
  // 1 rejected of 2 decided legitimate.
  assert.deepEqual(wa.false_positive_rate, { numerator: 1, denominator: 2, rate: 0.5 })
  assert.equal(wa.outcomes[NOT_RESOLVED], 1)
})

test('all four platforms are always present, with null rates when there is no data', () => {
  const rows = platformPerformance([])
  assert.deepEqual(rows.map((r) => r.platform), ['whatsapp', 'instagram', 'email', 'sms'])
  for (const row of rows) {
    assert.equal(row.scenarios, 0)
    assert.equal(row.average_score, null)
    assert.equal(row.attack_success_rate.rate, null)
  }
})

test('extremes name the highest and lowest, report ties together, and need two platforms', () => {
  const rows = platformPerformance([
    entry('whatsapp', 'malicious', MISSED_THREAT, 0),
    entry('email', 'malicious', HANDLED_SAFELY, 10),
    entry('sms', 'malicious', HANDLED_SAFELY, 10),
  ])
  const ex = extremesOf(rows, 'attack_success_rate')
  assert.deepEqual(ex.highest.platforms, ['whatsapp'])
  assert.equal(ex.highest.rate, 1)
  assert.deepEqual(ex.lowest.platforms, ['email', 'sms'])
  assert.equal(ex.lowest.rate, 0)
  assert.equal(ex.all_equal, false)

  const one = platformPerformance([entry('sms', 'malicious', MISSED_THREAT, 0)])
  assert.equal(extremesOf(one, 'attack_success_rate'), null)
})

test('the whole payload, from an empty installation', () => {
  const data = aggregateDashboard({
    now: new Date('2026-09-24T00:00:00Z'),
    learners: { total: 0, archived: 0, withAnyAttempt: 0 },
    statusCounts: {},
    completedAttempts: [],
    entries: [],
  })
  assert.equal(data.attempts.total, 0)
  assert.equal(data.attempts.completion_rate.rate, null)
  assert.equal(data.scores.attempts.count, 0)
  assert.equal(data.scores.attempt_bands.every((b) => b.count === 0), true)
  assert.equal(data.extremes.attack_success_rate, null)
  assert.equal(data.platforms.length, 4)
  assert.equal(data.activity.completions_by_day.length, 14)
  assert.equal(data.scope.mode, 'assessment')
  assert.equal('completed_by_mode' in data.attempts, false)
})

test('the whole payload carries no identity and no scoring vocabulary', () => {
  const data = aggregateDashboard({
    now: new Date('2026-09-24T00:00:00Z'),
    learners: { total: 2, archived: 0, withAnyAttempt: 2 },
    statusCounts: { completed: 2, in_progress: 1 },
    completedAttempts: [
      { _id: 'SECRET-ATTEMPT-ID', profile_id: 'SECRET-PROFILE', mode: 'assessment',
        total_score: 70, completed_at: new Date('2026-09-23T00:00:00Z'), end_reason: 'learner_completed' },
      { _id: 'SECRET-ATTEMPT-2', profile_id: 'SECRET-PROFILE-2', mode: 'assessment',
        total_score: 40, completed_at: new Date('2026-09-22T00:00:00Z'), end_reason: 'expired' },
    ],
    entries: [entry('email', 'malicious', MISSED_THREAT, 1)],
  })
  const json = JSON.stringify(data)
  for (const forbidden of ['SECRET', 'profile_id', 'attempt_id', 'scenario_id', 'event_code',
    'outcome_code', 'rationale', 'intent', 'RESOLVE_CORRECT']) {
    assert.ok(!json.includes(forbidden), `payload carried ${forbidden}`)
  }
  assert.deepEqual(data.attempts.completion_rate, { numerator: 2, denominator: 3, rate: 0.6667 })
  assert.deepEqual(data.attempts.completed_end_reasons, { learner_completed: 1, expired: 1 })
  assert.equal(data.learners.with_completed_attempt, 2)
})
