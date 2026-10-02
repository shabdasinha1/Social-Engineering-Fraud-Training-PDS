import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import {
  PHASE,
  attemptReducer,
  currentStage,
  initialState,
  progressOf,
  readyToComplete,
  scoreVisible,
} from '@/state/attemptMachine'
import { attemptApi } from '@/services/attemptApi'

/**
 * The one place the assessment talks to the attempt API (UI-001).
 *
 * Everything visible is server state: the reducer records committed responses and the
 * components read them. No screen calls `attemptApi` directly, so there is exactly one
 * definition of what "the current stage" means - the one the engine last committed.
 *
 * Authoritative state is never cached in localStorage or sessionStorage. A reload asks
 * the server what is current, which is also the interruption-recovery path.
 */

/** The busy-state key while a demo skip is in flight. Not an action code; never sent. */
export const DEMO_SKIP_CONTROL = 'demo-skip'

/** A stable id for one learner action, reused across retries so a retry cannot rescore. */
function newIntentKey() {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return uuid
  return `k-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

export function useAttemptController({ onSessionExpired } = {}) {
  const [state, dispatch] = useReducer(attemptReducer, initialState)

  /**
   * The key for the action currently being attempted, held by action code so a failed
   * submit that the learner retries reuses its key and the server replays rather than
   * rescores.
   */
  const intentKeys = useRef(new Map())
  /**
   * When the current stage and the current run were entered, for the elapsed and dwell
   * telemetry the specification asks for. Both are stamped by the effects below rather
   * than during render, which would be an impure read of the clock.
   */
  const stageEnteredAt = useRef(0)
  const runStartedAt = useRef(0)

  const stage = currentStage(state)
  const runId = state.run?.run_id ?? null

  useEffect(() => {
    stageEnteredAt.current = Date.now()
  }, [stage, runId])

  useEffect(() => {
    runStartedAt.current = Date.now()
    intentKeys.current.clear()
  }, [runId])

  const fail = useCallback(
    (error, { fatal = true } = {}) => {
      if (error?.name === 'AbortError') return
      if (error?.isSessionExpired) {
        onSessionExpired?.()
        return
      }
      const payload = { code: error?.code ?? 'UNKNOWN', message: error?.message ?? 'Something went wrong.' }
      dispatch(fatal ? { type: 'FAIL', error: payload } : { type: 'SUBMIT_FAIL', error: payload })
    },
    [onSessionExpired],
  )

  /**
   * Reads the current run from the server. This is start-up, refresh-after-resolve and
   * stale-state recovery - all three are the same question, so they are the same call.
   */
  const loadCurrentRun = useCallback(
    async (attemptId, { signal, showLoading = false } = {}) => {
      if (showLoading) dispatch({ type: 'LOAD_START' })
      try {
        const payload = await attemptApi.currentRun(attemptId, { signal })
        dispatch({ type: 'RUN_LOADED', payload })
        return payload
      } catch (error) {
        fail(error)
        return null
      }
    },
    [fail],
  )

  /** Resume: ask which attempt is live, then which run is current. Creates nothing. */
  const resume = useCallback(
    async ({ signal } = {}) => {
      dispatch({ type: 'LOAD_START' })
      try {
        const { attempt } = await attemptApi.current({ signal })
        if (!attempt) {
          dispatch({ type: 'NO_ATTEMPT' })
          return null
        }
        if (attempt.status === 'completed') {
          const { result } = await attemptApi.result(attempt.attempt_id, { signal })
          /**
           * IMMERSIVE-001. `end_reason` comes from the server, so a browser reopened after
           * the deadline discovers the timeout here rather than being offered a resumable
           * assessment. The expired screen and the completed screen differ only in what
           * they say; both send the learner to the same saved result.
           */
          if (attempt.end_reason === 'expired') {
            dispatch({ type: 'EXPIRED', payload: { attempt, result } })
            return attempt
          }
          dispatch({ type: 'COMPLETED', payload: { attempt, result } })
          return attempt
        }
        await loadCurrentRun(attempt.attempt_id, { signal })
        return attempt
      } catch (error) {
        fail(error)
        return null
      }
    },
    [fail, loadCurrentRun],
  )

  useEffect(() => {
    const controller = new AbortController()
    resume({ signal: controller.signal })
    return () => controller.abort()
  }, [resume])

  /**
   * Submits one learner action and records whatever the engine committed.
   *
   * `action` is a control - a scene affordance or an action-sheet entry - named by its
   * neutral `id`. What is sent is the opaque code `/current-run` issued for that id on this
   * run (SECURITY-001); the controller never knows, and never sends, what the control means.
   *
   * The optimistic path is deliberately absent: nothing on screen changes until the
   * response arrives, so the UI can never show an action as done that the server refused.
   */
  const submit = useCallback(
    async (action, { rationale } = {}) => {
      const attemptId = state.attempt?.attempt_id
      const activeRun = state.run
      if (!attemptId || !activeRun || state.phase === PHASE.SUBMITTING) return null

      const { id: control, targetId = null } = action
      const actionCode = state.actionCodes?.[control]
      if (!actionCode) {
        // No code issued for this control: nothing can be sent, and nothing has moved.
        dispatch({
          type: 'SUBMIT_FAIL',
          error: { code: 'ACTION_UNAVAILABLE', message: 'That action is not available here.' },
        })
        return null
      }
      const expectedStage = activeRun.current_stage

      // One key per (run, stage, code): a retry of the same refused action replays.
      const keyId = `${activeRun.run_id}:${expectedStage}:${actionCode}`
      if (!intentKeys.current.has(keyId)) intentKeys.current.set(keyId, newIntentKey())
      const intentKey = intentKeys.current.get(keyId)

      const now = Date.now()
      const dwellMs = Math.max(0, now - stageEnteredAt.current)
      const metadata = {}
      if (expectedStage === 'notify') metadata.open_latency_ms = dwellMs
      else if (expectedStage === 'inspect') metadata.dwell_ms = dwellMs
      else if (expectedStage === 'open') metadata.dwell_ms = dwellMs

      const request = {
        actionCode,
        intentKey,
        expectedStage,
        syntheticTargetId: targetId,
        metadata: Object.keys(metadata).length ? metadata : undefined,
        clientTs: new Date(now).toISOString(),
        elapsedMs: Math.max(0, now - runStartedAt.current),
      }

      dispatch({ type: 'SUBMIT_START', control })
      try {
        // The resolve stage is where a scenario is finished; the stage, not the control, says so.
        const payload = expectedStage === 'resolve'
          ? await attemptApi.resolveRun(attemptId, activeRun.run_id, {
              actionCode,
              intentKey,
              expectedStage,
              rationale: rationale || undefined,
            })
          : await attemptApi.submitEvent(attemptId, activeRun.run_id, request)

        dispatch({ type: 'SUBMIT_OK', payload })
        return payload
      } catch (error) {
        if (error?.name === 'AbortError') return null
        if (error?.isSessionExpired) {
          onSessionExpired?.()
          return null
        }
        /**
         * IMMERSIVE-001. The deadline passed before this action arrived. Nothing was lost:
         * the server finalised the attempt and committed a result in the same transaction,
         * so this goes straight to the terminal state rather than showing a failure the
         * learner could retry.
         */
        if (error?.code === 'ATTEMPT_EXPIRED') {
          dispatch({ type: 'EXPIRED' })
          return null
        }
        // Superseded, not failed: resync from the server instead of replaying blind.
        if (error?.code === 'STALE_STATE') {
          dispatch({ type: 'STALE' })
          await loadCurrentRun(attemptId)
          return null
        }
        fail(error, { fatal: false })
        return null
      }
    },
    [fail, loadCurrentRun, onSessionExpired, state.attempt, state.run, state.phase,
      state.actionCodes],
  )

  /**
   * ENHANCEMENT-003: the Demo User's Skip.
   *
   * Offered only when the SERVER marked this attempt `is_demo`; the server re-checks who is
   * asking regardless, so this guard is presentation, not authority. On success the next
   * scenario is loaded straight away - a skipped scenario has no outcome screen, because it
   * has no decision to show. A refusal because the run moved on resyncs from the server,
   * exactly as a stale learner action does.
   */
  const skip = useCallback(async () => {
    const attemptId = state.attempt?.attempt_id
    const activeRun = state.run
    if (!state.attempt?.is_demo || !attemptId || !activeRun) return null
    if (activeRun.status === 'resolved' || state.phase === PHASE.SUBMITTING) return null

    dispatch({ type: 'SUBMIT_START', control: DEMO_SKIP_CONTROL })
    try {
      const payload = await attemptApi.demoSkip(attemptId, activeRun.run_id, {
        expectedStage: activeRun.current_stage,
      })
      await loadCurrentRun(attemptId, { showLoading: true })
      return payload
    } catch (error) {
      if (error?.name === 'AbortError') return null
      if (error?.isSessionExpired) {
        onSessionExpired?.()
        return null
      }
      if (error?.code === 'ATTEMPT_EXPIRED') {
        dispatch({ type: 'EXPIRED' })
        return null
      }
      if (['STALE_STATE', 'RUN_NOT_ACTIVE', 'RUN_NOT_CURRENT'].includes(error?.code)) {
        dispatch({ type: 'STALE' })
        await loadCurrentRun(attemptId)
        return null
      }
      fail(error, { fatal: false })
      return null
    }
  }, [fail, loadCurrentRun, onSessionExpired, state.attempt, state.run, state.phase])

  /** Moves to the next scenario once the current one has resolved. */
  const advance = useCallback(async () => {
    const attemptId = state.attempt?.attempt_id
    if (!attemptId) return
    await loadCurrentRun(attemptId, { showLoading: true })
  }, [loadCurrentRun, state.attempt])

  /** Valid only once all ten resolve. Idempotent server-side, so a retry is safe. */
  const complete = useCallback(async () => {
    const attemptId = state.attempt?.attempt_id
    if (!attemptId) return null
    dispatch({ type: 'COMPLETE_START' })
    try {
      const payload = await attemptApi.complete(attemptId)
      dispatch({ type: 'COMPLETED', payload })
      return payload
    } catch (error) {
      fail(error)
      return null
    }
  }, [fail, state.attempt])

  /**
   * What the countdown calls when it reaches zero.
   *
   * It re-reads the server and nothing else. If the server agrees the attempt is over,
   * `resume()` dispatches EXPIRED; if the browser clock was fast, the server says the
   * attempt is still live and play continues. The client never ends an assessment.
   */
  const syncDeadline = useCallback(() => { resume() }, [resume])

  const dismissConsequence = useCallback(() => dispatch({ type: 'DISMISS_CONSEQUENCE' }), [])
  const dismissError = useCallback(() => dispatch({ type: 'DISMISS_ERROR' }), [])
  const retry = useCallback(() => resume(), [resume])

  return useMemo(
    () => ({
      state,
      stage,
      progress: progressOf(state),
      readyToComplete: readyToComplete(state),
      scoreVisible: scoreVisible(state),
      submit,
      advance,
      complete,
      retry,
      syncDeadline,
      dismissConsequence,
      dismissError,
      /** ENHANCEMENT-003. True only on the Demo User's server-marked demo attempt. */
      canSkip: Boolean(state.attempt?.is_demo),
      skip,
    }),
    [state, stage, submit, advance, complete, retry, syncDeadline, dismissConsequence,
      dismissError, skip],
  )
}
