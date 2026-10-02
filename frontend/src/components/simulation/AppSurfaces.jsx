import {
  Camera,
  ChevronLeft,
  Heart,
  Home,
  Inbox,
  Mail,
  MessageCircle,
  Menu,
  PenSquare,
  PlusSquare,
  Search,
  Send,
  MoreVertical,
  Film,
  ShoppingBag,
  SquarePen,
  User,
  Star,
} from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * The four communication apps as the learner finds them when nothing is waiting
 * (CLIENT-POLISH-001).
 *
 * ### Why this exists
 *
 * Opening an app tile with no activity used to show one grey box reading "Nothing new in
 * WhatsApp" for all four platforms. The scenario renderers were always app-specific, but a
 * learner only meets those INSIDE a scenario - so the client, reviewing screenshots, could
 * not see that four distinct simulators exist. Their feedback asked for "a glimpse of the
 * individual module simulators" that "appear similar to real-world applications".
 *
 * Each surface therefore draws the chrome its platform is recognised by - WhatsApp's green
 * bar and Chats/Status/Calls tabs, Instagram's wordmark header and bottom navigation,
 * Gmail-style categories, the Messages conversation list - around the same honest empty
 * state. That is enough for a learner to know which app they are in, which is the judgement
 * the assessment actually tests.
 *
 * ### What they are not
 *
 * Entirely inert. Every control here is `aria-hidden` chrome with no handler: nothing sends,
 * dials, navigates, fetches, uploads or logs in, and the only real control is Back. No
 * external image, font or URL is used - the icons are the local icon set, and the colours
 * are the design tokens the scenario renderers already use.
 *
 * The device sits inside the persistent TRAINING SIMULATION rail, so a realistic
 * app surface is never mistakable for a live application.
 */

/** The one real control on any of these surfaces. */
function BackBar({ onBack, tone = 'light' }) {
  return (
    <button
      type="button"
      onClick={onBack}
      aria-label="Back to home screen"
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-full',
        tone === 'dark' ? 'text-white hover:bg-white/15' : 'text-text-muted hover:bg-secondary-soft',
      )}
    >
      <ChevronLeft size={20} aria-hidden="true" />
    </button>
  )
}

/**
 * The honest centre of every surface.
 *
 * The wording is unchanged from the generic placeholder this replaced - it was already the
 * right thing to say, and it is what tells the learner the app holds nothing rather than
 * having failed to load.
 */
function EmptyState({ label, icon: Icon, children }) {
  return (
    <div className="grid flex-1 place-items-center px-6 py-8">
      <div className="text-center">
        <span
          aria-hidden="true"
          className="mx-auto grid size-12 place-items-center rounded-full bg-black/5 text-text-muted"
        >
          <Icon size={22} />
        </span>
        <p role="status" className="mt-3 text-sm font-medium text-text-muted">
          Nothing new in {label}.
        </p>
        {children}
      </div>
    </div>
  )
}

