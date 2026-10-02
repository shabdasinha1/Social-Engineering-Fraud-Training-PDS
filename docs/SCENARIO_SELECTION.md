# Scenario Selection (SELECT-002)

**Status:** IMPLEMENTED — 4 September 2026.
**Solver:** `backend/src/services/scenarioSelectionService.js` (pure, no I/O)
**Persistence:** `backend/src/services/attemptService.js`
**Models:** `backend/src/models/Attempt.js`
**Vocabulary:** `backend/src/constants/scenarioSelection.js` · **PRNG:** `backend/src/utils/seededRandom.js`
**Companions:** [`SCENARIO_ENGINE.md`](SCENARIO_ENGINE.md) · [`SCENARIO_IMPORT.md`](SCENARIO_IMPORT.md) · [`ATTACK_FAMILY_TAXONOMY.md`](ATTACK_FAMILY_TAXONOMY.md) · [`TRIGGER_TAXONOMY.md`](TRIGGER_TAXONOMY.md)

---

## 1. Constraints

All from specification section 5. None is an engineering preference.

| Rule | Value |
|---|---|
| Scenario count | exactly **10** |
| Disposition | exactly **8 malicious + 2 legitimate** |
| Legitimate platforms | the two must be on **different platforms** |
| Platform allocation | rotating **3 / 3 / 2 / 2** |
| Difficulty | exactly **3 Easy / 4 Medium / 3 Hard** |
| Military context | **2–4** per attempt |
| Trigger variety | **≥ 5 distinct canonical triggers** |
| Attack family | **no canonical family more than twice** |
| Repeat control | exclude the learner's **most recent 20** scenario ids where possible |
| Adaptation | **none** — difficulty never changes mid-attempt or in response to the learner |

Everything except recent-20 is **hard**. Recent-20 is the only relaxable rule, and only
minimally (§6).

## 2. Classification axes

Selection reads only the **canonical** fields, never the raw client strings:

- `canonical_family` — 19 values, the family cap. The raw client `family` has 99 distinct
  values, which would make "no more than twice" inert (see `ATTACK_FAMILY_TAXONOMY.md`).
- `canonical_triggers` — 22 values, an **array**. One scenario contributes every trigger
  it carries: `authority + urgency` counts as two toward the minimum of five, but a
  trigger appearing in three scenarios still counts once.
- `military_flag` — authoritative, set at import from the trigger suffix. Never inferred
  from text at selection time.

The retired EVI taxonomy is not used and no EVI field exists.

## 3. Platform rotation

```
PLATFORM_ORDER   = [whatsapp, instagram, email, sms]
PLATFORM_PATTERN = [3, 3, 2, 2]
quota[platform i] = PATTERN[(i + attemptIndex) % 4]
```

`attemptIndex` is the learner's count of prior attempts, so the allocation advances every
attempt and repeats with period 4. Across any four consecutive attempts **every platform
receives exactly 3+3+2+2 = 10 scenarios.**

**Driven by history, not by the seed — deliberately.** A seed-derived rotation is balanced
only in expectation; rotating by attempt index makes "long-run exposure is balanced"
exactly true rather than approximately. The seed still decides *which* scenarios are
chosen, so two learners on their first attempt get the same platform quota but different
scenarios. The rotation is never exposed to the learner.

## 4. Algorithm

**Not rejection sampling.** The full constraint set yields roughly 1.2% against random
draws (§15.24), so "pick ten and test" would burn ~80 draws per success and collapse under
exclusions. The selector *constructs* a solution.

### Slot matrix, then depth-first assignment

1. **Seed** → deterministic PRNG.
2. **Platform quota** from the rotation.
3. **Legitimate platform pair** — the ≤6 valid pairs, deterministically ordered by seeded
   rank. Tried in order; the first that solves wins.
4. **Slot matrix** — ten concrete slots, each carrying a fixed `platform` and
   `disposition`. Difficulty is *not* pinned per slot: the specification states difficulty
   as a whole-attempt quota (3/4/3), not per platform, so fixing it per slot would invent
   structure the client did not specify. It is enforced as a running quota instead.
5. **DFS assignment**, most-constrained-slot first — the legitimate slots (only five
   candidates per platform) are decided while the search still has freedom, rather than
   discovered impossible at depth nine.

