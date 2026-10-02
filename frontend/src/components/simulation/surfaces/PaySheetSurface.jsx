import { BadgeIndianRupee } from 'lucide-react'
import { DetailRows, InertNote, Screen } from '@/components/simulation/surfaces/SurfaceFrame'
import { SceneFieldList, SceneFieldset } from '@/components/simulation/surfaces/SceneForm'
import { formComplete, useLocalForm } from '@/simulation/localForm'
import { cn } from '@/utils/cn'

/**
 * The payment sheet a collect request opens (IMMERSIVE-003A-R2).
 *
 * A payment card in a chat with a button that immediately charges money is not what
 * approving a request feels like. What it feels like is a sheet that slides up, shows who
 * is being paid and how much, asks for a PIN, and only then lets you commit - and the
 * gap between reading the payee and entering the PIN is exactly where a learner either
 * notices that the name is wrong or does not.
 *
 * So opening this sheet is LOCAL navigation and records nothing. The scored control lives
 * on the sheet, appears once the PIN is the right length, and is the only thing here that
 * reaches the engine. The PIN itself lives in `useLocalForm` inside this component and is
 * discarded when the sheet is left; nothing reads it, including the control that commits.
 */
export function PaySheetSurface({ surface, interactive = true, onBack, controls, renderControl }) {
  const form = useLocalForm()
  const complete = interactive && formComplete(surface.form?.fields ?? [], form.values)

  return (
    <Screen
      title={surface.title}
      subtitle={surface.app}
      onBack={onBack}
      backLabel="Cancel and go back"
      tone="light"
      footer={<InertNote>Simulated payment sheet. No money can move.</InertNote>}
    >
      <div className="border-b border-border bg-surface px-4 py-5 text-center">
        <span
          aria-hidden="true"
          className="mx-auto grid size-12 place-items-center rounded-full bg-secondary-soft text-secondary"
        >
          <BadgeIndianRupee size={22} />
        </span>
        <p className="mt-2 text-2xl font-bold tabular-nums">{surface.amount}</p>
        <p className="mt-0.5 text-[0.8rem] text-text-muted">{surface.subtitle}</p>
      </div>

      <section className="mt-2 bg-surface py-1">
        <h4 className="px-3.5 pt-1.5 pb-1 text-[0.68rem] font-bold tracking-wide text-text-muted uppercase">
          Payment details
        </h4>
        <DetailRows rows={surface.rows ?? []} />
      </section>

      <div className="px-3.5">
        {surface.form && (interactive
          ? <SceneFieldset block={surface.form} form={form} startIndex={0} />
          : <SceneFieldList block={surface.form} />)}

        {surface.note && (
          <p className="mt-3 text-[0.72rem] text-text-muted text-balance-pretty">{surface.note}</p>
        )}

        {/*
          The commit control. It appears whatever the learner has typed, and is disabled
          only while the PIN is short - never by risk. `SceneControl` draws it, so it
          cannot acquire a style of its own here either.
        */}
        <div
          className={cn('mt-4 flex flex-wrap gap-2 pb-4', !complete && 'pointer-events-none opacity-45')}
          aria-hidden={!complete}
          data-testid="paysheet-commit"
        >
          {complete
            ? controls.map(renderControl)
            : (
              <p className="text-[0.78rem] text-text-muted">
                Enter your {surface.form?.fields?.[0]?.length ?? 6}-digit PIN to continue.
              </p>
            )}
        </div>
      </div>
    </Screen>
  )
}
