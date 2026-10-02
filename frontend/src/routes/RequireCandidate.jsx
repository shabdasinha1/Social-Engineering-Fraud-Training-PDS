import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { Spinner } from '@/components/ui/Spinner'
import { ROUTES } from '@/constants/routes'
import { useCandidate } from '@/hooks/useCandidate'

/** Screens after login. Sends the candidate to /login when there is no session. */
export function RequireCandidate() {
  const { candidate, checking } = useCandidate()
  const location = useLocation()

  if (checking) {
    return (
      <PageContainer size="sm" className="flex min-h-dvh items-center justify-center">
        <Spinner size={28} label="Checking your session" />
      </PageContainer>
    )
  }

  if (!candidate) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
