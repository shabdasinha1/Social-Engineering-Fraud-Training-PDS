import { VIEW_BY_INTENT, fakeActionCodes, translateFakeCode } from '@/test/actionMap'

/**
 * A fake attempt API for the component tests (UI-001).
 *
 * It is a stubbed `fetch`, not a stubbed module: requests go through the real
 * `apiClient`, the real `attemptApi` and the real controller, so path building, the error
 * envelope, `intent_key` and `expected_stage` are all exercised rather than assumed. Only
 * the socket is missing.
 *
 * The scenario content is a real DATA-003 record - a browser page and a payment screen
 * included, which is what makes the branch-stage controls appear - so the renderers are
 * tested against the shape they will actually receive.
 *
 * IMMERSIVE-003A re-keyed it from W02 to a scenario id OUTSIDE the authored batch. That
 * is deliberate and it is what this fixture is for: these suites test the GENERIC path -
 * the platform renderer plus the action sheet - which is still how every scenario without
 * an authored scene is played. The authored ones are covered by `WhatsAppScene.test.jsx`
 * and `SceneScenarios*.test.jsx`, against their real content.
 *
 * IMMERSIVE-003C re-keyed it again, from W12 to W99, because authoring W12 silently turned
 * fifteen generic-path tests into scene tests that timed out looking for an action sheet.
 * W99 is not in the bank, so no future batch can collide with it; the parcel wording is
 * kept because the renderers were built against it, and is fixture text only.
 */

export const SCENARIO_GENERIC = {
  id: 'def-generic',
  scenario_id: 'W99',
  version: 1,
  platform: 'whatsapp',
  synthetic: {
    sender: {
      display_name: 'QuickParcel Support',
      identifier: '+91 00000 31447',
      avatar_initials: 'QS',
      avatar_kind: 'initials',
      name_source: 'client_specification',
      identifier_source: 'placeholder',
      verified: false,
      first_seen: '10:02',
    },
    prior_context: 'A delivery service asks for a small redelivery fee.',
    assets: [
      {
        asset_id: 'W99-notif-01',
        kind: 'notification',
        inert: true,
        label: 'whatsapp notification',
        content: {
          sender: 'QuickParcel Support',
          body: 'Your parcel is held. Pay the redelivery fee to release it.',
          platform: 'whatsapp',
          received_at: '09:41',
          source: 'client_specification',
        },
      },
      {
        asset_id: 'W99-sender-01',
        kind: 'sender_profile',
        inert: true,
        label: 'QuickParcel Support',
        content: {
          display_name: 'QuickParcel Support',
          identifier: '+91 00000 31447',
          avatar_initials: 'QS',
          avatar_kind: 'initials',
          verified: false,
          first_seen: '10:02',
        },
      },
      {
        asset_id: 'W99-thread-01',
        kind: 'message_thread',
        inert: true,
        label: 'QuickParcel Support thread',
        content: {
          header: {
            title: 'QuickParcel Support',
            subtitle: '+91 00000 31447',
            avatarSeed: 'QS',
          },
          blocks: [
            { type: 'note', text: 'A delivery service asks for a small redelivery fee.' },
            {
              type: 'message',
              from: 'them',
              text: 'Your parcel is held. Pay the redelivery fee to release it.',
              time: '09:41',
            },
          ],
        },
      },
      {
        asset_id: 'W99-dir-01',
        kind: 'trusted_directory_entry',
        inert: true,
        label: 'Local approved directory',
        content: {
          name: 'Unit Falcon Support Desk',
          identifier: '+91 00000 21986',
          provenance: 'local approved directory',
          matches_message_sender: false,
          source: 'placeholder',
        },
      },
      {
        asset_id: 'W99-browser-01',
        kind: 'browser_page',
        inert: true,
        label: 'Offline safe browser',
        display_target: 'https://w12.training.example/verify',
        content: {
          title: 'Training simulation page',
          host: 'w12.training.example',
          body: 'An offline tracking page requesting card details.',
          fields: [],
          source: 'placeholder',
          network: 'blocked',
        },
      },
      {
        asset_id: 'W99-payment-01',
        kind: 'payment_screen',
        inert: true,
        label: 'Payment request',
        content: {
          payee: 'QuickParcel Support',
          amount_label: 'INR 0.00',
          reference: 'TRAIN-W99',
          real_payment: false,
          stores_card_data: false,
          source: 'placeholder',
        },
      },
    ],
  },
  stages: [
    { index: 1, key: 'notify', ui_to_build: 'Dashboard toast.', transitions: [], events: [], asset_refs: ['W99-notif-01'] },
    { index: 2, key: 'open', ui_to_build: 'Thread.', transitions: [], events: [], asset_refs: ['W99-thread-01'] },
    { index: 3, key: 'inspect', ui_to_build: 'Contact sheet.', transitions: [], events: [], asset_refs: ['W99-sender-01'] },
    { index: 4, key: 'branch', ui_to_build: 'Browser and payment.', transitions: [], events: [], asset_refs: [] },
    { index: 5, key: 'verify', ui_to_build: 'Trusted directory.', transitions: [], events: [], asset_refs: ['W99-dir-01'] },
    { index: 6, key: 'resolve', ui_to_build: 'Outcome card.', transitions: [], events: [], asset_refs: [] },
  ],
}

