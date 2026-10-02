import mongoose from 'mongoose'
import { SCENARIO_ID_PATTERN } from '../constants/scenarioDefinition.js'
import { ATTEMPT_END_REASONS } from '../constants/attemptTiming.js'
import {
  ATTEMPT_MODES,
  ATTEMPT_SCENARIO_COUNT,
  ATTEMPT_STATUSES,
} from '../constants/scenarioSelection.js'
import { TAXONOMY_VERSION, TRIGGER_TAXONOMY_VERSION } from '../constants/scenarioDefinition.js'

const { Schema } = mongoose

/**
 * Attempt - the client contract's Attempt entity (specification section 6):
 * attempt_id, profile_id, seed, mode, started_at, completed_at, status, total_score,
 * version.
 *
 * Separate from the legacy `Assessment` model, which stays live and untouched for the
 * existing 40-scenario journey. `_id` is the attempt_id.
 *
 * THE SEQUENCE IS FROZEN. `scenario_sequence` is written once, at creation, and is
 * immutable afterwards: no learner behaviour, later history change, refresh or reconnect
 * may alter it. A pre-save hook enforces that.
 */

const sequenceItemSchema = new Schema(
  {
    ordinal: { type: Number, required: true, min: 1, max: ATTEMPT_SCENARIO_COUNT },
    scenario_id: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: [SCENARIO_ID_PATTERN, 'scenario_id must look like W01, I25, E07 or S14'],
    },
    /** The exact content version pinned at selection time. */
    definition_version: { type: Number, required: true, min: 1 },
  },
  { _id: false },
)

/**
 * Everything needed to reproduce and audit the selection. Deliberately excludes anything
 * that would let a reader infer answers: no per-scenario family, trigger or difficulty,
 * only aggregate counts.
 */
const selectionSchema = new Schema(
  {
    selection_algorithm_version: { type: String, required: true },
    attempt_index: { type: Number, required: true, min: 0 },
    platform_quota: { type: Map, of: Number, required: true },
    composition: { type: Schema.Types.Mixed, required: true },
    recent_exclusion: { type: Schema.Types.Mixed, required: true },
    relaxations: { type: [String], default: [] },
  },
  { _id: false },
)

const attemptSchema = new Schema(
  {
    /**
     * The learner. References `Candidate`, which 15.16 keeps as the LearnerProfile of
     * record; the rename is conceptual, so the reference stays valid.
     */
    profile_id: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },

    /** Stored so the selection can be replayed exactly. Never client-supplied. */
    seed: { type: String, required: true },

    mode: { type: String, enum: ATTEMPT_MODES, required: true, default: 'assessment' },
    status: { type: String, enum: ATTEMPT_STATUSES, required: true, default: 'in_progress' },

    /** The frozen, ordered sequence. Immutable after creation. */
    scenario_sequence: {
      type: [sequenceItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length === ATTEMPT_SCENARIO_COUNT,
        message: `an attempt must hold exactly ${ATTEMPT_SCENARIO_COUNT} scenarios`,
      },
    },

    selection: { type: selectionSchema, required: true },

    /** Content and taxonomy versions this attempt was built against - the §7 comparability gate. */
    content_version: { type: Number, required: true, min: 1 },
    taxonomy_version: { type: String, required: true, default: TAXONOMY_VERSION },
    trigger_taxonomy_version: { type: String, required: true, default: TRIGGER_TAXONOMY_VERSION },

    /** Written by the scoring engine (SCORE-002/003), not here. */
    total_score: { type: Number, default: null, min: 0, max: 100 },

    started_at: { type: Date, required: true, default: Date.now },
    completed_at: { type: Date, default: null },

    /* ---------------------------------------------------------------- *
     * IMMERSIVE-001 - the 90-minute limit. ADDITIVE, and null-safe.
     *
     * All five default to null, so every attempt that existed before this task keeps
     * behaving exactly as it did: `expires_at: null` means NO DEADLINE, and every guard
     * and the sweeper query both require a non-null value. Nothing was backfilled and
     * nothing historical was reinterpreted.
     * ---------------------------------------------------------------- */

    /**
     * The time ALLOWED for this attempt, pinned at creation.
     *
     * NOT `duration_ms` - that name is already taken across the viewer, the exports and
     * the result projection for the time the learner TOOK. See constants/attemptTiming.js.
     *
     * Pinned per attempt rather than read from configuration at expiry time, so that
     * changing the limit later can never retroactively lengthen or shorten an assessment
     * that is already running.
     */
    time_limit_ms: { type: Number, default: null, min: 1 },

    /**
     * The authoritative deadline: `started_at + time_limit_ms`, computed server-side.
     *
     * Stored rather than derived on read for two reasons: the sweeper needs an indexable
     * query, and a deadline that is written down once is auditable in a way a recomputed
     * one is not.
     */
    expires_at: { type: Date, default: null },

    /** Why the attempt stopped. Null while in progress. Written once, with `status`. */
    end_reason: { type: String, enum: [...ATTEMPT_END_REASONS, null], default: null },

    /**
     * When expiry actually committed. At or after `expires_at`, never before - the gap is
     * the enforcement latency, and recording both is what makes it measurable.
     */
    expired_at: { type: Date, default: null },

    /** How many runs were still unresolved when the deadline was enforced. */
    unresolved_at_expiry: { type: Number, default: null, min: 0, max: ATTEMPT_SCENARIO_COUNT },
  },
  { timestamps: true },
)

