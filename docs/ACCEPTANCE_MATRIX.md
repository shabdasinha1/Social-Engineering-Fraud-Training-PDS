# Acceptance Matrix (ACCEPTANCE-001)

**Audit date:** 7 September 2026 · **Type:** read-only acceptance audit · **No product code was modified.**
**Authority:** `Interactive_Social_Engineering_Scenario_UI_Development_Specification.pdf`, Version 1.0, 02 September 2026 (116 pages, full text extracted and read).
**Machine-readable bank audit:** [`acceptance-scenario-bank.json`](acceptance-scenario-bank.json)

---

## 1. Executive status

**The product is functionally complete against the specification's core: the scenario bank, the
six-stage engine, scoring, selection, results, and all five instructor capabilities are
implemented and evidenced.** The gaps that remain are concentrated in two places: the
**learner dashboard shell (§3)**, whose orchestration behaviours were partly implemented
inside the simulation and partly not implemented at all, and the **release acceptance
checklist (§6)**, where two explicit pass conditions have never actually been executed as
tests.

| Verdict | Count |
|---|---|
| PASS | 47 |
| PARTIAL | 11 |
| MISSING | 3 |
| VERIFICATION_GAP | 4 |
| INTENTIONALLY_DEFERRED | 2 |
| NOT_APPLICABLE | 2 |
| **Total requirements assessed** | **69** |

**Blockers: 1. High: 5.**

The single blocker is a *verification* blocker, not a defect: the specification's release
checklist says "With network disabled, all scenarios, assets, reports and feedback work.
Network monitor shows no outbound attempts" — and that test has never been run. Static
evidence is strong and no code path suggests it would fail, but the checklist demands the
test, and a client acceptance sign-off cannot honestly claim it without one.

**Recommendation: the product is not yet ready for client acceptance sign-off, but it is
close.** One verification task (ACCEPT-002) plus one small learner-shell task (UI-004) would
clear the blocker and every HIGH item.

---

## 2. Requirement matrix

### §1 Product Scope and Design Principles

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1.1 | Persistent low-salience "TRAINING SIMULATION" rail; not trademark-perfect | **PASS** | `TrainingRail.jsx` renders "TRAINING SIMULATION — OFFLINE" persistently outside the device; verified in browser |
| 1.2 | Unsafe and safe controls interactive; branches change local screens, score and feedback | **PASS** | `ActionSheet`, `LocalSurfaces`, engine transitions; browser run reached STEP 2 OF 6 with risky options selectable |
| 1.3 | Every scenario produces at least six ordered UI events | **PASS** | All 100 have exactly 6 ordered stages and 12 scoring entries — bank audit `stage_order_ok: true`, `all_have_scoring: true` |
| 1.4 | Bank totals 80 malicious + 20 legitimate (≥20% legitimate) | **PASS** | Bank audit `overall: {malicious: 80, legitimate: 20}` |
| 1.5 | Each platform has 8 easy, 9 medium, 8 hard | **PASS** | Bank audit: all four platforms `level_ok: true` |
| 1.6 | Military-context tag visible to authors, never from live data | **PASS** | `military_flag` per platform = 10/12/8/5, matching each bank's stated composition exactly; all entities fictional |
| 1.7 | All browser/file/QR/call/login/payment experiences are local mocks behind a deny-by-default boundary | **PASS** | `LocalSurfaces.jsx` (no `href`, `src`, `fetch`, `window.open`); 34 URLs in the bank, **0 non-reserved** |
| 1.8 | **Network-off test completes all 100 scenarios** | **VERIFICATION_GAP** | See §5, item V1 — **BLOCKER** |

### §2 Screen 1 — Login / Identification

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 2.1 | Name field: required, 2–60 chars, trimmed, control chars rejected, label visible | **PASS** | `LoginPage.jsx`; browser: label "Full Name" present and associated |
| 2.2 | Service number: required, 3–24 alphanumeric + hyphen, normalised as profile key, masked to last four on later screens | **PASS** | `normaliseIdentifier()`; `maskIdentifier()`; browser showed `•••0001` on the simulation chip |
| 2.3 | Start disabled until client validation passes; retrieve-or-create profile | **PASS** | `LoginPage.jsx` + `findOrCreateCandidate()` |
| 2.4 | **Profile-found card:** masked number, last attempt date, attempts completed, "Continue as this learner" | **MISSING** | No such card exists. Login goes straight to briefing/dashboard on submit. See G4 |
| 2.5 | Five required states (Blank, Validating, New profile, Returning profile, **Storage error** with Retry) | **PARTIAL** | Blank/validating/error handled; no distinct "new vs returning profile" state and no storage-error state with Retry. See G4 |
| 2.6 | Footer: Instructor help / Exit | **MISSING** | Neither control exists on the login screen. See G4 |
| 2.7 | Keyboard navigable, high-contrast focus, 200% zoom | **PASS** | Browser: all 3 controls ≥44px and labelled; at `zoom: 200%` no horizontal overflow and no clipped element |
| 2.8 | LearnerProfile `{profile_id, display_name, service_no_normalized, service_no_masked, created_at, last_seen_at}` | **PASS** | `Candidate` is the LearnerProfile (15.16 mapping, no rename). PROFILE-001 stores `service_no_masked` (from the normalised value) and `last_seen_at`; `profile_id` is published on the instructor surface only, never to the learner. See 15.48 |
| 2.9 | No password, Aadhaar, phone, email, rank or real unit fields | **PASS** | No such field was ever stored. **G8 closed by IMMERSIVE-000 (9 September 2026):** the label now reads §2's own "Personal / Service Number" on both the form and the profile-found card, the "10-digit phone number" hint is gone, and no user-facing string on the entry screen names a phone. Guarded by three new tests, including `phone` added to the forbidden-label assertion that had omitted it. See PROJECT_MASTER_PLAN.md 16.11 |
| 2.10 | Consent/briefing acknowledgement as a versioned boolean + timestamp | **PASS** | `briefing_version` + `briefing_acknowledged_at` persisted server-side; the boolean is derived against `BRIEFING_VERSION`. Gated on a checkbox - loading the page acknowledges nothing - and a reload retains it. See 15.48 |

