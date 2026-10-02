# Attempt Viewer (ADMIN-002)

**Status:** IMPLEMENTED — 7 September 2026.
**Service:** `backend/src/services/attemptViewerService.js` · **Controller:** `backend/src/controllers/attemptViewerController.js`
**Vocabulary:** `backend/src/constants/attemptViewer.js` · **Routes:** `/api/admin/attempts/*`, `/api/admin/learners`
**Companions:** [`RESULT_API.md`](RESULT_API.md) · [`ADMIN_AUDIT_LOG.md`](ADMIN_AUDIT_LOG.md) · [`ADMIN_SCENARIO_MANAGER.md`](ADMIN_SCENARIO_MANAGER.md) · [`SCENARIO_ENGINE.md`](SCENARIO_ENGINE.md)

---

## 1. What this is

Specification section 6, second admin capability:

> "Attempt viewer: filter by learner/date; show scores, action path, remediation without
> sensitive typed content."

A **read-only** instructor view over attempts, completed and in progress. It is backend and
API only — there is no admin frontend in this task.

**It computes no result of its own.** For a completed attempt the authority is
`buildAttemptResult()` in `attemptResultService.js` — the same RESULT-001 projection the
learner's own result screen is built from. Scoring, the missed-threat / false-positive
classification, the behaviour breakdown, the path replay, remediation and the comparability
gate all come from there, unchanged and unrepeated. This service adds the instructor-only
classification (disposition, family, trigger per scenario) and re-serialises through an
allowlist.

There is deliberately **no second authoritative result model**. If the two ever disagreed,
an instructor and a learner would be looking at different scores for the same attempt.
`ScenarioRun.score_0_10` and the `Attempt.total_score` it sums to remain authoritative, and
the result service's own integrity check still refuses a result whose stored total and
ledger disagree — the instructor gets that 500 too, rather than a quietly repaired number.

## 2. Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/attempts` | Bounded, filtered, deterministically ordered page of attempt summaries |
| GET | `/api/admin/attempts/:attemptId` | One attempt in full instructor detail |
| GET | `/api/admin/learners` | Bounded lookup to turn a name / service number into a `profile_id` |

**GET only.** There is no POST, PUT, PATCH or DELETE anywhere in this feature; those verbs
fall through to the 404 handler because no route matches them. Resetting an attempt is
ADMIN-004 and will arrive with its own transaction and its own `ATTEMPT_RESET` audit entry.

## 3. Authentication and authorisation

Every route sits behind the existing `requireAdmin` — the signed `admin_session` cookie
resolved against `AdminUser`. **No second authentication system was created.**

| Caller | Result |
|---|---|
| Anonymous | `401 NO_ADMIN_SESSION` |
| Candidate session | `401 NO_ADMIN_SESSION` — rejected, never downgraded |
| Authenticated administrator | `200` |

There is **no candidate-facing attempt viewer**. A learner still reaches only their own
attempt through `/api/attempts/:id/result`, and another learner's attempt is still a 404
there. The admin sees every attempt regardless of profile; that is the point of the surface.

## 4. Filters

`GET /api/admin/attempts` accepts **exactly these** query parameters. An unknown one is a
`422 FORBIDDEN_FILTER` — rejected, not ignored, because a client that thinks it filtered and
got a 200 has been told something untrue about which attempts it is looking at.

| Parameter | Type | Notes |
|---|---|---|
| `profile_id` | ObjectId string | Validated with `isValidObjectId`; anything else is `422 INVALID_FILTER` |
| `service_no` | string ≤ 60 | Normalised with the login's own `normaliseIdentifier()`, then matched **exactly** against `identifierNormalised`. Resolved to profile ids *before* the attempt query |
| `status` | `in_progress` \| `completed` \| `abandoned` | Closed vocabulary, reused from `ATTEMPT_STATUSES` |
| `mode` | `assessment` \| `training` | Closed vocabulary, reused from `ATTEMPT_MODES` |
| `started_from` | date | Lower bound, inclusive |
| `started_to` | date | Upper bound, inclusive |
| `page` | integer ≥ 1 | |
| `page_size` | integer 1–100 | Default 25 |

An unknown **learner** (a `service_no` that matches no profile) is an empty page, not an
error: browsing is not a failure.

### Date convention

**The date filter applies to `started_at`.** Not `completed_at` — one unambiguous
convention, so a range means the same thing for a finished and an unfinished attempt.

Two shapes are accepted and nothing else:

