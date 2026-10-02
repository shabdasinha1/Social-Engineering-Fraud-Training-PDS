import path from 'node:path'
import { fileURLToPath } from 'node:url'
import 'dotenv/config'

/** `backend/exports` - the one directory ADMIN-003 may write an export artifact to. */
const DEFAULT_EXPORT_DIR = path.resolve(fileURLToPath(new URL('../../exports', import.meta.url)))

function required(name, fallback) {
  const value = process.env[name] ?? fallback
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),

  /**
   * Loopback by default (DEPLOY-001). `app.listen(port)` with no host binds every
   * interface, which on a networked machine put the API - and every training record
   * behind it - on the LAN. The approved topology is API 127.0.0.1:5000 talking to
   * MongoDB 127.0.0.1:27017, both local-only.
   *
   * Overridable via HOST for a deliberate, documented exception; it is never widened
   * by default.
   */
  host: process.env.HOST || '127.0.0.1',
  mongoUri: required('MONGO_URI', 'mongodb://127.0.0.1:27017/cyber_awareness_training'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  sessionSecret: required('SESSION_SECRET', 'local-development-session-secret-change-me'),
  sessionMaxAgeMs: Number(process.env.SESSION_MAX_AGE_MS || 8 * 60 * 60 * 1000),

  /**
   * Signs the admin session cookie. Deliberately has NO fallback: the admin
   * cookie is the only credential-backed session in the product, so a shipped
   * default value would be a real weakness rather than a convenience. The
   * server refuses to start until an operator sets it.
   *
   * It must also differ from SESSION_SECRET - see the check below. Sharing one
   * secret would let a candidate cookie be re-signed as an admin cookie.
   */
  adminSessionSecret: required('ADMIN_SESSION_SECRET'),
  adminSessionMaxAgeMs: Number(process.env.ADMIN_SESSION_MAX_AGE_MS || 60 * 60 * 1000),

  /**
   * Where instructor exports are written (ADMIN-003).
   *
   * SERVER CONFIGURATION, never a request value. There is no code path from an HTTP body
   * to this directory or to a filename inside it, and an export can be written nowhere
   * else. An operator may relocate it - onto an encrypted volume, say - by setting
   * EXPORT_DIR; a client cannot.
   */
  exportDir: path.resolve(process.env.EXPORT_DIR || DEFAULT_EXPORT_DIR),

  /** Admin login throttling. See middleware/adminThrottle.js. */
  adminLoginMaxAttempts: Number(process.env.ADMIN_LOGIN_MAX_ATTEMPTS || 5),
  adminLoginWindowMs: Number(process.env.ADMIN_LOGIN_WINDOW_MS || 15 * 60 * 1000),
  adminLoginLockoutMs: Number(process.env.ADMIN_LOGIN_LOCKOUT_MS || 15 * 60 * 1000),

  /**
   * Keys the per-run learner action codes (SECURITY-001). Optional: when unset, a key is
   * derived from SESSION_SECRET, which is already a server secret. Changing it only makes
   * issued codes stale; an open assessment recovers by reloading its current run.
   */
  learnerActionSecret: process.env.LEARNER_ACTION_SECRET || null,

  /**
   * Express `trust proxy`. OFF unless set. Behind a reverse proxy on the same host (Nginx
   * terminating TLS and forwarding to 127.0.0.1) set TRUST_PROXY=loopback: `req.ip` is then
   * the real client address from X-Forwarded-For, which the admin login throttle keys on.
   * Without it every request appears to come from 127.0.0.1, so the throttle degrades to a
   * per-username lock that anyone can trip for the administrator.
   *
   * Never set it when the API is reachable directly: a client could then choose its own
   * address by sending X-Forwarded-For.
   */
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
}

function parseTrustProxy(value) {
  if (value === undefined || value === '' || value === 'false') return false
  if (value === 'true') return true
  if (/^\d+$/.test(value)) return Number(value)
  return value
}

if (env.adminSessionSecret === env.sessionSecret) {
  throw new Error('ADMIN_SESSION_SECRET must not be the same value as SESSION_SECRET')
}

export const isProduction = env.nodeEnv === 'production'

/**
 * The learner-session default above is published in `.env.example` and in this file. It
 * signs the candidate cookie and keys the learner action codes, so a server running on it
 * accepts a cookie anyone can forge for any learner. Tolerated for local development only:
 * a production server refuses to start until SESSION_SECRET is set to a real value.
 */
const DEVELOPMENT_SESSION_SECRET = 'local-development-session-secret-change-me'
if (isProduction && env.sessionSecret === DEVELOPMENT_SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set to a unique value when NODE_ENV=production')
}
