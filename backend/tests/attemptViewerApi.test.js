import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import { createApp } from '../src/app.js'
import { AdminUser } from '../src/models/AdminUser.js'
import { Attempt } from '../src/models/Attempt.js'
import { AuditEvent } from '../src/models/AuditEvent.js'
import { Candidate } from '../src/models/Candidate.js'
import { ScenarioDefinition } from '../src/models/ScenarioDefinition.js'
import { ScenarioEvent } from '../src/models/ScenarioEvent.js'
import { ScenarioRun } from '../src/models/ScenarioRun.js'
import { createAdminUser } from '../src/services/adminService.js'
import {
  loadSourceScenarios,
  loadTaxonomies,
  toScenarioDefinition,
} from '../src/services/scenarioDefinitionImportService.js'
import { detectTransactionSupport } from '../src/utils/transactions.js'
import { ATTEMPT_PAGE_SIZE_MAX } from '../src/constants/attemptViewer.js'
import { OUTCOME_CLASSES } from '../src/constants/resultProjection.js'
import { codeFor } from './helpers/learnerActions.js'

/**
 * ADMIN-002 - the instructor attempt viewer over real HTTP, against a real replica set.
 *
 * The attempts are played through the REAL candidate API, so what the instructor sees is
 * what the engine actually committed - not a fixture shaped to agree with the projection.
 * That is the only way the two claims this feature rests on can be proven: that the
 * instructor's numbers come from the same authoritative result the learner is shown, and
 * that nothing the learner typed or the ledger recorded leaks into an admin response.
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
      const taxonomies = await loadTaxonomies()
      const { scenarios } = await loadSourceScenarios()
      await ScenarioDefinition.deleteMany({})
      await ScenarioDefinition.insertMany(
        scenarios.map((r) => toScenarioDefinition(r, taxonomies).doc),
      )
      await Promise.all([
        Attempt.deleteMany({}), ScenarioRun.deleteMany({}), ScenarioEvent.deleteMany({}),
        Candidate.deleteMany({}), AdminUser.deleteMany({}),
        AuditEvent.collection.deleteMany({}),
      ])
      await createAdminUser({ username: 'viewer-admin', password: 'a-long-training-password' })
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
  console.warn(`\n[ADMIN-002] attempt viewer tests SKIPPED - ${skipReason}\n`)
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
    body: { username: 'viewer-admin', password: 'a-long-training-password' },
  })
  assert.equal(res.status, 200, `admin login failed: ${JSON.stringify(res.data)}`)
  return res.cookie
}

let idSeq = 0
const nextIdentifier = () => `AV${String(300000 + (idSeq += 1))}`
let keySeq = 0
const key = (label) => `${label}-${Date.now()}-${(keySeq += 1)}`

async function signIn(name, identifier) {
  const res = await call('/candidates', { method: 'POST', body: { name, identifier } })
  assert.equal(res.status, 201, `sign-in failed: ${JSON.stringify(res.data)}`)
  return res.cookie
}

/**
 * The learner's typed rationale. Every attempt in this suite submits it, so the privacy
 * assertions are testing a value that genuinely exists in the database rather than one
 * that was never written.
 */
const TYPED_RATIONALE = 'MY-SECRET-TYPED-RATIONALE-otp-482915-do-not-publish'

async function walkSafely(cookie, attemptId, runId, resolution) {
  for (const intent of ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_trusted_directory']) {
    const r = await call(`/attempts/${attemptId}/runs/${runId}/events`, {
      method: 'POST', cookie, body: { action_code: await codeFor(runId, intent), intent_key: key(intent) },
    })
    assert.equal(r.status, 200, `${intent} failed: ${JSON.stringify(r.data)}`)
  }
  return call(`/attempts/${attemptId}/runs/${runId}/resolve`, {
    method: 'POST',
    cookie,
    body: { action_code: await codeFor(runId, `resolve_${resolution}`), intent_key: key('resolve'), rationale: TYPED_RATIONALE },
  })
}

async function walkUnsafely(cookie, attemptId, runId, resolution) {
  for (const intent of ['open_item', 'read', 'skip_inspection', 'submit_data', 'verify_in_message_contact']) {
    await call(`/attempts/${attemptId}/runs/${runId}/events`, {
      method: 'POST', cookie, body: { action_code: await codeFor(runId, intent), intent_key: key(intent) },
    })
  }
  return call(`/attempts/${attemptId}/runs/${runId}/resolve`, {
    method: 'POST',
    cookie,
    body: { action_code: await codeFor(runId, `resolve_${resolution}`), intent_key: key('resolve'), rationale: TYPED_RATIONALE },
  })
}

async function dispositionOf(runId) {
  const run = await ScenarioRun.findById(runId)
  const def = await ScenarioDefinition.findOne({
    scenario_id: run.scenario_id, version: run.definition_version,
  })
  return def.disposition
}