| Input | Meaning |
|---|---|
| `2026-09-07` as `started_from` | `2026-09-07T00:00:00.000Z` |
| `2026-09-07` as `started_to` | `2026-09-07T23:59:59.999Z` — the **whole** UTC day |
| `2026-09-07T04:42:50.425Z` | exactly that instant |
| `2026-09-07T10:12:50+05:30` | exactly that instant |

Everything is **UTC**. A calendar day given as the upper bound means the *end* of that day;
treating it as midnight would silently exclude everything that happened on the day the
instructor asked for, which is the most likely way to read a date filter wrongly.

Refused, never guessed at: `yesterday`, `07/09/2026`, `Sept 7 2026`, a bare epoch number,
`2026-9-7`, `2026-09-07 04:42`, and a naive `2026-09-07T04:42:50` with no offset. `new Date()`
accepts several of those and interprets some in the machine's local timezone, which would
make the same request mean different things on two machines.

Calendar validity is checked **arithmetically before parsing**: `new Date('2026-02-30T00:00:00Z')`
does not fail, it rolls silently into 2 March. The Y-M-D components are round-tripped through
`Date.UTC` and a mismatch is `422 INVALID_DATE`.

| Condition | Error |
|---|---|
| Unparseable or impossible date | `422 INVALID_DATE` |
| `started_to` before `started_from` | `422 INVALID_DATE_RANGE` |
| Range longer than 366 days | `422 DATE_RANGE_TOO_LARGE` |

## 5. Learner lookup

`GET /api/admin/learners` exists only so "filter by learner" is usable: it turns a name or
service-number prefix into a `profile_id`.

| Parameter | Notes |
|---|---|
| `service_no` | 2–60 chars, normalised, **anchored prefix** match on `identifierNormalised` |
| `display_name` | 2–60 chars, **anchored prefix**, case-insensitive |
| `limit` | 1–50, default 20 |

Both patterns are regex-escaped and anchored with `^` — never a free substring scan, never a
client-supplied regex, and never a search across a field that is not the learner's own name
or service number. With no parameters it returns the most recently created profiles, capped
by `limit`. Ordering is `createdAt` descending with `_id` as the tie-break.

### The learner fields that are published

The specification's section 2 `LearnerProfile` contract, mapped onto the existing `Candidate`
model (15.16 keeps it as the LearnerProfile of record; the rename is conceptual):

| Published | Source | Notes |
|---|---|---|
| `profile_id` | `_id` | |
| `display_name` | `name` | |
| `service_no_masked` | derived from `identifier` | Last four characters only |
| `created_at` | `createdAt` | Detail views only |

**Not published, ever:** the raw `identifier`, `identifierNormalised` (the profile key and
what a filter is matched against, never what a response carries), and `seenScenarios`.
`password`, `phone`, `email`, `rank`, `aadhaar` and biometric fields do not exist on the
model and were not introduced — section 2 prohibits them in v1.

Masking follows section 2's "masked to the last four characters on every later screen",
mirroring `frontend/src/utils/maskIdentifier.js` exactly so one convention exists. It is
applied **server-side** so a number cannot be read off the wire even if a future admin
frontend forgets to mask it. The bullet run is capped at 8, so the mask does not leak the
length either.

## 6. Pagination and ordering

- Page size default 25, hard maximum 100. Over the cap is `422 INVALID_PAGINATION`.
- `page` and `page_size` must be whole numbers — `0`, `-1`, `1.5`, `1e3` and `two` are all
  refused rather than rounded or defaulted.
- Order is **fixed**: `started_at` descending, `_id` descending as the stable tie-break.
  There is no client-selectable sort — paging is only stable if two attempts started in the
  same millisecond can never swap places between page 1 and page 2, and an
  instructor-chosen sort would be a second thing to validate for no stated requirement.

## 7. List projection

An allowlist, built by hand. Thirteen keys, and no per-scenario or event data of any kind:

```
attempt_id, profile {profile_id, display_name, service_no_masked},
mode, status, started_at, completed_at, duration_ms,
total_score, max_score, scenarios_total, scenarios_resolved,
content_version, result_available
```

`total_score` is **null unless the attempt is completed**, even if the stored cache were
somehow populated. `scenarios_resolved` comes from a single grouped aggregate over the runs
of the attempts on the page — not a count per attempt, which would be an N+1.

**The list never dumps ScenarioEvents**, and carries no `path`, no `scenario_sequence`, no
`selection` and no `seed`. A list is for locating an attempt; the moment it carries event
data it becomes a bulk export of the ledger.

## 8. Detail projection

