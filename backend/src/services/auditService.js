import {
  ACTION_RESOURCE_TYPES,
  AUDIT_ACTIONS,
  AUDIT_SCHEMA_VERSION,
  AUDIT_METADATA_ALLOWLIST,
  AUDIT_PAGE_SIZE_DEFAULT,
  AUDIT_PAGE_SIZE_MAX,
  AUDIT_RESOURCE_TYPES,
  AUDIT_STATUSES,
  MAX_METADATA_VALUE_LENGTH,
  MAX_RESOURCE_ID_LENGTH,
  looksSensitive,
} from '../constants/auditLog.js'
import { AuditEvent } from '../models/AuditEvent.js'
import { isDuplicateKeyError } from '../utils/transactions.js'

/**
 * The append-only instructor audit log (ADMIN-005).
 *
 * The whole write surface is `append()`. There is deliberately no update, no delete and
 * no upsert - not as a policy a caller is trusted to follow, but because the functions do
 * not exist. Specification section 6 requires the log to be append-only, and the cheapest
 * way to guarantee that is to give the rest of the system nothing else to call.
 *
 * This is a foundation. ADMIN-001 to ADMIN-004 will call `append()` from inside the
 * transactions that publish a scenario, reset an attempt, produce an export or change a
 * configuration value; none of those operations exist yet, and none are implemented here.
 */

export class AuditError extends Error {
  constructor(code, message, details = null) {
    super(message)
    this.name = 'AuditError'
    this.code = code
    this.status = 422
    this.details = details
    this.isDomainError = true
  }
}

const fail = (code, message, details) => {
  throw new AuditError(code, message, details)
}

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

/**
 * The actor must be a resolved AdminUser document, not an id and not a name.
 *
 * Taking the whole document is the point: it can only come from `requireAdmin`, which
 * resolved it from a signed cookie against the AdminUser collection. A caller cannot
 * invent an actor by passing a string.
 */
function actorFrom(actor) {
  const id = actor?._id
  const username = actor?.username
  if (!id || typeof username !== 'string' || username.length === 0) {
    fail('INVALID_AUDIT_ACTOR', 'An audit entry needs the authenticated administrator.')
  }
  return { actor_admin_id: id, actor_username: username }
}

/**
 * Allowlisted keys, scalar values, and a second pass for anything that smells of a
 * secret whatever it is called.
 *
 * A rejected key is named in the error `details` so a future caller sees which one it
 * was; the VALUE is never echoed back, because the value is exactly what might be
 * sensitive.
 */
export function sanitiseAuditMetadata(metadata) {
  if (metadata === undefined || metadata === null) return {}
  if (typeof metadata !== 'object' || Array.isArray(metadata)) {
    fail('INVALID_AUDIT_METADATA', 'Audit metadata must be an object.')
  }

  const keys = Object.keys(metadata)

  const unknown = keys.filter((key) => !AUDIT_METADATA_ALLOWLIST.includes(key))
  if (unknown.length) {
    fail('INVALID_AUDIT_METADATA',
      'Audit metadata contains keys outside the allowlist.', { rejected_keys: unknown })
  }

  // Second layer: catches a key added to the allowlist without thinking.
  const sensitive = keys.filter(looksSensitive)
  if (sensitive.length) {
    fail('INVALID_AUDIT_METADATA',
      'Audit metadata must not carry sensitive values.', { rejected_keys: sensitive })
  }

  const clean = {}
  for (const key of keys) {
    const value = metadata[key]
    if (value === null || value === undefined) continue

    if (typeof value === 'object') {
      fail('INVALID_AUDIT_METADATA',
        'Audit metadata values must be simple scalars, not documents or arrays.',
        { rejected_keys: [key] })
    }
    if (typeof value === 'string' && value.length > MAX_METADATA_VALUE_LENGTH) {
      fail('INVALID_AUDIT_METADATA',
        `Audit metadata values must be ${MAX_METADATA_VALUE_LENGTH} characters or fewer.`,
        { rejected_keys: [key] })
    }
    clean[key] = value
  }
  return clean
}

function validateAction(action) {
  if (!AUDIT_ACTIONS.includes(action)) {
    fail('INVALID_AUDIT_ACTION', 'That is not a recorded administrative action.')
  }
}

function validateResource(action, resourceType, resourceId) {
  if (!AUDIT_RESOURCE_TYPES.includes(resourceType)) {
    fail('INVALID_AUDIT_RESOURCE', 'That is not an auditable resource type.')
  }
  if (!ACTION_RESOURCE_TYPES[action].includes(resourceType)) {
    fail('INVALID_AUDIT_RESOURCE',
      `A "${action}" entry cannot name a "${resourceType}" resource.`)
  }
  if (typeof resourceId !== 'string' || resourceId.trim().length === 0) {
    fail('INVALID_AUDIT_RESOURCE', 'An audit entry must name the resource it affected.')
  }
  if (resourceId.length > MAX_RESOURCE_ID_LENGTH) {
    fail('INVALID_AUDIT_RESOURCE',
      'A resource id must be an identifier, not a payload.')
  }
}

