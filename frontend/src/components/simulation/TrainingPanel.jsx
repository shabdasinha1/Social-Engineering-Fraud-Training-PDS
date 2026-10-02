import { Smartphone } from 'lucide-react'
import { DEVICE_INSTRUCTION, STAGE_KEYS, STAGE_META } from '@/constants/simulation'
import { cn } from '@/utils/cn'

/**
 * The learner's decision surface, beside the device (UI-002).
 *
 * It frames the task without answering it. The header states where the learner is in the
 * six stages and what is being asked; the body holds whatever the stage offers. Nothing
 * here names the disposition, the difficulty, the family, the trigger or the expected
 * action - the communication on the phone is what carries the cognitive load.
 *
 * The stage strip is a read-only reflection of engine state. It never advances anything:
 * only a committed response moves it.
 */
function StageStrip({ stage }) {
  const currentIndex = STAGE_KEYS.indexOf(stage)

  return (
    <div className="mt-4">
      <ol className="flex items-end gap-1">
        {STAGE_KEYS.map((key, index) => {
          const done = index < currentIndex
          const current = index === currentIndex

          return (
            <li key={key} className="min-w-0 flex-1">
              <span
                aria-hidden="true"
                className={cn(
                  'block rounded-full',
                  current ? 'h-1.5 bg-primary' : 'h-1',
                  done && 'bg-primary/45',
                  !done && !current && 'bg-border-strong',
                )}
              />
              <span
                aria-hidden="true"
                className={cn(
                  'mt-1.5 block truncate text-center text-[0.6rem] tracking-wide uppercase',
                  current ? 'font-bold text-primary' : 'font-medium text-text-muted',
                )}
              >
                {STAGE_META[key]?.short ?? STAGE_META[key]?.label}
              </span>
            </li>
          )
        })}
      </ol>

      {/* The strip is decorative; this is what a screen reader is told. */}
      <p className="sr-only">
        Stage {currentIndex + 1} of {STAGE_KEYS.length}: {STAGE_META[stage]?.label}.
      </p>
    </div>
  )
}

export function TrainingPanel({ stage, ordinal, total, onDevice = false, children }) {
  const meta = STAGE_META[stage]
  /**
   * IMMERSIVE-003A: on a scenario whose controls live on the phone, the heading must not
   * describe a list of options that is not there. Both wordings are procedural.
   */
  const instruction = (onDevice && DEVICE_INSTRUCTION[stage]) || meta?.instruction

  return (
    <section
      aria-labelledby="training-panel-heading"
      className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <p className="text-[0.68rem] font-bold tracking-[0.08em] text-text-muted uppercase">
        Scenario <span className="tabular-nums">{ordinal}</span> of{' '}
        <span className="tabular-nums">{total}</span>
        <span className="mx-1.5">&middot;</span>
        Step <span className="tabular-nums">{meta?.step}</span> of 6
      </p>

      <h2 id="training-panel-heading" className="mt-1 text-lg font-bold sm:text-xl">
        {meta?.label}
      </h2>
      {instruction && (
        <p className="mt-1 text-balance-pretty text-text-muted">{instruction}</p>
      )}

      <StageStrip stage={stage} />

      <div className="mt-6">{children}</div>
    </section>
  )
}

/**
 * What the panel says while the controls are on the device itself.
 *
 * At the notify stage the only two actions are the notification's own Open and Dismiss,
 * so duplicating them here would give the learner two of everything. This points at the
 * phone instead.
 *
 * While section 3's delivery window is still running there is nothing on the phone to
 * point at yet, so the hint says what the learner should do - wait and watch - rather
 * than describing controls that have not appeared.
 */
export function OnDeviceHint({ queued = false }) {
  return (
    <p className="flex items-start gap-2.5 rounded-md border border-dashed border-border-strong p-3.5 text-sm text-text-muted">
      <Smartphone size={17} aria-hidden="true" className="mt-0.5 shrink-0" />
      {queued
        ? 'Watch the phone. The next item will appear on the home screen in a moment.'
        : 'Use the phone to open or dismiss the notification. Your options will appear here once you are in the app.'}
    </p>
  )
}
