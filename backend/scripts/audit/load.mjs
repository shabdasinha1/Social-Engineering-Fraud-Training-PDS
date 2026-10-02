// Load driver. Usage:
//   node load.mjs stress <users> <seconds> [thinkMs]   closed loop: each user plays full attempts back-to-back
//   node load.mjs burst  <users>                       N users sign in + Start simultaneously
// Prints a JSON summary line prefixed with RESULT.
import { readFileSync } from 'node:fs'

import mongoose from 'mongoose'
import { Learner, lat, errors, playRun, SAFE_PLAN, RISKY_PLAN, summarise, uid, pct } from './lc.mjs'

const [mode, usersArg, secsArg, thinkArg] = process.argv.slice(2)
const USERS = Number(usersArg)
const SECS = Number(secsArg || 0)
const THINK = Number(thinkArg || 0)
const MONITOR = process.env.AUDIT_MONITOR_FILE

const mongo = process.env.AUDIT_MONGO_URI ? await mongoose.createConnection(process.env.AUDIT_MONGO_URI).asPromise() : null
async function mongoStats() {
  if (!mongo) return null
  const s = await mongo.db.admin().command({ serverStatus: 1 })
  return { conns: s.connections.current, resident_mb: s.mem.resident, virtual_mb: s.mem.virtual, wt_cache_mb: +(s.wiredTiger.cache['bytes currently in the cache'] / 1048576).toFixed(1), txn_aborted: s.transactions?.totalAborted, txn_committed: s.transactions?.totalCommitted }
}

function monitorWindow(t0, t1) {
  if (!MONITOR) return null
  const rows = readFileSync(MONITOR, 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((r) => r.t >= t0 && r.t <= t1)
  if (!rows.length) return null
  const col = (k) => rows.map((r) => r[k])
  return {
    samples: rows.length,
    cpu_avg: +(col('cpu_pct').reduce((a, b) => a + b, 0) / rows.length).toFixed(1),
    cpu_max: Math.max(...col('cpu_pct')),
    rss_max_mb: Math.max(...col('rss_mb')),
    heap_max_mb: Math.max(...col('heap_mb')),
    eld_p99_max_ms: Math.max(...col('eld_p99_ms')),
    eld_max_ms: Math.max(...col('eld_max_ms')),
    sockets_max: Math.max(...col('sockets')),
  }
}

let attemptsDone = 0
let scoreProblems = 0
async function learnerLoop(i, deadline) {
  const l = new Learner(`Load User ${i}`, `LD-${uid()}-${i}`)
  const s = await l.signIn()
  if (s.status >= 400) return
  while (Date.now() < deadline) {
    const st = await l.start()
    if (st.status >= 400 || !st.json?.attempt) { await new Promise((r) => setTimeout(r, 200)); continue }
    const aid = st.json.attempt.attempt_id
    for (let k = 0; k < 10 && Date.now() < deadline + 60_000; k += 1) {
      const cr = await l.currentRun(aid)
      if (cr.status !== 200 || !cr.json?.run) break
      const risky = Math.random() < 0.4
      const correct = Math.random() < 0.7
      const resolveIntents = correct ? ['resolve_report', 'resolve_block', 'resolve_continue', 'resolve_retain'].sort(() => Math.random() - 0.5) : ['resolve_ignore']
      try {
        await playRun(l, aid, cr.json, { plan: risky ? RISKY_PLAN : SAFE_PLAN, resolveIntents, thinkMs: THINK })
      } catch (e) { errors.push({ op: 'play', err: e.message }) }
    }
    const c = await l.complete(aid)
    if (c.status === 200) {
      attemptsDone += 1
      const r = await l.result(aid)
      const sc = r.json?.result?.total_score
      if (typeof sc !== 'number' || sc < 0 || sc > 100) scoreProblems += 1
    }
    if (mode === 'once') break
  }
}

const before = await mongoStats()
const t0 = Date.now()
if (mode === 'stress' || mode === 'once') {
  const deadline = t0 + SECS * 1000
  await Promise.all(Array.from({ length: USERS }, (_, i) => learnerLoop(i, deadline)))
} else if (mode === 'burst') {
  const ls = Array.from({ length: USERS }, (_, i) => new Learner(`Burst ${i}`, `BU-${uid()}-${i}`))
  await Promise.all(ls.map((l) => l.signIn()))
  const starts = await Promise.all(ls.map((l) => l.start()))
  const ids = new Set(starts.map((s) => s.json?.attempt?.attempt_id).filter(Boolean))
  const firstRuns = await Promise.all(ls.map((l, i) => l.currentRun(starts[i].json?.attempt?.attempt_id)))
  console.log(`burst: ${ids.size}/${USERS} attempts created, current-run ok ${firstRuns.filter((r) => r.status === 200).length}`)
}
const t1 = Date.now()
const after = await mongoStats()
const elapsed = (t1 - t0) / 1000
const all = lat.map((r) => r.ms)
console.log('RESULT ' + JSON.stringify({
  mode, users: USERS, seconds: +elapsed.toFixed(1), think_ms: THINK,
  requests: lat.length, rps: +(lat.length / elapsed).toFixed(1),
  p50: +pct(all, 50).toFixed(1), p95: +pct(all, 95).toFixed(1), p99: +pct(all, 99).toFixed(1), max: +Math.max(...all).toFixed(1),
  http_errors_5xx_or_net: errors.filter((e) => e.op !== 'play').length, http_4xx: lat.filter((r) => r.status >= 400 && r.status < 500).length,
  error_codes: [...new Set(errors.map((e) => `${e.op}:${e.status}:${JSON.stringify(e.err)}`))].slice(0, 8),
  attempts_completed: attemptsDone, score_out_of_range: scoreProblems,
  by_op: summarise(),
  api: monitorWindow(t0, t1),
  mongo_before: before, mongo_after: after,
}))
await mongo?.close()
