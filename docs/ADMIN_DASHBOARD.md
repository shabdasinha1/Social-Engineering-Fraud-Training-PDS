# Admin Dashboard (ENHANCEMENT-001)

**Source:** `MOM_FINAL_PRODUCT_ENHANCEMENTS_24_SEPTEMBER_2026.docx`, item 1 (Admin Dashboard + Admin UI
Redesign). This supersedes the earlier cancellation of `FE-014` / `BE-005b` admin statistics.

## Endpoint

`GET /api/admin/dashboard` — behind `requireAdmin`. No public or candidate path; a candidate cookie
gets `401 NO_ADMIN_SESSION`. Read-only: no write verb is routed (POST/PUT/PATCH/DELETE → 404), nothing
is written, and no audit entry is appended.

**Assessment-only, no parameters (ENHANCEMENT-001B).** Every figure is scoped server-side to
`Attempt.mode = 'assessment'`. The endpoint accepts **no** query parameter. Any key, including a leftover
`mode`, gets `422 FORBIDDEN_FILTER`. The candidate API still accepts `mode: training` (architecture
unchanged), and such attempts are outside every dashboard figure; an integration test proves this. The
`completed_by_mode` field was removed from the payload.

**Demo User excluded (ENHANCEMENT-003-FINAL).** The Demo User (see `docs/DEMO_USER.md`) is a
demonstration account, not a learner, so the dashboard leaves it out of **every** figure:

- learner counts
- attempt counts and status mix
- scores and score bands
- platform performance and attack-success rates
- the outcome mix and the completion trend

How the exclusion works:

- It is applied server-side in `buildDashboard()`, using the same identification as the rest of the
  demo feature. The profile whose normalised service number equals the configured
  `DEMO_SERVICE_NUMBER` is excluded, and so is any attempt built by the demo selector
  (`selection_algorithm_version: demo-fixed-1.0.0`). The second condition still holds if the configured
  number is ever changed.
- The dashboard takes no parameters, so no request can turn the exclusion off.

What it does not affect:

- Demo attempts are **not** deleted.
- Demo attempts are **not** hidden from Admin Attempts, Attempt Detail, the learner's own results or
  exports.
- In Attempt Detail, a demo-skipped scenario reads **"Skipped (Demo)"** (`outcome_class: demo_skipped`).
  A time-limit closure still reads "Not reached in time" (`not_resolved`).

Service: `backend/src/services/adminDashboardService.js`. Constants: `backend/src/constants/adminDashboard.js`.
No schema, model, index or migration was added.

## Data source

Only existing, authoritative records:

