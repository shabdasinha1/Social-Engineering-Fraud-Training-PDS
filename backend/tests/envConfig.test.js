import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

/**
 * Release audit (26 Sep 2026): the learner-session secret has a published development
 * default. It signs the candidate cookie and keys the learner action codes, so a production
 * server must refuse to start on it. Each case imports `src/config/env.js` in a fresh
 * process, because the checks run once at module load.
 */
const DEFAULT_SECRET = 'local-development-session-secret-change-me'

function loadEnv(overrides) {
  const result = spawnSync(process.execPath, [
    '--input-type=module',
    '-e',
    "await import('./src/config/env.js'); console.log('LOADED')",
  ], {
    cwd: new URL('..', import.meta.url),
    env: {
      ...process.env,
      MONGO_URI: 'mongodb://127.0.0.1:27017/env_config_test',
      ADMIN_SESSION_SECRET: 'env-config-test-admin-secret-0000000000',
      ...overrides,
    },
    encoding: 'utf8',
  })
  return { loaded: result.stdout.includes('LOADED'), stderr: result.stderr }
}

test('production refuses the published development session secret', () => {
  const { loaded, stderr } = loadEnv({ NODE_ENV: 'production', SESSION_SECRET: DEFAULT_SECRET })
  assert.equal(loaded, false)
  assert.match(stderr, /SESSION_SECRET must be set to a unique value when NODE_ENV=production/)
})

test('production starts with a real session secret', () => {
  const { loaded } = loadEnv({ NODE_ENV: 'production', SESSION_SECRET: 'env-config-test-session-secret-0000000' })
  assert.equal(loaded, true)
})

test('development still accepts the default for local use', () => {
  const { loaded } = loadEnv({ NODE_ENV: 'development', SESSION_SECRET: DEFAULT_SECRET })
  assert.equal(loaded, true)
})

/**
 * Production audit (30 Sep 2026): TRUST_PROXY. Off unless set, so a directly reachable API
 * can never be told its client's address by an X-Forwarded-For header.
 */
function trustProxyFor(value) {
  const result = spawnSync(process.execPath, [
    '--input-type=module',
    '-e',
    "const { createApp } = await import('./src/app.js'); const app = createApp(); const fn = app.get('trust proxy fn'); console.log(JSON.stringify({ setting: app.get('trust proxy'), loopback: fn('127.0.0.1', 0), remote: fn('203.0.113.9', 0) }))",
  ], {
    cwd: new URL('..', import.meta.url),
    env: {
      ...process.env,
      NODE_ENV: 'development',
      MONGO_URI: 'mongodb://127.0.0.1:27017/env_config_test',
      ADMIN_SESSION_SECRET: 'env-config-test-admin-secret-0000000000',
      SESSION_SECRET: 'env-config-test-session-secret-0000000',
      TRUST_PROXY: value,
    },
    encoding: 'utf8',
  })
  return JSON.parse(result.stdout.trim().split('\n').pop())
}

test('trust proxy is off when TRUST_PROXY is unset or empty', () => {
  const off = trustProxyFor('')
  assert.equal(off.setting, false)
  assert.equal(off.loopback, false)
})

test('TRUST_PROXY=loopback trusts only the local reverse proxy', () => {
  const lb = trustProxyFor('loopback')
  assert.equal(lb.loopback, true)
  assert.equal(lb.remote, false)
})

test('TRUST_PROXY=1 is a hop count, not the string "1"', () => {
  assert.equal(trustProxyFor('1').setting, 1)
})
