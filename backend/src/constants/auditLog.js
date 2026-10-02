/**
 * The instructor audit vocabulary (ADMIN-005).
 *
 * Specification section 6: "Append-only change log for scenario publication, resets,
 * exports and configuration changes." Those four categories are the whole remit - the
 * audit log records administrative CHANGES, never ordinary reads, and never anything a
 * learner does. The learner's own actions already have an authoritative record: the
 * ScenarioEvent ledger (ENGINE-001).
 *
 * Everything here is a closed vocabulary. An unknown action, resource or metadata key is
 * rejected rather than stored, so the shape of the log cannot drift as future Admin tasks
 * add callers.
 */

export const AUDIT_SCHEMA_VERSION = 1

/* ------------------------------------------------------------------ *
 * Actions
 * ------------------------------------------------------------------ */

/**
 * Deliberately small, and every entry traces to a capability section 6 names:
 *
 *   scenario publication  -> SCENARIO_PUBLISHED, SCENARIO_DEACTIVATED
 *   resets                -> SCENARIO_RESET, ATTEMPT_RESET, PROFILE_ARCHIVED
 *   exports               -> EXPORT_CREATED
 *   configuration changes -> CONFIG_CHANGED
 *
 * `SCENARIO_DEACTIVATED` is the other half of the publication lifecycle the scenario
 * manager owns ("create/edit/clone/deactivate versioned scenarios"), and
 * `PROFILE_ARCHIVED` is the other instructor control listed beside the attempt reset
 * ("archive a profile under local policy"). Nothing speculative was added beyond those.
 *
 * ### Two names for the reset capability, on purpose
 *
 * `SCENARIO_RESET` is the **client-specification compatibility vocabulary** for the
 * section 6 reset capability, kept so the implementation satisfies the required action
 * names exactly.
 *
 * `ATTEMPT_RESET` is the **precise operational action**, and remains the name to use
 * internally: the capability section 6 describes is "Reset an incomplete attempt", so the
 * thing actually reset is an attempt, never a scenario definition.
 *
 * Both are accepted, both are stored verbatim - an entry is never rewritten into the
 * other name - and both map to the same resource type, because they describe the same
 * operation. `RESET_ACTIONS` below groups them for any reader that wants the capability
 * rather than one of its names.
 */
export const AUDIT_ACTIONS = [
  'SCENARIO_PUBLISHED',
  'SCENARIO_DEACTIVATED',
  'SCENARIO_RESET',
  'ATTEMPT_RESET',
  'PROFILE_ARCHIVED',
  'EXPORT_CREATED',
  'CONFIG_CHANGED',
]

/**
 * Every action that records the section 6 reset capability, under either name.
 *
 * A reader looking for "resets" should filter on this rather than on one action, or it
 * will miss half of them.
 */
export const RESET_ACTIONS = ['SCENARIO_RESET', 'ATTEMPT_RESET']

/** The name to prefer when writing a new reset entry. Both remain valid to store. */
export const PREFERRED_RESET_ACTION = 'ATTEMPT_RESET'

/* ------------------------------------------------------------------ *
 * Resources
 * ------------------------------------------------------------------ */

/**
 * One audit collection serves every administrative resource, so a resource is named by
 * type plus a SAFE INTERNAL IDENTIFIER - an ObjectId string, a scenario id such as `W01`,
 * a configuration key. Never a document, never scenario content, never learner text.
 */
export const AUDIT_RESOURCE_TYPES = [
  'scenario_definition',
  'attempt',
  'learner_profile',
  'export',
  'configuration',
]

/**
 * Which resource types each action may name. A mismatch is a programming error.
 *
 * `SCENARIO_RESET` maps to `attempt`, not to `scenario_definition`, despite its name:
 * the capability it records is "Reset an incomplete attempt", so the resource affected is
 * an attempt. Mapping it to a scenario would make the log say something untrue.
 */