/** Plays `count` scenarios of an attempt. `strategy(disposition, ordinal)` shapes each. */
async function playScenarios(cookie, attemptId, count, strategy) {
  for (let i = 0; i < count; i += 1) {
    const cur = await call(`/attempts/${attemptId}/current-run`, { cookie })
    assert.ok(cur.data.run, `expected a run at position ${i + 1}`)
    const runId = cur.data.run.run_id
    const disposition = await dispositionOf(runId)
    const { safe = true, resolution } = strategy(disposition, i + 1)
    const finalAction = resolution ?? (disposition === 'malicious' ? 'report' : 'continue')
    const done = safe
      ? await walkSafely(cookie, attemptId, runId, finalAction)
      : await walkUnsafely(cookie, attemptId, runId, finalAction)
    assert.equal(done.status, 200, `resolve failed: ${JSON.stringify(done.data)}`)
  }
}

const PERFECT = () => ({ safe: true })
/** Every malicious item let through, every legitimate one rejected. */
const WORST = (disposition) => (disposition === 'malicious'
  ? { safe: false, resolution: 'continue' }
  : { safe: false, resolution: 'report' })

/** A whole attempt, played and completed. Returns its id. */
async function completedAttempt(name, strategy = PERFECT) {
  const cookie = await signIn(name, nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playScenarios(cookie, attemptId, 10, strategy)
  const done = await call(`/attempts/${attemptId}/complete`, { method: 'POST', cookie })
  assert.equal(done.status, 200, `complete failed: ${JSON.stringify(done.data)}`)
  return { attemptId, cookie }
}

/** An attempt with `resolved` scenarios done and the rest still outstanding. */
async function partialAttempt(name, resolved) {
  const cookie = await signIn(name, nextIdentifier())
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id
  await playScenarios(cookie, attemptId, resolved, PERFECT)
  return { attemptId, cookie }
}

async function reset() {
  await Promise.all([
    Attempt.deleteMany({}), ScenarioRun.deleteMany({}), ScenarioEvent.deleteMany({}),
    Candidate.deleteMany({}),
  ])
}

test.after(async () => {
  if (ready) {
    server?.close()
    await Promise.all([
      Attempt.deleteMany({}), ScenarioRun.deleteMany({}), ScenarioEvent.deleteMany({}),
      Candidate.deleteMany({}), ScenarioDefinition.deleteMany({}), AdminUser.deleteMany({}),
    ])
    await AuditEvent.collection.deleteMany({})
    await mongoose.disconnect()
  }
})

/* ------------------------------------------------------------------ *
 * 1-5  authentication and authorisation
 * ------------------------------------------------------------------ */

it('every viewer route refuses an anonymous request', async () => {
  for (const path of ['/admin/attempts', '/admin/attempts/6a9e40cac3c410903d1c8f00', '/admin/learners']) {
    const res = await call(path)
    assert.equal(res.status, 401, `${path} was reachable without a session`)
    assert.equal(res.data.error.code, 'NO_ADMIN_SESSION')
  }
})

it('a candidate session is rejected, not downgraded', async () => {
  await reset()
  const learner = await signIn('Viewer Learner', nextIdentifier())
  for (const path of ['/admin/attempts', '/admin/learners']) {
    const res = await call(path, { cookie: learner })
    assert.equal(res.status, 401, `${path} accepted a candidate cookie`)
    assert.equal(res.data.error.code, 'NO_ADMIN_SESSION')
  }
})

it('an administrator is allowed', async () => {
  const res = await call('/admin/attempts', { cookie: await adminCookie() })
  assert.equal(res.status, 200)
  assert.ok(Array.isArray(res.data.attempts))
})

it('the viewer exposes no write verb', async () => {
  const cookie = await adminCookie()
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    const res = await call('/admin/attempts', { method, cookie, body: { x: 1 } })
    assert.equal(res.status, 404, `${method} /admin/attempts was routed`)
  }
})

it('a learner cannot reach another learner\'s attempt through the candidate API', async () => {
  await reset()
  const { attemptId } = await completedAttempt('Viewer Owner')
  const stranger = await signIn('Viewer Stranger', nextIdentifier())

  // The admin can see it...
  const asAdmin = await call(`/admin/attempts/${attemptId}`, { cookie: await adminCookie() })
  assert.equal(asAdmin.status, 200)
  // ...and the other learner still cannot, through their own surface.
  const asLearner = await call(`/attempts/${attemptId}/result`, { cookie: stranger })
  assert.equal(asLearner.status, 404)
})

/* ------------------------------------------------------------------ *
 * 6-13  list, filters and query safety
 * ------------------------------------------------------------------ */

it('the list is ordered newest-started first and pages deterministically', async () => {
  await reset()
  const cookie = await adminCookie()
  for (let i = 0; i < 5; i += 1) await partialAttempt(`Order ${i}`, 1)

  const all = await call('/admin/attempts?page_size=100', { cookie })
  assert.equal(all.data.total, 5)
  const times = all.data.attempts.map((a) => new Date(a.started_at).getTime())
  assert.deepEqual(times, [...times].sort((a, b) => b - a), 'not newest-first')

  const first = await call('/admin/attempts?page=1&page_size=2', { cookie })
  const second = await call('/admin/attempts?page=2&page_size=2', { cookie })
  const third = await call('/admin/attempts?page=3&page_size=2', { cookie })
  assert.equal(first.data.total_pages, 3)
  assert.deepEqual(
    [...first.data.attempts, ...second.data.attempts, ...third.data.attempts]
      .map((a) => a.attempt_id),
    all.data.attempts.map((a) => a.attempt_id),
    'paging did not reproduce the full ordering',
  )
  // Repeating a page returns the same page.
  const again = await call('/admin/attempts?page=2&page_size=2', { cookie })
  assert.deepEqual(again.data, second.data)
})

