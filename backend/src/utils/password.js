import { argon2, randomBytes, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

/**
 * Argon2id password hashing for the admin account.
 *
 * The KDF itself is Node's own `crypto.argon2` (Node 24+, OpenSSL-backed).
 * No cryptography is implemented in this file. It does three things around
 * the platform primitive: generate a random salt, encode the parameters and
 * the tag into the standard PHC string, and compare tags in constant time
 * with `crypto.timingSafeEqual`.
 *
 * Why the platform KDF rather than a native npm package (argon2 / bcrypt):
 * this product installs on a standalone offline Windows machine and is later
 * packaged with Electron. A node-gyp / prebuilt-binary dependency is a real
 * installation and ABI risk there, and it cannot be installed at all on a
 * machine with no network. Node core carries none of that risk and gives the
 * preferred algorithm. See PROJECT_MASTER_PLAN.md (BE-005a).
 *
 * Cost parameters exceed the OWASP Argon2id minimum (m=19456, t=2, p=1).
 * They are stored inside every hash, so raising them later does not
 * invalidate existing hashes - `verifyPassword` always uses the parameters
 * recorded in the hash it was given.
 */

const argon2Async = promisify(argon2)

const ALGORITHM = 'argon2id'
const VERSION = 19 // 0x13, the only version Argon2 defines
const SALT_BYTES = 16
const TAG_LENGTH = 32

export const ARGON2_PARAMS = {
  memory: 65536, // KiB (64 MiB)
  passes: 3,
  parallelism: 1,
}

const b64 = (buffer) => buffer.toString('base64').replace(/=+$/, '')

async function derive(password, nonce, params) {
  return argon2Async(ALGORITHM, {
    message: Buffer.from(password, 'utf8'),
    nonce,
    tagLength: TAG_LENGTH,
    memory: params.memory,
    passes: params.passes,
    parallelism: params.parallelism,
  })
}

/** Returns a PHC string: $argon2id$v=19$m=..,t=..,p=..$salt$tag */
export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('hashPassword requires a non-empty password string')
  }

  const nonce = randomBytes(SALT_BYTES)
  const tag = await derive(password, nonce, ARGON2_PARAMS)
  const { memory, passes, parallelism } = ARGON2_PARAMS

  return `$${ALGORITHM}$v=${VERSION}$m=${memory},t=${passes},p=${parallelism}$${b64(nonce)}$${b64(tag)}`
}

/** Parses a PHC string this module produced. Returns null if it is not one. */
export function parsePhc(hash) {
  if (typeof hash !== 'string') return null

  const match = /^\$argon2id\$v=(\d+)\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/.exec(
    hash,
  )
  if (!match) return null

  const [, version, memory, passes, parallelism, salt, tag] = match
  if (Number(version) !== VERSION) return null

  return {
    params: { memory: Number(memory), passes: Number(passes), parallelism: Number(parallelism) },
    salt: Buffer.from(salt, 'base64'),
    tag: Buffer.from(tag, 'base64'),
  }
}

/**
 * Constant-time verification. Returns false - never throws - for a malformed
 * or missing hash, so a corrupted record cannot be told apart from a wrong
 * password by the caller.
 */
export async function verifyPassword(password, hash) {
  if (typeof password !== 'string' || password.length === 0) return false

  const parsed = parsePhc(hash)
  if (!parsed) return false

  let candidate
  try {
    candidate = await derive(password, parsed.salt, parsed.params)
  } catch {
    return false
  }

  if (candidate.length !== parsed.tag.length) return false
  return timingSafeEqual(candidate, parsed.tag)
}
