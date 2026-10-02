# Final Production Audit and Hardening — 30 September 2026

Scope: the whole application (backend, frontend, database layer, scenario engine, scoring,
Demo, Admin, exports, configuration), audited for a hosted deployment on a 4-core / 12 GB /
300 GB NVMe Ubuntu server.

Method: the existing suites were run first as a baseline. Then a live **production-mode** API
(`NODE_ENV=production`, fresh random secrets) was attacked, load-tested, soak-tested and
failure-injected. It ran against a **throwaway replica set** (`rsAudit`, port 27019, database
`audit_live`, bank imported from the source files). The release database and the handover
`frontend/dist` were never written. The reusable load and integrity scripts are in `backend/scripts/audit/`. The one-off attack, Demo and failure scripts and all raw results were kept in the
session scratchpad (`audit/`, `baseline/`, `final/`).

---

## 1. Executive summary

| Question | Answer |
|---|---|
| Crashes | None. No request shape, load level or failure made the process exit. |
| Assessment integrity | **Proven on 46,700 runs / 213,519 ledger events / 2,677 finished attempts.** Every cached score equals its ledger replay. Every event's points equal the pinned definition. No double resolution, no duplicate attempt, profile or intent key, no impossible state. |
| Scoring manipulation | Not possible through the API. All 15 authoritative fields are rejected, and action codes are per-run HMACs. Replay, cross-run, cross-learner and post-resolution actions are all refused. |
| Security | 133/133 live attack checks PASS after fixes (10 failed before; 5 of those were missing headers). |
| Performance (local, NOT the production server) | 400 concurrent learners at realistic pace: learner actions p95 **34–48 ms**, 0 errors. Throughput ceiling ~200 req/s per process. |
| Stability | 31-minute soak, 109,732 requests, 0 errors, heap floor flat at 34–37 MB (no leak). |
| **Release verdict** | **NOT YET: two P1 items remain.** The shipped `frontend/dist` points at `http://localhost:5000/api` and must be rebuilt (the source fix is done). The client must decide whether passwordless learner sign-in is acceptable for how the server will be reachable. Neither needs more code in this repository. |

**Production server benchmark not yet executed.** The server was not accessible from this
session. Every performance number below is from the development PC (Intel i5-10400, 6C/12T,
32 GB, Windows 11), with the load generator running on the same machine.

---

## 2. Baseline before any change

| Suite | Result |
|---|---|
| Backend unit (`npm test`) | 1,146 tests: **683 pass, 0 fail**, 463 skipped (DB-backed; run by `test:engine`) |
| Backend DB (`npm run test:engine`, throwaway RS on 27018) | 23 suites, **463/463 pass** |
| Frontend (`vitest run`) | 46 files, **3,968/3,968 pass** |
| Lint (`oxlint`) | 0 warnings, 0 errors |
| Production build | OK. Single JS chunk of 1,662 kB (407 kB gzip) |
| Bundle check (`check:bundle`) | PASS, **but the build contained `http://localhost:5000/api`**, which the check did not look for |
| `npm audit` (backend + frontend, prod + dev) | 0 vulnerabilities |
| Git | branch `main`, one commit (`ab41199 backup`), ~185 uncommitted paths (pre-existing work) |

---

## 3. Findings

P0 = catastrophic · P1 = release blocker · P2 = fix before production · P3 = can defer.

