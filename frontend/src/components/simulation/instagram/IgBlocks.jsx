import { useState } from 'react'
import {
  Award, Backpack, BadgeCheck, Bookmark, ChevronLeft, ChevronRight, Coffee, CookingPot, EyeOff, Gift, Heart, ImageIcon, Link2,
  MapPin, MessageCircle, Mountain, Play, Send, ShieldHalf, ShoppingBag, TrendingUp, User,
} from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * Everything an Instagram scene draws (IMMERSIVE-004A), the counterpart of the WhatsApp
 * `ChatBlocks`. Same two rules: nothing here acts (a link preview is text, a payment card
 * charges nothing, a story tile loads no image), and nothing is styled by risk. The controls
 * that DO something are scene affordances passed in and drawn by `SceneControl`.
 *
 * No image file exists anywhere: avatars are initials or a glyph, and post/story/grid art is
 * a drawn field, exactly as the WhatsApp `AttachmentTile` is.
 */

export function IgAvatar({ seed = '', name = '', size = 'md', ring = false, art = null }) {
  const source = String(seed || name)
  const initials = source
    .replace(/^@/, '')
    .replace(/[._]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  const sizes = {
    xs: 'size-6 text-[0.5rem]',
    sm: 'size-8 text-[0.6rem]',
    md: 'size-10 text-xs',
    lg: 'size-11 text-sm',
    xl: 'size-20 text-xl',
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden rounded-full bg-ig-bubble-in font-semibold text-ig-meta',
        ring && 'p-[2px] ring-2 ring-channel-instagram ring-offset-1 ring-offset-ig-surface',
        sizes[size] ?? sizes.md,
      )}
    >
      {art ? <ArtFill art={art} round /> : (initials || <User size={size === 'xl' ? 30 : 16} />)}
    </span>
  )
}

export function Verified({ size = 13 }) {
  return <BadgeCheck size={size} className="shrink-0 text-ig-accent" aria-label="Verified account" />
}

/** A drawn media field. Never an image; the label tells a screen reader what it is. */
export function ArtFill({ art = 'photo', round = false, glyph = true }) {
  const glyphs = {
    cafe: Coffee,
    giveaway: Gift,
    brand: ShoppingBag,
    person: User,
    crest: ShieldHalf,
    poster: ShieldHalf,
    trail: MapPin,
    map: MapPin,
    notice: ImageIcon,
    // IMMERSIVE-004B: a field-training photo, a cooking reel, a chart, outdoor kit, an award.
    field: Mountain,
    food: CookingPot,
    chart: TrendingUp,
    gear: Backpack,
    award: Award,
  }
  const tint = {
    field: 'from-success-soft to-warning-soft',
    food: 'from-warning-soft to-channel-instagram/15',
    chart: 'from-info-soft to-success-soft',
    gear: 'from-info-soft to-background',
    award: 'from-warning-soft to-info-soft',
    giveaway: 'from-channel-instagram/25 to-warning/25',
    brand: 'from-info-soft to-secondary-soft',
    poster: 'from-success-soft to-secondary-soft',
    crest: 'from-secondary-soft to-background',
    trail: 'from-success-soft to-info-soft',
    person: 'from-secondary-soft to-background',
    notice: 'from-secondary-soft to-surface',
    text: 'from-ig-bubble-in to-secondary-soft',
    cafe: 'from-warning-soft to-secondary-soft',
  }
  const Glyph = glyphs[art] ?? null

  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-full place-items-center bg-gradient-to-br text-ig-meta',
        tint[art] ?? tint.text,
        round ? 'rounded-full' : '',
      )}
    >
      {Glyph && glyph ? <Glyph size={20} /> : null}
    </span>
  )
}

/** A carousel slide's drawn face, with the words a giveaway/poster prints on it. */
const SHAPES = {
  square: 'aspect-square',
  /** A reel as the feed crops it. */
  portrait: 'aspect-[4/5]',
  /** A reel in its own full-screen player. */
  tall: 'aspect-[9/14]',
}

function Slide({ slide, shape = 'square' }) {
  const words = Boolean(slide.title || slide.subtitle)
  return (
    <span className={cn('relative grid w-full place-items-center overflow-hidden', SHAPES[shape] ?? SHAPES.square)}>
      <ArtFill art={slide.art} glyph={!words} />
      {words && (
        <span className="absolute inset-0 grid place-items-center px-4 text-center">
          <span>
            {slide.title && (
              <span className="block text-lg font-extrabold tracking-tight text-text drop-shadow-sm">
                {slide.title}
              </span>
            )}
            {slide.subtitle && (
              <span className="mt-1 block text-[0.8rem] font-semibold text-text-muted">
                {slide.subtitle}
              </span>
            )}
          </span>
        </span>
      )}
    </span>
  )
}

