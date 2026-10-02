/**
 * Runtime vocabulary for the server-authoritative six-stage engine (ENGINE-001).
 *
 * Authority: the client specification v1.0 sections 4 and 5, and PROJECT_MASTER_PLAN.md
 * 15.23 / 15.24 / 15.25.
 *
 * Three vocabularies are kept strictly separate, because conflating them is how a browser
 * ends up choosing its own score:
 *
 *   LEARNER INTENT   what the client asks to do          -> INTENTS
 *   EVENT CODE       what the server decides happened    -> scoring + telemetry codes
 *   POINTS           what that is worth                  -> ScenarioDefinition, never here
 *
 * This file defines the vocabulary and the legal shape of a transition. It never defines
 * what a specific scenario is worth: point values come from the imported
 * ScenarioDefinition, which is client content.
 */

import { SCORING_EVENT_CODES, STAGE_KEYS } from './scenarioDefinition.js'

export const RUN_STATUSES = ['active', 'resolved', 'abandoned']

/** Only an active run accepts intents. An abandoned run is reactivated on resume. */
export const RESUMABLE_STATUSES = ['active', 'abandoned']

/**
 * Engine telemetry codes.
 *
 * Section 4 defines two legal transitions for which it supplies no event code of its own:
 * the inspect stage's "skip -> 4" edge, and the resolve stage's "abandon -> resumable"
 * edge. Both must still produce a ledger entry, because no stage may advance without one.
 *
 * They are engine telemetry, never scoring: both carry 0 points and neither appears in the
 * client's scoring vocabulary. Kept in their own list so they can never be mistaken for
 * client-defined scoring codes.
 *
 * `RUN_EXPIRED` (IMMERSIVE-001) joins them for the same reason. It is written by the
 * expiry service when the 90-minute limit closes a run the learner never resolved. It
 * carries 0 points, so replaying the ledger yields the same score with or without it - the
 * learner is neither credited nor penalised for running out of time, only stopped. There
 * is no INTENT that produces it: no client request can cause one to be written.
 *
 * `RUN_DEMO_SKIPPED` (ENHANCEMENT-003) is the same shape for the same reason: 0 points, no
 * intent, written only by the Demo User's dedicated skip endpoint. Its value is duplicated
 * from `DEMO_SKIP_EVENT_CODE` in constants/demoAssessment.js, and a test pins the two equal.
 */
export const ENGINE_TELEMETRY_CODES = ['STAGE_SKIPPED', 'RUN_ABANDONED', 'RUN_EXPIRED', 'RUN_DEMO_SKIPPED']

/** Everything an Event may record: client scoring codes, client core events, engine telemetry. */
export const EVENT_CODES = [
  ...SCORING_EVENT_CODES,
  'notification_seen',
  'notification_dismissed',
  'item_opened',
  'sender_inspected',
  'profile_viewed',
  'file_previewed',
  'link_opened',
  'reply_sent',
  'data_submitted',
  'payment_attempted',
  'install_attempted',
  'verify_started',
  'verify_source',
  'report_selected',
  'block_selected',
  'resolution_code',
  ...ENGINE_TELEMETRY_CODES,
]

/* ------------------------------------------------------------------ *
 * Learner intents
 * ------------------------------------------------------------------ */

export const INTENTS = [
  // notify
  'open_item', 'dismiss',
  // open
  'read',
  // inspect
  'inspect_sender', 'inspect_profile', 'inspect_link', 'preview_file', 'inspect_qr',
  'read_thread', 'skip_inspection',
  // branch - safe
  'safe_pivot', 'reject_ignore',
  // branch - risky
  'open_link', 'open_file', 'scan_qr', 'reply', 'call_number',
  'submit_data', 'attempt_payment', 'attempt_install', 'approve_device_link',
  'share_secret', 'share_location',
  // verify
  'verify_trusted_directory', 'verify_known_app', 'verify_known_number',
  'verify_in_message_contact', 'report', 'block',
  // resolve
  'resolve_report', 'resolve_block', 'resolve_continue', 'resolve_retain', 'resolve_ignore',
  'abandon',
]

