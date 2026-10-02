import {
  ACTIVITY_DAYS,
  DASHBOARD_MODE,
  DASHBOARD_PARAMS,
  EXTREMES_MIN_PLATFORMS,
  RATE_DECIMALS,
  SCORE_BAND_WIDTH,
  SCORE_MAX,
} from '../constants/adminDashboard.js'
import { PLATFORMS, SCENARIO_POINTS } from '../constants/scenarioDefinition.js'
import {
  CRITICAL_EVENT_CODES,
  OUTCOME_CLASSES,
  PLATFORM_LABELS,
} from '../constants/resultProjection.js'
import { ATTEMPT_STATUSES } from '../constants/scenarioSelection.js'
import { Attempt } from '../models/Attempt.js'
import { Candidate } from '../models/Candidate.js'
import { ScenarioDefinition } from '../models/ScenarioDefinition.js'
import { ScenarioEvent } from '../models/ScenarioEvent.js'
import { ScenarioRun } from '../models/ScenarioRun.js'
import { ApiError } from '../utils/ApiError.js'
import { classifyOutcome } from './attemptResultService.js'
import { demoProfileIds, excludeDemoAttempts } from './demoAssessmentService.js'

/**
 * The instructor dashboard (ENHANCEMENT-001).
 *
 * ### It computes no score and classifies nothing of its own
 *
 * Attempt totals are the `total_score` the scoring engine committed, and per-scenario
 * scores are the `score_0_10` it committed. Each resolved run's outcome class comes from
 * `classifyOutcome()` - the RESULT-001 function the learner's result and the instructor
 * attempt viewer already use - fed the same three inputs: the PINNED definition's
 * disposition, the run's final action, and whether the ledger holds a critical event.
 * Only critical event codes are read, because that is the only thing the classifier asks
 * of the event list; the answer is therefore identical to what the result screen shows.
 *
 * What this file adds is counting: how many runs fell into each class, per platform, and
 * the ratios between those counts. Every ratio carries its numerator and denominator so a
 * reader can see how much data sits behind it.
 *
 * ### Read-only, aggregate-only
 *
 * Nothing is written and no audit entry is appended - reading is not an administrative
 * change. The response carries no learner name, service number, profile or attempt id,
 * scenario id, event code, outcome code, learner action or rationale.
 */

const fail = (status, code, message, details = null) => {
  throw new ApiError(status, code, message, details)
}

/* ------------------------------------------------------------------ *
 * Input
 * ------------------------------------------------------------------ */

/**
 * The same boundary as the attempt viewer: an unknown parameter is refused rather than
 * ignored. Since ENHANCEMENT-001B the dashboard takes no parameters at all - its scope is
 * fixed to assessment attempts - so every key, including a leftover `mode`, is refused.
 */
export function parseDashboardQuery(query = {}) {
  const unknown = Object.keys(query).filter((key) => !DASHBOARD_PARAMS.includes(key))
  if (unknown.length) {
    fail(422, 'FORBIDDEN_FILTER', 'The dashboard accepts no filters.',
      { rejected_filters: unknown, allowed_filters: DASHBOARD_PARAMS })
  }
  return { mode: DASHBOARD_MODE }
}

/* ------------------------------------------------------------------ *
 * Pure aggregation
 * ------------------------------------------------------------------ */

const round = (value, places = RATE_DECIMALS) => {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}

/** A ratio with its evidence. `rate` is null when there is nothing to divide by. */
export function ratio(numerator, denominator) {
  return {
    numerator,
    denominator,
    rate: denominator > 0 ? round(numerator / denominator) : null,
  }
}

/** Mean, median, min and max of a list of numbers, or nulls for an empty list. */
export function summarise(values) {
  if (!values.length) return { count: 0, mean: null, median: null, min: null, max: null }
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  return {
    count: sorted.length,
    mean: round(sorted.reduce((sum, v) => sum + v, 0) / sorted.length, 1),
    median: round(median, 1),
    min: sorted[0],
    max: sorted[sorted.length - 1],
  }
}

