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
 * give 6 malicious and 4 legitimate - the split below is asserted against the bank, not
 * trusted from this comment.
 *
 *   #   id    platform   level   disposition  family / what it demonstrates
 *   1   W01   WhatsApp   easy    malicious    account takeover - forwarded login code (OTP)
 *   2   E01   Email      easy    malicious    credential phishing - password-expiry link and form
 *   3   S16   SMS        medium  legitimate   system confirmation - a login code the learner asked for
 *   4   I04   Instagram  easy    malicious    impersonation - cloned friend asks for money
 *   5   E21   Email      hard    legitimate   verified high-risk change - vendor bank change, verified
 *   6   W24   WhatsApp   hard    malicious    tech-support fraud - remote screen share
 *   7   E14   Email      medium  malicious    QR phishing - QR in a revised movement order (military)
 *   8   I11   Instagram  medium  legitimate   routine broadcast - official welfare helpline (military)
 *   9   S25   SMS        hard    malicious    malware delivery - FASTag "update" APK install
 *  10   W16   WhatsApp   medium  legitimate   coordination request - verified vehicle-pool change (military)
 *
 *   platforms   WhatsApp 3, Email 3, Instagram 2, SMS 2 (the 3/3/2/2 shape normal attempts use)
 *   difficulty  easy 3, medium 4, hard 3 (the normal 3/4/3 target)
 *   families    six different malicious families and all four legitimate families
 *   military    3 (inside the normal 2-4 range)
 *
 * The order interleaves platforms (never more than two in a row) and spreads the four
 * legitimate items through the set, and it pairs deliberately: S16 (a login code the
 * learner requested) follows W01 (a login code someone else wants), and E21 (a verified
 * bank change) precedes the payment and QR lures.
 *
 * Changing the set: edit this list. Keep it at 10 unique ids, 6 malicious + 4 legitimate by
 * the bank's own disposition; the service and its tests enforce both.
 */
export const DEMO_SCENARIO_SEQUENCE = Object.freeze([
  'W01', 'E01', 'S16', 'I04', 'E21', 'W24', 'E14', 'I11', 'S25', 'W16',
])

/** Required split, checked against the bank's own `disposition` at attempt creation. */
export const DEMO_DISPOSITION_QUOTA = Object.freeze({ malicious: 6, legitimate: 4 })

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
