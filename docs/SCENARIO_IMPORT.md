# Scenario Import (DATA-002)

**Status:** IMPLEMENTED — 4 September 2026. All 100 client scenarios imported.
**Importer:** `backend/src/services/scenarioDefinitionImportService.js`
**Command:** `backend/scripts/importScenarioDefinitions.js` (`npm run import:definitions`)
**Source dataset:** `backend/data/scenarios/v1/`
**Taxonomy artifacts:** `backend/data/taxonomy/`
**Target collection:** `scenariodefinitions` — the legacy `scenarios` collection is untouched.
**Companions:** [`SCENARIO_DEFINITION_SCHEMA.md`](SCENARIO_DEFINITION_SCHEMA.md) · [`ATTACK_FAMILY_TAXONOMY.md`](ATTACK_FAMILY_TAXONOMY.md) · [`TRIGGER_TAXONOMY.md`](TRIGGER_TAXONOMY.md)

---

## 1. Source of truth

The 100 scenarios are **client content**, reproduced verbatim from
`Interactive_Social_Engineering_Scenario_UI_Development_Specification.pdf` v1.0
(02 September 2026), pages 11–113.

```
backend/data/scenarios/v1/
├── scenarios.whatsapp.json     W01-W25
├── scenarios.instagram.json    I01-I25
├── scenarios.email.json        E01-E25
├── scenarios.sms.json          S01-S25
└── MANIFEST.json               fingerprints + source provenance
```

Each record holds the client's own fields and nothing else:

| Field | Source |
|---|---|
| `scenario_id`, `title` | page header |
| `platform`, `difficulty`, `disposition`, `family`, `trigger` | metadata row, verbatim |
| `stages[6]` × `{number, pdf_label, learner_flow, ui_to_build, expected_safe_behavior, scoring_event}` | the six-row stage table, all four columns verbatim |
| `end_state`, `feedback` | page footer, verbatim |
| `source_page`, `content_sha256` | provenance and integrity (ours) |

**Canonical classification is deliberately NOT in these files.** `canonical_family` and
`canonical_triggers` are derived at import time from the taxonomy artifacts, so client
content and our implementation metadata can never be confused in the source of truth.

### How the content was captured

Extracted from the PDF by word coordinates, not by text blocks. Two hazards made the naive
approaches unsafe, and both are recorded because they would silently corrupt content:

1. **Adjacent table cells sometimes merge into one text block**, which would concatenate
   two client columns into one field.
2. **The stage label and the learner-flow text share a text line** (`"1 | Event"` and the
   narrative start at the same `y`), so they must be split by `x` position, never by
   newline.

**Verification:** all **2,900** extracted fields (100 scenarios × 29 fields) were checked
to appear *verbatim* in their own source page. This check caught a real defect during
development — the footer label `"Concise learner feedback"` was bleeding into
`stage 6 ui_to_build` on 61 scenarios — which was fixed before any data was written.

## 2. Running the importer

```bash
cd backend
npm run import:definitions -- --dry-run     # validate everything, write nothing
npm run import:definitions                  # import v1 as active
npm run import:definitions -- --stage       # import inactive (staged, not published)
npm run import:definitions -- --version=2   # import as a new content version
npm run import:definitions -- --json        # machine-readable report on stdout
```

MongoDB must be running. The command exits non-zero if anything is rejected.

## 3. Validation pipeline

Nothing is written until **every** stage passes. Validation is whole-dataset first, so a
partial bank can never be presented as a successful import.

| # | Stage | Failure behaviour |
|---|---|---|
| 1 | **Content integrity** — per-scenario and whole-bank SHA-256 against `MANIFEST.json` | reject: a source file was edited |
| 2 | **Offline / synthetic safety** — URLs, email addresses and hostnames in client text | reject: names the scenario and the target |
| 3 | **Normalisation** — platform/level/disposition enums, family mapping, trigger decomposition, scoring parsing | reject: names the scenario and field |
| 4 | **Per-document schema validation** — the full DATA-001 model, offline | reject: names the scenario and path |
| 5 | **Dataset acceptance counts** — totals, per-platform, per-difficulty, disposition, duplicate ids | reject before any write |
| 6 | **Active-version guard** — refuses to activate a second version of a `scenario_id` | reject, never silently deactivates |
| 7 | Write (upsert), then re-count | `INCOMPLETE` if the stored count is not 100 |

