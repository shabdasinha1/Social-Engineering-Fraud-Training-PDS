import { useState } from 'react'
import { ChevronRight, Settings2, ShieldCheck, Users } from 'lucide-react'
import { Avatar } from '@/components/simulation/whatsapp/ChatBlocks'
import { DetailRows, InertNote, Screen } from '@/components/simulation/surfaces/SurfaceFrame'
import { SURFACE } from '@/simulation/sceneModel'
import { cn } from '@/utils/cn'

/**
 * Contact info, group info and in-app settings (IMMERSIVE-003A, rebuilt by R2).
 *
 * The screen that carries most of the evidence in this batch, which is why R2 gave it
 * tabs. A details sheet that lists every fact at once hands the learner the answer;
 * a sheet where "Groups in common" is a tab you have to open makes the emptiness
 * something they went and found. Switching tabs is local and submits nothing - the single
 * scored event was the inspection that opened the sheet.
 *
 * Nothing on this screen is styled by risk. An empty group list and a full one get the
 * same treatment, because the comparison is the learner's to make.
 */
function ItemRow({ item, onNavigate }) {
  const body = (
    <>
      <Avatar seed={item.avatarSeed ?? item.label} size="sm" group={item.group} tone="light" />
      <span className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-1.5">
          <span className="min-w-0 truncate text-[0.82rem] font-semibold">{item.label}</span>
          {item.badge && (
            <span className="shrink-0 rounded-full border border-border px-1.5 py-px text-[0.6rem] font-semibold text-text-muted">
              {item.badge}
            </span>
          )}
        </span>
        <span className="block truncate text-[0.72rem] text-text-muted">{item.value}</span>
      </span>
      {item.to && <ChevronRight size={15} aria-hidden="true" className="shrink-0 text-text-muted" />}
    </>
  )

  if (!item.to) {
    return <li className="flex items-center gap-2.5 px-3.5 py-2">{body}</li>
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => onNavigate?.(item.to)}
        className="flex min-h-12 w-full items-center gap-2.5 px-3.5 py-2 hover:bg-secondary-soft"
      >
        {body}
      </button>
    </li>
  )
}

function DetailItems({ items = [], empty, onNavigate }) {
  if (!items.length) {
    return <p className="px-3.5 py-3 text-[0.8rem] text-text-muted">{empty}</p>
  }
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <ItemRow key={item.label} item={item} onNavigate={onNavigate} />
      ))}
    </ul>
  )
}

/**
 * A sample of how somebody actually writes.
 *
 * W04's stage 3 asks the learner to compare writing style, which is impossible unless
 * there is something to compare against. This block puts the saved contact's own recent
 * messages on her contact sheet, in the shape a message history takes.
 */
