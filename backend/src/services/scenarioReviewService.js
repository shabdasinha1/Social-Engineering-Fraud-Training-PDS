import { STAGE_KEYS } from '../constants/scenarioDefinition.js'
import { EXPIRED_OUTCOME_CODE } from '../constants/attemptTiming.js'
import { OUTCOME_CLASSES } from '../constants/resultProjection.js'
import {
  CORRECT_HEADLINE,
  CORRECT_RESOLUTION_STEPS,
  EXPECTED_PATH_CODES,
  EXPECTED_PATH_STEPS,
  LEARNING_ISSUES,
  MISTAKE_RULES,
  NOT_RESOLVED_HEADLINE,
  NOT_RESOLVED_NOTE,
  OMISSION_RULES,
  OMISSION_STAGES,
  REQUIRED_RESOLUTION_TEXT,
  REVIEW_STATUS,
  SKIPPED_HEADLINE,
  SKIPPED_NOTE,
} from '../constants/scenarioReview.js'

/**
 * The per-scenario learning review (REVIEW-001).
 *
 * The result already told the learner what they scored. This tells them what they did,
 * what was wrong with it, what they missed, what the correct action was, why it mattered
 * and what to remember - which is the difference between an assessment readout and a
 * training simulator.
 *
 * ## Where every sentence comes from
 *
 * Two sources, combined here and nowhere else:
 *
 *   THE EVENT LEDGER    what the learner actually did      ScenarioEvent, ScenarioRun
 *   THE SCENARIO        what they should have done, the
 *                       cue, the consequence, the habit    ScenarioDefinition.evaluation
 *
 * Nothing is generated, and nothing is guessed. A mistake exists because an event exists,
 * or because an event the scenario itself declared does NOT exist. A correct action is
 * quoted from the stage the scenario authored. There is no third source and no fallback
 * that invents content: a scenario with no authored feedback yields nulls, and the UI
 * omits those rows rather than filling them in.
 *
 * ## Why there is no per-scenario code here
 *
 * Every scenario declares, in `evaluation.stages[].scoring`, which event codes exist at
 * which stage - that is what the engine already reads to decide whether an intent is even
 * legal. The review reads the same declaration to decide which steps were available, and
 * therefore which were missed. So the scenario data drives the review exactly as it drives
 * the engine, and all 100 scenarios are served by one implementation. See
 * `docs/TRAINING_FEEDBACK.md`.
 *
 * ## What must never leave this module
 *
 * `event_id`, `run_id`, `intent_key`, event codes, `points_delta`, `scoring_text`, stage
 * scoring lists, the authoring title, the raw disposition enum, event metadata and the
 * rationale the learner typed. The review is built by CONSTRUCTION from an allowlist of
 * prose fields, not by deleting keys from a document, so a field added to
 * `evaluation` later is absent by default rather than published by default.
 *
 * Pure and synchronous throughout: no I/O, no clock, no randomness.
 */

/* ------------------------------------------------------------------ *
 * Reading the scenario's own declarations
 * ------------------------------------------------------------------ */

const stageIndexOf = (stage) => STAGE_KEYS.indexOf(stage)

/** The authored evaluation stage for a stage key, or null if the scenario has none. */
function evaluationStage(definition, stage) {
  const stages = definition?.evaluation?.stages ?? []
  return stages.find((s) => s.key === stage) ?? null
}

/**
 * Every scoring event code the scenario declares at a stage.
 *
 * This is the scenario telling us which steps it offers. `STAGE_SKIPPED`, `RUN_ABANDONED`
 * and `RUN_EXPIRED` are engine telemetry and are deliberately absent from it - they are
 * always available and are never "offered" by a scenario.
 */
function declaredCodesAt(definition, stage) {
  return new Set((evaluationStage(definition, stage)?.scoring ?? []).map((s) => s.event_code))
}

/**
 * The stage-specific safe behaviour the scenario's author wrote.
 *
 * This is the single most important string in the review: it is what makes "correct
 * action" specific to this case rather than a lecture. `expected_safe_behavior` is
 * required on every one of the six stages of every imported scenario, so this is a guard
 * rather than an expected path.
 */
