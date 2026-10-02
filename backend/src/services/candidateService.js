import { PROFILE_ARCHIVED_CODE, PROFILE_ARCHIVED_MESSAGE } from '../constants/instructorControls.js'
import { BRIEFING_VERSION, LAST_SEEN_THROTTLE_MS } from '../constants/learnerProfile.js'
import { Candidate, normaliseIdentifier } from '../models/Candidate.js'
import { ApiError } from '../utils/ApiError.js'

/**
 * Finds the candidate by normalised identifier, or creates them.
 *
 * The normalised service number is the identity. The submitted name is used only to
 * CREATE a profile; an existing profile keeps the name it was registered with (release
 * gate, N1). The login page shows that stored name on its "Existing record found" card so
 * the learner can confirm the record is theirs - a sign-in that wrote the submitted name
 * first would rename someone else's profile before "Not you?" could be answered, and the
 * card would only echo back what was typed.
 */
export async function findOrCreateCandidate({ name, identifier }) {
  // A non-string (a number, an object such as `{ "$ne": null }`) is treated as missing, so a
  // malformed body gets the same 422 as an empty one instead of a TypeError and a 500.
  const trimmedName = typeof name === 'string' ? name.trim() : ''
  const trimmedIdentifier = typeof identifier === 'string' ? identifier.trim() : ''

  if (!trimmedName || !trimmedIdentifier) {
    // Section 2 names the field "Personal / Service Number" and its data contract forbids
    // collecting a phone number. The error code is unchanged - only the wording.
    throw ApiError.unprocessable('MISSING_FIELDS', 'Name and personal / service number are required.')
  }

  const existing = await Candidate.findOne({
    identifierNormalised: normaliseIdentifier(trimmedIdentifier),
  })

  if (!existing) {
    try {
      const candidate = await Candidate.create({
        name: trimmedName,
        identifier: trimmedIdentifier,
        last_seen_at: new Date(),
      })
      return { candidate, created: true }
    } catch (error) {
      /**
       * Two first sign-ins with the same number at once (a repeated Enter, a retried
       * request): both miss the lookup, the unique `identifierNormalised` index lets one
       * insert through, and the other lands here. That learner exists now, so this request
       * is a returning sign-in and continues as one below, instead of failing with a 409.
       */
      if (error?.code !== 11000 || !error?.keyPattern?.identifierNormalised) throw error
      return signInExisting(
        await Candidate.findOne({ identifierNormalised: normaliseIdentifier(trimmedIdentifier) }),
      )
    }
  }

  return signInExisting(existing)
}

/** The returning-learner half of `findOrCreateCandidate`. Never changes the stored name. */
async function signInExisting(existing) {
  /**
   * An archived profile (ADMIN-004) is refused, and signing in NEVER un-archives it.
   *
   * This is the one place archival could have been undone by accident: the login path
   * finds a profile by its normalised service number and would otherwise hand it
   * straight back, quietly reactivating a profile an instructor deliberately retired.
   * There is no unarchive route, so there must be no unarchive side effect either.
   */
  if (existing.archived) {
    throw new ApiError(403, PROFILE_ARCHIVED_CODE, PROFILE_ARCHIVED_MESSAGE)
  }
  /**
   * A successful sign-in is the moment `last_seen_at` exists to record (PROFILE-001). It
   * is the only field written: the name, the service number and every other identity
   * field are left exactly as stored, whatever name was submitted.
   *
   * One targeted `$set` rather than a document save, so nothing else on the profile can
   * ride along. Safe under a repeated or retried sign-in: an overwrite of one timestamp
   * with a later one, so N retries leave exactly the state one attempt would have.
   */
  const now = new Date()
  await Candidate.updateOne({ _id: existing._id }, { $set: { last_seen_at: now } })
  existing.last_seen_at = now

  return { candidate: existing, created: false }
}

/**
 * Refreshes `last_seen_at` on a session read, at most once per throttle window.
 *
 * The guard is in the QUERY, not in JavaScript: the update only matches a document whose
 * `last_seen_at` is already older than the window (or absent), so two concurrent requests
 * cannot both write and a hot-reloading client cannot drive a write per render. One
 * targeted field, no validators, no document load.
 *
 * Returns the value now in force so the caller can answer with it without re-reading.
 */
export async function touchLastSeen(candidate, now = new Date()) {
  const previous = candidate.last_seen_at ?? null
  if (previous && now.getTime() - new Date(previous).getTime() < LAST_SEEN_THROTTLE_MS) {
    return previous
  }

  const cutoff = new Date(now.getTime() - LAST_SEEN_THROTTLE_MS)
  await Candidate.updateOne(
    {
      _id: candidate._id,
      $or: [{ last_seen_at: null }, { last_seen_at: { $exists: false } }, { last_seen_at: { $lte: cutoff } }],
    },
    { $set: { last_seen_at: now } },
  )

  // Kept in step with the document this request is answering from.
  candidate.last_seen_at = now
  return now
}

/**
 * Records that this learner accepted the briefing they were shown (PROFILE-001, section 2).
 *
 * Idempotent by construction: acknowledging the same version twice writes the same version
 * and a later timestamp, and there is no counter to double-count. Acknowledging is the only
 * thing it does - no attempt is created, no history is read and nothing else on the profile
 * is touched.
 *
 * A version the server does not currently require is refused rather than stored, so a stale
 * client cannot satisfy a briefing it never displayed.
 */
export async function acknowledgeBriefing(candidate, version) {
  if (version !== BRIEFING_VERSION) {
    throw ApiError.unprocessable(
      'BRIEFING_VERSION_MISMATCH',
      'That briefing version is not the one currently in force. Reload and read the briefing again.',
    )
  }

  const acknowledgedAt = new Date()
  await Candidate.updateOne(
    { _id: candidate._id },
    { $set: { briefing_version: version, briefing_acknowledged_at: acknowledgedAt } },
  )

  candidate.briefing_version = version
  candidate.briefing_acknowledged_at = acknowledgedAt
  return candidate
}

/**
 * Records that a scenario has been shown to this candidate. Called when a
 * question is served, so an abandoned attempt does not burn the whole pool.
 */
export async function recordScenarioSeen(candidateId, scenarioId) {
  const now = new Date()

  const updated = await Candidate.updateOne(
    { _id: candidateId, 'seenScenarios.scenario': scenarioId },
    { $set: { 'seenScenarios.$.lastSeenAt': now }, $inc: { 'seenScenarios.$.timesSeen': 1 } },
  )

  if (updated.matchedCount === 0) {
    await Candidate.updateOne(
      { _id: candidateId },
      { $push: { seenScenarios: { scenario: scenarioId, lastSeenAt: now, timesSeen: 1 } } },
    )
  }
}