/**
 * A post's media. A carousel can be swiped - here, stepped with its own previous/next
 * controls - and which slide is showing is local presentation that records nothing.
 */
export function PostMedia({ slides = [], shape = 'square', reel = false }) {
  const list = slides.length ? slides : [{ art: 'photo' }]
  const [index, setIndex] = useState(0)
  const current = Math.min(index, list.length - 1)
  return (
    <div className="relative border-y border-ig-border bg-ig-bubble-in" data-testid="ig-media">
      <Slide slide={list[current]} shape={shape} />
      {/*
        IMMERSIVE-004B. A reel is stepped frame by frame, the way a viewer pauses and scrubs
        one; nothing plays, loads or advances on its own. The glyph says what kind of media
        it is and nothing about what is in it.
      */}
      {reel && (
        <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[0.66rem] font-semibold text-white">
          <Play size={10} aria-hidden="true" /> Reel
        </span>
      )}
      {list.length > 1 && (
        <>
          <span className="absolute top-2 right-2 rounded-full bg-black/55 px-2 py-0.5 text-[0.66rem] font-semibold text-white tabular-nums">
            {current + 1}/{list.length}
          </span>
          {current > 0 && (
            <button
              type="button"
              onClick={() => setIndex(current - 1)}
              aria-label="Previous slide"
              className="absolute top-1/2 left-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-text shadow"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
          )}
          {current < list.length - 1 && (
            <button
              type="button"
              onClick={() => setIndex(current + 1)}
              aria-label="Next slide"
              className="absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-text shadow"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          )}
          <span aria-hidden="true" className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {list.map((slide, dot) => (
              <span
                key={slide.title ?? dot}
                className={cn('size-1.5 rounded-full', dot === current ? 'bg-ig-accent' : 'bg-white/70')}
              />
            ))}
          </span>
        </>
      )}
    </div>
  )
}

