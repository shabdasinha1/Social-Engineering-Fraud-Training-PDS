import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assertResultIntegrity,
  behaviourBreakdown,
  classifyOutcome,
  pathFromEvents,
} from '../src/services/attemptResultService.js'
import {
  CRITICAL_EVENT_CODES,
  OUTCOME_CLASSES,
  PATH_LABELS,
} from '../src/constants/resultProjection.js'
import { SCORING_EVENT_CODES } from '../src/constants/scenarioDefinition.js'
import { CORRECT_RESOLUTION } from '../src/constants/scenarioEngine.js'

/**
 * RESULT-001 - the projection rules, with no database.
 *
 * Integrity, outcome classification, path ordering and aggregation are pure functions on
 * purpose: they are the part of the result that decides what is true, so they are tested
 * without a server, a replica set or an HTTP round trip. The ownership boundary and the
 * candidate-safe payload are proven over the wire in `attemptResultApi.test.js`.
 */

const runsFor = (scores, over = {}) =>
  scores.map((score, index) => ({
    ordinal: index + 1,
    status: 'resolved',
    score_0_10: score,
    ...over,
  }))

const perfect = () => runsFor([10, 10, 10, 10, 10, 10, 10, 10, 10, 10])

/* ------------------------------------------------------------------ *
 * 1-8  integrity
 * ------------------------------------------------------------------ */

test('a complete, consistent attempt returns the authoritative sum', () => {
  const runs = runsFor([10, 8, 6, 10, 0, 4, 10, 10, 2, 10])
  const sum = 70
  assert.equal(assertResultIntegrity({ total_score: sum }, runs), sum)
})

test('the total is recomputed from the runs, never taken on trust', () => {
  const runs = runsFor([10, 8, 6, 10, 0, 4, 10, 10, 2, 10]) // 70
  assert.throws(
    () => assertResultIntegrity({ total_score: 100 }, runs),
    (error) => error.code === 'RESULT_INTEGRITY'
      && /recorded total does not match/i.test(error.message),
  )
})

test('an attempt without exactly ten scenarios is refused', () => {
  assert.throws(
    () => assertResultIntegrity({ total_score: 90 }, runsFor([10, 10, 10, 10, 10, 10, 10, 10, 10])),
    (error) => error.code === 'RESULT_INTEGRITY' && error.details.found === 9,
  )
})

test('a repeated scenario position is refused', () => {
  const runs = perfect()
  runs[9].ordinal = 3
  assert.throws(
    () => assertResultIntegrity({ total_score: 100 }, runs),
    (error) => error.code === 'RESULT_INTEGRITY' && /repeated/i.test(error.message),
  )
})

test('a gap in the scenario positions is refused', () => {
  const runs = perfect()
  runs[9].ordinal = 11
  assert.throws(
    () => assertResultIntegrity({ total_score: 100 }, runs),
    (error) => error.code === 'RESULT_INTEGRITY' && /gap/i.test(error.message),
  )
})

test('an unresolved scenario is refused', () => {
  const runs = perfect()
  runs[4].status = 'active'
  assert.throws(
    () => assertResultIntegrity({ total_score: 100 }, runs),
    (error) => error.code === 'RESULT_INTEGRITY' && error.details.ordinals.includes(5),
  )
})

test('a score outside 0-10 is refused, in either direction', () => {
  for (const bad of [-1, 11, null, undefined, 7.5, '10']) {
    const runs = perfect()
    runs[2].score_0_10 = bad
    assert.throws(
      () => assertResultIntegrity({ total_score: 100 }, runs),
      (error) => error.code === 'RESULT_INTEGRITY' && /outside the valid range/i.test(error.message),
      `score ${String(bad)} should have been refused`,
    )
  }
})

test('an integrity failure never repairs the data it read', () => {
  const runs = perfect()
  const before = JSON.stringify(runs)
  const attempt = { total_score: 55 }
  assert.throws(() => assertResultIntegrity(attempt, runs))
  assert.equal(JSON.stringify(runs), before, 'runs were mutated')
  assert.equal(attempt.total_score, 55, 'the attempt total was mutated')
})

/* ------------------------------------------------------------------ *
 * 9-15  missed threat vs false positive
 * ------------------------------------------------------------------ */

test('a malicious item reported or blocked cleanly is handled safely', () => {
  for (const outcome of CORRECT_RESOLUTION.malicious) {
    assert.equal(
      classifyOutcome({ disposition: 'malicious', outcomeCode: outcome, eventCodes: ['TRUSTED_VERIFY'] }),
      OUTCOME_CLASSES.HANDLED_SAFELY,
    )
  }
})

