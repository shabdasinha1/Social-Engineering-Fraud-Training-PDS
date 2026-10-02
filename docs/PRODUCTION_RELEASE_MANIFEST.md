# Production Release Manifest — `cyber_awareness_training_release`

**Migration:** MIGRATION-001 · **Built:** 22 September 2026, 14:59:08–14:59:12 UTC ·
**Build script:** `backend/scripts/release/buildProductionRelease.js` v1.0.0 ·
**Validation:** **PASS** (12/12 release invariants) · **Contains no secrets and no personal data.**

> The final 100-scenario audit has **not** yet been performed. This manifest describes the database
> content and its integrity, not a content sign-off.

## 1. What this database is

The initial database for the deployed application: the final 100-scenario bank plus the empty,
fully indexed collections the application writes to. Nothing operational is carried over. The
existing development database, `cyber_awareness_training`, is separate and was not modified.

| | |
|---|---|
| Database name | `cyber_awareness_training_release` |
| Server used to build it | MongoDB 8.3.8, single-node replica set `rs0` (the application requires a replica set for transactions) |
| Portable copy | `backend/deploy/migration-001/cyber_awareness_training_release.archive.gz` (99,126 bytes, `mongodump --gzip --archive`) |
| Archive SHA-256 | `44cc51ecfd6fe50251380ad3a267431336cc32c8b9e51b35bb5675b1b9953729` |
| Restorability | Proven: restored under another name and passed full validation plus the application smoke test |
| Source code revision | git `ab41199` plus the uncommitted IMMERSIVE-010 to 014 working tree (the source files are pinned by the hashes in §5) |

## 2. Collections

| Collection | Documents | Role | Indexes (besides `_id_`) |
|---|---:|---|---|
| `scenariodefinitions` | **100** | Authoritative scenario bank | `scenario_id_1_version_1` (unique), `active_1_platform_1_level_1`, `active_1_disposition_1`, `active_1_canonical_family_1`, `active_1_canonical_triggers_1`, `active_1_military_flag_1` |
| `candidates` | 0 | Learner profiles | `identifierNormalised_1` (unique), `archived_1` |
| `attempts` | 0 | Attempts | `profile_id_1`, `profile_id_1_status_1`, `profile_id_1_started_at_-1`, `started_at_-1__id_-1`, `status_1_expires_at_1` |
| `scenarioruns` | 0 | Scenario runs | `attempt_id_1_ordinal_1` (unique), `attempt_id_1_status_1`, `scenario_id_1_definition_version_1`, `status_1` |
| `scenarioevents` | 0 | Event ledger (score audit source) | `intent_key_1` (unique, idempotency), `run_id_1_sequence_1` (unique, ordering) |
| `progresssnapshots` | 0 | Derived learner progress | `profile_id_1` (unique) |
| `auditevents` | 0 | Append-only instructor audit log | `idempotency_key_1` (unique, partial), `occurred_at_-1`, `occurred_at_1`, `actor_admin_id_1`, `action_1`, `resource_type_1`, `resource_type_1_resource_id_1_occurred_at_-1` |
| `adminusers` | 0 | Administrator accounts | `usernameNormalised_1` (unique) |
| `configurations` | 0 | Instructor settings singleton (created by the app on first read, with documented defaults) | `scope_1` (unique) |
| `assessments` | 0 | Legacy 40-scenario journey | `candidate_1`, `candidate_1_status_1`, `candidate_1_createdAt_-1` |
| `scenarios` | 0 | Legacy 40-scenario bank (deliberately not migrated) | `scenarioCode_1` (unique), `isActive_1_channel_1_type_1` |

That is 11 collections and 45 indexes (34 besides `_id_`), exactly what the Mongoose models declare: `Model.diffIndexes()`
reports nothing missing and nothing extra. There are no MongoDB-level `$jsonSchema` validators. The
application validates in Mongoose, and the existing database has none either.

## 3. Scenario bank

All 100 are `active: true`, content `version: 1`, one active version per `scenario_id`, IDs exactly
W01–W25, I01–I25, E01–E25, S01–S25.

| Platform | Total | Malicious | Legitimate | Easy | Medium | Hard | Military |
|---|---:|---:|---:|---:|---:|---:|---:|
| WhatsApp | 25 | 20 | 5 | 8 | 9 | 8 | 10 |
| Instagram | 25 | 20 | 5 | 8 | 9 | 8 | 12 |
| Email | 25 | 20 | 5 | 8 | 9 | 8 | 8 |
| SMS | 25 | 20 | 5 | 8 | 9 | 8 | 5 |
| **Total** | **100** | **80** | **20** | **32** | **36** | **32** | **35** |

| Difficulty × disposition | Malicious | Legitimate |
|---|---:|---:|
| Easy | 24 | 8 |
| Medium | 28 | 8 |
| Hard | 28 | 4 |

Military-context: 35 in total (27 malicious, 8 legitimate), matching the plan (§ scenario index:
WhatsApp 10, Instagram 12, Email 8, SMS 5). Multi-trigger scenarios: 87.

