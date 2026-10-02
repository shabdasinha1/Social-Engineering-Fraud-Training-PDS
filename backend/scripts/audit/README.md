# Audit load and integrity scripts

Used by the final production audit (`docs/PRODUCTION_FINAL_AUDIT_REPORT_2026-09-30.md`).

> **Never run `load.mjs` against the live database.** Every virtual learner creates a real
> profile, attempts, runs and ledger events. Point the API at a **throwaway copy** first, for
> example the release archive restored under another name
> (`mongorestore … --nsFrom='cyber_awareness_training_release.*' --nsTo='zz_loadtest.*'`),
> then drop that database afterwards.

```bash
cd backend
# closed-loop stress: <users> <seconds> <think ms>
AUDIT_BASE=https://<host>/api node scripts/audit/load.mjs stress 100 60 0
# realistic classroom pace: 400 learners, 10 s between actions, 150 s
AUDIT_BASE=https://<host>/api node scripts/audit/load.mjs stress 400 150 10000
# N learners press Start at the same moment
AUDIT_BASE=https://<host>/api node scripts/audit/load.mjs burst 300
```

Optional: `AUDIT_MONGO_URI` (MongoDB `serverStatus` before/after) and `AUDIT_MONITOR_FILE`.
Each run prints one `RESULT {…}` line with p50/p95/p99, req/s, errors and per-operation latency.
Run the generator from a separate machine when possible, so it does not compete with the API
for CPU.

`integrity.mjs` is **read-only**. It replays every run's ledger, checks every event's points
against its pinned definition, every resolution against the disposition, every attempt total
and every selection rule, and prints counts of any violation:

```bash
AUDIT_MONGO_URI="mongodb://<user>:<pw>@127.0.0.1:27017/<db>?replicaSet=rs0&authSource=<db>" node scripts/audit/integrity.mjs
```

`lc.mjs` is the shared learner client. It reads `backend/data/learner-actions/v1` only to pick a
control for a wanted intent. The API itself never reveals that mapping.
