# Training Feedback / Learning Review (REVIEW-001)

**Status:** IMPLEMENTED — 10 September 2026.
**Route:** `GET /api/attempts/:attemptId/result` (also returned by `POST .../complete`) — same route, additive payload.
**Service:** `backend/src/services/scenarioReviewService.js` · **Vocabulary:** `backend/src/constants/scenarioReview.js`
**UI:** `frontend/src/components/result/ScenarioReview.jsx`, `AssessmentReview.jsx`
**Companions:** [`RESULT_API.md`](RESULT_API.md) · [`SCENARIO_ENGINE.md`](SCENARIO_ENGINE.md) · [`SCENARIO_DEFINITION_SCHEMA.md`](SCENARIO_DEFINITION_SCHEMA.md)

---

## 1. What this capability is for

Before REVIEW-001 an attempt ended with a score, an outcome mix and, per scenario, the five
authored feedback fields. That answers *what did I score*. It does not answer the question a
training simulator has to answer:

```
WHAT DID I DO?
      ↓
WHAT WAS WRONG?
      ↓
WHAT DID I MISS?
      ↓
WHAT SHOULD I HAVE DONE?
      ↓
WHY DOES THE CORRECT ACTION MATTER?
      ↓
WHAT SHOULD I REMEMBER?
```

REVIEW-001 adds exactly that, and nothing else. It is **additive**: every key the result
already published is still published, with the same name and the same meaning, and
`attemptService.attemptResultFor()` keeps its name and signature.

### What it deliberately does NOT do

- It does not score anything. `summary.total_score` remains the only authoritative figure,
  produced by the engine. The review **explains** that score; it never recomputes it, and it
  publishes no number of its own.
- It does not classify anything. Whether a scenario was a missed threat or a false positive
  was already decided by `classifyOutcome()` in RESULT-001. The review reads that decision
  and gives it a learner-facing name, so the two surfaces cannot disagree on screen.
- It does not keep a second behavioural history. The `ScenarioEvent` ledger is the only
  record of what the learner did.
- It does not touch the engine, the timer, the six stages, the scoring model, the mode
  system or any authored scenario content.

---

## 2. Where every sentence comes from

Two sources, combined in one place — `buildScenarioReview()` — and nowhere else.

| The review says | It comes from |
|---|---|
| What the learner did | `ScenarioEvent` (event code + stage + sequence) → an action-class description |
| Which steps were available | `ScenarioDefinition.evaluation.stages[].scoring[].event_code` |
| The correct action, per stage | `ScenarioDefinition.evaluation.stages[].expected_safe_behavior` |
| What the item was | `evaluation.feedback.result` |
| The cue that was missed | `evaluation.feedback.cues` |
| Why it mattered | `evaluation.feedback.impact`, plus the risk carried by the action class |
| The habit to remember | `evaluation.feedback.prevention_habit` |
| Missed threat vs false positive | `outcome_class`, already decided by RESULT-001 |
| The expected path | The scenario's own scoring declaration + its `disposition` |

**Nothing is generated and nothing is guessed.** A mistake exists because an event exists, or
because an event the scenario itself declared does *not* exist. A correct action is quoted
from the stage the scenario's author wrote. A definition with no authored feedback yields
`null`s and an empty cue list, and the UI omits those rows rather than filling them in — so
a gap in the content shows up as a shorter card, never as invented advice.

---

## 3. How learner actions are reconstructed

`ScenarioEvent` rows for the run, ordered by `(run_id, sequence)` — the unique index the
engine writes under, and the only ordering that cannot be wrong. Never insertion order, and
never `client_ts`.

`pathFromEvents()` (RESULT-001, unchanged) maps each event code onto a neutral
`{ stage, action }` step through `PATH_LABELS`. That same array is published as
`scenario.path` and as `review.your_path` — they are the same object, asserted by test, so
the replay and the review can never describe different attempts.

