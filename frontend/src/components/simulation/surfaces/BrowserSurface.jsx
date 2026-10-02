import { useEffect, useState } from 'react'
import {
  ChevronRight, Globe, Info, Lock, RotateCw, Search, ShieldAlert,
} from 'lucide-react'
import { InertNote, Screen } from '@/components/simulation/surfaces/SurfaceFrame'
import { SceneFieldList, SceneFieldset } from '@/components/simulation/surfaces/SceneForm'
import { formComplete, useLocalForm } from '@/simulation/localForm'
import { fieldsOfPage } from '@/simulation/sceneModel'
import { cn } from '@/utils/cn'

/**
 * The offline browser (IMMERSIVE-003A, rebuilt by R2).
 *
 * The client's note was that tapping a link must not produce a caption saying a browser
 * opened. So this is a browser: an address bar showing the host the message actually
 * pointed at, a page that loads, in-page links that go somewhere, a Back button that walks
 * the pages the learner visited rather than jumping home, and forms that can be filled in.
 *
 * It is also, still, completely inert:
 *
 * - the address bar is a read-only display, never a field, and nothing can be navigated to
 *   that the scene did not author;
 * - there is no `href`, `src`, `iframe`, `fetch`, `window.open` or `<form>` action here;
 * - the progress strip is a CSS animation on a timer, not a request;
 * - what the learner types stays in `useLocalForm`, inside this component, and is gone the
 *   moment they leave the page (see `SceneForm.jsx`).
 *
 * Two controls exist on a page and they are different in kind. A `primary` is LOCAL: it
 * validates the fields and walks to the next step, and it submits nothing. The controls
 * passed in as `controls` are scene affordances and are the only thing that reaches the
 * engine - which is why a page's commit control is scoped to the step where the decision
 * is actually made.
 */

const PAGE_LOAD_MS = 420

