import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import { AuditEvent, AuditImmutableError } from '../src/models/AuditEvent.js'
import { append, sanitiseAuditMetadata } from '../src/services/auditService.js'
import {
  ACTION_RESOURCE_TYPES,
  AUDIT_ACTIONS,
  AUDIT_METADATA_ALLOWLIST,
  AUDIT_RESOURCE_TYPES,
  FORBIDDEN_METADATA_FRAGMENTS,
  PREFERRED_RESET_ACTION,
  RESET_ACTIONS,
  looksSensitive,
} from '../src/constants/auditLog.js'

/**
 * ADMIN-005 - the audit rules, with no database.
 *
 * Every rejection path in `append()` runs before the insert, so the validation contract
 * and the append-only guards are testable without a server or a replica set. The
 * persistence, the ownership boundary and the HTTP surface are proven in
 * `auditLogApi.test.js`.
 */

const ADMIN = { _id: new mongoose.Types.ObjectId(), username: 'instructor' }

const valid = (over = {}) => ({
  actor: ADMIN,
  action: 'SCENARIO_PUBLISHED',
  resourceType: 'scenario_definition',
  resourceId: 'W01',
  ...over,
})

/** Every rejection happens before any database call, so this never opens a connection. */
async function rejects(input, code) {
  await assert.rejects(
    () => append(input),
    (error) => {
      assert.equal(error.code, code, `expected ${code}, got ${error.code}`)
      assert.equal(error.isDomainError, true)
      return true
    },
  )
}

/* ------------------------------------------------------------------ *
 * 1-5  the actor
 * ------------------------------------------------------------------ */

test('an entry without an authenticated administrator is refused', async () => {
  await rejects(valid({ actor: undefined }), 'INVALID_AUDIT_ACTOR')
  await rejects(valid({ actor: null }), 'INVALID_AUDIT_ACTOR')
  await rejects(valid({ actor: {} }), 'INVALID_AUDIT_ACTOR')
})

/**
 * The actor is the resolved AdminUser document, which only `requireAdmin` can produce.
 * An id or a name on its own is not an identity, and passing one must not work.
 */
test('an actor cannot be conjured from an id or a name', async () => {
  await rejects(valid({ actor: String(ADMIN._id) }), 'INVALID_AUDIT_ACTOR')
  await rejects(valid({ actor: { username: 'instructor' } }), 'INVALID_AUDIT_ACTOR')
  await rejects(valid({ actor: { _id: ADMIN._id } }), 'INVALID_AUDIT_ACTOR')
})

/* ------------------------------------------------------------------ *
 * 6-10  action and resource vocabulary
 * ------------------------------------------------------------------ */

test('an unrecognised action is refused', async () => {
  for (const action of ['SCENARIO_DELETED', 'LOGIN', 'scenario_published', '', null]) {
    await rejects(valid({ action }), 'INVALID_AUDIT_ACTION')
  }
})

test('an unrecognised resource type is refused', async () => {
  await rejects(valid({ resourceType: 'candidate' }), 'INVALID_AUDIT_RESOURCE')
  await rejects(valid({ resourceType: 'scenario_event' }), 'INVALID_AUDIT_RESOURCE')
})

test('an action cannot name a resource type it has no business naming', async () => {
  await rejects(
    valid({ action: 'EXPORT_CREATED', resourceType: 'scenario_definition' }),
    'INVALID_AUDIT_RESOURCE',
  )
  await rejects(
    valid({ action: 'ATTEMPT_RESET', resourceType: 'configuration' }),
    'INVALID_AUDIT_RESOURCE',
  )
})

test('every action declares which resource types it may name', () => {
  for (const action of AUDIT_ACTIONS) {
    const allowed = ACTION_RESOURCE_TYPES[action]
    assert.ok(Array.isArray(allowed) && allowed.length > 0, `${action} declares no resource type`)
    for (const type of allowed) {
      assert.ok(AUDIT_RESOURCE_TYPES.includes(type), `${action} names unknown type ${type}`)
    }
  }
})

/* ------------------------------------------------------------------ *
 * the reset capability, under both of its names
 * ------------------------------------------------------------------ */

/**
 * Section 6 requires the reset action in the client's vocabulary; the capability it
 * describes is "Reset an incomplete attempt". Both names are therefore valid, and both
 * name an attempt - a reset that claimed to affect a scenario definition would make the
 * log say something untrue.
 */
