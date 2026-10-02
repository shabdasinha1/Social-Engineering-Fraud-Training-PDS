import {
  ATTEMPT_SCENARIO_COUNT,
  DIFFICULTY_QUOTA,
  DISPOSITION_QUOTA,
  MAX_CONSECUTIVE_SAME_PLATFORM,
  MAX_PER_CANONICAL_FAMILY,
  MAX_SEARCH_STEPS,
  MILITARY_RANGE,
  MIN_DISTINCT_TRIGGERS,
  PLATFORM_ORDER,
  PLATFORM_PATTERN,
  RECENT_EXCLUSION_WINDOW,
  RELAXATION_RECENT_EXCLUSION,
  SELECTION_ALGORITHM_VERSION,
  SELECTION_ERRORS,
} from '../constants/scenarioSelection.js'
import { seededRandom } from '../utils/seededRandom.js'

/**
 * Deterministic 10-scenario attempt selection (SELECT-002).
 *
 * Pure and synchronous: it takes a candidate pool and returns a plan. No database, no
 * clock, no global state - so the whole solver is testable offline and, given the same
 * seed, pool and history, returns byte-identical output on any machine.
 *
 * NOT rejection sampling. The full constraint set has roughly a 1.2% yield against random
 * draws (PROJECT_MASTER_PLAN.md 15.24), so "pick ten and test" would waste ~80 draws per
 * success and degrade badly under exclusions. This builds a solution instead: a concrete
 * slot matrix, then a depth-first assignment with forward checking that prunes a partial
 * state the moment it cannot be completed.
 */

export class SelectionError extends Error {
  constructor(code, message, details = null) {
    super(message)
    this.name = 'SelectionError'
    this.code = code
    this.status = SELECTION_ERRORS[code] ?? 500
    this.details = details
    this.isDomainError = true
  }
}

const fail = (code, message, details) => {
  throw new SelectionError(code, message, details)
}

/* ------------------------------------------------------------------ *
 * Platform rotation
 * ------------------------------------------------------------------ */

/**
 * Rotates the 3/3/2/2 allocation by the learner's attempt index.
 *
 * Driven by history rather than by the seed, deliberately. A seed-derived rotation is
 * only balanced in expectation; rotating by attempt index gives every platform exactly
 * 3+3+2+2 = 10 scenarios across any four consecutive attempts, which is what "long-run
 * exposure is balanced" asks for. The seed still decides which scenarios are chosen.
 */
export function platformQuotaFor(attemptIndex) {
  const offset = ((attemptIndex % PLATFORM_ORDER.length) + PLATFORM_ORDER.length) % PLATFORM_ORDER.length
  const quota = {}
  PLATFORM_ORDER.forEach((platform, i) => {
    quota[platform] = PLATFORM_PATTERN[(i + offset) % PLATFORM_PATTERN.length]
  })
  return quota
}

/* ------------------------------------------------------------------ *
 * Independent validator - deliberately separate from the constructor
 * ------------------------------------------------------------------ */

/**
 * Checks a finished selection against every client rule from scratch.
 *
 * Written to know nothing about how the solver works: a bug in the search must not be
 * able to hide behind shared logic. Returns a list of violations, empty when valid.
 */
