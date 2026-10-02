# Deployment Topology and Transaction Strategy

**Status:** DESIGN RECORD — approved as an **implementation decision** on 4 September 2026 (ALIGN-005c, resolving Question 20 in `PROJECT_MASTER_PLAN.md` §15.14).
**Applies to:** the offline training/evaluation deployment described in `Interactive_Social_Engineering_Scenario_UI_Development_Specification.pdf` (v1.0, 02 September 2026).
**Companion records:** [`ATTACK_FAMILY_TAXONOMY.md`](ATTACK_FAMILY_TAXONOMY.md) · [`TRIGGER_TAXONOMY.md`](TRIGGER_TAXONOMY.md)

> ## ⚠ OURS, NOT THE CLIENT'S
>
> The client requires *"Persist event ledger and scenario result **transactionally** before
> issuing the next dashboard notification"* (§5), offline containment (§1), and state
> recovery *"without duplicating points or skipping events"* (§6).
>
> **That is the requirement. Everything below is how we chose to satisfy it.** The
> deployment topology, the MongoDB configuration, the transaction boundary and the
> idempotency design are **implementation decisions owned by the engineering team** and
> must never be represented to the client as client-specified infrastructure.
>
> Nothing here has been implemented. This is a design record only.

---

## 1. Current state — measured, not assumed

Every value below was read from the running system on 4 September 2026.

### MongoDB

| Property | Observed value |
|---|---|
| Version | **8.3.7** |
| Topology | **Standalone** — `hello.setName` absent, `hello.msg` absent |
| Launched as | Windows service: `mongod.exe --config "C:\Program Files\MongoDB\Server\8.3\bin\mongod.cfg" --service` |
| `net.bindIp` | **`127.0.0.1`** — loopback only |
| `net.port` | `27017` |
| `storage.dbPath` | `C:\Program Files\MongoDB\Server\8.3\data` |
| Storage engine | **WiredTiger**, `persistent: true`, `supportsCommittedReads: true` |
| `replication` section | **absent** |
| `logicalSessionTimeoutMinutes` | 30 (sessions available) |

**Transaction probe result — this is the crux of Question 20:**

```
startSession() -> startTransaction() -> insertOne() -> commitTransaction()
FAILED: "This MongoDB deployment does not support retryable writes."
```

A standalone `mongod` supports neither retryable writes nor multi-document transactions.
**The client's "transactionally" requirement cannot be met on the installation as it
stands today.** This is now a measured fact rather than the assumption recorded in risk R4.

WiredTiger journaling does give **single-document** crash durability today. What is missing
is atomicity *across* documents.

### Application

| Property | Observed value |
|---|---|
| Backend | Node.js + Express 5 (ESM), single process, `node src/server.js` |
| ODM / driver | **Mongoose 9.9.4** (bundles a MongoDB driver with full transaction support) |
| Connection string | `mongodb://127.0.0.1:27017/cyber_awareness_training` — no `replicaSet` parameter |
| Connection options | `serverSelectionTimeoutMS: 5000` only |
| Backend bind | `app.listen(env.port)` — **no host argument, so it binds `0.0.0.0` (all interfaces)** |
| Frontend | Vite dev server on `:5173`, CORS-allowed origin to the API on `:5000` |
| Clustering / multiple instances | **none** — a single process, no PM2, no cluster module |
| Containers | **none** — no Dockerfile, no compose file, no `.yml`/`.yaml` anywhere |
| Electron | **not yet present** — listed in the plan's stack table as *"Packaging: Electron (later phase) — Not started"* |
| Deployment scripts | **none** — no `.bat`, no `.ps1`, no installer |
| Co-location | Backend and MongoDB both on the same Windows machine, over loopback |
| Concurrency | One learner at a time; the orchestrator serialises scenarios by design |

**One finding outside this task's scope, recorded because it was discovered here:** the
Express server binds all interfaces, not loopback. That is pre-existing network exposure
unrelated to MongoDB and belongs to **R7** (`SAFE-001`). It is **not** fixed here — see §7.

