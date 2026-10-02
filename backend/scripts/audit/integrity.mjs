// Database-wide integrity + independent scoring verification over EVERY record in audit_live.
// Read-only. Recomputes every score from the ledger and the pinned definition.

import mongoose from 'mongoose'

const URI = process.env.AUDIT_MONGO_URI
if (!URI) { console.error('Set AUDIT_MONGO_URI to the database to verify (read-only).'); process.exit(2) }
const c = await mongoose.createConnection(URI).asPromise()
const DB = c.name
const db = c.db
const STAGES = ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve']
const TELEMETRY = new Set(['STAGE_SKIPPED', 'RUN_ABANDONED', 'RUN_EXPIRED', 'RUN_DEMO_SKIPPED', 'notification_dismissed'])
const CORRECT = { malicious: ['resolve_report', 'resolve_block'], legitimate: ['resolve_continue', 'resolve_retain'] }
const clamp = (v) => Math.min(10, Math.max(0, v))

const defs = new Map()
for (const d of await db.collection('scenariodefinitions').find({}).toArray()) defs.set(`${d.scenario_id}@${d.version}`, d)

const problems = []
const P = (kind, detail) => { if (problems.length < 200) problems.push({ kind, ...detail }); counts[kind] = (counts[kind] ?? 0) + 1 }
const counts = {}

// events grouped by run
const eventsByRun = new Map()
let eventTotal = 0
for await (const e of db.collection('scenarioevents').find({}, { projection: { run_id: 1, sequence: 1, event_code: 1, stage: 1, points_delta: 1, 'metadata.intent': 1, intent_key: 1 } })) {
  eventTotal += 1
  const k = String(e.run_id)
  if (!eventsByRun.has(k)) eventsByRun.set(k, [])
  eventsByRun.get(k).push(e)
}

