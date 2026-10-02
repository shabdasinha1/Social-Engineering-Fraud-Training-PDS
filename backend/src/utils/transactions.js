import mongoose from 'mongoose'

/**
 * Transaction support for the authoritative engine (ENGINE-001 / ALIGN-005c).
 *
 * PROJECT_MASTER_PLAN.md 15.25 requires the event insert and the ScenarioRun update to
 * commit atomically, which needs a replica set. A standalone `mongod` supports neither
 * multi-document transactions nor retryable writes.
 *
 * The engine therefore refuses to run rather than silently degrading to non-atomic
 * writes. A half-written run would corrupt the ledger the score is reproduced from, and
 * that failure would be invisible until an audit.
 */

/** Write concern for every authoritative commit. `j: true` survives power loss. */
export const ENGINE_WRITE_CONCERN = { w: 1, j: true }

/** Bounded. An unbounded retry turns a stuck primary into a hung request. */
export const MAX_TRANSACTION_ATTEMPTS = 3
const BASE_BACKOFF_MS = 25

export class TransactionUnavailableError extends Error {
  constructor(message) {
    super(message)
    this.name = 'TransactionUnavailableError'
    this.code = 'TRANSACTION_UNAVAILABLE'
  }
}

/**
 * Is this connection attached to a topology that supports transactions?
 *
 * A single-node replica set qualifies; a standalone does not. Determined from the live
 * server rather than from configuration, so a mis-set connection string is caught.
 */
export async function detectTransactionSupport(connection = mongoose.connection) {
  if (!connection?.db || connection.readyState !== 1) {
    return { supported: false, reason: 'no active database connection' }
  }
  try {
    const hello = await connection.db.admin().command({ hello: 1 })
    if (hello.setName) return { supported: true, topology: `replica set "${hello.setName}"` }
    if (hello.msg === 'isdbgrid') return { supported: true, topology: 'sharded cluster' }
    return {
      supported: false,
      topology: 'standalone',
      reason:
        'MongoDB is running standalone, which supports neither multi-document ' +
        'transactions nor retryable writes.',
    }
  } catch (error) {
    return { supported: false, reason: `topology probe failed: ${error.message}` }
  }
}

/**
 * Startup guard. Throws unless the connection can commit transactions.
 *
 * Deliberately actionable: an operator seeing this needs the two commands that fix it,
 * not a stack trace. Conversion is a documented one-time install step (15.25).
 */
export async function assertTransactionSupport(connection = mongoose.connection) {
  const result = await detectTransactionSupport(connection)
  if (result.supported) return result

  throw new TransactionUnavailableError(
    `The scenario engine requires MongoDB transactions, but ${result.reason}\n` +
    '\n' +
    'The engine will not fall back to non-atomic writes: a half-written run would\n' +
    'corrupt the event ledger the score is reproduced from.\n' +
    '\n' +
    'To fix, convert the local instance to a single-node replica set (one-time):\n' +
    '  1. add to mongod.cfg:   replication:\n' +
    '                            replSetName: rs0\n' +
    '                            oplogSizeMB: 512\n' +
    '  2. restart the MongoDB service\n' +
    '  3. run once:  rs.initiate({_id:"rs0",members:[{_id:0,host:"127.0.0.1:27017"}]})\n' +
    '     (pin the member to 127.0.0.1 - a bare rs.initiate() uses the hostname and\n' +
    '      triggers DNS, which breaks the offline requirement)\n' +
    '  4. add ?replicaSet=rs0 to MONGO_URI\n' +
    '\n' +
    'See docs/DEPLOYMENT_AND_TRANSACTION_STRATEGY.md.',
  )
}

/** Errors MongoDB itself marks as safe to retry. */
function isTransient(error) {
  const labels = error?.errorLabels ?? []
  return labels.includes('TransientTransactionError') || labels.includes('UnknownTransactionCommitResult')
}

/**
 * Runs `work` inside a transaction, retrying only genuinely transient failures.
 *
 * A domain rejection - invalid transition, stale state, duplicate intent - is a decision,
 * not a fault. Retrying it would just repeat the same answer more slowly, so anything
 * carrying `.isDomainError` aborts immediately.
 *
 * `maxAttempts` is still bounded; a caller that deliberately serialises on one document
 * (attempt creation) passes a few more so a burst of concurrent requests outlasts the one
 * that is committing instead of failing while it does.
 */
export async function withEngineTransaction(
  work, { connection = mongoose.connection, maxAttempts = MAX_TRANSACTION_ATTEMPTS } = {},
) {
  const session = await connection.startSession()
  try {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        session.startTransaction({ writeConcern: ENGINE_WRITE_CONCERN, readConcern: { level: 'local' } })
        const result = await work(session)
        await session.commitTransaction()
        return { result, attempts: attempt }
      } catch (error) {
        await session.abortTransaction().catch(() => {})
        if (error?.isDomainError || !isTransient(error) || attempt === maxAttempts) {
          throw error
        }
        await new Promise((resolve) => setTimeout(resolve, BASE_BACKOFF_MS * 2 ** (attempt - 1)))
      }
    }
    throw new Error('unreachable: transaction retry loop exhausted')
  } finally {
    await session.endSession()
  }
}

/** True when a write failed because a unique index rejected it. */
export function isDuplicateKeyError(error) {
  return error?.code === 11000
}

/** Which unique index rejected the write - so idempotency is not confused with a bug. */
export function duplicateKeyFields(error) {
  return Object.keys(error?.keyPattern ?? {})
}
