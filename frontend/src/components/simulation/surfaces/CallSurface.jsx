import { useEffect, useRef, useState } from 'react'
import { ChevronRight, Mic, PhoneOff, Video, Volume2 } from 'lucide-react'
import { Avatar } from '@/components/simulation/whatsapp/ChatBlocks'
import { InertNote, Screen } from '@/components/simulation/surfaces/SurfaceFrame'
import { cn } from '@/utils/cn'

/**
 * A call (IMMERSIVE-003A; video mode added by IMMERSIVE-003C).
 *
 * It rings, connects, counts up and captions what the other side says - and it is all
 * text and CSS. No microphone, no camera, no dialer, no audio or video element and no
 * permission prompt: the platform never learns a call was simulated because nothing
 * platform-level is ever touched.
 *
 * The captions are a live region so a screen-reader user hears the conversation as it
 * arrives rather than having to go looking for it.
 *
 * **Video mode** is W12's. The other side's picture is drawn, not streamed - a figure in a
 * uniform in front of an office wall, the kind of backdrop anyone can stage - and the
 * pressure the call applies is on screen the way it would be: a countdown the caller has
 * put in the frame, and a line telling the learner not to hang up. Two things follow from
 * the call being where the decision happens:
 *
 * - `links` are LOCAL routes out of the call to another screen (the "deposit" sheet the
 *   caller is pushing), drawn here because a pushed surface has no overflow menu;
 * - `endCallScored` hands "End call" to the scene. While the stage offers controls on this
 *   call, hanging up IS the decision and is one of them, so the call's own local button
 *   steps aside rather than offering a second, unscored way to do the same thing. Once the
 *   stage has moved on the local button comes back, because a call screen with no way to
 *   end the call would be a trap.
 */

const mmss = (seconds) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

/** The other side of a video call, drawn. A figure, a cap, a badge and a wall - no image. */
function RemoteVideo({ remote, overlay }) {
  return (
    <div
      className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-b from-secondary to-primary-active"
      data-testid="call-video"
    >
      {/* The backdrop: a shelf line and a noticeboard, the scenery of an office. */}
      <span aria-hidden="true" className="absolute inset-x-0 top-[18%] h-px bg-white/15" />
      <span aria-hidden="true" className="absolute top-[8%] right-[10%] h-[16%] w-[26%] rounded-sm bg-white/10" />
      <span aria-hidden="true" className="absolute top-[8%] left-[10%] h-[10%] w-[18%] rounded-sm bg-white/10" />

      {remote?.figure === 'agent' ? (
        /**
         * IMMERSIVE-004E (I22): a person at a desk with a headset and a lanyard in front of a
         * plain wall with a shield sticker - the backdrop a "support agent" stages. Drawn.
         */
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 flex h-[74%] flex-col items-center justify-end">
          <span className="absolute top-[4%] right-[14%] grid size-[14%] place-items-center rounded-md bg-white/15 text-[0.55rem] font-bold text-white/70">✓</span>
          <span className="relative aspect-square w-[24%] rounded-full bg-[#c9a27e]">
            <span className="absolute -inset-x-[12%] top-[8%] h-[40%] rounded-t-full border-4 border-b-0 border-black/70" />
            <span className="absolute top-[42%] -left-[16%] size-[26%] rounded-full bg-black/80" />
            <span className="absolute top-[60%] -left-[4%] h-[6%] w-[40%] rotate-[20deg] bg-black/70" />
          </span>
          <span className="-mt-[1%] h-[5%] w-[9%] bg-[#b88f6c]" />
          <span className="relative h-[42%] w-[82%] rounded-t-[40%] bg-[#3b5b8c]">
            <span className="absolute inset-x-[48%] top-0 h-[46%] bg-white/70" />
            <span className="absolute top-[46%] left-[44%] h-[18%] w-[12%] rounded-sm bg-white/80" />
          </span>
        </span>
      ) : (
      /*
        The figure: a peaked cap, a face, and shoulders in an olive tunic with a badge and a
        name tape. The container has an explicit height so the parts' percentage heights
        resolve against it rather than collapsing to nothing.
      */
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 flex h-[74%] flex-col items-center justify-end">
        <span className="relative z-10 h-[9%] w-[26%] rounded-t-[45%] bg-primary-active" />
        <span className="relative z-10 h-[3%] w-[34%] rounded-full bg-primary-active" />
        <span className="-mt-[1%] aspect-square w-[22%] rounded-full bg-[#c9a27e]" />
        <span className="-mt-[1%] h-[5%] w-[9%] bg-[#b88f6c]" />
        <span className="relative h-[42%] w-[82%] rounded-t-[40%] bg-[#4a5a3a]">
          <span className="absolute top-[24%] left-[22%] size-[8%] rounded-full bg-app-wallet-accent" />
          <span className="absolute top-[22%] right-[18%] h-[6%] w-[20%] rounded-sm bg-white/60" />
          <span className="absolute inset-x-[46%] top-0 h-[30%] bg-black/15" />
        </span>
      </span>
      )}

      {overlay && (
        <p className="absolute inset-x-2 top-2 rounded-md bg-black/45 px-2 py-1 text-center text-[0.66rem] font-bold tracking-wide text-white uppercase">
          {overlay}
        </p>
      )}
      <span className="sr-only">{remote?.label ?? 'Video from the other side of the call'}</span>
      {remote?.name && (
        <p className="absolute bottom-2 left-2 rounded-md bg-black/45 px-2 py-0.5 text-[0.7rem] font-semibold text-white">
          {remote.name}
        </p>
      )}
      {/* Self view: the learner's own camera, which this simulation never turns on. */}
      <span
        aria-hidden="true"
        className="absolute right-2 bottom-2 grid h-[22%] w-[22%] place-items-center rounded-md border border-white/40 bg-black/60 text-white/60"
      >
        <Video size={14} />
      </span>
    </div>
  )
}

