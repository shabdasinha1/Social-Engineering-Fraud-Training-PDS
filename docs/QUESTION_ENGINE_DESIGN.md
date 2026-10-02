# BE-000 — Question Engine Design

**Status:** design agreed. Implemented from BE-001 onwards.
**Amended:** 2 September 2026 — three decisions confirmed; see the changelog at the foot.
**Date:** 2 September 2026
**Companion document:** `../PROJECT_MASTER_PLAN.md`

Everything below is marked either **[CONFIRMED]** (already agreed and reflected in the
built frontend) or **[PROPOSED]** (needs sign-off before BE-001). Section 14 collects
every open decision in one list.

---

## 1. Architecture Overview

### 1.1 The product shape [CONFIRMED]

The scenario **pool** holds 40 scenarios: 10 WhatsApp, 10 Instagram, 10 SMS, 10 Email.
One candidate **assessment** is exactly **10 scenarios** drawn from the combined pool and
presented as a mixed sequence across channels. There are not four separate tests.

### 1.2 Who decides what [CONFIRMED]

The server is the source of truth. The browser is a renderer and an input device.

| Decision | Owner |
|---|---|
| Which scenarios are selected | Server |
| Sequence and ordering | Server |
| Which question is current | Server |
| Whether an answer is valid | Server |
| Marks awarded | Server |
| Timing | Server |
| Whether the assessment is complete | Server |
| Rendering the simulation | Client |
| Collecting the candidate's choices | Client |

The client never receives scoring keys, correct answers, EVI tags or author notes for a
question it has not yet answered.

### 1.3 Collections

```
candidates        one per person, holds the seen-scenario history
scenarios         the pool (40 today, designed to grow)
assessments       one per attempt, holds the frozen sequence and every answer
```

Three collections is enough for the MVP. Answers are embedded in the assessment rather
than given their own collection: they are always read with their parent, they are
bounded at 10 per document, and embedding keeps submission atomic.

### 1.4 Lifecycle

```
POST /assessments            -> server builds and freezes a 10-scenario sequence
GET  /current-question       -> server returns question N, stamps servedAt
POST /answers                -> server validates, scores, stores, advances
     (repeat to question 10)
POST /answers  (question 10) -> server marks COMPLETED, computes the result
GET  /result                 -> server returns score, bands, breakdown, EVI, feedback
```

---

## 2. Scenario Schema

The scenario is layered: metadata, then what the candidate sees, then what the
candidate is asked, then the hidden evaluation data.

```js
// models/Scenario.js
{
  scenarioCode: String,        // "WA-03" - stable human key, unique, used in logs
  channel: String,             // 'whatsapp' | 'instagram' | 'sms' | 'email'
  version: Number,             // bumped on any edit to published content
  isActive: Boolean,           // false removes it from selection, keeps history valid

  // --- what the candidate is told -------------------------------------
  title: String,               // "Review this conversation"
  instruction: String,         // optional one-line prompt above the frame

  // --- what the candidate sees ----------------------------------------
  simulation: {                // see section 3
    entryScreenId: String,
    screens: [Screen],
  },

  // --- what the candidate is asked ------------------------------------
  actionOptions: [{
    key: String,               // 'verify-official-number'
    label: String,             // shown to the candidate
    marks: Number,             // HIDDEN. -5 .. +5
    isCriticalFailure: Boolean // HIDDEN. shared an OTP, paid, gave credentials
  }],
  reasonOptions: [{
    key: String,
    label: String,
    marks: Number              // HIDDEN. 0 .. 2
  }],

  // --- hidden evaluation data -----------------------------------------
  evaluation: {
    correctJudgement: String,  // see section 11.1 on the judgement scale
    isFraudulent: Boolean,     // drives the 7/3 legitimacy mix in selection
    fraudTheme: String,        // 'otp-misdirection', 'lottery', 'honey-trap' ...
    eviTags: [String],         // see section 12
    warningSigns: [String],    // shown only in post-answer feedback
    feedback: String,          // plain-language explanation, shown after answering
    authorNotes: String        // internal only, never leaves the server
  },

  createdAt, updatedAt
}
```

**Indexes:** `{ scenarioCode: 1 }` unique; `{ isActive: 1, channel: 1, 'evaluation.isFraudulent': 1 }`
for selection queries.

**Versioning [PROPOSED].** A published scenario is treated as immutable: editing content
bumps `version`. An assessment stores the `version` it served, so a result can always be
explained against the exact text the candidate saw. This follows the Developer Brief's
immutable-published-scenario rule.

### 2.1 Candidate-facing projection

The API never returns the scenario document. It returns this:

```js
{
  id, channel, title, instruction, simulation,
  actionOptions: [{ key, label }],   // marks stripped
  reasonOptions: [{ key, label }]    // marks stripped
}
```

`evaluation` is removed in its entirety. This is enforced in one place — a
`toCandidateJSON()` method on the model — so no controller can leak it by forgetting.

---

## 3. Interactive Phone Simulation Model

One generic structure serves all four channels. The renderer for a channel is a
presentation concern; the data shape does not change.

A simulation is a small **screen graph**: named screens, each holding typed content
blocks and navigation actions.

```js
Screen = {
  id: String,                  // 'chat-list', 'thread-rakesh', 'attachment-invoice'
  kind: String,                // 'list' | 'thread' | 'inbox' | 'message' | 'feed'
                               // | 'profile' | 'document'
  header: {
    title: String,             // "Rakesh Kumar" / "Inbox"
    subtitle: String,          // "online" / "12 unread"
    avatarSeed: String,        // deterministic placeholder avatar, no real photos
    showBack: Boolean
  },
  blocks: [Block],
  actions: [Action]
}

Block =                        // discriminated by `type`
  | { type: 'message',      from: 'them'|'me', text, time, status }
  | { type: 'listItem',     title, preview, time, unread, target }
  | { type: 'image',        caption, placeholder }   // no real image files
  | { type: 'linkPreview',  displayUrl, title, description }
  | { type: 'attachment',   fileName, fileSize, fileKind, target }
  | { type: 'emailHeader',  from, fromAddress, to, subject, time }
  | { type: 'emailBody',    paragraphs: [String] }
  | { type: 'post',         author, caption, likes, time }
  | { type: 'note',         text }                   // system line, e.g. "Yesterday"

Action = {
  id: String,
  label: String,               // "Open", "Back", "Download", "Pay now"
  target: String|null,         // screen id to navigate to, or null
  interaction: String|null     // 'open-link' | 'open-attachment' | 'enter-otp'
                               // | 'make-payment' | 'enter-credentials' | null
}
```

