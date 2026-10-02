import { sign, unsign } from 'cookie-signature'
import { env, isProduction } from '../config/env.js'
import { AdminUser } from '../models/AdminUser.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const COOKIE_NAME = 'admin_session'

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProduction,
  maxAge: env.adminSessionMaxAgeMs,
  path: '/',
}

/**
 * The admin session. Deliberately NOT built on cookie-parser's `signed: true`.
 *
 * cookie-parser is initialised once, with the candidate secret, and it skips
 * re-parsing when `req.cookies` is already set - so a second parser with the
 * admin secret cannot be mounted. Signing this cookie here with
 * `cookie-signature` (the same library cookie-parser itself uses) is what
 * gives the admin session its own secret in practice rather than only on
 * paper. A candidate cookie therefore cannot be re-signed into an admin one,
 * and vice versa.
 *
 * Three things separate the two sessions: a different cookie name, a
 * different signing secret, and a different collection to resolve against.
 */
export function startAdminSession(res, adminId) {
  res.cookie(COOKIE_NAME, sign(String(adminId), env.adminSessionSecret), cookieOptions)
}

export function endAdminSession(res) {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined })
}

/** The admin id carried by a valid, correctly signed cookie - otherwise null. */
export function readAdminSession(req) {
  const raw = req.cookies?.[COOKIE_NAME]
  if (typeof raw !== 'string' || raw.length === 0) return null

  const value = unsign(raw, env.adminSessionSecret)
  return value === false ? null : value
}

/**
 * Guards every /api/admin route except login and logout.
 *
 * There is no fallback to `requireCandidate`: a candidate session reaching an
 * admin route is rejected, not downgraded, not upgraded. Nothing about the
 * request body, query or headers is consulted - the cookie signature is the
 * only thing trusted, and the AdminUser must still exist.
 */
export const requireAdmin = asyncHandler(async (req, _res, next) => {
  const adminId = readAdminSession(req)
  if (!adminId) {
    return next(new ApiError(401, 'NO_ADMIN_SESSION', 'Please sign in as an administrator.'))
  }

  let admin = null
  try {
    admin = await AdminUser.findById(adminId)
  } catch {
    admin = null // a signed-but-malformed id must not surface as a 500
  }

  if (!admin) {
    return next(new ApiError(401, 'NO_ADMIN_SESSION', 'Your admin session is no longer valid.'))
  }

  req.admin = admin
  next()
})
