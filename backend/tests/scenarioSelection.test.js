import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DIFFICULTY_QUOTA,
  MAX_PER_CANONICAL_FAMILY,
  MILITARY_RANGE,
  MIN_DISTINCT_TRIGGERS,
  PLATFORM_ORDER,
  RECENT_EXCLUSION_WINDOW,
  SELECTION_ALGORITHM_VERSION,
} from '../src/constants/scenarioSelection.js'
import {
  loadSourceScenarios,
  loadTaxonomies,
  toScenarioDefinition,
} from '../src/services/scenarioDefinitionImportService.js'
import {
  platformQuotaFor,
  selectAttemptScenarios,
  summarise,
  validateSelection,
} from '../src/services/scenarioSelectionService.js'
import { seededRandom } from '../src/utils/seededRandom.js'

/**
 * SELECT-002 - solver tests. No database.
 *
 * The pool is the REAL imported 100-scenario client bank, so every constraint is tested
 * against real content distribution rather than a convenient fixture.
 */

const taxonomies = await loadTaxonomies()
const { scenarios: source } = await loadSourceScenarios()
const POOL = source.map((r) => {
  const d = toScenarioDefinition(r, taxonomies).doc
  return {
    scenario_id: d.scenario_id,
    platform: d.platform,
    level: d.level,
    disposition: d.disposition,
    canonical_family: d.canonical_family,
    canonical_triggers: d.canonical_triggers,
    military_flag: d.military_flag,
    version: d.version,
  }
})

const catchCode = (fn) => {
  try {
    fn()
    return null
  } catch (error) {
    return error.code
  }
}

const select = (opts = {}) => selectAttemptScenarios({ pool: POOL, seed: 'seed-a', ...opts })

/* ------------------------------------------------------------------ *
 * 1-9  composition
 * ------------------------------------------------------------------ */

test('a full pool produces a valid 10-scenario attempt', () => {
  const plan = select()
  assert.equal(plan.scenario_ids.length, 10)
  assert.deepEqual(validateSelection(plan.scenarios, { platformQuota: plan.platform_quota }), [])
})

test('every constraint holds across 400 seeds and rotations', () => {
  for (let i = 0; i < 400; i += 1) {
    const plan = select({ seed: `seed-${i}`, attemptIndex: i % 4 })
    const errors = validateSelection(plan.scenarios, { platformQuota: plan.platform_quota })
    assert.deepEqual(errors, [], `seed-${i}: ${errors.join('; ')}`)

    const c = plan.composition
    assert.equal(c.disposition_counts.malicious, 8)
    assert.equal(c.disposition_counts.legitimate, 2)
    assert.deepEqual(c.difficulty_counts, DIFFICULTY_QUOTA)
    assert.deepEqual([...Object.values(c.platform_counts)].sort(), [2, 2, 3, 3])
    assert.ok(c.military_count >= MILITARY_RANGE.min && c.military_count <= MILITARY_RANGE.max)
    assert.ok(c.canonical_trigger_count >= MIN_DISTINCT_TRIGGERS)
    assert.ok(Math.max(...Object.values(c.canonical_family_counts)) <= MAX_PER_CANONICAL_FAMILY)
    assert.equal(new Set(plan.scenario_ids).size, 10)
  }
})

test('the two legitimate scenarios always come from different platforms', () => {
  for (let i = 0; i < 200; i += 1) {
    const plan = select({ seed: `legit-${i}`, attemptIndex: i % 4 })
    const platforms = plan.scenarios.filter((s) => s.disposition === 'legitimate').map((s) => s.platform)
    assert.equal(platforms.length, 2)
    assert.notEqual(platforms[0], platforms[1], `seed legit-${i}`)
  }
})

test('legitimate scenarios are not exempt from the other quotas', () => {
  const plan = select({ seed: 'quota-check' })
  const legit = plan.scenarios.filter((s) => s.disposition === 'legitimate')
  // They occupy platform and difficulty slots like any other scenario.
  const platformCounts = summarise(plan.scenarios).platform_counts
  for (const s of legit) assert.ok(platformCounts[s.platform] > 0)
  assert.deepEqual(summarise(plan.scenarios).difficulty_counts, DIFFICULTY_QUOTA)
})

