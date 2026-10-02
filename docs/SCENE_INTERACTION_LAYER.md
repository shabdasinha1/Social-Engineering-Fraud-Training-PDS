# Scene interaction layer (IMMERSIVE-003A, rebuilt by IMMERSIVE-003A-R2)

**Status:** implemented for **all twenty-five WhatsApp scenarios, W01–W25** (W01–W05 by
IMMERSIVE-003A/R2, W06–W10 by IMMERSIVE-003B, W11–W15 by IMMERSIVE-003C, W16–W20 by IMMERSIVE-003D,
W21–W25 by IMMERSIVE-003E), for **all twenty-five Instagram scenarios, I01–I25** (I01–I05 by
IMMERSIVE-004A, "Instagram W01–W05" in its brief; I06–I10 by IMMERSIVE-004B; I11–I15 by
IMMERSIVE-004C; I16–I20 by IMMERSIVE-004D; I21–I25 by IMMERSIVE-004E) and for **all twenty-five Email
scenarios, E01–E25** (E01–E05 by IMMERSIVE-005, E06–E10 by IMMERSIVE-006, E11–E15 by IMMERSIVE-007,
E16–E20 by IMMERSIVE-008, E21–E25 by IMMERSIVE-009) and for **all twenty-five SMS scenarios, S01–S25**
(S01–S05 by IMMERSIVE-010, S06–S10 by IMMERSIVE-011, S11–S15 by IMMERSIVE-012, S16–S20 by IMMERSIVE-013,
S21–S25 by IMMERSIVE-014).
**IMMERSIVE-014 — SMS S21–S25 COMPLETE. WhatsApp, Instagram, Email and SMS 25/25 each. 100/100.**
Every scenario in the bank now has an authored scene; the generic path remains the fallback for a
scenario without one. See §20–§24 for the SMS layer. See §13–§17 for the
Instagram layer and §19 for the Email layer. **SECURITY-001 (17 September 2026): controls carry neutral ids only; what they submit
lives on the server - see §18 and [`NEUTRAL_LEARNER_ACTION_CONTRACT.md`](NEUTRAL_LEARNER_ACTION_CONTRACT.md).**
**Owner document for:** `frontend/src/simulation/**`,
`frontend/src/components/simulation/whatsapp/**`,
`frontend/src/components/simulation/surfaces/**`,
`frontend/src/components/simulation/{SceneSurfaces,SceneControl,SceneActionList}.jsx`,
`frontend/src/components/simulation/instagram/**` (IMMERSIVE-004A).
**Companions:** [`WHATSAPP_W01_W05_REAL_WORLD_RESEARCH.md`](WHATSAPP_W01_W05_REAL_WORLD_RESEARCH.md),
[`WHATSAPP_W06_W10_REAL_WORLD_RESEARCH.md`](WHATSAPP_W06_W10_REAL_WORLD_RESEARCH.md),
[`WHATSAPP_W11_W15_REAL_WORLD_RESEARCH.md`](WHATSAPP_W11_W15_REAL_WORLD_RESEARCH.md) and
[`WHATSAPP_W16_W20_REAL_WORLD_RESEARCH.md`](WHATSAPP_W16_W20_REAL_WORLD_RESEARCH.md) and
[`WHATSAPP_W21_W25_REAL_WORLD_RESEARCH.md`](WHATSAPP_W21_W25_REAL_WORLD_RESEARCH.md) and
[`INSTAGRAM_W01_W05_REAL_WORLD_RESEARCH.md`](INSTAGRAM_W01_W05_REAL_WORLD_RESEARCH.md) and
[`INSTAGRAM_I06_I10_REAL_WORLD_RESEARCH.md`](INSTAGRAM_I06_I10_REAL_WORLD_RESEARCH.md) and
[`INSTAGRAM_I11_I15_REAL_WORLD_RESEARCH.md`](INSTAGRAM_I11_I15_REAL_WORLD_RESEARCH.md) and
[`INSTAGRAM_I16_I20_REAL_WORLD_RESEARCH.md`](INSTAGRAM_I16_I20_REAL_WORLD_RESEARCH.md) and
[`INSTAGRAM_I21_I25_REAL_WORLD_RESEARCH.md`](INSTAGRAM_I21_I25_REAL_WORLD_RESEARCH.md) — the ATT&CK
research and story reconstruction each batch of scenes is built from.

---

## 1. Why this exists

The simulator looked like a phone but did not behave like one. A learner read a message and
then answered a question about it in a panel beside the phone:

```
notification → open → inspect → "Choose what to do about it" → A / B / C / D
```

The client reviewed that and said, correctly, that it still feels like a questionnaire. What
they asked for is that the learner **operates the phone**: opens the conversation, taps the
header to see who is writing, follows a link into a page, fills it in or refuses to, walks
back, checks something in an app they already have, and finishes with the app's own Report or
Block control.

**R2** took the same five scenarios and closed the remaining gap between "the controls are on
the phone" and "this is a phone". The differences are listed in §3.

## 2. What did *not* change

Everything authoritative:

| Concern | Owner | Changed by this task |
| --- | --- | --- |
| The 100-scenario bank | `backend/data/scenarios/v1` | **No** |
| Synthetic content | `backend/data/synthetic/v1` | **No** |
| Six-stage state machine | `scenarioEngineService.resolveIntent` | **No** |
| Event codes and points | `ScenarioDefinition.evaluation` | **No** |
| Legal transitions per stage | `constants/scenarioEngine.js` | **No** |
| The 90-minute deadline | `attemptExpiryService`, `Attempt` | **No** |
| Selection, results, admin | as before | **No** |
| Email, SMS | as before | **No** |
| Learner → server identifier | intent names on the client | **SECURITY-001**: neutral ids + per-run codes (§18) |
| Instagram I01–I05 | authored on this same layer | by IMMERSIVE-004A (§13) |
| Instagram I06–I10 | authored on this same layer | by IMMERSIVE-004B (§14) |
| Instagram I11–I15 | authored on this same layer | by IMMERSIVE-004C (§15) |
| Instagram I16–I20 | authored on this same layer | by IMMERSIVE-004D (§16) |
| Instagram I21–I25 | authored on this same layer | by IMMERSIVE-004E (§17) |
| W06–W25 | authored on this same layer | by 003B (W06–W10), 003C (W11–W15), 003D (W16–W20) and 003E (W21–W25) |

The scene layer is **entirely in the frontend** and adds **zero backend files** except one
guard test. (IMMERSIVE-003E made one backend change, and it is a validation fix rather than a layer
change: the `ScenarioEvent` metadata enum now accepts the `in_message_contact` verification source
every client already sends — see §11.) It reads the scenario payload `/current-run` already sends and submits the same
intents the action sheet always submitted.

## 3. What R2 changed

| | IMMERSIVE-003A | R2 |
| --- | --- | --- |
| Chat list | one row, the delivered conversation | search bar, tab strip, the delivered row **among three ordinary ones**, ticks, mute icons, an archived row, a compose button |
| Thread | one bubble per beat | consecutive messages **grouped**, tails only at the end of a run, author strips once per run, quoted replies, a transient typing strip |
| Details sheet | one long list | **tabs** — About / Groups in common / Media — so an absence has to be looked for |
| Second contact | a link to another sheet | the same three tabs on both sides, plus a **message sample** so "writing style" is comparable |
| Group | participants list | participants are **navigable**; the coordinator has a full contact card of his own |
| Poll | options | options, then **other people's votes** and a total |
| Browser | one page, Back goes home | a **page graph** with real Back, a progress strip, an address bar with a scheme indicator, a site masthead |
| Pages | field names as placeholders | **fillable fields**, local validation, a Continue step, a review step, a commit control and an outcome page |
| Payment | a button on a card | a **payment sheet**: payee, receiving account, PIN entry, then Confirm |
| Verification app | another settings screen | a **separate application** with its own colour, hero card and tab bar |
| Composer | a row of buttons | choosing a reply **fills the message field**; Send submits it |
| Surfaces file | one 476-line module | one file per surface kind under `surfaces/` |

## 4. The model

A **scene** is a plain data structure built from the scenario payload. It has no React in it
and no engine knowledge, which is why a Node test can load it.

```js
{
  scenarioId, platform,
  conversation: { kind: 'direct' | 'group', title, subtitle, saved, business, ... },
  list:   { title, archived, rows: [ { id, title, preview, time, unread, inert } ] },
  beats:  [ { kind, id, text, time, since, until, afterConsequence, ... } ],
  surfaces: { '<id>': { kind: SURFACE.*, ... } },
  stages: { open: { surface, affordances }, inspect: {...}, ... },
  ambient: [ navigate(...) ],
  directoryExtras: [ ... ],
}
```

### 4.1 Beats

