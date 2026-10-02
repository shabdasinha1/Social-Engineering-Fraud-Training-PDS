/**
 * Client scenario-definition import (DATA-002).
 *
 *   npm run import:definitions                 import v1 as active
 *   npm run import:definitions -- --dry-run    validate everything, write nothing
 *   npm run import:definitions -- --stage      import inactive (staged, not published)
 *   npm run import:definitions -- --version=2  import as a new content version
 *   npm run import:definitions -- --json       machine-readable report on stdout
 *
 * Source of truth: backend/data/scenarios/v1/ (client content, verbatim).
 * Every validation runs over the whole dataset first: if anything is wrong, nothing is
 * written. Safe to run repeatedly - unchanged content is reported as `unchanged`.
 *
 * This script never touches the legacy `Scenario` collection.
 */
import { connectDatabase, disconnectDatabase } from '../src/config/database.js'
import {
  EXPECTED,
  importScenarioDefinitions,
} from '../src/services/scenarioDefinitionImportService.js'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const asJson = args.includes('--json')
const active = !args.includes('--stage')
const versionArg = args.find((a) => a.startsWith('--version='))
const version = versionArg ? Number(versionArg.split('=')[1]) : 1

if (!Number.isInteger(version) || version < 1) {
  console.error(`Invalid --version value: ${versionArg}`)
  process.exit(1)
}

function printReport(report) {
  console.log('\nScenario definition import')
  console.log('-'.repeat(58))
  console.log(`  source          ${report.source_document} v${report.source_document_version}`)
  console.log(`  content sha256  ${report.content_sha256}`)
  console.log(`  version         ${report.scenario_version}   active: ${active}`)
  console.log(`  taxonomies      family ${report.taxonomy_version} / trigger ${report.trigger_taxonomy_version}`)
  console.log(`  imported at     ${report.imported_at}`)
  console.log('-'.repeat(58))
  console.log(`  source records  ${report.total_source_records}`)
  console.log(`  inserted        ${report.inserted}`)
  console.log(`  updated         ${report.updated}`)
  console.log(`  unchanged       ${report.unchanged}`)
  console.log(`  rejected        ${report.rejected}`)
  console.log('-'.repeat(58))
  console.log(`  platform        ${JSON.stringify(report.platform_counts)}`)
  console.log(`  difficulty      ${JSON.stringify(report.level_counts)}`)
  console.log(`  disposition     ${JSON.stringify(report.disposition_counts)}`)
  console.log(`  military        ${report.military_scenarios}`)
  console.log(`  multi-trigger   ${report.multi_trigger_scenarios}`)
  console.log(`  families used   ${Object.keys(report.canonical_family_counts).length}`)
  console.log(`  triggers used   ${Object.keys(report.canonical_trigger_counts).length}`)
  console.log('-'.repeat(58))
  console.log(`  STATUS          ${report.status}`)
}

async function run() {
  await connectDatabase()
  const report = await importScenarioDefinitions({ version, active, dryRun })

  if (asJson) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    printReport(report)
    if (report.errors.length) {
      console.error(`\n${report.errors.length} problem(s). Nothing was written.\n`)
      for (const error of report.errors.slice(0, 40)) console.error(`  - ${error}`)
      if (report.errors.length > 40) console.error(`  ... and ${report.errors.length - 40} more`)
    } else if (dryRun) {
      console.log(`\nDry run OK: ${report.total_source_records} scenarios validated. Nothing written.`)
    } else {
      console.log(`\nStored at version ${version}: ${report.stored_at_version} / ${EXPECTED.total}`)
    }
  }

  await disconnectDatabase()
  process.exit(report.errors.length ? 1 : 0)
}

run().catch(async (error) => {
  console.error(error)
  await disconnectDatabase().catch(() => {})
  process.exit(1)
})
