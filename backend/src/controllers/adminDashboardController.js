import { buildDashboard } from '../services/adminDashboardService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/**
 * The instructor dashboard HTTP surface (ENHANCEMENT-001).
 *
 * One GET behind `requireAdmin`. The query string is handed over whole so the service can
 * refuse an unknown key; nothing is interpreted, written or audited here - reading
 * aggregate figures is not an administrative change.
 */

/** GET /api/admin/dashboard */
export const getDashboard = asyncHandler(async (req, res) => {
  res.json(await buildDashboard(req.query ?? {}))
})
