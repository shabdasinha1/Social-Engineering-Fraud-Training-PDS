/**
 * MIGRATION-001 - read-only inventory of a MongoDB database.
 *
 *   node scripts/release/inventoryDatabase.js --db=cyber_awareness_training --out=deploy/x.json
 *   node scripts/release/inventoryDatabase.js --db=... --compare=deploy/baseline.json
 *
 * Options:
 *   --uri=<mongodb uri>   server to read (default mongodb://127.0.0.1:27017/?replicaSet=rs0)
 *   --db=<name>           database to inventory (required)
 *   --out=<file>          write the inventory JSON there
 *   --compare=<file>      compare against an earlier inventory; exit 1 on any difference
 *   --no-hashes           skip per-collection content hashes (faster, less proof)
 *
 * Issues reads only: listDatabases, listCollections, indexes, countDocuments, find and
 * aggregate. It never writes, creates an index or creates a collection, so it is safe to
 * point at the production database.
 */
import { writeFile, readFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import mongoose from 'mongoose'
import { inventoryDatabase } from './lib/inventory.js'

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, ...v] = a.replace(/^--/, '').split('=')
  return [k, v.length ? v.join('=') : true]
}))

const uri = args.uri || 'mongodb://127.0.0.1:27017/?replicaSet=rs0'
const dbName = args.db
if (!dbName) {
  console.error('--db=<name> is required')
  process.exit(2)
}

/** Every difference between two inventories that would mean the database changed. */
export function diffInventories(before, after) {
  const problems = []
  const b = before.collections
  const a = after.collections
  for (const name of new Set([...Object.keys(b), ...Object.keys(a)])) {
    if (!b[name]) { problems.push(`collection "${name}" appeared`); continue }
    if (!a[name]) { problems.push(`collection "${name}" disappeared`); continue }
    if (b[name].count !== a[name].count) problems.push(`${name}: count ${b[name].count} -> ${a[name].count}`)
    for (const field of ['sha256', 'ids_sha256']) {
      if (b[name][field] && a[name][field] && b[name][field] !== a[name][field]) {
        problems.push(`${name}: ${field} changed`)
      }
    }
    if (JSON.stringify(b[name].indexes) !== JSON.stringify(a[name].indexes)) problems.push(`${name}: indexes changed`)
    if (JSON.stringify(b[name].validator) !== JSON.stringify(a[name].validator)) problems.push(`${name}: validator changed`)
    if (JSON.stringify(b[name].newest) !== JSON.stringify(a[name].newest)) problems.push(`${name}: newest record changed`)
  }
  return problems
}

async function run() {
  const client = new mongoose.mongo.MongoClient(uri, { serverSelectionTimeoutMS: 5000 })
  await client.connect()
  try {
    const hello = await client.db('admin').command({ hello: 1 })
    const build = await client.db('admin').command({ buildInfo: 1 })
    const { databases } = await client.db('admin').command({ listDatabases: 1, nameOnly: true })

    const inventory = {
      captured_at: new Date().toISOString(),
      purpose: args.purpose || 'MIGRATION-001 read-only inventory',
      mongod_version: build.version,
      topology: hello.setName ? `replica set "${hello.setName}"` : 'standalone',
      server_database_count: databases.length,
      ...(await inventoryDatabase(client, dbName, { hashes: !args['no-hashes'] })),
    }

    if (args.out) {
      await mkdir(path.dirname(path.resolve(args.out)), { recursive: true })
      await writeFile(args.out, `${JSON.stringify(inventory, null, 2)}\n`)
      console.log(`Inventory of "${dbName}" written to ${args.out}`)
    }

    const summary = Object.fromEntries(Object.entries(inventory.collections).map(([n, c]) => [n, c.count]))
    console.log(JSON.stringify({ database: dbName, collections: summary }, null, 1))

    if (args.compare) {
      const before = JSON.parse(await readFile(args.compare, 'utf8'))
      const problems = diffInventories(before, inventory)
      if (problems.length) {
        console.error(`\nFAIL - "${dbName}" differs from ${args.compare}:`)
        for (const p of problems) console.error(`  - ${p}`)
        process.exitCode = 1
      } else {
        console.log(`\nPASS - "${dbName}" is identical to ${args.compare} (counts, ids, content hashes, indexes, validators, newest records).`)
      }
    }
  } finally {
    await client.close()
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
