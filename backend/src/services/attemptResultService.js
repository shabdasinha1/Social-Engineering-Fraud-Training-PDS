import {
  ATTEMPT_SCENARIO_COUNT,
} from '../constants/scenarioSelection.js'
import { SCENARIO_POINTS } from '../constants/scenarioDefinition.js'
import { EXPIRED_OUTCOME_CODE } from '../constants/attemptTiming.js'
import { DEMO_SKIPPED_OUTCOME_CODE } from '../constants/demoAssessment.js'
import { CORRECT_RESOLUTION } from '../constants/scenarioEngine.js'
import {
  COMPARABILITY_FIELDS,
  COMPARISON_UNAVAILABLE,
  CONSTRUCTIVE_ACTIONS,
  CRITICAL_EVENT_CODES,
  DEMO_SKIPPED_OUTCOME_CLASS,
  FAMILY_LABELS,
  GRADED_STAGES,
  OUTCOME_CLASSES,
  PATH_LABELS,
  PLATFORM_LABELS,
  REMEDIATION_MAX,
  REMEDIATION_REASONS,
  REMEDIATION_SCORE_THRESHOLD,
  TRIGGER_LABELS,
} from '../constants/resultProjection.js'
import { Attempt } from '../models/Attempt.js'
import { ScenarioDefinition } from '../models/ScenarioDefinition.js'
import { ScenarioEvent } from '../models/ScenarioEvent.js'
import { ScenarioRun } from '../models/ScenarioRun.js'
import { buildScenarioReview, reviewSummary, skippedScenarioReview } from './scenarioReviewService.js'
import { isDemoSkippedRun } from './demoSelectionService.js'
import { ApiError } from '../utils/ApiError.js'

/**
 * The candidate-facing result projection (RESULT-001).
 *
 * Everything here is built from authoritative server state - `Attempt`, `ScenarioRun`,
 * `ScenarioEvent` and `ScenarioDefinition`. Nothing is derived from anything the client
 * submitted, and no total is ever accepted from a client: the sum is recomputed from the
 * ten per-scenario scores the engine committed and checked against the stored total.
 *
 * The release boundary changes here, deliberately and only for a FINISHED attempt.
 * Specification section 7 requires the learner to be told, for each case, what the item
 * actually was and what the safe response would have been - so `evaluation.feedback` is
 * released for the ten scenarios they just completed. Everything that would compromise a
 * scenario they have NOT seen stays server-side:
 *
 *   released   feedback (result, cues, safe action, impact, habit) for these ten only;
 *              family and trigger labels IN AGGREGATE across these ten
 *   withheld   the authoring title, end state, expected actions, per-stage scoring, the
 *              raw event ledger, event codes, point deltas, difficulty, the raw
 *              disposition enum, the rationale the learner typed, and every field of the
 *              other ninety scenarios
 *
 * REVIEW-001 widens that boundary by exactly one item, and only for these same ten
 * finished scenarios: `evaluation.stages[].expected_safe_behavior`, the stage-specific
 * safe behaviour the scenario's author wrote. It is what lets the review say "here is what
 * you should have done at the step where it went wrong" in the scenario's own words rather
 * than as a generic lecture, which is the whole point of the capability. Its neighbours in
 * the same sub-document - `scoring_text`, `scoring[]`, `learner_flow`, `expected_actions` -
 * stay server-side; the review builds its payload by construction from an allowlist of
 * prose, so they are absent by default rather than deleted by hand.
 */

const MAX_SCORE = ATTEMPT_SCENARIO_COUNT * SCENARIO_POINTS.max

/**
 * An integrity failure is a server fault, not a learner one: it means the ledger and the
 * attempt disagree. It is surfaced rather than repaired - silently patching production
 * data would hide the disagreement that caused it.
 */
function integrityFailure(message, details) {
  throw new ApiError(500, 'RESULT_INTEGRITY', message, details)
}

/* ------------------------------------------------------------------ *
 * Integrity
 * ------------------------------------------------------------------ */

/**
 * Everything that must hold before a result may be built. Section "DATA INTEGRITY":
 * exactly ten runs, complete unique ordinals, all resolved, valid scores, and a total
 * that matches the sum.
 */