/**
 * Intent -> candidate event codes, per stage.
 *
 * `codes` is an ORDERED preference list. The engine picks the first code the scenario's
 * own stage scoring actually declares. That is what makes one intent resolve differently
 * on a malicious versus a legitimate scenario without the engine hard-coding either:
 *
 *   BRANCH + `safe_pivot`  -> SAFE_PIVOT   on a malicious scenario
 *                          -> CORRECT_USE  on a legitimate one
 *
 * If a scenario declares none of an intent's codes at that stage, the intent is not legal
 * for that scenario and is rejected. The scenario data gates the engine, not the reverse.
 *
 * `telemetry: true` marks a code that is not in the client scoring vocabulary; it always
 * scores 0 and does not need to appear in the scenario's scoring list.
 */
export const STAGE_INTENTS = {
  notify: {
    open_item: { codes: ['NOTIFY_SEEN'], next: 'open' },
    dismiss: { codes: ['notification_dismissed'], telemetry: true, next: 'notify' },
  },
  open: {
    read: { codes: ['ITEM_OPEN'], next: 'inspect' },
    // Section 4: "premature action -> 4". Acting before reading context.
    reply: { codes: ['PREMATURE_REPLY'], next: 'branch', premature: true },
    open_link: { codes: ['PREMATURE_REPLY'], next: 'branch', premature: true },
    submit_data: { codes: ['PREMATURE_REPLY'], next: 'branch', premature: true },
    attempt_payment: { codes: ['PREMATURE_REPLY'], next: 'branch', premature: true },
    attempt_install: { codes: ['PREMATURE_REPLY'], next: 'branch', premature: true },
    call_number: { codes: ['PREMATURE_REPLY'], next: 'branch', premature: true },
  },
  inspect: {
    inspect_sender: { codes: ['INSPECT_CONTEXT'], next: 'branch' },
    inspect_profile: { codes: ['INSPECT_CONTEXT'], next: 'branch' },
    inspect_link: { codes: ['INSPECT_CONTEXT'], next: 'branch' },
    preview_file: { codes: ['INSPECT_CONTEXT'], next: 'branch' },
    inspect_qr: { codes: ['INSPECT_CONTEXT'], next: 'branch' },
    read_thread: { codes: ['INSPECT_CONTEXT'], next: 'branch' },
    skip_inspection: { codes: ['STAGE_SKIPPED'], telemetry: true, next: 'branch' },
  },
  branch: {
    safe_pivot: { codes: ['SAFE_PIVOT', 'CORRECT_USE'], next: 'verify' },
    reject_ignore: { codes: ['NEEDLESS_REJECT_IGNORE'], next: 'verify' },

    open_link: { codes: ['RISKY_OPEN_REPLY', 'UNSAFE_EXTERNAL_ACTION'], next: 'verify', consequence: 'simulated_browser_open' },
    open_file: { codes: ['RISKY_OPEN_REPLY', 'UNSAFE_EXTERNAL_ACTION'], next: 'verify', consequence: 'simulated_file_preview' },
    scan_qr: { codes: ['RISKY_OPEN_REPLY', 'UNSAFE_EXTERNAL_ACTION'], next: 'verify', consequence: 'simulated_qr_inspect' },
    reply: { codes: ['RISKY_OPEN_REPLY', 'UNSAFE_EXTERNAL_ACTION'], next: 'verify', consequence: 'simulated_reply_sent' },
    call_number: { codes: ['RISKY_OPEN_REPLY', 'UNSAFE_EXTERNAL_ACTION'], next: 'verify', consequence: 'simulated_call' },

    submit_data: { codes: ['SECRET_PAYMENT_INSTALL_DATA_RELEASE', 'UNSAFE_EXTERNAL_ACTION'], next: 'verify', consequence: 'simulated_data_submission' },
    attempt_payment: { codes: ['SECRET_PAYMENT_INSTALL_DATA_RELEASE', 'UNSAFE_EXTERNAL_ACTION'], next: 'verify', consequence: 'simulated_payment' },
    attempt_install: { codes: ['SECRET_PAYMENT_INSTALL_DATA_RELEASE', 'UNSAFE_EXTERNAL_ACTION'], next: 'verify', consequence: 'simulated_install' },
    approve_device_link: { codes: ['SECRET_PAYMENT_INSTALL_DATA_RELEASE', 'UNSAFE_EXTERNAL_ACTION'], next: 'verify', consequence: 'simulated_device_link' },
    share_secret: { codes: ['SECRET_PAYMENT_INSTALL_DATA_RELEASE', 'UNSAFE_EXTERNAL_ACTION'], next: 'verify', consequence: 'simulated_data_submission' },
    share_location: { codes: ['SECRET_PAYMENT_INSTALL_DATA_RELEASE', 'UNSAFE_EXTERNAL_ACTION'], next: 'verify', consequence: 'simulated_data_submission' },
  },
  verify: {
    verify_trusted_directory: { codes: ['TRUSTED_VERIFY'], next: 'resolve' },
    verify_known_app: { codes: ['TRUSTED_VERIFY'], next: 'resolve' },
    verify_known_number: { codes: ['TRUSTED_VERIFY'], next: 'resolve' },
    // Section 4: contact data inside the suspect message is never a trusted source.
    verify_in_message_contact: { codes: ['VERIFY_THROUGH_MESSAGE'], next: 'resolve' },
    // On a legitimate item this is a false report; on a malicious one it is
    // report-without-checking. The scenario's own scoring list decides which.
    report: { codes: ['FALSE_REPORT_BLOCK', 'REPORT_ONLY_WITHOUT_CHECK'], next: 'resolve' },
    block: { codes: ['FALSE_REPORT_BLOCK', 'REPORT_ONLY_WITHOUT_CHECK'], next: 'resolve' },
  },
  resolve: {
    // Section 5, RESOLVE_CORRECT: "Report/block/retain/continue as the verified
    // disposition requires." The client states the rule; `resolutionMatches` applies it.
    resolve_report: { codes: ['RESOLVE_CORRECT', 'CONTRADICTORY_UNSAFE_FINAL'], next: 'end', resolution: true },
    resolve_block: { codes: ['RESOLVE_CORRECT', 'CONTRADICTORY_UNSAFE_FINAL'], next: 'end', resolution: true },
    resolve_continue: { codes: ['RESOLVE_CORRECT', 'CONTRADICTORY_UNSAFE_FINAL'], next: 'end', resolution: true },
    resolve_retain: { codes: ['RESOLVE_CORRECT', 'CONTRADICTORY_UNSAFE_FINAL'], next: 'end', resolution: true },
    resolve_ignore: { codes: ['CONTRADICTORY_UNSAFE_FINAL'], next: 'end', resolution: true },
    abandon: { codes: ['RUN_ABANDONED'], telemetry: true, next: 'resolve', abandon: true },
  },
}

