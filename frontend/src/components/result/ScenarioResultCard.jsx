import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { PathReplay } from '@/components/result/PathReplay'
import { ScenarioReview } from '@/components/result/ScenarioReview'
import { OUTCOME_CLASS, OUTCOME_CODE_LABELS, label } from '@/constants/result'
import { cn } from '@/utils/cn'

/**
 * One scenario's result (UI-003, extended by REVIEW-001).
 *
 * Everything shown is from the RESULT-001 payload: the score the engine committed, the
 * outcome class it assigned, the path it recorded and the feedback the client authored.
 * Nothing is computed here, and no hidden field is displayed - the card identifies the
 * scenario by what the learner already saw (sender and notification preview), not by the
 * server-only authoring title.
 *
 * The body is the learning review when the server sends one, and the original feedback
 * block when it does not. The fallback is not dead code: it keeps this component
 * compatible with a result built before REVIEW-001 - a stored attempt, a cached payload -
 * so an older result still renders instead of collapsing to an empty panel.
 *
 * Cards stay COLLAPSED by default - ten expanded reviews would bury the summary above
 * them, and a result that is one long wall of mistakes is the thing this capability is
 * meant to avoid. So the collapsed row carries the review's own one-line headline instead:
 * a learner scrolling the list sees what went wrong in each scenario without opening
 * anything, and opens the ones they want the detail for.
 */

const TONES = {
  success: 'bg-success-soft text-success ring-success/25',
  warning: 'bg-warning-soft text-warning ring-warning/25',
  danger: 'bg-danger-soft text-danger ring-danger/25',
  /** Not reached in time, and (ENHANCEMENT-003) skipped in the demonstration: no alarm colour. */
  neutral: 'bg-secondary-soft text-text-muted ring-border-strong',
}

export function ScenarioResultCard({ scenario }) {
  const review = scenario.review ?? null
  const [open, setOpen] = useState(false)
  const detailsId = useId()

  const outcome = OUTCOME_CLASS[scenario.outcome_class]
  const hasDetail = Boolean(review) || Boolean(scenario.feedback?.result) || scenario.path?.length > 0

  return (
    <li className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3 p-4 sm:p-5">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary-soft text-sm font-bold text-secondary tabular-nums"
        >
          {scenario.ordinal}
        </span>

        {/*
          Below `sm` the text takes the whole row beside the number (3.5rem = the 2.5rem
          badge plus the gap), so the score wraps underneath it as the classes below intend
          instead of squeezing the text into a narrow column beside it.
        */}
        <div className="min-w-0 flex-1 basis-[calc(100%-3.5rem)] sm:basis-0">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-bold">
              {scenario.platform_label ?? scenario.platform}
            </span>
            {outcome && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[0.68rem] font-semibold ring-1',
                  TONES[outcome.tone],
                )}
              >
                {outcome.label}
              </span>
            )}
          </p>

          {scenario.sender && (
            <p className="mt-0.5 truncate text-sm font-medium text-text-muted">
              {scenario.sender}
            </p>
          )}
          {scenario.preview && (
            <p className="mt-0.5 text-sm text-balance-pretty text-text-muted">
              {scenario.preview}
            </p>
          )}

          {/*
            REVIEW-001. The server's own headline for this scenario, so the list reads as a
            review rather than as ten rows that each have to be opened to mean anything.
          */}
          {review?.headline && (
            <p
              data-testid={`review-headline-${scenario.ordinal}`}
              className={cn(
                'mt-1.5 text-sm font-medium text-balance-pretty',
                review.status === 'mistake' ? 'text-danger' : 'text-text-muted',
              )}
            >
              {review.headline}
            </p>
          )}
        </div>

        <div className="ml-14 flex items-center gap-3 sm:ml-0 sm:flex-col sm:items-end sm:gap-1">
          <p className="text-sm font-bold tabular-nums">
            {scenario.score_0_10}
            <span className="font-normal text-text-muted">/{scenario.max_score ?? 10}</span>
          </p>
          <p className="text-xs text-text-muted">
            {label(OUTCOME_CODE_LABELS, scenario.outcome_code, 'Not resolved')}
          </p>
        </div>
      </div>

      {hasDetail && (
        <>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={detailsId}
            onClick={() => setOpen((value) => !value)}
            className="flex min-h-11 w-full items-center gap-1.5 border-t border-border px-4 text-sm font-semibold text-primary hover:bg-primary-soft sm:px-5"
          >
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={cn('transition-transform duration-200', open && 'rotate-180')}
            />
            {open ? 'Hide' : 'Show'} what happened in scenario {scenario.ordinal}
          </button>

          {open && (
            <div id={detailsId} className="border-t border-border p-4 sm:p-5">
              {review ? (
                <ScenarioReview review={review} ordinal={scenario.ordinal} />
              ) : (
                <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)]">
                  <div className="min-w-0">
                    <FeedbackDetails feedback={scenario.feedback} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.65rem] font-bold tracking-wide text-text-muted uppercase">
                      Your decision path
                    </p>
                    <PathReplay path={scenario.path} className="mt-2.5" />
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </li>
  )
}

/**
 * The five section 7 feedback fields, exactly as the server sent them.
 *
 * The pre-REVIEW-001 body, kept for a payload that carries no `review` block. Also the
 * immediate feedback card on the scenario outcome screen (ADM-007).
 */
export function FeedbackDetails({ feedback }) {
  if (!feedback) return null

  const rows = [
    ['What it was', feedback.result],
    ['Safe response', feedback.safe_action],
    ['Likely impact', feedback.impact],
    ['Habit to keep', feedback.prevention_habit],
  ].filter(([, value]) => value)

  return (
    <dl className="space-y-3.5">
      {rows.map(([term, value]) => (
        <div key={term}>
          <dt className="text-[0.65rem] font-bold tracking-wide text-text-muted uppercase">
            {term}
          </dt>
          <dd className="mt-0.5 text-sm text-balance-pretty">{value}</dd>
        </div>
      ))}

      {feedback.cues?.length > 0 && (
        <div>
          <dt className="text-[0.65rem] font-bold tracking-wide text-text-muted uppercase">
            Signs to notice
          </dt>
          <dd className="mt-1">
            <ul className="space-y-1.5">
              {feedback.cues.map((cue) => (
                <li key={cue} className="flex gap-2 text-sm text-balance-pretty">
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-text-muted"
                  />
                  {cue}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      )}
    </dl>
  )
}
