/**
 * MIGRATION-001 - focused compatibility smoke test of the application against a release
 * database. NOT the 100-scenario audit: it proves the release database runs the real
 * application end to end, on a handful of real attempts.
 *
 * Run it against a DISPOSABLE COPY of the release (restore the release archive under another
 * name), never against the release database itself - it creates learners, attempts, runs and
 * events, which a clean release must not contain.
 *
 *   mongorestore --archive=deploy/migration-001/cyber_awareness_training_release.archive.gz --gzip \
 *     --nsFrom='cyber_awareness_training_release.*' --nsTo='cyber_awareness_smoke.*'
 *   MONGO_URI=mongodb://127.0.0.1:27017/cyber_awareness_smoke?replicaSet=rs0 PORT=5055 node src/server.js
 *   MONGO_URI=<same> node scripts/release/smokeTestRelease.js --attempts=4
 *
 * Every learner action goes through HTTP with the opaque codes `/current-run` issues. The
 * database is only READ here: to pick the final action a disposition requires (server-side
 * tooling may know it; a browser never does) and to audit the ledger afterwards.
 */
import mongoose from 'mongoose'
import { env } from '../../src/config/env.js'
import { Attempt } from '../../src/models/Attempt.js'
import { ScenarioDefinition } from '../../src/models/ScenarioDefinition.js'
import { ScenarioEvent } from '../../src/models/ScenarioEvent.js'
import { ScenarioRun } from '../../src/models/ScenarioRun.js'
import { verifyRunIntegrity } from '../../src/services/scenarioEngineService.js'
import { codeFromActions } from '../lib/learnerActions.js'

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, ...v] = a.replace(/^--/, '').split('=')
  return [k, v.length ? v.join('=') : true]
}))
const BASE = process.env.API_BASE || 'http://127.0.0.1:5055/api'
const ATTEMPTS = Number(args.attempts || 4)
const PROTECTED = ['cyber_awareness_training', 'cyber_awareness_training_release']

const results = []
const check = (name, pass, detail = '') => {
  results.push({ name, pass: Boolean(pass) })
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  -> ${detail}` : ''}`)
}

let seq = 0
const key = (label) => `smoke-${label}-${Date.now()}-${(seq += 1)}`

async function call(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  return { status: res.status, data, cookie: res.headers.getSetCookie?.()[0]?.split(';')[0] }
}

/** Preference order per stage. The walk takes the first the scene maps AND the engine accepts. */
const ROUTES = {
  safe: {
    notify: ['open_item'],
    open: ['read'],
    inspect: ['inspect_sender', 'inspect_link', 'inspect_profile', 'preview_file', 'inspect_qr', 'read_thread'],
    branch: ['safe_pivot'],
    verify: ['verify_trusted_directory', 'verify_known_app', 'verify_known_number'],
  },
  risky: {
    notify: ['open_item'],
    open: ['read'],
    inspect: ['skip_inspection', 'inspect_sender', 'inspect_link', 'inspect_profile', 'read_thread'],
    branch: ['submit_data', 'attempt_payment', 'share_secret', 'open_link', 'reply', 'call_number', 'reject_ignore', 'safe_pivot'],
    verify: ['verify_in_message_contact', 'report', 'block', 'verify_trusted_directory', 'verify_known_app'],
  },
}
const FINALS = {
  malicious: { correct: ['resolve_report', 'resolve_block'], wrong: ['resolve_continue', 'resolve_retain'] },
  legitimate: { correct: ['resolve_continue', 'resolve_retain'], wrong: ['resolve_report', 'resolve_block'] },
}
/** Words that would reveal scoring or classification if a learner payload carried them. */
const LEAK_WORDS = ['"intent"', 'points_delta', 'disposition', 'canonical_family', 'expected_actions',
  'scoring_text', 'SAFE_PIVOT', 'TRUSTED_VERIFY', 'CORRECT_USE', 'RISKY_OPEN_REPLY', 'evaluation', '"level"']

