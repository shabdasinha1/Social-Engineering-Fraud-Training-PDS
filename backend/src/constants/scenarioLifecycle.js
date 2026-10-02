/**
 * The scenario authoring lifecycle (ADMIN-001).
 *
 * Specification section 6: "Scenario manager: create/edit/clone/deactivate versioned
 * scenarios; validate all six stages and synthetic asset references before publishing."
 *
 * DATA-001 already made `(scenario_id, version)` unique and `active` explicit, and the
 * importer already refuses to activate a second version of one scenario. This file adds
 * only what authoring needs on top of that: the three states a version can be in, and the
 * closed list of fields an administrator is allowed to author.
 */

/* ------------------------------------------------------------------ *
 * States
 * ------------------------------------------------------------------ */

/**
 * `draft`     never published. The only state that may be edited in place.
 * `published` currently active. Immutable: an edit produces the next version.
 * `retired`   was published, now inactive. Preserved, never editable, still
 *             resolvable by any ScenarioRun pinned to it.
 */
export const LIFECYCLE_STATES = ['draft', 'published', 'retired']

/**
 * How a version's state is decided for the 100 scenarios imported before this field
 * existed. They are all `active: true`, so they are published; nothing needs migrating,
 * and every version the manager touches is written with an explicit state.
 */
export function lifecycleOf(definition) {
  if (definition?.lifecycle_state) return definition.lifecycle_state
  return definition?.active ? 'published' : 'draft'
}

/** Only a draft may be rewritten. A published or retired version is history. */
export const EDITABLE_IN_PLACE = ['draft']

/* ------------------------------------------------------------------ *
 * Authoring surface
 * ------------------------------------------------------------------ */

/**
 * The ONLY fields an administrator may send.
 *
 * An allowlist, not a denylist: a field added to the schema later is not authorable until
 * someone deliberately names it here. Everything absent - `_id`, `version`, `active`,
 * `lifecycle_state`, `published_at`, `schema_version`, `createdAt`, `updatedAt` - is
 * server-controlled and rejected rather than ignored, so a client attempting to steer the
 * lifecycle finds out immediately.
 */
export const AUTHORABLE_FIELDS = [
  'platform',
  'level',
  'disposition',
  'family',
  'canonical_family',
  'trigger',
  'canonical_triggers',
  'military_flag',
  'legitimate_control',
  'synthetic',
  'stages',
  'scoring',
  'quality',
  'owner',
  'review_date',
  'evaluation',
]

/** `scenario_id` may be set when a scenario is created, and never afterwards. */
export const CREATE_ONLY_FIELDS = ['scenario_id']

/**
 * Named explicitly so the rejection can say which field was the problem. These are the
 * ones a client is most likely to try, and each would let it forge lifecycle or identity.
 */
export const SERVER_CONTROLLED_FIELDS = [
  '_id', 'id', 'version', 'active', 'lifecycle_state', 'published_at',
  'schema_version', 'createdAt', 'updatedAt', '__v',
]

/* ------------------------------------------------------------------ *
 * Listing
 * ------------------------------------------------------------------ */

export const SCENARIO_PAGE_SIZE_DEFAULT = 25
export const SCENARIO_PAGE_SIZE_MAX = 100

/** Bounded, allowlisted filters. No client-supplied Mongo operator ever reaches a query. */
export const SCENARIO_LIST_FILTERS = [
  'scenario_id', 'platform', 'level', 'disposition', 'canonical_family',
  'lifecycle', 'active', 'military_flag',
]

/** Deterministic sorts only. `_id` is appended as a tiebreak so paging is stable. */
export const SCENARIO_SORTS = {
  scenario_id: { scenario_id: 1, version: -1 },
  updated: { updatedAt: -1 },
  platform: { platform: 1, scenario_id: 1, version: -1 },
}
export const SCENARIO_SORT_DEFAULT = 'scenario_id'

/* ------------------------------------------------------------------ *
 * Errors
 * ------------------------------------------------------------------ */

/** Stable domain codes. No message carries scenario content or administrator input back. */
export const SCENARIO_MANAGER_ERRORS = {
  SCENARIO_NOT_FOUND: 404,
  SCENARIO_EXISTS: 409,
  SCENARIO_NOT_DRAFT: 409,
  SCENARIO_NOT_PUBLISHED: 409,
  SCENARIO_ALREADY_PUBLISHED: 409,
  SCENARIO_VALIDATION_FAILED: 422,
  FORBIDDEN_FIELD: 422,
  UNSAFE_CONTENT: 422,
}

/** The failure categories the audit log may record. Stable, and never a message. */
export const PUBLISH_FAILURE_CODES = {
  VALIDATION: 'SCENARIO_VALIDATION_FAILED',
  UNSAFE_CONTENT: 'SCENARIO_UNSAFE_CONTENT',
  LIFECYCLE: 'SCENARIO_LIFECYCLE_CONFLICT',
}