export const ACTION_RESOURCE_TYPES = {
  SCENARIO_PUBLISHED: ['scenario_definition'],
  SCENARIO_DEACTIVATED: ['scenario_definition'],
  SCENARIO_RESET: ['attempt'],
  ATTEMPT_RESET: ['attempt'],
  PROFILE_ARCHIVED: ['learner_profile'],
  EXPORT_CREATED: ['export'],
  CONFIG_CHANGED: ['configuration'],
}

/** Whether the administrative action actually took effect. */
export const AUDIT_STATUSES = ['succeeded', 'failed']

/* ------------------------------------------------------------------ *
 * Metadata allowlist
 * ------------------------------------------------------------------ */

/**
 * The ONLY keys an audit entry may carry beyond its own fields.
 *
 * This is an allowlist, not a denylist: a key that is not named here is rejected, so a
 * future caller cannot widen the log by accident. Every entry is a small, stable,
 * non-sensitive fact about the change - a version number, a format, a configuration key.
 */
export const AUDIT_METADATA_ALLOWLIST = [
  // scenario publication
  'scenario_id',
  'scenario_version',
  'scenario_platform',
  'previously_active_version',

  // attempt and profile controls
  'attempt_id',
  'attempt_status',
  'scenarios_discarded',

  // exports
  'export_format',
  'export_scope',
  'export_record_count',
  // ADM-007: the learner a learner-scope export covers. An ObjectId string, never identity.
  'profile_id',

  // configuration
  'config_key',
  'config_previous_value',
  'config_new_value',

  // shared
  'reason_code',
]

/**
 * Key fragments that must never appear, whatever they are called.
 *
 * The allowlist above already excludes them, so this is the second layer: it catches a
 * future edit that adds, say, `config_new_value_token` to the allowlist without thinking.
 */
export const FORBIDDEN_METADATA_FRAGMENTS = [
  'password', 'passwd', 'token', 'secret', 'cookie', 'session',
  'otp', 'pin', 'credential', 'card', 'cvv', 'payment', 'account_number',
  'rationale', 'message', 'transcript', 'content', 'body', 'hash', 'key_material',
]

/**
 * Splits a metadata key into words, so the check below matches meaning rather than
 * letters. Handles snake_case and camelCase alike.
 */
function keyTokens(key) {
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

/**
 * Does this key look like it carries a secret?
 *
 * Matched on WORDS, not on raw substrings. A plain `includes()` rejected
 * `scenarios_discarded` because "discarded" contains "card" - a false positive that
 * would have blocked a perfectly safe key. A single-word fragment must therefore match a
 * whole word; a fragment that already spans words (`account_number`) is matched against
 * the normalised key.
 */
export function looksSensitive(key) {
  const tokens = keyTokens(key)
  const normalised = tokens.join('_')

  return FORBIDDEN_METADATA_FRAGMENTS.some((fragment) =>
    fragment.includes('_') ? normalised.includes(fragment) : tokens.includes(fragment))
}

/** Metadata values are small scalars. A document or an array is content, not a fact. */
export const MAX_METADATA_VALUE_LENGTH = 200

/** A resource id is an identifier, never a payload. */
export const MAX_RESOURCE_ID_LENGTH = 128

/** Safe, stable failure categories. Never a message, never a stack trace. */
export const MAX_ERROR_CODE_LENGTH = 64

/* ------------------------------------------------------------------ *
 * Reading
 * ------------------------------------------------------------------ */

export const AUDIT_PAGE_SIZE_DEFAULT = 50
export const AUDIT_PAGE_SIZE_MAX = 200

/** Stable domain error codes. No message carries administrator input back to the client. */
export const AUDIT_ERRORS = {
  INVALID_AUDIT_ACTOR: 422,
  INVALID_AUDIT_ACTION: 422,
  INVALID_AUDIT_RESOURCE: 422,
  INVALID_AUDIT_STATUS: 422,
  INVALID_AUDIT_METADATA: 422,
  AUDIT_IMMUTABLE: 409,
}
