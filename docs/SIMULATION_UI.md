# Candidate Simulation UI (UI-001 · UI-002 · UI-003)

**Status:** IMPLEMENTED — UI-001 and UI-002 5 September 2026, UI-003 polish and result
integration 6 September 2026.
**Entry point:** `frontend/src/pages/SimulationPage.jsx` at `/assessment`
**Controller:** `frontend/src/hooks/useAttemptController.js` · **State:** `frontend/src/state/attemptMachine.js`
**Device shell:** `frontend/src/components/simulation/{DeviceFrame,PhoneShell,PhoneHome}.jsx`
**Result screen:** `frontend/src/pages/ResultPage.jsx` + `frontend/src/components/result/`
**Companions:** [`ATTEMPT_API.md`](ATTEMPT_API.md) · [`SCENARIO_ENGINE.md`](SCENARIO_ENGINE.md) · [`SYNTHETIC_CONTENT_SCHEMA.md`](SYNTHETIC_CONTENT_SCHEMA.md) · [`RESULT_API.md`](RESULT_API.md) · [`SCENE_INTERACTION_LAYER.md`](SCENE_INTERACTION_LAYER.md)

---

> **IMMERSIVE-003A, rebuilt by IMMERSIVE-003A-R2 (10 September 2026) — read this first for
> W01–W05.**
>
> Five WhatsApp scenarios no longer play through the action sheet. They have an authored
> **scene**: the learner opens a chat list among ordinary conversations, taps one to read
> it, taps the chat header for contact or group info and switches tabs inside it, follows a
> link into the offline browser, **fills the page in**, walks its pages and comes back,
> approves or declines a payment on a sheet with a PIN, opens a **different application**
> on the same phone, votes in an in-app poll, calls a saved number, picks a reply into the
> composer and sends it, and finishes with the app's own Report and Block controls.
>
> Everything in this document still applies to them — the same controller, the same intents,
> the same engine, the same recovery — but the CONTROLS live on the device rather than in
> the panel, and the panel keeps a collapsed twin of them.
>
> **R2 loosened exactly one containment rule and no others.** A simulated page may now carry
> real inputs, because declining to hand over a card number is only a decision if handing it
> over was possible. What is typed lives in the component that draws the field, is discarded
> when the learner leaves the screen, and never reaches an intent, metadata, storage, a log,
> an export or the network. See `frontend/src/simulation/localForm.js` and
> [`SCENE_INTERACTION_LAYER.md`](SCENE_INTERACTION_LAYER.md) §8.
>
> Scope: **W01, W02, W03, W04, W05 only.** The other ninety-five scenarios and the other
> three platforms render exactly as described below, unchanged. See
> [`SCENE_INTERACTION_LAYER.md`](SCENE_INTERACTION_LAYER.md) for the scene model, how the
> stages map onto app controls, and how to add the next batch, and
> [`WHATSAPP_W01_W05_REAL_WORLD_RESEARCH.md`](WHATSAPP_W01_W05_REAL_WORLD_RESEARCH.md) for
> the threat research and story reconstruction behind the five.

## 1. What this layer is

The candidate half of the client specification's sections 3 and 4, built on the API-001
attempt lifecycle. It renders the run the engine says is current, submits the intent the
learner chose, and re-renders whatever the engine committed.

```
SimulationPage  →  useAttemptController  →  attemptApi  →  /api/attempts/*
      ↑                    ↓
   components         attemptMachine   (pure reducer; records committed responses only)
```

**There is no client-side stage, score, scenario order or notion of a correct action.**
The reducer has no action that can advance a stage on its own — every stage change comes
from a server response — which is the property the rest of this document depends on.

## 2. Screen structure (UI-002)

