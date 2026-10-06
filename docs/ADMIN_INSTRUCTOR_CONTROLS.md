# Instructor Controls (ADMIN-004)

**Status:** IMPLEMENTED — 7 September 2026.
**Service:** `backend/src/services/instructorControlService.js` · **Controller:** `backend/src/controllers/instructorControlController.js`
**Vocabulary:** `backend/src/constants/instructorControls.js` · **Model:** `backend/src/models/Configuration.js`
**Routes:** `/api/admin/attempts/:attemptId/reset`, `/api/admin/learners/:profileId/archive`, `/api/admin/config/feedback`
**Companions:** [`ADMIN_AUDIT_LOG.md`](ADMIN_AUDIT_LOG.md) · [`ADMIN_ATTEMPT_VIEWER.md`](ADMIN_ATTEMPT_VIEWER.md) · [`ADMIN_EXPORTS.md`](ADMIN_EXPORTS.md) · [`SCENARIO_ENGINE.md`](SCENARIO_ENGINE.md)

---

## 1. What this is

Specification section 6, fourth and final admin capability:

> "Controls: reset incomplete attempt, archive profile under local policy, configure
> training vs assessment feedback timing."

Three controls. Backend and API only — there is no admin frontend in this task.

**No new audit vocabulary was invented.** ADMIN-005 already defined `ATTEMPT_RESET`,
`PROFILE_ARCHIVED` and `CONFIG_CHANGED`, the resource types `attempt`, `learner_profile`
and `configuration`, and every metadata key used here. This task is their first writer.

## 2. Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/admin/attempts/:attemptId/reset` | Reset one in-progress attempt |
| POST | `/api/admin/learners/:profileId/archive` | Archive one learner profile |
| GET | `/api/admin/config/feedback` | Current feedback timing, allowed values, defaults |
| PATCH | `/api/admin/config/feedback` | Change feedback timing |
| GET | `/api/admin/config/assessment-duration` | Default assessment duration, allowed values, running count |
| PATCH | `/api/admin/config/assessment-duration` | Change the default assessment duration (refused while one is running) |

Reset and archive are POSTs rather than PATCHes because each is a lifecycle transition with
a transaction and an audit entry behind it, not a field assignment — the same reasoning
ADMIN-001 used for publish and deactivate.

**There is no DELETE anywhere in this feature**, and no candidate-facing control: a learner
cannot reset their own attempt, archive themselves, or change feedback timing.

## 3. Authentication

All four routes sit behind the existing `requireAdmin` — the signed `admin_session` cookie
resolved against `AdminUser`. **No second authentication system.**

| Caller | Result |
|---|---|
| Anonymous | `401 NO_ADMIN_SESSION` |
| Candidate session | `401 NO_ADMIN_SESSION` — rejected, never downgraded |
| Administrator | allowed |

## 4. Control 1 — reset an incomplete attempt

### What a reset does

```
Attempt.status        in_progress -> abandoned
ScenarioRun.status    active      -> abandoned   (unresolved runs only)
```

**And that is all.** Nothing is deleted: the attempt document, all ten runs, every resolved
score and the entire `ScenarioEvent` ledger stay exactly where they are.

Deleting would have been simpler and much worse. The event ledger is the record every score
is reproducible from (ENGINE-001), and a reset that erases it destroys the evidence of the
thing being reset. An instructor can still open the attempt in the ADMIN-002 viewer and see
what the learner did before it was reset, and can still export it (ADMIN-003).

### Why `abandoned`, and why no query had to change

`abandoned` is **not a new state**. It is the third value `ATTEMPT_STATUSES` has declared
since SELECT-002, and until now nothing produced it. Using it rather than inventing a
`reset` status means every learner path already excludes a reset attempt, with no query
change anywhere:

