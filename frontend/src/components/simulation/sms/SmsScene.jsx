import { useMemo, useState } from 'react'
import { ArrowLeft, MoreVertical, Search, SendHorizontal, SquarePen } from 'lucide-react'
import { SceneControl } from '@/components/simulation/SceneControl'
import { SmsBeat, SpamBar } from '@/components/simulation/sms/SmsBubbles'
import { Modal } from '@/components/ui/Modal'
import { SLOT, affordancesIn, ambientFor, anchoredTo, beatsAt } from '@/simulation/sceneModel'
import { cn } from '@/utils/cn'

/**
 * The phone's Messages app, driven by a scene (IMMERSIVE-010).
 *
 * The counterpart of `WhatsAppScene`, `InstagramScene` and `EmailScene`, in the grammar a
 * native SMS app uses - and deliberately NOT the messenger's. A text app has:
 *
 * - **category tabs**, because the phone sorts texts into Personal, Transactions,
 *   Promotions and Spam, and which bucket a message landed in is itself evidence;
 * - **a header that is often just a number**, with no photo, no "last seen" and no
 *   profile behind it - only a conversation-details screen;
 * - **a spam bar** above a thread from a sender that is not in the contacts, carrying the
 *   app's own Block and Report controls;
 * - **link preview cards** the app builds from an address in the text, showing it exactly
 *   as written, so a shortener stays a shortener until the learner looks it up;
 * - **no delivery ticks, no reactions, no forwarding provenance and no avatars in the
 *   thread**, because SMS has none of those.
 *
 * There is no scoring, no stage and no notion of the wise choice in this component. It
 * only knows where each control belongs.
 */

/* ------------------------------------------------------------------ *
 * The conversation list
 * ------------------------------------------------------------------ */

/**
 * A sender's initial, or a `#` when the thread is with a bare number.
 *
 * Coloured by nothing: the same tint for a registered header and an unknown mobile, so
 * the list never sorts the senders for the learner.
 */
function ListAvatar({ title = '' }) {
  const letters = String(title).replace(/[^A-Za-z]/g, '')
  return (
    <span
      aria-hidden="true"
      className="grid size-10 shrink-0 place-items-center rounded-full bg-sms-tint text-[0.78rem] font-bold text-sms-accent"
    >
      {letters ? letters.slice(0, 2).toUpperCase() : '#'}
    </span>
  )
}