/** The heart / comment / send / bookmark row under a post. Decorative. */
export function PostActions() {
  return (
    <div aria-hidden="true" className="flex items-center gap-4 px-3 pt-2.5 text-text">
      <Heart size={22} />
      <MessageCircle size={22} />
      <Send size={20} />
      <Bookmark size={20} className="ml-auto" />
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * DM beats
 * ------------------------------------------------------------------ */

function Bubble({ outgoing, children }) {
  return (
    <div className={cn('flex px-3', outgoing ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[78%] rounded-3xl px-3.5 py-2 text-[0.82rem] leading-snug break-words hyphens-auto',
          outgoing ? 'bg-ig-bubble-out text-white' : 'bg-ig-bubble-in text-text',
        )}
      >
        {children}
      </div>
    </div>
  )
}

function Time({ time, outgoing }) {
  if (!time) return null
  return (
    <p className={cn('px-4 pt-0.5 text-[0.6rem] text-ig-meta', outgoing ? 'text-right' : 'text-left')}>
      {time}
    </p>
  )
}

/** The card at the top of a message request: who this is, before anything is said. */
function RequestCard({ beat }) {
  return (
    <div className="mx-3 my-3 rounded-2xl border border-ig-border bg-ig-surface p-4 text-center">
      <span className="mx-auto block w-fit">
        <IgAvatar seed={beat.handle} name={beat.name} size="xl" />
      </span>
      <p className="mt-2 flex items-center justify-center gap-1 text-sm font-bold">
        {beat.name}
        {beat.verified && <Verified size={12} />}
      </p>
      <p className="text-[0.72rem] text-ig-meta">@{beat.handle}</p>
      {beat.stats && (
        <p className="mt-1.5 text-[0.72rem] text-ig-meta tabular-nums">
          {beat.stats.posts} posts · {beat.stats.followers} followers · {beat.stats.following} following
        </p>
      )}
      {beat.relation && <p className="mt-1 text-[0.72rem] text-ig-meta">{beat.relation}</p>}
      {beat.mutuals && <p className="mt-0.5 text-[0.72rem] text-ig-meta">{beat.mutuals}</p>}
      <p className="mt-2 text-[0.7rem] text-ig-meta">
        This is a message request. They can’t see if you’ve read it until you reply.
      </p>
    </div>
  )
}

function StoryReply({ beat }) {
  return (
    <div className="flex justify-start px-3">
      <div className="max-w-[80%]">
        <p className="mb-1 pl-1 text-[0.62rem] text-ig-meta">{beat.text}</p>
        <div className="flex items-end gap-2">
          <span className="h-16 w-11 shrink-0 overflow-hidden rounded-xl border border-ig-border">
            <ArtFill art={beat.story?.art ?? 'trail'} />
          </span>
          {beat.story?.label && (
            <span className="pb-1 text-[0.66rem] text-ig-meta">{beat.story.label}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function PayBeat({ beat }) {
  return (
    <div className={cn('flex px-3', beat.from === 'me' ? 'justify-end' : 'justify-start')}>
      <div className="w-60 overflow-hidden rounded-2xl border border-ig-border bg-ig-surface">
        <div className="bg-ig-bubble-in px-3 py-2 text-[0.68rem] font-bold tracking-wide text-ig-meta uppercase">
          Payment request
        </div>
        <div className="px-3 py-2.5">
          <p className="text-lg font-bold tabular-nums">{beat.amount}</p>
          <dl className="mt-1.5 space-y-0.5 text-[0.74rem]">
            <div className="flex justify-between gap-2">
              <dt className="text-ig-meta">To</dt><dd className="font-semibold">{beat.payee}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ig-meta">UPI ID</dt><dd className="break-all">{beat.handle}</dd>
            </div>
          </dl>
          {beat.note && <p className="mt-1 text-[0.68rem] text-ig-meta">{beat.note}</p>}
        </div>
      </div>
    </div>
  )
}

function SharedPost({ beat }) {
  return (
    <div className={cn('flex px-3', beat.from === 'me' ? 'justify-end' : 'justify-start')}>
      <span className="w-44 overflow-hidden rounded-2xl border border-ig-border bg-ig-surface">
        <span className="flex items-center gap-1 px-2.5 py-1.5 text-[0.68rem] font-semibold">
          {beat.author}
          {beat.verified && <Verified size={10} />}
        </span>
        <span className={cn('relative block', beat.reel ? 'aspect-[4/5]' : 'aspect-square')}>
          <ArtFill art={beat.art ?? 'photo'} />
          {beat.reel && (
            <span className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-black/55 text-white">
              <Play size={11} aria-label="Reel" />
            </span>
          )}
        </span>
        {beat.title && (
          <span className="block px-2.5 pt-1.5 text-[0.72rem] font-semibold break-words">{beat.title}</span>
        )}
        {beat.caption && (
          <span className="block px-2.5 py-1.5 text-[0.68rem] break-words text-ig-meta">{beat.caption}</span>
        )}
      </span>
    </div>
  )
}

/**
 * A photo sent in a DM behind the app's sensitive-content screen (IMMERSIVE-004D, I17).
 *
 * The screen is how Instagram delivers such an image, so the scene shows it that way. "See
 * photo" is local presentation that records nothing, and what it reveals is a drawn frame and
 * a one-line description - there is no image file anywhere, and nothing graphic is drawn.
 */
function PhotoBeat({ beat }) {
  const [shown, setShown] = useState(false)
  const outgoing = beat.from === 'me'
  return (
    <div>
      <div className={cn('flex px-3', outgoing ? 'justify-end' : 'justify-start')}>
        <div className="w-52 overflow-hidden rounded-2xl border border-ig-border bg-ig-surface">
          <div className="relative aspect-[4/5]">
            <ArtFill art={beat.art ?? 'person'} glyph={shown} />
            {!shown && (
              <div className="absolute inset-0 grid place-items-center bg-ig-bubble-in/95 px-3 text-center backdrop-blur-md">
                <div>
                  <EyeOff size={20} aria-hidden="true" className="mx-auto text-ig-meta" />
                  <p className="mt-1.5 text-[0.78rem] font-semibold">{beat.screen}</p>
                  {beat.reason && <p className="mt-1 text-[0.68rem] text-ig-meta">{beat.reason}</p>}
                  <button
                    type="button"
                    onClick={() => setShown(true)}
                    className="mt-2 inline-flex min-h-11 items-center rounded-lg px-3 text-[0.76rem] font-semibold text-ig-accent hover:bg-ig-surface"
                  >
                    See photo
                  </button>
                </div>
              </div>
            )}
          </div>
          {shown && beat.revealedCaption && (
            <p className="px-2.5 py-1.5 text-[0.68rem] text-ig-meta">{beat.revealedCaption}</p>
          )}
        </div>
      </div>
      <Time time={beat.time} outgoing={outgoing} />
    </div>
  )
}

/** A DM beat. Anchored controls (a pay card's Open) are drawn under it. */
export function IgBeat({ beat, controls = [], renderControl }) {
  const outgoing = beat.from === 'me'

  const body = (() => {
    switch (beat.kind) {
      case 'requestCard':
        return <RequestCard beat={beat} />
      case 'storyReply':
        return <StoryReply beat={beat} />
      case 'payCard':
        return <PayBeat beat={beat} />
      case 'sharedPost':
        return <SharedPost beat={beat} />
      case 'photo':
        return <PhotoBeat beat={beat} />
      case 'day':
        return <p className="px-6 py-2 text-center text-[0.62rem] font-semibold tracking-wide text-ig-meta uppercase">{beat.text}</p>
      case 'system':
        return (
          <p
            className={cn(
              'mx-4 my-1.5 text-center text-[0.7rem] text-balance-pretty',
              beat.tone === 'banner'
                ? 'rounded-lg bg-ig-bubble-in px-3 py-2 text-text'
                : beat.tone === 'mention'
                  ? 'rounded-lg border border-ig-border px-3 py-2 text-text'
                  : 'text-ig-meta',
            )}
          >
            {beat.text}
          </p>
        )
      case 'link':
        return (
          <div>
            <Bubble outgoing={outgoing}>
              {beat.text && <p className="whitespace-pre-line">{beat.text}</p>}
              <span className="mt-1.5 block rounded-xl bg-black/10 p-2">
                {/*
                  IMMERSIVE-004C: a link preview may carry the thumbnail the app draws for it,
                  with the play badge a video share gets. Drawn, like every other tile here -
                  there is no image and nothing plays.
                */}
                {beat.art && (
                  <span className="relative mb-1.5 block aspect-video overflow-hidden rounded-lg">
                    <ArtFill art={beat.art} />
                    {beat.play && (
                      <span className="absolute inset-0 grid place-items-center">
                        <span className="grid size-9 place-items-center rounded-full bg-black/55 text-white">
                          <Play size={16} aria-label="Video" />
                        </span>
                      </span>
                    )}
                  </span>
                )}
                {beat.title && <span className="block text-xs font-semibold">{beat.title}</span>}
                {beat.description && <span className="mt-0.5 block text-xs opacity-80">{beat.description}</span>}
                <span className="mt-1 flex items-start gap-1 text-[0.7rem] break-all underline">
                  <Link2 size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {beat.displayUrl}
                </span>
              </span>
            </Bubble>
            <Time time={beat.time} outgoing={outgoing} />
          </div>
        )
      case 'message':
      default:
        return (
          <div>
            <Bubble outgoing={outgoing}><p className="whitespace-pre-line">{beat.text}</p></Bubble>
            <Time time={beat.time} outgoing={outgoing} />
          </div>
        )
    }
  })()

  return (
    <div className="space-y-1">
      {body}
      {controls.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pt-1">
          {controls.map((control) => renderControl(control))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Post-view beats (caption + comments)
 * ------------------------------------------------------------------ */

/**
 * One comment under a post. IMMERSIVE-004B: a comment can carry anchored controls (the
 * commenter's name is how you reach their profile from your own post), drawn under it the
 * same way a DM beat draws its own.
 */
export function IgComment({ beat, controls = [], renderControl = null }) {
  return (
    <div className={cn('flex gap-2.5 px-3 py-1.5', beat.reply && 'pl-11')}>
      <IgAvatar seed={beat.author} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-[0.8rem] break-words">
          <span className="inline-flex items-center gap-1 font-semibold">
            {beat.author}{beat.verified && <Verified size={10} />}
          </span>{' '}
          <span>{beat.text}</span>
        </p>
        <p className="mt-0.5 flex gap-3 text-[0.66rem] text-ig-meta">
          {beat.time && <span>{beat.time}</span>}
          {typeof beat.likes === 'number' && <span>{beat.likes} {beat.likes === 1 ? 'like' : 'likes'}</span>}
          <span>Reply</span>
        </p>
        {controls.length > 0 && renderControl && (
          <div className="flex flex-wrap gap-2 pt-1">{controls.map((control) => renderControl(control))}</div>
        )}
      </div>
      <Heart size={12} aria-hidden="true" className="mt-1 shrink-0 text-ig-meta" />
    </div>
  )
}

export function IgCaption({ beat }) {
  return (
    <div className="px-3 py-2">
      <p className="text-[0.82rem] break-words">
        <span className="inline-flex items-center gap-1 font-semibold">
          {beat.author}{beat.verified && <Verified size={11} />}
        </span>{' '}
        <span className="text-balance-pretty">{beat.text}</span>
      </p>
      {beat.tags?.length > 0 && (
        <p className="mt-1 text-[0.72rem] text-ig-accent">
          {beat.tags.map((tag) => (tag.startsWith('+') ? tag : `@${tag}`)).join('  ')}
        </p>
      )}
      {beat.time && (
        <p className="mt-1 text-[0.62rem] tracking-wide text-ig-meta uppercase">{beat.time}</p>
      )}
    </div>
  )
}
