/**
 * The candidate assessment state machine (UI-001).
 *
 * Pure: no fetch, no timers, no React. Everything it holds came from a server response,
 * so the reducer can never invent a stage, a score or a next scenario - it only records
 * what the engine committed. That is also what makes it testable without a DOM.
 *
 * `useAttemptController` wires this to `attemptApi`; nothing else should dispatch here.
 */

export const PHASE = {
  LOADING: 'loading',
  /** IMMERSIVE-001: the 90-minute limit ended the attempt. Terminal, and never local. */
  EXPIRED: 'expired',
  READY: 'ready',
  SUBMITTING: 'submitting',
  COMPLETING: 'completing',
  COMPLETED: 'completed',
  ERROR: 'error',
  NO_ATTEMPT: 'no_attempt',
}

export const initialState = {
  phase: PHASE.LOADING,

  /** Server-owned. Never edited locally. */
  attempt: null,
  run: null,
  scenario: null,
  /**
   * SECURITY-001. `{ neutral control id: opaque action code }` for the current run, exactly
   * as `/current-run` issued it. The only way the page can name an action; it says nothing
   * about what any control means. Held in memory only, never persisted.
   */
  actionCodes: {},

  /** The engine's rendering instruction for the last risky action, if there was one. */
  consequence: null,
  /** What the engine recorded last: `{ sequence, stage, accepted_at }`. Display only. */
  lastEvent: null,
  /** Released by the server only once a run resolves. */
  resolution: null,
  /** Set when the server replayed an action we had already committed. */
  duplicate: false,

  /** Completed-attempt payload from /complete or /result. */
  result: null,

  /** True between a 409 STALE_STATE and the resync that answers it. */
  stale: false,
  /**
   * True on the render after a resync. The stale flag is gone by then - the run has been
   * reloaded - but the learner still needs telling that their action did not take effect.
   * Cleared by the next accepted action.
   */
  resynced: false,
  /** `{ code, message, fatal }` - fatal errors take over the screen, others are inline. */
  error: null,
  /** The control (neutral id) in flight, so only it shows a busy state. */
  pendingAction: null,
}

/**
 * Errors the learner can recover from without leaving the page: the action is refused
 * or superseded, but the attempt is intact. Anything else replaces the screen.
 *
 * A dropped connection to the local API is in this list on purpose. The engine commits
 * before it answers, so a lost response says nothing about whether the action landed -
 * and the retry carries the same `intent_key`, so the server replays rather than
 * rescoring. Losing the whole screen over it would be worse than telling the learner to
 * try again. (An initial load that fails is still fatal: there is nothing to show.)
 */
const RECOVERABLE = new Set([
  'NETWORK_ERROR',
  'STALE_STATE',
  'INVALID_TRANSITION',
  'INVALID_INTENT',
  /** SECURITY-001: a code the server does not recognise for this run, or none issued. */
  'INVALID_ACTION',
  'ACTION_UNAVAILABLE',
  'INVALID_TARGET',
  'INVALID_RATIONALE',
  'INVALID_METADATA',
  'RUN_NOT_ACTIVE',
  'FORBIDDEN_FIELD',
])

/** A run payload arriving from /current-run, an event response, or a resolve response. */
function withRunPayload(state, payload) {
  const incoming = payload.run ?? null
  const resolved = incoming?.status === 'resolved'

  /**
   * `ordinal` is added by the API layer on `/current-run` only - `ScenarioRun`'s own
   * candidate projection is key-exact and does not carry it (API-001 section 5). So an
   * event or resolve response arrives without it, and the position of the scenario the
   * learner is looking at has to be carried forward rather than recomputed: deriving it
   * from `progress.resolved` counts the run that just resolved and reads one too high.
   */
  const run =
    incoming && incoming.ordinal === undefined && incoming.run_id === state.run?.run_id
      ? { ...incoming, ordinal: state.run.ordinal }
      : incoming

  return {
    ...state,
    attempt: payload.attempt ?? state.attempt,
    run,
    // `/current-run` sends the scenario; event responses do not, so keep the pinned one.
    scenario: 'scenario' in payload ? payload.scenario : state.scenario,
    // Issued with the scenario by `/current-run`; event responses leave them as they were.
    actionCodes: 'scenario' in payload ? (payload.actions ?? {}) : state.actionCodes,
    resolution: resolved
      ? {
          score_visibility: payload.score_visibility ?? 'hidden',
          score_0_10: payload.score_0_10 ?? null,
          outcome_code: payload.outcome_code ?? null,
          // ADM-007: present only when the instructor's timing for this mode is
          // `immediate`. The server decides; null means "held until the attempt ends".
          feedback: payload.feedback ?? null,
        }
      : null,
  }
}

