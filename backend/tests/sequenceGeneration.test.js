import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ASSESSMENT_COMPOSITIONS,
  ASSESSMENT_SCENARIO_COUNT,
  CHANNELS,
} from '../src/constants/assessment.js'
import { generateSequence } from '../src/services/sequenceGenerationService.js'

/** A pool shaped like the real one: 10 per channel, 7 malicious + 3 legitimate. */
function buildPool({ perChannel = 10, maliciousPerChannel = 7 } = {}) {
  const pool = []
  for (const channel of CHANNELS) {
    for (let i = 0; i < perChannel; i += 1) {
      pool.push({
        id: `${channel}-${i}`,
        channel,
        type: i < maliciousPerChannel ? 'malicious' : 'legitimate',
        version: 1,
      })
    }
  }
  return pool
}

const isAllowedComposition = ({ maliciousCount, legitimateCount }) =>
  ASSESSMENT_COMPOSITIONS.some(
    (c) => c.malicious === maliciousCount && c.legitimate === legitimateCount,
  )

test('every generated assessment has exactly 10 questions with no duplicates', () => {
  const pool = buildPool()
  for (let run = 0; run < 200; run += 1) {
    const { sequence } = generateSequence({ scenarios: pool })
    assert.equal(sequence.length, ASSESSMENT_SCENARIO_COUNT)
    assert.equal(new Set(sequence.map((s) => s.scenario)).size, ASSESSMENT_SCENARIO_COUNT)
    assert.deepEqual(
      sequence.map((s) => s.position),
      Array.from({ length: 10 }, (_, i) => i + 1),
    )
  }
})

test('composition is always 6+4, 7+3 or 8+2 - never 10+0, 0+10 or 5+5', () => {
  const pool = buildPool()
  const seen = new Set()

  for (let run = 0; run < 500; run += 1) {
    const { composition } = generateSequence({ scenarios: pool })
    assert.ok(
      isAllowedComposition(composition),
      `got ${composition.maliciousCount}+${composition.legitimateCount}`,
    )
    seen.add(`${composition.maliciousCount}+${composition.legitimateCount}`)
  }

  assert.ok(!seen.has('10+0'))
  assert.ok(!seen.has('0+10'))
  assert.ok(!seen.has('5+5'))
  assert.equal(seen.size, 3, `all three splits should occur, saw ${[...seen].join(', ')}`)
})

test('the stated composition matches the scenarios actually chosen', () => {
  const pool = buildPool()
  const byId = new Map(pool.map((s) => [s.id, s]))

  for (let run = 0; run < 200; run += 1) {
    const { sequence, composition } = generateSequence({ scenarios: pool })
    const actual = sequence.filter((s) => byId.get(s.scenario).type === 'malicious').length
    assert.equal(actual, composition.maliciousCount)
  }
})

test('all four channels are represented, at least twice each', () => {
  const pool = buildPool()
  const byId = new Map(pool.map((s) => [s.id, s]))

  for (let run = 0; run < 200; run += 1) {
    const { sequence, relaxations } = generateSequence({ scenarios: pool })
    const counts = {}
    for (const item of sequence) {
      const { channel } = byId.get(item.scenario)
      counts[channel] = (counts[channel] ?? 0) + 1
    }
    assert.equal(Object.keys(counts).length, CHANNELS.length, JSON.stringify(counts))
    for (const channel of CHANNELS) assert.ok(counts[channel] >= 2, JSON.stringify(counts))
    assert.ok(!relaxations.includes('channel-floor-reduced-to-1'))
  }
})

test('order is mixed - never three consecutive questions from one channel', () => {
  const pool = buildPool()
  const byId = new Map(pool.map((s) => [s.id, s]))

  for (let run = 0; run < 200; run += 1) {
    const { sequence } = generateSequence({ scenarios: pool })
    const channels = sequence.map((s) => byId.get(s.scenario).channel)
    for (let i = 2; i < channels.length; i += 1) {
      assert.ok(
        !(channels[i] === channels[i - 1] && channels[i] === channels[i - 2]),
        channels.join(','),
      )
    }
  }
})

test('two candidates with no history get different sequences', () => {
  const pool = buildPool()
  const a = generateSequence({ scenarios: pool }).sequence.map((s) => s.scenario).join()
  const b = generateSequence({ scenarios: pool }).sequence.map((s) => s.scenario).join()
  assert.notEqual(a, b)
})