/**
 * Which final action the verified disposition requires (specification section 5).
 * A malicious item must end reported or blocked; a legitimate one must be kept.
 */
export const CORRECT_RESOLUTION = {
  malicious: ['resolve_report', 'resolve_block'],
  legitimate: ['resolve_continue', 'resolve_retain'],
}

/** Every local consequence is a rendering instruction. Nothing here executes anything. */
export const LOCAL_CONSEQUENCES = [
  'simulated_browser_open',
  'simulated_file_preview',
  'simulated_qr_inspect',
  'simulated_reply_sent',
  'simulated_call',
  'simulated_data_submission',
  'simulated_payment',
  'simulated_install',
  'simulated_device_link',
]

/** The resolve-stage intents that end a run. Used by the API to scope its resolve route. */
export const RESOLVE_INTENTS = Object.keys(STAGE_INTENTS.resolve).filter((i) => i !== 'abandon')

/** Section 4: "Optional 250-character one-line explanation in selected scenarios." */
export const RATIONALE_MAX_LENGTH = 250

/** The only metadata keys an Event may carry. Anything else is rejected. */
export const METADATA_ALLOWLIST = [
  'intent',
  'transition',
  'consequence',
  'resolution_code',
  'dwell_ms',
  'open_latency_ms',
  'link_hover_ms',
  'verify_source',
  'premature',
]

/** Stable domain error codes. No error message ever carries evaluation content. */
export const ENGINE_ERRORS = {
  RUN_NOT_FOUND: 404,
  RUN_NOT_ACTIVE: 409,
  INVALID_INTENT: 422,
  INVALID_TRANSITION: 409,
  STALE_STATE: 409,
  DUPLICATE_INTENT: 200,
  INVALID_TARGET: 422,
  INVALID_RATIONALE: 422,
  INVALID_METADATA: 422,
  TRANSACTION_UNAVAILABLE: 503,
  SCENARIO_DEFINITION_NOT_FOUND: 404,
  SCENARIO_DEFINITION_INACTIVE: 409,
  INVALID_SCENARIO_STATE: 500,
}

export { STAGE_KEYS }
