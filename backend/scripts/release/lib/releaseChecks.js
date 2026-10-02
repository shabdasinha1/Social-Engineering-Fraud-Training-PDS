import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'

import { AdminUser } from '../../../src/models/AdminUser.js'
import { Assessment } from '../../../src/models/Assessment.js'
import { Attempt } from '../../../src/models/Attempt.js'
import { AuditEvent } from '../../../src/models/AuditEvent.js'
import { Candidate } from '../../../src/models/Candidate.js'
import { Configuration } from '../../../src/models/Configuration.js'
import { ProgressSnapshot } from '../../../src/models/ProgressSnapshot.js'
import { Scenario } from '../../../src/models/Scenario.js'
import { ScenarioDefinition } from '../../../src/models/ScenarioDefinition.js'
import { ScenarioEvent } from '../../../src/models/ScenarioEvent.js'
import { ScenarioRun } from '../../../src/models/ScenarioRun.js'
import {
  CANONICAL_FAMILIES,
  CANONICAL_TRIGGERS,
  LEGITIMATE_FAMILIES,
  PLATFORMS,
  STAGE_KEYS,
  TAXONOMY_VERSION,
  TRIGGER_TAXONOMY_VERSION,
} from '../../../src/constants/scenarioDefinition.js'
import { CONFIG_SCOPE, FEEDBACK_TIMING_DEFAULTS } from '../../../src/constants/instructorControls.js'
import { ATTEMPT_SCENARIO_COUNT, DISPOSITION_QUOTA } from '../../../src/constants/scenarioSelection.js'
import {
  EXPECTED,
  bankFingerprint,
  contentFingerprint,
  contentFingerprintOfDocument,
  loadSourceScenarios,
  loadSyntheticContent,
  loadTaxonomies,
  toScenarioDefinition,
} from '../../../src/services/scenarioDefinitionImportService.js'
import { resolveIntent } from '../../../src/services/scenarioEngineService.js'
import { MAPPED_SCENARIO_IDS, controlsForScenario } from '../../../src/services/learnerActionService.js'
import { selectAttemptScenarios } from '../../../src/services/scenarioSelectionService.js'
import { getPoolSummary } from '../../../src/services/scenarioImportService.js'

/**
 * MIGRATION-001 - the production-release invariants, as one reusable check list.
 *
 * READ-ONLY. Every check reads the connected database or the repository's source files;
 * nothing here writes, creates an index or repairs data. A violated invariant is reported
 * as a failure, never fixed - fixing is a human decision.
 */

export const BACKEND_DIR = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)))
const DATA_DIR = path.join(BACKEND_DIR, 'data')
const MAP_DIR = path.join(DATA_DIR, 'learner-actions', 'v1')
const FRONTEND_SRC = path.resolve(BACKEND_DIR, '..', 'frontend', 'src')

/** Every model the application registers. Their collections are the release schema. */
export const MODELS = [
  AdminUser, Assessment, Attempt, AuditEvent, Candidate, Configuration,
  ProgressSnapshot, Scenario, ScenarioDefinition, ScenarioEvent, ScenarioRun,
]

/**
 * What each collection must hold in a freshly built release.
 *
 * `exact` - the count the release must have. `max` - an upper bound, for the one
 * collection the application creates lazily on first use.
 */
export const RELEASE_COLLECTIONS = {
  scenariodefinitions: { exact: EXPECTED.total, role: 'authoritative content - the final 100-scenario bank' },
  configurations: { max: 1, role: 'instructor settings singleton - created on first read with documented defaults' },
  adminusers: { exact: 0, role: 'admin foundation - accounts are created on the target machine with `npm run admin:create`' },
  candidates: { exact: 0, role: 'operational - learner profiles' },
  attempts: { exact: 0, role: 'operational - attempts' },
  scenarioruns: { exact: 0, role: 'operational - scenario runs' },
  scenarioevents: { exact: 0, role: 'operational - event ledger' },
  progresssnapshots: { exact: 0, role: 'derived - rebuilt from completed attempts' },
  auditevents: { exact: 0, role: 'operational - append-only instructor audit log' },
  assessments: { exact: 0, role: 'legacy 40-scenario journey - operational' },
  scenarios: { exact: 0, role: 'legacy 40-scenario bank - not migrated (see MIGRATION-001)' },
}

export const EXPECTED_SCENARIO_IDS = Object.freeze(['W', 'I', 'E', 'S'].flatMap((p) =>
  Array.from({ length: EXPECTED.perPlatform }, (_, i) => `${p}${String(i + 1).padStart(2, '0')}`)))

