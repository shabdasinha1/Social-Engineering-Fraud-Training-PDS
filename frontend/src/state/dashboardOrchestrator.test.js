import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MAX_TOASTS } from '@/constants/simulation'
import { CHANNELS } from '@/constants/channels'
import {
  ACTIVITY,
  DELIVERY_MAX_MS,
  DELIVERY_MIN_MS,
  TILE_STATUS,
  activityStateFor,
  alertDismissed,
  awaitingDelivery,
  deliveryDelayMs,
  tilesFor,
  trayFor,
  wasInterrupted,
} from '@/state/dashboardOrchestrator'
import { SCENARIO_GENERIC } from '@/test/attemptFixtures'

/**
 * The dashboard orchestrator (UI-004), tested as the pure projection it is.
 *
 * No DOM, no timers and no server: every case here is "given the run state the engine
 * committed, what should the hub look like", which is the only question this module is
 * allowed to answer.
 */

const run = (overrides = {}) => ({
  run_id: 'run-1',
  status: 'active',
  current_stage: 'notify',
  last_sequence: 0,
  ...overrides,
})

/** SCENARIO_GENERIC with `count` notification assets, to exercise the tray cap for real. */
function withNotifications(count) {
  const [notification] = SCENARIO_GENERIC.synthetic.assets.filter((a) => a.kind === 'notification')
  const others = SCENARIO_GENERIC.synthetic.assets.filter((a) => a.kind !== 'notification')
  const extras = Array.from({ length: count }, (_, index) => ({
    ...notification,
    asset_id: `${notification.asset_id}-${index}`,
    content: { ...notification.content, body: `Synthetic notification ${index + 1}` },
  }))

  return { ...SCENARIO_GENERIC, synthetic: { ...SCENARIO_GENERIC.synthetic, assets: [...extras, ...others] } }
}

describe('the post-idle delivery window', () => {
  it('always falls inside the 1-4 second window the specification states', () => {
    const ids = Array.from({ length: 500 }, (_, index) => `68b1c0a9f0a1b2c3d4e5f${index}`)

    for (const id of ids) {
      const delay = deliveryDelayMs(id)
      expect(delay).toBeGreaterThanOrEqual(DELIVERY_MIN_MS)
      expect(delay).toBeLessThanOrEqual(DELIVERY_MAX_MS)
    }
    expect(DELIVERY_MIN_MS).toBe(1000)
    expect(DELIVERY_MAX_MS).toBe(4000)
  })

  /** Implementation rule D: nothing in this path may depend on Math.random. */
  it('is deterministic - the same run always waits the same time', () => {
    expect(deliveryDelayMs('run-1')).toBe(deliveryDelayMs('run-1'))
    expect(deliveryDelayMs('run-1')).toBe(2768)
    expect(deliveryDelayMs('run-2')).toBe(2853)
  })

  it('varies between runs, so the pause does not read as a fixed machine beat', () => {
    const delays = new Set(
      Array.from({ length: 200 }, (_, index) => deliveryDelayMs(`68b1c0a9f0a1b2c3d4e5f${index}`)),
    )
    expect(delays.size).toBeGreaterThan(100)
  })

  it('does not read Math.random anywhere in the module', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/state/dashboardOrchestrator.js'),
      'utf8',
    )
    // Comments stripped: the file says in prose that it does not use it, and that
    // sentence must not be what makes this assertion pass.
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    expect(code).toContain('deliveryDelayMs')
    expect(code).not.toContain('Math.random')
  })
})

describe('which runs are waiting to be delivered', () => {
  it('queues a run that is at notify with nothing in its ledger', () => {
    expect(awaitingDelivery(run())).toBe(true)
  })

  /** A dismissed alert has already arrived; a reload must not deliver it a second time. */
  it('does not re-queue a run whose notification has already been seen', () => {
    expect(awaitingDelivery(run({ last_sequence: 1 }))).toBe(false)
  })

  it('does not queue a run that has moved past notify, or one already resolved', () => {
    expect(awaitingDelivery(run({ current_stage: 'branch', last_sequence: 3 }))).toBe(false)
    expect(awaitingDelivery(run({ status: 'resolved' }))).toBe(false)
    expect(awaitingDelivery(null)).toBe(false)
  })
})

describe('reading dismissal and interruption out of server state', () => {
  it('treats a notify run with a sequence behind it as dismissed', () => {
    expect(alertDismissed(run())).toBe(false)
    expect(alertDismissed(run({ last_sequence: 1 }))).toBe(true)
  })

  it('counts a part-way run as interrupted and a fresh one as not', () => {
    expect(wasInterrupted(run())).toBe(false)
    expect(wasInterrupted(run({ current_stage: 'verify', last_sequence: 4 }))).toBe(true)
    expect(wasInterrupted(run({ last_sequence: 1 }))).toBe(true)
    expect(wasInterrupted(null)).toBe(false)
  })
})