An unmapped event code is **dropped**, not passed through: a code added to the engine later
is invisible to the learner until someone deliberately gives it a label.

### The replay never fabricates

There is no code path that adds a step. `review.your_path` is the ledger projection handed
to `buildScenarioReview()` by its caller; the service does not rebuild, re-order or extend
it. A run the clock closed with no events shows an empty path and says so.

---

## 4. How mistakes are identified

Two mechanisms, both driven entirely by data.

### Commissions — something the learner did

`MISTAKE_RULES` maps an engine event code onto a learner-facing description of that **action
class**. Every negative-scoring code has a rule, plus the three suboptimal ones
(`VERIFY_THROUGH_MESSAGE`, `REPORT_ONLY_WITHOUT_CHECK`, `STAGE_SKIPPED`) and the two
telemetry codes that represent leaving a scenario. `RUN_EXPIRED` deliberately has no rule —
running out of time is not a mistake.

The stage reported is the one the **ledger** recorded, not the one the rule assumes, because
the ledger is what actually happened.

### Omissions — a step that was offered and never taken

`OMISSION_RULES` names, for each graded stage, the safe-path code that stage is worth. An
omission is raised only when:

1. the scenario **itself declares** that code at that stage (so a scenario is never marked
   down for a step it never offered), **and**
2. no event in the ledger carries it, **and**
3. that stage produced no commission — the learner did *something* there, and saying both
   "you did X" and "you did nothing" about one moment would be two claims, one of them false.

This is why the review needs no per-scenario configuration: the scenario's own scoring
declaration already records which steps existed, and it is the same declaration the engine
reads to decide whether an intent is legal at all.

### Ordering

Chronological — by stage, then by ledger sequence — so a learner reads their own attempt in
the order they lived it. The card **headline** is chosen by an internal `severity` field
instead, so the most consequential thing that happened is what a learner sees before opening
anything. `severity` never leaves the server; it is stripped in `toMistake()`.

---

## 5. How the correct action is derived

Per mistake, from the stage the mistake happened at:

```
correct_action = evaluation.stages[<that stage>].expected_safe_behavior
```

That is what makes the card specific — "Do not type or forward the six-digit code" rather
than "always verify messages".

**The resolve stage is the one exception.** Its authored line is about completing the screen
("Complete the resolution and return to the dashboard"), which tells a learner who chose the
wrong final action nothing. There the required action is stated from the scenario's own
`disposition` instead, via `REQUIRED_RESOLUTION_TEXT` — still specific to this case, still
not invented.

For the same reason the **card-level** `correct_action` is dropped once the mistakes carry
their own: `feedback.safe_action` is imported from the resolve stage, so printing it under
the mistakes would add a generic line to a card whose whole purpose is not to be generic. It
is kept when no mistake could supply one, so a card never ends up with no correct action.

### The correct path

`correctPathFor()` walks the six stages and, for each, takes the safe-path code the scenario
declares:

```
NOTIFY_SEEN → opened_notification      SAFE_PIVOT  → declined_the_request
ITEM_OPEN   → read_the_item            CORRECT_USE → used_the_official_path
INSPECT_CONTEXT → inspected_the_details  TRUSTED_VERIFY → verified_independently
RESOLVE_CORRECT → reported_or_blocked_it | kept_it_and_continued   (by disposition)
```

The step labels are read out of `PATH_LABELS`, so the learner's path and the correct path are
drawn from one vocabulary and cannot describe the same action with two different words. A
scenario that declares no verification route shows none in its correct path.

---

## 6. How false positives are handled

The distinction is **preserved, not re-derived**. `review.learning_issue` is a straight
lookup on the `outcome_class` RESULT-001 already assigned:

| `outcome_class` | `learning_issue` |
|---|---|
| `missed_threat` | Missed threat |
| `false_positive` | Genuine item rejected |
| `unsafe_handling` | Unsafe step on a genuine item |
| `handled_safely` | *(none — a clean scenario carries no learning issue)* |
| `not_resolved` | *(none — no decision was taken)* |

