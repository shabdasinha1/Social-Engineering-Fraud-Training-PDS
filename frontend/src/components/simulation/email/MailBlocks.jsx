import { useEffect, useState } from 'react'
import {
  AudioLines, CalendarDays, ChevronDown, ChevronUp, Clock3, CornerUpLeft, FileSpreadsheet,
  FileText, MapPin, Pause, Paperclip, Play, Users,
} from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * The pieces a mail app draws (IMMERSIVE-005).
 *
 * Everything here is a description: a message body is paragraphs, a button inside an HTML
 * email is a drawn rectangle unless the scene anchors a control to it, an attachment is a
 * card with a name and a size, and quoted history is text behind the app's own "show quoted
 * text" toggle. Nothing loads, nothing links and nothing is styled by what it means.
 */

const PALETTE = [
  'bg-[#dfe9f7] text-[#1b4f8f]',
  'bg-[#f3e6d7] text-[#7a4a12]',
  'bg-[#e3f0e7] text-[#1f6a3c]',
  'bg-[#eee3f4] text-[#6a3f86]',
  'bg-[#f6e0e0] text-[#8a2f2f]',
]

/** A letter avatar, coloured by a stable hash of the name - never by the sender's standing. */
export function MailAvatar({ seed = '', size = 'md' }) {
  const words = String(seed).split(/[\s@._-]+/).filter(Boolean)
  const initials = (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '?').slice(0, 2))
    .toUpperCase()
  const hash = [...String(seed)].reduce((total, char) => (total * 31 + char.charCodeAt(0)) % 997, 7)
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-bold',
        size === 'sm' ? 'size-8 text-[0.66rem]' : 'size-10 text-[0.78rem]',
        PALETTE[hash % PALETTE.length],
      )}
    >
      {initials}
    </span>
  )
}

/** The file glyph an attachment card or a folder row carries. */
export function FileGlyph({ kind = '' }) {
  const Icon = /xls|csv|sheet/i.test(kind) ? FileSpreadsheet : FileText
  return (
    <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-md bg-mail-tint text-mail-accent">
      <Icon size={20} />
    </span>
  )
}

function Paragraphs({ paragraphs = [] }) {
  return paragraphs.map((paragraph, index) => (
    <p key={index} className="mt-2.5 text-[0.84rem] leading-relaxed break-words first:mt-0">
      {paragraph}
    </p>
  ))
}

/**
 * Quoted history behind the app's own toggle.
 *
 * Collapsed by default, the way a mail app hides "On … wrote:" - so reading the history is
 * something the learner chooses to do. Expanding it is local and records nothing.
 */
function Quoted({ beat }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 items-center gap-1 rounded-md px-1 text-[0.76rem] font-semibold text-mail-meta hover:bg-mail-tint"
      >
        {open ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
        {open ? 'Hide quoted text' : 'Show quoted text'}
      </button>
      {open && (
        <blockquote className="mt-1 border-l-2 border-mail-border pl-3 text-[0.78rem] text-mail-meta" data-testid="mail-quoted">
          <p className="font-semibold">{beat.header}</p>
          <Paragraphs paragraphs={beat.paragraphs} />
        </blockquote>
      )}
    </div>
  )
}

/**
 * An earlier message in the same conversation, collapsed to its sender and first line.
 * Opening it is local; the history is there to be read, not to be scored.
 */
