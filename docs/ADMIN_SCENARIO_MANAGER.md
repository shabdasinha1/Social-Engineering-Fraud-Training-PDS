# Scenario Manager (ADMIN-001)

**Status:** IMPLEMENTED — 6 September 2026.
**Service:** `backend/src/services/scenarioManagerService.js` · **Controller:** `backend/src/controllers/scenarioManagerController.js`
**Vocabulary:** `backend/src/constants/scenarioLifecycle.js` · **Routes:** `/api/admin/scenarios/*`
**Companions:** [`ADMIN_AUDIT_LOG.md`](ADMIN_AUDIT_LOG.md) · [`SCENARIO_DEFINITION_SCHEMA.md`](SCENARIO_DEFINITION_SCHEMA.md) · [`SCENARIO_ENGINE.md`](SCENARIO_ENGINE.md)

---

## 1. What this is

Specification section 6, first admin capability:

> "Scenario manager: create/edit/clone/deactivate versioned scenarios; validate all six
> stages and synthetic asset references before publishing."

It operates on `ScenarioDefinition` — the canonical scenario source. **There is no second
scenario model, no second validator and no parallel store.** DATA-001's `pre('validate')`
hook remains the authority on whether a scenario is well formed; this service calls it
rather than restating any of its rules.

## 2. Lifecycle and versioning

`(scenario_id, version)` was already unique and `active` already explicit. ADMIN-001 adds
one field — `lifecycle_state` — because `active` alone cannot separate a version that was
**never published** from one that was **published and later retired**, and that difference
decides whether an edit may rewrite it.

| State | `active` | Meaning | Editable in place? |
|---|---|---|---|
| `draft` | false | Never published | **Yes** |
| `published` | true | Currently live | No — an edit branches the next version |
| `retired` | false | Was published, now inactive | No — history |

```
create ──► draft ──publish──► published ──publish v(n+1)──► retired
             ▲                    │                            │
             └──── edit ──────────┘                            │
             └──── clone ─────────────────────────────────────-┘
```

### No migration was needed

`lifecycle_state` has **no schema default**. The 100 imported scenarios do not carry it and
were not rewritten; `lifecycleOf()` resolves them from `active` — all 100 are active, so all
100 read as `published`. Every version the manager writes carries the state explicitly.

`published_at` was added alongside it, null until a version is first published.

## 3. Capabilities

### Create — `POST /api/admin/scenarios`

A new scenario as **version 1, always a draft**. The specification requires validation
"before publishing", so publication is a separate, deliberate step: creation never
activates anything and writes no audit entry.

A draft is held to the **same** validator as a publication. A draft that could never be
published is not a useful thing to store, and finding out at authoring time is cheaper.

### Edit — `PATCH /api/admin/scenarios/:scenarioId/versions/:version`

- **draft** → rewritten in place. `edited_in_place: true`, `created_version: null`.
- **published or retired** → **never rewritten**. The edit becomes the next version, as a
  draft. `edited_in_place: false`, `created_version: n+1`.

The response says which happened, so the branch is never silent. This is the property the
whole design turns on: `ScenarioRun` pins `(scenario_id, definition_version)`, so rewriting
a published version would silently change the rules of runs already scored against it.

### Clone — `POST .../versions/:version/clone`

Copies **only authoring content** into a new draft. Two shapes:

- no body → a new version of the same scenario;
- `{ "target_scenario_id": "W18" }` → a brand-new scenario at version 1.

A clone into a new scenario **rewrites every asset id and stage reference** onto the new
namespace, because an asset id is namespaced by its scenario and a reference must never
resolve across one.

`toAuthoringSnapshot()` is the single copy path, shared with edit-as-new-version, so
neither can carry an `_id`, a version, an active flag, a publication timestamp or a
`createdAt` into a new document. A test asserts the snapshot contains none of them.

### Publish — `POST .../versions/:version/publish`

Validates, activates, and **retires whichever version was live**, so exactly one version of
a scenario is ever active. Idempotent: publishing what is already live changes nothing and
logs nothing. A retired version cannot be republished — clone it to a new draft first.

### Deactivate — `POST .../versions/:version/deactivate`

Flips `active` to false and the state to `retired`. **Nothing is deleted.** The definition
stays exactly where it is, so every `ScenarioRun` pinned to it still resolves; only its
availability to the selector changes. Idempotent: deactivating an already-inactive version
changes nothing and logs nothing, so a retried request cannot produce a second entry
claiming a second deactivation.

### Read

`GET /api/admin/scenarios` — a page of summaries.
`GET /api/admin/scenarios/:scenarioId` — every version, newest first.
`GET /api/admin/scenarios/:scenarioId/versions/:version` — one version in full.

## 4. Validation

Publication (and authoring) runs three layers:

1. **DATA-001's own validator** — exactly six stages, correct keys and order, permitted
   transitions, the per-stage event vocabulary, asset references resolving,
   disposition/family agreement, `legitimate_control`, trigger shape, `military_flag`,
   platform agreeing with the id prefix, and the scoring envelope.
2. **Synthetic safety** (`validateSyntheticSafety`) — every asset id namespaced to its own
   scenario, no duplicate ids, every asset inert, every stage reference resolving, and
   **every string inside every asset** checked for a host outside the reserved training
   domains or an embedded `data:` URI.
3. **Offline safety** — the importer's own `validateOfflineSafety`, reused unchanged and
   fed the document's authored text, catching a URL, an email address or a non-reserved
   host anywhere in the title, family, trigger, end state, feedback or stage prose.

> Layer 2 covers a surface the importer never needed. It consumed generated content; an
> administrator can *type* a `display_target`, so each one is held to the same reserved-host
> rule (`RESERVED_HOST_PATTERN`, the same constant — not a second pattern).