```
TrainingRail        persistent, outside the device: TRAINING SIMULATION - OFFLINE,
                    local clock, sound state, connection-off indicator
AttemptHeader       Scenario n/10, elapsed time, segmented progress, learner chip
                    (masked service number) with history / accessibility / logout
main ├─ left   PhoneShell
     │           DeviceFrame  body, bezel, island, status bar, home indicator
     │             PhoneHome        stage 1: app grid, badge, notification banner
     │             PlatformRenderer stages 2-6: WhatsApp / Instagram / SMS / Email
     │             SceneSurface     pushed (W01-W05): contact / group info with tabs,
     │                              in-app settings, the offline browser with forms,
     │                              a second application, a payment sheet, a call
     │             SurfaceScreen    pushed (the other 95): browser, file, QR, call,
     │                              payment, install
     │             sheets           sender details, trusted directory (in-device dialogs)
     └─ right  TrainingPanel  stage, instruction, six-stage strip, then either the
                              on-device hint (stage 1), the action sheet, or the outcome
```

**UI-003 gave the device the visual lead.** The workspace is a centred `max-w-4xl` grid of
`25rem` (device) and `22rem` (panel), so the training surface supports the phone instead of
competing with it. The stage strip now names all six stages — using a `short` label, since
"New activity" truncated — and marks the current one with weight and thickness as well as
colour, with the position also stated in text for screen readers.

**UI-002 moved the simulation onto a device.** UI-001 drew the notify stage as web cards
beside a plain framed viewport; the specification puts it on a phone, so the app grid, the
notification, the local surfaces and the sheets all now live inside `DeviceFrame` and are
clipped to its screen.

`DeviceFrame` is `max-w-[390px]` with a screen of `h-[min(844px,74dvh)]` — 390 x 844 is
the target, not a floor, so a narrow window or 200% zoom shrinks the device instead of
forcing the page sideways. The device body, bezel, island, status bar and home indicator
are CSS and the project's existing icon set: **no image, no external asset, and nothing
copied from a specific vendor's design language.**

> **Email is now shown on the device, not full width.** The specification permits an
> optional full-width email view and UI-001 used it. UI-002 prefers the device, because
> the point of this phase is that the learner reads a message on a phone; the mobile email
> client stays legible at 390px, and the option remains available if a future scenario
> needs it.

## 3. The six stages

| Stage | Device shows | Controls offered |
|---|---|---|
| 1 notify | Home screen, badged app, notification banner | Open · Dismiss (**on the device**) |
| 2 open | Platform renderer, thread | Read the message · the scenario's own premature actions |
| 3 inspect | Platform renderer | Sender / profile / link / file / QR / thread · decide without checking |
| 4 branch | Platform renderer | Decline · Reply · Send the details · plus one control per risky asset |
| 5 verify | Renderer + consequence panel | Trusted directory · number I hold · official app · **contact from the message** · Report · Block |
| 6 resolve | Renderer | Report · Block · Continue · Retain · Ignore, with the optional rationale |

Dismissing the banner submits `dismiss`, logs the event and **keeps the scenario**: the app
badge stays and the item is still openable, exactly as section 3 requires — UI-002 changed
where those controls live, never what they mean.

Opening a different app shows a benign empty inbox with a Back control and submits nothing.
No app is ever marked as the correct one.

### Local device navigation

`PhoneShell` owns a small local stack and **never advances the attempt**:

```
notification -> app -> conversation -> [browser | file | QR | call | payment | install] -> Back -> conversation
```

The base screen is chosen by the engine's stage. A surface is pushed when the engine
returns a `consequence` — a rendering instruction it already committed — and **Back is
pure navigation**: it submits nothing and retracts nothing. All of it is React state; no
`window.open`, no `href`, no history entry, no host handler.

## 4. Which controls appear, and why none of them looks safe

`actionsFor(stage, scenario)` in `constants/simulation.js` derives the controls from the
scenario's **own synthetic assets**: a `browser_page` produces "Open the link", a
`payment_screen` produces "Make the payment", and a scenario with neither shows neither.

Every decision-stage control gets the same variant, the same weight and the same order.
Nothing is disabled to steer — the specification says to avoid disabling the wrong option,
so controls are disabled only while a submission is in flight. The frontend never knows
which action is safe, and could not signal it if it wanted to.

