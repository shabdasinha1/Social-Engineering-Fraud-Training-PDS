import { useCallback, useEffect, useMemo, useState } from 'react'
import { CandidateContext } from '@/context/candidateContext'
import { authApi } from '@/services/authApi'
import { isInfrastructureError } from '@/services/apiClient'

/**
 * Holds the signed-in candidate for the current session. The session itself
 * lives in a signed httpOnly cookie the browser sends automatically - nothing
 * is kept in localStorage or sessionStorage.
 *
 * LOGIN-001 adds one distinction on top of that, and no new state machine: a session
 * check that came back 401 is NOT the same as a session check that could not run.
 *
 * 401 is the ordinary condition of the login screen - nobody is signed in yet - and the
 * form is the correct response to it. A status 0 or a 5xx means the cookie could not be
 * resolved against the store at all, and showing an empty form then would be wrong: a
 * learner who already has a profile and an attempt in progress would be invited to type
 * their details again into a system that cannot see them. That case becomes `sessionError`
 * and the screen offers Retry instead.
 */
export function CandidateProvider({ children }) {
  const [candidate, setCandidate] = useState(null)
  const [checking, setChecking] = useState(true)
  const [sessionError, setSessionError] = useState('')

  /**
   * Reads the session and returns what the UI should become. Sets no state itself, which
   * is what lets the mount effect and Retry share one implementation without the effect
   * body containing a synchronous state update.
   *
   * `null` means the request was aborted - the effect was cleaned up by a StrictMode
   * remount - and the caller must leave `checking` alone so the next run settles it.
   * Clearing it here would let the route guard redirect before the session had actually
   * been checked.
   */
  const readSession = useCallback(async (signal) => {
    try {
      const data = await authApi.me(signal ? { signal } : undefined)
      return { candidate: data.candidate, error: '' }
    } catch (error) {
      if (error.name === 'AbortError') return null
      return {
        candidate: null,
        error: isInfrastructureError(error) ? error.message : '',
      }
    }
  }, [])

  const applySession = useCallback((outcome) => {
    if (!outcome) return
    setCandidate(outcome.candidate)
    setSessionError(outcome.error)
    setChecking(false)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    readSession(controller.signal).then(applySession)
    return () => controller.abort()
  }, [readSession, applySession])

  /**
   * Re-runs the session check after a storage failure. Deliberately has no timer and no
   * automatic re-arm: every attempt is one press of Retry by the learner, so there is no
   * path here that can loop on its own.
   *
   * The existing error is left standing until the outcome replaces it. Clearing it up
   * front would drop the screen back to the entry form for as long as the retry is in
   * flight - the one moment the learner is being told to wait.
   */
  const retrySession = useCallback(async () => {
    setChecking(true)
    applySession(await readSession())
  }, [readSession, applySession])

  const signIn = useCallback(async (name, identifier) => {
    const data = await authApi.signIn(name, identifier)
    setCandidate(data.candidate)
    setSessionError('')
    /**
     * `created` is the profile-found signal, and it already existed: `POST /candidates`
     * answers 201 with `created: true` for a new profile and 200 with `created: false` for
     * one the normalised service number already resolved to. LOGIN-001 needs to tell those
     * apart to show the profile-found card, so the flag is passed through rather than a new
     * endpoint being invented for it.
     */
    return { candidate: data.candidate, created: Boolean(data.created) }
  }, [])

  const signOut = useCallback(async () => {
    await authApi.signOut().catch(() => {})
    setCandidate(null)
  }, [])

  /**
   * Records the learner's briefing acknowledgement (PROFILE-001) and adopts the profile the
   * server answers with.
   *
   * The server's copy is taken as the result rather than the local one being patched: the
   * acknowledged version and its timestamp are decided server-side, and a reload has to
   * agree with what was actually stored.
   */
  const acknowledgeBriefing = useCallback(async (version) => {
    const data = await authApi.acknowledgeBriefing(version)
    setCandidate(data.candidate)
    return data.candidate
  }, [])

  /** Called when an API call comes back 401 - drop the stale candidate. */
  const clearSession = useCallback(() => setCandidate(null), [])

  const value = useMemo(
    () => ({
      candidate,
      checking,
      sessionError,
      retrySession,
      signIn,
      signOut,
      clearSession,
      acknowledgeBriefing,
    }),
    [candidate, checking, sessionError, retrySession, signIn, signOut, clearSession,
      acknowledgeBriefing],
  )

  return <CandidateContext.Provider value={value}>{children}</CandidateContext.Provider>
}