function ListRow({ row }) {
  return (
    <span className="flex w-full items-start gap-3 px-3 py-2.5 text-left">
      <ListAvatar title={row.from} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className={cn('truncate text-[0.86rem]', row.unread ? 'font-bold' : 'font-semibold text-text')}>
            {row.from}
          </span>
          <span className={cn('shrink-0 text-[0.66rem] tabular-nums', row.unread ? 'font-bold text-sms-accent' : 'text-sms-meta')}>
            {row.time}
          </span>
        </span>
        <span className="mt-0.5 flex items-center gap-1.5">
          <span className={cn('min-w-0 flex-1 truncate text-[0.78rem]', row.unread ? 'font-medium text-text' : 'text-sms-meta')}>
            {row.preview}
          </span>
          {row.unread && <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-sms-accent" />}
        </span>
      </span>
    </span>
  )
}

function MessageList({ scene, rowActions, busy, pendingAction, onSelect, onOpenThread }) {
  const list = scene.list
  const tabs = list.tabs ?? [{ id: 'all', label: 'All' }]
  const [tabId, setTabId] = useState(tabs[0].id)
  const tab = tabs.find((item) => item.id === tabId) ?? tabs[0]
  const rows = tab === tabs[0] ? list.rows : (tab.rows ?? [])
  /**
   * The row is the control that opens the conversation: the first inline control the list
   * stage offers (SECURITY-001 - found by position, because the device does not know what
   * any control means). `sceneModel.test.js` holds every scene to that order.
   */
  const openRow = rowActions[0] ?? null
  const extras = rowActions.filter((item) => item !== openRow)

  return (
    <div className="flex h-full min-h-0 flex-col bg-sms-surface" data-testid="sms-list">
      <div className="flex shrink-0 items-center gap-2 px-3 pt-2.5 pb-2">
        <p className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-sms-tint px-3 py-1.5 text-[0.76rem] text-sms-meta">
          <Search size={14} aria-hidden="true" className="shrink-0" />
          <span className="truncate">Search messages</span>
        </p>
        <ListAvatar title={list.accountName ?? 'You'} />
      </div>

      {/* The phone's own categories. Which bucket a text landed in is evidence in itself. */}
      <div role="tablist" aria-label="Message categories" className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-sms-border px-3 pb-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === tab.id}
            onClick={() => setTabId(item.id)}
            className={cn(
              'inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full border px-3 text-[0.74rem] font-semibold',
              item.id === tab.id
                ? 'border-sms-accent bg-sms-tint text-sms-accent'
                : 'border-sms-border text-sms-meta hover:bg-sms-tint',
            )}
          >
            {item.label}
            {item.count ? <span className="tabular-nums">{item.count}</span> : null}
          </button>
        ))}
      </div>

      <p className="shrink-0 px-3 pt-2 pb-1 text-[0.68rem] font-bold tracking-wide text-sms-meta uppercase">
        {tab.heading ?? tab.label}
      </p>

      <ul className="min-h-0 flex-1 divide-y divide-sms-border overflow-y-auto overscroll-contain" data-testid="sms-rows">
        {rows.length === 0 && (
          <li className="px-3 py-6 text-center text-[0.8rem] text-sms-meta">{tab.empty ?? 'Nothing here.'}</li>
        )}
        {rows.map((row) => (
          <li key={row.id}>
            {row.inert ? (
              <ListRow row={row} />
            ) : (
              <button
                type="button"
                disabled={busy && pendingAction !== openRow?.id}
                aria-busy={pendingAction === openRow?.id || undefined}
                data-control={openRow ? 'act' : 'nav'}
                aria-label={openRow ? openRow.label : `Open the conversation with ${row.from}`}
                onClick={() => (openRow ? onSelect(openRow) : onOpenThread())}
                className="w-full transition-colors duration-150 hover:bg-sms-tint disabled:opacity-55"
              >
                <ListRow row={row} />
              </button>
            )}
            {!row.inert && extras.length > 0 && (
              <div className="flex flex-wrap justify-end gap-2 bg-sms-tint px-3 py-1.5" data-testid="sms-row-actions">
                {extras.map((item) => (
                  <SceneControl
                    key={item.id}
                    affordance={item}
                    busy={busy}
                    pendingAction={pendingAction}
                    onSelect={onSelect}
                    variant="mail"
                  />
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      <div aria-hidden="true" className="flex shrink-0 justify-end border-t border-sms-border px-3 py-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sms-tint px-3 py-1.5 text-[0.74rem] font-semibold text-sms-accent">
          <SquarePen size={14} />
          Start chat
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * The composer
 * ------------------------------------------------------------------ */

/**
 * The text field, in two steps: choosing an authored reply puts that text into the field,
 * and Send submits it. Choosing is local; only Send reaches the engine, and no free text
 * can ever be typed into a conversation.
 */
function Composer({ drafts, busy, pendingAction, onSelect }) {
  const [draft, setDraft] = useState(null)
  const text = draft?.echo ?? draft?.label ?? null

  if (drafts.length === 0) {
    return (
      <div aria-hidden="true" className="flex shrink-0 items-center gap-2 border-t border-sms-border bg-sms-surface px-3 py-2">
        <span className="min-w-0 flex-1 rounded-full border border-sms-border px-3 py-2 text-[0.78rem] text-sms-meta">
          Text message
        </span>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sms-tint text-sms-meta">
          <SendHorizontal size={16} />
        </span>
      </div>
    )
  }

  return (
    <div className="shrink-0 border-t border-sms-border bg-sms-surface px-3 py-2" data-testid="sms-composer">
      <div className="flex flex-wrap gap-1.5 pb-2" data-testid="sms-drafts">
        {drafts.map((item) => {
          const chosen = draft?.id === item.id
          return (
            <button
              key={item.id}
              type="button"
              disabled={busy}
              aria-pressed={chosen}
              data-role="draft"
              onClick={() => setDraft(chosen ? null : item)}
              className={cn(
                'inline-flex min-h-11 items-center rounded-full border px-3.5 text-left text-[0.78rem] font-semibold',
                'transition-colors duration-150 disabled:opacity-55',
                chosen ? 'border-sms-accent bg-sms-tint text-sms-accent' : 'border-sms-border text-sms-accent hover:bg-sms-tint',
              )}
            >
              {item.label}
              <span className="sr-only"> - put this in the message</span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <p
          className={cn(
            'min-w-0 flex-1 rounded-full border border-sms-border px-3 py-2 text-[0.78rem] break-words',
            text ? 'text-text' : 'text-sms-meta',
          )}
          data-testid="sms-compose-body"
        >
          {text ?? 'Text message'}
        </p>
        {text ? (
          <button
            type="button"
            disabled={busy && pendingAction !== draft.id}
            aria-busy={pendingAction === draft.id || undefined}
            data-control="act"
            aria-label={`Send "${text}"`}
            onClick={() => { const chosen = draft; setDraft(null); onSelect(chosen) }}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-sms-accent text-white disabled:opacity-55"
          >
            <SendHorizontal size={16} aria-hidden="true" />
          </button>
        ) : (
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-sms-accent/40 text-white">
            <SendHorizontal size={16} />
          </span>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * The app
 * ------------------------------------------------------------------ */

export function SmsScene({
  scene, stage, busy = false, pendingAction = null, consequenceKind = null, onAct, onNavigate,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [browsingList, setBrowsingList] = useState(false)

  const listStage = scene.stages?.[stage]?.surface === 'list'
  const showList = listStage || browsingList

  const [lastStage, setLastStage] = useState(stage)
  if (lastStage !== stage) {
    setLastStage(stage)
    setBrowsingList(false)
    setMenuOpen(false)
  }

  const beats = useMemo(() => beatsAt(scene, stage, consequenceKind), [scene, stage, consequenceKind])

  const inline = affordancesIn(scene, stage, SLOT.INLINE)
  const composer = affordancesIn(scene, stage, SLOT.COMPOSER).filter((item) => !item.local)
  const menu = [...affordancesIn(scene, stage, SLOT.MENU), ...ambientFor(scene, stage)]
  const banner = inline.filter((item) => !item.anchor)
  const conversation = scene.conversation
  const headerAffordance = anchoredTo(inline, 'header')[0]
    ?? menu.find((item) => item.local && item.opens === conversation.detailsTo)
    ?? null
  const barControls = anchoredTo(inline, 'spam')

  const select = (affordance) => {
    setMenuOpen(false)
    if (affordance.local) {
      onNavigate?.(affordance.opens)
      return
    }
    onAct(affordance)
  }

  const renderControl = (affordance, variant = 'mail') => (
    <SceneControl
      key={affordance.id}
      affordance={affordance}
      busy={busy}
      pendingAction={pendingAction}
      onSelect={select}
      variant={variant}
    />
  )

  if (showList) {
    return (
      <div className="animate-screen-in flex h-full min-h-0 flex-col" data-testid="phone-app">
        <MessageList
          scene={scene}
          rowActions={listStage ? inline : []}
          busy={busy}
          pendingAction={pendingAction}
          onSelect={select}
          onOpenThread={() => setBrowsingList(false)}
        />
      </div>
    )
  }

  return (
    <div className="animate-screen-in flex h-full min-h-0 flex-col bg-sms-surface" data-testid="phone-app">
      {/* The thread header: a number or a sender ID, and nothing else. */}
      <div className="flex shrink-0 items-center gap-1 border-b border-sms-border px-1.5 py-1.5">
        <button
          type="button"
          onClick={() => setBrowsingList(true)}
          aria-label="Back to the message list"
          className="grid size-10 shrink-0 place-items-center rounded-full text-text hover:bg-sms-tint"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>

        {headerAffordance ? (
          <button
            type="button"
            disabled={busy && pendingAction !== headerAffordance.id}
            aria-busy={pendingAction === headerAffordance.id || undefined}
            data-control={headerAffordance.local ? 'nav' : 'act'}
            data-testid="sms-header"
            onClick={() => select(headerAffordance)}
            className="flex min-h-12 min-w-0 flex-1 items-center gap-2.5 rounded-md px-1.5 py-1 text-left hover:bg-sms-tint disabled:opacity-55"
          >
            <ListAvatar title={conversation.title} />
            <span className="min-w-0">
              <span className="block truncate text-[0.86rem] font-semibold">{conversation.title}</span>
              {conversation.subtitle && (
                <span className="block truncate text-[0.7rem] tabular-nums text-sms-meta">{conversation.subtitle}</span>
              )}
            </span>
            <span className="sr-only"> - conversation details</span>
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2.5 px-1.5 py-1" data-testid="sms-header">
            <ListAvatar title={conversation.title} />
            <span className="min-w-0">
              <span className="block truncate text-[0.86rem] font-semibold">{conversation.title}</span>
              {conversation.subtitle && (
                <span className="block truncate text-[0.7rem] tabular-nums text-sms-meta">{conversation.subtitle}</span>
              )}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="More options"
          aria-haspopup="dialog"
          className="grid size-10 shrink-0 place-items-center rounded-full text-text hover:bg-sms-tint"
        >
          <MoreVertical size={19} aria-hidden="true" />
        </button>
      </div>

      {/* The app's own bar above a sender that is not in the contacts. */}
      {conversation.spamBar && (
        <SpamBar text={conversation.spamBar} controls={barControls} renderControl={(item) => renderControl(item, 'banner')} />
      )}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-3" data-testid="sms-thread">
        {beats.map((beat) => (
          <SmsBeat
            key={beat.id}
            beat={beat}
            controls={anchoredTo(inline, beat.id)}
            renderControl={(affordance) => renderControl(affordance, 'mail')}
          />
        ))}
      </div>

      {banner.length > 0 && (
        <div className="flex shrink-0 flex-wrap gap-2 border-t border-sms-border bg-sms-surface px-2.5 py-2" data-testid="sms-action-banner">
          {banner.map((item) => renderControl(item, 'banner'))}
        </div>
      )}

      <Composer drafts={composer} busy={busy} pendingAction={pendingAction} onSelect={select} />

      <Modal
        open={menuOpen}
        contained
        title="Message options"
        description="Actions available here right now."
        onClose={() => setMenuOpen(false)}
      >
        <ul className="grid gap-2" data-testid="sms-menu">
          {menu.map((item) => (
            <li key={item.id}>{renderControl(item, 'menu')}</li>
          ))}
          {menu.length === 0 && (
            <li className="text-sm text-text-muted">Nothing further is available here.</li>
          )}
        </ul>
      </Modal>
    </div>
  )
}
