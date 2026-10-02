import { Router } from 'express'
import {
  answerQuestion,
  finishAssessment,
  getActiveAssessment,
  getAssessment,
  getAssessmentHistory,
  startAssessment,
} from '../controllers/assessmentController.js'
import { requireCandidate } from '../middleware/session.js'

export const assessmentRoutes = Router()

assessmentRoutes.use(requireCandidate)

assessmentRoutes.post('/', startAssessment)
assessmentRoutes.get('/', getAssessmentHistory)
assessmentRoutes.get('/active', getActiveAssessment)
assessmentRoutes.get('/:id', getAssessment)
assessmentRoutes.post('/:id/answers', answerQuestion)
assessmentRoutes.post('/:id/complete', finishAssessment)
