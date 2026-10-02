import { apiClient } from '@/services/apiClient'

/**
 * The learner's own progress snapshot (PROGRESS-001).
 *
 * One endpoint, no parameters: the server answers for whoever holds the session cookie, so
 * there is nothing here that could ask for somebody else's progress.
 *
 * Everything it returns is derived and candidate-safe - an attempt count, scores out of 100
 * and per-platform / per-family point totals. No scenario, disposition, difficulty, trigger
 * or event ever appears in it, so nothing this call returns needs masking at render.
 */
export const progressApi = {
  /** Read-only. Creates nothing; the server rebuilds a missing snapshot on demand. */
  mine: (options) => apiClient.get('/progress', options),
}
