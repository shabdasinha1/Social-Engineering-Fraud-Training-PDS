import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  CANONICAL_FAMILIES,
  CANONICAL_TRIGGERS,
  STAGE_KEYS,
} from '../src/constants/scenarioDefinition.js'
import { ScenarioDefinition } from '../src/models/ScenarioDefinition.js'
import {
  EXPECTED,
  bankFingerprint,
  contentFingerprint,
  loadSourceScenarios,
  loadTaxonomies,
  normaliseTrigger,
  parseScoring,
  toScenarioDefinition,
  validateDataset,
  validateOfflineSafety,
} from '../src/services/scenarioDefinitionImportService.js'

/**
 * DATA-002 import tests.
 *
 * No database. Everything here exercises the real client dataset in
 * backend/data/scenarios/v1/ and the real taxonomy artifacts, through the same
 * pure functions the importer uses. Matches the existing DB-free suite.
 */

const { manifest, scenarios } = await loadSourceScenarios()
const taxonomies = await loadTaxonomies()
const docs = scenarios.map((r) => toScenarioDefinition(r, taxonomies).doc)
const byId = Object.fromEntries(docs.map((d) => [d.scenario_id, d]))
const srcById = Object.fromEntries(scenarios.map((r) => [r.scenario_id, r]))

const clone = (o) => structuredClone(o)

/* ------------------------------------------------------------------ *
 * 1-5  source dataset shape and acceptance counts
 * ------------------------------------------------------------------ */

test('exactly 100 client scenarios load from the source dataset', () => {
  assert.equal(scenarios.length, EXPECTED.total)
  assert.equal(manifest.scenario_count, EXPECTED.total)
})

test('all scenario ids are unique and match the client numbering', () => {
  const ids = scenarios.map((r) => r.scenario_id)
  assert.equal(new Set(ids).size, 100)
  const expected = ['W', 'I', 'E', 'S'].flatMap((p) =>
    Array.from({ length: 25 }, (_, i) => `${p}${String(i + 1).padStart(2, '0')}`))
  assert.deepEqual([...ids].sort(), expected.sort())
})

test('platform totals are 25 / 25 / 25 / 25', () => {
  const counts = docs.reduce((a, d) => ({ ...a, [d.platform]: (a[d.platform] ?? 0) + 1 }), {})
  assert.deepEqual(counts, { whatsapp: 25, instagram: 25, email: 25, sms: 25 })
})

test('disposition totals are 80 malicious / 20 legitimate', () => {
  const counts = docs.reduce((a, d) => ({ ...a, [d.disposition]: (a[d.disposition] ?? 0) + 1 }), {})
  assert.deepEqual(counts, { malicious: 80, legitimate: 20 })
})

test('every platform carries 8 easy, 9 medium and 8 hard', () => {
  for (const platform of ['whatsapp', 'instagram', 'email', 'sms']) {
    const counts = docs.filter((d) => d.platform === platform)
      .reduce((a, d) => ({ ...a, [d.level]: (a[d.level] ?? 0) + 1 }), {})
    assert.deepEqual(counts, { easy: 8, medium: 9, hard: 8 }, platform)
  }
})

test('the dataset validator accepts the real bank', () => {
  assert.deepEqual(validateDataset(docs), [])
})

/* ------------------------------------------------------------------ *
 * 6-7  six stages
 * ------------------------------------------------------------------ */

test('every scenario has exactly six stages in the canonical order', () => {
  for (const d of docs) {
    assert.equal(d.stages.length, 6, d.scenario_id)
    assert.equal(d.evaluation.stages.length, 6, d.scenario_id)
    assert.deepEqual(d.stages.map((s) => s.key), STAGE_KEYS, d.scenario_id)
    assert.deepEqual(d.evaluation.stages.map((s) => s.key), STAGE_KEYS, d.scenario_id)
    assert.deepEqual(d.stages.map((s) => s.index), [1, 2, 3, 4, 5, 6], d.scenario_id)
  }
})