it('the list filters by learner, by profile id and by service number', async () => {
  await reset()
  const cookie = await adminCookie()
  const mine = await partialAttempt('Filter Mine', 1)
  await partialAttempt('Filter Theirs', 1)

  const detail = await call(`/admin/attempts/${mine.attemptId}`, { cookie })
  const profileId = detail.data.attempt.profile.profile_id

  const byProfile = await call(`/admin/attempts?profile_id=${profileId}`, { cookie })
  assert.equal(byProfile.data.total, 1)
  assert.equal(byProfile.data.attempts[0].attempt_id, mine.attemptId)

  const profile = await Candidate.findById(profileId)
  const byServiceNo = await call(`/admin/attempts?service_no=${profile.identifier}`, { cookie })
  assert.equal(byServiceNo.data.total, 1)
  assert.equal(byServiceNo.data.attempts[0].attempt_id, mine.attemptId)

  // An unknown learner is an empty page, not an error.
  const unknown = await call('/admin/attempts?service_no=ZZ999999', { cookie })
  assert.equal(unknown.status, 200)
  assert.deepEqual(unknown.data.attempts, [])
  assert.equal(unknown.data.total, 0)
})

it('the list filters by started_at date range, inclusive of the whole end day', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await partialAttempt('Date One', 1)

  const attempt = await Attempt.findById(attemptId)
  const day = attempt.started_at.toISOString().slice(0, 10)

  const inside = await call(`/admin/attempts?started_from=${day}&started_to=${day}`, { cookie })
  assert.equal(inside.data.total, 1, 'a same-day range excluded the attempt')

  const before = await call(`/admin/attempts?started_to=1990-01-01`, { cookie })
  assert.equal(before.data.total, 0)

  const after = await call(`/admin/attempts?started_from=2999-01-01`, { cookie })
  assert.equal(after.data.total, 0)
})

it('an invalid date, an inverted range and an oversized range are all refused', async () => {
  const cookie = await adminCookie()
  const cases = [
    ['started_from=yesterday', 'INVALID_DATE'],
    ['started_from=2026-02-30', 'INVALID_DATE'],
    ['started_from=07/09/2026', 'INVALID_DATE'],
    ['started_from=2026-09-07&started_to=2026-09-01', 'INVALID_DATE_RANGE'],
    ['started_from=2000-01-01&started_to=2026-01-01', 'DATE_RANGE_TOO_LARGE'],
  ]
  for (const [query, code] of cases) {
    const res = await call(`/admin/attempts?${query}`, { cookie })
    assert.equal(res.status, 422, `${query} was accepted`)
    assert.equal(res.data.error.code, code)
  }
})

it('an unknown filter is rejected rather than ignored', async () => {
  const cookie = await adminCookie()
  for (const query of ['rationale=x', 'seed=abc', 'sort=total_score', 'limit=5', 'foo=bar']) {
    const res = await call(`/admin/attempts?${query}`, { cookie })
    assert.equal(res.status, 422, `${query} was accepted`)
    assert.equal(res.data.error.code, 'FORBIDDEN_FILTER')
  }
})

it('a Mongo operator in the query string cannot reach the database', async () => {
  await reset()
  const cookie = await adminCookie()
  await partialAttempt('Injection One', 1)

  // Express 5 parses the query string with `querystring`, so a bracketed operator arrives
  // as the LITERAL key `status[$ne]` and is refused by the allowlist before it is even a
  // value. Both refusals are asserted, because which one fires depends on the parser and
  // the feature must be safe under either.
  for (const query of [
    'status[$ne]=nothing',
    'profile_id[$exists]=true',
    'started_from[$gt]=2000-01-01',
    'mode[$regex]=.*',
  ]) {
    const res = await call(`/admin/attempts?${query}`, { cookie })
    assert.equal(res.status, 422, `${query} was accepted`)
    assert.ok(['FORBIDDEN_FILTER', 'INVALID_FILTER'].includes(res.data.error.code),
      `${query} produced ${res.data.error.code}`)
  }

  // A repeated parameter DOES arrive as an array under this parser, and is refused as a
  // value rather than as an unknown key.
  const repeated = await call('/admin/attempts?status=completed&status=in_progress', { cookie })
  assert.equal(repeated.status, 422)
  assert.equal(repeated.data.error.code, 'INVALID_FILTER')

  // A literal operator string is not a match either - it is simply not a valid value.
  const literal = await call('/admin/attempts?status=%7B%22%24ne%22%3Anull%7D', { cookie })
  assert.equal(literal.status, 422)
  assert.equal(literal.data.error.code, 'INVALID_FILTER')

  // And the attempt that does exist is still reachable, so nothing above was a 422 by
  // accident of a broken endpoint.
  const sane = await call('/admin/attempts?status=in_progress', { cookie })
  assert.equal(sane.status, 200)
  assert.equal(sane.data.total, 1)
})

