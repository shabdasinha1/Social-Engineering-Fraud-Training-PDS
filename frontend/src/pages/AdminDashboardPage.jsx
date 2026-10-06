import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  BarChart3,
  ClipboardList,
  Crosshair,
  FileText,
  Gauge,
  Info,
  Layers,
  PieChart,
  RefreshCw,
  ScrollText,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Trophy,
  TrendingDown,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  EmptyState,
  ErrorState,
  InlineNotice,
  PageHeading,
  Pill,
  SectionCard,
  Segmented,
  Skeleton,
  StatTile,
  TableScroll,
  Td,
  Th,
} from '@/components/admin/AdminPrimitives'
import { enter, rowClass, staggerStyle } from '@/components/admin/adminUi'
import {
  ColumnChart,
  CountBars,
  Legend,
  PlatformLabel,
  RateBars,
  StackedStrip,
} from '@/components/admin/DashboardCharts'
import {
  DASHBOARD_OUTCOMES,
  PLATFORM_METRICS,
  formatDateTime,
  formatRate,
  formatShortDay,
} from '@/constants/admin'
import { ROUTES } from '@/constants/routes'
import { useAdminDocumentTitle } from '@/hooks/useDocumentTitle'
import { adminApi } from '@/services/adminApi'
import { cn } from '@/utils/cn'

/**
 * The instructor dashboard (ENHANCEMENT-001, MOM 24 September 2026; compacted and made
 * assessment-only by ENHANCEMENT-001B).
 *
 * ### Every figure is the server's
 *
 * `GET /api/admin/dashboard` counts completed ASSESSMENT attempts, their committed scores
 * and the RESULT-001 outcome class of every scenario in them, and publishes each rate with
 * its numerator and denominator. This screen formats those numbers and draws them; it
 * scores, classifies and ranks nothing. "Highest" and "lowest" come from the server's
 * `extremes`. There is no mode switch: the product is an assessment system, and the API
 * takes no parameters.
 *
 * ### Nothing identifies a learner
 *
 * The payload carries no name, service number or id, so none can appear here. To look at
 * a person, the instructor goes to Attempts, where the viewer's own rules apply.
 *
 * ### Little or no data is a normal state
 *
 * A new installation has no completed attempts. Every panel then says so in words, and the
 * figures that do exist - learners, attempts started - still show.
 */

const EVIDENCE = {
  score_rate: (r) => `${r.numerator} of ${r.denominator} points`,
  attack_success_rate: (r) => `${r.numerator} of ${r.denominator} malicious`,
  safe_handling_rate: (r) => `${r.numerator} of ${r.denominator} decided`,
  false_positive_rate: (r) => `${r.numerator} of ${r.denominator} genuine`,
}

/** Assessment completion shows the two live states only; reset attempts are not charted. */
const STATUS_SEGMENTS = [
  { key: 'completed', label: 'Completed', swatch: 'bg-success' },
  { key: 'in_progress', label: 'In progress', swatch: 'bg-info' },
]

const TOOLS = [
  { to: ROUTES.ADMIN_SCENARIOS, icon: FileText, title: 'Scenarios', body: 'Review, publish, retire or clone versions' },
  { to: ROUTES.ADMIN_ATTEMPTS, icon: ClipboardList, title: 'Attempts', body: 'Open, export or reset an attempt' },
  { to: ROUTES.ADMIN_SETTINGS, icon: Settings, title: 'Settings', body: 'When assessment feedback is shown' },
  { to: ROUTES.ADMIN_AUDIT, icon: ScrollText, title: 'Audit log', body: 'Every administrative change' },
]

const joinLabels = (labels) => (labels.length <= 2
  ? labels.join(' and ')
  : `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`)

const GOOD_TONE = 'bg-success-soft text-success ring-success/25'
const BAD_TONE = 'bg-danger-soft text-danger ring-danger/25'

/** The badge a platform row earns when it is the server's highest or lowest for a metric. */
function extremeBadge(extremes, platform, better) {
  if (!extremes || extremes.all_equal) return null
  if (extremes.highest.platforms.includes(platform)) {
    return <Pill tone={better === 'high' ? GOOD_TONE : BAD_TONE}>Highest</Pill>
  }
  if (extremes.lowest.platforms.includes(platform)) {
    return <Pill tone={better === 'low' ? GOOD_TONE : BAD_TONE}>Lowest</Pill>
  }
  return null
}