function MessageSample({ messages = [] }) {
  return (
    <ul className="space-y-1.5 px-3.5 py-2">
      {messages.map((message) => (
        <li
          key={`${message.time}-${message.text}`}
          className={cn('flex', message.from === 'me' ? 'justify-end' : 'justify-start')}
        >
          <span
            className={cn(
              'max-w-[85%] rounded-lg px-2.5 py-1.5 text-[0.78rem] leading-snug',
              message.from === 'me' ? 'bg-wa-bubble-out' : 'bg-secondary-soft',
            )}
          >
            {message.text}
            <span className="ml-2 text-[0.62rem] whitespace-nowrap text-text-muted">
              {message.time}
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}

function Section({ section, onNavigate }) {
  return (
    <section className="bg-surface py-1">
      {section.heading && (
        <h4 className="px-3.5 pt-1.5 pb-1 text-[0.68rem] font-bold tracking-wide text-text-muted uppercase">
          {section.heading}
        </h4>
      )}
      {section.rows && <DetailRows rows={section.rows} />}
      {section.messages && <MessageSample messages={section.messages} />}
      {(section.items || section.empty) && (
        <DetailItems items={section.items} empty={section.empty} onNavigate={onNavigate} />
      )}
      {section.note && (
        <p className="px-3.5 pt-1 pb-2 text-[0.72rem] text-text-muted text-balance-pretty">
          {section.note}
        </p>
      )}
      {section.link && (
        <div className="px-3.5 pt-1 pb-2">
          <button
            type="button"
            onClick={() => onNavigate?.(section.link.to)}
            className="inline-flex min-h-11 items-center gap-1 rounded-md px-1 text-[0.8rem] font-semibold text-primary hover:underline"
          >
            {section.link.label}
            <ChevronRight size={15} aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  )
}

export function DetailSurface({ surface, onBack, onNavigate, controls, renderControl }) {
  const isGroup = surface.kind === SURFACE.GROUP
  const isSettings = surface.kind === SURFACE.SETTINGS
  const tabs = surface.tabs ?? null
  const [tab, setTab] = useState(0)
  const sections = tabs ? (tabs[tab]?.sections ?? []) : (surface.sections ?? [])

  return (
    <Screen
      title={surface.title}
      subtitle={isSettings ? surface.breadcrumb : null}
      onBack={onBack}
      backLabel={`Back from ${surface.title}`}
      tone="wa"
      footer={<InertNote>Simulated details. Nothing here is a live account.</InertNote>}
    >
      {!isSettings && (
        <header className="flex flex-col items-center gap-2 border-b border-border bg-surface px-4 py-5 text-center">
          <span className="grid size-20 place-items-center rounded-full bg-secondary-soft">
            {isGroup
              ? <Users size={34} aria-hidden="true" className="text-channel-whatsapp" />
              : <Avatar seed={surface.avatarSeed} title={surface.name} size="xl" tone="light" />}
          </span>
          <div>
            <h3 className="text-base font-bold text-balance-pretty">{surface.name}</h3>
            <p className="text-sm text-text-muted tabular-nums">{surface.identifier}</p>
          </div>
          {surface.statusLine && (
            <p className="rounded-full bg-secondary-soft px-3 py-1 text-[0.72rem] font-medium text-text-muted">
              {surface.statusLine}
            </p>
          )}
          {surface.badges?.length > 0 && (
            <ul className="flex flex-wrap justify-center gap-1.5">
              {surface.badges.map((badge) => (
                <li
                  key={badge}
                  className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[0.66rem] font-semibold text-text-muted"
                >
                  <ShieldCheck size={11} aria-hidden="true" />
                  {badge}
                </li>
              ))}
            </ul>
          )}
        </header>
      )}

      {isSettings && surface.appLabel && (
        <p className="flex items-center gap-2 border-b border-border bg-surface px-3.5 py-3 text-[0.8rem] font-semibold">
          <Settings2 size={16} aria-hidden="true" className="text-text-muted" />
          {surface.appLabel}
        </p>
      )}

      {tabs && (
        <div
          role="tablist"
          aria-label={`${surface.name} details`}
          className="sticky top-0 z-10 flex shrink-0 border-b border-border bg-surface"
        >
          {tabs.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`detail-tab-${item.id}`}
              aria-selected={tab === index}
              aria-controls={`detail-panel-${item.id}`}
              onClick={() => setTab(index)}
              className={cn(
                'min-h-11 flex-1 border-b-[3px] px-2 text-[0.74rem] font-semibold',
                tab === index
                  ? 'border-channel-whatsapp text-channel-whatsapp'
                  : 'border-transparent text-text-muted hover:bg-secondary-soft',
              )}
            >
              {item.label}
              {typeof item.count === 'number' && (
                <span className="ml-1 tabular-nums opacity-70">{item.count}</span>
              )}
            </button>
          ))}
        </div>
      )}

      <div
        className="space-y-2 py-2"
        role={tabs ? 'tabpanel' : undefined}
        id={tabs ? `detail-panel-${tabs[tab]?.id}` : undefined}
        aria-labelledby={tabs ? `detail-tab-${tabs[tab]?.id}` : undefined}
      >
        {sections.map((section) => (
          <Section key={section.id} section={section} onNavigate={onNavigate} />
        ))}
      </div>

      {controls.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border bg-surface px-3.5 py-3">
          {controls.map(renderControl)}
        </div>
      )}
    </Screen>
  )
}
