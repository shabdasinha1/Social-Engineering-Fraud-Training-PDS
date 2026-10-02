import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, RotateCcw } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/utils/cn'
import { enter, pageItems } from '@/components/admin/adminUi'

/**
 * The small shared pieces the instructor screens repeat (ADMIN-006, restyled by
 * ENHANCEMENT-001 and compacted by ENHANCEMENT-001B).
 *
 * Kept in one file because each is a handful of lines and they are only meaningful
 * together: every list in this area loads, empties, fails and paginates the same way, and
 * an instructor should not have to learn four dialects of "nothing here yet". Spacing comes
 * from the console tokens in index.css (`p-card`, `gap-grid`, `space-y-section`), never
 * from per-page numbers, so every page keeps the same rhythm.
 *
 * Accessibility rules that hold throughout:
 *   - a status is a word plus a shape, never colour alone;
 *   - every interactive target is at least 44px tall (`min-h-11`);
 *   - a table scrolls inside its own container, so the page never scrolls sideways;
 *   - loading and error regions announce themselves;
 *   - motion is `motion-safe:` only, so reduced-motion users get the final state.
 */

/** A page heading with an optional eyebrow, description and trailing actions. */
export function PageHeading({ title, description, eyebrow, children }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-x-4 gap-y-3', enter)}>
      <div className="min-w-0 max-w-2xl">
        {eyebrow && (
          <p className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-signal">
            <span aria-hidden="true" className="h-px w-5 bg-signal" />
            {eyebrow}
          </p>
        )}
        <h1 className={cn('text-xl font-bold tracking-tight sm:text-2xl', eyebrow && 'mt-1')}>
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-balance-pretty text-text-muted">{description}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

/**
 * A card-shaped section of a page, with an optional icon, title, description and action.
 * `flush` drops the body padding so a table or toolbar can run edge to edge.
 */
export function SectionCard({
  title, description, action, icon: Icon, className, bodyClassName, flush = false, style, children,
}) {
  const hasHeader = Boolean(title || action)
  return (
    <section
      style={style}
      className={cn(
        'min-w-0 rounded-lg border border-border bg-card shadow-xs',
        'transition-[box-shadow,border-color] duration-200 hover:border-border-strong hover:shadow-sm',
        !flush && 'p-card',
        className,
      )}
    >
      {hasHeader && (
        <header className={cn('flex flex-wrap items-start justify-between gap-3', flush && 'px-card pt-card')}>
          <div className="flex min-w-0 items-center gap-2.5">
            {Icon && (
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-signal-soft text-signal">
                <Icon size={16} aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              {title && <h2 className="text-[0.95rem] font-semibold leading-snug">{title}</h2>}
              {description && (
                <p className="text-xs text-balance-pretty text-text-muted sm:text-[0.8rem]">{description}</p>
              )}
            </div>
          </div>
          {action}
        </header>
      )}
      <div className={cn(hasHeader && 'mt-3', bodyClassName)}>{children}</div>
    </section>
  )
}

/**
 * A headline figure. `value` is already formatted; `detail` says what it is out of or
 * how it was counted, so a number never stands without its basis.
 */
export function StatTile({ icon: Icon, label, value, detail, className, style }) {
  return (
    <div
      style={style}
      className={cn(
        'relative min-w-0 overflow-hidden rounded-lg border border-border bg-card px-card py-3.5 shadow-xs',
        'transition-[box-shadow,border-color] duration-200 hover:border-border-strong hover:shadow-sm',
        className,
      )}
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-signal/70" />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.7rem] font-semibold uppercase leading-tight tracking-wide text-text-muted">{label}</p>
        {Icon && <Icon size={16} aria-hidden="true" className="shrink-0 text-signal" />}
      </div>
      <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      {detail && <p className="mt-0.5 text-xs leading-snug text-text-muted">{detail}</p>}
    </div>
  )
}

/**
 * A status pill.
 *
 * `tone` carries the colour; the label carries the meaning, and a dot gives it a shape.
 * Removing the colour leaves the pill fully readable, which is the requirement.
 */
export function Pill({ tone, children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5',
        'text-xs font-semibold ring-1 ring-inset',
        tone ?? 'bg-secondary-soft text-secondary ring-border-strong',
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
      {children}
    </span>
  )
}

/** A labelled value. Used wherever a screen shows a short read-only fact. */
export function Field({ label, children, className }) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium text-text">{children ?? '—'}</dd>
    </div>
  )
}

export function LoadingState({ label = 'Loading' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8 text-text-muted">
      <Spinner size={20} label={label} />
      <span className="text-sm font-medium">{label}…</span>
    </div>
  )
}

/** A single placeholder bar. */
export function Skeleton({ className }) {
  return <span aria-hidden="true" className={cn('skeleton block h-3', className)} />
}

/**
 * Placeholder rows shaped like the table that is about to arrive, so the page does not
 * jump when it does. Only shown on a first load - a refresh keeps the previous rows.
 */
export function TableSkeleton({ rows = 6, columns = 5, label = 'Loading' }) {
  return (
    <div role="status" aria-label={label} className="px-card pb-card pt-2">
      <span className="sr-only">{label}…</span>
      <div className="grid gap-4 border-b border-border py-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }, (_, i) => <Skeleton key={i} className="h-2.5 w-2/3" />)}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div
          key={r}
          className="grid gap-4 border-b border-border py-3.5 last:border-0"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} className={c === 0 ? 'w-4/5' : c % 2 ? 'w-1/2' : 'w-3/5'} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ title, icon: Icon = Inbox, children, action }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-4 py-8 text-center">
      <span className="mb-1 grid size-10 place-items-center rounded-full border border-dashed border-border-strong bg-secondary-soft text-text-muted">
        <Icon size={18} aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold">{title}</p>
      {children && <p className="max-w-md text-sm text-balance-pretty text-text-muted">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/**
 * A one-line explanatory banner: a fact the page must state, at the smallest size that
 * still reads comfortably. Informational only - errors use `ErrorState`.
 */
export function InlineNotice({ icon: Icon, title, children, className, style }) {
  return (
    <div
      style={style}
      className={cn(
        'flex items-start gap-2.5 rounded-lg border border-info/20 bg-info-soft/70 px-3.5 py-2.5 text-sm text-text',
        className,
      )}
    >
      {Icon && <Icon size={16} className="mt-0.5 shrink-0 text-info" aria-hidden="true" />}
      <p className="min-w-0 text-balance-pretty">
        {title && <strong className="font-semibold">{title}. </strong>}
        <span className="text-text-muted">{children}</span>
      </p>
    </div>
  )
}

/**
 * A failed request.
 *
 * The server's own message is shown as-is: the backends return stable, non-technical
 * messages and reinterpreting them here would only lose information. `details.rejected_fields`
 * and `details.problems` are surfaced when present, because a validation failure the
 * instructor cannot see the cause of is a dead end.
 */
export function ErrorState({ error, onRetry }) {
  if (!error) return null
  const rejected = error.details?.rejected_fields
  const problems = error.details?.problems

  return (
    <Alert variant="danger" title="That did not work" className="items-start">
      <p>{error.message}</p>
      {Array.isArray(rejected) && rejected.length > 0 && (
        <p className="mt-1 text-sm">Rejected: {rejected.join(', ')}</p>
      )}
      {Array.isArray(problems) && problems.length > 0 && (
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm">
          {problems.slice(0, 10).map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-3 min-h-11" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Alert>
  )
}

/**
 * A horizontally scrollable table wrapper, so a wide table never widens the page.
 *
 * `relative` matters: it makes the wrapper the containing block for absolutely positioned
 * descendants such as `sr-only` link text, which would otherwise escape the scroll area
 * and widen the document. `busy` dims the previous page while the next one loads; `bleed`
 * runs the table to the card edges when it sits inside a padded card.
 */
export function TableScroll({ children, className, busy = false, bleed = false }) {
  return (
    <div
      aria-busy={busy || undefined}
      className={cn(
        'relative overflow-x-auto transition-opacity duration-200',
        bleed && '-mx-card',
        busy && 'opacity-55',
        className,
      )}
    >
      <table className="w-full min-w-max border-separate border-spacing-0 text-sm">{children}</table>
    </div>
  )
}

export function Th({ children, className }) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap border-b border-border bg-secondary-soft/60 px-2 py-2 text-left sm:px-3',
        'text-[0.7rem] font-semibold uppercase tracking-wide text-text-muted',
        'first:pl-card last:pr-card',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function Td({ children, className }) {
  return (
    <td
      className={cn(
        'border-b border-border px-2 py-2.5 align-middle first:pl-card last:pr-card sm:px-3',
        'transition-colors duration-150',
        className,
      )}
    >
      {children}
    </td>
  )
}

const PAGE_BUTTON = cn(
  'inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-md px-2.5 text-sm font-semibold',
  'transition-[background-color,color,box-shadow] duration-150',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
  'disabled:pointer-events-none disabled:opacity-40',
)

/**
 * The one pagination control for every admin table.
 *
 * The server owns paging; this only moves between pages it was told exist. It always
 * states the range ("Showing 11–20 of 100 scenarios"); the page controls appear only when
 * there is more than one page. Current page is marked with `aria-current="page"`, each
 * number is announced as "Page n", and on a phone the number row collapses to "3 / 10".
 */
export function Pagination({ page, pageSize, total, totalPages, onChange, busy = false, noun = 'records' }) {
  if (!total) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border px-card py-2.5"
    >
      <p className="text-sm text-text-muted" aria-live="polite">
        Showing <span className="font-semibold text-text tabular-nums">{from}–{to}</span> of{' '}
        <span className="font-semibold text-text tabular-nums">{total}</span> {noun}
      </p>

      {totalPages > 1 && (
        <ul className="flex items-center gap-1">
          <li>
            <button
              type="button"
              className={cn(PAGE_BUTTON, 'text-text hover:bg-secondary-soft')}
              disabled={page <= 1 || busy}
              onClick={() => onChange(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} aria-hidden="true" />
              <span className="hidden md:inline">Previous</span>
            </button>
          </li>

          {pageItems(page, totalPages).map((item) => (
            typeof item === 'string' ? (
              <li key={item} aria-hidden="true" className="hidden px-1 text-text-muted sm:block">…</li>
            ) : (
              <li key={item} className="hidden sm:block">
                <button
                  type="button"
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? 'page' : undefined}
                  disabled={busy && item !== page}
                  onClick={() => item !== page && onChange(item)}
                  className={cn(
                    PAGE_BUTTON,
                    'tabular-nums',
                    item === page
                      ? 'bg-primary text-primary-contrast shadow-xs'
                      : 'text-text hover:bg-secondary-soft',
                  )}
                >
                  {item}
                </button>
              </li>
            )
          ))}

          <li className="px-2 text-sm font-semibold tabular-nums sm:hidden" aria-hidden="true">
            {page} / {totalPages}
          </li>

          <li>
            <button
              type="button"
              className={cn(PAGE_BUTTON, 'text-text hover:bg-secondary-soft')}
              disabled={page >= totalPages || busy}
              onClick={() => onChange(page + 1)}
              aria-label="Next page"
            >
              <span className="hidden md:inline">Next</span>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </li>
        </ul>
      )}
    </nav>
  )
}

const CONTROL = cn(
  'h-11 w-full rounded-md border border-border-strong bg-surface px-3 text-sm',
  'transition-[border-color,box-shadow] duration-150 hover:border-secondary',
  'focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary/40',
)

const CONTROL_LABEL = 'mb-1 block text-[0.7rem] font-semibold uppercase tracking-wide text-text-muted'

/** A labelled `<select>` filter. */
export function SelectFilter({ id, label, value, options, onChange, className }) {
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={id} className={CONTROL_LABEL}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(CONTROL, value && 'border-primary/50 bg-primary-soft/40')}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

/** A labelled text or date input filter. */
export function InputFilter({ id, label, value, onChange, type = 'text', placeholder, className }) {
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={id} className={CONTROL_LABEL}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn(CONTROL, value && type === 'date' && 'border-primary/50 bg-primary-soft/40')}
      />
    </div>
  )
}

/**
 * The filter toolbar that heads a table card: controls in one row on a wide screen,
 * wrapping naturally below that, with Clear at the end. Laid out by the caller's grid
 * template so each page can size its own controls.
 */
export function FilterBar({ children, onClear, canClear, className, label = 'Filters' }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('grid items-end gap-x-3 gap-y-2.5 border-b border-border px-card py-3', className)}
    >
      {children}
      <Button
        variant="ghost"
        size="sm"
        className="min-h-11 justify-self-start"
        onClick={onClear}
        disabled={!canClear}
      >
        <RotateCcw size={15} aria-hidden="true" />
        Clear filters
      </Button>
    </div>
  )
}

