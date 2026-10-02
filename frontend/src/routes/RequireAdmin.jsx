import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { Spinner } from '@/components/ui/Spinner'
import { ROUTES } from '@/constants/routes'
import { adminApi } from '@/services/adminApi'

/**
 * Guards the admin screens. Asks the server who the admin session belongs to -
 * the httpOnly cookie is not readable here, and no admin state is kept in
 * localStorage or sessionStorage.
 *
 * Kept separate from RequireCandidate on purpose: a candidate session must
 * never satisfy this guard. This is only the redirect - the server enforces
 * the authorisation independently on every /api/admin route.
 */
export function RequireAdmin() {
  const location = useLocation()
  const [admin, setAdmin] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    adminApi
      .me({ signal: controller.signal })
      .then((data) => {
        setAdmin(data.admin)
        setChecking(false)
      })
      .catch((error) => {
        // An aborted request means this effect was cleaned up (StrictMode
        // remount). Leaving `checking` true lets the next run settle it -
        // clearing it here would redirect to the login screen before the
        // session had actually been checked.
        if (error.name === 'AbortError') return
        setAdmin(null)
        setChecking(false)
      })

    return () => controller.abort()
  }, [])

  if (checking) {
    return (
      <PageContainer size="sm" className="flex min-h-dvh items-center justify-center">
        <Spinner size={28} label="Checking your admin session" />
      </PageContainer>
    )
  }

  if (!admin) {
    return <Navigate to={ROUTES.ADMIN_LOGIN} replace state={{ from: location.pathname }} />
  }

  return <Outlet context={{ admin }} />
}