const STAGE_ORDER = ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve']

/**
 * Which stage each intent moves to, mirroring the engine's own `STAGE_INTENTS`.
 * Test-side only, and deliberately COMPLETE: an intent missing from this map does not
 * fail, it silently leaves the stage where it was, so a gap here looks exactly like a
 * scene bug. `sceneModel.test.js` checks every intent the server map uses is a key here.
 *
 * SECURITY-001: the browser never sends an intent. This fake server, like the real one,
 * receives an opaque `action_code` and translates it with the server's own map
 * (`@/test/actionMap`), so these tables are keyed by what the SERVER derives.
 */
const NEXT_STAGE = {
  open_item: 'open',
  dismiss: 'notify',
  read: 'inspect',
  inspect_sender: 'branch',
  inspect_profile: 'branch',
  inspect_link: 'branch',
  preview_file: 'branch',
  inspect_qr: 'branch',
  read_thread: 'branch',
  skip_inspection: 'branch',
  safe_pivot: 'verify',
  reject_ignore: 'verify',
  open_link: 'verify',
  open_file: 'verify',
  scan_qr: 'verify',
  call_number: 'verify',
  share_location: 'verify',
  share_secret: 'verify',
  submit_data: 'verify',
  attempt_payment: 'verify',
  attempt_install: 'verify',
  approve_device_link: 'verify',
  reply: 'verify',
  verify_trusted_directory: 'resolve',
  verify_known_app: 'resolve',
  verify_known_number: 'resolve',
  verify_in_message_contact: 'resolve',
  report: 'resolve',
  block: 'resolve',
}

/** Intents the engine treats as a premature action when sent at the open stage. */
const PREMATURE_AT_OPEN = [
  'reply', 'open_link', 'submit_data', 'attempt_payment', 'attempt_install', 'call_number',
]

/** The rendering instruction each risky intent returns, mirroring STAGE_INTENTS. */
const CONSEQUENCES = {
  open_link: 'simulated_browser_open',
  open_file: 'simulated_file_preview',
  scan_qr: 'simulated_qr_inspect',
  call_number: 'simulated_call',
  share_location: 'simulated_data_submission',
  attempt_payment: 'simulated_payment',
  attempt_install: 'simulated_install',
  approve_device_link: 'simulated_device_link',
  reply: 'simulated_reply_sent',
  submit_data: 'simulated_data_submission',
  share_secret: 'simulated_data_submission',
}

/**
 * A minimal stand-in for the server: it owns the stage, the ordinal and the sequence, so
 * a test can only advance the UI by going through it - exactly like the real engine.
 */
