import assert from 'node:assert/strict'
import test from 'node:test'
import { summaryOf } from '../src/services/assessmentService.js'

/** A stand-in for the parts of an Assessment that summaryOf actually reads. */
function assessment(answers) {
  return { sequence: answers.map((answer) => ({ answer })) }
}

const answer = (total, { critical = false, durationMs = 1000 } = {}) => ({
  marks: { total },
  isCriticalFailure: critical,
  durationMs,
})

test('summary counts answers, marks, critical failures and duration', () => {
  const result = summaryOf(
    assessment([answer(10), answer(3, { critical: true, durationMs: 2500 }), answer(-5)]),
  )

  assert.deepEqual(result, {
    answeredQuestions: 3,
    marksAwarded: 8,
    marksAvailable: 30,
    criticalFailures: 1,
    totalDurationMs: 4500,
    scoringPending: true,
  })
})

test('summary always reports scoringPending - it never produces a final score', () => {
  const result = summaryOf(assessment([answer(10), answer(10)]))
  assert.equal(result.scoringPending, true)
  assert.ok(!('overallScore' in result))
  assert.ok(!('band' in result))
  assert.ok(!('evi' in result))
  assert.ok(!('percentage' in result))
})

test('summary ignores unanswered questions instead of counting them as zero', () => {
  const withGaps = { sequence: [{ answer: answer(7) }, { answer: null }, { answer: null }] }
  const result = summaryOf(withGaps)

  assert.equal(result.answeredQuestions, 1)
  assert.equal(result.marksAvailable, 10)
  assert.equal(result.marksAwarded, 7)
})

test('summary survives answers with missing marks or duration', () => {
  const malformed = {
    sequence: [{ answer: { isCriticalFailure: false } }, { answer: { marks: {} } }],
  }
  const result = summaryOf(malformed)

  assert.equal(result.marksAwarded, 0)
  assert.equal(result.totalDurationMs, 0)
  assert.equal(result.answeredQuestions, 2)
})

test('an assessment with no answers summarises to zeroes, not NaN', () => {
  const result = summaryOf(assessment([]))
  assert.deepEqual(result, {
    answeredQuestions: 0,
    marksAwarded: 0,
    marksAvailable: 0,
    criticalFailures: 0,
    totalDurationMs: 0,
    scoringPending: true,
  })
})
