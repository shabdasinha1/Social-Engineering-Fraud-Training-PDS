import {
  COMPARABILITY_FIELDS,
  FAMILY_LABELS,
  PLATFORM_LABELS,
} from '../constants/resultProjection.js'
import { SCENARIO_POINTS } from '../constants/scenarioDefinition.js'
import { Attempt } from '../models/Attempt.js'
import { ProgressSnapshot } from '../models/ProgressSnapshot.js'
import { ScenarioDefinition } from '../models/ScenarioDefinition.js'
import { ScenarioRun } from '../models/ScenarioRun.js'

/**
 * Learner progress (PROGRESS-001, specification sections 6 and 7 - gap G2).
 *
 * ### The rebuild is a recomputation, which is what makes it idempotent
 *
 * `rebuildProgressSnapshot()` reads the learner's COMPLETED attempts and their resolved
 * runs and writes the totals it derives. It never adds to what is stored, so completing the
 * same attempt twice, replaying a retried request, or running the rebuild a hundred times
 * all produce the identical document. There is no counter that could drift and no guard
 * anybody has to remember.
 *
 * ### It is not a second scoring authority
 *
 * Every score here is read, never computed: `Attempt.total_score` for the attempt totals and
 * `ScenarioRun.score_0_10` for the per-scenario points. Both were written by the engine from
 * the event ledger. This service adds no scoring rule of its own, and nothing it writes is
 * ever read back to decide a score.
 */

/** The attempt statuses that count. An unfinished or instructor-reset attempt is neither. */
const COUNTED_STATUS = 'completed'

function bucketOf(map, key, label) {
  if (!map.has(key)) map.set(key, { key, label, scenarios: 0, points: 0, max_points: 0 })
  return map.get(key)
}

const sorted = (map) => [...map.values()].sort((a, b) => a.label.localeCompare(b.label))

/**
 * Recomputes and stores this learner's snapshot.
 *
 * Safe to call at any time and from anywhere; the caller never needs to know whether a
 * snapshot already existed. Returns the stored document.
 */
export async function rebuildProgressSnapshot(profileId) {
  const attempts = await Attempt.find({ profile_id: profileId, status: COUNTED_STATUS })
    .sort({ completed_at: 1, _id: 1 })
    .select('total_score completed_at mode content_version taxonomy_version trigger_taxonomy_version')

  const scores = attempts.map((a) => a.total_score).filter((s) => typeof s === 'number')
  const latest = attempts[attempts.length - 1] ?? null

  /**
   * Do the completed attempts actually share a comparability signature?
   *
   * Only a disclosure - see the model. `comparisonFor()` still owns the section 7 trend and
   * is not touched by this file.
   */
  const mixedVersions = latest
    ? attempts.some((a) => COMPARABILITY_FIELDS.some(
      (field) => String(a[field]) !== String(latest[field])))
    : false

  const platforms = new Map()
  const families = new Map()
  let scenariosCompleted = 0

  if (attempts.length) {
    const runs = await ScenarioRun.find({
      attempt_id: { $in: attempts.map((a) => a._id) },
      status: 'resolved',
    }).select('scenario_id definition_version platform score_0_10')

    scenariosCompleted = runs.length

    // Family lives on the pinned definition, not on the run. `evaluation` is never selected:
    // the classification used here is the canonical family and nothing else.
    const wanted = [...new Set(runs.map((r) => `${r.scenario_id}:${r.definition_version}`))]
    const definitions = wanted.length
      ? await ScenarioDefinition.find({
        $or: wanted.map((keyed) => {
          const [scenarioId, version] = keyed.split(':')
          return { scenario_id: scenarioId, version: Number(version) }
        }),
      }).select('scenario_id version canonical_family')
      : []
    const familyOf = new Map(
      definitions.map((d) => [`${d.scenario_id}:${d.version}`, d.canonical_family]),
    )

    for (const run of runs) {
      const points = run.score_0_10 ?? 0

      const platform = bucketOf(platforms, run.platform,
        PLATFORM_LABELS[run.platform] ?? run.platform)
      platform.scenarios += 1
      platform.points += points
      platform.max_points += SCENARIO_POINTS.max

      const family = familyOf.get(`${run.scenario_id}:${run.definition_version}`)
      // A run whose definition has since been removed is counted in the platform totals but
      // cannot be attributed to a family. Skipped rather than bucketed as "unknown".
      if (!family) continue
      const bucket = bucketOf(families, family, FAMILY_LABELS[family] ?? family)
      bucket.scenarios += 1
      bucket.points += points
      bucket.max_points += SCENARIO_POINTS.max
    }
  }

  const update = {
    attempt_count: attempts.length,
    scenarios_completed: scenariosCompleted,
    last_score: latest ? (latest.total_score ?? null) : null,
    best_score: scores.length ? Math.max(...scores) : null,
    by_platform: sorted(platforms),
    by_family: sorted(families),
    mode: latest?.mode ?? null,
    content_version: latest?.content_version ?? null,
    taxonomy_version: latest?.taxonomy_version ?? null,
    trigger_taxonomy_version: latest?.trigger_taxonomy_version ?? null,
    mixed_versions: mixedVersions,
    // Server clock, always. A client timestamp could not be trusted and is never accepted.
    generated_at: new Date(),
  }

  return ProgressSnapshot.findOneAndUpdate(
    { profile_id: profileId },
    { $set: update, $setOnInsert: { profile_id: profileId } },
    {
      // The rebuilt document, not the one it replaced.
      returnDocument: 'after',
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  )
}

/**
 * The learner's snapshot, rebuilt when it is missing or has fallen behind.
 *
 * Read-repair rather than a migration: a learner who has never had a snapshot written gets
 * one on first read, and one that disagrees with the authoritative attempt count is
 * refreshed. That is what makes a production backfill unnecessary - the read path cannot
 * serve a stale number, because it checks before it serves.
 *
 * The check is one `countDocuments` against an index that already exists
 * (`Attempt(profile_id, status)`).
 */
export async function getProgressSnapshot(profileId) {
  const [snapshot, completed] = await Promise.all([
    ProgressSnapshot.findOne({ profile_id: profileId }),
    Attempt.countDocuments({ profile_id: profileId, status: COUNTED_STATUS }),
  ])

  if (!snapshot || snapshot.attempt_count !== completed) {
    return rebuildProgressSnapshot(profileId)
  }
  return snapshot
}

/**
 * Refresh after an attempt completes, without letting the refresh endanger the completion.
 *
 * Called AFTER the completion transaction has committed, deliberately outside it: the
 * deployment strategy records that this snapshot is "never a write that must be atomic with
 * anything". A failure here is logged and swallowed, because the attempt is already
 * complete and correct - and the next read repairs the snapshot anyway.
 */
export async function refreshProgressAfterCompletion(profileId) {
  try {
    return await rebuildProgressSnapshot(profileId)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(JSON.stringify({
      progress: 'snapshot_refresh_failed',
      profile_id: String(profileId),
      message: error.message,
    }))
    return null
  }
}
