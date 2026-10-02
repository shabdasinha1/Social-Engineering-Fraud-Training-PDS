import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CANONICAL_FAMILIES,
  CANONICAL_TRIGGERS,
  LEGITIMATE_FAMILIES,
  MILITARY_CONTEXT_MARKER,
  RESERVED_HOST_PATTERN,
  SCORING_EVENTS,
  STAGE_EVENTS,
  STAGE_KEYS,
  STAGE_TRANSITIONS,
} from '../constants/scenarioDefinition.js'
import { ScenarioDefinition } from '../models/ScenarioDefinition.js'

/**
 * DATA-002 - imports the client's 100 scenario definitions.
 *
 * Client content is reproduced verbatim from `backend/data/scenarios/v1/`. Everything
 * this service derives - canonical family, canonical triggers, military flag, per-stage
 * scoring - comes from a versioned taxonomy artifact or from a closed lookup table.
 * Nothing is inferred, guessed or paraphrased: an input this service does not recognise
 * fails the import rather than being mapped to its nearest neighbour.
 *
 * The whole dataset is validated before a single document is written.
 */

const DATA_DIR = path.resolve(fileURLToPath(new URL('../../data', import.meta.url)))
const SCENARIO_DIR = path.join(DATA_DIR, 'scenarios', 'v1')
const TAXONOMY_DIR = path.join(DATA_DIR, 'taxonomy')
const SYNTHETIC_DIR = path.join(DATA_DIR, 'synthetic', 'v1')

const PLATFORM_FILES = {
  whatsapp: 'scenarios.whatsapp.json',
  instagram: 'scenarios.instagram.json',
  email: 'scenarios.email.json',
  sms: 'scenarios.sms.json',
}

/** The client's own words, normalised only for case. Values are the schema enums. */
const PLATFORM_VALUES = { WhatsApp: 'whatsapp', Instagram: 'instagram', Email: 'email', SMS: 'sms' }
const LEVEL_VALUES = { Easy: 'easy', Medium: 'medium', Hard: 'hard' }
const DISPOSITION_VALUES = { Malicious: 'malicious', Legitimate: 'legitimate' }

/** Dataset-level acceptance counts from the release checklist. */
export const EXPECTED = {
  total: 100,
  perPlatform: 25,
  malicious: 80,
  legitimate: 20,
  perPlatformLevel: { easy: 8, medium: 9, hard: 8 },
}

/**
 * Closed lookup for the client's scoring clauses.
 *
 * The bank uses exactly eight distinct scoring strings, each a ';'-separated list of
 * clauses. Matching whole clauses exactly - rather than pattern-matching numbers out of
 * prose - means a reworded clause in a future revision stops the import instead of being
 * silently mis-scored.
 */
const SCORING_CLAUSES = {
  'NOTIFY_SEEN +0': { event_code: 'NOTIFY_SEEN', points_delta: 0 },
  'ITEM_OPEN +0': { event_code: 'ITEM_OPEN', points_delta: 0 },
  'premature reply/action -1': { event_code: 'PREMATURE_REPLY', points_delta: -1 },
  'INSPECT_CONTEXT +2': { event_code: 'INSPECT_CONTEXT', points_delta: 2 },
  'SAFE_PIVOT +3': { event_code: 'SAFE_PIVOT', points_delta: 3 },
  'risky open/reply -3': { event_code: 'RISKY_OPEN_REPLY', points_delta: -3, critical: true },
  'secret/payment/install/data release -8': {
    event_code: 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', points_delta: -8, critical: true,
  },
  'CORRECT_USE +3': { event_code: 'CORRECT_USE', points_delta: 3 },
  'needless reject/ignore -2': { event_code: 'NEEDLESS_REJECT_IGNORE', points_delta: -2 },
  'unsafe external action -4': {
    event_code: 'UNSAFE_EXTERNAL_ACTION', points_delta: -4, critical: true,
  },
  'TRUSTED_VERIFY +3': { event_code: 'TRUSTED_VERIFY', points_delta: 3 },
  'report-only without checking +1': { event_code: 'REPORT_ONLY_WITHOUT_CHECK', points_delta: 1 },
  'verification through message +0': { event_code: 'VERIFY_THROUGH_MESSAGE', points_delta: 0 },
  'false report/block -4': { event_code: 'FALSE_REPORT_BLOCK', points_delta: -4 },
  'RESOLVE_CORRECT +2': { event_code: 'RESOLVE_CORRECT', points_delta: 2 },
  'contradictory unsafe final -4': {
    event_code: 'CONTRADICTORY_UNSAFE_FINAL', points_delta: -4, critical: true,
  },
}