> ### One intent is deliberately not offered: `branch: reject_ignore`
>
> The engine accepts it only on the **twenty legitimate** scenarios — the eighty malicious
> ones do not declare `NEEDLESS_REJECT_IGNORE` at the branch stage, so it is rejected
> there. Offering the control on every scenario would let a learner read the disposition
> off whether the button worked: a reliable oracle for the one fact this surface must
> never reveal.
>
> "Ignore it and move on" is offered at **resolve** instead, where `resolve_ignore` is
> accepted on all one hundred and the same behaviour is still scored. This is a UI
> decision; no backend behaviour was changed. Recorded as a limitation in §10.

## 5. Renderers

The four FE-008..FE-011 renderers are reused **unchanged**. DATA-003 emitted message
threads in the block vocabulary they already speak (`message`, `note`, `emailHeader`,
`emailBody`, `linkPreview`, `attachment`, `listItem`), so the only new code is the adapter
in `utils/syntheticScreen.js`. `GenericRenderer` remains the fallback.

They are given **no actions**: nothing inside a simulated app can submit an intent by
itself. Every scoreable control is either the notification's own Open/Dismiss or lives in
the training panel, where the engine's stage decides what is available.

UI-002 added only scroll containment to them (`overscroll-contain`), so a scroll that
reaches the end of a conversation stops at the device instead of chaining to the page.

## 6. Local primitives

`components/simulation/LocalSurfaces.jsx` — one file, because they are one idea: an inert
local surface rendered from a synthetic asset.

| Primitive | What it shows | What it cannot do |
|---|---|---|
| Safe browser | Reserved `*.training.example` address as read-only text, page copy | No `href`, no navigation, no request |
| File viewer | Name, type, size, description | No execution, extraction, mount or host handler |
| QR inspector | The locally decoded target | No camera, no host clipboard |
| Call screen | Caller, timer, captions | No microphone, camera or dialer |
| Payment screen | Payee, amount, reference | No payment, no card data |
| Install prompt | App name, requested permissions | No install, no permission grant |

There is no `href`, `src`, `fetch`, `window.open`, media device or host handler anywhere in
the file. The engine has already recorded what the learner did; these only show what they
would have seen.

**Trusted directory** (`TrustedDirectory.jsx`) is the one with a hard containment rule:
results come only from the scenario's `trusted_directory_entry` assets, and the search box
filters that list. Typing cannot create an entry and the message's contact details are
never searched or matched. The sender is shown for comparison in a separate panel labelled
"Details taken from the message — this is not a directory entry and has no source."

## 7. Recovery and idempotency

| Situation | Behaviour |
|---|---|
| Reload / reopen | `GET /attempts/current` then `/current-run`. Nothing authoritative is read from storage |
| `409 STALE_STATE` | Refetch the current run and let the learner choose again. **Never replays the action** |
| Duplicate | The server's replayed outcome is shown with "already recorded"; nothing is counted twice |
| Lost response | Recoverable inline. The engine commits before it answers, so the retry reuses the same `intent_key` and replays |
| `401` | Session cleared, back to login |
| Refused intent | Inline notice; the stage and the attempt are untouched |
| Attempt already complete | Result screen; the simulation never restarts it |

One `intent_key` is generated per `(run, stage, intent)` and reused across retries, so a
retried action can never score twice. There is **no optimistic update**: nothing on screen
changes until the response arrives, so the UI cannot show an action as done that the server
refused.

## 8. What the candidate surface never shows

Attack family, canonical family, trigger taxonomy, canonical triggers, difficulty,
disposition, evaluation, expected safe behaviour, scoring configuration, the selection seed
and answer-bearing learner flow are absent from the DOM, from props, from data attributes,
from `window`, from storage and from URLs — because the candidate-safe API never sends
them, and nothing here derives them.