## 5. Authoring safety

`AUTHORABLE_FIELDS` is an **allowlist**. A field added to the schema later is not authorable
until someone names it there, and there is no free-form metadata field anywhere.

Server-controlled fields — `_id`, `version`, `active`, `lifecycle_state`, `published_at`,
`schema_version`, `createdAt`, `updatedAt`, `__v` — are **rejected, not ignored**. Ignoring
would be quieter and worse: a client that thinks it set `active: true` and got a 200 has
been misled about whether its scenario is live. `scenario_id` is accepted on create only.

Credentials, payment data, live URLs, external hosts and executable content are refused by
layers 2 and 3 above; the schema's own enums refuse anything outside the platform, level,
disposition, family and trigger vocabularies.

## 6. Transactions and audit

Publication and deactivation each commit their state change **and** their audit entry in
one `withEngineTransaction`, using ADMIN-005's session-aware `append()`. The audit service
opens no transaction of its own, so nothing nests.

```
publish:  read ► verify still a draft ► retire the live version ► activate ► append SCENARIO_PUBLISHED
deactivate: read ► verify still active ► retire ► append SCENARIO_DEACTIVATED
```

If the transaction rolls back, both the state change and the audit entry disappear.

| Situation | Audit |
|---|---|
| Publication succeeds | `SCENARIO_PUBLISHED`, `succeeded`, with `previously_active_version` when one was retired |
| Publication refused by validation | `SCENARIO_PUBLISHED`, `failed`, `error_code` `SCENARIO_VALIDATION_FAILED` or `SCENARIO_UNSAFE_CONTENT` |
| Deactivation succeeds | `SCENARIO_DEACTIVATED`, `succeeded` |
| Republish / re-deactivate (no change) | **nothing** — no change happened |
| Create, edit, clone, any GET | **nothing** — no new action type was invented |

Metadata uses only ADMIN-005's existing allowlist: `scenario_id`, `scenario_version`,
`scenario_platform`, `previously_active_version`. Never scenario content, never a request
body, never a stack trace — a failed publication records a stable **category**, and a test
asserts the entry carries neither a source location nor the scenario's title.

## 7. Concurrency and idempotency

Single-node local replica set, so no distributed locking — optimistic state checks instead.
Both transitions re-read the version **inside the transaction** and verify its state before
writing, so two administrators publishing at once cannot both win: the second sees
`SCENARIO_ALREADY_PUBLISHED`. Deactivation losing the race simply reports `changed: false`.

Both accept an optional `idempotency_key`, passed through to the audit append, so a retried
request records once.

## 8. Historical ScenarioRun safety

Proven by test, not asserted:

- publishing v1, editing it, and publishing v2 leaves **v1 byte-identical** (the whole
  document is snapshotted and compared);
- a resolved `ScenarioRun` pinned to `(W24, 1)` still loads the same `_id` afterwards;
- a deactivated version keeps its stages, assets and evaluation and stays resolvable;
- deactivation removes the version from the `active` pool selection reads, without removing
  the document;
- publishing does not widen `toCandidateJSON()` — the candidate projection still hides the
  evaluation block, level, disposition, family, triggers, military flag and the new
  lifecycle fields.

## 9. API and authorisation

Every route is behind `requireAdmin` — the existing signed `admin_session` cookie resolved
against `AdminUser`. **No second authentication system.** A candidate session is rejected
with `401 NO_ADMIN_SESSION`, never downgraded, and a test drives all eight routes
unauthenticated.

Admin responses carry authoring data **including the evaluation block** — this is an
authenticated instructor surface and an author cannot edit what they cannot see. They carry
**no learner data**: no attempt, run, event, typed rationale, score or profile.

Listing is bounded and allowlisted: 8 filters, 3 deterministic sorts (each with `_id` as a
tiebreak so paging is stable), page size capped at 100. **No client-supplied Mongo operator
can reach a query** — filter values are coerced with `String()`, so `{$ne: …}` becomes
`"[object Object]"` and matches nothing. Tested at both the HTTP and service levels.

## 10. Known limitations

- **`SCENARIO_ID_PATTERN` allows only `01`–`25` per platform, and production uses all 100
  ids.** Creating a genuinely new scenario in production would therefore fail with no free
  id. Clone-to-new-version and edit-as-new-version are unaffected and are the paths that
  matter for the existing bank; widening the pattern is a DATA-001 change and was out of
  scope here.
- **Create and edit emit no audit entry.** ADMIN-005's vocabulary covers publication,
  resets, exports and configuration, and no action type was invented for authoring. A draft
  that is never published changes nothing a learner can reach.
- **No admin frontend.** This task is backend and API only.
- **No delete.** Deactivation is the only removal, by design — nothing is ever destroyed.
- The publish-failure audit entry is written **outside** a transaction, because the
  publication itself never started; if that write fails it is swallowed so it cannot mask
  the validation error the administrator actually needs to see.

## 11. Testing

| Suite | Tests | Runs under |
|---|---|---|
| `tests/scenarioManager.test.js` | 26, no database | `npm test` |
| `tests/scenarioManagerApi.test.js` | 32, real HTTP + replica set | `npm run test:engine` |

The unit suite covers the input boundary, the authoring snapshot, the lifecycle inference
and every synthetic-safety and publication-validation rule. The integration suite covers
what only a database can show: the lifecycle end to end, the versioning guarantee, clone
isolation, transactional audit on publish and deactivate, idempotency, historical run
safety, and the listing and injection boundaries.

## 12. Not in this task

ADMIN-002 attempt viewer, ADMIN-003 CSV/PDF export, ADMIN-004 instructor controls, and any
admin frontend. None were started.
