import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import { createApp } from '../src/app.js'
import { AdminUser } from '../src/models/AdminUser.js'
import { AuditEvent } from '../src/models/AuditEvent.js'
import { Candidate } from '../src/models/Candidate.js'
import { createAdminUser } from '../src/services/adminService.js'
import { append, auditTrailFor, listAuditEvents } from '../src/services/auditService.js'
import { detectTransactionSupport, withEngineTransaction } from '../src/utils/transactions.js'
import { RESET_ACTIONS } from '../src/constants/auditLog.js'

/**
 * ADMIN-005 - the audit log against a real database and a real HTTP surface.
 *
 * Two things are proven here that a unit test cannot: that an entry genuinely cannot be
 * altered or removed once written, and that the application exposes no route which
 * appends, updates or deletes one. The append-only guarantee is worth nothing if a
 * request can still forge or rewrite history.
 *
 *   npm run test:engine
 */

const URI = process.env.ENGINE_TEST_MONGO_URI
let ready = false
let skipReason = 'ENGINE_TEST_MONGO_URI is not set'
let server
let base
let admin

if (URI) {
  try {
    await mongoose.connect(URI, { serverSelectionTimeoutMS: 4000 })
    const topology = await detectTransactionSupport()
    if (!topology.supported) {
      skipReason = `configured MongoDB does not support transactions (${topology.topology ?? topology.reason})`
      await mongoose.disconnect()
    } else {
      await Promise.all([
        AuditEvent.collection.deleteMany({}),
        AdminUser.deleteMany({}),
        Candidate.deleteMany({}),
      ])
      admin = await createAdminUser({ username: 'instructor', password: 'a-long-training-password' })
      const app = createApp()
      server = app.listen(0, '127.0.0.1')
      await new Promise((r) => server.once('listening', r))
      base = `http://127.0.0.1:${server.address().port}/api`
      ready = true
    }
  } catch (error) {
    skipReason = `could not start: ${error.message.split('\n')[0]}`
  }
}

if (!ready) {
  // eslint-disable-next-line no-console
  console.warn(`\n[ADMIN-005] audit log tests SKIPPED - ${skipReason}\n`)
}

const it = (name, fn) => test(name, { skip: ready ? false : skipReason }, fn)

/* ------------------------------------------------------------------ *
 * helpers
 * ------------------------------------------------------------------ */

async function call(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  return { status: res.status, data, cookie: res.headers.getSetCookie?.()[0]?.split(';')[0] }
}

async function adminCookie() {
  const res = await call('/admin/login', {
    method: 'POST',
    body: { username: 'instructor', password: 'a-long-training-password' },
  })
  assert.equal(res.status, 200, `admin login failed: ${JSON.stringify(res.data)}`)
  return res.cookie
}

let learnerSeq = 0
async function candidateCookie() {
  const res = await call('/candidates', {
    method: 'POST',
    body: { name: 'Audit Learner', identifier: `AL${String(700000 + (learnerSeq += 1))}` },
  })
  assert.equal(res.status, 201)
  return res.cookie
}

const entry = (over = {}) => ({
  actor: admin,
  action: 'SCENARIO_PUBLISHED',
  resourceType: 'scenario_definition',
  resourceId: 'W01',
  ...over,
})

/**
 * Clears the throwaway audit collection.
 *
 * Deliberately through the raw driver, not the model: `AuditEvent.deleteMany()` is
 * refused by the append-only guard, which is the whole point of it. The guard protects
 * the APPLICATION layer, and this fixture is explicitly outside it - the same boundary
 * the documentation states, exercised here rather than asserted on paper.
 */
async function reset() {
  await AuditEvent.collection.deleteMany({})
}

test.after(async () => {
  if (ready) {
    server?.close()
    await Promise.all([
      AuditEvent.collection.deleteMany({}),
      AdminUser.deleteMany({}),
      Candidate.deleteMany({}),
    ])
    await mongoose.disconnect()
  }
})

/* ------------------------------------------------------------------ *
 * 1-4  appending
 * ------------------------------------------------------------------ */

