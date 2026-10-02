import { useEffect, useState } from 'react'
import {
  BadgeIndianRupee, Ban, Check, CheckCheck, ChevronRight, FastForward, FileText, Forward,
  KeyRound, Link2, Mic, Package, Pause, Phone, PhoneMissed, Play, Timer, User, Video, Vote,
} from 'lucide-react'
import { AttachmentTile } from '@/components/simulation/whatsapp/AttachmentTile'
import { cn } from '@/utils/cn'

/**
 * Everything a WhatsApp thread can contain (IMMERSIVE-003A, rebuilt by R2).
 *
 * These are the beats a scene declares, drawn the way the app would draw them: grey
 * centred system notices, day dividers, incoming and outgoing bubbles with ticks and
 * times, a typing strip, a link preview, a verification-code notice, a poll with other
 * people's answers already in it, a payment request and a countdown card.
 *
 * Two rules apply to every one of them, and they are why this file exists at all.
 *
 * **Nothing here acts.** A link preview shows a URL as text and has no href; a payment
 * card is a summary and charges nothing; a code notice is scenario text. The controls
 * that DO something are passed in as affordances by the scene and are ordinary buttons
 * that submit an intent through the controller - they are not built into the content.
 *
 * **Nothing here is styled by risk.** A payment request and a poll get the same card, the
 * same weight and the same colour treatment. If a bubble looked dangerous, the learner
 * would be reading our opinion rather than the message.
 *
 * What R2 adds is rhythm. Consecutive messages from one sender are grouped, only the last
 * of a group gets a tail, the author strip appears once per group rather than once per
 * line, and a typing strip can sit where the scene says somebody is about to speak. None
 * of that changes what is said; it changes whether it reads as a conversation.
 */

const TICKS = {
  sent: Check,
  delivered: CheckCheck,
  read: CheckCheck,
}

export function Avatar({ seed = '', title = '', size = 'md', group = false, tone = 'dark' }) {
  const source = String(seed || title)
  const looksLikeNumber = /^[+\d\s()-]+$/.test(source.trim())
  /**
   * Initials from the words that are actually a name. A display name like
   * "Riya (saved)" or "Riya (new number)" must not become "R(" - the parenthetical is a
   * qualifier the scenario added, not a second word in the person's name.
   */
  const words = source
    .replace(/\([^)]*\)/g, ' ')
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean)
  /**
   * A seed that is already a monogram - the bank stores `avatar_initials` like "RC" - is
   * used as it stands. Taking the first letter of it would turn "RC" into "R", which is
   * how the coordinator's card ended up looking like somebody else's.
   */
  const initials = (words.length === 1 && words[0].length <= 3
    ? words[0]
    : words.slice(0, 2).map((word) => word[0]).join('')).toUpperCase()

  const dimensions = {
    xs: 'size-6 text-[0.55rem]',
    sm: 'size-8 text-[0.6rem]',
    md: 'size-9 text-xs',
    lg: 'size-11 text-sm',
    xl: 'size-20 text-xl',
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-semibold',
        group && 'bg-channel-whatsapp/20 text-channel-whatsapp',
        !group && tone === 'dark' && 'bg-black/15 text-white',
        !group && tone === 'light' && 'bg-secondary-soft text-secondary',
        dimensions[size] ?? dimensions.md,
      )}
    >
      {looksLikeNumber || !initials
        ? <User size={size === 'xl' ? 34 : size === 'xs' ? 12 : 17} />
        : initials}
    </span>
  )
}

function Meta({ time, status, outgoing, edited = false }) {
  const Tick = outgoing && status ? TICKS[status] : null
  if (!time && !Tick) return null
  return (
    <span className="ml-2 inline-flex translate-y-0.5 items-center gap-1 text-[0.65rem] whitespace-nowrap text-wa-meta">
      {edited && <span className="italic">edited</span>}
      {time}
      {Tick && (
        <Tick
          size={13}
          aria-hidden="true"
          className={status === 'read' ? 'text-wa-tick' : 'text-wa-meta'}
        />
      )}
      {outgoing && status && <span className="sr-only">{status}</span>}
    </span>
  )
}