export function CallSurface({ surface, onBack, onNavigate, controls, renderControl }) {
  const video = Boolean(surface.video)
  const [state, setState] = useState('ringing')
  const [seconds, setSeconds] = useState(0)
  const script = surface.script ?? []

  // Ringing, then connected. The router keys this component by call, so a different
  // call is a fresh mount and starts from `ringing` without a reset effect.
  useEffect(() => {
    const connect = setTimeout(() => setState('connected'), video ? 700 : 900)
    return () => clearTimeout(connect)
  }, [video])

  useEffect(() => {
    if (state !== 'connected') return undefined
    const tick = setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => clearInterval(tick)
  }, [state])

  const heard = state === 'connected' ? script.filter((line) => line.at <= seconds) : []
  const captionsRef = useRef(null)

  /**
   * IMMERSIVE-013, found by hand-play. Captions used to push the call's controls down as each
   * line arrived, so a scored control could move under the pointer between aiming and clicking -
   * S18's release sat exactly where its safe branch had been a second earlier. The captions now
   * live in a fixed-height log that scrolls itself to the newest line, so nothing below it moves.
   */
  useEffect(() => {
    const log = captionsRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [heard.length])
  const ended = state === 'ended'
  const sceneOwnsEndCall = Boolean(surface.endCallScored) && controls.length > 0
  const countdown = surface.countdown && state === 'connected'
    ? Math.max(0, surface.countdown.from - seconds)
    : null

  const status = (
    <p className="text-[0.78rem] font-semibold tabular-nums" role="status">
      {state === 'ringing' && (video ? 'Connecting video...' : 'Ringing...')}
      {state === 'connected' && (
        <>
          <span className="sr-only">Call duration </span>
          {mmss(seconds)}
        </>
      )}
      {ended && 'Call ended'}
    </p>
  )

  return (
    <Screen
      title={surface.title}
      subtitle={video ? surface.number : null}
      onBack={onBack}
      backLabel={surface.backLabel ?? 'Back to the conversation'}
      footer={(
        <InertNote>
          {video
            ? 'Simulated video call. No camera, microphone or dialer was used.'
            : 'Simulated call. No microphone, camera or dialer was used.'}
        </InertNote>
      )}
    >
      {video ? (
        <div className="bg-black text-white">
          <RemoteVideo remote={surface.remote} overlay={state === 'connected' ? surface.overlay : null} />
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{surface.caller}</p>
              <div className="text-white/80">{status}</div>
            </div>
            {countdown !== null && (
              <p
                className="shrink-0 rounded-md bg-danger px-2 py-1 text-right text-[0.66rem] font-bold uppercase"
                data-testid="call-countdown"
              >
                {surface.countdown.label}
                <span className="block font-mono text-sm tabular-nums">{mmss(countdown)}</span>
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 bg-primary px-4 py-6 text-center text-primary-contrast">
          <Avatar seed={surface.caller} size="xl" />
          <h3 className="text-base font-bold text-balance-pretty">{surface.caller}</h3>
          <p className="text-sm text-white/80 tabular-nums">{surface.number}</p>
          <div className="text-white/90">{status}</div>
          <span aria-hidden="true" className="mt-1 flex gap-6 text-white/70">
            <Mic size={16} />
            <Volume2 size={16} />
          </span>
        </div>
      )}

      <div className="px-3.5 py-3">
        <h4 className="text-[0.68rem] font-bold tracking-wide text-text-muted uppercase">
          Live captions
        </h4>
        <ul
          ref={captionsRef}
          // A scrollable region must be focusable, so a keyboard user can read back what was said.
          tabIndex={0}
          className="mt-2 h-44 space-y-2 overflow-y-auto overscroll-contain rounded-md pr-1 focus-visible:outline-2 focus-visible:outline-primary"
          data-testid="call-captions"
          role="log"
          aria-live="polite"
          aria-label="Call captions"
        >
          {heard.map((line) => (
            <li
              key={line.at}
              className={cn(
                'animate-bubble-in max-w-[90%] rounded-lg px-3 py-2 text-[0.82rem] text-balance-pretty',
                line.speaker === 'you'
                  ? 'ml-auto rounded-br-none bg-wa-bubble-out'
                  : 'rounded-bl-none bg-secondary-soft',
              )}
            >
              {line.speaker === 'you' && <span className="sr-only">You: </span>}
              {line.text}
            </li>
          ))}
          {!heard.length && !ended && (
            <li className="text-[0.78rem] text-text-muted">Waiting for the other side to answer.</li>
          )}
        </ul>
      </div>

      {(surface.links ?? []).length > 0 && state === 'connected' && (
        <ul className="space-y-1 px-3.5 pb-1">
          {surface.links.map((link) => (
            <li key={link.id}>
              <button
                type="button"
                data-page-link={link.to}
                onClick={() => onNavigate?.(link.to)}
                className="inline-flex min-h-11 items-center gap-1 rounded-md px-1 text-[0.8rem] font-semibold text-primary hover:underline"
              >
                {link.label}
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2 px-3.5 pb-4" data-testid="call-controls">
        {!ended && !sceneOwnsEndCall && (
          <button
            type="button"
            onClick={() => setState('ended')}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-danger px-4 text-sm font-semibold text-white"
          >
            <PhoneOff size={16} aria-hidden="true" />
            End call
          </button>
        )}
        {controls.map(renderControl)}
      </div>
    </Screen>
  )
}
