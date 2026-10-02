import { createHash } from 'node:crypto'
import mongoose from 'mongoose'

/**
 * MIGRATION-001 - read-only database inventory and fingerprinting.
 *
 * Every function here only reads. Used three ways: the pre-migration baseline of the
 * existing production database, the post-migration comparison that proves it was not
 * touched, and the release manifest's figures for the new release database.
 */

const { EJSON } = mongoose.mongo.BSON

/** Canonical EJSON, so a hash depends on stored values and types, not on driver formatting. */
const canonical = (doc) => EJSON.stringify(doc, { relaxed: false })

/**
 * sha256 over every document of a collection in `_id` order.
 *
 * `_id` order is stable for ObjectId and string keys alike, so two reads of an unchanged
 * collection always hash identically, and any insert, update or delete changes the digest.
 */
export async function collectionFingerprint(db, name) {
  const hash = createHash('sha256')
  let count = 0
  const cursor = db.collection(name).find({}, { sort: { _id: 1 } })
  for await (const doc of cursor) {
    hash.update(canonical(doc))
    hash.update('\n')
    count += 1
  }
  return { count, sha256: hash.digest('hex') }
}

/** sha256 over the sorted `_id` list alone - the "IDs unchanged" check. */
export async function idFingerprint(db, name) {
  const ids = await db.collection(name).find({}, { projection: { _id: 1 }, sort: { _id: 1 } })
    .map((d) => canonical(d._id)).toArray()
  return createHash('sha256').update(ids.join('\n')).digest('hex')
}

/** The newest document by `_id` (ObjectId order is insertion order), as id + digest. */
export async function newestRecord(db, name) {
  const [doc] = await db.collection(name).find({}).sort({ _id: -1 }).limit(1).toArray()
  if (!doc) return null
  return {
    _id: canonical(doc._id),
    updatedAt: doc.updatedAt ?? doc.occurred_at ?? doc.createdAt ?? null,
    sha256: createHash('sha256').update(canonical(doc)).digest('hex'),
  }
}

/** Index definitions reduced to the parts that matter, sorted by name. */
export async function indexSummary(db, name) {
  const indexes = await db.collection(name).indexes()
  return indexes
    .map((ix) => ({
      name: ix.name,
      key: ix.key,
      ...(ix.unique ? { unique: true } : {}),
      ...(ix.sparse ? { sparse: true } : {}),
      ...(ix.partialFilterExpression ? { partialFilterExpression: ix.partialFilterExpression } : {}),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

const tally = (rows) => Object.fromEntries(rows.map((r) => [String(r._id), r.n])
  .sort(([a], [b]) => a.localeCompare(b)))

const groupCount = (coll, filter, key) => coll.aggregate([
  { $match: filter },
  { $unwind: { path: `$${key}`, preserveNullAndEmptyArrays: true } },
  { $group: { _id: `$${key}`, n: { $sum: 1 } } },
]).toArray().then(tally)

const crossCount = (coll, filter, a, b) => coll.aggregate([
  { $match: filter },
  { $group: { _id: { a: `$${a}`, b: `$${b}` }, n: { $sum: 1 } } },
]).toArray().then((rows) => {
  const out = {}
  for (const r of rows) {
    out[r._id.a] ??= {}
    out[r._id.a][r._id.b] = r.n
  }
  return out
})

/** ScenarioDefinition distributions, over active documents unless told otherwise. */
export async function definitionDistribution(db, filter = { active: true }) {
  const coll = db.collection('scenariodefinitions')
  const docs = await coll.find(filter, { projection: { scenario_id: 1, version: 1 } }).toArray()
  return {
    documents: docs.length,
    scenario_ids: [...new Set(docs.map((d) => d.scenario_id))].sort(),
    versions: await groupCount(coll, filter, 'version'),
    platform: await groupCount(coll, filter, 'platform'),
    disposition: await groupCount(coll, filter, 'disposition'),
    level: await groupCount(coll, filter, 'level'),
    canonical_family: await groupCount(coll, filter, 'canonical_family'),
    canonical_triggers: await groupCount(coll, filter, 'canonical_triggers'),
    military_flag: await groupCount(coll, filter, 'military_flag'),
    lifecycle_state: await groupCount(coll, filter, 'lifecycle_state'),
    taxonomy_version: await groupCount(coll, filter, 'taxonomy_version'),
    trigger_taxonomy_version: await groupCount(coll, filter, 'trigger_taxonomy_version'),
    platform_x_disposition: await crossCount(coll, filter, 'platform', 'disposition'),
    platform_x_level: await crossCount(coll, filter, 'platform', 'level'),
    level_x_disposition: await crossCount(coll, filter, 'level', 'disposition'),
  }
}

/** Everything about one database, read-only. */
export async function inventoryDatabase(client, dbName, { hashes = true } = {}) {
  const db = client.db(dbName)
  const infos = await db.listCollections({}, { nameOnly: false }).toArray()
  const collections = {}
  for (const info of infos.sort((a, b) => a.name.localeCompare(b.name))) {
    if (info.type === 'view') continue
    const name = info.name
    const entry = {
      count: await db.collection(name).countDocuments(),
      indexes: await indexSummary(db, name),
      validator: info.options?.validator ?? null,
      newest: await newestRecord(db, name),
    }
    if (hashes) {
      entry.sha256 = (await collectionFingerprint(db, name)).sha256
      entry.ids_sha256 = await idFingerprint(db, name)
    }
    collections[name] = entry
  }

  const names = Object.keys(collections)
  const out = { database: dbName, collections }

  if (names.includes('scenariodefinitions')) {
    const coll = db.collection('scenariodefinitions')
    out.scenario_definitions = {
      total: await coll.countDocuments(),
      active: await coll.countDocuments({ active: true }),
      inactive: await coll.countDocuments({ active: { $ne: true } }),
      active_distribution: await definitionDistribution(db, { active: true }),
    }
  }
  if (names.includes('scenarios')) {
    const coll = db.collection('scenarios')
    out.legacy_scenarios = {
      total: await coll.countDocuments(),
      active: await coll.countDocuments({ isActive: true }),
      inactive: await coll.countDocuments({ isActive: { $ne: true } }),
      channel: await groupCount(coll, {}, 'channel'),
      type: await groupCount(coll, {}, 'type'),
      channel_x_type: await crossCount(coll, {}, 'channel', 'type'),
    }
  }
  return out
}
