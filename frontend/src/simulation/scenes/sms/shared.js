import { ASSET_KIND } from '../../../constants/simulation.js'
import { SURFACE } from '../../sceneModel.js'

/**
 * What every SMS scene pack reads out of the scenario the SERVER sent (IMMERSIVE-010).
 *
 * The same seam the WhatsApp, Instagram and Email packs use. The sender's name and number,
 * the message text, the link target, the trusted-directory entry and the payment and call
 * facts are read from `scenario.synthetic` (the pinned ScenarioDefinition content); a pack
 * adds only structure the bank has no field for - the earlier texts in the thread, the
 * other conversations in the list, what the details screen says, what a link expands to.
 * It never restates a fact the bank already owns, so the two cannot disagree.
 *
 * The learner's own number is fixed once here so every screen that shows it agrees.
 */

export const LEARNER = {
  name: 'You',
  number: '+91 00000 10001',
}

export const asset = (scenario, kind) =>
  (scenario?.synthetic?.assets ?? []).find((item) => item.kind === kind) ?? null

export const assetId = (scenario, kind) => asset(scenario, kind)?.asset_id ?? null

export const sender = (scenario) => scenario?.synthetic?.sender ?? {}

export const notification = (scenario) => asset(scenario, ASSET_KIND.NOTIFICATION)?.content ?? {}

export const browserPage = (scenario) => asset(scenario, ASSET_KIND.BROWSER)

export const directory = (scenario) => asset(scenario, ASSET_KIND.DIRECTORY)?.content ?? {}

/** The text the client wrote for this scenario, verbatim (the notification body). */
export const messageText = (scenario) => notification(scenario).body ?? ''

/** When the client's message arrived, as the bank stores it. */
export const receivedAt = (scenario) => notification(scenario).received_at ?? null

/* ------------------------------------------------------------------ *
 * Beats - one thing in the thread.
 *
 * A beat carries `since` (default 'open') and optionally `until` / `afterConsequence`, so
 * the thread is a pure function of the committed stage and a reload rebuilds it exactly.
 * ------------------------------------------------------------------ */

const beat = (kind, fields) => ({ kind, since: 'open', ...fields })

/** A date divider, the way the app groups a thread by day. */
export const day = (id, text, extra = {}) => beat('day', { id, text, ...extra })

/** The app's or the carrier's own line in the thread. Never a verdict on the message. */
export const system = (id, text, extra = {}) => beat('system', { id, text, ...extra })

/**
 * One text. `from` is `'them'` or `'me'`; `via` is the SIM or route label the app prints
 * beside the time ("SIM 1", "Sent as SMS").
 */
export const message = (id, { text, from = 'them', time = null, via = null, ...extra }) =>
  beat('message', { id, text, from, time, via, ...extra })

/**
 * The link preview card the app builds from an address in the text. `shown` is the address
 * AS WRITTEN, which is the point: a shortener stays a shortener until the learner looks it
 * up on the details screen. Drawn text; there is no anchor anywhere.
 */
export const link = (id, { shown, caption, ...extra }) => beat('link', { id, shown, caption, ...extra })

/** A number written in a text, as the app makes it tappable. No dialer exists anywhere. */
export const number = (id, { number: value, caption = null, ...extra }) =>
  beat('number', { id, number: value, caption, ...extra })

/** A transaction line, the way a bank's alert lays one out inside the message. */
export const amount = (id, { amount: value, rows, ...extra }) => beat('amount', { id, amount: value, rows, ...extra })

/** An MMS attachment card. Nothing is ever opened or executed. */
export const attachment = (id, { fileName, fileKind = 'Image', size = null, ...extra }) =>
  beat('attachment', { id, fileName, fileKind, size, ...extra })

/* ------------------------------------------------------------------ *
 * Surfaces
 * ------------------------------------------------------------------ */

/** A Messages-app screen graph (conversation details, link details), opened on `home`. */
export const sms = ({ title, home, pages, inertNote = null }) =>
  ({ kind: SURFACE.SMS, title, home, pages, inertNote })
