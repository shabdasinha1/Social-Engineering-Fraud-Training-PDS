import { useId, useState } from 'react'
import { CHANNELS } from '@/constants/channels'
import { cn } from '@/utils/cn'

/**
 * The dashboard's chart pieces (ENHANCEMENT-001). Plain HTML and CSS, no chart library:
 * the project has none, and bars, columns and a stacked strip are all this needs.
 *
 * Rules every chart here follows (dataviz method):
 *   - magnitude is ONE hue; a platform is identified by its name and icon on the axis,
 *     never by colour alone (the four channel accents are not colour-blind separable);
 *   - text wears text tokens, never the series colour; a coloured swatch sits beside it;
 *   - bars are thin with a rounded data end, columns grow from one baseline;
 *   - every value is readable without hovering - direct labels, a legend with counts, or
 *     the table view on the page - and hover/focus adds the detail, never the only copy;
 *   - nothing is computed here beyond turning a server-published 0-1 rate into a width.
 */

const channelFor = (platform) => CHANNELS.find((c) => c.key === platform)

/** A platform's name with its channel icon. */
export function PlatformLabel({ platform, label, className }) {
  const channel = channelFor(platform)
  const Icon = channel?.icon
  return (
    <span className={cn('flex min-w-0 items-center gap-2', className)}>
      {Icon && (
        <span className={cn('grid size-7 shrink-0 place-items-center rounded-md', channel.accent)}>
          <Icon size={15} aria-hidden="true" />
        </span>
      )}
      <span className="truncate text-sm font-semibold">{label}</span>
    </span>
  )
}

/**
 * One horizontal bar per platform for one rate.
 *
 * `rows` are `{ platform, label, ratio: { numerator, denominator, rate }, badge }`. A row
 * with no data says so instead of drawing a zero-length bar that would read as 0%.
 */
