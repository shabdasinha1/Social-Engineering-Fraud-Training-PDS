/**
 * The scene vocabulary (IMMERSIVE-003A).
 *
 * A SCENE is what one scenario looks and behaves like inside a simulated app: which
 * conversation is open, what has already been said, which screens the learner can walk
 * into, and which controls are on each of them at each stage of the run.
 *
 * It is deliberately data, not code. A scene pack is a plain module that reads the
 * scenario payload the server already sends and returns the structure below - so it can
 * be imported by a Node test with no DOM, checked against the engine's own legal
 * transitions, and rendered by whichever platform component knows how to draw it.
 *
 * Three rules hold every scene together, and the tests assert all three:
 *
 * 1. **The engine still owns the run.** A scene never decides a stage, a score or an
 *    outcome. Every scored control carries a neutral ID, and the controller submits the
 *    opaque action code the server issued for that id - the same path the action sheet
 *    uses. What the control means is known only to the server (SECURITY-001). If the
 *    engine refuses it, nothing moved.
 * 2. **A scene shows only what belongs to the simulated world.** Disposition, difficulty,
 *    family, trigger and scoring are not in this vocabulary and cannot be expressed in it.
 * 3. **Nothing here executes.** Surfaces are descriptions - a browser page is a page model,
 *    a call is a caption list, a payment sheet is a summary. There is no href, src, fetch,
 *    `<form>` action, window.open, media device or host handler anywhere in a scene or in
 *    the components that draw one.
 *
 * IMMERSIVE-003A-R2 changes exactly one thing about rule 3, deliberately and narrowly.
 * A page may now declare a `form` block, and the learner may type into it. That is what
 * makes refusing to hand over a card number a decision rather than a reading exercise.
 * The containment that matters is unchanged and is stated in `field()` below: values live
 * in the component that draws the field, they are discarded when the learner leaves the
 * screen, and nothing ever reads them - not the controller, not the API, not the event
 * ledger, not local storage. The scene declares the SHAPE of a form; it never sees a value.
 */

/** Local surfaces a scene can push onto the device. Platform-agnostic on purpose. */
export const SURFACE = {
  /** The conversation itself. Always the base surface; never pushed. */
  CHAT: 'chat',
  /** Contact or business details - the "info" screen behind a chat header. */
  CONTACT: 'contact',
  /** Group details: description, participants, created-by, common groups. */
  GROUP: 'group',
  /** The offline browser, with its own page graph and history. */
  BROWSER: 'browser',
  /** A simulated call: ringing, connected, ended, with captions and a timer. */
  CALL: 'call',
  /** An inert file preview. */
  FILE: 'file',
  /** An in-app settings screen (account activity, linked devices, and so on). */
  SETTINGS: 'settings',
  /**
   * Another application on the same device (IMMERSIVE-003A-R2).
   *
   * Distinct from SETTINGS because the point of W05's verification route is that the
   * learner leaves the messenger for a different piece of software. It gets its own
   * chrome, its own colour and its own tab bar, so the switch reads as an app switch.
   */
  APP: 'app',
  /**
   * A payment sheet with a confirmation step (IMMERSIVE-003A-R2).
   *
   * The learner opens it locally from a payment request, enters a synthetic PIN and only
   * then presses the control that submits the payment. Opening the sheet is
   * navigation; confirming is the decision.
   */
  PAYSHEET: 'paysheet',

  /**
   * Whatever the device opens an attachment WITH (IMMERSIVE-003B).
   *
   * One surface rather than four, because a document viewer, a photo viewer, a QR
   * inspector and the gallery you pick an attachment from are the same screen with a
   * different glyph on it: a tile, some rows of metadata about the thing, and sometimes a
   * list. Splitting them would have produced four components that each drew a header and
   * a key/value list.
   *
   * It is where several of the W06-W10 decisions actually happen - the QR whose decoded
   * target does not match the brand that sent it, the service card staged in the gallery
   * with a Send control under it - so the same rule applies as everywhere else: opening it
   * is navigation, and only a scene affordance on it reaches the engine.
   */
  VIEWER: 'viewer',

  /**
   * The phone's own package installer (IMMERSIVE-003C).
   *
   * W14's decision is made on screens that belong to the operating system rather than to
   * the messenger: the "unknown apps" block, the per-source setting that lifts it, the
   * install confirmation and the permission prompts that follow. They are drawn as system
   * dialogs because the whole point is that the learner has left the chat and is being
   * asked, by their own phone, whether to let something in. Walking between those pages is
   * navigation; only Install and Cancel reach the engine. Nothing is installed, because
   * there is no package, no file and no permission anywhere in the product.
   *
   * IMMERSIVE-003D reuses the same system chrome for the phone's other system screens - a
   * location-permission prompt and the live-location share sheet (page style `sheet`) - with
   * the surface's own `closeLabel` and `inertNote`, rather than adding a second component
   * that would draw the same dialog. Nothing is granted or shared from these either.
   */
  INSTALLER: 'installer',

  /**
   * A screen inside a social app itself (IMMERSIVE-004A, Instagram).
   *
   * Where a messenger's evidence sits on a contact sheet, a social app's sits on pages the
   * learner walks between: a profile with its grid and its follower counts, the account's
   * "About this account" history, a follower or following list, a single post with its
   * comments, a story, the app's own search results, and the app's own settings. They are
   * one surface with a page graph rather than seven components, because they share a
   * header, a Back that walks the page history, and the rule that walking between them is
   * navigation and records nothing. Only a scene affordance scoped to a page reaches the
   * engine.
   */
  SOCIAL: 'social',

  /**
   * A screen inside the mail app (IMMERSIVE-005, Email).
   *
   * An email's evidence sits behind the mail client's own screens rather than on a contact
   * card: the expanded message details (From, Reply-To, the authentication summary, where
   * each link really points), "Show original", another folder, an older message, and the
   * attachment preview with its message bar. One page graph with a shared header and a Back
   * that walks the page history; walking between them is navigation and records nothing.
   */
  MAIL: 'mail',

  /**
   * A screen inside the phone's Messages app (IMMERSIVE-010, SMS).
   *
   * A text message has no contact card behind it and no profile to open: what the app
   * offers instead is a conversation-details screen - the number the message really came
   * from, whether it is a registered sender header or an ordinary mobile, whether it is in
   * the contacts, which SIM received it, where a shortened link expands to, and the other
   * threads from the same sender. One page graph with a shared header and a Back that
   * walks the page history; walking between them is navigation and records nothing.
   */
  SMS: 'sms',
}

