import { ChevronRight, Package, ShieldAlert } from 'lucide-react'
import { DetailRows, InertNote, Screen } from '@/components/simulation/surfaces/SurfaceFrame'
import { AttachmentTile } from '@/components/simulation/whatsapp/AttachmentTile'
import { cn } from '@/utils/cn'

/**
 * The phone's package installer (IMMERSIVE-003C).
 *
 * W14's decision is taken on screens that belong to the operating system, not to the
 * messenger, and they are drawn that way: a system dialog floating over a dimmed screen,
 * the per-app "install unknown apps" setting with its switch, the install confirmation, and
 * - once an install has been recorded - the permission requests the app makes as it starts.
 *
 * The page graph is the scene's and the same rules hold as for the browser:
 *
 * - moving between pages (Settings, the switch) is LOCAL and records nothing;
 * - the only things that reach the engine are the scene's controls, scoped by `page` to the
 *   dialog they belong to - Install on the confirmation, Cancel on the dialogs;
 * - a page marked `final` is the far side of a recorded decision, and Back leaves the
 *   installer rather than walking back into it.
 *
 * Nothing installs. There is no package, no file, no intent to the operating system and no
 * permission anywhere in this product; `SceneContainment.test.jsx` asserts the absence of
 * every element that could load or run something, on every page of this surface.
 */

function AppMark({ app }) {
  if (!app) return null
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary-soft text-secondary"
      >
        {app.monogram ? <span className="text-[0.8rem] font-bold">{app.monogram}</span> : <Package size={18} />}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[0.88rem] font-bold">{app.name}</span>
        {app.detail && <span className="block truncate text-[0.7rem] text-text-muted">{app.detail}</span>}
      </span>
    </span>
  )
}

function PageLinks({ links = [], onNavigate }) {
  return links.map((link) => (
    <button
      key={link.id}
      type="button"
      data-page-link={link.to}
      onClick={() => onNavigate(link.to)}
      className="inline-flex min-h-11 items-center rounded-full px-3.5 text-[0.82rem] font-semibold text-info hover:bg-info-soft"
    >
      {link.label}
    </button>
  ))
}

/** A system dialog over a dimmed screen. */
function DialogPage({ page, controls, renderControl, onNavigate }) {
  return (
    <div className="flex min-h-full items-center bg-black/45 px-4 py-8">
      <div className="w-full rounded-3xl bg-surface p-5 shadow-lg" role="dialog" aria-label={page.title}>
        {page.alert && (
          <ShieldAlert size={22} aria-hidden="true" className="mb-2 text-text-muted" />
        )}
        <AppMark app={page.app} />
        <h3 className={cn('text-[0.98rem] font-bold text-balance-pretty', page.app && 'mt-3')}>
          {page.title}
        </h3>
        {page.text && (
          <p className="mt-2 text-[0.82rem] text-text-muted text-balance-pretty">{page.text}</p>
        )}
        {page.rows && (
          <div className="-mx-3.5 mt-3 border-y border-border">
            <DetailRows rows={page.rows} />
          </div>
        )}
        <div className="mt-4 flex flex-wrap justify-end gap-1.5" data-testid="installer-actions">
          <PageLinks links={page.links} onNavigate={onNavigate} />
          {controls.map(renderControl)}
        </div>
      </div>
    </div>
  )
}

/** Settings > Apps > Special access > Install unknown apps > the source app. */
function SettingsPage({ page, controls, renderControl, onNavigate }) {
  return (
    <div className="bg-background py-2">
      <div className="bg-surface px-3.5 py-3">
        <AppMark app={page.app} />
      </div>
      {page.toggle && (
        <button
          type="button"
          role="switch"
          aria-checked="false"
          data-page-link={page.toggle.to}
          onClick={() => onNavigate(page.toggle.to)}
          className="mt-2 flex min-h-14 w-full items-center justify-between gap-3 bg-surface px-3.5 py-3 text-left hover:bg-secondary-soft"
        >
          <span className="text-[0.88rem] font-semibold">{page.toggle.label}</span>
          <span aria-hidden="true" className="flex h-6 w-11 shrink-0 items-center rounded-full bg-border-strong px-0.5">
            <span className="size-5 rounded-full bg-surface shadow-xs" />
          </span>
        </button>
      )}
      {page.text && (
        <p className="px-3.5 py-3 text-[0.78rem] text-text-muted text-balance-pretty">{page.text}</p>
      )}
      {(controls.length > 0 || (page.links ?? []).length > 0) && (
        <div className="flex flex-wrap gap-2 px-3.5 pb-3">
          <PageLinks links={page.links} onNavigate={onNavigate} />
          {controls.map(renderControl)}
        </div>
      )}
    </div>
  )
}

