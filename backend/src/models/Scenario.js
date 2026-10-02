import mongoose from 'mongoose'
import {
  BLOCK_TYPES,
  CHANNELS,
  EVI_CATEGORIES,
  INTERACTION_TYPES,
  JUDGEMENTS,
  MARKS,
  SCENARIO_TYPES,
  SCREEN_KINDS,
} from '../constants/assessment.js'

const { Schema } = mongoose

/* ------------------------------------------------------------------ *
 * Simulation content - one generic screen graph for all four channels
 * ------------------------------------------------------------------ */

const blockSchema = new Schema(
  {
    type: { type: String, enum: BLOCK_TYPES, required: true },

    // message / note
    from: { type: String, enum: ['them', 'me'] },
    text: String,
    time: String,
    status: String,

    // listItem
    title: String,
    preview: String,
    unread: Boolean,
    target: String,

    // image / linkPreview / attachment
    caption: String,
    placeholder: String,
    displayUrl: String, // rendered as plain text, never as a working href
    description: String,
    fileName: String,
    fileSize: String,
    fileKind: String,

    // email
    fromName: String,
    fromAddress: String,
    to: String,
    subject: String,
    paragraphs: [String],

    // post
    author: String,
    likes: Number,
    comments: Number,

    // profileHeader - an account identity card with its public counts.
    // Generic on purpose: any channel with profiles can use it.
    displayName: String,
    username: String,
    bio: String,
    verified: Boolean,
    postCount: Number,
    followers: String, // kept as text so "1.2M" and "312" both work
    following: String,
    isFollowing: Boolean,
  },
  { _id: false },
)

const actionSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    target: { type: String, default: null },
    interaction: { type: String, enum: [...INTERACTION_TYPES, null], default: null },
  },
  { _id: false },
)

const screenSchema = new Schema(
  {
    id: { type: String, required: true },
    kind: { type: String, enum: SCREEN_KINDS, required: true },
    header: {
      title: String,
      subtitle: String,
      avatarSeed: String,
      showBack: { type: Boolean, default: false },
    },
    blocks: { type: [blockSchema], default: [] },
    actions: { type: [actionSchema], default: [] },
  },
  { _id: false },
)

const simulationSchema = new Schema(
  {
    entryScreenId: { type: String, required: true },
    screens: {
      type: [screenSchema],
      required: true,
      validate: {
        validator: (screens) => screens.length > 0,
        message: 'simulation.screens must contain at least one screen',
      },
    },
  },
  { _id: false },
)

/* ------------------------------------------------------------------ *
 * Answer options - labels are candidate facing, marks are not
 * ------------------------------------------------------------------ */

const actionOptionSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    marks: { type: Number, required: true, min: MARKS.action.min, max: MARKS.action.max },
    isCriticalFailure: { type: Boolean, default: false },
  },
  { _id: false },
)

const reasonOptionSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    marks: { type: Number, required: true, min: MARKS.reason.min, max: MARKS.reason.max },
  },
  { _id: false },
)

/* ------------------------------------------------------------------ *
 * Hidden evaluation data - never leaves the server
 * ------------------------------------------------------------------ */

const evaluationSchema = new Schema(
  {
    correctJudgement: { type: String, enum: JUDGEMENTS, required: true },
    fraudTheme: { type: String, default: null },
    eviTags: [{ type: String, enum: EVI_CATEGORIES }],
    warningSigns: { type: [String], default: [] },
    feedback: { type: String, required: true },
    authorNotes: { type: String, default: null },
  },
  { _id: false },
)

/* ------------------------------------------------------------------ *
 * Scenario
 * ------------------------------------------------------------------ */

const scenarioSchema = new Schema(
  {
    scenarioCode: { type: String, required: true, unique: true, trim: true },
    channel: { type: String, enum: CHANNELS, required: true },
    type: { type: String, enum: SCENARIO_TYPES, required: true },
    version: { type: Number, default: 1, min: 1 },
    isActive: { type: Boolean, default: true },

    title: { type: String, required: true, trim: true },
    instruction: { type: String, default: null },

    simulation: { type: simulationSchema, required: true },

    actionOptions: {
      type: [actionOptionSchema],
      required: true,
      validate: {
        validator: (options) => options.length >= 2,
        message: 'actionOptions must contain at least two options',
      },
    },
    reasonOptions: {
      type: [reasonOptionSchema],
      required: true,
      validate: {
        validator: (options) => options.length >= 2,
        message: 'reasonOptions must contain at least two options',
      },
    },

    /**
     * NEVER sent to a candidate. Two layers guard it: `select: false` keeps it
     * out of ordinary queries (the scoring service must ask for it with
     * `.select('+evaluation')`), and toCandidateJSON() strips it regardless.
     */
    evaluation: { type: evaluationSchema, required: true, select: false },
  },
  { timestamps: true },
)

scenarioSchema.index({ isActive: 1, channel: 1, type: 1 })

/** `type` and `evaluation.correctJudgement` must agree. */
scenarioSchema.pre('validate', async function validateConsistency() {
  const correct = this.evaluation?.correctJudgement
  if (this.type === 'legitimate' && correct === 'fraudulent') {
    throw new Error('A legitimate scenario cannot have correctJudgement "fraudulent"')
  }
  if (this.type === 'malicious' && correct === 'genuine') {
    throw new Error('A malicious scenario cannot have correctJudgement "genuine"')
  }
})

/**
 * The ONLY shape a candidate is ever allowed to receive. Option marks,
 * the correct judgement, EVI tags, warning signs, feedback and author notes
 * are all removed here so a controller cannot leak them by forgetting.
 */
scenarioSchema.methods.toCandidateJSON = function toCandidateJSON() {
  return {
    id: this._id.toString(),
    channel: this.channel,
    title: this.title,
    instruction: this.instruction,
    simulation: this.simulation ? this.simulation.toJSON() : null,
    actionOptions: this.actionOptions.map(({ key, label }) => ({ key, label })),
    reasonOptions: this.reasonOptions.map(({ key, label }) => ({ key, label })),
  }
}

export const Scenario = mongoose.model('Scenario', scenarioSchema)
