import { ChevronLeft } from 'lucide-react'
import { EmailRenderer } from '@/components/assessment/channels/EmailRenderer'
import { GenericRenderer } from '@/components/assessment/channels/GenericRenderer'
import { InstagramRenderer } from '@/components/assessment/channels/InstagramRenderer'
import { SmsRenderer } from '@/components/assessment/channels/SmsRenderer'
import { WhatsAppRenderer } from '@/components/assessment/channels/WhatsAppRenderer'
import { DeviceFrame } from '@/components/simulation/DeviceFrame'
import { LocalSurface } from '@/components/simulation/LocalSurfaces'
import { PhoneHome } from '@/components/simulation/PhoneHome'
import { SceneSurface } from '@/components/simulation/SceneSurfaces'
import { EmailScene } from '@/components/simulation/email/EmailScene'
import { InstagramScene } from '@/components/simulation/instagram/InstagramScene'
import { SmsScene } from '@/components/simulation/sms/SmsScene'
import { WhatsAppScene } from '@/components/simulation/whatsapp/WhatsAppScene'
import {
  SLOT, affordancesFor, headlineClockTime, notifiedClockTime, surfaceById,
} from '@/simulation/sceneModel'
import { ASSET_KIND, assetsOfKind } from '@/constants/simulation'
import { ACTIVITY, tilesFor, trayFor } from '@/state/dashboardOrchestrator'
import { inboxScreen, threadScreen } from '@/utils/syntheticScreen'

/**
 * The simulated device and everything drawn on it (UI-002, extended by IMMERSIVE-003A).
 *
 * `PhoneShell` owns the device's LOCAL navigation only - which screen is on top of the
 * stack. It never advances the attempt: the engine's stage decides the base screen, and
 * anything the learner does that counts is an intent submitted through the controller.
 *
 *   stage 'notify'          -> home screen with the notification banner
 *   a scenario with a scene -> the authored app (IMMERSIVE-003A: W01-W05)
 *   any other scenario      -> the platform renderer, showing the thread
 *   a pushed surface        -> contact / group / browser / call / settings / another app /
 *                              a payment sheet, on top
 *   a committed consequence -> browser / file / QR / call / payment / install, on top
 *
 * The two surface paths coexist on purpose. A scenario with an authored scene draws its
 * own screens from the scene; the ninety-five without one keep the consequence-asset path
 * exactly as it was, so this batch cannot regress a scenario it did not author.
 */

const RENDERERS = {
  whatsapp: WhatsAppRenderer,
  instagram: InstagramRenderer,
  sms: SmsRenderer,
  email: EmailRenderer,
}

const SCENE_APPS = {
  whatsapp: WhatsAppScene,
  instagram: InstagramScene,
  /** IMMERSIVE-005: Email scenes with an authored pack; the rest keep `EmailRenderer`. */
  email: EmailScene,
  /** IMMERSIVE-010: SMS scenes with an authored pack; the rest keep `SmsRenderer`. */
  sms: SmsScene,
}

const PLATFORM_LABELS = {
  whatsapp: 'WhatsApp simulation',
  instagram: 'Instagram simulation',
  sms: 'SMS simulation',
  email: 'Email simulation',
}

const SURFACE_TITLES = {
  browser_page: 'Browser',
  file: 'Files',
  qr_payload: 'QR scanner',
  call_screen: 'Call',
  payment_screen: 'Payments',
  install_screen: 'App install',
}

const noop = () => {}

/**
 * A pushed screen: an inert local surface with the device's own back affordance.
 *
 * Back is pure local navigation. It submits nothing and cannot undo what the engine has
 * already recorded - the learner is returning to the conversation, not retracting an act.
 */