attemptSchema.index({ profile_id: 1, status: 1 })
attemptSchema.index({ profile_id: 1, started_at: -1 })
/**
 * ADMIN-002: the instructor attempt list is ordered newest-started first across ALL
 * learners, with `_id` as the tie-break that makes paging stable. The two indexes above
 * both lead with `profile_id`, so neither serves an unfiltered instructor page.
 *
 * Additive only - no field, no default and no existing index changed.
 */
attemptSchema.index({ started_at: -1, _id: -1 })

/**
 * IMMERSIVE-001: the expiry sweeper's only query -
 * `{ status: 'in_progress', expires_at: { $ne: null, $lte: now } }`.
 *
 * Additive; no existing index changed. Without it the sweeper would collection-scan every
 * 30 seconds, which is the one thing a background job on a single offline machine must
 * not do.
 */
attemptSchema.index({ status: 1, expires_at: 1 })

attemptSchema.pre('validate', function validateAttempt() {
  const ordinals = this.scenario_sequence?.map((i) => i.ordinal) ?? []
  const expected = Array.from({ length: ATTEMPT_SCENARIO_COUNT }, (_, i) => i + 1)
  if (JSON.stringify([...ordinals].sort((a, b) => a - b)) !== JSON.stringify(expected)) {
    this.invalidate('scenario_sequence', 'ordinals must be exactly 1..10 with no gaps or repeats')
  }
  const ids = this.scenario_sequence?.map((i) => i.scenario_id) ?? []
  if (new Set(ids).size !== ids.length) {
    this.invalidate('scenario_sequence', 'a scenario may not appear twice in one attempt')
  }
  if (this.status === 'completed' && !this.completed_at) {
    this.invalidate('completed_at', 'a completed attempt must carry completed_at')
  }

  /* --- IMMERSIVE-001 timer invariants ------------------------------- */

  /**
   * The deadline and the limit are one fact stored two ways, so they must agree. A pair
   * that disagreed would let the sweeper and a human reading the record reach different
   * conclusions about when the assessment should have ended.
   */
  const hasLimit = this.time_limit_ms !== null && this.time_limit_ms !== undefined
  const hasExpiry = this.expires_at !== null && this.expires_at !== undefined

  if (hasLimit !== hasExpiry) {
    this.invalidate('expires_at',
      'time_limit_ms and expires_at must be set together, or both left null')
  }

  /**
   * The arithmetic is asserted AT CREATION ONLY, and the division of labour matters.
   *
   *   isNew  -> the deadline must be exactly `started_at + time_limit_ms`.
   *   !isNew -> the deadline may not change AT ALL (the freeze hook below).
   *
   * Re-checking the arithmetic on every subsequent save would add no protection - the
   * freeze hook already forbids moving either value - while breaking any legitimate later
   * write to an unrelated field on an attempt whose deadline was set by some other path.
   * That is not hypothetical: it broke the expiry service's own commit, and the timer
   * tests caught it.
   */
  if (this.isNew && hasLimit && hasExpiry && this.started_at) {
    const expected = this.started_at.getTime() + this.time_limit_ms
    if (this.expires_at.getTime() !== expected) {
      this.invalidate('expires_at',
        'expires_at must equal started_at + time_limit_ms')
    }
  }

  // Expiry metadata may exist only on an attempt that actually expired.
  if (this.end_reason === 'expired') {
    if (!this.expired_at) {
      this.invalidate('expired_at', 'an expired attempt must carry expired_at')
    }
    if (this.status !== 'completed') {
      this.invalidate('end_reason',
        'an expired attempt is finalised as completed - it still produces a real result')
    }
  } else {
    if (this.expired_at) {
      this.invalidate('expired_at', 'only an expired attempt may carry expired_at')
    }
    if (this.unresolved_at_expiry !== null && this.unresolved_at_expiry !== undefined) {
      this.invalidate('unresolved_at_expiry',
        'only an expired attempt may carry unresolved_at_expiry')
    }
  }

  // A terminal attempt should say why it ended; an in-progress one must not.
  if (this.status === 'in_progress' && this.end_reason) {
    this.invalidate('end_reason', 'an attempt still in progress has not ended')
  }
})

