/**
 * MIGRATION-001 - builds a clean production-release database from validated source data.
 *
 *   node scripts/release/buildProductionRelease.js
 *   node scripts/release/buildProductionRelease.js --target=cyber_awareness_training_release
 *
 * Options:
 *   --uri=<mongodb uri>     server (default mongodb://127.0.0.1:27017/?replicaSet=rs0)
 *   --target=<name>         database to create (default cyber_awareness_training_release)
 *   --compare-db=<name>     an existing database whose bank is compared READ-ONLY with the
 *                           new one (default cyber_awareness_training); `--compare-db=` skips
 *   --report=<file>         where to write the build report JSON
 *
 * What it does, in order:
 *   1. refuses unless the server is a replica set and the target database does NOT exist
 *   2. creates every application collection and every index the models declare
 *   3. imports the 100 scenario definitions through the application's own importer, from
 *      backend/data/scenarios/v1 + synthetic/v1 + taxonomy (never cloned from another DB)
 *   4. runs the full release validation (scripts/release/lib/releaseChecks.js)
 *   5. compares the stored bank with --compare-db, read-only
 *   6. prints PASS or FAIL and exits 0 or 1
 *
 * NON-DESTRUCTIVE. It never drops, deletes, updates or overwrites anything: an existing
 * target is refused rather than replaced, no other database is written, and on failure the
 * partly built target is left in place for inspection - remove it by hand once understood.
 */
import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import mongoose from 'mongoose'
import { importScenarioDefinitions } from '../../src/services/scenarioDefinitionImportService.js'
import { inventoryDatabase } from './lib/inventory.js'
import {
  BACKEND_DIR,
  MODELS,
  RELEASE_COLLECTIONS,
  printResults,
  runReleaseChecks,
  sourceFileDigests,
  rawBankDifferences,
  semanticBankFingerprint,
  storedBankFingerprint,
} from './lib/releaseChecks.js'

export const BUILD_SCRIPT_VERSION = '1.0.0'
const PRODUCTION_DB_NAME = 'cyber_awareness_training'

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, ...v] = a.replace(/^--/, '').split('=')
  return [k, v.length ? v.join('=') : true]
}))
const uri = args.uri || 'mongodb://127.0.0.1:27017/?replicaSet=rs0'
const target = args.target || 'cyber_awareness_training_release'
const compareDb = args['compare-db'] === undefined ? PRODUCTION_DB_NAME : args['compare-db']
const reportFile = args.report
  || path.join(BACKEND_DIR, 'deploy', 'migration-001', `${target}.build-report.json`)

const step = (n, text) => console.log(`\n[${n}] ${text}`)

function gitState() {
  try {
    const run = (...a) => execFileSync('git', a, { cwd: BACKEND_DIR, encoding: 'utf8' }).trim()
    return { head: run('rev-parse', 'HEAD'), uncommitted_changes: run('status', '--porcelain').length > 0 }
  } catch {
    return null
  }
}