/** The ten 0-100 score bands, each counted. 100 falls in the last band. */
export function scoreBands(scores) {
  const count = Math.ceil(SCORE_MAX / SCORE_BAND_WIDTH)
  const bands = Array.from({ length: count }, (_, i) => ({
    from: i * SCORE_BAND_WIDTH,
    to: i === count - 1 ? SCORE_MAX : (i + 1) * SCORE_BAND_WIDTH - 1,
    count: 0,
  }))
  for (const score of scores) {
    const index = Math.min(Math.floor(score / SCORE_BAND_WIDTH), count - 1)
    if (index >= 0) bands[index].count += 1
  }
  return bands
}

/** Each learner's most recently completed attempt. Ties break on attempt id. */
export function latestPerLearner(attempts) {
  const latest = new Map()
  for (const attempt of attempts) {
    const key = String(attempt.profile_id)
    const current = latest.get(key)
    const newer = !current
      || attempt.completed_at > current.completed_at
      || (attempt.completed_at.getTime() === current.completed_at.getTime()
        && String(attempt._id) > String(current._id))
    if (newer) latest.set(key, attempt)
  }
  return [...latest.values()]
}

/** Completions per UTC day for the `days` days ending on `now`'s day, oldest first. */
export function completionsByDay(attempts, now, days = ACTIVITY_DAYS) {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const DAY = 24 * 60 * 60 * 1000
  const rows = Array.from({ length: days }, (_, i) => ({
    date: new Date(today - (days - 1 - i) * DAY).toISOString().slice(0, 10),
    completed: 0,
  }))
  const index = new Map(rows.map((row, i) => [row.date, i]))
  for (const attempt of attempts) {
    const day = attempt.completed_at?.toISOString().slice(0, 10)
    if (index.has(day)) rows[index.get(day)].completed += 1
  }
  return rows
}

function emptyPlatform(platform) {
  return {
    platform,
    label: PLATFORM_LABELS[platform] ?? platform,
    scenarios: 0,
    points: 0,
    max_points: 0,
    outcomes: Object.fromEntries(Object.values(OUTCOME_CLASSES).map((c) => [c, 0])),
    malicious_decided: 0,
    legitimate_decided: 0,
  }
}

/**
 * Per-platform performance over classified runs.
 *
 * `entries` are `{ platform, score, disposition, outcome_class }`, one per resolved run of a
 * completed attempt. The three rates, each documented in docs/ADMIN_DASHBOARD.md:
 *
 *   attack_success_rate  missed_threat / malicious runs the learner decided
 *   safe_handling_rate   handled_safely / all runs the learner decided
 *   false_positive_rate  false_positive / legitimate runs the learner decided
 *
 * "Decided" excludes `not_resolved` - scenarios the 90-minute limit closed before the
 * learner took a final action. Counting them either way would claim a decision nobody made.
 * Their points still count toward the platform's score, exactly as they count toward the
 * learner's own total.
 */
export function platformPerformance(entries) {
  const byPlatform = new Map(PLATFORMS.map((p) => [p, emptyPlatform(p)]))

  for (const entry of entries) {
    if (!byPlatform.has(entry.platform)) byPlatform.set(entry.platform, emptyPlatform(entry.platform))
    const row = byPlatform.get(entry.platform)
    row.scenarios += 1
    row.points += entry.score
    row.max_points += SCENARIO_POINTS.max
    row.outcomes[entry.outcome_class] += 1
    if (entry.outcome_class !== OUTCOME_CLASSES.NOT_RESOLVED) {
      if (entry.disposition === 'malicious') row.malicious_decided += 1
      if (entry.disposition === 'legitimate') row.legitimate_decided += 1
    }
  }

  return [...byPlatform.values()].map((row) => {
    const decided = row.scenarios - row.outcomes[OUTCOME_CLASSES.NOT_RESOLVED]
    return {
      platform: row.platform,
      label: row.label,
      scenarios: row.scenarios,
      points: row.points,
      max_points: row.max_points,
      average_score: row.scenarios ? round(row.points / row.scenarios, 1) : null,
      score_rate: ratio(row.points, row.max_points),
      outcomes: row.outcomes,
      attack_success_rate: ratio(row.outcomes[OUTCOME_CLASSES.MISSED_THREAT], row.malicious_decided),
      safe_handling_rate: ratio(row.outcomes[OUTCOME_CLASSES.HANDLED_SAFELY], decided),
      false_positive_rate: ratio(row.outcomes[OUTCOME_CLASSES.FALSE_POSITIVE], row.legitimate_decided),
    }
  })
}

