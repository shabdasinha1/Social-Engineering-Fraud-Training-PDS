import { endAdminSession, startAdminSession } from '../middleware/adminSession.js'
import { recordFailure, recordSuccess } from '../middleware/adminThrottle.js'
import { authenticateAdmin } from '../services/adminService.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/**
 * POST /api/admin/login
 *
 * One generic failure message for a missing field, an unknown username and a
 * wrong password alike - the response must not tell an attacker which
 * usernames exist.
 */
export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body ?? {}
  const key = req.adminThrottleKey

  const admin = await authenticateAdmin({ username, password })

  if (!admin) {
    if (key) recordFailure(key)
    throw new ApiError(401, 'INVALID_ADMIN_CREDENTIALS', 'Incorrect username or password.')
  }

  if (key) recordSuccess(key)
  startAdminSession(res, admin._id)

  res.json({ admin: admin.toPublicJSON() })
})

/** POST /api/admin/logout - clears the admin cookie only. */
export const logout = asyncHandler(async (_req, res) => {
  endAdminSession(res)
  res.json({ ok: true })
})

/** GET /api/admin/me - the minimum the frontend needs to render a session. */
export const getCurrentAdmin = asyncHandler(async (req, res) => {
  res.json({ admin: req.admin.toPublicJSON() })
})