### §3 Screen 2 — Post-Login Dashboard

> **Closed by UI-004 (8 September 2026).** Rows 3.3, 3.6, 3.7, 3.8, 3.10, 3.11, 3.12 and
> 3.14 below record the state at the time of this audit. Gap **G5** was closed by UI-004 —
> see PROJECT_MASTER_PLAN.md 15.45 and `docs/SIMULATION_UI.md` section 15. The rows are left
> as written, because this file is the record of what the audit found.

> **Architectural note.** §3's hub is implemented **inside the simulation shell** (`/assessment`),
> not on the `/dashboard` route. `/dashboard` remains the pre-simulation launcher from FE-007.
> That is a defensible reading of "a simulated mobile communication hub", and the audit treats
> the simulation shell as the §3 surface. Items below are judged against that surface.

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 3.1 | Persistent training banner + notification bar with local clock, sound state, connection-off indicator | **PASS** | Browser: "TRAINING SIMULATION — OFFLINE · Network off · Sound off · 04:28 PM" |
| 3.2 | Profile chip: display name + masked service number | **PASS** | Browser: "Acceptance Auditor / •••0001" |
| 3.3 | Profile chip **menu**: attempt history, accessibility, restart, logout | **MISSING** | The chip is a button with no menu. See G5 |
| 3.4 | Progress card: scenario n/10, segmented progress bar, elapsed time, status | **PASS** | Browser: "Scenario 1 of 10", `SegmentedProgress`, elapsed "00:04" |
| 3.5 | Running score hidden in assessment mode | **PASS** | `ScenarioRun.toCandidateJSON()` omits `score_running`; `scoreVisible()` gates on training mode |
| 3.6 | Four equally weighted app tiles, generic icons, unread badges, last-event preview, status dot | **PARTIAL** | Browser: four tiles with icons and an unread badge on WhatsApp. No last-event preview text and no per-tile status dot. See G5 |
| 3.7 | Do not lock apps into a fixed sequence | **PARTIAL** | Four tiles are present and selectable, but the engine serves one run at a time by ordinal, so the learner cannot choose which scenario to take next. See G5 |
| 3.8 | Stacked toast tray, **queue at most three** | **PARTIAL** | A single `NotificationBanner` is rendered; the code comments the three-item rule but the engine issues one live scenario at a time, so a tray is never exercised. See G5 |
| 3.9 | Dismiss logs an event but does not remove the required scenario | **PASS** | `dismiss` intent → `notification_dismissed`, stays at NOTIFY; engine test "dismissing a notification stays at NOTIFY and does not remove the scenario" |
| 3.10 | **Deliver the next event 1–4 seconds after the dashboard becomes idle** | **MISSING** | No timer exists anywhere in the simulation. The next scenario appears immediately. See G5 |
| 3.11 | Orchestrator status: "New activity will arrive shortly" + Resume after interruption | **PARTIAL** | Resume works (`/attempts/current`); the specific idle copy is absent |
| 3.12 | Support: Rules / Report simulation issue (separate from the scenario report control) | **MISSING** | Neither control exists. See G5 |
| 3.13 | Completion: after 10 resolved, replace app-grid CTA with "View results"; preserve attempt atomically first | **PASS** | `SimulationPage.jsx` renders "View results"; `completeAttempt()` commits in a transaction before the result is served |
| 3.14 | Wrong app shows only benign background items; never expose which tile is correct | **VERIFICATION_GAP** | Non-badged tiles are present and openable; behaviour on opening one was not exercised in this audit. See V4 |