/* ------------------------------------------------------------------ *
 * platform rotation
 * ------------------------------------------------------------------ */

test('the platform rotation is exactly balanced every four attempts', () => {
  const totals = Object.fromEntries(PLATFORM_ORDER.map((p) => [p, 0]))
  for (let i = 0; i < 4; i += 1) {
    const quota = platformQuotaFor(i)
    assert.deepEqual([...Object.values(quota)].sort(), [2, 2, 3, 3], `attempt ${i}`)
    for (const [p, n] of Object.entries(quota)) totals[p] += n
  }
  for (const p of PLATFORM_ORDER) {
    assert.equal(totals[p], 10, `${p} must receive 3+3+2+2 across four attempts`)
  }
})

test('the rotation does not permanently favour WhatsApp', () => {
  const first = platformQuotaFor(0)
  const later = platformQuotaFor(2)
  assert.notDeepEqual(first, later, 'the allocation must move between attempts')
  assert.equal(platformQuotaFor(0).whatsapp, platformQuotaFor(4).whatsapp, 'and repeat with period 4')
})

test('the rotation is driven by attempt index, not by seed', () => {
  const a = select({ seed: 'x', attemptIndex: 1 }).platform_quota
  const b = select({ seed: 'completely-different', attemptIndex: 1 }).platform_quota
  assert.deepEqual(a, b, 'the same attempt index must give the same platform quota')
})

/* ------------------------------------------------------------------ *
 * 15-17  determinism
 * ------------------------------------------------------------------ */

test('the same seed, pool and history produce an identical sequence', () => {
  const a = select({ seed: 'fixed', attemptIndex: 2, recentScenarioIds: ['W01', 'I05'] })
  const b = select({ seed: 'fixed', attemptIndex: 2, recentScenarioIds: ['W01', 'I05'] })
  assert.deepEqual(a.scenario_ids, b.scenario_ids)
  assert.deepEqual(a.composition, b.composition)
})

test('different seeds generally produce different valid sequences', () => {
  const seen = new Set()
  for (let i = 0; i < 40; i += 1) {
    seen.add(select({ seed: `vary-${i}` }).scenario_ids.join(','))
  }
  assert.ok(seen.size > 30, `expected varied output, got ${seen.size} distinct sequences from 40 seeds`)
})

test('database insertion order does not change the result', () => {
  const shuffled = seededRandom('shuffle-pool').shuffle(POOL)
  const reversed = [...POOL].reverse()
  const base = select({ seed: 'order-test', attemptIndex: 1 })
  const fromShuffled = selectAttemptScenarios({ pool: shuffled, seed: 'order-test', attemptIndex: 1 })
  const fromReversed = selectAttemptScenarios({ pool: reversed, seed: 'order-test', attemptIndex: 1 })
  assert.deepEqual(fromShuffled.scenario_ids, base.scenario_ids)
  assert.deepEqual(fromReversed.scenario_ids, base.scenario_ids)
})

test('the selection algorithm version is reported', () => {
  assert.equal(select().selection_algorithm_version, SELECTION_ALGORITHM_VERSION)
  assert.equal(SELECTION_ALGORITHM_VERSION, '1.0.0')
})

/* ------------------------------------------------------------------ *
 * 11-13  recent-20 exclusion and minimal relaxation
 * ------------------------------------------------------------------ */

test('the recent 20 are excluded when a solution exists without them', () => {
  const recent = POOL.slice(0, RECENT_EXCLUSION_WINDOW).map((s) => s.scenario_id)
  for (let i = 0; i < 60; i += 1) {
    const plan = select({ seed: `recent-${i}`, attemptIndex: i % 4, recentScenarioIds: recent })
    assert.equal(plan.recent_exclusion.relaxed, false, `seed recent-${i} relaxed unnecessarily`)
    assert.deepEqual(plan.relaxations, [])
    for (const id of plan.scenario_ids) {
      assert.ok(!recent.includes(id), `${id} is in the recent window but was selected`)
    }
  }
})

