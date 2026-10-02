import mongoose from 'mongoose'
import { BRIEFING_VERSION } from '../constants/learnerProfile.js'
import { maskServiceNumber } from '../utils/serviceNumber.js'

const { Schema } = mongoose

/** Uppercase, with spaces, hyphens and slashes removed, so "ic-45872 h"
 *  and "IC/45872H" resolve to the same candidate. */
export function normaliseIdentifier(value = '') {
  return value.trim().toUpperCase().replace(/[\s\-/]/g, '')
}

const seenScenarioSchema = new Schema(
  {
    scenario: { type: Schema.Types.ObjectId, ref: 'Scenario', required: true },
    lastSeenAt: { type: Date, required: true },
    timesSeen: { type: Number, default: 1, min: 1 },
  },
  { _id: false },
)

const candidateSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    identifier: { type: String, required: true, trim: true, maxlength: 20 },
    identifierNormalised: { type: String, required: true, unique: true },

    /**
     * Which scenarios this candidate has already been shown. Written when a
     * question is served, not when an assessment completes, so abandoning an
     * attempt does not burn the whole pool.
     *
     * This is a rebuildable cache - the Assessment documents are the audit
     * trail. It is per candidate; one candidate's history never affects
     * another's selection.
     */
    seenScenarios: { type: [seenScenarioSchema], default: [] },

    /**
     * Archival (ADMIN-004). Specification section 6: "archive a profile under local
     * policy."
     *
     * **This is not deletion, and there is no delete.** The profile document, its
     * attempts, its runs, its events and its audit history all stay exactly where they
     * are; what changes is that the profile can no longer be used for normal learner
     * access. An instructor can still inspect everything it did.
     *
     * Three additive fields and no rewrite of the existing rows: `archived` defaults to
     * false, so profiles created before this existed read as active without a backfill.
     * No identity field was added - 15.16 and specification section 2 prohibit phone,
     * email and rank, and none of these comes close to one.
     */
    archived: { type: Boolean, default: false, index: true },
    archived_at: { type: Date, default: null },
    /** The AdminUser who archived it. An id, never the document - that carries a hash. */
    archived_by: { type: Schema.Types.ObjectId, ref: 'AdminUser', default: null },

    /**
     * PROFILE-001 (specification section 2, gap G3). Four additive fields, every one of
     * them defaulting to null, so the profiles that existed before this migration read as
     * valid without a rewrite: Mongoose returns the default for an absent path.
     *
     * 15.16 classed this model as "becomes LearnerProfile" and named exactly these
     * additions - `service_no_masked`, `last_seen_at`, `briefing_version` - alongside
     * "do NOT add phone / email / rank". Nothing here is an identity field. There is still
     * no password, OTP, Aadhaar, personal email, personal phone, rank or unit anywhere on
     * this schema, and PROFILE-001 adds none.
     */

    /**
     * The masked form, STORED rather than only derived.
     *
     * 15.16 lists it as a field and the acceptance matrix marks derive-only as PARTIAL, so
     * it is persisted - but it is recomputed in the hook below on every validate, which is
     * what stops a stored copy drifting from its source.
     *
     * Derived from the NORMALISED number, not from what was typed. "IC-4587 2H" and
     * "IC/45872H" are one profile, so they must show one mask; masking the raw string gave
     * `••••••7 2H` for the first and `••••872H` for the second, which is both unstable and
     * visibly broken. The normalised value is the profile's identity, so it is what the
     * mask describes.
     */
    service_no_masked: { type: String, default: null },

    /**
     * Last successful use of this profile. Null means "not recorded since PROFILE-001
     * introduced the field", which is the honest reading for a pre-existing profile - the
     * information was never captured and cannot be invented from `updatedAt`, which moves
     * for unrelated reasons such as a name correction or an archival.
     */
    last_seen_at: { type: Date, default: null },

    /**
     * The briefing acknowledgement, as section 2 asks: a version and a timestamp.
     *
     * The "versioned boolean" is derived, not stored - `briefing_version === current` is
     * the boolean, and keeping only one of the two in the document means they cannot
     * contradict each other. Null is a learner who has not acknowledged the current
     * briefing, which is the correct starting state for every profile that predates this.
     */
    briefing_version: { type: Number, default: null },
    briefing_acknowledged_at: { type: Date, default: null },
  },
  { timestamps: true },
)

candidateSchema.pre('validate', async function setNormalised() {
  if (this.identifier) {
    this.identifierNormalised = normaliseIdentifier(this.identifier)
    this.service_no_masked = maskServiceNumber(this.identifierNormalised)
  }
})

/**
 * The learner-facing projection: specification section 2's LearnerProfile, minus the parts
 * a learner's own screens must not carry.
 *
 * `profile_id` is deliberately ABSENT. It is a Mongo ObjectId, it is the join key for every
 * attempt, run and event, and no learner screen has ever used it - the login card, the
 * profile chip, the briefing and the dashboard need a name and a masked number and nothing
 * else. The instructor surface publishes `profile_id` through `toProfileSummary`, where the
 * existing API contract already permits it.
 *
 * The raw and normalised service numbers are absent for the same reason they are absent
 * from the admin projection: the masked form is the only one that needs to travel, so a
 * frontend cannot leak a number it was never sent.
 */
candidateSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    display_name: this.name,
    service_no_masked: this.service_no_masked ?? maskServiceNumber(this.identifierNormalised),
    created_at: this.createdAt ?? null,
    last_seen_at: this.last_seen_at ?? null,
    briefing: this.briefingState(),
  }
}

/**
 * Acknowledgement state, resolved against the version the server currently requires.
 *
 * Computed server-side so the comparison lives in one place: the learner UI is told whether
 * an acknowledgement is outstanding, not asked to work it out from two numbers.
 */
candidateSchema.methods.briefingState = function briefingState() {
  const acknowledgedVersion = this.briefing_version ?? null
  return {
    required_version: BRIEFING_VERSION,
    acknowledged_version: acknowledgedVersion,
    acknowledged_at: this.briefing_acknowledged_at ?? null,
    acknowledged: acknowledgedVersion === BRIEFING_VERSION,
  }
}

export const Candidate = mongoose.model('Candidate', candidateSchema)
