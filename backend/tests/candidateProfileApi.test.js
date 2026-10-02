import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import { createApp } from '../src/app.js'
import { Attempt } from '../src/models/Attempt.js'
import { Candidate } from '../src/models/Candidate.js'
import { BRIEFING_VERSION, LAST_SEEN_THROTTLE_MS } from '../src/constants/learnerProfile.js'
import { detectTransactionSupport } from '../src/utils/transactions.js'

/**
 * PROFILE-001 - LearnerProfile persistence and the briefing acknowledgement over the wire
 * (client specification section 2, ACCEPTANCE-001 gap G3).
 *
 * Real HTTP against a real Express app and a real replica set, using the real signed
 * session cookie. The point is that the fields are actually PERSISTED and actually survive
 * a new session - which a projection test cannot show.
 *
 *   npm run test:engine        (starts a throwaway replica set and runs this suite)
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
      await Promise.all([Candidate.deleteMany({}), Attempt.deleteMany({})])
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
  console.warn(`\n[PROFILE-001] learner profile API tests SKIPPED - ${skipReason}\n`)
}

const it = (name, fn) => test(name, { skip: ready ? false : skipReason }, fn)

/* ------------------------------------------------------------------ *
 * HTTP helpers - real cookies, no mocking
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

let idSeq = 0
const nextIdentifier = () => `IC${String(700000 + (idSeq += 1))}`

async function signIn(name, identifier) {
  const res = await call('/candidates', { method: 'POST', body: { name, identifier } })
  assert.ok(res.cookie, `expected a session cookie: ${JSON.stringify(res.data)}`)
  return res
}

test.after(async () => {
  if (!ready) return
  await Promise.all([Candidate.deleteMany({}), Attempt.deleteMany({})])
  server?.close()
  await mongoose.disconnect()
})

/* ------------------------------------------------------------------ *
 * 1-5  creation and the projection on the wire
 * ------------------------------------------------------------------ */

it('a new profile is created with the authoritative fields persisted', async () => {
  const identifier = nextIdentifier()
  const res = await signIn('Asha Menon', identifier)

  assert.equal(res.status, 201)
  assert.equal(res.data.created, true)
  assert.deepEqual(Object.keys(res.data.candidate).sort(),
    ['briefing', 'created_at', 'display_name', 'last_seen_at', 'service_no_masked'])

  const stored = await Candidate.findOne({ identifierNormalised: identifier })
  assert.equal(stored.name, 'Asha Menon')
  assert.equal(stored.identifierNormalised, identifier)
  assert.equal(stored.service_no_masked, `••••${identifier.slice(-4)}`)
  assert.ok(stored.last_seen_at, 'sign-in must record last_seen_at')
  assert.equal(stored.briefing_version, null, 'creation must not acknowledge anything')
})

it('the response masks the service number and never carries the ObjectId', async () => {
  const identifier = nextIdentifier()
  const res = await signIn('Asha Menon', identifier)
  const stored = await Candidate.findOne({ identifierNormalised: identifier })

  const text = JSON.stringify(res.data)
  assert.equal(res.data.candidate.service_no_masked, `••••${identifier.slice(-4)}`)
  assert.ok(!text.includes(identifier), 'the raw service number was sent to the learner')
  assert.ok(!text.includes(stored._id.toString()), 'the ObjectId was sent to the learner')
})

it('no sensitive or evaluation field appears on any learner profile response', async () => {
  const identifier = nextIdentifier()
  const signInRes = await signIn('Asha Menon', identifier)
  const meRes = await call('/candidates/me', { cookie: signInRes.cookie })

  for (const payload of [signInRes.data, meRes.data]) {
    const text = JSON.stringify(payload)
    for (const field of ['password', 'otp', 'aadhaar', 'email', 'phone', 'rank', 'unit',
      'identifierNormalised', 'service_no_normalized', 'seenScenarios', 'archived',
      'total_score', 'disposition', 'canonical_family', 'canonical_triggers',
      'expected_safe_behavior', 'points_delta', 'evaluation', 'seed']) {
      assert.ok(!text.includes(`"${field}"`), `a learner response exposed "${field}"`)
    }
  }
})

it('signing in again finds the existing profile and does not create a second', async () => {
  const identifier = nextIdentifier()
  await signIn('Asha Menon', identifier)
  const second = await signIn('Asha Menon', identifier)

  assert.equal(second.status, 200)
  assert.equal(second.data.created, false, 'the profile-found signal LOGIN-001 depends on')
  assert.equal(await Candidate.countDocuments({ identifierNormalised: identifier }), 1)
})