/**
 * A single-choice segmented control, built as a radio group so it is one tab stop with
 * arrow-key movement, and announces its label and the selected option.
 */
export function Segmented({ name, label, options, value, onChange, className }) {
  return (
    <fieldset className={cn('min-w-0', className)}>
      <legend className="sr-only">{label}</legend>
      <div className="inline-flex max-w-full flex-wrap gap-0.5 rounded-md border border-border bg-secondary-soft/70 p-0.5">
        {options.map((option) => {
          const checked = option.value === value
          return (
            <label
              key={option.value}
              className={cn(
                'relative inline-flex min-h-11 cursor-pointer items-center rounded-[0.3rem] px-3 text-[0.8rem] font-semibold',
                'transition-[background-color,color,box-shadow] duration-150',
                'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-primary',
                checked ? 'bg-surface text-text shadow-xs' : 'text-text-muted hover:text-text',
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/**
 * The warning band a terminal action carries inside its confirmation dialog.
 *
 * Both destructive-looking controls in this area - reset and archive - are irreversible
 * through the application, and each says so in words rather than relying on a red button.
 */
export function TerminalWarning({ children }) {
  return (
    <p className="flex items-start gap-2 rounded-md border border-warning/25 bg-warning-soft p-3 text-sm text-warning">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span className="text-balance-pretty">{children}</span>
    </p>
  )
}