## 2. Client requirements bearing on this decision

### A — Explicit client requirements

| Requirement | Source |
|---|---|
| "Persist event ledger and scenario result **transactionally** before issuing the next dashboard notification" | §5 *Integrity* |
| "Closing/reopening resumes at the last committed state **without duplicating points or skipping events**" | §6 *State recovery* |
| "All browser, file, QR, call, login and payment experiences are local mocks behind a **deny-by-default network boundary**" | §1 |
| "With network disabled, all scenarios, assets, reports and feedback work. Network monitor shows **no outbound attempts**." | §6 *Offline safety* |
| "Preserve attempt **atomically** before displaying feedback" | §3 *Completion* |
| "Badge, toast, app list, thread and backend state remain **synchronized under interruption and retry**" | §6 *Consistency* |
| "Training records stay on the local system"; exports are "explicit and local" | §2, §6 |
| Six persisted entities: `LearnerProfile`, `ScenarioDefinition`, `Attempt`, `ScenarioRun`, `Event`, `ProgressSnapshot` | §6 |
| Events carry `sequence` and `points_delta` | §6 |

### B — Engineering implications

- "Transactionally" spans at least two documents (an `Event` row and the `ScenarioRun` it
  belongs to), so single-document atomicity alone is insufficient **unless** the data model
  is deliberately shaped to avoid it.
- "Without duplicating points" under "interruption and retry" means the write path must be
  **idempotent**, not merely atomic. Atomicity and idempotency are different properties and
  both are required.
- "Before issuing the next dashboard notification" makes commit an explicit **gate** on
  orchestrator progress, not just a storage concern.
- Offline operation forbids any dependency on DNS, external services or cloud databases.

### C — Decisions that are ours

- Which MongoDB topology to run.
- Where the transaction boundary sits.
- Which state is stored versus derived.
- The idempotency mechanism and its indexes.
- The recovery/resume algorithm.
- Whether multi-machine or remote database deployment is supported in v1.

## 3. Options evaluated

### Option A — Single-node replica set on the same offline Windows machine

One `mongod` process, unchanged in every respect except that it is initiated as a
one-member replica set. This is the standard local-development topology for enabling
transactions and is fully supported on MongoDB 8.3.

### Option B — Keep standalone, approximate atomicity in the application

Retain standalone `mongod` and reshape the data model so the critical path is a single
document — embedding a run's events inside its `ScenarioRun` — plus compensating logic for
every remaining cross-document write.

### Option C — Considered and dismissed without detailed scoring

- **Replicated multi-node cluster** — no availability requirement exists; a single training
  machine cannot host a meaningful quorum; pure operational cost.
- **Remote or cloud MongoDB (Atlas)** — directly prohibited by the offline containment
  requirement.
- **Swap to an embedded transactional store (SQLite/PostgreSQL)** — technically a good fit
  for a single-machine app, but it discards the entire existing Mongoose data layer,
  models, importer and tests. §15.16 preserves that layer deliberately. Rejected on
  rework cost, not on merit.

### Comparison

| Criterion | **A — single-node replica set** | **B — standalone + compensation** |
|---|---|---|
| True multi-document atomicity | **Yes** — native ACID transactions | No — approximated, never guaranteed |
| Retryable writes | **Yes** — driver-level, automatic | **No** — unavailable on standalone |
| Crash consistency (partial write) | Impossible by construction: uncommitted transactions roll back | Possible whenever two documents must change |
| Duplicate prevention | Unique indexes **plus** transactional rollback | Unique indexes only |
| Resume / recovery | Read last committed state | Read state, then run reconciliation to repair partial writes |
| Implementation complexity | Low — one session wrapper | **High and recurring** — bespoke compensation per multi-document operation, forever |
| Operational complexity | Low — one process, as today | Lowest — nothing changes |
| Windows install complexity | **One-time**: two config lines, service restart, one `rs.initiate()` | None |
| Offline suitability | Full — loopback only, no DNS *(if initiated correctly, §5)* | Full |
| Backup / recovery | Unchanged — file-level copy of `dbPath` with the service stopped; oplog adds point-in-time capability | Unchanged |
| MongoDB 8.3 support | Native since 4.0 | n/a |
| Mongoose 9.9.4 support | Full — `startSession` / `withTransaction` | n/a |
| Admin operations (Phase 11) | Covered by the same mechanism | Each needs its own compensation design |
| Demonstrating "transactional" at acceptance | Direct and literal | Argued by analogy |
| Future migration risk | Low | Compensation logic becomes load-bearing and hard to remove later |

