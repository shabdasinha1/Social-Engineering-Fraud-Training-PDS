import { randomInt } from 'node:crypto'
import {
  ASSESSMENT_COMPOSITIONS,
  ASSESSMENT_SCENARIO_COUNT,
  CHANNELS,
} from '../constants/assessment.js'

/**
 * Builds one candidate's 10-scenario sequence.
 *
 * Pure: it takes the pool and the candidate's history and returns a plan. No
 * database, no dates, no global state - so it is directly testable, including
 * the exhaustion cases.
 *
 * See docs/QUESTION_ENGINE_DESIGN.md sections 6 and 7.
 */

const CHANNEL_FLOOR = 2

/**
 * The channel floor is the only constraint that may be dropped. The
 * malicious / legitimate composition is never relaxed - if the chosen split
 * cannot be built, another ALLOWED split is tried instead. A sequence outside
 * 6+4 / 7+3 / 8+2 must never exist.
 */
const FLOOR_PLANS = [
  { channelFloor: CHANNEL_FLOOR, relaxation: null },
  { channelFloor: 1, relaxation: 'channel-floor-reduced-to-1' },
  { channelFloor: 0, relaxation: 'channel-floor-dropped' },
]

const MAX_ATTEMPTS_PER_PLAN = 40
const MAX_SHUFFLE_ATTEMPTS = 50

function shuffle(items, random) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = random(i + 1)
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Unseen first (in random order), then seen, least recently seen first. This is
 * what makes unseen scenarios preferred without making them a hard constraint.
 */
function buildBuckets(scenarios, seen, random) {
  const buckets = new Map()

  for (const scenario of scenarios) {
    const key = `${scenario.channel}:${scenario.type}`
    if (!buckets.has(key)) buckets.set(key, { unseen: [], seen: [] })
    const bucket = buckets.get(key)
    if (seen.has(String(scenario.id))) bucket.seen.push(scenario)
    else bucket.unseen.push(scenario)
  }

  for (const bucket of buckets.values()) {
    bucket.unseen = shuffle(bucket.unseen, random)
    bucket.seen.sort((a, b) => {
      const diff = seen.get(String(a.id)) - seen.get(String(b.id))
      return diff !== 0 ? diff : random(2) - 0.5
    })
    bucket.ordered = [...bucket.unseen, ...bucket.seen]
  }

  return buckets
}

function attempt({ scenarios, seen, composition, channelFloor, random }) {
  const buckets = buildBuckets(scenarios, seen, random)
  const used = new Set()
  const chosen = []

  const need = { malicious: composition.malicious, legitimate: composition.legitimate }

  const nextIn = (channel, type) => {
    const bucket = buckets.get(`${channel}:${type}`)
    if (!bucket) return null
    return bucket.ordered.find((scenario) => !used.has(String(scenario.id))) ?? null
  }

  /** True when this bucket can still supply a scenario the candidate has not seen. */
  const hasUnseen = (channel, type) => {
    const next = nextIn(channel, type)
    return Boolean(next) && !seen.has(String(next.id))
  }

  const take = (channel, type) => {
    const next = nextIn(channel, type)
    if (!next) return null
    used.add(String(next.id))
    chosen.push(next)
    need[type] -= 1
    return next
  }

  const typesStillNeeded = () =>
    ['malicious', 'legitimate'].filter((type) => need[type] > 0)

  const weightedPick = (options) => {
    const total = options.reduce((sum, option) => sum + Math.max(1, need[option.type]), 0)
    let ticket = random(total)
    for (const option of options) {
      ticket -= Math.max(1, need[option.type])
      if (ticket < 0) return option
    }
    return options[options.length - 1]
  }

  /**
   * Prefer a (channel, type) pair that can still supply an UNSEEN scenario.
   * Choosing the type blind to what is unseen would pull an already-seen
   * scenario out of one bucket while unseen ones sat in the other.
   */
  const choosePair = (channels) => {
    const wanted = typesStillNeeded()
    const pairs = []

    for (const channel of channels) {
      for (const type of wanted) {
        if (nextIn(channel, type)) pairs.push({ channel, type, unseen: hasUnseen(channel, type) })
      }
    }
    if (pairs.length === 0) return null

    const fresh = pairs.filter((pair) => pair.unseen)
    return weightedPick(fresh.length > 0 ? fresh : pairs)
  }

  // Phase 1 - guarantee every channel appears
  for (const channel of shuffle(CHANNELS, random)) {
    for (let i = 0; i < channelFloor; i += 1) {
      if (typesStillNeeded().length === 0) break

      const pair = choosePair([channel])
      if (!pair) return null
      take(pair.channel, pair.type)
    }
  }

  // Phase 2 - fill to 10, honouring whatever composition is still outstanding
  while (chosen.length < ASSESSMENT_SCENARIO_COUNT) {
    const pair = choosePair(shuffle(CHANNELS, random))
    if (!pair) return null
    take(pair.channel, pair.type)
  }

  return chosen
}

