import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ARCHIVE_REASON_CODES,
  CONFIG_BODY_FIELDS,
  FEEDBACK_CONFIG_KEYS,
  FEEDBACK_KEY_FOR_MODE,
  FEEDBACK_TIMINGS,
  FEEDBACK_TIMING_DEFAULTS,
  RESET_BODY_FIELDS,
  RESET_REASON_CODES,
  RESET_SOURCE_STATUS,
  RESET_TARGET_STATUS,
} from '../src/constants/instructorControls.js'
import { ATTEMPT_MODES, ATTEMPT_STATUSES } from '../src/constants/scenarioSelection.js'
import { RUN_STATUSES } from '../src/constants/scenarioEngine.js'
import mongoose from 'mongoose'
import { Candidate } from '../src/models/Candidate.js'
import { ScenarioRun } from '../src/models/ScenarioRun.js'
import { Configuration } from '../src/models/Configuration.js'
import {
  ASSESSMENT_DURATION_DEFAULT_MINUTES,
  ASSESSMENT_DURATION_OPTIONS_MINUTES,
} from '../src/constants/attemptTiming.js'

/**
 * ADMIN-004 - the vocabulary, the schemas and the projections, without a database.
 *
 * What is decidable from the definitions alone is proven here: that the reset target is an
 * existing lifecycle state rather than an invented one, that the configuration surface is
 * two enums and cannot be widened, and that neither the profile nor the configuration
 * projection can leak. The transactional and HTTP behaviour is proven against a real
 * replica set in `instructorControlsApi.test.js`.
 */

/* ------------------------------------------------------------------ *
 * 1-5  the reset lifecycle is the existing one
 * ------------------------------------------------------------------ */

test('reset moves an attempt between two statuses the model already declares', () => {
  assert.ok(ATTEMPT_STATUSES.includes(RESET_SOURCE_STATUS))
  assert.ok(ATTEMPT_STATUSES.includes(RESET_TARGET_STATUS))
  assert.equal(RESET_SOURCE_STATUS, 'in_progress')
  assert.equal(RESET_TARGET_STATUS, 'abandoned')
  // No new attempt status was invented.
  assert.deepEqual(ATTEMPT_STATUSES, ['in_progress', 'completed', 'abandoned'])
})

test('the run status a reset writes is one the engine already produces', () => {
  assert.ok(RUN_STATUSES.includes(RESET_TARGET_STATUS))
  assert.deepEqual(RUN_STATUSES, ['active', 'resolved', 'abandoned'])
})

test('a reset request accepts two optional fields and nothing else', () => {
  assert.deepEqual(RESET_BODY_FIELDS, ['reason_code', 'idempotency_key'])
  for (const forbidden of ['status', 'total_score', 'score', 'completed_at', 'profile_id',
    'scenario_sequence', 'seed', 'runs', 'events']) {
    assert.ok(!RESET_BODY_FIELDS.includes(forbidden),
      `a reset must not accept "${forbidden}"`)
  }
})

test('reset and archive reasons are closed vocabularies, not free text', () => {
  for (const list of [RESET_REASON_CODES, ARCHIVE_REASON_CODES]) {
    assert.ok(list.length >= 3)
    for (const code of list) assert.match(code, /^[a-z][a-z_]*$/)
  }
})

test('an abandoned run may not carry a score, so a reset cannot invent one', async () => {
  const base = {
    attempt_id: new mongoose.Types.ObjectId(),
    ordinal: 1,
    scenario_id: 'W01',
    definition_version: 1,
    platform: 'whatsapp',
    started_at: new Date(),
  }

  // A reset only ever moves an UNRESOLVED run, whose score is already null. That run
  // validates in the abandoned state...
  await new ScenarioRun({ ...base, status: RESET_TARGET_STATUS }).validate()

  // ...and ENGINE-001's own validator refuses an abandoned run that carries a score, so a
  // reset could not write one even if it tried.
  await assert.rejects(
    new ScenarioRun({ ...base, status: RESET_TARGET_STATUS, score_0_10: 7 }).validate(),
    /only a resolved run may carry a final score/,
  )
})

