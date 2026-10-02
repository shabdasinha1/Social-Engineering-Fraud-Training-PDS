import assert from 'node:assert/strict'
import test from 'node:test'
import { BRIEFING_VERSION, LAST_SEEN_THROTTLE_MS } from '../src/constants/learnerProfile.js'
import { Candidate, normaliseIdentifier } from '../src/models/Candidate.js'
import { maskServiceNumber } from '../src/utils/serviceNumber.js'

/**
 * LearnerProfile (PROFILE-001, client specification section 2 - closes ACCEPTANCE-001 G3).
 *
 * Pure model and projection tests: no database, no connection. Everything here is about
 * what the document holds and what leaves it, which is exactly the part of G3 that is a
 * contract rather than a behaviour.
 */

const build = async (overrides = {}) => {
  const profile = new Candidate({ name: 'Test Learner', identifier: 'IC45872H', ...overrides })
  await profile.validate()
  return profile
}

/* ------------------------------------------------------------------ *
 * 1-6  the authoritative fields
 * ------------------------------------------------------------------ */

test('the profile carries every field the LearnerProfile contract names', async () => {
  const profile = await build()

  // profile_id is the document id - the join key every attempt, run and event uses.
  assert.ok(profile._id, 'profile_id')
  assert.equal(profile.name, 'Test Learner')                 // display_name
  assert.equal(profile.identifierNormalised, 'IC45872H')     // service_no_normalized
  assert.equal(profile.service_no_masked, '••••872H')        // service_no_masked
  // created_at is `createdAt`, supplied by the timestamps option on save.
  assert.equal(profile.last_seen_at, null)
  assert.equal(profile.briefing_version, null)
  assert.equal(profile.briefing_acknowledged_at, null)
})

test('the normalised service number ignores case, spaces, hyphens and slashes', async () => {
  assert.equal(normaliseIdentifier('ic-45872 h'), 'IC45872H')
  assert.equal(normaliseIdentifier('IC/45872H'), 'IC45872H')

  const a = await build({ identifier: 'ic-45872 h' })
  const b = await build({ identifier: 'IC/45872H' })
  assert.equal(a.identifierNormalised, b.identifierNormalised,
    'two spellings of one service number must resolve to one profile key')
})

test('the masked service number is stored, and recomputed from the identifier', async () => {
  const profile = await build({ identifier: '52364356' })
  assert.equal(profile.service_no_masked, '••••4356')

  // A stored copy that could drift from its source would be worse than deriving it, so the
  // hook rewrites it on every validate rather than trusting whatever is on the document.
  profile.service_no_masked = 'TAMPERED'
  await profile.validate()
  assert.equal(profile.service_no_masked, '••••4356')
})

/**
 * Found in browser verification: the mask was being derived from the raw typed string, so
 * "IC-4587 2H" stored `••••••7 2H` while "IC/45872H" - the same profile - stored `••••872H`.
 * A stored mask has to describe the profile's identity, not one learner's punctuation.
 */
test('the mask describes the normalised number, not the punctuation typed', async () => {
  const spaced = await build({ identifier: 'IC-4587 2H' })
  const slashed = await build({ identifier: 'IC/45872H' })

  assert.equal(spaced.identifierNormalised, slashed.identifierNormalised)
  assert.equal(spaced.service_no_masked, '••••872H')
  assert.equal(spaced.service_no_masked, slashed.service_no_masked,
    'one profile must not have two masks')
  assert.ok(!spaced.service_no_masked.includes(' '), 'the mask leaked typed whitespace')
})

test('masking never reveals more than the last four characters', () => {
  assert.equal(maskServiceNumber('52364356'), '••••4356')
  assert.equal(maskServiceNumber('IC45872H'), '••••872H')
  assert.equal(maskServiceNumber('A'.repeat(24)), `${'•'.repeat(8)}AAAA`)
  // Short values are already unidentifying; nothing is invented to pad them.
  assert.equal(maskServiceNumber('1234'), '1234')
  assert.equal(maskServiceNumber(''), '')
  assert.equal(maskServiceNumber(null), '')
})

test('the schema has no prohibited identity field', () => {
  const paths = Object.keys(Candidate.schema.paths)
  for (const forbidden of ['password', 'passwordHash', 'otp', 'aadhaar', 'email', 'phone',
    'mobile', 'rank', 'unit', 'posting', 'dob', 'biometric']) {
    assert.ok(!paths.some((p) => p.toLowerCase().includes(forbidden)),
      `the LearnerProfile schema declares a prohibited field matching "${forbidden}"`)
  }
})