export function validateSelection(scenarios, { platformQuota, recentIds = [], allowedRecentIds = [] } = {}) {
  const errors = []
  const count = (fn) => scenarios.reduce((acc, s) => {
    const k = fn(s)
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})

  if (scenarios.length !== ATTEMPT_SCENARIO_COUNT) {
    errors.push(`expected ${ATTEMPT_SCENARIO_COUNT} scenarios, got ${scenarios.length}`)
  }

  const ids = scenarios.map((s) => s.scenario_id)
  if (new Set(ids).size !== ids.length) errors.push('duplicate scenario ids in the attempt')

  const disposition = count((s) => s.disposition)
  for (const [key, want] of Object.entries(DISPOSITION_QUOTA)) {
    if ((disposition[key] ?? 0) !== want) {
      errors.push(`expected ${want} ${key}, got ${disposition[key] ?? 0}`)
    }
  }

  const legitimate = scenarios.filter((s) => s.disposition === 'legitimate')
  if (new Set(legitimate.map((s) => s.platform)).size < Math.min(legitimate.length, 2)) {
    errors.push('the legitimate scenarios must come from different platforms')
  }

  const level = count((s) => s.level)
  for (const [key, want] of Object.entries(DIFFICULTY_QUOTA)) {
    if ((level[key] ?? 0) !== want) errors.push(`expected ${want} ${key}, got ${level[key] ?? 0}`)
  }

  if (platformQuota) {
    const platform = count((s) => s.platform)
    for (const [key, want] of Object.entries(platformQuota)) {
      if ((platform[key] ?? 0) !== want) {
        errors.push(`platform ${key}: expected ${want}, got ${platform[key] ?? 0}`)
      }
    }
  }

  const military = scenarios.filter((s) => s.military_flag).length
  if (military < MILITARY_RANGE.min || military > MILITARY_RANGE.max) {
    errors.push(`military-context count ${military} outside ${MILITARY_RANGE.min}-${MILITARY_RANGE.max}`)
  }

  const triggers = new Set(scenarios.flatMap((s) => s.canonical_triggers ?? []))
  if (triggers.size < MIN_DISTINCT_TRIGGERS) {
    errors.push(`only ${triggers.size} distinct canonical triggers, need ${MIN_DISTINCT_TRIGGERS}`)
  }

  const families = count((s) => s.canonical_family)
  for (const [family, n] of Object.entries(families)) {
    if (n > MAX_PER_CANONICAL_FAMILY) {
      errors.push(`canonical family "${family}" appears ${n} times, max ${MAX_PER_CANONICAL_FAMILY}`)
    }
  }

  const allowed = new Set(allowedRecentIds)
  const violating = ids.filter((id) => recentIds.includes(id) && !allowed.has(id))
  if (violating.length) {
    errors.push(`recent scenarios used without being permitted: ${violating.join(', ')}`)
  }

  return errors
}

/* ------------------------------------------------------------------ *
 * Constraint-directed search
 * ------------------------------------------------------------------ */

/** Builds the concrete slot matrix: one (platform, disposition) pair per ordinal. */
function buildSlots(platformQuota, legitimatePlatforms) {
  const slots = []
  for (const platform of PLATFORM_ORDER) {
    const total = platformQuota[platform] ?? 0
    const legit = legitimatePlatforms.filter((p) => p === platform).length
    for (let i = 0; i < total; i += 1) {
      slots.push({ platform, disposition: i < legit ? 'legitimate' : 'malicious' })
    }
  }
  return slots
}

/**
 * Assigns scenarios to slots by depth-first search with forward checking.
 *
 * Slots are solved most-constrained-first, so the scarcest pools (legitimate scenarios -
 * only five per platform) are decided while the search still has freedom, rather than
 * discovered to be impossible at depth nine.
 *
 * Pruning at every step, each rule cutting a whole subtree rather than a single leaf:
 *   - difficulty  remaining quota must exactly fill remaining slots, and each remaining
 *                 slot must still have a candidate at a level that has quota left
 *   - military    current count must not exceed the max, and the best case over the
 *                 remaining slots must still reach the min
 *   - family      a family already used twice is removed from consideration
 *   - triggers    current distinct triggers plus everything still reachable must be able
 *                 to reach the minimum
 */
