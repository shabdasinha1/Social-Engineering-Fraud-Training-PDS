import { apiClient } from '@/services/apiClient'

export const authApi = {
  /** Signs in or registers, and starts the cookie session. */
  signIn: (name, identifier) => apiClient.post('/candidates', { name, identifier }),
  me: (options) => apiClient.get('/candidates/me', options),
  signOut: () => apiClient.post('/candidates/logout'),

  /**
   * Records the briefing acknowledgement server-side (PROFILE-001).
   *
   * The version is sent back rather than assumed: the server hands the required version out
   * with the profile, and refuses any other, so a stale tab cannot satisfy a briefing it
   * never displayed.
   */
  acknowledgeBriefing: (version) => apiClient.post('/candidates/me/briefing', { version }),
}
