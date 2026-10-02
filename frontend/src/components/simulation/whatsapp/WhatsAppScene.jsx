import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, Camera, CheckCheck, MessageSquarePlus, MoreVertical, Paperclip,
  Phone, Pin, Plus, Search, Send, Smile, Video, VolumeX,
} from 'lucide-react'
import { SceneControl } from '@/components/simulation/SceneControl'
import { Avatar, ChatBeat } from '@/components/simulation/whatsapp/ChatBlocks'
import { Modal } from '@/components/ui/Modal'
import {
  SLOT, affordancesIn, ambientFor, anchoredTo, beatsAt,
} from '@/simulation/sceneModel'
import { groupBeats } from '@/simulation/threadLayout'
import { cn } from '@/utils/cn'

/**
 * The WhatsApp app, driven by a scene (IMMERSIVE-003A, rebuilt by R2).
 *
 * This is where the client's objection is answered. The learner is not shown a question
 * and four buttons; they are shown a chat list with an unread conversation among other
 * ordinary ones, and every scored action is the app control you would actually use to
 * take it - tapping the conversation to read it, tapping the header to see who is
 * writing, tapping a poll option, opening a payment request, choosing something from the
 * overflow sheet, or using the Report and Block banner the app puts under a chat from a
 * number you do not know.
 *
 * What has NOT changed is who decides anything. Every control below calls `onAct` with a
 * scene affordance, `onAct` submits that affordance's INTENT through the same controller
 * the action sheet has always used, and the engine answers with the stage, the event and
 * the score. This component has no stage of its own, no scoring, and no idea which
 * control is the wise one - it only knows where each control belongs.
 *
 * The composer deserves its own note, because R2 changed it. It is now two steps: choosing
 * an authored reply puts that text into the message field, and pressing Send submits it.
 * That is deliberate on both counts. It gives the learner the experience of replying to a
 * person, which a row of buttons does not; and it is still entirely authored, so the
 * conversation stays deterministic, no free text can ever be typed into a chat, and there
 * is no model anywhere near it.
 */

/* ------------------------------------------------------------------ *
 * Chat list
 * ------------------------------------------------------------------ */

const TABS = ['Chats', 'Updates', 'Calls']

function ListRow({ row, children }) {
  return (
    <div className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
      <Avatar seed={row.avatarSeed ?? row.title} title={row.title} size="lg" group={row.group} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[0.88rem] font-semibold">{row.title}</span>
          {row.time && (
            <span
              className={cn(
                'shrink-0 text-[0.66rem] tabular-nums',
                row.unread ? 'font-bold text-channel-whatsapp' : 'text-wa-meta',
              )}
            >
              {row.time}
            </span>
          )}
        </span>
        <span className="mt-0.5 flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1 text-[0.76rem] text-wa-meta">
            {row.outgoing && (
              <CheckCheck size={13} aria-hidden="true" className="shrink-0 text-wa-tick" />
            )}
            <span className="truncate">{row.preview}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            {row.muted && <VolumeX size={13} aria-hidden="true" className="text-wa-meta" />}
            {row.unread > 0 && (
              <span className="grid min-w-5 place-items-center rounded-full bg-channel-whatsapp px-1.5 py-0.5 text-[0.62rem] font-bold text-white tabular-nums">
                {row.unread}
                <span className="sr-only"> unread messages</span>
              </span>
            )}
          </span>
        </span>
        {children}
      </span>
    </div>
  )
}