function SurfaceScreen({ asset, onBack }) {
  return (
    <div
      className="animate-screen-in flex h-full min-h-0 flex-col bg-background"
      data-testid="phone-surface"
    >
      <div className="flex shrink-0 items-center gap-1 border-b border-border bg-surface px-2 py-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to the conversation"
          className="flex min-h-11 items-center gap-0.5 rounded-full pr-3 pl-1 text-sm font-semibold text-primary hover:bg-primary-soft"
        >
          <ChevronLeft size={20} aria-hidden="true" />
          Back
        </button>
        <p className="truncate text-sm font-bold">{SURFACE_TITLES[asset.kind] ?? 'Preview'}</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
        <LocalSurface asset={asset} />
      </div>
    </div>
  )
}

export function PhoneShell({
  scenario,
  stage,
  busy,
  dismissed,
  /**
   * The orchestrator's view of this run (UI-004). Left out, the device assumes the
   * notification has already been delivered, which is the right default for a shell
   * rendered on its own: the delivery window belongs to the page that owns the timer.
   */
  activity,
  surfaceAsset = null,
  /** IMMERSIVE-003A: the authored scene for this scenario, or null for the other 95. */
  scene = null,
  /** The device navigation stack from `useSceneNavigation`. Required with `scene`. */
  nav = null,
  pendingAction = null,
  consequenceKind = null,
  onAct = noop,
  onOpenItem,
  onDismiss,
  onCloseSurface,
  children,
}) {
  const platform = scenario?.platform
  const Renderer = RENDERERS[platform] ?? GenericRenderer
  const SceneApp = SCENE_APPS[platform] ?? null
  const label = PLATFORM_LABELS[platform] ?? 'Message simulation'

  // Stage decides the base screen; the engine owns the stage, so the device follows it.
  const onHome = stage === 'notify'
  const screen = onHome ? inboxScreen(scenario) : threadScreen(scenario)

  const state = activity ?? (onHome ? ACTIVITY.DELIVERED : ACTIVITY.ENGAGED)
  const sceneActive = Boolean(scene && SceneApp && nav && !onHome)

  const pushed = sceneActive ? surfaceById(scene, nav.top) : null
  /**
   * The scored controls that belong to the screen the learner is standing on.
   *
   * `on` scopes a control to a surface and `page` scopes it further to one step of that
   * surface, which is what puts a payment form's commit control on the review step rather
   * than on the step where the card number is still being typed.
   */
  const currentPage = pushed?.pages ? (nav.page ?? pushed.home) : null
  const surfaceControls = sceneActive && nav.top
    ? affordancesFor(scene, stage).filter((item) => (
      item.slot === SLOT.SURFACE
        && item.on === nav.top
        && (!item.page || item.page === currentPage)
    ))
    : []

  /**
   * Is this screen still fillable?
   *
   * The engine takes exactly one intent per stage, so a learner who spent their branch
   * decision opening the link can no longer submit what the page asks for. Leaving live
   * fields on a page whose commit control has gone would be a dead end - something to fill
   * in with nothing to press - so the page states what it asks for instead. The device is
   * not deciding anything here: it is reading whether the scene still offers a control for
   * this screen at the stage the server committed.
   */
  const surfaceInteractive = sceneActive && nav.top
    ? affordancesFor(scene, stage).some(
      (item) => item.slot === SLOT.SURFACE && item.on === nav.top,
    )
    : false

  /**
   * A link inside a surface: another page of the same browser, or another screen.
   *
   * Both are local navigation and neither submits anything - moving between two pages of
   * a fake tracking site is not a second decision, and the engine already holds the one
   * that opened it.
   */
  const navigateWithin = (target) => {
    if (pushed?.pages && target in pushed.pages) {
      nav.goToPage(target)
      return
    }
    nav.push(target)
  }

  /**
   * Back inside a pushed screen.
   *
   * Walks the page history first and only leaves the surface when there is nothing left to
   * walk back to - which is what a browser's Back button does, and what made the previous
   * "back always goes home" behaviour read as a mock rather than a browser. Neither step
   * submits anything.
   */
  const finalPage = Boolean(pushed?.pages?.[currentPage]?.final)
  const backWithin = () => {
    /**
     * A page marked `final` is the end of a flow the engine has already recorded - a
     * receipt, a submission acknowledgement. Back leaves the site rather than walking
     * into the form that produced it, because that form is finished with and re-opening
     * it empty would suggest the act could be repeated. It cannot: the ledger holds it.
     */
    if (nav.pageDepth > 0 && !finalPage) {
      nav.goBackPage()
      return
    }
    nav.pop()
  }

  /**
   * The scenario's synthetic "now" for the status bar: the same time the toast announces -
   * the app's list time, else the notified message's time, else the notification's own
   * `received_at`. Computed once per scenario, so the clock does not move as screens change.
   */
  const notice = assetsOfKind(scenario, ASSET_KIND.NOTIFICATION)[0]?.content
  const scenarioClock = headlineClockTime(scene)
    ?? notifiedClockTime(scene, notice?.body)
    ?? (/^\d{1,2}:\d{2}$/.test(notice?.received_at ?? '') ? notice.received_at : null)

  return (
    <DeviceFrame label={label} clock={scenarioClock}>
      {onHome ? (
        <PhoneHome
          tiles={tilesFor({ scenario, state })}
          tray={trayFor({ scenario, state, dismissed }).map((item) => {
            /**
             * Release audit: the toast shows the time the app lists the same item at, so a
             * message does not announce itself at 14:38 and sit in the chat list at 11:01.
             * Where the app lists it relatively (Instagram's "4m"), the toast takes the time
             * the thread draws that message at instead (online UI pass, 28 Sep 2026).
             */
            const sceneTime = headlineClockTime(scene) ?? notifiedClockTime(scene, item.body)
            return {
              ...item,
              /**
               * IMMERSIVE-004A. A scene may name the account its notification comes from, where
               * the bank's generated sender is a placeholder that contradicts the client's own
               * sentence (Instagram's `@unknownsender274` beside "@mega_rewards_help: ...").
               * Presentation only: the body and the open/dismiss intents are unchanged.
               */
              ...(scene?.notify?.sender ? { sender: scene.notify.sender } : {}),
              ...(sceneTime ? { receivedAt: sceneTime } : {}),
            }
          })}
          busy={busy}
          dismissed={dismissed}
          onOpen={onOpenItem}
          onDismiss={onDismiss}
        />
      ) : sceneActive ? (
        <SceneApp
          scene={scene}
          stage={stage}
          busy={busy}
          pendingAction={pendingAction}
          consequenceKind={consequenceKind}
          onAct={onAct}
          onNavigate={nav.push}
        />
      ) : (
        <div className="animate-screen-in flex h-full min-h-0 flex-col" data-testid="phone-app">
          {screen ? (
            <Renderer
              key={screen.id}
              screen={screen}
              actions={[]}
              backAction={null}
              onAction={noop}
              onOpen={noop}
            />
          ) : (
            <p className="grid h-full place-items-center p-6 text-center text-sm text-text-muted">
              This scenario has no content to show.
            </p>
          )}
        </div>
      )}

      {/* A scene surface the learner walked into: contact, group, browser, call, settings. */}
      {pushed && (
        <div className="absolute inset-0 z-30">
          <SceneSurface
            surface={pushed}
            page={nav.page}
            nested={nav.pageDepth > 0 && !finalPage}
            interactive={surfaceInteractive}
            onBack={backWithin}
            onNavigate={navigateWithin}
            controls={surfaceControls}
            busy={busy}
            pendingAction={pendingAction}
            onSelect={onAct}
          />
        </div>
      )}

      {/* The consequence-asset surface, for scenarios without an authored scene. */}
      {!sceneActive && surfaceAsset && (
        <div className="absolute inset-0 z-30">
          <SurfaceScreen asset={surfaceAsset} onBack={onCloseSurface} />
        </div>
      )}

      {/* Sheets - sender details, trusted directory - render inside the device. */}
      {children}
    </DeviceFrame>
  )
}
