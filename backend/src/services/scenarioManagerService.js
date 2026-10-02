import { RESERVED_HOST_PATTERN, SCENARIO_ID_PATTERN } from '../constants/scenarioDefinition.js'
import {
  AUTHORABLE_FIELDS,
  CREATE_ONLY_FIELDS,
  EDITABLE_IN_PLACE,
  PUBLISH_FAILURE_CODES,
  SCENARIO_LIST_FILTERS,
  SCENARIO_PAGE_SIZE_DEFAULT,
  SCENARIO_PAGE_SIZE_MAX,
  SCENARIO_SORTS,
  SCENARIO_SORT_DEFAULT,
  SERVER_CONTROLLED_FIELDS,
  lifecycleOf,
} from '../constants/scenarioLifecycle.js'
import { ScenarioDefinition } from '../models/ScenarioDefinition.js'
import { validateOfflineSafety } from './scenarioDefinitionImportService.js'
import { append } from './auditService.js'
import { assertTransactionSupport, withEngineTransaction } from '../utils/transactions.js'

/**
 * The scenario manager (ADMIN-001).
 *
 * Authoring sits on top of the existing `ScenarioDefinition` - there is no second scenario
 * model, no second validator and no parallel store. DATA-001's `pre('validate')` hook is
 * the authority on whether a scenario is well formed, and this service calls it rather
 * than restating any of its rules.
 *
 * Three properties the rest of the system depends on, enforced here:
 *
 *   1. **A published version is never rewritten.** Editing one produces the next version.
 *      `ScenarioRun` pins `(scenario_id, definition_version)`, so rewriting a published
 *      version would silently change the rules of runs already scored against it.
 *   2. **Deactivation preserves.** It flips a flag; nothing is deleted, and a retired
 *      version still resolves for any run pinned to it.
 *   3. **Publication and its audit entry commit together**, in one transaction, so the log
 *      can never claim a publication that did not happen or miss one that did.
 */

export class ScenarioManagerError extends Error {
  constructor(code, message, details = null, status = 422) {
    super(message)
    this.name = 'ScenarioManagerError'
    this.code = code
    this.status = status
    this.details = details
    this.isDomainError = true
  }
}

const fail = (code, message, details, status) => {
  throw new ScenarioManagerError(code, message, details, status)
}

/* ------------------------------------------------------------------ *
 * Input
 * ------------------------------------------------------------------ */

/**
 * Splits an authoring payload into the fields the administrator may set and the ones the
 * server owns - rejecting rather than ignoring the latter.
 *
 * Ignoring would be quieter and worse: a client that thinks it set `active: true` and got
 * a 200 has been misled about whether its scenario is live.
 */
export function takeAuthorableFields(body, { allowScenarioId = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    fail('FORBIDDEN_FIELD', 'A scenario payload must be an object.')
  }

  const allowed = allowScenarioId ? [...AUTHORABLE_FIELDS, ...CREATE_ONLY_FIELDS] : AUTHORABLE_FIELDS
  const keys = Object.keys(body)

  const serverOwned = keys.filter((key) => SERVER_CONTROLLED_FIELDS.includes(key))
  if (serverOwned.length) {
    fail('FORBIDDEN_FIELD',
      'The server decides these values; they cannot be supplied by the client.',
      { rejected_fields: serverOwned })
  }

  const unknown = keys.filter((key) => !allowed.includes(key))
  if (unknown.length) {
    fail('FORBIDDEN_FIELD',
      allowScenarioId
        ? 'The payload contains fields that are not part of a scenario.'
        : 'The payload contains fields that are not editable, or not part of a scenario.',
      { rejected_fields: unknown })
  }

  const clean = {}
  for (const key of keys) clean[key] = body[key]
  return clean
}

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

/**
 * Every synthetic asset reference, checked against the assets the scenario actually
 * carries - and every asset checked for anything that could reach a real destination.
 *
 * The stage -> asset direction is already covered by DATA-001's own validator. What is
 * added here is the authoring direction the importer never needed: an administrator can
 * type a `display_target`, so each one is held to the same reserved-host rule the imported
 * content was generated under.
 */
