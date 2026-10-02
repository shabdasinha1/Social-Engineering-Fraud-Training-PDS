import { ApiError, apiClient } from '@/services/apiClient'

/**
 * The instructor/admin API (ADMIN-006).
 *
 * Separate from `authApi` and `attemptApi` on purpose: the admin session is its own signed
 * httpOnly cookie against its own endpoints, and nothing here touches the candidate
 * session. As with the candidate, no token is returned to this code and nothing is written
 * to localStorage or sessionStorage.
 *
 * ### Every request body is an allowlist, built here
 *
 * The backends refuse an unknown field rather than ignoring it (ADMIN-001, ADMIN-003 and
 * ADMIN-004 all do this), so a call that spread a component's state object into a body
 * would fail at the server. Each function below therefore names the fields it sends, one
 * by one. That is not defensive duplication - it is what keeps a form's local UI state
 * from leaking into an API contract.
 *
 * Query strings are built the same way, through `query()`, which drops empty values so an
 * untouched filter is simply absent rather than sent as `""`.
 */

/** Builds a bounded query string from an object, omitting anything empty. */
function query(params = {}) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const encoded = search.toString()
  return encoded ? `?${encoded}` : ''
}

/** Drops undefined entries so an optional field is omitted rather than sent as null. */
function present(body) {
  return Object.fromEntries(Object.entries(body).filter(([, value]) => value !== undefined))
}

