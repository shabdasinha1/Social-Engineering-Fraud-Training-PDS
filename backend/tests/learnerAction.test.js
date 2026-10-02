import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { STAGE_INTENTS } from '../src/constants/scenarioEngine.js'
import { ACTION_CODE_PATTERN, VERIFY_SOURCE_BY_INTENT } from '../src/constants/learnerAction.js'
import {
  MAPPED_SCENARIO_IDS,
  actionCodeFor,
  actionCodesForRun,
  controlsForScenario,
  loadActionMaps,
  translateActionCode,
} from '../src/services/learnerActionService.js'
import { resolveIntent } from '../src/services/scenarioEngineService.js'
import {
  loadSourceScenarios,
  loadSyntheticContent,
  loadTaxonomies,
  toScenarioDefinition,
} from '../src/services/scenarioDefinitionImportService.js'

/**
 * SECURITY-001 - the neutral learner action contract, without a database.
 *
 * The browser sends an opaque, per-run action code; this module is the only thing that
 * turns it back into an engine intent. These tests pin what that translation must and must
 * not do, and that it reproduces the scoring of every one of the 1,037 scene controls
 * exactly as the engine scored them when the scenes still carried their intents.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const BASELINE = JSON.parse(readFileSync(path.join(HERE, 'fixtures/learnerActionBaseline.json'), 'utf8'))
const MAPS = Object.assign({}, ...['whatsapp', 'instagram', 'email', 'sms'].map((platform) => JSON.parse(
  readFileSync(path.join(HERE, `../data/learner-actions/v1/${platform}.json`), 'utf8'),
).scenes))
const GENERIC = JSON.parse(readFileSync(path.join(HERE, '../data/learner-actions/v1/generic.json'), 'utf8')).controls

const taxonomies = await loadTaxonomies()
const { scenarios } = await loadSourceScenarios()
const { byScenario } = await loadSyntheticContent()
const definitions = Object.fromEntries(scenarios.map((record) => [
  record.scenario_id,
  toScenarioDefinition(record, taxonomies, { synthetic: byScenario.get(record.scenario_id) }).doc,
]))

const runFor = (scenarioId, runId = `run-${scenarioId}`) => ({
  _id: runId, scenario_id: scenarioId, definition_version: 1,
})
const codeOn = (run, controlId) => actionCodeFor({
  runId: run._id, scenarioId: run.scenario_id, version: run.definition_version, controlId,
})
const refusedAs = (fn, code = 'INVALID_ACTION') => {
  assert.throws(fn, (error) => {
    assert.equal(error.code, code)
    assert.equal(error.status, 422)
    assert.equal(error.message, 'That action is not available here.')
    return true
  })
}

const INTENT_NAMES = Object.values(STAGE_INTENTS).flatMap(Object.keys)

/* ------------------------------------------------------------------ *
 * The map
 * ------------------------------------------------------------------ */

test('the map covers all authored scenes and the generic sheet, and nothing else', () => {
  assert.equal(MAPPED_SCENARIO_IDS.length, 100)
  assert.deepEqual(Object.keys(MAPS).sort(), [...MAPPED_SCENARIO_IDS].sort())
  assert.equal(Object.keys(GENERIC).length, 37)
  const sceneControls = Object.values(MAPS).reduce((n, controls) => n + Object.keys(controls).length, 0)
  // 1037 WhatsApp + Instagram controls (the SECURITY-001 baseline) plus 472 Email E01-E25
  // (181 for E01-E10 + 95 for E11-E15 + 98 for E16-E20 + 98 for E21-E25) plus 477 SMS S01-S25
  // (96 for S01-S05 by IMMERSIVE-010 + 98 for S06-S10 by IMMERSIVE-011 + 95 for S11-S15 by
  // IMMERSIVE-012 + 95 for S16-S20 by IMMERSIVE-013 + 93 for S21-S25 by IMMERSIVE-014).
  assert.equal(sceneControls, 1986)
  assert.equal(BASELINE.controls, 1037)
  // IMMERSIVE-014: every scenario in the bank is authored, so none gets the generic sheet alone;
  // each still carries it beside its own controls.
  for (const id of ['S21', 'S22', 'S23', 'S24', 'S25']) {
    const keys = [...controlsForScenario(id).keys()]
    assert.ok(keys.length > Object.keys(GENERIC).length, id)
    for (const generic of Object.keys(GENERIC)) assert.ok(keys.includes(generic), id + ' ' + generic)
  }
})

test('every control id is neutral and names nothing about the control', () => {
  for (const [scenarioId, controls] of Object.entries(MAPS)) {
    for (const id of Object.keys(controls)) {
      assert.match(id, new RegExp(`^${scenarioId.toLowerCase()}-c\\d{2}$`))
    }
  }
  for (const id of Object.keys(GENERIC)) assert.match(id, /^gen-c\d{2}$/)
})