test('a realistic two-attempt history never needs relaxation', () => {
  const mal = POOL.filter((s) => s.disposition === 'malicious').slice(0, 16).map((s) => s.scenario_id)
  const leg = POOL.filter((s) => s.disposition === 'legitimate').slice(0, 4).map((s) => s.scenario_id)
  const recent = [...mal, ...leg]
  for (let i = 0; i < 40; i += 1) {
    const plan = select({ seed: `hist-${i}`, attemptIndex: i % 4, recentScenarioIds: recent })
    assert.equal(plan.recent_exclusion.relaxed, false)
    assert.deepEqual(validateSelection(plan.scenarios, {
      platformQuota: plan.platform_quota, recentIds: recent,
    }), [])
  }
})

test('relaxation re-admits the true minimum number of recent ids', () => {
  // All 20 legitimate scenarios are recent, so 2 must be re-admitted - and no more.
  const legitimate = POOL.filter((s) => s.disposition === 'legitimate').map((s) => s.scenario_id)
  const recent = legitimate.slice(0, RECENT_EXCLUSION_WINDOW)
  const plan = select({ seed: 'relax', attemptIndex: 0, recentScenarioIds: recent })

  assert.equal(plan.recent_exclusion.relaxed, true)
  assert.deepEqual(plan.relaxations, ['SELECTION_RECENT_EXCLUSION_RELAXED'])

  const allowed = plan.recent_exclusion.allowed_recent_ids
  assert.equal(allowed.length, 2, `expected the minimum of 2, got ${allowed.length}`)
  assert.equal(plan.recent_exclusion.excluded, recent.length - 2)

  // The minimum is chosen by which ids actually solve, not by a fixed prefix: the two
  // re-admitted legitimate scenarios must sit on different platforms.
  const readmitted = plan.scenarios.filter((s) => allowed.includes(s.scenario_id))
  assert.equal(new Set(readmitted.map((s) => s.platform)).size, 2)

  // Every other constraint still holds.
  assert.deepEqual(validateSelection(plan.scenarios, {
    platformQuota: plan.platform_quota, recentIds: recent, allowedRecentIds: allowed,
  }), [])
})

test('a prefix-based relaxation would have been larger than necessary', () => {
  // Regression guard for the bug this design avoids. The five oldest recent ids here are
  // all SMS legitimate scenarios, so re-admitting oldest-first would need six before two
  // different platforms became available. Minimising the COUNT finds two.
  const legitimate = POOL.filter((s) => s.disposition === 'legitimate').map((s) => s.scenario_id)
  const recent = legitimate.slice(0, RECENT_EXCLUSION_WINDOW)
  const oldestFive = [...recent].reverse().slice(0, 5)
  const platformsOfOldestFive = new Set(
    oldestFive.map((id) => POOL.find((s) => s.scenario_id === id).platform),
  )
  assert.equal(platformsOfOldestFive.size, 1, 'fixture assumption: the oldest five share a platform')
  assert.equal(select({ seed: 'relax', recentScenarioIds: recent })
    .recent_exclusion.allowed_recent_ids.length, 2)
})

test('relaxation is never larger than necessary', () => {
  const legitimate = POOL.filter((s) => s.disposition === 'legitimate').map((s) => s.scenario_id)
  for (let i = 0; i < 20; i += 1) {
    const plan = select({ seed: `min-relax-${i}`, attemptIndex: i % 4, recentScenarioIds: legitimate.slice(0, 20) })
    const allowed = plan.recent_exclusion.allowed_recent_ids.length
    // Only 20 legitimate exist; blocking 20 leaves 0, so exactly 2 must be re-admitted.
    assert.equal(allowed, 2, `seed min-relax-${i} re-admitted ${allowed}`)
  }
})

test('no constraint other than recent exclusion is ever relaxed', () => {
  const legitimate = POOL.filter((s) => s.disposition === 'legitimate').map((s) => s.scenario_id)
  const plan = select({ seed: 'hard-constraints', recentScenarioIds: legitimate.slice(0, 20) })
  const c = plan.composition
  assert.equal(c.disposition_counts.malicious, 8)
  assert.equal(c.disposition_counts.legitimate, 2)
  assert.deepEqual(c.difficulty_counts, DIFFICULTY_QUOTA)
  assert.ok(c.military_count >= 2 && c.military_count <= 4)
  assert.ok(c.canonical_trigger_count >= 5)
})

