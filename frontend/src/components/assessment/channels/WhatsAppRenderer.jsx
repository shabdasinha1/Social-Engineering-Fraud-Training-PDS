import { useEffect, useRef } from 'react'
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCheck,
  FileText,
  Image as ImageIcon,
  Link2,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Smile,
  User,
  Video,
} from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * WhatsApp-style renderer for the generic scenario screen graph. It reads the
 * same `screen` shape every channel uses - it only presents it differently.
 *
 * Everything shown is fictional scenario data from the database. Links are
 * rendered as text; nothing here can navigate, send or fetch anything.
 */

const TICKS = {
  sent: { Icon: Check, className: 'text-wa-meta' },
  delivered: { Icon: CheckCheck, className: 'text-wa-meta' },
  read: { Icon: CheckCheck, className: 'text-wa-tick' },
}

/** Initials for a name, or a person icon for a phone number. */
function Avatar({ title = '', size = 'md' }) {
  const looksLikeNumber = /^[+\d\s()-]+$/.test(title.trim())
  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-black/15 font-semibold text-white',
        size === 'lg' ? 'size-11 text-sm' : 'size-9 text-xs',
      )}
    >
      {looksLikeNumber || !initials ? <User size={size === 'lg' ? 20 : 17} /> : initials}
    </span>
  )
}

function MessageMeta({ time, status, outgoing }) {
  const tick = outgoing && status ? TICKS[status] : null

  return (
    <span className="ml-2 inline-flex translate-y-0.5 items-center gap-1 text-[0.65rem] text-wa-meta">
      {time}
      {tick && <tick.Icon size={13} className={tick.className} aria-hidden="true" />}
    </span>
  )
}

function Bubble({ outgoing, children }) {
  return (
    <div className={cn('flex px-3', outgoing ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'relative max-w-[80%] rounded-lg px-2.5 py-1.5 text-[0.82rem] leading-snug shadow-xs',
          'break-words hyphens-auto',
          outgoing
            ? 'rounded-tr-none bg-wa-bubble-out text-text'
            : 'rounded-tl-none bg-wa-bubble-in text-text',
        )}
      >
        {children}
      </div>
    </div>
  )
}

function ChatBlock({ block }) {
  const outgoing = block.from === 'me'

  switch (block.type) {
    case 'note':
      return (
        <div className="flex justify-center px-3">
          <span className="rounded-md bg-white/70 px-2.5 py-1 text-[0.68rem] font-medium text-wa-meta shadow-xs">
            {block.text}
          </span>
        </div>
      )

    case 'message':
      return (
        <Bubble outgoing={outgoing}>
          <p className="inline text-balance-pretty whitespace-pre-line">{block.text}</p>
          <MessageMeta time={block.time} status={block.status} outgoing={outgoing} />
        </Bubble>
      )

    case 'linkPreview':
      return (
        <Bubble outgoing={outgoing}>
          <span className="block rounded-md bg-black/5 p-2">
            {block.title && <span className="block text-xs font-semibold">{block.title}</span>}
            {block.description && (
              <span className="mt-0.5 block text-xs text-wa-meta">{block.description}</span>
            )}
            <span className="mt-1 flex items-start gap-1 text-[0.7rem] break-all text-info">
              <Link2 size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
              {block.displayUrl}
            </span>
          </span>
          <MessageMeta time={block.time} status={block.status} outgoing={outgoing} />
        </Bubble>
      )

    case 'image':
      return (
        <Bubble outgoing={outgoing}>
          <span className="grid h-28 w-44 place-items-center rounded-md bg-black/10">
            <ImageIcon size={22} className="text-wa-meta" aria-hidden="true" />
          </span>
          {block.caption && <p className="mt-1 text-balance-pretty">{block.caption}</p>}
          <MessageMeta time={block.time} status={block.status} outgoing={outgoing} />
        </Bubble>
      )

    case 'attachment':
      return (
        <Bubble outgoing={outgoing}>
          <span className="flex items-center gap-2 rounded-md bg-black/5 p-2">
            <FileText size={18} className="shrink-0 text-wa-meta" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block truncate text-xs font-medium">{block.fileName}</span>
              {block.fileSize && (
                <span className="block text-[0.65rem] text-wa-meta">{block.fileSize}</span>
              )}
            </span>
          </span>
          <MessageMeta time={block.time} status={block.status} outgoing={outgoing} />
        </Bubble>
      )

    default:
      // Unknown block: show its text if it has any, otherwise skip quietly.
      return typeof block.text === 'string' ? (
        <Bubble outgoing={outgoing}>
          <p className="text-balance-pretty">{block.text}</p>
        </Bubble>
      ) : null
  }
}