/* ------------------------------------------------------------------ *
 * 6-9  the profile archive shape
 * ------------------------------------------------------------------ */

test('the profile carries three additive archival fields and no new identity field', () => {
  const paths = Object.keys(Candidate.schema.paths)
  for (const field of ['archived', 'archived_at', 'archived_by']) {
    assert.ok(paths.includes(field), `Candidate is missing "${field}"`)
  }
  for (const field of ['phone', 'email', 'rank', 'unit', 'aadhaar', 'biometric',
    'password', 'password_hash', 'dob']) {
    assert.ok(!paths.includes(field), `Candidate must not carry "${field}"`)
  }
})

test('a profile is active by default, so no backfill was needed', () => {
  const profile = new Candidate({ name: 'Test Learner', identifier: 'IC45872H' })
  assert.equal(profile.archived, false)
  assert.equal(profile.archived_at, null)
  assert.equal(profile.archived_by, null)
})

test('archival is a flag, not a deletion: nothing about the profile is removed', () => {
  const profile = new Candidate({ name: 'Test Learner', identifier: 'IC45872H' })
  profile.archived = true
  profile.archived_at = new Date()
  assert.equal(profile.name, 'Test Learner')
  assert.equal(profile.identifier, 'IC45872H')
  assert.deepEqual(profile.seenScenarios, [])
})

test('the public profile projection still publishes no archival or identity internals', () => {
  const profile = new Candidate({ name: 'Test Learner', identifier: 'IC45872H' })
  profile.archived = true
  const json = profile.toPublicJSON()

  // PROFILE-001 replaced `{id, name, identifier}` with the authoritative LearnerProfile
  // projection: the ObjectId and the raw service number are no longer sent to the learner.
  assert.deepEqual(Object.keys(json).sort(),
    ['briefing', 'created_at', 'display_name', 'last_seen_at', 'service_no_masked'])

  const text = JSON.stringify(json)
  assert.ok(!text.includes('IC45872H'), 'the unmasked service number was published')
  for (const field of ['id', 'profile_id', '_id', 'identifier', 'identifierNormalised',
    'seenScenarios', 'archived', 'archived_at', 'archived_by', 'password', 'phone',
    'email', 'rank', 'aadhaar', 'otp', 'unit']) {
    assert.ok(!text.includes(`"${field}"`), `the profile exposed "${field}"`)
  }
})

/* ------------------------------------------------------------------ *
 * 10-16  the configuration surface
 * ------------------------------------------------------------------ */

test('the configuration surface is two enum fields plus the assessment duration', () => {
  assert.deepEqual(FEEDBACK_CONFIG_KEYS,
    ['training_feedback_timing', 'assessment_feedback_timing'])

  const paths = Object.keys(Configuration.schema.paths)
    .filter((p) => !['_id', '__v', 'createdAt', 'updatedAt'].includes(p))
  assert.deepEqual(paths.sort(), [
    'assessment_duration_minutes', 'assessment_feedback_timing', 'config_version', 'scope',
    'training_feedback_timing', 'updated_by', 'updated_by_username',
  ])
})

test('an administrator cannot configure scoring, taxonomy, selection or security', () => {
  const paths = Object.keys(Configuration.schema.paths)
  for (const forbidden of ['scoring', 'points', 'score', 'canonical_family',
    'canonical_triggers', 'taxonomy_version', 'selection', 'seed', 'evaluation',
    'cors', 'host', 'port', 'session_secret', 'network', 'settings', 'metadata']) {
    assert.ok(!paths.includes(forbidden), `configuration must not carry "${forbidden}"`)
  }
})

test('only the two documented timings exist', () => {
  assert.deepEqual(FEEDBACK_TIMINGS, ['immediate', 'on_completion'])
})

