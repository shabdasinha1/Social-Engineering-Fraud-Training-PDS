import { ChevronRight, ShieldHalf, TriangleAlert } from 'lucide-react'
import { FileGlyph, MailAvatar } from '@/components/simulation/email/MailBlocks'
import { DetailRows, InertNote, Screen } from '@/components/simulation/surfaces/SurfaceFrame'
import { cn } from '@/utils/cn'

/**
 * A screen inside the mail app (IMMERSIVE-005, `SURFACE.MAIL`).
 *
 * One page graph for everything a mail client shows behind a message: the expanded details
 * (From, Reply-To, To, the authentication summary), "Show original", where each link really
 * points, another folder or a search, an older message, and the attachment preview with the
 * app's own message bar. Walking between pages is local navigation and records nothing; the
 * only controls that reach the engine are the scene affordances passed in as `controls`,
 * scoped by the scene to one page - and on a page with a message bar they sit in that bar,
 * where the app puts them.
 *
 * Nothing on a page is styled by what it means. An authentication result is printed as the
 * word the header carries; a failing check and a passing one get the same badge.
 */

function Block({ block, onNavigate, controls, renderControl }) {
  switch (block.type) {
    case 'identity':
      return (
        <header className="flex items-center gap-3 border-b border-mail-border bg-mail-surface px-4 py-3.5">
          <MailAvatar seed={block.name} />
          <span className="min-w-0">
            <span className="block text-[0.9rem] font-bold break-words">{block.name}</span>
            <span className="block text-[0.76rem] break-all text-mail-meta">{block.address}</span>
            {block.note && <span className="mt-0.5 block text-[0.7rem] text-mail-meta">{block.note}</span>}
          </span>
        </header>
      )

    case 'rows':
      return (
        <section className="mt-2 bg-mail-surface py-1">
          {block.heading && <Heading>{block.heading}</Heading>}
          <DetailRows rows={block.rows} />
        </section>
      )

    case 'checks':
      return (
        <section className="mt-2 bg-mail-surface py-1" data-testid="mail-checks">
          <Heading>{block.heading ?? 'Security'}</Heading>
          <ul className="divide-y divide-mail-border">
            {block.rows.map((row) => (
              <li key={row.label} className="flex items-start gap-2.5 px-3.5 py-2">
                <ShieldHalf size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-mail-meta" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.78rem] font-semibold">{row.label}</span>
                  <span className="block text-[0.74rem] break-all text-mail-meta">{row.value}</span>
                </span>
                {row.result && (
                  <span className="shrink-0 rounded border border-mail-border px-1.5 py-0.5 text-[0.64rem] font-bold tracking-wide text-text uppercase">
                    {row.result}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )

    case 'note':
      return <p className="px-4 py-2.5 text-[0.76rem] text-mail-meta text-balance-pretty">{block.text}</p>

    case 'heading':
      return <h3 className="px-4 pt-3.5 text-[0.95rem] font-bold text-balance-pretty">{block.text}</h3>

    case 'items':
      return (
        <section className="mt-2 bg-mail-surface py-1">
          {block.heading && <Heading>{block.heading}</Heading>}
          {block.items.length === 0 && (
            <p className="px-3.5 py-3 text-[0.8rem] text-mail-meta">{block.empty}</p>
          )}
          <ul className="divide-y divide-mail-border">
            {block.items.map((item, index) => {
              const body = (
                <>
                  {item.file ? <FileGlyph kind={item.file} /> : null}
                  <span className="min-w-0 flex-1 text-left">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0 truncate text-[0.82rem] font-semibold">{item.label}</span>
                      {item.meta && <span className="shrink-0 text-[0.66rem] text-mail-meta">{item.meta}</span>}
                    </span>
                    {item.value && <span className="block text-[0.74rem] break-words text-mail-meta">{item.value}</span>}
                  </span>
                  {item.to && <ChevronRight size={15} aria-hidden="true" className="shrink-0 text-mail-meta" />}
                </>
              )
              return (
                <li key={`${index}-${item.label}`}>
                  {item.to ? (
                    <button
                      type="button"
                      data-page-link={item.to}
                      onClick={() => onNavigate(item.to)}
                      className="flex min-h-12 w-full items-center gap-2.5 px-3.5 py-2 hover:bg-mail-tint"
                    >
                      {body}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2.5 px-3.5 py-2">{body}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )

    case 'mono':
      return (
        <section className="mt-2 bg-mail-surface py-1">
          {block.heading && <Heading>{block.heading}</Heading>}
          <pre className="mx-3.5 mb-2 overflow-x-hidden rounded-md bg-mail-tint px-3 py-2 font-mono text-[0.68rem] leading-relaxed break-all whitespace-pre-wrap" data-testid="mail-original">
            {block.lines.join('\n')}
          </pre>
        </section>
      )

    case 'mail':
      return (
        <article className="bg-mail-surface px-4 py-3">
          <p className="text-[0.95rem] font-semibold break-words">{block.subject}</p>
          <div className="mt-2 flex items-center gap-2.5">
            <MailAvatar seed={block.from} size="sm" />
            <span className="min-w-0">
              <span className="block text-[0.8rem] font-semibold">{block.from}</span>
              <span className="block text-[0.7rem] break-all text-mail-meta">{block.address}</span>
              {block.date && <span className="block text-[0.68rem] text-mail-meta">{block.date}</span>}
            </span>
          </div>
          {block.paragraphs.map((paragraph, index) => (
            <p key={index} className="mt-2.5 text-[0.82rem] leading-relaxed break-words">{paragraph}</p>
          ))}
        </article>
      )

    case 'file':
      return (
        <div className="flex items-center gap-3 border-b border-mail-border bg-mail-surface px-4 py-3">
          <FileGlyph kind={block.kind} />
          <span className="min-w-0">
            <span className="block truncate text-[0.84rem] font-semibold">{block.name}</span>
            <span className="block text-[0.7rem] text-mail-meta">{block.meta}</span>
          </span>
        </div>
      )

    case 'bar':
      /**
       * The document app's own message bar. The page's scene controls live here, because
       * this is where the app puts its buttons; with none offered, the bar is only text.
       */
      return (
        <div className="border-b border-mail-bar-border bg-mail-bar px-3.5 py-2.5" data-testid="mail-bar">
          <p className="flex items-start gap-2 text-[0.76rem]">
            <TriangleAlert size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-text" />
            <span className="min-w-0">
              <span className="font-bold">{block.title}</span>{' '}
              <span>{block.text}</span>
            </span>
          </p>
          {controls.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">{controls.map(renderControl)}</div>
          )}
        </div>
      )

    case 'sheet':
      /** A spreadsheet grid. Cells are authored text; `masked` cells are drawn as `####`. */
      return (
        <div className="bg-mail-surface px-2 py-2" data-testid="mail-sheet">
          <table className="w-full table-fixed border-collapse text-[0.66rem]">
            <thead>
              <tr>
                {block.columns.map((column) => (
                  <th key={column} scope="col" className="truncate border border-mail-border bg-mail-tint px-1 py-1 text-left font-semibold">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="truncate border border-mail-border px-1 py-1 tabular-nums">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {block.tabs && (
            <p className="mt-1.5 flex gap-1.5 text-[0.62rem]">
              {block.tabs.map((tab, index) => (
                <span key={tab} className={cn('rounded-sm border border-mail-border px-1.5 py-0.5', index === 0 && 'bg-mail-tint font-semibold')}>
                  {tab}
                </span>
              ))}
            </p>
          )}
          {block.caption && <p className="mt-2 px-1 text-[0.72rem] text-mail-meta">{block.caption}</p>}
        </div>
      )

    default:
      return null
  }
}

function Heading({ children }) {
  return (
    <h4 className="px-3.5 pt-1.5 pb-1 text-[0.68rem] font-bold tracking-wide text-mail-meta uppercase">
      {children}
    </h4>
  )
}

export function MailSurface({
  surface, page, nested = false, onBack, onNavigate, controls = [], renderControl,
}) {
  const pageId = page ?? surface.home
  const current = surface.pages[pageId] ?? surface.pages[surface.home]
  const blocks = current.blocks ?? []
  const hasBar = blocks.some((block) => block.type === 'bar')

  return (
    <Screen
      key={pageId}
      title={current.title ?? surface.title}
      subtitle={current.subtitle ?? null}
      onBack={onBack}
      backLabel={nested ? 'Back to the previous screen' : `Close ${surface.title}`}
      tone="mail"
      footer={<InertNote>{surface.inertNote ?? 'Local mail screen. Nothing here reaches a real mailbox.'}</InertNote>}
    >
      <div className="space-y-0 bg-mail-tint/60 pb-3">
        {blocks.map((block, index) => (
          <Block
            key={index}
            block={block}
            onNavigate={onNavigate}
            controls={block.type === 'bar' ? controls : []}
            renderControl={renderControl}
          />
        ))}

        {!hasBar && controls.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 bg-mail-surface px-3.5 py-3" data-testid="mail-surface-controls">
            {controls.map(renderControl)}
          </div>
        )}

        {(current.links ?? []).length > 0 && (
          <ul className="mt-2 space-y-1 bg-mail-surface px-2.5 py-2">
            {current.links.map((pageLink) => (
              <li key={pageLink.id}>
                <button
                  type="button"
                  data-page-link={pageLink.to}
                  onClick={() => onNavigate(pageLink.to)}
                  className="inline-flex min-h-11 items-center gap-1 rounded-md px-1 text-[0.8rem] font-semibold text-mail-accent hover:underline"
                >
                  {pageLink.label}
                  <ChevronRight size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Screen>
  )
}
