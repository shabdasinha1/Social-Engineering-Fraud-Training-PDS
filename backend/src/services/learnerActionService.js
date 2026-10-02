import { createHmac, timingSafeEqual } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from '../config/env.js'
import { STAGE_KEYS } from '../constants/scenarioDefinition.js'
import { STAGE_INTENTS } from '../constants/scenarioEngine.js'
import {
  ACTION_CODE_HEX_LENGTH,
  ACTION_CODE_PATTERN,
  ACTION_CODE_VERSION,
  GENERIC_CONTROL_ID_PATTERN,
  SCENE_CONTROL_ID_PATTERN,
  VERIFY_SOURCE_BY_INTENT,
  VIEW_BY_INTENT,
} from '../constants/learnerAction.js'
import { ApiError } from '../utils/ApiError.js'

/**
 * The neutral learner action translation layer (SECURITY-001).
 *
 * The engine still speaks in canonical intents and is unchanged. What changed is who may
 * know them: only this server. A client holds neutral control ids (`w01-c07`, `gen-c17`)
 * and, per run, an opaque action code for each. It sends the code; this module turns the
 * code back into `{ stage, intent }` for that run and nothing else.
 *
 * Codes are an HMAC over (run, scenario, version, control), so they are:
 *
 * - deterministic: a reload, a stale resync or a second tab receives the same codes, and
 *   an idempotent retry resends the same one - no state is stored and nothing is random;
 * - bound to one run: a code copied from another run, another attempt or another learner
 *   matches nothing here, and neither does one from another scenario;
 * - meaningless: no part of a code encodes a stage, an intent, a position or a verdict, and
 *   the same control has a different code on every run, so nothing learned about one run
 *   carries to the next.
 *
 * The stage a control belongs to is enforced by the engine itself: the controller passes it
 * as the expected stage, so the existing stale-state check - after the existing duplicate
 * replay - refuses a code for any other stage inside the engine's own transaction.
 */

const MAP_DIR = path.resolve(fileURLToPath(new URL('../../data/learner-actions/v1', import.meta.url)))

const readMap = (name) => JSON.parse(readFileSync(path.join(MAP_DIR, `${name}.json`), 'utf8'))

/** Rejects a map entry the engine could never accept. Runs once, at load. */
function checkEntry(where, controlId, entry) {
  if (!entry || typeof entry !== 'object') throw new Error(`${where}: ${controlId} has no entry`)
  const { stage, intent } = entry
  if (!STAGE_KEYS.includes(stage)) throw new Error(`${where}: ${controlId} has unknown stage "${stage}"`)
  if (!STAGE_INTENTS[stage]?.[intent] || intent === 'abandon') {
    throw new Error(`${where}: ${controlId} maps to "${intent}", which is not a learner intent at ${stage}`)
  }
  return Object.freeze({ controlId, stage, intent })
}

/**
 * Loads and validates the maps. Exported for the guard tests; the module uses the result
 * computed once at import, so a malformed map stops the server from starting.
 */
export function loadActionMaps({ read = readMap } = {}) {
  const generic = new Map()
  for (const [controlId, entry] of Object.entries(read('generic').controls ?? {})) {
    if (!GENERIC_CONTROL_ID_PATTERN.test(controlId)) {
      throw new Error(`generic: control id "${controlId}" is not neutral`)
    }
    generic.set(controlId, checkEntry('generic', controlId, entry))
  }

  const scenes = new Map()
  for (const platform of ['whatsapp', 'instagram', 'email', 'sms']) {
    for (const [scenarioId, controls] of Object.entries(read(platform).scenes ?? {})) {
      if (scenes.has(scenarioId)) throw new Error(`${scenarioId} is mapped twice`)
      const entries = new Map()
      for (const [controlId, entry] of Object.entries(controls)) {
        if (!SCENE_CONTROL_ID_PATTERN.test(controlId)
          || !controlId.startsWith(`${scenarioId.toLowerCase()}-`)) {
          throw new Error(`${scenarioId}: control id "${controlId}" is not neutral`)
        }
        entries.set(controlId, checkEntry(scenarioId, controlId, entry))
      }
      scenes.set(scenarioId, entries)
    }
  }
  return { generic, scenes }
}

const MAPS = loadActionMaps()

/** Every control a run of this scenario may use: the generic sheet plus its own scene. */
export function controlsForScenario(scenarioId) {
  return new Map([...MAPS.generic, ...(MAPS.scenes.get(scenarioId) ?? new Map())])
}

/** Scenario ids with an authored scene map. */
export const MAPPED_SCENARIO_IDS = Object.freeze([...MAPS.scenes.keys()])

let derivedKey = null
function codeKey() {
  if (!derivedKey) {
    derivedKey = createHmac('sha256', env.learnerActionSecret ?? env.sessionSecret)
      .update('SECURITY-001/learner-action-code')
      .digest()
  }
  return derivedKey
}

/** The action code for one control on one run. Pure given the server key. */
export function actionCodeFor({ runId, scenarioId, version, controlId }) {
  const digest = createHmac('sha256', codeKey())
    .update(`v${ACTION_CODE_VERSION}|${String(runId)}|${scenarioId}|${version}|${controlId}`)
    .digest('hex')
  return `ac_${digest.slice(0, ACTION_CODE_HEX_LENGTH)}`
}

const runIdentity = (run) => ({
  runId: String(run._id ?? run.run_id),
  scenarioId: run.scenario_id,
  version: run.definition_version ?? run.version,
})

/**
 * `{ neutral control id: action code }` for every control this run may use. Sent with
 * `/current-run`. Keys are neutral ids the client bundle already holds; values are opaque.
 */
export function actionCodesForRun(run) {
  const identity = runIdentity(run)
  const codes = {}
  for (const controlId of controlsForScenario(identity.scenarioId).keys()) {
    codes[controlId] = actionCodeFor({ ...identity, controlId })
  }
  return codes
}

/** One neutral refusal for every way a code can be wrong, so a refusal reveals nothing. */
const invalidAction = () =>
  ApiError.unprocessable('INVALID_ACTION', 'That action is not available here.')

/**
 * Translates an action code for this run into the canonical intent the engine expects.
 *
 * Malformed, unknown, issued for another run or for another scenario: all the same 422.
 * The stage is returned for the caller to enforce through the engine.
 */
export function translateActionCode({ run, actionCode }) {
  if (typeof actionCode !== 'string' || !ACTION_CODE_PATTERN.test(actionCode)) {
    throw invalidAction()
  }
  const identity = runIdentity(run)
  const presented = Buffer.from(actionCode)
  for (const entry of controlsForScenario(identity.scenarioId).values()) {
    const expected = Buffer.from(actionCodeFor({ ...identity, controlId: entry.controlId }))
    if (expected.length === presented.length && timingSafeEqual(expected, presented)) {
      return {
        stage: entry.stage,
        intent: entry.intent,
        verifySource: VERIFY_SOURCE_BY_INTENT[entry.intent] ?? null,
        view: VIEW_BY_INTENT[entry.intent] ?? null,
      }
    }
  }
  throw invalidAction()
}