export function createFakeServer({ totalRuns = 10, mode = 'assessment', scenario = SCENARIO_GENERIC } = {}) {
  const server = {
    /** The scenario `/current-run` serves. Scene suites pass a real W01-W05 payload. */
    scenario,
    attemptId: 'attempt-1',
    mode,
    status: 'in_progress',
    ordinal: 1,
    stage: 'notify',
    sequence: 0,
    resolved: 0,
    runStatus: 'active',
    totalRuns,
    seenIntentKeys: new Map(),
    calls: [],
    /** null means no comparable previous attempt; a number makes one available. */
    previousScore: null,
    /** Set to a code to make the next intent submission fail with it. */
    failNextWith: null,
    /**
     * Commit the next intent but lose the response, the way a dropped connection would.
     * The retry then carries the same `intent_key` and must replay, not rescore.
     */
    dropNextResponse: false,

    /**
     * IMMERSIVE-001. Defaults describe a LIVE attempt with 90 minutes left, so every
     * existing test is unaffected; a timer test moves `expiresAt` into the past.
     */
    expiresAt: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    serverNow: new Date().toISOString(),
    endReason: null,
    timedOut: false,
    unresolvedAtExpiry: 0,

    /** How many attempts the learner has already FINISHED. Drives /progress. */
    completedAttempts: 0,

    /**
     * ENHANCEMENT-003. True makes this the Demo User's demo attempt: the projection carries
     * `is_demo`, and `/demo-skip` is answered. False (every existing suite) sends no
     * `is_demo` key and answers `/demo-skip` with the real server's 404.
     */
    isDemo: false,
  }

  server.runId = () => `run-${server.ordinal}`

  server.attemptState = () => ({
    attempt_id: server.attemptId,
    mode: server.mode,
    status: server.status,
    total_scenarios: server.totalRuns,
    started_at: '2026-09-05T09:00:00.000Z',
    completed_at: server.status === 'completed' ? '2026-09-05T09:30:00.000Z' : null,
    total_score: server.status === 'completed' ? 74 : null,
    expires_at: server.expiresAt,
    /** Re-read per call, the way the real projection stamps it. */
    server_now: server.serverNow ?? new Date().toISOString(),
    end_reason: server.endReason,
    ...(server.isDemo ? { is_demo: true } : {}),
    progress: {
      resolved: server.resolved,
      total: server.totalRuns,
      all_resolved: server.resolved >= server.totalRuns,
    },
    current_run:
      server.resolved >= server.totalRuns
        ? null
        : {
            run_id: server.runId(),
            ordinal: server.ordinal,
            platform: server.scenario.platform,
            current_stage: server.stage,
            status: server.runStatus,
          },
  })

  /**
   * `withOrdinal` mirrors the real API: only `/current-run` adds `ordinal`, because
   * `ScenarioRun`'s candidate projection is key-exact and does not carry it. Event and
   * resolve responses must therefore leave it out, or the client's handling of that gap
   * goes untested.
   */
  server.runState = ({ withOrdinal = true } = {}) => ({
    run_id: server.runId(),
    ...(withOrdinal ? { ordinal: server.ordinal } : {}),
    scenario_id: server.scenario.scenario_id,
    version: 1,
    platform: server.scenario.platform,
    current_stage: server.stage,
    status: server.runStatus,
    last_sequence: server.sequence,
    started_at: '2026-09-05T09:00:00.000Z',
    resolved_at: server.runStatus === 'resolved' ? '2026-09-05T09:05:00.000Z' : null,
  })

  /** The codes `/current-run` issues for the run on screen (SECURITY-001). */
  server.actionCodes = () => fakeActionCodes(server.runId(), server.scenario.scenario_id)

  return server
}

export { NEXT_STAGE }

