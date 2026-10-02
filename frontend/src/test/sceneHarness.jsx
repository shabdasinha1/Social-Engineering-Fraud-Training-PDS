import { PhoneShell } from '@/components/simulation/PhoneShell'
import { sceneFor } from '@/simulation/sceneRegistry'
import { useSceneNavigation } from '@/simulation/useSceneNavigation'
import { withServerMeaning } from '@/test/actionMap'
import { payload } from '@/test/sceneFixtures'

/**
 * The device, wired exactly the way `SimulationPage` wires it.
 *
 * Shared by the scene component suites so that all of them are testing the real phone
 * against the real pinned bank content, and so that the one thing that matters most -
 * *when* a surface is pushed - cannot drift between a test harness and the page. The
 * rule is the page's rule: nothing moves until the intent has been accepted.
 *
 * SECURITY-001: a scene control carries no intent. `onAct` receives the control with the
 * SERVER's meaning attached (`intent`, `source`, authoring `name`), so the suites can
 * still say what a tap submits, and the raw control exactly as the device holds it as the
 * second argument - which is what the neutrality assertions inspect.
 */

export function Device({ scenarioId, stage, onAct = () => {}, consequenceKind = null }) {
  const nav = useSceneNavigation('run-1')
  const scenario = payload(scenarioId)
  const scene = sceneFor(scenario)

  /** The same post-acceptance navigation `SimulationPage.act` performs, in the same order. */
  const act = (affordance) => {
    onAct(withServerMeaning(scenarioId, affordance), affordance)
    if (affordance.opens) nav.push(affordance.opens)
    else if (affordance.closes) nav.pop()
    else if (affordance.thenPage) nav.replacePage(affordance.thenPage)
  }

  return (
    <PhoneShell
      scenario={scenario}
      stage={stage}
      scene={scene}
      nav={nav}
      consequenceKind={consequenceKind}
      onAct={act}
    />
  )
}