/* ------------------------------------------------------------------ *
 * 14  deterministic failure
 * ------------------------------------------------------------------ */

test('a pool smaller than ten is refused', () => {
  assert.equal(
    catchCode(() => selectAttemptScenarios({ pool: POOL.slice(0, 9), seed: 's' })),
    'SELECTION_POOL_INSUFFICIENT',
  )
})

test('an unsatisfiable pool fails deterministically rather than breaking a rule', () => {
  // No legitimate scenarios at all: 8+2 can never be met.
  const noLegit = POOL.filter((s) => s.disposition === 'malicious')
  assert.equal(
    catchCode(() => selectAttemptScenarios({ pool: noLegit, seed: 's' })),
    'SELECTION_CONSTRAINT_UNSATISFIABLE',
  )
})

test('a pool with no military scenarios fails rather than under-filling the quota', () => {
  const noMilitary = POOL.filter((s) => !s.military_flag)
  assert.equal(
    catchCode(() => selectAttemptScenarios({ pool: noMilitary, seed: 's' })),
    'SELECTION_CONSTRAINT_UNSATISFIABLE',
  )
})

test('legitimate scenarios confined to one platform fail the different-platform rule', () => {
  const oneLegitPlatform = POOL.filter((s) =>
    s.disposition === 'malicious' || s.platform === 'whatsapp')
  assert.equal(
    catchCode(() => selectAttemptScenarios({ pool: oneLegitPlatform, seed: 's' })),
    'SELECTION_CONSTRAINT_UNSATISFIABLE',
  )
})

test('a seed is required', () => {
  assert.equal(catchCode(() => selectAttemptScenarios({ pool: POOL })), 'SELECTION_INTERNAL_ERROR')
})

/* ------------------------------------------------------------------ *
 * adversarial pools
 * ------------------------------------------------------------------ */

test('a pool with scarce military scenarios still meets the minimum', () => {
  const military = POOL.filter((s) => s.military_flag).slice(0, 3).map((s) => s.scenario_id)
  const scarce = POOL.filter((s) => !s.military_flag || military.includes(s.scenario_id))
  const plan = selectAttemptScenarios({ pool: scarce, seed: 'scarce-mil', attemptIndex: 0 })
  assert.ok(plan.composition.military_count >= MILITARY_RANGE.min)
  assert.deepEqual(validateSelection(plan.scenarios, { platformQuota: plan.platform_quota }), [])
})

test('a family bottleneck cannot push a family above two', () => {
  // Collapse every malicious scenario into three families.
  const squeezed = POOL.map((s) => (s.disposition === 'malicious'
    ? { ...s, canonical_family: `fam_${s.scenario_id.charCodeAt(1) % 3}` }
    : s))
  const code = catchCode(() => selectAttemptScenarios({ pool: squeezed, seed: 'fam' }))
  // Three families cannot supply eight malicious under a max of two, so this must fail
  // rather than quietly exceeding the limit.
  assert.equal(code, 'SELECTION_CONSTRAINT_UNSATISFIABLE')
})

test('a pool with thin trigger diversity still reaches five distinct triggers', () => {
  const thin = POOL.map((s) => ({
    ...s,
    canonical_triggers: s.canonical_triggers.slice(0, 1),
  }))
  const plan = selectAttemptScenarios({ pool: thin, seed: 'thin-trig', attemptIndex: 1 })
  assert.ok(plan.composition.canonical_trigger_count >= MIN_DISTINCT_TRIGGERS)
})

test('a single-trigger pool fails the diversity minimum rather than shipping it', () => {
  const monotone = POOL.map((s) => ({ ...s, canonical_triggers: ['authority'] }))
  assert.equal(
    catchCode(() => selectAttemptScenarios({ pool: monotone, seed: 'mono' })),
    'SELECTION_CONSTRAINT_UNSATISFIABLE',
  )
})