/** Installs the fake server as `globalThis.fetch`. Returns the server so tests can drive it. */
export function installFetch(server) {
  globalThis.fetch = async (url, options = {}) => {
    // The base URL comes from the environment, so strip any origin before matching.
    const path = String(url).replace(/^https?:\/\/[^/]+/, '').replace(/^\/api/, '')
    const body = options.body ? JSON.parse(options.body) : null
    const call = { path, method: options.method ?? 'GET', body }
    server.calls.push(call)

    const ok = (data) => ({
      ok: true,
      status: 200,
      json: async () => data,
    })
    const err = (status, code, message, details = null) => ({
      ok: false,
      status,
      json: async () => ({ error: { code, message, details } }),
    })

    if (path === '/attempts/current') {
      /**
       * IMMERSIVE-001: mirrors the real controller. An attempt that ended on the clock is
       * still reported here, because the learner may be reopening the browser after the
       * sweeper finalised it and needs to be told that, not told they have no assessment.
       */
      if (server.status === 'in_progress') return ok({ attempt: server.attemptState() })
      if (server.endReason === 'expired') return ok({ attempt: server.attemptState() })
      return ok({ attempt: null })
    }

    /**
     * IMMERSIVE-002: the in-shell history panel reads this. Aggregate only, and counting
     * COMPLETED attempts - the live one is excluded by the server's own definition, which
     * is what the panel relies on.
     */
    if (path === '/progress') {
      return ok({
        progress: {
          attempt_count: server.completedAttempts,
          scenarios_completed: server.completedAttempts * 10,
          last_score: server.completedAttempts ? 74 : null,
          best_score: server.completedAttempts ? 88 : null,
          max_score: 100,
          by_platform: [],
          by_family: [],
          mixed_versions: false,
          generated_at: '2026-09-09T09:00:00.000Z',
        },
      })
    }

    if (path === `/attempts/${server.attemptId}/current-run`) {
      if (server.resolved >= server.totalRuns) {
        return ok({ run: null, scenario: null, attempt: server.attemptState() })
      }
      return ok({
        run: server.runState(),
        scenario: server.scenario,
        actions: server.actionCodes(),
        attempt: server.attemptState(),
      })
    }

    if (path === `/attempts/${server.attemptId}/result`) {
      return ok({ result: resultPayload(server) })
    }

    if (path === `/attempts/${server.attemptId}/complete`) {
      server.status = 'completed'
      return ok({ attempt: server.attemptState(), result: resultPayload(server) })
    }

    /** ENHANCEMENT-003, as the real controller: 404 unless demo, stage-checked, then next run. */
    const skipMatch = path.match(/^\/attempts\/(.+)\/runs\/(.+)\/demo-skip$/)
    if (skipMatch) {
      if (!server.isDemo) return err(404, 'NOT_FOUND', `Route not found: POST /api${path}`)
      if (server.failNextWith) {
        const { code, status } = server.failNextWith
        server.failNextWith = null
        return err(status ?? 409, code, `simulated ${code}`)
      }
      const keys = Object.keys(body ?? {})
      if (keys.length !== 1 || keys[0] !== 'expected_stage') {
        return err(422, 'FORBIDDEN_FIELD', 'The server decides these values.')
      }
      if (skipMatch[2] !== server.runId() || server.runStatus === 'resolved') {
        return err(409, 'RUN_NOT_ACTIVE', 'This scenario has already been completed.')
      }
      if (body.expected_stage !== server.stage) {
        return err(409, 'STALE_STATE', 'the run has moved on')
      }
      server.resolved += 1
      if (server.resolved < server.totalRuns) nextRun(server)
      return ok({ skipped: true, attempt: server.attemptState() })
    }

    const eventMatch = path.match(/^\/attempts\/(.+)\/runs\/(.+)\/(events|resolve)$/)
    if (eventMatch) {
      const [, , runId, kind] = eventMatch

      if (server.failNextWith) {
        const { code, status, details } = server.failNextWith
        server.failNextWith = null
        return err(status ?? 409, code, `simulated ${code}`, details ?? null)
      }

      if (runId !== server.runId()) {
        return err(404, 'NOT_FOUND', 'scenario run not found')
      }

      // SECURITY-001, as the real controller: an intent is refused, a code is translated.
      if ('intent' in body) {
        return err(422, 'FORBIDDEN_FIELD', 'The server decides these values.', { rejected_fields: ['intent'] })
      }
      const entry = translateFakeCode(runId, server.scenario.scenario_id, body.action_code)
      if (!entry || (kind === 'resolve' && entry.stage !== 'resolve')) {
        return err(422, 'INVALID_ACTION', 'That action is not available here.')
      }
      if (body.expected_stage && body.expected_stage !== entry.stage) {
        return err(422, 'INVALID_ACTION', 'That action is not available here.')
      }
      // What the server derived; recorded for the suites, never part of the request.
      call.intent = entry.intent
      call.controlId = entry.controlId

      // Idempotency: the same key replays the original outcome, scored once.
      const seen = server.seenIntentKeys.get(body.intent_key)
      if (seen) return ok({ ...seen, duplicate: true, attempt: server.attemptState() })

      const drop = server.dropNextResponse
      server.dropNextResponse = false

      // The control's own stage is the expected stage, exactly as the real controller sets it.
      if (entry.stage !== server.stage) {
        return err(409, 'STALE_STATE', 'the run has moved on', {
          current_stage: server.stage,
          last_sequence: server.sequence,
        })
      }

      const { intent } = entry
      const resolving = kind === 'resolve'
      server.sequence += 1
      /**
       * Section 4's "premature action -> 4" edge: acting at the OPEN stage lands on
       * branch, not on the stage that action would reach later. Mirrored here so a test
       * can drive the premature route the way the engine really answers it.
       */
      const premature = server.stage === 'open' && PREMATURE_AT_OPEN.includes(intent)
      server.stage = resolving
        ? 'resolve'
        : premature ? 'branch' : (NEXT_STAGE[intent] ?? server.stage)

      if (resolving) {
        server.runStatus = 'resolved'
        server.resolved += 1
      }

      const payload = {
        run: server.runState({ withOrdinal: false }),
        // SECURITY-001: the candidate response carries no event code.
        event: {
          sequence: server.sequence,
          stage: STAGE_ORDER.includes(server.stage) ? server.stage : 'notify',
          accepted_at: '2026-09-05T09:01:00.000Z',
        },
        consequence: CONSEQUENCES[intent]
          ? { kind: CONSEQUENCES[intent], target: body.synthetic_target_id ?? null, inert: true, executes: false }
          : null,
        score_visibility: resolving ? 'final' : 'hidden',
        score_0_10: resolving ? 8 : null,
        outcome_code: resolving ? intent : null,
        view: VIEW_BY_INTENT[intent] ?? null,
      }

      server.seenIntentKeys.set(body.intent_key, payload)
      // Committed, but the caller never hears about it.
      if (drop) throw new TypeError('fetch failed')
      return ok({ ...payload, attempt: server.attemptState() })
    }

    if (path === '/candidates/me') {
      /**
       * The authoritative LearnerProfile projection (PROFILE-001). The service number is
       * masked by the server now, and neither the ObjectId nor the raw number is sent -
       * so a fixture that supplied them would be testing a payload the API cannot produce.
       */
      return ok({
        candidate: {
          display_name: 'Test Learner',
          service_no_masked: '•••••3456',
          created_at: '2026-09-01T09:00:00.000Z',
          last_seen_at: '2026-09-08T09:00:00.000Z',
          briefing: {
            required_version: 1,
            acknowledged_version: 1,
            acknowledged_at: '2026-09-01T09:01:00.000Z',
            acknowledged: true,
          },
        },
      })
    }

    return err(404, 'NOT_FOUND', `no stub for ${path}`)
  }

  return server
}