function expectedBehaviourAt(definition, stage) {
  const text = evaluationStage(definition, stage)?.expected_safe_behavior
  return typeof text === 'string' && text.trim() ? text.trim() : null
}

/* ------------------------------------------------------------------ *
 * The correct path
 * ------------------------------------------------------------------ */

/**
 * The path this scenario expected, derived from the scenario's own scoring declaration.
 *
 * A step appears only when the scenario declares the event code that earns it, so a
 * scenario that never offered a verification route never shows one in its correct path.
 * The resolve step is phrased for the disposition, so a learner is told what "as
 * required" actually meant for this item.
 *
 * Never invented, and deliberately not a house style guide: two scenarios with different
 * declarations produce different correct paths.
 */
export function correctPathFor(definition) {
  const steps = []
  let step = 0

  for (const stage of STAGE_KEYS) {
    const declared = declaredCodesAt(definition, stage)
    const code = EXPECTED_PATH_CODES.find((c) => {
      const label = EXPECTED_PATH_STEPS[c]
      return label?.stage === stage && declared.has(c)
    })
    if (!code) continue

    const base = stage === 'resolve'
      ? CORRECT_RESOLUTION_STEPS[definition?.disposition] ?? EXPECTED_PATH_STEPS[code]
      : EXPECTED_PATH_STEPS[code]

    step += 1
    steps.push({ step, stage: base.stage, action: base.action })
  }

  return steps
}

/* ------------------------------------------------------------------ *
 * Mistake detection
 * ------------------------------------------------------------------ */

/**
 * The correct action for one mistake, in the scenario's own words.
 *
 * At the resolve stage the authored line is about completing the flow ("complete the
 * resolution and return to the dashboard"), which tells a learner who chose the wrong
 * final action nothing at all. There, the required action is stated from the scenario's
 * disposition instead - still specific to this case, still not invented.
 */
function correctActionFor(definition, stage) {
  if (stage === 'resolve') {
    return REQUIRED_RESOLUTION_TEXT[definition?.disposition] ?? expectedBehaviourAt(definition, stage)
  }
  return expectedBehaviourAt(definition, stage)
}

/** A rule plus the case-specific correct action, with `severity` kept out of the payload. */
function toMistake(rule, definition, { stage, sequence }) {
  const { severity, ...rest } = rule
  return {
    card: {
      kind: rest.kind,
      stage,
      label: rest.label,
      what_you_did: rest.what_you_did,
      correct_action: correctActionFor(definition, stage),
      why_it_mattered: rest.why_it_mattered,
    },
    headline: rest.headline,
    severity,
    sequence,
    stage_index: stageIndexOf(stage),
  }
}

/**
 * Everything that went materially wrong in one run.
 *
 * COMMISSIONS come from the ledger: an event whose code has a rule is a mistake, in the
 * stage the ledger recorded it in. The ledger's stage is used rather than the rule's,
 * because the ledger is what actually happened.
 *
 * OMISSIONS come from the difference between what the scenario declared and what the
 * ledger holds: a safe-path code the scenario offered and no event ever earned. A stage
 * that already produced a commission raises no omission.
 *
 * Ordered chronologically - by stage, then by ledger sequence - so the learner reads their
 * own attempt in the order they lived it. `RUN_EXPIRED` is never a mistake and has no
 * rule; a run the clock closed is handled by the caller as its own status.
 */
