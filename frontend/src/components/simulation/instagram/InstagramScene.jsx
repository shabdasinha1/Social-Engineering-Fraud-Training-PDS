import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Heart, MoreHorizontal, Phone, Send, Video } from 'lucide-react'
import { SceneControl } from '@/components/simulation/SceneControl'
import {
  ArtFill, IgAvatar, IgBeat, IgCaption, IgComment, PostActions, PostMedia, Verified,
} from '@/components/simulation/instagram/IgBlocks'
import { Modal } from '@/components/ui/Modal'
import { SLOT, affordancesIn, ambientFor, anchoredTo, beatsAt } from '@/simulation/sceneModel'
import { cn } from '@/utils/cn'

/**
 * The Instagram app, driven by a scene (IMMERSIVE-004A).
 *
 * The counterpart of `WhatsAppScene`, and it answers the same objection in Instagram's own
 * terms: the learner is not shown a question and four buttons, they are shown the app they
 * know - a notifications list or a message-requests inbox, a post with its caption and
 * comments, a DM thread - and every scored action is the control they would actually use.
 * Opening a profile, walking its grid, its "About this account" page or its followers is
 * local navigation and records nothing; only a scene affordance reaches the engine, through
 * the same controller the action sheet uses.
 *
 * There is no scoring, no stage and no notion of the wise choice in this component. It only
 * knows where each control belongs.
 */

/* ------------------------------------------------------------------ *
 * The list: notifications (activity) or message requests (dm inbox)
 * ------------------------------------------------------------------ */

/**
 * One notification. The account name is bold once, the way the app writes it - "nisha.bakes
 * liked your photo." - whether the scene states the rest as a `detail` or as a sentence that
 * already begins with the name.
 */
function ActivityRow({ row }) {
  const sentence = row.detail ?? row.text ?? ''
  const rest = sentence.startsWith(row.handle) ? sentence.slice(row.handle.length) : ` ${sentence}`
  return (
    <div className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
      <IgAvatar seed={row.handle} size="md" ring={!row.inert} />
      <span className="min-w-0 flex-1 text-[0.8rem] leading-snug">
        <span className="break-words">
          <span className="font-semibold">{row.handle}</span>
          <span className="text-text">{rest}</span>
        </span>
        {row.time && <span className="ml-1 text-ig-meta">{row.time}</span>}
        {row.detail && row.text && (
          <span className="mt-0.5 block text-[0.76rem] break-words text-ig-meta">{row.text}</span>
        )}
      </span>
      {row.art && <span className="size-11 shrink-0 overflow-hidden rounded-md"><ArtFill art={row.art} /></span>}
      {row.button && (
        <span className="shrink-0 rounded-md bg-ig-accent px-3 py-1 text-[0.72rem] font-semibold text-white">
          {row.button}
        </span>
      )}
    </div>
  )
}

function DmRow({ row }) {
  return (
    <div className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
      <IgAvatar seed={row.handle} name={row.name} art={row.avatarArt} size="lg" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.85rem] font-semibold">{row.name ?? row.handle}</span>
        <span className="mt-0.5 flex items-center gap-1 text-[0.76rem] text-ig-meta">
          <span className="truncate">{row.preview}</span>
          {row.time && <span className="shrink-0">· {row.time}</span>}
        </span>
      </span>
      {row.unread && <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-ig-accent" />}
    </div>
  )
}