**Where Option B is genuinely strong.** Its central idea — shaping the model so the hot
path is one document — is sound engineering, and a run's event count is bounded (roughly
10–40), so embedding would not have hit the growth problem §15.9 warns about at the
`Attempt` level. B was not dismissed as naive.

**Why it still loses.** B trades a *one-time, scriptable install step* for *permanent,
recurring complexity*. Every future multi-document operation — attempt completion, scenario
publication with its append-only audit entry, attempt reset, profile archive — needs its
own compensation design and its own reconciliation tests. Correctness would rest on our
own bookkeeping rather than on the database. And it forfeits retryable writes, which is
precisely the safety net wanted in a "synchronized under interruption and retry"
requirement. Embedded event arrays also make the §7 path replay, the admin attempt viewer
and cross-attempt analytics materially harder to query.

## 4. Decision

> ### **Option A — a single-node MongoDB replica set on the same offline Windows machine.**

With three deliberate refinements that keep the transaction small and the system correct
under failure:

1. **The `Attempt` score rollup is derived, not transactional.** `ScenarioRun` documents are
   the source of truth for scoring. `Attempt.total_score` is a cached rollup recomputed from
   them. A crash between a run committing and the rollup being written is therefore
   **self-healing**, not a corruption — recomputation is idempotent. This removes a third
   document from the hot-path transaction.
2. **Idempotency does not depend on transactions.** Unique indexes plus a client-supplied
   intent key make the write path exactly-once *regardless* of topology. Transactions
   provide atomicity; the indexes provide idempotency. Neither substitutes for the other.
3. **The backend verifies topology at startup** and refuses to serve if it is not connected
   to a replica set. A misconfigured installation must fail loudly and immediately, never
   silently degrade to non-atomic writes.

Refinements 2 and 3 mean the design does not quietly become unsafe if someone restores a
standalone `mongod` — it stops instead.

## 5. Deployment topology

```
Single offline Windows machine
│
├── Presentation
│     Electron shell (PKG-001, later phase) — today: browser + Vite dev server
│     Renderer loads the built frontend from the local filesystem
│
├── Application
│     Node.js + Express API, single process
│     MUST bind 127.0.0.1 explicitly  (change from today's 0.0.0.0 — R7 / SAFE-001)
│     Port 5000
│
└── Data
      mongod.exe, Windows service, single-node replica set "rs0"
      bindIp 127.0.0.1, port 27017
      WiredTiger, journaled
```

| Question | v1 answer |
|---|---|
| Process boundaries | Three: Electron shell (later), Node API, `mongod`. All on one machine |
| Network interfaces | **Loopback only.** MongoDB already binds `127.0.0.1`; the API must be changed to do the same |
| Should MongoDB be local-only | **Yes** — already correct today, and unchanged by the replica-set conversion |
| Should the backend be local-only | **Yes** — currently it is not; tracked as R7, not fixed here |
| Multiple concurrent clients | **Not supported in v1.** One learner at a time; an instructor may open the admin surface on the same machine |
| Multiple application instances | **Not supported.** One API process |
| Remote MongoDB | **Not supported in v1** |
| Cloud MongoDB (e.g. Atlas) | **Prohibited** — violates offline containment |

### Replica-set configuration — the offline-critical details

Add to `mongod.cfg` and restart the service:

```yaml
replication:
  replSetName: rs0
  oplogSizeMB: 512      # cap it; the default takes ~5% of free disk
```

Then initiate **once**, pinned to the loopback address:

