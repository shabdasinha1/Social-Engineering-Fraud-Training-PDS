import { MARKS } from '../constants/assessment.js'

/**
 * Per-scenario scoring, exactly as the proposal defines it:
 *   judgement 0-3  +  action -5..+5  +  reason 0-2  =  -5..+10
 *
 * Pure: no I/O, no dates, no randomness.
 *
 * NOT here on purpose: any channel score, overall score, band or EVI
 * aggregation. That formula is still an open product decision - see
 * docs/QUESTION_ENGINE_DESIGN.md section 11.2.
 */

const clamp = (value, { min, max }) => Math.min(max, Math.max(min, value))

/**
 * The proposal gives judgement a 0-3 range but does not define partial credit,
 * so this awards full marks for the correct classification and none otherwise.
 * Intermediate values need client confirmation before they are introduced.
 */
function scoreJudgement(given, correct) {
  return given === correct ? MARKS.judgement.max : MARKS.judgement.min
}

export function scoreAnswer(scenario, answer) {
  const actionOption = scenario.actionOptions.find((option) => option.key === answer.actionKey)
  const reasonOption = scenario.reasonOptions.find((option) => option.key === answer.reasonKey)

  if (!actionOption || !reasonOption) {
    throw new Error('scoreAnswer received an option that does not belong to this scenario')
  }

  const judgement = scoreJudgement(answer.judgement, scenario.evaluation.correctJudgement)
  const action = clamp(actionOption.marks, MARKS.action)
  const reason = clamp(reasonOption.marks, MARKS.reason)

  return {
    marks: {
      judgement,
      action,
      reason,
      total: clamp(judgement + action + reason, MARKS.scenario),
    },
    isCriticalFailure: Boolean(actionOption.isCriticalFailure),
  }
}
