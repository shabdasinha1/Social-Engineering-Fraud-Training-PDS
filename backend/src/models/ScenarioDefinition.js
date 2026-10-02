import mongoose from 'mongoose'
import {
  ALL_STAGE_EVENTS,
  ASSET_KINDS,
  CANONICAL_FAMILIES,
  CANONICAL_TRIGGERS,
  DISPOSITIONS,
  LEARNER_ACTIONS,
  LEGITIMATE_FAMILIES,
  LEVELS,
  MILITARY_CONTEXT_MARKER,
  PILOT_STATUSES,
  PLATFORMS,
  SCENARIO_ID_PATTERN,
  SCENARIO_ID_PREFIX_PLATFORM,
  SCENARIO_POINTS,
  SCENARIO_SCHEMA_VERSION,
  SCORING_EVENT_CODES,
  STAGE_COUNT,
  STAGE_EVENTS,
  STAGE_KEYS,
  STAGE_TRANSITIONS,
  TAXONOMY_VERSION,
  TRANSITION_TARGETS,
  TRANSITION_TRIGGERS,
  TRIGGER_TAXONOMY_VERSION,
} from '../constants/scenarioDefinition.js'
import { LIFECYCLE_STATES } from '../constants/scenarioLifecycle.js'

const { Schema } = mongoose

/**
 * ScenarioDefinition - the source of truth for the client's 100-scenario bank.
 *
 * DATA-001. Schema only: no importer, no engine, no selection, no scoring. The
 * legacy `Scenario` model and its 40-scenario pipeline are untouched and keep
 * running; this is a separate collection (`scenariodefinitions`).
 *
 * Authority: the client specification v1.0 (02 Sep 2026), plus PROJECT_MASTER_PLAN.md
 * sections 15.23 / 15.24 / 15.25. Design rationale: docs/SCENARIO_DEFINITION_SCHEMA.md.
 *
 * Two rules shape everything below.
 *
 * 1. CLIENT CONTENT IS NEVER OVERWRITTEN. `family` and `trigger` hold the client's
 *    strings verbatim. `canonical_family` and `canonical_triggers` are OUR metadata,
 *    stored alongside, and are versioned so a remap is auditable.
 *
 * 2. NOTHING THAT REVEALS THE ANSWER REACHES A LEARNER. Two independent layers:
 *    `evaluation` is `select: false`, and toCandidateJSON() rebuilds the payload from
 *    an allowlist rather than deleting fields from it.
 */

/* ------------------------------------------------------------------ *
 * Synthetic assets - generated, inert, local
 * ------------------------------------------------------------------ */

const assetSchema = new Schema(
  {
    asset_id: { type: String, required: true, trim: true },
    kind: { type: String, enum: ASSET_KINDS, required: true },
    label: { type: String, default: null },

    /**
     * Rendered as text by the simulation, never as a working href. The importer
     * enforces the reserved-host rule; see the schema doc for that boundary.
     */
    display_target: { type: String, default: null },

    /** Free-form synthetic body: message bubbles, profile fields, page copy. */
    content: { type: Schema.Types.Mixed, default: null },

    /** Marks an asset the learner is meant to be able to open safely. */
    inert: { type: Boolean, default: true },
  },
  { _id: false },
)

/* ------------------------------------------------------------------ *
 * Stage - candidate-visible half
 * ------------------------------------------------------------------ */

const transitionSchema = new Schema(
  {
    on: { type: String, enum: TRANSITION_TRIGGERS, required: true },
    to: { type: String, enum: TRANSITION_TARGETS, required: true },
  },
  { _id: false },
)

const stageSchema = new Schema(
  {
    index: { type: Number, required: true, min: 1, max: STAGE_COUNT },
    key: { type: String, enum: STAGE_KEYS, required: true },

    /** Client column "UI to build" - what the renderer must present. */
    ui_to_build: { type: String, required: true, trim: true },

    transitions: {
      type: [transitionSchema],
      required: true,
      validate: {
        validator: (t) => t.length > 0,
        message: 'a stage must declare at least one transition',
      },
    },

    /** Telemetry codes this stage may emit. Constrained per stage by STAGE_EVENTS. */
    events: {
      type: [{ type: String, enum: ALL_STAGE_EVENTS }],
      default: [],
    },

    /** asset_id references into `synthetic.assets`. Resolved in the model hook. */
    asset_refs: { type: [String], default: [] },
  },
  { _id: false },
)

