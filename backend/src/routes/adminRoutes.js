import { Router } from 'express'
import { getCurrentAdmin, login, logout } from '../controllers/adminController.js'
import { getAuditLog } from '../controllers/auditController.js'
import { getDashboard } from '../controllers/adminDashboardController.js'
import {
  getAttemptDetailForAdmin,
  listAttemptsForAdmin,
  lookupLearnersForAdmin,
} from '../controllers/attemptViewerController.js'
import {
  getScenario,
  getScenarioAtVersion,
  listScenarioDefinitions,
  patchScenarioVersion,
  postScenario,
  postScenarioClone,
  postScenarioDeactivate,
  postScenarioPublish,
} from '../controllers/scenarioManagerController.js'
import {
  getExportArtifact,
  postAttemptExport,
  postLearnerExport,
} from '../controllers/exportController.js'
import {
  getFeedbackTimingConfig,
  patchFeedbackTimingConfig,
  postAttemptReset,
  postProfileArchive,
} from '../controllers/instructorControlController.js'
import { requireAdmin } from '../middleware/adminSession.js'
import { adminLoginThrottle } from '../middleware/adminThrottle.js'

/**
 * /api/admin/*
 *
 * Every route added here in future - the BE-005b statistics endpoints - goes
 * behind `requireAdmin` and stays read-only. Assumption 4 of the proposal
 * makes the admin panel a statistics and reporting surface, so there is no
 * write endpoint under this namespace and no route that creates an AdminUser.
 *
 * ADMIN-005 adds the audit log as a READ route only. Entries are written by
 * `auditService.append()` from inside the transaction of the administrative
 * change they describe; no route appends, updates or deletes one, so an
 * administrator cannot forge or rewrite history through the application.
 */
export const adminRoutes = Router()

adminRoutes.post('/login', adminLoginThrottle, login)
adminRoutes.post('/logout', logout)
adminRoutes.get('/me', requireAdmin, getCurrentAdmin)

adminRoutes.get('/audit', requireAdmin, getAuditLog)

/**
 * ENHANCEMENT-001 dashboard (MOM 24 September 2026). READ-ONLY and aggregate-only: counts
 * and ratios over completed attempts, per platform, score band and day. It publishes no
 * learner identity, no scenario id and no event or outcome code, and appends nothing to
 * the audit log. Behind `requireAdmin` like every other route here - there is no public
 * or candidate path to it.
 */
adminRoutes.get('/dashboard', requireAdmin, getDashboard)

/**
 * ADMIN-001 scenario manager. Every route requires an administrator; there is no learner
 * path to any of them, and a candidate session is rejected rather than downgraded.
 *
 * Publication and deactivation are POSTs rather than PUTs on purpose: each is a lifecycle
 * transition with a transaction and an audit entry behind it, not a field assignment.
 */
adminRoutes.get('/scenarios', requireAdmin, listScenarioDefinitions)
adminRoutes.post('/scenarios', requireAdmin, postScenario)
adminRoutes.get('/scenarios/:scenarioId', requireAdmin, getScenario)
adminRoutes.get('/scenarios/:scenarioId/versions/:version', requireAdmin, getScenarioAtVersion)
adminRoutes.patch('/scenarios/:scenarioId/versions/:version', requireAdmin, patchScenarioVersion)
adminRoutes.post('/scenarios/:scenarioId/versions/:version/clone', requireAdmin, postScenarioClone)
adminRoutes.post('/scenarios/:scenarioId/versions/:version/publish', requireAdmin, postScenarioPublish)
adminRoutes.post('/scenarios/:scenarioId/versions/:version/deactivate', requireAdmin, postScenarioDeactivate)

/**
 * ADMIN-002 attempt viewer. READ-ONLY: three GETs and no write verb of any kind.
 *
 * Resetting an attempt is ADMIN-004 and will arrive with its own transaction and its own
 * `ATTEMPT_RESET` audit entry. Nothing below appends to the audit log - it records
 * administrative changes, and looking at an attempt is not one.
 *
 * `/learners` exists only so the learner filter is usable: it turns a name or service
 * number prefix into a profile id, and publishes the masked service number only.
 */
adminRoutes.get('/attempts', requireAdmin, listAttemptsForAdmin)
adminRoutes.get('/attempts/:attemptId', requireAdmin, getAttemptDetailForAdmin)
adminRoutes.get('/learners', requireAdmin, lookupLearnersForAdmin)

/**
 * ADMIN-003 offline exports.
 *
 * The POST is the only write in this namespace, and what it writes is a FILE plus one
 * append-only `EXPORT_CREATED` entry - it changes no attempt, run, event, profile or
 * scenario. The GET reads back an artifact this server wrote and appends nothing.
 *
 * Neither route accepts a path, a directory or a filename from the client. The export
 * directory is server configuration and the artifact name is server-generated.
 */
adminRoutes.post('/exports/attempts/:attemptId', requireAdmin, postAttemptExport)
// ADM-007: every completed attempt of one learner. Same contract, same audit entry.
adminRoutes.post('/exports/learners/:profileId', requireAdmin, postLearnerExport)
adminRoutes.get('/exports/:filename', requireAdmin, getExportArtifact)

/**
 * ADMIN-004 instructor controls - the three section 6 controls and nothing else.
 *
 * Reset and archive are POSTs because each is a lifecycle transition with a transaction
 * and an audit entry behind it, not a field assignment. **There is no DELETE**: archival
 * is not deletion, and a reset destroys nothing.
 *
 * The configuration surface is two enum fields. An administrator cannot configure scoring,
 * the taxonomies, selection, evaluation keys, a security boundary or anything about the
 * network through it.
 */
adminRoutes.post('/attempts/:attemptId/reset', requireAdmin, postAttemptReset)
adminRoutes.post('/learners/:profileId/archive', requireAdmin, postProfileArchive)
adminRoutes.get('/config/feedback', requireAdmin, getFeedbackTimingConfig)
adminRoutes.patch('/config/feedback', requireAdmin, patchFeedbackTimingConfig)