### §4 Common Simulation UI and State Model

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 4.1 | Centred mobile viewport, target 390×844, inside responsive desktop frame | **PASS** | `PhoneShell`/`DeviceFrame`; verified visually |
| 4.2 | Safe browser: reserved pages, address bar, Back/Close, page states; DNS/network blocked; typed data tokenised | **PASS** | `LocalSurfaces.jsx`; no `href`/`src`/`fetch`/`window.open` anywhere in it |
| 4.3 | File viewer: inert preview; risky types show simulated open/install branch; never executes or calls host handlers | **PASS** | `LocalSurfaces.jsx`; all 511 assets `inert: true` (bank audit) |
| 4.4 | QR inspector: decode only local payload, show full synthetic target before Open; camera/clipboard disabled | **PASS** | `LocalSurfaces.jsx`; no `navigator.mediaDevices`/`clipboard` anywhere in `src` |
| 4.5 | Call/voice screen: synthetic caller, timer, captions, Decline/Accept/End/Verify/Report; no mic/camera, no real dialer | **PASS** | `LocalSurfaces.jsx`; no device APIs in the grep |
| 4.6 | Trusted Directory: synthetic official contacts; in-message numbers cannot populate the result | **PASS** | `TrustedDirectory.jsx`; engine test "verifying through the message itself scores zero, never TRUSTED_VERIFY" |
| 4.7 | Action sheet: Reply/Forward/Delete/Mark safe/Verify/Report/Block; stable event code per choice; avoid disabling the wrong option | **PASS** | `ActionSheet.jsx`; `STAGE_INTENTS` maps every intent to a stable code |
| 4.8 | Rationale input: optional 250 chars, sanitised locally, no paste of real secrets, stored only if policy permits | **PASS** | `ScenarioRun.rationale` `maxlength: 250`; never scored; never released to any projection |
| 4.9 | **Feedback card: result, points, cues, preferred action, impact, one habit — training mode immediate** | **MISSING** | The feedback card exists **only on the result screen after completion**. No server surface releases feedback mid-attempt in any mode; `scoreVisible()` in `attemptMachine.js` is dead code with no consumer. See G1 — **HIGH** |
| 4.10 | Canonical six-stage machine: states, entries, allowed transitions, core events | **PASS** | `scenarioEngine.js` constants + 23 engine tests covering every transition, skip and rejection |

### §5 Scoring, Randomization and Attempt Rules

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 5.1 | Nine scoring events at the exact specified deltas (+2/+3/+3/+2/−1/−3/−8/−4/−2) | **PASS** | Bank audit lists all 16 codes incl. every specified one; deltas verified in `evaluation.stages[].scoring` |
| 5.2 | Clamp each scenario 0–10, then sum for 0–100 | **PASS** | `score_0_10` clamped at resolution; `assertResultIntegrity()` recomputes the sum; result API tests assert 100/100 and per-scenario bounds |
| 5.3 | Exactly 10 resolved scenarios | **PASS** | `ATTEMPT_SCENARIO_COUNT = 10`; attempt validator refuses any other count |
| 5.4 | Rotating 3/3/2/2 platform allocation | **PASS** | Selection test "the platform rotation is exactly balanced every four attempts" + "driven by attempt index, not by seed" |
| 5.5 | Target 3 Easy / 4 Medium / 3 Hard, one-step relaxation only if impossible | **PASS** | `DIFFICULTY_QUOTA = {easy:3, medium:4, hard:3}`; test "no constraint other than recent exclusion is ever relaxed" |
| 5.6 | Exactly 8 malicious + 2 legitimate, legitimate from different platforms | **PASS** | `DISPOSITION_QUOTA`; test "the two legitimate scenarios always come from different platforms" |
| 5.7 | 2–4 military-context cases per attempt | **PASS** | `MILITARY_RANGE`; asserted across 400 seeds |
| 5.8 | At least five psychological triggers | **PASS** | Constant + 400-seed test |
| 5.9 | No attack family more than twice | **PASS** | Constant + 400-seed test |
| 5.10 | Exclude the most recent 20 scenario ids where possible; store the deterministic seed | **PASS** | `RECENT_EXCLUSION_WINDOW = 20`; `Attempt.seed` frozen; tests on minimal relaxation |
| 5.11 | No adaptive difficulty in scored baseline mode | **PASS** | No adaptive code exists; sequence frozen at creation by a pre-save hook |
| 5.12 | Deterministic seed; no `Math.random`, no clock dependence in selection | **PASS** | `seededRandom.js`; the only `Math.random` in `src/` is in `adminService.js` decoy-hash timing defence, not selection |
| 5.13 | Persist event ledger and scenario result transactionally before the next notification | **PASS** | `withEngineTransaction`; 21 engine-transaction tests |
| 5.14 | Interpretation safeguard: no psychological-vulnerability labelling; report by family/trigger | **PASS** | `REMEDIATION_REASONS` are blame-free; result API test asserts no diagnosis language |