| Path | Behaviour after a reset |
|---|---|
| `findActiveAttempt` (`GET /api/attempts/current`) | `null` — nothing to resume |
| `createAttempt` in-progress guard | the learner may start a fresh attempt immediately |
| `POST …/events`, `POST …/resolve` | `409 ATTEMPT_NOT_IN_PROGRESS` |
| `completeAttempt` | `409` — a reset attempt can never become completed |
| `buildAttemptResult` | `409 ATTEMPT_NOT_COMPLETE` — no result is ever produced |
| `GET …/:attemptId/current-run` | `run: null` — see below |

`GET /:attemptId/current-run` was the one path with no status check. It is read-only, so it
could never have advanced anything, but it would have kept serving the next scenario to a
learner holding the attempt id — which looks resumable. ADMIN-004 added the guard, so every
terminal state now returns `run: null` there rather than only a completed attempt returning
it as a side effect of all ten runs being resolved.

### What a reset never does

No score is written. No total is computed. `completed_at` and `total_score` stay null. No
completed result is produced. **No replacement attempt is created** — the learner starts a
new one through the normal flow, when they choose to. No `ScenarioDefinition` is touched. No
other learner is read or written.

### Refusals

| Situation | Response |
|---|---|
| Attempt is `completed` | `409 ATTEMPT_NOT_RESETTABLE` — history is never reopened |
| Attempt is already `abandoned` | `200` with `changed: false`, and **no second audit entry** |
| Attempt does not exist, or the id is malformed | `404 ATTEMPT_NOT_FOUND` |
| Body carries anything but `reason_code` / `idempotency_key` | `422 FORBIDDEN_FIELD`, naming the fields |
| `reason_code` outside the closed vocabulary | `422 INVALID_REASON_CODE` |

`reason_code` is an enum — `learner_request`, `technical_fault`, `session_interrupted`,
`instructor_policy`, `duplicate_attempt` — never free text. A reason field that accepts
prose eventually accepts a learner's name, an incident description, or a note about
someone's health.

### Response

```json
{ "reset": { "attempt_id": "…", "previous_status": "in_progress", "status": "abandoned",
             "reset_at": "…", "scenarios_discarded": 7, "scenarios_preserved": 3,
             "result_available": false, "total_score": null, "changed": true } }
```

## 5. Control 2 — archive a learner profile

### What archiving does

Three additive fields on `Candidate`: `archived`, `archived_at`, `archived_by`. `archived`
defaults to `false`, so the profiles that existed before this feature read as active — **no
backfill was run and no existing row was rewritten.**

**This is not deletion, and there is no delete route.** Everything survives untouched:

| Preserved | Verified by test |
|---|---|
| The profile document, its name and service number | yes |
| Completed attempts and their scores | yes |
| In-progress attempts | yes |
| Every `ScenarioRun` and `ScenarioEvent` | yes |
| `ScenarioDefinition` records | yes |
| Audit history | yes (append-only by construction) |
| Exported artifacts | untouched — the export directory is not read or written here |

An instructor can still list and inspect an archived learner's attempts through ADMIN-002
and export them through ADMIN-003.

### What changes: learner access

| Path | Behaviour |
|---|---|
| `POST /api/candidates` (sign-in) | `403 PROFILE_ARCHIVED` |
| Any request on a session opened before archiving | `401 PROFILE_ARCHIVED` |

The session check matters: without it a learner holding a live cookie would keep working
for the remaining eight hours of their session. Both refusals carry a neutral message —
"This profile is not available for training. Please speak to your instructor." — and never
say why.

**Signing in never un-archives.** That is the one place archival could have been undone by
accident: the login path finds a profile by its normalised service number and would
otherwise hand it straight back, quietly reactivating a profile an instructor deliberately
retired.

### An in-progress attempt of an archived learner is left intact

Archiving does **not** reset, complete or alter any attempt. Archival is a statement about
a person's access, not about their work. An instructor who also wants the attempt closed
resets it deliberately — a separate, separately audited act, and one that still works on an
archived learner's attempt (tested).

### Idempotency

