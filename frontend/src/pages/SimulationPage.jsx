import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpenCheck, LifeBuoy } from 'lucide-react'
import { ActionSheet } from '@/components/simulation/ActionSheet'
import { HistoryPanel } from '@/components/simulation/AssessmentSessionPanels'
import { AttemptHeader } from '@/components/simulation/AttemptHeader'
import { ConsequenceNotice } from '@/components/simulation/ConsequencePanel'
import { DemoSkip } from '@/components/simulation/DemoSkip'
import { InspectSheet } from '@/components/simulation/InspectSheet'
import { PhoneShell } from '@/components/simulation/PhoneShell'
import { SceneActionList } from '@/components/simulation/SceneActionList'
import { QueueStatus } from '@/components/simulation/QueueStatus'
import { ScenarioOutcome } from '@/components/simulation/ScenarioOutcome'
import {
  AccessibilityDialog,
  ReportIssueDialog,
  RulesDialog,
} from '@/components/simulation/SupportDialogs'
import { TimeWarning } from '@/components/simulation/TimeRemaining'
import { OnDeviceHint, TrainingPanel } from '@/components/simulation/TrainingPanel'
import { TrainingRail } from '@/components/simulation/TrainingRail'
import { TrustedDirectory } from '@/components/simulation/TrustedDirectory'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { ROUTES, resultPath } from '@/constants/routes'
import {
  CONSEQUENCE_SURFACE,
  NOTIFY_DISMISS_ID,
  NOTIFY_OPEN_ID,
  STAGE_META,
  actionsFor,
  assetsOfKind,
} from '@/constants/simulation'
import { useActivityDelivery } from '@/hooks/useActivityDelivery'
import { DEMO_SKIP_CONTROL, useAttemptController } from '@/hooks/useAttemptController'
import { useCandidate } from '@/hooks/useCandidate'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { sceneFor } from '@/simulation/sceneRegistry'
import { useSceneNavigation } from '@/simulation/useSceneNavigation'
import { PHASE } from '@/state/attemptMachine'
import { ACTIVITY, activityStateFor, alertDismissed } from '@/state/dashboardOrchestrator'

/**
 * The candidate simulation and its dashboard hub (UI-001, UI-002, UI-004).
 *
 * Every visible thing on this screen came from the attempt API. The page holds no stage
 * of its own, no score, no scenario order and no idea which action is correct - it renders
 * the run the engine says is current, submits the control the learner chose, and re-renders
 * whatever the engine committed. Local state here is presentation only: which overlay is
 * open, and which support panel the learner asked for.
 *
 * UI-004 adds one piece of timing on top of that, and nothing else: section 3's post-idle
 * delivery window decides WHEN the notification the server already issued appears on the
 * home screen. It cannot select, create, duplicate or reorder a scenario, and if it never
 * fires the server state is unchanged.
 *
 * Reload, interruption and a stale tab all recover the same way: ask the server what is
 * current. Nothing authoritative is kept in localStorage or sessionStorage - which is also
 * why the dismissed state of an alert is read back out of the run's own ledger position
 * rather than remembered in this component.
 */
