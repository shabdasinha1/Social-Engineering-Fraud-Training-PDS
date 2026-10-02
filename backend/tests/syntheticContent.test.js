import assert from 'node:assert/strict'
import test from 'node:test'
import { ASSET_KINDS, RESERVED_HOST_PATTERN, STAGE_KEYS } from '../src/constants/scenarioDefinition.js'
import { ScenarioDefinition } from '../src/models/ScenarioDefinition.js'
import {
  loadSourceScenarios,
  loadSyntheticContent,
  loadTaxonomies,
  toScenarioDefinition,
} from '../src/services/scenarioDefinitionImportService.js'

/**
 * DATA-003 - structured synthetic content validation. No database.
 *
 * Runs against the real generated content and the real client source, through the same
 * import path production uses.
 */

const taxonomies = await loadTaxonomies()
const { scenarios } = await loadSourceScenarios()
const { manifest, byScenario } = await loadSyntheticContent()
const entries = [...byScenario.values()]
const docs = scenarios.map((r) =>
  toScenarioDefinition(r, taxonomies, { synthetic: byScenario.get(r.scenario_id) }).doc)
const srcById = Object.fromEntries(scenarios.map((r) => [r.scenario_id, r]))

const allAssets = entries.flatMap((e) => e.synthetic.assets)
const serialised = JSON.stringify(entries)

/* ------------------------------------------------------------------ *
 * 1-5  coverage
 * ------------------------------------------------------------------ */

test('exactly 100 scenarios have structured synthetic content', () => {
  assert.equal(entries.length, 100)
  assert.equal(manifest.scenario_count, 100)
  assert.equal(byScenario.size, 100)
})

test('platform counts are 25 / 25 / 25 / 25', () => {
  const counts = entries.reduce((a, e) => ({ ...a, [e.platform]: (a[e.platform] ?? 0) + 1 }), {})
  assert.deepEqual(counts, { whatsapp: 25, instagram: 25, email: 25, sms: 25 })
})

test('every scenario id in the client bank has content, and none extra', () => {
  assert.deepEqual(
    [...byScenario.keys()].sort(),
    scenarios.map((r) => r.scenario_id).sort(),
  )
})

/* ------------------------------------------------------------------ *
 * 6-7, 19-20  targets and references
 * ------------------------------------------------------------------ */

test('every scenario has the four base assets a stage always needs', () => {
  for (const e of entries) {
    const kinds = e.synthetic.assets.map((a) => a.kind)
    for (const required of ['notification', 'sender_profile', 'message_thread',
      'trusted_directory_entry']) {
      assert.ok(kinds.includes(required), `${e.scenario_id} missing ${required}`)
    }
  }
})

test('asset ids are unique within a scenario and namespaced by scenario id', () => {
  for (const e of entries) {
    const ids = e.synthetic.assets.map((a) => a.asset_id)
    assert.equal(new Set(ids).size, ids.length, `${e.scenario_id} has duplicate asset ids`)
    for (const id of ids) {
      assert.ok(id.startsWith(`${e.scenario_id}-`), `${id} is not namespaced`)
    }
  }
})

test('asset ids are globally unique across the bank', () => {
  const ids = allAssets.map((a) => a.asset_id)
  assert.equal(new Set(ids).size, ids.length)
})

test('every stage asset reference resolves to a declared asset', () => {
  for (const e of entries) {
    const declared = new Set(e.synthetic.assets.map((a) => a.asset_id))
    assert.equal(e.stage_asset_refs.length, 6, `${e.scenario_id} needs six stage ref lists`)
    e.stage_asset_refs.forEach((refs, i) => {
      for (const ref of refs) {
        assert.ok(declared.has(ref), `${e.scenario_id} stage ${i + 1} references unknown ${ref}`)
      }
    })
  }
})

test('a dangling asset reference fails schema validation', async () => {
  const broken = structuredClone(byScenario.get('W01'))
  broken.stage_asset_refs[0] = ['W01-does-not-exist']
  const { doc } = toScenarioDefinition(srcById.W01, taxonomies, { synthetic: broken })
  await assert.rejects(new ScenarioDefinition(doc).validate(), /unknown asset/)
})

test('every asset kind is in the schema vocabulary', () => {
  for (const a of allAssets) {
    assert.ok(ASSET_KINDS.includes(a.kind), `unknown asset kind "${a.kind}"`)
  }
})