```
attempt   attempt_id, profile{…, created_at}, mode, status,
          started_at, completed_at, duration_ms,
          scenarios_total, scenarios_resolved,
          result_available, total_score, max_score, resolved_points,
          content_version, taxonomy_version, trigger_taxonomy_version
summary   the RESULT-001 summary, or null for an unfinished attempt
platform_coverage   [{platform, label, scenarios, resolved}]
scenarios [ … see below … ]
behaviour by_platform, by_family, by_trigger, by_stage
behaviour_scope     {scope: complete|partial, scenarios_included, scenarios_total}
remediation         {available, reason, recommendations[]}
comparison          {available, reason?, …}
```

**`seed` is not exposed.** It is not needed to read an attempt and it describes how the bank
was sampled. The whole `selection` block — composition, quotas, relaxations, recent-exclusion
window — is likewise absent. `content_version` and the two taxonomy versions **are** published,
because they are what makes a comparison legitimate and an instructor needs to see why one
was refused.

### A resolved scenario

```
ordinal, scenario_ref, platform, platform_label, status, resolved,
score_0_10, max_score,
outcome_code, outcome_class, final_stage,
disposition, canonical_family, family_label, canonical_triggers, trigger_labels,
sender, preview,
started_at, resolved_at, duration_ms,
path[{step, stage, action}],
feedback{result, cues, safe_action, impact, prevention_habit}
```

`disposition`, `canonical_family` and `canonical_triggers` are the **instructor-only** half —
what the item actually was. The learner's own result publishes family and trigger in
aggregate only. They are read from the run's **pinned** `(scenario_id, definition_version)`,
never "the latest active version", so a republished scenario cannot change what an old
attempt is reported as.

`sender` and `preview` are what the learner saw. The authoring **title** is never published:
DATA-001 classified it as evaluation data, because "Cloned Friend in Distress" states the
answer outright.

### A pending scenario

```
ordinal, scenario_ref, platform, platform_label, status, resolved:false,
current_stage, started_at, score_0_10:null, max_score
```

Ten keys, and none of them evaluative. See section 10.

## 9. Result reuse

| Block | Source |
|---|---|
| `total_score`, `summary` | `buildAttemptResult()` → `assertResultIntegrity()` |
| per-scenario `score_0_10`, `outcome_code` | `ScenarioRun`, verbatim |
| `outcome_class` (missed threat / false positive) | `classifyOutcome()` |
| `path` | `pathFromEvents()` + `PATH_LABELS` |
| `feedback` | the scenario's own authored `evaluation.feedback` |
| `behaviour` | `behaviourBreakdown()` |
| `remediation` | `remediationFor()` |
| `comparison` | `comparisonFor()` |

**Nothing above was reimplemented.** `attemptResultService.js` was **not modified** — it
required no ownership check and no candidate-specific assumption, so no additive change was
needed to make it serve an instructor. The candidate result API's behaviour and payload are
byte-for-byte unchanged, and a test asserts the instructor's totals, per-scenario scores,
outcome classes, paths, breakdown and remediation are `deepEqual` to what the learner's own
result endpoint returns for the same attempt.

## 10. Incomplete attempts

An unfinished attempt has some scores, some path and no remediation, and the response says
so rather than filling the gaps. `buildAttemptResult()` correctly refuses to build a result
at all for one, so this view is assembled from the same **exported pure helpers**
(`pathFromEvents`, `classifyOutcome`, `behaviourBreakdown`) — no scoring maths of its own.

| | Behaviour |
|---|---|
| `total_score` | **null**. Never a partial sum wearing the name of a 0–100 total |
| `resolved_points` | The sum of the resolved scenarios, published under its own name |
| `summary` | `null` |
| Resolved scenarios | Score, outcome class, disposition, family, triggers and path replay. **The authored feedback card and the item preview are not released** — those come from the RESULT-001 projection, which exists only for a finished attempt, so an in-progress view carries `feedback: null`, `sender: null` and `preview: null`. Corrected 7 September 2026: this row previously claimed feedback was included, which the code never did |
| Unresolved scenarios | Listed as pending: ordinal, platform, `current_stage`, `score_0_10: null`. **No disposition, no family, no trigger, no feedback, no path** |
| `behaviour` | Computed from the resolved scenarios only, and labelled `partial` with `scenarios_included` |
| `remediation` | `{available: false, reason: "attempt_not_complete", recommendations: []}` |
| `comparison` | `{available: false, reason: "attempt_not_complete"}` |

Weak families cannot be judged from an unfinished attempt, and section 7's comparability gate
is about finished ones — so neither is guessed at.

**Viewing does not alter learner state.** No attempt is completed, resolved, advanced or
repaired. A test plays five scenarios, views the attempt twice as an administrator, and
asserts the attempt is still `in_progress`, still has five resolved runs, and that the
learner's own `current-run` still returns ordinal 6.

## 11. Path replay

