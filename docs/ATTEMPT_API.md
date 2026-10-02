# Candidate Attempt API (API-001)

**Status:** IMPLEMENTED — 4 September 2026.
**Routes:** `backend/src/routes/attemptRoutes.js` · **Controller:** `backend/src/controllers/attemptController.js`
**Services reused:** `attemptService.js`, `scenarioSelectionService.js`, `scenarioEngineService.js`
**Frontend client:** `frontend/src/services/attemptApi.js`
**Companions:** [`SCENARIO_ENGINE.md`](SCENARIO_ENGINE.md) · [`SCENARIO_SELECTION.md`](SCENARIO_SELECTION.md) · [`SCENARIO_DEFINITION_SCHEMA.md`](SCENARIO_DEFINITION_SCHEMA.md)

---

## 1. What this layer is

A thin HTTP surface over services that already exist. The controllers translate requests
into existing service calls and nothing more — they never compute a score, decide a stage
transition, choose a scenario, or read evaluation data.

```
HTTP  →  attemptController  →  attemptService        (ownership, projection, completion)
                            →  scenarioSelectionService  (which 10 scenarios)
                            →  scenarioEngineService     (state machine, scoring, ledger)
```

The legacy `/api/assessments` routes are untouched and continue to serve the existing
40-scenario journey. Both surfaces run side by side while the frontend migrates.

## 2. Routes