A beat is one thing in the thread: a system notice, a day divider, a bubble, a typing strip,
a link preview, a verification-code notice, a poll, a payment request, a countdown — and, from
IMMERSIVE-003B/C, a document card, a photo/QR attachment, a **voice note** (local play over the
authored clock, a drawn waveform and the app's transcript; no audio anywhere), a **business
message with reply buttons** attached to its bottom edge (the buttons are the scene's anchored
controls while the stage offers them, and spent text afterwards), and a **call entry**
(missed, ringing or ended).

IMMERSIVE-003D added four optional properties to the ordinary `message` beat, all drawn the
way the app draws them and none styled by risk: `forwarded` (`'once'` or `'many'` — the grey
"Forwarded" / "Forwarded many times" provenance line), `reactions` (other people's reaction
pill, authored counts like a poll's votes), `deleted` with `deletedBy` ("This message was deleted
by admin …", the text gone and only its place, author and time left), and **anchored controls on
a plain message** (W16's "React 👍 to acknowledge"). A conversation may also declare `pinned:
{ beatId, author, text }`, which draws the **pinned-message bar** under the header; tapping it
scrolls back to that beat and highlights it — local, recorded nowhere.

`since` is the earliest stage at which the beat has happened and `until` is the stage at which
it stops. The thread is therefore a **pure function of the stage the server committed**, which
is what makes it survive a reload without being stored anywhere:

```js
beatsAt(scene, stage, consequenceKind)
```

`until` is what makes a transient thing honest. W01's typing strip exists between `inspect`
and `branch` — somebody is composing while the learner is looking them up — and is gone once
the message it belonged to arrives. It is still derived, so a reload reproduces it exactly.

`afterConsequence` marks a beat that only exists while the engine's rendering instruction for
the last action is on screen — the echo of a reply that was sent, or what the other side said
next. That is the same lifetime the consequence surface has always had, and it is deliberately
**not** rebuilt after a reload: the ledger is intact either way, and inventing a message the
server has no record of would be worse than not showing it.

Consecutive-message grouping is `simulation/threadLayout.js` — pure, outside the renderer, and
stated once so it can be asserted directly.

### 4.2 Affordances

An affordance is a control. Two kinds:

```js
action({ id, label, slot, anchor, targetId, opens, on, page, thenPage, closes })
navigate({ id, label, slot, anchor, opens, after })                        // local only
```

- `id` is **neutral** - `<scenario>-cNN`, a position (SECURITY-001). What the control submits
  (its engine intent, and for a check its verification source) is **not** in the scene: it is in
  `backend/data/learner-actions/v1/<platform>.json`, keyed by that id, and only the server reads
  it. `action()` throws if a scene passes `intent` or `source`. `label` is the **app's** word.
  Nothing about a label says which choice is wise.
- `slot` says where it belongs — `MENU` (overflow), `COMPOSER` (a reply), `INLINE` (attached
  to a beat, or the banner under the thread), `SURFACE` (on a pushed screen).
- `anchor` binds an inline control to the beat it acts on: the poll's options are on the poll,
  the pay control is on the payment card, `'header'` puts the inspection on the chat header.
- `targetId` is the synthetic asset the event names (`synthetic_target_id`).
- The verification source (`verify_source` metadata) is derived by the server from the intent.
- `opens` names a surface to push **after the engine accepts** — never before.
- `on` scopes a `SURFACE` control to one pushed screen; **`page`** narrows it to one step of
  that screen, so a checkout's commit control is on the review step and not on the step being
  typed into.
- **`thenPage`** is the page the surface moves to once the engine has accepted — how a
  submitted form reaches its receipt without the device deciding a submission happened.
- **`closes`** pops the surface after acceptance, for a screen whose whole purpose was the
  decision just made (a payment sheet). **`closes: 'all'`** (IMMERSIVE-014) leaves every pushed
  screen instead, for a sheet reached through another screen (S23's collect sheet under the payment
  notification; S24's fee sheet and file picker under the case portal), so the learner returns to the
  conversation rather than to a screen that still offers the step just taken.

A `navigate` affordance submits nothing. That is the key to the whole design: see §6.

### 4.3 Surfaces

Local screens the learner can walk into, each with its own module under
`components/simulation/surfaces/`:

| Kind | What it is | Used by |
| --- | --- | --- |
| `CONTACT` | contact / business info: tabs for About, Groups in common, Media | W01–W07, W09–W12, W14–W25 (W18 the admin's card; W22 with a link into Photos search) |
| `GROUP` | group info: description, tabs, navigable participants, admin badges | W03, W08, W13, W18 |
| `SETTINGS` | an in-app screen (WhatsApp Account, Linked Devices) | W01, W10, W25 (Linked devices, with a link to the request sheet) |
| `APP` | **another application** on the phone, with its own chrome | W05, W08, W09, W11, W13, W14, W16 (Movement Board), W17 (bank, JobsBoard), W18 (Roster), W22 (Photos search, Investor Check), W24 (Device care) |
| `BROWSER` | the offline browser: address bar, page graph, forms, Back; `search` and `listing` blocks from 003C | W02, W05, W08, W11, W13, W17 (task site), W18 (roster form), W20 (procurement portal), W21 (SecureDesk), W22 (Qorvex), W23 (four-step grant form) |
| `PAYSHEET` | **a payment sheet**: payee, receiving account, PIN, Confirm | W02, W04, W09, W12, W13, W17, W22 |
| `CALL` | a simulated call: ringing, connected, timer, captions, End call. **Video mode** (003C): drawn remote party, overlay, countdown, local `links`, and `endCallScored` so End call can be the scene's decision | W01–W07, W09–W12, W14, W15, W18–W21, W23 (Ma, welfare office, "case officer"), W24 (the support call whose Share screen link opens the consent dialog; IT helpdesk), W25 (an ordinary phone call) |
| `VIEWER` | **whatever the device opens an attachment with** (IMMERSIVE-003B): a document viewer, a photo viewer, a QR inspector and the gallery you pick an attachment from — one screen, because all four are a tile, some rows of facts and sometimes a list | W06, W07, W08, W10, W12–W16, W20, W22 (her screenshot), W23 (poster), W24 (scan picture), W25 (desktop screenshot) |
| `SOCIAL` | **a screen inside a social app** (IMMERSIVE-004A): one page graph with views `profile` (stats, bio, bio link, mutuals, grid, About / pinned / comments / compare / story links), `about` (About this account: date joined, based in, verified, former usernames), `people`, `post` (media, caption, comments), `story`, `search`, `settings`, `status` (Account Status, privacy, Security Checkup, sessions, Login activity), `reel` (full-screen reel player, 004B) and `list` (plain rows, optionally with a cover thumbnail: Add location suggestions, search in a conversation, a Saved collection); from IMMERSIVE-004C a profile may also carry professional-account `actions` and story `highlights`; from IMMERSIVE-004E a `review` view (a tag request with a local audience choice) | I01–I25 (Instagram only) |
| `INSTALLER` | **the phone's own system screens** (IMMERSIVE-003C, widened by 003D): the unknown-apps block, the per-source switch, the install confirmation and the permission prompts after an install; from 003D also a **location-permission prompt** and a **share sheet** page style (`sheet`: drawn preview, facts, choices), with the surface's own `closeLabel` and `inertNote` — system chrome, page-scoped controls, `final` pages | W14, W19, W24 (download warning, install dialog, screen-share consent), W25 (WhatsApp's link request sheet) |

Attachments are **drawn, never loaded** (`whatsapp/AttachmentTile.jsx`). There is no image
file anywhere in the product: a QR is a deterministic grid of squares derived from its own
label, a crest is a drawn roundel, a service card is a drawn rectangle. A scenario that
needed a real picture to be legible could not survive the network being off, and would put a
fetchable URL inside a simulation whose whole premise is that nothing fetches. What a QR
"contains" is therefore stated in words by the inspector — a real reader is the one thing an
offline simulation cannot have.

Navigation is two stacks (`useSceneNavigation`): the **surface** stack, and a **page** history
inside the surface on top. Both are React state only. Neither is persisted, because where a
learner is standing is not a decision they have made.

## 5. How an action flows

```
learner taps a control on the phone
        │
        ▼
SimulationPage.act(affordance)
        │  looks up the code /current-run issued for affordance.id
        │  submits { action_code, intent_key, expected_stage, synthetic_target_id, metadata }
        ▼
useAttemptController → attemptApi → POST /attempts/:id/runs/:id/events   (resolve stage: /resolve)
        │
        ▼
attemptController → learnerActionService.translateActionCode(run, code) → { stage, intent }
        │  (SECURITY-001: the only place a code becomes an intent)
        ▼
scenarioEngineService.resolveIntent(definition, stage, intent)
        │  decides the EVENT CODE, the POINTS, the NEXT STAGE, the CONSEQUENCE
        ▼
response committed to the reducer
        │
        ├── the run's new stage re-derives the thread (new beats appear)
        ├── the affordance's opens / thenPage / closes moves the device, now that the
        │   ledger has the act
        └── otherwise the response's neutral `view` opens the inspection or directory sheet
```

Nothing is optimistic. A refused intent changes nothing on the phone, and the learner cannot
end up standing on a page the ledger has no record of them opening.

## 6. One scored event per stage, unlimited investigation

The engine accepts **exactly one intent per stage**. That is a hard constraint and it is the
right one — but taken naively it would mean a learner could look at a contact sheet *or* its
mutual groups, not both.

The resolution is the split between `action` and `navigate`:

- Opening the contact sheet is `inspect_sender` — one committed event, `INSPECT_CONTEXT +2`.
- Everything **inside** that sheet — switching tabs, the participants list, the saved contact
  underneath the new number, a second page of a tracking site, typing into a form, the call
  captions, opening a payment sheet — is local navigation and submits nothing.

So investigation is free-form and evidence emerges through it, while scoring stays exactly as
deterministic as it was. `SceneScenarios.test.jsx` asserts this directly: walking from the new
number to the saved Riya sends one intent, not two; and opening the payment sheet sends none.

### 6.1 A consequence of the same rule

Opening a link at the branch stage **is** that stage's decision. A learner who does it can no
longer submit what the page asks for, because the engine has already taken their one intent.
Leaving live fields on that page would be a dead end — something to fill in with nothing to
press — so `PhoneShell` passes `interactive={false}` and the page states what it asks for
instead, exactly as the previous build did everywhere. The fillable form is reached by the
learner who still has their branch decision to spend.

## 7. Where each stage's controls live

| Stage | The learner is looking at | The control is |
| --- | --- | --- |
| Notify | the home screen | the toast / the badged tile (unchanged) |
| Open | the WhatsApp **chat list** | tapping the unread conversation (`read`); the row's quick action is the premature one (`reply` / `open_link`) |
| Inspect | the conversation | the chat **header** (`inspect_sender`); a link card's inspect chip (`inspect_link`); the overflow menu (`read_thread`, `skip_inspection`) |
| Branch | the conversation, now advanced | a poll option, a payment sheet's Confirm, a site's commit control, a reply sent from the composer, or an overflow item |
| Verify | the conversation | the overflow menu — settings, the app you already have, the courier's own site, the trusted directory, the number on your card, Report, Block |
| Resolve | the conversation | the Report / Block banner under the thread, or the overflow menu |

The specification's stage-2 UI list names the chat list explicitly ("Chat list, unread pill,
thread header, bubbles…"), which is why `open` shows the list and `read` is the tap that opens
the conversation rather than a button that says "Read the message".

## 8. Forms, and what happens to what is typed

This is the one containment rule R2 changed, and it is narrow.

**What is interactive**

| Scenario | Surface | Fields |
| --- | --- | --- |
| W02 | redelivery site | card number, name on card, expiry, CVV; or a UPI ID on its own page |
| W02, W04 | payment sheet | UPI PIN (masked) |
| W05 | KYC site | account number, registered mobile, wallet PIN (masked), OTP, ID document |
| W08 | claim site | card number, name, expiry, CVV; bank OTP |
| W09, W12, W13 | payment sheet | UPI PIN (masked) |
| W17 | task site / recharge sheet | account holder, account number, IFSC ("for payouts"); UPI PIN (masked) |
| W18 | roster form | service number, appointment / role, current location |
| W20 | procurement portal | new beneficiary: holder, account number, IFSC |
| W22 | Qorvex identity form / deposit sheet | name, ID number, bank account; UPI PIN (masked) |
| W23 | grant application, four steps | relationship, home address; service number, unit, present post; deployment dates, next leave or move; account holder, account number, IFSC |
| I01 | claim site / delivery sheet | username; password (`MASKED`: letters, dotted by CSS); UPI PIN (masked) |
| I02 | appeal site | username; password (`MASKED`); 8-digit backup code |
| I04 | payment sheet | UPI PIN (masked) |
| — | W01, W03, W11, W14, W15, W16, W19, W21, W24, W25, I03 (the stranger's form is only ever shown), I05 | nothing, by design |

**Capacity fix (IMMERSIVE-003D).** `localForm.normalise` capped every field at its minimum
`length` and ignored `max`, contradicting `sceneModel.field()`'s own contract — so W02's "Name on
card" stopped at 3 characters and its UPI ID at 6 (`name@bank` could not be typed), W05's ID
number at 8 and W08's name on card at 3. A field now accepts up to `max` when it declares one
(otherwise `length`); secrets and expiry still stop at `length`. Validation is unchanged.
Asserted in `SceneScenariosD.test.jsx`.

**What holds it together** — `frontend/src/simulation/localForm.js` and
`components/simulation/surfaces/SceneForm.jsx`:

1. **Local.** `useLocalForm` holds values in `useState` inside the surface component.
2. **Ephemeral.** The browser surface is keyed on the page, so walking to another page is a
   fresh mount and React discards the values — not a cleanup we could forget to write.
3. **Never transmitted.** No value reaches an affordance, the controller, `attemptApi` or
   metadata. The engine's `METADATA_ALLOWLIST` would reject it server-side even if something
   tried, so it is enforced in two independent places.
4. **Never persisted.** No `localStorage`, `sessionStorage`, cookie or backend record.
5. **Never logged or exported.** Nothing reaches `console`, the ledger, the export or the
   admin viewer.
6. **No autofill surface.** Every input is `type="text"` with `autoComplete="off"` and a
   meaningless `name` (`f0`, `f1`…). Secret fields are masked by CSS, never by
   `type="password"`, so no credential manager takes an interest.
7. **No `<form>`.** No action, no method, no submit event. The commit control is an ordinary
   button carrying a scene affordance.
8. **Deterministic.** A field is satisfied when it holds `length` characters; `max` is how
   many it accepts. Same input, same result, every time.
9. **Never steering.** The page's own Continue is disabled by incomplete input and by nothing
   else. No control is ever disabled because of what it would cost.

`SceneForms.test.jsx` checks all of this, including by serialising everything the device would
have handed the controller and searching it for the exact strings that were typed.

## 9. Offline and containment

Unchanged apart from §8, and re-asserted per scene by `SceneContainment.test.jsx` across every
stage and every pushed surface:

- No `a[href]`, `<form>`, `iframe`, `embed`, `object`, `img`, `video`, `audio`, `source` or
  any `src` attribute anywhere in a scene or the components that draw one.
- No `fetch`, `window.open`, `XMLHttpRequest`, `WebSocket`, `EventSource` or media device.
- Browser pages: the address bar is a read-only display; nothing can be navigated to that the
  scene did not author; the progress strip is a CSS animation over a fixed interval.
- Calls: captions and a CSS timer. No microphone, camera, dialer or permission prompt.
- Every host is `*.training.example`; every number is in the reserved `+91 00000 xxxxx` range.
  `sceneModel.test.js` asserts both across all five scenes.

## 10. Content provenance

A scene never restates a fact the bank already owns. `scenes/whatsapp/shared.js` is the only
way a pack reads the payload, and it pulls the sender name and number, the headline message and
its timestamp, the link's display target and the directory entry straight from
`scenario.synthetic`. What a pack adds is structure the bank has no field for: earlier messages
in the thread, who else is in a group, what the second page of a site says, what a callback
sounds like.

Two places where the generated placeholder content and the client's own stage text disagreed,
carried forward unchanged from IMMERSIVE-003A:

| Scenario | Conflict | Resolution |
| --- | --- | --- |
| W03 | Stage 5 requires comparing the coordinator against the trusted directory, but the generated directory asset is the unit support desk with a different number, so the comparison could never resolve. | The scene supplies an **additional** approved-directory row for the coordinator, derived from the scenario's own sender identifier, shown beside the bank's asset with the same provenance line. The bank asset is untouched. |
| W04 | Stage 4 requires "a UPI request card bearing an unrelated synthetic payee name"; the generated `payment_screen` placeholder carries the sender's own name and `INR 0.00`. | The card shows an unrelated payee and the scenario's amount, per the client's stage text. The event still names the bank's asset id, so the ledger records what was acted on. |

Neither is a scenario-definition change. Both are recorded here and in the report so a later
content pass can move them into `synthetic/v2` if that is preferred.

## 11. Adding the next batch

1. Write `frontend/src/simulation/scenes/<platform>/<id>.js`, reading the payload through
   `shared.js`. Scored controls get neutral ids `<id>-c01…` and **no** `intent`/`source`
   (SECURITY-001); put the open-the-item control first at the list stage.
1a. Add each control's `{ stage, intent, name }` to
   `backend/data/learner-actions/v1/<platform>.json` (§18).
2. Register it in `sceneRegistry.js`.
3. `sceneModel.test.js`, `SceneContainment.test.jsx` and `backend/tests/sceneAffordance.test.js`
   pick it up automatically — the last one fails immediately if any control is not legal on
   that scenario, or if the safe path no longer sums to ten.
4. Add the scenario's own integration test to the batch's `SceneScenarios*.test.jsx`
   (W01–W05 in `SceneScenarios.test.jsx`, W06–W10 in `SceneScenariosB.test.jsx`, W11–W15 in
   `SceneScenariosC.test.jsx`).
5. Write the batch's research record and add it to `BATCHES` in `sceneResearch.test.js`,
   which then requires a section per scenario and a linked source for every technique named.

**Two things bite when adding a batch, both found doing it:**

- `frontend/src/test/attemptFixtures.js` holds `NEXT_STAGE` and `CONSEQUENCES` maps that
  mirror the engine's `STAGE_INTENTS` (SECURITY-001: its fake server issues and translates codes
  with the server's own map through `src/test/actionMap.js`; tests read the derived intent from
  `call.intent`, never from the request body). A **missing** entry does not fail — it silently
  leaves the stage where it was, so a gap looks exactly like a scene bug. Both maps are
  complete as of IMMERSIVE-003B; keep them that way.
- The chat header is a control named by its screen-reader suffix (`- open contact info`),
  and the composer's Send button is named after the draft (`Send "…"`), so a test looking
  for a button called "Contact info" or "Send" will hang rather than fail cleanly.
- **(003C)** `SCENARIO_GENERIC` in `attemptFixtures.js` is the page suites' generic-path
  fixture and must be keyed to a scenario with **no** scene. It was `W12`; authoring W12 turned
  fifteen generic-path tests into scene tests that timed out. It is now `W99`, which is in no
  bank — do not re-key it to a real id.
- **(003C)** Do not print `synthetic.prior_context` by reflex. It is the client's "Context
  presented" sentence and in places it states the verdict ("a cloned profile", "fabricated
  profits"). W11–W15 present the context through the conversation instead, and
  `sceneModel.test.js` asserts the sentence never appears in those scenes. **(AUDIT-001)** W09
  and W10 no longer print theirs; W01–W08 still print a neutral one (no verdict word).
- **(AUDIT-001)** The resolve banner under the thread must hold one right and one wrong
  resolution, and no control label or directory remit may name the verdict. Both are now
  asserted across all fifty scenes (`sceneModel.test.js`, "across all fifty authored scenes"),
  not per batch. See [`IMMERSIVE_50_SCENARIO_AUDIT.md`](IMMERSIVE_50_SCENARIO_AUDIT.md).

- **(003D)** A local control in the `COMPOSER` slot is not a reply: it is listed behind the
  paperclip, which becomes an **Attach** button only when the stage offers one (W19's Location).
  A chat-list row may declare `opens` to let the learner look into another chat's details
  locally (W19's real CO). Neither submits anything.
- **(003D)** The generic containment suite finds a surface through a menu or thread control; a
  surface behind the attach sheet must be walked explicitly in the batch's own page suite
  (W19's location screens are, in `SceneScenariosD.test.jsx`).
- **(003E)** **A verification source must be one the ledger accepts.** Every scene's
  `verify_in_message_contact` control carries `source: 'in_message_contact'`, which the controller
  sends as `verify_source` metadata. The `ScenarioEvent` schema only listed `in_message`, so that
  route returned 422 in a real browser for every scenario while every stubbed suite passed. The
  schema now accepts both, and `sceneAffordance.test.js` compares every source the scenes and the
  action sheet send with the real enum. If you add a source, that test tells you.
- **(003E)** Drawn attachment arts `scan` (a phone scan screen) and `desktop` (a browser window with a
  code box) join `map`; no image file exists anywhere.
- **(003E)** After the IMMERSIVE-003E browser run, the typing strip is authored after the consequence
  beats so it is drawn below whatever the last action produced; a post-call entry is the neutral
  `ended` state, because thread beats are branch-neutral.
- **(003D)** Keep the resolve banner to two options at most: three long labels become narrow
  multi-line pills at 375 px. Put one right and one wrong option in it, so the banner's position
  is never the answer.

Removing a batch is deleting its registry entries. The scenarios fall back to the platform
renderer and the action sheet, with no data, scoring or stage change either way.

## 12. Tests

| Suite | What it holds |
| --- | --- |
| `frontend/src/simulation/sceneModel.test.js` | 76: registry scope, intent legality, asset references, anchors, page links, no classification leak, offline hosts, deterministic beats, and the five scenarios being genuinely different — including that the legitimate one is not thinner than the others |
| `frontend/src/components/simulation/WhatsAppScene.test.jsx` | 27: chat list with background traffic, thread history and grouping, the two-step composer, contact and group tabs, the participant card, the browser round trip and page history, the wallet application, the call, the poll's results, the resolve banner, keyboard operation |
| `frontend/src/components/simulation/SceneForms.test.jsx` | 15: the checkout and the KYC form, validation gating, the review step, the receipt, the payment sheet's PIN, and four separate assertions that nothing typed reaches an affordance, storage, a cookie or the wire |
| `frontend/src/components/simulation/SceneContainment.test.jsx` | 21: containment on every stage AND every pushed surface of every scene, accessible names, nothing disabled to steer, no global network primitive touched |
| `frontend/src/pages/SceneScenarios.test.jsx` | 17: W01–W05 through the real controller and the real API, the full notify-to-resolve walk, rationale, remount recovery, and what the device never sends |
| `frontend/src/pages/SceneScenariosB.test.jsx` | 35: W06–W10 the same way |
| `frontend/src/pages/SceneScenariosC.test.jsx` | 37: W11–W15 — the business message's own buttons, the video call whose End call is the decision, the admin-only room, the installer walk, the voice note played and transcribed locally, the PIN never sent, remount rebuilding with no surface |
| `frontend/src/pages/SceneScenariosD.test.jsx` | 44: W16–W20 — the pinned plan and the reaction, the task site the learner builds a balance on, the bank details and PIN never sent, the group's record of what changed, the attach → permission → share-sheet walk and its containment, the procurement portal's hold / release, the field-capacity fix, remount rebuilding with no surface, and no verdict word on the page |
| `frontend/src/pages/SceneScenariosE.test.jsx` | 45: W21–W25 — the chat with nothing to press and SecureDesk, the four-week thread and the checks outside it, the four-step grant form filled locally and closed part-way, the support call → Share screen → consent dialog walk and its containment, the linking-code notice and request sheet, the code and every typed value never on the wire, remount rebuilding with no surface |
| `backend/tests/sceneAffordance.test.js` | 43 (from 29): adds W21–W25 legality, safe paths, 65 pinned event/point pairs, canonical identity, 13 walks through the engine into the review, and the verification-source guard; previously the stage-intent mirror, every control resolving legally against the real definitions, the safe path summing to ten on all twenty, per-scenario scoring semantics, consequence inertness, and W11–W20 walks resolved by the engine and fed to the real training review (W16's false positive classified as such) |

## 13. Instagram (IMMERSIVE-004A)

Instagram I01–I05 run on the **same** layer: the same `sceneModel` vocabulary, the same registry,
the same `useSceneNavigation` stacks, the same `SceneSurface` router, the same controller and
engine. What is new is the app that draws a scene and one surface kind; no engine, scoring, timer,
selection, result or review file changed.

| Piece | File | What it is |
| --- | --- | --- |
| Scene packs | `simulation/scenes/instagram/{shared,i01..i05}.js` | Read the payload; `splitHeadline` takes the account from the client's `@handle: message` sentence (the bank's `sender` asset is a placeholder) |
| The app | `components/simulation/instagram/InstagramScene.jsx` | `list.kind: 'activity'` (Notifications) or `'dm'` (Messages with Requests); `conversation.kind: 'post'` (author row = inspection, media carousel, caption, notices, comments) or `'dm'` (request card, story replies, link and pay cards, quick-reply composer); "More options" sheet; resolve banner |
| Blocks | `components/simulation/instagram/IgBlocks.jsx` | Avatar, verified badge, drawn media (`ArtFill`, no image), carousel with local previous/next, request card, story reply, pay card, caption, comment |
| Surface | `components/simulation/surfaces/SocialSurface.jsx` (`SURFACE.SOCIAL`) | Profile, About this account, people, post, story, search, settings, status — a page graph walked with the existing page history |
| Reused | `BROWSER`, `PAYSHEET`, `CALL` | Claim/appeal/registration pages, UPI sheets, calls to a saved number |

New beat kinds (Instagram renderer only): `requestCard`, `storyReply`, `sharedPost`, `payCard`,
`caption`, `comment`; `system` gains tones `mention` and `banner`. Beats still carry
`since`/`until`/`afterConsequence`, so a post's comments and a DM thread are a pure function of the
committed stage.

**Generic, optional additions, unused by WhatsApp:**

- `scene.notify.sender` — the toast title (`PhoneShell`), where the bank's sender is a placeholder.
- `scene.messageSender` — the Trusted Directory's "Details taken from the message" (`SimulationPage` →
  `TrustedDirectory`).
- `FIELD_KIND.MASKED` — free text masked by CSS (a password); `SECRET` stays digits-only.
- `SceneControl` variant `ig` — the chip in Instagram's colours (position, never risk).

**Adding an Instagram scene** (all twenty-five are authored; see §16 and §17 for what 004D and 004E added):

1. Write `scenes/instagram/iNN.js`; read through `instagram/shared.js`; use the client's handle.
2. Register it; add its bank record to nothing — `test/sceneFixtures.js` loads every platform.
3. `sceneModel.test.js` checks it automatically, including the Instagram verdict-word ban
   (clone, impersonation, genuine, look-alike, unknownsender) and "no WhatsApp branch shape".
4. Add safe paths, pinned pairs and review walks to `backend/tests/sceneAffordance.test.js`, and
   paths to `backend/scripts/playScenario.js` (`PIN_INSTAGRAM` narrows the isolated pool).
5. Add the batch to `BATCHES` in `sceneResearch.test.js` and write its research record.

**Bitten during 004A:** a jsdom suite finds list rows by accessible name, so a row that drew nothing
passed every test (assert visible text too); a post must open at its top, a DM at its end; a
consequence beat shared by several choices must not echo one of them; HMR during a hand-played run
closes open sheets — edit between scenarios, not mid-stage.

| Suite (IMMERSIVE-004A) | What it holds |
| --- | --- |
| `frontend/src/pages/SceneScenariosInstagram.test.jsx` | 33: I01–I05 through the real controller and API — the post, profile, About and brand search; the claim login and fee with nothing typed on the wire; Account Status; the verified post and the stranger's form; the clone beside the real friend and her story; the story-reply elicitation, Karan and privacy; allowlisted metadata, remount recovery, no placeholder on the toast or in the directory, containment |
| `backend/tests/sceneAffordance.test.js` | 54 (from 43): I01–I05 legality, safe paths, pinned pairs, identity, engine → review walks |
| `frontend/src/simulation/sceneModel.test.js` | 468 (from 386): all thirty scenes, plus the Instagram-specific assertions |

## 14. Instagram I06–I10 (IMMERSIVE-004B)

Five more scene packs on the same layer; **no engine, scoring, timer, selection, result, review, bank
or backend source change** (`backend/scripts/playScenario.js`, a dev script, gained I06–I10 and W01
paths). What the batch needed from the renderer, all optional and generic, all unused by WhatsApp and
by I01–I05:

| Addition | File | What it does |
| --- | --- | --- |
| `conversation.own` | `InstagramScene.jsx` | The learner's own post: the author row never borrows the scene's profile navigation |
| Comment composer on a post | `InstagramScene.jsx` | Drawn only when the scene offers composer affordances on a post; placeholder "Add a comment…" and "Comments on your post are public." |
| Anchored controls under a comment | `IgBlocks.jsx` `IgComment` | `anchoredTo(inline, commentBeatId)` — reach a commenter's profile from their comment |
| `conversation.media: 'reel'`, `audio`, `cta` | `InstagramScene.jsx`, `IgBlocks.jsx` `PostMedia` (`shape`, `reel`) | A sponsored reel in the feed (4:5, Reel badge, frame stepping), its audio credit, and a call-to-action strip whose control is anchored to `cta` |
| Social view `reel` | `SocialSurface.jsx` | Full-screen reel player: frames, account (optional `profileTo`), caption, audio, counts; Like/Save controls scoped by `page` |
| Social view `list` | `SocialSurface.jsx` | Plain rows with optional query and place icon |
| Pages with controls size to content | `SocialSurface.jsx` | So a short page's controls are not pushed below an empty screen |
| `sharedPost` with `reel` and `title` | `IgBlocks.jsx` | A reel shared into a DM |
| Art `field`, `food`, `chart`, `gear`, `award` | `IgBlocks.jsx` `ArtFill` | Drawn media fields; still no image anywhere |
| "1 like" | `IgBlocks.jsx` `IgComment` | Pluralisation |

The anchor guard in `sceneModel.test.js` now accepts `cta` (a named place in the post chrome, like
`header`) and checks the post declares one.

**One bank shape new to Instagram:** I09's notification is a sponsored placement with no `@handle:`;
its sender asset is the client's "Sponsored" with a placeholder identifier. `notify.sender` is
"Sponsored", the advertiser is scene content, and the placeholder identifier is never printed
(asserted). **Answer-bearing asset prose:** I09/I10 browser assets carry the stage-4 sentence as their
`body`; no control opens the generic inspection sheet on them (I09's link inspection opens an authored
"About this ad" screen).

| Scene | Interaction it adds |
| --- | --- |
| I06 | Elicitation in the comments of the learner's **own post**; release by a public reply or **Edit post › Add location**; the account's pinned "season map"; the post's release note; the public-information cell |
| I07 | The ordinary item: an inbox thread with yesterday's context, a **reel player** with Like/Save, **search inside the conversation** as the check, and a reel-downloader site as the only untrusted channel |
| I08 | A ✔️ emoji in a display name against the platform badge; the application (ID number, password) and a priority fee; **Settings › Request verification** and the Help Center |
| I09 | A **sponsored reel**: frames, audio credit, About this ad, the advertiser's ad history; a landing page funnelling to a group, an APK, KYC and a deposit; the regulator's register app |
| I10 | A creator agreement whose **clauses** (password sharing, a monthly charge) carry the turn; the account's pinned-post comments; the brand's **own website** and its account check |

| Suite (IMMERSIVE-004B) | What it holds |
| --- | --- |
| `frontend/src/pages/SceneScenariosInstagramB.test.jsx` | 40: I06–I10 through the real controller — safe routes, the location tag and public reply, the reel player and chat search, the badge application and fee, the ad's KYC and install, the agreement and UPI shipping; typed values never on the wire; allowlisted metadata; remount recovery; toast/directory naming; no verdict word; containment |
| `backend/tests/sceneAffordance.test.js` | 65 (from 54): I06–I10 legality, safe paths, 61 pinned event/point pairs, consequence inertness, identity, engine → review walks (I07 false positive, I06/I08/I09/I10 releases), no event code or placeholder in reviews |
| `frontend/src/simulation/sceneModel.test.js` | 546 (from 468): all thirty-five scenes plus the I06–I10 block — branch shapes unique against all thirty earlier scenes, extended verdict-word ban, each scene's interaction, mixed resolve banners |

**Bitten during 004B:** the Browser pane's screenshot can lag the DOM (a filled form drew empty) —
confirm with the DOM before concluding; a comment marked `reply` indents under whatever comment precedes
it; a flag emoji renders as letters on Windows.

---

## 15. Instagram I11–I15 (IMMERSIVE-004C)

Five more scene packs on the same layer; **no engine, scoring, timer, selection, result, review, bank
or backend source change** (`backend/scripts/playScenario.js`, a dev script, gained I11–I15 paths, and
`backend/tests/sceneAffordance.test.js` gained tests). What the batch needed from the renderer, all
optional and generic, all unused by WhatsApp and by I01–I10:

| Addition | File | What it does |
| --- | --- | --- |
| `page.actions` on a profile | `SocialSurface.jsx` `ProfilePage` | A professional account's Call / Email / Address row, each printing the contact detail it holds and optionally opening a page. The detail is printed rather than hidden behind a dialler this simulation does not have — it is the thing the learner has come to compare |
| `page.highlights` on a profile | `SocialSurface.jsx` `ProfilePage` | The story-highlight covers under the bio; one that names a page opens it, and opening it is navigation |
| `row.art` on a `list` row | `SocialSurface.jsx` `ListPage` | A cover thumbnail, which is what turns the plain row list into a Saved collection |
| `art` and `play` on a `link` beat | `IgBlocks.jsx` `IgBeat` | The thumbnail a DM link preview carries, with the play badge a video share gets. Drawn, like every tile — nothing loads and nothing plays |
| `status` rows keyed by position | `SocialSurface.jsx` `StatusPage` | A login-activity list legitimately repeats a label; keying on the label alone dropped a row (found in browser play) |

**One rule this batch had to state explicitly.** Where two different branch controls resolve to the
same `consequence` — I12's code in the composer and its security-check page both produce
`simulated_data_submission`, as do I13's gift cards and identity card, and I14's picker and composer —
the `afterConsequence` beat must say what is true of BOTH. Echoing one of them back ("Sent 2 files")
describes the wrong act on the other route. Found in browser play and fixed in all three scenes.

| Scene | Interaction it adds |
| --- | --- |
| I11 | The ordinary item, where the only unsafe acts are the learner's own words: a public comment carrying a case, or the same sent as a message request. Correct use is Instagram's **Save**, and the client's "local directory comparison panel" is the learner's own **Saved collection**, which already holds the same notice with the previous extension on it |
| I12 | A relayed **code**: a real reset puts six digits on the learner's own screen while the account asks for them in the message box; the look-alike page is the second route; the check is the learner's own **Password and security** — Security Checkup, sessions, Login activity, Support requests |
| I13 | A **four-month thread** with day separators; a release portal offering **gift cards or a wallet**; an identity card sent from the chat; and a local, offline **Image Match** index as the client's own stage-5 reverse-image allowance |
| I14 | The device's own **attachment picker** as the decision; the page's story **highlights**, where last month's "featured" personnel are on screen with their documents; the administrative office and the unit media desk |
| I15 | The friend's **own** account — every documentary check comes back clean; a login gate (password, then the code) and, needing nothing typed, the platform's own **login-request prompt**; the friend's saved number and the learner's Login activity |

| Suite (IMMERSIVE-004C) | What it holds |
| --- | --- |
| `frontend/src/pages/SceneScenariosInstagramC.test.jsx` | 44: I11–I15 through the real controller — the Saved-collection comparison and the public comment, the relayed code and the security page, the four-month thread and the gift cards, the picker and the highlights, the login gate and the login-request prompt; typed values never on the wire; allowlisted metadata; remount recovery; toast naming; no verdict word; containment |
| `backend/tests/sceneAffordance.test.js` | 78 (from 65): I11–I15 legality, safe paths, 52 more pinned event/point pairs, consequence inertness, canonical identity, engine → review walks (I11 false positive and unsafe step, I12/I13/I14/I15 releases), no event code or placeholder in reviews |
| `frontend/src/simulation/sceneModel.test.js` | 618 (from 546): all forty scenes plus the I11–I15 block — branch shapes unique against all thirty-five earlier scenes, verdict-word ban, each scene's interaction, mixed resolve banners, action/highlight link targets |

**Bitten during 004C:** an anchored `navigate` still needs `opens` — the anchor says where the control
is drawn, not where it goes; `status` rows keyed on their label dropped a duplicate; and a `list` view
is no longer unique to I06–I10, so that batch's exclusivity assertion was rescoped to the scenes that
existed before it rather than weakened.

---

## 16. Instagram I16–I20 (IMMERSIVE-004D)

Five more scene packs on the same layer; **no engine, scoring, timer, selection, result, review, bank
or backend source change** (`backend/scripts/playScenario.js`, a dev script, gained I16–I20 paths, and
`backend/tests/sceneAffordance.test.js` gained tests). One renderer addition, optional and unused by
every earlier scene:

| Addition | File | What it does |
| --- | --- | --- |
| `photo` beat | `IgBlocks.jsx` `PhotoBeat` | A photo in a DM behind the app's **sensitive-content screen** (`screen`, `reason`). "See photo" is local component state that records nothing, and reveals a drawn frame plus `revealedCaption` — there is no image and nothing graphic is drawn |

Everything else is a new *use* of an existing view: the consent card is a `status` page and tag review
a `settings` page (I16); Restrict sits on a `settings` page (I17); the DM location card is a `list`
page (I18); the share tray is a `settings` page and the story composer a `story` page with controls
scoped by `page` (I19); the questionnaire is a four-step `BROWSER` page graph whose commit control is
scoped to its review step (I20).

| Scene | Interaction it adds |
| --- | --- |
| I16 | The ordinary item, reached from **Notifications** into an established DM. The decision is in **Settings › Tags and mentions**, on a consent card where **Confirm and Decline are both the normal path**; the check is a local **Release Register** holding PF-204. The −4 routes are the learner over-helping with caption detail and asking for a "link to sign" |
| I17 | A message request whose photo arrives behind the **sensitive-content screen**; a wallet sheet; Instagram's **Restrict** as a safe route; a **Support & Reporting** app and a welfare desk that do not blame the learner. Deleting everything is priced at resolve |
| I18 | A **high-fidelity copy** in the main inbox: followers, mutuals and photographs all pass; About, the follower cohort and a **pinned caption copied from the other account's March post** do not. The decision is the DM's own **location card**; the check is the saved number and **Unit Orders** |
| I19 | A viral post the learner is **mentioned** in; the decision is Instagram's **share tray** and the learner's **story composer** with location and mention stickers; the page's own April post under an earlier name re-uses the frame; the check is the **Unit Bulletin** |
| I20 | A **month-long professional thread** that turns into capability questions and a **three-page questionnaire** from the scenario's own page asset; three different releases (form, answer, "correction") and a general answer that is still engagement; the check is the security contact and a **Research & Media Requests** register |

**Rules this batch had to state.** (1) A safe control must not sit behind input: a payment sheet shows
its controls only after a PIN, so no "close without paying" control may live there — its Back is the
cancel. (2) The 004C shared-consequence rule applied again (I18's pin and typed place; I19's repost and
comment). (3) A directory row is visible before resolution, so its description may not label the item.
(4) Malicious items never offer `reject_ignore`; the engine refuses it on them, and the tests say so.

| Suite (IMMERSIVE-004D) | What it holds |
| --- | --- |
| `frontend/src/pages/SceneScenariosInstagramD.test.jsx` | 45: I16–I20 through the real controller — the tag-review consent card (both answers), the caption over-share and the false positive; the screened photo, Restrict, the PIN-gated payment and the support app; the copy's history against the other account and the location card; the share tray, story stickers and the bulletin; the questionnaire walked and submitted with no answer on the wire, and the bio link to it; allowlisted metadata; remount at verify; toast naming; no verdict word; containment |
| `backend/tests/sceneAffordance.test.js` | 93 (from 78): I16–I20 legality, safe paths, 63 more pinned event/point pairs, no `reject_ignore` on malicious items, consequence inertness, canonical identity, engine → review walks (I16 false positive and unsafe step; I17–I20 releases and engagement), no event code or placeholder in reviews |
| `frontend/src/simulation/sceneModel.test.js` | 692 (from 618): all forty-five scenes plus the I16–I20 block — branch shapes unique against all forty earlier scenes, decision homes, extended verdict-word ban, each scene's interaction, I18's truncated sentence, mixed resolve banners, link targets, fictional-content guard |
| `frontend/src/simulation/sceneResearch.test.js` | 113 (from 101): the I16–I20 record, its mappings, partial fits, rejections and its recorded I20 overlap |

**Bitten during 004D:** a post whose caption beat has a `time` AND a `conversation.time` prints its age
twice (found in I19 browser play; fixed there, and still present in I01/I03/I06/I09/I11, raised
separately); composer chips carry a screen-reader suffix, so tests must find them by
pattern; a coarse "where is the decision made" signature cannot be unique for every scene (I02 and I12
already share one with I20), so the assertion states the overlap rather than hiding it.


---

## 17. Instagram I21–I25 (IMMERSIVE-004E) — the final Instagram batch

Five more scene packs on the same layer; **no engine, scoring, timer, selection, result, review, bank
or backend source change** (`backend/scripts/playScenario.js`, a dev script, gained I21–I25 paths, and
`backend/tests/sceneAffordance.test.js` gained tests). With this batch **all twenty-five Instagram
scenarios are authored**. Renderer additions, all optional and unused by every earlier scene:

| Addition | File | What it does |
| --- | --- | --- |
| `review` view | `SocialSurface.jsx` `ReviewPage` | A tag request: the post's frame, its facts, and a **local audience radio group** (`role="radio"`, `aria-checked`). The chosen audience is component state only — never lifted, never on an affordance, never sent |
| `conversation.readOnly` | `InstagramScene.jsx` | A **broadcast channel**: the owner-only note replaces the composer, and the header drops the call icons |
| `conversation.commentNote` | `InstagramScene.jsx` | The public-comment note on a post that is not the learner's own (an ad); defaults to the previous own-post text |
| `audio` anchor | `InstagramScene.jsx` `PostView` | A reel's audio credit carries local navigation to its audio page; only a `navigate` may sit there (asserted) |
| `remote.figure: 'agent'` | `CallSurface.jsx` | A drawn headset-and-lanyard figure for a video call; the uniformed figure stays the default |

| Scene | Interaction it adds |
| --- | --- |
| I21 | The ordinary item, peer to peer, **after** publication: Messages → an established DM with the unit's PF-311 post shared in → the **published post's own tag-review sheet** (Approve / Decline, both the normal path) with a local audience choice. A stranger's "HD album" comment link is the untrusted channel; "the next fixture for the caption" is the over-share; the check is the Release Register plus the learner's own release preferences, or Arjun's saved number |
| I22 | A message request, then an **Instagram video chat** whose three asks sit behind the call's own controls: Turn on camera → the phone's camera prompt → ID frame; Share screen → the system consent; Settings › Backup codes → "read code 1 aloud". End call is the scene's control while the call is live. The check is the learner's own **Account Status / Support requests** |
| I23 | A **broadcast channel** (no reply box) from a real, verified creator whose **beneficiary** has changed: a Fundraisers page always paid to one trust, today's post with none. "Share to your story" is a control on the message; the wallet sheet sends after a PIN. The check is the **trust's own website** from bookmarks (which reports the takeover) and its saved helpline |
| I24 | A **sponsored carousel** of seals; a **comment cohort** (same sentence, new accounts, two minutes); a **download page** (installer sheet) with Install / Not now; a **web dashboard already credited** whose withdrawal is locked behind KYC and an 18% "tax" sheet; a public "Interested" comment; checks in the **phone's own app store** and the **learner's own broker** |
| I25 | A **code inside a reel**, read from a screenshot by the phone's scanner (Open link / Close); the reel's **audio credit** leading to the welfare page's 2025 notice; an eligibility form (service number, family, canteen card) via the bio link; a ₹49 activation sheet; sharing to the family group; the **Welfare Notices** board and the canteen office |

**Differentiation, asserted.** No I21–I25 branch-stage shape equals any of the forty-five earlier
scenes', and — unlike 004D, which had to record one overlap — no I21–I25 **decision home** (where the
scored branch controls sit) equals any earlier scene's either. Two conceptual overlaps are forced by
the client's own stage text and are recorded rather than hidden: I21's release-register check (I16)
and I22's screen-share consent (W24).

| Suite (IMMERSIVE-004E) | What it holds |
| --- | --- |
| `frontend/src/pages/SceneScenariosInstagramE.test.jsx` | 46: I21–I25 through the real controller — the tag-review sheet with a local audience (never on the wire), the album link and the caption over-share; the video chat's camera prompt, screen-share consent and backup codes, End call as the decision; the read-only channel, the PIN-gated wallet and share-to-story; the carousel, the comment cohort, the download page, the pre-credited dashboard, KYC and the tax; the reel's scanner, audio page, the bio-link eligibility form and fee, and the spent-decision form shown without fields; allowlisted metadata; remount at verify; toast naming (I24 "Sponsored"); no verdict word; containment |
| `backend/tests/sceneAffordance.test.js` | 108 (from 93): I21–I25 legality, safe paths, 71 more pinned event/point pairs, no `reject_ignore` on malicious items, consequence inertness, canonical identity, engine → review walks (I21 false positive and unsafe steps; I22–I25 releases and engagement), no event code, placeholder or sponsored identifier in reviews |
| `frontend/src/simulation/sceneModel.test.js` | 767 (from 692): all fifty scenes plus the I21–I25 block — branch shapes and decision homes unique against all forty-five earlier scenes, extended verdict-word ban, each scene's interaction, the `audio` anchor guard, I24 as a sponsored item, mixed resolve banners (right answer not always first), link targets, fictional-content guard |
| `frontend/src/simulation/sceneResearch.test.js` | 125 (from 113): the I21–I25 record, its mappings, partial fits, rejections and its stated overlaps |
| `SceneContainment.test.jsx` | 201 (from 181) |

**Bitten during 004E:** a drawn slide's title does not wrap inside the carousel (long titles such as
"◉ Registered ◉ Licensed ◉ Insured" were clipped in browser play), so slide titles are kept short and
the long text goes in the subtitle; an installer `sheet` prints its `artLabel` under the tile, so it
must not repeat the title; an "earlier scenes" exclusivity assertion computed as "every scene not in
this batch" silently starts including later batches (I14's viewer check tripped on I25) and has to be
scoped to the scenes that existed before it; and closing a pushed screen returns focus to the page
body rather than to the control that opened it — shared surface behaviour since 003A, recorded, not
changed.

---

## 18. SECURITY-001 — the neutral learner action contract

Full design: [`NEUTRAL_LEARNER_ACTION_CONTRACT.md`](NEUTRAL_LEARNER_ACTION_CONTRACT.md). What it means for
this layer:

| Before | After |
| --- | --- |
| `action({ id: 'w01-branch-pivot', intent: 'safe_pivot', … })` | `action({ id: 'w01-c08', … })` |
| `data-intent`, `data-affordance` on every control | `data-control="act"` or `"nav"`, nothing else |
| `sceneModel.STAGE_INTENTS` mirror in the bundle | removed; the server map is the only copy |
| request `{ intent, metadata.verify_source }` | request `{ action_code }`; source derived server-side |
| response `event.event_code` | removed; `view` added |
| row control found by `intent === 'read'` | first inline control of the list stage |
| inspection sheet chosen by intent | chosen by the response `view` |
| `pendingIntent` | `pendingAction` (a control id) |

The 1,037 scored controls of W01–W25 and I01–I25 were renamed and stripped by a one-time scripted
rewrite and re-verified control by control; labels, beats, surfaces, branch paths, consequences,
verification routes and scoring are unchanged (1,037 / 1,037 against the pre-migration baseline).

| Suite (SECURITY-001) | What it holds |
| --- | --- |
| `frontend/src/simulation/sceneModel.test.js` | +154 (969 → 1123): neutral ids and no intent/source on every scored control, map ↔ scene bijection and stage legality, row-control order, `action()` refusal, generic-sheet ids, fake-server coverage, no canonical vocabulary in any product source file |
| `frontend/src/pages/SceneScenarios.test.jsx` / `SceneScenariosInstagram.test.jsx` | W01 and I01 safe and unsafe walks: DOM snapshots, request bodies and storage free of vocabulary and control ids; one issued code per control; a missing code sends nothing |
| `frontend/src/pages/SimulationPage.test.jsx` | the generic action sheet held to the same rule |
| `backend/tests/sceneAffordance.test.js` | 108: map ↔ engine ↔ scene; every walk goes through `translateActionCode` |
| `backend/tests/learnerAction.test.js` | 10: map validation, code properties, translation and refusals, all 1,037 controls against the baseline, generic sheet on all 100 scenarios |
| `backend/tests/learnerActionApi.test.js` | 12 (DB): issued codes, WhatsApp and Instagram safe/unsafe routes scored and reviewed as before, intent refusal, malformed/cross-run/cross-scenario/wrong-stage refusal, duplicate replay, stale 409, spent codes, neutral refusals |
| `frontend/scripts/checkNeutralBundle.mjs` | `npm run check:bundle` on the production build |


---

## 19. Email (IMMERSIVE-005) — E01–E05, the first Email batch

Email E01–E05 run on the **same** layer as WhatsApp and Instagram: the same `sceneModel`
vocabulary, the same registry, the same `useSceneNavigation` stacks, the same `SceneSurface`
router, the same controller and the **unchanged** engine. What is new is the app that draws a mail
scene and one surface kind (`SURFACE.MAIL`); no engine, scoring, timer, selection, result, review,
bank or backend **source** changed (the dev script `playScenario.js` gained E01–E05 paths and
`PIN_EMAIL`; `learnerActionService.loadActionMaps` reads one more platform file; the guard tests
gained Email cases).

| Piece | File | What it is |
| --- | --- | --- |
| Scene packs | `simulation/scenes/email/{shared,e01..e05}.js` | Read the payload through `email/shared.js`; the sender, subject, link/file/directory come from `scenario.synthetic` |
| The app | `components/simulation/email/EmailScene.jsx` | An inbox with folders and a search bar, a message opened from its row, a sender line that expands into the details, an HTML body with the sender's own brand band and buttons, quoted history behind a toggle, an overflow menu, and Reply / Forward sheets with a To line |
| Blocks | `components/simulation/email/MailBlocks.jsx` | The mail avatar, the file glyph, the earlier-message row, quoted-text toggle, and every body beat (body, brand band, button, table, steps, timer, attachment card, notice, sent) |
| Surface | `components/simulation/surfaces/MailSurface.jsx` (`SURFACE.MAIL`) | A page graph for the message details (From/Reply-To/authentication summary/link targets), "Show original", another folder, an older message, and the attachment preview with its "Enable content" bar and drawn spreadsheet grid |
| Reused | `BROWSER`, `PAYSHEET`, `APP`, `CALL` | Sign-in / tracking / acknowledgement pages and their forms; E04's clearance-fee sheet; the account/vendor/archive/courier/HR apps; E02's finance-desk call |

New beat kinds (Email renderer only): `body`, `brand`, `button`, `table`, `steps`, `timer`,
`attachment`, `notice`, `earlier`, `sent`. A `COMPOSER` control declares `compose: { mode:
'reply' | 'forward', to }`, which says which of the mail app's two compose sheets it belongs to and
the To line to show; it is presentation only and says nothing about what is submitted.

**Adding an Email scene** (E01–E05 are authored; E06–E25 stay generic):

1. Write `scenes/email/eNN.js`; read through `email/shared.js`; scored controls get neutral ids
   `eNN-c01…` and **no** `intent`/`source` (SECURITY-001); put the open-the-message control first at
   the list stage.
2. Add each control's `{ stage, intent, name }` to `backend/data/learner-actions/v1/email.json`, and
   confirm `email` is in `loadActionMaps` and the test helpers.
3. Register it in `sceneRegistry.js`.
4. `sceneModel.test.js`, `SceneContainment.test.jsx` and `backend/tests/sceneAffordance.test.js` pick
   it up automatically; add the scenario's own integration test to `SceneScenariosEmail.test.jsx`.
5. Write the batch's research record and add it to `BATCHES` in `sceneResearch.test.js`.

**The five archetypes, each deciding in a different place, none of them a WhatsApp/Instagram surface:**

| Scene | Disposition | Decision home | Interaction it adds |
| --- | --- | --- | --- |
| E01 Password Expires Today | malicious | a cloned sign-in page in the browser | full headers + SPF/DKIM/DMARC summary; a genuine month-old reminder in the thread; a credential form |
| E02 Invoice Spreadsheet Macro | malicious | the attachment preview's "Enable content" bar | a macro `.xlsm`; a drawn protected-view spreadsheet grid; a finance-desk call as a check |
| E03 Authenticated Internal Newsletter | **legitimate** | the in-message newsletter (read/archive) | passing authentication; matching monthly cadence; the newsletter archive where the issue number matches; report/block is a false positive |
| E04 Customs Parcel Hold | malicious | a payment sheet reached from a fake tracking page | a courier brand band and shipment timeline; a clearance-fee sheet (PIN then Confirm, its Back cancels) |
| E05 Mandatory HR Policy Login | malicious | a cloned HR login/acknowledgement page | generic greeting + off-domain Reply-To + countdown; a reply that confirms before signing in; the approved HR portal with no task |

`sceneModel.test.js` asserts the five branch-stage shapes are distinct from one another;
`sceneAffordance.test.js` pins each control's event code and point value and that each safe path sums
to ten; `SceneScenariosEmail.test.jsx` plays them through the real controller and API.

| Suite (IMMERSIVE-005) | Result |
| --- | --- |
| `frontend/src/pages/SceneScenariosEmail.test.jsx` (new) | 16: the inbox for every scene, E01 notify→resolve, message-details as unscored navigation, the sign-in form's values never on the wire, E04's PIN-gated sheet, E03's legitimate in-app path, no vocabulary in the DOM, remount recovery |
| `frontend/src/simulation/sceneModel.test.js` | 1213 (from 1123): all fifty-five scenes |
| `frontend/src/simulation/sceneResearch.test.js` | 137 (from 125): the Email record |
| `SceneContainment.test.jsx` | 250 (from 216) |
| `backend/tests/sceneAffordance.test.js` | 117 (from 108): E01–E05 legality, safe paths, pinned pairs, review walks |
| `backend/tests/learnerAction.test.js` / `learnerActionApi.test.js` (DB) | 10 / 12: the map now holds 1,127 scene controls (1,037 + 90 Email); the baseline covers the pre-Email 1,037 |

### 19.1 Email E06–E10 (IMMERSIVE-006) — the second Email batch

Five more Email scene packs on the same layer; **no engine, scoring, timer, selection, result, review,
bank or backend source change** (`learnerActionService.loadActionMaps` already reads the `email`
platform; `playScenario.js` gained E06–E10 paths and `PIN_EMAIL`; the guard tests gained cases). Two
optional renderer additions, both unused by every earlier scene:

| Addition | File | What it does |
| --- | --- | --- |
| A **calendar invitation** (`invite` beat) | `email/MailBlocks.jsx`, `scenes/email/shared.js` | A meeting card — title, when, where, organiser, attendees — with Accept / Tentative / Decline as its anchored controls. Drawn; nothing is added to any real calendar |
| A **compose attachment chip** | `email/EmailScene.jsx` | When a reply draft declares `compose.attachment`, the compose sheet draws a paperclip chip for it. Presentation only; nothing is attached or sent |

Everything else is a new *use* of an existing surface: E08's refund form and E10's vendor-master
edit/payment pages are `BROWSER` surfaces; E09's gift-card store is a `BROWSER` surface; the records,
course-schedule, procurement and change-control checks are `APP` surfaces; E06/E09/E10 verify with a
`CALL`.

| Scene | Disposition | Decision home | Interaction it adds |
| --- | --- | --- | --- |
| E06 Adjutant Roster Request | malicious (military) | the reply composer | an external-sender banner, a data-classification cue, and a reply composer whose "attach the roster" draft carries an attachment chip; checks in the Records System and a call |
| E07 Expected Training Calendar Invite | **legitimate** (military) | the calendar invite card | Accept / Tentative / Decline on a drawn calendar card; the briefing thread and course-schedule check; reporting the organiser is a false positive |
| E08 Instant Tax Refund | malicious | a browser refund form | a refund form that harvests identity + card + OTP (not a login, not a fee); the tax portal shows no case |
| E09 Executive Gift-Card Request | malicious (military) | a gift-card codes surface | a short spoofed executive email from a personal domain; a gift-card store codes form; a duty-office call and procurement check |
| E10 Vendor Changes Bank Details | malicious | the vendor-master edit / payment | a quoted invoice thread, a one-character look-alike domain, an attachment preview, and a vendor-master with both a beneficiary edit and a payment approval; a vendor call and change control |

`sceneModel.test.js` asserts the ten Email scenes each have a distinct branch shape, that E06 attaches
from the composer and E07 is the only invite-card scene, and that the ten decide across at least eight
homes (E09 and E10 share a coarse browser-surface home, distinct shapes — recorded). Suites:

| Suite (IMMERSIVE-006) | Result |
| --- | --- |
| `frontend/src/pages/SceneScenariosEmailB.test.jsx` (new) | 15: inbox for each; E07 invite-card accept; E06 compose attachment chip; E08 refund form containment; E10 vendor-master payment; DOM vocabulary; remount recovery |
| `frontend/src/simulation/sceneModel.test.js` | 1314 (from 1213); the Email E01–E10 distinctness block |
| `frontend/src/simulation/sceneResearch.test.js` | 149 (from 137); the Email E06–E10 record |
| `backend/tests/sceneAffordance.test.js` | 127 (from 117): E06–E10 legality, safe paths, pinned pairs, review walks |
| `backend/tests/learnerAction.test.js` | map now holds 1,218 scene controls (1,037 + 181 Email) |

### 19.2 Email E11–E15 (IMMERSIVE-007) — the third Email batch

Five more Email scene packs on the same layer; **no engine, scoring, timer, selection, result, review,
bank or backend source change** (`learnerActionService.loadActionMaps` already reads the `email`
platform; `playScenario.js` gained E11–E15 paths; the guard tests gained cases). **No new renderer
component** — every decision is a new *use* of an existing surface:

| Scene | Disposition | Decision home | Interaction it adds |
| --- | --- | --- | --- |
| E11 Leave Approval in Known Portal | **legitimate** | opening the known portal app | the first Email message with neither a link nor an attachment; a quoted portal confirmation; the safe branch is *opening a known app* (`APP`), with a web-search sign-in (`BROWSER`) as the off-channel trap; a leave-record and HR-helpdesk check |
| E12 Shared Document Sign-In | malicious (military) | a cloned sign-in, then a push approval | a cloud "share" whose button opens a cloned login (`BROWSER`) that chains into a push-approval page; both a credential submit and an MFA approve are −8; the approved files portal and a call check |
| E13 Password-Protected ZIP | malicious | an inert archive viewer | an encrypted archive whose password is in the mail; the `MAIL` preview lists a `.pdf.exe` beside a decoy; extracting is −3, running is −8; a records-system and desk check |
| E14 Revised Movement Order | malicious (military) | a QR inspector and a decrypt portal | the first Email QR: a `VIEWER` inspector states the decoded off-domain target, a `BROWSER` decrypt portal harvests service credentials; scanning is −3, submitting is −8; an orders-system and call check; a resolve rationale line |
| E15 OAuth Consent for Mail Review | malicious | an OAuth consent screen | the first Email consent screen (`BROWSER`) listing Mail.Read / Mail.Send / Contacts; granting is −8 with **no field typed**; an app-catalogue and IT check |

`sceneModel.test.js` asserts the fifteen Email scenes each have a distinct branch shape, that E12 alone
chains a credential submit and a push approval on one cloned surface, that E14 alone decides on a scanned
QR, that E15 alone decides on a consent screen with no typed field, and that the fifteen decide across at
least ten homes (E09 and E10 share a coarse browser-surface home, distinct shapes — recorded). Suites:

| Suite (IMMERSIVE-007) | Result |
| --- | --- |
| `frontend/src/pages/SceneScenariosEmailC.test.jsx` (new) | 16: inbox for each; E11 portal launch; E12 sign-in containment; E13 `.pdf.exe` listing; E14 decrypt-portal containment; E15 consent scopes with no field; DOM vocabulary; remount recovery |
| `frontend/src/simulation/sceneModel.test.js` | 1409 (from 1314); the Email E01–E15 distinctness block |
| `frontend/src/simulation/sceneResearch.test.js` | 161 (from 149); the Email E11–E15 record |
| `backend/tests/sceneAffordance.test.js` | 136 (from 127): E11–E15 legality, safe paths, pinned pairs, review walks |
| `backend/tests/learnerAction.test.js` | map now holds 1,313 scene controls (1,037 + 276 Email) |

### 19.3 Email E16–E20 (IMMERSIVE-008) — the fourth Email batch

Five more Email scene packs on the same layer; **no engine, scoring, timer, selection, result, review,
bank or backend source change**. **No new renderer component** — every decision is a new *use* of an
existing surface:

| Scene | Disposition | Decision home | Interaction it adds |
| --- | --- | --- | --- |
| E16 Signed Maintenance Notice | **legitimate** | the notice's own calendar file | the first scene whose evidence is a passing *digital signature*; a `.ics` preview (`MAIL`) whose anchored **Add reminder** writes to a local `Calendar` (`APP`); the mistakes are the learner's own — Junk, block, or forwarding work mail to a personal address; an IT status board and a desk call as checks |
| E17 Invoice Callback Trap | malicious | the phone's own **Call this number?** dialog | the first Email with *neither link nor attachment*: the decision is the tappable number, taken on a local dialer dialog (Call / Cancel); calling reaches a scripted desk that asks to install remote support, shown through the existing `INSTALLER` screen; a mail search, a card statement and a bank call as checks |
| E18 Hijacked Reply-Chain Invoice | malicious | the Payables app and the reply/forward composer | the first scene where **every authentication check passes because the mail really did leave the vendor's mailbox**; only the Reply-To differs; a `Payables` app (`APP`) carries beneficiary change / release / hold, and forwarding to a second approver is the quiet way dual control becomes a formality; a vendor callback and the dual-control queue as checks |
| E19 Academic Interview on Readiness | malicious (military) | the questionnaire's own "fill in and send back" bar | elicitation with no payload at all: a fillable document preview (`MAIL`) whose release bar is the branch, plus reply-to-interview and forward-to-the-section; a 38-name recipient list on the details sheet; the PIO and the approved research-requests register as checks |
| E20 Legal Notice and Secrecy Order | malicious | the case portal reached from the email | the first scene whose lever is **isolation** — the notice forbids telling anyone; a `BROWSER` portal with upload and payment *pages* where both are decisions and **neither is a form**; the portal's own case lookup can only agree with itself, so the real check is the learner's own case-status app and unit legal support |

`sceneModel.test.js` asserts that the twenty Email scenes each have a distinct branch shape, that E17
alone decides on the phone's dial dialog, that E18 alone arrives from the vendor's own authenticated
address, that E19 alone releases through a document's own bar, that E20 alone keeps the offered lookup on
the portal it links to — and that **nothing is typed on any E16–E20 screen**: every decision is a control.
E03 and E16 share a coarse branch home (the in-message artefact) with distinct shapes — recorded.

| Suite (IMMERSIVE-008) | Result |
| --- | --- |
| `frontend/src/pages/SceneScenariosEmailD.test.jsx` (new) | 27: inbox for each; E16 calendar-file reminder; E17 dial dialog and installer; E18 payables hold and composer containment; E19 questionnaire release; E20 upload/payment with no field; DOM vocabulary; remount recovery |
| `frontend/src/simulation/sceneModel.test.js` | 1510 (from 1409); the Email E01–E20 distinctness block |
| `frontend/src/simulation/sceneResearch.test.js` | 173 (from 161); the Email E16–E20 record |
| `backend/tests/sceneAffordance.test.js` | 141 (from 136): E16–E20 legality, safe paths, pinned pairs, review walks |
| `backend/tests/emailE16E20Engine.test.js` (new, needs an isolated replica-set DB) | 6: the five scenes walked through the real engine over HTTP |
| `backend/tests/learnerAction.test.js` | map now holds 1,411 scene controls (1,037 + 374 Email) |

**Validated in the browser (19 September 2026)** against an isolated API on `localhost:5055` and an
isolated database: a safe and an unsafe hand-play of each of E16–E20 (safe 10/10, unsafe 0/10 in every
pair), reload recovery mid-scene, duplicate replay, wrong-stage, mismatched `expected_stage`, tampered and
malformed codes, cross-run replay and forbidden request fields. **375 px and 320 px (~200 % of 640): no
horizontal page overflow on any reachable screen.** Only `localhost:5199` and `localhost:5055` were ever
contacted (225 resources, zero external); the `.training.example` addresses are drawn text — the page has
no anchor, image, iframe or form at all, so none of them can produce a request.

### 19.4 Email E21–E25 (IMMERSIVE-009) — the fifth and final Email batch

Five more Email scene packs on the same layer; **no engine, scoring, timer, selection, result, review,
bank or backend source change** (`learnerActionService.loadActionMaps` already reads the `email`
platform; `playScenario.js` gained E21–E25 paths; the guard tests gained cases). Email is now **25/25**.
One optional renderer addition and one small generalisation, both unused by every earlier scene:

| Addition | File | What it does |
| --- | --- | --- |
| A **voice attachment** (`voice` beat) | `email/MailBlocks.jsx`, `scenes/email/shared.js` | An audio attachment drawn the way a mail client draws voicemail: name, length, a local play control over the authored clock, a drawn waveform and the app's own **Show transcript**. There is no `<audio>`, media file, object URL or media API anywhere; the transcript is where the words are. Playing and reading it are local and record nothing |
| A **control anchored to a `table` beat** | `email/MailBlocks.jsx` | The key/value block now draws anchored controls, as `attachment` and `invite` already did, so a scene can put the thing that acts on those details directly under them (E22's transfer sheet) |

| Scene | Disposition | Decision home | Interaction it adds |
| --- | --- | --- | --- |
| E21 Verified Vendor Master Change | **legitimate** | the vendor portal's own case page | the first scene whose safe branch **completes** a high-risk change rather than keeping or archiving one, and the first whose **message link is genuine**; a signed-form fingerprint the learner reads against the portal's own record, a callback logged on the number already on file, and "Approval 1 of 2" by somebody else; over-rejecting costs −2 and releasing the payment in the same step −4 |
| E22 Senior Voice Memo Transfer | malicious (military) | the welfare fund's transfer sheet | the first scene in the product whose payload is a **recording** — a `voice` attachment with a local player, a drawn waveform and the mail app's transcript; the attachment-details screen states what a recording cannot carry (no sender, no signature, no address); PIN then Confirm, with Cancel beside it |
| E23 DLP Alert HTML Attachment | malicious | a page opened **from a file on the device** | the first scene to open a `file:///` page: the mail app refuses to render the HTML and its preview bar offers only "Open it in the browser", and the address bar then shows a Downloads path with no host and no padlock — every domain-reading habit gives the learner nothing; the page draws a work login and a "secure viewer" installer |
| E24 QR Code in Policy PDF | malicious | the code inspector, then a cloned sign-in | the code is on **page 7 of an eight-page paginated document**, behind six pages of real policy prose, so it has to be walked to; the inspector states the printed short form *and* the host it expands to; and the item's own legitimate task — acknowledging in the Policy Centre the unit already uses — is offered as the safe branch |
| E25 Payroll Direct-Deposit Redirect | malicious (military) | the prefilled change form and the Payroll run | fakes a reply chain by **reusing a subject line** rather than a mailbox (the headers say it replies to nothing and the quoted text is a real 28 Aug message pasted in), and is the only scene where the money at risk is **a third person's**, so the learner's "would I pay this?" instinct never fires |

`sceneModel.test.js` asserts that the twenty-five Email scenes each have a distinct branch shape, that
**each of E21–E25 has a decision home no other Email scene shares**, that E22 alone in the product carries
a `voice` beat, that E23 alone opens a `file:///` page, that only E14 and E24 decide on a scanned code
(with different page graphs and safe branches), and that exactly two of the five have any form field.

**One thing this batch found and fixed, worth carrying forward.** The engine takes one decision per
stage, so a scene whose second risky surface is reachable *only* through a scored control makes the
controls on that surface unpressable in the UI: opening it spends the decision they belong to. Hand-play
caught this in E23, E24 and E25, and each now offers a branch-stage `navigate` to that surface — the
shape `e12-nav-signin`, `e20-nav-portal` and `e02-nav-preview` already use. A new assertion in
`sceneModel.test.js` holds E21–E25 to it. **Three earlier scenes (W02, W05, I25) predate the rule and are
not changed by this task**; they are recorded in `EMAIL_E21_E25_REAL_WORLD_RESEARCH.md` §8.

| Suite (IMMERSIVE-009) | Result |
| --- | --- |
| `frontend/src/pages/SceneScenariosEmailE.test.jsx` (new) | 32: the inbox for each; E21 notify→resolve and its signed form; E22's player, transcript and PIN-gated sheet; E23's preview bar and `file:///` page; E24's paginated document and Policy Centre; E25's comparison page, Payroll hold and forward composer; DOM vocabulary; remount recovery |
| `frontend/src/simulation/sceneModel.test.js` | 1613 (from 1510); the Email E21–E25 distinctness block and the reachability guard |
| `frontend/src/simulation/sceneResearch.test.js` | 185 (from 173): the Email E21–E25 record |
| `SceneContainment.test.jsx` | 332 (from 250) — picked the five scenes up automatically |
| `backend/tests/sceneAffordance.test.js` | 147 (from 141): E21–E25 legality, safe paths, pinned pairs, review walks |
| `backend/tests/emailE21E25Engine.test.js` (new, needs an isolated replica-set DB) | 6: the five scenes walked through the real engine over a real MongoDB transaction |
| `backend/tests/learnerAction.test.js` | map now holds 1,509 scene controls (1,037 + 472 Email) |

**Validated in the browser (20 September 2026)** against an isolated API on `localhost:5055`, an isolated
database and the **production build** served on `localhost:5199`: E21 hand-played safe (10/10), E22
hand-played unsafe (0/10, including a premature reply the engine priced at −1), E23 hand-played twice
(4/10 by opening the file; and a live credential submit that committed −8), E24 driven through the UI
(4/10); all eighteen safe and unsafe routes for E21–E25 additionally played through the real public HTTP
API and scoring exactly as pinned; eleven refusal cases over HTTP (forbidden fields, malformed, tampered,
duplicate replay, stale, mismatched `expected_stage`, cross-run); reload mid-scene resumed at the same
run and stage with the pushed surface correctly *not* restored. **375 px and 320 px (~200 % of 640): no
horizontal page overflow on any reachable screen**, and no control under 24 px or without an accessible
name. Only `localhost:5199` and `localhost:5055` were ever contacted (227 requests, zero external).

---

## 20. SMS (IMMERSIVE-010) — S01–S05, the first SMS batch

SMS S01–S05 run on the **same** layer as WhatsApp, Instagram and Email: the same `sceneModel`
vocabulary, the same registry, the same `useSceneNavigation` stacks, the same `SceneSurface` router,
the same controller and the **unchanged** engine. What is new is the app that draws a text scene and
one surface kind (`SURFACE.SMS`); no engine, scoring, timer, selection, result, review, bank or
backend **source** changed beyond `learnerActionService.loadActionMaps` reading one more platform
file (`sms`), and the dev script `playScenario.js` gaining S01–S05 paths and `PIN_SMS`.

| Piece | File | What it is |
| --- | --- | --- |
| Scene packs | `simulation/scenes/sms/{shared,s01..s05}.js` | Read the payload through `sms/shared.js`; the sender, number, message text, link target and directory entry come from `scenario.synthetic` |
| The app | `components/simulation/sms/SmsScene.jsx` | A message list with the phone's own **category tabs**, a thread opened from its row, a header that is often only a number and expands into conversation details, the app's **spam bar** above an unsaved sender, grey/blue bubbles, and a "Text message" composer |
| Blocks | `components/simulation/sms/SmsBubbles.jsx` | Day dividers, the carrier's system lines, bubbles, the **link preview card**, the **number card**, the **amount card**, an MMS attachment card and the spam bar |
| Surface | `components/simulation/surfaces/SmsSurface.jsx` (`SURFACE.SMS`) | The Messages app's own screens: conversation details (sender type, registered sender ID, SIM, contacts), a **link-details** screen that expands a shortened address, the thread's history, and spam-protection settings |
| Reused | `BROWSER`, `PAYSHEET`, `APP`, `CALL`, `INSTALLER` | Harvest pages and their forms; S05's mandate sheet; the banking, utility, transport, courier and pay-record apps; the operator and the official callbacks; S02's dial dialog |

New beat kinds (SMS renderer only): `day`, `system`, `message`, `link`, `number`, `amount`,
`attachment`. Two new design-token groups back the app (`--color-sms-*`), deliberately nothing like
the messenger's green.

**Why it does not look like WhatsApp, and why that matters.** A text has no profile, no "last seen",
no delivery ticks, no reactions, no forwarding provenance and no avatar in the thread — so the scene
layer offers none of those on this platform, and `sceneModel.test.js` asserts the beats never carry
them. What a text app has instead is where the evidence lives: **category tabs**, so which bucket a
message landed in is itself evidence and the real bank's thread sits one tab from the fake one; the
**registered sender ID**, which has no equivalent anywhere else in this product and is the tell in
three of the five scenes; the **spam bar** with the app's own Block and Report controls; **link cards
that show an address exactly as written**, so a shortener stays a shortener until the learner opens
the link-details screen; and a **spam-protection settings screen**, which is where S03's "block the
header" mistake is made concrete.

| Scene | Disposition | Decision home | Interaction it adds |
| --- | --- | --- | --- |
| S01 Bank KYC Suspension | malicious | a mobile KYC page in the browser | the first scene to turn on the **registered sender ID**: the message came from a ten-digit mobile, and a year of the real bank's alerts from `BK-UNIONX` sits one tab away in the same app; the link card shows the short form and the link-details screen expands it |
| S02 Electricity Disconnect Tonight | malicious | **the call itself** | no address anywhere — only ten digits and a missing consumer number; tapping the number raises the phone's dial dialog and connecting is navigation, so the scored decisions are the operator's two asks (install, pay) and ending the call |
| S03 Matching Debit Alert | **legitimate** | the banking app's transaction card | the evidence is the **thread's own history** — a year of identical alerts from the same header, none with a link — and the priced mistake is blocking a registered sender, whose cost the phone's spam-protection screen spells out |
| S04 Unpaid E-Challan Link | malicious | a fake challan page | the tell is a **detail that does not match**: the registration quoted is one character off the learner's, with no challan number and no photograph reference, and the portal they open themselves finds neither registration |
| S05 Parcel Address Fee | malicious | an address form, then a **mandate** on the payment sheet | the sender sets its own **display name** over an unsaved mobile, and the twenty-rupee "fee" is an autopay mandate whose own rows read "up to INR 20,000 per month, until cancelled" |

`sceneModel.test.js` asserts the five branch shapes are distinct from one another and from all
seventy-five earlier scenes, that each has a decision home no other SMS scene shares, that every scene
opens on the message list with a Spam category, that S02 carries no address at all, that S03 alone
offers `reject_ignore`, that exactly S01/S04/S05 have form fields, and that **every scored branch
surface is reachable without spending the branch** — the rule IMMERSIVE-009 found by hand-play,
applied to this batch from the start.

**Adding an SMS scene** (S01–S15 are authored; S16–S25 stay generic):

1. Write `scenes/sms/sNN.js`; read through `sms/shared.js`; scored controls get neutral ids
   `sNN-c01…` and **no** `intent`/`source` (SECURITY-001); put the open-the-thread control first at
   the list stage.
2. Add each control's `{ stage, intent, name }` to `backend/data/learner-actions/v1/sms.json`.
   `loadActionMaps`, `frontend/src/test/actionMap.js` and `backend/tests/{sceneAffordance,learnerAction}.test.js`
   already read the `sms` platform.
3. Register it in `sceneRegistry.js`.
4. `sceneModel.test.js`, `SceneContainment.test.jsx` and `backend/tests/sceneAffordance.test.js` pick
   it up automatically; add the scenario's own integration test to the batch's page suite
   (`SceneScenariosSms.test.jsx` for S01–S05, `SceneScenariosSmsB.test.jsx` for S06–S10,
   `SceneScenariosSmsC.test.jsx` for S11–S15).
5. Write the batch's research record and add it to `BATCHES` in `sceneResearch.test.js`.

| Suite (IMMERSIVE-010) | Result |
| --- | --- |
| `frontend/src/pages/SceneScenariosSms.test.jsx` (new) | 35: the message list and categories for each; no messenger chrome anywhere; S01 notify→resolve and its link-details screen; S02's dial dialog and the operator's asks; S03's year of thread and the spam-protection screen; S04's two registrations; S05's mandate rows; DOM vocabulary; remount recovery |
| `frontend/src/simulation/sceneModel.test.js` | 1718 (from 1613); the SMS S01–S05 distinctness block |
| `frontend/src/simulation/sceneResearch.test.js` | 197 (from 185): the SMS record |
| `SceneContainment.test.jsx` | 397 (from 332) — picked the five scenes up automatically |
| `backend/tests/sceneAffordance.test.js` | 164 (from 147): S01–S05 legality, safe paths, pinned pairs, review walks |
| `backend/tests/smsS01S05Engine.test.js` (new, needs an isolated replica-set DB) | 6: fifteen routes through the real engine over a real MongoDB transaction |
| `backend/tests/learnerAction.test.js` | map now holds 1,605 scene controls (1,037 + 472 Email + 96 SMS) |

**Validated in the browser (20 September 2026)** against an isolated API on `localhost:5055`, an
isolated database and the **production build** on `localhost:5199`: S04 hand-played safe (10/10), S05
hand-played unsafe through the mandate sheet (0/10, with the typed UPI PIN proven absent from the wire
and from the whole database), S02 hand-played safe **at 320 px** (10/10); all nineteen safe and unsafe
routes for S01–S05 additionally played through the real public HTTP API and scoring exactly as pinned;
eleven refusal cases over HTTP; reload mid-scene resumed at the same run and stage behind a Resume
banner with the pushed call surface correctly *not* restored. **375 px and 320 px: no horizontal page
overflow on any reachable screen**, no control under 24 px and none without an accessible name. Only
`localhost:5199` and `localhost:5055` were ever contacted.

---

## 21. SMS (IMMERSIVE-011) — S06–S10, the second SMS batch

Five more SMS scenes on the **same** layer, the same app and the same contract. Nothing new was built
for them except one anchor: `anchor: 'spam'` puts a scored control in the Messages app's own
unsaved-sender bar, a place `SmsScene` already drew and no scene had used. No engine, scoring, timer,
selection, result, review, bank or backend **source** changed; `backend/data/learner-actions/v1/sms.json`
grew from 96 controls to **194**.

| Scene | Disposition | Decision home | Interaction it adds |
| --- | --- | --- | --- |
| S06 Service-Number Confirmation *(military)* | malicious | **the composer and the phone's photo picker** | the first scene in eighty-five whose only attack surface is the reply field: an identity chip and an MMS photograph, with no address, no attachment inbound and no page anywhere. The unit's own registered sender ID `VM-FALCON` and its four "it is in the portal" messages sit one tab away |
| S07 Expected Recharge Confirmation | **legitimate** | the provider app, against a **searched-for care number** | the second legitimate SMS control, and deliberately not S03: the priced moves are **deleting the receipt**, replying to a sender ID that cannot receive replies, and ringing the first result of a web search — two paid aggregator listings that print the same unrelated number |
| S08 Lottery Claim Text | malicious | a claim page: identity first, the 499 second | **dual-SIM delivery** — the identical text on both numbers in the same second — plus four of the same sentence already in the phone's own spam folder. The safe branch is taken from the unsaved-sender bar; the two pages of the claim site each link to the other, so neither release hides behind the other |
| S09 Wrong Number Becomes an Investment Pitch | malicious | the composer, and a payment sheet raised by the desk | the first scene whose evidence is **the learner's own replies**: three blue bubbles across six days, counted and attributed on a "six days, in order" page. The deposit sheet pays a named individual, not the platform |
| S10 eSIM Upgrade OTP | malicious | **the carrier's own conversation**, and the dial confirmation | the only scene in the product whose branch controls sit on an `SMS`-kind surface. The code arrives from `VM-NOVCEL` two minutes later saying DO NOT SHARE and naming the eSIM transfer it authorises; reading it out and replying YES are both taken on that screen, and ringing the number is the cheaper mistake taken on the phone's dial dialog |

`sceneModel.test.js` asserts the five branch shapes are distinct from one another and from all eighty
earlier scenes, that **all ten** SMS scenes have decision homes no other SMS scene shares, that S07
alone among the five offers `reject_ignore`, that exactly S08 and S09 have form fields, that S06 names
no rank, formation or operational term and never prints its own trigger word, and that **every scored
branch surface _and page_ is reachable without spending the branch** — widened this batch from
surfaces to pages, walking page links, in-page list rows and each page's own local Continue.

| Suite (IMMERSIVE-011) | Result |
| --- | --- |
| `frontend/src/pages/SceneScenariosSmsB.test.jsx` (new) | 52: six stages for S06 and S10; the composer's two steps; the photo picker reached without spending the branch; S07's gateway number and paid listings; S08's dual-SIM rows, spam folder and both pages of the claim site; S09's own replies and the six-days page; S10's carrier thread with both releases on it; typed values absent from the wire; duplicate replay; stale resync; wrong-stage refusal; local navigation recording nothing; DOM vocabulary; keyboard operation |
| `frontend/src/simulation/sceneModel.test.js` | 1825 (from 1808); the SMS S06–S10 distinctness block and the page-level reachability walk |
| `frontend/src/simulation/sceneResearch.test.js` | 209 (from 208): the S06–S10 record |
| `SceneContainment.test.jsx` | 341 — picked the five scenes up automatically |
| `backend/tests/sceneAffordance.test.js` | 160 (from 154): S06–S10 legality, safe paths, pinned pairs, review walks |
| `backend/tests/smsS06S10Engine.test.js` (new, needs an isolated replica-set DB) | 7: twenty-two routes through the real engine over a real MongoDB transaction, plus a ledger scan for typed values |
| `backend/tests/learnerAction.test.js` | map now holds 1,703 scene controls (1,037 + 472 Email + 194 SMS) |

**Validated in the browser (20 September 2026)** against an isolated API on `localhost:5055`, the
isolated database `cyber_awareness_imm011_sms` and the **production build** on `localhost:4173`. All
ten routes — a safe and an unsafe play of every one of S06–S10 — were hand-played through the real UI:
five safe runs scored **10/10** and five unsafe runs **0/10**, each verified in MongoDB. Every `−8` was
reached by clicking through the UI with the branch unspent. Reload from a pushed browser surface
rebuilt the run at its committed stage with nothing replayed; duplicate, stale, wrong-stage, cross-run,
tampered-code, forbidden-`intent` and unknown-metadata requests were all refused as designed. 375 px
and 320 px showed **no horizontal page overflow**, every control had an accessible name, the smallest
target was 40 px, and a walk of the live React fiber tree (400 nodes) found no `intent`, `source`,
`verifySource` or `eventCode` prop. Only `localhost:4173` and `localhost:5055` were ever contacted.

## 22. SMS (IMMERSIVE-012) — S11–S15, the third SMS batch

Five more SMS scenes on the same app, surfaces and contract. **No new surface kind, component,
anchor, intent or renderer change** — every screen is built from existing vocabulary. No engine,
scoring, timer, selection, result, review, bank or backend **source** changed;
`backend/data/learner-actions/v1/sms.json` grew from 194 controls to **289**.

| Scene | Disposition | Decision home | Interaction it adds |
| --- | --- | --- | --- |
| S11 Expected Clinic Reminder | **legitimate** | **the composer's quick replies**, and the menu | the first SMS scene whose correct act is a reply ("1", from a saved, portal-listed reminder line); the priced mistake is the same reply with health details added (`−4`); delete-and-block is the needless rejection (`−2`) |
| S12 Income-Tax Refund Form | malicious | **the phone's link-details screen**, and a two-page refund site | a *registered* header in the **Promotional** category, filed under Offers; the department's own Government header already said "no refund is due". The scored open sits on the link-details screen |
| S13 Rating-Task Recruiter | malicious | **a one-tap suggested reply**, the details screen, a payout page and a payment sheet | one signature across **three rotating numbers**, listed on the details screen where the safe branch is taken; a pre-ticked onboarding checklist and a deposit to an individual |
| S14 Emergency Recall Location Link *(military)* | malicious | the link card, **the browser's own location-permission prompt**, and a recall form | a genuine earlier recall exercise (`RC-0812`) to compare against; release by granting a web page the device's location |
| S15 Canteen Subsidy MMS QR *(military)* | malicious | **the picture viewer**, a card-linking page, and a reply to all | a **group MMS** whose recipient list shows eight consecutive numbers; the viewer names the code's host before opening; the `−8` is a canteen card PIN |

`sceneModel.test.js` asserts the five branch shapes are distinct from all eighty-five earlier scenes
and from each other, that **all fifteen** SMS scenes have unique decision homes, that every scored
branch surface **and page** is reachable without spending the branch (now a reusable walk), that only
S11 offers `reject_ignore`, the exact field list of each scene with PINs/codes masked, and that S14
and S15 name no rank or operational term and none of the scenes prints its own trigger words.

| Suite (IMMERSIVE-012) | Result |
| --- | --- |
| `frontend/src/pages/SceneScenariosSmsC.test.jsx` (new) | 50: six stages for S11, S14 and S15; S11's reply and overshare; S12's category and link-details open; every release reached with the branch unspent; typed values absent from the wire; lost-response replay; remount; pushed surface not restored; stale; wrong stage; local navigation recording nothing; DOM vocabulary; names; keyboard |
| `frontend/src/simulation/sceneModel.test.js` | 1933 |
| `frontend/src/simulation/sceneResearch.test.js` | 221 (from 209) |
| `SceneContainment.test.jsx` | 361 (from 341) |
| `backend/tests/sceneAffordance.test.js` | 167 (from 160) |
| `backend/tests/smsS11S15Engine.test.js` (new, isolated replica-set DB) | 7: twenty-one routes through the real engine and transaction |
| `backend/tests/learnerAction.test.js` | 1,798 scene controls (1,037 + 472 Email + 289 SMS) |

**Validated in the browser (21 September 2026)** against the production build on `localhost:4173`,
an isolated API on `localhost:5055` and the isolated database `cyber_awareness_imm012_sms`: all ten
routes hand-played through the UI and read back from MongoDB (safe 10/10 each; S11 overshare 3; the
four `−8` releases 0). Reload from S14's pushed prompt resumed with nothing replayed; the full refusal
set held; 375 px and 320 px showed zero overflowing elements; a 395-node fiber walk and a DOM scan
found no canonical vocabulary; only localhost was contacted. Details: `PROJECT_MASTER_PLAN.md` §16.34.

## 23. SMS (IMMERSIVE-013) — S16–S20, the fourth SMS batch

Five more SMS scenes on the same app, surfaces and contract. **No new surface kind, component, anchor or
intent.** One shared renderer fix: `CallSurface` now keeps live captions in a fixed-height, focusable,
self-scrolling log, because hand-play showed arriving captions moving a call's scored controls under the
pointer. No engine, scoring, timer, selection, result, review, bank or backend **source** changed;
`backend/data/learner-actions/v1/sms.json` grew from 289 controls to **384**.

| Scene | Disposition | Decision home | Interaction it adds |
| --- | --- | --- | --- |
| S16 Learner-Initiated Login Code | **legitimate** | **another app** (Training Portal) and the message | origin-bound code line; the keyboard's "From Messages" fill is the correct use; forwarding the code is priced; cancelling the sign-in is the needless rejection |
| S17 New-Phone Family Emergency | malicious | a saved contact's thread, the suggested reply "Done", the composer, the payment sheet | Unknown/Known senders; a **Delivered** report on the saved thread; payee is an individual |
| S18 Bank Header Thread Hijack | malicious | the call confirmation, **a call that rings**, the menu | text inside the genuine registered bank thread; a real payee OTP arrives during the call; Hang up is the safe branch |
| S19 Network Survey Requests IMEI *(military)* | malicious | survey form, **Messages attach-location sheet**, composer, unsaved-sender bar | `*#06#` identifier screen; three identifiers produced by the phone itself |
| S20 Parcel Text Plus Callback | malicious | **OS installer and screen-share consent**, the number in the text, the menu | one number, two stories, the learner's own delivered reply between them |

`sceneModel.test.js` asserts the five branch shapes are distinct from all ninety earlier scenes and from
each other, that **all twenty** SMS scenes have unique decision homes, that the five safe branches sit in
five different places, and that every scored surface **and page** is reachable with the branch unspent.

| Suite (IMMERSIVE-013) | Result |
| --- | --- |
| `frontend/src/pages/SceneScenariosSmsD.test.jsx` (new) | 52 |
| `frontend/src/simulation/sceneModel.test.js` | 2,042 |
| `frontend/src/simulation/sceneResearch.test.js` | 233 |
| frontend total | 3,723 / 3,723 |
| `backend/tests/sceneAffordance.test.js` | 176 |
| `backend/tests/smsS16S20Engine.test.js` (new, isolated replica-set DB) | 14 |
| `backend/tests/learnerAction.test.js` | 1,893 scene controls |
| backend total | 1,021 / 1,021 |

**Validated in the browser (21 September 2026)**: all five safe routes 10/10, critical routes as pinned,
MongoDB persistence confirmed, 375/320 px without overflow, localhost only. Details:
`PROJECT_MASTER_PLAN.md` §16.36.

## 24. SMS (IMMERSIVE-014) — S21–S25, the fifth and final SMS batch

Five more SMS scenes on the same app, surfaces and contract. **No new surface kind, component, anchor or
intent.** One additive navigation option, `closes: 'all'` (§4.2), handled in `SimulationPage` as
`nav.reset()`; `closes: true` is unchanged for every other scene. No engine, scoring, timer, selection,
result, review, bank or backend **source** changed; `backend/data/learner-actions/v1/sms.json` grew from
384 controls to **477** (total scene controls 1,893 → **1,986**).

| Scene | Disposition | Decision home | Interaction it adds |
| --- | --- | --- | --- |
| S21 Matching New-Login Alert | **legitimate** | **the portal app's session list** and **the Spam folder page** | sent/delivered times in message details (airplane mode); keeping DEV-204 is the correct use, ending the session the needless rejection, the Spam text's address the unsafe external act |
| S22 Synthetic Voice-Mail Link *(military)* | malicious | the voice portal's sign-in page, **the recording's transcript viewer**, the menu | the phone's own **Voicemail** (empty); sign-in −8, call-back from the recording −3 |
| S23 UPI Refund Collect Request | malicious | **the payment app's notification** (Decline), the collect payment sheet, the composer | direction shown on every screen: "is requesting", PAY, "Money leaves your account" |
| S24 Fake Cybercrime Case Fee | malicious | **the notice itself** (keep the texts), the officer's number card, the fee sheet, **the phone's file picker** | four texts in two minutes, a countdown portal, a secrecy order; preservation is the safe act |
| S25 FASTag Update APK | malicious | **Files** (delete), the install warning, the link card | the app arrives as an **MMS attachment**; the warning names the default-SMS-app role |

`sceneModel.test.js` asserts the five branch shapes are distinct from all ninety-five earlier scenes and
from each other, that **all twenty-five** SMS scenes have unique decision homes, that the five safe
branches sit in five different places, that every list's category set is new, and that every scored
surface **and page** is reachable with the branch unspent.

| Suite (IMMERSIVE-014) | Result |
| --- | --- |
| `frontend/src/pages/SceneScenariosSmsE.test.jsx` (new) | 55 |
| `frontend/src/simulation/sceneModel.test.js` | 2,150 |
| `frontend/src/simulation/sceneResearch.test.js` | 245 |
| frontend total | 3,918 / 3,918 |
| `backend/tests/sceneAffordance.test.js` | 185 |
| `backend/tests/smsS21S25Engine.test.js` (new, isolated replica-set DB) | 16 |
| `backend/tests/learnerAction.test.js` | 1,986 scene controls, 100 mapped scenarios |
| backend total | 1,052 / 1,052 |

**Validated in the browser (22 September 2026)**: all five safe routes 10/10, every critical route and
the secondary unsafe routes as pinned, MongoDB persistence confirmed, reload resumes in place, 375/320 px
without overflow, localhost only. Details: `PROJECT_MASTER_PLAN.md` §16.37.
