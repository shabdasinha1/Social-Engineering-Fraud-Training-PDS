import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * The real pinned bank content, in the shape `/current-run` delivers it.
 *
 * Read from `backend/data/synthetic/v1` rather than from a fixture on purpose: a scene
 * test that passed against a hand-written payload would prove nothing about the scenario
 * the learner is actually given. Every authored platform is loaded so a scene id from any
 * of them (W… for WhatsApp, I… for Instagram) resolves to its own pinned record.
 */
function load(platform) {
  const path = resolve(process.cwd(), `../backend/data/synthetic/v1/synthetic.${platform}.json`)
  const parsed = JSON.parse(readFileSync(path, 'utf8'))
  const records = Array.isArray(parsed) ? parsed : (parsed.scenarios ?? [])
  return records
}

const BANK = Object.fromEntries(
  ['whatsapp', 'instagram', 'sms', 'email']
    .flatMap((platform) => load(platform))
    .map((record) => [record.scenario_id, record]),
)

export { BANK }

export function payload(scenarioId) {
  const record = BANK[scenarioId]
  return {
    id: `def-${scenarioId}`,
    scenario_id: record.scenario_id,
    version: record.definition_version,
    platform: record.platform,
    synthetic: record.synthetic,
    stages: [],
  }
}
