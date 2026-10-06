# Demo User, fixed demo assessment and Demo Skip (ENHANCEMENT-003)

Source: MOM of 24 September 2026, item 3.

## Identity and configuration

| Setting | Value | Where |
|---|---|---|
| `DEMO_DISPLAY_NAME` | `demo user` | `backend/src/config/demo.js` (or `backend/.env`) |
| `DEMO_SERVICE_NUMBER` | `1223334444` | `backend/src/config/demo.js` (or `backend/.env`) |

- These two values are defined in **one file only**. Everything else calls `isDemoCandidate()` in
  `backend/src/services/demoSelectionService.js`.
- **Identification is server-side:** the profile resolved from the signed session cookie has a
  normalised service number equal to the configured one. No request field, query or header is read,
  and a body carrying `is_demo` changes nothing.
- The name is not part of the identity. As for every learner, the profile keeps the name it was
  first registered with; signing in again with a different name does not change it.
- **Persistence:** there is no seed script. The profile is created the first time someone signs in on
  the normal Login page with that number, using the existing `findOrCreateCandidate()`. The unique
  `identifierNormalised` index means there can only be one.
- **Disable:** set `DEMO_SERVICE_NUMBER=` (empty) in `backend/.env`.

## The fixed ten (presentation order)

The list lives in `backend/src/constants/demoAssessment.js` → `DEMO_SCENARIO_SEQUENCE`.

Order set by the client on 5 Oct 2026: W14, E08, W03, S06, I17, S15, I07, W12, E07, E01.

| # | ID | Platform | Level | Disposition | Family |
|---|---|---|---|---|---|
| 1 | W14 | WhatsApp | medium | malicious | Malware delivery (military) |
| 2 | E08 | Email | easy | malicious | Financial credential phishing |
| 3 | W03 | WhatsApp | easy | legitimate | Coordination request (military) |
| 4 | S06 | SMS | easy | malicious | Identity data harvesting (military) |
| 5 | I17 | Instagram | medium | malicious | Coercion and extortion |
| 6 | S15 | SMS | medium | malicious | QR code phishing (military) |
| 7 | I07 | Instagram | easy | legitimate | Routine broadcast |
| 8 | W12 | WhatsApp | medium | malicious | Coercion and extortion |
| 9 | E07 | Email | easy | legitimate | Coordination request (military) |
| 10 | E01 | Email | easy | malicious | Credential phishing |

The mix, in summary:

- 7 malicious and 3 legitimate (`DEMO_DISPOSITION_QUOTA`)
- platforms: WhatsApp 3, Email 3, Instagram 2, SMS 2
- difficulty: easy 6, medium 4
- 5 military items

The set comes from the existing bank; no definition was copied or edited. At attempt creation,
`selectDemoScenarios()` refuses if any ID is inactive, if an ID repeats, or if the bank's own
dispositions no longer match `DEMO_DISPOSITION_QUOTA` (7 + 3).

## How a demo attempt is built

- `POST /api/attempts` checks `isDemoCandidate(req.candidate)`. If true, `createDemoAttempt()` runs;
  otherwise the unchanged `createAttempt()` runs.
- Both go through the same `createAttempt()`. The only difference is the injected `selector`, which
  defaults to the SELECT-002 solver. The solver itself is untouched.
- A demo attempt is marked by `selection.selection_algorithm_version = 'demo-fixed-1.0.0'`. That field
  is frozen at creation and never sent to learners.
- `mode` stays `assessment`, so Admin Attempts, Attempt Detail and exports include demo attempts like
  any other. The Admin Dashboard's analytics leave them out (ENHANCEMENT-003-FINAL).
- The learner attempt projection gains `is_demo: true` on demo attempts only. The key is absent for
  everyone else.
- A new demo attempt always uses the same ten, in the same order.
- As for any learner, an unfinished attempt is resumed rather than replaced. To restart a demo that
  was abandoned midway, finish it with Skip or reset it from Admin.