test('a malformed map stops the server from loading it', () => {
  const good = (name) => (name === 'generic'
    ? { controls: { 'gen-c01': { stage: 'notify', intent: 'open_item' } } }
    : { scenes: {} })
  assert.doesNotThrow(() => loadActionMaps({ read: good }))
  const bad = (patch) => (name) => (name === 'whatsapp' ? { scenes: patch } : good(name))
  assert.throws(() => loadActionMaps({ read: bad({ W01: { 'w01-branch-pivot': { stage: 'branch', intent: 'safe_pivot' } } }) }), /not neutral/)
  assert.throws(() => loadActionMaps({ read: bad({ W01: { 'w02-c01': { stage: 'branch', intent: 'safe_pivot' } } }) }), /not neutral/)
  assert.throws(() => loadActionMaps({ read: bad({ W01: { 'w01-c01': { stage: 'notify', intent: 'safe_pivot' } } }) }), /not a learner intent/)
  assert.throws(() => loadActionMaps({ read: bad({ W01: { 'w01-c01': { stage: 'resolve', intent: 'abandon' } } }) }), /not a learner intent/)
  assert.throws(() => loadActionMaps({ read: bad({ W01: { 'w01-c01': { stage: 'later', intent: 'read' } } }) }), /unknown stage/)
})

/* ------------------------------------------------------------------ *
 * The codes
 * ------------------------------------------------------------------ */

test('codes are opaque, deterministic and bound to one run, scenario, version and control', () => {
  const run = runFor('W01', '66e8a0b1c2d3e4f5a6b7c8d9')
  const codes = actionCodesForRun(run)
  assert.deepEqual(Object.keys(codes), [...controlsForScenario('W01').keys()])
  for (const code of Object.values(codes)) assert.match(code, ACTION_CODE_PATTERN)
  assert.equal(new Set(Object.values(codes)).size, Object.keys(codes).length, 'two controls share a code')

  // Deterministic: a reload, a stale resync or a retry receives the same codes.
  assert.deepEqual(actionCodesForRun({ ...run }), codes)
  // `/current-run` shape (run_id, version) gives the same codes as the document shape.
  assert.deepEqual(actionCodesForRun({ run_id: run._id, scenario_id: 'W01', version: 1 }), codes)

  // Anything else changes every code.
  const other = [
    actionCodesForRun(runFor('W01', '66e8a0b1c2d3e4f5a6b7c8da')),
    actionCodesForRun({ ...run, definition_version: 2 }),
  ]
  for (const variant of other) {
    for (const id of Object.keys(codes)) assert.notEqual(variant[id], codes[id], id)
  }
  const elsewhere = actionCodesForRun({ ...run, scenario_id: 'W02' })
  assert.notEqual(elsewhere['gen-c01'], codes['gen-c01'])
})

test('no code contains an intent, a stage, a control id or anything readable', () => {
  const words = [...INTENT_NAMES, 'notify', 'open', 'inspect', 'branch', 'verify', 'resolve',
    'safe', 'unsafe', 'correct', 'wrong', 'pivot', 'report', 'block', 'choice']
  for (const scenarioId of MAPPED_SCENARIO_IDS) {
    for (const [controlId, code] of Object.entries(actionCodesForRun(runFor(scenarioId)))) {
      assert.match(code.slice(3), /^[0-9a-f]{20}$/)
      assert.ok(!code.includes(controlId), `${code} contains its control id`)
      for (const word of words) assert.ok(!code.includes(word), `${code} contains ${word}`)
    }
  }
})

/* ------------------------------------------------------------------ *
 * Translation
 * ------------------------------------------------------------------ */

test('a valid code resolves to its intent and stage, and derives the source and the view', () => {
  const run = runFor('W01')
  const byName = (name) => Object.entries(MAPS.W01).find(([, entry]) => entry.name === name)[0]

  assert.deepEqual(translateActionCode({ run, actionCode: codeOn(run, byName('w01-branch-pivot')) }),
    { stage: 'branch', intent: 'safe_pivot', verifySource: null, view: null })
  assert.deepEqual(translateActionCode({ run, actionCode: codeOn(run, byName('w01-verify-inmessage')) }),
    { stage: 'verify', intent: 'verify_in_message_contact', verifySource: 'in_message_contact', view: null })
  assert.deepEqual(translateActionCode({ run, actionCode: codeOn(run, byName('w01-verify-directory')) }),
    { stage: 'verify', intent: 'verify_trusted_directory', verifySource: 'trusted_directory', view: 'directory' })
  assert.deepEqual(translateActionCode({ run, actionCode: codeOn(run, byName('w01-inspect-contact')) }),
    { stage: 'inspect', intent: 'inspect_sender', verifySource: null, view: 'sender' })
  // The generic sheet works on every run, including an authored one.
  assert.deepEqual(translateActionCode({ run, actionCode: codeOn(run, 'gen-c01') }),
    { stage: 'notify', intent: 'open_item', verifySource: null, view: null })
  // Every server-derived source is the one the client used to send for that intent.
  for (const [intent, source] of Object.entries(VERIFY_SOURCE_BY_INTENT)) {
    assert.ok(STAGE_INTENTS.verify[intent], intent)
    assert.ok(typeof source === 'string')
  }
})