Archiving an archived profile returns `200` with `changed: false`, leaves `archived_at`
unchanged, and writes **no second audit entry**. Concurrent archives produce one state
change and one entry.

### No unarchive

Specification section 6 asks for archival and says nothing about reinstatement, so there is
no unarchive route and no `DELETE`. Inventing a lifecycle the client did not ask for is how
an "archive" quietly becomes a toggle. See §11 for the operational consequence.

## 6. Control 3 — training vs assessment feedback timing

### The surface

One `Configuration` document — `scope` is unique and single-valued, so a second row cannot
exist — carrying **two enum fields**:

| Field | Values | Default |
|---|---|---|
| `training_feedback_timing` | `immediate` \| `on_completion` | `on_completion` |
| `assessment_feedback_timing` | `immediate` \| `on_completion` | `on_completion` |

Plus `config_version`, `updated_at`, `updated_by`, `updated_by_username`.

The schema is `strict: 'throw'`, so an unknown path is an error rather than a silently
dropped field, and there is no `Mixed` field and no free-form settings object anywhere. An
administrator **cannot** configure scoring, the attack-family or trigger taxonomy, selection
rules, evaluation keys, a security boundary or anything about the network — asserted by a
test that walks the schema paths.

### The defaults, and what each timing does (ADM-007)

Specification section 4 says "training mode immediate, assessment mode may defer detail
until attempt completion." **Both defaults are `on_completion`**, which is the behaviour
the product shipped with, so an unset configuration changes nothing.

Since ADM-007 the setting is enforced end to end:

- **`immediate`** — the learner's resolve response (`POST .../events` or `.../resolve` that
  resolves the run) carries `feedback_timing: "immediate"` and `feedback`: that scenario's
  authored feedback card (result, cues, safe action, impact, prevention habit) from the
  PINNED definition. The outcome screen shows it before the learner moves on.
- **`on_completion`** — the same response carries `feedback_timing: "on_completion"` and
  `feedback: null`; the card waits for the result screen.

A response that does not resolve the run carries neither key, so nothing about a scenario
still in play is released. Scoring is untouched, and assessment mode still hides the
per-scenario points whatever the timing. `effectiveFeedbackTiming(mode)` is the single,
read-only read point: a learner request never creates the settings document, and a missing
value falls back to the default.

```json
"enforcement": {
  "on_completion": "enforced - feedback is held until the attempt completes",
  "immediate": "enforced - each scenario's feedback card is released as it resolves"
}
```

### Changing it

`PATCH /api/admin/config/feedback` accepts either or both timing keys, plus an optional
`expected_config_version` and `idempotency_key`. Anything else is `422 FORBIDDEN_FIELD`.

| Situation | Response |
|---|---|
| Valid change | `200`, `changed: true`, `config_version` incremented by one |
| Value already set to that | `200`, `changed: false`, **version not bumped, nothing recorded** |
| Timing outside the enum, or not a string | `422 INVALID_FEEDBACK_TIMING` |
| No timing key at all | `422 EMPTY_CONFIG_UPDATE` |
| `expected_config_version` does not match | `409 CONFIG_VERSION_CONFLICT` |

The version check is optimistic concurrency: an instructor editing a stale view is told to
re-read rather than silently overwriting a colleague's change.

### Reproducibility

Feedback timing affects **no** score, selection or result, so **no attempt pins a
configuration version**. Pinning it would imply a reproducibility relationship that does not
exist. `ScenarioRun` scoring, the scenario fingerprint and the deterministic selection seed
are all untouched by this task.

### Assessment duration (Admin → Settings)

The same settings document holds `assessment_duration_minutes`: the time limit for
assessments **started from now on**. Allowed values are exactly 30, 45, 60, 75 and 90
minutes (`ASSESSMENT_DURATION_OPTIONS_MINUTES` in `constants/attemptTiming.js`); the default
for a fresh configuration, a missing document or a document written before this field
existed is 30 minutes (`ASSESSMENT_TIME_LIMIT_MS`). A duration already stored is kept. The schema validator and the service both reject anything else — strings, decimals,
other numbers.