### Pruning (forward checking)

At every node, each rule cuts a whole subtree rather than one leaf:

| Check | Prunes when |
|---|---|
| Difficulty | remaining quota ≠ remaining slots, or a remaining level has fewer slots able to serve it than it needs |
| Slot viability | any remaining slot has zero eligible candidates |
| Military | current count > 4, or best case over remaining slots cannot reach 2 |
| Family | a family already used twice is dropped from eligibility |
| Triggers | current distinct ∪ everything still reachable cannot reach 5 |
| Recent budget | recent scenarios used > the current `maxRecent` |
| Uniqueness | scenario already placed |

Candidate order within a slot is a **seeded rank keyed by `scenario_id`**, not by array
position — so two pools holding the same scenarios in different orders rank identically
and database insertion order cannot influence the result. Non-recent candidates are
ordered ahead of recent ones, so a zero-relaxation solution is always found first.

A `MAX_SEARCH_STEPS` budget (200,000) makes a pathological pool fail fast rather than
search forever. In practice the real bank solves in a few hundred steps.

### Presentation order

Section 3 says "Do not lock apps into a fixed sequence", so the ten scenarios get a seeded
shuffle followed by a deterministic repair pass that breaks any run of more than two
consecutive scenarios from one platform. Deterministic for a seed, different across seeds.

## 5. Independent validation

`validateSelection()` re-checks a finished selection against **every** rule from scratch
and knows nothing about how the solver works, so a bug in the search cannot hide behind
shared logic. The solver runs it on its own output and raises
`SELECTION_INTERNAL_ERROR` if construction and verification ever disagree.

## 6. Recent-20 exclusion and minimal relaxation

Two passes, minimising **the number of recent scenarios used** — which is how the
specification measures it.

```
for maxRecent = 0, 1, 2, … :
    solve with a hard budget of `maxRecent` recent scenarios
    first solution wins
```

The budget is enforced *inside* the search, so the solver chooses **which** recent items
to re-admit rather than being handed a fixed list.

> **Why that matters.** An earlier implementation re-admitted the recent window
> oldest-first, one at a time. On a pool where the five oldest recent items were all SMS
> legitimate scenarios, it needed **six** re-admissions before two different platforms
> became available — when a well-chosen **two** would do. Minimising a prefix is not
> minimising a count. A regression test pins this.

Only recent-20 relaxes. If no `maxRecent` yields a solution, selection **fails** with
`SELECTION_CONSTRAINT_UNSATISFIABLE` rather than breaking a composition rule.

Recorded on the attempt (never learner-facing):

```json
"recent_exclusion": {
  "requested": 20, "history_size": 20, "excluded": 18,
  "relaxed": true, "allowed_recent_ids": ["W21", "E11"]
}
```

**History source:** the new pipeline's own `Attempt` → `ScenarioRun` records, newest
first. Deliberately **not** `Candidate.seenScenarios`, which references legacy `Scenario`
ObjectIds rather than `scenario_id` strings and belongs to the old journey.

## 7. Determinism

| Input | Effect |
|---|---|
| `seed` | which scenarios are chosen, and their order |
| `attemptIndex` | platform rotation only |
| pool contents | the candidate set |
| pool **order** | **none** — ranking is keyed by `scenario_id` |

Same seed + same pool + same history + same algorithm version ⇒ **byte-identical
sequence**, on any machine, after any restart. `Math.random()`, `crypto.randomInt` and the
clock are not used anywhere in the solver; the only randomness is `createSeed()` when a
*new* attempt is created. The PRNG (xoshiro128\*\*, seeded via SHA-256) holds no
module-level state, so two generators from one seed never interfere.

`SELECTION_ALGORITHM_VERSION` (`1.0.0`) is defined in one place and persisted on every
attempt, so a future algorithm change leaves old attempts reproducible under their own
version. Old attempts are never regenerated.

## 8. Content version

Only `active: true` definitions are eligible. DATA-002 enforces a single active version per
`scenario_id`; `loadSelectionPool()` re-checks and raises
`SELECTION_INVALID_CONTENT_VERSION` if a scenario ever has two active versions, so a data
fault surfaces instead of producing a silently mixed bank. The chosen ten must all share
one content version, which is persisted on the attempt and pinned onto each ScenarioRun.

