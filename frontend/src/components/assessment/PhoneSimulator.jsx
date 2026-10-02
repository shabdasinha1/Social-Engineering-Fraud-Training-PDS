import { useMemo, useState } from 'react'
import { EmailRenderer } from '@/components/assessment/channels/EmailRenderer'
import { GenericRenderer } from '@/components/assessment/channels/GenericRenderer'
import { InstagramRenderer } from '@/components/assessment/channels/InstagramRenderer'
import { SmsRenderer } from '@/components/assessment/channels/SmsRenderer'
import { WhatsAppRenderer } from '@/components/assessment/channels/WhatsAppRenderer'

/**
 * Owns simulation navigation and picks the renderer for the channel. The
 * renderers below are presentation only - they all receive the same `screen`
 * shape the backend defines. Every channel has one; GenericRenderer is now
 * only a safety net for content with an unrecognised channel.
 *
 * Navigation is local state over the scenario's own screen graph. It never
 * touches the browser URL, never opens a link and never makes a request.
 */

const RENDERERS = {
  whatsapp: WhatsAppRenderer,
  instagram: InstagramRenderer,
  sms: SmsRenderer,
  email: EmailRenderer,
}

export function PhoneSimulator({ channel, simulation, onInteraction }) {
  const screens = useMemo(
    () => new Map((simulation?.screens ?? []).map((screen) => [screen.id, screen])),
    [simulation],
  )

  const entryId = screens.has(simulation?.entryScreenId)
    ? simulation.entryScreenId
    : (simulation?.screens?.[0]?.id ?? null)

  // The parent remounts this per question (key), so the entry screen is simply
  // the initial state - no reset effect needed.
  const [screenId, setScreenId] = useState(entryId)

  const screen = screens.get(screenId) ?? screens.get(entryId)

  if (!screen) {
    return (
      <div className="grid h-full place-items-center p-6 text-center">
        <p className="text-sm text-text-muted">This scenario has no content to show.</p>
      </div>
    )
  }

  /** Records the tap, then moves only if the target is a real screen. */
  const go = (target, report) => {
    onInteraction?.(report)
    if (target && screens.has(target)) setScreenId(target)
  }

  const handleAction = (action) =>
    go(action.target, {
      screenId: screen.id,
      actionId: action.id,
      interaction: action.interaction ?? null,
    })

  /** Tapping a list row - reported as the matching action where one exists. */
  const handleOpen = (target) => {
    const matching = (screen.actions ?? []).find(
      (action) => action.target === target && !action.interaction,
    )
    go(target, {
      screenId: screen.id,
      actionId: matching?.id ?? `open:${target}`,
      interaction: null,
    })
  }

  const allActions = screen.actions ?? []
  const backAction = screen.header?.showBack
    ? (allActions.find((action) => action.id === 'back') ??
      allActions.find((action) => !action.interaction && screens.has(action.target)))
    : null

  // A plain navigation action that just repeats a tappable row would be noise.
  const rowTargets = new Set(
    (screen.blocks ?? [])
      .filter((block) => block.type === 'listItem' && block.target)
      .map((block) => block.target),
  )
  const actions = allActions.filter(
    (action) =>
      action.id !== backAction?.id && !(!action.interaction && rowTargets.has(action.target)),
  )

  const Renderer = RENDERERS[channel] ?? GenericRenderer

  return (
    <Renderer
      screen={screen}
      actions={actions}
      backAction={backAction}
      onAction={handleAction}
      onOpen={handleOpen}
    />
  )
}
