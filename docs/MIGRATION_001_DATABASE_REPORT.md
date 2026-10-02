# MIGRATION-001: Database Architecture, Inventory and Migration Treatment

Companion to `PRODUCTION_RELEASE_MANIFEST.md`. This document explains **why** the release database
looks the way it does. Every statement here was traced in the code or read from the live database on
22 September 2026. The final 100-scenario audit has **not** been performed.

## 1. How a scenario reaches a learner

```
backend/data/scenarios/v1/*.json        client bank, verbatim (MANIFEST content_sha256)
backend/data/synthetic/v1/*.json        structured synthetic content (DATA-003)
backend/data/taxonomy/*.v1.json         canonical family + trigger maps (v1.0.0)
        │  scenarioDefinitionImportService (validates everything, then writes)
        ▼
MongoDB  scenariodefinitions            ONE document per scenario_id+version; the only DB content
        │  attemptService.loadSelectionPool → scenarioSelectionService (8+2, 3/3/2/2, …)
        ▼
attempts + scenarioruns                 frozen 10-scenario sequence, one run per ordinal
        │  GET /current-run → definition.toCandidateJSON() + per-run action codes
        ▼
frontend sceneRegistry (W01…S25)        presentation pack per scenario_id, compiled into the bundle
  + platform renderer                   WhatsApp / Instagram / Email / SMS surfaces
        │  learner taps a neutral control → opaque action code
        ▼
learnerActionService                    code → {stage, intent} via backend/data/learner-actions/v1
        │
scenarioEngineService.resolveIntent     intent × the definition's declared stage scoring → event + points
        ▼
scenarioevents (ledger) → scenarioruns.score_0_10 → attempts.total_score → progresssnapshots
```

So the database holds **only** the scenario definitions. Scene packs are frontend code, and the action
maps are backend source files. Inserting scene files into the database would be wrong, and the
migration does not do it. `expected_actions` is empty on all 100 definitions **by design** (DATA-002).
Which behaviour is expected at each stage is encoded by the per-stage scoring codes on the
definition, the engine's `STAGE_INTENTS` rules and the action maps, and the release validator
exercises all three together.

## 2. Databases on the server (before)

140 databases on MongoDB 8.3.8, replica set `rs0` (single node, PRIMARY). Relevant ones:
`cyber_awareness_training` (the existing "production" / development database), 13
`cyber_awareness_*_verify` and `immersive003a_r2_verify` historical verification databases (left untouched), plus
unrelated projects. No release database existed.

## 3. Existing database inventory (`cyber_awareness_training`, read-only)

| Collection | Model | Docs | Purpose | Authoritative / derived | Dev/test data? | Release treatment |
|---|---|---:|---|---|---|---|
| `scenariodefinitions` | ScenarioDefinition | 100 | Final bank, all active, v1 | **Authoritative** | No | **Rebuilt from source files** (not copied); proven identical |
| `scenarios` | Scenario (legacy) | 40 | Old 40-scenario bank, all `isActive: true` | Legacy | Yes (superseded) | **Not migrated** (empty collection) |
| `assessments` | Assessment (legacy) | 1 | Legacy attempt | Operational | Yes | Empty |
| `candidates` | Candidate | 9 | Learner profiles | Operational | Yes (developer/test learners) | Empty |
| `attempts` | Attempt | 10 | Attempts | Operational | Yes | Empty |
| `scenarioruns` | ScenarioRun | 100 | Runs | Operational | Yes | Empty |
| `scenarioevents` | ScenarioEvent | 209 | Event ledger | Operational (audit source) | Yes | Empty |
| `progresssnapshots` | ProgressSnapshot | 6 | Learner progress | Derived (regenerable) | Yes | Empty |
| `auditevents` | AuditEvent | 0 | Instructor audit log | Operational, append-only | — | Empty |
| `adminusers` | AdminUser | 0 | Admin accounts | Operational | — | Empty (created on the target) |
| `configurations` | Configuration | 0 | Instructor settings singleton | Configuration | — | Empty (app self-seeds defaults) |
| `__rs0_transaction_test__` | none | 0 | Left by `verify:replicaset` | Throwaway | Yes | **Not created** |

Bank distributions in the existing database are identical to the release (§ manifest 3): 25 per
platform, 80/20, 8/9/8 per platform, 35 military, taxonomy 1.0.0 everywhere, `lifecycle_state`
absent on all 100 (resolved from `active` by `lifecycleOf()`). Legacy bank: 10 per channel, 28
malicious and 12 legitimate, all active. There are no MongoDB-level validators in any collection.

Full machine-readable baseline, with per-collection SHA-256, ID hashes, indexes and newest records:
`backend/deploy/migration-001/production-baseline.before.json`.

