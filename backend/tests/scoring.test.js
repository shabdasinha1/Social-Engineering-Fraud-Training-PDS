import assert from 'node:assert/strict'
import test from 'node:test'
import { scoreAnswer } from '../src/services/scoringService.js'

const scenario = {
  actionOptions: [
    { key: 'verify', label: 'Check first', marks: 5 },
    { key: 'ignore', label: 'Ignore', marks: 3 },
    { key: 'ask', label: 'Reply and ask', marks: 1 },
    { key: 'pay', label: 'Send the money', marks: -5, isCriticalFailure: true },
  ],
  reasonOptions: [
    { key: 'urgency', label: 'It rushes me', marks: 2 },
    { key: 'partial', label: 'Something felt off', marks: 1 },
    { key: 'normal', label: 'Looks normal', marks: 0 },
  ],
  evaluation: { correctJudgement: 'fraudulent' },
}

test('a perfect answer scores the proposal maximum of 10', () => {
  const result = scoreAnswer(scenario, {
    judgement: 'fraudulent',
    actionKey: 'verify',
    reasonKey: 'urgency',
  })
  assert.deepEqual(result.marks, { judgement: 3, action: 5, reason: 2, total: 10 })
  assert.equal(result.isCriticalFailure, false)
})

test('the worst answer scores the proposal minimum of -5', () => {
  const result = scoreAnswer(scenario, {
    judgement: 'genuine',
    actionKey: 'pay',
    reasonKey: 'normal',
  })
  assert.deepEqual(result.marks, { judgement: 0, action: -5, reason: 0, total: -5 })
  assert.equal(result.isCriticalFailure, true, 'sending money is a critical failure')
})

test('judgement is all or nothing until partial credit is confirmed', () => {
  for (const judgement of ['genuine', 'needs_verification']) {
    const result = scoreAnswer(scenario, { judgement, actionKey: 'verify', reasonKey: 'urgency' })
    assert.equal(result.marks.judgement, 0)
  }
  const correct = scoreAnswer(scenario, {
    judgement: 'fraudulent',
    actionKey: 'verify',
    reasonKey: 'urgency',
  })
  assert.equal(correct.marks.judgement, 3)
})

test('action and reason marks come from the scenario, not the client', () => {
  const result = scoreAnswer(scenario, {
    judgement: 'fraudulent',
    actionKey: 'ask',
    reasonKey: 'partial',
    marks: { total: 999 },
  })
  assert.deepEqual(result.marks, { judgement: 3, action: 1, reason: 1, total: 5 })
})

test('an option that does not belong to the scenario is refused', () => {
  assert.throws(
    () =>
      scoreAnswer(scenario, {
        judgement: 'fraudulent',
        actionKey: 'not-an-option',
        reasonKey: 'urgency',
      }),
    /does not belong to this scenario/,
  )
})

test('a legitimate scenario is scored against its own correct judgement', () => {
  const genuine = { ...scenario, evaluation: { correctJudgement: 'genuine' } }
  const right = scoreAnswer(genuine, {
    judgement: 'genuine',
    actionKey: 'ignore',
    reasonKey: 'partial',
  })
  assert.equal(right.marks.judgement, 3)
  assert.equal(right.marks.total, 3 + 3 + 1)

  const wrong = scoreAnswer(genuine, {
    judgement: 'fraudulent',
    actionKey: 'ignore',
    reasonKey: 'partial',
  })
  assert.equal(wrong.marks.judgement, 0)
})
