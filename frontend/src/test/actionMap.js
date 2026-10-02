import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * TEST-ONLY access to the server's learner action map (SECURITY-001).
 *
 * The product never lets the browser know what a control submits: the map lives in
 * `backend/data/learner-actions/v1` and only the server reads it. The suites still need to
 * reason about intents - "the safe branch is on the payment sheet", "this route releases
 * data" - so they read the same files here. Nothing under `src/` outside `src/test/` and
 * `*.test.*` may import this module; `sceneModel.test.js` checks that.
 */

const read = (name) => JSON.parse(readFileSync(
  resolve(process.cwd(), `../backend/data/learner-actions/v1/${name}.json`), 'utf8',
))

/** `{ gen-cNN: { stage, intent, name } }` - the generic action sheet. */
export const GENERIC_ACTIONS = read('generic').controls

/** `{ W01: { w01-cNN: { stage, intent, name } }, ... }` - every authored scene. */
export const SCENE_ACTIONS = {
  ...read('whatsapp').scenes, ...read('instagram').scenes, ...read('email').scenes,
  ...read('sms').scenes,
}

/** The server derives this from the intent (backend/src/constants/learnerAction.js). */
const VERIFY_SOURCE_BY_INTENT = {
  verify_trusted_directory: 'trusted_directory',
  verify_known_app: 'known_app',
  verify_known_number: 'known_number',
  verify_in_message_contact: 'in_message_contact',
}

/** Which inert panel the server tells the page to open (VIEW_BY_INTENT on the server). */
export const VIEW_BY_INTENT = {
  inspect_sender: 'sender',
  inspect_profile: 'profile',
  inspect_link: 'link',
  preview_file: 'file',
  inspect_qr: 'qr',
  verify_trusted_directory: 'directory',
}

/** Every canonical learner intent, from the engine itself. */
export const CANONICAL_INTENTS = [...new Set(
  [...Object.values(GENERIC_ACTIONS), ...Object.values(SCENE_ACTIONS).flatMap(Object.values)]
    .map((entry) => entry.intent),
)]

/** Canonical vocabulary no learner-visible state may carry (SECURITY-001). */
export const FORBIDDEN_TOKENS = [
  'open_item', 'inspect_sender', 'inspect_profile', 'inspect_link', 'preview_file',
  'inspect_qr', 'read_thread', 'skip_inspection', 'safe_pivot', 'reject_ignore', 'open_link',
  'open_file', 'scan_qr', 'call_number', 'submit_data', 'attempt_payment', 'attempt_install',
  'approve_device_link', 'share_secret', 'share_location', 'verify_trusted_directory',
  'verify_known_app', 'verify_known_number', 'verify_in_message_contact', 'resolve_report',
  'resolve_block', 'resolve_continue', 'resolve_retain', 'resolve_ignore',
  'in_message_contact', 'known_app', 'known_number',
  'SAFE_PIVOT', 'CORRECT_USE', 'TRUSTED_VERIFY', 'RESOLVE_CORRECT', 'VERIFY_THROUGH_MESSAGE',
  'NEEDLESS_REJECT_IGNORE', 'RISKY_OPEN_REPLY', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE',
  'FALSE_REPORT_BLOCK', 'REPORT_ONLY_WITHOUT_CHECK', 'CONTRADICTORY_UNSAFE_FINAL',
  'PREMATURE_REPLY', 'INSPECT_CONTEXT', 'UNSAFE_EXTERNAL_ACTION', 'branch-pivot',
]

/** The server's entry for a control on a scenario, or null. */
export function entryFor(scenarioId, controlId) {
  return SCENE_ACTIONS[scenarioId]?.[controlId] ?? GENERIC_ACTIONS[controlId] ?? null
}

/**
 * A control with what the SERVER knows about it attached: `intent`, `source` and the
 * authoring `name` it had before SECURITY-001 (`w01-branch-pivot`). Local navigation is
 * returned unchanged, as it has no server meaning.
 */
export function withServerMeaning(scenarioId, control) {
  if (!control || control.local) return control
  const entry = entryFor(scenarioId, control.id)
  return {
    ...control,
    intent: entry?.intent,
    source: VERIFY_SOURCE_BY_INTENT[entry?.intent] ?? null,
    name: entry?.name,
  }
}

/** The neutral id a scene control has now, from the authoring name it used to have. */
export function controlIdByName(scenarioId, name) {
  const found = Object.entries(SCENE_ACTIONS[scenarioId] ?? {})
    .find(([, entry]) => entry.name === name)
  return found?.[0] ?? null
}

/** The generic control that submits `intent` at `stage`. */
export function genericIdFor(stage, intent) {
  return Object.entries(GENERIC_ACTIONS)
    .find(([, entry]) => entry.stage === stage && entry.intent === intent)?.[0] ?? null
}

/** A stand-in for the server's per-run code: opaque, deterministic, test-only. */
export function fakeActionCode(runId, scenarioId, controlId) {
  const hex = createHash('sha256').update(`${runId}|${scenarioId}|${controlId}`).digest('hex')
  return `ac_${hex.slice(0, 20)}`
}

/** `{ control id: code }` for a run, exactly the shape `/current-run` sends. */
export function fakeActionCodes(runId, scenarioId) {
  const ids = [...Object.keys(GENERIC_ACTIONS), ...Object.keys(SCENE_ACTIONS[scenarioId] ?? {})]
  return Object.fromEntries(ids.map((id) => [id, fakeActionCode(runId, scenarioId, id)]))
}

/** The server entry an issued code stands for on this run, or null. */
export function translateFakeCode(runId, scenarioId, code) {
  const codes = fakeActionCodes(runId, scenarioId)
  const controlId = Object.keys(codes).find((id) => codes[id] === code)
  return controlId ? { controlId, ...entryFor(scenarioId, controlId) } : null
}