/**
 * One bubble.
 *
 * `tail` is false for every message in a group except the last, which is the single
 * cheapest thing that makes a thread stop looking generated.
 */
function Bubble({ outgoing, tail = true, grouped = false, children, className }) {
  return (
    <div className={cn('flex px-3', outgoing ? 'justify-end' : 'justify-start', grouped ? 'mt-0.5' : 'mt-1.5')}>
      <div
        className={cn(
          'animate-bubble-in relative max-w-[85%] rounded-lg px-2.5 py-1.5 text-[0.82rem] leading-snug shadow-xs',
          'break-words hyphens-auto',
          outgoing ? 'bg-wa-bubble-out text-text' : 'bg-wa-bubble-in text-text',
          tail && (outgoing ? 'rounded-br-none' : 'rounded-bl-none'),
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * The grey "Forwarded" line above a forwarded message (IMMERSIVE-003D).
 *
 * The app marks a message that has been forwarded, and marks it differently once it has
 * passed through five or more chats. That label is provenance the sender cannot remove, and
 * it is stated here as the app states it - a fact about the message's path, never a verdict
 * on what it says.
 */
function Forwarded({ many }) {
  return (
    <span className="mb-0.5 flex items-center gap-1 text-[0.68rem] italic text-wa-meta">
      {many
        ? <FastForward size={12} aria-hidden="true" className="shrink-0" />
        : <Forward size={12} aria-hidden="true" className="shrink-0" />}
      {many ? 'Forwarded many times' : 'Forwarded'}
    </span>
  )
}

/**
 * Other people's reactions under a message (IMMERSIVE-003D): the small pill that hangs off
 * a bubble's lower edge. Authored counts, like a poll's votes - nothing is tallied.
 */
function Reactions({ reactions = [], outgoing = false }) {
  if (!reactions?.length) return null
  const total = reactions.reduce((sum, item) => sum + (item.count ?? 1), 0)
  return (
    <span
      className={cn(
        'absolute -bottom-3 flex items-center gap-0.5 rounded-full border border-black/10 bg-surface px-1.5 py-px text-[0.7rem] shadow-xs',
        outgoing ? 'right-2' : 'left-2',
      )}
      data-testid="message-reactions"
    >
      <span className="sr-only">Reactions: </span>
      {reactions.map((item) => (
        <span key={item.emoji}>{item.emoji}</span>
      ))}
      {total > 1 && <span className="ml-0.5 tabular-nums text-wa-meta">{total}</span>}
    </span>
  )
}

/** The author strip WhatsApp puts above someone else's message in a group. */
function Author({ name }) {
  if (!name) return null
  return <span className="mb-0.5 block text-[0.7rem] font-semibold text-channel-whatsapp">{name}</span>
}

function SystemNotice({ text, tone = 'default' }) {
  if (!text) return null
  return (
    <div className="mt-2 flex justify-center px-4">
      <span
        className={cn(
          'max-w-[92%] rounded-md px-2.5 py-1 text-center text-[0.68rem] font-medium shadow-xs',
          tone === 'default' && 'bg-white/75 text-wa-meta',
          tone === 'alert' && 'bg-warning-soft text-warning',
        )}
      >
        {text}
      </span>
    </div>
  )
}

function DayDivider({ text }) {
  return (
    <div className="mt-3 flex justify-center px-3">
      <span className="rounded-md bg-white/75 px-2.5 py-0.5 text-[0.62rem] font-bold tracking-wide text-wa-meta shadow-xs">
        {text}
      </span>
    </div>
  )
}

/** The three dots. CSS only, and it says what it is to a screen reader. */
function TypingStrip({ author }) {
  return (
    <div className="mt-1.5 flex justify-start px-3">
      <div className="rounded-lg rounded-bl-none bg-wa-bubble-in px-3 py-2 shadow-xs">
        <span className="sr-only">{author ? `${author} is typing` : 'Typing...'}</span>
        <span aria-hidden="true" className="flex items-center gap-1">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="animate-typing size-1.5 rounded-full bg-wa-meta"
              style={{ animationDelay: `${dot * 180}ms` }}
            />
          ))}
        </span>
      </div>
    </div>
  )
}

/**
 * A card inside a bubble: the shared frame for link previews, polls, payment requests and
 * countdowns, so none of them can look more or less alarming than the others.
 */
function Card({ icon: Icon, title, children }) {
  return (
    <span className="block rounded-md bg-black/5 p-2">
      {title && (
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          {Icon && <Icon size={13} aria-hidden="true" className="shrink-0 text-wa-meta" />}
          {title}
        </span>
      )}
      {children}
    </span>
  )
}

/** A row of key/value lines inside a card, used by the payment request. */
function CardRows({ rows }) {
  return (
    <span className="mt-1.5 block space-y-0.5">
      {rows.filter((row) => row.value).map((row) => (
        <span key={row.label} className="flex items-baseline justify-between gap-3 text-[0.7rem]">
          <span className="shrink-0 text-wa-meta">{row.label}</span>
          <span className="min-w-0 text-right font-medium break-words">{row.value}</span>
        </span>
      ))}
    </span>
  )
}

/**
 * One beat.
 *
 * `controls` are the scene's affordances that belong to this beat - the poll's options,
 * the payment card's pay button, the link card's open and inspect controls. They arrive
 * already filtered by stage, so a control that is not legal right now is not rendered at
 * all rather than rendered and disabled.
 *
 * `grouped` and `tail` come from the thread renderer, which is the only place that can
 * see a beat's neighbours.
 */
export function ChatBeat({ beat, controls = [], renderControl, grouped = false, tail = true }) {
  const outgoing = beat.from === 'me'
  const author = !outgoing && !grouped ? beat.author : null

  switch (beat.kind) {
    case 'system':
      return <SystemNotice text={beat.text} tone={beat.tone} />

    case 'day':
      return <DayDivider text={beat.text} />

    case 'typing':
      return <TypingStrip author={beat.author} />

    case 'message':
      if (beat.deleted) {
        /**
         * A deleted message keeps its place, its author and its time - that is what the app
         * does, and it is the evidence (IMMERSIVE-003D): somebody wrote something here and
         * somebody else removed it. What it said is gone, so nothing of it is shown.
         */
        return (
          <Bubble outgoing={outgoing} grouped={grouped} tail={tail}>
            <Author name={author} />
            <p className="inline italic text-wa-meta" data-testid="deleted-message">
              <Ban size={13} aria-hidden="true" className="mr-1 inline -translate-y-px" />
              {beat.deletedBy
                ? `This message was deleted by admin ${beat.deletedBy}`
                : 'This message was deleted'}
            </p>
            <Meta time={beat.time} outgoing={outgoing} />
          </Bubble>
        )
      }
      return (
        <Bubble
          outgoing={outgoing}
          grouped={grouped}
          tail={tail}
          className={beat.reactions?.length ? 'mb-3' : undefined}
        >
          <Author name={author} />
          {beat.forwarded && <Forwarded many={beat.forwarded === 'many'} />}
          {beat.quote && (
            <span className="mb-1 block rounded-sm border-l-2 border-channel-whatsapp/70 bg-black/5 px-2 py-1">
              <span className="block text-[0.68rem] font-semibold text-channel-whatsapp">
                {beat.quote.author}
              </span>
              <span className="block text-[0.7rem] text-wa-meta">{beat.quote.text}</span>
            </span>
          )}
          <p className="inline text-balance-pretty whitespace-pre-line">{beat.text}</p>
          <Meta time={beat.time} status={beat.status} outgoing={outgoing} edited={beat.edited} />
          {/*
            IMMERSIVE-003D: a control that acts on this message itself - the reaction a
            coordinator asked for instead of a reply. Drawn only while the stage offers it.
          */}
          {controls.length > 0 && (
            <span className="mt-2 flex flex-wrap gap-1.5" data-testid="message-controls">
              {controls.map(renderControl)}
            </span>
          )}
          <Reactions reactions={beat.reactions} outgoing={outgoing} />
        </Bubble>
      )

    case 'link':
      return (
        <Bubble outgoing={outgoing} grouped={grouped} tail={tail}>
          <Author name={author} />
          <Card icon={Link2} title={beat.title}>
            {beat.description && (
              <span className="mt-0.5 block text-[0.72rem] text-wa-meta">{beat.description}</span>
            )}
            <span className="mt-1 block text-[0.7rem] break-all text-info">{beat.displayUrl}</span>
          </Card>
          {beat.text && <p className="mt-1.5 text-balance-pretty">{beat.text}</p>}
          {controls.length > 0 && (
            <span className="mt-2 flex flex-wrap gap-1.5">{controls.map(renderControl)}</span>
          )}
          <Meta time={beat.time} status={beat.status} outgoing={outgoing} />
        </Bubble>
      )

    case 'code':
      return (
        <Bubble outgoing={false} grouped={grouped} tail={tail}>
          <Card icon={KeyRound} title="WhatsApp">
            <span className="mt-1 block font-mono text-sm font-bold tracking-widest">
              {beat.code}
            </span>
            <span className="mt-1 block text-[0.72rem] text-wa-meta">
              is your verification code. Do not share this code with anyone.
            </span>
          </Card>
          <Meta time={beat.time} outgoing={false} />
        </Bubble>
      )

    case 'poll':
      return <PollCard beat={beat} controls={controls} renderControl={renderControl} tail={tail} />

    case 'payment':
      return (
        <Bubble outgoing={false} grouped={grouped} tail={tail}>
          <Author name={author} />
          <Card icon={BadgeIndianRupee} title="Payment request">
            <span className="mt-1 block text-base font-bold tabular-nums">{beat.amount}</span>
            <CardRows
              rows={[
                { label: 'To', value: beat.payee },
                { label: 'Reference', value: beat.reference },
                { label: 'Expires', value: beat.expires },
              ]}
            />
            {beat.note && (
              <span className="mt-1 block text-[0.72rem] text-wa-meta">{beat.note}</span>
            )}
            {controls.length > 0 && (
              <span className="mt-2 flex flex-wrap gap-1.5">{controls.map(renderControl)}</span>
            )}
          </Card>
          <Meta time={beat.time} outgoing={false} />
        </Bubble>
      )

    case 'document': {
      /**
       * The glyph follows the file type, the way the app draws it: a PDF gets the red
       * document mark and an Android package gets the package mark. The colour is the
       * format's, never a verdict on the file.
       */
      const isPackage = /^apk$/i.test(beat.fileKind ?? '')
      const Glyph = isPackage ? Package : FileText
      return (
        <Bubble outgoing={outgoing} grouped={grouped} tail={tail}>
          <Author name={author} />
          <span className="flex items-center gap-2 rounded-md bg-black/5 p-2">
            <span
              aria-hidden="true"
              className={cn(
                'grid size-9 shrink-0 place-items-center rounded-sm',
                isPackage ? 'bg-secondary-soft text-secondary' : 'bg-danger-soft text-danger',
              )}
            >
              <Glyph size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.78rem] font-semibold">{beat.fileName}</span>
              <span className="mt-0.5 block text-[0.68rem] text-wa-meta">
                {[beat.pages, beat.size, beat.fileKind].filter(Boolean).join(' · ')}
              </span>
            </span>
          </span>
          {beat.caption && <p className="mt-1.5 text-balance-pretty">{beat.caption}</p>}
          {controls.length > 0 && (
            <span className="mt-2 flex flex-wrap gap-1.5">{controls.map(renderControl)}</span>
          )}
          <Meta time={beat.time} status={beat.status} outgoing={outgoing} />
        </Bubble>
      )
    }

    case 'voice':
      return (
        <VoiceNote
          beat={beat}
          grouped={grouped}
          tail={tail}
          author={author}
          controls={controls}
          renderControl={renderControl}
        />
      )

    case 'template':
      return (
        <Bubble outgoing={false} grouped={grouped} tail={tail}>
          {beat.header && (
            <span className="mb-0.5 block text-[0.82rem] font-bold">{beat.header}</span>
          )}
          <p className="inline text-balance-pretty whitespace-pre-line">{beat.text}</p>
          {beat.footer && (
            <span className="mt-1 block text-[0.66rem] text-wa-meta">{beat.footer}</span>
          )}
          <Meta time={beat.time} outgoing={false} />
          {/*
            The buttons belong to the bubble, as they do in the app. While the stage offers
            them they are the scene's own controls; once it has moved on they stay visible
            as what they were, plainly not something to press.
          */}
          {controls.length > 0 ? (
            <span className="-mx-2.5 mt-1.5 -mb-1.5 block divide-y divide-black/10 border-t border-black/10">
              {controls.map((control) => (
                <span key={control.id} className="block">{renderControl(control, 'row')}</span>
              ))}
            </span>
          ) : (beat.buttons ?? []).length > 0 && (
            <span className="-mx-2.5 mt-1.5 -mb-1.5 block divide-y divide-black/10 border-t border-black/10">
              {beat.buttons.map((label) => (
                <span
                  key={label}
                  className="block py-2 text-center text-[0.78rem] font-semibold text-wa-meta"
                >
                  {label}
                </span>
              ))}
            </span>
          )}
        </Bubble>
      )

    case 'call':
      return <CallEntry beat={beat} controls={controls} renderControl={renderControl} />

    case 'media':
      return (
        <Bubble outgoing={outgoing} grouped={grouped} tail={tail} className="max-w-[76%]">
          <Author name={author} />
          <span className="block overflow-hidden rounded-md bg-black/5 p-1.5">
            <AttachmentTile art={beat.art} label={beat.label} />
          </span>
          {beat.size && (
            <span className="mt-1 block text-[0.66rem] text-wa-meta">{beat.size}</span>
          )}
          {beat.caption && <p className="mt-1 text-balance-pretty">{beat.caption}</p>}
          {controls.length > 0 && (
            <span className="mt-2 flex flex-wrap gap-1.5">{controls.map(renderControl)}</span>
          )}
          <Meta time={beat.time} status={beat.status} outgoing={outgoing} />
        </Bubble>
      )

    case 'countdown':
      return (
        <Bubble outgoing={false} grouped={grouped} tail={tail}>
          <Card icon={Timer} title={beat.label}>
            <span className="mt-1 block font-mono text-lg font-bold tabular-nums">
              {beat.value}
            </span>
            {beat.caption && (
              <span className="mt-0.5 block text-[0.7rem] text-wa-meta">{beat.caption}</span>
            )}
          </Card>
          <Meta time={beat.time} outgoing={false} />
        </Bubble>
      )

    default:
      return typeof beat.text === 'string' ? <SystemNotice text={beat.text} /> : null
  }
}