The compact `{step, stage, action}` timeline, from `pathFromEvents()` and the RESULT-001
`PATH_LABELS` map — the same projection the learner receives, and the stages are the section 7
vocabulary: notify, open, **inspect, branch, verify, resolve**.

Nothing raw travels with it. **No** `event_id`, `event_code`, `points_delta`, `metadata`,
`intent_key`, `synthetic_target_id`, `client_ts` or `server_ts`. An event whose code has no
label is dropped, so a code added later stays invisible until someone deliberately labels it.

The instructor is not given the raw event vocabulary that the learner-facing projection
intentionally hides: publishing it would publish the scoring table alongside it.

## 12. Behaviour breakdown

All four section 7 axes, from `behaviourBreakdown()` unchanged:

| Axis | Key |
|---|---|
| Platform | `by_platform` |
| Attack family / case type | `by_family` |
| Persuasion technique / trigger | `by_trigger` |
| Decision stage | `by_stage` |

Each bucket carries `scenarios`, `points`, `max_points`, `missed_threats` and
`false_positives` — no point deltas and no event codes. A scenario carrying several triggers
counts once in each of its trigger buckets, so trigger totals may exceed ten by design.

**No new taxonomy was derived.** Families and triggers are the existing canonical values from
`ATTACK_FAMILY_TAXONOMY.md` / `TRIGGER_TAXONOMY.md`, labelled through the existing
`FAMILY_LABELS` / `TRIGGER_LABELS` maps.

For an incomplete attempt the breakdown is honest rather than absent: it is computed from
the resolved scenarios only and `behaviour_scope.scope` is `partial`. Nothing is filled in.

## 13. Remediation

From `remediationFor()`, unchanged: two to three **weak families**, worst first, each with a
blame-free reason and how many ACTIVE scenarios exist in that family.

**Families, not scenario ids.** Naming the scenarios to practise would hand out a partial
answer key for a bank the learner will meet again. That architecture is preserved here and
is a documented limitation, not an omission: **practice mode does not exist yet**, so there
is no id for a recommendation to resolve against. ADMIN-002 introduces no practice-mode
execution and exposes no scenario answer key to support remediation.

Nothing diagnoses. The reasons describe what happened in this attempt, never a trait, a
susceptibility, an emotional state or a personality — section 5 and section 7 both forbid it.

## 14. Comparison rules

From `comparisonFor()`, unchanged. The previous attempt is looked up **scoped to this
attempt's own `profile_id`**, so another learner's data can never enter the query.

| Situation | Response |
|---|---|
| Comparable previous attempt | `{available: true, previous_attempt_id, previous_total_score, previous_completed_at, delta, attempts_compared}` |
| No previous attempt | `{available: false, reason: "no_previous_attempt"}` |
| Mode or version differs | `{available: false, reason: "not_comparable", incomparable_on: [field names]}` |
| Attempt not finished | `{available: false, reason: "attempt_not_complete"}` |

Comparability requires **all four** of `mode`, `content_version`, `taxonomy_version` and
`trigger_taxonomy_version` to match. `incomparable_on` carries **field names only** — no
value from the other attempt is echoed. Nothing ever implies a meaningful comparison exists
when it does not.

## 15. Privacy exclusions

The hard requirement: *"without sensitive typed content."*

**Never returned, by any route:**

| Category | Fields |
|---|---|
| Typed learner content | `ScenarioRun.rationale` — the learner's own one-line explanation. Section 4 says it is never scored; it is never published to an instructor either |
| Ledger internals | `event_id`, `event_code`, `points_delta`, `metadata`, `intent_key` (the idempotency key), `synthetic_target_id`, `sequence`, `client_ts`, `server_ts` |
| Run internals | `run_id`, `score_running`, `last_sequence` |
| Attempt internals | `seed`, `selection`, `scenario_sequence` |
| Identity | raw `identifier`, `identifierNormalised`, `seenScenarios`. `password`, `otp`, `payment`, `biometric`, `aadhaar`, `phone`, `email` and `rank` do not exist on the model and were not added |
| Answer keys | `evaluation`, `expected_actions`, `scoring`, `stages`, `end_state`, the authoring `title` |
| Mongo internals | `_id`, `__v` — every id that is published is published under its own name (`attempt_id`, `profile_id`) |

Enforced by **explicit hand-written serialisers**, not by `select: false` and not by deleting
keys off a Mongoose document. Every response object is constructed key by key, so a field
added to a model later is invisible here until someone names it.

Proven, not asserted:

- every attempt in the integration suite submits a distinctive typed rationale, it is
  confirmed to be **stored**, and then confirmed absent from all three routes;