/** Clauses that carry no points: telemetry notes and the per-scenario cap restatement. */
const NON_SCORING_CLAUSES = new Set([
  'open latency and route logged',
  'dwell time logged',
  'inspection path and time logged',
  'scenario capped 0-10',
])

/* ------------------------------------------------------------------ *
 * Loading
 * ------------------------------------------------------------------ */

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'))

export async function loadTaxonomies({ dir = TAXONOMY_DIR } = {}) {
  const family = await readJson(path.join(dir, 'attack-family-taxonomy.v1.json'))
  const trigger = await readJson(path.join(dir, 'trigger-taxonomy.v1.json'))

  const errors = []
  const declared = [...family.canonical_families.malicious, ...family.canonical_families.legitimate]
  for (const f of declared) {
    if (!CANONICAL_FAMILIES.includes(f)) errors.push(`taxonomy declares unknown family "${f}"`)
  }
  for (const [raw, canon] of Object.entries(family.raw_family_to_canonical)) {
    if (!CANONICAL_FAMILIES.includes(canon)) {
      errors.push(`family map sends "${raw}" to unknown canonical family "${canon}"`)
    }
  }
  for (const [raw, canon] of Object.entries(trigger.raw_primitive_to_canonical)) {
    if (!CANONICAL_TRIGGERS.includes(canon)) {
      errors.push(`trigger map sends "${raw}" to unknown canonical trigger "${canon}"`)
    }
  }
  if (errors.length) {
    const error = new Error(`Taxonomy artifacts are invalid:\n  ${errors.join('\n  ')}`)
    error.code = 'TAXONOMY_INVALID'
    throw error
  }
  return { family, trigger }
}

/**
 * Structured synthetic content (DATA-003), keyed by scenario_id.
 *
 * A separate versioned input to the SAME import path, so one command produces a complete
 * document and re-running either dataset stays idempotent. Absent files are not an error:
 * the importer then behaves exactly as it did in DATA-002, with empty assets.
 */
export async function loadSyntheticContent({ dir = SYNTHETIC_DIR } = {}) {
  let manifest
  try {
    manifest = await readJson(path.join(dir, 'MANIFEST.json'))
  } catch {
    return { manifest: null, byScenario: new Map() }
  }
  const byScenario = new Map()
  for (const file of manifest.files) {
    for (const entry of await readJson(path.join(dir, file))) {
      byScenario.set(entry.scenario_id, entry)
    }
  }
  return { manifest, byScenario }
}

export async function loadSourceScenarios({ dir = SCENARIO_DIR } = {}) {
  const manifest = await readJson(path.join(dir, 'MANIFEST.json'))
  const scenarios = []
  for (const file of Object.values(PLATFORM_FILES)) {
    scenarios.push(...(await readJson(path.join(dir, file))))
  }
  return { manifest, scenarios }
}

/* ------------------------------------------------------------------ *
 * Content integrity
 * ------------------------------------------------------------------ */

const CONTENT_FIELDS = ['scenario_id', 'title', 'platform', 'difficulty', 'disposition',
  'family', 'trigger', 'end_state', 'feedback']
const STAGE_CONTENT_FIELDS = ['number', 'pdf_label', 'learner_flow', 'ui_to_build',
  'expected_safe_behavior', 'scoring_event']

/** Stable JSON: sorted keys, no whitespace, so the digest depends only on content. */
function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

/**
 * Fingerprints client content only. `source_page` and every database field (`_id`,
 * `createdAt`, `updatedAt`) are excluded, so re-pagination or a re-import does not look
 * like a content change - but any edit to a message, trigger, family, stage, feedback or
 * scoring string does.
 */
export function contentFingerprint(record) {
  const body = Object.fromEntries(CONTENT_FIELDS.map((f) => [f, record[f]]))
  body.stages = (record.stages ?? []).map((s) =>
    Object.fromEntries(STAGE_CONTENT_FIELDS.map((f) => [f, s[f]])))
  return createHash('sha256').update(stableStringify(body)).digest('hex')
}