test('the client source keeps the six stages the specification names', () => {
  const labels = ['Event', 'Open', 'Inspect', 'Branch', 'Verify', 'Resolve']
  for (const r of scenarios) {
    assert.deepEqual(r.stages.map((s) => s.pdf_label), labels, r.scenario_id)
    assert.deepEqual(r.stages.map((s) => s.number), [1, 2, 3, 4, 5, 6], r.scenario_id)
  }
})

test('every stage carries all four client content columns', () => {
  for (const r of scenarios) {
    for (const s of r.stages) {
      for (const k of ['learner_flow', 'ui_to_build', 'expected_safe_behavior', 'scoring_event']) {
        assert.ok(s[k]?.trim(), `${r.scenario_id} stage ${s.number}: empty ${k}`)
      }
    }
  }
})

/* ------------------------------------------------------------------ *
 * 8-11  taxonomy mapping
 * ------------------------------------------------------------------ */

test('every raw client family maps to a canonical family', () => {
  const map = taxonomies.family.raw_family_to_canonical
  for (const r of scenarios) {
    assert.ok(map[r.family], `${r.scenario_id}: unmapped family "${r.family}"`)
  }
})

test('every canonical family is in the approved taxonomy and matches disposition', () => {
  for (const d of docs) {
    assert.ok(CANONICAL_FAMILIES.includes(d.canonical_family), d.scenario_id)
    const isLegit = d.canonical_family.startsWith('legit_')
    assert.equal(isLegit, d.disposition === 'legitimate', d.scenario_id)
  }
})

test('every raw trigger primitive maps, with no unused alias entries', () => {
  const alias = taxonomies.trigger.raw_primitive_to_canonical
  const seen = new Set()
  for (const r of scenarios) {
    for (const piece of r.trigger.split('|')[0].split('+')) {
      const key = piece.trim().replace(/\s+/g, ' ').toLowerCase()
      assert.ok(alias[key], `${r.scenario_id}: unmapped trigger primitive "${key}"`)
      seen.add(key)
    }
  }
  assert.deepEqual([...Object.keys(alias)].filter((k) => !seen.has(k)), [],
    'the alias table should contain no entry the bank does not use')
})

test('every canonical trigger is valid, ordered and de-duplicated', () => {
  for (const d of docs) {
    assert.ok(d.canonical_triggers.length > 0, d.scenario_id)
    assert.equal(new Set(d.canonical_triggers).size, d.canonical_triggers.length, d.scenario_id)
    for (const t of d.canonical_triggers) {
      assert.ok(CANONICAL_TRIGGERS.includes(t), `${d.scenario_id}: bad trigger "${t}"`)
    }
  }
})

test('the whole canonical vocabulary is exercised by the bank', () => {
  const families = new Set(docs.map((d) => d.canonical_family))
  const triggers = new Set(docs.flatMap((d) => d.canonical_triggers))
  assert.equal(families.size, 19)
  assert.equal(triggers.size, 22)
})

/* ------------------------------------------------------------------ *
 * 12-14  trigger normalisation
 * ------------------------------------------------------------------ */

const alias = () => taxonomies.trigger.raw_primitive_to_canonical

test('multi-word trigger primitives are never split on whitespace', () => {
  assert.deepEqual(
    taxonomies.trigger.multiword_primitives.sort(),
    ['expert status', 'social proof', 'social validation', 'time pressure'],
  )
  assert.deepEqual(
    normaliseTrigger('Expert status + flattery', alias()).canonical_triggers,
    ['expert_status', 'flattery'],
  )
  assert.deepEqual(
    normaliseTrigger('Greed + social proof', alias()).canonical_triggers,
    ['greed', 'social_proof'],
  )
  // I20 in the real bank is the case this protects.
  assert.deepEqual(byId.I20.canonical_triggers, ['expert_status', 'flattery'])
})

