import mongoose from 'mongoose'
import {
  CONFIG_SCOPE,
  FEEDBACK_TIMINGS,
  FEEDBACK_TIMING_DEFAULTS,
} from '../constants/instructorControls.js'

const { Schema } = mongoose

/**
 * Instructor configuration (ADMIN-004).
 *
 * ONE document. `scope` is unique and enum-constrained to a single value, so a second row
 * cannot be created - by the application or by a stray script. The alternative, a
 * key/value collection, would have let any future caller invent a setting; this shape
 * makes the configurable surface a schema decision rather than a runtime one.
 *
 * The whole surface is **two enum fields**. Specification section 6 asks for one
 * configurable thing - "configure training vs assessment feedback timing" - and that is
 * what is here. There is deliberately no free-form settings object, no `Mixed` field and
 * no way to store an arbitrary value: `strict: 'throw'` means an unknown path is an error
 * rather than a silently dropped field.
 *
 * Nothing here affects scoring, selection, the taxonomy or a security boundary, so no
 * attempt pins a configuration version and no result depends on one.
 */
const configurationSchema = new Schema(
  {
    /** The singleton key. Unique and single-valued: there is exactly one settings row. */
    scope: {
      type: String,
      required: true,
      unique: true,
      enum: [CONFIG_SCOPE],
      default: CONFIG_SCOPE,
    },

    /**
     * Section 4: "training mode immediate, assessment mode may defer detail until attempt
     * completion." Both default to `on_completion` because that is what the server does
     * today - see FEEDBACK_TIMING_DEFAULTS for why the default is the honest value rather
     * than the aspirational one.
     */
    training_feedback_timing: {
      type: String,
      enum: FEEDBACK_TIMINGS,
      required: true,
      default: FEEDBACK_TIMING_DEFAULTS.training,
    },
    assessment_feedback_timing: {
      type: String,
      enum: FEEDBACK_TIMINGS,
      required: true,
      default: FEEDBACK_TIMING_DEFAULTS.assessment,
    },

    /**
     * Incremented on every change that actually changed something.
     *
     * Used for optimistic concurrency, so two instructors editing at once cannot silently
     * overwrite each other, and as a stable reference an audit reader can quote. It is
     * NOT pinned into attempts: feedback timing does not affect a score, a selection or a
     * result, so pinning it would imply a reproducibility relationship that does not
     * exist.
     */
    config_version: { type: Number, required: true, default: 1, min: 1 },

    /** Who changed it last. The id is the record; the username is denormalised for reading. */
    updated_by: { type: Schema.Types.ObjectId, ref: 'AdminUser', default: null },
    updated_by_username: { type: String, default: null, trim: true, maxlength: 32 },
  },
  { timestamps: true, strict: 'throw', minimize: false },
)

/**
 * The ONLY shape configuration leaves the server in.
 *
 * An allowlist, so a field added later is hidden until someone publishes it deliberately.
 * `updated_by` is published as an id, never as an AdminUser document - that document
 * carries a password hash.
 */
configurationSchema.methods.toAdminJSON = function toAdminJSON() {
  return {
    training_feedback_timing: this.training_feedback_timing,
    assessment_feedback_timing: this.assessment_feedback_timing,
    config_version: this.config_version,
    updated_at: this.updatedAt ?? null,
    updated_by: this.updated_by ? this.updated_by.toString() : null,
    updated_by_username: this.updated_by_username ?? null,
  }
}

export const Configuration = mongoose.model('Configuration', configurationSchema)