test('recent-20 colliding with the military pool still satisfies the minimum', () => {
  const recent = POOL.filter((s) => s.military_flag).slice(0, 20).map((s) => s.scenario_id)
  const plan = select({ seed: 'mil-collide', attemptIndex: 2, recentScenarioIds: recent })
  assert.ok(plan.composition.military_count >= MILITARY_RANGE.min)
  assert.deepEqual(validateSelection(plan.scenarios, {
    platformQuota: plan.platform_quota,
    recentIds: recent,
    allowedRecentIds: plan.recent_exclusion.allowed_recent_ids,
  }), [])
})

/* ------------------------------------------------------------------ *
 * the validator is genuinely independent
 * ------------------------------------------------------------------ */

test('the validator rejects a hand-built invalid selection', () => {
  const plan = select({ seed: 'validator' })
  const tampered = [...plan.scenarios]

  // Swap a malicious scenario in for a legitimate one.
  const spare = POOL.find((s) => s.disposition === 'malicious'
    && !plan.scenario_ids.includes(s.scenario_id))
  const legitIndex = tampered.findIndex((s) => s.disposition === 'legitimate')
  tampered[legitIndex] = spare
  const errors = validateSelection(tampered, { platformQuota: plan.platform_quota })
  assert.ok(errors.length > 0, 'the validator must not accept a 9/1 disposition split')
  assert.ok(errors.join(' ').includes('legitimate'))
})

test('the validator catches duplicates, family overuse and recent violations', () => {
  const one = POOL.find((s) => s.scenario_id === 'W01')
  assert.ok(validateSelection(Array(10).fill(one)).some((e) => e.includes('duplicate')))
  assert.ok(validateSelection([]).some((e) => e.includes('expected 10')))

  const plan = select({ seed: 'recent-violation' })
  const errors = validateSelection(plan.scenarios, {
    platformQuota: plan.platform_quota,
    recentIds: [plan.scenario_ids[0]],
    allowedRecentIds: [],
  })
  assert.ok(errors.some((e) => e.includes('recent scenarios used')))
})

/* ------------------------------------------------------------------ *
 * hidden metadata and presentation order
 * ------------------------------------------------------------------ */

test('the selection result carries no evaluation data', () => {
  const plan = select({ seed: 'no-eval' })
  const text = JSON.stringify(plan)
  for (const leaked of ['evaluation', 'expected_safe_behavior', 'learner_flow',
    'end_state', 'scoring_text', 'RESOLVE_CORRECT']) {
    assert.ok(!text.includes(leaked), `selection result leaked "${leaked}"`)
  }
})

test('no more than two consecutive scenarios come from one platform', () => {
  for (let i = 0; i < 100; i += 1) {
    const plan = select({ seed: `order-${i}`, attemptIndex: i % 4 })
    const platforms = plan.scenarios.map((s) => s.platform)
    for (let j = 2; j < platforms.length; j += 1) {
      assert.ok(
        !(platforms[j] === platforms[j - 1] && platforms[j] === platforms[j - 2]),
        `seed order-${i}: three consecutive ${platforms[j]} at position ${j}`,
      )
    }
  }
})

test('presentation order is deterministic for a seed but varies between seeds', () => {
  assert.deepEqual(select({ seed: 'ord' }).scenario_ids, select({ seed: 'ord' }).scenario_ids)
  assert.notDeepEqual(select({ seed: 'ord' }).scenario_ids, select({ seed: 'ord2' }).scenario_ids)
})

/* ------------------------------------------------------------------ *
 * seeded PRNG
 * ------------------------------------------------------------------ */

test('the seeded PRNG is reproducible and free of shared state', () => {
  const a = seededRandom('abc')
  const b = seededRandom('abc')
  assert.deepEqual([a.int(100), a.int(100), a.int(100)], [b.int(100), b.int(100), b.int(100)])
  assert.notDeepEqual(seededRandom('abc').shuffle([1, 2, 3, 4, 5, 6, 7, 8]),
    seededRandom('xyz').shuffle([1, 2, 3, 4, 5, 6, 7, 8]))
})

test('rankBy orders by value, not by input position', () => {
  const rng = seededRandom('rank')
  const items = ['a', 'b', 'c', 'd', 'e']
  assert.deepEqual(rng.rankBy(items, (x) => x), rng.rankBy([...items].reverse(), (x) => x))
})
