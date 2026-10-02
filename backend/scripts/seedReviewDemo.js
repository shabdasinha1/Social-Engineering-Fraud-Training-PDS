/**
 * DEVELOPMENT ONLY - seeds four differently-shaped completed attempts so the REVIEW-001
 * learning review can be inspected in a browser.
 *
 * Everything goes through the real HTTP API, so the engine decides every event code, every
 * score and every outcome exactly as it does in an assessment. Nothing is written to Mongo
 * directly, and no result is fabricated: the review shown on screen is built from the
 * ledger these walks actually produce.
 *
 * Point it at an ISOLATED database. It signs four candidates in and leaves their attempts
 * behind for inspection, so it must never be run against real training data.
 *
 *   MONGO_URI=mongodb://127.0.0.1:27017/<isolated-db>?replicaSet=rs0 PORT=5055 node src/server.js
 *   MONGO_URI=... API_BASE=http://127.0.0.1:5055/api node scripts/seedReviewDemo.js
 */
import mongoose from 'mongoose'
import { env } from '../src/config/env.js'
import { Attempt } from '../src/models/Attempt.js'
import { Candidate } from '../src/models/Candidate.js'
import { ScenarioDefinition } from '../src/models/ScenarioDefinition.js'
import { ScenarioEvent } from '../src/models/ScenarioEvent.js'
import { ScenarioRun } from '../src/models/ScenarioRun.js'
import { codeFromActions } from './lib/learnerActions.js'

const BASE = process.env.API_BASE || 'http://127.0.0.1:5055/api'

if (/cyber_awareness_training(\?|$)/.test(env.mongoUri)) {
  throw new Error('refusing to seed demo attempts into the primary database')
}

let seq = 0
const key = (label) => `${label}-${Date.now()}-${(seq += 1)}`

async function call(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  return { status: res.status, data, cookie: res.headers.getSetCookie?.()[0]?.split(';')[0] }
}

async function signIn(name, identifier) {
  const r = await call('/candidates', { method: 'POST', body: { name, identifier } })
  if (r.status !== 201) throw new Error(`sign-in failed: ${JSON.stringify(r.data)}`)
  return r.cookie
}

/** The four walks, in learner intents. The engine turns each into its own event codes. */
const WALKS = {
  perfect: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_trusted_directory'],
  reckless: ['open_item', 'read', 'skip_inspection', 'submit_data', 'verify_in_message_contact'],
  premature: ['open_item', 'reply', 'safe_pivot', 'verify_trusted_directory'],
  rejecting: ['open_item', 'read', 'inspect_sender', 'reject_ignore', 'report'],
  reportOnly: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'report'],
}

/** Server-side lookup, so the walk can be chosen per disposition. Seeder-only. */
async function dispositionOf(runId) {
  const run = await ScenarioRun.findById(runId)
  const definition = await ScenarioDefinition.findOne({
    scenario_id: run.scenario_id, version: run.definition_version,
  })
  return definition.disposition
}

async function play(label, name, identifier, strategy) {
  const cookie = await signIn(name, identifier)
  const created = await call('/attempts', { method: 'POST', cookie })
  const attemptId = created.data.attempt.attempt_id

  for (let i = 0; i < 10; i += 1) {
    const current = await call(`/attempts/${attemptId}/current-run`, { cookie })
    const runId = current.data.run.run_id
    const { actions } = current.data
    const { walk, final } = strategy(await dispositionOf(runId), i + 1)

    // SECURITY-001: each intent is sent as the code of the generic control that submits it.
    let stage = current.data.run.current_stage
    for (const intent of WALKS[walk]) {
      const code = codeFromActions(actions, 'GENERIC', stage, intent)
      const r = await call(`/attempts/${attemptId}/runs/${runId}/events`, {
        method: 'POST', cookie, body: { action_code: code, intent_key: key(intent) },
      })
      if (r.status !== 200) throw new Error(`${intent}: ${JSON.stringify(r.data)}`)
      stage = r.data.run.current_stage
    }

    const done = await call(`/attempts/${attemptId}/runs/${runId}/resolve`, {
      method: 'POST',
      cookie,
      body: {
        action_code: codeFromActions(actions, 'GENERIC', 'resolve', `resolve_${final}`),
        intent_key: key('resolve'),
      },
    })
    if (done.status !== 200) throw new Error(`resolve: ${JSON.stringify(done.data)}`)
  }

  const { data } = await call(`/attempts/${attemptId}/complete`, { method: 'POST', cookie })
  const result = data.result

  console.log(`\n=== ${label} ===`)
  console.log(`  sign in as     ${name} / ${identifier}`)
  console.log(`  result page    /result/${attemptId}`)
  console.log(`  score          ${result.total_score}/${result.max_score}`)
  console.log(`  review         ${JSON.stringify(result.review_summary)}`)
  for (const s of result.scenarios) {
    const kinds = s.review.mistakes.map((m) => `${m.stage}:${m.kind}`).join(', ') || '-'
    console.log(`   ${String(s.ordinal).padStart(2)}  ${s.scenario_ref}  ${String(s.score_0_10).padStart(2)}/10  `
      + `${s.review.status.padEnd(13)} ${(s.review.learning_issue?.key ?? '-').padEnd(15)} ${kinds}`)
  }
  return attemptId
}