test('unseen scenarios are preferred - a fresh candidate reuses nothing', () => {
  const pool = buildPool()
  for (let run = 0; run < 100; run += 1) {
    const { relaxations } = generateSequence({ scenarios: pool })
    assert.ok(!relaxations.includes('reused-seen-scenarios'))
  }
})

/** A realistic history: assessments always take >= 2 per channel, so a
 *  candidate's seen set stays spread across channels rather than clustered. */
function spreadHistory(pool, { maliciousPerChannel, legitimatePerChannel }) {
  const seen = new Map()
  for (const channel of CHANNELS) {
    const inChannel = pool.filter((s) => s.channel === channel)
    const malicious = inChannel.filter((s) => s.type === 'malicious')
    const legitimate = inChannel.filter((s) => s.type === 'legitimate')
    let clock = 1000
    for (const scenario of malicious.slice(0, maliciousPerChannel)) {
      seen.set(scenario.id, (clock += 1))
    }
    for (const scenario of legitimate.slice(0, legitimatePerChannel)) {
      seen.set(scenario.id, (clock += 1))
    }
  }
  return seen
}

test('one candidate history does not affect another candidate', () => {
  const pool = buildPool()
  // A has seen 24 of 40, leaving 2 malicious + 2 legitimate unseen per channel.
  const historyA = spreadHistory(pool, { maliciousPerChannel: 5, legitimatePerChannel: 1 })

  for (let run = 0; run < 100; run += 1) {
    const forA = generateSequence({ scenarios: pool, seen: historyA })
    assert.equal(
      forA.sequence.filter((s) => historyA.has(s.scenario)).length,
      0,
      'A should still be served only unseen scenarios',
    )

    const forB = generateSequence({ scenarios: pool, seen: new Map() })
    assert.equal(forB.sequence.length, 10)
    assert.ok(
      !forB.relaxations.includes('reused-seen-scenarios'),
      'B has no history and must not be affected by A',
    )
  }
})

test('with plenty of unseen left, nothing is ever reused', () => {
  const pool = buildPool()
  const seen = spreadHistory(pool, { maliciousPerChannel: 5, legitimatePerChannel: 1 })

  for (let run = 0; run < 200; run += 1) {
    const { sequence, relaxations } = generateSequence({ scenarios: pool, seen })
    assert.equal(sequence.filter((s) => seen.has(s.scenario)).length, 0)
    assert.ok(!relaxations.includes('reused-seen-scenarios'))
  }
})

/** Marks everything as seen EXCEPT the counts named per channel. */
function historyLeavingUnseen(pool, unseenSpec) {
  const keepUnseen = new Set()
  for (const [channel, counts] of Object.entries(unseenSpec)) {
    const inChannel = pool.filter((s) => s.channel === channel)
    for (const type of ['malicious', 'legitimate']) {
      inChannel
        .filter((s) => s.type === type)
        .slice(0, counts[type] ?? 0)
        .forEach((s) => keepUnseen.add(s.id))
    }
  }
  const seen = new Map()
  let clock = 1000
  for (const scenario of pool) {
    if (!keepUnseen.has(scenario.id)) seen.set(scenario.id, (clock += 1))
  }
  return { seen, unseenIds: keepUnseen }
}

test('with exactly 10 unseen left, at least 9 are used and nothing repeats', () => {
  const pool = buildPool()
  // 7 malicious + 3 legitimate unseen, spread over all four channels.
  const { seen, unseenIds } = historyLeavingUnseen(pool, {
    whatsapp: { malicious: 2, legitimate: 1 },
    instagram: { malicious: 2, legitimate: 1 },
    sms: { malicious: 2, legitimate: 0 },
    email: { malicious: 1, legitimate: 1 },
  })
  assert.equal(unseenIds.size, 10)

  for (let run = 0; run < 200; run += 1) {
    const { sequence } = generateSequence({ scenarios: pool, seen })
    assert.equal(new Set(sequence.map((s) => s.scenario)).size, 10, 'no duplicates inside')

    const usedUnseen = sequence.filter((s) => unseenIds.has(s.scenario)).length
    // All 10 only when the randomly chosen split happens to match the type mix
    // of what is left (here 7+3). The composition rule is absolute and is never
    // bent to consume the remainder, so 9 is the guaranteed floor.
    assert.ok(usedUnseen >= 9, `expected >= 9 unseen, got ${usedUnseen}`)
  }
})

