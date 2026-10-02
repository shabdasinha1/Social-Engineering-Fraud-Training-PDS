import 'dotenv/config'

/**
 * The Demo User identity (ENHANCEMENT-003, MOM of 24 September 2026).
 *
 * THIS IS THE ONLY PLACE THE TWO VALUES LIVE. Nothing else in the codebase names them:
 * every check goes through `isDemoCandidate()` in `services/demoSelectionService.js`, which
 * reads this object. To change the Demo User, change the two defaults below - or, without
 * touching code, set DEMO_DISPLAY_NAME / DEMO_SERVICE_NUMBER in `backend/.env`.
 *
 * ### How the Demo User is identified
 *
 * Server-side, by the profile's NORMALISED service number - the same key
 * `Candidate.identifierNormalised` is unique on, so there can only ever be one demo
 * profile. The browser never sends, and cannot send, a demo flag: the check reads the
 * profile the signed session cookie resolved, never a request field.
 *
 * The display name is NOT part of the identity, for the same reason it is not part of any
 * learner's identity here: only the service number identifies a profile, and the name is
 * the one it was first registered with (a later sign-in never changes it). It is recorded
 * so the value the client supplied is documented next to the number and can be shown to
 * the presenter; nothing authorises on it.
 *
 * ### Persistence
 *
 * No seed script and no fixture. The demo profile is created the first time someone signs
 * in on the normal Login page with the configured service number - by the existing
 * `findOrCreateCandidate()`, exactly like any learner - and reused afterwards.
 *
 * ### Disabling
 *
 * Set DEMO_SERVICE_NUMBER to an empty value in `.env` and no profile is ever a demo
 * profile: the fixed demo assessment and the skip endpoint are both unreachable.
 */
export const demoConfig = Object.freeze({
  /** DEMO_DISPLAY_NAME - supplied by the client. */
  displayName: process.env.DEMO_DISPLAY_NAME ?? 'demo user',

  /** DEMO_SERVICE_NUMBER - supplied by the client. Compared in normalised form. */
  serviceNumber: process.env.DEMO_SERVICE_NUMBER ?? '1223334444',
})
