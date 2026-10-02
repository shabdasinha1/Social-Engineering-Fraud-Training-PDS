export const ROUTES = {
  LOGIN: '/login',
  BRIEFING: '/briefing',
  DASHBOARD: '/dashboard',

  /** The six-stage simulation (UI-001), driven by the attempt API. */
  ASSESSMENT: '/assessment',

  /**
   * The legacy 40-scenario journey. Kept reachable so the pipeline it exercises stays
   * usable, but it is no longer the assessment a candidate is sent to.
   */
  LEGACY_ASSESSMENT: '/assessment/legacy',

  /**
   * Results are addressed by attempt. The id is not personal data, ownership is checked
   * server-side (another candidate's id returns 404), and naming it here is what lets a
   * result survive a reload.
   */
  RESULT: '/result/:attemptId',

  HISTORY: '/history',

  /**
   * The instructor area (ADMIN-006). One guarded branch, separate from the learner tree:
   * a candidate session never satisfies RequireAdmin, and the server enforces the same
   * boundary independently on every /api/admin route.
   */
  /** The instructor landing page is the dashboard (ENHANCEMENT-001). */
  ADMIN: '/admin',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_SCENARIOS: '/admin/scenarios',
  ADMIN_SCENARIO: '/admin/scenarios/:scenarioId',
  ADMIN_ATTEMPTS: '/admin/attempts',
  ADMIN_ATTEMPT: '/admin/attempts/:attemptId',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_AUDIT: '/admin/audit',
}

/** Builds the result path for one attempt. */
export function resultPath(attemptId) {
  return `/result/${attemptId}`
}

/** The instructor view of one scenario's version history. */
export function adminScenarioPath(scenarioId) {
  return `/admin/scenarios/${scenarioId}`
}

/** The instructor view of one attempt. */
export function adminAttemptPath(attemptId) {
  return `/admin/attempts/${attemptId}`
}
