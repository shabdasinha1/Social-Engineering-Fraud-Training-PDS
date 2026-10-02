import { CircleDollarSign, Link2, Paperclip, PhoneCall, ShieldAlert } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * The pieces the phone's Messages app draws (IMMERSIVE-010).
 *
 * Deliberately not the messenger's vocabulary. A text has no delivery ticks, no "last
 * seen", no reactions, no forwarding provenance and no avatar in the thread: it has a
 * header at the top, grey bubbles from them and blue ones from you, a date divider, the
 * carrier's own system lines, and - the two things that make a modern SMS app what it is
 * - a link preview card the app builds from the address in the text, and a warning bar
 * above a sender you do not know.
 *
 * Everything here is a description. Nothing loads, nothing links, nothing dials, and no
 * beat is styled by what it means.
 */

/** A day divider, the way the app groups a thread by date. */
function DayDivider({ beat }) {
  return (
    <div className="flex justify-center py-2">
      <span className="rounded-full bg-sms-tint px-2.5 py-0.5 text-[0.64rem] font-semibold tracking-wide text-sms-meta uppercase">
        {beat.text}
      </span>
    </div>
  )
}

/**
 * The carrier's or the app's own line in the thread - "Sent from an unknown number",
 * "You blocked this sender". Never a verdict on the message.
 */
function SystemLine({ beat }) {
  return (
    <p className="mx-4 my-1.5 rounded-md bg-sms-tint px-3 py-1.5 text-center text-[0.72rem] text-sms-meta text-balance-pretty">
      {beat.text}
    </p>
  )
}

function Bubble({ beat, children, controls = [], renderControl }) {
  const outgoing = beat.from === 'me'
  return (
    <div className={cn('flex px-3 pt-1', outgoing ? 'justify-end' : 'justify-start')} data-beat={beat.id}>
      <div className="max-w-[86%] min-w-0">
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2 text-[0.84rem] leading-relaxed break-words hyphens-auto',
            outgoing
              ? 'rounded-br-md bg-sms-bubble-out text-white'
              : 'rounded-bl-md bg-sms-bubble-in text-text',
          )}
        >
          {children}
        </div>
        {beat.time && (
          <p className={cn('mt-0.5 px-1 text-[0.62rem] tabular-nums text-sms-meta', outgoing ? 'text-right' : 'text-left')}>
            {beat.time}
            {beat.via ? ` · ${beat.via}` : ''}
          </p>
        )}
        {controls.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">{controls.map(renderControl)}</div>
        )}
      </div>
    </div>
  )
}

/**
 * The link preview card the Messages app builds under a text that contains an address.
 *
 * It shows the address AS WRITTEN, which is the point: a shortener shows as a shortener,
 * and finding out where it goes is something the learner has to do on the details screen.
 * There is no anchor and no `href` here; the card is drawn text.
 */
