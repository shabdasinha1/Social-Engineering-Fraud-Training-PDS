# Neutral learner action contract (SECURITY-001)

**Status:** implemented 17 September 2026 for the generic action sheet and all fifty authored
scenes (WhatsApp W01–W25, Instagram I01–I25); extended to **all twenty-five Email scenes** (E01–E05 by
IMMERSIVE-005 on 17 September 2026, E06–E10 by IMMERSIVE-006 on 18 September 2026, E11–E15 by
IMMERSIVE-007 on 18 September 2026, E16–E20 by IMMERSIVE-008 on 19 September 2026, E21–E25 by
IMMERSIVE-009 on 20 September 2026) and to **all twenty-five SMS scenes** (S01–S05 by IMMERSIVE-010 and
S06–S10 by IMMERSIVE-011 on 20 September 2026, S11–S15 by IMMERSIVE-012 and S16–S20 by IMMERSIVE-013 on 21 September 2026,
S21–S25 by IMMERSIVE-014 on 22 September 2026),
authored on this contract from the start via
`backend/data/learner-actions/v1/email.json` (**472 controls**) and
`backend/data/learner-actions/v1/sms.json` (**477 controls**). All one hundred scenarios are mapped; the
generic action sheet stays on this contract beside every scene's own controls.

**Owner files**

| Concern | File |
| --- | --- |
| Constants (code format, derived source, view keys, client metadata) | `backend/src/constants/learnerAction.js` |
| Translation layer | `backend/src/services/learnerActionService.js` |
| Server-side action maps | `backend/data/learner-actions/v1/{generic,whatsapp,instagram,email,sms}.json` |
| Codes issued with the run | `attemptService.runPayloadFor` (`actions`) |
| Codes accepted | `attemptController.submitLearnerAction` (events and resolve routes) |
| Client | `useAttemptController.submit`, `attemptApi`, `attemptMachine.actionCodes` |

---

## 1. The problem

The 50-scenario audit (`IMMERSIVE_50_SCENARIO_AUDIT.md` §6.4) found that the client knew what
every control meant:

- each scored control rendered `data-intent="safe_pivot"` (or `share_secret`, …) and
  `data-affordance="w01-branch-pivot"`;
- each `POST …/events` carried `"intent": "safe_pivot"`, and verify actions carried
  `metadata.verify_source` - a second copy of the intent (`in_message_contact` on exactly the
  controls that score `VERIFY_THROUGH_MESSAGE`);
- the scene files in the JS bundle declared `intent:` and `source:` on every control, and the
  control ids themselves described them (`…-branch-pivot`, `…-verify-inmessage`,
  `…-resolve-report`);
- `sceneModel.js` shipped a mirror of the engine's full intent table, and the generic action
  sheet shipped `intent` on every entry;
- the accepted response returned `event.event_code` (`SAFE_PIVOT`, `RISKY_OPEN_REPLY`, …) - a
  verdict on the choice just made, while the assessment deliberately hides the running score;
- engine refusals interpolated the intent name into the error message.

Anyone with developer tools - Elements, Network, Sources or React DevTools - could read which
control was the safe one.

## 2. The contract

```
visible control  ->  neutral control id  ->  per-run action code  ->  (server) canonical intent
"Report and close"    w01-c16                 ac_9b07e3…              resolve_report
```

1. **The client holds neutral control ids only.** A scene control is `<scenario>-cNN`
   (`w01-c08`), a generic action-sheet control `gen-cNN`. The number is the control's position
   in the scene; it describes nothing. `sceneModel.action()` **throws** if a control declares
   `intent` or `source`.
2. **The server holds the meaning.** `backend/data/learner-actions/v1/*.json` maps every id to
   `{ stage, intent }` (plus `name`, the pre-SECURITY-001 authoring name, kept for tests and
   review and never sent). The maps are validated when the server starts: an id that is not
   neutral, an unknown stage, or an intent the engine does not allow at that stage stops the
   server.
3. **Each run gets its own codes.** `/current-run` returns
   `actions: { <control id>: <code> }` for the 37 generic controls plus the scene's own.
