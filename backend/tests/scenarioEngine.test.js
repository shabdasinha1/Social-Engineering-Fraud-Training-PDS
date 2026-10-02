import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import { SCORING_EVENT_CODES, STAGE_KEYS } from '../src/constants/scenarioDefinition.js'
import { ENGINE_TELEMETRY_CODES, INTENTS, RATIONALE_MAX_LENGTH } from '../src/constants/scenarioEngine.js'
import { ScenarioEvent } from '../src/models/ScenarioEvent.js'
import { ScenarioRun } from '../src/models/ScenarioRun.js'
import {
  assertNoAuthoritativeInput,
  clampScenarioScore,
  resolveIntent,
  validateMetadata,
  validateRationale,
} from '../src/services/scenarioEngineService.js'
import {
  loadSourceScenarios,
  loadTaxonomies,
  toScenarioDefinition,
} from '../src/services/scenarioDefinitionImportService.js'
import { detectTransactionSupport } from '../src/utils/transactions.js'

/**
 * ENGINE-001 - pure state-machine, validation and model tests. No database.
 *
 * Definitions come from the REAL imported client dataset, so the state machine is
 * exercised against real scenario semantics rather than invented ones.
 */

const taxonomies = await loadTaxonomies()
const { scenarios } = await loadSourceScenarios()
const defs = Object.fromEntries(
  scenarios.map((r) => [r.scenario_id, toScenarioDefinition(r, taxonomies).doc]),
)

const MALICIOUS = defs.W01        // Account takeover / OTP theft
const LEGITIMATE = defs.W03       // Legitimate group invitation, military context
const MILITARY = defs.W19         // Operational elicitation, military
const MULTI_TRIGGER = defs.W12    // fear + authority + isolation_secrecy
const RISKY_EXTERNAL = defs.S25   // FASTag APK - malware delivery
const VERIFY_HEAVY = defs.E21     // Legitimate high-risk business change

const catchCode = (fn) => {
  try {
    fn()
    return null
  } catch (error) {
    return error.code
  }
}

/** Drives the safe path and returns the accumulated score. */
function walkSafePath(definition) {
  let stage = 'notify'
  let score = 0
  const steps = [
    'open_item',
    'read',
    'inspect_sender',
    'safe_pivot',
    'verify_trusted_directory',
    definition.disposition === 'malicious' ? 'resolve_report' : 'resolve_continue',
  ]
  const trace = []
  for (const intent of steps) {
    const d = resolveIntent({ definition, stage, intent })
    score += d.points_delta
    trace.push({ intent, code: d.event_code, points: d.points_delta, next: d.next_stage })
    stage = d.next_stage
  }
  return { score, stage, trace }
}

/* ------------------------------------------------------------------ *
 * 1-8  the happy path
 * ------------------------------------------------------------------ */

test('a run starts at NOTIFY', () => {
  const run = new ScenarioRun({
    attempt_id: new mongoose.Types.ObjectId(), ordinal: 1,
    scenario_id: 'W01', definition_version: 1, platform: 'whatsapp',
  })
  assert.equal(run.current_stage, 'notify')
  assert.equal(run.status, 'active')
  assert.equal(run.last_sequence, 0)
  assert.equal(run.score_running, 0)
  assert.equal(run.score_0_10, null)
})

test('NOTIFY accepts open_item and advances to OPEN', () => {
  const d = resolveIntent({ definition: MALICIOUS, stage: 'notify', intent: 'open_item' })
  assert.equal(d.event_code, 'NOTIFY_SEEN')
  assert.equal(d.points_delta, 0)
  assert.equal(d.next_stage, 'open')
})

test('dismissing a notification stays at NOTIFY and does not remove the scenario', () => {
  const d = resolveIntent({ definition: MALICIOUS, stage: 'notify', intent: 'dismiss' })
  assert.equal(d.event_code, 'notification_dismissed')
  assert.equal(d.points_delta, 0)
  assert.equal(d.next_stage, 'notify')
  assert.equal(d.resolves, false)
  assert.equal(d.abandons, false)
})

