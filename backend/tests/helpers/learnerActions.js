import { ScenarioRun } from '../../src/models/ScenarioRun.js'
import { actionCodeFor, controlsForScenario } from '../../src/services/learnerActionService.js'

/**
 * SECURITY-001 test helper: the action code a real client would send for `intent`.
 *
 * A client never names an intent; it sends the code `/current-run` issued for a control.
 * The HTTP suites still describe their walks in intents, so this finds the control that
 * submits `intent` on the run's scenario - at the run's current stage when there is one,
 * otherwise at any stage, so a suite can still send a legal code at the wrong moment - and
 * returns that run's code for it. The server is in-process, so the key is the same one.
 */
export async function codeFor(runId, intent) {
  const run = await ScenarioRun.findById(runId).lean()
  if (!run) throw new Error(`codeFor: no run ${runId}`)
  const controls = [...controlsForScenario(run.scenario_id).values()]
  const control = controls.find((c) => c.intent === intent && c.stage === run.current_stage)
    ?? controls.find((c) => c.intent === intent)
  if (!control) throw new Error(`codeFor: no control submits ${intent} on ${run.scenario_id}`)
  return actionCodeFor({
    runId: run._id,
    scenarioId: run.scenario_id,
    version: run.definition_version,
    controlId: control.controlId,
  })
}
