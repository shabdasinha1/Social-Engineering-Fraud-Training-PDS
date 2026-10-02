import { env, isProduction } from '../config/env.js'
import { PROFILE_ARCHIVED_CODE, PROFILE_ARCHIVED_MESSAGE } from '../constants/instructorControls.js'
import { Candidate } from '../models/Candidate.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const COOKIE_NAME = 'candidate_session'

const cookieOptions = {
  httpOnly: true,
  signed: true,
  sameSite: 'lax',
  secure: isProduction,
  maxAge: env.sessionMaxAgeMs,
  path: '/',
}

/**
 * A signed httpOnly cookie holding the candidate id. Local-only application,
 * so there is no session store to keep in sync - the signature is what stops a
 * candidate pointing the cookie at someone else's id.
 */
export function startSession(res, candidateId) {
  res.cookie(COOKIE_NAME, String(candidateId), cookieOptions)
}

export function endSession(res) {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined })
}

/** Resolves the candidate from the cookie. Never from the body or the query. */
export const requireCandidate = asyncHandler(async (req, _res, next) => {
  const candidateId = req.signedCookies?.[COOKIE_NAME]
  if (!candidateId) {
    return next(new ApiError(401, 'NO_SESSION', 'Please sign in to continue.'))
  }

  let candidate = null
  try {
    candidate = await Candidate.findById(candidateId)
  } catch (error) {
    // A signed-but-malformed id must not surface as a 500. Anything else (the database
    // being unreachable) is still a server fault, not a reason to end the learner's session.
    if (error?.name !== 'CastError') throw error
  }
  if (!candidate) {
    return next(new ApiError(401, 'NO_SESSION', 'Your session is no longer valid.'))
  }

  /**
   * An archived profile (ADMIN-004) stops being usable immediately, including for a
   * session that was already open when the instructor archived it.
   *
   * Checked here rather than only at login, because a learner holding a live cookie would
   * otherwise keep working for the rest of the session's eight hours. Nothing is deleted
   * and nothing about their attempts changes - they simply cannot act any more.
   */
  if (candidate.archived) {
    return next(new ApiError(401, PROFILE_ARCHIVED_CODE, PROFILE_ARCHIVED_MESSAGE))
  }

  req.candidate = candidate
  next()
})