it('a differently spelled service number resolves to the same profile', async () => {
  const res = await signIn('Asha Menon', 'IC-7900 1')
  assert.equal(res.data.created, true)

  const again = await call('/candidates', {
    method: 'POST', body: { name: 'Asha Menon', identifier: 'ic/79001' },
  })
  assert.equal(again.data.created, false)
  assert.equal(await Candidate.countDocuments({ identifierNormalised: 'IC79001' }), 1)
})

/* ------------------------------------------------------------------ *
 * N1 (release gate)  a returning sign-in never rewrites the stored identity
 * ------------------------------------------------------------------ */

it('N1: a new learner is created with the submitted name', async () => {
  const identifier = nextIdentifier()
  const res = await signIn('Ravi Kumar', identifier)
  assert.equal(res.status, 201)
  assert.equal(res.data.created, true)
  assert.equal(res.data.candidate.display_name, 'Ravi Kumar')
  assert.equal((await Candidate.findOne({ identifierNormalised: identifier })).name, 'Ravi Kumar')
})

it('N1: an existing learner signing in with the same name is found, unchanged', async () => {
  const identifier = nextIdentifier()
  await signIn('Ravi Kumar', identifier)
  const before = await Candidate.findOne({ identifierNormalised: identifier }).lean()

  const again = await signIn('Ravi Kumar', identifier)
  assert.equal(again.status, 200)
  assert.equal(again.data.created, false)
  const after = await Candidate.findOne({ identifierNormalised: identifier }).lean()
  assert.equal(after.name, before.name)
  assert.equal(after.identifier, before.identifier)
})

it('N1: a different submitted name does not rename the existing profile', async () => {
  const identifier = nextIdentifier()
  await signIn('Ravi Kumar', identifier)

  const other = await signIn('Someone Else', identifier)
  assert.equal(other.status, 200)
  assert.equal(other.data.created, false)
  // The found-profile card shows the REGISTERED name, which is how "Not you?" is decided.
  assert.equal(other.data.candidate.display_name, 'Ravi Kumar')
  const stored = await Candidate.findOne({ identifierNormalised: identifier })
  assert.equal(stored.name, 'Ravi Kumar')
  assert.equal(await Candidate.countDocuments({ identifierNormalised: identifier }), 1)
})

it('N1: "Not you?" (sign-out after the found card) leaves no rename and no session', async () => {
  const identifier = nextIdentifier()
  await signIn('Ravi Kumar', identifier)
  const before = await Candidate.findOne({ identifierNormalised: identifier }).lean()

  const wrong = await signIn('Someone Else', identifier)
  const out = await fetch(`${base}/candidates/logout`, { method: 'POST', headers: { Cookie: wrong.cookie } })
  assert.equal(out.status, 200)
  const setCookie = out.headers.getSetCookie?.().find((c) => c.startsWith('candidate_session=')) ?? ''
  assert.match(setCookie, /Expires=Thu, 01 Jan 1970/, 'logout expires the learner cookie in the browser')

  const after = await Candidate.findOne({ identifierNormalised: identifier }).lean()
  assert.equal(after.name, 'Ravi Kumar')
  assert.equal(after.identifier, before.identifier)
  assert.equal(after.briefing_version, before.briefing_version)
  assert.equal(after.archived, before.archived)
})

it('N1: confirming ("Continue as this learner") keeps the session on the stored profile', async () => {
  const identifier = nextIdentifier()
  await signIn('Ravi Kumar', identifier)

  const again = await signIn('R Kumar', identifier)
  const me = await call('/candidates/me', { cookie: again.cookie })
  assert.equal(me.status, 200)
  assert.equal(me.data.candidate.display_name, 'Ravi Kumar')
})

it('N1: concurrent first sign-ins with different names create one profile, named once', async () => {
  const identifier = nextIdentifier()
  const names = ['First A', 'First B', 'First C', 'First D']
  const results = await Promise.all(names.map((name) => call('/candidates', {
    method: 'POST', body: { name, identifier },
  })))

  assert.ok(results.every((r) => r.status === 200 || r.status === 201))
  assert.equal(results.filter((r) => r.status === 201).length, 1)
  const stored = await Candidate.find({ identifierNormalised: identifier })
  assert.equal(stored.length, 1)
  const winner = results.find((r) => r.status === 201).data.candidate.display_name
  assert.equal(stored[0].name, winner, 'the creator\'s name stands; later sign-ins do not overwrite it')
  assert.ok(results.every((r) => r.data.candidate.display_name === winner))
})

