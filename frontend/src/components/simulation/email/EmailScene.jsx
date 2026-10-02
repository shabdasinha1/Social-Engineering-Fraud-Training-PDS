import { useMemo, useState } from 'react'
import {
  Archive, ArrowLeft, ChevronDown, CornerUpLeft, Forward, MailOpen, Menu, MoreVertical,
  Paperclip, Search, Star, Trash2,
} from 'lucide-react'
import { SceneControl } from '@/components/simulation/SceneControl'
import { EarlierMessage, MailAvatar, MailBeat } from '@/components/simulation/email/MailBlocks'
import { Modal } from '@/components/ui/Modal'
import { SLOT, affordancesIn, ambientFor, anchoredTo, beatsAt } from '@/simulation/sceneModel'
import { cn } from '@/utils/cn'

/**
 * The mail app, driven by a scene (IMMERSIVE-005).
 *
 * The counterpart of `WhatsAppScene` and `InstagramScene`, in the grammar a mail client uses:
 * a mailbox with folders, a message opened from its row, a sender line that expands into the
 * message details, a body with the sender's own buttons and attachments, quoted history
 * behind a toggle, an overflow menu, and Reply / Forward sheets with a To line. Every scored
 * action is the control a person would actually use; opening folders, older messages,
 * quoted text or the details is local navigation and records nothing.
 *
 * There is no scoring, no stage and no notion of the wise choice in this component. It only
 * knows where each control belongs.
 */

/* ------------------------------------------------------------------ *
 * The mailbox
 * ------------------------------------------------------------------ */

function MailRow({ row }) {
  return (
    <span className="flex w-full items-start gap-3 px-3 py-2.5 text-left">
      <MailAvatar seed={row.from} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className={cn('truncate text-[0.84rem]', row.unread ? 'font-bold' : 'font-medium text-text')}>
            {row.from}
          </span>
          <span className={cn('shrink-0 text-[0.66rem]', row.unread ? 'font-bold text-mail-accent' : 'text-mail-meta')}>
            {row.time}
          </span>
        </span>
        <span className={cn('block truncate text-[0.78rem]', row.unread ? 'font-semibold text-text' : 'text-text')}>
          {row.subject}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="min-w-0 flex-1 truncate text-[0.74rem] text-mail-meta">{row.preview}</span>
          {row.attachment && <Paperclip size={12} aria-label="Has attachment" className="shrink-0 text-mail-meta" />}
          {row.tag && (
            <span className="shrink-0 rounded border border-mail-border px-1 text-[0.6rem] font-semibold text-mail-meta">
              {row.tag}
            </span>
          )}
        </span>
      </span>
      <Star size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-mail-border" />
    </span>
  )
}

