# Immersive Assessment Architecture Plan

**Document type:** architecture and specification audit — **PLANNING ONLY**
**Date:** 9 September 2026
**Status:** blueprint awaiting approval. **No product code, database, scenario, test or
dependency was changed by the work that produced this document.**
**Authority:** `Interactive_Social_Engineering_Scenario_UI_Development_Specification.pdf`
v1.0, 02 September 2026 — 116 pages, extracted in full and read line by line.
**Supersedes nothing.** It extends [`ACCEPTANCE_MATRIX.md`](ACCEPTANCE_MATRIX.md)
(ACCEPTANCE-001, 7 Sep 2026) rather than replacing it.

---

## 0. Contents

1. [Executive summary](#1-executive-summary)
2. [Method, and what "authoritative" means here](#2-method-and-what-authoritative-means-here)
3. [Line-by-line client specification audit](#3-line-by-line-client-specification-audit)
4. [Complete traceability matrix](#4-complete-traceability-matrix)
5. [The 90-minute authoritative timer](#5-the-90-minute-authoritative-timer)
6. [The assessment profile menu](#6-the-assessment-profile-menu)
7. [Immersive scenario architecture](#7-immersive-scenario-architecture)
8. [Platform-by-platform realism strategy](#8-platform-by-platform-realism-strategy)
9. [Interaction redesign strategy](#9-interaction-redesign-strategy)
10. [Scenario continuity proposal](#10-scenario-continuity-proposal)
11. [Feedback timing and immersion](#11-feedback-timing-and-immersion)
12. [Safety boundary](#12-safety-boundary)
13. [Security review](#13-security-review)
14. [Accessibility considerations](#14-accessibility-considerations)
15. [Performance](#15-performance)
16. [Implementation roadmap](#16-implementation-roadmap)
17. [Exact implementation order and dependencies](#17-exact-implementation-order-and-dependencies)
18. [Risk register](#18-risk-register)
19. [Testing strategy](#19-testing-strategy)
20. [Acceptance criteria](#20-acceptance-criteria)
21. [Items requiring client clarification](#21-items-requiring-client-clarification)

---

## 1. Executive summary

**Verdict: the client's new direction is achievable as an additive layer. It does not
require rewriting the engine, the scoring model, the selection solver, the taxonomies, the
event ledger or the 100-scenario bank.** Two of the three requests are already partly
specified by the client's own document and are therefore gap-closure rather than scope
growth; the third is genuinely new and needs written confirmation.

Three findings shape everything below.

**Finding 1 — the immersion problem is a measurable content gap, not a taste dispute.**
Every one of the 100 scenarios in `backend/data/synthetic/v1/` contains **exactly one
message bubble** (email: one body), and **all 100** open with a third-person narrator
caption rendered inside the conversation — W01's thread literally displays *"An unknown
number apologizes for entering the learner's number by mistake."* as a chat bubble before
the only real message. The specification, meanwhile, requires `prior-message history`
(WhatsApp stage 2), `thread history` (Email stage 2), `prior thread` (SMS stage 3) and
*"Read the full thread/message and **prior context** before choosing any action"* on all
100 scenarios. **There is no thread to read.** The learner is told what is happening
instead of experiencing it. This is the single largest cause of the "MCQ wrapper" feeling
and it is a deviation from the specification, not merely from the client's new wish.

**Finding 2 — the "choose an MCQ" feeling has one precise architectural cause, and it is a
one-line seam.** `PhoneShell.jsx` passes `actions={[]}` and `onAction={noop}` to all four
platform renderers. The simulated apps are deliberately inert; every decision is a labelled
button in a list in a panel beside the phone (`ActionSheet.jsx`). The renderers **already
accept** `actions`, `onAction`, `backAction` and `onOpen` and already render an in-device
control row — they are simply being fed nothing. Moving the decision onto the device is a
presentation change that submits the **identical existing intents** to the **unchanged**
engine.

**Finding 3 — the 90-minute timer is not in any client document.** Full-text search of the
116-page specification, both `Adaptive_Human_Cyber_Risk_Simulation_Platform_Requirements`
documents, both `Offline_Social_Engineering_Training_Developer_Brief` documents,
`Project_Proposal.docx`, `Final MCTE Proposal.docx`, `Social Engineering Fraud Training
PDS.PDF` and the concept brief returns **zero** occurrences of an assessment duration, time
limit, countdown or expiry. The only "duration" hits are the 3-week delivery window and the
specification's own per-event telemetry (`duration_ms`, `elapsed_ms`, link-hover duration).
The timer is therefore a **new requirement that amends specification v1.0**, and one of its
sub-decisions — how an unfinished scenario scores at expiry — changes the meaning of the
§7 result and must be confirmed in writing before it is built.

**Summary of the specification audit** (counts are the §4 matrix, totalled exactly)

| Verdict | Count |
|---|---:|
| PASS — implemented and evidenced | 75 |
| PARTIAL — implemented but incomplete | 21 |
| MISSING — no implementation | 29 |
| INCORRECT INTERPRETATION | 1 |
| NEEDS ENHANCEMENT (correct, but the new direction requires more) | 2 |
| NEEDS CLIENT CLARIFICATION | 3 |
| NOT APPLICABLE | 1 |
| **Total requirement lines assessed** | **132** |

Of the 132, **37 lines are new to this audit** — 35 derived from the client's 9 September
direction (rows N.1–N.35) plus rows 3.15 and 5.15, which sit inside specification sections
but describe behaviour the specification does not cover. The other **95 are the
specification's own §1–§7 and Appendix A rows**, re-assessed against the code as it stands
on 9 September 2026 — six tasks later than ACCEPTANCE-001.

Two figures deserve reading together. **29 MISSING is a large number, and 23 of them are the
client's new direction (N-rows) rather than v1.0 defects.** The specification-derived MISSING
count is **six**: rows 3.14, 4.9, 4.11, 4.12, 4.13 and 3.15 — and four of those six (4.11,
4.12, 4.13 and 3.14) are exactly what the immersion work exists to close. Against
specification v1.0 alone the product remains where ACCEPTANCE-001 left it: functionally
complete in its core, with a small, named set of gaps.

**Separately, nine questions (C1–C9 in §21) require a client decision before or during this
initiative; three of them block the timer work.**

**The headline recommendations**

| # | Question asked | Recommendation |
|---|---|---|
| 1 | Should the assessment menu disappear? | **No.** §3 requires the menu to contain all four items. Change *behaviour*, not presence: history becomes an in-shell read-only panel, logout gains a consequence-stating confirmation, restart stays explanatory, accessibility is never gated. |
| 2 | How should the 90-minute timer work? | Server-authoritative `expires_at` pinned on `Attempt` at creation; lazy enforcement on every mutating route, a 30-second sweeper, and a startup recovery pass. The client renders a countdown that decides nothing. |
| 3 | What happens to unfinished scenarios at expiry? | Resolve each outstanding run with `clamp(score_running, 0, 10)` — the engine's existing resolution rule. Untouched runs score 0 naturally; partially worked ones keep evidence they actually earned. **Needs client sign-off.** |
| 4 | Should scenarios become story arcs? | **Not through the selector.** Achieve continuity through a shared persona registry, a synthetic working-day clock and multi-beat escalation *inside* each scenario's own six stages. Cross-scenario co-selection is possible but changes `SELECTION_ALGORITHM_VERSION` and breaks §7 comparability — defer behind explicit client approval. |
| 5 | How do we stop it feeling like an MCQ? | Feed the renderers real `actions`; map device affordances onto the **existing** intent vocabulary; keep the side panel as the canonical keyboard/screen-reader path. No engine change. |
| 6 | Does FEEDBACK-001 need to wait? | **No.** It is independent and touches different files. Assessment mode should stay uninterrupted; training-mode feedback should render *outside* the device frame so it never contaminates the fiction. |

---

## 2. Method, and what "authoritative" means here

**What was read.** The 116-page PDF was extracted to text (9,684 lines, 339,441 characters)
and read from page 1 to page 116 — §1 Product Scope, §2 Login, §3 Dashboard, §4 Common
Simulation UI and the canonical six-stage state machine, §5 Scoring/Randomization/Attempt
Rules, §6 Data/Administration/Acceptance, the release acceptance checklist, all four
scenario-bank composition statements, **all 100 six-stage scenario detail pages**, §7
Results, §8 Research Basis and Appendix A. All 100 detail pages were parsed
programmatically into a structured index (id, page, title, platform, difficulty,
disposition, trigger) and cross-checked against the database bank.

**Secondary documents read in full or in the relevant part:** `PROJECT_MASTER_PLAN.md`
(6,993 lines — sections 12, 15.14, 15.23–15.50 in full), `docs/ACCEPTANCE_MATRIX.md`,
`docs/ACCEPTANCE_OFFLINE.md`, `docs/SIMULATION_UI.md`, `docs/SCENARIO_ENGINE.md`,
`docs/SCENARIO_DEFINITION_SCHEMA.md`, `docs/SYNTHETIC_CONTENT_SCHEMA.md`,
`docs/SCENARIO_SELECTION.md`, `docs/RESULT_API.md`, `docs/ATTEMPT_API.md`,
`docs/ADMIN_INSTRUCTOR_CONTROLS.md`, `docs/ADMIN_AUDIT_LOG.md`,
`docs/DEPLOYMENT_AND_TRANSACTION_STRATEGY.md`.

**Code inspected before any recommendation was written:** the whole backend `src/` tree
(12,749 lines) and the whole frontend `src/` tree (18,063 lines), with close reading of
`Attempt.js`, `ScenarioRun.js`, `ScenarioDefinition.js`, `ScenarioEvent.js`,
`scenarioEngineService.js`, `attemptService.js`, `attemptResultService.js`,
`instructorControlService.js`, `progressService.js`, `constants/scenarioEngine.js`,
`constants/scenarioSelection.js`, `constants/auditLog.js`, `middleware/session.js`,
`config/env.js`, and on the frontend `SimulationPage.jsx`, `PhoneShell.jsx`,
`AttemptHeader.jsx`, `ActionSheet.jsx`, `SupportDialogs.jsx`, `attemptMachine.js`,
`useAttemptController.js`, `dashboardOrchestrator.js`, `syntheticScreen.js`,
`constants/simulation.js` and all four channel renderers.

**Data measured, not assumed.** The 100 synthetic content documents were parsed and counted
directly. Every quantitative claim in section 7 (message-bubble counts, asset-kind
distribution, narrator-note prevalence) is a measurement of
`backend/data/synthetic/v1/synthetic.*.json`.

**Authority hierarchy used throughout.**

1. The client specification PDF v1.0 — authoritative for *what must exist*.
2. The client's new verbal direction (immersion, 90-minute timer, menu behaviour) —
   authoritative for *intent*, but where it is silent or conflicts with (1), (1) wins and
   the conflict is raised as a clarification item rather than resolved unilaterally.
3. `PROJECT_MASTER_PLAN.md` and `docs/` — authoritative for *what was decided and why*, and
   binding on this plan wherever it does not contradict (1).
4. The code and the database — authoritative for *what actually exists today*.

**What was deliberately not done.** No file outside this document and
`PROJECT_MASTER_PLAN.md` was written. No test was run, no server started, no database
connection opened, no dependency installed into the project (`pypdf` was installed into the
host Python only, to read the client PDF; it is not a project dependency and nothing in
`backend/` or `frontend/` references it). Consequently **every status in the matrix below
that depends on execution is marked as inherited evidence from a prior task rather than
freshly verified**, and is labelled as such.

---

## 3. Line-by-line client specification audit

This section records what each part of the specification actually says, and what the code
actually does about it, in the specification's own order. The tabular verdicts are in §4.

### 3.1 Title page and Document Purpose (pp. 1–2)

The document defines the product as *"Offline training-cum-evaluation for military
personnel"* across *"Four simulated communication applications"*, *"Fictional,
non-operational and locally contained"*, and states the learner journey precisely:

> "A learner identifies themselves, enters a dashboard that behaves like a contained
> mobile-communications environment, completes 10 randomized multi-step scenarios,
> receives an explainable score out of 100, and retains attempt history for future
> comparison."

**Nothing in that sentence, or anywhere in the document, bounds the session in time.**
"10 randomized multi-step scenarios" is the only quantity given.

The safety boundary is stated as *non-negotiable* on page 2:

> "Use reserved example domains, invalid training numbers, generated identities, inert
> files and local routes only. Do not transmit messages, access real accounts, collect real
> passwords/OTPs/payment data, invoke a real dialer, resolve DNS, or expose genuine unit
> information."

**Audit:** implemented and verified by ACCEPT-002 (`docs/ACCEPTANCE_OFFLINE.md`). The
immersion work must not weaken it; see §12.

### 3.2 §1 Product Scope and Design Principles (p. 4)

Six principle rows. Two of them are the client's own statement of the very thing they have
now asked for verbally, which is why the immersion work is gap-closure rather than new
scope:

| Principle | Developer requirement (verbatim) | Acceptance signal (verbatim) |
|---|---|---|
| Realistic but recognizable as training | "Use familiar interaction patterns and proportions, with a persistent low-salience 'TRAINING SIMULATION' rail; avoid trademark-perfect copying." | "Learners can navigate naturally without mistaking the application for a live service." |
| **Action, not quiz** | **"Unsafe and safe controls must be interactive. Branches change local screens, score events and feedback."** | **"Every scenario produces at least six ordered UI events."** |

**"Action, not quiz" is the client's own heading.** The acceptance signal it names — six
ordered UI events — is satisfied. The *requirement* it names — that unsafe and safe controls
must be **interactive** — is satisfied only in the weak sense that a button in a side panel
is interactive. The controls are not interactive *inside the simulated application*: the
renderers receive `actions={[]}`. This is the strongest specification support for the
interaction redesign in §9, and it means the redesign closes a PARTIAL row rather than
adding a feature.

"Learners can navigate naturally" is likewise only partly met: inside a scenario the learner
can navigate nowhere. The device shows one thread; the inbox behind it holds one row.

### 3.3 §2 Screen 1 — Login / Identification (p. 5)

Seven region rows, a data contract and five required states. Closed by LOGIN-001 and
PROFILE-001 (master plan 15.47, 15.48) apart from one live defect:

> "Identity — Personal / Service Number field"

The implemented label reads **"Phone / Service Number"** (`LoginPage.jsx:287`, and again at
`:379` on the profile-found card). The specification is explicit that the field is a
*Personal / Service Number*, 3–24 alphanumeric plus hyphen, and equally explicit in the
login data contract: *"Do not add password, Aadhaar, phone, email, rank or real unit fields
to Version 1."* A label inviting a phone number invites exactly the value §2 prohibits.
This was raised as G8 in ACCEPTANCE-001 and is **still open**. It is a two-string fix.

### 3.4 §3 Screen 2 — Post-Login Dashboard (p. 6)

Eight zone rows plus a three-sentence "Notification behavior" paragraph. Three rows bear
directly on the client's questions.

**The Learner row is the answer to the menu question, and it is unambiguous:**

> "Profile chip — Display name + masked service number; menu contains attempt history,
> accessibility, restart (instructor-controlled) and logout."

The specification **requires** the menu and **enumerates its four items**, in that order,
and marks restart as instructor-controlled. Removing the menu, or reducing it to
accessibility only, would be a specification violation. See §6.

**The App grid row is a live immersion gap:**

> "Four equally weighted tiles with recognizable generic icons, unread badges, last-event
> preview and status dot. **Do not lock apps into a fixed sequence.**"

The engine issues one run at a time by ordinal. `tilesFor()` badges only the active
platform. A learner cannot choose which app to enter, so apps *are* locked into a fixed
sequence — the sequence just happens to be shuffled at creation. Recorded as PARTIAL in
ACCEPTANCE-001 row 3.7 and unchanged.

**The Notification behavior paragraph contains a requirement with no implementation at
all:**

> "If the learner opens the wrong app, show only benign background items and log navigation;
> never expose which tile is 'correct'."

Opening a quiet app shows platform chrome and an honest empty state (CLIENT-POLISH-001).
There are **no benign background items** anywhere in the product, and navigation is not
logged. `docs/SIMULATION_UI.md` §15.9 records the logging half deliberately, because the §4
event vocabulary has no code for app navigation and inventing one would widen a closed
taxonomy. The *benign background items* half has no such justification — it is simply
absent, and it is also precisely the content the immersion work needs. See §7.8.

**The Progress card row constrains the timer's presentation:**

> "Scenario n/10, segmented progress bar, elapsed time and status. **Hide the running score
> in assessment mode**; training mode may show points after feedback."

The specification asks for **elapsed** time. A countdown is not the same thing. §5.9
recommends showing both, because a 90-minute deadline the learner cannot see is not an
assessment condition, it is a trap — but the elapsed display §3 names must survive.

### 3.5 §4 Common Simulation UI and State Model (p. 7)

Nine shared components and the canonical six-stage state machine.

The shared-component table is the specification's own list of what the simulated
applications must contain, and it is materially richer than what is on screen today:

| Component | What §4 requires | What exists |
|---|---|---|
| Simulation shell | "Centered mobile viewport (target 390 x 844 logical px) within responsive desktop frame; **optional full-width email view**" | `DeviceFrame` at 390x844. No full-width email view (the spec marks it optional). |
| Safe browser | "address bar, Back, Close and page states"; "typed data is replaced by tokens" | `LocalSurfaces` renders an inert page. **No address bar, no page states.** No typed data exists at all, which is safer than tokenisation. |
| File viewer | "Preview inert PDF/image/text; risky file types show a simulated open/install branch" | Inert preview present; the open/install branch is an engine consequence, correct. |
| QR inspector | "show the full synthetic target before an Open choice" | Present. |
| Call / voice screen | "Synthetic caller, **timer, captions** and choices: Decline, Accept, End, Verify, Report" | Panel present. **No call timer, no captions, and the five named choices are not rendered as call-screen controls** — they are side-panel intents. |
| Trusted Directory | "show provenance such as 'local approved directory'" | Present and correct; the anti-oracle rule is enforced by the engine. |
| Action sheet | "Reply, Forward, Delete, Mark safe, Verify, Report, Block/Restrict **as appropriate**" | The side panel offers Reply, Verify, Report, Block. **Forward, Delete and Mark safe are absent from every stage.** |
| Rationale input | "Optional 250-character one-line explanation in selected scenarios" | Present, at the resolve stage, sanitised, never scored. |
| Feedback card | "Training mode immediate; assessment mode may defer detail until attempt completion" | Result screen only. This is G1 / FEEDBACK-001. |

Three of those nine rows — safe-browser chrome, call-screen timer and captions, and the
missing Forward/Delete/Mark-safe actions — are simultaneously **specification gaps** and
**exactly the affordances that would make the simulation feel like an application instead of
a questionnaire.** They are the cheapest immersion wins available, because the specification
already demands them.

The six-stage machine's stage-3 core events are `sender_inspected, link_hover_ms,
profile_viewed, file_previewed`. `link_hover_ms` exists in
`constants/scenarioDefinition.js:189`, `constants/scenarioEngine.js:203` and
`models/ScenarioEvent.js:35` — and **is never produced**: `grep -rn link_hover_ms
frontend/src` returns nothing. There is no link to hover, because a link is text inside a
bubble and inspection is a side-panel button. Making links real device affordances (§9)
closes this without any backend change: the field, the allowlist entry and the schema slot
already exist and are waiting.

### 3.6 §5 Scoring, Randomization and Attempt Rules (p. 8)

Nine scoring events at fixed deltas, nine attempt constraints, and an interpretation
safeguard. **All verified correct and none of it may be touched by any work in this plan.**

Two lines govern the timer design and are quoted here because §5's recommendations rest on
them:

> "Each scenario awards up to 10 points. Positive evidence is **earned**; unsafe or
> unjustifiably over-cautious behavior subtracts points. **Clamp each scenario to 0–10, then
> sum 10 scenarios for a 0–100 attempt score.**"

> "Integrity — Persist event ledger and scenario result **transactionally** before issuing
> the next dashboard notification."

The first sentence is why the recommended expiry rule is `clamp(score_running, 0, 10)` and
not a forced zero: zeroing would confiscate evidence the learner demonstrably earned, which
contradicts "positive evidence is earned". The second is why expiry must be one transaction
over the attempt, its outstanding runs and their ledger entries — §5.5.

The specification also fixes the shape of an attempt in a way the timer must not disturb:

> "Scenario count — **Exactly 10 resolved scenarios.**"

An expiry that left runs unresolved would put the attempt permanently outside §5. Every
outstanding run must therefore *resolve*, not merely stop.

### 3.7 §6 Data, Administration and Acceptance Criteria (p. 9)

Six minimum entities, five admin capabilities, seven release pass conditions.

The `Attempt` entity minimum is `attempt_id, profile_id, seed, mode, started_at,
completed_at, status, total_score, version`. **There is no duration, deadline or expiry
field**, consistent with §3.1's finding that the specification contains no timer. Adding
`expires_at`, `duration_ms`, `end_reason` and `expired_at` is therefore an *extension* of a
client-specified minimum, not a modification of it — the nine named fields all survive
untouched. That is the correct shape for an amendment.

Two release pass conditions bound the timer work directly:

> "State recovery — Closing/reopening resumes at the last committed state **without
> duplicating points or skipping events.**"

> "Consistency — Badge, toast, app list, thread and backend state remain synchronized under
> interruption and retry."

These are the specification's own answer to "what happens if the learner closes the
browser": **resume, do not reset, do not double-count.** The architecture already satisfies
them (nothing authoritative lives in `localStorage`; `useAttemptController.resume()` asks the
server). The timer must preserve them, which is why §5 puts the deadline in the database
rather than in a browser.

`Audit — Append-only change log for scenario publication, resets, exports and configuration
changes.` Note what is **not** in that list: anything a learner does, and anything the system
does by itself. `AuditEvent.actor_admin_id` and `actor_username` are both `required`. A
system-initiated expiry has no admin actor. See §5.8.

### 3.8 §7 Results, Feedback and Progress Comparison (p. 114)

Seven result elements. All PASS or near-PASS after RESULT-001 and PROGRESS-001, with one row
that the timer places under pressure:

> "Progress — Compare current and previous attempts **only when mode/content version are
> comparable**; show trend and exposure count."

A timed-out attempt has the same mode and content version as a completed one, so the
comparability gate will admit it and it will move `last_score`, `best_score` and the trend.
Whether that is desirable is a **policy question for the client**, not an engineering one.
See §21 item C3.

> "Exit — Save completed attempt, Return to dashboard, Print/export if authorized, and
> **Logout for the next learner**."

This is the *only* place the specification puts logout at the end of the journey, and it
reinforces §6's reading: logout mid-attempt is not forbidden, but the natural place for it
is after the result. Row 7.7 remains PARTIAL (no print/export, no logout on the result
screen) — see G10 in `ACCEPTANCE_MATRIX.md`.

### 3.9 Appendix A — Scenario Content Authoring Schema (p. 116)

Seven field groups and a definition of done. The `synthetic content` row is the licence for
everything proposed in §7:

> "synthetic content — Generated sender, **message/thread**, reserved link, inert asset IDs
> and **prior context**. No copied live victim/adversary content."

The schema field is `message/thread` — singular *message* **or** *thread*.
`ScenarioDefinition` models it as `synthetic.assets[].content` of type
`Schema.Types.Mixed`, which means a twelve-block thread is already storable with **no schema
migration whatsoever**. The constraint Appendix A imposes is on *provenance* — "No copied
live victim/adversary content" — not on volume. Writing richer synthetic dialogue is
squarely inside the authoring schema.

The definition of done is the acceptance bar every enriched scenario must still clear:

> "A fresh learner can complete the safe path; every risky path remains locally contained;
> the disposition is supported by observable evidence; **verification does not leak the
> answer**; points sum correctly; copy is fictional; and feedback teaches one transferable
> habit."

"Verification does not leak the answer" is the constraint that makes the interaction
redesign delicate rather than trivial — see §9.4.

### 3.10 The 100 scenario detail pages (pp. 11–35, 37–61, 63–87, 89–113)

All 100 were parsed and cross-checked. The database bank matches the PDF exactly on id,
platform, difficulty, disposition, family, trigger and military flag — ACCEPTANCE-001
verified this programmatically and nothing has changed the bank since (fingerprint
`8e7a6c98…038a7687`).

What this audit adds is a **narrative reading** of the same 100 pages. Six of them are named
for a dynamic the current content cannot express:

| ID | Title | The dynamic the title promises |
|---|---|---|
| W12 | Digital Arrest Escalation | escalation over successive contacts |
| W22 | Long-Game Online Friendship | trust established over time before the ask |
| E18 | Hijacked Reply-Chain Invoice | an existing, believable thread that is hijacked |
| S09 | Wrong Number Becomes an Investment Pitch | a benign opening that turns |
| S18 | Bank Header Thread Hijack | a legitimate prior thread the attacker joins |
| S20 | Parcel Text Plus Callback | a second channel opening after the first |

Every one of these is delivered today as a single bubble and a narrator caption. **W22 in
particular — "Long-Game Online Friendship", Hard, trigger "Trust + reciprocity" — cannot be
assessed at all in one message.** The learner is asked to judge a relationship that the
simulation never let them have. That is the clearest possible evidence that multi-message
threads are a specification requirement rather than a stylistic preference.

The stage-4 prose on all 100 pages likewise describes movement — *"The interaction
**advances to** a simulated system-code bubble followed by a reply composer"*, *"advances to
an offline tracking page requesting card/UPI details"*, *"advances to a fake case portal and
payment timer"*. The word is *advances*. The escalation the client is asking for is written
into every single scenario, at stage 4, in the client's own document.

---

## 4. Complete traceability matrix

**Legend.** `PASS` implemented and evidenced · `PARTIAL` implemented but incomplete ·
`MISSING` no implementation · `INCORRECT` implemented against a misreading · `ENHANCE`
correct today, but the new client direction requires more · `VERIFY` believed correct,
never executed · `CLARIFY` cannot be decided without the client · `N/A` not required.

**Evidence discipline.** `[read]` = verified by reading the file this session.
`[measured]` = verified by parsing the data this session. `[inherited]` = evidence from a
prior task's recorded test or browser run; not re-executed here.

### §1 Product Scope and Design Principles

| # | Requirement | Status | Evidence file / component | Gap | Recommended task | Pri | Dep |
|---|---|---|---|---|---|---|---|
| 1.1 | Persistent low-salience "TRAINING SIMULATION" rail; not trademark-perfect | PASS | `TrainingRail.jsx`, `SimulationBadge.jsx` `[read]` | — | — | — | — |
| 1.2 | Unsafe and safe controls **interactive**; branches change local screens, score events and feedback | **PARTIAL** | `ActionSheet.jsx`; `PhoneShell.jsx` passes `actions={[]}`, `onAction={noop}` `[read]` | Controls are interactive in a side panel, not inside the simulated app | **IMMERSIVE-005** | HIGH | 004 | **[IMMERSIVE-003A: CLOSED for W01-W05; open for the remaining 95]**
| 1.3 | Every scenario produces at least six ordered UI events | PASS | 100/100 six-stage, 12 scoring entries each `[inherited]` | — | — | — | — |
| 1.4 | Bank totals 80 malicious + 20 legitimate | PASS | `acceptance-scenario-bank.json` `[inherited]` | — | — | — | — |
| 1.5 | 8 easy / 9 medium / 8 hard per platform | PASS | bank audit `[inherited]` | — | — | — | — |
| 1.6 | Military-context tag visible to authors, never from live data | PASS | `military_flag` 10/12/8/5 `[measured]` | — | — | — | — |
| 1.7 | All browser/file/QR/call/login/payment experiences are local mocks | PASS | `LocalSurfaces.jsx`: zero input, form and href elements `[measured]` | — | — | — | — |
| 1.8 | Network-off test completes all 100 scenarios | PASS | ACCEPT-002, `ACCEPTANCE_OFFLINE.md` `[inherited]` | — | re-run after 004/005 | MED | 005 |
| 1.9 | "Learners can navigate **naturally**" | **ENHANCE** | Inside a scenario the device shows one thread, the inbox one row `[read]` | No navigable environment | **IMMERSIVE-004** | HIGH | 003 |

### §2 Screen 1 — Login / Identification

| # | Requirement | Status | Evidence | Gap | Task | Pri | Dep |
|---|---|---|---|---|---|---|---|
| 2.1 | Name field 2–60, trimmed, control chars rejected, label visible | PASS | `LoginPage.jsx` `[read]` | — | — | — | — |
| 2.2 | Service number 3–24 alnum+hyphen, normalised key, masked to last four | PASS | `serviceNumber.js`, `Candidate` `[read]` | — | — | — | — |
| 2.3 | Start disabled until valid; retrieve-or-create profile | PASS | `LoginPage.jsx`, `candidateService.js` `[read]` | — | — | — | — |
| 2.4 | Profile-found card | PASS | LOGIN-001 `[inherited]` | — | — | — | — |
| 2.5 | Five required states incl. storage error + Retry | PASS | LOGIN-001 `[inherited]` | — | — | — | — |
| 2.6 | Footer: Instructor help / Exit | **REMOVED** | `LoginPage.jsx` `[read]` | Removed from the login card on 1 Oct 2026 as a UI cleanup; the card has no footer controls. `LoginSupportDialogs.jsx` remains in the tree but is not rendered | — | — | — |
| 2.7 | Keyboard, focus, 200% zoom | PASS | `[inherited]` | — | re-verify after the redesign | HIGH | 005 |
| 2.8 | LearnerProfile minimum fields | PASS | PROFILE-001 `[inherited]` | — | — | — | — |
| 2.9 | **No password, Aadhaar, phone, email, rank or real unit fields** | **INCORRECT** | Label reads **"Phone / Service Number"** at `LoginPage.jsx:287` and `:379`; §2 says *Personal* / Service Number `[read]` | The label invites the one value §2 prohibits. No such data is *stored* — a wording defect, not a data defect | **IMMERSIVE-000** | HIGH | none |
| 2.10 | Consent/briefing acknowledgement versioned + timestamped | PASS | PROFILE-001 `[inherited]` | — | — | — | — |

### §3 Screen 2 — Post-Login Dashboard

| # | Requirement | Status | Evidence | Gap | Task | Pri | Dep |
|---|---|---|---|---|---|---|---|
| 3.1 | Training banner + local clock, sound state, connection-off | PASS | `TrainingRail.jsx` `[read]` | — | — | — | — |
| 3.2 | Profile chip: display name + masked number | PASS | `AttemptHeader.jsx` `[read]` | — | — | — | — |
| 3.3 | **Chip menu: attempt history, accessibility, restart (instructor-controlled), logout** | PASS | `AttemptHeader.jsx` `LearnerMenu` — all four, in order `[read]` | Present and specification-exact. The client's concern is *behaviour*, not presence | **IMMERSIVE-002** | HIGH | 001 |
| 3.4 | Progress card: n/10, segmented bar, **elapsed time**, status | PASS | `AttemptHeader.jsx` `ElapsedTime` `[read]` | — | must survive IMMERSIVE-001 | HIGH | 001 |
| 3.5 | Running score hidden in assessment mode | PASS | `ScenarioRun.toCandidateJSON()`, `scoreVisible()` `[read]` | — | — | — | — |
| 3.6 | Four tiles: icons, unread badges, last-event preview, status dot | PASS | `dashboardOrchestrator.tilesFor()` `[read]` | — | — | — | — |
| 3.7 | **Do not lock apps into a fixed sequence** | **PARTIAL** | The engine issues one run by ordinal; only the active tile badges `[read]` | Apps are effectively sequential | **IMMERSIVE-004** | MED | 003 |
| 3.8 | Stacked toast tray, at most three | PASS | `trayFor()` caps at `MAX_TOASTS` `[read]` | Never exercised beyond one | — | — | — |
| 3.9 | Dismiss logs an event, does not remove the scenario | PASS | `notification_dismissed`, stays at NOTIFY `[read]` | — | — | — | — |
| 3.10 | Deliver the next event 1–4 s after idle | PASS | `deliveryDelayMs()`, FNV-1a over the run id `[read]` | — | the reveal engine reuses this pattern | — | — |
| 3.11 | Orchestrator status + Resume after interruption | PASS | `QueueStatus.jsx`, `useActivityDelivery` `[read]` | — | — | — | — |
| 3.12 | Support: Rules / Report simulation issue | PASS | `SupportDialogs.jsx` `[read]` | — | Rules must gain the timer explanation | HIGH | 001 |
| 3.13 | After 10 resolved, CTA becomes View results; attempt preserved atomically first | PASS | `completeAttempt()` inside a transaction `[read]` | — | — | — | — |
| 3.14 | **Wrong app shows only benign background items; navigation logged** | **MISSING** | `AppSurfaces.jsx` renders chrome plus an empty state; `inboxScreen()` builds one row `[read]` | No background items exist anywhere. Navigation logging deliberately deferred (`SIMULATION_UI.md` 15.9) | **IMMERSIVE-004** | HIGH | 003 |
| 3.15 | *(new)* Countdown to the 90-minute deadline | **MISSING** | No timer anywhere in the backend `[measured]` | Entire feature | **IMMERSIVE-001** | HIGH | none |

### §4 Common Simulation UI and State Model

| # | Requirement | Status | Evidence | Gap | Task | Pri | Dep |
|---|---|---|---|---|---|---|---|
| 4.1 | Centred 390x844 viewport in a responsive desktop frame | PASS | `DeviceFrame.jsx` `[read]` | — | — | — | — |
| 4.2 | Safe browser: reserved pages, **address bar, Back, Close, page states**; DNS blocked | **PARTIAL** | `LocalSurfaces.jsx` renders body copy only; `SurfaceScreen` supplies Back `[read]` | No address bar, no page states | **IMMERSIVE-006** | MED | 005 |
| 4.3 | File viewer: inert preview; risky types show an open/install branch | PASS | `LocalSurfaces.jsx` plus the engine consequence `[read]` | — | — | — | — |
| 4.4 | QR inspector: decode a local payload, show the full target before Open | PASS | `LocalSurfaces.jsx` `[read]` | — | — | — | — |
| 4.5 | Call screen: caller, **timer, captions**, Decline/Accept/End/Verify/Report | **PARTIAL** | Panel present; no timer, no captions; the five choices are side-panel intents `[read]` | Three named elements absent | **IMMERSIVE-006** | MED | 005 |
| 4.6 | Trusted Directory; in-message numbers never populate it | PASS | `TrustedDirectory.jsx`; the engine refuses to score `verify_in_message_contact` as TRUSTED_VERIFY `[read]` | — | — | — | — |
| 4.7 | Action sheet: Reply, **Forward, Delete, Mark safe**, Verify, Report, Block/Restrict | **PARTIAL** | `constants/simulation.js` offers Reply, Verify, Report, Block plus the resolve verbs `[read]` | Forward, Delete and Mark safe absent at every stage | **IMMERSIVE-005**; see §9.5 | MED | 004 |
| 4.8 | Rationale: optional, 250 chars, sanitised, no real secrets | PASS | `ActionSheet.jsx`, `validateRationale()` `[read]` | — | — | — | — |
| 4.9 | Feedback card; **training immediate**, assessment may defer | **MISSING** | Result screen only; `scoreVisible()` has no consumer `[read]` | G1 | **FEEDBACK-001** (unchanged) | HIGH | none |
| 4.10 | Canonical six-stage machine | PASS | `constants/scenarioEngine.js` `[read]` | — | **must not change** | — | — |
| 4.11 | Stage-3 core event `link_hover_ms` | **MISSING** | Declared in three backend files, produced nowhere `[measured]` | No hoverable link exists | **IMMERSIVE-005** | MED | 004 | <!-- IMMERSIVE-003A: still open; no hover telemetry added -->
| 4.12 | Stage-2 "prior-message history" / "thread history" / "prior thread" | **MISSING** | All 100 threads hold exactly one message block (email: one body) `[measured]` | No thread history exists | **IMMERSIVE-003** | **CRITICAL** | none | **[IMMERSIVE-003A: CLOSED for W01-W05; open for the remaining 95]**
| 4.13 | Stage-2 "Read the **full thread** and prior context before acting" | **MISSING** | There is no full thread to read | Same as 4.12 | **IMMERSIVE-003** | **CRITICAL** | none | **[IMMERSIVE-003A: CLOSED for W01-W05; open for the remaining 95]**
| 4.14 | Stage-4 "the interaction **advances to** ..." (all 100) | **PARTIAL** | The consequence surface is pushed, but the conversation itself never advances `[read]` | No in-scenario escalation beats | **IMMERSIVE-003** and **007** | HIGH | 003 | **[IMMERSIVE-003A: CLOSED for W01-W05; open for the remaining 95]**

### §5 Scoring, Randomization and Attempt Rules

| # | Requirement | Status | Evidence | Gap | Task | Pri | Dep |
|---|---|---|---|---|---|---|---|
| 5.1 | Nine scoring events at exact deltas | PASS | `[inherited]` | — | **frozen** | — | — |
| 5.2 | Clamp 0–10 per scenario, sum to 0–100 | PASS | `clampScenarioScore()`, `assertResultIntegrity()` `[read]` | — | the expiry rule reuses this exactly | — | 001 |
| 5.3 | **Exactly 10 resolved scenarios** | PASS | `ATTEMPT_SCENARIO_COUNT`, attempt validator `[read]` | — | **expiry must resolve, not merely stop** | HIGH | 001 |
| 5.4 | Rotating 3/3/2/2 platform allocation | PASS | `[inherited]` | — | **frozen** | — | — |
| 5.5 | 3 Easy / 4 Medium / 3 Hard, one-step relaxation only | PASS | `[inherited]` | — | **frozen** | — | — |
| 5.6 | 8 malicious + 2 legitimate, legitimate from different platforms | PASS | `[inherited]` | — | **frozen** | — | — |
| 5.7 | 2–4 military-context cases | PASS | `[inherited]` | — | **frozen** | — | — |
| 5.8 | At least five psychological triggers | PASS | `[inherited]` | — | **frozen** | — | — |
| 5.9 | No attack family more than twice | PASS | `[inherited]` | — | **frozen** | — | — |
| 5.10 | Exclude the most recent 20 ids; store the seed | PASS | `[inherited]` | — | **frozen** | — | — |
| 5.11 | No adaptive difficulty in scored baseline mode | PASS | the sequence is frozen by a pre-save hook `[read]` | — | **frozen** | — | — |
| 5.12 | Deterministic seed; no `Math.random` in selection | PASS | `seededRandom.js` `[read]` | — | the reveal engine must obey the same rule | HIGH | 003 |
| 5.13 | Persist ledger and result **transactionally** before the next notification | PASS | `withEngineTransaction` `[read]` | — | expiry must be one transaction | HIGH | 001 |
| 5.14 | Interpretation safeguard: no vulnerability labelling | PASS | `REMEDIATION_REASONS` `[read]` | — | expired attempts must not be labelled | HIGH | 001 |
| 5.15 | *(new)* Scoring of a scenario unfinished at expiry | **CLARIFY** | No precedent in the specification | Four options, §5.6 | **IMMERSIVE-001** | **BLOCKER** | client |

### §6 Data, Administration and Acceptance Criteria

| # | Requirement | Status | Evidence | Gap | Task | Pri | Dep |
|---|---|---|---|---|---|---|---|
| 6.1 | LearnerProfile minimum fields | PASS | `[inherited]` | — | — | — | — |
| 6.2 | ScenarioDefinition incl. six states, **expected actions**, feedback, active | **PARTIAL** | `expected_actions` empty on all 100 `[inherited]` | G7 | optional; §9.5 does **not** need it | LOW | — |
| 6.3 | Attempt minimum fields | PASS | `Attempt.js` carries all nine `[read]` | — | **extend additively** with the timer fields | HIGH | 001 |
| 6.4 | ScenarioRun minimum fields | PASS | `ScenarioRun.js` `[read]` | — | — | — | — |
| 6.5 | Event minimum fields incl. the metadata allowlist | PASS | `ScenarioEvent.js` `[read]` | — | — | — | — |
| 6.6 | ProgressSnapshot | PASS | PROGRESS-001 `[inherited]` | — | expired attempts change its inputs — C3 | HIGH | 001 |
| 6.7 | Scenario manager: create/edit/clone/deactivate versioned | **PARTIAL** | Create blocked by `SCENARIO_ID_PATTERN` `[inherited]` | G6 | ADMIN-007 (optional) | LOW | — |
| 6.8 | Validate six stages and asset refs before publishing | PASS | three validation layers `[read]` | — | **must validate enriched threads too** | HIGH | 003 |
| 6.9 | Attempt viewer: filter, scores, action path, remediation, no typed content | PASS | `[inherited]` | — | must surface `end_reason` | HIGH | 001 |
| 6.10 | Exports: offline CSV/PDF to an instructor-selected local path | **PARTIAL** | The path is server configuration, not instructor-chosen `[inherited]` | G9 | must add the `end_reason` columns | MED | 001 |
| 6.11 | Controls: reset incomplete attempt, archive profile, configure feedback timing | **PARTIAL** | `immediate` is not enforced `[read]` | G1 | FEEDBACK-001 | HIGH | none |
| 6.12 | Audit: append-only for publication, resets, exports, configuration | PASS | ADMIN-005 `[read]` | — | **cannot record a system expiry**: `actor_admin_id` is required — §5.8 | HIGH | 001 |
| 6.13 | Release — Content: 100 active, 25 per platform, six stages, scoring, end-state, feedback | PASS | `[inherited]` | — | must re-verify after IMMERSIVE-003 | HIGH | 003 |
| 6.14 | Release — Offline safety with a network monitor | PASS | ACCEPT-002 `[inherited]` | — | re-run after 004/005 | MED | 005 |
| 6.15 | Release — Scoring tests: safe path, every critical unsafe action, false positives, clamping | PASS | `[inherited]` | — | add expiry-path tests | HIGH | 001 |
| 6.16 | Release — **State recovery: close/reopen resumes at the last committed state** | PASS | idempotent `intent_key`, server-authoritative resume `[read]` | — | **the timer must preserve this exactly** | **CRITICAL** | 001 |
| 6.17 | Release — Accessibility: keyboard-only completion, focus, contrast, labels, 200% zoom | **PARTIAL** | zoom, focus and labels verified; keyboard-only completion and contrast never measured `[inherited]` | V2, V3 | **ACCEPT-003**, then re-run after 005 | HIGH | 005 |
| 6.18 | Release — Privacy: no real password/OTP/payment/biometric field | PASS | zero input elements in every local surface `[measured]` | — | **hard constraint on IMMERSIVE-006** — §12 | **CRITICAL** | 006 |
| 6.19 | Release — Consistency under interruption and retry | PASS | one server-authoritative projection `[read]` | — | the multi-tab timer must not break it | HIGH | 001 |

### §7 Results, Feedback and Progress Comparison

| # | Requirement | Status | Evidence | Gap | Task | Pri | Dep |
|---|---|---|---|---|---|---|---|
| 7.1 | Large 0–100 total plus 10 scenario points; avoid pass/fail | PASS | `ResultSummary.jsx` `[read]` | — | — | — | — |
| 7.2 | Behaviour breakdown; distinguish missed threat from false positive | PASS | `classifyOutcome()` `[read]` | — | **needs a fifth class for expiry** — §5.7 | HIGH | 001 |
| 7.3 | Path replay; never display real secrets | PASS | `pathFromEvents()` `[read]` | — | `RUN_EXPIRED` needs a `PATH_LABELS` entry | HIGH | 001 |
| 7.4 | Per-case feedback: disposition, cues, safe response, impact, one habit | PASS | `feedbackFrom()` `[read]` | — | — | — | — |
| 7.5 | Progress: comparable only; trend plus exposure count | PASS | PROGRESS-001 `[inherited]` | — | expired attempts enter the aggregates — **C3** | HIGH | client |
| 7.6 | Remediation: 2–3 families, no diagnosis | PASS | `remediationFor()` `[read]` | — | — | — | — |
| 7.7 | Exit: save, return, **print/export if authorized**, **logout** | **PARTIAL** | No print/export and no logout on the result screen `[read]` | G10 | EXPORT-002 (optional) | LOW | — |

### Appendix A — Scenario Content Authoring Schema

| # | Requirement | Status | Evidence | Gap | Task | Pri | Dep |
|---|---|---|---|---|---|---|---|
| A.1 | identity: id, title, version, platform, owner, review date, active | PASS | `[inherited]` | — | — | — | — |
| A.2 | classification: difficulty, disposition, family, trigger, military, legitimate-control | PASS | `[inherited]` | — | — | — | — |
| A.3 | synthetic content: sender, **message/thread**, reserved link, inert asset ids, **prior context** | **PARTIAL** | 511 assets, all inert, all refs resolve — but the "thread" is one bubble and the "prior context" is a narrator caption `[measured]` | The field is populated; the content does not meet what the field is for | **IMMERSIVE-003** | **CRITICAL** | none |
| A.4 | six stages: UI, **choices**, next states, events | **PARTIAL** | UI, transitions and events on all 100; `expected_actions` empty | G7 | optional | LOW | — |
| A.5 | scoring: codes, deltas, cap, critical flag, expected outcome | PASS | `[inherited]` | — | **frozen** | — | — |
| A.6 | feedback: disposition, signs, impact, action, habit | PASS | `[inherited]` | — | — | — | — |
| A.7 | quality: reviewers, safety, accessibility, pilot | N/A | authoring-process metadata for post-handoff scenarios | — | **populate for every enriched scenario** | HIGH | 003 |
| A.8 | Definition of done, incl. **"verification does not leak the answer"** | PASS | `[inherited]` | — | **the anti-oracle bar for IMMERSIVE-005** — §9.4 | **CRITICAL** | 005 |

### New requirement lines from the client's 9 September direction

| # | Requirement (client, verbal) | Status | Evidence | Gap | Task | Pri | Dep |
|---|---|---|---|---|---|---|---|
| N.1 | Assessment duration is 90 minutes | **MISSING** | Absent from **every** client document `[measured]` | Entire feature; amends specification v1.0 | IMMERSIVE-001 | **CRITICAL** | client |
| N.2 | Timer begins when the assessment starts | MISSING | `Attempt.started_at` exists; nothing derives a deadline `[read]` | — | IMMERSIVE-001 | CRITICAL | N.1 |
| N.3 | Timer authoritative from backend/server state | MISSING | No server clock authority for an attempt `[read]` | — | IMMERSIVE-001 | CRITICAL | N.1 |
| N.4 | Refresh must not reset the timer | MISSING | Nothing to reset yet; the resume architecture already supports it `[read]` | — | IMMERSIVE-001 | CRITICAL | N.1 |
| N.5 | Browser close must not reset the timer | MISSING | As N.4 | — | IMMERSIVE-001 | CRITICAL | N.1 |
| N.6 | Reopening reconnects to the same attempt if within 90 minutes | **PARTIAL** | `resume()` already reconnects to any in-progress attempt, with no time bound `[read]` | Needs the bound | IMMERSIVE-001 | CRITICAL | N.1 |
| N.7 | The assessment ends automatically at expiry | MISSING | `completeAttempt()` **refuses** unless all ten runs are resolved (`SCENARIOS_OUTSTANDING`) `[read]` | Needs a separate expiry path | IMMERSIVE-001 | CRITICAL | N.1 |
| N.8 | Result generated automatically by backend logic at expiry | MISSING | `buildAttemptResult()` requires `status === 'completed'`; `assertResultIntegrity()` requires all ten runs resolved with a valid score `[read]` | Expiry must resolve every run | IMMERSIVE-001 | CRITICAL | 5.15 |
| N.9 | No client-side manipulation may extend the assessment | MISSING | `assertNoAuthoritativeInput()` exists and is the right hook `[read]` | Add the timer fields to `FORBIDDEN_INPUT` | IMMERSIVE-001 | CRITICAL | N.1 |
| N.10 | Multiple tabs must not create multiple timers | MISSING | No timer; by design no client timer will be authoritative | — | IMMERSIVE-001 | HIGH | N.1 |
| N.11 | The timer survives a frontend reload | MISSING | As N.4 | — | IMMERSIVE-001 | CRITICAL | N.1 |
| N.12 | The timer survives an application restart | MISSING | Needs a boot-time recovery sweep | — | IMMERSIVE-001 | CRITICAL | N.1 |
| N.13 | Backend/database is the single source of truth | PASS *(architecturally)* | Nothing authoritative in `localStorage` or `sessionStorage`; `useAttemptController` re-reads the server `[read]` | The timer must not break this | IMMERSIVE-001 | CRITICAL | N.1 |
| N.14 | Menu actions unavailable during an active assessment | **CLARIFY** | §3 **requires** all four items `[read]` | A direct conflict between the client's verbal request and their own written specification | IMMERSIVE-002 | HIGH | client |
| N.15 | It must not feel like a quiz or an MCQ | **ENHANCE** | `ActionSheet` is a flat list of labelled buttons beside the device `[read]` | §1's own "Action, not quiz" row | IMMERSIVE-005 | HIGH | 004 | **[IMMERSIVE-003A: CLOSED for W01-W05; open for the remaining 95]**
| N.16 | Evolving conversations | MISSING | One bubble per scenario, 100/100 `[measured]` | — | IMMERSIVE-003 | CRITICAL | none | **[IMMERSIVE-003A: CLOSED for W01-W05; open for the remaining 95]**
| N.17 | Delayed follow-up messages | MISSING | No time-based reveal exists inside a scenario `[read]` | — | IMMERSIVE-007 | HIGH | 003 |
| N.18 | Multi-message persuasion | MISSING | As N.16 | — | IMMERSIVE-003 | CRITICAL | none | **[IMMERSIVE-003A: CLOSED for W01-W05; open for the remaining 95]**
| N.19 | Contextual notifications, inbox changes, unread indicators | **PARTIAL** | Toast, badge and unread pill exist for the active item only `[read]` | No inbox to change | IMMERSIVE-004 | HIGH | 003 |
| N.20 | Realistic callbacks inside the simulation | **PARTIAL** | A `call_screen` asset exists on 8 scenarios; no timer, no captions `[measured]` | §4.5 | IMMERSIVE-006 | MED | 005 |
| N.21 | Attachment arrivals | **PARTIAL** | 12 scenarios carry a file asset; it never *arrives*, it is simply present `[measured]` | — | IMMERSIVE-007 | MED | 003 |
| N.22 | Conversation history | MISSING | As N.16 | — | IMMERSIVE-003 | CRITICAL | none | **[IMMERSIVE-003A: CLOSED for W01-W05; open for the remaining 95]**
| N.23 | Multiple actors | MISSING | One sender profile per scenario, 100/100 `[measured]` | — | IMMERSIVE-003 | HIGH | none | **[IMMERSIVE-003A: CLOSED for W01-W05; open for the remaining 95]**
| N.24 | Escalation over time | MISSING | As N.17 | — | IMMERSIVE-007 | HIGH | 003 |
| N.25 | Interruption from another platform | MISSING | One platform per run | True cross-platform interruption would need engine work | **defer** — §10.5 | LOW | client |
| N.26 | Linked narrative between communications | **CLARIFY** | Selection is a nine-constraint solver over independent scenarios `[read]` | Hard co-selection would break the §5 quotas and §7 comparability | §10; defer | LOW | client |
| N.27 | Trust established before the malicious request | MISSING | W22 "Long-Game Online Friendship" is one bubble `[measured]` | — | IMMERSIVE-003 | CRITICAL | none |
| N.28 | Believable operational context | **PARTIAL** | Senders are "Unknown" or generic; the trusted directory is the same "Unit Falcon Support Desk" on all 100 `[measured]` | No shared world | IMMERSIVE-003 | HIGH | none |
| N.29 | Decisions influence later presentation, not scoring | **PARTIAL** | `consequence` already does exactly this, for one screen `[read]` | Could extend to the thread | IMMERSIVE-007 | MED | 003 |
| N.30 | Synthetic office workflows | MISSING | No inbox, calendar or document surface beyond the scenario's own assets `[read]` | — | IMMERSIVE-004 | MED | 003 |
| N.31 | An instructor must see a timed-out attempt as such | MISSING | No `end_reason` field | — | IMMERSIVE-001 | HIGH | 001 |
| N.32 | An expired attempt must not block the learner's next attempt | **PARTIAL** *(latent bug)* | `createAttempt()` refuses when an in-progress attempt exists — with no deadline, an abandoned attempt blocks that learner **permanently** until an instructor resets it `[read]` | Pre-existing; the timer makes it far more likely | IMMERSIVE-001 | HIGH | 001 |
| N.33 | The learner must see how long is left | MISSING | — | §3.4 asks for *elapsed*, not remaining | IMMERSIVE-001 | HIGH | 001 |
| N.34 | A warning before expiry | MISSING | — | Not specified; recommended, §5.9 | IMMERSIVE-001 | MED | 001 |
| N.35 | Realism must not come from harvesting sensitive data | PASS | Zero input, textarea, form and href elements in every local surface `[measured]` | — | **hard constraint**, §12 | CRITICAL | 006 |

---

## 5. The 90-minute authoritative timer

### 5.1 Status of the requirement

**This requirement is not in specification v1.0.** Verified by full-text search across every
client artefact in the repository. It is therefore an **amendment**, and this section is
written as an amendment proposal: it extends the §6 `Attempt` minimum without altering any
of its nine named fields, and it preserves every §5 and §6 rule that touches an attempt.

Two consequences follow, and both matter commercially:

1. The client should confirm the amendment **in writing**, including the duration value and
   the timeout-scoring rule (§21, C1–C3). The scoring rule changes what a 0–100 result
   *means*, and §7 comparability depends on that meaning being stable across attempts.
2. Any attempt created before the amendment has no deadline. The design must therefore treat
   a missing `expires_at` as "no deadline" rather than "expired at the epoch" — see §5.4.

### 5.2 Data model

**Additive only. No existing field changes type, default, index or meaning. No migration of
existing documents is required.**

On `Attempt` (`backend/src/models/Attempt.js`):

| Field | Type | Rule |
|---|---|---|
| `duration_ms` | Number | Required for new attempts, default `ASSESSMENT_DURATION_MS` (5,400,000). **Immutable after creation** via the existing `pre('save')` freeze hook, alongside `seed` and `scenario_sequence`. Pinning it per attempt is what stops a later configuration change retro-extending or retro-shortening a running assessment. |
| `expires_at` | Date | Required for new attempts. Computed **server-side inside the creation transaction** as `started_at + duration_ms`. Immutable. Stored rather than derived so the sweeper query is indexable and the deadline is auditable. The invariant `expires_at - started_at === duration_ms` is asserted in `pre('validate')`. |
| `end_reason` | String enum | `null` while running. One of `learner_completed`, `expired`, `instructor_reset`. Written exactly once, in the same transaction that sets `status`. |
| `expired_at` | Date | `null` unless `end_reason === 'expired'`. The server clock at the moment expiry committed — which is at or after `expires_at`, never before, and the difference is the enforcement latency. Recording both makes that latency measurable rather than invisible. |
| `unresolved_at_expiry` | Number | `null` unless expired. How many runs the expiry had to resolve. The instructor's single most useful number: it separates "scored 42 having worked all ten" from "scored 42 having reached scenario six". |

Backfill for the existing production attempts: **none.** `expires_at: null` means "no
deadline", every guard treats `null` as never-expiring, and the two historical attempts
finish or remain exactly as they are. `instructor_reset` is written only by new resets; old
abandoned attempts keep `end_reason: null` and remain interpretable from `status`.

New index: `attemptSchema.index({ status: 1, expires_at: 1 })`. It serves exactly one query —
the sweeper's — and adds one small index to a collection that will hold hundreds of documents
on a standalone machine.

Configuration (`backend/src/constants/assessment.js`, or a new `constants/attemptTiming.js`):

```
ASSESSMENT_DURATION_MS      = 90 * 60 * 1000     // the client's 90 minutes
ASSESSMENT_DURATION_MIN_MS  = 15 * 60 * 1000     // server-side clamp floor
ASSESSMENT_DURATION_MAX_MS  = 240 * 60 * 1000    // server-side clamp ceiling
EXPIRY_SWEEP_INTERVAL_MS    = 30 * 1000
EXPIRY_WARNINGS_MS          = [10 * 60 * 1000, 2 * 60 * 1000]
```

If the duration is later made instructor-configurable, it belongs in the existing
`Configuration` model that ADMIN-004 already owns: read at attempt creation, clamped between
the two bounds, audited under the existing `CONFIG_CHANGED` action, and **pinned onto the
attempt**. That path needs no new audit vocabulary. It is deliberately *not* in the first
task.

`Attempt.toCandidateJSON()` gains three keys and nothing else:

```
expires_at        // ISO, or null
server_now        // ISO, the server clock at projection time — the skew reference
end_reason        // null while running
```

`server_now` is what makes a client countdown honest: the browser computes
`offset = Date.parse(server_now) - Date.now()` **once**, then renders
`expires_at - (Date.now() + offset)`. A machine whose local clock is wrong still shows the
right remaining time, and no tab can disagree with another because they share one
`expires_at`.

### 5.3 Where expiry is enforced — three layers

**Layer 1 — lazy guard (primary; correctness does not depend on any background job).**

A service helper `assertAttemptLive(attempt)` runs at the top of every route that reads or
mutates a live attempt: `POST /attempts`, `GET /attempts/current`, `GET /:id/current-run`,
`POST /:id/runs/:runId/events`, `POST /:id/runs/:runId/resolve`, `POST /:id/complete`. If
`attempt.status === 'in_progress'` and `expires_at` is non-null and `Date.now()` is at or
past it, the helper calls `expireAttempt(attempt._id)` and then answers according to the
route:

- mutating routes: `409 ATTEMPT_EXPIRED` with `{ attempt_id, result_available: true }`
- `GET /current-run`: the completed attempt projection with `current_run: null`, which the
  existing reducer already handles through its completion-gateway path
- `GET /attempts/current`: the completed attempt, which drives the frontend to the result

This layer alone satisfies N.3, N.4, N.5, N.6, N.9, N.11 and N.13. Even with the sweeper
disabled, a learner cannot act after the deadline.

**Layer 2 — sweeper (required for N.7: "ends automatically", browser closed).**

`startExpirySweeper()` in `server.js`: a single `setInterval(EXPIRY_SWEEP_INTERVAL_MS)` for
the whole process, cleared on `SIGINT` and `SIGTERM`. Each tick reads

```
Attempt.find({ status: 'in_progress', expires_at: { $ne: null, $lte: new Date() } })
       .select('_id').limit(50)
```

then calls `expireAttempt(id)` for each. Bounded by `limit(50)` so a pathological backlog
cannot monopolise the event loop. Failures are logged and retried on the next tick; the
function is idempotent, so a retry costs nothing.

**Layer 3 — startup recovery (N.12: survives an application restart).**

The same sweep runs **once**, immediately after the Mongo connection is established and
before the server accepts requests. This is what makes "the machine was switched off for two
hours" correct: the deadline is an absolute stored timestamp, not elapsed-since-boot, so
every overdue attempt is expired on the next start with no special case.

### 5.4 Attempts with no deadline

`expires_at: null` is a first-class state, not a bug: it is what the two existing production
attempts hold, and what any attempt created before the amendment holds. Every guard and the
sweeper query both require `expires_at: { $ne: null }`. A null-deadline attempt behaves
exactly as it does today. **No historical data is reinterpreted.**

### 5.5 The expiry transaction

One transaction, using the existing `withEngineTransaction` helper and the existing
`{w:1, j:true}` boundary from master-plan 15.25. At most 21 documents: one attempt, up to ten
runs and up to ten events.

```
expireAttempt(attemptId):
  await assertTransactionSupport()
  { result } = await withEngineTransaction(async (session) => {
    // The guard IS the concurrency control. Re-read under the session.
    fresh = await Attempt.findOne({
      _id: attemptId, status: 'in_progress',
      expires_at: { $ne: null, $lte: new Date() },
    }).session(session)
    if (!fresh) return { changed: false }        // someone else won, or not due

    now  = new Date()
    runs = await ScenarioRun.find({ attempt_id: fresh._id, status: { $ne: 'resolved' } })
                            .sort({ ordinal: 1 }).session(session)

    for (const run of runs) {
      seq = run.last_sequence + 1
      await ScenarioEvent.create([{
        run_id: run._id, sequence: seq,
        event_code: 'RUN_EXPIRED',              // engine telemetry, zero points
        stage: run.current_stage,
        points_delta: 0,
        intent_key: `expiry:${fresh._id}:${run._id}`,   // deterministic, therefore idempotent
        server_ts: now,
        metadata: { intent: 'expire', transition: `${run.current_stage}->end`,
                    resolution_code: 'resolve_expired' },
      }], { session, ordered: true })

      run.last_sequence = seq
      run.status        = 'resolved'
      run.score_0_10    = clampScenarioScore(run.score_running)   // the §5 rule, unchanged
      run.outcome_code  = 'resolve_expired'
      run.resolved_at   = now
      run.last_event_at = now
      await run.save({ session })
    }

    all = await ScenarioRun.find({ attempt_id: fresh._id }).session(session)
    fresh.status               = 'completed'
    fresh.completed_at         = now
    fresh.expired_at           = now
    fresh.end_reason           = 'expired'
    fresh.unresolved_at_expiry = runs.length
    fresh.total_score          = all.reduce((s, r) => s + (r.score_0_10 ?? 0), 0)
    await fresh.save({ session })

    return { changed: true, attempt: fresh, expired: runs.length }
  })

  if (result.changed) await refreshProgressAfterCompletion(result.attempt.profile_id)
  return result
```

Note the deliberate reuse: `clampScenarioScore` is the engine's own resolution rule, and
`refreshProgressAfterCompletion` is called **outside** the transaction exactly as
`completeAttempt` already does it, for exactly the reason recorded in that function's comment
— the snapshot must never be able to abort a transition that has already succeeded.

`intent_key` is deterministic rather than random. `ScenarioEvent.intent_key` carries a unique
index, so a concurrent second expiry collides on the index and aborts instead of writing a
duplicate ledger entry — the same idempotency mechanism the hot path already relies on.

### 5.6 Scoring of unfinished scenarios at expiry — four options

| # | Option | Consequence | Verdict |
|---|---|---|---|
| **A** | **Clamp `score_running` as at expiry** — `score_0_10 = clamp(score_running, 0, 10)` | Reuses the engine's existing resolution rule verbatim. A never-opened run holds `score_running = 0` and scores **0** naturally. A partially worked run keeps evidence it genuinely earned (for example `INSPECT_CONTEXT +2`) but cannot earn `RESOLVE_CORRECT +2`, so it is materially penalised relative to a finished one. No new scoring rule is invented; §5's "positive evidence is earned" and "clamp each scenario to 0–10" both hold exactly. | **RECOMMENDED** |
| B | Force `score_0_10 = 0` for every unresolved run | Simple and harsh. Contradicts §5's "positive evidence is **earned**" by confiscating points the ledger shows were earned, and makes the score irreproducible from the ledger — breaking `verifyRunIntegrity()`'s guarantee that the cached score always matches a replay. | Rejected |
| C | Set the attempt `abandoned` and produce no result | Contradicts the client's explicit "result generation should happen automatically". Also collides with `abandoned`, which `instructorControlService` already owns for resets, making a timeout indistinguishable from an instructor action in every query and export. | Rejected |
| D | Score only the resolved runs, out of `10 x resolved` | Breaks §5's "sum 10 scenarios for a 0–100 attempt score", makes totals non-comparable between attempts, and therefore breaks §7's comparability gate — the one thing §7 is most explicit about. | Rejected |

**Recommendation: A.** It is the only option that requires no new scoring semantics, keeps
the ledger the authoritative source, and leaves `assertResultIntegrity()` passing unchanged.

**This still needs client sign-off** (§21, C2). Option A means a learner who reaches scenario
six and stops can score, say, 34/100 rather than 0/100 — which is *fairer*, but is a policy
choice about what a timed-out result represents.

### 5.7 Result projection at expiry

Three additive changes, in `constants/resultProjection.js` and its two consumers:

1. **`PATH_LABELS.RUN_EXPIRED = { stage: 'resolve', action: 'time_ran_out' }`.** Without it
   the code is silently dropped from the path replay (the map's documented behaviour for an
   unmapped code) and the learner sees a timeline that simply stops with no explanation.
2. **A fifth outcome class `NOT_RESOLVED: 'not_resolved'`,** plus an early return in
   `classifyOutcome()` when `outcomeCode === 'resolve_expired'`. Without it the existing
   logic classifies an expired **legitimate** scenario as `FALSE_POSITIVE` — which is
   factually wrong: the learner never reported anything. §7 requires the breakdown to
   "distinguish missed threat from false positive"; a fifth honest bucket strengthens that
   distinction rather than weakening it.
3. **The result screen must state it.** A banner: *"This assessment ended when the 90-minute
   limit was reached. N scenarios were not completed and scored what had been earned at that
   point."* Blame-free and factual, consistent with §5.14's interpretation safeguard, which
   specifically forbids inferring anything about the person from the outcome.

`assertResultIntegrity()` needs **no change**: after `expireAttempt`, all ten runs are
resolved with integer scores in range and `total_score` equals their sum.

### 5.8 Audit logging — the constraint, and the recommendation

`AuditEvent` requires `actor_admin_id` (ObjectId) **and** `actor_username` (String), both
immutable. `AUDIT_ACTIONS` is a closed vocabulary and `auditService` rejects anything outside
it. **A system-initiated expiry has no admin actor and therefore cannot be written to the
audit log without changing the model.**

| Option | Effect | Verdict |
|---|---|---|
| **A — do not audit; record on the entities** | `Attempt.end_reason`, `expired_at` and `unresolved_at_expiry`, plus one `RUN_EXPIRED` ledger entry per run. §6's audit remit is explicitly *"administrative changes"*, and `constants/auditLog.js` states in its own header that the log records administrative changes "never anything a learner does" — the learner's record is the `ScenarioEvent` ledger. An expiry is a lifecycle event of an attempt, not an administrative act. | **RECOMMENDED** |
| B — add `ATTEMPT_EXPIRED` and a `system` actor | More visible to an instructor browsing the audit page, but it widens a deliberately closed vocabulary and requires relaxing two required, immutable fields — weakening the append-only guarantees ADMIN-005 was built to provide. | Only if the client asks |

With option A, instructor visibility is delivered where it belongs: the **attempt viewer**
(ADMIN-002) and the **exports** (ADMIN-003) read `end_reason` and `unresolved_at_expiry`
directly. Both are additive read-path changes with no audit-model impact.

### 5.9 Frontend behaviour

**One timer object for the whole page.** `AttemptHeader.ElapsedTime` already runs a
one-second `setInterval`. Extend that component rather than adding a second interval; §15
explains why this matters for a 90-minute session.

**The countdown decides nothing.** When it reaches zero the component does not end anything —
it calls `controller.retry()` (the existing resume path), the server answers with the
completed attempt, and the page navigates to the result. If the browser clock is wrong the
skew correction handles it; if the call fails, the next user action hits the lazy guard.
**There is no code path in which the browser ends an assessment.**

**Display.** §3 requires *elapsed* time; the client requires a deadline. Show both:
`Elapsed 41:12 · 48:48 remaining`. Remaining time uses `tabular-nums` (already the house
style) so digits do not jitter.

**Warnings.** Non-blocking banners at ten minutes and two minutes remaining, announced
through a `role="status"` (polite) live region. **Never a modal.** A modal at two minutes
would seize focus from the decision the learner is making, which is both an accessibility
failure and a measurement failure — it would change the behaviour being assessed.

**Multi-tab.** Every tab derives its countdown from the same server `expires_at`. No tab
writes anything. `localStorage` is not used, consistent with the existing rule that nothing
authoritative is cached client-side.

### 5.10 What the timer must not break

| §6 pass condition | How the design preserves it |
|---|---|
| "Closing/reopening resumes at the last committed state without duplicating points or skipping events" | The deadline lives in the database. Reopening within the window resumes exactly as today; reopening after it lands on the result. Expiry writes each run's ledger entry exactly once under a unique `intent_key`. |
| "Badge, toast, app list, thread and backend state remain synchronized under interruption and retry" | Expiry is one transaction; every surface re-reads `attemptStateFor()`, which is still the single projection. |
| §5 "Exactly 10 resolved scenarios" | Expiry **resolves** every outstanding run. An expired attempt still holds ten resolved runs. |
| §5 "Persist event ledger and scenario result transactionally" | One `withEngineTransaction` covering the attempt, its runs and their events. |
| §5.14 interpretation safeguard | The result states the fact ("the limit was reached"), never an inference about the learner. |

### 5.11 Recovery after a crash

The deadline is an absolute stored timestamp. A crash mid-expiry leaves the transaction
aborted, so the attempt is still in progress and still overdue — the next sweeper tick, or
the startup sweep, redoes it. Because `intent_key` is deterministic, a partially applied
retry cannot double-write a ledger entry. **The failure mode is "expiry happens a little
late", never "expiry happens twice" and never "expiry is lost".**

---

## 6. The assessment profile menu

### 6.1 What the specification says

§3, Learner row, verbatim:

> "Profile chip — Display name + masked service number; **menu contains attempt history,
> accessibility, restart (instructor-controlled) and logout.**"

That is a requirement to *contain* four named items. The implementation
(`AttemptHeader.jsx`, `LearnerMenu`) matches it exactly, in the specified order, and the code
comment cites the row. **The menu is correct as specified.**

The client's concern is nevertheless valid, and it is a concern about *consequence*, not
presence: two of the four items currently let a learner leave a live assessment.

### 6.2 Answers to the six questions

**1. Should the menu disappear entirely? — No.** §3 requires it. Removing it would be the
first place the implementation deliberately contradicts the specification, and the client's
own document is the authority the project has used to settle every prior ambiguity.

**2. Should only accessibility remain? — No,** for the same reason. Accessibility must
*never* be gated (§6's release checklist requires accessibility throughout, and an
accommodation that disappears under time pressure is not an accommodation), but the other
three are equally required to be present.

**3. Should logout be disabled? — No; it should be confirmed.** Logout must exist: §3 lists
it and §7 requires "Logout for the next learner" on exit. Its current behaviour is already
correct and specification-compliant — `signOut()` clears the session cookie; the attempt
stays in progress server-side and resumes on the next login, which is precisely §6's
"Closing/reopening resumes at the last committed state". What is missing is **honesty about
the consequence**, and the timer makes that mandatory. Recommended: a confirmation dialog
stating in plain words that the attempt is not ended, that it will be waiting on the next
sign-in, and — once the timer exists — **that the 90-minute clock keeps running while signed
out.** Without that sentence, logout becomes a trap.

**4. Should history be inaccessible until completion? — No; it should stop being a
navigation.** "Attempt history" currently calls `navigate(ROUTES.HISTORY)`, which unmounts
the assessment. Nothing is lost (the state is server-side), but leaving the assessment shell
mid-scenario for an unbounded period is an integrity concern once a deadline exists.
Recommended: render history as a **read-only panel inside the assessment shell**, in the same
`Modal` primitive the other three support surfaces already use, showing only **completed**
attempts and explicitly excluding the one in flight. §3 asks that the menu "contains attempt
history"; it does not require that item to navigate anywhere. This satisfies the
specification and the client's concern simultaneously, and costs one component rather than a
route change.

**5. Should restart exist only for instructors? — Yes, and it already does.** §6 lists "Reset
an incomplete attempt" as an *instructor* capability; `RestartDialog` explains this and
performs no action, and `instructorControlService.resetAttempt()` is the only code path that
can actually reset. The one improvement worth making is in the menu label itself: "Restart
assessment" reads like an available action. Recommended label: **"Restarting (instructor
only)"**, which carries §3's own parenthetical "(instructor-controlled)" into the place the
learner actually looks.

**6. What happens if the learner closes the browser? — Nothing is lost, and nothing pauses.**
§6 already answers the first half: "Closing/reopening resumes at the last committed state
without duplicating points or skipping events." The timer answers the second: the deadline is
absolute, so closing the browser does not stop it (N.5). Recommended handling:

- **No `beforeunload` blocker.** Browsers show a generic, non-customisable message; it cannot
  state the actual consequence, it is an accessibility irritant, and it prevents nothing.
- **State it where it can actually be read:** in the Rules panel (which §3 already places in
  the support zone and which is reachable at every stage), and in the logout confirmation.
- **Make reopening obvious:** the dashboard already renders "Resume Assessment" when an
  attempt is live. Once the timer exists it should also show the remaining time on that
  card, so a learner returning after a break knows immediately where they stand.

### 6.3 Summary of the recommended menu

| Item | Present during an assessment? | Behaviour change |
|---|---|---|
| Attempt history | Yes (§3 requires it) | Becomes an in-shell read-only panel. Completed attempts only; the live one excluded. No navigation away. |
| Accessibility | Yes | **Unchanged. Never gated, never confirmed, never delayed.** |
| Restart (instructor-controlled) | Yes (§3 requires it) | Unchanged behaviour. Relabelled to make instructor ownership visible in the menu. |
| Log out | Yes (§3 and §7 require it) | Gains a confirmation stating that the attempt continues, is resumable, and that the clock keeps running. |

**Explicitly rejected:** hiding the menu, disabling items, and a `beforeunload` blocker. All
three either contradict §3 or fail to deliver what they appear to promise.

---

## 7. Immersive scenario architecture

### 7.1 The objective, restated as an engineering target

The client's phrasing — *"the learner should feel like events are naturally happening around
them"* — becomes three testable properties:

1. **Nothing in the fiction addresses the learner as a test subject.** No third-person
   narration inside a conversation. No caption explaining what is happening.
2. **The situation has a past.** Every thread opens with history that makes the current
   message legible, and that history is where the cues live.
3. **The situation moves.** Something arrives, changes or escalates while the learner is
   deciding, at a pace that is deterministic and reproducible but not metronomic.

### 7.2 What is actually in the bank today — measured

Parsed from `backend/data/synthetic/v1/synthetic.{whatsapp,instagram,email,sms}.json`,
100 documents:

```
TOTAL SCENARIOS 100

ASSET KINDS
  notification              100      browser_page     42
  sender_profile            100      payment_screen   38
  message_thread            100      file             12
  trusted_directory_entry   100      call_screen       8
                                     install_screen    6
                                     qr_payload        5

ASSETS PER SCENARIO        min 4 · max 7 · mean 5.11
THREAD BLOCK TYPES         note 100 · message 75 · emailHeader 25 · emailBody 25

MESSAGE BUBBLES PER SCENARIO
   0 bubbles :  25 scenarios   (all 25 email — one emailBody instead)
   1 bubble  :  75 scenarios

SCENARIOS CONTAINING A THIRD-PERSON NARRATOR "note" BLOCK : 100 / 100
PER-PLATFORM MEAN BUBBLES : whatsapp 1.0 · instagram 1.0 · sms 1.0 · email 0.0
SENDER PROFILES PER SCENARIO : 1 / 1 on all 100
```

W01's entire conversation, verbatim from the database:

```json
"blocks": [
  { "type": "note",    "text": "An unknown number apologizes for entering the learner's number by mistake." },
  { "type": "message", "from": "them",
    "text": "I sent a 6-digit code to you by mistake. Please send it back now.", "time": "11:29" }
]
```

### 7.3 Why the bank looks like this — and why that is not a criticism of DATA-003

`backend/scripts/generateSyntheticContent.js:149` documents the decision honestly:

> "The client's narration is a `note` because it is third-person description, not dialogue;
> the only genuine message text the specification gives is the notification body."

That is correct. The PDF's stage-2 column is a **description of the situation for the
developer**, not dialogue for the learner, and DATA-003 refused to invent dialogue and
present it as client content. The generator was right to stop there. **What is missing is the
authoring step that was always going to be needed after it** — turning each described
situation into the thread the specification's own stage-2 UI column requires
("prior-message history", "thread history", "prior thread").

This reframes the whole initiative: it is **content authoring against an existing
specification requirement**, executed inside the existing schema, not a redesign.

### 7.4 Nine realism dimensions, scored against the current bank

| Dimension | Today | Evidence | Target |
|---|---|---|---|
| Story quality | **2/10** | One bubble plus a narrator caption | A situation with a beginning |
| Realism of surface | **7/10** | The UI-002 renderers are genuinely app-like | 9 — chrome gaps in §4.2 and §4.5 |
| Continuity | **1/10** | 0/100 threads have any history | Every thread opens mid-relationship |
| Emotional pressure | **3/10** | The trigger is classified in metadata but never *enacted* | Pressure built over messages |
| Authority pressure | **3/10** | Sender display names are "Unknown" or generic | A named, consistent, plausible chain of command |
| Urgency | **4/10** | Urgency asserted in one sentence ("in 30 minutes") | Urgency that *increases* while deciding |
| Trust building | **1/10** | W22 "Long-Game Online Friendship" is one message | Benign exchanges before the ask |
| Escalation | **1/10** | The consequence surface is the only escalation | Multi-beat within one scenario |
| Interaction depth | **2/10** | `actions={[]}` — the app is inert | Decisions taken on the device |

**Aggregate: the product is an excellent assessment engine wrapped around content that has
not yet been written up to the specification's own stage descriptions.**

### 7.5 The architecture: an immersion layer, not a rewrite

Four layers. **Only layer 1 writes to the database, and it writes content, not schema.**

```
+-----------------------------------------------------------------+
| L4  INTERACTION      device affordances -> EXISTING intents      |  frontend only
|     tap link · tap header · tap attachment · overflow · composer |
+-----------------------------------------------------------------+
| L3  SCENE DIRECTOR   deterministic timed reveal of blocks        |  frontend only
|     typing -> message -> pause -> follow-up                      |
+-----------------------------------------------------------------+
| L2  RENDERERS        new block types: typing, forwarded,         |  frontend only
|     quotedReply, unreadDivider, dateSeparator, voiceNote         |
+-----------------------------------------------------------------+
| L1  CONTENT          enriched synthetic.assets: multi-block      |  data only
|     threads · personas · background inbox items                  |  (no schema change)
+-----------------------------------------------------------------+
        v unchanged, and untouched by every layer above v
   ScenarioDefinition schema · six-stage engine · scoring · selection
   taxonomies · event ledger · attempt/run models · result projection
```

**Why no schema change is needed for L1.** `assetSchema.content` is `Schema.Types.Mixed` and
`synthetic.assets` is an unbounded array. A twelve-block thread, five background threads and
three sender profiles are all storable today. The **only** constant that must be extended is
`ASSET_KINDS`, to admit a `background_thread` kind — one array in
`constants/scenarioDefinition.js`, additive, with no effect on any existing document.

**Why no engine change is needed for L3 and L4.** The engine's contract is
`(runId, intent, intentKey, expectedStage)`. It has no opinion about which pixel produced the
intent, and `resolveIntent()` is a pure function of the pinned definition and the stage. A tap
on a link bubble submits `open_link` exactly as the side-panel button does today — same
intent, same idempotency discipline, same response.

**Why no scoring change is needed.** Points come from the scenario's own
`evaluation.stages[].scoring`, which the immersion work does not touch. Richer content changes
what the learner *sees*, never what an action is *worth*.

### 7.6 What the enriched content looks like

W01 today is two blocks. W01 enriched is seven to nine blocks, carrying the same cues, the
same disposition and the same six stages:

```
dateSeparator   "Today"
message  them   "Hello?"                                          09:12
message  them   "Sorry — is this 8xxxxx4821?"                     09:13
typing   them                                    (reveal-gated, 1.4s)
message  them   "I was setting up an account and put in the
                 wrong number. A 6-digit code came to you."       09:14
message  them   "Can you send it across? It's for my own
                 account, it just went to the wrong phone."       09:14
systemNotice    "Your code is 4****8. Do not share this code
                 with anyone."                    (stage 4 reveal)
typing   them                                    (stage 4, 2.1s)
message  them   "Please, I only have a few minutes before it
                 expires"                         (stage 4 reveal)
```

Every cue the assessment depends on is *still there* and is now **observable rather than
asserted**: the number is unsaved, there are no mutual groups, the platform's own warning
appears in the thread, and the request is for a code the sender cannot legitimately need. The
narrator caption is gone. The learner is not told that someone is claiming a mistake — they
watch it happen.

**The authoring rules this must follow** (they belong in the task's definition of done):

1. **No block may state the disposition, the difficulty, the family or the trigger.**
2. **The cue set may not change.** Every cue named in `evaluation.feedback.cues` must remain
   observable, and no *new* decisive cue may be added — that would change the difficulty
   calibration §1 fixes at 8/9/8 per platform.
3. **Legitimate scenarios get the same enrichment budget as malicious ones.** If malicious
   threads gain six blocks and legitimate threads gain two, block count becomes a disposition
   oracle. **The distribution of block counts must be statistically indistinguishable between
   the 80 and the 20** — and that must be an automated test, not a reviewer's promise.
4. **All content stays synthetic and reserved:** `.example` and `training.local` hosts,
   `+91 00000` numbers, generated identities. The existing offline-safety validator in
   `scenarioDefinitionImportService` already enforces this and must pass unchanged.
5. **Appendix A's `quality` block must be populated** for every enriched scenario — content,
   technical and instructional reviewer, safety check, accessibility check, pilot status. It
   is currently null on all 100 because the bank was client-supplied; enriched content is
   authored after handoff and Appendix A requires the gate.

### 7.7 The scene director (L3)

A pure module `frontend/src/state/sceneDirector.js` plus a `useSceneDirector` hook, built to
exactly the constraints `dashboardOrchestrator.js` already established and proved:

- **Deterministic.** Reveal delays are FNV-1a over `${run_id}:${assetId}:${blockIndex}` — the
  same hash `deliveryDelayMs()` uses. `Math.random` is forbidden in this path, as it is in
  selection (§5.12).
- **Server-derived.** Which blocks are eligible comes from `run.current_stage` and
  `run.last_sequence`, both server-owned. The director selects and paces; it never invents.
- **Idempotent on reload.** Blocks are keyed by `(runId, assetId, index)`. On mount, any block
  whose stage gate has already passed renders **immediately** — no replay of a four-message
  build-up the learner already watched. This is the same rule `awaitingDelivery()` applies to
  the notification, for the same reason.
- **It cannot advance a stage.** It has no access to `controller.submit`. The worst a broken
  director can do is show everything at once — which is exactly today's behaviour, so the
  failure mode is a graceful degradation to the current product.
- **Respects `prefers-reduced-motion`.** Under that media query, typing indicators are
  suppressed and every block renders immediately. The stylesheet already declares the query
  (`styles/index.css:240`).
- **Bounded.** Total scripted reveal per stage is capped (recommended six seconds) so a
  learner is never waiting on a machine, and every pending reveal has a "Show everything"
  escape that is keyboard-reachable and is the accessible default under reduced motion.

### 7.8 Background inbox items (L1 and L4)

§3's *"If the learner opens the wrong app, show only benign background items"* is currently
unimplemented and is also the cheapest way to make the environment feel inhabited.

Design: a small, versioned, **attempt-independent** set of benign synthetic items — three to
five per platform — stored as `background_thread` assets in their own data file, never
referenced by any scenario's `stage_asset_refs`, never scoreable, never openable into a
decision.

Critical safety property: **background items must be identical regardless of which scenario is
live**, otherwise their content becomes a channel that leaks something about the live
scenario. They are drawn from one fixed pool, ordered deterministically by
`hash(attempt_id, platform)` so an attempt's world is stable across reloads but does not
correlate with the scenario in flight.

This single addition delivers N.19, N.30 and specification row 3.14, and materially improves
3.7 — apps stop being locked into a sequence, because the other three tiles become genuinely
worth entering.

---

## 8. Platform-by-platform realism strategy

For each platform: current state, gap, proposal, priority, complexity, specification
dependency. "Spec dep." names the row that already requires the item — a row number means
this is gap-closure, a dash means it is enhancement beyond the specification.

### 8.1 WhatsApp (25 scenarios · W01–W25 · 10 military-context)

**Current.** `WhatsAppRenderer.jsx` is genuinely good: correct green chrome, in/out bubble
geometry, delivery ticks (`sent`/`delivered`/`read`), an avatar that distinguishes a saved
name from a raw number, chat-list rows with unread styling, and a full header icon row. It
supports the blocks `note`, `message`, `linkPreview`, `attachment` and `image`.

**Gap analysis.**

| Element | Spec requires | Today | Verdict |
|---|---|---|---|
| Thread header | "thread header" | Present | PASS |
| Bubbles | "bubbles" | Present | PASS |
| Delivery ticks | "delivery ticks" | Present, but the single inbound message never carries one | PARTIAL |
| **Prior-message history** | **"prior-message history"** (stage 2, all 25) | **1 bubble** | **MISSING** |
| Contact info sheet | "full number, mutual groups, join date, media and report controls" (stage 3) | `InspectSheet` shows name, identifier and first-seen | **PARTIAL** — mutual groups, join date, media and report controls absent, and *"absent mutual groups"* is a **named decision cue on W01** |
| Typing indicator | — | Absent | ENHANCE |
| Forwarded label | W17's own text: *"a forwarded message... forwarded label, unknown origin"* | Absent | **MISSING** (scenario-level) |
| Group conversations | W03, W13, W18 are group scenarios by title | No group rendering at all | **MISSING** |
| Voice note | W15 "Senior's Urgent Voice Note" | Rendered as text | **MISSING** (scenario-level) |
| Unread divider | "unread pill" (stage 2) | List-level pill only | PARTIAL |

**Proposal.**

1. **Multi-block threads with date separators and an unread divider.** *(spec 4.12 / A.3 · HIGH · M)*
2. **Complete the contact info sheet** — full number, mutual-groups row including the emphatic
   empty state W01's cue depends on, join date, shared-media count, and in-sheet Report/Block
   controls. *(spec §4 stage-3 UI column · HIGH · M)*
3. **Typing indicator** as a renderer block, driven by the scene director. *(— · MED · S)*
4. **Forwarded and "Forwarded many times" labels.** *(W17 · MED · S)*
5. **Group thread rendering** — participant count in the header, per-message sender name and
   colour, "X added you" system lines. Needed by three named scenarios. *(W03/W13/W18 · MED · M)*
6. **Voice-note bubble** — duration, waveform, a play control that plays nothing and reveals a
   caption, per §4's "Use generated audio **or text captions**". *(W15 · MED · S)*
7. **Tappable link bubbles** feeding `inspect_link` and `open_link`, and emitting
   `link_hover_ms`. *(spec 4.11 · HIGH · M)*

### 8.2 Instagram (25 scenarios · I01–I25 · 12 military-context)

**Current.** `InstagramRenderer.jsx` (494 lines, the richest of the four) already supports a
verified badge, `post` blocks, `image`, and a list view with unread state.

**Gap analysis.**

| Element | Spec requires | Today | Verdict |
|---|---|---|---|
| Profile sheet | "exact handle, account age, username history, mutuals, follower ratios and report controls" (stage 3, **all 25**) | `senderFields()` yields display name, username, contact, followers, following, posts, bio | **PARTIAL** — **account age, username history and mutuals are absent, and all three are named decision cues** |
| DM requests inbox | "DM requests/inbox or activity/feed view" (stage 2) | Single thread | PARTIAL |
| Activity/feed view | same row | Absent | MISSING |
| Post / story / reel context | "with thread, post, story or reel context and timestamps" | `post` block exists; no story, no reel | **PARTIAL** — I25 "Canteen Coupon Reel QR", I07 "Known Friend Shares a Reel" and I15 "You Are in This Video" all need it |
| Follower ratio as a cue | I01: *"follower ratio"*; I18 "High-Fidelity Teammate Clone" | Numbers shown, ratio not surfaced | PARTIAL |
| Comments disabled | I01: *"disables comments"* | No comment surface | MISSING |
| Live video call | I22 "Live Support Video Call" | Generic `call_screen` | PARTIAL |

**Proposal.**

1. **Complete the profile sheet** — account age ("Joined 3 weeks ago"), username-history row
   ("Changed 2 times in the last 6 months"), mutual-followers count with its empty state, and
   an explicit follower/following ratio. **This is the highest-value single change on
   Instagram**: it is required by all 25 stage-3 rows and it is where the cues live.
   *(spec §4 stage-3 · **HIGH** · M)*
2. **DM requests inbox** — a "Requests" tab with the message-request framing an unknown sender
   actually produces. *(spec stage 2 · HIGH · M)*
3. **Post / story / reel cards** as first-class blocks: a `reel` block with a still frame,
   caption, view count and a play control that opens an inert local surface. Required by at
   least three scenarios. *(I07/I15/I25 · MED · M)*
4. **Comment strip** with a disabled state, so "comments are turned off" is observable.
   *(I01 · MED · S)*
5. **Story rail with a live entry** — the rail exists in `AppSurfaces` as decoration;
   promoting one entry to a scenario asset gives Instagram scenarios a second surface.
   *(— · LOW · M)*

### 8.3 Email (25 scenarios · E01–E25 · 8 military-context)

**Current.** `EmailRenderer.jsx` supports `emailHeader`, `emailBody`, `attachment` and
`linkPreview`. **All 25 email scenarios have zero message bubbles and exactly one body
paragraph.**

**Gap analysis.**

| Element | Spec requires | Today | Verdict |
|---|---|---|---|
| Inbox with folders | "Inbox and message pane with **folders**" (stage 2, all 25) | One list row, no folder rail | **MISSING** |
| **Thread history** | "**thread history**" (stage 2, all 25) | One body | **MISSING** |
| Attachment chips | "attachment chips" | Present (12 scenarios carry a file) | PASS |
| Reply controls | "reply controls" | Absent from the renderer | MISSING |
| Warning banners | "**warning banners**" | Absent | **MISSING** |
| Sender details sheet | "display name, full address, **reply-to**, **authentication summary** and link target" (stage 3, all 25) | Name and address | **PARTIAL** — reply-to and the authentication summary are the *named decision cues* on E01 |
| Reply-chain hijack | E18 "Hijacked Reply-Chain Invoice" | No chain exists to hijack | **MISSING** |
| Phishing folder | E01 end-state: "message moves to the simulated phishing folder" | No folders | MISSING |
| Full-width email view | §4: "optional full-width email view" | Always 390 px | PARTIAL (the spec marks it optional) |

**Proposal.**

1. **Sender-details sheet with reply-to and an authentication summary** — SPF/DKIM/DMARC
   presented as a plain-language "Sender checks" panel, synthetic. **This is the single
   highest-value email change**: E01's stated cue is *"the sender and reply-to use unrelated
   reserved domains"*, and reply-to is not currently displayed anywhere.
   *(spec §4 stage-3 · **HIGH** · M)*
2. **Thread history** — quoted prior messages, "On 8 Sep, X wrote:" chains, and for E18 a
   genuine multi-party chain the attacker joins. *(spec 4.12 · **HIGH** · M)*
3. **Folder rail** — Inbox / Sent / Junk / Phishing, with the E01 end-state actually moving
   the message. *(spec stage 2 plus the E01 end-state · MED · M)*
4. **Warning banner slot** — the "external sender" or "this message looks suspicious" strip
   real clients show. **Content-gated per scenario, never disposition-derived**: the banner
   must appear on some legitimate scenarios too, or it becomes a perfect oracle.
   *(spec stage 2 · MED · S — but see the anti-oracle rule in §9.4)*
5. **Reply / Reply-all / Forward controls** in the message pane, mapping to `reply` and — for
   Forward — see §9.5. *(spec §4 action-sheet row · MED · S)*
6. **Full-width reading view** at desktop widths, since §4 explicitly permits it and email is
   the platform where 390 px hurts most. *(spec §4 · LOW · M)*

### 8.4 SMS (25 scenarios · S01–S25 · 5 military-context)

**Current.** `SmsRenderer.jsx` already does the most important SMS-specific thing:
`isSenderId()` distinguishes a registered alphanumeric sender ID from a raw mobile number and
renders them differently. That is a real, well-judged realism detail.

**Gap analysis.**

| Element | Spec requires | Today | Verdict |
|---|---|---|---|
| Native conversation list and thread | stage 2, all 25 | Present | PASS |
| Sender header and number | stage 2 | Present | PASS |
| **Prior thread** | "**prior thread**" (stage 3, all 25) | 1 message | **MISSING** |
| SIM label | "**SIM label**" (stage 3, all 25) | Absent | **MISSING** |
| Report-junk controls | "report-junk controls" (stage 3) | Side-panel intent only | PARTIAL |
| Link / MMS preview | "link/MMS preview" (stage 2) | `linkPreview` yes; **no MMS or image preview** | PARTIAL |
| Thread hijack | S18 "Bank Header Thread Hijack" | No legitimate prior thread to hijack | **MISSING** |
| Callback | S20 "Parcel Text Plus Callback" | A `call_screen` asset, no arrival | PARTIAL |

**Proposal.**

1. **Prior thread plus header-collision rendering for S18.** S18 is unassessable without a
   genuine prior bank thread under the same sender header — the entire cue *is* that a
   fraudulent message lands inside a thread the learner trusts. *(spec 4.12 and S18 · **HIGH** · M)*
2. **Conversation details sheet** with full number/header, SIM label, and in-sheet Block and
   Report junk. *(spec §4 stage-3 · HIGH · S)*
3. **MMS/image preview block** for S15 "Canteen Subsidy MMS QR". *(S15 · MED · S)*
4. **Delayed second message and a callback beat** for S20 — the text arrives, then the call
   screen arrives after a pause, driven by the scene director. *(S20 · MED · M)*
5. **Short-code / sender-ID header styling** extended into the conversation list so the
   distinction is visible before opening. *(— · LOW · S)*

### 8.5 Cross-platform summary

| Platform | Missing specification elements | Highest-value single change | Effort |
|---|---|---|---|
| WhatsApp | prior history · info sheet (mutual groups, join date) · groups · forwarded label · voice note | **Complete the contact info sheet** | M |
| Instagram | account age · username history · mutuals · DM requests · reels and stories | **Complete the profile sheet** | M |
| Email | thread history · folders · reply-to · authentication summary · warning banners · reply controls | **Reply-to plus the authentication summary** | M |
| SMS | prior thread · SIM label · report-junk in the sheet · MMS preview | **Prior thread — S18 is unassessable without it** | M |

**The pattern is uniform: the stage-3 inspection sheet is under-built on every platform, and
stage 3 is where `INSPECT_CONTEXT +2` is earned.** Completing the four inspection sheets is
simultaneously the largest specification gap, the largest immersion win, and the change with
the most direct effect on whether the assessment measures what it claims to.

---

## 9. Interaction redesign strategy

### 9.1 The problem, precisely located

```
SimulationPage
+-- PhoneShell        scenario, stage, busy, activity, surfaceAsset
|   +-- Renderer      actions={[]}   onAction={noop}   <- the whole problem
+-- TrainingPanel
    +-- ActionSheet   <ul><li><Button>Open the link</Button></li> ...  <- the MCQ
```

The device displays; the panel decides. That split is what makes it read as a quiz, and it is
one prop.

### 9.2 The principle

**Move the *surface* of the decision onto the device; keep the *vocabulary* of the decision
exactly as it is.** Every affordance below submits an intent that already exists in `INTENTS`
and is already mapped in `STAGE_INTENTS`. **Zero backend change.**

### 9.3 The affordance map

| Device affordance | Existing intent | Stage | New backend? |
|---|---|---|---|
| Tap the notification or thread row | `open_item` | notify | No |
| Swipe away or dismiss the toast | `dismiss` | notify | No |
| Scroll the thread to the end | `read` | open | No |
| Tap the thread header or avatar | `inspect_sender` | inspect | No |
| Tap the profile card (Instagram) | `inspect_profile` | inspect | No |
| Long-press or focus-hold a link bubble | `inspect_link` **plus `link_hover_ms` metadata** | inspect | No — the metadata key and the schema field already exist |
| Tap an attachment chip | `preview_file` | inspect | No |
| Tap a QR image | `inspect_qr` | inspect | No |
| "Scroll up for earlier messages" | `read_thread` | inspect | No |
| Tap the link bubble itself | `open_link` | branch | No |
| Tap "Open" on an attachment | `open_file` | branch | No |
| Tap "Scan" in the QR viewer | `scan_qr` | branch | No |
| Tap the call button in the header | `call_number` | branch | No |
| Composer, opening a predefined-reply chooser | `reply` | branch | No |
| A button on the inert local surface | `submit_data` / `attempt_payment` / `attempt_install` | branch | No |
| Overflow: "Not now, I'll check officially" | `safe_pivot` | branch | No |
| Overflow: Report / Block | `report` / `block` | verify | No |
| Overflow: "Look it up in the directory" | `verify_trusted_directory` | verify | No |
| Overflow: "Open the official app" | `verify_known_app` | verify | No |
| Overflow: "Use the number in this message" | `verify_in_message_contact` | verify | No |
| Final action bar on the thread | `resolve_*` | resolve | No |

**The composer must never accept free text.** It opens a chooser of pre-written replies. A
free-text composer would (a) invite a real secret, breaking §6 Privacy, and (b) require
natural-language interpretation the engine deliberately does not have. The one text field that
exists — the 250-character rationale — is already sanitised, never scored and never released,
and it stays exactly as it is.

### 9.4 The anti-oracle constraint — the hard part

`actionsFor()` already gates controls on asset presence, and `constants/simulation.js`
documents a live example of exactly this class of bug being caught and closed: `reject_ignore`
is omitted from the branch stage **because** the engine accepts it only on legitimate
scenarios, so offering it everywhere would have made "did the button work?" a perfect
disposition oracle. UI-001 found and closed the same class of bug once already (master plan
15.33, "A disposition oracle, found and closed").

**Moving controls onto the device multiplies the exposure.** If a link is tappable only when
the scenario carries a `browser_page` asset, and `browser_page` correlates with disposition,
then tappability *is* the answer. Measured: 42/100 scenarios carry `browser_page`, 38/100
carry `payment_screen`, 12 carry `file`, 8 `call_screen`, 6 `install_screen`, 5 `qr_payload`.
**Whether those distributions correlate with disposition has never been tested, and the
redesign makes the question load-bearing.**

**Three mandatory mitigations, all of them acceptance criteria rather than intentions:**

1. **Measure first.** Before any affordance moves onto the device, compute the distribution of
   every asset kind across the 80 malicious and the 20 legitimate scenarios. If any kind is
   materially skewed, the enrichment work must supply the missing assets on the
   under-represented side. **This measurement is the first deliverable of IMMERSIVE-004 and it
   may change that task's scope.**
2. **Assert indistinguishability.** An automated test computes, for every scenario, the set of
   affordances the UI would render at each stage, and asserts that no affordance's presence
   predicts disposition better than chance across the bank. This is a test the project does not
   have today and needs regardless of the redesign.
3. **Uniform shape.** Where a scenario's content plausibly permits an affordance, it must be
   present. A legitimate email with a link must have a tappable link, exactly as a malicious
   one does.

### 9.5 Forward, Delete and Mark safe

§4's action-sheet row names seven actions; three are absent from every stage: **Forward,
Delete, Mark safe.** They cannot simply be added, because each would need a stable event code
and a point value — and **points come from client content, not from the engine.**

Recommended mapping, which invents no new scoring semantics:

| §4 action | Maps to existing intent | Rationale |
|---|---|---|
| Mark safe | `resolve_retain` (resolve) or `safe_pivot` (branch, legitimate) | "Keep it, no further action" is what marking safe *is*; `CORRECT_RESOLUTION.legitimate` already includes it |
| Delete | `resolve_ignore` | Discarding without reporting is what `resolve_ignore` scores (`CONTRADICTORY_UNSAFE_FINAL` on a malicious item) |
| **Forward** | **no existing intent** | Forwarding a malicious item to a colleague is a genuine unsafe act with no code in the §5 vocabulary |

**Recommendation: relabel for Mark safe and Delete (zero risk, closes two thirds of the gap);
raise Forward as a client clarification (§21, C7).** Adding a `forward` intent would require a
scoring event the client has not specified, and §5's nine events are explicitly the client's
numbers. Do **not** invent one.

### 9.6 Accessibility — non-negotiable

§6's release checklist requires **keyboard-only completion**, and V2 records that this has
never been verified even for the current, simpler UI. Making the device the primary surface
puts that requirement at real risk.

**The rule: the side panel does not go away. It becomes the canonical accessible path.**

- Every device affordance has a labelled twin in the panel. Both submit the identical intent.
- **The panel is the tab order.** Device affordances are reachable but are not the only route,
  and no interaction requires hover, long-press, drag or pointer precision.
- `link_hover_ms` is *telemetry*, never a gate: the keyboard route emits it on focus-hold, and
  a learner who never produces it is not disadvantaged. It carries zero points by design.
- Every device affordance is a real `<button>`. The existing rule — no click handler on a
  `div`, `span` or `li` anywhere in `src`, verified by ACCEPTANCE-001 — holds unchanged.
- Every affordance keeps a 44 px minimum target and a visible 2 px focus outline.
- Scene-director reveals are announced through a polite live region, never by moving focus.
- Under `prefers-reduced-motion`, all pacing collapses to immediate.

**ACCEPT-003 (keyboard-only completion plus contrast measurement) should run BEFORE the
redesign, to establish a baseline, and again after it.** Without a baseline, a keyboard
failure found afterwards cannot be attributed.

---

## 10. Scenario continuity proposal

### 10.1 The question

Should some of the 100 scenarios become connected story arcs — a morning email, a WhatsApp
message that references it, an SMS creating urgency, an Instagram trust play, an escalating
email?

### 10.2 What forbids naive arcs

| Constraint | Why co-selection breaks it |
|---|---|
| §5 selection quotas | The solver satisfies **nine simultaneous constraints** (platform 3/3/2/2, difficulty 3/4/3, disposition 8/2, legitimate on different platforms, military 2–4, at least five triggers, at most two per family, recent-20 exclusion, no repeats). "If E14 then W14, in that order" is a hard co-selection constraint that can make the quota system unsatisfiable — and `SELECTION_ERRORS` would surface that as a 409 the learner cannot recover from. |
| §5 presentation order | Order is shuffled with `MAX_CONSECUTIVE_SAME_PLATFORM = 2`. A fixed arc order cannot be guaranteed without disabling the shuffle §3 requires ("Do not lock apps into a fixed sequence"). |
| §5 scoring | Each scenario is independently clamped 0–10 and summed. A cross-scenario dependency would make one scenario's score depend on another's, breaking clamp-then-sum. |
| §7 comparability | Any arc constraint requires a new `SELECTION_ALGORITHM_VERSION`, which puts every existing attempt outside the comparability gate — **all historical trend data becomes incomparable.** |
| §5 repeat control | Recent-20 exclusion operates on individual ids. Arcs would need it to operate on arc units, changing a client-stated rule. |

**Verdict: cross-scenario arcs must not be implemented as a selection constraint.**

### 10.3 What delivers continuity without touching selection

**(1) A persona registry.** A small versioned local data file of synthetic recurring
identities — `hav_menon_mt_section`, `it_service_desk_hq_alpha`, `quickparcel_support`,
`adjutant_office`. Scenarios reference a persona id in `synthetic.sender`. Today the trusted
directory returns *the same* "Unit Falcon Support Desk" on all 100 scenarios and most senders
are "Unknown" — the world has no inhabitants. A registry gives it a cast, at zero cost to
selection.

Emergent continuity, free: if two scenarios in one attempt happen to share a persona, the
second thread can open with a line acknowledging the earlier contact — **rendered only when
the earlier run actually occurred in this attempt**, which the frontend already knows from the
attempt's resolved runs. No server change, no co-selection, and when the coincidence does not
occur nothing is lost.

**(2) A synthetic working-day clock.** Map ordinal 1–10 onto a fictional day, 09:14 to 16:40.
Today every thread is timestamped by a hash and W01's only message is at 11:29 regardless of
position. A coherent day is a pure presentation function of `ordinal` — deterministic, no
server change, no selection change — and it is a surprisingly large share of the "this is one
continuous experience" feeling.

**(3) Multi-beat escalation *inside* each scenario.** This is where the escalation actually
belongs, and where the specification already puts it: stage 4 of all 100 pages says the
interaction *"advances to"* something. W12 "Digital Arrest Escalation" should escalate across
its own six stages — three messages, a call screen, a countdown — inside one run. **This
delivers the client's escalation requirement in full, with no cross-scenario dependency at
all**, and is the core of IMMERSIVE-007.

**(4) A shared world frame.** One fictional unit, one set of place names, one internal
directory, consistent addresses. Cheap, entirely presentational, and it makes ten unrelated
scenarios read as ten events in one organisation.

### 10.4 If the client insists on true arcs

The only compatible design is a **soft preference, never a hard constraint**: authored pairs
carrying `narrative_link: { arc_id, position }`, which the selector prefers when — and only
when — all nine hard quotas are already satisfiable with the pair included, and silently
ignores otherwise. Costs: a new `SELECTION_ALGORITHM_VERSION`, a re-run of the 400-seed
constraint suite, a §7 comparability break with all existing attempts, and new content.

**Recommendation: do not bundle this with the immersion work.** Treat it as a separate, later,
explicitly client-approved task, after (1)–(4) have shipped — because (1)–(4) may well deliver
the felt continuity the client is actually asking for, at a fraction of the risk.

### 10.5 Cross-platform interruption (N.25)

*"Interruption from another platform"* — an SMS arriving while the learner is inside a
WhatsApp scenario — is **not compatible with the current engine**: the engine issues one run
at a time by ordinal, and a second live run would need concurrent runs, a second event stream
and a rule for which run a scored action belongs to. That is an engine change of exactly the
kind this plan avoids.

A **presentational** approximation is safe and cheap: a background-item toast from another
platform that is **not scoreable, not openable into a decision, and drawn from the same fixed
benign pool as §7.8**. It creates the felt interruption without a second run. Recommended as
part of IMMERSIVE-004. True concurrent scenarios: **defer, client decision** (§21, C8).

---

## 11. Feedback timing and immersion

### 11.1 What the specification permits

> §4: "Feedback card — Result, points, observed cues, preferred action, impact and one
> prevention habit. **Training mode immediate; assessment mode may defer detail until attempt
> completion.**"
> §3: "Hide the running score in assessment mode; **training mode may show points after
> feedback.**"

The specification gives assessment mode explicit permission to defer everything.

### 11.2 Recommendation

**Assessment mode stays uninterrupted.** No feedback card, no score, no cue chips between
scenarios. This is what makes it an assessment, it is what §4 permits, and immersion makes the
case stronger: a feedback card between scenarios breaks the fictional working day in exactly
the way the narrator caption breaks the thread. The learner would be pulled out of the world
every four minutes and told how they did — which is training, not assessment, and the client
has been explicit that this must feel like an assessment.

**Training mode shows feedback at resolution, outside the fiction.** When
`effectiveFeedbackTiming('training')` is `immediate`, the card renders **outside the device
frame**, on the training-rail side, visually distinct — never as a message in the thread,
never inside the device. This one rule keeps the two concerns orthogonal: FEEDBACK-001 never
needs to know about the immersion layer, and the immersion layer never needs to know about
feedback.

### 11.3 Compatibility with FEEDBACK-001 as already scoped

FEEDBACK-001's scope — release the per-scenario feedback card at resolution when the
configured timing is `immediate`, gate it with `effectiveFeedbackTiming(mode)`, wire
`scoreVisible()`, change nothing about scoring or the state machine — is **fully compatible**
and **not blocked** by anything in this plan.

| FEEDBACK-001 touches | Immersion work touches | Overlap |
|---|---|---|
| `attemptResultService` (feedback release), the resolve response, `ScenarioOutcome.jsx`, the `instructorControlService` config read | `PhoneShell`, the renderers, `syntheticScreen`, `constants/simulation`, the scene director, synthetic content data, `Attempt` (timer) | **`ScenarioOutcome.jsx` only** — and only if the immersion work moves the outcome card, which it should not |

**They can run in parallel.** The single coordination point is that both must agree the
feedback card renders outside the device frame.

---

## 12. Safety boundary

### 12.1 Specification text that appears to require sensitive input — and does not

The scenario bank contains stage-4 text that reads, on first pass, like a requirement to
collect secrets:

| Scenario | Stage-4 text |
|---|---|
| E01 | "a synthetic sign-in page that requests username, password and OTP" |
| S01 | "a fake mobile KYC page requesting account, PIN and OTP" |
| W02 | "an offline tracking page requesting card/UPI details" |
| S23 | "UPI Refund Collect Request" |
| S19 | "Network Survey Requests IMEI" |
| I12 | "Account Recovery Backup Code" |
| W10 | "Survey Device-Link QR" |

**None of these requires the product to collect anything.** They describe what the *simulated
attacker's page displays*. The specification resolves the ambiguity itself, twice:

> §4 Safe browser — "Clicking is scoreable; **typed data is replaced by tokens and never
> treated as real**."
> §6 Privacy — "**No real password/OTP/payment/biometric field**; logs use event allowlists;
> exports are explicit and local."

### 12.2 What the implementation does — and it is better than the specification asks

`LocalSurfaces.jsx` and `AppSurfaces.jsx` contain **zero** input, textarea, form and href
elements — measured this session. Every "page requesting your PIN" is an inert panel; the
unsafe act is expressed as the `submit_data`, `attempt_payment` or `attempt_install`
**intent**, not by typing. There is nothing to tokenise because there is nothing to type.

**That is strictly safer than §4's tokenisation approach and it must be preserved.**

### 12.3 The hard rule for the immersion work

> **No task in this plan may add an input, textarea or form element to any simulated
> surface.**

Realism comes from chrome, copy, layout, timing and pressure — never from a field that accepts
a secret. Where a form is visually necessary for realism, render a **non-interactive
facsimile**: styled containers with placeholder text, `aria-hidden`, plus one labelled real
button that submits the intent. CLIENT-POLISH-001 proved this pattern and tested it (one real
control per surface, asserted per platform).

**Never collect, store, log, display or accept:** real banking passwords, OTPs, ATM PINs, card
numbers, CVV, Aadhaar, PAN, biometrics, government or classified information, real credentials
for any external service, real unit names, real locations, real rosters, real schedules, real
capabilities.

**The only legitimate learner text inputs in the entire product, and the complete list:**

1. The login **name** and **Personal / Service Number** — §2 requires both; both are
   validated, normalised and masked; the number is the profile key. (And the field label must
   be corrected to *Personal*, per row 2.9.)
2. The **250-character rationale** at the resolve stage — §4 makes it optional; it is
   single-line, markup-stripped, never scored, never released to any projection, and already
   carries the warning "Do not enter passwords, codes or personal details."

**No third input may be added by any task in this plan.**

### 12.4 Synthetic-content rules the enrichment must obey

Unchanged from DATA-002 and DATA-003 and enforced by the existing import validator:

- Hosts: `.example` and `training.local` only. Currently 34 URLs in the bank, **0
  non-reserved**.
- Phone numbers: the reserved `+91 00000` range only.
- Identities: generated. Fictional "Unit Falcon" and "HQ Alpha" style entities only.
- Assets: `inert: true`. Currently 511 of 511.
- No copied live victim or adversary content (Appendix A).
- No data URIs. Currently zero.

The enriched threads add message volume, not new content *categories*, so every one of these
validators applies unchanged — and each must pass before the enriched bank is published.

---

## 13. Security review

**Design review only. Nothing below has been executed or tested.**

| # | Concern | Current posture | Risk after the plan | Mitigation |
|---|---|---|---|---|
| S1 | **Timer tampering from the client** | No timer exists | The browser could try to send a deadline | `assertNoAuthoritativeInput()` already rejects a list of authoritative fields. **Add `expires_at`, `duration_ms`, `end_reason`, `expired_at` and `unresolved_at_expiry` to `FORBIDDEN_INPUT`.** The deadline is computed server-side inside the creation transaction and is never read from a request. |
| S2 | **Browser clock manipulation** | N/A | A user could set the clock back | The countdown is display only. Enforcement uses the server clock. `client_ts` and `elapsed_ms` remain telemetry, and `validateTelemetry()` already documents that they never decide a transition. |
| S3 | **Host system-clock rollback** | N/A | An operator with local administrator rights could extend an assessment | Accepted, and documented. It requires administrator rights on a supervised offline training machine, outside the threat model. `server_ts` on every event makes a rollback **visible** in the ledger (non-monotonic timestamps within a run) even though it is not prevented. A monotonic clock cannot help: it does not survive a restart, which N.12 requires. |
| S4 | **Duplicate submission at the expiry boundary** | `intent_key` unique index plus a `(run_id, sequence)` unique index | A learner action and the sweeper could race | Both take the same transaction; the in-progress re-read is the guard. Whichever commits second finds it false and returns unchanged. `completeAttempt()` already uses this exact pattern. |
| S5 | **Multiple tabs** | One server-authoritative state; `STALE_STATE` on divergence | Multiple countdowns | No client timer is authoritative. All tabs derive from one `expires_at`. No tab writes anything. The existing `expectedStage` optimistic-concurrency check already handles two tabs acting. |
| S6 | **Session recovery** | Signed httpOnly cookie, eight hours | A session outliving an attempt is normal | The **attempt guard**, not the cookie, decides. A live cookie on an expired attempt yields the result, not more time. |
| S7 | **Browser close** | Server-authoritative; resume asks the API | The clock keeps running | Correct and intended (N.5). Must be **stated** in the Rules panel and the logout confirmation, or it is a trap rather than a rule. |
| S8 | **Stale attempts blocking a learner** | `createAttempt()` refuses when an in-progress attempt exists | **Pre-existing latent bug**: today an abandoned attempt blocks that learner *permanently* until an instructor resets it | The sweeper plus the lazy guard in `startAttempt` closes it. **This is a real fix delivered by the timer work, not a new risk.** |
| S9 | **Timeout racing completion** | N/A | A learner resolving run ten a fraction before the deadline | Transactional guard, as S4. One of the two paths sees the attempt is no longer in progress and returns the existing attempt. |
| S10 | **Offline consistency** | Single-node replica set, `{w:1, j:true}` | Expiry adds one more transactional writer | Same boundary, same helper, at most 21 documents. No new topology requirement. |
| S11 | **Audit integrity** | Append-only; `actor_admin_id` required and immutable | Recording a system action would require weakening it | **Do not.** Record expiry on the entities and the ledger (§5.8 option A). The audit log's remit stays exactly what §6 states. |
| S12 | **Disposition oracle from device affordances** | `reject_ignore` already omitted for this reason; UI-001 closed one such bug | **The most serious new risk in this plan** | §9.4: measure asset-kind distributions first, assert indistinguishability in an automated test, enforce uniform affordance shape. **This is an acceptance criterion, not a guideline.** |
| S13 | **Sensitive data via a realistic form** | Zero input elements in every simulated surface | Realism pressure will tempt one | §12.3 hard rule plus a test asserting zero form elements in every simulated surface, extending the existing `AppSurfaces.test.jsx` pattern. |
| S14 | **Background items leaking scenario state** | N/A — none exist | A background inbox correlated with the live scenario would leak | Fixed pool, ordered by `hash(attempt_id, platform)`, **never by scenario**. Asserted by test. |
| S15 | **Enriched content leaking the answer** | The candidate projection is an allowlist; `evaluation` is `select: false` | A narrative block could state the disposition | Authoring rule §7.6.1 plus a lint over the enriched bank for disposition, difficulty and family vocabulary in candidate-visible blocks. |
| S16 | **The scene director advancing state** | N/A | A timing bug could submit an intent | The director has **no access** to `controller.submit`. Structural, not a convention. |

---

## 14. Accessibility considerations

§6's release checklist requires *"Keyboard-only completion, visible focus, readable contrast,
labels, 200% zoom and no color-only meaning."* Verified today: 200% zoom, visible focus,
labels, 44 px targets, no colour-only meaning. **Never verified: keyboard-only completion (V2)
and contrast (V3).**

Everything in this plan raises the accessibility stakes, so:

| Area | Requirement | How the plan meets it |
|---|---|---|
| Keyboard-only completion | §6 | The side panel remains the canonical tab order; every device affordance has a labelled twin; no interaction requires hover, long-press, drag or pointer precision. |
| Timed content | WCAG 2.2 §2.2.1 | A 90-minute limit on an assessment is permissible under the "essential exception" — but the remaining time **must** be visible and warnings must be given. Instructor-granted extension is the standard accommodation; see §21 C4. |
| Motion | §6 plus the existing `prefers-reduced-motion` | Under the query, all scene pacing collapses to immediate and typing indicators are suppressed. |
| Live regions | — | Reveals and timer warnings use `role="status"` (polite). **Never `alert`, never a focus move, never a modal** — any of the three would interrupt the decision being measured. |
| Focus management | §6 | Reveals never move focus. In-device sheets trap focus and return it on close, matching the existing `Modal` behaviour. |
| Contrast | §6 | Enriched surfaces reuse the existing design tokens. **ACCEPT-003 must measure before and after.** |
| 200% zoom | §6 | A denser thread is the main regression risk. Re-verify at 200% after IMMERSIVE-003 and again after 005. |
| Screen-reader narrative | — | A multi-message thread must be a semantic list with per-message sender and time in the accessible name, so a screen-reader user perceives the same conversation, not a wall of text. |
| Timer announcements | — | Remaining time is not announced continuously — a per-second announcement would be intolerable; only the ten-minute and two-minute warnings are announced. |

**ACCEPT-003 should run before IMMERSIVE-004 to establish the baseline, and again after
IMMERSIVE-005.**

---

## 15. Performance

Target: one standalone offline Windows machine, a single-node MongoDB replica set, one learner
at a time, sessions now up to 90 minutes.

| Area | Analysis | Action |
|---|---|---|
| **Timer reliability** | One `setInterval` at 30 s for the whole process. The query is `{status, expires_at}` against a new compound index over a collection holding hundreds of documents. Negligible. | Add the index; `limit(50)` per tick. |
| **Frontend timer** | The current one-second `ElapsedTime` interval, extended — **not** a second interval. Over 90 minutes that is 5,400 state updates; each re-renders one small subtree. Acceptable, but the countdown must be isolated in its own component so it does not re-render `PhoneShell` or the thread. | Isolate the countdown; memoise the header. |
| **Database writes** | Expiry: at most 21 documents in one transaction. Normal play: unchanged (two documents per intent). | None. |
| **Event volume** | Unchanged. Enriched content adds **no** events — reveals are presentation, not ledger entries. This is a deliberate design property. | None. |
| **Memory over 90 minutes** | The current page unmounts per scenario. A scene director holding per-block timers is the new risk: **every timer must be cleared on unmount and on stage change**, or ten scenarios accumulate handles. | A hook-level teardown test. |
| **Payload size** | `synthetic.assets` grows from about five to about twelve assets, and threads from two to about ten blocks. Estimated per-scenario payload 4–8 KB rising to 15–25 KB. Local API, no network. Negligible. | None. |
| **Bank size** | 511 assets rising to an estimated 1,100–1,400. Import and validation stay linear. | Re-measure import time. |
| **Mobile and 200% zoom** | A denser thread is the main regression risk at 200%. | Re-verify after 003 and 005. |
| **Long-session stability** | 90 minutes is roughly ten times the current tested session. Risks: interval leaks, unbounded arrays, growing live-region history. | An explicit long-session soak: run one attempt across a full 90-minute window and compare heap and handle counts at start and end. **This test does not exist today.** |

---

## 16. Implementation roadmap

**No task below has been started. Nothing is complete. This is a proposal.**

Every task states: objective · files likely affected · backend, frontend and database impact ·
migration · testing · browser verification · production safety · rollback · dependencies.

---

### IMMERSIVE-000 — Login label correction (§2 compliance) — **COMPLETED 9 September 2026**

> **Status: DONE.** Implementation record: PROJECT_MASTER_PLAN.md **16.11**. Matrix row 2.9 and
> `ACCEPTANCE_MATRIX.md` G8 are closed.
>
> **The estimate here was wrong in one respect, and the record should say so.** This task was
> scoped as "two strings". The actual user-facing footprint was **six strings across three
> files** — label, hint, placeholder, profile-found-card term, the client-side validation
> error, and the backend `MISSING_FIELDS` message — because the audit grepped for the label
> and not for the word. Nothing else about the task changed: it stayed frontend copy plus one
> backend message, with no schema, contract, data or behaviour change.

- **Objective.** Change "Phone / Service Number" to "Personal / Service Number" and remove the
  phone-number hint. Closes matrix row 2.9 (INCORRECT) and G8, open since ACCEPTANCE-001.
- **Files.** `frontend/src/pages/LoginPage.jsx` (two strings) · `LoginPage.test.jsx` if it
  asserts the label.
- **Backend / database / migration.** None · none · none.
- **Testing.** Update the assertion; the existing 274-test frontend suite must stay green.
- **Browser verification.** The login screen at 100% and 200% zoom.
- **Production safety.** Cosmetic. No stored data changes; no existing profile is affected.
- **Rollback.** Revert two strings.
- **Dependencies.** None. **Can ship immediately and independently.**
- **Size.** XS.

---

### IMMERSIVE-001 — 90-minute server-authoritative assessment timer — **COMPLETED 9 September 2026**

> **Status: DONE.** Client decisions C1, C2 and C3 were approved on 9 September 2026 and are
> implemented. Implementation record: PROJECT_MASTER_PLAN.md **16.12**.
>
> **Two deviations from this section, both from inspecting the code first — see 16.12:**
>
> 1. **The field is `time_limit_ms`, not `duration_ms`.** §5.2 proposed `duration_ms`; that
>    name is already used across the attempt viewer, the exports and the result projection
>    for the time the learner TOOK. Reusing it for the time ALLOWED would have printed
>    "90 minutes" as every learner's completion time in the instructor CSV and PDF.
> 2. **The expiry ledger entry carries no `intent`.** §5.5's sketch wrote `intent: 'expire'`,
>    but `ScenarioEvent.metadata.intent` is enum-constrained to the learner `INTENTS`
>    vocabulary — writing to it would have meant widening the list the engine validates
>    client requests against. `transition` and `resolution_code` carry the meaning instead.
>
> Everything else in §5 was implemented as designed, including the three enforcement layers,
> the null-deadline semantics, the deterministic `intent_key`, the `NOT_RESOLVED` outcome
> class and the `PATH_LABELS.RUN_EXPIRED` entry. One gap this section did not anticipate was
> found and closed: after the sweeper finalises an attempt there is no `in_progress` attempt,
> so `/attempts/current` returned `null` and a returning learner would have been told they had
> no assessment. `findRecentlyExpiredAttempt()` now reports it.

- **Objective.** Implement §5 in full: additive `Attempt` fields, an expiry service, three
  enforcement layers, the result projection for expiry, instructor visibility, and a learner
  countdown.
- **Files.**
  - Backend: `models/Attempt.js` (five additive fields, one index, one validator, extend the
    freeze hook) · **new** `constants/attemptTiming.js` · **new**
    `services/attemptExpiryService.js` · `services/attemptService.js` (compute `expires_at`
    inside the creation transaction; set `end_reason: 'learner_completed'` in
    `completeAttempt`) · `controllers/attemptController.js` (the lazy guard on six routes) ·
    `services/scenarioEngineService.js` (`FORBIDDEN_INPUT` additions; the `RUN_EXPIRED`
    telemetry code) · `constants/scenarioEngine.js` (`ENGINE_TELEMETRY_CODES`, `EVENT_CODES`)
    · `constants/resultProjection.js` (`PATH_LABELS.RUN_EXPIRED`,
    `OUTCOME_CLASSES.NOT_RESOLVED`) · `services/attemptResultService.js` (`classifyOutcome`
    early return; surface `end_reason`) · `services/instructorControlService.js`
    (`end_reason: 'instructor_reset'`) · `services/attemptViewerService.js`,
    `services/exportService.js` and `services/exportReportService.js` (two new columns) ·
    `server.js` (the sweeper and startup recovery).
  - Frontend: `components/simulation/AttemptHeader.jsx` (countdown beside elapsed) · **new**
    `components/simulation/TimeRemaining.jsx` · `state/attemptMachine.js` (carry `expires_at`,
    `server_now`, `end_reason`) · `hooks/useAttemptController.js` (skew offset; expiry response
    handling) · `pages/SimulationPage.jsx` (the expiry state) · `pages/ResultPage.jsx` and
    `components/result/ResultSummary.jsx` (the expiry banner) ·
    `components/simulation/SupportDialogs.jsx` (Rules gains the timer explanation) ·
    `pages/DashboardPage.jsx` (remaining time on Resume).
- **Backend impact.** Substantial but additive: one new service, one new constants file, a
  guard on six existing routes, one interval in `server.js`. **No existing function's contract
  changes.**
- **Frontend impact.** Moderate. One new component; three existing files gain fields.
- **Database impact.** Five additive fields, all optional with null-safe semantics. One new
  index `{status: 1, expires_at: 1}`.
- **Migration.** **None.** `expires_at: null` means "no deadline"; the two existing production
  attempts are untouched and behave exactly as today.
- **Testing.**
  - Unit: `expires_at = started_at + duration_ms`; immutability after creation; the freeze hook
    rejects a rewrite.
  - Expiry service: resolves every outstanding run with `clamp(score_running)`; writes one
    `RUN_EXPIRED` per run; sets status, `completed_at`, `expired_at`, `end_reason` and
    `total_score`; **idempotent** (calling twice changes nothing and writes nothing); a null
    deadline never expires.
  - Concurrency: expiry racing `completeAttempt` — exactly one transitions.
  - Guard: every mutating route rejects after the deadline; `GET /current-run` returns the
    completed attempt.
  - Integrity: `assertResultIntegrity()` passes on an expired attempt; `verifyRunIntegrity()`
    shows the cached score still matches a ledger replay.
  - Result: `classifyOutcome` returns `not_resolved`, **never `false_positive`**, for an
    expired legitimate run.
  - Sweeper: expires due attempts, ignores others, is bounded, is safe to run twice.
  - Startup recovery: an attempt that fell overdue while the process was down expires on boot.
  - Security: `FORBIDDEN_INPUT` rejects each of the five timer fields.
  - Frontend: the countdown renders from `expires_at`, corrects for skew, warns at ten and two
    minutes, calls `retry()` at zero and **ends nothing itself**.
- **Browser verification.** On a **throwaway stack** — the pattern every prior task used:
  isolated mongod, isolated database, non-production ports. Use a short test duration (two to
  three minutes) via the constant. Verify: the countdown is visible; a refresh does not reset
  it; closing the tab, waiting past expiry and reopening lands on the result; two tabs show the
  same number; the result banner states the expiry; the instructor attempt view shows
  `end_reason` and `unresolved_at_expiry`.
- **Production safety.** Additive fields, null-safe. **The sweeper must be verified against the
  two existing production attempts before deployment: both have `expires_at: null` and must be
  untouched.** Never point a development server at production — a recurring hazard recorded in
  master-plan 15.39 and 15.43.
- **Rollback.** Write `expires_at: null` on creation and stop the sweeper. Every guard becomes
  a no-op, and already-expired attempts remain valid completed attempts with a correct score.
  **Rollback is safe and loses nothing.**
- **Dependencies.** **Blocked on client sign-off of C1, C2 and C3** (§21).
- **Size.** L.

---

### IMMERSIVE-002 — Assessment menu behaviour — **COMPLETED 9 September 2026**

> **Status: DONE.** Implementation record: PROJECT_MASTER_PLAN.md **16.13**. Section 6 of this
> document is implemented as written.
>
> **Backend impact was confirmed to be none**, as this section predicted. `POST
> /api/candidates/logout` already cleared only the cookie and touched no attempt, run or
> event, and the history panel reuses `GET /api/progress` rather than adding an endpoint -
> which turned out to be the *safer* source as well as the smaller one, because
> `progressService` counts only `completed` attempts, so the live attempt is excluded by the
> server's own definition rather than by a client-side filter.
>
> **One departure from this section's file list:** the two panels went into a new
> `components/simulation/AssessmentSessionPanels.jsx` rather than into `SupportDialogs.jsx`.
> That file holds the UI-004 support zone, whose panels are static explanations that read
> nothing and submit nothing; these two fetch and act, and the distinction is worth keeping
> visible.
>
> Section 6.3's table is implemented exactly: history became an in-shell read-only panel,
> accessibility is untouched, restart is relabelled "Restarting (instructor only)" and still
> only explains, and logout gained a confirmation stating that the 90-minute clock keeps
> running. No `beforeunload` blocker was added, and no menu item was hidden or disabled.

- **Objective.** Implement §6: history becomes an in-shell read-only panel; logout gains a
  consequence-stating confirmation; restart is relabelled; accessibility is untouched.
- **Files.** `components/simulation/AttemptHeader.jsx` (labels, handlers) ·
  `components/simulation/SupportDialogs.jsx` (**new** `HistoryPanel`, **new**
  `LogoutConfirmDialog`; Rules gains the browser-close paragraph) · `pages/SimulationPage.jsx`
  (wiring) · `services/progressApi.js` or `attemptApi.js` if the panel needs a
  completed-attempts read.
- **Backend impact.** None, if the panel reuses `GET /api/progress` or the existing history
  read. Confirm during design; **prefer reuse over a new endpoint.**
- **Frontend impact.** Moderate; two new dialogs, no route change.
- **Database / migration.** None · none.
- **Testing.** The menu still contains all four items in §3's order (a specification
  assertion) · history opens in-shell and does not navigate · the live attempt is absent from
  it · logout confirms before acting and its copy states that the clock keeps running ·
  accessibility opens with no confirmation and no delay · restart still performs nothing.
- **Browser verification.** Open each item mid-scenario; confirm the assessment is still on
  screen behind the panel and that the stage is unchanged after closing.
- **Production safety.** Frontend only.
- **Rollback.** Restore the previous handlers.
- **Dependencies.** IMMERSIVE-001 — the logout copy must describe the timer behaviour.
- **Size.** S.

---

### IMMERSIVE-003A — WhatsApp scene layer, W01-W05 (DELIVERED 10 September 2026)

**Delivered ahead of 003/005/006 as a five-scenario pilot, exactly as R11 recommends.**

- **What shipped.** A reusable scene/interaction layer in the frontend
  (`frontend/src/simulation/**`) plus WhatsApp scene packs for W01-W05, an authored chat
  list, thread history, contact/group/settings surfaces, a navigable offline browser, a
  simulated call, an in-app poll, payment and link cards, and the app's own Report/Block
  banner. The action sheet becomes a collapsed accessible twin on those five.
- **What did NOT change.** No backend file except one new guard test. No scenario data, no
  synthetic content, no scoring, no engine, no timer. Both bank fingerprints are byte
  identical before and after.
- **Rows closed for W01-W05 only:** 1.2, 4.12, 4.13, 4.14, N.15, N.16, N.18, N.22, N.23.
  They remain open for the other ninety-five scenarios.
- **Still open after this task:** 4.7 (Forward / Delete / Mark safe), 4.11
  (`link_hover_ms` is still produced nowhere), 4.9 (FEEDBACK-001), 3.14 / N.28
  (IMMERSIVE-004's inhabited environment).
- **Relationship to 003 / 005 / 006.** This is a vertical slice of all three, scoped to
  five scenarios, so the interaction model could be reviewed by the client before the
  hundred-scenario authoring pass is committed. IMMERSIVE-003's content work is unchanged
  and can still land as `synthetic/v2`; the scene packs read whatever the payload supplies,
  so richer content improves them without a code change.
- **Documentation.** `docs/SCENE_INTERACTION_LAYER.md`.
- **Next batch.** W06-W10, then W11-W15, W16-W20, W21-W25, then the other three platforms.

---

### IMMERSIVE-003A-R2 — W01-W05 raised to demo standard (DELIVERED 10 September 2026)

**A refinement milestone over the same five scenarios. No new scenarios, no new platforms.**

- **Threat research first.** Each of the five was mapped against **MITRE ATT&CK v19.2** (read
  from the live technique pages, not recalled), the real-world behavioural pattern behind it
  was reconstructed, and the story was rebuilt from that pattern while keeping the client's
  scenario authoritative. **W03 was given no ATT&CK mapping**, explicitly, because a
  legitimate coordinator posting a poll is not adversary behaviour; the closest defensible
  reference — the discrimination / false-positive problem the client's own -4
  `FALSE_REPORT_BLOCK` prices — is recorded instead. One version note: `T1656 Impersonation`
  now resolves to **`T1684.001 Social Engineering: Impersonation`**.
  Full record: `docs/WHATSAPP_W01_W05_REAL_WORLD_RESEARCH.md`.
- **What shipped.** Background traffic in the chat list; grouped bubbles, quoted replies and a
  transient typing strip; tabbed contact and group sheets so an absence has to be looked for;
  navigable participants; a poll with other people's votes; a browser with a real page graph,
  Back and **fillable forms**; a payment sheet with payee, receiving account and PIN; a second
  **application** on the phone for W05's verification route; and a composer that puts a chosen
  reply in the message field before Send submits it.
- **The one rule that changed.** A simulated page may now carry real inputs. Values live in
  the component that draws the field, are discarded on leaving it, and never reach an intent,
  metadata, storage, a log, an export or the network — enforced in the frontend and again by
  the engine's `METADATA_ALLOWLIST`. Four dedicated tests assert it, including by serialising
  everything the device sent and searching it for what was typed.
- **What did NOT change.** No backend source file at all. No scenario data, no synthetic
  content, no scoring, no engine, no timer, no selection. Both bank fingerprints byte
  identical. W06-W25, Instagram, Email and SMS untouched.
- **Verification.** 471 frontend tests, 745 backend tests, lint and build clean; W01-W05
  walked end to end in the browser against an isolated database, with the safe paths scoring
  10/10 and the unsafe paths scoring as the client's table requires.
- **Documentation.** `docs/WHATSAPP_W01_W05_REAL_WORLD_RESEARCH.md` (new) and
  `docs/SCENE_INTERACTION_LAYER.md` (rewritten).
- **Next batch.** Unchanged: W06-W10, after client review of these five.

---

### IMMERSIVE-003 — Enriched synthetic content (multi-message threads)

**The largest and highest-value task in the plan. Content authoring inside the existing
schema.**

- **Objective.** Replace every narrator note with in-fiction dialogue and give all 100
  scenarios genuine thread history, closing matrix rows 4.12, 4.13, A.3 and N.16, N.18, N.22,
  N.27.
- **Files.** `backend/scripts/generateSyntheticContent.js` (or a successor authoring script) ·
  **new** `backend/data/synthetic/v2/synthetic.*.json` (versioned; **v1 retained**) · **new**
  `backend/data/personas/v1/personas.json` ·
  `backend/src/constants/scenarioDefinition.js` (`ASSET_KINDS` gains `background_thread`) ·
  `backend/src/services/scenarioDefinitionImportService.js` (validate the new block types) ·
  `backend/tests/syntheticContent.test.js`.
- **Backend impact.** Import and validation only. **No model, service, engine or scoring
  change.**
- **Frontend impact.** None in this task — the renderers already handle `message` blocks, so
  enriched threads render as more bubbles immediately. The new block *types* land in
  IMMERSIVE-005.
- **Database impact.** New `ScenarioDefinition` **versions** (v2), published through the
  existing ADMIN-001 lifecycle. **v1 documents are retained and stay pinned to historical
  runs** — this is exactly what `definition_version` pinning was built for, and it is why
  in-flight and historical attempts cannot be disturbed.
- **Migration.** None. Publishing v2 is the existing publish path.
- **Testing.**
  - Every enriched scenario still has exactly six stages, twelve scoring entries, complete
    feedback and an end-state.
  - **Every cue in `evaluation.feedback.cues` is still observable in the candidate payload.**
  - **No candidate-visible block contains disposition, difficulty, family or trigger
    vocabulary** (an automated lint).
  - **Block-count distribution is statistically indistinguishable between the 80 malicious and
    the 20 legitimate scenarios** (the anti-oracle test).
  - Offline safety: zero non-reserved hosts, zero data URIs, all assets inert, all phone
    numbers in the reserved range.
  - Fidelity: the client's original strings are still present verbatim where DATA-002 stored
    them.
  - Selection is unaffected: the 400-seed constraint suite passes unchanged.
- **Browser verification.** All four platforms, ten scenarios end to end, at 100% and 200%
  zoom.
- **Production safety.** Publishing new versions is reversible through the ADMIN-001 lifecycle
  — deactivate v2, reactivate v1. **Do not deactivate v1.**
- **Rollback.** Reactivate v1. In-flight attempts are unaffected either way because runs pin
  their version.
- **Dependencies.** **None** — can start in parallel with IMMERSIVE-001. **The largest single
  win available, and it is content work, not engineering risk.**
- **Size.** XL (100 scenarios across four platforms of authoring, plus review).

---

### IMMERSIVE-004 — Inhabited environment (background items, personas, day clock)

- **Objective.** Close matrix row 3.14 and improve 3.7 and 1.9: benign background items,
  recurring personas, a synthetic working-day clock.
- **Files.** **new** `backend/data/background/v1/background.*.json` ·
  `frontend/src/utils/syntheticScreen.js` (`inboxScreen()` gains background rows) ·
  `frontend/src/state/dashboardOrchestrator.js` (tile previews from background items) ·
  `frontend/src/components/simulation/AppSurfaces.jsx` (quiet apps show background threads) ·
  **new** `frontend/src/utils/sessionClock.js`.
- **Backend impact.** One new static data file, served with the scenario payload or as its own
  read-only endpoint. **Decide during design; prefer bundling it into the attempt payload over
  a new endpoint.**
- **Frontend impact.** Moderate.
- **Database impact.** Optional: store background items as `ScenarioDefinition`-adjacent
  documents, or ship them as a static file. **Recommend static** — they are
  attempt-independent, never scored and never versioned per attempt.
- **Migration.** None.
- **Testing.** Background items are identical regardless of which scenario is live (the
  anti-leak assertion) · deterministic per attempt · never scoreable, never openable into a
  decision · opening a quiet app records no event and cannot advance a stage · the day clock
  is monotonic across ordinals one to ten.
- **Browser verification.** Open all four apps mid-attempt; confirm the other three show
  plausible benign traffic and that nothing indicates which tile is "correct".
- **Production safety.** Additive.
- **Rollback.** Empty the background pool; `inboxScreen()` returns to one row.
- **Dependencies.** IMMERSIVE-003 (personas). **Includes the asset-kind distribution
  measurement from §9.4, whose result may change IMMERSIVE-005's scope.**
- **Size.** M.

---

### IMMERSIVE-005 — On-device interaction (the MCQ removal)

- **Objective.** Close matrix rows 1.2, 4.7, 4.11 and N.15: real `actions` on the renderers,
  device affordances mapped to existing intents, the side panel retained as the canonical
  accessible path.
- **Files.** `components/simulation/PhoneShell.jsx` (**the `actions={[]}` seam**) · all four
  channel renderers (interactive blocks; new block types) ·
  `frontend/src/constants/simulation.js` (an affordance map beside the existing action
  catalogue) · `components/simulation/ActionSheet.jsx` (becomes the collapsible accessible
  twin) · `components/simulation/InspectSheet.jsx` (in-device sheets) ·
  `hooks/useAttemptController.js` (`link_hover_ms` metadata) · `utils/syntheticScreen.js`.
- **Backend impact.** **None. Zero backend files.** Every intent already exists.
  `link_hover_ms` is already in `METADATA_ALLOWLIST` and on `ScenarioEvent`.
- **Frontend impact.** Large — the biggest frontend change in the plan.
- **Database / migration.** None · none.
- **Testing.**
  - Every device affordance submits the **same intent** its panel twin submits (a paired
    assertion per intent).
  - **The anti-oracle test from §9.4** — affordance presence does not predict disposition.
  - **Keyboard-only completion of a full scenario**, all six stages (this is V2, finally
    closed).
  - No click handler on a non-button anywhere in `src` (the existing invariant, re-asserted).
  - `link_hover_ms` is emitted on both hover and keyboard focus-hold, and carries zero points.
  - No affordance is styled, ordered or weighted by risk (the existing `ActionSheet` rule,
    extended to the device).
  - Reduced motion collapses every reveal.
- **Browser verification.** A full ten-scenario attempt driven entirely from the device; then a
  full attempt driven entirely from the keyboard.
- **Production safety.** Frontend only. **Highest regression risk in the plan** — it changes
  how every scored action is initiated.
- **Rollback.** Restore `actions={[]}`. The panel path is untouched and remains fully
  functional, so **rollback is a one-line, zero-loss operation.** This is why the panel must be
  retained rather than replaced.
- **Dependencies.** IMMERSIVE-003 (content), IMMERSIVE-004 (the distribution measurement),
  ACCEPT-003 (the accessibility baseline).
- **Size.** L.

---

### IMMERSIVE-006 — Simulated-surface completion (§4 gaps)

- **Objective.** Close matrix rows 4.2 and 4.5: safe-browser address bar and page states;
  call-screen timer, captions and the five named controls; and complete the four inspection
  sheets (§8's highest-value item on every platform).
- **Files.** `components/simulation/LocalSurfaces.jsx` ·
  `components/simulation/InspectSheet.jsx` · the four renderers · `utils/syntheticScreen.js`
  (`senderFields()` gains the new rows) · the enriched content must supply the new fields —
  account age, reply-to, authentication summary, SIM label, mutual groups, join date.
- **Backend impact.** None — the new fields ride in `synthetic.assets[].content`, which is
  `Mixed`.
- **Frontend impact.** Moderate.
- **Database impact.** Content only, through the IMMERSIVE-003 authoring pass.
- **Migration.** None.
- **Testing.** **The input, textarea and form element count is still zero on every simulated
  surface** (the §12.3 hard rule, asserted per platform) · one real control per quiet surface
  (the existing `AppSurfaces.test.jsx` invariant) · every stage-3 cue named in the
  specification is present in the corresponding sheet.
- **Browser verification.** Every surface type across the bank: browser, file, QR, call,
  payment, install.
- **Production safety.** Frontend plus content.
- **Rollback.** Revert the components; content fields are simply unread.
- **Dependencies.** IMMERSIVE-003 (content fields), IMMERSIVE-005 (interaction).
- **Size.** M.

---

### IMMERSIVE-007 — The scene director (timed reveal and escalation)

- **Objective.** Close N.17, N.21, N.24 and matrix row 4.14: messages that arrive, typing
  indicators, follow-ups, escalation within a scenario's own six stages.
- **Files.** **new** `frontend/src/state/sceneDirector.js` (pure) · **new**
  `frontend/src/hooks/useSceneDirector.js` · `components/simulation/PhoneShell.jsx` · the four
  renderers (a `typing` block) · enriched content gains `reveal_after_ms` and
  `reveal_on_stage` hints.
- **Backend impact.** **None.** Reveals are presentation; **no event is written.**
- **Frontend impact.** Moderate.
- **Database impact.** Content hints only, inside `Mixed`.
- **Migration.** None.
- **Testing.** Deterministic (the same run id yields the same schedule; `Math.random` is absent
  from the path) · idempotent on reload (a passed stage gate renders immediately, never
  replays) · cannot submit an intent (structural: no access to `controller.submit`) · every
  timer is cleared on unmount and on stage change (the leak test) · reduced motion collapses
  everything · the total scripted delay per stage is bounded · a keyboard-reachable "Show
  everything" escape exists.
- **Browser verification.** Watch a scenario escalate; reload mid-reveal and confirm no replay;
  complete an attempt with reduced motion enabled.
- **Production safety.** Frontend only.
- **Rollback.** Render every block immediately — which is exactly today's behaviour, so the
  degraded state is the current product.
- **Dependencies.** IMMERSIVE-003, IMMERSIVE-005.
- **Size.** M.

---

### IMMERSIVE-008 — Immersion acceptance re-run

- **Objective.** Re-establish every acceptance guarantee the preceding tasks could have
  disturbed.
- **Scope.** The offline / network-off run (ACCEPT-002's method, re-executed against the
  enriched bank) · keyboard-only completion and contrast (ACCEPT-003, re-run) · 200% zoom on
  every enriched surface · the long-session soak (a full 90-minute window, heap and handle
  counts compared) · the full anti-oracle suite · a bank re-audit updating
  `acceptance-scenario-bank.json` · a refreshed `ACCEPTANCE_MATRIX.md`.
- **Files.** `docs/ACCEPTANCE_MATRIX.md` · `docs/acceptance-scenario-bank.json` ·
  `docs/ACCEPTANCE_OFFLINE.md` · `PROJECT_MASTER_PLAN.md`. **No product code.**
- **Backend / frontend / database / migration.** None · none · none · none.
- **Rollback.** Not applicable — verification only.
- **Dependencies.** All of the above.
- **Size.** M.

---

### Tasks that can proceed independently

| Task | Independent of |
|---|---|
| **IMMERSIVE-000** | everything |
| **IMMERSIVE-001** | everything except client sign-off |
| **IMMERSIVE-003** | everything (content authoring) |
| **FEEDBACK-001** | everything in this plan (§11.3) |
| **ACCEPT-003** | everything; **should precede IMMERSIVE-005** |

---

## 17. Exact implementation order and dependencies

```
CLIENT SIGN-OFF -- C1 duration · C2 timeout scoring · C3 progress inclusion
        |
        +----------------------------------------------+
        v                                              v
  IMMERSIVE-001  --> IMMERSIVE-002              IMMERSIVE-003
  (90-min timer)     (menu behaviour)           (enriched content)  -- no dependency
        |                                              |
        |                                              v
        |                                       IMMERSIVE-004
        |                                       (background world
        |                                        + oracle measurement)
        |                                              |
        |            ACCEPT-003 -----------------------+
        |            (a11y baseline)                   v
        |                                       IMMERSIVE-005
        |                                       (on-device interaction)
        |                                              |
        |                                   +----------+----------+
        |                                   v                     v
        |                            IMMERSIVE-006          IMMERSIVE-007
        |                            (surface gaps)         (scene director)
        |                                   +----------+----------+
        +----------------------------------------------+
                                                       v
                                                IMMERSIVE-008
                                            (acceptance re-run)

  IN PARALLEL, no dependency on any of the above:
    IMMERSIVE-000 (login label)          -- ship immediately
    FEEDBACK-001  (training feedback)    -- the previously scheduled next task
```

**Recommended execution order**

| # | Task | Why here | Blocking? |
|---|---|---|---|
| 0 | **IMMERSIVE-000** | XS, closes an open §2 compliance defect, zero risk | No |
| 1 | **Client sign-off C1–C3** | The timeout-scoring rule changes what a result *means* | **BLOCKS 001** |
| 2 | **IMMERSIVE-001** | The client's newest hard requirement; changes the `Attempt` contract every later task reads; also fixes the latent S8 blocking bug | — |
| 3 | **IMMERSIVE-002** | Small; its logout copy must describe the timer | needs 001 |
| 4 | **IMMERSIVE-003** | The single largest win. **Can start at step 1, in parallel** — it is content authoring and touches nothing 001 touches | No |
| 5 | **ACCEPT-003** | Establishes the accessibility baseline *before* the interaction changes | No |
| 6 | **IMMERSIVE-004** | Delivers the inhabited world **and** the oracle measurement that may resize 005 | needs 003 |
| 7 | **IMMERSIVE-005** | The MCQ removal. Highest regression risk, so it goes after the baseline and the measurement | needs 003, 004, ACCEPT-003 |
| 8 | **IMMERSIVE-006** | Surface completion, now that interaction exists | needs 005 |
| 9 | **IMMERSIVE-007** | Pacing, once there is content to pace and affordances to pace around | needs 005 |
| 10 | **IMMERSIVE-008** | Re-establish every acceptance guarantee | needs all |
| — | **FEEDBACK-001** | Independent; slot wherever capacity allows | No |

**The one ordering rule that matters: IMMERSIVE-005 must not precede IMMERSIVE-004.** The
asset-distribution measurement is what tells us whether device affordances leak the
disposition, and building the affordances first would mean discovering the leak after it
shipped.

---

## 18. Risk register

| # | Risk | L | I | Exposure | Mitigation | Owner |
|---|---|---|---|---|---|---|
| R1 | **The timeout scoring rule is changed by the client after implementation** | M | H | Rework of the expiry service, the result projection, and the meaning of every expired attempt | **Get C2 in writing before IMMERSIVE-001 starts.** | Client |
| R2 | **Device affordances leak the disposition** | **H** | **H** | The assessment silently stops measuring judgement | §9.4: measure first, assert indistinguishability, enforce uniform affordance shape. A precedent exists (`reject_ignore`) and a prior instance was caught (15.33). | Eng |
| R3 | **Enriched content changes the difficulty calibration** | M | H | §1's 8/9/8 per-platform difficulty distribution becomes untrue | Authoring rule: cues may be *dramatised*, never *added or removed*. Instructional review per Appendix A `quality`. | Content |
| R4 | **Enriched content leaks the answer in a narrative block** | M | H | Scenarios become unscoreable | An automated lint for classification vocabulary in candidate-visible blocks; the allowlist projection is unchanged. | Eng |
| R5 | **Keyboard-only completion regresses** | M | H | An explicit §6 release criterion fails | The panel stays the canonical tab order; ACCEPT-003 before and after. | Eng |
| R6 | **A scene-director timer leaks over a 90-minute session** | M | M | Degradation late in a long attempt | A teardown test; the long-session soak in IMMERSIVE-008. | Eng |
| R7 | **The expiry sweeper touches a production attempt during development** | M | **H** | Irreversible corruption of real training records | The recurring hazard recorded in 15.39 and 15.43 — a dev server pointed at production. **A throwaway stack is mandatory for every timer test.** Verify `expires_at: null` on both existing attempts before deploying. | Eng |
| R8 | **A 90-minute limit is unfair without an accommodation path** | M | M | An accessibility complaint; possibly a WCAG 2.2 §2.2.1 issue | C4: confirm whether an instructor extension is required. | Client |
| R9 | **Expired attempts distort ProgressSnapshot** | **H** | M | `best_score`, trend and exposure count become misleading | C3 must be answered before IMMERSIVE-001. Recommended default: include, marked — excluding them would let a learner discard a bad attempt by walking away. | Client |
| R10 | **Scope creep from "make it realistic"** | **H** | M | An unbounded task that never completes | Every task states its files and its specification row. **Anything not traceable to a specification row or a numbered client requirement is out of scope.** | PM |
| R11 | **Content-authoring volume is underestimated** | **H** | M | IMMERSIVE-003 stalls the chain | 100 scenarios across four platforms. **Pilot eight scenarios (two per platform) first, measure, then extrapolate before committing.** | PM |
| R12 | **Cross-scenario arcs are demanded late** | M | H | A selection change breaks §7 comparability for all history | §10.4: it is possible, it is a separate task, and it costs the historical trend. Say so before it is asked for. | PM |
| R13 | **A form element is added for realism** | M | **H** | A §6 Privacy breach — the one thing the safety boundary exists to prevent | The §12.3 hard rule plus a per-platform test asserting zero form elements. | Eng |
| R14 | **The timer breaks state recovery** | L | **H** | A §6 release criterion fails | Nothing authoritative moves to the client; the deadline is in the database. Explicit recovery tests. | Eng |
| R15 | **Background items correlate with the live scenario** | M | M | A subtle oracle | Fixed pool, keyed on `attempt_id`, **never on the scenario**; asserted by test. | Eng |
| R16 | **Regression in the 1,005 existing automated checks** | M | H | Loss of the project's main safety net | Run backend `npm test`, `test:engine`, frontend `npm test`, `lint` and `build` after **every** task; record the totals in the master plan as every prior task has. | Eng |

---

## 19. Testing strategy

**Baseline to preserve (as recorded after CLIENT-POLISH-001):**

```
backend  npm test              709 · 426 pass · 0 fail · 283 skipped
backend  npm run test:engine   283 · 283 pass · 0 fail
frontend npm test              274 · 274 pass · 0 fail
frontend npm run lint          0 warnings · 0 errors
frontend npm run build         clean
```

Every task must leave these green and report the new totals, following the convention every
prior task in `PROJECT_MASTER_PLAN.md` has used.

**New test classes this plan requires — none of which exist today:**

| Class | What it asserts | Task |
|---|---|---|
| **Expiry idempotency** | `expireAttempt` twice changes nothing and writes nothing | 001 |
| **Expiry concurrency** | Expiry racing completion — exactly one transitions | 001 |
| **Expiry integrity** | `assertResultIntegrity` and `verifyRunIntegrity` both pass on an expired attempt | 001 |
| **Timer non-authority** | No client input can change a deadline; `FORBIDDEN_INPUT` rejects all five fields | 001 |
| **Recovery** | Reload, close and reopen, process restart, crash mid-expiry | 001 |
| **Null-deadline safety** | An attempt with `expires_at: null` never expires | 001 |
| **Menu specification conformance** | The menu still contains §3's four items, in order | 002 |
| **Cue preservation** | Every `evaluation.feedback.cues` entry is still observable after enrichment | 003 |
| **Answer-leak lint** | No candidate-visible block contains classification vocabulary | 003 |
| **Anti-oracle: content** | Block-count distribution is indistinguishable between the 80 and the 20 | 003 |
| **Anti-oracle: affordance** | Affordance presence does not predict disposition | 004, 005 |
| **Background isolation** | Background items are identical regardless of the live scenario | 004 |
| **Intent equivalence** | Each device affordance submits the same intent as its panel twin | 005 |
| **Keyboard-only completion** | A full six-stage scenario completed by keyboard alone (closes V2) | 005 |
| **Zero form elements** | No input, textarea or form element on any simulated surface | 006 |
| **Director purity** | Deterministic, idempotent on reload, cannot submit an intent | 007 |
| **Timer teardown** | Every interval and timeout is cleared on unmount and stage change | 007 |
| **Long-session soak** | A full 90-minute window; heap and handles compared at start and end | 008 |
| **Offline re-run** | The enriched bank, network disabled, a monitor showing zero outbound attempts | 008 |

**Browser verification discipline — unchanged and mandatory.** Every task that touches the
learner surface is verified in a real browser on a **throwaway stack** (isolated mongod on a
non-standard port, an isolated database, non-production backend and Vite ports), exactly as
every prior task did. **Production is never a participant.** For the timer, the throwaway stack
runs a shortened duration constant so a 90-minute path can be exercised in minutes.

---

## 20. Acceptance criteria

### The timer (IMMERSIVE-001)

1. An attempt created after the change carries `expires_at = started_at + duration_ms`, and the
   value cannot be altered afterwards by any request or code path.
2. A refresh, a tab close, a browser close and a machine restart all leave the deadline
   unchanged; reopening within the window resumes at the last committed state, with no
   duplicated points and no skipped events (§6 State recovery).
3. Reopening after the deadline lands on the result — never on a resumable assessment.
4. At the deadline, the attempt ends without any browser being open, and a result exists.
5. Every scenario in an expired attempt is resolved, so the attempt still holds exactly ten
   resolved scenarios (§5).
6. Each expired scenario scores `clamp(score_running, 0, 10)`; an untouched scenario scores 0;
   the total is the sum, and `assertResultIntegrity` passes.
7. No request body can create, extend or shorten a deadline.
8. Two tabs show the same remaining time and neither can end or extend anything.
9. The result screen states plainly that the limit was reached and how many scenarios were
   incomplete, with no inference about the learner (§5.14).
10. The instructor attempt view and both exports show `end_reason` and `unresolved_at_expiry`.
11. Running the sweeper twice on the same attempt changes nothing.
12. Attempts with `expires_at: null` are never expired.

### The menu (IMMERSIVE-002)

13. The menu contains attempt history, accessibility, restart (instructor-controlled) and
    logout, in that order (§3).
14. Attempt history opens in-shell and does not leave the assessment; the live attempt is
    absent from it.
15. Logout confirms first, states that the attempt continues and that the clock keeps running,
    and on confirmation leaves the attempt resumable.
16. Accessibility opens immediately, with no confirmation and no gate.
17. Restart still performs nothing and names the instructor as its owner.

### Immersion (IMMERSIVE-003 through 007)

18. **No candidate-visible content contains third-person narration about the learner.**
19. Every scenario's thread opens with history that makes the current message legible.
20. Every cue named in the scenario's own feedback remains observable in the candidate payload.
21. No candidate-visible content states or implies disposition, difficulty, family or trigger.
22. **Affordance presence does not predict disposition.**
23. Block-count and asset-kind distributions are indistinguishable between the 80 malicious and
    the 20 legitimate scenarios.
24. A full scenario can be completed by keyboard alone, through all six stages (V2 closed).
25. Every device affordance submits the same intent as its side-panel twin.
26. Under `prefers-reduced-motion`, every reveal is immediate.
27. No input, textarea or form element exists on any simulated surface.
28. Opening a quiet app shows benign background items, records no event, and cannot advance a
    scenario (§3).
29. Background items do not vary with the live scenario.
30. The scene director cannot advance a stage, submit an intent or write an event.
31. Reloading mid-reveal does not replay content the learner has already seen.

### Preserved throughout — the non-negotiables

32. The six-stage state machine is unchanged.
33. The nine scoring events and their deltas are unchanged.
34. All nine selection constraints hold across the 400-seed suite.
35. The attack-family and trigger taxonomies are unchanged.
36. The event vocabulary gains only `RUN_EXPIRED` (engine telemetry, zero points).
37. The candidate projections remain allowlists; `evaluation` remains `select: false`.
38. The offline boundary holds: zero non-reserved hosts, zero data URIs, all assets inert, zero
    outbound requests under a network monitor.
39. 200% zoom produces no horizontal overflow and no clipped element.
40. The full regression suite is green and its totals are recorded.

---

## 21. Items requiring client clarification

**C1 to C3 block IMMERSIVE-001 and should be answered in writing.**

| # | Question | Why it cannot be decided internally | Recommended default |
|---|---|---|---|
| **C1** | Confirm the 90-minute duration as an amendment to specification v1.0, which contains no time limit anywhere. Is 90 minutes fixed, or instructor-configurable per session? | It amends a signed-off specification and changes the assessment's conditions | 90 minutes, fixed in v1; instructor-configurable in a later task, clamped 15–240 minutes, pinned per attempt |
| **C2** | **How should a scenario unfinished at expiry score?** Options: (A) keep the evidence earned so far, clamped 0–10; (B) force 0; (C) no result at all; (D) score out of the scenarios completed | It changes what a 0–100 result *means*, and §7 comparability depends on that meaning being stable | **(A).** It reuses the engine's existing resolution rule, honours §5's "positive evidence is earned", and makes an untouched scenario score 0 naturally |
| **C3** | Should a timed-out attempt count toward `ProgressSnapshot` — `attempt_count`, `last_score`, `best_score`, trend and exposure count? | A §7 policy question about what progress represents | **Include, marked as expired.** Excluding them would let a learner discard a bad attempt by walking away from it |
| **C4** | Should an instructor be able to grant extra time for a documented accessibility accommodation? | A timed assessment normally needs an accommodation path; §6's instructor controls do not currently include one | Not in v1. If required, a new instructor control with its own audit action — a separate task |
| **C5** | Does the client accept that the profile menu keeps all four items (as §3 requires), with behaviour changed rather than items removed? | The client's verbal request conflicts with their own written specification | Yes — §6 of this document |
| **C6** | Should enriched scenario content be reviewed and signed off by the client before publication? | Appendix A requires content, technical and instructional review; the original 100 were client-supplied | Yes. Pilot eight scenarios (two per platform) for sign-off before authoring the remaining 92 |
| **C7** | §4's action sheet names **Forward**, which has no intent and no scoring event in §5's nine. Should forwarding a malicious item be scoreable, and if so at what delta? | §5's deltas are the client's numbers; inventing one would be inventing a client requirement | Leave Forward unimplemented in v1 and record the gap, rather than invent a score |
| **C8** | Should scenarios ever interrupt each other across platforms (a real second live scenario), or is a non-scoreable background toast sufficient? | True concurrency requires concurrent runs — an engine change this plan otherwise avoids entirely | A background toast only. True concurrency is a separate, larger initiative |
| **C9** | Should cross-scenario story arcs be pursued, accepting a new `SELECTION_ALGORITHM_VERSION` and the loss of §7 comparability with every existing attempt? | It is a selection change with a permanent effect on historical trend data | **No** for v1. Deliver continuity through personas, the day clock and in-scenario escalation first, then reassess |

---

## Appendix — evidence index

| Claim | How it was established |
|---|---|
| The specification contains no time limit | Full-text search of all 116 pages for time-limit vocabulary; the only hits are per-event telemetry and the three-week delivery window |
| No client document contains a time limit | The same search across all six `.docx` and all three `.pdf` artefacts in the project root |
| 100 of 100 scenarios have exactly one message bubble | Parsed `backend/data/synthetic/v1/synthetic.*.json` and counted message blocks per scenario |
| 100 of 100 scenarios contain a narrator note block | The same parse, counting note blocks |
| The renderers receive no actions | `frontend/src/components/simulation/PhoneShell.jsx` — `actions={[]}`, `onAction={noop}` |
| The renderers already support actions | All four channel renderers destructure `{ screen, actions, backAction, onAction, onOpen }` and render an action row when actions are supplied |
| `link_hover_ms` is never produced | `grep -rn link_hover_ms frontend/src` returns nothing; three backend declarations exist |
| No simulated surface contains a form element | A count of input, textarea, form and href occurrences in `LocalSurfaces.jsx` and `AppSurfaces.jsx` returns zero for both |
| The audit log cannot record a system action | `AuditEvent.actor_admin_id` and `actor_username` are both required and immutable |
| `completeAttempt` refuses an unfinished attempt | `attemptService.js` throws `SCENARIOS_OUTSTANDING` when any run is unresolved |
| The result requires ten resolved runs | `assertResultIntegrity()` in `attemptResultService.js` |
| An in-progress attempt blocks a new one | `createAttempt()` fails with `SELECTION_ATTEMPT_IN_PROGRESS` |
| The login label is still "Phone / Service Number" | `LoginPage.jsx:287` and `:379` |
| No timer exists in the backend | A search for expiry and interval usage in `backend/src` returns only a transaction-retry backoff |
| The bank matches the PDF on all 100 | All 100 detail pages parsed and cross-checked against the database index; fingerprint `8e7a6c98...038a7687` unchanged since DATA-002 |

---

**END OF PLAN — no implementation has begun.**
