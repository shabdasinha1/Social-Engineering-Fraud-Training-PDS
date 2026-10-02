import { ASSET_KIND } from '../../../constants/simulation.js'
import { SURFACE } from '../../sceneModel.js'

/**
 * What every Email scene pack reads out of the scenario the SERVER sent (IMMERSIVE-005).
 *
 * The same seam the WhatsApp and Instagram packs use. Names, the sender address, the
 * headline subject, the link target, the attachment facts and the trusted-directory entry
 * are read from `scenario.synthetic` (the pinned ScenarioDefinition content); a pack adds
 * only structure the bank has no field for - the earlier messages in the conversation, an
 * HTML email's body and buttons, what the expanded details say, what a preview shows. It
 * never restates a fact the bank already owns, so the two cannot disagree.
 *
 * The learner's own mailbox address is fixed once here so every screen that shows it agrees.
 */

export const LEARNER = {
  name: 'You',
  account: 'learner@unit.training.example',
}

export const asset = (scenario, kind) =>
  (scenario?.synthetic?.assets ?? []).find((item) => item.kind === kind) ?? null

export const assetId = (scenario, kind) => asset(scenario, kind)?.asset_id ?? null

export const sender = (scenario) => scenario?.synthetic?.sender ?? {}

export const notification = (scenario) => asset(scenario, ASSET_KIND.NOTIFICATION)?.content ?? {}

export const browserPage = (scenario) => asset(scenario, ASSET_KIND.BROWSER)

export const fileAsset = (scenario) => asset(scenario, ASSET_KIND.FILE)

export const directory = (scenario) => asset(scenario, ASSET_KIND.DIRECTORY)?.content ?? {}

/** The subject line the client wrote for this scenario, verbatim (the notification body). */
export const subjectLine = (scenario) => notification(scenario).body ?? ''

/** When the client's message arrived, as the bank stores it. */
export const receivedAt = (scenario) => notification(scenario).received_at ?? null

/* ------------------------------------------------------------------ *
 * Beats - one thing in the open message, or an earlier message in the thread.
 *
 * A beat carries `since` (default 'open') and optionally `until` / `afterConsequence`, so the
 * open message and the conversation history are a pure function of the committed stage and a
 * reload rebuilds them exactly.
 * ------------------------------------------------------------------ */

const beat = (kind, fields) => ({ kind, since: 'open', ...fields })

/** The message body: greeting, paragraphs, an optional signature, footer and quoted history. */
export const body = (id, { greeting = null, paragraphs, signature = null, footer = null, quoted = null, ...extra }) =>
  beat('body', { id, greeting, paragraphs, signature, footer, quoted, ...extra })

/** An HTML email's masthead band. Drawn from a monogram and a colour; never an image. */
export const brand = (id, { monogram, name, tagline = null, color = null, ...extra }) =>
  beat('brand', { id, monogram, name, tagline, color, ...extra })

/** A button inside an HTML email. Anchor a control to it to make it the thing that acts. */
export const button = (id, { label, caption = null, ...extra }) =>
  beat('button', { id, label, caption, ...extra })

/** A key/value block an HTML email lays out (order details, a case reference). */
export const table = (id, { rows, ...extra }) => beat('table', { id, rows, ...extra })

/** A courier-style shipment timeline. `done` is how many steps are complete. Text only. */
export const steps = (id, { steps: rows, done = 0, ...extra }) => beat('steps', { id, steps: rows, done, ...extra })

/** A countdown printed in the message. Text, never a live clock. */
export const timer = (id, { label, value, ...extra }) => beat('timer', { id, label, value, ...extra })

/** An attachment card. Anchor Preview / other controls to it. Nothing is ever executed. */
export const attachment = (id, { fileName, fileKind = 'PDF', size = null, ...extra }) =>
  beat('attachment', { id, fileName, fileKind, size, ...extra })

/** The mail app's own one-line note. Never a verdict. */
export const notice = (id, text, extra = {}) => beat('notice', { id, text, ...extra })

/**
 * A calendar invitation card (IMMERSIVE-006, Email only).
 *
 * The mail app draws a meeting invite - title, when, where, organizer and who else is going -
 * with Accept / Tentative / Decline as the anchored controls. It is text and CSS; nothing is
 * added to any real calendar and no reminder is set.
 */
export const invite = (id, { title, when, where = null, organizer = null, attendees = [], note = null, ...extra }) =>
  beat('invite', { id, title, when, where, organizer, attendees, note, ...extra })

/**
 * A voice-note attachment (IMMERSIVE-009, Email only).
 *
 * The mail app draws an audio attachment the way a mail client draws voicemail: a card with
 * the file's name and length, a local play control that moves a line across a drawn waveform
 * over the authored clock, and the app's own transcription behind a toggle. There is no audio
 * element, no media file and no media API anywhere - the transcript is where the words live,
 * because a simulation that cannot make a sound has to say what was said somewhere honest.
 * Playing and reading the transcript are local and record nothing.
 */
export const voice = (id, { fileName, duration, transcript, size = null, caption = null, ...extra }) =>
  beat('voice', { id, fileName, duration, transcript, size, caption, ...extra })

/** An earlier message in the conversation, collapsed to its sender and first line. */
export const earlier = (id, { from, to = null, time, snippet, paragraphs, ...extra }) =>
  beat('earlier', { id, from, to, time, snippet, paragraphs, ...extra })

/** The learner's own message once it has been sent, shown in the thread. */
export const sent = (id, { to, text, label = 'You', time = null, ...extra }) =>
  beat('sent', { id, to, text, label, time, ...extra })

/** Quoted history for a `body` beat: the "On … wrote:" block behind the toggle. */
export const quote = (header, paragraphs) => ({ header, paragraphs })

/* ------------------------------------------------------------------ *
 * Surfaces
 * ------------------------------------------------------------------ */

/** A mail-app screen graph (details, headers, folder, preview), opened on `home`. */
export const mail = ({ title, home, pages, inertNote = null }) =>
  ({ kind: SURFACE.MAIL, title, home, pages, inertNote })