export function bankFingerprint(records) {
  const digests = [...records]
    .sort((a, b) => a.scenario_id.localeCompare(b.scenario_id))
    .map((r) => contentFingerprint(r))
  return createHash('sha256').update(stableStringify(digests)).digest('hex')
}

/* ------------------------------------------------------------------ *
 * Normalisation
 * ------------------------------------------------------------------ */

/**
 * Client raw trigger -> canonical trigger ids + military flag.
 *
 * Partition once on '|'; the right side must be exactly the military marker. Split the
 * left side on '+' and NEVER on whitespace, so multi-word primitives ("expert status",
 * "social proof", "social validation", "time pressure") survive intact. Order is
 * preserved and duplicates removed.
 */
export function normaliseTrigger(raw, aliasMap) {
  const errors = []
  if (typeof raw !== 'string' || !raw.trim()) {
    return { canonical_triggers: [], military_flag: false, errors: ['trigger is empty'] }
  }

  const parts = raw.split('|')
  if (parts.length > 2) errors.push(`trigger has ${parts.length - 1} '|' separators, expected at most 1`)

  const suffix = parts.length >= 2 ? parts[1].trim() : null
  if (suffix !== null && suffix !== MILITARY_CONTEXT_MARKER) {
    errors.push(`unrecognised trigger suffix "${suffix}"`)
  }
  const military_flag = suffix === MILITARY_CONTEXT_MARKER

  const canonical_triggers = []
  for (const piece of parts[0].split('+')) {
    const key = piece.trim().replace(/\s+/g, ' ').toLowerCase()
    if (!key) {
      errors.push(`empty trigger component in "${raw}"`)
      continue
    }
    const canon = aliasMap[key]
    if (!canon) {
      errors.push(`trigger primitive "${key}" has no entry in the trigger taxonomy`)
      continue
    }
    if (!canonical_triggers.includes(canon)) canonical_triggers.push(canon)
  }
  if (!canonical_triggers.length && !errors.length) errors.push(`trigger "${raw}" produced no canonical ids`)
  return { canonical_triggers, military_flag, errors }
}

/** Client scoring text -> the stage's scoring entries. Unknown clause = failure. */
export function parseScoring(text) {
  const errors = []
  const scoring = []
  for (const rawClause of String(text ?? '').split(';')) {
    const clause = rawClause.trim().replace(/\s+/g, ' ').replace(/\.$/, '').trim()
    if (!clause) continue
    const hit = SCORING_CLAUSES[clause]
    if (hit) {
      scoring.push({ ...hit, critical: Boolean(hit.critical) })
    } else if (!NON_SCORING_CLAUSES.has(clause)) {
      errors.push(`unrecognised scoring clause "${clause}"`)
    }
  }
  if (!scoring.length) errors.push(`no scoring events parsed from "${text}"`)
  return { scoring, errors }
}

/**
 * One client record -> one ScenarioDefinition document.
 *
 * Deliberately left empty, because the specification does not state them per scenario and
 * inventing them would be fabricating client content:
 *   - `synthetic.assets` / `asset_refs` - assets are described in prose, not as records
 *     (structured synthetic content is DATA-003)
 *   - `expected_actions` - which specific action satisfies a stage is stated in prose only
 *     (populated by ENGINE-001, which defines the per-stage action surface)
 * The client's prose is preserved in full in `evaluation.stages[].learner_flow`.
 */
