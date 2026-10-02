import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import { ProgressSnapshot } from '../src/models/ProgressSnapshot.js'

/**
 * `ProgressSnapshot` model and learner projection (PROGRESS-001, specification section 6 -
 * ACCEPTANCE-001 gap G2).
 *
 * Pure schema and projection tests: no database, no connection. What the document may hold
 * and what may leave it are contracts, and this is where they are pinned.
 */

const bucket = (over = {}) =>
  ({ key: 'whatsapp', label: 'WhatsApp', scenarios: 3, points: 21, max_points: 30, ...over })

const build = async (over = {}) => {
  const snapshot = new ProgressSnapshot({
    profile_id: new mongoose.Types.ObjectId(),
    attempt_count: 2,
    scenarios_completed: 20,
    last_score: 71,
    best_score: 84,
    by_platform: [bucket()],
    by_family: [bucket({ key: 'credential_phishing', label: 'Credential phishing' })],
    mode: 'assessment',
    content_version: 1,
    ...over,
  })
  await snapshot.validate()
  return snapshot
}

/* ------------------------------------------------------------------ *
 * 1-6  the entity the specification names
 * ------------------------------------------------------------------ */

test('the snapshot carries every field the section 6 entity names', async () => {
  const snapshot = await build()

  assert.ok(snapshot.profile_id)
  assert.equal(snapshot.attempt_count, 2)
  assert.equal(snapshot.last_score, 71)
  assert.equal(snapshot.best_score, 84)
  assert.equal(snapshot.by_platform.length, 1)
  assert.equal(snapshot.by_family.length, 1)
  assert.ok(snapshot.generated_at instanceof Date)
})

test('a learner with no completed attempt is a valid, empty snapshot', async () => {
  const snapshot = await build({
    attempt_count: 0,
    scenarios_completed: 0,
    last_score: null,
    best_score: null,
    by_platform: [],
    by_family: [],
    mode: null,
    content_version: null,
  })

  const json = snapshot.toCandidateJSON()
  assert.equal(json.attempt_count, 0)
  assert.equal(json.last_score, null, 'no score may be invented for a learner who has none')
  assert.equal(json.best_score, null)
  assert.deepEqual(json.by_platform, [])
})

test('generated_at defaults to the server clock and is never optional', async () => {
  const before = Date.now()
  const snapshot = await build()
  assert.ok(snapshot.generated_at.getTime() >= before - 1000)
  assert.equal(ProgressSnapshot.schema.path('generated_at').isRequired, true)
})

test('one snapshot per profile - profile_id is unique and required', () => {
  const path = ProgressSnapshot.schema.path('profile_id')
  assert.equal(path.isRequired, true)
  assert.equal(path.options.unique, true)
})

test('a score outside 0-100 is refused', async () => {
  await assert.rejects(() => build({ best_score: 101 }))
  await assert.rejects(() => build({ last_score: -1 }))
  await assert.rejects(() => build({ attempt_count: -1 }))
})

test('the comparability signature is recorded so a mixed history can be disclosed', async () => {
  const snapshot = await build({ mixed_versions: true })
  assert.equal(snapshot.toCandidateJSON().mixed_versions, true)
  for (const field of ['mode', 'content_version', 'taxonomy_version', 'trigger_taxonomy_version']) {
    assert.ok(ProgressSnapshot.schema.path(field), `${field} must be recorded on the snapshot`)
  }
})

/* ------------------------------------------------------------------ *
 * 7-11  what may leave the document
 * ------------------------------------------------------------------ */

test('the learner projection publishes the agreed keys and nothing else', async () => {
  const snapshot = await build()
  assert.deepEqual(Object.keys(snapshot.toCandidateJSON()).sort(), [
    'attempt_count', 'best_score', 'by_family', 'by_platform', 'generated_at',
    'last_score', 'max_score', 'mixed_versions', 'scenarios_completed',
  ])
})

test('the projection carries no ObjectId - not the snapshot id, not the profile id', async () => {
  const snapshot = await build()
  const text = JSON.stringify(snapshot.toCandidateJSON())

  assert.ok(!text.includes(snapshot._id.toString()))
  assert.ok(!text.includes(snapshot.profile_id.toString()))
  for (const field of ['_id', 'id', 'profile_id', '__v', 'createdAt', 'updatedAt']) {
    assert.ok(!text.includes(`"${field}"`), `the projection exposed "${field}"`)
  }
})

test('an aggregate bucket is counts and points only - never an answer key', async () => {
  const snapshot = await build()
  const [platform] = snapshot.toCandidateJSON().by_platform
  assert.deepEqual(Object.keys(platform).sort(),
    ['key', 'label', 'max_points', 'points', 'scenarios'])
})

/**
 * A family bucket is published across every attempt the learner ever takes. Carrying
 * `missed_threats` there would state, permanently, that the family is malicious - a
 * standing per-family disposition oracle. The per-attempt result screen may say it about
 * scenarios just completed; a cross-attempt profile may not.
 */
test('the schema cannot hold a disposition, difficulty or trigger signal', () => {
  /**
   * `trigger_taxonomy_version` is exempt and is not trigger information: it is one of the
   * four `COMPARABILITY_FIELDS`, a version string recorded so a mixed history can be
   * disclosed. It names no trigger and belongs to no scenario.
   */
  const paths = Object.keys(ProgressSnapshot.schema.paths)
    .filter((p) => p !== 'trigger_taxonomy_version')

  for (const forbidden of ['disposition', 'malicious', 'legitimate', 'difficulty', 'level',
    'trigger', 'missed_threat', 'false_positive', 'outcome',
    'seed', 'selection', 'event', 'points_delta', 'scenario_id', 'answer', 'vulnerab']) {
    assert.ok(!paths.some((p) => p.toLowerCase().includes(forbidden)),
      `the snapshot schema declares a field matching "${forbidden}"`)
  }
})

test('no forbidden value survives into the published projection', async () => {
  const snapshot = await build()
  const text = JSON.stringify(snapshot.toCandidateJSON()).toLowerCase()
  for (const forbidden of ['disposition', 'difficulty', 'trigger', 'points_delta', 'seed',
    'outcome_code', 'evaluation', 'expected_safe_behavior', 'answer']) {
    assert.ok(!text.includes(forbidden), `the projection leaked "${forbidden}"`)
  }
})
