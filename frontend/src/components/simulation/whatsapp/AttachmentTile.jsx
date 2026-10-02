import { ImageIcon, MapPin, Mic, Package, ShieldHalf } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * What an attachment looks like, drawn rather than loaded (IMMERSIVE-003B).
 *
 * Several of the W06-W10 decisions are about a picture: a crest that is meant to look
 * official, a service card staged in a gallery, a QR code that is really a device-link
 * authorisation. The learner has to be able to SEE that something is there, and it has to
 * be recognisably that kind of thing, before "do not send this" is a decision rather than
 * a reading exercise.
 *
 * None of it is an image file. There is no `img`, no `src` and no asset directory in this
 * product, because a scenario that needed one could not survive the network being off and
 * would put a fetchable URL inside a simulation whose whole premise is that nothing
 * fetches. So a tile is CSS and inline elements: a QR is a deterministic grid of squares
 * derived from its own label, a crest is a drawn roundel, a photo is a soft field with a
 * glyph. `SceneContainment.test.jsx` asserts the absence of `src` on every screen, which
 * is what keeps it that way.
 *
 * The pattern encodes nothing and decodes to nothing. What a QR "contains" is stated in
 * words by the viewer the scene pushes, which is also the only place it could honestly be
 * stated - a real reader is the one thing an offline simulation cannot have.
 */

/** A stable 0-1 value per cell, so one label always draws the same pattern. */
function cells(seed, size) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0

  const total = size * size
  const out = new Array(total)
  for (let i = 0; i < total; i += 1) {
    hash = (hash * 1103515245 + 12345) >>> 0
    out[i] = (hash >>> 16) % 100 < 46
  }
  return out
}

/** The three finder squares that make a QR read as a QR at a glance. */
function Finder({ className }) {
  return (
    <span className={cn('absolute grid place-items-center bg-text', className)}>
      <span className="grid size-[62%] place-items-center bg-white">
        <span className="size-[55%] bg-text" />
      </span>
    </span>
  )
}

function QrArt({ label, size = 15 }) {
  return (
    <span
      aria-hidden="true"
      className="relative block aspect-square w-full max-w-[10.5rem] rounded-sm bg-white p-[7%]"
    >
      <span
        className="grid size-full gap-px"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {cells(label, size).map((on, index) => (
          <span
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className={cn('block aspect-square rounded-[1px]', on ? 'bg-text' : 'bg-transparent')}
          />
        ))}
      </span>
      <Finder className="top-[7%] left-[7%] size-[24%]" />
      <Finder className="top-[7%] right-[7%] size-[24%]" />
      <Finder className="bottom-[7%] left-[7%] size-[24%]" />
    </span>
  )
}

/** A drawn crest: the kind of generic official-looking mark anyone can make. */
function CrestArt() {
  return (
    <span
      aria-hidden="true"
      className="grid aspect-[4/3] w-full place-items-center rounded-sm bg-gradient-to-b from-secondary-soft to-background"
    >
      <span className="grid size-16 place-items-center rounded-full border-2 border-secondary/40 text-secondary">
        <ShieldHalf size={30} />
      </span>
    </span>
  )
}

/** A drawn identity card, front or back. */
function CardArt({ label }) {
  return (
    <span
      aria-hidden="true"
      className="block aspect-[16/10] w-full rounded-sm border border-border bg-gradient-to-br from-secondary-soft to-surface p-2"
    >
      <span className="flex items-center gap-1.5">
        <span className="size-4 rounded-full bg-secondary/30" />
        <span className="h-1.5 w-14 rounded-full bg-secondary/30" />
      </span>
      <span className="mt-2 flex gap-2">
        <span className="h-9 w-7 rounded-xs bg-secondary/25" />
        <span className="mt-0.5 flex-1 space-y-1.5">
          <span className="block h-1.5 w-full rounded-full bg-text-muted/25" />
          <span className="block h-1.5 w-4/5 rounded-full bg-text-muted/25" />
          <span className="block h-1.5 w-3/5 rounded-full bg-text-muted/25" />
        </span>
      </span>
      <span className="mt-1.5 block text-[0.5rem] font-semibold tracking-wide text-text-muted uppercase">
        {label}
      </span>
    </span>
  )
}