/** Moves the fake server on to the next scenario, the way a real resolve does. */
export function nextRun(server) {
  server.ordinal += 1
  server.stage = 'notify'
  server.runStatus = 'active'
  server.sequence = 0
}

/**
 * The REVIEW-001 learning review, in the shape the real server builds it.
 *
 * One scenario carries a mistake and the rest are clean, so a single fixture exercises
 * both card shapes - and the mistake card holds two mistakes, because the ordering of
 * several mistakes in one scenario is part of the contract the screen has to honour.
 */
const SAFE_PATH = [
  { step: 1, stage: 'notify', action: 'opened_notification' },
  { step: 2, stage: 'open', action: 'read_the_item' },
  { step: 3, stage: 'inspect', action: 'inspected_the_details' },
  { step: 4, stage: 'branch', action: 'declined_the_request' },
  { step: 5, stage: 'verify', action: 'verified_independently' },
  { step: 6, stage: 'resolve', action: 'resolved_as_required' },
]

const CORRECT_PATH = [
  { step: 1, stage: 'notify', action: 'opened_notification' },
  { step: 2, stage: 'open', action: 'read_the_item' },
  { step: 3, stage: 'inspect', action: 'inspected_the_details' },
  { step: 4, stage: 'branch', action: 'declined_the_request' },
  { step: 5, stage: 'verify', action: 'verified_independently' },
  { step: 6, stage: 'resolve', action: 'reported_or_blocked_it' },
]