test('a malicious item carried through is a missed threat', () => {
  for (const outcome of CORRECT_RESOLUTION.legitimate) {
    assert.equal(
      classifyOutcome({ disposition: 'malicious', outcomeCode: outcome, eventCodes: [] }),
      OUTCOME_CLASSES.MISSED_THREAT,
    )
  }
})

/**
 * The final action alone would hide that the learner released details and only then
 * reported, so a critical unsafe step demotes an otherwise correct malicious outcome.
 */
test('a malicious item reported only after a critical unsafe step is still a missed threat', () => {
  for (const code of CRITICAL_EVENT_CODES) {
    assert.equal(
      classifyOutcome({ disposition: 'malicious', outcomeCode: 'resolve_report', eventCodes: [code] }),
      OUTCOME_CLASSES.MISSED_THREAT,
      `${code} should have demoted the outcome`,
    )
  }
})

test('a legitimate item kept or continued is handled safely', () => {
  for (const outcome of CORRECT_RESOLUTION.legitimate) {
    assert.equal(
      classifyOutcome({ disposition: 'legitimate', outcomeCode: outcome, eventCodes: ['TRUSTED_VERIFY'] }),
      OUTCOME_CLASSES.HANDLED_SAFELY,
    )
  }
})

test('a legitimate item reported, blocked or ignored is a false positive', () => {
  for (const outcome of ['resolve_report', 'resolve_block', 'resolve_ignore']) {
    assert.equal(
      classifyOutcome({ disposition: 'legitimate', outcomeCode: outcome, eventCodes: [] }),
      OUTCOME_CLASSES.FALSE_POSITIVE,
    )
  }
})

test('a legitimate item kept via a critical unsafe step is flagged as unsafe handling', () => {
  assert.equal(
    classifyOutcome({
      disposition: 'legitimate',
      outcomeCode: 'resolve_continue',
      eventCodes: ['SECRET_PAYMENT_INSTALL_DATA_RELEASE'],
    }),
    OUTCOME_CLASSES.UNSAFE_HANDLING,
  )
})

test('a missing or unknown outcome never reads as handled safely', () => {
  assert.equal(
    classifyOutcome({ disposition: 'malicious', outcomeCode: null, eventCodes: [] }),
    OUTCOME_CLASSES.MISSED_THREAT,
  )
  assert.equal(
    classifyOutcome({ disposition: 'legitimate', outcomeCode: undefined, eventCodes: [] }),
    OUTCOME_CLASSES.FALSE_POSITIVE,
  )
})

/* ------------------------------------------------------------------ *
 * 16-20  action path
 * ------------------------------------------------------------------ */

test('the path follows the ledger sequence, not the order rows arrive in', () => {
  const shuffled = [
    { sequence: 4, event_code: 'TRUSTED_VERIFY' },
    { sequence: 1, event_code: 'NOTIFY_SEEN' },
    { sequence: 5, event_code: 'RESOLVE_CORRECT' },
    { sequence: 3, event_code: 'SAFE_PIVOT' },
    { sequence: 2, event_code: 'ITEM_OPEN' },
  ]
  const path = pathFromEvents(shuffled)

  assert.deepEqual(path.map((s) => s.step), [1, 2, 3, 4, 5])
  assert.deepEqual(path.map((s) => s.stage), ['notify', 'open', 'branch', 'verify', 'resolve'])
})

test('a path step carries only a step number, a stage and an action', () => {
  const path = pathFromEvents([
    { sequence: 1, event_code: 'INSPECT_CONTEXT', points_delta: 2, metadata: { dwell_ms: 900 } },
  ])
  assert.deepEqual(Object.keys(path[0]).sort(), ['action', 'stage', 'step'])
})

test('an unlabelled event code is dropped rather than passed through', () => {
  const path = pathFromEvents([
    { sequence: 1, event_code: 'NOTIFY_SEEN' },
    { sequence: 2, event_code: 'SOME_FUTURE_CODE' },
    { sequence: 3, event_code: 'ITEM_OPEN' },
  ])
  assert.equal(path.length, 2)
  assert.ok(!JSON.stringify(path).includes('SOME_FUTURE_CODE'))
})

test('no scoring event code reaches the path output', () => {
  const events = SCORING_EVENT_CODES.map((code, index) => ({ sequence: index + 1, event_code: code }))
  const text = JSON.stringify(pathFromEvents(events))
  for (const code of SCORING_EVENT_CODES) {
    assert.ok(!text.includes(code), `path leaked the event code ${code}`)
  }
})