async function run() {
  if (!/^[A-Za-z0-9_-]+$/.test(target)) throw new Error(`invalid target database name "${target}"`)
  if (target === PRODUCTION_DB_NAME || target === compareDb) {
    throw new Error(`refusing to build into "${target}" - the release must be a separate database`)
  }

  const startedAt = new Date()
  await mongoose.connect(uri, {
    dbName: target, autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 5000,
  })
  const conn = mongoose.connection
  const admin = conn.db.admin()

  step(1, 'Pre-flight')
  const hello = await admin.command({ hello: 1 })
  if (!hello.setName) throw new Error('MongoDB is standalone; the application needs a replica set (see docs/LOCAL_MONGODB_REPLICA_SET.md)')
  const { databases } = await admin.listDatabases({ nameOnly: true })
  if (databases.some((d) => d.name === target)) {
    throw new Error(`database "${target}" already exists - refusing to overwrite it. ` +
      'Validate it with validateProductionRelease.js, or drop it deliberately and rebuild.')
  }
  const { version: mongodVersion } = await admin.command({ buildInfo: 1 })
  console.log(`  server   MongoDB ${mongodVersion}, replica set "${hello.setName}"`)
  console.log(`  target   ${target} (does not exist yet)`)

  const dry = await importScenarioDefinitions({ version: 1, active: true, dryRun: true })
  if (dry.status !== 'DRY_RUN_OK') {
    for (const e of dry.errors.slice(0, 40)) console.error(`  - ${e}`)
    throw new Error(`source data failed validation (${dry.errors.length} problem(s)); nothing was created`)
  }
  console.log(`  source   ${dry.total_source_records} scenarios validated, bank sha256 ${dry.content_sha256}`)

  step(2, 'Collections and indexes')
  for (const model of MODELS) {
    await model.createCollection()
    await model.createIndexes()
    const n = (await conn.db.collection(model.collection.collectionName).indexes()).length
    console.log(`  ${model.collection.collectionName.padEnd(20)} created, ${n} index(es)`)
  }

  step(3, 'Scenario definitions (application importer, source files only)')
  const imported = await importScenarioDefinitions({ version: 1, active: true })
  if (imported.status !== 'OK' || imported.inserted !== 100) {
    for (const e of imported.errors.slice(0, 40)) console.error(`  - ${e}`)
    throw new Error(`import did not complete cleanly (status ${imported.status}, inserted ${imported.inserted})`)
  }
  console.log(`  inserted ${imported.inserted}, updated ${imported.updated}, unchanged ${imported.unchanged}`)

  step(4, 'Release validation')
  const outcome = await runReleaseChecks()
  printResults(outcome)

  step(5, `Read-only comparison with "${compareDb || '(skipped)'}"`)
  const releaseBankSha = await semanticBankFingerprint(conn)
  const releaseRawSha = await storedBankFingerprint(conn.db)
  let comparison = null
  if (compareDb) {
    const exists = databases.some((d) => d.name === compareDb)
    if (exists) {
      // useDb shares the client; only find() is issued against the other database.
      const otherConn = conn.useDb(compareDb, { useCache: false })
      const otherSha = await semanticBankFingerprint(otherConn)
      const otherRawSha = await storedBankFingerprint(otherConn.db)
      comparison = {
        database: compareDb,
        semantic_bank_sha256: otherSha,
        raw_bank_sha256: otherRawSha,
        identical: otherSha === releaseBankSha,
        raw_identical: otherRawSha === releaseRawSha,
      }
      console.log(`  release bank (semantic)  ${releaseBankSha}`)
      console.log(`  ${compareDb} (semantic)  ${otherSha}`)
      console.log(`  ${comparison.identical ? 'IDENTICAL' : 'DIFFERENT'} as the application reads them (every field except _id, timestamps, __v)`)
      if (!comparison.raw_identical) {
        comparison.raw_differences = await rawBankDifferences(otherConn.db, conn.db)
        console.log(`  raw storage differences (${compareDb} vs release), documents affected:`)
        for (const [d, n] of Object.entries(comparison.raw_differences)) console.log(`    ${n} x ${d}`)
      }
    } else {
      console.log(`  "${compareDb}" does not exist on this server; skipped`)
    }
  }

  const inventory = await inventoryDatabase(conn.getClient(), target)
  const report = {
    migration: 'MIGRATION-001',
    build_script: `backend/scripts/release/buildProductionRelease.js v${BUILD_SCRIPT_VERSION}`,
    release_database: target,
    started_at: startedAt.toISOString(),
    finished_at: new Date().toISOString(),
    mongod_version: mongodVersion,
    topology: `replica set "${hello.setName}"`,
    git: gitState(),
    import: {
      source_document: imported.source_document,
      source_document_version: imported.source_document_version,
      scenario_version: imported.scenario_version,
      content_sha256: imported.content_sha256,
      synthetic_content_version: imported.synthetic_content_version,
      synthetic_content_sha256: imported.synthetic_content_sha256,
      inserted: imported.inserted,
    },
    source_files_sha256: sourceFileDigests(),
    collection_roles: Object.fromEntries(Object.entries(RELEASE_COLLECTIONS).map(([k, v]) => [k, v.role])),
    release_bank_semantic_sha256: releaseBankSha,
    release_bank_raw_sha256: releaseRawSha,
    comparison,
    validation: outcome,
    inventory,
  }
  await mkdir(path.dirname(reportFile), { recursive: true })
  await writeFile(reportFile, `${JSON.stringify(report, null, 2)}\n`)
  console.log(`\n  report   ${path.relative(process.cwd(), reportFile)}`)

  const pass = outcome.status === 'PASS' && (!comparison || comparison.identical)
  console.log(`\nBUILD ${pass ? 'PASS' : 'FAIL'} - ${target}`)
  if (!pass) process.exitCode = 1
}

run()
  .catch((error) => {
    console.error(`\nBUILD FAIL - ${error.message}`)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect().catch(() => {}))
