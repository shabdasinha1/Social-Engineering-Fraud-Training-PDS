# Candidate Result Projection (RESULT-001)

**Status:** IMPLEMENTED — 5 September 2026.
**Route:** `GET /api/attempts/:attemptId/result` (also returned by `POST .../complete`)
**Service:** `backend/src/services/attemptResultService.js` · **Vocabulary:** `backend/src/constants/resultProjection.js`
**Companions:** [`ATTEMPT_API.md`](ATTEMPT_API.md) · [`SCENARIO_ENGINE.md`](SCENARIO_ENGINE.md) · [`SIMULATION_UI.md`](SIMULATION_UI.md) · [`TRAINING_FEEDBACK.md`](TRAINING_FEEDBACK.md)

> **Extended by REVIEW-001 (10 September 2026).** The same route now also returns
> `scenarios[].review` and `review_summary` — the learning review that turns this projection
> from a score readout into training feedback. Everything documented below is unchanged: the
> review is additive, it computes no score of its own, and it reads the `outcome_class`
> decided in section 4 rather than re-deriving it. See
> [`TRAINING_FEEDBACK.md`](TRAINING_FEEDBACK.md).

---

## 1. What changed, and what did not

API-001 already had this route with a deliberately minimal payload. RESULT-001 **upgraded
it additively**: every key it returned is still returned, with the same name and the same
meaning, and the section 7 blocks were added around them.

That was a deliberate constraint, not a coincidence — the UI-001 result screen consumes
this contract, and this task is server-side only. It needed no change.

```
attempt_id  status  mode  total_score  max_score          <- unchanged (API-001)
scenarios_resolved  scenarios_total  started_at  completed_at
scenarios[].{ ordinal, platform, score_0_10, outcome_code, final_stage, resolved_at }

summary  behaviour  comparison  remediation                <- added (RESULT-001)
scenarios[].{ scenario_ref, platform_label, sender, preview,
              outcome_class, max_score, path[], feedback{} }

review_summary                                             <- added (REVIEW-001)
scenarios[].review{ status, headline, learning_issue, mistakes[],
                    missed_cues[], key_cue, what_it_was, correct_action,
                    why_it_mattered, safe_response, your_path[], correct_path[] }
```

`attemptService.attemptResultFor()` keeps its name and signature and delegates to
`buildAttemptResult()`, so both call sites — `/complete` and `/result` — return the same
projection and cannot drift apart.

## 2. Source of truth

| Fact | Comes from |
|---|---|
| Per-scenario score | `ScenarioRun.score_0_10` (engine-clamped, committed) |
| Final action | `ScenarioRun.outcome_code` |
| Action path | `ScenarioEvent`, ordered by `sequence` |
| Disposition, family, trigger, feedback | `ScenarioDefinition` (server-only) |
| Total | **recomputed** from the ten run scores |

Nothing is derived from anything the client submitted. The stored `Attempt.total_score` is
treated as a cache and checked against the recomputed sum; a mismatch fails the request.

## 3. Integrity gate

Before a result is built, all of the following must hold. A failure returns
**`500 RESULT_INTEGRITY`** and **repairs nothing** — silently patching production data
would hide the disagreement that caused it.

- exactly 10 runs
- ordinals exactly 1–10, no gaps, no repeats
- every run resolved
- every score an integer in 0–10
- the stored total equals the sum of the ten scores
- the pinned definition exists for every run

`{attempt_id, ordinal}` is a unique index, so the database refuses a duplicate position
before the projection ever sees it; the projection check is the second line of defence.

## 4. Missed threat vs false positive

Four classes, decided server-side from `ScenarioDefinition.disposition`, the run's
`outcome_code` and the event ledger:

REVIEW-001 gives these classes learner-facing names (`review.learning_issue`) by lookup, and
never re-derives them — so the review and the summary cannot disagree on screen about whether
a scenario was a missed threat.

