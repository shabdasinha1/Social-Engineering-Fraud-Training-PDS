# Scenario Engine (ENGINE-001)

**Status:** IMPLEMENTED — 4 September 2026.
**Service:** `backend/src/services/scenarioEngineService.js`
**Models:** `backend/src/models/ScenarioRun.js`, `backend/src/models/ScenarioEvent.js`
**Vocabulary:** `backend/src/constants/scenarioEngine.js`
**Transactions:** `backend/src/utils/transactions.js`
**Companions:** [`SCENARIO_DEFINITION_SCHEMA.md`](SCENARIO_DEFINITION_SCHEMA.md) · [`SCENARIO_IMPORT.md`](SCENARIO_IMPORT.md) · [`DEPLOYMENT_AND_TRANSACTION_STRATEGY.md`](DEPLOYMENT_AND_TRANSACTION_STRATEGY.md)

---

## 1. Architecture

The browser sends an **intent** and an **idempotency key**. That is all. Every
authoritative decision — event code, points, next stage, outcome, final score — is made
on the server from the pinned `ScenarioDefinition`.

```
client intent  ──►  scenarioEngineService.submitIntent()
                      │
                      ├─ reject authoritative fields   (score, event_code, next_stage …)
                      ├─ validate rationale / metadata / telemetry
                      ├─ assert transaction topology
                      ├─ replay if intent_key already seen  ──► original outcome
                      │
                      └─ TRANSACTION  { w: 1, j: true }
                           read ScenarioRun            (in session)
                           assert active
                           assert expected_stage       (optimistic concurrency)
                           load pinned ScenarioDefinition (+evaluation, in session)
                           resolveIntent()             ── pure, no I/O
                           insert ScenarioEvent
                           update ScenarioRun
                         COMMIT
                      │
                      └─► next state (candidate-allowlisted)
```

`resolveIntent()` is pure and synchronous, so the entire state machine is testable
without a database. Only the surrounding transaction touches MongoDB.

**Isolation.** The engine adds no routes and does not touch the legacy
`Scenario`/`Assessment` pipeline. See §15.

## 2. ScenarioRun

Implements the client contract (specification section 6) plus the minimum state needed to
resume. `_id` is the `run_id`.

| Field | Purpose |
|---|---|
| `attempt_id`, `ordinal` | Position within an attempt. Unique together |
| `scenario_id`, `definition_version` | The logical scenario and the **pinned** content version |
| `platform` | Denormalised for cheap resume rendering |
| `status` | `active` · `resolved` · `abandoned` |
| `current_stage` | One of the six stage keys |
| `last_sequence` | The next event is always `last_sequence + 1` |
| `score_running` | Unclamped accumulation — a **cache**, see §10 |
| `score_0_10` | Written once, at resolution: `clamp(score_running, 0, 10)` |
| `outcome_code` | The learner's final action, e.g. `resolve_report` |
| `rationale` | Optional, ≤250 chars, single line. Never scored |
| `started_at`, `last_event_at`, `resolved_at` | Timing |

A schema hook enforces the invariant that a resolved run carries a score, an outcome and
a `resolved_at`, and that a non-resolved run carries none of them.

**Indexes:** `(attempt_id, ordinal)` unique · `(attempt_id, status)` · `(scenario_id,
definition_version)`.

**`attempt_id` has no `ref`.** The Attempt model is a later task and ENGINE-001 is
deliberately isolated from it. Tests use a deterministic fixture ObjectId. No fake
production attempts are created.

## 3. ScenarioEvent

The client contract's `Event` entity. Named `ScenarioEvent` because `Event` is too generic
for a global Mongoose model name; the collection is `scenarioevents`. `_id` is the
`event_id`.

| Field | Notes |
|---|---|
| `run_id`, `sequence` | Strictly increasing from 1, no gaps. Unique together |
| `event_code` | **Server-decided.** Client scoring codes, client core events, or engine telemetry |
| `stage` | The stage the run was in when the event was accepted |
| `points_delta` | **Server-decided**, read from the ScenarioDefinition |
| `synthetic_target_id` | Must name an asset the pinned definition declares, or be null |
| `intent_key` | Client-generated idempotency key. **Unique** |
| `client_ts`, `elapsed_ms` | Telemetry only — never authoritative |
| `server_ts` | The authoritative audit timestamp |
| `metadata` | Constrained sub-schema, allowlist only |

