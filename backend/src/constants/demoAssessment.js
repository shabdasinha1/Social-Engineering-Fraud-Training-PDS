/**
 * The fixed demonstration assessment (ENHANCEMENT-003).
 *
 * Served ONLY to the Demo User (`config/demo.js`). Every normal learner still gets the
 * SELECT-002 solver in `scenarioSelectionService`, which this file does not touch and which
 * knows nothing about it.
 *
 * ### The ten, in presentation order
 *
 * Ten existing ScenarioDefinitions from the authoritative 100-scenario bank, referenced by
 * id. None is duplicated, copied or edited; `selectDemoScenarios()` refuses to build an
 * attempt if any id is missing or inactive, or if the bank's own dispositions no longer
 * give DEMO_DISPOSITION_QUOTA (7 malicious and 3 legitimate) - the split below is asserted
 * against the bank, not trusted from this comment.
 *
 * The order is the client's (5 Oct 2026) and is presentation order exactly as listed.
 *
 *   #   id    platform   level   disposition  family
 *   1   W14   WhatsApp   medium  malicious    malware delivery (military)
 *   2   E08   Email      easy    malicious    financial credential phishing
 *   3   W03   WhatsApp   easy    legitimate   coordination request (military)
 *   4   S06   SMS        easy    malicious    identity data harvesting (military)
 *   5   I17   Instagram  medium  malicious    coercion and extortion
 *   6   S15   SMS        medium  malicious    QR code phishing (military)
 *   7   I07   Instagram  easy    legitimate   routine broadcast
 *   8   W12   WhatsApp   medium  malicious    coercion and extortion
 *   9   E07   Email      easy    legitimate   coordination request (military)
 *  10   E01   Email      easy    malicious    credential phishing
 *
 *   platforms   WhatsApp 3, Email 3, Instagram 2, SMS 2
 *   difficulty  easy 6, medium 4
 *   military    5
 *
 * Changing the set: edit this list and DEMO_DISPOSITION_QUOTA together. Keep it at 10
 * unique ids whose bank dispositions match the quota; the service and its tests enforce it.
 */
export const DEMO_SCENARIO_SEQUENCE = Object.freeze([
  'W14', 'E08', 'W03', 'S06', 'I17', 'S15', 'I07', 'W12', 'E07', 'E01',
])

/** Required split, checked against the bank's own `disposition` at attempt creation. */
export const DEMO_DISPOSITION_QUOTA = Object.freeze({ malicious: 7, legitimate: 3 })

/**
 * Written to `Attempt.selection.selection_algorithm_version`. This is how a DEMO ATTEMPT is
 * recognised server-side: the selection metadata already records how each sequence was
 * built, it is frozen at creation by the model's pre-save hook, and it is never sent to a
 * learner. Deliberately not the `mode` - demo attempts stay `assessment` attempts so they
 * remain visible to the instructor exactly like any other.
 */
export const DEMO_SELECTION_VERSION = 'demo-fixed-1.0.0'

/** The stored seed. Nothing is random in a demo attempt; this documents that. */
export const DEMO_SEED = 'demo-fixed-sequence'

/* ------------------------------------------------------------------ *
 * Demo skip
 * ------------------------------------------------------------------ */

/**
 * Ledger event written when the Demo User skips a scenario. Engine telemetry, 0 points,
 * listed in `ENGINE_TELEMETRY_CODES` beside `RUN_EXPIRED`, whose treatment it copies.
 * No learner intent produces it; only the dedicated demo endpoint can write it.
 */
export const DEMO_SKIP_EVENT_CODE = 'RUN_DEMO_SKIPPED'

/**
 * `outcome_code` on a skipped run. Like `resolve_expired`, deliberately NOT a resolve
 * intent and absent from `CORRECT_RESOLUTION`, so nothing can read it as a right or wrong
 * final action.
 */
export const DEMO_SKIPPED_OUTCOME_CODE = 'resolve_demo_skipped'

/** The only body field the skip endpoint accepts. Anything else is refused. */
export const DEMO_SKIP_BODY_FIELDS = Object.freeze(['expected_stage'])