function PhotoArt() {
  return (
    <span
      aria-hidden="true"
      className="grid aspect-[4/3] w-full place-items-center rounded-sm bg-gradient-to-br from-secondary-soft via-background to-secondary-soft text-text-muted"
    >
      <ImageIcon size={28} />
    </span>
  )
}

/**
 * A screenshot of a trading app with a rising chart and a large number (IMMERSIVE-003C).
 * What an investment group posts as proof. It is drawn, so it proves exactly as much as
 * the real ones do.
 */
function ChartArt() {
  const bars = [18, 26, 22, 34, 41, 38, 52, 60, 57, 72, 81, 92]
  return (
    <span
      aria-hidden="true"
      className="block aspect-[4/3] w-full rounded-sm border border-border bg-surface p-2"
    >
      <span className="flex items-center justify-between">
        <span className="h-1.5 w-12 rounded-full bg-text-muted/30" />
        <span className="h-1.5 w-6 rounded-full bg-success/50" />
      </span>
      <span className="mt-1.5 block h-3 w-20 rounded-sm bg-success/70" />
      <span className="mt-2 flex h-[48%] items-end gap-[3px]">
        {bars.map((height, index) => (
          <span
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className="block flex-1 rounded-t-[1px] bg-success/60"
            style={{ height: `${height}%` }}
          />
        ))}
      </span>
    </span>
  )
}

/** A printed page with a crest, lines of text, a stamp and a signature stroke. */
function DocumentArt() {
  return (
    <span
      aria-hidden="true"
      className="mx-auto block aspect-[3/4] w-3/4 rounded-sm border border-border bg-surface p-2.5 shadow-xs"
    >
      <span className="mx-auto grid size-6 place-items-center rounded-full border border-secondary/40 text-secondary">
        <ShieldHalf size={12} />
      </span>
      <span className="mx-auto mt-1.5 block h-1.5 w-2/3 rounded-full bg-text/40" />
      <span className="mt-2.5 block space-y-1.5">
        {['w-full', 'w-11/12', 'w-full', 'w-4/5', 'w-full', 'w-3/5'].map((width, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <span key={index} className={cn('block h-1 rounded-full bg-text-muted/25', width)} />
        ))}
      </span>
      <span className="mt-3 flex items-end justify-between">
        <span className="block h-1 w-10 rotate-[-6deg] rounded-full bg-info/50" />
        <span className="block size-7 rounded-full border-2 border-danger/40" />
      </span>
    </span>
  )
}

/** An Android package: the app's own box, since there is nothing in it to preview. */
function PackageArt() {
  return (
    <span
      aria-hidden="true"
      className="grid aspect-[4/3] w-full place-items-center rounded-sm bg-gradient-to-br from-secondary-soft to-background text-secondary"
    >
      <Package size={34} />
    </span>
  )
}

/** A voice recording, as a waveform with a microphone - there is no audio to show. */
function VoiceArt() {
  const bars = [30, 52, 44, 70, 38, 82, 60, 46, 74, 34, 58, 40, 66, 28, 50, 36]
  return (
    <span
      aria-hidden="true"
      className="flex aspect-[4/3] w-full items-center justify-center gap-[3px] rounded-sm bg-gradient-to-br from-secondary-soft to-background px-6"
    >
      <Mic size={22} className="mr-2 shrink-0 text-secondary" />
      {bars.map((height, index) => (
        <span
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className="block w-[4px] rounded-full bg-secondary/50"
          style={{ height: `${height / 2}%` }}
        />
      ))}
    </span>
  )
}

/**
 * A drawn street map with a position pin (IMMERSIVE-003D).
 *
 * The preview a location sheet shows before anything is shared. Blocks of colour and two
 * roads - no tile, no coordinates, no place anyone could recognise - because what the
 * learner needs to see is that the phone is about to hand over "where I am", not where that
 * is.
 */