/** One highlighted finding: which platform(s), at what rate, over how much data. */
function Finding({ icon: Icon, tone, title, extreme, rows, metric, phrase }) {
  // With a tie, each platform's evidence is named so the counts cannot be misattributed.
  const tied = extreme.platforms.length > 1
  const evidence = extreme.platforms
    .map((p) => rows.find((r) => r.platform === p))
    .filter(Boolean)
    .map((row) => `${tied ? `${row.label} ` : ''}${EVIDENCE[metric](row[metric])}`)
    .join('; ')

  return (
    <div className="flex min-w-0 items-start gap-2.5 rounded-md border border-border bg-surface p-3 transition-colors duration-200 hover:border-border-strong">
      <span className={cn('grid size-8 shrink-0 place-items-center rounded-md', tone)}>
        <Icon size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-text-muted">{title}</p>
        <p className="text-sm font-bold">
          {joinLabels(extreme.labels)}
          <span className="ml-2 tabular-nums">{formatRate(extreme.rate)}</span>
        </p>
        <p className="text-xs text-text-muted" title={phrase}>{evidence}</p>
      </div>
    </div>
  )
}

function RiskSummary({ data }) {
  const attack = data.extremes.attack_success_rate
  const score = data.extremes.score_rate
  const rows = data.platforms

  if (!attack && !score) {
    return (
      <EmptyState title="Nothing to compare yet" icon={Crosshair}>
        Highest and lowest are shown once completed assessments cover at least two platforms.
      </EmptyState>
    )
  }

  return (
    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
      {attack && !attack.all_equal && (
        <>
          <Finding
            icon={ShieldAlert}
            tone="bg-danger-soft text-danger"
            title="Highest malicious success"
            extreme={attack.highest}
            rows={rows}
            metric="attack_success_rate"
            phrase="Threats were missed most often here"
          />
          <Finding
            icon={ShieldCheck}
            tone="bg-success-soft text-success"
            title="Lowest malicious success"
            extreme={attack.lowest}
            rows={rows}
            metric="attack_success_rate"
            phrase="Threats were caught most often here"
          />
        </>
      )}
      {attack?.all_equal && (
        <p className="rounded-md border border-border bg-surface p-3 text-sm text-text-muted sm:col-span-2 xl:col-span-1 2xl:col-span-2">
          Malicious scenario success is the same on every platform with data
          ({formatRate(attack.highest.rate)}).
        </p>
      )}
      {!attack && (
        <p className="rounded-md border border-border bg-surface p-3 text-sm text-text-muted sm:col-span-2 xl:col-span-1 2xl:col-span-2">
          Malicious scenario success needs malicious scenarios decided on at least two platforms.
        </p>
      )}
      {score && !score.all_equal && (
        <>
          <Finding
            icon={Trophy}
            tone="bg-signal-soft text-signal"
            title="Strongest by score"
            extreme={score.highest}
            rows={rows}
            metric="score_rate"
            phrase="Highest average score"
          />
          <Finding
            icon={TrendingDown}
            tone="bg-warning-soft text-warning"
            title="Weakest by score"
            extreme={score.lowest}
            rows={rows}
            metric="score_rate"
            phrase="Lowest average score"
          />
        </>
      )}
    </div>
  )
}

function PlatformPerformance({ data, style }) {
  const [metricKey, setMetricKey] = useState(PLATFORM_METRICS[0].key)
  const metric = PLATFORM_METRICS.find((m) => m.key === metricKey)
  const hasData = data.platforms.some((p) => p.scenarios > 0)

  return (
    <SectionCard
      icon={BarChart3}
      title="Platform performance"
      description="WhatsApp, Instagram, Email and SMS on the same measure."
      className={cn('h-full', enter)}
      style={style}
    >
      <Segmented
        name="platform-metric"
        label="Platform measure"
        options={PLATFORM_METRICS.map((m) => ({ value: m.key, label: m.tab }))}
        value={metricKey}
        onChange={setMetricKey}
      />
      <p className="mt-2 flex items-start gap-1.5 text-xs text-text-muted">
        <Info size={13} className="mt-px shrink-0" aria-hidden="true" />
        <span className="text-balance-pretty">
          <strong className="font-semibold text-text">{metric.label}:</strong> {metric.explain}{' '}
          {metric.better === 'high' ? 'Higher is better.' : 'Lower is better.'}
        </span>
      </p>

      <div className="mt-4">
        {hasData ? (
          <RateBars
            key={metricKey}
            caption={`${metric.label} by platform`}
            rows={data.platforms.map((p) => ({
              platform: p.platform,
              label: p.label,
              ratio: p[metric.key],
              badge: extremeBadge(data.extremes[metric.key], p.platform, metric.better),
            }))}
            formatValue={formatRate}
            evidence={EVIDENCE[metric.key]}
          />
        ) : (
          <EmptyState title="No completed scenarios yet" icon={BarChart3}>
            Platform figures appear once learners complete assessments.
          </EmptyState>
        )}
      </div>
    </SectionCard>
  )
}