/**
 * The frozen sequence and its seed may never be rewritten after creation.
 *
 * Written without a `next` callback: Mongoose 9 middleware is promise-based and calls the
 * hook with no arguments, so a `next`-style hook throws `next is not a function` on every
 * save. Throwing is the supported way to reject.
 */
attemptSchema.pre('save', function freezeSequence() {
  if (!this.isNew && (this.isModified('scenario_sequence') || this.isModified('seed')
    || this.isModified('selection'))) {
    throw new Error('the scenario sequence, seed and selection metadata are frozen once an attempt is created')
  }

  /**
   * IMMERSIVE-001: the deadline is frozen for the same reason the sequence is.
   *
   * `expires_at` and `time_limit_ms` are written once, inside the creation transaction,
   * from the server clock. Nothing may move them afterwards - not a refresh, not a
   * reconnect, not a reopened browser, not a restarted process, and certainly not a
   * request body. Enforcing it in the model means the rule holds for every future caller,
   * not only for the ones written today.
   *
   * A test fixture that needs an already-overdue attempt back-dates `expires_at` with
   * `updateOne`, which is a direct collection write and does not run this hook. That is
   * deliberate: fixtures may build any state they like, but no application code path can.
   */
  if (!this.isNew && (this.isModified('expires_at') || this.isModified('time_limit_ms'))) {
    throw new Error('the assessment deadline is frozen once an attempt is created')
  }
})

/**
 * The ONLY shape a learner may receive. Allowlisted: carries no seed, no selection
 * metadata, no composition and no per-scenario classification - all of which would leak
 * how the attempt was built and what is coming.
 */
attemptSchema.methods.toCandidateJSON = function toCandidateJSON() {
  return {
    attempt_id: this._id.toString(),
    mode: this.mode,
    status: this.status,
    total_scenarios: this.scenario_sequence.length,
    started_at: this.started_at,
    completed_at: this.completed_at,
    total_score: this.status === 'completed' ? this.total_score : null,

    /* --- IMMERSIVE-001 ---------------------------------------------- */

    /**
     * The deadline, or null for an attempt created before the limit existed.
     *
     * Safe to publish: it is a consequence of `started_at`, which the learner already
     * receives, plus a limit they were told about. It reveals nothing about scenarios,
     * classification or scoring.
     */
    expires_at: this.expires_at,

    /**
     * The server clock at the moment this projection was built.
     *
     * This is what makes a browser countdown honest without making it authoritative. The
     * client measures its own offset once (`server_now - Date.now()`) and renders
     * `expires_at` against a corrected clock, so a machine whose local time is wrong still
     * shows the right remaining time - and every tab, sharing one `expires_at`, shows the
     * same number. The client still decides nothing: only the server ends an attempt.
     */
    server_now: new Date(),

    /** `learner_completed` | `expired` | `instructor_reset`, or null while running. */
    end_reason: this.end_reason ?? null,
  }
}

export const Attempt = mongoose.model('Attempt', attemptSchema)