/** "0:41" -> 41. Authored durations only; nothing here measures a recording. */
function secondsOf(duration) {
  const [minutes, seconds] = String(duration ?? '0:00').split(':').map(Number)
  return (minutes || 0) * 60 + (seconds || 0)
}

const clock = (value) => `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`

/** A stable bar height per position, so one voice note always draws the same waveform. */
function waveform(seed, bars) {
  let hash = 7
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 33 + seed.charCodeAt(i)) >>> 0
  return Array.from({ length: bars }, () => {
    hash = (hash * 1103515245 + 12345) >>> 0
    return 22 + ((hash >>> 16) % 78)
  })
}

const BARS = 30

/**
 * A voice message (IMMERSIVE-003C).
 *
 * Play and Transcript are LOCAL. Playing moves a progress line across a drawn waveform on
 * the authored clock and nothing else - there is no audio element, no file and no media
 * API, which is what `SceneContainment.test.jsx` asserts on every screen. The transcript is
 * the app's own transcription feature and is where the words live, because a simulation
 * that cannot make a sound has to say what was said somewhere honest.
 *
 * Neither control records anything: listening to a message is reading it.
 */
function VoiceNote({ beat, grouped, tail, author, controls, renderControl }) {
  const outgoing = beat.from === 'me'
  const total = secondsOf(beat.duration)
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [showTranscript, setShowTranscript] = useState(false)
  const finished = elapsed >= total
  const active = playing && !finished
  const bars = waveform(beat.id, BARS)
  const heard = total ? Math.round((elapsed / total) * BARS) : 0

  useEffect(() => {
    if (!active) return undefined
    const tick = setTimeout(() => setElapsed((value) => value + 1), 1000)
    return () => clearTimeout(tick)
  }, [active, elapsed])

  const toggle = () => {
    if (active) {
      setPlaying(false)
      return
    }
    if (finished) setElapsed(0)
    setPlaying(true)
  }

  return (
    <Bubble outgoing={outgoing} grouped={grouped} tail={tail} className="w-[85%]">
      <Author name={author} />
      <span className="flex items-center gap-2" data-testid="voice-note">
        <button
          type="button"
          onClick={toggle}
          aria-label={active ? 'Pause voice message' : 'Play voice message'}
          aria-pressed={active}
          className="grid size-9 shrink-0 place-items-center rounded-full text-wa-meta hover:bg-black/5"
        >
          {active ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
        </button>
        <span aria-hidden="true" className="flex h-7 min-w-0 flex-1 items-center gap-[2px]">
          {bars.map((height, index) => (
            <span
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              className={cn(
                'block w-[3px] shrink-0 rounded-full',
                index < heard ? 'bg-wa-tick' : 'bg-wa-meta/45',
              )}
              style={{ height: `${height}%` }}
            />
          ))}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'grid size-7 shrink-0 place-items-center rounded-full',
            elapsed > 0 ? 'bg-wa-tick/15 text-wa-tick' : 'bg-black/5 text-wa-meta',
          )}
        >
          <Mic size={14} />
        </span>
      </span>
      <span className="mt-0.5 flex items-center justify-between gap-2 text-[0.65rem] text-wa-meta">
        <span className="tabular-nums" role="status">
          <span className="sr-only">Voice message, </span>
          {elapsed > 0 && !finished ? clock(elapsed) : beat.duration}
        </span>
        <Meta time={beat.time} status={beat.status} outgoing={outgoing} />
      </span>

      {beat.transcript && (
        <span className="mt-1 block border-t border-black/10 pt-1">
          <button
            type="button"
            onClick={() => setShowTranscript((value) => !value)}
            aria-expanded={showTranscript}
            className="min-h-9 text-[0.72rem] font-semibold text-channel-whatsapp"
          >
            {showTranscript ? 'Hide transcript' : 'View transcript'}
          </button>
          {showTranscript && (
            <span className="block pb-1 text-[0.78rem] text-text text-balance-pretty" data-testid="voice-transcript">
              {beat.transcript}
            </span>
          )}
        </span>
      )}

      {controls.length > 0 && (
        <span className="mt-2 flex flex-wrap gap-1.5">{controls.map((control) => renderControl(control))}</span>
      )}
    </Bubble>
  )
}