export function assertResultIntegrity(attempt, runs) {
  if (runs.length !== ATTEMPT_SCENARIO_COUNT) {
    integrityFailure('This attempt does not hold the expected number of scenarios.',
      { expected: ATTEMPT_SCENARIO_COUNT, found: runs.length })
  }

  const ordinals = runs.map((r) => r.ordinal)
  const expected = Array.from({ length: ATTEMPT_SCENARIO_COUNT }, (_, i) => i + 1)
  if (new Set(ordinals).size !== ordinals.length) {
    integrityFailure('This attempt has a repeated scenario position.', { ordinals })
  }
  if (ordinals.slice().sort((a, b) => a - b).join(',') !== expected.join(',')) {
    integrityFailure('This attempt has a gap in its scenario positions.', { ordinals })
  }

  const unresolved = runs.filter((r) => r.status !== 'resolved')
  if (unresolved.length) {
    integrityFailure('This attempt has scenarios that were never resolved.',
      { ordinals: unresolved.map((r) => r.ordinal) })
  }

  const invalid = runs.filter((r) => !Number.isInteger(r.score_0_10)
    || r.score_0_10 < SCENARIO_POINTS.min || r.score_0_10 > SCENARIO_POINTS.max)
  if (invalid.length) {
    integrityFailure('This attempt has a scenario score outside the valid range.',
      { ordinals: invalid.map((r) => r.ordinal) })
  }

  // The authoritative sum. The stored total is a cache of it, and the two must agree.
  const sum = runs.reduce((total, r) => total + r.score_0_10, 0)
  if (attempt.total_score !== sum) {
    integrityFailure('The recorded total does not match the scenario scores.',
      { recorded: attempt.total_score, computed: sum })
  }
  return sum
}

/* ------------------------------------------------------------------ *
 * Action path
 * ------------------------------------------------------------------ */

/**
 * The compact timeline for one run, ordered by the ledger's own `sequence`.
 *
 * Never by insertion order, and never by timestamp: `(run_id, sequence)` is the unique
 * index the engine writes under, so it is the only ordering that cannot be wrong. An
 * event whose code has no label is dropped, so a code added later stays invisible until
 * someone gives it one.
 */
export function pathFromEvents(events) {
  return events
    .slice()
    .sort((a, b) => a.sequence - b.sequence)
    .flatMap((event) => {
      const label = PATH_LABELS[event.event_code]
      return label ? [{ step: event.sequence, ...label }] : []
    })
}

/* ------------------------------------------------------------------ *
 * Per-scenario outcome
 * ------------------------------------------------------------------ */

/**
 * Section 7: distinguish a missed threat from a false positive.
 *
 * Both halves come from the server: the disposition from `ScenarioDefinition`, the final
 * action and the path from the ledger. A malicious item that ended correctly but passed
 * through a critical unsafe action is still a missed threat - the outcome alone would
 * hide that the learner released details before reporting.
 */
export function classifyOutcome({ disposition, outcomeCode, eventCodes }) {
  /**
   * IMMERSIVE-001 / C2. A scenario the 90-minute limit closed carries no learner decision,
   * so it is classified before anything else and never scored as one.
   *
   * Falling through would have been actively wrong, not merely imprecise: `resolve_expired`
   * is absent from `CORRECT_RESOLUTION`, so a LEGITIMATE scenario the learner never
   * reached would have been reported as a `false_positive` - the projection asserting the
   * learner wrongly reported something they never opened. Any critical event genuinely
   * recorded before the deadline still stands in the event ledger and in the run's score;
   * it is only the final DISPOSITION that is withheld, because none was taken.
   */
  if (outcomeCode === EXPIRED_OUTCOME_CODE) return OUTCOME_CLASSES.NOT_RESOLVED

  /**
   * ENHANCEMENT-003. A Demo User skip is likewise no decision. Without this line the
   * fall-through would call it a missed threat or a false positive - scoring the skip as
   * wrong. Instructor screens therefore see it as `not_resolved`; the learner's own result
   * relabels it `skipped` (see `buildAttemptResult`).
   */
  if (outcomeCode === DEMO_SKIPPED_OUTCOME_CODE) return OUTCOME_CLASSES.NOT_RESOLVED

  const correct = (CORRECT_RESOLUTION[disposition] ?? []).includes(outcomeCode)
  const critical = eventCodes.some((code) => CRITICAL_EVENT_CODES.includes(code))

  if (disposition === 'malicious') {
    return correct && !critical ? OUTCOME_CLASSES.HANDLED_SAFELY : OUTCOME_CLASSES.MISSED_THREAT
  }
  if (!correct) return OUTCOME_CLASSES.FALSE_POSITIVE
  return critical ? OUTCOME_CLASSES.UNSAFE_HANDLING : OUTCOME_CLASSES.HANDLED_SAFELY
}