function MapArt() {
  return (
    <span
      aria-hidden="true"
      className="relative block aspect-[4/3] w-full max-w-[16rem] overflow-hidden rounded-sm bg-success-soft"
    >
      <span className="absolute top-[12%] left-[8%] h-[30%] w-[26%] rounded-sm bg-surface/60" />
      <span className="absolute right-[10%] bottom-[10%] h-[26%] w-[34%] rounded-sm bg-info-soft" />
      <span className="absolute inset-x-0 top-[52%] h-[7%] bg-surface" />
      <span className="absolute inset-y-0 left-[44%] w-[6%] bg-surface" />
      <span className="absolute top-[30%] left-[47%] grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center">
        <span className="absolute size-9 rounded-full bg-info/20" />
        <MapPin size={24} className="relative fill-info/25 text-info" />
      </span>
    </span>
  )
}

/**
 * A screenshot of a phone "scan" screen: a status bar, a warning band and result rows
 * (IMMERSIVE-003E). What a support impostor sends as a diagnosis. Drawn, and neutral about
 * itself - what the picture shows is stated in words by the viewer.
 */
function ScanArt() {
  return (
    <span
      aria-hidden="true"
      className="mx-auto block aspect-[3/4] w-2/3 rounded-md border border-border bg-surface p-2"
    >
      <span className="flex items-center justify-between">
        <span className="h-1 w-8 rounded-full bg-text-muted/30" />
        <span className="h-1 w-5 rounded-full bg-text-muted/30" />
      </span>
      <span className="mt-2 block h-5 w-full rounded-sm bg-danger/60" />
      <span className="mt-2 block space-y-1.5">
        {['w-full', 'w-5/6', 'w-full', 'w-2/3'].map((width, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <span key={index} className="flex items-center gap-1">
            <span className="size-1.5 shrink-0 rounded-full bg-danger/50" />
            <span className={cn('block h-1 rounded-full bg-text-muted/25', width)} />
          </span>
        ))}
      </span>
      <span className="mx-auto mt-3 block h-3 w-3/5 rounded-full bg-info/50" />
    </span>
  )
}

/**
 * A screenshot of a desktop browser window with a code-entry box (IMMERSIVE-003E). The
 * words on the screen are stated by the viewer; the tile only has to read as "a computer
 * screen someone photographed".
 */
function DesktopArt() {
  return (
    <span
      aria-hidden="true"
      className="block aspect-[16/10] w-full rounded-sm border border-border bg-background p-1.5"
    >
      <span className="flex items-center gap-1">
        {[0, 1, 2].map((dot) => (
          <span key={dot} className="size-1.5 rounded-full bg-text-muted/35" />
        ))}
        <span className="ml-1 h-1.5 flex-1 rounded-full bg-text-muted/20" />
      </span>
      <span className="mx-auto mt-2 block w-3/4 rounded-sm bg-surface p-1.5">
        <span className="mx-auto block h-1.5 w-1/2 rounded-full bg-text/35" />
        <span className="mt-1.5 flex justify-center gap-0.5">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((box) => (
            <span key={box} className="block h-2.5 w-2 rounded-[1px] border border-text-muted/40" />
          ))}
        </span>
        <span className="mx-auto mt-1.5 block h-1 w-2/3 rounded-full bg-text-muted/25" />
      </span>
    </span>
  )
}

const ARTS = {
  scan: ScanArt,
  desktop: DesktopArt,
  map: MapArt,
  crest: CrestArt,
  chart: ChartArt,
  document: DocumentArt,
  apk: PackageArt,
  voice: VoiceArt,
}

export function AttachmentTile({ art = 'photo', label = '', compact = false }) {
  const Art = ARTS[art]
  const body = art === 'qr'
    ? <QrArt label={label || 'qr'} size={compact ? 11 : 15} />
    : art === 'card'
      ? <CardArt label={label} />
      : Art ? <Art /> : <PhotoArt />

  return (
    <span className={cn('flex justify-center', art === 'qr' && 'py-1')}>
      {body}
      {/* What a screen reader is told, since the tile itself is decoration. */}
      <span className="sr-only">{label || 'Attachment'}</span>
    </span>
  )
}