function ListScreen({ scene, rowActions, busy, pendingAction, onSelect, onOpenThread }) {
  const list = scene.list
  /**
   * The row is the control that opens the conversation: the first inline control the list
   * stage offers (SECURITY-001 - found by position, because the device no longer knows
   * what any control means). `sceneModel.test.js` holds every scene to that order.
   */
  const openRow = rowActions[0] ?? null
  const extras = rowActions.filter((item) => item !== openRow)
  const isDm = list.kind === 'dm'

  return (
    <div className="flex h-full min-h-0 flex-col bg-ig-surface" data-testid="ig-list">
      <div className="flex shrink-0 items-center gap-2 border-b border-ig-border px-3 py-2.5">
        <p className="min-w-0 flex-1 truncate text-base font-bold">
          {isDm ? (list.username ?? 'Messages') : list.title}
        </p>
        <span aria-hidden="true" className="text-text">
          {isDm ? <Send size={18} /> : <Heart size={18} />}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {(list.sections ?? []).map((section) => (
          <section key={section.heading}>
            <h3 className="px-3 pt-3 pb-1 text-[0.72rem] font-bold text-text">{section.heading}</h3>
            <ul className="divide-y divide-ig-border/60">
              {section.rows.map((row) => {
                const Row = isDm ? DmRow : ActivityRow
                return (
                  <li key={row.id}>
                    {row.inert ? (
                      <Row row={row} />
                    ) : (
                      <button
                        type="button"
                        disabled={busy && pendingAction !== openRow?.id}
                        aria-busy={pendingAction === openRow?.id || undefined}
                        data-control={openRow ? 'act' : 'nav'}
                        aria-label={openRow ? openRow.label : `Open ${row.name ?? row.handle}`}
                        onClick={() => (openRow ? onSelect(openRow) : onOpenThread())}
                        className="w-full transition-colors duration-150 hover:bg-ig-bubble-in disabled:opacity-55"
                      >
                        <Row row={row} />
                      </button>
                    )}
                    {row.inert !== true && extras.length > 0 && (
                      <div className="flex flex-wrap justify-end gap-2 border-t border-ig-border bg-ig-bubble-in px-3 py-1.5">
                        {extras.map((item) => (
                          <SceneControl
                            key={item.id}
                            affordance={item}
                            busy={busy}
                            pendingAction={pendingAction}
                            onSelect={onSelect}
                            variant="ig"
                          />
                        ))}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * The app
 * ------------------------------------------------------------------ */

export function InstagramScene({
  scene, stage, busy = false, pendingAction = null, consequenceKind = null, onAct, onNavigate,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [browsingList, setBrowsingList] = useState(false)
  const [draft, setDraft] = useState(null)
  const scrollRef = useRef(null)

  const listStage = scene.stages?.[stage]?.surface === 'list'
  const showList = listStage || browsingList

  const [lastStage, setLastStage] = useState(stage)
  if (lastStage !== stage) {
    setLastStage(stage)
    setBrowsingList(false)
    setMenuOpen(false)
    setDraft(null)
  }

  const beats = useMemo(() => beatsAt(scene, stage, consequenceKind), [scene, stage, consequenceKind])

  const inline = affordancesIn(scene, stage, SLOT.INLINE)
  const composer = affordancesIn(scene, stage, SLOT.COMPOSER).filter((item) => !item.local)
  const menu = [...affordancesIn(scene, stage, SLOT.MENU), ...ambientFor(scene, stage)]
  const banner = inline.filter((item) => !item.anchor)
  /**
   * IMMERSIVE-004B: on the learner's OWN post (`conversation.own`) the author row is the
   * learner, so it never borrows the scene's profile navigation - that profile belongs to
   * someone in the comments, and is reached from their comment instead.
   */
  const headerAffordance = anchoredTo(inline, 'header')[0]
    ?? (scene.conversation?.own ? null : menu.find((item) => item.local && (item.opens === 'profile')))
    ?? null

  /**
   * A DM opens on its newest message, the way the app does; a post opens at its top, on the
   * account that posted it - scrolling a post to its last comment would hide the author row.
   */
  const isPostView = scene.conversation?.kind === 'post'
  useEffect(() => {
    if (!showList && !isPostView && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [showList, isPostView, beats.length])

  const select = (affordance) => {
    setMenuOpen(false)
    if (affordance.local) {
      onNavigate?.(affordance.opens)
      return
    }
    onAct(affordance)
  }

  const renderControl = (affordance) => (
    <SceneControl
      key={affordance.id}
      affordance={affordance}
      busy={busy}
      pendingAction={pendingAction}
      onSelect={select}
      variant="ig"
    />
  )

  if (showList) {
    return (
      <div className="animate-screen-in flex h-full min-h-0 flex-col" data-testid="phone-app">
        <ListScreen
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

  const conversation = scene.conversation
  const isPost = conversation.kind === 'post'

  const menuButton = (
    <button
      type="button"
      onClick={() => setMenuOpen(true)}
      aria-label="More options"
      aria-haspopup="dialog"
      className="grid size-9 shrink-0 place-items-center rounded-full text-text hover:bg-ig-bubble-in"
    >
      <MoreHorizontal size={20} aria-hidden="true" />
    </button>
  )

  const backButton = (
    <button
      type="button"
      onClick={() => setBrowsingList(true)}
      aria-label="Back to the list"
      className="grid size-9 shrink-0 place-items-center rounded-full text-text hover:bg-ig-bubble-in"
    >
      <ArrowLeft size={20} aria-hidden="true" />
    </button>
  )

  return (
    <div className="animate-screen-in flex h-full min-h-0 flex-col bg-ig-surface" data-testid="phone-app">
      {/* Top app bar */}
      <div className="flex shrink-0 items-center gap-1.5 border-b border-ig-border px-1.5 py-2">
        {backButton}
        {isPost ? (
          <p className="min-w-0 flex-1 truncate text-base font-bold">{conversation.screenTitle ?? 'Posts'}</p>
        ) : (
          <HeaderIdentity
            conversation={conversation}
            affordance={headerAffordance}
            busy={busy}
            pendingAction={pendingAction}
            onSelect={select}
          />
        )}
        {/* A broadcast channel (IMMERSIVE-004E) cannot be called, so it has no call icons. */}
        {!isPost && !conversation.readOnly && (
          <span aria-hidden="true" className="flex shrink-0 items-center gap-3 pr-1 text-text">
            <Phone size={17} />
            <Video size={18} />
          </span>
        )}
        {menuButton}
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2.5"
        data-testid="ig-thread"
      >
        {isPost ? (
          <PostView
            conversation={conversation}
            beats={beats}
            headerAffordance={headerAffordance}
            inline={inline}
            renderControl={renderControl}
            busy={busy}
            pendingAction={pendingAction}
            onSelect={select}
          />
        ) : (
          <div className="space-y-1.5 pt-2">
            {beats.map((beat) => (
              <div key={beat.id} data-beat={beat.id}>
                <IgBeat
                  beat={beat}
                  controls={anchoredTo(inline, beat.id)}
                  renderControl={renderControl}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {banner.length > 0 && (
        <div
          className="flex shrink-0 flex-wrap gap-2 border-t border-ig-border bg-ig-surface px-2.5 py-2"
          data-testid="ig-action-banner"
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

      {/*
        A post only gets a comment box when the scene offers something to say in it
        (IMMERSIVE-004B, a reply under the learner's own post); posts without one are unchanged.
      */}
      {/*
        IMMERSIVE-004E. A broadcast channel (`conversation.readOnly`) has no message box for
        members - only its owner can post - so the app shows its own note there instead, unless
        the scene offers something to send.
      */}
      {!isPost && conversation.readOnly && composer.length === 0 && (
        <p className="shrink-0 border-t border-ig-border bg-ig-surface px-4 py-3 text-center text-[0.72rem] text-ig-meta" data-testid="ig-readonly">
          {conversation.readOnly}
        </p>
      )}
      {((!isPost && !(conversation.readOnly && composer.length === 0)) || (isPost && composer.length > 0)) && (
        <Composer
          replies={composer}
          draft={draft}
          busy={busy}
          pendingAction={pendingAction}
          request={conversation.request}
          placeholder={isPost ? 'Add a comment…' : 'Message...'}
          publicNote={isPost ? (conversation.commentNote ?? 'Comments on your post are public.') : null}
          onChoose={setDraft}
          onSend={() => {
            const chosen = draft
            setDraft(null)
            if (chosen) select(chosen)
          }}
        />
      )}

      <Modal
        open={menuOpen}
        contained
        title={isPost ? 'Post options' : 'Options'}
        description="Actions available here right now."
        onClose={() => setMenuOpen(false)}
      >
        <ul className="grid gap-2" data-testid="ig-menu">
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

/* ------------------------------------------------------------------ *
 * The post view
 * ------------------------------------------------------------------ */

function PostView({
  conversation, beats, headerAffordance, inline = [], renderControl, busy, pendingAction, onSelect,
}) {
  const captionBeats = beats.filter((beat) => beat.kind === 'caption')
  const commentBeats = beats.filter((beat) => beat.kind === 'comment')
  const notices = beats.filter((beat) => beat.kind === 'system')
  const isReel = conversation.media === 'reel'
  /**
   * IMMERSIVE-004B. A sponsored reel carries the advertiser's call-to-action strip under the
   * media, the way the app draws it. The strip is whatever control the scene anchors to
   * `cta` at this stage - usually local navigation to the landing page - and plain text when
   * the scene anchors nothing there.
   */
  const ctaControls = anchoredTo(inline, 'cta')
  /**
   * IMMERSIVE-004E. A reel's audio credit is itself a link in the app - to the page of every
   * reel using that sound. A scene can anchor local navigation to `audio`; with nothing
   * anchored the credit stays plain text, as before.
   */
  const audioControls = anchoredTo(inline, 'audio')

  return (
    <article className="pb-2">
      {/* Author row - the identity here is the control that opens the profile. */}
      <header className="flex items-center gap-2.5 px-3 py-2.5">
        <AuthorButton
          conversation={conversation}
          affordance={headerAffordance}
          busy={busy}
          pendingAction={pendingAction}
          onSelect={onSelect}
        />
      </header>

      <PostMedia slides={conversation.slides} shape={isReel ? 'portrait' : 'square'} reel={isReel} />
      {conversation.cta && (
        <div className="flex items-center gap-2 border-b border-ig-border bg-ig-bubble-in px-3 py-1.5" data-testid="ig-cta">
          {ctaControls.length > 0
            ? ctaControls.map((control) => renderControl(control))
            : <span className="text-[0.8rem] font-semibold">{conversation.cta}</span>}
        </div>
      )}
      <PostActions />
      {conversation.audio && (audioControls.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 px-3 pt-1.5" data-testid="ig-audio">
          <span className="text-[0.7rem] text-ig-meta">♫ {conversation.audio}</span>
          {audioControls.map((control) => renderControl(control))}
        </div>
      ) : (
        <p className="px-3 pt-1.5 text-[0.7rem] text-ig-meta">♫ {conversation.audio}</p>
      ))}

      {conversation.likes && (
        <p className="px-3 pt-2 text-[0.8rem] font-semibold tabular-nums">{conversation.likes}</p>
      )}

      {captionBeats.map((beat) => <IgCaption key={beat.id} beat={beat} />)}

      {notices.map((beat) => (
        <p
          key={beat.id}
          data-beat={beat.id}
          className={cn(
            'mx-3 my-1.5 rounded-lg px-3 py-2 text-[0.72rem] text-balance-pretty',
            beat.tone === 'banner' ? 'bg-ig-bubble-in text-text' : 'border border-ig-border text-text-muted',
          )}
        >
          {beat.tone === 'mention' && (
            <span className="block text-[0.62rem] font-bold tracking-wide text-ig-meta uppercase">
              Your notification
            </span>
          )}
          {beat.text}
        </p>
      ))}

      {conversation.time && (
        <p className="px-3 pb-1 text-[0.62rem] tracking-wide text-ig-meta uppercase">{conversation.time}</p>
      )}

      {commentBeats.length > 0 && (
        <div className="mt-1 border-t border-ig-border pt-1">
          <h3 className="px-3 py-1 text-[0.72rem] font-bold text-ig-meta">Comments</h3>
          {commentBeats.map((beat) => (
            <div key={beat.id} data-beat={beat.id}>
              <IgComment beat={beat} controls={anchoredTo(inline, beat.id)} renderControl={renderControl} />
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

function AuthorButton({ conversation, affordance, busy, pendingAction, onSelect }) {
  const body = (
    <>
      <IgAvatar seed={conversation.handle} name={conversation.name} size="md" ring art={conversation.avatarArt} />
      <span className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-1 text-[0.85rem] font-semibold">
          <span className="truncate">{conversation.handle}</span>
          {conversation.verified && <Verified size={12} />}
        </span>
        {conversation.subline && (
          <span className="block truncate text-[0.66rem] text-ig-meta">{conversation.subline}</span>
        )}
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
      className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1 hover:bg-ig-bubble-in disabled:opacity-55"
    >
      {body}
      <span className="sr-only"> - open profile</span>
    </button>
  )
}

/* ------------------------------------------------------------------ *
 * The DM header and composer
 * ------------------------------------------------------------------ */

function HeaderIdentity({ conversation, affordance, busy, pendingAction, onSelect }) {
  const body = (
    <>
      <IgAvatar seed={conversation.handle} name={conversation.name} size="md" />
      <span className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-1 text-[0.85rem] font-semibold">
          <span className="truncate">{conversation.name ?? conversation.handle}</span>
          {conversation.verified && <Verified size={12} />}
        </span>
        <span className="block truncate text-[0.66rem] text-ig-meta">
          {conversation.subline ?? `@${conversation.handle}`}
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
      className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1 hover:bg-ig-bubble-in disabled:opacity-55"
    >
      {body}
      <span className="sr-only"> - open profile</span>
    </button>
  )
}

function Composer({
  replies, draft, busy, pendingAction, request = false, placeholder = 'Message...', publicNote = null,
  onChoose, onSend,
}) {
  const text = draft?.echo ?? draft?.label ?? null

  return (
    <div className="shrink-0 border-t border-ig-border bg-ig-surface px-2.5 pt-1.5 pb-2.5">
      {request && replies.length > 0 && (
        <p className="pb-1.5 text-center text-[0.66rem] text-ig-meta">
          Replying accepts this message request.
        </p>
      )}
      {publicNote && replies.length > 0 && (
        <p className="pb-1.5 text-center text-[0.66rem] text-ig-meta">{publicNote}</p>
      )}
      {replies.length > 0 && (
        <div className="pb-2" data-testid="ig-quick-replies">
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
                      ? 'border-ig-accent bg-ig-accent/10 text-ig-accent'
                      : 'border-ig-border bg-ig-surface text-ig-accent hover:bg-ig-bubble-in',
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

      <div className="flex items-center gap-2 rounded-full border border-ig-border px-3 py-2">
        <p className={cn('min-w-0 flex-1 truncate text-[0.8rem]', text ? 'text-text' : 'text-ig-meta')} data-testid="ig-composer-field">
          {text ?? (replies.length ? 'Choose a reply above' : placeholder)}
        </p>
        {text ? (
          <button
            type="button"
            disabled={busy && pendingAction !== draft.id}
            aria-busy={pendingAction === draft.id || undefined}
            data-control="act"
            onClick={onSend}
            aria-label={`Send "${text}"`}
            className="shrink-0 text-sm font-semibold text-ig-accent disabled:opacity-55"
          >
            Send
          </button>
        ) : (
          <span aria-hidden="true" className="shrink-0 text-sm font-semibold text-ig-accent/50">Send</span>
        )}
      </div>
    </div>
  )
}