const runsByAttempt = new Map()
let runTotal = 0; let resolvedRuns = 0
const coverage = {} // scenario -> {runs, resolved, risky, safe, correct, incorrect}
for await (const r of db.collection('scenarioruns').find({})) {
  runTotal += 1
  const k = String(r.attempt_id)
  if (!runsByAttempt.has(k)) runsByAttempt.set(k, [])
  runsByAttempt.get(k).push(r)
  const def = defs.get(`${r.scenario_id}@${r.definition_version}`)
  if (!def) { P('run_without_definition', { run: String(r._id) }); continue }
  const cov = (coverage[r.scenario_id] ??= { runs: 0, resolved: 0, risky: 0, safe_pivot: 0, resolve_correct: 0, resolve_wrong: 0, skipped: 0 })
  cov.runs += 1
  const evs = (eventsByRun.get(String(r._id)) ?? []).sort((a, b) => a.sequence - b.sequence)
  // 1. ledger replay
  const sum = evs.reduce((s, e) => s + e.points_delta, 0)
  if (sum !== r.score_running) P('score_running_mismatch', { run: String(r._id), cached: r.score_running, replay: sum })
  evs.forEach((e, i) => { if (e.sequence !== i + 1) P('sequence_gap', { run: String(r._id), at: i + 1, got: e.sequence }) })
  if (r.last_sequence !== evs.length) P('last_sequence_mismatch', { run: String(r._id), cached: r.last_sequence, events: evs.length })
  // 2. every event's points against the pinned definition (independent of the engine)
  let resolveEvents = 0
  for (const e of evs) {
    if (TELEMETRY.has(e.event_code)) { if (e.points_delta !== 0) P('telemetry_with_points', { run: String(r._id), code: e.event_code }); continue }
    const st = def.evaluation?.stages?.[STAGES.indexOf(e.stage)]
    const declared = (st?.scoring ?? []).find((s) => s.event_code === e.event_code)
    if (!declared) P('event_code_not_declared', { run: String(r._id), stage: e.stage, code: e.event_code })
    else if (declared.points_delta !== e.points_delta) P('points_mismatch', { run: String(r._id), code: e.event_code, declared: declared.points_delta, stored: e.points_delta })
    if (e.event_code === 'RESOLVE_CORRECT' || e.event_code === 'CONTRADICTORY_UNSAFE_FINAL') {
      resolveEvents += 1
      const shouldBeCorrect = (CORRECT[def.disposition] ?? []).includes(e.metadata?.intent)
      if ((e.event_code === 'RESOLVE_CORRECT') !== shouldBeCorrect) P('resolution_classification_wrong', { run: String(r._id), disposition: def.disposition, intent: e.metadata?.intent, code: e.event_code })
      if (e.event_code === 'RESOLVE_CORRECT') cov.resolve_correct += 1; else cov.resolve_wrong += 1
    }
    if (e.stage === 'branch' && ['RISKY_OPEN_REPLY', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', 'UNSAFE_EXTERNAL_ACTION'].includes(e.event_code)) cov.risky += 1
    if (e.stage === 'branch' && ['SAFE_PIVOT', 'CORRECT_USE'].includes(e.event_code)) cov.safe_pivot += 1
    if (e.event_code === 'RUN_DEMO_SKIPPED') cov.skipped += 1
  }
  if (resolveEvents > 1) P('double_resolution', { run: String(r._id), resolveEvents })
  // 3. resolved run shape
  if (r.status === 'resolved') {
    resolvedRuns += 1; cov.resolved += 1
    if (r.score_0_10 !== clamp(r.score_running)) P('score_0_10_not_clamp', { run: String(r._id), s: r.score_0_10, running: r.score_running })
    if (!r.outcome_code) P('resolved_without_outcome', { run: String(r._id) })
  } else if (r.score_0_10 !== null && r.score_0_10 !== undefined) P('unresolved_with_score', { run: String(r._id) })
}

// 4. attempts
let attemptTotal = 0; let completed = 0; const scoreHist = {}
const inProgressByProfile = new Map()
const compositionIssues = []
for await (const a of db.collection('attempts').find({})) {
  attemptTotal += 1
  const runs = runsByAttempt.get(String(a._id)) ?? []
  if (runs.length !== 10) P('attempt_not_ten_runs', { attempt: String(a._id), runs: runs.length })
  const ords = runs.map((r) => r.ordinal).sort((x, y) => x - y).join(',')
  if (ords !== '1,2,3,4,5,6,7,8,9,10') P('ordinal_set_wrong', { attempt: String(a._id), ords })
  const ids = new Set(a.scenario_sequence.map((s) => s.scenario_id))
  if (ids.size !== 10) P('duplicate_scenario_in_attempt', { attempt: String(a._id) })
  const demo = a.selection?.selection_algorithm_version === 'demo-fixed-1.0.0'
  if (!demo) {
    const disp = { malicious: 0, legitimate: 0 }; const legitPlatforms = new Set()
    for (const s of a.scenario_sequence) { const d = defs.get(`${s.scenario_id}@${s.definition_version}`); disp[d.disposition] += 1; if (d.disposition === 'legitimate') legitPlatforms.add(d.platform) }
    if (disp.malicious !== 8 || disp.legitimate !== 2) P('disposition_quota_wrong', { attempt: String(a._id), disp })
    else if (legitPlatforms.size !== 2) P('legit_same_platform', { attempt: String(a._id) })
    const seq = a.scenario_sequence.map((s) => defs.get(`${s.scenario_id}@${s.definition_version}`))
    const lv = { easy: 0, medium: 0, hard: 0 }; seq.forEach((d) => { lv[d.level] += 1 })
    if (lv.easy !== 3 || lv.medium !== 4 || lv.hard !== 3) P('difficulty_quota_wrong', { attempt: String(a._id), lv })
    const pc = {}; seq.forEach((d) => { pc[d.platform] = (pc[d.platform] ?? 0) + 1 })
    if (Object.values(pc).sort().join(',') !== '2,2,3,3') P('platform_pattern_wrong', { attempt: String(a._id), pc })
    const mil = seq.filter((d) => d.military_flag).length
    if (mil < 2 || mil > 4) P('military_range_wrong', { attempt: String(a._id), mil })
    const fam = {}; seq.forEach((d) => { fam[d.canonical_family] = (fam[d.canonical_family] ?? 0) + 1 })
    if (Math.max(...Object.values(fam)) > 2) P('family_cap_exceeded', { attempt: String(a._id) })
    const trig = new Set(seq.flatMap((d) => d.canonical_triggers ?? []))
    if (trig.size < 5) P('too_few_triggers', { attempt: String(a._id), n: trig.size })
    let runLen = 1
    for (let i = 1; i < seq.length; i += 1) { runLen = seq[i].platform === seq[i - 1].platform ? runLen + 1 : 1; if (runLen > 2) { P('three_same_platform_in_a_row', { attempt: String(a._id) }); break } }
  }
  if (a.status === 'in_progress') {
    const k = String(a.profile_id); inProgressByProfile.set(k, (inProgressByProfile.get(k) ?? 0) + 1)
  }
  if (a.status === 'completed' || a.status === 'expired') {
    completed += 1
    const sum = runs.reduce((s, r) => s + (r.score_0_10 ?? 0), 0)
    if (a.total_score !== sum) P('attempt_total_mismatch', { attempt: String(a._id), total: a.total_score, sum })
    if (a.total_score < 0 || a.total_score > 100) P('attempt_total_out_of_range', { attempt: String(a._id), total: a.total_score })
    if (a.status === 'completed' && runs.some((r) => r.status !== 'resolved')) P('completed_with_unresolved_run', { attempt: String(a._id) })
    const b = Math.floor(a.total_score / 10) * 10; scoreHist[b] = (scoreHist[b] ?? 0) + 1
  }
}
for (const [p, n] of inProgressByProfile) if (n > 1) P('multiple_in_progress_attempts', { profile: p, n })

// 5. duplicates the unique indexes should make impossible
const dupCand = await db.collection('candidates').aggregate([{ $group: { _id: '$identifierNormalised', n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }]).toArray()
if (dupCand.length) P('duplicate_candidates', { n: dupCand.length })
const dupKeys = await db.collection('scenarioevents').aggregate([{ $group: { _id: '$intent_key', n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }, { $limit: 5 }]).toArray()
if (dupKeys.length) P('duplicate_intent_keys', { n: dupKeys.length })
const orphanRuns = runTotal - [...runsByAttempt.values()].reduce((s, r) => s + r.length, 0)

const scen = Object.keys(coverage)
const out = {
  database: DB,
  totals: { candidates: await db.collection('candidates').countDocuments(), attempts: attemptTotal, finished_attempts: completed, runs: runTotal, resolved_runs: resolvedRuns, events: eventTotal },
  coverage: {
    scenarios_dealt: scen.length,
    scenarios_resolved_at_least_once: scen.filter((s) => coverage[s].resolved > 0).length,
    with_risky_branch: scen.filter((s) => coverage[s].risky > 0).length,
    with_safe_branch: scen.filter((s) => coverage[s].safe_pivot > 0).length,
    with_correct_resolution: scen.filter((s) => coverage[s].resolve_correct > 0).length,
    with_wrong_resolution: scen.filter((s) => coverage[s].resolve_wrong > 0).length,
    never_dealt: ['W', 'I', 'E', 'S'].flatMap((p) => Array.from({ length: 25 }, (_, i) => `${p}${String(i + 1).padStart(2, '0')}`)).filter((id) => !coverage[id]),
  },
  score_histogram: scoreHist,
  problem_counts: counts,
  problems_sample: problems.slice(0, 20),
  orphan_runs: orphanRuns,
  collection_sizes_mb: Object.fromEntries(await Promise.all(['candidates', 'attempts', 'scenarioruns', 'scenarioevents', 'auditevents'].map(async (n) => {
    const s = await db.command({ collStats: n }); return [n, { docs: s.count, data_mb: +(s.size / 1048576).toFixed(2), storage_mb: +(s.storageSize / 1048576).toFixed(2), index_mb: +(s.totalIndexSize / 1048576).toFixed(2), avg_doc_bytes: s.avgObjSize }]
  }))),
}
console.log(JSON.stringify(out, null, 1))
await c.close()
