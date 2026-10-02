/**
 * The simulation vocabulary the candidate surface is allowed to know (UI-001).
 *
 * Three rules govern this file, and every entry below obeys them:
 *
 * 1. The frontend names a CONTROL, never what it means. It never holds an engine intent,
 *    an event code, a point value or a stage transition - the server decides all of them
 *    (ENGINE-001, SECURITY-001).
 * 2. No label may say, imply or style an action as safe or unsafe. A control that
 *    announced its own correctness would turn the simulation into a quiz.
 * 3. Which controls appear is derived from the scenario's own synthetic assets
 *    (DATA-003), never from classification the candidate must not see.
 */

/** The six stages, in order, exactly as the engine names them. */
export const STAGE_KEYS = ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve']

/**
 * What the learner is being asked to do at each stage. Deliberately procedural:
 * nothing here hints at what the right answer is for the scenario on screen.
 *
 * `short` is the one-word name for the stage strip, where "New activity" would truncate.
 */
export const STAGE_META = {
  notify: {
    label: 'New activity',
    short: 'Notify',
    step: 1,
    instruction: 'Something has arrived. Open it, or dismiss the alert.',
  },
  open: {
    label: 'Open',
    short: 'Open',
    step: 2,
    instruction: 'Read what arrived before you decide anything.',
  },
  inspect: {
    label: 'Inspect',
    short: 'Inspect',
    step: 3,
    instruction: 'Examine the details you can check, or move on without checking.',
  },
  branch: {
    label: 'Decide',
    short: 'Decide',
    step: 4,
    instruction: 'Choose what to do about it.',
  },
  verify: {
    label: 'Verify',
    short: 'Verify',
    step: 5,
    instruction: 'Choose where to check this, or how to escalate it.',
  },
  resolve: {
    label: 'Resolve',
    short: 'Resolve',
    step: 6,
    instruction: 'Choose your final action for this item.',
  },
}

/**
 * What the panel says on a scenario whose interaction lives on the device
 * (IMMERSIVE-003A).
 *
 * `STAGE_META.instruction` describes a list of options, because for the ninety-five
 * scenarios without an authored scene that is exactly what the panel holds. On the five
 * that have one, the options are on the phone, and the panel points at it instead. Both
 * sets are procedural: neither says what the right answer is.
 */
export const DEVICE_INSTRUCTION = {
  notify: 'Use the phone to open or dismiss the notification.',
  open: 'The item is waiting in the app on the phone. Open it there to read it.',
  inspect: 'Look at whatever you can check on the phone - the sender, the group, a link '
    + 'or the conversation itself.',
  branch: 'Act on the message using the phone, the way you would on your own.',
  verify: 'Use the phone to check this somewhere, or to escalate it.',
  resolve: 'Finish with this item on the phone.',
}

/** Synthetic asset kinds this build renders. Mirrors DATA-003. */
export const ASSET_KIND = {
  NOTIFICATION: 'notification',
  SENDER: 'sender_profile',
  THREAD: 'message_thread',
  DIRECTORY: 'trusted_directory_entry',
  BROWSER: 'browser_page',
  FILE: 'file',
  QR: 'qr_payload',
  CALL: 'call_screen',
  PAYMENT: 'payment_screen',
  INSTALL: 'install_screen',
}

/**
 * Engine consequence kind -> the local surface that renders it.
 *
 * A consequence is a rendering instruction, never an execution: the engine says what the
 * learner would have seen, and this table says which inert panel shows it.
 */
export const CONSEQUENCE_SURFACE = {
  simulated_browser_open: ASSET_KIND.BROWSER,
  simulated_file_preview: ASSET_KIND.FILE,
  simulated_qr_inspect: ASSET_KIND.QR,
  simulated_call: ASSET_KIND.CALL,
  simulated_payment: ASSET_KIND.PAYMENT,
  simulated_install: ASSET_KIND.INSTALL,
  simulated_reply_sent: null,
  simulated_data_submission: null,
  simulated_device_link: null,
}

/** Plain-language summary of a committed consequence. Never says whether it was wise. */
export const CONSEQUENCE_TEXT = {
  simulated_browser_open: 'The link opened in the simulated browser on the phone.',
  simulated_file_preview: 'The attachment opened in the inert file viewer on the phone.',
  simulated_qr_inspect: 'The code was decoded on the phone. Its target is shown there.',
  simulated_call: 'The simulated call screen opened on the phone.',
  simulated_payment: 'The simulated payment screen opened on the phone.',
  simulated_install: 'The simulated install prompt opened on the phone.',
  simulated_reply_sent: 'Your reply was recorded in this simulation. Nothing was sent.',
  simulated_data_submission:
    'The details were recorded in this simulation. Nothing left this device.',
  simulated_device_link: 'The device-link request was recorded in this simulation.',
}

/* ------------------------------------------------------------------ *
 * Action catalogue
 * ------------------------------------------------------------------ */

/**
 * `asset` means the control appears only when the scenario supplies that asset kind,
 * and the asset's id is sent as `synthetic_target_id` so the ledger records what was
 * acted on. `platform` narrows a control to one app. Everything else is always offered.
 *
 * Nothing here is ordered by risk, and no entry carries a variant, colour or icon that
 * separates one group from another - see `ActionSheet`.
 *
 * SECURITY-001. Each control is named by a neutral `id` (`gen-cNN`, a position in this
 * table) and by nothing else. What it submits is known only to the server
 * (`backend/data/learner-actions/v1/generic.json`), which issues an opaque per-run action
 * code for each id with `/current-run`. This table must never carry an engine intent or a
 * verification source again; `sceneModel.test.js` fails if it does.
 */