## Demo Skip

**Endpoint:** `POST /api/attempts/:attemptId/runs/:runId/demo-skip`, body `{ "expected_stage": "<stage>" }`.

The request is checked in this order:

1. **Session.** No session gives `401`. A profile that is not the Demo User gets `404`, with the same
   body as an unknown route.
2. **Body.** The only field allowed is `expected_stage`. Any other field gives `422 FORBIDDEN_FIELD`.
   A missing or unknown stage gives `422 INVALID_ACTION`.
3. **Attempt.** The attempt must be the requester's own (else `404`) and demo-built (else `404`).
   The existing deadline guard applies (`409 ATTEMPT_EXPIRED`), and the attempt must be in progress.
4. **Run.** The run must belong to this attempt (else `404`).
5. **Inside the transaction:**
   - the run must still be unresolved (else `409 RUN_NOT_ACTIVE`)
   - it must be the current, lowest-ordinal run (else `409 RUN_NOT_CURRENT`)
   - it must be at `expected_stage` (else `409 STALE_STATE`)
6. **Replay.** The `intent_key` is `demo-skip:<attempt>:<run>` and carries a unique index. A repeat
   skip, or a concurrent duplicate, gets `409`.

**What it writes:**

- one ledger event: `RUN_DEMO_SKIPPED`, 0 points, the next sequence number, no intent
- the run: `status: resolved` and `outcome_code: resolve_demo_skipped`

The response is `{ skipped: true, attempt }`. It carries no score, no event code and no outcome.

The learner action endpoints and the SECURITY-001 action-code contract are unchanged.

### Scoring treatment

Skip reuses the approved IMMERSIVE-001 / C2 expiry rule rather than adding a new one:
`score_0_10 = clamp(score_running, 0, 10)`.

- A scenario skipped before any scored action scores **0**.
- The skip itself adds and removes nothing.
- It never writes `RESOLVE_CORRECT` or a contradictory/unsafe final action. `resolve_demo_skipped` is
  outside `CORRECT_RESOLUTION`, so a skip is neither right nor wrong.
- The attempt total is still the sum of the ten run scores, and `assertResultIntegrity` holds.

### How a skip appears in results

**Learner result:**

- the card is labelled **Skipped (Demo)** and scores 0/10
- the review status is `skipped` and carries no authored feedback, cues, correct action or correct
  path, so nothing reveals whether the item was genuine
- skipped scenarios are left out of the platform, family, trigger and stage breakdowns and out of
  remediation
- `summary.skipped` and `review_summary.skipped` appear only when greater than 0

**Admin:**

- the attempt viewer (Attempt Detail) shows the class `demo_skipped`, labelled **"Skipped (Demo)"**,
  and the final action "Skipped (Demo)"; exports carry the same `demo_skipped` class
- a normal time-limit closure is unchanged: `not_resolved` / "Not reached in time"
- the aggregate Admin Dashboard excludes the Demo User entirely (ENHANCEMENT-003-FINAL), so a demo skip
  never reaches its "Closed by time limit" bucket

## Frontend

- `components/simulation/DemoSkip.jsx`: a dashed "Demonstration" strip under the decision panel, with
  a ghost "Skip this scenario" button and one inline confirmation. Escape and Cancel back out, and
  focus is managed for keyboard use.
- It is rendered only when the server sends `is_demo`. It is never in the DOM for normal learners.
- Skipping loads the next scenario directly.

## Known limitations

- **Admin Dashboard analytics exclude the Demo User** (ENHANCEMENT-003-FINAL). Demo attempts
  remain in Admin Attempts, Attempt Detail, results and exports. See `docs/ADMIN_DASHBOARD.md`.
- **Anyone who knows the demo service number can use the demo profile.** This is the same trust model
  as every learner in this product, which has no password.
- **Admin was not checked in the browser** during verification, because that would mean entering an
  admin password. The Admin behaviour is covered by the API tests instead.
