import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * What every WhatsApp scene pack reads out of the scenario the SERVER sent.
 *
 * This is the seam that keeps the authored scenes honest. Names, numbers, the headline
 * message, the link target and the directory entry are not written here - they are read
 * from `scenario.synthetic`, which is the pinned ScenarioDefinition content. A scene adds
 * the shape of the conversation and the screens around it; it never restates a fact the
 * bank already owns, so the two cannot disagree and the bank stays the single source of
 * the wording the client signed off.
 *
 * Anything a scene DOES add is presentation and interaction structure - who else is in a
 * group, what the second page of a fake tracking site says, what a callback sounds like.
 * That content is synthetic, local and inert, exactly like the assets it sits beside.
 */

export const asset = (scenario, kind) =>
  (scenario?.synthetic?.assets ?? []).find((item) => item.kind === kind) ?? null

export const assetId = (scenario, kind) => asset(scenario, kind)?.asset_id ?? null

export const sender = (scenario) => scenario?.synthetic?.sender ?? {}

export const notification = (scenario) => asset(scenario, ASSET_KIND.NOTIFICATION)?.content ?? {}

export const browserPage = (scenario) => asset(scenario, ASSET_KIND.BROWSER)

export const directory = (scenario) => asset(scenario, ASSET_KIND.DIRECTORY)?.content ?? {}

/** The headline message the client wrote for this scenario, verbatim. */
export const headline = (scenario) => notification(scenario).body ?? ''

/** The narrator line DATA-003 stored as the thread's `note` block, if there is one. */
export function priorContext(scenario) {
  const thread = asset(scenario, ASSET_KIND.THREAD)
  const note = (thread?.content?.blocks ?? []).find((block) => block.type === 'note')
  return note?.text ?? scenario?.synthetic?.prior_context ?? null
}

/** The time DATA-003 stamped on the client's headline message inside the thread. */
export function headlineTime(scenario) {
  const thread = asset(scenario, ASSET_KIND.THREAD)
  const message = (thread?.content?.blocks ?? []).find((block) => block.type === 'message')
  return message?.time ?? notification(scenario).received_at ?? null
}

/* ------------------------------------------------------------------ *
 * Beat builders
 *
 * A beat is one thing in the thread. `since` is the earliest stage at which it has
 * happened, so the conversation is a function of the stage the server committed - which
 * is what makes it survive a reload without being stored anywhere.
 * ------------------------------------------------------------------ */

const beat = (kind, fields) => ({ kind, ...fields })

/** WhatsApp's own grey centred notice: encryption, "today", a system warning. */
export const system = (id, text, extra = {}) =>
  beat('system', { id, text, since: 'open', ...extra })

/** A day divider. Purely chrome, and the only place a date is stated. */
export const day = (id, text, extra = {}) => beat('day', { id, text, since: 'open', ...extra })

export const them = (id, text, time, extra = {}) =>
  beat('message', { id, from: 'them', text, time, since: 'open', ...extra })

export const me = (id, text, time, extra = {}) =>
  beat('message', { id, from: 'me', text, time, status: 'read', since: 'open', ...extra })

/** A link preview card. The URL is text; there is no href anywhere in the renderer. */
export const link = (id, { from = 'them', text, title, description, displayUrl, time, ...extra }) =>
  beat('link', { id, from, text, title, description, displayUrl, time, since: 'open', ...extra })

/** A WhatsApp verification-code system message. Never a real code, never checked. */
export const codeNotice = (id, { code, time, ...extra }) =>
  beat('code', { id, code, time, since: 'open', ...extra })

/**
 * An in-app poll, the way a group coordinator would post one.
 *
 * `options` may be plain strings or `{ label, votes }`. The votes are other participants'
 * answers, which is what stops a poll in a ten-person group from looking like a quiz with
 * nobody else in the room. Nothing is tallied anywhere: the counts are authored content.
 */
export const poll = (id, { from = 'them', question, options, total, time, ...extra }) =>
  beat('poll', { id, from, question, options, total, time, since: 'open', ...extra })

/** A payment request card: payee, amount, reference. Nothing is ever charged. */
export const payment = (id, { from = 'them', payee, amount, reference, note, expires, time, ...extra }) =>
  beat('payment', {
    id, from, payee, amount, reference, note, expires, time, since: 'open', ...extra,
  })