* **Snapshot at start.** `createAttempt()` reads the setting inside its creation transaction
  and writes `time_limit_ms` and `expires_at = started_at + time_limit_ms` onto the attempt.
  The model's freeze hook forbids moving either afterwards, and expiry, the sweeper and
  startup recovery all read the attempt's own `expires_at`, never the setting. A setting
  change therefore cannot lengthen or shorten a running assessment, and a restart or refresh
  finds the same stored deadline.
* **Locked while running.** `PATCH` is refused with `409 ASSESSMENT_IN_PROGRESS` while any
  attempt has `status: 'in_progress'` and a deadline that has not passed. The count runs in
  the same transaction as the write, server-side; the Settings page only mirrors it. An
  attempt already past its stored deadline is treated as over (every guard treats it as
  expired and the sweeper finalises it within one tick).
* **Concurrency.** Two administrators writing at once both write the one settings document,
  so one gets a WriteConflict and is retried on a fresh snapshot — or, if it sent
  `expected_config_version`, is told `CONFIG_VERSION_CONFLICT`. Each real change bumps
  `config_version` and writes one `CONFIG_CHANGED` audit entry
  (`config_key: assessment_duration_minutes`).
* **Known limit.** A learner Start whose transaction began a moment before an admin change
  committed can still commit with the previous value. That learner keeps the duration that
  was in force when their Start began; no running deadline is ever altered.

## 7. Transactions and audit

Every one of the three controls runs inside `withEngineTransaction` and passes the session
to ADMIN-005's `append()`, which opens no transaction of its own — so nothing nests.

```
reset:   re-read under {status:'in_progress'} ► abandon unresolved runs ► set status
         ► append ATTEMPT_RESET
archive: re-read under {archived: {$ne:true}} ► set three fields ► append PROFILE_ARCHIVED
config:  load ► version check ► set changed keys ► bump version
         ► append CONFIG_CHANGED once per changed key
```

If the transaction rolls back, the state change and the audit entry disappear together. The
log can never claim a reset that did not happen, nor miss one that did. **A test proves the
coupling** by driving a reset with an actor `append()` refuses: the attempt is left
`in_progress`, no run is abandoned, and no entry exists.

| Action | Resource type | `resource_id` | Metadata |
|---|---|---|---|
| `ATTEMPT_RESET` | `attempt` | attempt id | `attempt_id`, `attempt_status` (the previous status), `scenarios_discarded`, optional `reason_code` |
| `PROFILE_ARCHIVED` | `learner_profile` | profile id | optional `reason_code` only |
| `CONFIG_CHANGED` | `configuration` | the config key | `config_key`, `config_previous_value`, `config_new_value` |

`ATTEMPT_RESET` is used rather than `SCENARIO_RESET`: ADMIN-005 names it
`PREFERRED_RESET_ACTION` because the thing reset is an attempt, never a scenario
definition. Both remain readable by the audit list route.

One audit entry **per changed configuration key** — that is the shape ADMIN-005's allowlist
is built for, since `config_key` / `config_previous_value` / `config_new_value` are
singular. Each entry is a complete statement rather than a diff needing another record to
interpret.

**An operation that changes nothing records nothing.** Re-archiving, re-resetting, or
setting a value to what it already is reports `changed: false` and writes no entry — the
same convention ADMIN-001 uses for republication. An audit log full of no-ops is one nobody
reads.

## 8. Idempotency and concurrency