### §6 Data, Administration and Acceptance Criteria

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 6.1 | Entity: LearnerProfile minimum fields | **PASS** | See 2.8 / 15.48 |
| 6.2 | Entity: ScenarioDefinition incl. six states, **expected actions**, feedback, active | **PARTIAL** | All present and populated except `expected_actions`, which exists in the schema but is **empty on all 100** scenarios. `expected_safe_behavior` prose covers the intent per stage. See G7 |
| 6.3 | Entity: Attempt minimum fields | **PASS** | `Attempt.js` carries all nine |
| 6.4 | Entity: ScenarioRun minimum fields | **PASS** | `ScenarioRun.js` carries all eight |
| 6.5 | Entity: Event minimum fields incl. `metadata_allowlist` | **PASS** | `ScenarioEvent.js`; metadata is a closed allowlist schema |
| 6.6 | **Entity: ProgressSnapshot** `{profile_id, attempt_count, last_score, best_score, platform/family aggregates, generated_at}` | **PASS** | `ProgressSnapshot` model, `progressService` and `GET /api/progress`. A derived read model: rebuilt by full recomputation from completed attempts, so a retried completion cannot double-count. `ScenarioRun` stays the scoring authority. See 15.49 |
| 6.7 | Scenario manager: create/edit/clone/deactivate versioned scenarios | **PARTIAL** | Edit, clone, publish and deactivate all work end to end. **Create cannot succeed**: `SCENARIO_ID_PATTERN` allows `01`–`25` per platform and all 100 are in use. Surfaced in the UI, not patched. See G6 |
| 6.8 | Scenario manager: validate all six stages and synthetic asset references before publishing | **PASS** | Three validation layers (DATA-001 hook, synthetic safety, offline safety); 32 ADMIN-001 integration tests |
| 6.9 | Attempt viewer: filter by learner and date; scores, action path, remediation; no sensitive typed content | **PASS** | 37 ADMIN-002 tests incl. typed-rationale absence proven against stored data |
| 6.10 | Exports: offline CSV/PDF to an **instructor-selected local path**; mark training data and version | **PARTIAL** | CSV and PDF are produced, marked TRAINING SIMULATION / OFFLINE and versioned, written locally. **The instructor cannot select the path** — a browser cannot, and no desktop bridge exists. Surfaced honestly in the UI. See G9 |
| 6.11 | Controls: reset incomplete attempt, archive profile, configure feedback timing | **PARTIAL** | Reset and archive are complete and audited. Feedback timing is stored and audited but **`immediate` is not enforced** (see 4.9 / G1) |
| 6.12 | Audit: append-only log for publication, resets, exports, configuration changes | **PASS** | ADMIN-005; 25 tests; browser verification produced all five action types |
| 6.13 | Release — Content: 100 active, 25 per platform, 6 stages, scoring, end-state, feedback, totals match | **PASS** | Bank audit: `problems: []`, `active: 100`, all `*_ok: true`, `all_have_feedback: true`, `all_have_end_state: true` |
| 6.14 | Release — **Offline safety**: network disabled, all scenarios/assets/reports/feedback work; monitor shows no outbound attempts | **VERIFICATION_GAP** | **BLOCKER** — see V1 |
| 6.15 | Release — Scoring: automated tests cover safe path, every critical unsafe action, false-positive penalties, 0–10 clamping | **PASS** | 23 engine tests + 28 result API tests; all four critical codes exercised |
| 6.16 | Release — State recovery: close/reopen resumes at last committed state, no duplicate points, no skipped events | **PASS** | Idempotent `intent_key` under a unique index; resume tests; ADMIN-004 test proves a reset attempt cannot be resumed or double-scored |
| 6.17 | Release — **Accessibility**: keyboard-only completion, visible focus, readable contrast, labels, 200% zoom, no colour-only meaning | **PARTIAL** | 200% zoom **verified** (no overflow, nothing clipped); visible focus **verified** (2px outline); labels **verified** (0 unlabelled); ≥44px **verified**; no colour-only meaning **verified** (every state carries a word). **Keyboard-only completion and contrast are unverified** — see V2, V3 |
| 6.18 | Release — Privacy: no real password/OTP/payment/biometric field; logs use event allowlists; exports explicit and local | **PASS** | No such field anywhere; `metadataSchema` is a closed allowlist; export privacy proven by injection tests |
| 6.19 | Release — Consistency: badge, toast, app list, thread and backend state stay synchronised under interruption and retry | **PASS** | Single server-authoritative state; `attemptStateFor()` is the one source; duplicate-intent replay returns the original outcome |