/** Keeps the mix feeling mixed: no three questions in a row from one channel. */
function orderSequence(chosen, random) {
  let ordered = shuffle(chosen, random)

  for (let i = 0; i < MAX_SHUFFLE_ATTEMPTS; i += 1) {
    const hasRun = ordered.some(
      (item, index) =>
        index >= 2 &&
        item.channel === ordered[index - 1].channel &&
        item.channel === ordered[index - 2].channel,
    )
    if (!hasRun) return ordered
    ordered = shuffle(chosen, random)
  }

  return ordered
}

/**
 * @param {object[]} scenarios  active pool as { id, channel, type, version }
 * @param {Map<string, number>} seen  scenarioId -> lastSeenAt (ms)
 * @param {(max:number)=>number} random  injectable for deterministic tests
 */
export function generateSequence({ scenarios, seen = new Map(), random = randomInt } = {}) {
  const pool = scenarios ?? []

  if (pool.length < ASSESSMENT_SCENARIO_COUNT) {
    const error = new Error(
      `The scenario pool has ${pool.length} active scenarios; ${ASSESSMENT_SCENARIO_COUNT} are needed.`,
    )
    error.code = 'POOL_TOO_SMALL'
    throw error
  }

  // The randomly chosen split is tried first; the other allowed splits are
  // fallbacks, so the composition rule is never broken.
  const first = ASSESSMENT_COMPOSITIONS[random(ASSESSMENT_COMPOSITIONS.length)]
  const compositions = [first, ...shuffle(ASSESSMENT_COMPOSITIONS.filter((c) => c !== first), random)]

  for (const composition of compositions) {
    for (const plan of FLOOR_PLANS) {
      for (let i = 0; i < MAX_ATTEMPTS_PER_PLAN; i += 1) {
        const chosen = attempt({
          scenarios: pool,
          seen,
          composition,
          channelFloor: plan.channelFloor,
          random,
        })
        if (!chosen) continue

        const ordered = orderSequence(chosen, random)

        const relaxations = plan.relaxation ? [plan.relaxation] : []
        if (composition !== first) relaxations.push('composition-changed-to-an-available-split')
        if (ordered.some((scenario) => seen.has(String(scenario.id)))) {
          relaxations.push('reused-seen-scenarios')
        }

        const maliciousCount = ordered.filter((s) => s.type === 'malicious').length

        return {
          sequence: ordered.map((scenario, index) => ({
            position: index + 1,
            scenario: scenario.id,
            scenarioVersion: scenario.version ?? 1,
          })),
          composition: {
            maliciousCount,
            legitimateCount: ordered.length - maliciousCount,
          },
          relaxations,
        }
      }
    }
  }

  const error = new Error('Could not build an assessment from the current scenario pool.')
  error.code = 'SEQUENCE_GENERATION_FAILED'
  throw error
}
