import assert from 'node:assert/strict'
import test from 'node:test'
import { demoConfig } from '../src/config/demo.js'
import {
  DEMO_DISPOSITION_QUOTA,
  DEMO_SCENARIO_SEQUENCE,
  DEMO_SELECTION_VERSION,
  DEMO_SKIP_EVENT_CODE,
  DEMO_SKIPPED_OUTCOME_CODE,
} from '../src/constants/demoAssessment.js'
import { PATH_LABELS, OUTCOME_CLASSES, OUTCOME_CLASS_VALUES } from '../src/constants/resultProjection.js'
import { SCORING_EVENT_CODES } from '../src/constants/scenarioDefinition.js'
import {
  CORRECT_RESOLUTION,
  ENGINE_TELEMETRY_CODES,
  EVENT_CODES,
  INTENTS,
  RESOLVE_INTENTS,
} from '../src/constants/scenarioEngine.js'
import { SELECTION_ALGORITHM_VERSION } from '../src/constants/scenarioSelection.js'
import { classifyOutcome } from '../src/services/attemptResultService.js'
import {
  isDemoAttempt,
  isDemoCandidate,
  isDemoSkippedRun,
  selectDemoScenarios,
} from '../src/services/demoSelectionService.js'
import { skippedScenarioReview } from '../src/services/scenarioReviewService.js'
import { selectAttemptScenarios } from '../src/services/scenarioSelectionService.js'
import {
  loadSourceScenarios,
  loadTaxonomies,
  toScenarioDefinition,
} from '../src/services/scenarioDefinitionImportService.js'
import { normaliseIdentifier } from '../src/models/Candidate.js'

/**
 * ENHANCEMENT-003 - the Demo User and the fixed demonstration set, without a database.
 *
 * The pool is the authoritative 100-scenario bank as the importer builds it, so the 6 / 4
 * split is asserted against the bank's own dispositions rather than against a comment.
 */

const taxonomies = await loadTaxonomies()
const { scenarios } = await loadSourceScenarios()
const POOL = scenarios.map((record) => toScenarioDefinition(record, taxonomies).doc)
const byId = new Map(POOL.map((s) => [s.scenario_id, s]))

/* ------------------------------------------------------------------ *
 * Demo identity
 * ------------------------------------------------------------------ */

test('the demo identity is the configured service number, compared in normalised form', () => {
  assert.equal(demoConfig.displayName, 'demo user')
  assert.equal(demoConfig.serviceNumber, '1223334444')
  const demo = normaliseIdentifier(demoConfig.serviceNumber)
  assert.equal(isDemoCandidate({ identifierNormalised: demo }), true)
  // The same number typed with separators resolves to the same profile, as for any learner.
  assert.equal(isDemoCandidate({ identifierNormalised: normaliseIdentifier('122-333 4444') }), true)
})

test('a non-demo learner is never recognised as the Demo User', () => {
  for (const id of ['IC100001', '1223334445', '122333444', '', null, undefined]) {
    assert.equal(isDemoCandidate({ identifierNormalised: id }), false, String(id))
  }
  assert.equal(isDemoCandidate(null), false)
  assert.equal(isDemoCandidate(undefined), false)
})

test('client-style demo flags on a profile or attempt are ignored', () => {
  // Only the normalised service number and the frozen selection version count.
  assert.equal(isDemoCandidate({ identifierNormalised: 'IC100001', is_demo: true, isDemo: true }), false)
  assert.equal(isDemoAttempt({ is_demo: true, selection: { selection_algorithm_version: '1.0.0' } }), false)
  assert.equal(isDemoAttempt({ selection: { selection_algorithm_version: DEMO_SELECTION_VERSION } }), true)
  assert.equal(isDemoAttempt(null), false)
})

/* ------------------------------------------------------------------ *
 * The fixed set
 * ------------------------------------------------------------------ */

