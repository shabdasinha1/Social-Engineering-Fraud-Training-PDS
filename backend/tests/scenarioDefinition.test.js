import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CANONICAL_FAMILIES,
  CANONICAL_TRIGGERS,
  SCORING_EVENTS,
  STAGE_KEYS,
} from '../src/constants/scenarioDefinition.js'
import { ScenarioDefinition } from '../src/models/ScenarioDefinition.js'

/**
 * DATA-001 schema tests.
 *
 * No database. Every check runs `await doc.validate()` on an unsaved document,
 * which executes the schema validators AND the synchronous pre('validate') hook
 * offline. `validateSync()` is deliberately not used: it skips pre-validate
 * middleware and is deprecated in Mongoose 9.
 */

/* ------------------------------------------------------------------ *
 * Fixtures - shaped like the client bank, not invented content
 * ------------------------------------------------------------------ */

const STAGE_UI = {
  notify: 'Dashboard toast, WhatsApp-style tile, unread badge and timestamp.',
  open: 'Chat list, unread pill, thread header, bubbles and prior-message history.',
  inspect: 'Contact info sheet with full number, mutual groups and report controls.',
  branch: 'Chat-native preview plus offline safe browser, file viewer and call screen.',
  verify: 'Three-dot action sheet and independent Trusted Directory overlay.',
  resolve: 'Outcome card, rationale box, warning-sign chips and Return to dashboard.',
}

const VISIBLE_STAGES = [
  {
    key: 'notify',
    transitions: [{ on: 'open_item', to: 'open' }, { on: 'dismiss', to: 'self' }],
    events: ['notification_seen', 'open_latency_ms'],
    asset_refs: ['thread-01'],
  },
  {
    key: 'open',
    transitions: [{ on: 'read', to: 'inspect' }, { on: 'premature_action', to: 'branch' }],
    events: ['item_opened', 'dwell_ms', 'premature_reply'],
    asset_refs: ['thread-01'],
  },
  {
    key: 'inspect',
    transitions: [{ on: 'inspect', to: 'branch' }, { on: 'skip', to: 'branch' }],
    events: ['sender_inspected', 'profile_viewed'],
    asset_refs: ['sender-01'],
  },
  {
    key: 'branch',
    transitions: [{ on: 'safe_action', to: 'verify' }, { on: 'risky_action', to: 'verify' }],
    events: ['reply_sent', 'data_submitted'],
    asset_refs: [],
  },
  {
    key: 'verify',
    transitions: [{ on: 'trusted_check', to: 'resolve' }, { on: 'in_message_check', to: 'branch' }],
    events: ['verify_started', 'verify_source', 'report_selected'],
    asset_refs: ['directory-01'],
  },
  {
    key: 'resolve',
    transitions: [{ on: 'complete', to: 'end' }, { on: 'abandon', to: 'end' }],
    events: ['resolution_code', 'scenario_points', 'duration_ms'],
    asset_refs: [],
  },
].map((s, i) => ({ ...s, index: i + 1, ui_to_build: STAGE_UI[s.key] }))