test('the military suffix is parsed and never treated as a trigger', () => {
  const r = normaliseTrigger('Familiarity | FICTIONAL MILITARY CONTEXT', alias())
  assert.equal(r.military_flag, true)
  assert.deepEqual(r.canonical_triggers, ['familiarity'])
  assert.deepEqual(r.errors, [])

  const plain = normaliseTrigger('Familiarity', alias())
  assert.equal(plain.military_flag, false)
})

test('military_flag matches the raw trigger for all 100 scenarios', () => {
  let military = 0
  for (const d of docs) {
    const expected = d.trigger.includes('| FICTIONAL MILITARY CONTEXT')
    assert.equal(d.military_flag, expected, d.scenario_id)
    if (expected) military += 1
  }
  assert.equal(military, 35, 'the bank declares 35 military-context scenarios')
})

test('military counts match the platform index pages of the specification', () => {
  const counts = docs.filter((d) => d.military_flag)
    .reduce((a, d) => ({ ...a, [d.platform]: (a[d.platform] ?? 0) + 1 }), {})
  assert.deepEqual(counts, { whatsapp: 10, instagram: 12, email: 8, sms: 5 })
})

test('trigger order follows the client string, it is not sorted', () => {
  assert.deepEqual(
    normaliseTrigger('Urgency + authority', alias()).canonical_triggers,
    ['urgency', 'authority'],
  )
  assert.deepEqual(
    normaliseTrigger('Authority + urgency', alias()).canonical_triggers,
    ['authority', 'urgency'],
  )
})

test('a repeated primitive collapses to one canonical id', () => {
  const r = normaliseTrigger('Authority + time pressure + urgency', alias())
  assert.deepEqual(r.canonical_triggers, ['authority', 'urgency'])
})

/* ------------------------------------------------------------------ *
 * 15-17  version, uniqueness, determinism
 * ------------------------------------------------------------------ */

test('every document carries a valid version and explicit active flag', () => {
  for (const d of docs) {
    assert.equal(d.version, 1, d.scenario_id)
    assert.equal(typeof d.active, 'boolean', d.scenario_id)
  }
  assert.equal(manifest.scenario_version, 1)
})

test('(scenario_id, version) is unique across the derived bank', () => {
  const keys = docs.map((d) => `${d.scenario_id}@${d.version}`)
  assert.equal(new Set(keys).size, keys.length)
  const idx = ScenarioDefinition.schema.indexes()
    .find(([f, o]) => f.scenario_id === 1 && f.version === 1 && o?.unique)
  assert.ok(idx, 'the unique index backing idempotent upsert must exist')
})

test('normalisation is deterministic - the same source yields the same documents', () => {
  const again = scenarios.map((r) => toScenarioDefinition(r, taxonomies).doc)
  assert.equal(JSON.stringify(again), JSON.stringify(docs))
})

test('a version other than 1 can be produced without touching content', () => {
  const { doc } = toScenarioDefinition(srcById.W01, taxonomies, { version: 2, active: false })
  assert.equal(doc.version, 2)
  assert.equal(doc.active, false)
  assert.equal(doc.family, byId.W01.family)
  assert.equal(doc.trigger, byId.W01.trigger)
})

/* ------------------------------------------------------------------ *
 * 18-22  rejection paths
 * ------------------------------------------------------------------ */

test('an unknown trigger primitive is rejected, not guessed', () => {
  const r = normaliseTrigger('Authority + telepathy', alias())
  assert.equal(r.canonical_triggers.includes('authority'), true)
  assert.match(r.errors.join(' '), /telepathy.*no entry/)
})

test('an unrecognised military suffix is rejected', () => {
  const r = normaliseTrigger('Authority | CIVILIAN CONTEXT', alias())
  assert.match(r.errors.join(' '), /unrecognised trigger suffix/)
})