| ID | Sev | Finding | Status |
|---|---|---|---|
| F-01 | **P1** | A production `vite build` bakes `VITE_API_BASE_URL=http://localhost:5000/api` from `frontend/.env`. Every learner's browser would call **its own** machine: sign-in, the assessment and admin exports all fail. The handover `frontend/dist` (24 Sep) contains it. | **Source fixed** (`frontend/.env.production`, bundle check). **`frontend/dist` must be rebuilt**, which waits for your go-ahead. |
| F-02 | **P1 (conditional)** | Learner sign-in is name + service number with **no secret** (approved design). On a network-reachable server, anyone who knows a service number can act as that learner: see results and take or finish their assessment. | **Open: client decision.** Acceptable on a restricted training network. Blocks release if internet-reachable. See `PRODUCTION_DEPLOYMENT_LINUX.md` §8. |
| F-03 | P2 | No HTTP security headers. `X-Powered-By: Express` sent. API responses cacheable. | **Fixed** (`middleware/securityHeaders.js`, `app.js`) |
| F-04 | P2 | **Unauthenticated** `POST /api/admin/login` with a non-string username (`{"$ne":null}`) → TypeError → 500 | **Fixed** (`adminService.authenticateAdmin`) |
| F-05 | P2 | No `trust proxy`. Behind Nginx every client is `127.0.0.1`, so the admin throttle becomes one lock per username that anyone can trip. That is an admin lock-out DoS. | **Fixed** (opt-in `TRUST_PROXY`, default off) + documented |
| F-06 | P2 | No rate limit on learner sign-in or the API: 200 new profiles in 260 ms from one client. | **Open: infrastructure.** Nginx `limit_req` sized for NAT'ed classrooms is documented. Not added in-app, because a per-IP app limit behind one NAT address could block a whole class. |
| F-07 | P2 | MongoDB access control is not part of the documented deployment. | **Open: infrastructure.** Auth + keyfile + `bindIp 127.0.0.1` documented |
| F-08 | P2 | Session cookies are `Secure` in production, so plain `http://` makes sign-in silently loop. | **Open: deployment.** HTTPS mandatory, documented |
| F-09 | P2 | `backend/.env` is a development file (`NODE_ENV=development`, published dev secret). If copied to the server, `dotenv` fills any variable the service does not set. | **Open: deployment.** "Do not ship `.env`", systemd `EnvironmentFile` documented |
| F-10 | P3 | A validly signed learner cookie with a non-ObjectId value → CastError → 500 (needs the secret) | **Fixed** (`middleware/session.js`) |
| F-11 | P3 | `/api/admin/scenarios/:id/versions/abc` (all 5 version routes) → 500 | **Fixed** (`scenarioManagerService.getScenarioVersion`) |
| F-12 | P3 | Unauthenticated `/api/health` reveals the database name | **Fixed** (production shows state only) |
| F-13 | P3 | Shutdown could hang on open sockets. Node's 5 s keep-alive is shorter than Nginx's, which risks intermittent 502s. | **Fixed** (`server.js`) |
| F-14 | P3 | Presentation order: `orderForPresentation()` only swaps forward, so a same-platform run at the **tail** survives. **1.38% of 5,000 seeds** (1.7% live) show three in a row, against its own documented rule. Composition and scoring are unaffected. | **Open.** Not changed: selection rules are on the do-not-change list |
| F-15 | P3 | A learner can `POST /api/attempts {"mode":"training"}` (the UI never does). Training attempts are left out of dashboard analytics and follow the training feedback setting. | **Open.** Recommend ignoring or rejecting a learner-supplied `mode`; needs approval |
| F-16 | P3 | The server does not enforce the UI's name / service-number character rules, so HTML- or formula-shaped values are storable via the API. They render safely everywhere tested (§6). | **Open.** Recommend matching server-side validation |
| F-17 | P3 | The admin export panel shows the server's absolute export path and "desktop integration not built yet" (offline-era wording) | **Open.** Wording/UX, admin-only |
| F-18 | P3 | Stateless signed sessions: a copied cookie stays valid after logout until expiry (learner 8 h, admin 1 h) | **Open.** Design limitation, documented |
| F-19 | P3 | Throughput ceiling ~200 req/s per process. 64% of API CPU is Mongoose/BSON hydration (profile). | **Open.** Not needed for target load; `lean()` / definition cache recommended later |
| F-20 | P3 | Admin dashboard is O(N) over all completed attempts: 0.3 s at 1.4k attempts, ~2 s projected at 10k. `$in` over run ids reaches MongoDB's 16 MB command limit at roughly 80k attempts. | **Open.** Future scale |
| F-21 | P3 | 400 learners pressing Start at the same instant: all succeed, the last waits ~4 s | **Open.** Acceptable |
| F-22 | P3 | A synchronous double-click on a scene control sends a second request. The server answers 409 `STALE_STATE`, the UI re-syncs, and the browser logs one network error line. | **Open.** Cosmetic, no data effect |
| F-23 | P3 | PDF export uses WinAnsi: non-Latin names (e.g. Devanagari) print as `?` | **Open** |
| F-24 | P3 | Single 1.66 MB JS chunk (407 kB gzip) | **Open.** Fine on LAN, optional code-split |
| F-25 | P3 | After a long outage, overdue attempts are finalised 50 per 30 s. Until then Admin can list an overdue attempt as in progress for a few minutes. A returning learner is finalised immediately. | **Open.** By design; acceptable |