/** What a freshly installed app asks for as it starts. Shown only after the install. */
function PromptsPage({ page }) {
  return (
    <div className="space-y-2 bg-background px-3.5 py-3">
      <AppMark app={page.app} />
      {page.text && <p className="text-[0.82rem] text-balance-pretty">{page.text}</p>}
      <ul className="space-y-2">
        {(page.prompts ?? []).map((prompt) => (
          <li key={prompt.title} className="rounded-2xl border border-border bg-surface p-3.5">
            <p className="flex items-start gap-1.5 text-[0.84rem] font-semibold">
              <ChevronRight size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-text-muted" />
              {prompt.title}
            </p>
            {prompt.text && (
              <p className="mt-1 pl-5 text-[0.76rem] text-text-muted text-balance-pretty">{prompt.text}</p>
            )}
          </li>
        ))}
      </ul>
      {page.note && <p className="text-[0.74rem] text-text-muted text-balance-pretty">{page.note}</p>}
    </div>
  )
}

/**
 * A system share sheet (IMMERSIVE-003D): a preview of what is about to leave the phone, the
 * facts about it, and the choices - each of which is a scene control scoped to this page.
 *
 * Built for WhatsApp's live-location sheet, which is the same shape as any operating-system
 * share or permission sheet: a picture of the thing, who receives it, for how long, and the
 * buttons. The choices are ordinary scene affordances, so the one that shares and the one
 * that does not are drawn identically.
 */
function SheetPage({ page, controls, renderControl, onNavigate }) {
  return (
    <div className="bg-background pb-2">
      {page.art && (
        /**
         * A block wrapper, as the viewer uses: the tile centres itself, and inside a flex
         * row its `w-full` would resolve against a zero-width item and draw nothing.
         */
        <div className="bg-secondary-soft px-6 py-5">
          <AttachmentTile art={page.art} label={page.artLabel ?? page.title} />
        </div>
      )}
      <div className="bg-surface px-3.5 py-3">
        <h3 className="text-[0.95rem] font-bold text-balance-pretty">{page.title}</h3>
        {page.text && (
          <p className="mt-1 text-[0.8rem] text-text-muted text-balance-pretty">{page.text}</p>
        )}
      </div>
      {page.rows && (
        <div className="border-y border-border bg-surface">
          <DetailRows rows={page.rows} />
        </div>
      )}
      {page.optionsHeading && (
        <h4 className="px-3.5 pt-3 pb-1 text-[0.68rem] font-bold tracking-wide text-text-muted uppercase">
          {page.optionsHeading}
        </h4>
      )}
      <div className="flex flex-col gap-2 px-3.5 py-2" data-testid="system-sheet-actions">
        <PageLinks links={page.links} onNavigate={onNavigate} />
        {controls.map(renderControl)}
      </div>
      {page.note && (
        <p className="px-3.5 pt-1 text-[0.74rem] text-text-muted text-balance-pretty">{page.note}</p>
      )}
    </div>
  )
}

const PAGES = { dialog: DialogPage, settings: SettingsPage, prompts: PromptsPage, sheet: SheetPage }

/**
 * `closeLabel` and `inertNote` let the same system chrome carry a screen that is not the
 * package installer - a location permission prompt, a share sheet - without claiming to be
 * one (IMMERSIVE-003D). Both default to the installer's own words, so W14 is unchanged.
 */
export function InstallerSurface({ surface, page, nested, onBack, onNavigate, controls, renderControl }) {
  const pageId = page ?? surface.home
  const current = surface.pages[pageId] ?? surface.pages[surface.home]
  const Page = PAGES[current.style] ?? DialogPage

  return (
    <Screen
      key={pageId}
      title={current.screenTitle ?? surface.title}
      subtitle={current.breadcrumb ?? null}
      onBack={onBack}
      backLabel={nested ? 'Back to the previous screen' : (surface.closeLabel ?? 'Close the installer')}
      tone="light"
      footer={(
        <InertNote>
          {surface.inertNote ?? 'Simulated installer. Nothing can be installed or granted from here.'}
        </InertNote>
      )}
    >
      <Page
        page={current}
        controls={controls}
        renderControl={renderControl}
        onNavigate={onNavigate}
      />
    </Screen>
  )
}