export function toScenarioDefinition(record, taxonomies, { version = 1, active = true, synthetic = null } = {}) {
  const errors = []
  const at = (msg) => errors.push(`${record.scenario_id ?? '<no id>'}: ${msg}`)

  const platform = PLATFORM_VALUES[record.platform]
  const level = LEVEL_VALUES[record.difficulty]
  const disposition = DISPOSITION_VALUES[record.disposition]
  if (!platform) at(`unknown platform "${record.platform}"`)
  if (!level) at(`unknown difficulty "${record.difficulty}"`)
  if (!disposition) at(`unknown disposition "${record.disposition}"`)

  const canonical_family = taxonomies.family.raw_family_to_canonical[record.family]
  if (!canonical_family) {
    at(`raw family "${record.family}" has no entry in the attack-family taxonomy`)
  } else if (disposition) {
    const isLegit = LEGITIMATE_FAMILIES.includes(canonical_family)
    if (isLegit !== (disposition === 'legitimate')) {
      at(`canonical family "${canonical_family}" disagrees with disposition "${disposition}"`)
    }
  }

  const t = normaliseTrigger(record.trigger, taxonomies.trigger.raw_primitive_to_canonical)
  t.errors.forEach(at)

  const stages = []
  const evaluationStages = []
  const sourceStages = record.stages ?? []
  if (sourceStages.length !== STAGE_KEYS.length) {
    at(`expected ${STAGE_KEYS.length} stages, found ${sourceStages.length}`)
  }

  sourceStages.forEach((s, i) => {
    const key = STAGE_KEYS[i]
    if (!key) return
    if (s.number !== i + 1) at(`stage ${i + 1} carries number ${s.number}`)

    // Transitions and events are defined once by specification section 4, not per
    // scenario, so every scenario receives the canonical set for its stage.
    stages.push({
      index: i + 1,
      key,
      ui_to_build: s.ui_to_build,
      transitions: STAGE_TRANSITIONS[key].map((x) => ({ ...x })),
      events: [...STAGE_EVENTS[key]],
      asset_refs: [...(synthetic?.stage_asset_refs?.[i] ?? [])],
    })

    const parsed = parseScoring(s.scoring_event)
    parsed.errors.forEach((e) => at(`stage ${i + 1}: ${e}`))
    evaluationStages.push({
      index: i + 1,
      key,
      learner_flow: s.learner_flow,
      expected_safe_behavior: s.expected_safe_behavior,
      scoring_text: s.scoring_event,
      expected_actions: [],
      scoring: parsed.scoring,
    })
  })

  const doc = {
    scenario_id: record.scenario_id,
    version,
    active,
    platform,
    level,
    disposition,
    family: record.family,
    canonical_family,
    taxonomy_version: taxonomies.family.version,
    trigger: record.trigger,
    canonical_triggers: t.canonical_triggers,
    trigger_taxonomy_version: taxonomies.trigger.version,
    military_flag: t.military_flag,
    legitimate_control: disposition === 'legitimate',
    synthetic: synthetic?.synthetic ?? { sender: null, prior_context: null, assets: [] },
    stages,
    evaluation: {
      title: record.title,
      end_state: record.end_state,
      feedback: {
        result: `${record.disposition} - ${record.family}`,
        cues: [record.feedback],
        safe_action: sourceStages[5]?.expected_safe_behavior ?? '',
        impact: record.end_state,
        prevention_habit: record.feedback,
      },
      stages: evaluationStages,
    },
  }
  return { doc, errors }
}

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

/** Reports anything in the client text that could reach a real network destination. */
export function validateOfflineSafety(record) {
  const errors = []
  const text = [record.title, record.family, record.trigger, record.end_state, record.feedback,
    ...(record.stages ?? []).flatMap((s) => [s.learner_flow, s.ui_to_build,
      s.expected_safe_behavior, s.scoring_event])].join(' ')

  for (const url of text.match(/\b(?:https?:\/\/|ftp:\/\/|www\.)\S+/gi) ?? []) {
    errors.push(`${record.scenario_id}: contains a URL "${url}"`)
  }
  for (const email of text.match(/\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/gi) ?? []) {
    errors.push(`${record.scenario_id}: contains an email address "${email}"`)
  }
  const hosts = text.match(/\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)+\b/gi) ?? []
  for (const host of hosts) {
    if (/^\d+(\.\d+)*$/.test(host)) continue                 // version/decimal, not a host
    if (!/\.(com|net|org|in|io|co|gov|mil|uk|local|example|invalid|test)$/i.test(host)) continue
    if (!RESERVED_HOST_PATTERN.test(host)) {
      errors.push(`${record.scenario_id}: host "${host}" is not a reserved training domain`)
    }
  }
  return errors
}