### Family mapping

`family` (client string) is stored verbatim. `canonical_family` is looked up in
`attack-family-taxonomy.v1.json` by the **raw family string**. The artifact contains 99
entries — one per distinct client family — and no raw string maps to two canonical
families. An unmapped family **fails the import**; it is never matched to the nearest one.

The importer additionally checks the canonical family's disposition agrees with the
client's (`legit_*` families only on legitimate scenarios).

### Trigger normalisation

Exactly the rules recorded in `TRIGGER_TAXONOMY.md`:

```
"Authority + urgency | FICTIONAL MILITARY CONTEXT"
  1. partition once on '|'; the right side must equal "FICTIONAL MILITARY CONTEXT"
     -> sets military_flag; any other suffix fails the import
  2. split the LEFT side on '+'          (never on whitespace)
  3. trim, collapse whitespace, casefold
  4. map through the closed alias table  (unknown primitive fails the import)
  5. preserve order, de-duplicate
  -> canonical_triggers = ["authority", "urgency"], military_flag = true
```

Splitting on `+` and never on whitespace is what keeps the four multi-word primitives
intact — `expert status`, `social proof`, `social validation`, `time pressure`. `I20`
(`"Expert status + flattery"`) is the live case in the bank, and a test pins it.

### Scoring

The client's `scoring_event` column is parsed by a **closed clause table**, not by
pattern-matching numbers out of prose. The bank uses eight distinct scoring strings; each
`;`-separated clause must match either a known scoring clause or a known non-scoring one
(`"dwell time logged"`, `"scenario capped 0-10"`, …). **An unrecognised clause fails the
import**, so a reworded clause in a future revision stops the pipeline instead of being
silently mis-scored.

The client's raw string is also kept verbatim in `evaluation.stages[].scoring_text`.

## 4. Idempotency

Upsert by `(scenario_id, version)`, backed by the unique index.

- Content unchanged → reported `unchanged`, nothing written.
- Content changed at the same version → `updated`.
- New `(scenario_id, version)` → `inserted`.
- **Never** deletes, drops, or removes any document; the service contains no
  `deleteMany`/`deleteOne`/`drop`, and a test asserts that.

Verified: run 1 → `inserted 100`; runs 2 and 3 → `unchanged 100, inserted 0, updated 0`.

## 5. Version and active semantics

- `scenario_id` is the logical scenario; `version` is the content version; unique together.
- The client document is **Version 1.0**, imported as `scenario_version: 1` and recorded
  as `source_document_version: "1.0"` in the manifest.
- The initial import publishes with `active: true` — there is no prior version to conflict
  with, and the release checklist requires 100 *active* scenarios.
- **No previous version is deactivated.** If another version of the same `scenario_id` is
  already active, the importer **refuses** and asks for an explicit deactivation rather
  than silently switching the live content.
- `--stage` imports with `active: false` for review before publishing.

Full version *management* (admin publish/rollback) remains `ADMIN-001`.

## 6. Content integrity

Every scenario carries a SHA-256 `content_sha256`; `MANIFEST.json` carries all 100 plus a
whole-bank digest.

- **Covered:** message and stage text, title, family, trigger, difficulty, disposition,
  feedback, end state, scoring strings, and the presence of every scenario.
- **Excluded:** `source_page` (re-pagination is not a content change) and all database
  fields — `_id`, `createdAt`, `updatedAt`.

The digest is over a stable serialisation (sorted keys, no whitespace), so it depends only
on content. The importer verifies it on every run, and tests prove that editing any client
field, or adding/removing a scenario, changes it.

**Bank fingerprint (v1):** `8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687`

## 7. Offline and synthetic safety

