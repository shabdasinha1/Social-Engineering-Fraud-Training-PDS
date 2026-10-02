import { BrandLogo } from '@/components/common/BrandLogo'
import { SimulationBadge } from '@/components/common/SimulationBadge'
import { PageContainer } from '@/components/layout/PageContainer'

/**
 * Brand bar shared by every screen after login. `actions` is for screen
 * specific controls such as the candidate name or a logout button.
 */
export function AppHeader({ actions }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-sm">
      <PageContainer className="flex h-16 items-center justify-between gap-4">
        <BrandLogo showText={false} className="sm:hidden" />
        <BrandLogo className="hidden sm:flex" />

        <div className="flex items-center gap-3">
          {actions}
          <SimulationBadge />
        </div>
      </PageContainer>
    </header>
  )
}