/* ------------------------------------------------------------------ *
 * Stage - server-only half
 * ------------------------------------------------------------------ */

const expectedActionSchema = new Schema(
  {
    action: { type: String, enum: LEARNER_ACTIONS, required: true },

    /** Is this the behaviour the specification wants at this stage? */
    expected: { type: Boolean, default: false },

    /** The scoring code this action produces, if any. */
    scoring_event: { type: String, enum: [...SCORING_EVENT_CODES, null], default: null },
  },
  { _id: false },
)

const stageScoringSchema = new Schema(
  {
    event_code: { type: String, enum: SCORING_EVENT_CODES, required: true },

    /**
     * Stored per scenario rather than looked up from SCORING_EVENTS. The bank is
     * uniform today, but the client owns these numbers: an attempt must remain
     * explainable from what was stored when it ran, not from today's constants.
     */
    points_delta: { type: Number, required: true, min: -10, max: 10 },

    critical: { type: Boolean, default: false },
  },
  { _id: false },
)

const evaluationStageSchema = new Schema(
  {
    index: { type: Number, required: true, min: 1, max: STAGE_COUNT },
    key: { type: String, enum: STAGE_KEYS, required: true },

    /** Client column "Learner flow + synthetic content", verbatim. */
    learner_flow: { type: String, required: true, trim: true },

    /** Client column "Expected safe behavior", verbatim. */
    expected_safe_behavior: { type: String, required: true, trim: true },

    /** Client column "Scoring event", verbatim, kept for provenance and review. */
    scoring_text: { type: String, default: null, trim: true },

    expected_actions: { type: [expectedActionSchema], default: [] },
    scoring: { type: [stageScoringSchema], default: [] },
  },
  { _id: false },
)

/* ------------------------------------------------------------------ *
 * Feedback - specification section 7 and Appendix A
 * ------------------------------------------------------------------ */

const feedbackSchema = new Schema(
  {
    /** "Disposition" in Appendix A: what this item actually was. */
    result: { type: String, required: true, trim: true },

    /** Points narrative. Optional: the number itself comes from the ledger. */
    points_summary: { type: String, default: null, trim: true },

    /** "Warning/confirming signs" - the observable cues. */
    cues: {
      type: [String],
      required: true,
      validate: { validator: (c) => c.length > 0, message: 'feedback.cues must not be empty' },
    },

    /** "Preferred action". */
    safe_action: { type: String, required: true, trim: true },

    /** "Impact" - what would have happened. */
    impact: { type: String, required: true, trim: true },

    /** "One prevention habit" - the transferable lesson. */
    prevention_habit: { type: String, required: true, trim: true },

    /**
     * Section 4: "Training mode immediate; assessment mode may defer detail until
     * attempt completion." Both modes read the same content; only timing differs,
     * so one structure serves both.
     */
    immediate_in_training: { type: Boolean, default: true },
  },
  { _id: false },
)

/* ------------------------------------------------------------------ *
 * Server-only evaluation block
 * ------------------------------------------------------------------ */

const evaluationSchema = new Schema(
  {
    /**
     * Server-only. Titles such as "Cloned Friend in Distress" state the answer
     * outright, so the title is evaluation data, not presentation data.
     */
    title: { type: String, required: true, trim: true },

    /** Client "End-state", verbatim. */
    end_state: { type: String, required: true, trim: true },

    feedback: { type: feedbackSchema, required: true },

    stages: {
      type: [evaluationStageSchema],
      required: true,
      validate: {
        validator: (s) => s.length === STAGE_COUNT,
        message: `evaluation.stages must contain exactly ${STAGE_COUNT} stages`,
      },
    },
  },
  { _id: false },
)

/* ------------------------------------------------------------------ *
 * Appendix A quality gate
 * ------------------------------------------------------------------ */

const qualitySchema = new Schema(
  {
    content_reviewer: { type: String, default: null },
    technical_reviewer: { type: String, default: null },
    instructional_reviewer: { type: String, default: null },
    safety_check: { type: Boolean, default: false },
    accessibility_check: { type: Boolean, default: false },
    pilot_status: { type: String, enum: PILOT_STATUSES, default: 'not_started' },
  },
  { _id: false },
)