**Rules.**
- Every link is a *string that looks like a URL*. It is rendered as text. There is no
  `href`, no fetch, no navigation off the page. Nothing in a scenario can reach the
  network.
- `avatarSeed` produces a generated placeholder. No real photographs of real people.
- All names, numbers, organisations and addresses are fictional (Developer Brief rule).
- The renderer walks `screens` from `entryScreenId`. Navigation is entirely local state
  in the browser; the server is not asked for screens.

### 3.1 Worked shapes, one per channel

| Channel | Typical screens | Typical blocks |
|---|---|---|
| WhatsApp | `chat-list` (kind `list`) → `thread-x` (kind `thread`) | `listItem`, `message`, `linkPreview` |
| SMS | `sms-list` (`list`) → `sms-thread` (`thread`) | `listItem`, `message` |
| `instagram` | `dm-list` (`list`) → `dm-thread` (`thread`) → `profile-x` (`profile`) | `listItem`, `message`, `post`, `image` |
| Email | `inbox` (`inbox`) → `email-x` (`message`) → `attachment-x` (`document`) | `listItem`, `emailHeader`, `emailBody`, `attachment` |

The four renderers differ in chrome and typography, not in data handling. Adding a fifth
channel later means adding a renderer and a `channel` value — no schema change.

### 3.2 Recorded interactions

Every action the candidate takes inside the frame is appended client-side and submitted
with the answer:

```js
interactions: [{ screenId, actionId, interaction, atMs }]  // atMs = ms since served
```

Whether these affect marks is **open** — see section 11.3 and item 7 in section 14.

---

## 4. Assessment Schema

```js
// models/Assessment.js
{
  candidate: ObjectId,         // ref Candidate
  status: String,              // 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'

  sequence: [{                 // frozen at creation, exactly 10, order is the order
    position: Number,          // 1..10
    scenario: ObjectId,
    scenarioVersion: Number,   // what was served, for explainability
    servedAt: Date,            // set once, on first delivery
    answer: {                  // null until submitted
      judgement: String,
      actionKey: String,
      reasonKey: String,
      interactions: [Interaction],
      submittedAt: Date,
      durationMs: Number,      // server-computed: submittedAt - servedAt
      marks: {
        judgement: Number,     // 0..3
        action: Number,        // -5..+5
        reason: Number,        // 0..2
        total: Number          // -5..+10
      },
      isCriticalFailure: Boolean
    }
  }],

  currentPosition: Number,     // 1..10, or 11 once finished
  startedAt: Date,
  completedAt: Date,
  result: { ... },             // see section 11, written once on completion
  createdAt, updatedAt
}
```

**Indexes:** `{ candidate: 1, status: 1 }` for "find my active assessment";
`{ candidate: 1, createdAt: -1 }` for the history list.

**The sequence is generated once and never regenerated.** `GET /current-question` is a
read of `sequence[currentPosition - 1]`. A refresh, a reconnect or a browser restart
resumes the same assessment at the same position with the same scenarios.

---

## 5. Candidate Schema and History

```js
// models/Candidate.js
{
  name: String,
  identifier: String,          // phone or service number, normalised, unique
  identifierNormalised: String,// uppercase, spaces/hyphens/slashes stripped
  seenScenarios: [{
    scenario: ObjectId,
    lastSeenAt: Date,
    timesSeen: Number
  }],
  createdAt, updatedAt
}
```

### 5.1 Where history lives — the three options

| Option | Pros | Cons |
|---|---|---|
| **A. Embedded on Candidate** | One read during selection. No joins. Trivial to reason about. Array is tiny (40 entries today, a few hundred at 200+ scenarios). | Denormalised — the same fact also exists in the assessments. Needs a rebuild path if it drifts. |
| B. Separate `scenarioHistory` collection | Unbounded growth is safe. Easy to query per scenario. | An extra collection and an extra query for a fact that is always read with the candidate. Over-built at this size. |
| C. Derived from completed assessments | No duplication, single source of truth. | An aggregation on every generation. **Misses abandoned assessments** — a candidate who quits at question 2 would be re-served all 10 scenarios. |

**Decision [PROPOSED]: Option A.** It is the cheapest correct answer at this scale. The
drift risk is handled by treating `seenScenarios` as a **cache** — the assessments remain
the audit trail, and a small maintenance script can rebuild the array from them.

### 5.2 When a scenario counts as "seen"

**On delivery, not on completion.** `seenScenarios` is updated when
`GET /current-question` first serves a scenario (the same moment `servedAt` is stamped).

Rationale: the candidate has genuinely seen that content, so re-serving it later is a
weaker test. Marking all 10 as seen at generation time would waste the pool for someone
who abandons at question 1; marking them only on completion would let an abandon-and-
restart loop re-serve the same scenarios forever.

### 5.3 Isolation between candidates

History is a field on the candidate document and the selection query filters on that
candidate's own array only. Candidate B's pool is never influenced by Candidate A. There
is no global "recently used" state anywhere in the design.

---

## 6. Sequence Generation

### 6.1 Should the channel mix be constrained?

