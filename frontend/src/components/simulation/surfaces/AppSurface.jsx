import { CircleUser, Home, Receipt, ShieldCheck, Wallet } from 'lucide-react'
import { DetailRows, InertNote, Screen } from '@/components/simulation/surfaces/SurfaceFrame'
import { cn } from '@/utils/cn'

/**
 * Another application on the same device (IMMERSIVE-003A-R2).
 *
 * W05's verification route is "open the known banking app directly", and for that to teach
 * anything the app has to be visibly a *different piece of software* - its own colour, its
 * own header, its own tab bar - rather than one more sheet wearing the messenger's chrome.
 * The whole point the learner is meant to reach is that the real thing looks nothing like
 * the page they were sent to, and they cannot reach it if both look the same.
 *
 * Everything here is a description. There is no account, no session, no network, no
 * balance that changes and nothing that can be tapped to move money.
 */

const TAB_ICONS = { home: Home, wallet: Wallet, history: Receipt, profile: CircleUser }

export function AppSurface({ surface, onBack, controls, renderControl }) {
  return (
    <Screen
      title={surface.appName}
      subtitle={surface.appTagline}
      onBack={onBack}
      backLabel={`Leave ${surface.appName}`}
      tone="wallet"
      animation="animate-app-in"
      footer={<InertNote>Simulated application. Nothing here is a live account.</InertNote>}
    >
      {/*
        A full-height column so the tab bar sits at the foot of the screen, as an app's
        does, instead of directly under a short page with blank screen beneath it.
      */}
      <div className="flex min-h-full flex-col">
        {/* The app's own summary card - the thing the learner came here to read. */}
        {surface.hero && (
          <div className="bg-app-wallet px-4 pt-1 pb-5 text-white">
            <p className="text-[0.7rem] font-semibold tracking-wide text-white/70 uppercase">
              {surface.hero.label}
            </p>
            <p className="mt-0.5 text-xl font-bold">{surface.hero.value}</p>
            {surface.hero.caption && (
              <p className="mt-1 text-[0.76rem] text-white/80 text-balance-pretty">
                {surface.hero.caption}
              </p>
            )}
            {surface.hero.chips?.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {surface.hero.chips.map((chip) => (
                  <li
                    key={chip}
                    className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[0.68rem] font-semibold"
                  >
                    <ShieldCheck size={11} aria-hidden="true" />
                    {chip}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex-1 space-y-2 bg-app-wallet-soft py-2">
          {(surface.sections ?? []).map((section) => (
            <section key={section.id} className="bg-surface py-1">
              <h4 className="px-3.5 pt-1.5 pb-1 text-[0.68rem] font-bold tracking-wide text-text-muted uppercase">
                {section.heading}
              </h4>
              {section.rows && <DetailRows rows={section.rows} />}
              {section.note && (
                <p className="px-3.5 pt-1 pb-2 text-[0.72rem] text-text-muted text-balance-pretty">
                  {section.note}
                </p>
              )}
            </section>
          ))}

          {controls.length > 0 && (
            <div className="flex flex-wrap gap-2 bg-surface px-3.5 py-3">
              {controls.map(renderControl)}
            </div>
          )}
        </div>

        {/* The app's tab bar. Presentational: this simulation has one screen of this app. */}
        {surface.tabs?.length > 0 && (
          <nav
            aria-hidden="true"
            className="sticky bottom-0 flex shrink-0 items-stretch border-t border-border bg-surface"
          >
            {surface.tabs.map((tab, index) => {
              const Icon = TAB_ICONS[tab.icon] ?? Home
              return (
                <span
                  key={tab.label}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.62rem] font-semibold',
                    index === 0 ? 'text-app-wallet' : 'text-text-muted',
                  )}
                >
                  <Icon size={17} />
                  {tab.label}
                </span>
              )
            })}
          </nav>
        )}
      </div>
    </Screen>
  )
}
