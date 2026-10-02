import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import { createApp } from '../src/app.js'
import { AdminUser } from '../src/models/AdminUser.js'
import { AuditEvent } from '../src/models/AuditEvent.js'
import { Candidate } from '../src/models/Candidate.js'
import { ScenarioDefinition } from '../src/models/ScenarioDefinition.js'
import { ScenarioRun } from '../src/models/ScenarioRun.js'
import { createAdminUser } from '../src/services/adminService.js'
import {
  loadSourceScenarios,
  loadSyntheticContent,
  loadTaxonomies,
  toScenarioDefinition,
} from '../src/services/scenarioDefinitionImportService.js'
import { detectTransactionSupport } from '../src/utils/transactions.js'

/**
 * ADMIN-001 - the scenario manager over real HTTP, against a real replica set.
 *
 * The properties proven here cannot be shown without a database: that a published version
 * is never rewritten, that a resolved ScenarioRun still resolves after later edits, and
 * that a publication and its audit entry commit or roll back together.
 *
 *   npm run test:engine
 */

const URI = process.env.ENGINE_TEST_MONGO_URI
let ready = false
let skipReason = 'ENGINE_TEST_MONGO_URI is not set'
let server
let base
let admin
let TEMPLATE

if (URI) {
  try {
    await mongoose.connect(URI, { serverSelectionTimeoutMS: 4000 })
    const topology = await detectTransactionSupport()
    if (!topology.supported) {
      skipReason = `configured MongoDB does not support transactions (${topology.topology ?? topology.reason})`
      await mongoose.disconnect()
    } else {
      const taxonomies = await loadTaxonomies()
      const { scenarios } = await loadSourceScenarios()
      const { byScenario } = await loadSyntheticContent()
      // A real, valid definition, built through the production import path.
      TEMPLATE = toScenarioDefinition(
        scenarios.find((s) => s.scenario_id === 'W01'),
        taxonomies,
        { version: 1, active: false, synthetic: byScenario.get('W01') ?? null },
      ).doc

      await Promise.all([
        ScenarioDefinition.deleteMany({}), ScenarioRun.deleteMany({}),
        AdminUser.deleteMany({}), Candidate.deleteMany({}),
        AuditEvent.collection.deleteMany({}),
      ])
      admin = await createAdminUser({ username: 'instructor', password: 'a-long-training-password' })
      const app = createApp()
      server = app.listen(0, '127.0.0.1')
      await new Promise((r) => server.once('listening', r))
      base = `http://127.0.0.1:${server.address().port}/api`
      ready = true
    }
  } catch (error) {
    skipReason = `could not start: ${error.message.split('\n')[0]}`
  }
}

if (!ready) {
  // eslint-disable-next-line no-console
  console.warn(`\n[ADMIN-001] scenario manager tests SKIPPED - ${skipReason}\n`)
}

const it = (name, fn) => test(name, { skip: ready ? false : skipReason }, fn)

/* ------------------------------------------------------------------ *
 * helpers
 * ------------------------------------------------------------------ */

