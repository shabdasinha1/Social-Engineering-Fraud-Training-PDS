import { CHANNELS } from '@/constants/channels'
import { ASSET_KIND, MAX_TOASTS, assetsOfKind } from '@/constants/simulation'

/**
 * Dashboard activity orchestration (UI-004, client specification section 3).
 *
 * Pure: no React, no timers, no fetch. Every function here is a projection of state the
 * server already committed - the run, its stage and its sequence - into what the hub
 * should look like. That is what makes the badge, the tray and the app list agree:
 * section 3 requires that "badge count, toast preview and app list must all reflect the
 * same scenario state", and here they are literally computed from one input.
 *
 * Three things this file deliberately does NOT do:
 *
 *   - it never decides which scenario is next (the engine issues runs by ordinal);
 *   - it never reads or infers disposition, difficulty or attack family;
 *   - it never uses Math.random - the delivery delay is a hash of the run id, so the
 *     same run always waits the same time and a test can assert the number.
 */

/* ------------------------------------------------------------------ *
 * Post-idle delivery window
 * ------------------------------------------------------------------ */

/**
 * Section 3: "Deliver the next event 1-4 seconds after the dashboard becomes idle."
 * Taken literally as a closed millisecond range rather than reinterpreted.
 */
export const DELIVERY_MIN_MS = 1000
export const DELIVERY_MAX_MS = 4000

/**
 * How long this run's notification waits before it is delivered.
 *
 * FNV-1a over the run id. The specification asks for a range, not a constant, so the
 * pause varies between scenarios and does not read as a fixed machine beat - but it is a
 * pure function of an id the server minted, so it is reproducible, assertable, and
 * carries no information about the scenario: the id is a Mongo ObjectId, allocated at
 * attempt creation, and knows nothing about content.
 *
 * `Math.random` is not used anywhere in this path (UI-004 implementation rule D).
 */
