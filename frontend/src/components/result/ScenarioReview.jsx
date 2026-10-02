import { CircleAlert, CircleCheckBig, Clock, SkipForward } from 'lucide-react'
import { PathReplay } from '@/components/result/PathReplay'
import { LEARNING_ISSUE_LABELS, REVIEW_HEADINGS, REVIEW_STATUS, label } from '@/constants/result'
import { cn } from '@/utils/cn'

/**
 * The scenario learning review (REVIEW-001).
 *
 * This is the component that turns a score into training. It answers, in the order a
 * learner reads them:
 *
 *   what did I do  ->  what was wrong  ->  what did I miss  ->  what should I have done
 *   ->  why did it matter  ->  what should I remember
 *
 * A pure presentation layer, exactly like the rest of the result screen. Every sentence
 * arrives written: the server combined the event ledger with the scenario's own authored
 * feedback, and nothing here composes, classifies, scores or infers. A field the server
 * omits is not rendered rather than filled in, which is why a scenario with no authored
 * feedback degrades to a short card instead of a generic lecture.
 *
 * Three shapes, chosen by `review.status`:
 *
 *   `mistake`       the full card - every mistake, with the correct action for its own
 *                   stage, plus the cues, the consequence, the habit and both paths.
 *   `correct`       deliberately shorter. A result that spends as much space on what went
 *                   right buries what did not.
 *   `not_resolved`  the clock closed it. Styled neutrally and worded about the CLOCK, not
 *                   the learner: there is no decision here to mark right or wrong.
 */

const STATUS_STYLE = {
  correct: {
    icon: CircleCheckBig,
    chip: 'bg-success-soft text-success ring-success/25',
    rail: 'border-success/40',
  },
  mistake: {
    icon: CircleAlert,
    chip: 'bg-danger-soft text-danger ring-danger/25',
    rail: 'border-danger/40',
  },
  not_resolved: {
    icon: Clock,
    chip: 'bg-secondary-soft text-text-muted ring-border-strong',
    rail: 'border-border-strong',
  },
  /**
   * ENHANCEMENT-003. The server sends a skipped card with no authored content at all, so
   * the only things drawn are the headline, the note and the learner's own path.
   */
  skipped: {
    icon: SkipForward,
    chip: 'bg-secondary-soft text-text-muted ring-border-strong',
    rail: 'border-border-strong',
  },
}

const HEADING = 'text-[0.65rem] font-bold tracking-wide text-text-muted uppercase'

/** One labelled block of prose. Renders nothing at all when the server sent nothing. */
function Field({ term, children }) {
  if (!children) return null
  return (
    <div>
      <p className={HEADING}>{term}</p>
      <p className="mt-0.5 text-sm text-balance-pretty">{children}</p>
    </div>
  )
}

