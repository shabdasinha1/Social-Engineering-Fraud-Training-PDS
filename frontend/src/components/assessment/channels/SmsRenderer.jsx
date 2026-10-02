import { useEffect, useRef } from 'react'
import {
  ChevronLeft,
  FileText,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Search,
  SquarePen,
  User,
} from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * SMS-style renderer for the generic scenario screen graph. Same `screen`
 * shape as every other renderer - only the presentation differs.
 *
 * Everything shown is fictional scenario data from the database. Links are
 * rendered as text; nothing here can dial, navigate, send or fetch anything.
 */

/** A registered sender ID looks different from a raw number - that matters. */
function isSenderId(title = '') {
  return /^[A-Z]{2}-[A-Z0-9]+$/.test(title.trim())
}

function Avatar({ title = '', size = 'md' }) {
  const senderId = isSenderId(title)
  const initials = title.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()

  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-channel-sms/12 font-semibold text-channel-sms',
        size === 'lg' ? 'size-10 text-xs' : 'size-8 text-[0.65rem]',
      )}
    >
      {senderId ? <MessageSquare size={size === 'lg' ? 18 : 15} /> : initials || <User size={16} />}
    </span>
  )
}

function SmsBlock({ block }) {
  const outgoing = block.from === 'me'

  switch (block.type) {
    case 'note':
      return (
        <div className="flex justify-center px-3 py-1">
          <span className="text-[0.65rem] font-medium tracking-wide text-text-muted uppercase">
            {block.text}
          </span>
        </div>
      )

    case 'message':
      return (
        <div className={cn('flex px-3', outgoing ? 'justify-end' : 'justify-start')}>
          <div className="max-w-[86%]">
            <div
              className={cn(
                'rounded-2xl px-3.5 py-2 text-[0.82rem] leading-relaxed',
                'break-words hyphens-auto',
                outgoing
                  ? 'rounded-br-md bg-channel-sms text-white'
                  : 'rounded-bl-md bg-secondary-soft text-text',
              )}
            >
              <p className="whitespace-pre-line">{block.text}</p>
            </div>
            {block.time && (
              <p
                className={cn(
                  'mt-0.5 px-1 text-[0.62rem] text-text-muted',
                  outgoing ? 'text-right' : 'text-left',
                )}
              >
                {block.time}
                {outgoing && block.status ? ` · ${block.status}` : ''}
              </p>
            )}
          </div>
        </div>
      )

    case 'attachment':
      return (
        <div className={cn('flex px-3', outgoing ? 'justify-end' : 'justify-start')}>
          <span className="flex max-w-[86%] items-center gap-2 rounded-2xl border border-border bg-surface p-2.5">
            <Paperclip size={15} className="shrink-0 text-text-muted" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block truncate text-xs font-medium">{block.fileName}</span>
              {block.fileSize && (
                <span className="block text-[0.62rem] text-text-muted">{block.fileSize}</span>
              )}
            </span>
          </span>
        </div>
      )

    case 'image':
      return (
        <div className={cn('flex px-3', outgoing ? 'justify-end' : 'justify-start')}>
          <span className="grid h-24 w-36 place-items-center rounded-2xl bg-secondary-soft text-text-muted">
            <FileText size={18} aria-hidden="true" />
          </span>
        </div>
      )

    case 'linkPreview':
      // SMS has no rich previews - show the address as the plain text it is.
      return (
        <div className="flex justify-start px-3">
          <div className="max-w-[86%] rounded-2xl rounded-bl-md bg-secondary-soft px-3.5 py-2">
            <p className="text-[0.82rem] break-all text-info">{block.displayUrl}</p>
          </div>
        </div>
      )

    default:
      return typeof block.text === 'string' ? (
        <div className="flex justify-start px-3">
          <div className="max-w-[86%] rounded-2xl rounded-bl-md bg-secondary-soft px-3.5 py-2">
            <p className="text-[0.82rem] break-words">{block.text}</p>
          </div>
        </div>
      ) : null
  }
}

function MessageList({ screen, onOpen }) {
  return (
    <ul>
      {(screen.blocks ?? []).map((block, index) => {
        if (block.type !== 'listItem') return null

        const row = (
          <>
            <Avatar title={block.title} size="lg" />
            <span className="min-w-0 flex-1 text-left">
              <span className="flex items-baseline justify-between gap-2">
                <span
                  className={cn(
                    'truncate text-sm',
                    block.unread ? 'font-bold text-text' : 'font-semibold text-text',
                  )}
                >
                  {block.title}
                </span>
                {block.time && (
                  <span className="shrink-0 text-[0.65rem] text-text-muted">{block.time}</span>
                )}
              </span>
              <span className="mt-0.5 flex items-center gap-2">
                <span
                  className={cn(
                    'truncate text-xs',
                    block.unread ? 'font-medium text-text' : 'text-text-muted',
                  )}
                >
                  {block.preview}
                </span>
                {block.unread && (
                  <span
                    aria-hidden="true"
                    className="ml-auto size-2 shrink-0 rounded-full bg-channel-sms"
                  />
                )}
              </span>
            </span>
          </>
        )

        return (
          <li key={index} className="border-b border-border last:border-b-0">
            {block.target ? (
              <button
                type="button"
                onClick={() => onOpen(block.target)}
                className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors duration-150 hover:bg-secondary-soft"
              >
                {row}
              </button>
            ) : (
              <div className="flex items-center gap-3 px-3 py-3">{row}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

const LIST_KINDS = new Set(['list', 'inbox'])

export function SmsRenderer({ screen, actions, backAction, onAction, onOpen }) {
  const isList = LIST_KINDS.has(screen.kind)
  const header = screen.header ?? {}
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!isList && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [screen.id, isList])

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center gap-2.5 border-b border-border bg-surface px-3 py-2.5">
        {backAction ? (
          <button
            type="button"
            onClick={() => onAction(backAction)}
            aria-label={backAction.label || 'Back'}
            className="grid size-6 shrink-0 place-items-center rounded-full text-text-muted hover:bg-secondary-soft"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
        ) : null}

        {!isList && <Avatar title={header.title} />}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{header.title}</p>
          {header.subtitle && (
            <p className="truncate text-[0.68rem] text-text-muted">{header.subtitle}</p>
          )}
        </div>

        <span aria-hidden="true" className="flex items-center gap-3 text-text-muted">
          {isList ? <Search size={17} /> : null}
          <MoreVertical size={17} />
        </span>
      </div>

      <div
        ref={scrollRef}
        className={cn('flex-1 overflow-y-auto overscroll-contain', isList ? '' : 'space-y-2 py-3')}
      >
        {isList ? (
          <MessageList screen={screen} onOpen={onOpen} />
        ) : (
          (screen.blocks ?? []).map((block, index) => <SmsBlock key={index} block={block} />)
        )}
      </div>

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border bg-surface px-3 py-2">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onAction(action)}
              className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-semibold text-channel-sms transition-colors duration-150 hover:bg-secondary-soft"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Chrome only - deliberately not an input, so nothing can be typed or sent. */}
      <div
        aria-hidden="true"
        className="flex items-center gap-2 border-t border-border bg-surface px-3 py-2"
      >
        {isList ? (
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-channel-sms/12 px-3 py-1.5 text-xs font-semibold text-channel-sms">
            <SquarePen size={14} />
            Start chat
          </span>
        ) : (
          <>
            <span className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-xs text-text-muted">
                Text message
              </span>
            </span>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-channel-sms text-white">
              <SquarePen size={15} />
            </span>
          </>
        )}
      </div>
    </div>
  )
}
