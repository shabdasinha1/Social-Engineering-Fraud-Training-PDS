import { SCORING_EVENTS } from './scenarioDefinition.js'

/**
 * The candidate-safe result vocabulary (RESULT-001).
 *
 * Everything a learner may see about a FINISHED attempt is named here. Three boundaries
 * are enforced by this file rather than by the code that uses it:
 *
 * 1. **No event code reaches the learner.** `PATH_LABELS` maps the engine's scoring
 *    vocabulary onto neutral action labels, so the path replay can say what the learner
 *    did without publishing the scoring table that says what it was worth.
 * 2. **No point value reaches the learner** beyond the per-scenario 0-10 the engine
 *    already committed and the 0-100 total. The deltas stay server-side.
 * 3. **Classification is released in aggregate only.** Family and trigger labels appear
 *    in the behaviour breakdown for the ten scenarios the learner just completed, never
 *    against an individual scenario and never for the other ninety.
 */

/* ------------------------------------------------------------------ *
 * Action path (specification section 7, "compact timeline")
 * ------------------------------------------------------------------ */

/**
 * Engine event code -> `{ stage, action }`, the ONLY shape a path step may take.
 *
 * An unmapped code is dropped rather than passed through: a code added later is invisible
 * to the learner until someone deliberately gives it a label here.
 */
export const PATH_LABELS = {
  // notify
  NOTIFY_SEEN: { stage: 'notify', action: 'opened_notification' },
  notification_dismissed: { stage: 'notify', action: 'dismissed_notification' },

  // open
  ITEM_OPEN: { stage: 'open', action: 'read_the_item' },
  PREMATURE_REPLY: { stage: 'open', action: 'acted_before_reading' },

  // inspect
  INSPECT_CONTEXT: { stage: 'inspect', action: 'inspected_the_details' },
  STAGE_SKIPPED: { stage: 'inspect', action: 'skipped_inspection' },

  // branch
  SAFE_PIVOT: { stage: 'branch', action: 'declined_the_request' },
  CORRECT_USE: { stage: 'branch', action: 'used_the_official_path' },
  NEEDLESS_REJECT_IGNORE: { stage: 'branch', action: 'abandoned_without_checking' },
  RISKY_OPEN_REPLY: { stage: 'branch', action: 'engaged_with_the_item' },
  UNSAFE_EXTERNAL_ACTION: { stage: 'branch', action: 'took_an_external_action' },
  SECRET_PAYMENT_INSTALL_DATA_RELEASE: { stage: 'branch', action: 'released_details_or_paid' },

  // verify
  TRUSTED_VERIFY: { stage: 'verify', action: 'verified_independently' },
  VERIFY_THROUGH_MESSAGE: { stage: 'verify', action: 'used_contact_from_the_message' },
  REPORT_ONLY_WITHOUT_CHECK: { stage: 'verify', action: 'reported_without_checking' },
  FALSE_REPORT_BLOCK: { stage: 'verify', action: 'reported_or_blocked' },

  // resolve
  RESOLVE_CORRECT: { stage: 'resolve', action: 'resolved_as_required' },
  CONTRADICTORY_UNSAFE_FINAL: { stage: 'resolve', action: 'final_action_conflicted' },
  RUN_ABANDONED: { stage: 'resolve', action: 'abandoned_the_scenario' },

  /**
   * IMMERSIVE-001. Without a label here the code would be silently dropped - this map's
   * documented behaviour for anything unmapped - and the learner would see a timeline that
   * simply stops with no explanation of why.
   */
  RUN_EXPIRED: { stage: 'resolve', action: 'time_ran_out' },

  /** ENHANCEMENT-003: the Demo User skipped this scenario. Neutral - says nothing about it. */
  RUN_DEMO_SKIPPED: { stage: 'resolve', action: 'skipped_in_demonstration' },
}

/**
 * The actions that count as constructive at each stage, for the action-stage breakdown.
 * Derived from the labels above so the two can never drift apart.
 */
export const CONSTRUCTIVE_ACTIONS = {
  inspect: ['inspected_the_details'],
  branch: ['declined_the_request', 'used_the_official_path'],
  verify: ['verified_independently'],
  resolve: ['resolved_as_required'],
}

/** The stages the breakdown reports on. Notify and open carry no judgement. */
export const GRADED_STAGES = Object.keys(CONSTRUCTIVE_ACTIONS)

/**
 * The critical unsafe actions from the release checklist. A scenario that ends correctly
 * but passed through one of these is still not "handled safely".
 */
export const CRITICAL_EVENT_CODES = Object.entries(SCORING_EVENTS)
  .filter(([, rule]) => rule.critical)
  .map(([code]) => code)

/* ------------------------------------------------------------------ *
 * Outcome classes (specification section 7, "distinguish missed threat
 * from false positive")
 * ------------------------------------------------------------------ */

