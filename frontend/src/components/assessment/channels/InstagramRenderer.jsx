import { useEffect, useRef } from 'react'
import {
  BadgeCheck,
  Bookmark,
  ChevronLeft,
  Compass,
  Heart,
  Home,
  ImageIcon,
  Link2,
  MessageCircle,
  Paperclip,
  PlusSquare,
  Search,
  Send,
  User,
} from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * Instagram-style renderer for the generic scenario screen graph. Same
 * `screen` shape as every other renderer - only the presentation differs.
 *
 * Everything shown is fictional scenario data from the database. Links are
 * rendered as text; nothing here can navigate, send or fetch anything.
 */

function Avatar({ seed = '', name = '', size = 'md', ring = false }) {
  const initials = (name || seed)
    .replace(/[._]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  const sizes = { sm: 'size-8 text-[0.6rem]', md: 'size-9 text-xs', lg: 'size-16 text-lg' }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-secondary-soft font-semibold text-text-muted',
        ring && 'ring-2 ring-channel-instagram ring-offset-2 ring-offset-ig-surface',
        sizes[size],
      )}
    >
      {initials || <User size={size === 'lg' ? 26 : 16} />}
    </span>
  )
}

function Verified({ size = 13 }) {
  return (
    <BadgeCheck
      size={size}
      className="shrink-0 text-ig-accent"
      aria-label="Verified account"
    />
  )
}

/** Square media placeholder - no external images are ever loaded. */
function Media({ label, className }) {
  return (
    <span
      className={cn(
        'grid aspect-square w-full place-items-center bg-secondary-soft text-text-muted',
        className,
      )}
    >
      <span className="flex flex-col items-center gap-1 px-2 text-center">
        <ImageIcon size={20} aria-hidden="true" />
        {label && <span className="text-[0.6rem] break-words">{label}</span>}
      </span>
    </span>
  )
}