test('the demo set is exactly 10 unique ids that all exist in the bank', () => {
  assert.equal(DEMO_SCENARIO_SEQUENCE.length, 10)
  assert.equal(new Set(DEMO_SCENARIO_SEQUENCE).size, 10)
  for (const id of DEMO_SCENARIO_SEQUENCE) assert.ok(byId.has(id), `${id} is not in the bank`)
  assert.equal(POOL.length, 100)
})

test('the demo set is 7 malicious and 3 legitimate by the bank\'s own dispositions', () => {
  const plan = selectDemoScenarios({ pool: POOL })
  const dispositions = plan.scenarios.map((s) => byId.get(s.scenario_id).disposition)
  assert.equal(dispositions.filter((d) => d === 'malicious').length, 7)
  assert.equal(dispositions.filter((d) => d === 'legitimate').length, 3)
  assert.deepEqual(DEMO_DISPOSITION_QUOTA, { malicious: 7, legitimate: 3 })
  assert.deepEqual(plan.composition.disposition_counts, { malicious: 7, legitimate: 3 })
})

test('the demo set covers every platform', () => {
  const { composition } = selectDemoScenarios({ pool: POOL })
  assert.deepEqual(composition.platform_counts, { whatsapp: 3, email: 3, sms: 2, instagram: 2 })
  assert.deepEqual(composition.difficulty_counts, { easy: 6, medium: 4 })
  assert.equal(composition.military_count, 5)
})

test('the demo order is fixed and never depends on seed, history or attempt index', () => {
  const expected = ['W14', 'E08', 'W03', 'S06', 'I17', 'S15', 'I07', 'W12', 'E07', 'E01']
  assert.deepEqual([...DEMO_SCENARIO_SEQUENCE], expected)
  for (const attemptIndex of [0, 1, 7]) {
    const plan = selectDemoScenarios({
      pool: [...POOL].reverse(), seed: `s-${attemptIndex}`, attemptIndex, recentScenarioIds: expected,
    })
    assert.deepEqual(plan.scenario_ids, expected)
    assert.deepEqual(plan.scenarios.map((s) => s.scenario_id), expected)
    assert.equal(plan.selection_algorithm_version, DEMO_SELECTION_VERSION)
    assert.equal(plan.attempt_index, attemptIndex)
  }
})

test('never more than two of the same platform in a row, and legitimate items are where listed', () => {
  const platforms = DEMO_SCENARIO_SEQUENCE.map((id) => byId.get(id).platform)
  for (let i = 2; i < platforms.length; i += 1) {
    assert.ok(!(platforms[i] === platforms[i - 1] && platforms[i] === platforms[i - 2]), `run at ${i}`)
  }
  const legitimatePositions = DEMO_SCENARIO_SEQUENCE
    .map((id, i) => (byId.get(id).disposition === 'legitimate' ? i + 1 : null)).filter(Boolean)
  assert.deepEqual(legitimatePositions, [3, 7, 9])
})

test('the demo selector refuses a pool missing a demo scenario, or one whose split changed', () => {
  assert.throws(() => selectDemoScenarios({ pool: POOL.filter((s) => s.scenario_id !== 'S15') }),
    (e) => e.code === 'SELECTION_POOL_INSUFFICIENT')
  const flipped = POOL.map((s) => (s.scenario_id === 'W03' ? { ...s, disposition: 'malicious' } : s))
  assert.throws(() => selectDemoScenarios({ pool: flipped }),
    (e) => e.code === 'SELECTION_CONSTRAINT_UNSATISFIABLE')
})

test('the normal selector is unchanged: 8 + 2 under version 1.0.0, never the demo version', () => {
  assert.equal(SELECTION_ALGORITHM_VERSION, '1.0.0')
  for (const seed of ['alpha', 'bravo', 'charlie']) {
    const plan = selectAttemptScenarios({ pool: POOL, seed, attemptIndex: 0, recentScenarioIds: [] })
    assert.equal(plan.selection_algorithm_version, '1.0.0')
    assert.deepEqual(plan.composition.disposition_counts, { malicious: 8, legitimate: 2 })
    assert.equal(isDemoAttempt({ selection: plan }), false)
  }
})

