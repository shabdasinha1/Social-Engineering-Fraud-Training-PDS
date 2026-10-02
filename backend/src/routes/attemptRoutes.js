import { Router } from 'express'
import {
  finishAttempt,
  getAttempt,
  getAttemptResult,
  getCurrentAttempt,
  getCurrentRun,
  listCompletedAttempts,
  resolveRun,
  skipDemoScenario,
  startAttempt,
  submitRunEvent,
} from '../controllers/attemptController.js'
import { requireCandidate } from '../middleware/session.js'

/**
 * /api/attempts/* - the candidate orchestration surface (API-001).
 *
 * Every route sits behind `requireCandidate`, so ownership is derived from the signed
 * session cookie and never from the request. The legacy /api/assessments routes are
 * untouched and continue to serve the existing 40-scenario journey.
 *
 * `/current` is declared before `/:attemptId` so it is not captured as an id.
 */
export const attemptRoutes = Router()

attemptRoutes.use(requireCandidate)

attemptRoutes.post('/', startAttempt)
attemptRoutes.get('/', listCompletedAttempts)
attemptRoutes.get('/current', getCurrentAttempt)
attemptRoutes.get('/:attemptId', getAttempt)
attemptRoutes.get('/:attemptId/current-run', getCurrentRun)
attemptRoutes.post('/:attemptId/runs/:runId/events', submitRunEvent)
attemptRoutes.post('/:attemptId/runs/:runId/resolve', resolveRun)
/** ENHANCEMENT-003. Demo User only; 404 for everyone else. See the controller. */
attemptRoutes.post('/:attemptId/runs/:runId/demo-skip', skipDemoScenario)
attemptRoutes.post('/:attemptId/complete', finishAttempt)
attemptRoutes.get('/:attemptId/result', getAttemptResult)
