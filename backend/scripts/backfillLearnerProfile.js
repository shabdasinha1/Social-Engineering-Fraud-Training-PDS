/**
 * PROFILE-001 learner-profile backfill.
 *
 *   npm run backfill:profile -- --dry-run    report what would change, write nothing
 *   npm run backfill:profile                 apply
 *
 * Populates `service_no_masked` on profiles written before PROFILE-001 added it.
 *
 * That is the ONLY field this script writes, and it is the only new field that can honestly
 * be derived from what is already stored: the mask is a pure function of `identifier`, which
 * is the profile key and is never rewritten after creation.
 *
 *   - `last_seen_at` is deliberately NOT backfilled. Nobody recorded when these learners
 *     were last seen, and `updatedAt` is not that date - it moves for a name correction or
 *     an archival. A null is the honest answer and inventing one would be worse than none.
 *   - `briefing_version` / `briefing_acknowledged_at` are deliberately NOT backfilled. A
 *     consent record that nobody gave is exactly the thing a consent requirement exists to
 *     prevent. Null means "will be asked", which is correct.
 *
 * SAFETY. It touches the `candidates` collection and no other. It never inserts, never
 * deletes, never changes `_id`, `identifier`, `identifierNormalised`, `name`, the archival
 * fields or `seenScenarios` - so ownership of every attempt, run and event is untouched by
 * construction. Idempotent: re-running recomputes the same value and reports 0 updated.
 */
import { connectDatabase, disconnectDatabase } from '../src/config/database.js'
import { Candidate } from '../src/models/Candidate.js'
import { maskServiceNumber } from '../src/utils/serviceNumber.js'

const dryRun = process.argv.slice(2).includes('--dry-run')

async function run() {
  await connectDatabase()

  const profiles = await Candidate.find({}, { identifierNormalised: 1, service_no_masked: 1 }).lean()

  const stale = profiles.filter((p) => p.service_no_masked !== maskServiceNumber(p.identifierNormalised))

  console.log('\nPROFILE-001 learner-profile backfill')
  console.log('-'.repeat(58))
  console.log(`  profiles examined   ${profiles.length}`)
  console.log(`  already correct     ${profiles.length - stale.length}`)
  console.log(`  needing service_no_masked   ${stale.length}`)
  console.log('-'.repeat(58))

  let updated = 0
  for (const profile of stale) {
    const masked = maskServiceNumber(profile.identifierNormalised)
    // Reported masked, never raw: this script's own output must not leak a service number.
    console.log(`  ${dryRun ? 'would set' : 'set'} ${profile._id.toString()}  ->  ${masked}`)
    if (!dryRun) {
      // One field, addressed by _id. No document load, no validators, no other path written.
      await Candidate.collection.updateOne(
        { _id: profile._id },
        { $set: { service_no_masked: masked } },
      )
      updated += 1
    }
  }

  console.log('-'.repeat(58))
  if (dryRun) {
    console.log(`  DRY RUN - nothing written. ${stale.length} profile(s) would change.\n`)
  } else {
    console.log(`  updated             ${updated}`)
    const remaining = (await Candidate.find({}, { identifier: 1, service_no_masked: 1 }).lean())
      .filter((p) => p.service_no_masked !== maskServiceNumber(p.identifierNormalised))
    console.log(`  verification        ${remaining.length === 0 ? 'OK - every profile now stores its mask' : `FAILED - ${remaining.length} still stale`}`)
    console.log('')
    if (remaining.length) {
      await disconnectDatabase()
      process.exit(1)
    }
  }

  await disconnectDatabase()
}

run().catch(async (error) => {
  console.error(error)
  await disconnectDatabase().catch(() => {})
  process.exit(1)
})