async function run() {
  const dbName = new URL(env.mongoUri.replace(/^mongodb(\+srv)?:/, 'http:')).pathname.slice(1)
  if (PROTECTED.includes(dbName)) throw new Error(`refusing to smoke-test "${dbName}" - use a disposable restored copy`)
  await mongoose.connect(env.mongoUri, { autoIndex: false, autoCreate: false })

  console.log(`\nSmoke test - API ${BASE}, database ${dbName}\n`)

  /* --- application and database ---------------------------------- */
  const health = await call('/health')
  check('application starts and answers /health', health.status === 200 && health.data.status === 'ok')
  check('API is connected to the smoke database', health.data?.database?.database === dbName,
    health.data?.database?.database)

  /* --- legacy pipeline is inert ----------------------------------- */
  const summary = await call('/scenarios/summary')
  check('legacy pool summary reports 0 playable scenarios', summary.status === 200 && summary.data.pool.total === 0)

  const platformsSeen = new Set()
  const scenariosSeen = new Set()
  let safeRuns = 0
  let safeTens = 0
  const safeMisses = []
  let riskyRuns = 0
  let riskyBelowTen = 0

  for (let a = 0; a < ATTEMPTS; a += 1) {
    const letters = 'ABCDEFGHIJ'[a]
    const signIn = await call('/candidates', {
      method: 'POST', body: { name: `Smoke Learner ${letters}`, identifier: `SMK${Date.now().toString().slice(-6)}${a}` },
    })
    check(`[${a + 1}] learner sign-in creates a profile`, signIn.status === 201, `status ${signIn.status}`)
    const cookie = signIn.cookie

    if (a === 0) {
      const legacy = await call('/assessments', { method: 'POST', cookie })
      check('legacy POST /api/assessments cannot start (no playable legacy scenario)',
        legacy.status === 409 && legacy.data?.error?.code === 'POOL_TOO_SMALL', `${legacy.status} ${legacy.data?.error?.code}`)
    }

    const created = await call('/attempts', { method: 'POST', cookie })
    check(`[${a + 1}] assessment attempt is created`, created.status === 201, `status ${created.status}`)
    const attemptId = created.data?.attempt?.attempt_id
    if (!attemptId) continue

    const attemptDoc = await Attempt.findById(attemptId).lean()
    const ids = attemptDoc.scenario_sequence.map((s) => s.scenario_id)
    check(`[${a + 1}] selection holds 10 bank scenarios, no legacy`, ids.length === 10 && ids.every((id) => /^[WIES](0[1-9]|1\d|2[0-5])$/.test(id)),
      ids.join(' '))

    for (let r = 0; r < 12; r += 1) {
      const current = await call(`/attempts/${attemptId}/current-run`, { cookie })
      let runState = current.data?.run
      if (!runState) break
      const { actions, scenario } = current.data
      const sid = runState.scenario_id
      platformsSeen.add(runState.platform)
      scenariosSeen.add(sid)

      const payload = JSON.stringify({ run: runState, scenario, actions })
      const leaks = LEAK_WORDS.filter((w) => payload.includes(w))
      if (leaks.length) check(`${sid}: learner payload carries no scoring/classification`, false, leaks.join(', '))
      if (!actions || !Object.keys(actions).some((k) => k.startsWith(`${sid.toLowerCase()}-`))) {
        check(`${sid}: scene action codes are issued`, false)
      }

      const definition = await ScenarioDefinition.findOne({ scenario_id: sid, version: runState.version }).lean()
      const route = (r % 2 === 0) ? 'safe' : 'risky'

      // Negative controls on the first run of the first attempt.
      if (a === 0 && r === 0) {
        const bad = await call(`/attempts/${attemptId}/runs/${runState.run_id}/events`, {
          method: 'POST', cookie, body: { action_code: 'ac_0000000000000000000000000000', intent_key: key('bad') },
        })
        check('an unknown action code is refused with a neutral 422', bad.status === 422 && bad.data?.error?.code === 'INVALID_ACTION',
          `${bad.status} ${bad.data?.error?.code}`)
        const stale = codeFromActions(actions, sid, 'resolve', 'resolve_report')
        const early = await call(`/attempts/${attemptId}/runs/${runState.run_id}/events`, {
          method: 'POST', cookie, body: { action_code: stale, intent_key: key('stale') },
        })
        check('a control for another stage is refused', early.status >= 400 && early.status < 500, `${early.status} ${early.data?.error?.code}`)
      }

      let idempotencyChecked = a !== 0 || r !== 0
      for (let step = 0; step < 6 && runState.current_stage !== 'resolve'; step += 1) {
        const stage = runState.current_stage
        let moved = false
        for (const intent of ROUTES[route][stage] ?? []) {
          const code = codeFromActions(actions, sid, stage, intent)
          if (!code) continue
          const intentKey = key(intent)
          const res = await call(`/attempts/${attemptId}/runs/${runState.run_id}/events`, {
            method: 'POST', cookie, body: { action_code: code, intent_key: intentKey },
          })
          if (res.status !== 200) continue
          if (!idempotencyChecked) {
            const before = await ScenarioEvent.countDocuments({ run_id: runState.run_id })
            const again = await call(`/attempts/${attemptId}/runs/${runState.run_id}/events`, {
              method: 'POST', cookie, body: { action_code: code, intent_key: intentKey },
            })
            const after = await ScenarioEvent.countDocuments({ run_id: runState.run_id })
            check('a retried action (same intent key) is idempotent - no second event', again.status === 200 && before === after,
              `${again.status}, events ${before} -> ${after}`)
            idempotencyChecked = true
          }
          runState = res.data.run
          moved = true
          break
        }
        if (!moved) {
          check(`${sid}: ${route} route can leave "${stage}"`, false)
          break
        }
      }

      const finals = FINALS[definition.disposition][route === 'safe' ? 'correct' : 'wrong']
      let resolved = null
      for (const intent of finals) {
        const code = codeFromActions(actions, sid, 'resolve', intent)
        if (!code) continue
        const res = await call(`/attempts/${attemptId}/runs/${runState.run_id}/resolve`, {
          method: 'POST', cookie, body: { action_code: code, intent_key: key(intent) },
        })
        if (res.status === 200) { resolved = res.data; break }
      }
      if (!resolved) {
        check(`${sid}: run resolves through the ${route} route`, false)
        break
      }

      const stored = await ScenarioRun.findById(runState.run_id).lean()
      if (route === 'safe') {
        safeRuns += 1
        if (stored.score_0_10 === 10) safeTens += 1
        else safeMisses.push(`${sid}=${stored.score_0_10}`)
      } else {
        riskyRuns += 1
        if (stored.score_0_10 < 10) riskyBelowTen += 1
      }
    }

    const completed = await call(`/attempts/${attemptId}/complete`, { method: 'POST', cookie })
    check(`[${a + 1}] attempt completes with a result`, completed.status === 200 && completed.data?.result,
      `status ${completed.status}`)
    const result = await call(`/attempts/${attemptId}/result`, { cookie })
    check(`[${a + 1}] result is served`, result.status === 200)

    const done = await Attempt.findById(attemptId).lean()
    const runs = await ScenarioRun.find({ attempt_id: attemptId }).lean()
    const sum = runs.reduce((t, x) => t + x.score_0_10, 0)
    check(`[${a + 1}] total_score is the sum of the ten run scores`, done.status === 'completed' && done.total_score === sum,
      `${done.total_score} vs ${sum}`)
    let intact = true
    for (const x of runs) {
      const integrity = await verifyRunIntegrity(x._id)
      const clamped = Math.min(10, Math.max(0, integrity.replayed.score_running))
      if (!integrity.score_matches || !integrity.sequence_contiguous || !integrity.last_sequence_matches
        || clamped !== x.score_0_10) intact = false
    }
    check(`[${a + 1}] every run's score reproduces from its event ledger`, intact)

    const progress = await call('/progress', { cookie })
    check(`[${a + 1}] progress snapshot is served`, progress.status === 200)
  }

  check('all four platforms resolved and played', ['whatsapp', 'instagram', 'email', 'sms'].every((p) => platformsSeen.has(p)),
    [...platformsSeen].sort().join(', '))
  check('safe route scores 10/10 on every safe run', safeRuns > 0 && safeTens === safeRuns,
    `${safeTens}/${safeRuns}${safeMisses.length ? ` misses ${safeMisses.join(' ')}` : ''}`)
  check('risky route loses points on every risky run', riskyRuns > 0 && riskyBelowTen === riskyRuns, `${riskyBelowTen}/${riskyRuns}`)

  console.log(`\n  scenarios exercised: ${scenariosSeen.size} (${[...scenariosSeen].sort().join(' ')})`)
  const failed = results.filter((r) => !r.pass)
  console.log(`\n  SMOKE ${failed.length ? 'FAIL' : 'PASS'} - ${results.length - failed.length}/${results.length} checks`)
  if (failed.length) process.exitCode = 1
}

run()
  .catch((error) => { console.error('SMOKE FAIL -', error.message); process.exitCode = 1 })
  .finally(() => mongoose.disconnect().catch(() => {}))