function Mailbox({ scene, rowActions, busy, pendingAction, onSelect, onOpenMessage }) {
  const list = scene.list
  const folders = list.folders ?? [{ id: 'inbox', label: 'Inbox' }]
  const [folderId, setFolderId] = useState(folders[0].id)
  const folder = folders.find((item) => item.id === folderId) ?? folders[0]
  const rows = folder === folders[0] ? list.rows : (folder.rows ?? [])
  /**
   * The row is the control that opens the message: the first inline control the list stage
   * offers (SECURITY-001 - found by position, because the device does not know what any
   * control means). `sceneModel.test.js` holds every scene to that order.
   */
  const openRow = rowActions[0] ?? null
  const extras = rowActions.filter((item) => item !== openRow)

  return (
    <div className="flex h-full min-h-0 flex-col bg-mail-surface" data-testid="mail-list">
      <div className="flex shrink-0 items-center gap-2 px-3 pt-2.5 pb-2">
        <Menu size={18} aria-hidden="true" className="shrink-0 text-mail-meta" />
        <p className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-mail-tint px-3 py-1.5 text-[0.76rem] text-mail-meta">
          <Search size={14} aria-hidden="true" className="shrink-0" />
          <span className="truncate">Search in mail</span>
        </p>
        <MailAvatar seed={list.accountName ?? list.account} size="sm" />
      </div>

      <div role="tablist" aria-label="Folders" className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-mail-border px-3 pb-2">
        {folders.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === folder.id}
            onClick={() => setFolderId(item.id)}
            className={cn(
              'inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full border px-3 text-[0.74rem] font-semibold',
              item.id === folder.id
                ? 'border-mail-accent bg-mail-tint text-mail-accent'
                : 'border-mail-border text-mail-meta hover:bg-mail-tint',
            )}
          >
            {item.label}
            {item.count ? <span className="tabular-nums">{item.count}</span> : null}
          </button>
        ))}
      </div>

      <p className="shrink-0 px-3 pt-2 pb-1 text-[0.68rem] font-bold tracking-wide text-mail-meta uppercase">
        {folder.heading ?? folder.label}
      </p>

      <ul className="min-h-0 flex-1 divide-y divide-mail-border overflow-y-auto overscroll-contain" data-testid="mail-rows">
        {rows.length === 0 && (
          <li className="px-3 py-6 text-center text-[0.8rem] text-mail-meta">{folder.empty ?? 'Nothing in this folder.'}</li>
        )}
        {rows.map((row) => (
          <li key={row.id}>
            {row.inert ? (
              <MailRow row={row} />
            ) : (
              <button
                type="button"
                disabled={busy && pendingAction !== openRow?.id}
                aria-busy={pendingAction === openRow?.id || undefined}
                data-control={openRow ? 'act' : 'nav'}
                aria-label={openRow ? openRow.label : `Open ${row.subject}`}
                onClick={() => (openRow ? onSelect(openRow) : onOpenMessage())}
                className="w-full transition-colors duration-150 hover:bg-mail-tint disabled:opacity-55"
              >
                <MailRow row={row} />
              </button>
            )}
            {!row.inert && extras.length > 0 && (
              <div className="flex flex-wrap justify-end gap-2 bg-mail-tint px-3 py-1.5" data-testid="mail-row-actions">
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
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * The open message
 * ------------------------------------------------------------------ */

function SenderLine({ conversation, affordance, busy, pendingAction, onSelect }) {
  const body = (
    <>
      <MailAvatar seed={conversation.fromName} />
      <span className="min-w-0 flex-1 text-left">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[0.86rem] font-semibold">{conversation.fromName}</span>
          <span className="shrink-0 text-[0.66rem] text-mail-meta">{conversation.time}</span>
        </span>
        <span className="flex items-center gap-0.5 text-[0.72rem] text-mail-meta">
          <span className="truncate">{conversation.toLine ?? 'to me'}</span>
          <ChevronDown size={13} aria-hidden="true" className="shrink-0" />
        </span>
      </span>
    </>
  )
  if (!affordance) {
    return <div className="flex items-center gap-2.5 px-3 py-2" data-testid="mail-sender">{body}</div>
  }
  return (
    <button
      type="button"
      disabled={busy && pendingAction !== affordance.id}
      aria-busy={pendingAction === affordance.id || undefined}
      data-control={affordance.local ? 'nav' : 'act'}
      data-testid="mail-sender"
      onClick={() => onSelect(affordance)}
      className="flex min-h-12 w-full items-center gap-2.5 px-3 py-2 hover:bg-mail-tint disabled:opacity-55"
    >
      {body}
      <span className="sr-only"> - show message details</span>
    </button>
  )
}

/**
 * Reply and Forward, the way a mail app does them: a sheet with From, To and Subject lines,
 * the authored message choices, a message field that fills when one is chosen, and Send.
 * Choosing is local; only Send reaches the engine.
 */
function ComposeSheet({
  mode, conversation, account, drafts, busy, pendingAction, onSelect, onClose,
}) {
  const [draft, setDraft] = useState(null)
  const open = Boolean(mode)
  const text = draft?.echo ?? draft?.label ?? null
  const to = draft?.compose?.to ?? drafts[0]?.compose?.to ?? ''
  const prefix = mode === 'forward' ? 'Fwd: ' : 'Re: '

  return (
    <Modal
      open={open}
      contained
      title={mode === 'forward' ? 'Forward' : 'Reply'}
      description="Choose what to write, then send."
      onClose={() => { setDraft(null); onClose() }}
    >
      <dl className="divide-y divide-mail-border rounded-md border border-mail-border text-[0.78rem]" data-testid="mail-compose-head">
        <div className="flex gap-2 px-3 py-1.5"><dt className="w-14 shrink-0 text-mail-meta">From</dt><dd className="min-w-0 break-all">{account}</dd></div>
        <div className="flex gap-2 px-3 py-1.5"><dt className="w-14 shrink-0 text-mail-meta">To</dt><dd className="min-w-0 break-all font-semibold">{to}</dd></div>
        <div className="flex gap-2 px-3 py-1.5"><dt className="w-14 shrink-0 text-mail-meta">Subject</dt><dd className="min-w-0 break-words">{prefix}{conversation.subject}</dd></div>
      </dl>

      <div className="mt-3 flex flex-wrap gap-2" data-testid="mail-drafts">
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
                chosen ? 'border-mail-accent bg-mail-tint text-mail-accent' : 'border-mail-border text-mail-accent hover:bg-mail-tint',
              )}
            >
              {item.label}
              <span className="sr-only"> - put this in the message</span>
            </button>
          )
        })}
      </div>

      <p
        className={cn('mt-3 min-h-16 rounded-md border border-mail-border px-3 py-2 text-[0.82rem] break-words', text ? 'text-text' : 'text-mail-meta')}
        data-testid="mail-compose-body"
      >
        {text ?? 'Choose a message above'}
      </p>

      {/* IMMERSIVE-006: a draft may carry a synthetic attachment chip (E06's roster). Drawn only. */}
      {draft?.compose?.attachment && (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-mail-border px-2.5 py-1 text-[0.74rem] font-semibold text-mail-meta" data-testid="mail-compose-attachment">
          <Paperclip size={13} aria-hidden="true" className="shrink-0" />
          {draft.compose.attachment}
        </p>
      )}

      <div className="mt-3 flex justify-end">
        {text ? (
          <button
            type="button"
            disabled={busy && pendingAction !== draft.id}
            aria-busy={pendingAction === draft.id || undefined}
            data-control="act"
            aria-label={`Send "${text}"`}
            onClick={() => { const chosen = draft; setDraft(null); onClose(); onSelect(chosen) }}
            className="inline-flex min-h-11 items-center rounded-full bg-mail-accent px-5 text-sm font-semibold text-white disabled:opacity-55"
          >
            Send
          </button>
        ) : (
          <span aria-hidden="true" className="inline-flex min-h-11 items-center rounded-full bg-mail-accent/40 px-5 text-sm font-semibold text-white">
            Send
          </span>
        )}
      </div>
    </Modal>
  )
}

