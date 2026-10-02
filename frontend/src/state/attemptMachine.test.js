import { describe, expect, it } from 'vitest'
import {
  PHASE,
  attemptReducer,
  currentStage,
  initialState,
  progressOf,
  readyToComplete,
  scoreVisible,
} from '@/state/attemptMachine'

/**
 * The reducer is the whole of the client's assessment logic, so these tests pin the
 * behaviours the API contract depends on: the stage is never local, a stale state never
 * replays, a duplicate is never counted twice, and the score stays hidden in assessment
 * mode even though the wire carries it.
 */

const attempt = (over = {}) => ({
  attempt_id: 'a1',
  mode: 'assessment',
  status: 'in_progress',
  progress: { resolved: 0, total: 10, all_resolved: false },
  ...over,
})

const run = (over = {}) => ({
  run_id: 'r1',
  ordinal: 1,
  current_stage: 'notify',
  status: 'active',
  last_sequence: 0,
  ...over,
})

describe('attemptReducer', () => {
  it('starts in a loading state with nothing assumed about the attempt', () => {
    expect(initialState.phase).toBe(PHASE.LOADING)
    expect(initialState.attempt).toBeNull()
    expect(initialState.run).toBeNull()
    expect(currentStage(initialState)).toBeNull()
  })

  it('records a loaded run without inventing a stage of its own', () => {
    const next = attemptReducer(initialState, {
      type: 'RUN_LOADED',
      payload: { run: run(), scenario: { scenario_id: 'W02' }, attempt: attempt() },
    })

    expect(next.phase).toBe(PHASE.READY)
    expect(currentStage(next)).toBe('notify')
    expect(next.scenario.scenario_id).toBe('W02')
  })

  it('takes the stage from the committed response, never from the control', () => {
    let state = attemptReducer(initialState, {
      type: 'RUN_LOADED',
      payload: { run: run(), scenario: {}, attempt: attempt() },
    })
    state = attemptReducer(state, { type: 'SUBMIT_START', control: 'gen-c01' })
    expect(state.phase).toBe(PHASE.SUBMITTING)
    expect(state.pendingAction).toBe('gen-c01')

    state = attemptReducer(state, {
      type: 'SUBMIT_OK',
      payload: {
        run: run({ current_stage: 'open' }),
        event: { sequence: 1, stage: 'notify', accepted_at: '2026-09-05T09:01:00.000Z' },
        attempt: attempt(),
      },
    })

    expect(currentStage(state)).toBe('open')
    expect(state.pendingAction).toBeNull()
    expect(state.lastEvent.sequence).toBe(1)
  })

  /**
   * SECURITY-001. The page can only name an action through the codes `/current-run`
   * issued, so they arrive with the scenario, survive event responses unchanged and are
   * dropped when the attempt ends.
   */
  it('holds the action codes the current run was issued, and only those', () => {
    const codes = { 'gen-c01': 'ac_0123456789abcdef0123', 'w01-c01': 'ac_fedcba9876543210fedc' }
    let state = attemptReducer(initialState, {
      type: 'RUN_LOADED',
      payload: { run: run(), scenario: {}, actions: codes, attempt: attempt() },
    })
    expect(state.actionCodes).toEqual(codes)

    state = attemptReducer(state, {
      type: 'SUBMIT_OK',
      payload: { run: run({ current_stage: 'open' }), event: { sequence: 1 }, attempt: attempt() },
    })
    expect(state.actionCodes).toEqual(codes)

    state = attemptReducer(state, {
      type: 'RUN_LOADED',
      payload: { run: null, scenario: null, attempt: attempt() },
    })
    expect(state.actionCodes).toEqual({})

    state = attemptReducer(
      attemptReducer(initialState, {
        type: 'RUN_LOADED', payload: { run: run(), scenario: {}, actions: codes, attempt: attempt() },
      }),
      { type: 'COMPLETED', payload: { attempt: attempt() } },
    )
    expect(state.actionCodes).toEqual({})
  })

  it('keeps the pinned scenario when a response carries no scenario', () => {
    let state = attemptReducer(initialState, {
      type: 'RUN_LOADED',
      payload: { run: run(), scenario: { scenario_id: 'W02' }, attempt: attempt() },
    })
    state = attemptReducer(state, {
      type: 'SUBMIT_OK',
      payload: { run: run({ current_stage: 'open' }), attempt: attempt() },
    })

    expect(state.scenario.scenario_id).toBe('W02')
  })

  /**
   * Only `/current-run` carries `ordinal`; event and resolve responses do not. Deriving
   * it from `progress.resolved` after a resolve counts the run that just finished, which
   * printed "Scenario 2 recorded" at the end of scenario 1.
   */
  it('keeps the scenario position when a response omits the ordinal', () => {
    let state = attemptReducer(initialState, {
      type: 'RUN_LOADED',
      payload: { run: run({ ordinal: 1 }), scenario: {}, attempt: attempt() },
    })

    const { ordinal: _dropped, ...withoutOrdinal } = run({ status: 'resolved' })
    state = attemptReducer(state, {
      type: 'SUBMIT_OK',
      payload: {
        run: withoutOrdinal,
        attempt: attempt({ progress: { resolved: 1, total: 10, all_resolved: false } }),
      },
    })

    expect(state.run.ordinal).toBe(1)
  })

  it('takes a new ordinal when the server issues the next run', () => {
    let state = attemptReducer(initialState, {
      type: 'RUN_LOADED',
      payload: { run: run({ ordinal: 1 }), scenario: {}, attempt: attempt() },
    })
    state = attemptReducer(state, {
      type: 'RUN_LOADED',
      payload: { run: run({ run_id: 'r2', ordinal: 2 }), scenario: {}, attempt: attempt() },
    })

    expect(state.run.ordinal).toBe(2)
  })

  it('marks a duplicate without changing what was scored', () => {
    const state = attemptReducer(initialState, {
      type: 'SUBMIT_OK',
      payload: { run: run({ current_stage: 'open' }), duplicate: true, attempt: attempt() },
    })

    expect(state.duplicate).toBe(true)
    expect(currentStage(state)).toBe('open')
  })

  it('flags a stale state as recoverable rather than fatal', () => {
    const state = attemptReducer(initialState, { type: 'STALE' })

    expect(state.stale).toBe(true)
    expect(state.phase).toBe(PHASE.READY)
    expect(state.error.code).toBe('STALE_STATE')
    expect(state.error.fatal).toBe(false)
  })

  it('clears the stale flag when the resynced run arrives', () => {
    let state = attemptReducer(initialState, { type: 'STALE' })
    state = attemptReducer(state, {
      type: 'RUN_LOADED',
      payload: { run: run({ current_stage: 'branch' }), scenario: {}, attempt: attempt() },
    })

    expect(state.stale).toBe(false)
    expect(state.error).toBeNull()
    expect(currentStage(state)).toBe('branch')
  })

  it('keeps a refused action inline and an unrecognised failure fatal', () => {
    const refused = attemptReducer(initialState, {
      type: 'SUBMIT_FAIL',
      error: { code: 'INVALID_TRANSITION', message: 'not available' },
    })
    expect(refused.phase).toBe(PHASE.READY)
    expect(refused.error.fatal).toBe(false)

    const broken = attemptReducer(initialState, {
      type: 'SUBMIT_FAIL',
      error: { code: 'INTERNAL_ERROR', message: 'server failure' },
    })
    expect(broken.phase).toBe(PHASE.ERROR)
    expect(broken.error.fatal).toBe(true)
  })

  it('releases the resolution only once the run resolves', () => {
    const active = attemptReducer(initialState, {
      type: 'SUBMIT_OK',
      payload: {
        run: run({ current_stage: 'verify' }),
        score_visibility: 'hidden',
        score_0_10: null,
        attempt: attempt(),
      },
    })
    expect(active.resolution).toBeNull()

    const resolved = attemptReducer(initialState, {
      type: 'SUBMIT_OK',
      payload: {
        run: run({ current_stage: 'resolve', status: 'resolved' }),
        score_visibility: 'final',
        score_0_10: 8,
        outcome_code: 'resolve_report',
        attempt: attempt(),
      },
    })
    expect(resolved.resolution).toEqual({
      score_visibility: 'final',
      score_0_10: 8,
      outcome_code: 'resolve_report',
      feedback: null,
    })
  })

  it('carries the feedback card only when the server released it (ADM-007)', () => {
    const card = {
      result: 'This was a delivery scam.',
      cues: ['Unknown sender'],
      safe_action: 'Report it.',
      impact: 'Card details stolen.',
      prevention_habit: 'Check the courier app.',
    }
    const released = attemptReducer(initialState, {
      type: 'SUBMIT_OK',
      payload: {
        run: run({ current_stage: 'resolve', status: 'resolved' }),
        score_visibility: 'final',
        score_0_10: 8,
        outcome_code: 'resolve_report',
        feedback_timing: 'immediate',
        feedback: card,
        attempt: attempt(),
      },
    })
    expect(released.resolution.feedback).toEqual(card)

    const held = attemptReducer(initialState, {
      type: 'SUBMIT_OK',
      payload: {
        run: run({ current_stage: 'resolve', status: 'resolved' }),
        score_visibility: 'final',
        score_0_10: 8,
        outcome_code: 'resolve_report',
        feedback_timing: 'on_completion',
        feedback: null,
        attempt: attempt(),
      },
    })
    expect(held.resolution.feedback).toBeNull()
  })
})