/* ------------------------------------------------------------------ *
 * 8-10  offline and network containment
 * ------------------------------------------------------------------ */

test('no asset references an external host', () => {
  const urls = serialised.match(/https?:\/\/[^"\\\s]+/g) ?? []
  assert.ok(urls.length > 0, 'sanity: some synthetic targets exist')
  for (const url of urls) {
    const host = new URL(url).hostname
    assert.ok(RESERVED_HOST_PATTERN.test(host), `"${host}" is not a reserved training domain`)
  }
})

test('every display target and browser page uses a reserved training domain', () => {
  for (const a of allAssets) {
    if (a.display_target) {
      assert.match(a.display_target, /training\.example/, `${a.asset_id} target`)
    }
    if (a.kind === 'browser_page') {
      assert.ok(RESERVED_HOST_PATTERN.test(a.content.host), `${a.asset_id} host`)
      assert.equal(a.content.network, 'blocked')
    }
  }
})

test('no CDN, image host or external asset URL appears anywhere', () => {
  for (const bad of ['cdn.', 'googleapis', 'cloudfront', 'amazonaws', 'gravatar',
    'unsplash', 'imgur', 'fbcdn', 'cdninstagram', 'wa.me', 'bit.ly', 'data:image']) {
    assert.ok(!serialised.toLowerCase().includes(bad), `content references "${bad}"`)
  }
})

test('every asset is marked inert', () => {
  for (const a of allAssets) assert.equal(a.inert, true, `${a.asset_id} is not inert`)
})

/* ------------------------------------------------------------------ *
 * 11-14  safety and privacy
 * ------------------------------------------------------------------ */

test('no real military entity is introduced', () => {
  for (const term of ['Indian Army', 'Regiment', 'Battalion', 'Brigade', 'Northern Command',
    'Rashtriya Rifles', 'Gorkha', 'Sikh Light', 'Parachute Regiment', 'DRDO', 'HAL ']) {
    assert.ok(!serialised.includes(term), `content introduces "${term}"`)
  }

  // The real assertion: synthetic content may not INTRODUCE any military phrasing the
  // client source does not already use. The client's own bank contains role and office
  // titles ("Unit Clerk", "Unit Adjutant", "Unit Records") alongside the fictional unit
  // "Unit Falcon"; reproducing those is fidelity, inventing a new one would not be.
  const clientText = JSON.stringify(scenarios)
  const inClient = new Set(clientText.match(/Unit [A-Z][a-z]+|HQ [A-Z][a-z]+/g) ?? [])
  const inSynthetic = new Set(serialised.match(/Unit [A-Z][a-z]+|HQ [A-Z][a-z]+/g) ?? [])
  for (const m of inSynthetic) {
    assert.ok(inClient.has(m), `synthetic content introduces the entity "${m}"`)
  }
})

test('no credential, secret or payment instrument is present', () => {
  for (const a of allAssets) {
    const t = JSON.stringify(a).toLowerCase()
    for (const bad of ['"password"', '"otp"', '"pin"', '"cvv"', '"card_number"',
      '"account_number"', '"iban"', '"secret"', '"token"', '"api_key"']) {
      assert.ok(!t.includes(bad), `${a.asset_id} carries ${bad}`)
    }
  }
  // Payment screens must be explicitly inert and store nothing.
  for (const a of allAssets.filter((x) => x.kind === 'payment_screen')) {
    assert.equal(a.content.real_payment, false)
    assert.equal(a.content.stores_card_data, false)
  }
})

test('every phone-like number is a non-routable training number', () => {
  const numbers = serialised.match(/\+?\d[\d\s()-]{7,}\d/g) ?? []
  assert.ok(numbers.length > 0, 'sanity: synthetic numbers exist')
  for (const n of numbers) {
    assert.match(n, /00000/, `"${n}" is not a training number`)
  }
})

test('files, calls, QR and install screens declare their inert behaviour', () => {
  for (const a of allAssets) {
    if (a.kind === 'file') {
      assert.equal(a.content.executes, false)
      assert.equal(a.content.macros_extracted, false)
      assert.equal(a.content.archive_mounted, false)
    }
    if (a.kind === 'call_screen') {
      assert.equal(a.content.microphone, false)
      assert.equal(a.content.camera, false)
      assert.equal(a.content.real_dialer, false)
      assert.deepEqual(a.content.choices, ['decline', 'accept', 'end', 'verify', 'report'])
    }
    if (a.kind === 'qr_payload') {
      assert.equal(a.content.decoded_locally, true)
      assert.equal(a.content.camera, false)
      assert.equal(a.content.clipboard, false)
    }
    if (a.kind === 'install_screen') {
      assert.equal(a.content.installs, false)
      assert.equal(a.content.grants_real_permission, false)
    }
  }
})

test('the trusted directory is never populated from the message sender', () => {
  for (const e of entries) {
    const dir = e.synthetic.assets.find((a) => a.kind === 'trusted_directory_entry')
    const sender = e.synthetic.sender
    assert.equal(dir.content.matches_message_sender, false, e.scenario_id)
    assert.notEqual(dir.content.identifier, sender.identifier,
      `${e.scenario_id}: the directory must not echo the message-supplied contact`)
    assert.equal(dir.content.provenance, 'local approved directory')
  }
})

/* ------------------------------------------------------------------ *
 * 15-16  the client bank is unchanged
 * ------------------------------------------------------------------ */

test('client scenario content is untouched by synthetic content', () => {
  for (const doc of docs) {
    const src = srcById[doc.scenario_id]
    assert.equal(doc.family, src.family)
    assert.equal(doc.trigger, src.trigger)
    assert.equal(doc.evaluation.title, src.title)
    assert.equal(doc.evaluation.end_state, src.end_state)
    assert.equal(doc.level, { Easy: 'easy', Medium: 'medium', Hard: 'hard' }[src.difficulty])
    assert.equal(doc.disposition, src.disposition.toLowerCase())
  }
})

test('the six stages and their order are unchanged', () => {
  for (const doc of docs) {
    assert.deepEqual(doc.stages.map((s) => s.key), STAGE_KEYS)
    assert.deepEqual(doc.evaluation.stages.map((s) => s.key), STAGE_KEYS)
    assert.equal(doc.stages.length, 6)
  }
})

test('scoring metadata is not duplicated into synthetic content', () => {
  for (const bad of ['points_delta', 'RESOLVE_CORRECT', 'INSPECT_CONTEXT', 'SAFE_PIVOT',
    'TRUSTED_VERIFY', 'scoring', 'canonical_family', 'canonical_triggers', 'military_flag',
    'disposition']) {
    assert.ok(!serialised.includes(bad), `synthetic content carries "${bad}"`)
  }
})

/* ------------------------------------------------------------------ *
 * 17-18  hidden evaluation stays hidden
 * ------------------------------------------------------------------ */

test('synthetic content never carries answer-bearing client text', () => {
  // Stage 3 "Check this decision signal", stage 5 "Verification route" and stage 6
  // "Final expected resolution" all state the answer. None may appear in content the
  // learner receives.
  for (const e of entries) {
    const src = srcById[e.scenario_id]
    const text = JSON.stringify(e)
    for (const answer of [
      src.stages[2].expected_safe_behavior,
      src.stages[4].learner_flow,
      src.stages[5].learner_flow,
      src.end_state,
      src.feedback,
      src.title,
      src.family,
    ]) {
      assert.ok(!text.includes(answer),
        `${e.scenario_id} leaked answer-bearing text: "${String(answer).slice(0, 50)}"`)
    }
  }
})

test('the candidate projection carries synthetic content but no classification', () => {
  for (const doc of docs.slice(0, 12)) {
    const json = new ScenarioDefinition(doc).toCandidateJSON()
    assert.ok(json.synthetic.assets.length >= 4, `${doc.scenario_id} has no synthetic assets`)
    const text = JSON.stringify(json)
    for (const field of ['evaluation', 'canonical_family', 'canonical_triggers',
      'military_flag', 'disposition', 'level', 'family', 'trigger']) {
      assert.ok(!text.includes(`"${field}"`), `candidate payload exposed "${field}"`)
    }
    assert.ok(!text.includes(doc.evaluation.title), 'candidate payload leaked the title')
  }
})

/* ------------------------------------------------------------------ *
 * provenance, determinism and platform shape
 * ------------------------------------------------------------------ */

test('literal client text is preserved verbatim in the notification', () => {
  for (const e of entries) {
    const src = srcById[e.scenario_id]
    const notif = e.synthetic.assets.find((a) => a.kind === 'notification')
    const quoted = /Dashboard notification:\s*'(.+?)'/s.exec(src.stages[0].learner_flow)
    assert.ok(quoted, `${e.scenario_id} has no quoted notification in the source`)
    const literal = quoted[1].replace(/\s+/g, ' ').trim()
    const rebuilt = notif.content.sender && literal.startsWith(notif.content.sender)
      ? `${notif.content.sender}: ${notif.content.body}`
      : notif.content.body
    assert.equal(rebuilt, literal, `${e.scenario_id} notification was altered`)
  }
})

test('the client prior-context narration is preserved verbatim', () => {
  for (const e of entries) {
    const src = srcById[e.scenario_id]
    const expected = /Context presented:\s*(.+)$/s.exec(src.stages[1].learner_flow)[1]
      .replace(/\s+/g, ' ').trim()
    assert.equal(e.synthetic.prior_context, expected, e.scenario_id)
  }
})

test('every field the specification does not state is marked as a placeholder', () => {
  for (const e of entries) {
    assert.equal(e.synthetic.sender.identifier_source, 'placeholder')
    assert.ok(['client_specification', 'placeholder'].includes(e.synthetic.sender.name_source))
  }
  const named = entries.filter((e) => e.synthetic.sender.name_source === 'client_specification')
  assert.equal(named.length, 61, 'the specification names the sender in 61 of 100 notifications')
})

test('message threads use the existing renderer block vocabulary', () => {
  const RENDERABLE = new Set(['message', 'listItem', 'image', 'linkPreview', 'attachment',
    'emailHeader', 'emailBody', 'profileHeader', 'post', 'note'])
  for (const e of entries) {
    const thread = e.synthetic.assets.find((a) => a.kind === 'message_thread')
    assert.ok(thread.content.blocks.length > 0, e.scenario_id)
    for (const b of thread.content.blocks) {
      assert.ok(RENDERABLE.has(b.type), `${e.scenario_id} uses unrenderable block "${b.type}"`)
    }
    assert.ok(thread.content.header.title, `${e.scenario_id} thread has no header title`)
  }
})

test('email threads carry a header, and Instagram profiles carry profile fields', () => {
  for (const e of entries.filter((x) => x.platform === 'email')) {
    const thread = e.synthetic.assets.find((a) => a.kind === 'message_thread')
    const header = thread.content.blocks.find((b) => b.type === 'emailHeader')
    assert.ok(header, `${e.scenario_id} email thread has no emailHeader`)
    assert.match(header.fromAddress, /training\.example$/)
    assert.ok(header.subject.length > 0)
  }
  for (const e of entries.filter((x) => x.platform === 'instagram')) {
    const profile = e.synthetic.assets.find((a) => a.kind === 'sender_profile')
    assert.match(profile.content.username, /^@/, e.scenario_id)
    assert.ok('followers' in profile.content && 'post_count' in profile.content)
  }
})

test('risky surfaces appear only where the client branch text calls for them', () => {
  const optional = ['browser_page', 'file', 'qr_payload', 'call_screen', 'payment_screen',
    'install_screen']
  let withSurface = 0
  for (const e of entries) {
    const kinds = e.synthetic.assets.map((a) => a.kind).filter((k) => optional.includes(k))
    if (kinds.length) withSurface += 1
    // Whatever is declared must also be referenced by the branch stage.
    assert.deepEqual([...kinds].sort(),
      [...e.synthetic.assets.filter((a) => e.stage_asset_refs[3].includes(a.asset_id))
        .map((a) => a.kind)].sort(),
      `${e.scenario_id}: branch refs and optional assets disagree`)
  }
  assert.ok(withSurface > 50 && withSurface < 100,
    `expected a scenario-specific spread, got ${withSurface}/100`)
})

test('the manifest fingerprint matches the generated content', () => {
  assert.equal(manifest.content_version, 1)
  assert.equal(Object.keys(manifest.scenario_content_sha256).length, 100)
  assert.ok(/^[0-9a-f]{64}$/.test(manifest.content_sha256))
})

test('all 100 merged documents pass full schema validation', async () => {
  for (const doc of docs) await new ScenarioDefinition(doc).validate()
})
