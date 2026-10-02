import { createHash, randomBytes } from 'node:crypto'

/**
 * Deterministic seeded PRNG for attempt selection (SELECT-002).
 *
 * The client requires a stored selection seed so an attempt can be reproduced and
 * audited. That rules out `Math.random()`, `crypto.randomInt` and anything reading the
 * clock: given the same seed, pool and history, selection must return the same sequence
 * on any machine, in any process, forever.
 *
 * Each generator owns its state. There is no module-level mutable state, so two
 * generators created from the same seed run identically and cannot interfere.
 */

/** xoshiro128** - small, fast, good distribution, trivially reproducible. */
function xoshiro128ss(a, b, c, d) {
  let s0 = a >>> 0
  let s1 = b >>> 0
  let s2 = c >>> 0
  let s3 = d >>> 0
  return function next() {
    const rotl = (x, k) => ((x << k) | (x >>> (32 - k))) >>> 0
    const result = (Math.imul(rotl(Math.imul(s1, 5) >>> 0, 7) >>> 0, 9) >>> 0)
    const t = (s1 << 9) >>> 0
    s2 = (s2 ^ s0) >>> 0
    s3 = (s3 ^ s1) >>> 0
    s1 = (s1 ^ s2) >>> 0
    s0 = (s0 ^ s3) >>> 0
    s2 = (s2 ^ t) >>> 0
    s3 = rotl(s3, 11)
    return result >>> 0
  }
}

/** Generates a fresh seed for a NEW attempt. The only place randomness enters. */
export function createSeed() {
  return randomBytes(16).toString('hex')
}

/**
 * Builds a generator from a seed string.
 *
 * The seed is hashed first, so any string works and closely-related seeds
 * ("attempt-1", "attempt-2") still produce unrelated streams.
 */
export function seededRandom(seed) {
  const digest = createHash('sha256').update(String(seed)).digest()
  const next = xoshiro128ss(
    digest.readUInt32LE(0), digest.readUInt32LE(4),
    digest.readUInt32LE(8), digest.readUInt32LE(12),
  )

  /** Float in [0, 1). */
  const float = () => next() / 0x1_0000_0000

  /** Integer in [0, max). */
  const int = (max) => {
    if (max <= 0) throw new RangeError('max must be positive')
    return Math.floor(float() * max)
  }

  /** Fisher-Yates. Returns a new array; never mutates the input. */
  const shuffle = (items) => {
    const copy = [...items]
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = int(i + 1)
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }

  /**
   * Stable seeded ordering keyed by a value, not by array position.
   *
   * This is what makes selection independent of database insertion order: two pools
   * holding the same scenarios in different orders rank identically.
   */
  const rankBy = (items, keyOf) =>
    [...items]
      .map((item) => ({
        item,
        rank: createHash('sha256').update(`${seed}:${keyOf(item)}`).digest('hex'),
      }))
      .sort((a, b) => (a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : 0))
      .map((entry) => entry.item)

  return { float, int, shuffle, rankBy, seed: String(seed) }
}