test('malformed and unknown codes are refused with one neutral error', () => {
  const run = runFor('W01')
  const valid = codeOn(run, 'gen-c01')
  for (const actionCode of [
    undefined, null, '', 42, {}, ['ac_x'], 'safe_pivot', 'open_item', 'gen-c01', 'w01-c08',
    'choice_1', valid.toUpperCase(), `${valid}0`, valid.slice(0, -1), ` ${valid}`,
    'ac_00000000000000000000', 'ac_zzzzzzzzzzzzzzzzzzzz', `ac_${'f'.repeat(20)}`,
  ]) {
    refusedAs(() => translateActionCode({ run, actionCode }))
  }
})

test('a code from another run, attempt or scenario is refused', () => {
  const a = runFor('W01', 'run-a')
  const b = runFor('W01', 'run-b')
  const c = runFor('I01', 'run-a')

  // Same scenario, another run (another attempt, or another learner).
  for (const controlId of controlsForScenario('W01').keys()) {
    refusedAs(() => translateActionCode({ run: b, actionCode: codeOn(a, controlId) }))
  }
  // Same run id, another scenario: the scene codes of W01 mean nothing on I01...
  for (const controlId of Object.keys(MAPS.W01)) {
    refusedAs(() => translateActionCode({ run: c, actionCode: codeOn(a, controlId) }))
  }
  // ...and neither do its generic ones, because the scenario is part of every code.
  refusedAs(() => translateActionCode({ run: c, actionCode: codeOn(a, 'gen-c01') }))
  // A control of another scene is not a control of this one, whatever the code.
  refusedAs(() => translateActionCode({ run: a, actionCode: codeOn(a, 'i01-c01') }))
})

/* ------------------------------------------------------------------ *
 * Scoring is exactly what it was
 * ------------------------------------------------------------------ */

test('all 1,037 scene controls score exactly as they did before SECURITY-001', () => {
  let checked = 0
  for (const [scenarioId, controls] of Object.entries(MAPS)) {
    // The baseline is the snapshot taken before SECURITY-001; Email E01-E05 (IMMERSIVE-005)
    // post-date it and are pinned by sceneAffordance.test.js instead.
    if (!BASELINE.scenes[scenarioId]) continue
    const run = runFor(scenarioId, `baseline-${scenarioId}`)
    const definition = definitions[scenarioId]
    for (const [controlId, entry] of Object.entries(controls)) {
      const before = BASELINE.scenes[scenarioId][entry.name]
      assert.ok(before, `${scenarioId} ${entry.name} has no baseline row`)
      const translated = translateActionCode({ run, actionCode: codeOn(run, controlId) })
      assert.equal(translated.stage, before.stage, `${scenarioId} ${entry.name}`)
      const outcome = resolveIntent({ definition, stage: translated.stage, intent: translated.intent })
      assert.deepEqual(
        {
          stage: translated.stage,
          event_code: outcome.event_code,
          points_delta: outcome.points_delta,
          consequence: outcome.consequence?.kind ?? null,
        },
        before,
        `${scenarioId} ${entry.name}`,
      )
      checked += 1
    }
    assert.equal(Object.keys(controls).length, Object.keys(BASELINE.scenes[scenarioId]).length, scenarioId)
  }
  assert.equal(checked, 1037)
})

test('the generic sheet scores every scenario exactly as its intents always did', () => {
  for (const record of scenarios) {
    const definition = definitions[record.scenario_id]
    const run = runFor(record.scenario_id)
    for (const [controlId, entry] of Object.entries(GENERIC)) {
      const translated = translateActionCode({ run, actionCode: codeOn(run, controlId) })
      assert.equal(translated.intent, entry.intent)
      let viaCode
      let direct
      try { viaCode = resolveIntent({ definition, stage: entry.stage, intent: translated.intent }) } catch (e) { viaCode = e.code }
      try { direct = resolveIntent({ definition, stage: entry.stage, intent: entry.intent }) } catch (e) { direct = e.code }
      assert.deepEqual(viaCode, direct, `${record.scenario_id} ${controlId}`)
    }
  }
})