/**
 * The section 7 feedback card, taken verbatim from the scenario's own authored feedback.
 *
 * Nothing is generated. A definition with no feedback yields nulls and an empty cue list
 * rather than invented content - the specification's fields exist on every imported
 * scenario, so this is a guard, not an expected path.
 */
const NO_FEEDBACK = Object.freeze({
  result: null, cues: [], safe_action: null, impact: null, prevention_habit: null,
})

function feedbackFrom(definition) {
  const feedback = definition?.evaluation?.feedback
  if (!feedback) return { ...NO_FEEDBACK, cues: [] }
  return {
    result: feedback.result ?? null,
    cues: [...(feedback.cues ?? [])],
    safe_action: feedback.safe_action ?? null,
    impact: feedback.impact ?? null,
    prevention_habit: feedback.prevention_habit ?? null,
  }
}

/**
 * ADM-007: the feedback card for ONE resolved run, for immediate feedback timing.
 *
 * The same authored card, from the same PINNED definition, that the result screen shows
 * for this scenario - never anything for a run still in play. The caller decides whether
 * the timing policy allows releasing it; this only refuses to release it too early.
 */
export async function resolvedRunFeedback(run) {
  if (run?.status !== 'resolved') return null
  const definition = await ScenarioDefinition.findOne({
    scenario_id: run.scenario_id, version: run.definition_version,
  }).select('+evaluation')
  return definition ? feedbackFrom(definition) : null
}

/**
 * How the learner identifies the scenario, without the authoring title.
 *
 * DATA-001 classified the title as evaluation data - "Cloned Friend in Distress" states
 * the answer outright - so the learner is given what they actually saw instead: the
 * sender and the notification line from the synthetic content they were shown.
 */
function identityFrom(definition, run) {
  const notification = (definition?.synthetic?.assets ?? [])
    .find((asset) => asset.kind === 'notification')
  return {
    scenario_ref: run.scenario_id,
    platform: run.platform,
    platform_label: PLATFORM_LABELS[run.platform] ?? run.platform,
    sender: definition?.synthetic?.sender?.display_name ?? null,
    preview: notification?.content?.body ?? null,
  }
}

/* ------------------------------------------------------------------ *
 * Behaviour breakdown
 * ------------------------------------------------------------------ */

/** One aggregate bucket. `points` and `max_points` only - no deltas, no event codes. */
function bucket(key, label) {
  return { key, label, scenarios: 0, points: 0, max_points: 0, missed_threats: 0, false_positives: 0 }
}

function addTo(map, key, label, entry) {
  if (!map.has(key)) map.set(key, bucket(key, label))
  const b = map.get(key)
  b.scenarios += 1
  b.points += entry.score
  b.max_points += SCENARIO_POINTS.max
  if (entry.outcome_class === OUTCOME_CLASSES.MISSED_THREAT) b.missed_threats += 1
  if (entry.outcome_class === OUTCOME_CLASSES.FALSE_POSITIVE) b.false_positives += 1
}

const sorted = (map) => [...map.values()].sort((a, b) => a.label.localeCompare(b.label))

/**
 * Section 7: results by platform, attack family, trigger and action stage.
 *
 * Family and trigger come from the scenario's SERVER-SIDE canonical classification, never
 * from anything the learner did. A scenario carrying several triggers counts once in each
 * of its trigger buckets, so trigger totals may exceed ten by design.
 */