export function validateSyntheticSafety(definition) {
  const errors = []
  const assets = definition?.synthetic?.assets ?? []

  const seen = new Set()
  for (const asset of assets) {
    if (seen.has(asset.asset_id)) {
      errors.push(`asset "${asset.asset_id}" is declared more than once`)
    }
    seen.add(asset.asset_id)

    // An id is namespaced by its scenario, so a reference can never resolve across one.
    if (definition.scenario_id && !String(asset.asset_id).startsWith(`${definition.scenario_id}-`)) {
      errors.push(`asset "${asset.asset_id}" does not belong to ${definition.scenario_id}`)
    }

    if (asset.inert === false) {
      errors.push(`asset "${asset.asset_id}" is not marked inert`)
    }

    for (const [where, value] of collectStrings(asset)) {
      for (const url of value.match(/\b(?:https?:\/\/|ftp:\/\/|www\.)\S+/gi) ?? []) {
        const host = hostOf(url)
        if (!host || !RESERVED_HOST_PATTERN.test(host)) {
          errors.push(`asset "${asset.asset_id}" ${where} targets "${url}", which is not a reserved training domain`)
        }
      }
      if (/^data:/i.test(value.trim())) {
        errors.push(`asset "${asset.asset_id}" ${where} carries an embedded data URI`)
      }
    }
  }

  // Stage references must resolve. DATA-001 checks this too; checking before we ask the
  // model lets the manager report it as an authoring problem rather than a schema error.
  const ids = new Set(assets.map((a) => a.asset_id))
  for (const stage of definition?.stages ?? []) {
    for (const ref of stage.asset_refs ?? []) {
      if (!ids.has(ref)) {
        errors.push(`stage "${stage.key}" references unknown asset "${ref}"`)
      }
    }
  }

  return errors
}