const MISTAKE_REVIEW = {
  status: 'mistake',
  headline: 'You released details, paid, installed or approved access before verifying.',
  note: null,
  learning_issue: {
    key: 'missed_threat',
    label: 'Missed threat',
    description: 'This item was harmful and was not stopped, or was acted on before it was stopped.',
  },
  mistakes: [
    {
      kind: 'released_details_or_paid',
      stage: 'branch',
      label: 'Released details or paid',
      what_you_did: 'You submitted details, attempted a payment, installed something or approved access while the request was still unverified.',
      correct_action: 'Do not open the redelivery link or enter card details. Use Back or Close only.',
      why_it_mattered: 'This is the step that cannot be taken back.',
    },
    {
      kind: 'verified_through_the_message',
      stage: 'verify',
      label: 'Checked using the message itself',
      what_you_did: 'You verified the request through a number, link or contact supplied inside the message you were checking.',
      correct_action: 'Verify independently: check the shipment in the courier app you already use.',
      why_it_mattered: 'A check that uses the message to confirm the message settles nothing.',
    },
  ],
  key_cue: 'An unexpected fee for a parcel you did not send for.',
  missed_cues: ['An unexpected fee for a parcel you did not send for.'],
  what_it_was: 'Malicious - Delivery impersonation / payment phishing',
  correct_action: 'Check the courier through an app or number you already hold.',
  why_it_mattered: 'The fake checkout records no data and returns to a reported chat.',
  safe_response: 'Never pay a fee from a link in an unexpected message.',
  your_path: [
    { step: 1, stage: 'notify', action: 'opened_notification' },
    { step: 2, stage: 'open', action: 'read_the_item' },
    { step: 3, stage: 'branch', action: 'released_details_or_paid' },
    { step: 4, stage: 'verify', action: 'used_contact_from_the_message' },
    { step: 5, stage: 'resolve', action: 'resolved_as_required' },
  ],
  correct_path: CORRECT_PATH,
}

const CORRECT_REVIEW = {
  status: 'correct',
  headline: 'You handled this one correctly.',
  note: null,
  learning_issue: null,
  mistakes: [],
  key_cue: 'An unexpected fee for a parcel you did not send for.',
  missed_cues: ['An unexpected fee for a parcel you did not send for.'],
  what_it_was: 'Malicious - Delivery impersonation / payment phishing',
  correct_action: 'Check the courier through an app or number you already hold.',
  why_it_mattered: null,
  safe_response: 'Never pay a fee from a link in an unexpected message.',
  your_path: SAFE_PATH,
  correct_path: CORRECT_PATH,
}

/**
 * The RESULT-001 projection, in the shape the real server sends it.
 *
 * Kept faithful on purpose: the result screen is a pure presentation layer, so a stub
 * that omitted `summary`, `behaviour`, `comparison` or `remediation` would test a
 * contract the backend does not have.
 */