describe('selectors', () => {
  it('hides the score in assessment mode even when the wire carries it', () => {
    const resolved = attemptReducer(initialState, {
      type: 'SUBMIT_OK',
      payload: {
        run: run({ status: 'resolved' }),
        score_visibility: 'final',
        score_0_10: 8,
        attempt: attempt({ mode: 'assessment' }),
      },
    })
    expect(scoreVisible(resolved)).toBe(false)

    const training = attemptReducer(initialState, {
      type: 'SUBMIT_OK',
      payload: {
        run: run({ status: 'resolved' }),
        score_visibility: 'final',
        score_0_10: 8,
        attempt: attempt({ mode: 'training' }),
      },
    })
    expect(scoreVisible(training)).toBe(true)
  })

  it('is ready to complete only when ten are resolved and no run remains', () => {
    const midway = attemptReducer(initialState, {
      type: 'RUN_LOADED',
      payload: {
        run: run(),
        scenario: {},
        attempt: attempt({ progress: { resolved: 9, total: 10, all_resolved: false } }),
      },
    })
    expect(readyToComplete(midway)).toBe(false)

    const done = attemptReducer(initialState, {
      type: 'RUN_LOADED',
      payload: {
        run: null,
        scenario: null,
        attempt: attempt({ progress: { resolved: 10, total: 10, all_resolved: true } }),
      },
    })
    expect(readyToComplete(done)).toBe(true)
    expect(progressOf(done).resolved).toBe(10)
  })

  it('reports a completed attempt and drops the run', () => {
    const state = attemptReducer(initialState, {
      type: 'COMPLETED',
      payload: { attempt: attempt({ status: 'completed' }), result: { total_score: 74 } },
    })

    expect(state.phase).toBe(PHASE.COMPLETED)
    expect(state.run).toBeNull()
    expect(state.result.total_score).toBe(74)
  })
})