---

## 4. Changes made (all minimal, all tested)

| File | Change |
|---|---|
| `frontend/.env.production` (new) | `VITE_API_BASE_URL=/api` for production builds (F-01) |
| `frontend/scripts/checkNeutralBundle.mjs` | Also fails on loopback API URLs, MongoDB URIs and server secret names in the bundle (F-01). Verified: **fails** on the old build and on the current `frontend/dist`, **passes** on a fixed build. |
| `backend/src/app.js`, `backend/src/middleware/securityHeaders.js` (new) | `x-powered-by` off; `nosniff`, `X-Frame-Options: DENY`, `CSP default-src 'none'; frame-ancestors 'none'`, `Referrer-Policy: no-referrer`, `Cache-Control: no-store`, COOP on every API response (F-03) |
| `backend/src/config/env.js`, `backend/.env.example` | `TRUST_PROXY`, default **off** (F-05) |
| `backend/src/services/adminService.js` | Non-string username → same generic 401 path (still throttled) (F-04) |
| `backend/src/middleware/session.js` | CastError on a signed cookie → 401 (other DB errors still propagate) (F-10) |
| `backend/src/services/scenarioManagerService.js` | Non-positive-integer version → 404 (F-11) |
| `backend/src/controllers/healthController.js` | Production reports connection state only (F-12) |
| `backend/src/server.js` | keep-alive 65 s / headers 66 s; bounded graceful shutdown + DB disconnect (F-13) |
| `backend/tests/httpHardening.test.js` (new, 5), `backend/tests/productionAuditApi.test.js` (new, 4, DB), `backend/tests/envConfig.test.js` (+3), `backend/scripts/testEngine.js` | Regression tests for every fix |
| `backend/scripts/audit/` (new: `lc.mjs`, `load.mjs`, `integrity.mjs`, README) | The load driver and read-only integrity verifier used here, for re-running on the server |
| `docs/PRODUCTION_DEPLOYMENT_LINUX.md` (new) | Nginx (TLS, HSTS, page CSP, rate limits), systemd, MongoDB auth/keyfile/bind, firewall, backups, go-live checklist |

Not changed: scenario content, taxonomy, scoring, selection, Demo sequence and scoring,
telemetry, UI behaviour, authentication design, the release DB, `frontend/dist`. No commit made.

---

## 5. Security results (live, production mode)

133 checks, script `audit/attack.mjs`. **Before fixes 123 PASS / 10 FAIL. After fixes 133 PASS / 0 FAIL.**