async function call(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(`${base}${path}`, {
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

async function adminCookie() {
  const res = await call('/admin/login', {
    method: 'POST',
    body: { username: 'instructor', password: 'a-long-training-password' },
  })
  assert.equal(res.status, 200, `admin login failed: ${JSON.stringify(res.data)}`)
  return res.cookie
}

let learnerSeq = 0
async function candidateCookie() {
  const res = await call('/candidates', {
    method: 'POST',
    body: { name: 'Manager Learner', identifier: `ML${String(800000 + (learnerSeq += 1))}` },
  })
  assert.equal(res.status, 201)
  return res.cookie
}

/** DATA-001 requires the platform to agree with the scenario id's prefix. */
const PLATFORM_FOR_PREFIX = { W: 'whatsapp', I: 'instagram', E: 'email', S: 'sms' }

/** An authoring payload for a fresh scenario id, with asset ids moved to its namespace. */
function authoringPayload(scenarioId) {
  const source = structuredClone(TEMPLATE)
  const from = source.scenario_id
  const rename = (id) => (String(id).startsWith(`${from}-`)
    ? `${scenarioId}-${String(id).slice(from.length + 1)}`
    : id)

  for (const asset of source.synthetic.assets) asset.asset_id = rename(asset.asset_id)
  for (const stage of source.stages) stage.asset_refs = (stage.asset_refs ?? []).map(rename)

  return {
    scenario_id: scenarioId,
    platform: PLATFORM_FOR_PREFIX[scenarioId[0]],
    level: source.level,
    disposition: source.disposition,
    family: source.family,
    canonical_family: source.canonical_family,
    trigger: source.trigger,
    canonical_triggers: source.canonical_triggers,
    military_flag: source.military_flag,
    legitimate_control: source.legitimate_control,
    synthetic: source.synthetic,
    stages: source.stages,
    scoring: source.scoring,
    evaluation: source.evaluation,
  }
}

/** Isolated fixtures only: this suite owns its own throwaway database. */
async function reset() {
  await Promise.all([
    ScenarioDefinition.deleteMany({}),
    ScenarioRun.deleteMany({}),
    AuditEvent.collection.deleteMany({}),
  ])
}

async function createDraft(cookie, scenarioId = 'W01') {
  const res = await call('/admin/scenarios', {
    method: 'POST', cookie, body: authoringPayload(scenarioId),
  })
  assert.equal(res.status, 201, `create failed: ${JSON.stringify(res.data)}`)
  return res.data.scenario
}

async function publish(cookie, scenarioId, version, body) {
  return call(`/admin/scenarios/${scenarioId}/versions/${version}/publish`,
    { method: 'POST', cookie, body })
}

test.after(async () => {
  if (ready) {
    server?.close()
    await Promise.all([
      ScenarioDefinition.deleteMany({}), ScenarioRun.deleteMany({}),
      AdminUser.deleteMany({}), Candidate.deleteMany({}),
      AuditEvent.collection.deleteMany({}),
    ])
    await mongoose.disconnect()
  }
})

/* ------------------------------------------------------------------ *
 * 1-3  authentication
 * ------------------------------------------------------------------ */

it('every scenario manager route requires an administrator', async () => {
  await reset()
  for (const [method, path] of [
    ['GET', '/admin/scenarios'],
    ['POST', '/admin/scenarios'],
    ['GET', '/admin/scenarios/W01'],
    ['GET', '/admin/scenarios/W01/versions/1'],
    ['PATCH', '/admin/scenarios/W01/versions/1'],
    ['POST', '/admin/scenarios/W01/versions/1/clone'],
    ['POST', '/admin/scenarios/W01/versions/1/publish'],
    ['POST', '/admin/scenarios/W01/versions/1/deactivate'],
  ]) {
    const res = await call(path, { method, body: method === 'GET' ? undefined : {} })
    assert.equal(res.status, 401, `${method} ${path} answered ${res.status}`)
    assert.equal(res.data.error.code, 'NO_ADMIN_SESSION')
  }
})

it('a candidate session is rejected, never downgraded', async () => {
  await reset()
  const cookie = await candidateCookie()
  const res = await call('/admin/scenarios', { cookie })
  assert.equal(res.status, 401)
  assert.equal(res.data.error.code, 'NO_ADMIN_SESSION')
})

/* ------------------------------------------------------------------ *
 * 4-9  create
 * ------------------------------------------------------------------ */

it('an administrator creates a scenario as an unpublished draft', async () => {
  await reset()
  const cookie = await adminCookie()
  const scenario = await createDraft(cookie, 'W01')

  assert.equal(scenario.scenario_id, 'W01')
  assert.equal(scenario.version, 1)
  assert.equal(scenario.lifecycle, 'draft')
  assert.equal(scenario.active, false)
  assert.equal(scenario.published_at, null)

  // Creation publishes nothing, so it writes no audit entry.
  assert.equal(await AuditEvent.countDocuments(), 0)
})

it('a scenario with a broken six-stage graph is refused', async () => {
  await reset()
  const cookie = await adminCookie()
  const body = authoringPayload('W02')
  body.stages[2].key = 'branch'

  const res = await call('/admin/scenarios', { method: 'POST', cookie, body })
  assert.equal(res.status, 422)
  assert.equal(res.data.error.code, 'SCENARIO_VALIDATION_FAILED')
  assert.equal(await ScenarioDefinition.countDocuments(), 0)
})

it('a scenario referencing an asset it does not carry is refused', async () => {
  await reset()
  const cookie = await adminCookie()
  const body = authoringPayload('W03')
  body.stages[0].asset_refs = ['W03-missing-01']

  const res = await call('/admin/scenarios', { method: 'POST', cookie, body })
  assert.equal(res.status, 422)
  assert.equal(await ScenarioDefinition.countDocuments(), 0)
})

it('a scenario carrying an external target is refused', async () => {
  await reset()
  const cookie = await adminCookie()
  const body = authoringPayload('W04')
  body.synthetic.assets[0].display_target = 'https://login.realbank.co.in/verify'

  const res = await call('/admin/scenarios', { method: 'POST', cookie, body })
  assert.equal(res.status, 422)
  assert.ok(JSON.stringify(res.data).includes('not a reserved training domain'))
  assert.equal(await ScenarioDefinition.countDocuments(), 0)
})

it('an unknown or server-controlled field is rejected, not ignored', async () => {
  await reset()
  const cookie = await adminCookie()

  for (const forged of [{ active: true }, { version: 5 }, { lifecycle_state: 'published' },
    { published_at: new Date().toISOString() }, { notes: 'free text' }]) {
    const res = await call('/admin/scenarios', {
      method: 'POST', cookie, body: { ...authoringPayload('W05'), ...forged },
    })
    assert.equal(res.status, 422, `${Object.keys(forged)[0]} was accepted`)
    assert.equal(res.data.error.code, 'FORBIDDEN_FIELD')
  }
  assert.equal(await ScenarioDefinition.countDocuments(), 0)
})

it('a duplicate scenario id is refused', async () => {
  await reset()
  const cookie = await adminCookie()
  await createDraft(cookie, 'W06')

  const res = await call('/admin/scenarios', {
    method: 'POST', cookie, body: authoringPayload('W06'),
  })
  assert.equal(res.status, 409)
  assert.equal(res.data.error.code, 'SCENARIO_EXISTS')
})

/* ------------------------------------------------------------------ *
 * 10-14  publish
 * ------------------------------------------------------------------ */

it('publishing a valid draft activates it and records the change', async () => {
  await reset()
  const cookie = await adminCookie()
  await createDraft(cookie, 'W07')

  const res = await publish(cookie, 'W07', 1)
  assert.equal(res.status, 200, JSON.stringify(res.data))
  assert.equal(res.data.changed, true)
  assert.equal(res.data.scenario.lifecycle, 'published')
  assert.equal(res.data.scenario.active, true)
  assert.ok(res.data.scenario.published_at)

  const entries = await AuditEvent.find({})
  assert.equal(entries.length, 1)
  assert.equal(entries[0].action, 'SCENARIO_PUBLISHED')
  assert.equal(entries[0].resource_type, 'scenario_definition')
  assert.equal(entries[0].resource_id, 'W07')
  assert.equal(entries[0].status, 'succeeded')
  assert.equal(String(entries[0].actor_admin_id), String(admin._id))
  assert.deepEqual({ ...entries[0].metadata }, {
    scenario_id: 'W07', scenario_version: 1, scenario_platform: 'whatsapp',
  })
})

it('republishing what is already live changes nothing and logs nothing', async () => {
  await reset()
  const cookie = await adminCookie()
  await createDraft(cookie, 'W08')
  await publish(cookie, 'W08', 1)

  const again = await publish(cookie, 'W08', 1)
  assert.equal(again.status, 200)
  assert.equal(again.data.changed, false)
  assert.equal(await AuditEvent.countDocuments(), 1, 'a second entry claimed a second publication')
})

it('an invalid draft cannot be published, and the refusal is recorded as a failure', async () => {
  await reset()
  const cookie = await adminCookie()
  await createDraft(cookie, 'W09')

  // Break it directly, bypassing the authoring guard, to reach the publish gate.
  await ScenarioDefinition.collection.updateOne(
    { scenario_id: 'W09', version: 1 },
    { $set: { 'stages.3.key': 'verify' } },
  )

  const res = await publish(cookie, 'W09', 1)
  assert.equal(res.status, 422)
  assert.equal(res.data.error.code, 'SCENARIO_VALIDATION_FAILED')

  const fresh = await ScenarioDefinition.findOne({ scenario_id: 'W09', version: 1 })
  assert.equal(fresh.active, false, 'the scenario became active despite failing validation')

  const entries = await AuditEvent.find({})
  assert.equal(entries.length, 1)
  assert.equal(entries[0].status, 'failed')
  assert.equal(entries[0].error_code, 'SCENARIO_VALIDATION_FAILED')
  // A category, never a stack trace or the scenario's content.
  const text = JSON.stringify(entries[0].toAdminJSON())
  assert.ok(!text.includes('.js:'))
  assert.ok(!text.includes(TEMPLATE.evaluation.title))
})

it('publishing a new version retires the one that was live', async () => {
  await reset()
  const cookie = await adminCookie()
  await createDraft(cookie, 'W10')
  await publish(cookie, 'W10', 1)

  // An edit to a published version branches version 2.
  const edit = await call('/admin/scenarios/W10/versions/1', {
    method: 'PATCH', cookie, body: { owner: 'second author' },
  })
  assert.equal(edit.data.created_version, 2)

  const res = await publish(cookie, 'W10', 2)
  assert.equal(res.status, 200)
  assert.equal(res.data.previously_active_version, 1)

  const [v1, v2] = await ScenarioDefinition.find({ scenario_id: 'W10' }).sort({ version: 1 })
  assert.equal(v1.active, false)
  assert.equal(v1.lifecycle_state, 'retired')
  assert.equal(v2.active, true)
  assert.equal(v2.lifecycle_state, 'published')

  // Exactly one version of a scenario is ever active.
  assert.equal(await ScenarioDefinition.countDocuments({ scenario_id: 'W10', active: true }), 1)

  const entry = await AuditEvent.findOne({ 'metadata.scenario_version': 2 })
  assert.equal(entry.metadata.previously_active_version, 1)
})

it('a retired version cannot be republished', async () => {
  await reset()
  const cookie = await adminCookie()
  await createDraft(cookie, 'W11')
  await publish(cookie, 'W11', 1)
  await call('/admin/scenarios/W11/versions/1', {
    method: 'PATCH', cookie, body: { owner: 'author two' },
  })
  await publish(cookie, 'W11', 2)

  const res = await publish(cookie, 'W11', 1)
  assert.equal(res.status, 409)
  assert.equal(res.data.error.code, 'SCENARIO_NOT_DRAFT')
})

/* ------------------------------------------------------------------ *
 * 15-18  edit and versioning
 * ------------------------------------------------------------------ */

it('a draft is edited in place, without creating a version', async () => {
  await reset()
  const cookie = await adminCookie()
  await createDraft(cookie, 'W12')

  const res = await call('/admin/scenarios/W12/versions/1', {
    method: 'PATCH', cookie, body: { owner: 'first author' },
  })
  assert.equal(res.status, 200)
  assert.equal(res.data.edited_in_place, true)
  assert.equal(res.data.created_version, null)
  assert.equal(res.data.scenario.version, 1)
  assert.equal(res.data.scenario.owner, 'first author')
  assert.equal(await ScenarioDefinition.countDocuments({ scenario_id: 'W12' }), 1)
})

/**
 * The property the whole design turns on: a published version is content that resolved
 * ScenarioRuns are pinned to, so an edit must branch rather than rewrite.
 */
it('editing a published version creates the next version and leaves the original untouched', async () => {
  await reset()
  const cookie = await adminCookie()
  await createDraft(cookie, 'W13')
  await publish(cookie, 'W13', 1)

  const before = await ScenarioDefinition.findOne({ scenario_id: 'W13', version: 1 }).select('+evaluation')
  const snapshotBefore = JSON.stringify(before.toObject())

  const res = await call('/admin/scenarios/W13/versions/1', {
    method: 'PATCH', cookie, body: { owner: 'second author', level: 'hard' },
  })

  assert.equal(res.status, 200)
  assert.equal(res.data.edited_in_place, false)
  assert.equal(res.data.created_version, 2)
  assert.equal(res.data.scenario.lifecycle, 'draft')
  assert.equal(res.data.scenario.active, false)
  assert.equal(res.data.scenario.level, 'hard')

  const after = await ScenarioDefinition.findOne({ scenario_id: 'W13', version: 1 }).select('+evaluation')
  assert.equal(JSON.stringify(after.toObject()), snapshotBefore, 'version 1 was modified')
  assert.equal(after.active, true, 'version 1 stopped being the live version')
})

it('a retired version is never rewritten either', async () => {
  await reset()
  const cookie = await adminCookie()
  await createDraft(cookie, 'W14')
  await publish(cookie, 'W14', 1)
  await call('/admin/scenarios/W14/versions/1', { method: 'PATCH', cookie, body: { owner: 'a' } })
  await publish(cookie, 'W14', 2)

  const res = await call('/admin/scenarios/W14/versions/1', {
    method: 'PATCH', cookie, body: { owner: 'b' },
  })
  assert.equal(res.data.created_version, 3)

  const v1 = await ScenarioDefinition.findOne({ scenario_id: 'W14', version: 1 })
  assert.notEqual(v1.owner, 'b')
})

it('an edit that would produce an invalid scenario is refused, and writes nothing', async () => {
  await reset()
  const cookie = await adminCookie()
  await createDraft(cookie, 'W15')

  const res = await call('/admin/scenarios/W15/versions/1', {
    method: 'PATCH', cookie, body: { platform: 'instagram' }, // contradicts the W-prefix
  })
  assert.equal(res.status, 422)

  const fresh = await ScenarioDefinition.findOne({ scenario_id: 'W15', version: 1 })
  assert.equal(fresh.platform, 'whatsapp')
  assert.equal(await ScenarioDefinition.countDocuments({ scenario_id: 'W15' }), 1)
})

/* ------------------------------------------------------------------ *
 * 19-22  clone
 * ------------------------------------------------------------------ */

it('cloning produces an unpublished next version and leaves the source untouched', async () => {
  await reset()
  const cookie = await adminCookie()
  await createDraft(cookie, 'W16')
  await publish(cookie, 'W16', 1)

  const before = JSON.stringify(
    (await ScenarioDefinition.findOne({ scenario_id: 'W16', version: 1 }).select('+evaluation')).toObject(),
  )

  const res = await call('/admin/scenarios/W16/versions/1/clone', { method: 'POST', cookie, body: {} })
  assert.equal(res.status, 201)
  assert.equal(res.data.scenario.version, 2)
  assert.equal(res.data.scenario.lifecycle, 'draft')
  assert.equal(res.data.scenario.active, false)
  assert.notEqual(res.data.scenario.id, String((await ScenarioDefinition.findOne({ scenario_id: 'W16', version: 1 }))._id))

  const after = JSON.stringify(
    (await ScenarioDefinition.findOne({ scenario_id: 'W16', version: 1 }).select('+evaluation')).toObject(),
  )
  assert.equal(after, before, 'the clone mutated its source')
})

it('cloning into a new scenario rewrites every asset id onto the new namespace', async () => {
  await reset()
  const cookie = await adminCookie()
  await createDraft(cookie, 'W17')

  const res = await call('/admin/scenarios/W17/versions/1/clone', {
    method: 'POST', cookie, body: { target_scenario_id: 'W18' },
  })
  assert.equal(res.status, 201)
  assert.equal(res.data.scenario.scenario_id, 'W18')
  assert.equal(res.data.scenario.version, 1)
  assert.equal(res.data.scenario.lifecycle, 'draft')

  for (const asset of res.data.scenario.synthetic.assets) {
    assert.ok(asset.asset_id.startsWith('W18-'), `asset ${asset.asset_id} kept the old namespace`)
  }
  for (const stage of res.data.scenario.stages) {
    for (const ref of stage.asset_refs ?? []) {
      assert.ok(ref.startsWith('W18-'), `stage reference ${ref} kept the old namespace`)
    }
  }
})

it('a clone carries no identity, lifecycle or publication field from its source', async () => {
  await reset()
  const cookie = await adminCookie()
  await createDraft(cookie, 'W19')
  await publish(cookie, 'W19', 1)

  const res = await call('/admin/scenarios/W19/versions/1/clone', { method: 'POST', cookie, body: {} })
  const clone = await ScenarioDefinition.findOne({ scenario_id: 'W19', version: 2 })
  const source = await ScenarioDefinition.findOne({ scenario_id: 'W19', version: 1 })

  assert.notEqual(String(clone._id), String(source._id))
  assert.equal(clone.active, false)
  assert.equal(clone.published_at, null)
  assert.equal(clone.lifecycle_state, 'draft')
  assert.equal(res.data.scenario.published_at, null)
})

it('cloning onto an id that already exists is refused', async () => {
  await reset()
  const cookie = await adminCookie()
  await createDraft(cookie, 'W20')
  await createDraft(cookie, 'W21')

  const res = await call('/admin/scenarios/W20/versions/1/clone', {
    method: 'POST', cookie, body: { target_scenario_id: 'W21' },
  })
  assert.equal(res.status, 409)
  assert.equal(res.data.error.code, 'SCENARIO_EXISTS')
})

/* ------------------------------------------------------------------ *
 * 23-26  deactivate
 * ------------------------------------------------------------------ */

it('deactivating retires the version and records the change, deleting nothing', async () => {
  await reset()
  const cookie = await adminCookie()
  await createDraft(cookie, 'W22')
  await publish(cookie, 'W22', 1)

  const res = await call('/admin/scenarios/W22/versions/1/deactivate', { method: 'POST', cookie, body: {} })
  assert.equal(res.status, 200)
  assert.equal(res.data.changed, true)
  assert.equal(res.data.scenario.active, false)
  assert.equal(res.data.scenario.lifecycle, 'retired')

  // Preserved, not deleted.
  const still = await ScenarioDefinition.findOne({ scenario_id: 'W22', version: 1 }).select('+evaluation')
  assert.ok(still, 'the definition was deleted')
  assert.ok(still.evaluation?.title, 'the evaluation content was lost')

  const entry = await AuditEvent.findOne({ action: 'SCENARIO_DEACTIVATED' })
  assert.ok(entry)
  assert.equal(entry.resource_id, 'W22')
  assert.equal(entry.status, 'succeeded')
  assert.equal(entry.metadata.scenario_version, 1)
})

it('deactivating again changes nothing and does not log a second time', async () => {
  await reset()
  const cookie = await adminCookie()
  await createDraft(cookie, 'W23')
  await publish(cookie, 'W23', 1)
  await call('/admin/scenarios/W23/versions/1/deactivate', { method: 'POST', cookie, body: {} })

  const again = await call('/admin/scenarios/W23/versions/1/deactivate', { method: 'POST', cookie, body: {} })
  assert.equal(again.status, 200)
  assert.equal(again.data.changed, false)
  assert.equal(await AuditEvent.countDocuments({ action: 'SCENARIO_DEACTIVATED' }), 1)
})

/* ------------------------------------------------------------------ *
 * 27-29  historical safety
 * ------------------------------------------------------------------ */

/**
 * The reason a published version is never rewritten: a resolved run is pinned to
 * `(scenario_id, definition_version)`, and the engine loads exactly that document.
 */
it('a ScenarioRun pinned to version 1 still resolves after version 2 is published', async () => {
  await reset()
  const cookie = await adminCookie()
  await createDraft(cookie, 'W24')
  await publish(cookie, 'W24', 1)

  const v1 = await ScenarioDefinition.findOne({ scenario_id: 'W24', version: 1 }).select('+evaluation')
  const run = await ScenarioRun.create({
    attempt_id: new mongoose.Types.ObjectId(),
    ordinal: 1,
    scenario_id: 'W24',
    definition_version: 1,
    platform: 'whatsapp',
    status: 'resolved',
    current_stage: 'resolve',
    last_sequence: 6,
    score_running: 10,
    score_0_10: 10,
    outcome_code: 'resolve_report',
    resolved_at: new Date(),
  })

  // Edit, publish a second version, then retire the first.
  await call('/admin/scenarios/W24/versions/1', { method: 'PATCH', cookie, body: { level: 'hard' } })
  await publish(cookie, 'W24', 2)

  const pinned = await ScenarioDefinition
    .findOne({ scenario_id: run.scenario_id, version: run.definition_version })
    .select('+evaluation')

  assert.ok(pinned, 'the pinned definition disappeared')
  assert.equal(pinned.version, 1)
  assert.equal(pinned.level, v1.level, 'the pinned definition changed under the run')
  assert.equal(String(pinned._id), String(v1._id))
  assert.equal(pinned.active, false, 'version 1 should now be retired')
})

it('a deactivated version stays resolvable for the runs pinned to it', async () => {
  await reset()
  const cookie = await adminCookie()
  await createDraft(cookie, 'W25')
  await publish(cookie, 'W25', 1)
  await call('/admin/scenarios/W25/versions/1/deactivate', { method: 'POST', cookie, body: {} })

  const pinned = await ScenarioDefinition
    .findOne({ scenario_id: 'W25', version: 1 })
    .select('+evaluation')
  assert.ok(pinned)
  assert.equal(pinned.stages.length, 6)
  assert.ok(pinned.synthetic.assets.length > 0)
})

/** Selection reads `active`, so a retired version simply stops being offered. */
it('an inactive version is invisible to the active-scenario pool', async () => {
  await reset()
  const cookie = await adminCookie()
  await createDraft(cookie, 'I01')
  await publish(cookie, 'I01', 1)
  assert.equal(await ScenarioDefinition.countDocuments({ active: true }), 1)

  await call('/admin/scenarios/I01/versions/1/deactivate', { method: 'POST', cookie, body: {} })
  assert.equal(await ScenarioDefinition.countDocuments({ active: true }), 0)
  assert.equal(await ScenarioDefinition.countDocuments(), 1, 'the definition was removed from the pool')
})

/** A published scenario reaching a learner must still hide everything DATA-001 hides. */
it('publishing does not widen the candidate projection', async () => {
  await reset()
  const cookie = await adminCookie()
  await createDraft(cookie, 'E01')
  await publish(cookie, 'E01', 1)

  const published = await ScenarioDefinition.findOne({ scenario_id: 'E01', version: 1 }).select('+evaluation')
  const text = JSON.stringify(published.toCandidateJSON())

  for (const field of ['evaluation', 'level', 'disposition', 'canonical_family',
    'canonical_triggers', 'military_flag', 'lifecycle_state', 'published_at', 'active']) {
    assert.ok(!text.includes(`"${field}"`), `the candidate projection exposed "${field}"`)
  }
  assert.ok(!text.includes(published.evaluation.title))
})

/* ------------------------------------------------------------------ *
 * 30-33  listing and the response surface
 * ------------------------------------------------------------------ */

it('the list paginates, sorts deterministically and bounds its page size', async () => {
  await reset()
  const cookie = await adminCookie()
  for (const id of ['W01', 'W02', 'W03', 'I01', 'E01']) await createDraft(cookie, id)

  const first = await call('/admin/scenarios?page=1&page_size=2', { cookie })
  assert.equal(first.status, 200)
  assert.equal(first.data.scenarios.length, 2)
  assert.equal(first.data.total, 5)
  assert.equal(first.data.total_pages, 3)
  assert.deepEqual(first.data.scenarios.map((s) => s.scenario_id), ['E01', 'I01'])

  const huge = await call('/admin/scenarios?page_size=100000', { cookie })
  assert.ok(huge.data.page_size <= 100)
})

it('list filters are allowlisted, and no client query operator reaches Mongo', async () => {
  await reset()
  const cookie = await adminCookie()
  await createDraft(cookie, 'W01')
  await createDraft(cookie, 'I01')
  await publish(cookie, 'I01', 1)

  const byPlatform = await call('/admin/scenarios?platform=instagram', { cookie })
  assert.equal(byPlatform.data.total, 1)

  const drafts = await call('/admin/scenarios?lifecycle=draft', { cookie })
  assert.equal(drafts.data.total, 1)
  assert.equal(drafts.data.scenarios[0].scenario_id, 'W01')

  // An unknown filter is ignored rather than passed through to the query.
  const ignored = await call('/admin/scenarios?evaluation.title=anything&__proto__=x', { cookie })
  assert.equal(ignored.data.total, 2)

  /**
   * `platform[$ne]=x` never becomes an operator. Express 5 parses the query simply, so it
   * arrives as the literal key "platform[$ne]", which is not in the allowlist and is
   * dropped - the request is answered as though no filter was given.
   */
  const injected = await call('/admin/scenarios?platform[$ne]=nothing', { cookie })
  assert.equal(injected.status, 200)
  assert.equal(injected.data.total, 2, 'the malformed filter changed the result set')
})

/**
 * The service-level defence, independent of whatever query parser sits in front of it: an
 * object-valued filter is coerced to a string, so it can only ever match nothing.
 */
it('an operator-shaped filter value cannot reach Mongo even if one arrives', async () => {
  await reset()
  const cookie = await adminCookie()
  await createDraft(cookie, 'W01')
  await createDraft(cookie, 'I01')

  const { listScenarios } = await import('../src/services/scenarioManagerService.js')

  const injected = await listScenarios({ platform: { $ne: 'nothing' } })
  assert.equal(injected.total, 0, 'a $ne operator was honoured')

  const regex = await listScenarios({ scenario_id: { $regex: '.*' } })
  assert.equal(regex.total, 0, 'a $regex operator was honoured')

  // And a legitimate string filter still works.
  assert.equal((await listScenarios({ platform: 'instagram' })).total, 1)
})

it('the admin response carries authoring data and no learner data', async () => {
  await reset()
  const cookie = await adminCookie()
  await createDraft(cookie, 'W01')

  const res = await call('/admin/scenarios/W01/versions/1', { cookie })
  assert.equal(res.status, 200)
  // An author must be able to see what they are editing.
  assert.ok(res.data.scenario.evaluation?.title)
  assert.equal(res.data.scenario.stages.length, 6)

  const text = JSON.stringify(res.data)
  for (const forbidden of ['passwordHash', 'usernameNormalised', 'intent_key',
    'score_running', 'profile_id', 'seed', 'admin_session', 'attempt_id', 'run_id']) {
    assert.ok(!text.includes(forbidden), `the response exposed "${forbidden}"`)
  }

  /**
   * "rationale" DOES appear - as a member of the resolve stage's event vocabulary, which
   * is authoring content. What must never appear is a learner's typed rationale, so the
   * check is for the field carrying a value, not for the word.
   */
  assert.ok(!/"rationale"\s*:\s*"/.test(text), 'a learner rationale value reached the response')
  const resolveStage = res.data.scenario.stages.find((stage) => stage.key === 'resolve')
  assert.ok(resolveStage.events.includes('rationale'),
    'the resolve stage should still declare the rationale event')
})

it('a missing scenario or version answers 404 without leaking', async () => {
  await reset()
  const cookie = await adminCookie()

  const missing = await call('/admin/scenarios/W01', { cookie })
  assert.equal(missing.status, 404)

  await createDraft(cookie, 'W01')
  const wrongVersion = await call('/admin/scenarios/W01/versions/9', { cookie })
  assert.equal(wrongVersion.status, 404)
})
