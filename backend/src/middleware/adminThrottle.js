import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'

/**
 * Failed-login throttling for the admin password endpoint.
 *
 * In-memory and process-local on purpose. The product is a single-process
 * server on one standalone offline machine, so a shared store would add a
 * dependency and an operational surface for no security gain. Restarting the
 * server clears the counters - acceptable here, because an attacker who can
 * restart the server already has the machine.
 *
 * Candidate login is untouched: it has no password, so there is nothing to
 * brute-force. See PROJECT_MASTER_PLAN.md open point 26.
 */

/** key -> { failures, windowStartedAt, lockedUntil } */
const attempts = new Map()

/** Keyed by username and client address together, so one does not mask the other. */
export function throttleKey(req, username = '') {
  const address = req.ip || req.socket?.remoteAddress || 'unknown'
  return `${address}|${String(username).trim().toLowerCase()}`
}

function prune(now) {
  for (const [key, entry] of attempts) {
    const expired = Math.max(entry.lockedUntil, entry.windowStartedAt + env.adminLoginWindowMs)
    if (expired <= now) attempts.delete(key)
  }
}

/** Milliseconds remaining on a lockout, or 0 when the key is free to try. */
export function lockoutRemainingMs(key, now = Date.now()) {
  const entry = attempts.get(key)
  if (!entry) return 0
  return entry.lockedUntil > now ? entry.lockedUntil - now : 0
}

export function recordFailure(key, now = Date.now()) {
  const entry = attempts.get(key)

  if (!entry || now - entry.windowStartedAt > env.adminLoginWindowMs) {
    attempts.set(key, { failures: 1, windowStartedAt: now, lockedUntil: 0 })
    return
  }

  entry.failures += 1
  if (entry.failures >= env.adminLoginMaxAttempts) {
    entry.lockedUntil = now + env.adminLoginLockoutMs
    entry.failures = 0
    entry.windowStartedAt = now
  }
}

/** A successful login clears the record for that key. */
export function recordSuccess(key) {
  attempts.delete(key)
}

/** Test hook. Not used by the running server. */
export function resetThrottle() {
  attempts.clear()
}

/**
 * Rejects with 429 while a key is locked out. Mounted only on the admin login
 * route - it never sees candidate traffic.
 */
export function adminLoginThrottle(req, _res, next) {
  const now = Date.now()
  prune(now)

  const key = throttleKey(req, req.body?.username)
  const remaining = lockoutRemainingMs(key, now)

  if (remaining > 0) {
    const seconds = Math.ceil(remaining / 1000)
    return next(
      new ApiError(
        429,
        'TOO_MANY_ATTEMPTS',
        `Too many failed sign-in attempts. Try again in ${seconds} second${seconds === 1 ? '' : 's'}.`,
      ),
    )
  }

  req.adminThrottleKey = key
  next()
}