test('with only 7 unseen left, they are used first and seen scenarios fill the gap', () => {
  const pool = buildPool()
  const { seen, unseenIds } = historyLeavingUnseen(pool, {
    whatsapp: { malicious: 2, legitimate: 0 },
    instagram: { malicious: 2, legitimate: 0 },
    sms: { malicious: 1, legitimate: 1 },
    email: { malicious: 0, legitimate: 1 },
  })
  assert.equal(unseenIds.size, 7)

  for (let run = 0; run < 200; run += 1) {
    const { sequence, relaxations } = generateSequence({ scenarios: pool, seen })
    assert.equal(sequence.length, 10)
    assert.equal(new Set(sequence.map((s) => s.scenario)).size, 10, 'no duplicates inside')

    const usedUnseen = sequence.filter((s) => unseenIds.has(s.scenario)).length
    assert.ok(usedUnseen >= 6, `expected almost all 7 unseen to be used, got ${usedUnseen}`)
    assert.ok(relaxations.includes('reused-seen-scenarios'))
  }
})

test('channel coverage outranks novelty when the unseen remainder sits in one channel', () => {
  // Documents the relaxation order in QUESTION_ENGINE_DESIGN.md 6.4: novelty is
  // given up before the channel floor. This history cannot arise from real
  // assessments (every assessment takes >= 2 from every channel) but the
  // behaviour should be deliberate rather than accidental.
  const pool = buildPool()
  const seen = new Map(
    pool.filter((s) => s.channel !== 'email').map((s, i) => [s.id, 1000 + i]),
  )

  const { sequence, relaxations } = generateSequence({ scenarios: pool, seen })
  const channels = new Set(sequence.map((s) => s.scenario.split('-')[0]))

  assert.equal(channels.size, 4, 'all four channels still appear')
  assert.ok(relaxations.includes('reused-seen-scenarios'))
  assert.ok(!relaxations.includes('channel-floor-reduced-to-1'))
})

test('a fully exhausted pool still produces a valid assessment with no internal duplicates', () => {
  const pool = buildPool()
  const seen = new Map(pool.map((s, i) => [s.id, 1000 + i]))

  for (let run = 0; run < 100; run += 1) {
    const { sequence, composition, relaxations } = generateSequence({ scenarios: pool, seen })
    assert.equal(sequence.length, 10)
    assert.equal(new Set(sequence.map((s) => s.scenario)).size, 10)
    assert.ok(isAllowedComposition(composition))
    assert.ok(relaxations.includes('reused-seen-scenarios'))
  }
})

test('an exhausted pool prefers the least recently seen scenarios', () => {
  const pool = buildPool()
  // Give one scenario per channel a much older lastSeenAt.
  const seen = new Map(pool.map((s) => [s.id, 100000]))
  const oldest = CHANNELS.map((channel) => pool.find((s) => s.channel === channel).id)
  for (const id of oldest) seen.set(id, 1)

  let hits = 0
  for (let run = 0; run < 40; run += 1) {
    const { sequence } = generateSequence({ scenarios: pool, seen })
    hits += sequence.filter((s) => oldest.includes(s.scenario)).length
  }
  assert.ok(hits > 40 * 2, `least-recently-seen should dominate, got ${hits}`)
})

test('a pool smaller than 10 is refused rather than served short', () => {
  assert.throws(
    () => generateSequence({ scenarios: buildPool({ perChannel: 2, maliciousPerChannel: 1 }) }),
    (error) => error.code === 'POOL_TOO_SMALL',
  )
})

test('an unbalanced pool falls back to an allowed split rather than breaking the rule', () => {
  // Only 2 legitimate scenarios exist, so 6+4 and 7+3 are impossible.
  const pool = []
  for (const channel of CHANNELS) {
    for (let i = 0; i < 5; i += 1) {
      pool.push({ id: `${channel}-m${i}`, channel, type: 'malicious', version: 1 })
    }
  }
  pool.push({ id: 'x-l1', channel: 'sms', type: 'legitimate', version: 1 })
  pool.push({ id: 'x-l2', channel: 'email', type: 'legitimate', version: 1 })

  for (let run = 0; run < 50; run += 1) {
    const { composition } = generateSequence({ scenarios: pool })
    assert.deepEqual(composition, { maliciousCount: 8, legitimateCount: 2 })
  }
})
