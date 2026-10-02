import { listAuditEvents } from '../services/auditService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/**
 * GET /api/admin/audit (ADMIN-005)
 *
 * The only HTTP surface the audit log has, and it is read-only.
 *
 * There is deliberately no POST. An audit entry is a side effect of an administrative
 * change, written inside the same transaction as that change - never something a client
 * asks for directly. A route that appended on request would let an administrator forge
 * history, which is the one thing an audit log must not permit.
 *
 * There is likewise no PUT, PATCH or DELETE; those verbs fall through to the 404 handler
 * because no route matches them.
 */
export const getAuditLog = asyncHandler(async (req, res) => {
  const { action, resource_type: resourceType, resource_id: resourceId,
    actor_admin_id: actorAdminId, from, to, page, page_size: pageSize } = req.query ?? {}

  res.json(await listAuditEvents({
    action, resourceType, resourceId, actorAdminId, from, to, page, pageSize,
  }))
})