const PREFIX_PLATFORM = { W: 'whatsapp', I: 'instagram', E: 'email', S: 'sms' }

export const sha256 = (data) => createHash('sha256').update(data).digest('hex')
export const fileSha256 = (file) => sha256(readFileSync(file))

/* ------------------------------------------------------------------ *
 * Stable fingerprints
 * ------------------------------------------------------------------ */

function stableStringify(value) {
  if (value instanceof Date) return JSON.stringify(value.toISOString())
  if (value && typeof value === 'object' && value._bsontype === 'ObjectId') return JSON.stringify(String(value))
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

/** A stored definition minus the three fields a fresh insert always changes. */
export function definitionBody(raw) {
  const body = { ...raw }
  for (const k of ['_id', 'createdAt', 'updatedAt', '__v']) delete body[k]
  return body
}

/**
 * sha256 of the whole scenario bank as stored, `_id` and timestamps excluded.
 *
 * Deterministic across builds - two builds of the same source produce the same digest - and
 * comparable against any other database holding the same bank.
 */
export async function storedBankFingerprint(db) {
  const docs = await db.collection('scenariodefinitions').find({}).sort({ scenario_id: 1, version: 1 }).toArray()
  return sha256(docs.map((d) => stableStringify(definitionBody(d))).join('\n'))
}

/**
 * sha256 of the bank as the APPLICATION reads it: every document hydrated through the
 * ScenarioDefinition schema (so an absent path reads as its default, exactly as the running
 * server sees it), `_id`, timestamps and `__v` excluded.
 *
 * This is the digest to compare across databases. The raw digest above also moves when a
 * path is stored as an explicit default in one database and absent in another - for
 * example `published_at`, which ADMIN-001 added after the original import.
 */
export async function semanticBankFingerprint(connection) {
  const Model = connection.models.ScenarioDefinition
    ?? connection.model('ScenarioDefinition', ScenarioDefinition.schema)
  const docs = await Model.find({}).select('+evaluation').sort({ scenario_id: 1, version: 1 })
  return sha256(docs.map((d) => stableStringify(definitionBody(d.toObject()))).join('\n'))
}

/**
 * Every raw field path that differs between two databases' banks, with how often.
 * `_id` and timestamps are ignored; values are compared, paths are dotted.
 */
export async function rawBankDifferences(dbA, dbB) {
  const flat = (o, p = '', out = {}) => {
    for (const [k, v] of Object.entries(o ?? {})) {
      const key = p ? `${p}.${k}` : k
      if (v && typeof v === 'object' && !(v instanceof Date) && v._bsontype !== 'ObjectId') flat(v, key, out)
      else out[key] = v
    }
    return out
  }
  const load = async (db) => new Map((await db.collection('scenariodefinitions').find({}).toArray())
    .map((d) => [`${d.scenario_id}@${d.version}`, flat(definitionBody(d))]))
  const [a, b] = [await load(dbA), await load(dbB)]
  const diffs = {}
  for (const key of new Set([...a.keys(), ...b.keys()])) {
    const fa = a.get(key)
    const fb = b.get(key)
    if (!fa || !fb) { diffs[`<document ${key} missing on one side>`] = (diffs[`<document ${key} missing on one side>`] ?? 0) + 1; continue }
    for (const p of new Set([...Object.keys(fa), ...Object.keys(fb)])) {
      if (stableStringify(fa[p]) !== stableStringify(fb[p])) {
        const label = `${p}: ${p in fa ? stableStringify(fa[p]) : '<absent>'} vs ${p in fb ? stableStringify(fb[p]) : '<absent>'}`
        diffs[label] = (diffs[label] ?? 0) + 1
      }
    }
  }
  return diffs
}

/** Source file digests for the manifest: scenario bank, synthetic content, taxonomy, action maps. */
export function sourceFileDigests() {
  const out = {}
  for (const dir of ['scenarios/v1', 'synthetic/v1', 'learner-actions/v1', 'taxonomy']) {
    const abs = path.join(DATA_DIR, dir)
    for (const f of readdirSync(abs).sort()) {
      const p = path.join(abs, f)
      if (statSync(p).isFile()) out[`backend/data/${dir}/${f}`] = fileSha256(p)
    }
  }
  return out
}

/* ------------------------------------------------------------------ *
 * Duplicate-key detection
 *
 * JSON.parse keeps the LAST of two equal keys and says nothing, so a control mapped twice in
 * one object would silently lose one mapping. This scanner walks the raw text instead.
 * ------------------------------------------------------------------ */

export function findDuplicateJsonKeys(text) {
  const dupes = []
  let i = 0
  const ws = () => { while (/\s/.test(text[i])) i += 1 }
  const str = () => {
    let s = ''
    i += 1
    while (text[i] !== '"') {
      if (text[i] === '\\') { s += text[i] + text[i + 1]; i += 2 } else { s += text[i]; i += 1 }
    }
    i += 1
    return s
  }
  const value = (where) => {
    ws()
    if (text[i] === '{') {
      i += 1
      const seen = new Set()
      ws()
      if (text[i] === '}') { i += 1; return }
      for (;;) {
        ws()
        const key = str()
        if (seen.has(key)) dupes.push(`${where}.${key}`)
        seen.add(key)
        ws(); i += 1 // ':'
        value(`${where}.${key}`)
        ws()
        if (text[i] === ',') { i += 1; continue }
        i += 1 // '}'
        return
      }
    }
    if (text[i] === '[') {
      i += 1
      ws()
      if (text[i] === ']') { i += 1; return }
      let n = 0
      for (;;) {
        value(`${where}[${n}]`)
        n += 1
        ws()
        if (text[i] === ',') { i += 1; continue }
        i += 1
        return
      }
    }
    if (text[i] === '"') { str(); return }
    while (i < text.length && !/[\s,}\]]/.test(text[i])) i += 1
  }
  value('$')
  return dupes
}

