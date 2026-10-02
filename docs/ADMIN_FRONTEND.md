# Instructor Frontend (ADMIN-006)

**Status:** IMPLEMENTED — 7 September 2026.
**Shell:** `frontend/src/components/admin/AdminLayout.jsx` · **Guard:** `frontend/src/routes/RequireAdmin.jsx`
**Service:** `frontend/src/services/adminApi.js` · **Vocabulary:** `frontend/src/constants/admin.js`
**Companions:** [`ADMIN_SCENARIO_MANAGER.md`](ADMIN_SCENARIO_MANAGER.md) · [`ADMIN_ATTEMPT_VIEWER.md`](ADMIN_ATTEMPT_VIEWER.md) · [`ADMIN_EXPORTS.md`](ADMIN_EXPORTS.md) · [`ADMIN_INSTRUCTOR_CONTROLS.md`](ADMIN_INSTRUCTOR_CONTROLS.md) · [`ADMIN_AUDIT_LOG.md`](ADMIN_AUDIT_LOG.md)

---

## 1. What this is

The instructor-facing UI for the five backend capabilities specification section 6 requires.
**No backend was changed by this task**: every screen consumes an existing endpoint and an
existing projection, and no API mismatch was found.

## 2. Routes

All are children of one guarded branch, so a screen added later inherits the boundary, the
header and the navigation rather than having to remember them.

| Route | Page | Backend |
|---|---|---|
| `/admin/login` | `AdminLoginPage` (pre-existing) | `POST /api/admin/login` |
| `/admin` | `AdminDashboardPage` — aggregate dashboard (ENHANCEMENT-001, see `ADMIN_DASHBOARD.md`) | `GET /api/admin/dashboard` |
| `/admin/scenarios` | `AdminScenariosPage` | `GET /api/admin/scenarios` |
| `/admin/scenarios/:scenarioId` | `AdminScenarioDetailPage` | `GET`/`PATCH`/`POST …/publish`, `…/deactivate`, `…/clone` |
| `/admin/attempts` | `AdminAttemptsPage` | `GET /api/admin/attempts`, `GET /api/admin/learners` |
| `/admin/attempts/:attemptId` | `AdminAttemptDetailPage` | `GET /api/admin/attempts/:id`, exports, controls |
| `/admin/settings` | `AdminSettingsPage` | `GET`/`PATCH /api/admin/config/feedback` |
| `/admin/audit` | `AdminAuditPage` | `GET /api/admin/audit` |

## 3. Authentication

The existing `RequireAdmin` guard, unchanged. It asks the server who the session belongs to
— the `admin_session` cookie is httpOnly and unreadable here — and redirects to the admin
sign-in when there is no valid admin.

**No second authentication mechanism was created**, and nothing about the session is written
to `localStorage` or `sessionStorage` (asserted by test). A learner holding only a candidate
cookie gets the same 401 from `/admin/me` as an anonymous visitor and is redirected the same
way; the server enforces the boundary independently on every `/api/admin` route regardless
of what this guard does.

Sign-out posts to `/api/admin/logout` and returns to the sign-in screen.

## 4. Request safety

`adminApi` builds **every request body and query string field by field**. There is no place
where a component's state object is spread into a request, so a form's local UI state cannot
reach an API contract. This matters because the backends reject an unknown field rather than
ignoring it — a spread body would fail at the server.

- Query strings drop empty values, so an untouched filter is absent rather than sent as `""`.
- Filter controls are built from **closed vocabularies** that mirror what the API accepts, so
  an invalid value cannot be selected.
- Optional body fields are omitted when unset rather than sent as `null`.
- Tested: the export call sends exactly `{ format }` and nothing else.

All calls are local application API calls. There is no external URL, no CDN, no analytics and
no third-party host anywhere in the admin code.

## 5. Scenario manager

List with the four filters ADMIN-001 accepts (platform, level, disposition, lifecycle),
server-paged. Detail shows every version newest-first with its lifecycle stated **in words
and a pill**, never colour alone: Draft / Published / Retired.

