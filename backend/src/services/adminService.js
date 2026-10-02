import {
  AdminUser,
  MIN_PASSWORD_LENGTH,
  USERNAME_PATTERN,
  normaliseUsername,
} from '../models/AdminUser.js'
import { ApiError } from '../utils/ApiError.js'
import { hashPassword, verifyPassword } from '../utils/password.js'

/**
 * A hash of a value nobody knows, verified against when the username is
 * unknown, so a wrong username and a wrong password take the same time.
 * Without it, response time alone would tell an attacker which usernames
 * exist. Built once, lazily.
 */
let decoyHash = null
async function decoy() {
  if (!decoyHash) decoyHash = await hashPassword(`decoy:${Math.random()}:${Date.now()}`)
  return decoyHash
}

export async function countAdmins() {
  return AdminUser.countDocuments()
}

export function validateCredentialShape(username, password) {
  const problems = []
  const normalised = normaliseUsername(username ?? '')

  if (!USERNAME_PATTERN.test(normalised)) {
    problems.push(
      'Username must be 3-32 characters, start with a letter or digit, and use only letters, digits, dot, underscore or hyphen.',
    )
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    problems.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
  }

  return problems
}

/**
 * Creates the administrator. Called ONLY by `scripts/createAdmin.js` - no HTTP
 * route reaches this function.
 *
 * Single-admin for the development phase: it refuses when an AdminUser already
 * exists rather than overwriting one. How many administrators the product
 * should support is an open product decision.
 */
export async function createAdminUser({ username, password }) {
  const problems = validateCredentialShape(username, password)
  if (problems.length) {
    throw ApiError.unprocessable('INVALID_CREDENTIALS_SHAPE', problems.join(' '), problems)
  }

  const existing = await countAdmins()
  if (existing > 0) {
    throw ApiError.conflict(
      'ADMIN_EXISTS',
      'An administrator account already exists. This script will not overwrite it.',
    )
  }

  const passwordHash = await hashPassword(password)
  const admin = await AdminUser.create({ username: username.trim(), passwordHash })

  return admin
}

/**
 * Verifies a username and password. Returns the AdminUser or null.
 *
 * Never says which half was wrong, and never throws for a bad credential -
 * the caller turns null into one generic 401.
 */
export async function authenticateAdmin({ username, password }) {
  // A non-string (`{ "$ne": null }`, a number, an array) is treated as no username: it
  // reaches the same decoy verification and generic 401, never a TypeError and a 500.
  const normalised = normaliseUsername(typeof username === 'string' ? username : '')

  const admin =
    normalised.length > 0
      ? await AdminUser.findOne({ usernameNormalised: normalised }).select('+passwordHash')
      : null

  if (!admin) {
    await verifyPassword(typeof password === 'string' ? password : '', await decoy())
    return null
  }

  const ok = await verifyPassword(typeof password === 'string' ? password : '', admin.passwordHash)
  return ok ? admin : null
}