On a legitimate scenario the review says the opposite of what it says on a malicious one, and
it says it from the scenario's own data: the correct path ends "Keep it and carry on", and the
resolve mistake reads "This item was genuine. It needed to be kept and acted on normally,
with no report or block."

### No diagnosis, ever

`MISTAKE_RULES` and `OMISSION_RULES` describe an observable action and the risk that action
carries. They contain no adjective for a person. A test asserts that no rule matches
`you are`, `careless`, `vulnerable`, `gullible`, `naive`, `susceptib`, `weak`, so the
constraint is enforced rather than merely intended.

### Scenarios the clock closed

A run that ended `resolve_expired` gets its own status. It is worded about the **clock**, is
styled neutrally, carries no learning issue and produces no mistakes — but still shows the
authored feedback, so the learner learns what the scenario was.

---

## 7. Privacy and the release boundary

The review is built **by construction** from an allowlist of prose fields, not by deleting
keys from a document, so a field added to `evaluation` later is absent by default rather than
published by default.

### Never released

`event_id`, `run_id`, `intent_key`, `sequence`, event codes, `points_delta`, event
`metadata`, the `rationale` the learner typed, `severity`, the authoring `title`, `end_state`
as such, `scoring_text`, per-stage `scoring[]`, `learner_flow`, `expected_actions`, the raw
`disposition` enum, `canonical_family`, `canonical_triggers`, `level`, and every field of the
other ninety scenarios.

Typed form values never reach the server at all: `frontend/src/simulation/localForm.js` keeps
them in component state that is never lifted, logged, stored or sent. So a card can say "you
submitted the payment form before verifying" and there is no path by which it could say what
was typed.

### The one field REVIEW-001 added to the boundary

`evaluation.stages[].expected_safe_behavior`, and only:

- for the **ten scenarios of a FINISHED attempt** the learner has already completed, and
- only at a **stage where that learner actually made a mistake**, and
- only as **that mistake's own `correct_action`**.

