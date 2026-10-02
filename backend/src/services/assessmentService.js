import { ASSESSMENT_SCENARIO_COUNT, JUDGEMENTS } from '../constants/assessment.js'
import { Assessment } from '../models/Assessment.js'
import { Scenario } from '../models/Scenario.js'
import { ApiError } from '../utils/ApiError.js'
import { recordScenarioSeen } from './candidateService.js'
import { generateSequence } from './sequenceGenerationService.js'
import { scoreAnswer } from './scoringService.js'

/**
 * Everything the server decides about an assessment. Controllers only translate
 * HTTP to these calls; no selection or scoring logic lives in a route.
 */

/**
 * Creates one assessment, or returns the candidate's existing in-progress one.
 *
 * Idempotent on purpose: a retry, a double click or a refresh must not create a
 * second assessment, and must not let a candidate re-roll the sequence until
 * they get an easier set.
 */
export async function createOrResumeAssessment(candidate) {
  const existing = await Assessment.findOne({ candidate: candidate._id, status: 'IN_PROGRESS' })
  if (existing) return { assessment: existing, created: false }

  const pool = await Scenario.find({ isActive: true }).select('_id channel type version').lean()

  const scenarios = pool.map((doc) => ({
    id: String(doc._id),
    channel: doc.channel,
    type: doc.type,
    version: doc.version,
  }))

  const seen = new Map(
    candidate.seenScenarios.map((entry) => [
      String(entry.scenario),
      new Date(entry.lastSeenAt).getTime(),
    ]),
  )

  let plan
  try {
    plan = generateSequence({ scenarios, seen })
  } catch (error) {
    if (error.code === 'POOL_TOO_SMALL' || error.code === 'SEQUENCE_GENERATION_FAILED') {
      throw ApiError.conflict(error.code, error.message)
    }
    throw error
  }

  const assessment = await Assessment.create({
    candidate: candidate._id,
    sequence: plan.sequence,
    composition: plan.composition,
    relaxations: plan.relaxations,
  })

  return { assessment, created: true }
}

/**
 * The candidate's in-progress assessment, or null. Read-only: the dashboard
 * needs to know whether to offer "Start" or "Continue" WITHOUT creating one.
 */
export async function findActiveAssessment(candidateId) {
  return Assessment.findOne({ candidate: candidateId, status: 'IN_PROGRESS' })
}

/** 404 rather than 403 for someone else's assessment, so ids cannot be probed. */
export async function findOwnAssessment(assessmentId, candidateId) {
  const assessment = await Assessment.findOne({ _id: assessmentId, candidate: candidateId }).catch(
    () => null,
  )
  if (!assessment) throw ApiError.notFound('Assessment not found.')
  return assessment
}

function progressOf(assessment) {
  return {
    assessmentId: assessment._id.toString(),
    status: assessment.status,
    questionNumber: Math.min(assessment.currentPosition, ASSESSMENT_SCENARIO_COUNT),
    totalQuestions: assessment.sequence.length,
    answered: assessment.sequence.filter((item) => item.answer).length,
    allAnswered: assessment.sequence.every((item) => item.answer),
    startedAt: assessment.startedAt,
    completedAt: assessment.completedAt,
  }
}

/**
 * The current question, stripped for the candidate. `servedAt` is stamped once
 * so a refresh cannot restart the clock, and the scenario joins the candidate's
 * history the moment it is actually shown.
 *
 * The composition and the rest of the sequence are never returned - knowing how
 * many frauds the test contains would give the answer away.
 */
export async function serveCurrentQuestion(assessment, candidate) {
  if (assessment.status !== 'IN_PROGRESS') {
    return { progress: progressOf(assessment), question: null }
  }

  const item = assessment.sequence.find((entry) => entry.position === assessment.currentPosition)
  if (!item) return { progress: progressOf(assessment), question: null }

  const scenario = await Scenario.findById(item.scenario)
  if (!scenario) throw ApiError.notFound('The scenario for this question is missing.')

  if (!item.servedAt) {
    item.servedAt = new Date()
    await assessment.save()
    await recordScenarioSeen(candidate._id, scenario._id)
  }

  return {
    progress: progressOf(assessment),
    question: {
      questionNumber: item.position,
      totalQuestions: assessment.sequence.length,
      scenario: scenario.toCandidateJSON(),
      judgementOptions: JUDGEMENTS,
    },
  }
}

/**
 * Validates, scores on the server and advances. Nothing the client sends about
 * marks, timing or the scenario is trusted - the scenario comes from the frozen
 * sequence and the duration from the server's own timestamps.
 */