test('the schema refuses a timing outside the enum', async () => {
  await assert.rejects(
    new Configuration({ scope: 'instructor', training_feedback_timing: 'whenever' }).validate(),
    /training_feedback_timing/,
  )
})

test('the schema refuses an unknown field outright rather than dropping it', () => {
  assert.throws(
    () => new Configuration({ scope: 'instructor', scoring_multiplier: 2 }),
    /scoring_multiplier/,
  )
})

test('the defaults are what the server actually does today', () => {
  const config = new Configuration({})
  assert.equal(config.scope, 'instructor')
  assert.equal(config.training_feedback_timing, FEEDBACK_TIMING_DEFAULTS.training)
  assert.equal(config.assessment_feedback_timing, FEEDBACK_TIMING_DEFAULTS.assessment)
  assert.equal(config.config_version, 1)
  // Both are on_completion because no server surface releases feedback mid-attempt.
  assert.equal(FEEDBACK_TIMING_DEFAULTS.training, 'on_completion')
  assert.equal(FEEDBACK_TIMING_DEFAULTS.assessment, 'on_completion')
})

test('every attempt mode maps to exactly one configuration key', () => {
  for (const mode of ATTEMPT_MODES) {
    assert.ok(FEEDBACK_CONFIG_KEYS.includes(FEEDBACK_KEY_FOR_MODE[mode]),
      `mode "${mode}" has no configuration key`)
  }
  assert.equal(Object.keys(FEEDBACK_KEY_FOR_MODE).length, ATTEMPT_MODES.length)
})

/* ------------------------------------------------------------------ *
 * 17-19  projections
 * ------------------------------------------------------------------ */

test('the configuration projection is an allowlist and carries no admin credential', () => {
  const config = new Configuration({ scope: 'instructor' })
  config.updated_by_username = 'instructor'
  const json = config.toAdminJSON()

  assert.deepEqual(Object.keys(json).sort(), [
    'assessment_duration_minutes', 'assessment_feedback_timing', 'config_version',
    'training_feedback_timing', 'updated_at', 'updated_by', 'updated_by_username',
  ])
  const text = JSON.stringify(json)
  for (const field of ['password', 'password_hash', 'passwordHash', 'salt', 'secret',
    'scope', '_id', '__v']) {
    assert.ok(!text.includes(`"${field}"`), `configuration exposed "${field}"`)
  }
})

test('a configuration update accepts only the documented fields', () => {
  assert.deepEqual(CONFIG_BODY_FIELDS.sort(), [
    'assessment_feedback_timing', 'expected_config_version', 'idempotency_key',
    'training_feedback_timing',
  ])
})

test('the reset target status closes every learner query that asks for in_progress', () => {
  // The property the whole reset design rests on: the two statuses differ, so every
  // existing `{status: 'in_progress'}` query excludes a reset attempt without any change.
  assert.notEqual(RESET_TARGET_STATUS, RESET_SOURCE_STATUS)
})

/* ------------------------------------------------------------------ *
 * Assessment duration (Admin -> Settings)
 * ------------------------------------------------------------------ */

test('the assessment duration defaults to 30 minutes and allows only five values', async () => {
  assert.deepEqual(ASSESSMENT_DURATION_OPTIONS_MINUTES, [30, 45, 60, 75, 90])
  assert.equal(ASSESSMENT_DURATION_DEFAULT_MINUTES, 30)
  assert.equal(new Configuration({ scope: 'instructor' }).assessment_duration_minutes, 30)

  for (const minutes of ASSESSMENT_DURATION_OPTIONS_MINUTES) {
    await new Configuration({ scope: 'instructor', assessment_duration_minutes: minutes }).validate()
  }
  for (const minutes of [0, 15, 29, 46, 61, 120, 240, -30, 45.5]) {
    await assert.rejects(
      () => new Configuration({ scope: 'instructor', assessment_duration_minutes: minutes }).validate(),
      /assessment_duration_minutes/,
      `${minutes} must be refused`,
    )
  }
})