## 4. The legacy 40 scenarios: decision

- **Why they exist:** the original simulation journey (`Scenario` + `Assessment` models,
  `/api/assessments`, frontend route `/assessment/legacy`). They predate the client's 100-scenario
  specification and use a different content model (screen graph plus judgement/action/reason marks).
- **What references them:** `assessments.sequence[].scenario` and `candidates.seenScenarios[].scenario`,
  meaning only the development database's own test learners. The new attempt engine never reads
  `scenarios`: selection reads only `scenariodefinitions` (`active: true`).
- **Are they selectable?** Yes, in the existing database: `POST /api/assessments` builds a legacy
  assessment from `Scenario.find({ isActive: true })`, and the endpoint is still mounted. The UI no longer
  starts one (the dashboard uses `/api/attempts`), but the API would.
- **Backward compatibility:** nothing in a fresh release refers to them, and the legacy code handles an
  empty pool cleanly (`409 POOL_TOO_SMALL`; the summary reports 0).
- **Decision:** **not migrated.** The `scenarios` and `assessments` collections exist, indexed and
  empty, so the legacy code runs without error and cannot select anything. The 40 records remain
  preserved in `cyber_awareness_training` and in the pre-migration backup, so they are archived, not
  lost. The validator makes "no active legacy scenario" a release invariant, and the smoke test
  confirms the 409 over HTTP.

## 5. Admin foundation

`adminusers` is created, indexed and empty. The only supported way to create an administrator is
`npm run admin:create` on the target machine (interactive, Argon2id hash, no HTTP route). No account
or password was invented. `configurations` is left empty on purpose:
`instructorControlService.loadFeedbackConfig()` creates the singleton with the documented defaults
(`on_completion` / `on_completion`) on first read, and seeding it here would only duplicate that. The
validator accepts 0 documents, or 1 document holding exactly the defaults. `auditevents` is empty, and
its append-only guards live in the model, not the data.

## 6. Indexes

Indexes come from the models, which are the application's own statement of its queries: selection
(`active` × platform/level, disposition, family, triggers, military), identity uniqueness
(`scenario_id+version`, `identifierNormalised`, `usernameNormalised`, `scope`), engine integrity
(`intent_key` unique for idempotency, `run_id+sequence` unique for ordering, `attempt_id+ordinal`
unique), resume and expiry (`attempt_id+status`, `status+expires_at`), instructor listing
(`started_at desc, _id desc`) and audit. The build creates exactly these (`createCollection` +
`createIndexes`), and the validator asserts `Model.diffIndexes()` is empty in both directions. No index
was invented. The existing database already had all of them.

## 7. Method

1. Read-only inventory and fingerprint of the existing database (`inventoryDatabase.js`).
2. `mongodump` backup of the existing database, stored outside the repository because it contains
   learner records: `%USERPROFILE%\mongo-backups\migration-001\cyber_awareness_training.pre-migration-001.archive.gz`
   (155,717 bytes, SHA-256 `70770674b50bd838fe7180040cf4f37479236ebfac5fa4179d76a6040a114d76`).
3. `buildProductionRelease.js`: refuses a standalone server or an existing target, dry-runs the
   importer over the whole source, creates collections and indexes, imports through the application's
   own importer, validates, then compares read-only with the existing bank.
4. Trial builds in temporary databases. Negative tests (a stray learner, an active legacy scenario, a
   deactivated definition, an unknown family, a dropped unique index, removed resolve scoring) each
   made the validator exit 1. Two builds produced identical hashes, and both overwrite guards held.
5. Final build, `mongodump` archive, restore under another name, validation of the restored copy,
   application smoke test against that copy.
6. Post-migration comparison of the existing database with its baseline: identical.
7. Temporary databases dropped.

## 8. Compatibility smoke test (restored copy, isolated API on :5055)

`smokeTestRelease.js`: **PASS, 42/42.** The application started and connected. The legacy summary
reported 0 and legacy `POST /api/assessments` returned `409 POOL_TOO_SMALL`. 4 learners and 4 attempts
were created, each a valid 10-scenario selection from the bank; 36 distinct scenarios ran on all four
platforms. An unknown action code got a neutral `422 INVALID_ACTION`, a wrong-stage code got
`409 STALE_STATE`, and a retried intent key produced no second event. The safe route scored 10/10 on
20 of 20 runs and the risky route lost points on 20 of 20. Every run's score reproduced from its
ledger, `total_score` equalled the sum of run scores, and results and progress were served. A
browser check of the real frontend (verify build) against the same API showed the briefing
reporting 25 per platform, an Instagram scenario rendering, and a learner action committing through
the engine.