export function behaviourBreakdown(entries) {
  const platforms = new Map()
  const families = new Map()
  const triggers = new Map()

  for (const entry of entries) {
    addTo(platforms, entry.platform, PLATFORM_LABELS[entry.platform] ?? entry.platform, entry)
    addTo(families, entry.canonical_family,
      FAMILY_LABELS[entry.canonical_family] ?? entry.canonical_family, entry)
    for (const trigger of entry.canonical_triggers) {
      addTo(triggers, trigger, TRIGGER_LABELS[trigger] ?? trigger, entry)
    }
  }

  // Action stages: how often the constructive action was taken where it was available.
  const stages = GRADED_STAGES.map((stage) => {
    const wanted = CONSTRUCTIVE_ACTIONS[stage]
    const reached = entries.filter((e) => e.path.some((step) => step.stage === stage))
    const took = reached.filter((e) =>
      e.path.some((step) => step.stage === stage && wanted.includes(step.action)))
    return {
      stage,
      scenarios_reached: reached.length,
      constructive_actions: took.length,
    }
  })

  return {
    by_platform: sorted(platforms),
    by_family: sorted(families),
    by_trigger: sorted(triggers),
    by_stage: stages,
  }
}

/* ------------------------------------------------------------------ *
 * Comparison
 * ------------------------------------------------------------------ */

/**
 * Section 7: compare with the previous attempt only when mode and content version are
 * comparable.
 *
 * The lookup is scoped to this attempt's own `profile_id`, so another learner's data can
 * never enter the query. When nothing comparable exists the result says so rather than
 * comparing against something incomparable.
 */
export async function comparisonFor(attempt) {
  const previous = await Attempt.findOne({
    profile_id: attempt.profile_id,
    status: 'completed',
    _id: { $ne: attempt._id },
    completed_at: { $lt: attempt.completed_at },
  }).sort({ completed_at: -1 })

  if (!previous) {
    return { available: false, reason: COMPARISON_UNAVAILABLE.NO_PREVIOUS_ATTEMPT }
  }

  const mismatched = COMPARABILITY_FIELDS.filter((field) =>
    String(previous[field]) !== String(attempt[field]))
  if (mismatched.length) {
    return {
      available: false,
      reason: COMPARISON_UNAVAILABLE.NOT_COMPARABLE,
      // Field names only. No value from the other attempt is echoed.
      incomparable_on: mismatched,
    }
  }

  return {
    available: true,
    previous_attempt_id: previous._id.toString(),
    previous_total_score: previous.total_score,
    previous_completed_at: previous.completed_at,
    delta: attempt.total_score - previous.total_score,
    attempts_compared: 2,
  }
}

/* ------------------------------------------------------------------ *
 * Remediation
 * ------------------------------------------------------------------ */

/**
 * Section 7: two or three targeted practice recommendations from weak families.
 *
 * **Families, not scenario ids.** Naming the scenarios to practise would hand the learner
 * a partial answer key for a bank they will meet again, and no practice-mode workflow
 * exists yet for an id to resolve against. Each recommendation therefore names a family,
 * a blame-free reason and how many ACTIVE scenarios exist in it - enough for the
 * simulation to launch practice later without publishing which scenarios those are.
 *
 * Nothing here diagnoses. The reasons describe what happened in this attempt, never a
 * trait, a susceptibility or an emotional state.
 */
export async function remediationFor(families) {
  const weak = families
    .filter((f) => f.points < f.max_points * REMEDIATION_SCORE_THRESHOLD)
    .sort((a, b) => {
      // Worst first: missed threats, then false positives, then the widest points gap.
      if (b.missed_threats !== a.missed_threats) return b.missed_threats - a.missed_threats
      if (b.false_positives !== a.false_positives) return b.false_positives - a.false_positives
      return (b.max_points - b.points) - (a.max_points - a.points)
    })

  if (!weak.length) return []

  const counts = await ScenarioDefinition.aggregate([
    { $match: { active: true, canonical_family: { $in: weak.map((f) => f.key) } } },
    { $group: { _id: '$canonical_family', n: { $sum: 1 } } },
  ])
  const available = new Map(counts.map((c) => [c._id, c.n]))

  return weak
    // Never recommend practice that does not exist: active scenarios only.
    .filter((family) => (available.get(family.key) ?? 0) > 0)
    .slice(0, REMEDIATION_MAX)
    .map((family) => ({
      family_key: family.key,
      label: family.label,
      reason: family.missed_threats > 0
        ? REMEDIATION_REASONS.MISSED_THREAT
        : family.false_positives > 0
          ? REMEDIATION_REASONS.FALSE_POSITIVE
          : REMEDIATION_REASONS.PARTIAL,
      points: family.points,
      max_points: family.max_points,
      practice_scenarios_available: available.get(family.key),
    }))
}

