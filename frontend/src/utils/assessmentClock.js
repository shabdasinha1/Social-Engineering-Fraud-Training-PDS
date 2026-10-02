/**
 * Countdown arithmetic for the 90-minute assessment limit (IMMERSIVE-001).
 *
 * Pure: no React, no timers, no clock reading of its own - `now` is always passed in. That
 * is what lets the whole of the countdown's behaviour be asserted without a DOM, and it is
 * also the honest shape for this code, because none of it is authoritative. The deadline
 * belongs to the server; these functions only decide how it is displayed.
 */

/** `mm:ss`, or `h:mm:ss` once there is an hour to show. Never negative. */
export function formatRemaining(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const pad = (n) => String(n).padStart(2, '0')
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
}

/**
 * Milliseconds left against a clock corrected by `offsetMs`, or null when there is no
 * deadline. Clamped at zero: an overdue attempt has no time left, never negative time.
 */
export function remainingFrom(expiresAt, { offsetMs = 0, now = Date.now() } = {}) {
  if (!expiresAt) return null
  const deadline = new Date(expiresAt).getTime()
  if (Number.isNaN(deadline)) return null
  return Math.max(0, deadline - (now + offsetMs))
}

/**
 * Remaining-time thresholds at which the learner is warned, longest first.
 *
 * Presentation only. Nothing happens at these points except a sentence appearing.
 */
export const WARN_AT_MS = [10 * 60 * 1000, 2 * 60 * 1000]