4. **The client sends only a code.** `{ action_code, intent_key, expected_stage, … }`.
5. **The server translates, then runs the unchanged engine.** The canonical intent is derived
   server-side and handed to `submitIntent` exactly as before.

### 2.1 The code

```
ac_ + first 20 hex characters of
HMAC-SHA256( K, "v1|<run_id>|<scenario_id>|<definition_version>|<control_id>" )

K = HMAC-SHA256( LEARNER_ACTION_SECRET or SESSION_SECRET, "SECURITY-001/learner-action-code" )
```

### 2.2 Why per-run, deterministic codes (the determinism question)

| Option | Verdict |
| --- | --- |
| A. Fixed per control (send `w01-c08`) | Rejected. A fixed id is the same on every run, so anything learned about it carries to the next attempt, and "a code from another run" cannot be refused because there is no such thing. |
| B. Random per run, stored on the run | Rejected. Needs new run state and a migration, and the brief forbids wall-clock or `Math.random()` randomness. |
| **B'. Deterministic per run (HMAC)** | **Chosen.** Server-authoritative, no stored state, no schema change. A reload, a stale resync or a second tab receives the same codes; an idempotent retry resends the same code; a code from another run, attempt, learner, scenario or content version matches nothing. 80 bits, so codes cannot be guessed, and they carry no position, stage or ordering. |

`choice_1`-style ordinals were considered and not used: a small ordinal space can be enumerated
and would reproduce the authoring order on the wire.

## 3. Server translation

`attemptController.submitLearnerAction` (shared by `/events` and `/resolve`):

1. `rejectAuthoritativeFields` - now also refuses `intent` and `verify_source` in the body.
2. `translateActionCode({ run, actionCode })` - checks the format, then compares the code in
   constant time against the codes of every control this run's scenario may use. Malformed,
   unknown, other-run and other-scenario codes are **one** refusal: 422 `INVALID_ACTION`,
   "That action is not available here." - a refusal never says why.
3. `/resolve` only: the translated intent must be a resolve intent, otherwise 422.
4. `expected_stage`, if sent, must equal the control's own stage, otherwise 422.
5. Client metadata is limited to `dwell_ms`, `open_latency_ms`, `link_hover_ms`; `verify_source`
   is added from the intent (`VERIFY_SOURCE_BY_INTENT`), so the ledger records what it always did.
6. `submitIntent({ intent, expectedStage: <control's stage>, … })` - the **unchanged** engine.
   Because the control's stage is the expected stage, the engine's own stale-state check refuses a
   code for any other stage **inside its transaction and after its duplicate replay**. That keeps
   the existing guarantees intact: a retried request still replays, a stale tab still gets 409
   `STALE_STATE` with `current_stage`, and there is no second path to the ledger.
7. Engine messages that could name the intent (`INVALID_INTENT` naming it, `INVALID_TRANSITION`,
   `INVALID_SCENARIO_STATE`) are replaced with the neutral message; code and status are kept.
8. The response drops `event.event_code` and adds `view` - the neutral name of the inert panel to
   open once the action is committed (`sender`, `profile`, `link`, `file`, `qr`, `directory`).

Nothing in `scenarioEngineService`, `ScenarioDefinition`, scoring constants, selection, attempt
lifecycle, result or review changed.

## 4. Security properties (verified)