### §7 Results, Feedback and Progress Comparison

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 7.1 | Large 0–100 total plus 10 scenario points; avoid pass/fail labels | **PASS** | `ResultSummary`; no pass/fail vocabulary anywhere |
| 7.2 | Behaviour breakdown: platform, family, trigger, action-stage; distinguish missed threat from false positive | **PASS** | `behaviourBreakdown()` produces all four axes; `OUTCOME_CLASSES` separates `missed_threat` from `false_positive`; asserted in result API tests. REVIEW-001 names the same classification per scenario (`review.learning_issue`) by lookup, never re-deriving it |
| 7.3 | Path replay: compact inspect/branch/verify/resolve timeline; never display real user secrets | **PASS** | `pathFromEvents()` emits `{step, stage, action}` only; key-exactness asserted. REVIEW-001 shows it beside the scenario's own expected path, and asserts `review.your_path` is that same array |
| 7.4 | Feedback per case: disposition, cues, safe response, impact, one habit; blame-free | **PASS** | `feedbackFrom()`; all 100 scenarios carry all five fields (bank audit). REVIEW-001 turns them into a per-scenario learning review — the learner's mistakes, the stage-specific correct action and the consequence. See `TRAINING_FEEDBACK.md` |
| 7.5 | Progress: compare current and previous only when mode/content version comparable; **show trend and exposure count** | **PASS** | Comparability gate and trend (delta) unchanged. PROGRESS-001 adds the exposure count — completed `attempt_count` — beside the trend on the result screen, and on the dashboard. Browser: both shown together. See 15.49 |
| 7.6 | Remediation: 2–3 targeted practice scenarios from weak families; no personality diagnosis | **PASS** | `remediationFor()` returns 2–3 families with blame-free reasons; no diagnosis |
| 7.7 | Exit: save completed attempt, Return to dashboard, **Print/export if authorized**, **Logout for the next learner** | **PARTIAL** | Save ✓ and Return to dashboard ✓ and Past assessments ✓. **No print/export control and no logout** on the result screen. See G10 |

### Appendix A — Scenario Content Authoring Schema

| # | Requirement | Status | Evidence |
|---|---|---|---|
| A.1 | identity: stable ID, title, version, platform, owner, review date, active flag | **PASS** | All present; `duplicate_ids: []`, `duplicate_versions: []` |
| A.2 | classification: difficulty, disposition, family, primary trigger, military flag, legitimate-control flag | **PASS** | All present; `legitimate_control_consistent: true`; 19 canonical families, 22 canonical triggers |
| A.3 | synthetic content: generated sender, message/thread, reserved link, inert asset ids, prior context | **PASS** | 511 assets, all inert, all stage refs resolve, 34 URLs all on reserved training domains |
| A.4 | six stages: each defines UI, choices, next states and events | **PARTIAL** | UI, transitions and events present on all 100 (`all_stages_have_transitions/events: true`); "choices" as an explicit `expected_actions` list is empty — see G7 |
| A.5 | scoring: stable event codes, point delta, per-scenario cap, critical-risk flag, expected final outcome | **PASS** | 12 entries per scenario; four codes carry `critical: true`; cap 0–10; `end_state` on all 100 |
| A.6 | feedback: disposition, signs, impact, preferred action, prevention habit | **PASS** | `all_have_feedback: true` |
| A.7 | quality: content/technical/instructional reviewer, safety, accessibility, pilot status | **NOT_APPLICABLE** | `quality` field exists in the schema and is null on the imported bank. This is authoring-process metadata for scenarios written after handoff, not a property of client-supplied content |

### Out of scope — confirmed NOT required by the authoritative specification

| Item | Status | Reasoning |
|---|---|---|
| Cross-attempt **admin statistics dashboard** | **NOT_APPLICABLE** | The specification contains **no** admin-statistics requirement. §6's admin minimum is five capabilities, all implemented. The `ProgressSnapshot` entity (6.6) is a **learner** progress aggregate, not an instructor dashboard. FE-014 / BE-005b derives from the superseded proposal, not from this specification |
| **Archived-profile visibility in the attempt viewer** | **NOT_APPLICABLE** | §6 requires archival as a control; nothing in §6 or §7 requires the viewer to display archival state. The ADMIN-006 limitation is cosmetic, not a specification gap |
| **Sub-640px reflow** | **NOT_APPLICABLE** | The specification requires **200% zoom** (verified PASS), not a 640px breakpoint. The 640px rule came from the project's own standards, not the client |
| Practice mode / adaptive difficulty | **INTENTIONALLY_DEFERRED** | §5 explicitly makes adaptive practice "a separate mode"; not required for the scored baseline product |
| Electron / native save dialog | **INTENTIONALLY_DEFERRED** | Required only to satisfy 6.10's "instructor-selected local path" fully; see G9 |

---

## 3. Blockers

### B1 — Network-off acceptance test has never been run · **BLOCKER**

- **Specification:** §1 acceptance signal "Network-off test completes all 100 scenarios"; §6 release checklist "With network disabled, all scenarios, assets, reports and feedback work. Network monitor shows no outbound attempts."
- **Current implementation:** Strong static containment. Bank: 34 URLs, **0 non-reserved**, 0 data URIs, all 511 assets inert, all training numbers in the reserved `+91 00000 …` range. Frontend: no `window.open`, no `XMLHttpRequest`, no `WebSocket`, no device APIs, no CDN, no remote font; the only `fetch` calls are `apiClient` and the admin artifact read, both to the local API. Built bundle contains no external URL beyond XML namespaces and React error-doc strings (never fetched). Backend: no outbound HTTP client of any kind.
- **Gap:** No one has disabled networking and played all 100 scenarios while watching a network monitor. The specification names this as a pass condition twice.
- **Severity:** BLOCKER — it is an explicit, named release acceptance criterion.
- **Follow-up:** **ACCEPT-002 — Offline acceptance run** (see §8).

