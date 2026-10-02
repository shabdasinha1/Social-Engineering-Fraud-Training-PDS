import { CHANNELS } from '@/constants/channels'
import { ASSESSMENT_SCENARIO_COUNT } from '@/constants/app'
import { cn } from '@/utils/cn'

/**
 * The learner entry screen's visual system (ENHANCEMENT-002).
 *
 * Everything here is decoration, and it is kept honest on purpose: nothing implies live
 * network activity, no address, host or operational system is named, and every label is
 * either a fact the screen already states (four simulated channels, a set of ten messages,
 * synthetic content) or plainly generic. It makes no request, reads no data and runs no
 * JavaScript timer - all movement is CSS transform/opacity, behind `motion-safe:`, so
 * prefers-reduced-motion gets the same composition standing still.
 */

/**
 * The canvas behind the whole screen: a faint drifting grid, two slow ambient glows, a
 * vignette and one scan band travelling down the page. Sits under the content in the
 * layout's own stacking context and never receives pointer events.
 */
export function EntryBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden motion-safe:animate-entry-backdrop"
    >
      {/* One grid cell taller than the viewport, so the 32px loop never shows an edge. */}
      <div className="absolute inset-x-0 -top-8 bottom-0">
        <div className="entry-grid size-full will-change-transform motion-safe:animate-entry-grid" />
      </div>

      <div className="absolute -inset-[15%] will-change-transform motion-safe:animate-entry-drift">
        <div className="absolute top-[8%] left-[4%] size-[62vmax] rounded-full bg-[radial-gradient(closest-side,var(--color-entry-glow-deep),transparent)]" />
        <div className="absolute right-[6%] bottom-[4%] size-[52vmax] rounded-full bg-[radial-gradient(closest-side,var(--color-entry-glow),transparent)]" />
      </div>

      {/* The scan band: removed outright when motion is reduced, not merely paused. */}
      <div className="absolute inset-0 hidden will-change-transform motion-safe:block motion-safe:animate-entry-scan">
        <div className="h-40 bg-linear-to-b from-transparent to-entry-scan" />
        <div className="h-px bg-linear-to-r from-transparent via-entry-line-strong to-transparent" />
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(0_0_0/0.45))]" />
    </div>
  )
}

/**
 * Concentric rings centred behind the login panel, so the panel reads as docked into the
 * composition rather than floating beside it. Each moving ring is its own element rotated
 * by a CSS transform, which the compositor handles without repainting the SVG.
 */
export function OrbitRings({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute top-1/2 left-1/2 aspect-square -translate-x-1/2 -translate-y-1/2',
        className,
      )}
    >
      <div className="absolute inset-[18%] rounded-full bg-[radial-gradient(closest-side,var(--color-entry-glow),transparent)]" />

      <svg viewBox="0 0 1000 1000" className="absolute inset-0 size-full" fill="none">
        <g stroke="var(--color-entry-line)" strokeWidth="1">
          <circle cx="500" cy="500" r="300" />
          <circle cx="500" cy="500" r="468" opacity="0.7" />
          <path d="M500 20v120M500 860v120M20 500h120M860 500h120" opacity="0.8" />
        </g>
        {/* Twelve ticks on the outer ring, like a bezel. */}
        <g stroke="var(--color-entry-line-strong)" strokeWidth="1.5" opacity="0.6">
          {Array.from({ length: 12 }, (_, i) => (
            <line
              key={i}
              x1="500"
              y1="26"
              x2="500"
              y2="40"
              transform={`rotate(${i * 30} 500 500)`}
            />
          ))}
        </g>
      </svg>

      <svg
        viewBox="0 0 1000 1000"
        className="absolute inset-0 size-full will-change-transform motion-safe:animate-entry-orbit"
        fill="none"
      >
        <circle
          cx="500"
          cy="500"
          r="384"
          stroke="var(--color-entry-line)"
          strokeWidth="1"
          strokeDasharray="3 11"
        />
        {/* A brighter arc riding the dashed ring, which is what makes the rotation legible. */}
        <path
          d="M500 116 A384 384 0 0 1 832 308"
          stroke="var(--color-entry-line-strong)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="832" cy="308" r="4" fill="var(--color-console-accent)" opacity="0.8" />
      </svg>

      <svg
        viewBox="0 0 1000 1000"
        className="absolute inset-0 size-full will-change-transform motion-safe:animate-entry-orbit-reverse"
        fill="none"
      >
        <circle
          cx="500"
          cy="500"
          r="436"
          stroke="var(--color-entry-line)"
          strokeWidth="1"
          strokeDasharray="60 14 4 14"
          opacity="0.75"
        />
        <path
          d="M64 500 A436 436 0 0 1 128 272"
          stroke="var(--color-entry-line-strong)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
    </div>
  )
}

/**
 * The four channels the assessment draws from, on one line that "carries" messages toward
 * the panel. A presentation of content the screen already states - it is a real list for
 * assistive technology, and only the travelling packets are decorative.
 */
export function ChannelFeed({ className, style }) {
  return (
    <div
      style={style}
      className={cn(
        'rounded-lg border border-entry-line bg-entry-raised p-4 backdrop-blur-[2px] sm:p-5',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono text-[0.68rem] tracking-[0.14em] uppercase">
        <p className="text-console-text">Simulated channels</p>
        <p className="flex items-center gap-2 text-console-muted">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-entry-ready motion-safe:animate-entry-pulse"
          />
          {ASSESSMENT_SCENARIO_COUNT} messages · synthetic content
        </p>
      </div>

      <div className="relative mt-4">
        {/* The line and its packets sit behind the chips and show through the gaps. */}
        <div aria-hidden="true" className="absolute inset-x-0 top-1/2 hidden h-px -translate-y-1/2 sm:block">
          <div className="absolute inset-0 bg-linear-to-r from-entry-line via-entry-line-strong to-entry-line" />
          {[0, 1, 2].map((packet) => (
            <div
              key={packet}
              style={{ animationDelay: `${packet * 1.73}s` }}
              className="absolute inset-0 opacity-0 will-change-transform motion-safe:animate-entry-flow motion-reduce:hidden"
            >
              <span className="absolute top-1/2 left-0 h-0.5 w-10 -translate-y-1/2 rounded-full bg-linear-to-r from-transparent to-console-accent shadow-[0_0_10px_var(--color-console-accent)]" />
            </div>
          ))}
        </div>

        <ul
          aria-label="Simulated channels"
          className="relative grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4 lg:grid-cols-2 lg:gap-2.5 xl:grid-cols-4 xl:gap-4"
        >
          {CHANNELS.map(({ key, label, icon: Icon }) => (
            <li
              key={key}
              className="flex items-center gap-2.5 rounded-md border border-entry-line bg-entry px-3 py-2.5 text-sm font-medium text-console-text"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-sm bg-console-accent-soft text-console-accent">
                <Icon size={15} aria-hidden="true" />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** Four small corner brackets framing the login panel. */
export function PanelFrame() {
  const corner = 'absolute size-5 border-console-accent/55'
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -inset-3 hidden sm:block">
      <span className={cn(corner, 'top-0 left-0 rounded-tl-md border-t border-l')} />
      <span className={cn(corner, 'top-0 right-0 rounded-tr-md border-t border-r')} />
      <span className={cn(corner, 'bottom-0 left-0 rounded-bl-md border-b border-l')} />
      <span className={cn(corner, 'right-0 bottom-0 rounded-br-md border-r border-b')} />
    </div>
  )
}