export function RateBars({ rows, formatValue, evidence, caption }) {
  return (
    <ul aria-label={caption} className="space-y-3">
      {rows.map((row, index) => {
        const rate = row.ratio.rate
        const width = rate === null ? 0 : Math.max(rate * 100, rate > 0 ? 1.5 : 0)
        return (
          <li key={row.platform} className="grid gap-x-4 gap-y-1 sm:grid-cols-[9rem_minmax(0,1fr)_8.5rem] sm:items-center">
            <PlatformLabel platform={row.platform} label={row.label} />
            <div className="min-w-0">
              <span
                aria-hidden="true"
                className="block h-2.5 w-full overflow-hidden rounded-full bg-chart-track"
              >
                {rate !== null && (
                  <span
                    className="block h-full origin-left rounded-full bg-chart-bar transition-[width] duration-500 ease-out motion-safe:animate-grow-x"
                    style={{ width: `${width}%`, animationDelay: `${index * 60}ms` }}
                  />
                )}
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2 sm:block sm:text-right">
              <span className="inline-flex items-center gap-1.5 sm:justify-end">
                {row.badge}
                <span className="text-sm font-bold tabular-nums">
                  {rate === null ? 'No data' : formatValue(rate)}
                </span>
              </span>
              <span className="block text-[0.7rem] leading-tight text-text-muted tabular-nums">{evidence(row.ratio)}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Horizontal bars of counts, each a share of `total`.
 *
 * `rows` are `{ key, label, count, swatch }`. Unlike ColumnChart, a zero row keeps its
 * label and prints "0", so an empty category is visible rather than missing.
 */
export function CountBars({ rows, total, caption, unit = 'attempts', unitOne = 'attempt' }) {
  return (
    <ul aria-label={caption} className="space-y-4">
      {rows.map((row, index) => {
        const share = total > 0 ? row.count / total : 0
        return (
          <li key={row.key} className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-x-4">
            <span className="text-sm font-semibold tabular-nums">{row.label}</span>
            <span aria-hidden="true" className="block h-3 w-full overflow-hidden rounded-full bg-chart-track">
              {row.count > 0 && (
                <span
                  className={cn(
                    'block h-full origin-left rounded-full transition-[width] duration-500 ease-out motion-safe:animate-grow-x',
                    row.swatch,
                  )}
                  style={{ width: `${Math.max(share * 100, 2)}%`, animationDelay: `${index * 60}ms` }}
                />
              )}
            </span>
            <span className="min-w-[6.5rem] text-right text-sm tabular-nums">
              <span className="font-bold">{row.count}</span>{' '}
              <span className="text-text-muted">
                {row.count === 1 ? unitOne : unit}
                {total > 0 && ` · ${Math.round(share * 100)}%`}
              </span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/** The largest count rounded up to a clean axis maximum, and its tick values. */
function axisFor(maxValue) {
  if (maxValue <= 0) return { max: 1, ticks: [0, 1] }
  const magnitude = 10 ** Math.floor(Math.log10(maxValue))
  const steps = [1, 2, 2.5, 5, 10]
  const top = steps.map((s) => s * magnitude).find((v) => v >= maxValue) ?? 10 * magnitude
  const max = Math.max(Math.ceil(top), 1)
  const half = max / 2
  return { max, ticks: Number.isInteger(half) && half > 0 ? [0, half, max] : [0, max] }
}

/**
 * A column chart of counts: score bands or days.
 *
 * `data` is `{ key, label, value, detail }`. Each column is focusable and announces its
 * label, value and detail; hover or focus shows the same in a tooltip. Non-zero columns
 * carry their count on the cap, so the chart is readable without interaction.
 */
export function ColumnChart({
  data, caption, unit = 'attempts', unitOne, thinLabels = false, height = 132,
}) {
  const [active, setActive] = useState(null)
  const unitFor = (value) => (value === 1 && unitOne ? unitOne : unit)
  const tooltipId = useId()
  const axis = axisFor(Math.max(0, ...data.map((d) => d.value)))

  return (
    <figure className="min-w-0">
      <figcaption className="sr-only">{caption}</figcaption>
      <div className="flex gap-2">
        {/* y-axis ticks */}
        <div
          aria-hidden="true"
          className="relative w-7 shrink-0 text-right text-[0.7rem] text-text-muted tabular-nums"
          style={{ height }}
        >
          {axis.ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: `${100 - (tick / axis.max) * 100}%` }}
            >
              {tick}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative" style={{ height }}>
            {/* gridlines */}
            {axis.ticks.map((tick) => (
              <span
                key={tick}
                aria-hidden="true"
                className={cn(
                  'absolute inset-x-0 h-px',
                  tick === 0 ? 'bg-border-strong' : 'bg-chart-grid',
                )}
                style={{ top: `${100 - (tick / axis.max) * 100}%` }}
              />
            ))}

            <ol className="absolute inset-0 flex items-end">
              {data.map((d, index) => {
                const pct = (d.value / axis.max) * 100
                const isActive = active === d.key
                return (
                  <li key={d.key} className="relative flex h-full min-w-0 flex-1 items-end justify-center">
                    <div
                      tabIndex={0}
                      role="img"
                      aria-label={`${d.label}: ${d.value} ${unitFor(d.value)}${d.detail ? `, ${d.detail}` : ''}`}
                      aria-describedby={isActive ? tooltipId : undefined}
                      onMouseEnter={() => setActive(d.key)}
                      onMouseLeave={() => setActive(null)}
                      onFocus={() => setActive(d.key)}
                      onBlur={() => setActive(null)}
                      className="group relative flex h-full w-full cursor-default items-end justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      {d.value > 0 && (
                        <span
                          aria-hidden="true"
                          className="absolute z-[1] text-[0.7rem] font-semibold text-text tabular-nums"
                          style={{ bottom: `calc(${pct}% + 4px)` }}
                        >
                          {d.value}
                        </span>
                      )}
                      <span
                        aria-hidden="true"
                        className={cn(
                          'block w-[62%] max-w-7 origin-bottom rounded-t-[4px] transition-[height,background-color] duration-500 ease-out',
                          'motion-safe:animate-grow-y',
                          isActive ? 'bg-chart-bar-strong' : 'bg-chart-bar',
                        )}
                        style={{
                          height: d.value > 0 ? `max(${pct}%, 3px)` : 0,
                          animationDelay: `${index * 30}ms`,
                        }}
                      />
                    </div>

                    {isActive && (
                      <span
                        id={tooltipId}
                        role="tooltip"
                        className={cn(
                          'pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-md bg-console px-2.5 py-1.5 text-xs text-console-text shadow-lg',
                          /**
                           * Centred over its bar, except near either end of the axis, where
                           * a centred tooltip ran out of the card (and to the screen edge on
                           * a phone); there it opens inward from the bar instead.
                           */
                          index < data.length / 4
                            ? 'left-0'
                            : index >= (data.length * 3) / 4
                              ? 'right-0'
                              : 'left-1/2 -translate-x-1/2',
                        )}
                      >
                        <span className="block font-semibold">{d.label}</span>
                        <span className="block tabular-nums">
                          {d.value} {unitFor(d.value)}
                          {d.detail ? ` · ${d.detail}` : ''}
                        </span>
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>
          </div>

          {/* x-axis labels */}
          <ol aria-hidden="true" className="mt-2 flex">
            {data.map((d, index) => (
              <li
                key={d.key}
                className={cn(
                  'min-w-0 flex-1 truncate text-center text-[0.7rem] text-text-muted tabular-nums',
                  thinLabels && index % 2 === 1 && 'max-md:invisible',
                )}
              >
                {d.axisLabel ?? d.label}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </figure>
  )
}

/**
 * A 100% strip split into segments, with a 2px surface gap between them.
 *
 * `segments` are `{ key, label, value, swatch }`. A zero segment takes no width. The strip
 * is decorative for assistive technology; the `Legend` beside it carries every number.
 */
export function StackedStrip({ segments, className, size = 'md' }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex w-full origin-left gap-0.5 overflow-hidden rounded-full bg-chart-track motion-safe:animate-grow-x',
        size === 'lg' ? 'h-3.5' : 'h-2.5',
        className,
      )}
    >
      {total > 0 && segments.filter((s) => s.value > 0).map((s) => (
        <span
          key={s.key}
          className={cn('h-full first:rounded-l-full last:rounded-r-full', s.swatch)}
          style={{ width: `${(s.value / total) * 100}%` }}
          title={`${s.label}: ${s.value}`}
        />
      ))}
    </div>
  )
}

/** Swatch, label and count for each segment - the readable copy of a strip. */
export function Legend({ segments, total, className }) {
  return (
    <ul className={cn('grid grid-cols-[repeat(auto-fill,minmax(12.5rem,1fr))] gap-x-5 gap-y-1.5', className)}>
      {segments.map((s) => (
        <li key={s.key} className="flex min-w-0 items-center gap-2 text-sm">
          <span aria-hidden="true" className={cn('size-2.5 shrink-0 rounded-sm', s.swatch)} />
          <span className="min-w-0 truncate text-text" title={s.label}>{s.label}</span>
          <span className="ml-auto shrink-0 font-semibold tabular-nums">{s.value}</span>
          {total > 0 && (
            <span className="w-10 shrink-0 text-right text-xs text-text-muted tabular-nums">
              {Math.round((s.value / total) * 100)}%
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