/** A pressure card counting down to something. Text, not a live timer. */
export const countdown = (id, { label, value, caption, time, ...extra }) =>
  beat('countdown', { id, label, value, caption, time, since: 'open', ...extra })

/**
 * The "typing..." strip.
 *
 * Authored like every other beat rather than driven by a timer, so it appears at the point
 * in the run the scene says and disappears when the message it belongs to arrives. A beat
 * that only exists between two stages is the honest way to show it: nothing is animated
 * into existence that the ledger does not already account for.
 */
export const typing = (id, { author = null, ...extra } = {}) =>
  beat('typing', { id, author, since: 'open', ...extra })

/**
 * A document card - the bubble WhatsApp draws around a PDF (IMMERSIVE-003B).
 *
 * The filename, size and type are the whole point of it: they are what a learner reads
 * before deciding whether an attachment is the thing they were expecting. Nothing is
 * loaded and there is no `src` anywhere - the card is a description, and opening it
 * pushes a viewer the scene declares.
 *
 * Named `fileCard` rather than `document` so a scene module importing it cannot shadow
 * the global of that name.
 */
export const fileCard = (id, { from = 'them', fileName, fileKind = 'PDF', pages = null, size, caption = null, time, ...extra }) =>
  beat('document', {
    id, from, fileName, fileKind, pages, size, caption, time, since: 'open', ...extra,
  })

/**
 * A photo or QR attachment (IMMERSIVE-003B).
 *
 * `art` says what the tile should LOOK like - `photo`, `crest`, `card` or `qr` - and the
 * renderer draws it from CSS and inline elements. There is deliberately no image file
 * anywhere in the product: a scenario that needed a real picture to be legible would be a
 * scenario that could not be shipped offline, and a drawn placeholder is honest about
 * being a simulation without a warning label on it.
 */
export const media = (id, { from = 'them', art = 'photo', label, caption = null, size = null, time, ...extra }) =>
  beat('media', { id, from, art, label, caption, size, time, since: 'open', ...extra })

/**
 * A voice message (IMMERSIVE-003C).
 *
 * Drawn, never played: there is no `audio` element, no media file and no playback API
 * anywhere in the product. The bubble has a play control that animates a progress line
 * over the authored `duration`, and a Transcript control that shows what was said - the
 * app's own transcription feature, and the only honest way an offline simulation can say
 * what a recording contains. Both are local and record nothing.
 *
 * `transcript` is the words; how the voice SOUNDS is deliberately not described. A cloned
 * voice is convincing, and a scene that hinted otherwise would be teaching the wrong cue.
 */
export const voice = (id, { from = 'them', duration, transcript, time, ...extra }) =>
  beat('voice', { id, from, duration, transcript, time, since: 'open', ...extra })

/**
 * A business message with reply buttons under it (IMMERSIVE-003C).
 *
 * The shape an appointment or delivery system sends through a business account: a header,
 * the body, a grey footer naming the sender, and one or more buttons attached to the bottom
 * of the bubble. The buttons are the scene's own affordances anchored to this beat, so the
 * reply the office asked for is sent from the place the office put it.
 */
export const template = (id, { header = null, text, footer = null, time, ...extra }) =>
  beat('template', { id, from: 'them', header, text, footer, time, since: 'open', ...extra })

/**
 * A call entry in the thread (IMMERSIVE-003C): missed, ringing, or ended.
 *
 * `state` is authored like everything else - a call that is "ringing" at the branch stage
 * rings for exactly as long as the stage lasts, and a reload shows the same thing.
 */
export const callEvent = (id, { video = false, state = 'missed', caller = null, number = null, time, ...extra }) =>
  beat('call', { id, video, state, caller, number, time, since: 'open', ...extra })

/** A quoted reply, so a thread can refer back to something said earlier. */
export const quote = (author, text) => ({ author, text })

/* ------------------------------------------------------------------ *
 * Surface helpers
 * ------------------------------------------------------------------ */

/**
 * A tabbed section list for a contact or group sheet.
 *
 * Tabs are what make evidence progressive on a details screen: the learner sees the
 * headline facts, and has to open "Groups in common" to find out that there are none.
 * Switching tabs is local and submits nothing.
 */
export const tabs = (items) => items

/** WhatsApp's own end-to-end line, on every thread, because it is on every thread. */
export const e2e = (id) =>
  system(id, 'Messages are end-to-end encrypted. No one outside of this chat can read them.')