function ChatList({ scene, rowActions, busy, pendingAction, onSelect, onOpenThread, onPeek }) {
  /**
   * The row is the control that opens the conversation: the first inline control the list
   * stage offers (SECURITY-001 - found by position, because the device no longer knows
   * what any control means). `sceneModel.test.js` holds every scene to that order.
   */
  const openRow = rowActions[0] ?? null
  const extras = rowActions.filter((item) => item !== openRow)
  const rows = scene.list.rows

  return (
    <div className="flex h-full min-h-0 flex-col bg-wa-panel" data-testid="wa-chat-list">
      <div className="shrink-0 bg-wa-header text-white">
        <div className="flex items-center gap-2.5 px-3 pt-2 pb-1.5">
          <p className="min-w-0 flex-1 truncate text-lg font-bold">{scene.list.title}</p>
          <span aria-hidden="true" className="flex items-center gap-4 text-white/85">
            <Camera size={17} />
            <Search size={17} />
            <MoreVertical size={17} />
          </span>
        </div>
        <div aria-hidden="true" className="flex gap-5 px-4">
          {TABS.map((tab, index) => (
            <span
              key={tab}
              className={cn(
                'border-b-[3px] pb-1.5 text-[0.72rem] font-semibold tracking-wide uppercase',
                index === 0 ? 'border-white text-white' : 'border-transparent text-white/60',
              )}
            >
              {tab}
            </span>
          ))}
        </div>
      </div>

      {/* Search. A display element, not a field: the device holds no free-text input. */}
      <div aria-hidden="true" className="shrink-0 px-3 py-2">
        <span className="flex items-center gap-2 rounded-full bg-wa-search px-3 py-2 text-[0.76rem] text-wa-meta">
          <Search size={14} className="shrink-0" />
          Ask Meta AI or Search
        </span>
      </div>

      <ul className="min-h-0 flex-1 divide-y divide-wa-divider overflow-y-auto overscroll-contain">
        {rows.map((row) => (
          <li key={row.id}>
            {row.inert && row.opens ? (
              /**
               * Another chat the learner can look into (IMMERSIVE-003D). It opens a local
               * screen the scene declares - what that conversation holds - and submits
               * nothing: reading a different chat is not a decision about this one.
               */
              <button
                type="button"
                data-control="nav"
                aria-label={`Open ${row.title}`}
                onClick={() => onPeek?.(row.opens)}
                className="w-full transition-colors duration-150 hover:bg-wa-search"
              >
                <ListRow row={row} />
              </button>
            ) : row.inert ? (
              /**
               * Ordinary background traffic. Rendered as content rather than as a control,
               * because a button that leads nowhere is worse than a row that is plainly a
               * row - and the exercise is about the conversation that was delivered.
               */
              <ListRow row={row} />
            ) : (
              <button
                type="button"
                disabled={busy && pendingAction !== openRow?.id}
                aria-busy={pendingAction === openRow?.id || undefined}
                data-control={openRow ? 'act' : 'nav'}
                /**
                 * The row IS the control that opens the conversation, so it carries the
                 * affordance's own name rather than the preview text a sighted learner
                 * reads. Without it the accessible name would be the scenario's message.
                 */
                aria-label={openRow ? openRow.label : `Open ${row.title}`}
                onClick={() => (openRow ? onSelect(openRow) : onOpenThread())}
                className="w-full transition-colors duration-150 hover:bg-wa-search disabled:opacity-55"
              >
                <ListRow row={row} />
              </button>
            )}

            {row.inert !== true && extras.length > 0 && (
              /**
               * The quick actions a long press reveals on a row. Kept visually quiet: they
               * belong to the row above them, and a full-width control here would make the
               * delivered conversation shout louder than the ordinary ones around it.
               */
              <div className="flex flex-wrap justify-end gap-2 border-t border-wa-divider bg-wa-search px-3 py-1.5">
                {extras.map((item) => (
                  <SceneControl
                    key={item.id}
                    affordance={item}
                    busy={busy}
                    pendingAction={pendingAction}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="relative shrink-0 border-t border-wa-divider">
        <p className="py-2 text-center text-[0.7rem] text-text-muted">
          Archived ({scene.list.archived ?? 0})
        </p>
        <span
          aria-hidden="true"
          className="absolute -top-12 right-4 grid size-12 place-items-center rounded-2xl bg-wa-accent text-white shadow-md"
        >
          <MessageSquarePlus size={20} />
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * The app
 * ------------------------------------------------------------------ */

export function WhatsAppScene({
  scene,
  stage,
  busy = false,
  pendingAction = null,
  consequenceKind = null,
  onAct,
  onNavigate,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  /** Local: the learner walked back to the chat list from an open conversation. */
  const [browsingList, setBrowsingList] = useState(false)
  /**
   * The reply the learner has chosen but not yet sent. Presentation only - the affordance
   * is not submitted until Send is pressed, and nothing about a draft is stored anywhere.
   */
  const [draft, setDraft] = useState(null)
  /** Local: the composer's attach sheet is open (IMMERSIVE-003D). */
  const [attachOpen, setAttachOpen] = useState(false)
  /** Local: the message the pinned bar just jumped to, briefly highlighted. */
  const [highlight, setHighlight] = useState(null)
  const scrollRef = useRef(null)

  const listStage = scene.stages?.[stage]?.surface === 'list'
  const showList = listStage || browsingList

  /**
   * A committed stage change closes whatever the learner had open in the app chrome.
   *
   * Adjusted during render rather than in an effect: the stage is a prop, so this is
   * derived state catching up with it, and doing it in an effect would render the menu
   * open for one frame over a screen that has already moved on.
   */
  const [lastStage, setLastStage] = useState(stage)
  if (lastStage !== stage) {
    setLastStage(stage)
    setBrowsingList(false)
    setMenuOpen(false)
    setAttachOpen(false)
    setDraft(null)
  }

  const beats = useMemo(
    () => groupBeats(beatsAt(scene, stage, consequenceKind)),
    [scene, stage, consequenceKind],
  )

  // The highlight a jump leaves behind fades on its own; it is presentation only.
  useEffect(() => {
    if (!highlight) return undefined
    const timer = setTimeout(() => setHighlight(null), 1800)
    return () => clearTimeout(timer)
  }, [highlight])

  const inline = affordancesIn(scene, stage, SLOT.INLINE)
  const composerSlot = affordancesIn(scene, stage, SLOT.COMPOSER)
  /**
   * A local control in the composer slot is something the paperclip opens - a location or
   * a document picker - rather than a reply (IMMERSIVE-003D). Replies stay drafts; the
   * attach sheet lists the rest, and choosing from it only walks the device somewhere.
   */
  const composer = composerSlot.filter((item) => !item.local)
  const attachments = composerSlot.filter((item) => item.local)
  const menu = [...affordancesIn(scene, stage, SLOT.MENU), ...ambientFor(scene, stage)]
  const banner = inline.filter((item) => !item.anchor)
  /** The header's name block is a control when the stage offers an inspection there. */
  const headerAffordance = anchoredTo(inline, 'header')[0]
    ?? menu.find((item) => item.local && item.opens === 'contact')
    ?? null

  // Open a conversation on its newest message, the way a phone does.
  useEffect(() => {
    if (!showList && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [showList, beats.length])

  const select = (affordance) => {
    setMenuOpen(false)
    setAttachOpen(false)
    if (affordance.local) {
      onNavigate?.(affordance.opens)
      return
    }
    onAct(affordance)
  }

  /**
   * `variant` is where the control sits, never what it does. Beats pass it only when they
   * draw a control somewhere other than a chip - a business message's button row - and
   * `controls.map(renderControl)` hands over an index in that position, which is why only
   * a string counts.
   */
  const renderControl = (affordance, variant) => (
    <SceneControl
      key={affordance.id}
      affordance={affordance}
      busy={busy}
      pendingAction={pendingAction}
      onSelect={select}
      variant={typeof variant === 'string' ? variant : 'chip'}
    />
  )

  if (showList) {
    return (
      <div className="animate-screen-in flex h-full min-h-0 flex-col" data-testid="phone-app">
        <ChatList
          scene={scene}
          rowActions={listStage ? inline : []}
          busy={busy}
          pendingAction={pendingAction}
          onSelect={select}
          onOpenThread={() => setBrowsingList(false)}
          onPeek={onNavigate}
        />
      </div>
    )
  }

  const { conversation } = scene

  return (
    <div className="animate-screen-in flex h-full min-h-0 flex-col bg-wa-canvas" data-testid="phone-app">
      {/* Header. The name and avatar together are one control: contact or group info. */}
      <div className="flex shrink-0 items-center gap-1.5 bg-wa-header px-1.5 py-1.5 text-white">
        <button
          type="button"
          onClick={() => setBrowsingList(true)}
          aria-label="Back to chats"
          className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-white/15"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </button>

        <HeaderIdentity
          conversation={conversation}
          affordance={headerAffordance}
          busy={busy}
          pendingAction={pendingAction}
          onSelect={select}
        />

        <span aria-hidden="true" className="flex shrink-0 items-center gap-3 pr-1 text-white/85">
          <Video size={17} />
          <Phone size={16} />
        </span>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="More options"
          aria-haspopup="dialog"
          className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-white/15"
        >
          <MoreVertical size={17} aria-hidden="true" />
        </button>
      </div>

      {conversation.unknownSenderBanner && (
        /**
         * The app's own strip for a chat from a number that is not saved.
         *
         * It states a fact about the address book and nothing else. There is deliberately
         * no decorative Block / Report / Add-to-contacts row here even though the real app
         * has one: a control that cannot be pressed is worse than no control, and the ones
         * that CAN be pressed are the scene's affordances in the banner below the thread
         * and in the overflow sheet.
         */
        <p className="shrink-0 border-b border-black/10 bg-surface px-3 py-2 text-center text-[0.7rem] text-wa-meta">
          {conversation.unknownSenderBanner === true
            ? 'This chat is with a number that is not in your contacts.'
            : conversation.unknownSenderBanner}
        </p>
      )}

      {conversation.pinned && (
        /**
         * The pinned-message bar (IMMERSIVE-003D). The app keeps it under the header for as
         * long as the message stays pinned, and tapping it scrolls the thread back to that
         * message. Local: reading an old message again is not a decision.
         */
        <button
          type="button"
          data-control="nav"
          data-testid="wa-pinned"
          onClick={() => {
            const target = scrollRef.current?.querySelector(
              `[data-beat="${conversation.pinned.beatId}"]`,
            )
            target?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
            setHighlight(conversation.pinned.beatId)
          }}
          className="flex shrink-0 items-center gap-2 border-b border-black/10 bg-surface px-3 py-1.5 text-left hover:bg-wa-search"
        >
          <Pin size={14} aria-hidden="true" className="shrink-0 rotate-45 text-wa-meta" />
          <span className="min-w-0 flex-1">
            <span className="block text-[0.66rem] font-semibold text-channel-whatsapp">
              {conversation.pinned.author ?? 'Pinned message'}
            </span>
            <span className="block truncate text-[0.72rem] text-wa-meta">
              {conversation.pinned.text}
            </span>
          </span>
          <span className="sr-only"> - pinned message, go to it</span>
        </button>
      )}

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-1 pb-2.5"
        data-testid="wa-thread"
      >
        {beats.map(({ beat, grouped, tail }) => (
          <div
            key={beat.id}
            data-beat={beat.id}
            className={cn(
              'transition-colors duration-500',
              highlight === beat.id && 'bg-channel-whatsapp/15',
            )}
          >
            <ChatBeat
              beat={beat}
              grouped={grouped}
              tail={tail}
              controls={anchoredTo(inline, beat.id)}
              renderControl={renderControl}
            />
          </div>
        ))}
      </div>

      {banner.length > 0 && (
        <div
          className="flex shrink-0 flex-wrap gap-2 border-t border-black/10 bg-surface px-2.5 py-2"
          data-testid="wa-action-banner"
        >
          {banner.map((item) => (
            <SceneControl
              key={item.id}
              affordance={item}
              busy={busy}
              pendingAction={pendingAction}
              onSelect={select}
              variant="banner"
            />
          ))}
        </div>
      )}

      {conversation.adminsOnly && composer.length === 0 ? (
        /**
         * A group where only admins can post has no message field at all (IMMERSIVE-003C).
         * The app puts this line where the composer would be, and so does the scene: the
         * learner can read the room, but the only people talking in it are the ones who
         * set it up.
         */
        <p
          className="shrink-0 border-t border-black/10 bg-surface px-3 py-3 text-center text-[0.74rem] text-wa-meta"
          data-testid="wa-admins-only"
        >
          Only admins can send messages
        </p>
      ) : (
        <Composer
          replies={composer}
          draft={draft}
          busy={busy}
          pendingAction={pendingAction}
          canAttach={attachments.length > 0}
          onAttach={() => setAttachOpen(true)}
          onChoose={setDraft}
          onSend={() => {
            const chosen = draft
            setDraft(null)
            if (chosen) select(chosen)
          }}
        />
      )}

      <Modal
        open={attachOpen}
        contained
        title="Share"
        description="Choose what to attach to this chat."
        onClose={() => setAttachOpen(false)}
      >
        <ul className="grid gap-2" data-testid="wa-attach">
          {attachments.map((item) => (
            <li key={item.id}>
              <SceneControl
                affordance={item}
                busy={busy}
                pendingAction={pendingAction}
                onSelect={select}
                variant="menu"
              />
            </li>
          ))}
        </ul>
      </Modal>

      <Modal
        open={menuOpen}
        contained
        title={conversation.kind === 'group' ? 'Group options' : 'Chat options'}
        description="Actions available in this chat right now."
        onClose={() => setMenuOpen(false)}
      >
        <ul className="grid gap-2" data-testid="wa-menu">
          {menu.map((item) => (
            <li key={item.id}>
              <SceneControl
                affordance={item}
                busy={busy}
                pendingAction={pendingAction}
                onSelect={select}
                variant="menu"
              />
            </li>
          ))}
          {menu.length === 0 && (
            <li className="text-sm text-text-muted">Nothing further is available here.</li>
          )}
        </ul>
      </Modal>
    </div>
  )
}

/**
 * The composer strip.
 *
 * The message field is NOT a text input, and there is no path by which one could be typed
 * into: the only thing that can appear in it is an authored reply the scenario wrote. What
 * the two steps buy is the part that was missing - the learner picks what to say, sees it
 * sitting in the field the way it would in a real app, and then presses Send. The intent is
 * submitted at that press and nowhere else.
 */
function Composer({
  replies, draft, busy, pendingAction, canAttach = false, onAttach, onChoose, onSend,
}) {
  const text = draft?.echo ?? draft?.label ?? null

  return (
    <div className="shrink-0 bg-wa-canvas px-2.5 pt-1.5 pb-2.5">
      {replies.length > 0 && (
        <div className="pb-2" data-testid="wa-quick-replies">
          <p className="pb-1.5 text-[0.66rem] font-semibold tracking-wide text-wa-meta uppercase">
            Suggested replies
          </p>
          <div className="flex flex-wrap gap-2">
            {replies.map((reply) => {
              const chosen = draft?.id === reply.id
              return (
                <button
                  key={reply.id}
                  type="button"
                  disabled={busy}
                  aria-pressed={chosen}
                  data-role="draft"
                  onClick={() => onChoose(chosen ? null : reply)}
                  className={cn(
                    'inline-flex min-h-11 items-center rounded-full border px-3.5 text-left text-[0.78rem]',
                    'font-semibold transition-colors duration-150 disabled:opacity-55',
                    chosen
                      ? 'border-channel-whatsapp bg-channel-whatsapp/12 text-channel-whatsapp'
                      : 'border-channel-whatsapp/45 bg-surface text-channel-whatsapp hover:bg-channel-whatsapp/10',
                  )}
                >
                  {reply.label}
                  <span className="sr-only"> - put this in the message field</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-3xl bg-surface px-3 py-2 shadow-xs">
          <Smile size={16} aria-hidden="true" className="shrink-0 text-wa-meta" />
          <p
            data-testid="wa-composer-field"
            className={cn(
              'min-w-0 flex-1 truncate py-0.5 text-xs',
              text ? 'text-text' : 'text-wa-meta',
            )}
          >
            {text ?? (replies.length ? 'Choose a reply above' : 'Message')}
          </p>
          {canAttach ? (
            /**
             * The paperclip is a control only when the scene offers something to attach
             * (IMMERSIVE-003D); otherwise it stays the decoration it always was, rather than
             * a button that opens an empty sheet.
             */
            <button
              type="button"
              onClick={onAttach}
              aria-label="Attach"
              aria-haspopup="dialog"
              data-control="nav"
              className="-m-2 grid size-9 shrink-0 place-items-center rounded-full text-wa-meta hover:bg-black/5"
            >
              <Paperclip size={15} aria-hidden="true" />
            </button>
          ) : (
            <Paperclip size={15} aria-hidden="true" className="shrink-0 text-wa-meta" />
          )}
          <Camera size={15} aria-hidden="true" className="shrink-0 text-wa-meta" />
        </div>

        {text ? (
          <button
            type="button"
            disabled={busy && pendingAction !== draft.id}
            aria-busy={pendingAction === draft.id || undefined}
            data-control="act"
            onClick={onSend}
            aria-label={`Send "${text}"`}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-wa-accent text-white disabled:opacity-55"
          >
            <Send size={17} aria-hidden="true" />
          </button>
        ) : (
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-wa-accent/60 text-white"
          >
            <Plus size={18} />
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * The header's name block.
 *
 * When the current stage offers an inspection, the whole block is the control that opens
 * it - which is what tapping a WhatsApp header does. When it does not, the same block is
 * plain text rather than a button that would do nothing.
 */
function HeaderIdentity({ conversation, affordance, busy, pendingAction, onSelect }) {
  const body = (
    <>
      {/*
        The header avatar always takes the dark treatment, group or not: the pale group
        tint is a light-background style and disappears against the header's own green.
      */}
      <Avatar seed={conversation.avatarSeed} title={conversation.title} />
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[0.85rem] font-semibold">{conversation.title}</span>
        <span className="block truncate text-[0.66rem] text-white/75">
          {conversation.saved ? conversation.presence : conversation.subtitle}
        </span>
      </span>
    </>
  )

  if (!affordance) {
    return <span className="flex min-w-0 flex-1 items-center gap-2.5">{body}</span>
  }

  return (
    <button
      type="button"
      disabled={busy && pendingAction !== affordance.id}
      aria-busy={pendingAction === affordance.id || undefined}
      data-control={affordance.local ? 'nav' : 'act'}
      onClick={() => onSelect(affordance)}
      className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1 hover:bg-white/10 disabled:opacity-55"
    >
      {body}
      <span className="sr-only">
        - open {conversation.kind === 'group'
          ? 'group'
          : conversation.business ? 'business' : 'contact'} info
      </span>
    </button>
  )
}
