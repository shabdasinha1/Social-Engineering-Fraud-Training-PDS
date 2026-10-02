/**
 * The neutral learner action contract (SECURITY-001).
 *
 * A learner's browser never sees, holds or sends a canonical engine intent. It sends an
 * ACTION CODE: an opaque token the server issued for one control on one run. The server
 * translates the code back to the canonical intent and hands that to the unchanged engine.
 *
 *   visible control  ->  neutral control id  ->  per-run action code  ->  (server)  intent
 *
 * See docs/NEUTRAL_LEARNER_ACTION_CONTRACT.md.
 */

/** Bumping this invalidates every code already issued; a client simply reloads the run. */
export const ACTION_CODE_VERSION = 1

/**
 * `ac_` plus 20 lowercase hex characters (80 bits of an HMAC). The prefix only says "this
 * is an action code"; nothing in the token encodes a stage, an intent, a disposition or a
 * position.
 */
export const ACTION_CODE_PATTERN = /^ac_[0-9a-f]{20}$/
export const ACTION_CODE_HEX_LENGTH = 20

/**
 * Neutral control ids. A scene control is `<scenario>-cNN` (`w01-c07`); a control on the
 * generic action sheet is `gen-cNN`. Both are positions, never descriptions.
 */
export const SCENE_CONTROL_ID_PATTERN = /^[weis]\d{2}-c\d{2}$/
export const GENERIC_CONTROL_ID_PATTERN = /^gen-c\d{2}$/

/**
 * The verification source the ledger records for a verify intent.
 *
 * Before SECURITY-001 the client sent this as `verify_source` metadata, and the value was
 * a second copy of the intent (`in_message_contact` on exactly the controls that submit
 * `verify_in_message_contact`). It is now derived here, so the ledger keeps recording it
 * and the client no longer carries it.
 */
export const VERIFY_SOURCE_BY_INTENT = {
  verify_trusted_directory: 'trusted_directory',
  verify_known_app: 'known_app',
  verify_known_number: 'known_number',
  verify_in_message_contact: 'in_message_contact',
}

/**
 * Which inert panel the device opens once an action has been accepted.
 *
 * Before SECURITY-001 the page chose the panel from the intent name it had just sent. It
 * now receives this neutral view key in the accepted response instead. It describes what
 * the learner is about to see, and is only ever sent after the action is committed.
 */
export const VIEW_BY_INTENT = {
  inspect_sender: 'sender',
  inspect_profile: 'profile',
  inspect_link: 'link',
  preview_file: 'file',
  inspect_qr: 'qr',
  verify_trusted_directory: 'directory',
}

/**
 * The only metadata keys a client may send. Everything else the ledger's metadata can hold
 * (`intent`, `transition`, `consequence`, `resolution_code`, `premature`, `verify_source`)
 * is written by the server; a client that sends one is refused rather than ignored.
 */
export const CLIENT_METADATA_KEYS = ['dwell_ms', 'open_latency_ms', 'link_hover_ms']

/**
 * Engine error codes whose messages can name the canonical intent. On the learner routes
 * their message is replaced with a neutral one; the code and status are kept.
 */
export const NEUTRALISED_ENGINE_ERRORS = ['INVALID_INTENT', 'INVALID_TRANSITION', 'INVALID_SCENARIO_STATE']