export function SimulationPage() {
  useDocumentTitle()

  const navigate = useNavigate()
  const { candidate, clearSession } = useCandidate()

  const onSessionExpired = useCallback(() => {
    clearSession()
    navigate(ROUTES.LOGIN, { replace: true })
  }, [clearSession, navigate])

  const controller = useAttemptController({ onSessionExpired })
  const { state, stage, progress, scoreVisible } = controller

  // Presentation only - none of this decides anything the server owns.
  const [inspecting, setInspecting] = useState(null)
  const [directoryOpen, setDirectoryOpen] = useState(false)
  /** The local surface pushed onto the device, if the learner has not dismissed it. */
  const [surfaceClosed, setSurfaceClosed] = useState(false)
  /**
   * Which support panel is open: 'rules' | 'issue' | 'accessibility' | 'history' | null.
   *
   * Every one of them is PRESENTATION ONLY: opening or closing any of them submits
   * nothing, reads no attempt state and cannot change the stage, the score or the
   * deadline. `history` (IMMERSIVE-002) performs one read of the learner's own aggregate
   * progress.
   */
  const [support, setSupport] = useState(null)
  /**
   * IMMERSIVE-003A. The optional one-line note offered at the resolve stage of a scene
   * scenario. Presentation only, and sent with the resolving action exactly as the action
   * sheet has always sent its own.
   */
  const [rationale, setRationale] = useState('')

  const scenario = state.scenario
  const run = state.run
  /**
   * The authored scene for this scenario, or null.
   *
   * Null is the ninety-five-scenario default and is not a failure: the page falls back to
   * the platform renderer and the action sheet, which is exactly what those scenarios had
   * before this batch.
   */
  const scene = useMemo(() => sceneFor(scenario), [scenario])
  /** The device's own navigation stack. Local, unscored, and reset by a new scenario. */
  const nav = useSceneNavigation(run?.run_id ?? null)
  const busy = state.phase === PHASE.SUBMITTING
  const resolved = run?.status === 'resolved'

  /**
   * A learner has acted in this session once the engine has committed a transition for
   * them, and also when a stale resync replaced the view - a refused action is still an
   * action, so neither is an interruption.
   */
  const delivery = useActivityDelivery({
    run,
    interactedThisSession: Boolean(state.lastEvent) || state.resynced,
  })
  const activity = activityStateFor({ run, delivered: delivery.delivered })
  const dismissed = alertDismissed(run)

  const act = useCallback(
    async (action, options) => {
      // A recorded scenario takes no further intent; the engine would refuse it anyway.
      if (!action || resolved) return
      const result = await controller.submit(action, {
        rationale: options?.rationale ?? (stage === 'resolve' ? rationale : ''),
      })
      if (!result) return

      /**
       * Everything below happens only AFTER the engine accepted the action, which is what
       * keeps the device honest: the learner cannot end up standing on a page the ledger
       * has no record of them opening.
       */
      if (action.opens) {
        nav.push(action.opens)
      } else if (action.closes) {
        /**
         * A screen whose whole purpose was the decision the learner just made - a payment
         * sheet - is finished with. Walking back is local navigation and retracts nothing;
         * the engine already holds the event, and the conversation is where its
         * consequence is drawn.
         *
         * IMMERSIVE-014: `closes: 'all'` is for a sheet reached through another screen - a
         * collect request opened from a payment notification, a fee paid from a case portal.
         * Popping once would leave the learner on the screen that led there, still offering
         * the step they have just taken; the whole stack goes instead.
         */
        if (action.closes === 'all') nav.reset()
        else nav.pop()
      } else if (action.thenPage) {
        /**
         * A form the learner submitted moves to its outcome step - but only now, after the
         * engine committed the event. The device never decides that a submission happened;
         * it renders the page the scene named for the act the ledger already holds.
         */
        nav.replacePage(action.thenPage)
      } else if (result.view && result.view !== 'directory') {
        /**
         * Details with no screen of their own still open the inspection sheet. Which sheet
         * is the server's neutral `view`, sent only once the action is committed: the page
         * never knows what a control means before it is used (SECURITY-001).
         */
        setInspecting(result.view)
      }
      if (result.view === 'directory') setDirectoryOpen(true)
      // A new consequence pushes a fresh screen, so any previous dismissal is spent.
      setSurfaceClosed(false)
    },
    [controller, nav, rationale, resolved, stage],
  )

  const nextScenario = useCallback(async () => {
    setInspecting(null)
    setDirectoryOpen(false)
    setSurfaceClosed(false)
    setRationale('')
    nav.reset()
    await controller.advance()
  }, [controller, nav])

  /**
   * ENHANCEMENT-003: the Demo User's Skip. The same local reset as moving to the next
   * scenario, then the controller's skip, which loads the next scenario itself.
   */
  const skipScenario = useCallback(async () => {
    setInspecting(null)
    setDirectoryOpen(false)
    setSurfaceClosed(false)
    setRationale('')
    nav.reset()
    await controller.skip()
  }, [controller, nav])

  /**
   * Section 3's Resume control.
   *
   * It re-reads the attempt and its current run from the server rather than clearing a
   * flag and trusting what this tab still held. After an interruption the reducer is the
   * least trustworthy thing on the page, so recovery starts from the API.
   */
  const resumeAttempt = useCallback(() => {
    delivery.resume()
    controller.retry()
  }, [controller, delivery])

  const finish = useCallback(async () => {
    const payload = await controller.complete()
    const id = payload?.attempt?.attempt_id ?? state.attempt?.attempt_id
    if (payload && id) navigate(resultPath(id), { replace: true })
  }, [controller, navigate, state.attempt])

  const ordinal = run?.ordinal ?? (run ? progress.resolved + 1 : null)

  const supportPanels = (
    <>
      <RulesDialog open={support === 'rules'} onClose={() => setSupport(null)} />
      <ReportIssueDialog
        open={support === 'issue'}
        onClose={() => setSupport(null)}
        ordinal={ordinal}
        total={progress.total}
      />
      <AccessibilityDialog
        open={support === 'accessibility'}
        onClose={() => setSupport(null)}
      />

      {/* IMMERSIVE-002. Stays inside this shell - it does not navigate. */}
      <HistoryPanel open={support === 'history'} onClose={() => setSupport(null)} />
    </>
  )

  const header = (
    <AttemptHeader
      candidate={candidate}
      ordinal={ordinal}
      resolved={progress.resolved}
      total={progress.total}
      expiresAt={state.attempt?.expires_at}
      serverNow={state.attempt?.server_now}
      onExpired={controller.syncDeadline}
      /**
       * IMMERSIVE-002: history opens in this shell rather than navigating to
       * `/history`. Accessibility is unchanged.
       */
      onHistory={() => setSupport('history')}
      onAccessibility={() => setSupport('accessibility')}
    />
  )

  /* --- whole-screen states ---------------------------------------- */

  if (state.phase === PHASE.LOADING) {
    return (
      <Shell onSupport={setSupport}>
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <Spinner size={26} label="Loading your scenario" />
          <p className="text-text-muted">Getting your scenario ready...</p>
        </Card>
        {supportPanels}
      </Shell>
    )
  }

  if (state.phase === PHASE.NO_ATTEMPT) {
    return (
      <Shell onSupport={setSupport}>
        <Card className="text-center">
          <h1 className="text-xl font-bold">No assessment in progress</h1>
          <p className="mt-2 text-text-muted">
            Start one from your dashboard. This screen never starts an attempt by itself.
          </p>
          <Button className="mt-6" onClick={() => navigate(ROUTES.DASHBOARD)}>
            Back to dashboard
          </Button>
        </Card>
        {supportPanels}
      </Shell>
    )
  }

  if (state.phase === PHASE.ERROR) {
    return (
      <Shell onSupport={setSupport}>
        <Card>
          <h1 className="text-xl font-bold">The simulation could not continue</h1>
          <Alert variant="danger" className="mt-4">
            {state.error?.message}
          </Alert>
          <p className="mt-4 text-sm text-text-muted">
            Nothing you have already completed is lost. Resuming asks the server for the
            last state it committed.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={controller.retry}>Resume</Button>
            <Button variant="outline" onClick={() => navigate(ROUTES.DASHBOARD)}>
              Back to dashboard
            </Button>
          </div>
        </Card>
        {supportPanels}
      </Shell>
    )
  }

  /**
   * IMMERSIVE-001: the 90-minute limit ended this attempt.
   *
   * A screen of its own rather than the completed one, because the two need to say
   * different things - but both lead to the same saved result, because expiry finalises
   * and commits a result in one transaction. There is nothing to recover and nothing lost.
   */
  if (state.phase === PHASE.EXPIRED) {
    return (
      <Shell onSupport={setSupport}>
        <Card className="text-center">
          <h1 className="text-xl font-bold">Time is up</h1>
          <p className="mt-2 text-balance-pretty text-text-muted">
            The time allowed for this assessment has passed, so it has been closed
            and marked. Everything you completed has been saved and counts towards your
            result. Scenarios you did not reach are recorded as not completed.
          </p>
          <Button
            className="mt-6"
            onClick={() => navigate(resultPath(state.attempt?.attempt_id), { replace: true })}
          >
            View results
          </Button>
        </Card>
        {supportPanels}
      </Shell>
    )
  }

  if (state.phase === PHASE.COMPLETED) {
    return (
      <Shell onSupport={setSupport}>
        <Card className="text-center">
          <h1 className="text-xl font-bold">Attempt complete</h1>
          <p className="mt-2 text-text-muted">All ten scenarios are recorded.</p>
          <Button
            className="mt-6"
            onClick={() => navigate(resultPath(state.attempt?.attempt_id), { replace: true })}
          >
            View results
          </Button>
        </Card>
        {supportPanels}
      </Shell>
    )
  }

  /* --- the completion gateway: ten resolved, nothing left to run --- */

  if (!run) {
    return (
      <Shell header={header} onSupport={setSupport}>
        <Card className="text-center">
          <h1 className="text-xl font-bold">All scenarios resolved</h1>
          <p className="mt-2 text-text-muted">
            <span className="tabular-nums">{progress.resolved}</span> of{' '}
            <span className="tabular-nums">{progress.total}</span> complete. Your attempt is
            saved before your results are shown.
          </p>
          <Button
            className="mt-6"
            loading={state.phase === PHASE.COMPLETING}
            onClick={finish}
          >
            View results
          </Button>
        </Card>
        {supportPanels}
      </Shell>
    )
  }

  /* --- the running scenario ---------------------------------------- */

  const actions = actionsFor(stage, scenario)

  /**
   * The screen the engine's consequence calls for, if any.
   *
   * Derived, never stored: the consequence is a rendering instruction the server already
   * committed, so the device shows it until the learner navigates back. Closing it is
   * local navigation and retracts nothing.
   */
  const surfaceKind = state.consequence ? CONSEQUENCE_SURFACE[state.consequence.kind] : null
  const surfaceCandidates = surfaceKind ? assetsOfKind(scenario, surfaceKind) : []
  const surfaceAsset = surfaceClosed
    ? null
    : (surfaceCandidates.find((a) => a.asset_id === state.consequence?.target)
      ?? surfaceCandidates[0]
      ?? null)

  return (
    <Shell header={header} onSupport={setSupport}>
      <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[minmax(0,25rem)_minmax(0,22rem)] lg:items-start lg:justify-center lg:gap-9">
        <section className="min-w-0" aria-label="Simulation">
          <PhoneShell
            scenario={scenario}
            stage={stage}
            /*
             * Once the scenario is recorded its in-phone controls are finished with: `busy`
             * is what every scene already disables its scored controls on. Unscored local
             * navigation (back, scrolling) is untouched.
             */
            busy={busy || resolved}
            dismissed={dismissed}
            activity={activity}
            surfaceAsset={surfaceAsset}
            scene={scene}
            nav={nav}
            pendingAction={state.pendingAction}
            consequenceKind={state.consequence?.kind ?? null}
            onAct={act}
            onOpenItem={() => act(actions.find((action) => action.id === NOTIFY_OPEN_ID))}
            onDismiss={() => act(actions.find((action) => action.id === NOTIFY_DISMISS_ID))}
            onCloseSurface={() => setSurfaceClosed(true)}
          >
            <InspectSheet
              view={inspecting}
              scenario={scenario}
              onClose={() => setInspecting(null)}
            />
            <TrustedDirectory
              open={directoryOpen}
              scenario={scenario}
              extraEntries={scene?.directoryExtras}
              messageSender={scene?.messageSender ?? null}
              onClose={() => setDirectoryOpen(false)}
            />
          </PhoneShell>
        </section>

        <div className="min-w-0 space-y-5">
          {/* A live region: stage changes are announced without moving focus. */}
          <p className="sr-only" role="status">
            Step {STAGE_META[stage]?.step} of 6: {STAGE_META[stage]?.label}
          </p>

          <TimeWarning
            expiresAt={state.attempt?.expires_at}
            serverNow={state.attempt?.server_now}
          />

          <QueueStatus
            state={activity}
            interrupted={delivery.interrupted}
            onResume={resumeAttempt}
            busy={busy}
          />

          {(state.stale || state.resynced) && (
            <Alert variant="warning" title="This scenario moved on">
              The current state has been reloaded from the server. Choose again.
            </Alert>
          )}

          {state.error && !state.error.fatal && (
            <Alert variant="warning" title="That action was not accepted">
              {state.error.message}
            </Alert>
          )}

          {state.duplicate && (
            <Alert variant="info">
              That action had already been recorded. It was not counted twice.
            </Alert>
          )}

          <ConsequenceNotice consequence={state.consequence} />

          {resolved ? (
            <ScenarioOutcome
              resolution={state.resolution}
              ordinal={ordinal}
              total={progress.total}
              scoreVisible={scoreVisible}
              busy={state.phase === PHASE.COMPLETING || state.phase === PHASE.LOADING}
              onContinue={nextScenario}
            />
          ) : (
            <TrainingPanel
              stage={stage}
              ordinal={ordinal}
              total={progress.total}
              onDevice={Boolean(scene)}
            >
              {stage === 'notify' ? (
                <OnDeviceHint queued={activity === ACTIVITY.QUEUED} />
              ) : scene ? (
                /**
                 * IMMERSIVE-003A. The scenario is played on the phone; the panel keeps
                 * the stage, the optional note and a collapsed list of the same actions
                 * for anyone who would rather read them.
                 */
                <SceneActionList
                  scene={scene}
                  stage={stage}
                  busy={busy}
                  pendingAction={state.pendingAction}
                  onSelect={act}
                  rationale={rationale}
                  onRationaleChange={setRationale}
                />
              ) : (
                <ActionSheet
                  stage={stage}
                  actions={actions}
                  onSelect={act}
                  pendingAction={state.pendingAction}
                  busy={busy}
                  withRationale={stage === 'resolve'}
                />
              )}
            </TrainingPanel>
          )}

          {/*
            ENHANCEMENT-003. Only on the Demo User's demo attempt, as the server marked it,
            and only while the scenario is still open. Normal learners never get this
            element at all - it is not rendered, rather than hidden.
          */}
          {controller.canSkip && !resolved && (
            <DemoSkip
              key={run.run_id}
              ordinal={ordinal}
              busy={busy && state.pendingAction === DEMO_SKIP_CONTROL}
              onSkip={skipScenario}
            />
          )}
        </div>
      </div>

      {supportPanels}
    </Shell>
  )
}

/**
 * Training rail outside the simulated app, on every state of this screen, plus section 3's
 * support zone.
 *
 * Rules and Report a simulation issue live in the footer rather than the app grid so they
 * are reachable from every stage, not only from the hub - a learner who needs to say "this
 * scenario will not render" is by definition looking at the scenario.
 */
function Shell({ header, onSupport, children }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <TrainingRail />
      {header}
      <main className="flex-1 py-6 sm:py-8">
        <div className="mx-auto w-full max-w-5xl px-4">{children}</div>
      </main>
      <footer className="border-t border-border py-4">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4">
          <p className="min-w-0 flex-1 basis-64 text-sm text-text-muted">
            Everything here is synthetic training content. For authorised training use
            only.
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <FooterAction icon={BookOpenCheck} onClick={() => onSupport('rules')}>
              Rules
            </FooterAction>
            <FooterAction icon={LifeBuoy} onClick={() => onSupport('issue')}>
              Report a simulation issue
            </FooterAction>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FooterAction({ icon: Icon, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-1 text-sm font-semibold text-primary hover:underline"
    >
      <Icon size={15} aria-hidden="true" />
      {children}
    </button>
  )
}