```js
rs.initiate({ _id: "rs0", members: [ { _id: 0, host: "127.0.0.1:27017" } ] })
```

> **This pinning is not cosmetic.** A bare `rs.initiate()` defaults the member host to the
> machine's hostname. The driver then performs topology discovery against that hostname,
> which means a **DNS/name resolution attempt** — on a machine with networking disabled
> that can stall or fail connections, and it is exactly the kind of outbound name lookup
> the §1 network boundary exists to prevent. Pinning to `127.0.0.1` keeps discovery
> entirely on loopback.

Connection string becomes:

```
mongodb://127.0.0.1:27017/cyber_awareness_training?replicaSet=rs0
```

Commit write concern: **`{ w: 1, j: true }`** — one node, journal-acknowledged. `j: true` is
what makes a commit durable across power loss; `w: "majority"` on a single-member set is
equivalent to `w: 1` and adds nothing.

**A single-node replica set is still one process on one machine.** It adds no listening
socket, no additional port, no outbound connection and no new attack surface. The bind
address is unchanged.

## 6. Transaction boundary

### What is atomic — the per-interaction hot path

```
BEGIN TRANSACTION  (session, w:1 j:true)
    read    ScenarioRun by (attempt_id, ordinal)          -- in session
    assert  run.status == 'in_progress'
    assert  intent.expected_stage == run.current_stage    -- rejects a stale client
    assert  transition (current_stage -> next_stage) is legal for this scenario
    insert  Event { run_id, sequence = run.last_sequence + 1, event_code,
                    points_delta, client_ts, elapsed_ms (server-derived),
                    synthetic_target_id, metadata (allowlisted), intent_key }
    update  ScenarioRun { current_stage, last_sequence, score_running,
                          updated_at }
COMMIT
```

**Two documents. That is the whole hot-path transaction.**

At stage 6 (Resolve) the same transaction additionally sets
`ScenarioRun { status: 'resolved', resolved_at, score_0_10 (clamped 0–10), outcome_code }`.

### What is deliberately NOT in that transaction, and why

| Excluded | Why it is safe |
|---|---|
| `Attempt.total_score` rollup | **Derived** from resolved `ScenarioRun`s. Recomputation is idempotent, so a crash before it is written repairs itself on resume |
| `ProgressSnapshot` | Derived; generated at attempt completion, regenerable at any time |
| Dashboard notification | Not persisted state. The orchestrator reads committed `ScenarioRun.status`; it has nothing of its own to commit |
| `Candidate.seenScenarios` history | Advisory input to selection only. A lost write costs at most a slightly less-ideal future draw, never a scoring or state error |

### Attempt completion — a second, separate transaction

When the tenth run reaches `resolved`:

```
BEGIN TRANSACTION
    re-read all 10 ScenarioRuns for the attempt          -- in session
    assert  all 10 status == 'resolved'
    assert  attempt.status == 'in_progress'               -- idempotence guard
    compute total_score = sum(score_0_10)                 -- recomputed, never accumulated
    update  Attempt { status: 'completed', completed_at, total_score,
                      taxonomy_version, trigger_taxonomy_version }
COMMIT
```

Recomputing rather than accumulating is what makes this replay-safe: running it twice
produces the same number, and the `status` guard makes the second run a no-op.

### The notification gate

```
commit succeeds  ->  ScenarioRun.status == 'resolved' is durable
                 ->  orchestrator MAY issue the next notification
commit fails     ->  run remains in_progress
                 ->  no notification; the learner re-enters the same run on resume
```

This satisfies §5 literally: nothing is issued until the ledger and the scenario result are
durably committed.

## 7. Idempotency

Atomicity is not enough — a retried request must not score twice. Three independent
mechanisms, none of which depends on the replica set:

| Mechanism | Index / rule | Prevents |
|---|---|---|
| **Intent key** | Unique index on `Event.intent_key` (client-generated UUID, one per user action) | Duplicate scoring when a response is lost and the client retries |
| **Sequence uniqueness** | Unique compound index on `(run_id, sequence)` | Duplicate or interleaved events; guarantees a strict per-run order |
| **Stage assertion** | `intent.expected_stage == run.current_stage`, checked inside the transaction | A stale client acting on a superseded view |