it('N1: one service number, however written, is one profile; the unique index refuses a second', async () => {
  const first = await signIn('Ravi Kumar', 'IC-7911 2')
  assert.equal(first.status, 201)
  for (const spelling of ['ic79112', 'IC/79112', ' IC 7911-2 ']) {
    const res = await signIn('Other Name', spelling)
    assert.equal(res.status, 200)
    assert.equal(res.data.created, false)
  }
  assert.equal(await Candidate.countDocuments({ identifierNormalised: 'IC79112' }), 1)
  assert.equal((await Candidate.findOne({ identifierNormalised: 'IC79112' })).name, 'Ravi Kumar')

  await assert.rejects(
    Candidate.create({ name: 'Direct Insert', identifier: 'ic 79112' }),
    (error) => error?.code === 11000,
  )
})

/* ------------------------------------------------------------------ *
 * 6-9  last_seen_at
 * ------------------------------------------------------------------ */

it('a returning sign-in moves last_seen_at forward', async () => {
  const identifier = nextIdentifier()
  await signIn('Asha Menon', identifier)

  const before = (await Candidate.findOne({ identifierNormalised: identifier })).last_seen_at
  await Candidate.updateOne({ identifierNormalised: identifier },
    { $set: { last_seen_at: new Date(Date.now() - 60 * 60 * 1000) } })

  await signIn('Asha Menon', identifier)
  const after = (await Candidate.findOne({ identifierNormalised: identifier })).last_seen_at
  assert.ok(after.getTime() >= before.getTime() - 1000, 'sign-in must refresh last_seen_at')
})

it('repeated sign-ins are safe: no duplicate profile and no counter to double', async () => {
  const identifier = nextIdentifier()
  for (let i = 0; i < 4; i += 1) await signIn('Asha Menon', identifier)

  assert.equal(await Candidate.countDocuments({ identifierNormalised: identifier }), 1)
  const stored = await Candidate.findOne({ identifierNormalised: identifier })
  assert.ok(stored.last_seen_at)
  assert.equal(stored.briefing_version, null)
})

it('concurrent first sign-ins all succeed onto one profile (release audit)', async () => {
  const identifier = nextIdentifier()
  const results = await Promise.all(Array.from({ length: 6 }, () => call('/candidates', {
    method: 'POST', body: { name: 'Race First', identifier },
  })))

  const statuses = results.map((r) => r.status)
  assert.ok(statuses.every((s) => s === 200 || s === 201), `statuses ${statuses.join(',')}`)
  assert.ok(results.every((r) => r.cookie), 'every sign-in starts a session')
  assert.equal(await Candidate.countDocuments({ identifierNormalised: identifier }), 1)
})

it('a non-string name or service number is a 422, not a 500 (release audit)', async () => {
  for (const body of [
    { name: 'X', identifier: { $ne: null } },
    { name: 42, identifier: 'IC999001' },
    { name: ['X'], identifier: 'IC999002' },
  ]) {
    const res = await call('/candidates', { method: 'POST', body })
    assert.equal(res.status, 422, JSON.stringify(body))
    assert.equal(res.data.error.code, 'MISSING_FIELDS')
  }
  assert.equal(await Candidate.countDocuments({ identifierNormalised: { $in: ['IC999001', 'IC999002'] } }), 0)
})

it('a session read refreshes last_seen_at once the throttle window has passed', async () => {
  const identifier = nextIdentifier()
  const { cookie } = await signIn('Asha Menon', identifier)

  const stale = new Date(Date.now() - LAST_SEEN_THROTTLE_MS - 60_000)
  await Candidate.updateOne({ identifierNormalised: identifier }, { $set: { last_seen_at: stale } })

  await call('/candidates/me', { cookie })
  const after = (await Candidate.findOne({ identifierNormalised: identifier })).last_seen_at
  assert.ok(after.getTime() > stale.getTime(), 'a stale last_seen_at should be refreshed')
})