/** The cue list. Same rule: an empty list is absent, not an empty heading. */
function Cues({ term, cues }) {
  if (!cues?.length) return null
  return (
    <div>
      <p className={HEADING}>{term}</p>
      <ul className="mt-1 space-y-1.5">
        {cues.map((cue) => (
          <li key={cue} className="flex gap-2 text-sm text-balance-pretty">
            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-text-muted" />
            {cue}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * One mistake.
 *
 * The three lines are the whole point of the capability, and they come from three
 * different places: what the learner did is read from the ledger, the correct action is
 * quoted from the stage the scenario's author wrote, and the consequence describes the
 * class of action. None of the three is generic advice.
 */
function MistakeCard({ mistake, index }) {
  return (
    <li className="rounded-md border border-danger/30 bg-danger-soft/40 p-3.5">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          aria-hidden="true"
          className="grid size-5 shrink-0 place-items-center rounded-full bg-danger/15 text-[0.65rem] font-bold text-danger tabular-nums"
        >
          {index + 1}
        </span>
        <span className="text-sm font-bold text-danger">{mistake.label}</span>
      </p>

      <dl className="mt-2.5 space-y-2.5">
        <div>
          <dt className={HEADING}>{REVIEW_HEADINGS.what_you_did}</dt>
          <dd className="mt-0.5 text-sm text-balance-pretty">{mistake.what_you_did}</dd>
        </div>

        {mistake.correct_action && (
          <div>
            <dt className={HEADING}>{REVIEW_HEADINGS.correct_action}</dt>
            <dd className="mt-0.5 text-sm text-balance-pretty">{mistake.correct_action}</dd>
          </div>
        )}

        {mistake.why_it_mattered && (
          <div>
            <dt className={HEADING}>{REVIEW_HEADINGS.why_it_mattered}</dt>
            <dd className="mt-0.5 text-sm text-balance-pretty text-text-muted">
              {mistake.why_it_mattered}
            </dd>
          </div>
        )}
      </dl>
    </li>
  )
}

/**
 * Your path against the correct path.
 *
 * Side by side on purpose. The learner's path is the ledger and nothing else - no step is
 * shown that they did not take - and the correct path is what this scenario declared it
 * expected, so the difference between the two columns is the lesson.
 */
function PathComparison({ yourPath, correctPath, showCorrect }) {
  if (!yourPath?.length && !correctPath?.length) return null

  return (
    <div className={cn('grid gap-5', showCorrect && correctPath?.length && 'sm:grid-cols-2')}>
      <div className="min-w-0">
        <p className={HEADING}>{REVIEW_HEADINGS.your_path}</p>
        <PathReplay path={yourPath} className="mt-2.5" />
      </div>

      {showCorrect && correctPath?.length > 0 && (
        <div className="min-w-0">
          <p className={HEADING}>{REVIEW_HEADINGS.correct_path}</p>
          <PathReplay path={correctPath} className="mt-2.5" tone="expected" />
        </div>
      )}
    </div>
  )
}

export function ScenarioReview({ review, ordinal }) {
  if (!review) return null

  const style = STATUS_STYLE[review.status] ?? STATUS_STYLE.not_resolved
  const Icon = style.icon
  const isMistake = review.status === 'mistake'
  const issue = review.learning_issue

  /**
   * A sentence is shown once per card, under the first heading that claims it.
   *
   * Several scenarios in the bank were authored with one sentence serving as both the
   * warning sign and the prevention habit, so the payload legitimately carries the same
   * string in `missed_cues` and in `safe_response`. Printing it twice under two headings
   * makes a training card look like a template being filled rather than a review being
   * written, so the later heading is dropped instead. This compares VALUES, so a scenario
   * whose habit genuinely differs from its cue still shows both.
   *
   * The fields are claimed HERE, in the order they are rendered below, and only when they
   * will actually be rendered. Claiming a field the card does not draw would suppress the
   * heading that does draw it, and the sentence would vanish from the card entirely.
   */
  const shown = new Set()
  const once = (value) => {
    if (!value || shown.has(value)) return null
    shown.add(value)
    return value
  }

  const showsCorrectAction = isMistake || review.status === 'not_resolved'

  const body = {
    what_it_was: once(review.what_it_was),
    cues: isMistake ? (review.missed_cues ?? []).filter((cue) => once(cue)) : [],
    key_cue: isMistake ? null : once(review.key_cue),
    correct_action: showsCorrectAction ? once(review.correct_action) : null,
    why_it_mattered: isMistake ? once(review.why_it_mattered) : null,
    safe_response: once(review.safe_response),
  }

  return (
    <section
      aria-label={`Review of scenario ${ordinal}`}
      data-testid={`scenario-review-${ordinal}`}
      data-status={review.status}
      className={cn('border-l-2 pl-4', style.rail)}
    >
      <p className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.68rem] font-semibold ring-1',
            style.chip,
          )}
        >
          <Icon size={12} aria-hidden="true" />
          {isMistake && review.mistakes.length > 1
            ? `${review.mistakes.length} mistakes`
            : (REVIEW_STATUS[review.status]?.label ?? 'Review')}
        </span>

        {issue && (
          <span
            className="rounded-full bg-secondary-soft px-2 py-0.5 text-[0.68rem] font-semibold text-text-muted ring-1 ring-border-strong"
            title={issue.description}
          >
            {issue.label ?? label(LEARNING_ISSUE_LABELS, issue.key)}
          </span>
        )}
      </p>

      <p className="mt-2 text-sm font-semibold text-balance-pretty">{review.headline}</p>
      {review.note && (
        <p className="mt-1 text-sm text-balance-pretty text-text-muted">{review.note}</p>
      )}

      {isMistake && review.mistakes.length > 0 && (
        <ol className="mt-3.5 space-y-2.5">
          {review.mistakes.map((mistake, index) => (
            <MistakeCard key={`${mistake.stage}-${mistake.kind}`} mistake={mistake} index={index} />
          ))}
        </ol>
      )}

      <dl className="mt-4 space-y-3.5">
        <Field term="What it was">{body.what_it_was}</Field>

        {isMistake ? (
          <>
            <Cues term={REVIEW_HEADINGS.what_you_missed} cues={body.cues} />
            <Field term={REVIEW_HEADINGS.correct_action}>{body.correct_action}</Field>
            <Field term={REVIEW_HEADINGS.why_it_mattered}>{body.why_it_mattered}</Field>
          </>
        ) : (
          <>
            <Field term={REVIEW_HEADINGS.key_cue}>{body.key_cue}</Field>
            <Field term={REVIEW_HEADINGS.correct_action}>{body.correct_action}</Field>
          </>
        )}

        <Field term={isMistake ? REVIEW_HEADINGS.safe_response : REVIEW_HEADINGS.safe_habit}>
          {body.safe_response}
        </Field>
      </dl>

      <div className="mt-4">
        <PathComparison
          yourPath={review.your_path}
          correctPath={review.correct_path}
          showCorrect={review.status !== 'correct'}
        />
      </div>
    </section>
  )
}
