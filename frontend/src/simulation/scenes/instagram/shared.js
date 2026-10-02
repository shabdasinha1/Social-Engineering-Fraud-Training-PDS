import { ASSET_KIND } from '../../../constants/simulation.js'
import { SURFACE } from '../../sceneModel.js'

/**
 * What every Instagram scene pack reads out of the scenario the SERVER sent
 * (IMMERSIVE-004A).
 *
 * The same seam the WhatsApp packs use (`scenes/whatsapp/shared.js`), with one difference
 * the Instagram bank forces on it. The client wrote every Instagram notification as
 * `@handle: message` - "@mega_rewards_help: You won! Claim in 10 minutes or we redraw." -
 * and that handle is the account the scenario is about. The generated `sender` asset beside
 * it is a placeholder (`@unknownsender274`, `name_source: "placeholder"`) with random
 * follower counts, and it contradicts the client's own text. So the account a scene draws is
 * the handle in the client's sentence, the verbatim sentence is still on the device, and the
 * placeholder is never printed. Every inspection still names the bank's sender ASSET, so the
 * ledger records what was inspected against the pinned definition.
 *
 * Everything else a scene adds - earlier messages, a profile's grid, the comments under a
 * post, the brand's real account - is presentation and interaction structure, synthetic,
 * local and inert.
 */

export const asset = (scenario, kind) =>
  (scenario?.synthetic?.assets ?? []).find((item) => item.kind === kind) ?? null

export const assetId = (scenario, kind) => asset(scenario, kind)?.asset_id ?? null

export const notification = (scenario) => asset(scenario, ASSET_KIND.NOTIFICATION)?.content ?? {}

export const browserPage = (scenario) => asset(scenario, ASSET_KIND.BROWSER)

export const directory = (scenario) => asset(scenario, ASSET_KIND.DIRECTORY)?.content ?? {}

/** The client's notification sentence, verbatim: `@handle: message`. */
export const headline = (scenario) => notification(scenario).body ?? ''

/**
 * The handle and the message of the client's sentence, split where the app splits them.
 *
 * An Instagram push reads "handle: message", so the handle is the account and the rest is
 * what it said. A sentence with no handle (a sponsored item) keeps its text whole.
 */
export function splitHeadline(scenario) {
  const body = headline(scenario)
  const match = /^@([a-z0-9._]+):\s*(.*)$/i.exec(body)
  if (!match) return { handle: null, text: body }
  return { handle: match[1], text: match[2] }
}

/** When the client's notification arrived, as the bank stores it. */
export const receivedAt = (scenario) => notification(scenario).received_at ?? null

/* ------------------------------------------------------------------ *
 * Beats
 *
 * Like WhatsApp's, a beat carries `since` (and optionally `until` / `afterConsequence`) so
 * the thread and the comments under a post are a pure function of the stage the server
 * committed, and a reload rebuilds them exactly.
 * ------------------------------------------------------------------ */

const beat = (kind, fields) => ({ kind, since: 'open', ...fields })

/** A centred grey timestamp or notice, the way a DM thread separates its days. */
export const day = (id, text, extra = {}) => beat('day', { id, text, ...extra })

export const system = (id, text, extra = {}) => beat('system', { id, text, ...extra })

export const them = (id, text, time, extra = {}) =>
  beat('message', { id, from: 'them', text, time, ...extra })

export const me = (id, text, time, extra = {}) =>
  beat('message', { id, from: 'me', text, time, ...extra })

/** A link someone pasted into a DM, with the preview card the app draws. Text only. */
export const link = (id, { from = 'them', text = null, title, description, displayUrl, time, ...extra }) =>
  beat('link', { id, from, text, title, description, displayUrl, time, ...extra })

/**
 * "Replied to your story" - the way most strangers first reach someone on Instagram.
 *
 * `story` is the learner's own story the reply is attached to, drawn as a small tile, so
 * the thread shows exactly what the stranger was looking at when they wrote.
 */
export const storyReply = (id, { from = 'them', story, text, time, ...extra }) =>
  beat('storyReply', { id, from, story, text, time, ...extra })

/** A post shared into the DM. `to` is a page or screen the card opens, locally. */
export const sharedPost = (id, { from = 'them', author, verified = false, art, title, caption, to = null, time, ...extra }) =>
  beat('sharedPost', { id, from, author, verified, art, title, caption, to, time, ...extra })

/** A payment handle pasted into a DM, drawn as the card a UPI app's share produces. */
export const payCard = (id, { from = 'them', payee, handle, amount, note, time, ...extra }) =>
  beat('payCard', { id, from, payee, handle, amount, note, time, ...extra })

export const typing = (id, extra = {}) => beat('typing', { id, ...extra })

/**
 * The card at the top of a message request: who this is, how many followers and posts,
 * and whether you follow each other. The app shows it before anything is said, and so does
 * the scene - it is not an inspection, and the account's history is still one tap further
 * in, on "About this account".
 */
export const requestCard = (id, { name, handle, verified = false, stats, relation, mutuals = null, ...extra }) =>
  beat('requestCard', { id, name, handle, verified, stats, relation, mutuals, ...extra })

/** One comment under a post. `reply` indents it under the comment before. */
export const comment = (id, { author, text, time, likes = null, verified = false, reply = false, ...extra }) =>
  beat('comment', { id, author, text, time, likes, verified, reply, ...extra })

/** A post's caption, with the accounts it tags. */
export const caption = (id, { author, verified = false, text, tags = [], time, ...extra }) =>
  beat('caption', { id, author, verified, text, tags, time, ...extra })

/* ------------------------------------------------------------------ *
 * Surfaces
 * ------------------------------------------------------------------ */

/** A social surface: a page graph inside the app, opened on `home`. */
export const social = ({ title, home, pages }) => ({ kind: SURFACE.SOCIAL, title, home, pages })

/** The learner's own account, named once so every screen that shows it agrees. */
export const LEARNER = {
  handle: 'rao.outdoors',
  name: 'A. Rao',
}
