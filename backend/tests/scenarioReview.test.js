import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildScenarioReview,
  correctPathFor,
  detectMistakes,
  reviewSummary,
} from '../src/services/scenarioReviewService.js'
import {
  MISTAKE_KINDS,
  MISTAKE_KIND_VALUES,
  MISTAKE_RULES,
  OMISSION_RULES,
  REVIEW_STATUS,
} from '../src/constants/scenarioReview.js'
import { OUTCOME_CLASSES, PATH_LABELS } from '../src/constants/resultProjection.js'
import { SCORING_EVENT_CODES, STAGE_KEYS } from '../src/constants/scenarioDefinition.js'

/**
 * REVIEW-001 - the training feedback rules, with no database.
 *
 * Mistake detection, correct-path derivation and the privacy boundary are pure functions
 * on purpose: they are the part of the review that decides what a learner is TOLD, so they
 * are tested without a server, a replica set or an HTTP round trip. The wire contract is
 * proven in `attemptResultApi.test.js`.
 */

/* ------------------------------------------------------------------ *
 * Fixtures - a definition shaped exactly like an imported one
 * ------------------------------------------------------------------ */

/** The scoring codes the real importer produces for a malicious scenario, per stage. */
const MALICIOUS_SCORING = {
  notify: ['NOTIFY_SEEN'],
  open: ['ITEM_OPEN', 'PREMATURE_REPLY'],
  inspect: ['INSPECT_CONTEXT'],
  branch: ['SAFE_PIVOT', 'RISKY_OPEN_REPLY', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE'],
  verify: ['TRUSTED_VERIFY', 'REPORT_ONLY_WITHOUT_CHECK', 'VERIFY_THROUGH_MESSAGE'],
  resolve: ['RESOLVE_CORRECT', 'CONTRADICTORY_UNSAFE_FINAL'],
}

/** A legitimate control declares CORRECT_USE and FALSE_REPORT_BLOCK instead. */
const LEGITIMATE_SCORING = {
  notify: ['NOTIFY_SEEN'],
  open: ['ITEM_OPEN', 'PREMATURE_REPLY'],
  inspect: ['INSPECT_CONTEXT'],
  branch: ['CORRECT_USE', 'NEEDLESS_REJECT_IGNORE'],
  verify: ['TRUSTED_VERIFY', 'FALSE_REPORT_BLOCK'],
  resolve: ['RESOLVE_CORRECT', 'CONTRADICTORY_UNSAFE_FINAL'],
}

const SAFE_BEHAVIOUR = {
  notify: 'Notice the source and time; open the full item before acting.',
  open: 'Read the full thread and prior context before choosing any action.',
  inspect: 'Check this decision signal: a genuine login code is secret and cannot be needed by someone else.',
  branch: 'Do not type or forward the six-digit code. Use Back or Close only.',
  verify: 'Verify independently: check account activity and linked devices from Settings, not through the stranger.',
  resolve: 'Complete the resolution and return to the dashboard.',
}

function definitionFixture({ disposition = 'malicious', scoring = null, feedback = {} } = {}) {
  const table = scoring ?? (disposition === 'malicious' ? MALICIOUS_SCORING : LEGITIMATE_SCORING)
  return {
    scenario_id: 'W01',
    disposition,
    evaluation: {
      title: 'The Accidental Login Code',
      end_state: 'Chat closes as Reported and Blocked.',
      feedback: {
        result: 'Malicious - account takeover / OTP theft',
        cues: ['A genuine login code is never needed by the person who asks for it.'],
        safe_action: 'Do not send the code; report and block the number, then review linked devices.',
        impact: 'Sending the code hands over the account the code protects.',
        prevention_habit: 'Never share a login or verification code with anyone.',
        ...feedback,
      },
      stages: STAGE_KEYS.map((key, index) => ({
        index: index + 1,
        key,
        learner_flow: `flow for ${key}`,
        expected_safe_behavior: SAFE_BEHAVIOUR[key],
        scoring_text: `${key.toUpperCase()} +2; risky -3`,
        expected_actions: [],
        scoring: (table[key] ?? []).map((event_code) => ({ event_code, points_delta: 2, critical: false })),
      })),
    },
  }
}

let sequence = 0
const ev = (event_code, stage) => ({ sequence: (sequence += 1), event_code, stage })
const ledger = (...pairs) => {
  sequence = 0
  return pairs.map(([code, stage]) => ev(code, stage))
}

const SAFE_LEDGER = () => ledger(
  ['NOTIFY_SEEN', 'notify'],
  ['ITEM_OPEN', 'open'],
  ['INSPECT_CONTEXT', 'inspect'],
  ['SAFE_PIVOT', 'branch'],
  ['TRUSTED_VERIFY', 'verify'],
  ['RESOLVE_CORRECT', 'resolve'],
)

const kindsOf = (mistakes) => mistakes.map((m) => m.kind ?? m.card?.kind)

/* ------------------------------------------------------------------ *
 * A. A correctly handled scenario
 * ------------------------------------------------------------------ */

test('A. a clean safe path produces no mistakes at all', () => {
  const mistakes = detectMistakes({ definition: definitionFixture(), events: SAFE_LEDGER() })
  assert.deepEqual(mistakes, [])
})

test('A. a correct scenario gets the concise positive card, not a mistake card', () => {
  const review = buildScenarioReview({
    definition: definitionFixture(),
    run: { outcome_code: 'resolve_report' },
    events: SAFE_LEDGER(),
    outcomeClass: OUTCOME_CLASSES.HANDLED_SAFELY,
    path: [],
  })

  assert.equal(review.status, REVIEW_STATUS.CORRECT)
  assert.deepEqual(review.mistakes, [])
  assert.equal(review.key_cue, 'A genuine login code is never needed by the person who asks for it.')
  assert.equal(review.safe_response, 'Never share a login or verification code with anyone.')
  assert.equal(review.learning_issue, null, 'a clean scenario carries no learning issue')
})

test('A. the positive card omits the consequence line a mistake card carries', () => {
  const review = buildScenarioReview({
    definition: definitionFixture(),
    run: { outcome_code: 'resolve_report' },
    events: SAFE_LEDGER(),
    outcomeClass: OUTCOME_CLASSES.HANDLED_SAFELY,
  })
  assert.equal(review.why_it_mattered, null)
})

/* ------------------------------------------------------------------ *
 * B. A missed malicious scenario
 * ------------------------------------------------------------------ */

test('B. releasing details on a malicious item is detected, with the cue and the habit', () => {
  const definition = definitionFixture()
  const review = buildScenarioReview({
    definition,
    run: { outcome_code: 'resolve_continue' },
    events: ledger(
      ['NOTIFY_SEEN', 'notify'],
      ['ITEM_OPEN', 'open'],
      ['INSPECT_CONTEXT', 'inspect'],
      ['SECRET_PAYMENT_INSTALL_DATA_RELEASE', 'branch'],
      ['VERIFY_THROUGH_MESSAGE', 'verify'],
      ['CONTRADICTORY_UNSAFE_FINAL', 'resolve'],
    ),
    outcomeClass: OUTCOME_CLASSES.MISSED_THREAT,
  })

  assert.equal(review.status, REVIEW_STATUS.MISTAKE)
  assert.equal(review.learning_issue.key, 'missed_threat')
  assert.deepEqual(kindsOf(review.mistakes), [
    MISTAKE_KINDS.RELEASED_DETAILS_OR_PAID,
    MISTAKE_KINDS.VERIFIED_THROUGH_THE_MESSAGE,
    MISTAKE_KINDS.CONTRADICTORY_RESOLUTION,
  ])
  assert.ok(review.missed_cues.length > 0, 'the missed cue is shown')
  assert.ok(review.mistakes.every((m) => m.correct_action),
    'every mistake names the correct action for its own stage')
  assert.ok(review.safe_response, 'the safe response is shown')
  assert.ok(review.why_it_mattered, 'the consequence is shown')
})

test('B. the headline names the most consequential mistake, not the first one', () => {
  const review = buildScenarioReview({
    definition: definitionFixture(),
    run: { outcome_code: 'resolve_report' },
    events: ledger(
      ['PREMATURE_REPLY', 'open'],
      ['SECRET_PAYMENT_INSTALL_DATA_RELEASE', 'branch'],
      ['TRUSTED_VERIFY', 'verify'],
      ['RESOLVE_CORRECT', 'resolve'],
    ),
    outcomeClass: OUTCOME_CLASSES.MISSED_THREAT,
  })

  assert.equal(review.headline, MISTAKE_RULES.SECRET_PAYMENT_INSTALL_DATA_RELEASE.headline)
  // ...while the list itself stays chronological.
  assert.equal(review.mistakes[0].kind, MISTAKE_KINDS.PREMATURE_ACTION)
})

test('B. each mistake carries the scenario-authored correct action for its own stage', () => {
  const definition = definitionFixture()
  const review = buildScenarioReview({
    definition,
    run: { outcome_code: 'resolve_report' },
    events: ledger(
      ['NOTIFY_SEEN', 'notify'],
      ['ITEM_OPEN', 'open'],
      ['STAGE_SKIPPED', 'inspect'],
      ['RISKY_OPEN_REPLY', 'branch'],
      ['TRUSTED_VERIFY', 'verify'],
      ['RESOLVE_CORRECT', 'resolve'],
    ),
    outcomeClass: OUTCOME_CLASSES.MISSED_THREAT,
  })

  const byStage = Object.fromEntries(review.mistakes.map((m) => [m.stage, m.correct_action]))
  assert.equal(byStage.inspect, SAFE_BEHAVIOUR.inspect)
  assert.equal(byStage.branch, SAFE_BEHAVIOUR.branch)
})

test('B. a resolve-stage mistake is told what the resolution actually needed to be', () => {
  for (const [disposition, expected] of [['malicious', /reported or blocked/i], ['legitimate', /kept/i]]) {
    const review = buildScenarioReview({
      definition: definitionFixture({ disposition }),
      run: { outcome_code: 'resolve_ignore' },
      events: ledger(['CONTRADICTORY_UNSAFE_FINAL', 'resolve']),
      outcomeClass: OUTCOME_CLASSES.MISSED_THREAT,
    })
    const resolve = review.mistakes.find((m) => m.stage === 'resolve')
    assert.match(resolve.correct_action, expected, `${disposition} resolution wording`)
  }
})

/* ------------------------------------------------------------------ *
 * C. A false positive on a legitimate scenario
 * ------------------------------------------------------------------ */

test('C. reporting a genuine item is named a false positive, not a missed threat', () => {
  const review = buildScenarioReview({
    definition: definitionFixture({ disposition: 'legitimate' }),
    run: { outcome_code: 'resolve_report' },
    events: ledger(
      ['NOTIFY_SEEN', 'notify'],
      ['ITEM_OPEN', 'open'],
      ['INSPECT_CONTEXT', 'inspect'],
      ['NEEDLESS_REJECT_IGNORE', 'branch'],
      ['FALSE_REPORT_BLOCK', 'verify'],
      ['CONTRADICTORY_UNSAFE_FINAL', 'resolve'],
    ),
    outcomeClass: OUTCOME_CLASSES.FALSE_POSITIVE,
  })

  assert.equal(review.learning_issue.key, 'false_positive')
  assert.ok(kindsOf(review.mistakes).includes(MISTAKE_KINDS.REJECTED_A_GENUINE_ITEM))
  assert.ok(review.mistakes.every((m) => m.correct_action),
    'the correct behaviour is still shown for a false positive')
})

test('C. a legitimate scenario is told to keep the item, never to report it', () => {
  const review = buildScenarioReview({
    definition: definitionFixture({ disposition: 'legitimate' }),
    run: { outcome_code: 'resolve_report' },
    events: ledger(['FALSE_REPORT_BLOCK', 'verify']),
    outcomeClass: OUTCOME_CLASSES.FALSE_POSITIVE,
  })

  const resolve = review.correct_path.find((s) => s.stage === 'resolve')
  assert.equal(resolve.action, 'kept_it_and_continued')
})

test('C. the false-positive distinction follows the outcome class, never a second guess', () => {
  // Identical ledger, opposite dispositions: the review reports whatever it was given.
  const events = ledger(['FALSE_REPORT_BLOCK', 'verify'])
  const asFalsePositive = buildScenarioReview({
    definition: definitionFixture({ disposition: 'legitimate' }),
    run: {}, events, outcomeClass: OUTCOME_CLASSES.FALSE_POSITIVE,
  })
  const asUnsafe = buildScenarioReview({
    definition: definitionFixture({ disposition: 'legitimate' }),
    run: {}, events, outcomeClass: OUTCOME_CLASSES.UNSAFE_HANDLING,
  })
  assert.equal(asFalsePositive.learning_issue.key, 'false_positive')
  assert.equal(asUnsafe.learning_issue.key, 'unsafe_handling')
})

/* ------------------------------------------------------------------ *
 * D. Several mistakes in one scenario
 * ------------------------------------------------------------------ */

test('D. every meaningful mistake is shown, in the order it happened', () => {
  const review = buildScenarioReview({
    definition: definitionFixture(),
    run: { outcome_code: 'resolve_ignore' },
    events: ledger(
      ['NOTIFY_SEEN', 'notify'],
      ['PREMATURE_REPLY', 'open'],
      ['RISKY_OPEN_REPLY', 'branch'],
      ['VERIFY_THROUGH_MESSAGE', 'verify'],
      ['CONTRADICTORY_UNSAFE_FINAL', 'resolve'],
    ),
    outcomeClass: OUTCOME_CLASSES.MISSED_THREAT,
  })

  assert.deepEqual(kindsOf(review.mistakes), [
    MISTAKE_KINDS.PREMATURE_ACTION,
    MISTAKE_KINDS.NO_INSPECTION,
    MISTAKE_KINDS.RISKY_ENGAGEMENT,
    MISTAKE_KINDS.VERIFIED_THROUGH_THE_MESSAGE,
    MISTAKE_KINDS.CONTRADICTORY_RESOLUTION,
  ])
})

test('D. a stage that already produced a mistake is never also reported as skipped', () => {
  const review = buildScenarioReview({
    definition: definitionFixture(),
    run: {},
    events: ledger(['STAGE_SKIPPED', 'inspect'], ['SAFE_PIVOT', 'branch'], ['TRUSTED_VERIFY', 'verify'], ['RESOLVE_CORRECT', 'resolve']),
    outcomeClass: OUTCOME_CLASSES.MISSED_THREAT,
  })

  const inspect = review.mistakes.filter((m) => m.stage === 'inspect')
  assert.equal(inspect.length, 1)
  assert.equal(inspect[0].kind, MISTAKE_KINDS.SKIPPED_INSPECTION)
})

test('D. a step the scenario never offered is never reported as missed', () => {
  // This scenario declares no TRUSTED_VERIFY at all.
  const definition = definitionFixture({
    scoring: { ...MALICIOUS_SCORING, verify: ['REPORT_ONLY_WITHOUT_CHECK'] },
  })
  const mistakes = detectMistakes({
    definition,
    events: ledger(['INSPECT_CONTEXT', 'inspect'], ['SAFE_PIVOT', 'branch'], ['RESOLVE_CORRECT', 'resolve']),
  })
  assert.ok(!kindsOf(mistakes).includes(MISTAKE_KINDS.NO_INDEPENDENT_VERIFICATION))
})

/* ------------------------------------------------------------------ *
 * E / F. Path replay
 * ------------------------------------------------------------------ */

test('E. the correct path is derived from what the scenario itself declares', () => {
  assert.deepEqual(correctPathFor(definitionFixture()), [
    { step: 1, stage: 'notify', action: 'opened_notification' },
    { step: 2, stage: 'open', action: 'read_the_item' },
    { step: 3, stage: 'inspect', action: 'inspected_the_details' },
    { step: 4, stage: 'branch', action: 'declined_the_request' },
    { step: 5, stage: 'verify', action: 'verified_independently' },
    { step: 6, stage: 'resolve', action: 'reported_or_blocked_it' },
  ])
})

test('E. a legitimate scenario gets the official-route branch step, not "decline"', () => {
  const path = correctPathFor(definitionFixture({ disposition: 'legitimate' }))
  assert.equal(path.find((s) => s.stage === 'branch').action, 'used_the_official_path')
})

test('E. a scenario that offers no verification route shows none in its correct path', () => {
  const definition = definitionFixture({
    scoring: { ...MALICIOUS_SCORING, verify: ['REPORT_ONLY_WITHOUT_CHECK'] },
  })
  assert.ok(!correctPathFor(definition).some((s) => s.stage === 'verify'))
})

test('F. the replayed path is the caller-supplied ledger path, never rebuilt or invented', () => {
  const path = [
    { step: 1, stage: 'notify', action: 'opened_notification' },
    { step: 4, stage: 'branch', action: 'released_details_or_paid' },
  ]
  const review = buildScenarioReview({
    definition: definitionFixture(),
    run: {},
    events: ledger(['SECRET_PAYMENT_INSTALL_DATA_RELEASE', 'branch']),
    outcomeClass: OUTCOME_CLASSES.MISSED_THREAT,
    path,
  })
  assert.deepEqual(review.your_path, path)
})

test('F. an empty ledger yields an empty path and no fabricated steps', () => {
  const review = buildScenarioReview({
    definition: definitionFixture(),
    run: { outcome_code: 'resolve_expired' },
    events: [],
    outcomeClass: OUTCOME_CLASSES.NOT_RESOLVED,
    path: [],
  })
  assert.deepEqual(review.your_path, [])
  assert.deepEqual(review.mistakes, [], 'the clock is not a mistake')
  assert.equal(review.status, REVIEW_STATUS.NOT_RESOLVED)
})

test('F. a scenario the clock closed is never given a learning issue', () => {
  const review = buildScenarioReview({
    definition: definitionFixture(),
    run: { outcome_code: 'resolve_expired' },
    events: ledger(['NOTIFY_SEEN', 'notify']),
    outcomeClass: OUTCOME_CLASSES.NOT_RESOLVED,
  })
  assert.equal(review.learning_issue, null)
  assert.ok(review.note, 'it explains that no decision was recorded')
})

/* ------------------------------------------------------------------ *
 * G / H. Privacy and evaluation leakage
 * ------------------------------------------------------------------ */

const REVIEWS = () => {
  const events = ledger(
    ['NOTIFY_SEEN', 'notify'],
    ['PREMATURE_REPLY', 'open'],
    ['SECRET_PAYMENT_INSTALL_DATA_RELEASE', 'branch'],
    ['VERIFY_THROUGH_MESSAGE', 'verify'],
    ['CONTRADICTORY_UNSAFE_FINAL', 'resolve'],
  )
  return [
    buildScenarioReview({ definition: definitionFixture(), run: { rationale: 'I thought it was my cousin' }, events, outcomeClass: OUTCOME_CLASSES.MISSED_THREAT }),
    buildScenarioReview({ definition: definitionFixture({ disposition: 'legitimate' }), run: {}, events: SAFE_LEDGER(), outcomeClass: OUTCOME_CLASSES.HANDLED_SAFELY }),
    buildScenarioReview({ definition: definitionFixture(), run: { outcome_code: 'resolve_expired' }, events: [], outcomeClass: OUTCOME_CLASSES.NOT_RESOLVED }),
  ]
}

test('G. no learner-typed value ever reaches the review', () => {
  const serialised = JSON.stringify(REVIEWS())
  assert.ok(!/cousin/i.test(serialised), 'the rationale the learner typed leaked')
  for (const key of ['rationale', 'intent_key', 'event_id', 'run_id', 'metadata', 'points_delta', 'sequence', 'severity']) {
    assert.ok(!serialised.includes(`"${key}"`), `the review published "${key}"`)
  }
})

test('H. no engine event code and no scoring text ever reaches the review', () => {
  const serialised = JSON.stringify(REVIEWS())
  for (const code of SCORING_EVENT_CODES) {
    assert.ok(!serialised.includes(code), `the review published the event code ${code}`)
  }
  for (const leak of ['STAGE_SKIPPED', 'RUN_ABANDONED', 'RUN_EXPIRED', 'The Accidental Login Code', 'scoring_text', 'learner_flow', 'expected_actions']) {
    assert.ok(!serialised.includes(leak), `the review published "${leak}"`)
  }
})

test('H. the mistake vocabulary and the scoring vocabulary share no value', () => {
  for (const kind of MISTAKE_KIND_VALUES) {
    assert.ok(!SCORING_EVENT_CODES.includes(kind), `"${kind}" collides with a scoring code`)
  }
})

test('H. every rule is keyed by a code the engine can actually write', () => {
  const writable = new Set([...SCORING_EVENT_CODES, 'STAGE_SKIPPED', 'RUN_ABANDONED', 'RUN_EXPIRED'])
  for (const code of Object.keys(MISTAKE_RULES)) {
    assert.ok(writable.has(code), `${code} is not an event the engine writes`)
  }
  for (const rule of Object.values(OMISSION_RULES)) {
    for (const code of rule.requires) {
      assert.ok(PATH_LABELS[code], `${code} has no learner-facing path label`)
    }
  }
})

test('H. no rule describes the learner rather than the action', () => {
  const banned = /\byou are\b|\byou're\b|careless|vulnerable|gullible|naive|susceptib|weak|failed to understand/i
  for (const [name, rule] of Object.entries({ ...MISTAKE_RULES, ...OMISSION_RULES })) {
    for (const field of ['headline', 'what_you_did', 'why_it_mattered', 'label']) {
      assert.ok(!banned.test(rule[field]), `${name}.${field} characterises the learner`)
    }
  }
})

/* ------------------------------------------------------------------ *
 * The attempt-level summary
 * ------------------------------------------------------------------ */

const entry = (status, outcomeClass, mistakes = 0, verified = false) => ({
  outcome_class: outcomeClass,
  path: verified ? [{ step: 1, stage: 'verify', action: 'verified_independently' }] : [],
  review: { status, mistakes: Array.from({ length: mistakes }, (_, i) => ({ kind: `k${i}` })) },
})

test('the review summary counts scenarios, not events, and never recomputes a score', () => {
  const summary = reviewSummary([
    entry(REVIEW_STATUS.CORRECT, OUTCOME_CLASSES.HANDLED_SAFELY, 0, true),
    entry(REVIEW_STATUS.CORRECT, OUTCOME_CLASSES.HANDLED_SAFELY, 0, true),
    entry(REVIEW_STATUS.MISTAKE, OUTCOME_CLASSES.MISSED_THREAT, 3),
    entry(REVIEW_STATUS.MISTAKE, OUTCOME_CLASSES.FALSE_POSITIVE, 2, true),
    entry(REVIEW_STATUS.MISTAKE, OUTCOME_CLASSES.UNSAFE_HANDLING, 1),
    entry(REVIEW_STATUS.NOT_RESOLVED, OUTCOME_CLASSES.NOT_RESOLVED),
  ])

  assert.deepEqual(summary, {
    scenarios: 6,
    correct_decisions: 2,
    scenarios_with_mistakes: 3,
    not_resolved: 1,
    mistakes: 6,
    missed_threats: 1,
    false_positives: 1,
    unsafe_handling: 1,
    verification_successes: 3,
  })
  assert.ok(!('total_score' in summary), 'the review must not publish a score of its own')
})

test('the review summary counts a scenario once however often it verified', () => {
  const twice = {
    outcome_class: OUTCOME_CLASSES.HANDLED_SAFELY,
    path: [
      { step: 1, stage: 'verify', action: 'verified_independently' },
      { step: 2, stage: 'verify', action: 'verified_independently' },
    ],
    review: { status: REVIEW_STATUS.CORRECT, mistakes: [] },
  }
  assert.equal(reviewSummary([twice]).verification_successes, 1)
})

/** One mistake at the branch, and every other stage taken correctly. */
const ONE_MISTAKE_LEDGER = () => ledger(
  ['NOTIFY_SEEN', 'notify'],
  ['ITEM_OPEN', 'open'],
  ['INSPECT_CONTEXT', 'inspect'],
  ['RISKY_OPEN_REPLY', 'branch'],
  ['TRUSTED_VERIFY', 'verify'],
  ['RESOLVE_CORRECT', 'resolve'],
)

test('the card-level correct action gives way to the per-stage ones', () => {
  const review = buildScenarioReview({
    definition: definitionFixture(),
    run: {},
    events: ONE_MISTAKE_LEDGER(),
    outcomeClass: OUTCOME_CLASSES.MISSED_THREAT,
  })

  /**
   * `feedback.safe_action` is imported from the RESOLVE stage, so on most of the bank it
   * reads as screen procedure rather than as the decision that should have been taken.
   * Once a mistake carries the stage-specific line, the card-level one is dropped.
   */
  assert.equal(review.mistakes.length, 1)
  assert.equal(review.mistakes[0].correct_action, SAFE_BEHAVIOUR.branch)
  assert.equal(review.correct_action, null)
})

test('the card-level correct action survives when no mistake could supply one', () => {
  // No authored stage behaviour, but the scenario-level safe action still exists.
  const definition = definitionFixture()
  for (const stage of definition.evaluation.stages) stage.expected_safe_behavior = ''

  const review = buildScenarioReview({
    definition,
    run: {},
    events: ONE_MISTAKE_LEDGER(),
    outcomeClass: OUTCOME_CLASSES.MISSED_THREAT,
  })

  assert.equal(review.mistakes[0].correct_action, null)
  assert.ok(review.correct_action, 'the card fell back to the scenario-level safe action')
})

/* ------------------------------------------------------------------ *
 * Robustness - a definition with nothing authored
 * ------------------------------------------------------------------ */

test('a definition with no authored feedback yields nulls, never invented content', () => {
  const review = buildScenarioReview({
    definition: { disposition: 'malicious', evaluation: { stages: [] } },
    run: {},
    events: ledger(['RISKY_OPEN_REPLY', 'branch']),
    outcomeClass: OUTCOME_CLASSES.MISSED_THREAT,
  })

  assert.equal(review.what_it_was, null)
  assert.equal(review.correct_action, null)
  assert.equal(review.safe_response, null)
  assert.deepEqual(review.missed_cues, [])
  assert.deepEqual(review.correct_path, [], 'a scenario that declares nothing offers no correct path')
  assert.equal(review.mistakes[0].correct_action, null, 'no stage behaviour is invented')
})
