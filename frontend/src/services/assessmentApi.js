import { apiClient } from '@/services/apiClient'

/**
 * The backend owns scenario selection, the sequence, timing and scoring.
 * These calls only move the candidate's own choices back and forth.
 */
export const assessmentApi = {
  /** The candidate's own completed attempts, newest first. Read-only. */
  history: (options) => apiClient.get('/assessments', options),

  /** Read-only. Returns { assessment: progress | null } without creating one. */
  getActive: (options) => apiClient.get('/assessments/active', options),

  /** Creates one, or returns the in-progress one. Only from a user action. */
  start: () => apiClient.post('/assessments'),

  /** Resume: progress plus the current question. */
  get: (assessmentId, options) => apiClient.get(`/assessments/${assessmentId}`, options),

  submitAnswer: (assessmentId, answer) =>
    apiClient.post(`/assessments/${assessmentId}/answers`, answer),

  complete: (assessmentId) => apiClient.post(`/assessments/${assessmentId}/complete`),
}