test('every labelled action names a real stage', () => {
  const stages = new Set(['notify', 'open', 'inspect', 'branch', 'verify', 'resolve'])
  for (const [code, label] of Object.entries(PATH_LABELS)) {
    assert.ok(stages.has(label.stage), `${code} maps to unknown stage ${label.stage}`)
    assert.match(label.action, /^[a-z_]+$/, `${code} has a non-slug action`)
  }
})

/* ------------------------------------------------------------------ *
 * 21-26  behaviour breakdown
 * ------------------------------------------------------------------ */

const entry = (over = {}) => ({
  platform: 'whatsapp',
  canonical_family: 'credential_phishing',
  canonical_triggers: ['urgency'],
  outcome_class: OUTCOME_CLASSES.HANDLED_SAFELY,
  score: 10,
  path: [
    { step: 1, stage: 'inspect', action: 'inspected_the_details' },
    { step: 2, stage: 'branch', action: 'declined_the_request' },
    { step: 3, stage: 'verify', action: 'verified_independently' },
    { step: 4, stage: 'resolve', action: 'resolved_as_required' },
  ],
  ...over,
})

test('platform, family and trigger buckets aggregate points and maximums', () => {
  const breakdown = behaviourBreakdown([
    entry(),
    entry({ platform: 'sms', score: 4, canonical_family: 'payment_diversion' }),
  ])

  const whatsapp = breakdown.by_platform.find((b) => b.key === 'whatsapp')
  assert.deepEqual(
    { scenarios: whatsapp.scenarios, points: whatsapp.points, max: whatsapp.max_points },
    { scenarios: 1, points: 10, max: 10 },
  )
  assert.equal(breakdown.by_family.length, 2)
  assert.equal(breakdown.by_family.find((b) => b.key === 'payment_diversion').points, 4)
})

test('a multi-trigger scenario counts once in each of its trigger buckets', () => {
  const breakdown = behaviourBreakdown([
    entry({ canonical_triggers: ['urgency', 'authority', 'fear'], score: 6 }),
  ])
  assert.equal(breakdown.by_trigger.length, 3)
  for (const b of breakdown.by_trigger) {
    assert.equal(b.scenarios, 1)
    assert.equal(b.points, 6)
  }
})

test('missed threats and false positives are counted per bucket', () => {
  const breakdown = behaviourBreakdown([
    entry({ outcome_class: OUTCOME_CLASSES.MISSED_THREAT, score: 0 }),
    entry({ outcome_class: OUTCOME_CLASSES.FALSE_POSITIVE, score: 3 }),
    entry(),
  ])
  const family = breakdown.by_family.find((b) => b.key === 'credential_phishing')
  assert.equal(family.scenarios, 3)
  assert.equal(family.missed_threats, 1)
  assert.equal(family.false_positives, 1)
  assert.equal(family.max_points, 30)
})

test('every bucket carries a readable label, never a bare slug where one is known', () => {
  const breakdown = behaviourBreakdown([entry()])
  assert.equal(breakdown.by_family[0].label, 'Credential phishing')
  assert.equal(breakdown.by_trigger[0].label, 'Urgency')
  assert.equal(breakdown.by_platform[0].label, 'WhatsApp')
})

test('the action-stage breakdown counts constructive actions where the stage was reached', () => {
  const skipped = entry({
    path: [
      { step: 1, stage: 'inspect', action: 'skipped_inspection' },
      { step: 2, stage: 'branch', action: 'engaged_with_the_item' },
    ],
  })
  const breakdown = behaviourBreakdown([entry(), skipped])

  const inspect = breakdown.by_stage.find((s) => s.stage === 'inspect')
  assert.equal(inspect.scenarios_reached, 2)
  assert.equal(inspect.constructive_actions, 1)

  const verify = breakdown.by_stage.find((s) => s.stage === 'verify')
  assert.equal(verify.scenarios_reached, 1, 'the skipped run never reached verify')
  assert.equal(verify.constructive_actions, 1)
})

test('the breakdown carries no point delta, event code or scenario identifier', () => {
  const text = JSON.stringify(behaviourBreakdown([entry(), entry({ platform: 'email' })]))
  for (const forbidden of ['points_delta', 'event_code', 'scenario_id', 'disposition', 'level']) {
    assert.ok(!text.includes(forbidden), `breakdown leaked ${forbidden}`)
  }
})
