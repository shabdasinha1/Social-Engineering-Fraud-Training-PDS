import {
  getAttemptForAdmin,
  listAttempts,
  lookupLearners,
} from '../services/attemptViewerService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/**
 * The instructor attempt viewer HTTP surface (ADMIN-002).
 *
 * Three GETs, all behind `requireAdmin`, and nothing else. The handlers translate a query
 * string into a service call and return what it produced - no filter is interpreted here,
 * no projection is assembled here, and no state is touched.
 *
 * **There is no write verb, deliberately.** The viewer inspects attempts; resetting one
 * is ADMIN-004 and will carry its own audit entry. A PUT, PATCH, POST or DELETE against
 * any of these paths falls through to the 404 handler because no route matches it.
 *
 * Nothing here appends to the ADMIN-005 audit log. That log records administrative
 * CHANGES - publications, resets, exports, configuration - and reading an attempt is not
 * one; inventing a "viewed" action would fill the change log with browsing noise.
 */

/**
 * GET /api/admin/attempts
 *
 * A bounded, allowlisted, deterministically ordered page of attempt summaries. `req.query`
 * is handed over whole so the service can reject an unknown key rather than silently
 * ignoring it.
 */
export const listAttemptsForAdmin = asyncHandler(async (req, res) => {
  res.json(await listAttempts(req.query ?? {}))
})

/**
 * GET /api/admin/attempts/:attemptId
 *
 * One attempt in full instructor detail. A completed attempt is projected from the
 * authoritative RESULT-001 result; an unfinished one reports its resolved scenarios and
 * says plainly that the rest are not done.
 */
export const getAttemptDetailForAdmin = asyncHandler(async (req, res) => {
  res.json(await getAttemptForAdmin(req.params.attemptId))
})

/**
 * GET /api/admin/learners
 *
 * The bounded lookup that makes the learner filter usable: it turns a name or service
 * number prefix into a `profile_id`. It publishes the masked service number only.
 */
export const lookupLearnersForAdmin = asyncHandler(async (req, res) => {
  res.json(await lookupLearners(req.query ?? {}))
})