A scenario handled correctly releases nothing new at all. Both halves are pinned by tests in
`attemptResultApi.test.js` ("per-stage authored prose appears only as the correct action of a
mistake at that stage" / "a scenario the learner handled correctly releases no per-stage
prose at all"), which fail if a stage line appears anywhere else.

This is a deliberate widening, recorded here rather than left implicit. It is what
specification section 7 asks for — telling the learner what the safe response would have been
— applied at stage granularity so the answer is about the step where it went wrong. The
information itself is not new to the boundary: `feedback.cues` for the same scenario is
already released and already answer-bearing.

### Two vocabularies, kept apart

`MISTAKE_KINDS` publishes slugs of its own (`released_details_or_paid`), never the engine's
codes (`SECRET_PAYMENT_INSTALL_DATA_RELEASE`). A test asserts the two sets share no value, so
a scoring code can never reach a training screen by accident, and the scoring table can change
without changing a word the learner reads.

---

## 8. The payload

Additive on the existing result. Per scenario:

```jsonc
"review": {
  "status": "mistake",              // correct | mistake | not_resolved
  "headline": "You released details, paid, installed or approved access before verifying.",
  "note": null,                     // only on not_resolved
  "learning_issue": { "key": "missed_threat", "label": "...", "description": "..." },
  "mistakes": [
    {
      "kind": "skipped_inspection",
      "stage": "inspect",
      "label": "Skipped inspection",
      "what_you_did": "You moved on without inspecting the sender...",
      "correct_action": "Check this decision signal: ...",   // this scenario, this stage
      "why_it_mattered": "Inspection is the step where this kind of item shows what it is..."
    }
  ],
  "key_cue": "...",                 // first authored cue; shown on a correct card
  "missed_cues": ["..."],           // authored cues; shown on a mistake card
  "what_it_was": "Malicious - ...",
  "correct_action": null,           // dropped once the mistakes carry their own
  "why_it_mattered": "...",         // authored impact; null on a correct card
  "safe_response": "...",           // authored prevention habit
  "your_path":    [{ "step": 1, "stage": "notify", "action": "opened_notification" }],
  "correct_path": [{ "step": 1, "stage": "notify", "action": "opened_notification" }]
}
```

And once per attempt:

```jsonc
"review_summary": {
  "scenarios": 10,
  "correct_decisions": 3,
  "scenarios_with_mistakes": 7,
  "not_resolved": 0,
  "mistakes": 15,                   // individual mistakes, across all scenarios
  "missed_threats": 1,
  "false_positives": 0,
  "unsafe_handling": 1,
  "verification_successes": 6       // SCENARIOS in which a trusted check happened
}
```

`missed_threats`, `false_positives` and `unsafe_handling` are counted from the same entries
`summary` is counted from, and a test asserts they are equal — the number at the top of the
review and the number in the outcome mix cannot drift.

---

## 9. Training vs assessment

Unchanged. The mode system was not redesigned and no mode gate was added or moved.

- **During a scenario**, neither mode reveals the disposition, the cue or the expected
  action. `ScenarioOutcome` shows the final action, and the per-scenario points only when
  `scoreVisible` — which section 3 already ties to training mode.
- **After completion**, the full review is released for both modes, which is what
  `feedback.immediate_in_training` describes: both modes read the same content and only the
  timing differs.

The review is built from a **completed** attempt only. `buildAttemptResult()` still refuses
with `409 ATTEMPT_NOT_COMPLETE` otherwise, so there is no route by which a mid-assessment
learner can read a correct action.

---

## 10. How this scales to all 100 scenarios

There is no `if (scenario === 'W01')` anywhere, and there cannot usefully be one: the review
never reads a scenario id.

| The generic part | The per-scenario part |
|---|---|
| `MISTAKE_RULES` — 11 action classes | which of them the ledger contains |
| `OMISSION_RULES` — 4 graded stages | which safe-path codes the scenario declares |
| `correctPathFor()` — one walk of six stages | the scenario's own scoring declaration + disposition |
| The card layout | `expected_safe_behavior`, `cues`, `impact`, `prevention_habit`, `result` |

A scenario that offers no verification route, or declares `CORRECT_USE` instead of
`SAFE_PIVOT`, or is legitimate rather than malicious, produces a different review with no
code change — because the difference is already in its `evaluation` block, which every one of
the 100 imported scenarios carries.

### No schema change was needed

`ScenarioDefinition` already holds everything: the five `evaluation.feedback` fields
(section 7), `evaluation.stages[].expected_safe_behavior` (per-stage safe behaviour),
`evaluation.stages[].scoring[]` (which steps exist), and `disposition`. **No field was added
and none was changed.** Scenario content is untouched.

The one field that would improve the review if it were populated is
`evaluation.stages[].expected_actions`, which the DATA-002 importer deliberately leaves
empty — the specification states expected actions in prose, not as records. The review does
not need it, because the scoring declaration already carries the same information in a form
that cannot drift from what the engine enforces.

---

## 11. Tests

| Area | Where |
|---|---|
| Mistake detection, correct path, summary, privacy — no database | `backend/tests/scenarioReview.test.js` (29) |
| The review over real HTTP, four attempt shapes, the release boundary | `backend/tests/attemptResultApi.test.js` (40, of which 13 are REVIEW-001) |
| The review on screen, including what must never render | `frontend/src/pages/ResultReview.test.jsx` (22) |
| The existing result screen, unregressed | `frontend/src/pages/ResultPage.test.jsx` (14) |

Browser verification is seeded by `backend/scripts/seedReviewDemo.js`, which plays four
differently-shaped attempts through the real HTTP API against an isolated database. It
refuses to run against `cyber_awareness_training`.