const CALL_TEXT = {
  missed: (video) => (video ? 'Missed video call' : 'Missed voice call'),
  ringing: (video) => (video ? 'Incoming video call' : 'Incoming voice call'),
  ended: (video) => (video ? 'Video call' : 'Voice call'),
}

/**
 * A call in the thread (IMMERSIVE-003C): the chip the app leaves behind for a missed call,
 * or the strip it shows while one is ringing.
 *
 * A ringing call carries the scene's controls - Answer is how a learner walks into the
 * call screen - and everything about it is authored: it rings between the stages the scene
 * says, and a reload shows exactly the same thing.
 */
function CallEntry({ beat, controls, renderControl }) {
  const Icon = beat.state === 'missed' ? PhoneMissed : beat.video ? Video : Phone
  const ringing = beat.state === 'ringing'
  return (
    <div className="mt-2 flex justify-center px-4">
      <span
        className={cn(
          'block max-w-[92%] rounded-lg px-3 py-2 text-center shadow-xs',
          ringing ? 'bg-wa-header text-white' : 'bg-white/85 text-text',
        )}
        data-testid={`call-entry-${beat.state}`}
      >
        <span className="flex items-center justify-center gap-1.5 text-[0.76rem] font-semibold">
          <Icon
            size={14}
            aria-hidden="true"
            className={cn(
              beat.state === 'missed' && 'text-danger',
              ringing && 'animate-pulse',
            )}
          />
          {CALL_TEXT[beat.state]?.(beat.video) ?? 'Call'}
          {beat.time && (
            <span className={cn('font-normal', ringing ? 'text-white/75' : 'text-wa-meta')}>
              {beat.time}
            </span>
          )}
        </span>
        {(beat.caller || beat.number) && (
          <span
            className={cn(
              'mt-0.5 block text-[0.7rem] tabular-nums',
              ringing ? 'text-white/85' : 'text-wa-meta',
            )}
          >
            {[beat.caller, beat.number].filter(Boolean).join(' · ')}
          </span>
        )}
        {controls.length > 0 && (
          <span className="mt-2 flex flex-wrap justify-center gap-1.5">
            {controls.map((control) => renderControl(control))}
          </span>
        )}
      </span>
    </div>
  )
}