/** Decorative row of placeholder conversation slots, so an empty list still reads as a list. */
function GhostRows({ count = 3, className }) {
  return (
    <ul aria-hidden="true" className={cn('space-y-3 px-3 pt-3', className)}>
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex items-center gap-3 opacity-40">
          <span className="size-10 shrink-0 rounded-full bg-black/10" />
          <span className="min-w-0 flex-1 space-y-1.5">
            <span className="block h-2.5 w-1/3 rounded-full bg-black/10" />
            <span className="block h-2 w-3/5 rounded-full bg-black/[0.07]" />
          </span>
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------------------------------------------ *
 * WhatsApp
 * ------------------------------------------------------------------ */

function WhatsAppSurface({ label, onBack }) {
  return (
    <div className="flex h-full flex-col bg-wa-canvas">
      <div className="shrink-0 bg-wa-header text-white">
        <div className="flex items-center gap-1 px-1.5 py-2">
          <BackBar onBack={onBack} tone="dark" />
          <p className="flex-1 truncate text-base font-semibold">WhatsApp</p>
          <span aria-hidden="true" className="flex items-center gap-3.5 pr-2 text-white/85">
            <Camera size={17} />
            <Search size={17} />
            <MoreVertical size={17} />
          </span>
        </div>
        <ul aria-hidden="true" className="flex px-2 text-[0.7rem] font-semibold tracking-wide">
          {['CHATS', 'STATUS', 'CALLS'].map((tab, i) => (
            <li
              key={tab}
              className={cn(
                'flex-1 pb-2 text-center',
                i === 0 ? 'border-b-2 border-white text-white' : 'text-white/60',
              )}
            >
              {tab}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-surface">
        <GhostRows count={3} />
        <EmptyState label={label} icon={MessageCircle} />
      </div>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-4 bottom-4 grid size-12 place-items-center rounded-2xl bg-wa-header text-white shadow-lg"
      >
        <MessageCircle size={20} />
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Instagram
 * ------------------------------------------------------------------ */

function InstagramSurface({ label, onBack }) {
  return (
    <div className="flex h-full flex-col bg-ig-surface">
      <div className="flex shrink-0 items-center gap-1 border-b border-ig-border px-1.5 py-2">
        <BackBar onBack={onBack} />
        <p className="flex-1 truncate font-serif text-lg italic tracking-tight text-text">
          Instagram
        </p>
        <span aria-hidden="true" className="flex items-center gap-3.5 pr-2 text-text">
          <Heart size={19} />
          <Send size={18} />
        </span>
      </div>

      {/* Story rail: rings only. No image is loaded, here or anywhere in the product. */}
      <ul
        aria-hidden="true"
        className="flex shrink-0 gap-3.5 overflow-hidden border-b border-ig-border px-3 py-2.5"
      >
        {['Your story', '', '', '', ''].map((name, i) => (
          <li key={i} className="flex w-14 shrink-0 flex-col items-center gap-1">
            <span
              className={cn(
                'grid size-13 place-items-center rounded-full p-[2px]',
                i === 0 ? 'bg-ig-border' : 'bg-gradient-to-tr from-channel-instagram to-warning',
              )}
            >
              <span className="grid size-full place-items-center rounded-full bg-ig-surface text-ig-meta">
                {i === 0 ? <PlusSquare size={16} /> : <User size={16} />}
              </span>
            </span>
            <span className="w-full truncate text-center text-[0.58rem] text-ig-meta">
              {name || ' '}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <EmptyState label={label} icon={Camera} />
      </div>

      <nav
        aria-hidden="true"
        className="flex shrink-0 items-center justify-around border-t border-ig-border px-2 py-2.5 text-text"
      >
        <Home size={20} />
        <Search size={20} />
        <Film size={20} />
        <ShoppingBag size={20} />
        <span className="grid size-6 place-items-center rounded-full bg-ig-bubble-in text-ig-meta">
          <User size={14} />
        </span>
      </nav>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Email
 * ------------------------------------------------------------------ */

function EmailSurface({ label, onBack }) {
  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="shrink-0 border-b border-border">
        <div className="flex items-center gap-1 px-1.5 py-2">
          <BackBar onBack={onBack} />
          <Menu size={18} aria-hidden="true" className="shrink-0 text-text-muted" />
          <p className="flex-1 truncate text-sm font-bold">Inbox</p>
          <span aria-hidden="true" className="flex items-center gap-3 pr-2 text-text-muted">
            <Search size={17} />
          </span>
        </div>
        <ul aria-hidden="true" className="flex gap-2 px-3 pb-2 text-[0.68rem] font-semibold">
          {['Primary', 'Social', 'Promotions'].map((tab, i) => (
            <li
              key={tab}
              className={cn(
                'rounded-full px-2.5 py-1',
                i === 0
                  ? 'bg-channel-email/12 text-channel-email'
                  : 'bg-secondary-soft text-text-muted',
              )}
            >
              {tab}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <ul aria-hidden="true" className="divide-y divide-border">
          {Array.from({ length: 3 }, (_, i) => (
            <li key={i} className="flex items-start gap-3 px-3 py-3 opacity-40">
              <span className="size-9 shrink-0 rounded-full bg-black/10" />
              <span className="min-w-0 flex-1 space-y-1.5">
                <span className="block h-2.5 w-2/5 rounded-full bg-black/10" />
                <span className="block h-2 w-4/5 rounded-full bg-black/[0.07]" />
              </span>
              <Star size={14} className="mt-0.5 shrink-0 text-border-strong" />
            </li>
          ))}
        </ul>
        <EmptyState label={label} icon={Inbox} />
      </div>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-4 bottom-4 flex items-center gap-2 rounded-2xl bg-channel-email px-3.5 py-3 text-white shadow-lg"
      >
        <PenSquare size={17} />
        <span className="text-xs font-semibold">Compose</span>
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * SMS
 * ------------------------------------------------------------------ */

function SmsSurface({ label, onBack }) {
  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex shrink-0 items-center gap-1 border-b border-border px-1.5 py-2">
        <BackBar onBack={onBack} />
        <p className="flex-1 truncate text-sm font-bold">Messages</p>
        <span aria-hidden="true" className="flex items-center gap-3 pr-2 text-text-muted">
          <Search size={17} />
          <MoreVertical size={17} />
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <GhostRows count={3} />
        <EmptyState label={label} icon={Mail} />
      </div>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-4 bottom-4 flex items-center gap-2 rounded-2xl bg-channel-sms px-3.5 py-3 text-white shadow-lg"
      >
        <SquarePen size={17} />
        <span className="text-xs font-semibold">Start chat</span>
      </span>
    </div>
  )
}

const SURFACES = {
  whatsapp: WhatsAppSurface,
  instagram: InstagramSurface,
  email: EmailSurface,
  sms: SmsSurface,
}

/** Fallback for a platform without a dedicated surface. Keeps the same honest empty state. */
function GenericSurface({ label, onBack }) {
  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex shrink-0 items-center gap-1 border-b border-border px-1.5 py-2">
        <BackBar onBack={onBack} />
        <p className="flex-1 truncate text-sm font-bold">{label}</p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <EmptyState label={label} icon={Inbox} />
      </div>
    </div>
  )
}

/**
 * The app a learner opened when nothing is waiting in it.
 *
 * Local navigation only: opening one submits no intent, records no event and cannot advance
 * or resolve a scenario. Back returns to the home screen.
 */
export function AppSurface({ platform, label, onBack }) {
  const Surface = SURFACES[platform] ?? GenericSurface
  return (
    <div className="animate-screen-in relative h-full" data-testid={`app-surface-${platform}`}>
      <Surface label={label} onBack={onBack} />
    </div>
  )
}
