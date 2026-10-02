/**
 * DEVELOPMENT ONLY - end-to-end security check of the admin authentication
 * foundation (BE-005a) against a running server and the local database.
 *
 *   node src/server.js               (in one terminal)
 *   node scripts/validateAdminApi.js (in another)
 *
 * Creates a throwaway administrator and a throwaway candidate, and deletes
 * both at the end. It REFUSES to run when a real administrator already
 * exists, so it can never touch or delete an operator account.
 */
import { sign } from 'cookie-signature'
import { connectDatabase, disconnectDatabase } from '../src/config/database.js'
import { env } from '../src/config/env.js'
import { AdminUser } from '../src/models/AdminUser.js'
import { Candidate } from '../src/models/Candidate.js'
import { countAdmins, createAdminUser } from '../src/services/adminService.js'

const BASE = process.env.API_BASE || 'http://localhost:5000/api'

const results = []
const check = (name, pass, detail = '') => {
  results.push({ name, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  -> ${detail}` : ''}`)
}

/** True when a Set-Cookie header is deleting the cookie rather than setting it. */
function isExpiring(attributes) {
  const maxAge = /(?:^|;)\s*Max-Age=(-?\d+)/i.exec(attributes)
  if (maxAge) return Number(maxAge[1]) <= 0

  const expires = /(?:^|;)\s*Expires=([^;]+)/i.exec(attributes)
  return expires ? new Date(expires[1]).getTime() <= Date.now() : false
}

/**
 * A cookie jar that keeps cookies separately by name, so a candidate session
 * and an admin session can be held at the same time - which is the point of
 * several of these checks.
 *
 * Deletion follows Expires/Max-Age rather than an empty value: `res.clearCookie`
 * on a *signed* cookie sends a signed empty string, which is not empty on the
 * wire. A browser deletes on the expiry attributes, so this does too.
 */
function makeClient() {
  const jar = new Map()

  const request = async (method, path, body, extraCookies = {}) => {
    const cookies = { ...Object.fromEntries(jar), ...extraCookies }
    const header = Object.entries(cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ')

    const response = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(header ? { Cookie: header } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    for (const raw of response.headers.getSetCookie?.() ?? []) {
      const separator = raw.indexOf(';')
      const pair = separator === -1 ? raw : raw.slice(0, separator)
      const attributes = separator === -1 ? '' : raw.slice(separator)
      const index = pair.indexOf('=')
      const name = pair.slice(0, index).trim()
      const value = pair.slice(index + 1).trim()

      if (value === '' || isExpiring(attributes)) jar.delete(name)
      else jar.set(name, value)
      request.lastSetCookie = raw
    }

    const json = await response.json().catch(() => null)
    return { status: response.status, body: json, raw: JSON.stringify(json) }
  }

  request.jar = jar
  return request
}

await connectDatabase()

if ((await countAdmins()) > 0) {
  console.error('An administrator already exists in this database.')
  console.error('This script will not run against a real admin account. Aborting.')
  await disconnectDatabase()
  process.exit(1)
}

const stamp = Date.now()
const USERNAME = `testadmin${stamp}`.slice(0, 32)
const PASSWORD = `Val1date-Admin-${stamp}`
// Candidate.identifier is capped at 20 characters, so use a short suffix.
const CANDIDATE_ID = `TEST-ADM-${String(stamp).slice(-8)}`

const client = makeClient()
let res

try {
  // ------------------------------------------------------------ provisioning
  const created = await createAdminUser({ username: USERNAME, password: PASSWORD })
  check('1  admin creation succeeds', Boolean(created?._id))

  let duplicateRejected = false
  try {
    await createAdminUser({ username: `${USERNAME}b`, password: `${PASSWORD}b` })
  } catch (error) {
    duplicateRejected = error.code === 'ADMIN_EXISTS'
  }
  check('2  a second admin is refused, the first is not overwritten', duplicateRejected)
  check('2b the refusal left exactly one admin', (await countAdmins()) === 1)

  // ---------------------------------------------------------------- hashing
  const rawDoc = await AdminUser.findById(created._id).select('+passwordHash').lean()
  check(
    '3  the password is stored as an Argon2id hash, never as plaintext',
    /^\$argon2id\$v=19\$/.test(rawDoc.passwordHash) && !JSON.stringify(rawDoc).includes(PASSWORD),
  )

  const defaultQuery = await AdminUser.findById(created._id).lean()
  check('3b passwordHash is excluded from ordinary queries', defaultQuery.passwordHash === undefined)

  check(
    '3c toPublicJSON exposes only id and username',
    JSON.stringify(Object.keys(created.toPublicJSON()).sort()) === '["id","username"]',
  )

  // ------------------------------------------------------------------ login
  res = await client('POST', '/admin/login', { username: USERNAME, password: PASSWORD })
  check(
    '4  correct credentials authenticate',
    res.status === 200 && res.body.admin?.username === USERNAME,
  )
  check(
    '4b the login response carries no hash or password',
    !res.raw.includes('assword') && !res.raw.includes('argon2'),
  )
  check('4c an admin_session cookie was issued', client.jar.has('admin_session'))
  check('4d admin login issued no candidate_session', !client.jar.has('candidate_session'))

  const setCookie = client.lastSetCookie || ''
  check(
    '4e the admin cookie is httpOnly, SameSite=Lax and path-scoped',
    /HttpOnly/i.test(setCookie) && /SameSite=Lax/i.test(setCookie) && /Path=\//i.test(setCookie),
  )

  // --------------------------------------------------------------------- me
  res = await client('GET', '/admin/me')
  check(
    '7a a valid admin session reaches /admin/me',
    res.status === 200 && res.body.admin?.username === USERNAME,
  )
  check(
    '12 /admin/me exposes no passwordHash, password or internal fields',
    !res.raw.includes('passwordHash') &&
      !res.raw.includes('argon2') &&
      !res.raw.includes(PASSWORD) &&
      !res.raw.includes('usernameNormalised') &&
      !res.raw.includes('__v'),
  )

  // -------------------------------------------------------- bad credentials
  const anon = makeClient()

  res = await anon('POST', '/admin/login', { username: USERNAME, password: 'wrong-password-here' })
  check(
    '5  an incorrect password is rejected',
    res.status === 401 && res.body.error.code === 'INVALID_ADMIN_CREDENTIALS',
  )
  const wrongPasswordMessage = res.body.error.message

  res = await anon('POST', '/admin/login', { username: `nobody${stamp}`, password: PASSWORD })
  check(
    '6  an unknown username is rejected',
    res.status === 401 && res.body.error.code === 'INVALID_ADMIN_CREDENTIALS',
  )
  check(
    '6b the two failures are indistinguishable - no username enumeration',
    res.body.error.message === wrongPasswordMessage,
  )

  res = await anon('POST', '/admin/login', {})
  check('6c a missing body is rejected without a 500', res.status === 401)

  // ------------------------------------------------------- session integrity
  res = await anon('GET', '/admin/me')
  check(
    '7b no admin session is rejected',
    res.status === 401 && res.body.error.code === 'NO_ADMIN_SESSION',
  )

  const good = client.jar.get('admin_session')
  res = await anon('GET', '/admin/me', null, { admin_session: `${good}x` })
  check(
    '7c a tampered signature is rejected',
    res.status === 401 && res.body.error.code === 'NO_ADMIN_SESSION',
  )

  res = await anon('GET', '/admin/me', null, { admin_session: String(created._id) })
  check('7d an unsigned admin id is rejected', res.status === 401)

  res = await anon('GET', '/admin/me', null, {
    admin_session: sign(String(created._id), env.sessionSecret),
  })
  check(
    '7e an admin cookie signed with the CANDIDATE secret is rejected',
    res.status === 401 && res.body.error.code === 'NO_ADMIN_SESSION',
  )

  res = await anon('GET', '/admin/me', null, {
    admin_session: sign('000000000000000000000000', env.adminSessionSecret),
  })
  check('7f a correctly signed id for a non-existent admin is rejected', res.status === 401)

  res = await anon('GET', '/admin/me', null, {
    admin_session: sign('not-an-object-id', env.adminSessionSecret),
  })
  check('7g a correctly signed but malformed id is rejected, not a 500', res.status === 401)

  // ------------------------------------------------- candidate / admin split
  const both = makeClient()
  res = await both('POST', '/candidates', { name: 'Admin Regression', identifier: CANDIDATE_ID })
  check('8a a candidate session was created', res.status === 201 && both.jar.has('candidate_session'))

  res = await both('GET', '/admin/me')
  check(
    '8  a candidate session cannot reach an admin route',
    res.status === 401 && res.body.error.code === 'NO_ADMIN_SESSION',
  )

  res = await both('GET', '/admin/me', null, { admin_session: both.jar.get('candidate_session') })
  check('8b a candidate cookie replayed as admin_session is rejected', res.status === 401)

  const adminOnly = makeClient()
  await adminOnly('POST', '/admin/login', { username: USERNAME, password: PASSWORD })

  res = await adminOnly('GET', '/candidates/me')
  check(
    '9  an admin session cannot be used as a candidate session',
    res.status === 401 && res.body.error.code === 'NO_SESSION',
  )

  res = await adminOnly('GET', '/assessments')
  check('9b an admin session cannot read candidate assessments', res.status === 401)

  // ------------------------------------------------------------ coexistence
  await both('POST', '/admin/login', { username: USERNAME, password: PASSWORD })
  check(
    'C1 both sessions coexist in one client',
    both.jar.has('candidate_session') && both.jar.has('admin_session'),
  )

  res = await both('GET', '/admin/me')
  const adminReachable = res.status === 200
  res = await both('GET', '/candidates/me')
  check('C2 both sessions work at the same time', adminReachable && res.status === 200)

  // ----------------------------------------------------------------- logout
  res = await both('POST', '/admin/logout')
  check('10 admin logout succeeds', res.status === 200)
  check('10b the admin cookie was cleared', !both.jar.has('admin_session'))

  res = await both('GET', '/admin/me')
  check('10c admin logout ends admin authentication', res.status === 401)

  res = await both('GET', '/candidates/me')
  check('11 admin logout does NOT destroy the candidate session', res.status === 200)

  await both('POST', '/admin/login', { username: USERNAME, password: PASSWORD })
  res = await both('POST', '/candidates/logout')
  check('11b candidate logout succeeds', res.status === 200 && !both.jar.has('candidate_session'))

  res = await both('GET', '/admin/me')
  check('11c candidate logout does NOT destroy the admin session', res.status === 200)
  check('11d the admin cookie survived candidate logout', both.jar.has('admin_session'))

  // ------------------------------------------------------------- throttling
  const attacker = makeClient()
  const target = `throttle${stamp}`.slice(0, 32)
  const statuses = []

  for (let i = 0; i < env.adminLoginMaxAttempts + 1; i += 1) {
    const attempt = await attacker('POST', '/admin/login', { username: target, password: `bad${i}` })
    statuses.push(attempt.status)
  }

  const beforeLimit = statuses.slice(0, env.adminLoginMaxAttempts)
  const afterLimit = statuses[env.adminLoginMaxAttempts]

  check(
    `13 the first ${env.adminLoginMaxAttempts} failed attempts return 401`,
    beforeLimit.every((status) => status === 401),
    beforeLimit.join(','),
  )
  check('13b the attempt after the limit is throttled with 429', afterLimit === 429, String(afterLimit))

  res = await attacker('POST', '/admin/login', { username: target, password: 'bad-again' })
  check(
    '13c the lockout persists on the next attempt',
    res.status === 429 && res.body.error.code === 'TOO_MANY_ATTEMPTS',
  )

  const fresh = makeClient()
  res = await fresh('POST', '/admin/login', { username: USERNAME, password: PASSWORD })
  check('13d throttling one username does not lock a different one', res.status === 200)
} finally {
  await AdminUser.deleteMany({ usernameNormalised: { $regex: /^(testadmin|throttle)\d+/ } })
  await Candidate.deleteMany({ identifierNormalised: { $regex: /^TESTADM/ } })
  console.log('\nCleaned up the throwaway admin and candidate.')

  const passed = results.filter((r) => r.pass).length
  console.log(`\n${passed}/${results.length} checks passed`)

  await disconnectDatabase()
  if (passed !== results.length) process.exitCode = 1
}
