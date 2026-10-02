import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * The device's own navigation stack.
 *
 * This is LOCAL navigation and nothing else: pushing a contact sheet, walking to a second
 * page of the offline browser, backing out to the conversation. It holds no stage, no
 * score and no attempt state, and it is the only piece of the simulation the server does
 * not own - which is exactly right, because where a learner is standing is not a decision
 * they have made.
 *
 * Two consequences follow, and both are deliberate:
 *
 * - **A reload returns to the conversation.** The stack is not persisted anywhere, so a
 *   refresh rebuilds the base surface from the stage the server committed and starts with
 *   an empty stack. Nothing is lost, because nothing here was ever authoritative.
 * - **Back never retracts anything.** The engine has already recorded whatever opened the
 *   surface. Leaving it is leaving a page, not undoing an act.
 *
 * IMMERSIVE-003A-R2 adds a second, inner stack: the PAGE history inside the surface on
 * top. A browser that could only go home was the thing that gave the offline browser away,
 * because a real Back button walks the pages you actually visited. The page history lives
 * and dies with the surface it belongs to - pushing a new surface starts it empty and
 * popping the surface throws it away.
 */
export function useSceneNavigation(runId) {
  const [stack, setStack] = useState([])
  /**
   * Page history within the surface on top, oldest first. Empty means "the surface's own
   * home page", so a surface with no pages behaves exactly as it did before.
   */
  const [pages, setPages] = useState([])
  const lastRun = useRef(runId)

  // A new scenario starts on its base surface, whatever the learner had open before.
  useEffect(() => {
    if (lastRun.current !== runId) {
      lastRun.current = runId
      setStack([])
      setPages([])
    }
  }, [runId])

  const push = useCallback((surfaceId, startPage = null) => {
    if (!surfaceId) return
    setStack((current) =>
      (current[current.length - 1] === surfaceId ? current : [...current, surfaceId]))
    setPages(startPage ? [startPage] : [])
  }, [])

  const pop = useCallback(() => {
    setStack((current) => current.slice(0, -1))
    setPages([])
  }, [])

  /** Walk to another page of the surface on top, remembering where we came from. */
  const goToPage = useCallback((pageId) => {
    if (!pageId) return
    setPages((current) => (current[current.length - 1] === pageId ? current : [...current, pageId]))
  }, [])

  /**
   * Replace the page on top instead of stacking a new one.
   *
   * Used for the steps of one flow - a payment form's details, review and outcome - where
   * Back should leave the flow rather than walk backwards through a transaction that has
   * already been recorded.
   */
  const replacePage = useCallback((pageId) => {
    if (!pageId) return
    setPages((current) => (current.length ? [...current.slice(0, -1), pageId] : [pageId]))
  }, [])

  /** True when there is a page to go back to inside the current surface. */
  const goBackPage = useCallback(() => {
    setPages((current) => current.slice(0, -1))
  }, [])

  const reset = useCallback(() => {
    setStack([])
    setPages([])
  }, [])

  return {
    stack,
    /** The surface the learner is looking at, or null for the scene's base surface. */
    top: stack[stack.length - 1] ?? null,
    depth: stack.length,
    /** The page inside that surface, or null for the surface's own home page. */
    page: pages[pages.length - 1] ?? null,
    /** How many pages deep inside the surface the learner has walked. */
    pageDepth: pages.length,
    goToPage,
    replacePage,
    goBackPage,
    push,
    pop,
    reset,
  }
}