/**
 * The three reporting ranges. Derived from the server's own 10-point `attempt_bands`
 * (completed attempts only, demo attempts excluded): every band starts on a multiple of
 * 10, so each band - and therefore each attempt - falls in exactly one range. Nothing is
 * re-scored here; the counts are the server's, only summed.
 */
const SCORE_RANGES = [
  { key: 'high', label: '70+', min: 70, max: Infinity, swatch: 'bg-success' },
  { key: 'mid', label: '50–69', min: 50, max: 70, swatch: 'bg-warning' },
  { key: 'low', label: 'Below 50', min: -Infinity, max: 50, swatch: 'bg-danger' },
]

function ScoreRanges({ data, style }) {
  const bands = data.scores.attempt_bands
  const rows = SCORE_RANGES.map((range) => ({
    ...range,
    count: bands
      .filter((band) => band.from >= range.min && band.from < range.max)
      .reduce((sum, band) => sum + band.count, 0),
  }))
  const total = rows.reduce((sum, row) => sum + row.count, 0)

  return (
    <SectionCard
      icon={BarChart3}
      title="Score ranges"
      description="Completed assessment attempts by score range."
      className={enter}
      style={style}
    >
      <CountBars rows={rows} total={total} caption="Completed assessment attempts by score range" />
      <p className="mt-4 border-t border-border pt-3 text-xs text-text-muted">
        {total === 0
          ? 'No completed attempts yet. Ranges fill in as assessments are completed.'
          : `Based on ${total} completed ${total === 1 ? 'attempt' : 'attempts'}, scored out of 100.`}
      </p>
    </SectionCard>
  )
}