export function detectMistakes({ definition, events = [] }) {
  const ordered = [...events].sort((a, b) => a.sequence - b.sequence)
  const seenCodes = new Set(ordered.map((e) => e.event_code))

  const mistakes = []
  const stagesWithCommission = new Set()

  for (const event of ordered) {
    const rule = MISTAKE_RULES[event.event_code]
    if (!rule) continue
    const stage = STAGE_KEYS.includes(event.stage) ? event.stage : rule.stage
    stagesWithCommission.add(stage)
    mistakes.push(toMistake(rule, definition, { stage, sequence: event.sequence }))
  }

  for (const stage of OMISSION_STAGES) {
    if (stagesWithCommission.has(stage)) continue

    const rule = OMISSION_RULES[stage]
    const declared = declaredCodesAt(definition, stage)

    // The scenario has to have offered the step before its absence can mean anything.
    const offered = rule.requires.some((code) => declared.has(code))
    if (!offered) continue

    const taken = rule.requires.some((code) => seenCodes.has(code))
    if (taken) continue

    /**
     * Sequence 0 places an omission at the head of its stage. A stage cannot hold both an
     * omission and a commission, so this never competes with a real ledger sequence.
     */
    mistakes.push(toMistake(rule, definition, { stage, sequence: 0 }))
  }

  return mistakes.sort((a, b) => (a.stage_index - b.stage_index) || (a.sequence - b.sequence))
}

/* ------------------------------------------------------------------ *
 * The feedback the scenario authored
 * ------------------------------------------------------------------ */

const text = (value) => (typeof value === 'string' && value.trim() ? value.trim() : null)

function authored(definition) {
  const feedback = definition?.evaluation?.feedback
  return {
    what_it_was: text(feedback?.result),
    missed_cues: (feedback?.cues ?? []).map(text).filter(Boolean),
    correct_action: text(feedback?.safe_action),
    why_it_mattered: text(feedback?.impact),
    safe_response: text(feedback?.prevention_habit),
  }
}

/* ------------------------------------------------------------------ *
 * The review card
 * ------------------------------------------------------------------ */

/**
 * One scenario's learning review.
 *
 * `outcome_class` is passed in rather than recomputed. RESULT-001 already decided whether
 * this was a missed threat or a false positive, from the disposition and the same ledger;
 * re-deriving it here would create a second classifier that could disagree with the first
 * one on screen. The review reads that decision and names it.
 *
 * Three shapes, and the status says which:
 *
 *   `not_resolved`  the clock closed it. No decision was taken, so nothing is marked
 *                   right or wrong; the authored feedback is shown so the learner still
 *                   learns what the scenario was.
 *   `correct`       concise and positive: the key cue and the habit, and no mistake list.
 *   `mistake`       the detailed card: every mistake, the cues, the correct action, the
 *                   consequence, the habit and both paths.
 */
export function buildScenarioReview({ definition, run, events = [], outcomeClass, path = [] }) {
  const feedback = authored(definition)
  const correctPath = correctPathFor(definition)

  if (run?.outcome_code === EXPIRED_OUTCOME_CODE || outcomeClass === OUTCOME_CLASSES.NOT_RESOLVED) {
    return {
      status: REVIEW_STATUS.NOT_RESOLVED,
      headline: NOT_RESOLVED_HEADLINE,
      note: NOT_RESOLVED_NOTE,
      learning_issue: null,
      mistakes: [],
      key_cue: feedback.missed_cues[0] ?? null,
      missed_cues: feedback.missed_cues,
      what_it_was: feedback.what_it_was,
      correct_action: feedback.correct_action,
      why_it_mattered: feedback.why_it_mattered,
      safe_response: feedback.safe_response,
      your_path: path,
      correct_path: correctPath,
    }
  }

  const detected = detectMistakes({ definition, events })

  if (!detected.length) {
    /**
     * The concise positive card. Kept deliberately shorter than a mistake card: a result
     * that is a wall of text about the scenarios that went WELL buries the ones that did
     * not, and the learner has no correction to read here.
     */
    return {
      status: REVIEW_STATUS.CORRECT,
      headline: CORRECT_HEADLINE,
      note: null,
      learning_issue: LEARNING_ISSUES[outcomeClass] ?? null,
      mistakes: [],
      key_cue: feedback.missed_cues[0] ?? null,
      missed_cues: feedback.missed_cues,
      what_it_was: feedback.what_it_was,
      correct_action: feedback.correct_action,
      why_it_mattered: null,
      safe_response: feedback.safe_response,
      your_path: path,
      correct_path: correctPath,
    }
  }

  // The headline names the most consequential thing that happened, not the first.
  const worst = detected.reduce((a, b) => (b.severity > a.severity ? b : a))
  const mistakes = detected.map((m) => m.card)

  return {
    status: REVIEW_STATUS.MISTAKE,
    headline: worst.headline,
    note: null,
    learning_issue: LEARNING_ISSUES[outcomeClass] ?? null,
    mistakes,
    key_cue: feedback.missed_cues[0] ?? null,
    missed_cues: feedback.missed_cues,
    what_it_was: feedback.what_it_was,

    /**
     * The card-level correct action is dropped once the mistakes carry their own.
     *
     * `feedback.safe_action` is imported from the scenario's RESOLVE stage, so on most of
     * the bank it reads as screen procedure - "complete the resolution and return to the
     * dashboard" - rather than as the decision that should have been taken. Every mistake
     * above already names the correct action for the stage it happened at, in the
     * scenario's own words, which is both more specific and more useful. Printing the
     * resolve boilerplate underneath them would add a generic line to a card whose whole
     * purpose is not to be generic.
     *
     * It is kept when no mistake supplied one - a definition with no authored stage
     * behaviour - so the card never ends up with no correct action at all.
     */
    correct_action: mistakes.some((m) => m.correct_action) ? null : feedback.correct_action,

    why_it_mattered: feedback.why_it_mattered,
    safe_response: feedback.safe_response,
    your_path: path,
    correct_path: correctPath,
  }
}

