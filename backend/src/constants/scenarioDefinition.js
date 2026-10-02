/**
 * Vocabularies for the ScenarioDefinition pipeline (DATA-001).
 *
 * Authority: `Interactive_Social_Engineering_Scenario_UI_Development_Specification.pdf`
 * v1.0, 02 September 2026, plus the decisions recorded in PROJECT_MASTER_PLAN.md
 * sections 15.23 (attack families), 15.24 (triggers) and 15.25 (persistence).
 *
 * Separate from `constants/assessment.js` on purpose. That file describes the legacy
 * 40-scenario quiz pipeline, which stays live and untouched until the new pipeline
 * replaces it. Mixing the two vocabularies in one file is how a legacy value ends up
 * silently accepted by the new model.
 */

/** Bump when the SHAPE of a stored document changes. Importers refuse unknown values. */
export const SCENARIO_SCHEMA_VERSION = 1

/* ------------------------------------------------------------------ *
 * Identity and classification - client-specified values
 * ------------------------------------------------------------------ */

export const PLATFORMS = ['whatsapp', 'instagram', 'email', 'sms']

/** Client IDs are W01-W25, I01-I25, E01-E25, S01-S25. */
export const SCENARIO_ID_PATTERN = /^[WIES](0[1-9]|1[0-9]|2[0-5])$/

/** The ID prefix and the platform must agree; enforced in the model. */
export const SCENARIO_ID_PREFIX_PLATFORM = {
  W: 'whatsapp',
  I: 'instagram',
  E: 'email',
  S: 'sms',
}

export const LEVELS = ['easy', 'medium', 'hard']

export const DISPOSITIONS = ['malicious', 'legitimate']

/* ------------------------------------------------------------------ *
 * Canonical taxonomies - OUR implementation metadata, not client content
 *
 * The client's raw `family` and `trigger` strings are stored verbatim beside
 * these and are never overwritten. See PROJECT_MASTER_PLAN.md 15.23 / 15.24 and
 * docs/ATTACK_FAMILY_TAXONOMY.md / docs/TRIGGER_TAXONOMY.md.
 * ------------------------------------------------------------------ */

export const TAXONOMY_VERSION = '1.0.0'
export const TRIGGER_TAXONOMY_VERSION = '1.0.0'

/** 15 mechanisms behind the 80 malicious scenarios. */
export const MALICIOUS_FAMILIES = [
  'operational_elicitation',
  'financial_credential_phishing',
  'payment_diversion',
  'account_takeover_authorisation_abuse',
  'tech_support_and_callback_fraud',
  'credential_phishing',
  'identity_data_harvesting',
  'qr_code_phishing',
  'investment_and_task_fraud',
  'malware_delivery',
  'unsolicited_payment_lure',
  'coercion_and_extortion',
  'impersonation_emergency_payment',
  'relationship_grooming_fraud',
  'disinformation_amplification',
]

/** 4 patterns behind the 20 legitimate controls. */
export const LEGITIMATE_FAMILIES = [
  'legit_system_confirmation',
  'legit_coordination_request',
  'legit_routine_broadcast',
  'legit_verified_high_risk_change',
]

export const CANONICAL_FAMILIES = [...MALICIOUS_FAMILIES, ...LEGITIMATE_FAMILIES]

/**
 * 22 canonical psychological levers, folded from the 31 raw primitives in the bank.
 *
 * These are IDs, not phrases. `expert_status` and `social_proof` are single values -
 * a raw trigger is split on '+' and never on whitespace, so the multi-word primitives
 * ("expert status", "social proof", "social validation", "time pressure") survive
 * decomposition intact.
 */
export const CANONICAL_TRIGGERS = [
  'authority',
  'urgency',
  'routine',
  'fear',
  'greed',
  'curiosity',
  'empathy',
  'familiarity',
  'scarcity',
  'trust',
  'convenience',
  'isolation_secrecy',
  'pride',
  'flattery',
  'helpfulness',
  'reciprocity',
  'duty_compliance',
  'social_proof',
  'commitment',
  'shame_embarrassment',
  'expert_status',
  'confusion',
]

/** Composition delimiter inside the client's raw trigger string. Never whitespace. */
export const TRIGGER_COMPOSITION_DELIMITER = '+'

/**
 * The only suffix the client uses after '|' in the raw trigger field. It marks
 * military context; it is not a trigger. 35 of the 100 scenarios carry it.
 */
export const MILITARY_CONTEXT_MARKER = 'FICTIONAL MILITARY CONTEXT'

/* ------------------------------------------------------------------ *
 * The canonical six-stage state machine (specification section 4)
 * ------------------------------------------------------------------ */