/* ------------------------------------------------------------------ *
 * Skip vocabulary and scoring treatment
 * ------------------------------------------------------------------ */

test('the skip event is 0-point engine telemetry and never a scoring code or an intent', () => {
  assert.equal(DEMO_SKIP_EVENT_CODE, 'RUN_DEMO_SKIPPED')
  assert.ok(ENGINE_TELEMETRY_CODES.includes(DEMO_SKIP_EVENT_CODE))
  assert.ok(EVENT_CODES.includes(DEMO_SKIP_EVENT_CODE))
  assert.ok(!SCORING_EVENT_CODES.includes(DEMO_SKIP_EVENT_CODE))
  assert.ok(!INTENTS.includes('skip') && !INTENTS.includes('demo_skip'))
  assert.deepEqual(PATH_LABELS[DEMO_SKIP_EVENT_CODE], { stage: 'resolve', action: 'skipped_in_demonstration' })
})

test('the skipped outcome is neither a correct nor an unsafe final action', () => {
  assert.ok(!RESOLVE_INTENTS.includes(DEMO_SKIPPED_OUTCOME_CODE))
  assert.ok(!Object.values(CORRECT_RESOLUTION).flat().includes(DEMO_SKIPPED_OUTCOME_CODE))
  for (const disposition of ['malicious', 'legitimate']) {
    assert.equal(classifyOutcome({
      disposition, outcomeCode: DEMO_SKIPPED_OUTCOME_CODE, eventCodes: [DEMO_SKIP_EVENT_CODE],
    }), OUTCOME_CLASSES.NOT_RESOLVED, disposition)
  }
  assert.equal(isDemoSkippedRun({ outcome_code: DEMO_SKIPPED_OUTCOME_CODE }), true)
  assert.equal(isDemoSkippedRun({ outcome_code: 'resolve_expired' }), false)
  // The instructor buckets are built from OUTCOME_CLASSES; the demo adds no key to them.
  assert.deepEqual(OUTCOME_CLASS_VALUES,
    ['handled_safely', 'missed_threat', 'false_positive', 'unsafe_handling', 'not_resolved'])
})

test('a skipped review carries nothing from the scenario definition', () => {
  const path = [{ step: 1, stage: 'resolve', action: 'skipped_in_demonstration' }]
  const review = skippedScenarioReview({ path })
  assert.equal(review.status, 'skipped')
  for (const key of ['what_it_was', 'correct_action', 'why_it_mattered', 'safe_response', 'key_cue', 'learning_issue']) {
    assert.equal(review[key], null, key)
  }
  assert.deepEqual(review.missed_cues, [])
  assert.deepEqual(review.mistakes, [])
  assert.deepEqual(review.correct_path, [])
  assert.deepEqual(review.your_path, path)
  assert.doesNotMatch(JSON.stringify(review), /malicious|legitimate|scam|genuine|threat/i)
})

/* ------------------------------------------------------------------ *
 * Analytics isolation (ENHANCEMENT-003-FINAL)
 * ------------------------------------------------------------------ */

test('the dashboard exclusion filters on the demo profile AND on the demo selector', async () => {
  const { excludeDemoAttempts } = await import('../src/services/demoAssessmentService.js')
  const ids = ['66e8a0b1c2d3e4f5a6b7c8d9']
  assert.deepEqual(excludeDemoAttempts(ids), {
    profile_id: { $nin: ids },
    'selection.selection_algorithm_version': { $ne: DEMO_SELECTION_VERSION },
  })
  // With no demo profile yet, demo-built attempts are still excluded by their selector.
  assert.deepEqual(excludeDemoAttempts([]).profile_id, { $nin: [] })
  assert.equal(excludeDemoAttempts([])['selection.selection_algorithm_version'].$ne, 'demo-fixed-1.0.0')
})