**Metadata is a typed sub-schema, not a free-form object.** Allowed keys: `intent`,
`transition`, `consequence`, `resolution_code`, `dwell_ms`, `open_latency_ms`,
`link_hover_ms`, `verify_source`, `premature`. An unknown key sent by a client is
**rejected**; anything that slipped through would be stripped by the schema. **Rationale
is never written to the ledger** — it lives in its own validated field on the run.

## 4. The six-stage lifecycle

| Stage | Intents | Result |
|---|---|---|
| **notify** | `open_item` → `NOTIFY_SEEN` (+0) → *open* · `dismiss` → `notification_dismissed` (0) → *stays* | Dismissal never removes the scenario; the run stays resumable |
| **open** | `read` → `ITEM_OPEN` (+0) → *inspect* · acting early (`reply`, `open_link`, `submit_data`, `attempt_payment`, `attempt_install`, `call_number`) → `PREMATURE_REPLY` (−1) → *branch* | Section 4's "premature action → 4" |
| **inspect** | `inspect_sender` / `inspect_profile` / `inspect_link` / `preview_file` / `inspect_qr` / `read_thread` → `INSPECT_CONTEXT` (+2) → *branch* · `skip_inspection` → `STAGE_SKIPPED` (0) → *branch* | Skipping forfeits the +2 without blocking progress |
| **branch** | `safe_pivot` → `SAFE_PIVOT`/`CORRECT_USE` (+3) · `reject_ignore` → `NEEDLESS_REJECT_IGNORE` (−2) · risky opens → `RISKY_OPEN_REPLY`/`UNSAFE_EXTERNAL_ACTION` (−3/−4) · releases → `SECRET_PAYMENT_INSTALL_DATA_RELEASE` (−8) | All reach *verify*; risky actions also return a local consequence |
| **verify** | `verify_trusted_directory` / `verify_known_app` / `verify_known_number` → `TRUSTED_VERIFY` (+3) · `verify_in_message_contact` → `VERIFY_THROUGH_MESSAGE` (+0) · `report`/`block` → `FALSE_REPORT_BLOCK` (−4) or `REPORT_ONLY_WITHOUT_CHECK` (+1) | All reach *resolve* |
| **resolve** | `resolve_report` / `resolve_block` / `resolve_continue` / `resolve_retain` / `resolve_ignore` → `RESOLVE_CORRECT` (+2) or `CONTRADICTORY_UNSAFE_FINAL` (−4) · `abandon` → `RUN_ABANDONED` (0) | Resolution is terminal; abandonment is resumable |

## 5. Intent → event mapping

The engine holds the **vocabulary and the legal shape** of a transition. The
ScenarioDefinition holds **what it is worth**. Neither alone can decide an outcome.

Each `(stage, intent)` pair names an **ordered list of candidate event codes**. The engine
picks the first code the scenario's own per-stage `scoring` list actually declares, and
takes the points from that same entry:

```
BRANCH + safe_pivot   codes: [SAFE_PIVOT, CORRECT_USE]
  malicious scenario  declares SAFE_PIVOT  +3   ──►  SAFE_PIVOT   +3
  legitimate scenario declares CORRECT_USE +3   ──►  CORRECT_USE  +3
```

**If a scenario declares none of an intent's candidate codes at that stage, the intent is
not legal for that scenario** and is rejected with `INVALID_TRANSITION`. The imported
client data gates the engine, not the reverse — which is why `reject_ignore` works on a
legitimate scenario and is refused on a malicious one.

Resolution is the one place the engine applies a rule rather than a lookup, and the client
states that rule explicitly (section 5, `RESOLVE_CORRECT`): *"Report/block/retain/continue
as the verified disposition requires."* So a malicious item must end reported or blocked,
and a legitimate one must be kept; anything else scores `CONTRADICTORY_UNSAFE_FINAL`.

### Two engine telemetry codes — declared, not smuggled

Section 4 defines two legal transitions for which it supplies **no event code**: the
inspect stage's `skip → 4` edge and the resolve stage's `abandon → resumable` edge. Both
still need a ledger entry, because no stage may advance without one.

`STAGE_SKIPPED` and `RUN_ABANDONED` fill exactly those two gaps. They carry 0 points, are
kept in their own `ENGINE_TELEMETRY_CODES` list, and never appear in the client's scoring
vocabulary. They are the only codes in the system the client did not supply.

## 6. Scoring authority

- **The client never supplies points.** `points_delta` comes from
  `definition.evaluation.stages[i].scoring[]`, which is imported client content.
