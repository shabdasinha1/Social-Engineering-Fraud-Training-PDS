# ScenarioDefinition Schema

**Status:** IMPLEMENTED — `DATA-001`, 4 September 2026.
**Model:** `backend/src/models/ScenarioDefinition.js` · **Vocabularies:** `backend/src/constants/scenarioDefinition.js`
**Collection:** `scenariodefinitions` (the legacy `scenarios` collection is untouched)
**Authority:** `Interactive_Social_Engineering_Scenario_UI_Development_Specification.pdf` v1.0 (02 Sep 2026), and `PROJECT_MASTER_PLAN.md` §15.23 / §15.24 / §15.25.
**Companion records:** [`ATTACK_FAMILY_TAXONOMY.md`](ATTACK_FAMILY_TAXONOMY.md) · [`TRIGGER_TAXONOMY.md`](TRIGGER_TAXONOMY.md) · [`DEPLOYMENT_AND_TRANSACTION_STRATEGY.md`](DEPLOYMENT_AND_TRANSACTION_STRATEGY.md)

> **Scope of DATA-001.** Schema and validation groundwork only. No importer, no
> selection engine, no state-machine runtime, no scoring engine, no frontend change, no
> data migration. The legacy 40-scenario pipeline continues to run untouched.

---

## 1. Two rules that shape everything

**1. Client content is never overwritten.** `family` and `trigger` store the client's
strings verbatim. `canonical_family` and `canonical_triggers` are *our* implementation
metadata, stored alongside and independently versioned. A remap changes only our fields
and is auditable through `taxonomy_version` / `trigger_taxonomy_version`.

**2. Nothing that reveals the answer reaches a learner.** Enforced by two independent
layers, never by frontend hiding — see §6.

## 2. Document shape

Field groups follow Appendix A of the specification: identity, classification, synthetic
content, six stages, scoring, feedback, quality.

```
ScenarioDefinition
├─ schema_version                     1  (importers reject unknown values)
│
├─ IDENTITY
│  ├─ scenario_id     'W01'…'S25'     matched against /^[WIES](0[1-9]|1[0-9]|2[0-5])$/
│  ├─ version         int ≥ 1         content version of this logical scenario
│  ├─ active          bool            explicit, never inferred
│  ├─ platform        whatsapp | instagram | email | sms
│  ├─ owner, review_date              Appendix A identity group
│
├─ CLASSIFICATION  (server-only in projection, top-level so it stays queryable)
│  ├─ level           easy | medium | hard
│  ├─ disposition     malicious | legitimate
│  ├─ family                          CLIENT STRING, VERBATIM
│  ├─ canonical_family                one of 19 — ours
│  ├─ taxonomy_version '1.0.0'
│  ├─ trigger                         CLIENT STRING, VERBATIM (incl. '| FICTIONAL MILITARY CONTEXT')
│  ├─ canonical_triggers[]            ≥1 of 22, ordered, unique — ours
│  ├─ trigger_taxonomy_version '1.0.0'
│  ├─ military_flag   bool            derived from the trigger suffix, cross-checked
│  └─ legitimate_control bool         Appendix A flag, cross-checked against disposition
│
├─ SYNTHETIC CONTENT  (candidate-visible)
│  ├─ sender, prior_context
│  └─ assets[]  { asset_id, kind, label, display_target, content, inert }
│
├─ stages[6]  (candidate-visible)
│  └─ { index, key, ui_to_build, transitions[], events[], asset_refs[] }
│
├─ scoring    { max_points 10, min_points 0 }
├─ quality    Appendix A reviewers, safety/accessibility checks, pilot status
│
└─ evaluation   ── select: false ──────────────────────── SERVER ONLY
   ├─ title                           states the answer; see §6
   ├─ end_state                       client "End-state", verbatim
   ├─ feedback { result, points_summary, cues[], safe_action, impact,
   │             prevention_habit, immediate_in_training }
   └─ stages[6] { index, key, learner_flow, expected_safe_behavior, scoring_text,
                  expected_actions[], scoring[] }
```

### Why the stage list is split in two

Each client scenario page carries four columns per stage. They divide cleanly by
audience, so the stage is stored as two parallel six-element arrays:

| Client column | Stored in | Visible to learner |
|---|---|---|
| *UI to build* | `stages[].ui_to_build` | yes — the renderer needs it |
| *Learner flow + synthetic content* | `evaluation.stages[].learner_flow` | no — authoring prose that can telegraph the answer |
| *Expected safe behavior* | `evaluation.stages[].expected_safe_behavior` | no — it **is** the answer |
| *Scoring event* | `evaluation.stages[].scoring_text` | no |

All four are preserved verbatim. The split is a visibility boundary, not an edit.

## 3. The six-stage state machine

`STAGE_KEYS` is ordered and closed: `notify, open, inspect, branch, verify, resolve`.

A scenario **cannot** be missing a stage, carry them out of order, or mis-index one.
`stages` and `evaluation.stages` each require exactly six entries, and a pre-validate hook
asserts `stages[i].key === STAGE_KEYS[i]` and `stages[i].index === i + 1`.

> **Naming note.** The scenario content pages label stage 1 *"Event"*; §4, which defines
> the state machine, names the state *"Notify"*. `notify` is used because §4 is the
> normative definition. The client's own stage text is preserved verbatim in
> `evaluation.stages[].learner_flow`, so no client terminology is lost.

### Constrained transitions, not a free graph

`STAGE_TRANSITIONS` enumerates every edge §4 permits. A scenario declares a **subset**;
anything outside it is a validation error.

| Stage | Permitted transitions |
|---|---|
| notify | `open_item → open` · `dismiss → self` |
| open | `read → inspect` · `premature_action → branch` |
| inspect | `inspect → branch` · `skip → branch` |
| branch | `safe_action → verify` · `risky_action → verify` |
| verify | `trusted_check → resolve` · `report_or_block → resolve` · `in_message_check → branch` · `in_message_check → resolve` |
| resolve | `complete → end` · `abandon → end` |

This covers every path the task requires: forward progression, premature risky action
(`open → branch`), the safe and risky branches (both reaching `verify`, the risky one via
its local consequence), the verification path including §4's "in-message check → 4 or 6",
and resolution with a resumable abandon.

**A generic edge list was rejected deliberately.** It would let a scenario invent a path
the specification does not allow, and the runtime would have no way to distinguish that
from a legitimate authoring choice. The constrained model makes the client contract
structurally enforceable.

### Per-stage event allowlist

`STAGE_EVENTS` holds §4's *Core events* for each stage. A stage may only declare events
belonging to it — `payment_attempted` on `notify` is rejected. This is the metadata
allowlist the privacy acceptance criterion refers to; the event ledger (`EVENT-001`) will
write against the same vocabulary.

## 4. Scoring metadata

`SCORING_EVENTS` holds all sixteen stable codes with their canonical point deltas. The
nine from the §5 table are marked `spec_table: true`; the other seven appear on every
scenario page but not in that table (§15.10). `critical: true` marks the actions the
release checklist calls *critical unsafe actions*.

| Code | Δ | Code | Δ |
|---|---|---|---|
| `NOTIFY_SEEN` | 0 | `PREMATURE_REPLY` | −1 |
| `ITEM_OPEN` | 0 | `NEEDLESS_REJECT_IGNORE` | −2 |
| `INSPECT_CONTEXT` | +2 | `RISKY_OPEN_REPLY` | −3 |
| `SAFE_PIVOT` | +3 | `FALSE_REPORT_BLOCK` | −4 |
| `CORRECT_USE` | +3 | `UNSAFE_EXTERNAL_ACTION` | −4 |
| `TRUSTED_VERIFY` | +3 | `CONTRADICTORY_UNSAFE_FINAL` | −4 |
| `RESOLVE_CORRECT` | +2 | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| `REPORT_ONLY_WITHOUT_CHECK` | +1 | `VERIFY_THROUGH_MESSAGE` | 0 |

The safe path sums to exactly **10** (`+2 +3 +3 +2`), so the 0–10 clamp is a floor guard,
not a ceiling guard — asserted by a test.

**`points_delta` is stored per scenario rather than looked up from the constant.** The
bank is uniform today, but the client owns these numbers: an attempt must stay explainable
from what was stored when it ran, not from whatever the constants say later. The constant
is the authoring default; the document is the record.

**No scoring is computed here.** `SCORE-001` consumes this metadata.