it('an authenticated administrator action is recorded with who, what, when and how it ended', async () => {
  await reset()
  const before = Date.now()
  const record = await append(entry({
    metadata: { scenario_id: 'W01', scenario_version: 2, scenario_platform: 'whatsapp' },
  }))

  assert.equal(String(record.actor_admin_id), String(admin._id))
  assert.equal(record.actor_username, 'instructor')
  assert.equal(record.action, 'SCENARIO_PUBLISHED')
  assert.equal(record.resource_type, 'scenario_definition')
  assert.equal(record.resource_id, 'W01')
  assert.equal(record.status, 'succeeded')
  assert.equal(record.error_code, null)
  assert.deepEqual({ ...record.metadata }, {
    scenario_id: 'W01', scenario_version: 2, scenario_platform: 'whatsapp',
  })
  assert.ok(record.occurred_at.getTime() >= before)

  assert.equal(await AuditEvent.countDocuments(), 1)
})

it('a failed administrative action is recorded with a category, never a stack trace', async () => {
  await reset()
  const record = await append(entry({
    status: 'failed',
    errorCode: 'SCENARIO_VALIDATION_FAILED',
    metadata: { scenario_id: 'W01' },
  }))

  assert.equal(record.status, 'failed')
  assert.equal(record.error_code, 'SCENARIO_VALIDATION_FAILED')
  const serialised = JSON.stringify(record.toAdminJSON())
  assert.ok(!/\bat\s+\w+\s+\(/.test(serialised), 'the entry carries a stack frame')
  assert.ok(!serialised.includes('.js:'), 'the entry carries a source location')
})

/** An error code belongs to a failure. A success carrying one would be misleading. */
it('a successful action never carries an error code', async () => {
  await reset()
  const record = await append(entry({ status: 'succeeded', errorCode: 'SOMETHING' }))
  assert.equal(record.error_code, null)
})

it('a repeated operation carrying the same idempotency key records once', async () => {
  await reset()
  const key = 'publish-W01-v2'
  const first = await append(entry({ idempotencyKey: key }))
  const second = await append(entry({ idempotencyKey: key }))

  assert.equal(String(first._id), String(second._id), 'a second entry was created')
  assert.equal(await AuditEvent.countDocuments(), 1)

  // Without a key, two identical actions are two facts and both are recorded.
  await append(entry())
  await append(entry())
  assert.equal(await AuditEvent.countDocuments(), 3)
})

/**
 * Both names for the section 6 reset capability persist, are stored VERBATIM - neither is
 * rewritten into the other - and both come back under a resource-type filter of
 * `attempt`, so a reader querying the capability finds them together.
 */
it('a reset records under either action name, stored exactly as written', async () => {
  await reset()
  const attemptId = '6a9c74a6c3436d8858f4d321'

  for (const action of RESET_ACTIONS) {
    const record = await append(entry({
      action,
      resourceType: 'attempt',
      resourceId: attemptId,
      metadata: { attempt_id: attemptId, attempt_status: 'in_progress' },
    }))
    assert.equal(record.action, action, 'the action was rewritten')
    assert.equal(record.resource_type, 'attempt')
  }

  const stored = await AuditEvent.find({ resource_id: attemptId }).sort({ action: 1 })
  assert.deepEqual(stored.map((e) => e.action), ['ATTEMPT_RESET', 'SCENARIO_RESET'])

  const trail = await auditTrailFor('attempt', attemptId)
  assert.equal(trail.length, 2)
})

it('the read route finds a reset under whichever name it was recorded', async () => {
  await reset()
  const attemptId = '6a9c74a6c3436d8858f4d322'
  for (const action of RESET_ACTIONS) {
    await append(entry({ action, resourceType: 'attempt', resourceId: attemptId }))
  }
  const cookie = await adminCookie()

  for (const action of RESET_ACTIONS) {
    const res = await call(`/admin/audit?action=${action}`, { cookie })
    assert.equal(res.status, 200)
    assert.equal(res.data.total, 1, `filtering by ${action} found ${res.data.total}`)
    assert.equal(res.data.entries[0].action, action)
  }

  // And the whole capability, by resource type.
  const all = await call('/admin/audit?resource_type=attempt', { cookie })
  assert.equal(all.data.total, 2)
})

/* ------------------------------------------------------------------ *
 * 5-8  append-only, against a real database
 * ------------------------------------------------------------------ */

it('an existing entry cannot be updated through the application', async () => {
  await reset()
  const record = await append(entry({ metadata: { scenario_id: 'W01' } }))

  for (const attempt of [
    () => AuditEvent.updateOne({ _id: record._id }, { $set: { status: 'failed' } }),
    () => AuditEvent.updateMany({}, { $set: { action: 'CONFIG_CHANGED' } }),
    () => AuditEvent.replaceOne({ _id: record._id }, { action: 'CONFIG_CHANGED' }),
    () => AuditEvent.findOneAndUpdate({ _id: record._id }, { $set: { status: 'failed' } }),
    () => AuditEvent.findOneAndReplace({ _id: record._id }, { action: 'CONFIG_CHANGED' }),
  ]) {
    await assert.rejects(attempt, (error) => error.code === 'AUDIT_IMMUTABLE')
  }

  const fresh = await AuditEvent.findById(record._id)
  assert.equal(fresh.status, 'succeeded')
  assert.equal(fresh.action, 'SCENARIO_PUBLISHED')
})

it('an existing entry cannot be deleted through the application', async () => {
  await reset()
  const record = await append(entry())

  for (const attempt of [
    () => AuditEvent.deleteOne({ _id: record._id }),
    () => AuditEvent.deleteMany({}),
    () => AuditEvent.findOneAndDelete({ _id: record._id }),
  ]) {
    await assert.rejects(attempt, (error) => error.code === 'AUDIT_IMMUTABLE')
  }

  assert.equal(await AuditEvent.countDocuments(), 1)
})

/**
 * The stated limit of the guarantee, exercised rather than only documented: the guard
 * lives in the application layer, so direct driver access still reaches the collection.
 * On a local single-machine deployment that is the honest boundary - and it is why the
 * fixtures above must clear the collection through the driver.
 */
it('the append-only guarantee is an application-layer guarantee', async () => {
  await reset()
  await append(entry())
  assert.equal(await AuditEvent.countDocuments(), 1)

  await AuditEvent.collection.deleteMany({})
  assert.equal(await AuditEvent.countDocuments(), 0)
})

/**
 * Re-saving a loaded document is the accidental path, and it is closed too - by whichever
 * of the two guards reaches it first.
 *
 * In practice Mongoose's own `immutable` check fires before `pre('save')`, raising a
 * ValidationError that names the paths it refused. Both layers exist on purpose, so this
 * asserts the OUTCOME - the save is refused and the stored entry is unchanged - rather
 * than pinning which layer happened to answer.
 */
it('a loaded entry cannot be edited and saved back', async () => {
  await reset()
  const record = await append(entry())

  const loaded = await AuditEvent.findById(record._id)
  loaded.status = 'failed'

  await assert.rejects(
    () => loaded.save(),
    (error) => {
      const refusedByMongoose = error.name === 'ValidationError' && /immutable/i.test(error.message)
      const refusedByHook = error.code === 'AUDIT_IMMUTABLE'
      assert.ok(refusedByMongoose || refusedByHook, `unexpected error: ${error.message}`)
      return true
    },
  )

  const fresh = await AuditEvent.findById(record._id)
  assert.equal(fresh.status, 'succeeded')
})

/**
 * The second layer, reached on its own.
 *
 * `pre('save')` refuses ANY save of a document that is not new - modified or not - so a
 * reconstruct-and-write never lands, whatever the caller changed. The document below is
 * complete and valid; only the append-only hook stands between it and the collection.
 */
it('the append-only hook refuses any write to an existing entry', async () => {
  await reset()
  const record = await append(entry())

  const rebuilt = new AuditEvent({
    _id: record._id,
    schema_version: record.schema_version,
    actor_admin_id: record.actor_admin_id,
    actor_username: record.actor_username,
    action: 'CONFIG_CHANGED',
    resource_type: 'configuration',
    resource_id: 'feedback_timing',
    status: 'failed',
    occurred_at: record.occurred_at,
  })
  rebuilt.isNew = false

  await assert.rejects(() => rebuilt.save(), (error) => error.code === 'AUDIT_IMMUTABLE')

  const fresh = await AuditEvent.findById(record._id)
  assert.equal(fresh.action, 'SCENARIO_PUBLISHED')
  assert.equal(fresh.status, 'succeeded')
})

/** Even a save that changes nothing: the hook does not ask what was modified. */
it('re-saving a loaded entry unchanged is still refused', async () => {
  await reset()
  const record = await append(entry())

  const loaded = await AuditEvent.findById(record._id)
  await assert.rejects(() => loaded.save(), (error) => error.code === 'AUDIT_IMMUTABLE')

  assert.equal(await AuditEvent.countDocuments(), 1)
  const fresh = await AuditEvent.findById(record._id)
  assert.equal(fresh.occurred_at.getTime(), record.occurred_at.getTime())
})

it('immutable fields ignore a change even when a save is attempted', async () => {
  await reset()
  const record = await append(entry())
  const loaded = await AuditEvent.findById(record._id)

  loaded.set({ action: 'CONFIG_CHANGED', resource_id: 'TAMPERED' })
  // Mongoose drops the change to an immutable path before the hook even runs.
  assert.equal(loaded.action, 'SCENARIO_PUBLISHED')
  assert.equal(loaded.resource_id, 'W01')
})

/* ------------------------------------------------------------------ *
 * 9-11  transactions
 * ------------------------------------------------------------------ */

it('an entry commits with the transaction that produced it', async () => {
  await reset()
  await withEngineTransaction(async (session) => {
    await append(entry({ resourceId: 'W05', session }))
  })

  const trail = await auditTrailFor('scenario_definition', 'W05')
  assert.equal(trail.length, 1)
})

/**
 * The whole point of taking a session: if the administrative change rolls back, the
 * record of it must roll back too, or the log would claim something that never happened.
 */
it('an entry rolls back when its transaction aborts', async () => {
  await reset()
  await assert.rejects(
    () => withEngineTransaction(async (session) => {
      await append(entry({ resourceId: 'W06', session }))
      const failure = new Error('the administrative change failed')
      failure.isDomainError = true
      throw failure
    }),
    /the administrative change failed/,
  )

  assert.equal(await AuditEvent.countDocuments({ resource_id: 'W06' }), 0)
})

it('appending opens no transaction of its own', async () => {
  await reset()
  // Outside any session this simply inserts; inside one it joins the caller's.
  const record = await append(entry({ resourceId: 'W07' }))
  assert.ok(record._id)
  assert.equal(await AuditEvent.countDocuments({ resource_id: 'W07' }), 1)
})

/* ------------------------------------------------------------------ *
 * 12-17  the HTTP surface
 * ------------------------------------------------------------------ */

it('an administrator can read the audit log', async () => {
  await reset()
  await append(entry({ resourceId: 'W01' }))
  await append(entry({ action: 'EXPORT_CREATED', resourceType: 'export', resourceId: 'exp-1' }))

  const cookie = await adminCookie()
  const res = await call('/admin/audit', { cookie })

  assert.equal(res.status, 200)
  assert.equal(res.data.total, 2)
  assert.equal(res.data.entries.length, 2)
  // Newest first.
  assert.equal(res.data.entries[0].action, 'EXPORT_CREATED')
})

it('an unauthenticated request cannot read the audit log', async () => {
  const res = await call('/admin/audit')
  assert.equal(res.status, 401)
  assert.equal(res.data.error.code, 'NO_ADMIN_SESSION')
})

it('a candidate session cannot read the audit log', async () => {
  const cookie = await candidateCookie()
  const res = await call('/admin/audit', { cookie })

  // Rejected, never downgraded to a learner view.
  assert.equal(res.status, 401)
  assert.equal(res.data.error.code, 'NO_ADMIN_SESSION')
})

/**
 * The forgery boundary. An audit entry is a side effect of an administrative change,
 * written inside that change's own transaction - never something a client can request.
 * No verb on the audit namespace may write, for anyone.
 */
it('no HTTP route appends, updates or deletes an audit entry - for anyone', async () => {
  await reset()
  const record = await append(entry())
  const admins = await adminCookie()
  const learner = await candidateCookie()

  const forged = {
    actor_admin_id: String(admin._id),
    action: 'CONFIG_CHANGED',
    resource_type: 'configuration',
    resource_id: 'feedback_timing',
    status: 'succeeded',
  }

  for (const cookie of [admins, learner, undefined]) {
    for (const [method, path] of [
      ['POST', '/admin/audit'],
      ['PUT', `/admin/audit/${record._id}`],
      ['PATCH', `/admin/audit/${record._id}`],
      ['DELETE', `/admin/audit/${record._id}`],
      ['POST', `/admin/audit/${record._id}`],
    ]) {
      const res = await call(path, { method, cookie, body: forged })
      assert.ok(
        res.status === 404 || res.status === 401,
        `${method} ${path} answered ${res.status}; no write route may exist`,
      )
    }
  }

  // Nothing was created, and the original is untouched.
  assert.equal(await AuditEvent.countDocuments(), 1)
  const fresh = await AuditEvent.findById(record._id)
  assert.equal(fresh.action, 'SCENARIO_PUBLISHED')
})

it('the read route paginates', async () => {
  await reset()
  for (let i = 0; i < 12; i += 1) {
    await append(entry({ resourceId: `W${String(i + 1).padStart(2, '0')}` }))
  }
  const cookie = await adminCookie()

  const first = await call('/admin/audit?page=1&page_size=5', { cookie })
  assert.equal(first.data.entries.length, 5)
  assert.equal(first.data.total, 12)
  assert.equal(first.data.total_pages, 3)

  const last = await call('/admin/audit?page=3&page_size=5', { cookie })
  assert.equal(last.data.entries.length, 2)

  // The page size is capped, so a huge request cannot pull the whole collection.
  const huge = await call('/admin/audit?page_size=100000', { cookie })
  assert.ok(huge.data.page_size <= 200)
})

it('the read route filters by action, resource and actor', async () => {
  await reset()
  await append(entry({ resourceId: 'W01' }))
  await append(entry({ action: 'EXPORT_CREATED', resourceType: 'export', resourceId: 'exp-9' }))
  await append(entry({
    action: 'CONFIG_CHANGED', resourceType: 'configuration', resourceId: 'feedback_timing',
  }))
  const cookie = await adminCookie()

  const exports = await call('/admin/audit?action=EXPORT_CREATED', { cookie })
  assert.equal(exports.data.total, 1)
  assert.equal(exports.data.entries[0].resource_id, 'exp-9')

  const config = await call('/admin/audit?resource_type=configuration', { cookie })
  assert.equal(config.data.total, 1)

  const byResource = await call('/admin/audit?resource_id=W01', { cookie })
  assert.equal(byResource.data.total, 1)

  const byActor = await call(`/admin/audit?actor_admin_id=${admin._id}`, { cookie })
  assert.equal(byActor.data.total, 3)

  // An unknown filter value matches nothing rather than erroring on a browse.
  const nonsense = await call('/admin/audit?action=NOT_AN_ACTION', { cookie })
  assert.equal(nonsense.data.total, 0)
})

/* ------------------------------------------------------------------ *
 * 18-20  what the log must never contain
 * ------------------------------------------------------------------ */

it('the read payload carries no credential, session or learner content', async () => {
  await reset()
  await append(entry({ metadata: { scenario_id: 'W01', scenario_version: 1 } }))
  const cookie = await adminCookie()

  const res = await call('/admin/audit', { cookie })
  const text = JSON.stringify(res.data)

  for (const forbidden of ['passwordHash', 'password', 'usernameNormalised', 'admin_session',
    'rationale', 'learner_flow', 'expected_safe_behavior', 'evaluation', 'seed']) {
    assert.ok(!text.includes(forbidden), `the audit payload exposed "${forbidden}"`)
  }

  const shown = res.data.entries[0]
  assert.deepEqual(Object.keys(shown).sort(), [
    'action', 'actor_admin_id', 'actor_username', 'audit_id', 'error_code',
    'metadata', 'occurred_at', 'resource_id', 'resource_type', 'status',
  ])
})

it('the stored document itself carries no administrator credential', async () => {
  await reset()
  await append(entry())
  const raw = await AuditEvent.findOne({}).lean()

  const text = JSON.stringify(raw)
  assert.ok(!text.includes('$argon2'), 'a password hash reached the audit log')
  assert.ok(!Object.keys(raw).some((key) => /password|hash|token|cookie/i.test(key)))
})

it('a service-level listing applies the same page cap as the route', async () => {
  await reset()
  await append(entry())
  const page = await listAuditEvents({ pageSize: 100000 })
  assert.ok(page.page_size <= 200)
  assert.equal(page.entries.length, 1)
  assert.equal(page.page, 1)
})