function resultPayload(server) {
  const scenarios = Array.from({ length: server.totalRuns }, (_, index) => ({
    ordinal: index + 1,
    platform: 'whatsapp',
    score_0_10: index === 0 ? 4 : 7,
    outcome_code: 'resolve_report',
    final_stage: 'resolve',
    resolved_at: '2026-09-05T09:05:00.000Z',
    review: index === 0 ? MISTAKE_REVIEW : CORRECT_REVIEW,

    scenario_ref: `W0${(index % 9) + 1}`,
    platform_label: 'WhatsApp',
    sender: 'QuickParcel Support',
    preview: 'Your parcel is held. Pay the redelivery fee to release it.',
    outcome_class: index === 0 ? 'missed_threat' : 'handled_safely',
    max_score: 10,
    path: [
      { step: 1, stage: 'notify', action: 'opened_notification' },
      { step: 2, stage: 'open', action: 'read_the_item' },
      { step: 3, stage: 'inspect', action: 'inspected_the_details' },
      { step: 4, stage: 'branch', action: 'declined_the_request' },
      { step: 5, stage: 'verify', action: 'verified_independently' },
      { step: 6, stage: 'resolve', action: 'resolved_as_required' },
    ],
    feedback: {
      result: 'Malicious - Delivery impersonation / payment phishing',
      cues: ['An unexpected fee for a parcel you did not send for.'],
      safe_action: 'Check the courier through an app or number you already hold.',
      impact: 'The fake checkout records no data and returns to a reported chat.',
      prevention_habit: 'Never pay a fee from a link in an unexpected message.',
    },
  }))

  return {
    attempt_id: server.attemptId,
    status: 'completed',
    mode: server.mode,
    total_score: 74,
    max_score: 100,
    scenarios_resolved: server.totalRuns,
    scenarios_total: server.totalRuns,
    started_at: '2026-09-05T09:00:00.000Z',
    completed_at: '2026-09-05T09:30:00.000Z',

    summary: {
      total_score: 74,
      max_score: 100,
      scenarios: server.totalRuns,
      handled_safely: 9,
      missed_threats: 1,
      false_positives: 0,
      unsafe_handling: 0,
      not_resolved: server.timedOut ? server.unresolvedAtExpiry : 0,
      duration_ms: 1_800_000,
    },

    /** REVIEW-001. Counted server-side from the same entries the cards are built from. */
    review_summary: {
      scenarios: server.totalRuns,
      correct_decisions: server.totalRuns - 1,
      scenarios_with_mistakes: 1,
      not_resolved: 0,
      mistakes: 2,
      missed_threats: 1,
      false_positives: 0,
      unsafe_handling: 0,
      verification_successes: server.totalRuns - 1,
    },

    // --- IMMERSIVE-001 -----------------------------------------------------
    end_reason: server.endReason,
    timed_out: server.timedOut,
    time_limit_ms: server.timedOut ? 90 * 60 * 1000 : null,
    unresolved_at_expiry: server.timedOut ? server.unresolvedAtExpiry : null,

    scenarios,

    behaviour: {
      by_platform: [
        { key: 'whatsapp', label: 'WhatsApp', scenarios: 10, points: 74, max_points: 100, missed_threats: 1, false_positives: 0 },
      ],
      by_family: [
        { key: 'payment_diversion', label: 'Payment diversion', scenarios: 4, points: 25, max_points: 40, missed_threats: 1, false_positives: 0 },
        { key: 'credential_phishing', label: 'Credential phishing', scenarios: 6, points: 49, max_points: 60, missed_threats: 0, false_positives: 0 },
      ],
      by_trigger: [
        { key: 'urgency', label: 'Urgency', scenarios: 7, points: 52, max_points: 70, missed_threats: 1, false_positives: 0 },
      ],
      by_stage: [
        { stage: 'inspect', scenarios_reached: 10, constructive_actions: 10 },
        { stage: 'branch', scenarios_reached: 10, constructive_actions: 9 },
        { stage: 'verify', scenarios_reached: 10, constructive_actions: 10 },
        { stage: 'resolve', scenarios_reached: 10, constructive_actions: 9 },
      ],
    },

    comparison: server.previousScore === null
      ? { available: false, reason: 'no_previous_attempt' }
      : {
        available: true,
        previous_attempt_id: 'attempt-0',
        previous_total_score: server.previousScore,
        previous_completed_at: '2026-09-04T09:30:00.000Z',
        delta: 74 - server.previousScore,
        attempts_compared: 2,
      },

    remediation: [
      {
        family_key: 'payment_diversion',
        label: 'Payment diversion',
        reason: 'A threat in this area was not stopped.',
        points: 25,
        max_points: 40,
        practice_scenarios_available: 6,
      },
    ],
  }
}