test('both reset action names are accepted and both name an attempt', () => {
  for (const action of RESET_ACTIONS) {
    assert.ok(AUDIT_ACTIONS.includes(action), `${action} is not in the vocabulary`)
    assert.deepEqual(ACTION_RESOURCE_TYPES[action], ['attempt'],
      `${action} does not map to the attempt resource`)
  }
  assert.deepEqual(RESET_ACTIONS, ['SCENARIO_RESET', 'ATTEMPT_RESET'])
  assert.ok(RESET_ACTIONS.includes(PREFERRED_RESET_ACTION))
})

test('neither reset name may be recorded against a scenario definition', async () => {
  for (const action of RESET_ACTIONS) {
    await rejects(
      valid({ action, resourceType: 'scenario_definition', resourceId: 'W01' }),
      'INVALID_AUDIT_RESOURCE',
    )
    await rejects(
      valid({ action, resourceType: 'configuration', resourceId: 'feedback_timing' }),
      'INVALID_AUDIT_RESOURCE',
    )
  }
})

/** The client's four required action names are all present, spelled exactly. */
test('the specification action vocabulary is satisfied exactly', () => {
  for (const required of ['SCENARIO_PUBLISHED', 'SCENARIO_RESET', 'EXPORT_CREATED', 'CONFIG_CHANGED']) {
    assert.ok(AUDIT_ACTIONS.includes(required), `the vocabulary is missing ${required}`)
  }
})

test('an entry must name the resource it affected', async () => {
  await rejects(valid({ resourceId: '' }), 'INVALID_AUDIT_RESOURCE')
  await rejects(valid({ resourceId: '   ' }), 'INVALID_AUDIT_RESOURCE')
  await rejects(valid({ resourceId: undefined }), 'INVALID_AUDIT_RESOURCE')
  // An identifier, never a payload.
  await rejects(valid({ resourceId: 'x'.repeat(129) }), 'INVALID_AUDIT_RESOURCE')
})

test('an unrecognised status is refused', async () => {
  await rejects(valid({ status: 'partial' }), 'INVALID_AUDIT_STATUS')
  await rejects(valid({ status: 'ok' }), 'INVALID_AUDIT_STATUS')
})

/* ------------------------------------------------------------------ *
 * 11-18  the metadata allowlist
 * ------------------------------------------------------------------ */

test('allowlisted metadata passes through unchanged', () => {
  const clean = sanitiseAuditMetadata({
    scenario_id: 'W01',
    scenario_version: 1,
    export_format: 'csv',
    config_key: 'feedback_timing',
  })
  assert.deepEqual(clean, {
    scenario_id: 'W01',
    scenario_version: 1,
    export_format: 'csv',
    config_key: 'feedback_timing',
  })
})

test('a key outside the allowlist is refused, and named back to the caller', () => {
  assert.throws(
    () => sanitiseAuditMetadata({ scenario_id: 'W01', note: 'anything' }),
    (error) => {
      assert.equal(error.code, 'INVALID_AUDIT_METADATA')
      assert.deepEqual(error.details.rejected_keys, ['note'])
      return true
    },
  )
})

/** The value might be the sensitive part, so a rejection never echoes it. */
test('a rejection names the key but never the value', () => {
  const secret = 'hunter2-do-not-log-this'
  try {
    sanitiseAuditMetadata({ password: secret })
    assert.fail('expected a rejection')
  } catch (error) {
    const serialised = JSON.stringify({ message: error.message, details: error.details })
    assert.ok(!serialised.includes(secret), 'the rejection echoed the value back')
  }
})

test('nothing that looks like a credential can be stored, whatever it is called', () => {
  for (const fragment of FORBIDDEN_METADATA_FRAGMENTS) {
    assert.throws(
      () => sanitiseAuditMetadata({ [fragment]: 'value' }),
      (error) => error.code === 'INVALID_AUDIT_METADATA',
      `"${fragment}" was accepted as a metadata key`,
    )
  }
})

test('the allowlist itself contains no key that looks like a secret', () => {
  for (const key of AUDIT_METADATA_ALLOWLIST) {
    assert.ok(!looksSensitive(key), `the allowlist key "${key}" trips the sensitivity guard`)
  }
})

/**
 * The guard matches WORDS, not letters. A raw substring check rejected
 * `scenarios_discarded` because "discarded" contains "card".
 */
