import { useState } from 'react'
import { Check, ChevronRight, Circle, Grid3x3, MapPin, Search, UserSquare } from 'lucide-react'
import {
  ArtFill, IgAvatar, IgComment, PostActions, PostMedia, Verified,
} from '@/components/simulation/instagram/IgBlocks'
import { InertNote, Screen } from '@/components/simulation/surfaces/SurfaceFrame'
import { cn } from '@/utils/cn'

/**
 * A screen inside Instagram itself (IMMERSIVE-004A): a profile and its grid, "About this
 * account", a follower/following/tagged list, a single post, search results, and the app's
 * own Settings and Account Status.
 *
 * One surface with a page graph rather than seven components, because they share a header,
 * a Back that walks the page history, and the rule that walking between them is navigation
 * and records nothing. A scene affordance passed in as `controls` (IMMERSIVE-004B: Like and
 * Save on a reel, the choices under "Add location") is drawn at the foot of a page exactly as
 * the other surfaces draw theirs, and nothing else here reaches the engine.
 *
 * Contained like every surface: no href, src, iframe, fetch, form or media. The one input
 * that could exist - a search box - is a read-only display of the query the scene says the
 * learner searched for, never a field.
 */

function ProfilePage({ page, onNavigate }) {
  const stats = [
    { value: page.stats?.posts ?? '0', label: 'posts' },
    { value: page.stats?.followers ?? '0', label: 'followers', to: page.stats?.followersTo ?? null },
    { value: page.stats?.following ?? '0', label: 'following', to: page.stats?.followingTo ?? null },
  ]

  return (
    <div>
      <div className="px-3.5 pt-4">
        <div className="flex items-center gap-5">
          <IgAvatar seed={page.handle} name={page.name} art={page.avatarArt} size="xl" ring />
          <ul className="grid min-w-0 flex-1 grid-cols-3 text-center">
            {stats.map((stat) => {
              const face = (
                <>
                  <span className="block text-[0.95rem] font-bold tabular-nums">{stat.value}</span>
                  <span className="block truncate text-[0.68rem] text-ig-meta">{stat.label}</span>
                </>
              )
              return (
                <li key={stat.label} className="min-w-0">
                  {stat.to ? (
                    <button
                      type="button"
                      data-page-link={stat.to}
                      onClick={() => onNavigate?.(stat.to)}
                      className="min-h-11 w-full rounded-md hover:bg-ig-bubble-in"
                    >
                      {face}
                    </button>
                  ) : face}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="mt-3">
          <p className="flex items-center gap-1 text-[0.85rem] font-bold">
            {page.name}
            {page.verified && <Verified size={12} />}
          </p>
          {page.category && <p className="text-[0.72rem] text-ig-meta">{page.category}</p>}
          {(page.bio ?? []).map((line) => (
            <p key={line} className="text-[0.78rem] break-words">{line}</p>
          ))}
          {page.bioLink && (
            page.bioLink.to ? (
              <button
                type="button"
                data-page-link={page.bioLink.to}
                onClick={() => onNavigate?.(page.bioLink.to)}
                className="mt-0.5 inline-flex items-center gap-1 text-[0.78rem] font-semibold text-ig-accent hover:underline"
              >
                🔗 {page.bioLink.label}
              </button>
            ) : (
              <p className="mt-0.5 text-[0.78rem] font-semibold text-ig-accent">🔗 {page.bioLink.label}</p>
            )
          )}
          {page.mutuals && <p className="mt-1 text-[0.72rem] text-ig-meta">{page.mutuals}</p>}
        </div>

        <div aria-hidden="true" className="mt-3 flex gap-2">
          {(page.buttons ?? ['Follow', 'Message']).map((label, index) => (
            <span
              key={label}
              className={cn(
                'flex-1 rounded-lg py-1.5 text-center text-[0.78rem] font-semibold',
                index === 0 && !page.following
                  ? 'bg-ig-accent text-white'
                  : 'border border-ig-border bg-ig-surface text-text',
              )}
            >
              {label}
            </span>
          ))}
        </div>

        {/*
          A professional account's own action row (IMMERSIVE-004C): Call, Email, Address.
          The contact detail each one holds is printed under it, because that detail is the
          thing the learner has come to compare - and a button that only says "Call" would
          hide it behind a dialler this simulation does not have.
        */}
        {page.actions?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2" data-testid="ig-profile-actions">
            {page.actions.map((item) => {
              const face = (
                <>
                  <span className="block text-[0.76rem] font-semibold">{item.label}</span>
                  {item.value && (
                    <span className="mt-0.5 block text-[0.68rem] break-all text-ig-meta">{item.value}</span>
                  )}
                </>
              )
              return item.to ? (
                <button
                  key={item.id}
                  type="button"
                  data-page-link={item.to}
                  onClick={() => onNavigate?.(item.to)}
                  className="min-h-11 flex-1 rounded-lg border border-ig-border px-2.5 py-1.5 text-left hover:bg-ig-bubble-in"
                >
                  {face}
                </button>
              ) : (
                <span key={item.id} className="min-h-11 flex-1 rounded-lg border border-ig-border px-2.5 py-1.5">
                  {face}
                </span>
              )
            })}
          </div>
        )}

        {/*
          Story highlights (IMMERSIVE-004C). A row of covers under the bio, exactly where the
          app puts them; one that names a page opens it, and opening it is navigation.
        */}
        {page.highlights?.length > 0 && (
          <ul className="mt-3 flex gap-3 overflow-x-auto pb-1" data-testid="ig-highlights">
            {page.highlights.map((item) => {
              const cover = (
                <>
                  <span className="grid size-14 place-items-center overflow-hidden rounded-full border border-ig-border p-[2px]">
                    <ArtFill art={item.art} round />
                  </span>
                  <span className="mt-1 block w-16 truncate text-center text-[0.62rem] text-ig-meta">
                    {item.label}
                  </span>
                </>
              )
              return (
                <li key={item.id} className="shrink-0">
                  {item.to ? (
                    <button
                      type="button"
                      data-page-link={item.to}
                      onClick={() => onNavigate?.(item.to)}
                      aria-label={`Open the ${item.label} highlight`}
                      className="rounded-lg"
                    >
                      {cover}
                    </button>
                  ) : cover}
                </li>
              )
            })}
          </ul>
        )}

        {/* Navigable pages of the profile: About, tagged, the real account to compare. */}
        <div className="mt-3 space-y-1">
          {page.aboutTo && (
            <ProfileLink to={page.aboutTo} onNavigate={onNavigate} label="About this account" />
          )}
          {page.pinnedTo && (
            <ProfileLink to={page.pinnedTo} onNavigate={onNavigate} label="View pinned post" />
          )}
          {page.commentsTo && (
            <ProfileLink to={page.commentsTo} onNavigate={onNavigate} label="See where this account comments" />
          )}
          {page.compareTo && (
            <ProfileLink to={page.compareTo.to} onNavigate={onNavigate} label={page.compareTo.label} />
          )}
          {page.storyTo && (
            <ProfileLink to={page.storyTo.to} onNavigate={onNavigate} label={page.storyTo.label} />
          )}
        </div>

        {page.note && <p className="mt-2 text-[0.72rem] text-ig-meta text-balance-pretty">{page.note}</p>}
      </div>

      <div className="mt-3 flex border-t border-ig-border text-ig-meta">
        <span aria-hidden="true" className="flex flex-1 justify-center border-t-2 border-text py-2 text-text"><Grid3x3 size={18} /></span>
        <span aria-hidden="true" className="flex flex-1 justify-center py-2"><UserSquare size={18} /></span>
      </div>
      <div className="grid grid-cols-3 gap-0.5">
        {(page.grid ?? []).map((cell, index) => (
          <span key={cell.title || index} className="relative aspect-square overflow-hidden">
            <ArtFill art={cell.art} />
            {cell.note && (
              <span className="absolute inset-x-0 bottom-0 bg-black/35 px-1 py-0.5 text-[0.55rem] text-white">
                {cell.note}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}

function ProfileLink({ to, onNavigate, label }) {
  return (
    <button
      type="button"
      data-page-link={to}
      onClick={() => onNavigate?.(to)}
      className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-ig-border px-3 text-left text-[0.8rem] font-semibold hover:bg-ig-bubble-in"
    >
      <span className="min-w-0 flex-1">{label}</span>
      <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-ig-meta" />
    </button>
  )
}

function AboutPage({ page }) {
  return (
    <div className="px-3.5 py-4">
      <div className="flex items-center gap-2">
        <IgAvatar seed={page.handle} size="md" />
        <p className="text-[0.85rem] font-bold">@{page.handle}</p>
      </div>
      <p className="mt-3 text-[0.72rem] text-ig-meta text-balance-pretty">
        To help keep our community authentic, we show information about accounts.
      </p>
      <dl className="mt-3 divide-y divide-ig-border rounded-lg border border-ig-border">
        {page.rows.map((row) => (
          <div key={row.label} className="flex flex-wrap gap-x-3 px-3 py-2.5">
            <dt className="w-40 shrink-0 text-[0.76rem] font-semibold text-ig-meta">{row.label}</dt>
            <dd className="min-w-0 flex-1 text-[0.82rem] break-words">{row.value}</dd>
          </div>
        ))}
      </dl>
      {page.formerUsernames?.length > 0 && (
        <div className="mt-3">
          <h4 className="text-[0.72rem] font-bold text-ig-meta">Former usernames</h4>
          <ul className="mt-1 divide-y divide-ig-border rounded-lg border border-ig-border">
            {page.formerUsernames.map((item) => (
              <li key={item.handle} className="flex justify-between gap-2 px-3 py-2 text-[0.8rem]">
                <span className="break-all">@{item.handle}</span>
                <span className="shrink-0 text-ig-meta">{item.when}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {page.formerUsernames?.length === 0 && (
        <p className="mt-3 text-[0.78rem] text-ig-meta">This account has no former usernames.</p>
      )}
      {page.note && <p className="mt-2 text-[0.76rem] text-ig-meta text-balance-pretty">{page.note}</p>}
    </div>
  )
}

function PeoplePage({ page }) {
  return (
    <div className="py-2">
      {page.heading && <p className="px-3.5 py-1 text-[0.78rem] font-semibold">{page.heading}</p>}
      <ul className="divide-y divide-ig-border">
        {page.people.map((person) => (
          <li key={person.handle} className="flex items-center gap-3 px-3.5 py-2">
            <IgAvatar seed={person.handle} size="md" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.82rem] font-semibold">{person.handle}</span>
              {(person.name || person.note) && (
                <span className="block truncate text-[0.72rem] text-ig-meta">{person.name || person.note}</span>
              )}
              {person.name && person.note && (
                <span className="block truncate text-[0.68rem] text-ig-meta">{person.note}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
      {page.note && <p className="px-3.5 py-2 text-[0.74rem] text-ig-meta text-balance-pretty">{page.note}</p>}
    </div>
  )
}

function SearchPage({ page, onNavigate }) {
  return (
    <div className="py-2">
      <div className="mx-3 mb-2 flex items-center gap-2 rounded-lg bg-ig-bubble-in px-3 py-2 text-[0.82rem]">
        <Search size={14} aria-hidden="true" className="shrink-0 text-ig-meta" />
        <span className="sr-only">Searched for </span>
        <span className="min-w-0 truncate">{page.query}</span>
      </div>
      <ul className="divide-y divide-ig-border">
        {page.results.map((result) => {
          const row = (
            <div className="flex w-full items-center gap-3 px-3.5 py-2 text-left">
              <IgAvatar seed={result.handle} name={result.name} size="md" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-[0.82rem] font-semibold">
                  <span className="truncate">{result.handle}</span>
                  {result.verified && <Verified size={11} />}
                </span>
                <span className="block truncate text-[0.72rem] text-ig-meta">
                  {result.name}{result.note ? ` · ${result.note}` : ''}
                </span>
              </span>
              {result.to && <ChevronRight size={15} aria-hidden="true" className="shrink-0 text-ig-meta" />}
            </div>
          )
          return (
            <li key={result.handle}>
              {result.to ? (
                <button
                  type="button"
                  data-page-link={result.to}
                  onClick={() => onNavigate?.(result.to)}
                  className="w-full hover:bg-ig-bubble-in"
                >
                  {row}
                </button>
              ) : row}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function PostPage({ page }) {
  return (
    <article className="pb-2">
      <header className="flex items-center gap-2.5 px-3 py-2.5">
        <IgAvatar seed={page.handle} size="md" ring />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1 text-[0.85rem] font-semibold">
            <span className="truncate">{page.handle}</span>
            {page.verified && <Verified size={12} />}
          </span>
          {page.subline && <span className="block text-[0.66rem] text-ig-meta">{page.subline}</span>}
        </span>
      </header>
      <PostMedia slides={page.slides} />
      <PostActions />
      {page.likes && <p className="px-3 pt-2 text-[0.8rem] font-semibold tabular-nums">{page.likes}</p>}
      {page.caption && (
        <p className="px-3 pt-1 text-[0.82rem] break-words">
          <span className="font-semibold">{page.handle}</span>{' '}
          <span className="text-balance-pretty">{page.caption}</span>
        </p>
      )}
      {page.time && <p className="px-3 pt-1 text-[0.62rem] tracking-wide text-ig-meta uppercase">{page.time}</p>}
      {(page.comments ?? []).length > 0 && (
        <div className="mt-2 border-t border-ig-border pt-1">
          {page.comments.map((comment, index) => (
            <IgComment key={comment.author + index} beat={comment} />
          ))}
        </div>
      )}
    </article>
  )
}

function SettingsPage({ page, onNavigate }) {
  return (
    <div className="py-2">
      {page.username && <p className="px-3.5 py-2 text-[0.8rem] font-bold">{page.username}</p>}
      <ul className="divide-y divide-ig-border">
        {page.rows.map((row) => (
          <li key={row.label}>
            {row.to ? (
              <button
                type="button"
                data-page-link={row.to}
                onClick={() => onNavigate?.(row.to)}
                className="flex min-h-12 w-full items-center gap-3 px-3.5 py-2 text-left hover:bg-ig-bubble-in"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.85rem] font-semibold">{row.label}</span>
                  <span className="block truncate text-[0.72rem] text-ig-meta">{row.value}</span>
                </span>
                <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-ig-meta" />
              </button>
            ) : (
              <div className="flex min-h-12 items-center gap-3 px-3.5 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.85rem] font-semibold">{row.label}</span>
                  <span className="block truncate text-[0.72rem] text-ig-meta">{row.value}</span>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function StatusPage({ page }) {
  return (
    <div className="px-3.5 py-4">
      <h3 className="text-base font-bold">{page.heading}</h3>
      <ul className="mt-3 divide-y divide-ig-border rounded-lg border border-ig-border">
        {/*
          Keyed on the position as well as the label: a login-activity list legitimately
          repeats a label ("Login · Pune, IN" twice), and keying on the label alone made
          React drop one of them (found in IMMERSIVE-004C browser play).
        */}
        {page.statusRows.map((row, index) => (
          <li key={`${row.label}-${index}`} className="flex items-start gap-3 px-3 py-2.5">
            {/*
              A tick where the app shows everything is in order; a neutral dot where a setting is
              simply what it is. Neither is a verdict on the scenario.
            */}
            <span
              aria-hidden="true"
              className={cn('mt-0.5 grid size-5 shrink-0 place-items-center rounded-full', row.ok ? 'bg-success-soft text-success' : 'bg-secondary-soft text-text-muted')}
            >
              {row.ok ? <Check size={13} /> : <Circle size={8} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.82rem] font-semibold">{row.label}</span>
              <span className="block text-[0.76rem] text-ig-meta text-balance-pretty">{row.value}</span>
            </span>
          </li>
        ))}
      </ul>
      {page.note && <p className="mt-3 text-[0.76rem] text-ig-meta text-balance-pretty">{page.note}</p>}
    </div>
  )
}

/**
 * A story, as the viewer shows it: progress segments, the author and how long ago, a drawn
 * frame and the stickers on it. Nothing plays, nothing loads and it never advances on its
 * own - a story that disappeared while the learner was reading it would be a timer deciding
 * what they saw.
 */
function StoryPage({ page }) {
  return (
    <div className="bg-black p-2 text-white">
      <div aria-hidden="true" className="flex gap-1 px-1 pt-1">
        {Array.from({ length: page.segments ?? 1 }, (_, index) => (
          <span key={index} className={cn('h-0.5 flex-1 rounded-full', index === 0 ? 'bg-white' : 'bg-white/35')} />
        ))}
      </div>
      <div className="flex items-center gap-2 px-1 py-2">
        <IgAvatar seed={page.handle} art={page.avatarArt} size="sm" />
        <p className="min-w-0 flex-1 truncate text-[0.8rem] font-semibold">
          {page.handle} <span className="font-normal text-white/70">{page.time}</span>
        </p>
      </div>
      <div className="relative aspect-[9/14] w-full overflow-hidden rounded-xl">
        <ArtFill art={page.art} />
        {page.sticker && (
          <span className="absolute top-[18%] left-1/2 -translate-x-1/2 rounded-lg bg-white px-2.5 py-1 text-[0.72rem] font-bold text-text shadow">
            {page.sticker}
          </span>
        )}
        {page.caption && (
          <span className="absolute inset-x-3 bottom-[14%] rounded-md bg-black/55 px-2 py-1.5 text-center text-[0.8rem] font-semibold">
            {page.caption}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * A reel in its own player (IMMERSIVE-004B): the frame, the account and its audio, the
 * caption and counts. Frames are stepped by hand like a paused video; nothing plays, loads
 * or advances by itself. The account row walks to the author's profile page when the scene
 * gives one - navigation, never a decision.
 */
function ReelPage({ page, onNavigate }) {
  return (
    <div className="bg-black pb-3 text-white">
      <PostMedia slides={page.slides} shape="tall" reel />
      <div className="px-3 pt-2.5">
        <div className="flex items-center gap-2">
          <IgAvatar seed={page.handle} art={page.avatarArt} size="sm" />
          {page.profileTo ? (
            <button
              type="button"
              data-page-link={page.profileTo}
              onClick={() => onNavigate?.(page.profileTo)}
              className="flex min-h-11 min-w-0 items-center gap-1 rounded-md text-[0.85rem] font-semibold hover:underline"
            >
              <span className="truncate">{page.handle}</span>
              {page.verified && <Verified size={12} />}
            </button>
          ) : (
            <p className="flex min-w-0 items-center gap-1 text-[0.85rem] font-semibold">
              <span className="truncate">{page.handle}</span>
              {page.verified && <Verified size={12} />}
            </p>
          )}
          {page.label && <span className="shrink-0 text-[0.7rem] text-white/70">· {page.label}</span>}
        </div>
        {page.caption && <p className="mt-1.5 text-[0.8rem] break-words text-balance-pretty">{page.caption}</p>}
        {page.audio && <p className="mt-1.5 text-[0.7rem] text-white/75">♫ {page.audio}</p>}
        {page.counts && <p className="mt-1 text-[0.7rem] text-white/75 tabular-nums">{page.counts}</p>}
      </div>
    </div>
  )
}

/**
 * A plain list of rows (IMMERSIVE-004B) - the suggestions under "Add location", or the
 * results of searching inside a conversation. Each row is a title, a line of text and a
 * small meta line; a row is never a control of its own.
 */
function ListPage({ page }) {
  return (
    <div className="py-2">
      {page.query && (
        <div className="mx-3 mb-2 flex items-center gap-2 rounded-lg bg-ig-bubble-in px-3 py-2 text-[0.82rem]">
          <Search size={14} aria-hidden="true" className="shrink-0 text-ig-meta" />
          <span className="sr-only">Searched for </span>
          <span className="min-w-0 truncate">{page.query}</span>
        </div>
      )}
      {page.heading && <p className="px-3.5 py-1 text-[0.78rem] font-semibold">{page.heading}</p>}
      <ul className="divide-y divide-ig-border">
        {page.rows.map((row) => (
          <li key={row.title + (row.text ?? '')} className="flex items-start gap-3 px-3.5 py-2.5">
            {row.icon === 'place' && (
              <MapPin size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ig-meta" />
            )}
            {/* A saved item's cover (IMMERSIVE-004C). Drawn, like every tile in this app. */}
            {row.art && (
              <span className="size-12 shrink-0 overflow-hidden rounded-md"><ArtFill art={row.art} /></span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block text-[0.82rem] font-semibold break-words">{row.title}</span>
              {row.text && <span className="block text-[0.78rem] break-words text-balance-pretty">{row.text}</span>}
              {row.meta && <span className="block text-[0.68rem] text-ig-meta">{row.meta}</span>}
            </span>
          </li>
        ))}
      </ul>
      {page.note && <p className="px-3.5 py-2 text-[0.74rem] text-ig-meta text-balance-pretty">{page.note}</p>}
    </div>
  )
}

/**
 * A tag request as the app's review sheet draws it (IMMERSIVE-004E, I21): the post's frame, who
 * wants to tag you, the facts of the post, and who will see it on your profile.
 *
 * The audience is a real choice the learner can make here, and it is LOCAL component state: it
 * is never lifted, never put on an affordance and never sent. Approve and Decline are the
 * scene's controls, drawn under the page like on every other surface; which audience was
 * picked is presentation, not a decision the engine scores.
 */
function ReviewPage({ page, onNavigate }) {
  const options = page.audience?.options ?? []
  const [audience, setAudience] = useState(page.audience?.initial ?? options[0] ?? null)

  return (
    <div className="px-3.5 py-3">
      <div className="flex items-center gap-3">
        <span className="size-16 shrink-0 overflow-hidden rounded-md border border-ig-border">
          <ArtFill art={page.art} />
        </span>
        <p className="min-w-0 flex-1 text-[0.82rem] break-words">
          <span className="font-semibold">{page.handle}</span> {page.text}
        </p>
      </div>
      {page.rows?.length > 0 && (
        <dl className="mt-3 divide-y divide-ig-border rounded-lg border border-ig-border">
          {page.rows.map((row) => (
            <div key={row.label} className="flex flex-wrap gap-x-3 px-3 py-2">
              <dt className="w-32 shrink-0 text-[0.74rem] font-semibold text-ig-meta">{row.label}</dt>
              <dd className="min-w-0 flex-1 text-[0.8rem] break-words">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {options.length > 0 && (
        <fieldset className="mt-3">
          <legend className="text-[0.76rem] font-bold">{page.audience.label}</legend>
          <div role="radiogroup" aria-label={page.audience.label} className="mt-1 divide-y divide-ig-border rounded-lg border border-ig-border">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={audience === option}
                onClick={() => setAudience(option)}
                className="flex min-h-11 w-full items-center justify-between gap-3 px-3 text-left text-[0.8rem] hover:bg-ig-bubble-in"
              >
                <span>{option}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'grid size-4 shrink-0 place-items-center rounded-full border',
                    audience === option ? 'border-ig-accent' : 'border-ig-border',
                  )}
                >
                  {audience === option && <span className="size-2 rounded-full bg-ig-accent" />}
                </span>
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {(page.links ?? []).length > 0 && (
        <div className="mt-3 space-y-1">
          {page.links.map((item) => (
            <ProfileLink key={item.id} to={item.to} onNavigate={onNavigate} label={item.label} />
          ))}
        </div>
      )}
      {page.note && <p className="mt-2 text-[0.72rem] text-ig-meta text-balance-pretty">{page.note}</p>}
    </div>
  )
}

const VIEWS = {
  review: ReviewPage,
  reel: ReelPage,
  list: ListPage,
  story: StoryPage,
  profile: ProfilePage,
  about: AboutPage,
  people: PeoplePage,
  search: SearchPage,
  post: PostPage,
  settings: SettingsPage,
  status: StatusPage,
}

export function SocialSurface({ surface, page, nested = false, onBack, onNavigate, controls, renderControl }) {
  const pageId = page ?? surface.home
  const current = surface.pages[pageId] ?? surface.pages[surface.home]
  const View = VIEWS[current.view] ?? ProfilePage
  const title = current.title
    ?? (current.view === 'profile' ? current.handle
      : current.view === 'post' ? 'Post'
        : current.view === 'reel' ? 'Reels' : surface.title)

  return (
    <Screen
      title={title}
      onBack={onBack}
      backLabel={nested ? 'Back to the previous screen' : 'Close and go back'}
      tone="light"
      footer={<InertNote>Simulated Instagram screen. Nothing here is a live account.</InertNote>}
    >
      {/*
        A page that carries controls sizes to its content, so the controls sit directly under
        what they act on (IMMERSIVE-004B: a short "Add location" list pushed them off-screen).
      */}
      <div className={cn('bg-ig-surface', controls.length === 0 && 'min-h-full')}>
        <View page={current} onNavigate={onNavigate} />
      </div>
      {controls.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-ig-border bg-ig-surface px-3.5 py-3">
          {controls.map(renderControl)}
        </div>
      )}
    </Screen>
  )
}
