import { Scenario } from '../models/Scenario.js'
import { CHANNELS, JUDGEMENTS, SCENARIO_TYPES } from '../constants/assessment.js'

/**
 * Structural checks that run before Mongoose sees the document, so a bad file
 * produces one readable report instead of a stack trace per row.
 */
function validateShape(raw, index) {
  const errors = []
  const where = raw?.scenarioCode ? `"${raw.scenarioCode}"` : `entry #${index + 1}`

  if (!raw || typeof raw !== 'object') return [`${where}: not an object`]

  if (!raw.scenarioCode || typeof raw.scenarioCode !== 'string') {
    errors.push(`${where}: scenarioCode is required`)
  }
  if (!CHANNELS.includes(raw.channel)) {
    errors.push(`${where}: channel must be one of ${CHANNELS.join(', ')} (got "${raw.channel}")`)
  }
  if (!SCENARIO_TYPES.includes(raw.type)) {
    errors.push(`${where}: type must be one of ${SCENARIO_TYPES.join(', ')} (got "${raw.type}")`)
  }
  if (!raw.title) errors.push(`${where}: title is required`)

  const sim = raw.simulation
  if (!sim || !sim.entryScreenId || !Array.isArray(sim.screens) || sim.screens.length === 0) {
    errors.push(`${where}: simulation needs entryScreenId and at least one screen`)
  } else {
    const ids = sim.screens.map((screen) => screen.id)
    if (new Set(ids).size !== ids.length) errors.push(`${where}: duplicate screen ids`)
    if (!ids.includes(sim.entryScreenId)) {
      errors.push(`${where}: entryScreenId "${sim.entryScreenId}" is not one of the screens`)
    }
    for (const screen of sim.screens) {
      for (const action of screen.actions ?? []) {
        if (action.target && !ids.includes(action.target)) {
          errors.push(`${where}: action "${action.id}" targets unknown screen "${action.target}"`)
        }
      }
    }
  }

  for (const field of ['actionOptions', 'reasonOptions']) {
    const options = raw[field]
    if (!Array.isArray(options) || options.length < 2) {
      errors.push(`${where}: ${field} needs at least two options`)
      continue
    }
    const keys = options.map((option) => option.key)
    if (new Set(keys).size !== keys.length) errors.push(`${where}: duplicate ${field} keys`)
    if (options.some((option) => typeof option.marks !== 'number')) {
      errors.push(`${where}: every ${field} entry needs numeric marks`)
    }
  }

  const evaluation = raw.evaluation
  if (!evaluation) {
    errors.push(`${where}: evaluation is required`)
  } else {
    if (!JUDGEMENTS.includes(evaluation.correctJudgement)) {
      errors.push(
        `${where}: evaluation.correctJudgement must be one of ${JUDGEMENTS.join(', ')}`,
      )
    }
    if (!evaluation.feedback) errors.push(`${where}: evaluation.feedback is required`)
    if (raw.type === 'legitimate' && evaluation.correctJudgement === 'fraudulent') {
      errors.push(`${where}: a legitimate scenario cannot be correctly judged "fraudulent"`)
    }
    if (raw.type === 'malicious' && evaluation.correctJudgement === 'genuine') {
      errors.push(`${where}: a malicious scenario cannot be correctly judged "genuine"`)
    }
  }

  return errors
}

/**
 * Validates a whole scenario file and upserts it by scenarioCode. Nothing is
 * written unless every entry passes, so a partial file cannot leave the pool
 * half-updated.
 */
export async function importScenarios(entries, { dryRun = false } = {}) {
  if (!Array.isArray(entries)) {
    return { ok: false, errors: ['The scenario file must contain a JSON array.'] }
  }

  const errors = entries.flatMap((raw, index) => validateShape(raw, index))

  const codes = entries.map((raw) => raw?.scenarioCode).filter(Boolean)
  const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index)
  if (duplicates.length) {
    errors.push(`Duplicate scenarioCode in file: ${[...new Set(duplicates)].join(', ')}`)
  }

  if (errors.length) return { ok: false, errors }
  if (dryRun) return { ok: true, errors: [], created: 0, updated: 0, dryRun: true }

  let created = 0
  let updated = 0

  for (const raw of entries) {
    const existing = await Scenario.findOne({ scenarioCode: raw.scenarioCode }).select(
      '+evaluation',
    )

    if (existing) {
      existing.set({ ...raw, version: (existing.version ?? 1) + 1 })
      await existing.save()
      updated += 1
    } else {
      await Scenario.create(raw)
      created += 1
    }
  }

  return { ok: true, errors: [], created, updated }
}

/** Counts only - scenario content is never listed through the API. */
export async function getPoolSummary() {
  const rows = await Scenario.aggregate([
    { $group: { _id: { channel: '$channel', type: '$type', isActive: '$isActive' }, count: { $sum: 1 } } },
  ])

  const byChannel = Object.fromEntries(
    CHANNELS.map((channel) => [channel, { malicious: 0, legitimate: 0, total: 0 }]),
  )
  let total = 0
  let inactive = 0

  for (const row of rows) {
    const { channel, type, isActive } = row._id
    if (!isActive) {
      inactive += row.count
      continue
    }
    if (byChannel[channel]) {
      byChannel[channel][type] += row.count
      byChannel[channel].total += row.count
    }
    total += row.count
  }

  return { total, inactive, byChannel }
}