- A request containing `points_delta`, `points`, `score`, `score_0_10`, `event_code`,
  `next_stage`, `current_stage`, `stage`, `sequence`, `outcome_code`, `status`,
  `expected_action` or `evaluation` is **rejected**, not ignored — a client trying to
  steer the engine finds out immediately.
- Per-event deltas are **not** clamped; the specification clamps per scenario.
- At resolution: `score_0_10 = clamp(score_running, 0, 10)`. `score_running` keeps the raw
  total for audit.
- Verified across the whole bank: **the safe path scores exactly 10 on all 100 scenarios.**

## 7. Transaction strategy

`withEngineTransaction()` wraps the hot path with `{ w: 1, j: true }` — `j: true` is what
makes an acknowledged commit survive power loss.

**Bounded retry:** at most 3 attempts, exponential backoff with jitter, and only for
errors MongoDB labels `TransientTransactionError` or `UnknownTransactionCommitResult`. A
domain rejection carries `isDomainError` and aborts immediately: an invalid transition is
a decision, not a fault, and retrying it would just repeat the same answer more slowly.

### Topology guard

The engine calls `assertTransactionSupport()` before every intent and **refuses to run**
on a standalone `mongod`, which supports neither multi-document transactions nor retryable
writes. It does not fall back to non-atomic writes: a half-written run would corrupt the
ledger the score is reproduced from, and that failure would stay invisible until an audit.

The error names the fix — add `replSetName` to `mongod.cfg`, restart, `rs.initiate()`
pinned to `127.0.0.1`, add `?replicaSet=rs0` — rather than printing a stack trace.

Verified against the live standalone instance: `TRANSACTION_UNAVAILABLE`, as designed.

## 8. Idempotency

| Mechanism | Index | Prevents |
|---|---|---|
| Intent key | `intent_key` unique | Double scoring when a response is lost and the client retries |
| Sequence | `(run_id, sequence)` unique | Duplicate or interleaved events |
| Expected stage | checked inside the transaction | A client acting on a superseded view |

A repeated `intent_key` returns **the original outcome** with `duplicate: true` — same
sequence, same state, no second event and no second scoring effect. The two unique indexes
are distinguished on `E11000`: `intent_key` means idempotency (replay the original);
`(run_id, sequence)` means a concurrent writer won (return `STALE_STATE`). Duplicate-key
errors are never retried blindly.

Reusing an `intent_key` across two different runs is rejected outright.

## 9. Concurrency

The database is authoritative; there are no process-local locks. Two simultaneous intents
against one run both compute `sequence = last_sequence + 1`; the unique index lets exactly
one commit, and the loser receives `STALE_STATE` carrying the current stage and sequence
so it can resync. Verified by a test that fires two intents concurrently and asserts one
event, one advance, one winner.

## 10. Recovery and resume

**No in-memory state is authoritative.** `getRunState(runId)` reads from MongoDB, so a
process restart changes nothing.

`ScenarioRun.score_running` is a **cache**; the event ledger is the audit source.
`recomputeScoreFromEvents()` replays the ledger, and `verifyRunIntegrity()` checks that
the cache, the sequence contiguity and the event count all agree — the foundation for a
future reconciliation job.

**Abandonment ≠ resolution.** `abandon` sets `status: 'abandoned'`, writes no
`score_0_10`, no `outcome_code` and no `resolved_at`, and keeps `current_stage` where it
was. An abandoned run rejects intents until `resumeScenarioRun()` reactivates it, after
which it continues from exactly the stage it left. **A resolved run is terminal and can
never be reopened.**

## 11. Error contract

| Code | HTTP | Meaning |
|---|---|---|
| `RUN_NOT_FOUND` | 404 | No such run |
| `RUN_NOT_ACTIVE` | 409 | Resolved, or abandoned and not yet resumed |
| `INVALID_INTENT` | 422 | Unknown intent, or the client sent an authoritative field |
| `INVALID_TRANSITION` | 409 | Intent not legal at this stage, or not declared by this scenario |
| `STALE_STATE` | 409 | The run moved on; resync from the returned state |
| `DUPLICATE_INTENT` | 200 | Replayed; the original outcome is returned |
| `INVALID_TARGET` | 422 | `synthetic_target_id` is not an asset of this scenario |
| `INVALID_RATIONALE` | 422 | Too long, multi-line, contains markup, or not a string |
| `INVALID_METADATA` | 422 | Keys outside the allowlist |
| `TRANSACTION_UNAVAILABLE` | 503 | MongoDB topology cannot commit transactions |
| `SCENARIO_DEFINITION_NOT_FOUND` | 404 | No such scenario/version |
| `SCENARIO_DEFINITION_INACTIVE` | 409 | A new run may not start on an inactive version |
| `INVALID_SCENARIO_STATE` | 500 | Definition data is internally inconsistent |