/* ------------------------------------------------------------------ *
 * Append - the entire write surface
 * ------------------------------------------------------------------ */

/**
 * Records one administrative action. The only way to write to the audit log.
 *
 * `session` makes the entry commit with the change it describes: a future scenario
 * publication will pass its own session so the publication and its audit record either
 * both land or neither does. It never opens a transaction of its own - nesting one inside
 * a caller's would defeat that guarantee.
 *
 * `idempotencyKey` is optional. When a caller supplies one, a retried operation records
 * once: the duplicate insert is caught and the original entry returned. Without a key
 * every call appends, because two identical administrative actions really are two facts.
 */
export async function append({
  actor,
  action,
  resourceType,
  resourceId,
  status = 'succeeded',
  errorCode = null,
  metadata,
  idempotencyKey = null,
  session = null,
} = {}) {
  const who = actorFrom(actor)
  validateAction(action)
  validateResource(action, resourceType, resourceId)

  if (!AUDIT_STATUSES.includes(status)) {
    fail('INVALID_AUDIT_STATUS', 'An audit entry must record whether the action succeeded.')
  }

  const clean = sanitiseAuditMetadata(metadata)

  const document = {
    schema_version: AUDIT_SCHEMA_VERSION,
    ...who,
    action,
    resource_type: resourceType,
    resource_id: String(resourceId).trim(),
    status,
    // A failure category belongs only on a failure.
    error_code: status === 'failed' && typeof errorCode === 'string' ? errorCode.trim() : null,
    metadata: clean,
    idempotency_key: typeof idempotencyKey === 'string' && idempotencyKey.length
      ? idempotencyKey
      : null,
    occurred_at: new Date(),
  }

  try {
    const [entry] = await AuditEvent.create([document], session ? { session } : {})
    return entry
  } catch (error) {
    // A retried operation carrying the same key recorded once. Return the original.
    if (isDuplicateKeyError(error) && document.idempotency_key) {
      const existing = await AuditEvent
        .findOne({ idempotency_key: document.idempotency_key })
        .session(session ?? null)
      if (existing) return existing
    }
    throw error
  }
}

/* ------------------------------------------------------------------ *
 * Read
 * ------------------------------------------------------------------ */

/**
 * Newest-first page of entries, for the instructor audit view a later Admin task will
 * build. Read-only, and every filter is validated against the same closed vocabulary the
 * writer uses - an unknown action or resource type returns nothing rather than erroring
 * on a browse.
 */
export async function listAuditEvents({
  action,
  resourceType,
  resourceId,
  actorAdminId,
  from,
  to,
  page = 1,
  pageSize = AUDIT_PAGE_SIZE_DEFAULT,
} = {}) {
  const query = {}

  if (action) query.action = AUDIT_ACTIONS.includes(action) ? action : '__none__'
  if (resourceType) {
    query.resource_type = AUDIT_RESOURCE_TYPES.includes(resourceType) ? resourceType : '__none__'
  }
  if (resourceId) query.resource_id = String(resourceId).slice(0, MAX_RESOURCE_ID_LENGTH)
  if (actorAdminId) query.actor_admin_id = actorAdminId

  const occurred = {}
  const fromDate = from ? new Date(from) : null
  const toDate = to ? new Date(to) : null
  if (fromDate && !Number.isNaN(fromDate.getTime())) occurred.$gte = fromDate
  if (toDate && !Number.isNaN(toDate.getTime())) occurred.$lte = toDate
  if (Object.keys(occurred).length) query.occurred_at = occurred

  const size = Math.min(Math.max(Number(pageSize) || AUDIT_PAGE_SIZE_DEFAULT, 1), AUDIT_PAGE_SIZE_MAX)
  const current = Math.max(Number(page) || 1, 1)

  const [entries, total] = await Promise.all([
    AuditEvent.find(query).sort({ occurred_at: -1, _id: -1 })
      .skip((current - 1) * size).limit(size),
    AuditEvent.countDocuments(query),
  ])

  return {
    entries: entries.map((entry) => entry.toAdminJSON()),
    page: current,
    page_size: size,
    total,
    total_pages: Math.max(Math.ceil(total / size), 1),
  }
}

/** Every entry naming one resource, newest first. For a future "history of" view. */
export async function auditTrailFor(resourceType, resourceId, { limit = AUDIT_PAGE_SIZE_DEFAULT } = {}) {
  const entries = await AuditEvent
    .find({ resource_type: resourceType, resource_id: String(resourceId) })
    .sort({ occurred_at: -1, _id: -1 })
    .limit(Math.min(Math.max(Number(limit) || AUDIT_PAGE_SIZE_DEFAULT, 1), AUDIT_PAGE_SIZE_MAX))
  return entries.map((entry) => entry.toAdminJSON())
}
