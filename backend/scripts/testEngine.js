/**
 * Runs the ENGINE-001 and SELECT-002 transaction integration tests against a throwaway
 * single-node replica set.
 *
 *   npm run test:engine
 *
 * Those tests need real MongoDB transaction semantics, which a standalone `mongod` cannot
 * provide. Rather than mocking them - or asking a developer to convert the machine's
 * MongoDB service, which would affect every other database on it - this starts a
 * SEPARATE mongod on port 27018 with its own data directory, runs the suite, and stops it
 * again. The local MongoDB service on 27017 is never touched.
 *
 * Set ENGINE_TEST_MONGO_URI to point the suite at an existing replica set instead.
 */
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import mongoose from 'mongoose'

const PORT = Number(process.env.ENGINE_TEST_PORT || 27018)
const REPL_SET = 'rsEngineTest'

/** Each suite gets its own database: they both seed and wipe ScenarioDefinition. */
const SUITES = [
  { file: 'tests/scenarioEngineTransaction.test.js', db: 'engine_test' },
  { file: 'tests/attemptCreation.test.js', db: 'select_test' },
  { file: 'tests/attemptApi.test.js', db: 'api_test' },
  { file: 'tests/attemptResultApi.test.js', db: 'result_test' },
  { file: 'tests/auditLogApi.test.js', db: 'audit_test' },
  { file: 'tests/scenarioManagerApi.test.js', db: 'manager_test' },
  { file: 'tests/attemptViewerApi.test.js', db: 'viewer_test' },
  { file: 'tests/exportApi.test.js', db: 'export_test' },
  { file: 'tests/instructorControlsApi.test.js', db: 'controls_test' },
  { file: 'tests/candidateProfileApi.test.js', db: 'profile_test' },
  { file: 'tests/progressApi.test.js', db: 'progress_test' },
  { file: 'tests/attemptTimer.test.js', db: 'timer_test' },
  { file: 'tests/adminCompletionApi.test.js', db: 'adm007_test' },
  { file: 'tests/adminDashboardApi.test.js', db: 'dashboard_test' },
  { file: 'tests/demoAssessmentApi.test.js', db: 'demo_test' },
  // DB-backed suites that skip without ENGINE_TEST_MONGO_URI and were not listed here, so
  // `npm run test:engine` never ran them (release audit, 26 Sep 2026).
  { file: 'tests/learnerActionApi.test.js', db: 'learner_action_test' },
  { file: 'tests/emailE16E20Engine.test.js', db: 'email_e16_test' },
  { file: 'tests/emailE21E25Engine.test.js', db: 'email_e21_test' },
  { file: 'tests/smsS01S05Engine.test.js', db: 'sms_s01_test' },
  { file: 'tests/smsS06S10Engine.test.js', db: 'sms_s06_test' },
  { file: 'tests/smsS11S15Engine.test.js', db: 'sms_s11_test' },
  { file: 'tests/smsS16S20Engine.test.js', db: 'sms_s16_test' },
  { file: 'tests/smsS21S25Engine.test.js', db: 'sms_s21_test' },
  // Production audit (30 Sep 2026): regressions for the 500s found by the live attack run.
  { file: 'tests/productionAuditApi.test.js', db: 'prod_audit_test' },
  // Admin -> Settings: configurable assessment duration, snapshotted per attempt.
  { file: 'tests/assessmentDurationApi.test.js', db: 'duration_test' },
]

const MONGOD_CANDIDATES = [
  process.env.MONGOD_PATH,
  'C:/Program Files/MongoDB/Server/8.3/bin/mongod.exe',
  'C:/Program Files/MongoDB/Server/8.0/bin/mongod.exe',
  'mongod',
].filter(Boolean)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitForPrimary(timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const c = await mongoose
        .createConnection(`mongodb://127.0.0.1:${PORT}/?directConnection=true`, {
          serverSelectionTimeoutMS: 1000,
        })
        .asPromise()
      try {
        await c.db.admin().command({
          replSetInitiate: { _id: REPL_SET, members: [{ _id: 0, host: `127.0.0.1:${PORT}` }] },
        })
      } catch {
        // already initiated
      }
      const hello = await c.db.admin().command({ hello: 1 })
      await c.close()
      if (hello.isWritablePrimary && hello.setName === REPL_SET) return true
    } catch {
      // not up yet
    }
    await sleep(500)
  }
  return false
}

async function run() {
  if (process.env.ENGINE_TEST_MONGO_URI) {
    let code = 0
    for (const suite of SUITES) {
      code = (await spawnTests(process.env.ENGINE_TEST_MONGO_URI, suite.file)) || code
    }
    process.exit(code)
  }

  const dbPath = await mkdtemp(path.join(tmpdir(), 'engine-rs-'))
  let mongod = null

  for (const bin of MONGOD_CANDIDATES) {
    try {
      mongod = spawn(bin, [
        '--port', String(PORT),
        '--dbpath', dbPath,
        '--replSet', REPL_SET,
        '--bind_ip', '127.0.0.1',
      ], { stdio: 'ignore' })
      await sleep(800)
      if (mongod.exitCode === null) break
      mongod = null
    } catch {
      mongod = null
    }
  }

  if (!mongod) {
    console.error('Could not start mongod for the engine integration tests.')
    console.error('Set MONGOD_PATH, or ENGINE_TEST_MONGO_URI to an existing replica set.')
    process.exit(1)
  }

  const cleanup = async () => {
    mongod.kill()
    await sleep(500)
    await rm(dbPath, { recursive: true, force: true }).catch(() => {})
  }

  try {
    if (!await waitForPrimary()) {
      console.error(`Replica set ${REPL_SET} did not reach PRIMARY on port ${PORT}.`)
      await cleanup()
      process.exit(1)
    }
    console.log(`Temporary replica set ${REPL_SET} ready on 127.0.0.1:${PORT}`)
    // Sequential, each suite in its OWN database. `node --test` runs files concurrently,
    // and both suites seed and wipe ScenarioDefinition - sharing one database made them
    // race and hang.
    let code = 0
    for (const suite of SUITES) {
      const uri = `mongodb://127.0.0.1:${PORT}/${suite.db}?replicaSet=${REPL_SET}`
      console.log(`
--- ${suite.file} ---`)
      code = (await spawnTests(uri, suite.file)) || code
    }
    await cleanup()
    process.exit(code)
  } catch (error) {
    console.error(error)
    await cleanup()
    process.exit(1)
  }
}

function spawnTests(uri, file) {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ['--test', file],
      { stdio: 'inherit', env: { ...process.env, ENGINE_TEST_MONGO_URI: uri } },
    )
    child.on('exit', (code) => resolve(code ?? 1))
  })
}

run()