export function EarlierMessage({ beat }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-mail-border" data-beat={beat.id}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-12 w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-mail-tint"
      >
        <MailAvatar seed={beat.from} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[0.8rem] font-semibold">{beat.from}</span>
            <span className="shrink-0 text-[0.66rem] text-mail-meta">{beat.time}</span>
          </span>
          {!open && <span className="block truncate text-[0.74rem] text-mail-meta">{beat.snippet}</span>}
          {open && beat.to && <span className="block text-[0.7rem] text-mail-meta">to {beat.to}</span>}
        </span>
      </button>
      {open && (
        <div className="px-3 pb-3 pl-[3.35rem]">
          <Paragraphs paragraphs={beat.paragraphs} />
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Voice attachment (IMMERSIVE-009)
 * ------------------------------------------------------------------ */

const secondsOf = (duration) => {
  const [minutes, seconds] = String(duration ?? '0:00').split(':').map(Number)
  return (minutes || 0) * 60 + (seconds || 0)
}

const clock = (value) => `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`

/** A stable bar height per position, so one attachment always draws the same waveform. */
function waveform(seed, bars) {
  let hash = 11
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 33 + seed.charCodeAt(index)) >>> 0
  return Array.from({ length: bars }, () => {
    hash = (hash * 1103515245 + 12345) >>> 0
    return 20 + ((hash >>> 16) % 80)
  })
}

const BARS = 34

/**
 * An audio attachment, drawn the way a mail client draws a voicemail (IMMERSIVE-009).
 *
 * Play and Show transcript are LOCAL. Playing moves a line across a drawn waveform on the
 * authored clock and does nothing else: there is no `<audio>`, no media file, no object URL
 * and no media API on this screen, which is what `SceneContainment.test.jsx` asserts. The
 * transcript is the mail app's own transcription and is where the words are, because a
 * simulation that cannot make a sound must say what was said somewhere honest. Neither
 * control records anything - listening to a message is reading it.
 */
function VoiceAttachment({ beat }) {
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
    <div className="px-4 pt-3.5" data-testid="mail-voice">
      <div className="rounded-lg border border-mail-border p-2.5">
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-md bg-mail-tint text-mail-accent">
            <AudioLines size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.8rem] font-semibold">{beat.fileName}</span>
            <span className="block text-[0.68rem] text-mail-meta">
              {['Audio', beat.duration, beat.size].filter(Boolean).join(' · ')}
            </span>
          </span>
          <Paperclip size={15} aria-hidden="true" className="shrink-0 text-mail-meta" />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-label={active ? 'Pause the audio attachment' : 'Play the audio attachment'}
            aria-pressed={active}
            className="grid size-10 shrink-0 place-items-center rounded-full text-mail-accent hover:bg-mail-tint"
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
                  index < heard ? 'bg-mail-accent' : 'bg-mail-meta/40',
                )}
                style={{ height: `${height}%` }}
              />
            ))}
          </span>
          <span className="shrink-0 text-[0.66rem] tabular-nums text-mail-meta" role="status">
            <span className="sr-only">Audio attachment, </span>
            {elapsed > 0 && !finished ? clock(elapsed) : beat.duration}
          </span>
        </div>

        {beat.transcript && (
          <div className="mt-1.5 border-t border-mail-border pt-1.5">
            <button
              type="button"
              onClick={() => setShowTranscript((value) => !value)}
              aria-expanded={showTranscript}
              className="inline-flex min-h-9 items-center gap-1 rounded-md px-1 text-[0.74rem] font-semibold text-mail-accent hover:bg-mail-tint"
            >
              {showTranscript ? <ChevronUp size={13} aria-hidden="true" /> : <ChevronDown size={13} aria-hidden="true" />}
              {showTranscript ? 'Hide transcript' : 'Show transcript'}
            </button>
            {showTranscript && (
              <p className="pb-1 text-[0.8rem] leading-relaxed break-words" data-testid="mail-transcript">
                {beat.transcript}
              </p>
            )}
          </div>
        )}
      </div>
      {beat.caption && <p className="mt-1.5 text-[0.68rem] text-mail-meta">{beat.caption}</p>}
    </div>
  )
}

/**
 * One piece of the open message, in reading order.
 *
 * `controls` are the scene affordances anchored to this beat - the button inside an HTML
 * email, the Preview and Download under an attachment - drawn by `renderControl` so they are
 * the same component as every other control in the simulation.
 */
