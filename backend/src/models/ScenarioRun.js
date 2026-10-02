import mongoose from 'mongoose'
import { PLATFORMS, SCENARIO_ID_PATTERN, SCENARIO_POINTS, STAGE_KEYS } from '../constants/scenarioDefinition.js'
import { RUN_STATUSES } from '../constants/scenarioEngine.js'

const { Schema } = mongoose

/**
 * ScenarioRun - one execution of one ScenarioDefinition (ENGINE-001).
 *
 * The client contract (specification section 6) requires run_id, attempt_id, scenario_id,
 * ordinal, started_at, resolved_at, score_0_10 and outcome_code. The remaining fields are
 * the minimum authoritative state needed to resume safely after a crash or restart -
 * nothing here duplicates the ScenarioDefinition.
 *
 * This document is the runtime cache for scoring. The Event ledger is the audit source:
 * `score_running` must always be reproducible by replaying this run's events, which is
 * what `recomputeScoreFromEvents()` in the engine service does.
 *
 * `_id` is the run_id.
 */
const scenarioRunSchema = new Schema(
  {
    /**
     * The attempt this run belongs to. Stored as a plain ObjectId with no `ref`: the
     * Attempt model is a later task, and ENGINE-001 is deliberately isolated from it.
     * Tests use deterministic fixture ids. See docs/SCENARIO_ENGINE.md.
     */
    attempt_id: { type: Schema.Types.ObjectId, required: true },

    /** Position within the attempt. 1-10 once attempts exist. */
    ordinal: { type: Number, required: true, min: 1 },

    /** The logical scenario, and the exact content version this run is pinned to. */
    scenario_id: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: [SCENARIO_ID_PATTERN, 'scenario_id must look like W01, I25, E07 or S14'],
    },
    definition_version: { type: Number, required: true, min: 1 },

    /** Denormalised for cheap resume rendering. Never reveals difficulty or disposition. */
    platform: { type: String, enum: PLATFORMS, required: true },

    status: { type: String, enum: RUN_STATUSES, required: true, default: 'active', index: true },
    current_stage: { type: String, enum: STAGE_KEYS, required: true, default: 'notify' },

    /** Monotonic per run. The next event is always last_sequence + 1. */
    last_sequence: { type: Number, required: true, default: 0, min: 0 },

    /** Unclamped accumulation. Clamped only when the run resolves. */
    score_running: { type: Number, required: true, default: 0 },

    /** Written once, at resolution: clamp(score_running, 0, 10). */
    score_0_10: { type: Number, default: null, min: SCENARIO_POINTS.min, max: SCENARIO_POINTS.max },

    /** The learner's final action, e.g. 'resolve_report'. Null until resolved. */
    outcome_code: { type: String, default: null },

    /** Section 4: optional one-line explanation, max 250 characters. Never scored. */
    rationale: { type: String, default: null, maxlength: 250 },

    started_at: { type: Date, required: true, default: Date.now },
    last_event_at: { type: Date, default: null },
    resolved_at: { type: Date, default: null },
  },
  { timestamps: true },
)

/** One run per scenario position within an attempt. */
scenarioRunSchema.index({ attempt_id: 1, ordinal: 1 }, { unique: true })
/** Resume: find the attempt's unfinished run. */
scenarioRunSchema.index({ attempt_id: 1, status: 1 })
/** Content-version impact analysis. */
scenarioRunSchema.index({ scenario_id: 1, definition_version: 1 })

scenarioRunSchema.pre('validate', function validateRun() {
  if (this.status === 'resolved') {
    if (this.score_0_10 === null || this.score_0_10 === undefined) {
      this.invalidate('score_0_10', 'a resolved run must carry a score')
    }
    if (!this.resolved_at) this.invalidate('resolved_at', 'a resolved run must carry resolved_at')
    if (!this.outcome_code) this.invalidate('outcome_code', 'a resolved run must carry an outcome_code')
  } else if (this.score_0_10 !== null && this.score_0_10 !== undefined) {
    this.invalidate('score_0_10', 'only a resolved run may carry a final score')
  }
})

/**
 * The ONLY shape a learner may receive. Built from an allowlist, so a field added later
 * is hidden by default. Carries no scenario classification, no expected action and no
 * scoring rule - and no running score, which section 3 hides in assessment mode.
 */
scenarioRunSchema.methods.toCandidateJSON = function toCandidateJSON() {
  return {
    run_id: this._id.toString(),
    scenario_id: this.scenario_id,
    version: this.definition_version,
    platform: this.platform,
    current_stage: this.current_stage,
    status: this.status,
    last_sequence: this.last_sequence,
    started_at: this.started_at,
    resolved_at: this.resolved_at,
  }
}

export const ScenarioRun = mongoose.model('ScenarioRun', scenarioRunSchema)