function ChatList({ screen, onOpen }) {
  const rows = (screen.blocks ?? []).filter((block) => block.type === 'listItem')

  return (
    <ul className="divide-y divide-border bg-surface">
      {rows.map((row, index) => {
        const openable = Boolean(row.target)
        const content = (
          <>
            <Avatar title={row.title} size="lg" />
            <span className="min-w-0 flex-1 text-left">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-semibold">{row.title}</span>
                {row.time && (
                  <span
                    className={cn(
                      'shrink-0 text-[0.65rem]',
                      row.unread ? 'font-semibold text-channel-whatsapp' : 'text-wa-meta',
                    )}
                  >
                    {row.time}
                  </span>
                )}
              </span>
              <span className="mt-0.5 flex items-center justify-between gap-2">
                <span className="truncate text-xs text-wa-meta">{row.preview}</span>
                {row.unread && (
                  <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-channel-whatsapp text-[0.6rem] font-bold text-white">
                    1
                  </span>
                )}
              </span>
            </span>
          </>
        )

        return (
          <li key={`${row.title}-${index}`}>
            {openable ? (
              <button
                type="button"
                onClick={() => onOpen(row.target)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-secondary-soft"
              >
                {content}
              </button>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2.5">{content}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function WhatsAppRenderer({ screen, actions, backAction, onAction, onOpen }) {
  const isList = screen.kind === 'list'
  const header = screen.header ?? {}
  const scrollRef = useRef(null)

  // Open a conversation on the newest message, the way a phone would.
  useEffect(() => {
    if (!isList && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [screen.id, isList])

  return (
    <div className="flex h-full flex-col bg-wa-canvas">
      <div className="flex items-center gap-2.5 bg-wa-header px-2.5 py-2 text-white">
        {backAction ? (
          <button
            type="button"
            onClick={() => onAction(backAction)}
            aria-label={backAction.label || 'Back'}
            className="grid size-7 shrink-0 place-items-center rounded-full hover:bg-white/15"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        ) : (
          <span className="w-1" />
        )}

        {!isList && <Avatar title={header.title} />}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{header.title}</p>
          {header.subtitle && (
            <p className="truncate text-[0.68rem] text-white/75">{header.subtitle}</p>
          )}
        </div>

        <span aria-hidden="true" className="flex items-center gap-3 text-white/85">
          {isList ? (
            <>
              <Camera size={17} />
              <Search size={17} />
            </>
          ) : (
            <>
              <Video size={17} />
              <Phone size={16} />
            </>
          )}
          <MoreVertical size={17} />
        </span>
      </div>

      <div
        ref={scrollRef}
        className={cn('flex-1 overflow-y-auto overscroll-contain', isList ? '' : 'space-y-1.5 py-2.5')}
      >
        {isList ? (
          <ChatList screen={screen} onOpen={onOpen} />
        ) : (
          (screen.blocks ?? []).map((block, index) => (
            <ChatBlock key={index} block={block} />
          ))
        )}
      </div>

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-black/10 bg-wa-canvas px-2.5 py-2">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onAction(action)}
              className="rounded-full border border-channel-whatsapp/40 bg-surface px-3 py-1.5 text-xs font-semibold text-channel-whatsapp transition-colors duration-150 hover:bg-channel-whatsapp/10"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {!isList && (
        // Chrome only. Deliberately not an input - nothing can be typed or sent.
        <div
          aria-hidden="true"
          className="flex items-center gap-2 bg-wa-canvas px-2.5 pb-2.5 pt-1"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-surface px-3 py-2 shadow-xs">
            <Smile size={16} className="shrink-0 text-wa-meta" />
            <span className="min-w-0 flex-1 truncate text-xs text-wa-meta">Message</span>
            <Paperclip size={15} className="shrink-0 text-wa-meta" />
            <Camera size={15} className="shrink-0 text-wa-meta" />
          </div>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-wa-header text-white">
            <Mic size={16} />
          </span>
        </div>
      )}
    </div>
  )
}
