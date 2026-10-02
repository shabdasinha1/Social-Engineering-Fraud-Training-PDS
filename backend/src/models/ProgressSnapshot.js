import mongoose from 'mongoose'

const { Schema } = mongoose

/**
 * `ProgressSnapshot` (PROGRESS-001, specification section 6 entity table - closes
 * ACCEPTANCE-001 gap G2).
 *
 * ### A derived read model, and nothing more
 *
 * `ScenarioRun` remains the source of truth for scenario scores and `Attempt` for
 * completion and `total_score`. Everything in this document is a recomputation of those,
 * and it is **never** read back to decide a score. `DEPLOYMENT_AND_TRANSACTION_STRATEGY.md`
 * settles the consistency question outright: *"`ProgressSnapshot` is derived and
 * regenerable - never a write that must be atomic with anything"*, and lists *"idempotent
 * recomputation of `Attempt.total_score` and `ProgressSnapshot`"* as what EVENT-002 owes.
 *
 * That is why the rebuild is a **full recomputation from the completed attempts**, never an
 * increment. A counter can double-count on a retried completion; a recomputation of the same
 * inputs cannot, because it does not know how many times it has run. Idempotency here is a
 * property of the shape, not of a guard someone has to remember.
 *
 * One document per learner: `profile_id` is unique, so a rebuild upserts rather than
 * accumulating a history of snapshots. The snapshot is disposable - deleting the collection
 * costs nothing but a rebuild on next read.
 *
 * ### What it deliberately does not carry
 *
 * No per-scenario row, no scenario id, no disposition, no difficulty, no trigger, no event,
 * no `points_delta`, no seed and no selection metadata. The aggregates below are counts and
 * point totals per platform and per attack family, which is what section 7 already publishes
 * on the result screen for a single attempt - held here across attempts and nothing more.
 */

/**
 * One aggregate bucket. Deliberately `scenarios` / `points` / `max_points` only.
 *
 * The per-attempt buckets in `attemptResultService` also carry `missed_threats` and
 * `false_positives`. Those are correct there - they describe scenarios the learner has just
 * finished and been given feedback on. Carried across every attempt a learner ever takes,
 * a family bucket reading "missed threats: 3" would become a standing statement that the
 * family is malicious, which is exactly the per-family oracle PROGRESS-001 must not build.
 * Points out of maximum say how the learner is doing without saying what the answer was.
 */
const bucketSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    scenarios: { type: Number, required: true, min: 0 },
    points: { type: Number, required: true, min: 0 },
    max_points: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const progressSnapshotSchema = new Schema(
  {
    /** The learner. `Candidate` is the LearnerProfile of record (15.16, and 15.48). */
    profile_id: {
      type: Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      unique: true,
      index: true,
    },

    /**
     * Completed attempts for this profile - the section 7 "exposure count".
     *
     * `in_progress` and `abandoned` attempts are excluded: an attempt that was reset by an
     * instructor (ADMIN-004 moves it to `abandoned`, deleting nothing) is not an exposure
     * the learner completed, and an unfinished one has no score to report.
     */
    attempt_count: { type: Number, required: true, min: 0, default: 0 },

    /** Resolved scenarios across those completed attempts. The literal exposure total. */
    scenarios_completed: { type: Number, required: true, min: 0, default: 0 },

    /** `total_score` of the most recently completed attempt. Null before the first one. */
    last_score: { type: Number, default: null, min: 0, max: 100 },
    /** Highest `total_score` across completed attempts. Null before the first one. */
    best_score: { type: Number, default: null, min: 0, max: 100 },

    by_platform: { type: [bucketSchema], default: [] },
    by_family: { type: [bucketSchema], default: [] },

    /**
     * The comparability signature of the most recently completed attempt, and whether the
     * completed attempts actually share it.
     *
     * Section 7 forbids comparing across incomparable mode or content versions. This
     * snapshot does not compare - `comparisonFor()` still owns the trend, untouched - but
     * `best_score` spans every completed attempt, so when `mixed_versions` is true the
     * learner-facing projection says so instead of presenting a best score across versions
     * as if it were like-for-like. It is a disclosure, not a comparison engine.
     */
    mode: { type: String, default: null },
    content_version: { type: Number, default: null },
    taxonomy_version: { type: String, default: null },
    trigger_taxonomy_version: { type: String, default: null },
    mixed_versions: { type: Boolean, required: true, default: false },

    /** Server clock, set on every rebuild. Never a client value. */
    generated_at: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
)

/**
 * The ONLY shape a learner may receive.
 *
 * No `_id`, no `profile_id` - the session already establishes whose progress this is, so
 * publishing the ObjectId would add an internal handle the learner has no use for. Same
 * rule `Candidate.toPublicJSON()` follows since PROFILE-001.
 */
progressSnapshotSchema.methods.toCandidateJSON = function toCandidateJSON() {
  return {
    attempt_count: this.attempt_count,
    scenarios_completed: this.scenarios_completed,
    last_score: this.last_score,
    best_score: this.best_score,
    max_score: 100,
    by_platform: this.by_platform.map(publicBucket),
    by_family: this.by_family.map(publicBucket),
    mixed_versions: this.mixed_versions,
    generated_at: this.generated_at,
  }
}

const publicBucket = (b) => ({
  key: b.key,
  label: b.label,
  scenarios: b.scenarios,
  points: b.points,
  max_points: b.max_points,
})

export const ProgressSnapshot = mongoose.model('ProgressSnapshot', progressSnapshotSchema)