**Duplicate handling is "exactly-once effect, at-least-once delivery".** A duplicate
`intent_key` insert raises `E11000`; the handler catches it, reads the already-recorded
`Event`, and returns **the original outcome** — the same response the first call produced.
The caller cannot distinguish a retry from the original, and no points are applied twice.

**Retry policy (conceptual).** Retry only on `TransientTransactionError` and
`UnknownTransactionCommitResult`, capped (3 attempts, exponential backoff with jitter).
Never retry a logical rejection — an illegal transition or stale stage is a client error,
not a transient fault. Mongoose's `withTransaction` implements this envelope; the point is
recorded here so `EVENT-002` does not hand-roll it.

**On commit failure**, the API returns a resync response carrying the run's committed
`current_stage` and `last_sequence`. The client re-renders from committed truth and may
re-send with the same `intent_key`.

## 8. Failure-case analysis

`E` event integrity · `S` score integrity · `R` scenario-run state · `A` attempt integrity ·
`I` idempotency · `Rs` resumability. ✅ preserved.

| # | Failure | Behaviour under this architecture | E | S | R | A | I | Rs |
|---|---|---|---|---|---|---|---|---|
| 1 | App closed immediately after an action | The transaction either committed or it did not. Reopen reads committed state; if the client never saw a response it re-sends with the same `intent_key` and is de-duplicated | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | UI crashes after the request is sent | Identical to (1) — the server outcome is independent of the client's survival | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3 | **Backend crashes after Event written, before ScenarioRun updated** | **Cannot occur.** Both writes are one transaction; an uncommitted transaction is rolled back. *This is the case Option B could not eliminate and the single strongest reason for this decision* | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 4 | Backend crashes after ScenarioRun update, before Attempt rollup | The rollup is **derived**. Resume recomputes it from resolved runs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 5 | Duplicate request arrives | Unique `intent_key` → `E11000` → the stored original outcome is returned | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 6 | Network stack disabled | Everything is loopback; `mongod` binds `127.0.0.1` and the RS member is pinned to `127.0.0.1`, so no name resolution is attempted. Unaffected | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 7 | MongoDB restarts | Driver SDAM reconnects; a single-member set re-elects itself primary in ~1–2 s. In-flight transactions abort and are retried under the policy in §7 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 8 | Power loss mid-scenario | WiredTiger replays the journal to the last durable checkpoint; `j: true` guarantees an acknowledged commit was journaled first. Uncommitted transactions roll back | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 9 | User reopens the application | Resume reads the committed `ScenarioRun`; the event ledger reconstructs the UI | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 10 | User resumes an incomplete attempt | Find `Attempt` `in_progress` → first non-`resolved` run → re-enter at its committed `current_stage` → replay its events for display. Frozen sequence and stored seed are unchanged | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 11 | Dashboard receives a stale "next notification" | The notification carries the run ordinal; the server validates it against committed state and rejects a mismatch with a resync | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 12 | Same event retried after a timeout | Identical to (5) — that is exactly what `intent_key` exists for | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Residual risk, stated plainly.** A single-node replica set has **no redundancy**. Disk
failure or `dbPath` corruption loses the data, exactly as with the current standalone
install — this decision neither improves nor worsens that. Mitigation is operational: a
documented cold backup (stop the service, copy `dbPath`) as part of the install and handover
runbook. Recorded as a new low-severity risk rather than left implicit.

## 9. Offline and network-boundary interaction (R7)

**This task does not solve R7.** It records the dependencies and one discovery.