export function EmailScene({
  scene, stage, busy = false, pendingAction = null, consequenceKind = null, onAct, onNavigate,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [browsingList, setBrowsingList] = useState(false)
  const [composeMode, setComposeMode] = useState(null)

  const listStage = scene.stages?.[stage]?.surface === 'list'
  const showList = listStage || browsingList

  const [lastStage, setLastStage] = useState(stage)
  if (lastStage !== stage) {
    setLastStage(stage)
    setBrowsingList(false)
    setMenuOpen(false)
    setComposeMode(null)
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
  const draftsFor = (mode) => composer.filter((item) => (item.compose?.mode ?? 'reply') === mode)

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
        <Mailbox
          scene={scene}
          rowActions={listStage ? inline : []}
          busy={busy}
          pendingAction={pendingAction}
          onSelect={select}
          onOpenMessage={() => setBrowsingList(false)}
        />
      </div>
    )
  }

  const earlier = beats.filter((beat) => beat.kind === 'earlier')
  const current = beats.filter((beat) => beat.kind !== 'earlier')

  const toolButton = (mode, Icon, text) => {
    const drafts = draftsFor(mode)
    if (drafts.length === 0) {
      return (
        <span aria-hidden="true" className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-mail-border text-[0.8rem] font-semibold text-mail-meta/60">
          <Icon size={15} />
          {text}
        </span>
      )
    }
    return (
      <button
        type="button"
        onClick={() => setComposeMode(mode)}
        aria-haspopup="dialog"
        className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-mail-border text-[0.8rem] font-semibold text-mail-accent hover:bg-mail-tint"
      >
        <Icon size={15} aria-hidden="true" />
        {text}
      </button>
    )
  }

  return (
    <div className="animate-screen-in flex h-full min-h-0 flex-col bg-mail-surface" data-testid="phone-app">
      <div className="flex shrink-0 items-center gap-1 border-b border-mail-border px-1.5 py-1.5">
        <button
          type="button"
          onClick={() => setBrowsingList(true)}
          aria-label="Back to the mailbox"
          className="grid size-10 shrink-0 place-items-center rounded-full text-text hover:bg-mail-tint"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <span className="flex-1" />
        <span aria-hidden="true" className="flex items-center gap-4 px-2 text-mail-meta">
          <Archive size={17} />
          <Trash2 size={17} />
          <MailOpen size={17} />
        </span>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="More options"
          aria-haspopup="dialog"
          className="grid size-10 shrink-0 place-items-center rounded-full text-text hover:bg-mail-tint"
        >
          <MoreVertical size={19} aria-hidden="true" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4" data-testid="mail-thread">
        <div className="px-4 pt-3 pb-1">
          <h2 className="text-[1.02rem] leading-snug font-semibold text-balance-pretty break-words">{conversation.subject}</h2>
          {conversation.labels?.length > 0 && (
            <p className="mt-1 flex flex-wrap gap-1">
              {conversation.labels.map((label) => (
                <span key={label} className="rounded bg-mail-tint px-1.5 py-0.5 text-[0.62rem] font-semibold text-mail-meta">
                  {label}
                </span>
              ))}
            </p>
          )}
        </div>

        {earlier.map((beat) => <EarlierMessage key={beat.id} beat={beat} />)}

        <SenderLine
          conversation={conversation}
          affordance={headerAffordance}
          busy={busy}
          pendingAction={pendingAction}
          onSelect={select}
        />

        {current.map((beat) => (
          <div key={beat.id} data-beat={beat.id}>
            <MailBeat
              beat={beat}
              controls={anchoredTo(inline, beat.id)}
              renderControl={(affordance) => renderControl(affordance, beat.kind === 'button' ? 'cta' : 'mail')}
            />
          </div>
        ))}
      </div>

      {banner.length > 0 && (
        <div className="flex shrink-0 flex-wrap gap-2 border-t border-mail-border bg-mail-surface px-2.5 py-2" data-testid="mail-action-banner">
          {banner.map((item) => renderControl(item, 'banner'))}
        </div>
      )}

      <div className="flex shrink-0 gap-2 border-t border-mail-border bg-mail-surface px-3 py-2" data-testid="mail-reply-bar">
        {toolButton('reply', CornerUpLeft, 'Reply')}
        {toolButton('forward', Forward, 'Forward')}
      </div>

      <ComposeSheet
        mode={composeMode}
        conversation={conversation}
        account={scene.list?.account}
        drafts={composeMode ? draftsFor(composeMode) : []}
        busy={busy}
        pendingAction={pendingAction}
        onSelect={select}
        onClose={() => setComposeMode(null)}
      />

      <Modal
        open={menuOpen}
        contained
        title="Message options"
        description="Actions available here right now."
        onClose={() => setMenuOpen(false)}
      >
        <ul className="grid gap-2" data-testid="mail-menu">
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
