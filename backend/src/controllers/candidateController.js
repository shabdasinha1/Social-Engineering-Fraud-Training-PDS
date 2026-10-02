import {
  acknowledgeBriefing,
  findOrCreateCandidate,
  touchLastSeen,
} from '../services/candidateService.js'
import { endSession, startSession } from '../middleware/session.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/** POST /api/candidates - sign in or register, and start the session. */
export const createCandidate = asyncHandler(async (req, res) => {
  const { name, identifier } = req.body ?? {}
  const { candidate, created } = await findOrCreateCandidate({ name, identifier })

  startSession(res, candidate._id)
  res.status(created ? 201 : 200).json({ candidate: candidate.toPublicJSON(), created })
})

/**
 * GET /api/candidates/me - who the session belongs to.
 *
 * Refreshes `last_seen_at` (PROFILE-001), throttled inside the service so a learner
 * reloading the shell does not write once per render. The refresh happens only for a
 * request that already passed `requireCandidate`, so a rejected or unauthenticated call
 * never moves the timestamp.
 */
export const getCurrentCandidate = asyncHandler(async (req, res) => {
  await touchLastSeen(req.candidate)
  res.json({ candidate: req.candidate.toPublicJSON() })
})

/**
 * POST /api/candidates/me/briefing - record the learner's briefing acknowledgement.
 *
 * Separate from the session read on purpose. Acknowledgement is an action the learner
 * takes, so it needs a request they caused; folding it into `GET /me` would acknowledge the
 * briefing for anyone who merely loaded a page, which is exactly what section 2's consent
 * requirement is not.
 */
export const acknowledgeBriefingVersion = asyncHandler(async (req, res) => {
  const { version } = req.body ?? {}
  const candidate = await acknowledgeBriefing(req.candidate, Number(version))
  res.json({ candidate: candidate.toPublicJSON() })
})

/** POST /api/candidates/logout */
export const logout = asyncHandler(async (_req, res) => {
  endSession(res)
  res.json({ ok: true })
})