/**
 * The highest and lowest platform for one rate, over platforms that have data for it.
 * Ties are reported together rather than broken arbitrarily. Null when fewer than
 * `EXTREMES_MIN_PLATFORMS` platforms have data - there is nothing to compare.
 */
export function extremesOf(platforms, metric) {
  const withData = platforms.filter((p) => p[metric].rate !== null)
  if (withData.length < EXTREMES_MIN_PLATFORMS) return null

  const rates = withData.map((p) => p[metric].rate)
  const pick = (target) => {
    const hits = withData.filter((p) => p[metric].rate === target)
    return { platforms: hits.map((p) => p.platform), labels: hits.map((p) => p.label), rate: target }
  }
  const highest = Math.max(...rates)
  const lowest = Math.min(...rates)
  return { highest: pick(highest), lowest: pick(lowest), all_equal: highest === lowest }
}

/**
 * Builds the dashboard payload from already-loaded records. Pure, so every figure can be
 * checked without a database.
 */
export function aggregateDashboard({
  mode = DASHBOARD_MODE,
  now = new Date(),
  learners,
  statusCounts,
  completedAttempts,
  entries,
  unclassifiedRuns = 0,
}) {
  const totalAttempts = ATTEMPT_STATUSES.reduce((sum, s) => sum + (statusCounts[s] ?? 0), 0)
  const completed = statusCounts.completed ?? 0
  const scores = completedAttempts.map((a) => a.total_score)
  const latest = latestPerLearner(completedAttempts)
  const platforms = platformPerformance(entries)

  const endReasons = { learner_completed: 0, expired: 0 }
  for (const attempt of completedAttempts) {
    if (attempt.end_reason === 'expired') endReasons.expired += 1
    else endReasons.learner_completed += 1
  }

  const outcomeTotals = Object.fromEntries(Object.values(OUTCOME_CLASSES).map((c) => [c, 0]))
  for (const entry of entries) outcomeTotals[entry.outcome_class] += 1

  return {
    generated_at: now.toISOString(),
    scope: { mode, basis: 'completed_attempts' },

    learners: {
      total: learners.total,
      archived: learners.archived,
      with_any_attempt: learners.withAnyAttempt,
      with_completed_attempt: latest.length,
    },

    attempts: {
      total: totalAttempts,
      by_status: Object.fromEntries(ATTEMPT_STATUSES.map((s) => [s, statusCounts[s] ?? 0])),
      completion_rate: ratio(completed, totalAttempts),
      completed_end_reasons: endReasons,
    },

    scores: {
      max_score: SCORE_MAX,
      attempts: summarise(scores),
      attempt_bands: scoreBands(scores),
      learners_latest: summarise(latest.map((a) => a.total_score)),
      learner_bands: scoreBands(latest.map((a) => a.total_score)),
    },

    platforms,
    extremes: {
      attack_success_rate: extremesOf(platforms, 'attack_success_rate'),
      score_rate: extremesOf(platforms, 'score_rate'),
    },

    scenarios: {
      classified: entries.length,
      unclassified: unclassifiedRuns,
      outcomes: outcomeTotals,
    },

    activity: { days: ACTIVITY_DAYS, completions_by_day: completionsByDay(completedAttempts, now) },
  }
}

/* ------------------------------------------------------------------ *
 * Loading
 * ------------------------------------------------------------------ */