const ACTIONS = {
  notify: [
    { id: 'gen-c01', label: 'Open it', primary: true },
    { id: 'gen-c02', label: 'Dismiss the alert' },
  ],

  open: [
    { id: 'gen-c03', label: 'Read the message', primary: true },
    { id: 'gen-c04', label: 'Reply now' },
    { id: 'gen-c05', label: 'Open the link', asset: ASSET_KIND.BROWSER },
    { id: 'gen-c06', label: 'Enter the details it asks for', asset: ASSET_KIND.BROWSER },
    { id: 'gen-c07', label: 'Pay now', asset: ASSET_KIND.PAYMENT },
    { id: 'gen-c08', label: 'Install the app', asset: ASSET_KIND.INSTALL },
    { id: 'gen-c09', label: 'Call the number', asset: ASSET_KIND.CALL },
  ],

  inspect: [
    { id: 'gen-c10', label: 'Check the sender details', asset: ASSET_KIND.SENDER },
    {
      id: 'gen-c11',
      label: 'View the full profile',
      platform: 'instagram',
      asset: ASSET_KIND.SENDER,
    },
    { id: 'gen-c12', label: 'Examine the link', asset: ASSET_KIND.BROWSER },
    { id: 'gen-c13', label: 'Preview the attachment', asset: ASSET_KIND.FILE },
    { id: 'gen-c14', label: 'Examine the QR code', asset: ASSET_KIND.QR },
    { id: 'gen-c15', label: 'Re-read the whole thread', asset: ASSET_KIND.THREAD },
    { id: 'gen-c16', label: 'Decide without checking anything' },
  ],

  branch: [
    { id: 'gen-c17', label: 'Decline, and use an official channel instead' },
    { id: 'gen-c18', label: 'Reply to the sender' },
    { id: 'gen-c19', label: 'Send them the details they asked for' },
    { id: 'gen-c20', label: 'Open the link', asset: ASSET_KIND.BROWSER },
    { id: 'gen-c21', label: 'Enter the details on that page', asset: ASSET_KIND.BROWSER },
    { id: 'gen-c22', label: 'Open the attachment', asset: ASSET_KIND.FILE },
    { id: 'gen-c23', label: 'Scan the QR code', asset: ASSET_KIND.QR },
    { id: 'gen-c24', label: 'Call the number given', asset: ASSET_KIND.CALL },
    { id: 'gen-c25', label: 'Make the payment', asset: ASSET_KIND.PAYMENT },
    { id: 'gen-c26', label: 'Install the app', asset: ASSET_KIND.INSTALL },
  ],

  verify: [
    { id: 'gen-c27', label: 'Check the trusted directory', asset: ASSET_KIND.DIRECTORY },
    { id: 'gen-c28', label: 'Use a number I already hold' },
    { id: 'gen-c29', label: 'Check inside the official app' },
    { id: 'gen-c30', label: 'Use the contact details in the message' },
    { id: 'gen-c31', label: 'Report it' },
    { id: 'gen-c32', label: 'Block the sender' },
  ],

  resolve: [
    { id: 'gen-c33', label: 'Report it and close' },
    { id: 'gen-c34', label: 'Block the sender and close' },
    { id: 'gen-c35', label: 'Carry on with the request' },
    { id: 'gen-c36', label: 'Keep it, no further action' },
    { id: 'gen-c37', label: 'Ignore it and move on' },
  ],
}

/**
 * The notification's own two controls. The home screen's toast and badged tile draw them
 * outside the action sheet, so the page needs to find them by id.
 */
export const NOTIFY_OPEN_ID = 'gen-c01'
export const NOTIFY_DISMISS_ID = 'gen-c02'

/**
 * The generic sheet deliberately offers no "reject or ignore" control at the branch stage.
 *
 * The engine accepts that choice only on the twenty legitimate scenarios - the eighty
 * malicious ones do not score it at the branch stage, so it is refused there. Offering it
 * on every scenario would let a learner discover the disposition from whether the button
 * worked: a reliable oracle for the one fact this surface must never reveal.
 *
 * "Ignore it and move on" is offered at the resolve stage instead, where it is accepted on
 * all one hundred and the same behaviour is still scored.
 */

/**
 * The controls for a stage, given the scenario the learner is actually looking at.
 * Asset-gated entries carry the matching asset's id so the event names its target.
 */
export function actionsFor(stage, scenario) {
  const assets = scenario?.synthetic?.assets ?? []
  const platform = scenario?.platform

  return (ACTIONS[stage] ?? []).flatMap((action) => {
    if (action.platform && action.platform !== platform) return []
    if (!action.asset) return [{ ...action, targetId: null }]

    const asset = assets.find((item) => item.kind === action.asset)
    return asset ? [{ ...action, targetId: asset.asset_id }] : []
  })
}

/** Every asset of a kind the scenario supplies. */
export function assetsOfKind(scenario, kind) {
  return (scenario?.synthetic?.assets ?? []).filter((asset) => asset.kind === kind)
}

/** The first asset of a kind, or null. */
export function assetOfKind(scenario, kind) {
  return assetsOfKind(scenario, kind)[0] ?? null
}

/** Rationale is a single line; the engine caps it at 250 characters. */
export const RATIONALE_MAX_LENGTH = 250

/** Toast tray depth from the client specification. */
export const MAX_TOASTS = 3
