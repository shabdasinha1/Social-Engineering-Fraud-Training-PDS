import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { AttachmentTile } from '@/components/simulation/whatsapp/AttachmentTile'
import { DetailRows, InertNote, Screen } from '@/components/simulation/surfaces/SurfaceFrame'
import { cn } from '@/utils/cn'

/**
 * Whatever the device opens an attachment with (IMMERSIVE-003B).
 *
 * A document viewer, a photo viewer, a QR inspector and the gallery you pick an
 * attachment from are one screen: a tile showing the thing, some rows of facts about it,
 * and sometimes a list you can choose from. Writing four components would have meant
 * writing the same header and the same key/value list four times.
 *
 * It is where several of the W06-W10 decisions actually get made, so the usual division
 * holds exactly: getting here is navigation and records nothing, choosing an item in the
 * gallery is navigation and records nothing, and the only thing that reaches the engine is
 * a scene affordance drawn by `SceneControl` at the bottom - the Send under a staged
 * service card, the Open under a decoded QR target.
 *
 * `rows` is the honest half of a QR inspector. A real reader is the one thing an offline
 * simulation cannot have, so what a code "contains" is stated in words here rather than
 * pretended at by the drawn pattern in the bubble.
 */

/** One selectable thing in a gallery. Selecting is local: it only changes what is shown. */
function GalleryItem({ item, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(item.id)}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-center gap-3 px-3.5 py-2.5 text-left',
        selected ? 'bg-primary-soft' : 'hover:bg-secondary-soft',
      )}
    >
      <span className="w-14 shrink-0">
        {/* The row states the name below; the tile beside it is decoration. */}
        <AttachmentTile art={item.art ?? 'photo'} compact />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.82rem] font-semibold">{item.label}</span>
        {item.value && (
          <span className="block truncate text-[0.72rem] text-text-muted">{item.value}</span>
        )}
      </span>
      {selected && (
        <span className="shrink-0 text-[0.68rem] font-bold text-primary uppercase">Selected</span>
      )}
      {!selected && <ChevronRight size={15} aria-hidden="true" className="shrink-0 text-text-muted" />}
    </button>
  )
}

export function ViewerSurface({ surface, onBack, controls, renderControl }) {
  const items = surface.items ?? []
  /**
   * Which item of a gallery is on screen.
   *
   * Local to this component, so it dies with the screen - and deliberately never reaches
   * an affordance. The engine is told that a document was released, which is the decision;
   * WHICH file was staged is presentation, and giving it to the ledger would be recording
   * a detail the learner chose about their own private content for no scoring purpose.
   */
  const [selected, setSelected] = useState(null)
  const current = items.length
    ? (items.find((item) => item.id === selected) ?? items[0])
    : null

  const art = current?.art ?? surface.art ?? 'photo'
  const label = current?.label ?? surface.label ?? surface.title
  const rows = current?.rows ?? surface.rows ?? []

  return (
    <Screen
      title={surface.title}
      subtitle={current?.value ?? surface.subtitle}
      onBack={onBack}
      backLabel={surface.backLabel ?? 'Close'}
      tone="light"
      footer={(
        <InertNote>
          {surface.inertNote ?? 'Local preview. Nothing is opened, run or sent from here.'}
        </InertNote>
      )}
    >
      <div className="bg-secondary-soft px-6 py-5">
        <AttachmentTile art={art} label={label} />
      </div>

      {surface.heading && (
        <p className="border-b border-border bg-surface px-3.5 py-2.5 text-[0.86rem] font-bold">
          {surface.heading}
        </p>
      )}

      {surface.text && (
        <p className="border-b border-border bg-surface px-3.5 py-2.5 text-[0.8rem] text-balance-pretty">
          {surface.text}
        </p>
      )}

      {rows.length > 0 && (
        <section className="mt-2 bg-surface py-1">
          <h4 className="px-3.5 pt-1.5 pb-1 text-[0.68rem] font-bold tracking-wide text-text-muted uppercase">
            {surface.rowsHeading ?? 'Details'}
          </h4>
          <DetailRows rows={rows} />
        </section>
      )}

      {items.length > 0 && (
        <section className="mt-2 bg-surface py-1">
          <h4 className="px-3.5 pt-1.5 pb-1 text-[0.68rem] font-bold tracking-wide text-text-muted uppercase">
            {surface.itemsHeading ?? 'On this device'}
          </h4>
          <div className="divide-y divide-border">
            {items.map((item) => (
              <GalleryItem
                key={item.id}
                item={item}
                selected={item.id === current?.id}
                onSelect={setSelected}
              />
            ))}
          </div>
        </section>
      )}

      {surface.note && (
        <p className="px-3.5 py-3 text-[0.75rem] text-text-muted text-balance-pretty">
          {surface.note}
        </p>
      )}

      {controls.length > 0 && (
        <div className="flex flex-wrap gap-2 bg-surface px-3.5 py-3" data-testid="viewer-controls">
          {controls.map(renderControl)}
        </div>
      )}
    </Screen>
  )
}
