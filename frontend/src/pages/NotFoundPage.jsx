import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { PageContainer } from '@/components/layout/PageContainer'
import { ROUTES } from '@/constants/routes'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle('Page Not Found')
  const navigate = useNavigate()

  return (
    <PageContainer
      size="sm"
      className="flex min-h-dvh flex-col items-center justify-center text-center"
    >
      <p className="text-sm font-bold tracking-[0.12em] text-text-muted uppercase">
        Page not found
      </p>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">This page is not available.</h1>
      <p className="mt-2 text-text-muted">Please go back and start again.</p>
      <Button className="mt-7" onClick={() => navigate(ROUTES.LOGIN)}>
        Back to Start
      </Button>
    </PageContainer>
  )
}