function solveSlots({ slots, pool, rng, stepBudget, recentSet = new Set(), maxRecent = 0 }) {
  const byKey = new Map()
  for (const scenario of pool) {
    const key = `${scenario.platform}:${scenario.disposition}`
    if (!byKey.has(key)) byKey.set(key, [])
    byKey.get(key).push(scenario)
  }
  // Deterministic candidate order, keyed by scenario_id so database insertion order
  // cannot influence the result. Non-recent candidates are tried first, so a solution
  // that touches no recent scenario is always found before one that does.
  for (const [key, list] of byKey) {
    const ranked = rng.rankBy(list, (s) => s.scenario_id)
    byKey.set(key, [
      ...ranked.filter((s) => !recentSet.has(s.scenario_id)),
      ...ranked.filter((s) => recentSet.has(s.scenario_id)),
    ])
  }

  const ordered = [...slots]
    .map((slot, index) => ({
      ...slot,
      index,
      candidates: byKey.get(`${slot.platform}:${slot.disposition}`) ?? [],
    }))
    .sort((a, b) => a.candidates.length - b.candidates.length || a.index - b.index)

  const used = new Set()
  const familyCount = new Map()
  const triggerCount = new Map()
  const levelLeft = { ...DIFFICULTY_QUOTA }
  const assignment = new Array(ordered.length).fill(null)
  let military = 0
  let recentUsed = 0
  let steps = 0

  const eligible = (slot) => slot.candidates.filter((s) =>
    !used.has(s.scenario_id)
    && levelLeft[s.level] > 0
    && (familyCount.get(s.canonical_family) ?? 0) < MAX_PER_CANONICAL_FAMILY
    && !(recentSet.has(s.scenario_id) && recentUsed >= maxRecent))

  function feasible(depth) {
    const remaining = ordered.slice(depth)
    const remainingCount = remaining.length

    const quotaLeft = levelLeft.easy + levelLeft.medium + levelLeft.hard
    if (quotaLeft !== remainingCount) return false

    if (military > MILITARY_RANGE.max) return false
    if (recentUsed > maxRecent) return false

    let reachableMilitary = military
    const reachableTriggers = new Set(triggerCount.keys())
    for (const slot of remaining) {
      const options = eligible(slot)
      if (options.length === 0) return false
      if (options.some((s) => s.military_flag)) reachableMilitary += 1
      for (const option of options) {
        for (const t of option.canonical_triggers ?? []) reachableTriggers.add(t)
      }
    }
    if (reachableMilitary < MILITARY_RANGE.min) return false
    if (reachableTriggers.size < MIN_DISTINCT_TRIGGERS) return false

    // Each remaining level quota must be servable by distinct remaining slots.
    for (const level of Object.keys(levelLeft)) {
      if (levelLeft[level] === 0) continue
      const servers = remaining.filter((slot) => eligible(slot).some((s) => s.level === level)).length
      if (servers < levelLeft[level]) return false
    }
    return true
  }

  function place(scenario, delta) {
    if (delta > 0) used.add(scenario.scenario_id)
    else used.delete(scenario.scenario_id)
    levelLeft[scenario.level] -= delta
    military += scenario.military_flag ? delta : 0
    recentUsed += recentSet.has(scenario.scenario_id) ? delta : 0
    const f = scenario.canonical_family
    familyCount.set(f, (familyCount.get(f) ?? 0) + delta)
    if (familyCount.get(f) === 0) familyCount.delete(f)
    for (const t of scenario.canonical_triggers ?? []) {
      triggerCount.set(t, (triggerCount.get(t) ?? 0) + delta)
      if (triggerCount.get(t) === 0) triggerCount.delete(t)
    }
  }

  function search(depth) {
    if ((steps += 1) > stepBudget) {
      fail('SELECTION_CONSTRAINT_UNSATISFIABLE',
        'selection search exceeded its step budget', { steps })
    }
    if (depth === ordered.length) {
      return military >= MILITARY_RANGE.min
        && military <= MILITARY_RANGE.max
        && triggerCount.size >= MIN_DISTINCT_TRIGGERS
        && recentUsed <= maxRecent
    }
    if (!feasible(depth)) return false

    const slot = ordered[depth]
    for (const scenario of eligible(slot)) {
      place(scenario, +1)
      assignment[slot.index] = scenario
      if (search(depth + 1)) return true
      assignment[slot.index] = null
      place(scenario, -1)
    }
    return false
  }

  return search(0) ? assignment : null
}

/**
 * Presentation order. Section 3: "Do not lock apps into a fixed sequence."
 *
 * A seeded shuffle, then a deterministic repair pass that breaks any run of more than two
 * consecutive scenarios from one platform, so an attempt never reads as four WhatsApp
 * items followed by four emails.
 */
function orderForPresentation(scenarios, rng) {
  const ordered = rng.shuffle(scenarios)
  for (let i = MAX_CONSECUTIVE_SAME_PLATFORM; i < ordered.length; i += 1) {
    const run = ordered.slice(i - MAX_CONSECUTIVE_SAME_PLATFORM, i + 1)
    if (new Set(run.map((s) => s.platform)).size > 1) continue
    const swap = ordered.findIndex((s, j) => j > i && s.platform !== ordered[i].platform)
    if (swap === -1) break
    ;[ordered[i], ordered[swap]] = [ordered[swap], ordered[i]]
  }
  return ordered
}

/* ------------------------------------------------------------------ *
 * Entry point
 * ------------------------------------------------------------------ */

/**
 * Selects one frozen 10-scenario sequence.
 *
 * Recent-20 handling is a two-pass, minimal relaxation. Pass A excludes all recent ids.
 * Only if that is unsatisfiable does Pass B re-admit them one at a time, oldest first, and
 * stop at the first k that solves - so 1 is never rounded up to 3. Nothing else is ever
 * relaxed: the composition rules are hard, and an unsatisfiable pool fails loudly.
 *
 * @param {object[]} pool     active definitions: { scenario_id, platform, level,
 *                            disposition, canonical_family, canonical_triggers,
 *                            military_flag, version }
 * @param {string[]} recentScenarioIds  most-recent-first history
 */
