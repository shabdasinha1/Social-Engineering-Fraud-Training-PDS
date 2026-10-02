import { ChevronLeft, FileText, Link2, Paperclip } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * Neutral renderer used for any channel without its own look yet
 * (Instagram, SMS, Email - FE-009 to FE-011). Same `screen` shape as every
 * other renderer; all content is fictional scenario data.
 */

function Block({ block, onOpen }) {
  switch (block.type) {
    case 'note':
      return <p className="my-2 text-center text-xs font-medium text-text-muted">{block.text}</p>

    case 'message':
      return (
        <div className={cn('flex', block.from === 'me' ? 'justify-end' : 'justify-start')}>
          <div
            className={cn(
              'max-w-[85%] rounded-lg px-3 py-2 text-sm text-balance-pretty',
              block.from === 'me'
                ? 'bg-primary-soft text-text'
                : 'border border-border bg-surface text-text',
            )}
          >
            {block.text}
            {block.time && (
              <span className="mt-1 block text-[0.7rem] text-text-muted">{block.time}</span>
            )}
          </div>
        </div>
      )

    case 'listItem': {
      const row = (
        <>
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-semibold">{block.title}</span>
            {block.time && (
              <span className="shrink-0 text-[0.7rem] text-text-muted">{block.time}</span>
            )}
          </span>
          {block.preview && (
            <span className="mt-0.5 block truncate text-sm text-text-muted">{block.preview}</span>
          )}
        </>
      )

      return block.target ? (
        <button
          type="button"
          onClick={() => onOpen(block.target)}
          className="block w-full border-b border-border px-1 py-2.5 text-left last:border-b-0 hover:bg-secondary-soft"
        >
          {row}
        </button>
      ) : (
        <div className="border-b border-border px-1 py-2.5 last:border-b-0">{row}</div>
      )
    }

    case 'emailHeader':
      return (
        <div className="border-b border-border pb-3">
          <p className="text-sm font-bold text-balance-pretty">{block.subject}</p>
          <p className="mt-1.5 text-sm font-semibold">{block.fromName}</p>
          <p className="text-xs break-all text-text-muted">{block.fromAddress}</p>
          {block.to && <p className="mt-0.5 text-xs text-text-muted">to {block.to}</p>}
          {block.time && <p className="mt-0.5 text-xs text-text-muted">{block.time}</p>}
        </div>
      )

    case 'emailBody':
      return (
        <div className="space-y-2.5">
          {(block.paragraphs ?? []).map((paragraph, index) => (
            <p key={index} className="text-sm text-balance-pretty">
              {paragraph}
            </p>
          ))}
        </div>
      )

    case 'linkPreview':
      return (
        <div className="rounded-md border border-border bg-surface p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium break-all text-info">
            <Link2 size={13} className="shrink-0" aria-hidden="true" />
            {block.displayUrl}
          </p>
          {block.title && <p className="mt-1.5 text-sm font-semibold">{block.title}</p>}
          {block.description && (
            <p className="mt-0.5 text-sm text-text-muted">{block.description}</p>
          )}
        </div>
      )

    case 'attachment':
      return (
        <div className="flex items-center gap-2.5 rounded-md border border-border bg-surface p-3">
          <Paperclip size={16} className="shrink-0 text-text-muted" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{block.fileName}</span>
            {block.fileSize && (
              <span className="block text-xs text-text-muted">{block.fileSize}</span>
            )}
          </span>
        </div>
      )

    case 'image':
      return (
        <div className="rounded-md border border-border bg-secondary-soft p-6 text-center">
          <FileText size={20} className="mx-auto text-text-muted" aria-hidden="true" />
          <p className="mt-2 text-xs text-text-muted">{block.caption || 'Image'}</p>
        </div>
      )

    case 'post':
      return (
        <div className="rounded-md border border-border bg-surface p-3">
          <p className="text-sm font-semibold">{block.author}</p>
          <p className="mt-1 text-sm text-balance-pretty">{block.caption}</p>
          <p className="mt-1.5 text-xs text-text-muted">
            {block.likes ?? 0} likes {block.time ? `· ${block.time}` : ''}
          </p>
        </div>
      )

    default:
      return typeof block.text === 'string' ? (
        <p className="text-sm text-balance-pretty">{block.text}</p>
      ) : null
  }
}

export function GenericRenderer({ screen, actions, backAction, onAction, onOpen }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2.5">
        {backAction && (
          <button
            type="button"
            onClick={() => onAction(backAction)}
            aria-label={backAction.label || 'Back'}
            className="grid size-6 shrink-0 place-items-center rounded-full text-text-muted hover:bg-secondary-soft"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{screen.header?.title}</p>
          {screen.header?.subtitle && (
            <p className="truncate text-xs text-text-muted">{screen.header.subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto overscroll-contain p-3">
        {(screen.blocks ?? []).map((block, index) => (
          <Block key={index} block={block} onOpen={onOpen} />
        ))}
      </div>

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border bg-surface p-3">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onAction(action)}
              className="rounded-md border border-border-strong bg-surface px-3 py-1.5 text-sm font-medium transition-colors duration-200 hover:bg-secondary-soft"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