test('the sensitivity guard matches whole words, not incidental substrings', () => {
  for (const safe of ['scenarios_discarded', 'export_scope', 'config_key', 'attempt_status',
    'previously_active_version', 'reason_code', 'scenario_platform']) {
    assert.equal(looksSensitive(safe), false, `"${safe}" was wrongly flagged`)
  }
  for (const unsafe of ['password', 'passwordHash', 'card_number', 'account_number',
    'session_cookie', 'otp', 'learner_rationale', 'raw_message', 'api_token']) {
    assert.equal(looksSensitive(unsafe), true, `"${unsafe}" slipped through`)
  }
})

/** A whole request body is exactly the thing an audit log must never swallow. */
test('a raw request body cannot be stored as metadata', async () => {
  const body = {
    username: 'instructor',
    password: 'correct-horse-battery-staple',
    scenario: { scenario_id: 'W01', stages: [{ learner_flow: 'secret answer' }] },
  }
  await rejects(valid({ metadata: body }), 'INVALID_AUDIT_METADATA')
})

test('metadata values must be scalars, not documents or arrays', () => {
  assert.throws(() => sanitiseAuditMetadata({ scenario_id: { nested: true } }),
    (error) => error.code === 'INVALID_AUDIT_METADATA')
  assert.throws(() => sanitiseAuditMetadata({ scenario_id: ['W01', 'W02'] }),
    (error) => error.code === 'INVALID_AUDIT_METADATA')
})

test('an over-long metadata value is refused rather than truncated', () => {
  assert.throws(
    () => sanitiseAuditMetadata({ config_new_value: 'x'.repeat(201) }),
    (error) => error.code === 'INVALID_AUDIT_METADATA',
  )
})

test('metadata is optional, and absent metadata becomes an empty object', () => {
  assert.deepEqual(sanitiseAuditMetadata(undefined), {})
  assert.deepEqual(sanitiseAuditMetadata(null), {})
  assert.deepEqual(sanitiseAuditMetadata({}), {})
})

test('metadata must be an object', () => {
  for (const bad of ['string', 42, true, ['a']]) {
    assert.throws(() => sanitiseAuditMetadata(bad),
      (error) => error.code === 'INVALID_AUDIT_METADATA')
  }
})

/* ------------------------------------------------------------------ *
 * 19-22  append-only, at the model
 * ------------------------------------------------------------------ */

test('the service exposes no way to change or remove an entry', async () => {
  const auditService = await import('../src/services/auditService.js')
  const writers = Object.keys(auditService).filter((name) => /update|delete|remove|edit|patch/i.test(name))
  assert.deepEqual(writers, [], `the audit service exposes ${writers.join(', ')}`)
  assert.equal(typeof auditService.append, 'function')
})

test('saving an existing entry again is refused', () => {
  const entry = new AuditEvent({
    actor_admin_id: ADMIN._id,
    actor_username: 'instructor',
    action: 'SCENARIO_PUBLISHED',
    resource_type: 'scenario_definition',
    resource_id: 'W01',
    status: 'succeeded',
  })
  // Pretend it came back from the database rather than being newly constructed.
  entry.isNew = false
  entry.status = 'failed'

  assert.throws(() => entry.$__schema.s.hooks.execPreSync('save', entry), () => true)
  assert.throws(
    () => { throw new AuditImmutableError('save (update)') },
    (error) => error.code === 'AUDIT_IMMUTABLE' && error.status === 409,
  )
})

test('identifying fields are declared immutable on the schema', () => {
  for (const field of ['actor_admin_id', 'actor_username', 'action', 'resource_type',
    'resource_id', 'status', 'error_code', 'metadata', 'occurred_at']) {
    assert.equal(
      AuditEvent.schema.path(field).options.immutable, true,
      `${field} is not immutable`,
    )
  }
})

test('the model carries no updatedAt, which would imply an entry can change', () => {
  assert.equal(AuditEvent.schema.path('updatedAt'), undefined)
  assert.equal(AuditEvent.schema.path('createdAt'), undefined)
  assert.ok(AuditEvent.schema.path('occurred_at'), 'occurred_at is the one timestamp')
})

test('the schema refuses unknown fields rather than silently dropping them', () => {
  assert.equal(AuditEvent.schema.options.strict, 'throw')
})