test('an unmapped raw family is rejected, not matched to the nearest one', () => {
  const bad = clone(srcById.W01)
  bad.family = 'Some family the client never wrote'
  const { errors } = toScenarioDefinition(bad, taxonomies)
  assert.match(errors.join(' '), /no entry in the attack-family taxonomy/)
})

test('a malformed scenario fails normalisation', () => {
  const bad = clone(srcById.W01)
  bad.platform = 'Telegram'
  bad.difficulty = 'Extreme'
  const { errors } = toScenarioDefinition(bad, taxonomies)
  assert.match(errors.join(' '), /unknown platform/)
  assert.match(errors.join(' '), /unknown difficulty/)
})

test('a scenario with a missing stage fails normalisation', () => {
  const bad = clone(srcById.W01)
  bad.stages = bad.stages.slice(0, 5)
  const { errors } = toScenarioDefinition(bad, taxonomies)
  assert.match(errors.join(' '), /expected 6 stages, found 5/)
})

test('an unrecognised scoring clause is rejected rather than ignored', () => {
  const r = parseScoring('SAFE_PIVOT +3; teleport the learner -9.')
  assert.match(r.errors.join(' '), /unrecognised scoring clause "teleport the learner -9"/)
})

test('dataset-level count mismatches are caught before any write', () => {
  assert.match(validateDataset(docs.slice(0, 99)).join(' '), /expected 100 scenarios, found 99/)

  const wrongMix = docs.map((d, i) => (i < 5 ? { ...d, disposition: 'legitimate' } : d))
  assert.match(validateDataset(wrongMix).join(' '), /expected 80 malicious/)

  const dupes = [...docs.slice(0, 99), { ...docs[0] }]
  assert.match(validateDataset(dupes).join(' '), /duplicate scenario ids/)
})

test('a non-reserved network target is rejected by the offline check', () => {
  const bad = clone(srcById.W01)
  bad.stages[3].learner_flow = 'The learner is sent to https://real-bank.com/login to sign in.'
  const errors = validateOfflineSafety(bad)
  assert.match(errors.join(' '), /contains a URL/)

  const host = clone(srcById.W01)
  host.stages[3].ui_to_build = 'Browser page for portal.realbank.co.in'
  assert.match(validateOfflineSafety(host).join(' '), /not a reserved training domain/)

  const mail = clone(srcById.W01)
  mail.feedback = 'Contact security@realcompany.com for help.'
  assert.match(validateOfflineSafety(mail).join(' '), /contains an email address/)
})

test('the real client bank passes the offline / synthetic check', () => {
  const errors = scenarios.flatMap((r) => validateOfflineSafety(r))
  assert.deepEqual(errors, [], 'client content must contain no reachable network target')
})

test('the only host in the client bank is a reserved training domain', () => {
  const text = scenarios.flatMap((r) => [r.title, r.end_state, r.feedback,
    ...r.stages.flatMap((s) => [s.learner_flow, s.ui_to_build, s.expected_safe_behavior])]).join(' ')
  const hosts = new Set((text.match(/\b[a-z0-9-]+\.(?:com|net|org|in|io|co|example|local|invalid|test)\b/gi) ?? [])
    .map((h) => h.toLowerCase()))
  assert.deepEqual([...hosts], ['training.example'])
})

/* ------------------------------------------------------------------ *
 * 23  candidate security
 * ------------------------------------------------------------------ */

test('candidate serialisation exposes no evaluation or classification data', () => {
  for (const scenarioId of ['W01', 'W03', 'I20', 'E25', 'S25']) {
    const model = new ScenarioDefinition(byId[scenarioId])
    const json = model.toCandidateJSON()
    const text = JSON.stringify(json)
    const src = srcById[scenarioId]

    for (const field of ['evaluation', 'title', 'level', 'disposition', 'family',
      'canonical_family', 'trigger', 'canonical_triggers', 'military_flag']) {
      assert.ok(!(field in json), `${scenarioId}: candidate payload exposed "${field}"`)
    }
    for (const secret of [src.title, src.family, src.trigger, src.end_state, src.feedback,
      src.stages[5].expected_safe_behavior]) {
      assert.ok(!text.includes(secret), `${scenarioId}: candidate payload leaked "${secret.slice(0, 40)}"`)
    }
    assert.equal(json.stages.length, 6)
  }
})

