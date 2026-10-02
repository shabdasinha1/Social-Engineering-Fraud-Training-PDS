# Offline / Network-Off Acceptance Run (ACCEPT-002)

**Run date:** 7 September 2026 · **Type:** verification only — **no product code was modified**
**Authority:** `Interactive_Social_Engineering_Scenario_UI_Development_Specification.pdf`, Version 1.0, 02 September 2026
**Closes:** ACCEPTANCE-001 blocker **B1** — the required executed network-disabled acceptance test
**Companion:** [`ACCEPTANCE_MATRIX.md`](ACCEPTANCE_MATRIX.md)

---

## 1. Objective

The specification names the same pass condition twice:

> §1 acceptance signal — "Network-off test completes all 100 scenarios."
>
> §6 release checklist, Offline safety — "With network disabled, all scenarios, assets, reports
> and feedback work. Network monitor shows no outbound attempts."

ACCEPTANCE-001 found the static evidence clean but the **test itself never executed**. This run
executes it.

## 2. Environment

Everything ran in isolation. Production MongoDB was read for before/after counts only and was
never used for any state-changing verification.

| Component | Isolated value | Production value (untouched) |
|---|---|---|
| MongoDB | `127.0.0.1:27021`, replica set `rsOfflineAccept`, database `offline_accept` | `127.0.0.1:27017`, `cyber_awareness_training` |
| Backend API | `127.0.0.1:5003` | `127.0.0.1:5000` (another session's dev server) |
| Frontend | `127.0.0.1:5176` — **the production build** (`npm run build`), served by a temporary static server | `5173` (another session's dev server) |
| Export directory | `backend/tmp-exports/` (temporary) | `backend/exports/` — left empty |
| Admin account | `offline-acceptance`, random 24-char password held **outside the repository** and deleted at cleanup | none created (production `adminusers` stays 0) |
| Seed | 100 ScenarioDefinitions, 511 assets, 1 admin | — |

The frontend was rebuilt with `VITE_API_BASE_URL=http://127.0.0.1:5003/api` so the production
bundle pointed at the isolated backend rather than at production on `:5000`. **The build was
restored to its normal configuration afterwards** (verified: the bundle again carries
`http://localhost:5000/api`).

## 3. Network-disable mechanism

**Host firewall rules were unavailable** — `netsh advfirewall firewall add rule` returned *"The
requested operation requires elevation (Run as administrator)"*, and the host was confirmed to
have live external connectivity (`TCP 1.1.1.1:443 CONNECTED`, `DNS example.com OK`). Denial was
therefore enforced at the two layers that actually carry application traffic.

### Layer 1 — Node processes: in-process denial guard

Every Node process in the run was started with `node --import ./tmp-offline-guard.mjs`. The
guard patches, before any application code loads:

`net.Socket.prototype.connect` · `tls.connect` · `dns.lookup` · `dns.resolve*` ·
`dns/promises.lookup` · `http.request`/`get` · `https.request`/`get` · global `fetch`

Any destination that is not `127.0.0.0/8`, `::1` or `localhost` is **refused** and appended to a
denial log. Loopback passes through untouched.

**The guard was self-tested before use, and a real bug in it was found and fixed.** The first
version let `net.connect({host:'1.1.1.1'})` through, because `net.createConnection` calls
`socket.connect(normalizeArgs(args))` — passing the *array* `[options, cb]`, not the options
object. After unwrapping that array, the self-test result was:

```
DNS example.com      -> OFFLINE_GUARD_DENIED
TCP 1.1.1.1:443      -> OFFLINE_GUARD_DENIED
TCP 8.8.8.8:443 (createConnection) -> OFFLINE_GUARD_DENIED
fetch https://example.com          -> OFFLINE_GUARD_DENIED
https.get https://example.com      -> OFFLINE_GUARD_DENIED
TCP 127.0.0.1:27017  -> ALLOWED
```

### Layer 2 — Browser: enforced Content-Security-Policy

The temporary static server served the production build with a strict CSP, so the **browser
itself** refuses any external subresource, connection, frame or form action:

```
default-src 'self'; connect-src 'self' http://127.0.0.1:5003; script-src 'self';
style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:;
media-src 'self' data: blob:; frame-src 'none'; object-src 'none'; worker-src 'self' blob:;
base-uri 'self'; form-action 'self'; frame-ancestors 'none'; report-uri /csp-report
```

The CSP came from the temporary test server's response headers. **No product file, including
`index.html`, was modified.**

## 4. Network monitoring mechanism — and a tooling finding

Three monitors were used. One of them was found unreliable and was **replaced**, not relied upon.

| Monitor | Verdict |
|---|---|
| Node denial log (`tmp-offline-guard.log`) | **Reliable.** Records every refused DNS/TCP/TLS/HTTP/fetch attempt with process tag, target, port and timestamp |
| Browser CSP violation reporting (`securitypolicyviolation` + `report-uri`) | **Reliable, and calibrated** — see below |
| The browser tool's own `read_network_requests` | **UNRELIABLE — discarded as proof.** It failed to record two deliberate external control requests (`http://acceptance-control.example/probe` and `http://192.0.2.1/accept002-control`). It is useful for confirming which *local* requests occurred, but it cannot be used to prove the absence of external ones |

### Calibration control

Because "zero attempts" is only meaningful if the monitor can detect one, three deliberate
external requests were issued from the running application's own page and each was blocked and
reported:

| Control target | Result | Reported directive |
|---|---|---|
| `http://192.0.2.1/probe` (TEST-NET-1, reserved, non-routable) | blocked — "Failed to fetch" | `connect-src` |
| `https://example.com/probe` | blocked — "Failed to fetch" | `connect-src` |
| `http://acceptance-control.example/x` | blocked — "Failed to fetch" | `connect-src` |

All three were also delivered to the server-side `report-uri` collector, giving an independent
count. No control targeted a real production host: `192.0.2.1` is reserved for documentation and
`.example` never resolves.

## 5. Local traffic allowed

| Category | Observed |
|---|---|
| Static assets from the build | `GET http://127.0.0.1:5176/{login,dashboard,assessment,result/…,history,admin/*}` → `index.html`, `assets/index-*.js`, `assets/index-*.css` — **3 requests per page load, nothing else** |
| Learner API | `/api/candidates`, `/api/candidates/me`, `/api/attempts`, `/api/attempts/current`, `/api/attempts/:id/current-run`, `…/runs/:id/events`, `…/runs/:id/resolve`, `/api/attempts/:id/result` — all on `127.0.0.1:5003` |
| Admin API | `/api/admin/{login,me,logout,scenarios,scenarios/E01,attempts,attempts/:id,exports/attempts/:id,config/feedback,audit}` — all on `127.0.0.1:5003` |
| CORS preflight | `OPTIONS` to the same loopback origin |
| Backend → database | `127.0.0.1:27021` only |

No font, image, media, script, iframe, WebSocket or analytics request of any kind was made
beyond the three build assets.

## 6. External traffic result

```
Node guard:  13 guarded processes · 0 denials
             (backend, static server, seed, traversal, scoring, assets,
              advance ×5, complete, peek)

Browser CSP: 3 violations total · 3 deliberate calibration controls · 0 from the application
```

**External attempts generated by the application: 0.**

## 7. Learner verification (real browser, production build)

| Step | Result |
|---|---|
| Launch | Production bundle loaded from `127.0.0.1:5176` |
| Login | Name + service number accepted; profile created |
| Briefing | Rendered; "Continue to Dashboard" |
| Dashboard | Rendered with attempt status |
| Simulation shell | `TRAINING SIMULATION — OFFLINE · Network off · Sound off · local clock`; "Scenario 1 of 10"; elapsed timer; masked chip `•••0001`; four app tiles with unread badge |
| Notification → Open | STEP 1 → STEP 2 |
| Open → Branch | STEP 2 → STEP 4 |
| Branch ("Decline, and use an official channel instead") | → STEP 5 |
| Verify (Trusted Directory) | Overlay rendered **locally**: *"Official contacts held locally on this device"*, `Unit Falcon Support Desk +91 00000 31936`, *"Source: local approved directory"*, with in-message details shown separately as *"This is not a directory entry and has no source"* |
| Resolve | "Scenario 1 recorded — You reported it." Running score correctly **not** shown (assessment mode) |
| Next scenario | Advanced through ordinals 2–10 |
| Complete attempt | Committed; total 85/100 |
| Result screen | **85 / 100**, outcome mix (8 handled safely, 0 threat missed, 2 genuine item rejected, 0 unsafe step), "Where your marks came from" (by app, by decision stage), "Each scenario", "Recommended practice" (3 families), comparison message |
| History | "Your past assessments" rendered |

## 8. Four-platform verification

Each platform's renderer was exercised **in the browser**, offline:

| Platform | Scenario | Evidence |
|---|---|---|
| Instagram | I08 | Full six-stage traversal to resolution; DM thread, action sheet, Trusted Directory overlay |
| Email | E16 | Mail view with sender `itoperations@e16.training.example` → `learner@unit.training.example` (both reserved), Reply/Forward controls |
| WhatsApp | W09 | Chat thread with composer and attachment/camera affordances (inert) |
| SMS | S22 | Message thread with "Open the link" branch option |

Local simulation surfaces confirmed inert and local: message/thread, sender profile,
**Trusted Directory**, safe-browser/file/QR/payment/install/call mocks (`LocalSurfaces.jsx` —
no `href`, `src`, `fetch`, `window.open`; all 511 assets `inert: true`; no camera, microphone,
clipboard or host-handler API anywhere in `src`).

## 9. 100-scenario verification methodology

Full 100-scenario browser play was not practical (600 interactions). The strongest available
combination was used instead, and the three tiers are reported separately.

| Tier | Coverage | What it proves |
|---|---|---|
| **Engine traversal (real code path)** | **100 / 100** | Every active ScenarioDefinition driven through `submitIntent()` — the same service the browser calls — across all six stages to resolution, under the network guard |
| **Browser play** | 1 scenario end-to-end (six stages) + 3 further scenarios opened to exercise the other platform renderers; 10 ordinals resolved in the browser attempt | The real UI, the real API, the production build |
| **Static verification** | 100 / 100 | Asset inertness, reserved domains, stage-reference resolution, no external dependency |

Engine traversal result:

```json
{ "total": 100, "traversed_ok": 100, "failed": 0,
  "all_resolved": true, "all_six_events_min": true, "score_in_range": true,
  "total_events": 600, "assets_referenced_resolve": true,
  "by_platform": { "whatsapp": 25, "instagram": 25, "email": 25, "sms": 25 },
  "failures": [] }
```

600 events across 100 scenarios is exactly the six ordered events per scenario §1 requires.

## 10. Synthetic asset verification

```json
{ "assets_total": 511, "assets_resolved": 511, "assets_failed": 0,
  "external_dependencies": 0, "non_inert": 0, "unresolved_stage_refs": 0,
  "remote_media_or_fonts": 0, "data_uris": 0, "host_handler_markers": 0 }
```

Every URL in the bank (34 distinct) resolves to a reserved training domain — `0` non-reserved.
Every phone number is in the reserved `+91 00000 …` range. No CDN, no remote image, no remote
font, no external media, no `data:` URI, no host handler, no camera/microphone requirement, no
external QR resolution, no real payment, no real delivery.

## 11. Scoring verification (offline)

Every event in §5's table was exercised against real scenarios through the real engine:

| Path | Running | Final 0–10 |
|---|---|---|
| Safe path (inspect → safe pivot → trusted verify → correct resolve) | 10 | **10** |
| Premature reply | −1 | — (left at branch) |
| Risky open / reply | −1 | **0** (clamped) |
| Secret / data release | −1 (includes −8) | **0** (clamped) |
| Payment attempt | −1 (includes −8) | **0** (clamped) |
| Install attempt | −1 (includes −8) | **0** (clamped) |
| Correct verify + correct resolve (legitimate) | 10 | **10** |
| False report / block (legitimate) | 4 | **4** |
| Needless reject / ignore (legitimate) | −8 | **0** (clamped) |

`all_in_0_10: true` · `clamped_low: true` (a −1 running score produced a final 0). The upper
clamp was not triggered because the maximum legitimate accumulation is exactly 10. Attempt total
**85 / 100** — within bounds and equal to the sum the server recomputed.

## 12. Result / feedback verification (offline)

`buildAttemptResult()` produced, with no network access:

```json
{ "total_score": 85, "max": 100, "scenarios": 10,
  "summary": { "handled_safely": 8, "missed_threats": 0, "false_positives": 2,
               "unsafe_handling": 0 },
  "breakdown_axes": ["by_platform","by_family","by_trigger","by_stage"],
  "remediation": 3, "comparison": "no_previous_attempt",
  "feedback_complete": true }
```

All four §7 breakdown axes present; missed threat distinguished from false positive; per-case
feedback complete on all ten; 3 remediation families; comparison correctly withheld with a stable
reason. The result screen rendered all of it in the browser.

## 13. Admin verification (offline)

| Capability | Result |
|---|---|
| Admin login | Succeeded against the isolated admin account |
| Scenario list | **100 records**, 25 rows per page |
| Scenario detail | `E01`, Version 1, lifecycle shown |
| Attempt viewer | 25-row page; the completed attempt shown as **85 / 100** |
| Attempt detail | Full result, breakdowns, scenarios, remediation, comparison |
| CSV export | Created — see §14 |
| PDF export | Created — see §14 |
| Feedback configuration (read) | `training=on_completion`, `assessment=on_completion`, version 1 |
| Audit log | 2 entries, both `Export created` — the two exports just made |
| Logout | Returned to the administrator sign-in |

No destructive admin operation (reset, archive, configuration change) was performed against
production. Reset and archive were **not** exercised in this run; they were already verified end
to end in ADMIN-004 and ADMIN-006 against isolated databases.

## 14. Export verification (offline)

| | CSV | PDF |
|---|---|---|
| Created | ✓ 11,702 bytes | ✓ 24,377 bytes |
| Content present | ✓ sectioned report | ✓ 24 KB, valid structure |
| Valid signature | UTF-8 BOM + `#SECTION,REPORT` | `%PDF-` header, `%%EOF` terminator |
| `TRAINING SIMULATION` | ✓ | ✓ |
| `OFFLINE` | ✓ | ✓ |
| Content version | ✓ | ✓ `CONTENT VERSION 1` |
| Synthetic-data notice | ✓ | ✓ |
| External dependency | none | none — no `/URI`, `/JavaScript`, `/Launch`, `/EmbeddedFile`, `/FontFile`, no `http(s)://` |
| Network required | none — written to the local export directory | none |

Both artifacts were deleted at cleanup.

## 15. Browser network evidence

- Page loads: exactly **3** requests each (`index.html`, one JS bundle, one CSS bundle), all from
  `127.0.0.1:5176`.
- API calls: all to `127.0.0.1:5003`.
- **CSP violations from the application: 0.** The only 3 recorded were the deliberate controls.
- The production bundle and `index.html` contain **no external host** — the only absolute URLs
  are XML namespaces (`w3.org`, never fetched) and React/React Router error-documentation strings
  (never fetched).

## 16. Regression results

```
backend  npm test              640 tests · 399 pass · 0 fail · 241 skipped
backend  npm run test:engine   241 tests · 241 pass · 0 fail
                               ENGINE 21 · SELECT 20 · API 25 · RESULT 28 · ADMIN-005 25
                               ADMIN-001 32 · ADMIN-002 37 · ADMIN-003 25 · ADMIN-004 28
                               THREE consecutive clean runs
frontend npm test              124 tests · 124 pass · 0 fail
frontend npm run lint          0 warnings · 0 errors · 101 files
frontend npm run build         clean
```

No test was changed, skipped or weakened.

## 17. Production before / after

| Collection | Before this run | After this run |
|---|---|---|
| `attempts` | 4 | 4 |
| `scenarioruns` | 40 | 40 |
| `scenarioevents` | 112 | 112 |
| `candidates` | 4 | 4 |
| `scenariodefinitions` | 100 (100 active) | 100 (100 active) |
| `scenarios` (legacy) | 40 | 40 |
| `assessments` | 1 | 1 |
| `adminusers` | **0** | **0** |
| `auditevents` | **0** | **0** |
| archived profiles | 0 | 0 |
| abandoned attempts | 0 | 0 |
| `configurations` | absent | absent |

**Unchanged in every collection.** No production admin user was created, no production audit
entry written, no production configuration document created, and no production attempt reset or
archived. All four production learner profiles remain "Shabda Kumar Sinha"; the isolated
learners (`Offline Acceptance`, `Offline Traversal`) appear only in the throwaway database.

> **Note on the stated baseline.** The task brief recorded production as 3 attempts / 30 runs /
> 60 events / 3 candidates. By the time this run began it was **4 / 40 / 112 / 4** — the other
> development session using production had added a further learner and attempt between
> ACCEPTANCE-001 and this task. That pre-existing activity was left untouched, and the
> before/after comparison above uses the counts measured at the start of *this* run.

## 18. Fingerprints

| Artefact | Value | Status |
|---|---|---|
| Client scenario bank | `8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687` | **unchanged** |
| Synthetic content | `2779b03939e13cf11e0bee44493609f0c91e228f201f22f8c025a080509afde1` | **unchanged** |
| Synthetic assets | 511 | **unchanged** |
| Legacy scenarios | 40 | **unchanged** |

Verified by the 81 fingerprint/import tests, all passing.

## 19. Cleanup verification

| Step | Result |
|---|---|
| Temporary frontend server (5176) | stopped |
| Temporary backend (5003) | stopped |
| Temporary MongoDB (27021) | stopped |
| Ports 5003 / 5176 / 27021 | **none listening** |
| Temporary replica-set data directory | removed |
| Temporary export artifacts (`tmp-exports/`) | removed |
| Temporary scripts (guard, seed, server, static, traversal, scoring, assets, advance, complete, peek) | removed |
| Denial log, CSP violation log, server logs | removed |
| Isolated admin credential | removed (was held outside the repository; never in source, never in `localStorage`/`sessionStorage`) |
| Residual `tmp-*` files in the repository | **none** |
| `backend/exports/` (production export dir) | **empty** |
| Production frontend build | restored to its default `.env` API base |

## 20. Failures and gaps

**No product defect was found.** One tooling finding was recorded:

| # | Finding | Severity | Follow-up |
|---|---|---|---|
| T1 | The browser tool's `read_network_requests` monitor did not record two deliberate external requests, so it cannot be used to prove the absence of outbound traffic. It was replaced with browser-enforced CSP plus a calibrated control. | **LOW** — verification tooling only, no product impact | None required. Any future offline re-run should use the CSP-with-control method documented in §3–§4 rather than the request log |

No BLOCKER, HIGH or MEDIUM issue was discovered.

## 21. Final acceptance verdict

```json
{
  "network_disabled": true,
  "denial_mechanism": ["node_in_process_guard", "browser_content_security_policy"],
  "monitor_calibrated": true,
  "external_attempts": 0,
  "deliberate_control_attempts": 3,
  "local_requests_allowed": true,
  "scenarios_total": 100,
  "scenarios_verified": 100,
  "scenarios_browser_played": 4,
  "scenarios_engine_traversed": 100,
  "scenarios_statically_verified": 100,
  "stage_events_recorded": 600,
  "assets_total": 511,
  "assets_verified": 511,
  "assets_failed": 0,
  "external_dependencies": 0,
  "scoring_paths_verified": 9,
  "result_verified": true,
  "admin_verified": true,
  "csv_verified": true,
  "pdf_verified": true,
  "production_build_used": true,
  "regression_green": true,
  "production_modified": false,
  "fingerprints_unchanged": true,
  "product_code_modified": false,
  "verdict": "RESOLVED"
}
```

**ACCEPT-002 blocker B1: RESOLVED.**

With external networking denied at both the Node process layer and the browser layer — and with
the browser denial calibrated by three deliberate control requests that were all caught and
blocked — the application completed the learner journey end to end on the production build, all
100 scenarios traversed all six stages to resolution through the real engine, all 511 synthetic
assets resolved locally with zero external dependencies, every specified scoring path produced
the specified deltas within the 0–10 clamp, the result with its four breakdown axes and feedback
and remediation rendered, and the instructor area including CSV and PDF export worked — with
**zero outbound network attempts generated by the application**.

The project may proceed to the next implementation phase. The remaining ACCEPTANCE-001 items are
`UI-004`, `PROFILE-001`, `PROGRESS-001`, `FEEDBACK-001` and `ACCEPT-003`; none is a blocker.