export function attemptReducer(state, action) {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, phase: PHASE.LOADING, error: null }

    /** No attempt exists yet. The dashboard, not this screen, starts one. */
    case 'NO_ATTEMPT':
      return { ...initialState, phase: PHASE.NO_ATTEMPT }

    /**
     * A fresh read of the current run. This is also the stale-state recovery path, so it
     * clears the stale flag and drops any consequence panel left over from the old view.
     */
    case 'RUN_LOADED':
      return {
        ...withRunPayload(state, action.payload),
        // Ready even with no run left: that is the completion gateway, and its button
        // must be usable. COMPLETING belongs to the /complete call alone.
        phase: PHASE.READY,
        consequence: null,
        lastEvent: null,
        duplicate: false,
        stale: false,
        resynced: state.stale,
        error: null,
        pendingAction: null,
      }

    case 'SUBMIT_START':
      return { ...state, phase: PHASE.SUBMITTING, pendingAction: action.control, error: null }

    /**
     * One committed engine transition. `duplicate` means the server replayed an action we
     * had already sent - the outcome is the original one, scored once.
     */
    case 'SUBMIT_OK':
      return {
        ...withRunPayload(state, action.payload),
        phase: PHASE.READY,
        consequence: action.payload.consequence ?? null,
        lastEvent: action.payload.event ?? null,
        duplicate: Boolean(action.payload.duplicate),
        stale: false,
        resynced: false,
        error: null,
        pendingAction: null,
      }

    /**
     * The run moved on without us. Nothing is replayed: the controller refetches, and
     * the learner chooses again from the state the server actually holds.
     */
    case 'STALE':
      return {
        ...state,
        phase: PHASE.READY,
        stale: true,
        pendingAction: null,
        error: {
          code: 'STALE_STATE',
          message: 'This scenario moved on while you were deciding. Reloading its current state.',
          fatal: false,
        },
      }

    case 'SUBMIT_FAIL': {
      const fatal = !RECOVERABLE.has(action.error.code)
      return {
        ...state,
        phase: fatal ? PHASE.ERROR : PHASE.READY,
        pendingAction: null,
        error: { code: action.error.code, message: action.error.message, fatal },
      }
    }

    case 'COMPLETE_START':
      return { ...state, phase: PHASE.COMPLETING, error: null }

    /**
     * IMMERSIVE-001. Reached only when the SERVER says the attempt expired - either a
     * 409 ATTEMPT_EXPIRED on an action, or a re-read that came back completed. The
     * reducer never decides this from a clock: there is no timer in this file.
     */
    case 'EXPIRED':
      return {
        ...state,
        phase: PHASE.EXPIRED,
        attempt: action.payload?.attempt ?? state.attempt,
        run: null,
        scenario: null,
        actionCodes: {},
        consequence: null,
        pendingAction: null,
        error: null,
      }

    case 'COMPLETED':
      return {
        ...state,
        phase: PHASE.COMPLETED,
        attempt: action.payload.attempt ?? state.attempt,
        result: action.payload.result ?? null,
        run: null,
        scenario: null,
        actionCodes: {},
        consequence: null,
        pendingAction: null,
        error: null,
      }

    case 'FAIL':
      return {
        ...state,
        phase: PHASE.ERROR,
        pendingAction: null,
        error: { code: action.error.code, message: action.error.message, fatal: true },
      }

    case 'DISMISS_ERROR':
      return { ...state, error: null }

    /** Closes the consequence panel. Presentation only - the event stays committed. */
    case 'DISMISS_CONSEQUENCE':
      return { ...state, consequence: null }

    default:
      return state
  }
}

/* ------------------------------------------------------------------ *
 * Selectors
 * ------------------------------------------------------------------ */

/** The stage the server says the run is in. There is no local stage. */
export function currentStage(state) {
  return state.run?.current_stage ?? null
}

/** `{ resolved, total }` straight from the attempt projection. */
export function progressOf(state) {
  return state.attempt?.progress ?? { resolved: 0, total: 10, all_resolved: false }
}

/** True once ten runs are resolved and the attempt is ready to complete. */
export function readyToComplete(state) {
  return Boolean(state.attempt && state.attempt.status === 'in_progress' && !state.run &&
    progressOf(state).all_resolved)
}

/**
 * Per-scenario points exist on the wire as soon as a run resolves, but section 3 of the
 * client specification hides the running score in assessment mode. Training mode may show
 * it after feedback, so the mode - not the payload - decides.
 */
export function scoreVisible(state) {
  return state.attempt?.mode === 'training' && state.resolution?.score_visibility === 'final'
}
