# Local MongoDB Single-Node Replica Set (DEPLOY-001)

**Status:** Application side complete. **The MongoDB service conversion is outstanding and requires an elevated (Administrator) session** — see §5.
**Verification:** `npm run verify:replicaset` (from `backend/`)
**Companions:** [`DEPLOYMENT_AND_TRANSACTION_STRATEGY.md`](DEPLOYMENT_AND_TRANSACTION_STRATEGY.md) · [`SCENARIO_ENGINE.md`](SCENARIO_ENGINE.md)

---

## 1. Approved topology

```
Single offline Windows machine
├── Electron shell (later phase)
├── Node API      127.0.0.1:5000     ← loopback only
└── mongod        127.0.0.1:27017    ← loopback only, single-node replica set "rs0"
```

Nothing listens on a routable interface. No cloud, no Atlas, no Docker, no second node.

## 2. Why a replica set is required

`ENGINE-001` commits an `Event` insert and a `ScenarioRun` update **atomically**, because a
half-written run would corrupt the ledger the score is reproduced from. That needs a
multi-document transaction, and MongoDB provides transactions and retryable writes **only
on a replica set** — a standalone `mongod` supports neither.

The engine contains a topology guard that **refuses to run** on a standalone rather than
silently degrading to non-atomic writes. Until this conversion is applied, the engine
returns `TRANSACTION_UNAVAILABLE` outside its own test harness.

> ### This is not high availability
>
> A single-node replica set has **no redundancy**. Disk failure or `dbPath` corruption
> loses the data exactly as it would on a standalone — this change neither improves nor
> worsens that (risk **R10**). Its only purposes are transaction support and offline local
> operation. Mitigation is the cold backup in §9.

## 3. Observed environment

Captured before any change:

| Property | Value |
|---|---|
| mongod version | 8.3.7 |
| Service | `MongoDB Server (MongoDB)`, Running, Automatic |
| Service command | `mongod.exe --config "<install>\bin\mongod.cfg" --service` |
| `storage.dbPath` | `<install>\data` |
| `systemLog` | file, `logAppend: true`, `<install>\log\mongod.log` |
| `net.bindIp` | `127.0.0.1` — already loopback only |
| `net.port` | `27017` |
| `replication` | **absent** — standalone |
| `security` | not configured |
| Storage engine | WiredTiger, persistent |

> ### ⚠ This instance is shared with other projects
>
> The same `mongod` hosts several unrelated application databases besides
> `cyber_awareness_training`. **Converting to a replica set changes the topology for all of
> them.** The change is non-destructive and those applications continue to work unmodified
> — a single-node replica set accepts the same connections and operations — but it is a
> shared-instance change and should be made knowingly.
>
> The pre-conversion inventory is recorded in `backend/deploy/mongo-before-state.json` and
> is what `npm run verify:replicaset` compares against afterwards.

## 4. The configuration change

Exactly one stanza is added to `mongod.cfg`. Everything else — `dbPath`, `systemLog`,
`port`, `bindIp`, WiredTiger settings and the service registration — is left untouched.

```yaml
replication:
  replSetName: rs0
  oplogSizeMB: 512
```

`oplogSizeMB` is capped deliberately: the default oplog takes roughly 5% of free disk,
which is wasteful on a training machine.

The file already contains a commented `#replication:` placeholder; replace that line.

## 5. Conversion procedure (requires Administrator)

`mongod.cfg` lives under `C:\Program Files\`, so editing it and restarting the service both
need an elevated session. Open **PowerShell as Administrator** and run these in order.

**Step 1 — back up the config and the data.**

```powershell
$mongo = "C:\Program Files\MongoDB\Server\8.3"
Copy-Item "$mongo\bin\mongod.cfg" "$mongo\bin\mongod.cfg.pre-rs0.bak"
Stop-Service MongoDB
Copy-Item "$mongo\data" "$env:USERPROFILE\mongo-backup-pre-rs0" -Recurse
```

The data copy is taken **with the service stopped** — copying a live `dbPath` produces an
inconsistent snapshot.

**Step 2 — add the replication stanza.**

```powershell
$cfg = "$mongo\bin\mongod.cfg"
(Get-Content $cfg) -replace '^#replication:', "replication:`n  replSetName: rs0`n  oplogSizeMB: 512" |
  Set-Content $cfg -Encoding utf8
Get-Content $cfg | Select-String -Pattern 'replication|replSetName|oplogSizeMB' -Context 0,1
```

**Step 3 — start the service and confirm it came up.**

```powershell
Start-Service MongoDB
Get-Service MongoDB
Get-Content "$mongo\log\mongod.log" -Tail 15
```

If the service does not start, go to §10 and then §11.

**Step 4 — initiate the replica set, once.**

```powershell
& "$mongo\bin\mongosh.exe" --host 127.0.0.1 --port 27017 --eval `
  'rs.initiate({_id:"rs0",members:[{_id:0,host:"127.0.0.1:27017"}]})'
```

> **Pinning the member to `127.0.0.1` is mandatory, not cosmetic.** A bare `rs.initiate()`
> defaults the member host to the machine's hostname. The driver then performs topology
> discovery against that name, which triggers **DNS resolution** — on a network-disabled
> machine that stalls or fails connections, and it is exactly the outbound lookup the
> offline boundary exists to prevent.

If `mongosh.exe` is not present in `bin`, use the standalone MongoDB Shell install path.