The importer scans all client text per scenario and rejects any URL, email address, or
hostname outside the reserved training set (`.example`, `.invalid`, `.test`, `localhost`,
`training.local`).

Result on the real bank: **no violations.** The only host present anywhere in the 100
scenarios is `training.example` (5 occurrences), a reserved `.example` domain. There are
no URLs, no email addresses, and the phone-like strings are non-routable training numbers
(`00000 …`). No real brand or institution names appear.

Military entities are fictional throughout (`Unit Falcon`, `HQ Alpha`-style). **No client
content was rewritten** to achieve any of this — it was already compliant, and the
importer's job is to prove that on every run, not to repair it.

## 8. Expected counts

Validated **before** any write. A mismatch rejects the whole import.

| Check | Required | Actual |
|---|---|---|
| Total | 100 | 100 |
| WhatsApp / Instagram / Email / SMS | 25 each | 25 / 25 / 25 / 25 |
| Malicious / legitimate | 80 / 20 | 80 / 20 |
| Per platform: easy / medium / hard | 8 / 9 / 8 | 8 / 9 / 8 (all four) |
| Military-context | — | 35 (WhatsApp 10, Instagram 12, Email 8, SMS 5) |
| Canonical families used | 19 | 19 |
| Canonical triggers used | 22 | 22 |
| Multi-trigger scenarios | — | 87 |

The military totals match the specification's own platform index pages exactly.

## 9. What the importer intentionally does NOT do

| Not done | Why |
|---|---|
| Populate `synthetic.assets` / `asset_refs` | The specification describes assets in prose ("a QR code", "an APK"), not as records. Generating asset IDs would be inventing client content. Structured synthetic content is **DATA-003**. The client's prose is fully preserved in `evaluation.stages[].learner_flow` |
| Populate `expected_actions` | Which specific action satisfies a stage is stated in prose only. Deriving it would be interpretation. Populated by **ENGINE-001**, which defines the per-stage action surface |
| Vary transitions or events per scenario | Specification section 4 defines the state machine **once**, not per scenario. Every scenario therefore receives the canonical transition and event set for its stage |
| Touch the legacy `Scenario` collection or its 40 documents | Out of scope by instruction; asserted by test |
| Deactivate, delete or drop anything | Import is additive and idempotent |
| Selection, scoring, the event ledger, the runtime engine, admin UI, results | Later phases |

### `feedback` — a structural note

DATA-001's `feedback` sub-document has five required parts (`result`, `cues`,
`safe_action`, `impact`, `prevention_habit`). The client supplies a *single* "Concise
learner feedback" line plus an "End-state". The importer maps the client's own words onto
that structure without adding any new prose:

| Schema field | Filled from |
|---|---|
| `result` | `"<disposition> - <family>"`, both client values |
| `cues` | the client's concise feedback line |
| `safe_action` | the client's stage-6 *Expected safe behavior* |
| `impact` | the client's *End-state* |
| `prevention_habit` | the client's concise feedback line |

`cues` and `prevention_habit` therefore carry the same client sentence, because the client
supplies one line for both purposes. **No text was written, paraphrased or invented.** If
richer per-part feedback is wanted later, it is content the client would need to supply.

## 10. Tests

`backend/tests/scenarioDefinitionImport.test.js` — **50 tests, no database.** They run
against the real dataset and the real taxonomy artifacts through the same functions the
importer uses.

Covered: source counts and ids · platform/difficulty/disposition totals · six stages and
their order · all four content columns present · family and trigger mapping completeness ·
canonical vocabulary fully exercised · multi-word primitives · military suffix parsing and
per-platform military totals · trigger order and de-duplication · version and active
semantics · unique-index backing for upsert · determinism · rejection of unknown
primitives, unmapped families, malformed records, missing stages, unknown scoring clauses
and count mismatches · offline safety, both the rejection path and the real bank passing ·
candidate serialisation leaking nothing · all 100 documents passing full schema validation
· safe path summing to 10 for every scenario · fingerprint sensitivity and insensitivity ·
and static assertions that neither the service nor the script references the legacy
pipeline or any destructive operation.