export function MailBeat({ beat, controls = [], renderControl }) {
  switch (beat.kind) {
    case 'body':
      return (
        <div className="px-4 pt-3">
          {beat.greeting && <p className="mb-2.5 text-[0.84rem]">{beat.greeting}</p>}
          <Paragraphs paragraphs={beat.paragraphs} />
          {beat.signature?.length > 0 && (
            <div className="mt-3 text-[0.8rem] text-text">
              {beat.signature.map((line, index) => (
                <p key={index} className={index === 0 ? 'font-semibold' : 'text-mail-meta'}>{line}</p>
              ))}
            </div>
          )}
          {beat.footer && (
            <p className="mt-4 border-t border-mail-border pt-2 text-[0.68rem] text-mail-meta">{beat.footer}</p>
          )}
          {beat.quoted && <Quoted beat={beat.quoted} />}
        </div>
      )

    case 'brand':
      /** An HTML email's masthead: a monogram block and a name. Drawn, never an image. */
      return (
        <div className="mx-4 mt-3 flex items-center gap-2.5 rounded-t-md px-3 py-2.5" style={{ background: beat.color ?? '#33475b' }}>
          <span aria-hidden="true" className="grid size-8 place-items-center rounded bg-white/20 text-[0.72rem] font-bold text-white">
            {beat.monogram}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[0.82rem] font-bold text-white">{beat.name}</span>
            {beat.tagline && <span className="block truncate text-[0.66rem] text-white/80">{beat.tagline}</span>}
          </span>
        </div>
      )

    case 'button':
      return (
        <div className="px-4 pt-3.5 text-center" data-testid="mail-cta">
          {controls.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-2">{controls.map(renderControl)}</div>
          ) : (
            <span className="inline-flex min-h-11 items-center rounded-md bg-mail-accent px-5 text-[0.82rem] font-semibold text-white">
              {beat.label}
            </span>
          )}
          {beat.caption && <p className="mt-1.5 text-[0.68rem] text-mail-meta break-all">{beat.caption}</p>}
        </div>
      )

    case 'table':
      /**
       * A key/value block an HTML email lays out. IMMERSIVE-009: a control may be anchored to
       * it, the way `attachment` and `invite` already allow, so a scene can put the thing that
       * acts on these details directly under them (E22's transfer sheet).
       */
      return (
        <div className="px-4 pt-3">
          <dl className="divide-y divide-mail-border rounded-md border border-mail-border">
            {beat.rows.map((row) => (
              <div key={row.label} className="flex flex-wrap gap-x-3 px-3 py-1.5">
                <dt className="w-28 shrink-0 text-[0.74rem] font-semibold text-mail-meta">{row.label}</dt>
                <dd className="min-w-0 flex-1 text-[0.8rem] break-words">{row.value}</dd>
              </div>
            ))}
          </dl>
          {controls.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">{controls.map(renderControl)}</div>
          )}
        </div>
      )

    case 'steps':
      /** A shipment timeline, the way a courier's HTML mail draws it. Text and dots only. */
      return (
        <ol className="mx-4 mt-3 space-y-2 rounded-md border border-mail-border px-3 py-2.5">
          {beat.steps.map((step, index) => (
            <li key={step.label} className="flex items-start gap-2.5">
              <span
                aria-hidden="true"
                className={cn(
                  'mt-1 size-2.5 shrink-0 rounded-full',
                  index < beat.done ? 'bg-mail-accent' : 'border border-mail-meta bg-mail-surface',
                )}
              />
              <span className="min-w-0 text-[0.78rem]">
                <span className="font-semibold">{step.label}</span>
                {step.detail && <span className="block text-[0.7rem] text-mail-meta">{step.detail}</span>}
              </span>
            </li>
          ))}
        </ol>
      )

    case 'timer':
      /** A countdown printed in the message. Text, not a live clock. */
      return (
        <p className="mx-4 mt-3 flex items-center gap-2 rounded-md border border-mail-border bg-mail-tint px-3 py-2 text-[0.8rem]">
          <Clock3 size={15} aria-hidden="true" className="shrink-0 text-mail-meta" />
          <span className="min-w-0">
            <span className="block text-[0.68rem] font-semibold text-mail-meta uppercase">{beat.label}</span>
            <span className="font-bold tabular-nums">{beat.value}</span>
          </span>
        </p>
      )

    case 'attachment':
      return (
        <div className="px-4 pt-3.5" data-testid="mail-attachment">
          <div className="flex items-center gap-2.5 rounded-lg border border-mail-border p-2.5">
            <FileGlyph kind={beat.fileKind} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.8rem] font-semibold">{beat.fileName}</span>
              <span className="block text-[0.68rem] text-mail-meta">
                {[beat.fileKind?.toUpperCase(), beat.size].filter(Boolean).join(' · ')}
              </span>
            </span>
            <Paperclip size={15} aria-hidden="true" className="shrink-0 text-mail-meta" />
          </div>
          {controls.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">{controls.map(renderControl)}</div>
          )}
        </div>
      )

    case 'voice':
      /** An audio attachment with a local player and the app's own transcript. */
      return <VoiceAttachment beat={beat} />

    case 'invite':
      /**
       * A calendar invitation, the way a mail app draws one: a header band, the when/where
       * facts, the organizer and attendees, and the app's Accept / Tentative / Decline controls
       * (the scene's anchored affordances). Drawn, never added to any real calendar.
       */
      return (
        <div className="mx-4 mt-3 overflow-hidden rounded-lg border border-mail-border" data-testid="mail-invite">
          <div className="flex items-center gap-2 bg-mail-tint px-3 py-2">
            <CalendarDays size={16} aria-hidden="true" className="shrink-0 text-mail-accent" />
            <span className="min-w-0 text-[0.84rem] font-semibold break-words">{beat.title}</span>
          </div>
          <dl className="divide-y divide-mail-border px-3 py-1">
            <div className="flex items-start gap-2 py-1.5">
              <Clock3 size={13} aria-hidden="true" className="mt-0.5 shrink-0 text-mail-meta" />
              <dd className="min-w-0 text-[0.8rem] break-words">{beat.when}</dd>
            </div>
            {beat.where && (
              <div className="flex items-start gap-2 py-1.5">
                <MapPin size={13} aria-hidden="true" className="mt-0.5 shrink-0 text-mail-meta" />
                <dd className="min-w-0 text-[0.8rem] break-words">{beat.where}</dd>
              </div>
            )}
            {beat.organizer && (
              <div className="flex items-start gap-2 py-1.5">
                <span className="mt-0.5 shrink-0 text-[0.66rem] font-semibold text-mail-meta uppercase">By</span>
                <dd className="min-w-0 text-[0.8rem] break-words">{beat.organizer}</dd>
              </div>
            )}
            {beat.attendees?.length > 0 && (
              <div className="flex items-start gap-2 py-1.5">
                <Users size={13} aria-hidden="true" className="mt-0.5 shrink-0 text-mail-meta" />
                <dd className="min-w-0 text-[0.78rem] break-words text-mail-meta">{beat.attendees.join(', ')}</dd>
              </div>
            )}
          </dl>
          {beat.note && <p className="px-3 pb-2 text-[0.72rem] text-mail-meta">{beat.note}</p>}
          {controls.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-mail-border bg-mail-surface px-3 py-2" data-testid="mail-invite-actions">
              {controls.map(renderControl)}
            </div>
          )}
        </div>
      )

    case 'notice':
      /** The mail app's own one-line note ("You replied on …"). Never a verdict. */
      return (
        <p className="mx-4 mt-3 rounded-md bg-mail-tint px-3 py-2 text-[0.74rem] text-mail-meta">
          {beat.text}
        </p>
      )

    case 'sent':
      /** The learner's own message, as the thread shows it once it has gone. */
      return (
        <div className="mx-4 mt-3 rounded-lg border border-mail-border px-3 py-2.5" data-beat={beat.id}>
          <p className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-mail-meta">
            <CornerUpLeft size={12} aria-hidden="true" />
            {beat.label ?? 'You'} · to {beat.to}
            {beat.time && <span className="ml-auto font-normal">{beat.time}</span>}
          </p>
          <p className="mt-1 text-[0.82rem] break-words">{beat.text}</p>
        </div>
      )

    default:
      return beat.text ? <p className="px-4 pt-3 text-[0.82rem]">{beat.text}</p> : null
  }
}