function PageBlock({ block, form, interactive, fieldOffset }) {
  switch (block.type) {
    case 'brand':
      /** A page's own masthead. Text and a monogram; never an image, never a real mark. */
      return (
        <div className="-mx-3.5 mb-1 flex items-center gap-2.5 border-b border-border bg-surface px-3.5 py-3">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-[0.8rem] font-bold text-primary-contrast"
          >
            {block.monogram}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[0.85rem] font-bold">{block.name}</span>
            {block.tagline && (
              <span className="block truncate text-[0.68rem] text-text-muted">{block.tagline}</span>
            )}
          </span>
        </div>
      )
    case 'heading':
      return <h3 className="mt-4 text-base font-bold text-balance-pretty">{block.text}</h3>
    case 'text':
      return <p className="mt-2 text-[0.85rem] text-balance-pretty">{block.text}</p>
    case 'notice':
      return (
        <p className="mt-3 flex items-start gap-2 rounded-md border border-border bg-secondary-soft px-3 py-2 text-[0.78rem] text-balance-pretty">
          <Info size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-text-muted" />
          {block.text}
        </p>
      )
    case 'summary':
      return (
        <dl className="mt-3 divide-y divide-border rounded-md border border-border bg-surface">
          {block.rows.map((row) => (
            <div key={row.label} className="flex flex-wrap gap-x-3 px-3 py-2">
              <dt className="w-32 shrink-0 text-[0.78rem] font-semibold text-text-muted">{row.label}</dt>
              <dd className={cn('min-w-0 flex-1 text-[0.82rem] break-words', row.strong && 'font-bold')}>
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      )
    case 'form':
      return interactive
        ? <SceneFieldset block={block} form={form} startIndex={fieldOffset} />
        : <SceneFieldList block={block} />

    case 'result':
      /** A page's own outcome panel: what the site says happened. Deterministic content. */
      return (
        <div className="mt-4 rounded-md border border-border bg-surface p-3.5">
          <p className="text-[0.72rem] font-bold tracking-wide text-text-muted uppercase">
            {block.heading}
          </p>
          <p className="mt-1 text-[0.95rem] font-bold text-balance-pretty">{block.text}</p>
          {block.rows && (
            <dl className="mt-3 divide-y divide-border border-t border-border">
              {block.rows.map((row) => (
                <div key={row.label} className="flex flex-wrap gap-x-3 py-2">
                  <dt className="w-32 shrink-0 text-[0.76rem] font-semibold text-text-muted">
                    {row.label}
                  </dt>
                  <dd className="min-w-0 flex-1 text-[0.8rem] break-words">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )
    case 'fineprint':
      return <p className="mt-3 text-[0.7rem] text-text-muted">{block.text}</p>

    case 'search':
      /**
       * A search engine's query bar (IMMERSIVE-003C). A display, never a field: the query
       * is the one the scene says the learner searched for, and nothing can be typed here.
       */
      return (
        <p className="mt-3 flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-[0.82rem]">
          <Search size={14} aria-hidden="true" className="shrink-0 text-text-muted" />
          <span className="sr-only">Searched for </span>
          <span className="min-w-0 truncate">{block.query}</span>
        </p>
      )

    case 'listing':
      /**
       * One search result (IMMERSIVE-003C): the label a search page puts on it, the site,
       * the title and the snippet. A sponsored result and an ordinary one get the same card;
       * the label is the page's own words, and weighing it is the learner's job.
       */
      return (
        <div className="mt-3 rounded-md border border-border bg-surface px-3 py-2.5">
          <p className="flex flex-wrap items-center gap-x-2 text-[0.7rem] text-text-muted">
            {block.badge && <span className="font-bold text-text">{block.badge}</span>}
            <span className="min-w-0 truncate">{block.host}</span>
          </p>
          <p className="mt-0.5 text-[0.9rem] font-semibold text-info text-balance-pretty">{block.title}</p>
          {block.text && <p className="mt-0.5 text-[0.78rem] text-balance-pretty">{block.text}</p>}
          {block.phone && (
            <p className="mt-1 text-[0.8rem] font-semibold tabular-nums">{block.phone}</p>
          )}
        </div>
      )
    default:
      return null
  }
}

export function BrowserSurface({
  surface, page, nested = false, interactive = true, onBack, onNavigate, controls,
  renderControl,
}) {
  const pageId = page ?? surface.home
  const current = surface.pages[pageId] ?? surface.pages[surface.home]

  return (
    /**
     * Keyed on the page, so walking to another page is a fresh mount: the progress strip
     * runs again and - this is the part that matters - whatever was typed into the
     * previous page's fields is discarded by React rather than by a cleanup we could
     * forget to write.
     */
    <BrowserPage
      key={pageId}
      surface={surface}
      current={current}
      onBack={onBack}
      onNavigate={onNavigate}
      nested={nested}
      interactive={interactive}
      controls={controls}
      renderControl={renderControl}
    />
  )
}

function BrowserPage({
  surface, current, nested, interactive, onBack, onNavigate, controls, renderControl,
}) {
  const form = useLocalForm()
  const [loading, setLoading] = useState(true)
  const fields = fieldsOfPage(current)
  const complete = formComplete(fields, form.values)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), PAGE_LOAD_MS)
    return () => clearTimeout(timer)
  }, [])

  /**
   * Field indices are page-wide, so two form blocks on one page never collide on an input
   * id or a `name`. Computed up front rather than accumulated while rendering, because a
   * counter that advances during render is a counter that is wrong on the second one.
   */
  const blocks = current.blocks ?? []
  const offsets = []
  blocks.reduce((count, block) => {
    offsets.push(count)
    return block.type === 'form' ? count + block.fields.length : count
  }, 0)

  return (
    <Screen
      title={surface.title}
      onBack={onBack}
      backLabel={nested ? 'Back to the previous page' : 'Close the browser and go back'}
      tone="browser"
      testId="scene-surface"
      actions={
        <span aria-hidden="true" className="pr-2 text-text-muted">
          <RotateCw size={15} className={loading ? 'animate-spin' : undefined} />
        </span>
      }
      footer={<InertNote>Local training page. No network request was made.</InertNote>}
    >
      {/* Chrome. The address bar is a read-only display: nothing can be navigated to. */}
      <div className="sticky top-0 z-10 border-b border-border bg-browser-bar">
        <div className="flex items-center gap-2 px-2.5 py-2">
          <p
            data-testid="browser-address"
            className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-browser-field px-2.5 py-1 text-[0.72rem] text-text-muted"
          >
            {current.secure === false
              ? <ShieldAlert size={11} aria-hidden="true" className="shrink-0" />
              : <Lock size={11} aria-hidden="true" className="shrink-0" />}
            <span className="sr-only">Address </span>
            <span className="min-w-0 truncate">{current.url}</span>
          </p>
          <Globe size={13} aria-hidden="true" className="shrink-0 text-text-muted" />
        </div>
        {/* Progress. A CSS animation over a fixed interval - nothing is being fetched. */}
        <span aria-hidden="true" className="block h-0.5 overflow-hidden">
          {loading && (
            <span className="animate-page-load block h-full origin-left bg-info" />
          )}
        </span>
      </div>

      <div className="px-3.5 pb-4">
        <p className="mt-3 text-[0.68rem] font-bold tracking-wide text-text-muted uppercase">
          {current.host}
        </p>
        <h2 className="sr-only">{current.title}</h2>

        {blocks.map((block, index) => (
          <PageBlock
            key={index}
            block={block}
            form={form}
            interactive={interactive}
            fieldOffset={offsets[index]}
          />
        ))}

        {/*
          The page's own local step control. It validates and walks; it submits nothing,
          scores nothing and cannot advance a stage. Disabled only by incomplete input -
          never by risk - which is the specification's rule about unwise options.
        */}
        {current.primary && interactive && (
          <button
            type="button"
            data-testid="browser-primary"
            disabled={Boolean(fields.length) && !complete}
            onClick={() => onNavigate(current.primary.to)}
            className={cn(
              'mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md px-4',
              'text-sm font-semibold transition-colors duration-150',
              'bg-primary text-primary-contrast hover:bg-primary-hover',
              'disabled:cursor-not-allowed disabled:opacity-45',
            )}
          >
            {current.primary.label}
          </button>
        )}

        {controls.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">{controls.map(renderControl)}</div>
        )}

        {(current.links ?? []).length > 0 && (
          <ul className="mt-4 space-y-1 border-t border-border pt-3">
            {current.links.map((pageLink) => (
              <li key={pageLink.id}>
                <button
                  type="button"
                  data-page-link={pageLink.to}
                  onClick={() => onNavigate(pageLink.to)}
                  className="inline-flex min-h-11 items-center gap-1 rounded-md px-1 text-[0.8rem] font-semibold text-info hover:underline"
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