export function deliveryDelayMs(runId) {
  if (!runId) return DELIVERY_MIN_MS

  let hash = 2166136261
  for (let index = 0; index < runId.length; index += 1) {
    hash ^= runId.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  const span = DELIVERY_MAX_MS - DELIVERY_MIN_MS + 1
  return DELIVERY_MIN_MS + ((hash >>> 0) % span)
}

/**
 * True when this run's activity has not been presented yet, so the delivery window
 * applies.
 *
 * A run that is still at `notify` with nothing in its ledger has never been shown to
 * anybody. Once any event exists - including `notification_dismissed`, which leaves the
 * run at `notify` - the learner has already seen the item arrive, and re-queueing it
 * after a reload would be a second arrival for one scenario.
 */
export function awaitingDelivery(run) {
  if (!run || run.status === 'resolved') return false
  return run.current_stage === 'notify' && (run.last_sequence ?? 0) === 0
}

/**
 * True when the learner has already dismissed this run's alert.
 *
 * Read from the ledger, not from a local flag: `dismiss` is the only intent that leaves a
 * run at `notify` while writing an event, so a run sitting at `notify` with a sequence
 * behind it has been dismissed. Deriving it server-side is what stops a reload from
 * re-delivering an alert the learner has already waved away.
 */
export function alertDismissed(run) {
  if (!run || run.status === 'resolved') return false
  return run.current_stage === 'notify' && (run.last_sequence ?? 0) > 0
}

/**
 * True when the run we have just loaded was already under way.
 *
 * This is the "after interruption" test from section 3's scenario-queue row: the only way
 * to arrive at a run that is past `notify`, or that already has ledger entries, is to
 * come back to it - a reload, a return to the tab, or a resumed session.
 */
export function wasInterrupted(run) {
  if (!run || run.status === 'resolved') return false
  return run.current_stage !== 'notify' || (run.last_sequence ?? 0) > 0
}

/* ------------------------------------------------------------------ *
 * Hub state
 * ------------------------------------------------------------------ */

export const ACTIVITY = {
  /** The window is still running: nothing is badged and the tray is empty. */
  QUEUED: 'queued',
  /** The notification is on the home screen, with its badge and its tray entry. */
  DELIVERED: 'delivered',
  /** The learner is inside the app; the hub is behind the open scenario. */
  ENGAGED: 'engaged',
  /** This scenario is finished and the next one has not been issued. */
  RESOLVED: 'resolved',
  /** Ten resolved: the app-grid call to action becomes View results. */
  COMPLETE: 'complete',
}

export function activityStateFor({ run, delivered }) {
  if (!run) return ACTIVITY.COMPLETE
  if (run.status === 'resolved') return ACTIVITY.RESOLVED
  if (run.current_stage !== 'notify') return ACTIVITY.ENGAGED
  return delivered ? ACTIVITY.DELIVERED : ACTIVITY.QUEUED
}

/* ------------------------------------------------------------------ *
 * Toast tray
 * ------------------------------------------------------------------ */

/**
 * The stacked toast tray, capped at three (section 3: "Queue at most three").
 *
 * The cap is applied to whatever the scenario supplies rather than to a hard-coded
 * single item, so it is a real limit and not a comment: a scenario carrying more
 * notification assets than the tray can hold is truncated to the newest three. Every
 * entry names its own app, which is what makes a click a deep link rather than a guess.
 *
 * An empty tray is the correct answer while the delivery window is still running and
 * after the alert has been dismissed - in both cases nothing is on the home screen, and
 * the badge computed below agrees.
 */
export function trayFor({ scenario, state, dismissed }) {
  if (state !== ACTIVITY.DELIVERED || dismissed) return []

  const appKey = scenario?.platform ?? null
  const appLabel = channelLabel(appKey)

  return assetsOfKind(scenario, ASSET_KIND.NOTIFICATION)
    .slice(0, MAX_TOASTS)
    .map((asset) => ({
      id: asset.asset_id,
      appKey,
      appLabel,
      sender: asset.content?.sender ?? scenario?.synthetic?.sender?.display_name ?? 'New message',
      body: asset.content?.body ?? '',
      receivedAt: asset.content?.received_at ?? null,
    }))
}

/* ------------------------------------------------------------------ *
 * App grid
 * ------------------------------------------------------------------ */

/**
 * Tile state. Two values only, and neither of them says anything about the item.
 *
 * `ACTIVITY` means "something is waiting in this app" and `QUIET` means "nothing new".
 * There is deliberately no third state for "this is the one that matters": section 3
 * requires that the hub "never expose which tile is 'correct'", and the only tile that
 * can carry activity is the one the scenario actually arrived in, which the learner is
 * being told outright by the toast anyway.
 */
export const TILE_STATUS = {
  ACTIVITY: 'activity',
  QUIET: 'quiet',
}

const TILE_QUIET_PREVIEW = 'No new items'

/**
 * The four tiles, always all four and always in the same order.
 *
 * Equal weight is structural: every tile is built from the same shape, so no platform can
 * acquire an extra field, a different size or a richer preview than the others. The tile
 * holding the live scenario differs only by its unread count, its status and its preview
 * line - the three things section 3 asks for.
 */
export function tilesFor({ scenario, state }) {
  const activeKey = scenario?.platform ?? null
  const notifications = assetsOfKind(scenario, ASSET_KIND.NOTIFICATION)

  /**
   * Dismissing removes the toast, never the scenario: the badge and the preview stay,
   * which is exactly what makes "the item is still waiting in WhatsApp" true. `dismissed`
   * is therefore not part of this test - it suppresses the tray above, and nothing else.
   */
  const live = state === ACTIVITY.DELIVERED || state === ACTIVITY.ENGAGED

  return CHANNELS.map(({ key, label, icon }) => {
    const carries = live && key === activeKey && notifications.length > 0

    return {
      key,
      label,
      icon,
      unread: carries ? notifications.length : 0,
      status: carries ? TILE_STATUS.ACTIVITY : TILE_STATUS.QUIET,
      /** One line, from the same asset the toast reads, so the two cannot disagree. */
      preview: carries ? (notifications[0].content?.body ?? '') : TILE_QUIET_PREVIEW,
    }
  })
}

function channelLabel(key) {
  return CHANNELS.find((channel) => channel.key === key)?.label ?? 'Messages'
}
