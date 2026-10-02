import mongoose from 'mongoose'
import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
  AUDIT_SCHEMA_VERSION,
  AUDIT_STATUSES,
  MAX_ERROR_CODE_LENGTH,
  MAX_RESOURCE_ID_LENGTH,
} from '../constants/auditLog.js'

const { Schema } = mongoose

/**
 * The append-only instructor audit log (ADMIN-005).
 *
 * Specification section 6 requires an append-only change log for scenario publication,
 * resets, exports and configuration changes. "Append-only" is enforced here in four
 * independent ways, because a log that can be quietly rewritten is worse than no log at
 * all - it looks like evidence:
 *
 *   1. every identifying field is `immutable`, so Mongoose drops a change to it;
 *   2. `pre('save')` rejects any save that is not an insert;
 *   3. every update, replace and delete query hook throws;
 *   4. the service exposes no update or delete method, and no HTTP route mutates.
 *
 * This is a local single-machine application, so the guard stops at the application
 * boundary: a database administrator with direct shell access can still alter the
 * collection. Enforcing more than that would need infrastructure the deployment does not
 * have, and pretending otherwise in a document would be worse than saying it plainly.
 */

/** Thrown when application code tries to change or remove an existing entry. */
export class AuditImmutableError extends Error {
  constructor(operation) {
    super(
      `The audit log is append-only: "${operation}" is not a supported operation. ` +
      'Record a new entry instead of altering an existing one.',
    )
    this.name = 'AuditImmutableError'
    this.code = 'AUDIT_IMMUTABLE'
    this.status = 409
    this.isDomainError = true
  }
}

const auditEventSchema = new Schema(
  {
    /**
     * Set explicitly by `auditService.append`, deliberately WITHOUT a schema default.
     *
     * An `immutable` path that also carries a `default` is a Mongoose trap: loading a
     * document re-applies the default, which marks the immutable path modified, and every
     * subsequent save fails validation - even one that changes nothing. Setting it at the
     * single write site keeps the field immutable without that side effect.
     */
    schema_version: { type: Number, required: true, immutable: true },

    /* --- who ------------------------------------------------------- */

    /** The authenticated AdminUser. The stable reference; never a credential. */
    actor_admin_id: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: true,
      immutable: true,
      index: true,
    },

    /**
     * The username as it stood when the action happened.
     *
     * Denormalised on purpose: an account renamed later must not silently rewrite who
     * the log says did something. `actor_admin_id` remains the identity of record.
     */
    actor_username: { type: String, required: true, trim: true, maxlength: 32, immutable: true },

    /* --- what ------------------------------------------------------ */

    action: { type: String, enum: AUDIT_ACTIONS, required: true, immutable: true, index: true },

    resource_type: {
      type: String,
      enum: AUDIT_RESOURCE_TYPES,
      required: true,
      immutable: true,
      index: true,
    },

    /** A safe internal identifier - an ObjectId string, `W01`, a configuration key. */
    resource_id: {
      type: String,
      required: true,
      trim: true,
      maxlength: MAX_RESOURCE_ID_LENGTH,
      immutable: true,
    },

    /* --- outcome --------------------------------------------------- */

    status: { type: String, enum: AUDIT_STATUSES, required: true, immutable: true },

    /**
     * A stable failure category on a failed action - `SCENARIO_INVALID`,
     * `ATTEMPT_NOT_FOUND`. Never a message, never a stack trace, never administrator
     * input echoed back.
     */
    error_code: {
      type: String,
      default: null,
      trim: true,
      maxlength: MAX_ERROR_CODE_LENGTH,
      immutable: true,
    },

    /* --- context --------------------------------------------------- */

    /**
     * Allowlisted scalars only; `auditService.append` is the sole writer and validates
     * every key and value before this is populated. Nothing here is free-form.
     */
    metadata: { type: Schema.Types.Mixed, default: () => ({}), immutable: true },

    /**
     * Optional caller-supplied key that makes a retried administrative operation record
     * once. Unique and sparse: entries without one are never compared.
     */
    idempotency_key: { type: String, default: null, immutable: true },

    /** When the action happened. Set by the server; never client-supplied. */
    occurred_at: { type: Date, required: true, default: Date.now, immutable: true, index: true },
  },
  {
    // `createdAt` would duplicate `occurred_at`, and `updatedAt` would imply an entry can
    // be updated. Neither belongs on an append-only record.
    timestamps: false,
    strict: 'throw',
    minimize: false,
  },
)

/** Newest-first listing, and the same index serves an actor or action filter with a date. */
auditEventSchema.index({ occurred_at: -1 })
auditEventSchema.index({ resource_type: 1, resource_id: 1, occurred_at: -1 })
auditEventSchema.index(
  { idempotency_key: 1 },
  { unique: true, partialFilterExpression: { idempotency_key: { $type: 'string' } } },
)

/**
 * Inserts only.
 *
 * Written without a `next` callback: Mongoose 9 middleware is promise-based and calls the
 * hook with no arguments, so a `next`-style hook throws on every save.
 */
auditEventSchema.pre('save', function appendOnly() {
  if (!this.isNew) throw new AuditImmutableError('save (update)')
})

/** Every query-level mutation path, closed. */
for (const operation of [
  'updateOne', 'updateMany', 'replaceOne',
  'findOneAndUpdate', 'findOneAndReplace', 'findOneAndDelete',
  'deleteOne', 'deleteMany',
]) {
  auditEventSchema.pre(operation, function refuse() {
    throw new AuditImmutableError(operation)
  })
}

/** The shape an audit entry is allowed to leave the server in. */
auditEventSchema.methods.toAdminJSON = function toAdminJSON() {
  return {
    audit_id: this._id.toString(),
    actor_admin_id: this.actor_admin_id.toString(),
    actor_username: this.actor_username,
    action: this.action,
    resource_type: this.resource_type,
    resource_id: this.resource_id,
    status: this.status,
    error_code: this.error_code,
    metadata: { ...(this.metadata ?? {}) },
    occurred_at: this.occurred_at,
  }
}

export const AuditEvent = mongoose.model('AuditEvent', auditEventSchema)