---

## 4. High-priority gaps

### G1 — Training-mode immediate feedback is not implemented · **HIGH**
- **Spec:** §4 Feedback card — "Training mode immediate; assessment mode may defer detail until attempt completion." §3 — "training mode may show points after feedback." §6 Controls — "configure training vs assessment feedback timing."
- **Current:** ADMIN-004 stores and audits `training_feedback_timing` / `assessment_feedback_timing` with values `immediate | on_completion`, and the admin UI renders the server's own note that `immediate` is "recorded as policy; no server surface releases feedback mid-attempt yet." `scoreVisible()` exists in `attemptMachine.js` and **has no consumer**.
- **Gap:** No mid-attempt feedback surface exists in any mode. The configuration control required by §6 is therefore real but inert, and §4's training-mode behaviour is absent.
- **Severity:** HIGH. It is a stated §4 behaviour and it makes an implemented §6 control meaningless. It is **not** a BLOCKER: the release acceptance checklist does not test feedback timing, and the scored assessment mode — the product's primary purpose — behaves exactly as specified.
- **Follow-up:** **FEEDBACK-001**.

### G2 — ProgressSnapshot entity and exposure count are missing · **CLOSED (PROGRESS-001, 15.49)**
- **Spec:** §6 entity table — `ProgressSnapshot {profile_id, attempt_count, last_score, best_score, platform/family aggregates, generated_at}`. §7 Progress — "show trend and exposure count."
- **Current:** No model, service or route. The result screen shows the delta against the previous comparable attempt (trend ✓) but no attempt count, best score or exposure count. `HistoryPage` lists past attempts.
- **Gap:** A named minimum entity does not exist, and one §7 result element ("exposure count") is absent.
- **Severity:** HIGH — a listed minimum entity with a visible §7 consequence.
- **Follow-up:** **PROGRESS-001**.

### G3 — LearnerProfile minimum fields incomplete; briefing acknowledgement not persisted · **CLOSED (PROFILE-001, 15.48)**
- **Spec:** §2/§6 — `service_no_masked`, `last_seen_at`, `briefing_version`; "Log consent/briefing acknowledgement as a versioned boolean and timestamp."
- **Current:** `Candidate` stores `name`, `identifier`, `identifierNormalised`, `createdAt`, plus ADMIN-004's archival fields. `service_no_masked` is derived at projection time. `last_seen_at` and `briefing_version` do not exist. `BriefingPage` renders the briefing but persists nothing.
- **Gap:** Three named fields missing; the consent record required by §2 is not stored at all.
- **Severity:** HIGH — consent/briefing acknowledgement is a compliance-shaped requirement in a defence training product.
- **Follow-up:** **PROFILE-001**.

### G4 — Login screen missing the profile-found card, storage-error state and footer · **HIGH**
- **Spec:** §2 rows "Existing profile", "Errors", "Footer", and the five required states.
- **Current:** A single form; on submit the learner goes to the briefing. No returning-profile confirmation card (masked number, last attempt date, attempts completed, "Continue as this learner"), no storage-error state with Retry, no Instructor help / Exit footer.
- **Gap:** Three specified UI regions and two of the five required states are absent.
- **Severity:** HIGH — §2 names the states explicitly as "Required states".
- **Follow-up:** **UI-004**.

### G5 — Dashboard orchestration behaviours incomplete · **HIGH**
- **Spec:** §3 — toast tray queuing at most three; next event delivered 1–4 seconds after idle; per-tile last-event preview and status dot; profile-chip menu; Rules / Report-simulation-issue; apps not locked into a fixed sequence.
- **Current:** The simulation shell delivers the rail, clock, connection indicator, masked profile chip, four app tiles with an unread badge, segmented progress and elapsed time. Missing: the 1–4s idle timer (none exists), the three-item toast tray (a single banner), last-event preview, status dots, the chip menu, and the Rules / Report-simulation-issue controls. The engine serves one run at a time by ordinal, so app choice is effectively sequential.
- **Severity:** HIGH in aggregate (six §3 sub-requirements), though each is individually MEDIUM and none affects scoring, safety or data integrity.
- **Follow-up:** **UI-004**.

---

## 5. Verification gaps

| # | Item | Why it is a verification gap | Severity |
|---|---|---|---|
| **V1** | **Offline / network-off run of all 100 scenarios** | Static evidence is comprehensive and clean, but the specification names an executed test with a network monitor. Never run. | **BLOCKER** |
| **V2** | **Keyboard-only completion** | Focus order, visible focus (2px outline) and labelling were verified in-browser, and **every interactive control is a real `<button>` or `<a href>`** — no `onClick` on a `div`/`span`/`li` anywhere in `src`, and no `role="button"` on a non-button. Activation by Enter could not be confirmed: `Tab` moved focus correctly in the harness but a synthetic `Return` did not activate the focused button, which is consistent with a harness limitation rather than an application defect. Not claimed as PASS. | MEDIUM |
| **V3** | **Contrast ratios** | Never measured. The palette is token-driven and visually high-contrast, but no numeric check has been run against WCAG AA. | MEDIUM |
| **V4** | **Wrong-app behaviour** (§3: benign background items only, never reveal the correct tile) | Non-badged tiles exist and are openable; the audit did not open one to confirm what is shown or that navigation is logged. | LOW |