describe('hub state', () => {
  it('maps each run state to exactly one hub state', () => {
    expect(activityStateFor({ run: run(), delivered: false })).toBe(ACTIVITY.QUEUED)
    expect(activityStateFor({ run: run(), delivered: true })).toBe(ACTIVITY.DELIVERED)
    expect(activityStateFor({ run: run({ current_stage: 'open' }), delivered: true }))
      .toBe(ACTIVITY.ENGAGED)
    expect(activityStateFor({ run: run({ status: 'resolved' }), delivered: true }))
      .toBe(ACTIVITY.RESOLVED)
    expect(activityStateFor({ run: null, delivered: true })).toBe(ACTIVITY.COMPLETE)
  })
})

describe('the toast tray', () => {
  it('queues at most three, however many the scenario supplies', () => {
    const tray = trayFor({
      scenario: withNotifications(5),
      state: ACTIVITY.DELIVERED,
      dismissed: false,
    })

    expect(MAX_TOASTS).toBe(3)
    expect(tray).toHaveLength(3)
    expect(tray.map((item) => item.body)).toEqual([
      'Synthetic notification 1',
      'Synthetic notification 2',
      'Synthetic notification 3',
    ])
  })

  it('is empty while the delivery window is still running', () => {
    expect(trayFor({ scenario: SCENARIO_GENERIC, state: ACTIVITY.QUEUED, dismissed: false }))
      .toHaveLength(0)
  })

  it('is empty once the alert has been dismissed', () => {
    expect(trayFor({ scenario: SCENARIO_GENERIC, state: ACTIVITY.DELIVERED, dismissed: true }))
      .toHaveLength(0)
  })

  it('names the app each toast arrived in, so a click is a deep link', () => {
    const [toast] = trayFor({
      scenario: SCENARIO_GENERIC,
      state: ACTIVITY.DELIVERED,
      dismissed: false,
    })
    expect(toast.appKey).toBe('whatsapp')
    expect(toast.appLabel).toBe('WhatsApp')
    expect(toast.sender).toBe('QuickParcel Support')
  })
})

describe('the app grid', () => {
  it('always returns all four platforms in a fixed order', () => {
    const tiles = tilesFor({ scenario: SCENARIO_GENERIC, state: ACTIVITY.DELIVERED })
    expect(tiles.map((tile) => tile.key)).toEqual(CHANNELS.map((channel) => channel.key))
    expect(tiles).toHaveLength(4)
  })

  it('gives every tile the same shape, so no platform can carry more than another', () => {
    const tiles = tilesFor({ scenario: SCENARIO_GENERIC, state: ACTIVITY.DELIVERED })
    const shape = Object.keys(tiles[0]).sort()
    for (const tile of tiles) expect(Object.keys(tile).sort()).toEqual(shape)
  })

  it('badges only the app the scenario arrived in, and only once delivered', () => {
    const queued = tilesFor({ scenario: SCENARIO_GENERIC, state: ACTIVITY.QUEUED })
    expect(queued.every((tile) => tile.unread === 0)).toBe(true)
    expect(queued.every((tile) => tile.status === TILE_STATUS.QUIET)).toBe(true)

    const delivered = tilesFor({ scenario: SCENARIO_GENERIC, state: ACTIVITY.DELIVERED })
    const active = delivered.filter((tile) => tile.status === TILE_STATUS.ACTIVITY)
    expect(active).toHaveLength(1)
    expect(active[0].key).toBe('whatsapp')
    expect(active[0].unread).toBe(1)
  })

  /** Section 3: badge count, toast preview and app list all reflect one scenario state. */
  it('previews the same text the toast shows', () => {
    const [toast] = trayFor({
      scenario: SCENARIO_GENERIC,
      state: ACTIVITY.DELIVERED,
      dismissed: false,
    })
    const tile = tilesFor({ scenario: SCENARIO_GENERIC, state: ACTIVITY.DELIVERED })
      .find((entry) => entry.key === 'whatsapp')

    expect(tile.preview).toBe(toast.body)
    expect(tile.unread).toBe(1)
  })

  it('keeps the badge after the alert is dismissed - dismissal removes no scenario', () => {
    const tiles = tilesFor({ scenario: SCENARIO_GENERIC, state: ACTIVITY.DELIVERED })
    expect(tiles.find((tile) => tile.key === 'whatsapp').unread).toBe(1)
    expect(trayFor({ scenario: SCENARIO_GENERIC, state: ACTIVITY.DELIVERED, dismissed: true }))
      .toHaveLength(0)
  })

  it('says nothing about the item beyond that it exists', () => {
    const tiles = tilesFor({ scenario: SCENARIO_GENERIC, state: ACTIVITY.DELIVERED })
    expect(Object.values(TILE_STATUS)).toEqual(['activity', 'quiet'])

    const serialised = JSON.stringify(tiles)
    for (const term of ['malicious', 'legitimate', 'disposition', 'family', 'difficulty']) {
      expect(serialised.toLowerCase()).not.toContain(term)
    }
  })
})