/**
 * Where an affordance lives in the app chrome. This is presentation, but it is declared
 * in the scene rather than guessed by the renderer, because a reply belongs in the
 * composer and a report belongs in the overflow menu - and getting that wrong is exactly
 * what makes an interface read as a questionnaire.
 */
export const SLOT = {
  /** The header's overflow (three-dot) menu. */
  MENU: 'menu',
  /** The message composer strip: authored quick replies. */
  COMPOSER: 'composer',
  /** Attached to a message in the thread - a link card, a poll, a payment request. */
  INLINE: 'inline',
  /** A control on a pushed surface (contact sheet, browser page, call screen). */
  SURFACE: 'surface',
}

export const STAGE_ORDER = ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve']

/** Position of a stage in the run, or -1. Used to decide which beats have happened yet. */
export const stageIndex = (stage) => STAGE_ORDER.indexOf(stage)

/** True when the run has reached `since` (or later). */
export const reached = (stage, since) => stageIndex(stage) >= stageIndex(since)

/**
 * A scored control.
 *
 * `id` is the control's NEUTRAL name - `<scenario>-cNN`, a position and nothing more -
 * and `label` is the app's. What the control submits lives only on the server
 * (`backend/data/learner-actions/v1`), keyed by that id, and the controller sends the
 * opaque per-run code the server issued for it (SECURITY-001). A scene can therefore not
 * carry an engine intent or a verification source, and `action()` refuses one outright
 * rather than let it reach the bundle, the props or the DOM.
 *
 * Nothing about the label may say which choice is wise - the same rule the action sheet
 * has always obeyed - and nothing here carries a variant, colour or ordering by risk.
 *
 * `opens` names a surface to push AFTER the engine accepts, never before: the learner
 * cannot end up on a page the ledger has no record of them opening.
 *
 * `on` scopes a SURFACE control to one pushed screen; `page` narrows it further to one
 * page of that screen, so a payment form's commit control appears on the review step and
 * not on the step where the details are being typed. `thenPage` is the page the surface
 * moves to once the engine has accepted - which is how a submitted form reaches its
 * outcome screen without the device deciding anything for itself. `closes` is the same
 * idea for a screen with no next step: a payment sheet the learner has confirmed is done,
 * so the device walks back to the conversation where the consequence is waiting.
 * `closes: 'all'` (IMMERSIVE-014) does the same for a sheet reached through another screen,
 * leaving every pushed screen rather than only the top one.
 *
 * `compose` (IMMERSIVE-005, Email only) says which of the mail app's two compose sheets a
 * `COMPOSER` control belongs to - `{ mode: 'reply' | 'forward', to }` - and the address the
 * sheet shows in its To line. Presentation only; it says nothing about what is submitted.
 */