| Point | Finding |
|---|---|
| Does the replica-set conversion add network exposure? | **No.** `bindIp` stays `127.0.0.1`; no new port, socket or outbound connection. Verified against the live `mongod` configuration |
| Does it introduce name resolution? | **Only if initiated carelessly.** A bare `rs.initiate()` uses the machine hostname and triggers DNS. Pinning the member to `127.0.0.1:27017` (§5) prevents this. **This is a hard requirement of the offline boundary, not a preference** |
| New R7 finding | The **Express API currently binds `0.0.0.0`** (`app.listen(env.port)` with no host). On a networked machine the API and every training record behind it are reachable from the LAN. `SAFE-001` must bind `127.0.0.1` explicitly. **Discovered here, owned by R7, not fixed here** |
| Network-monitor acceptance test | Unaffected — loopback traffic is not outbound. The §6 "no outbound attempts" criterion remains satisfiable |
| Electron packaging (`PKG-001`) | Unaffected. The shell talks to `127.0.0.1:5000`; CSP and `will-navigate` / `setWindowOpenHandler` denials remain R7's scope |

## 10. What `DATA-001` must incorporate

Architectural constraints only — **no implementation**.

| Constraint | Rationale |
|---|---|
| `Event` is its own collection, **not** an embedded array | Enables §7 path replay, the admin attempt viewer and cross-attempt analytics without `$unwind`; avoids document-growth limits |
| Unique compound index `(run_id, sequence)` | Strict per-run ordering; blocks duplicate and interleaved events |
| `Event.intent_key`, unique | The idempotency primitive; must exist as a field from day one |
| `Event.points_delta` stored per event | Score is replayable and explainable from the ledger alone |
| `ScenarioRun` carries `current_stage`, `last_sequence`, `score_running`, `score_0_10`, `status`, `outcome_code` | The transactional counterpart to each event write, and the resume anchor |
| `ScenarioRun` is the **source of truth** for scoring | `Attempt.total_score` is an idempotently recomputed cache, never an accumulator |
| `Attempt` carries `status`, `seed`, `mode`, `total_score`, `taxonomy_version`, `trigger_taxonomy_version` | Completion guard, reproducible selection, and the §7 comparability gate |
| `ProgressSnapshot` is derived and regenerable | Never a write that must be atomic with anything |
| References are ObjectId foreign keys across collections | No cross-collection embedding that would force larger transactions |
| Indexes: `Attempt(profile_id, status)`, `ScenarioRun(attempt_id, ordinal)` unique, `Event(run_id, sequence)` unique, `Event(intent_key)` unique | The access paths the hot path and resume actually use |
| Schema-level guard: a run's stage may only advance along the scenario's declared transitions | Server-authoritative state machine (§15.8) |

`DATA-001` is **unblocked** by every open question: 10, 11 and 20 are all resolved.

## 11. What `EVENT-002` must implement

- A `withTransaction` session wrapper with the retry envelope in §7 — transient errors only,
  capped, never retrying a logical rejection.
- The `E11000` → return-stored-outcome path for duplicate `intent_key`.
- The startup topology guard: assert a replica set is connected, refuse to serve otherwise.
- Write concern `{ w: 1, j: true }` on commit.
- The resync response shape (`current_stage`, `last_sequence`) for stale clients.
- The resume algorithm in failure case (10).
- Idempotent recomputation of `Attempt.total_score` and `ProgressSnapshot`.

## 12. Acceptance criteria added

- The API refuses to start when connected to a standalone `mongod`.
- The replica-set member is `127.0.0.1:27017`; no hostname appears in the RS configuration.
- With all network adapters disabled, the full stack starts and a complete attempt runs
  end to end.
- Killing the API process mid-scenario leaves no partial event/run state; resume returns
  the learner to the last committed stage.
- Replaying an identical interaction request produces one event, one score change and an
  identical response.
- Power-loss simulation (hard process termination) loses no acknowledged commit.
- Attempt completion run twice produces one completed attempt and one score.
- A cold backup and restore of `dbPath` reproduces a working installation.

---

**Content-preservation statement.** No scenario definition, no client content and no
application source code was created or altered in producing this record. The client
requirement is reliable transactional persistence in an offline-capable system; the
topology, boundary and mechanisms chosen to satisfy it are ours.