/**
 * GET /api/admin/dashboard - assessment attempts only, no parameters.
 *
 * Seven bounded reads, whatever the data size: learner counts, attempt status counts,
 * learners with any attempt, the completed attempts, their resolved runs, the pinned
 * definitions' dispositions, and the critical events among those runs.
 */
export async function buildDashboard(query = {}, { now = new Date() } = {}) {
  const { mode } = parseDashboardQuery(query)

  /**
   * ENHANCEMENT-003-FINAL: the Demo User is a demonstration account, not a learner, so it
   * and its attempts are left out of every figure below - learner counts, attempt counts,
   * scores, bands, platform performance, outcome mix and the completion trend. Resolved on
   * the server from the configured demo identity; the dashboard accepts no parameters, so
   * no request can widen or narrow it. Demo attempts remain visible everywhere else in the
   * instructor area. See docs/ADMIN_DASHBOARD.md.
   */
  const demoIds = await demoProfileIds()
  const scope = { mode, ...excludeDemoAttempts(demoIds) }
  const learnerScope = { _id: { $nin: demoIds } }

  const [learnersTotal, learnersArchived, statusRows, profilesWithAttempt, completedAttempts] =
    await Promise.all([
      Candidate.countDocuments(learnerScope),
      Candidate.countDocuments({ ...learnerScope, archived: true }),
      Attempt.aggregate([{ $match: scope }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
      Attempt.distinct('profile_id', scope),
      Attempt.find({ ...scope, status: 'completed' })
        .select('profile_id mode total_score completed_at end_reason')
        .lean(),
    ])

  // A completed attempt always carries a total; one that does not is left out rather than
  // counted as zero.
  const scored = completedAttempts.filter((a) => Number.isFinite(a.total_score) && a.completed_at)

  const runs = scored.length
    ? await ScenarioRun.find({ attempt_id: { $in: scored.map((a) => a._id) }, status: 'resolved' })
      .select('scenario_id definition_version platform score_0_10 outcome_code')
      .lean()
    : []

  const pairs = new Map()
  for (const run of runs) {
    pairs.set(`${run.scenario_id}:${run.definition_version}`,
      { scenario_id: run.scenario_id, version: run.definition_version })
  }

  const [definitions, criticalEvents] = await Promise.all([
    pairs.size
      ? ScenarioDefinition.find({ $or: [...pairs.values()] })
        .select('scenario_id version disposition')
        .lean()
      : [],
    runs.length
      ? ScenarioEvent.find({
        run_id: { $in: runs.map((r) => r._id) },
        event_code: { $in: CRITICAL_EVENT_CODES },
      }).select('run_id event_code').lean()
      : [],
  ])

  const dispositionFor = new Map(
    definitions.map((d) => [`${d.scenario_id}:${d.version}`, d.disposition]),
  )
  const criticalByRun = new Map()
  for (const event of criticalEvents) {
    const key = String(event.run_id)
    if (!criticalByRun.has(key)) criticalByRun.set(key, [])
    criticalByRun.get(key).push(event.event_code)
  }

  let unclassifiedRuns = 0
  const entries = []
  for (const run of runs) {
    const disposition = dispositionFor.get(`${run.scenario_id}:${run.definition_version}`)
    if (!disposition) {
      // The pinned content is missing. Reported as a count, never guessed at.
      unclassifiedRuns += 1
      continue
    }
    entries.push({
      platform: run.platform,
      score: run.score_0_10,
      disposition,
      outcome_class: classifyOutcome({
        disposition,
        outcomeCode: run.outcome_code,
        eventCodes: criticalByRun.get(String(run._id)) ?? [],
      }),
    })
  }

  return aggregateDashboard({
    mode,
    now,
    learners: {
      total: learnersTotal,
      archived: learnersArchived,
      withAnyAttempt: profilesWithAttempt.length,
    },
    statusCounts: Object.fromEntries(statusRows.map((row) => [row._id, row.n])),
    completedAttempts: scored,
    entries,
    unclassifiedRuns,
  })
}