it('pagination is bounded', async () => {
  const cookie = await adminCookie()
  const over = await call(`/admin/attempts?page_size=${ATTEMPT_PAGE_SIZE_MAX + 1}`, { cookie })
  assert.equal(over.status, 422)
  assert.equal(over.data.error.code, 'INVALID_PAGINATION')

  const zero = await call('/admin/attempts?page=0', { cookie })
  assert.equal(zero.status, 422)

  const ok = await call(`/admin/attempts?page_size=${ATTEMPT_PAGE_SIZE_MAX}`, { cookie })
  assert.equal(ok.status, 200)
  assert.equal(ok.data.page_size, ATTEMPT_PAGE_SIZE_MAX)
})

it('the list carries no event data and no per-scenario detail', async () => {
  await reset()
  const cookie = await adminCookie()
  await completedAttempt('List Privacy')

  const res = await call('/admin/attempts', { cookie })
  const text = JSON.stringify(res.data)
  for (const field of ['scenarios', 'path', 'events', 'event_code', 'points_delta',
    'scenario_sequence', 'selection', 'seed', 'metadata', 'intent_key', 'rationale']) {
    assert.ok(!text.includes(`"${field}":`), `the list exposed the field "${field}"`)
  }
  /**
   * IMMERSIVE-001 adds the four timeout facts. They belong on the instructor LIST as well
   * as the detail view: an instructor scanning attempts needs to see at a glance which
   * ones ran out of time, and none of the four is scenario, event or answer data - which
   * is what the privacy loop above actually guards.
   */
  assert.deepEqual(Object.keys(res.data.attempts[0]).sort(), [
    'attempt_id', 'completed_at', 'content_version', 'duration_ms', 'end_reason', 'max_score',
    'mode', 'profile', 'result_available', 'scenarios_resolved', 'scenarios_total',
    'started_at', 'status', 'time_limit_ms', 'timed_out', 'total_score',
    'unresolved_at_expiry',
  ].sort())
})

it('the list reports the stored timeout facts, not placeholders (release audit)', async () => {
  await reset()
  const cookie = await adminCookie()
  const finished = await completedAttempt('List Finished')
  const timedOut = await partialAttempt('List Timed Out', 3)
  // Past the deadline, written around the model's freeze hook; the learner's next read
  // is what finalises it, exactly as in use.
  await Attempt.collection.updateOne(
    { _id: new mongoose.Types.ObjectId(timedOut.attemptId) },
    { $set: { expires_at: new Date(Date.now() - 1000) } },
  )
  await call('/attempts/current', { cookie: timedOut.cookie })

  const res = await call('/admin/attempts', { cookie })
  const row = (id) => res.data.attempts.find((a) => a.attempt_id === id)

  assert.equal(row(finished.attemptId).end_reason, 'learner_completed')
  assert.equal(row(finished.attemptId).timed_out, false)
  assert.ok(row(finished.attemptId).time_limit_ms > 0)

  assert.equal(row(timedOut.attemptId).status, 'completed')
  assert.equal(row(timedOut.attemptId).end_reason, 'expired')
  assert.equal(row(timedOut.attemptId).timed_out, true)
  assert.equal(row(timedOut.attemptId).unresolved_at_expiry, 7)
  assert.ok(row(timedOut.attemptId).time_limit_ms > 0)
})

/* ------------------------------------------------------------------ *
 * 14-16  learner lookup
 * ------------------------------------------------------------------ */

it('the learner lookup finds a profile by name or service-number prefix', async () => {
  await reset()
  const cookie = await adminCookie()
  const identifier = nextIdentifier()
  await signIn('Lookup Target', identifier)

  const byName = await call('/admin/learners?display_name=Lookup', { cookie })
  assert.equal(byName.status, 200)
  assert.equal(byName.data.learners.length, 1)
  assert.equal(byName.data.learners[0].display_name, 'Lookup Target')

  const byNumber = await call(`/admin/learners?service_no=${identifier.slice(0, 5)}`, { cookie })
  assert.equal(byNumber.data.learners.length, 1)

  const nothing = await call('/admin/learners?display_name=Nobody', { cookie })
  assert.deepEqual(nothing.data.learners, [])
})

it('the learner lookup publishes only the masked service number', async () => {
  await reset()
  const cookie = await adminCookie()
  const identifier = nextIdentifier()
  await signIn('Mask Target', identifier)

  const res = await call('/admin/learners?display_name=Mask', { cookie })
  const text = JSON.stringify(res.data)
  assert.ok(!text.includes(identifier), 'the unmasked service number was published')
  assert.ok(text.includes(identifier.slice(-4)), 'the last four should be visible')
  // PROFILE-001 added `last_seen_at` to the detail projection this lookup reuses. It is an
  // authoritative LearnerProfile field on an instructor-only surface, and it carries no
  // identity: the assertions above remain the ones that matter.
  assert.deepEqual(Object.keys(res.data.learners[0]).sort(),
    ['created_at', 'display_name', 'last_seen_at', 'profile_id', 'service_no_masked'])
})

