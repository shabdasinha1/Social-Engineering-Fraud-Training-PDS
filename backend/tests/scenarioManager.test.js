import assert from 'node:assert/strict'
import test from 'node:test'
import {
  takeAuthorableFields,
  toAuthoringSnapshot,
  validateForPublication,
  validateSyntheticSafety,
} from '../src/services/scenarioManagerService.js'
import {
  AUTHORABLE_FIELDS,
  SERVER_CONTROLLED_FIELDS,
  lifecycleOf,
} from '../src/constants/scenarioLifecycle.js'
import { ScenarioDefinition } from '../src/models/ScenarioDefinition.js'
import {
  loadSourceScenarios,
  loadTaxonomies,
  loadSyntheticContent,
  toScenarioDefinition,
} from '../src/services/scenarioDefinitionImportService.js'

/**
 * ADMIN-001 - the authoring rules, with no database.
 *
 * The input boundary, the synthetic-safety checks and the snapshot used by both clone and
 * edit-as-new-version are all pure, so they are tested without a server or a replica set.
 * The lifecycle, the transactions and the audit entries are proven in
 * `scenarioManagerApi.test.js`.
 */

/** A real, valid definition built through the production import path. */
const taxonomies = await loadTaxonomies()
const { scenarios } = await loadSourceScenarios()
const { byScenario } = await loadSyntheticContent()
const REAL = toScenarioDefinition(
  scenarios.find((s) => s.scenario_id === 'W01'),
  taxonomies,
  { version: 1, active: false, synthetic: byScenario.get('W01') ?? null },
).doc

/**
 * A fresh document per call.
 *
 * Deep-cloned deliberately: a shallow spread shares the nested `synthetic.assets`, so one
 * test mutating an asset body would leak into every test that ran after it.
 */
const definition = (over = {}) => new ScenarioDefinition({ ...structuredClone(REAL), ...over })

/* ------------------------------------------------------------------ *
 * 1-7  the input boundary
 * ------------------------------------------------------------------ */

test('an authorable payload passes through unchanged', () => {
  const body = { platform: 'whatsapp', level: 'easy', owner: 'instructor' }
  assert.deepEqual(takeAuthorableFields(body), body)
})

test('a server-controlled field is rejected, not ignored', () => {
  for (const field of SERVER_CONTROLLED_FIELDS) {
    assert.throws(
      () => takeAuthorableFields({ platform: 'whatsapp', [field]: 'anything' }),
      (error) => {
        assert.equal(error.code, 'FORBIDDEN_FIELD')
        assert.deepEqual(error.details.rejected_fields, [field])
        return true
      },
      `"${field}" was accepted from the client`,
    )
  }
})

/**
 * Ignoring would be quieter and worse: a client that thinks it set `active: true` and got
 * a 200 has been misled about whether its scenario is live.
 */
test('lifecycle cannot be forged through the authoring payload', () => {
  for (const forged of [
    { active: true }, { lifecycle_state: 'published' }, { published_at: new Date() },
    { version: 9 }, { _id: '000000000000000000000001' },
  ]) {
    assert.throws(() => takeAuthorableFields(forged), (error) => error.code === 'FORBIDDEN_FIELD')
  }
})

test('an unknown field is rejected rather than silently persisted', () => {
  assert.throws(
    () => takeAuthorableFields({ platform: 'whatsapp', notes: 'free text', payload: {} }),
    (error) => {
      assert.equal(error.code, 'FORBIDDEN_FIELD')
      assert.deepEqual(error.details.rejected_fields, ['notes', 'payload'])
      return true
    },
  )
})

test('scenario_id is accepted only when a scenario is created', () => {
  assert.deepEqual(
    takeAuthorableFields({ scenario_id: 'W01' }, { allowScenarioId: true }),
    { scenario_id: 'W01' },
  )
  assert.throws(
    () => takeAuthorableFields({ scenario_id: 'W01' }),
    (error) => error.code === 'FORBIDDEN_FIELD',
  )
})

test('a payload must be an object', () => {
  for (const bad of [null, undefined, 'text', 42, ['a']]) {
    assert.throws(() => takeAuthorableFields(bad), (error) => error.code === 'FORBIDDEN_FIELD')
  }
})

test('the authorable list names no server-controlled field', () => {
  for (const field of AUTHORABLE_FIELDS) {
    assert.ok(!SERVER_CONTROLLED_FIELDS.includes(field),
      `"${field}" is both authorable and server-controlled`)
  }
})

/* ------------------------------------------------------------------ *
 * 8-11  the lifecycle
 * ------------------------------------------------------------------ */

/** The 100 imported scenarios carry no `lifecycle_state`; they are all active. */
test('a version written before the lifecycle field existed reads as published', () => {
  assert.equal(lifecycleOf({ active: true }), 'published')
  assert.equal(lifecycleOf({ active: false }), 'draft')
})

test('an explicit lifecycle state always wins over the inference', () => {
  assert.equal(lifecycleOf({ active: false, lifecycle_state: 'retired' }), 'retired')
  assert.equal(lifecycleOf({ active: true, lifecycle_state: 'published' }), 'published')
  assert.equal(lifecycleOf({ active: false, lifecycle_state: 'draft' }), 'draft')
})

/* ------------------------------------------------------------------ *
 * 12-16  the authoring snapshot
 * ------------------------------------------------------------------ */

/**
 * The snapshot is what both clone and edit-as-new-version copy, so anything it carries
 * across is carried into a brand-new document. Identity and lifecycle must not be.
 */
