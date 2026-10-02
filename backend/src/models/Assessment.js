import mongoose from 'mongoose'
import {
  ASSESSMENT_COMPOSITIONS,
  ASSESSMENT_SCENARIO_COUNT,
  ASSESSMENT_STATUSES,
  INTERACTION_TYPES,
  JUDGEMENTS,
  MARKS,
} from '../constants/assessment.js'

const { Schema } = mongoose

const interactionSchema = new Schema(
  {
    screenId: String,
    actionId: String,
    interaction: { type: String, enum: [...INTERACTION_TYPES, null], default: null },
    atMs: Number, // client-relative, recorded for interest only, never scored
  },
  { _id: false },
)

const marksSchema = new Schema(
  {
    judgement: { type: Number, min: MARKS.judgement.min, max: MARKS.judgement.max },
    action: { type: Number, min: MARKS.action.min, max: MARKS.action.max },
    reason: { type: Number, min: MARKS.reason.min, max: MARKS.reason.max },
    total: { type: Number, min: MARKS.scenario.min, max: MARKS.scenario.max },
  },
  { _id: false },
)

const answerSchema = new Schema(
  {
    judgement: { type: String, enum: JUDGEMENTS, required: true },
    actionKey: { type: String, required: true },
    reasonKey: { type: String, required: true },
    interactions: { type: [interactionSchema], default: [] },

    submittedAt: { type: Date, required: true },
    durationMs: { type: Number, min: 0 }, // server-computed: submittedAt - servedAt

    marks: { type: marksSchema, default: null },
    isCriticalFailure: { type: Boolean, default: false },
  },
  { _id: false },
)

const sequenceItemSchema = new Schema(
  {
    position: { type: Number, required: true, min: 1, max: ASSESSMENT_SCENARIO_COUNT },
    scenario: { type: Schema.Types.ObjectId, ref: 'Scenario', required: true },
    scenarioVersion: { type: Number, required: true },
    servedAt: { type: Date, default: null }, // stamped once, on first delivery
    answer: { type: answerSchema, default: null },
  },
  { _id: false },
)

const assessmentSchema = new Schema(
  {
    candidate: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
    status: { type: String, enum: ASSESSMENT_STATUSES, default: 'IN_PROGRESS' },

    /**
     * Generated once by the question engine and never regenerated. A refresh
     * or reconnect resumes the same sequence at the same position.
     */
    sequence: {
      type: [sequenceItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length === ASSESSMENT_SCENARIO_COUNT,
        message: `sequence must contain exactly ${ASSESSMENT_SCENARIO_COUNT} scenarios`,
      },
    },

    /**
     * Which malicious / legitimate split this assessment was built to, so the
     * generated test is auditable. One of 6+4, 7+3 or 8+2.
     */
    composition: {
      maliciousCount: { type: Number, required: true },
      legitimateCount: { type: Number, required: true },
    },

    /** Which selection constraints had to be relaxed, if any. See design 6.4. */
    relaxations: { type: [String], default: [] },

    currentPosition: { type: Number, default: 1, min: 1, max: ASSESSMENT_SCENARIO_COUNT + 1 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },

    /**
     * Written once on completion. Left loose until the scoring aggregation is
     * confirmed with the client - see QUESTION_ENGINE_DESIGN.md section 11.
     */
    result: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
)

assessmentSchema.index({ candidate: 1, status: 1 })
assessmentSchema.index({ candidate: 1, createdAt: -1 })

assessmentSchema.pre('validate', async function validateComposition() {
  const { maliciousCount, legitimateCount } = this.composition ?? {}

  const allowed = ASSESSMENT_COMPOSITIONS.some(
    (c) => c.malicious === maliciousCount && c.legitimate === legitimateCount,
  )
  if (!allowed) {
    const list = ASSESSMENT_COMPOSITIONS.map((c) => `${c.malicious}+${c.legitimate}`).join(', ')
    throw new Error(
      `composition must be one of: ${list}. Got ${maliciousCount}+${legitimateCount}`,
    )
  }

  const positions = this.sequence?.map((item) => item.position) ?? []
  if (new Set(positions).size !== positions.length) {
    throw new Error('sequence positions must be unique')
  }

  const scenarioIds = this.sequence?.map((item) => String(item.scenario)) ?? []
  if (new Set(scenarioIds).size !== scenarioIds.length) {
    throw new Error('a scenario cannot appear twice in one assessment')
  }
})

assessmentSchema.methods.toProgressJSON = function toProgressJSON() {
  return {
    assessmentId: this._id.toString(),
    status: this.status,
    currentPosition: this.currentPosition,
    totalQuestions: this.sequence.length,
    completed: this.sequence.filter((item) => item.answer).length,
  }
}

export const Assessment = mongoose.model('Assessment', assessmentSchema)