/**
 * Ordered and closed. The scenario bank labels stage 1 "Event" on its content pages
 * while section 4 names the state "Notify"; `notify` is used here because section 4
 * defines the state machine. The client's own stage text is stored verbatim in
 * `evaluation.stages[].learner_flow`, so nothing is lost by the rename.
 */
export const STAGE_KEYS = ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve']

export const STAGE_COUNT = STAGE_KEYS.length

/**
 * Every transition section 4 permits, per stage. A scenario declares a SUBSET of
 * these; anything outside the set is a validation error.
 *
 * Deliberately not a free-form graph. A generic edge list would let a scenario
 * invent a path the specification does not allow, and the runtime would have no
 * way to tell that from a legitimate authoring choice.
 *
 * `self` = remain in the current stage. `end` = leave the scenario.
 */
export const STAGE_TRANSITIONS = {
  notify: [
    { on: 'open_item', to: 'open' },
    { on: 'dismiss', to: 'self' },
  ],
  open: [
    { on: 'read', to: 'inspect' },
    { on: 'premature_action', to: 'branch' },
  ],
  inspect: [
    { on: 'inspect', to: 'branch' },
    { on: 'skip', to: 'branch' },
  ],
  branch: [
    { on: 'safe_action', to: 'verify' },
    { on: 'risky_action', to: 'verify' },
  ],
  verify: [
    { on: 'trusted_check', to: 'resolve' },
    { on: 'report_or_block', to: 'resolve' },
    { on: 'in_message_check', to: 'branch' },
    { on: 'in_message_check', to: 'resolve' },
  ],
  resolve: [
    { on: 'complete', to: 'end' },
    { on: 'abandon', to: 'end' },
  ],
}

/** Flat allowlist of transition triggers, for the sub-schema enum. */
export const TRANSITION_TRIGGERS = [
  ...new Set(Object.values(STAGE_TRANSITIONS).flatMap((t) => t.map((x) => x.on))),
]

/** Valid `to` targets: any stage key plus the two pseudo-targets. */
export const TRANSITION_TARGETS = [...STAGE_KEYS, 'self', 'end']

/**
 * Interaction telemetry the ledger may record per stage - section 4 "Core events".
 * This is the metadata allowlist referenced by the privacy acceptance criterion;
 * an event code outside it must never be written.
 */
export const STAGE_EVENTS = {
  notify: ['notification_seen', 'notification_dismissed', 'open_latency_ms'],
  open: ['item_opened', 'dwell_ms', 'premature_reply'],
  inspect: ['sender_inspected', 'link_hover_ms', 'profile_viewed', 'file_previewed'],
  branch: [
    'link_opened',
    'reply_sent',
    'data_submitted',
    'payment_attempted',
    'install_attempted',
  ],
  verify: ['verify_started', 'verify_source', 'report_selected', 'block_selected'],
  resolve: ['resolution_code', 'rationale', 'scenario_points', 'duration_ms'],
}

export const ALL_STAGE_EVENTS = [...new Set(Object.values(STAGE_EVENTS).flat())]

/* ------------------------------------------------------------------ *
 * Scoring vocabulary (specification section 5, plus the codes used
 * consistently across all 100 scenario pages)
 * ------------------------------------------------------------------ */

/**
 * Stable event codes and their canonical point deltas.
 *
 * The nine codes in the section 5 table are marked `spec_table: true`. The other
 * seven appear on every scenario page but not in that table - see
 * PROJECT_MASTER_PLAN.md 15.10. They are authoritative client content either way.
 *
 * `critical` marks the actions the release checklist calls "critical unsafe actions",
 * which the scoring engine must cover with explicit tests.
 */
export const SCORING_EVENTS = {
  NOTIFY_SEEN: { points: 0, spec_table: false, critical: false },
  ITEM_OPEN: { points: 0, spec_table: false, critical: false },
  INSPECT_CONTEXT: { points: 2, spec_table: true, critical: false },
  SAFE_PIVOT: { points: 3, spec_table: true, critical: false },
  CORRECT_USE: { points: 3, spec_table: true, critical: false },
  TRUSTED_VERIFY: { points: 3, spec_table: true, critical: false },
  RESOLVE_CORRECT: { points: 2, spec_table: true, critical: false },
  REPORT_ONLY_WITHOUT_CHECK: { points: 1, spec_table: false, critical: false },
  VERIFY_THROUGH_MESSAGE: { points: 0, spec_table: false, critical: false },
  PREMATURE_REPLY: { points: -1, spec_table: true, critical: false },
  NEEDLESS_REJECT_IGNORE: { points: -2, spec_table: true, critical: false },
  RISKY_OPEN_REPLY: { points: -3, spec_table: true, critical: true },
  FALSE_REPORT_BLOCK: { points: -4, spec_table: true, critical: false },
  UNSAFE_EXTERNAL_ACTION: { points: -4, spec_table: false, critical: true },
  CONTRADICTORY_UNSAFE_FINAL: { points: -4, spec_table: false, critical: true },
  SECRET_PAYMENT_INSTALL_DATA_RELEASE: { points: -8, spec_table: true, critical: true },
}

