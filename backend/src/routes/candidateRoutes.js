import { Router } from 'express'
import {
  acknowledgeBriefingVersion,
  createCandidate,
  getCurrentCandidate,
  logout,
} from '../controllers/candidateController.js'
import { requireCandidate } from '../middleware/session.js'

export const candidateRoutes = Router()

candidateRoutes.post('/', createCandidate)
candidateRoutes.post('/logout', logout)
candidateRoutes.get('/me', requireCandidate, getCurrentCandidate)
/** PROFILE-001. Behind the same session guard as `/me`: a learner may only acknowledge for themselves. */
candidateRoutes.post('/me/briefing', requireCandidate, acknowledgeBriefingVersion)