export function action({
  id, label, hint = null, slot = SLOT.MENU, targetId = null,
  opens = null, echo = null, on = null, page = null, thenPage = null, closes = false,
  anchor = null, compose = null, ...rest
}) {
  const refused = ['intent', 'source'].filter((key) => key in rest)
  if (refused.length) {
    throw new Error(`scene control ${id} declares ${refused.join(', ')}; that mapping belongs on the server (SECURITY-001)`)
  }
  return {
    id, label, hint, slot, targetId, opens, echo, on, page, thenPage, closes, anchor,
    ...(compose ? { compose } : {}),
  }
}

/**
 * The inline affordances that belong to one beat in the thread - a poll's options, a
 * payment card's pay control, a link preview's open and inspect controls.
 *
 * Anchoring is what puts a control where the thing it acts on already is. An inline
 * affordance with no anchor is a chat-level control and is drawn in the action bar under
 * the conversation instead.
 */
export function anchoredTo(affordances, beatId) {
  return affordances.filter((item) => item.anchor === beatId)
}

/**
 * A control that only moves the learner around the device.
 *
 * It submits nothing, scores nothing and cannot advance a stage - looking at a second tab
 * of a contact sheet is not a decision. This is what lets investigation be free-form
 * while scoring stays exactly one committed event per stage.
 */
export function navigate({
  id, label, hint = null, slot = SLOT.MENU, opens = null, after = null, anchor = null,
}) {
  return { id, label, hint, slot, opens, after, anchor, local: true }
}

/* ------------------------------------------------------------------ *
 * Form fields (IMMERSIVE-003A-R2)
 * ------------------------------------------------------------------ */

/** How a field behaves locally. Nothing here describes where a value would go. */
export const FIELD_KIND = {
  /** Free text, e.g. a name or a UPI handle. */
  TEXT: 'text',
  /** Digits only, grouped for readability while typing. */
  DIGITS: 'digits',
  /** Digits, rendered as dots by the component itself - never `type="password"`. */
  SECRET: 'secret',
  /** MM / YY. */
  EXPIRY: 'expiry',
  /**
   * Free text rendered as dots by the component itself (IMMERSIVE-004A) - a password on a
   * look-alike login page. Masked by CSS like SECRET, never `type="password"`, so no
   * credential manager recognises it; unlike SECRET it accepts letters.
   */
  MASKED: 'masked',
}

/**
 * One field on a simulated page.
 *
 * `length` is how many characters the field NEEDS before the page's own control becomes
 * usable; `max` is how many it ACCEPTS, and defaults to `length`. They differ wherever a
 * field is free-form - a name on a card needs three characters and accepts twenty-six -
 * because a field that stops taking input at its minimum is worse than no field at all.
 * `group` splits the displayed value into blocks so a card number looks like one.
 *
 * Three properties are guaranteed by the components that render this, and asserted by
 * `SceneForms.test.jsx`:
 *
 * - the value lives in the rendering component's own state and nowhere else,
 * - it is gone the moment the learner leaves the screen,
 * - it is never passed to an affordance, an intent, metadata, storage or a network call.
 *
 * The field also carries `autoComplete="off"` and a neutral `name`, so no browser or
 * password manager recognises it as a payment or credential field and offers to save it.
 */
export function field({
  name, label, kind = FIELD_KIND.TEXT, length, max = null, group = null, hint = null,
  placeholder = null,
}) {
  return { name, label, kind, length, max, group, hint, placeholder }
}

/** Every field on a page, across all of its form blocks. For validation and for tests. */
export function fieldsOfPage(page) {
  return (page?.blocks ?? [])
    .filter((block) => block.type === 'form')
    .flatMap((block) => block.fields ?? [])
}

/**
 * Local navigation the learner keeps once they have earned it.
 *
 * A scene's `ambient` list is offered on every stage from `after` onwards, so a learner
 * who opened the contact sheet at the inspect stage can open it again while deciding.
 * Re-reading evidence is not a second decision and is never scored again.
 */