it('the learner lookup is bounded and allowlisted', async () => {
  const cookie = await adminCookie()
  const unknown = await call('/admin/learners?identifier=X', { cookie })
  assert.equal(unknown.status, 422)
  assert.equal(unknown.data.error.code, 'FORBIDDEN_FILTER')

  const over = await call('/admin/learners?limit=500', { cookie })
  assert.equal(over.status, 422)

  const injected = await call('/admin/learners?display_name[$ne]=x', { cookie })
  assert.equal(injected.status, 422)
  assert.ok(['FORBIDDEN_FILTER', 'INVALID_FILTER'].includes(injected.data.error.code))

  const repeated = await call('/admin/learners?display_name=a&display_name=b', { cookie })
  assert.equal(repeated.status, 422)
  assert.equal(repeated.data.error.code, 'INVALID_FILTER')
})

/* ------------------------------------------------------------------ *
 * 17-22  detail: result correctness against the authoritative projection
 * ------------------------------------------------------------------ */

it('the instructor total is the authoritative total, and matches the learner\'s own', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId, cookie: learner } = await completedAttempt('Total Match')

  const admin = await call(`/admin/attempts/${attemptId}`, { cookie })
  const own = await call(`/attempts/${attemptId}/result`, { cookie: learner })

  assert.equal(admin.status, 200)
  assert.equal(admin.data.attempt.total_score, own.data.result.total_score)
  assert.equal(admin.data.attempt.total_score, 100)
  assert.equal(admin.data.attempt.max_score, 100)
  assert.deepEqual(admin.data.summary, own.data.result.summary)

  const stored = await Attempt.findById(attemptId)
  assert.equal(admin.data.attempt.total_score, stored.total_score)
})

it('per-scenario scores match the ScenarioRun records exactly', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await completedAttempt('Scores Match', WORST)

  const res = await call(`/admin/attempts/${attemptId}`, { cookie })
  const runs = await ScenarioRun.find({ attempt_id: attemptId }).sort({ ordinal: 1 })

  assert.equal(res.data.scenarios.length, 10)
  for (const run of runs) {
    const shown = res.data.scenarios.find((s) => s.ordinal === run.ordinal)
    assert.equal(shown.score_0_10, run.score_0_10, `ordinal ${run.ordinal}`)
    assert.equal(shown.outcome_code, run.outcome_code)
    assert.equal(shown.scenario_ref, run.scenario_id)
    assert.equal(shown.platform, run.platform)
  }
  assert.equal(
    res.data.scenarios.reduce((sum, s) => sum + s.score_0_10, 0),
    res.data.attempt.total_score,
  )
})

it('missed threats and false positives match the result service classification', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId, cookie: learner } = await completedAttempt('Classify', WORST)

  const admin = await call(`/admin/attempts/${attemptId}`, { cookie })
  const own = await call(`/attempts/${attemptId}/result`, { cookie: learner })

  const adminClasses = admin.data.scenarios.map((s) => s.outcome_class)
  const ownClasses = own.data.result.scenarios.map((s) => s.outcome_class)
  assert.deepEqual(adminClasses, ownClasses)

  // The worst-case run must actually produce both classes, or this proves nothing.
  assert.ok(adminClasses.includes(OUTCOME_CLASSES.MISSED_THREAT))
  assert.ok(adminClasses.includes(OUTCOME_CLASSES.FALSE_POSITIVE))
  assert.equal(admin.data.summary.missed_threats, own.data.result.summary.missed_threats)
  assert.equal(admin.data.summary.false_positives, own.data.result.summary.false_positives)

  // And the instructor-only half: what each item actually was.
  for (const scenario of admin.data.scenarios) {
    assert.ok(['malicious', 'legitimate'].includes(scenario.disposition))
  }
})

it('the path replay is the same compact projection the learner receives', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId, cookie: learner } = await completedAttempt('Path Match')

  const admin = await call(`/admin/attempts/${attemptId}`, { cookie })
  const own = await call(`/attempts/${attemptId}/result`, { cookie: learner })

  for (const scenario of admin.data.scenarios) {
    const mine = own.data.result.scenarios.find((s) => s.ordinal === scenario.ordinal)
    assert.deepEqual(scenario.path, mine.path)
    for (const step of scenario.path) {
      assert.deepEqual(Object.keys(step).sort(), ['action', 'stage', 'step'])
    }
    assert.ok(scenario.path.some((s) => ['inspect', 'branch', 'verify', 'resolve'].includes(s.stage)))
  }
})