Actions, each behind a confirmation dialog that explains the consequence:

| Action | Behaviour |
|---|---|
| Publish | Says the currently live version will be retired, and that validation runs first |
| Deactivate | Says a retired version **cannot be republished** — clone it first |
| Clone | Creates a new draft; an optional target id creates a new scenario |
| Edit metadata | Says plainly when the edit will branch a new version instead of rewriting |

### Evaluation data is behind a deliberate disclosure

The API returns the full authoring record **including the `evaluation` answer key**, because
an author cannot edit what they cannot see. This UI does not therefore put it on screen. The
feedback block sits behind a collapsed, explicitly labelled "Show answer key (evaluation)"
toggle, so an instructor checking which version is live never has the correct answers in
front of them by accident. A test asserts the safe action is absent until the toggle is used.

### What is deliberately not editable

Only `owner` and `review_date` — provenance metadata. **Scenario content is not authored
here**: the six stages, the synthetic assets, the scoring table and the evaluation block are
client-supplied material that DATA-002 imported verbatim, and a web form over them is how a
bank of 100 authoritative scenarios quietly drifts from the specification it came from.

### Create is not offered

`SCENARIO_ID_PATTERN` allows `01`–`25` per platform and all 100 ids are in use, so the
backend would refuse a genuinely new scenario. Rather than offer a button that always fails,
the list carries a plain explanation and points at cloning, which is the working authoring
path. **This is a carry-forward backend limitation and was not patched in this task.**

## 6. Attempt viewer

Server-paged list, newest-started first, with the learner lookup, status, mode and a
`started_at` date range — the filters ADMIN-002 accepts, and no others.

The detail screen **recalculates nothing**. Every figure — the total, each scenario score,
each outcome class, every breakdown bucket, the remediation families and the comparison —
arrives already decided by the server, from the same authoritative result the learner is
shown. The behaviour breakdown and the path replay reuse the learner result components
unchanged, because the payload shape is the same one.

### An unfinished attempt

Driven by the server's own `result_available` flag:

- **no total score**, and the resolved points appear under their own name;
- unresolved scenarios are listed as pending with no score, disposition or feedback;
- the breakdown carries a banner saying how many scenarios it actually covers;
- remediation and comparison show the server's stable unavailable reason.

### Privacy

There is **no raw event viewer, and nothing to build one from**. The ADMIN-002 payload
carries no event id, event code, point delta, metadata, intent key, seed or frozen sequence,
and no typed learner rationale. Path replay is the compact `{step, stage, action}` projection.
Service numbers appear masked. A test walks the rendered detail page and asserts none of
those names or values appear.

## 7. Export

Two buttons, CSV and PDF, on the attempt detail screen, with loading, success and error
states.

**The UI does not pretend the browser can choose a server path.** It says what actually
happens: the server wrote the file into its own configured local export directory, and it
shows that path as a fact. It then says, in words, that choosing a different folder needs the
desktop integration that is not built yet.

"Save a copy" is a separate, honest affordance: it re-reads the artifact the server already
wrote through `GET /api/admin/exports/:filename` with credentials, and hands the bytes to the
browser's own download. It creates nothing and uploads nothing. The object URL is revoked
immediately so a large artifact is not pinned in memory.

The success panel repeats what the artifact carries — TRAINING SIMULATION, OFFLINE, the
content version, and a note when that version is superseded — so an instructor knows what
they are about to hand someone.

## 8. Instructor controls

### Reset

Offered **only for an attempt the server would actually reset**. For a completed attempt the
control is absent with a sentence explaining why, rather than present-and-disabled: a
disabled destructive control invites someone to hunt for the way to enable it, and there
isn't one. An already-reset attempt says so too.

The confirmation says the reset **cannot be undone**, and lists what survives: nothing is
deleted, resolved scenarios keep their scores, no total is produced, and the attempt stays
viewable and exportable. The optional reason uses ADMIN-004's closed vocabulary — there is no
free-text reason field anywhere.

### Archive

