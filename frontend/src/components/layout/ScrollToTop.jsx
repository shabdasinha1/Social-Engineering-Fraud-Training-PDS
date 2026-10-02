import { useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * A client-side route change keeps the window's scroll offset, so a screen reached from a
 * scrolled page (the entry form, a long result) opened part-way down with its heading out
 * of view. Every forward navigation now starts at the top; Back/Forward (`POP`) is left to
 * the browser's own scroll restoration.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useLayoutEffect(() => {
    if (navigationType !== 'POP') window.scrollTo(0, 0)
  }, [pathname, navigationType])

  return null
}
