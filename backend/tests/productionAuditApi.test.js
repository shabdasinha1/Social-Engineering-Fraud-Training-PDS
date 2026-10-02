import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import { sign } from 'cookie-signature'
import { env } from '../src/config/env.js'
import { createApp } from '../src/app.js'
import { resetThrottle } from '../src/middleware/adminThrottle.js'
import { AdminUser } from '../src/models/AdminUser.js'
import { Candidate } from '../src/models/Candidate.js'
import { ScenarioDefinition } from '../src/models/ScenarioDefinition.js'
import { createAdminUser } from '../src/services/adminService.js'
import { detectTransactionSupport } from '../src/utils/transactions.js'

/**
 * Production audit, 30 Sep 2026 - regressions for the three request shapes that reached
 * the generic 500 handler during the live attack run:
 *
 *   1. POST /api/admin/login with a non-string username (unauthenticated) - TypeError.
 *   2. A validly signed learner cookie whose value is not an ObjectId - CastError.
 *   3. /api/admin/scenarios/:id/versions/<not a number> - CastError on NaN.
 *
 *   npm run test:engine
 */

const URI = process.env.ENGINE_TEST_MONGO_URI
let ready = false
let skipReason = 'ENGINE_TEST_MONGO_URI is not set'
let server
let base

if (URI) {
  try {
    await mongoose.connect(URI, { serverSelectionTimeoutMS: 4000 })
    const topology = await detectTransactionSupport()
    if (!topology.supported) {
      skipReason = `configured MongoDB does not support transactions (${topology.topology ?? topology.reason})`
      await mongoose.disconnect()
    } else {
      await Promise.all([AdminUser.deleteMany({}), Candidate.deleteMany({}), ScenarioDefinition.deleteMany({})])
      await createAdminUser({ username: 'instructor', password: 'a-long-training-password' })
      server = createApp().listen(0, '127.0.0.1')
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
  console.warn(`\n[AUDIT] production audit regression tests SKIPPED - ${skipReason}\n`)
}

const it = (name, fn) => test(name, { skip: ready ? false : skipReason }, fn)

test.after(async () => {
  if (server) await new Promise((r) => server.close(r))
  if (ready) await mongoose.disconnect()
})

test.beforeEach(() => resetThrottle())

async function call(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  return { status: res.status, data, setCookie: res.headers.getSetCookie?.() ?? [] }
}

it('admin login with operator objects is a plain 401, never a 500 and never a session', async () => {
  for (const body of [
    { username: { $ne: null }, password: { $ne: null } },
    { username: ['instructor'], password: 'a-long-training-password' },
    { username: 12345, password: 'x' },
    { username: { $gt: '' }, password: 'a-long-training-password' },
  ]) {
    const res = await call('/admin/login', { method: 'POST', body })
    assert.equal(res.status, 401, JSON.stringify(body))
    assert.equal(res.data.error.code, 'INVALID_ADMIN_CREDENTIALS')
    assert.equal(res.setCookie.some((c) => c.startsWith('admin_session=')), false)
  }
})

it('a non-string username still counts toward the login throttle', async () => {
  const statuses = []
  for (let i = 0; i < env.adminLoginMaxAttempts + 1; i += 1) {
    statuses.push((await call('/admin/login', { method: 'POST', body: { username: { $ne: null }, password: 'x' } })).status)
  }
  assert.equal(statuses.at(-1), 429, statuses.join(','))
})

it('a validly signed learner cookie carrying a non-ObjectId value is a 401, not a 500', async () => {
  for (const value of ['not-an-object-id', '{"$ne":null}', '', 'x'.repeat(200)]) {
    const cookie = `candidate_session=${encodeURIComponent(`s:${sign(value, env.sessionSecret)}`)}`
    const res = await call('/attempts/current', { cookie })
    assert.equal(res.status, 401, `value ${JSON.stringify(value)} -> ${res.status}`)
  }
})

it('a non-numeric or non-positive scenario version is a 404 on every version route', async () => {
  const login = await call('/admin/login', {
    method: 'POST', body: { username: 'instructor', password: 'a-long-training-password' },
  })
  const cookie = login.setCookie.find((c) => c.startsWith('admin_session=')).split(';')[0]
  for (const version of ['abc', '0', '-1', '1.5', '1e400', 'NaN']) {
    const get = await call(`/admin/scenarios/W01/versions/${version}`, { cookie })
    assert.equal(get.status, 404, `GET version ${version} -> ${get.status}`)
    assert.equal(get.data.error.code, 'SCENARIO_NOT_FOUND')
    for (const action of ['clone', 'publish', 'deactivate']) {
      const post = await call(`/admin/scenarios/W01/versions/${version}/${action}`, { method: 'POST', body: {}, cookie })
      assert.ok(post.status < 500, `${action} version ${version} -> ${post.status}`)
    }
    const patch = await call(`/admin/scenarios/W01/versions/${version}`, { method: 'PATCH', body: {}, cookie })
    assert.ok(patch.status < 500, `PATCH version ${version} -> ${patch.status}`)
  }
})