it('the behaviour breakdown and remediation come from the result service unchanged', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId, cookie: learner } = await completedAttempt('Breakdown', WORST)

  const admin = await call(`/admin/attempts/${attemptId}`, { cookie })
  const own = await call(`/attempts/${attemptId}/result`, { cookie: learner })

  assert.deepEqual(admin.data.behaviour, own.data.result.behaviour)
  assert.deepEqual(admin.data.remediation.recommendations, own.data.result.remediation)
  assert.equal(admin.data.remediation.available, true)
  assert.equal(admin.data.behaviour_scope.scope, 'complete')

  // Section 7 requires all four axes.
  for (const axis of ['by_platform', 'by_family', 'by_trigger', 'by_stage']) {
    assert.ok(Array.isArray(admin.data.behaviour[axis]), `missing ${axis}`)
  }
  assert.ok(admin.data.remediation.recommendations.length >= 1)
  assert.ok(admin.data.remediation.recommendations.length <= 3)
  // Families, never scenario ids: remediation must not become a partial answer key.
  for (const recommendation of admin.data.remediation.recommendations) {
    assert.ok(recommendation.family_key)
    assert.equal(recommendation.scenario_id, undefined)
    assert.equal(recommendation.scenario_ids, undefined)
  }
})

it('platform coverage reports every platform in the attempt', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await completedAttempt('Coverage')

  const res = await call(`/admin/attempts/${attemptId}`, { cookie })
  const covered = res.data.platform_coverage.reduce((sum, p) => sum + p.scenarios, 0)
  assert.equal(covered, 10)
  assert.equal(res.data.platform_coverage.every((p) => p.resolved === p.scenarios), true)
})

/* ------------------------------------------------------------------ *
 * 23-26  detail: not found, malformed, idempotent
 * ------------------------------------------------------------------ */

it('a nonexistent attempt is a 404', async () => {
  const cookie = await adminCookie()
  const res = await call('/admin/attempts/6a9e40cac3c410903d1c8fff', { cookie })
  assert.equal(res.status, 404)
  assert.equal(res.data.error.code, 'ATTEMPT_NOT_FOUND')
})

it('a malformed attempt id is a 404, not a 500', async () => {
  const cookie = await adminCookie()
  for (const id of ['not-an-id', '123', '%20', 'null']) {
    const res = await call(`/admin/attempts/${id}`, { cookie })
    assert.equal(res.status, 404, `${id} did not produce a 404`)
    assert.equal(res.data.error.code, 'ATTEMPT_NOT_FOUND')
  }
})

it('reading an attempt changes nothing', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await completedAttempt('Idempotent')

  const before = {
    attempt: (await Attempt.findById(attemptId)).toObject(),
    runs: await ScenarioRun.countDocuments({ attempt_id: attemptId }),
    events: await ScenarioEvent.countDocuments({}),
  }

  const first = await call(`/admin/attempts/${attemptId}`, { cookie })
  const second = await call(`/admin/attempts/${attemptId}`, { cookie })
  assert.deepEqual(first.data, second.data)

  const after = await Attempt.findById(attemptId)
  assert.deepEqual(after.toObject(), before.attempt)
  assert.equal(await ScenarioRun.countDocuments({ attempt_id: attemptId }), before.runs)
  assert.equal(await ScenarioEvent.countDocuments({}), before.events)
})

it('the viewer writes no audit entry', async () => {
  await reset()
  await AuditEvent.collection.deleteMany({})
  const cookie = await adminCookie()
  const { attemptId } = await completedAttempt('No Audit')

  await call('/admin/attempts', { cookie })
  await call(`/admin/attempts/${attemptId}`, { cookie })
  await call('/admin/learners', { cookie })

  assert.equal(await AuditEvent.countDocuments({}), 0,
    'the attempt viewer appended to the append-only change log')
})

/* ------------------------------------------------------------------ *
 * 27-30  incomplete attempts
 * ------------------------------------------------------------------ */

it('an incomplete attempt reports no total and only its resolved scenarios', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await partialAttempt('Partial One', 3)

  const res = await call(`/admin/attempts/${attemptId}`, { cookie })
  assert.equal(res.status, 200)
  assert.equal(res.data.attempt.status, 'in_progress')
  assert.equal(res.data.attempt.result_available, false)
  assert.equal(res.data.attempt.total_score, null, 'a total was fabricated')
  assert.equal(res.data.attempt.completed_at, null)
  assert.equal(res.data.attempt.scenarios_resolved, 3)
  assert.equal(res.data.attempt.scenarios_total, 10)
  assert.equal(res.data.summary, null)

  // The resolved points are published, but never as a 0-100 total.
  const runs = await ScenarioRun.find({ attempt_id: attemptId, status: 'resolved' })
  assert.equal(res.data.attempt.resolved_points,
    runs.reduce((sum, r) => sum + r.score_0_10, 0))

  const resolved = res.data.scenarios.filter((s) => s.resolved)
  const pending = res.data.scenarios.filter((s) => !s.resolved)
  assert.equal(resolved.length, 3)
  assert.equal(pending.length, 7)
  assert.deepEqual(resolved.map((s) => s.ordinal), [1, 2, 3])
})

