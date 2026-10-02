import { getProgressSnapshot } from '../services/progressService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/**
 * GET /api/progress - this learner's own progress snapshot (PROGRESS-001).
 *
 * Ownership comes from `req.candidate`, which `requireCandidate` resolved from the signed
 * session cookie. There is deliberately **no** profile parameter: not an id in the path, not
 * one in the query, not one in the body. A learner cannot ask for anybody else's progress
 * because there is nowhere to say whose progress they want.
 */
export const getMyProgress = asyncHandler(async (req, res) => {
  const snapshot = await getProgressSnapshot(req.candidate._id)
  res.json({ progress: snapshot.toCandidateJSON() })
})