test('all 100 derived documents pass full schema validation', async () => {
  for (const d of docs) {
    await new ScenarioDefinition(d).validate()
  }
})

/* ------------------------------------------------------------------ *
 * 24-27  representative scenarios import correctly
 * ------------------------------------------------------------------ */

test('a malicious scenario imports with its client content intact (W01)', () => {
  const d = byId.W01
  const s = srcById.W01
  assert.equal(d.disposition, 'malicious')
  assert.equal(d.family, 'Account takeover / OTP theft')
  assert.equal(d.canonical_family, 'account_takeover_authorisation_abuse')
  assert.equal(d.trigger, s.trigger)
  assert.equal(d.evaluation.title, s.title)
  assert.equal(d.evaluation.end_state, s.end_state)
  assert.equal(d.evaluation.stages[0].learner_flow, s.stages[0].learner_flow)
  assert.equal(d.evaluation.stages[3].scoring_text, s.stages[3].scoring_event)
  const codes = d.evaluation.stages[3].scoring.map((x) => x.event_code)
  assert.deepEqual(codes, ['SAFE_PIVOT', 'RISKY_OPEN_REPLY', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE'])
})

test('a legitimate scenario imports with the legitimate scoring vocabulary (W03)', () => {
  const d = byId.W03
  assert.equal(d.disposition, 'legitimate')
  assert.equal(d.legitimate_control, true)
  assert.equal(d.canonical_family, 'legit_coordination_request')
  assert.deepEqual(d.evaluation.stages[3].scoring.map((x) => x.event_code),
    ['CORRECT_USE', 'NEEDLESS_REJECT_IGNORE', 'UNSAFE_EXTERNAL_ACTION'])
  assert.deepEqual(d.evaluation.stages[4].scoring.map((x) => x.event_code),
    ['TRUSTED_VERIFY', 'FALSE_REPORT_BLOCK', 'VERIFY_THROUGH_MESSAGE'])
})

test('a military-context scenario imports with the flag set and the marker preserved (W19)', () => {
  const d = byId.W19
  assert.equal(d.military_flag, true)
  assert.ok(d.trigger.endsWith('| FICTIONAL MILITARY CONTEXT'))
  assert.equal(d.canonical_family, 'operational_elicitation')
  assert.ok(!d.canonical_triggers.some((t) => t.includes('fictional')))
})

test('a multi-trigger scenario imports every canonical trigger (W12)', () => {
  const d = byId.W12
  assert.equal(d.trigger, 'Fear + authority + isolation')
  assert.deepEqual(d.canonical_triggers, ['fear', 'authority', 'isolation_secrecy'])
  assert.equal(d.canonical_family, 'coercion_and_extortion')
})

test('87 scenarios carry more than one canonical trigger', () => {
  assert.equal(docs.filter((d) => d.canonical_triggers.length > 1).length, 87)
})

/* ------------------------------------------------------------------ *
 * scoring vocabulary across the whole bank
 * ------------------------------------------------------------------ */

test('every stage of every scenario parses to at least one scoring event', () => {
  for (const d of docs) {
    for (const s of d.evaluation.stages) {
      assert.ok(s.scoring.length > 0, `${d.scenario_id} stage ${s.index}`)
    }
  }
})

test('the safe path of every scenario sums to exactly 10', () => {
  const SAFE = new Set(['INSPECT_CONTEXT', 'SAFE_PIVOT', 'CORRECT_USE', 'TRUSTED_VERIFY', 'RESOLVE_CORRECT'])
  for (const d of docs) {
    const total = d.evaluation.stages
      .flatMap((s) => s.scoring)
      .filter((x) => SAFE.has(x.event_code))
      .reduce((n, x) => n + x.points_delta, 0)
    assert.equal(total, 10, `${d.scenario_id} safe path`)
  }
})

/* ------------------------------------------------------------------ *
 * 18  content integrity
 * ------------------------------------------------------------------ */

test('the manifest fingerprint matches the source dataset', () => {
  assert.equal(bankFingerprint(scenarios), manifest.content_sha256)
  for (const r of scenarios) {
    assert.equal(contentFingerprint(r), manifest.scenario_content_sha256[r.scenario_id], r.scenario_id)
    assert.equal(contentFingerprint(r), r.content_sha256, `${r.scenario_id} inline digest`)
  }
})

test('the fingerprint detects an edit to any client content field', () => {
  const original = contentFingerprint(srcById.W01)
  const edits = [
    (r) => { r.title = 'Reworded title' },
    (r) => { r.family = 'Reworded family' },
    (r) => { r.trigger = 'Authority' },
    (r) => { r.feedback = 'Improved feedback' },
    (r) => { r.end_state = 'Different end state' },
    (r) => { r.stages[2].learner_flow = 'Paraphrased content' },
    (r) => { r.stages[3].scoring_event = 'SAFE_PIVOT +9.' },
    (r) => { r.difficulty = 'Hard' },
  ]
  for (const edit of edits) {
    const copy = clone(srcById.W01)
    edit(copy)
    assert.notEqual(contentFingerprint(copy), original, 'an edit must change the fingerprint')
  }
})

test('the fingerprint ignores provenance and database fields', () => {
  const copy = clone(srcById.W01)
  copy.source_page = 999
  copy._id = 'abc'
  copy.createdAt = new Date().toISOString()
  copy.updatedAt = new Date().toISOString()
  assert.equal(contentFingerprint(copy), contentFingerprint(srcById.W01))
})

test('a missing or extra scenario changes the bank fingerprint', () => {
  assert.notEqual(bankFingerprint(scenarios.slice(0, 99)), manifest.content_sha256)
  assert.notEqual(bankFingerprint([...scenarios, clone(srcById.W01)]), manifest.content_sha256)
})

/* ------------------------------------------------------------------ *
 * legacy isolation
 * ------------------------------------------------------------------ */

test('the importer never references the legacy Scenario pipeline', async () => {
  const file = path.resolve(fileURLToPath(new URL('../src/services/scenarioDefinitionImportService.js', import.meta.url)))
  const source = await readFile(file, 'utf8')
  for (const forbidden of [
    "from '../models/Scenario.js'",
    'scenarioImportService',
    'deleteMany',
    'deleteOne',
    'drop(',
    'collection.drop',
    'remove(',
  ]) {
    assert.ok(!source.includes(forbidden),
      `the import service must not contain "${forbidden}" - it must never touch or delete legacy data`)
  }
  assert.ok(source.includes('ScenarioDefinition'), 'sanity: it does use the new model')
})

test('the import script never references the legacy Scenario pipeline', async () => {
  const file = path.resolve(fileURLToPath(new URL('../scripts/importScenarioDefinitions.js', import.meta.url)))
  const source = await readFile(file, 'utf8')
  for (const forbidden of ['models/Scenario.js', 'scenarioImportService', 'deleteMany', 'drop(']) {
    assert.ok(!source.includes(forbidden), `the import script must not contain "${forbidden}"`)
  }
})

test('taxonomy artifacts declare the approved versions', () => {
  assert.equal(taxonomies.family.version, '1.0.0')
  assert.equal(taxonomies.trigger.version, '1.0.0')
  assert.equal(Object.keys(taxonomies.family.raw_family_to_canonical).length, 99)
  assert.equal(Object.keys(taxonomies.trigger.raw_primitive_to_canonical).length, 31)
  assert.equal(new Set(Object.values(taxonomies.trigger.raw_primitive_to_canonical)).size, 22)
})