/** Whole-dataset checks. Nothing is written unless every one of these passes. */
export function validateDataset(records) {
  const errors = []
  if (records.length !== EXPECTED.total) {
    errors.push(`expected ${EXPECTED.total} scenarios, found ${records.length}`)
  }
  const ids = records.map((r) => r.scenario_id)
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
  if (dupes.length) errors.push(`duplicate scenario ids: ${[...new Set(dupes)].join(', ')}`)

  const byPlatform = {}
  const byLevel = {}
  let malicious = 0
  let legitimate = 0
  for (const r of records) {
    byPlatform[r.platform] = (byPlatform[r.platform] ?? 0) + 1
    byLevel[r.platform] ??= {}
    byLevel[r.platform][r.level] = (byLevel[r.platform][r.level] ?? 0) + 1
    if (r.disposition === 'malicious') malicious += 1
    if (r.disposition === 'legitimate') legitimate += 1
  }
  for (const p of Object.keys(PLATFORM_FILES)) {
    if (byPlatform[p] !== EXPECTED.perPlatform) {
      errors.push(`${p}: expected ${EXPECTED.perPlatform} scenarios, found ${byPlatform[p] ?? 0}`)
    }
    for (const [lvl, want] of Object.entries(EXPECTED.perPlatformLevel)) {
      const got = byLevel[p]?.[lvl] ?? 0
      if (got !== want) errors.push(`${p}: expected ${want} ${lvl}, found ${got}`)
    }
  }
  if (malicious !== EXPECTED.malicious) errors.push(`expected ${EXPECTED.malicious} malicious, found ${malicious}`)
  if (legitimate !== EXPECTED.legitimate) errors.push(`expected ${EXPECTED.legitimate} legitimate, found ${legitimate}`)
  return errors
}

function taxonomyReport(docs) {
  const count = (fn) => docs.reduce((acc, d) => {
    for (const k of [fn(d)].flat()) acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})
  return {
    canonical_family_counts: count((d) => d.canonical_family),
    canonical_trigger_counts: count((d) => d.canonical_triggers),
    multi_trigger_scenarios: docs.filter((d) => d.canonical_triggers.length > 1).length,
    military_scenarios: docs.filter((d) => d.military_flag).length,
  }
}

/* ------------------------------------------------------------------ *
 * Import
 * ------------------------------------------------------------------ */

/**
 * Validates the whole dataset, then upserts by (scenario_id, version).
 *
 * Idempotent: a re-run of unchanged content reports every scenario as `unchanged` and
 * writes nothing. Never deletes, never drops, never touches the legacy `Scenario`
 * collection or any other version of a scenario.
 */
