import {
  completeAssessment,
  createOrResumeAssessment,
  findActiveAssessment,
  findOwnAssessment,
  listCompletedAssessments,
  progressOf,
  serveCurrentQuestion,
  submitAnswer,
} from '../services/assessmentService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/** POST /api/assessments - create, or resume the one already in progress. */
export const startAssessment = asyncHandler(async (req, res) => {
  const { assessment, created } = await createOrResumeAssessment(req.candidate)
  const payload = await serveCurrentQuestion(assessment, req.candidate)

  res.status(created ? 201 : 200).json({ ...payload, created })
})

/**
 * GET /api/assessments
 * The candidate's own completed attempts, newest first. Read-only.
 */
export const getAssessmentHistory = asyncHandler(async (req, res) => {
  res.json({ assessments: await listCompletedAssessments(req.candidate._id) })
})

/**
 * GET /api/assessments/active - the in-progress assessment or null.
 * Read-only: it never creates one, so the dashboard can render safely.
 */
export const getActiveAssessment = asyncHandler(async (req, res) => {
  const assessment = await findActiveAssessment(req.candidate._id)
  res.json({ assessment: assessment ? progressOf(assessment) : null })
})

/** GET /api/assessments/:id - resume: progress plus the current question. */
export const getAssessment = asyncHandler(async (req, res) => {
  const assessment = await findOwnAssessment(req.params.id, req.candidate._id)
  res.json(await serveCurrentQuestion(assessment, req.candidate))
})

/** POST /api/assessments/:id/answers */
export const answerQuestion = asyncHandler(async (req, res) => {
  const assessment = await findOwnAssessment(req.params.id, req.candidate._id)
  res.json(await submitAnswer(assessment, req.body))
})

/** POST /api/assessments/:id/complete */
export const finishAssessment = asyncHandler(async (req, res) => {
  const assessment = await findOwnAssessment(req.params.id, req.candidate._id)
  res.json(await completeAssessment(assessment))
})