**Canonical families (19 declared, 19 used):** operational_elicitation 10 · financial_credential_phishing 9 ·
payment_diversion 7 · legit_system_confirmation 7 · credential_phishing 6 ·
account_takeover_authorisation_abuse 6 · tech_support_and_callback_fraud 6 · legit_routine_broadcast 6 ·
legit_coordination_request 6 · malware_delivery 5 · identity_data_harvesting 5 · qr_code_phishing 5 ·
unsolicited_payment_lure 5 · investment_and_task_fraud 5 · coercion_and_extortion 4 ·
impersonation_emergency_payment 3 · relationship_grooming_fraud 3 · legit_verified_high_risk_change 1 ·
disinformation_amplification 1.

**Canonical triggers (22 declared, 22 used; counts are scenario mentions):** authority 40 · urgency 27 ·
routine 19 · fear 18 · greed 11 · curiosity 10 · empathy 9 · familiarity 8 · trust 6 · scarcity 6 ·
convenience 5 · isolation_secrecy 5 · pride 5 · flattery 4 · duty_compliance 3 · reciprocity 3 ·
helpfulness 3 · expert_status 2 · shame_embarrassment 2 · social_proof 2 · commitment 2 · confusion 1.

**Taxonomy versions:** attack family `1.0.0`, trigger `1.0.0`. No unknown, new or obsolete value appears on
any scenario.

## 4. Learner actions (server-side, not in the database)

The neutral action maps (SECURITY-001) ship as backend source in `backend/data/learner-actions/v1/`,
not as database content. They were verified against this database: 100 of 100 scenarios have a scene
map (25 per platform file), with 1,986 scene controls plus 37 generic controls. There are no
duplicate keys and no scene mapped twice. Every entry holds only `stage` and `intent`, never points,
codes or answers. Every scene control is accepted by the engine for its scenario, and every stage of
every scenario has at least one accepted control. No authoring name reaches `frontend/src`.

## 5. Hashes and fingerprints

| What | SHA-256 |
|---|---|
| Client scenario bank (source, `MANIFEST.json` `content_sha256`) | `8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687` |
| Synthetic content v1 | `2779b03939e13cf11e0bee44493609f0c91e228f201f22f8c025a080509afde1` |
| Stored bank, every field except `_id`/timestamps/`__v` (raw = semantic here) | `6ec38baa86a7b56427d2926c2236c4eec379990866d72748c06df8569ae63f08` |
| Same digest computed on `cyber_awareness_training` (read through the schema) | `6ec38baa…63f08`, **identical** |
| Family taxonomy file | `f6c62c89231102f606080c494fc2429e6eccc23da7bfabe96433096b434e3adc` |
| Trigger taxonomy file | `46cb99d42fbe4cea02680ed0f7e5f8be8d55905a0000a54ac21fcc3378e8f711` |

The stored bank digest is deterministic: two independent builds produced the same value. The only
raw-storage difference from the development database is `published_at`, which is absent in the 100
development documents (they predate ADMIN-001) and stored as its schema default `null` here. The
application reads both as `null`.

All 17 source files are hashed in `backend/deploy/migration-001/cyber_awareness_training_release.build-report.json`
(`source_files_sha256`).

## 6. Evidence files (`backend/deploy/migration-001/`)

| File | Content |
|---|---|
| `production-baseline.before.json` | Read-only inventory of `cyber_awareness_training` before the migration (counts, indexes, per-collection and ID hashes, newest record) |
| `production-baseline.after.json` | The same after the migration: **identical** |
| `cyber_awareness_training_release.build-report.json` | Full build report: source hashes, import report, validation, comparison, inventory |
| `cyber_awareness_training_release.validation.json` | Standalone validator output (`--json`) |
| `cyber_awareness_training_release.inventory.json` | Inventory of the release database |
| `cyber_awareness_training_release.archive.gz` | The restorable release database |

## 7. Using it (for the deployment administrator)

```
# restore onto the target server (a replica set), under the name the backend will use
mongorestore --uri="mongodb://127.0.0.1:27017/?replicaSet=rs0" --gzip \
  --archive=cyber_awareness_training_release.archive.gz

# validate it (read-only; exit 0 = PASS)
cd backend && node scripts/release/validateProductionRelease.js --db=cyber_awareness_training_release

# point the backend at it
MONGO_URI=mongodb://127.0.0.1:27017/cyber_awareness_training_release?replicaSet=rs0

# create the first administrator on the target machine (interactive, never scripted)
npm run admin:create
```

To restore under a different name, add
`--nsFrom='cyber_awareness_training_release.*' --nsTo='<name>.*'` and validate with `--db=<name>`.
Before the first learner signs in, the validator must PASS. Once learners use the database it will
(correctly) report operational data, so use it as a pre-go-live gate, not a runtime health check.

No administrator account and no secret is included. `ADMIN_SESSION_SECRET`, `SESSION_SECRET` and
(optionally) `LEARNER_ACTION_SECRET` must be generated on the target machine; see `backend/.env.example`.

**Deployment requirement:** run the backend with `NODE_ENV=production` and a unique
`SESSION_SECRET` supplied by the deployment environment. With `NODE_ENV=production` the server
refuses to start while `SESSION_SECRET` is unset or still the published development default.