it('an unresolved scenario leaks no answer', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await partialAttempt('Partial Two', 2)

  const res = await call(`/admin/attempts/${attemptId}`, { cookie })
  const pending = res.data.scenarios.filter((s) => !s.resolved)

  for (const scenario of pending) {
    assert.deepEqual(Object.keys(scenario).sort(), [
      'current_stage', 'max_score', 'ordinal', 'platform', 'platform_label', 'resolved',
      'scenario_ref', 'score_0_10', 'started_at', 'status',
    ])
    assert.equal(scenario.score_0_10, null)
  }

  // The disposition of an unfinished scenario is never published.
  const unresolvedRuns = await ScenarioRun.find({ attempt_id: attemptId, status: { $ne: 'resolved' } })
  const text = JSON.stringify(res.data.scenarios.filter((s) => !s.resolved))
  for (const run of unresolvedRuns) {
    const definition = await ScenarioDefinition.findOne({
      scenario_id: run.scenario_id, version: run.definition_version,
    }).select('+evaluation')
    assert.ok(!text.includes(definition.disposition))
    assert.ok(!text.includes(definition.canonical_family))
    if (definition.evaluation?.feedback?.safe_action) {
      assert.ok(!text.includes(definition.evaluation.feedback.safe_action))
    }
  }
})

it('an incomplete attempt offers no remediation and no comparison, with a reason', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await partialAttempt('Partial Three', 4)

  const res = await call(`/admin/attempts/${attemptId}`, { cookie })
  assert.equal(res.data.remediation.available, false)
  assert.equal(res.data.remediation.reason, 'attempt_not_complete')
  assert.deepEqual(res.data.remediation.recommendations, [])
  assert.equal(res.data.comparison.available, false)
  assert.equal(res.data.comparison.reason, 'attempt_not_complete')
  assert.equal(res.data.behaviour_scope.scope, 'partial')
  assert.equal(res.data.behaviour_scope.scenarios_included, 4)
  assert.equal(res.data.behaviour_scope.scenarios_total, 10)
})

it('viewing an incomplete attempt does not advance or complete it', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId, cookie: learner } = await partialAttempt('Partial Four', 5)

  await call(`/admin/attempts/${attemptId}`, { cookie })
  await call(`/admin/attempts/${attemptId}`, { cookie })

  const attempt = await Attempt.findById(attemptId)
  assert.equal(attempt.status, 'in_progress')
  assert.equal(attempt.total_score, null)
  assert.equal(await ScenarioRun.countDocuments({ attempt_id: attemptId, status: 'resolved' }), 5)

  // The learner can still carry on where they left off.
  const current = await call(`/attempts/${attemptId}/current-run`, { cookie: learner })
  assert.equal(current.data.run.ordinal, 6)
})

/* ------------------------------------------------------------------ *
 * 31-33  comparison
 * ------------------------------------------------------------------ */

it('two comparable attempts by the same learner compare', async () => {
  await reset()
  const cookie = await adminCookie()
  const learner = await signIn('Compare One', nextIdentifier())

  const first = await call('/attempts', { method: 'POST', cookie: learner })
  await playScenarios(learner, first.data.attempt.attempt_id, 10, WORST)
  await call(`/attempts/${first.data.attempt.attempt_id}/complete`, { method: 'POST', cookie: learner })

  const second = await call('/attempts', { method: 'POST', cookie: learner })
  await playScenarios(learner, second.data.attempt.attempt_id, 10, PERFECT)
  await call(`/attempts/${second.data.attempt.attempt_id}/complete`, { method: 'POST', cookie: learner })

  const res = await call(`/admin/attempts/${second.data.attempt.attempt_id}`, { cookie })
  assert.equal(res.data.comparison.available, true)
  assert.equal(res.data.comparison.previous_attempt_id, first.data.attempt.attempt_id)
  assert.ok(res.data.comparison.delta > 0)
})

it('an attempt on a different mode or content version does not compare', async () => {
  await reset()
  const cookie = await adminCookie()
  const learner = await signIn('Compare Two', nextIdentifier())

  const first = await call('/attempts', { method: 'POST', cookie: learner })
  await playScenarios(learner, first.data.attempt.attempt_id, 10, PERFECT)
  await call(`/attempts/${first.data.attempt.attempt_id}/complete`, { method: 'POST', cookie: learner })

  const second = await call('/attempts', { method: 'POST', cookie: learner })
  await playScenarios(learner, second.data.attempt.attempt_id, 10, PERFECT)
  await call(`/attempts/${second.data.attempt.attempt_id}/complete`, { method: 'POST', cookie: learner })

  // Make the earlier attempt incomparable - a different content version.
  await Attempt.updateOne({ _id: first.data.attempt.attempt_id }, { $set: { content_version: 99 } })

  const res = await call(`/admin/attempts/${second.data.attempt.attempt_id}`, { cookie })
  assert.equal(res.data.comparison.available, false)
  assert.equal(res.data.comparison.reason, 'not_comparable')
  assert.deepEqual(res.data.comparison.incomparable_on, ['content_version'])
  // No value from the other attempt is echoed.
  assert.equal(res.data.comparison.previous_total_score, undefined)

  // The same holds for a different mode.
  await Attempt.updateOne({ _id: first.data.attempt.attempt_id },
    { $set: { content_version: 1, mode: 'training' } })
  const again = await call(`/admin/attempts/${second.data.attempt.attempt_id}`, { cookie })
  assert.equal(again.data.comparison.available, false)
  assert.deepEqual(again.data.comparison.incomparable_on, ['mode'])
})

