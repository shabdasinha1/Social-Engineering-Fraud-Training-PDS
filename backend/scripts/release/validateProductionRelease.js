/**
 * MIGRATION-001 - validates a production-release database. READ-ONLY.
 *
 *   node scripts/release/validateProductionRelease.js
 *   node scripts/release/validateProductionRelease.js --db=cyber_awareness_training_release
 *   node scripts/release/validateProductionRelease.js --json > report.json
 *
 * Options:
 *   --uri=<mongodb uri>   server (default mongodb://127.0.0.1:27017/?replicaSet=rs0)
 *   --db=<name>           database to validate (default cyber_awareness_training_release)
 *   --json                print the full machine-readable report
 *
 * Exit code 0 only when every release invariant holds; 1 on any violation. Never repairs
 * anything: Mongoose's autoIndex and autoCreate are switched off, so connecting cannot
 * create an index or a collection, and every check only reads.
 */
import mongoose from 'mongoose'
import { printResults, runReleaseChecks } from './lib/releaseChecks.js'

export const RELEASE_DB_NAME = 'cyber_awareness_training_release'

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, ...v] = a.replace(/^--/, '').split('=')
  return [k, v.length ? v.join('=') : true]
}))
const uri = args.uri || 'mongodb://127.0.0.1:27017/?replicaSet=rs0'
const dbName = args.db || RELEASE_DB_NAME

async function run() {
  await mongoose.connect(uri, {
    dbName,
    autoIndex: false,
    autoCreate: false,
    serverSelectionTimeoutMS: 5000,
  })
  try {
    const exists = (await mongoose.connection.db.admin().listDatabases({ nameOnly: true }))
      .databases.some((d) => d.name === dbName)
    if (!exists) {
      console.error(`FAIL - database "${dbName}" does not exist on this server.`)
      process.exitCode = 1
      return
    }
    const outcome = await runReleaseChecks()
    if (args.json) {
      console.log(JSON.stringify({ database: dbName, validated_at: new Date().toISOString(), ...outcome }, null, 2))
    } else {
      console.log(`\nProduction release validation - ${dbName}`)
      console.log('-'.repeat(72))
      printResults(outcome)
    }
    if (outcome.status !== 'PASS') process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}

run().catch(async (error) => {
  console.error('FAIL -', error.message)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