export async function submitAnswer(assessment, payload) {
  if (assessment.status !== 'IN_PROGRESS') {
    throw ApiError.conflict('ASSESSMENT_NOT_IN_PROGRESS', 'This assessment is already finished.')
  }

  const { questionNumber, judgement, actionKey, reasonKey, interactions } = payload ?? {}

  if (questionNumber !== assessment.currentPosition) {
    throw ApiError.conflict(
      'NOT_CURRENT_QUESTION',
      `Question ${questionNumber} is not the current question.`,
      { currentQuestionNumber: assessment.currentPosition },
    )
  }

  const item = assessment.sequence.find((entry) => entry.position === assessment.currentPosition)
  if (item.answer) {
    throw ApiError.conflict('ALREADY_ANSWERED', 'This question has already been answered.')
  }
  if (!item.servedAt) {
    throw ApiError.conflict('QUESTION_NOT_SERVED', 'Load the question before answering it.')
  }

  if (!JUDGEMENTS.includes(judgement)) {
    throw ApiError.unprocessable('INVALID_OPTION', `judgement must be one of ${JUDGEMENTS.join(', ')}.`)
  }

  const scenario = await Scenario.findById(item.scenario).select('+evaluation')
  if (!scenario) throw ApiError.notFound('The scenario for this question is missing.')

  if (!scenario.actionOptions.some((option) => option.key === actionKey)) {
    throw ApiError.unprocessable('INVALID_OPTION', 'That action is not offered for this scenario.')
  }
  if (!scenario.reasonOptions.some((option) => option.key === reasonKey)) {
    throw ApiError.unprocessable('INVALID_OPTION', 'That reason is not offered for this scenario.')
  }

  const submittedAt = new Date()
  const { marks, isCriticalFailure } = scoreAnswer(scenario, { judgement, actionKey, reasonKey })

  item.answer = {
    judgement,
    actionKey,
    reasonKey,
    interactions: Array.isArray(interactions) ? interactions : [],
    submittedAt,
    durationMs: submittedAt.getTime() - new Date(item.servedAt).getTime(),
    marks,
    isCriticalFailure,
  }

  assessment.currentPosition = Math.min(
    assessment.currentPosition + 1,
    ASSESSMENT_SCENARIO_COUNT + 1,
  )
  await assessment.save()

  const progress = progressOf(assessment)

  return {
    // Safe only because the answer is now recorded and cannot be changed.
    feedback: {
      awarded: marks.total,
      maxMarks: 10,
      correctJudgement: scenario.evaluation.correctJudgement,
      wasCorrect: judgement === scenario.evaluation.correctJudgement,
      warningSigns: scenario.evaluation.warningSigns,
      explanation: scenario.evaluation.feedback,
    },
    next: {
      hasNext: !progress.allAnswered,
      questionNumber: progress.allAnswered ? null : assessment.currentPosition,
    },
    progress,
  }
}

/** Requires all ten answers. Result aggregation is deliberately not written. */
export async function completeAssessment(assessment) {
  if (assessment.status === 'COMPLETED') {
    throw ApiError.conflict('ASSESSMENT_COMPLETED', 'This assessment is already complete.')
  }
  if (assessment.status !== 'IN_PROGRESS') {
    throw ApiError.conflict('ASSESSMENT_NOT_IN_PROGRESS', 'This assessment cannot be completed.')
  }

  const unanswered = assessment.sequence.filter((item) => !item.answer)
  if (unanswered.length > 0) {
    throw ApiError.conflict(
      'QUESTIONS_OUTSTANDING',
      `${unanswered.length} question(s) still need an answer.`,
      { outstandingQuestions: unanswered.map((item) => item.position) },
    )
  }

  assessment.status = 'COMPLETED'
  assessment.completedAt = new Date()
  await assessment.save()

  return { ...progressOf(assessment), summary: summaryOf(assessment) }
}

/**
 * Per-question facts only, derived from answers already stored. The channel /
 * overall / band / EVI aggregation is an open product decision, so there is no
 * final score here - see QUESTION_ENGINE_DESIGN.md 11.2. Shared by the
 * completion response and the history list so the two cannot diverge.
 */
export function summaryOf(assessment) {
  const answers = assessment.sequence.map((item) => item.answer).filter(Boolean)

  return {
    answeredQuestions: answers.length,
    marksAwarded: answers.reduce((sum, answer) => sum + (answer.marks?.total ?? 0), 0),
    marksAvailable: answers.length * 10,
    criticalFailures: answers.filter((answer) => answer.isCriticalFailure).length,
    totalDurationMs: answers.reduce((sum, answer) => sum + (answer.durationMs ?? 0), 0),
    scoringPending: true,
  }
}

/**
 * The candidate's completed attempts, newest first. Read-only: it never
 * creates, mutates or completes anything.
 *
 * Only completed assessments appear - an in-progress one is surfaced on the
 * dashboard instead. Nothing about the scenarios themselves is returned.
 */
export async function listCompletedAssessments(candidateId) {
  const assessments = await Assessment.find({ candidate: candidateId, status: 'COMPLETED' })
    .sort({ completedAt: -1, _id: -1 })
    .lean({ virtuals: false })

  return assessments.map((doc) => {
    const answers = (doc.sequence ?? []).map((item) => item.answer).filter(Boolean)

    return {
      assessmentId: String(doc._id),
      status: doc.status,
      startedAt: doc.startedAt ?? null,
      completedAt: doc.completedAt ?? null,
      totalQuestions: (doc.sequence ?? []).length,
      summary: {
        answeredQuestions: answers.length,
        marksAwarded: answers.reduce((sum, a) => sum + (a.marks?.total ?? 0), 0),
        marksAvailable: answers.length * 10,
        criticalFailures: answers.filter((a) => a.isCriticalFailure).length,
        totalDurationMs: answers.reduce((sum, a) => sum + (a.durationMs ?? 0), 0),
        scoringPending: true,
      },
    }
  })
}

export { progressOf }
