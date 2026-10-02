import { getPoolSummary } from '../services/scenarioImportService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/**
 * GET /api/scenarios/summary
 * Counts only. Scenario content is never listed through the API - a candidate
 * receives one scenario at a time, through the assessment question endpoint,
 * already stripped by Scenario.toCandidateJSON().
 */
export const getScenarioSummary = asyncHandler(async (_req, res) => {
  res.json({ pool: await getPoolSummary() })
})