## 9. Persistence and freezing

`createAttempt()` writes the `Attempt` **and all ten `ScenarioRun` records in one
transaction**, so an attempt claiming ten scenarios can never coexist with seven runs. It
requires the §15.25 replica-set topology and refuses to run without it — no non-atomic
fallback.

Runs are created in exactly the state ENGINE-001 expects (`active`, stage `notify`,
sequence 0, score 0) and are not started here.

**The sequence is frozen.** A `pre('save')` hook rejects any later modification of
`scenario_sequence`, `seed` or `selection`. No learner behaviour, later history change,
refresh or reconnect can reselect. One in-progress attempt per learner is enforced;
a second request gets `SELECTION_ATTEMPT_IN_PROGRESS`.

> **Mongoose 9 note.** Middleware is promise-based and calls hooks with no arguments. A
> `pre('save', function (next) {…})` hook throws `next is not a function` on every save —
> which is exactly what happened here before it was caught. Hooks throw to reject.

## 10. Errors

| Code | HTTP | Meaning |
|---|---|---|
| `SELECTION_POOL_INSUFFICIENT` | 409 | Fewer than 10 eligible scenarios |
| `SELECTION_CONSTRAINT_UNSATISFIABLE` | 409 | No valid attempt exists, even with full relaxation |
| `SELECTION_TRANSACTION_UNAVAILABLE` | 503 | Topology cannot commit transactions |
| `SELECTION_INVALID_PROFILE` | 400 | Missing profile, or attempt not found |
| `SELECTION_INVALID_CONTENT_VERSION` | 409 | Multiple active versions, or a mixed selection |
| `SELECTION_INVALID_MODE` | 422 | Mode outside `assessment` / `training` |
| `SELECTION_ATTEMPT_IN_PROGRESS` | 409 | The learner already has an open attempt |
| `SELECTION_INTERNAL_ERROR` | 500 | Constructor and validator disagreed |

`SELECTION_RECENT_EXCLUSION_RELAXED` is **not** an error — it is a relaxation marker
recorded on the attempt.

## 11. Security boundary

The server decides everything. A caller may supply only an authenticated `profileId` and a
`mode`; it can **not** supply scenario ids, disposition, difficulty, platform, family,
triggers, military flag, seed, algorithm version or a recent-exclusion override. `seed` is
accepted by `createAttempt` only for replay in tests and internal audit, never from a
request body.

`Attempt.toCandidateJSON()` returns `attempt_id, mode, status, total_scenarios,
started_at, completed_at, total_score` and nothing else — **no seed**, no selection
metadata, no composition, no sequence, no profile id. The pool query never loads
`evaluation`, and the selection result carries no evaluation content.

**History is used only for repeat control and rotation.** It is never used to infer
personality, vulnerability, skill or any behavioural label — §5's interpretation safeguard.

## 12. Testing

| Suite | Tests | Database |
|---|---|---|
| `tests/scenarioSelection.test.js` | 34 | **None** — solver, validator, PRNG |
| `tests/attemptCreation.test.js` | 20 | **Real transactions** |

The solver suite runs against the **real imported 100-scenario bank**, and asserts every
constraint across **400 seeds × 4 rotations**, plus adversarial pools: scarce military,
family bottlenecks, thin trigger diversity, single-trigger pools, legitimate scenarios
confined to one platform, and recent-20 colliding with the military and legitimate pools.

```bash
npm test              # solver suite; integration suites skip loudly without a replica set
npm run test:engine   # starts a throwaway replica set, runs ENGINE-001 + SELECT-002
```

`npm run test:engine` runs the two integration suites **sequentially, each in its own
database** — they both seed and wipe `ScenarioDefinition`, and sharing one database made
them race.

## 13. What remains

| Task | What it adds |
|---|---|
| Orchestration | Serving the frozen sequence to the dashboard, one run at a time |
| `SCORE-002/003` | Attempt-level 0–100 aggregation from resolved runs into `total_score` |
| `RESULT-001` | Behaviour breakdown, using the composition already persisted |
| API routes | Attempt creation endpoint, once ownership rules are settled |
| `DATA-003` | Structured synthetic assets — orthogonal to selection |
