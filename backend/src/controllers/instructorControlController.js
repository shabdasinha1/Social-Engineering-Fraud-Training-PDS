import {
  archiveProfile,
  getAssessmentDurationConfig,
  getFeedbackConfig,
  resetAttempt,
  updateAssessmentDurationConfig,
  updateFeedbackConfig,
} from '../services/instructorControlService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/**
 * The instructor-controls HTTP surface (ADMIN-004).
 *
 * Four routes, all behind `requireAdmin`. The handlers translate a request into a service
 * call and nothing more: no lifecycle decision, no validation rule and no audit write
 * lives here.
 *
 * **There is no DELETE anywhere in this feature.** Archival is not deletion, a reset
 * preserves everything it touches, and configuration has no removal. No candidate-facing
 * control exists either - a learner cannot reset their own attempt, archive themselves or
 * change how feedback is timed.
 */

/**
 * POST /api/admin/attempts/:attemptId/reset
 *
 * Body: `{ "reason_code"?: …, "idempotency_key"?: … }` and nothing else.
 *
 * A POST rather than a PATCH on purpose: this is a lifecycle transition with a transaction
 * and an audit entry behind it, not a field assignment - the same reasoning ADMIN-001 used
 * for publish and deactivate.
 */
export const postAttemptReset = asyncHandler(async (req, res) => {
  const result = await resetAttempt(req.params.attemptId, {
    actor: req.admin,
    body: req.body ?? {},
  })
  res.json({ reset: result })
})

/**
 * POST /api/admin/learners/:profileId/archive
 *
 * Archives a learner profile under local policy. Idempotent: archiving an archived profile
 * reports `changed: false` and writes no second entry.
 *
 * There is deliberately no DELETE and no unarchive route.
 */
export const postProfileArchive = asyncHandler(async (req, res) => {
  const result = await archiveProfile(req.params.profileId, {
    actor: req.admin,
    body: req.body ?? {},
  })
  res.json({ profile: result })
})

/** GET /api/admin/config/feedback - the current timing, the allowed values and the defaults. */
export const getFeedbackTimingConfig = asyncHandler(async (_req, res) => {
  res.json(await getFeedbackConfig())
})

/**
 * PATCH /api/admin/config/feedback
 *
 * Body: either or both of `training_feedback_timing` and `assessment_feedback_timing`,
 * plus an optional `expected_config_version` and `idempotency_key`. Anything else is
 * rejected.
 *
 * PATCH rather than PUT: an instructor changing one mode's timing should not have to
 * restate the other's, and a partial body cannot then blank a value by omission.
 */
export const patchFeedbackTimingConfig = asyncHandler(async (req, res) => {
  res.json(await updateFeedbackConfig({ actor: req.admin, body: req.body ?? {} }))
})

/**
 * GET /api/admin/config/assessment-duration - the default duration for new attempts, the
 * allowed values, and how many assessments are running right now (a running assessment
 * locks the setting; the PATCH enforces that independently).
 */
export const getAssessmentDurationSetting = asyncHandler(async (_req, res) => {
  res.json(await getAssessmentDurationConfig())
})

/**
 * PATCH /api/admin/config/assessment-duration
 *
 * Body: `assessment_duration_minutes` (30, 45, 60, 75 or 90), plus an optional
 * `expected_config_version` and `idempotency_key`. Anything else is rejected, and so is
 * any change while an assessment is in progress (409 ASSESSMENT_IN_PROGRESS).
 */
export const patchAssessmentDurationSetting = asyncHandler(async (req, res) => {
  res.json(await updateAssessmentDurationConfig({ actor: req.admin, body: req.body ?? {} }))
})
