/**
 * How a thread groups itself (IMMERSIVE-003A-R2).
 *
 * Pure, and outside the component that draws bubbles, so the rule can be stated once and
 * asserted directly: consecutive messages from the same speaker are one run, the author
 * strip appears at the top of a run, and only the last bubble in a run gets a tail. That
 * is the cheapest single change that stops a generated-looking transcript reading as one.
 */

const GROUPABLE = new Set(['message', 'link', 'document', 'media', 'voice'])

const sameSpeaker = (a, b) => (
  Boolean(a) && Boolean(b)
  && GROUPABLE.has(a.kind) && GROUPABLE.has(b.kind)
  && a.from === b.from
  && (a.author ?? null) === (b.author ?? null)
)

/** Each beat, with whether it continues the previous one and whether it ends its run. */
export function groupBeats(beats) {
  return beats.map((beat, index) => ({
    beat,
    grouped: sameSpeaker(beats[index - 1], beat),
    tail: !sameSpeaker(beat, beats[index + 1]),
  }))
}
