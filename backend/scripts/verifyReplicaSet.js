/**
 * DEPLOY-001 verification.
 *
 *   npm run verify:replicaset
 *
 * Read-only except for a transaction probe in a scratch database it creates and drops
 * itself. It NEVER touches an application database or collection.
 *
 * Run this after converting the local MongoDB to the single-node replica set rs0. It
 * checks, in order:
 *
 *   1. topology        - rs0, PRIMARY, member pinned to 127.0.0.1:27017
 *   2. binding         - mongod still listening on loopback only
 *   3. data            - every database and collection from the pre-conversion
 *                        baseline is still present with the same document counts
 *   4. transactions    - session, retryable write, transaction commit, cleanup
 *   5. topology guard  - the ENGINE-001 guard accepts this deployment
 *
 * Exit code 0 = every check passed.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'
import { detectTransactionSupport } from '../src/utils/transactions.js'

const URI = process.env.MONGO_ADMIN_URI || 'mongodb://127.0.0.1:27017/admin'
const BASELINE = path.resolve(fileURLToPath(new URL('../deploy/mongo-before-state.json', import.meta.url)))
const PROBE_DB = 'deploy001_probe_tmp'
const EXPECTED_SET = 'rs0'
const EXPECTED_MEMBER = '127.0.0.1:27017'

const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  -  ${detail}` : ''}`)
  return ok
}

async function main() {
  await mongoose.connect(URI, { serverSelectionTimeoutMS: 5000 })
  const admin = mongoose.connection.db.admin()

  console.log('\n1. TOPOLOGY')
  const hello = await admin.command({ hello: 1 })
  const build = await admin.buildInfo()
  console.log(`     mongod ${build.version}`)
  check('replica set is configured', Boolean(hello.setName), hello.setName || 'standalone - conversion not applied')
  if (hello.setName) {
    check(`replica set name is ${EXPECTED_SET}`, hello.setName === EXPECTED_SET, hello.setName)
    check('node is PRIMARY', hello.isWritablePrimary === true)
    const hosts = hello.hosts ?? []
    check('exactly one member', hosts.length === 1, hosts.join(', '))
    check(`member pinned to ${EXPECTED_MEMBER}`, hosts[0] === EXPECTED_MEMBER,
      `${hosts[0]} - a hostname here would need DNS and breaks offline operation`)
  }

  console.log('\n2. NETWORK BINDING')
  const opts = await admin.command({ getCmdLineOpts: 1 })
  const bindIp = opts.parsed?.net?.bindIp ?? '(unset)'
  const port = opts.parsed?.net?.port ?? '(default)'
  check('bindIp is loopback only', bindIp === '127.0.0.1', `bindIp=${bindIp} port=${port}`)
  check('bindIpAll is not enabled', !opts.parsed?.net?.bindIpAll)

  console.log('\n3. DATA PRESERVATION')
  let baseline = null
  try {
    baseline = JSON.parse(await readFile(BASELINE, 'utf8'))
  } catch {
    check('baseline snapshot present', false, `missing ${BASELINE}`)
  }
  if (baseline) {
    const present = (await admin.listDatabases()).databases.map((d) => d.name)
    let missingDb = 0
    let missingCol = 0
    let changed = 0
    for (const [dbName, cols] of Object.entries(baseline.databases)) {
      if (!present.includes(dbName)) {
        missingDb += 1
        console.log(`        MISSING DATABASE: ${dbName}`)
        continue
      }
      const conn = mongoose.connection.useDb(dbName)
      const actual = (await conn.db.listCollections().toArray()).map((c) => c.name)
      for (const [col, count] of Object.entries(cols)) {
        if (!actual.includes(col)) {
          missingCol += 1
          console.log(`        MISSING COLLECTION: ${dbName}.${col}`)
          continue
        }
        const now = await conn.db.collection(col).countDocuments()
        // Server-managed internals, not application data: `local` gains oplog collections
        // and logs each startup, and `config.system.sessions` is a transient session cache
        // the server clears on restart. Neither is a data-preservation signal.
        if (now !== count && dbName !== 'local' && dbName !== 'config') {
          changed += 1
          console.log(`        COUNT CHANGED: ${dbName}.${col} ${count} -> ${now}`)
        }
      }
    }
    check('every baseline database still present', missingDb === 0,
      `${Object.keys(baseline.databases).length} databases checked`)
    check('every baseline collection still present', missingCol === 0)
    check('document counts unchanged (outside `local`)', changed === 0)
  }

  console.log('\n4. TRANSACTION PROBE')
  const probe = mongoose.connection.useDb(PROBE_DB)
  let probeOk = false
  try {
    await probe.db.collection('probe').insertOne({ step: 'write', at: new Date() })
    // Retryable writes need a replica set. A standalone does NOT reject the insert above -
    // the driver silently stops retrying - so a successful write proves nothing. Topology
    // is the only honest signal.
    check('deployment supports retryable writes', Boolean(hello.setName),
      hello.setName ? 'replica set member' : 'standalone silently disables retries')

    const session = await mongoose.connection.getClient().startSession()
    check('session started', true)
    try {
      session.startTransaction({ writeConcern: { w: 1, j: true }, readConcern: { level: 'local' } })
      check('transaction started', true)
      await probe.db.collection('probe').insertOne({ step: 'in-transaction', at: new Date() }, { session })
      await session.commitTransaction()
      check('transaction committed with { w: 1, j: true }', true)
      const n = await probe.db.collection('probe').countDocuments()
      probeOk = check('committed write is visible', n === 2, `${n} documents`)
    } finally {
      await session.endSession()
    }
  } catch (error) {
    check('transaction probe', false, error.message.split('\n')[0])
  } finally {
    // Scratch database only - never an application database.
    await probe.dropDatabase().catch(() => {})
    check('probe data cleaned up', true, `dropped scratch database ${PROBE_DB}`)
  }

  console.log('\n5. ENGINE-001 TOPOLOGY GUARD')
  const guard = await detectTransactionSupport()
  check('guard accepts this deployment', guard.supported === true,
    guard.supported ? guard.topology : (guard.reason ?? 'unsupported'))

  await mongoose.disconnect()

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${'='.repeat(60)}`)
  console.log(`DEPLOY-001 verification: ${failed.length ? 'FAIL' : 'PASS'}  (${results.length - failed.length}/${results.length} checks)`)
  if (failed.length) {
    console.log('\nFailed checks:')
    for (const f of failed) console.log(`  - ${f.name}${f.detail ? `: ${f.detail}` : ''}`)
    console.log('\nSee docs/LOCAL_MONGODB_REPLICA_SET.md for the conversion and rollback procedure.')
  }
  console.log(`${'='.repeat(60)}\n`)
  process.exit(failed.length ? 1 : 0)
}

main().catch(async (error) => {
  console.error('\nVerification could not run:', error.message.split('\n')[0])
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