- sensitive-looking values are **injected** directly into `ScenarioEvent.metadata`, and into
  unknown top-level fields on the event, run, attempt and profile documents, and every route
  is checked to be free of them;
- an unresolved scenario is checked against its own pinned definition to confirm the
  response contains neither its disposition, nor its family, nor its authored safe action.

## 16. Query safety

- **Filters are an allowlist.** An unknown query key is a `422`.
- **Every filter value must arrive as a plain string.** Objects and arrays are refused
  *before* any query is built — not defused by a later `String()`, but never carried that
  far. Express 5's default parser turns `?status[$ne]=x` into the literal key `status[$ne]`,
  which the allowlist refuses; a repeated `?status=a&status=b` arrives as an array, which the
  scalar guard refuses. Both are tested over real HTTP.
- **No client-supplied Mongo document, field name, sort expression or projection is ever
  accepted.** Query documents are assembled in exactly one function from validated values.
- **No `$where`, no `$expr`, no client-built `$gt`/`$lt`.** The only range operators are the
  two the service itself builds from validated `Date` objects.
- Every list is bounded (page size ≤ 100) and every date range is bounded (≤ 366 days).

### N+1 avoidance

| Route | Queries |
|---|---|
| List | 3–4: optional profile resolution for `service_no`, the attempts + their count, one grouped run-count aggregate, one profile fetch for the page |
| Detail (complete) | 6: attempt, runs, profile, then the result service's own definitions + events, plus one classification query |
| Detail (in progress) | 4–5: attempt, runs, profile, classification, and events **only if** at least one run is resolved |

The list never reads events. The detail reads only the pinned definitions for the runs it is
showing, and only the events of **resolved** runs.

### Index

One additive index was added to `Attempt`:

```js
attemptSchema.index({ started_at: -1, _id: -1 })
```

The instructor list is ordered newest-started first across **all** learners; the two existing
indexes both lead with `profile_id`, so neither serves an unfiltered instructor page. Nothing
else was changed — no field, no default, no existing index, and no backfill.

## 17. Audit behaviour

**The attempt viewer writes nothing to the audit log.** ADMIN-005 records administrative
*changes* — publications, resets, exports, configuration changes — and reading an attempt is
not one. No new audit action was invented for viewing; a "viewed" action would fill the
change log with browsing noise and dilute the record it exists to keep.

A test drives all three routes as an administrator and asserts `AuditEvent.countDocuments()`
is still zero.

ADMIN-005 is otherwise unchanged by this task.

## 18. Testing

| Suite | Tests | Runs under |
|---|---|---|
| `tests/attemptViewer.test.js` | 23, no database | `npm test` |
| `tests/attemptViewerApi.test.js` | 37, real HTTP + replica set | `npm run test:engine` |

The unit suite covers the filter allowlist, operator rejection, every date shape and every
date failure, pagination bounds, masking and the two serialiser allowlists — all decidable
from the arguments alone, so a failure is unambiguous.

The integration suite plays whole attempts through the **real candidate API** against the
real 100-scenario bank, so what the instructor sees is what the engine actually committed
rather than a fixture shaped to agree with the projection. It covers authentication
(anonymous, candidate, admin), the absence of any write verb, deterministic ordering and
paging, every filter, injection, the learner lookup, result correctness against the learner's
own result endpoint, incomplete attempts, comparison in all four states, and privacy.

## 19. Known limitations

- **`last_seen_at` is not published.** The field does not exist on the `Candidate` model yet
  (15.17 plans it alongside `service_no_masked` and `briefing_version`). A null would be
  indistinguishable from "never seen", so it is omitted rather than faked. Adding it is a
  model change with a backfill, which this read-only task must not make.
- **`service_no_masked` is derived at projection time**, not stored. No backfill was run.
- **The date filter covers `started_at` only.** There is no `completed_from` / `completed_to`;
  a second convention would need its own ambiguity rules for unfinished attempts.
- **Remediation names families, not scenarios**, because practice mode does not exist. This
  is the RESULT-001 architecture, preserved deliberately.
- **No client-selectable sort.** One deterministic order.
- **The learner lookup's `createdAt` sort has no index.** Deployment is a single local PC with
  a small profile count, and the query is capped at 50 rows; an index would be premature.
- **No admin frontend.** Backend and API only.
- **No export.** CSV/PDF is ADMIN-003 and was not started.

## 20. Not in this task

ADMIN-003 CSV/PDF export, ADMIN-004 instructor controls (attempt reset, profile archive,
feedback-timing configuration), any admin frontend, practice mode, adaptive difficulty and
any dashboard or learner-facing change. **None were started.**