The confirmation **never uses delete language** (asserted by test). It leads with "Archiving
is not deletion" and lists what is kept: the profile, completed and in-progress attempts, all
runs, the event ledger and the audit history. It also states the consequences an instructor
must accept — the learner cannot sign in, an open session stops working, signing in will not
reinstate, an in-progress attempt is left as it is, and there is no way to reinstate from
this screen.

### Feedback timing

Two selects, populated from the server's own `allowed_timings` so the form cannot offer a
value the backend would reject. **Nothing is optimistic**: this is authoritative
configuration, so the screen renders what the server confirmed, and `expected_config_version`
is sent from the value that was read. A `CONFIG_VERSION_CONFLICT` produces a "this page is out
of date" panel with a reload button rather than a retry that would overwrite a colleague.

The server's `enforcement` block is rendered verbatim, so an instructor selecting `immediate`
is told that it is recorded as policy but not yet enforced.

There is nothing for scoring, either taxonomy, selection, evaluation keys or any security or
network setting — a test asserts the page contains exactly the two timing selects and no
other input.

## 9. Audit

ADMIN-005 already exposes `GET /api/admin/audit` with a safe projection, so this screen
consumes it. **No new audit API was created and the `AuditEvent` model is never touched
directly.**

There are **no mutation controls** — no edit, no delete, no "clear log", not even a disabled
one. The log is append-only server-side by four independent mechanisms, and a UI offering a
mutation that cannot happen would misrepresent the guarantee that makes it evidence.

## 10. Accessibility

- Semantic landmarks: a real `<nav>` with an accessible name, `<main>` with a skip link, one
  `<h1>` per page, and a `<caption>` on every table.
- Every filter control has a real `<label>`; every icon is `aria-hidden` with text beside it.
- **No status is communicated by colour alone** — every lifecycle state, attempt status and
  outcome class is a word as well as a tone.
- Interactive targets are at least 44px tall (`min-h-11`), asserted by test.
- Confirmation dialogs reuse the simulation's `Modal`, which has a real focus trap, Escape
  handling and focus restoration; a test asserts focus enters the dialog and Escape closes it.
- Wide tables scroll **inside their own container**, so the page never scrolls sideways.
- Loading, empty and error states exist on every list; `aria-live` regions announce the result
  of an action.
- Focus rings are explicit (`focus-visible:outline-2`) on every link, button and control.

## 11. Verification

Driven in a real browser against a **throwaway** backend, replica set and database — the
production database was never used for this and no production record was created, changed or
read for verification.

Verified: admin login · scenario list · scenario detail and the answer-key disclosure ·
attempt list · completed attempt detail · incomplete attempt detail · CSV export · PDF export
· reset absent for a completed attempt · reset confirmed and applied on an in-progress attempt
· archive confirmed and applied · archive cancel sends nothing · feedback configuration saved
· audit log showing all five resulting entries · admin logout · an unauthenticated visitor
redirected out of the admin area.

## 12. Known limitations

- **Creating a genuinely new scenario is impossible** while all 100 ids are in use. Surfaced
  in the UI, not patched — carry-forward backend item.
- **Scenario content is not editable** through this UI by design; only provenance metadata is.
- **`immediate` feedback timing is recorded but not enforced** by the backend. The screen says
  so using the server's own wording.
- **No arbitrary "Save as…"** — the browser cannot choose a host path, and no Electron layer
  exists.
- ~~**No cross-attempt statistics.**~~ Superseded 24 September 2026: ENHANCEMENT-001 added an
  aggregate dashboard over real completed-attempt data (`ADMIN_DASHBOARD.md`).
- **The ADMIN-002 viewer does not expose archival state**, so this UI cannot show whether a
  learner is already archived; the archive action is idempotent and reports `changed: false`.
- **No unarchive**, matching the backend.
- **Viewport emulation could not be applied in the verification browser**, so the sub-640px
  layout was not confirmed visually. No horizontal overflow was measured at the pane width,
  and the overflow-container behaviour is covered by test.