| Record | Used for |
|---|---|
| `Candidate` (learner profile) | learner counts (`total`, `archived`) |
| `Attempt` | status counts, `mode`, committed `total_score`, `completed_at`, `end_reason` |
| `ScenarioRun` (resolved runs of **completed** attempts) | `platform`, committed `score_0_10`, `outcome_code` |
| `ScenarioDefinition` (the run's **pinned** `scenario_id + version`) | `disposition` only |
| `ScenarioEvent` (critical event codes only) | the "critical unsafe step" input to the classifier |

Each run's outcome class comes from the existing RESULT-001 function `classifyOutcome()` — the same
classification shown on the learner's result screen and in the attempt viewer. The dashboard adds only
counting. The integration test checks that every dashboard count equals the sum of the per-attempt
results the attempt viewer reports.

Attempts that are `in_progress` or `abandoned` (reset) count as **started**. They are never scored.

## Metrics

Every rate is published as `{ numerator, denominator, rate }`, where `rate` is 0–1 (4 d.p.) or `null`
when the denominator is 0. Nothing is guessed when there is no data.

"**Decided**" means the learner took a final action. It excludes `not_resolved`, meaning scenarios
closed by the 90-minute limit.

| Metric | Calculation |
|---|---|
| Learners | `Candidate` count; `archived` count; `with_any_attempt` = distinct `profile_id` over attempts in scope; `with_completed_attempt` = distinct learners with a completed attempt |
| Attempts by status | count per `in_progress` / `completed` / `abandoned` |
| Completion rate | completed ÷ all attempts started (in scope) |
| How completed attempts ended | `end_reason = expired` vs everything else (learner-completed) |
| Attempt score summary | mean (1 d.p.), median, min, max of committed `total_score` over completed attempts |
| Score distribution | completed-attempt totals in ten bands: 0–9, 10–19 … 80–89, 90–100 (100 in the last band) |
| Learner score distribution | same bands, one value per learner: their **most recently completed** attempt (ties → attempt id) |
| Platform average score | Σ `score_0_10` ÷ number of runs (out of 10); `score_rate` = points ÷ (runs × 10) |
| **Attack success rate** (per platform) | runs classified `missed_threat` ÷ **decided malicious** runs |
| Safe handling rate | `handled_safely` ÷ decided runs (malicious + legitimate) |
| Genuine items rejected | `false_positive` ÷ decided legitimate runs |
| Outcome mix | count per outcome class, per platform and overall |
| Highest / lowest | server-side `extremes` for `attack_success_rate` and `score_rate`, over platforms with data. Ties are listed together. `null` when fewer than 2 platforms have data. `all_equal` flags a tie across all of them. |
| Completions, last 14 days | completed attempts per UTC day, ending today |

**Why "attack success" is objectively derivable:** `missed_threat` is RESULT-001's existing class for "a
malicious item that was not stopped, or was engaged with unsafely before it was stopped". Restricting the
denominator to decided malicious runs makes the rate "share of attacks that succeeded". It is not a new
definition. MOM's "successful interaction rate" for genuine items is covered by the safe-handling and
genuine-items-rejected rates. No further "interaction" metric was invented.

Points from time-limited scenarios still count toward platform scores, as they do toward the learner's
own total.

## What the response never contains

No learner name, service number, profile id or attempt id. No scenario id, event code, outcome code,
learner action, action code, intent or typed rationale. Unit and integration tests assert this.

## Frontend

- `/admin` is now the dashboard (`frontend/src/pages/AdminDashboardPage.jsx`). The old directory landing
  page was replaced. Its four links now live in the sidebar and in the dashboard's "Instructor tools" row.
- Charts are plain HTML/CSS (`components/admin/DashboardCharts.jsx`). No chart library was added.
  Platforms are identified by name + icon, never colour alone. Every value is visible without hover.
  Columns are focusable with a spoken label and tooltip, and a full platform table repeats every number
  with its counts.
- The outcome palette was checked with the dataviz validator (CVD and normal-vision separation pass). It
  is always paired with a legend, counts and the table.
- Empty installation, mode with no data, loading, error-with-retry: each panel says so in words.

## Admin UI redesign

- **Shell** (`AdminLayout.jsx`): dark "instructor console" sidebar at ≥1024px. Below that the same single
  `<nav>` becomes a drawer (menu button, overlay, Escape, closes on navigation, `invisible` when closed).
  Sticky header with the signed-in chip and Sign out. Faint grid backdrop.
- **Primitives** (`AdminPrimitives.jsx`, used by every admin page): page eyebrows, card icons, stat tiles,
  pills with a shape dot, restyled table header, filters, empty/loading states, and a radio-group
  `Segmented` control. `TableScroll` is now `relative`, which fixes a horizontal page overflow on the
  Attempts page caused by `sr-only` link text escaping the scroll box.
- **Tokens** (`styles/index.css`): `--color-console-*`, `--color-signal*`, `--color-chart-*`,
  `--color-outcome-*`. Components contain no hard-coded colours.
- The admin sign-in page picks up the console backdrop and accent. Form, validation and flow are
  unchanged.
- No page logic, filter, API call, export, reset/archive control or audit behaviour changed.

## Testing (24 September 2026)

- Backend unit: `tests/adminDashboard.test.js` (11). Full `npm test`: 666 pass / 0 fail (422 are the
  DB-integration tests, which run under `test:engine`).
- Backend integration: `tests/adminDashboardApi.test.js` (9), added to `npm run test:engine`. Full engine
  run: 14 suites, **348 / 348 pass**.
- Frontend: `src/pages/AdminDashboard.test.jsx` (12). Full suite **3,935 / 3,935 pass** (43 files),
  including the 45 existing admin tests. `oxlint` clean.
- Build: `vite build` into a scratch directory (no handover build written to `frontend/dist`).
  SECURITY-001 bundle check passes.
- Browser: a throwaway DB (`enh001_verify`) seeded through the real engine. All 7 admin routes had zero
  horizontal overflow at 768, 1024, 1280 and 1440px, and the drawer, charts and tooltips were checked.
- Scenario bank and scoring: source-data digests, scoring/engine/result source hashes and the release DB's
  100 `ScenarioDefinition` documents (SHA-256) were identical before and after.

## ENHANCEMENT-001B — polish, density, pagination, motion (24 September 2026)

- **Assessment-only.** The dashboard mode switch (Both / Assessment / Training) was removed from the UI,
  and the API now takes no parameters (see Endpoint). The Attempts screen dropped its Mode filter and
  column; the attempts API still accepts `mode`, so nothing server-side broke. **Retained training
  references, on purpose:** (1) Settings keeps the training feedback-timing field, listed second and
  labelled "not used by the assessment flow", because ADMIN-004's configuration contract stores and
  validates both values. (2) Export files keep their `TRAINING SIMULATION · OFFLINE` marking, which is a
  server-side export-marking requirement. (3) The attempt detail header names the mode only when an
  attempt is *not* assessment. (4) The shared learner result breakdown component is reused unchanged.
- **Wording.** "Attack success rate" became **Malicious scenario success**. The outcome class is shown
  as **Threat missed**, the same vocabulary as the attempt viewer. The calculation is unchanged.
- **Pagination.** Scenarios, Attempts and Audit log show **10 rows per page, paged on the server**
  (`page_size=10`). There is one shared control: "Showing 11–20 of 100 scenarios", Previous / numbered
  pages with `…` / Next, `aria-current="page"`, and "3 / 10" on phones. There are no controls when
  everything fits on one page. Any filter change returns to page 1, and later pages keep the filter.
- **Density.** Central spacing tokens (`--spacing-section/grid/card`, tighter below 1024px) and a wider
  content column (`--container-admin: 100rem`). Filters became one toolbar inside each table card.
  Explanatory banners are one line. Settings is a two-card layout. On the attempt detail page, related
  cards sit side by side and the ten scenarios collapse to one row each with **Expand all**, taking the
  page from ~8,600px to ~3,200px at 1280px wide. Low-priority table columns hide at narrow widths.
- **Motion.** CSS only, with no new dependency: section fade-rise with a 45ms stagger, bars and columns
  growing from their baseline, strips sweeping in, card and row hover, a sliding sidebar indicator, and
  skeleton shimmer. The skeleton appears only after a 150ms delay, so fast loads never flash it. Every
  animation is behind `motion-safe:` / `prefers-reduced-motion: no-preference`; this was verified in the
  built CSS.
- **Loading.** First loads show skeletons in the shape of the content. A refresh keeps the previous rows
  dimmed rather than blanking the table.
- **Dependencies.** None added. The custom HTML/CSS charts were kept and refined: a shorter plot, day
  numbers on the 14-day axis with the date range beneath, and a legend that adapts its columns to the
  card width.
- **Verification.** No horizontal page overflow on all 7 admin routes at 1920/1440/1280/1024/768/375px.
  Keyboard order, focus ring, drawer, Escape and radio groups (one tab stop each) were checked in the
  browser. Server pagination was exercised against the real API (100 → 10 pages; SMS filter → 25;
  SMS+hard → 8, no controls).
- **Tests.** Frontend 3,945 / 3,945 across 44 files, including the new `AdminPagination.test.jsx` (9).
  Backend unit 666 / 0 fail. Dashboard integration suite: 9 / 9, including the training-exclusion test.