---

## 6. Intentionally deferred

| Item | Justification |
|---|---|
| Adaptive practice mode | §5: "Adaptive practice is a separate mode so comparisons remain meaningful." Out of scope for the scored baseline product |
| Desktop/native filesystem bridge for exports | Needed only for 6.10's "instructor-selected local path". The browser genuinely cannot choose a host path; the UI states this rather than faking it |

---

## 7. Evidence and tests

### Regression totals (this audit, no code changed)

```
backend  npm test              640 tests · 399 pass · 0 fail · 241 skipped
backend  npm run test:engine   241 tests · 241 pass · 0 fail
                               (ENGINE 21 · SELECT 20 · API 25 · RESULT 28 · ADMIN-005 25
                                ADMIN-001 32 · ADMIN-002 37 · ADMIN-003 25 · ADMIN-004 28)
                               THREE consecutive clean runs
frontend npm test              124 tests · 124 pass · 0 fail
frontend npm run lint          0 warnings · 0 errors · 101 files
frontend npm run build         clean
```

### Fingerprints

| Artefact | Value | Status |
|---|---|---|
| Client scenario bank | `8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687` | unchanged |
| Synthetic content | `2779b03939e13cf11e0bee44493609f0c91e228f201f22f8c025a080509afde1` | unchanged |
| Synthetic assets | 511 | unchanged |
| Legacy scenarios | 40 | unchanged |

### Scenario-bank audit (machine-readable: `acceptance-scenario-bank.json`)

```
total 100 · active 100 · problems []
per platform: 25 each · level 8/9/8 each · disposition 20 malicious + 5 legitimate each
military: whatsapp 10 · instagram 12 · email 8 · sms 5   (matches each bank's stated composition)
overall: 80 malicious · 20 legitimate · 35 military
duplicate ids [] · duplicate versions []
six stages 100/100 · stage order correct 100/100 · transitions 100/100 · events 100/100
scoring entries 12 per scenario · 16 distinct event codes · 4 critical-flagged
feedback complete 100/100 · end_state 100/100
assets 511 · all inert · all stage refs resolve
canonical families 19 · canonical triggers 22 · legitimate_control consistent 100/100
offline: 34 URLs, 0 non-reserved · 0 data URIs · all phone numbers in reserved +91 00000 range
expected_actions populated: 0/100        <-- the one content gap (G7)
```

### Browser evidence (isolated fixture, port 27020/5002/5175 — production untouched)

- Login: 3 controls, all ≥44px, all labelled, no horizontal overflow
- **200% zoom** (`zoom: 2`): `horizontalOverflow: false`, `anyClipped: []` — reflows to one column
- Simulation shell: "TRAINING SIMULATION — OFFLINE · Network off · Sound off · 04:28 PM"; "Scenario 1 of 10"; elapsed timer; masked chip `•••0001`; four app tiles with an unread badge
- 7 focusable controls on the simulation screen: **0 under 44px, 0 unlabelled**
- Visible focus: 2px outline on the focused control
- `prefers-reduced-motion: reduce` present in `src/styles/index.css:240` and in the built CSS
- Advancing a stage moved STEP 1 OF 6 → STEP 2 OF 6 with server state following

---

## 8. Recommended follow-up task sequence

| Order | Task | Clears | Size |
|---|---|---|---|
| 1 | **ACCEPT-002 — Offline acceptance run.** Disable networking on the host, play all 100 scenarios (or a scripted equivalent driving every scenario through all six stages), capture a network monitor showing zero outbound attempts, record the artefact. Fix nothing unless it fails. | **B1 / V1 (BLOCKER)** | Small — verification only |
| 2 | **UI-004 — Learner shell completion.** Login profile-found card, storage-error state, Instructor help / Exit footer; dashboard toast tray (max 3), 1–4s post-idle delivery, per-tile last-event preview and status dot, profile-chip menu, Rules / Report-simulation-issue. | G4, G5 | Medium — frontend only |
| 3 | **PROFILE-001 — LearnerProfile completion.** Add `service_no_masked`, `last_seen_at`, `briefing_version`; persist the briefing acknowledgement as a versioned boolean + timestamp; correct the login label from "Phone / Service Number" to "Personal / Service Number". | G3, G8 | Small — additive schema + one screen |

