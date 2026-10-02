import { ChevronRight, ShieldHalf, TriangleAlert } from 'lucide-react'
import { DetailRows, InertNote, Screen } from '@/components/simulation/surfaces/SurfaceFrame'

/**
 * A screen inside the phone's Messages app (IMMERSIVE-010, `SURFACE.SMS`).
 *
 * A text message has no contact card behind it and no profile to open, so the evidence a
 * learner can go and find is different in kind from WhatsApp's or Instagram's: the number
 * the message really came from, whether that number is a registered sender header or an
 * ordinary mobile, whether it is saved, which SIM received it, where a shortened link
 * expands to, and what else that sender has ever sent. This screen is where the app puts
 * those facts.
 *
 * It is one page graph with a shared header and a Back that walks the page history.
 * Walking between pages is local navigation and records nothing; the only controls that
 * reach the engine are the scene affordances passed in as `controls`, scoped by the scene
 * to one page - and on a page with a spam bar they sit in that bar, where the app puts
 * its own Block and Report controls.
 *
 * Nothing on a page is styled by what it means. A registered header and an unknown mobile
 * get the same badge; the comparison is the learner's to make.
 */

function Heading({ children }) {
  return (
    <h4 className="px-3.5 pt-1.5 pb-1 text-[0.68rem] font-bold tracking-wide text-sms-meta uppercase">
      {children}
    </h4>
  )
}

function Block({ block, onNavigate, controls, renderControl }) {
  switch (block.type) {
    case 'identity':
      /** Who the thread is with, as the app knows them - a name, or just a number. */
      return (
        <header className="flex flex-col items-center gap-1 border-b border-sms-border bg-sms-surface px-4 py-5 text-center">
          <span
            aria-hidden="true"
            className="grid size-16 place-items-center rounded-full bg-sms-tint text-[1.1rem] font-bold text-sms-accent"
          >
            {block.initials ?? '#'}
          </span>
          <span className="mt-1 block text-[0.95rem] font-bold break-words">{block.name}</span>
          <span className="block text-[0.8rem] tabular-nums text-sms-meta">{block.number}</span>
          {block.note && (
            <span className="mt-1 block text-[0.74rem] text-sms-meta text-balance-pretty">{block.note}</span>
          )}
        </header>
      )

    case 'rows':
      return (
        <section className="mt-2 bg-sms-surface py-1">
          {block.heading && <Heading>{block.heading}</Heading>}
          <DetailRows rows={block.rows} />
        </section>
      )

    case 'checks':
      /**
       * What the app can say about the sender. `result` is printed as the word the app
       * uses; a registered header and an unknown mobile get the same badge treatment.
       */
      return (
        <section className="mt-2 bg-sms-surface py-1" data-testid="sms-checks">
          <Heading>{block.heading ?? 'Sender'}</Heading>
          <ul className="divide-y divide-sms-border">
            {block.rows.map((row) => (
              <li key={row.label} className="flex items-start gap-2.5 px-3.5 py-2">
                <ShieldHalf size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-sms-meta" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.78rem] font-semibold">{row.label}</span>
                  <span className="block text-[0.74rem] break-all text-sms-meta">{row.value}</span>
                </span>
                {row.result && (
                  <span className="shrink-0 rounded border border-sms-border px-1.5 py-0.5 text-[0.64rem] font-bold tracking-wide text-text uppercase">
                    {row.result}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )

    case 'note':
      return <p className="px-4 py-2.5 text-[0.76rem] text-sms-meta text-balance-pretty">{block.text}</p>

    case 'heading':
      return <h3 className="px-4 pt-3.5 text-[0.95rem] font-bold text-balance-pretty">{block.text}</h3>

    case 'items':
      /** Other threads from this sender, or other messages in this one. */
      return (
        <section className="mt-2 bg-sms-surface py-1">
          {block.heading && <Heading>{block.heading}</Heading>}
          {block.items.length === 0 && (
            <p className="px-3.5 py-3 text-[0.8rem] text-sms-meta">{block.empty}</p>
          )}
          <ul className="divide-y divide-sms-border">
            {block.items.map((item, index) => {
              const body = (
                <>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0 truncate text-[0.82rem] font-semibold">{item.label}</span>
                      {item.meta && <span className="shrink-0 text-[0.66rem] tabular-nums text-sms-meta">{item.meta}</span>}
                    </span>
                    {item.value && <span className="block text-[0.74rem] break-words text-sms-meta">{item.value}</span>}
                  </span>
                  {item.to && <ChevronRight size={15} aria-hidden="true" className="shrink-0 text-sms-meta" />}
                </>
              )
              return (
                <li key={`${index}-${item.label}`}>
                  {item.to ? (
                    <button
                      type="button"
                      data-page-link={item.to}
                      onClick={() => onNavigate(item.to)}
                      className="flex min-h-12 w-full items-center gap-2.5 px-3.5 py-2 hover:bg-sms-tint"
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

    case 'link':
      /**
       * Where a shortened address really goes, as the app's own link details screen puts
       * it. Drawn text in a read-only row: there is no anchor here and nothing is fetched.
       */
      return (
        <section className="mt-2 bg-sms-surface py-1" data-testid="sms-link-details">
          <Heading>{block.heading ?? 'Link'}</Heading>
          <dl className="divide-y divide-sms-border">
            <div className="px-3.5 py-2">
              <dt className="text-[0.68rem] font-semibold text-sms-meta uppercase">In the message</dt>
              <dd className="mt-0.5 text-[0.8rem] break-all">{block.shown}</dd>
            </div>
            <div className="px-3.5 py-2">
              <dt className="text-[0.68rem] font-semibold text-sms-meta uppercase">Goes to</dt>
              <dd className="mt-0.5 text-[0.8rem] font-semibold break-all">{block.target}</dd>
            </div>
            {block.rows?.map((row) => (
              <div key={row.label} className="flex flex-wrap gap-x-3 px-3.5 py-2">
                <dt className="w-28 shrink-0 text-[0.74rem] font-semibold text-sms-meta">{row.label}</dt>
                <dd className="min-w-0 flex-1 text-[0.8rem] break-words">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )

    case 'bar':
      /**
       * The Messages app's own warning bar - the strip it puts above a thread from a
       * sender you do not know. The page's scene controls live here, because this is
       * where the app puts Block and Report; with none offered, the bar is only text.
       */
      return (
        <div className="border-b border-sms-bar-border bg-sms-bar px-3.5 py-2.5" data-testid="sms-bar">
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

    default:
      return null
  }
}

export function SmsSurface({
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
      tone="light"
      footer={<InertNote>{surface.inertNote ?? 'Local Messages screen. Nothing here sends or receives a text.'}</InertNote>}
    >
      <div className="space-y-0 bg-sms-tint/60 pb-3">
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
          <div className="mt-2 flex flex-wrap gap-2 bg-sms-surface px-3.5 py-3" data-testid="sms-surface-controls">
            {controls.map(renderControl)}
          </div>
        )}

        {(current.links ?? []).length > 0 && (
          <ul className="mt-2 space-y-1 bg-sms-surface px-2.5 py-2">
            {current.links.map((pageLink) => (
              <li key={pageLink.id}>
                <button
                  type="button"
                  data-page-link={pageLink.to}
                  onClick={() => onNavigate(pageLink.to)}
                  className="inline-flex min-h-11 items-center gap-1 rounded-md px-1 text-[0.8rem] font-semibold text-sms-accent hover:underline"
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