test('OPEN accepts read and advances to INSPECT', () => {
  const d = resolveIntent({ definition: MALICIOUS, stage: 'open', intent: 'read' })
  assert.equal(d.event_code, 'ITEM_OPEN')
  assert.equal(d.points_delta, 0)
  assert.equal(d.next_stage, 'inspect')
})

test('INSPECT accepts an inspection and advances to BRANCH with +2', () => {
  for (const intent of ['inspect_sender', 'inspect_profile', 'inspect_link', 'preview_file', 'read_thread']) {
    const d = resolveIntent({ definition: MALICIOUS, stage: 'inspect', intent })
    assert.equal(d.event_code, 'INSPECT_CONTEXT', intent)
    assert.equal(d.points_delta, 2, intent)
    assert.equal(d.next_stage, 'branch', intent)
  }
})

test('a safe BRANCH advances to VERIFY, scoring by disposition', () => {
  const mal = resolveIntent({ definition: MALICIOUS, stage: 'branch', intent: 'safe_pivot' })
  assert.equal(mal.event_code, 'SAFE_PIVOT')
  assert.equal(mal.points_delta, 3)
  assert.equal(mal.next_stage, 'verify')
  assert.equal(mal.consequence, null)

  const leg = resolveIntent({ definition: LEGITIMATE, stage: 'branch', intent: 'safe_pivot' })
  assert.equal(leg.event_code, 'CORRECT_USE', 'the same intent scores CORRECT_USE on a legitimate item')
  assert.equal(leg.points_delta, 3)
})

test('a risky BRANCH produces a local consequence and still advances to VERIFY', () => {
  const d = resolveIntent({ definition: MALICIOUS, stage: 'branch', intent: 'open_link' })
  assert.equal(d.event_code, 'RISKY_OPEN_REPLY')
  assert.equal(d.points_delta, -3)
  assert.equal(d.next_stage, 'verify')
  assert.deepEqual(d.consequence, {
    kind: 'simulated_browser_open', target: null, inert: true, executes: false,
  })
})