All under `/api/attempts`, all behind `requireCandidate`.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/attempts` | Start an attempt, or return the in-progress one |
| `GET` | `/api/attempts/current` | The resumable attempt, or `null`. Never creates one |
| `GET` | `/api/attempts/:attemptId` | Candidate-safe attempt state |
| `GET` | `/api/attempts/:attemptId/current-run` | Current run + its pinned scenario content |
| `POST` | `/api/attempts/:attemptId/runs/:runId/events` | One learner action |
| `POST` | `/api/attempts/:attemptId/runs/:runId/resolve` | Finish a scenario (resolve-stage action codes only) |
| `POST` | `/api/attempts/:attemptId/complete` | Complete after all ten resolve |
| `GET` | `/api/attempts/:attemptId/result` | Candidate-safe result |

`/current` is declared before `/:attemptId` so it is not captured as an id.

### Why `/resolve` exists alongside `/events`

Resolution *is* an engine intent, so `/resolve` adds no rules of its own — it calls the
same `submitIntent`. It exists because resolution is where the learner submits their
rationale and where the frontend needs an unambiguous "finish this scenario" call. It is
scoped to `RESOLVE_INTENTS` and cannot resolve a run the engine would not.

## 3. Authentication and ownership

Authentication reuses the existing `requireCandidate` middleware: a signed, httpOnly
session cookie resolved to `req.candidate`. There is no new auth mechanism.

Ownership is two hops, both server-side:

```
req.candidate._id  ──must equal──  Attempt.profile_id
Attempt._id        ──must equal──  ScenarioRun.attempt_id
```

A `profile_id` in a request body is never consulted.

> ### A deliberate deviation: 404, not 403
>
> The task brief lists `403` for an ownership violation. This API returns **`404`** for
> another candidate's attempt or run instead, matching the existing `findOwnAssessment`
> convention already in the codebase.
>
> A `403` confirms the id exists and turns the endpoint into an enumeration oracle; a `404`
> reveals nothing. `403` is therefore not used for cross-candidate access at all.

## 4. Fields the client may never send

Rejected with `422 FORBIDDEN_FIELD` — **rejected, not ignored**, so a client attempting to
steer the server finds out immediately:

`profile_id` · `seed` · `scenario_ids` · `scenario_sequence` · `composition` · `selection` ·
`selection_algorithm_version` · `points_delta` · `points` · `score` · `score_running` ·
`score_0_10` · `total_score` · `event_code` · `next_stage` · `current_stage` · `stage` ·
`sequence` · `outcome_code` · `status` · `expected_action` · `evaluation` ·
`canonical_family` · `canonical_triggers` · `disposition` · `level` · `military_flag` ·
`definition_version`

## 5. Request and response shapes

### `POST /api/attempts`

Body: `{ "mode": "assessment" | "training" }` (optional, defaults to `assessment`).
`201` when created, `200` when an in-progress attempt is returned instead.

```json
{
  "created": true,
  "attempt": {
    "attempt_id": "...", "mode": "assessment", "status": "in_progress",
    "total_scenarios": 10, "started_at": "...", "completed_at": null, "total_score": null,
    "progress": { "resolved": 0, "total": 10, "all_resolved": false },
    "current_run": {
      "run_id": "...", "ordinal": 1, "platform": "whatsapp",
      "current_stage": "notify", "status": "active"
    }
  }
}
```

### `GET /api/attempts/:attemptId/current-run`

`run` and `scenario` are `null` once all ten are resolved — the frontend's signal to call
`/complete`.

```json
{
  "run": {
    "run_id": "...", "ordinal": 1, "scenario_id": "W01", "version": 1,
    "platform": "whatsapp", "current_stage": "notify", "status": "active",
    "last_sequence": 0, "started_at": "...", "resolved_at": null
  },
  "scenario": {
    "id": "...", "scenario_id": "W01", "version": 1, "platform": "whatsapp",
    "synthetic": { "sender": null, "prior_context": null, "assets": [] },
    "stages": [ { "index": 1, "key": "notify", "ui_to_build": "...",
                  "transitions": [...], "events": [...], "asset_refs": [] } ]
  },
  "actions": { "gen-c01": "ac_3f1c…", "w01-c01": "ac_9b07…", "...": "..." },
  "attempt": { ...attempt state... }
}
```

`ordinal` is added by this layer rather than by `ScenarioRun.toCandidateJSON()`: the
frontend needs it for the "Scenario n of 10" progress card (§3), but it is a position
within an attempt, not run state, so ENGINE-001's key-exact projection stays untouched.

`actions` (SECURITY-001) maps every neutral control id the run may use - the 37 generic
action-sheet ids and, for an authored scene, its own `<scenario>-cNN` ids - to an opaque,
per-run **action code**. It is the only way a client can name an action. See
[`NEUTRAL_LEARNER_ACTION_CONTRACT.md`](NEUTRAL_LEARNER_ACTION_CONTRACT.md).

### `POST .../runs/:runId/events`

```json
{
  "action_code": "ac_3f1c09d2e8a4b7c61d05",
  "intent_key": "uuid-per-learner-action",
  "expected_stage": "notify",
  "synthetic_target_id": null,
  "metadata": { "dwell_ms": 1200 },
  "client_ts": "...", "elapsed_ms": 1200
}
```

Only `action_code` and `intent_key` are required. The server translates the code for this run
into the engine intent; a body that carries `intent` (or `verify_source`, or any metadata key
other than `dwell_ms`, `open_latency_ms`, `link_hover_ms`) is refused with 422
`FORBIDDEN_FIELD`. A missing, malformed, unknown, other-run or other-scenario code is 422
`INVALID_ACTION` ("That action is not available here."). The control's own stage is the
engine's expected stage, so a code for another stage is 409 `STALE_STATE`; an
`expected_stage` that disagrees with the code is 422 `INVALID_ACTION`. Response:

```json
{
  "run": { ...candidate-safe run... },
  "event": { "sequence": 1, "stage": "notify", "accepted_at": "..." },
  "consequence": null,
  "view": null,
  "score_visibility": "hidden",
  "score_0_10": null,
  "outcome_code": null,
  "attempt": { ...attempt state... }
}
```

A risky branch action returns a `consequence` — a **rendering instruction**, never an
execution: `{ "kind": "simulated_browser_open", "target": null, "inert": true, "executes": false }`.

`duplicate: true` is added when a repeated `intent_key` replayed the original outcome.

SECURITY-001: the event code is kept in the ledger but no longer returned - it is the scoring
verdict on the choice just made. `view` names the inert panel to open once the action is
accepted (`sender`, `profile`, `link`, `file`, `qr`, `directory` or `null`).

### `POST .../runs/:runId/resolve`

As above, restricted to codes of resolve-stage controls (other codes: 422 `INVALID_ACTION`),
and accepting an optional `rationale` (≤250 characters,
single line, no markup). The rationale is stored on the run, **never written to the event
ledger and never echoed back**.

### `POST /api/attempts/:attemptId/complete` · `GET .../result`

```json
{
  "result": {
    "attempt_id": "...", "status": "completed", "mode": "assessment",
    "total_score": 100, "max_score": 100,
    "scenarios_resolved": 10, "scenarios_total": 10,
    "started_at": "...", "completed_at": "...",
    "scenarios": [
      { "ordinal": 1, "platform": "whatsapp", "score_0_10": 10,
        "outcome_code": "resolve_report", "final_stage": "resolve", "resolved_at": "..." }
    ]
  }
}
```

## 6. Candidate-safe projection

Never present in any response on this surface:

`seed` · `selection` metadata · `composition` · `scenario_sequence` · `profile_id` ·
`evaluation` · scenario `title` · `level` · `disposition` · `family` ·
`canonical_family` · `trigger` · `canonical_triggers` · `military_flag` ·
`legitimate_control` · `end_state` · feedback · expected actions · per-stage scoring ·
`score_running` · `rationale`

`score_0_10` and `outcome_code` are released **only** once a run resolves, gated by
`score_visibility`. Section 3 hides the running score in assessment mode, so it is never
sent mid-attempt.

Tests assert this by leaked **substring**, not just by key name — the actual scenario
title, family and trigger strings are checked against the serialised response.

## 7. Commit ordering

```
learner action → engine transaction { w:1, j:true } → Event + ScenarioRun committed
                                                    → THEN the response is built
