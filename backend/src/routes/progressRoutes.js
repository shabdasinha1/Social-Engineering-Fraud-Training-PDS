import { Router } from 'express'
import { getMyProgress } from '../controllers/progressController.js'
import { requireCandidate } from '../middleware/session.js'

/**
 * /api/progress - the learner's own progress snapshot (PROGRESS-001).
 *
 * One route, one verb, no parameters. Behind `requireCandidate` like every other candidate
 * surface, so an unauthenticated request is 401 and an archived profile stops being able to
 * read its progress the moment it is archived (ADMIN-004).
 */
export const progressRoutes = Router()

progressRoutes.get('/', requireCandidate, getMyProgress)