## 5. Learner action vocabulary

Taken from §4's shared components — nothing invented:

- **Action sheet:** `reply, forward, delete, mark_safe, verify, report, block, restrict`
- **Call screen:** `call_decline, call_accept, call_end, call_verify, call_report`
- **Inspect:** `inspect_sender, inspect_profile, inspect_link, preview_file, inspect_qr, read_thread`
- **Branch:** `open_link, open_file, scan_qr, submit_data, attempt_payment, attempt_install, approve_device_link, share_location, share_secret`
- **Verify:** `verify_trusted_directory, verify_known_app, verify_known_number, verify_in_message_contact`
- **Resolve:** `resolve_report, resolve_block, resolve_continue, resolve_retain, resolve_ignore, resolve_abandon`

`evaluation.stages[].expected_actions[]` links an action to the scoring code it produces
and marks whether it is the expected behaviour — server-only, so listing the safe action
never leaks it.

Note `verify_in_message_contact` exists as a *scoreable wrong route*: §4 requires that
contact data inside the suspect message can never populate a trusted result, and §5 scores
"verification through message" at +0. The vocabulary has to name the unsafe route in order
to score it.

## 6. Hidden evaluation data

Two independent layers, following the pattern proven on the legacy `Scenario` model:

1. **`evaluation` is `select: false`.** Ordinary queries — including `.lean()` — return
   nothing. Recovery requires an explicit `.select('+evaluation')`.
2. **`toCandidateJSON()` builds from an allowlist**, not by deleting fields. A field added
   later is hidden by default rather than exposed by default. This is what protects
   against a forgotten `.select('+evaluation')` upstream.

**Classification is deliberately top-level rather than inside `evaluation`.** The
selection engine queries `level`, `disposition`, `canonical_family`, `canonical_triggers`
and `military_flag` on every attempt; burying them behind `select: false` would force
`+evaluation` on every selection query — which is precisely the habit that causes leaks.
They are instead excluded by the projection.

**Never present in a candidate payload:** `title`, `level`, `disposition`, `family`,
`canonical_family`, `trigger`, `canonical_triggers`, `military_flag`,
`legitimate_control`, `end_state`, `feedback`, `expected_actions`, per-stage `scoring`,
both taxonomy versions, `quality`, and the whole `evaluation` block.

> **Why `title` is evaluation data.** Client titles such as *"Cloned Friend in Distress"*,
> *"The Accidental Login Code"* and *"Deepfake Trading Advertisement"* state the answer
> outright. §3 separately forbids revealing difficulty, the malicious/legitimate label or
> the attack family. Titles are for authors, instructors and reports — never the learner
> mid-attempt.

Verified live: default and `.lean()` queries return no `evaluation`; explicit select
recovers it; the candidate payload contains none of the sensitive strings.

## 7. Validation boundary — schema vs importer

Kept in the **schema**, because it is intrinsic to a single document:

| Rule | Mechanism |
|---|---|
| Platform, level, disposition, family, trigger, asset-kind, action, event, scoring-code enums | Mongoose `enum` |
| `scenario_id` format | `match` |
| Exactly six stages, correctly keyed and ordered | array validator + pre-validate hook |
| Transitions within the permitted per-stage set | pre-validate hook |
| Events belonging to their stage | pre-validate hook |
| `asset_refs` resolving to a declared asset | pre-validate hook |
| `scenario_id` prefix agreeing with `platform` | pre-validate hook |
| `canonical_family` agreeing with `disposition` | pre-validate hook |
| `legitimate_control` agreeing with `disposition` | pre-validate hook |
| Raw trigger shape (≤1 `\|`, suffix exactly the marker, no empty `+` component) | pre-validate hook |
| `military_flag` matching the trigger suffix | pre-validate hook |
| Feedback completeness, non-empty cues | `required` + array validator |
| `min_points ≤ max_points` | pre-validate hook |
| `(scenario_id, version)` uniqueness | unique index |

Deferred to the **importer (`DATA-002`)**, because it needs corpus-level knowledge or an
external artifact — duplicating it in the schema would mean two divergent copies:

