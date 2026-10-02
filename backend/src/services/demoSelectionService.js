import { demoConfig } from '../config/demo.js'
import {
  DEMO_DISPOSITION_QUOTA,
  DEMO_SCENARIO_SEQUENCE,
  DEMO_SEED,
  DEMO_SELECTION_VERSION,
  DEMO_SKIPPED_OUTCOME_CODE,
} from '../constants/demoAssessment.js'
import { ATTEMPT_SCENARIO_COUNT } from '../constants/scenarioSelection.js'
import { normaliseIdentifier } from '../models/Candidate.js'
import { SelectionError } from './scenarioSelectionService.js'

/**
 * Demo User recognition and the fixed demo selection (ENHANCEMENT-003).
 *
 * Pure: no database, no request. Kept apart from `demoAssessmentService` so that
 * `attemptService` and `attemptResultService` can ask "is this a demo attempt?" without an
 * import cycle.
 */

/** The configured demo service number in the form profiles are keyed on, or null when disabled. */
export function demoIdentifier() {
  const raw = String(demoConfig.serviceNumber ?? '').trim()
  return raw ? normaliseIdentifier(raw) : null
}

/**
 * Is this authenticated profile the Demo User?
 *
 * Reads only the profile the SESSION resolved (`req.candidate`). There is no parameter
 * through which a request body, query or header could influence the answer.
 */
export function isDemoCandidate(candidate) {
  const demo = demoIdentifier()
  if (!demo || !candidate?.identifierNormalised) return false
  return candidate.identifierNormalised === demo
}

/** Was this attempt built by the fixed demo selector? Read from its frozen selection metadata. */
export function isDemoAttempt(attempt) {
  return attempt?.selection?.selection_algorithm_version === DEMO_SELECTION_VERSION
}

/** Was this run closed by a demo skip rather than by a learner decision? */
export function isDemoSkippedRun(run) {
  return run?.outcome_code === DEMO_SKIPPED_OUTCOME_CODE
}

const tally = (items, key) => items.reduce((acc, item) => {
  const value = key(item)
  acc[value] = (acc[value] ?? 0) + 1
  return acc
}, {})

/**
 * The demo counterpart of `selectAttemptScenarios()`, with the same call shape and the same
 * return shape, so `createAttempt()` persists it through exactly the code a normal attempt
 * uses - transaction, deadline, ten runs and all.
 *
 * Deterministic: the seed, the history and the attempt index change nothing about which
 * scenarios are chosen or in what order. It also refuses rather than degrades - a missing
 * or inactive id, a duplicate, or a bank whose dispositions no longer give 6 + 4 is a
 * configuration fault, and an attempt built around it would be a misleading demonstration.
 */
export function selectDemoScenarios({ pool, attemptIndex = 0 } = {}) {
  const byId = new Map((pool ?? []).map((s) => [s.scenario_id, s]))

  if (DEMO_SCENARIO_SEQUENCE.length !== ATTEMPT_SCENARIO_COUNT
    || new Set(DEMO_SCENARIO_SEQUENCE).size !== DEMO_SCENARIO_SEQUENCE.length) {
    throw new SelectionError('SELECTION_CONSTRAINT_UNSATISFIABLE',
      `the demo set must be ${ATTEMPT_SCENARIO_COUNT} unique scenario ids`)
  }

  const missing = DEMO_SCENARIO_SEQUENCE.filter((id) => !byId.has(id))
  if (missing.length) {
    throw new SelectionError('SELECTION_POOL_INSUFFICIENT',
      'the demo set names scenarios that are not active in the bank', { missing })
  }

  const scenarios = DEMO_SCENARIO_SEQUENCE.map((id) => byId.get(id))
  const dispositions = tally(scenarios, (s) => s.disposition)
  if (dispositions.malicious !== DEMO_DISPOSITION_QUOTA.malicious
    || dispositions.legitimate !== DEMO_DISPOSITION_QUOTA.legitimate) {
    throw new SelectionError('SELECTION_CONSTRAINT_UNSATISFIABLE',
      'the demo set no longer holds 6 malicious and 4 legitimate scenarios')
  }

  return {
    scenario_ids: [...DEMO_SCENARIO_SEQUENCE],
    scenarios,
    seed: DEMO_SEED,
    selection_algorithm_version: DEMO_SELECTION_VERSION,
    attempt_index: attemptIndex,
    platform_quota: tally(scenarios, (s) => s.platform),
    composition: {
      platform_counts: tally(scenarios, (s) => s.platform),
      difficulty_counts: tally(scenarios, (s) => s.level),
      disposition_counts: dispositions,
      military_count: scenarios.filter((s) => s.military_flag).length,
      canonical_family_counts: tally(scenarios, (s) => s.canonical_family),
      canonical_trigger_count: new Set(scenarios.flatMap((s) => s.canonical_triggers ?? [])).size,
    },
    /** Not applied: a demonstration must show the same ten every time. Recorded, not hidden. */
    recent_exclusion: { applied: false, reason: 'fixed_demo_sequence' },
    relaxations: [],
  }
}