| Class | When |
|---|---|
| `handled_safely` | Final action matches the disposition **and** no critical unsafe event occurred |
| `missed_threat` | A malicious item not stopped — **or** stopped only after a critical unsafe action |
| `false_positive` | A legitimate item reported, blocked or ignored |
| `unsafe_handling` | A legitimate item kept, but reached through a critical unsafe action |

> The final action alone is not enough. A learner who submits card details and *then*
> reports has not handled the threat, and the outcome code by itself would say they had.
> Critical codes come from `SCORING_EVENTS[...].critical`, so the release checklist's
> definition of "critical unsafe action" is the one used here.

## 5. Action path

`ScenarioEvent` rows ordered by **`sequence`**, never by insertion order or timestamp —
`(run_id, sequence)` is the unique index the engine writes under, so it is the only
ordering that cannot be wrong.

Each step is exactly `{ step, stage, action }`. `PATH_LABELS` maps each engine event code
onto a neutral action label; **an unmapped code is dropped**, so a code added later is
invisible to the learner until someone deliberately labels it. No event code, point delta,
metadata key, event id or timestamp reaches the learner.

## 6. Behaviour breakdown

By `platform`, `family`, `trigger` (all from the scenario's **server-side canonical
classification**, never from learner behaviour) and by action `stage`.

Each bucket: `{ key, label, scenarios, points, max_points, missed_threats, false_positives }`.
A scenario with several triggers counts once in each of its trigger buckets, so trigger
totals may exceed ten by design.

The stage breakdown reports `scenarios_reached` and `constructive_actions` for `inspect`,
`branch`, `verify` and `resolve`. Notify and open carry no judgement.

## 7. Per-case feedback

Verbatim from `evaluation.feedback` — `result`, `cues`, `safe_action`, `impact`,
`prevention_habit`. **Nothing is generated.** A definition without feedback yields nulls
and an empty cue list rather than invented content.

Both modes receive feedback at the result: section 4's `immediate_in_training` governs
*mid-attempt* timing, and the result is by definition at attempt completion.

## 8. Comparison eligibility

A previous attempt is compared only when it is the same learner's, completed earlier, and
matches on **all** of `mode`, `content_version`, `taxonomy_version`,
`trigger_taxonomy_version`.

The query is scoped to `attempt.profile_id`, so another learner's data cannot enter it.
When nothing comparable exists the response says so — `no_previous_attempt` or
`not_comparable` — rather than comparing against something incomparable. On
`not_comparable`, only the **field names** that differ are named; no value from the other
attempt is echoed.

## 9. Remediation

Two to three recommendations, drawn from families where the learner did not score full
marks, worst first (missed threats, then false positives, then the widest points gap).

> **Families, not scenario ids.** Naming the scenarios to practise would hand the learner a
> partial answer key for a bank they will meet again, and no practice-mode workflow exists
> yet for an id to resolve against. Each recommendation carries `family_key`, a label, a
> blame-free reason, the points gap and `practice_scenarios_available` — enough for a
> future practice mode to launch without publishing which scenarios those are.

Only **active** scenarios are counted, and a family with no active scenarios is never
recommended. A perfect attempt gets an empty list.

Nothing here diagnoses. The reasons describe what happened in this attempt — never a
trait, a susceptibility, or an emotional state.

## 10. The security boundary

### Released, and why

| Released | Authority |
|---|---|
| `feedback` (result, cues, safe action, impact, habit) for the ten scenarios played | §7 "For each case: disposition, observed cues, safe response, likely impact and one habit" |
| Family and trigger **labels, in aggregate**, across those ten | §7 "Behavior breakdown: platform, attack family, trigger and action-stage" |
| `scenario_ref` (e.g. `W12`) | Already published by `/current-run` during play |
| Sender and notification preview | The learner already saw both |

### Two overlaps that look like leaks and are not

Both were found by the leakage tests, and both are the client authoring one sentence into
two columns:

- **`evaluation.end_state` appears** — because DATA-002 imported the same client sentence
  as `feedback.impact`, which §7 requires. The test asserts the two are *identical*; if
  they ever diverge, its appearance becomes a real leak again and the test fails.
- **Some stage-6 `expected_safe_behavior` appears** — generic boilerplate ("Complete the
  resolution and return to the dashboard.") that is also `feedback.safe_action`. Only an
  **exact** match is exempt; every answer-bearing stage-3 to stage-5 decision signal still
  fails the test.

A third, stated plainly rather than discovered: **`feedback.result` names the raw family in
prose** ("Malicious - Account takeover / OTP theft"). §7 requires that line.

A fourth, found only by running the suite repeatedly against different seeds: some raw
triggers are single ordinary words — `Routine`, `Familiarity` — which collide both with
client-authored feedback prose and with this build's own aggregate trigger labels
("Routine expectation"). A blanket substring ban on them is therefore meaningless.

### What the tests actually assert

The property that matters is **no scenario entry carries its own classification** — that
is what would turn the result into an answer key. So the leakage test strips `feedback`
from a scenario row and asserts neither the raw nor the canonical family or trigger
survives in what is left. The two places those strings legitimately appear are outside
that check: per-case `feedback`, and the aggregate breakdown.

### An accepted inference, stated openly

Publishing both the per-scenario list and the aggregate breakdown means a determined
learner could correlate them — a family bucket holding one scenario, matched against the
one scenario with that score. This is inherent to §7 requiring both, and it concerns only
the ten scenarios for which they already hold full feedback. Nothing about the other
ninety is inferable.

### Never released

`evaluation.title` (it states the answer outright — DATA-001) · `expected_actions` ·
answer-bearing `expected_safe_behavior` · `learner_flow` · `scoring_text` · per-stage
scoring · `points_delta` · `score_running` · event codes · raw event metadata · event ids ·
`intent_key` · the learner's `rationale` · `canonical_family` / `canonical_triggers` /
`disposition` / `level` / `military_flag` **as fields** · `seed` · `selection` ·
`scenario_sequence` · `profile_id` · **anything at all about the other ninety scenarios**.

### Ownership

Unchanged from API-001: `candidate._id === Attempt.profile_id`, enforced by
`findOwnAttempt`. Another candidate's attempt returns **404, not 403** — a 403 would
confirm the attempt exists.

An incomplete attempt returns `409 ATTEMPT_NOT_COMPLETE`; no partial result is fabricated.
`GET` is a pure read, so it is idempotent and writes nothing.

## 11. Testing

| Suite | Tests | Runs under |
|---|---|---|
| `tests/attemptResult.test.js` | 26, no database | `npm test` |
| `tests/attemptResultApi.test.js` | 28, real HTTP + replica set | `npm run test:engine` |

The unit suite covers the rules that decide what is true — integrity, outcome
classification, path ordering, aggregation. The integration suite proves the boundary over
the wire: ownership, the incomplete-attempt refusal, idempotency, tampered totals, missing
and duplicated runs, missed threat vs false positive, path ordering against the real
ledger, comparison eligibility, remediation limits and active-only recommendations, and
leakage by **field name and by actual server-only string** from the ten definitions in play.

## 12. Who consumes this

`frontend/src/pages/ResultPage.jsx` and `frontend/src/components/result/` (UI-003). That
layer is **presentation only**: it sums no score, classifies no outcome and reconstructs no
taxonomy. `frontend/src/constants/result.js` maps this API's stable slugs -
`outcome_class`, path `action`, `stage`, comparison `reason` - to English, and a slug with
no entry falls back to itself rather than being hidden or guessed at.

A consequence worth knowing when reading a rendered result: `feedback.safe_action` is
sometimes the client's generic stage-6 boilerplate, and `prevention_habit` sometimes
repeats the single cue. That is authored content passed through verbatim, and the UI does
not substitute for it.

## 13. Not in this task

No practice-mode workflow and no admin surface. Remediation names families, so there is
nothing for a practice mode to resolve yet.