const EVAL_SCORING = {
  notify: [{ event_code: 'NOTIFY_SEEN', points_delta: 0 }],
  open: [
    { event_code: 'ITEM_OPEN', points_delta: 0 },
    { event_code: 'PREMATURE_REPLY', points_delta: -1 },
  ],
  inspect: [{ event_code: 'INSPECT_CONTEXT', points_delta: 2 }],
  branch: [
    { event_code: 'SAFE_PIVOT', points_delta: 3 },
    { event_code: 'RISKY_OPEN_REPLY', points_delta: -3, critical: true },
    { event_code: 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', points_delta: -8, critical: true },
  ],
  verify: [
    { event_code: 'TRUSTED_VERIFY', points_delta: 3 },
    { event_code: 'REPORT_ONLY_WITHOUT_CHECK', points_delta: 1 },
    { event_code: 'VERIFY_THROUGH_MESSAGE', points_delta: 0 },
  ],
  resolve: [
    { event_code: 'RESOLVE_CORRECT', points_delta: 2 },
    { event_code: 'CONTRADICTORY_UNSAFE_FINAL', points_delta: -4, critical: true },
  ],
}

const EVAL_STAGES = STAGE_KEYS.map((key, i) => ({
  index: i + 1,
  key,
  learner_flow: `Stage ${i + 1} synthetic content for the ${key} stage.`,
  expected_safe_behavior: `Expected safe behaviour at the ${key} stage.`,
  scoring_text: `Client scoring text for the ${key} stage.`,
  expected_actions:
    key === 'inspect'
      ? [{ action: 'inspect_sender', expected: true, scoring_event: 'INSPECT_CONTEXT' }]
      : key === 'verify'
        ? [{ action: 'verify_trusted_directory', expected: true, scoring_event: 'TRUSTED_VERIFY' }]
        : [],
  scoring: EVAL_SCORING[key],
}))

const ASSETS = [
  { asset_id: 'thread-01', kind: 'message_thread', label: 'Courier thread' },
  { asset_id: 'sender-01', kind: 'sender_profile', label: 'Unsaved number' },
  {
    asset_id: 'directory-01',
    kind: 'trusted_directory_entry',
    label: 'Local approved directory',
  },
]

/** A malicious WhatsApp scenario, non-military. Shaped after W01. */
function maliciousDoc(overrides = {}) {
  return {
    scenario_id: 'W01',
    version: 1,
    active: true,
    platform: 'whatsapp',
    level: 'easy',
    disposition: 'malicious',
    family: 'Account takeover / OTP theft',
    canonical_family: 'account_takeover_authorisation_abuse',
    trigger: 'Helpfulness + urgency',
    canonical_triggers: ['helpfulness', 'urgency'],
    military_flag: false,
    legitimate_control: false,
    synthetic: { sender: { display_name: '+91 80xxx' }, prior_context: null, assets: ASSETS },
    stages: VISIBLE_STAGES,
    evaluation: {
      title: 'The Accidental Login Code',
      end_state: 'Chat closes as Reported + Blocked.',
      feedback: {
        result: 'Malicious - account takeover attempt.',
        cues: ['A code sent to your own phone was requested by someone else.'],
        safe_action: 'Refuse, then report and block.',
        impact: 'Sharing the code would hand over the account.',
        prevention_habit: 'Never relay a code you did not request.',
      },
      stages: EVAL_STAGES,
    },
    ...overrides,
  }
}

/** A legitimate, military-context WhatsApp scenario. Shaped after W03. */
function legitimateDoc(overrides = {}) {
  const base = maliciousDoc()
  return {
    ...base,
    scenario_id: 'W03',
    level: 'easy',
    disposition: 'legitimate',
    family: 'Legitimate group invitation',
    canonical_family: 'legit_coordination_request',
    trigger: 'Familiarity | FICTIONAL MILITARY CONTEXT',
    canonical_triggers: ['familiarity'],
    military_flag: true,
    legitimate_control: true,
    evaluation: {
      ...base.evaluation,
      title: 'Known Sports Meet Group',
      end_state: 'Poll choice is saved; the group remains as background traffic.',
      feedback: {
        result: 'Legitimate - expected coordination request.',
        cues: ['The number matches the local directory and the event was expected.'],
        safe_action: 'Answer the in-app poll and keep the group.',
        impact: 'Reporting it would remove a legitimate channel.',
        prevention_habit: 'Match sender, context and requested action before acting.',
      },
      stages: EVAL_STAGES.map((s) =>
        s.key === 'branch'
          ? {
              ...s,
              scoring: [
                { event_code: 'CORRECT_USE', points_delta: 3 },
                { event_code: 'NEEDLESS_REJECT_IGNORE', points_delta: -2 },
                { event_code: 'UNSAFE_EXTERNAL_ACTION', points_delta: -4, critical: true },
              ],
            }
          : s.key === 'verify'
            ? {
                ...s,
                scoring: [
                  { event_code: 'TRUSTED_VERIFY', points_delta: 3 },
                  { event_code: 'FALSE_REPORT_BLOCK', points_delta: -4 },
                  { event_code: 'VERIFY_THROUGH_MESSAGE', points_delta: 0 },
                ],
              }
            : s,
      ),
    },
    ...overrides,
  }
}

const clone = (o) => structuredClone(o)

/** Runs full validation offline; returns the ValidationError or null. */
async function validationError(doc) {
  try {
    await new ScenarioDefinition(doc).validate()
    return null
  } catch (error) {
    return error
  }
}

async function assertInvalid(doc, path, label) {
  const error = await validationError(doc)
  assert.ok(error, `${label}: expected a validation error, got none`)
  assert.ok(
    Object.keys(error.errors).some((p) => p === path || p.startsWith(`${path}.`)),
    `${label}: expected an error on "${path}", got ${JSON.stringify(Object.keys(error.errors))}`,
  )
}

/* ------------------------------------------------------------------ *
 * 1, 14, 15, 16 - valid documents
 * ------------------------------------------------------------------ */

test('a valid malicious scenario definition passes validation', async () => {
  assert.equal(await validationError(maliciousDoc()), null)
})

test('a legitimate military-context scenario can be represented', async () => {
  const error = await validationError(legitimateDoc())
  assert.equal(error, null)
})

test('a malicious military-context scenario can be represented', async () => {
  const doc = maliciousDoc({
    scenario_id: 'W19',
    level: 'hard',
    family: 'Military impersonation / location collection',
    canonical_family: 'operational_elicitation',
    trigger: 'Authority + secrecy | FICTIONAL MILITARY CONTEXT',
    canonical_triggers: ['authority', 'isolation_secrecy'],
    military_flag: true,
  })
  assert.equal(await validationError(doc), null)
})

test('a three-trigger scenario keeps all canonical triggers in order', async () => {
  const doc = maliciousDoc({
    scenario_id: 'W12',
    level: 'medium',
    family: 'Government impersonation / digital arrest',
    canonical_family: 'coercion_and_extortion',
    trigger: 'Fear + authority + isolation',
    canonical_triggers: ['fear', 'authority', 'isolation_secrecy'],
  })
  assert.equal(await validationError(doc), null)

  const model = new ScenarioDefinition(doc)
  assert.deepEqual(
    model.canonical_triggers.map(String),
    ['fear', 'authority', 'isolation_secrecy'],
    'canonical trigger order must be preserved, not sorted',
  )
})

test('canonical_triggers rejects a repeated value', async () => {
  const doc = maliciousDoc({ canonical_triggers: ['authority', 'authority'] })
  await assertInvalid(doc, 'canonical_triggers', 'duplicate trigger')
})

/* ------------------------------------------------------------------ *
 * 17 - multi-word primitives are IDs, never split tokens
 * ------------------------------------------------------------------ */

test('multi-word primitives are single canonical IDs, not split tokens', async () => {
  const ok = maliciousDoc({
    scenario_id: 'I20',
    level: 'hard',
    family: 'Rapport-based elicitation / espionage pretext',
    canonical_family: 'operational_elicitation',
    platform: 'instagram',
    trigger: 'Expert status + flattery | FICTIONAL MILITARY CONTEXT',
    canonical_triggers: ['expert_status', 'flattery'],
    military_flag: true,
  })
  assert.equal(await validationError(ok), null, 'expert_status must be a valid single ID')

  const socialProof = maliciousDoc({
    trigger: 'Greed + social proof',
    canonical_triggers: ['greed', 'social_proof'],
  })
  assert.equal(await validationError(socialProof), null, 'social_proof must be a valid single ID')

  // The failure mode this guards against: splitting "expert status" on whitespace.
  const split = maliciousDoc({ canonical_triggers: ['expert', 'status'] })
  await assertInvalid(split, 'canonical_triggers', 'whitespace-split trigger tokens')
})

/* ------------------------------------------------------------------ *
 * 2, 3 - the six stages
 * ------------------------------------------------------------------ */

test('a scenario missing a stage fails validation', async () => {
  const doc = clone(maliciousDoc())
  doc.stages = doc.stages.filter((s) => s.key !== 'verify')
  await assertInvalid(doc, 'stages', 'five visible stages')
})

test('a scenario missing an evaluation stage fails validation', async () => {
  const doc = clone(maliciousDoc())
  doc.evaluation.stages = doc.evaluation.stages.slice(0, 5)
  await assertInvalid(doc, 'evaluation.stages', 'five evaluation stages')
})

test('stages in the wrong order fail validation', async () => {
  const doc = clone(maliciousDoc())
  ;[doc.stages[2], doc.stages[3]] = [doc.stages[3], doc.stages[2]]
  await assertInvalid(doc, 'stages', 'inspect and branch swapped')
})

test('a stage carrying the wrong index fails validation', async () => {
  const doc = clone(maliciousDoc())
  doc.stages[4].index = 2
  await assertInvalid(doc, 'stages', 'verify stage indexed 2')
})

/* ------------------------------------------------------------------ *
 * 4, 5, 6, 7, 8 - enums and identity
 * ------------------------------------------------------------------ */

test('an invalid platform fails validation', async () => {
  await assertInvalid(maliciousDoc({ platform: 'telegram' }), 'platform', 'unknown platform')
})

test('a platform contradicting the scenario_id prefix fails validation', async () => {
  await assertInvalid(
    maliciousDoc({ scenario_id: 'E01', platform: 'whatsapp' }),
    'platform',
    'E-prefixed id on whatsapp',
  )
})

test('a malformed scenario_id fails validation', async () => {
  await assertInvalid(maliciousDoc({ scenario_id: 'W26' }), 'scenario_id', 'W26 out of range')
  await assertInvalid(maliciousDoc({ scenario_id: 'WA-01' }), 'scenario_id', 'legacy id format')
})

test('an invalid difficulty fails validation', async () => {
  await assertInvalid(maliciousDoc({ level: 'extreme' }), 'level', 'unknown level')
})

test('an invalid disposition fails validation', async () => {
  await assertInvalid(
    maliciousDoc({ disposition: 'suspicious' }),
    'disposition',
    'unknown disposition',
  )
})

test('an invalid canonical family fails validation', async () => {
  await assertInvalid(
    maliciousDoc({ canonical_family: 'phishing' }),
    'canonical_family',
    'unknown family',
  )
})

test('a legitimate scenario cannot carry a malicious canonical family', async () => {
  const doc = legitimateDoc({ canonical_family: 'credential_phishing' })
  await assertInvalid(doc, 'canonical_family', 'legit disposition with malicious family')
})

test('a malicious scenario cannot carry a legitimate canonical family', async () => {
  const doc = maliciousDoc({ canonical_family: 'legit_routine_broadcast' })
  await assertInvalid(doc, 'canonical_family', 'malicious disposition with legit family')
})

test('legitimate_control must agree with disposition', async () => {
  await assertInvalid(
    maliciousDoc({ legitimate_control: true }),
    'legitimate_control',
    'malicious flagged as a legitimate control',
  )
})

test('an invalid canonical trigger fails validation', async () => {
  await assertInvalid(
    maliciousDoc({ canonical_triggers: ['authority', 'impatience'] }),
    'canonical_triggers',
    'unknown trigger',
  )
})

/* ------------------------------------------------------------------ *
 * 9 - raw trigger / military metadata
 * ------------------------------------------------------------------ */

test('military_flag must match the raw trigger suffix', async () => {
  await assertInvalid(
    maliciousDoc({ trigger: 'Authority + urgency', military_flag: true }),
    'military_flag',
    'flag set without the marker',
  )
  await assertInvalid(
    maliciousDoc({ trigger: 'Authority | FICTIONAL MILITARY CONTEXT', military_flag: false }),
    'military_flag',
    'marker present without the flag',
  )
})

test('an unrecognised trigger suffix fails validation', async () => {
  await assertInvalid(
    maliciousDoc({ trigger: 'Authority | CIVILIAN CONTEXT', military_flag: false }),
    'trigger',
    'unknown suffix',
  )
})

test('a trigger with more than one pipe fails validation', async () => {
  await assertInvalid(
    maliciousDoc({ trigger: 'Authority | FICTIONAL MILITARY CONTEXT | EXTRA' }),
    'trigger',
    'two pipes',
  )
})

test('a trigger with an empty component fails validation', async () => {
  await assertInvalid(maliciousDoc({ trigger: 'Authority + ' }), 'trigger', 'trailing plus')
})

test('the raw client family and trigger are stored verbatim', async () => {
  const doc = new ScenarioDefinition(legitimateDoc())
  assert.equal(doc.family, 'Legitimate group invitation')
  assert.equal(doc.trigger, 'Familiarity | FICTIONAL MILITARY CONTEXT')
  assert.equal(doc.canonical_family, 'legit_coordination_request')
  assert.deepEqual(doc.canonical_triggers.map(String), ['familiarity'])
})

/* ------------------------------------------------------------------ *
 * 10 - transitions, events and asset references
 * ------------------------------------------------------------------ */

test('a transition outside the six-stage model fails validation', async () => {
  const doc = clone(maliciousDoc())
  doc.stages[0].transitions = [{ on: 'open_item', to: 'resolve' }]
  await assertInvalid(doc, 'stages', 'notify jumping to resolve')
})

test('a transition trigger that does not belong to the stage fails validation', async () => {
  const doc = clone(maliciousDoc())
  doc.stages[2].transitions = [{ on: 'trusted_check', to: 'branch' }]
  await assertInvalid(doc, 'stages', 'verify trigger used at inspect')
})

test('a stage with no transitions fails validation', async () => {
  const doc = clone(maliciousDoc())
  doc.stages[3].transitions = []
  await assertInvalid(doc, 'stages', 'branch with no transitions')
})

test('an event that does not belong to its stage fails validation', async () => {
  const doc = clone(maliciousDoc())
  doc.stages[0].events = ['payment_attempted']
  await assertInvalid(doc, 'stages', 'branch event on the notify stage')
})

test('a stage referencing an unknown asset fails validation', async () => {
  const doc = clone(maliciousDoc())
  doc.stages[1].asset_refs = ['thread-99']
  await assertInvalid(doc, 'stages', 'dangling asset reference')
})

test('an unknown asset kind fails validation', async () => {
  const doc = clone(maliciousDoc())
  doc.synthetic.assets[0].kind = 'executable'
  await assertInvalid(doc, 'synthetic.assets', 'executable asset kind')
})

/* ------------------------------------------------------------------ *
 * 11 - feedback shape
 * ------------------------------------------------------------------ */

test('feedback missing a required part fails validation', async () => {
  for (const field of ['result', 'safe_action', 'impact', 'prevention_habit']) {
    const doc = clone(maliciousDoc())
    delete doc.evaluation.feedback[field]
    await assertInvalid(doc, `evaluation.feedback.${field}`, `feedback without ${field}`)
  }
})

test('feedback with no cues fails validation', async () => {
  const doc = clone(maliciousDoc())
  doc.evaluation.feedback.cues = []
  await assertInvalid(doc, 'evaluation.feedback.cues', 'empty cue list')
})

test('feedback carries both immediate and deferred delivery in one structure', async () => {
  const doc = new ScenarioDefinition(maliciousDoc())
  assert.equal(doc.evaluation.feedback.immediate_in_training, true)
})

/* ------------------------------------------------------------------ *
 * Scoring metadata
 * ------------------------------------------------------------------ */

test('an unknown scoring event code fails validation', async () => {
  const doc = clone(maliciousDoc())
  doc.evaluation.stages[3].scoring.push({ event_code: 'MADE_UP_CODE', points_delta: 5 })
  await assertInvalid(doc, 'evaluation.stages', 'invented scoring code')
})

test('every client scoring code from section 5 and the scenario pages is representable', () => {
  const required = [
    'INSPECT_CONTEXT', 'SAFE_PIVOT', 'CORRECT_USE', 'TRUSTED_VERIFY', 'RESOLVE_CORRECT',
    'PREMATURE_REPLY', 'RISKY_OPEN_REPLY', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE',
    'FALSE_REPORT_BLOCK', 'NEEDLESS_REJECT_IGNORE',
    'NOTIFY_SEEN', 'ITEM_OPEN', 'UNSAFE_EXTERNAL_ACTION',
    'REPORT_ONLY_WITHOUT_CHECK', 'VERIFY_THROUGH_MESSAGE', 'CONTRADICTORY_UNSAFE_FINAL',
  ]
  for (const code of required) {
    assert.ok(SCORING_EVENTS[code], `${code} must exist in the scoring vocabulary`)
  }
  const expected = {
    INSPECT_CONTEXT: 2, SAFE_PIVOT: 3, CORRECT_USE: 3, TRUSTED_VERIFY: 3, RESOLVE_CORRECT: 2,
    PREMATURE_REPLY: -1, RISKY_OPEN_REPLY: -3, SECRET_PAYMENT_INSTALL_DATA_RELEASE: -8,
    FALSE_REPORT_BLOCK: -4, NEEDLESS_REJECT_IGNORE: -2, NOTIFY_SEEN: 0, ITEM_OPEN: 0,
    UNSAFE_EXTERNAL_ACTION: -4, REPORT_ONLY_WITHOUT_CHECK: 1, VERIFY_THROUGH_MESSAGE: 0,
    CONTRADICTORY_UNSAFE_FINAL: -4,
  }
  for (const [code, points] of Object.entries(expected)) {
    assert.equal(SCORING_EVENTS[code].points, points, `${code} point delta`)
  }
})

test('the safe path sums to exactly the per-scenario maximum of 10', () => {
  const safe = ['INSPECT_CONTEXT', 'SAFE_PIVOT', 'TRUSTED_VERIFY', 'RESOLVE_CORRECT']
  assert.equal(safe.reduce((n, c) => n + SCORING_EVENTS[c].points, 0), 10)
})

test('scoring min_points cannot exceed max_points', async () => {
  const doc = maliciousDoc({ scoring: { min_points: 8, max_points: 4 } })
  await assertInvalid(doc, 'scoring.min_points', 'inverted score envelope')
})

/* ------------------------------------------------------------------ *
 * 12 - indexes
 * ------------------------------------------------------------------ */

test('scenario_id + version is declared as a unique compound index', () => {
  const indexes = ScenarioDefinition.schema.indexes()
  const unique = indexes.find(
    ([fields, options]) =>
      fields.scenario_id === 1 && fields.version === 1 && options?.unique === true,
  )
  assert.ok(unique, 'expected a unique index on { scenario_id, version }')
})

test('the selection engine query paths are indexed', () => {
  const keys = ScenarioDefinition.schema.indexes().map(([fields]) => Object.keys(fields).join(','))
  for (const expected of [
    'active,platform,level',
    'active,disposition',
    'active,canonical_family',
    'active,canonical_triggers',
    'active,military_flag',
  ]) {
    assert.ok(keys.includes(expected), `missing index on ${expected}; have ${JSON.stringify(keys)}`)
  }
})

/* ------------------------------------------------------------------ *
 * 13 - hidden evaluation data
 * ------------------------------------------------------------------ */

test('evaluation is excluded from default query selection', () => {
  assert.equal(
    ScenarioDefinition.schema.path('evaluation').options.select,
    false,
    'evaluation must be select: false so ordinary queries cannot return it',
  )
})

test('toCandidateJSON exposes no evaluation or classification data', () => {
  const doc = new ScenarioDefinition(maliciousDoc())
  const json = doc.toCandidateJSON()
  const serialised = JSON.stringify(json)

  for (const field of [
    'evaluation', 'title', 'level', 'disposition', 'family', 'canonical_family',
    'trigger', 'canonical_triggers', 'military_flag', 'legitimate_control',
    'end_state', 'feedback', 'expected_actions', 'scoring', 'taxonomy_version',
    'trigger_taxonomy_version', 'quality',
  ]) {
    assert.ok(!(field in json), `toCandidateJSON must not expose "${field}"`)
  }

  // Values, not just keys - a nested leak would pass the key check above.
  for (const value of [
    'The Accidental Login Code', 'account_takeover_authorisation_abuse',
    'Account takeover / OTP theft', 'Helpfulness + urgency', 'easy', 'malicious',
    'INSPECT_CONTEXT', 'Chat closes as Reported',
  ]) {
    assert.ok(!serialised.includes(value), `candidate payload leaked "${value}"`)
  }

  assert.equal(json.scenario_id, 'W01')
  assert.equal(json.platform, 'whatsapp')
  assert.equal(json.stages.length, 6)
  assert.deepEqual(json.stages.map((s) => s.key), STAGE_KEYS)
})

test('toCandidateJSON still carries what a renderer needs', () => {
  const json = new ScenarioDefinition(maliciousDoc()).toCandidateJSON()
  assert.equal(json.synthetic.assets.length, 3)
  assert.ok(json.stages[0].ui_to_build.length > 0)
  assert.deepEqual(json.stages[0].transitions, [
    { on: 'open_item', to: 'open' },
    { on: 'dismiss', to: 'self' },
  ])
})

/* ------------------------------------------------------------------ *
 * Vocabulary sizes fixed by the recorded decisions
 * ------------------------------------------------------------------ */

test('the canonical taxonomies match the sizes recorded in the master plan', () => {
  assert.equal(CANONICAL_FAMILIES.length, 19, '19 canonical families (15 malicious + 4 legitimate)')
  assert.equal(new Set(CANONICAL_FAMILIES).size, 19, 'canonical families must be unique')
  assert.equal(CANONICAL_TRIGGERS.length, 22, '22 canonical triggers')
  assert.equal(new Set(CANONICAL_TRIGGERS).size, 22, 'canonical triggers must be unique')
  assert.equal(STAGE_KEYS.length, 6, 'six stages')
})