/* ------------------------------------------------------------------ *
 * The projection
 * ------------------------------------------------------------------ */

/**
 * The full candidate-safe result for a completed attempt.
 *
 * Pure read: it writes nothing, so a repeated GET returns the same payload. Callers are
 * responsible for ownership; this function assumes the attempt already belongs to the
 * requester.
 */
export async function buildAttemptResult(attempt) {
  if (attempt.status !== 'completed') {
    throw ApiError.conflict('ATTEMPT_NOT_COMPLETE', 'This attempt is not complete yet.')
  }

  const runs = await ScenarioRun.find({ attempt_id: attempt._id }).sort({ ordinal: 1 })
  const totalScore = assertResultIntegrity(attempt, runs)

  // The pinned definitions, WITH evaluation: this is the one place a learner-facing
  // projection is allowed to read it, and only the feedback block leaves this function.
  const definitions = await ScenarioDefinition.find({
    $or: runs.map((r) => ({ scenario_id: r.scenario_id, version: r.definition_version })),
  }).select('+evaluation')
  const definitionFor = new Map(
    definitions.map((d) => [`${d.scenario_id}:${d.version}`, d]),
  )

  /**
   * `stage` joins the projection for REVIEW-001: a mistake is reported in the stage the
   * ledger recorded it in, not the stage a lookup table assumes it belongs to. It stays
   * server-side - the review publishes prose, never a ledger field.
   */
  const events = await ScenarioEvent.find({ run_id: { $in: runs.map((r) => r._id) } })
    .select('run_id sequence event_code stage')
  const eventsByRun = new Map()
  for (const event of events) {
    const key = String(event.run_id)
    if (!eventsByRun.has(key)) eventsByRun.set(key, [])
    eventsByRun.get(key).push(event)
  }

  const entries = runs.map((run) => {
    const definition = definitionFor.get(`${run.scenario_id}:${run.definition_version}`)
    if (!definition) {
      integrityFailure('The scenario content for a resolved scenario is missing.',
        { ordinal: run.ordinal })
    }

    const runEvents = eventsByRun.get(String(run._id)) ?? []
    const path = pathFromEvents(runEvents)

    /**
     * ENHANCEMENT-003. A scenario the Demo User skipped keeps its committed score and its
     * path, and loses everything that would reveal what the item was: its own outcome
     * class instead of one derived from the disposition, a review card with no authored
     * content, no feedback, and no place in the family / trigger / stage breakdown or the
     * remediation built from it. Only a demo attempt can hold such a run.
     */
    if (isDemoSkippedRun(run)) {
      return {
        run,
        definition,
        path,
        skipped: true,
        score: run.score_0_10,
        platform: run.platform,
        outcome_class: DEMO_SKIPPED_OUTCOME_CLASS,
        review: skippedScenarioReview({ path }),
      }
    }

    const outcomeClass = classifyOutcome({
      disposition: definition.disposition,
      outcomeCode: run.outcome_code,
      eventCodes: runEvents.map((e) => e.event_code),
    })

    return {
      run,
      definition,
      path,
      score: run.score_0_10,
      platform: run.platform,
      canonical_family: definition.canonical_family,
      canonical_triggers: [...definition.canonical_triggers],
      outcome_class: outcomeClass,

      /**
       * REVIEW-001. The learning review for this scenario: what the learner did, what was
       * wrong with it, what they missed, what the correct action was, why it mattered and
       * what to remember.
       *
       * Built from the same two sources this entry already holds - the ledger and the
       * pinned definition - and given the outcome class rather than recomputing it, so the
       * review and the summary above it can never disagree about whether a scenario was a
       * missed threat or a false positive.
       */
      review: buildScenarioReview({
        definition,
        run,
        events: runEvents,
        outcomeClass,
        path,
      }),
    }
  })

  const behaviour = behaviourBreakdown(entries.filter((e) => !e.skipped))
  const skippedCount = entries.filter((e) => e.skipped).length
  const [comparison, remediation] = await Promise.all([
    comparisonFor(attempt),
    remediationFor(behaviour.by_family),
  ])

  const counts = (klass) => entries.filter((e) => e.outcome_class === klass).length

  return {
    // --- unchanged API-001 keys: the existing result surface, preserved -----
    attempt_id: attempt.id,
    status: attempt.status,
    mode: attempt.mode,
    total_score: totalScore,
    max_score: MAX_SCORE,
    scenarios_resolved: runs.filter((r) => r.status === 'resolved').length,
    scenarios_total: runs.length,
    started_at: attempt.started_at,
    completed_at: attempt.completed_at,

    /**
     * --- IMMERSIVE-001 -----------------------------------------------------
     *
     * Why the attempt ended, and - when it ended on the clock - what the limit was and how
     * much was left undone. Enough for the result screen to state the fact plainly and
     * blame-free, which is what section 5's interpretation safeguard requires; nothing here
     * infers anything about the learner.
     *
     * `expires_at` is safe to publish for the same reason it is safe during the assessment:
     * it is `started_at` plus a limit the learner was told about.
     */
    end_reason: attempt.end_reason ?? null,
    timed_out: attempt.end_reason === 'expired',
    time_limit_ms: attempt.time_limit_ms ?? null,
    expires_at: attempt.expires_at ?? null,
    expired_at: attempt.expired_at ?? null,
    unresolved_at_expiry: attempt.unresolved_at_expiry ?? null,

    // --- RESULT-001 ---------------------------------------------------------
    summary: {
      total_score: totalScore,
      max_score: MAX_SCORE,
      scenarios: runs.length,
      handled_safely: counts(OUTCOME_CLASSES.HANDLED_SAFELY),
      missed_threats: counts(OUTCOME_CLASSES.MISSED_THREAT),
      false_positives: counts(OUTCOME_CLASSES.FALSE_POSITIVE),
      unsafe_handling: counts(OUTCOME_CLASSES.UNSAFE_HANDLING),
      /** IMMERSIVE-001: scenarios the clock closed, not scenarios answered wrongly. */
      not_resolved: counts(OUTCOME_CLASSES.NOT_RESOLVED),
      /** ENHANCEMENT-003. Present only when the Demo User skipped something. */
      ...(skippedCount ? { skipped: skippedCount } : {}),
      duration_ms: attempt.completed_at && attempt.started_at
        ? attempt.completed_at.getTime() - attempt.started_at.getTime()
        : null,
    },

    scenarios: entries.map((entry) => ({
      // Keys API-001 already published, unchanged.
      ordinal: entry.run.ordinal,
      platform: entry.run.platform,
      score_0_10: entry.score,
      outcome_code: entry.run.outcome_code,
      final_stage: entry.run.current_stage,
      resolved_at: entry.run.resolved_at,

      // Added by RESULT-001.
      ...identityFrom(entry.definition, entry.run),
      outcome_class: entry.outcome_class,
      max_score: SCENARIO_POINTS.max,
      path: entry.path,
      feedback: entry.skipped ? { ...NO_FEEDBACK, cues: [] } : feedbackFrom(entry.definition),
      /** ENHANCEMENT-003. Present only on a scenario the Demo User skipped. */
      ...(entry.skipped ? { skipped: true } : {}),

      /** REVIEW-001. Additive: every key above keeps its name and its meaning. */
      review: entry.review,
    })),

    /**
     * REVIEW-001. The counts that head the learning review, derived from the same entries
     * the cards below are built from. Not a second score - `summary.total_score` remains
     * the only authoritative figure, and this explains how it was arrived at.
     */
    review_summary: {
      ...reviewSummary(entries),
      ...(skippedCount ? { skipped: skippedCount } : {}),
    },

    behaviour,
    comparison,
    remediation,
  }
}