/* ------------------------------------------------------------------ *
 * ScenarioDefinition
 * ------------------------------------------------------------------ */

const scenarioDefinitionSchema = new Schema(
  {
    schema_version: { type: Number, default: SCENARIO_SCHEMA_VERSION, min: 1 },

    // --- identity -------------------------------------------------
    scenario_id: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: [SCENARIO_ID_PATTERN, 'scenario_id must look like W01, I25, E07 or S14'],
    },
    version: { type: Number, required: true, min: 1, default: 1 },

    /**
     * Explicit, never inferred. Several versions of one scenario_id may exist;
     * at most one may be active, which the importer enforces on publish.
     */
    active: { type: Boolean, required: true, default: false },

    /**
     * The authoring lifecycle (ADMIN-001): `draft`, `published` or `retired`.
     *
     * Additive and deliberately WITHOUT a default. `active` alone cannot separate a
     * version that was never published from one that was published and later retired, and
     * that difference decides whether an edit may rewrite it - a retired version is still
     * pinned by historical ScenarioRuns.
     *
     * Absent on the 100 scenarios imported before this field existed. `lifecycleOf()`
     * resolves those from `active`, so nothing needed migrating; every version the
     * scenario manager writes carries the state explicitly.
     */
    lifecycle_state: { type: String, enum: LIFECYCLE_STATES, default: undefined },

    /** When this version was first published. Null while it is still a draft. */
    published_at: { type: Date, default: null },

    platform: { type: String, enum: PLATFORMS, required: true },
    owner: { type: String, default: null },
    review_date: { type: Date, default: null },

    // --- classification (server-only, but top-level so it stays queryable) ----
    level: { type: String, enum: LEVELS, required: true },
    disposition: { type: String, enum: DISPOSITIONS, required: true },

    /** Client "Attack / case family", VERBATIM. Never overwritten. */
    family: { type: String, required: true, trim: true },
    canonical_family: { type: String, enum: CANONICAL_FAMILIES, required: true },
    taxonomy_version: { type: String, required: true, default: TAXONOMY_VERSION },

    /** Client "Primary trigger", VERBATIM, including any '| FICTIONAL MILITARY CONTEXT'. */
    trigger: { type: String, required: true, trim: true },
    canonical_triggers: {
      type: [{ type: String, enum: CANONICAL_TRIGGERS }],
      required: true,
      validate: [
        { validator: (t) => t.length > 0, message: 'canonical_triggers must not be empty' },
        {
          validator: (t) => new Set(t).size === t.length,
          message: 'canonical_triggers must not repeat a value',
        },
      ],
    },
    trigger_taxonomy_version: { type: String, required: true, default: TRIGGER_TAXONOMY_VERSION },

    military_flag: { type: Boolean, required: true, default: false },
    legitimate_control: { type: Boolean, required: true, default: false },

    // --- candidate-visible content --------------------------------
    synthetic: {
      sender: { type: Schema.Types.Mixed, default: null },
      prior_context: { type: String, default: null },
      assets: { type: [assetSchema], default: [] },
    },

    stages: {
      type: [stageSchema],
      required: true,
      validate: {
        validator: (s) => s.length === STAGE_COUNT,
        message: `stages must contain exactly ${STAGE_COUNT} stages`,
      },
    },

    // --- scoring envelope -----------------------------------------
    scoring: {
      max_points: { type: Number, default: SCENARIO_POINTS.max, min: 0 },
      min_points: { type: Number, default: SCENARIO_POINTS.min, min: 0 },
    },

    quality: { type: qualitySchema, default: () => ({}) },

    /**
     * NEVER sent to a learner. Two layers guard it, the pattern proven on the legacy
     * Scenario model: `select: false` keeps it out of ordinary queries, and
     * toCandidateJSON() builds its output from an allowlist so a forgotten
     * `.select('+evaluation')` cannot leak it.
     */
    evaluation: { type: evaluationSchema, required: true, select: false },
  },
  { timestamps: true },
)

/* ------------------------------------------------------------------ *
 * Indexes - sized to the queries the selection engine will actually run
 * ------------------------------------------------------------------ */

/** One document per logical scenario per content version. */
scenarioDefinitionSchema.index({ scenario_id: 1, version: 1 }, { unique: true })