function hostOf(url) {
  const match = String(url).replace(/^www\./i, '').match(/^(?:[a-z]+:\/\/)?([^/?#:]+)/i)
  return match ? match[1] : null
}

/**
 * Every string inside an asset, with the path it was found at.
 *
 * Walks a PLAIN object, not the Mongoose document: a subdocument carries internal
 * properties that refer back to their parent, and recursing over those exhausts the stack.
 */
function collectStrings(asset) {
  const plain = typeof asset?.toObject === 'function' ? asset.toObject() : asset
  const found = []

  const walk = (value, path, depth) => {
    if (depth > 8) return
    if (typeof value === 'string') {
      found.push([path || 'content', value])
      return
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${path}[${index}]`, depth + 1))
      return
    }
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      for (const key of Object.keys(value)) {
        if (key.startsWith('$') || key === '_id') continue
        walk(value[key], path ? `${path}.${key}` : key, depth + 1)
      }
    }
  }

  walk(plain, '', 0)
  return found
}

/**
 * Everything that must hold before a scenario may be published.
 *
 * Returns a report rather than throwing, so the manager can record a failed publication
 * in the audit log with a stable category before surfacing the problem.
 */
export async function validateForPublication(definition) {
  const problems = []

  try {
    // DATA-001's authority: six stages, keys and order, transitions, events, asset refs,
    // disposition/family agreement, trigger shape, military flag, scoring envelope.
    await definition.validate()
  } catch (error) {
    for (const detail of Object.values(error?.errors ?? {})) {
      problems.push({ category: PUBLISH_FAILURE_CODES.VALIDATION, message: detail.message })
    }
    if (!problems.length) {
      problems.push({ category: PUBLISH_FAILURE_CODES.VALIDATION, message: error.message })
    }
  }

  for (const message of validateSyntheticSafety(definition)) {
    problems.push({ category: PUBLISH_FAILURE_CODES.UNSAFE_CONTENT, message })
  }

  // The importer's own offline-safety scan, fed the document's authored text.
  for (const message of validateOfflineSafety(asImportRecord(definition))) {
    problems.push({ category: PUBLISH_FAILURE_CODES.UNSAFE_CONTENT, message })
  }

  return { ok: problems.length === 0, problems }
}

/** Adapts a definition to the shape `validateOfflineSafety` reads, so it is reused as-is. */
function asImportRecord(definition) {
  const evaluation = definition.evaluation ?? {}
  return {
    scenario_id: definition.scenario_id,
    title: evaluation.title,
    family: definition.family,
    trigger: definition.trigger,
    end_state: evaluation.end_state,
    feedback: [
      evaluation.feedback?.result,
      evaluation.feedback?.safe_action,
      evaluation.feedback?.impact,
      evaluation.feedback?.prevention_habit,
      ...(evaluation.feedback?.cues ?? []),
    ].filter(Boolean).join(' '),
    stages: (definition.stages ?? []).map((stage, index) => ({
      learner_flow: evaluation.stages?.[index]?.learner_flow,
      ui_to_build: stage.ui_to_build,
      expected_safe_behavior: evaluation.stages?.[index]?.expected_safe_behavior,
      scoring_event: evaluation.stages?.[index]?.scoring_text,
    })),
  }
}

/* ------------------------------------------------------------------ *
 * Reading
 * ------------------------------------------------------------------ */

/** The shape an administrator receives. Authoring data, never learner data. */
export function toAdminSummary(definition) {
  return {
    id: definition._id.toString(),
    scenario_id: definition.scenario_id,
    version: definition.version,
    lifecycle: lifecycleOf(definition),
    active: definition.active,
    platform: definition.platform,
    level: definition.level,
    disposition: definition.disposition,
    canonical_family: definition.canonical_family,
    military_flag: definition.military_flag,
    asset_count: definition.synthetic?.assets?.length ?? 0,
    owner: definition.owner ?? null,
    published_at: definition.published_at ?? null,
    updated_at: definition.updatedAt ?? null,
  }
}

/**
 * The full authoring record, including the evaluation block.
 *
 * This is an authenticated instructor surface, so evaluation data is legitimate here -
 * an author cannot edit what they cannot see. It carries no learner data of any kind:
 * no attempt, no run, no event, no typed rationale.
 */
export function toAdminDetail(definition) {
  return {
    ...toAdminSummary(definition),
    family: definition.family,
    trigger: definition.trigger,
    canonical_triggers: [...(definition.canonical_triggers ?? [])],
    legitimate_control: definition.legitimate_control,
    schema_version: definition.schema_version,
    scoring: definition.scoring,
    quality: definition.quality,
    review_date: definition.review_date ?? null,
    synthetic: definition.synthetic,
    stages: definition.stages,
    evaluation: definition.evaluation ?? null,
  }
}

/** A bounded, allowlisted, deterministically sorted page. No client query reaches Mongo. */
export async function listScenarios(filters = {}) {
  const query = {}

  for (const key of SCENARIO_LIST_FILTERS) {
    const value = filters[key]
    if (value === undefined || value === null || value === '') continue

    if (key === 'lifecycle') {
      // A lifecycle filter must also match the 100 rows written before the field existed.
      if (value === 'published') query.$or = [{ lifecycle_state: 'published' }, { lifecycle_state: { $exists: false }, active: true }]
      else if (value === 'draft') query.$or = [{ lifecycle_state: 'draft' }, { lifecycle_state: { $exists: false }, active: false }]
      else query.lifecycle_state = 'retired'
      continue
    }
    if (key === 'active' || key === 'military_flag') {
      query[key] = value === true || value === 'true'
      continue
    }
    // Coerced to a string, so an object like {$ne: null} can never arrive as an operator.
    query[key] = String(value)
  }

  const size = Math.min(Math.max(Number(filters.page_size) || SCENARIO_PAGE_SIZE_DEFAULT, 1),
    SCENARIO_PAGE_SIZE_MAX)
  const page = Math.max(Number(filters.page) || 1, 1)
  const sort = SCENARIO_SORTS[filters.sort] ?? SCENARIO_SORTS[SCENARIO_SORT_DEFAULT]

  const [rows, total] = await Promise.all([
    ScenarioDefinition.find(query).sort({ ...sort, _id: 1 }).skip((page - 1) * size).limit(size),
    ScenarioDefinition.countDocuments(query),
  ])

  return {
    scenarios: rows.map(toAdminSummary),
    page,
    page_size: size,
    total,
    total_pages: Math.max(Math.ceil(total / size), 1),
  }
}

/** Every version of one scenario, newest first. History is never hidden from an author. */
export async function getScenarioVersions(scenarioId) {
  const rows = await ScenarioDefinition.find({ scenario_id: String(scenarioId).toUpperCase() })
    .select('+evaluation')
    .sort({ version: -1 })
  if (!rows.length) fail('SCENARIO_NOT_FOUND', 'No scenario with that id.', null, 404)
  return { scenario_id: rows[0].scenario_id, versions: rows.map(toAdminDetail) }
}

/** One version, or 404. */
export async function getScenarioVersion(scenarioId, version) {
  // A path segment such as `versions/abc` casts to NaN, which Mongoose rejects with a
  // CastError (a 500). No such version can exist, so it is the same 404 as a missing one.
  const wanted = Number(version)
  if (!Number.isSafeInteger(wanted) || wanted < 1) {
    fail('SCENARIO_NOT_FOUND', 'No such scenario version.', null, 404)
  }
  const found = await ScenarioDefinition.findOne({
    scenario_id: String(scenarioId).toUpperCase(),
    version: wanted,
  }).select('+evaluation')
  if (!found) fail('SCENARIO_NOT_FOUND', 'No such scenario version.', null, 404)
  return found
}

async function highestVersion(scenarioId, session = null) {
  const latest = await ScenarioDefinition
    .findOne({ scenario_id: scenarioId })
    .select('version')
    .sort({ version: -1 })
    .session(session)
  return latest?.version ?? 0
}

/* ------------------------------------------------------------------ *
 * Create
 * ------------------------------------------------------------------ */

/**
 * A new scenario, as version 1, always a draft.
 *
 * Nothing is published by creation: the specification requires validation "before
 * publishing", so publication is a separate, deliberate step.
 */
export async function createScenario(body) {
  const fields = takeAuthorableFields(body, { allowScenarioId: true })

  const scenarioId = String(fields.scenario_id ?? '').trim().toUpperCase()
  if (!SCENARIO_ID_PATTERN.test(scenarioId)) {
    fail('SCENARIO_VALIDATION_FAILED', 'scenario_id must look like W01, I25, E07 or S14.')
  }
  if (await ScenarioDefinition.exists({ scenario_id: scenarioId })) {
    fail('SCENARIO_EXISTS', 'A scenario with that id already exists. Clone it instead.', null, 409)
  }

  const draft = new ScenarioDefinition({
    ...fields,
    scenario_id: scenarioId,
    version: 1,
    active: false,
    lifecycle_state: 'draft',
    published_at: null,
  })

  await assertValid(draft)
  await draft.save()
  return draft
}

/**
 * A draft is held to the same validator as a publication.
 *
 * Deliberately strict: a draft that cannot be published is not a useful thing to store,
 * and finding out at authoring time is cheaper than finding out at publication.
 */
async function assertValid(definition) {
  const report = await validateForPublication(definition)
  if (!report.ok) {
    fail('SCENARIO_VALIDATION_FAILED', 'This scenario is not valid.',
      { problems: report.problems.map((p) => p.message).slice(0, 25) })
  }
}

/* ------------------------------------------------------------------ *
 * Edit
 * ------------------------------------------------------------------ */

/**
 * Edits a version, respecting what that version is.
 *
 * A draft is rewritten in place. A published or retired version is **never** rewritten:
 * the edit becomes the next version, as a draft, and the original is left exactly as it
 * was. That is what keeps a resolved `ScenarioRun` reproducible - it is pinned to
 * `(scenario_id, definition_version)`, and that document still says what it said.
 *
 * The response reports which happened, so the change is never silent.
 */
export async function editScenarioVersion(scenarioId, version, body) {
  const fields = takeAuthorableFields(body)
  const current = await getScenarioVersion(scenarioId, version)
  const state = lifecycleOf(current)

  if (EDITABLE_IN_PLACE.includes(state)) {
    current.set(fields)
    await assertValid(current)
    await current.save()
    return { definition: current, created_version: null, edited_in_place: true }
  }

  // Published or retired: branch a new draft rather than touching history.
  const next = new ScenarioDefinition({
    ...toAuthoringSnapshot(current),
    ...fields,
    scenario_id: current.scenario_id,
    version: (await highestVersion(current.scenario_id)) + 1,
    active: false,
    lifecycle_state: 'draft',
    published_at: null,
  })

  await assertValid(next)
  await next.save()
  return { definition: next, created_version: next.version, edited_in_place: false }
}

/**
 * The authoring content of a version, with every identity, lifecycle and timestamp field
 * left behind.
 *
 * Used by both edit-as-new-version and clone, so neither can accidentally carry an `_id`,
 * a publication timestamp or an active flag into a new document.
 */
export function toAuthoringSnapshot(definition) {
  const source = definition.toObject ? definition.toObject() : definition
  const snapshot = {}
  for (const key of AUTHORABLE_FIELDS) {
    if (source[key] !== undefined) snapshot[key] = source[key]
  }
  return snapshot
}

/* ------------------------------------------------------------------ *
 * Clone
 * ------------------------------------------------------------------ */

/**
 * Copies a version's authoring content into a new draft.
 *
 * Two shapes, both unpublished:
 *   - a new version of the same scenario (no `targetScenarioId`);
 *   - a brand-new scenario, when a target id is given.
 *
 * A clone into a new scenario rewrites every asset id onto the new scenario's namespace,
 * because an asset id is namespaced by its scenario and a reference must never resolve
 * across one.
 */
export async function cloneScenarioVersion(scenarioId, version, { targetScenarioId = null } = {}) {
  const source = await getScenarioVersion(scenarioId, version)
  const snapshot = toAuthoringSnapshot(source)

  let newId = source.scenario_id
  let newVersion = (await highestVersion(source.scenario_id)) + 1

  if (targetScenarioId) {
    newId = String(targetScenarioId).trim().toUpperCase()
    if (!SCENARIO_ID_PATTERN.test(newId)) {
      fail('SCENARIO_VALIDATION_FAILED', 'The target scenario_id must look like W01, I25, E07 or S14.')
    }
    if (await ScenarioDefinition.exists({ scenario_id: newId })) {
      fail('SCENARIO_EXISTS', 'A scenario with that id already exists.', null, 409)
    }
    newVersion = 1
    renameAssetNamespace(snapshot, source.scenario_id, newId)
  }

  const clone = new ScenarioDefinition({
    ...snapshot,
    scenario_id: newId,
    version: newVersion,
    active: false,
    lifecycle_state: 'draft',
    published_at: null,
  })

  await assertValid(clone)
  await clone.save()
  return clone
}

/** Moves every asset id and stage reference onto the new scenario's namespace. */
function renameAssetNamespace(snapshot, fromId, toId) {
  const rename = (id) => (String(id).startsWith(`${fromId}-`)
    ? `${toId}-${String(id).slice(fromId.length + 1)}`
    : id)

  for (const asset of snapshot.synthetic?.assets ?? []) {
    asset.asset_id = rename(asset.asset_id)
  }
  for (const stage of snapshot.stages ?? []) {
    stage.asset_refs = (stage.asset_refs ?? []).map(rename)
  }
}

/* ------------------------------------------------------------------ *
 * Publish
 * ------------------------------------------------------------------ */

/**
 * Publishes a draft, and retires whichever version was active before it.
 *
 * The state change and its `SCENARIO_PUBLISHED` audit entry commit in ONE transaction, so
 * the log can never claim a publication that rolled back, nor miss one that landed.
 *
 * Validation runs before the transaction opens and again on the version re-read inside it,
 * so a concurrent edit cannot slip an invalid document past the gate.
 */
export async function publishScenarioVersion(scenarioId, version, { actor, idempotencyKey = null } = {}) {
  const target = await getScenarioVersion(scenarioId, version)
  const state = lifecycleOf(target)

  if (state === 'published') {
    // Idempotent: publishing what is already live changes nothing and logs nothing.
    return { definition: target, changed: false, previously_active_version: null }
  }
  if (state === 'retired') {
    fail('SCENARIO_NOT_DRAFT',
      'A retired version cannot be republished. Clone it to a new draft first.', null, 409)
  }

  const report = await validateForPublication(target)
  if (!report.ok) {
    // A refused publication is worth recording; the reason is a stable category, never
    // the scenario's content and never a stack trace.
    await recordPublishFailure({ actor, target, report })
    fail('SCENARIO_VALIDATION_FAILED', 'This scenario cannot be published.',
      { problems: report.problems.map((p) => p.message).slice(0, 25) })
  }

  await assertTransactionSupport()
  const { result } = await withEngineTransaction(async (session) => {
    const fresh = await ScenarioDefinition
      .findOne({ scenario_id: target.scenario_id, version: target.version })
      .select('+evaluation')
      .session(session)
    if (!fresh) fail('SCENARIO_NOT_FOUND', 'No such scenario version.', null, 404)
    if (lifecycleOf(fresh) !== 'draft') {
      fail('SCENARIO_ALREADY_PUBLISHED',
        'This version is no longer a draft; another administrator changed it.', null, 409)
    }

    // Retire the version currently live, so exactly one stays active.
    const previous = await ScenarioDefinition
      .findOne({ scenario_id: fresh.scenario_id, active: true, version: { $ne: fresh.version } })
      .session(session)
    if (previous) {
      previous.active = false
      previous.lifecycle_state = 'retired'
      await previous.save({ session })
    }

    fresh.active = true
    fresh.lifecycle_state = 'published'
    fresh.published_at = new Date()
    await fresh.save({ session })

    await append({
      actor,
      action: 'SCENARIO_PUBLISHED',
      resourceType: 'scenario_definition',
      resourceId: fresh.scenario_id,
      metadata: {
        scenario_id: fresh.scenario_id,
        scenario_version: fresh.version,
        scenario_platform: fresh.platform,
        ...(previous ? { previously_active_version: previous.version } : {}),
      },
      idempotencyKey,
      session,
    })

    return { definition: fresh, changed: true, previously_active_version: previous?.version ?? null }
  })

  return result
}

/** A refused publication, logged outside any transaction because nothing was written. */
async function recordPublishFailure({ actor, target, report }) {
  const category = report.problems.find((p) => p.category === PUBLISH_FAILURE_CODES.UNSAFE_CONTENT)
    ? PUBLISH_FAILURE_CODES.UNSAFE_CONTENT
    : PUBLISH_FAILURE_CODES.VALIDATION

  try {
    await append({
      actor,
      action: 'SCENARIO_PUBLISHED',
      resourceType: 'scenario_definition',
      resourceId: target.scenario_id,
      status: 'failed',
      errorCode: category,
      metadata: {
        scenario_id: target.scenario_id,
        scenario_version: target.version,
        scenario_platform: target.platform,
      },
    })
  } catch {
    // The publication is being refused either way; a logging failure must not mask why.
  }
}

/* ------------------------------------------------------------------ *
 * Deactivate
 * ------------------------------------------------------------------ */

/**
 * Retires the active version of a scenario. Nothing is deleted.
 *
 * The definition stays exactly where it is, so every `ScenarioRun` pinned to it still
 * resolves; only its availability to the selector changes. The flag flip and its
 * `SCENARIO_DEACTIVATED` audit entry commit together.
 *
 * Idempotent: deactivating an already-inactive version changes nothing and logs nothing,
 * so a retried request cannot produce a second entry claiming a second deactivation.
 */
export async function deactivateScenarioVersion(scenarioId, version, { actor, idempotencyKey = null } = {}) {
  const target = await getScenarioVersion(scenarioId, version)

  if (!target.active) {
    return { definition: target, changed: false }
  }

  await assertTransactionSupport()
  const { result } = await withEngineTransaction(async (session) => {
    const fresh = await ScenarioDefinition
      .findOne({ scenario_id: target.scenario_id, version: target.version })
      .select('+evaluation')
      .session(session)
    if (!fresh) fail('SCENARIO_NOT_FOUND', 'No such scenario version.', null, 404)
    if (!fresh.active) {
      // Another request won the race; its audit entry already records the change.
      return { definition: fresh, changed: false }
    }

    fresh.active = false
    fresh.lifecycle_state = 'retired'
    await fresh.save({ session })

    await append({
      actor,
      action: 'SCENARIO_DEACTIVATED',
      resourceType: 'scenario_definition',
      resourceId: fresh.scenario_id,
      metadata: {
        scenario_id: fresh.scenario_id,
        scenario_version: fresh.version,
        scenario_platform: fresh.platform,
      },
      idempotencyKey,
      session,
    })

    return { definition: fresh, changed: true }
  })

  return result
}