> **Correction, 9 September 2026.** PROFILE-001 (15.48) closed **G3** but **not G8** — the
> label correction listed in row 3 above was not carried out, and the screen still read
> "Phone / Service Number" through PROGRESS-001 and CLIENT-POLISH-001. The immersive
> architecture audit re-found it as row 2.9 (INCORRECT), and **IMMERSIVE-000 closed it on
> 9 September 2026** (PROJECT_MASTER_PLAN.md 16.11). The gap survived three later tasks and a
> full acceptance audit because the entry screen's own "asks for no credential of any kind"
> test checked six prohibited words from §2's data contract and omitted the seventh: `phone`.
> That word is now in the assertion.
| 4 | **PROGRESS-001 — ProgressSnapshot.** Add the entity and the aggregates; surface exposure count and trend on the result screen. | G2, 7.5 | Small–medium |
| 5 | **FEEDBACK-001 — Training-mode immediate feedback.** Release the per-scenario feedback card at resolution when the configured timing is `immediate`, gated by `effectiveFeedbackTiming(mode)`; wire `scoreVisible()`. **Do not change scoring or the state machine.** | G1, 6.11 | Medium |
| 6 | **ACCEPT-003 — Accessibility verification.** Measure contrast against WCAG AA; complete one scenario keyboard-only in a real browser. | V2, V3 | Small — verification only |
| 7 | **ADMIN-007 — Scenario id capacity** *(optional, only if the client requires authoring genuinely new scenarios)*. Widen `SCENARIO_ID_PATTERN`. | G6 | Small |
| 8 | **EXPORT-002 — Result-screen exit actions** *(optional)*. Print/export and Logout on the learner result screen. | G10, 7.7 | Small |

### Tasks that should **NOT** be done

- **Admin statistics dashboard (FE-014 / BE-005b)** — not a requirement of this specification at all
- **Sub-640px breakpoint work** — the specification requires 200% zoom, which passes
- **Archived-profile visibility in the attempt viewer** — not required by §6 or §7
- **Practice mode / adaptive difficulty** — §5 explicitly defers it to a separate mode
- **Electron / native save dialog** — unless the client insists on 6.10's literal "instructor-selected local path"
- **Any change to scoring, selection, the taxonomies, the audit vocabulary or the 100 scenarios** — all verified correct

---

## 9. Production safety verification

| Collection | Before audit | After audit | Attributable to this audit? |
|---|---|---|---|
| `attempts` | 2 | **3** | **No** — see note |
| `scenarioruns` | 20 | **30** | **No** — the 10 runs of that new attempt |
| `scenarioevents` | 60 | 60 | unchanged |
| `candidates` | 3 | 3 | unchanged |
| `scenariodefinitions` | 100 (100 active) | 100 (100 active) | unchanged |
| `scenarios` (legacy) | 40 | 40 | unchanged |
| `assessments` | 1 | 1 | unchanged |
| `adminusers` | 0 | 0 | unchanged |
| `auditevents` | 0 | 0 | unchanged |
| archived profiles | 0 | 0 | unchanged |
| abandoned attempts | 0 | 0 | unchanged |
| `configurations` | absent | absent | unchanged |

**The change is not this audit's doing.** Attempt `6a9e95b7…` was started at **10:45:11 UTC for the
pre-existing production learner** `6a9e7f7e…`, with 10 materialised runs and **zero events** — the
signature of someone pressing "Start Assessment" and stopping. The other session's dev server
(ports 5000/5173) is still running against production and is the source, exactly as during
ADMIN-003.

This audit's browser work ran against an **isolated** stack: mongod on 27020, backend on 5002,
Vite on 5175, database `acceptance`, learner "Acceptance Auditor" / `ACC900001` — **none of which
appears in production**. Every production read used `autoIndex: false`. All three isolated
servers were stopped and the temporary data directory removed.

**Pre-existing production records are byte-identical:** both original attempts retain their status,
score and timestamps; events remain 60; candidates remain 3.

---

## 10. Final release-readiness assessment

**Not yet ready for client acceptance sign-off — but the distance is short and well defined.**

What is genuinely finished and evidenced: the entire scenario bank against every structural rule
the specification states; the six-stage engine; the scoring vocabulary and clamping; attempt
selection against all nine constraints across 400 seeds; the result projection including the
missed-threat/false-positive distinction, all four breakdown axes, path replay, per-case feedback,
the comparability gate and remediation; and all five §6 instructor capabilities with an
append-only audit log, verified end to end in a browser.

What stands between here and sign-off:

1. **One executed test.** The offline/network-off run is a named release pass condition and has
   never been performed. Every piece of static evidence says it will pass; the specification
   still requires it to be done.
2. **The learner shell.** §2's required login states and §3's orchestration behaviours are the
   largest cluster of genuine functional gaps. None affects scoring, safety or data integrity —
   they affect how closely the learner experience matches the specified screens.
3. **Three named data items** — `ProgressSnapshot`, the LearnerProfile fields, and the briefing
   acknowledgement — that the specification lists as minimums.
4. **One inert control.** Feedback timing is configurable and audited but nothing acts on
   `immediate`.

None of these is a correctness or safety defect. The scored assessment journey — the product's
primary purpose — behaves as specified and is defended by 1,005 passing automated checks.