function ScoreDistribution({ data, style }) {
  const [basis, setBasis] = useState('attempts')
  const bands = basis === 'attempts' ? data.scores.attempt_bands : data.scores.learner_bands
  const stats = basis === 'attempts' ? data.scores.attempts : data.scores.learners_latest
  const unit = basis === 'attempts' ? 'attempts' : 'learners'

  return (
    <SectionCard
      icon={Layers}
      title="Score distribution"
      description="Assessment totals out of 100, lowest band to highest."
      className={enter}
      style={style}
      action={(
        <Segmented
          name="score-basis"
          label="Count by"
          options={[
            { value: 'attempts', label: 'Every attempt' },
            { value: 'learners', label: 'Each learner (latest)' },
          ]}
          value={basis}
          onChange={setBasis}
        />
      )}
    >
      {stats.count === 0 ? (
        <EmptyState title="No completed attempts yet" icon={Layers}>
          The distribution fills in as assessments are completed.
        </EmptyState>
      ) : (
        <>
          <div className="mt-1">
            <ColumnChart
              key={basis}
              caption={`Score distribution, ${unit} per 10-point band`}
              unit={unit}
              unitOne={unit.slice(0, -1)}
              data={bands.map((b) => ({
                key: `${b.from}`,
                label: `Score ${b.from}–${b.to}`,
                axisLabel: `${b.from}`,
                value: b.count,
              }))}
            />
          </div>
          <dl className="mt-3 grid grid-cols-4 gap-2 border-t border-border pt-3">
            {[
              ['Mean', stats.mean],
              ['Median', stats.median],
              ['Lowest', stats.min],
              ['Highest', stats.max],
            ].map(([name, value]) => (
              <div key={name}>
                <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-text-muted">{name}</dt>
                <dd className="text-base font-bold tabular-nums">{value ?? '—'}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-1 text-xs text-text-muted">
            Based on {stats.count} {stats.count === 1 ? unit.slice(0, -1) : unit}.
          </p>
        </>
      )}
    </SectionCard>
  )
}

function OutcomeMix({ data, style }) {
  const segmentsFor = (outcomes) => DASHBOARD_OUTCOMES.map((o) => ({ ...o, value: outcomes[o.key] ?? 0 }))
  const overall = segmentsFor(data.scenarios.outcomes)

  return (
    <SectionCard
      icon={PieChart}
      title="Outcome mix by platform"
      description="How each completed scenario ended, as classified on the learner's result."
      className={enter}
      style={style}
    >
      {data.scenarios.classified === 0 ? (
        <EmptyState title="No completed scenarios yet" icon={PieChart}>
          Outcomes appear once learners complete assessments.
        </EmptyState>
      ) : (
        <>
          <ul className="space-y-2.5">
            {data.platforms.map((p) => (
              <li key={p.platform} className="grid items-center gap-x-4 gap-y-1 sm:grid-cols-[9rem_minmax(0,1fr)_5.5rem]">
                <PlatformLabel platform={p.platform} label={p.label} />
                {p.scenarios > 0
                  ? <StackedStrip segments={segmentsFor(p.outcomes)} />
                  : <span className="text-sm text-text-muted">No completed scenarios</span>}
                <span className="text-xs text-text-muted tabular-nums sm:text-right">
                  {p.scenarios} {p.scenarios === 1 ? 'scenario' : 'scenarios'}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-border pt-3">
            <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-text-muted">
              All platforms · {data.scenarios.classified} scenarios
            </p>
            <StackedStrip segments={overall} size="lg" />
            <Legend segments={overall} total={data.scenarios.classified} className="mt-2.5" />
          </div>
        </>
      )}
    </SectionCard>
  )
}

function CompletionOverview({ data, style }) {
  const segments = STATUS_SEGMENTS.map((s) => ({ ...s, value: data.attempts.by_status[s.key] ?? 0 }))
  const ends = data.attempts.completed_end_reasons

  return (
    <SectionCard
      icon={ClipboardList}
      title="Assessment completion"
      description="Every assessment attempt started, by where it stands now."
      className={enter}
      style={style}
    >
      {data.attempts.total === 0 ? (
        <EmptyState title="No attempts started yet" icon={ClipboardList}>
          Attempts appear here as soon as a learner starts an assessment.
        </EmptyState>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm text-text-muted">
              <span className="text-2xl font-bold text-text tabular-nums">
                {formatRate(data.attempts.completion_rate.rate)}
              </span>{' '}
              completed
            </p>
            <p className="text-xs text-text-muted tabular-nums">
              {data.attempts.completion_rate.numerator} of {data.attempts.total} started
            </p>
          </div>
          <StackedStrip segments={segments} size="lg" className="mt-2.5" />
          <Legend segments={segments} total={data.attempts.total} className="mt-2.5" />
          <p className="mt-3 border-t border-border pt-3 text-sm text-text-muted">
            Of the completed:{' '}
            <span className="font-semibold text-text tabular-nums">{ends.learner_completed}</span> finished by the learner ·{' '}
            <span className="font-semibold text-text tabular-nums">{ends.expired}</span> closed by the time limit
          </p>
        </>
      )}
    </SectionCard>
  )
}

function ActivityChart({ data, style }) {
  const days = data.activity.completions_by_day
  const total = days.reduce((sum, d) => sum + d.completed, 0)

  return (
    <SectionCard
      icon={Activity}
      title="Completions, last 14 days"
      description="Assessments completed per day, in UTC."
      className={enter}
      style={style}
    >
      {total === 0 ? (
        <EmptyState title="No completions in the last 14 days" icon={Activity}>
          Recent activity shows here as assessments are completed.
        </EmptyState>
      ) : (
        <>
          <ColumnChart
            caption="Assessments completed per day over the last 14 days"
            unit="completed"
            thinLabels
            data={days.map((d) => ({
              key: d.date,
              label: formatShortDay(d.date),
              axisLabel: String(Number(d.date.slice(8, 10))),
              value: d.completed,
            }))}
          />
          <p className="mt-2 text-xs text-text-muted">
            {formatShortDay(days[0].date)} – {formatShortDay(days.at(-1).date)} (UTC) ·{' '}
            {total} {total === 1 ? 'assessment' : 'assessments'} completed in this window.
          </p>
        </>
      )}
    </SectionCard>
  )
}

function PlatformTable({ data, style }) {
  return (
    <SectionCard
      flush
      icon={Layers}
      title="Platform detail"
      description="Every figure behind the charts, with the counts it was calculated from."
      className={enter}
      style={style}
    >
      <TableScroll>
        <caption className="sr-only">Platform performance over completed assessment attempts</caption>
        <thead>
          <tr>
            <Th>Platform</Th>
            <Th>Scenarios</Th>
            <Th>Average score</Th>
            <Th>Malicious success</Th>
            <Th>Handled safely</Th>
            <Th>Genuine rejected</Th>
            <Th className="hidden lg:table-cell">Closed by time limit</Th>
          </tr>
        </thead>
        <tbody>
          {data.platforms.map((p) => (
            <tr key={p.platform} className={rowClass}>
              <Td><PlatformLabel platform={p.platform} label={p.label} /></Td>
              <Td className="tabular-nums">{p.scenarios}</Td>
              <Td className="tabular-nums">
                {p.average_score === null ? '—' : `${p.average_score} / 10`}
                <span className="ml-1.5 text-text-muted">({formatRate(p.score_rate.rate)})</span>
              </Td>
              {['attack_success_rate', 'safe_handling_rate', 'false_positive_rate'].map((k) => (
                <Td key={k} className="tabular-nums">
                  {formatRate(p[k].rate)}
                  <span className="ml-1.5 text-text-muted">
                    ({p[k].numerator}/{p[k].denominator})
                  </span>
                </Td>
              ))}
              <Td className="hidden tabular-nums lg:table-cell">{p.outcomes.not_resolved}</Td>
            </tr>
          ))}
        </tbody>
      </TableScroll>
    </SectionCard>
  )
}

function Method({ data }) {
  return (
    <details className="group h-full rounded-lg border border-border bg-card px-card py-2 shadow-xs">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-[0.95rem] font-semibold marker:hidden">
        <span className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-md bg-signal-soft text-signal">
            <Info size={16} aria-hidden="true" />
          </span>
          How these figures are calculated
        </span>
        <ArrowRight size={16} aria-hidden="true" className="text-text-muted transition-transform duration-200 group-open:rotate-90" />
      </summary>
      <div className="space-y-2 pb-2 pt-2 text-sm text-balance-pretty text-text-muted">
        <p>
          Every figure is counted by the server from <strong className="text-text">completed assessment
          attempts</strong>: their stored 0–100 totals, each scenario&apos;s stored 0–10 score, and
          each scenario&apos;s outcome as classified on the learner&apos;s own result. Attempts still
          in progress or reset by an instructor count as started, never as scored.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          {PLATFORM_METRICS.map((m) => (
            <li key={m.key}><strong className="text-text">{m.label}:</strong> {m.explain}</li>
          ))}
          <li>
            <strong className="text-text">Taking a final action</strong> excludes scenarios the
            time limit closed; their points still count toward the score, as they do for the learner.
          </li>
          <li>
            <strong className="text-text">Each learner (latest)</strong> uses each learner&apos;s most
            recently completed assessment, so one person counts once.
          </li>
        </ul>
        {data.scenarios.unclassified > 0 && (
          <p className="text-warning">
            {data.scenarios.unclassified} completed scenarios could not be classified because
            their pinned scenario version is missing, and are left out of the outcome figures.
          </p>
        )}
      </div>
    </details>
  )
}

function Tools() {
  return (
    <nav aria-labelledby="tools-heading" className="rounded-lg border border-border bg-card px-card py-3 shadow-xs">
      <h2 id="tools-heading" className="text-[0.7rem] font-semibold uppercase tracking-wide text-text-muted">
        Instructor tools
      </h2>
      <ul className="mt-1.5 grid gap-0.5 sm:grid-cols-2 xl:grid-cols-4">
        {TOOLS.map(({ to, icon: Icon, title, body }) => (
          <li key={to}>
            <Link
              to={to}
              className="group flex min-h-11 items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-secondary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Icon size={16} aria-hidden="true" className="shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{title}</span>
                <span className="block truncate text-xs text-text-muted">{body}</span>
              </span>
              <ArrowRight size={14} aria-hidden="true" className="shrink-0 text-text-muted transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** First-load placeholder in the dashboard's own shape. Appears only if loading is slow. */
function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading dashboard" className="space-y-section">
      <span className="sr-only">Loading dashboard…</span>
      <div className="grid grid-cols-2 gap-grid xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[5.5rem] rounded-lg" />)}
      </div>
      <div className="grid gap-grid xl:grid-cols-12">
        <Skeleton className="h-72 rounded-lg xl:col-span-7" />
        <Skeleton className="h-72 rounded-lg xl:col-span-5" />
      </div>
      <div className="grid gap-grid lg:grid-cols-2">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  )
}

export function AdminDashboardPage() {
  useAdminDocumentTitle()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback((signal) => adminApi
    .getDashboard({ signal })
    .then((result) => {
      setData(result)
      setError(null)
      setLoading(false)
    })
    .catch((requestError) => {
      if (requestError.name === 'AbortError') return
      setError(requestError)
      setLoading(false)
    }), [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const refresh = () => { setLoading(true); load() }
  const completed = data?.attempts.by_status.completed ?? 0
  const scores = data?.scores.attempts

  return (
    <div className="space-y-section">
      <PageHeading
        eyebrow="Assessment overview"
        title="Dashboard"
        description="Performance across completed assessment attempts, counted by the server from stored results. No learner is identified here."
      >
        {data && (
          <span className="hidden text-xs text-text-muted sm:inline">
            Updated {formatDateTime(data.generated_at)}
          </span>
        )}
        <Button variant="outline" size="sm" className="min-h-11" onClick={refresh} disabled={loading}>
          <RefreshCw size={15} aria-hidden="true" className={cn(loading && data && 'motion-safe:animate-spin')} />
          Refresh
        </Button>
      </PageHeading>

      {loading && !data && !error && <DashboardSkeleton />}

      {error && <ErrorState error={error} onRetry={refresh} />}

      {data && (
        <div
          className={cn('space-y-section transition-opacity duration-200', loading && 'opacity-60')}
          aria-busy={loading || undefined}
        >
          <div className="grid grid-cols-2 gap-grid xl:grid-cols-4">
            <StatTile
              icon={Users}
              label="Learners"
              value={data.learners.total}
              detail={`${data.learners.with_completed_attempt} with a completed assessment${data.learners.archived ? ` · ${data.learners.archived} archived` : ''}`}
              className={enter}
              style={staggerStyle(0)}
            />
            <StatTile
              icon={ClipboardList}
              label="Completed attempts"
              value={completed}
              detail={`of ${data.attempts.total} started · ${formatRate(data.attempts.completion_rate.rate)} completed`}
              className={enter}
              style={staggerStyle(1)}
            />
            <StatTile
              icon={Gauge}
              label="Average score"
              value={scores.mean === null ? '—' : scores.mean}
              detail={scores.count ? `out of 100 · median ${scores.median}` : 'No completed attempts yet'}
              className={enter}
              style={staggerStyle(2)}
            />
            <StatTile
              icon={Layers}
              label="Score range"
              value={scores.count ? `${scores.min}–${scores.max}` : '—'}
              detail={scores.count ? 'Lowest to highest attempt' : 'No completed attempts yet'}
              className={enter}
              style={staggerStyle(3)}
            />
          </div>

          {completed === 0 && (
            <InlineNotice icon={Info} title="No completed attempts yet" className={enter}>
              The charts fill in as learners complete assessments. Learner and attempt counts
              above are already live.
            </InlineNotice>
          )}

          <div className="grid gap-grid xl:grid-cols-12">
            <div className="min-w-0 xl:col-span-7 2xl:col-span-8">
              <PlatformPerformance data={data} style={staggerStyle(4)} />
            </div>
            <div className="min-w-0 xl:col-span-5 2xl:col-span-4">
              <SectionCard
                icon={Crosshair}
                title="Platform risk summary"
                description="Where malicious scenarios most and least often succeeded."
                className={cn('h-full', enter)}
                style={staggerStyle(5)}
              >
                <RiskSummary data={data} />
              </SectionCard>
            </div>
          </div>

          <div className="grid gap-grid lg:grid-cols-2">
            <ScoreRanges data={data} style={staggerStyle(6)} />
            <ScoreDistribution data={data} style={staggerStyle(7)} />
          </div>

          <div className="grid gap-grid lg:grid-cols-2">
            <OutcomeMix data={data} style={staggerStyle(8)} />
            <CompletionOverview data={data} style={staggerStyle(9)} />
          </div>

          <ActivityChart data={data} style={staggerStyle(10)} />

          <PlatformTable data={data} style={staggerStyle(11)} />

          <div className={cn('space-y-grid', enter)} style={staggerStyle(12)}>
            <Tools />
            <Method data={data} />
          </div>
        </div>
      )}
    </div>
  )
}