| Attack | Tested | Protection | Result | Sev | Fixed | Remaining risk |
|---|---|---|---|---|---|---|
| SQL injection | n/a | No SQL database | Not applicable | — | — | — |
| NoSQL / operator injection (`$ne $gt $regex $where $or`, arrays, numbers) | Yes (sign-in, admin login, path, query) | String-only coercion; `strictQuery`; Express 5 simple query parser; explicit filter allowlists | Rejected 4xx. **Admin login returned 500** | P2 | **Yes** (F-04) | None found |
| Prototype pollution (`__proto__`, `constructor.prototype`) | Yes | `JSON.parse` own-property semantics; allowlisted fields | No pollution, no privilege change | — | — | — |
| Parameter pollution | Yes | Allowlisted filters | 422, no 500 | — | — | — |
| Regex abuse | Yes (`.*(a+)+$` in learner search) | Input escaped, length-bounded | 422 | — | — | — |
| XSS | Yes (`<img src=x onerror=alert(1)>` as a stored name, rendered in Admin) | React escaping; no `dangerouslySetInnerHTML`/`innerHTML`/`eval` in `src`; API CSP; page CSP (doc) | Shown as literal text, nothing injected, no script ran | — | — | F-16 (validation parity) |
| CSRF | Yes | JSON-only parser (form/text bodies not parsed → 422), `SameSite=Lax`, CORS single origin | Form-encoded sign-in refused | — | — | Low |
| SSRF | n/a | The server makes no outbound request from user input | Not applicable | — | — | — |
| Command injection | n/a | No shell/exec in request paths | Not applicable | — | — | — |
| Path traversal (export download) | Yes (9 variants: `..%2F`, `%5C`, `%00`, `con.csv`, 300 chars …) | Strict filename grammar + `path.relative` containment | All 4xx | — | — | — |
| Brute force (admin) | Yes | Argon2id (64 MiB), 5 failures → 15 min lock | 401×5 then 429 | — | — | Needs `TRUST_PROXY` behind Nginx (F-05) |
| Credential stuffing (learner) | n/a | No learner password exists | See F-02 | P1 cond. | Client decision | Impersonation by service number |
| Session hijacking / cookie replay | Yes | httpOnly + Secure + SameSite=Lax signed cookies | A copied cookie works until expiry, even after logout | P3 | — | F-18 |
| Session fixation | Yes | New signed cookie issued at every sign-in; value is server-chosen | Not possible | — | — | — |
| Cookie tampering / forging | Yes (bad signature, unsigned, tampered, signed-nonexistent, signed-malformed) | HMAC signature + DB lookup | All 401. **Signed-malformed was 500** | P3 | **Yes** (F-10) | — |
| Learner/admin cookie confusion | Yes (both directions, both cookies at once) | Separate names, secrets and collections | All 401 / correct principal | — | — | — |
| IDOR | Yes (attempt, run, result, events, complete, demo-skip, UI `/result/:id`) | Ownership in every query; 404 not 403 | All 404; UI shows "not available" | — | — | — |
| Authorization bypass | Yes (6 admin GETs, export, reset unauthenticated; admin cookie on learner route) | `requireAdmin` / `requireCandidate` | All 401 | — | — | — |
| API tampering | Yes (15 authoritative fields, `scenario_ids`, `seed`, metadata keys, fabricated/intent-name codes, type confusion, 5,000-char key) | Forbidden-field list, metadata allowlist, per-run HMAC action codes, schema bounds | All 4xx | — | — | F-15 (`mode`) |
| Replay | Yes (same key, old code new key, other learner's code, after resolution, after completion) | `intent_key` unique index + stage guard + run binding | Same key replays same sequence; everything else 409/422 | — | — | — |
| Race conditions | Yes (25 Starts, 25 first sign-ins, 20 same-stage actions, 2 resolves × 10 runs, 10 completes, 5 demo skips) | Transactions + unique indexes + in-transaction re-check | Exactly one winner each time, 0 × 5xx | — | — | — |
| Request flooding / DDoS | Yes (400 zero-think clients; 200 sign-ins/260 ms) | Bounded body; no crash under overload | Degrades by queueing, no errors | P2 | Doc (Nginx) | F-06; volumetric DDoS is a network/provider matter |
| Malformed JSON / deep nesting (100k) / arrays | Yes | Parser error branch | 400/422, server alive | — | — | — |
| Oversized body (2 MB) | Yes | `express.json({limit:'1mb'})` (+ Nginx `client_max_body_size 1m`) | 413 | — | — | — |
| File upload abuse | n/a | No upload endpoint exists | Not applicable | — | — | — |
| CSV injection | Yes (`= + - @ \t \r` leads) | `'` prefix + quoting; service number masked | Neutralised | — | — | — |
| PDF / export leakage | Yes | Admin-only; learner export scoped by `profile_id`; filename server-generated | No cross-learner data | — | — | F-17 (server path shown) |
| Clickjacking | Yes | API: XFO DENY + `frame-ancestors 'none'`; page: Nginx headers (doc, verified on a stand-in) | Protected | P2 | **Yes** (API) / doc | Nginx must send them |
| Security headers | Yes | See F-03 | Absent before | P2 | **Yes** | HSTS at Nginx |
| CORS abuse | Yes | Single configured origin | Foreign origin gets no ACAO | — | — | — |
| MongoDB exposure | Yes (config) | API and DB bind 127.0.0.1 | Loopback only locally | P2 | Doc | Auth must be enabled on the server (F-07) |
| Secret leakage | Yes (bundle, responses, logs) | Secrets server-side only; bundle check extended | None found in the fixed build | — | — | Do not ship `.env` (F-09) |
| Information disclosure | Yes | Generic 500 body, no stack/paths in production responses | DB name on `/health` (fixed); export path to admins (F-17) | P3 | Partly | F-17 |

---

## 6. Injection, XSS and export details

- A stored learner name `<img src=x onerror=alert(1)>` (possible via the API, F-16) shows as literal
  text in the Admin attempt viewer, with no `<img>` created and no script run. It appears as plain
  text in the CSV (`learner_display_name` row). In the PDF it is inside an escaped literal string.
- Formula leads `= + - @ TAB CR` are prefixed with `'` (verified on `=cmd|' /C calc'!A0`, `@SUM(A1)` …).
- Service numbers are masked in every export (`••••••••LINK`).
- PDF strings escape `( ) \`. Control characters become `?`.

## 7. Authentication and authorization

Covered in §5: 14 authentication checks and 16 authorization checks, all PASS after F-10.
Also verified in the browser: learner and admin logout clear the session and return 401 on the
next call, all 5 protected learner routes redirect to `/login` when signed out, all admin routes
redirect to `/admin/login`, and the closed admin nav drawer is not keyboard-focusable.

## 8. API security

Every learner write goes through the forbidden-field check, the metadata allowlist and the
per-run HMAC action code. Stage, points, event code and next stage are decided in
`resolveIntent()` from the pinned definition. Nothing the client sends can reach them (15 fields
tested). Wrong stage → `409 STALE_STATE`, other run's code → 422, resolved run → 409,
completed attempt → 409, expired attempt → `409 ATTEMPT_EXPIRED`.

## 9. Database security and integrity

- Topology: a replica set is mandatory (the engine refuses standalone). Commits use `{w:1, j:true}`.
  Retries cover transient errors only (max 3; 5 for attempt creation).
- Unique indexes: `candidates.identifierNormalised`, `scenarioruns(attempt_id, ordinal)`,
  `scenarioevents.intent_key`, `scenarioevents(run_id, sequence)`, `progresssnapshots.profile_id`.
- Integrity sweep (`audit/integrity.mjs`, read-only) over **46,700 runs / 213,519 events / 4,670
  attempts** after all load, soak, Demo and failure tests:

| Check | Violations |
|---|---|
| cached `score_running` ≠ ledger replay | **0** |
| sequence gaps / `last_sequence` mismatch | **0 / 0** |
| event points ≠ pinned definition's declared points | **0** |
| `RESOLVE_CORRECT` vs `CONTRADICTORY_UNSAFE_FINAL` disagrees with disposition | **0** |
| more than one resolution event in a run | **0** |
| `score_0_10` ≠ clamp(running, 0, 10) | **0** |
| attempt total ≠ Σ run scores, or outside 0–100 | **0** |
| attempts without exactly 10 runs, ordinals 1–10 | **0** |
| learner with > 1 in-progress attempt | **0** |
| duplicate candidates / duplicate intent keys / orphan runs | **0 / 0 / 0** |
| 8 malicious + 2 legitimate, legit on 2 platforms; difficulty 3/4/3; platforms 3/3/2/2; military 2–4; ≤2 per family; ≥5 triggers | **0** |
| ≤2 consecutive same platform | **78 (1.7%)** (F-14) |

- Growth: about 28 KB raw / ~20 KB on disk per completed attempt, indexes included.

## 10. Assessment engine integrity

Browser (production build behind a same-origin proxy with the production CSP): sign-in →
briefing (Continue disabled until acknowledged) → dashboard → Start (double-click → 1 attempt) →
notify → open → inspect → **page refresh resumes at the same stage** → risky branch (double-click
→ 1 event) → Trusted Directory verify → resolve (scenario controls gone afterwards) → next
scenario → remaining 9 → "View results" → result page.
Crash recovery: API killed mid-scenario → clients get an immediate ECONNREFUSED / 502 (no
hang) → restart → the same session continues, the pending action commits once, and a same-key
retry replays the same sequence.

## 11. Scoring integrity

Verified independently of the engine (§9): each of 213,519 events against the pinned
definition's declared points, each resolution against the disposition rule, each run against
the clamp, each attempt against the sum. All **100 scenarios** were exercised through **risky
and safe branches** and through **both correct and wrong resolutions**. Scores fall in 0–88 with
a plausible distribution. Expired attempt: unresolved runs close at their running score clamped
0–10 (0 without scored actions), and the total is still the sum.

## 12. Demo integrity (live, 21/21 PASS)

Sequence W01, E01, S16, I04, E21, W24, E14, I11, S25, W16 (6 malicious / 4 legitimate) on the
first and a repeated attempt. `is_demo` only on demo attempts. Skip scores 0 and the result shows
"skipped". Five concurrent skips → exactly one accepted. Extra body field → 422, wrong stage →
409, replay → 409. A normal learner gets 404 from skip and cannot request demo via the body.
Dashboard analytics exclude the demo attempt; the attempt list, detail and PDF export include it.
A demo attempt resumes rather than restarting.

## 13. Admin integrity

All admin screens loaded with live data. 16 malformed or hostile query/path cases produced no
5xx after F-11. Filters are allowlisted (unknown `limit` → `422 FORBIDDEN_FILTER`). CSV and PDF
export, "Save a copy" download (same-origin), idempotent replays, logout and the protected-route
redirect all work. Dashboard 0.3 s at 1.4k completed attempts, list 9 ms, detail 22 ms.

## 14. UI/UX results

- Console: **no JavaScript exceptions, no React errors, no CSP violations** across all flows.
  The only console lines are Chrome's "Failed to load resource" for deliberately provoked
  401/404/409 responses (pre-login session probe, missing-id pages, double-click).
- Errors are shown, not hidden. A MongoDB outage shows "Storage unavailable" on the login page
  with no blank screen or endless spinner. Missing or foreign results show "Your result is not available".
- Timers and listeners: 11 `setInterval`/`addEventListener` in production code, all with cleanup.
- Phone clock vs toast time: consistent by design (the scenario's synthetic time on both; the
  header shows host local time separately).
- NOT TESTED: screen-reader pass, manual pixel review of every scene at every width (see §15).

## 15. Responsive results

`scrollWidth` vs viewport measured at **375, 390, 414, 768, 1024, 1280, 1366, 1440, 1920 px**:

| Pages | Combinations | Horizontal overflow | Script/CSP errors |
|---|---|---|---|
| Learner: login, briefing, dashboard, history, 404 page, legacy route, assessment, result (own, foreign, malformed) | 108 | **0** | **0** |
| Admin: dashboard, attempts, attempt detail, missing attempt, scenarios, scenario detail, settings, audit | 72 | **0** | **0** |

This measures page-level overflow, not every scene's inner layout at every width. The existing
3,968 component tests and the 28 Sep UI audit cover scene internals.

## 16. Performance results — local indicative only

Zero-think stress (each virtual learner fires its next request the moment the previous returns):

| Concurrent | req/s | p50 | p95 | p99 | 5xx / network errors | API CPU | API RSS max |
|---|---|---|---|---|---|---|---|
| 10 | 186 | 51 ms | 76 ms | 176 ms | 0 | 110% | 325 MB |
| 25 | 203 | 121 ms | 169 ms | 386 ms | 0 | 105% | 362 MB |
| 50 | 211 | 230 ms | 310 ms | 744 ms | 0 | 107% | 432 MB |
| 100 | 188 | 455 ms | 681 ms | 1.36 s | 0 | 107% | 435 MB |
| 200 | 188 | 1.07 s | 1.29 s | 2.45 s | 0 | 108% | 559 MB |
| 300 | 190 | 1.61 s | 1.89 s | 2.49 s | 0 | 109% | 589 MB |
| 400 | 197 | 2.16 s | 2.48 s | 3.44 s | 0 | 109% | 592 MB |

## 17. Load test results — realistic pacing

A real learner makes ~74 requests over a 20–90 minute attempt (≈0.04 req/s).

| Profile | req/s | learner action p95 | resolve p95 | errors |
|---|---|---|---|---|
| 400 learners, 10 s think (≈2.5× real) | 44 | **34 ms** | 37 ms | 0 |
| 400 learners, 4 s think (≈6× real) | 111 | **48 ms** | 58 ms | 0 |
| Burst Start 10 / 25 / 50 / 100 / 200 / 300 simultaneous | — | Start p95 94 ms / 227 ms / 424 ms / 864 ms / 1.68 s / 2.48 s | — | 0; exactly one attempt each |

Capacity (this machine; re-measure on the server):

| Range | Concurrent learners | Basis |
|---|---|---|
| Comfortable | up to **400+** at real pace | 44–111 req/s, action p95 < 50 ms |
| Warning | sustained > ~150 req/s | latency starts queueing |
| Saturation | **~200 req/s** (one Node process) | ≈ 2,000+ learners at real pace; no errors even past it |

The server's 4.0 GHz cores should give a similar or slightly higher single-process ceiling. That
is an expectation, not a measurement. The bottleneck is one Node thread. MongoDB peaked at ~800 MB RSS.

## 18. Memory / stability results

31-minute soak, 100 learners, 2 s think time: 109,732 requests, 1,500 attempts completed,
**0 errors**, p50 15 ms / p95 38 ms / p99 59 ms. Post-GC heap floor 34.1 → 36.5 MB over 30 min
(flat). RSS 386–403 MB, one step to ~480 MB at minute 10 during concurrent admin/export activity,
then flat for 20 min. Active handles back to baseline (107) at idle. Event-loop p99 ≤ 26 ms
(Windows timer floor ≈ 16 ms). No leak observed.

## 19. Failure-injection and recovery results

| Scenario | Expected | Actual | Result |
|---|---|---|---|
| API process killed mid-scenario | Fast failure, then resume without double scoring | ECONNREFUSED in 24 ms; proxy 502 in 20 ms; after restart the session is valid, the pending action commits once (seq 2), and a same-key retry replays seq 2 | PASS |
| MongoDB shut down | `/health` 503; calls fail cleanly; UI shows an error | `/health` 503 in 29 ms; learner calls → generic 500 after ~5 s (no hang, no leak); login page shows "Storage unavailable" | PASS |
| MongoDB restarted (API left running) | Automatic reconnect, no data loss | Healthy after ~2 s, learner state intact | PASS |
| MongoDB write stall (fsyncLock 12 s) | Reads continue; write waits and commits once | Read 14 ms during the stall; write returned 200 after 12.0 s, committed once | PASS (no app-level timeout; Nginx caps at 60 s) |
| Attempt past its deadline | Action refused; attempt finalised; result shows timed out | `409 ATTEMPT_EXPIRED`; `completed/expired`, 10 runs closed, total = Σ; result `timed_out: true` | PASS |
| Deadlines passing while the API is down (300 attempts overdue at restart) | Finalised without learner action, totals consistent | 50 finalised by startup recovery before the first request, the remaining 250 by the sweeper (50 per 30 s) within 2 min 31 s. All 300 `completed/expired`, 0 unresolved runs, 0 totals ≠ Σ runs. Any learner who returns is finalised immediately by the route guard. | PASS (see F-25) |
| Malformed / oversized / stale / duplicate requests | 4xx, no corruption | §5 | PASS |
| Browser refresh / close and reopen | Resume at the committed stage | Refresh resumed at the same stage | PASS |
| MongoDB slow (latency, not a lock) | — | NOT TESTED separately (the lock test covers the worst case) | — |

## 20. Production configuration

Startup guards verified: the server refuses to start without `ADMIN_SESSION_SECRET`, with it equal
to `SESSION_SECRET`, or with the development `SESSION_SECRET` under `NODE_ENV=production`
(existing tests). Defaults: API binds `127.0.0.1`, CORS single origin, 1 MB body limit.

Search results for `localhost`, `127.0.0.1`, `0.0.0.0`, `5173`, `5000`, `27017`, secrets:

| Where | Class |
|---|---|
| `frontend/.env`, `frontend/.env.example`, `frontend/.env.verify` → `http://localhost:5000/api`, `:5055` | B (dev/test only) — **was D for builds**, neutralised by `.env.production` |
| **Current `frontend/dist` bundle → `http://localhost:5000/api`** | **D** (F-01, rebuild required) |
| `backend/src/config/env.js` defaults (`127.0.0.1:27017`, `localhost:5173`, dev session secret) | A (dev defaults; production guarded or overridden by env) |
| `backend/.env` (dev secret, `NODE_ENV=development`) | D if shipped (F-09) |
| `backend/src/config/demo.js` → service number `1223334444` | A (approved Demo identity) |
| `.claude/launch.json`, `backend/scripts/testEngine.js`, tests, `docs/*` | B/C |
| React Router `new URL(…, "http://localhost")` in the bundle | A (library internal, no port or path) |

## 21. Remaining risks (after this audit)

1. **F-01 (P1)**: rebuild `frontend/dist` with `npm run build`, then `npm run check:bundle` (must pass).
2. **F-02 (P1, conditional)**: decide exposure. Restricted network: accept in writing. Internet: add
   network restriction (VPN/allowlist) or approve an authentication change.
3. **F-05 to F-09 (P2, deployment)**: follow `docs/PRODUCTION_DEPLOYMENT_LINUX.md`:
   `TRUST_PROXY=loopback`, Nginx limits, MongoDB auth, HTTPS, no `.env` shipped.
4. **Production benchmark**: re-run `backend/scripts/audit/load.mjs` against the real server (on a throwaway database copy, see its README) before go-live.
5. P3 items F-14 to F-24: none blocks release.

## 22. Exact test results

| Suite | Before | After | PASS | FAIL | SKIPPED | NOT TESTABLE |
|---|---|---|---|---|---|---|
| Backend unit (`npm test`) | 683 / 1,146 | 1,158 tests | **691** | **0** | 467 (DB-backed, run below) | — |
| Backend DB (`npm run test:engine`) | 463 / 23 suites | 24 suites | **467** | **0** | 0 | — |
| Frontend (`vitest run`, 46 files) | 3,968 | 3,968 | **3,968** | **0** | 0 | — |
| Lint (`oxlint`) | 0 findings | 0 findings | PASS | — | — | — |
| Production build | OK | OK | PASS | — | — | — |
| Bundle check (extended) | PASS (blind to localhost) | PASS on fixed build; **FAIL on current `frontend/dist`** (expected, F-01) | 1 | 1 (old artifact) | — | — |
| `npm audit` (4 scopes) | 0 vulns | — | PASS | — | — | — |
| Live security matrix | 123 / 133 | 133 / 133 | **133** | **0** | — | SSRF, SQL, command injection, file upload: not applicable (no such surface) |
| Demo audit | — | 21 checks | **21** | **0** | — | — |
| Integrity + independent scoring (46,700 runs) | — | 12 invariants | **11** | **0** | — | 1 P3 flag (F-14, presentation order) |
| Scenario coverage | — | 100 scenarios × {risky, safe, correct, wrong} | **100/100** each | 0 | — | — |
| Responsive (page-level) | — | 180 page×width | **180** | **0** | — | per-scene inner layout at every width: covered by component tests, not re-measured |
| Load: stress ladder 10–400 | — | 7 levels | 7 (0 errors) | 0 | — | — |
| Load: realistic 400 × 2 profiles, burst ×6 | — | 8 runs | 8 (0 errors) | 0 | — | — |
| Soak 31 min | — | 1 | **1** | 0 | — | — |
| Failure injection / recovery | — | 7 scenarios | **7** | **0** | — | "slow but not locked" MongoDB not separately tested |
| **Production server benchmark** | — | — | — | — | — | **NOT TESTED: server not accessible from this session** |
| Screen-reader / assistive-technology pass | — | — | — | — | — | **NOT TESTED** |

## 23. Final release recommendation

**Code: ready.** No P0. All P2 code defects are fixed and regression-tested. The assessment
engine, scoring and Demo held under concurrency, replay, tampering, overload, crash and database
failure with zero integrity violations across 213,519 events.

**Release: not yet.** Two P1 items remain, and both are actions rather than code work:

1. **Rebuild `frontend/dist`** (`npm run build` → `npm run check:bundle` must PASS). The current
   artifact cannot work on any networked server.
2. **Client decision on learner sign-in exposure (F-02).** Keep the server on a restricted
   training network (and record that acceptance), or restrict access at the network layer before
   it faces the internet.

Then deploy per `docs/PRODUCTION_DEPLOYMENT_LINUX.md`: HTTPS, `TRUST_PROXY=loopback`, Nginx limits
and headers, MongoDB auth on `127.0.0.1`, no `.env` shipped. Re-run the load script on the real
server, and run the go-live checklist (§7 of that guide). With those done, nothing found in this
audit stands in the way of use by real learners at the stated scale.