| Surface | What a learner can see now |
| --- | --- |
| DOM | Labels only. No `data-intent`, no `data-affordance`, no control id; `data-control="act"` / `"nav"` says only whether a control records something |
| React props | Neutral control ids, labels, layout fields. No `intent`, no `source` |
| Network (request) | `action_code`, `intent_key`, `expected_stage`, `synthetic_target_id`, timing metadata |
| Network (response) | Run state, `consequence` (the rendering instruction for what is about to be drawn), `view`, and after resolution `outcome_code` (the learner's own final act) and the score |
| `/current-run` | Neutral ids → opaque codes, and the scenario content |
| Storage | Nothing (codes live in reducer memory only) |
| Globals / logs | Nothing |
| Production bundle | No engine intent, event code, verification source or old data attribute (`npm run check:bundle`) |
| Refusals | One neutral message |

**Re-verified for SMS S11–S15 (IMMERSIVE-012, 21 September 2026)** the same way: live DOM scan for all
46 canonical tokens found none; the only data attributes were `data-testid`, `data-beat` and
`data-control`; a 395-node fiber walk found no `intent`, `source`, `verifySource`, `eventCode` or points
prop; every committed request carried only the opaque `action_code` and bookkeeping; responses carried
no `event_code`; `/current-run` mapped neutral ids to opaque codes only; and a search of every
collection of the isolated database for every typed value (card, code, PINs, health text) returned
zero. Live refusals: tampered/canonical-string/cross-run codes and stage mismatch → 422
`INVALID_ACTION`; `intent`, `points_delta` and `metadata.pin` → 422 `FORBIDDEN_FIELD`; wrong-stage and
post-move controls → 409 `STALE_STATE`; duplicate `intent_key` → same sequence, `duplicate: true`.

**Re-verified for SMS S21–S25 (IMMERSIVE-014, 22 September 2026)**: live DOM and `current-run` scans
found no canonical token; only `data-testid`, `data-control` and `data-beat` attributes; storage empty;
every request to `localhost:4173` or `localhost:5055`. A 329-node fiber walk found no intent, source,
points or event-code prop before a decision; the one canonical string present was
`resolution.outcome_code` on the post-terminal outcome card — the learner's own final act, which this
contract returns only once a run is resolved. Live refusals from the page: `intent`, `intent` plus a
code, `points_delta`, `score`, `event_code` and metadata (`intent`, an unknown key) → 422
`FORBIDDEN_FIELD`; a canonical string, a scene control id, malformed and missing codes, and a real code
sent to another run → 422 `INVALID_ACTION`; a branch code at notify → 409 `STALE_STATE` (with a
contradicting `expected_stage` → 422); a duplicate `intent_key` → replayed; the same open under a new key
→ 409. None of the typed synthetic values (a mail address, a password, two PINs) exists in any
collection; the ledger holds no action code or control id. Malformed bodies and replay after completion
are pinned by `backend/tests/smsS21S25Engine.test.js` over real HTTP.

**Re-verified for SMS S16–S20 (IMMERSIVE-013, 21 September 2026)**: live DOM and `current-run` scans
found no canonical token; a 416-node fiber walk found no intent, source, points or event-code prop; only
`data-testid`, `data-control` and `data-beat` attributes; storage empty; every request to localhost.
Live refusals: `intent`, `points_delta`, `score` and metadata injection → 422 `FORBIDDEN_FIELD`;
canonical strings, scene ids and a real S20 code reused on another run → 422 `INVALID_ACTION`; replay
on a finished run → 409 `RUN_NOT_ACTIVE`; stale → 409 `STALE_STATE`; duplicate → replayed. No typed
value, action code or control id in any collection of the isolated database. The same set is pinned by
`backend/tests/smsS16S20Engine.test.js` over real HTTP.

**Re-verified for SMS S06–S10 (IMMERSIVE-011, 20 September 2026)** in a browser against the production
build on an isolated API, across all five scenes hand-played twice each (a safe and an unsafe route):
the rendered DOM carried no canonical vocabulary, the only data attributes were `data-testid`,
`data-beat` and `data-control`, and a walk of the live React fiber tree (400 nodes) found no `intent`,
`source`, `verifySource` or `eventCode` prop — the control objects carry only `anchor, closes, echo,
hint, id, label, on, opens, page, slot, targetId, thenPage`. The three committed `−8` requests captured
at the wire (S06's identity chip, S08's release fee after typing a payment handle and a code, S09's
deposit after typing a UPI PIN) each sent exactly `{action_code, intent_key, expected_stage,
synthetic_target_id, client_ts, elapsed_ms}`, and a search of **every collection** of the isolated
database for all nine typed strings returned **zero** occurrences; the ledger holds no action code and
no scene control id. A live request that tried to smuggle a typed PIN through `metadata` was refused
422 `FORBIDDEN_FIELD`, one that carried `intent` likewise, and cross-run, tampered and
stage-mismatched codes were all refused 422 `INVALID_ACTION` with the single neutral message.
`localStorage` and `sessionStorage` stayed empty, no JS-readable cookie existed, no suspicious global
appeared, and `npm run check:bundle` passed on the production build.

**Re-verified for SMS S01–S05 (IMMERSIVE-010, 20 September 2026)** in a browser against the production
build on an isolated API, across three hand-played scenes: the rendered DOM carried no canonical
vocabulary, the only data attributes were `data-testid`, `data-beat` and `data-control`, a walk of the
live React fiber tree (315 nodes) found no `intent`, `source`, `verifySource` or `eventCode` prop, and
each scene's control objects carry only `anchor, closes, echo, hint, id, label, on, opens, page, slot,
targetId, thenPage`. A UPI PIN typed on S05's mandate sheet and committed as a `−8` sent exactly
`{action_code, intent_key, expected_stage, synthetic_target_id, client_ts, elapsed_ms}` — the PIN was
not on it, and a search of the whole isolated database returned **zero** occurrences. `localStorage`
and `sessionStorage` stayed empty, no JS-readable cookie existed, no suspicious global appeared, and
`npm run check:bundle` passed on the production build.

**Re-verified for Email E21–E25 (IMMERSIVE-009, 20 September 2026)** in a browser against the production
build on an isolated API, across four hand-played scenes: the rendered DOM carried no canonical
vocabulary, the only data attributes were `data-testid`, `data-beat` and `data-control`, a walk of the
live React fiber tree (405 nodes) found no `intent`, `source`, `verifySource` or `eventCode` prop — each
scene's control objects carry only `id, label, slot, anchor, opens, hint, compose, echo, targetId, page,
thenPage, closes, on, after, local`. A credential submit captured at the wire on E23's local page sent
exactly `{action_code, intent_key, expected_stage, synthetic_target_id, client_ts, elapsed_ms}` — neither
the typed work email nor the typed password was on it, and a search of the whole isolated database for
both (and for E22's typed fund PIN) returned **zero** occurrences. `localStorage` and `sessionStorage`
stayed empty, no JS-readable cookie existed, no suspicious global appeared, and `npm run check:bundle`
passed on the production build.

**Re-verified for Email E16–E20 (IMMERSIVE-008, 19 September 2026)** in a browser against an isolated
API, on a safe and an unsafe hand-play of each scene: the rendered DOM carries no canonical vocabulary
(`data-testid` values are `device-screen`, `mail-thread`, `mail-sender`, `scene-surface`, …; the only
other data attributes are `data-beat` and `data-control`); a walk of the live React fiber tree found no
`intent`, `source`, `verifySource` or `eventCode` prop, and each scene's 21–23 control objects carry only
`id, label, slot, anchor, opens, hint, compose, echo, targetId, page, thenPage, closes, on, after, local`;
every request body was `{action_code, intent_key, expected_stage, synthetic_target_id, client_ts,
elapsed_ms}`; no response carried `event_code`; `localStorage` and `sessionStorage` stayed empty; no
suspicious global appeared; and `npm run check:bundle` passed on the production build.

## 5. Migration impact

- **All 50 scenes:** 1,037 scored controls renamed to neutral ids and stripped of `intent` and
  `source` by a one-time scripted rewrite; the rebuilt scene model was compared control by
  control with a pre-migration snapshot (1,085 controls, only the id differs). No label, beat,
  surface, page, branch path, consequence or verification route changed.
- **Scoring:** all 1,037 controls, translated from their codes and resolved by the engine,
  reproduce the pre-migration `(stage, event code, points, consequence)` exactly
  (`backend/tests/fixtures/learnerActionBaseline.json`, captured before the rewrite).
- **Generic sheet:** 37 entries renamed `gen-c01…gen-c37`, same order and labels.
- **Client logic that used intent names:** the chat-list row finds its control by position (the
  first inline control of the list stage - guarded for all 50 scenes); the inspection and
  directory sheets open from the server's `view`; the rationale and the `/resolve` route are
  chosen by the stage; the notification's controls are `NOTIFY_OPEN_ID` / `NOTIFY_DISMISS_ID`.
- **Removed from the client:** `sceneModel.STAGE_INTENTS`, `OMITTED_INTENTS`, every `intent`
  and `source` field, `data-intent`, `data-affordance`, `pendingIntent` (now `pendingAction`).
- **Dev scripts** (`playScenario.js`, `seedReviewDemo.js`) still describe walks in intents and
  send the matching code from `/current-run` via `scripts/lib/learnerActions.js`.

## 6. Backward compatibility

- A client that still sends `intent` is refused (422 `FORBIDDEN_FIELD`), not silently served.
  The frontend and API ship together in this offline product, so there is no mixed-version
  client to support.
- Ledger documents are unchanged: `metadata.intent`, `resolution_code`, `transition`,
  `consequence` and `verify_source` are still written, by the server. Stored attempts, results,
  reviews, exports and the admin viewer read the same data.
- Rotating `LEARNER_ACTION_SECRET` (or `SESSION_SECRET` when it is unset) or bumping
  `ACTION_CODE_VERSION` invalidates issued codes; an open assessment recovers on its next
  `/current-run` read (reload or stale resync).
- `/current-run` gained a field (`actions`); the event and resolve responses lost
  `event.event_code` and gained `view`. The frontend never used `event_code`.

## 7. Email and SMS - how to add a scene without reintroducing the leak

1. Author `frontend/src/simulation/scenes/<platform>/<id>.js` with
   `action({ id: '<id>-cNN', label, slot, … })`. **No `intent`, no `source`** - `action()` throws.
   Number controls `c01, c02, …` in scene order; never put meaning in an id.
2. Add `backend/data/learner-actions/v1/<platform>.json`
   (`{ "scenes": { "E01": { "e01-c01": { "stage": "open", "intent": "read", "name": "…" } } } }`)
   and add the platform to the list in `loadActionMaps` and in the test helpers
   (`frontend/src/test/actionMap.js`, `backend/tests/learnerAction*.test.js`). Both the WhatsApp,
   Instagram, Email and SMS platforms are already listed; a new scene on one of them only adds rows.
3. The first inline control of the list stage must be the one that opens the item.
4. Never branch UI behaviour on what a control means. If the device must react to an accepted
   action, return a neutral key from the server (as `view` does) and react after acceptance.
5. Never put a verification source, a verdict word or an engine term in an id, label, `hint`,
   `echo`, test id, class name or data attribute.
6. The guards fail on a violation: `sceneModel.test.js` (SECURITY-001 block: neutral ids, map ↔
   scene bijection, no vocabulary in product source), `sceneAffordance.test.js` (map ↔ engine),
   `learnerAction.test.js` (codes, translation, baseline), and `npm run check:bundle`.

## 8. Known limitations

- `scenario.stages[].transitions[].on` in the `/current-run` payload still carries the
  specification's generic stage-transition vocabulary (`open_item`, `dismiss`, `read`,
  `safe_action`, `risky_action`, `trusted_check`, `in_message_check`, `abandon`, …). It is the
  same list for every scenario, maps no control and is unused by the frontend, but it is visible.
  Dropping it from the candidate projection is a small follow-up in `ScenarioDefinition`, which
  this task was asked not to change.
- `outcome_code` (`resolve_report`, …) is returned once a run is resolved, and the two
  outcome-label tables in the bundle are keyed by those five names. It names the learner's own
  final act after the run is closed and maps no control.
- `consequence.kind` is returned after a risky action is committed; it is the rendering
  instruction for the screen the learner is about to see.
- Control ids and labels are still visible - by design; a label is the control. Scene source
  files keep their design comments; the production build strips them, and the Vite dev server
  (a developer tool) does not. Assessments must be served from the production build.
- A client may still send any `synthetic_target_id` the scenario declares with a valid code
  (pre-existing; the engine validates it against the scenario).
- The key is derived from `SESSION_SECRET` unless `LEARNER_ACTION_SECRET` is set; anyone with the
  server secret can compute codes (they can already read the database).