test('the snapshot carries authoring content and nothing else', () => {
  const snapshot = toAuthoringSnapshot(definition({ version: 3, active: true }))

  for (const forbidden of ['_id', 'id', 'version', 'active', 'lifecycle_state',
    'published_at', 'schema_version', 'createdAt', 'updatedAt', '__v', 'scenario_id']) {
    assert.ok(!(forbidden in snapshot), `the snapshot carried "${forbidden}"`)
  }
  assert.ok(snapshot.stages?.length === 6)
  assert.ok(snapshot.evaluation, 'the evaluation block is authoring content and must copy')
  assert.ok(snapshot.synthetic?.assets?.length > 0)
})

test('the snapshot does not mutate its source', () => {
  const source = definition()
  const before = JSON.stringify(source.toObject())
  toAuthoringSnapshot(source)
  assert.equal(JSON.stringify(source.toObject()), before)
})

/* ------------------------------------------------------------------ *
 * 17-24  synthetic asset safety
 * ------------------------------------------------------------------ */

test('the real imported content passes every synthetic check', () => {
  assert.deepEqual(validateSyntheticSafety(definition()), [])
})

test('an asset belonging to another scenario is rejected', () => {
  const doc = definition()
  doc.synthetic.assets[0].asset_id = 'W02-notif-01'
  const errors = validateSyntheticSafety(doc)
  assert.ok(errors.some((e) => /does not belong to W01/.test(e)), errors.join(' | '))
})

test('a duplicated asset id is rejected', () => {
  const doc = definition()
  const first = doc.synthetic.assets[0].asset_id
  doc.synthetic.assets[1].asset_id = first
  assert.ok(validateSyntheticSafety(doc).some((e) => /declared more than once/.test(e)))
})

test('a stage reference that resolves to nothing is rejected', () => {
  const doc = definition()
  doc.stages[0].asset_refs = ['W01-does-not-exist']
  assert.ok(validateSyntheticSafety(doc).some((e) => /unknown asset/.test(e)))
})

/** The authoring surface the importer never had: an administrator can type a target. */
test('an external target on an asset is rejected', () => {
  for (const target of [
    'https://evil.example.com.attacker.net/steal',
    'http://192.0.2.10/collect',
    'https://cdn.jsdelivr.net/logo.png',
    'www.real-bank.co.in/login',
  ]) {
    const doc = definition()
    doc.synthetic.assets[0].display_target = target
    const errors = validateSyntheticSafety(doc)
    assert.ok(
      errors.some((e) => /not a reserved training domain/.test(e)),
      `"${target}" was accepted: ${errors.join(' | ')}`,
    )
  }
})

test('a reserved training host on an asset is accepted', () => {
  for (const target of [
    'https://w01.training.example/verify',
    'https://unit.training.local/portal',
    'https://something.example/page',
  ]) {
    const doc = definition()
    doc.synthetic.assets[0].display_target = target
    assert.deepEqual(validateSyntheticSafety(doc), [], `"${target}" was rejected`)
  }
})

test('an embedded data URI on an asset is rejected', () => {
  const doc = definition()
  doc.synthetic.assets[0].display_target = 'data:image/png;base64,iVBORw0KGgo='
  assert.ok(validateSyntheticSafety(doc).some((e) => /embedded data URI/.test(e)))
})

test('an asset that is not inert is rejected', () => {
  const doc = definition()
  doc.synthetic.assets[0].inert = false
  assert.ok(validateSyntheticSafety(doc).some((e) => /not marked inert/.test(e)))
})

/** An external host typed anywhere inside an asset, not only in `display_target`. */
test('an external host buried in asset content is rejected', () => {
  const doc = definition()
  doc.synthetic.assets[0].content.body = 'Confirm at https://secure-login.attacker.io/verify now.'
  assert.ok(validateSyntheticSafety(doc).some((e) => /not a reserved training domain/.test(e)))
})

/* ------------------------------------------------------------------ *
 * 25-29  publication validation
 * ------------------------------------------------------------------ */

test('a complete imported scenario is publishable', async () => {
  const report = await validateForPublication(definition())
  assert.equal(report.ok, true, JSON.stringify(report.problems))
})

/** DATA-001 owns the six-stage rules; this proves the manager actually consults it. */
test('a broken six-stage graph cannot be published', async () => {
  const doc = definition()
  doc.stages[2].key = 'branch'
  const report = await validateForPublication(doc)

  assert.equal(report.ok, false)
  assert.ok(report.problems.some((p) => p.category === 'SCENARIO_VALIDATION_FAILED'))
})

test('a scenario with the wrong number of stages cannot be published', async () => {
  const doc = definition()
  doc.stages = doc.stages.slice(0, 5)
  const report = await validateForPublication(doc)
  assert.equal(report.ok, false)
})

test('a transition the six-stage model forbids cannot be published', async () => {
  const doc = definition()
  doc.stages[0].transitions = [{ on: 'open_item', to: 'resolve' }]
  const report = await validateForPublication(doc)
  assert.equal(report.ok, false)
})

test('a scenario carrying a live URL cannot be published', async () => {
  const doc = definition()
  doc.evaluation.feedback.safe_action = 'Log in at https://portal.realbank.co.in immediately.'
  const report = await validateForPublication(doc)

  assert.equal(report.ok, false)
  assert.ok(report.problems.some((p) => p.category === 'SCENARIO_UNSAFE_CONTENT'),
    JSON.stringify(report.problems))
})

test('a validation report names problems without echoing scenario content wholesale', async () => {
  const doc = definition()
  doc.stages = doc.stages.slice(0, 3)
  const report = await validateForPublication(doc)

  const text = JSON.stringify(report)
  assert.ok(!text.includes(doc.evaluation.title), 'the report echoed the scenario title')
  assert.ok(report.problems.length > 0)
})
