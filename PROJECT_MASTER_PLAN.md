# PROJECT MASTER PLAN

**Project:** Cyber Social Engineering & Fraud Detection Simulation and Assessment System
**Last updated:** 4 September 2026 (client specification alignment audit - see **Section 15**)

> ## ⚠ START HERE - THE AUTHORITATIVE SPECIFICATION CHANGED ON 4 SEPTEMBER 2026
>
> **`Interactive_Social_Engineering_Scenario_UI_Development_Specification.pdf`** (Version
> 1.0, 02 September 2026, 116 pages) is now the **authoritative client implementation
> specification**. It **supersedes previous implementation assumptions wherever they
> conflict**.
>
> **Read [Section 15](#15-client-specification-alignment--4-september-2026) before doing
> any development.** Sections 1-14 below are retained as project history; where they
> conflict with Section 15, Section 15 wins.
>
> **`ENHANCEMENT-001` (Admin Dashboard + Admin UI redesign) is COMPLETE (16.39), and `ENHANCEMENT-002`
> (learner login redesign) is COMPLETE (16.41).** The client MOM of **24 September 2026** approved three
> final enhancements; it **supersedes** the cancellation below for the dashboard only. Enhancement 3
> (Demo user + 10-scenario flow) is NOT started. Release DB cleanup, git finalisation and the handover
> build wait for all three.
>
> ~~**`FE-014` / `BE-005b` Admin statistics is CANCELLED, not paused.**~~ *(Superseded for the
> dashboard by the 24 September 2026 MOM - see 16.39.)* The 7 September 2026
> acceptance audit (**15.43**) established that the authoritative specification contains no
> admin-statistics requirement at all.
>
> **`ACCEPT-002` is COMPLETE and the acceptance blocker B1 is RESOLVED (15.44).** The
> network-off acceptance run was executed on the production build with external networking
> denied at both the Node and browser layers, with the browser monitor calibrated by three
> deliberate control requests: **zero outbound attempts by the application**, 100/100 scenarios
> traversed all six stages to resolution, 511/511 assets local, exports and feedback verified.
> **There is no blocker left.** No product defect was found.
>
> **`UI-004` - dashboard activity orchestration - is COMPLETE (15.45).** Specification
> section 3 is closed: the 1-4 second post-idle delivery window, the three-toast tray, the
> four app tiles with badge, status and preview, the profile chip menu including
> instructor-controlled restart, the orchestrator status with Resume, and Rules / Report a
> simulation issue. Frontend only - no backend file, endpoint or event code changed.
>
> **`MIGRATION-VERIFY-001` is COMPLETE (15.46).** The project was moved to a new laptop
> after UI-004. The full baseline was reproduced there on Node 24.15.0 - backend
> 640 / 399 pass / 0 fail / 241 skipped, engine 241 / 241, frontend 173 / 173 with lint and
> build clean - the restored database matches the source bank exactly and both fingerprints
> are unchanged. No product file and no production document was modified.
>
> **`LOGIN-001` is COMPLETE (15.47), and ACCEPTANCE-001 gap `G4` is closed.** The section 2
> login states now exist: the profile-found card when a service number already resolves to a
> profile, a storage-error state with a bounded Retry, and the Instructor help / Exit footer.
> Frontend only - no backend file, endpoint, model or contract changed, and no new endpoint
> was added: the candidate API was already signalling everything the screen needed.
>
> **`PROFILE-001` is COMPLETE (15.48), and ACCEPTANCE-001 gap `G3` is closed.** The
> `LearnerProfile` contract is now persisted: `service_no_masked` is stored, `last_seen_at`
> is recorded on sign-in and on a throttled session read, and the briefing acknowledgement is
> a server-side version plus timestamp that a reload retains and a version bump re-requests.
> `Candidate` remains the internal model name - 15.16's mapping was kept, not a rename - so
> every attempt, run and event still resolves through the same `_id`. One idempotent backfill
> populated `service_no_masked` on the four existing profiles and changed nothing else.
>
> **`PROGRESS-001` is COMPLETE (15.49), and ACCEPTANCE-001 gap `G2` is closed.**
> `ProgressSnapshot` exists as a **derived read model** - one document per learner, rebuilt by
> full recomputation from completed attempts, so a retried completion cannot double-count.
> `ScenarioRun` is still the scoring authority and `Attempt` still owns completion; nothing
> the snapshot stores is ever read back to decide a score. `GET /api/progress` publishes it
> candidate-safe, and section 7's **exposure count** now appears beside the trend on the
> result screen and on the dashboard. **No production backfill was needed** - the read path
> builds a missing snapshot on demand.
>
> **`CLIENT-POLISH-001` is COMPLETE (15.50).** The client's screenshot review asked for two
> things: assessment language instead of casual practice framing, and "a glimpse of the
> individual module simulators" that "appear similar to real-world applications". The line
> they named - *"This is only practice"* - is gone from the briefing, replaced by
> **Assessment environment** with every safety fact kept; and opening any quiet app now
> shows that platform's own chrome (WhatsApp's Chats/Status/Calls, Instagram's wordmark and
> bottom navigation, Gmail-style categories, the Messages list) instead of one grey box.
> **The required TRAINING SIMULATION rail was not touched** - the feedback was about casual
> wording, never about removing the simulation marker.
>
> **The next task is `FEEDBACK-001`** - training-mode immediate feedback, which closes gap
> **G1**. See 15.45 for the full remaining sequence.
> (`DATA-001`, `DATA-002`, `ENGINE-001`, `SELECT-002`, `DEPLOY-001`, `API-001`, `DATA-003`,
> `UI-001`, `RESULT-001`, `UI-002`, `UI-003`, `ADMIN-005`, `ADMIN-001`, `ADMIN-002`,
> `ADMIN-003`, `ADMIN-004` and `ADMIN-006` are complete - see 15.26 to
> 15.42, and the full acceptance audit is 15.43. **The instructor half of section 6 is finished.** The append-only audit log the
> other Admin tasks write through exists, the scenario manager authors the bank through it,
> instructors can inspect any attempt - completed or in progress - through a read-only viewer
> that reuses the authoritative result projection rather than recomputing one, either can be
> exported offline as a marked, versioned CSV or PDF with no new dependency, and an
> instructor can reset an incomplete attempt, archive a profile and configure feedback
> timing, each transactionally coupled to its audit entry. All 100
> client scenarios are imported, active and carry structured synthetic content; the
> six-stage runtime engine runs them, attempts are selected deterministically and frozen,
> the candidate API serves them, the simulation plays them on a simulated handset, and a
> completed attempt yields the full section 7 result projection - now rendered on the
> result screen. **The candidate journey is complete end to end.**)
> (`ALIGN-005a` attack-family taxonomy, `ALIGN-005b` trigger taxonomy / EVI and
> `ALIGN-005c` deployment + transaction strategy are complete - see 15.23, 15.24, 15.25.
> Only Question 18, admin commercial scope, remains open, and it blocks Phase 11 only.)

**Source of truth for requirements (historical - now PRIORITY 5, see 15.1):**
`Final MCTE Proposal.docx` in this folder -
Project Proposal **Version 1.0**, 02 September 2026 (the final approved proposal).
Confirmed 4 September 2026 to be byte-identical (md5 `a545a174ab79...`) to the
`Social_Engg_Training_Simulator MCTE.docx` this plan previously named, which lives in
Downloads and is **not** in the project folder. Use the project-folder copy.
The older `Project_Proposal.docx` in this folder is superseded.
**Backend design:** `docs/QUESTION_ENGINE_DESIGN.md` (BE-000)

> **Context recovery rule:** If a new session starts with no memory of this project,
> read this file first, then inspect the code. Continue from **Next Task**.
> Do not restart the project and do not rebuild existing components.

---

## 1. Project Overview

A local (offline) training application for Army/Defence candidates. The candidate is
shown realistic-looking messages and must judge whether each one is genuine or a fraud.
The system scores the answers, produces an EVI (Emotional Vulnerability Index) profile,
stores assessment history and reports statistics to an administrator.

- 4 channels: WhatsApp, Instagram, SMS, Email
- Candidate identifies with **name + phone / service number** only
- Journey: Login -> Briefing -> Dashboard -> Assessment -> Result & Feedback -> History
- Admin panel is **statistics only** (no scenario authoring UI)
- Runs on a standalone Windows PC, no internet

### Assessment architecture (decided 2 September 2026)

> 40 scenarios will exist in the backend scenario pool: 10 WhatsApp, 10 Instagram,
> 10 SMS, and 10 Email. A candidate's actual assessment will contain 10 scenarios
> selected from the combined 40-scenario pool and presented as a mixed sequence across
> the four channels. The exact selection, randomization, distribution,
> repeat-prevention, and test-generation rules will be designed during the
> assessment/backend phase.

**Frontend consequence (FE-007):** The assessment UI is designed as one mixed
10-question assessment. Questions may belong to WhatsApp, Instagram, SMS, or Email.
The frontend displays one current question at a time and is designed to consume
backend-provided question data. Question selection, sequence generation, candidate
history, repeat prevention, and persistence belong to the backend question engine.

**Composition (confirmed 2 September 2026).** The MVP assessment contains exactly 10
mixed scenarios. The malicious/legitimate composition may be 6+4, 7+3, or 8+2. The
composition is selected by the backend question engine. The four channels remain
independently represented in the 40-scenario pool, and the final 10-question sequence is
mixed across channels. Never 10+0 and never 0+10 - a candidate who answers "fraud" every
time must not score full marks, and neither must one who answers "genuine" every time.

**Judgement is three-way** (confirmed 2 September 2026): `genuine`, `fraudulent`,
`needs_verification`, scored 0-3 per the proposal.

**The final proposal still carries the older journey wording** - "the server selects 10
scenarios for that channel", "after 10 scenarios the channel is marked Completed", and a
dashboard "progressed out of 10". The user confirmed on 2 September 2026 that the
implemented architecture above supersedes that wording. It is left in place here as a
known documentation conflict rather than an architecture change.

**This system is NOT four separate 10-question tests.** The four channels are scenario
categories / pools, not assessments. Any screen, route, model or copy that implies
"start the WhatsApp test" is wrong. This decision supersedes the earlier reading of the
proposal, which described 10 scenarios per channel taken channel by channel - raise the
change with the client before the backend phase.

---

## 2. Confirmed Technology Stack

| Layer | Choice | Status |
|---|---|---|
| Frontend | React 19 + Vite 8 + **JavaScript** | Set up |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) | Set up |
| Routing | React Router 7 | Set up |
| Icons | lucide-react (single icon library) | Set up |
| Backend | Node.js 24 + Express 5 (ESM) | Set up |
| Database | MongoDB 8.3 on localhost + Mongoose 9 | Set up |
| Packaging | Electron (later phase) | Not started |

Fixed decisions: no TypeScript, no Next.js, no Redux, no component library, no web fonts.

---

## 3. Frontend Architecture

- **Pages** hold screen logic and compose UI components. One page = one route.
- **Layouts** own page chrome. `AuthLayout` is the split entry screen (login);
  `AppLayout` (in `components/layout`) is the shell for every screen after login.
- **components/ui** are generic and presentational only (no app logic).
- **components/common** are app-specific but reusable (brand, simulation badge).
- **services** isolate all outside-React I/O (HTTP, storage) so screens stay clean.
- **constants** hold values referenced in more than one place (routes, channels, labels).
- State is plain `useState` for now. A shared store is introduced only when the
  assessment flow actually needs it.

Future simulated screens (WhatsApp / Instagram / SMS / Email) will be presentational
components that render scenario objects fetched from the API - no channel-specific
logic inside pages.

---

## 4. Folder Structure

```
Social Engineering Fraud Training PDS/
|-- PROJECT_MASTER_PLAN.md          <- this file
|-- Project_Proposal.docx           <- requirements source of truth
|-- build_proposal.py
|-- docs/
|   `-- QUESTION_ENGINE_DESIGN.md   <- backend design (BE-000, amended at BE-001)
|-- backend/
|   |-- .env.example
|   |-- data/
|   |   |-- scenarios.sample.json   <- hand-written schema reference, 8 scenarios
|   |   |-- scenarios.instagram.json <- 10 authored Instagram scenarios (FE-009)
|   |   |-- scenarios.sms.json      <- 10 authored SMS scenarios (FE-010)
|   |   |-- scenarios.email.json    <- 10 authored Email scenarios (FE-011)
|   |   |-- scenarios.whatsapp.json <- 10 authored WhatsApp scenarios (FE-017)
|   |   `-- scenarios.dev-pool.json <- generated padding for the other channels
|   |-- tests/                      node --test: sequence, scoring, summary,
|   |                               password, admin throttle, operator prompts
|   |-- scripts/
|   |   |-- importScenarios.js
|   |   |-- createAdmin.js          <- OPERATOR: the only way an admin is created
|   |   |-- prompt.js               <- terminal prompts (hidden password entry)
|   |   |-- generateDevPool.js      <- DEV ONLY, now produces nothing (all
|   |   |                              channels authored); kept until the pool
|   |   |                              has been validated in use
|   |   |-- validateApi.js          <- DEV ONLY, end-to-end candidate API check
|   |   `-- validateAdminApi.js     <- DEV ONLY, end-to-end admin security check
|   `-- src/
|       |-- config/                 env.js, database.js
|       |-- constants/              assessment.js  (single source for the fixed rules)
|       |-- models/                 Scenario.js, Candidate.js, Assessment.js,
|       |                           AdminUser.js (separate collection - BE-005a)
|       |-- services/               scenarioImportService.js, candidateService.js,
|       |                           sequenceGenerationService.js (pure),
|       |                           scoringService.js (pure), assessmentService.js,
|       |                           adminService.js
|       |-- controllers/            health, candidate, scenario, assessment, admin
|       |-- routes/                 index.js + one router per resource
|       |-- middleware/             errorHandler.js, notFound.js, session.js,
|       |                           adminSession.js, adminThrottle.js
|       |-- utils/                  ApiError.js, asyncHandler.js, password.js
|       |-- app.js
|       `-- server.js
|-- .claude/launch.json             <- dev-server config
`-- frontend/
    |-- index.html
    |-- vite.config.js              <- react + tailwind plugins, "@" alias
    |-- jsconfig.json               <- "@" alias for editors
    |-- .env.example
    |-- public/shield.svg
    `-- src/
        |-- assets/images/
        |-- components/
        |   |-- ui/                 Button, Input, FormField, Card, Alert, Spinner, ProgressBar
        |   |-- common/             BrandLogo, SimulationBadge, StepCard, StatusBadge
        |   |-- assessment/         AssessmentHeader, ChannelIndicator,
        |   |                       ScenarioContainer, PhoneSimulator,
        |   |                       DecisionPanel
        |   |   `-- channels/       WhatsAppRenderer, InstagramRenderer,
        |   |                       SmsRenderer, EmailRenderer,
        |   |                       GenericRenderer (fallback only)
        |   `-- layout/             PageContainer, AppHeader, AppLayout
        |-- constants/              app.js, routes.js, channels.js, assessment.js
        |-- hooks/                  useDocumentTitle.js, useCandidate.js
        |-- layouts/                AuthLayout.jsx
        |-- context/                candidateContext.js, CandidateProvider.jsx
        |-- pages/                  LoginPage, BriefingPage, DashboardPage,
        |                           AssessmentPage, HistoryPage, NotFoundPage
        |-- routes/                 AppRoutes.jsx, RequireCandidate.jsx
        |-- services/               apiClient.js, authApi.js, assessmentApi.js
        |-- styles/                 index.css (tokens + base + utilities)
        |-- utils/                  cn.js, validation.js
        |-- App.jsx
        `-- main.jsx
```

---

## 5. Design System

All tokens live in **one place**: the `@theme` block in `src/styles/index.css`.
Tailwind v4 exposes each token both as a CSS variable on `:root` and as a utility
class. **Never hardcode a colour in a component - add a token instead.**

| Group | Tokens |
|---|---|
| Brand | `primary` #12395F, `primary-hover`, `primary-active`, `primary-soft`, `primary-contrast`, `secondary`, `secondary-soft` |
| Surfaces | `background` #F4F6F9, `surface`, `card`, `overlay` |
| Text | `text`, `text-muted`, `text-inverse`, `text-on-dark-muted` |
| Lines | `border`, `border-strong` |
| Status | `success`, `warning`, `danger`, `info` (+ `-soft` variants) |
| Channel accents | `channel-whatsapp`, `channel-instagram`, `channel-sms`, `channel-email` (icon tint only) |
| WhatsApp surfaces | `wa-header`, `wa-canvas`, `wa-bubble-in`, `wa-bubble-out`, `wa-tick`, `wa-meta` (used only inside the phone frame) |
| Interaction | `focus` |
| Radius | `radius-sm/md/lg/xl` |
| Elevation | `shadow-xs/sm/md/lg` |
| Motion | `duration-fast/base/slow`, `animate-fade-in`, `animate-fade-up`, `animate-shake` |

Usage example: `className="bg-primary text-primary-contrast rounded-md shadow-md"`.

Also in the global stylesheet: base typography, visible `:focus-visible` ring,
selection colour, custom scrollbar, and a `prefers-reduced-motion` guard.

**Font:** system stack only (`Segoe UI`, system-ui, ...). No Google Fonts - the
application must work with no internet.

---

## 6. Task Board

| ID | Task | Status |
|---|---|---|
| FE-001 | Frontend project setup (React + Vite + Tailwind) | **COMPLETED** |
| FE-002 | Design system / centralised tokens + global CSS | **COMPLETED** |
| FE-003 | Reusable UI foundation | **COMPLETED** |
| FE-004 | Candidate Login screen | **COMPLETED** |
| FE-005 | Briefing screen + shared AppHeader / AppLayout | **COMPLETED** |
| FE-006 | Candidate dashboard | **COMPLETED** |
| FE-007 | Assessment shell (3 sections) + phone frame | **COMPLETED** |
| BE-000 | Question-engine design (schemas, sequencing, API contracts) | **COMPLETED** |
| BE-001 | Backend scaffold + Mongo models + scenario import | **COMPLETED** |
| BE-002 | Question engine: selection service + assessment endpoints | **COMPLETED** |
| FE-015a | Connect the frontend to the assessment API | **COMPLETED** |
| FE-008 | WhatsApp simulation renderer | **COMPLETED** |
| FE-008 | WhatsApp simulation screen | Pending |
| FE-009 | Instagram simulation renderer | **COMPLETED** |
| FE-010 | SMS simulation renderer | **COMPLETED** |
| FE-011 | Email simulation renderer | **COMPLETED** |
| FE-012 | Result screen + feedback + ~~EVI profile~~ | **SUPERSEDED** - becomes the trigger response profile; EVI retired, see 15.24. Superseded by Phase 10 `RESULT-002` |
| FE-017 | Re-author the WhatsApp scenario pool | **COMPLETED** |
| FE-013 / BE-004 | Assessment history (`GET /api/assessments` + `/history`) | **COMPLETED** |
| BE-005a | Admin authentication foundation (AdminUser, `admin_session`, `requireAdmin`, provisioning CLI, throttling) | **COMPLETED** |
| FE-014 / BE-005b | Admin statistics dashboard | **PAUSED 4 Sep 2026** - superseded by Section 15; do not start |
| FE-015 | API integration layer (replace local placeholders) | Pending |
| FE-016 | Final polish, comments & documentation pass | Pending |
| BE-003+ | Scoring engine, EVI engine, result storage, admin APIs | **SUPERSEDED** - client §5 now defines scoring; see 15.10 |
| ALIGN-001..004 | Client specification alignment audit (Section 15) | **COMPLETED 4 September 2026** |
| ALIGN-005a | Question 10 — canonical attack-family taxonomy (15.23, `docs/ATTACK_FAMILY_TAXONOMY.md`) | **COMPLETED 4 September 2026** |
| ALIGN-005b | Question 11 — canonical trigger taxonomy + EVI decision (15.24, `docs/TRIGGER_TAXONOMY.md`) | **COMPLETED 4 September 2026** |
| ALIGN-005c | Question 20 — deployment topology + transaction strategy (15.25, `docs/DEPLOYMENT_AND_TRANSACTION_STRATEGY.md`) | **COMPLETED 4 September 2026** |
| DATA-001 | `ScenarioDefinition` schema + validation groundwork (15.26, `docs/SCENARIO_DEFINITION_SCHEMA.md`) | **COMPLETED 4 September 2026** |
| DATA-002 | Client 100-scenario import + validation pipeline (15.27, `docs/SCENARIO_IMPORT.md`) | **COMPLETED 4 September 2026** |
| ENGINE-001 | Server-authoritative six-stage scenario engine (15.28, `docs/SCENARIO_ENGINE.md`) | **COMPLETED 4 September 2026** |
| SELECT-002 | Deterministic 10-scenario attempt selection (15.29, `docs/SCENARIO_SELECTION.md`) | **COMPLETED 4 September 2026** |
| DEPLOY-001 | Local MongoDB replica set (15.30, `docs/LOCAL_MONGODB_REPLICA_SET.md`) | **COMPLETED** - rs0 PRIMARY, transactions verified |
| API-001 | Candidate attempt & scenario orchestration API (15.31, `docs/ATTEMPT_API.md`) | **COMPLETED 4 September 2026** |
| DATA-003 | Structured synthetic content / assets (15.32, `docs/SYNTHETIC_CONTENT_SCHEMA.md`) | **COMPLETED 5 September 2026** |
| UI-001 | Simulation shell + four platform renderers (15.33, `docs/SIMULATION_UI.md`) | **COMPLETED 5 September 2026** |
| RESULT-001 | Candidate result projection + results API (15.34, `docs/RESULT_API.md`) | **COMPLETED 5 September 2026** |
| UI-002 | Realistic mobile device simulation UX (15.35, `docs/SIMULATION_UI.md`) | **COMPLETED 5 September 2026** |
| UI-003 | Simulation polish + result experience + acceptance hardening (15.36, `docs/SIMULATION_UI.md`) | **COMPLETED 6 September 2026** |
| ADMIN-005 | Append-only instructor audit log foundation (15.37, `docs/ADMIN_AUDIT_LOG.md`) | **COMPLETED 6 September 2026** |
| ADMIN-001 | Scenario manager backend/API (15.38, `docs/ADMIN_SCENARIO_MANAGER.md`) | **COMPLETED 6 September 2026** |
| **ADMIN-002** | **Attempt viewer: filter by learner and date, scores and action path** | **NEXT** |

> **The task IDs above are the pre-alignment roadmap.** The new authoritative roadmap and
> its task IDs (`DATA-`, `EVENT-`, `ENGINE-`, `SELECT-`, `SCORE-`, `UI-`, `RESULT-`,
> `ADMIN-`, `SAFE-`, `A11Y-`, `TEST-`) are in **15.18**.

---

## 7. Decisions Made

1. **Tailwind CSS v4** with the Vite plugin - no `tailwind.config.js`; tokens are
   declared in CSS via `@theme`, which satisfies the "one central design system"
   requirement without a second config file.
2. **System fonts only.** The target machine is offline, so no web font is loaded.
3. **`frontend/` subfolder** at the project root, leaving room for `backend/` later.
4. **`@` alias -> `src/`** for readable imports.
5. **No global state library.** `useState` is enough today; revisit at FE-007.
6. **Candidate details stored in `sessionStorage`** (`services/candidateStorage.js`)
   purely so screens after login can show the name. This is a temporary stand-in for
   the server session, marked with a TODO in `LoginPage`. No fake API responses exist.
7. **`apiClient.js` written but unused** - a real fetch wrapper ready for the backend.
8. **One field for phone / service number.** The proposal (Section 14) still lists
   "confirmation of the login fields" as an open client question, so validation is
   deliberately permissive: 6-20 characters, letters/digits/`-`/`/`, at least 4 digits.
9. **Each screen ships with a labelled placeholder for the next one** so the CTA can
   be tested end to end. `AssessmentPage` is the current one; FE-007 replaces it. The
   placeholder always says which task will build it.
10. **Mobile layout order differs from desktop.** On desktop the intro sits left and
    the form right; on mobile a short intro comes first, then the form, then the
    "how it works" steps, so the fields are reachable without long scrolling.
11. **`AppLayout` + `AppHeader`** (FE-005) are the shell for every screen after login:
    sticky brand bar with the simulation badge, content container, footer note. The
    login screen keeps `AuthLayout` - a split entry screen is a different shape and
    forcing one layout to serve both would have been worse.
12. **Channel metadata lives in `constants/channels.js`** - label, lucide icon and a
    full Tailwind accent class string per channel. Full strings (not built with
    template literals) so Tailwind's scanner can detect them. The dashboard and the
    assessment header will read from the same list.
13. **`Instagram` is not available in lucide-react v1** (brand icons were removed), so
    the Instagram channel uses the `Camera` icon. Check icon names against the
    installed package before using them - several older names were also renamed.
14. **Briefing uses a two-column desktop layout** (content left, sticky summary and CTA
    right) instead of one long column, so the Continue button stays visible on desktop.
    On mobile it collapses to read-then-continue order.
15. **The assessment is one mixed 10-scenario test** (see Section 1). Three code changes
    enforce this so the wrong shape cannot creep back in:
    - `ROUTES.ASSESSMENT` changed from `/assessment/:channel` to `/assessment`
    - `constants/app.js` now exports `SCENARIOS_PER_CHANNEL` (10, pool per channel),
      `SCENARIO_POOL_SIZE` (40, backend pool) and `ASSESSMENT_SCENARIO_COUNT` (10, what
      the candidate actually answers). The old `TOTAL_SCENARIOS` name was removed
      because it read as "the candidate answers 40".
    - Login and briefing copy corrected - they previously told the candidate they would
      answer 40 messages. Channel cards now read "10 available", not "10 messages".
16. **Dashboard channel cards are informational only.** No per-channel start button,
    no per-channel progress. There is exactly one primary CTA on the page.
17. **`ASSESSMENT_STATUS`** (`constants/assessment.js`) drives both the `StatusBadge`
    and the CTA through a small lookup: NOT_STARTED -> Start Assessment,
    IN_PROGRESS -> Continue Assessment, COMPLETED -> View Results. Only NOT_STARTED is
    reachable today; the other two are structure, not behaviour.
18. **Dashboard mock state is one `ASSESSMENT` object** at the top of `DashboardPage`
    with a TODO, not a service or a store. Nothing is persisted - no localStorage, no
    fake progress, no fake API. FE-015 replaces that one object with the API response.
19. **Primary CTA sits inside the assessment card**, not at the foot of the page. It is
    above the fold at every tested width, which the suggested bottom placement was not.
20. **The assessment screen is built around "the current question", not a loaded list.**
    `AssessmentPage` holds one question index and renders one question. Swapping the
    mock for `apiClient.get('/assessment/current')` does not change the layout.
21. **`AppLayout` gained an optional `subHeader` slot** rather than a second layout.
    `AssessmentHeader` renders there, sticky under the app header, so the progress bar
    stays visible while scrolling. The TRAINING SIMULATION marker stays in `AppHeader`
    and is not duplicated.
22. **`ScenarioContainer` never knows its channel.** It is a phone frame that renders
    `children`; FE-008 to FE-011 supply the channel renderer. This is what keeps the
    mixed sequence from leaking channel logic into the page.
23. **The answer has the three parts the proposal defines** - judgement, action, reason
    - built as native radio groups in `fieldset`/`legend`. Judgement (Safe / Fraud) is
    fixed in `constants/assessment.js`; action and reason lists arrive per scenario, so
    the shell passes mock lists as props rather than hardcoding them.
24. **Mock data lives in `src/mocks/assessment.js`** - one file, one folder, marked for
    deletion at FE-015. Its 10 questions use a deliberately mixed channel order so the
    shell demonstrates the real assessment shape. Nothing is persisted: no
    localStorage, no sessionStorage, no API call, no scoring.
25. **Mock navigation is explicitly temporary.** Submit advances the local index and
    clears the answer; Previous steps back. The server will own this. Answers are not
    retained when moving between questions, because the shell has nowhere to keep them
    - do not treat that as the intended behaviour.
26. **Elapsed time is not on the screen yet.** The proposal puts it in the heading bar,
    but timing must be server-authoritative, so a client-side timer was not added. Fold
    it into `AssessmentHeader` when the engine supplies the start time.

--- BE-000 (backend design; full detail in `docs/QUESTION_ENGINE_DESIGN.md`) ---

27. **Three collections**: `candidates`, `scenarios`, `assessments`. Answers are embedded
    in the assessment (bounded at 10, always read with the parent, atomic submission).
28. **Scenario schema is layered** - metadata / simulation content / answer options /
    hidden `evaluation`. `evaluation` and all option `marks` are stripped by a single
    `toCandidateJSON()` so a controller cannot leak the answer key by omission.
29. **One generic simulation model for all four channels**: a screen graph
    (`entryScreenId` + `screens[]`), each screen holding typed content blocks and
    navigation actions. The four renderers differ in chrome, not in data handling; a
    fifth channel needs a renderer and a `channel` value, not a schema change. Links are
    strings rendered as text - no `href`, no fetch, nothing reaches the network.
30. **The 10-scenario sequence is generated once and frozen** on the assessment document.
    `POST /assessments` is idempotent - an existing IN_PROGRESS assessment is returned
    rather than creating a second one - so refresh and reconnect resume the same test and
    the sequence cannot be re-rolled for an easier set.
31. **Candidate history is an embedded `seenScenarios` array on Candidate** (option A of
    three evaluated). Cheapest correct answer at this scale; treated as a rebuildable
    cache with the assessments as the audit trail. A scenario counts as seen **when it is
    served**, not when the assessment completes - so abandoning at question 1 does not
    burn the whole pool, and abandon-restart cannot farm the same scenarios.
32. **Selection = channel floor + legitimacy mix.** Two per channel guaranteed (8), then
    2 free picks. Pure random was rejected: drawing 10 from 40 leaves a ~3.5% chance a
    given channel is absent and a ~1-in-7 chance some channel is missing entirely, which
    would break the "four apps" promise the built UI already makes. A 7 fraudulent /
    3 genuine target is enforced too - without it, "answer fraud every time" can score
    100. Both halves of the pool exhaust at exactly 4 assessments.
33. **Exhaustion**: prefer unseen; take all unseen then fill from least-recently-seen;
    never repeat inside one assessment; reshuffle so a repeat attempt differs in order.
    Constraints relax in a fixed order - novelty first, then channel floor, then the
    legitimacy mix - because assessment quality outranks freshness.
34. **Timing is server-authoritative.** `servedAt` is stamped once on first delivery, so
    a refresh cannot reset the clock; `durationMs` is computed server-side. Timing is
    reported and never affects marks (Developer Brief rule).
35. **Session identity via httpOnly cookie.** `candidateStorage.js` and `src/mocks/` are
    deleted at FE-015; screens read the name from `GET /api/auth/me`. One auth system,
    added once.

--- BE-001 (backend foundation) ---

36. **Judgement is three-way** - `genuine` / `fraudulent` / `needs_verification`, scored
    0-3, as the proposal's scoring table requires. This resolves the conflict raised in
    BE-000. The FE-007 decision panel was changed from two options to three ("Genuine" /
    "Fraud" / "Needs checking") so both sides agree; that is the only frontend change in
    BE-001.
37. **Composition is one of 6+4, 7+3 or 8+2**, chosen per assessment by the engine, and
    stored on the assessment so a generated test is auditable. The Assessment model
    rejects any other split, including 10+0 and 0+10. This replaces the fixed 7+3 that
    BE-000 proposed.
38. **Backend is ESM Express 5 + Mongoose 9** on Node 24. No nodemon (`node --watch`), no
    logger, no test framework yet - four runtime dependencies: express, mongoose, dotenv,
    cors.
39. **Two layers guard the answer key.** `evaluation` is `select: false` so ordinary
    queries never load it (the scoring service must ask with `.select('+evaluation')`),
    and `Scenario.toCandidateJSON()` strips it plus every option's `marks` and
    `isCriticalFailure`. Both are covered by the validation run.
40. **`backend/src/constants/assessment.js` is the single source** for channels,
    compositions, judgements, marks bounds, EVI categories, bands and the simulation
    vocabulary. Models import from it; nothing hardcodes a rule.
41. **Import is all-or-nothing.** The whole file is validated before any write, so one
    bad entry cannot leave the pool half-updated. Upsert is by `scenarioCode` and bumps
    `version`, keeping published scenarios explainable.
42. **`/api/scenarios` exposes counts only.** There is deliberately no endpoint that
    lists or fetches scenario content - a candidate receives one scenario at a time
    through the assessment question endpoint, already stripped.
43. **No session layer yet.** `POST /api/candidates` creates or finds a candidate and
    returns its id; nothing is protected because no assessment endpoint exists. The
    httpOnly cookie session lands in BE-002 alongside the endpoints that need it, rather
    than shipping a half-built auth system now.
44. **Mongoose 9 dropped the `next` callback in document middleware.** All three
    `pre('validate')` hooks are async functions that throw. Worth knowing before adding
    a fourth.

--- BE-002 (question engine) ---

45. **Selection is a pure function.** `sequenceGenerationService.generateSequence()`
    takes the pool and the candidate's history and returns a plan - no database, no
    dates, no globals, `random` injectable. That is what made the exhaustion cases
    testable at all. Controllers never touch selection.
46. **The composition rule is the one constraint that never bends.** If the randomly
    chosen split cannot be built, the engine tries another **allowed** split (6+4, 7+3,
    8+2). Only the channel floor is ever relaxed. An early draft had a
    "composition-not-enforced" fallback that could have produced 10+0 - removed before
    it ever ran.
47. **Unseen preference is best-effort, not absolute**, and outranked by both the
    composition and the channel floor. A candidate with an awkward remainder can be
    served one already-seen scenario while an unseen one exists. Deliberate, matching the
    relaxation order in the design, and covered by two tests.
48. **`GET /api/assessments/:id` both resumes and serves the current question**, instead
    of the design's separate `/current-question`. It returns progress plus one question -
    never the composition and never the rest of the sequence, because knowing how many
    frauds the test holds would give the answer away.
49. **Completion is an explicit endpoint**, not a side effect of the tenth answer. It
    requires all ten answers and returns `QUESTIONS_OUTSTANDING` otherwise.
50. **Session is a signed httpOnly cookie holding the candidate id.** No session store,
    no JWT, no Redis - the signature is what stops a candidate pointing the cookie at
    someone else. Candidate identity comes only from the cookie, never from a body or
    query parameter.
51. **Someone else's assessment returns 404, not 403**, so ids cannot be probed.
52. **Feedback is returned only after an answer is recorded.** The correct judgement,
    warning signs and explanation are in the answer response - safe because the answer is
    already stored and cannot be changed.
--- FE-015a (frontend connected to the API) ---

54. **Session lives only in the httpOnly cookie.** `CandidateProvider` calls
    `GET /api/candidates/me` on start-up and keeps the candidate in memory only.
    Nothing is written to localStorage or sessionStorage - verified empty throughout a
    full run, and `document.cookie` is unreadable from JS.
55. **`RequireCandidate` guards `/briefing`, `/dashboard` and `/assessment`** as a
    layout route. It shows a spinner while the session is being checked, so a cold load
    never redirects before the answer is known.
56. **The dashboard reads `GET /api/assessments/active`, which never creates.**
    Assessment creation happens only from the Start button. `POST /api/assessments` is
    idempotent as a second line of defence, but the dashboard does not rely on it.
57. **`GET /api/assessments/active` was added to the backend during this task.** The
    dashboard has to distinguish "no assessment" from "one in progress" without creating
    one, and no other endpoint could do that. It was already specified in BE-000 section
    8.2 and simply had not been built.
58. **`/assessment` carries no id in the URL.** The page asks `active` which assessment
    it is resuming, so a refresh cannot start a second one and a stale link cannot point
    at someone else's assessment.
59. **Previous was removed rather than faked.** BE-002 has no endpoint for changing a
    submitted answer, so client-side back navigation could only desynchronise the
    assessment. The panel now says plainly that an answer cannot be changed once
    submitted. `AssessmentNavigation.jsx` was deleted with it.
60. **Per-question feedback is now shown** - marks, the correct judgement, the warning
    signs and the explanation, all returned by the API after the answer is recorded.
    This is the view FE-007 was missing.
61. **`PhoneSimulator` renders the backend simulation generically** - a screen graph of
    typed blocks, with local navigation between screens. Deliberately neutral: the four
    channel replicas are FE-008 to FE-011 and slot in behind this same data shape.
62. **A stale submit resyncs instead of erroring.** `NOT_CURRENT_QUESTION` and
    `ALREADY_ANSWERED` make the page reload its state from the server rather than show
    the candidate a conflict they cannot act on.
63. **401 anywhere clears the in-memory candidate and returns to login**, and never
    starts a new assessment.

--- FE-008 (WhatsApp renderer) ---

64. **`PhoneSimulator` owns navigation, renderers own presentation.** It resolves the
    current screen from the scenario graph, records interactions and dispatches on
    `scenario.channel` through a `RENDERERS` map. `WhatsAppRenderer` and
    `GenericRenderer` both receive the same `{ screen, actions, backAction, onAction,
    onOpen }` props. FE-009 to FE-011 are one map entry plus one component each.
65. **A channel with no renderer falls back to `GenericRenderer`.** Instagram, SMS and
    Email keep working exactly as before.
66. **No second scenario schema.** The renderer consumes the existing screen-graph model
    unchanged. The block types actually present in WhatsApp data are `listItem`, `note`
    and `message`; `linkPreview`, `image` and `attachment` are also handled because the
    schema allows them.
67. **Chat rows are the navigation.** A `listItem` with a `target` becomes a real
    `<button>` that opens the conversation, and a plain navigation action that merely
    repeats a row's target is filtered out of the action bar so the same capability is
    not offered twice. `header.showBack` drives the header back arrow.
68. **Nothing in the simulation can leave it.** There are no `<a>` elements at all -
    links, UPI ids and phone numbers are rendered as text. Navigation is local state
    over the scenario's own screens; the browser URL never changes and the simulator
    issues no network requests.
69. **The composer is chrome, not an input.** It is a styled `div` marked
    `aria-hidden`, so nothing can be typed or sent.
70. **WhatsApp surface colours are design tokens** (`--color-wa-header`, `-canvas`,
    `-bubble-in`, `-bubble-out`, `-tick`, `-meta`), not hardcoded values, following the
    existing rule.
71. **Threads open on the newest message**, the way a phone does - otherwise the last
    message sat hidden behind the action bar.
--- FE-009 (Instagram renderer) ---

73. **`InstagramRenderer` added to the `RENDERERS` map** - one entry, one component,
    same `{ screen, actions, backAction, onAction, onOpen }` props as WhatsApp. SMS and
    Email still fall through to `GenericRenderer`.
74. **One small, generic schema addition: the `profileHeader` block.** It carries
    `displayName`, `username`, `bio`, `verified`, `postCount`, `followers`, `following`
    and `isFollowing` - an identity card with public counts, exactly analogous to the
    existing `emailHeader`. Any channel with profiles can use it. Follower counts are
    stored as text so "48.2K" and "312" both work. No Instagram-only model was created.
75. **The profile grid is a rendering rule, not schema.** Consecutive `image` blocks on
    a `profile` screen are laid out three across. Nothing was added to the model for it.
76. **The renderer shows only what the scenario provides.** No "suspicious account"
    heuristics, no computed warnings - a thin follower count or a recent join date is
    just scenario data the candidate has to interpret. `verified` renders a badge only
    when the scenario sets it.
77. **Screen kinds map to views**: `list` -> DM/notification list, `thread` -> DM
    conversation, `profile` -> profile, `feed` -> post cards. `message` and any
    unrecognised kind fall through to the message view rather than blanking.
78. **The bottom navigation bar and the Follow/Message buttons are chrome.** They are
    `aria-hidden` decoration, not controls - only scenario-defined actions and list rows
    do anything.
--- FE-010 (SMS renderer) ---

80. **`SmsRenderer` added to the `RENDERERS` map.** Three of four channels now have a
    dedicated renderer; Email is the last one still on `GenericRenderer`.
81. **The sender is the training signal, so the renderer makes it visible.** A
    registered sender ID (`VM-MERUBK`) gets a service icon; a raw mobile number gets a
    person icon. Both are drawn from `header.title` / `listItem.title` with no schema
    change - the renderer only presents what the scenario already says, and never labels
    either as suspicious.
82. **`linkPreview` renders as plain blue text in SMS.** Real SMS has no rich previews,
    so showing a card there would be misleading. Same block, channel-appropriate
    presentation - which is the point of one shared model.
83. **One vocabulary addition: `call-number` in `INTERACTION_TYPES`.** Callback fraud
    (SMS-07) turns on the candidate ringing the number in the message, and there was no
    interaction for it. Generic and reusable - Email scenarios will want it too.
--- FE-011 (Email renderer) ---

85. **`EmailRenderer` completes the set.** All four channels now dispatch to a dedicated
    renderer and `GenericRenderer` is a pure safety net - it only runs if a scenario ever
    carries a channel with no renderer.
86. **No schema or vocabulary change was needed.** Email uses the existing `inbox`,
    `message` and `document` screen kinds and the existing `emailHeader`, `emailBody`,
    `attachment`, `linkPreview`, `listItem` and `note` blocks. The six existing
    interactions covered every authored scenario, so none was added.
87. **The sender address is never truncated.** The from-name is the part attackers
    control freely and the address is the part that gives them away, so `fromAddress`
    renders in full with `break-all` while the display name wraps normally. That is the
    core Email training signal and the renderer must not hide it.
88. **Attachments navigate when the scenario says so.** An `attachment` block with a
    `target` becomes a button that opens a `document` screen; without a target it is
    inert. Nothing is ever downloaded.
89. **Legitimate Email scenarios deliberately carry "suspicious" surface features** - a
    genuine receipt with a PDF attachment (EM-09) and a genuine bulletin with a link
    (EM-08) - so that "attachment or link means fraud" is not a winning heuristic.
--- FE-017 (WhatsApp content re-authoring) ---

91. **All four channels now carry authored scenario content.** No generated padding
    remains in the pool: a check for the generator's placeholder instruction text
    returns 0 documents.
92. **No renderer or vocabulary change was needed.** The existing WhatsApp renderer
    already supported every block the ten scenarios use, and the six existing
    interactions covered every action.
93. **Surface cues are deliberately split across both classes** so keyword matching
    cannot pass the test: links appear in a malicious (WA-05) and a legitimate (WA-10)
    scenario, images in four malicious and one legitimate, and the only attachment is in
    a genuine scenario (WA-09). Unknown numbers appear on both sides, and so do saved
    contacts - WA-06 is a compromised saved contact, WA-08 is a genuine one.
94. **Two malicious scenarios come from trusted sources on purpose.** WA-04 is a real
    vendor group where only the bank account changed, and WA-06 is a genuinely saved
    contact whose account was taken over. Both defeat the "unknown number means fraud"
    heuristic, which is the single most common shortcut candidates learn.
--- FE-013 / BE-004 (assessment history) ---

96. **`GET /api/assessments` returns completed attempts only.** An in-progress assessment
    is surfaced on the dashboard, not in history, so the two views never disagree about
    what is "done". Ordered `completedAt` descending with `_id` as a tiebreak, so the
    order is deterministic when two attempts finish in the same second.
97. **History is strictly read-only.** It never creates, mutates or completes anything -
    verified by an API check that the list is unchanged after a new assessment is started.
98. **A deliberate DTO, not a raw document.** The service maps each assessment to
    `{ assessmentId, status, startedAt, completedAt, totalQuestions, summary }`. The
    stored `sequence`, `composition`, `relaxations` and every per-answer field are never
    serialised, so no scenario content, answer key or composition hint can leak.
99. **`summaryOf()` was extracted and is now shared** by the completion response and the
    history list, so the two cannot drift into different definitions of the same numbers.
100. **History deviates from design section 8.6 on purpose.** That section says the list
    returns "overall score, band". Neither exists - scoring aggregation is still open - so
    the response carries `scoringPending: true` and no score, and the UI says plainly that
    the score is not available yet rather than showing a fabricated figure or a 0.
101. **Marks are reported, a score is not.** `marksAwarded` / `marksAvailable` are the
    same provisional per-scenario sums the completion endpoint already returned, so
    nothing new is exposed. The UI does not render them as a score or a band; it shows
    question counts, duration and critical-failure count only.

95. **`generateDevPool.js` now produces nothing** because every channel is in
    `AUTHORED_CHANNELS`. It is kept rather than deleted until the authored pool has been
    validated in real use.

90. **Email scenarios are authored** in `backend/data/scenarios.email.json`, and `email`
    joined `AUTHORED_CHANNELS`. The padding generator now emits WhatsApp only.

84. **SMS scenarios are authored** in `backend/data/scenarios.sms.json`, and `sms` was
    added to `AUTHORED_CHANNELS` so the padding generator cannot overwrite them. The
    generator now emits 20 scenarios (WhatsApp and Email only).

79. **Instagram scenarios are authored, not generated.**
    `backend/data/scenarios.instagram.json` holds 10 distinct scenarios covering the
    proposal's themes. `generateDevPool.js` now skips channels in `AUTHORED_CHANNELS`,
    so regenerating the padding for the other channels can never overwrite them. SMS and
    Email join that set as FE-010 and FE-011 author theirs.

72. **Malformed scenario data degrades safely**: a bad `entryScreenId` falls back to the
    first screen, an unknown block renders its text or is skipped, an action pointing at
    a missing screen records the tap and stays put, and a simulation with no screens
    shows a plain message instead of crashing.

53. **A 40-scenario development pool was needed.** `scripts/generateDevPool.js` derives
    40 padded scenarios from the 8 hand-written samples; a 10-question engine cannot be
    exercised against an 8-scenario pool. The file is gitignored and every entry is
    marked `DEVELOPMENT SAMPLE`. The client's pack replaces it.

---

## 8. Dependencies Installed

### Frontend

**Runtime:** `react` 19.2, `react-dom` 19.2, `react-router-dom` 7.18, `lucide-react` 1.39
**Dev:** `vite` 8.2, `@vitejs/plugin-react` 6.1, `tailwindcss` 4.3, `@tailwindcss/vite` 4.3, `oxlint` 1.79

Nothing else. **No new dependency was added for FE-005, FE-006 or FE-007.**
No UI kit, no animation library, no form library - CSS animations and plain React
state cover the current needs.

### Backend (BE-001)

**Runtime:** `express` 5.2, `mongoose` 9.9, `dotenv` 17.4, `cors` 2.8,
`cookie-parser` 1.4, `cookie-signature` 1.2 (BE-005a)
**Dev:** none - `node --watch` replaces nodemon, `node --test` replaces a test runner.

Six runtime dependencies in total. No JWT library, no session store, no test framework,
**no password-hashing package and no authentication framework**.

`cookie-signature` was already present as a transitive dependency of cookie-parser and
express; BE-005a promoted it to a direct dependency because `adminSession.js` imports it
by name. It is the same library cookie-parser itself uses to sign cookies.

**Argon2id password hashing needs no package**: Node 24 provides `crypto.argon2` in core.
See Section 11a for why that was preferred over the `argon2` or `bcrypt` native modules
on an offline Windows target.

---

## 9. Files Created / Modified

### FE-001 -> FE-004

**Created:** everything under `frontend/` listed in Section 4, plus
`.claude/launch.json` and this file.
**Modified from the Vite template:** `vite.config.js`, `index.html`, `src/main.jsx`,
`README.md`. Template files `src/App.css`, `src/index.css`, `src/assets/react.svg`
and `public/vite.svg` were removed.

### BE-005a - Admin authentication foundation

**Created (backend)**
- `src/models/AdminUser.js` - separate collection; `username`, `usernameNormalised`
  (unique), `passwordHash` (`select: false`), timestamps
- `src/utils/password.js` - Argon2id hashing over Node core `crypto.argon2`
- `src/middleware/adminSession.js` - `startAdminSession`, `endAdminSession`,
  `readAdminSession`, `requireAdmin`
- `src/middleware/adminThrottle.js` - in-memory failed-login lockout
- `src/services/adminService.js` - `createAdminUser`, `authenticateAdmin`,
  `countAdmins`, `validateCredentialShape`
- `src/controllers/adminController.js` - login, logout, me
- `src/routes/adminRoutes.js` - the `/api/admin` namespace
- `scripts/createAdmin.js` - operator provisioning CLI
- `scripts/prompt.js` - terminal prompts, extracted so hidden entry is testable
- `scripts/validateAdminApi.js` - DEV ONLY end-to-end admin security check
- `tests/password.test.js`, `tests/adminThrottle.test.js`, `tests/prompt.test.js`

**Modified (backend)**
- `src/config/env.js` - `adminSessionSecret` (required, no fallback; must differ from
  `SESSION_SECRET`), `adminSessionMaxAgeMs`, three throttle settings
- `src/routes/index.js` - mounted `/api/admin`
- `package.json` - `admin:create` script; `cookie-signature` promoted to a direct
  dependency (it was already in the tree via cookie-parser)
- `.env.example` - documents the new variable **names** only, no values
- `.env` - a locally generated `ADMIN_SESSION_SECRET` (gitignored)

**Created (frontend)**
- `src/services/adminApi.js`, `src/routes/RequireAdmin.jsx`,
  `src/pages/AdminLoginPage.jsx`, `src/pages/AdminPage.jsx`

**Modified (frontend)**
- `src/constants/routes.js` - added `ADMIN_LOGIN`
- `src/routes/AppRoutes.jsx` - admin branch behind `RequireAdmin`

**Not touched:** `Candidate.js`, `session.js`, `candidateService.js`,
`candidateController.js`, `candidateRoutes.js`, `scoringService.js`, the scenario
data and the channel renderers.

---

### FE-013 / BE-004

**Created**
- `frontend/src/pages/HistoryPage.jsx`
- `backend/tests/assessmentSummary.test.js` - 5 tests for the shared summary

**Modified**
- `backend/src/services/assessmentService.js` - extracted `summaryOf()`, added
  `listCompletedAssessments()`
- `backend/src/controllers/assessmentController.js` - `getAssessmentHistory`
- `backend/src/routes/assessmentRoutes.js` - `GET /` behind the existing session guard
- `backend/scripts/validateApi.js` - 11 new checks for history, isolation and safety
- `frontend/src/services/assessmentApi.js` - `history()`
- `frontend/src/routes/AppRoutes.jsx` - `/history` inside `RequireCandidate`
- `frontend/src/pages/DashboardPage.jsx` - "View your past assessments" link

### FE-017

**Created**
- `backend/data/scenarios.whatsapp.json` - 10 authored scenarios (7 malicious,
  3 legitimate) replacing the generated padding

**Modified**
- `backend/scripts/generateDevPool.js` - `whatsapp` added to `AUTHORED_CHANNELS`

**No frontend files were changed.** The WhatsApp renderer needed no modification.

### FE-011

**Created**
- `frontend/src/components/assessment/channels/EmailRenderer.jsx`
- `backend/data/scenarios.email.json` - 10 authored scenarios (7 malicious,
  3 legitimate): password-expiry credential lure, invoice bank-detail change, prize
  claim, loan sanction with advance fee, recruitment offer with deposit, scanned-document
  attachment lure and senior-officer impersonation (gift vouchers); plus a genuine
  internal bulletin, a genuine order receipt with invoice attachment and a genuine
  meeting invitation

**Modified**
- `frontend/src/components/assessment/PhoneSimulator.jsx` - `email` added to `RENDERERS`
- `backend/scripts/generateDevPool.js` - `email` added to `AUTHORED_CHANNELS`

**No schema, interaction or design-token additions were required.**

### FE-010

**Created**
- `frontend/src/components/assessment/channels/SmsRenderer.jsx`
- `backend/data/scenarios.sms.json` - 10 authored scenarios (7 malicious, 3 legitimate):
  instant loan, lottery/prize, KYC freeze, e-challan, parcel handling fee, fake job
  offer and a callback "fraud helpline" alert; plus a genuine bank debit alert, a
  genuine appointment reminder and a genuine electricity bill notice

**Modified**
- `frontend/src/components/assessment/PhoneSimulator.jsx` - `sms` added to `RENDERERS`
- `backend/src/constants/assessment.js` - `call-number` added to `INTERACTION_TYPES`
- `backend/scripts/generateDevPool.js` - `sms` added to `AUTHORED_CHANNELS`

**No new design tokens.** SMS reuses `channel-sms` and the existing neutral surfaces.

### FE-009

**Created**
- `frontend/src/components/assessment/channels/InstagramRenderer.jsx`
- `backend/data/scenarios.instagram.json` - 10 authored scenarios (7 malicious,
  3 legitimate) covering honey trap, cloned friend account, fake support / copyright,
  lottery / giveaway, fake brand collaboration, investment / quick money, support
  impersonation, plus genuine order, login-activity and friend messages

**Modified**
- `frontend/src/components/assessment/PhoneSimulator.jsx` - `instagram` added to
  `RENDERERS`
- `frontend/src/styles/index.css` - six Instagram surface tokens
- `backend/src/constants/assessment.js` - `profileHeader` added to `BLOCK_TYPES`
- `backend/src/models/Scenario.js` - identity fields for `profileHeader`, plus
  `comments` on posts
- `backend/scripts/generateDevPool.js` - skips `AUTHORED_CHANNELS`

### FE-008

**Created**
- `frontend/src/components/assessment/channels/WhatsAppRenderer.jsx`
- `frontend/src/components/assessment/channels/GenericRenderer.jsx` (extracted from
  the old PhoneSimulator, now the fallback for channels without a renderer)

**Modified**
- `frontend/src/components/assessment/PhoneSimulator.jsx` - reduced to navigation,
  interaction recording and renderer dispatch
- `frontend/src/components/assessment/ScenarioContainer.jsx` - fixed frame height so
  the chat scrolls and the composer stays at the bottom
- `frontend/src/pages/AssessmentPage.jsx` - passes `channel`; `min-w-0` on the grid
  children (see the overflow fix below)
- `frontend/src/styles/index.css` - six WhatsApp surface tokens
- `backend/data/scenarios.sample.json` - added a `linkPreview` and a follow-up message
  to the WhatsApp fraud template, so the link-preview path could be exercised. Still
  fictional, still schema-compatible; the dev pool was regenerated and re-imported.

### FE-015a

**Created**
- `frontend/src/services/authApi.js`, `frontend/src/services/assessmentApi.js`
- `frontend/src/context/candidateContext.js`, `frontend/src/context/CandidateProvider.jsx`
- `frontend/src/hooks/useCandidate.js`
- `frontend/src/routes/RequireCandidate.jsx`
- `frontend/src/components/assessment/PhoneSimulator.jsx`
- `frontend/.env` (gitignored) and an updated `.env.example`
- `backend/` - `GET /api/assessments/active` (service, controller, route)

**Modified**
- `frontend/src/services/apiClient.js` - `ApiError` with status/code/details, network
  failures turned into a readable message, cookies sent on every call
- `frontend/src/App.jsx`, `src/routes/AppRoutes.jsx` - provider and guarded routes
- `frontend/src/pages/LoginPage.jsx` - calls the API, shows server errors, skips the
  form when already signed in
- `frontend/src/pages/BriefingPage.jsx`, `DashboardPage.jsx` - real session and
  real assessment state
- `frontend/src/pages/AssessmentPage.jsx` - rewritten against the API: resume, submit,
  feedback, complete, loading/error/completed states
- `frontend/src/constants/assessment.js` - `JUDGEMENT_LABELS` +
  `judgementOptionsFrom()`; the option list now comes from the server
- `frontend/src/components/assessment/DecisionPanel.jsx` - options passed in as props

**Deleted**
- `frontend/src/mocks/assessment.js` and the `src/mocks/` folder
- `frontend/src/services/candidateStorage.js`
- `frontend/src/components/assessment/AssessmentNavigation.jsx` (Previous removed)

### BE-002

**Created**
- `src/services/sequenceGenerationService.js` - pure selection: composition choice,
  2-per-channel floor, unseen preference, relaxation order, exhaustion, mixed ordering
- `src/services/scoringService.js` - pure `scoreAnswer()`, per-scenario only
- `src/services/assessmentService.js` - create/resume, serve question, submit, complete
- `src/controllers/assessmentController.js`
- `src/middleware/session.js` - signed httpOnly cookie, `requireCandidate`
- `tests/sequenceGeneration.test.js` (16 tests), `tests/scoring.test.js` (6 tests)
- `scripts/generateDevPool.js`, `scripts/validateApi.js` - both DEV ONLY

**Modified**
- `src/routes/assessmentRoutes.js` - the 501 stub replaced with four real routes
- `src/routes/candidateRoutes.js`, `src/controllers/candidateController.js` - session
  start on sign-in, plus `GET /me` and `POST /logout`
- `src/config/env.js`, `.env.example` - `SESSION_SECRET`, `SESSION_MAX_AGE_MS`
- `src/app.js` - `cookie-parser` with the signing secret
- `package.json` - `test` and `dev:pool` scripts
- `docs/QUESTION_ENGINE_DESIGN.md` - section 17 changelog

**No frontend files were changed in BE-002.**

### BE-001

**Created** - the whole `backend/` tree listed in Section 4, notably:
- `src/constants/assessment.js` - channels, compositions, judgements, marks bounds,
  EVI categories, performance bands, simulation vocabulary
- `src/models/Scenario.js` - screen-graph simulation, answer options, `select: false`
  evaluation, `toCandidateJSON()`
- `src/models/Candidate.js` - identity, identifier normalisation, `seenScenarios`
- `src/models/Assessment.js` - frozen sequence, composition, per-question answers and
  timing, `result` left loose pending the scoring decision
- `src/services/scenarioImportService.js` - all-or-nothing validation and upsert
- `src/services/candidateService.js` - find-or-create, `recordScenarioSeen`
- `src/routes/`, `src/controllers/`, `src/middleware/`, `src/config/`, `app.js`,
  `server.js`
- `scripts/importScenarios.js`, `data/scenarios.sample.json`, `.env.example`

**Modified**
- `frontend/src/constants/assessment.js` - `JUDGEMENT_OPTIONS` from two values to the
  confirmed three
- `frontend/src/components/assessment/DecisionPanel.jsx` - judgement group now three
  across; `OptionGroup` gained a 3-column layout
- `docs/QUESTION_ENGINE_DESIGN.md` - sections 6.2, 11.1, 14 amended; changelog added

### BE-000

**Created**
- `docs/QUESTION_ENGINE_DESIGN.md` - the backend design: scenario / assessment /
  candidate schemas, the simulation model, sequence generation, exhaustion rules, API
  contracts with request and response examples, security boundaries, timing, the
  scoring conflict and proposed model, EVI handling, extensibility, and the open
  decisions list

**Modified**
- `PROJECT_MASTER_PLAN.md` only. **No application code was written or changed** - BE-000
  is a design task.

### FE-007

**Created**
- `src/components/assessment/AssessmentHeader.jsx` - sticky heading bar, "Question X
  of 10" and the progress bar
- `src/components/assessment/ChannelIndicator.jsx` - which app the current scenario
  came from
- `src/components/assessment/ScenarioContainer.jsx` - phone frame, renders children
- `src/components/assessment/DecisionPanel.jsx` - judgement / action / reason radio
  groups
- `src/components/assessment/AssessmentNavigation.jsx` - Previous and Submit controls
- `src/mocks/assessment.js` - TEMPORARY visual data, delete at FE-015

**Modified**
- `src/pages/AssessmentPage.jsx` - placeholder replaced with the real shell, including
  the LOADING / ACTIVE / SUBMITTING / ERROR / COMPLETED branches
- `src/constants/assessment.js` - added `ASSESSMENT_UI_STATE` and `JUDGEMENT_OPTIONS`
- `src/components/layout/AppLayout.jsx` - added the optional `subHeader` slot

### FE-006

**Created**
- `src/pages/DashboardPage.jsx` - the real dashboard (replaced the placeholder)
- `src/pages/AssessmentPage.jsx` - labelled placeholder (FE-007 replaces it)
- `src/components/ui/ProgressBar.jsx` - accessible progress bar
- `src/components/common/StatusBadge.jsx` - NOT_STARTED / IN_PROGRESS / COMPLETED pill
- `src/constants/assessment.js` - `ASSESSMENT_STATUS`

**Modified**
- `src/constants/app.js` - replaced `TOTAL_SCENARIOS` with `SCENARIO_POOL_SIZE` and
  `ASSESSMENT_SCENARIO_COUNT`
- `src/constants/channels.js` - added a plain-English `description` per channel
- `src/constants/routes.js` - `ASSESSMENT` is now `/assessment`, not `/assessment/:channel`
- `src/routes/AppRoutes.jsx` - registered `/assessment`
- `src/pages/BriefingPage.jsx` - copy corrected to the 10-scenario mixed assessment
- `src/layouts/AuthLayout.jsx` - same copy correction on the login screen

### FE-005

**Created**
- `src/components/layout/AppHeader.jsx` - sticky brand bar + simulation badge,
  optional `actions` slot for later screens
- `src/components/layout/AppLayout.jsx` - header + content container + footer shell
- `src/components/common/StepCard.jsx` - numbered step card
- `src/pages/DashboardPage.jsx` - labelled placeholder (FE-006 replaces it)

**Modified**
- `src/pages/BriefingPage.jsx` - placeholder replaced with the real screen
- `src/constants/channels.js` - added lucide icon and accent class per channel
- `src/styles/index.css` - added the four channel accent tokens
- `src/routes/AppRoutes.jsx` - added the `/dashboard` route

---

## 10. Current Project Status

The candidate journey is feature-complete except for the result: login, briefing,
dashboard, a frozen mixed 10-question assessment across four fully authored channels with
per-question feedback, completion, and now a history of past attempts.

What remains is everything downstream of scoring - which is blocked on a product decision
- plus the admin statistics panel.

### Verified on 2 September 2026 (FE-013 / BE-004)

**Automated.** Frontend `npm run lint` clean, `npm run build` passes. Backend
`npm test` **27/27** (5 new summary tests), `node scripts/validateApi.js` **54/54**
(11 new history checks). Scenario pool unchanged at 40.

**Backend, checked against the running API:**

- `GET /api/assessments` returns a list; the completed assessment appears with its
  status, completion date and question counts
- **Unauthenticated requests are rejected with 401**
- **Candidate isolation:** candidate B's history is empty and contains nothing of
  candidate A's
- **Protected data absent:** the response contains no `evaluation`, `correctJudgement`,
  `warningSigns`, `authorNotes`, `simulation`, `actionKey`, `sequence` or `composition`
- **No invented result:** no `overallScore`, no `band`; every row reports
  `scoringPending: true`
- An in-progress assessment does **not** appear in history, and the list is unchanged
  after a new assessment is started - history creates and mutates nothing

**Unit tests** cover the shared summary: counts and totals, `scoringPending` always
present with no score/band/EVI keys, unanswered questions excluded rather than counted as
zero, malformed answers with missing marks or duration, and an empty assessment
summarising to zeroes rather than NaN.

**Frontend, in the browser:**

- `/history` reachable from the dashboard link, behind the existing session guard
- Empty state renders for a candidate with no completed attempts
- Populated state renders date, "10 of 10 questions answered", duration, the Completed
  badge, and an honest "Your score for this attempt is not available yet" line
- Two completed attempts render two cards; **newest-first ordering confirmed** against
  the API response
- A cold load of `/history` while signed out redirects to `/login`
- `localStorage` and `sessionStorage` remain empty; `document.cookie` unreadable

**Responsive.** No horizontal overflow at 320, 375, 768, 1024, 1280 or 1920 px.

**Regression.** Login -> Briefing -> Dashboard -> Assessment -> mid-assessment reload
(resumed at Question 5 on the same frozen sequence) -> completion -> History. All four
renderers dispatched correctly in the same run. **Zero non-localhost network requests**
and zero JavaScript errors.

**Routes live today.** Frontend: `/login`, `/briefing`, `/dashboard`, `/assessment`,
`/history` (all but login behind the candidate session guard), plus `/admin/login` and
`/admin` behind the separate admin guard. Backend: `GET /api/health`;
`POST /api/candidates`, `GET /api/candidates/me`, `POST /api/candidates/logout`;
`GET /api/scenarios/summary`; `POST /api/assessments`, `GET /api/assessments`,
`GET /api/assessments/active`, `GET /api/assessments/:id`,
`POST /api/assessments/:id/answers`, `POST /api/assessments/:id/complete`;
`POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/me` (BE-005a).

**Section 10 above describes the state before BE-005a.** The candidate journey is
unchanged by it; what is new is a second, independent authentication surface. The two
sessions coexist without either replacing the other, and each logout clears only its own
cookie - verified in Section 11a.

---

## 11. Next Task — ⚠ SUPERSEDED 4 September 2026

> **THIS SECTION IS NO LONGER THE CURRENT NEXT TASK.** The client specification that
> arrived on 4 September 2026 pauses FE-014 / BE-005b: the statistics panel would
> aggregate a scoring model and an `Assessment` schema that are both being replaced.
> **The current next task is `ADMIN-002` — see 15.21.**
>
> The analysis below is retained as history because its findings about what is and is not
> derivable from the current schema remain factually accurate.

**FE-014 / BE-005b - Admin statistics panel.** The authentication foundation it needed is
now in place (BE-005a, Section 11a). What remains is the statistics themselves.

**Buildable now, from data already stored:** total candidates; total / completed /
in-progress assessment counts; the recent-assessment list with drill-down into one
attempt; average decision time; most-failed scenarios (answer judgement vs
`evaluation.correctJudgement`); fraud-theme performance (`evaluation.fraudTheme`, present
on all 28 malicious scenarios); per-channel correctness and critical-failure rates;
composition distribution and `relaxations` frequency as pool-health signals.

**Still blocked by the scoring decision** (Section 12, item 15): score distribution, band
distribution, channel-wise *scores*, and EVI trigger distribution. Build the panel so
these slot in later rather than stubbing them with zeros - the `scoringPending: true`
precedent in `listCompletedAssessments` is the pattern to follow.

**Blocked by something other than scoring, and not previously recorded:**

- *Most commonly missed warning signs* (proposal section 7) is **not derivable from the
  current schema**. `reasonOptions` carry `{key, label, marks}` and
  `evaluation.warningSigns` is a free-text array; nothing links a chosen reason to a
  warning sign. See Section 12, item 40.
- *Impulsive-decision rate* (proposal section 7) has no defined threshold in any source.
  See Section 12, item 41.

---

## 11a. BE-005a - Admin Authentication Foundation (completed 4 September 2026)

**This is the development-phase minimum**, built to unblock the statistics panel. It is
deliberately narrow: authentication only - no RBAC, no admin management, no MFA/SSO, no
password reset. Admin *product* behaviour is reviewed later; see the open list at the end
of this section.

### What the proposal actually asks for

The final proposal names admin login twice, both times only as a task title: "user and
admin login with sessions" (Week 1) and "User login, admin login, session handling"
(Day 3). It defines **no** admin credentials, **no** role, **no** provisioning and **no**
authentication mechanism, and the word "role" does not appear in it at all. Everything
below is an engineering minimum chosen to satisfy that requirement safely - not a product
decision recovered from the document.

### AdminUser

A **separate collection**, not a flag on Candidate. `findOrCreateCandidate` upserts on an
unrecognised identifier, so any admin marker living on Candidate would be one typo away
from self-provisioning an administrator. Separate collections make that structurally
impossible rather than something a guard has to remember.

| Field | Notes |
|---|---|
| `username` | trimmed, max 32 |
| `usernameNormalised` | lowercased, **unique** - the identity key |
| `passwordHash` | Argon2id PHC string, `select: false` |
| `createdAt` / `updatedAt` | mongoose timestamps |

`toPublicJSON()` returns `{ id, username }` and nothing else. Two layers keep the hash in:
`select: false` keeps it out of ordinary queries, and `toPublicJSON()` strips it
regardless - the same pattern already used for `Scenario.evaluation`.

Note the spelling: `usernameNormalised` matches the existing `identifierNormalised` on
Candidate. The task brief wrote `usernameNormalized`; British spelling was kept so one
database does not carry both.

**Candidate was not modified.** No `isAdmin`, no `role`, no `password`.

### Password hashing

**Argon2id** - the preferred algorithm - via Node 24 core `crypto.argon2`:
m=65536 KiB, t=3, p=1, 16-byte random salt, 32-byte tag, about 145 ms per hash.
Parameters exceed the OWASP minimum and are stored inside every hash, so raising them
later does not invalidate existing ones.

`src/utils/password.js` implements no cryptography of its own. It generates the salt,
encodes the standard PHC string, and compares with `crypto.timingSafeEqual`.

**Why core rather than an npm package.** The product installs on a standalone offline
Windows machine and is later packaged with Electron. `argon2` and `bcrypt` are native
modules: node-gyp / prebuilt-binary availability and Electron ABI matching are real
installation risks, and neither can be installed on a machine with no network. Node core
carries none of that and gives the preferred algorithm. If the client would rather depend
on the `argon2` npm package, the swap is contained entirely within `password.js`.

### Admin session

A cookie named **`admin_session`**, separate from `candidate_session` in three ways: a
different name, a **different signing secret** (`ADMIN_SESSION_SECRET`), and a different
collection to resolve against. Flags: `httpOnly`, `SameSite=Lax`, `secure` in production,
`path=/`, default lifetime **1 hour** - shorter than the candidate 8 hours.

It is signed with `cookie-signature` rather than cookie-parser `signed: true`.
cookie-parser is initialised once with the candidate secret and skips re-parsing when
`req.cookies` is already set, so a second parser with the admin secret cannot be mounted;
signing directly is what makes the secret separation real rather than nominal. The server
refuses to start if `ADMIN_SESSION_SECRET` is missing **or equal to** `SESSION_SECRET`.

### requireAdmin

Reads `admin_session`, verifies the signature against the admin secret, resolves the
AdminUser, attaches it as `req.admin`, and rejects everything else with
`401 NO_ADMIN_SESSION`. **There is no fallback to `requireCandidate`** - a candidate
session reaching an admin route is rejected, never downgraded or upgraded. Nothing in the
body, query or headers is consulted, and no role is ever read from the client.

### Endpoints

| Route | Guard | Returns |
|---|---|---|
| `POST /api/admin/login` | login throttle | `{ admin: { id, username } }` |
| `POST /api/admin/logout` | none | `{ ok: true }`, clears only `admin_session` |
| `GET /api/admin/me` | `requireAdmin` | `{ admin: { id, username } }` |

A wrong password and an unknown username return the **same** 401 code and the same
message, so the endpoint cannot be used to enumerate usernames; an unknown username is
still verified against a decoy hash, so the two also take the same time.

Statistics endpoints are **not** implemented here. They mount behind `requireAdmin` in
BE-005b, and the namespace stays read-only per Assumption 4 of the proposal.

### Provisioning

`npm run admin:create`, and nothing else. Interactive: username visible, password and
confirmation hidden, minimum-length validation, Argon2id hash, then create. It refuses to
run without a TTY, and refuses to overwrite an existing administrator.

There is **no default account, no seeded password, no hard-coded credential, no HTTP
route that creates an admin, and no startup hook**. `.env.example` documents variable
names only, with no values. **Single-admin** for this phase.

### Throttling

In-memory, keyed on client address plus username: 5 failed attempts inside a 15-minute
window lock that key out for 15 minutes; a success clears it. No new dependency.
Process-local by choice - one server on one offline machine, so a shared store would add
operational surface for no security gain. **Candidate login is untouched**: it has no
password, so there is nothing to brute-force.

### Frontend

`/admin/login` (`AdminLoginPage`) and a `RequireAdmin`-guarded `/admin` boundary showing
the signed-in username and a sign-out button. **No statistics, charts or tables** - that
is FE-014. No admin state in `localStorage` or `sessionStorage`; the httpOnly cookie
remains the only authentication.

### Verified on 4 September 2026

- Backend unit tests **47/47** (`npm test`) - 27 pre-existing plus 20 new covering
  Argon2id hashing, throttle behaviour and hidden password entry.
- `node scripts/validateAdminApi.js` **41/41** against the running server, covering
  creation, duplicate refusal, hashing, correct and incorrect credentials, unknown
  username, tampered and cross-signed cookies, candidate/admin isolation both ways,
  logout independence in both directions, and throttling.
- `node scripts/validateApi.js` **54/54** - the candidate API is unchanged.
- Frontend `npm run lint` clean, `npm run build` passes.
- Browser: `/admin` redirects to `/admin/login` when signed out; wrong password shows one
  generic error; correct credentials reach `/admin`; the full candidate journey
  (login, briefing, dashboard, assessment, answer scored 8/10 with feedback, mid-test
  reload resuming at question 2 on the same frozen sequence, history) all still work with
  an admin session live at the same time; admin sign-out left the candidate session
  intact. `localStorage`, `sessionStorage` and `document.cookie` all empty throughout,
  and every network request was localhost.

### Still open after BE-005a - product decisions, not technical gaps

None of these was answered by the proposal, and none has been invented here:

1. Admin provisioning and handover - who creates the account, when, and how it reaches
   the client.
2. How many administrators the product should support (this phase is single-admin).
3. Whether the panel may display candidate names and service numbers in full.
4. Whether CSV export is in scope - the proposal contradicts itself: sections 3 and 7
   omit it, Week 3 and Day 17 include it.
5. The impulsive-decision threshold (Section 12, item 41).
6. How a missed warning sign is recorded (Section 12, item 40).
7. The final scoring formula, the performance bands and the EVI rules (Section 12,
   item 15). **Still open. Nothing has been inferred or restored.**

Development-phase defaults that are **not** product decisions and can be changed freely:
username 3-32 characters, password minimum 12 characters, 1-hour admin session,
5 attempts per 15-minute lockout.

---

## 12. Known Issues / Open Points

1. **Login field definition is still an open client question** (proposal Section 14,
   due Day 2): is it a phone number, a service number, or either? Validation is
   permissive until this is confirmed.
2. **No backend.** Login does not authenticate; the candidate is not persisted.
3. ~~Channel renderers~~ - all four are built. `GenericRenderer` remains only as a
   fallback for a scenario whose channel has no renderer.
4. **Scenario content is client-supplied** and not yet received. This is the project's
   biggest delivery risk - the Mongo schema cannot be finalised without a sample.
5. **No automated tests yet.** Verification is manual plus build and lint.
6. **No route guard.** `/briefing`, `/dashboard` and `/assessment` can be opened
   directly without logging in; the screen then just says "Welcome" with no name. A
   guard belongs with the real session in FE-015 / backend, so it was not added.
7. **Instagram has no brand icon** in lucide-react v1, so `Camera` is used. Revisit if
   the client wants exact app logos - that would mean bundling local SVG assets.
8. **The briefing is long on a 320 px screen** (~2450 px of scroll). Content was
   compacted (2-up channel cards, tighter padding); shortening it further would mean
   cutting briefing content, which the proposal requires.
9. **The 10-scenario mixed assessment contradicts the proposal**, which describes 10
   scenarios per channel taken channel by channel, and contradicts the client-facing
   `Project_Proposal.docx` already sent. The user decided this in the FE-006 brief. It
   needs to be raised with the client and the proposal regenerated before the backend
   phase, otherwise the delivered product will not match the signed document.
10. **`SCENARIO_POOL_SIZE` is exported but not yet used** by any screen - it documents
    the 40-scenario pool for the admin statistics work (FE-014).
11. **The assessment shell does not keep answers when moving between questions.** It
    has nowhere to store them until the engine exists. Not a design choice - fix it
    when the API lands.
12. **Elapsed time is missing from the assessment heading bar**, which the proposal
    requires. The server now has `startedAt` and per-question `servedAt`, so it can be
    supplied whenever the client wants it shown.
13. ~~`src/mocks/` must be deleted~~ - DONE in FE-015a, along with
    `services/candidateStorage.js` and `components/assessment/AssessmentNavigation.jsx`.
18. **The scenario pool holds 8 development samples, not the real 40.**
    `backend/data/scenarios.sample.json` exists so the schema and import could be
    exercised; every entry is marked `DEVELOPMENT SAMPLE` in `authorNotes`. The client's
    content pack replaces it. This remains the project's biggest delivery risk.
19. ~~No session layer~~ - DONE in BE-002: signed httpOnly cookie, `requireCandidate`
    on every assessment route.
20. ~~No backend tests~~ - DONE in BE-002: 22 unit tests via `npm test`, plus an
    end-to-end API script. Coverage is the two pure services and the HTTP contract; the
    models and the import service are still only covered by the BE-001 script.
21. ~~Frontend and backend are not connected~~ - DONE in FE-015a. All mocks deleted.
22. **`GET /:id/result` is still not built** - it waits on the scoring decision.
    `GET /active` and `GET /api/assessments` now exist.
23. **Judgement partial credit is undefined.** The proposal gives judgement a 0-3 range
    but never says what earns 1 or 2, so `scoreAnswer()` awards 3 for the correct
    classification and 0 otherwise. Awarding partial marks would be inventing a rule -
    it needs the client, especially for "needs verification" on a fraudulent message.
24. **"Prefer unseen" is best-effort.** The composition rule and the channel floor both
    outrank it, so an awkward remainder can produce one repeat while an unseen scenario
    exists. Deliberate and tested, but worth stating if anyone audits a sequence.
25. **The dev pool is padding.** `backend/data/scenarios.dev-pool.json` holds 40
    generated scenarios so the engine could be exercised; the content repeats and is not
    training material. The client's pack replaces it and remains the #1 delivery risk.
25b. **The frontend runs on port 5173, not 3000.** The final proposal's technology
    table says React on `localhost:3000`; Vite's default is 5173. Cosmetic, but the
    delivery documentation should say one or the other.
26. **No rate limiting or brute-force protection** on `POST /api/candidates`. Acceptable
    for a standalone offline machine; revisit if the deployment assumption changes.
    Candidate sign-in has no password, so there is nothing to brute-force. **Admin login
    is different and is throttled** as of BE-005a - see Section 11a.
27. **There is no way to change a submitted answer, and no Previous button.** BE-002 has
    no endpoint for it, so the button was removed rather than faked. If the client wants
    review-only back navigation, it needs a backend endpoint first.
28. **No visible logout control.** `POST /api/candidates/logout` exists and is wired into
    the session context, but no screen offers it yet. `AppHeader` has an `actions` slot
    ready for it.
29. ~~No assessment history screen~~ - DONE in FE-013 / BE-004.
38. **History shows no score, and cannot until the scoring decision is made.** Each row
    reports dates, question counts, duration and critical-failure count, with an explicit
    "score not available yet" line. The proposal's "comparison against the previous
    attempt" is therefore only partly delivered - the structure is there, the comparable
    figure is not.
39. **History has no pagination.** The design does not specify any and a candidate has
    few attempts. Revisit only if that assumption changes.
30. **The completion screen is a stopping point, not a result.** It deliberately shows no
    score, band or EVI. FE-012 replaces it once item 15 is settled.
31. **WhatsApp scenario data does not exercise every block the renderer supports.**
    `image` and `attachment` bubbles are implemented against the schema but no WhatsApp
    dev scenario uses them, so they are unverified against real data.
32. ~~WhatsApp pool content is generated padding~~ - DONE in FE-017. **All four channels
    now carry authored content**; a check for the generator's placeholder text returns 0
    documents.
34. ~~WhatsApp `image` and `attachment` bubbles unverified~~ - DONE in FE-017; both are
    now used by real scenarios and were confirmed on screen.
36. **All scenario content is internally authored, not client-supplied.** The final
    proposal permits this while client content is delayed. When the client pack arrives it
    replaces these files through `npm run import:scenarios` with no code change.
37. **`scripts/generateDevPool.js` now produces nothing** and can be retired once the
    authored pool has been validated in real use.
35. **Immediate-vs-end feedback is still an open product decision.** Feedback is shown
    immediately after each answer, following the proposal's assessment-screen section.
    Whether it should instead be withheld until the end has not been confirmed.
33. **Client scenario content is no longer treated as a blocker.** The final proposal
    (section 15) states that if content is delayed, sample scenarios are prepared
    internally in the agreed fraud categories and replaced when the client pack is
    received. Replacement goes through `npm run import:scenarios` and needs no frontend
    change.

40. **"Most commonly missed warning signs" is not derivable from the current schema.**
    The proposal (section 7) asks for it, but `reasonOptions` carry only
    `{key, label, marks}` and `evaluation.warningSigns` is a free-text array with no link
    back to a reason option. Delivering this metric needs either a mapping added to the
    scenario schema - which means re-tagging all 40 authored scenarios - or the metric
    redefined. **A product and content decision, not a scoring one**, so it is not
    blocked by item 15. Found during the BE-005a specification review; not previously
    recorded anywhere.
41. **"Impulsive-decision rate" has no defined threshold.** The proposal (section 7, and
    the result section) asks for it. `durationMs` is stored per answer, but no source
    document says how many seconds makes a decision impulsive. Picking a number would be
    inventing a rule. **Not blocked by item 15** - it needs one figure from the client.
42. **The admin authentication defaults are development-phase choices, not product
    decisions.** Username 3-32 characters, password minimum 12 characters, 1-hour admin
    session, 5 failed attempts per 15-minute lockout, single administrator. All are
    freely changeable; none is stated anywhere in the proposal. Recorded so they are not
    later mistaken for client requirements. See Section 11a.
43. **The admin account does not exist yet on any machine.** BE-005a ships the mechanism,
    not an account. Someone must run `npm run admin:create` once per installation and
    choose the credential. There is deliberately no default account and no password
    reset, so a lost admin password means creating a new account against the database.
    Who does this, and when, is open decision 1 in Section 11a.

### Open - needs client confirmation

Full list and reasoning in `docs/QUESTION_ENGINE_DESIGN.md` section 14.

14. ~~**Judgement scale**~~ - RESOLVED 2 Sep 2026: three-way, implemented on both sides.
15. **Scoring model — ⚠ SUPERSEDED 4 September 2026, not answered.** The new client
    specification (§5) defines scoring explicitly, but as a **per-event** model, not the
    per-answer judgement/action/reason model debated below. See **15.10**. Nothing here
    was implemented, so there is no rework cost. The text below is retained as history.

    **Original entry — Scoring model for a mixed 10-question assessment. STILL OPEN, and
    the position changed on 2 September 2026.** The final proposal (Version 1.0)
    **removed** the
    detailed scoring section that the earlier draft carried. It no longer specifies
    judgement 0-3, action -5..+5, reason 0-2, per-scenario -5..+10, "channel score
    0-100", "overall = average of the four channel scores", or the 85/70/50 performance
    bands. It now asks only for "overall score, performance band, channel-wise score,
    EVI profile" with no formula, and the seven EVI trigger categories are likewise no
    longer listed.

    Consequences to settle before BE-003:
    - The per-scenario model **already implemented** in
      `backend/src/constants/assessment.js` (judgement 0-3, action -5..+5, reason 0-2,
      bands 85/70/50, seven EVI categories) now comes from the **superseded draft**, not
      the approved proposal. It was not invented, but it needs re-confirming.
    - The channel-average conflict is partly moot, because the formula that caused it is
      no longer in the proposal. The requirement for a "channel-wise score" remains,
      with 0-4 scenarios per channel in a mixed test.
    - Recommendation unchanged: overall = the sum of the 10 scenario scores floored at 0
      (already a 0-100 scale, so 85/70/50 still works), with channel figures reported as
      an indicative breakdown that is not part of the overall. Judgement partial credit
      (issue 23) needs deciding at the same time.

    **Nothing has been implemented against this.** `Assessment.result` is still null
    after completion and the completion endpoint returns per-question facts with
    `scoringPending: true`. The proposal's "channel score
    0-100 = the 10 scenarios in that channel" and "overall = average of the four channel
    scores" both assume 10 scenarios per channel. Under the mixed test a channel carries
    0-4 scenarios, so a channel score out of 100 is undefined and averaging would give
    one WhatsApp scenario the same weight as four Emails. Recommendation: overall = sum
    of the 10 scenario scores, floored at 0 - which is already a 0-100 scale and keeps
    the client's 85/70/50 bands unchanged - with channel figures reported as an
    indicative breakdown that is not part of the overall.
16. ~~**Legitimacy mix**~~ - RESOLVED 2 Sep 2026: one of 6+4, 7+3 or 8+2 per assessment,
    chosen by the engine, enforced by the Assessment model. Never 10+0 or 0+10.

Item 15 is the only one that blocks anything, and only the *result aggregation* - the
per-scenario scoring from the proposal is unchanged and already encoded in
`backend/src/constants/assessment.js`. `Assessment.result` is deliberately a loose Mixed
field until this is settled.

Other open decisions (defaults recommended in the design): repetition after exhaustion,
resuming completed assessments, whether Previous becomes review-only after answering,
whether in-frame interactions affect marks, and the per-question feedback UX.

17. **`Project_Proposal.docx` is now out of date** in two ways - it describes 10
    scenarios per channel taken channel by channel, and the channel-average scoring.
    Regenerate it via `build_proposal.py` once items 14-16 are settled.

---

## 13. Roadmap — ⚠ SUPERSEDED 4 September 2026

> **REPLACED BY THE ROADMAP IN 15.18.** This roadmap was built against the previous
> assumptions (40 scenarios, per-answer scoring, statistics-only admin). It is retained
> as history. Items 1-4 and 8's first half record genuinely completed work; items 5-10
> are superseded as *planned* work.

1. ~~FE-005 Briefing~~, ~~FE-006 Dashboard~~, ~~FE-007 Assessment shell~~ (done)
2. ~~BE-000 design~~, ~~BE-001 foundation~~, ~~BE-002 question engine~~ (done)
3. ~~FE-015a Connect the frontend to the assessment API~~ (done)
4. ~~FE-008 to FE-011 renderers~~, ~~FE-017 WhatsApp content~~, ~~FE-013 / BE-004
   history~~ (done). **FE-014 / BE-005 Admin statistics** - partly buildable now
5. BE-003 Scoring aggregation + `GET /:id/result`. **Blocked** on the client decision in
   Section 12, item 15
6. FE-012 Result screen: overall score, band, per-channel breakdown, EVI profile with
   its non-clinical disclaimer, plain-language feedback
7. BE-004 / FE-013 Assessment history and previous-attempt comparison
   (`GET /api/assessments`)
8. ~~BE-005a Admin authentication foundation~~ (done - Section 11a).
   **BE-005b / FE-014 Admin statistics**: the unblocked figures first, then charts and
   drill-down. CSV export only once the client confirms it is in scope (Section 11a,
   open decision 4)
9. FE-016 Comment and documentation pass, accessibility review, performance check
10. Packaging: Electron shell for the standalone Windows machine

Also outstanding on the assessment screen: elapsed time in the heading bar (the server
now has `startedAt` and `servedAt`, so it can be supplied).

---

## 14. How to Run

MongoDB must be running locally (Windows service `MongoDB`, port 27017).

**Backend**

```bash
cd backend
npm install
cp .env.example .env
# Then set ADMIN_SESSION_SECRET in .env - it has no default and the server will not
# start without it, or if it equals SESSION_SECRET. Generate one with:
#   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
npm run dev:pool                                          # padding for unauthored channels
npm run import:scenarios -- data/scenarios.dev-pool.json
npm run import:scenarios -- data/scenarios.instagram.json
npm run import:scenarios -- data/scenarios.sms.json
npm run import:scenarios -- data/scenarios.email.json
npm run import:scenarios -- data/scenarios.whatsapp.json
npm run dev
```

Other backend commands:

```bash
npm test
```

```bash
node scripts/validateApi.js
```

```bash
node scripts/validateAdminApi.js
```

API on http://localhost:5000/api - check `GET /api/health`.

**Creating the administrator.** Once per installation, in an interactive terminal:

```bash
npm run admin:create
```

It prompts for a username and a password (hidden), and refuses to overwrite an existing
administrator. There is no default account and no password reset - record the credential
in a password manager. `scripts/validateAdminApi.js` refuses to run once a real
administrator exists, so it can never touch that account.

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 - it redirects to `/login`. **The backend must be running**;
the frontend reads `VITE_API_BASE_URL` from `frontend/.env` (copy it from
`.env.example`).

---

## 15. Client Specification Alignment — 4 September 2026

> **READ THIS SECTION BEFORE ANY FURTHER DEVELOPMENT.** A new client specification
> arrived on 4 September 2026 and is now the authoritative implementation
> specification. It supersedes earlier project assumptions wherever they conflict.
> Sections 1–14 above are **retained as history**; where they conflict with this
> section, this section wins. Nothing in this section has been implemented — it is a
> plan only.

## 15.1 Authoritative sources (new hierarchy)

| Priority | Source | Role |
|---|---|---|
| 1 | **`Interactive_Social_Engineering_Scenario_UI_Development_Specification.pdf`** — Version 1.0, 02 September 2026, 116 pages, English. Currently in `C:\Users\robo9\Downloads\`. | **Authoritative client implementation specification.** Contains the product spec (§1–8), the release acceptance checklist, the complete 100-scenario content bank, and Appendix A (scenario authoring schema). |
| 2 | The repository (`backend/`, `frontend/`) | The actual implementation baseline. Never assume code matches spec — inspect it. |
| 3 | This file, `PROJECT_MASTER_PLAN.md` (Sections 1–14) | Historical project state, completed work, prior decisions. |
| 4 | `docs/QUESTION_ENGINE_DESIGN.md` | Prior technical design. Now partly superseded — see 15.19. |
| 5 | `Final MCTE Proposal.docx` | Commercial proposal. Retained for scope/commercial reference; the PDF above is the implementation authority. |

**Action item:** the PDF is not yet in the project folder. Copy it into the repository
root (or `docs/`) so the source of truth sits with the code.

## 15.2 Overall alignment status

**Partially aligned. Content and runtime architecture require major rework; platform
UI, identity, session, API and design-system work are largely preservable.**

| Layer | Verdict |
|---|---|
| Frontend shell, design system, UI primitives, session/auth, API client | **Largely reusable** |
| Four channel renderers | **Reusable as presentation, insufficient as experience** — need new interaction surfaces |
| Scenario data model, scenario content, sequence generation, scoring, results | **Must be replaced** |
| Interaction model (one screen graph → three multiple-choice answers → submit) | **Must be replaced** by a six-stage, event-driven runtime |
| Dashboard | **Must be redesigned** into a notification orchestrator |
| Admin | **Foundation reusable; scope expands well beyond statistics** |

The single largest finding: the current product is a **quiz** (one scenario = one screen
graph plus three multiple-choice answers). The client specification defines an
**interactive simulation** (one scenario = a six-stage state machine emitting an ordered
event ledger that is scored per event). This is a change of execution model, not a change
of renderer.

## 15.3 Client specification summary (verified against the PDF)

**Product.** Offline training-cum-evaluation for military personnel. Learner identifies
themselves → briefing → dashboard behaving like a contained mobile-communications hub →
10 randomized multi-step scenarios arriving as timed notifications → explainable score
out of 100 → attempt history retained for comparison. Four simulated platforms:
WhatsApp, Instagram, Email, SMS.

**Design principles (§1).** Realistic but recognizable as training (persistent
low-salience `TRAINING SIMULATION` rail; no trademark-perfect copying); *action, not
quiz* — "every scenario produces at least six ordered UI events"; balanced discrimination
(≥20% legitimate; false reporting and unnecessary abandonment lose marks); context-aware
difficulty (cue quality, premise alignment, sender familiarity, number of verification
steps — not only grammar mistakes); military relevance without exposure (fictional
`Unit Falcon` / `HQ Alpha` entities; never real names, locations, schedules,
capabilities, rosters or procedures); offline containment behind a deny-by-default
network boundary.

**Login (§2).** Name (2–60 chars, trimmed, control characters rejected) plus
Personal/Service Number (3–24 alphanumeric plus hyphen), normalized as the profile key
and **masked to the last four characters on every later screen**. Data contract:
`LearnerProfile {profile_id, display_name, service_no_normalized, service_no_masked,
created_at, last_seen_at}`. **Explicitly prohibited in v1: password, Aadhaar, phone,
email, rank, real unit fields.** Consent/briefing acknowledgement logged as a versioned
boolean plus timestamp. Five required states: Blank, Validating, New profile, Returning
profile, Storage error.

**Dashboard (§3).** Persistent training banner plus notification bar carrying local
clock, sound state, connection-off indicator and the latest synthetic notification.
Profile chip (display name plus masked service number). Progress card: scenario n/10,
segmented progress bar, elapsed time — **running score hidden in assessment mode**. Four
equally weighted app tiles with unread badges, last-event preview and status dot; apps
must **not** be locked into a fixed sequence. Stacked toast tray, **queue at most three**;
clicking deep-links to the scenario, dismissing logs an event but does not remove the
required scenario. Orchestrator status with Resume. **Next event delivered 1–4 seconds
after the dashboard becomes idle.** Opening the wrong app shows only benign background
items and logs navigation; never expose which tile is "correct". Never reveal difficulty,
malicious/legitimate label or attack family. After 10 resolved scenarios the CTA becomes
View results; **preserve the attempt atomically before displaying feedback**.

**Shared simulation components (§4).** Simulation shell (centered mobile viewport, target
390×844 logical px, inside a responsive desktop frame; optional full-width email view;
scenario content cannot escape its root). Safe browser (reserved `.example` /
`training.local` pages with address bar, Back and Close; DNS/network blocked; clicking is
scoreable; typed data replaced by tokens and never treated as real). File viewer (inert
PDF/image/text preview; risky file types show a simulated open/install branch; never
execute, extract macros, mount archives or call host handlers). QR inspector (decodes
only a scenario-supplied local payload and shows the full synthetic target before an Open
choice; camera and host clipboard disabled). Call/voice screen (synthetic caller, timer,
captions; Decline, Accept, End, Verify, Report; no microphone/camera permission and no
real dialer). Trusted Directory (searchable synthetic official contacts with provenance
such as "local approved directory" — **numbers and links inside the suspect message can
never populate a trusted result**). Action sheet (Reply, Forward, Delete, Mark safe,
Verify, Report, Block/Restrict as appropriate; every choice emits a stable event code and
can trigger a branch; **avoid disabling the wrong option**). Rationale input (optional
250-character one-line explanation in selected scenarios; sanitized locally; no paste of
real secrets). Feedback card (result, points, observed cues, preferred action, impact and
one prevention habit; training mode immediate, assessment mode may defer detail until
attempt completion).

**Six-stage state machine (§4).**

| # | State | Entry | Allowed transitions | Core events |
|---|---|---|---|---|
| 1 | Notify | Dashboard idle | Open toast/tile → 2; dismiss → remain | `notification_seen`, `notification_dismissed`, `open_latency_ms` |
| 2 | Open | App routed | Read → 3; premature action → 4 | `item_opened`, `dwell_ms`, `premature_reply` |
| 3 | Inspect | Detail controls available | Inspect → 4; skip → 4 | `sender_inspected`, `link_hover_ms`, `profile_viewed`, `file_previewed` |
| 4 | Branch | Risk/legitimate action exposed | Safe refusal/use → 5; risky action → local consequence → 5 | `link_opened`, `reply_sent`, `data_submitted`, `payment_attempted`, `install_attempted` |
| 5 | Verify | Action/verification tools available | Trusted check/report → 6; in-message check → 4 or 6 | `verify_started`, `verify_source`, `report_selected`, `block_selected` |
| 6 | Resolve | Final action chosen | Feedback → dashboard; abandon → resumable | `resolution_code`, `rationale`, `scenario_points`, `duration_ms` |

**Scoring (§5).** Each scenario awards up to 10 points. Positive evidence is earned;
unsafe or unjustifiably over-cautious behaviour subtracts. Clamp each scenario to 0–10,
then sum 10 scenarios for a 0–100 attempt score.

| Event | Points | Rule |
|---|---|---|
| `INSPECT_CONTEXT` | +2 | Inspect a meaningful sender/link/file/profile/thread signal before acting |
| `SAFE_PIVOT` / `CORRECT_USE` | +3 | Refuse the malicious pivot, or correctly use the legitimate in-app path |
| `TRUSTED_VERIFY` | +3 | Verify through a known independent source — not contact data supplied by the message |
| `RESOLVE_CORRECT` | +2 | Report/block/retain/continue as the verified disposition requires |
| `PREMATURE_REPLY` | −1 | Reply or act before reading context |
| `RISKY_OPEN` / `REPLY` | −3 | Open a suspect link/file, call the supplied number, or engage a stranger |
| `SECRET` / `PAYMENT` / `INSTALL` / `DATA RELEASE` | −8 | Submit a password/OTP/PIN, attempt payment, install an app, approve device link, or disclose protected details |
| `FALSE REPORT` / `BLOCK` | −4 | Report/block a legitimate item despite sufficient confirming evidence |
| `NEEDLESS REJECT` / `IGNORE` | −2 | Abandon a legitimate time-relevant task without using the available verification path |

**The §5 table is not exhaustive.** The per-scenario pages add four further codes, used
uniformly across all 100 scenarios — see 15.10.

**Attempt constraints (§5).** Exactly 10 resolved scenarios · rotating **3/3/2/2**
platform allocation "so every platform appears and long-run exposure is balanced" ·
target **3 Easy / 4 Medium / 3 Hard**, with one-step relaxation permitted only if
exclusions make selection impossible · **exactly 8 malicious/deceptive and 2 legitimate,
with the legitimate items from different platforms** · **2–4 fictional military-context
cases per attempt** · at least **five psychological triggers** and **no attack family
more than twice** · exclude the learner's **most recent 20 scenario IDs where possible**
and **store the deterministic selection seed** · **no difficulty change mid-attempt** in
scored baseline mode (adaptive practice is a separate mode) · persist the event ledger
and scenario result **transactionally before issuing the next dashboard notification**.

**Interpretation safeguard (§5).** Do not label a learner psychologically vulnerable from
a single mistake. Report behaviour by scenario family/trigger and show confidence only
after repeated exposure.

**Data model (§6).** Six entities — `LearnerProfile`, `ScenarioDefinition`, `Attempt`,
`ScenarioRun`, `Event`, `ProgressSnapshot` — with the minimum fields quoted in 15.5 and
15.9.

**Admin minimum (§6).** Scenario manager (create/edit/clone/deactivate versioned
scenarios; validate all six stages and synthetic asset references before publishing);
attempt viewer (filter by learner and date; scores, action path and remediation without
exposing sensitive typed content); exports (offline CSV/PDF summary to an
instructor-selected local path, clearly marked as training data with version); controls
(reset an incomplete attempt, archive a profile under local policy, configure training vs
assessment feedback timing); **append-only audit log** for scenario publication, resets,
exports and configuration changes.

**Results (§7).** Large 0–100 total plus 10 scenario points; **avoid pass/fail labels
unless the instructor configures a local policy**; behaviour breakdown by platform,
attack family, trigger and action stage, **distinguishing missed threat from false
positive**; compact path replay of inspect/branch/verify/resolve events that never
displays real user secrets; per-case feedback (disposition, observed cues, safe response,
likely impact, one habit) in blame-free language; progress comparison **only when mode
and content version are comparable**, showing trend and exposure count; remediation
recommending 2–3 targeted practice scenarios from weak families **without diagnosing
personality or emotional state**; exit (save completed attempt, return to dashboard,
print/export if authorized, logout).

**Authoring schema (Appendix A).** Seven field groups: identity, classification,
synthetic content, six stages, scoring, feedback and **quality** (content reviewer,
technical reviewer, instructional reviewer, safety check, accessibility check, pilot
status). Definition of done per scenario: a fresh learner can complete the safe path;
every risky path remains locally contained; the disposition is supported by observable
evidence; **verification does not leak the answer**; points sum correctly; copy is
fictional; feedback teaches one transferable habit.

## 15.4 Verification of the client scenario bank

The full 116-page PDF was extracted and every scenario page parsed programmatically.
**The bank is complete and internally consistent. No structural ambiguity or missing data
was found.**

| Check | Result |
|---|---|
| Total scenarios | **100** (pages 11–113, excluding the four platform index pages) |
| Per platform | WhatsApp 25 (`W01`–`W25`), Instagram 25 (`I01`–`I25`), Email 25 (`E01`–`E25`), SMS 25 (`S01`–`S25`) |
| Duplicate IDs | none |
| Difficulty per platform | 8 Easy / 9 Medium / 8 Hard — matches §1 exactly (totals 32 / 36 / 32) |
| Disposition per platform | 20 Malicious / 5 Legitimate — matches the §1 claim of 80 + 20 |
| Six stages present | **100 / 100** (every scenario has 1 Event, 2 Open, 3 Inspect, 4 Branch, 5 Verify, 6 Resolve) |
| End-state present | 100 / 100 |
| Concise learner feedback present | 100 / 100 |
| Primary trigger present | 100 / 100 |
| Military-context cases | **35** — WhatsApp 10, Instagram 12, Email 8, SMS 5; matches each platform index page header exactly |
| Per-scenario scoring events | uniform across the bank (see 15.10) |

**Structural patterns the importer must encode:**

- Legitimate controls sit at fixed ordinals in every platform: **03, 07, 11, 16, 21**
  (`W03 W07 W11 W16 W21`, and the same ordinals for I / E / S).
- The **military flag is encoded inside the Primary-trigger string** as the suffix
  `| FICTIONAL MILITARY CONTEXT`. It is a presentation artifact of the PDF, not a trigger
  value. The importer must split on `|`, set `military_flag` from the suffix, and store
  only the left-hand side as the trigger.
- Military-flagged IDs: WhatsApp `W03 W06 W09 W14 W15 W16 W18 W19 W21 W23`; Instagram
  `I03 I05 I06 I11 I13 I14 I16 I18 I19 I20 I21 I25`; Email `E06 E07 E09 E12 E14 E19 E22
  E25`; SMS `S06 S14 S15 S19 S22`.

Every scenario page carries four content columns per stage — *Learner flow + synthetic
content*, *UI to build*, *Expected safe behavior*, *Scoring event* — plus *End-state* and
*Concise learner feedback*. All six are required by the importer.

## 15.5 Scenario / data model gap

**Current `backend/src/models/Scenario.js`** models a *screen graph plus a
multiple-choice answer set*: `scenarioCode, channel, type, version, isActive, title,
instruction, simulation{entryScreenId, screens[]}, actionOptions[], reasonOptions[],
evaluation{correctJudgement, fraudTheme, eviTags, warningSigns, feedback, authorNotes}`.

**Client `ScenarioDefinition`** requires `scenario_id, platform, level, disposition,
family, trigger, military_flag, version, six states, expected actions, feedback, active`
— plus Appendix A's identity / classification / synthetic-content / scoring / quality
groups.

| Client field | Current equivalent | Verdict |
|---|---|---|
| `scenario_id` | `scenarioCode` | **Rename / retarget.** New IDs are `W01`…`S25`; current codes are `WA-01`… |
| `platform` | `channel` (`whatsapp` \| `instagram` \| `sms` \| `email`) | **Keep, rename.** Value set matches |
| `level` (Easy / Medium / Hard) | **absent** | **ADD.** Blocks the difficulty constraint entirely |
| `disposition` | `type` (`malicious` \| `legitimate`) | **Keep, rename** |
| `family` | `evaluation.fraudTheme` (free text, malicious only) | **REPLACE.** Store the client string **verbatim** on all 100. Add our `canonical_family` + `taxonomy_version` alongside it — 15.23 |
| `trigger` | `evaluation.eviTags[]` (7 EVI categories) | **REPLACE.** Store the client string **verbatim**; add `canonical_triggers` + `trigger_taxonomy_version`. `eviTags` is **retired** — 15.24 |
| `military_flag` | **absent** | **ADD.** Blocks the 2–4 military constraint |
| `version`, `active` | `version`, `isActive` | **Keep as-is** |
| **six states** with UI, choices, next states, events | `simulation.screens[]` + `actionOptions[]` | **REPLACE.** The screen graph has no stage concept, no per-stage event emission and no allowed-transition rules |
| **expected actions** | partially in `actionOptions[].marks` | **REPLACE** |
| `feedback` (disposition, cues, impact, preferred action, habit) | `evaluation.feedback` (one string) + `warningSigns[]` | **REFACTOR** into the five-part structure |
| assets (inert asset IDs, reserved links) | `blocks[].displayUrl`, `fileName`, … | **REFACTOR** into a referenced, validated asset registry |
| scoring (stable event codes, point deltas, per-scenario cap, critical-risk flag, expected final outcome) | `actionOptions[].marks`, `isCriticalFailure` | **REPLACE** |
| quality group (reviewers, safety check, accessibility check, pilot status) | `authorNotes` only | **ADD** |

**What survives.** The `select: false` plus `toCandidateJSON()` two-layer guard on hidden
evaluation data is a genuinely good pattern and must be carried into the new model —
`level`, `disposition`, `family`, `trigger`, `military_flag`, scoring and feedback are all
**server-only** until resolution. The `pre('validate')` consistency hook and the
importer's "validate everything, then write nothing unless every entry passes" discipline
should also be retained.

**Migration approach: a new `ScenarioDefinition` collection**, not an in-place migration
of `Scenario`. The 40 existing scenarios are internally authored placeholders written
against a superseded interaction model (three multiple-choice answer sets, no stages, no
events); the client has supplied all 100 replacements; and running both shapes in one
collection would force every consumer to branch. Keep the old `Scenario` collection and
its JSON files **read-only on disk as history** until the new bank is imported and
verified, then deactivate.

## 15.6 Scenario content gap

| | Current | Client requirement |
|---|---|---|
| Total | 40 | **100** |
| Per platform | 10 | **25** |
| Malicious / legitimate | 28 / 12 | **80 / 20** |
| Difficulty | none | **8 E / 9 M / 8 H per platform** |
| Military-context | none | **35 flagged** |
| Stages | none (free screen graph) | **600 stages** (6 × 100) |

**None of the 40 existing scenarios corresponds to a client scenario.** They were
internally authored to a different schema and a different interaction model. The client
has provided complete replacement content, so under the "do not invent client content"
rule they are **retired, not migrated**. Retain the JSON files on disk for provenance; do
not delete them in the same task that imports the new bank.

**The scenario content is prose in a PDF, not structured data.** Producing the 100
importable JSON records is itself a substantial task (`DATA-003`) and needs a human
content-review gate before publication — this is the single largest content risk in the
project.

## 15.7 Scenario selection gap

**Current `sequenceGenerationService.js`** enforces one of 6+4 / 7+3 / 8+2 (randomly
chosen), a per-channel floor of 2 with two relaxation steps, unseen-preferred bucket
ordering, and a "no three in a row from one channel" shuffle. It calls
`crypto.randomInt` directly and **stores no seed**.

| Client rule | Current | Gap |
|---|---|---|
| Exactly 10 scenarios | ✅ `ASSESSMENT_SCENARIO_COUNT = 10` | none |
| **Exactly 8 malicious + 2 legitimate** | ❌ three splits allowed, chosen at random | 6+4 and 7+3 must be **removed** |
| **2 legitimate from different platforms** | ❌ not modelled | new constraint |
| **Rotating 3/3/2/2 platform allocation** | ❌ floor-of-2 plus free picks | replaces the floor model entirely |
| **3 Easy / 4 Medium / 3 Hard** | ❌ difficulty does not exist in the schema | blocked on `level` |
| **2–4 military-context cases** | ❌ not modelled | blocked on `military_flag` |
| **≥5 psychological triggers** | ❌ not modelled | **Resolved 4 Sep 2026** — counted over the derived `canonical_triggers`; a genuine floor (rejects 0.005%), not a diversity driver. See 15.24 |
| **No attack family more than twice** | ❌ not modelled | inert on the raw client label (0 / 20,000 draws rejected). **Resolved 4 Sep 2026** — applies to the derived `canonical_family`; see 15.23 |
| **Exclude the most recent 20 scenario IDs** | partial — `Candidate.seenScenarios` stores `{scenario, lastSeenAt, timesSeen}` | the stored data is sufficient; the **rule is not implemented** (current logic is a soft "unseen-preferred" ordering, not a hard recent-20 window) |
| **Store the deterministic selection seed** | ❌ no seed stored | requires a seeded PRNG replacing `randomInt` |
| One-step difficulty relaxation only when impossible | partial — a generic relaxation ladder exists | must be re-specified for the new constraint set |
| No adaptive difficulty mid-attempt | ✅ sequence frozen at creation | none |

**Feasibility was verified computationally against the real 100-scenario bank, not
assumed.** All six distinct 3/3/2/2 platform allocations simultaneously satisfy the
disposition, difficulty, legitimate-platform-diversity, military, trigger-diversity and
family constraints. Across 60 trials with a random 20-scenario exclusion window there
were **zero failures**. The only infeasible case found is pathological — an exclusion set
that removes all 20 legitimate scenarios — which cannot occur in practice, because an
attempt consumes only 2 legitimate items, so a recent-20 window spans two attempts and
contains at most 4. **Conclusion: the constraint set is satisfiable; the relaxation
ladder is a safety net, not a routine path.**

**Retained from the current implementation:** the *architecture* of
`sequenceGenerationService.js` — a pure function taking `(pool, history)` and returning a
plan, with no database, dates or global state, plus an explicit `relaxations[]` audit
trail — is correct and should be kept. Its *constraint logic* is replaced wholesale.

## 15.8 Six-stage state machine gap

**Current runtime.** `AssessmentPage` → `ScenarioContainer` → `PhoneSimulator` → channel
renderer → `DecisionPanel`. `PhoneSimulator` holds `useState(screenId)` and walks a
screen graph; taps are pushed into a `useRef` array (`interactions.current`) and posted
alongside the answer. `DecisionPanel` collects `{judgement, action, reason}`;
`POST /:id/answers` scores all three and advances `currentPosition`.

**This cannot support the client model, and not because of the renderers.**

1. **No stage concept.** Screens form a free navigation graph. The client requires six
   ordered states with defined entry conditions and allowed transitions — including
   `Inspect: skip → 4` and `Verify: in-message check → 4 or 6` as explicit legal edges.
2. **Interactions are decoration, not the answer.** `Assessment.answers.interactions` is
   documented in the model itself as *"client-relative, recorded for interest only, never
   scored"*. In the client model the interaction path **is** the score.
3. **One commit per scenario, at the end.** The client requires committed stage
   transitions, resume at the last committed state, and no duplicate points.
4. **Client-authoritative timing.** `atMs: Date.now()` comes from the browser. The client
   requires server-authoritative event ordering and `elapsed_ms`.
5. **The judgement / action / reason decision panel has no place in the client model.**
   Resolution is expressed by *doing* — report, block, verify, continue — plus an optional
   250-character rationale.

**Required shape.** A server-owned `ScenarioRun` state machine: the client posts
*intents*; the server validates the transition against the scenario's stage definition,
appends events to the ledger with a server sequence number, applies point deltas, and
returns the next legal surface. The frontend becomes a renderer of server-declared stage
state rather than the owner of it.

**Preserved:** `PhoneSimulator`'s discipline — local state only, never touches the URL,
never opens a link, never makes a request — is exactly the containment property the
client requires, and carries forward into the new shell.

## 15.9 Event ledger gap

**Current.** `Assessment.sequence[].answer.interactions[]` — an embedded array of
`{screenId, actionId, interaction, atMs}`, explicitly unscored. No sequence number, no
idempotency key, no server timestamp, no event-code vocabulary, no point delta.

**Required.** `Event {event_id, run_id, sequence, event_code, client_ts, elapsed_ms,
synthetic_target_id, points_delta, metadata_allowlist}`.

| Requirement | Current | Gap |
|---|---|---|
| Stable event-code allowlist | ✅ `INTERACTION_TYPES` exists (6 values) but is a different vocabulary | replace with the client's ~23 stage codes plus the 16 scoring codes |
| Monotonic server `sequence` | ❌ array order only | **ADD** |
| `points_delta` per event | ❌ unscored | **ADD** — this is where scoring moves to |
| `synthetic_target_id` | partial (`screenId`, `actionId`) | **ADD** as a first-class reference to the asset/target |
| `metadata_allowlist` | ❌ | **ADD** — required by the Privacy acceptance criterion ("logs use event allowlists") |
| Idempotency / duplicate prevention | ❌ | **ADD** — client-generated idempotency key plus a unique index on `(run_id, sequence)` |
| Replay / recovery | ❌ | **ADD** — "closing/reopening resumes at the last committed state without duplicating points or skipping events" |
| Transactional persistence | ❌ single `assessment.save()` | **ADD** — "persist event ledger and scenario result transactionally before issuing the next dashboard notification" |
| Server authority over ordering and timing | ❌ `atMs: Date.now()` from the browser | **CHANGE** — `client_ts` retained as advisory; `sequence` and `elapsed_ms` server-derived |

**Storage volume.** §4 requires at least six events per scenario; realistically 10–25
once `dwell_ms`, `link_hover_ms` and inspection events are included. At roughly 20 events
× 10 scenarios that is about 200 events per attempt. Small in absolute terms, but it
**does not belong embedded in the `Attempt` document** — the constraint is not Mongo's
16 MB limit but unbounded array growth under concurrent `$push`. **Recommendation: a
separate `events` collection**, with a unique index on `(run_id, sequence)`, and
`Attempt` / `ScenarioRun` holding rollups only.

**Transactions.** MongoDB multi-document transactions require a replica set. A standalone
`mongod` on a single Windows PC **does not support them**. This is a real deployment
constraint that has now been settled — **see 15.25**. The live install was measured: MongoDB
8.3.7 **standalone**, and a transaction probe **failed**. Resolved by converting to a
single-node replica set; R4 is closed.

## 15.10 Scoring gap

**Current `scoringService.js`.** `judgement (0 or 3) + action (−5..+5) + reason (0..2)`,
clamped to −5..+10. Marks live on the scenario's answer options. There is **no attempt
aggregation at all** — `Assessment.result` is `null`, `summaryOf()` returns
`scoringPending: true`, and Section 12 item 15 records that the approved proposal had
removed the scoring formula.

**The new specification resolves that open question — but with a completely different
model.** Scoring is now **per event**, not per answer. Section 12 item 15 is therefore
**SUPERSEDED**, not answered.

**Complete event vocabulary.** §5 lists nine events. Parsing all 100 scenario pages shows
four further codes, used with perfect consistency across the bank:

| Code | Points | Appears on | In the §5 table? |
|---|---|---|---|
| `NOTIFY_SEEN` | +0 | all 100 | no — stage-1 marker |
| `ITEM_OPEN` | +0 | all 100 | no — stage-2 marker |
| premature `reply/action` (`PREMATURE_REPLY`) | −1 | all 100 | yes |
| `INSPECT_CONTEXT` | +2 | all 100 | yes |
| `SAFE_PIVOT` | +3 | 80 malicious | yes |
| `CORRECT_USE` | +3 | 20 legitimate | yes |
| `risky open/reply` | −3 | 80 malicious | yes |
| `secret/payment/install/data release` | −8 | 80 malicious | yes |
| `needless reject/ignore` | −2 | 20 legitimate | yes |
| **`unsafe external action`** | **−4** | 20 legitimate | **no — additional** |
| `TRUSTED_VERIFY` | +3 | all 100 | yes |
| **`report-only without checking`** | **+1** | 80 malicious | **no — additional** |
| **`verification through message`** | **+0** | all 100 | **no — additional** |
| `false report/block` | −4 | 20 legitimate | yes |
| `RESOLVE_CORRECT` | +2 | all 100 | yes |
| **`contradictory unsafe final`** | **−4** | all 100 | **no — additional** |

**The maximum safe path sums to exactly 10**: `INSPECT_CONTEXT +2` plus `SAFE_PIVOT` /
`CORRECT_USE +3` plus `TRUSTED_VERIFY +3` plus `RESOLVE_CORRECT +2`. The 0–10 clamp is
therefore a floor guard, not a ceiling guard, on the safe path.

**Required changes:** move scoring from answer options to event codes; clamp per scenario
to 0–10 (**note the current model's floor is −5, the client's is 0**); sum ten scenarios
for a 0–100 total; record `points_delta` on each event so the score is explainable and
replayable; score on the server at event-commit time, never at attempt end. `MARKS`,
`PERFORMANCE_BANDS`, `JUDGEMENTS` and the judgement/action/reason ranges in
`backend/src/constants/assessment.js` are all **superseded**. Note also §7: **avoid
pass/fail labels unless the instructor configures a local policy** — the existing
85/70/50 bands must become an optional, instructor-configured overlay rather than an
intrinsic property of a result.

## 15.11 Results / history gap

**Current.** `Assessment.result` is `Mixed` and always `null`. `summaryOf()` returns
counts plus `scoringPending: true`. `HistoryPage` deliberately shows no score or band.
`GET /api/assessments` returns per-attempt counts only.

**Required (§7 plus `ProgressSnapshot`).** 0–100 total plus 10 scenario points; behaviour
breakdown by platform, attack family, trigger and action stage; missed threat vs false
positive; compact path replay of the event ledger; five-part per-case feedback; progress
comparison gated on comparable mode and content version; remediation of 2–3 practice
scenarios from weak families. `ProgressSnapshot {profile_id, attempt_count, last_score,
best_score, platform/family aggregates, generated_at}`.

**History implications.** History was intentionally built without score or band because
scoring was unresolved. **That decision was correct and is now unblocked.** History
evolves rather than being replaced: add `total_score`, trend, exposure count and the
mode/content-version comparability gate. **Do not touch History until the scoring engine
exists** — it would only have to be rewritten. `scoringPending: true` remains the honest
response until then.

Two client rules constrain the comparison feature specifically: compare *only* when mode
and content version match, and never diagnose personality or emotional state.

## 15.12 Dashboard / orchestrator gap

The current `DashboardPage` is a **launcher**: welcome, one progress card, a
Start/Continue button, a history link, and four static informational tiles stating "10
scenarios available" per channel. The client requires a **notification-driven
orchestrator**.

| Client requirement | Current | Verdict |
|---|---|---|
| Persistent training rail plus notification bar | `AppHeader` carries a static training marker | **extend** |
| Local clock, sound state, connection-off indicator | absent | **new** |
| Profile chip with **masked** service number | shows first name only | **new** — masking is not implemented anywhere |
| Progress card: n/10, segmented bar, elapsed time, score hidden in assessment mode | count plus bar; no elapsed time | **extend** |
| Four app tiles with unread badges, last-event preview, status dot; not locked into a sequence | four static description tiles | **replace** |
| Stacked toast tray, max 3 queued, deep-link on click, dismiss logs an event | absent | **new** |
| Orchestrator: next event 1–4 s after dashboard idle; Resume after interruption | absent — the assessment is a separate full-screen route | **new** |
| Wrong app shows benign background items, logs navigation, never reveals the correct tile | absent | **new** |
| Never expose difficulty / disposition / attack family | ✅ exposed nowhere today | **retain** |
| Results gateway replaces the CTA after 10 resolutions; attempt preserved atomically first | navigates to a placeholder completion card | **replace** |

**Verdict: substantially redesigned, not patched.** The dashboard stops being a page the
learner leaves and becomes the shell the simulation runs inside. Note that the tiles'
current copy ("Each app has 10 scenarios available") also leaks pool structure and is
factually wrong under the new bank.

## 15.13 Platform UI, shared primitives, safety and accessibility

**Renderer classification.** All four renderers read one generic `screen` shape and
present it per platform. They are competent, contained (no `href`, no `window.open`, no
`fetch` — verified by grep across `frontend/src`), and visually credible.

| Component | Class | Why |
|---|---|---|
| `WhatsAppRenderer` (319 ln) | **C — Refactor** | Thread/list/bubbles/ticks/avatars reusable. Missing: contact and group info sheet, media and attachment surfaces, link-preview interaction, call screen, verification affordances, action states |
| `InstagramRenderer` (494 ln) | **C — Refactor** | Feed/profile/post present. Missing: DM surface, verification-badge semantics, support and social patterns |
| `EmailRenderer` (298 ln) | **C — Refactor** | Inbox plus reading pane present. Missing: full sender metadata (envelope vs display name), link inspection, attachment handling, browser/file hand-off, optional full-width view |
| `SmsRenderer` (288 ln) | **C — Refactor** | List and thread present. Missing: sender-header / short-code semantics, link handling, callback and call flow, report-junk controls |
| `GenericRenderer` (181 ln) | **A — Keep as-is** | Fallback only |
| `PhoneSimulator` (102 ln) | **C — Refactor** | Navigation model is sound; must become stage-aware and event-emitting |
| `ScenarioContainer` (18 ln) | **B — Small modification** | Resize to the 390×844 logical viewport; keep the frame |
| `DecisionPanel` (100 ln) | **F — Retire** | The judgement/action/reason model does not exist in the client spec |
| `AssessmentHeader` (33 ln) | **C — Refactor** | Becomes stage progress plus elapsed time |
| `ChannelIndicator` (32 ln) | **B — Small modification** | |

**Shared simulation primitives — all NEW (class E).** Simulation shell, notification /
toast tray, app switcher, safe browser mock, file viewer, QR inspector, call/voice
screen, Trusted Directory, action sheet, verification-source chooser, rationale input,
stage progress, event dispatcher, local clock, connection and sound indicators. **These
are cross-platform and must be built once, before the platform experiences are
reworked** — building them per-renderer is the largest avoidable-rework risk in the plan.

**Safety / offline.**

| Requirement | Status |
|---|---|
| No `href`, `window.open`, `target="_blank"` or `fetch` outside `apiClient` | **compliant** (verified 4 Sep 2026) |
| Links rendered as plain text (`displayUrl`), never as working hrefs | **compliant** |
| No real credential / OTP / payment fields | **compliant** — no such input exists |
| No real dialer, camera, clipboard or DNS | **compliant** by absence |
| Reserved `.example` / `training.local` domains | **not yet applicable** — no browser mock exists; must be enforced by the importer and asset validator |
| Inert files, no macros, no archive mounting, no host handlers | **not yet applicable** — no file viewer exists |
| Local Trusted Directory | **missing** — new component |
| **Deny-by-default network boundary** | **missing as an enforced control.** Compliance today is by absence of code, not by a boundary. Needs an explicit CSP, Electron `will-navigate` / `setWindowOpenHandler` denials, and a network-monitor test |
| Network-off test completing all 100 scenarios | **missing** — acceptance test |

**Accessibility.** `:focus-visible` and `prefers-reduced-motion` are handled in
`styles/index.css`, and ARIA labels are used across components. **Not yet verified against
the client's six criteria** — keyboard-only completion, visible focus, readable contrast,
labels, 200% zoom, no colour-only meaning. `ChannelIndicator` and `StatusBadge` are the
likeliest colour-only-meaning failures. A formal audit is required; it is scheduled after
the new UI exists, since auditing UI that is about to be replaced is wasted effort.

## 15.14 Ambiguities requiring resolution

Classified per the client's own evidence. **Recommendations below are recommendations,
not requirements, and must not be recorded as client decisions.**

### CLEARLY SPECIFIED (no decision needed)
100 scenarios / 25 per platform · 8+2 disposition · 3E/4M/3H · 3/3/2/2 platform
allocation · 2–4 military cases · recent-20 exclusion · deterministic seed stored · the
six stages and their transitions · the nine §5 scoring events · the 0–10 clamp and 0–100
total · `LearnerProfile` fields and the prohibited-field list · the six data entities ·
the admin minimum · the release acceptance checklist · Appendix A · and every scenario's
platform, level, disposition, family, trigger, military flag, six stages, end-state and
feedback.

### SAFE IMPLEMENTATION INFERENCE
1. **`NOTIFY_SEEN` and `ITEM_OPEN` are +0 markers**, not scoring events — consistent
   across all 100 pages.
2. **Legitimate scenarios use `CORRECT_USE`; malicious use `SAFE_PIVOT`** — the split
   matches disposition perfectly across the bank.
3. **The safe path sums to exactly 10**, so the 0–10 clamp guards the floor.
4. **The military flag is parsed from the trigger suffix** `| FICTIONAL MILITARY CONTEXT`.
5. **A separate `events` collection**, rather than an embedded array.

### IMPLEMENTATION DECISION (ours to make — record it)
6. Seeded PRNG algorithm and seed format. *Recommend* a documented xorshift/PCG with the
   seed stored as a string on `Attempt`, so any selection is exactly reproducible for audit.
7. Event idempotency mechanism. *Recommend* a client-generated key plus a unique index on
   `(run_id, sequence)`.
8. Where the state machine executes. *Recommend* server-authoritative; the client renders.
9. New collections vs migrating existing ones. *Recommend* new — see 15.5.
9a. **Canonical attack-family taxonomy — DECIDED 4 September 2026.** Moved here from the
    client-confirmation list. Full record in **15.23**; complete 100-scenario mapping in
    `docs/ATTACK_FAMILY_TAXONOMY.md`.
9b. **Canonical trigger taxonomy + retirement of EVI — DECIDED 4 September 2026.** Moved
    here from the client-confirmation list. Full record in **15.24**; complete
    100-scenario mapping in `docs/TRIGGER_TAXONOMY.md`.
9c. **Deployment topology + transaction strategy — DECIDED 4 September 2026.** Moved here
    from the client-confirmation list. Single-node replica set, two-document hot-path
    transaction, derived attempt rollup, index-based idempotency. Full record in **15.25**;
    detail in `docs/DEPLOYMENT_AND_TRANSACTION_STRATEGY.md`.

### REQUIRES CLIENT CONFIRMATION
10. ~~**Attack-family taxonomy.**~~ — **RESOLVED 4 September 2026 as an IMPLEMENTATION
    DECISION.** Moved out of this list; it is no longer a client-confirmation item.
    See **15.23**. Summary: option (b) adopted — we derive and own a canonical taxonomy;
    the client's `family` string is preserved verbatim and a separate `canonical_family`
    field drives selection and analytics. **This is our decision and must never be
    represented to the client as a client-specified requirement.**
11. ~~**Trigger vocabulary.**~~ — **RESOLVED 4 September 2026 as an IMPLEMENTATION
    DECISION.** Moved out of this list; it is no longer a client-confirmation item.
    See **15.24**. Summary: the client `trigger` string is preserved verbatim; a derived
    `canonical_triggers` array (22 ids, folded from 31 raw primitives) drives the `>= 5`
    rule and §7 analytics. The `>= 5` threshold is the client's and is unchanged. **EVI is
    retired.** *(Correction: the exact composite-string count is **63**, not "about 66".)*
    **The vocabulary is our decision and must never be represented to the client as a
    client-specified requirement.** One naming question is left to the user, not the
    client: whether the word "EVI" survives as a results-screen label — see 15.24.
12. **Rotation semantics for 3/3/2/2.** Six distinct allocations exist. Is the rotation a
    per-learner round robin (attempt 1 → WA 3 / IG 3 / EM 2 / SMS 2, attempt 2 → the next
    rotation), a global rotation, or seeded-random? "Long-run exposure is balanced"
    implies a deterministic per-learner cycle. *Temporary recommendation:* a fixed 4-step
    per-learner cycle in which each platform takes 3, 3, 2, 2 in turn, giving exact
    balance every four attempts.
13. **Training vs assessment mode.** §3 and §4 both reference the two modes, and §6
    requires "configure training vs assessment feedback timing", but the mode's full
    behavioural definition is not given beyond feedback timing and running-score
    visibility. Confirm whether training mode is in v1 scope and whether it affects
    anything else.
14. **Rationale storage.** §4 says "store only if policy permits". What is the local policy
    default? *Temporary recommendation:* store, sanitized, with an admin toggle.
15. **`Attempt.mode` values**, and whether adaptive practice mode is in v1 scope (§5 calls
    it "a separate mode"). *Temporary recommendation:* implement `assessment` only.
16. **Pass/fail bands.** §7 says avoid pass/fail labels unless the instructor configures a
    local policy. Do the existing 85/70/50 bands survive as that optional local policy, or
    are they withdrawn?
17. **The existing 40 scenarios.** Confirm they are retired rather than merged. The bank is
    complete, so merging would breach the documented totals — but the client should confirm
    before content is deactivated.
18. **Admin scope expansion.** Section 11a recorded the admin panel as "statistics only, no
    scenario authoring UI" per proposal Assumption 4. The new specification **requires a
    full scenario manager with create / edit / clone / deactivate and versioning**. This is
    a material scope increase and needs explicit commercial confirmation.
19. **PDF export.** §6 requires offline CSV **and PDF**. Section 11a listed CSV export as
    not-yet-confirmed scope. PDF generation is also a new dependency decision on an offline
    machine.
20. ~~**Deployment topology and MongoDB transactions.**~~ — **RESOLVED 4 September 2026 as
    an IMPLEMENTATION DECISION.** Moved out of this list; it is no longer a
    client-confirmation item. See **15.25**. Summary: a **single-node MongoDB replica set**
    on the same offline Windows machine, member pinned to `127.0.0.1`. The live install was
    measured, not assumed — MongoDB 8.3.7 standalone, and a transaction probe **failed**.
    **The topology is our decision and must never be represented to the client as
    client-specified infrastructure.**
21. **Login field — now answered.** Section 12 item 1's long-standing question is resolved
    by §2: it is a *Personal / Service Number*, 3–24 alphanumeric plus hyphen — **not** a
    phone number. Recorded here as resolved; flagged only because it contradicts the
    permissive validation currently implemented.

## 15.15 Rework risk — what must stop now

**STOP immediately. Do not start, and do not extend:**

| Paused work | Why |
|---|---|
| **FE-014 / BE-005b Admin statistics** | Would aggregate a scoring model that is being replaced, over an `Assessment` schema that is being replaced. Every chart would be rewritten. **This was the "NEXT" task in Section 11 and is now paused.** |
| **BE-003 scoring aggregation** | The client has now specified scoring. The proposed judgement/action/reason aggregation is superseded before it was built — a fortunate near-miss. |
| **FE-012 Result screen** | Depends on results and breakdown structures that do not exist yet. |
| **Any new channel-renderer feature** | Renderers are being refactored around shared primitives that do not exist yet. |
| **Authoring more scenarios in the old schema** | The client supplied all 100. |
| **Extending `sequenceGenerationService`** | Its constraint logic is being replaced. |
| **History score / band** | Correctly deferred; stays deferred until the scoring engine lands. |

**Risks.**

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | Converting 600 prose stages into validated JSON is the largest single work item, and it is content work rather than code | **High** | Dedicated phase (`DATA-003`), schema first, automated structural validation, human review gate, platform-by-platform batches |
| R2 | Building simulation primitives inside individual renderers | **High** | The shared-primitives phase (`UI-00x`) strictly precedes platform rework |
| R3 | Event ledger without idempotency → duplicate points on resume or retry | **High** | Unique `(run_id, sequence)` index plus idempotency keys designed in from `EVENT-001` |
| ~~R4~~ | ~~Standalone MongoDB does not support multi-document transactions~~ | **CLOSED 4 Sep 2026** | Resolved by 15.25 — single-node replica set. Confirmed by measurement: the live install is standalone and a transaction probe failed. Residual: a single-node set has **no redundancy** — see R10 |
| R10 | Single-node replica set has no redundancy; disk failure or `dbPath` corruption loses training records | **Low** | Neither better nor worse than today's standalone install. Documented cold-backup runbook (stop service, copy `dbPath`) in install and handover — `PKG-001` |
| ~~R5~~ | ~~Attack-family taxonomy unresolved → the variety constraint is unenforceable~~ | **CLOSED 4 Sep 2026** | Resolved by 15.23. Residual risk: the taxonomy is ours, not the client's, so a future client taxonomy would force a re-map — bounded by the versioning rule and the preserved client `family` field |
| R6 | Admin scope increase not commercially agreed | **Medium** | Question 18, before `ADMIN-00x` starts |
| R7 | The deny-by-default network boundary is compliance-by-absence, not an enforced control | **Medium** | Explicit CSP plus Electron handlers plus a network-monitor acceptance test |
| R8 | Dashboard orchestrator timing (1–4 s, max 3 toasts) interacting with resume | **Medium** | Server-owned queue state; the client renders it |
| R9 | The existing 40 scenarios deleted before the new bank is verified | **Medium** | Deactivate, never delete; keep the JSON files on disk |

## 15.16 Reuse / refactor / replace matrix

**A** keep as-is · **B** small modification · **C** refactor · **D** replace · **E** new
component required · **F** retire

| Module | Class | Reasoning |
|---|---|---|
| `Candidate` model | **C** | Becomes `LearnerProfile`. `name` / `identifier` / `identifierNormalised` map directly to `display_name` / `service_no_normalized`, and `normaliseIdentifier()` is reusable. **Add** `service_no_masked`, `briefing_version`, `last_seen_at`. **Do not add** phone / email / rank — §2 prohibits them. `seenScenarios[]` is retained and becomes the recent-20 source |
| Candidate auth plus `session` middleware | **A** | Cookie session, no password, guard — all fit §2 |
| Admin auth (`AdminUser`, `adminSession`, `requireAdmin`, throttle, `admin:create`) | **A** | Sound foundation; the separate-collection reasoning still holds |
| `AdminUser` Argon2id plus `select:false` pattern | **A** | |
| `Scenario` model | **D** | Replaced by `ScenarioDefinition` — 15.5 |
| Scenario JSON data (40 scenarios, 5 files) | **F** | The client supplied all 100. Retain on disk for provenance; deactivate, do not delete |
| `scenarioImportService` | **C** | Its discipline (validate-all-then-write, dry run, upsert by code) is excellent and retained; every rule is rewritten for the new schema plus six-stage and asset validation |
| `sequenceGenerationService` | **D** (architecture **C**) | Pure-function shape and `relaxations[]` audit trail retained; all constraint logic replaced |
| `scoringService` | **D** | Per-answer → per-event |
| `Assessment` model | **D** | Splits into `Attempt` + `ScenarioRun` + `Event` |
| `assessmentService` | **C** | Resume idempotency, server-authoritative timing, `servedAt`-stamped-once and the 404-not-403 ownership check all carry forward; the answer/scoring path is replaced |
| Assessment API routes | **C** | `POST /`, `GET /active`, `GET /:id`, `GET /` survive in shape; `POST /:id/answers` becomes an event/transition endpoint; add `GET /:id/result` |
| `listCompletedAssessments` / History API | **B** | Add score and trend once scoring exists; no structural change |
| `HistoryPage` | **B** | Same |
| `AdminPage`, `AdminLoginPage`, `RequireAdmin`, `adminApi` | **B** | The auth shell is reusable; all admin *features* are **E** |
| `DashboardPage` | **D** | Becomes the orchestrator shell — 15.12 |
| `AssessmentPage` | **D** | Becomes a stage-driven runtime host |
| `ScenarioContainer` | **B** | Resize to 390×844 |
| `PhoneSimulator` | **C** | Stage-aware and event-emitting |
| `WhatsApp` / `Instagram` / `Sms` / `Email` renderers | **C** | 15.13 |
| `GenericRenderer` | **A** | Fallback |
| `DecisionPanel` | **F** | The model does not exist in the spec |
| `AssessmentHeader` | **C** | Stage progress plus elapsed time |
| `components/ui/*`, `components/layout/*`, `styles/index.css`, `utils/cn` | **A** | The design system is sound and token-driven |
| `SimulationBadge` / `AppHeader` training marker | **B** | Extend into the persistent rail plus notification bar |
| `apiClient`, `authApi`, `assessmentApi` | **B** | Transport is fine; endpoints change |
| `LoginPage` | **B** | Add masked-number display and the five required states; correct validation to 3–24 alphanumeric plus hyphen |
| `BriefingPage` | **B** | Add versioned acknowledgement plus timestamp persistence |
| `backend/src/constants/assessment.js` | **C** | `CHANNELS` survives; `ASSESSMENT_COMPOSITIONS`, `MARKS`, `PERFORMANCE_BANDS`, `JUDGEMENTS`, `INTERACTION_TYPES`, `SCENARIOS_PER_CHANNEL`, `SCREEN_KINDS`, `BLOCK_TYPES` are all superseded |
| `docs/QUESTION_ENGINE_DESIGN.md` | **C** | 15.19 |
| Backend tests | **C** | `password.test.js`, `adminThrottle.test.js`, `prompt.test.js` keep; `scoring.test.js`, `sequenceGeneration.test.js`, `assessmentSummary.test.js` are rewritten with their subjects |
| `validateApi.js` / `validateAdminApi.js` | **C** | The harness is reusable; the assertions are rewritten |
| Simulation primitives (browser, file viewer, QR, call, Trusted Directory, action sheet, toasts, rationale, clock) | **E** | All new |
| Event ledger, state-machine runtime, results engine, remediation, scenario manager, attempt viewer, exports, audit log | **E** | All new |

## 15.17 Migration strategy

**Principle: additive and parallel, not big-bang.** New collections are built alongside
the old, the new runtime is exercised end to end on real client content, and only then is
the old path retired. At no point is the working candidate journey deleted before its
replacement passes acceptance.

1. **Database.** New collections: `scenariodefinitions`, `attempts`, `scenarioruns`,
   `events`, `progresssnapshots`, `auditlogs`. Leave `scenarios`, `assessments`,
   `candidates` and `adminusers` untouched during the build.
2. **Identity.** `Candidate` is **extended in place**, not replaced — it already holds the
   normalized key and `seenScenarios`. Add `service_no_masked` (derivable),
   `briefing_version` and `last_seen_at`; a one-time backfill computes the mask. This
   preserves existing learners and their history. The rename to `LearnerProfile` is
   conceptual and documented; renaming the Mongoose model is optional and worth less than
   preserving data.
3. **Scenario content.** Author the 100 JSON records against the new schema, validate with
   a dry-run importer, import into `scenariodefinitions`. Then set `isActive: false` on
   all 40 legacy `scenarios`. The files stay on disk.
4. **Schema evolution.** `ScenarioDefinition` carries a `schema_version`; the importer
   refuses records from an unknown version. Publication is versioned and append-only
   audited.
5. **API compatibility.** No external consumers exist, so a compatibility shim would be
   waste. Old endpoints stay live and untouched until the new runtime passes acceptance,
   then are removed in one deliberate task.
6. **Frontend.** Build the new orchestrator and runtime behind a route (for example
   `/sim`) alongside the existing `/dashboard` and `/assessment`. Swap the default route
   only at cutover. The design system, session context, guards and API client are shared,
   so this is cheap.
7. **State machine.** New from the start; nothing to migrate.
8. **Event ledger.** New from the start. Old `interactions[]` data is not migrated — it
   was never scored and is not comparable.
9. **Scoring.** A new service. The old one is deleted with the old `Assessment` model, not
   before.
10. **History.** Old completed assessments remain readable and keep `scoringPending: true`
    permanently — they are genuinely not comparable to new attempts. **This is exactly
    what §7's "compare only when mode and content version are comparable" requires**, so
    the honest thing and the specified thing coincide.
11. **Admin.** Auth is untouched. New modules are added behind the existing `requireAdmin`.
    The "no write endpoint under this namespace" comment in `adminRoutes.js` becomes wrong
    once the scenario manager lands and must be revised at that point.
12. **Testing.** Unit tests per engine (selection, scoring, state machine); integration
    tests for resume and idempotency; the acceptance matrix in 15.20 as the release gate.
13. **Rollback.** Every phase is additive, so rollback is "stop using the new route". The
    only destructive step is deactivating the 40 legacy scenarios (step 3), reversible by
    flipping `isActive`. Take a `mongodump` before cutover.

## 15.18 New authoritative development roadmap

**This roadmap replaces Section 13.** It is dependency-ordered; each phase must complete
before the next begins unless marked parallel.

### PHASE 0 — Specification alignment (this task)
`ALIGN-001` read and verify the full PDF · `ALIGN-002` audit the repository ·
`ALIGN-003` conflict and reuse analysis · `ALIGN-004` record everything here.
**Exit:** this section reviewed and approved by the user. **COMPLETE — awaiting review.**

### PHASE 1 — Scenario data architecture
**Objective:** a schema that can hold the client's 100 scenarios losslessly.
- `DATA-001` Design `ScenarioDefinition` (identity, classification, synthetic content,
  six stages, scoring, feedback, assets, quality), with the server-only vs learner-visible
  field split. Must carry `family` and `trigger` (client, verbatim) plus
  `canonical_family`, `canonical_triggers`, `taxonomy_version` and
  `trigger_taxonomy_version` per 15.23 and 15.24, and the persistence constraints in
  **15.25 §10** (separate `Event` collection, unique `(run_id, sequence)`, unique
  `intent_key`, `ScenarioRun` as scoring source of truth, derived `Attempt` rollup).
  **No longer blocked** — questions 10, 11 and 20 are all resolved.
- `DATA-002` Rewrite the importer: six-stage validation, asset-reference validation,
  event-code validation, reserved-domain enforcement, dry run, versioned publication.
- `DATA-004` Author 2 reference scenarios (1 malicious, 1 legitimate) end to end as the
  schema proof. *Do this before `DATA-003`.*
- **Affects:** `models/`, `services/scenarioImportService.js`, `constants/`, `data/`.
  **DB:** new `scenariodefinitions`. **Frontend:** none. **Complexity:** M.
- **Exit:** two client scenarios import, validate and round-trip losslessly.

### PHASE 2 — Attempt, run and event data model
- `EVENT-001` `Attempt`, `ScenarioRun` and `Event` models; unique `(run_id, sequence)`;
  idempotency keys; metadata allowlist.
- `EVENT-002` Transactional commit strategy — **unblocked**; build to 15.25 (`withTransaction`
  envelope, retry policy, `E11000` duplicate path, startup topology guard, `{w:1, j:true}`,
  resync response, resume algorithm).
- **DB:** new `attempts`, `scenarioruns`, `events`. **Complexity:** M–L.
- **Exit:** an event can be appended exactly once under retry, and a partially written run
  recovers to its last committed state.

### PHASE 3 — Six-stage runtime (server)
- `ENGINE-001` State-machine executor: entry conditions, allowed transitions, event
  emission, per-stage scoring hooks, resume.
- `ENGINE-002` Run lifecycle API (start run, post intent, get current stage, resolve).
- **Depends on** Phases 1–2. **Complexity:** L. **Highest architectural risk.**
- **Exit:** a scenario is driven Notify → Resolve entirely server-side by an integration
  test, producing a correct ledger with no duplicate events on replay.

### PHASE 4 — Selection engine
- `SELECT-001` Seeded deterministic PRNG plus seed persistence.
- `SELECT-002` Constraint solver: 8+2, legitimate platform diversity, 3/3/2/2 rotation,
  3E/4M/3H, 2–4 military, ≥5 triggers, family ≤2, recent-20 exclusion.
- `SELECT-003` Relaxation ladder plus audit trail.
- **Replaces** `sequenceGenerationService.js`. **Complexity:** M — *feasibility is already
  proven against the real bank (15.7)*.
- **Exit:** 10 000 generated attempts satisfy every constraint, and the same seed
  reproduces the same sequence exactly.

### PHASE 5 — Scoring engine
- `SCORE-001` Event-code → point-delta table (all 16 codes from 15.10).
- `SCORE-002` Per-scenario 0–10 clamp, attempt 0–100, safe/unsafe path classification,
  critical-failure and false-positive marking.
- `SCORE-003` Score persistence on `ScenarioRun` and `Attempt`.
- **Complexity:** M.
- **Exit:** automated tests cover the safe path, **every** critical unsafe action,
  false-positive penalties and 0–10 clamping — a named client acceptance criterion.

### PHASE 6 — Shared simulation primitives (frontend) — *parallelisable with Phases 3–5*
- `UI-001` Simulation shell (390×844 within a responsive desktop frame) plus the
  persistent training rail
- `UI-002` Notification system: toast tray (max 3), badges, deep-link, dismiss-logs-event
- `UI-003` Safe browser mock · `UI-004` File viewer · `UI-005` QR inspector ·
  `UI-006` Call/voice screen · `UI-007` Trusted Directory · `UI-008` Action sheet plus
  verification-source chooser · `UI-009` Rationale input · `UI-010` Stage progress plus
  the client-side event dispatcher · `UI-011` Local clock, sound and connection indicators
- **Complexity:** L.
- **Exit:** every primitive is demonstrable in isolation with containment verified — no
  navigation, no network, no host handler.

### PHASE 7 — Platform experiences
- `UI-020` WhatsApp · `UI-021` Instagram · `UI-022` Email · `UI-023` SMS — each refactored
  onto the primitives with its platform-specific surfaces (15.13).
- **Depends on** Phases 3 and 6. **Complexity:** L.

### PHASE 8 — Client 100-scenario import
- `DATA-003` Author all 100 records from the PDF in four platform batches, each with
  automated structural validation and human content review.
- `DATA-005` Deactivate the 40 legacy scenarios.
- **Depends on** Phases 1, 3 and 7, so that authoring is validated against a runtime that
  can actually play a scenario. **Complexity:** XL — *the largest single item in the plan.*
- **Exit:** 100 active scenarios; 25 per platform; totals match the documented mix; every
  scenario is completable on the safe path.

### PHASE 9 — Dashboard / orchestrator
- `UI-030` Orchestrator shell, profile chip with masked number, progress card
- `UI-031` Notification scheduling (1–4 s after idle), queue state, Resume
- `UI-032` App tiles with badges, previews and status dots; benign background content for
  wrong-app navigation
- **Complexity:** M–L.
- **Exit:** badge, toast, app list, thread and backend state stay synchronized under
  interruption and retry.

### PHASE 10 — Results, feedback, history, comparison, remediation
- `RESULT-001` Results engine (breakdowns, missed-threat vs false-positive, path replay)
- `RESULT-002` Results UI · `RESULT-003` `ProgressSnapshot` plus comparison gated on mode
  and content version · `RESULT-004` Remediation (2–3 scenarios from weak families) ·
  `RESULT-005` History evolution (score, trend, exposure count)
- **Complexity:** M–L.

### PHASE 11 — Admin / instructor
- `ADMIN-001` Scenario manager (create / edit / clone / deactivate, versioning, six-stage
  and asset validation before publish) · `ADMIN-002` Attempt viewer · `ADMIN-003` CSV/PDF
  offline export · `ADMIN-004` Controls (reset an incomplete attempt, archive a profile,
  feedback-timing configuration) · `ADMIN-005` Append-only audit log
- **Depends on** Phases 1–10. **Blocked on** question 18 (scope) and question 19 (PDF).
- **Note:** `ADMIN-005` should land first within this phase — the audit log must exist
  before the scenario manager writes anything.

### PHASE 12 — Offline, security and accessibility hardening
- `SAFE-001` Enforced deny-by-default network boundary (CSP plus Electron handlers) ·
  `SAFE-002` Asset and domain audit (reserved domains, inert files) · `SAFE-003` Privacy
  allowlist audit · `A11Y-001` Full accessibility audit against the six criteria ·
  `PKG-001` Electron packaging

### PHASE 13 — Acceptance testing
- `TEST-001` … `TEST-008` — the acceptance matrix in 15.20, executed as the release gate.

## 15.19 Documentation changes required

**`docs/QUESTION_ENGINE_DESIGN.md` — not rewritten in this task, by instruction.** It must
be updated during Phase 1. Sections requiring change:

| Section | Change |
|---|---|
| 1.1 Product shape | Quiz → six-stage interactive simulation |
| 2 Scenario schema | Replace entirely with `ScenarioDefinition` plus Appendix A |
| 3 Phone simulation model / 3.2 Recorded interactions | Screen graph → stage machine. **"Interactions are recorded for interest only, never scored" is now false and must be removed** |
| 4 Assessment schema | Split into `Attempt` / `ScenarioRun` / `Event` |
| 5 Candidate schema | Extend to `LearnerProfile`; `seenScenarios` becomes the recent-20 source |
| 6.1 Channel mix | Floor-of-2 → rotating 3/3/2/2 |
| 6.2 Legitimacy mix | 6+4 / 7+3 / 8+2 → **8+2 only** |
| 6.3 Algorithm / 6.4 Relaxation | Rewrite for the full constraint set plus the stored seed |
| 7 Exhaustion and repetition | Add the recent-20 window rule |
| 8 API design | Answer endpoint → event/transition endpoints; add the result endpoint |
| 9 Timing | Add server-authoritative `elapsed_ms` and the 1–4 s orchestrator delay |
| 10 Security boundaries | Add the deny-by-default network boundary as an enforced control |
| 11 Scoring (11.1–11.4) | **Entirely superseded** by client §5 — mark and replace |
| 12 EVI handling | Reconcile with the client trigger vocabulary (question 11) |
| 14 Open decisions | Replace with 15.14 |
| New sections needed | State machine, event ledger, selection engine, scenario authoring, renderer and primitive architecture |

Changelog sections 16–24 are history and must be preserved.

**Other files.** `Final MCTE Proposal.docx` and `Project_Proposal.docx` are commercial
documents describing 40 scenarios, per-channel scoring and a statistics-only admin panel.
They are **not** regenerated as part of this alignment; the scope deltas in questions 17,
18 and 19 should be raised with the client first. `build_proposal.py` is untouched.

## 15.20 Acceptance strategy

Derived from the client's release acceptance checklist (§6) and expanded per area.

**CONTENT** — 100 active scenarios · 25 per platform · 8E / 9M / 8H per platform · 80
malicious plus 20 legitimate · six stages each · exact client definitions preserved (ID,
title, platform, level, disposition, family, trigger, military flag, all six stages,
end-state, feedback) · scoring events present · totals match the documented mix.

**SELECTION** — exactly 10 · 8 malicious plus 2 legitimate · the 2 legitimate from
different platforms · 3E / 4M / 3H · 3/3/2/2 rotation · 2–4 military · at least 5 triggers
· no family more than twice · recent-20 exclusion honoured where possible · relaxation
only when genuinely impossible, and audited · the same seed reproduces the same sequence ·
no adaptive difficulty mid-attempt.

**STATE** — all six stages reachable and correctly gated · only legal transitions accepted
· close and reopen resumes at the last committed state · no duplicate events · no skipped
events · abandonment is resumable.

**EVENTS** — every emitted code is on the allowlist · strictly increasing per-run sequence
· timing recorded · idempotent under retry · server authority over `sequence` and
`elapsed_ms` · metadata restricted to the allowlist.

**SCORING** — every one of the 16 event codes scores exactly as specified · per-scenario
clamp 0–10 · attempt total 0–100 · the safe path scores exactly 10 · **every** critical
unsafe action tested · false-positive penalties tested · the score is reproducible by
replaying the ledger.

**RESULTS** — total plus per-scenario points · platform / family / trigger / action-stage
breakdowns · missed threat distinguished from false positive · path replay renders and
contains no typed secrets · per-case feedback complete · progress comparison only when
mode and content version match · remediation names 2–3 scenarios from weak families.

**OFFLINE** — with the network disabled, all 100 scenarios, assets, reports and feedback
work · the network monitor shows **zero** outbound attempts.

**SAFETY** — no real password / OTP / PIN / payment / biometric field anywhere · no real
dialer · no DNS resolution · reserved and training domains only · inert files, no macro
extraction, no archive mounting, no host handler invocation · camera and host clipboard
disabled · the Trusted Directory cannot be populated from message-supplied contact data.

**RECOVERY** — close and reopen mid-scenario · no duplicate scoring · no duplicate events ·
the attempt is preserved atomically before feedback is displayed.

**ACCESSIBILITY** — keyboard-only completion of a full attempt · visible focus everywhere ·
readable contrast · labelled controls · 200% zoom without loss · no colour-only meaning.

**PRIVACY** — training records stay local · the profile holds only the permitted fields ·
none of the prohibited fields exist · logs use the event allowlist · exports are explicit
and local.

**CONSISTENCY** — badge, toast, app list, thread and backend state remain synchronized
under interruption and retry.

## 15.21 Current next task, and what must not be started

> **SUPERSEDED BY 15.43, then 15.44, then 15.45.** The 7 September 2026 acceptance audit
> re-derived the remaining work from the authoritative specification itself, **15.44** closed
> its one blocker and **15.45** closed the dashboard gap. Read **15.45** for the current task
> list; the paragraphs below are retained as history.

**NEXT TASK: `LOGIN-001`** (15.45). `UI-004` is complete and specification section 3 is
closed; `ACCEPT-002` is complete and the acceptance blocker is resolved; the instructor half
of specification section 6 is complete.

`ADMIN-006` (**15.42**) is **complete**: the instructor frontend for all five backend
capabilities - scenario manager, attempt viewer, offline exports, instructor controls and the
audit log - verified end to end in a real browser against a throwaway database. No backend
file was changed and no API mismatch was found.

`ADMIN-004` (**15.41**) is **complete**, and with it the whole instructor half of
specification section 6. An instructor can reset an incomplete attempt (to the `abandoned`
state the lifecycle already declared, deleting nothing), archive a learner profile (three
additive fields, no deletion, no unarchive) and configure training-versus-assessment
feedback timing (two enum fields), each committing with its ADMIN-005 audit entry in one
transaction.

`ADMIN-003` (**15.40**) is **complete**: one attempt exports as a marked, versioned CSV or
PDF, written to a controlled local export directory and recorded as `EXPORT_CREATED`. Both
formats render from one report model built on `buildAttemptResult()`, and no dependency was
added - the CSV and PDF writers are in-repo.

`ADMIN-002` (**15.39**) is **complete**: an authenticated instructor can list attempts
filtered by learner and date, and open any one of them - completed or in progress - to see
scores, the action path, the behaviour breakdown, remediation and a comparison, with no
typed learner content, no raw event data and no audit entry written. It reuses
`buildAttemptResult()` as the single authoritative result rather than computing a second one.

`ADMIN-001` (**15.38**) is **complete**: scenarios can be created, edited, cloned,
published and deactivated through an authenticated admin API, with a published version
never rewritten and every publication and deactivation recorded in the ADMIN-005 audit log
inside its own transaction.

`ADMIN-005` (**15.37**) is complete and now has its first real writers.

The candidate journey has been finished end to end since `UI-003` (**15.36**). What remains
from the client specification is the instructor half of section 6, and the audit foundation
means the order is now unblocked:

- ~~`ADMIN-001` scenario manager~~ - **done, 15.38**;
- ~~`ADMIN-002` attempt viewer~~ - **done, 15.39**;
- ~~`ADMIN-003` offline CSV/PDF export~~ - **done, 15.40** (controlled local export
  directory; the native instructor-selected path needs a desktop layer that does not exist);
- ~~`ADMIN-004` instructor controls~~ - **done, 15.41** (`immediate` feedback timing is
  recorded as policy but not yet enforced - no server surface releases feedback
  mid-attempt);
- ~~`ADMIN-006` instructor frontend~~ - **done, 15.42** (the scenario-id capacity limit is
  surfaced in the UI, deliberately not patched).

Question 18 - admin commercial scope - is still the one open alignment question and gates
how far the admin surface goes.

`DATA-001` (**15.26**), `DATA-002` (**15.27**) and `ENGINE-001` (**15.28**) are
**complete**. All 100 client scenarios are imported, active and validated, and the
server-authoritative six-stage engine runs them end to end. The legacy 40-scenario
pipeline is untouched and still green.

The one content gap left by `DATA-002` is **closed**:

- **`synthetic.assets` / `asset_refs` were empty** — the specification describes assets in
  prose, not as records. `DATA-003` (**15.32**) structured them: 511 assets across all 100
  scenarios, every stage reference resolving, so engine intents can now carry a real
  `synthetic_target_id`. Anything outside the pinned definition's own assets is still
  rejected.

**`expected_actions` turned out not to be needed.** ENGINE-001 derives transition legality
from the per-stage `scoring` list, which is imported client data, so no per-scenario
action list had to be invented. If a later task populates `expected_actions` it will be a
refinement, not a dependency.

The client's prose is preserved in full in `evaluation.stages[].learner_flow`.

**Phase 0 alignment is complete.** All three blocking questions are resolved:
`ALIGN-005a` (Q10, attack-family taxonomy — 15.23), `ALIGN-005b` (Q11, trigger taxonomy
and the EVI retirement — 15.24) and `ALIGN-005c` (Q20, deployment topology and transaction
strategy — 15.25). Design records: `docs/ATTACK_FAMILY_TAXONOMY.md`,
`docs/TRIGGER_TAXONOMY.md`, `docs/DEPLOYMENT_AND_TRANSACTION_STRATEGY.md`.

**`DATA-001` is unblocked by every open question.** It must incorporate the taxonomy fields
from 15.23 / 15.24 and the persistence constraints from 15.25 §10.

Status of the questions that were blocking:

1. ~~**Question 10 — attack-family taxonomy.**~~ **RESOLVED 4 September 2026** — see 15.23.
   No longer blocks `DATA-001` or `SELECT-002`.
2. ~~**Question 11 — trigger vocabulary and its relationship to EVI.**~~ **RESOLVED
   4 September 2026** — see 15.24. `DATA-001` is **no longer blocked by any open question.**
3. ~~**Question 20 — deployment topology and MongoDB transactions.**~~ **RESOLVED
   4 September 2026** — see 15.25. `EVENT-002` is no longer blocked.
4. **Question 18 — admin scope increase. STILL OPEN.** The only remaining open question.
   It blocks **Phase 11 only**, not Phases 1–10, so it does not gate `DATA-001` or any
   implementation work now in scope. Admin deliverables must be presented as
   *scope confirmation required* until it is settled.

Also copy the specification PDF into the repository.

**Then, in order:** `DATA-001` (schema) → `DATA-002` (importer) → `DATA-004` (two
reference scenarios). Phase 6 (`UI-001` and `UI-002`) may start in parallel — it depends
on the design system, not on the data model.

**MUST NOT BE STARTED:** `FE-014` / `BE-005b` admin statistics · `BE-003` old scoring
aggregation · `FE-012` result screen · any new channel-renderer feature · any new scenario
in the old schema · any extension of `sequenceGenerationService` · any change to History.

## 15.22 Recovery / handoff notes

A fresh session should read Sections 1–14 for history, then **this section for current
truth**, then open the specification PDF, and only then inspect the code before changing
anything.

**Ground truths for a fresh session.**

- **Nothing in Section 15 has been implemented.** The repository is exactly as Section 10
  describes it, plus BE-005a.
- The running application still works: login → briefing → dashboard → a 10-question mixed
  assessment across 40 scenarios → completion → history. **Do not break it while building
  the replacement.** Migration is additive and parallel — 15.17.
- The 40 existing scenarios are placeholders on a superseded schema. They are retired in
  `DATA-005`, **deactivated not deleted**, and only after the new bank is verified.
- `Assessment.result` is still `null` and history still reports `scoringPending: true`.
  That is correct and stays correct until Phase 5.
- The frontend has **no** `href`, `window.open` or `fetch` outside `apiClient` — verified
  4 September 2026. Keep it that way.
- The scenario bank in the PDF is structurally complete: 100 scenarios, all six stages,
  end-states, feedback and scoring events present. **No scenario content may be invented,
  simplified, renamed, re-levelled or re-scored.** Where the PDF is ambiguous, flag it —
  see 15.14.
- Selection feasibility against the real bank is **proven, not assumed** — 15.7.

---

## 15.23 Canonical Attack-Family Taxonomy — RESOLVED (Question 10)

**Status:** RESOLVED 4 September 2026 · `ALIGN-005a` · **IMPLEMENTATION DECISION**
**Full design record and complete 100-scenario mapping:** [`docs/ATTACK_FAMILY_TAXONOMY.md`](docs/ATTACK_FAMILY_TAXONOMY.md)
**Taxonomy version:** `1.0.0`

> ### ⚠ THIS IS OUR IMPLEMENTATION DECISION — NOT A CLIENT REQUIREMENT
>
> The client specification does **not** define a canonical attack-family taxonomy. It
> supplies a free-text `Attack / case family` label per scenario, plus the §5 selection
> rule *"no attack family more than twice"*.
>
> This taxonomy was derived by the implementation team so that rule can function. It
> **must never be represented to the client as a client-specified requirement**, quoted
> back as though it came from the PDF, or used to justify any change to scenario content.
> If the client later supplies their own taxonomy, it replaces ours wholesale as
> `taxonomy_version` 2.0.0.

### Why the decision was needed

The bank contains **99 distinct `family` strings across 100 scenarios** (only *Task/job
scam* repeats, at `W17` and `S13`). This was quantified rather than assumed. Across
**20,000** randomly generated attempts already satisfying every other selection constraint:

| "Max 2 per family" applied to | Draws rejected |
|---|---|
| **Raw client `family` string** | **0 of 20,000 — 0.0000%** |
| **Derived `canonical_family`** | **2,741 of 20,000 — 13.71%** |

The client's own constraint is **provably inert** against the raw label. The canonical
label makes its evident intent — that one attempt should not be eight variations of the
same attack — actually enforceable.

### The decision

1. The client's `family` value is **preserved verbatim and never overwritten**, in its own
   field. It remains authoritative client content.
2. A **separate** `canonical_family` field is added as implementation metadata.
3. Every one of the 100 scenarios maps to **exactly one** canonical family.
4. `canonical_family` drives the **selection constraint** (max 2 per attempt) and the §7
   **attack-family results analytics** and remediation.
5. The mapping is a **versioned data artifact**, not code — `DATA-002` materialises it as
   `backend/data/attack-family-taxonomy.v1.json`. It must never become a switch statement
   inside selection logic.
6. Every scenario record carries `family`, `canonical_family` and `taxonomy_version`, so
   any historical attempt stays auditable and re-derivable.
7. `canonical_family` is **server-only** — never sent to a learner, since it would reveal
   the attack type. Same guard as `level`, `disposition` and `trigger`.
8. **Re-mapping is a versioned event.** Any change to an assignment requires a new
   `taxonomy_version`; attempts keep the version they were selected under. This is what
   makes §7's "compare only when mode and content version are comparable" enforceable for
   family analytics.

### Classification axis

The canonical family is the **underlying attack mechanism** — what the adversary builds or
does, and therefore **the single defence skill that defeats it**. Two scenarios share a
family when defeating them requires the same recognition and the same response.

**Not classification inputs** (each is already its own dimension with its own constraint):
platform, psychological trigger, military context, difficulty, disposition.

**Two axes deliberately rejected as families**, because §1 makes them *difficulty*
determinants — difficulty reflects "cue quality, premise alignment, **sender familiarity**
and number of verification steps":

- **Compromised-vs-spoofed sender** (`W09`, `W18`, `W25`, `I15`, `I23`, `E18`, `E25`,
  `S18` vs `W20`, `E10`, `I04`). `E18` and `W20` are the same risk pattern — redirecting an
  existing payment relationship — and are graded Hard precisely because the sender looks
  genuine.
- **Synthetic media** (deepfake `I09`, cloned voice `W15`/`E22`, morphed image `I17`) — a
  cue-quality property, not a mechanism.

**One deliberate, documented exception:** `qr_code_phishing`. QR is strictly a delivery
vector, but the specification mandates a dedicated QR inspector (§4) whose purpose is to
"show the full synthetic target before an Open choice". No other delivery vector has its
own mandated tool or its own inspection habit.

### The 19 families

**Malicious (80):** `operational_elicitation` (10) · `financial_credential_phishing` (9) ·
`payment_diversion` (7) · `account_takeover_authorisation_abuse` (6) ·
`tech_support_and_callback_fraud` (6) · `credential_phishing` (6) ·
`identity_data_harvesting` (5) · `qr_code_phishing` (5) · `investment_and_task_fraud` (5) ·
`malware_delivery` (5) · `unsolicited_payment_lure` (5) · `coercion_and_extortion` (4) ·
`impersonation_emergency_payment` (3) · `relationship_grooming_fraud` (3) ·
`disinformation_amplification` (1)

**Legitimate (20):** `legit_system_confirmation` (7) · `legit_coordination_request` (6) ·
`legit_routine_broadcast` (6) · `legit_verified_high_risk_change` (1)

Legitimate items are classified by what the learner must correctly *accept*, so
false-positive analytics is meaningful. Since exactly 2 legitimate scenarios are drawn per
attempt, max-2 can never bind there — those families exist for analytics only.

### Validation

| Check | Result |
|---|---|
| Scenarios considered / mapped to exactly one family | **100 / 100** |
| Client `family` strings or scenario content altered | **none** |
| Feasible across all six 3/3/2/2 allocations | **0 failures** |
| Feasible with a recent-20 exclusion window | **0 failures / 200 trials** |
| Feasible with two attempts of realistic history excluded | **0 failures / 200 trials** |
| Distinct canonical families per attempt | min 6, **mean 8.4**, max 10 |
| Malicious families spanning ≥2 platforms | **14 / 15** (only the singleton is single-platform) |
| Malicious families containing military scenarios | **8** → up to 16 military obtainable vs the 2–4 required |

**Not a proxy for another axis.** 14 of 15 malicious families span 2–4 platforms;
difficulty is mixed within families; six malicious families mix military and
non-military scenarios.

**One honest correlation, recorded rather than hidden.** `operational_elicitation` (10)
and `identity_data_harvesting` (5) are 100% military-context. That is a property of the
client's content — military-context attacks in this bank are predominantly
elicitation-shaped — not a taxonomy artifact. It does not constrain selection, because
military scenarios span eight malicious families.

### Notable classification rulings

Full table of 19 edge cases in `docs/ATTACK_FAMILY_TAXONOMY.md` §6. The ones most likely
to be queried:

- `W10` device-link QR → `account_takeover_authorisation_abuse`, not `qr_code_phishing`:
  the QR is the carrier; approving a Linked Devices session is the decisive act.
- `E23` HTML smuggling → `malware_delivery`, not `credential_phishing`: the habit is not
  trusting a locally-rendered HTML attachment.
- `W09` / `E09` gift cards → `payment_diversion`: both exploit an existing workplace
  relationship to redirect spend.
- `I20` researcher rapport → `operational_elicitation`, not `relationship_grooming_fraud`:
  there is no financial ask, so the elicitation refusal is the decisive defence.
- `I19` is a deliberate **singleton**. "Verify before amplifying" is genuinely distinct
  from refusing a direct question, and per the rule against collapsing distinct mechanisms
  merely to shrink a taxonomy it was retained. Being a singleton it can never bind the
  max-2 rule; it is kept for analytics value.
- `S23` UPI collect reversal → `financial_credential_phishing` is the **weakest fit** in
  the taxonomy — the only member with no fake *branded* page. Flagged for review if a
  `payment_authorisation_literacy` family is ever justified.

### Consequences for the roadmap

- `DATA-001` — schema carries `family` (verbatim), `canonical_family`, `taxonomy_version`;
  `canonical_family` is server-only. **No longer blocked by question 10.**
- `DATA-002` — importer reads the taxonomy artifact and **fails the import** if any
  scenario does not resolve to exactly one canonical family.
- `SELECT-002` — applies max 2 per `canonical_family`, reading the artifact.
- `RESULT-001` / `RESULT-004` — attack-family breakdown and weak-family remediation both
  key off `canonical_family`.
- Risk **R5 is closed**. Residual risk: the taxonomy is ours, not the client's, so a
  future client taxonomy forces a re-map — bounded by the versioning rule and by the
  preserved client `family` field.

### Acceptance criteria added

- 100 / 100 scenarios resolve to exactly one canonical family; an unmapped scenario fails
  the import.
- The client `family` string round-trips byte-identical through import and export.
- Every generated attempt satisfies max 2 per `canonical_family`.
- Every persisted attempt records the `taxonomy_version` it was selected under.
- `canonical_family` never appears in any learner-facing payload.

---

## 15.24 Canonical Trigger Taxonomy and the EVI Decision — RESOLVED (Question 11)

**Status:** RESOLVED 4 September 2026 · `ALIGN-005b` · **IMPLEMENTATION DECISION**
**Full design record and complete 100-scenario mapping:** [`docs/TRIGGER_TAXONOMY.md`](docs/TRIGGER_TAXONOMY.md)
**Trigger taxonomy version:** `1.0.0`

> ### ⚠ THE VOCABULARY IS OURS — THE THRESHOLD IS THE CLIENT'S
>
> The client supplies a free-text `Primary trigger` string per scenario and the §5 rule
> *"At least five psychological triggers"*. It defines **no** vocabulary, no decomposition
> rule and no definition of what counts as one trigger.
>
> The canonical vocabulary and decomposition rule are **derived by the implementation
> team** and must never be represented to the client as a client-specified requirement.
>
> **The `>= 5` threshold IS the client's and is implemented exactly as written** — not
> raised, lowered or reinterpreted.

### Inventory of the raw field (independently re-extracted, 0 mismatches)

The field is exceptionally clean: no non-ASCII characters, no stray whitespace, and **zero
occurrences** of any alternative delimiter (`;` `,` `&` `/` `-` `" and "`). `+` is the only
composition delimiter and is always space-padded. `|` occurs exactly once in 35 scenarios,
always as the literal `FICTIONAL MILITARY CONTEXT`.

| Measure | Value |
|---|---|
| Distinct raw composite strings | **63** *(§15.14 q11 said "about 66" — corrected)* |
| Distinct raw primitives | **31** (confirmed) |
| Total primitive occurrences | 192 |
| Scenarios with 1 / 2 / 3 primitives | 12 / 84 / 4 |

**One trap found:** four primitives are multi-word — `expert status`, `social proof`,
`social validation`, `time pressure`. The importer must split on `+` **only**; a
whitespace fallback would shatter them.

### What counts as one trigger — decided empirically

Three readings, each applied to the same 20,000 draws already satisfying every other
settled constraint:

| Reading | Distinct per attempt (min/mean/max) | Rejected by `>= 5` |
|---|---|---|
| **A** whole composite string = one trigger | 6 / 9.56 / 10 | **0 of 20,000** |
| **B** each raw primitive | 4 / 11.40 / 17 | 1 of 20,000 |
| **C** each **canonical** trigger — **ADOPTED** | 4 / 10.83 / 17 | 1 of 20,000 |

**A is rejected**: its observed minimum is 6, so it is *mathematically incapable* of
falling below 5 — the client's rule could never bind. It also contradicts the plain meaning
of "psychological trigger" (*Fear + urgency* is two levers). **C is chosen over B** because
B counts obvious synonyms (`urgency` / `time pressure`) as different levers. A
"some composites atomic" variant was considered and rejected — no composite in the bank is
idiomatic; all 63 are plain conjunctions.

### The decision

1. The client's `trigger` string is **preserved verbatim**, suffix included. Never
   overwritten.
2. A derived `canonical_triggers` array is added as implementation metadata — **22 ids**
   folded from the 31 raw primitives.
3. **Decomposition rule:** partition once on `|` (right side is always the military marker
   and sets `military_flag`; anything else is an import error) → split left side on `+`
   (**never** whitespace) → trim, collapse whitespace, casefold → map through a **closed**
   alias table (an unlisted primitive is an import error, not a silent pass) →
   de-duplicate, preserving first-appearance order.
4. **Nine folds**, each a genuine synonym: `time pressure`→`urgency`;
   `anticipation`,`collaboration`→`routine`; `care`→`empathy`;
   `social validation`,`status`→`pride`; `isolation`+`secrecy`→`isolation_secrecy`;
   `duty`+`compliance`→`duty_compliance`; `shame`+`embarrassment`→`shame_embarrassment`.
   Deliberately kept apart: `trust`/`familiarity`, `urgency`/`scarcity`,
   `empathy`/`helpfulness`, `flattery`/`expert_status`, `routine`/`convenience`.
5. **Selection rule:** `len(union(canonical_triggers over the 10 scenarios)) >= 5`.
   **Distinct triggers, not occurrences** — the §5 heading is *Variety*, and counting
   occurrences would be satisfied by ten `authority` scenarios, the very outcome the rule
   exists to prevent. Occurrence counts are still recorded for §7 analytics.
6. `canonical_triggers` is **server-only**, like `level`, `disposition`, `family` and
   `canonical_family`. Revealing the lever would tell the learner what manipulation to
   expect.
7. `trigger_taxonomy_version` is stamped on each scenario **and** each `Attempt`.
   Re-mapping is a versioned event.
8. `military_flag` is derived from the same parse — one pass, two outputs.

### The 22 canonical triggers

`authority` 40 · `urgency` 27 · `routine` 19 · `fear` 18 · `greed` 11 · `curiosity` 10 ·
`empathy` 9 · `familiarity` 8 · `scarcity` 6 · `trust` 6 · `convenience` 5 ·
`isolation_secrecy` 5 · `pride` 5 · `flattery` 4 · `helpfulness` 3 · `reciprocity` 3 ·
`duty_compliance` 3 · `social_proof` 2 · `commitment` 2 · `shame_embarrassment` 2 ·
`expert_status` 2 · `confusion` 1

191 occurrences; no id unused. Per scenario: 13 have one, 83 have two, 4 have three.

**Consolidation changed exactly one scenario's count**, recorded rather than hidden: `I06`
(raw `Pride + social validation`) resolves to the single trigger `pride`, both halves being
the same esteem lever.

### Honest assessment: a floor, not a diversity driver

The `>= 5` rule rejects **1 draw in 20,000 (0.005%)**; attempts naturally yield a **mean of
10.83** distinct canonical triggers.

**This is materially different from the attack-family case.** There, the rule could *never*
bind (0 of 20,000) because label granularity was wrong, and we fixed the granularity. Here
the granularity is right and the observed **minimum is 4 — below the threshold** — so the
rule genuinely excludes the worst case. A floor that rarely fires is a correctly designed
floor, not a broken one.

**The threshold was not raised.** For decision support only: `>= 7` would reject 0.185%,
`>= 8` 1.41%, `>= 9` 6.56%, `>= 10` 19.4%, `>= 11` 41.8%. If an active diversity driver is
ever wanted, `>= 9` is where it starts doing real work — **but that is a change to a
client-specified value and must not be made unilaterally.**

### Feasibility (fixed seeds, actual bank, full constraint set)

| Test | Result |
|---|---|
| All six 3/3/2/2 allocations | **6 / 6 feasible** |
| Random recent-20 exclusion | **0 failures / 300 trials** |
| Realistic two-attempt history (16 mal + 4 legit excluded) | **0 failures / 300 trials** |
| Corner: exclude the 20 highest-trigger-frequency scenarios | feasible |
| Corner: exclude all 22 `authority`-triggered scenarios | feasible |
| Corner: exclude every scenario with a rare trigger (n ≤ 3) | feasible |
| Corner: exclude all 20 legitimate | **infeasible — expected, unreachable** (same case as 15.7) |

**Engineering finding — do not use rejection sampling.** Only **22–29 of 2,000** random
draws per allocation satisfy the combined constraint set (~1.2% yield, ~80 attempts per
success, worse under exclusions). `SELECT-002` must use constraint-directed construction
with backtracking. This is a property of the *combined* constraints, not the trigger rule.

### Interaction with the attack-family taxonomy (15.23)

The two dimensions are **near-independent** — trigger diversity is not a second family
constraint in disguise.

- Attempt-level correlation between distinct families and distinct triggers:
  **Pearson r = +0.106**.
- Military representation is **completely unaffected**: mean 3.101 military scenarios per
  attempt both before and after the trigger rule.
- `operational_elicitation` (10 members, the largest family) spans **10 distinct triggers**.

**Six families do imply a trigger** — one-way only, since each trigger appears widely
outside its family: `identity_data_harvesting`→`authority`,
`investment_and_task_fraud`→`greed`, `coercion_and_extortion`→`fear`,
`relationship_grooming_fraud`→`trust`, `impersonation_emergency_payment`→`empathy`+
`urgency`, `legit_system_confirmation`→`routine`. These are substantively correct
(extortion *is* fear-driven) and are recorded so the redundancy is not later mistaken for
a modelling error.

### EVI — RETIRED

**`EVI_CATEGORIES` and `evaluation.eviTags` are superseded and retired.** Canonical trigger
analytics replaces EVI entirely and strictly supersets it.

Four grounds:

1. **It measures the same construct, less faithfully.** EVI's seven categories cover only
   **9 of the 22** canonical triggers, conflate three pairs of distinct levers
   (`authority_fear`, `empathy_trust`, `routine_convenience`), and include
   `romance_attraction`, which is **not a lever at all** — it is an attack family
   (`relationship_grooming_fraud`) sitting on the wrong axis. **13 canonical triggers have
   no EVI equivalent**, including `isolation_secrecy` — the lever that most directly
   opposes the client's central `TRUSTED_VERIFY` defence. An EVI report could not surface
   susceptibility to "don't tell anyone" pressure.
2. **Provenance.** EVI comes from the *superseded draft* proposal. §12 item 15 already
   records that the approved proposal removed the EVI category table, and the new client
   specification never mentions EVI — it requires `trigger` (§6), trigger variety (§5) and
   a trigger breakdown (§7).
3. **Zero migration cost.** `eviTags` lives on the `Scenario` model, already classified
   **D — replace** in 15.16, and `QUESTION_ENGINE_DESIGN.md` §12 states *"EVI calculation
   is not implemented in BE-000."* No computed EVI data exists.
4. **The name conflicts with the client's own safeguards.** §5: *"Do not label a learner
   psychologically vulnerable from a single mistake."* §7: *"do not diagnose personality or
   emotional state."* An "Emotional **Vulnerability** Index" asserts exactly that framing.

**One point is deliberately left open, and it is the user's call, not the client's.** "EVI"
was a **user-chosen label** (1 September 2026), selected over the client PRD's own
"Manipulation Susceptibility Profile". Retiring the *model* is an engineering decision and
is made here. Keeping the *word* on the results screen is a naming decision.

- **Recommendation:** drop it, on the client's §5 and §7 safeguard grounds; title the §7
  section behaviourally, e.g. **"Trigger response profile"**.
- **If the user wants "EVI" kept**, it becomes a pure presentation alias over the canonical
  trigger breakdown — a section label, never a field, never a second taxonomy, never a
  selection input. Architecturally free.
- What must **not** happen is EVI surviving as a second, coarser taxonomy alongside
  triggers.

### Consequences for the roadmap

- `DATA-001` — schema carries `trigger` (verbatim), `canonical_triggers`,
  `trigger_taxonomy_version`; drops `eviTags`. **`DATA-001` is now unblocked by every open
  question** (10 and 11 both resolved).
- `DATA-002` — importer decomposes the raw string, derives `military_flag` from the same
  parse, and **fails the import** on an unknown primitive or an unexpected `|` suffix.
- `SELECT-002` — applies `>= 5` over `canonical_triggers`; **must not use rejection
  sampling**.
- `RESULT-001` / `RESULT-004` — §7 trigger breakdown and weak-trigger remediation replace
  the retired EVI profile.
- `SCORE-*` — unaffected. Triggers are a classification dimension, never a scoring input.
- **`FE-012`'s "EVI profile" scope item is superseded** — it becomes the trigger response
  profile.

### Acceptance criteria added

- All 100 scenarios decompose to ≥1 canonical trigger; unknown primitive or unexpected `|`
  suffix **fails the import**.
- The raw `trigger` string round-trips byte-identical.
- `military_flag` derived from the suffix totals 35 and matches each platform index page
  (WhatsApp 10, Instagram 12, Email 8, SMS 5).
- Every attempt satisfies `len(union(canonical_triggers)) >= 5`.
- Every attempt records `trigger_taxonomy_version`.
- `canonical_triggers` never appears in a learner-facing payload during an attempt.
- No `EVI_CATEGORIES` / `eviTags` reference survives into the new data model.

---

## 15.25 Deployment Topology and Transaction Strategy — RESOLVED (Question 20)

**Status:** RESOLVED 4 September 2026 · `ALIGN-005c` · **IMPLEMENTATION DECISION**
**Full design record:** [`docs/DEPLOYMENT_AND_TRANSACTION_STRATEGY.md`](docs/DEPLOYMENT_AND_TRANSACTION_STRATEGY.md)

> ### ⚠ OURS, NOT THE CLIENT'S
>
> The client requires transactional persistence (§5), offline containment (§1) and state
> recovery without duplicated points or skipped events (§6). **That is the requirement.**
> The topology, MongoDB configuration, transaction boundary and idempotency design below
> are **engineering decisions owned by us** and must never be presented to the client as
> client-specified infrastructure.

### Current state — measured, not assumed

The live installation was probed on 4 September 2026:

| Property | Observed |
|---|---|
| MongoDB | **8.3.7, standalone** — `hello.setName` and `hello.msg` both absent |
| Service | `mongod.exe --config "C:\Program Files\MongoDB\Server\8.3\bin\mongod.cfg" --service` |
| `net.bindIp` | **`127.0.0.1`** — already loopback-only |
| Storage | WiredTiger, `persistent: true` (single-document writes are already crash-durable) |
| `replication` config | **absent** |
| **Transaction probe** | **FAILED** — "This MongoDB deployment does not support retryable writes" |
| Mongoose | 9.9.4 (bundled driver has full transaction support) |
| Connection string | `mongodb://127.0.0.1:27017/…` — no `replicaSet` parameter |
| Backend | Single Express process; **`app.listen(port)` with no host → binds `0.0.0.0`** |
| Docker / Compose / Electron / deploy scripts | **none present** |

**R4 is therefore confirmed as fact, not suspicion: the client's "transactionally"
requirement cannot be met on the installation as it stands.**

### Decision

> **A single-node MongoDB replica set (`rs0`) on the same offline Windows machine**, with
> the member pinned to `127.0.0.1:27017`.

Three deliberate refinements keep the transaction small and the system correct regardless:

1. **The `Attempt` score rollup is derived, not transactional.** `ScenarioRun` is the source
   of truth for scoring; `Attempt.total_score` is an idempotently recomputed cache. A crash
   between a run committing and the rollup being written is **self-healing**. This removes a
   third document from the hot path.
2. **Idempotency does not depend on transactions.** Unique indexes plus a client-supplied
   intent key make the write path exactly-once whatever the topology. Transactions give
   atomicity; indexes give idempotency; neither substitutes for the other.
3. **A startup topology guard.** The API asserts it is connected to a replica set and
   refuses to serve otherwise, so a misconfigured install fails loudly instead of silently
   degrading to non-atomic writes.

### Topology

```
Single offline Windows machine
├── Electron shell (PKG-001, later)  — today: browser + Vite
├── Node/Express API, single process, port 5000
│     MUST bind 127.0.0.1 explicitly (change from today's 0.0.0.0 — R7/SAFE-001)
└── mongod, Windows service, single-node replica set "rs0"
      bindIp 127.0.0.1, port 27017, WiredTiger, journaled
```

| Question | v1 answer |
|---|---|
| Multiple concurrent clients | **Not supported.** One learner at a time; instructor uses the same machine |
| Multiple API instances | **Not supported** |
| Remote MongoDB | **Not supported in v1** |
| Cloud MongoDB (Atlas) | **Prohibited** — violates offline containment |
| MongoDB local-only | **Yes** — already correct, unchanged by the conversion |

Configuration: add `replication: {replSetName: rs0, oplogSizeMB: 512}`, restart the
service, then initiate **once**:

```js
rs.initiate({ _id: "rs0", members: [ { _id: 0, host: "127.0.0.1:27017" } ] })
```

> **Pinning the member to `127.0.0.1` is an offline requirement, not a preference.** A bare
> `rs.initiate()` defaults to the machine hostname; the driver then performs topology
> discovery against it, triggering **name resolution** — which can stall on a
> network-disabled machine and is exactly the kind of outbound lookup the §1 boundary
> exists to prevent.

Connection string gains `?replicaSet=rs0`; commits use **`{ w: 1, j: true }`** — `j: true`
is what makes an acknowledged commit durable across power loss.

### Transaction boundary

**Hot path — two documents only:**

```
BEGIN  (session, w:1 j:true)
  read   ScenarioRun (in session); assert status, expected_stage == current_stage,
         and that the stage transition is legal for this scenario
  insert Event { run_id, sequence = last_sequence+1, event_code, points_delta,
                 elapsed_ms (server-derived), synthetic_target_id,
                 metadata (allowlisted), intent_key }
  update ScenarioRun { current_stage, last_sequence, score_running, updated_at }
COMMIT
```

At stage 6 the same transaction also sets `status: 'resolved'`, `resolved_at`,
`score_0_10` (clamped) and `outcome_code`.

**Deliberately outside it:** `Attempt.total_score` (derived), `ProgressSnapshot` (derived),
the dashboard notification (not persisted state), and `seenScenarios` history (advisory
only — a lost write costs a slightly less-ideal future draw, never a scoring error).

**Attempt completion is a second transaction** that re-reads all ten runs, asserts
`attempt.status == 'in_progress'` as an idempotence guard, and **recomputes** the total
rather than accumulating it — so running it twice yields the same number and the guard makes
the second run a no-op.

**The notification gate:** commit succeeds → `status == 'resolved'` is durable → the
orchestrator may issue the next notification. Commit fails → no notification, and the
learner re-enters the same run on resume. This satisfies §5 literally.

### Idempotency

| Mechanism | Index / rule | Prevents |
|---|---|---|
| **Intent key** | unique on `Event.intent_key` (client UUID per action) | Duplicate scoring when a response is lost and the client retries |
| **Sequence uniqueness** | unique on `(run_id, sequence)` | Duplicate or interleaved events |
| **Stage assertion** | `expected_stage == current_stage`, inside the transaction | A stale client acting on a superseded view |

**Exactly-once effect, at-least-once delivery.** A duplicate `intent_key` raises `E11000`;
the handler reads the already-recorded event and returns **the original outcome**. Retries
are indistinguishable from the original and never double-score.

**Retry policy:** transient errors only (`TransientTransactionError`,
`UnknownTransactionCommitResult`), capped at 3 with jittered backoff. A logical rejection —
illegal transition, stale stage — is a client error and is **never** retried.

### Failure behaviour

All twelve required failure cases are analysed in the design record. The decisive one:

**"Backend crashes after the Event is written but before `ScenarioRun` is updated" —
cannot occur.** Both writes are one transaction; an uncommitted transaction is rolled back.
This is the case the standalone alternative could not eliminate, and it is the single
strongest reason for the decision.

Crash after the run commits but before the attempt rollup is **self-healing** by
recomputation. Power loss is covered by the WiredTiger journal plus `j: true`. Duplicates
and timeouts are covered by `intent_key`. Resume re-enters the first non-resolved run at its
committed stage and replays its events to reconstruct the UI.

**Residual risk (new, R10):** a single-node set has **no redundancy** — disk failure loses
the data, exactly as with today's standalone install. Mitigation is operational: a documented
cold backup (stop service, copy `dbPath`) in the install and handover runbook.

### Rejected alternatives

| Option | Why rejected |
|---|---|
| **Standalone + application-level compensation** | Its core idea — embedding a run's events so the hot path is one document — is genuinely sound, and a run's ~10–40 events would not have hit the growth problem. But it trades a **one-time, scriptable install step** for **permanent, recurring complexity**: every future multi-document operation (attempt completion, scenario publication with its audit entry, attempt reset, profile archive) needs bespoke compensation and its own reconciliation tests. Correctness would rest on our bookkeeping rather than the database. It also forfeits **retryable writes** — unavailable on standalone — which is precisely the safety net a "synchronized under interruption and retry" requirement wants. Embedded event arrays additionally make §7 path replay, the admin attempt viewer and cross-attempt analytics much harder to query |
| **Multi-node replica set** | No availability requirement; one machine cannot host a meaningful quorum; pure operational cost |
| **Remote / cloud MongoDB (Atlas)** | Directly prohibited by offline containment |
| **Switch to SQLite / PostgreSQL** | A good fit for a single-machine app in the abstract, but discards the entire Mongoose data layer, models, importer and tests that §15.16 deliberately preserves. Rejected on rework cost, not merit |

### Interaction with the network boundary (R7) — dependency only, not solved here

| Point | Finding |
|---|---|
| Does the conversion add network exposure? | **No.** `bindIp` stays `127.0.0.1`; no new port, socket or outbound connection |
| Does it introduce name resolution? | **Only if initiated carelessly** — pinning the member to `127.0.0.1` prevents it. A hard requirement |
| **New R7 finding** | The **Express API currently binds `0.0.0.0`**. On a networked machine the API and every training record behind it are reachable from the LAN. `SAFE-001` must bind `127.0.0.1` explicitly. **Discovered here, owned by R7, not fixed here** |
| Network-monitor acceptance test | Unaffected — loopback traffic is not outbound |

### Consequences for the roadmap

- **`DATA-001` is unblocked by every open question** and must incorporate 15.25 §10:
  separate `Event` collection (not embedded); unique `(run_id, sequence)`; unique
  `intent_key`; `points_delta` per event; `ScenarioRun` carrying `current_stage`,
  `last_sequence`, `score_running`, `score_0_10`, `status`, `outcome_code` and acting as the
  scoring source of truth; `Attempt.total_score` as a recomputed cache; `ProgressSnapshot`
  derived; ObjectId references rather than cross-collection embedding.
- **`EVENT-002` is unblocked** and builds the `withTransaction` envelope, retry policy,
  `E11000` duplicate path, startup topology guard, `{w:1, j:true}`, resync response and
  resume algorithm.
- **`PKG-001`** gains the replica-set initiation step and the cold-backup runbook.
- **`SAFE-001`** gains the loopback-binding fix for the API.
- **R4 closed. R10 opened** (single-node redundancy).

### Acceptance criteria added

- The API refuses to start against a standalone `mongod`.
- The RS member is `127.0.0.1:27017`; no hostname appears in the configuration.
- With all network adapters disabled, the stack starts and a full attempt runs end to end.
- Killing the API mid-scenario leaves no partial event/run state; resume returns the learner
  to the last committed stage.
- Replaying an identical interaction produces one event, one score change, an identical response.
- Hard process termination loses no acknowledged commit.
- Attempt completion run twice yields one completed attempt and one score.
- A cold backup and restore of `dbPath` reproduces a working installation.

---

## 15.26 DATA-001 — ScenarioDefinition Schema (COMPLETED 4 September 2026)

**Status:** COMPLETED · Phase 1, task 1 of 3
**Design record:** [`docs/SCENARIO_DEFINITION_SCHEMA.md`](docs/SCENARIO_DEFINITION_SCHEMA.md)
**Scope:** schema and validation groundwork only — no importer, no engine, no migration.

### Files created

| File | Purpose |
|---|---|
| `backend/src/constants/scenarioDefinition.js` | Vocabularies: platforms, levels, dispositions, ID pattern, 19 canonical families, 22 canonical triggers, six stage keys, permitted transitions, per-stage event allowlist, 16 scoring codes with deltas, learner-action vocabulary, asset kinds, reserved-host pattern, taxonomy versions |
| `backend/src/models/ScenarioDefinition.js` | The Mongoose model, cross-field validation hook, indexes, `toCandidateJSON()` |
| `backend/tests/scenarioDefinition.test.js` | 44 DB-free schema tests |
| `docs/SCENARIO_DEFINITION_SCHEMA.md` | Design rationale and the validation boundary |

**Files modified:** this file only. **No existing source file was changed.**

### Files deliberately NOT touched

`models/Scenario.js`, `constants/assessment.js`, `services/scenarioImportService.js`,
`services/sequenceGenerationService.js`, `services/scoringService.js`,
`services/assessmentService.js`, all controllers, routes and middleware, all
`backend/data/scenarios.*.json`, and every existing test. The legacy 40-scenario pipeline
runs exactly as before.

### Schema decisions

- **A separate collection** (`scenariodefinitions`), not a migration of `scenarios`. The
  two models coexist; nothing was migrated, per the task constraint.
- **Field groups follow Appendix A**: identity, classification, synthetic content, six
  stages, scoring, feedback, quality.
- **Client strings verbatim.** `family` and `trigger` are stored exactly as supplied,
  never overwritten; `canonical_family` and `canonical_triggers` sit alongside as our
  metadata with their own version stamps.
- **The stage list is split by audience, not edited.** All four client stage columns are
  preserved: `ui_to_build` on the visible stage; `learner_flow`,
  `expected_safe_behavior` and `scoring_text` inside `evaluation`. Nothing is discarded.
- **Constrained transitions, not a free graph.** `STAGE_TRANSITIONS` enumerates every edge
  §4 permits; a scenario declares a subset. A generic edge list was rejected because it
  would let a scenario invent a path the specification disallows with no way to detect it.
- **`points_delta` is stored per scenario**, not looked up from the constant, so an
  attempt stays explainable from what was stored when it ran.
- **`title` is evaluation data.** Client titles such as *"Cloned Friend in Distress"* state
  the answer outright.
- **Stage 1 is keyed `notify`** (§4's normative state name) while the content pages label
  it *"Event"*. The client's own text is preserved verbatim in `learner_flow`, so no
  client terminology is lost. Recorded so the difference is not later read as a defect.

### Validation boundary — schema vs importer

**In the schema:** all enums · `scenario_id` format · exactly six stages, correctly keyed
and ordered · transitions within the permitted per-stage set · events belonging to their
stage · `asset_refs` resolving to a declared asset · `scenario_id` prefix ↔ `platform` ·
`canonical_family` ↔ `disposition` · `legitimate_control` ↔ `disposition` · raw-trigger
shape (≤1 `|`, suffix exactly the marker, no empty `+` component) · `military_flag` ↔
trigger suffix · feedback completeness · `min_points ≤ max_points` · `(scenario_id,
version)` uniqueness.

**Deferred to `DATA-002`, and documented rather than duplicated:** raw ↔ canonical
*equivalence* for both taxonomies (needs the versioned alias artifacts from 15.23 / 15.24 —
the schema validates the raw string's shape and the canonical vocabulary, but only the
importer can confirm they agree) · bank totals (100 / 25 per platform / 8E-9M-8H / 80-20 /
35 military) · at most one active version per `scenario_id` · reserved-host enforcement on
`display_target` · safe-path completability.

### Indexes

`{scenario_id, version}` **unique** · `{active, platform, level}` · `{active, disposition}`
· `{active, canonical_family}` · `{active, canonical_triggers}` (multikey) ·
`{active, military_flag}`. Each maps to a query `SELECT-002` will run; no speculative
indexes. All six confirmed created on a live database.

### Hidden evaluation security

Two independent layers, extending the pattern proven on the legacy model:

1. `evaluation` is **`select: false`** — absent from ordinary and `.lean()` queries.
2. `toCandidateJSON()` builds from an **allowlist**, so a field added later is hidden by
   default rather than exposed by default.

Classification stays **top-level rather than inside `evaluation`** on purpose: the
selection engine queries it on every attempt, and burying it behind `select: false` would
force `+evaluation` on every selection query — the exact habit that causes leaks. It is
excluded by the projection instead.

**Verified against a live database** (throwaway `data001_probe_tmp`, dropped afterwards;
the project database was untouched and still holds its 40 legacy scenarios):

- default `findOne` → `evaluation` absent · `.lean()` → key absent
- explicit `.select('+evaluation')` → recovered
- candidate payload contains none of the sensitive strings
- duplicate `(W01, 1)` rejected with `E11000`; `W01 v2` coexists with `v1`

### Versioning and active semantics

`scenario_id` is the logical scenario, `version` the content version; unique together, so
versions coexist. `active` is explicit and defaults to **false** — imported content is not
live until published. Published content is not mutated in place; a change is a new
version, leaving historical attempts interpretable. "At most one active version per
`scenario_id`" is a publish-time rule for `DATA-002`, not a schema constraint, so staging a
new version before retiring the old one is not blocked.

### Tests

**44 new tests, no database**, matching the existing DB-free suite. They run
`await doc.validate()`, which executes validators *and* the synchronous `pre('validate')`
hook offline.

> **Engineering note worth keeping.** `validateSync()` does **not** run `pre('validate')`
> middleware — every cross-field rule above would silently pass — and it is deprecated in
> Mongoose 9 (removed in 10). This was verified empirically before the schema was written.
> Never validate a `ScenarioDefinition` with `validateSync()`.

Coverage: valid malicious / legitimate / military / three-trigger documents · missing,
misordered and mis-indexed stages · every enum · ID format and prefix↔platform ·
disposition↔family and disposition↔control · trigger shape, suffix, `military_flag` ·
verbatim client strings · illegal transitions, foreign stage events, dangling asset refs ·
feedback completeness · full scoring vocabulary and the safe-path sum of 10 · index
declarations · `select: false` and the candidate projection, checked by key **and** by
leaked substring · `expert_status` / `social_proof` as single IDs with the
whitespace-split failure mode explicitly rejected.

Each validator was additionally spot-checked to confirm it fires with the correct message
and that an unmodified control document passes — the tests are not vacuous.

### Test results

```
backend: node --test tests/**/*.test.js
  tests 91   pass 91   fail 0
    47  legacy suite (unchanged)   — adminThrottle, assessmentSummary, password,
                                     prompt, scoring, sequenceGeneration
    44  new scenarioDefinition suite
```

**Legacy tests remain green.** Baseline before this task was 47/47; it is still 47/47, and
the legacy scenario pool is unchanged at 40 documents.

### Unresolved / carried forward

- The raw↔canonical **alias artifacts** (`backend/data/attack-family-taxonomy.v1.json`,
  `backend/data/trigger-taxonomy.v1.json`) are **not yet created** — they belong to
  `DATA-002`. Until they exist, nothing verifies that a stored `canonical_family` /
  `canonical_triggers` actually corresponds to the raw client string. The schema
  constrains vocabulary and shape only.
- `synthetic.sender` and `assets[].content` are intentionally `Mixed`. Structuring the
  per-message content is `DATA-003`, once the renderers' needs are settled in Phase 7;
  fixing that shape now would be guesswork.
- No blocker. Question 18 (admin commercial scope) remains open and still gates Phase 11
  only.

---

## 15.27 DATA-002 — Client 100-Scenario Import (COMPLETED 4 September 2026)

**Status:** COMPLETED · Phase 1, task 2 of 3
**Design record:** [`docs/SCENARIO_IMPORT.md`](docs/SCENARIO_IMPORT.md)
**Result:** all **100 client scenarios imported and active** at version 1.

### Files created

| File | Purpose |
|---|---|
| `backend/data/scenarios/v1/scenarios.{whatsapp,instagram,email,sms}.json` | The client's 100 scenarios, **verbatim** (25 each) |
| `backend/data/scenarios/v1/MANIFEST.json` | Source provenance + per-scenario and whole-bank SHA-256 |
| `backend/data/taxonomy/attack-family-taxonomy.v1.json` | 19 canonical families + 99 raw-family mappings |
| `backend/data/taxonomy/trigger-taxonomy.v1.json` | 22 canonical triggers + 31 raw-primitive aliases + normalisation rules |
| `backend/src/services/scenarioDefinitionImportService.js` | Validation + normalisation + idempotent upsert |
| `backend/scripts/importScenarioDefinitions.js` | `npm run import:definitions` |
| `backend/tests/scenarioDefinitionImport.test.js` | 50 DB-free tests |
| `docs/SCENARIO_IMPORT.md` | Pipeline documentation |

**Files modified:** `backend/package.json` (one new script), this file. **No existing
source file was changed.**

### Content capture and fidelity

Extracted from the PDF by **word coordinates**, not text blocks. Two hazards would have
silently corrupted client content and are recorded so they are not reintroduced:

1. Adjacent table cells sometimes merge into one text block, concatenating two columns.
2. The stage label and the learner-flow text **share a text line**, so they must be split
   by `x` position, never by newline.

**All 2,900 extracted fields (100 x 29) were verified to appear verbatim in their own
source page.** That check caught a real defect mid-development — the footer label
"Concise learner feedback" bleeding into `stage 6 ui_to_build` on 61 scenarios — which was
fixed before anything was written.

### Import semantics

Upsert by `(scenario_id, version)`, backed by the unique index. **Idempotent** — verified:
run 1 `inserted 100`; runs 2 and 3 `unchanged 100, inserted 0, updated 0`. The service
contains no `deleteMany`, `deleteOne` or `drop`, and a test asserts that statically.

Version 1 = client document Version 1.0, imported `active: true` (no prior version exists,
and the release checklist requires 100 active scenarios). **No version is ever deactivated
silently** — if another version of a `scenario_id` were already active the importer
refuses and asks for an explicit deactivation. `--stage` imports inactive.

### Validation — nothing is written until every stage passes

Content integrity (SHA-256 vs manifest) → offline/synthetic safety → normalisation →
per-document schema validation → dataset acceptance counts → active-version guard → write
→ re-count. Dataset-level checks run **before** any write, so a partial bank cannot be
reported as success.

- **Family mapping** is by raw client string against the artifact (99 entries, no string
  maps to two families). An unmapped family **fails the import**; it is never matched to
  the nearest one.
- **Trigger normalisation** follows 15.24 exactly: partition once on `|`, split the left
  side on `+` and **never on whitespace**, casefold, closed alias table, preserve order,
  de-duplicate. Unknown primitive or unrecognised suffix fails the import.
- **Scoring** is parsed by a **closed clause table**, not by pattern-matching numbers out
  of prose. The bank uses eight distinct scoring strings; an unrecognised clause fails the
  import rather than being silently mis-scored.

### Dataset acceptance — all validated before commit

| Check | Required | Actual |
|---|---|---|
| Total | 100 | **100** |
| Per platform | 25 | **25 / 25 / 25 / 25** |
| Malicious / legitimate | 80 / 20 | **80 / 20** |
| Per platform easy/medium/hard | 8 / 9 / 8 | **8 / 9 / 8** (all four) |
| Military-context | — | **35** (WhatsApp 10, Instagram 12, Email 8, SMS 5 — matches the specification's index pages) |
| Canonical families used | 19 | **19** |
| Canonical triggers used | 22 | **22** |
| Multi-trigger scenarios | — | **87** |

Family and trigger distributions reproduce the ALIGN-005a/005b analysis exactly.

### Offline / synthetic validation

**No violations.** The only host anywhere in the 100 scenarios is `training.example`
(5 occurrences), a reserved `.example` domain. No URLs, no email addresses; phone-like
strings are non-routable training numbers (`00000 ...`); no real brand or institution
names; military entities fictional throughout. **No client content was rewritten** — it
was already compliant, and the importer proves that on every run.

### Content integrity mechanism

SHA-256 per scenario plus a whole-bank digest, over a stable serialisation (sorted keys,
no whitespace). Covers message and stage text, title, family, trigger, difficulty,
disposition, feedback, end state, scoring strings, and scenario presence. **Excludes**
`source_page` and every database field (`_id`, `createdAt`, `updatedAt`). Verified on
every import run.

**Bank fingerprint (v1):** `8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687`

### Database safety — verified before and after

| | Baseline | After import |
|---|---|---|
| Legacy `scenarios` | 40 | **40** |
| Legacy id fingerprint | `e4ee4edcea4fb44424512b8f` | **identical** |
| `assessments` / `candidates` | 1 / 1 | **1 / 1** |
| `scenariodefinitions` | 0 | **100** (all v1, all active) |
| Collections | adminusers, assessments, candidates, scenariodefinitions, scenarios | **unchanged** |

### Candidate security — re-verified live after import

Default query and `.lean()` return no `evaluation`; explicit `.select('+evaluation')`
recovers it; `toCandidateJSON()` returns only `id, scenario_id, version, platform,
synthetic, stages` and leaks none of the title, family, trigger, level, disposition,
end-state, scoring codes or the military marker. DATA-001's model is unchanged and
unweakened.

### Tests

**50 new tests, no database** — run against the real dataset and real taxonomy artifacts
through the same functions the importer uses.

```
backend: npm test
  tests 141   pass 141   fail 0
     47  legacy suite (unchanged)
     44  DATA-001 schema suite
     50  DATA-002 import suite
frontend: npm run lint  clean   |   npm run build  passes
```

**Legacy tests remain green** — 47/47, unchanged from baseline.

### Deliberately not done, and why

- **`synthetic.assets` / `asset_refs` are empty.** The specification describes assets in
  prose, not as records; generating asset IDs would be inventing client content.
  Deferred to `DATA-003`.
- **`expected_actions` are empty.** Which specific action satisfies a stage is stated in
  prose only; deriving it would be interpretation. Deferred to `ENGINE-001`.
- **Transitions and events do not vary per scenario.** Section 4 defines the state machine
  once, not per scenario, so every scenario receives the canonical set for its stage.

The client's prose is preserved in full in `evaluation.stages[].learner_flow`, so nothing
is lost while those fields remain empty.

### One structural note worth review (no action required)

DATA-001's `feedback` sub-document has five required parts; the client supplies a single
"Concise learner feedback" line plus an "End-state". The importer maps the client's own
words onto that structure — `result` = `"<disposition> - <family>"`, `cues` and
`prevention_habit` = the client's feedback line, `safe_action` = the client's stage-6
expected safe behaviour, `impact` = the client's end-state. **`cues` and
`prevention_habit` therefore carry the same client sentence**, because the client supplies
one line for both purposes. No text was written, paraphrased or invented. Richer per-part
feedback would be content the client needs to supply.

### Unresolved

None blocking. Question 18 (admin commercial scope) remains open and still gates Phase 11
only.

---

## 15.28 ENGINE-001 — Server-Authoritative Six-Stage Engine (COMPLETED 4 September 2026)

**Status:** COMPLETED · Phase 2, task 1
**Design record:** [`docs/SCENARIO_ENGINE.md`](docs/SCENARIO_ENGINE.md)
**Result:** all six stages run end to end against the real 100-scenario bank, under real
MongoDB transactions.

### Files created

| File | Purpose |
|---|---|
| `backend/src/constants/scenarioEngine.js` | Intent vocabulary, stage-intent table, event codes, local consequences, metadata allowlist, error codes |
| `backend/src/models/ScenarioRun.js` | Run state + candidate projection |
| `backend/src/models/ScenarioEvent.js` | The client's `Event` entity + constrained metadata |
| `backend/src/utils/transactions.js` | Topology guard, `withEngineTransaction`, bounded retry |
| `backend/src/services/scenarioEngineService.js` | The engine |
| `backend/scripts/testEngine.js` | Throwaway replica set for the integration suite |
| `backend/tests/scenarioEngine.test.js` | 45 DB-free tests |
| `backend/tests/scenarioEngineTransaction.test.js` | 21 real-transaction tests |
| `docs/SCENARIO_ENGINE.md` | Architecture and contract |

**Files modified:** `backend/package.json` (one script), this file. **No existing source
file was changed.** The legacy `Scenario`/`Assessment` pipeline is untouched.

### State-machine decisions

- **Legality comes from imported client data, not from the engine.** Each `(stage, intent)`
  names an ordered list of candidate event codes; the engine picks the first one the
  scenario's own per-stage `scoring` list declares, and takes the points from that entry.
  This is why `safe_pivot` scores `SAFE_PIVOT` on a malicious scenario and `CORRECT_USE` on
  a legitimate one with nothing hard-coded, and why `reject_ignore` is legal on legitimate
  scenarios and refused on malicious ones. **If a scenario declares none of an intent's
  codes at that stage, the intent is rejected.**
- **Resolution is the one applied rule**, and the client states it (section 5,
  `RESOLVE_CORRECT`): *"Report/block/retain/continue as the verified disposition
  requires."* Malicious must end reported/blocked, legitimate must be kept; anything else
  scores `CONTRADICTORY_UNSAFE_FINAL`.
- **Two engine telemetry codes were introduced**, and only two: `STAGE_SKIPPED` and
  `RUN_ABANDONED`. Section 4 defines the `skip → 4` and `abandon → resumable` transitions
  but supplies no event code for either, and no stage may advance without a ledger entry.
  Both carry 0 points and are kept in a separate `ENGINE_TELEMETRY_CODES` list so they can
  never be mistaken for client scoring vocabulary. **These are the only codes in the system
  the client did not supply.**
- **`verify_in_message_contact` advances to RESOLVE.** Section 4 permits the in-message
  check to go to stage 4 *or* 6 and the scenario data does not disambiguate; advancing
  avoids a loop, and the +0 score already encodes that it is not a real verification.
- **Abandonment is not resolution.** It sets `status: 'abandoned'`, writes no score,
  outcome or `resolved_at`, and keeps the stage. `resumeScenarioRun()` reactivates it.
  A resolved run is terminal and can never reopen.

### Transaction implementation

Hot path is exactly the 15.25 boundary — read run → assert active → assert
`expected_stage` → load pinned definition → resolve intent → insert Event → update
ScenarioRun — committed with **`{ w: 1, j: true }`**. Two documents, one transaction.

**Bounded retry:** 3 attempts, exponential backoff, and only for
`TransientTransactionError` / `UnknownTransactionCommitResult`. Domain rejections carry
`isDomainError` and abort immediately — an invalid transition is a decision, not a fault.

**Topology guard:** the engine calls `assertTransactionSupport()` before every intent and
**refuses to run on standalone MongoDB** rather than silently degrading to non-atomic
writes. Verified against the live standalone instance: `TRANSACTION_UNAVAILABLE`, with an
actionable message naming the `rs.initiate()` fix (pinned to `127.0.0.1`).

### Idempotency and concurrency

Unique `intent_key` + unique `(run_id, sequence)` + in-transaction `expected_stage` check.
A repeated key returns **the original outcome** with `duplicate: true` — one event, one
scoring effect. `E11000` is disambiguated by index: `intent_key` → replay the original;
`(run_id, sequence)` → a concurrent writer won, return `STALE_STATE`. Duplicate-key errors
are never retried blindly. No process-local locks; the database is authoritative.

### Scoring authority

Points come only from `definition.evaluation.stages[i].scoring[]`. A request containing
`points_delta`, `score`, `event_code`, `next_stage`, `current_stage`, `stage`, `sequence`,
`outcome_code`, `status`, `expected_action` or `evaluation` is **rejected, not ignored**.
Per-event deltas are unclamped; `score_0_10 = clamp(score_running, 0, 10)` at resolution.

**`ScenarioRun.score_running` is a cache; the Event ledger is the audit source.**
`recomputeScoreFromEvents()` replays it and `verifyRunIntegrity()` checks cache, sequence
contiguity and event count agree — the foundation for future reconciliation.

Verified across the bank: **the safe path scores exactly 10 on all 100 scenarios.**

### Candidate security

`toCandidateJSON()` returns only `run_id, scenario_id, version, platform, current_stage,
status, last_sequence, started_at, resolved_at`. Never exposed: `score_running` (section 3
hides the running score in assessment mode), `rationale`, `level`, `disposition`, `family`,
`canonical_family`, `trigger`, `canonical_triggers`, `military_flag`, `evaluation`,
expected actions, scoring rules. `score_0_10` and `outcome_code` are released only once
resolved. The engine loads `+evaluation` internally; none of it reaches a candidate.

Rationale (≤250 chars, single line, no markup) is stored on the run, **never in the event
ledger** and never echoed back.

### Local consequences

Risky branch actions return a rendering instruction —
`{kind, target, inert: true, executes: false}` — never an execution. Nine kinds. The
engine opens no link, sends no message, places no call, moves no money, installs nothing,
and touches no camera, microphone, clipboard or OS handler.

**`synthetic_target_id` is validated against the pinned definition's assets.** DATA-002
left `synthetic.assets` empty by design, so every scenario currently declares zero assets
and intents must send `null`; any non-null target — including an arbitrary URL — is
rejected with `INVALID_TARGET`. **DATA-003 (15.32) has since landed**, so every
scenario now declares assets and `synthetic_target_id` accepts the ids of the pinned
definition's own assets; anything else is still rejected with `INVALID_TARGET`.

### API surface — deliberately none

No routes added. Endpoints would require inventing an ownership rule ("which candidate may
drive this run?") that depends on the Attempt model, which does not exist. The engine is
consumed and tested as a service; routes arrive with the attempt work.

`ScenarioRun.attempt_id` is a plain ObjectId with **no `ref`** for the same reason. Tests
use a deterministic fixture id; no fake production attempts are created.

### Test results

```
backend: npm test
  tests 207   pass 186   fail 0   skipped 21
     47  legacy suite (unchanged)
     44  DATA-001 schema suite
     50  DATA-002 import suite
     45  ENGINE-001 pure state-machine suite
    (21) ENGINE-001 transaction suite - SKIPPED without a replica set, by design

backend: npm run test:engine
  tests 21    pass 21    fail 0     (real MongoDB transactions)

frontend: npm run lint  clean   |   npm run build  passes
```

**Legacy tests remain green** — 47/47, unchanged from baseline. Legacy `scenarios` still
40 with an identical id fingerprint; `assessments`/`candidates` unchanged at 1/1; no new
collections beyond the engine's own.

**Transaction tests are never mocked.** `npm test` skips them with a loud warning when no
replica set is configured, so a green default run cannot be mistaken for transactional
coverage. `npm run test:engine` starts a **separate** `mongod` on port 27018 with its own
temporary data directory, runs the suite and stops it — **the machine's MongoDB service on
27017 is never touched**, because converting it would affect every other database on that
instance.

### Unresolved

**No unmapped scenarios.** All 100 map cleanly: every one accepts the full safe path, the
full unsafe path, and scores exactly 10 on the safe path. Nothing had to be guessed, and
nothing is blocked.

Question 18 (admin commercial scope) remains open and still gates Phase 11 only.

---

## 15.29 SELECT-002 — Deterministic Attempt Selection (COMPLETED 4 September 2026)

**Status:** COMPLETED · Phase 4
**Design record:** [`docs/SCENARIO_SELECTION.md`](docs/SCENARIO_SELECTION.md)
**Result:** every client composition rule satisfied, verified across 400 seeds × 4 rotations
against the real 100-scenario bank.

### Files created

| File | Purpose |
|---|---|
| `backend/src/constants/scenarioSelection.js` | Quotas, rotation pattern, algorithm version, error codes |
| `backend/src/utils/seededRandom.js` | Deterministic PRNG (xoshiro128\*\*), `createSeed`, `rankBy` |
| `backend/src/models/Attempt.js` | The client's Attempt entity + frozen sequence |
| `backend/src/services/scenarioSelectionService.js` | Pure solver + independent validator |
| `backend/src/services/attemptService.js` | Pool/history loading, atomic persistence |
| `backend/tests/scenarioSelection.test.js` | 34 DB-free tests |
| `backend/tests/attemptCreation.test.js` | 20 real-transaction tests |
| `docs/SCENARIO_SELECTION.md` | Algorithm and contract |

**Files modified:** `backend/scripts/testEngine.js` (runs both integration suites), this
file. **No existing source file was changed.** Legacy `Scenario`/`Assessment` untouched.

### Algorithm — constraint-directed, not rejection sampling

Slot matrix + depth-first assignment with forward checking. Ten concrete slots each carry
a fixed platform and disposition; **difficulty is a running quota, not pinned per slot**,
because the specification states 3/4/3 for the attempt as a whole, not per platform —
pinning it would invent structure the client did not specify.

Slots are solved **most-constrained-first**, so the legitimate slots (five candidates per
platform) are decided while the search still has freedom. Pruning at every node on
difficulty feasibility, slot viability, military bounds, family cap, reachable trigger
diversity, recent budget and uniqueness. Bounded at 200,000 steps; the real bank solves in
a few hundred.

**Candidate order is a seeded rank keyed by `scenario_id`, not array position**, so
database insertion order cannot influence the result — asserted by test against shuffled
and reversed pools.

### Platform rotation

`quota[i] = PATTERN[(i + attemptIndex) % 4]` over `[whatsapp, instagram, email, sms]` with
pattern `[3,3,2,2]`. Driven by **attempt history, not the seed**: a seed-derived rotation
is balanced only in expectation, whereas rotating by attempt index gives every platform
exactly 3+3+2+2 = 10 across any four consecutive attempts. Verified end to end over four
real persisted attempts.

### Recent-20 exclusion — a real bug found and fixed

Minimisation is over **the number of recent scenarios used**, enforced as a hard budget
*inside* the search, so the solver chooses which items to re-admit.

> An earlier implementation re-admitted the recent window **oldest-first as a prefix**. On
> a pool where the five oldest recent items were all SMS legitimate scenarios it needed
> **six** re-admissions before two different platforms became available — where a
> well-chosen **two** suffice. Minimising a prefix is not minimising a count. Caught by a
> test whose expectation looked wrong but whose subject was; a regression test now pins it.

Only recent-20 relaxes. Everything else is hard: an unsatisfiable pool raises
`SELECTION_CONSTRAINT_UNSATISFIABLE` rather than quietly breaking a rule.

**History source:** the new pipeline's own `Attempt` → `ScenarioRun` records. Deliberately
**not** `Candidate.seenScenarios`, which references legacy `Scenario` ObjectIds rather than
`scenario_id` strings and belongs to the old journey.

### Independent validation

`validateSelection()` re-checks a finished selection against every rule from scratch and
knows nothing about the solver, so a search bug cannot hide behind shared logic. The solver
runs it on its own output and raises `SELECTION_INTERNAL_ERROR` on disagreement. Tested by
hand-building invalid selections that the validator must reject.

### Determinism and versioning

Same seed + pool + history + algorithm version ⇒ **byte-identical sequence**. No
`Math.random()`, no `crypto.randomInt`, no clock in the solver; the only randomness is
`createSeed()` for a *new* attempt. The PRNG holds no module-level state.
`SELECTION_ALGORITHM_VERSION` (`1.0.0`) is centralised and persisted per attempt, so a
future algorithm change leaves old attempts reproducible. Replaying a stored seed
reproduces its sequence exactly — verified against persisted attempts.

### Persistence and freezing

`createAttempt()` writes the Attempt **and all ten ScenarioRuns in one transaction**, so an
attempt claiming ten scenarios can never coexist with seven runs. Requires the §15.25
replica-set topology; no non-atomic fallback. Runs are created in exactly the state
ENGINE-001 expects and are not started here.

A `pre('save')` hook rejects any later change to `scenario_sequence`, `seed` or
`selection`. One in-progress attempt per learner.

> **Mongoose 9 note worth keeping.** Middleware is promise-based and calls hooks with no
> arguments, so `pre('save', function (next) {…})` throws `next is not a function` on every
> save. Hooks must throw to reject. This bit here and was caught by the integration suite.

### Security

The server decides everything. A caller supplies only an authenticated `profileId` and
`mode` — never scenario ids, composition, seed, algorithm version or an exclusion
override. `Attempt.toCandidateJSON()` exposes `attempt_id, mode, status, total_scenarios,
started_at, completed_at, total_score` and **no seed, selection metadata, composition,
sequence or profile id**. The pool query never loads `evaluation`. History is used only for
repeat control and rotation — never to infer any behavioural label (§5 safeguard).

### Test results

```
backend: npm test
  tests 261   pass 220   fail 0   skipped 41
     47  legacy (unchanged)      44  DATA-001      50  DATA-002
     45  ENGINE-001 pure         34  SELECT-002 solver
    (41) integration suites - SKIPPED without a replica set, by design

backend: npm run test:engine
  ENGINE-001 transactions   21 / 21
  SELECT-002 persistence    20 / 20

frontend: npm run lint  clean   |   npm run build  passes
```

**Legacy green** — 47/47. Legacy `scenarios` still 40 with identical id fingerprint;
`assessments`/`candidates` unchanged at 1/1; `scenariodefinitions` still 100; scenario bank
fingerprint `8e7a6c98…` unchanged; no new collections beyond `attempts`.

The two integration suites now run **sequentially, each in its own database** — both seed
and wipe `ScenarioDefinition`, and sharing one database made them race and hang.

### Unresolved

None blocking. Attempt creation has **no API route yet**, by the same reasoning as
ENGINE-001: the ownership rule belongs with the orchestration task. Question 18 (admin
commercial scope) remains open and still gates Phase 11 only.

---

## 15.30 DEPLOY-001 — Local MongoDB Replica Set (PARTIAL — 4 September 2026)

**Status:** Application side **COMPLETE**. MongoDB service conversion **BLOCKED — requires
an elevated (Administrator) session.**
**Design record:** [`docs/LOCAL_MONGODB_REPLICA_SET.md`](docs/LOCAL_MONGODB_REPLICA_SET.md)
**Verifier:** `cd backend && npm run verify:replicaset`

### Why it is blocked

`mongod.cfg` lives under `C:\Program Files\`. The session running this work is
`SHABDA\robo9`, **not an Administrator** — verified, not assumed: a write probe to the
MongoDB `bin` directory returned `Permission denied`. Editing the config and restarting the
`MongoDB` Windows service both require elevation, so Phases 2–3 could not be performed.

**No workaround was attempted.** Installing a second MongoDB instance, relocating `dbPath`
or running a user-space `mongod` on another port would all have diverged from the approved
topology and left two sources of truth.

### Observed environment (read-only inspection, nothing modified)

| Property | Value |
|---|---|
| mongod | **8.3.7**, service `MongoDB Server (MongoDB)`, Running, Automatic |
| Topology | **standalone** — `hello.setName` absent, `replSetGetStatus` → `NoReplicationEnabled` |
| `net.bindIp` / `net.port` | **`127.0.0.1`** / `27017` — already loopback only |
| `storage.dbPath` | `<install>\data`, WiredTiger, persistent |
| `replication` / `security` | absent / not configured |
| Listeners on 27017 | `127.0.0.1` only; no non-mongod client processes attached |

> **⚠ Shared instance.** This `mongod` also hosts several unrelated project databases
> (`authDB` ~4,200 documents, `fortitudefashion`, `FirstCrud`, `ProjectPhoenix`,
> `jobpilot`). Converting to a replica set changes the topology **for all of them**. The
> change is non-destructive and those applications need no modification, but it is a
> shared-instance decision and is called out so it is made knowingly.

A full pre-conversion inventory — 9 databases, 4,431 documents — is recorded in
`backend/deploy/mongo-before-state.json` and is what the verifier compares against.

### Completed in this task

- **API now binds loopback only.** `env.host` added (default `127.0.0.1`, overridable via
  `HOST`), and `server.js` passes it to `app.listen(port, host)`. **Verified end to end:**
  the API previously listened on `:::5000` (all interfaces); it now binds `127.0.0.1` only —
  `HTTP 200` on loopback, **connection refused on the machine's LAN address**.
- **`backend/scripts/verifyReplicaSet.js`** (`npm run verify:replicaset`) — 12 checks
  covering topology, binding, data preservation against the baseline, a real transaction
  probe (`{w:1, j:true}`) and the ENGINE-001 topology guard. Read-only against application
  data; its probe uses a scratch database it creates and drops itself.
- **Pre-conversion baseline snapshot** captured.
- Documentation with the exact elevated procedure, verification, backup and **rollback**.

Dry-run against the current standalone returns **8/12 — failing exactly the three
transaction-dependent checks**, which is the correct reading of the present state.

### What remains (elevated PowerShell — full detail in the doc)

1. Back up `mongod.cfg`; stop the service; cold-copy `dbPath`.
2. Add `replication: { replSetName: rs0, oplogSizeMB: 512 }` to `mongod.cfg`.
3. Start the service.
4. `rs.initiate({_id:"rs0",members:[{_id:0,host:"127.0.0.1:27017"}]})` — the member
   **must** be pinned to `127.0.0.1`; a bare `rs.initiate()` uses the hostname and triggers
   DNS, breaking offline operation.
5. Add `?replicaSet=rs0` to `MONGO_URI` in `backend/.env`.
6. `npm run verify:replicaset` — expect 12/12.

### Tests

```
backend: npm test              261 tests   220 pass   0 fail   41 skipped
backend: npm run test:engine   ENGINE-001 21/21 · SELECT-002 20/20
frontend: npm run lint clean   |   npm run build passes
```

The engine and selection transaction suites pass **because they start their own throwaway
replica set on port 27018** — they never touched the machine service, and they already
demonstrate the topology guard correctly accepting a replica set.

### Data safety

No database or collection was dropped, created or modified. Post-task check:
`cyber_awareness_training` still 40 legacy scenarios and 100 scenario definitions;
`authDB` still 2,000 orders and 502 users; all 9 databases present; the verifier's scratch
database was removed.

### Files changed

Created `backend/scripts/verifyReplicaSet.js`, `backend/deploy/mongo-before-state.json`,
`docs/LOCAL_MONGODB_REPLICA_SET.md`. Modified `backend/src/config/env.js` (added `host`),
`backend/src/server.js` (explicit bind host), `backend/package.json` (one script), this file.

### Remaining risk

**R10 stands and is unchanged**: a single-node replica set has **no redundancy**. This
conversion buys transaction support, not high availability. Backups (cold copy with the
service stopped) remain the only protection against disk loss.

Until the conversion is applied, the scenario engine correctly refuses to run outside its
own test harness, returning `TRANSACTION_UNAVAILABLE`.

---

## 15.31 API-001 — Candidate Attempt & Scenario Orchestration API (COMPLETED 4 September 2026)

**Status:** COMPLETED · Phase 9 (orchestration surface)
**Design record:** [`docs/ATTEMPT_API.md`](docs/ATTEMPT_API.md)
**Result:** the full learner journey — start, play ten six-stage scenarios, complete, read
the result — works end to end over real HTTP, proven by 25 integration tests.

### Files created

| File | Purpose |
|---|---|
| `backend/src/controllers/attemptController.js` | Eight handlers; translation only |
| `backend/src/routes/attemptRoutes.js` | `/api/attempts/*`, all behind `requireCandidate` |
| `backend/tests/attemptApi.test.js` | 25 real-HTTP integration tests |
| `frontend/src/services/attemptApi.js` | Client for the new contract |
| `docs/ATTEMPT_API.md` | Route, shape, ownership and error documentation |

### Files modified

`backend/src/services/attemptService.js` (orchestration section appended: ownership,
current-run assembly, completion, result) · `backend/src/routes/index.js` (mount) ·
`backend/src/middleware/errorHandler.js` (domain-error mapping) ·
`backend/src/constants/scenarioEngine.js` (`RESOLVE_INTENTS`) ·
`backend/scripts/testEngine.js` (third suite) · this file.

**No engine, selection, model or scenario-content file was changed.** The legacy
`/api/assessments` journey is untouched and still green.

### Routes

`POST /api/attempts` · `GET /api/attempts/current` · `GET /api/attempts/:attemptId` ·
`GET /api/attempts/:attemptId/current-run` ·
`POST /api/attempts/:attemptId/runs/:runId/events` ·
`POST /api/attempts/:attemptId/runs/:runId/resolve` ·
`POST /api/attempts/:attemptId/complete` · `GET /api/attempts/:attemptId/result`

`/resolve` is a scoped alias over the same `submitIntent` call — it adds no rules, but
gives the frontend an unambiguous "finish this scenario" call and is where rationale is
submitted.

### Reuse, not reimplementation

Selection, the seed, the state machine, event legality, idempotency, transactions and all
scoring stay in the existing services. The controllers compute nothing. Asserted by a test
that reads the persisted `selection` metadata after an HTTP start and checks the real
selector ran: 8+2 disposition, 3/4/3 difficulty, 2–4 military, algorithm version `1.0.0`.

### Ownership — and one deliberate deviation

`requireCandidate` (existing signed httpOnly cookie) → `req.candidate`. Two hops enforced
server-side: `candidate._id === Attempt.profile_id`, then
`Attempt._id === ScenarioRun.attempt_id`. A `profile_id` in a body is never consulted.

> **The brief asked for `403` on an ownership violation; this API returns `404`.** That
> matches the existing `findOwnAssessment` convention: a `403` confirms the id exists and
> turns the endpoint into an enumeration oracle. Recorded as a deliberate deviation, not an
> oversight.

Twenty-seven authoritative field names (`seed`, `points_delta`, `event_code`,
`next_stage`, `score`, `evaluation`, `canonical_family`, …) are **rejected with
`422 FORBIDDEN_FIELD`, not ignored**, so a client trying to steer the server learns
immediately.

### Candidate security

Never on this surface: seed, selection metadata, composition, sequence, `profile_id`,
`evaluation`, scenario title, level, disposition, family, canonical family/triggers,
military flag, end state, feedback, expected actions, per-stage scoring, `score_running`,
rationale. `score_0_10` and `outcome_code` are released only once a run resolves.

Tests assert leakage by **substring** — the actual title, family and trigger strings are
searched for in the serialised response, not just key names.

### Transactions and commit ordering

Unchanged from ENGINE-001: every state change runs inside its `{w:1, j:true}` transaction.
The response is built only after commit, so `/current-run` can never expose the next
scenario before the previous one is durably resolved — verified by a test that checks the
current run after every single stage.

Attempt completion adds one transaction of its own, guarded by an in-transaction status
re-read so the transition happens exactly once. Total score is the sum of the ten
engine-computed `score_0_10` values (specification section 5), never recomputed from
client input.

### Two real findings

- **`ScenarioRun.toCandidateJSON()` omits `ordinal`**, which the frontend needs for the
  "Scenario n of 10" progress card (§3). Added at the API layer rather than changing
  ENGINE-001's key-exact projection, since ordinal is a position within an attempt rather
  than run state.
- **A pre-existing flaky test** in `attemptCreation.test.js` set a fixed scenario id that
  could already be in the selected sequence, tripping the duplicate validator before the
  freeze hook — so it intermittently proved the wrong thing. Fixed to pick an id outside
  the sequence.

### Test results

```
backend: npm test
  tests 286   pass 220   fail 0   skipped 66
     47 legacy · 44 DATA-001 · 50 DATA-002 · 45 ENGINE-001 pure · 34 SELECT-002 solver
    (66) integration suites - skipped without a replica set, by design

backend: npm run test:engine
  ENGINE-001 transactions   21 / 21
  SELECT-002 persistence    20 / 20
  API-001 HTTP              25 / 25

frontend: npm run lint  clean   |   npm run build  passes
```

All prior suites remain green. Scenario bank fingerprint verified unchanged:
`8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687`.

Production database unchanged: legacy `scenarios` 40 with identical id fingerprint,
`scenariodefinitions` 100, `assessments`/`candidates` 1/1.

### Housekeeping

Two scratch databases created by this session while debugging (`api_dbg_test`, `api_dbg2`)
were dropped. An empty `__rs0_transaction_test__` collection exists in
`cyber_awareness_training` — it was **not** created by this task (it predates it, from the
replica-set conversion) and was deliberately left in place rather than dropped.

### Deferred

Behaviour analytics, attack-family and trigger breakdown, path replay, feedback and
remediation are **RESULT-001**; the taxonomies are server-only and must not appear on the
candidate surface. Admin APIs, the dashboard orchestrator UI and Electron remain later
tasks. The frontend still runs the legacy journey — `attemptApi.js` is the client for this
contract when the UI migrates.

---

## 15.32 DATA-003 — Structured Synthetic Content (COMPLETED 5 September 2026)

**Status:** COMPLETED · Phase 1 content
**Design record:** [`docs/SYNTHETIC_CONTENT_SCHEMA.md`](docs/SYNTHETIC_CONTENT_SCHEMA.md)
**Result:** all 100 scenarios carry structured, renderable, offline-safe synthetic content.
**Synthetic fingerprint (v1):** `2779b03939e13cf11e0bee44493609f0c91e228f201f22f8c025a080509afde1`

### The finding that shaped the task

The client specification supplies far less renderable content than the task assumed:

| Content | Coverage | Nature |
|---|---|---|
| Notification string (stage 1, quoted) | **100/100** | literal |
| Sender label inside it (`"Sender: message"`) | **61/100** | literal |
| `Context presented:` narration (stage 2) | **100/100** | literal, third-person |
| Literal file names | 4 in the whole bank | literal |
| `ui_to_build` | 100/100 | **per-platform boilerplate** — only 4 distinct strings per stage, identical across all 25 scenarios on a platform; carries no scenario-specific data |

It provides **no** message dialogue, sender numbers, timestamps, profile fields, subjects,
link URLs, QR payloads, call captions, page copy or directory entries.

Everything the client does not state is therefore a **deterministic inert placeholder**,
marked `source: "placeholder"` in the data and enumerated in the schema doc §9. Nothing was
invented that carries scenario meaning.

### Architecture: embed, one-line schema change

Embedded in `ScenarioDefinition.synthetic` — the field DATA-001 already defined for this.
No new collection, no new database, no join. Version pinning and orphan-prevention come
free: `ScenarioRun` pins `(scenario_id, definition_version)` and a version is immutable, so
an in-flight run can never have its content changed by a republish or deactivation.

**The only schema change is one array entry:** `'notification'` added to `ASSET_KINDS`.
No migration was required.

### Content

**511 assets across 100 scenarios.** Every scenario has `notification`, `sender_profile`,
`message_thread` and `trusted_directory_entry`. Risky surfaces are derived from each
scenario's **own branch prose** — `browser_page` 42, `payment_screen` 38, `file` 12,
`call_screen` 8, `install_screen` 6, `qr_payload` 5. `ui_to_build` is deliberately excluded
from that derivation: it names every primitive for its platform, so matching it would give
every scenario every asset and mean nothing.

Message threads use the **existing renderer block vocabulary** (`message`, `note`,
`emailHeader`, `emailBody`, `profileHeader`, …), so the four platform renderers can consume
this without redesign. The client's narration is a `note`, not a message bubble: it is
third-person description, and rendering it as dialogue would put words in the sender's
mouth the client never wrote.

### A real content-corruption bug, caught by a fidelity test

The sender-splitting regex matched the colon inside a **time** — "Power will disconnect
21:30…" and "…login on DEV-204 at 14:22…" — splitting the client's own message text and
inserting a space. Two scenarios (**S02**, **S21**) were affected.

Fixed by requiring whitespace after the colon and rejecting a label ending in a digit. All
100 notifications now round-trip byte-exact against the source, asserted by test. The
named-sender count correctly dropped 63 → 61 as the two false positives were removed. The
subsequent import reported exactly `updated 2, unchanged 98`.

### Import and idempotency

Synthetic content is a **second versioned input to the same importer**, so one command
produces a complete document. `npm run generate:synthetic -- --check` proves the committed
files are reproducible from the client source.

**A second real bug:** the importer's change detection compared only the *client-content*
fingerprint, which excludes `synthetic` — so it reported all 100 as `unchanged` and
silently skipped writing the new content. Fixed by also comparing a synthetic digest.
Verified: first run `updated 100`, second run `unchanged 100`.

**The DATA-002 client fingerprint is unchanged** —
`8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687` — because it covers
client content only. Reversible: delete `backend/data/synthetic/v1/` and re-import.

### Safety and offline

Every target is a reserved `*.training.example` domain. No CDN, image host, `data:` URI or
external URL anywhere. Avatars are **initials**, not image files, so there is nothing to
fetch. All phone-like strings use the bank's own non-routable `00000 …` convention. File,
call, QR, install and payment assets each carry explicit inertness flags. The trusted
directory never echoes the message sender — `matches_message_sender: false` plus a
different identifier, both asserted.

Answer-bearing client text is never used: stage 3 `expected_safe_behavior`, stage 5 and
stage 6 `learner_flow` each state the answer and stay server-only. A test proves none of
them — nor the title, family, end state or feedback — appears in synthetic content.

### Files

**Created:** `backend/scripts/generateSyntheticContent.js` ·
`backend/data/synthetic/v1/{whatsapp,instagram,email,sms}.json` + `MANIFEST.json` ·
`backend/tests/syntheticContent.test.js` · `docs/SYNTHETIC_CONTENT_SCHEMA.md`

**Modified:** `constants/scenarioDefinition.js` (one asset kind) ·
`services/scenarioDefinitionImportService.js` (load + merge + change detection) ·
`package.json` (one script) · this file.

**Unchanged:** the DATA-002 scenario source JSON, every model, the engine, selection, the
API, and all four renderers.

### Test results

```
backend: npm test              317 tests   251 pass   0 fail   66 skipped
           47 legacy · 44 DATA-001 · 50 DATA-002 · 45 ENGINE-001 · 34 SELECT-002
           31 DATA-003  (new)
backend: npm run test:engine   ENGINE-001 21/21 · SELECT-002 20/20 · API-001 25/25
frontend: npm run lint clean   |   npm run build passes
```

Database: 100 definitions, all with synthetic assets; legacy `scenarios` still 40.

### Deferred

The Assessment UI is **not** migrated — `attemptApi.js` already returns this content in
`scenario.synthetic`; wiring it into `PhoneSimulator` and the four renderers is the next
task. Richer per-scenario visual content would be content the client must supply; it cannot
be derived from the current PDF without inventing meaning.

---

## 15.33 UI-001 — Simulation Shell and Four Platform Renderers (COMPLETED 5 September 2026)

**Status:** COMPLETED · Phase 7 candidate UI
**Design record:** [`docs/SIMULATION_UI.md`](docs/SIMULATION_UI.md)
**Result:** the assessment now runs on the attempt API, the six-stage engine, the 100
client scenarios and the DATA-003 synthetic content. Verified end to end in a browser
against the real backend: ten scenarios resolved, attempt completed, 82/100 returned.

### The finding that shaped the task

The four existing renderers already speak the block vocabulary DATA-003 emits, so **they
were reused unchanged**. The only new code between the API and the screen is a 90-line
adapter (`utils/syntheticScreen.js`). Nothing was thrown away and no renderer was
redesigned — which is what the task asked for and what DATA-003 had deliberately set up.

The second finding was less comfortable and is recorded in full below.

### Architecture: one controller, a pure reducer, no local stage

```
SimulationPage  →  useAttemptController  →  attemptApi  →  /api/attempts/*
      ↑                    ↓
   components         attemptMachine  (pure; records committed responses only)
```

No screen calls `attemptApi` directly, so there is exactly one definition of "the current
stage" — the one the engine last committed. **The reducer has no action that can advance a
stage on its own.** Local state is presentation only: which overlay is open, whether the
toast was dismissed. Nothing authoritative touches `localStorage` or `sessionStorage`; a
reload asks the server what is current, which is also the interruption-recovery path.

There is no optimistic update anywhere: nothing on screen changes until the response
arrives, so the UI can never show an action as done that the server refused.

### A disposition oracle, found and closed

`branch: reject_ignore` is accepted by the engine on the **twenty legitimate** scenarios
only — the eighty malicious ones do not declare `NEEDLESS_REJECT_IGNORE` at that stage, so
it is rejected there. Measured across all 100 definitions: **20 legal, 80 illegal**; every
other intent is legal on all 100.

Offering that control on every scenario would let a learner read the disposition off
whether the button worked. It is therefore **not offered at the branch stage at all**.
"Ignore it and move on" is offered at resolve, where `resolve_ignore` is accepted on all
one hundred and the same behaviour is still scored. A UI decision; **no backend behaviour
was changed**, and a test asserts the control never appears on any of the 100.

### Three real bugs, all caught by verification rather than by inspection

- **Off-by-one on the scenario number.** `ordinal` is added by the API layer on
  `/current-run` only — `ScenarioRun`'s candidate projection is key-exact and omits it
  (API-001 §5). The outcome card fell back to `progress.resolved + 1`, which counts the run
  that just resolved: the end of scenario 1 announced **"Scenario 2 recorded"**. Found by
  walking the real UI, not by any test. The reducer now carries the ordinal forward, the
  test fixture omits `ordinal` from event responses exactly as the API does, and two
  regression tests pin it.
- **The completion gateway was unclickable.** `RUN_LOADED` with no run set the phase to
  `COMPLETING`, which put the "View results" button into a permanent loading state — the
  attempt could never be completed from the UI. `COMPLETING` now belongs to the `/complete`
  call alone.
- **The focus trap released focus immediately.** `Modal`'s effect depended on `onClose`,
  which callers pass as an inline arrow, so it re-ran every render and each cleanup handed
  focus straight back out. The callback now lives in a ref and the trap depends only on
  `open`.

A fourth, subtler one: an overlay opens only *after* the engine accepts the intent, by
which time the control that opened it has been re-rendered away — so focus was being
restored to `document.body`. `restoreFocus` now rejects `<body>`, verifies focus actually
landed, and falls back to `<main>`.

### What the candidate surface shows, and what it cannot

Controls are derived from the scenario's **own synthetic assets** — a `browser_page`
produces "Open the link", a `payment_screen` produces "Make the payment", a scenario with
neither shows neither. Every decision-stage control gets the same variant, weight and
order; nothing is disabled to steer. The frontend never learns which action is safe.

The trusted directory draws results **only** from the scenario's `trusted_directory_entry`
assets. Typing cannot create an entry, and the message's contact details are never searched
or matched — they appear in a separate panel labelled as message-supplied, with no
provenance, purely for comparison.

Family, canonical family, triggers, difficulty, disposition, evaluation, expected safe
behaviour, scoring configuration and the selection seed appear nowhere — not in the DOM,
props, data attributes, `window`, storage or URLs. Per-scenario points exist on the wire
once a run resolves, but section 3 hides the running score in assessment mode, so the
**mode** decides, not the payload.

### Local primitives

Safe browser, file viewer, QR inspector, call screen, payment screen and install prompt —
one file, because they are one idea: an inert local surface rendered from a synthetic
asset. There is no `href`, `src`, `fetch`, `window.open`, media device or host handler in
any of them. The engine's `consequence` is a rendering instruction; this layer renders it
and nothing more.

### Files

**Created (18):** `pages/SimulationPage.jsx` · `pages/ResultPage.jsx` ·
`state/attemptMachine.js` · `hooks/useAttemptController.js` · `constants/simulation.js` ·
`utils/syntheticScreen.js` · `utils/maskIdentifier.js` · `components/ui/Modal.jsx` ·
`components/simulation/` × 10 (`TrainingRail`, `AttemptHeader`, `SegmentedProgress`,
`SimulationFrame`, `NotifyDashboard`, `ScenarioViewport`, `ActionSheet`, `InspectSheet`,
`LocalSurfaces`, `TrustedDirectory`, `ConsequencePanel`, `ScenarioOutcome`) ·
three test files · `test/attemptFixtures.js` · `docs/SIMULATION_UI.md`

**Modified:** `routes/AppRoutes.jsx` · `constants/routes.js` · `constants/app.js` (pool
now 100 / 25 per platform) · `pages/DashboardPage.jsx` (start/resume through `attemptApi`) ·
`pages/BriefingPage.jsx` (four legacy steps → the six stages) · `vite.config.js` ·
`package.json` · this file.

**Unchanged:** the four renderers, the whole backend, the DATA-002 and DATA-003 data.

### Test results

```
frontend: npm test              54 tests   3 files   0 fail   (no server, no database)
frontend: npm run lint  clean   |   npm run build  passes
backend:  npm test              317 tests  251 pass  0 fail  66 skipped
backend:  npm run test:engine   ENGINE-001 21/21 · SELECT-002 20/20 · API-001 25/25
```

Fingerprints unchanged: client bank
`8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687`, synthetic content
`2779b03939e13cf11e0bee44493609f0c91e228f201f22f8c025a080509afde1`. Database: 100
definitions, legacy `scenarios` still 40.

Browser verification recorded no request to any host but the local API and the local dev
server.

### Deferred

`branch: reject_ignore`, `approve_device_link` and `share_location` are not offered (the
first for the oracle above, the other two because no asset kind backs them). Per-scenario
feedback shows only the final action and the points, because that is all the candidate
contract carries. The result screen is the score and the ten scenario points; the behaviour
breakdown, path replay and remediation are **RESULT-001**. Instructor restart and the
simulation-issue report are admin surfaces.

---

## 15.34 RESULT-001 — Candidate Result Projection & Results API (COMPLETED 5 September 2026)

**Status:** COMPLETED · server-side only
**Design record:** [`docs/RESULT_API.md`](docs/RESULT_API.md)
**Result:** `GET /api/attempts/:attemptId/result` now returns the full section 7 result —
summary, per-scenario outcome with feedback and path replay, behaviour breakdown,
comparison and remediation — built entirely from authoritative server state.

### The decision that shaped the task: upgrade additively

API-001 already owned this route. Rather than replace its payload, RESULT-001 **kept every
existing key** — same name, same meaning — and added the new blocks around them. The
UI-001 result screen therefore needed no change, which matters because this task was
scoped server-side only. `attemptResultFor()` keeps its name and signature and delegates
to the new `buildAttemptResult()`, so `/complete` and `/result` return one projection and
cannot drift apart.

### Source of truth, and the integrity gate

Scores come from `ScenarioRun.score_0_10`, the path from `ScenarioEvent` ordered by
`sequence`, and classification and feedback from `ScenarioDefinition`. **The total is
recomputed** from the ten run scores; `Attempt.total_score` is treated as a cache and
checked against it.

Six conditions must hold or the request fails with `500 RESULT_INTEGRITY` and **repairs
nothing**: exactly ten runs, ordinals 1–10 without gaps or repeats, all resolved, integer
scores in 0–10, the total matching the sum, and a pinned definition present for every run.

### Missed threat vs false positive

Four classes — `handled_safely`, `missed_threat`, `false_positive`, `unsafe_handling` —
decided from the server-side disposition, the outcome code and the ledger.

The point worth recording: **the final action alone is not enough.** A learner who submits
card details and *then* reports has not handled the threat, so a critical unsafe event
(from `SCORING_EVENTS[...].critical`) demotes an otherwise correct malicious outcome. A
test asserts this for every critical code.

### Three overlaps between released and server-only content

The leakage tests were written to fail on any appearance of `end_state`,
`expected_safe_behavior` or the raw `family`. All three fired — and in every case the
cause was the **client authoring one sentence into two columns**, not a defect:

- `evaluation.end_state` **is** `feedback.impact`, identical on all 100. §7 requires the
  "likely impact", so it is a required release. The test now asserts the two are identical:
  if they ever diverge, the appearance becomes a real leak again and the test fails.
- Some stage-6 `expected_safe_behavior` is generic boilerplate ("Complete the resolution
  and return to the dashboard.") that is also `feedback.safe_action`. Only an **exact**
  match is exempt; every answer-bearing stage-3 to stage-5 decision signal still fails.
- `feedback.result` names the raw family in prose ("Malicious - Account takeover / OTP
  theft"). §7 requires that line, so the family may appear *inside per-case feedback* and
  nowhere else — asserted by extracting the rest of the payload and searching it separately.

A fourth surfaced only by running the suite eight times against different seeds: some raw
triggers are single ordinary words - `Routine`, `Familiarity` - which collide both with
authored feedback prose and with this build's own aggregate trigger labels ("Routine
expectation"). A blanket substring ban on them is meaningless, so the test now asserts the
property that actually matters: **no scenario entry carries its own classification**, raw
or canonical. Per-case feedback and the aggregate breakdown sit outside that check by
design.

This corrected an overclaim in the first draft of the design note, which had said no family
reaches the learner per scenario. It does, in the client's own debrief sentence, for the
ten scenarios they just completed. Nothing about the other ninety is released - though
publishing both the per-scenario list and the aggregate breakdown does let a determined
learner correlate the two for those ten, which is inherent to §7 requiring both and is
recorded in `docs/RESULT_API.md`.

### Remediation: families, not scenario ids

Naming the scenarios to practise would hand the learner a partial answer key for a bank
they will meet again, and no practice-mode workflow exists yet for an id to resolve
against. Each recommendation carries a family key, a label, a blame-free reason, the points
gap and a count of **active** scenarios available. A family with no active scenarios is
never recommended; a perfect attempt gets an empty list. No reason names a trait, a
susceptibility or an emotional state, and a test asserts that by vocabulary.

### Comparison

Compared only against the same learner's earlier completed attempt matching on `mode`,
`content_version`, `taxonomy_version` and `trigger_taxonomy_version` — the fields
`Attempt` already stored for exactly this gate. Otherwise `no_previous_attempt` or
`not_comparable`, naming only the **field names** that differ, never a value from the other
attempt. The query is scoped to `profile_id`, so another learner's data cannot enter it.

### Path replay

`{ step, stage, action }` and nothing else, ordered by the ledger's `sequence` — the unique
index the engine writes under, so it is the only ordering that cannot be wrong. Event codes
are mapped to neutral labels and an **unmapped code is dropped**, so a code added later
stays invisible until someone deliberately labels it.

### Files

**Created:** `src/constants/resultProjection.js` · `src/services/attemptResultService.js` ·
`tests/attemptResult.test.js` · `tests/attemptResultApi.test.js` · `docs/RESULT_API.md`

**Modified:** `src/services/attemptService.js` (delegates, minimal body) ·
`scripts/testEngine.js` (registers the new suite) · `tests/attemptApi.test.js` (its result
leakage test tightened, not weakened — see below) · this file.

**Unchanged:** every model, the schema, the routes, the controller, the engine, selection,
all data, and the whole frontend.

### One existing test was rewritten

`attemptApi.test.js` asserted the result exposed no `"disposition"` or `"feedback"` — which
§7 now requires it to expose. Its forbidden list was narrowed by exactly those keys and
**extended** with `expected_actions`, `expected_safe_behavior`, `learner_flow`,
`end_state`, `points_delta`, `event_code` and `rationale`; everything removed from it is
now asserted as released-on-purpose in the same test, so it cannot vanish quietly. The
far stricter check — searching for the actual server-only strings of the ten definitions
in play — lives in the new suite.

### Test results

```
backend  npm test              371 tests   277 pass   0 fail   94 skipped
                               (+26 unit; +28 skipped = the new integration suite)
backend  npm run test:engine   ENGINE-001 21/21 · SELECT-002 20/20 · API-001 25/25
                               RESULT-001 28/28
frontend npm test 54 passed    |  lint clean  |  build passes
```

Fingerprints unchanged: client `8e7a6c98…038a7687`, synthetic `2779b039…09afde1`.
Production database untouched: 100 definitions (100 active, 100 with synthetic assets),
legacy `scenarios` 40, 0 attempts / runs / events.

### Known limitations

The **result screen still renders the API-001 subset** — the new blocks are on the wire but
not yet displayed; that is a UI task. Remediation names families, not scenarios, until a
practice mode exists to resolve an id against. Comparison covers one previous attempt, not
a trend across many. `feedback.result` discloses the family in prose for the ten scenarios
played, by specification.

---

## 15.35 UI-002 — Realistic Mobile Device Simulation UX (COMPLETED 5 September 2026)

**Status:** COMPLETED · frontend only
**Design record:** [`docs/SIMULATION_UI.md`](docs/SIMULATION_UI.md)
**Result:** the assessment is now a simulated handset beside a training decision panel.
Verified end to end in a browser across all four platforms; 78/100 attempt completed.

### The decision that shaped the task: compose, do not rewrite

UI-001 was left in place. The controller, the reducer, `syntheticScreen`, the action
catalogue, `ActionSheet`, `LocalSurfaces`, `TrustedDirectory`, `InspectSheet` and **all
four platform renderers** are unchanged in behaviour. What changed is where they are drawn.

The strongest evidence: **the 25 UI-001 page tests passed through the restructure
unchanged**, except two assertions made *more specific* because the new training panel
also names the scenario. No backend, API, scenario, scoring or engine change was needed,
so no stop condition was hit.

### What was built

`DeviceFrame` draws the handset - body, bezel, island, status bar, home indicator - in CSS
and the icon set already installed. No image, no external asset, and nothing copied from a
specific vendor's design language. The screen is `relative overflow-hidden`, which is the
containment boundary the specification asks for: apps, sheets and pushed surfaces are all
clipped to it.

`PhoneShell` owns a small local navigation stack and **never advances the attempt**. The
engine's stage picks the base screen; a surface is pushed when the engine returns a
`consequence`; **Back is pure navigation** that submits nothing and retracts nothing.

`PhoneHome` moved the notify stage onto the device: an app grid with a badge and a
notification banner, replacing UI-001's web cards. The semantics are identical - opening
submits `open_item`, dismissing submits `dismiss` and keeps the scenario with its badge -
which is exactly what the surviving UI-001 tests prove.

`TrainingPanel` was added after the first browser screenshot showed the right column empty
at stage 1. It now always carries the scenario position, the stage, its instruction and a
six-stage strip, then either an on-device hint, the action sheet or the outcome.

### Two deliberate departures from UI-001

- **Email is shown on the device, not full width.** The specification permits the
  full-width option and UI-001 used it; the point of this phase is that the learner reads a
  message *on a phone*, and the mobile email client stays legible at 390px.
- **The in-device sheets are `contained` dialogs.** `Modal` gained a `contained` variant
  that positions it absolutely inside the device screen instead of the viewport. The focus
  trap is untouched - it is a document-level key handler, not a layout concern - so the
  sheets read as phone sheets while keeping `role="dialog"` and focus restoration.

### Motion, scrolling and reach

Five short CSS animations, all **classes** rather than inline styles or a JS loop, so the
existing global `prefers-reduced-motion` guard collapses every one; a test asserts that
contract. No animation gates a request.

Every scroller inside the device carries `overscroll-contain`, so reaching the end of a
conversation stops at the device instead of scrolling the page. At 640px - 200% zoom of a
1280px desktop - the device scales, the panel moves below it, and the browser measured
`scrollWidth === clientWidth === 640`: no horizontal overflow.

### Files

**Created:** `components/simulation/DeviceFrame.jsx` · `PhoneShell.jsx` · `PhoneHome.jsx` ·
`TrainingPanel.jsx` · `PhoneDevice.test.jsx` (12 tests)

**Modified:** `pages/SimulationPage.jsx` (phone-left/panel-right workspace, surface state) ·
`components/ui/Modal.jsx` (`contained` variant) · `ConsequencePanel.jsx` (now the notice
only; the surface renders on the device) · `ActionSheet.jsx` (heading moved to the panel) ·
the four renderers (`overscroll-contain` only) · `constants/simulation.js` (consequence
wording) · `styles/index.css` (device tokens, three animations) ·
`ScenarioViewport.test.jsx` renamed to `PhoneShell.test.jsx` and repointed · this file.

**Removed (superseded, no live references):** `ScenarioViewport.jsx` · `NotifyDashboard.jsx` ·
`SimulationFrame.jsx`

**Unchanged:** the whole backend, all scenario and synthetic data, the result page, the
attempt API, the engine and the legacy journey.

### Test results

```
frontend  npm test   67 passed (4 files)   |  lint clean  |  build passes
          16 reducer · 25 page (UI-001, intact) · 14 shell · 12 device (new)
```

Browser verification walked dashboard → notification → open → inspect → branch → verify →
resolve → next → completion → result across **SMS, Instagram, Email and WhatsApp**, pushed
and popped a payment surface, opened both in-device dialogs with focus trapped, and
confirmed a mid-attempt reload restores the stage from the server with both web storages
empty. Live DOM: zero `img/iframe/embed/object/video/audio`, zero external links, and
`localhost` as the only network host. Source audit: the only `fetch(` is the local API
client and the only `window.open` is a comment.

Fingerprints unchanged: client `8e7a6c98…038a7687`, synthetic `2779b039…09afde1`.
Production database untouched (100 definitions, 100 active, 100 with synthetic assets,
legacy 40); the verification candidate and its 2 attempts / 20 runs / 62 events were
deleted afterwards, leaving 0 attempts, runs and events.

### Known limitations

The horizontal-overflow check is a browser measurement, not a unit assertion - jsdom has no
layout engine, so the test asserts the sizing contract instead. The notification tray holds
one live scenario because the engine issues one run at a time. The device is a generic
handset by design. The result screen still renders the API-001 subset; surfacing
RESULT-001's blocks is the obvious next UI task.

---

## 15.36 UI-003 — Simulation Polish, Result Experience and Acceptance Hardening (COMPLETED 6 September 2026)

**Status:** COMPLETED · frontend only
**Design record:** [`docs/SIMULATION_UI.md`](docs/SIMULATION_UI.md) §11a, §12, §13 ·
[`docs/RESULT_API.md`](docs/RESULT_API.md) §12
**Result:** the RESULT-001 projection is now actually on screen, and the simulation reads
as a device with a supporting training panel rather than two competing columns.

### The substantive change: the result screen

RESULT-001 has returned the full section 7 projection since 5 September, but the screen
still rendered the API-001 subset - a score and a four-column table. UI-003 closed that gap
with five focused presentational components under `components/result/`:

| Component | Renders |
|---|---|
| `ResultSummary` | Total /100, resolved count, the four outcome counts, the comparison |
| `BehaviourBreakdown` | Server buckets by app, case type, persuasion technique, decision stage |
| `ScenarioResultCard` | Score, outcome class, sender and preview; feedback and path on demand |
| `PathReplay` | `{ step, stage, action }` in the server's ledger order |
| `RemediationList` | Family-level practice areas and the count of active scenarios |

**The layer is presentation only.** It sums no score, classifies no outcome and rebuilds no
taxonomy; `constants/result.js` maps the server's stable slugs to English and falls back to
the slug when it has no entry. A test asserts the page shows the server's total of 74 even
though the fixture's ten scenario scores sum to 67 - the client must never compute it.

Three deliberate choices: feedback is a collapsed `aria-expanded` disclosure per scenario
(ten expanded cards would bury the summary); scenarios are identified by **what the learner
saw** - sender and notification preview - never the server-only authoring title; and
remediation is phrased about the material, not the person, with a test asserting the
section contains no trait vocabulary.

### Simulation polish

The device now leads: a centred `max-w-4xl` grid of `25rem` device and `22rem` panel, so
the panel supports the phone instead of outgrowing it. The stage strip names all six
stages and marks the current one by weight and thickness as well as colour, with the
position also stated in text for screen readers.

One small finding from the first screenshot: `notify`'s label is "New activity", which
truncated to "NEW A..." in the strip. `STAGE_META` gained a `short` name per stage rather
than the strip inventing its own.

### A stale test fixture, caught by the integration

The completion test failed with a blank page: `attemptFixtures.js` still returned the
**pre-RESULT-001** result shape, so the new screen had no `summary` to render. The fixture
was updated to the real contract - summary, per-scenario feedback and path, behaviour
buckets, comparison and remediation - which is the point of a stub that stands in for a
contract. Two assertions were made *more specific* (the headline heading rather than any
text matching `/74/`), never weaker.

### Files

**Created:** `constants/result.js` · `components/result/ResultSummary.jsx` ·
`BehaviourBreakdown.jsx` · `ScenarioResultCard.jsx` · `PathReplay.jsx` ·
`RemediationList.jsx` · `pages/ResultPage.test.jsx` (14 tests)

**Modified:** `pages/ResultPage.jsx` (composed from the new components) ·
`pages/SimulationPage.jsx` (workspace proportions) ·
`components/simulation/TrainingPanel.jsx` (named stage strip) ·
`constants/simulation.js` (`short` stage names) · `test/attemptFixtures.js` (real result
contract) · `pages/SimulationPage.test.jsx` (two assertions made specific) ·
`docs/SIMULATION_UI.md` · `docs/RESULT_API.md` · this file.

**Unchanged:** the whole backend, the Result API contract, all scenario and synthetic data,
the engine, selection, scoring, and the device shell built in UI-002.

### Test results

```
frontend  npm test   81 passed (5 files)   |  lint clean  |  build passes
          16 reducer · 25 simulation page · 14 phone shell · 12 device · 14 result (new)
backend   npm test              371 tests  277 pass  0 fail  94 skipped
backend   npm run test:engine   21/21 · 20/20 · 25/25 · 28/28
```

### Browser acceptance

A full ten-scenario attempt scored **82/100** across all four platforms (WhatsApp,
Instagram, SMS, Email). The result screen rendered every block: headline and outcome mix
(7 handled safely · 1 threat missed · 2 genuine items rejected · 0 unsafe steps), the
first-attempt comparison note, four breakdowns, ten scenario cards, expandable feedback
with the six-step path replay, and three practice recommendations.

Recovery re-checked mid-attempt: opening a browser surface and pressing **Back left the
stage at Verify**, and a reload restored Scenario 2 / Verify from the server with both web
storages empty. Accessibility spot-check on the result screen: 12 focusable elements, all
real controls, all named, 10 disclosures exposing `aria-expanded`, measured 3px focus ring.
At 640px the page reflowed with `scrollWidth === clientWidth === 640`.

Offline audit: only `localhost` hosts; zero `img/iframe/embed/object/video/audio` and zero
external links on both screens; the only `fetch(` in source is the local API client and the
only `window.open` is a comment.

Fingerprints unchanged: client `8e7a6c98…038a7687`, synthetic `2779b039…09afde1`. Database:
100 definitions (100 active, 100 with synthetic assets, **511 assets**), legacy 40, and the
verification candidate with its 1 attempt / 10 runs / 60 events was deleted afterwards -
0 attempts, runs and events remain.

### Known limitations

**Feedback quality varies by scenario**, because it is client-authored content rendered
verbatim: on some scenarios `safe_action` is the generic stage-6 boilerplate and
`prevention_habit` repeats the single cue. That is a content property, not a UI defect, and
improving it would mean inventing client content. No practice mode exists, so remediation
names families without linking anywhere. Comparison covers one previous attempt, not a
trend. The no-horizontal-overflow check remains a browser measurement rather than a unit
assertion, because jsdom has no layout engine.

---

## 15.37 ADMIN-005 — Append-Only Instructor Audit Log Foundation (COMPLETED 6 September 2026)

**Status:** COMPLETED · backend only, no frontend touched
**Design record:** [`docs/ADMIN_AUDIT_LOG.md`](docs/ADMIN_AUDIT_LOG.md)
**Result:** a reusable append-only audit service the Admin tasks can call from inside their
own transactions. Nothing writes to it yet, and no history was backfilled.

### Why a service and not a route

The single most consequential decision: **there is no write route.**

An audit entry is a side effect of an administrative change, written inside that change's
own transaction - never something a client asks for. A `POST /admin/audit` would let an
administrator forge history, which is the one thing an audit log must not permit. `POST`,
`PUT`, `PATCH` and `DELETE` on the audit namespace therefore match no route at all, and a
test drives every one of them as an administrator, as a candidate and unauthenticated,
asserting nothing is created and nothing changes.

`GET /api/admin/audit` is the log's entire HTTP surface: admin-only, paginated, filtered,
read-only.

### Append-only, four ways

1. every identifying field is `immutable`;
2. `pre('save')` refuses **any** save of a non-new document, modified or not;
3. all eight query-level update / replace / delete hooks throw `AuditImmutableError`;
4. the service exposes no update or delete function.

**The stated limit, exercised rather than asserted:** this is a local single-machine
application, so the guarantee is an application-layer one - direct database access still
reaches the collection. A test proves that boundary, and it is why the test fixtures clear
the collection through the raw driver: the model itself refuses, which is exactly the
point. Discovering that mid-task - the guard blocked the suite's own cleanup - was the
clearest possible confirmation it works.

### Three findings worth recording

- **A substring guard rejected a legitimate key.** `scenarios_discarded` contains "card",
  so the sensitive-key check flagged it. `looksSensitive()` now tokenises keys (snake_case
  and camelCase) and matches whole words; multi-word fragments like `account_number` are
  still matched against the whole key. A test pins both directions.
- **A Mongoose trap: `immutable` plus `default`.** `schema_version` carried both. Loading a
  document re-applies the default, marking the immutable path modified, so *every*
  subsequent save failed validation - including one that changed nothing. The field is now
  set at the single write site with no schema default.
- **`pre('save')` is stricter than assumed.** An unmodified `save()` of a loaded entry is
  refused too; Mongoose does not short-circuit it. Two tests were corrected to state that
  rather than the weaker behaviour first written.

### Vocabulary

Seven actions, each traceable to a section 6 capability: `SCENARIO_PUBLISHED`,
`SCENARIO_DEACTIVATED` (publication lifecycle), `SCENARIO_RESET` and `ATTEMPT_RESET`,
`PROFILE_ARCHIVED` (the two instructor controls), `EXPORT_CREATED`, `CONFIG_CHANGED`. Five
resource types, with `ACTION_RESOURCE_TYPES` pinning which each action may name.

> **Follow-up correction (6 September 2026).** The reset capability carries two names.
> `SCENARIO_RESET` is the client-specification compatibility vocabulary, added so the
> required action names are satisfied exactly; `ATTEMPT_RESET` is the precise operational
> action and remains the name to prefer, because section 6's capability is "Reset an
> incomplete attempt". **Both map to the `attempt` resource type** - a reset that named a
> scenario definition would make the log say something untrue - both are stored verbatim
> with no rewriting, and `RESET_ACTIONS` groups them so a reader querying the capability
> finds both. Additive only: no validation, immutability, metadata, auth, transaction or
> idempotency behaviour changed.

Metadata is a 14-key **allowlist** of scalars, capped at 200 characters, with the
word-matching sensitivity guard as a second layer. A rejection names the offending key and
never echoes the value, because the value is precisely what might be sensitive.

### Authentication and transactions

Reuses the existing admin identity exactly - `requireAdmin`, the signed `admin_session`
cookie, the `AdminUser` collection. **No second authentication system.** `append()` takes
the resolved AdminUser *document*, not an id or a name, so an actor cannot be conjured from
a string.

`append({ session })` joins a caller's transaction and never opens one of its own. Two
tests prove it: an entry committed inside `withEngineTransaction` survives, and one whose
transaction aborts leaves nothing. An optional `idempotencyKey` makes a retried operation
record once, via a unique partial index.

### Files

**Created:** `src/constants/auditLog.js` · `src/models/AuditEvent.js` ·
`src/services/auditService.js` · `src/controllers/auditController.js` ·
`tests/auditLog.test.js` (24) · `tests/auditLogApi.test.js` (23) ·
`docs/ADMIN_AUDIT_LOG.md`

**Modified:** `src/routes/adminRoutes.js` (one read route) · `scripts/testEngine.js`
(registers the new suite) · this file.

**Unchanged:** every existing model, the engine, selection, scoring, the attempt and result
APIs, all scenario and synthetic data, and the whole frontend.

### Test results

```
backend  npm test              423 tests  304 pass  0 fail  119 skipped
                               (+27 unit; +25 skipped = the new integration suite)
backend  npm run test:engine   ENGINE-001 21/21 · SELECT-002 20/20 · API-001 25/25
                               RESULT-001 28/28 · ADMIN-005 25/25
```

Fingerprints unchanged: client `8e7a6c98…038a7687`, synthetic `2779b039…09afde1`.
Production database untouched: 100 definitions (100 active, 100 with synthetic assets, 511
assets), legacy 40, attempts/runs/events 0, and the one real learner profile intact with
its 10 `seenScenarios`. The `auditevents` collection is **absent** from production, which
is correct - no backfill, and it materialises on the first real administrative action.

### Known limitations

The guarantee is application-layer only (§6 of the design doc). Nothing writes to the log
yet - the callers are ADMIN-001 to ADMIN-004. There is no admin frontend for it, and none
was built. `adminusers` is empty in production, so the read route cannot be exercised there
until `npm run admin:create` is run.

---

## 15.38 ADMIN-001 — Scenario Manager Backend / API (COMPLETED 6 September 2026)

**Status:** COMPLETED · backend only, no frontend touched
**Design record:** [`docs/ADMIN_SCENARIO_MANAGER.md`](docs/ADMIN_SCENARIO_MANAGER.md)
**Result:** create / edit / clone / publish / deactivate over `ScenarioDefinition`, with
publication and deactivation writing their ADMIN-005 audit entry in the same transaction.

### The decision the whole task turns on

A published version is **never rewritten**. `ScenarioRun` pins
`(scenario_id, definition_version)` and the engine loads exactly that document, so
rewriting a published version would silently change the rules of runs already scored
against it. Editing one therefore **branches the next version** as a draft and leaves the
original byte-identical - asserted by snapshotting the whole document before and after.

### One additive field, no migration

`active` alone cannot separate a version that was **never published** from one that was
**published and later retired**, and that difference decides whether an edit may rewrite
it. `lifecycle_state` (`draft` / `published` / `retired`) was added with **no schema
default**; `published_at` alongside it.

The 100 imported scenarios do not carry it and were **not rewritten**: `lifecycleOf()`
resolves them from `active`, and all 100 are active, so all 100 read as `published`.
Verified after the work: `lifecycle_state` is set on 0 production documents.

### Validation reuses DATA-001, and adds the one surface it never had

Three layers: DATA-001's own `pre('validate')` hook (six stages, keys and order,
transitions, per-stage events, asset references, disposition/family agreement, trigger
shape, military flag, platform-vs-id-prefix, scoring envelope); the importer's
`validateOfflineSafety` reused unchanged; and a new `validateSyntheticSafety`.

The third exists because the importer consumed *generated* content, whereas an
administrator can **type** a `display_target`. Every string inside every asset is now held
to the same `RESERVED_HOST_PATTERN` - the same constant, not a second pattern - and an
embedded `data:` URI, a non-inert asset, a duplicate id or an id belonging to another
scenario are each refused.

### Transactions and audit

Publish and deactivate each commit their state change and their audit entry in one
`withEngineTransaction`, through ADMIN-005's session-aware `append()`. Publishing a new
version retires the one that was live inside the same transaction, so exactly one version
of a scenario is ever active, and the retired version's number is recorded in
`previously_active_version` - the allowlist key that existed for precisely this.

`SCENARIO_PUBLISHED` and `SCENARIO_DEACTIVATED` only. **No new audit action type was
invented**, and create, edit, clone and every GET write nothing. A refused publication is
recorded as `failed` with a stable category; a test asserts that entry carries neither a
source location nor the scenario's title.

Republishing what is already live, and re-deactivating what is already inactive, both
report `changed: false` and log nothing - a retried request cannot manufacture a second
entry claiming a second change.

### Three findings from the tests

- **`collectStrings` blew the stack** walking a Mongoose subdocument, whose internals refer
  back to their parent. It now walks a plain object with a depth bound.
- **A shared fixture leaked between unit tests**: a shallow spread shares nested assets, so
  one test mutating an asset body changed every test after it. Deep-cloned per call.
- **Two integration assertions were wrong, not the code.** `rationale` appears in an admin
  response as a member of the resolve stage's *event vocabulary* - authoring content, not
  learner text - so the check is now for the field carrying a value. And Express 5 parses
  `platform[$ne]=x` as a literal key, which is dropped as unknown rather than coerced; the
  service-level defence (values coerced with `String()`) is now tested directly instead.

### Files

**Created:** `src/constants/scenarioLifecycle.js` · `src/services/scenarioManagerService.js` ·
`src/controllers/scenarioManagerController.js` · `tests/scenarioManager.test.js` (26) ·
`tests/scenarioManagerApi.test.js` (32) · `docs/ADMIN_SCENARIO_MANAGER.md`

**Modified:** `src/models/ScenarioDefinition.js` (two additive fields) ·
`src/routes/adminRoutes.js` (eight routes) · `scripts/testEngine.js` · this file.

**Unchanged:** the engine, selection, scoring, the attempt and result APIs, the importer,
the audit model and service, all scenario and synthetic data, and the whole frontend.

### Test results

```
backend  npm test              481 tests  330 pass  0 fail  151 skipped
                               (+26 unit; +32 skipped = the new integration suite)
backend  npm run test:engine   ENGINE 21/21 · SELECT 20/20 · API 25/25 · RESULT 28/28
                               ADMIN-005 25/25 · ADMIN-001 32/32   (3 consecutive clean runs)
```

Fingerprints unchanged: client `8e7a6c98…038a7687`, synthetic `2779b039…09afde1`.
Scenario data untouched: 100 definitions, 100 active, 100 with synthetic assets, 511
assets, legacy 40.

### A production-state note that is NOT this task's doing

Production now holds 1 attempt, 10 runs, 6 events and a **second** learner profile for
"Shabda Kumar Sinha" (identifier 52364356), created 7 September at 04:42 UTC with a live
in-progress attempt. That is the project owner using the application themselves - genuine
learner activity, not test residue. Every ADMIN-001 test runs against the throwaway replica
set on port 27018 with its own `manager_test` database. **Nothing was deleted or altered**,
and `adminusers` and `auditevents` remain 0 in production.

### Known limitations

**`SCENARIO_ID_PATTERN` allows only `01`-`25` per platform and production uses all 100 ids**,
so creating a genuinely new scenario in production would fail for want of a free id.
Clone-to-new-version and edit-as-new-version are unaffected; widening the pattern is a
DATA-001 change and was out of scope. Create and edit emit no audit entry, because
ADMIN-005's vocabulary covers publication, resets, exports and configuration and no action
type was invented. There is no delete - deactivation is the only removal, by design. No
admin frontend was built.

---

## 15.39 ADMIN-002 — Attempt Viewer Backend / API (COMPLETED 7 September 2026)

**Status:** COMPLETED · backend only, no frontend touched
**Design record:** [`docs/ADMIN_ATTEMPT_VIEWER.md`](docs/ADMIN_ATTEMPT_VIEWER.md)
**Result:** a read-only instructor view over attempts — `GET /api/admin/attempts`,
`GET /api/admin/attempts/:attemptId` and a bounded `GET /api/admin/learners` — filtered by
learner and date, showing scores, action path, behaviour breakdown, remediation and
comparison, and carrying no sensitive typed content.

### The decision the whole task turns on

**There is no second authoritative result model.** For a completed attempt the instructor
projection is built from `buildAttemptResult()` — the same RESULT-001 projection the
learner's own result screen uses. Scoring, missed-threat / false-positive classification,
the path replay, the behaviour breakdown, remediation and the comparability gate are all
reused unchanged; this feature adds only the instructor-only classification (disposition,
family, trigger per scenario) and a fresh allowlist serialiser over the top.

`attemptResultService.js` was **not modified**. It carried no ownership check and no
candidate-specific assumption, so no additive change was needed to make it serve an
instructor — and the candidate result API's payload is therefore byte-for-byte unchanged.
A test asserts the instructor's totals, per-scenario scores, outcome classes, paths,
breakdown and remediation are `deepEqual` to what `/api/attempts/:id/result` returns for
the same attempt.

### Incomplete attempts tell the truth rather than filling gaps

`buildAttemptResult()` correctly refuses to build a result for an unfinished attempt, so
the partial view is assembled from its own exported pure helpers (`pathFromEvents`,
`classifyOutcome`, `behaviourBreakdown`) and no scoring maths was written twice.

`total_score` stays **null** — the sum of the resolved scenarios is published separately as
`resolved_points`, so it can never be read as a 0–100 total. Unresolved scenarios are listed
as pending with **no disposition, family, trigger, feedback or path**. The breakdown is
computed from the resolved scenarios only and is labelled `partial`. Remediation and
comparison are `{available: false, reason: "attempt_not_complete"}`.

Verified read-only against the **live production in-progress attempt**: it renders as
1 of 10 resolved, `total_score: null`, `resolved_points: 0`, correct platform coverage,
partial scope, and no rationale leakage.

### Privacy is enforced by hand-written serialisers

Every response object is constructed key by key. Never returned: the learner's typed
`rationale`, `event_id`, `event_code`, `points_delta`, `metadata`, `intent_key`,
`synthetic_target_id`, `client_ts`, `server_ts`, `run_id`, `score_running`, `last_sequence`,
`seed`, `selection`, `scenario_sequence`, the raw `identifier` or `identifierNormalised`,
`seenScenarios`, `evaluation`, `expected_actions`, `scoring`, `stages`, `end_state`, the
authoring `title`, `_id` or `__v`. The service number is masked server-side to its last four
characters, mirroring `frontend/src/utils/maskIdentifier.js`.

Tested by injecting sensitive-looking values directly into `ScenarioEvent.metadata` and into
unknown top-level fields on the event, run, attempt and profile documents, then asserting
every route is free of them.

### Query safety

Filters are an **allowlist** and an unknown one is a `422 FORBIDDEN_FILTER` — rejected, not
ignored. Every filter value must arrive as a plain string, refused *before* any query is
assembled, so no object, array or Mongo operator is ever carried as far as a query. Dates
accept only `YYYY-MM-DD` or a full ISO-8601 instant, are interpreted as **UTC**, apply to
`started_at`, treat a calendar day given as `started_to` as the **end** of that day, and are
validated arithmetically first because `new Date('2026-02-30T00:00:00Z')` silently rolls into
2 March. Ranges are capped at 366 days, page size at 100, and the order is fixed at
`started_at` descending with `_id` as the tie-break.

### Audit

**Nothing is written.** ADMIN-005 records administrative *changes*; reading an attempt is not
one, and no "viewed" action was invented. A test drives all three routes and asserts
`AuditEvent` is still empty. ADMIN-005 is otherwise unchanged.

### One additive index

```js
attemptSchema.index({ started_at: -1, _id: -1 })
```

The instructor list is ordered newest-first across all learners; the two existing indexes
both lead with `profile_id`, so neither serves an unfiltered page. No field, default,
existing index or backfill was touched.

### Files

**Created:** `src/constants/attemptViewer.js` · `src/services/attemptViewerService.js` ·
`src/controllers/attemptViewerController.js` · `tests/attemptViewer.test.js` (23) ·
`tests/attemptViewerApi.test.js` (37) · `docs/ADMIN_ATTEMPT_VIEWER.md`

**Modified:** `src/routes/adminRoutes.js` (three GET routes) · `src/models/Attempt.js` (one
additive index) · `scripts/testEngine.js` (one suite) · this file.

**Unchanged:** `attemptResultService.js`, the engine, selection, scoring, the candidate
attempt and result APIs, the importer, the audit model and service, the scenario manager,
all scenario and synthetic data, and the whole frontend.

### Test results

```
backend  npm test              541 tests  353 pass  0 fail  188 skipped
                               (+23 unit; +37 skipped = the new integration suite)
backend  npm run test:engine   ENGINE 21/21 · SELECT 20/20 · API 25/25 · RESULT 28/28
                               ADMIN-005 25/25 · ADMIN-001 32/32 · ADMIN-002 37/37
                               (2 consecutive clean runs, 188/188)
frontend npm test              81/81 pass    npm run build  clean
frontend npm run lint          STILL BLOCKED - oxlint's native binding is missing on this
                               machine (Windows Application Control). Dependencies were not
                               changed and the policy was not bypassed.
```

Fingerprints unchanged: client `8e7a6c98…038a7687`, synthetic `2779b039…09afde1`.
Scenario data untouched: 100 definitions, 100 active, 511 synthetic assets, legacy 40.

### Production state — unchanged from the start of the task

Snapshot taken before any code was written and re-taken after every test run:

| Collection | Before | After |
|---|---|---|
| `attempts` | 1 (in progress) | 1 (in progress) |
| `scenarioruns` | 10 | 10 |
| `scenarioevents` | 6 | 6 |
| `candidates` | 2 | 2 |
| `scenariodefinitions` | 100 (100 active) | 100 (100 active) |
| `scenarios` (legacy) | 40 | 40 |
| `assessments` | 1 | 1 |
| `adminusers` | 0 | 0 |
| `auditevents` | 0 | 0 |

The live in-progress attempt and both learner profiles are **genuine owner activity, not
test residue**, and were not deleted, completed, reset or altered. Every integration test
runs against the throwaway replica set on port 27018 in its own `viewer_test` database. The
one read-only production check was run with `autoIndex` disabled so it could not create the
new index as a side effect.

### Known limitations

`last_seen_at` is not published because the field does not exist on `Candidate` yet, and a
null would be indistinguishable from "never seen" — adding it is a model change with a
backfill, which a read-only task must not make. `service_no_masked` is derived at projection
time rather than stored. The date filter covers `started_at` only. Remediation names weak
**families**, not scenarios, because practice mode does not exist — the RESULT-001
architecture, preserved deliberately. There is no client-selectable sort. The learner
lookup's `createdAt` sort has no index (single local PC, capped at 50 rows). No admin
frontend, and no export.

### Next task

**`ADMIN-003` — offline CSV/PDF export** to an instructor-selected local path, appending
`EXPORT_CREATED` to the ADMIN-005 audit log. Then `ADMIN-004` instructor controls. **Neither
was started**, and neither was the admin frontend.

---

## 15.40 ADMIN-003 — Offline CSV/PDF Instructor Export Backend (COMPLETED 7 September 2026)

**Status:** COMPLETED · backend only, no frontend touched, no dependency added
**Design record:** [`docs/ADMIN_EXPORTS.md`](docs/ADMIN_EXPORTS.md)
**Result:** an authenticated instructor exports one attempt as CSV or PDF —
`POST /api/admin/exports/attempts/:attemptId` — written to a controlled local directory,
marked TRAINING SIMULATION / OFFLINE / content version, and recorded as `EXPORT_CREATED` in
the ADMIN-005 audit log. `GET /api/admin/exports/:filename` reads an artifact back.

### One dataset, two renderings

`buildAttemptReport()` produces the report **model** from `getAttemptForAdmin()` (ADMIN-002),
which is itself built from `buildAttemptResult()` (RESULT-001). `reportToCsvRows()` and
`reportToPdfDocument()` are pure formatters over that model and read nothing else — no
database, no request, no Mongoose document.

So the CSV and the PDF **cannot disagree** about a score, an outcome or a recommendation;
they are two presentations of one object. **No score is recomputed, no taxonomy re-derived,
and no ScenarioEvent is read** anywhere in the export path.

### No dependency was added

`package.json` is unchanged. No CSV or PDF library is installed, and none was introduced.

- **CSV** — a small RFC 4180 writer: CRLF records, quoting only where required, doubled
  embedded quotes, UTF-8 with a BOM so Excel on Windows decodes it correctly.
- **PDF** — a genuine PDF 1.4 file (catalog, page tree, content streams, cross-reference
  table, trailer) in Courier and Courier-Bold, two of the fourteen PDF **base fonts** every
  reader must provide. Nothing is embedded and nothing is fetched. Monospace makes line
  width exactly computable, which is what lets the writer *guarantee* no text is clipped
  rather than hope.

For an air-gapped defence deployment a dependency is a permanent supply-chain and update
obligation; `pdfkit` would have brought a font-subsetting stack and a dozen transitive
packages to lay out text that is already fixed-width. The trade-off is stated in the doc:
these writers cover this report, they are not general-purpose libraries.

**The PDF was validated as an artifact, not only by assertion** — generated files were
opened in a PDF viewer and read page by page. That is how a real layout defect was found:
the header rule struck through the first body line whenever a page break landed mid-block.
The header now owns a reserved blank row and the rule is drawn inside it; the fix was
re-verified in the viewer.

### Formula injection, without corrupting the figures

A spreadsheet executes a cell beginning with `=`, `+`, `-`, `@`, tab or CR. **Text** cells
starting with one are prefixed with an apostrophe. **Numeric cells never are** — a score of
`-3` must stay the number -3, and neutralising it would corrupt exactly the figures the
report exists to communicate. The writer therefore distinguishes `num()` from `text()`
rather than stringifying everything, because the policy can only be applied correctly if
the type is known.

### "Instructor-selected local path" — what is genuinely possible, said plainly

The requirement says "offline CSV/PDF summary to instructor-selected local path". The
application is a Vite browser frontend talking to a local Node API, and **browser JavaScript
cannot choose a path on the host filesystem. No Electron layer was invented to pretend
otherwise.**

The backend writes into ONE controlled directory — `env.exportDir` (`backend/exports`,
overridable by an operator with `EXPORT_DIR`), server configuration, never a request — and
returns a safe artifact reference. Because DEPLOY-001 binds the API to `127.0.0.1` on the
training PC, the artifact genuinely IS a local file on the instructor's own machine. What is
missing is the native "Save As" dialog, which belongs to a desktop integration layer that
does not exist. **This is the foundation for that layer, and the documentation says so.**

### No client-supplied path reaches the filesystem

There is no code path from a request body to a directory, a filename or an extension.

1. Path-shaped body fields — `path`, `destination`, `output_path`, `directory`, `filename`,
   `save_as`, `export_dir`, `url`, `upload_url` and their variants — are **rejected, not
   ignored**, naming the offending field.
2. The artifact name is entirely server-generated:
   `training-attempt-<attempt id>-<YYYYMMDDTHHMMSSZ>-<8 hex>`, so it structurally cannot
   carry `..`, a separator, a drive letter, a UNC prefix, a null byte or a reserved device
   name. The write uses the `wx` flag, so an existing file is never overwritten.
3. The read route parses a filename into a validated id plus a known extension, and the
   resolved path must be a direct child of the export root.

Refused by test: `../../etc/passwd`, `..\..\windows\system32\config\sam`, `C:\Windows\win.ini`,
`\\server\share\report`, `//server/share/report`, an embedded null byte, `CON`, `NUL`,
`.env`, `package.json` and `web.config`.

### The filesystem is not transactional, and this does not claim it is

```
1. build the report in memory
2. write to <exportDir>/.pending/<artifact>.part, verify the size on disk
3. append EXPORT_CREATED inside withEngineTransaction
     failure -> delete the part-file.  NO UNAUDITED EXPORT IS LEFT BEHIND.
4. rename into place
     failure -> delete the part-file, 500 EXPORT_FINALISE_FAILED
```

Transaction support is asserted **before** anything is written. The audit append is given
the caller's session and opens no transaction of its own, so nothing nests. A test forces
the audit writer to fail and asserts both the export and pending directories are left empty
with no entry written.

**The one honest gap, documented rather than hidden:** step 4 runs after the audit commits.
It is a rename within one directory on one filesystem, but if it fails the append-only entry
stands with no artifact behind it. The API says so and tells the operator to re-run.

### Idempotency without a new model

ADMIN-005's unique index on `idempotency_key` **is** the idempotency store. A retry with the
same key finds the existing entry and rebuilds the original result from it — artifact id from
`resource_id`, format and attempt from the metadata, timestamp from `occurred_at`, size by
stat-ing the file — returning `replayed: true` and a 200 rather than a 201. No export
catalog, no second collection, no new database model. `location.artifact_present` is reported
honestly, because an instructor may have moved the file.

### Audit

One `EXPORT_CREATED` / `export` entry per successful export, through the existing
`append()`. Metadata uses only ADMIN-005's existing allowlist — `export_format`,
`export_scope`, `export_record_count`, `attempt_id`, `attempt_status`. **No new action,
resource type or metadata key was invented.** The entry carries no report content, no learner
text and **no filesystem path** — asserted by test. The read route appends nothing.

### Privacy

The export inherits the ADMIN-002 allowlist and narrows it: the report model names every
field it copies. Absent from both artifacts and every response: the typed `rationale`, every
event field (`event_id`, `event_code`, `points_delta`, `metadata`, `intent_key`,
`synthetic_target_id`, timestamps), `run_id`, `score_running`, `seed`, `selection`,
`scenario_sequence`, the raw and normalised service numbers, `seenScenarios`, `evaluation`,
`expected_actions`, `scoring`, `stages`, `end_state`, the scenario **authoring title**, and
`_id`/`__v`. The service number appears masked to its last four characters.

**A privacy assertion was corrected during the work rather than left flaky.** An early test
searched the rendered CSV for the word "password"; it failed intermittently because scenario
E15's own authored feedback reads *"A consent screen can grant access without asking for a
password"* — client content the specification requires the export to carry. The check is now
structural (a deep key scan of the report model) plus a search for real secret **values**:
the seed, the raw identifier, every run id, event id, intent key, event code and scenario
title. Testing the client's prose was the bug; the code was correct.

### Incomplete attempts

ADMIN-002 semantics carried through: `total_score` stays **null**, the resolved sum is
published separately as `resolved_points`, unresolved scenarios are listed as `NOT RESOLVED`
with no score, disposition, family, trigger, path or feedback, the breakdown is labelled
`partial`, and remediation and comparison report `attempt_not_complete`. Exporting changes
nothing — a test exports a five-scenario attempt twice and asserts the document is
byte-identical and the learner still resumes at ordinal 6.

### Files

**Created:** `src/constants/export.js` · `src/services/exportReportService.js` ·
`src/services/exportService.js` · `src/utils/csvWriter.js` · `src/utils/pdfWriter.js` ·
`src/controllers/exportController.js` · `tests/export.test.js` (27) ·
`tests/exportApi.test.js` (25) · `docs/ADMIN_EXPORTS.md`

**Modified:** `src/routes/adminRoutes.js` (two routes) · `src/config/env.js` (`exportDir`) ·
`backend/.gitignore` (`exports/`) · `scripts/testEngine.js` (one suite) ·
`docs/ADMIN_ATTEMPT_VIEWER.md` (one corrected row — see below) · this file.

**Unchanged:** `package.json` and every dependency, `attemptResultService.js`,
`attemptViewerService.js`, the engine, selection, scoring, the candidate APIs, the importer,
the audit model and service, the scenario manager, all scenario and synthetic data, and the
whole frontend.

### A correction to the ADMIN-002 documentation

`docs/ADMIN_ATTEMPT_VIEWER.md` claimed that a **resolved** scenario inside an **in-progress**
attempt carries its feedback card. It never did: the in-progress path does not read the
RESULT-001 projection, so `feedback`, `sender` and `preview` are null there. Found while
reading a generated report. **The documentation was corrected to match the code; the
behaviour was not changed**, because releasing authored feedback for an attempt still in
flight is a deliberate ADMIN-002 decision and changing it was out of scope here.

### Test results

```
backend  npm test              593 tests  380 pass  0 fail  213 skipped
                               (+27 unit; +25 skipped = the new integration suite)
backend  npm run test:engine   ENGINE 21/21 · SELECT 20/20 · API 25/25 · RESULT 28/28
                               ADMIN-005 25/25 · ADMIN-001 32/32 · ADMIN-002 37/37
                               ADMIN-003 25/25        213/213, 3 consecutive clean runs
frontend npm test              81/81 pass    npm run build  clean
frontend npm run lint          STILL BLOCKED - oxlint's native binding is missing on this
                               machine (Windows Application Control). Dependencies were not
                               changed and the policy was not bypassed.
```

Fingerprints unchanged: client `8e7a6c98…038a7687`, synthetic `2779b039…09afde1`.
Scenario data untouched: 100 definitions, 100 active, 511 synthetic assets, legacy 40.

### Production state — unchanged from the start of the task

| Collection | Before | After |
|---|---|---|
| `attempts` | 1 (in progress) | 1 (in progress) |
| `scenarioruns` | 10 | 10 |
| `scenarioevents` | 6 | 6 |
| `candidates` | 2 | 2 |
| `scenariodefinitions` | 100 (100 active) | 100 (100 active) |
| `scenarios` (legacy) | 40 | 40 |
| `assessments` | 1 | 1 |
| `adminusers` | 0 | 0 |
| `auditevents` | **0** | **0** |

**No production export was created and no production audit entry was written.** The
production database was read for verification only, with `autoIndex` disabled, and the report
was rendered to a scratch file — deliberately NOT through `createAttemptExport()`, because
`AuditEvent` is append-only and a verification entry could never be removed. Every
integration test runs against the throwaway replica set on port 27018 in its own
`export_test` database, with the export directory redirected to a temporary folder.
`backend/exports/` is empty and git-ignored.

### Known limitations

No native instructor-selected path — the artifact lands in the configured local export
directory, and the save dialog belongs to a desktop layer that does not exist. Single-attempt
scope only; no bulk or filtered export. A rename failure after the audit commits leaves an
entry with no artifact, documented because an append-only log cannot be retracted.
Hand-written CSV and PDF writers: sufficient for this report, not general-purpose — no
embedded fonts, images, proportional layout or charts. No artifact retention or cleanup
policy; artifacts accumulate until an operator removes them, and a retention rule would be an
instructor control. No admin frontend.

### Next task

**`ADMIN-004` — instructor controls**: reset an incomplete attempt, archive a profile, and
configure training-versus-assessment feedback timing, appending `ATTEMPT_RESET`,
`PROFILE_ARCHIVED` and `CONFIG_CHANGED`. **Not started**, and neither was the admin frontend.

---

## 15.41 ADMIN-004 — Instructor Controls Backend / API (COMPLETED 7 September 2026)

**Status:** COMPLETED · backend only, no frontend touched, no dependency added
**Design record:** [`docs/ADMIN_INSTRUCTOR_CONTROLS.md`](docs/ADMIN_INSTRUCTOR_CONTROLS.md)
**Result:** the three section 6 controls — reset an incomplete attempt, archive a learner
profile, configure training-versus-assessment feedback timing — each transactionally coupled
to its ADMIN-005 audit entry. **This completes the instructor half of specification
section 6.** All four Admin backend tasks are now done.

### Reset uses a lifecycle state the model already declared

`ATTEMPT_STATUSES` has carried `abandoned` since SELECT-002 and nothing ever produced it. A
reset moves the attempt `in_progress -> abandoned` and its unresolved runs `active ->
abandoned`, and **that is the whole state change**.

The consequence is that **no query had to change**. Every learner path already asks for
`status: 'in_progress'`:

```
findActiveAttempt      -> null, so GET /attempts/current has nothing to resume
createAttempt guard    -> the learner may start a fresh attempt immediately
events / resolve       -> 409 ATTEMPT_NOT_IN_PROGRESS
completeAttempt        -> 409, so a reset attempt can never become completed
buildAttemptResult     -> 409 ATTEMPT_NOT_COMPLETE, so no result is ever produced
```

The one path with no status check was `GET /:attemptId/current-run` — read-only, so it could
never advance anything, but it would have kept serving the next scenario to a learner
holding the id. A three-line guard now returns `run: null` for every terminal state rather
than only for a completed attempt as a side effect of all ten runs being resolved.

**Nothing is deleted.** The attempt, all ten runs, every resolved score and the entire event
ledger stay exactly where they are. Deleting would have been simpler and much worse: the
ledger is the record every score is reproducible from, and a reset that erases it destroys
the evidence of the thing being reset. No score is written, no total computed, no result
fabricated, and no replacement attempt created.

### Archive is three additive fields and no backfill

`Candidate` gained `archived` (default false), `archived_at` and `archived_by`. The default
means the existing profiles read as active without a single row being rewritten. No identity
field was added — 15.16 and specification section 2 prohibit phone, email and rank.

Archival is **not deletion and there is no delete route.** The profile, its completed and
in-progress attempts, its runs, its events and its audit history all survive, and an
instructor can still inspect and export them.

What changes is access: sign-in returns `403 PROFILE_ARCHIVED`, and a session opened before
archiving returns `401` on its next request. The session check matters — without it a
learner holding a live cookie would keep working for the remaining eight hours.

**Signing in never un-archives.** That was the one place archival could have been undone by
accident: the login path finds a profile by its normalised service number and would
otherwise hand it straight back, quietly reactivating a profile an instructor deliberately
retired.

Archiving deliberately does **not** touch an in-progress attempt. Archival is a statement
about a person's access, not about their work; an instructor who also wants the attempt
closed resets it, and that still works on an archived learner's attempt.

There is no unarchive: section 6 asks for archival and says nothing about reinstatement.

### Feedback timing, with an honest default

One `Configuration` document — `scope` unique and single-valued, so a second row cannot
exist — carrying exactly **two enum fields**, `training_feedback_timing` and
`assessment_feedback_timing`, each `immediate | on_completion`. `strict: 'throw'` means an
unknown path is an error rather than a dropped field, and a test walks the schema to assert
an administrator cannot configure scoring, either taxonomy, selection, evaluation keys, a
security boundary or anything about the network.

**Both defaults are `on_completion`, and that is a deliberate, uncomfortable choice.**
Section 4 says training should be immediate. But no server surface releases feedback
mid-attempt — `buildAttemptResult()` refuses an unfinished attempt and the engine's
transition response carries no feedback — so defaulting to `immediate` would have the API
assert a behaviour the product does not have. An instructor may set `immediate`; it is
validated, versioned and audited, and the GET response says plainly that it is *"recorded as
policy; no server surface releases feedback mid-attempt yet."* `effectiveFeedbackTiming()`
is the single read point a future mid-attempt surface will use.

Feedback timing affects no score, selection or result, so **no attempt pins a configuration
version** — pinning it would imply a reproducibility relationship that does not exist.

### No new audit vocabulary

ADMIN-005 already defined everything used: `ATTEMPT_RESET` (its `PREFERRED_RESET_ACTION`,
because the thing reset is an attempt and never a scenario definition), `PROFILE_ARCHIVED`,
`CONFIG_CHANGED`, the three resource types, and every metadata key. This task is their
first writer.

All three controls run inside `withEngineTransaction` and pass the session to `append()`,
which opens no transaction of its own. **A test proves the coupling** by driving a reset with
an actor `append()` refuses: the attempt is left `in_progress`, no run is abandoned, and no
entry exists. One entry per changed configuration key, because ADMIN-005's `config_key` /
`config_previous_value` / `config_new_value` are singular and each entry should be a
complete statement rather than a diff.

**An operation that changes nothing records nothing** — re-archiving, re-resetting, or
setting a value to what it already is reports `changed: false` and writes no entry, the same
convention ADMIN-001 uses for republication.

### Concurrency, proven rather than assumed

Three concurrent resets produce exactly one state change and one audit entry. Repeated and
concurrent archives leave one entry and never move `archived_at`. Concurrent configuration
updates leave one settings row with entries equal to `config_version - 1`, and a stale
`expected_config_version` is refused with `409` rather than overwriting a colleague's change.
A stale reset after the learner has started a replacement attempt reports `changed: false`
and **never touches the new attempt** — a property of naming one attempt by id, not of a lock.

### Files

**Created:** `src/constants/instructorControls.js` · `src/models/Configuration.js` ·
`src/services/instructorControlService.js` · `src/controllers/instructorControlController.js` ·
`tests/instructorControls.test.js` (19) · `tests/instructorControlsApi.test.js` (28) ·
`docs/ADMIN_INSTRUCTOR_CONTROLS.md`

**Modified:** `src/models/Candidate.js` (three additive archival fields) ·
`src/middleware/session.js` (archived session refused) ·
`src/services/candidateService.js` (archived sign-in refused, never un-archives) ·
`src/controllers/attemptController.js` (current-run status guard) ·
`src/routes/adminRoutes.js` (four routes) · `scripts/testEngine.js` (one suite) · this file.

**Unchanged:** `package.json` and every dependency, the engine, selection, scoring,
`attemptResultService.js`, `attemptViewerService.js`, the export services, the scenario
manager, the audit model and service, all scenario and synthetic data, and the whole
frontend.

### Test results

```
backend  npm test              640 tests  399 pass  0 fail  241 skipped
                               (+19 unit; +28 skipped = the new integration suite)
backend  npm run test:engine   ENGINE 21/21 · SELECT 20/20 · API 25/25 · RESULT 28/28
                               ADMIN-005 25/25 · ADMIN-001 32/32 · ADMIN-002 37/37
                               ADMIN-003 25/25 · ADMIN-004 28/28
                               241/241, 3 consecutive clean runs
frontend npm test              81/81 pass    npm run build  clean
frontend npm run lint          NOW PASSES - see below
```

Fingerprints unchanged: client `8e7a6c98…038a7687`, synthetic `2779b039…09afde1`.
Scenario data untouched: 100 definitions, 100 active, 511 synthetic assets, legacy 40.

### The oxlint blockage has cleared

`npm run lint` **now runs and passes**: 86 files, 104 rules, 0 warnings, 0 errors, exit 0.
The `@oxlint/binding-wasm32-wasi` native binding that was missing throughout ADMIN-002 and
ADMIN-003 is present on the machine again. **No dependency was changed to achieve this** —
nothing in `frontend/package.json` or `node_modules` was touched by this task; the
environment resolved it. Verified not to be a silent no-op: a deliberately bad probe file
was linted, correctly flagged `no-debugger` and `no-eval`, and was then removed.

Sections 15.39 and 15.40 recorded the blockage accurately at the time; it is now resolved.

### Production state — unchanged from the start of the task

| Collection | Before | After |
|---|---|---|
| `attempts` | 2 (1 in progress, 1 completed score 9) | identical |
| `scenarioruns` | 20 (9 active, 11 resolved) | identical |
| `scenarioevents` | 60 | 60 |
| `candidates` | 3 (**0 archived**) | 3 (**0 archived**) |
| `scenariodefinitions` | 100 (100 active) | 100 (100 active) |
| `scenarios` (legacy) | 40 | 40 |
| `assessments` | 1 | 1 |
| `adminusers` | 0 | 0 |
| `auditevents` | **0** | **0** |
| `configurations` | absent | **still absent** |

**No production attempt was reset, no production profile archived, and no production
configuration created or changed.** Production was read for verification only, with
`autoIndex` disabled so the new `Candidate.archived` index could not be built as a side
effect. Every control test runs against the throwaway replica set on port 27018 in its own
`controls_test` database.

### Known limitations

`immediate` feedback timing is recorded but **not yet enforced** — no server surface releases
feedback mid-attempt, and the GET response says so. No unarchive route. Archiving does not
close an in-progress attempt (two deliberate acts, two audit entries). The ADMIN-002 viewer
does not display archival state — changing it was outside this boundary. A reset cannot be
undone; `abandoned` is terminal and the learner starts a new attempt. `Candidate.archived`
gained an additive index. No admin frontend.

### Next task

**The admin frontend / integration task.** Every backend admin capability specification
section 6 requires now exists and is documented: the audit log (15.37), the scenario manager
(15.38), the attempt viewer (15.39), offline exports (15.40) and instructor controls (15.41).
**The admin frontend was NOT started.**

---

## 15.42 ADMIN-006 — Instructor Frontend and API Integration (COMPLETED 7 September 2026)

**Status:** COMPLETED · frontend only, **no backend file changed**, no dependency added
**Design record:** [`docs/ADMIN_FRONTEND.md`](docs/ADMIN_FRONTEND.md)
**Result:** the instructor UI for all five section 6 capabilities — scenario manager, attempt
viewer, offline exports, instructor controls and the audit log — driven end to end in a real
browser against a throwaway database.

### No backend change was needed

Every screen consumes an existing endpoint and an existing projection. **No API mismatch was
found**, so nothing in `backend/` was touched by this task. The only shared-code addition on
the frontend is a `patch` method on `apiClient`, which ADMIN-004's configuration endpoint
needs and which nothing else previously used.

### One guarded branch

The instructor screens are nested inside `AdminLayout`, which itself sits inside the existing
`RequireAdmin`. A screen added later inherits the boundary, the header and the navigation
rather than having to remember them. **No second authentication mechanism was created**: the
guard asks the server who the `admin_session` cookie belongs to, nothing is written to
`localStorage` or `sessionStorage`, and a learner holding only a candidate cookie is
redirected exactly as an anonymous visitor is.

### Every request body is built field by field

`adminApi` names each field it sends. Nothing spreads a component's state into a request,
which matters because ADMIN-001, ADMIN-003 and ADMIN-004 all reject an unknown field rather
than ignoring it — a spread body would fail at the server. Query strings drop empty values,
and every filter control is built from a closed vocabulary that mirrors what the API accepts,
so an invalid value cannot be selected. A test asserts the export call sends exactly
`{ format }`.

### The answer key is behind a deliberate disclosure

The scenario detail API returns the full authoring record **including `evaluation`**, because
an author cannot edit what they cannot see. The UI does not therefore put it on screen: the
feedback block sits behind a collapsed, explicitly labelled toggle, so an instructor checking
which version is live never has the correct answers in front of them by accident.

Scenario **content** is deliberately not editable through the UI — only `owner` and
`review_date`. A web form over the six stages, the synthetic assets and the scoring table is
how a bank of 100 authoritative scenarios quietly drifts from the specification DATA-002
imported it from.

### The known limitations are surfaced, not papered over

- **Creating a new scenario is impossible** while all 100 ids are in use (`01`–`25` per
  platform). The list says so in plain words and points at cloning, which works. **Not
  patched** — carry-forward backend item, as instructed.
- **The browser cannot choose a server path.** The export panel says what actually happened -
  the server wrote the file to its own local export directory, shown as a fact - and states
  that choosing a folder needs the desktop integration that does not exist. "Save a copy" is a
  separate, honest affordance that re-reads the artifact the server already wrote.
- **`immediate` feedback timing is recorded but not enforced.** The settings screen renders
  ADMIN-004's own `enforcement` wording verbatim rather than paraphrasing it away.

### Destructive controls are shaped by what is actually possible

Reset is offered **only where the server would accept it**. For a completed attempt the
control is absent with a sentence explaining why, rather than present-and-disabled: a
disabled destructive control invites someone to hunt for the way to enable it, and there
isn't one.

The archive confirmation **never uses delete language** (asserted by test). It leads with
"Archiving is not deletion" and lists what is kept and what the instructor is accepting.

Configuration is never optimistic: the screen renders what the server confirmed and sends
`expected_config_version` from the value it read, so a stale edit produces a reload prompt
rather than silently overwriting a colleague.

### Privacy

There is no raw event viewer **and nothing to build one from** — the ADMIN-002 payload carries
no event id, event code, point delta, metadata, intent key, seed or frozen sequence, and no
typed rationale. A test walks the rendered attempt detail and asserts none of those names or
values appear. Service numbers are shown masked throughout. The audit screen offers no
mutation control of any kind, not even a disabled one.

### Files

**Created:** `src/components/admin/AdminLayout.jsx` · `AdminPrimitives.jsx` ·
`ConfirmDialog.jsx` · `AttemptExportPanel.jsx` · `AttemptControls.jsx` ·
`src/pages/AdminScenariosPage.jsx` · `AdminScenarioDetailPage.jsx` · `AdminAttemptsPage.jsx` ·
`AdminAttemptDetailPage.jsx` · `AdminSettingsPage.jsx` · `AdminAuditPage.jsx` ·
`src/constants/admin.js` · `src/test/adminFixtures.js` · `src/pages/AdminArea.test.jsx` (43) ·
`docs/ADMIN_FRONTEND.md`

**Modified:** `src/services/adminApi.js` (extended from 3 calls to the full surface) ·
`src/services/apiClient.js` (`patch`) · `src/constants/routes.js` (six admin routes) ·
`src/routes/AppRoutes.jsx` · `src/pages/AdminPage.jsx` (BE-005a placeholder → section
directory) · this file.

**Unchanged:** the entire `backend/` tree, every learner screen, the simulation, the result
screen, all scenario and synthetic data, and both `package.json` files.

### Test results

```
frontend npm test              124 tests  124 pass  0 fail   (+43 new)
frontend npm run lint          0 warnings, 0 errors on 101 files
frontend npm run build         clean
backend  npm test              640 tests  399 pass  0 fail  241 skipped
backend  npm run test:engine   241/241, 3 consecutive clean runs
```

The six new pages initially produced six `react(set-state-in-effect)` lint warnings in a
codebase that had none. They were **fixed rather than tolerated**: no state is set
synchronously inside an effect any more, and a refetch raises its loading flag from the event
that caused it, which is the rule's own guidance.

Fingerprints unchanged: client `8e7a6c98…038a7687`, synthetic `2779b039…09afde1`.
Scenario data untouched: 100 definitions, 100 active, 511 synthetic assets, legacy 40.

### Browser verification, on a throwaway fixture

A separate mongod replica set (port 27019), a separate backend (port 5001) and a separate Vite
server (port 5174) were started against a `browser_verify` database seeded with its own admin,
two learners, one completed attempt and one in-progress attempt. **Production was never used
for verification.**

Verified in the browser: admin login · scenario list · scenario detail and the answer-key
disclosure · attempt list · completed attempt detail · incomplete attempt detail (no total,
resolved points separate, pending scenarios) · CSV export · PDF export · reset absent for a
completed attempt · reset confirmed and applied · archive cancel sending nothing · archive
confirmed and applied · feedback configuration saved · the audit log showing all five
resulting entries · admin logout · an unauthenticated visitor redirected out of the area.

Everything was then torn down: all three servers stopped, the temporary replica-set data
directory removed, and the temporary export directory and every helper script deleted.
`backend/exports/` is empty.

**Not verified:** the sub-640px layout. Viewport emulation would not take effect in the
verification browser (`innerWidth` stayed at the pane width), so this is reported as unverified
rather than claimed. No horizontal overflow was measured at the width available, and the
overflow-container behaviour is covered by test.

### Production state — unchanged

| Collection | Before | After |
|---|---|---|
| `attempts` | 2 (1 in progress, 1 completed score 9) | identical |
| `scenarioruns` | 20 | 20 |
| `scenarioevents` | 60 | 60 |
| `candidates` | 3 (0 archived) | 3 (0 archived) |
| `scenariodefinitions` | 100 (100 active) | 100 (100 active) |
| `scenarios` / `assessments` / `adminusers` / `auditevents` | 40 / 1 / 0 / 0 | unchanged |
| `configurations` | absent | still absent |
| abandoned attempts | 0 | 0 |

No production attempt was reset, no profile archived, no configuration created, no admin
account created and no audit entry written. Every production read used `autoIndex: false`.

### Known limitations

Creating a new scenario is blocked by id capacity (surfaced, not patched). Scenario content is
not editable through the UI by design. `immediate` feedback timing is recorded but not
enforced by the backend. No arbitrary "Save as…" — no desktop layer exists. No cross-attempt
statistics (FE-014 / BE-005b still unbuilt), so the landing page is a directory rather than a
dashboard of invented totals. The ADMIN-002 viewer does not expose archival state, so the UI
cannot show whether a learner is already archived; the action is idempotent. No unarchive,
matching the backend. Sub-640px layout unverified in-browser.

### Next task

Not decided here. **This completes the instructor half of specification section 6, backend and
frontend.** No learner-facing work, no scoring or selection change, and no backend
architectural work was started.

---

## 15.43 ACCEPTANCE-001 — Full Specification / Implementation Gap Audit (COMPLETED 7 September 2026)

**Status:** COMPLETED · **read-only audit — no product code was modified**
**Deliverable:** [`docs/ACCEPTANCE_MATRIX.md`](docs/ACCEPTANCE_MATRIX.md) ·
machine-readable bank audit [`docs/acceptance-scenario-bank.json`](docs/acceptance-scenario-bank.json)

### Method

The authoritative 116-page PDF was extracted in full and read — sections 1–7, the release
acceptance checklist, all four scenario-bank composition statements and Appendix A — and the
checklist was built from the **specification's own wording**, not from this plan. 69
requirements were then assessed against the actual code, the actual database, an actual
browser and the actual test suites.

### Result

| Verdict | Count |
|---|---|
| PASS | 47 |
| PARTIAL | 11 |
| MISSING | 3 |
| VERIFICATION_GAP | 4 |
| INTENTIONALLY_DEFERRED | 2 |
| NOT_APPLICABLE | 2 |

**1 blocker · 5 high-priority gaps.**

> **The blocker was closed on 7 September 2026 by `ACCEPT-002` — see 15.44.**

### The blocker is a verification gap, not a defect

§1 and §6 both name the same pass condition: *"With network disabled, all scenarios, assets,
reports and feedback work. Network monitor shows no outbound attempts."* **That test has never
been run.** Every piece of static evidence says it would pass — 34 URLs in the bank and **0
non-reserved**, 0 data URIs, all 511 assets inert, every phone number in the reserved
`+91 00000` range, no `window.open`/`XMLHttpRequest`/`WebSocket`/device API anywhere in `src`,
no CDN or remote font, a built bundle whose only external strings are XML namespaces and React
error-doc URLs that are never fetched, and no outbound HTTP client in the backend at all — but
the specification asks for an executed test with a monitor, and acceptance cannot honestly
claim one that does not exist.

### What the audit confirmed as genuinely correct

The scenario bank passes **every** structural rule the specification states, verified
programmatically rather than assumed: 100 active, 25 per platform, 8/9/8 difficulty per
platform, 20 malicious + 5 legitimate per platform (80/20 overall), military counts of
10/12/8/5 matching each bank's own stated composition, six correctly ordered stages with
transitions and events on all 100, 12 scoring entries per scenario across the full specified
event vocabulary with four critical-flagged codes, complete feedback and end-state on all 100,
511 inert assets with every stage reference resolving, no duplicate id or version.

Also confirmed: the six-stage machine, the nine scoring events at their exact deltas with 0–10
clamping and a 0–100 sum, all nine selection constraints across 400 seeds with a deterministic
seed and no `Math.random` in the selection path, the full §7 result projection including the
missed-threat/false-positive distinction, and all five §6 instructor capabilities with the
append-only audit log.

### The five high-priority gaps

1. **Training-mode immediate feedback is absent.** §4 requires it and §6 requires the timing to
   be configurable. ADMIN-004 stores and audits the setting, and the admin UI honestly says
   `immediate` is not enforced — but no server surface releases feedback mid-attempt, and
   `scoreVisible()` in `attemptMachine.js` has **no consumer**. The control is real and inert.
2. **`ProgressSnapshot` does not exist**, and §7's "exposure count" is not shown. Trend (delta)
   is correct and gated on comparability.
3. **LearnerProfile is incomplete** — `service_no_masked` is derived rather than stored, and
   `last_seen_at` and `briefing_version` do not exist. §2's "log consent/briefing acknowledgement
   as a versioned boolean and timestamp" is **not persisted at all**.
4. **The login screen is missing** the profile-found card, the storage-error state and the
   Instructor help / Exit footer — two of §2's five *"Required states"*.
5. **Dashboard orchestration is incomplete**: no 1–4 second post-idle delivery timer, a single
   notification banner rather than a three-item toast tray, no per-tile last-event preview or
   status dot, no profile-chip menu, no Rules / Report-simulation-issue control.

An architectural note worth recording: **§3's hub is implemented inside the simulation shell**
(`/assessment`), not on `/dashboard`, which remains the FE-007 launcher. The audit accepts that
reading and judged §3 against the simulation shell.

### Four items the specification does NOT require — do not build them

- **Admin statistics dashboard (FE-014 / BE-005b).** The specification contains no
  admin-statistics requirement whatsoever. §6's admin minimum is five capabilities, all
  implemented. `ProgressSnapshot` is a *learner* aggregate, not an instructor dashboard. This
  finally settles a question that has been carried in this plan since Section 11a.
- **Sub-640px reflow.** The specification requires **200% zoom**, which was verified to pass
  (no horizontal overflow, nothing clipped). The 640px rule was this project's own standard.
- **Archived-profile visibility in the attempt viewer.** Not required by §6 or §7; the
  ADMIN-006 limitation is cosmetic.
- **Scenario id capacity.** §6 requires "create"; the release checklist requires *100 active
  scenarios*, which is satisfied. Widening `SCENARIO_ID_PATTERN` is optional and only matters if
  the client actually wants to author a 101st scenario.

### Recommended sequence

1. ~~**ACCEPT-002 — offline acceptance run**~~ — **DONE, blocker RESOLVED (15.44)**
2. ~~**UI-004 — learner shell completion**~~ — dashboard orchestration **DONE (15.45)**;
   the login states remain, as **LOGIN-001**
3. **PROFILE-001 — LearnerProfile fields + briefing acknowledgement**
4. **PROGRESS-001 — ProgressSnapshot and exposure count**
5. **FEEDBACK-001 — training-mode immediate feedback**
6. **ACCEPT-003 — contrast measurement and a keyboard-only run**
7. *(optional)* ADMIN-007 scenario id capacity · EXPORT-002 result-screen exit actions

### Regression totals (nothing changed)

```
backend  npm test              640 · 399 pass · 0 fail · 241 skipped
backend  npm run test:engine   241 · 241 pass · 0 fail   (3 consecutive clean runs)
frontend npm test              124 · 124 pass · 0 fail
frontend npm run lint          0 warnings · 0 errors · 101 files
frontend npm run build         clean
```

Fingerprints unchanged: client `8e7a6c98…038a7687`, synthetic `2779b039…09afde1`, 511 assets,
legacy 40.

### Production state

`attempts` 2 → **3** and `scenarioruns` 20 → **30** during the audit window. **Not this audit's
doing:** attempt `6a9e95b7…` was started at 10:45:11 UTC for the *pre-existing* production
learner `6a9e7f7e…`, with 10 materialised runs and **zero events** — the signature of someone
pressing "Start Assessment" on the other session's dev server, which is still running against
production on ports 5000/5173. All browser work for this audit ran on an isolated stack (mongod
27020, backend 5002, Vite 5175, database `acceptance`, learner "Acceptance Auditor"), none of
which appears in production. Every production read used `autoIndex: false`. Events remain 60,
candidates remain 3, and both original attempts retain their status, score and timestamps.

### Release readiness

**Not yet ready for client acceptance sign-off, but close.** One executed test clears the only
blocker; one frontend task clears the largest cluster of functional gaps; three small additive
tasks close the named data items. Nothing found is a correctness, scoring, selection, privacy or
safety defect.

---

## 15.44 ACCEPT-002 — Offline / Network-Off Acceptance Run (COMPLETED 7 September 2026)

**Status:** COMPLETED · **verification only — no product code was modified**
**Deliverable:** [`docs/ACCEPTANCE_OFFLINE.md`](docs/ACCEPTANCE_OFFLINE.md)
**Outcome: ACCEPTANCE-001 blocker B1 is RESOLVED.**

### What the specification asked for

§1 and §6 name the same pass condition twice: *"With network disabled, all scenarios, assets,
reports and feedback work. Network monitor shows no outbound attempts."* 15.43 found every
piece of static evidence pointing at a pass but the **test itself never executed**. It has now
been executed.

### Network denial — how, given no administrator rights

`netsh advfirewall` returned *"The requested operation requires elevation"*, and the host was
confirmed to have live external connectivity. Denial was therefore enforced at the two layers
that actually carry this application's traffic:

1. **Node processes** — every process started with `node --import` a guard that patches
   `net.Socket.prototype.connect`, `tls.connect`, `dns.lookup`, `dns.resolve*`, `http`/`https`
   `request`/`get` and global `fetch`, refusing anything outside `127.0.0.0/8`, `::1` and
   `localhost`. **13 guarded processes · 0 denials.**
2. **The browser** — the production build was served with a strict CSP
   (`default-src 'self'; connect-src 'self' http://127.0.0.1:5003; frame-src 'none';
   object-src 'none'; …`) sent as a *response header* by the temporary test server. No product
   file, including `index.html`, was touched. **3 CSP violations · all 3 deliberate controls ·
   0 from the application.**

The guard was self-tested before use and **a real bug in it was found and fixed**: the first
version let `net.connect({host:'1.1.1.1'})` through, because `net.createConnection` calls
`socket.connect(normalizeArgs(args))` and so passes the *array* `[options, cb]` rather than the
options object. Worth remembering if this is ever re-run.

### A monitor was discarded rather than trusted

The browser tool's own `read_network_requests` **failed to record two deliberate external
control requests**. A monitor that cannot see an attempt cannot prove there were none, so it
was dropped as evidence and replaced with CSP enforcement — which was then **calibrated** by
firing three external requests from the running application's own page
(`192.0.2.1` TEST-NET-1, `example.com`, `acceptance-control.example`). All three were blocked
and all three were reported. That is what makes the zero meaningful. Recorded as finding **T1
(LOW, tooling only)**; any future offline re-run should use this method.

### Result

```
external attempts by the application  0
scenarios traversed (real engine)     100 / 100, six stages each, 600 events, all resolved
scenarios browser-played              1 end to end + 3 more for the other platform renderers
assets resolved locally               511 / 511, 0 external dependencies, 0 non-inert
scoring paths verified                9 / 9 at the specified deltas, 0-10 clamp proven
result + feedback                     4 breakdown axes, remediation, comparison — all offline
admin area                            login, scenarios, attempts, CSV, PDF, settings, audit
CSV export                            11,702 bytes, TRAINING SIMULATION + OFFLINE markers
PDF export                            24,377 bytes, valid %PDF/%%EOF, no /URI /JavaScript
                                      /Launch /EmbeddedFile /FontFile, no http(s)
```

**Full 100-scenario browser play was not attempted and is not claimed.** The three tiers are
reported separately in the deliverable: 100 engine-traversed through the same `submitIntent()`
the browser calls, 4 browser-played, 100 statically verified.

Everything ran on the **production build** (`npm run build`), temporarily pointed at the
isolated backend and **restored to its normal `.env` afterwards**.

### Regression totals (nothing changed)

```
backend  npm test              640 · 399 pass · 0 fail · 241 skipped
backend  npm run test:engine   241 · 241 pass · 0 fail   (3 consecutive clean runs)
frontend npm test              124 · 124 pass · 0 fail
frontend npm run lint          0 warnings · 0 errors · 101 files
frontend npm run build         clean
```

Fingerprints unchanged: client `8e7a6c98…038a7687`, synthetic `2779b039…09afde1`, 511 assets,
legacy 40.

### Production state — unchanged in every collection

| Collection | At the start of this run | At the end |
|---|---|---|
| `attempts` | 4 | 4 |
| `scenarioruns` | 40 | 40 |
| `scenarioevents` | 112 | 112 |
| `candidates` | 4 (0 archived) | 4 (0 archived) |
| `scenariodefinitions` | 100 (100 active) | 100 (100 active) |
| `scenarios` / `assessments` / `adminusers` / `auditevents` | 40 / 1 / 0 / 0 | unchanged |
| `configurations` | absent | still absent |
| abandoned attempts | 0 | 0 |

All state-changing work used a throwaway replica set (mongod 27021, backend 5003, static
server 5176, database `offline_accept`). No production admin user, audit entry or
configuration document was created; no production attempt was reset and no profile archived.

> **The baseline in 15.43 had already moved.** That section recorded 2→3 attempts and 20→30
> runs; by the start of ACCEPT-002 production stood at **4 attempts / 40 runs / 112 events /
> 4 candidates**. The other development session on ports 5000/5173 continues to write to
> production between tasks. That is pre-existing activity, it was left untouched, and the
> comparison above uses the counts measured at the start of *this* run.

### Cleanup

All three temporary servers stopped and their ports confirmed free; the temporary replica-set
data directory, export directory, denial and CSP logs and every helper script removed; zero
`tmp-*` files remain in the repository; `backend/exports/` is empty. The isolated admin
credential was held **outside the repository**, never written to source, `localStorage` or
`sessionStorage`, and was deleted.

### What this changes for the plan

**Blocker B1 is RESOLVED and there is no blocker left.** No product defect was found — the
only finding is T1 above, about the verification tooling. The project can proceed to the next
implementation phase.

Remaining 15.43 work, unchanged in priority and none of it blocking:

1. ~~**UI-004** — learner shell completion~~ — dashboard orchestration **DONE (15.45)**;
   the login states remain, as **LOGIN-001**
2. **PROFILE-001** — LearnerProfile fields and persisted briefing acknowledgement
3. **PROGRESS-001** — `ProgressSnapshot` and exposure count
4. **FEEDBACK-001** — training-mode immediate feedback (the ADMIN-004 control is real but inert)
5. **ACCEPT-003** — contrast measurement and a keyboard-only run
6. *(optional)* ADMIN-007 scenario id capacity · EXPORT-002 result-screen exit actions

`FE-014` / `BE-005b` admin statistics remains **CANCELLED**. Do not build it.

### Next task

**`UI-004` — learner shell completion.** Nothing in ACCEPT-002 changed the backend, the
scoring, the selection, the scenario bank or the instructor area, so UI-004 starts from exactly
the codebase 15.42 left behind.

> **Superseded by 15.45.** UI-004 was scoped to dashboard orchestration and is complete. The
> login states it also named are now **LOGIN-001**, which is the next task.

---

## 15.45 UI-004 — Dashboard Activity Orchestration (COMPLETED 8 September 2026)

**Status:** COMPLETED · frontend only, **no backend file changed**, no dependency added
**Design record:** [`docs/SIMULATION_UI.md`](docs/SIMULATION_UI.md) section 15
**Closes:** ACCEPTANCE-001 gap **G5** — specification section 3 rows 3.3, 3.6, 3.7, 3.8,
3.10, 3.11, 3.12 and 3.14

### What was missing, and what now exists

| § | Requirement | Before | Now |
|---|---|---|---|
| 3.3 | Chip menu: history, accessibility, restart, logout | menu existed with history/accessibility/logout; **accessibility was never wired and restart was absent** | all four, in the specified order |
| 3.6 | Tiles: unread badge, **last-event preview**, **status dot** | badge only | all three, on one shared tile component |
| 3.7 | Do not lock apps into a fixed sequence | tiles openable; wrong app benign | unchanged and verified; the engine still issues one run at a time |
| 3.8 | Stacked toast tray, **queue at most three** | a single banner | a real tray, capped in the builder **and** the component |
| 3.10 | **Deliver the next event 1-4 seconds after idle** | **no timer existed anywhere** | deterministic per-run window |
| 3.11 | "New activity will arrive shortly" + Resume after interruption | Resume worked; the copy was absent | both, in one orchestrator status zone |
| 3.12 | Rules / Report simulation issue | **neither existed** | both, in the shell footer at every stage |
| 3.14 | Wrong app shows benign items only | unverified | verified in browser and by test |

**3.3 was recorded as MISSING by 15.43 and that was not quite right.** `AttemptHeader`
already contained a `LearnerMenu`; what was actually wrong is that `SimulationPage` never
passed `onAccessibility`, so only two entries rendered, and restart did not exist at all.
Recorded here rather than quietly fixed.

### The delivery window is deterministic, and owns nothing

`deliveryDelayMs(runId)` is an FNV-1a hash of the run id mapped into `[1000, 4000]` ms.
Same run, same wait — a test asserts `2768` for `run-1` rather than tolerating a range —
and **no `Math.random` in the path**, which a test proves by stripping the comments from
the module and searching the code.

It cannot become a second source of scenarios. The engine materialises all ten runs at
attempt creation and issues them by ordinal; the window decides only *when the notification
for the run the server already issued appears on the home screen*. A test asserts that
across the whole window **zero POSTs** are made and the ordinal, resolved count and
sequence are all unmoved. If the timer never fires, server state is untouched.

### One projection, so the badge, the toast and the app list cannot disagree

Section 3 requires that "badge count, toast preview and app list must all reflect the same
scenario state". `state/dashboardOrchestrator.js` is a pure module — no React, no timers,
no fetch — that turns one run into all three. Making them one computation is what makes
the requirement structural rather than something three components must remember.

**Dismissal is read back out of the ledger**, not held in a local flag: `dismiss` is the
only intent that leaves a run at `notify` while writing an event, so a notify run with a
sequence behind it has been dismissed. That is why a reload no longer re-delivers an alert
the learner already waved away — verified in the browser.

**Interruption is derived too.** A run already under way was either walked here in this
session or returned to, and the difference is whether the engine has committed a transition
in this tab. Resume then **re-reads `/attempts/current` and `/current-run`** rather than
clearing a flag, because after an interruption the reducer is the least trustworthy thing
on the page.

### Two decisions worth recording

- **A queued tile carries no badge.** A badge appearing before the toast would tell the
  learner where the next item is about to land, so during the window all four tiles are
  uniformly quiet and a tile pressed then opens the benign empty app and submits nothing.
- **Restart explains, it does not act.** A self-service restart would be a
  learner-authoritative attempt transition — precisely what the section 6 instructor reset
  exists to prevent. The entry is present and honest about who owns it rather than absent,
  or present-and-disabled with no way to enable it. A test asserts no non-GET request
  leaves the page when it is opened.

### The rules panel describes the container, never the content

Rules is reachable at every stage, so one sentence of tactical advice in it would be an
answer key a learner could open mid-decision. It covers synthetic content, the offline
boundary, what is recorded, that marks come at the end, and how to operate the interface. A
test opens it at the branch stage and asserts `malicious`, `legitimate`, `disposition`,
`difficulty`, `easy`, `medium`, `hard`, `attack family`, `expected`, `points` and
`correct answer` are all absent from the dialog.

The simulation-issue panel states its separation from the scenario's Report control in
words rather than implying it by placement, and files nothing — an offline system has no
outbound route, so it gives the scenario reference to quote and the local escalation path
instead of a form that pretends to send something.

### Files

**Created:** `src/state/dashboardOrchestrator.js` · `src/hooks/useActivityDelivery.js` ·
`src/components/simulation/NotificationTray.jsx` · `QueueStatus.jsx` ·
`SupportDialogs.jsx` · `src/state/dashboardOrchestrator.test.js` (20) ·
`src/pages/DashboardOrchestration.test.jsx` (29)

**Modified:** `src/pages/SimulationPage.jsx` (orchestrator wiring, support footer, chip
callbacks) · `src/components/simulation/PhoneHome.jsx` (tiles and tray from the
projection) · `PhoneShell.jsx` (an `activity` prop, defaulting to delivered) ·
`AttemptHeader.jsx` (restart entry) · `TrainingPanel.jsx` (`OnDeviceHint queued`) ·
`src/pages/SimulationPage.test.jsx` and `src/components/simulation/PhoneDevice.test.jsx`
(tray-scoped queries, real delivery wait) · `docs/SIMULATION_UI.md` ·
`docs/ACCEPTANCE_MATRIX.md` (a pointer under section 3) · this file.

**Unchanged:** the entire `backend/` tree, every endpoint, the event vocabulary, the
intents, scoring, selection, the scenario bank, the synthetic assets, the admin area, the
result screen and both `package.json` files.

### Test results

```
frontend npm test              173 tests · 173 pass · 0 fail · 0 skipped   (+49 new)
frontend npm run lint          0 warnings · 0 errors on 108 files
frontend npm run build         clean
backend  npm test              640 tests · 399 pass · 0 fail · 241 skipped
backend  npm run test:engine   241 · 241 pass · 0 fail   (3 consecutive clean runs)
                               ENGINE 21 · SELECT 20 · API 25 · RESULT 28 · ADMIN-005 25
                               ADMIN-001 32 · ADMIN-002 37 · ADMIN-003 25 · ADMIN-004 28
```

The frontend suite is roughly 35 seconds slower than before, on purpose: the delivery
window runs in **real time** rather than on a faked clock. A test that advances its own
timer proves only that a timer exists; waiting proves the notification was genuinely
withheld.

Fingerprints unchanged: client `8e7a6c98…038a7687`, synthetic `2779b039…09afde1`,
511 assets, 100 definitions, legacy 40.

### Browser verification, on a throwaway stack

mongod replica set 27022, backend 5004, Vite 5177, database `ui004_verify`, its own
learner. **Production was never used for verification.**

Verified: the queued hub with all four tiles quiet and "New activity will arrive shortly" ·
delivery of the toast with its badge and matching preview · a tile pressed during the
window opening a benign app and submitting nothing · dismissal clearing the tray while the
badge and preview stay · a reload **not** re-delivering the dismissed alert · the
interruption notice and Resume, with the network log showing Resume re-reading
`/attempts/current` and `/current-run` and issuing no POST · deep-linking from the badged
tile into the thread · the second scenario queueing again after the first resolved (Email
this time, so platform rotation intact) · a quiet tile opening a benign inbox · the chip
menu's four entries · the restart explanation · Rules · Report a simulation issue · logout.

DOM scan on the running hub: no `malicious`, `legitimate`, `disposition`,
`canonical_family`, `canonical_triggers`, `military_flag`, `expected_safe_behavior`,
`points_delta`, `score_running`, `difficulty`, `evaluation` or `seed`; **zero** external
URLs; **zero** `img`/`iframe`/`embed`/`object`/`video`/`audio`; `localStorage` and
`sessionStorage` both empty. Assessment mode showed position and elapsed time and no score.

The isolated database afterwards held exactly 1 attempt, 10 materialised runs, 1 resolved,
and **7 events** for run 1 — one dismissal plus the six ordered stage transitions. No
duplicate run, no extra event, and the frozen sequence untouched.

Everything was torn down: all three servers stopped and their ports confirmed free, the
temporary replica-set data directory removed, and every helper file, the temporary
`.env.ui004` and the temporary `.claude/launch.json` entry deleted. Zero `tmp-*` files
remain and `backend/exports/` is empty.

### Production state — unchanged

| Collection | Before | After |
|---|---|---|
| `attempts` | 5 | 5 |
| `scenarioruns` | 50 | 50 |
| `scenarioevents` | 112 | 112 |
| `candidates` | 4 (0 archived) | 4 (0 archived) |
| `scenariodefinitions` | 100 (100 active) | 100 (100 active) |
| `scenarios` / `assessments` / `adminusers` / `auditevents` | 40 / 1 / 0 / 0 | unchanged |
| `configurations` | absent | still absent |
| abandoned attempts | 0 | 0 |

> The baseline moved again between tasks: 15.44 measured 4 attempts / 40 runs; UI-004
> started at **5 / 50**. The other development session on ports 5000/5173 continues to
> write to production between tasks. Pre-existing activity, left untouched, and the
> comparison above uses the counts measured at the start of *this* task.

### Known limitations

- **The three-toast cap is a guard, not a routinely exercised path.** Every scenario in the
  bank supplies exactly one notification asset and the engine issues one run at a time, so
  the tray holds at most one toast in production. The cap is real code and a unit test
  hands it five.
- **Opening the wrong app is not written to the ledger.** Section 3 says "log navigation",
  but the section 4 event vocabulary has no code for app navigation, and inventing one
  would change the closed event taxonomy this task was told not to touch. It is local
  navigation only. **A recorded decision, not an oversight** — if the client wants it in
  the ledger it needs a new event code and a backend change.
- **The delivery window is per run, not per session.** Reloading during the window restarts
  it for that run — the same deterministic delay, so the item still arrives.
- **The briefing screen still says "This is only practice".** The client has asked for no
  practice language. It is pre-existing copy on `BriefingPage`, outside this task's stated
  scope, and belongs to the wording pass — recorded here so it is not lost.
- **`immediate` feedback timing is still recorded but not enforced** (FEEDBACK-001).
- **Sub-640px layout remains unverified**, as in 15.42.

### Remaining ACCEPTANCE-001 work, and the next task

`G5` is closed. `G4` — the login screen's profile-found card, storage-error state and
Instructor help / Exit footer — sat under ACCEPTANCE-001's UI-004 heading but was **not**
in this task's brief, which was dashboard orchestration only. It is still open.

1. **LOGIN-001** — the section 2 login states: profile-found card, storage-error state with
   Retry, Instructor help / Exit footer. Closes **G4**. Small, frontend-only.
2. **PROFILE-001** — LearnerProfile fields and persisted briefing acknowledgement (G3)
3. **PROGRESS-001** — `ProgressSnapshot` and exposure count (G2)
4. **FEEDBACK-001** — training-mode immediate feedback (G1)
5. **ACCEPT-003** — contrast measurement and a keyboard-only run
6. *(optional)* ADMIN-007 scenario id capacity · EXPORT-002 result-screen exit actions

`FE-014` / `BE-005b` admin statistics remains **CANCELLED**. Do not build it.

**Next task: `LOGIN-001`.** It is the last functional gap in the learner-facing
specification sections 2 and 3.

---

## 15.46 MIGRATION-VERIFY-001 — New Laptop Migration Verification (COMPLETED 8 September 2026)

**Status:** COMPLETED · verification only · **no product file changed, no production
document changed**
**Scope:** confirm the project can resume at `LOGIN-001` from the exact state after UI-004,
on the replacement laptop.

### Environment

| | |
|---|---|
| Node | **v24.15.0** (nvm, `…\Author Software\nvm\installs\v24.15.0`) |
| npm | 11.12.1 |
| MongoDB | 8.3.8, service `MongoDB`, single-node replica set `rs0` |
| Topology | `setName=rs0` · `isWritablePrimary=true` · primary `127.0.0.1:27017` · PRIMARY health 1 |
| Binding | `bindIp=127.0.0.1`, port 27017, `bindIpAll` off |

**The Node runtime was the whole blocker.** The first pass of this audit ran on Node
v22.12.0, where `node:crypto` has no `argon2` export, so `src/utils/password.js` failed to
link and took the server and eight test files down with it. Node 24 is not a preference
here, it is a hard requirement of BE-005a — see 11a. On v24.15.0 `crypto.argon2` is a
function and every one of those failures disappeared. Nothing in the product was changed to
achieve that.

### How the integration suites were run, and why that is safe

The nine integration suites call **unfiltered `deleteMany({})`** on `ScenarioDefinition`,
`Attempt`, `ScenarioRun`, `ScenarioEvent`, `Candidate`, `AdminUser`, `AuditEvent` and
`Configuration`. Pointed at `cyber_awareness_training` they would erase the restored bank.

They cannot reach it. No test imports `src/server.js`, so `connectDatabase()` — the only
code that reads `MONGO_URI` — is never called. The sole connection any suite opens is
`mongoose.connect(process.env.ENGINE_TEST_MONGO_URI)`, and with that variable unset every
suite skips before touching a database.

`ENGINE_TEST_MONGO_URI` was therefore **left unset** and `npm run test:engine` was allowed
to provision its own stack: a throwaway `mongod` on **port 27018**, replica set
`rsEngineTest`, its own `mkdtemp` data directory, each suite in its **own** database. That
is strictly safer than exporting a URI by hand, where one typo would target production.
The production service on 27017 was never a participant.

### Results — the UI-004 baseline reproduced exactly

```
backend  npm test           640 tests · 399 pass · 0 fail · 241 skipped
backend  npm run test:engine 241 tests · 241 pass · 0 fail ·   0 skipped
frontend npm test           173 tests · 173 pass · 0 fail
frontend npm run lint       0 warnings · 0 errors
frontend npm run build      clean (identical asset hashes)
```

**The 241 skips are by design, not an environment fault.** All nine report the same reason,
`ENGINE_TEST_MONGO_URI is not set`, and they are precisely the 241 tests `test:engine` then
runs against the isolated replica set. Per suite: ENGINE 21 · SELECT 20 · API 25 ·
RESULT 28 · ADMIN-005 25 · ADMIN-001 32 · ADMIN-002 37 · ADMIN-003 25 · ADMIN-004 28.
Together the two commands execute 640 distinct tests with **zero** failures.

`npm run verify:replicaset` passes 16/17. The one FAIL is
`cyber_awareness_training.candidates 1 -> 4`, drift against the **4 September
pre-conversion** snapshot in `deploy/mongo-before-state.json`, which predates normal
development. 4 is the correct current figure (15.45). The transaction probe committed with
`{w:1, j:true}` and dropped its own scratch database.

### Data integrity — unchanged

| | Expected | Before | After |
|---|---|---|---|
| `scenariodefinitions` | 100 (100 active) | 100 / 100 | 100 / 100 |
| synthetic assets | 511 | 511 | 511 |
| `scenarios` (legacy) | 40 | 40 | 40 |
| `attempts` | 5 | 5 | 5 |
| `scenarioruns` | 50 | 50 | 50 |
| `scenarioevents` | 112 | 112 | 112 |
| `candidates` | 4 (0 archived) | 4 | 4 |
| `auditevents` / `adminusers` | 0 / 0 | 0 / 0 | 0 / 0 |

Fingerprints unchanged, client `8e7a6c98…038a7687` and synthetic `2779b039…09afde1`, both
recomputed from source with the project's own `bankFingerprint`. Replaying the importer's
own per-document comparison against the restored database read-only — no `create()`, no
`save()` — reports **unchanged: 100 / 100**, so the restore is byte-faithful to the bank.

### Recorded, not fixed

- `backend/package.json` declares **no `engines` field**, which is why npm gave no warning
  when the wrong Node was in front of it. Adding `"engines": { "node": ">=24" }` would make
  this fail loudly instead of at link time. Deliberately left alone — it is a change to a
  product manifest, outside a verification task.
- `cyber_awareness_training` carries an empty collection `__rs0_transaction_test__`, residue
  from a manual pre-restore transaction probe. Not product data; left in place.
- `MONGO_URI` omits `?replicaSet=rs0`, which `utils/transactions.js` and
  `docs/DEPLOYMENT_AND_TRANSACTION_STRATEGY.md` both recommend. Harmless in practice — the
  driver discovers `rs0` and transactions commit — but an explicit URI would be firmer.

### Cleanup

Temporary `mongod` stopped and port 27018 free · its `engine-rs-*` data directory removed
(the harness's own `rm` had left one behind on Windows) · `deploy001_probe_tmp` dropped by
the script that made it · no test database anywhere on 27017 · `backend/exports/` empty ·
no temporary scripts left in the tree. The only file touched under the project root was
`frontend/dist/`, regenerated by the verification build with identical content hashes.

**Next task: `LOGIN-001`.** Unchanged by this checkpoint.

---

## 15.47 LOGIN-001 — Section 2 Login States (COMPLETED 8 September 2026)

**Status:** COMPLETED · frontend only, **no backend file changed**, no dependency added
**Closes:** ACCEPTANCE-001 gap **G4** — specification section 2's profile-found card,
storage-error state with Retry, and Instructor help / Exit footer

### The API was already saying all of this

No new endpoint was added, and none was needed. `POST /candidates` has always answered
**201 with `created: true`** for a profile it created and **200 with `created: false`** for
one the normalised service number already resolved to, and `GET /candidates/me` has always
separated **401** — nobody is signed in — from a status 0 or 5xx, which is the session
failing to resolve against the store at all.

The UI was discarding both. `signIn` returned only the candidate and threw `created` away,
and the provider collapsed every failed session check into "no candidate". LOGIN-001 is
mostly the act of stopping that: `signIn` now returns `{ candidate, created }`, and a
failed check becomes `sessionError` only when `isInfrastructureError` says the store could
not be reached.

That distinction is the whole reason the storage state exists. Showing an empty form to a
learner whose profile could not be read would invite them to register a second time.

### The four states

| State | Reached by | What it does |
|---|---|---|
| Entry | default | The existing two-field flow, validation and creation behaviour **unchanged** |
| Profile found | `created: false` | Display name and **masked** service number, Continue, or "Not you?" |
| Storage error | status 0 or 5xx, from the session check **or** the sign-in | Bounded Retry, entered values preserved |
| Footer | all of the above | Instructor help, Exit |

**A refusal is not an outage.** 403 `PROFILE_ARCHIVED` and 422 stay on the form as inline
errors with no Retry offered, because retrying a real answer just repeats it.

### What the profile-found card is allowed to show

The candidate payload carries `id` and the service number in full — it is the learner's own
record — but the card prints the display name and `maskIdentifier` output and nothing else.
No profile id, no unmasked number, no attempt history, no previous answers. A DOM scan of
the running card found no 24-character ObjectId anywhere in the document, and the raw number
absent.

### Retry is bounded, and cannot loop

Every attempt is one press by the learner: there is no timer and no automatic re-arm, so
the loop cannot start on its own. Three attempts are then allowed before the button
disables and the copy names the instructor instead of inviting a fourth.

Retry repeats *what failed* — the session check, or the sign-in itself with the values still
on screen — rather than a second, subtly different call. **The existing error is held while
a retry is in flight.** Clearing it up front dropped the screen back to the entry form for
the duration of the request, which browser verification caught and a test now pins.

### Exit tells the truth

A page cannot close a window it did not open, so Exit does not offer to and then quietly
fail. It ends the session and clears the entered details — the part that actually matters on
a shared training machine — and says plainly that the window itself must be closed by the
learner or the instructor. Instructor help contacts nobody, contains no link and no external
destination, because there is no outbound route to use.

### Wording

`AuthLayout`'s "This is a practice exercise" is gone, replaced with "Assessment environment.
Your decisions will be evaluated across simulated communications." The synthetic-content
disclosure beside it stays — it is a safety statement, not the casual half — and the
`TRAINING SIMULATION` badge is untouched. **Login copy only**; the rest of the product's
wording pass is not part of this task.

### Files

**Created:** `src/components/auth/LoginSupportDialogs.jsx` ·
`src/pages/LoginPage.test.jsx` (30)

**Modified:** `src/pages/LoginPage.jsx` (the three states and the footer) ·
`src/context/CandidateProvider.jsx` (`created` passthrough, `sessionError`, `retrySession`) ·
`src/services/apiClient.js` (`isInfrastructureError`) · `src/layouts/AuthLayout.jsx` (one
sentence) · this file.

**Unchanged:** the entire `backend/` tree, every endpoint, the `Candidate` model, the
session middleware, validation rules, scoring, selection, the scenario bank, the synthetic
assets, the admin area and both `package.json` files.

### Test results

```
frontend npm test              203 tests · 203 pass · 0 fail · 0 skipped   (+30 new)
frontend npm run lint          0 warnings · 0 errors
frontend npm run build         clean
backend  npm test              640 tests · 399 pass · 0 fail · 241 skipped  (unchanged)
backend  npm run test:engine   241 · 241 pass · 0 fail                      (unchanged)
```

The backend numbers are quoted to show they did not move; no backend file was touched.

### Browser verification, on a throwaway stack

mongod replica set `rsLogin001` on 27019, its own temporary data directory, database
`login001_verify`, backend on 5000 pointed at it by `MONGO_URI`, Vite on 5173.
**Production on 27017 was never a participant** — the verification database ended holding
exactly one candidate and nothing else, and no `login001_verify` exists on 27017.

Verified: the entry form and its validation · a first sign-in creating a profile and going
straight to the briefing · the same identity returning the profile-found card with
`••••••3210` · Continue reaching the briefing · "Not you?" clearing the form and ending the
session · the backend stopped mid-session producing the storage state · Retry announcing
"Retrying now" with the error held and the button busy · the counter falling to 2 of 3 ·
Retry recovering to the form once the backend returned, with no browser refresh · Instructor
help opening as a modal with focus trapped and Escape returning focus to the button that
opened it · Exit clearing both fields and ending the session · the footer present on every
state including the storage error.

DOM scan: no ObjectId, no raw service number, no password input, no external link, no
`img`/`iframe`/`embed`/`object`/`video`/`audio`, `localStorage` and `sessionStorage` both
empty, **zero external requests** across 114 resources. No horizontal overflow at 375px, and
both footer controls are 44px tall.

Production counts before and after the browser run were identical: 100 definitions
(100 active), 511 synthetic assets, 40 legacy scenarios, 5 attempts, 50 runs, 112 events,
4 candidates, 0 audit events, 0 admin users.

### Recorded, not fixed

- **The `LearnerProfile` contract is still the `Candidate` model.** The authoritative
  contract names `profile_id`, `display_name`, `service_no_normalized`, `service_no_masked`,
  `created_at`, `last_seen_at` and a briefing acknowledgement version and timestamp. The
  stored document has `name`, `identifier`, `identifierNormalised`, timestamps and the
  ADMIN-004 archival fields; the masked form is derived at render by `maskIdentifier`, and
  `last_seen_at` and the briefing acknowledgement do not exist. That is **PROFILE-001 / G3**
  by 15.45's own sequence, not LOGIN-001, so it is documented here rather than changed. The
  login screen needs none of the missing fields.
- **Blur validation is suppressed on an untouched form after a reset.** Found in browser
  verification: clearing the form gives the name input autofocus at the same moment the
  closing dialog restores focus to the button that opened it, and the resulting blur was
  reporting "Please enter your full name" over a form the learner had just been told was
  cleared. Suppressed until the learner types; ordinary blur validation is unaffected.

### Next task

**`PROFILE-001`** — the `LearnerProfile` fields and the persisted briefing acknowledgement,
closing **G3**. Then PROGRESS-001 (G2), FEEDBACK-001 (G1), ACCEPT-003, and optionally
ADMIN-007 / EXPORT-002. `FE-014` / `BE-005b` admin statistics remains **CANCELLED**.

---

## 15.48 PROFILE-001 — LearnerProfile Fields and Briefing Acknowledgement (COMPLETED 9 September 2026)

**Status:** COMPLETED · additive schema change, one idempotent backfill, no dependency added
**Closes:** ACCEPTANCE-001 gap **G3** — acceptance matrix rows 2.8, 2.10 and 6.1

### `Candidate` stayed `Candidate`

15.16 classed this model **C — "becomes `LearnerProfile`"**, and the mapping it named was
applied without the rename. `Attempt.profile_id`, `Assessment.candidate` and every event
resolve through this document's `_id`; renaming the model would have touched ownership for
five production attempts, fifty runs and a hundred and twelve events to gain nothing the
projection boundary could not give.

So the authoritative contract is expressed where responses are built, which is exactly where
ADMIN-002 had already put it: `toProfileSummary` was publishing `profile_id`, `display_name`
and `service_no_masked` from `_id`, `name` and `identifier` before this task existed.
PROFILE-001 completes that mapping and persists the three fields that were missing.

| Contract field | Where it lives |
|---|---|
| `profile_id` | `_id` — published on the **instructor** surface only |
| `display_name` | `name` |
| `service_no_normalized` | `identifierNormalised` — server-side only, never published |
| `service_no_masked` | **stored** (new), recomputed from the normalised value on every validate |
| `created_at` | `createdAt` |
| `last_seen_at` | **stored** (new) |
| briefing acknowledgement | `briefing_version` + `briefing_acknowledged_at` (new) |

No password, OTP, Aadhaar, personal email, personal phone, rank or unit was added, and a
test asserts the schema declares no path matching any of them.

### The learner no longer receives what it must not hold

`toPublicJSON()` returned `{id, name, identifier}` — the Mongo ObjectId and the **unmasked**
service number. Both are gone. The learner now receives `display_name`, `service_no_masked`,
`created_at`, `last_seen_at` and `briefing`, and nothing else.

Masking moved server-side with it: `frontend/src/utils/maskIdentifier.js` was deleted,
because a frontend cannot leak a number it is never sent. The admin projections stopped
selecting `identifier` at all for the same reason — the raw value no longer leaves the
database on that path.

**`service_no_masked` is derived from the NORMALISED number, not from what was typed.**
Browser verification caught this: "IC-4587 2H" stored `••••••7 2H` while "IC/45872H" — the
same profile — stored `••••872H`. One profile cannot have two masks, and a mask carrying a
learner's punctuation is a stored typo.

### `last_seen_at`

Written on every successful sign-in, and on a session read only once the value is older than
`LAST_SEEN_THROTTLE_MS` (15 minutes). The throttle is in the **query** — the update matches
only a document already stale — so concurrent requests cannot both write and a learner
reloading the shell cannot drive a write per render. A 401 moves nothing: the refresh happens
after `requireCandidate`, so an unauthenticated or refused request never touches it. Safe
under retry, because it overwrites one timestamp with a later one.

### The briefing acknowledgement

`BRIEFING_VERSION` is one constant. Raising it makes every stored acknowledgement stale and
the briefing is requested again — **re-consent is a comparison, never a deletion**: the
earlier version and timestamp stay on the document, and no attempt, run or event is touched.

The stored form is a version and a timestamp; the "versioned boolean" section 2 asks for is
derived (`briefing_version === required`), so the two cannot contradict each other. Consent
is gated on a checkbox the learner must operate — loading the briefing acknowledges nothing,
and a test drives three session reads to prove it. A version the server does not currently
require is refused with `BRIEFING_VERSION_MISMATCH` rather than stored, so a stale tab cannot
satisfy a briefing it never displayed.

### Compatibility, and the one backfill

All four new fields default to `null`, so the four production profiles — which also predate
ADMIN-004's `archived` and read as active without a backfill — stayed valid unread. A test
inserts a document through the raw driver with none of the new paths and signs in with it.

`service_no_masked` was the **only** new field that can honestly be derived from what is
already stored, so it is the only one backfilled. `last_seen_at` was deliberately left null:
nobody recorded when these learners were last seen, and `updatedAt` is not that date. The
briefing acknowledgement was deliberately left null: a consent record nobody gave is the
thing a consent requirement exists to prevent.

`npm run backfill:profile` was rehearsed against a clone of the production `candidates`
collection on a throwaway replica set first. A field-by-field diff of the clone against the
untouched originals reported *every `_id` preserved; the only difference is the added
`service_no_masked`*. Applied to production it updated 4 and re-ran as `already correct 4`.

### Files

**Created:** `src/constants/learnerProfile.js` · `src/utils/serviceNumber.js` ·
`scripts/backfillLearnerProfile.js` · `tests/learnerProfile.test.js` (16) ·
`tests/candidateProfileApi.test.js` (21) ·
`frontend/src/pages/BriefingAcknowledgement.test.jsx` (11)

**Modified:** `src/models/Candidate.js` (four fields, the projection, `briefingState`) ·
`src/services/candidateService.js` (`touchLastSeen`, `acknowledgeBriefing`, sign-in stamp) ·
`src/controllers/candidateController.js` · `src/routes/candidateRoutes.js` ·
`src/services/attemptViewerService.js` (publishes `last_seen_at`; mask re-exported; queries
stop selecting the raw identifier) · `scripts/testEngine.js` · `package.json` ·
`frontend/src/services/authApi.js` · `frontend/src/context/CandidateProvider.jsx` ·
`frontend/src/pages/BriefingPage.jsx` · `LoginPage.jsx` · `DashboardPage.jsx` ·
`components/simulation/AttemptHeader.jsx` · `src/test/attemptFixtures.js` ·
`LoginPage.test.jsx` · `tests/attemptViewer.test.js` · `tests/attemptViewerApi.test.js` ·
`tests/instructorControls.test.js` · this file · `docs/ACCEPTANCE_MATRIX.md`

**Deleted:** `frontend/src/utils/maskIdentifier.js` — masking is server-side now.

**Unchanged:** scenario content, taxonomy, synthetic assets, scoring, selection, the engine,
the event vocabulary, the audit vocabulary, ADMIN-004 archival behaviour and every attempt,
run and event.

### Test results

```
frontend npm test              214 tests · 214 pass · 0 fail            (+11 new)
frontend npm run lint          0 warnings · 0 errors
frontend npm run build         clean
backend  npm test              677 tests · 415 pass · 0 fail · 262 skipped
backend  npm run test:engine   262 · 262 pass · 0 fail
```

The backend increase is exactly the two new suites: +16 model tests, which run in the unit
command, and +21 API tests, which skip there and run under `test:engine` — so 640 → 677
total, 399 → 415 pass and 241 → 262 skipped, with `test:engine` 241 → 262.

Three test expectations were updated because the contract deliberately changed, not to make
anything pass: the two that pinned `toPublicJSON()`'s old `{id, identifier, name}` keys, and
the learner-lookup row that gained `last_seen_at`. Each kept its "no raw number, no identity
field" assertions, and the `toPublicJSON` one was strengthened with them.

### Browser verification, on a throwaway stack

mongod replica set `rsProfile001` on 27019, database `profile001_verify`, backend on 5004,
Vite on 5177. **Production on 27017 was never a participant.** A pre-existing development
session on 5000/5173 — connected to production, not started by this task — was left running
and untouched, which is why the verification stack used different ports.

Verified: a new learner created with `last_seen_at` stamped and the briefing outstanding ·
the briefing pending with Continue disabled and version 1 named · three session reads
acknowledging nothing · acknowledgement persisting a version and timestamp · a full reload
retaining it with `localStorage` and `sessionStorage` both empty · the profile-found card
for the same profile typed as "IC/45872H" showing `••••872H` · `last_seen_at` advancing on
the returning sign-in · "Not you?" clearing the form and the session (401) · a second learner
signing in with their own pending briefing · an archived profile refused 403
`PROFILE_ARCHIVED`, never un-archived, its acknowledgement and `_id` intact and its
`last_seen_at` unmoved by the refusal.

Live payload on the wire was exactly `{display_name, service_no_masked, created_at,
last_seen_at, briefing{…}}`. DOM and payload scan: no ObjectId, no raw service number, no
password/OTP/Aadhaar/rank/unit, no `identifierNormalised`, no scoring, evaluation, family or
trigger field, no password input, **zero external requests** across 116 resources.

### Production state — unchanged except the one backfilled field

| Collection | Before | After |
|---|---|---|
| `scenariodefinitions` | 100 (100 active) | 100 (100 active) |
| synthetic assets | 511 | 511 |
| `scenarios` (legacy) | 40 | 40 |
| `attempts` / `scenarioruns` / `scenarioevents` | 5 / 50 / 112 | 5 / 50 / 112 |
| `candidates` | 4 | 4 |
| `auditevents` / `adminusers` | 0 / 0 | 0 / 0 |

A key-by-key diff of the four candidate documents shows one difference and no other:
`service_no_masked` added. Every `_id` is unchanged and attempts owned per profile are still
0, 1, 2 and 2. Fingerprints unchanged: client `8e7a6c98…038a7687`, synthetic
`2779b039…09afde1`, 511 assets, 100 scenarios.

### Recorded, not fixed

- **G8 is still open, and the acceptance matrix bundles it into this row.** Row 2.9 and the
  sequencing table pair PROFILE-001 with correcting the login label from "Phone / Service
  Number" to "Personal / Service Number", because the current label and its "10-digit phone
  number" hint invite the value section 2 prohibits. This task was scoped to G3 only, so the
  label is untouched. **G8 needs its own decision** — it is a wording change on a screen
  LOGIN-001 just closed.
- **`auditLogApi` has a pre-existing flaky test.** "A repeated operation carrying the same
  idempotency key records once" depends on a unique partial index being built before the
  test inserts; on a fresh database it occasionally is not. It failed once in five runs of
  `test:engine` and passed in the others, and nothing in PROFILE-001 touches `AuditEvent`,
  `auditService` or index creation. Recorded rather than papered over.
- **`BriefingPage` still says "This is only practice".** Pre-existing copy, flagged in 15.45
  as belonging to the wording pass. PROFILE-001 added the acknowledgement without redesigning
  the screen, so the wording was left where the earlier task put it.

### Next task

**`PROGRESS-001`** — `ProgressSnapshot` and the exposure count, closing **G2**. Then
FEEDBACK-001 (G1), ACCEPT-003, and optionally ADMIN-007 / EXPORT-002 / G8.
`FE-014` / `BE-005b` admin statistics remains **CANCELLED**.

---

## 15.49 PROGRESS-001 — ProgressSnapshot and the Exposure Count (COMPLETED 9 September 2026)

**Status:** COMPLETED · one new derived collection, one new read endpoint, no dependency added
**Closes:** ACCEPTANCE-001 gap **G2** — acceptance matrix rows 6.6 and 7.5

### A derived read model, and the architecture was already decided

`DEPLOYMENT_AND_TRANSACTION_STRATEGY.md` settled this before the task existed:
*"`ProgressSnapshot` is derived and regenerable — **never a write that must be atomic with
anything**"*, generated at attempt completion and *"regenerable at any time"*, with
*"idempotent recomputation"* listed as what EVENT-002 owes. PROGRESS-001 implements exactly
that and invents no new consistency rule.

| Concern | Authority |
|---|---|
| Scenario score | `ScenarioRun.score_0_10` — unchanged |
| Attempt completion and total | `Attempt.status` / `Attempt.total_score` — unchanged |
| Cross-attempt aggregate | `ProgressSnapshot` — **derived, disposable, never read back to decide a score** |

**Idempotency is structural, not guarded.** The rebuild recomputes from the learner's
completed attempts; it never increments. Completing the same attempt five times produces the
identical document, because a recomputation does not know how many times it has run. A
counter would have needed a guard somebody has to remember; this needs none.

### Update semantics

The refresh runs **after** the completion transaction commits and deliberately outside it,
and swallows its own failures — the attempt is already complete and correct, and a snapshot
that never got written is repaired on the next read anyway. It runs on the already-complete
path too, which is what makes a retried completion self-healing rather than merely harmless.

`getProgressSnapshot()` **read-repairs**: it compares the stored `attempt_count` against a
`countDocuments` on the authoritative attempts and rebuilds when they disagree or when no
snapshot exists. The read path therefore cannot serve a stale number.

### The aggregate definitions

| Field | Definition |
|---|---|
| `attempt_count` | Attempts with `status: 'completed'` for this profile. **This is section 7's "exposure count."** `in_progress` and `abandoned` — the state an ADMIN-004 reset moves an attempt to — both count for nothing |
| `scenarios_completed` | Resolved `ScenarioRun`s belonging to those completed attempts |
| `last_score` | `total_score` of the most recently completed attempt |
| `best_score` | Highest `total_score` across completed attempts |
| `by_platform` | `{key, label, scenarios, points, max_points}` per platform, from `ScenarioRun.platform` |
| `by_family` | The same shape per canonical family, from the **pinned** `ScenarioDefinition` |
| `generated_at` | Server clock on every rebuild. A client timestamp is never accepted |

**"Exposure count" resolved, not invented.** The acceptance matrix's own evidence for row 7.5
reads *"there is no **attempt-count** or exposure aggregate on the result screen"*, and the
section 6 entity names the field `attempt_count`. The two are the same figure, so the
completed-attempt count is what the result screen shows. Every richer reading — scenarios
seen by family, by difficulty, by disposition — is precisely the oracle this task must not
build, so none was considered.

### What the buckets deliberately omit

The per-attempt buckets in `attemptResultService` carry `missed_threats` and
`false_positives`. Those are right there: they describe scenarios the learner has just
finished and been given feedback on. Carried across **every** attempt a learner ever takes, a
family bucket reading "missed threats: 3" becomes a standing statement that the family is
malicious — a per-family disposition oracle. The snapshot therefore stores points out of
maximum and nothing else, which says how the learner is doing without saying what the answer
was. Triggers are absent entirely: a persistent cross-attempt trigger profile is the
psychological-vulnerability labelling section 7 forbids.

### Comparability

`comparisonFor()` still owns the section 7 trend and was not touched. The snapshot records
the four `COMPARABILITY_FIELDS` of the latest completed attempt plus `mixed_versions`, set
when the completed attempts do not all share that signature. It is a **disclosure, not a
comparison engine**: when true, the result screen says the best score is not a like-for-like
comparison instead of silently presenting one.

### API and UI

`GET /api/progress`, behind `requireCandidate`. **No profile parameter of any kind** — not in
the path, query or body — so there is nowhere to ask for someone else's progress; ownership
comes from the session cookie alone. The response carries nine keys and no ObjectId, scenario
id, seed, disposition, difficulty, trigger, event or evaluation field.

Section 7 asks the **result screen** for "trend and exposure count", so that is where the
count went: one line beside the existing trend. The dashboard gained one line in the card it
already had — count, last score, best score. No chart, no breakdown, no ranking; the four app
tiles and the rest of both screens are untouched. Progress reports only completed attempts,
so no running score can appear during an assessment.

### Files

**Created:** `src/models/ProgressSnapshot.js` · `src/services/progressService.js` ·
`src/controllers/progressController.js` · `src/routes/progressRoutes.js` ·
`tests/progressSnapshot.test.js` (11) · `tests/progressApi.test.js` (21) ·
`frontend/src/services/progressApi.js` · `frontend/src/pages/DashboardProgress.test.jsx` (11)

**Modified:** `src/services/attemptService.js` (post-commit refresh) · `src/routes/index.js` ·
`scripts/testEngine.js` · `frontend/src/pages/DashboardPage.jsx` ·
`frontend/src/pages/ResultPage.jsx` · `frontend/src/components/result/ResultSummary.jsx` ·
this file · `docs/ACCEPTANCE_MATRIX.md`

**Unchanged:** scoring, selection, taxonomy, scenario content, synthetic assets, the engine,
the event vocabulary, the audit vocabulary, the result projection's own calculations, the
`Attempt` and `ScenarioRun` models, and admin statistics (still **CANCELLED**).

### Test results

```
frontend npm test              225 tests · 225 pass · 0 fail            (+11 new)
frontend npm run lint          0 warnings · 0 errors
frontend npm run build         clean
backend  npm test              709 tests · 426 pass · 0 fail · 283 skipped
backend  npm run test:engine   283 · 283 pass · 0 fail
```

The backend increase is the two new suites: +11 model tests, which run in the unit command,
and +21 service/API tests, which skip there and run under `test:engine`. So 677 → 709 total,
415 → 426 pass, 262 → 283 skipped, and `test:engine` 262 → 283. No existing test needed a
change: the snapshot is additive and the result payload was not altered.

### Migration — none was required

Production holds 5 attempts (2 completed, 3 in progress) across 4 learners and **no
`progresssnapshots` collection**. None was created, because `getProgressSnapshot()` builds a
missing snapshot on first read. Writing four documents whose only purpose is to be
recomputable would have been a production mutation for no functional gain.

It was still proved rather than assumed. The expected values were computed **read-only**
straight from production's attempts and runs, then a full clone of the production database
was restored onto a throwaway replica set and the real service run against it:

| Profile | attempt_count | scenarios | last | best |
|---|---|---|---|---|
| `…6c81` | 0 | 0 | null | null |
| `…8eff` | 0 | 0 | null | null |
| `…8f11` | 1 | 10 | 9 | 9 |
| `…8f63` | 1 | 10 | 13 | 13 |

The rebuild reproduced those figures exactly, a second rebuild was byte-identical apart from
`generated_at`, and the clone's attempts (5), runs (50), events (112) and candidates (4) were
unchanged by it.

### Browser verification, on a throwaway stack

mongod replica set `rsProgress` on 27019, database `progress_verify`, backend on 5004, Vite
on 5177. **Production on 27017 was never a participant.** A pre-existing development session
on 5000/5173 connected to production — not started by this task — was left running untouched,
which is why the verification stack used different ports.

Verified: a new learner reading "0 assessments completed · This will be your first" · a full
ten-scenario attempt completing at 88/100 and the count becoming exactly 1 with 10 scenarios
bucketed across 4 platforms and 8 families · **five repeat completions leaving the count at
1** · a second attempt at 40/100 taking the count to 2 with `last_score` 40 and `best_score`
held at 88 · an attempt with 3 of 10 resolved refused `409 SCENARIOS_OUTSTANDING` and
counting for nothing · a full reload retaining "2 assessments completed · Last score 40/100 ·
Best score 88/100" with `localStorage` and `sessionStorage` both empty · the result screen
showing **both** section 7 elements together: "−48 lower than your previous comparable
attempt (88/100)" and "2 assessments completed so far · best 88/100".

Payload and DOM scan: exactly the nine agreed keys, no ObjectId, no scenario id from either
attempt, no seed, selection, disposition, difficulty, trigger, event code, `points_delta`,
`outcome_code`, rationale or evaluation field, no raw service number, no password input, and
**zero external requests** across 115 resources.

### Production state — unchanged

| Collection | Before | After |
|---|---|---|
| `scenariodefinitions` | 100 (100 active) | 100 (100 active) |
| synthetic assets | 511 | 511 |
| `scenarios` (legacy) | 40 | 40 |
| `attempts` / `scenarioruns` / `scenarioevents` | 5 / 50 / 112 | 5 / 50 / 112 |
| `candidates` | 4 | 4 |
| `auditevents` / `adminusers` | 0 / 0 | 0 / 0 |
| `progresssnapshots` | absent | **still absent** |

Fingerprints unchanged: client `8e7a6c98…038a7687`, synthetic `2779b039…09afde1`, 511 assets,
100 scenarios.

### Recorded, not fixed

- **The task brief asked for the dashboard; the specification asks for the result screen.**
  Acceptance row 7.5 and the sequencing table both place the exposure count on the **result
  screen**, and that is where G2's §7 element actually closes. It was added there and on the
  dashboard, since the brief asked for the dashboard and the second line is one row of text.
- **`by_platform` and `by_family` are stored and published but nothing renders them.** They
  are named by the section 6 entity, so they are computed and available; no screen shows them,
  because a platform or family breakdown on the dashboard is the statistics dashboard this
  task was told not to build. A later task can render them without a schema change.
- **`scenarios_completed` counts only runs of completed attempts.** Resolved scenarios inside
  an attempt still in progress are not "exposure" until the attempt is finished — verified in
  the browser, where three resolved runs of an unfinished attempt left the total at 20.
- **The legacy `/api/assessments` history is untouched.** `HistoryPage` still lists the old
  40-scenario journey; PROGRESS-001 added no score or trend to it, as 15.16 classed that a
  separate **B** change.

### Next task

**`FEEDBACK-001`** — training-mode immediate feedback, closing **G1**. Then ACCEPT-003, and
optionally ADMIN-007 / EXPORT-002 / G8 / G10. `FE-014` / `BE-005b` admin statistics remains
**CANCELLED**.

---

## 15.50 CLIENT-POLISH-001 — Assessment Language and Simulator Presentation (COMPLETED 9 September 2026)

**Status:** COMPLETED · frontend only, **no backend file changed**, no API or data contract
touched, no dependency added
**Driver:** client screenshot review, not an acceptance gap

### What the client said

1. They want *"a glimpse of the individual module simulators"*, and said they *"should appear
   similar to real-world applications"*.
2. A reviewer said the experience is serious and should feel like a test rather than casual
   practice, and that wording implying practice can be changed.
3. A reviewer named one line exactly: *"This is only practice - Only this line can be changed
   with something else, rest is fine."*
4. A reviewer agreed the wording should convey seriousness, because awareness requires the
   learner to take the assessment seriously.

### Part A — the wording, and what was deliberately left alone

An inventory of every user-facing "practice" in the frontend found **two** strings worth
changing, both on `BriefingPage`, plus one framing sentence.

| Where | Before | After |
|---|---|---|
| Briefing safety panel heading | **"This is only practice"** | **"Assessment environment"** |
| Briefing safety point | "All names, numbers, companies and links are made up for practice." | "Every name, number, organisation and link is synthetic content generated for this assessment." |
| Briefing safety point | "…anywhere in this training." | "…anywhere in this assessment." |
| Briefing intro | "This is a controlled training simulation. You will be shown real-looking messages…" | "This is a controlled training simulation, **and it is assessed**. You will be shown realistic communications… **Your decisions are evaluated.**" |

**Every safety fact in that panel survived unchanged in substance.** The panel still says no
real message is sent, no real person is contacted, the content is synthetic, and a real
password or OTP must never be typed. Only the framing moved: the heading had implied the
exercise was optional, which is what the client objected to.

**`RemediationList` and the instructor attempt view were NOT changed**, although both say
"practice". Section 7 requires *"2-3 targeted practice scenarios from weak families"* - that
is the specification's own vocabulary for recommended follow-up training, not casual framing,
and `ResultPage.test.jsx` and `AdminArea.test.jsx` assert it. Changing it would have broken
the specification to satisfy a comment about a different sentence.

**The TRAINING SIMULATION rail was not touched.** The client's feedback was about avoiding
casual wording; the specification separately requires permanent identification that the
communications are simulated, and a learner must always be able to tell. Login, briefing,
dashboard, simulation shell and the instructor exports all still carry it.

### Part B — the four simulators, and the gap that actually existed

The scenario renderers built by UI-002 were already app-specific and realistic. The gap was
somewhere else: **opening an app tile with nothing waiting showed one grey box** reading
"Nothing new in WhatsApp" - identical for all four platforms. A learner only meets the
realistic renderers *inside* a scenario, so a reviewer looking at screenshots could not see
that four distinct simulators exist at all. That is precisely the "glimpse" the client asked
for, and it was the one screen that did not deliver it.

`AppSurfaces.jsx` now draws each platform's own chrome around the same honest empty state:

| Platform | What it now shows |
|---|---|
| **WhatsApp** | Green header, camera / search / overflow, **CHATS · STATUS · CALLS** tab strip, conversation-shaped placeholder rows, round green compose button |
| **Instagram** | White header with the italic wordmark, heart and send, **story rail** with gradient rings, five-icon **bottom navigation** |
| **Email** | Inbox header with menu and search, **Primary / Social / Promotions** category chips, starred message rows, Compose button |
| **SMS** | **Messages** header with search and overflow, conversation placeholder rows, **Start chat** button |

**Entirely inert.** Each surface exposes exactly **one** real control - Back - and a test
asserts that count per platform. There is no `input`, `textarea`, `form`, `a[href]`, `img`,
`iframe`, `video` or `audio` anywhere in them; every icon row, tab strip, story rail and
placeholder row is `aria-hidden` decoration with no handler. Nothing sends, dials, navigates,
uploads, logs in or fetches, and no external image, font or URL is used - the icons are the
local set and the colours are the same design tokens the scenario renderers already use.

The device still sits inside the persistent **TRAINING SIMULATION — OFFLINE** rail, so a
familiar-looking app surface is never mistakable for a live application.

The four platform renderers, the engine semantics, the notification orchestration and the
deep-link behaviour were **not** modified. Opening a quiet app is still local navigation that
submits no intent, records no event and cannot advance a scenario.

### Files

**Created:** `src/components/simulation/AppSurfaces.jsx` ·
`src/components/simulation/AppSurfaces.test.jsx` (39) ·
`src/pages/AssessmentWording.test.jsx` (10)

**Modified:** `src/pages/BriefingPage.jsx` (three strings) ·
`src/components/simulation/PhoneHome.jsx` (the placeholder replaced by `AppSurface`) ·
`src/components/common/SimulationBadge.jsx` (comment only) · this file ·
`docs/SIMULATION_UI.md` (new 15.5a)

**`docs/ACCEPTANCE_MATRIX.md` was deliberately NOT changed.** This task answered client
feedback, not an acceptance gap: no matrix row asserted the old wording, and none of the four
simulators was ever recorded as failing. Row 7.6 still legitimately reads "practice scenarios"
because that is section 7's own remediation vocabulary. Adding a row for a gap that never
existed would misrepresent the audit.

**Unchanged:** the entire `backend/` tree, every endpoint and data contract, scoring,
selection, difficulty and disposition distribution, the taxonomies, scenario definitions,
synthetic assets, `ScenarioRun`, the event vocabulary, `ProgressSnapshot`, the result
calculation, admin permissions and the audit vocabulary.

### Test results

```
frontend npm test              274 tests · 274 pass · 0 fail            (+49 new)
frontend npm run lint          0 warnings · 0 errors
frontend npm run build         clean
backend  npm test              709 tests · 426 pass · 0 fail · 283 skipped   (unchanged)
backend  npm run test:engine   283 · 283 pass · 0 fail                       (unchanged)
```

225 → 274: **+39** simulator tests and **+10** wording tests. No existing test was changed -
the empty state deliberately kept the exact wording "Nothing new in {app}.", so the three
existing assertions in `PhoneDevice.test.jsx` and `DashboardOrchestration.test.jsx` still
pass against the new surfaces. The backend numbers are quoted to show they did not move.

### Browser verification, on a throwaway stack

mongod replica set `rsPolish` on 27019, database `polish_verify`, backend on 5004, Vite on
5177. **Production on 27017 was never a participant**, and a pre-existing development session
on 5000/5173 was left running untouched.

Verified: the login screen reading "Assessment environment. Your decisions will be evaluated
across simulated communications." with the TRAINING SIMULATION badge intact · the briefing
with **no** casual practice wording, "it is assessed", and every safety fact present · all
four simulators opened from the hub and visually distinct · the Email scenario rendering real
synthetic content with `.example` sender and recipient addresses · a scenario interaction at
"SCENARIO 1 OF 10 · STEP 2 OF 6" with the six-stage rail and the action panel · a reload
recovering the exact stage · the Rules dialog trapping focus and returning it on Escape.

At 375×812: no horizontal overflow, 0 overflowing elements, layout reflowed correctly. Across
123 resources: **zero external requests**, zero external anchors, zero `img`/`iframe`/
`video`/`audio`/`embed`/`object` elements, `localStorage` and `sessionStorage` both empty.

### Production state — unchanged

Counts identical before and after: 100 definitions (100 active), 511 synthetic assets, 40
legacy scenarios, 5 attempts, 50 runs, 112 events, 4 candidates, 0 audit events, 0 admin
users. Fingerprints unchanged: client `8e7a6c98…038a7687`, synthetic `2779b039…09afde1`.
No attempt, run or event was written.

### Recorded, not fixed

- **The empty surfaces are static.** They show placeholder rows and an empty state, not a
  browsable list of past conversations - a learner has no message history outside the
  scenario they are in, and inventing one would be fabricated content.
- **"Practice" remains in the section 7 remediation block**, deliberately, for the reason
  above. If the client wants that wording changed too it is a specification question, not a
  polish one.
- **`DashboardPage` and `ResultPage` prose was not revisited.** Neither contained casual
  practice framing; PROGRESS-001 had already set their assessment-oriented wording.

### Next task

**`FEEDBACK-001`** — training-mode immediate feedback, closing **G1**. Then ACCEPT-003, and
optionally ADMIN-007 / EXPORT-002 / G8 / G10. `FE-014` / `BE-005b` admin statistics remains
**CANCELLED**.

---

## 16. IMMERSIVE ASSESSMENT ARCHITECTURE INITIATIVE — PLANNING ONLY (opened 9 September 2026)

**Status: PLANNING COMPLETE · NO IMPLEMENTATION HAS BEGUN.**
**No product code, database document, scenario definition, synthetic asset, test or
dependency was created, modified or deleted by the work that produced this section.**

**Full blueprint:** [`docs/IMMERSIVE_ASSESSMENT_ARCHITECTURE_PLAN.md`](docs/IMMERSIVE_ASSESSMENT_ARCHITECTURE_PLAN.md)
(2,350 lines — executive summary, line-by-line specification audit, a 132-row traceability
matrix, timer architecture, immersive scenario architecture, platform-by-platform realism
strategy, interaction redesign, continuity proposal, security review, accessibility,
performance, roadmap, risk register, testing strategy, acceptance criteria and nine
client-clarification items).

**This section records the initiative in the plan. It is not a task record. No IMMERSIVE task
below is started, in progress or complete.**

---

### 16.1 Why this initiative exists

The client reviewed the working product on 9 September 2026 and gave three new directions:

1. The experience must stop feeling like a quiz, an MCQ, casual practice or an obvious
   training exercise, and must instead feel like a serious immersive assessment in which the
   learner gradually becomes involved in believable, evolving situations.
2. **The assessment must run to a 90-minute, server-authoritative time limit** that survives
   refresh, browser close and application restart, cannot be manipulated from the client, does
   not multiply across tabs, and ends the assessment and generates a result automatically.
3. The profile menu shown during an active assessment (attempt history, accessibility, restart
   assessment, log out) should not offer actions that let a learner leave a live assessment.

An audit was performed before any code was touched. It read the authoritative 116-page client
PDF line by line, every secondary document, and the whole of both source trees.

---

### 16.2 The three findings that shape the initiative

**Finding 1 — the immersion problem is a measured content gap, and it is a deviation from the
client's own specification.**

Every one of the 100 scenarios in `backend/data/synthetic/v1/` holds **exactly one message
bubble** (the 25 email scenarios hold one body paragraph and zero bubbles), and **all 100**
open with a third-person narrator caption rendered inside the conversation. W01's entire
thread is a caption reading *"An unknown number apologizes for entering the learner's number
by mistake."* followed by one message.

The specification requires `prior-message history` (WhatsApp stage 2), `thread history`
(Email stage 2), `prior thread` (SMS stage 3) and *"Read the full thread/message and prior
context before choosing any action"* on all 100 scenarios. **There is no thread to read.**

Six scenarios are named for a dynamic the current content cannot express at all — W12
"Digital Arrest Escalation", W22 "Long-Game Online Friendship", E18 "Hijacked Reply-Chain
Invoice", S09 "Wrong Number Becomes an Investment Pitch", S18 "Bank Header Thread Hijack",
S20 "Parcel Text Plus Callback". W22 in particular asks the learner to judge a relationship
the simulation never let them have.

**This is not a criticism of DATA-003.** `generateSyntheticContent.js:149` records the reason
honestly: the PDF's stage-2 column is a description for the developer, not dialogue for the
learner, and DATA-003 correctly refused to invent dialogue and present it as client content.
What is missing is the authoring step that was always going to be needed after it.

**Finding 2 — the "MCQ" feeling has one architectural cause, and it is one prop.**

`PhoneShell.jsx` passes `actions={[]}` and `onAction={noop}` to all four platform renderers.
The simulated apps are inert during a scenario; every decision is a labelled button in a list
in a panel beside the phone. **The renderers already accept `actions`, `onAction`,
`backAction` and `onOpen` and already render an in-device control row** — they are simply
being fed nothing.

§1 of the specification has a principle row headed **"Action, not quiz"** whose requirement
reads *"Unsafe and safe controls must be interactive."* The redesign therefore closes a
PARTIAL specification row rather than adding a feature, and it submits the **identical
existing intents** to the **unchanged** engine.

**Finding 3 — the 90-minute timer is in no client document.**

Full-text search across the 116-page specification, both Adaptive Human Cyber Risk
Requirements documents, both Offline Developer Brief documents, `Project_Proposal.docx`,
`Final MCTE Proposal.docx`, `Social Engineering Fraud Training PDS.PDF` and the concept brief
returns **zero** occurrences of an assessment duration, time limit, countdown or expiry. The
only "duration" hits are the three-week delivery window and the specification's own per-event
telemetry.

**The timer is an amendment to specification v1.0**, and one of its sub-decisions — how an
unfinished scenario scores at expiry — changes the meaning of the §7 result. It must be
confirmed in writing before it is built (see 16.6).

---

### 16.3 Audit result

| Verdict | Count |
|---|---:|
| PASS | 75 |
| PARTIAL | 21 |
| MISSING | 29 |
| INCORRECT INTERPRETATION | 1 |
| NEEDS ENHANCEMENT | 2 |
| NEEDS CLIENT CLARIFICATION | 3 |
| NOT APPLICABLE | 1 |
| **Total requirement lines** | **132** |

95 lines are the specification's own §1–§7 and Appendix A rows; 37 are new to this audit (35
from the client's 9 September direction, plus rows 3.15 and 5.15).

**Of the 29 MISSING rows, 23 are the client's new direction rather than v1.0 defects.** The
specification-derived MISSING count is six — rows 3.14, 3.15, 4.9, 4.11, 4.12 and 4.13 — and
four of those are exactly what this initiative exists to close. **Against specification v1.0
alone, the product remains where ACCEPTANCE-001 left it.**

One row moved backwards and should be recorded plainly: **row 2.9 is INCORRECT.** The login
field label still reads *"Phone / Service Number"* at `LoginPage.jsx:287` and `:379`, where §2
specifies *Personal / Service Number* and the §2 data contract explicitly prohibits a phone
field. This is G8 from ACCEPTANCE-001, still open. It is a two-string fix and is scheduled as
IMMERSIVE-000.

---

### 16.4 What must not change

The plan is an **additive layer**. Every recommendation in it preserves, untouched:

- the canonical six-stage state machine (`constants/scenarioEngine.js`);
- the nine §5 scoring events and their exact deltas, the 0–10 clamp and the 0–100 sum;
- all nine §5 selection constraints, the deterministic seed and the 400-seed suite;
- the canonical attack-family (19) and trigger (22) taxonomies;
- the `ScenarioDefinition` schema — enriched threads fit inside
  `synthetic.assets[].content`, which is already `Schema.Types.Mixed`, so **no migration is
  required**;
- the event ledger and its metadata allowlist (the vocabulary gains only `RUN_EXPIRED`,
  engine telemetry at zero points);
- the candidate projections as allowlists, with `evaluation` remaining `select: false`;
- `ScenarioRun`, `ProgressSnapshot`, the result projection's existing keys, the admin
  capabilities and the append-only audit vocabulary;
- the offline boundary and every synthetic-content rule DATA-002 and DATA-003 established.

**Nothing in the plan recommends rebuilding the application.** The single largest change —
enriched content — publishes new `ScenarioDefinition` **versions** through the existing
ADMIN-001 lifecycle, with v1 retained and still pinned to historical runs, which is precisely
what `definition_version` pinning was built for.

---

### 16.5 The new task family

Eight tasks, none started.

| Task | Objective | Size | Depends on |
|---|---|---|---|
| **IMMERSIVE-000** | Correct the login label to "Personal / Service Number" (row 2.9 / G8) | XS | none |
| **IMMERSIVE-001** | 90-minute server-authoritative timer: additive `Attempt` fields, expiry service, three enforcement layers, result projection, instructor visibility, learner countdown | L | client C1–C3 |
| **IMMERSIVE-002** | Assessment menu behaviour: history in-shell, logout confirmation, restart relabel, accessibility untouched | S | 001 |
| **IMMERSIVE-003** | Enriched synthetic content — multi-message threads replacing the narrator captions on all 100 scenarios | XL | none |
| **IMMERSIVE-004** | Inhabited environment: benign background items, persona registry, synthetic working-day clock **plus the asset-distribution oracle measurement** | M | 003 |
| **IMMERSIVE-005** | On-device interaction — feed the renderers real `actions`; the MCQ removal | L | 003, 004, ACCEPT-003 |
| **IMMERSIVE-006** | Simulated-surface completion: safe-browser chrome, call-screen timer and captions, the four inspection sheets | M | 003, 005 |
| **IMMERSIVE-007** | Scene director — deterministic timed reveal, typing indicators, in-scenario escalation | M | 003, 005 |
| **IMMERSIVE-008** | Immersion acceptance re-run: offline, accessibility, 200% zoom, long-session soak, bank re-audit, refreshed matrix | M | all |

Full per-task detail — files affected, backend, frontend and database impact, migration,
testing, browser verification, production safety, rollback and dependency order — is in
section 16 of the plan document.

---

### 16.6 Ordering, and the dependency before FEEDBACK-001

```
CLIENT SIGN-OFF  C1 duration · C2 timeout scoring · C3 progress inclusion
        |
        +---------------------------------------------+
        v                                             v
  IMMERSIVE-001 --> IMMERSIVE-002             IMMERSIVE-003
  (90-min timer)    (menu behaviour)          (enriched content)  -- no dependency
        |                                             |
        |                                             v
        |                                      IMMERSIVE-004
        |            ACCEPT-003 --------------->      |
        |            (a11y baseline)                  v
        |                                      IMMERSIVE-005
        |                                             |
        |                                  +----------+----------+
        |                                  v                     v
        |                           IMMERSIVE-006         IMMERSIVE-007
        |                                  +----------+----------+
        +---------------------------------------------+
                                                      v
                                               IMMERSIVE-008

  IN PARALLEL, no dependency on any of the above:
    IMMERSIVE-000  (login label)        -- ship immediately
    FEEDBACK-001   (training feedback)  -- previously the scheduled next task
```

**FEEDBACK-001 is NOT blocked by this initiative.** Its scope — release the per-scenario
feedback card at resolution when the configured timing is `immediate`, gate it with
`effectiveFeedbackTiming(mode)`, wire `scoreVisible()`, change nothing about scoring or the
state machine — touches `attemptResultService`, the resolve response and `ScenarioOutcome.jsx`.
The immersion work touches `PhoneShell`, the renderers, `syntheticScreen`,
`constants/simulation`, the scene director, the synthetic content and `Attempt`. **The only
overlap is `ScenarioOutcome.jsx`, and only if the immersion work moves the outcome card, which
it should not.**

One design agreement binds the two, and it is recorded here so whichever runs first honours
it: **assessment mode stays uninterrupted** (no feedback card, no score, no cue chips between
scenarios — §4 explicitly permits deferring), and **training-mode feedback renders outside the
device frame**, never as a message in the thread. That keeps FEEDBACK-001 free of the
immersion layer and vice versa.

**Recommended sequence:** IMMERSIVE-000 immediately · then client sign-off C1–C3 · then
IMMERSIVE-001, with IMMERSIVE-003 running in parallel from the same moment · then
IMMERSIVE-002 · ACCEPT-003 · IMMERSIVE-004 · IMMERSIVE-005 · IMMERSIVE-006 and 007 ·
IMMERSIVE-008. FEEDBACK-001 slots wherever capacity allows.

**The one ordering rule that must not be broken: IMMERSIVE-005 must not precede
IMMERSIVE-004.** The asset-distribution measurement in 004 is what tells us whether device
affordances leak the disposition; building the affordances first would mean discovering the
leak after it shipped.

---

### 16.7 The two decisions that need the client, before anything is built

**C2 — how does a scenario unfinished at expiry score?** Four options were analysed. The
recommendation is to reuse the engine's existing resolution rule verbatim —
`score_0_10 = clamp(score_running, 0, 10)` — so a never-opened scenario scores 0 naturally and
a partially worked one keeps evidence the ledger shows it earned, while still losing
`RESOLVE_CORRECT`. Forcing zero was rejected because it contradicts §5's *"Positive evidence is
earned"* and would break `verifyRunIntegrity()`'s guarantee that the cached score always
matches a ledger replay.

**C3 — does a timed-out attempt count toward `ProgressSnapshot`?** It has the same mode and
content version as a completed attempt, so §7's comparability gate will admit it and it will
move `last_score`, `best_score` and the trend. The recommendation is to include it, marked —
excluding it would let a learner discard a bad attempt by walking away from it.

Seven further clarifications (C1, C4–C9) are listed in §21 of the plan document, covering the
duration itself, an accessibility time-extension accommodation, the menu conflict between the
client's verbal request and their own §3, content sign-off, the unscoreable **Forward** action
§4 names but §5 gives no event for, cross-platform interruption, and cross-scenario story arcs.

---

### 16.8 Two findings worth recording independently of the initiative

**A latent bug the timer work happens to fix.** `createAttempt()` refuses to create an attempt
when an `in_progress` one exists. There is no deadline today, so **an abandoned attempt blocks
that learner permanently** until an instructor resets it. This is pre-existing and unrelated to
the client's request, but a 90-minute deadline makes abandonment far more likely, and the
expiry sweeper plus the lazy route guard close it.

**A specified event that is never produced.** `link_hover_ms` is declared in
`constants/scenarioDefinition.js:189`, `constants/scenarioEngine.js:203` and
`models/ScenarioEvent.js:35`, and §4's stage-3 core events name it — but
`grep -rn link_hover_ms frontend/src` returns nothing. There is no link to hover: a link is
text inside a bubble and inspection is a side-panel button. IMMERSIVE-005 closes it with no
backend change, because the field, the allowlist entry and the schema slot already exist.

---

### 16.9 Safety boundary, restated as a constraint on this initiative

Several scenarios describe an attacker page *"requesting username, password and OTP"*, *"account,
PIN and OTP"* or *"card/UPI details"*. **None of that requires the product to collect anything** —
it describes what the simulated attacker's page displays, and §6 Privacy forbids any real
password, OTP, payment or biometric field.

The current implementation is **safer than the specification asks**: `LocalSurfaces.jsx` and
`AppSurfaces.jsx` contain zero input, textarea, form and href elements, and the unsafe act is
expressed as the `submit_data` / `attempt_payment` / `attempt_install` **intent** rather than by
typing. There is nothing to tokenise because there is nothing to type.

**Hard rule binding every task in this initiative: no task may add an input, textarea or form
element to any simulated surface.** Realism comes from chrome, copy, layout, timing and
pressure. Where a form is visually necessary, render a non-interactive facsimile plus one
labelled real button that submits the intent — the pattern CLIENT-POLISH-001 proved and tested.

The only legitimate learner text inputs in the product remain the login name and Personal /
Service Number (§2) and the optional 250-character rationale (§4). **No third input may be
added.**

---

### 16.10 Current status of the roadmap

> **Superseded in one row on 9 September 2026:** `IMMERSIVE-000` is now **COMPLETE** — see
> **16.11**. Every other row below still stands.

| Item | Status |
|---|---|
| `IMMERSIVE-000` | **COMPLETE** (9 September 2026) — see 16.11 |
| `IMMERSIVE-001` | **COMPLETE** (9 September 2026) — see 16.12 |
| `IMMERSIVE-002` | **COMPLETE** (9 September 2026) — see 16.13 |
| `IMMERSIVE-003` … `IMMERSIVE-008` | **NOT STARTED** |
| The timer | **IMPLEMENTED** — server-authoritative 90-minute deadline, three enforcement layers, timeout result. See 16.12 |
| The assessment menu | **DONE** — the four §3 items retained; history is in-shell, logout confirms, restart relabelled. See 16.13 |
| Scenario content | **UNCHANGED** — v1, 100 definitions, 511 assets, fingerprints as recorded in 15.50 and re-verified in 16.11 |
| Tests | frontend **315/315**; backend **736** (426 pass, 310 skipped); engine **310/310**. See 16.13 |
| Production database | Pre-existing records **unchanged and byte-identical**; totals grew during 16.13's window from the dev server still running on 5000/5173 against production — **not caused by this work**, see 16.13 |
| `FE-014` / `BE-005b` admin statistics | **CANCELLED**, unchanged |

### Next task

`IMMERSIVE-000` and `IMMERSIVE-001` are done; C1, C2 and C3 were approved and are implemented.
The sequence from here:

1. **`IMMERSIVE-003`** — enriched synthetic content (multi-message threads). No dependency,
   and the largest single win in the plan.
2. `FEEDBACK-001` and `ACCEPT-003` remain **unblocked** and may run in parallel at any point.
3. Then `IMMERSIVE-004` → 005 → 006/007 → 008.

**Before further work:** stop the development server on ports 5000/5173 that is still pointed
at production on a pre-IMMERSIVE-001 build. It has created three `in_progress` attempts with
no deadline, each of which permanently blocks its learner from starting another (16.13).

One new item entered the backlog from 16.11 and is **not** part of any immersive task:
**section 2 identifier validation compliance** (the accepted-input rule still diverges from
"3–24 alphanumeric plus hyphen"). Small, independent, and evidence suggests it is safe for all
four existing profile keys.

---

## 16.11 IMMERSIVE-000 — Login Label Correction, §2 Compliance (COMPLETED 9 September 2026)

**Status:** COMPLETED · **frontend copy plus one backend message** · no schema, no contract, no
data, no behaviour change · no dependency added
**Closes:** immersive-plan matrix row **2.9 (INCORRECT)** and `ACCEPTANCE_MATRIX.md` **G8**,
open since ACCEPTANCE-001 (7 September 2026)
**Plan reference:** [`docs/IMMERSIVE_ASSESSMENT_ARCHITECTURE_PLAN.md`](docs/IMMERSIVE_ASSESSMENT_ARCHITECTURE_PLAN.md)
section 16, task IMMERSIVE-000 — the first task in the immersive roadmap and the only one that
needs no client sign-off.

### Why this task, and why first

The architecture plan orders the roadmap `IMMERSIVE-000 → (client sign-off C1–C3) →
IMMERSIVE-001 …`. IMMERSIVE-000 is the only immersive task with **no dependency of any kind**:
it needs no client decision, touches nothing IMMERSIVE-001 or IMMERSIVE-003 touches, and is
individually reversible. It is also the only open row in the audit graded **INCORRECT** rather
than PARTIAL or MISSING — the product was not merely incomplete against section 2, it
contradicted it.

### What section 2 actually requires

Verified against the authoritative PDF, page 5, this session:

> "Identity — **Personal / Service Number field** — Required; 3-24 alphanumeric characters plus
> hyphen. Store normalized value as the profile key; mask all but the last four characters on
> later screens."

> "Login data contract — … **Do not add password, Aadhaar, phone, email, rank or real unit
> fields to Version 1.**"

The screen named the field "Phone / Service Number" and its hint read "Enter your 10-digit
phone number or your service number." No phone field was ever stored — `Candidate` has none,
and four separate backend test suites already assert that no `phone` key can reach any
projection — but the learner was being **asked** for the one value the data contract prohibits,
which is the same defect one layer up.

**It was not hypothetical.** Of the four profile keys in production, one is a bare 10-digit
all-digit value: a learner read the label and did exactly what it said.

### The estimate was wrong, and the record should say so

The audit scoped this as "two strings" because it grepped for the **label** and not for the
**word**. The real user-facing footprint was **six strings in three files**:

| # | Where | Before | After |
|---|---|---|---|
| 1 | `LoginPage.jsx` field label | "Phone / Service Number" | "Personal / Service Number" |
| 2 | `LoginPage.jsx` field hint | "Enter your 10-digit phone number or your service number." | "The personal or service number issued to you." |
| 3 | `LoginPage.jsx` input placeholder | "Enter phone or service number" | "Enter your personal or service number" |
| 4 | `LoginPage.jsx` profile-found card term | "Phone / Service Number" | "Personal / Service Number" |
| 5 | `validation.js` empty-field error | "Please enter your phone number or service number." | "Please enter your personal or service number." |
| 6 | `candidateService.js` `MISSING_FIELDS` message | "Name and phone / service number are required." | "Name and personal / service number are required." |

Item 6 is the only backend change. The **error code `MISSING_FIELDS` is unchanged**, so the API
contract is untouched; no test asserted the message text.

### The decision that shaped the task: what was deliberately NOT changed

**The client-side validation rule was left exactly as it is, and this was a deliberate call.**

`validateIdentifier()` accepts 6–20 characters, permits spaces and a slash, and demands at
least four digits. Section 2 says **3–24 alphanumeric plus hyphen**. The rule is therefore
simultaneously too narrow (rejects a valid 3–5 character or 21–24 character service number,
and any service number with fewer than four digits) and too wide (accepts spaces and slashes
section 2 does not permit). `maxLength={20}` on the input has the same divergence.

Fixing it **changes which inputs are accepted**, and the identity field is the profile key. A
returning learner whose stored key no longer validates would be locked out of their own
assessment record. That needs its own task with the existing keys audited first — which is why
this task changed the wording and not the rule, and why the code comment in `validation.js`
now states the divergence rather than quietly implying compliance.

The production key audit was taken this session and is reassuring for that future task: all
four keys are 7–10 characters, all-digit, no spaces, no slashes — **every one of them would
still validate under a strict section 2 rule.** Recorded under "Deferred" below.

### Why the defect survived three tasks and a full acceptance audit

`LoginPage.test.jsx` has always carried a test called *"asks for no credential of any kind"*.
It asserts that no field label contains `password`, `otp`, `aadhaar`, `pin`, `email`, `rank` or
`unit` — **seven of the eight words in section 2's prohibition list, omitting `phone`.** The
one word the screen actually violated was the one word the guard did not check.

`phone` is now in that assertion, so the regression cannot recur silently.

### Files

**Modified (5):**

- `frontend/src/pages/LoginPage.jsx` — label, hint, placeholder, profile-found-card term, plus
  a comment recording why the hint describes the identity rather than a format
- `frontend/src/utils/validation.js` — two error messages; the function comment now states the
  section 2 divergence explicitly and marks it deferred. **The rule itself is byte-identical.**
- `frontend/src/pages/LoginPage.test.jsx` — five label matchers updated; `phone` added to the
  forbidden-label assertion; three new regression tests
- `backend/src/services/candidateService.js` — one error message; code unchanged
- `docs/ACCEPTANCE_MATRIX.md` — row 2.9 PARTIAL → PASS, plus a correction note recording that
  PROFILE-001 was assigned G8 and did not close it

**Created:** none.

**Deliberately not touched:** every backend model, service, route, constant and test; the
engine, scoring, selection, taxonomies, `ProgressSnapshot`, the result projection, the admin
and audit systems; all 100 `ScenarioDefinition`s and all 511 synthetic assets; the four
platform renderers; the assessment profile menu (that is IMMERSIVE-002); the attempt lifecycle
(IMMERSIVE-001).

`BriefingPage.jsx` retains the sentence *"Look at the message the same way you would on your
own phone"* — that describes the **simulated device**, not an identity field, and is correct.

### Tests

```
frontend npm test              277 · 277 pass · 0 fail        (274 -> 277)
frontend npm run lint          0 warnings · 0 errors
frontend npm run build         clean  (1924 modules, 487.85 kB)
backend  npm test              709 · 426 pass · 0 fail · 283 skipped   (unchanged)
backend  npm run test:engine   283 · 283 pass · 0 fail                 (unchanged, 11 suites)
```

**The +3 is three new tests, all in `LoginPage.test.jsx`, all regression guards for this
defect.** No existing test was weakened or deleted; one existing test was made **stricter** by
adding `phone` to its forbidden-label list.

1. `names the identity field exactly as section 2 does` — asserts the literal label and that
   the old one is absent
2. `never invites a phone number anywhere the learner can read` — no `/phone/i` in the entry
   screen's visible text or in any placeholder
3. `does not invite a phone number on the profile-found card either` — the same assertion on
   the returning-learner state, which is a separate render

Backend and engine counts did not move, which is the expected result: the only backend edit is
a message string no test asserts.

### Browser verification, on a throwaway stack

mongod replica set `rsImm000` on **27021**, database `imm000_verify`, backend on **5006**, Vite
on **5179**. **Production on 27017 was never a participant**, and the pre-existing development
session on 5000/5173 was left running and untouched.

Verified:

- Entry screen renders **"Personal / Service Number"** with the new hint and placeholder
- **Zero occurrences of `/phone/i`** in the entry screen's visible text and in every placeholder
- Sign-in accepted a service-number-shaped value (`FAL-778291`) — the field works for its
  stated purpose, not only for digits
- Profile-found card shows **"Personal / Service Number"** and masks to the last four
  (`•••••8291`), so section 2's masking rule is intact
- Full journey unbroken: login → profile-found → briefing → dashboard → **Start Assessment** →
  simulation at "Scenario 1 of 10", four platform tiles, notification tray, device shell
- Email simulator rendered synthetic content with reserved `.training.example` sender and
  recipient, and the six-stage rail advanced **STEP 1 → STEP 2 OF 6** with server state following
- **200% zoom:** no horizontal overflow, zero clipped elements, and the label stayed **visible
  above the field** — section 2's explicit requirement
- **Accessibility:** label bound to the input by `for`/`id`; accessible name
  "Personal / Service Number *"; the new hint is wired through `aria-describedby`, so it is
  announced rather than orphaned; not a password field; `autocomplete="off"`; 0 unlabelled
  focusables of 5; keyboard focus works with a 2.4 px focus outline
- **Network:** 358 requests captured, every one to `localhost:5179` (Vite modules) or
  `localhost:5006` (the isolated training API). **Zero external hosts.** The `ERR_ABORTED`
  entries are React StrictMode's double-invoked `AbortController` calls, the existing pattern

### Production safety verification

Baseline captured **before** any edit and re-captured **after**, read-only, against
`mongodb://127.0.0.1:27017` (rs0):

| Collection | Before | After | Verdict |
|---|---:|---:|---|
| scenariodefinitions (all / active) | 100 / 100 | 100 / 100 | UNCHANGED |
| synthetic assets | 511 | 511 | UNCHANGED |
| scenarios (legacy) | 40 | 40 | UNCHANGED |
| attempts | 5 | 5 | UNCHANGED |
| scenarioruns | 50 | 50 | UNCHANGED |
| scenarioevents | 124 | 124 | UNCHANGED |
| candidates | 4 | 4 | UNCHANGED |
| auditevents | 0 | 0 | UNCHANGED |
| adminusers | 0 | 0 | UNCHANGED |
| assessments | 1 | 1 | UNCHANGED |
| progresssnapshots | 1 | 1 | UNCHANGED |

Beyond counts, the following were compared **field by field** and are identical: every
attempt's `status`, `total_score`, `started_at`, `completed_at` and `profile_id`; the
`ScenarioRun` status histogram (27 active / 23 resolved); the full `ScenarioEvent` code
histogram across all 14 codes; and the collection list.

**Fingerprints — both unchanged:**

- client scenario bank `8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687`
- synthetic content `2779b03939e13cf11e0bee44493609f0c91e228f201f22f8c025a080509afde1`

The underlying data files were additionally hashed byte-for-byte and are identical
(`scenarios/v1` `7686687e…c8013b1f`, `synthetic/v1` `5bf50b1a…b73ef105`).

**One correction to the stated baseline.** The task brief gave `ScenarioEvents: 112`. Production
held **124** *before this task began* and holds **124** after — so the +12 predates this work
and is **not attributable to it**. The cause is the same one recorded in 15.39, 15.43 and
15.45: a development server on ports 5000/5173 is still running against production, and that
session was left untouched here. It is worth closing that hazard before IMMERSIVE-001, which is
the first task that writes new fields to `Attempt`.

### Cleanup

Temporary mongod (27021), backend (5006) and Vite (5179) stopped; all three ports verified at
**0 listeners**. The temporary mongod data directory was deleted, taking `imm000_verify` with
it. Production port 27017 and the other session's 5000/5173 remain up and untouched. Production
carries **no test or verification database**, and `__rs0_transaction_test__` was left exactly as
found, as instructed.

### Known limitations

- **The section 2 identifier validation rule is still non-compliant** and is unchanged by
  design — see the decision above and "Deferred" below. This task removed a wording defect; it
  did not make the field's accepted input match section 2.
- The hint deliberately states no format, because any format sentence would either contradict
  the current validator or promise a rule it does not enforce.
- No scenario, engine, scoring or immersive behaviour changed. The assessment still runs
  exactly as it did — this task closes a section 2 compliance defect and nothing else.

### Deferred / next tasks

1. **Section 2 identifier validation compliance** *(new, not yet in the roadmap)* — align
   `validateIdentifier()` and the input's `maxLength` with "3–24 alphanumeric characters plus
   hyphen": min 6 → 3, max 20 → 24, drop space and slash, drop the ≥4-digit rule. **Evidence
   gathered this session: all four production keys are 7–10 characters, all-digit, no spaces
   and no slashes, so every existing learner would still validate** — the change looks safe,
   but the backend `normaliseIdentifier` behaviour and the legacy `Assessment` pipeline should
   be checked before it is made. Small. No dependency on any immersive task.
2. **Close the production-facing dev server on 5000/5173** before IMMERSIVE-001. Recorded, not
   actioned — it belongs to whoever owns that session.
3. Everything else in the immersive roadmap is untouched and unstarted.

### Next task

**Client sign-off on C1 (90-minute duration as a specification amendment), C2 (how a scenario
unfinished at expiry scores) and C3 (whether a timed-out attempt counts toward
`ProgressSnapshot`)** — plan section 21. Those three block **IMMERSIVE-001**.

**`IMMERSIVE-003` (enriched synthetic content) has no dependency and may begin immediately, in
parallel**, as may `FEEDBACK-001`.

---

## 16.12 IMMERSIVE-001 — Authoritative 90-Minute Assessment Timer (COMPLETED 9 September 2026)

**Status:** COMPLETED · additive backend + frontend · **no production document changed** ·
no dependency added · no scoring, selection, taxonomy or scenario change
**Plan reference:** [`docs/IMMERSIVE_ASSESSMENT_ARCHITECTURE_PLAN.md`](docs/IMMERSIVE_ASSESSMENT_ARCHITECTURE_PLAN.md)
section 5 (architecture) and section 16 (task definition)

### The client decisions this implements

| # | Decision, as approved 9 September 2026 | Where it lives in the code |
|---|---|---|
| **C1** | Assessment duration is **90 minutes** | `ASSESSMENT_TIME_LIMIT_MS` in `constants/attemptTiming.js`, asserted in a test |
| **C2** | Preserve score already legitimately earned · do not fabricate a decision for an unresolved scenario · unresolved work earns nothing further · the attempt is finalised as timed out | `expireAttempt()` writes `clamp(score_running, 0, 10)` and `outcome_code: 'resolve_expired'` |
| **C3** | A timed-out assessment counts as an attempt/exposure once the backend finalises it, and the result must identify the timeout | `refreshProgressAfterCompletion()` after commit; `timed_out` on the result projection |

**The specification does not contain a time limit.** Verified again this session across all
116 pages and every other client artefact. This is an amendment, and `constants/attemptTiming.js`
says so in its own header so the provenance cannot be lost.

### Two deviations from the plan, both found by inspecting the code first

**1. The field is `time_limit_ms`, not `duration_ms`.** The plan proposed `duration_ms`.
That name is already taken, with the **opposite meaning**: `attemptViewerService` publishes
`duration_ms` as `completed_at - started_at` (the time the learner TOOK) and
`exportReportService` prints it as "Duration" in both the CSV and the PDF. Reusing it for
the time ALLOWED would have put two contradictory meanings on one key, and the first export
to read the wrong one would have printed "90 minutes" as every learner's completion time.

**2. The expiry ledger entry carries no `intent`.** The plan's sketch wrote
`metadata: { intent: 'expire', ... }`. `ScenarioEvent.metadata.intent` is enum-constrained
to the learner `INTENTS` vocabulary, so that would have required widening the very list the
engine validates client requests against. The entry carries `transition` and
`resolution_code` instead, which say everything needed - and `event_code: 'RUN_EXPIRED'` is
itself the marker.

### Attempt schema — five additive fields, no migration

| Field | Meaning |
|---|---|
| `time_limit_ms` | Time ALLOWED, pinned at creation so a later config change cannot retro-alter a running assessment |
| `expires_at` | The deadline, `started_at + time_limit_ms`, computed server-side inside the creation transaction |
| `end_reason` | `learner_completed` · `expired` · `instructor_reset`. Null while running |
| `expired_at` | When expiry actually committed — at or after `expires_at`; the gap is enforcement latency |
| `unresolved_at_expiry` | How many runs the clock closed. The instructor's most useful single number |

Plus one index, `{ status: 1, expires_at: 1 }`, which serves exactly one query: the sweeper's.

**`expires_at: null` means NO DEADLINE and is a first-class state.** It is what all five
production attempts hold. Every guard and the sweeper query require a non-null value, so
nothing historical was reinterpreted and **nothing was backfilled** - verified after the
work: all five still carry no timer field at all.

Two invariants, with a deliberate division of labour:

- **at creation** (`isNew`): `expires_at` must equal `started_at + time_limit_ms`;
- **afterwards**: neither value may change at all, enforced by the existing freeze hook
  beside `seed` and `scenario_sequence`.

Asserting the arithmetic on *every* save was the first version, and it was wrong: it broke
the expiry service's own commit. The timer tests caught it before anything else did.

### Timer lifecycle

```
POST /attempts   -> started_at = server clock
                    expires_at = started_at + 90 min      (one transaction, frozen)
   ... learner works ...
   every attempt route -> assertAttemptLive() / enforceDeadline()      LAYER 1
   every 30 seconds    -> expireDueAttempts()                          LAYER 2
   on process boot     -> recoverExpiredAttemptsOnStartup()            LAYER 3
                    |
   deadline passes  -> expireAttempt()  -> status completed
                                           end_reason expired
                                           result committed in the SAME transaction
```

**Layer 1 is correctness; layers 2 and 3 are completeness.** Disable the sweeper entirely
and a learner still cannot act after the deadline, because the guard runs inside the request
that would carry the action. The sweeper exists for the browser that was closed; the startup
sweep for the process that was down.

Guarded routes: `POST /attempts`, `GET /attempts/current`, `GET /:id`, `GET /:id/current-run`,
`POST /:id/runs/:runId/events`, `POST /:id/runs/:runId/resolve`, `POST /:id/complete`, and
`GET /:id/result`.

`GET /result` uses `enforceDeadline` rather than `assertAttemptLive`: asking for a result is
never refused. It finalises if needed and then serves what that produced - reading a result
cannot extend an assessment, so there is nothing to guard against.

Mutating routes answer `409 ATTEMPT_EXPIRED` with `result_available: true`, deliberately
distinct from `ATTEMPT_NOT_IN_PROGRESS` (an instructor reset): the two need different screens.

### Timeout transaction

One `withEngineTransaction`, at most 21 documents (1 attempt + 10 runs + 10 events):

1. re-read the attempt under the session, matching `{ status: 'in_progress', expires_at: { $ne: null, $lte: now } }` — **this guard IS the concurrency control**;
2. for each unresolved run: append one `RUN_EXPIRED` event at **0 points**, then set
   `status: 'resolved'`, `score_0_10 = clamp(score_running, 0, 10)`,
   `outcome_code: 'resolve_expired'`;
3. set the attempt `completed` / `expired` / `expired_at` / `unresolved_at_expiry`, and
   `total_score` as the sum of the ten run scores;
4. commit; **then**, outside the transaction, `refreshProgressAfterCompletion()`.

`intent_key` is deterministic — `expiry:<attemptId>:<runId>` — so a concurrent second expiry
collides on `ScenarioEvent`'s unique index and aborts rather than double-writing the ledger
the score is replayed from. Two callers racing settle on exactly one finalisation; the
loser returns `changed: false` having written nothing.

**Why the run ends `resolved` rather than in some new state:** section 5 requires "exactly
10 resolved scenarios" and `assertResultIntegrity()` enforces it. "Resolved" here means
*closed*, not *answered* — and `outcome_code` carries that difference everywhere it matters.

### C2 in practice, measured in the browser

An attempt with two scenarios fully resolved (10 + 10), one partially worked
(`INSPECT_CONTEXT +2`), and seven untouched finalised as **22/100** with
`unresolved_at_expiry: 8` and run scores `[10,10,2,0,0,0,0,0,0,0]`.

- earned points preserved exactly;
- nothing added — the partial run could not earn `RESOLVE_CORRECT`, because nothing was resolved;
- untouched runs score 0 *naturally*, because `score_running` was 0. No penalty was invented.

### Result at timeout

`resolve_expired` is deliberately absent from `CORRECT_RESOLUTION`, so no code path can read
it as a learner decision. Three additive projection changes:

- `PATH_LABELS.RUN_EXPIRED` → `time_ran_out`, so the replay explains why the timeline stops;
- **a fifth outcome class `not_resolved`**, with an early return in `classifyOutcome()`.
  Without it the existing logic would have reported an unresolved **legitimate** scenario as
  a `false_positive` — the projection asserting the learner wrongly reported something they
  never opened. Section 7 requires missed threat and false positive to be distinguished; an
  honest fifth bucket strengthens that rather than blurring it;
- the result carries `end_reason`, `timed_out`, `time_limit_ms`, `expires_at`, `expired_at`,
  `unresolved_at_expiry`, and `summary.not_resolved`.

On screen: *"This assessment ended when the time limit was reached. The allowed time was 90
minutes. 8 scenarios were not completed before time ran out. Everything you did complete has
been scored."* Blame-free and factual, per section 5's interpretation safeguard, and the
"Not reached in time" tile is rendered in a **neutral** tone — it is not a mistake and must
not read like one.

### ProgressSnapshot (C3)

**No change to `progressService`.** It already rebuilds by full recomputation over completed
attempts, so a timed-out attempt is counted exactly once and a repeated expiry recomputes
rather than increments. Verified: after twelve repeated finalisation attempts across four
routes, `attempt_count` stayed 1. A timed-out attempt does not displace a better `best_score`.

### Browser close / reopen, restart, multiple tabs

| Case | Behaviour, verified |
|---|---|
| Refresh | 1:29:40 → 1:29:26 — continued down, never reset. **Zero browser storage used** |
| Two tabs | Identical `expires_at` and identical countdown; the second tab's next call got `409` and `current-run: null` |
| Browser closed | The **sweeper** finalised the attempt with the browser idle: `total_score 22`, `unresolved 8` |
| Reopen after expiry | Lands on "Time is up" with a route to the saved result — never on a resumable assessment |
| Application restart | An attempt 3 hours overdue was finalised by the **startup sweep, before the server accepted traffic**. Downtime is not credited back |
| Logout mid-attempt | Same attempt, same deadline on sign-in. Nothing reset, nothing deleted |

One gap the tests found and closed: once the sweeper finalises an attempt there is no
`in_progress` attempt, so `/attempts/current` returned `null` and a returning learner would
have been told they had no assessment. `findRecentlyExpiredAttempt()` now reports it.

### The abandoned-attempt blocker

`createAttempt()` refuses while an `in_progress` attempt exists — which before this task
meant an abandoned attempt blocked its learner **permanently** until an instructor reset it.
A deadline would have made that the common case. `startAttempt` now enforces the deadline
first, so an overdue attempt is finalised and stops blocking. **No status was added and no
reset semantics were touched** — the smallest safe change. A second attempt was created
successfully in the browser after a timeout, with its own fresh 90-minute deadline.

### Security

- **Tamper rejection:** `expires_at`, `time_limit_ms`, `duration_ms`, `end_reason`,
  `expired_at`, `unresolved_at_expiry` and `server_now` were added to the controller's
  `FORBIDDEN_BODY_FIELDS` **and** the engine's `FORBIDDEN_INPUT`. Sending any of them is a
  `422`, not a silent ignore. Verified live on both attempt creation and the hot event path;
  the deadline was unchanged afterwards.
- **Client clock:** the countdown corrects for skew using `server_now` and is display only.
  Moving the local clock changes what is shown and changes nothing about when the attempt ends.
- **Duplicate/stale requests, concurrent resolve + timeout, duplicate completion:** all
  covered by the transactional guard and the existing `intent_key` unique index.
- **Offline:** no external time source, no network call, no analytics. 500 browser requests
  captured, **every one to localhost**. "Server time" is the local backend's own clock.

### Frontend

The countdown **decides nothing**. At zero it calls `syncDeadline()`, which re-reads the
server; if the server still says the attempt is live, play continues. There is no code path
in which the browser ends an assessment.

`AttemptHeader` shows **both** readings — `00:11 · 1:29:48 left`. Section 3 requires *elapsed*
time on the progress card; the limit needs *remaining*. Dropping the specified one to make
room for the unspecified one would have been the wrong trade.

Warnings at 10 and 2 minutes are `role="status"` (polite) banners, **never a modal**: a dialog
seizing focus two minutes before the deadline would interrupt the decision being assessed,
which is both an accessibility failure and a measurement failure.

`utils/assessmentClock.js` holds the pure arithmetic so the whole behaviour is assertable
without a DOM or a timer.

### Files

**Created (5):** `backend/src/constants/attemptTiming.js` ·
`backend/src/services/attemptExpiryService.js` · `backend/tests/attemptTimer.test.js` (27) ·
`frontend/src/utils/assessmentClock.js` · `frontend/src/components/simulation/TimeRemaining.jsx` ·
`frontend/src/pages/AssessmentTimer.test.jsx` (18)

**Modified — backend (9):** `models/Attempt.js` · `services/attemptService.js` ·
`services/attemptExpiryService.js` · `controllers/attemptController.js` ·
`services/scenarioEngineService.js` · `constants/scenarioEngine.js` ·
`constants/resultProjection.js` · `services/attemptResultService.js` ·
`services/instructorControlService.js` · `services/attemptViewerService.js` · `server.js` ·
`scripts/testEngine.js`

**Modified — frontend (7):** `state/attemptMachine.js` · `hooks/useAttemptController.js` ·
`pages/SimulationPage.jsx` · `components/simulation/AttemptHeader.jsx` ·
`components/simulation/SupportDialogs.jsx` · `components/result/ResultSummary.jsx` ·
`constants/result.js` · `test/attemptFixtures.js`

**Modified — tests (4):** `tests/scenarioEngine.test.js` · `tests/attemptCreation.test.js` ·
`tests/attemptViewer.test.js` · `tests/attemptViewerApi.test.js`

**Untouched:** scoring formulas, the six-stage machine, selection, the taxonomies,
`ProgressSnapshot`'s logic, `ScenarioRun`'s scoring authority, all 100 scenario definitions,
all 511 synthetic assets, the four platform renderers, the assessment menu (IMMERSIVE-002),
the audit vocabulary, and the offline boundary.

### Tests

```
frontend npm test              295 · 295 pass · 0 fail        (277 -> 295, +18)
frontend npm run lint          0 warnings · 0 errors
frontend npm run build         clean
backend  npm test              736 · 426 pass · 0 fail · 310 skipped   (709 -> 736, +27)
backend  npm run test:engine   310 · 310 pass · 0 fail · 12 suites     (283 -> 310, +27)
```

**Every count change explained.** +27 backend are the new `attemptTimer.test.js`; they appear
as *skipped* in the unit run (no replica set) and as *passing* in the engine run, exactly
like every other integration suite. +18 frontend are `AssessmentTimer.test.jsx`.

**Four existing assertions were extended, none weakened:**

| Test | Change |
|---|---|
| `engine telemetry codes are kept out of the client scoring vocabulary` | `RUN_EXPIRED` added — and the test was **strengthened** with a direct assertion that no telemetry code appears in `SCORING_EVENT_CODES`, rather than only checking a name prefix |
| `the candidate attempt projection hides seed, selection and composition` | the three new candidate keys named explicitly, so a future field still has to be added deliberately |
| `attemptViewer` summary key set · `attemptViewerApi` list key set | the four timeout facts named. The privacy loop that guards against scenario, event and answer data is untouched and still passes |

The instructor summary and the learner summary are asserted deep-equal by an existing test,
so `not_resolved` was added to both — a report that disagreed with what the learner saw
would be worse than no report.

### How expiry was simulated — and why it does not weaken production

**Never by waiting, and never by shortening the limit.** Both the automated tests and the
browser run back-date `expires_at` with a direct `updateOne`, which bypasses the model's
freeze hook. That asymmetry is the point: **a fixture may construct any state it likes, while
no application code path can move a deadline** — a `save()` carrying a changed `expires_at`
throws, and a test asserts exactly that, including for a self-consistent extension that
changes both values together.

There is deliberately **no environment override** of the duration. A production switch that
shortens real assessments would be a worse thing to own than a slightly more awkward test.

### Browser verification, on a throwaway stack

mongod replica set `rsImm001` on **27021**, database `imm001_verify`, backend on **5006**,
Vite on **5179**. **Production on 27017 was never a participant**, and the pre-existing
development session on 5000/5173 was left running and untouched.

All 24 requested checks passed. Highlights: the deadline was exactly 90 minutes from the
backend timestamp; refresh continued the same countdown with zero browser storage; two tabs
shared one deadline; the sweeper finalised an idle session; the startup sweep finalised a
3-hour-overdue attempt before the server listened; the result stated the timeout and scored
22/100 with 8 "Not reached in time"; progress counted it once across twelve repeats; a second
attempt started; tampering was rejected 422; logout preserved the attempt and deadline;
375×812 and 200% zoom both showed no overflow and nothing clipped; 9 focusables, 0 unlabelled,
0 under 44 px; and 500 requests, all to localhost.

The countdown is **not** an `aria-live` region — a per-second announcement would be
intolerable — while the 10- and 2-minute warnings are.

### Production safety verification

Baseline captured read-only before any edit and re-captured after. Every count identical:
definitions 100/100 active, synthetic assets 511, legacy 40, attempts 5, runs 50, events 124,
candidates 4, audit 0, admins 0, assessments 1, snapshots 1. Attempts compared **field by
field and byte-identical**; run-status and the full 14-code event histograms identical;
collection list identical; **`attempts` indexes unchanged** (the new index is created lazily
by Mongoose on a live connection and production was never connected to by this work).

**All five production attempts still carry NO timer field of any kind** — no backfill, no
fabrication, and the three `in_progress` ones remain resumable exactly as before.

Fingerprints unchanged: client `8e7a6c98…038a7687`, synthetic `2779b039…09afde1`.

### Cleanup

Ports 5179 / 5006 / 27021 verified at 0 listeners; the temporary mongod data directory
deleted, taking `imm001_verify` with it; production carries no verification database;
`__rs0_transaction_test__` left exactly as found.

### Known limitations

- **Host system-clock rollback is not prevented.** An operator with administrator rights on
  the training machine could move the clock back and extend an assessment. Accepted and
  documented in the plan's security review: it is outside the threat model for a supervised
  offline machine, and `server_ts` on every event makes a rollback *visible* in the ledger.
  A monotonic clock cannot help, because it does not survive the restart the design requires.
- **The duration is a constant.** Making it instructor-configurable belongs with ADMIN-004's
  `Configuration` model; the clamp bounds are already defined beside the default.
- **No audit-log entry for expiry.** `AuditEvent` requires an admin actor, and section 6's
  audit remit is administrative changes. Expiry is recorded on the attempt and in the event
  ledger, and surfaced to instructors through the attempt viewer instead.
- **The instructor CSV/PDF exports do not yet print the timeout columns.** The data is on the
  viewer projection they read; adding the columns is a small, separate change and is recorded
  as deferred rather than done quietly here.
- The assessment menu is unchanged — that is IMMERSIVE-002.

### Deferred

1. **Export columns for `end_reason` / `unresolved_at_expiry`** in `exportService` and
   `exportReportService`.
2. **Section 2 identifier validation compliance** (carried over from 16.11, unrelated).
3. The production-facing dev server on 5000/5173 is still running; it remains the recurring
   hazard recorded in 15.39, 15.43 and 16.11.

### Next task

**`IMMERSIVE-002` — assessment menu behaviour.** Its dependency (IMMERSIVE-001) is now met:
the logout confirmation it introduces must state that the 90-minute clock keeps running,
which is true and enforced as of this task. `IMMERSIVE-003` and `FEEDBACK-001` remain
unblocked and may run in parallel.

---

## 16.13 IMMERSIVE-002 — Active Assessment Menu Behaviour (COMPLETED 9 September 2026)

**Status:** COMPLETED · **frontend only — no backend file changed**, no endpoint added, no
data contract touched, no dependency added
**Plan reference:** [`docs/IMMERSIVE_ASSESSMENT_ARCHITECTURE_PLAN.md`](docs/IMMERSIVE_ASSESSMENT_ARCHITECTURE_PLAN.md)
section 6 (design) and section 16 (task definition)
**Dependency:** IMMERSIVE-001, met — the logout copy states the timer behaviour, which is
now true and enforced.

### The requirement, verified again from the PDF this session

Specification section 3, Learner row, verbatim:

> "Profile chip — Display name + masked service number; **menu contains attempt history,
> accessibility, restart (instructor-controlled) and logout.**"

That is a requirement to *contain* four named items. **All four remain, in that order, and
none is disabled** — a test asserts exactly that. What this task changed is the CONSEQUENCE
of two of them, which is what the client's concern was actually about.

### What changed, item by item

| Item | Before | After | Why |
|---|---|---|---|
| Attempt history | `navigate('/history')` — unmounted the assessment | Read-only panel **inside** the assessment shell | Section 3 requires the item, not a navigation. Leaving a clocked assessment for an unbounded stretch is an integrity problem the specification never asks anyone to accept |
| Accessibility | Panel | **Unchanged** | An accommodation that gets harder to reach under time pressure is not an accommodation. No confirmation, no gate, no delay |
| Restart | Label "Restart assessment", opened an explanation | Label **"Restarting (instructor only)"**, same explanation | It read like an action the learner could take. Section 3's own "(instructor-controlled)" now appears where the learner looks, not only in the panel behind it |
| Log out | Signed out immediately | **Confirms first**, stating that the clock keeps running | Since IMMERSIVE-001 the deadline runs while signed out. Without that sentence, logout is a trap |

### No backend change, and why that is the right answer

`POST /api/candidates/logout` is three lines: `endSession(res)` and a JSON `ok`. It does not
end, submit, abandon, reset or delete the attempt, and touches no `ScenarioRun` and no
`ScenarioEvent`. That was already correct — section 6 requires "closing/reopening resumes at
the last committed state". **The behaviour needed no change; only the learner's understanding
of it did.** No learner-side reset endpoint was added, and ADMIN-004 remains the only path
that can reset an attempt.

The history panel reuses **`GET /api/progress`**, exactly as the plan preferred, rather than
adding an endpoint. Two properties make it the right source:

- it takes **no profile parameter** — the server answers only for the session cookie's own
  learner, so there is nothing to abuse;
- `progressService` counts **only attempts whose status is `completed`**, so the attempt in
  flight is excluded **structurally, by the server's own definition**, not by a filter the
  component applies and could one day get wrong.

It is aggregate by construction — attempt count, scenarios completed, last and best score. No
scenario id, disposition, difficulty, family, trigger, event, rationale, seed or internal
identifier exists in the payload. A test asserts none of those strings appears in the panel.

The **legacy `/history` route was left exactly as it is.** It reads the old 40-scenario
`Assessment` pipeline and is still reachable from the dashboard; it is simply no longer the
thing the assessment menu opens. Rewriting it onto the `Attempt` pipeline is a separate,
unrelated piece of work and is recorded as deferred rather than smuggled in here.

### Scope: these restrictions belong to a live assessment only

`AttemptHeader` — and therefore this menu — is rendered by `SimulationPage` and nowhere else.
The scoping is structural rather than conditional, so nothing had to be gated:

| Surface | Behaviour |
|---|---|
| Login, briefing, dashboard, result, `/history`, admin | Untouched. Normal navigation throughout |
| Active assessment | The four items, with the behaviour above |
| After completion or timeout | The chip menu is not rendered at all — the shell shows "Attempt complete" or "Time is up". Verified in the browser and asserted by two tests |

### Timer interaction

Opening or closing any panel is presentation only. Verified live: `attempt_id`, `started_at`
and `expires_at` were identical before and after opening history, accessibility, restart and
the logout dialog, and the countdown **continued** across each (1:29:37 → 1:29:21 → 1:28:23)
rather than resetting. No menu action can reset, extend, pause or replace the deadline —
there is no code path from any of them to a write, and a test asserts that the set of
non-GET requests after exercising every panel is empty.

### No `beforeunload` blocker

Deliberately, per plan section 6.2 item 6. Browsers show a generic, non-customisable message
that cannot state the actual consequence; it is an accessibility irritant and prevents
nothing. The Rules panel (added in IMMERSIVE-001) already says the clock "keeps running if
you refresh, close the window or sign out", and the logout dialog now says it too — stated
where it can actually be read.

### Files

**Created (2):** `frontend/src/components/simulation/AssessmentSessionPanels.jsx` ·
`frontend/src/pages/AssessmentSessionControls.test.jsx` (20)

**Modified (4):** `frontend/src/components/simulation/AttemptHeader.jsx` (menu label and
handlers) · `frontend/src/pages/SimulationPage.jsx` (wiring, `confirmSignOut`) ·
`frontend/src/pages/DashboardOrchestration.test.jsx` (four assertions updated to the new
contract) · `frontend/src/test/attemptFixtures.js` (a `/progress` route and a
`completedAttempts` knob)

**Untouched:** the entire `backend/` tree; scoring, selection, difficulty, disposition, the
taxonomies, scenario definitions, synthetic content, engine transitions, `ProgressSnapshot`,
the result projection, the timer architecture, ADMIN-004 reset semantics and the audit
vocabulary. The `TRAINING SIMULATION` rail is intact on every screen.

The two panels live in their own file rather than in `SupportDialogs.jsx`: that file is the
UI-004 support zone, whose four panels are static explanations that read nothing and submit
nothing. These two do neither — one fetches, one acts — and keeping that distinction visible
in the file layout is worth more than a lower file count.

### Tests

```
frontend npm test              315 · 315 pass · 0 fail        (295 -> 315, +20)
frontend npm run lint          0 warnings · 0 errors
frontend npm run build         clean
backend  npm test              736 · 426 pass · 0 fail · 310 skipped   (unchanged)
backend  npm run test:engine   310 · 310 pass · 0 fail                 (unchanged)
```

**+20 is the new `AssessmentSessionControls.test.jsx`.** Backend and engine did not move,
which is the expected result for a task that changed no backend file.

**Four existing assertions were updated to the new contract, none weakened:**

| Test | Change |
|---|---|
| `offers history, accessibility, restart and logout...` | Third label is now `Restarting (instructor only)`, and the test was **strengthened** with an assertion that no item is disabled — section 3 requires them present, and disabling one would be removal by another name |
| `explains that restart is instructor-controlled...` | Opens the relabelled item; every other assertion unchanged |
| `still signs the learner out` → `...after confirming` | Now asserts that **nothing is written before confirmation**, then that sign-out still happens |
| `reaches attempt history` → `...without leaving the assessment` | Now asserts the panel opens, the legacy route is **not** navigated to, and the assessment is still behind it at the same ordinal afterwards |

Two lint regressions were introduced and fixed properly rather than suppressed: both panels
were restructured so their bodies mount with the dialog, which removes the synchronous
`setState`-in-effect the linter objected to and makes each opening a fresh read.

**One pre-existing flake was found and fixed.** Repeated runs surfaced an intermittent
failure in `AssessmentTimer.test.jsx` > "does not restart when the component remounts" - a
test written in IMMERSIVE-001, not here. It required the two countdown readings to be within
five seconds of each other, which fails when the suite runs alongside others and the remount
takes longer than that: a property of the machine, not of the countdown. The assertion now
states the real invariant - the reading after a remount can only be lower, never the full
90-minute limit - and the three timing-sensitive suites were run five consecutive times
clean, plus two full-suite runs.

### Browser verification, on a throwaway stack

mongod replica set `rsImm002` on **27021**, database `imm002_verify`, backend on **5006**,
Vite on **5179**. **Production on 27017 was never a participant.**

All 29 requested checks passed. Notable results:

- the menu shows exactly the four items, all `BUTTON`, none disabled, `aria-haspopup="menu"`;
- accessibility opened immediately, focus moved inside, Escape closed it, countdown kept
  counting;
- history opened with the URL still `/assessment`, zero leaked terms from a 9-term denylist,
  and `attempt_id` / `started_at` / `expires_at` identical afterwards;
- restart offered **no action control at all** — the only button in the dialog is its Close;
- the logout dialog showed live remaining time ("1:29:36 of it remains"), cancelling left the
  assessment untouched, confirming signed out, and signing back in returned the **same
  attempt with the same `expires_at`** and ~88 minutes left — the clock had continued;
- after simulated expiry the shell showed "Time is up" with **no chip menu and no countdown**;
  the result remained available (`timed_out: true`) and progress counted one attempt;
- the isolated database held 1 attempt, 10 runs and 10 events, all `RUN_EXPIRED` — **the menu
  itself created zero events and zero audit entries**;
- keyboard: `role="dialog"`, `aria-modal="true"`, accessible name present, focus starts inside,
  Tab stays trapped, Escape closes and restores focus;
- 375×812 and 200% zoom: no horizontal overflow, nothing clipped;
- network: every request to `localhost:5179` or `localhost:5006`. **Zero external hosts.**

**How expiry was simulated:** the same controlled method established in IMMERSIVE-001 —
back-dating `expires_at` with a direct `updateOne` in the isolated database, which bypasses
the model's freeze hook. No production code was weakened and no duration was shortened.

### Production safety — one finding that must be read in full

**The five pre-existing attempts are byte-identical before and after, field by field.** The
scenario bank, the synthetic assets, the legacy scenarios, the audit log, the admin users and
both fingerprints are all unchanged:

- client bank `8e7a6c98…038a7687` — unchanged
- synthetic `2779b039…09afde1` — unchanged
- definitions 100/100 active · synthetic assets 511 · legacy scenarios 40 · auditevents 0 ·
  adminusers 0 · assessments 1 — all unchanged
- the `attempts` index set — unchanged

**However, production totals DID grow during the session window, and this must not be
reported as "unchanged":** attempts 5 → 8, runs 50 → 80, events 124 → 151, candidates 4 → 7,
progresssnapshots 1 → 4.

**This work is not the cause, and the evidence is structural rather than circumstantial.**
The three new attempts (11:23, 11:28 and 11:39) carry **no `expires_at` and no
`time_limit_ms`**. `createAttempt()` has written both unconditionally since IMMERSIVE-001, and
`Attempt`'s validator refuses a document carrying one without the other — so **the current
code cannot produce an attempt with no timer fields.** They were created by a build that
predates IMMERSIVE-001. The new candidate profiles are named "Shabda Sinha" and "ABCD", which
are people using the application, not this session's fixtures ("Menu Verification" /
`FAL-550120`, created only in `imm002_verify` on port 27021).

The cause is the **development server still running on ports 5000/5173 against production**,
never restarted since before IMMERSIVE-001 — the recurring hazard recorded in 15.39, 15.43,
16.11 and 16.12. It was left running and untouched here, as it is not this session's to stop.

**This is now more than an annoyance.** Those three attempts are `in_progress` with no
deadline, so the sweeper will correctly never expire them, and each one **permanently blocks
its learner from starting another attempt** until an instructor resets it — the exact latent
bug IMMERSIVE-001 fixed for new attempts. Closing that dev server and restarting it on the
current build should happen before any further work.

### Cleanup

Ports 5179 / 5006 / 27021 verified at 0 listeners; the temporary mongod data directory
deleted, taking `imm002_verify` with it; production carries no verification database;
`__rs0_transaction_test__` left exactly as found.

### Known limitations

- **The Modal's close (X) control is 36 px, below the 44 px target.** Pre-existing and shared
  by every dialog in the product since UI-001 — not introduced here. Both new panels also
  offer full-size labelled buttons and close on Escape, so the small control is never the only
  way out. Worth folding into ACCEPT-003 rather than fixing piecemeal.
- **The history panel shows aggregates, not a list of individual past attempts.** That is what
  `GET /api/progress` returns, and adding a per-attempt learner list would have meant a new
  endpoint the plan explicitly preferred to avoid. If the client wants a list, it is a small
  additive backend task.
- **The legacy `/history` route still reads the old 40-scenario pipeline** and still says
  "Your score for this attempt is not available yet." Untouched by this task and unrelated to
  it, but stale since RESULT-001. Recorded as deferred.
- No `beforeunload` blocker, deliberately.

### Deferred

1. Migrate the legacy `/history` route onto the `Attempt` pipeline, or retire it.
2. Export columns for `end_reason` / `unresolved_at_expiry` (carried from 16.12).
3. Section 2 identifier validation compliance (carried from 16.11).
4. **Stop the production-facing dev server on 5000/5173**, and reset the three deadline-less
   `in_progress` attempts it created so those learners are not blocked.

### Next task

**`IMMERSIVE-003` — enriched synthetic content (multi-message threads).** It has no
dependency and is the largest single win in the plan. `FEEDBACK-001` and `ACCEPT-003` also
remain unblocked and may run in parallel.

---

## 16.14 IMMERSIVE-003A-R2 — WhatsApp W01–W05 raised to demo standard (COMPLETED 10 September 2026)

**Scope.** The five WhatsApp scenarios W01–W05 and nothing else. No new scenarios, no new
platforms, no backend source change. W06–W25, Instagram, Email and SMS are untouched, and both
content fingerprints are byte identical before and after.

### What was asked for

IMMERSIVE-003A had already moved the five scenarios off the action sheet and onto the device.
This milestone was about the remaining distance between "the controls are on the phone" and
"a non-technical client watching a screen recording believes this is a phone" — with the
explicit instruction that the threat research be performed rather than requested.

### Research

Each scenario was mapped against **MITRE ATT&CK v19.2** (current release, 28 April 2026),
read from the live technique pages rather than recalled, with the technique version and
last-modified date recorded so a reviewer can check the same page.

| Scenario | Primary technique | Note |
|---|---|---|
| W01 | **T1598.001** Phishing for Information: Spearphishing Service | supported by **T1111** (the OTP itself) and **T1684.001**; **T1621** recorded as a *partial* fit only, because the documented behaviour is push fatigue, not code relay |
| W02 | **T1598.003** Spearphishing Link | with **T1583.001** (the look-alike domain), **T1657** (the objective) and **T1660** (why a phone makes it work) |
| W03 | **none, deliberately** | ATT&CK catalogues adversary behaviour; a saved coordinator posting a poll is not any. The closest defensible reference — the discrimination / false-positive problem the client's own −4 `FALSE_REPORT_BLOCK` prices — is recorded instead |
| W04 | **T1684.001** Social Engineering: Impersonation | with **T1657** and **T1586**; ATT&CK's own text describes the BEC pattern this scenario is the consumer-scale instance of |
| W05 | **T1598.003** + **T1111** | with **T1684.001** (APT-C-36's documented bank impersonation), **T1585.001**, **T1583.001** |

**Version note for anyone re-reading older material:** `T1656 Impersonation` no longer exists
as a top-level technique and now resolves to `T1684.001`.

Full record, including the behavioural pattern behind each, what must **not** be copied, the
enhanced storyline, the evidence progression and why each remains faithful to the client's
scenario: **`docs/WHATSAPP_W01_W05_REAL_WORLD_RESEARCH.md`**.

### What shipped

- **Chat list** — search bar, tab strip, the delivered conversation **among three ordinary
  ones**, ticks, mute icons, an archived row, a compose button.
- **Thread** — consecutive messages grouped with tails only at the end of a run, author
  strips once per run, quoted replies, a transient typing strip that exists between two
  stages and is gone when the message it belonged to arrives.
- **Details sheets** — tabs (About / Groups in common / Media), so an absence has to be
  looked for rather than handed over. W03's participants are navigable and the coordinator
  has a full contact card with the same three tabs W04's impostor has, answering oppositely.
- **Forms** — the redelivery checkout and the KYC page are fillable, with local validation, a
  Continue step, a review step, a commit control and an outcome page. A payment request opens
  a **payment sheet** showing the payee, the receiving account and a PIN field before Confirm.
- **A second application** — W05's verification route is now a distinct piece of software with
  its own colour, hero card and tab bar, because the lesson is that the real thing looks
  nothing like the page they were sent to.
- **Composer** — choosing an authored reply puts it in the message field; Send submits it.
- **Browser** — a real page graph with Back, a progress strip and an address bar.

### The one rule that changed, and its containment

A simulated page may now carry real inputs. Everything that keeps that safe is in
`frontend/src/simulation/localForm.js` and `components/simulation/surfaces/SceneForm.jsx`:
values live in the component that draws the field, are discarded when the learner leaves the
screen, and never reach an intent, metadata, storage, a cookie, a log, an export or the
network. It is enforced twice — in the frontend, and again by the engine's
`METADATA_ALLOWLIST`, which rejects any key outside the nine the specification allows. Four
dedicated tests assert it, one of them by serialising everything the device handed the
controller and searching it for the exact strings typed.

Confirmed in the live browser run: every metadata key ever written was one of
`consequence, dwell_ms, intent, open_latency_ms, resolution_code, transition, verify_source`.

### What did not change

The scenario bank, the synthetic content, the six-stage engine, the event codes and point
values, the resolution semantics, the 90-minute timer and its sweeper, selection, results and
admin. **Zero backend source files were modified.**

### Verification

- Frontend **471 / 471**, backend **745 / 745** (0 skipped, isolated database), lint clean,
  build clean.
- W01–W05 walked end to end in a browser against an isolated database on ports 5199 / 5055.
  Safe paths scored **10/10** on W01, W03 and W04; the deliberately unsafe routes scored 4, 4
  and 0 exactly as the client's table requires. No duplicate events, no duplicate sequences.
- Reload mid-scenario recovered to the stage the server had committed, on the conversation,
  with no replayed event and no timer change.
- 390×844, 375×812 and a 640-wide (200% zoom) layout: no horizontal overflow, no element
  wider than the viewport.
- Offline: the only hosts contacted were the dev server and the local API. No `a[href]`, no
  `form`, no `img`, no external request, no global network primitive touched.

### Database

Isolated databases only: `immersive003a_r2_test` (automated) and `immersive003a_r2_verify`
(browser). **Production was not mutated** — `cyber_awareness_training` holds exactly the same
counts before and after: attempts 8, candidates 7, scenario runs 80, scenario events 151,
scenario definitions 100, legacy scenarios 40, assessments 1, progress snapshots 4.

### Known limitations

- **The production-facing development server on ports 5000 / 5173 is still running**, the
  recurring hazard recorded in 15.39, 15.43, 16.11, 16.12 and the IMMERSIVE-002 cleanup notes.
  It was found running at the start of this task and was left untouched, as it is not this
  session's to stop; nothing in this task used it. It remains the deferred item below.
- Background conversations in the chat list are content, not controls. Tapping one does
  nothing, because a control that leads nowhere is worse than a row that is plainly a row.
- Once a learner opens a link at the branch stage, the engine has taken that stage's one
  intent, so the page they arrive at can no longer be submitted and shows what it asks for
  instead of live fields. That is the specification's own one-decision-per-stage rule, not a
  UI choice, and it is documented in `SCENE_INTERACTION_LAYER.md` §6.1.
- Two content conflicts between the generated placeholders and the client's stage text (W03's
  directory row, W04's payee name) are still resolved in the scene rather than in
  `synthetic/v2`. Carried forward unchanged from IMMERSIVE-003A and recorded in both documents.

### Deferred

1. **Stop the production-facing dev server on 5000/5173**, and reset the three deadline-less
   `in_progress` attempts it created (carried from 16.13).
2. Move the two W03 / W04 content conflicts into `synthetic/v2` if the client prefers.
3. `link_hover_ms` is still produced nowhere (matrix row 4.11).

### Next task

**Client review of W01–W05 as a screen recording.** W06–W10 should not begin until that
review has happened — the whole point of a five-scenario pilot is that the interaction model
is signed off before the remaining ninety-five are authored against it.

---

## 16.15 REVIEW-001 — Training Feedback / Mistake Review (COMPLETED 10 September 2026)

**Scope.** The end-of-attempt learning review, and nothing else. No new scenarios, no new
platforms, no change to the engine, the timer, the six stages, the scoring model, the mode
system or any authored scenario content. W01–W05 story content is byte identical before and
after; Instagram, Email and SMS are untouched. W06–W10 were deliberately **not** started.

### What was asked for

Client feedback on the W01–W05 screen recording:

> "When any person chooses an incorrect option, all these are highlighted at the end during
> assessment where: their mistakes are highlighted, correct actions are brought out — that's
> how it'll become a training simulator."

So: an attempt must stop ending with "your score is 67/100" and start ending with *here is
how you behaved, here are the mistakes you made, here are the cues you missed, here is what
the correct action was, here is why it mattered, here is the habit to remember.*

### What already existed, and was reused rather than rebuilt

The inspection pass found that almost all of the raw material was already in place, which is
why this task is additive rather than a rewrite:

| Already existed | Reused as |
|---|---|
| `ScenarioEvent` ledger, ordered by `(run_id, sequence)` | the only record of what the learner did |
| `pathFromEvents()` + `PATH_LABELS` (RESULT-001) | the path replay, unchanged; `review.your_path` **is** `scenario.path` |
| `classifyOutcome()` → `outcome_class` | the missed-threat / false-positive distinction, read rather than re-derived |
| `evaluation.feedback` — result, cues, safe_action, impact, prevention_habit | what it was, the missed cue, the consequence, the habit |
| `evaluation.stages[].expected_safe_behavior` | the correct action, **per stage** |
| `evaluation.stages[].scoring[].event_code` | which steps each scenario offers — and therefore which were missed |
| `ScenarioDefinition.disposition` | what "resolved as required" meant for this item |

**No schema field was added and none was changed.** The existing `ScenarioDefinition`
feedback fields were sufficient; §16 of the brief asked that this be determined first, and it
was.

### What was built

Four files, plus wiring:

- `backend/src/constants/scenarioReview.js` — the learner-facing vocabulary. 11 commission
  rules keyed by engine event code, 4 omission rules keyed by graded stage, the expected-path
  codes, the learning-issue names. Nothing in it is scenario-specific and nothing in it holds
  a number.
- `backend/src/services/scenarioReviewService.js` — `detectMistakes()`, `correctPathFor()`,
  `buildScenarioReview()`, `reviewSummary()`. Pure and synchronous: no I/O, no clock, no
  randomness.
- `frontend/src/components/result/ScenarioReview.jsx` — the mistake / correct / not-resolved
  card.
- `frontend/src/components/result/AssessmentReview.jsx` — the counts that head the review.

`attemptResultService` gained `scenario.review` and `review_summary`, and one extra selected
field (`ScenarioEvent.stage`, which stays server-side). Every key the result already
published is still published with the same name and meaning, proven by a test.

### The two mechanisms that make it generic

There is no `if (scenario === 'W01')` anywhere, and the review never reads a scenario id.

1. **Commissions** — an event whose code has a rule is a mistake, reported in the stage the
   *ledger* recorded it in.
2. **Omissions** — a safe-path code the **scenario itself declares** and no event ever
   earned. A scenario is never marked down for a step it never offered, and a stage that
   already produced a commission raises no omission.

The scenario's own scoring declaration therefore drives the review exactly as it already
drives the engine, which is what makes one implementation serve all 100 scenarios.

### The mistake card

Per mistake, three lines from three different places — none of them generic advice:

- **What you did** — the observable action, from the ledger.
- **Correct action** — quoted from `expected_safe_behavior` for *that stage of that scenario*.
- **Why it mattered** — the risk carried by that class of action.

Plus, per card: what it was, the cue that was missed, the authored consequence, the habit, and
**your path beside the correct path**.

Two presentation decisions worth recording, both taken after reading real cards on screen:

- The **card-level** `correct_action` is dropped once the mistakes carry their own.
  `feedback.safe_action` is imported from the resolve stage, so across most of the bank it
  reads as screen procedure ("complete the resolution and return to the dashboard") rather
  than as the decision that should have been taken. Printing it under the mistakes would have
  put a generic line on a card whose entire purpose is not to be generic. It is kept when no
  mistake could supply one.
- A sentence is shown **once per card**. Several scenarios were authored with one sentence
  serving as both the warning sign and the prevention habit, and printing it twice under two
  headings makes a training card look like a template being filled. The dedupe compares
  values, so a scenario whose habit genuinely differs still shows both.

### The release boundary — one field wider, and narrowly

REVIEW-001 releases `evaluation.stages[].expected_safe_behavior`, and only: for the ten
scenarios of a **finished** attempt, only at a **stage where that learner actually made a
mistake**, and only as **that mistake's own correct action**. A scenario handled correctly
releases nothing new at all.

That is the whole widening, and it is what lets the card say what should have been done at the
step where it went wrong rather than delivering a lecture. The information is not new to the
boundary — `feedback.cues` for the same scenario is already released and already
answer-bearing. Both halves are pinned by tests that fail if a stage line appears anywhere
else, and `scoring_text`, `scoring[]`, `learner_flow`, `expected_actions` and the authoring
title all remain server-side.

`MISTAKE_KINDS` publishes slugs of its own and a test asserts they share no value with
`SCORING_EVENT_CODES`, so a scoring code can never reach a training screen by accident.

### Scoring and mode were not touched

The review computes no score and publishes none: a test asserts `total_score`, `score_0_10`,
`max_score` and `points` appear nowhere inside it, that `review_summary` reconciles with
`summary`, and that a scenario scoring full marks carries no mistake. The mode system was not
redesigned — nothing is revealed before a scenario resolves, in either mode, and the review is
built only from a completed attempt.

### Two real defects found and fixed during the work

1. **A leak I introduced.** `review.what_it_was` restates `feedback.result`, which contains
   the raw family, and the existing "no scenario entry carries its own classification" test
   caught it. The exemption was widened deliberately and the identity
   `review.what_it_was === feedback.result` is now asserted, so the exemption cannot become a
   route for anything new.
2. **The dedupe swallowed the key cue on a correct card.** Cues were claimed eagerly for
   every card, including the cards that do not render them, so the "Key cue" heading vanished.
   Found in the browser, fixed by claiming fields in render order and only when they will be
   rendered, and pinned by two regression tests.

### Tests

| Suite | Result |
|---|---|
| `backend/tests/scenarioReview.test.js` (new) | 29 / 29 |
| `backend/tests/attemptResultApi.test.js` (13 added) | 40 / 40 |
| `frontend/src/pages/ResultReview.test.jsx` (new) | 22 / 22 |
| Full backend suite (`npm test`) | 464 pass, 0 fail, 322 skipped (no `ENGINE_TEST_MONGO_URI`) |
| Every DB-backed suite, run sequentially on isolated databases | 25+20+37+21+25+27+32+25+28+21+21 pass, 0 fail |
| Full frontend suite (`vitest run`) | 510 / 510, 22 files |
| `oxlint` | clean |

### Browser verification

Isolated database `cyber_awareness_review001_verify` and a separate API on port 5055; the
automated suites used `cyber_awareness_review001_*`. Four attempts were played through the
**real HTTP API** by `backend/scripts/seedReviewDemo.js`, so the engine decided every event
code, score and outcome:

| Attempt | Score | Review |
|---|---|---|
| Every scenario handled safely | 100/100 | 10 correct, 0 mistakes, 10 verified |
| Malicious items carried out | 20/100 | 2 correct, 8 with mistakes, 32 mistakes, 8 missed threats |
| Genuine items reported | 80/100 | 8 correct, 2 false positives |
| Mixed — four different walks | 67/100 | 3 correct, 7 with mistakes, 15 mistakes, 1 missed threat, 1 unsafe step |

Confirmed on screen: the false-positive card says "do not report or block a legitimate
sender" and its correct path ends "Keep it and carry on"; the missed-threat card ends "Report
and block it"; the rendered DOM contains no event code, point delta, identifier, rationale or
`expected_safe_behavior` key.

**Production was not mutated.** Nothing in this task connected to
`cyber_awareness_training`, and `seedReviewDemo.js` refuses to run against it.

### Known limitations

- `feedback.safe_action` and `feedback.cues[0]` are imported from a single client sentence on
  much of the bank, so several cards deduplicate down to one sentence where richer authored
  content would give two. That is a content limitation, not a code one; the review shows what
  was authored and invents nothing.
- `evaluation.stages[].expected_actions` is still empty across the bank — DATA-002 leaves it
  so deliberately, because the specification states expected actions in prose. The review does
  not need it (the scoring declaration carries the same information in a form that cannot
  drift from what the engine enforces), but a populated `expected_actions` would let the
  correct path name specific affordances rather than stage-level actions.
- `severity` decides which mistake supplies the card headline. It is a fixed table, not a
  per-scenario judgement, so on a scenario whose worst moment is unusual the headline may name
  a different mistake from the one an instructor would pick. Every mistake is still listed,
  in order.
- **The production-facing development server on ports 5000 / 5173 is still running** — the
  recurring hazard recorded in 15.39, 15.43, 16.11, 16.12, 16.13 and 16.14. Found running at
  the start of this task and left untouched; nothing in this task used it.

### Deferred

1. Stop the production-facing dev server on 5000/5173, and reset the three deadline-less
   `in_progress` attempts it created (carried from 16.13 / 16.14).
2. Richer per-scenario `safe_action` and `cues`, if the client wants two distinct sentences
   rather than one, would be a content pass — no code change.
3. Populate `evaluation.stages[].expected_actions` if the correct path should name specific
   affordances.

### Next task

**Client review of the training feedback.** W06–W10 are intentionally **NOT** started, and
should not begin until both this review and the W01–W05 pilot review have happened.

---

## 16.16 IMMERSIVE-003B — WhatsApp W06–W10 (COMPLETED 11 September 2026)

**Scope.** The five WhatsApp scenarios W06–W10 and nothing else. No backend engine change, no
scoring change, no timer change, no change to the training-feedback review, and no change to
the 100-scenario bank or the synthetic asset bank — both content fingerprints are byte
identical before and after. W11–W25, Instagram, Email and SMS are untouched, and W01–W05
keep every one of their existing tests.

### What was asked for

Continue the interaction model IMMERSIVE-003A-R2 established, for the next five WhatsApp
scenarios, with the research performed rather than requested — and with the explicit
instruction that the assessment must not feel like "choose one of these 4–5 options".

### Research

Each scenario was mapped against **MITRE ATT&CK v19.2** (current release, 28 April 2026),
read from the live technique pages rather than recalled, with technique version and
last-modified dates recorded. Full record in
[`docs/WHATSAPP_W06_W10_REAL_WORLD_RESEARCH.md`](docs/WHATSAPP_W06_W10_REAL_WORLD_RESEARCH.md).

| Scenario | Primary technique | Note |
| --- | --- | --- |
| W06 | **T1598.001** Phishing for Information: Spearphishing Service | with **T1684.001** (impersonating an internal function) and **T1589** (the objective — a service card is identity information) |
| W07 | **none, deliberately** | ATT&CK catalogues adversary behaviour; a cousin sending the invitation PDF she was asked for is not any. The closest defensible reference — the false-positive cost the client's own −4 `FALSE_REPORT_BLOCK` prices — is recorded instead |
| W08 | **T1660** Phishing (Mobile) | its own description names both quishing and WhatsApp distribution; with **T1583.001** (the six-day-old claim host) and **T1657** (the objective) |
| W09 | **T1586.002** Compromise Accounts, recorded as a **partial** fit | the mechanism is exactly its description — trust from "an existing persona with a compromised account" — but the sub-technique names *email* accounts, and this is a messaging account, so the narrower scope is stated rather than hidden. With **T1657** (which names BEC explicitly) and **T1684.001** |
| W10 | **T1676** Linked Devices (Mobile) | **exact**, and the newest technique used anywhere in this project — created 19 May 2025, names WhatsApp, names QR codes, names the outcome. Real-world instance: Star Blizzard / COLDRIVER, Microsoft Threat Intelligence, 16 Jan 2025; ATT&CK now carries T1676 on that group |

### The five, and why each feels different

Each was built around a **distinct interaction archetype**, not five variations of one
phishing message:

| | Archetype | The distinct interaction |
| --- | --- | --- |
| W06 | Elicitation of an identity document | **The attachment tray.** The unsafe act is opening your own gallery, tapping your own service card and pressing Send |
| W07 | Legitimate, expected document | **The document.** The learner's own request for the file is visible three beats above it; the viewer opens a real invitation that asks for nothing |
| W08 | Chain message in a community group | **The crowd.** Twenty-two neighbours, two already claiming success, one doubting. Holding a position while the room moves |
| W09 | Compromised genuine account | **The refused call.** Every identity check comes back clean; the only thing that settles it is the call the message forbids |
| W10 | Linked-device authorisation | **The settings screen.** The same screen carries the unsafe control and the evidence that condemns it, reached two different ways |

### Architecture

Reused, not rebuilt. The scene registry, `sceneModel`, `useSceneNavigation`, the surface
router and every W01–W05 primitive are unchanged; adding the batch is five modules plus five
rows in the registry.

Three shared primitives were added, all generic:

- **`fileCard` and `media` beats** — the document bubble and the photo/QR bubble. Named
  `fileCard` rather than `document` so a scene module cannot shadow the global.
- **`AttachmentTile`** — attachments drawn from CSS and inline elements rather than loaded.
  There is no image file anywhere in the product: a QR is a deterministic grid derived from
  its own label, a crest is a drawn roundel, a service card is a drawn rectangle. A scenario
  that needed a real picture could not survive the network being off.
- **`SURFACE.VIEWER` / `ViewerSurface`** — one screen for the document viewer, the photo
  viewer, the QR inspector and the attachment gallery, because all four are a tile, some rows
  of facts and sometimes a list. Four components would have drawn the same header four times.

### The known W02 limitation, fixed

§22 asked that "link opening should not unnecessarily consume the useful interaction path" be
addressed where relevant. It is relevant to W08 and W09, and both are fixed the same way.

The client prices two depths at the branch stage — engaging at −3 and releasing details at
−8 — but the engine takes exactly one decision per stage. In W02 the only route to the
payment form ran through a scored control, so opening the page consumed the branch and the
−8 route could not be reached in the same run. In W08 the walk to the claim page is now
**local navigation** from the decoded QR result, and in W09 the walk to the shop and the till
is local; only the commit is scored. Both depths are genuinely reachable and no half of the
scenario's scoring is dead. Verified in the browser: walking claim → OTP records nothing.

### A real defect found in the bank, worked around rather than hidden

The DATA-003 generator captures the client's notification with a non-greedy match that stops
at the **first apostrophe**. Any client sentence containing one is truncated. **Twelve of the
hundred scenarios are affected** across all four platforms — W06, W09, W15, W20, W22, W25,
I15, I18, E06, E12, E18, E25 — and the worst is W09, whose stored body is literally `Can`,
from "Can't talk. Buy four gift cards...".

This task could not fix it: regenerating rewrites the production synthetic bank and every
platform file in it, which this task was explicitly forbidden to touch. So the bank is left
exactly as it is, the W06 and W09 scenes state the client's own full sentence, and
`sceneModel.test.js` names those two scenarios explicitly and asserts the scene text *starts
with* the stored string — a paraphrase still fails, and fixing the bank breaks the test and
sends whoever fixed it to the workaround. **The notification toast still shows the truncated
text**, which is visible in the browser and is recorded below as a known limitation.

### A test fixture that had drifted from the engine

`frontend/src/test/attemptFixtures.js` held a `NEXT_STAGE` map missing six legal intents —
`inspect_profile`, `preview_file`, `inspect_qr`, `scan_qr`, `attempt_install`,
`approve_device_link` — and a `CONSEQUENCES` map missing four. A missing entry does not fail:
it silently leaves the stage where it was, so a gap looked exactly like a scene bug. Both maps
are now complete and carry a note saying why they must stay that way.

### Tests

| Suite | Result |
| --- | --- |
| `backend/tests/sceneAffordance.test.js` (extended) | 9 / 9 — every control legal, every safe path exactly ten |
| `frontend/src/pages/SceneScenariosB.test.jsx` (new) | 35 / 35 |
| `frontend/src/simulation/sceneModel.test.js` (extended) | passes, including the truncation guard |
| `frontend/src/simulation/sceneResearch.test.js` (extended to both batches) | passes |
| `SceneContainment` / `SceneForms` (generic over the batch) | pass |
| Full backend `npm test` | **464 pass, 0 fail**, 322 skipped (no DB URI) |
| Every DB-backed suite, sequential, isolated DBs | 9+40+25+27+20+37+21+25+32+25+28+21+21 = **331 / 331** |
| Full frontend `vitest run` | **638 / 638**, 23 files |
| `oxlint` | clean |

### Scoring, verified through the real engine over HTTP

Fourteen paths played by `backend/scripts/playScenario.js` against an isolated database:

| Scenario | safe | unsafe routes |
| --- | --- | --- |
| W06 | **10/10** | release −8 → 0/10 · premature −1 → 7/10 |
| W07 | **10/10** (`CORRECT_USE`) | false positive → 0/10 · install `UNSAFE_EXTERNAL_ACTION` −4 → 3/10 |
| W08 | **10/10** | release −8 → 0/10 · scan −3 → 4/10 |
| W09 | **10/10** | pay −8 → 0/10 · report-without-checking +1 → 8/10 |
| W10 | **10/10** | approve device link −8 → 0/10 · scan −3 → 4/10 |

### Training-feedback integration

JOB 1's review reads these runs from the ledger with no change of any kind. Confirmed on
seeded attempts: W06 and W08 produce `skipped_inspection`, `released_details_or_paid`,
`verified_through_the_message` and `contradictory_resolution`; W07 reported produces
`false_positive` with `abandoned_without_checking` and `rejected_a_genuine_item`; a premature
W06 produces `premature_action` + `no_inspection` at 7/10.

### Browser verification

Isolated database `cyber_awareness_003b_verify`, API on 5055, frontend on 5199. The
production-facing dev server on 5000/5173 was **not running** at any point in this task.

Played through the real UI: W06 safe end to end (committed 10/10 in the ledger), W08 unsafe
(claim → OTP walked locally with zero events, then `submit_data` −8), W07's document viewer.
Reload mid-scenario on a pushed surface rebuilt at `verify` from the server with the surface
stack correctly gone and sequence preserved. 375×812 and 640-wide (200% zoom): no horizontal
overflow, no element wider than the viewport. Offline: **zero external resources**, zero
`img`/`iframe`/`video`/`audio`/`source`/`embed`/`object` elements, zero external `href`.
Ledger privacy: no typed card number, name, CVV, OTP or filename anywhere; metadata keys
confined to the allowlist.

**Production was not mutated.** `cyber_awareness_training` holds identical counts before and
after: attempts 10, candidates 9, runs 100, events 209, definitions 100, legacy scenarios 40,
assessments 1, snapshots 6. Both content fingerprints unchanged
(`8e7a6c98…a7687`, `2779b039…afde1`).

### Known limitations

- **The truncated notification toast.** W06 and W09 show the bank's truncated body at the
  notify stage, because that toast is server-driven from the pinned asset. The conversation
  itself carries the client's full sentence. Fixing it properly means regenerating the
  synthetic bank, which is out of this task's scope; a follow-up task is queued.
- **One decision per stage still bounds the deepest unsafe act.** Making the walk local
  (above) means both −3 and −8 are *reachable*, but a single run still records one of them.
  That is the specification's rule, not a UI choice.
- **W09's contact sheet is deliberately clean**, so a learner who only checks identity will
  get it wrong. That is the scenario's lesson, but it is the hardest of the ten and may read
  as unfair to a first-time learner without the end-of-attempt review to explain it.
- The drawn QR codes encode nothing. A real reader is the one thing an offline simulation
  cannot have, so what a code "contains" is stated in words by the inspector.
- `link_hover_ms` is still produced nowhere (matrix row 4.11); no telemetry was invented.
- Ad-hoc test database names collided once during verification and produced a spurious
  `attemptTimer` failure; re-run on a clean database it passes 27/27.

### Deferred

1. Fix the DATA-003 notification truncation and regenerate the synthetic bank (12 scenarios,
   all four platforms). Needs its own authorisation because it rewrites production content.
2. `link_hover_ms`, carried from earlier tasks.
3. Move the two W03 / W04 content conflicts into `synthetic/v2` if the client prefers.

### Next task

**W06–W10 complete. W11–W15 not started.** Ten of the twenty-five WhatsApp scenarios now have
authored scenes; the other fifteen, and all of Instagram, Email and SMS, remain on the generic
renderer and are untouched.

---

## 16.17 IMMERSIVE-003C — WhatsApp W11–W15 (COMPLETED 11 September 2026)

**Scope.** The five WhatsApp scenarios W11–W15 and nothing else. No backend source file, no
scoring change, no selection change, no timer change, no change to the training-feedback
review, and no change to the 100-scenario bank or the synthetic asset bank — both content
fingerprints and all ten bank files are byte identical before and after. W16–W25, Instagram,
Email and SMS are untouched, and W01–W10 keep every one of their existing tests.

### Research

Mapped against **MITRE ATT&CK v19.2** (confirmed current on the live site during the task),
every technique read from its live page with version and dates recorded; real-world patterns
from public advisories and published research (I4C, SEBI, FBI IC3, SentinelOne, a state police
advisory). Full record: [`docs/WHATSAPP_W11_W15_REAL_WORLD_RESEARCH.md`](docs/WHATSAPP_W11_W15_REAL_WORLD_RESEARCH.md).

| Scenario | Disposition / canonical family | Mapping |
| --- | --- | --- |
| W11 Expected Welfare Appointment | legitimate / `legit_system_confirmation` | **none, deliberately** — the closest reference is the false-positive and untrusted-channel cost the client prices at −4, and the real pattern behind the scene's trap (fake helpline numbers in search results) |
| W12 Digital Arrest Escalation | malicious / `coercion_and_extortion` | **T1684.001**, parent **T1684** (whose description now names scare tactics and AI-enabled voice), **T1657** (names extortion) |
| W13 Guaranteed IPO Group | malicious / `investment_and_task_fraud` | **T1657** (names pig butchering), **T1585.001**; partial fit stated — group mechanics come from SEBI, not ATT&CK |
| W14 Movement Order APK | malicious / `malware_delivery` | **T1660** (Mobile), **T1636.004**, **T1417.001**, **T1513**; real-world: Transparent Tribe / CapraRAT (G0134 page is enterprise-only, so the Android half is sourced to SentinelOne) |
| W15 Senior's Urgent Voice Note | malicious / `operational_elicitation` | **T1588.007** (AI-generated audio), **T1598.004** (partial — framed around calls), **T1684.001**, **T1585.001**; real-world: FBI PSAs, May and December 2025 |

Military flag: W14 and W15 yes; W11, W12, W13 no.

### The five, and what each brings that W01–W10 did not

| | Archetype | The new interaction |
| --- | --- | --- |
| W11 | Genuine item, cross-app corroboration | **A business message with its own reply buttons**, and a check that lives in a second app (the booking portal). The trap is a "verification" that is not one: a sponsored helpline in web search results |
| W12 | Live coercion | **A video call you have to leave.** Drawn uniformed caller, a countdown in the frame, "do not disconnect"; End call is the scored decision, the deposit sheet is reached from inside the call, and answering from the chat list is the premature route |
| W13 | Manufactured crowd | **A room you cannot speak in.** Admin-only posting replaces the composer; group info shows every account that ever posted a profit is an admin on a consecutive number |
| W14 | Malicious app | **The operating system.** The phone's own installer: "not allowed to install unknown apps", the settings switch, the permission list, and the prompts after an install |
| W15 | Synthetic voice | **Something to listen to.** A voice note with play, waveform and transcript — all local — and a voice the scene never says is wrong; the evidence is everything except the voice, and the verification is the chain of command |

### Architecture

Five scene modules plus five registry rows, on the existing layer. Generic additions only:

- **Beats** — `voice` (voice note: local play over the authored clock, waveform, app transcript),
  `template` (business message with attached reply buttons; spent buttons stay as text), `callEvent`
  (missed / ringing / ended call entry); `voice` joins the thread's grouping rule.
- **`SURFACE.INSTALLER` / `InstallerSurface.jsx`** — system dialog, settings switch and permission
  prompts, with page-scoped controls and `final` pages, on the existing page machinery.
- **`CallSurface` video mode** — drawn remote party, overlay, countdown, captions aligned by
  speaker, local `links` to another surface, and `endCallScored` so a scene can own End call while
  the stage offers it (the phone's own End call returns once the stage has moved on).
- **Browser blocks** `search` and `listing`; **attachment arts** `chart`, `document`, `apk`,
  `voice`; a **`row`** control variant for bubble-attached buttons; an **admin-only strip** in place
  of the composer.

### Three findings, all recorded

1. **The narrator line leaks the verdict in this batch.** The bank's `prior_context` ("Context
   presented") reads "fabricated profits and a supposed adviser" for W13 and "a cloned profile sends
   a convincing synthetic voice note" for W15. W11–W15 therefore present that context through the
   conversation and do not print it; a test asserts neither the sentence nor any labelling word
   appears. **W09 and W10 already ship verdict-bearing narrator lines** ("genuine account", "fake
   support account") — out of scope, listed for the next content pass.
2. **W15 is the third truncated notification** (`Voice note - Send today`). Same workaround as W06 /
   W09; the toast still shows the stored text.
3. **A test fixture collided with the batch.** `attemptFixtures.js`'s generic-path fixture was keyed
   to `W12` precisely because W12 had no scene; authoring W12 turned 15 generic-path tests into scene
   tests that timed out. Re-keyed to `W99`, which is in no bank, so no future batch can collide.

Also found and fixed during browser verification: the drawn uniformed caller rendered as a face
only (percentage heights inside a container with no height); fixed and re-checked on screen.

### Tests

| Suite | Result |
| --- | --- |
| `backend/tests/sceneAffordance.test.js` (extended) | **18 / 18** — every W11–W15 control legal on its real definition, safe paths exactly ten, 44 new pinned event/point pairs, and nine walks resolved by the real engine and fed to the real review builder |
| `frontend/src/pages/SceneScenariosC.test.jsx` (new) | **37 / 37** |
| `frontend/src/simulation/sceneModel.test.js` (extended) | passes — batch-C differentiation, no narrator verdict, foreign numbers only from a fiction-reserved range, W15 truncation guard |
| `SceneContainment` / `sceneResearch` (generic over the batches) | pass |
| Full frontend `vitest run` | **795 / 795**, 24 files |
| Full backend `npm test` | **473 pass, 0 fail**, 322 skipped (no DB URI) |
| Every DB-backed suite, sequential, isolated DBs | 25+20+40+27+37+25+21+25+28+21+21+32 = **322 / 322** |
| `oxlint` (frontend) | clean; build clean |

### Scoring and review, through the real engine over HTTP

Fifteen paths played by `backend/scripts/playScenario.js` (new `REVIEW=1` mode completes the
attempt and prints the JOB 1 review) against `cyber_awareness_003c_verify` on API port 5055:

| Scenario | safe | unsafe routes |
| --- | --- | --- |
| W11 | **10/10** | search helpline −4 → 3/10 (`unsafe_handling`) · ignore + report → 0/10 (`false_positive`) |
| W12 | **10/10** | answer from list + pay → 0/10 (premature, no inspection, released, verified via message) · stay on call → 4/10 |
| W13 | **10/10** | deposit + continue → 0/10 · DM admin + report unchecked → 2/10 |
| W14 | **10/10** | install → 0/10 · premature tap, then cancel → 7/10 |
| W15 | **10/10** | send phrase + continue → 0/10 · call the new number → 4/10 |

Every review named the learner's actual mistakes with the scenario's **own stage text** as the
correct action; `review leaks none` on all fifteen. Event metadata keys confined to the allowlist.

### Browser verification

Isolated DB `cyber_awareness_003c_verify`, API **5055**, frontend **5199** (verify mode). The
production-facing dev server on 5000/5173 was **not running** at any point. Two attempts played
through the real UI: W13 safe (10/10), W11 search-helpline route (3/10), W12 safe at **375×812**
(10/10), W15 safe (10/10), W14 install at **640 wide / 200% zoom** (0/10), W11 safe at 640 (10/10).
Reload on a pushed screen at the Decide stage rebuilt from the server with the surface gone and the
timer continuing. No horizontal overflow at 375 or 640. End-of-attempt review showed W11 "Unsafe step
taken" and W14 "Threat missed" with their own correct actions; no event code, point field or
evaluation key in the DOM. Offline: the only origins in the session were `localhost:5199` and
`localhost:5055`; no `img`/`audio`/`video`/`src` in the device.

**Production was not mutated.** `cyber_awareness_training` identical before and after: attempts 10,
candidates 9, runs 100, events 209, definitions 100, legacy scenarios 40, assessments 1,
snapshots 6.

### Known limitations

- The notify-stage toast for W15 shows the bank's truncated body (as W06 and W09 do).
- W09 and W10 print verdict-bearing narrator lines (finding 1); not changed here.
- One decision per stage still bounds the deepest unsafe act in a single run (W12 can record the
  deposit or the ID, not both) — the specification's rule.
- Answering W12's call is navigation, not a scored act, by design; staying on it is scored.
- Thread beats after the branch stage are branch-neutral (the scene cannot know which branch was
  taken after a reload), so W11's post-confirmation reminder appears whatever was chosen.
- W12's `+44 7700 900xxx` secure line is the UK regulator's drama range — reserved for fiction,
  and asserted by a test, but not the project's `+91 00000` convention.
- The Browser pane's click tool timed out under mobile touch emulation; the mobile and 200% runs
  used DOM clicks after the same interactions had been proven with real clicks at desktop.

### Deferred

1. The DATA-003 truncation fix and bank regeneration (now 12 scenarios, W15 included).
2. Remove the verdict-bearing narrator lines from W09 / W10 (a content pass).
3. `link_hover_ms`, and the W03 / W04 content conflicts, carried forward.

### Next task

**W11–W15 complete. W16–W20 not started. W21–W25 not started. Instagram, Email and SMS
untouched.** Fifteen of the twenty-five WhatsApp scenarios now have authored scenes.

---

## 16.18 IMMERSIVE-003D — WhatsApp W16–W20 (COMPLETED 11 September 2026)

**Scope.** The five WhatsApp scenarios W16–W20 and nothing else. No backend source file, no
scoring change, no selection change, no timer change, no change to the training-feedback review,
the attempt API or the result API, and no change to the 100-scenario bank or the synthetic asset
bank — both content fingerprints and all ten bank files are byte identical before and after.
W21–W25, Instagram, Email and SMS are untouched; W01–W15 keep every existing test.

### Research

Mapped against **MITRE ATT&CK v19.2** (released 28 April 2026, re-confirmed current on the live
versions page during the task), every technique read from its live page with version and dates
recorded. Real-world patterns: FTC's December 2024 task-scam data spotlight and an I4C-referenced
bank advisory (W17), the Singapore Police Force's March 2026 WhatsApp-takeover advisory (W18),
Indian reporting on Army impersonation-profile advisories (W19), FBI IC3's 2025 annual report and
its September 2024 BEC PSA (W20). Full record, including a W01–W15 vs W16–W20 differentiation
matrix: [`docs/WHATSAPP_W16_W20_REAL_WORLD_RESEARCH.md`](docs/WHATSAPP_W16_W20_REAL_WORLD_RESEARCH.md).

| Scenario | Disposition / canonical family | Mapping |
| --- | --- | --- |
| W16 Verified Vehicle-Pool Change | legitimate / `legit_coordination_request` | **none, deliberately** — the closest reference is the client's discrimination pricing (false report −4, untrusted channel / over-share −4, needless reject −2) |
| W17 Part-Time Rating Tasks | malicious / `investment_and_task_fraud` | **T1657**, **T1585.001**; partial fit stated — the task mechanics come from the FTC and I4C, not ATT&CK |
| W18 Hijacked Group Admin Roster Link | malicious / `identity_data_harvesting` | **T1586.001** (partial — names social-media accounts), **T1534** (now names internal chat apps), **T1598.003** |
| W19 Commander Clone Requests Location | malicious / `operational_elicitation` | **T1684.001**, **T1585.001**, **T1593.001**, **T1598**; **T1430 considered and rejected** (malware / OS-API location collection, not a person pressing Share) |
| W20 Supplier Bank-Detail Change | malicious / `payment_diversion` | **T1657** (names BEC payment redirection and vendor impersonation), **T1684.001** |

Military flag: W16, W18, W19 yes; W17, W20 no.

### The five, and what each brings that W01–W15 did not

| | Archetype | The new interaction |
| --- | --- | --- |
| W16 | Genuine item under authority and a clock | **A pinned message sets the meaning of the new one** (the three-week-old contingency note, reached from the pinned bar); the acknowledgement is **a reaction on the message itself**; the risk is what the learner **adds** (names and route) or **forwards**, not who is asking |
| W17 | Task scam, one-to-one | A **"Forwarded many times"** bulk advert; the **"joining gift" already in the learner's own bank app**, from an individual; three **rating tasks done by the learner's own taps** before a merged order goes negative; bank details "for payouts" (mule) and recruit-your-friends routes; verification in a **vacancy app** |
| W18 | Genuine admin account, hijacked | **The group's own record of what changed**: security-code-changed line, description changed minutes before, the admin's pinned rule contradicted, a member's warning **deleted by admin**, other members' **reactions**, and the admin's card showing every earlier message signed "- Coy Office" |
| W19 | Senior clone asking for position | A **one-letter** difference in a copied About line; the **real CO's chat, one row down**, contradicting the request; the phone's own **attach → location permission → live-location sheet** |
| W20 | Vendor bank-detail change | **Every reference correct** (stolen, not guessed); a "revised" copy of a real invoice; the decision taken **in the organisation's procurement portal** — vendor record, beneficiary edit, single-approver override, dual control |

### Architecture

Five scene modules plus five registry rows, on the existing layer. Generic, optional additions
only (no W01–W15 scene sets any of them):

- **Message beats** — `forwarded` (`once` / `many`), `reactions`, `deleted` / `deletedBy`, and
  anchored controls on a plain message; a conversation-level **pinned bar** (`pinned`).
- **Composer attach sheet** — a local control in the `COMPOSER` slot is listed behind a real
  Attach button; **chat-list rows** may `open` another chat's details locally.
- **`INSTALLER` widened** to the phone's other system screens: surface `closeLabel` / `inertNote`
  and a `sheet` page style; **attachment art** `map` (drawn, no tile, no coordinates).

### Findings, all recorded

1. **Shared form defect, fixed.** `localForm.normalise` capped every field at its minimum
   `length` and ignored `max` — already affecting W02 (name on card at 3 characters, UPI ID at 6),
   W05 (ID number) and W08 (name on card). Aligned with `field()`'s documented contract; pinned by
   a test. Found by typing into W18's roster form in the browser.
2. **W20 is the fourth truncated notification** (`...for today`). Same workaround as W06 / W09 /
   W15; the notify toast and the result card still show the stored text.
3. **The narrator line leaks the verdict for four of the five** ("already published", "a real
   group admin account… conflicts subtly", "a clone", "a new beneficiary"). Not printed; asserted.
4. **The resolve banner had become an answer key** in W01–W15 (only correct resolutions in it).
   W16–W20 put one right and one wrong option there; asserted. W01–W15 unchanged (out of scope).
5. Found and fixed on screen: the share sheet's map collapsed inside a flex wrapper; W19's beats
   ran out of order against the bank's 16:38 headline time; three resolve labels were too long at
   375 / 640 px.

### Tests

| Suite | Result |
| --- | --- |
| `backend/tests/sceneAffordance.test.js` (extended) | **29 / 29** — every W16–W20 control legal on its real definition, safe paths exactly ten, 56 new pinned event/point pairs, 19 W16–W20 walks (5 safe, 9 unsafe, 5 leak checks) resolved by the real engine and fed to the real review builder |
| `frontend/src/pages/SceneScenariosD.test.jsx` (new) | **44 / 44** |
| `frontend/src/simulation/sceneModel.test.js` (extended) | **305 / 305** — batch-D differentiation, no narrator verdict, W20 truncation guard, W21–W25 still generic |
| `sceneResearch` / `SceneContainment` (generic over the batches) | **54 / 54**, **81 / 81** |
| Full frontend `vitest run` | **952 / 952**, 25 files |
| Full backend `npm test` | **484 pass, 0 fail**, 322 skipped (no DB URI) |
| Every DB-backed suite, sequential, isolated DBs (`cyber_awareness_003d_t_*`) | 25+20+40+27+37+25+21+25+28+21+21+32 = **322 / 322** |
| `oxlint` (frontend) | clean; build clean |

### Scoring and review, through the real engine over HTTP

Fifteen paths played by `backend/scripts/playScenario.js` (W16–W20 paths added; `REVIEW=1`)
against `cyber_awareness_003d_verify` on API port 5055:

| Scenario | safe | unsafe routes |
| --- | --- | --- |
| W16 | **10/10** | over-share −4 → 3/10 (`unsafe_handling`) · mute + report → 0/10 (`false_positive`) |
| W17 | **10/10** | reply from preview + recharge → 0/10 · bank details for payouts → 0/10 |
| W18 | **10/10** | submit form + ask the account → 0/10 · forward the link + report unchecked → 2/10 |
| W19 | **10/10** | share live location 1 h → 0/10 · ask a question → 4/10 |
| W20 | **10/10** | override and release → 0/10 · submit change for second approval → 0/10 |

Every review named the learner's actual mistakes with the scenario's **own stage text** as the
correct action; `review leaks none` on all fifteen. Event metadata keys confined to the allowlist.

### Browser verification

Isolated DB `cyber_awareness_003d_verify`, API **5055**, frontend **5199** (verify mode). The
production-facing server on 5000/5173 was **not running** at any point. Three attempts through the
real UI: W19 safe at desktop (chat-list peek, contact card, attach → permission → share sheet →
Don't allow, duty office, block; **reload on the pushed call screen** at Resolve rebuilt from the
server with the timer running), W17 recharge route at **375×812** (forwarded label, bank app, three
tasks, merged order, PIN) and W17 safe, W18 form-submission route at **640 wide (≈200 %)** and W18
safe, W20 safe (invoice, portal, vendor record, hold, Rohit), W16 safe (pinned bar, plan, reaction,
Movement Board, continue). Scores matched the engine exactly; the end-of-attempt review showed
W17/W18 "Threat missed" with their own correct actions and W16 "Handled safely"; no engine
vocabulary in the result DOM. No horizontal overflow at 375 or 640. **Offline:** the only origins
in the session were `localhost:5199` and `localhost:5055`. The typed PIN, service number, role and
location appear nowhere in the stored ledger.

**Production was not mutated.** `cyber_awareness_training` identical before and after: attempts 10,
candidates 9, runs 100, events 209, definitions 100 (none inactive), legacy scenarios 40,
assessments 1, snapshots 6.

### Known limitations

- The W20 notify toast and result card show the bank's truncated body (as W06, W09, W15).
- Thread beats after the branch are branch-neutral; W16's reaction is not redrawn on the message
  after a reload (the ledger holds it).
- One decision per stage bounds each run to one unsafe act (W17: recharge **or** bank details).
- Browser runs covered W16/W19/W20 safe routes and W17/W18 both routes; the W16, W19 and W20
  unsafe routes were verified over HTTP and in the jsdom page suite, not by hand in the browser.
- W01–W15's resolve banners still hold only correct options (finding 4).
- W09 and W10 still print verdict-bearing narrator lines (carried from 003C).

### Deferred

1. The DATA-003 truncation fix and bank regeneration (now 12 scenarios; W20 included).
2. Mix right and wrong options into W01–W15 resolve banners; remove the W09 / W10 narrator lines.
3. `link_hover_ms`, and the W03 / W04 content conflicts, carried forward.

### Next task

**W16–W20 complete. W21–W25 not started. Instagram, Email and SMS untouched.** Twenty of the
twenty-five WhatsApp scenarios now have authored scenes.

---

## 16.19 IMMERSIVE-003E — WhatsApp W21–W25, the final WhatsApp batch (COMPLETED 14 September 2026)

**Scope.** The five WhatsApp scenarios W21–W25 and nothing else. No scoring, selection, timer,
attempt-API, result-API or training-review change; no change to the 100-scenario bank or the
synthetic asset bank — both content fingerprints and all ten bank files are byte identical before and
after. One narrowly scoped backend validation fix (below), found by browser verification.
**WhatsApp is now 25/25.** W26+ not started; Instagram, Email and SMS untouched.

### Research

Mapped against **MITRE ATT&CK v19.2** (re-confirmed current on the live versions page on 14 September
2026), every technique read from its live page. Real-world sources: FBI IC3 PSA of 3 October 2022 on
cryptocurrency investment schemes (W22); US Army intelligence warning of 13 November 2025 on
adversaries approaching servicemembers and families, plus the Indian Army impersonation-advisory
reporting already cited for W19 (W23); ESET's 5 November 2025 analysis of the WhatsApp screen-sharing
scam and the RBI remote-access-app warning (W24); Gen Digital's 15 December 2025 "GhostPairing"
research (W25). Full record with a W01–W20 comparison matrix:
[`docs/WHATSAPP_W21_W25_REAL_WORLD_RESEARCH.md`](docs/WHATSAPP_W21_W25_REAL_WORLD_RESEARCH.md).

| Scenario | Disposition / canonical family / triggers | Military | Mapping |
| --- | --- | --- | --- |
| W21 Verified Senior Requests Secure Follow-Up | legitimate / `legit_routine_broadcast` / authority | yes | **none, deliberately** |
| W22 Long-Game Online Friendship | malicious / `relationship_grooming_fraud` / trust, reciprocity | no | **T1657**, **T1585.001** (partial — grooming sourced from IC3) |
| W23 Family Welfare Pretext | malicious / `operational_elicitation` / empathy, authority | yes | **T1598.001**, **T1684.001**, **T1591** (partial) |
| W24 Remote Support Screen Share | malicious / `tech_support_and_callback_fraud` / fear, helpfulness | no | **T1660**, **T1663**, **T1513**, **T1516**, **T1684.001**; **T1219 considered and rejected** |
| W25 Known Contact Sends a Linking Code | malicious / `account_takeover_authorisation_abuse` / trust, reciprocity | no | **T1676**, **T1586.001**, **T1684.001** (partial — pairing code vs QR); **T1111 considered and rejected** |

### What each brings that W01–W20 did not

| | The new interaction |
| --- | --- |
| W21 | **A message with nothing to press**: the learner finds REF-ALPHA-17 themselves in SecureDesk (the work-profile portal) and acknowledges it there; the risk is **pulling Restricted detail into WhatsApp** (ask here, call about it, forward the reference); disappearing messages and the senior's own earlier redirection are the context |
| W22 | **Time**: a four-week thread beginning with a **wrong number**, reciprocity from the learner's own "I owe you one", a biography that only fails **across weeks**, an **image search** of her photos and the **regulator's register**, and a boundary reply separating friendship from money |
| W23 | Pressure through the **learner's mother, by name**; a **four-step form whose ask escalates page by page**; verification by **calling Ma**, who reveals she was approached too |
| W24 | A **live support call** coaching the learner through their own phone; **Share screen → the phone's consent dialog**; a diagnosis picture with **another phone's status bar**, contradicted by the phone's own **Device care** |
| W25 | The **genuine history used against the learner**; the **linking code on the learner's own screen** in WhatsApp's notice and request sheet; a "desktop screenshot" showing the **learner's number**; verification by an **ordinary phone call** to the same number |

### Architecture

Five scene modules and five registry rows on the existing layer. Generic additions only: drawn
attachment arts `scan` and `desktop` in `AttachmentTile.jsx`. No new surface kind.

### Findings, all recorded

1. **Cross-cutting defect, fixed.** Every client surface sends `verify_source: "in_message_contact"`;
   the `ScenarioEvent` metadata enum listed only `in_message`, so the in-message verification route
   returned **422 in a real browser for every scenario** (W01–W20 and the generic action sheet
   included) while every stubbed suite passed. `ScenarioEvent.js` now accepts both (metadata only; no
   score reads it; nothing stored becomes invalid). Pinned by a new `sceneAffordance.test.js` guard
   that fails without the fix.
2. **Truncated notifications**: W22 (`My uncle`) and W25 (`I`) join W06/W09/W15/W20; scenes carry the
   full sentence, the toast and result card still show the stored body. Bank not regenerated.
3. **Narrator lines leak the verdict** for W22–W25; not printed; asserted.
4. W24's post-call entry read "Missed" after answering → neutral entry; typing strips now drawn after
   consequence beats (W22–W25).

### Tests

| Suite | Result |
| --- | --- |
| `backend/tests/sceneAffordance.test.js` | **43 / 43** (was 29): W21–W25 legality, safe paths exactly ten, 65 pinned event/point pairs, canonical identity, 13 engine→review walks, verification-source guard |
| `frontend/src/pages/SceneScenariosE.test.jsx` (new) | **45 / 45** |
| `frontend/src/simulation/sceneModel.test.js` | **386 / 386** — W01–W25 registry, no id collision, other platforms generic, batch-E differentiation, W22/W25 truncation guard, no narrator verdict |
| `SceneContainment` / `sceneResearch` | **101 / 101**, **66 / 66** |
| Full frontend `vitest run` | **1110 / 1110**, 26 files; `oxlint` clean; build clean |
| Full backend `npm test` | **498 pass, 0 fail**, 322 skipped (no DB URI) |
| DB-backed suites, sequential, isolated DBs (`cyber_awareness_003e_t_*`) | **322 / 322** (a first pass run concurrently with HTTP play had 2 contention failures; both suites pass alone and in the clean batch) |

### Scoring and review, through the real engine over HTTP

`playScenario.js` (W21–W25 paths added, `REVIEW=1`) on `cyber_awareness_003e_verify`, API 5055:
W21 safe **10** · ask on WhatsApp **3** (`unsafe_handling`) · mute + block + report **0** (`false_positive`);
W22 safe **10** · deposit **0** · ask for proof + report unchecked **2**; W23 safe **10** · submit form **0** ·
ask after mother **4**; W24 safe **10** · share screen **0** · install from preview **0**; W25 safe **10** ·
link device **0** · send code **0**. Every review used the scenario's own stage text; `review leaks none`.
W01–W20 regression (W06, W07, W10, W12, W14, W16, W17, W19, W20) matched 003B–003D exactly.

### Browser verification

Isolated DB `cyber_awareness_003e_verify`, API **5055**, frontend **5199**; 5000/5173 not running.
All five scenarios played by hand in the real UI: **safe path 10/10 for each of W21–W25**, and at
least one unsafe route each (W21 false positive 0, W22 deposit 0, W23 form submission 0, W24 screen
share 0, W25 link device 0); result page and post-attempt review checked; reload on a pushed surface
(W25) rebuilt from the server; W23 at **375 px** and W22 at **640 px (≈200%)** with no horizontal
overflow. Ledgers read back matched the engine; metadata keys within the allowlist; no typed value or
linking code stored. **Offline:** only `localhost:5199` and `localhost:5055` contacted.

**Production was not mutated.** `cyber_awareness_training` identical before and after: attempts 10,
candidates 9, runs 100, events 209, definitions 100 (none inactive), legacy scenarios 40, assessments
1, snapshots 6.

### Known limitations

- W22/W25 (and W06/W09/W15/W20) notify toasts and result cards show the truncated stored body — W25's is "I".
- Thread beats after the branch are branch-neutral (W25's Linked devices shows the request whatever was chosen).
- W24's install route skips the per-source unknown-apps switch (W14 walks it); closing the consent dialog remounts the call screen, replaying captions.
- W21's work profile is represented inside SecureDesk rather than as a launcher screen.
- Non-target runs in browser attempts were closed through the HTTP API, and the isolated WhatsApp pool was temporarily narrowed (restored to 25 active).
- W01–W15 resolve banners still hold only correct options; W09/W10 narrator lines (carried).

### Next task

**W21–W25 complete. WhatsApp W01–W25 complete (25/25). W26+ not started. Instagram, Email and SMS
untouched.** The next job is to be planned separately.

---

## 16.20 IMMERSIVE-004A — Instagram W01–W05 (bank I01–I05), the first Instagram batch (COMPLETED 14 September 2026)

**Scope.** The first five Instagram scenarios and nothing else. The brief calls them "Instagram
W01–W05"; the client's bank numbers them **I01–I05**. No scoring, selection, timer, attempt-API,
result-API or training-review change; no engine or backend source change; the 100-scenario bank and
the synthetic bank are byte identical before and after. WhatsApp W01–W25 unchanged apart from three
optional, generic presentation hooks they do not use (below).

### Research

MITRE ATT&CK **v19.2** (re-confirmed current 14 September 2026), every technique read from its live
page. Real-world sources: Bitdefender giveaway-scam guidance (March 2026); LevelBlue SpiderLabs on
copyright-appeal phishing harvesting backup codes (December 2023) and Instagram's Account Status help
page; AARP on profile cloning (July 2025) and Instagram's impersonation help; the US NCSC's social
media deception material and US Army social-media/geotagging guidance. Full record, with a
twenty-five-row WhatsApp comparison matrix (lesson, mechanism, evidence, interaction, verification,
temptation) and rejected concepts:
[`docs/INSTAGRAM_W01_W05_REAL_WORLD_RESEARCH.md`](docs/INSTAGRAM_W01_W05_REAL_WORLD_RESEARCH.md).

| Scenario | Disposition / canonical family / triggers | Military | Mapping |
| --- | --- | --- | --- |
| I01 Flash Giveaway Winner | malicious / `unsolicited_payment_lure` / greed, scarcity | no | **T1598.003**, **T1585.001**, **T1657** (partial); **T1566.003 considered and rejected** |
| I02 Copyright Appeal Countdown | malicious / `credential_phishing` / fear, urgency | no | **T1598.003**, **T1684.001**, **T1585.001** (partial); **T1111 considered and rejected** |
| I03 Published Blood-Donation Drive | legitimate / `legit_routine_broadcast` / empathy | yes | **none, deliberately** |
| I04 Cloned Friend in Distress | malicious / `impersonation_emergency_payment` / empathy, urgency | no | **T1684.001**, **T1585.001**, **T1657** (partial); **T1586.001 considered and rejected** |
| I05 Friendly New Follower Questionnaire | malicious / `operational_elicitation` / flattery, curiosity | yes | **T1598**, **T1591.001**, **T1589**, **T1591.003**, **T1593.001** (partial) |

### What each brings that WhatsApp W01–W25 did not

| | The Instagram-native interaction |
| --- | --- |
| I01 | A **public post that tags the learner**, comments off; **profile metrics and About this account** (two days old, two former usernames); verification by **searching the app for the verified brand** and reading its **pinned rules**; decision on a claim site ("Continue with Instagram", then a delivery fee) |
| I02 | A **message request** threatening deletion; an appeal login asking for a **password and backup code**; verification in **Settings › Account Status** |
| I03 | The genuine **public broadcast** from a verified, never-renamed account — and the risk displaced to a **stranger in the comments** offering "pre-registration"; don't over-report, don't follow the commenter |
| I04 | The **clone and the real friend side by side** in one social graph, mutuals the clone manufactured, and the real friend's **story from 25 minutes ago**; two independent calls (her saved number, a mutual) |
| I05 | Flattery arriving as a **reply to the learner's own story**, the account's **comment history** asking other runners the same, a **claimed mutual checked by phone**, and the learner's **own privacy** reviewed after resolving |

### Architecture

On the existing layer: five scene packs and five registry rows; `InstagramScene.jsx` (activity /
message-request lists, post and DM views) and `IgBlocks.jsx`; one new reusable surface kind,
`SURFACE.SOCIAL` (`SocialSurface.jsx`: profile, About this account, people, post, story, search,
settings, status). Reused `BROWSER`, `PAYSHEET`, `CALL`. Generic optional additions: `scene.notify.sender`
(toast title) and `scene.messageSender` (Trusted Directory comparison) for banks whose sender asset is
a placeholder; `FIELD_KIND.MASKED` (password text masked by CSS); `SceneControl` variant `ig`.
`playScenario.js` gained I01–I05 paths and `PIN_INSTAGRAM`.

### Findings, all recorded and fixed

1. **Instagram's sender asset is a placeholder** (`@unknownsender274`) contradicting the client's
   `@handle: message` sentence. Scenes use the client's handle; the toast and the directory comparison
   were fixed through the optional hooks. **Remaining:** the server-built result/review card still
   titles an Instagram scenario with the placeholder (bank/result projection, out of scope).
2. **The delivered list row drew empty** in a real browser while jsdom passed (accessible-name
   lookups). Fixed and asserted by visible text.
3. **Answer leakage**: "Report the clone for impersonation" and several hint-bearing labels. Relabelled;
   an Instagram-wide verdict-word assertion added.
4. Posts opened scrolled to the last comment; carousel glyph over the title and no slide change;
   repeated handles in notifications; WhatsApp-green chips; filled Follow buttons on followed
   accounts; a tick on a neutral privacy row; I05 echoing the wrong quick reply. All fixed.

### Tests

| Suite | Result |
| --- | --- |
| Full frontend `vitest run` | **1256 / 1256**, 27 files (1110 before); `oxlint` clean; build clean |
| `frontend/src/pages/SceneScenariosInstagram.test.jsx` (new) | **33 / 33** |
| `frontend/src/simulation/sceneModel.test.js` | **468 / 468** (386) |
| Full backend `npm test` | **509 pass, 0 fail**, 322 skipped (498 before) |
| `backend/tests/sceneAffordance.test.js` | **54 / 54** (43) |
| DB-backed suites, sequential, isolated `cyber_awareness_004a_t_*` | **322 / 322** |

### Scoring and review, through the real engine

HTTP (`playScenario.js`, `REVIEW=1`, `cyber_awareness_004a_verify`, API 5055): I01 safe **10** / login
**0** / fee **0**; I02 safe **10** / appeal **0** / reply **2**; I03 safe **10** / false positive **0** /
stranger's form **3** (`unsafe_handling`); I04 safe **10** / pay **0** / ask **0**; I05 safe **10** / route
**0** / question back **4**; `review leaks none` for all. WhatsApp regression: W07 **10**, W12 **10** / **0**,
W17 **10**, W22 **10** / **0** — unchanged.

### Browser verification

Isolated DB, API **5055**, frontend **5199**; 5000/5173 not running. Every scenario played by hand in the
real UI: **safe path 10/10 for each of I01–I05** and one unsafe route each (I01 login 0, I02 appeal
with password and backup code 0, I03 stranger's form + reports 0 `false_positive`, I04 payment 0, I05
route disclosure 0). Result page and review opened for every attempt. Reload on the resolve stage (I01)
and on a pushed final page (I02) rebuilt from the server. I05 at **375 px**, I04 at **640 px (≈200 %)**
with no horizontal overflow. Ledgers matched the engine; metadata within the allowlist; **0** of seven
typed strings anywhere in the database. **Offline:** only `localhost:5199` and `localhost:5055`
contacted. A WhatsApp scene (W06) opened unchanged in the same session.

**Production was not mutated.** `cyber_awareness_training` identical before and after: attempts 10,
candidates 9, runs 100, events 209, definitions 100 (none inactive), legacy scenarios 40, assessments 1,
snapshots 6. Temporary launch configuration removed; isolated Instagram pool restored (0 inactive).

### Known limitations

- Result/review cards show the bank's placeholder Instagram sender (`@unknownsender…`).
- Search results, Account Status, stories and calls are authored, not live; drawn art, not photographs.
- One decision per stage (I01 records the login or the fee, not both).
- "Restrict" has no engine intent; it is expressed as `resolve_report`.
- Post-branch beats are branch-neutral except consequence beats; HMR during hand play closes sheets.

### Next task

**Instagram W01–W05 complete. Instagram W06+ not started. WhatsApp W01–W25 complete. Email untouched.
SMS untouched.** The next job is to be planned separately.

---

## 16.21 IMMERSIVE-004B — Instagram I06–I10, the second Instagram batch (COMPLETED 15 September 2026)

**Scope.** Instagram I06, I07, I08, I09 and I10 and nothing else. No scoring, selection, timer,
attempt-API, result-API or training-review change; no engine or backend source change (only the dev
script `backend/scripts/playScenario.js` gained paths, and `backend/tests/sceneAffordance.test.js`
gained tests); the 100-scenario bank, the synthetic bank and the taxonomies hash identically before
and after. WhatsApp W01–W25 and Instagram I01–I05 unchanged in behaviour; the renderer additions are
optional and unused by them.

### Research

MITRE ATT&CK **v19.2** (re-confirmed current 15 September 2026). Real-world sources: US Army OPSEC
guidance on aggregation and geotagging (May 2025); Avast's research on social-video "downloader"
extensions (via IT Pro, December 2020); F-Secure and MailGuard on paid "verified badge" offers and
Instagram's verified-badge help; Kaspersky (August 2025), FINRA (December 2025) and SEBI (May 2025) on
deepfaked investment ads funnelling to WhatsApp groups and apps; BBB (July 2024), Norton and the FTC
(October 2023) on brand-ambassador shipping-fee offers. Full record with a ten-row Instagram comparison
matrix, nearest-scene analysis and rejected concepts:
[`docs/INSTAGRAM_I06_I10_REAL_WORLD_RESEARCH.md`](docs/INSTAGRAM_I06_I10_REAL_WORLD_RESEARCH.md).

| Scenario | Disposition / canonical family / triggers | Military | Mapping |
| --- | --- | --- | --- |
| I06 Where Was This Exercise? | malicious / `operational_elicitation` / pride | yes | **T1598**, **T1591.001**, **T1591.003**, **T1593.001**, **T1585.001** (partial); **T1598.003 considered and rejected** |
| I07 Known Friend Shares a Reel | legitimate / `legit_routine_broadcast` / familiarity | no | **none, deliberately** |
| I08 Verification Badge Agent | malicious / `unsolicited_payment_lure` / pride, scarcity | no | **T1598.003**, **T1585.001**, **T1657** (partial); **T1684.001 considered and rejected** |
| I09 Deepfake Trading Advertisement | malicious / `investment_and_task_fraud` / greed, authority | no | **T1583.008**, **T1684.001**, **T1585.001**, **T1598.003**, **T1657** (partial); **T1204 considered and rejected** |
| I10 Brand Collaboration Shipping Fee | malicious / `unsolicited_payment_lure` / flattery, reciprocity | no | **T1684.001**, **T1585.001**, **T1598.003**, **T1657** (partial); **T1566.003 considered and rejected** |

### What each brings that I01–I05 and WhatsApp W01–W25 did not

| | The Instagram-native interaction and lesson |
| --- | --- |
| I06 | Elicitation in the comments of the learner's **own public post**; the release is a public reply or **Edit post › Add location** with the app's suggestions; the account's pinned "season map" shows small answers becoming an operational picture; the post's release note and the public-information cell |
| I07 | The ordinary item after six suspicious ones: an inbox thread with yesterday's context, a **reel player** (Like/Save), **search inside the conversation** as the check; the only untrusted channel is the learner's own reel-downloader habit; reporting the friend is the false positive |
| I08 | Status for sale: a **✔️ emoji typed into a display name** against the platform badge, "clients" with the same emoji, paying clients complaining under the pinned post; the check is **Settings › Request verification** and the Help Center, and the resolution allows the official route |
| I09 | The first **paid placement**: a sponsored reel stepped frame by frame (voice on, mouth closed), audio credited to the advertiser, About this ad and the advertiser's ad history; a landing page funnelling to a group, an APK, KYC and a deposit; the regulator's register app |
| I10 | A creator **agreement whose clauses** (share your Instagram password; INR 1,499 a month from day 30) carry the turn; the pinned-post comments; the brand's **own website**, typed in, with its account check |

### Architecture

Five scene packs and five registry rows. Generic, optional renderer additions: `conversation.own`; a
comment composer on a post (only when composer affordances exist); anchored controls under a comment;
`conversation.media: 'reel'`, `audio` and a `cta` strip (anchor `cta`); `PostMedia` `shape`/`reel`; social
views `reel` and `list`; social pages with controls size to content; `sharedPost` `reel`/`title`; art
`field`, `food`, `chart`, `gear`, `award`; "1 like". Reused `BROWSER`, `PAYSHEET`, `CALL`, `APP`.

### Findings, all recorded and fixed

1. I09's notification has **no `@handle:`** (sponsored); its sender is the client's "Sponsored" with a
   placeholder identifier. The toast says "Sponsored"; the identifier is never printed (asserted).
2. The I09/I10 **browser assets carry answer-bearing stage text** in their `body`; no control opens the
   generic inspection sheet on them.
3. Browser play: controls under a short social page pushed off-screen; "1 likes"; a flag emoji drawn as
   "IN"; a reply indented under the wrong comment; "Terms (scroll)" meta text. All fixed.

### Tests

| Suite | Result |
| --- | --- |
| Full frontend `vitest run` | **1406 / 1406**, 28 files (1256 before); `oxlint` clean; build clean |
| `frontend/src/pages/SceneScenariosInstagramB.test.jsx` (new) | **40 / 40** |
| `frontend/src/simulation/sceneModel.test.js` | **546 / 546** (468) |
| `SceneContainment` + `sceneResearch` | **230 / 230** (198) |
| Full backend `npm test` (no DB URI) | **520 pass, 0 fail**, 322 skipped (509 before) |
| `backend/tests/sceneAffordance.test.js` | **65 / 65** (54) |
| DB-backed suites, sequential, isolated `cyber_awareness_004b_t_*` | **322 / 322** (instructorControlsApi failed at file level once on its first database and passed 28/28 on a fresh one; nothing else was running) |

### Scoring, review and browser verification

HTTP (`playScenario.js`, `REVIEW=1`, isolated DB, API 5055): every I06–I10 safe path **10**; unsafe
routes I06 tag **0** / DM **0**, I07 false positive **0** / downloader **3**, I08 application **0** / fee **0**,
I09 install **0** / join **1**, I10 sign **0** / reply YES **4**; `review leaks none` for all. Regression on the
same stack: I01 **10** / **0**, I03 **10** / **0**, I05 **10**, W01 **10**, W10 **10**, W15 **10**, W20 **10** / **0**, W25 **10**.

Browser (isolated DB, API **5055**, frontend **5199**; 5000/5173 not running): each of I06–I10 played by
hand — **safe 10/10** and **unsafe 0/10** for all five (I07 unsafe classified "Genuine item rejected").
Reload at verify (I09) and on a pushed final page (I08) rebuilt from the server; I07 at **375 px**, I06 at
**640 px (≈200 %)** with no horizontal overflow; result pages and reviews opened. Ledgers matched the engine;
metadata within the allowlist; **0** of fourteen typed strings anywhere in the database. **Offline:** only
`localhost:5199` and `localhost:5055` contacted. W20 and I03 opened unchanged in the same session.

**Production was not mutated.** `cyber_awareness_training` identical before and after: attempts 10,
candidates 9, runs 100, events 209, definitions 100 (none inactive), legacy scenarios 40, assessments 1,
snapshots 6. Temporary launch configuration removed; isolated pools restored (0 inactive).

### Known limitations

- Result/review cards show the bank's placeholder Instagram sender for I06, I07, I08, I10 (I09 shows "Sponsored").
- Ad transparency, the register, Request verification, the brand site, conversation search and calls are authored, not live.
- One decision per stage (e.g. I09 records the group, install, KYC or deposit — not a sequence).
- "Hide comment" and "Hide ad" have no engine intent; they are expressed as `resolve_report` / `safe_pivot`.
- Consequence banners belong to the current session; a reload after a release shows the thread without them.
- Reel frames are drawn cards, not video; the tall reel player needs a scroll to reach Like/Save on short screens.

### Next task

**Instagram I06–I10 complete. Instagram I01–I10 complete. Instagram I11+ not started. WhatsApp W01–W25
complete. Email untouched. SMS untouched.** The next job is to be planned separately.

## 16.22 IMMERSIVE-004C — Instagram I11–I15, the third Instagram batch (COMPLETED 16 September 2026)

**Scope.** Instagram I11, I12, I13, I14 and I15 and nothing else. No scoring, selection, timer,
attempt-API, result-API or training-review change; no engine or backend source change (only the dev
script `backend/scripts/playScenario.js` gained paths, and `backend/tests/sceneAffordance.test.js`
gained tests); the 100-scenario bank, the synthetic bank and the taxonomies hash identically before
and after. WhatsApp W01–W25 and Instagram I01–I10 unchanged in behaviour; the renderer additions are
optional and unused by them.

### Research

MITRE ATT&CK **v19.2** (re-confirmed current 16 September 2026). Real-world sources: US Army social
media safety and NCSC guidance on public threads and aggregation; Instagram's own recovery route
(`instagram.com/hacked`) and Help Center on backup codes; CISA on approval-style and relayed MFA
factors; FBI and FTC on romance scams and on gift cards as an irreversible payment method; US Army CID
on photographs of service personnel reused by people posing as deployed soldiers; BBB and
identitytheft.gov on "you have been selected" approaches that collect documents rather than money.
Full record with a five-row comparison matrix, nearest-scene analysis, rejected concepts and a
source-confidence note:
[`docs/INSTAGRAM_I11_I15_REAL_WORLD_RESEARCH.md`](docs/INSTAGRAM_I11_I15_REAL_WORLD_RESEARCH.md).

| Scenario | Disposition / canonical family / triggers | Military | Mapping |
| --- | --- | --- | --- |
| I11 Official Welfare Helpline Update | legitimate / `legit_routine_broadcast` / authority, empathy | yes | **none, deliberately** |
| I12 Account Recovery Backup Code | malicious / `account_takeover_authorisation_abuse` / fear, authority | no | **T1598.001**, **T1585.001**, **T1684.001**, **T1621** (partial); **T1111 considered and rejected** |
| I13 Deployed Officer Romance Profile | malicious / `relationship_grooming_fraud` / trust, empathy | yes | **T1585.001**, **T1684.001**, **T1657**, **T1598** (partial); **T1593.001 considered and rejected** |
| I14 Commendation Page Requests Documents | malicious / `identity_data_harvesting` / pride, authority | yes | **T1598.001**, **T1585.001**, **T1591.001**, **T1589** (partial), **T1684.001** (partial); **T1566.001 considered and rejected** |
| I15 You Are in This Video | malicious / `credential_phishing` / curiosity, shame_embarrassment | no | **T1586.001**, **T1598.003**, **T1621**; **T1684.001 and T1111 considered and rejected** |

### What each brings that I01–I10 and WhatsApp W01–W25 did not

| | The Instagram-native interaction and lesson |
| --- | --- |
| I11 | The ordinary item whose only danger is the learner's own mouth: a public comment carrying a case number, service number and unit, or the same sent as a message request — with a friend in the comments encouraging it. Correct use is Instagram's **Save**, and the client's "local directory comparison panel" is the learner's own **Saved collection**, which already holds the August version of the same notice with the OLD extension on it |
| I12 | The "rescue" that is itself the attack: a real password reset puts a six-digit code on the learner's phone while the account asks for it in the **message box**. The check is the learner's own **Password and security** — Security Checkup, Where you're logged in, Login activity (one reset request at the minute the DM arrived) and Support requests (no case at all) |
| I13 | **Four months** of thread with day separators — 03:12 "good morning", a leave date that moves, a video call the satellite link never allows — and the client's own stage-5 allowance built as a local, offline **Image Match** index that finds the same photograph under three other names. The portal takes **gift cards or a wallet**, never a card |
| I14 | The decision moves to the device's own **attachment picker**, with the learner's identity card and posting order beside an ordinary photograph. The evidence is the page's story **highlights**, where last month's "featured" personnel are on screen with their documents, and a commenter still asking for theirs back. The DM claims 3.3 lakh followers; the profile says 3,383 |
| I15 | The friend's **own** account: 2015, no former usernames, 412 mutuals — every documentary check comes back clean, which is the lesson. Two releases: a login gate (password, then the code) and, needing nothing typed at all, the platform's own **"is this you trying to log in?"** prompt |

### Architecture

Five scene packs and five registry rows. Generic, optional renderer additions: profile
`actions` (a professional account's Call/Email row, printing the detail each holds), profile
`highlights` (story-highlight covers opening a `story` page), `row.art` on a `list` row (a Saved
collection's cover thumbnail), `art` + `play` on a `link` beat (a DM video-share preview), and
`status` rows keyed by position. Reused unchanged: `BROWSER`, `PAYSHEET`, `VIEWER` (the attachment
picker), `INSTALLER` page style `sheet` (the login-request prompt), `APP`, `CALL`, and social views
`profile`, `about`, `people`, `post`, `story`, `status`, `settings`, `list`.

### Findings, all recorded and fixed

1. **An anchored `navigate` still needs `opens`.** Four navigation chips (I13's release link, I14's
   Attach files, I15's link card and login prompt) were anchored to a beat but named no target, so
   they drew and did nothing. Found in the new end-to-end suite before any browser play.
2. **Two branch controls that share a consequence cannot have a beat that names one of them.** I12's
   code and its page, I13's gift cards and identity card, and I14's picker and composer each produce
   `simulated_data_submission`; the echo bubble said "Sent 2 files" / "Sending my ID card photo" on
   whichever route was taken. Found in browser play; all three now say what is true of both.
3. **`status` rows keyed on their label dropped a duplicate.** A login-activity list legitimately
   repeats "Login · Pune, IN"; React warned and omitted a row. Fixed in `SocialSurface.jsx` (keyed by
   position) and the content made specific; a regression assertion counts the rows.
4. **I15's stored notification is truncated in the bank** ("…I can"), and `@knownfriend` reads as a
   stand-in. Both are the client's own text, both are carried verbatim, and both are recorded in the
   research §0.5 rather than quietly improved.
5. An I06 assertion claimed no other scene had a social `list` view. I11's Saved collection is one, so
   the claim was rescoped to the scenes that existed before I06–I10 rather than weakened.

### Tests

| Suite | Result |
| --- | --- |
| Full frontend `vitest run` | **1554 / 1554**, 29 files (1406 before); `oxlint` clean; build clean |
| `frontend/src/pages/SceneScenariosInstagramC.test.jsx` (new) | **44 / 44** |
| `frontend/src/simulation/sceneModel.test.js` | **618 / 618** (546) |
| `frontend/src/simulation/sceneResearch.test.js` | **101 / 101** |
| Full backend `npm test` (no DB URI) | **533 pass, 0 fail**, 322 skipped (520 before) |
| `backend/tests/sceneAffordance.test.js` | **78 / 78** (65) |
| DB-backed suites, sequential, isolated `cyber_awareness_004c_t_*` | **322 / 322**, twelve suites, one at a time, nothing else on mongod |

### Scoring, review and browser verification

HTTP (`playScenario.js`, `REVIEW=1`, isolated DB `cyber_awareness_004c_verify`, API 5055): every
I11–I15 safe path **10**; unsafe routes I11 public comment **3** / false positive **0**, I12 code **0** /
page **0**, I13 gift cards **0** / wallet **0**, I14 files **0** / form **2**, I15 approve **0** / login **0**;
`review leaks none` for all, and each release card carried the scenario's own correct action.
Regression on the same stack: I01 **10**, I03 **10**, I07 **10**, I09 **10**, I10 **10**, W01 **10**, W07 **10**,
W10 **10**, W14 **10**, W19 **10**, W20 **10**, W25 **10**.

Browser (isolated DB, API **5055**, frontend **5199**; 5000/5173 not running): each of I11–I15 played by
hand — **safe 10/10** and **unsafe 0/10** for all five (I11's unsafe route is the false positive, which
the review classified as such; I15 was played unsafe twice, once through the login gate and once
through the login-request prompt, both **0**). Reload during **Verify** on I11 showed the interrupted/
Resume card and rebuilt the run at step 5 with no pushed screen and nothing replayed. **375 px**,
**640 px** and **320 px (≈200 % of 640)** all showed **no horizontal overflow**; the attachment picker's
seven controls are keyboard-reachable in order. Ledgers matched the engine exactly; metadata stayed
inside the allowlist; **0 of fourteen typed strings** (passwords, gift-card numbers, PINs, the relayed
code, the composed comment) appear anywhere in the isolated database. **Offline:** only
`localhost:5199` and `localhost:5055` were contacted.

**Production was not mutated.** `cyber_awareness_training` identical before and after: attempts 10,
candidates 9, runs 100, events 209, definitions 100 (0 inactive), legacy scenarios 40, assessments 1,
snapshots 6. The isolated Instagram pool was restored (0 inactive) and the temporary pin helper
deleted.

### Known limitations

- Result/review cards show the bank's placeholder Instagram sender for all five, and I15's handle is
  the client's own `@knownfriend`.
- Saving in I11 is recorded as a decision, not as state: the Saved collection does not visibly gain
  the notice afterwards, because one decision per stage is the engine's rule.
- One decision per stage generally: I13's gift cards, wallet, identity card and reply are
  alternatives, not a sequence, and so are I15's page and prompt.
- Image Match, the welfare and media-desk applications, Login activity, Support requests and the
  Saved collection are authored screens, not live state; no image is processed, because none exists.
- I14's picker shows one file's details at a time and states in a note that two are selected, rather
  than drawing checkboxes; which file was chosen is deliberately never reported to the engine.
- Consequence banners belong to the current session; a reload after a release shows the thread
  without them.

### Next task

**Instagram I11–I15 complete. Instagram I01–I15 complete. Instagram I16–I25 not started. WhatsApp
W01–W25 complete. Email untouched. SMS untouched.** The next job is to be planned separately.

---

## 16.23 IMMERSIVE-004D — Instagram I16–I20, the fourth Instagram batch (COMPLETED 16 September 2026)

**IMMERSIVE-004D — Instagram I16–I20 COMPLETE.**

**Scope.** Instagram I16, I17, I18, I19 and I20 and nothing else. No scoring, selection, timer,
attempt-API, result-API or training-review change; no engine or backend source change (only the dev
script `backend/scripts/playScenario.js` gained paths, and `backend/tests/sceneAffordance.test.js`
gained tests); the 100-scenario bank, the synthetic bank and the taxonomies hash identically before
and after (18 files). WhatsApp W01–W25 and Instagram I01–I15 unchanged in behaviour; the one renderer
addition is optional and unused by them.

### Research

MITRE ATT&CK **v19.2** (re-confirmed current on the live versions page, 16 September 2026; technique
pages re-read the same day). Real-world sources: US Army social media safety, NCSC, Instagram Help
Center (tag review, Restrict, About this account); FBI sextortion guidance, NCMEC Take It Down and
StopNCII; US Army CID on copied service-member profiles; CISA disinformation guidance and the DISARM
framework (cited as non-ATT&CK references); UK NPSA and US NCSC "Think Before You Link" and FBI
elicitation guidance. Full record:
[`docs/INSTAGRAM_I16_I20_REAL_WORLD_RESEARCH.md`](docs/INSTAGRAM_I16_I20_REAL_WORLD_RESEARCH.md).

| Scenario | Disposition / canonical family / triggers | Level | Military | Mapping |
| --- | --- | --- | --- | --- |
| I16 Approved Photo Release Request | legitimate / `legit_coordination_request` / authority, pride | medium | yes | **none, deliberately** |
| I17 Morphed-Photo Blackmail | malicious / `coercion_and_extortion` / fear, shame_embarrassment, isolation_secrecy | medium | no | **T1585.001**, **T1657** (partial); **T1565 and T1491 considered and rejected** |
| I18 High-Fidelity Teammate Clone | malicious / `operational_elicitation` / familiarity, urgency | hard | yes | **T1585.001**, **T1684.001**, **T1593.001**, **T1598.001**, **T1591.001** (partial), **T1591.003** (partial); **T1586.001 and T1430 considered and rejected** |
| I19 Urgent Unit Incident Repost | malicious / `disinformation_amplification` / fear, duty_compliance | hard | yes | **T1585.001**, **T1591.001** (partial), **T1591.004** (partial); influence operations stated as outside ATT&CK; **T1491.002 and T1566.003 considered and rejected** |
| I20 Researcher Asks Capability Questions | malicious / `operational_elicitation` / expert_status, flattery | hard | yes | **T1598.001**, **T1598.003**, **T1585.001**, **T1591.003** (partial), **T1591.004** (partial); **T1592 and T1684.001 considered and rejected** |

### What each brings that I01–I15 and WhatsApp W01–W25 did not

| | Instagram-native interaction and lesson |
| --- | --- |
| I16 | Notifications → an established DM → **Settings › Tags and mentions** → a **consent card** where Confirm and Decline are both the normal path; the check is a local **Release Register** holding PF-204. The −4 routes are over-helping with caption detail and asking for a "link to sign"; leaving it pending is −2 |
| I17 | A message request whose photo arrives behind Instagram's **sensitive-content screen**; a PIN-gated wallet sheet; **Restrict** as a safe route; a **Support & Reporting** app and a welfare desk that say "you are not the one in trouble"; deleting everything priced at resolve |
| I18 | A **high-fidelity copy** in the main inbox whose followers, mutuals and photographs all pass, and whose About page, follower cohort and **pinned caption copied from the other account's March post** do not; the DM's own **location card**; the saved number and **Unit Orders** |
| I19 | A viral post the learner is **mentioned** in; Instagram's **share tray** and the learner's **story composer** with location and mention stickers; the page's own April post under an earlier name re-using the frame; the **Unit Bulletin** |
| I20 | A **month-long professional thread**, then a **three-page questionnaire** from the scenario's own page asset; three releases (form, answer, "correction") and a general answer that is still engagement; the security contact and a **Research & Media Requests** register |

### Architecture

Five scene packs and five registry rows. One optional renderer addition: a `photo` beat in
`IgBlocks.jsx` (sensitive-content screen; "See photo" is local and reveals only a drawn frame). Every
other screen is a new use of an existing view (`status`, `settings`, `list`, `story`, `profile`,
`about`, `people`, `post`), `BROWSER`, `PAYSHEET`, `APP` and `CALL`.

### Findings, all recorded; the in-scope ones fixed

1. **A safe control hidden behind input.** I17's draft put "Close without sending" on the payment
   sheet, whose controls appear only after a PIN. Removed; Back is the cancel, and Restrict and not
   engaging remain the safe routes.
2. **Shared consequences describing one route** (I18 pin/typed place, I19 repost/comment). Reworded to
   be true of both.
3. **A label before resolution.** I17's directory row said "extortion"; removed, and the batch's
   verdict-word ban extended.
4. **The post age printed twice** (I19, found in browser play: "41 MINUTES AGO" and "POSTED 41
   MINUTES AGO"). Fixed in I19 and asserted. The same pattern exists in I01, I03, I06, I09 and I11 —
   outside this batch, left unchanged and raised as a separate task.
5. **A differentiation signature that cannot be unique.** "Where is the decision made" is shared by
   I02, I12 and I20 (DM + browser form + composer). The assertion requires I16–I19 to be new and the
   five to differ, and records I20's overlap; branch-stage shapes remain unique for all forty-five
   scenes.
6. **I18's stored notification is truncated in the bank** ("… Send tomorrow"). Carried from the stored
   text and completed with the client's own sentence, as for W06/W09/W15/W20/W22/W25/I15.
7. **Two pre-existing intermittent test flakes, unrelated to scenes:** `auditLogApi` idempotency (1
   fail on a fresh DB; 25/25 on two reruns) and `AssessmentTimer` remount rounding (1 of 3 full
   frontend runs; 18/18 five times in isolation). Neither touched; raised as a separate task.

### Tests

| Suite | Result |
| --- | --- |
| Full frontend `vitest run` | **1705 / 1705**, 30 files (1554 before) on 2 of 3 runs; the third hit the pre-existing timer flake (finding 7) |
| `frontend/src/pages/SceneScenariosInstagramD.test.jsx` (new) | **45 / 45** |
| `frontend/src/simulation/sceneModel.test.js` | **692 / 692** (618) |
| `frontend/src/simulation/sceneResearch.test.js` | **113 / 113** (101) |
| `SceneContainment.test.jsx` / `SceneForms.test.jsx` | **181 / 181** / **15 / 15** |
| `oxlint` / `vite build` | clean / clean |
| Full backend `npm test` (no DB URI) | **548 pass, 0 fail**, 322 skipped (533 before) |
| `backend/tests/sceneAffordance.test.js` | **93 / 93** (78) |
| DB-backed suites, sequential, isolated `cyber_awareness_004d_t_*` | **321 / 322** first pass (the `auditLogApi` flake); `auditLogApi` **25 / 25** on a fresh DB and again on the original |

### Scoring, review and browser verification

HTTP (`playScenario.js`, `REVIEW=1`, isolated DB `cyber_awareness_004d_verify`, API 5055): every
I16–I20 safe path **10**; I16 caption **3** (`unsafe_handling`) / false positive **0**
(`false_positive`); I17 pay **0** / plead **2**; I18 pin **0** / ask **2**; I19 tag **0** / repost **0**;
I20 form **0** / general **0**; `review leaks none` everywhere, and each release card carried the
scenario's own client text. Regression on the same stack: I09, I10, I11, I13, I15, W01, W19, W25 all
**10**.

Browser (isolated DB, API **5055**, frontend **5199**; 5000/5173 not running; Instagram pool pinned to
I16–I20 with a temporary helper, restored afterwards): **safe 10/10 for all five**; unsafe I16 **3**,
I17 **0**, I18 **0**, I19 **0** (location sticker) and **0** (repost as-is), I20 **0**. Each played
Notify → Open → Inspect → Branch → Verify → Resolve, and the Result/Review entries showed the
disposition, cue and path only after resolution. **Reload during Verify** (I18) rebuilt the run at
step 5 with a Resume card, no pushed screen and nothing replayed. **375 px**, **640 px** and **320 px
(≈200 % of 640)**: no horizontal overflow on list, thread, profile, tag review, consent card, register,
location card, orders, share tray, story composer or questionnaire. Focus order is logical and every
control is a native button with a visible focus outline (the pane cannot synthesise key activation
under emulation, as recorded in earlier batches). Ledgers matched the engine exactly; metadata stayed
in the allowlist; **none of nine typed strings** (PIN, questionnaire answers, composed replies) exists
anywhere in the isolated database. **Offline:** only `localhost:5199` and `localhost:5055` were
contacted.

**Production was not mutated.** `cyber_awareness_training` identical before and after: attempts 10,
candidates 9, runs 100, events 209, definitions 100, legacy scenarios 40, assessments 1, snapshots 6,
audit events 0, admin users 0. The temporary launch entry and helper scripts were removed.

### Known limitations

- Result/review cards show the bank's placeholder Instagram sender for all five (carried from I01).
- One decision per stage: I16's card answer, I17's payment/photo/plea, I19's sticker/mention/repost
  and I20's form/answer/correction are alternatives, not a sequence.
- The Release Register, Support & Reporting, Unit Orders, Unit Bulletin and requests register are
  authored screens, not live state; I16's register still shows the learner's consent as outstanding
  after they answer (it is a 06:00 copy).
- I17's countdown and I19's share count are static text; nothing runs a timer or grows.
- I20's photo page is named on the review step, not built.
- Consequence banners belong to the current session; a reload after a release shows the thread
  without them.

### Next task

**IMMERSIVE-004D COMPLETE. Instagram I16–I20 complete. Instagram I01–I20 complete. Instagram I21–I25
not started. WhatsApp W01–W25 complete. Email untouched. SMS untouched.** The next job is to be
planned separately.

## 16.24 IMMERSIVE-004E — Instagram I21–I25, the fifth and final Instagram batch (COMPLETED 17 September 2026)

**IMMERSIVE-004E — Instagram I21–I25 COMPLETE.**

**Scope.** Instagram I21, I22, I23, I24 and I25 and nothing else. No scoring, selection, timer,
attempt-API, result-API or training-review change; no engine or backend source change (only the dev
script `backend/scripts/playScenario.js` gained paths, and `backend/tests/sceneAffordance.test.js`
gained tests); the 100-scenario bank, the synthetic bank and the taxonomies hash identically before
and after (18 files). WhatsApp W01–W25 and Instagram I01–I20 unchanged in behaviour; the renderer
additions are optional and unused by them.

### Research

MITRE ATT&CK **v19.2** (current on the live versions page; T1583.008, T1589, T1566.002, T1113 and
T1036 re-read on the live site for this batch). Real-world sources: US Army social media safety, NCSC,
Instagram Help Center (tag review, Account Status, fundraisers, ads, audio); FTC on tech-support
scams, charity checks, crypto and QR-code links; SEBI and SEC/FINRA investor alerts; US Army CID.
Full record:
[`docs/INSTAGRAM_I21_I25_REAL_WORLD_RESEARCH.md`](docs/INSTAGRAM_I21_I25_REAL_WORLD_RESEARCH.md).

| Scenario | Disposition / canonical family / triggers | Level | Military | Mapping |
| --- | --- | --- | --- | --- |
| I21 Post-Event Teammate Tag | legitimate / `legit_coordination_request` / familiarity, pride | hard | yes | **none, deliberately** |
| I22 Live Support Video Call | malicious / `tech_support_and_callback_fraud` / authority, fear | hard | no | **T1684.001**, **T1585.001**, **T1598.001** (partial); **T1111, T1219, T1113 considered and rejected** |
| I23 Compromised Charity Influencer | malicious / `unsolicited_payment_lure` / empathy, social_proof | hard | no | **T1586.001**, **T1657** (partial), **T1684.001** (partial); **T1585.001, T1491.002 considered and rejected** |
| I24 Institutional Trading App | malicious / `investment_and_task_fraud` / authority, greed | hard | no | **T1583.008**, **T1585.001**, **T1660** (partial), **T1657** (partial); **T1204, T1036 considered and rejected** |
| I25 Canteen Coupon Reel QR | malicious / `qr_code_phishing` / familiarity, scarcity | hard | yes | **T1585.001**, **T1598.003** (partial), **T1589** (partial), **T1591.004** (partial), **T1657** (partial); **T1566.002, T1583.008 considered and rejected** |

### What each brings that I01–I20 and WhatsApp W01–W25 did not

| | Instagram-native interaction and lesson |
| --- | --- |
| I21 | The **published post's own tag-review sheet** (Approve / Decline, both normal) with a **local audience choice**; a stranger's album link in the comments is the untrusted channel; the next fixture "for the caption" is the over-share; Release Register with the learner's own preferences |
| I22 | An **Instagram video chat** from a request whose three asks sit behind the call's own controls — camera prompt + ID, screen-share consent, the learner's backup codes page; End call is the decision; the learner's own Account Status |
| I23 | A **broadcast channel** (no reply box) from a real, verified creator; a **beneficiary history** that changed today; share-to-story on the message; the trust's own website confirms the takeover |
| I24 | A **sponsored carousel** of seals; a **comment cohort**; a download page (Install / Not now); a **pre-credited web dashboard** with a locked withdrawal, KYC and an 18% "tax"; a public "Interested" comment; the phone's app store and the learner's broker |
| I25 | A **code inside a reel**, read from a screenshot by the phone's scanner; the **audio credit** leading to the copied original; an eligibility form (service number, family, canteen card) via the bio link; a ₹49 activation; share to the family group; Welfare Notices |

**Differentiation.** Branch-stage shapes **and** decision homes are unique against all forty-five
earlier scenes (asserted). Two client-forced conceptual overlaps are recorded: I21's release register
(I16) and I22's screen-share consent (W24).

### Architecture

Five scene packs and five registry rows. Optional renderer additions: a `review` view in
`SocialSurface.jsx` (local audience radio group), `conversation.readOnly` and `conversation.commentNote`
and an `audio` anchor in `InstagramScene.jsx`, and `remote.figure: 'agent'` in `CallSurface.jsx`.
Everything else is a new use of existing views and surfaces (`BROWSER`, `PAYSHEET`, `APP`, `CALL`,
`INSTALLER`, `VIEWER`).

### Findings, all recorded; the in-scope ones fixed

1. **Verdict word in a resolve label** (I23 "…as a hacked account") — rewritten before testing; ban
   extended (`hacked`, `compromised`, `takeover`, `coercion`, `spoof*`, `quishing`).
2. **Exclusivity assertion over a moving set** — I14's "no earlier Instagram scene decides on a viewer"
   counted I25; rescoped to scenes before I11.
3. **Clipped carousel slide titles** (I24, I25; browser play) — titles shortened, measured to fit at 640
   and 320 px. Fixed; affected suites rerun.
4. **Duplicated app name on I24's download sheet** (browser play) — fixed.
5. **Call icons on I23's broadcast-channel header** (browser play) — `readOnly` hides them. Fixed.
6. **Pre-existing, recorded not changed:** closing a pushed screen returns focus to the page body (the
   options sheet restores focus correctly); re-entering a call from its own prompt restarts the drawn
   timer; result/review cards show the bank's placeholder Instagram sender (carried from I01); the
   production build's chunk-size advisory.

### Tests

| Suite | Result |
| --- | --- |
| Full frontend `vitest run` | **1858 / 1858**, 31 files (1705 before) — run before and after the browser-play fixes |
| `frontend/src/pages/SceneScenariosInstagramE.test.jsx` (new) | **46 / 46** |
| `frontend/src/simulation/sceneModel.test.js` | **767 / 767** (692) |
| `frontend/src/simulation/sceneResearch.test.js` | **125 / 125** (113) |
| `SceneContainment.test.jsx` / `SceneForms.test.jsx` | **201 / 201** (181) / **15 / 15** |
| `oxlint` / `vite build` | clean / clean (chunk-size advisory only) |
| Full backend `npm test` (no DB URI) | **563 pass, 0 fail**, 322 skipped (548 before) |
| `backend/tests/sceneAffordance.test.js` | **108 / 108** (93) |
| DB-backed suites, sequential, isolated `cyber_awareness_004e_t_*` | **322 / 322** first pass (all twelve suites) |

### Scoring, review and browser verification

HTTP (`playScenario.js`, `REVIEW=1`, isolated DB `cyber_awareness_004e_verify`, API 5055): every
I21–I25 safe path **10**; I21 album **3** (`unsafe_handling`) / false positive **0** (`false_positive`);
I22 code **0** / ask **2**; I23 pay **0** / share **4**; I24 install **0** / tax **0**; I25 form **0** /
scan **0**; ledgers exactly as pinned, metadata keys only `intent, transition, consequence,
resolution_code`, `review leaks none` everywhere. Regression on the same stack, unchanged: I01, I05,
I10, I15, I20 safe **10** and unsafe **0**; W01, W07, W14, W19, W25 safe **10**; W07 false positive,
W14 install, W25 link **0**.

Browser (isolated DB, API **5055**, frontend **5199**; 5000/5173 not running; pools pinned with a
temporary helper and restored): **safe 10/10 for all five**; unsafe I21 **3** (album link), I22 **0**
(backup code), I23 **0** (wallet with PIN), I24 **0** (KYC) and **0** (tax with PIN), I25 **0**
(eligibility form). Each played Notify → Open → Inspect → Branch → Verify → Resolve through the
scene's own controls, and Result/Review showed disposition, cue, correct action and path only after
resolution. **Reload during Verify** (I24) rebuilt the run at step 5 with the "place was kept" notice,
no pushed screen and nothing replayed. **375 px** (I23), **640 px** (I24) and **320 px ≈ 200 % of 640**
(I25, I21, I24, result page): no horizontal overflow. The options sheet moves focus in and restores it
on Escape. **None of the typed or selected values** (PINs, KYC, eligibility details, audience choice,
backup code) exists anywhere in the isolated database; metadata keys stayed in the allowlist.
Browser regression: I01, I05, I10, I15, I20, W01, W07, W14, W19, W25 each opened, read and inspected
through their own controls and opened their authored screen. **Offline:** only `localhost:5199` and
`localhost:5055` were contacted.

**Production was not mutated.** `cyber_awareness_training` identical before and after: attempts 10,
candidates 9, runs 100, events 209, definitions 100, legacy scenarios 40, assessments 1, snapshots 6,
audit events 0, admin users 0, configurations 0. The temporary launch entry and helper scripts were
removed.

### Known limitations

- Result/review cards show the bank's placeholder Instagram sender (I24: "Sponsored") for all five.
- One decision per stage: each scene's releases and pivots are alternatives, not a sequence.
- I21's audience choice is deliberately recorded nowhere.
- The register, Account Status, trust website, app store, broker and notice board are authored
  screens, not live state; I22's call captions and countdown are timed text.
- Consequence banners belong to the current session; a reload after a release shows the thread
  without them.

### Instagram completion

**IMMERSIVE-004E COMPLETE. Instagram I01–I25 complete. WhatsApp W01–W25 complete. Email untouched.
SMS untouched.** The next job is to be planned separately.

## 16.25 IMMERSIVE-AUDIT-001 — WhatsApp + Instagram 50-scenario integration audit (COMPLETED 17 September 2026)

**IMMERSIVE-AUDIT-001 COMPLETE.** Full report:
[`docs/IMMERSIVE_50_SCENARIO_AUDIT.md`](docs/IMMERSIVE_50_SCENARIO_AUDIT.md).

**Scope.** A read, test and audit pass over the 50 authored scenes (W01–W25, I01–I25). No new
scenario was built. No engine, backend source, bank, synthetic, taxonomy, Instagram-scene, Email or
SMS file changed. All 19 bank, synthetic and taxonomy files hash identically before and after, and
the recorded fingerprints `7686687e…c8013b1f` and `5bf50b1a…b73ef105` reproduce.

### Verdict

**The 50 scenes form a coherent half of the 100-scenario system. No blockers.**

- All 50 are registered and playable, with six stages, legal intents and declared assets.
- Every safe path scores 10 in-process, over HTTP (all 50) and in the browser, and every unsafe
  route played is priced by the engine.
- Reviews are built from the ledger with no leaked scoring vocabulary.

### Defects fixed (presentation only; scoring unchanged)

1. **W01–W15 resolve banner held only the correct resolutions.** Position gave the answer; this
   was deferred in 003D and 003E. The banner now holds one wrong and one right resolution, wrong
   first, and the second right one moved to the overflow menu.
2. **W09 and W10 printed a verdict-bearing narrator line** ("genuine account… out-of-character",
   "A fake support account"). This was deferred since 003C. Removed.
3. **Report labels named the verdict** in W06, W09 and W15 ("the impersonation", "the compromised
   account"). Reworded.
4. **Directory remit named the verdict** in W15 and W18. Reworded (same class as I17 in 004D).
5. **Leak checks were batch-scoped.** `sceneModel.test.js` gained a cross-50 block (202
   assertions): the banner mixes right and wrong; no verdict word in any control label, hint or
   echo; no verdict narrator line; no verdict directory remit.
   `WhatsAppScene.test.jsx` and `SceneScenariosB.test.jsx` were updated for fixes 1 and 3.
   `playScenario.js` gained W01–W05 paths.

### Findings recorded, not changed

- **Architectural (decision needed; not a blocker).** Every scored control renders
  `data-intent`, and the engine intent names describe the choice (`safe_pivot` is the +3 control
  in all 50). The names are also sent in every events request. A fix means neutral per-run intent
  tokens mapped server-side, which changes the client–engine contract. The generic
  Email/SMS action sheet does the same.
- **ATT&CK consistency.** W01 and W05 claim T1111 for a code the victim hands over, while W25,
  I02, I12, I15 and I22 reject T1111 for that mechanism (the live page, v2.1, supports the
  rejection). W04 cites T1586, while I04 rejects it for the same mechanism. W09 uses T1586.002
  where later scenes use T1586.001. All ten documents are consistently on v19.2.
- **Taxonomy.** `operational_elicitation` has 7 of 50 scenes (all military); `authority` appears in
  19 of 50. 7 of 10 legitimate scenes are military against 15 of 40 malicious. W03↔W07 and
  W04↔I04 share family, trigger set and level.
- **Differentiation.** No exact duplicates: branch shapes are 50/50 distinct. Near-duplicate
  mechanism pairs are W04↔I04, W06↔I14, W19↔I18, W05↔I02/I12, W08↔I25, W10↔W25, W24↔I22,
  W13↔I09↔I24 and W09↔I15↔I23. The verification surface is identical in all 50, as the
  specification requires.
- W01–W08 still print a neutral narrator line. The banner's first button is correct in 30 of 50
  scenes.

### Verification

| Area | Result |
| --- | --- |
| Frontend `vitest run` | **2060 / 2060** (1858 before); `sceneModel` 969, `sceneResearch` 125, `SceneContainment` 201, `SceneForms` 15 |
| `oxlint` / `vite build` | clean / clean (chunk-size advisory only) |
| Backend `npm test` (no DB) | **563 pass, 0 fail**; `sceneAffordance` 108 / 108 |
| DB-backed, sequential, isolated `cyber_awareness_audit001_t_*` | 295 / 296 first pass (the known new-database `attemptTimer` file-level flake), then 27 / 27 twice, giving **322 / 322** |
| HTTP play (isolated `cyber_awareness_audit001_verify`, API 5055) | 100 runs: every safe path **10**, unsafe **0** or **3**, `review leaks none`, metadata within the allowlist |
| Browser (5199 → 5055) | I15, I22, W01, W15, I20, W09 and W10 through their own controls |
| Recovery (browser) | Reloads during Inspect, Branch and Verify rebuilt the run with Resume and no replay |
| Recovery (API, live) | Duplicate key replayed; stale stage returned 409; off-allowlist metadata returned 422 |
| Layout and focus | 320, 375 and 640 px with no overflow; options-sheet focus trap, Escape and focus restoration |
| Privacy | Typed canaries (password, login code, questionnaire answers, PIN) found nowhere in 5,438 isolated documents, logs, exports or storage |
| Offline | Only `localhost:5199` and `localhost:5055` contacted |

**Production was not mutated.** `cyber_awareness_training` was identical before and after:
attempts 10, candidates 9, runs 100 (61 active / 39 resolved), events 209, definitions 100,
legacy scenarios 40, assessments 1, snapshots 6, audit events 0, admin users 0, configurations 0.
The temporary launch entry was removed and both preview servers were stopped.

### Next task

**Proceed to Email**, planned separately. Decide the intent-exposure question first or alongside
it, and apply the mixed-banner rule to Email and SMS resolutions from the start.

**IMMERSIVE-AUDIT-001 COMPLETE. WhatsApp W01–W25 audited. Instagram I01–I25 audited. Email
untouched. SMS untouched. No production mutation.**

---

## 16.26 SECURITY-001 — Neutral Learner Action Contract (COMPLETED 17 September 2026)

**Why.** IMMERSIVE-AUDIT-001 §6.4 found that the client knew what every control meant: scored
controls rendered `data-intent="safe_pivot"`, requests carried `intent` and a `verify_source` that
duplicated it, scene files shipped `intent:`/`source:` and descriptive ids (`…-branch-pivot`), the
bundle shipped the engine's intent table, and responses returned the event code. A learner with
developer tools could read the answer.

**What changed.** Full design: [`docs/NEUTRAL_LEARNER_ACTION_CONTRACT.md`](docs/NEUTRAL_LEARNER_ACTION_CONTRACT.md).

- Controls carry **neutral ids** (`w01-c08`, `gen-c17`) and nothing else; `sceneModel.action()`
  refuses `intent`/`source`.
- The meaning lives on the server: `backend/data/learner-actions/v1/{generic,whatsapp,instagram}.json`
  (37 + 517 + 520 entries), validated at start-up against the engine's `STAGE_INTENTS`.
- `/current-run` issues `actions: { id: code }`; each code is `ac_` + 20 hex of an HMAC over
  (run, scenario, version, control) - deterministic, server-authoritative, run-bound, no stored
  state, no randomness.
- `/events` and `/resolve` accept only `action_code`. `learnerActionService.translateActionCode`
  derives the intent; the controller passes the control's stage to the **unchanged** engine as the
  expected stage, so duplicate replay, stale 409 and the Event + ScenarioRun transaction are
  exactly as before. `intent`/`verify_source` in a request → 422; bad codes → one neutral 422.
- Responses drop `event.event_code` and add a neutral `view`; engine messages that could name an
  intent are neutralised; `verify_source` is derived server-side.
- Client: no intent anywhere (`data-control="act|nav"` replaces `data-intent`/`data-affordance`);
  the row control is found by position, sheets open from `view`, `/resolve` and the rationale are
  chosen by stage.

**Not changed.** ScenarioEngine, scoring constants, ScenarioDefinition, selection, attempt
lifecycle, result, review, the bank, scene wording/stories/branches/verification routes, Email,
SMS.

**Migration.** 1,037 scored controls in W01–W25 / I01–I25 renamed and stripped by a one-time
scripted rewrite, re-verified control by control (1,085 controls identical apart from the id). All
1,037 reproduce their pre-migration (stage, event code, points, consequence) through the code path
(`backend/tests/fixtures/learnerActionBaseline.json`). Dev scripts `playScenario.js` and
`seedReviewDemo.js` send codes via `scripts/lib/learnerActions.js`.

### Verification

| Area | Result |
| --- | --- |
| Frontend `vitest run` | **2221 / 2221** (2060 before); `sceneModel` 1123, `sceneResearch` 125, `SceneContainment` 201 |
| `oxlint` / `vite build` / `npm run check:bundle` | clean / clean / no canonical vocabulary in the production bundle |
| Backend `npm test` (no DB) | **573 pass, 0 fail**; `sceneAffordance` 108, `learnerAction` 10 |
| DB-backed, sequential, isolated `cyber_awareness_sec001_t_*` | `learnerActionApi` 12/12 and all twelve existing suites pass (attemptApi 25 after one test was corrected to send a stale tab's own-stage code) — **334 / 334** |
| Browser (5199 → 5055, `cyber_awareness_sec001_verify`) | E22 generic path, I04 safe, I17 unsafe, W04 safe with a mid-run reload, W12 unsafe: DOM, React props, requests, responses, storage and globals free of intents and event codes; the only vocabulary left is the generic stage-transition list in the scenario payload (known limitation) |
| Recovery (browser, live) | duplicate retry replayed (no event code); stale view 409; wrong-stage 409; intent in body 422; unknown code 422; real cross-run replay 422; codes identical after reload; no code shared between runs |
| Scoring (browser, live) | safe routes 10, unsafe 0; ledger codes as the engine defines them; attempt total 62 = sum of runs; result page and review render |
| HTTP play | `playScenario.js W01 safe`: 10/10, review correct, `review leaks none` |
| Mobile | 375 px, no horizontal overflow |
| Offline | only `localhost:5199` and `localhost:5055` contacted |

**Production was not mutated.** `cyber_awareness_training` identical before and after (attempts 10,
candidates 9, runs 100, events 209 with the same latest id, definitions 100, legacy scenarios 40,
assessments 1, snapshots 6, audit events 0, admin users 0, configurations 0). The temporary launch
entry was removed and both preview servers were stopped.

### Known limitations

See the contract document §8: generic `stages[].transitions` vocabulary still in `/current-run`;
post-resolution `outcome_code` and `consequence.kind`; scene design comments visible only on the
Vite dev server; client-chosen `synthetic_target_id` (pre-existing).

### Next task

**Proceed to Email**, authored on this contract from the start (contract doc §7).

**SECURITY-001 COMPLETE. Neutral learner action contract implemented. WhatsApp W01–W25 compatible.
Instagram I01–I25 compatible. Email untouched. SMS untouched. No production mutation. No scoring
semantics changed.**

---

## 16.27 IMMERSIVE-005 — Email E01–E05, the first Email batch (COMPLETED 17 September 2026)

**IMMERSIVE-005 — Email E01–E05 COMPLETE.**

**Scope.** Email E01, E02, E03, E04 and E05 and nothing else. No scoring, selection, timer,
attempt-API, result-API or training-review change; the engine, `ScenarioDefinition`, scoring
constants and the 100-scenario bank are untouched. WhatsApp W01–W25 and Instagram I01–I25 are
unchanged in behaviour. The only backend **source** change is one line in
`learnerActionService.loadActionMaps` (it now reads the `email` platform map); the dev script
`playScenario.js` gained E01–E05 paths and `PIN_EMAIL`. Authored on the SECURITY-001 neutral
learner-action contract from the start. Verdict: **PASS.**

The Email presentation layer (`EmailScene.jsx`, `MailBlocks.jsx`, `MailSurface.jsx`, the `MAIL`
surface in `sceneModel.js`, the mail tokens in `index.css`, and the `email` wiring in `PhoneShell`,
`SceneControl`, `SceneSurfaces`, `SurfaceFrame`) was scaffolded but carried no scenes; this task
authored the five scenes, the server action map, the tests and the research, and wired them in.

### Research

MITRE ATT&CK **v19.2** (re-confirmed current on the live versions page). Techniques read: T1566.001,
T1566.002, T1598.003, T1204.002, T1684.001, T1657, T1534, T1137, T1111. Real-world sources: CISA and
NCSC phishing/macro guidance, NIST Phish Scale, FTC delivery-scam advice. Full record:
[`docs/EMAIL_E01_E05_REAL_WORLD_RESEARCH.md`](docs/EMAIL_E01_E05_REAL_WORLD_RESEARCH.md).

| Scenario | Disposition / canonical family / triggers | Level | Military | Mapping |
| --- | --- | --- | --- | --- |
| E01 Password Expires Today | malicious / `credential_phishing` / urgency, authority | easy | no | **T1566.002**, **T1684.001** (partial); **T1111 rejected** |
| E02 Invoice Spreadsheet Macro | malicious / `malware_delivery` / routine, urgency | easy | no | **T1566.001**, **T1204.002**, **T1684.001** (partial); **T1137 rejected** |
| E03 Authenticated Internal Newsletter | legitimate / `legit_routine_broadcast` / routine | easy | no | **none, deliberately** |
| E04 Customs Parcel Hold | malicious / `financial_credential_phishing` / fear, curiosity | easy | no | **T1566.002**, **T1684.001** (partial), **T1657** (partial); **T1598.003 rejected** |
| E05 Mandatory HR Policy Login | malicious / `credential_phishing` / authority, duty_compliance | easy | no | **T1566.002**, **T1684.001** (partial), **T1598.003** (partial); **T1534 rejected** |

### The five stories

- **E01** — an IT-branded "password expires today" mail whose display name is "IT Service Desk" but
  whose address, Reply-To and failing SPF/DKIM/DMARC give it away; the link opens a cloned sign-in
  page asking for username, password and OTP. A genuine month-old reminder from the real desk sits in
  the same thread. Decision: the sign-in page. Check: the account portal (nothing expiring).
- **E02** — an unknown "Accounts" sender forwards an overdue invoice as a macro-enabled `.xlsm` and
  says to Enable Content. Decision: the attachment preview's "Enable content" bar over a drawn,
  inert spreadsheet grid. Check: the vendor system and a finance-desk call.
- **E03 (legitimate control)** — the monthly Learning Office newsletter from its usual authenticated
  address, passing checks, no attachment, no login. Correct: read and archive in-app; reporting it is
  a false positive; forwarding it off-platform is the needless external action. Check: the newsletter
  archive where the issue number matches.
- **E04** — a courier "customs clearance fee" on an unexpected parcel, with a look-alike tracking page
  that ends at a payment sheet. Decision: the payment sheet (PIN then Confirm; its Back cancels).
  Check: the courier's own app (no such parcel).
- **E05** — a "People Office" mandatory-policy acknowledgement with a generic greeting, an off-domain
  Reply-To and a 60-minute countdown; the button opens a cloned HR login asking for the password and
  payroll account. Decision: a reply that confirms, or the cloned portal. Check: the approved HR
  portal (no task assigned).

### Architecture

Five scene packs, five registry rows, one server map file
(`backend/data/learner-actions/v1/email.json`, 90 controls). No new surface kind beyond the `MAIL`
surface the presentation layer already declared; everything else is a new use of `BROWSER`,
`PAYSHEET`, `APP` and `CALL`. Branch-stage shapes are distinct across the five (asserted). See
[`docs/SCENE_INTERACTION_LAYER.md`](docs/SCENE_INTERACTION_LAYER.md) §19.

### Tests

| Suite | Result |
| --- | --- |
| Full frontend `vitest run` | **2359 / 2359**, 32 files (2221 before) |
| `frontend/src/pages/SceneScenariosEmail.test.jsx` (new) | **16 / 16** |
| `frontend/src/simulation/sceneModel.test.js` | **1213 / 1213** (1123) |
| `frontend/src/simulation/sceneResearch.test.js` | **137 / 137** (125) |
| `SceneContainment.test.jsx` / `SceneForms.test.jsx` | **250 / 250** (216) / **15 / 15** |
| `oxlint` / `vite build` / `npm run check:bundle` | clean / clean (chunk-size advisory only) / no canonical vocabulary in the bundle |
| Full backend `npm test` (no DB URI) | **582 pass, 0 fail**, 334 skipped |
| `backend/tests/sceneAffordance.test.js` | **117 / 117** (108) |
| `backend/tests/learnerAction.test.js` | **10 / 10** (map now 1,127 scene controls = 1,037 + 90 Email) |
| DB-backed, sequential, isolated `cyber_awareness_imm005_*` | `learnerActionApi` 12/12; attemptApi 25, attemptResultApi 40, attemptCreation 20, attemptTimer 27, attemptViewerApi 37, auditLogApi 25, candidateProfileApi 21, exportApi 25, instructorControlsApi 28, progressApi 21, scenarioEngineTransaction 21, scenarioManagerApi 32 — all pass |

### Scoring, review and browser verification

HTTP (`playScenario.js`, `REVIEW=1`, isolated DB `cyber_awareness_imm005_verify`, API 5055,
`PIN_EMAIL=E01…E05`): every E01–E05 safe path **10**; E01 submit **0**; E02 enable **4**; E03 false
positive **0**; E04 pay **0**; E05 submit **0**; ledgers exactly as pinned; metadata keys within the
allowlist (`intent, transition, consequence, resolution_code`, plus `dwell_ms`/`open_latency_ms`/
`verify_source`); `review leaks none` everywhere.

Browser (isolated DB, API **5055**, frontend **5199** in verify mode; 5000/5173 not running; email
pool narrowed to E01–E05, non-email runs fast-forwarded from the page): **E05 safe hand-played to
10/10** through the mail app (inbox → message → sender details → HR portal → report), and **E02 unsafe
(enable content) 4/10**; **E01 submit −8** with the sign-in form filled — the typed username,
password and OTP appear **nowhere** in the isolated database (11 collections scanned, zero canary
hits), the inputs are `type=text autoComplete=off` with the password CSS-masked, and the page states
"No network request was made". The DOM carried no engine intent or event code. **Mobile 375 px and
320 px (≈200 % of 640): no horizontal page overflow.** **Offline:** only `localhost:5199` and
`localhost:5055` were ever contacted.

**Production was not mutated.** `cyber_awareness_training` byte-for-byte identical before and after
(attempts 10, candidates 9, runs 100, events 209 with the same latest id, definitions 100, legacy
scenarios 40, assessments 1, snapshots 6, audit events 0, admin users 0, configurations 0;
definitions digest unchanged). The `scenarios/v1` and `synthetic/v1` content fingerprints reproduce
(`7686687e…c8013b1f`, `5bf50b1a…b73ef105`), and all 17 bank/taxonomy files hash identically. The
isolated databases and both preview servers were removed.

### Known limitations

- Only Email **E01–E05** are authored; E06–E25 and all SMS stay on the generic path.
- One decision per stage (shared platform limitation): each scene's pivots and releases are
  alternatives, not a sequence.
- Result/review cards show the bank's stored sender for the item (carried from W01–I25).
- E02 and E03 offer sender inspection and a preview/thread read but no explicit `skip_inspection`
  control (by design; not every scene needs one).
- Consequence banners belong to the current session; a reload after a release shows the thread
  without them (shared behaviour); closing a pushed screen returns focus to the page body.

### Deviations from the instructions

- None material. The instructions were written as if Email had no code; a prior session had already
  scaffolded the Email presentation layer (uncommitted, no scenes). This task built on that scaffold
  rather than re-creating it, which is the intended shared-layer reuse; no authoritative file was
  changed.

### Next task

**Proceed to Email E06–E10**, planned separately, then the remaining Email and all SMS batches, on
this same layer and contract, toward the final 100 immersive scenarios (WhatsApp 25, Instagram 25,
Email 25, SMS 25).

**IMMERSIVE-005 COMPLETE. Email E01–E05 implemented on the neutral action contract. WhatsApp W01–W25
and Instagram I01–I25 unchanged. Email E06–E25 and SMS untouched. No production mutation. No scoring
semantics changed.**

---

## 16.28 IMMERSIVE-006 — Email E06–E10, the second Email batch (COMPLETED 18 September 2026)

**IMMERSIVE-006 — Email E06–E10 COMPLETE.**

**Scope.** Email E06, E07, E08, E09 and E10 and nothing else. No scoring, selection, timer,
attempt-API, result-API or training-review change; the engine, `ScenarioDefinition`, scoring
constants and the 100-scenario bank are untouched. WhatsApp W01–W25, Instagram I01–I25 and Email
E01–E05 are unchanged in behaviour. The only backend **source** change is the dev script
`playScenario.js` (E06–E10 paths + `PIN_EMAIL`); `learnerActionService.loadActionMaps` already read
the `email` platform. Authored on the SECURITY-001 neutral learner-action contract. Verdict: **PASS.**

### Research

MITRE ATT&CK **v19.2** (re-confirmed current). Techniques read: T1684.001, T1598, T1598.003,
T1566.002, T1585.002, T1657, T1583.001, T1111, T1114, T1534. Real-world sources: US Army OPSEC/social
media, NIST Phish Scale, FTC (government-impersonation, gift-card scams), FBI/IC3 (BEC, invoice
diversion), NCSC. Full record:
[`docs/EMAIL_E06_E10_REAL_WORLD_RESEARCH.md`](docs/EMAIL_E06_E10_REAL_WORLD_RESEARCH.md).

| Scenario | Disposition / canonical family / triggers | Level | Military | MITRE |
| --- | --- | --- | --- | --- |
| E06 Adjutant Roster Request | malicious / `identity_data_harvesting` / authority | easy | yes | **T1684.001**, **T1598** (partial); **T1114 rejected** |
| E07 Expected Training Calendar Invite | legitimate / `legit_coordination_request` / routine, authority | easy | yes | **none, deliberately** |
| E08 Instant Tax Refund | malicious / `financial_credential_phishing` / greed, urgency | easy | no | **T1566.002**, **T1684.001** (partial), **T1598.003** (partial); **T1111 rejected** |
| E09 Executive Gift-Card Request | malicious / `payment_diversion` / authority, urgency, isolation_secrecy | medium | yes | **T1684.001**, **T1585.002** (partial), **T1657** (partial); **T1534 rejected** |
| E10 Vendor Changes Bank Details | malicious / `payment_diversion` / routine, urgency | medium | no | **T1684.001**, **T1583.001** (partial), **T1657** (partial); **T1534 rejected** |

### The five stories

- **E06** — a copied "Unit Adjutant" display name on an external domain demands the personnel roster
  before the commander's brief; the decision is the reply composer (attach the roster / bare reply /
  discard), with the real adjutant's earlier note in the thread. Checks: Records System, adjutant call.
- **E07 (legitimate control)** — the Training Office sends the calendar invite announced in the morning
  briefing; the decision is the invite card (Accept / Tentative / Decline). Reporting it is a false
  positive. Check: the course schedule.
- **E08** — a "Revenue Refund Centre" refund that expires today; a browser form harvests identity, card
  and OTP. Check: the tax portal (no case).
- **E09** — "Col. Dev" on a personal domain, in a meeting, needs six gift cards kept confidential; a
  gift-card codes surface is the release. Checks: duty-office call, procurement.
- **E10** — a one-character look-alike vendor domain replies into the real invoice thread with a new
  beneficiary; the vendor-master offers a beneficiary edit and a payment approval. Checks: vendor call,
  change control.

### Architecture

Five scene packs, five registry rows, 91 new server map controls (email.json now 181). Two optional
renderer additions: an `invite` calendar-card beat and a compose attachment chip. Everything else is a
new use of `BROWSER`, `APP` and `CALL`. Branch shapes distinct across all ten Email scenes; the one
recorded overlap is E09/E10 both releasing on a browser surface (distinct shapes). See
[`docs/SCENE_INTERACTION_LAYER.md`](docs/SCENE_INTERACTION_LAYER.md) §19.1.

### Tests

| Suite | Result |
| --- | --- |
| Full frontend `vitest run` | **2507 / 2507**, 33 files (2359 before) |
| `frontend/src/pages/SceneScenariosEmailB.test.jsx` (new) | **15 / 15** |
| `frontend/src/simulation/sceneModel.test.js` | **1314 / 1314** (1213); the Email E01–E10 distinctness block |
| `frontend/src/simulation/sceneResearch.test.js` | **149 / 149** (137) |
| `oxlint` / `vite build` / `npm run check:bundle` | clean / clean (chunk-size advisory) / no canonical vocabulary |
| Full backend `npm test` (no DB) | **592 pass, 0 fail**, 334 skipped |
| `backend/tests/sceneAffordance.test.js` | **127 / 127** (117) |
| `backend/tests/learnerAction.test.js` | 1,218 scene controls (1,037 + 181 Email); baseline covers the pre-Email 1,037 |
| DB-backed, sequential, isolated `cyber_awareness_imm006_*` | learnerActionApi 12; attemptApi 25, attemptResultApi 40, attemptCreation 20, attemptTimer 27, attemptViewerApi 37, auditLogApi 25, candidateProfileApi 21, exportApi 25, instructorControlsApi 28, progressApi 21, scenarioEngineTransaction 21, scenarioManagerApi 32 — all pass |

### Scoring and browser verification

Isolated DB `cyber_awareness_imm006_verify`, API **5055**, frontend **5199** (verify mode; email pool
narrowed to E06–E10; non-email runs fast-forwarded from the page). **All ten E06–E10 routes played
end-to-end through the real controller, API, engine and database:** every safe path **10**; E06/E08/E09
release **0**; E10 save/pay **0**; E07 external link **3**; ledgers exactly as pinned. **E06 safe (10/10)
and E07 safe (10/10) were hand-played through the real UI** — the reply composer's roster attachment
chip, the Personnel Records System app, and the calendar invite card (Accept / Tentative / Decline) all
render correctly. **Containment:** a canary scan of the whole isolated database (11 collections) found
**none** of the typed identity number, card number, roster filename or account number. **Reload during a
mid-scene run** (E07 at branch) rebuilt the thread at the committed stage with exactly three events and
no replay. **Mobile 375 px and 320 px (~200 % zoom): no horizontal page overflow.** **Offline:** only
`localhost:5199` and `localhost:5055` were ever contacted. Stale-state, wrong-stage, cross-run and
duplicate-replay refusals are covered by `learnerActionApi.test.js` (12/12), which exercises the same
engine path for every scene.

**Production was not mutated.** `cyber_awareness_training` byte-for-byte identical before and after
(attempts 10, candidates 9, runs 100, events 209, definitions 100 with the same digest, legacy 40,
assessments 1, snapshots 6, audit 0, admin 0, config 0). The `scenarios/v1` and `synthetic/v1`
fingerprints reproduce (`7686687e…c8013b1f`, `5bf50b1a…b73ef105`) and all 17 bank/taxonomy files hash
identically. The isolated databases and both preview servers were removed.

### Known limitations

- Only Email **E01–E10** are authored; E11–E25 and all SMS stay on the generic path.
- One scored decision per stage (shared platform limitation).
- Result/review cards show the bank's stored sender for the item (carried from earlier batches).
- E09's bank sender display name is the generator artefact "From"; the scene uses "Col. Dev" from the
  client's own sentence (recorded in the research §0.5), like earlier placeholder handling.
- Consequence banners belong to the current session; a reload after a release shows the thread without
  them; closing a pushed screen returns focus to the page body.

### Deviations from the instructions

- None material. A `slot:intent` branch shape is a small space, so an Email scene occasionally shares
  one with a WhatsApp/Instagram scene; the distinctness guarantee is asserted within the ten Email
  scenes (all unique), and the E09/E10 shared decision home is recorded rather than hidden.

### Next task

**Proceed to Email E11–E15**, then the remaining Email and all SMS batches, on this same layer and
contract, toward the final 100 immersive scenarios (WhatsApp 25, Instagram 25, Email 25, SMS 25).

**IMMERSIVE-006 COMPLETE. Email E06–E10 implemented on the neutral action contract. WhatsApp W01–W25,
Instagram I01–I25 and Email E01–E05 unchanged. Email E11–E25 and SMS untouched. No production mutation.
No scoring semantics changed. Email now 10/25.**

---

## 16.29 IMMERSIVE-007 — Email E11–E15, the third Email batch (COMPLETED 18 September 2026)

**IMMERSIVE-007 — Email E11–E15 COMPLETE.**

**Scope.** Email E11, E12, E13, E14 and E15 and nothing else. No scoring, selection, timer,
attempt-API, result-API or training-review change; the engine, `ScenarioDefinition`, scoring
constants and the 100-scenario bank are untouched. WhatsApp W01–W25, Instagram I01–I25 and Email
E01–E10 are unchanged in behaviour. The only backend **source** change is the dev script
`playScenario.js` (E11–E15 paths); `learnerActionService.loadActionMaps` already read the `email`
platform. Authored on the SECURITY-001 neutral learner-action contract. No new renderer component.
Verdict: **PASS.**

### Research

MITRE ATT&CK **v19.2** (re-confirmed current on the live versions page, 18 Sep 2026). Techniques read:
T1566.001, T1566.002, T1204.001, T1204.002, T1027.013, T1528, T1621, T1671, T1550.001, T1684.001 and
T1140. Real-world sources: CISA/Microsoft consent-grant and MFA-fatigue advisories, NCSC/CISA on
password-protected archives, quishing advisories, US Army OPSEC, NIST Phish Scale. Full record:
[`docs/EMAIL_E11_E15_REAL_WORLD_RESEARCH.md`](docs/EMAIL_E11_E15_REAL_WORLD_RESEARCH.md).

| Scenario | Disposition / canonical family / triggers | Level | Military | MITRE |
| --- | --- | --- | --- | --- |
| E11 Leave Approval in Known Portal | legitimate / `legit_system_confirmation` / authority, routine | medium | no | **none, deliberately** |
| E12 Shared Document Sign-In | malicious / `credential_phishing` / curiosity, routine | medium | yes | **T1566.002**, **T1621** (partial), **T1684.001** (partial); **T1111 rejected** |
| E13 Password-Protected ZIP | malicious / `malware_delivery` / curiosity, routine | medium | no | **T1566.001**, **T1204.002**, **T1027.013** (partial); **T1140 rejected** |
| E14 Revised Movement Order | malicious / `qr_code_phishing` / authority, urgency | medium | yes | **T1566.001**, **T1204.001** (partial), **T1684.001** (partial); **T1566.002 rejected** |
| E15 OAuth Consent for Mail Review | malicious / `account_takeover_authorisation_abuse` / convenience, authority | medium | no | **T1528**, **T1566.002**, **T1671** (partial); **T1550.001 & T1621 rejected** |

### The five stories

- **E11 (legitimate control)** — the People Portal's automatic notice that the learner's own leave
  request LV-204 was decided, carrying no link and no attachment and directing them to the portal they
  already use. The safe branch is opening the request in the People Portal app; the traps are a
  web-search sign-in and deleting a real update. Checks: the leave record, the HR helpdesk.
- **E12** — an external "Docs Share" with a generic title whose button opens a cloned sign-in that
  chains into a push-approval prompt; both signing in and approving are −8. Checks: the approved files
  portal, a call to the sharer.
- **E13** — a "Case Documents" sender's encrypted archive with the password in the body; the inert
  viewer lists `Case_Scan.pdf.exe`. Extracting is −3, running is −8. Checks: the records system, the
  records desk.
- **E14** — a one-letter-off "HQ Alpha Movements" address sending a "revised" MOV-77 as a PDF with a QR
  to "decrypt" it; the honest QR inspector shows the decoded off-domain target, and the decrypt portal
  harvests service credentials. Scanning is −3, submitting is −8; the resolve step takes a one-line
  reason. Checks: the orders system, a call to movement staff.
- **E15** — a "Security Upgrade" that asks the learner to authorise "MailSafe Analyzer"; the button
  opens an OAuth consent screen requesting Mail.Read, Mail.Send and Contacts, granted with **no field
  typed**. Granting is −8. Checks: the app catalogue, IT.

### Architecture

Five scene packs, five registry rows, 95 new server-map controls (`email.json` now 276). **No new
renderer** — every decision is a new use of an existing surface: E11's portal launch and E13's archive
listing on `APP`/`MAIL`, E12's cloned sign-in and push page and E14's decrypt portal and E15's consent
screen on `BROWSER`, E14's QR inspector on `VIEWER`. Branch-stage shapes are distinct across all fifteen
Email scenes. See [`docs/SCENE_INTERACTION_LAYER.md`](docs/SCENE_INTERACTION_LAYER.md) §19.2.

### Tests

| Suite | Result |
| --- | --- |
| Full frontend `vitest run` | **2650 / 2650** (one known AssessmentTimer load-flake, green in isolation); 34 files |
| `frontend/src/pages/SceneScenariosEmailC.test.jsx` (new) | **16 / 16** |
| `frontend/src/simulation/sceneModel.test.js` | **1409 / 1409** (1314) |
| `frontend/src/simulation/sceneResearch.test.js` | **161 / 161** (149) |
| `SceneContainment.test.jsx` / `SceneForms.test.jsx` | pass (all authored scenes) |
| `oxlint` / `vite build` / `npm run check:bundle` | clean / clean (chunk-size advisory only) / no canonical vocabulary |
| Full backend `node --test` (no DB) | **601 pass, 0 fail**, 334 skipped |
| `backend/tests/sceneAffordance.test.js` | **136 / 136** (127) |
| `backend/tests/learnerAction.test.js` | 1,313 scene controls (1,037 + 276 Email); baseline covers the pre-Email 1,037 |
| DB-backed, sequential, isolated `cyber_awareness_imm007_*` | learnerActionApi 12; attemptApi 25, attemptResultApi 40, attemptCreation 20, attemptTimer 27, attemptViewerApi 37, auditLogApi 25, candidateProfileApi 21, exportApi 25, instructorControlsApi 28, progressApi 21, scenarioEngineTransaction 21, scenarioManagerApi 32 — all pass |

### Scoring and browser verification

Isolated DB `cyber_awareness_imm007_play`, API **5055**, frontend **5199** (verify mode; 5000/5173 not
running; email pool restricted to E11–E15). **All fifteen E11–E15 routes played end-to-end through the
real controller, API, engine and database** (`playScenario.js`, retried until dealt): every safe path
**10**; E11 web-search **3**, E11 false report **0**; E12 sign-in/approve **0**; E13 run **0**, extract
**4**; E14 submit **0**, scan **4**; E15 grant **0**, open **4**; ledgers exactly as pinned, six stages
each. **E11 safe (10/10) and E15 unsafe (grant, −8) were hand-played through the real UI**: the People
Portal app and leave record render (E11); the OAuth consent screen renders **Mail.Read / Mail.Send /
Contacts with zero input fields** and the app catalogue shows "Not listed" (E15). **The DOM carried no
engine intent or event code** on the played scenes (leak scan clean). **Mobile 375 px and 320 px (~200 %
of 640): no horizontal page overflow.** **Offline:** only `localhost:5199` and `localhost:5055` were ever
contacted (227 resources, zero external). Stale-state, wrong-stage, cross-run and duplicate-replay
refusals are covered by `learnerActionApi.test.js` (12/12), which exercises the same engine path for
every scene; form containment (typed values never reach the wire) is covered by
`SceneScenariosEmailC.test.jsx` for E12/E13/E14 through the real controller.

**Production was not mutated.** `cyber_awareness_training` byte-for-byte identical before and after
(attempts 10, candidates 9, runs 100, events 209 with the same latest id, definitions 100 with the same
digest `9f6447df…`, legacy 40, assessments 1, snapshots 6, audit 0, admin 0, config 0). All 19
bank/synthetic/taxonomy file hashes reproduce, and the `scenarios/v1` and `synthetic/v1` fingerprints are
`8e7a6c98…7687` and `2779b039…fde1`. The isolated databases and both preview servers were removed.

### Known limitations

- Only Email **E11–E15** are authored beyond E01–E10; E16–E25 and all SMS stay on the generic path.
- One scored decision per stage (shared platform limitation): E12's sign-in vs push approval and E13's
  extract vs run are alternatives at the branch stage, not a sequence.
- Result/review cards show the bank's stored sender for the item (carried from earlier batches).
- E12's stored notification body is the fragment "Docs Share:"; the scene uses a full subject from the
  client's own title, like E09's parsed "From" artefact (recorded in the research §0.5).
- Consequence banners belong to the current session; a reload after a release shows the thread without
  them; closing a pushed screen returns focus to the page body.

### Deviations from the instructions

- None material. QR-code phishing (E14) and MFA push-approval (E12) have no dedicated ATT&CK technique in
  v19.2; the research states the gap and maps each to its nearest documented behaviour rather than
  forcing a technique. A `slot:intent` branch shape is a small space, so an Email scene occasionally
  shares one with a WhatsApp/Instagram scene; the distinctness guarantee is asserted within the fifteen
  Email scenes (all unique).

### Next task

**Proceed to Email E16–E20**, then the remaining Email and all SMS batches, on this same layer and
contract, toward the final 100 immersive scenarios (WhatsApp 25, Instagram 25, Email 25, SMS 25).

**IMMERSIVE-007 COMPLETE. Email E11–E15 implemented on the neutral action contract. WhatsApp W01–W25,
Instagram I01–I25 and Email E01–E10 unchanged. Email E16–E25 and SMS untouched. No production mutation.
No scoring semantics changed. Email now 15/25.**

---

## 16.30 IMMERSIVE-008 — Email E16–E20, the fourth Email batch (COMPLETED 19 September 2026)

**IMMERSIVE-008 — Email E16–E20 COMPLETE.**

Five more Email scenarios authored on the existing scene interaction layer and on the neutral learner
action contract. **Nothing in `ScenarioDefinition`, the scoring constants, the engine's scoring
semantics, selection, the timer, the attempt lifecycle, result/review or `ProgressSnapshot` changed**,
the authoritative 100-scenario bank was not touched, and production was not migrated. Email is now
**20/25**; WhatsApp 25/25 and Instagram 25/25 are unchanged; **Email E21–E25 and all 25 SMS scenarios
remain on the generic path.**

### The five scenes

| Scene | Disposition | What it teaches that the first sixty-five did not |
| --- | --- | --- |
| **E16 Signed Maintenance Notice** (medium) | **legitimate** | Proportion. IT Operations sends the notice it sends before every mail-maintenance window — a change number, a half-hour window, "nothing to do" — digitally signed, SPF/DKIM passing, no link, one calendar file, with last month's identical notice in the thread. The normal path is the attachment's own **Add reminder** or an archive; the mistakes are the learner's own: Junk, block, or forwarding work mail to a personal address. The check is the change ID on the IT status board. |
| **E17 Invoice Callback Trap** (medium) | malicious | A lure built with **no link and no attachment** — only an order table and a phone number — so a mail filter has nothing to catch. The decision is the tappable number, taken on the phone's own "Call this number?" dialog. Calling reaches a scripted cancellation desk that immediately asks to install remote support and read out its code. The checks are the learner's own card statement and their bank on the number on the card. |
| **E18 Hijacked Reply-Chain Invoice** (hard) | malicious | A real thread continued by someone else. Unlike E10's look-alike domain, **every authentication check passes, because the mail really did leave the vendor's mailbox**; only the Reply-To, the writing style and the one-off exception differ. The decisions live in a Payables app (change beneficiary / release / hold) and in the composer, where forwarding to a second approver quietly turns dual control into a formality. The check is a callback on the vendor-master number. |
| **E19 Academic Interview on Readiness** (hard, military) | malicious | Elicitation with no payload at all: a courteous, flattering invitation with a fillable questionnaire whose questions, read one by one, ask for systems, gaps, location and weekly tempo — sent from a non-university domain to thirty-eight named recipients with no ethics reference. The release is the document's own "fill it in and send it back"; the checks are the Public Information Office and the approved research-requests register. |
| **E20 Legal Notice and Secrecy Order** (hard) | malicious | **Isolation as the lever.** A "National Inquiry Office" summons attaches a sealed "warrant", demands a refundable verification bond before 17:00, and forbids telling anyone — colleagues, family, employer, lawyer. The portal it links to carries both the document upload and the payment, and its own case lookup can only ever agree with itself. The checks break the isolation: the learner's own case-status app, and unit legal support. |

### Taxonomy (the bank's own, normalised by the existing taxonomies — nothing invented)

| Scene | Canonical family | Canonical triggers | Disposition | Difficulty | Military |
| --- | --- | --- | --- | --- | --- |
| E16 | `legit_routine_broadcast` | `authority` + `routine` | legitimate | medium | false |
| E17 | `tech_support_and_callback_fraud` | `fear` + `urgency` | malicious | medium | false |
| E18 | `payment_diversion` | `trust` + `routine` | malicious | hard | false |
| E19 | `operational_elicitation` | `expert_status` + `flattery` | malicious | hard | **true** |
| E20 | `coercion_and_extortion` | `fear` + `authority` + `isolation_secrecy` | malicious | hard | false |

### MITRE ATT&CK (v19.2, read for this batch; full justifications in the research record)

| Scene | Primary | Supporting / partial (stated as such) |
| --- | --- | --- |
| E16 | **None, and none invented** — a signed, expected, no-action notice from the unit's own IT involves no adversary. Nearest defensible references are NIST's Phish Scale guidance on false positives and NCSC's proportionate-response guidance. | — |
| E17 | `T1566.004` Spearphishing Voice | `T1219` / `T1219.002` Remote Access Tools (the call's objective, never completed); `T1684.001` Impersonation |
| E18 | `T1586.002` Compromise Accounts: Email Accounts; `T1657` Financial Theft | `T1114.003` Email Forwarding Rule (off-screen, reported on the callback) |
| E19 | `T1598.002` Spearphishing Attachment; `T1591` Gather Victim Org Information (.001/.003/.004) | `T1585.002` Establish Accounts: Email Accounts |
| E20 | `T1684.001` Impersonation; `T1657` Financial Theft (objective) | `T1598.003` Spearphishing Link. **Gap stated, not forced:** ATT&CK describes extortion as an outcome, and has no technique for the *secrecy/isolation* instruction. |

### Files

**Created:** `frontend/src/simulation/scenes/email/{e16,e17,e18,e19,e20}.js`,
`frontend/src/pages/SceneScenariosEmailD.test.jsx`, `backend/tests/emailE16E20Engine.test.js`,
`docs/EMAIL_E16_E20_REAL_WORLD_RESEARCH.md`.
**Modified:** `frontend/src/simulation/sceneRegistry.js`, `sceneModel.test.js`, `sceneResearch.test.js`,
`backend/data/learner-actions/v1/email.json` (276 → 374 scene controls),
`backend/tests/{sceneAffordance,learnerAction}.test.js`, `backend/scripts/playScenario.js`, and the four
documents updated by this section.
**Not modified:** the bank (`backend/data/scenarios/v1/**`, `synthetic/v1/**`, `taxonomy/**`), the engine,
the scoring constants, selection, the timer, the attempt lifecycle, result/review and `ProgressSnapshot`.

### Tests

| Suite | Result |
| --- | --- |
| Frontend, full (`npm test`) | **2810 / 2810 pass**, 35 files — no failures, no AssessmentTimer flake in this run |
| `sceneModel.test.js` | 1510 (from 1409) — includes the Email E01–E20 distinctness block |
| `sceneResearch.test.js` | 173 (from 161) |
| `SceneScenariosEmailD.test.jsx` (new) | 27 |
| Backend without a database (`npm test`) | **606 pass / 0 fail**, 340 skipped (the DB suites) |
| All 14 DB suites, each against its own isolated replica-set database | **340 / 340 pass, 0 fail** — `attemptApi` 25, `attemptCreation` 20, `attemptResultApi` 40, `attemptTimer` 27, `attemptViewerApi` 37, `auditLogApi` 25, `candidateProfileApi` 21, `emailE16E20Engine` **6**, `exportApi` 25, `instructorControlsApi` 28, `learnerActionApi` 12, `progressApi` 21, `scenarioEngineTransaction` 21, `scenarioManagerApi` 32 |
| `sceneAffordance.test.js` | 141 (from 136) |
| `learnerAction.test.js` | 10 — the map now holds 1,411 scene controls (517 WhatsApp + 520 Instagram + 374 Email) plus 37 generic |
| Lint (`oxlint`), build (`vite build`), `npm run check:bundle` | clean / built / **passed: 3 files, no canonical vocabulary** |

### Browser validation (19 September 2026)

Driven through the real UI at `localhost:5199` against an isolated API at `localhost:5055` on an isolated
database. Selection is server-authoritative and cannot be steered from a client, so each target scene was
reached by ordinary play: non-target runs were walked to resolution through the same public endpoints, a
fully resolved attempt was finalised through **`POST /api/attempts/:id/complete`** — the normal completion
route — before the next learner was created, and nothing about the attempt lifecycle was bypassed or
changed to make testing easier.

| Check | Result |
| --- | --- |
| E16 safe (preview `.ics` → Add reminder → IT status board → archive) / unsafe (forward to a personal address → directory → block) | **10 / 10** and **0 / 10** |
| E17 safe (mail search → dial dialog **Cancel** → card statement → report) / unsafe (dial → **Call** → install screen → ask the desk in the email → call to cancel) | **10 / 10** and **0 / 10** |
| E18 safe (details → Payables **hold** → callback to Anil → hold and report) / unsafe (forward for same-day sign-off → dual-control queue → pay the recovery account) | **10 / 10** and **0 / 10** |
| E19 safe (read every question → close → research register → report) / unsafe (fill it in and send it back → PIO → answer "only the general questions") | **10 / 10** and **0 / 10** |
| E20 safe (warrant preview → close without responding → own case-status app → report and keep) / unsafe (open the portal → upload and payment pages → pay the bond) | **10 / 10** and **0 / 10** |
| Reload recovery | The attempt resumed at the same run and stage twice, including **mid-scene at Inspect**, with a Resume control |
| Duplicate replay | Same code + same `intent_key` twice → both 200, same sequence, byte-identical run state |
| Wrong stage / mismatched `expected_stage` | 409 `STALE_STATE` with `current_stage`; 422 `INVALID_ACTION` |
| Tampered and malformed codes | 422 `INVALID_ACTION`, the same neutral message |
| Cross-run replay | A code minted for another run → 422 `INVALID_ACTION` |
| Forbidden request fields (`intent`, `points_delta`) | 422 `FORBIDDEN_FIELD`, naming only the rejected key |
| Mobile 375 px and 320 px (~200 % of 640) | **No horizontal page overflow on any reachable screen** — inbox and every folder, thread and quoted text, sender details and their sub-pages, `.ics` / questionnaire / warrant previews, the simulated browser and its upload and payment pages, the calendar, status board, Payables, dual-control queue, banking, register and case-status apps, every call screen, the install screen, the dial dialog, the composer, the trusted directory and the resolve panel |
| Accessibility spot check at 320 px | `lang` set; every visible control has an accessible name and is focusable; no target under 24 px; `main` / `nav` / `footer` / `role="status"` landmarks; ordered headings; no image without `alt` |

### Security validation (SECURITY-001 intact)

| Surface | Result |
| --- | --- |
| DOM | No canonical intent, event code, `data-intent` or `data-affordance`. Data attributes are `data-testid`, `data-beat`, `data-control`; test ids are `device-screen`, `phone-app`, `mail-thread`, `mail-sender`, `mail-attachment`, `mail-quoted`, `mail-cta`, `mail-action-banner`, `mail-reply-bar`, `mail-compose-head`, `mail-compose-body`, `mail-drafts`, `scene-surface`, `call-captions`, `call-controls`, `time-remaining`, `device-status-bar`, `notification-tray` — none names an answer |
| React props | A walk of the live fiber tree found no `intent`, `source`, `verifySource` or `eventCode` prop and no canonical value; each scene's 21–23 control objects carry only `id, label, slot, anchor, opens, hint, compose, echo, targetId, page, thenPage, closes, on, after, local` |
| Requests | Every body was `{action_code, intent_key, expected_stage, synthetic_target_id, client_ts, elapsed_ms}` |
| Responses | No `event_code`. After resolution, `outcome_code` and the score only — the documented behaviour |
| `localStorage` / `sessionStorage` | Empty throughout |
| Globals | None added |
| Production bundle | `npm run check:bundle` passed; an independent scan found the neutral ids `e16-c01 … e20-c20` and **zero** occurrences of `intent:`, `event_code`, `expected_action`, `points_delta`, `verify_source` or the old affordance-id shapes. `safe_action` / `safe_response` / `safe_habit` / `unsafe_handling` are the client's own feedback field names, shown after a run closes, and map no control |

### Form and data containment

E16–E20 have **no typed field on any scored path**: the five scenes' 98 controls include no form, and the
simulated browser's upload and payment pages are descriptions with **zero** `input`, `textarea` or
`select` elements — the upload and the payment are decisions, not forms, so no identity document, bank
statement or card detail can exist to leak. E20 was exercised on both the upload page and the payment
page, and on the "Pay INR 49,500 now" branch as well as the upload branch. The two places a learner can
type or draft are contained: the **trusted-directory search** produced **zero** network requests and no
storage write when a probe string was typed, and the **composer's** drafted body ("Vendor has changed
account for this month only…") never appeared on the wire — the forward submitted only the opaque
`action_code`. Nothing typed or drafted reached an API request body, MongoDB, event metadata,
`localStorage`, `sessionStorage`, an export or a global.

### Offline validation

225 resources were loaded across the validated sessions and **every one came from `localhost:5199` or
`localhost:5055`** — no external URL, API, CDN or service. The `.training.example` addresses (the E20 case
portal, the sender domains, the `X-Change-Ref` headers) are **drawn text**: the rendered page contains no
anchor, image, iframe or form element at all, so none of them can produce a request.

### Production, before and after

`cyber_awareness_training` was never written to and is byte-identical:

| Collection | Before | After |
| --- | --- | --- |
| attempts | 10 | 10 |
| candidates | 9 | 9 |
| scenarioruns | 100 | 100 |
| scenarioevents | 209 | 209 (same latest `_id` `6aa28eea…7711`) |
| scenariodefinitions | 100 | 100 |
| scenarios (legacy) | 40 | 40 |
| assessments | 1 | 1 |
| progresssnapshots | 6 | 6 |
| auditevents / adminusers / configurations | 0 / 0 / 0 | 0 / 0 / 0 |

The newest production attempt still dates from 10 September 2026. The stored definitions were fingerprinted
read-only and compared with a fresh import of the unchanged bank files into a throwaway database: the
content digest `43c45ff7…cf2a` and the synthetic digest `4359adc6…551c` are identical on both sides, so
production's 100 definitions carry exactly the content of the bank files. The client bank fingerprint is
`8e7a6c98…038a7687` and the synthetic fingerprint `2779b039…09afde1`, unchanged since DATA-002. All 21
tracked bank, synthetic, taxonomy and learner-action files reproduce their hashes, and `git status` reports
`backend/data/` clean.

### Cleanup

The isolated API (5055) and preview frontend (5199) were stopped; no process listens on 5000, 5055, 5173 or
5199 and no node process remains. Every `cyber_awareness_imm008*` database was dropped (34 of them: this
task's verification and per-suite databases, and the earlier hand-play databases). The temporary
`api-verify-imm008` entry was removed from `.claude/launch.json`. No process was ever pointed at the
production database.

### Known limitations

- Only Email **E01–E20** are authored; **E21–E25 and all SMS** stay on the generic path.
- One scored decision per stage (shared platform limitation): E18's beneficiary change vs release, and
  E20's upload vs payment, are alternatives at the branch stage, not a sequence. Each was exercised, but
  in different plays.
- E20's branch is "open the case portal", so the portal's upload and payment controls are only offered
  while the run is at that stage; reached later they are page navigation, which is why both were also
  driven from the action list.
- Reaching a chosen scenario in the browser needs many attempts, because selection is server-authoritative
  by design. For the 320 px pass the isolated database's email pool was narrowed to E16–E20 so every
  attempt drew from them; the selection solver, the engine and all scoring ran unchanged, and the narrowing
  existed only in a throwaway database that has since been dropped.
- Consequence banners belong to the current session; a reload after a release shows the thread without them
  (carried from earlier batches).
- Result and review cards show the bank's stored sender for the item (carried from earlier batches).

### Deviations from the instructions

- None material. E16 has no ATT&CK mapping and none was invented; E20's secrecy/isolation lever has no
  ATT&CK technique and the gap is stated rather than forced. A forward submits the engine's existing
  `reply` intent rather than a new one.

### Next task

**Proceed to Email E21–E25**, then the SMS batches, on this same layer and contract, toward the final 100
immersive scenarios (WhatsApp 25, Instagram 25, Email 25, SMS 25). Production migration remains
**DEFERRED**.

**IMMERSIVE-008 COMPLETE. Email E16–E20 complete. WhatsApp W01–W25, Instagram I01–I25 and Email E01–E15
unchanged. Email E21–E25 and SMS untouched. No production mutation. No scoring semantics changed. Email
now 20/25.**

## 16.31 IMMERSIVE-009 — Email E21–E25, the final Email batch (COMPLETED 20 September 2026)

**IMMERSIVE-009 — Email E21–E25 COMPLETE. Email is now 25/25.**

Five more Email scenarios authored on the existing scene interaction layer and on the neutral learner
action contract. **Nothing in `ScenarioDefinition`, the scoring constants, the engine's scoring
semantics, selection, the timer, the attempt lifecycle, result/review or `ProgressSnapshot` changed**,
the authoritative 100-scenario bank was not touched, and production was not migrated. WhatsApp 25/25,
Instagram 25/25 and Email 25/25; **all 25 SMS scenarios remain on the generic path.**

### The five scenes

| Scene | Disposition | What it teaches that the first seventy did not |
| --- | --- | --- |
| **E21 Verified Vendor Master Change** (hard) | **legitimate** | That a high-risk change which has passed its controls is *completed*, not refused. Everything a learner is taught to distrust is present — a bank-detail change, an amount, a deadline — and so is every control: a signed form whose fingerprint matches what the portal recorded, a callback logged on the number already in the vendor master, and "Approval 1 of 2" signed by somebody else. The safe branch is recording the second approval; rejecting it costs −2 and short-circuiting dual control by releasing the payment costs −4. It is also the first scene whose **message link is genuine** — the lesson is that a link is checkable, not that links are forbidden. |
| **E22 Senior Voice Memo Transfer** (hard, military) | malicious | The first scene in the product whose payload is a **recording**. A forty-one-second voice attachment in the CO's voice orders a welfare disbursement today and says not to ring back because of a briefing — so the one thing that would settle it is the one thing the message forbids. A recording can be replayed but it cannot answer a question, and the attachment-details screen says what it cannot carry: no sender, no signature, no address. The decision is the fund's own transfer sheet, PIN then Confirm, with Cancel beside it. |
| **E23 DLP Alert HTML Attachment** (hard) | malicious | That **a page opened from a file has no address to check**. A "Data Protection Monitor" says the learner's own account tripped an exfiltration rule and attaches the finding as HTML "for local review". The mail app refuses to render it and offers only "Open it in the browser"; the address bar then shows a Downloads path — no host, no padlock — and the page draws the unit's own login and a "secure viewer" installer. Every domain-reading habit the learner has gives them nothing here. The check is the unit's own console, which holds no alert for them. |
| **E24 QR Code in Policy PDF** (hard) | malicious | That **the route an item asks for is not always the route the item has**. A polished annual policy circular attaches a genuine-looking eight-page policy; on page 7, one new sentence says acknowledgement must now be done on a mobile device by scanning the code printed there. The code has to be walked to, the inspector states both the printed short form and the different host it expands to — and the Policy Centre the unit already uses has the acknowledgement task waiting, so the safe branch is doing the real task. |
| **E25 Payroll Direct-Deposit Redirect** (hard, military) | malicious | That **"Re:" is typed by whoever writes it**. Unlike E18, no mailbox was compromised: the subject line was reused and a real 28 Aug message pasted underneath, and the headers say the mail replies to nothing. It is also the only scene where the money at risk belongs to **a third person** — a soldier's allowance — arriving as an ordinary clerical task from the learner's own boss, with a real deadline and a "he's on a course, don't chase him" that removes the one person who could refuse it. |

### Taxonomy (the bank's own, normalised by the existing taxonomies — nothing invented)

| Scene | Canonical family | Canonical triggers | Disposition | Difficulty | Military |
| --- | --- | --- | --- | --- | --- |
| E21 | `legit_verified_high_risk_change` | `routine` + `authority` | legitimate | hard | false |
| E22 | `payment_diversion` | `authority` + `urgency` | malicious | hard | **true** |
| E23 | `malware_delivery` | `fear` + `duty_compliance` | malicious | hard | false |
| E24 | `qr_code_phishing` | `authority` + `convenience` | malicious | hard | false |
| E25 | `payment_diversion` | `authority` + `routine` | malicious | hard | **true** |

### MITRE ATT&CK (v19.2, read live 20 September 2026; full justifications in the research record)

| Scene | Primary | Supporting / partial (stated as such) |
| --- | --- | --- |
| E21 | **None, and none invented** — a vendor completing an approved change through its own controls involves no adversary. Nearest defensible references are NCSC's payment-change verification guidance and NIST's Phish Scale on false positives. | — |
| E22 | `T1684.001` Impersonation; `T1657` Financial Theft | `T1585.002` Email Accounts; `T1566.004` Spearphishing Voice (**partial** — the sub-technique is a live call, and this message forbids calling). **Gap stated:** ATT&CK has no technique for a recorded or synthesised voice used as an instruction. |
| E23 | `T1566.001` Spearphishing Attachment; `T1027.006` HTML Smuggling | `T1036` Masquerading; `T1204.002` User Execution; `T1219` Remote Access Tools (**partial**) |
| E24 | `T1566.001` Spearphishing Attachment; `T1036` Masquerading | `T1566.002` Spearphishing Link (**partial** — no link in the message). **Gap stated:** T1566.002 was read in full and mentions no QR code; v19.2 has no quishing technique. |
| E25 | `T1684.001` Impersonation; `T1657` Financial Theft | `T1585.002` Email Accounts; `T1036` Masquerading (**partial**). **Gap stated:** ATT&CK models thread hijack only through *compromised* accounts (`T1586.002`, rejected here); it has none for faking a reply chain by reusing a subject line. |

### Files

**Created:** `frontend/src/simulation/scenes/email/{e21,e22,e23,e24,e25}.js`,
`frontend/src/pages/SceneScenariosEmailE.test.jsx`, `backend/tests/emailE21E25Engine.test.js`,
`docs/EMAIL_E21_E25_REAL_WORLD_RESEARCH.md`.
**Modified:** `frontend/src/simulation/sceneRegistry.js`, `scenes/email/shared.js` (the `voice` beat),
`frontend/src/components/simulation/email/MailBlocks.jsx` (the `voice` renderer; a `table` beat may now
carry an anchored control), `sceneModel.test.js`, `sceneResearch.test.js`,
`backend/data/learner-actions/v1/email.json` (374 → 472 scene controls),
`backend/tests/{sceneAffordance,learnerAction}.test.js`, `backend/scripts/playScenario.js`, and the three
documents updated by this section.
**Not modified:** the bank (`backend/data/scenarios/v1/**`, `synthetic/v1/**`, `taxonomy/**`), the engine,
the scoring constants, selection, the timer, the attempt lifecycle, result/review and `ProgressSnapshot`.

### Tests

| Suite | Result |
| --- | --- |
| Frontend, full (`npm test`) | **2976 / 2976 pass**, 36 files — no failures, no AssessmentTimer flake in this run |
| `sceneModel.test.js` | 1613 (from 1510) — the Email E21–E25 distinctness block and the branch-surface reachability guard |
| `sceneResearch.test.js` | 185 (from 173) |
| `SceneScenariosEmailE.test.jsx` (new) | 32 |
| `SceneContainment.test.jsx` | 332 (from 250) — picked the five scenes up automatically |
| Backend without a database (`npm test`) | **612 pass / 0 fail**, 340 skipped (the DB suites) |
| `backend/tests/emailE21E25Engine.test.js` (new, isolated replica-set DB) | **6 / 6** — fourteen safe and unsafe routes through the real engine and a real MongoDB transaction, plus stale view, wrong stage, cross-run code, retry replay and reload rebuild |
| `sceneAffordance.test.js` | 147 (from 141) |
| `learnerAction.test.js` | 10 — the map now holds 1,509 scene controls (517 WhatsApp + 520 Instagram + 472 Email) plus 37 generic |
| Lint (`oxlint`), build (`vite build`), `npm run check:bundle` | clean / built / **passed: 3 files, no canonical vocabulary** |

### Browser validation (20 September 2026)

Driven through the real UI against the **production build** on `localhost:5199`, an isolated API on
`localhost:5055` and an isolated database. Selection is server-authoritative and cannot be steered from a
client, so each target scene was reached by ordinary play; non-target runs were walked to resolution
through the same public endpoints and attempts were finalised through `POST /api/attempts/:id/complete`.

| Check | Result |
| --- | --- |
| **E21 hand-played safe** (details → signed form → portal case → record the second approval → call the vendor on the vendor-master number → complete the case) | **10 / 10** |
| **E22 hand-played unsafe** (premature reply from the list → play the memo and read the transcript → attachment details → transfer sheet → PIN → Confirm → ask the sender to confirm → put it through) | **0 / 10**, including the engine pricing the premature reply at −1 |
| **E23 hand-played** (preview → the app refuses to render → open it in the browser → `file:///` page → console → report) | **4 / 10** |
| **E23 hand-played again, credential submit** (reach the local page by the new navigate with the branch unspent → type a work email and password → Unlock the finding) | **−8 committed**; see data containment below |
| **E24 driven through the UI** (document → page 7 → read the code → open the decoded address → Policy Centre → report) | **4 / 10** |
| All eighteen E21–E25 safe and unsafe routes through the real public HTTP API | every safe path **10/10**; every `−8` route **0/10**; every pinned score matched exactly |
| Eleven refusal cases over HTTP | forbidden `intent` and `points_delta` → 422 `FORBIDDEN_FIELD`; malformed and tampered codes → 422 `INVALID_ACTION` with one neutral message; duplicate replay → same sequence, `duplicate:true`; earlier-stage control → 409 `STALE_STATE` with `current_stage`; mismatched `expected_stage` → 422; another run's code → 422 |
| Reload mid-scene | resumed at the same run and stage behind a **Resume** banner; the thread rebuilt from the committed stage; the pushed browser surface correctly **not** restored; no replay |
| Mobile 375 px and 320 px (~200 % of 640) | **No horizontal page overflow on any reachable screen** — inbox and every folder, thread and quoted text, message details and sub-pages, signed form, voice card, attachment preview, the `file:///` browser and its viewer page, the paginated policy document, the code inspector, the Policy Centre, Payroll, pay records, the data-protection console, the transfer sheet, the call screens, the overflow menu and the resolve banner |
| Accessibility spot check | every visible control has an accessible name; no target under 24 px; the resolve banner stays two readable pills at 320 px; the branch control operates from the keyboard |

### Security validation (SECURITY-001 intact)

| Surface | Result |
| --- | --- |
| DOM | No canonical intent, event code, `data-intent` or `data-affordance`. The only data attributes are `data-testid`, `data-beat` and `data-control` |
| React props | A walk of the live fiber tree (405 nodes) found no `intent`, `source`, `verifySource` or `eventCode` prop; control objects carry only `id, label, slot, anchor, opens, hint, compose, echo, targetId, page, thenPage, closes, on, after, local` |
| Requests | The credential submit, captured at the wire, was exactly `{action_code, intent_key, expected_stage, synthetic_target_id, client_ts, elapsed_ms}` |
| Responses | No `event_code` |
| `localStorage` / `sessionStorage` / cookies | Empty throughout; no JS-readable cookie |
| Globals | None added |
| Production bundle | `npm run check:bundle` passed: 3 files, no canonical vocabulary |

### Form and data containment

E21 and E25 have **no field on any screen**. The three that do are contained, and were exercised with
real typing in the live UI: E22's six-digit fund PIN, and the work email and password on E23's local page
(E24's cloned sign-in has the same pair). On the accepted `−8` submit the request body carried **neither**
typed value, and a search of **every collection of the isolated database** for the typed password, the
typed email and the typed PIN returned **zero occurrences**. Event metadata held only allowlisted keys
(`intent`, `transition`, `consequence`, timings). The password field is `FIELD_KIND.MASKED` — masked by
CSS (`-webkit-text-security: disc`), never `type="password"` — with `autoComplete="off"` and the neutral
names `f0` / `f1`, so no browser or password manager recognises or offers to save it.

### Offline validation

227 requests were made across the validated browser sessions and **every one went to `localhost:5199` or
`localhost:5055`** — no external URL, API, CDN or service. The `.training.example` addresses and E23's
`file:///storage/downloads/SecurityReport.html` are **drawn text** in a read-only address bar: the
rendered page contains no anchor, image, iframe, form or media element at all, so none of them can produce
a request. E22's voice attachment has no `<audio>`, no media file, no object URL and no media API.

### Production, before and after

`cyber_awareness_training` was never written to and is byte-identical — counts **and** the latest `_id` in
every collection match the snapshot taken before the work began:

| Collection | Before | After |
| --- | --- | --- |
| attempts | 10 | 10 |
| candidates | 9 | 9 |
| scenarioruns | 100 | 100 |
| scenarioevents | 209 | 209 (same latest `_id` `6aa28eea…7711`) |
| scenariodefinitions | 100 | 100 |
| scenarios (legacy) | 40 | 40 |
| assessments | 1 | 1 |
| progresssnapshots | 6 | 6 |
| auditevents / adminusers / configurations | 0 / 0 / 0 | 0 / 0 / 0 |

The client bank fingerprint is `8e7a6c98…038a7687` and the synthetic fingerprint `2779b039…09afde1`,
unchanged since DATA-002; all bank, synthetic and taxonomy files reproduce their hashes and
`git status backend/data/` shows only `learner-actions/v1/email.json`, which is this layer's own file and
not client content.

### Known limitations

- **All 25 SMS scenarios** remain on the generic path (IMMERSIVE-010 authors S01–S05).
- One scored decision per stage (shared platform limitation): E23's sign-in vs install, and E25's approve
  vs release, are alternatives at the branch stage, not a sequence. Each was exercised, but in different
  plays.
- **Three earlier scenes (W02, W05, I25) reach a scored branch surface only through a scored control**, so
  the controls on that surface cannot be pressed in the UI. Found while fixing the same shape in E23–E25;
  recorded rather than changed, because they are completed, validated work outside this task's scope.
- Consequence banners belong to the current session; a reload after a release shows the thread without them
  (carried from earlier batches).
- Result and review cards show the bank's stored sender for the item — E25's is stored as `"Re"` (carried
  from E18's identical artefact).
- Reaching a chosen scenario in the browser needs many attempts, because selection is server-authoritative
  by design. The isolated database's email pool was narrowed so every attempt drew from E21–E25; the
  selection solver, the engine and all scoring ran unchanged, and the narrowing existed only in a throwaway
  database that has since been dropped.

### Deviations from the instructions

- **E24 is a QR scenario and the brief asked to avoid repeating QR phishing.** The bank pins E24's family
  as `qr_code_phishing` and its stage-4 text as "the PDF QR inspector and synthetic mobile sign-in", and
  the bank is authoritative and may not be changed. Distinctness from E14 was achieved in the *mechanism*
  instead — a paginated document the code must be walked into, a short form that expands to a different
  host, and the item's own legitimate task offered as the safe branch — and is asserted in
  `sceneModel.test.js`. No taxonomy identifier was invented.
- **E22's scored decision is the payment sheet, not the audio player.** The client's stage-4 text names
  "an audio player with transfer instructions and a payment mock"; the engine takes one branch decision per
  stage, and listening to a message is reading it, so playing the memo is local and Confirm is the `−8`.
- **E25's "attached form" is the linked prefilled page.** Stage 2 says "using an attached form" while stage
  4 says "a prefilled payroll change form and Approve button", and the bank's own asset for E25 is a
  `browser_page` with no `file` asset. The scene follows stage 4 and the asset.
- E21 has no ATT&CK mapping and none was invented; the recorded-voice, QR and subject-line-reuse gaps are
  stated rather than forced. A forward submits the engine's existing `reply` intent rather than a new one.

## 16.32 IMMERSIVE-010 — SMS S01–S05, the first SMS batch (COMPLETED 20 September 2026)

**IMMERSIVE-010 — SMS S01–S05 COMPLETE. The immersive layer now covers 80 of the 100 scenarios.**

Five SMS scenarios authored on the existing scene interaction layer and on the neutral learner action
contract, with a new app to draw them. **Nothing in `ScenarioDefinition`, the scoring constants, the
engine's scoring semantics, selection, the timer, the attempt lifecycle, result/review or
`ProgressSnapshot` changed**, the authoritative 100-scenario bank was not touched, and production was
not migrated. WhatsApp 25/25, Instagram 25/25, Email 25/25, **SMS 5/25**; S06–S25 remain on the
generic path.

### The app, before the scenes

This is the first batch since IMMERSIVE-005 to add a platform app, and the brief was explicit that SMS
must not look like the messenger. It does not, and the difference is not cosmetic — it is where the
evidence lives:

| The messenger has | A text app has instead, and the scenes use it |
| --- | --- |
| A profile behind every chat | **Only a conversation-details screen**: the number, whether it is a *registered sender ID* or an ordinary mobile, whether it is saved, which SIM took it |
| Delivery ticks, "last seen", reactions, forwarding provenance | **None of them** — asserted, so no scene can reintroduce one |
| One chat list | **Category tabs** (Personal / Transactions / Spam), so which bucket a text landed in is itself evidence, and the real bank's thread sits one tab from the fake one |
| Rich link previews | **A card showing the address exactly as written**, so a shortener stays a shortener until the learner opens the link-details screen that expands it |
| Block inside a contact sheet | **A spam bar** above any unsaved sender, carrying the app's own Block and Report, plus a **spam-protection settings screen** where blocking a registered sender visibly costs every future fraud alert |

New files: `components/simulation/sms/{SmsScene,SmsBubbles}.jsx`,
`components/simulation/surfaces/SmsSurface.jsx` (`SURFACE.SMS`), a `--color-sms-*` token group, and
seven SMS beat kinds (`day`, `system`, `message`, `link`, `number`, `amount`, `attachment`). No
existing renderer changed.

### The five scenes

| Scene | Disposition | What it teaches that the first seventy-five did not |
| --- | --- | --- |
| **S01 Bank KYC Suspension** (easy) | malicious | **A bank does not text you from a phone.** The account will be blocked in thirty minutes; the message came from a ten-digit mobile, which is why the phone filed it under Personal. One tab away, under Transactions, is a year of the learner's real bank alerts from `BK-UNIONX` — six characters, no digits to reply to, and not one of them carrying an address. The link card shows the short form; the link-details screen expands it to somewhere else. |
| **S02 Electricity Disconnect Tonight** (easy) | malicious | **What the voice asks for is the decision.** A text at 18:34 says the power goes at 21:30, with no link and no consumer number — a filter has nothing to catch. Tapping the number raises the phone's own dial dialog, and connecting reaches a scripted desk; both of those are navigation. The scored decisions are the operator's two asks — an app to install so he can "restore it from here", and a reconnection charge — and ending the call. |
| **S03 Matching Debit Alert** (easy) | **legitimate** | **A matching no-action alert is a control, not a threat — and switching it off is costly.** INR 840 was spent four minutes ago and the alert for it has arrived from the header the learner has had alerts from for a year, with no link and nothing to do. The evidence is the thread's own history. Blocking the header costs −2, and the phone's spam-protection screen says what it would actually do: block every future fraud alert from that business. |
| **S04 Unpaid E-Challan Link** (easy) | malicious | **Check the detail, not the tone.** The fine notice quotes a vehicle registration — which is what makes it feel researched, and which is one character off the learner's own. No challan number, no photograph reference, unlike the two genuine notices in their Transactions tab. The portal they open themselves finds nothing against their registration and no record of the one quoted. |
| **S05 Parcel Address Fee** (easy) | malicious | **Twenty rupees is the wrapper, not the charge.** The sender set its own display name over an unsaved mobile, and the learner really is expecting a parcel — a coincidence, not an arrangement, since the tracking number quoted is not theirs. The address form harvests identity; the payment that follows is an autopay mandate whose own rows on the phone's sheet read "up to INR 20,000 per month" and "runs until cancelled by you". |

### Taxonomy (the bank's own, normalised by the existing taxonomies — nothing invented)

| Scene | Canonical family | Canonical triggers | Disposition | Difficulty | Military |
| --- | --- | --- | --- | --- | --- |
| S01 | `financial_credential_phishing` | `fear` + `urgency` | malicious | easy | false |
| S02 | `tech_support_and_callback_fraud` | `fear` + `urgency` | malicious | easy | false |
| S03 | `legit_system_confirmation` | `routine` | legitimate | easy | false |
| S04 | `financial_credential_phishing` | `fear` + `urgency` | malicious | easy | false |
| S05 | `financial_credential_phishing` | `curiosity` + `urgency` | malicious | easy | false |

### MITRE ATT&CK (v19.2, read live 20 September 2026; full justifications in the research record)

This is the first batch whose primary mapping is in the **Mobile** matrix rather than Enterprise,
because the delivery channel is the handset.

| Scene | Primary | Supporting / partial (stated as such) |
| --- | --- | --- |
| S01 | `T1660` Phishing (Mobile); `T1417.002` GUI Input Capture | `T1684.001` Impersonation; `T1585.002` Email Accounts (**partial** — the channel is a number, not email). **Gap stated:** ATT&CK has no technique for the carrier-level registered sender ID, which is this scene's whole tell. |
| S02 | `T1660` Phishing (Mobile); `T1219` Remote Access Tools; `T1657` Financial Theft | `T1684.001` Impersonation; `T1566.004` Spearphishing Voice (**partial** — the sub-technique has the adversary placing the call) |
| S03 | **None, and none invented** — the learner's own bank sent its own alert about a purchase they just made. Nearest defensible references are NIST's Phish Scale guidance and NCSC's proportionate-response guidance. | — |
| S04 | `T1660` Phishing (Mobile); `T1417.002` GUI Input Capture; `T1684.001` Impersonation | `T1657` Financial Theft |
| S05 | `T1660` Phishing (Mobile); `T1417.002` GUI Input Capture; `T1657` Financial Theft | `T1684.001` Impersonation. **Gap stated:** no ATT&CK technique covers a recurring mandate obtained under a one-off pretext. |

### Files

**Created:** `frontend/src/simulation/scenes/sms/{shared,s01,s02,s03,s04,s05}.js`,
`frontend/src/components/simulation/sms/{SmsScene,SmsBubbles}.jsx`,
`frontend/src/components/simulation/surfaces/SmsSurface.jsx`,
`frontend/src/pages/SceneScenariosSms.test.jsx`, `backend/tests/smsS01S05Engine.test.js`,
`backend/data/learner-actions/v1/sms.json` (96 controls),
`docs/SMS_S01_S05_REAL_WORLD_RESEARCH.md`.
**Modified:** `frontend/src/simulation/sceneRegistry.js`, `sceneModel.js` (`SURFACE.SMS`),
`components/simulation/{SceneSurfaces,PhoneShell}.jsx`, `styles/index.css` (the `--color-sms-*`
tokens), `sceneModel.test.js`, `sceneResearch.test.js`, `frontend/src/test/actionMap.js`,
`backend/src/services/learnerActionService.js` (`loadActionMaps` reads the `sms` platform),
`backend/tests/{sceneAffordance,learnerAction}.test.js`, `backend/scripts/playScenario.js`, and the
three documents updated by this section.
**Not modified:** the bank (`backend/data/scenarios/v1/**`, `synthetic/v1/**`, `taxonomy/**`), the
engine, the scoring constants, selection, the timer, the attempt lifecycle, result/review and
`ProgressSnapshot`.

### Tests

| Suite | Result |
| --- | --- |
| Frontend, full (`npm test`) | **3149 / 3149 pass**, 37 files |
| `sceneModel.test.js` | 1718 (from 1613) — the SMS S01–S05 distinctness block |
| `sceneResearch.test.js` | 197 (from 185) |
| `SceneScenariosSms.test.jsx` (new) | 35 |
| `SceneContainment.test.jsx` | 397 (from 332) — picked the five scenes up automatically |
| Backend without a database (`npm test`) | **619 pass / 0 fail**, 352 skipped (the DB suites) |
| `backend/tests/smsS01S05Engine.test.js` (new, isolated replica-set DB) | **6 / 6** — fifteen routes through the real engine and a real MongoDB transaction, plus stale view, wrong stage, cross-run code, retry replay and reload rebuild |
| `sceneAffordance.test.js` | 164 (from 147) |
| `learnerAction.test.js` | 10 — the map now holds 1,605 scene controls (517 WhatsApp + 520 Instagram + 472 Email + 96 SMS) plus 37 generic |
| Lint (`oxlint`), build (`vite build`), `npm run check:bundle` | clean / built / **passed: 3 files, no canonical vocabulary** |
| Known AssessmentTimer load flake | Appeared once in a full-suite run ("does not restart when the component remounts") and passed **18 / 18 on isolated re-run**. Timer logic was not touched. |

### Browser validation (20 September 2026)

Driven through the real UI against the **production build** on `localhost:5199`, an isolated API on
`localhost:5055` and an isolated database. Selection is server-authoritative, so target scenes were
reached by ordinary play and non-target runs were walked to resolution through the same public
endpoints.

| Check | Result |
| --- | --- |
| **S04 hand-played safe** (Transactions tab → the two genuine notices → details with both registrations → leave it and check the portal → search both → report as junk) | **10 / 10** |
| **S05 hand-played unsafe** (details showing the number under the display name → payment sheet → read the mandate rows → type a UPI PIN → Approve → courier app → report) | **0 / 10** |
| **S02 hand-played safe at 320 px** (details → the missing consumer number → tap the number → dial dialog → connect → the operator's two asks → End the call → the supplier on the bill's number → report) | **10 / 10** |
| All nineteen S01–S05 safe and unsafe routes through the real public HTTP API | every safe path **10/10**; every `−8` route **0/10**; S03's block route **5/10** and its false-positive route **0/10**; every pinned score matched exactly |
| Eleven refusal cases over HTTP | forbidden `intent` and `points_delta` → 422 `FORBIDDEN_FIELD`; malformed and tampered codes → 422 `INVALID_ACTION` with one neutral message; duplicate replay → same sequence, `duplicate:true`; earlier-stage control → 409 `STALE_STATE` with `current_stage`; mismatched `expected_stage` → 422; another run's code → 422 |
| Reload mid-scene, standing on the pushed call surface | Resumed at the same run and stage behind a **Resume** banner; the thread rebuilt from the committed stage; the call surface correctly **not** restored; the branch still unspent; no replay |
| Mobile 375 px and 320 px (~200 % of 640) | **No horizontal page overflow on any reachable screen** — the message list and all three category tabs, the thread with its spam bar and link/number cards, conversation details and its history page, link details, the dial dialog, the call, the banking / utility / transport / courier / pay-record apps, the mandate sheet, the browser pages and the resolve banner |
| Accessibility spot check | every visible control has an accessible name; no target under 24 px; the safe branch control is focusable and tab-reachable (activation confirmed by pointer) |

### Security validation (SECURITY-001 intact)

| Surface | Result |
| --- | --- |
| DOM | No canonical intent, event code, `data-intent` or `data-affordance`. The only data attributes are `data-testid`, `data-beat` and `data-control`; SMS test ids are `sms-list`, `sms-rows`, `sms-thread`, `sms-header`, `sms-spam-bar`, `sms-link-card`, `sms-number-card`, `sms-amount-card`, `sms-attachment-card`, `sms-composer`, `sms-drafts`, `sms-menu`, `sms-checks`, `sms-link-details`, `sms-bar` — none names an answer |
| React props | A walk of the live fiber tree (315 nodes) found no `intent`, `source`, `verifySource` or `eventCode` prop; control objects carry only `anchor, closes, echo, hint, id, label, on, opens, page, slot, targetId, thenPage` |
| Requests | The accepted `−8` on S05's mandate sheet sent exactly `{action_code, intent_key, expected_stage, synthetic_target_id, client_ts, elapsed_ms}` |
| Responses | No `event_code` |
| `localStorage` / `sessionStorage` / cookies | Empty throughout; no JS-readable cookie |
| Globals | None added |
| Production bundle | `npm run check:bundle` passed: 3 files, no canonical vocabulary |

### Form and data containment

S02 and S03 have **no field on any screen**. The three that do were exercised with real typing in the
live UI and in the page suite: S01's account number, ATM PIN and one-time code; S04's registration,
payment handle and code; S05's name, address, phone and UPI PIN. On the accepted `−8` the request body
carried **no** typed value, and a search of **every collection of the isolated database** for the typed
UPI PIN returned **zero** occurrences. Event metadata held only allowlisted keys. Every PIN field is
`FIELD_KIND.SECRET` — masked by CSS (`-webkit-text-security: disc`), never `type="password"` — with
`autoComplete="off"` and the neutral names `f0` / `f1` / `f2`, so no browser or password manager
recognises or offers to save it.

### Offline validation

Every resource across the validated browser sessions came from `localhost:5199` or `localhost:5055` —
no external URL, API, CDN or service. The `.training.example` addresses are **drawn text**: the
rendered page contains no anchor, image, iframe, form or media element at all, so none of them can
produce a request. No dialer, camera, microphone or clipboard is touched: the dial dialog is a drawn
dialog and a "call" is a caption list with a timer.

### Production, before and after

`cyber_awareness_training` was never written to and is byte-identical across **both** phases of this
session — counts and the latest `_id` in every collection match the snapshot taken before Email E21
began: attempts 10, candidates 9, scenarioruns 100, scenarioevents 209 (same latest `_id`
`6aa28eea…7711`), scenariodefinitions 100, scenarios 40, assessments 1, progresssnapshots 6,
auditevents / adminusers / configurations 0. The client bank fingerprint is `8e7a6c98…038a7687` and the
synthetic fingerprint `2779b039…09afde1`, unchanged since DATA-002; all bank, synthetic and taxonomy
files reproduce their hashes and `git status backend/data/` shows only this layer's own two
learner-action files.

### Known limitations

- **SMS S06–S25 remain on the generic path** (20 of the 100 scenarios are still unauthored).
- One scored decision per stage (shared platform limitation): S02's install vs pay, and S05's address
  vs mandate, are alternatives at the branch stage, not a sequence. Each was exercised, but in
  different plays.
- S02's dial dialog and the connected call are local navigation, so a learner reaches the operator
  without spending the branch. That is deliberate — see the deviation below — but it does mean the
  act of dialling an unknown number is not itself priced in this scene.
- Consequence banners belong to the current session; a reload after a release shows the thread without
  them (carried from earlier batches).
- Result and review cards show the bank's stored sender for the item (carried from earlier batches).
- Reaching a chosen scenario in the browser needs many attempts, because selection is
  server-authoritative by design. The isolated database's SMS pool was narrowed so every attempt drew
  from S01–S05; the selection solver, the engine and all scoring ran unchanged, and the narrowing
  existed only in a throwaway database that has since been dropped.

### Deviations from the instructions

- **S02's scored decisions are the operator's asks, not the call.** The client's stage-4 text is "a
  call-confirmation sheet **leading to** a synthetic operator asking for remote access/payment", and
  the engine takes one branch decision per stage. Tapping the number and connecting are therefore
  navigation, and installing, paying or ending the call are the three decisions. This is also what
  separates S02 from E17, where calling itself is the scored act; the stage-4 scoring text is
  unchanged.
- **One new surface kind and one new component family** were added (`SURFACE.SMS`, `SmsScene`,
  `SmsBubbles`, `SmsSurface`). The brief asked for an SMS that feels like a real messaging app and
  explicitly not like WhatsApp; that could not be met by reusing the messenger's components. No
  existing renderer changed and no earlier scene's rendering is affected.
- S03 has no ATT&CK mapping and none was invented; the registered-sender-ID and recurring-mandate gaps
  are stated rather than forced. A reply submits the engine's existing `reply` intent rather than a new
  one.

### Next task

**SMS S06–S10**, on this same layer and contract, toward the final 100 immersive scenarios. Production
migration remains **DEFERRED** until all 100 exist and the comprehensive audit, offline, scoring,
accessibility, security and content validations are complete.

**IMMERSIVE-010 COMPLETE. SMS S01–S05 complete. WhatsApp W01–W25, Instagram I01–I25 and Email E01–E25
unchanged. SMS S06–S25 untouched. No production mutation. No scoring semantics changed. The immersive
layer now covers 80 / 100.**

## 16.33 IMMERSIVE-011 — SMS S06–S10, the second SMS batch (COMPLETED 20 September 2026)

**IMMERSIVE-011 — SMS S06–S10 COMPLETE. The immersive layer now covers 85 of the 100 scenarios.**

Five SMS scenarios authored on the existing scene interaction layer, the existing SMS app and the
neutral learner action contract. **Nothing in `ScenarioDefinition`, the scoring constants, the
engine's scoring semantics, selection, the timer, the attempt lifecycle, result/review or
`ProgressSnapshot` changed**, the authoritative 100-scenario bank was not touched, and production was
not migrated. WhatsApp 25/25, Instagram 25/25, Email 25/25, **SMS 10/25**; S11–S25 remain on the
generic path.

Unlike IMMERSIVE-010 this batch added **no new surface kind and no new component**. The one new piece
of vocabulary is an anchor: `anchor: 'spam'` puts a scored control in the Messages app's own
unsaved-sender bar — a strip `SmsScene` already drew and no scene had used for a decision.

### The five scenes

| Scene | Disposition | What it teaches that the first eighty did not |
| --- | --- | --- |
| **S06 Service-Number Confirmation** (easy, **military**) | malicious | **A records system already holds what it is asking you for.** No address, no attachment inbound, nothing to install: the only attack surface is the reply field, and the only second one is the phone's photo picker underneath it. Two ready-made releases — an identity chip and a photograph of the card — and the whole exercise is whether the learner presses one. The unit writes from `VM-FALCON`, and its four real messages all point at the portal and ask nothing. |
| **S07 Expected Recharge Confirmation** (easy) | **legitimate** | **The receipt is fine; what you do next is the risk.** Deliberately not S03. The learner recharged their own number fifteen seconds earlier, and the priced moves are **deleting the receipt** (losing proof of a payment), replying to a sender ID that cannot receive replies, and — the one that actually happens — **searching for a care number and ringing the first result**, which on this phone is two paid aggregator listings printing the same unrelated number. |
| **S08 Lottery Claim Text** (easy) | malicious | **A message sent to a list is not a message to you, and a handset can prove it.** The identical text reached both SIM cards in the same second, and four more of the same sentence are already in the phone's spam folder from four different numbers. The safe branch is taken from the app's own unsaved-sender bar; the claim site puts identity on one page and the 499 on the next, each linked from the other. |
| **S09 Wrong Number Becomes an Investment Pitch** (medium) | malicious | **The rapport was the product, and the learner helped build it.** The first scene whose evidence is the learner's **own replies** — three blue bubbles across six days, counted and attributed on a "six days, in order" page. The desk's trial balance is drawn text; its Deposit link raises the phone's own payment sheet, which pays a named individual, not the platform. |
| **S10 eSIM Upgrade OTP** (medium) | malicious | **The code is not a login — it is the number itself.** The warning is already on the phone: `VM-NOVCEL` sent the code two minutes later saying DO NOT SHARE, naming the eSIM transfer it authorises and offering a way to stop it. Both releases — reading the code out, and replying YES — are taken on that carrier conversation, the only branch controls in the product on an `SMS`-kind surface. Ringing the number is the cheaper mistake, taken on the phone's own dial dialog. |

### Taxonomy (the bank's own, normalised by the existing taxonomies — nothing invented)

| Scene | Canonical family | Canonical triggers | Disposition | Difficulty | Military |
| --- | --- | --- | --- | --- | --- |
| S06 | `identity_data_harvesting` | `authority` | malicious | easy | **true** |
| S07 | `legit_system_confirmation` | `routine` | legitimate | easy | false |
| S08 | `unsolicited_payment_lure` | `greed` + `scarcity` | malicious | easy | false |
| S09 | `relationship_grooming_fraud` | `curiosity` + `trust` | malicious | medium | false |
| S10 | `account_takeover_authorisation_abuse` | `authority` + `convenience` | malicious | medium | false |

Four families and four trigger combinations that no other SMS scene uses;
`identity_data_harvesting`, `unsolicited_payment_lure`, `relationship_grooming_fraud` and
`account_takeover_authorisation_abuse` are all first appearances on this platform.

**Military safety (S06).** Unit Falcon, its records cell, its orderly room, its `VM-FALCON` sender ID
and its Unit Portal are invented; the service number and date of birth on the composer chip identify
nobody. `sceneModel.test.js` asserts the scene names no rank, formation, posting, deployment or other
operational term at all, and that it never prints its own canonical trigger word.

### MITRE ATT&CK (v19.2, re-confirmed current on the live versions page 20 September 2026; full justifications in `docs/SMS_S06_S10_REAL_WORLD_RESEARCH.md`)

| Scene | Primary | Supporting / partial (stated as such) |
| --- | --- | --- |
| S06 | `T1598` Phishing for Information (**direct** — the reply *is* the payload) | `T1589` Gather Victim Identity Information; `T1684.001` Impersonation; `T1660` Phishing (Mobile) (**partial** — no malicious content is sent). **Rejected:** `T1636.004`, `T1566.002`. **Gap stated:** no technique for the carrier-level registered sender ID. |
| S07 | **None, and none invented** — a genuine receipt for a recharge the learner made themselves. Nearest defensible references are NIST's Phish Scale guidance and FTC material on paid "customer care" listings. | — |
| S08 | `T1660` Phishing (Mobile); `T1657` Financial Theft | `T1684.001` Impersonation; `T1583.001` Acquire Domains; `T1417.002` GUI Input Capture (**partial** — nothing real is being mimicked). **Rejected:** `T1598`, `T1566.002`. **Gap stated:** no technique for the bulk delivery pattern a dual-SIM handset exposes. |
| S09 | `T1657` Financial Theft (**direct** — the technique names "pig butchering" outright) | `T1660` Phishing (Mobile); `T1585` Establish Accounts (**partial** — a phone number and a story, not an account). **Rejected:** `T1684.001` (the persona impersonates nobody), `T1598`, `T1583.001`. **Gap stated:** no technique for long-game relationship grooming. |
| S10 | `T1451` SIM Card Swap (**direct**); `T1660` Phishing (Mobile) | `T1684.001` Impersonation; `T1598.004` Spearphishing Voice (**partial** — the learner places the call). **Rejected:** `T1111`, `T1636.004`. **Gap stated:** the sender-ID gap again, and approve-by-reply. |

### Files

**Created:** `frontend/src/simulation/scenes/sms/{s06,s07,s08,s09,s10}.js`,
`frontend/src/pages/SceneScenariosSmsB.test.jsx`, `backend/tests/smsS06S10Engine.test.js`,
`docs/SMS_S06_S10_REAL_WORLD_RESEARCH.md`.
**Modified:** `frontend/src/simulation/sceneRegistry.js`,
`frontend/src/simulation/sceneModel.test.js` (the S06–S10 block, the `spam` anchor exemption, the
page-level reachability walk), `frontend/src/simulation/sceneResearch.test.js`,
`backend/data/learner-actions/v1/sms.json` (96 → **194** controls),
`backend/tests/{sceneAffordance,learnerAction}.test.js`, and the three documents updated by this
section.
**Not modified:** every scene component and surface renderer, `sceneModel.js`, the bank
(`backend/data/scenarios/v1/**`, `synthetic/v1/**`, `taxonomy/**`), all backend **source**, the engine,
the scoring constants, selection, the timer, the attempt lifecycle, result/review and
`ProgressSnapshot`.

### Tests

| Suite | Result |
| --- | --- |
| Frontend, full (`npx vitest run`) | **3340 / 3340 pass**, 38 files, no flake |
| `sceneModel.test.js` | 1825 (from 1808) — the S06–S10 distinctness block and the page-level reachability walk |
| `sceneResearch.test.js` | 209 (from 208) |
| `SceneScenariosSmsB.test.jsx` (new) | 52 |
| `SceneContainment.test.jsx` | 341 — picked the five scenes up automatically |
| Backend without a database (`npm test`) | **625 pass / 0 fail**, 359 skipped (the DB suites) |
| Backend DB suites, each in its own isolated replica-set database | 17 suites, **359 / 359 pass** — including `smsS06S10Engine.test.js` (new) **7 / 7**, `smsS01S05Engine` 6/6, `emailE16E20Engine` 6/6, `emailE21E25Engine` 6/6 |
| `sceneAffordance.test.js` | 160 (from 154): S06–S10 legality, the ten-point safe paths, the pinned event/point pairs and the review walks |
| `learnerAction.test.js` | 10 — the map now holds **1,703** scene controls (517 WhatsApp + 520 Instagram + 472 Email + 194 SMS) plus 37 generic |
| Lint (`oxlint`), build (`vite build`), `npm run check:bundle` | clean / built / **passed: 3 files, no canonical vocabulary** |
| Known AssessmentTimer load flake | **Did not appear** in this session's full-suite runs. Timer logic was not touched. |

`smsS06S10Engine.test.js` plays twenty-two routes — every safe route, every `−8`, every `−3`, S07's
`−2` and its false-positive route — through the real engine over a real MongoDB transaction, and adds
a ledger scan proving no typed value and no action code is ever stored.

### Browser validation (20 September 2026)

Driven through the real UI against the **production build** on `localhost:4173`, an isolated API on
`localhost:5055` and the isolated database `cyber_awareness_imm011_sms`.

| Check | Result |
| --- | --- |
| **All ten routes hand-played through the UI** — a safe and an unsafe play of each of S06, S07, S08, S09, S10 | five safe runs **10 / 10**, five unsafe runs **0 / 10**, each read back from MongoDB with the pinned event codes and point deltas |
| Reachability, hand-checked with the branch unspent | S06's photo picker (both its controls), S08's fee page reached by an ordinary in-page link, S09's deposit sheet from both the menu and the desk's own link, S10's carrier thread with **both** `−8` controls on it, S10's dial dialog. No release sits behind another. |
| Reload standing on a pushed browser surface | Resumed at the same run and stage behind the interruption banner; the thread rebuilt from the committed stage; the pushed surface correctly **not** restored; three events before and after, nothing replayed |
| Refusals against the live API | wrong stage in both directions → 409 `STALE_STATE`; cross-run code, tampered code and mismatched `expected_stage` → 422 `INVALID_ACTION` with one neutral message; a body carrying `intent` and a body smuggling a typed PIN through `metadata` → 422 `FORBIDDEN_FIELD`; duplicate `intent_key` → same sequence, `duplicate: true`, scored once; stale branch control after the move → 409 |
| Mobile 375 px and 320 px (~200 % of 640) | `scrollWidth === clientWidth` at both; **no element overflowing the viewport**; the message list and its category tabs, the thread with the spam bar and link/number/amount cards, conversation details, the carrier thread, the spam folder, the photo picker, the browser pages, the payment sheet, the dial dialog, the calls and the apps all render |
| Accessibility / keyboard | Every visible control has an accessible name; smallest target 40 px; nothing removed from the tab order; Tab reaches the scene controls with a visible solid focus outline |

### Security validation (SECURITY-001 intact)

| Surface | Result |
| --- | --- |
| DOM | Live scan of the production build for all 46 canonical tokens: **zero**. The only data attributes anywhere are `data-testid`, `data-beat` and `data-control` |
| React props | A walk of the live fiber tree (**400** nodes) found no `intent`, `source`, `verifySource`, `eventCode` or points prop; affordance objects carry only `anchor, closes, echo, hint, id, label, on, opens, page, slot, targetId, thenPage` |
| Requests | Every committed action sent exactly `{action_code, intent_key, expected_stage, synthetic_target_id, client_ts, elapsed_ms}` — captured at the wire for S06's identity chip, S08's release fee and S09's deposit |
| Responses | No `event_code`, no `intent` |
| `localStorage` / `sessionStorage` / cookies / globals | Empty; no JS-readable cookie; no global added |
| Production bundle | `npm run check:bundle` passed: 3 files, no canonical vocabulary |

### Form and data containment

S06, S07 and S10 have **no field on any screen** — S06 in particular demonstrates a data release
without collecting a sensitive value at all, because the identity line is an authored chip the learner
presses rather than a form they fill. S08's claim site takes a name, an ID number, a bank account
number, a payment handle and a code; S09's payment sheet takes a UPI PIN. All were typed for real in
the live UI. On every accepted release the request body carried **no** typed value, and a search of
**every collection** of the isolated database for all nine typed strings returned **zero** occurrences;
the ledger holds no action code and no scene control id either. A request that tried to carry a typed
PIN in `metadata` was refused by the allowlist.

### Offline validation

Every one of the 150+ requests across the validated session went to `localhost:4173` or
`localhost:5055`. No external URL, API, CDN or service; no `.training.example` request of any kind —
those addresses are drawn text, and the rendered page contains no anchor, image, iframe, form or media
element, so none of them *can* produce a request. No dialer, camera, microphone or clipboard is
touched.

### Production, before and after

`cyber_awareness_training` was never written to and is **byte-identical** to the baseline recorded
before this task: attempts 10, candidates 9, scenarioruns 100, scenarioevents 209,
scenariodefinitions 100, scenarios 40, assessments 1, progresssnapshots 6, auditevents / adminusers /
configurations 0. The client bank fingerprint is `8e7a6c98…038a7687` and the synthetic fingerprint
`2779b039…09afde1`; all eight bank, synthetic and taxonomy files reproduce their SHA-256 hashes
exactly, verified by `diff` of a before/after manifest.

### Known limitations

- **SMS S11–S25 remain on the generic path** (15 of the 100 scenarios are still unauthored).
- One scored decision per stage (shared platform limitation): S06's identity chip vs the photograph,
  S08's winner details vs the release fee, S09's account details vs the deposit and S10's code vs the
  approval are alternatives at the branch stage, not sequences. Each was exercised, in different plays.
- S09's link to the desk and S10's dial dialog are local navigation, so opening the trading site is
  not itself priced in S09. S10 does price the call (`−3`), which is why its releases had to be moved
  off the call and onto the carrier's own thread.
- `S07` shares the `legit_system_confirmation` family with S03 and `S06`'s mechanism overlaps E19's;
  both overlaps are recorded in the research document with the distinctions that separate them.
- Consequence banners belong to the current session; a reload after a release shows the thread without
  them (carried from earlier batches).
- Result and review cards show the bank's stored sender for the item (carried from earlier batches).
- Reaching a chosen scenario in the browser needs help, because selection is server-authoritative by
  design. A throwaway script rewrote one isolated attempt's runs to S06–S10; the selection solver, the
  engine and all scoring ran unchanged, the `Attempt` model's own sequence freeze was demonstrated to
  work (the script had to go round it with a raw write), and the database has since been dropped.

### Deviations from the instructions

- **S10's call is the `−3` and the two releases are not behind it.** The client's stage-4 text says
  "do not call the supplied number **or** share the OTP", and the engine takes one branch decision per
  stage — so a release reachable only *on the call* would sit behind another scored control, which is
  exactly the defect IMMERSIVE-009 found by hand-play. Both releases were therefore put in the
  carrier's own conversation, reached by local navigation, and the call remains the consequence of the
  `−3`. This is the deliberate inverse of S02.
- **Page-level reachability is now asserted, not just surface-level.** The guard in `sceneModel.test.js`
  was widened this batch to walk page links, in-page list rows and each page's own local Continue.
- **One new anchor** (`anchor: 'spam'`) was added to the scene vocabulary's accepted list, and
  `sceneModel.test.js` extended to accept it exactly as it accepts `header`, `cta` and `audio`. No
  renderer changed.
- S07 has no ATT&CK mapping and none was invented; three gaps (carrier sender identity, bulk delivery,
  long-game grooming) are stated rather than forced. A reply submits the engine's existing `reply`
  intent rather than a new one.

### Next task

**SMS S11–S15**, on this same layer and contract, toward the final 100 immersive scenarios. Production
migration remains **DEFERRED** until all 100 exist and the comprehensive audit, offline, scoring,
accessibility, security and content validations are complete.

**IMMERSIVE-011 COMPLETE. SMS S06–S10 complete. WhatsApp W01–W25, Instagram I01–I25, Email E01–E25 and
SMS S01–S05 unchanged. SMS S11–S25 untouched. No production mutation. No scoring semantics changed.
The immersive layer now covers 85 / 100.**

## 16.34 IMMERSIVE-012 — SMS S11–S15, the third SMS batch (COMPLETED 21 September 2026)

**IMMERSIVE-012 — SMS S11–S15 COMPLETE. The immersive layer now covers 90 of the 100 scenarios.**

Five SMS scenarios authored on the existing scene interaction layer, the existing SMS app and the
neutral learner action contract. **Nothing in `ScenarioDefinition`, the scoring constants, the
engine's scoring semantics, selection, the timer, the attempt lifecycle, result/review or
`ProgressSnapshot` changed**, the authoritative 100-scenario bank was not touched, and production was
not migrated. WhatsApp 25/25, Instagram 25/25, Email 25/25, **SMS 15/25**; S16–S25 remain on the
generic path.

This batch added **no new surface kind, component, anchor, intent or renderer change**. Every screen is
built from vocabulary the SMS app and the shared surfaces already had.

### The five scenes

| Scene | Disposition | What it teaches that the first eighty-five did not |
| --- | --- | --- |
| **S11 Expected Clinic Reminder** (medium) | **legitimate** | **The right answer is a reply.** The first SMS scene whose `+3` is an ordinary text: "Reply 1 to confirm" from the composer's quick replies, on a reminder line the learner saved from their own booking page, under the confirmation with the same reference and slot. The priced mistake is the same reply with symptoms, a date of birth and a member number added (`−4`); deleting and blocking the line is the needless rejection (`−2`). |
| **S12 Income-Tax Refund Form** (medium) | malicious | **A registered header is not a government one.** The inverse of S01: the sender *is* a registered sender ID, `AX-ITRFND`, but in the **Promotional** category, so the phone filed it under Offers beside a pizza deal — and the department's own Government header, one tab away, already said "no refund is due". The scored open sits on the phone's own link-details screen; the refund site's two pages (account; card and code) link to each other. |
| **S13 Rating-Task Recruiter** (medium) | malicious | **A company does not change its number every day.** One signature, three mobile numbers in four days, one already in Spam — evidence only a Messages app keeps. The app's suggested one-tap "YES" is the `−3`; the safe branch is taken on the details screen that lists the three numbers; the task site's pre-ticked onboarding checklist leads to a payout-account harvest and a "refundable" deposit to an individual. Deliberately none of W17's evidence. |
| **S14 Emergency Recall Location Link** (medium, **military**) | malicious | **The unit has recalled you before, and it did not look like this.** The genuine August recall exercise (`VM-FALCON`, reference `RC-0812`, acknowledge in the portal, no link) sits in the Service tab beside today's unsaved mobile with a public address. The location release is the **browser's own site-permission prompt**; the form asks service number, position, route and arrival time. Verification is the official recall channel (the Unit Portal's Alerts) and the duty office; the resolve rationale box is used. |
| **S15 Canteen Subsidy MMS QR** (medium, **military**) | malicious | **Being on a list with colleagues is not being written to by the canteen.** A group MMS lists twelve people — two saved colleagues and eight **consecutive** numbers. The picture viewer reads the code and names its host before opening; opening it is `−3`, a reply that reaches all twelve is `−3`, and the canteen card PIN is the `−8`. Deliberately none of I25's reel, audio credit or activation fee. |

### Taxonomy (the bank's own, normalised by the existing taxonomies — nothing invented)

| Scene | Canonical family | Canonical triggers | Disposition | Difficulty | Military |
| --- | --- | --- | --- | --- | --- |
| S11 | `legit_system_confirmation` | `routine` + `empathy` | legitimate | medium | false |
| S12 | `financial_credential_phishing` | `greed` + `authority` | malicious | medium | false |
| S13 | `investment_and_task_fraud` | `greed` + `commitment` | malicious | medium | false |
| S14 | `operational_elicitation` | `authority` + `urgency` | malicious | medium | **true** |
| S15 | `qr_code_phishing` | `familiarity` + `scarcity` | malicious | medium | **true** |

All five trigger combinations are new on SMS; `investment_and_task_fraud`, `operational_elicitation`
and `qr_code_phishing` are first appearances on this platform. Recorded overlaps (family/subject, with
distinct evidence, branch shape and decision home): S12↔E08, S13↔W17, S14↔W19/S06, S15↔I25,
S11↔S03/S07/W11.

**Military safety (S14, S15).** Unit Falcon, its duty office, Unit Portal and Alerts page, exercise
`RC-0812`, the canteen, `VM-FALCON` and `VM-FALCNT` are invented; no real unit, rank, formation,
recall procedure, schedule or capability appears. `sceneModel.test.js` asserts neither scene names a
rank or operational term, nor prints its trigger words.

### MITRE ATT&CK (v19.2, re-confirmed current on the live versions page 21 September 2026; full justifications in `docs/SMS_S11_S15_REAL_WORLD_RESEARCH.md`)

| Scene | Primary | Supporting / partial (stated as such) |
| --- | --- | --- |
| S11 | **None, and none invented** — a genuine reminder for a booking the learner made. | — |
| S12 | `T1660` Phishing (Mobile) (**direct** — the page names smishing) | `T1598.003`, `T1684.001`, `T1657`, `T1583.001`; `T1585` (**partial**). **Rejected:** `T1417.002` (needs a malicious app's overlay), `T1566.002`. **Gap:** sender-ID category. |
| S13 | `T1657` Financial Theft (**direct**) | `T1660`, `T1684.001`; `T1585` (**partial** — numbers, not accounts). **Rejected:** `T1598`, `T1566.002`. **Gap:** number rotation; payout-account (mule) recruitment. |
| S14 | `T1598` Phishing for Information (**direct**) | `T1598.003`, `T1660`, `T1589`, `T1684.001`; `T1591.001` (**partial**). **Rejected:** `T1430` (requires an app on the device), `T1636.004`. **Gap:** browser site-permission geolocation. |
| S15 | `T1660` Phishing (Mobile) (**direct** — the page names quishing) | `T1684.001`, `T1657`; `T1598.003` (**partial**). **Rejected:** `T1417.002`, `T1566.002`. **Gap:** list delivery exposed by a group MMS. |

### Files

**Created:** `frontend/src/simulation/scenes/sms/{s11,s12,s13,s14,s15}.js`,
`frontend/src/pages/SceneScenariosSmsC.test.jsx`, `backend/tests/smsS11S15Engine.test.js`,
`docs/SMS_S11_S15_REAL_WORLD_RESEARCH.md`.
**Modified:** `frontend/src/simulation/sceneRegistry.js`, `frontend/src/simulation/sceneModel.test.js`
(registry counts and the S11–S15 block, with the reachability walk as a reusable function),
`frontend/src/simulation/sceneResearch.test.js`, `backend/data/learner-actions/v1/sms.json`
(194 → **289** controls), `backend/tests/{sceneAffordance,learnerAction}.test.js`, and the three
documents updated by this section.
**Not modified:** every component and surface renderer, `sceneModel.js`, all backend **source**, the
bank (`backend/data/scenarios/v1/**`, `synthetic/v1/**`, `taxonomy/**`), the engine, the scoring
constants, selection, the timer, the attempt lifecycle, result/review and `ProgressSnapshot`.

### Tests

| Suite | Result |
| --- | --- |
| Frontend, full (`npx vitest run`) | **3530 / 3530 pass**, 39 files, no flake |
| `sceneModel.test.js` | 1933 — the S11–S15 distinctness, reachability, taxonomy-word, military and field blocks |
| `sceneResearch.test.js` | 221 (from 209) |
| `SceneScenariosSmsC.test.jsx` (new) | 50 |
| `SceneContainment.test.jsx` | 361 (from 341) — picked the five scenes up automatically |
| Backend without a database (`npm test`) | **632 pass / 0 fail**, 366 skipped (the DB suites) |
| Backend DB suites, each in its own isolated replica-set database | 18 suites, **366 / 366 pass** — including `smsS11S15Engine.test.js` (new) **7 / 7** |
| `sceneAffordance.test.js` | 167: S11–S15 legality, 42 pinned event/point pairs, ten 10-point safe paths, fifteen unsafe walks with their review cards |
| `learnerAction.test.js` | 10 — the map now holds **1,798** scene controls (517 WhatsApp + 520 Instagram + 472 Email + 289 SMS) plus 37 generic |
| Lint (`oxlint`), build (`vite build`), `npm run check:bundle` | clean / built / **passed: 3 files, no canonical vocabulary** |
| Known AssessmentTimer load flake | **Did not appear.** Timer logic was not touched. |

`smsS11S15Engine.test.js` plays twenty-one routes through the real engine over a real MongoDB
transaction (every safe route, every `−8`, every `−3`, S11's `−4`/`−2` and its false-positive route),
plus stale view, wrong stage, cross-run code, retry replay and reload rebuild.

### Browser validation (21 September 2026)

Driven through the real UI against the **production build** on `localhost:4173`, an isolated API on
`localhost:5055` and the isolated database `cyber_awareness_imm012_sms`. A throwaway script (isolated
DB only, refusing the production name, and only on an attempt with no activity) retargeted the first
five runs of two freshly created attempts to S11–S15; selection, the engine and scoring ran unchanged.

| Check | Result |
| --- | --- |
| **All ten routes hand-played through the UI** — a safe and an unsafe play of each of S11–S15 | five safe runs **10 / 10**; S11 overshare **3**; S12 card-and-code, S13 deposit, S14 Allow and S15 card PIN **0** — each read back from MongoDB with the pinned event codes |
| Reachability, hand-checked with the branch unspent | S12's link details → refund site → card page; S13's task site → deposit sheet; S14's recall page → the browser's location prompt; S15's menu → subsidy site → card page. No release sits behind another scored control. |
| Reload standing on S14's pushed location prompt | Resumed at the same run and stage behind the interruption banner; the prompt correctly **not** restored; three events before and after, nothing replayed |
| Refusals against the live API (on S15's live run) | tampered and canonical-string codes, stage mismatch and another run's code → 422 `INVALID_ACTION`; `intent`, `points_delta` and a PIN smuggled in `metadata` → 422 `FORBIDDEN_FIELD`; verify/resolve/open-stage controls at branch → 409 `STALE_STATE`; replay of the accepted branch body → same sequence, `duplicate: true`; a different release after the move → 409. The run never moved. |
| Mobile 375 px and 320 px (~200 % of 640) | `scrollWidth === clientWidth` at both; **zero elements** overflowing the viewport on S13's site and sheet, S14's details, recall page and prompt, S15's group details and people list |
| Accessibility / keyboard | Every visible control named; visible solid focus outline on `:focus-visible`; Tab moves focus. Live Enter/Space activation could **not** be confirmed through the browser pane's key injection (it did not activate even the pre-existing notification control, while pointer and Tab worked); keyboard activation is covered by the jsdom page suites. |

### Security validation (SECURITY-001 intact)

| Surface | Result |
| --- | --- |
| DOM | Live scan for 46 canonical tokens: **zero**; data attributes only `data-testid`, `data-beat`, `data-control`; no `href`, image, iframe, form or media element |
| React props | Live fiber walk (**395** nodes): no `intent`, `source`, `verifySource`, `eventCode` or points prop; affordance keys only `anchor, closes, echo, hint, id, label, on, opens, page, slot, targetId, thenPage` |
| Requests | Every committed action sent `{action_code, intent_key, expected_stage, synthetic_target_id, client_ts, elapsed_ms}` (plus timing-only `metadata` on the first three stages); `/current-run` maps neutral ids to opaque codes |
| Responses | No `event_code`, no `intent` |
| `localStorage` / `sessionStorage` / cookies / globals | Empty; no JS-readable cookie; no global added |
| Production bundle | `npm run check:bundle` passed |

### Form and data containment

S11 has **no field** (its overshare is an authored chip). S12 (name, tax ID, account; card, expiry,
code), S13 (name, account, handle; UPI PIN), S14 (service number, position, route, arrival time) and
S15 (card number, PIN) were typed for real where exercised. On every accepted release the request body
carried **no** typed value, and a search of **every collection** of the isolated database for all
typed strings returned **zero**. Fields use neutral names (`f0`…), `autoComplete="off"`, and PINs/codes
are CSS-masked `FIELD_KIND.SECRET`, never `type="password"`. The real browser geolocation permission
stayed `denied` after S14's simulated Allow.

### Offline validation

All 205 requests of the session went to `localhost:4173` or `localhost:5055`. No `.training.example`
request of any kind; no dialer, camera, microphone, clipboard or geolocation touched.

### Production, before and after

`cyber_awareness_training` was never written to: counts and the latest `_id` of every collection are
identical before and after — attempts 10, candidates 9, scenarioruns 100, scenarioevents 209,
scenariodefinitions 100, scenarios 40, assessments 1, progresssnapshots 6, auditevents / adminusers /
configurations 0. All bank, synthetic, taxonomy and legacy scenario files reproduce their SHA-256
hashes; the only changed data file is `learner-actions/v1/sms.json`.

### Known limitations

- **SMS S16–S25 remain on the generic path** (10 of the 100 scenarios are still unauthored).
- One scored decision per stage (shared platform limitation): each scene's two or three priced
  releases are alternatives at the branch, exercised in different plays.
- S12's and S14's pages are also reachable by local navigation, so opening them is priced only on
  the scored "Open the address" control (the S08 pattern, required by the reachability rule).
- S14's permission prompt has no separate "Block" button; the prompt's Back closes it.
- The resolve rationale text is stored by the existing, client-specified rationale feature.
- Consequence banners are session-only; result cards show the bank's stored sender (carried).

### Deviations from the instructions

- **S15's card page was first reachable only through the scored `−3`.** Caught while writing the
  research record, before any test ran, and fixed with a local menu route; the reachability guard was
  shown to fail without it.
- **S15's group title** was shortened to `+91 00000 46373 +11` after browser play showed the app's
  letter-based avatar reading "AN" from "and 11 others"; the scene's data changed, no shared component.
- **S11's safe act is a reply**, submitted as the existing `safe_pivot` (the engine resolves `reply` to
  `UNSAFE_EXTERNAL_ACTION` on a legitimate item); the overshare is `submit_data`. No new intent.
- **S14 does not use header spoofing into the genuine thread**, which is the bank's S18.

### Next task

**SMS S16–S20**, on this same layer and contract. Production migration remains **DEFERRED**.

**IMMERSIVE-012 COMPLETE. SMS S11–S15 complete. WhatsApp W01–W25, Instagram I01–I25, Email E01–E25 and
SMS S01–S10 unchanged. SMS S16–S25 untouched. No production mutation. No scoring semantics changed.
The immersive layer now covers 90 / 100.**

---

## 16.35 DOC-001 — Client Technical Architecture & Workflow Document (COMPLETED 21 September 2026)

**Documentation only. No application code, scenario content, scoring, database or production data changed. SMS S16–S20 not started.**

| Item | Value |
|---|---|
| File | `PROJECT_TECHNICAL_ARCHITECTURE_AND_WORKFLOW.docx` (project root) |
| Title | Cyber Awareness Social Engineering Training Platform — Technical Architecture & Application Workflow, v1.0 |
| Date | 21 September 2026 |
| Purpose | Client-facing technical handover: stack, layered architecture, frontend/backend/database, scenario content vs execution, immersive scenes, six-stage workflow, neutral learner-action processing, scoring, assessment lifecycle and recovery, selection, data flows, security, administration, reporting, testing, central-server deployment, production data migration, maintainability, end-to-end workflow, current-vs-target table, glossary |
| Size | 24 numbered sections, 37 pages (A4), 24 diagrams, 41 tables, populated table of contents |
| Basis | Reflects the current code architecture as inspected on 21 September 2026 (immersive coverage 90/100) |

The platform is described as a web client/server application (React frontend, Node.js/Express API, MongoDB). Production deployment components (reverse proxy, HTTPS, process manager, firewall, database authentication/network isolation, backups, monitoring) are **not in the repository** and are labelled throughout as *planned production configuration*; current vs planned status is tabulated in section 23 of the document.

Gaps recorded in the document for the client: learner sign-in is identification only (no password/SSO); no security headers, learner rate limiting or trust-proxy setting; legacy `/history` still reads the 40-question pipeline; training mode and adaptive difficulty have no learner UI; single admin account; single-attempt exports; no automated backups.

Build sources (diagram and DOCX generators) were kept outside the repository; nothing was added to `package.json`.

---

## 16.36 IMMERSIVE-013 — SMS S16–S20, the fourth SMS batch (COMPLETED 21 September 2026)

**IMMERSIVE-013 — SMS S16–S20 COMPLETE. The immersive layer now covers 95 of the 100 scenarios.**
WhatsApp 25/25 · Instagram 25/25 · Email 25/25 · **SMS 20/25** · **total 95/100**. SMS S21–S25 stay on
the generic path. Production was not migrated or written to.

Design record: `docs/SMS_S16_S20_REAL_WORLD_RESEARCH.md`.

| Scene | Identity (bank, unchanged) | Decision home | What it adds |
| --- | --- | --- | --- |
| S16 Learner-Initiated Login Code | **legitimate**, medium, `legit_system_confirmation` / `routine` | **another app** (Training Portal's code field) and the message | origin-bound code line `@portal.training.example #482193`; the keyboard's "From Messages" suggestion is the correct use (+3); forwarding the code −4; cancelling the sign-in −2; a sender ID that takes no replies |
| S17 New-Phone Family Emergency | malicious, medium, `impersonation_emergency_payment` / `empathy`+`urgency` | a saved contact's thread, the app's suggested reply "Done", a composer question, the payment sheet | Unknown/Known senders tabs; the child's saved thread shows a **Delivered** report 21 minutes earlier; payee is an individual |
| S18 Bank Header Thread Hijack | malicious, hard, `tech_support_and_callback_fraud` / `trust`+`fear` | the phone's call confirmation, **a call that rings**, the menu | the text lands inside the bank's genuine registered thread; a genuine OTP to add a payee arrives while the phone rings; reading it out is −8, hanging up is the safe branch |
| S19 Network Survey Requests IMEI *(military)* | malicious, hard, `operational_elicitation` / `authority`+`helpfulness` | survey form, **Messages attach-location sheet**, composer, unsaved-sender bar | `*#06#` identifier screen (test-range IMEIs); form and location are −8, "just the model" −3 |
| S20 Parcel Text Plus Callback | malicious, hard, `tech_support_and_callback_fraud` / `curiosity`+`urgency` | **OS package installer and screen-share consent**, the number in the text, the menu | one number, two companies, the learner's own delivered reply between them; install and screen share are −8, calling −3 |

Difficulty is the bank's (S16/S17 medium; S18–S20 hard) and was not changed. Military balance:
1 of 5 (S11–S15 had 2 of 5). Malicious/legitimate 4/1, keeping the bank's overall 80/20.

**Changed:** five new scene packs (`frontend/src/simulation/scenes/sms/s16.js`–`s20.js`), the
registry, `backend/data/learner-actions/v1/sms.json` (289 → **384** controls; total scene controls
1,798 → **1,893**), and one shared renderer fix (`CallSurface.jsx`, below). No engine, scoring,
bank, synthetic, taxonomy, selection, timer or API source changed; no new intent or surface kind.

**Tests.** Backend **1,021 / 1,021** (641 without a database + 380 in 19 DB-backed suites, each on
its own throwaway `cyber_awareness_imm013_t_*` database), including the new
`smsS16S20Engine.test.js` (14: 21 pinned routes through the real engine and transaction; premature
acts; stale, wrong-stage, cross-run and cross-scenario codes; retry replay; reload; and over real
HTTP: intent/points/score/event-code/verify-source/disposition injection → 422 `FORBIDDEN_FIELD`,
metadata injection → 422, cross-run and canonical-string codes → 422 `INVALID_ACTION`, wrong stage →
409/422, duplicates replayed; no accepted response carries a point value before the run is terminal).
`sceneAffordance.test.js` 176, `learnerAction.test.js` 10. Frontend **3,723 / 3,723** in 40 files,
including the new `SceneScenariosSmsD.test.jsx` (52) and a new S16–S20 block in `sceneModel.test.js`
(no branch shape repeats any of the 90 earlier scenes; all 20 SMS decision homes unique; five
different safe-branch homes; every scored surface **and page** reachable with the branch unspent; no
verdict or trigger words; S19 has no rank/operational term or coordinate), plus `sceneResearch.test.js`
(233). Lint clean; production build OK; `check:bundle` passed.

**Browser validation** (production-mode `verify` build on `localhost:4173`, isolated API on
`localhost:5055`, isolated DB `cyber_awareness_imm013_sms`; four synthetic learners, runs retargeted in
the isolated DB). Persisted scores read back from MongoDB:

| Scene | Safe route | Unsafe / critical routes |
| --- | --- | --- |
| S16 | **10** | forward the code **3**; cancel the sign-in **5** |
| S17 | **10** | pay R DESHMUKH **0** (PIN never left the sheet) |
| S18 | **10** (and **8** with inspection skipped) | read out card/PIN/code **0** |
| S19 | **10** | survey form **0** (IMEI/place/model never left the page) |
| S20 | **10** | install RemoteHelp **0** |

Reload mid-scene resumed at the same stage with the thread intact; a real 90-minute expiry (an
unplanned pause) closed an attempt with `RUN_EXPIRED` as designed. 375 px and 320 px: zero
overflowing elements. Keyboard focus visible (1.6 px outline). Every request went to `localhost`
only; no browser permission was requested. Storage empty. Live DOM and `current-run` free of
canonical vocabulary; a 416-node React fiber walk found no intent/source/points/event-code prop; only
`data-testid`/`data-control`/`data-beat` attributes. Live tampering: intent, points_delta, score and
metadata injection → 422 `FORBIDDEN_FIELD`; canonical strings, scene ids and a real S20 code reused on
another run → 422 `INVALID_ACTION`; replays on a finished run → 409 `RUN_NOT_ACTIVE`; stale code →
409 `STALE_STATE`; duplicate `intent_key` → replayed. No typed value, action code or control id in
any collection of the isolated database.

**Found by hand-play and fixed.** (1) On a live call, arriving captions pushed the call's controls
down; a click aimed at S18's Hang up landed on the release (kept as that learner's recorded critical
outcome). `CallSurface` now keeps captions in a fixed-height, focusable, self-scrolling log; the next
run sampled the Hang up control 21 times while all captions arrived and it never moved. This improves
every call scene; no scoring changed. (2) S18's Hang up first opened the bank app over the call, so
Back returned to a re-ringing call; Hang up now just closes the call.

**Production safety.** `cyber_awareness_training` compared before/after: every collection's count,
newest `_id` and full-content SHA-256 identical (attempts 10, candidates 9, scenarioruns 100,
scenarioevents 209, scenariodefinitions 100, scenarios 40, assessments 1, progresssnapshots 6,
adminusers/auditevents/configurations 0); database list identical. Bank fingerprint
`8e7a6c98…a7687` and synthetic fingerprint `2779b039…afde1` unchanged; taxonomy files unchanged.

**Cleanup.** Test API and preview stopped; all 20 `cyber_awareness_imm013_*` databases dropped;
temporary scripts and the verify build removed; local MongoDB left running; launch configuration
unchanged; older historical test databases untouched.

### Known limitations

- **SMS S21–S25 remain on the generic path** (5 of the 100 scenarios).
- S17 shares family and triggers with W04 and I04 — fixed by the bank; distinguished by evidence,
  decision home and branch shape (§0.6 of the design record).
- `current-run` still sends the bank's generic stage description (`scenario.stages`, identical
  transition labels for all 100 scenarios) — pre-existing, outside this batch's scope.
- The Messages composer draws its inert "Text message" field even on S16's no-reply sender; the
  thread states that the sender takes no replies.
- Installer rows wrap tightly at 320 px (shared `DetailRows` styling); no overflow.
- One scored decision per stage; consequence banners are session-only (carried).

### Next task

**SMS S21–S25**, then the final 100-scenario audit. Production migration remains **DEFERRED**.

**IMMERSIVE-013 COMPLETE. SMS S16–S20 complete. WhatsApp, Instagram and Email 25/25 each and SMS
S01–S15 unchanged in behaviour. SMS S21–S25 untouched. No production mutation. No scoring semantics
changed. The immersive layer now covers 95 / 100.**

## 16.37 IMMERSIVE-014 — SMS S21–S25, the fifth and final SMS batch (COMPLETED 22 September 2026)

**IMMERSIVE-014 — SMS S21–S25 COMPLETE. The immersive layer now covers all 100 scenarios.**
WhatsApp 25/25 · Instagram 25/25 · Email 25/25 · **SMS 25/25** · **total 100/100**. Production was not
migrated or written to. The final 100-scenario audit has **not** been started.

Design record: `docs/SMS_S21_S25_REAL_WORLD_RESEARCH.md`.

| Scene | Identity (bank, unchanged) | Decision home | What it adds |
| --- | --- | --- | --- |
| S21 Matching New-Login Alert | **legitimate**, hard, `legit_system_confirmation` / `fear`+`routine` | **the portal app's session list** and **the Spam folder page** | text sent 14:22 while the phone was in airplane mode, delivered 14:49 — message details show both; keep DEV-204 (+3), end the session (−2), open an unrelated "verify" text's address already filed in Spam (−4); report/block the alerts header −4 |
| S22 Synthetic Voice-Mail Link *(military)* | malicious, hard, `credential_phishing` / `authority`+`curiosity` | the voice portal's sign-in page, **the recording's transcript viewer**, the menu | a "Secure Voice" name on a ten-digit mobile; the phone's own **Voicemail** is empty; sign in −8; call the number the recording gives −3; close the page or leave for Voicemail are safe |
| S23 UPI Refund Collect Request | malicious, hard, `financial_credential_phishing` / `greed`+`confusion` | **the payment app's notification** (Decline), the collect payment sheet, the composer | refund story vs "is requesting" / PAY / "Money leaves your account"; PIN −8; reply −3 |
| S24 Fake Cybercrime Case Fee | malicious, hard, `coercion_and_extortion` / `fear`+`authority` | **the notice itself** (keep all four texts), the officer's number card, the fee sheet, **the phone's file picker** | four texts in two minutes with a countdown portal and a secrecy order; fee −8; upload ID and passbook −8; call the officer −3 |
| S25 FASTag Update APK | malicious, hard, `malware_delivery` / `convenience`+`urgency` | **Files** (delete the attachment), the install warning, the link card | the app arrives as an **MMS attachment**; the warning names default SMS app, accessibility and screen capture; install −8; download link −3 |

Difficulty is the bank's (all five **Hard**). Military balance 1 of 5 (S22). Malicious/legitimate 4/1;
across the finished bank **80/20** (asserted in `sceneAffordance.test.js`). Raw trigger and family
strings are kept beside the canonical ids. MITRE ATT&CK v19.2 (re-confirmed live 22 September 2026):
S22 T1660, T1598.003 (direct), T1684.001, T1598.004 (supporting), T1588.007 (partial); S23 T1660, T1657
(direct), T1684.001 (partial); S24 T1660, T1684.001, T1657 (direct), T1598.004, T1598.003 (supporting);
S25 T1660 (direct), T1655.001 (supporting), T1636.004/T1453/T1513 (partial, post-install); S21 has no
mapping, stated. Rejections (T1566.004, T1111, T1417.002, T1589, T1219, T1476 deprecated, T1204, T1474)
are recorded with reasons.

**Changed:** five new scene packs (`frontend/src/simulation/scenes/sms/s21.js`–`s25.js`), the registry
(all 100 authored), `backend/data/learner-actions/v1/sms.json` (384 → **477** controls; total scene
controls 1,893 → **1,986**), and one additive navigation option (`closes: 'all'` in
`SimulationPage.jsx`, documented in `sceneModel.js` and `SCENE_INTERACTION_LAYER.md` §4.2). No engine,
scoring, bank, synthetic, taxonomy, selection, timer or API source changed; no new intent or surface kind.

**Tests.** Frontend **3,918 / 3,918** in 41 files, including the new `SceneScenariosSmsE.test.jsx` (55)
and a new S21–S25 block in `sceneModel.test.js` (2,150 in the file: no branch shape repeats any of the 95
earlier scenes; all 25 SMS decision homes unique; five different safe-branch homes; new category sets;
every scored surface **and page** reachable with the branch unspent; a scored control on every stage;
no verdict or trigger words; S22 has no rank/operational term outside the client's sentence), and
`sceneResearch.test.js` (245). Backend **1,052 / 1,052** (650 without a database + 402 in 20 DB-backed
suites, each on its own throwaway `cyber_awareness_imm014_t_*` database), including the new
`smsS21S25Engine.test.js` (16: 19 pinned routes through the real engine and transaction; premature acts;
stale, wrong-stage, cross-run and cross-scenario codes; retry replay; reload; and over real HTTP:
intent/points/score/event-code/verify-source/disposition/metadata injection → 422, malformed bodies →
422, cross-run and canonical codes → 422, wrong stage → 409/422, duplicates replayed, and a finished
run's new requests refused without rescoring). `sceneAffordance.test.js` 185, `learnerAction.test.js`
10 (100 mapped scenarios). Lint clean (286 files); production build OK; `check:bundle` passed.
Transient, not caused by this batch: `smsS11S15Engine.test.js` aborted once at file level with no
output and then passed 7/7 on four clean reruns; `AssessmentTimer.test.jsx`'s remount test (two
second-granular wall-clock readings) failed once in a full-suite run and once in 15 isolated runs, and
passed in the final full-suite run.

**Browser validation** (production-mode `verify` build on `localhost:4173`, isolated API on
`localhost:5055`, isolated DB `cyber_awareness_imm014_sms`; three synthetic learners, runs retargeted in
the isolated DB; next-scenario advance exercised between every scene). Persisted scores read back from
MongoDB:

| Scene | Safe route | Unsafe / critical routes |
| --- | --- | --- |
| S21 | **10** | open the Spam text's address **3**; end the DEV-204 session **5** |
| S22 | **10** | sign in (synthetic mail + password typed) **0**; call the recording's number **4** |
| S23 | **10** | pay with PIN **0**; composer reply **4** |
| S24 | **10** | upload ID + passbook **0**; pay the fee with PIN **0** |
| S25 | **10** | install anyway **0**; open the download link **4** |

Reload at S21 verify resumed at the same stage with the "your place was kept" notice. 375 px and 320 px:
zero overflowing elements (thread and portal surface). Keyboard focus visible (1.6 px outline,
`:focus-visible`). Every request went to `localhost:4173`/`localhost:5055` only; no browser permission
was requested; storage empty. Live DOM and `current-run` free of canonical vocabulary; a 329-node fiber
walk found no intent/source/points/event-code prop before a decision (the only canonical string was
`resolution.outcome_code` on the post-terminal outcome card — the learner's own final act, returned by
design once a run is resolved). Live tampering: see `NEUTRAL_LEARNER_ACTION_CONTRACT.md`. None of the
typed synthetic values and no action code or control id exists in any collection of the isolated DB.

**Found by hand-play and fixed.** (1) After paying on S23's collect sheet the device popped only the
sheet and left the learner on the notification still offering Pay; S24's fee and upload had the same
shape. These releases now use `closes: 'all'`, which returns to the conversation (confirmed live on the
next run). (2) Resolve labels that assumed the safe branch ("Leave the request declined…", "…the file
stays deleted", "…keep DEV-204 signed in") were made branch-neutral; scoring unchanged. (3) S22's
call-back screen said "Back to the conversation" but returned to the preview; it now says "Back to the
preview".

**Production safety.** `cyber_awareness_training` compared before/after: every collection's count,
newest `_id`, full-content SHA-256 and index hash identical (attempts 10, candidates 9, scenarioruns 100,
scenarioevents 209, scenariodefinitions 100, scenarios 40, assessments 1, progresssnapshots 6,
adminusers/auditevents/configurations 0). Database list identical apart from the 21 IMMERSIVE-014
databases, since dropped (140 before and after). Bank fingerprint `8e7a6c98…a7687`, synthetic
fingerprint `2779b039…afde1`, `backend/data/scenarios`, `synthetic` and `taxonomy` directory hashes
unchanged.

**Cleanup.** Test API and preview stopped; ports 5055 and 4173 free; all 21 `cyber_awareness_imm014_*`
databases dropped; temporary scripts and the verify build removed; local MongoDB left running; launch
configuration unchanged; older historical test databases untouched.

### Known limitations

- The toast for S22 and S24 shows the bank's stored body without the "Secure Voice:" / "CYBER CASE
  NOTICE:" prefix, which the bubble reassembles (the bank stores the prefix as a display name).
- The Messages composer still draws its inert "Text message" field on S21's no-reply sender (carried
  from S16); the thread states the sender takes no replies.
- A composer reply is recorded with a consequence banner but no echoed bubble in S23's thread.
- `current-run` still sends the bank's generic stage description (`scenario.stages`) — pre-existing.
- One scored decision per stage; consequence banners are session-only (carried).

### Next task

**The final 100-scenario audit** — not started by this task. Production migration remains **DEFERRED**.

**IMMERSIVE-014 COMPLETE. SMS S21–S25 complete. WhatsApp, Instagram, Email and SMS 25/25 each —
100 / 100. No production mutation. No scoring semantics changed.**

---

## 16.38 MIGRATION-001 — Clean Production-Release Database (COMPLETED 22 September 2026)

**MIGRATION-001 COMPLETE. Release database `cyber_awareness_training_release` built, validated (12/12
invariants PASS), archived, restored and smoke-tested. The existing database `cyber_awareness_training`
is byte-for-byte unchanged.** Details: `docs/MIGRATION_001_DATABASE_REPORT.md` (architecture, inventory,
per-collection treatment, legacy decision) and `docs/PRODUCTION_RELEASE_MANIFEST.md` (release facts,
hashes, restore instructions).

**Final 100-scenario audit has NOT yet been performed.** No scenario content, scoring behaviour, model,
service, route or frontend file was changed by this task.

### Source

- Authoritative content: `backend/data/scenarios/v1` (client bank, `content_sha256 8e7a6c98…a7687`),
  `backend/data/synthetic/v1` (`2779b039…afde1`), `backend/data/taxonomy` (family and trigger v1.0.0).
- Architecture traced: the DB holds only `ScenarioDefinition`. Scene packs (`frontend/src/simulation/
  sceneRegistry.js`, 100 builders) are frontend code, and the neutral action maps
  (`backend/data/learner-actions/v1`) are backend source files. Neither belongs in the database, and
  neither was inserted. `expected_actions: []` on all 100 is the DATA-002 design: expected behaviour
  is carried by the per-stage scoring codes, the engine's `STAGE_INTENTS` rules and the action maps.
- Existing DB inventory (read-only, `backend/deploy/migration-001/production-baseline.before.json`):
  scenariodefinitions 100, scenarios 40 (all active), assessments 1, candidates 9, attempts 10,
  scenarioruns 100, scenarioevents 209, progresssnapshots 6, adminusers/auditevents/configurations 0, plus
  an empty `__rs0_transaction_test__`. No MongoDB-level validators anywhere.

### Release database

- **Name:** `cyber_awareness_training_release` (same server, replica set `rs0`). Portable copy:
  `backend/deploy/migration-001/cyber_awareness_training_release.archive.gz` (SHA-256 `44cc51ec…53729`).
- **Approach:** not a clone. `backend/scripts/release/buildProductionRelease.js` refuses a standalone server
  or an existing target, dry-runs the importer over the whole source, creates every model collection and
  every model-declared index, imports the 100 through the application's own importer, runs the release
  validator and compares the bank read-only with the existing DB. It is non-destructive: it never drops,
  deletes or overwrites anything.
- **Scenario counts:** 100 active, v1. WhatsApp, Instagram, Email and SMS 25 each; 80 malicious and 20
  legitimate (20+5 per platform); easy/medium/hard 32/36/32 (8/9/8 per platform); 35 military (W10 I12
  E8 S5, matching the plan); 19/19 families and 22/22 triggers used; no unknown taxonomy value.
- **Alignment:** every stored definition equals a fresh mapping of the source through the importer,
  field for field. The bank digest (`6ec38baa…63f08`) is identical to the existing DB's bank read through
  the schema. The only raw difference is `published_at`, absent in the 100 older documents (pre-ADMIN-001)
  and `null` in the release.
- **Legacy 40:** **not migrated.** They were still active and selectable in the existing DB through the
  mounted `POST /api/assessments`. In the release, `scenarios` and `assessments` exist, indexed and empty,
  so the legacy route answers `409 POOL_TOO_SMALL`. The records stay preserved in the existing DB and the
  backup.
- **Operational collections:** candidates, attempts, scenarioruns, scenarioevents, progresssnapshots,
  auditevents, assessments and adminusers all empty. `configurations` is empty because the application
  creates the singleton with defaults on first read. No admin user was invented; create one with
  `npm run admin:create` on the target.
- **Indexes:** 11 collections, 45 indexes, exactly the model declarations (`diffIndexes()` empty both ways),
  including the unique `scenario_id+version`, `identifierNormalised`, `usernameNormalised`, `scope`,
  `intent_key`, `run_id+sequence`, `attempt_id+ordinal` and `profile_id` (snapshots) indexes.

### Validation

`backend/scripts/release/validateProductionRelease.js` is read-only (autoIndex and autoCreate off) and
exits 1 on any violation. It checks collections, indexes, clean operational state, that no legacy
scenario is playable, bank IDs, schema, distributions, taxonomy, six stages with feedback and resolve
scoring, source alignment, learner actions and selection. For learner actions: 100/100 mapped; 1,986
scene and 37 generic controls; no duplicate keys; no scoring fields; every scene control accepted by the
engine; and no authoring name in `frontend/src`. For selection: 200 seeded attempts through the real
selector covered all 100 scenarios, always 8+2 across four platforms. Negative tests (a stray learner,
an active legacy scenario, a deactivated S07, an unknown family, a dropped unique index, removed resolve
scoring) each failed loudly. Two builds gave identical hashes.

### Compatibility smoke test

`backend/scripts/release/smokeTestRelease.js` ran against a restored copy of the archive (not the release
DB itself) through an isolated API on :5055 and passed 42/42. Results: 4 attempts, 36 distinct scenarios
on all four platforms; safe route 10/10 on 20/20 runs; risky route below 10 on 20/20; ledger replay
matched every run; `total_score` equal to the sum of run scores; neutral 422 on an unknown code, 409 on a
wrong-stage code, idempotent retry; legacy 409. A browser check of the verify build against the same API
rendered a scenario and committed a learner action.

### Production safety

A `mongodump` of `cyber_awareness_training` was taken before anything was created
(`%USERPROFILE%\mongo-backups\migration-001\…pre-migration-001.archive.gz`, outside the repo because it holds
learner records). After the migration, every collection's count, `_id` hash, full-content SHA-256, indexes
and newest record were identical to the baseline (`production-baseline.after.json`).

### Cleanup

The three temporary databases (`cyber_awareness_mig001_tmp_build`, `_tmp_build2`, `_smoke`) were dropped;
the server now holds 141 databases (140 plus the release). The API and preview servers were stopped and
ports 5055/4173 are free. Scratch files and the verify build were removed. MongoDB was left running, and
historical verification databases were untouched. New npm scripts: `release:build`, `release:validate`,
`release:inventory`, `release:smoke`.

### Known limitations

- The release validator is a pre-go-live gate. Once learners use the database, it will (correctly)
  report operational data.
- The smoke test covers 36 scenarios on two routes. It is not the 100-scenario audit.
- The source files are pinned by hash, but the IMMERSIVE-010 to 014 working tree is still uncommitted
  (git HEAD `ab41199`).

### Next task

**Admin section**, not started by this task. The final 100-scenario audit and deployment also remain
outstanding.

**MIGRATION-001 COMPLETE. Clean release DB `cyber_awareness_training_release` with the final 100 scenarios.
Existing database untouched. Final 100-scenario audit has NOT yet been performed.**

---

## 16.39 ENHANCEMENT-001 — Admin Dashboard + Admin UI Redesign (COMPLETED 24 September 2026)

**Source:** `MOM_FINAL_PRODUCT_ENHANCEMENTS_24_SEPTEMBER_2026.docx`, item 1. Full detail, every metric
definition and the test record: **`docs/ADMIN_DASHBOARD.md`**.

- **API:** one new read-only route, `GET /api/admin/dashboard?mode=` behind `requireAdmin`
  (`adminDashboardService.js`, `adminDashboardController.js`, `constants/adminDashboard.js`). It returns
  aggregate counts and ratios only, with no identity, scenario id or event/outcome code, and no audit
  entry. No existing API, model, schema or index was changed.
- **Metrics:** learners, attempts by status, completion rate, score summary and 10-point distribution (per
  attempt and per learner's latest attempt), per-platform average score, **attack success rate**
  (`missed_threat` ÷ decided malicious runs), safe-handling and genuine-rejected rates, outcome mix,
  server-side highest/lowest, and 14-day completions. Outcome classes come from RESULT-001's existing
  `classifyOutcome()`, so no new classification exists.
- **UI:** `/admin` is the dashboard. There is a dark console sidebar/drawer shell, restyled shared
  primitives (all admin pages), and new tokens (`console-*`, `signal*`, `chart-*`, `outcome-*`). No chart
  library was added. It also fixes a pre-existing horizontal overflow on the Attempts page (`TableScroll`
  is now `relative`).
- **Tests:** backend unit 11 new (full suite 666 pass / 0 fail). Engine integration 9 new (14 suites,
  348/348). Frontend 12 new (3,935/3,935). Lint clean. Scratch build and SECURITY-001 bundle check pass.
  Browser check done on a throwaway DB at 768–1440px.
- **Unchanged (verified by hash):** the 100-scenario bank sources, the release DB's 100
  `ScenarioDefinition` documents and operational counts, and the scoring, engine, result projection and
  learner-action sources.
- **Verification DB kept at the user's request:** `enh001_verify` on `rs0`, with demo admin
  `admin`/`admin` and seeded test attempts. It is not a release artefact; drop it during release cleanup.

**Next task:** ENHANCEMENT-002 (Login page redesign). This is not started.

---

## 16.40 ENHANCEMENT-001B — Admin Polish, Density, Pagination, Motion, Assessment-Only (COMPLETED 24 September 2026)

Details: `docs/ADMIN_DASHBOARD.md` (ENHANCEMENT-001B section).

- **Assessment-only:** the dashboard mode switch is gone, and `GET /api/admin/dashboard` now takes no
  parameters and counts `mode: 'assessment'` attempts only. The Attempts Mode filter and column were
  removed from the UI. The API contracts for attempts and configuration are unchanged; the training
  references that remain, and why, are listed in the doc.
- **Pagination:** Scenarios, Attempts and Audit log page at 10 rows on the server, through one shared,
  accessible `Pagination` component. Filters reset to page 1.
- **Density and motion:** there are central spacing and width tokens, toolbar filters, compact banners, a
  two-card Settings page, and a collapsible scenario list on the attempt viewer (~8,600 → ~3,200px). Motion
  is CSS only, with reduced-motion guards verified in the build. No npm package was added.
- **Tests:** frontend 3,945/3,945, backend unit 666/0 fail, engine suites (incl. dashboard 9/9). Lint
  clean. Scratch build and bundle check pass. No overflow at 1920–375px.
- **Unchanged:** the 100-scenario bank (25 per platform, fingerprint identical), scoring, the engine, and
  the neutral learner-action contract. No release DB cleanup was performed.

**Next task:** ENHANCEMENT-002 (Login page redesign). This is not started.

---

## 16.41 ENHANCEMENT-002 — Learner Login Redesign (COMPLETED 24 September 2026)

**Source:** `MOM_FINAL_PRODUCT_ENHANCEMENTS_24_SEPTEMBER_2026.docx`, item 2. The change is visual only.
Validation, `POST /candidates`, the session cookie, profile-found, storage-error/Retry, Exit and the
post-login navigation are unchanged.

- **Composition:** the screen is now a dark "assessment terminal" canvas with a drifting grid, ambient
  glows, one scan band, a vignette, and orbit rings behind the panel. On desktop the introduction, a
  "simulated channels" strip and the three steps sit on the left, and the white login panel is docked on
  the right (sticky on short screens). Below `lg` it becomes one column: introduction, form, then detail.
  The copy is unchanged, including the headline, the assessment framing, the steps, the "authorised
  training use" line and the TRAINING SIMULATION badge.
- **Files:** `layouts/AuthLayout.jsx` (rebuilt), new `components/auth/EntryVisuals.jsx` (backdrop, rings,
  channel strip, panel frame), new `components/auth/EntryPanel.jsx` (panel, accent/progress strip,
  `aria-hidden` state readout), `pages/LoginPage.jsx` (uses the panel, entry inputs, CTA treatment, and a
  no-op in-flight submit guard). `components/ui/Input.jsx` gains an opt-in `tone="entry"`; the default
  tone renders identically, so admin and other forms are unaffected. `styles/index.css` adds `entry-*`
  tokens, `--shadow-entry`, the entry keyframes/animations, and the `entry-grid` / `entry-cta` utilities.
- **Motion:** CSS transform/opacity only, with no JS timers, no canvas and no new package. Every
  animation is `motion-safe:`. Under reduced motion the scan band and flow packets are removed. Nothing
  delays the sign-in. The panel's entrance animation lives on `EntryPanel`, not on its wrapper: a
  transformed wrapper would trap the login dialogs' fixed overlay (found and fixed in the browser review).
- **Tests:** 5 new login tests (43 login/wording tests pass). Frontend 3,949/3,950: the one failure is
  `SceneScenariosEmailE` E21 timing out under full-suite load, and it passes alone (32/32); it is
  unrelated. Backend unit 666 / 0 fail. `candidateProfileApi` 21/21 and `learnerProfile` 16/16 pass on a
  scratch DB. Lint is clean. Build and SECURITY-001 bundle check pass.
- **Browser review:** 1920, 1440, 1280, 1024, 768, 480 and 375px showed no horizontal overflow. Checked
  with the real backend: validation, keyboard submit, loading, rejected sign-in, new profile to
  `/briefing`, profile-found/continue, existing-session redirect, server-down with Retry recovery, both
  dialogs and Exit.
- **Unchanged (verified):** the release DB's 100 `ScenarioDefinition` documents (fingerprint identical),
  and the scoring, selection, engine, learner-action and contract sources (hash identical). The only
  release DB change is one synthetic candidate (`Login Redesign Check` / `QA-2026-0924`) created by the
  end-to-end login check. Remove it during release cleanup. Scratch test DBs `engine_test` and
  `engine_test_enh002` can be dropped then too.

**Next task:** ENHANCEMENT-003 (Demo user + fixed 6 malicious / 4 legitimate + demo-only Skip). This is not started.

## 16.42 ENHANCEMENT-003 — Demo User, fixed 6 malicious / 4 legitimate demo assessment, demo-only Skip (COMPLETED 24 September 2026)

**Source:** `MOM_FINAL_PRODUCT_ENHANCEMENTS_24_SEPTEMBER_2026.docx`, item 3. Full details are in `docs/DEMO_USER.md`.

- **Identity.**
  - `DEMO_DISPLAY_NAME=demo user` and `DEMO_SERVICE_NUMBER=1223334444` are defined only in
    `backend/src/config/demo.js`, and can be overridden in `.env`.
  - The server recognises the Demo User by the session profile's normalised service number, via
    `isDemoCandidate()`. No client flag is read.
  - The profile is created by the normal Login page on first use. There is no seed script.
- **Fixed set.**
  - `W01, E01, S16, I04, E21, W24, E14, I11, S25, W16`, in that order.
  - 6 malicious and 4 legitimate, checked against the bank at creation.
  - Platforms WhatsApp 3 / Email 3 / Instagram 2 / SMS 2; difficulty 3 / 4 / 3; ten distinct families.
  - The list is in `constants/demoAssessment.js`.
  - Built by `selectDemoScenarios()` and persisted by the unchanged `createAttempt()` through a new
    server-side `selector` option; its default is the SELECT-002 solver.
  - A demo attempt is marked by `selection_algorithm_version: demo-fixed-1.0.0` and stays in `mode`
    `assessment`.
- **Skip.**
  - New endpoint `POST /api/attempts/:id/runs/:runId/demo-skip`. Its only body field is
    `expected_stage`.
  - Anyone who is not the Demo User, or who is not in a demo-built attempt, gets `404`.
  - Checks, in order: ownership, the deadline, the current run only, the stage matching, and replay
    via a unique `demo-skip:<attempt>:<run>` key.
  - It writes one 0-point `RUN_DEMO_SKIPPED` event (added to `ENGINE_TELEMETRY_CODES` beside
    `RUN_EXPIRED`) and closes the run as `resolve_demo_skipped`.
  - Score = `clamp(score_running)`, the approved C2 expiry rule. A skip awards nothing and penalises
    nothing.
- **Results.**
  - The learner sees the card as "Skipped" with no authored feedback or correct path. Skips are
    excluded from the family, trigger and stage breakdowns and from remediation.
  - `summary.skipped` appears only when greater than 0.
  - The Admin viewer shows the class `skipped`. The dashboard counts a skip as `not_resolved`
    (documented; analytics unchanged).
- **Frontend.**
  - `DemoSkip.jsx` renders only when `is_demo` is set.
  - A ghost button sits under the decision panel with one inline confirmation, and it is
    keyboard-accessible.
  - Result labels were added in `constants/result.js`, and are shared with the Admin detail page.
- **Unchanged (verified).**
  - Bank fingerprint `6ec38baa…3f08`: 100 active, 25 per platform.
  - Hash-identical: scoring, selection solver, engine service, `scenarioDefinition` /
    `scenarioSelection` constants, the learner-action service, maps and contract, and the
    admin-dashboard service.
  - The release DB was not written to; the browser checks used the isolated
    `cyber_awareness_enh003_verify` DB.
- **Tests.**
  - Backend unit: 679 pass, 0 fail, including 13 new demo tests.
  - `test:engine`: 15 suites all pass, including 21 new demo API tests.
  - Frontend: 9 new demo tests.
- **Browser.**
  - Demo login → briefing → 10 fixed scenarios with Skip visible.
  - Skipped scenario 2 midway; played the other 9.
  - Result 68/100 and consistent: 6 safe + 3 missed + 1 skipped; the skipped card reveals nothing.
  - A second demo attempt had an identical sequence.
  - A normal learner had no Skip, got the solver's 8 + 2 set, and a direct skip call returned 404.

**Next task:** none. ENHANCEMENT-003 is the final MOM enhancement. Awaiting client review before the
release cleanup phase. The scratch DB `cyber_awareness_enh003_verify` (local rs0) can be dropped then.

## 16.43 ENHANCEMENT-003-FINAL — Demo polish, analytics isolation, full verification (COMPLETED 25 September 2026)

- **AssessmentTimer flake fixed (test only).**
  - Cause: the test fixture pinned `server_now` to one instant, so every remount re-anchored to a frozen
    server clock. A reading could come out one second *higher* than the one before it, whenever the
    first reading had already ticked past a second boundary.
  - Fix: fake only `Date`, pin the clock, let the fake server stamp `server_now` from it the way the
    real API does, and advance exactly 7 s between mounts.
  - The assertion is now exact (`20:00` → `19:53`), which is stronger than before.
  - No production change.
- **Dashboard excludes the Demo User.**
  - `buildDashboard()` excludes the configured demo profile (`demoProfileIds()`) and any attempt built by
    the demo selector (`excludeDemoAttempts()`, both in `demoAssessmentService.js`).
  - Excluded from: learner counts, attempt counts, scores, bands, platform rates, outcome mix and trend.
  - The exclusion is server-side and cannot be changed by a parameter.
  - Demo attempts are still in Admin Attempts, Attempt Detail, results and exports.
  - Documented in `docs/ADMIN_DASHBOARD.md`.
- **Demo skip label.**
  - Learner and admin outcome class `demo_skipped`, labelled **"Skipped (Demo)"**. This is also the
    final-action and path label.
  - Time-limit closures are unchanged: `not_resolved` / "Not reached in time" / "Closed by time limit".
  - Scoring is unchanged.
- **Tests.**
  - Backend unit: 680 pass, 0 fail.
  - `test:engine`: 15 suites, all pass (demo API 26, including 6 new dashboard and label tests;
    dashboard 9/9 unchanged).
  - Frontend: **3,960 / 3,960** (the 3,959 baseline plus 1 new Admin label test).
  - Lint clean. Scratch build passes. `check:bundle` passes. `frontend/dist` untouched.
- **Unchanged (verified).** Bank fingerprint `6ec38baa…3f08`. Scoring, selection, engine and
  learner-action sources are hash-identical. The release DB is untouched.
- **Open item found (pre-existing, not fixed).** After an attempt EXPIRES, the learner dashboard keeps
  showing "Resume Assessment". `DashboardPage` treats the expired attempt reported by `/attempts/current`
  as active, so the learner is sent back to "Time is up" and cannot start a new attempt from the UI. The
  server itself allows a new attempt. This affects every learner, including the Demo User. It needs a
  decision before release.

## 16.44 FINAL-PRE-CLIENT-FIX-001 — Expired assessment no longer strands the learner on "Resume" (COMPLETED 25 September 2026)

Resolves the open item recorded in 16.43.

- **Root cause.**
  - When nothing is in progress, `GET /attempts/current` deliberately reports the learner's most recent
    *expired* attempt (IMMERSIVE-001), so the simulation can explain a timeout. That attempt is
    `status: completed`, `end_reason: expired`.
  - `DashboardPage` treated *any* returned attempt as resumable. The result was a permanent
    "Resume Assessment" button that led only to "Time is up". The stale state also persisted after a
    later normal completion, because the endpoint keeps reporting the last expired attempt.
- **Fix (frontend only).** `frontend/src/pages/DashboardPage.jsx` now resumes only when
  `attempt.status === 'in_progress'`.
  - Expired, completed or reset attempts fall through to the existing Start state, and Start makes the
    same `POST /api/attempts` it always did.
  - No backend, timing, scoring, selection, demo or analytics change.
- **Tests.**
  - New `frontend/src/pages/DashboardAttemptState.test.jsx` (7 tests): in-progress → Resume; expired →
    Start; Start creates a new attempt; completed → existing Start state; completed/reset not resumable;
    demo expired → Start; demo in-progress → Resume.
  - Two new tests in `backend/tests/demoAssessmentApi.test.js`: after expiry a new normal attempt uses
    selector `1.0.0` with 8/2; a new demo attempt keeps the fixed order and Skip works.
  - Frontend **3,967 / 3,967**. Backend unit 680 pass. DB suites 15/15 (demo 28).
  - Lint clean. Scratch build and `check:bundle` pass. `frontend/dist` untouched.
- **Browser (isolated `cyber_awareness_enh003_verify`).** Expiry was simulated by back-dating
  `expires_at`, as the timer tests do.
  - Normal learner: Resume while in progress → Start after expiry → new attempt (`1.0.0`, 8/2).
  - Demo User: Start after expiry → fresh demo, same fixed order, Skip works.
- **Unchanged.** Bank fingerprint `6ec38baa…3f08` (100 active, 25 per platform). The release DB is
  untouched.
