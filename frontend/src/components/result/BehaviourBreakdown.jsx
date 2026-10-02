import { STAGE_LABELS, label } from '@/constants/result'
import { cn } from '@/utils/cn'

/**
 * The section 7 behaviour breakdown (UI-003).
 *
 * Platform, family, trigger and action stage - all of it aggregated **server-side** by
 * RESULT-001 across the ten scenarios just completed. The client picks no buckets,
 * classifies nothing and knows no taxonomy: `key` and `label` both arrive ready to render.
 *
 * The bars carry a text value beside them, so nothing is communicated by length or colour
 * alone.
 */

function Bar({ value, max }) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0

  return (
    <span
      aria-hidden="true"
      className="block h-1.5 w-full overflow-hidden rounded-full bg-secondary-soft"
    >
      <span
        className={cn(
          'block h-full rounded-full',
          percent >= 80 ? 'bg-success' : percent >= 50 ? 'bg-primary' : 'bg-warning',
        )}
        style={{ width: `${percent}%` }}
      />
    </span>
  )
}

function BucketList({ title, buckets, emptyNote }) {
  if (!buckets?.length) {
    return (
      <div>
        <h3 className="text-sm font-bold">{title}</h3>
        <p className="mt-2 text-sm text-text-muted">{emptyNote}</p>
      </div>
    )
  }

  return (
    <div className="min-w-0">
      <h3 className="text-sm font-bold">{title}</h3>
      <ul className="mt-3 space-y-3">
        {buckets.map((bucket) => (
          <li key={bucket.key}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <span className="min-w-0 text-sm font-medium">{bucket.label}</span>
              <span className="shrink-0 text-xs font-semibold text-text-muted tabular-nums">
                {bucket.points}/{bucket.max_points}
                <span className="ml-1.5 font-normal">
                  ({bucket.scenarios} {bucket.scenarios === 1 ? 'scenario' : 'scenarios'})
                </span>
              </span>
            </div>
            <div className="mt-1.5">
              <Bar value={bucket.points} max={bucket.max_points} />
            </div>
            {(bucket.missed_threats > 0 || bucket.false_positives > 0) && (
              <p className="mt-1 text-xs text-text-muted">
                {[
                  bucket.missed_threats > 0 && `${bucket.missed_threats} threat missed`,
                  bucket.false_positives > 0 && `${bucket.false_positives} genuine item rejected`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Where in the six stages the constructive action was actually taken. */
function StageList({ stages }) {
  if (!stages?.length) return null

  return (
    <div className="min-w-0">
      <h3 className="text-sm font-bold">By decision stage</h3>
      <ul className="mt-3 space-y-3">
        {stages.map((stage) => (
          <li key={stage.stage}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="text-sm font-medium">{label(STAGE_LABELS, stage.stage)}</span>
              <span className="text-xs font-semibold text-text-muted tabular-nums">
                {stage.constructive_actions}/{stage.scenarios_reached} reached
              </span>
            </div>
            <div className="mt-1.5">
              <Bar value={stage.constructive_actions} max={stage.scenarios_reached} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function BehaviourBreakdown({ behaviour }) {
  if (!behaviour) return null

  return (
    <section
      aria-labelledby="behaviour-heading"
      className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      <h2 id="behaviour-heading" className="text-lg font-bold">
        Where your marks came from
      </h2>
      <p className="mt-1 text-sm text-balance-pretty text-text-muted">
        Across the ten scenarios in this attempt only.
      </p>

      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        <BucketList
          title="By app"
          buckets={behaviour.by_platform}
          emptyNote="No platform data for this attempt."
        />
        <StageList stages={behaviour.by_stage} />
        <BucketList
          title="By case type"
          buckets={behaviour.by_family}
          emptyNote="No case-type data for this attempt."
        />
        <BucketList
          title="By persuasion technique"
          buckets={behaviour.by_trigger}
          emptyNote="No technique data for this attempt."
        />
      </div>
    </section>
  )
}
