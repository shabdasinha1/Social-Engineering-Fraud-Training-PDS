import { apiClient } from '@/services/apiClient'

/**
 * The new six-stage attempt pipeline (API-001).
 *
 * Separate from `assessmentApi`, which still serves the legacy 40-scenario journey. Both
 * exist while the frontend migrates; nothing here touches the old endpoints.
 *
 * The server owns everything that matters: scenario selection, the seed, the sequence,
 * stage transitions and all scoring. These calls only carry an opaque action code: the
 * one `/current-run` issued for the control the learner used (SECURITY-001). No engine
 * intent is ever sent, and the server refuses a request that carries one.
 *
 * `intentKey` must be a stable, client-generated id for one learner action - the same key
 * resent after a lost response returns the original outcome instead of scoring twice.
 * Generate it once when the action is taken, not once per retry.
 */
export const attemptApi = {
  /** Starts an attempt, or returns the in-progress one. Only from a user action. */
  start: (mode) => apiClient.post('/attempts', mode ? { mode } : undefined),

  /** Read-only. The learner's completed attempts, newest first: { attempts: [...] }. */
  history: (options) => apiClient.get('/attempts', options),

  /** Read-only. Returns { attempt: state | null } without creating anything. */
  current: (options) => apiClient.get('/attempts/current', options),

  /** Candidate-safe attempt state: status, progress and the current run pointer. */
  get: (attemptId, options) => apiClient.get(`/attempts/${attemptId}`, options),

  /** The current run plus its pinned scenario content. `run: null` once all ten resolve. */
  currentRun: (attemptId, options) =>
    apiClient.get(`/attempts/${attemptId}/current-run`, options),

  /** One learner action. The server decides the event, the points and the next stage. */
  submitEvent: (attemptId, runId, { actionCode, intentKey, expectedStage, syntheticTargetId,
    metadata, clientTs, elapsedMs } = {}) =>
    apiClient.post(`/attempts/${attemptId}/runs/${runId}/events`, {
      action_code: actionCode,
      intent_key: intentKey,
      expected_stage: expectedStage,
      synthetic_target_id: syntheticTargetId,
      metadata,
      client_ts: clientTs,
      elapsed_ms: elapsedMs,
    }),

  /** Finishes one scenario. Only resolve-stage controls; this is where rationale is sent. */
  resolveRun: (attemptId, runId, { actionCode, intentKey, rationale, expectedStage } = {}) =>
    apiClient.post(`/attempts/${attemptId}/runs/${runId}/resolve`, {
      action_code: actionCode,
      intent_key: intentKey,
      rationale,
      expected_stage: expectedStage,
    }),

  /**
   * ENHANCEMENT-003. The Demo User's Skip. Carries only the stage the page is showing - no
   * intent, no action code. The server decides whether this learner may skip at all and
   * answers 404 for anyone who is not the configured Demo User.
   */
  demoSkip: (attemptId, runId, { expectedStage } = {}) =>
    apiClient.post(`/attempts/${attemptId}/runs/${runId}/demo-skip`, {
      expected_stage: expectedStage,
    }),

  /** Valid only once all ten scenarios are resolved. Safe to retry. */
  complete: (attemptId) => apiClient.post(`/attempts/${attemptId}/complete`),

  /** Candidate-safe result for a completed attempt. */
  result: (attemptId, options) => apiClient.get(`/attempts/${attemptId}/result`, options),
}