function LinkCard({ beat, controls, renderControl }) {
  return (
    <div className="px-3 pt-1.5" data-beat={beat.id} data-testid="sms-link-card">
      <div className="max-w-[86%] overflow-hidden rounded-xl border border-sms-border">
        <div className="flex items-center gap-2 bg-sms-tint px-3 py-2">
          <Link2 size={15} aria-hidden="true" className="shrink-0 text-sms-meta" />
          <span className="min-w-0 truncate text-[0.76rem] font-semibold">{beat.shown}</span>
        </div>
        <p className="px-3 py-2 text-[0.74rem] text-sms-meta text-balance-pretty">{beat.caption}</p>
        {controls.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-sms-border px-3 py-2">
            {controls.map(renderControl)}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * A number written in a text, as the app makes it tappable.
 *
 * Drawn as the app draws it and nothing more: tapping whatever the scene anchors here is
 * the scene's business, and no dialer exists anywhere in the product.
 */
function NumberCard({ beat, controls, renderControl }) {
  return (
    <div className="px-3 pt-1.5" data-beat={beat.id} data-testid="sms-number-card">
      <div className="max-w-[86%] overflow-hidden rounded-xl border border-sms-border">
        <div className="flex items-center gap-2 bg-sms-tint px-3 py-2">
          <PhoneCall size={15} aria-hidden="true" className="shrink-0 text-sms-meta" />
          <span className="min-w-0 truncate text-[0.82rem] font-semibold tabular-nums">{beat.number}</span>
        </div>
        {beat.caption && <p className="px-3 py-2 text-[0.74rem] text-sms-meta">{beat.caption}</p>}
        {controls.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-sms-border px-3 py-2">
            {controls.map(renderControl)}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * A transaction line, the way a bank's alert lays one out inside the message.
 *
 * Text and rules only - no logo, no image, and no styling that says whether the alert is
 * to be trusted.
 */
function AmountCard({ beat, controls, renderControl }) {
  return (
    <div className="px-3 pt-1.5" data-beat={beat.id} data-testid="sms-amount-card">
      <div className="max-w-[86%] overflow-hidden rounded-xl border border-sms-border">
        <div className="flex items-center gap-2 bg-sms-tint px-3 py-2">
          <CircleDollarSign size={15} aria-hidden="true" className="shrink-0 text-sms-meta" />
          <span className="text-[0.84rem] font-bold tabular-nums">{beat.amount}</span>
        </div>
        <dl className="divide-y divide-sms-border">
          {beat.rows.map((row) => (
            <div key={row.label} className="flex flex-wrap gap-x-3 px-3 py-1.5">
              <dt className="w-24 shrink-0 text-[0.72rem] font-semibold text-sms-meta">{row.label}</dt>
              <dd className="min-w-0 flex-1 text-[0.78rem] break-words tabular-nums">{row.value}</dd>
            </div>
          ))}
        </dl>
        {controls.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-sms-border px-3 py-2">
            {controls.map(renderControl)}
          </div>
        )}
      </div>
    </div>
  )
}

/** An MMS attachment card. A name and a size; nothing is ever opened or executed. */
function AttachmentCard({ beat, controls, renderControl }) {
  return (
    <div className="px-3 pt-1.5" data-beat={beat.id} data-testid="sms-attachment-card">
      <div className="flex max-w-[86%] items-center gap-2.5 rounded-xl border border-sms-border p-2.5">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-md bg-sms-tint text-sms-accent">
          <Paperclip size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.8rem] font-semibold">{beat.fileName}</span>
          <span className="block text-[0.68rem] text-sms-meta">
            {[beat.fileKind, beat.size].filter(Boolean).join(' · ')}
          </span>
        </span>
      </div>
      {controls.length > 0 && (
        <div className="mt-1.5 flex max-w-[86%] flex-wrap gap-2">{controls.map(renderControl)}</div>
      )}
    </div>
  )
}

/**
 * The Messages app's own spam bar above a thread from a sender that is not in the
 * contacts. It is the app's chrome, not a verdict on this particular message: the same
 * bar appears above every unknown sender.
 */
export function SpamBar({ text, controls = [], renderControl }) {
  return (
    <div className="shrink-0 border-b border-sms-bar-border bg-sms-bar px-3 py-2" data-testid="sms-spam-bar">
      <p className="flex items-start gap-2 text-[0.74rem]">
        <ShieldAlert size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-text" />
        <span className="min-w-0 text-balance-pretty">{text}</span>
      </p>
      {controls.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-2">{controls.map(renderControl)}</div>
      )}
    </div>
  )
}

/** One thing in the thread, in reading order. */
export function SmsBeat({ beat, controls = [], renderControl }) {
  switch (beat.kind) {
    case 'day':
      return <DayDivider beat={beat} />

    case 'system':
      return <SystemLine beat={beat} />

    case 'message':
      return (
        <Bubble beat={beat} controls={controls} renderControl={renderControl}>
          <p className="whitespace-pre-line">{beat.text}</p>
        </Bubble>
      )

    case 'link':
      return <LinkCard beat={beat} controls={controls} renderControl={renderControl} />

    case 'number':
      return <NumberCard beat={beat} controls={controls} renderControl={renderControl} />

    case 'amount':
      return <AmountCard beat={beat} controls={controls} renderControl={renderControl} />

    case 'attachment':
      return <AttachmentCard beat={beat} controls={controls} renderControl={renderControl} />

    default:
      return beat.text
        ? <Bubble beat={beat} controls={controls} renderControl={renderControl}>{beat.text}</Bubble>
        : null
  }
}