| Scenario | Behaviour | Tested |
|---|---|---|
| Repeated reset of the same attempt | `changed: false`, one audit entry total | yes |
| Three concurrent resets | exactly one `changed: true`, one entry, one state change | yes |
| Reset racing the learner's completion | the transaction re-reads under `{status:'in_progress'}`; the loser gets `409` and the completed attempt is untouched | yes (completed attempt refused) |
| Stale reset after the learner started a replacement | the old id is already `abandoned` → `changed: false`; the **new attempt is never touched** | yes |
| Repeated / concurrent archive | one entry, `archived_at` never moves | yes |
| Concurrent configuration updates | one coherent state, one settings row, entries == `config_version - 1` | yes |
| Stale `expected_config_version` | `409`, value unchanged | yes |

A reset names one attempt by id, so a replacement attempt has a different id and cannot be
hit by a stale client. That is a property of the design, not of a lock.

All three controls accept an optional `idempotency_key`, passed through to ADMIN-005's
unique-index idempotency — the same convention ADMIN-001 and ADMIN-003 use. For a
configuration change the key is suffixed with the config key, so a two-key change cannot
collide on one token.

## 9. Response and privacy projections

Explicit allowlists, built by hand. No Mongoose document is ever serialised.

```
reset    attempt_id, previous_status, status, reset_at, scenarios_discarded,
         scenarios_preserved, result_available, total_score, changed
archive  profile_id, archived, archived_at, archived_by, changed
config   training_feedback_timing, assessment_feedback_timing, config_version,
         updated_at, updated_by, updated_by_username
         (+ allowed_timings, defaults, enforcement on the GET)
```

Never returned by any control route: a learner's name, their raw or normalised service
number, typed rationale, event metadata, event codes, point deltas, intent keys, the
selection seed, the frozen sequence, evaluation fields, a password or hash, or a Mongo `_id`
under that name. `updated_by` and `archived_by` are published as **ids**, never as the
`AdminUser` document, which carries a password hash.

The archive audit entry names the profile by id and carries at most a `reason_code` — a
test asserts it contains neither the learner's name nor their service number.

## 10. Offline

Nothing here touches the network or the filesystem: no `fetch`, no URL, no hostname, no
`child_process`, no file read or write — verified by grep over all four new files.
Configuration lives in the local MongoDB, never in an environment file, and **no API request
mutates `.env`**.

## 11. Known limitations

- **The learner briefing copy is static.** It tells the learner marks are kept until the
  end, which is true under the default `on_completion` but not if an instructor sets
  assessment to `immediate`.
- **No unarchive.** The specification does not ask for one. Reinstating a profile is a
  database-level operation for an operator, and there is deliberately no route.
- **Archiving does not close an in-progress attempt.** Two separate acts, two separate audit
  entries. An instructor who wants both must do both.
- **The ADMIN-002 attempt viewer does not show archival state.** Changing the viewer was
  outside this task's boundary; the archive endpoint returns the state, and the audit log
  records it.
- **A reset cannot be undone.** `abandoned` is terminal, matching the attempt lifecycle; the
  learner starts a new attempt instead.
- **`Candidate.archived` gained an index.** Additive only — no field, default or existing
  index was changed, and no backfill was run.
- **No admin frontend.**

## 12. Testing

| Suite | Tests | Runs under |
|---|---|---|
| `tests/instructorControls.test.js` | 19, no database | `npm test` |
| `tests/instructorControlsApi.test.js` | 28, real HTTP + replica set | `npm run test:engine` |

The unit suite proves what is decidable from the definitions: that the reset target is an
existing lifecycle state rather than an invented one, that a reset cannot write a score
(ENGINE-001's own validator refuses an abandoned run carrying one), that the configuration
surface is two enums and cannot be widened, and that the profile and configuration
projections leak nothing.

The integration suite plays attempts through the **real candidate API** and covers
authentication, the absence of any DELETE or candidate-facing control, reset commit and
rollback, reset idempotency and races, the full learner-resume consequence, archival with
historical-data preservation, learner access after archiving, configuration validation,
versioning, concurrency and privacy.

## 13. Not in this task

The admin frontend, admin navigation, any controls UI, Electron or native UI, scenario
manager changes, attempt viewer changes, export changes, practice mode and adaptive
difficulty. **None were started.**