**Step 5 — point the application at the replica set.** In `backend/.env`:

```
MONGO_URI=mongodb://127.0.0.1:27017/cyber_awareness_training?replicaSet=rs0
```

## 6. Verification

```bash
cd backend
npm run verify:replicaset
```

Twelve checks, all of which must pass:

| Group | Checks |
|---|---|
| Topology | replica set configured · name is `rs0` · node is PRIMARY · exactly one member · member is `127.0.0.1:27017` |
| Binding | `bindIp` is loopback only · `bindIpAll` not enabled |
| Data | every baseline database present · every baseline collection present · document counts unchanged |
| Transactions | retryable writes supported · session starts · transaction starts · commits with `{w:1, j:true}` · committed write visible · probe cleaned up |
| Guard | the ENGINE-001 topology guard accepts the deployment |

The script is **read-only against application data**. Its transaction probe writes to a
scratch database (`deploy001_probe_tmp`) which it drops itself; it never touches an
application database or collection.

Manual equivalents, if you prefer to check by hand:

```javascript
rs.status()        // set: rs0, members[0].stateStr: "PRIMARY"
rs.conf()          // members[0].host: "127.0.0.1:27017"
db.hello()         // setName: "rs0", isWritablePrimary: true
db.adminCommand({getCmdLineOpts:1}).parsed.net   // bindIp: "127.0.0.1"
```

## 7. Confirming localhost-only binding

```powershell
Get-NetTCPConnection -LocalPort 27017 -State Listen | Select-Object LocalAddress,LocalPort
Get-NetTCPConnection -LocalPort 5000  -State Listen | Select-Object LocalAddress,LocalPort
```

Both must report `127.0.0.1`. A `0.0.0.0` or `::` result means the process is reachable
from the LAN and must be corrected before the machine is networked.

The API binding is enforced in code: `env.host` defaults to `127.0.0.1` and
`server.js` passes it to `app.listen(port, host)`. Overriding it requires setting `HOST`
explicitly — it is never widened by default.

## 8. Restarting MongoDB safely

```powershell
Restart-Service MongoDB          # elevated
Get-Service MongoDB
```

Stop the API first if it is running, so it reconnects cleanly. A single-node replica set
re-elects itself PRIMARY within a second or two of starting; a write issued during that
window fails with a transient error and the driver retries it.

## 9. Backup and recovery

There is no redundancy (R10), so backups are the only protection.

**Cold backup** — the simplest and most reliable:

```powershell
Stop-Service MongoDB
Copy-Item "C:\Program Files\MongoDB\Server\8.3\data" "<destination>" -Recurse
Start-Service MongoDB
```

**Restore:** stop the service, replace `dbPath` with the backup, start the service.

Always stop the service first. Copying a live `dbPath` yields an inconsistent snapshot that
may not restore.

## 10. What NOT to do

- **Never** run `db.dropDatabase()` or drop a collection on an application database.
- **Never** run `rs.initiate()` a second time on an already-initiated set — check
  `rs.status()` first. Re-initiating is not a fix and can lose the existing config.
- **Never** run `rs.reconfig()` unless you know exactly which field you are changing.
- **Never** set `bindIp: 0.0.0.0` or `bindIpAll: true`, and never open 27017 on the
  firewall.
- **Never** add a second member, an arbiter, sharding, Atlas or any cloud target.
- **Never** change `dbPath` — the existing data lives there.
- **Never** initiate with the machine hostname instead of `127.0.0.1` (§5, Step 4).
- **Never** weaken or bypass the ENGINE-001 topology guard to "make it work" on standalone.
- Do not install a second MongoDB instance; the existing one converts cleanly.

## 11. Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Service will not start after the edit | YAML error in `mongod.cfg`. Check `mongod.log`. YAML needs **two-space** indentation and no tabs. Restore `mongod.cfg.pre-rs0.bak` and retry. |
| `NotYetInitialized` on any command | The stanza is applied but `rs.initiate()` has not run — Step 4. |
| `AlreadyInitialized` | The set already exists. Do **not** re-initiate; verify with `rs.status()`. |
| Node stays SECONDARY, never PRIMARY | Usually a member-host mismatch. Compare `rs.conf().members[0].host` against `127.0.0.1:27017`. |
| Driver hangs or is slow to connect | The member was initiated with a hostname, so the driver is attempting DNS. Fix the member host to `127.0.0.1:27017`. |
| `This MongoDB deployment does not support retryable writes` | The conversion has not been applied, or the URI points at a different instance. |
| Writes fail briefly after a restart | Normal: the node is re-electing itself. It resolves in a second or two. |
| Other projects cannot connect | Their connection strings need no change. A single-node replica set accepts the same connections. If one pins `directConnection=true`, that still works. |

## 12. Rollback

The conversion is fully reversible and does not alter application data.

```powershell
$mongo = "C:\Program Files\MongoDB\Server\8.3"
Stop-Service MongoDB
Copy-Item "$mongo\bin\mongod.cfg.pre-rs0.bak" "$mongo\bin\mongod.cfg" -Force
Start-Service MongoDB
```

Then remove `?replicaSet=rs0` from `MONGO_URI` in `backend/.env`.

The instance returns to standalone with all databases intact. The replica-set metadata left
in the `local` database is ignored by a standalone `mongod` and is harmless; the oplog
collections can be left in place.

**After rolling back, the scenario engine will correctly refuse to run** — that is the
topology guard behaving as designed, not a regression.