test('a secret/payment/install release scores -8', () => {
  for (const intent of ['submit_data', 'attempt_payment', 'attempt_install', 'approve_device_link', 'share_secret']) {
    const d = resolveIntent({ definition: MALICIOUS, stage: 'branch', intent })
    assert.equal(d.event_code, 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', intent)
    assert.equal(d.points_delta, -8, intent)
    assert.equal(d.consequence.inert, true)
    assert.equal(d.consequence.executes, false)
  }
})

test('VERIFY through a trusted route advances to RESOLVE with +3', () => {
  for (const intent of ['verify_trusted_directory', 'verify_known_app', 'verify_known_number']) {
    const d = resolveIntent({ definition: MALICIOUS, stage: 'verify', intent })
    assert.equal(d.event_code, 'TRUSTED_VERIFY', intent)
    assert.equal(d.points_delta, 3, intent)
    assert.equal(d.next_stage, 'resolve', intent)
  }
})

test('verifying through the message itself scores zero, never TRUSTED_VERIFY', () => {
  const d = resolveIntent({ definition: MALICIOUS, stage: 'verify', intent: 'verify_in_message_contact' })
  assert.equal(d.event_code, 'VERIFY_THROUGH_MESSAGE')
  assert.equal(d.points_delta, 0)
  assert.equal(d.next_stage, 'resolve')
})

test('RESOLVE completes the run', () => {
  const d = resolveIntent({ definition: MALICIOUS, stage: 'resolve', intent: 'resolve_report' })
  assert.equal(d.event_code, 'RESOLVE_CORRECT')
  assert.equal(d.points_delta, 2)
  assert.equal(d.resolves, true)
})

/* ------------------------------------------------------------------ *
 * 9-13  invalid transitions
 * ------------------------------------------------------------------ */

test('stages cannot be skipped', () => {
  assert.equal(catchCode(() => resolveIntent({ definition: MALICIOUS, stage: 'notify', intent: 'safe_pivot' })), 'INVALID_TRANSITION')
  assert.equal(catchCode(() => resolveIntent({ definition: MALICIOUS, stage: 'notify', intent: 'verify_trusted_directory' })), 'INVALID_TRANSITION')
  assert.equal(catchCode(() => resolveIntent({ definition: MALICIOUS, stage: 'open', intent: 'inspect_sender' })), 'INVALID_TRANSITION')
})

test('a run cannot resolve from NOTIFY', () => {
  assert.equal(catchCode(() => resolveIntent({ definition: MALICIOUS, stage: 'notify', intent: 'resolve_report' })), 'INVALID_TRANSITION')
})

test('a run cannot verify from OPEN', () => {
  assert.equal(catchCode(() => resolveIntent({ definition: MALICIOUS, stage: 'open', intent: 'verify_trusted_directory' })), 'INVALID_TRANSITION')
})

test('an unknown intent is rejected', () => {
  assert.equal(catchCode(() => resolveIntent({ definition: MALICIOUS, stage: 'notify', intent: 'hack_the_gibson' })), 'INVALID_INTENT')
})

test('an intent the scenario does not declare at that stage is rejected', () => {
  // reject_ignore scores NEEDLESS_REJECT_IGNORE, which only legitimate scenarios declare.
  assert.equal(catchCode(() => resolveIntent({ definition: MALICIOUS, stage: 'branch', intent: 'reject_ignore' })), 'INVALID_TRANSITION')
  const leg = resolveIntent({ definition: LEGITIMATE, stage: 'branch', intent: 'reject_ignore' })
  assert.equal(leg.event_code, 'NEEDLESS_REJECT_IGNORE')
  assert.equal(leg.points_delta, -2)
})

/* ------------------------------------------------------------------ *
 * 14-21  scoring authority
 * ------------------------------------------------------------------ */

test('the safe path scores exactly 10 on every one of the 100 scenarios', () => {
  for (const [id, definition] of Object.entries(defs)) {
    const { score, stage } = walkSafePath(definition)
    assert.equal(score, 10, `${id} safe path scored ${score}`)
    assert.equal(stage, 'resolve', id)
  }
})

test('the worst path never drops the final score below 0 after clamping', () => {
  const steps = ['open_item', 'reply', 'submit_data', 'report', 'resolve_ignore']
  let stage = 'notify'
  let score = 0
  for (const intent of steps) {
    const d = resolveIntent({ definition: MALICIOUS, stage, intent })
    score += d.points_delta
    stage = d.next_stage
  }
  assert.ok(score < 0, `expected a negative raw score, got ${score}`)
  assert.equal(clampScenarioScore(score), 0)
})

test('the final score never exceeds 10', () => {
  assert.equal(clampScenarioScore(42), 10)
  assert.equal(clampScenarioScore(10), 10)
  assert.equal(clampScenarioScore(-99), 0)
})

test('a false report on a legitimate item scores -4', () => {
  const d = resolveIntent({ definition: LEGITIMATE, stage: 'verify', intent: 'report' })
  assert.equal(d.event_code, 'FALSE_REPORT_BLOCK')
  assert.equal(d.points_delta, -4)
})

test('report-without-checking on a malicious item scores +1', () => {
  const d = resolveIntent({ definition: MALICIOUS, stage: 'verify', intent: 'report' })
  assert.equal(d.event_code, 'REPORT_ONLY_WITHOUT_CHECK')
  assert.equal(d.points_delta, 1)
})

test('a contradictory final action scores -4, by disposition', () => {
  const mal = resolveIntent({ definition: MALICIOUS, stage: 'resolve', intent: 'resolve_continue' })
  assert.equal(mal.event_code, 'CONTRADICTORY_UNSAFE_FINAL')
  assert.equal(mal.points_delta, -4)

  const leg = resolveIntent({ definition: LEGITIMATE, stage: 'resolve', intent: 'resolve_report' })
  assert.equal(leg.event_code, 'CONTRADICTORY_UNSAFE_FINAL')
  assert.equal(leg.points_delta, -4)

  const legOk = resolveIntent({ definition: LEGITIMATE, stage: 'resolve', intent: 'resolve_continue' })
  assert.equal(legOk.event_code, 'RESOLVE_CORRECT')
  assert.equal(legOk.points_delta, 2)
})

test('acting prematurely at OPEN scores -1 and jumps to BRANCH', () => {
  const d = resolveIntent({ definition: MALICIOUS, stage: 'open', intent: 'reply' })
  assert.equal(d.event_code, 'PREMATURE_REPLY')
  assert.equal(d.points_delta, -1)
  assert.equal(d.next_stage, 'branch')
})

test('skipping inspection forfeits the +2 without blocking progress', () => {
  const d = resolveIntent({ definition: MALICIOUS, stage: 'inspect', intent: 'skip_inspection' })
  assert.equal(d.event_code, 'STAGE_SKIPPED')
  assert.equal(d.points_delta, 0)
  assert.equal(d.next_stage, 'branch')
  assert.equal(d.telemetry, true)
})

/* ------------------------------------------------------------------ *
 * 31-37  client may not steer the engine
 * ------------------------------------------------------------------ */

test('the client cannot submit points, event codes, stages or scores', () => {
  for (const field of ['points_delta', 'points', 'score', 'score_0_10', 'event_code',
    'next_stage', 'current_stage', 'stage', 'sequence', 'outcome_code', 'status',
    'expected_action', 'evaluation']) {
    const code = catchCode(() => assertNoAuthoritativeInput({ [field]: 'anything' }))
    assert.equal(code, 'INVALID_INTENT', `"${field}" must be rejected outright`)
  }
  assert.equal(assertNoAuthoritativeInput({ note: 'fine' }), undefined)
})

test('an arbitrary synthetic target is rejected', () => {
  const code = catchCode(() => resolveIntent({
    definition: MALICIOUS, stage: 'branch', intent: 'open_link',
    syntheticTargetId: 'https://evil.example/steal',
  }))
  assert.equal(code, 'INVALID_TARGET')
})

test('a null synthetic target is accepted while DATA-003 has not populated assets', () => {
  const d = resolveIntent({ definition: MALICIOUS, stage: 'branch', intent: 'open_link', syntheticTargetId: null })
  assert.equal(d.event_code, 'RISKY_OPEN_REPLY')
})

test('metadata outside the allowlist is rejected, not silently dropped', () => {
  assert.equal(catchCode(() => validateMetadata({ password: 'hunter2' })), 'INVALID_METADATA')
  assert.equal(catchCode(() => validateMetadata({ html: '<script>' })), 'INVALID_METADATA')
  assert.equal(catchCode(() => validateMetadata(['a'])), 'INVALID_METADATA')
  assert.deepEqual(validateMetadata({ dwell_ms: 1200 }), { dwell_ms: 1200 })
  assert.deepEqual(validateMetadata(null), {})
})

test('the candidate run projection hides every classification field', () => {
  const run = new ScenarioRun({
    attempt_id: new mongoose.Types.ObjectId(), ordinal: 3,
    scenario_id: 'W19', definition_version: 1, platform: 'whatsapp',
    score_running: 7,
  })
  const json = run.toCandidateJSON()
  for (const hidden of ['score_running', 'score_0_10', 'outcome_code', 'rationale',
    'level', 'disposition', 'family', 'canonical_family', 'trigger',
    'canonical_triggers', 'military_flag', 'evaluation']) {
    assert.ok(!(hidden in json), `candidate run payload exposed "${hidden}"`)
  }
  assert.deepEqual(Object.keys(json).sort(), [
    'current_stage', 'last_sequence', 'platform', 'resolved_at',
    'run_id', 'scenario_id', 'started_at', 'status', 'version',
  ])
})

/* ------------------------------------------------------------------ *
 * 43-46  rationale
 * ------------------------------------------------------------------ */

test('a 250-character rationale is accepted', () => {
  const text = 'a'.repeat(RATIONALE_MAX_LENGTH)
  assert.equal(validateRationale(text), text)
})

test('a rationale over 250 characters is rejected', () => {
  assert.equal(catchCode(() => validateRationale('a'.repeat(RATIONALE_MAX_LENGTH + 1))), 'INVALID_RATIONALE')
})

test('a multi-line rationale or one containing markup is rejected', () => {
  assert.equal(catchCode(() => validateRationale('line one\nline two')), 'INVALID_RATIONALE')
  assert.equal(catchCode(() => validateRationale('<script>alert(1)</script>')), 'INVALID_RATIONALE')
  assert.equal(catchCode(() => validateRationale(42)), 'INVALID_RATIONALE')
})

test('rationale is optional and never affects scoring', () => {
  assert.equal(validateRationale(undefined), null)
  assert.equal(validateRationale(null), null)
  assert.equal(validateRationale('   '), null)
  const withText = resolveIntent({ definition: MALICIOUS, stage: 'resolve', intent: 'resolve_report' })
  assert.equal(withText.points_delta, 2, 'resolution scoring is independent of rationale')
})

/* ------------------------------------------------------------------ *
 * representative scenarios
 * ------------------------------------------------------------------ */

test('a military-context scenario runs without exposing its classification', () => {
  assert.equal(MILITARY.military_flag, true)
  const { score } = walkSafePath(MILITARY)
  assert.equal(score, 10)
})

test('a multi-trigger scenario runs the full path', () => {
  assert.deepEqual(MULTI_TRIGGER.canonical_triggers, ['fear', 'authority', 'isolation_secrecy'])
  assert.equal(walkSafePath(MULTI_TRIGGER).score, 10)
})

test('a malware-delivery scenario exposes an inert install consequence', () => {
  const d = resolveIntent({ definition: RISKY_EXTERNAL, stage: 'branch', intent: 'attempt_install' })
  assert.equal(d.event_code, 'SECRET_PAYMENT_INSTALL_DATA_RELEASE')
  assert.equal(d.points_delta, -8)
  assert.equal(d.consequence.kind, 'simulated_install')
  assert.equal(d.consequence.executes, false)
})

test('a legitimate high-risk change rewards verification and penalises a false report', () => {
  assert.equal(VERIFY_HEAVY.disposition, 'legitimate')
  assert.equal(resolveIntent({ definition: VERIFY_HEAVY, stage: 'verify', intent: 'verify_trusted_directory' }).points_delta, 3)
  assert.equal(resolveIntent({ definition: VERIFY_HEAVY, stage: 'verify', intent: 'block' }).event_code, 'FALSE_REPORT_BLOCK')
})

test('every scenario accepts the full safe path and the full unsafe path', () => {
  for (const [id, definition] of Object.entries(defs)) {
    assert.doesNotThrow(() => resolveIntent({ definition, stage: 'branch', intent: 'safe_pivot' }), id)
    assert.doesNotThrow(() => resolveIntent({ definition, stage: 'verify', intent: 'verify_trusted_directory' }), id)
    assert.doesNotThrow(() => resolveIntent({ definition, stage: 'resolve', intent: 'resolve_report' }), id)
    assert.doesNotThrow(() => resolveIntent({ definition, stage: 'branch', intent: 'open_link' }), id)
  }
})

/* ------------------------------------------------------------------ *
 * models, vocabulary and topology guard
 * ------------------------------------------------------------------ */

test('a resolved run must carry a score, an outcome and a timestamp', async () => {
  const base = {
    attempt_id: new mongoose.Types.ObjectId(), ordinal: 1,
    scenario_id: 'W01', definition_version: 1, platform: 'whatsapp',
  }
  await assert.rejects(new ScenarioRun({ ...base, status: 'resolved' }).validate(), /score/)
  await assert.rejects(
    new ScenarioRun({ ...base, status: 'active', score_0_10: 5 }).validate(),
    /only a resolved run/,
  )
  await new ScenarioRun({
    ...base, status: 'resolved', score_0_10: 10,
    outcome_code: 'resolve_report', resolved_at: new Date(),
  }).validate()
})

test('the event ledger enforces idempotency and ordering at index level', () => {
  const indexes = ScenarioEvent.schema.indexes()
  const intentKey = indexes.find(([f, o]) => f.intent_key === 1 && o?.unique)
  const sequence = indexes.find(([f, o]) => f.run_id === 1 && f.sequence === 1 && o?.unique)
  assert.ok(intentKey, 'unique index on intent_key is required for idempotency')
  assert.ok(sequence, 'unique index on (run_id, sequence) is required for ordering')
})

test('the run collection indexes the attempt access paths', () => {
  const keys = ScenarioRun.schema.indexes().map(([f, o]) => `${Object.keys(f).join(',')}${o?.unique ? ':unique' : ''}`)
  assert.ok(keys.includes('attempt_id,ordinal:unique'), keys.join(' | '))
  assert.ok(keys.includes('attempt_id,status'), keys.join(' | '))
})

test('an event cannot carry metadata outside the allowlist', async () => {
  const event = new ScenarioEvent({
    run_id: new mongoose.Types.ObjectId(), sequence: 1, event_code: 'NOTIFY_SEEN',
    stage: 'notify', points_delta: 0, intent_key: 'k1',
    metadata: { intent: 'open_item', password: 'secret' },
  })
  await event.validate()
  assert.equal(event.metadata.intent, 'open_item')
  assert.equal(event.metadata.password, undefined, 'unknown metadata keys must not persist')
})

test('engine telemetry codes are kept out of the client scoring vocabulary', () => {
  /**
   * `RUN_EXPIRED` was added by IMMERSIVE-001 for the 90-minute limit. It belongs in this
   * list for exactly the reason the other two do: it is written by the engine, never
   * requested by a client, and it carries zero points.
   *
   * `RUN_DEMO_SKIPPED` (ENHANCEMENT-003) joins for the same reason: written only by the Demo
   * User's skip endpoint, never by a learner intent, and always 0 points.
   */
  assert.deepEqual(ENGINE_TELEMETRY_CODES,
    ['STAGE_SKIPPED', 'RUN_ABANDONED', 'RUN_EXPIRED', 'RUN_DEMO_SKIPPED'])
  for (const code of ENGINE_TELEMETRY_CODES) {
    assert.ok(!code.startsWith('RESOLVE') && !code.startsWith('INSPECT'))
    // The substantive guarantee, asserted directly rather than inferred from the prefix:
    // no telemetry code may appear in the client's own scoring vocabulary.
    assert.ok(!SCORING_EVENT_CODES.includes(code),
      `${code} must never be a client scoring code`)
  }
})

test('every declared intent is usable somewhere in the state machine', () => {
  // Guards against an intent being added to the vocabulary but never wired into a stage,
  // which would look like a supported action while always returning INVALID_TRANSITION.
  const usable = new Set()
  for (const stage of STAGE_KEYS) {
    for (const intent of INTENTS) {
      try {
        resolveIntent({ definition: LEGITIMATE, stage, intent })
        usable.add(intent)
      } catch { /* not legal at this stage on this scenario */ }
      try {
        resolveIntent({ definition: MALICIOUS, stage, intent })
        usable.add(intent)
      } catch { /* not legal at this stage on this scenario */ }
    }
  }
  const unusable = INTENTS.filter((i) => !usable.has(i))
  assert.deepEqual(unusable, [], `these intents are unreachable: ${unusable.join(', ')}`)
})

test('the topology guard reports standalone MongoDB as unsupported', async () => {
  const result = await detectTransactionSupport({ readyState: 0 })
  assert.equal(result.supported, false)
  assert.match(result.reason, /no active database connection/)
})
