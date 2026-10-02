import { controlsForScenario } from '../../src/services/learnerActionService.js'

/**
 * DEVELOPMENT ONLY (SECURITY-001). The dev scripts describe their walks in intents, but the
 * API accepts only the opaque action codes `/current-run` issues. This picks the control
 * that submits `intent` at `stage` - the scene's own control first, then the generic
 * sheet's - and returns the code the server issued for it, or null when none does.
 *
 * Server-side tooling may read the action map; a learner's browser never can.
 */
export function codeFromActions(actions, scenarioId, stage, intent) {
  const controls = [...controlsForScenario(scenarioId).values()]
    .filter((c) => c.stage === stage && c.intent === intent)
  const pick = controls.find((c) => !c.controlId.startsWith('gen-')) ?? controls[0]
  return pick ? (actions?.[pick.controlId] ?? null) : null
}