| Rule | Why it belongs to the importer |
|---|---|
| **Raw trigger ↔ `canonical_triggers` equivalence** | Needs the raw-primitive → canonical alias map, which §15.24 makes a versioned data artifact (`backend/data/trigger-taxonomy.v1.json`). The schema validates the raw string's *shape* and the canonical *vocabulary*; only the importer can confirm they agree |
| **Raw family ↔ `canonical_family` equivalence** | Same reasoning, against `backend/data/attack-family-taxonomy.v1.json` |
| Bank totals — 100 scenarios, 25 per platform, 8E/9M/8H, 80/20, 35 military | Corpus-level, not per-document |
| At most one `active` version per `scenario_id` | Cross-document; enforced on publish |
| Reserved-host enforcement on `display_target` | Needs the asset/domain policy; `RESERVED_HOST_PATTERN` is exported ready for it |
| Safe-path completability | Requires walking the stage graph against the scoring table |

This boundary is recorded rather than implemented, exactly as DATA-001 requires.

## 8. Indexes

Sized to the queries `SELECT-002` will actually run. No speculative indexes.

| Index | Purpose |
|---|---|
| `{ scenario_id, version }` **unique** | One document per logical scenario per content version |
| `{ active, platform, level }` | Platform allocation crossed with the 3E/4M/3H target |
| `{ active, disposition }` | The 8 malicious + 2 legitimate split |
| `{ active, canonical_family }` | Max two per family; family analytics |
| `{ active, canonical_triggers }` | Multikey; the ≥5 distinct triggers rule |
| `{ active, military_flag }` | 2–4 military-context cases per attempt |

All six were confirmed created on a live database, and the unique index was confirmed to
reject a duplicate `(W01, 1)` with `E11000` while allowing `W01 v2` to coexist.

## 9. Versioning and active semantics

- **`scenario_id` identifies the logical scenario; `version` identifies the content.**
  They are unique together, so versions coexist.
- **`active` is explicit and defaults to `false`.** A newly created document is not live
  until something publishes it. This is the safer default for content that will arrive by
  bulk import.
- **Published content is not mutated in place.** A content change is a new document at
  `version + 1`; the previous version stays readable so a historical attempt remains
  interpretable — the same principle §7's comparability gate relies on.
- **At most one active version per `scenario_id`** is a publish-time rule for `DATA-002`,
  not a schema constraint — a partial unique index would block the legitimate transient
  state where a new version is being staged before the old one is retired.

Full version *management* (admin publish/rollback UI) is `ADMIN-001`, not DATA-001.

## 10. Offline and safety posture

The schema cannot hold anything executable. `assets[].content` is synthetic display data;
`display_target` is a string rendered as text, never a working href — the same discipline
the existing renderers already follow (`frontend/src` contains no `href`, `window.open` or
`fetch` outside `apiClient`). There is no field for a credential, a payment instrument, a
macro, an archive, or a live network destination, and `ASSET_KINDS` has no `executable`
member. `RESERVED_HOST_PATTERN` is exported for the importer's domain check.

## 11. Testing

`backend/tests/scenarioDefinition.test.js` — **44 tests, no database**.

Every check runs `await doc.validate()` on an unsaved document, which executes both the
validators and the synchronous `pre('validate')` hook offline. This matches the existing
suite, which is entirely DB-free.

> **`validateSync()` must not be used on these documents.** It skips pre-validate
> middleware — so every cross-field rule above would silently pass — and it is deprecated
> in Mongoose 9. Verified empirically before the schema was written.

Covered: valid malicious / legitimate / military / multi-trigger documents · missing,
misordered and mis-indexed stages · every enum · `scenario_id` format and
prefix↔platform agreement · disposition↔family and disposition↔control agreement ·
trigger shape, suffix and `military_flag` agreement · verbatim client strings · illegal
transitions, foreign stage events, dangling asset references · feedback completeness ·
scoring vocabulary and the safe-path sum · index declarations · `select: false` and the
candidate projection, checked by key **and** by leaked substring · multi-word primitives
(`expert_status`, `social_proof`) as single IDs, with the whitespace-split failure mode
explicitly rejected.

## 12. What DATA-001 deliberately does not do

No importer · no selection · no state-machine runtime · no event ledger · no scoring
engine · no frontend change · no admin surface · no data migration · no change to the
legacy pipeline, its data, or its tests.