```

`/current-run` reads committed state only, so a mid-scenario refresh returns the same run
at the same stage, and the next scenario appears only after the previous one is durably
resolved. A test walks every stage asserting the current run does not advance early.

## 8. Idempotency and concurrency

Inherited unchanged from ENGINE-001:

- Repeating an `intent_key` returns the **original** outcome with `duplicate: true` — one
  event, one scoring effect.
- `expected_stage` mismatch → `409 STALE_STATE` carrying `current_stage` and
  `last_sequence` so the client can resync.
- `POST /complete` is idempotent: a repeat call returns the already-completed attempt.
- Starting an attempt twice resumes rather than creating a second.

## 9. Errors

Existing envelope: `{ "error": { "code", "message", "details" } }`.

| Status | Codes |
|---|---|
| 401 | `NO_SESSION` |
| 404 | attempt/run not found, **including another candidate's** (§3) |
| 409 | `INVALID_TRANSITION` · `STALE_STATE` · `RUN_NOT_ACTIVE` · `ATTEMPT_NOT_IN_PROGRESS` · `SCENARIOS_OUTSTANDING` · `ATTEMPT_NOT_COMPLETE` · `SELECTION_ATTEMPT_IN_PROGRESS` |
| 422 | `FORBIDDEN_FIELD` · `INVALID_INTENT` · `INVALID_RATIONALE` · `INVALID_METADATA` · `INVALID_TARGET` |
| 503 | `TRANSACTION_UNAVAILABLE` |
| 500 | `INTERNAL_ERROR` (message suppressed in production) |

`errorHandler` was extended to surface engine and selection domain errors — both already
carry `isDomainError`, a stable `code` and an intended `status` — instead of collapsing
them into a 500. `status` is clamped into the error range because `ENGINE_ERRORS` maps
`DUPLICATE_INTENT` to `200` for the normal replay path; if it ever throws it is a conflict.

No MongoDB error or stack trace reaches a candidate.

## 10. Offline posture

Unchanged. The API talks only to local MongoDB. No external call, telemetry, CDN or cloud
dependency was added. The API binds `127.0.0.1` (DEPLOY-001) and that was not touched here.

## 11. Testing

`backend/tests/attemptApi.test.js` — **25 tests**, real HTTP against a real Express app on
an ephemeral port, a real replica set, and real signed session cookies. Nothing is mocked:
the ownership boundary and the candidate-safe projection are proven over the wire.

```bash
npm run test:engine     # starts a throwaway replica set, runs engine + selection + API
```

Covered: start/resume · exactly ten runs via the real selector · unauthenticated rejection
on every route · cross-candidate access on attempt, run and result · a run from another
attempt · retrieval without creation · pinned-version content · hidden-data leakage by
substring · valid and illegal events · injection of points/stage/score/seed · duplicate
`intent_key` · stale `expected_stage` · events after resolution · resolve-intent scoping ·
rationale validation, storage and non-echo · refresh/resume · commit ordering · completion
guards · idempotent completion · immutability after completion · result projection · and a
deliberately unsafe run clamping to 0.

## 12. Not in this task

Behaviour analytics, attack-family/trigger breakdown, path replay, feedback and
remediation are **RESULT-001** — and the taxonomies are server-only, so they must not
appear on this surface. Admin APIs, the dashboard orchestrator UI and Electron are all
later tasks. The frontend still runs the legacy journey; `attemptApi.js` is the client for
this contract when the UI migrates.