/**
 * ENHANCEMENT-003: the review card for a scenario the Demo User skipped.
 *
 * Unlike the `not_resolved` card, which shows the authored feedback so a timed-out learner
 * can still learn from the scenario, this one carries NOTHING from the definition: no
 * "what it was", no cues, no correct action and no correct path. Each of those would tell
 * the audience whether the skipped item was a threat or genuine. The learner's own path is
 * kept - it is only what they did, ending in the neutral "skipped" step.
 */
export function skippedScenarioReview({ path = [] } = {}) {
  return {
    status: REVIEW_STATUS.SKIPPED,
    headline: SKIPPED_HEADLINE,
    note: SKIPPED_NOTE,
    learning_issue: null,
    mistakes: [],
    key_cue: null,
    missed_cues: [],
    what_it_was: null,
    correct_action: null,
    why_it_mattered: null,
    safe_response: null,
    your_path: path,
    correct_path: [],
  }
}

/* ------------------------------------------------------------------ *
 * The attempt-level review summary
 * ------------------------------------------------------------------ */

/**
 * The counts that head the review: how many scenarios were correct, how many carried a
 * mistake, and how those mistakes split between missing a threat and rejecting a genuine
 * item.
 *
 * Counted from the same entries the per-scenario cards are built from, so the number at
 * the top and the cards below it can never disagree. No score is computed here: the score
 * is the engine's, and this explains it rather than restating it.
 *
 * `verification_successes` counts SCENARIOS in which the learner verified through a
 * trusted route at least once - not events, so verifying twice in one scenario counts
 * once, and the figure can be read directly against the scenario total.
 */
export function reviewSummary(entries) {
  const status = (key) => entries.filter((e) => e.review.status === key).length

  return {
    scenarios: entries.length,
    correct_decisions: status(REVIEW_STATUS.CORRECT),
    scenarios_with_mistakes: status(REVIEW_STATUS.MISTAKE),
    not_resolved: status(REVIEW_STATUS.NOT_RESOLVED),
    mistakes: entries.reduce((total, e) => total + e.review.mistakes.length, 0),
    missed_threats: entries.filter((e) => e.outcome_class === OUTCOME_CLASSES.MISSED_THREAT).length,
    false_positives: entries.filter((e) => e.outcome_class === OUTCOME_CLASSES.FALSE_POSITIVE).length,
    unsafe_handling: entries.filter((e) => e.outcome_class === OUTCOME_CLASSES.UNSAFE_HANDLING).length,
    verification_successes: entries.filter((e) =>
      e.path.some((s) => s.stage === 'verify' && s.action === 'verified_independently')).length,
  }
}
