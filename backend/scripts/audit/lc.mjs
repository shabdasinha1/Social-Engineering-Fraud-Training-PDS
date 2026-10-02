// Audit learner client. Drives the real HTTP API the way the browser does.
// Knows the server-side action maps ONLY so it can pick a control for a wanted intent;
// the API itself never reveals them.
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'


export const BASE = process.env.AUDIT_BASE || 'http://127.0.0.1:5077/api'
const MAPS = fileURLToPath(new URL('../../data/learner-actions/v1', import.meta.url))
const read = (n) => JSON.parse(readFileSync(`${MAPS}/${n}.json`, 'utf8'))
const generic = read('generic').controls
const scenes = {}
for (const p of ['whatsapp', 'instagram', 'email', 'sms']) Object.assign(scenes, read(p).scenes)

/** controlId -> {stage,intent} for a scenario (generic + scene), scene entries last. */
export function controlsFor(scenarioId) {
  return { ...generic, ...(scenes[scenarioId] ?? {}) }
}

export function pickControl(scenarioId, stage, intents) {
  const all = controlsFor(scenarioId)
  for (const intent of intents) {
    for (const [id, e] of Object.entries(all)) if (e.stage === stage && e.intent === intent) return id
  }
  return null
}

export const lat = [] // {op, ms, status}
export const errors = []

export class Learner {
  constructor(name, identifier) { this.name = name; this.identifier = identifier; this.cookie = null }

  async call(op, method, path, body, { record = true, headers = {} } = {}) {
    const t0 = performance.now()
    let status = 0; let json = null
    try {
      const res = await fetch(BASE + path, {
        method,
        headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(this.cookie ? { cookie: this.cookie } : {}), ...headers },
        body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)),
      })
      status = res.status
      const sc = res.headers.getSetCookie?.() ?? []
      for (const c of sc) if (c.startsWith('candidate_session=')) this.cookie = c.split(';')[0]
      json = await res.json().catch(() => null)
    } catch (e) {
      status = 0; json = { error: { code: e.cause?.code || e.code || e.message } }
    }
    const ms = performance.now() - t0
    if (record) lat.push({ op, ms, status })
    if (record && (status === 0 || status >= 500)) errors.push({ op, status, err: json?.error?.code ?? json })
    return { status, json }
  }

  signIn() { return this.call('signin', 'POST', '/candidates', { name: this.name, identifier: this.identifier }) }
  start() { return this.call('start', 'POST', '/attempts') }
  current() { return this.call('current', 'GET', '/attempts/current') }
  currentRun(aid) { return this.call('current_run', 'GET', `/attempts/${aid}/current-run`) }
  event(aid, rid, code, stage, extra = {}) {
    return this.call('event', 'POST', `/attempts/${aid}/runs/${rid}/events`,
      { action_code: code, intent_key: randomUUID(), expected_stage: stage, client_ts: new Date().toISOString(), ...extra })
  }
  resolve(aid, rid, code, stage, extra = {}) {
    return this.call('resolve', 'POST', `/attempts/${aid}/runs/${rid}/resolve`,
      { action_code: code, intent_key: randomUUID(), expected_stage: stage, rationale: 'audit', ...extra })
  }
  complete(aid) { return this.call('complete', 'POST', `/attempts/${aid}/complete`) }
  result(aid) { return this.call('result', 'GET', `/attempts/${aid}/result`) }
}

/** Plan per stage: list of intents tried in order. */
export const SAFE_PLAN = {
  notify: ['open_item'], open: ['read'], inspect: ['inspect_sender', 'inspect_profile', 'read_thread', 'inspect_link', 'preview_file', 'inspect_qr', 'skip_inspection'],
  branch: ['safe_pivot'], verify: ['verify_trusted_directory', 'verify_known_app', 'verify_known_number'],
}
export const RISKY_PLAN = {
  notify: ['open_item'], open: ['read'], inspect: ['skip_inspection', 'inspect_sender'],
  branch: ['open_link', 'reply', 'submit_data', 'attempt_payment', 'open_file', 'scan_qr', 'call_number', 'share_secret', 'approve_device_link', 'attempt_install', 'share_location'],
  verify: ['verify_in_message_contact', 'report', 'block'],
}

/** Plays one run to resolution. resolveIntents picked by caller (e.g. correct/incorrect). */
export async function playRun(l, aid, payload, { plan = SAFE_PLAN, resolveIntents, thinkMs = 0 } = {}) {
  let { run, actions } = payload
  const sid = run.scenario_id
  let stage = run.current_stage
  for (let guard = 0; guard < 12 && stage !== 'end'; guard += 1) {
    if (thinkMs) await new Promise((r) => setTimeout(r, thinkMs * (0.5 + Math.random())))
    if (stage === 'resolve') {
      const cid = pickControl(sid, 'resolve', resolveIntents)
      const r = await l.resolve(aid, run.run_id, actions[cid], 'resolve')
      return r
    }
    const cid = pickControl(sid, stage, plan[stage])
    if (!cid) throw new Error(`no control for ${sid} ${stage}`)
    const r = await l.event(aid, run.run_id, actions[cid], stage)
    if (r.status !== 200) return r
    stage = r.json.run?.current_stage ?? r.json.next_stage ?? stage
    if (r.json.run?.status === 'resolved') return r
  }
  return { status: -1, json: { stuck: stage } }
}

export function pct(values, p) {
  if (!values.length) return null
  const s = [...values].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)]
}

export function summarise(rows = lat) {
  const by = {}
  for (const r of rows) (by[r.op] ??= []).push(r)
  const out = {}
  for (const [op, rs] of Object.entries(by)) {
    const ms = rs.map((r) => r.ms)
    out[op] = { n: rs.length, p50: +pct(ms, 50).toFixed(1), p95: +pct(ms, 95).toFixed(1), p99: +pct(ms, 99).toFixed(1), max: +Math.max(...ms).toFixed(1), err: rs.filter((r) => r.status === 0 || r.status >= 500).length }
  }
  return out
}

export const uid = () => randomUUID().slice(0, 8)