export function ambientFor(scene, stage) {
  return (scene?.ambient ?? []).filter((item) => !item.after || reached(stage, item.after))
}

/** Every affordance a stage offers, in the slot the renderer asked for. */
export function affordancesIn(scene, stage, slot) {
  return affordancesFor(scene, stage).filter((item) => item.slot === slot)
}

/** Every affordance a stage offers, in any slot. */
export function affordancesFor(scene, stage) {
  return scene?.stages?.[stage]?.affordances ?? []
}

/**
 * The thread as it stands at this point in the run.
 *
 * Beats carry `since`, so the conversation is derived from the stage the server committed
 * rather than remembered locally: a reload rebuilds exactly the same thread. A beat may
 * also name `afterConsequence`, which shows it only while the engine's rendering
 * instruction for the last action is still on screen - the same lifetime the consequence
 * surface has always had.
 */
export function beatsAt(scene, stage, consequenceKind = null) {
  return (scene?.beats ?? []).filter((beat) => {
    if (beat.since && !reached(stage, beat.since)) return false
    /**
     * `until` is the other half of `since`, and it is what makes a transient thing - a
     * typing strip, an "online" line - honest. The beat exists between two stages the
     * server committed and disappears when the run passes the second, so it is still a
     * pure function of the stage and still survives a reload unchanged.
     */
    if (beat.until && reached(stage, beat.until)) return false
    if (beat.afterConsequence && beat.afterConsequence !== consequenceKind) return false
    return true
  })
}

/** A surface description by id, or null. */
export function surfaceById(scene, id) {
  if (!id) return null
  return scene?.surfaces?.[id] ?? null
}

/** A wall-clock time as the scene lists draw it, e.g. "08:10" - not "2m" or "Yesterday". */
const CLOCK_TIME = /^\d{1,2}:\d{2}$/

/**
 * The clock time the scene's app list shows for the scenario's own item (the row with id
 * `<scenario id>-row`), or null when the scene has no such row or lists it relatively.
 *
 * The notification tray reads its time from the bank's notification asset, while each scene
 * draws its inbox, chat list and thread on its own authored timeline. Where those differ the
 * same message would announce itself at one time and be listed at another, so the tray takes
 * this time instead (release audit, 26 Sep 2026). Presentation only, like the scene sender.
 */
export function headlineClockTime(scene) {
  const id = scene?.scenarioId ? `${String(scene.scenarioId).toLowerCase()}-row` : null
  if (!id) return null
  const stack = [scene.list]
  while (stack.length) {
    const node = stack.pop()
    if (!node || typeof node !== 'object') continue
    if (!Array.isArray(node) && node.id === id) {
      return typeof node.time === 'string' && CLOCK_TIME.test(node.time) ? node.time : null
    }
    stack.push(...Object.values(node))
  }
  return null
}

/** Case, spacing, quote style and a leading "@handle: " do not make two texts different. */
function comparableText(text) {
  return String(text ?? '')
    .replace(/^@[\w.]+:\s*/, '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/**
 * The clock time of the thread message the notification announces, or null.
 *
 * `headlineClockTime` covers apps that list the item at a clock time. Instagram lists it
 * relatively ("4m"), so there the tray fell back to the bank's `received_at` - and in
 * several scenes that is not the time the scene's own thread draws the same message at
 * (I02 announced itself at 19:19 and sat in the DM at 07:45). The message is identified by
 * its text: the thread message whose text is the notification's text (the notification may
 * be a truncated preview of it). Only a wall-clock time is taken; a relative one ("12
 * minutes ago") leaves the tray as it was. Presentation only.
 */
export function notifiedClockTime(scene, notificationText) {
  const wanted = comparableText(notificationText)
  if (wanted.length < 12) return null

  let found = null
  const visit = (node) => {
    if (found || !node || typeof node !== 'object') return
    if (
      !Array.isArray(node)
      && typeof node.text === 'string'
      && typeof node.time === 'string'
      && CLOCK_TIME.test(node.time)
      && comparableText(node.text).startsWith(wanted)
    ) {
      found = node.time
      return
    }
    Object.values(node).forEach(visit)
  }
  visit(scene?.beats)
  return found
}

/** Every affordance in the scene, whatever stage or slot it belongs to. For tests. */
export function allAffordances(scene) {
  return STAGE_ORDER.flatMap((stage) =>
    affordancesFor(scene, stage).map((item) => ({ ...item, stage })))
}