test('profile_id is stable across a name correction and an acknowledgement', async () => {
  const profile = await build()
  const id = profile._id.toString()

  profile.name = 'Corrected Name'
  profile.briefing_version = BRIEFING_VERSION
  profile.last_seen_at = new Date()
  await profile.validate()

  assert.equal(profile._id.toString(), id,
    'the join key every attempt and event resolves through must not move')
  assert.equal(profile.identifierNormalised, 'IC45872H')
})

/* ------------------------------------------------------------------ *
 * 7-11  the learner projection
 * ------------------------------------------------------------------ */

test('the learner projection publishes the contract and nothing else', async () => {
  const profile = await build()
  assert.deepEqual(Object.keys(profile.toPublicJSON()).sort(),
    ['briefing', 'created_at', 'display_name', 'last_seen_at', 'service_no_masked'])
})

test('the learner projection never carries the ObjectId or the raw service number', async () => {
  const profile = await build()
  profile.last_seen_at = new Date()
  const text = JSON.stringify(profile.toPublicJSON())

  assert.ok(!text.includes(profile._id.toString()), 'the Mongo ObjectId reached the learner')
  assert.ok(!text.includes('IC45872H'), 'the unmasked service number reached the learner')
  for (const field of ['id', 'profile_id', '_id', '__v', 'identifier', 'identifierNormalised',
    'service_no_normalized', 'seenScenarios', 'archived', 'password', 'otp', 'aadhaar',
    'email', 'phone', 'rank', 'unit']) {
    assert.ok(!text.includes(`"${field}"`), `the learner projection exposed "${field}"`)
  }
})

test('the projection masks even a profile written before the mask was stored', async () => {
  const profile = await build()
  // A document restored from before PROFILE-001 has no stored mask at all.
  profile.service_no_masked = null
  assert.equal(profile.toPublicJSON().service_no_masked, '••••872H')
})

test('archival changes nothing about what the learner projection publishes', async () => {
  const profile = await build()
  profile.archived = true
  profile.archived_at = new Date()

  const text = JSON.stringify(profile.toPublicJSON())
  assert.ok(!text.includes('archived'), 'archival state leaked into the learner projection')
  assert.equal(profile.toPublicJSON().display_name, 'Test Learner')
})

/* ------------------------------------------------------------------ *
 * 12-15  the briefing acknowledgement
 * ------------------------------------------------------------------ */

test('a new profile starts with the briefing outstanding', async () => {
  const profile = await build()
  const { briefing } = profile.toPublicJSON()

  assert.equal(briefing.acknowledged, false)
  assert.equal(briefing.acknowledged_version, null)
  assert.equal(briefing.acknowledged_at, null)
  assert.equal(briefing.required_version, BRIEFING_VERSION)
})

test('acknowledging the current version satisfies the briefing', async () => {
  const profile = await build()
  const at = new Date()
  profile.briefing_version = BRIEFING_VERSION
  profile.briefing_acknowledged_at = at

  const { briefing } = profile.toPublicJSON()
  assert.equal(briefing.acknowledged, true)
  assert.equal(briefing.acknowledged_version, BRIEFING_VERSION)
  assert.equal(briefing.acknowledged_at, at)
})

test('a superseded acknowledgement becomes outstanding again, and deletes nothing', async () => {
  const profile = await build()
  profile.briefing_version = BRIEFING_VERSION - 1
  profile.briefing_acknowledged_at = new Date('2026-09-01T00:00:00.000Z')
  profile.last_seen_at = new Date('2026-09-02T00:00:00.000Z')

  const { briefing, last_seen_at: lastSeen } = profile.toPublicJSON()
  assert.equal(briefing.acknowledged, false, 'an older version must be re-requested')
  // The record of the earlier acknowledgement survives - re-consent is a comparison.
  assert.equal(briefing.acknowledged_version, BRIEFING_VERSION - 1)
  assert.ok(briefing.acknowledged_at)
  assert.ok(lastSeen, 'raising the briefing version must not disturb the rest of the profile')
})

test('the acknowledgement is a version and a timestamp, not a bare boolean', () => {
  const paths = Object.keys(Candidate.schema.paths)
  assert.ok(paths.includes('briefing_version'))
  assert.ok(paths.includes('briefing_acknowledged_at'))
  // The boolean is derived from the version, so the two can never contradict each other.
  assert.ok(!paths.includes('briefing_acknowledged'))
})

test('the briefing version and the last-seen throttle are single explicit constants', () => {
  assert.equal(typeof BRIEFING_VERSION, 'number')
  assert.ok(Number.isInteger(BRIEFING_VERSION) && BRIEFING_VERSION >= 1)
  assert.ok(LAST_SEEN_THROTTLE_MS > 0)
})
