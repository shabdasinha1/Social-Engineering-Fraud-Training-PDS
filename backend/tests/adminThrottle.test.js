import assert from 'node:assert/strict'
import test from 'node:test'
import { env } from '../src/config/env.js'
import {
  lockoutRemainingMs,
  recordFailure,
  recordSuccess,
  resetThrottle,
  throttleKey,
} from '../src/middleware/adminThrottle.js'

const MAX = env.adminLoginMaxAttempts
const NOW = 1_000_000

test.beforeEach(() => resetThrottle())

test('a key is not locked before the attempt limit is reached', () => {
  for (let i = 0; i < MAX - 1; i += 1) recordFailure('k', NOW + i)
  assert.equal(lockoutRemainingMs('k', NOW + MAX), 0)
})

test('the configured number of failures locks the key out', () => {
  for (let i = 0; i < MAX; i += 1) recordFailure('k', NOW + i)

  const remaining = lockoutRemainingMs('k', NOW + MAX)
  assert.ok(remaining > 0, 'expected a lockout')
  assert.ok(remaining <= env.adminLoginLockoutMs)
})

test('the lockout expires once the lockout window has passed', () => {
  for (let i = 0; i < MAX; i += 1) recordFailure('k', NOW + i)
  assert.equal(lockoutRemainingMs('k', NOW + env.adminLoginLockoutMs + 1000), 0)
})

test('a successful login clears the failures', () => {
  for (let i = 0; i < MAX - 1; i += 1) recordFailure('k', NOW + i)
  recordSuccess('k')

  for (let i = 0; i < MAX - 1; i += 1) recordFailure('k', NOW + 100 + i)
  assert.equal(lockoutRemainingMs('k', NOW + 200), 0, 'the counter should have restarted')
})

test('failures spread beyond the window do not accumulate into a lockout', () => {
  for (let i = 0; i < MAX * 2; i += 1) {
    recordFailure('k', NOW + i * (env.adminLoginWindowMs + 1))
  }
  assert.equal(lockoutRemainingMs('k', NOW + MAX * 2 * (env.adminLoginWindowMs + 1)), 0)
})

test('locking one key does not lock another', () => {
  for (let i = 0; i < MAX; i += 1) recordFailure('a', NOW + i)
  assert.ok(lockoutRemainingMs('a', NOW + MAX) > 0)
  assert.equal(lockoutRemainingMs('b', NOW + MAX), 0)
})

test('the key combines client address and username, both lowercased', () => {
  const req = { ip: '127.0.0.1' }
  assert.equal(throttleKey(req, ' Admin '), '127.0.0.1|admin')
  assert.notEqual(throttleKey(req, 'admin'), throttleKey(req, 'other'))
  assert.notEqual(throttleKey({ ip: '10.0.0.1' }, 'admin'), throttleKey(req, 'admin'))
})