**Option A — pure random 10 from the unused pool.** Simplest. But drawing 10 from 40
leaves roughly a **3.5% chance that any given channel is absent entirely**, and about a
**1-in-7 chance that at least one of the four channels is missing** from an assessment.
That breaks a promise the built UI already makes ("Your 10 scenarios are picked from
these four apps") and leaves the channel breakdown in the result empty. Rejected.

**Option B — fixed quota, e.g. 3/3/2/2.** Guarantees coverage but makes every assessment
structurally identical and hard-codes a split that stops making sense if the pool grows
unevenly. Rejected.

**Option C — minimum floor plus free picks. RECOMMENDED [PROPOSED].**
Guarantee 2 per channel (8 scenarios), then fill the remaining 2 from anywhere in the
eligible pool. Every channel always appears; composition still varies between candidates
(3/3/2/2, 4/2/2/2, 2/2/3/3 …); and the floor scales as a formula rather than a constant.

### 6.2 The legitimacy mix — a constraint the brief requires

The Developer Brief requires roughly **7 fraudulent / 3 genuine** so that a candidate who
marks everything as fraud does not score well. With a 10-scenario assessment this must be
enforced during selection, not left to chance — a random draw can easily produce 10
fraudulent scenarios and make "always answer fraud" a perfect strategy.

**Confirmed: one of three compositions, chosen per assessment [CONFIRMED 2 Sep 2026].**

| malicious | legitimate |
|---|---|
| 6 | 4 |
| 7 | 3 |
| 8 | 2 |

The engine picks one of the three when it generates an assessment, so the ratio varies
between attempts as well as between candidates. **Never 10+0 and never 0+10** — a
candidate who answers "fraud" every time must not score full marks, and neither must one
who answers "genuine" every time.

The composition is stored on the assessment (`composition.maliciousCount` /
`legitimateCount`) so a generated test is auditable after the fact, and the Assessment
model rejects any other split.

Pool capacity: 28 malicious and 12 legitimate. The legitimate half is the binding
constraint — it supports 3 assessments at 6+4 and 6 at 8+2. Exhaustion is handled by
section 7 either way.

### 6.3 The algorithm

```
generateSequence(candidateId):

  seen      = candidate.seenScenarios            (set of scenario ids)
  active    = scenarios where isActive = true
  unseen    = active minus seen

  # Stage 1 - channel floor, 2 per channel = 8 picks
  # One fraudulent from every channel (4 picks, 4 fraudulent).
  # A second pick from every channel: genuine for 3 randomly chosen
  # channels, fraudulent for the 4th (4 picks, 3 genuine + 1 fraudulent).
  # Running total: 5 fraudulent, 3 genuine, every channel has exactly 2.

  # Stage 2 - 2 free picks, both fraudulent, any channel
  # Final total: 7 fraudulent, 3 genuine, every channel >= 2.

  # Every pick prefers `unseen`; see 6.4 for the fallback order.

  # Stage 3 - order
  shuffle the 10
  reject and reshuffle while any 3 consecutive share a channel (cap the
  retries, then accept - it is a nicety, not a correctness rule)

  freeze as sequence[1..10]
```

Shuffling uses a Fisher-Yates over `crypto.randomInt`, not `Math.random()`.

### 6.4 Relaxation order when the pool cannot satisfy every constraint

Constraints are relaxed in this order, and the assessment records which relaxations were
applied so a result can be explained:

1. **Unseen preference** — top up from already-seen scenarios (section 7).
2. **Channel floor** — drop from 2 per channel to 1, then to 0 for a channel with nothing
   eligible left.
3. **Legitimacy mix** — take the closest achievable ratio.

Novelty is sacrificed first because assessment quality matters more than freshness.

If fewer than 10 active scenarios exist in total, the engine refuses to start the
assessment and returns a `POOL_TOO_SMALL` error rather than serving a short test.

---

## 7. Exhaustion and Repetition

**Rule [PROPOSED].**

1. Prefer unseen scenarios for every pick.
2. If 10 or more unseen scenarios remain (and they satisfy the constraints), the
   assessment contains no repeats at all.
3. If fewer than 10 unseen remain, take **all** the unseen ones first, then fill the
   remainder from seen scenarios, choosing **least-recently-seen first** with a random
   tie-break.
4. **Never** repeat a scenario inside a single assessment, in any circumstance.
5. Once the pool is fully exhausted the whole assessment is drawn from seen scenarios,
   still least-recently-seen first, still reshuffled — so the order differs from the
   previous attempt even when the content overlaps.

**Worked example — 7 unseen remaining.** The engine takes all 7 unseen, then picks 3 from
the seen pool ordered by `lastSeenAt` ascending, excluding the 7 already chosen. The
channel floor and 7/3 mix are applied across all 10, using the relaxation order in 6.4 if
the residual pool cannot satisfy them.

**With 40 scenarios**, a candidate gets 4 fully-fresh assessments; the 5th onward repeats
content in a new order.

---

## 8. API Design

All routes are session-authenticated (section 10). All are scoped to the calling
candidate — an assessment id belonging to someone else returns **404**, not 403, so ids
cannot be probed.

### 8.1 `POST /api/assessments`

Start an assessment. **Idempotent by design**: if the candidate already has an
`IN_PROGRESS` assessment it is returned unchanged rather than creating a second one.
This is what makes refresh-and-resume work and prevents sequence re-rolling.

*Request:* empty.
*Response 201 (created) or 200 (existing):*
```json
{ "assessmentId": "...", "status": "IN_PROGRESS",
  "currentPosition": 1, "totalQuestions": 10, "resumed": false }
```
*Errors:* `401` no session · `409 POOL_TOO_SMALL` fewer than 10 active scenarios ·
`409 ALREADY_COMPLETED` if resuming a completed one is attempted (see open decision 4).

### 8.2 `GET /api/assessments/active`

What the dashboard needs, in one call: the in-progress assessment or `null`.

*Response 200:*
```json
{ "assessment": { "assessmentId": "...", "status": "IN_PROGRESS",
                  "currentPosition": 4, "totalQuestions": 10, "completed": 3 } }
```
Returns `{ "assessment": null }` when there is none. This replaces the hardcoded
`ASSESSMENT` object at the top of `DashboardPage.jsx`.

### 8.3 `GET /api/assessments/:id/current-question`

Returns the one question the candidate is on. Stamps `servedAt` **on first delivery
only** — repeat calls (refresh) return the same payload and do not restart the clock.

*Response 200:*
```json
{
  "assessmentId": "...",
  "questionNumber": 4,
  "totalQuestions": 10,
  "scenario": {
    "id": "...",
    "channel": "sms",
    "title": "Review this text message",
    "instruction": null,
    "simulation": { "entryScreenId": "sms-list", "screens": [ ... ] }
  },
  "judgementOptions": [ { "key": "...", "label": "..." } ],
  "actionOptions":    [ { "key": "verify", "label": "Check with the official number first" } ],
  "reasonOptions":    [ { "key": "urgency", "label": "It tries to hurry or frighten me" } ]
}
```
No marks, no correct answer, no EVI tags, no warning signs, no author notes.

*Errors:* `404` unknown or not yours · `409 ASSESSMENT_COMPLETED` — the client should
call the result endpoint instead.

### 8.4 `POST /api/assessments/:id/answers`

*Request:*
```json
{
  "questionNumber": 4,
  "judgement": "fraudulent",
  "actionKey": "verify",
  "reasonKey": "urgency",
  "interactions": [ { "screenId": "sms-thread", "actionId": "open-link",
                      "interaction": "open-link", "atMs": 8200 } ]
}
```

`questionNumber` is sent so a stale client (a resubmitted form, a back button) is
rejected rather than silently overwriting the wrong answer. The server ignores any
client-supplied scenario id and uses `sequence[currentPosition - 1]`.

Server steps: assessment belongs to caller and is `IN_PROGRESS` → `questionNumber`
equals `currentPosition` → this position has no answer yet → `judgement`, `actionKey`,
`reasonKey` are values that exist on *this* scenario → score → store with
server-computed `durationMs` → advance `currentPosition` → if position 11, set
`COMPLETED`, stamp `completedAt`, compute and store `result`.

*Response 200:*
```json
{
  "feedback": {
    "awarded": 8, "maxMarks": 10,
    "correctJudgement": "fraudulent",
    "wasCorrect": true,
    "warningSigns": ["The message creates urgency", "The link is not the bank's real address"],
    "explanation": "This is a KYC freeze fraud. A real bank never asks you to ..."
  },
  "next": { "hasNext": true, "questionNumber": 5 },
  "assessmentStatus": "IN_PROGRESS"
}
```

On the tenth answer: `"next": { "hasNext": false }` and
`"assessmentStatus": "COMPLETED"`.

The per-question feedback block matches the proposal's assessment screen, section 3
("after submitting: the score awarded and a short feedback paragraph"). **The FE-007
shell does not yet have a view for this** — see section 14, item 8.

*Errors:* `404` · `409 NOT_CURRENT_QUESTION` (includes the real `currentPosition` so the
client can resync) · `409 ALREADY_ANSWERED` · `422 INVALID_OPTION` · `409 ASSESSMENT_COMPLETED`.

### 8.5 `GET /api/assessments/:id/result`

Only for a `COMPLETED` assessment; `409 ASSESSMENT_NOT_COMPLETED` otherwise. Returns the
stored result — it is computed once at completion, not recalculated on read, so a
scenario edit can never retroactively change a delivered score.

### 8.6 `GET /api/assessments`

The candidate's own attempt history, newest first: id, status, completedAt, overall
score, band. Feeds FE-013.

### 8.7 Not in this design

`POST /api/auth/candidate`, `GET /api/auth/me`, `POST /api/auth/logout` and the admin
statistics endpoints are separate tasks. They are referenced here only where the
assessment engine depends on them.

**Update, 4 September 2026.** Candidate authentication shipped in BE-002 as
`POST /api/candidates`, `GET /api/candidates/me` and `POST /api/candidates/logout` —
under `/api/candidates`, not the `/api/auth` prefix sketched above. Admin
*authentication* shipped in BE-005a as `POST /api/admin/login`,
`POST /api/admin/logout` and `GET /api/admin/me` — see section 24. Admin *statistics*
endpoints are still not built; they are BE-005b.

---

## 9. Timing

**Server-authoritative. The browser clock is never trusted.**

| Field | Set when | By |
|---|---|---|
| `startedAt` | assessment created | server |
| `sequence[n].servedAt` | first delivery of question n | server |
| `answer.submittedAt` | answer accepted | server |
| `answer.durationMs` | `submittedAt - servedAt` | server |
| `completedAt` | tenth answer accepted | server |

`atMs` inside `interactions` is client-relative and is stored for interest only — it is
never used for marks and never trusted for anything.

`servedAt` is written once. A refresh re-delivers the same question without resetting it,
so reloading cannot be used to reset the clock; the cost is that a candidate who walks
away records a long duration. Rather than capping the value, the result flags durations
beyond a threshold as outliers and the report can note them.

**Timing never adds or removes marks.** The Developer Brief forbids penalising reading
speed. It is reported (average decision time, count of impulsive decisions) and nothing
more.

---

## 10. Security Boundaries

| Threat | Control |
|---|---|
| Client picks its own scenario | Server reads `sequence[currentPosition - 1]`; any scenario id in the request body is ignored. |
| Client skips ahead / replays | `questionNumber` must equal `currentPosition`; a position that already has an answer is rejected. |
| Client re-rolls the sequence for an easier set | `POST /assessments` returns the existing in-progress assessment instead of creating a new one. |
| Client reads the answer key | `evaluation` is stripped in `toCandidateJSON()`; option `marks` never leave the server. |
| Client submits an option that is not on the scenario | Option keys are validated against that scenario's own lists. |
| Client sends its own marks or duration | Both are computed server-side; any such fields in the request are ignored. |
| Enumerating other candidates' assessments | Every query is scoped by `candidate`; a miss returns 404. |
| Scenario content reaching the network | Links are strings rendered as text — no `href`, no fetch, no external asset. |

The frontend keeps no answer key and no scoring logic. The one thing it holds is the
current question's presentation data.

---

## 11. Scoring

### 11.1 Judgement scale — resolved [CONFIRMED 2 Sep 2026]

**Three-way, as the proposal's scoring table requires**: `genuine`, `fraudulent`,
`needs_verification`, scored 0–3.

Both sides now match: `JUDGEMENTS` in `backend/src/constants/assessment.js` and
`JUDGEMENT_OPTIONS` in `frontend/src/constants/assessment.js`. The FE-007 decision panel
was updated from two options to three ("Genuine" / "Fraud" / "Needs checking").

### 11.2 Conflict — the channel score formula does not survive the new shape [STILL OPEN]

The proposal defines:

- per scenario: −5 to +10
- **per channel: 0–100, the total of the 10 scenarios in that channel**
- **overall: the average of the four channel scores**

Both of the bold lines assume 10 scenarios per channel. Under the mixed 10-question
assessment a channel carries between 0 and 4 scenarios, which breaks the formula in two
ways: a channel score out of 100 is undefined when that channel contributed 2 scenarios
(max 20), and averaging four channel scores would give a single WhatsApp scenario the
same 25% weight as four Email scenarios. Implementing it as written would produce numbers
that look official and mean nothing.

### 11.3 Proposed scoring model [PROPOSED]

**Overall score = the sum of the 10 scenario scores, floored at 0.**

10 scenarios × 10 marks = 100 maximum, so the scale is already 0–100 and **the client's
existing performance bands work unchanged**: 85–100 Strong · 70–84 Developing ·
50–69 Needs Reinforcement · below 50 Immediate Coaching. Negative totals (possible via
the −5 action penalty) are floored at 0.

**Channel scores become a channel *breakdown*, reported but not part of the overall.**
For each channel that appeared: scenarios seen, marks earned, marks available, and a
percentage — presented as indicative, with the count shown, because a 2-scenario sample
is not a reliable measure. This preserves the client's "channel-wise scores" deliverable
honestly instead of manufacturing a precise-looking figure from two data points.

Everything else from the proposal's result section carries over unchanged: correct
detections, missed frauds, genuine messages wrongly marked as fraud, critical failures,
average decision time, impulsive decisions, plain-language feedback, comparison with the
previous attempt.

**Critical failures.** An action option flagged `isCriticalFailure` (sharing an OTP,
entering credentials, making a payment) scores −5 and is counted separately in the
result, as the proposal requires. Whether the *same* act performed as an interaction
inside the phone frame also counts is open — section 14, item 7.

### 11.4 Where scoring runs

A pure function, `scoreAnswer(scenario, answer) -> { judgement, action, reason, total }`,
called from the answer controller. No I/O, no dates, no randomness — so it is directly
unit-testable against a table of cases, which is what "deterministic and explainable line
by line" in the proposal requires.

---

## 12. EVI Handling

Scenarios carry `evaluation.eviTags`, one or more of the seven triggers already agreed
with the client: Authority/Fear, Urgency, Greed/Reward, Empathy/Trust, Curiosity,
Romance/Attraction, Routine/Convenience.

At completion the engine groups the candidate's 10 scenarios by tag and computes, per
tag: scenarios encountered, marks earned, marks available. Tags with no scenarios in this
assessment are reported as "not covered in this assessment" rather than as a zero — with
10 scenarios across 7 triggers, several triggers will be absent every time, and showing
them as 0% would be actively misleading.

The tags are hidden evaluation data and never appear in a question response.

The result carries the non-clinical disclaimer already agreed: *the EVI profile is a
training indicator showing which type of manipulation the user should be most careful
about; it is not a psychological or medical assessment.*

EVI calculation is not implemented in BE-000.

---

## 13. Candidate Identity, and Replacing the Temporary Storage

**Today.** `frontend/src/services/candidateStorage.js` writes `{ name, identifier }` to
`sessionStorage` under `training.candidate` so the briefing and dashboard can greet the
candidate. There is no authentication and nothing is persisted server-side.

**Later.** `POST /api/auth/candidate` takes `{ name, identifier }`, upserts a Candidate on
`identifierNormalised`, and issues an **httpOnly, SameSite=Strict session cookie**. Every
assessment route resolves the candidate from that cookie — never from a body or query
parameter, so a candidate id cannot be spoofed.

**Migration, when the backend lands (FE-015):**
1. `LoginPage` calls the auth endpoint instead of `saveCandidate()`.
2. Screens read the name from `GET /api/auth/me` (or a small `CandidateContext` seeded
   from it) instead of `getCandidate()`.
3. `candidateStorage.js` is deleted, along with `src/mocks/`.
4. A route guard redirects to `/login` when there is no session — the known gap recorded
   in the master plan.

This is one authentication system, added once. Nothing in the current frontend needs a
second one.

---

## 14. Open Decisions — Confirmation Needed Before BE-001

Items 1–3 block implementation. The rest can be defaulted as noted and revisited.

| # | Decision | Recommendation | Blocking |
|---|---|---|---|
| 1 | **Judgement scale** | **CONFIRMED 2 Sep 2026: three-way** — genuine / fraudulent / needs_verification. Implemented on both sides. | Resolved |
| 2 | **Scoring model** for a mixed 10-question assessment (section 11.3): overall = sum of 10 scenario scores floored at 0, bands unchanged, channel figures reported as an indicative breakdown only. | Adopt. It keeps the client's 0–100 scale and bands exactly. | **Yes** |
| 3 | **Legitimacy mix** | **CONFIRMED 2 Sep 2026:** the engine picks one of 6+4, 7+3 or 8+2 per assessment. Never 10+0, never 0+10. Enforced by the Assessment model. | Resolved |
| 4 | **Repetition after exhaustion** — may a scenario reappear in a later assessment once the candidate's unused pool runs out? | Yes, least-recently-seen first, reshuffled. Four fresh assessments come first. | No |
| 5 | **Resuming**: only an `IN_PROGRESS` assessment can be resumed; a `COMPLETED` one is read-only and a new attempt starts a new assessment. | Adopt. | No |
| 6 | **Backward navigation** after answering — the FE-007 shell has a Previous button. | Make Previous **review-only** (show the question and the feedback already given, no re-answering). Changing a submitted answer after seeing the feedback would invalidate the score. | No |
| 7 | **Do in-frame interactions score?** The proposal's result section counts "critical failures — where an OTP, credential or payment was given inside the simulation", which implies they do. | MVP: interactions are recorded and reported but do **not** change marks; the Action choice carries the critical-failure penalty. Revisit once the renderers exist. | No |
| 8 | **Per-question feedback UX** — the proposal shows marks and an explanation after each answer; the FE-007 shell has no view for it. | Add a feedback state to the assessment screen in the FE-008+ work. | No |
| 9 | **Channel floor of 2 per channel** (section 6.1, option C). | Adopt. | No |
| 10 | **Scenario immutability** — published scenarios are versioned rather than edited in place. | Adopt; it is what makes an old result explainable. | No |

The client-facing `Project_Proposal.docx` still describes the old shape (10 scenarios per
channel, channel-average scoring). It needs regenerating via `build_proposal.py` once
items 1–3 are settled.

---

## 15. Future Scale

Nothing in this design is tied to 40 scenarios.

- **Selection** queries by `isActive`, `channel` and `isFraudulent`; growing the pool to
  200+ changes nothing but the size of the unseen set, and makes exhaustion rarer.
- **The channel floor** is a formula, not a constant — a fifth channel means a new
  `channel` value and a renderer, not a schema change.
- **`seenScenarios`** grows linearly with the pool. At 200 scenarios it is a 200-element
  array of small subdocuments, still comfortably inside a document. If a pool ever made
  that uncomfortable, section 5.1 option B is the migration, and it is a contained one.
- **The simulation model** is block-based, so a new kind of content is a new `Block` type
  plus its renderer case.
- **Assessment length** is a constant, not an assumption baked into the scoring: overall
  score is a sum against `10 × 10` marks available, which generalises to `n × 10`.

What is deliberately *not* built: no recommendation engine, no adaptive difficulty, no
scenario-weighting model. Selection is a filtered random draw with two constraints, which
is the right complexity for this product.

---

## 16. Changelog

**2 September 2026 — amended during BE-001.**

Confirmed and now implemented:

1. **Judgement is three-way** (`genuine` / `fraudulent` / `needs_verification`), per the
   proposal's 0–3 scoring component. The FE-007 decision panel was changed from two
   options to three.
2. **The malicious / legitimate split is one of 6+4, 7+3 or 8+2**, chosen per assessment
   by the engine — not the fixed 7+3 originally proposed in section 6.2. Never 10+0,
   never 0+10. The Assessment model rejects any other split.
3. The channel floor of 2 per channel (section 6.1) stands, and is compatible with all
   three compositions.

Still open, unchanged: the **scoring aggregation** (section 11.2). The proposal's
"channel score 0–100" and "overall = average of four channel scores" still assume 10
scenarios per channel. Nothing in BE-001 implements aggregation, and
`Assessment.result` is deliberately left as a loose Mixed field until this is settled.

The proposal's per-scenario scoring is untouched and encoded in
`backend/src/constants/assessment.js`: judgement 0–3, action −5..+5, reason 0–2,
per-scenario −5..+10, bands 85/70/50, timing recorded but never scored.

---

## 17. Changelog — BE-002

**2 September 2026.** Implemented. Three deviations from the section 8 API sketch, all
deliberate:

1. **`GET /api/assessments/:id` replaces `GET /:id/current-question`.** One endpoint
   both resumes and serves the current question, which is all the client needs. It
   returns progress plus the current question — never the composition and never the
   rest of the sequence, since knowing how many frauds the test contains would give the
   answer away.
2. **`POST /api/assessments/:id/complete` is explicit**, rather than the tenth answer
   auto-completing. Completion requires all ten answers and returns
   `QUESTIONS_OUTSTANDING` otherwise.
3. **`GET /active`, `GET /:id/result` and `GET /api/assessments` are not built yet.**
   `POST /api/assessments` already covers resume (it is idempotent), and the result
   endpoint waits on the scoring aggregation decision.

**One design defect found and fixed by the tests.** The first implementation chose the
malicious/legitimate type for each pick before looking at what was unseen, so it pulled
an already-seen scenario out of one bucket while unseen ones sat in the other. With ten
unseen scenarios available it used all ten in only 1 run out of 300. The picker now
prefers a (channel, type) pair that can still supply an unseen scenario. After the fix it
uses 9 or 10 of them every time — ten whenever the randomly chosen split matches the
type mix of what is left.

**A limit worth stating plainly:** "prefer unseen" is best-effort, not absolute. The
composition rule and the channel floor both outrank it, so a candidate with an awkward
remainder can be served one already-seen scenario even though an unseen one exists. That
ordering is deliberate (section 6.4) and is covered by two tests.

**Scoring.** `scoreAnswer()` implements the proposal's per-scenario model exactly:
judgement 0–3, action −5..+5, reason 0–2, total clamped to −5..+10, critical failures
flagged. Judgement is all-or-nothing — the proposal gives a 0–3 range but never defines
partial credit, so awarding 1 or 2 would be inventing a rule. **Still open.**

**No aggregation exists.** `Assessment.result` is still null after completion. The
completion endpoint returns per-question facts only (marks awarded, marks available,
critical failures, total duration) with `scoringPending: true`. Section 11.2 is unchanged.

---

## 18. Changelog — FE-015a

**2 September 2026.** The frontend now talks to this API; all mocks are gone.

- **`GET /api/assessments/active` was built** (section 8.2, previously unimplemented).
  The dashboard must tell "no assessment" from "one in progress" without creating one,
  and nothing else could do that. Read-only.
- **`/assessment` carries no id in the URL.** The page asks `active` which assessment it
  is resuming, so a refresh cannot start a second one and a link cannot point at someone
  else's assessment.
- **Per-question feedback is now displayed** — marks, correct judgement, warning signs
  and explanation, exactly as section 8.4 returns them after the answer is recorded.
- **No Previous button.** There is no endpoint for changing a submitted answer, so
  client-side back navigation was removed rather than faked. Open decision 6 in section
  14 is therefore settled by omission for now: answers are final once submitted.
- **`PhoneSimulator`** renders `simulation.screens` generically — typed blocks plus
  local navigation. The channel replicas (FE-008 to FE-011) dispatch behind it on
  `scenario.channel`; the data shape does not change.

Confirmed in the browser: no `evaluation`, `correctJudgement`, `warningSigns`,
`authorNotes`, `isCriticalFailure` or option `marks` reach the page before an answer is
submitted; `localStorage` and `sessionStorage` stay empty; `document.cookie` is
unreadable. Section 11.2 (scoring aggregation) remains open and nothing was implemented
against it.

---

## 19. Changelog — FE-009

**2 September 2026.**

**One schema addition: the `profileHeader` block.** Fields: `displayName`, `username`,
`bio`, `verified`, `postCount`, `followers`, `following`, `isFollowing`. It is an
identity card with public counts, deliberately generic — the same shape as the
existing `emailHeader` — so any channel with profiles can use it. Follower counts are
strings so both "48.2K" and "312" work. `comments` was also added to `post`.
`BLOCK_TYPES` now includes `profileHeader`.

**No other model change.** The Instagram profile grid (three images across) is a
rendering rule in the renderer, not schema.

**Instagram scenarios are authored, not generated.**
`backend/data/scenarios.instagram.json` holds 10 distinct scenarios covering the
approved themes. `scripts/generateDevPool.js` now skips channels listed in
`AUTHORED_CHANNELS`, so regenerating padding for the other channels cannot overwrite
authored content. SMS and Email join that set as they are authored.

**Proposal note.** The final proposal (Version 1.0, 02 September 2026) removed the
detailed scoring section that earlier drafts carried — there is no longer any published
formula for judgement marks, action marks, channel score, overall score or the
performance bands, and the seven EVI categories are no longer listed. Section 11 of this
document therefore describes a model that now rests on a superseded draft. It is
implemented per-scenario and must be re-confirmed before BE-003 builds any aggregation.
Section 11.2 remains open.

---

## 20. Changelog — FE-010

**2 September 2026.**

**One vocabulary addition: `call-number` in `INTERACTION_TYPES`.** Callback fraud — an
alarming SMS whose "fraud helpline" is the sender's own number — turns on the candidate
ringing it, and no existing interaction covered that act. Generic and reusable; Email
scenarios will want it too. No block or screen types were added.

**SMS renderer added**, so `whatsapp`, `instagram` and `sms` all dispatch to dedicated
renderers and only `email` still falls through to `GenericRenderer`.

**Same blocks, channel-appropriate presentation.** `linkPreview` renders as a card in
WhatsApp and Instagram but as plain text in SMS, because real SMS has no rich previews.
That is the shared screen-graph model working as intended: the data does not change, the
presentation does.

**SMS scenarios are authored** in `backend/data/scenarios.sms.json` (10 scenarios,
7 malicious / 3 legitimate, covering the final proposal's SMS themes), and `sms` joined
`AUTHORED_CHANNELS` in `scripts/generateDevPool.js` so regenerating padding cannot
overwrite them.

**Scoring unchanged and still open.** The final proposal (Version 1.0) contains no
scoring formula, no EVI category list and no performance bands. Nothing was added,
restored or inferred: `Assessment.result` is still null after completion, the completion
endpoint still returns `scoringPending: true`, and section 11 of this document still
describes a per-scenario model that rests on a superseded draft and needs re-confirming
before BE-003.

---

## 21. Changelog — FE-011

**2 September 2026.**

**No schema, interaction or block additions.** Email uses the existing `inbox`, `message`
and `document` screen kinds and the existing `emailHeader`, `emailBody`, `attachment`,
`linkPreview`, `listItem` and `note` blocks. All six interaction values already covered
the authored scenarios. The screen-graph model has now carried four visually very
different channels without a single channel-specific field — which was the point of
section 3.

**All four renderers exist.** `whatsapp`, `instagram`, `sms` and `email` all dispatch to
dedicated renderers; `GenericRenderer` is now only a safety net for a scenario whose
channel has no renderer.

**Email scenarios are authored** in `backend/data/scenarios.email.json` (10 scenarios,
7 malicious / 3 legitimate, covering the final proposal's Email themes), and `email`
joined `AUTHORED_CHANNELS`. Instagram, SMS and Email are all authored; only WhatsApp
still runs on generated padding (FE-017).

**One renderer rule worth recording:** the sender address is never truncated. The display
name is the part an attacker controls freely and the address is the part that exposes
them, so `fromAddress` renders in full with `break-all`. Hiding it behind an ellipsis
would remove the main Email training signal.

**Scoring and EVI remain OPEN and untouched.** The final proposal (Version 1.0) contains
no scoring formula, no performance bands and no EVI category list. Nothing has been
added, restored or inferred: `Assessment.result` is still null after completion and the
completion endpoint still returns `scoringPending: true`. Section 11 still describes a
per-scenario model resting on a superseded draft, and it needs re-confirming before
BE-003. Whether feedback should be immediate or withheld to the end is also still
unconfirmed.

---

## 22. Changelog — FE-017

**2 September 2026.**

**No schema, block, interaction or renderer change.** This was a content task. The
existing WhatsApp renderer already supported every block the ten scenarios use, and the
six existing interactions covered every action.

**All four channels now carry authored scenario content.** WhatsApp joined
`AUTHORED_CHANNELS`, so `scripts/generateDevPool.js` now produces nothing. It is kept
rather than deleted until the authored pool has been validated in real use. The pool is
still exactly 40: 10 per channel, 7 malicious / 3 legitimate in each, with zero documents
carrying the generator's placeholder text.

**Content principle worth recording for the remaining channels and for the client pack:**
surface cues are split deliberately across both classes so that keyword matching cannot
pass the assessment. Links, images, attachments, unknown numbers and saved contacts all
appear on both the malicious and the legitimate side. Two malicious WhatsApp scenarios
come from genuinely trusted sources — a real vendor group where only the bank account
changed, and a saved contact whose account was taken over — specifically to defeat the
"unknown number means fraud" shortcut. Distinctness was measured, not assumed: no two
WhatsApp conversations share more than 60% of their words.

**Scoring, EVI and feedback timing remain OPEN and untouched.** The final proposal
(Version 1.0) contains no scoring formula, no performance bands and no EVI category list.
`Assessment.result` is still null after completion and the completion endpoint still
returns `scoringPending: true`. Section 11 still describes a per-scenario model resting on
a superseded draft, and it needs re-confirming before BE-003. Whether feedback should be
immediate or withheld until the end is also still unconfirmed.

---

## 23. Changelog — FE-013 / BE-004

**2 September 2026. `GET /api/assessments` is now implemented** (section 8.6), behind the
existing session guard.

**It deviates from section 8.6 deliberately.** That section says the list returns
"overall score, band". Neither exists — scoring aggregation is still open — so no score
and no band are returned. Each row carries `scoringPending: true` instead, and the UI
states plainly that the score is not available rather than showing a fabricated figure.
Section 8.6 should be read as amended by this note until item 15 is settled.

**Response shape**, one row per completed assessment, newest first:

```json
{ "assessments": [ {
  "assessmentId": "...", "status": "COMPLETED",
  "startedAt": "...", "completedAt": "...", "totalQuestions": 10,
  "summary": { "answeredQuestions": 10, "marksAwarded": 68, "marksAvailable": 100,
               "criticalFailures": 1, "totalDurationMs": 412000, "scoringPending": true }
} ] }
```

**Only completed assessments appear.** An in-progress one is surfaced on the dashboard, so
the two views never disagree about what is finished. Ordering is `completedAt` descending
with `_id` as a tiebreak, so it stays deterministic when two attempts finish in the same
second.

**A deliberate DTO, not a Mongoose document.** `sequence`, `composition`, `relaxations`
and every per-answer field are dropped in the service, so no scenario content, answer key
or composition hint can leak. Verified: the response contains no `evaluation`,
`correctJudgement`, `warningSigns`, `authorNotes`, `simulation`, `actionKey`, `sequence`
or `composition`.

**`summaryOf()` was extracted** and is now shared by the completion response and the
history list, so the same numbers cannot acquire two definitions.

**Read-only.** History creates, mutates and completes nothing — confirmed by an API check
that the list is unchanged after a new assessment is started.

**Scoring, EVI and feedback timing remain OPEN and untouched.** `Assessment.result` is
still null after completion, the completion endpoint still returns `scoringPending: true`,
and section 11 still describes a per-scenario model resting on a superseded draft that
needs re-confirming before BE-003.

---

## 24. Admin Authentication (BE-005a, 4 September 2026)

Recorded here because it is a backend design decision, not because the proposal specified
it. The final proposal names "admin login" twice as a task title and defines no
credentials, no role, no provisioning and no mechanism — the word "role" does not appear
in it at all. What follows is an engineering minimum, and the product questions it leaves
open are listed at the end.

### Why a separate collection

`AdminUser` is its own collection rather than a flag on `Candidate`.
`findOrCreateCandidate` **upserts** on an unrecognised identifier, so an `isAdmin` field
on Candidate would sit one typo away from self-provisioning an administrator. Two
collections make that structurally impossible instead of relying on a guard.

```
AdminUser
  username             trimmed, max 32
  usernameNormalised   lowercased, unique — the identity key
  passwordHash         Argon2id PHC string, select: false
  createdAt/updatedAt
```

`passwordHash` is protected by the same two layers as `Scenario.evaluation`:
`select: false` keeps it out of ordinary queries, and `toPublicJSON()` — which returns
`{ id, username }` and nothing else — strips it regardless, so a controller cannot leak
it by forgetting.

### Hashing

Argon2id via Node 24 core `crypto.argon2`: m=65536 KiB, t=3, p=1, 16-byte random salt,
32-byte tag, roughly 145 ms per hash. `utils/password.js` implements no cryptography — it
generates the salt, encodes the standard PHC string, and compares with
`crypto.timingSafeEqual`. Cost parameters live inside each hash, so they can be raised
later without invalidating existing ones.

Core rather than the `argon2` or `bcrypt` npm packages because the target is a standalone
offline Windows machine, later packaged with Electron, where a native module means
node-gyp / prebuild availability and ABI matching — and cannot be installed at all with
no network. The choice is contained in one file if it ever needs reversing.

### Two sessions, genuinely separate

| | Candidate | Admin |
|---|---|---|
| Cookie | `candidate_session` | `admin_session` |
| Secret | `SESSION_SECRET` | `ADMIN_SESSION_SECRET` |
| Signed by | cookie-parser (`signed: true`) | `cookie-signature` directly |
| Lifetime | 8 hours | 1 hour |
| Resolves against | `Candidate` | `AdminUser` |
| Guard | `requireCandidate` | `requireAdmin` |

The admin cookie is **not** signed through cookie-parser. cookie-parser is initialised
once with the candidate secret and returns early when `req.cookies` is already set, so a
second parser carrying the admin secret cannot be mounted on the admin router. Signing
with `cookie-signature` — the library cookie-parser itself uses — is what makes the
secret separation real rather than nominal. The server refuses to start when
`ADMIN_SESSION_SECRET` is missing, or equal to `SESSION_SECRET`.

`requireAdmin` never falls back to `requireCandidate`. A candidate session on an admin
route is rejected, not downgraded or upgraded; no role is ever read from the client.

### Security boundaries added

| Threat | Control |
|---|---|
| Candidate cookie replayed as an admin cookie | Different name **and** different secret; the signature fails |
| Admin cookie forged with the candidate secret | Verified against the admin secret only |
| Admin id sent unsigned, or signature tampered | `unsign` fails, request rejected |
| Signed id for a deleted or malformed admin | AdminUser lookup fails, and a malformed id is caught rather than surfacing as a 500 |
| Username enumeration by response | One code and one message for wrong password and unknown username alike |
| Username enumeration by timing | An unknown username is still verified against a decoy hash |
| Password brute force | 5 failed attempts per address+username in 15 minutes, then a 15-minute lockout |
| Admin session used to read candidate data | `requireCandidate` resolves against `Candidate` and rejects it |
| Hash reaching the client | `select: false` plus `toPublicJSON()` |

All nine are covered by `scripts/validateAdminApi.js` (41/41 on 4 September 2026).

### Provisioning

`npm run admin:create` is the only path that creates an `AdminUser`. No HTTP route, no
seed fixture, no startup hook, no default account, no hard-coded credential. It requires
a TTY (so the password is never echoed into scrollback), takes a hidden password with
confirmation, and refuses to overwrite an existing administrator. Single-admin for this
phase.

### What BE-005b inherits

Statistics endpoints mount behind `requireAdmin` on the existing `/api/admin` router. The
namespace stays **read-only**: Assumption 4 of the proposal makes the admin panel a
statistics and reporting surface, so there is no write endpoint under it and none should
be added without a product decision.

### Open — product decisions, not design gaps

Admin provisioning and handover; how many administrators; whether candidate names and
service numbers may be shown in full; whether CSV export is in scope (the proposal
contradicts itself); the impulsive-decision threshold; how a missed warning sign is
recorded; and — unchanged by this work — the final scoring formula, the performance bands
and the EVI rules of section 14 item 2.

**BE-005a changed nothing about scoring, EVI or the assessment engine.**
`Assessment.result` is still null after completion and the completion endpoint still
returns `scoringPending: true`.