it('a session read inside the throttle window writes nothing', async () => {
  const identifier = nextIdentifier()
  const { cookie } = await signIn('Asha Menon', identifier)

  const pinned = new Date(Date.now() - 1000)
  await Candidate.updateOne({ identifierNormalised: identifier }, { $set: { last_seen_at: pinned } })

  for (let i = 0; i < 3; i += 1) await call('/candidates/me', { cookie })

  const after = (await Candidate.findOne({ identifierNormalised: identifier })).last_seen_at
  assert.equal(after.getTime(), pinned.getTime(),
    'reloading the shell must not write once per render')
})

it('an unauthenticated session read moves nothing', async () => {
  const identifier = nextIdentifier()
  await signIn('Asha Menon', identifier)
  const before = (await Candidate.findOne({ identifierNormalised: identifier })).last_seen_at

  const res = await call('/candidates/me')
  assert.equal(res.status, 401)

  const after = (await Candidate.findOne({ identifierNormalised: identifier })).last_seen_at
  assert.equal(after.getTime(), before.getTime())
})

/* ------------------------------------------------------------------ *
 * 10-15  the briefing acknowledgement
 * ------------------------------------------------------------------ */

it('the briefing starts outstanding for a new profile', async () => {
  const res = await signIn('Asha Menon', nextIdentifier())
  assert.deepEqual(res.data.candidate.briefing, {
    required_version: BRIEFING_VERSION,
    acknowledged_version: null,
    acknowledged_at: null,
    acknowledged: false,
  })
})

it('loading the session does not acknowledge the briefing', async () => {
  const identifier = nextIdentifier()
  const { cookie } = await signIn('Asha Menon', identifier)

  for (let i = 0; i < 3; i += 1) {
    const res = await call('/candidates/me', { cookie })
    assert.equal(res.data.candidate.briefing.acknowledged, false)
  }
  const stored = await Candidate.findOne({ identifierNormalised: identifier })
  assert.equal(stored.briefing_version, null, 'consent must require a deliberate action')
})

it('acknowledging persists a version and a timestamp, and survives a new session', async () => {
  const identifier = nextIdentifier()
  const first = await signIn('Asha Menon', identifier)

  const ack = await call('/candidates/me/briefing', {
    method: 'POST', cookie: first.cookie, body: { version: BRIEFING_VERSION },
  })
  assert.equal(ack.status, 200)
  assert.equal(ack.data.candidate.briefing.acknowledged, true)
  assert.equal(ack.data.candidate.briefing.acknowledged_version, BRIEFING_VERSION)
  assert.ok(ack.data.candidate.briefing.acknowledged_at)

  const stored = await Candidate.findOne({ identifierNormalised: identifier })
  assert.equal(stored.briefing_version, BRIEFING_VERSION)
  assert.ok(stored.briefing_acknowledged_at instanceof Date)

  // A brand new session - the equivalent of a reload, or signing in tomorrow.
  const second = await signIn('Asha Menon', identifier)
  assert.equal(second.data.candidate.briefing.acknowledged, true)
  const reread = await call('/candidates/me', { cookie: second.cookie })
  assert.equal(reread.data.candidate.briefing.acknowledged, true)
})

it('acknowledging twice is idempotent', async () => {
  const identifier = nextIdentifier()
  const { cookie } = await signIn('Asha Menon', identifier)
  const body = { version: BRIEFING_VERSION }

  await call('/candidates/me/briefing', { method: 'POST', cookie, body })
  const second = await call('/candidates/me/briefing', { method: 'POST', cookie, body })

  assert.equal(second.status, 200)
  assert.equal(second.data.candidate.briefing.acknowledged_version, BRIEFING_VERSION)
  assert.equal(await Candidate.countDocuments({ identifierNormalised: identifier }), 1)
})

it('a version the server does not require is refused, not stored', async () => {
  const identifier = nextIdentifier()
  const { cookie } = await signIn('Asha Menon', identifier)

  const res = await call('/candidates/me/briefing', {
    method: 'POST', cookie, body: { version: BRIEFING_VERSION + 7 },
  })
  assert.equal(res.status, 422)
  assert.equal(res.data.error.code, 'BRIEFING_VERSION_MISMATCH')

  const stored = await Candidate.findOne({ identifierNormalised: identifier })
  assert.equal(stored.briefing_version, null)
})

it('acknowledging requires a session', async () => {
  const res = await call('/candidates/me/briefing', {
    method: 'POST', body: { version: BRIEFING_VERSION },
  })
  assert.equal(res.status, 401)
})

