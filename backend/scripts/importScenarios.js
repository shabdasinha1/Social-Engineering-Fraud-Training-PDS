/**
 * Scenario import.
 *
 *   npm run import:scenarios -- <file>            import (upsert by scenarioCode)
 *   npm run import:scenarios -- <file> --dry-run  validate only, write nothing
 *
 * Defaults to data/scenarios.sample.json. Validation runs over the whole file
 * first: if anything is wrong, nothing is written.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { connectDatabase, disconnectDatabase } from '../src/config/database.js'
import { getPoolSummary, importScenarios } from '../src/services/scenarioImportService.js'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const file = args.find((arg) => !arg.startsWith('--')) ?? 'data/scenarios.sample.json'

async function run() {
  const absolute = path.resolve(process.cwd(), file)

  let entries
  try {
    entries = JSON.parse(await readFile(absolute, 'utf8'))
  } catch (error) {
    console.error(`Could not read ${absolute}`)
    console.error(`  ${error.message}`)
    process.exit(1)
  }

  await connectDatabase()

  const result = await importScenarios(entries, { dryRun })

  if (!result.ok) {
    console.error(`\nImport rejected - ${result.errors.length} problem(s). Nothing was written.\n`)
    for (const error of result.errors) console.error(`  - ${error}`)
    await disconnectDatabase()
    process.exit(1)
  }

  if (dryRun) {
    console.log(`\nDry run: ${entries.length} scenario(s) validated. Nothing was written.`)
  } else {
    console.log(`\nImported ${file}: ${result.created} created, ${result.updated} updated.`)
    console.table(await getPoolSummary().then((summary) => summary.byChannel))
  }

  await disconnectDatabase()
}

run().catch(async (error) => {
  console.error(error)
  await disconnectDatabase().catch(() => {})
  process.exit(1)
})