No error message carries evaluation content, expected actions or scoring rules.

## 12. Candidate security boundary

`toCandidateJSON()` on `ScenarioRun` returns exactly: `run_id`, `scenario_id`, `version`,
`platform`, `current_stage`, `status`, `last_sequence`, `started_at`, `resolved_at`.

**Never present:** `score_running` (section 3 hides the running score in assessment mode),
`rationale`, `level`, `disposition`, `family`, `canonical_family`, `trigger`,
`canonical_triggers`, `military_flag`, `evaluation`, expected actions, scoring rules.
`score_0_10` and `outcome_code` are released **only** once the run is resolved, gated by
`score_visibility`.

The engine loads `+evaluation` internally, but no evaluation field ever reaches a
candidate response. Asserted by tests that check both keys and leaked substrings.

## 13. Local consequences

A risky branch action returns a **rendering instruction**, never an execution:

```json
{ "kind": "simulated_browser_open", "target": null, "inert": true, "executes": false }
```

Kinds: `simulated_browser_open`, `simulated_file_preview`, `simulated_qr_inspect`,
`simulated_reply_sent`, `simulated_call`, `simulated_data_submission`,
`simulated_payment`, `simulated_install`, `simulated_device_link`.

The engine never opens a link, sends a message, places a call, moves money, installs
anything, executes a file, mounts an archive, or touches the camera, microphone,
clipboard or an OS handler. The frontend will render these later.

**`synthetic_target_id` is validated against the pinned definition's declared assets.**
Because DATA-002 deliberately left `synthetic.assets` empty (assets are prose in the
specification, not records — that is DATA-003), every scenario currently declares zero
assets, so intents must send `synthetic_target_id: null` until DATA-003 lands. Any
non-null target — including an arbitrary URL — is rejected with `INVALID_TARGET`.

## 14. Content-version pinning

A run records `definition_version` at creation and stays on it. If that version is later
deactivated, the in-flight run **continues on its pinned version**, while a *new* run may
not start on it. Silently moving a live run to different content would change the rules
mid-scenario. Verified by test.

## 15. API surface — deliberately none

No routes were added. The task permits keeping the engine service-level, and adding
endpoints now would mean inventing an ownership rule ("which candidate may drive this
run?") that depends on the Attempt model, which does not exist yet. Guessing it would
create an authorisation boundary that later has to be unpicked.

The engine is therefore consumed directly as a service and tested that way. Routes arrive
with the attempt work, at which point ownership is a real question with a real answer.

## 16. Testing strategy

| Suite | Tests | Database |
|---|---|---|
| `tests/scenarioEngine.test.js` | 45 | **None** — pure transitions, validation, models, vocabulary |
| `tests/scenarioEngineTransaction.test.js` | 21 | **Real MongoDB transactions** |

Definitions in both suites come from the **real imported client dataset**, so the state
machine is exercised against real scenario semantics.

### Running the transaction tests

They are never mocked. `npm test` **skips** them with a loud warning when no replica set
is configured, so a green default run can never be mistaken for transactional coverage.

```bash
npm run test:engine        # starts a throwaway replica set, runs the suite, cleans up
```

`scripts/testEngine.js` starts a **separate** `mongod` on port 27018 with its own
temporary data directory, initiates a single-node replica set, runs the suite and stops
it. **The machine's MongoDB service on 27017 is never touched** — converting it would
affect every other database on that instance.

To point at an existing replica set instead:

```bash
ENGINE_TEST_MONGO_URI=mongodb://127.0.0.1:27017/engine_test?replicaSet=rs0 npm test
```

## 17. What remains for future tasks

| Task | What it adds |
|---|---|
| `DATA-003` | Structured `synthetic.assets`, which unlocks non-null `synthetic_target_id` |
| `ENGINE-002` | Run lifecycle API routes, once attempt ownership exists |
| `SELECT-002` | Choosing which 10 scenarios an attempt contains |
| `SCORE-002/003` | Attempt-level 0–100 aggregation from resolved runs |
| Attempt model | `attempt_id` gains a real reference and an ownership rule |
| `RESULT-001` | Path replay and behaviour breakdown, built on this ledger |

`expected_actions` on the ScenarioDefinition remains empty and is **not** required by this
engine: legality comes from the per-stage `scoring` list, which is imported client data.
If a future task populates `expected_actions`, it becomes a refinement, not a dependency.