The service number is masked to its last four characters at render
(`utils/maskIdentifier.js`). Per-scenario points exist on the wire once a run resolves, but
section 3 hides the running score in assessment mode, so **the mode decides**, not the
payload: `scoreVisible` requires `mode === 'training'`.

## 8a. Motion

Five short CSS animations — a screen sliding in, a notification banner settling, a sheet
rising, plus the existing fades. Every one is a **class**, never an inline style and never
a JS animation loop, so the global `prefers-reduced-motion` guard in `styles/index.css`
collapses all of them; a test asserts the device animates only through classes, which is
what makes that guard sufficient.

No animation gates a request. The controller submits immediately and the UI re-renders
when the server answers, so motion can never delay or reorder an authoritative call.

## 9. Accessibility

Keyboard-only operation, a visible focus ring (global `:focus-visible`, 2px), logical focus
order, accessible names on every control, `role="status"` announcements for stage changes
and outcomes, and a real focus trap in `components/ui/Modal.jsx` — focus moves in on open,
Tab cycles inside, Escape closes, and focus is restored on close.

> **Focus restoration has a fallback, and it is load-bearing.** An overlay opens only after
> the engine has accepted the intent, so the control that opened it has usually been
> re-rendered away by the stage change. `restoreFocus` therefore treats `<body>` as no
> target, checks that focus actually landed, and otherwise sends it to `<main>` rather than
> stranding a keyboard user at the top of the document.

No meaning is carried by colour alone: progress segments differ in fill **and** border, and
the strip is summarised in text. Touch targets are `min-h-11` (44px). At 640px — 200% zoom
of a 1280px desktop — the device scales, the training panel moves below it, and there is no
horizontal overflow (measured in the browser: `scrollWidth === clientWidth === 640`).

**The device is not a keyboard trap.** Every control on it is a real `<button>` with an
accessible name, the in-device sheets keep `role="dialog"` with the focus trap UI-001
built, and the pushed surfaces expose a named Back control. The status bar's icons are
decorative and carry a single screen-reader sentence instead.

## 10. Known limitations

- **`branch: reject_ignore` is not offered** (§4). The behaviour is still scored at resolve.
- **`approve_device_link` and `share_location` are not offered.** No synthetic asset kind
  backs them, so there is nothing content-driven to attach them to.
- **Per-scenario feedback is not shown.** The candidate contract carries the final action
  and the points, and nothing else; observed cues, the preferred action and the disposition
  are server-only. The outcome card shows exactly what is available.
- **The result screen is minimal** — total, per-scenario points, platform and final action.
  The behaviour breakdown, path replay and remediation are RESULT-001.
- **The notification tray holds one live scenario.** The engine issues one run at a time,
  so the three-deep queue the specification allows never fills.
- **No horizontal-overflow assertion in the unit suite.** jsdom has no layout engine, so
  the test asserts the sizing contract (fluid width, a maximum, no `w-screen`) and the
  pixel check is done in the browser instead.
- **The device is a generic handset.** No vendor's proprietary design language, wallpaper
  or iconography is reproduced.
- **Instructor restart and the simulation-issue report are not built.** Both are admin
  surfaces, out of scope here.

## 11. Testing

`npm test` in `frontend/` — **67 tests, 4 files, no server and no database.**

- `state/attemptMachine.test.js` (16) — the reducer and selectors: the stage is never
  local, a stale state never replays, a duplicate is never counted twice, the ordinal
  survives a response that omits it, and the score stays hidden in assessment mode.
- `pages/SimulationPage.test.jsx` (25) — the whole screen through the real controller and
  the real `attemptApi` against a stubbed `fetch`. A fake server owns the stage and the
  ordinal, so a test can only move the UI forward by making the server accept an intent.
  **These passed unchanged through the UI-002 restructure**, apart from two assertions
  made more specific because the training panel now also names the scenario.
- `components/simulation/PhoneShell.test.jsx` (14) — device chrome, renderer selection and
  containment against the **real** DATA-003 files read from `backend/data/synthetic/v1/`,
  so a regeneration that introduced an external host or a working link fails here.
