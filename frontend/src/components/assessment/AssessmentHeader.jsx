import { PageContainer } from '@/components/layout/PageContainer'
import { ProgressBar } from '@/components/ui/ProgressBar'

/**
 * Sticky heading bar: where the candidate is in the one mixed assessment.
 * Sits directly under AppHeader, which carries the TRAINING SIMULATION marker.
 */
export function AssessmentHeader({ current, total }) {
  const percent = Math.round((current / total) * 100)

  return (
    <div className="sticky top-16 z-20 border-b border-border bg-surface/95 backdrop-blur-sm">
      <PageContainer className="py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="text-base font-bold sm:text-lg">Assessment</h1>
          <p className="text-sm font-semibold text-text-muted">
            Question <span className="text-text tabular-nums">{current}</span> of{' '}
            <span className="text-text tabular-nums">{total}</span>
          </p>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <ProgressBar
            value={current}
            max={total}
            label={`Question ${current} of ${total}`}
          />
          <span className="text-xs font-bold text-text-muted tabular-nums">{percent}%</span>
        </div>
      </PageContainer>
    </div>
  )
}