it('a superseded acknowledgement is re-requested without losing the earlier record', async () => {
  const identifier = nextIdentifier()
  const { cookie } = await signIn('Asha Menon', identifier)
  await call('/candidates/me/briefing', {
    method: 'POST', cookie, body: { version: BRIEFING_VERSION },
  })

  // Simulate a raised briefing version by ageing the stored acknowledgement.
  await Candidate.updateOne({ identifierNormalised: identifier },
    { $set: { briefing_version: BRIEFING_VERSION - 1 } })

  const res = await call('/candidates/me', { cookie })
  assert.equal(res.data.candidate.briefing.acknowledged, false)
  assert.equal(res.data.candidate.briefing.acknowledged_version, BRIEFING_VERSION - 1)
  assert.ok(res.data.candidate.briefing.acknowledged_at,
    'the earlier acknowledgement record must survive a version bump')
})

/* ------------------------------------------------------------------ *
 * 16-19  compatibility with what already exists
 * ------------------------------------------------------------------ */

it('a profile written without the PROFILE-001 fields still signs in and projects', async () => {
  // Exactly the shape of a restored production document: inserted through the driver so no
  // Mongoose default, hook or validator supplies the new fields.
  const identifier = nextIdentifier()
  const legacy = await Candidate.collection.insertOne({
    name: 'Legacy Learner',
    identifier,
    identifierNormalised: identifier,
    seenScenarios: [],
    archived: false,
    archived_at: null,
    archived_by: null,
    createdAt: new Date('2026-09-01T10:00:00.000Z'),
    updatedAt: new Date('2026-09-01T10:00:00.000Z'),
    __v: 0,
  })

  const loaded = await Candidate.findById(legacy.insertedId)
  assert.equal(loaded.last_seen_at, null, 'an absent path must read as the default')
  assert.equal(loaded.briefing_version, null)
  assert.equal(loaded.service_no_masked, null)
  // The projection still masks, by deriving when nothing was stored.
  assert.equal(loaded.toPublicJSON().service_no_masked, `••••${identifier.slice(-4)}`)

  const res = await signIn('Legacy Learner', identifier)
  assert.equal(res.data.created, false, 'an existing profile must not be recreated')
  assert.equal(await Candidate.countDocuments({ identifierNormalised: identifier }), 1)
})

it('an existing profile keeps its id, so its attempts still resolve to it', async () => {
  const identifier = nextIdentifier()
  await signIn('Asha Menon', identifier)
  const before = await Candidate.findOne({ identifierNormalised: identifier })

  // An attempt owned by this profile, addressed the way every attempt, run and event is.
  await Attempt.collection.insertOne({ profile_id: before._id, mode: 'assessment', status: 'in_progress' })

  const { cookie } = await signIn('Asha Menon', identifier)
  await call('/candidates/me/briefing', {
    method: 'POST', cookie, body: { version: BRIEFING_VERSION },
  })

  const after = await Candidate.findOne({ identifierNormalised: identifier })
  assert.equal(after._id.toString(), before._id.toString(), 'the ownership key moved')
  assert.equal(await Attempt.countDocuments({ profile_id: after._id }), 1,
    'the attempt no longer resolves to its owner')

  await Attempt.deleteMany({ profile_id: after._id })
})

it('an archived profile is still refused at sign-in, and is never un-archived', async () => {
  const identifier = nextIdentifier()
  await signIn('Asha Menon', identifier)
  await Candidate.updateOne({ identifierNormalised: identifier },
    { $set: { archived: true, archived_at: new Date() } })

  const res = await call('/candidates', {
    method: 'POST', body: { name: 'Asha Menon', identifier },
  })
  assert.equal(res.status, 403)

  const stored = await Candidate.findOne({ identifierNormalised: identifier })
  assert.equal(stored.archived, true, 'ADMIN-004 archival was undone by a sign-in')
})

it('an archived profile cannot acknowledge the briefing either', async () => {
  const identifier = nextIdentifier()
  const { cookie } = await signIn('Asha Menon', identifier)
  await Candidate.updateOne({ identifierNormalised: identifier }, { $set: { archived: true } })

  const res = await call('/candidates/me/briefing', {
    method: 'POST', cookie, body: { version: BRIEFING_VERSION },
  })
  assert.equal(res.status, 401, 'an archived profile must stop being usable immediately')

  const stored = await Candidate.findOne({ identifierNormalised: identifier })
  assert.equal(stored.briefing_version, null)
})
