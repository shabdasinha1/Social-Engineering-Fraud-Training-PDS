# Database Backup Manifest — PC-MIGRATION-001

This file lists what is in the portable backup of the release database, made on the laptop
for the move to the PC. **It contains no secrets.**

## 1. Backup identity

| Field | Value |
|---|---|
| Backup date/time | 2026-09-23 14:32:20 IST (+05:30) = 2026-09-23 09:02:20 UTC |
| Source machine | Laptop (Windows 11, x64) |
| Database name | `cyber_awareness_training_release` |
| MongoDB host | `127.0.0.1:27017` |
| Replica set | `rs0` (single member `127.0.0.1:27017`, PRIMARY) |
| MongoDB Server version | 8.3.8 (featureCompatibilityVersion 8.3) |
| MongoDB Database Tools version | mongodump / mongorestore 100.18.0 |
| mongosh version | 2.10.0 |
| Backup method | Official `mongodump`, one database, BSON **archive** format, gzip-compressed |
| Backup file | `migration-backup/database/cyber_awareness_training_release.archive` |
| Checksum file | `migration-backup/database/cyber_awareness_training_release.archive.sha256` |
| Backup size | 111,748 bytes (≈109 KB, gzip-compressed) |
| SHA-256 | `534e632ace1be304837a24353fe4669dd4ff7aee3e242ceb8be42e8b6179221b` |

> **Important:** the file is named `.archive`, but it is **gzip-compressed**. Every
> `mongorestore` of this file must include `--gzip`.

Command used (read-only against the source):

```powershell
mongodump --uri="mongodb://127.0.0.1:27017/?replicaSet=rs0" `
  --db=cyber_awareness_training_release `
  --archive="migration-backup\database\cyber_awareness_training_release.archive" `
  --gzip
```

## 2. Collection inventory at backup time

Every collection in the database was dumped. No collection was left out and no filter was used.

| # | Collection | Documents | Indexes |
|---|---|---:|---:|
| 1 | `adminusers` | 1 | 2 |
| 2 | `assessments` | 0 | 4 |
| 3 | `attempts` | 3 | 6 |
| 4 | `auditevents` | 0 | 8 |
| 5 | `candidates` | 2 | 3 |
| 6 | `configurations` | 1 | 2 |
| 7 | `progresssnapshots` | 2 | 2 |
| 8 | `scenariodefinitions` | 100 | 7 |
| 9 | `scenarioevents` | 129 | 3 |
| 10 | `scenarioruns` | 30 | 5 |
| 11 | `scenarios` | 0 | 3 |
| | **Total: 11 collections** | **268** | **45** |

There are no views. The database's data size was 1,042,250 bytes before compression.

What the data covers: 100 ScenarioDefinition records, the demo learner(s), their attempts,
scenario runs and events, progress snapshots, the demo Admin account, and the configuration
document. `auditevents`, `assessments` and `scenarios` are empty at backup time. Their indexes
are kept, so restoring them brings back empty collections that already have their indexes.

## 3. Verification performed (on the laptop)

| Check | Result |
|---|---|
| Archive file exists | Yes |
| Archive size is non-zero | Yes, 111,748 bytes |
| Archive lists with official tools | `mongorestore --archive … --gzip --dryRun -v` read the prelude for all 11 namespaces and found bson data and metadata for each. The dry run completed and restored 0 documents, as expected, because it does not import anything. |
| Documents in the archive counted independently | The gzip archive was decoded and parsed record by record. It holds 268 documents and 45 index definitions, and the count for each collection matches the table above. Output: `verification/archive-contents.json` |
| Source counts before the dump | Recorded in `verification/source-db-inventory-at-backup.json` |
| Source counts after the dump | Recorded in `verification/source-db-inventory-after-backup.json`. They are **identical** to the counts before the dump. |
| SHA-256 calculated | Yes (above, and in the `.sha256` file) |
| Application servers running during the dump | None. Nothing was listening on 5000, 5055, 5173 or 5199, so the database was idle and the snapshot is consistent. |

**The source database was not modified.** Only read operations touched it: `mongodump`,
`countDocuments`, `getIndexes`, `dbStats`, `rs.status`, and a `mongorestore --dryRun` that
writes nothing. The backup was **not** restored on the laptop, and no other database was
created.

## 4. Restore instructions (run on the PC, not on the laptop)

Prerequisites: MongoDB 8.3.x is running on the PC as replica set `rs0` at `127.0.0.1:27017`.
See `PC_MIGRATION_README.md` §C.

```powershell
cd "<project root on the PC>"

# 1. Check the file survived the copy. The hash must equal the SHA-256 above.
(Get-FileHash migration-backup\database\cyber_awareness_training_release.archive -Algorithm SHA256).Hash.ToLower()

# 2. Make sure the target database does NOT already exist. Expected: nothing printed.
mongosh "mongodb://127.0.0.1:27017/?replicaSet=rs0" --quiet --eval "db.adminCommand({listDatabases:1,nameOnly:true}).databases.map(x=>x.name).filter(n=>n.startsWith('cyber_awareness_training_release'))"

# 3. Restore. Note --gzip. There is deliberately no --drop.
mongorestore --uri="mongodb://127.0.0.1:27017/?replicaSet=rs0" `
  --archive="migration-backup\database\cyber_awareness_training_release.archive" `
  --gzip `
  --nsInclude="cyber_awareness_training_release.*"

# 4. Verify (read-only). Expected last line: RESULT: PASS
mongosh "mongodb://127.0.0.1:27017/?replicaSet=rs0" --quiet --file migration-backup\verification\verify-release-db.js
```

At the end of step 3, mongorestore should report **268 document(s) restored successfully. 0
document(s) failed to restore.**

If step 2 shows that the database already exists, **stop**. Do not add `--drop`, and do not
restore on top of it. Find out why it is there first.

## 5. Not to be confused with

`backend/deploy/migration-001/cyber_awareness_training_release.archive.gz` is an **older**
build artifact from MIGRATION-001, dated 2026-09-22 20:29. It contains only the 100
ScenarioDefinition records. It has no Admin account, no candidates, no attempts, no runs, no
events and no configuration. **Do not restore it on the PC.** The authoritative backup is the
one in this folder.