/** Selection: platform allocation crossed with the difficulty target. */
scenarioDefinitionSchema.index({ active: 1, platform: 1, level: 1 })

/** Selection: the 8 malicious + 2 legitimate split. */
scenarioDefinitionSchema.index({ active: 1, disposition: 1 })

/** Selection: max two per canonical family. Analytics: family breakdown. */
scenarioDefinitionSchema.index({ active: 1, canonical_family: 1 })

/** Selection: at least five distinct triggers. Multikey over the array. */
scenarioDefinitionSchema.index({ active: 1, canonical_triggers: 1 })

/** Selection: 2-4 military-context cases per attempt. */
scenarioDefinitionSchema.index({ active: 1, military_flag: 1 })

/* ------------------------------------------------------------------ *
 * Cross-field validation
 *
 * Runs in a SYNCHRONOUS pre('validate') hook and reports through
 * `this.invalidate()`, so every failure arrives as a ValidationError with a real
 * path. Two consequences worth knowing:
 *   - `await doc.validate()` runs this with no database connection, which is what
 *     keeps the tests DB-free.
 *   - `doc.validateSync()` does NOT run pre-validate middleware, and is deprecated
 *     in Mongoose 9. Never use it to check one of these documents.
 * ------------------------------------------------------------------ */

scenarioDefinitionSchema.pre('validate', function validateScenarioDefinition() {
  const invalid = (path, message) => this.invalidate(path, message)

  // --- identity agrees with platform ---
  if (this.scenario_id && this.platform) {
    const expected = SCENARIO_ID_PREFIX_PLATFORM[this.scenario_id[0]]
    if (expected && expected !== this.platform) {
      invalid(
        'platform',
        `scenario_id "${this.scenario_id}" implies platform "${expected}", not "${this.platform}"`,
      )
    }
  }

  // --- disposition agrees with the canonical family and the control flag ---
  if (this.disposition && this.canonical_family) {
    const isLegitFamily = LEGITIMATE_FAMILIES.includes(this.canonical_family)
    if (this.disposition === 'legitimate' && !isLegitFamily) {
      invalid(
        'canonical_family',
        `a legitimate scenario needs a legit_* canonical family, got "${this.canonical_family}"`,
      )
    }
    if (this.disposition === 'malicious' && isLegitFamily) {
      invalid(
        'canonical_family',
        `a malicious scenario cannot use the legitimate family "${this.canonical_family}"`,
      )
    }
  }
  if (this.disposition && this.legitimate_control !== (this.disposition === 'legitimate')) {
    invalid('legitimate_control', 'legitimate_control must be true exactly when disposition is legitimate')
  }

  // --- raw trigger shape, and military_flag derived from it ---
  if (typeof this.trigger === 'string') {
    const parts = this.trigger.split('|')
    if (parts.length > 2) {
      invalid('trigger', "trigger may contain at most one '|' separator")
    } else {
      const suffix = parts.length === 2 ? parts[1].trim() : null
      if (suffix !== null && suffix !== MILITARY_CONTEXT_MARKER) {
        invalid('trigger', `the only permitted trigger suffix is "${MILITARY_CONTEXT_MARKER}"`)
      }
      if (this.military_flag !== (suffix === MILITARY_CONTEXT_MARKER)) {
        invalid(
          'military_flag',
          `military_flag must be true exactly when the trigger carries "| ${MILITARY_CONTEXT_MARKER}"`,
        )
      }
      // Split on '+' only - never whitespace, so multi-word primitives survive.
      const primitives = parts[0].split('+').map((p) => p.trim())
      if (primitives.some((p) => p.length === 0)) {
        invalid('trigger', "trigger has an empty component around a '+'")
      }
    }
  }

  // --- six stages, correctly keyed and ordered ---
  const checkStages = (list, path) => {
    if (!Array.isArray(list) || list.length !== STAGE_COUNT) return false
    let ok = true
    list.forEach((stage, i) => {
      if (stage.key !== STAGE_KEYS[i]) {
        invalid(path, `stage ${i + 1} must be "${STAGE_KEYS[i]}", got "${stage.key}"`)
        ok = false
      }
      if (stage.index !== i + 1) {
        invalid(path, `stage "${stage.key}" must carry index ${i + 1}, got ${stage.index}`)
        ok = false
      }
    })
    return ok
  }

  const stagesOk = checkStages(this.stages, 'stages')
  checkStages(this.evaluation?.stages, 'evaluation.stages')

  // --- transitions, events and asset refs, per stage ---
  if (stagesOk) {
    const assetIds = new Set((this.synthetic?.assets ?? []).map((a) => a.asset_id))

    for (const stage of this.stages) {
      const allowed = STAGE_TRANSITIONS[stage.key] ?? []

      for (const t of stage.transitions ?? []) {
        const permitted = allowed.some((a) => a.on === t.on && a.to === t.to)
        if (!permitted) {
          invalid(
            'stages',
            `stage "${stage.key}" declares transition ${t.on} -> ${t.to}, which the six-stage model does not allow`,
          )
        }
      }

      const stageEvents = STAGE_EVENTS[stage.key] ?? []
      for (const e of stage.events ?? []) {
        if (!stageEvents.includes(e)) {
          invalid('stages', `event "${e}" does not belong to stage "${stage.key}"`)
        }
      }

      for (const ref of stage.asset_refs ?? []) {
        if (!assetIds.has(ref)) {
          invalid('stages', `stage "${stage.key}" references unknown asset "${ref}"`)
        }
      }
    }
  }

  // --- scoring envelope ---
  if (this.scoring && this.scoring.min_points > this.scoring.max_points) {
    invalid('scoring.min_points', 'scoring.min_points cannot exceed scoring.max_points')
  }
})