- `components/simulation/PhoneDevice.test.jsx` (12, new) — the device itself: status bar,
  clipped screen, scroll containment, the sizing contract, pushing and popping a surface,
  the benign empty app, the notification banner and its dismissed state, the busy state,
  the offline boundary, keyboard reachability and class-based motion.

## 11a. The result screen (UI-003)

`ResultPage` is a **pure presentation layer** over the RESULT-001 projection. It sums
nothing, classifies nothing and reconstructs no taxonomy: every number, label and outcome
class arrives ready to render, and `constants/result.js` only maps the server's stable
slugs to English. A slug with no entry falls back to itself rather than being hidden.

| Component | Renders |
|---|---|
| `ResultSummary` | Total /100, resolved count, the four outcome counts, the comparison |
| `BehaviourBreakdown` | Server buckets by app, case type, persuasion technique and decision stage |
| `ScenarioResultCard` | One scenario: score, outcome class, sender and preview; feedback and path on demand |
| `PathReplay` | `{ step, stage, action }` in the server's ledger order |
| `RemediationList` | Family-level practice areas with the count of active scenarios |

Three deliberate choices:

- **Feedback is collapsed by default.** Ten expanded cards would bury the summary above
  them, so each card is a labelled `aria-expanded` disclosure.
- **Scenarios are identified by what the learner saw** — sender and notification preview —
  never by the server-only authoring title.
- **Remediation is phrased about the material, not the person**: "area to strengthen", not
  "you are vulnerable to". A test asserts the section contains no trait vocabulary.

Bars always carry their value as text beside them, so nothing is communicated by length or
colour alone.

## 12. Browser verification (UI-002 · UI-003)

Walked end to end against the real backend on an isolated port: dashboard → start →
notification → open → inspect → branch → verify → resolve → next → completion → result
(78/100). All four platforms rendered on the device (**SMS, Instagram, Email, WhatsApp**),
a payment surface pushed and popped with Back, the sender sheet and trusted directory
opened as in-device dialogs with focus trapped, and a mid-attempt reload restored the
exact stage from the server with `localStorage` and `sessionStorage` both empty.

**UI-003 re-verification (6 September 2026).** A second full ten-scenario attempt scored
**82/100** and the new result screen rendered every block: the headline and outcome mix
(7 handled safely · 1 threat missed · 2 genuine items rejected · 0 unsafe steps), the
first-attempt comparison note, breakdowns by app / case type / persuasion technique /
decision stage, all ten scenario cards, expandable feedback with the six-step path replay,
and three practice recommendations. Recovery was re-checked mid-attempt: opening a browser
surface and pressing Back left the stage at Verify, and a reload restored Scenario 2 /
Verify from the server with both web storages empty.

Network: only `localhost` (app and local API); zero `img/iframe/embed/object/video/audio`
elements and zero external links in the live DOM, on both the simulation and the result
screen. At 640px the result page reflowed with `scrollWidth === clientWidth === 640`.
Accessibility spot-check on the result screen: 12 focusable elements, all real controls,
all named, 10 disclosures exposing `aria-expanded`, and a measured 3px focus ring. The
verification candidate and its data were deleted afterwards.

## 13. Known limitations

- **Feedback quality varies by scenario**, because it is the client's authored content
  rendered verbatim. On some scenarios `safe_action` is the generic stage-6 boilerplate
  ("Complete the resolution and return to the dashboard.") and `prevention_habit` repeats
  the single cue. That is a content property recorded in `RESULT_API.md`, not a UI defect,
  and inventing better text here is out of the question.
- **No practice mode.** Remediation names families and how many active scenarios exist; it
  does not link anywhere, because no practice workflow exists yet.
- **Comparison covers one previous attempt**, not a trend across many.
- **The no-horizontal-overflow check is a browser measurement**, not a unit assertion —
  jsdom has no layout engine.

## 14. Not in this task

