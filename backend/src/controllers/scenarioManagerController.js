import {
  cloneScenarioVersion,
  createScenario,
  deactivateScenarioVersion,
  editScenarioVersion,
  getScenarioVersion,
  getScenarioVersions,
  listScenarios,
  publishScenarioVersion,
  toAdminDetail,
} from '../services/scenarioManagerService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/**
 * The scenario manager HTTP surface (ADMIN-001).
 *
 * Every route sits behind `requireAdmin`; there is no learner path to any of them. The
 * handlers translate requests into service calls and nothing more - no validation rule,
 * no lifecycle decision and no audit write lives here.
 *
 * Responses carry authoring data including the evaluation block, because this is an
 * authenticated instructor surface and an author cannot edit what they cannot see. They
 * carry no learner data of any kind.
 */

/** GET /api/admin/scenarios - a bounded, allowlisted, deterministically sorted page. */
export const listScenarioDefinitions = asyncHandler(async (req, res) => {
  res.json(await listScenarios(req.query ?? {}))
})

/** GET /api/admin/scenarios/:scenarioId - every version, newest first. */
export const getScenario = asyncHandler(async (req, res) => {
  res.json(await getScenarioVersions(req.params.scenarioId))
})

/** GET /api/admin/scenarios/:scenarioId/versions/:version - one version. */
export const getScenarioAtVersion = asyncHandler(async (req, res) => {
  const found = await getScenarioVersion(req.params.scenarioId, req.params.version)
  res.json({ scenario: toAdminDetail(found) })
})

/** POST /api/admin/scenarios - a new scenario, as version 1, always a draft. */
export const postScenario = asyncHandler(async (req, res) => {
  const created = await createScenario(req.body)
  res.status(201).json({ scenario: toAdminDetail(created), created: true })
})

/**
 * PATCH /api/admin/scenarios/:scenarioId/versions/:version
 *
 * A draft is rewritten in place. A published or retired version is never rewritten - the
 * edit becomes the next version, and `created_version` says so.
 */
export const patchScenarioVersion = asyncHandler(async (req, res) => {
  const { definition, created_version: createdVersion, edited_in_place: inPlace } =
    await editScenarioVersion(req.params.scenarioId, req.params.version, req.body)

  res.json({
    scenario: toAdminDetail(definition),
    edited_in_place: inPlace,
    created_version: createdVersion,
  })
})

/** POST /api/admin/scenarios/:scenarioId/versions/:version/clone */
export const postScenarioClone = asyncHandler(async (req, res) => {
  const clone = await cloneScenarioVersion(req.params.scenarioId, req.params.version, {
    targetScenarioId: req.body?.target_scenario_id ?? null,
  })
  res.status(201).json({ scenario: toAdminDetail(clone), created: true })
})

/** POST /api/admin/scenarios/:scenarioId/versions/:version/publish */
export const postScenarioPublish = asyncHandler(async (req, res) => {
  const result = await publishScenarioVersion(req.params.scenarioId, req.params.version, {
    actor: req.admin,
    idempotencyKey: req.body?.idempotency_key ?? null,
  })

  res.json({
    scenario: toAdminDetail(result.definition),
    changed: result.changed,
    previously_active_version: result.previously_active_version,
  })
})

/** POST /api/admin/scenarios/:scenarioId/versions/:version/deactivate */
export const postScenarioDeactivate = asyncHandler(async (req, res) => {
  const result = await deactivateScenarioVersion(req.params.scenarioId, req.params.version, {
    actor: req.admin,
    idempotencyKey: req.body?.idempotency_key ?? null,
  })

  res.json({ scenario: toAdminDetail(result.definition), changed: result.changed })
})