/**
 * The poll.
 *
 * Two states, and which one is shown is decided by whether the scene still offers voting
 * controls - which is the stage, which is the server's. Before the vote the options are
 * the controls; after it they are bars with the counts the scene authored plus the
 * learner's own answer. Nothing is tallied anywhere: a poll is content, and the vote that
 * matters was recorded by the engine when the control was pressed.
 */
function PollCard({ beat, controls, renderControl, tail }) {
  const options = (beat.options ?? []).map((option) =>
    (typeof option === 'string' ? { label: option, votes: 0 } : option))
  const total = beat.total ?? options.reduce((sum, option) => sum + (option.votes ?? 0), 0)
  const open = controls.length > 0

  return (
    <Bubble outgoing={false} tail={tail}>
      <Author name={beat.author} />
      <Card icon={Vote} title="Poll">
        <span className="mt-0.5 block text-[0.8rem] font-semibold">{beat.question}</span>

        {open ? (
          <span className="mt-2 block space-y-1.5">{controls.map(renderControl)}</span>
        ) : (
          <span className="mt-2 block space-y-2">
            {options.map((option) => {
              const share = total > 0 ? Math.round(((option.votes ?? 0) / total) * 100) : 0
              return (
                <span key={option.label} className="block">
                  <span className="flex items-baseline justify-between gap-2 text-[0.75rem]">
                    <span className="min-w-0 truncate">{option.label}</span>
                    <span className="shrink-0 tabular-nums text-wa-meta">{option.votes ?? 0}</span>
                  </span>
                  <span className="mt-0.5 block h-1.5 rounded-full bg-black/10">
                    <span
                      className="block h-full rounded-full bg-channel-whatsapp"
                      style={{ width: `${share}%` }}
                    />
                  </span>
                </span>
              )
            })}
          </span>
        )}

        <span className="mt-1.5 flex items-center gap-1 text-[0.65rem] text-wa-meta">
          {open
            ? 'Select one - only the group sees your answer'
            : `${total} ${total === 1 ? 'vote' : 'votes'}`}
          {!open && <ChevronRight size={11} aria-hidden="true" />}
        </span>
      </Card>
      <Meta time={beat.time} outgoing={false} />
    </Bubble>
  )
}