Admin surfaces, an instructor dashboard, practice mode, Electron packaging and deployment
remain later tasks. The legacy 40-scenario journey is untouched and still reachable at
`/assessment/legacy`.

---

# 15. Dashboard activity orchestration (UI-004)

Specification section 3 in full: the persistent hub, the post-idle delivery window, the
toast tray, the four-tile app grid, the profile chip menu, the orchestrator status and the
support controls. Everything below sits **on top of** UI-001/UI-002 and changes no engine
contract: no new endpoint, no new event code, no backend file.

## 15.1 Where section 3 lives

`/assessment` — the simulation shell — not `/dashboard`. `/dashboard` remains the FE-007
launcher that starts an attempt. This is the reading ACCEPTANCE-001 recorded and it is
unchanged; the hub is the device home screen plus the panel beside it.

## 15.2 The delivery window

> "Deliver the next event 1-4 seconds after the dashboard becomes idle."

`deliveryDelayMs(runId)` is an FNV-1a hash of the run id mapped into `[1000, 4000]` ms.

- **Deterministic.** The same run always waits the same time, so a test asserts a number
  rather than tolerating a range, and implementation rule D — no `Math.random` in anything
  affecting assessment state — holds by construction. A test strips the comments from the
  module and asserts the string is absent from the code.
- **Carries no information.** A run id is a Mongo ObjectId allocated when the attempt was
  created; it knows nothing about the scenario behind it.
- **Owns nothing.** The engine materialises all ten runs at attempt creation and issues
  them by ordinal. The window decides only *when the notification for the run the server
  already gave us appears*. It cannot create, duplicate, reorder or select a scenario, and
  if the timer never fires the server state is untouched and a reload re-derives the hub.

A run is queued when it is at `notify` with `last_sequence === 0` — nothing in its ledger,
so nobody has seen it. That single test is also what stops a reload from delivering the
same alert twice.

## 15.3 One projection, so badge, toast and app list cannot disagree

Section 3 requires that "badge count, toast preview and app list must all reflect the same
scenario state". Rather than three components each remembering it, `dashboardOrchestrator`
is a pure module that turns one run into all three:

| Function | Produces |
|---|---|
| `activityStateFor` | `queued` · `delivered` · `engaged` · `resolved` · `complete` |
| `trayFor` | up to `MAX_TOASTS` (3) toast descriptors |
| `tilesFor` | always four tiles: `{ key, label, icon, unread, status, preview }` |
| `alertDismissed` | dismissal, read back out of the ledger position |
| `wasInterrupted` | whether this run was already under way when it was loaded |

No React, no timers, no fetch. `useActivityDelivery` is the only thing holding a timer.

## 15.4 The tray

Capped at three in `trayFor` **and** again in `NotificationTray`, so the limit is not one
caller's responsibility. The cap is real rather than decorative — it is applied to whatever
the scenario supplies — though the imported bank gives every scenario exactly **one**
notification asset, so in production the tray holds at most one. A unit test hands it five.

Opening a toast submits `open_item`: the same intent the badged tile submits. The toast is
a second route into one scenario, never a second scenario. Dismissing submits `dismiss`,
which the engine records as `notification_dismissed` and leaves at `notify` — the tray
clears, the badge and the preview stay, and the item is still waiting in its app.

## 15.5 The app grid

Four tiles, always all four, built from one component with one shape, so no platform can
acquire a field, a size or a preview another does not have. The tile carrying the live
scenario differs by exactly the three things section 3 asks for: unread badge, status dot
and last-event preview.

Status has two values and neither describes the item: `activity` ("something is waiting")
and `quiet` ("nothing new"). Meaning is never carried by the dot alone — each tile has a
screen-reader word, and the unread count is in the button's accessible name.

**While a run is queued no tile carries activity at all.** A badge that appeared before the
toast would let a learner discover where the next item is about to land, so the grid stays
uniformly quiet and a tile pressed during the window opens the benign empty app and submits
nothing. Opening the wrong app is local navigation throughout: an empty inbox, no intent.