await mongoose.connect(env.mongoUri)

/**
 * `PIN_WHATSAPP` narrows the ACTIVE WhatsApp pool so a demo can be built around specific
 * scenarios - an attempt takes only three WhatsApp items out of twenty-five, so waiting for
 * a chosen one is otherwise a lottery. The selector and its quotas are untouched; it
 * chooses freely from a smaller pool, and the pool is restored before this script exits.
 */
const pinned = (process.env.PIN_WHATSAPP ?? '').split(',').map((id) => id.trim()).filter(Boolean)
let deactivated = []
if (pinned.length) {
  const others = await ScenarioDefinition.find({
    platform: 'whatsapp', active: true, scenario_id: { $nin: pinned },
  }).select('_id')
  deactivated = others.map((doc) => doc._id)
  await ScenarioDefinition.updateMany({ _id: { $in: deactivated } }, { $set: { active: false } })
  console.log(`pinned WhatsApp pool to ${pinned.join(', ')}`)
}

/**
 * Re-runnable: the four demo candidates and everything they produced are cleared first, so
 * a second run replaces the demo rather than accumulating a fifth attempt beside it.
 */
const IDENTIFIERS = ['RV900001', 'RV900002', 'RV900003', 'RV900004']
const stale = await Candidate.find({ identifier: { $in: IDENTIFIERS } }).select('_id')
if (stale.length) {
  const attemptIds = (await Attempt.find({ profile_id: { $in: stale.map((c) => c._id) } })
    .select('_id')).map((a) => a._id)
  const runIds = (await ScenarioRun.find({ attempt_id: { $in: attemptIds } }).select('_id'))
    .map((r) => r._id)
  await ScenarioEvent.deleteMany({ run_id: { $in: runIds } })
  await ScenarioRun.deleteMany({ attempt_id: { $in: attemptIds } })
  await Attempt.deleteMany({ _id: { $in: attemptIds } })
  await Candidate.deleteMany({ _id: { $in: stale.map((c) => c._id) } })
  console.log(`cleared ${stale.length} previous demo candidate(s)`)
}

const attempts = {}

/** 1. Every scenario handled safely and resolved as its disposition required. */
attempts.correct = await play(
  '1. CORRECT - every scenario handled safely', 'Verify Correct', 'RV900001',
  (disposition) => ({ walk: 'perfect', final: disposition === 'malicious' ? 'report' : 'continue' }),
)

/** 2. Malicious items skipped inspection, released details and were carried out. */
attempts.missed = await play(
  '2. MISSED THREAT - malicious items carried out', 'Verify Missed', 'RV900002',
  (disposition) => (disposition === 'malicious'
    ? { walk: 'reckless', final: 'continue' }
    : { walk: 'perfect', final: 'continue' }),
)

/** 3. Genuine items abandoned and reported; malicious items handled properly. */
attempts.falsePositive = await play(
  '3. FALSE POSITIVE - genuine items reported', 'Verify FalsePos', 'RV900003',
  (disposition) => (disposition === 'legitimate'
    ? { walk: 'rejecting', final: 'report' }
    : { walk: 'perfect', final: 'report' }),
)

/** 4. A mixed attempt: a different kind of mistake every few scenarios. */
attempts.mixed = await play(
  '4. MIXED - several different mistakes in one attempt', 'Verify Mixed', 'RV900004',
  (disposition, ordinal) => {
    const final = disposition === 'malicious' ? 'report' : 'continue'
    if (ordinal % 4 === 1) return { walk: 'perfect', final }
    if (ordinal % 4 === 2) return { walk: 'premature', final }
    if (ordinal % 4 === 3) return { walk: 'reckless', final: 'continue' }
    /**
     * `reject_ignore` is the false-positive path and only the scenarios that declare it
     * offer it, so it is used on the legitimate controls. Malicious scenarios take the
     * report-without-checking route instead, which is a different mistake again.
     */
    return disposition === 'legitimate'
      ? { walk: 'rejecting', final: 'report' }
      : { walk: 'reportOnly', final: 'report' }
  },
)

console.log('\nRESULT PAGES')
for (const [name, id] of Object.entries(attempts)) {
  console.log(`  ${name.padEnd(14)} /result/${id}`)
}

await mongoose.disconnect()