export const SCORING_EVENT_CODES = Object.keys(SCORING_EVENTS)

/** Section 5: "Clamp each scenario to 0-10, then sum 10 scenarios for a 0-100 attempt score." */
export const SCENARIO_POINTS = { min: 0, max: 10 }

/**
 * The safe path sums to exactly 10:
 *   INSPECT_CONTEXT +2, SAFE_PIVOT/CORRECT_USE +3, TRUSTED_VERIFY +3, RESOLVE_CORRECT +2.
 * The clamp is therefore a floor guard on the safe path, not a ceiling guard.
 */
export const SAFE_PATH_CODES = [
  'INSPECT_CONTEXT',
  'SAFE_PIVOT',
  'CORRECT_USE',
  'TRUSTED_VERIFY',
  'RESOLVE_CORRECT',
]

/* ------------------------------------------------------------------ *
 * Learner action vocabulary (specification section 4 shared components)
 * ------------------------------------------------------------------ */

/** Action sheet: "Reply, Forward, Delete, Mark safe, Verify, Report, Block/Restrict". */
export const ACTION_SHEET_ACTIONS = [
  'reply',
  'forward',
  'delete',
  'mark_safe',
  'verify',
  'report',
  'block',
  'restrict',
]

/** Call / voice screen: "Decline, Accept, End, Verify, Report". */
export const CALL_ACTIONS = ['call_decline', 'call_accept', 'call_end', 'call_verify', 'call_report']

/** Risk-bearing interactions the branch stage exposes. All local and inert. */
export const BRANCH_ACTIONS = [
  'open_link',
  'open_file',
  'scan_qr',
  'submit_data',
  'attempt_payment',
  'attempt_install',
  'approve_device_link',
  'share_location',
  'share_secret',
]

/** Inspection affordances the inspect stage exposes. */
export const INSPECT_ACTIONS = [
  'inspect_sender',
  'inspect_profile',
  'inspect_link',
  'preview_file',
  'inspect_qr',
  'read_thread',
]

/** Verification routes. `verify_trusted_directory` is the only independent one. */
export const VERIFY_ACTIONS = [
  'verify_trusted_directory',
  'verify_known_app',
  'verify_known_number',
  'verify_in_message_contact',
]

/** Terminal choices at resolve. */
export const RESOLVE_ACTIONS = [
  'resolve_report',
  'resolve_block',
  'resolve_continue',
  'resolve_retain',
  'resolve_ignore',
  'resolve_abandon',
]

export const LEARNER_ACTIONS = [
  ...new Set([
    ...ACTION_SHEET_ACTIONS,
    ...CALL_ACTIONS,
    ...BRANCH_ACTIONS,
    ...INSPECT_ACTIONS,
    ...VERIFY_ACTIONS,
    ...RESOLVE_ACTIONS,
  ]),
]

/* ------------------------------------------------------------------ *
 * Synthetic assets (specification sections 1 and 4)
 * ------------------------------------------------------------------ */

/**
 * Every asset is generated, inert and local. Section 4 forbids executing files,
 * extracting macros, mounting archives, calling host handlers, and using the camera
 * or host clipboard; section 1 puts everything behind a deny-by-default network
 * boundary.
 */
export const ASSET_KINDS = [
  // DATA-003: the dashboard toast/notification shown at the notify stage. Additive - the
  // only schema change that task required.
  'notification',
  'message_thread',
  'sender_profile',
  'link',
  'file',
  'qr_payload',
  'browser_page',
  'call_screen',
  'trusted_directory_entry',
  'payment_screen',
  'install_screen',
  'image',
]

/**
 * Reserved hostnames a synthetic link or browser page may use. Section 4:
 * "Render reserved .example or training.local pages".
 *
 * Enforced as a shape rule here; the importer additionally checks that no asset
 * references anything outside this set - see docs/SCENARIO_DEFINITION_SCHEMA.md.
 */
export const RESERVED_HOST_PATTERN = /(^|\.)(example|example\.(com|net|org)|invalid|test|localhost|training\.local)$/i

/** Quality gate values from Appendix A. */
export const PILOT_STATUSES = ['not_started', 'in_review', 'piloted', 'approved']
