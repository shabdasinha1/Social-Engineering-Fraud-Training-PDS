import { AppHeader } from '@/components/layout/AppHeader'
import { PageContainer } from '@/components/layout/PageContainer'
import { cn } from '@/utils/cn'

/**
 * Standard page shell for the screens after login: briefing, dashboard,
 * assessment, result and history.
 */
export function AppLayout({ actions, subHeader, size = 'lg', className, children }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader actions={actions} />
      {subHeader}

      <main className={cn('flex-1 py-8 sm:py-10 lg:py-12', className)}>
        <PageContainer size={size}>{children}</PageContainer>
      </main>

      <footer className="border-t border-border py-5">
        <PageContainer size={size}>
          <p className="text-sm text-text-muted">For authorised training use only.</p>
        </PageContainer>
      </footer>
    </div>
  )
}