export async function importScenarioDefinitions({
  version = 1,
  active = true,
  dryRun = false,
  scenarioDir = SCENARIO_DIR,
  taxonomyDir = TAXONOMY_DIR,
} = {}) {
  const taxonomies = await loadTaxonomies({ dir: taxonomyDir })
  const { manifest, scenarios } = await loadSourceScenarios({ dir: scenarioDir })
  const { manifest: syntheticManifest, byScenario: synthetic } = await loadSyntheticContent()

  const errors = []

  // 1. content integrity against the manifest
  const observedBank = bankFingerprint(scenarios)
  if (manifest.content_sha256 !== observedBank) {
    errors.push(`bank fingerprint mismatch: manifest ${manifest.content_sha256}, computed ${observedBank}`)
  }
  for (const r of scenarios) {
    const expectedFp = manifest.scenario_content_sha256?.[r.scenario_id]
    const actualFp = contentFingerprint(r)
    if (expectedFp && expectedFp !== actualFp) {
      errors.push(`${r.scenario_id}: content fingerprint mismatch - the source file was edited`)
    }
    if (r.content_sha256 && r.content_sha256 !== actualFp) {
      errors.push(`${r.scenario_id}: inline content_sha256 does not match its own content`)
    }
  }

  // 2. offline / synthetic safety
  for (const r of scenarios) errors.push(...validateOfflineSafety(r))

  // 3. normalise
  const docs = []
  for (const r of scenarios) {
    const { doc, errors: mapErrors } = toScenarioDefinition(r, taxonomies, {
      version, active, synthetic: synthetic.get(r.scenario_id) ?? null,
    })
    errors.push(...mapErrors)
    docs.push(doc)
  }

  // 4. per-document schema validation (offline; no database needed)
  for (const doc of docs) {
    try {
      await new ScenarioDefinition(doc).validate()
    } catch (error) {
      for (const [p, e] of Object.entries(error.errors ?? {})) {
        errors.push(`${doc.scenario_id}: ${p}: ${e.message}`)
      }
    }
  }

  // 5. dataset-level acceptance counts
  errors.push(...validateDataset(docs))

  const report = {
    source_document: manifest.source_document,
    source_document_version: manifest.source_document_version,
    scenario_version: version,
    taxonomy_version: taxonomies.family.version,
    trigger_taxonomy_version: taxonomies.trigger.version,
    content_sha256: observedBank,
    synthetic_content_version: syntheticManifest?.content_version ?? null,
    synthetic_content_sha256: syntheticManifest?.content_sha256 ?? null,
    scenarios_with_synthetic: scenarios.filter((r) => synthetic.has(r.scenario_id)).length,
    imported_at: new Date().toISOString(),
    total_source_records: scenarios.length,
    inserted: 0,
    updated: 0,
    unchanged: 0,
    rejected: errors.length ? docs.length : 0,
    platform_counts: docs.reduce((a, d) => ({ ...a, [d.platform]: (a[d.platform] ?? 0) + 1 }), {}),
    level_counts: docs.reduce((a, d) => ({ ...a, [d.level]: (a[d.level] ?? 0) + 1 }), {}),
    disposition_counts: docs.reduce((a, d) => ({ ...a, [d.disposition]: (a[d.disposition] ?? 0) + 1 }), {}),
    ...taxonomyReport(docs),
    errors,
  }

  // Nothing is written unless every check above passed.
  if (errors.length || dryRun) {
    report.status = errors.length ? 'REJECTED' : 'DRY_RUN_OK'
    return report
  }

  for (const doc of docs) {
    // Refuse to create a second active version rather than silently deactivating one.
    if (doc.active) {
      const otherActive = await ScenarioDefinition.findOne({
        scenario_id: doc.scenario_id, active: true, version: { $ne: version },
      }).select('_id version')
      if (otherActive) {
        report.errors.push(
          `${doc.scenario_id}: version ${otherActive.version} is already active; ` +
          'refusing to activate a second version. Deactivate it explicitly first.',
        )
      }
    }
  }
  if (report.errors.length) {
    report.status = 'REJECTED'
    report.rejected = docs.length
    return report
  }

  for (const doc of docs) {
    const existing = await ScenarioDefinition.findOne({
      scenario_id: doc.scenario_id, version,
    }).select('+evaluation')

    if (!existing) {
      await ScenarioDefinition.create(doc)
      report.inserted += 1
      continue
    }
    // Compare BOTH the client content and the synthetic block. The client-content
    // fingerprint deliberately excludes synthetic data, so on its own it would report a
    // scenario as unchanged when only its synthetic content had been added or regenerated,
    // and the write would be skipped.
    const before = contentFingerprintOfDocument(existing) + syntheticDigest(existing)
    existing.set(doc)
    const after = contentFingerprintOfDocument(existing) + syntheticDigest(existing)
    if (before === after) {
      report.unchanged += 1
      continue
    }
    await existing.save()
    report.updated += 1
  }

  const stored = await ScenarioDefinition.countDocuments({ version })
  report.stored_at_version = stored
  if (stored !== EXPECTED.total) {
    report.errors.push(`post-import count is ${stored}, expected ${EXPECTED.total}`)
  }
  report.status = report.errors.length ? 'INCOMPLETE' : 'OK'
  return report
}

/** Digest of a document's synthetic content and stage asset refs (DATA-003). */
function syntheticDigest(doc) {
  const plain = typeof doc.toObject === 'function' ? doc.toObject() : doc
  return createHash('sha256').update(stableStringify({
    synthetic: plain.synthetic ?? null,
    asset_refs: (plain.stages ?? []).map((s) => s.asset_refs ?? []),
  })).digest('hex')
}

/** Rebuilds the client-content view of a stored document so it can be fingerprinted. */
function contentFingerprintOfDocument(doc) {
  return contentFingerprint({
    scenario_id: doc.scenario_id,
    title: doc.evaluation?.title,
    platform: doc.platform,
    difficulty: doc.level,
    disposition: doc.disposition,
    family: doc.family,
    trigger: doc.trigger,
    end_state: doc.evaluation?.end_state,
    feedback: doc.evaluation?.feedback?.prevention_habit,
    stages: (doc.evaluation?.stages ?? []).map((s, i) => ({
      number: s.index,
      pdf_label: ['Event', 'Open', 'Inspect', 'Branch', 'Verify', 'Resolve'][i],
      learner_flow: s.learner_flow,
      ui_to_build: doc.stages?.[i]?.ui_to_build,
      expected_safe_behavior: s.expected_safe_behavior,
      scoring_event: s.scoring_text,
    })),
  })
}

export { SCENARIO_DIR, TAXONOMY_DIR, contentFingerprintOfDocument }