### 15.5a The quiet app surfaces (CLIENT-POLISH-001)

That benign empty app used to be one grey box — a back arrow, the app's name and "Nothing new
in WhatsApp" — identical for all four platforms. The scenario renderers were always
app-specific, but a learner only meets those *inside* a scenario, so the four simulators were
invisible to anyone reviewing the hub. The client asked for "a glimpse of the individual
module simulators", appearing "similar to real-world applications", and this was the screen
that did not provide it.

`components/simulation/AppSurfaces.jsx` now draws each platform's own chrome around the same
empty state: WhatsApp's green bar and **Chats · Status · Calls** strip, Instagram's wordmark
header, story rail and bottom navigation, an inbox with **Primary / Social / Promotions**
categories, and the **Messages** list with its compose button.

**They remain entirely inert, and that is the point of the design.** Each surface exposes
exactly one real control — Back. There is no input, form, link, image, iframe or media
element anywhere in them; every icon row, tab strip, story rail and placeholder row is
`aria-hidden` decoration with no handler. Nothing sends, dials, navigates, uploads or fetches,
no external asset or URL is referenced, and the device still sits inside the persistent
TRAINING SIMULATION — OFFLINE rail, so a familiar surface is never mistakable for a live
application.

The empty state deliberately kept its original wording, "Nothing new in {app}." — it was
already the right thing to say, and it distinguishes an app that holds nothing from one that
failed to load.

## 15.6 Orchestrator status

Beside the device rather than on it, because it has to be reachable at every stage — a
learner who reloads at the branch stage is looking at the app, not the home screen.

- **Queued** → "New activity will arrive shortly".
- **After interruption** → a notice and a **Resume** button.

"Interruption" is derived, not remembered. A run already under way was either walked here
in this session or returned to; the difference is whether the engine has committed a
transition for this learner in this tab. Resume clears the notice **and re-reads
`/attempts/current` and `/current-run`** — after an interruption the reducer is the least
trustworthy thing on the page, so recovery starts at the API.

## 15.7 Profile chip menu and support

Section 3's chip menu in its stated order: attempt history, accessibility, restart
(instructor-controlled), logout.

**Restart explains; it does not act.** A learner cannot restart their own attempt — that is
an instructor control in section 6 — so the entry is present and honest about who owns it
rather than absent, or present-and-disabled with no way to enable it. No request of any
kind leaves the page.

Rules and Report a simulation issue are in the shell footer, so they are available at every
stage. The rules describe the **container** — synthetic content, the offline boundary, what
is recorded, that marks come at the end, how to operate it — and never the **content**: no
disposition, difficulty, attack family, expected action or point value. A test opens the
dialog mid-scenario and asserts those words are absent.

The simulation-issue panel states its separation from the scenario's Report control in
words rather than implying it by placement, because the two have opposite consequences. It
files nothing: an offline system has no outbound route, so it gives the learner the
scenario reference to quote and the local escalation path instead of a form that pretends.

## 15.8 What UI-004 did not touch

No backend file, no endpoint, no event code, no intent, no scoring, no selection, no
scenario content, no synthetic asset, no dependency. `notification_seen` /
`notification_dismissed` / `open_latency_ms` were already the section 4 vocabulary for this
stage and are still the only events the hub produces.

## 15.9 Known limitations

- **The three-toast tray is a guard, not a routinely exercised path.** Every scenario in
  the bank supplies one notification asset and the engine issues one run at a time.
- **Opening the wrong app is not written to the ledger.** Section 3 says "log navigation",
  but there is no event code in the section 4 vocabulary for app navigation and inventing
  one would change the closed event taxonomy. It is local navigation only.
- **The delivery window is per run, not per session.** Reloading during the window restarts
  it for that run — the same deterministic delay, so the item still arrives.
- **`immediate` feedback timing is still not enforced** (FEEDBACK-001), unchanged here.