export const adminApi = {
  /* --- session (BE-005a) ------------------------------------------- */

  signIn: (username, password) => apiClient.post('/admin/login', { username, password }),
  me: (options) => apiClient.get('/admin/me', options),
  signOut: () => apiClient.post('/admin/logout'),

  /* --- dashboard (ENHANCEMENT-001) ---------------------------------- */

  /** Aggregate figures over completed assessment attempts. The API takes no parameters. */
  getDashboard: (options) => apiClient.get('/admin/dashboard', options),

  /* --- scenario manager (ADMIN-001) -------------------------------- */

  listScenarios: ({ platform, level, disposition, lifecycle, canonical_family: family,
    military_flag: military, active, sort, page, page_size: pageSize } = {}, options) =>
    apiClient.get(`/admin/scenarios${query({
      platform, level, disposition, lifecycle, canonical_family: family,
      military_flag: military, active, sort, page, page_size: pageSize,
    })}`, options),

  /** Every version of one scenario, newest first. */
  getScenario: (scenarioId, options) =>
    apiClient.get(`/admin/scenarios/${encodeURIComponent(scenarioId)}`, options),

  getScenarioVersion: (scenarioId, version, options) =>
    apiClient.get(
      `/admin/scenarios/${encodeURIComponent(scenarioId)}/versions/${encodeURIComponent(version)}`,
      options,
    ),

  /**
   * Edits a version. A draft is rewritten in place; a published or retired version
   * branches the next version as a draft, and the response says which happened.
   *
   * Only the fields the caller actually changed are sent, and only from ADMIN-001's
   * authorable set - the server rejects anything else rather than ignoring it.
   */
  editScenarioVersion: (scenarioId, version, fields) =>
    apiClient.patch(
      `/admin/scenarios/${encodeURIComponent(scenarioId)}/versions/${encodeURIComponent(version)}`,
      present(fields),
    ),

  /** No body clones to the next version of the same scenario; a target id creates a new one. */
  cloneScenarioVersion: (scenarioId, version, { targetScenarioId } = {}) =>
    apiClient.post(
      `/admin/scenarios/${encodeURIComponent(scenarioId)}/versions/${encodeURIComponent(version)}/clone`,
      present({ target_scenario_id: targetScenarioId }),
    ),

  publishScenarioVersion: (scenarioId, version, { idempotencyKey } = {}) =>
    apiClient.post(
      `/admin/scenarios/${encodeURIComponent(scenarioId)}/versions/${encodeURIComponent(version)}/publish`,
      present({ idempotency_key: idempotencyKey }),
    ),

  deactivateScenarioVersion: (scenarioId, version, { idempotencyKey } = {}) =>
    apiClient.post(
      `/admin/scenarios/${encodeURIComponent(scenarioId)}/versions/${encodeURIComponent(version)}/deactivate`,
      present({ idempotency_key: idempotencyKey }),
    ),

  /* --- attempt viewer (ADMIN-002) ---------------------------------- */

  listAttempts: ({ profile_id: profileId, service_no: serviceNo, status, mode,
    started_from: startedFrom, started_to: startedTo, page, page_size: pageSize } = {},
  options) =>
    apiClient.get(`/admin/attempts${query({
      profile_id: profileId, service_no: serviceNo, status, mode,
      started_from: startedFrom, started_to: startedTo, page, page_size: pageSize,
    })}`, options),

  getAttempt: (attemptId, options) =>
    apiClient.get(`/admin/attempts/${encodeURIComponent(attemptId)}`, options),

  /** Bounded learner lookup: turns a name or service-number prefix into a profile id. */
  lookupLearners: ({ display_name: displayName, service_no: serviceNo, limit } = {}, options) =>
    apiClient.get(`/admin/learners${query({
      display_name: displayName, service_no: serviceNo, limit,
    })}`, options),

  /* --- exports (ADMIN-003) ----------------------------------------- */

  /**
   * Builds one export artifact. The server decides where it is written; there is no path,
   * directory or filename field to send, and sending one is refused.
   */
  createAttemptExport: (attemptId, { format, idempotencyKey } = {}) =>
    apiClient.post(
      `/admin/exports/attempts/${encodeURIComponent(attemptId)}`,
      present({ format, idempotency_key: idempotencyKey }),
    ),

  /** ADM-007: every completed attempt of one learner, as one artifact. Same body contract. */
  createLearnerExport: (profileId, { format, idempotencyKey } = {}) =>
    apiClient.post(
      `/admin/exports/learners/${encodeURIComponent(profileId)}`,
      present({ format, idempotency_key: idempotencyKey }),
    ),

  /**
   * Fetches an artifact the server already wrote, so the instructor can save a copy.
   *
   * A credentialed fetch rather than a plain link: the admin cookie has to travel, the
   * response is bytes rather than JSON so it cannot go through `apiClient`, and doing it
   * here keeps every network call in the service layer. The caller turns the blob into a
   * download; nothing is uploaded and no external host is contacted.
   */
  downloadExportArtifact: async (filename) => {
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    const response = await fetch(`${base}/admin/exports/${encodeURIComponent(filename)}`, {
      credentials: 'include',
    })
    if (!response.ok) {
      throw new ApiError({
        message: 'The export file could not be read back from the server.',
        status: response.status,
        code: 'ARTIFACT_UNAVAILABLE',
      })
    }
    return response.blob()
  },

  /* --- instructor controls (ADMIN-004) ----------------------------- */

  resetAttempt: (attemptId, { reasonCode, idempotencyKey } = {}) =>
    apiClient.post(
      `/admin/attempts/${encodeURIComponent(attemptId)}/reset`,
      present({ reason_code: reasonCode, idempotency_key: idempotencyKey }),
    ),

  archiveProfile: (profileId, { reasonCode, idempotencyKey } = {}) =>
    apiClient.post(
      `/admin/learners/${encodeURIComponent(profileId)}/archive`,
      present({ reason_code: reasonCode, idempotency_key: idempotencyKey }),
    ),

  getFeedbackConfig: (options) => apiClient.get('/admin/config/feedback', options),

  /**
   * Changes feedback timing.
   *
   * `expected_config_version` is always sent from the value that was read, so an
   * instructor editing a stale view is told to re-read rather than silently overwriting a
   * colleague's change.
   */
  updateFeedbackConfig: ({ trainingTiming, assessmentTiming, expectedConfigVersion } = {}) =>
    apiClient.patch('/admin/config/feedback', present({
      training_feedback_timing: trainingTiming,
      assessment_feedback_timing: assessmentTiming,
      expected_config_version: expectedConfigVersion,
    })),

  /* --- audit log (ADMIN-005) --------------------------------------- */

  /** Read-only. The log is append-only server-side; there is no write call to make. */
  listAuditEvents: ({ action, resource_type: resourceType, resource_id: resourceId,
    from, to, page, page_size: pageSize } = {}, options) =>
    apiClient.get(`/admin/audit${query({
      action, resource_type: resourceType, resource_id: resourceId,
      from, to, page, page_size: pageSize,
    })}`, options),
}