it('a first attempt reports no previous attempt rather than a comparison', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await completedAttempt('Compare Three')

  const res = await call(`/admin/attempts/${attemptId}`, { cookie })
  assert.equal(res.data.comparison.available, false)
  assert.equal(res.data.comparison.reason, 'no_previous_attempt')
})

/* ------------------------------------------------------------------ *
 * 34-37  privacy
 * ------------------------------------------------------------------ */

it('the typed learner rationale never appears in an admin response', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await completedAttempt('Rationale Privacy')

  // It really was stored - otherwise this proves nothing.
  const stored = await ScenarioRun.findOne({ attempt_id: attemptId, ordinal: 1 })
  assert.equal(stored.rationale, TYPED_RATIONALE)

  for (const path of ['/admin/attempts', `/admin/attempts/${attemptId}`, '/admin/learners']) {
    const res = await call(path, { cookie })
    const text = JSON.stringify(res.data)
    assert.ok(!text.includes(TYPED_RATIONALE), `${path} published the typed rationale`)
    assert.ok(!text.includes('otp-482915'), `${path} published typed content`)
    assert.ok(!text.includes('"rationale":'), `${path} carries a rationale field`)
  }
})

it('no sensitive or server-internal field name appears in the detail response', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await completedAttempt('Field Privacy', WORST)

  const res = await call(`/admin/attempts/${attemptId}`, { cookie })
  const text = JSON.stringify(res.data)

  for (const field of [
    // credentials and identity - none of these exist in the model, and none may appear
    'password', 'password_hash', 'otp', 'payment', 'biometric', 'aadhaar', 'phone',
    'email', 'rank', 'identifier', 'identifierNormalised', 'service_no_normalized',
    'session', 'secret', 'token', 'cookie',
    // ledger internals
    'intent_key', 'idempotency_key', 'event_id', 'event_code', 'points_delta',
    'metadata', 'synthetic_target_id', 'client_ts', 'server_ts', 'sequence',
    'last_sequence', 'score_running',
    // attempt internals
    'seed', 'selection', 'scenario_sequence', 'composition', 'relaxations',
    // scenario answer keys
    'evaluation', 'expected_actions', 'scoring', 'stages', 'end_state', 'title',
    // mongoose internals
    '_id', '__v', 'seenScenarios',
  ]) {
    // Matched as a JSON KEY, not as a substring: `email` is also a legitimate platform
    // VALUE, and asserting on the bare word would flag the platform of every email
    // scenario as a leaked contact address.
    assert.ok(!text.includes(`"${field}":`), `the detail response exposed the field "${field}"`)
  }

  // The platform value is expected, and its presence proves the check above is looking at
  // a response that really does contain the word.
  assert.ok(res.data.scenarios.some((s) => ['email', 'whatsapp', 'sms', 'instagram']
    .includes(s.platform)))
})

it('injected event metadata cannot surface in an admin response', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await completedAttempt('Metadata Privacy')

  // Write sensitive-looking values into every place the ledger could carry them.
  const runs = await ScenarioRun.find({ attempt_id: attemptId })
  const POISON = 'INJECTED-SECRET-9f3a-payment-card-4111111111111111'
  await ScenarioEvent.collection.updateMany(
    { run_id: { $in: runs.map((r) => r._id) } },
    {
      $set: {
        'metadata.transition': POISON,
        'metadata.resolution_code': POISON,
        injected_field: POISON,
      },
    },
  )
  await ScenarioRun.collection.updateMany(
    { attempt_id: runs[0].attempt_id },
    { $set: { injected_field: POISON } },
  )
  await Attempt.collection.updateOne(
    { _id: runs[0].attempt_id },
    { $set: { injected_field: POISON } },
  )
  await Candidate.collection.updateMany({}, { $set: { injected_field: POISON } })

  for (const path of ['/admin/attempts', `/admin/attempts/${attemptId}`, '/admin/learners']) {
    const res = await call(path, { cookie })
    assert.equal(res.status, 200)
    assert.ok(!JSON.stringify(res.data).includes(POISON), `${path} leaked injected content`)
    assert.ok(!JSON.stringify(res.data).includes('injected_field'))
  }
})

it('the detail response exposes no raw ScenarioEvent document', async () => {
  await reset()
  const cookie = await adminCookie()
  const { attemptId } = await completedAttempt('Event Privacy')

  const res = await call(`/admin/attempts/${attemptId}`, { cookie })
  const text = JSON.stringify(res.data)

  const runs = await ScenarioRun.find({ attempt_id: attemptId })
  const events = await ScenarioEvent.find({ run_id: { $in: runs.map((r) => r._id) } })
  assert.ok(events.length >= 60, 'the fixture should have produced a full ledger')

  for (const event of events.slice(0, 20)) {
    assert.ok(!text.includes(String(event._id)), 'an event id was published')
    assert.ok(!text.includes(event.intent_key), 'an idempotency key was published')
    assert.ok(!text.includes(`"${event.event_code}"`), 'a raw event code was published')
  }
  for (const run of runs) {
    assert.ok(!text.includes(String(run._id)), 'a run id was published')
  }
})
