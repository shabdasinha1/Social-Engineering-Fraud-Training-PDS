import { useEffect } from 'react'
import { ADMIN_DOCUMENT_TITLE, LEARNER_DOCUMENT_TITLE } from '@/constants/app'
import { ROUTES } from '@/constants/routes'

/** True for `/admin` and everything under it (public/document-title.js applies the same rule). */
export const isAdminPath = (pathname) =>
  pathname === ROUTES.ADMIN || pathname.startsWith(`${ROUTES.ADMIN}/`)

/**
 * Learner pages: the tab reads exactly LEARNER_DOCUMENT_TITLE, with no page name or suffix.
 * Every learner page calls this on mount, so navigating between them, or arriving from an
 * admin page, never leaves an earlier title behind. `admin: true` is the admin variant.
 */
export function useDocumentTitle({ admin = false } = {}) {
  useEffect(() => {
    document.title = admin ? ADMIN_DOCUMENT_TITLE : LEARNER_DOCUMENT_TITLE
  }, [admin])
}

/** Admin pages: the tab reads exactly ADMIN_DOCUMENT_TITLE, with no page name or suffix. */
export function useAdminDocumentTitle() {
  useDocumentTitle({ admin: true })
}