export const OUTCOME_CLASSES = {
  /** Right final action, and nothing critical along the way. */
  HANDLED_SAFELY: 'handled_safely',
  /** A malicious item that was not stopped, or was engaged with unsafely. */
  MISSED_THREAT: 'missed_threat',
  /** A legitimate item rejected, reported, blocked or abandoned. */
  FALSE_POSITIVE: 'false_positive',
  /** A legitimate item kept, but reached through a critical unsafe action. */
  UNSAFE_HANDLING: 'unsafe_handling',

  /**
   * IMMERSIVE-001: the 90-minute limit closed this scenario before the learner resolved it.
   *
   * A fifth class is necessary, not cosmetic. Without it the existing logic would read an
   * unresolved LEGITIMATE scenario as a `false_positive` - a claim that the learner
   * wrongly reported something they never touched. Section 7 requires the breakdown to
   * "distinguish missed threat from false positive"; an honest fifth bucket for "no
   * decision was taken" strengthens that distinction rather than blurring it, and it is
   * what C2's "do not fabricate a decision" requires the projection to say.
   */
  NOT_RESOLVED: 'not_resolved',
}

export const OUTCOME_CLASS_VALUES = Object.values(OUTCOME_CLASSES)

/**
 * ENHANCEMENT-003: a scenario the Demo User skipped. LEARNER RESULT ONLY, and deliberately
 * NOT a member of `OUTCOME_CLASSES` - the instructor dashboard builds its buckets from that
 * object, and a demo feature must not add a key to it. `classifyOutcome()`, which the
 * instructor screens share, reports a skipped run as `not_resolved` (no decision recorded);
 * only the learner's own result projection relabels it `skipped`.
 */
export const DEMO_SKIPPED_OUTCOME_CLASS = 'demo_skipped'

/* ------------------------------------------------------------------ *
 * Display labels
 * ------------------------------------------------------------------ */

/**
 * Human labels for the canonical families, used only in the aggregate breakdown.
 *
 * These are presentation strings for the result surface. The taxonomy artefacts in
 * `data/taxonomy/` hold the slugs and the authority; nothing here changes a
 * classification, and a family absent from this map falls back to its slug.
 */
export const FAMILY_LABELS = {
  operational_elicitation: 'Elicitation of operational detail',
  financial_credential_phishing: 'Financial credential phishing',
  payment_diversion: 'Payment diversion',
  account_takeover_authorisation_abuse: 'Account takeover and authorisation abuse',
  tech_support_and_callback_fraud: 'Tech-support and callback fraud',
  credential_phishing: 'Credential phishing',
  identity_data_harvesting: 'Identity and personal-data harvesting',
  qr_code_phishing: 'QR-code phishing',
  investment_and_task_fraud: 'Investment and task fraud',
  malware_delivery: 'Malicious file or app delivery',
  unsolicited_payment_lure: 'Unsolicited payment lure',
  coercion_and_extortion: 'Coercion and extortion',
  impersonation_emergency_payment: 'Impersonated emergency request',
  relationship_grooming_fraud: 'Relationship grooming',
  disinformation_amplification: 'Disinformation amplification',

  legit_system_confirmation: 'Genuine system confirmation',
  legit_coordination_request: 'Genuine coordination request',
  legit_routine_broadcast: 'Genuine routine broadcast',
  legit_verified_high_risk_change: 'Genuine verified high-risk change',
}

/** Human labels for the canonical triggers. Same rules as `FAMILY_LABELS`. */
export const TRIGGER_LABELS = {
  authority: 'Authority',
  urgency: 'Urgency',
  routine: 'Routine expectation',
  fear: 'Fear',
  greed: 'Reward',
  curiosity: 'Curiosity',
  empathy: 'Empathy',
  familiarity: 'Familiarity',
  scarcity: 'Scarcity',
  trust: 'Established trust',
  convenience: 'Convenience',
  isolation_secrecy: 'Secrecy',
  pride: 'Pride',
  flattery: 'Flattery',
  helpfulness: 'Helpfulness',
  reciprocity: 'Reciprocity',
  duty_compliance: 'Duty and compliance',
  social_proof: 'Social proof',
  commitment: 'Commitment',
  shame_embarrassment: 'Embarrassment',
  expert_status: 'Expert status',
  confusion: 'Confusion',
}

export const PLATFORM_LABELS = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  email: 'Email',
  sms: 'SMS',
}

/* ------------------------------------------------------------------ *
 * Comparison and remediation
 * ------------------------------------------------------------------ */

/**
 * Section 7: "Compare current and previous attempts only when mode/content version are
 * comparable." These are the fields that must match on both attempts.
 */
export const COMPARABILITY_FIELDS = [
  'mode',
  'content_version',
  'taxonomy_version',
  'trigger_taxonomy_version',
]

/** Why a comparison could not be offered. Stable codes; no learner data. */
export const COMPARISON_UNAVAILABLE = {
  NO_PREVIOUS_ATTEMPT: 'no_previous_attempt',
  NOT_COMPARABLE: 'not_comparable',
}

/** Section 7: "Recommend 2-3 targeted practice scenarios from weak families." */
export const REMEDIATION_MAX = 3
export const REMEDIATION_MIN = 2

/**
 * A family is only worth recommending if the learner actually lost ground in it.
 * Full marks in a family means there is nothing to practise.
 */
export const REMEDIATION_SCORE_THRESHOLD = 1.0

/** Stable, blame-free reasons. Never a trait, never a diagnosis. */
export const REMEDIATION_REASONS = {
  MISSED_THREAT: 'A threat in this area was not stopped.',
  FALSE_POSITIVE: 'A genuine item in this area was rejected.',
  PARTIAL: 'Marks were lost in this area.',
}
