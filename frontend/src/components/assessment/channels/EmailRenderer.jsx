import {
  Archive,
  ChevronLeft,
  CornerUpLeft,
  FileText,
  Link2,
  Menu,
  Paperclip,
  Search,
  Star,
  Trash2,
} from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * Email-style renderer for the generic scenario screen graph. Same `screen`
 * shape as every other renderer - only the presentation differs.
 *
 * Everything shown is fictional scenario data from the database. Addresses and
 * links are rendered as text; nothing here can open, download, reply or fetch.
 */

function Avatar({ name = '' }) {
  const initial = name.replace(/[^A-Za-z]/g, '').slice(0, 1).toUpperCase()

  return (
    <span
      aria-hidden="true"
      className="grid size-9 shrink-0 place-items-center rounded-full bg-channel-email/12 text-sm font-semibold text-channel-email"
    >
      {initial || <FileText size={16} />}
    </span>
  )
}

function EmailBlock({ block, onOpen }) {
  switch (block.type) {
    case 'emailHeader':
      return (
        <div className="border-b border-border px-3 pb-3">
          <p className="text-[0.95rem] leading-snug font-bold break-words">{block.subject}</p>

          <div className="mt-2.5 flex items-start gap-2.5">
            <Avatar name={block.fromName} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold break-words">{block.fromName}</p>
              {/* The address is the signal - always shown in full, never truncated. */}
              <p className="text-[0.7rem] break-all text-text-muted">
                &lt;{block.fromAddress}&gt;
              </p>
              {block.to && (
                <p className="mt-0.5 text-[0.7rem] break-all text-text-muted">
                  to {block.to}
                </p>
              )}
            </div>
          </div>

          {block.time && (
            <p className="mt-2 text-[0.7rem] text-text-muted">{block.time}</p>
          )}
        </div>
      )

    case 'emailBody':
      return (
        <div className="space-y-2.5 px-3">
          {(block.paragraphs ?? []).map((paragraph, index) => (
            <p key={index} className="text-[0.82rem] leading-relaxed break-words">
              {paragraph}
            </p>
          ))}
        </div>
      )

    case 'linkPreview':
      return (
        <div className="px-3">
          <div className="rounded-md border border-border bg-secondary-soft p-2.5">
            {block.title && <p className="text-xs font-semibold break-words">{block.title}</p>}
            {block.description && (
              <p className="mt-0.5 text-xs break-words text-text-muted">{block.description}</p>
            )}
            <p className="mt-1.5 flex items-start gap-1 text-[0.7rem] break-all text-info">
              <Link2 size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
              {block.displayUrl}
            </p>
          </div>
        </div>
      )

    case 'attachment': {
      const chip = (
        <>
          <span className="grid size-8 shrink-0 place-items-center rounded bg-channel-email/12 text-channel-email">
            <Paperclip size={15} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-xs font-medium">{block.fileName}</span>
            {block.fileSize && (
              <span className="block text-[0.65rem] text-text-muted">
                {block.fileSize}
                {block.fileKind ? ` · ${block.fileKind.toUpperCase()}` : ''}
              </span>
            )}
          </span>
        </>
      )

      return (
        <div className="px-3">
          {block.target ? (
            <button
              type="button"
              onClick={() => onOpen(block.target)}
              className="flex w-full items-center gap-2.5 rounded-md border border-border bg-surface p-2.5 transition-colors duration-150 hover:bg-secondary-soft"
            >
              {chip}
            </button>
          ) : (
            <div className="flex items-center gap-2.5 rounded-md border border-border bg-surface p-2.5">
              {chip}
            </div>
          )}
        </div>
      )
    }

    case 'note':
      return (
        <p className="px-3 text-[0.68rem] font-semibold tracking-wide text-text-muted uppercase">
          {block.text}
        </p>
      )

    case 'message':
      return (
        <p className="px-3 text-[0.82rem] leading-relaxed break-words">{block.text}</p>
      )

    default:
      return typeof block.text === 'string' ? (
        <p className="px-3 text-[0.82rem] leading-relaxed break-words">{block.text}</p>
      ) : null
  }
}

function Inbox({ screen, onOpen }) {
  return (
    <ul>
      {(screen.blocks ?? []).map((block, index) => {
        if (block.type !== 'listItem') return null

        const row = (
          <>
            <Avatar name={block.title} />
            <span className="min-w-0 flex-1 text-left">
              <span className="flex items-baseline justify-between gap-2">
                <span
                  className={cn(
                    'truncate text-sm',
                    block.unread ? 'font-bold' : 'font-medium text-text-muted',
                  )}
                >
                  {block.title}
                </span>
                {block.time && (
                  <span
                    className={cn(
                      'shrink-0 text-[0.65rem]',
                      block.unread ? 'font-semibold text-channel-email' : 'text-text-muted',
                    )}
                  >
                    {block.time}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  'mt-0.5 block truncate text-xs',
                  block.unread ? 'font-medium text-text' : 'text-text-muted',
                )}
              >
                {block.preview}
              </span>
            </span>
            <Star
              size={14}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-border-strong"
            />
          </>
        )

        return (
          <li key={index} className="border-b border-border last:border-b-0">
            {block.target ? (
              <button
                type="button"
                onClick={() => onOpen(block.target)}
                className="flex w-full items-start gap-3 px-3 py-3 text-left transition-colors duration-150 hover:bg-secondary-soft"
              >
                {row}
              </button>
            ) : (
              <div className="flex items-start gap-3 px-3 py-3">{row}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

const INBOX_KINDS = new Set(['inbox', 'list'])

export function EmailRenderer({ screen, actions, backAction, onAction, onOpen }) {
  const isInbox = INBOX_KINDS.has(screen.kind)
  const header = screen.header ?? {}

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
        ) : (
          <Menu size={18} aria-hidden="true" className="shrink-0 text-text-muted" />
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{isInbox ? header.title : 'Inbox'}</p>
          {isInbox && header.subtitle && (
            <p className="truncate text-[0.68rem] text-text-muted">{header.subtitle}</p>
          )}
        </div>

        <span aria-hidden="true" className="flex items-center gap-3 text-text-muted">
          {isInbox ? (
            <Search size={17} />
          ) : (
            <>
              <Archive size={16} />
              <Trash2 size={16} />
            </>
          )}
        </span>
      </div>

      <div className={cn('flex-1 overflow-y-auto overscroll-contain', isInbox ? '' : 'space-y-3 py-3')}>
        {isInbox ? (
          <Inbox screen={screen} onOpen={onOpen} />
        ) : (
          (screen.blocks ?? []).map((block, index) => (
            <EmailBlock key={index} block={block} onOpen={onOpen} />
          ))
        )}
      </div>

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border bg-surface px-3 py-2">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onAction(action)}
              className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-semibold text-channel-email transition-colors duration-150 hover:bg-secondary-soft"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Chrome only - decorative, nothing here is interactive. */}
      {!isInbox && (
        <div
          aria-hidden="true"
          className="flex items-center gap-2 border-t border-border bg-surface px-3 py-2"
        >
          <span className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-muted">
            <CornerUpLeft size={13} />
            Reply
          </span>
          <span className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-muted">
            Forward
          </span>
        </div>
      )}
    </div>
  )
}