export function selectAttemptScenarios({
  pool = [],
  seed,
  attemptIndex = 0,
  recentScenarioIds = [],
  stepBudget = MAX_SEARCH_STEPS,
} = {}) {
  if (!seed) fail('SELECTION_INTERNAL_ERROR', 'a selection seed is required')
  if (pool.length < ATTEMPT_SCENARIO_COUNT) {
    fail('SELECTION_POOL_INSUFFICIENT',
      `the pool holds ${pool.length} scenarios; ${ATTEMPT_SCENARIO_COUNT} are needed`)
  }

  const rng = seededRandom(seed)
  const platformQuota = platformQuotaFor(attemptIndex)

  // Most-recent-first, capped at the window.
  const recent = recentScenarioIds.slice(0, RECENT_EXCLUSION_WINDOW)
  // Legitimate platform pairs, deterministically ordered. Bounded at six.
  const pairs = []
  for (let i = 0; i < PLATFORM_ORDER.length; i += 1) {
    for (let j = i + 1; j < PLATFORM_ORDER.length; j += 1) {
      const a = PLATFORM_ORDER[i]
      const b = PLATFORM_ORDER[j]
      if ((platformQuota[a] ?? 0) > 0 && (platformQuota[b] ?? 0) > 0) pairs.push([a, b])
    }
  }
  const orderedPairs = rng.rankBy(pairs, (p) => p.join('|'))

  const recentSet = new Set(recent)

  // Minimal relaxation, measured the way the specification measures it: the NUMBER of
  // recent scenarios used. `maxRecent` is a hard budget inside the search, so the solver
  // is free to choose WHICH recent items to re-admit rather than being handed a fixed
  // prefix. That distinction matters: re-admitting the oldest first can need six items
  // where a well-chosen two would do, because the oldest five may all sit on one platform
  // and fail the different-platform rule.
  for (let maxRecent = 0; maxRecent <= recent.length; maxRecent += 1) {
    for (const legitimatePlatforms of orderedPairs) {
      const slots = buildSlots(platformQuota, legitimatePlatforms)
      if (slots.length !== ATTEMPT_SCENARIO_COUNT) {
        fail('SELECTION_INTERNAL_ERROR', 'slot matrix does not hold ten slots')
      }
      const assignment = solveSlots({ slots, pool, rng, stepBudget, recentSet, maxRecent })
      if (!assignment) continue

      const selected = orderForPresentation(assignment, rng)
      // Whichever recent items the solver actually used - never more than maxRecent.
      const allowedRecentIds = selected
        .map((s) => s.scenario_id)
        .filter((id) => recentSet.has(id))
      const violations = validateSelection(selected, {
        platformQuota, recentIds: recent, allowedRecentIds,
      })
      if (violations.length) {
        // The constructor and the validator disagree - a solver bug, never a data problem.
        fail('SELECTION_INTERNAL_ERROR',
          'the constructed selection failed independent validation', { violations })
      }

      return {
        scenario_ids: selected.map((s) => s.scenario_id),
        scenarios: selected,
        seed: String(seed),
        selection_algorithm_version: SELECTION_ALGORITHM_VERSION,
        attempt_index: attemptIndex,
        platform_quota: platformQuota,
        legitimate_platforms: [...legitimatePlatforms],
        composition: summarise(selected),
        recent_exclusion: {
          requested: RECENT_EXCLUSION_WINDOW,
          history_size: recent.length,
          excluded: recent.length - allowedRecentIds.length,
          relaxed: allowedRecentIds.length > 0,
          allowed_recent_ids: allowedRecentIds,
        },
        relaxations: allowedRecentIds.length > 0 ? [RELAXATION_RECENT_EXCLUSION] : [],
      }
    }
  }

  fail('SELECTION_CONSTRAINT_UNSATISFIABLE',
    'no valid 10-scenario attempt can be built from the available pool')
  return null
}

/** Composition summary for persistence and audit. Never candidate-facing. */
export function summarise(scenarios) {
  const tally = (fn) => scenarios.reduce((acc, s) => {
    for (const k of [fn(s)].flat()) acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})
  return {
    platform_counts: tally((s) => s.platform),
    difficulty_counts: tally((s) => s.level),
    disposition_counts: tally((s) => s.disposition),
    military_count: scenarios.filter((s) => s.military_flag).length,
    canonical_family_counts: tally((s) => s.canonical_family),
    canonical_trigger_count: new Set(scenarios.flatMap((s) => s.canonical_triggers ?? [])).size,
  }
}