function ProfileHeader({ block }) {
  const stats = [
    { value: block.postCount ?? 0, label: 'posts' },
    { value: block.followers ?? '0', label: 'followers' },
    { value: block.following ?? '0', label: 'following' },
  ]

  return (
    <div className="border-b border-ig-border px-3 py-3">
      <div className="flex items-center gap-4">
        <Avatar seed={block.avatarSeed} name={block.displayName} size="lg" ring />
        <dl className="grid min-w-0 flex-1 grid-cols-3 text-center">
          {stats.map((stat) => (
            <div key={stat.label} className="min-w-0">
              <dd className="truncate text-sm font-bold">{stat.value}</dd>
              <dt className="truncate text-[0.65rem] text-ig-meta">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-3 min-w-0">
        <p className="flex items-center gap-1 text-sm font-semibold break-words">
          {block.displayName}
          {block.verified && <Verified />}
        </p>
        {block.bio && (
          <p className="mt-0.5 text-xs break-words text-text">{block.bio}</p>
        )}
      </div>

      <div aria-hidden="true" className="mt-3 flex gap-2">
        <span
          className={cn(
            'flex-1 rounded-md py-1.5 text-center text-xs font-semibold',
            block.isFollowing
              ? 'border border-ig-border bg-ig-surface text-text'
              : 'bg-ig-accent text-white',
          )}
        >
          {block.isFollowing ? 'Following' : 'Follow'}
        </span>
        <span className="flex-1 rounded-md border border-ig-border py-1.5 text-center text-xs font-semibold">
          Message
        </span>
      </div>
    </div>
  )
}

function Post({ block, onOpenProfile }) {
  return (
    <article className="border-b border-ig-border pb-3">
      <header className="flex items-center gap-2.5 px-3 py-2.5">
        <Avatar seed={block.author} name={block.author} size="sm" ring />
        <button
          type="button"
          onClick={() => onOpenProfile?.()}
          className="min-w-0 flex-1 text-left text-xs font-semibold break-words hover:underline"
        >
          {block.author}
        </button>
      </header>

      <Media label={block.placeholder} />

      <div aria-hidden="true" className="flex items-center gap-4 px-3 pt-2.5 text-text">
        <Heart size={20} />
        <MessageCircle size={20} />
        <Send size={19} />
        <Bookmark size={19} className="ml-auto" />
      </div>

      <div className="px-3 pt-2">
        <p className="text-xs font-semibold tabular-nums">{block.likes ?? 0} likes</p>
        <p className="mt-1 text-xs break-words">
          <span className="font-semibold">{block.author}</span>{' '}
          <span className="text-balance-pretty">{block.caption}</span>
        </p>
        {block.comments > 0 && (
          <p className="mt-1 text-xs text-ig-meta tabular-nums">
            View all {block.comments} comments
          </p>
        )}
        {block.time && (
          <p className="mt-1 text-[0.65rem] tracking-wide text-ig-meta uppercase">
            {block.time}
          </p>
        )}
      </div>
    </article>
  )
}

function Bubble({ outgoing, children }) {
  return (
    <div className={cn('flex px-3', outgoing ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[78%] rounded-3xl px-3.5 py-2 text-[0.82rem] leading-snug',
          'break-words hyphens-auto',
          outgoing ? 'bg-ig-bubble-out text-white' : 'bg-ig-bubble-in text-text',
        )}
      >
        {children}
      </div>
    </div>
  )
}

function ThreadBlock({ block }) {
  const outgoing = block.from === 'me'

  switch (block.type) {
    case 'note':
      return (
        <p className="px-6 py-1 text-center text-[0.68rem] text-balance-pretty text-ig-meta">
          {block.text}
        </p>
      )

    case 'message':
      return (
        <div>
          <Bubble outgoing={outgoing}>
            <p className="whitespace-pre-line">{block.text}</p>
          </Bubble>
          {block.time && (
            <p
              className={cn(
                'px-4 pt-0.5 text-[0.6rem] text-ig-meta',
                outgoing ? 'text-right' : 'text-left',
              )}
            >
              {block.time}
              {outgoing && block.status ? ` · ${block.status}` : ''}
            </p>
          )}
        </div>
      )

    case 'image':
      return (
        <div className={cn('flex px-3', outgoing ? 'justify-end' : 'justify-start')}>
          <span className="w-40 overflow-hidden rounded-2xl border border-ig-border">
            <Media label={block.caption} />
          </span>
        </div>
      )

    case 'linkPreview':
      return (
        <Bubble outgoing={outgoing}>
          <span className="block rounded-xl bg-black/10 p-2">
            {block.title && <span className="block text-xs font-semibold">{block.title}</span>}
            {block.description && (
              <span className="mt-0.5 block text-xs opacity-80">{block.description}</span>
            )}
          </span>
          <span className="mt-1.5 flex items-start gap-1 text-[0.7rem] break-all underline">
            <Link2 size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
            {block.displayUrl}
          </span>
        </Bubble>
      )

    case 'attachment':
      return (
        <Bubble outgoing={outgoing}>
          <span className="flex items-center gap-2">
            <Paperclip size={15} className="shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-words">{block.fileName}</span>
          </span>
        </Bubble>
      )

    case 'post':
      return (
        <div className={cn('flex px-3', outgoing ? 'justify-end' : 'justify-start')}>
          <span className="w-44 overflow-hidden rounded-2xl border border-ig-border">
            <span className="block px-2.5 py-1.5 text-[0.68rem] font-semibold break-words">
              {block.author}
            </span>
            <Media label={block.placeholder} />
            {block.caption && (
              <span className="block px-2.5 py-1.5 text-[0.68rem] break-words text-ig-meta">
                {block.caption}
              </span>
            )}
          </span>
        </div>
      )

    default:
      return typeof block.text === 'string' ? (
        <Bubble outgoing={outgoing}>
          <p className="break-words">{block.text}</p>
        </Bubble>
      ) : null
  }
}

function DmList({ screen, onOpen }) {
  return (
    <ul>
      {(screen.blocks ?? []).map((block, index) => {
        if (block.type === 'note') {
          return (
            <li
              key={index}
              className="border-b border-ig-border px-3 py-2 text-[0.7rem] font-semibold text-ig-meta"
            >
              {block.text}
            </li>
          )
        }
        if (block.type !== 'listItem') return null

        const row = (
          <>
            <Avatar seed={block.title} name={block.title} size="md" />
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-semibold">{block.title}</span>
              <span className="mt-0.5 flex items-center gap-1.5 text-xs text-ig-meta">
                <span className="truncate">{block.preview}</span>
                {block.time && <span className="shrink-0">· {block.time}</span>}
              </span>
            </span>
            {block.unread && (
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full bg-ig-accent"
              />
            )}
          </>
        )

        return (
          <li key={index} className="border-b border-ig-border last:border-b-0">
            {block.target ? (
              <button
                type="button"
                onClick={() => onOpen(block.target)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-secondary-soft"
              >
                {row}
              </button>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2.5">{row}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** Consecutive image blocks on a profile become the usual 3-across grid. */
function ProfileBody({ blocks }) {
  const images = blocks.filter((block) => block.type === 'image')
  const others = blocks.filter(
    (block) => block.type !== 'image' && block.type !== 'profileHeader',
  )

  return (
    <>
      {others.map((block, index) =>
        block.type === 'note' ? (
          <p key={index} className="px-3 py-2 text-xs text-ig-meta">
            {block.text}
          </p>
        ) : block.type === 'post' ? (
          <Post key={index} block={block} />
        ) : typeof block.text === 'string' ? (
          <p key={index} className="px-3 py-2 text-xs break-words">
            {block.text}
          </p>
        ) : null,
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-0.5 p-0.5">
          {images.map((block, index) => (
            <Media key={index} label={block.caption} />
          ))}
        </div>
      )}
    </>
  )
}

const KINDS_WITH_NAV = new Set(['feed', 'profile', 'list'])

export function InstagramRenderer({ screen, actions, backAction, onAction, onOpen }) {
  const kind = screen.kind
  const header = screen.header ?? {}
  const scrollRef = useRef(null)

  useEffect(() => {
    if (kind === 'thread' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [screen.id, kind])

  const profileBlock = (screen.blocks ?? []).find((block) => block.type === 'profileHeader')

  return (
    <div className="flex h-full flex-col bg-ig-surface">
      <div className="flex items-center gap-2.5 border-b border-ig-border bg-ig-surface px-3 py-2.5">
        {backAction ? (
          <button
            type="button"
            onClick={() => onAction(backAction)}
            aria-label={backAction.label || 'Back'}
            className="grid size-6 shrink-0 place-items-center rounded-full hover:bg-secondary-soft"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
        ) : null}

        {kind === 'thread' && <Avatar seed={header.avatarSeed} name={header.title} size="sm" />}

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate text-sm font-bold">
            <span className="truncate">{header.title}</span>
            {profileBlock?.verified && <Verified size={12} />}
          </p>
          {header.subtitle && (
            <p className="truncate text-[0.68rem] text-ig-meta">{header.subtitle}</p>
          )}
        </div>

        {kind === 'list' && (
          <Search size={17} aria-hidden="true" className="shrink-0 text-text" />
        )}
      </div>

      <div ref={scrollRef} className={cn('flex-1 overflow-y-auto overscroll-contain', kind === 'thread' && 'py-2')}>
        {kind === 'list' && <DmList screen={screen} onOpen={onOpen} />}

        {kind === 'profile' && (
          <>
            {profileBlock && <ProfileHeader block={profileBlock} />}
            <ProfileBody blocks={screen.blocks ?? []} />
          </>
        )}

        {kind === 'feed' &&
          (screen.blocks ?? []).map((block, index) =>
            block.type === 'post' ? (
              <Post key={index} block={block} />
            ) : block.type === 'note' ? (
              <p
                key={index}
                className="px-3 py-2 text-[0.65rem] tracking-wide text-ig-meta uppercase"
              >
                {block.text}
              </p>
            ) : (
              <div key={index} className="space-y-1.5 py-1">
                <ThreadBlock block={block} />
              </div>
            ),
          )}

        {/* thread, message and any unrecognised kind share the message view */}
        {!KINDS_WITH_NAV.has(kind) && (
          <div className="space-y-1.5">
            {(screen.blocks ?? []).map((block, index) =>
              block.type === 'emailBody' ? (
                <div key={index} className="space-y-2 px-4 py-2">
                  {(block.paragraphs ?? []).map((paragraph, i) => (
                    <p key={i} className="text-[0.82rem] break-words text-balance-pretty">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <ThreadBlock key={index} block={block} />
              ),
            )}
          </div>
        )}
      </div>

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-ig-border bg-ig-surface px-3 py-2">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onAction(action)}
              className="rounded-md border border-ig-border px-3 py-1.5 text-xs font-semibold text-ig-accent transition-colors duration-150 hover:bg-secondary-soft"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Chrome only - decorative, nothing here is interactive. */}
      <div
        aria-hidden="true"
        className="flex items-center justify-between border-t border-ig-border bg-ig-surface px-6 py-2 text-text"
      >
        <Home size={19} />
        <Search size={19} />
        <PlusSquare size={19} />
        <Compass size={19} />
        <User size={19} />
      </div>
    </div>
  )
}