/* ------------------------------------------------------------------ *
 * Candidate projection
 * ------------------------------------------------------------------ */

/**
 * The ONLY shape a learner may receive.
 *
 * Built from an allowlist, not by deleting from the document, so a field added
 * later is hidden by default rather than exposed by default.
 *
 * Deliberately absent: title, level, disposition, family, canonical_family,
 * trigger, canonical_triggers, military_flag, end_state, feedback, expected
 * actions, per-stage scoring and the whole evaluation block. Section 3 forbids
 * revealing difficulty, the malicious/legitimate label or the attack family, and
 * a scenario title frequently states the answer.
 *
 * SCENARIO-AUDIT-002 (M1): also absent is the client's third-person narration where no
 * learner screen draws it - `prior_context`, the thread's `note` block and a browser
 * page's `body`. It describes the scenario rather than being part of it ("A fake support
 * account…", "A spoofed sender…"), so it can state the verdict. The stored definition
 * keeps it; only this projection omits it.
 */

/**
 * The scenes that draw the thread's narrator note on screen (as the chat's context line).
 * `sceneProjection.test.js` fails if this drifts from what the scenes actually render.
 */
export const RENDERED_CONTEXT_NOTE_SCENARIOS = new Set([
  'W01', 'W02', 'W03', 'W04', 'W05', 'W06', 'W07', 'W08',
])

function candidateContent(scenarioId, asset) {
  const content = asset.content
  if (!content || typeof content !== 'object') return content
  if (asset.kind === 'message_thread' && Array.isArray(content.blocks)
    && !RENDERED_CONTEXT_NOTE_SCENARIOS.has(scenarioId)) {
    return { ...content, blocks: content.blocks.filter((block) => block?.type !== 'note') }
  }
  if (asset.kind === 'browser_page') {
    const { body, ...rest } = content
    return rest
  }
  return content
}

scenarioDefinitionSchema.methods.toCandidateJSON = function toCandidateJSON() {
  return {
    id: this._id.toString(),
    scenario_id: this.scenario_id,
    version: this.version,
    platform: this.platform,
    synthetic: {
      sender: this.synthetic?.sender ?? null,
      prior_context: null,
      assets: (this.synthetic?.assets ?? []).map((a) => ({
        asset_id: a.asset_id,
        kind: a.kind,
        label: a.label,
        display_target: a.display_target,
        content: candidateContent(this.scenario_id, a),
      })),
    },
    stages: (this.stages ?? []).map((s) => ({
      index: s.index,
      key: s.key,
      ui_to_build: s.ui_to_build,
      transitions: (s.transitions ?? []).map((t) => ({ on: t.on, to: t.to })),
      events: [...(s.events ?? [])],
      asset_refs: [...(s.asset_refs ?? [])],
    })),
  }
}

export const ScenarioDefinition = mongoose.model('ScenarioDefinition', scenarioDefinitionSchema)