/* ------------------------------------------------------------------ *
 * The check runner
 * ------------------------------------------------------------------ */

class Report {
  constructor() { this.checks = [] }

  check(id, title, fn) { this.checks.push({ id, title, fn }) }

  async run() {
    const results = []
    for (const { id, title, fn } of this.checks) {
      let problems
      let detail
      try {
        const out = (await fn()) ?? {}
        problems = out.problems ?? []
        detail = out.detail ?? null
      } catch (error) {
        problems = [`check threw: ${error.message}`]
      }
      results.push({ id, title, status: problems.length ? 'FAIL' : 'PASS', problems, detail })
    }
    return results
  }
}

const tally = (items) => items.reduce((a, k) => ({ ...a, [k]: (a[k] ?? 0) + 1 }), {})

/**
 * Runs every release invariant against the database mongoose is connected to.
 *
 * @returns {{ status: 'PASS'|'FAIL', results: object[], figures: object }}
 */
export async function runReleaseChecks({ selectionSeeds = 200 } = {}) {
  const db = mongoose.connection.db
  const report = new Report()
  const figures = {}

  const taxonomies = await loadTaxonomies()
  const { manifest: sourceManifest, scenarios: sourceScenarios } = await loadSourceScenarios()
  const { manifest: syntheticManifest, byScenario: syntheticSource } = await loadSyntheticContent()

  const definitions = await ScenarioDefinition.find({}).select('+evaluation').sort({ scenario_id: 1 })
  const active = definitions.filter((d) => d.active)
  const plainActive = active.map((d) => d.toObject())

  /* 1. collections --------------------------------------------------- */
  report.check('collections', 'Exactly the application collections exist', async () => {
    const names = (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name)
    const expected = MODELS.map((m) => m.collection.collectionName)
    const problems = []
    for (const n of expected) if (!names.includes(n)) problems.push(`missing collection "${n}"`)
    for (const n of names) if (!expected.includes(n)) problems.push(`unexpected collection "${n}"`)
    return { problems, detail: names.sort() }
  })

  /* 2. indexes ------------------------------------------------------- */
  report.check('indexes', 'Every index the models declare exists, and nothing else', async () => {
    const problems = []
    const detail = {}
    for (const model of MODELS) {
      const name = model.collection.collectionName
      const { toDrop, toCreate } = await model.diffIndexes()
      for (const ix of toCreate) problems.push(`${name}: missing index ${JSON.stringify(ix)}`)
      for (const ix of toDrop) problems.push(`${name}: index "${ix}" is not declared by the model`)
      detail[name] = (await db.collection(name).indexes()).map((ix) => ix.name + (ix.unique ? ' (unique)' : ''))
    }
    const unique = {
      'scenariodefinitions': 'scenario_id_1_version_1',
      'candidates': 'identifierNormalised_1',
      'adminusers': 'usernameNormalised_1',
      'scenarioevents': 'intent_key_1',
      'scenarioruns': 'attempt_id_1_ordinal_1',
      'configurations': 'scope_1',
      'progresssnapshots': 'profile_id_1',
    }
    for (const [coll, ixName] of Object.entries(unique)) {
      const ix = (await db.collection(coll).indexes()).find((x) => x.name === ixName)
      if (!ix?.unique) problems.push(`${coll}: "${ixName}" must be a unique index`)
    }
    const seq = (await db.collection('scenarioevents').indexes()).find((x) => x.name === 'run_id_1_sequence_1')
    if (!seq?.unique) problems.push('scenarioevents: run_id_1_sequence_1 must be unique')
    return { problems, detail }
  })

  /* 3. collection contents ------------------------------------------- */
  report.check('operational-state', 'Operational collections are clean; only the bank is populated', async () => {
    const problems = []
    const detail = {}
    for (const [name, rule] of Object.entries(RELEASE_COLLECTIONS)) {
      const n = await db.collection(name).countDocuments()
      detail[name] = n
      if (rule.exact !== undefined && n !== rule.exact) problems.push(`${name}: expected ${rule.exact} documents, found ${n}`)
      if (rule.max !== undefined && n > rule.max) problems.push(`${name}: expected at most ${rule.max} documents, found ${n}`)
    }
    const configs = await Configuration.find({}).lean()
    for (const c of configs) {
      if (c.scope !== CONFIG_SCOPE
        || c.training_feedback_timing !== FEEDBACK_TIMING_DEFAULTS.training
        || c.assessment_feedback_timing !== FEEDBACK_TIMING_DEFAULTS.assessment
        || c.updated_by !== null) {
        problems.push('configurations: the singleton is not the documented default')
      }
    }
    figures.collection_counts = detail
    return { problems, detail }
  })

  /* 4. legacy -------------------------------------------------------- */
  report.check('legacy-not-playable', 'No legacy scenario can be selected', async () => {
    const problems = []
    const activeLegacy = await Scenario.countDocuments({ isActive: true })
    if (activeLegacy) problems.push(`${activeLegacy} legacy scenario(s) are active and selectable by POST /api/assessments`)
    const pool = await getPoolSummary()
    if (pool.total !== 0) problems.push(`legacy pool summary reports ${pool.total} playable scenarios`)
    return { problems, detail: { legacy_documents: await Scenario.countDocuments(), legacy_active: activeLegacy, pool_summary_total: pool.total } }
  })

  /* 5. bank identity -------------------------------------------------- */
  report.check('bank-ids', 'The active bank is exactly W01-W25, I01-I25, E01-E25, S01-S25', async () => {
    const problems = []
    const ids = active.map((d) => d.scenario_id)
    const dupes = Object.entries(tally(ids)).filter(([, n]) => n > 1).map(([id]) => id)
    if (dupes.length) problems.push(`scenario ids active more than once: ${dupes.join(', ')}`)
    for (const id of EXPECTED_SCENARIO_IDS) if (!ids.includes(id)) problems.push(`missing scenario ${id}`)
    for (const id of ids) if (!EXPECTED_SCENARIO_IDS.includes(id)) problems.push(`unexpected scenario ${id}`)
    if (definitions.length !== active.length) problems.push(`${definitions.length - active.length} inactive definition(s) present`)
    const versions = tally(active.map((d) => d.version))
    if (Object.keys(versions).length !== 1) problems.push(`active bank spans versions ${JSON.stringify(versions)}`)
    for (const d of active) {
      if (PREFIX_PLATFORM[d.scenario_id[0]] !== d.platform) problems.push(`${d.scenario_id}: platform "${d.platform}"`)
      if (!Number.isInteger(d.version) || d.version < 1) problems.push(`${d.scenario_id}: invalid version ${d.version}`)
    }
    return { problems, detail: { active: active.length, total: definitions.length, versions } }
  })

  /* 6. schema -------------------------------------------------------- */
  report.check('schema', 'Every stored definition passes the application schema', async () => {
    const problems = []
    for (const d of definitions) {
      try {
        await new ScenarioDefinition(d.toObject()).validate()
      } catch (error) {
        for (const [p, e] of Object.entries(error.errors ?? { _: error })) problems.push(`${d.scenario_id}: ${p}: ${e.message}`)
      }
    }
    return { problems }
  })

  /* 7. distributions -------------------------------------------------- */
  report.check('distribution', 'Counts per platform, disposition and difficulty match the specification', async () => {
    const problems = []
    const platform = tally(plainActive.map((d) => d.platform))
    const disposition = tally(plainActive.map((d) => d.disposition))
    const level = tally(plainActive.map((d) => d.level))
    const cross = (a, b) => plainActive.reduce((acc, d) => {
      acc[d[a]] ??= {}
      acc[d[a]][d[b]] = (acc[d[a]][d[b]] ?? 0) + 1
      return acc
    }, {})
    const pxd = cross('platform', 'disposition')
    const pxl = cross('platform', 'level')
    const lxd = cross('level', 'disposition')

    if (active.length !== EXPECTED.total) problems.push(`expected ${EXPECTED.total} active, found ${active.length}`)
    for (const p of PLATFORMS) {
      if (platform[p] !== EXPECTED.perPlatform) problems.push(`${p}: expected ${EXPECTED.perPlatform}, found ${platform[p] ?? 0}`)
      if ((pxd[p]?.malicious ?? 0) !== EXPECTED.malicious / 4) problems.push(`${p}: expected ${EXPECTED.malicious / 4} malicious, found ${pxd[p]?.malicious ?? 0}`)
      if ((pxd[p]?.legitimate ?? 0) !== EXPECTED.legitimate / 4) problems.push(`${p}: expected ${EXPECTED.legitimate / 4} legitimate, found ${pxd[p]?.legitimate ?? 0}`)
      for (const [lvl, want] of Object.entries(EXPECTED.perPlatformLevel)) {
        if ((pxl[p]?.[lvl] ?? 0) !== want) problems.push(`${p}: expected ${want} ${lvl}, found ${pxl[p]?.[lvl] ?? 0}`)
      }
    }
    if (disposition.malicious !== EXPECTED.malicious) problems.push(`expected ${EXPECTED.malicious} malicious, found ${disposition.malicious ?? 0}`)
    if (disposition.legitimate !== EXPECTED.legitimate) problems.push(`expected ${EXPECTED.legitimate} legitimate, found ${disposition.legitimate ?? 0}`)

    Object.assign(figures, {
      platform, disposition, level,
      platform_x_disposition: pxd, platform_x_level: pxl, level_x_disposition: lxd,
      canonical_family: tally(plainActive.map((d) => d.canonical_family)),
      canonical_triggers: tally(plainActive.flatMap((d) => d.canonical_triggers)),
      raw_family_count: Object.keys(tally(plainActive.map((d) => d.family))).length,
      military: plainActive.filter((d) => d.military_flag).length,
      military_by_platform: tally(plainActive.filter((d) => d.military_flag).map((d) => d.platform)),
      military_by_disposition: tally(plainActive.filter((d) => d.military_flag).map((d) => d.disposition)),
      multi_trigger: plainActive.filter((d) => d.canonical_triggers.length > 1).length,
    })
    return { problems }
  })

  /* 8. taxonomy ------------------------------------------------------ */
  report.check('taxonomy', 'Families and triggers are canonical, current and unchanged', async () => {
    const problems = []
    const fileFamilies = [...taxonomies.family.canonical_families.malicious, ...taxonomies.family.canonical_families.legitimate]
    const fileTriggers = Array.isArray(taxonomies.trigger.canonical_triggers)
      ? taxonomies.trigger.canonical_triggers.map((t) => (typeof t === 'string' ? t : t.id))
      : Object.keys(taxonomies.trigger.canonical_triggers)
    if (taxonomies.family.version !== TAXONOMY_VERSION) problems.push(`family taxonomy file ${taxonomies.family.version} != code ${TAXONOMY_VERSION}`)
    if (taxonomies.trigger.version !== TRIGGER_TAXONOMY_VERSION) problems.push(`trigger taxonomy file ${taxonomies.trigger.version} != code ${TRIGGER_TAXONOMY_VERSION}`)
    for (const f of fileFamilies) if (!CANONICAL_FAMILIES.includes(f)) problems.push(`taxonomy file declares family "${f}" unknown to the code`)
    for (const d of plainActive) {
      const where = d.scenario_id
      if (!CANONICAL_FAMILIES.includes(d.canonical_family) || !fileFamilies.includes(d.canonical_family)) problems.push(`${where}: unknown family "${d.canonical_family}"`)
      if (taxonomies.family.raw_family_to_canonical[d.family] !== d.canonical_family) problems.push(`${where}: raw family "${d.family}" does not map to "${d.canonical_family}"`)
      if (LEGITIMATE_FAMILIES.includes(d.canonical_family) !== (d.disposition === 'legitimate')) problems.push(`${where}: family/disposition disagree`)
      for (const t of d.canonical_triggers) {
        if (!CANONICAL_TRIGGERS.includes(t) || !fileTriggers.includes(t)) problems.push(`${where}: unknown trigger "${t}"`)
      }
      if (!d.canonical_triggers.length) problems.push(`${where}: no canonical trigger`)
      if (d.taxonomy_version !== taxonomies.family.version) problems.push(`${where}: taxonomy_version ${d.taxonomy_version}`)
      if (d.trigger_taxonomy_version !== taxonomies.trigger.version) problems.push(`${where}: trigger_taxonomy_version ${d.trigger_taxonomy_version}`)
      if (d.military_flag !== /\|\s*FICTIONAL MILITARY CONTEXT\s*$/.test(d.trigger)) problems.push(`${where}: military_flag disagrees with the raw trigger`)
      if (d.legitimate_control !== (d.disposition === 'legitimate')) problems.push(`${where}: legitimate_control disagrees with disposition`)
    }
    figures.taxonomy = {
      family_version: taxonomies.family.version,
      trigger_version: taxonomies.trigger.version,
      family_file_sha256: fileSha256(path.join(DATA_DIR, 'taxonomy', 'attack-family-taxonomy.v1.json')),
      trigger_file_sha256: fileSha256(path.join(DATA_DIR, 'taxonomy', 'trigger-taxonomy.v1.json')),
      families_declared: fileFamilies.length,
      families_used: new Set(plainActive.map((d) => d.canonical_family)).size,
      triggers_declared: fileTriggers.length,
      triggers_used: new Set(plainActive.flatMap((d) => d.canonical_triggers)).size,
    }
    return { problems }
  })

  /* 9. six stages ---------------------------------------------------- */
  report.check('stages', 'Six stages, safe-behaviour text, scoring and feedback on every scenario', async () => {
    const problems = []
    for (const d of plainActive) {
      const where = d.scenario_id
      const keys = (d.stages ?? []).map((s) => s.key).join(',')
      const evalKeys = (d.evaluation?.stages ?? []).map((s) => s.key).join(',')
      if (keys !== STAGE_KEYS.join(',')) problems.push(`${where}: stages are [${keys}]`)
      if (evalKeys !== STAGE_KEYS.join(',')) problems.push(`${where}: evaluation stages are [${evalKeys}]`)
      for (const s of d.stages ?? []) {
        if (!s.ui_to_build?.trim()) problems.push(`${where}/${s.key}: no ui_to_build`)
        if (!s.transitions?.length) problems.push(`${where}/${s.key}: no transitions`)
      }
      for (const s of d.evaluation?.stages ?? []) {
        if (!s.learner_flow?.trim()) problems.push(`${where}/${s.key}: no learner_flow`)
        if (!s.expected_safe_behavior?.trim()) problems.push(`${where}/${s.key}: no expected_safe_behavior`)
        if (!s.scoring?.length) problems.push(`${where}/${s.key}: no scoring events`)
      }
      const resolve = new Set((d.evaluation?.stages?.[5]?.scoring ?? []).map((s) => s.event_code))
      for (const code of ['RESOLVE_CORRECT', 'CONTRADICTORY_UNSAFE_FINAL']) {
        if (!resolve.has(code)) problems.push(`${where}: resolve stage does not declare ${code}`)
      }
      const f = d.evaluation?.feedback ?? {}
      for (const field of ['result', 'safe_action', 'impact', 'prevention_habit']) {
        if (!f[field]?.trim()) problems.push(`${where}: feedback.${field} is empty`)
      }
      if (!f.cues?.length) problems.push(`${where}: feedback.cues is empty`)
      if (!d.evaluation?.title?.trim() || !d.evaluation?.end_state?.trim()) problems.push(`${where}: title/end_state missing`)
      if (d.scoring?.min_points !== 0 || d.scoring?.max_points !== 10) problems.push(`${where}: scoring envelope ${JSON.stringify(d.scoring)}`)
    }
    return { problems }
  })

  /* 10. alignment with the authoritative source files ---------------- */
  report.check('source-alignment', 'Stored content matches the verified source bank and synthetic content', async () => {
    const problems = []
    const observedBank = bankFingerprint(sourceScenarios)
    if (observedBank !== sourceManifest.content_sha256) problems.push('source bank fingerprint disagrees with its MANIFEST (source edited?)')
    for (const r of sourceScenarios) {
      if (sourceManifest.scenario_content_sha256?.[r.scenario_id] !== contentFingerprint(r)) {
        problems.push(`${r.scenario_id}: source record disagrees with its MANIFEST fingerprint`)
      }
    }

    /**
     * Regenerate each expected document from the source through the importer's own mapping
     * (taxonomy, trigger normalisation, scoring clauses, synthetic content), apply the
     * schema defaults, and compare with what is stored - every field except `_id` and the
     * timestamps. Stricter than a fingerprint: a difference anywhere in the document fails.
     */
    const bySource = new Map(sourceScenarios.map((r) => [r.scenario_id, r]))
    const storedDigests = {}
    for (const d of active) {
      storedDigests[d.scenario_id] = contentFingerprintOfDocument(d)
      const record = bySource.get(d.scenario_id)
      if (!record) { problems.push(`${d.scenario_id}: not in the source bank`); continue }
      if (!syntheticSource.has(d.scenario_id)) problems.push(`${d.scenario_id}: no synthetic content in the source`)
      const { doc, errors } = toScenarioDefinition(record, taxonomies, {
        version: d.version, active: true, synthetic: syntheticSource.get(d.scenario_id) ?? null,
      })
      for (const e of errors) problems.push(`source mapping: ${e}`)
      const expected = definitionBody(new ScenarioDefinition(doc).toObject())
      const stored = definitionBody(d.toObject())
      if (stableStringify(expected) !== stableStringify(stored)) {
        const fields = [...new Set([...Object.keys(expected), ...Object.keys(stored)])]
          .filter((k) => stableStringify(expected[k]) !== stableStringify(stored[k]))
        problems.push(`${d.scenario_id}: stored document differs from the source in ${fields.join(', ')}`)
      }
    }
    figures.hashes = {
      source_bank_content_sha256: sourceManifest.content_sha256,
      stored_bank_internal_digest_sha256: sha256(stableStringify(Object.keys(storedDigests).sort().map((k) => storedDigests[k]))),
      synthetic_content_version: syntheticManifest?.content_version ?? null,
      synthetic_content_sha256: syntheticManifest?.content_sha256 ?? null,
      stored_definitions_raw_sha256: await storedBankFingerprint(db),
      stored_definitions_semantic_sha256: await semanticBankFingerprint(mongoose.connection),
    }
    return { problems }
  })

  /* 11. learner actions ---------------------------------------------- */
  report.check('learner-actions', 'Every scenario has a complete, unambiguous, server-side action map', async () => {
    const problems = []
    const detail = { scene_controls: 0, generic_controls: 0, per_platform: {} }

    const files = ['generic', 'whatsapp', 'instagram', 'email', 'sms']
    const mapNames = []
    for (const f of files) {
      const text = readFileSync(path.join(MAP_DIR, `${f}.json`), 'utf8')
      for (const k of findDuplicateJsonKeys(text)) problems.push(`${f}.json: duplicate key ${k}`)
      const json = JSON.parse(text)
      const entries = f === 'generic'
        ? Object.values(json.controls ?? {})
        : Object.values(json.scenes ?? {}).flatMap((s) => Object.values(s))
      for (const e of entries) {
        const extra = Object.keys(e).filter((k) => !['stage', 'intent', 'name'].includes(k))
        if (extra.length) problems.push(`${f}.json: entry carries ${extra.join(', ')} - maps hold stage and intent only`)
        if (e.name) mapNames.push(e.name)
      }
      if (/"(points|points_delta|score|event_code|expected|disposition|correct)"\s*:/.test(text)) {
        problems.push(`${f}.json: carries a scoring or answer field`)
      }
      if (f !== 'generic') {
        detail.per_platform[f] = Object.keys(json.scenes ?? {}).length
        for (const id of Object.keys(json.scenes ?? {})) {
          if (PREFIX_PLATFORM[id[0]] !== f) problems.push(`${id} is mapped in ${f}.json`)
        }
      }
    }

    const mapped = new Set(MAPPED_SCENARIO_IDS)
    for (const id of EXPECTED_SCENARIO_IDS) if (!mapped.has(id)) problems.push(`${id}: no scene action map`)
    for (const id of mapped) if (!EXPECTED_SCENARIO_IDS.includes(id)) problems.push(`${id}: mapped but not in the bank`)

    for (const d of active) {
      const controls = [...controlsForScenario(d.scenario_id).values()]
      const scene = controls.filter((c) => !c.controlId.startsWith('gen-'))
      detail.scene_controls += scene.length
      const playable = new Set()
      for (const c of controls) {
        let ok = true
        try {
          resolveIntent({ definition: d, stage: c.stage, intent: c.intent })
        } catch {
          ok = false
        }
        if (ok) playable.add(c.stage)
        else if (!c.controlId.startsWith('gen-')) problems.push(`${d.scenario_id}: scene control ${c.controlId} (${c.stage}) is refused by the engine`)
      }
      for (const stage of STAGE_KEYS) {
        if (!playable.has(stage)) problems.push(`${d.scenario_id}: no accepted control at "${stage}"`)
        if (!scene.some((c) => c.stage === stage) && stage !== 'notify') {
          problems.push(`${d.scenario_id}: the scene maps no control at "${stage}"`)
        }
      }
      // Both a correct and an incorrect final action must be reachable.
      const finals = controls.filter((c) => c.stage === 'resolve').map((c) => c.intent)
      if (!finals.some((i) => ['resolve_report', 'resolve_block', 'resolve_continue', 'resolve_retain'].includes(i))) {
        problems.push(`${d.scenario_id}: no resolution control`)
      }
    }
    detail.generic_controls = [...controlsForScenario('__none__').keys()].length

    // Authoring names state the intent ("s01-branch-submit"); they must stay server-side.
    if (existsSync(FRONTEND_SRC)) {
      const leaks = new Set()
      const walk = (dir) => {
        for (const f of readdirSync(dir)) {
          const p = path.join(dir, f)
          if (statSync(p).isDirectory()) { walk(p); continue }
          if (!/\.(jsx?|json)$/.test(f) || /\.test\.jsx?$/.test(f) || p.includes(`${path.sep}test${path.sep}`)) continue
          const text = readFileSync(p, 'utf8')
          if (/"intent"\s*:/.test(text) && /learner-actions/.test(text)) leaks.add(`${path.relative(FRONTEND_SRC, p)} embeds the action map`)
          for (const n of mapNames) if (text.includes(`'${n}'`) || text.includes(`"${n}"`)) leaks.add(`${path.relative(FRONTEND_SRC, p)} contains "${n}"`)
        }
      }
      walk(FRONTEND_SRC)
      for (const l of leaks) problems.push(`learner-facing source: ${l}`)
      detail.frontend_scan = 'frontend/src (non-test) scanned for map names'
    }
    figures.learner_actions = detail
    return { problems, detail }
  })

  /* 12. selection ---------------------------------------------------- */
  report.check('selection', 'The real selector builds valid attempts from this bank, never from legacy data', async () => {
    const problems = []
    const pool = await ScenarioDefinition.find({ active: true })
      .select('scenario_id platform level disposition canonical_family canonical_triggers military_flag version').lean()
    const seen = new Set()
    let built = 0
    for (let n = 0; n < selectionSeeds; n += 1) {
      const plan = selectAttemptScenarios({ pool, seed: `migration-001-${n}`, attemptIndex: n % 4 })
      built += 1
      if (plan.scenario_ids.length !== ATTEMPT_SCENARIO_COUNT) problems.push(`seed ${n}: ${plan.scenario_ids.length} scenarios`)
      for (const id of plan.scenario_ids) {
        if (!EXPECTED_SCENARIO_IDS.includes(id)) problems.push(`seed ${n}: selected "${id}"`)
        seen.add(id)
      }
      const disp = tally(plan.scenarios.map((s) => s.disposition))
      if (disp.malicious !== DISPOSITION_QUOTA.malicious || disp.legitimate !== DISPOSITION_QUOTA.legitimate) {
        problems.push(`seed ${n}: composition ${JSON.stringify(disp)}`)
      }
      if (new Set(plan.scenarios.map((s) => s.platform)).size !== 4) problems.push(`seed ${n}: not all four platforms`)
    }
    figures.selection = { attempts_simulated: built, distinct_scenarios_selected: seen.size }
    return { problems, detail: figures.selection }
  })

  const results = await report.run()
  return { status: results.every((r) => r.status === 'PASS') ? 'PASS' : 'FAIL', results, figures }
}

/** Prints a result list; returns true when every check passed. */
export function printResults({ status, results }) {
  for (const r of results) {
    console.log(`  [${r.status}] ${r.id.padEnd(20)} ${r.title}`)
    for (const p of r.problems.slice(0, 25)) console.log(`           - ${p}`)
    if (r.problems.length > 25) console.log(`           ... and ${r.problems.length - 25} more`)
  }
  console.log(`\n  RESULT: ${status}`)
  return status === 'PASS'
}
