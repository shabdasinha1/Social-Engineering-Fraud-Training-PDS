# Canonical Trigger Taxonomy, and the EVI Decision

**Status:** DESIGN RECORD — approved as an **implementation decision** on 4 September 2026 (ALIGN-005b, resolving Question 11 in `PROJECT_MASTER_PLAN.md` §15.14).
**Trigger taxonomy version:** `1.0.0`
**Applies to:** the 100-scenario client bank in `Interactive_Social_Engineering_Scenario_UI_Development_Specification.pdf` (v1.0, 02 September 2026).
**Companion record:** [`ATTACK_FAMILY_TAXONOMY.md`](ATTACK_FAMILY_TAXONOMY.md) (ALIGN-005a).

> ## ⚠ OURS, NOT THE CLIENT'S
>
> The client specification supplies a free-text `Primary trigger` string per scenario and
> the §5 rule *"At least five psychological triggers"*. It does **not** define a trigger
> vocabulary, a decomposition rule, or what counts as one trigger.
>
> The canonical vocabulary and decomposition rule below are **derived by the
> implementation team**. They must never be represented to the client as a
> client-specified requirement, nor used to justify any change to scenario content.
>
> **The `>= 5` threshold itself IS the client's**, and is implemented exactly as written.
> We have not raised, lowered or reinterpreted it.
>
> Nothing here has been implemented. This is a design record only.

---

## 1. Complete inventory of the raw trigger field

Extracted independently from the PDF (not reused from earlier analysis) and cross-checked
against the earlier pass — **0 mismatches across 100 scenarios**.

### Hygiene — the field is exceptionally clean

| Property | Finding |
|---|---|
| Non-ASCII characters | **none** |
| Leading / trailing whitespace | **0 scenarios** |
| Double spaces | **0** |
| Alternative delimiters `;` `,` `&` `/` `-` `" and "` | **0 occurrences of any** |
| `+` always surrounded by single spaces | **yes, 100/100** |
| `\|` occurrences | 35, always exactly one |
| Distinct suffixes after `\|` | **one**: `FICTIONAL MILITARY CONTEXT` (35 scenarios) |

`+` is therefore the **only** composition delimiter in the bank, and `|` is a
military-context marker rather than a trigger.

### Structure

| Measure | Value |
|---|---|
| Distinct raw composite strings (left of `\|`) | **63** |
| Distinct raw primitives (after splitting on `+`) | **31** |
| Total primitive occurrences | **192** |
| Scenarios with 1 / 2 / 3 primitives | **12 / 84 / 4** |
| Scenarios repeating a primitive within themselves | **none** |

> **Correction to `PROJECT_MASTER_PLAN.md` §15.14 q11.** That entry said "about 66
> composite strings". The exact figure is **63**. The 31-primitive count and the
> per-primitive frequencies quoted there are confirmed correct.

### Raw primitive frequencies (31)

| n | primitive | n | primitive | n | primitive |
|---|---|---|---|---|---|
| 40 | authority | 6 | scarcity | 2 | commitment |
| 26 | urgency | 6 | trust | 2 | secrecy |
| 18 | fear | 5 | convenience | 2 | care |
| 17 | routine | 4 | flattery | 2 | expert status |
| 11 | greed | 4 | pride | 2 | compliance |
| 10 | curiosity | 3 | helpfulness | 1 | time pressure · social validation · status |
| 8 | familiarity | 3 | isolation | 1 | embarrassment · shame · duty |
| 7 | empathy | 3 | reciprocity | 1 | anticipation · collaboration · confusion |
| | | 2 | social proof | | |

### One trap the inventory found

Four primitives are **multi-word**: `expert status`, `social proof`, `social validation`,
`time pressure`. Splitting on whitespace instead of `+` would shatter these into
meaningless tokens (`expert`, `status`, …). The decomposition rule below splits on `+`
only, and the importer must never fall back to whitespace splitting.

## 2. What counts as one trigger

Three readings were evaluated **empirically**, not by preference. Each was applied to the
same 20,000 draws that already satisfied every other settled constraint:

| Reading | Distinct per attempt (min / mean / max) | Rejected by `>= 5` |
|---|---|---|
| **A** — the whole composite string is one trigger | 6 / 9.56 / 10 | **0 of 20,000 (0.000%)** |
| **B** — each raw primitive counts | 4 / 11.40 / 17 | 1 of 20,000 (0.005%) |
| **C** — each **canonical** trigger counts *(chosen)* | 4 / 10.83 / 17 | 1 of 20,000 (0.005%) |

**Reading A is rejected.** Its observed minimum is 6, so with 63 composite strings across
a 10-scenario draw it is *mathematically incapable* of falling below 5 — the client's rule
could never bind under it. It also contradicts the plain meaning of "psychological
trigger": *Fear + urgency* is two levers, not one.

**Reading C is adopted** over B because B treats obvious synonyms as different levers —
`urgency` and `time pressure` would count as two, inflating apparent diversity without any
behavioural difference.

**Option C-with-exceptions (some composites kept atomic) was considered and rejected.**
No composite in the bank is idiomatic or non-compositional; all 63 are plain conjunctions
of independently meaningful levers. There is no case for treating any of them as atomic.

## 3. Decomposition and normalization rule

```
raw:  "Authority + urgency | FICTIONAL MILITARY CONTEXT"

1. Partition once on '|'.
   Right side, when present, is always the literal 'FICTIONAL MILITARY CONTEXT'
   -> sets military_flag. It is NEVER a trigger. Any other suffix is an import error.
2. Split the left side on '+'  (never on whitespace).
3. For each part: trim, collapse internal whitespace, casefold.
4. Map through ALIAS to a canonical id. An unlisted primitive is an IMPORT ERROR,
   not a silent pass -- the vocabulary is closed.
5. De-duplicate, preserving first-appearance order.

result: canonical_triggers = ["authority", "urgency"],  military_flag = true
```

Ordering is preserved from the raw string so the client's own emphasis (the *primary*
lever first) survives; set semantics are used for the constraint, order for display.

## 4. The canonical vocabulary — 22 triggers

31 raw primitives fold to 22 canonical ids. **Nine folds**, each a genuine synonym or the
same underlying lever — never a merge made to shrink the vocabulary:

| Raw primitive | Folds to | Why |
|---|---|---|
| `time pressure` | `urgency` | Same lever, different wording |
| `anticipation` | `routine` | "I was expecting this" — premise alignment |
| `collaboration` | `routine` | Normal work-process cooperation |
| `care` | `empathy` | Concern for another's wellbeing; both occurrences are legitimate scenarios |
| `social validation` | `pride` | Esteem / self-image |
| `status` | `pride` | Esteem / self-image (wanting a status symbol) |
| `isolation` + `secrecy` | `isolation_secrecy` | Both exist to **prevent consultation** — the single mechanism that defeats independent verification |
| `duty` + `compliance` | `duty_compliance` | Obligation to act, distinct from raw authority |
| `shame` + `embarrassment` | `shame_embarrassment` | Fear of social exposure, differing only in intensity |

**Deliberately kept separate**, despite being close: `trust` vs `familiarity`
(reliance vs recognition); `urgency` vs `scarcity` (limited time vs limited quantity);
`empathy` vs `helpfulness` (feeling for others vs wanting to be useful); `flattery` vs
`expert_status` (generic compliment vs being positioned as the professional authority — a
specific and dangerous elicitation technique); `routine` vs `convenience` (fits process vs
is easier).

| Canonical id | Label | n |
|---|---|---|
| `authority` | Authority | 40 |
| `urgency` | Urgency | 27 |
| `routine` | Routine / expectation | 19 |
| `fear` | Fear | 18 |
| `greed` | Greed / reward | 11 |
| `curiosity` | Curiosity | 10 |
| `empathy` | Empathy / care | 9 |
| `familiarity` | Familiarity | 8 |
| `scarcity` | Scarcity | 6 |
| `trust` | Trust | 6 |
| `convenience` | Convenience | 5 |
| `isolation_secrecy` | Isolation / secrecy | 5 |
| `pride` | Pride / status | 5 |
| `flattery` | Flattery | 4 |
| `helpfulness` | Helpfulness | 3 |
| `reciprocity` | Reciprocity | 3 |
| `duty_compliance` | Duty / compliance | 3 |
| `social_proof` | Social proof | 2 |
| `commitment` | Commitment / consistency | 2 |
| `shame_embarrassment` | Shame / embarrassment | 2 |
| `expert_status` | Expert status | 2 |
| `confusion` | Confusion / ambiguity | 1 |

Total occurrences **191**. No canonical id is unused. Per scenario: **13 have one, 83 have
two, 4 have three**.

**Consolidation changed exactly one scenario's count.** `I06` (*Where Was This Exercise?*),
raw `Pride + social validation`, resolves to the single canonical trigger `pride` because
both halves are the same esteem lever. This is recorded rather than hidden; every other
scenario retains its full raw arity.

`confusion` (`S23`) is retained as a **singleton**. Deliberate ambiguity in a payment
interface is a genuinely distinct lever with no synonym in the bank, and per the rule
against collapsing distinct mechanisms merely to shrink a vocabulary it was kept. Being a
singleton it contributes to diversity but cannot support analytics on its own.

## 5. The `>= 5` selection rule

**Implemented exactly as the client specifies.**

```
attempt.trigger_set = union of canonical_triggers over the 10 selected scenarios
constraint:           len(attempt.trigger_set) >= 5
```

**Distinct triggers, not occurrences.** The client's wording is "at least five
psychological triggers", and the §5 heading is *Variety*. Counting occurrences would be
satisfied by ten scenarios all using `authority`, which is precisely the outcome the rule
exists to prevent. Occurrence counts are still recorded per attempt for §7 analytics — but
they do not drive the constraint.

### Honest assessment: this is a floor, not a diversity driver

Under the adopted reading the rule rejects **1 draw in 20,000 (0.005%)**. Ten scenarios
naturally yield a **mean of 10.83** distinct canonical triggers.

**This is a materially different situation from the attack-family rule.** There, the
constraint could *never* bind (0 of 20,000) because the label granularity was wrong, and
we fixed the granularity. Here the granularity is right and the observed minimum is 4 —
below the threshold — so the rule **does** exclude the genuine worst case. A floor that
rarely triggers is a correctly designed floor, not a broken one.

**We have not raised the threshold.** For decision support only, here is what other
thresholds would reject on the same 20,000 draws:

| Threshold | Rejected |
|---|---|
| `>= 5` *(client's value, implemented)* | 0.005% |
| `>= 7` | 0.185% |
| `>= 8` | 1.410% |
| `>= 9` | 6.560% |
| `>= 10` | 19.395% |
| `>= 11` | 41.790% |

If an active diversity driver is ever wanted, `>= 9` is where the constraint starts doing
real work. **That would be a change to a client-specified value and must not be made
unilaterally.** Recorded here so the option is costed, not adopted.

## 6. Feasibility and interaction testing

All experiments run against the actual 100-scenario bank with fixed, stated seeds.
A draw is *base-valid* when it satisfies every settled constraint **except** the trigger
rule — 8 malicious + 2 legitimate, the two legitimate from different platforms, 3E/4M/3H,
2–4 military, rotating 3/3/2/2 platform allocation, and max 2 per canonical attack family.
The trigger rule is then applied to base-valid draws only, isolating its own contribution.

| Experiment | Seed | Result |
|---|---|---|
| Rejection rate of `>= 5` | 20260904 | **1 / 20,000 (0.005%)** |
| Distinct canonical triggers per attempt | 20260904 | **min 4 · mean 10.83 · max 17** |
| All six 3/3/2/2 allocations feasible | 7 | **6 / 6 feasible** |
| Random recent-20 exclusion | 99 | **0 failures / 300 trials** |
| Realistic two-attempt history (16 malicious + 4 legitimate excluded) | 99 | **0 failures / 300 trials** |
| Corner: exclude the 20 highest-trigger-frequency scenarios | 5 | feasible |
| Corner: exclude all 22 `authority`-triggered scenarios | 5 | feasible |
| Corner: exclude every scenario carrying a rare trigger (n ≤ 3) | 5 | feasible |
| Corner: exclude all 20 legitimate scenarios | 5 | **infeasible — expected and unreachable** |

The single infeasible corner is the same pathological case already recorded in
`PROJECT_MASTER_PLAN.md` §15.7: an attempt needs 2 legitimate scenarios, so excluding all
20 makes selection impossible by construction. A recent-20 window spans two attempts and
can contain at most 4 legitimate items, so it cannot occur in practice.

**Not too restrictive, not too weak.** It is too weak to shape diversity on its own, and
diversity is instead delivered by the bank's own composition; but it is not too
restrictive — it never blocked a build in any realistic scenario.

### Engineering finding: do not use rejection sampling

Across 2,000 random draws per allocation, only **22–29** were fully valid — roughly a
**1.2% yield**, or ~80 attempts per success, and worse under exclusions. `SELECT-002` must
build to the quotas directly (constraint-directed construction with backtracking) rather
than sample-and-test. This is a performance property of the *combined* constraint set, not
of the trigger rule.

## 7. Interaction with the attack-family taxonomy

The two dimensions are **near-independent**, which is what we needed.

- Attempt-level correlation between distinct families and distinct triggers:
  **Pearson r = +0.106** (families mean 8.45, triggers mean 10.83). Trigger diversity is
  not a second family constraint in disguise.
- Military representation is **completely unaffected**: mean military scenarios per attempt
  is **3.101** both before and after applying the trigger rule.
- `operational_elicitation`, the largest family (10 members), spans **10 distinct
  triggers** — maximum spread.

**Six families do imply a trigger** (every member shares it). This is a one-way
implication only — the trigger appears widely outside the family, so it never acts as a
family proxy:

| Family | n | Trigger shared by all members | That trigger's total in the bank |
|---|---|---|---|
| `identity_data_harvesting` | 5 | `authority` | 40 |
| `investment_and_task_fraud` | 5 | `greed` | 11 |
| `coercion_and_extortion` | 4 | `fear` | 18 |
| `relationship_grooming_fraud` | 3 | `trust` | 6 |
| `impersonation_emergency_payment` | 3 | `empathy` + `urgency` | 9 / 27 |
| `legit_system_confirmation` | 7 | `routine` | 19 |

These are substantively correct — extortion *is* fear-driven; investment fraud *is*
greed-driven — and recorded so no one later mistakes the redundancy for a modelling error.

## 8. EVI — the existing model, and the decision

### What EVI actually is today

`EVI_CATEGORIES` in `backend/src/constants/assessment.js` holds seven values:
`authority_fear`, `urgency`, `greed_reward`, `empathy_trust`, `curiosity`,
`romance_attraction`, `routine_convenience`. They appear only as
`Scenario.evaluation.eviTags` on the 40 legacy scenarios, and
`docs/QUESTION_ENGINE_DESIGN.md` §12 states plainly: *"EVI calculation is not implemented
in BE-000."*

**EVI has never been computed.** It is scenario tagging data and nothing else.

### It measures the same construct as triggers — less faithfully

| EVI category | Canonical trigger equivalent |
|---|---|
| `authority_fear` | `authority` **+** `fear` — two distinct levers conflated |
| `empathy_trust` | `empathy` **+** `trust` — two distinct levers conflated |
| `routine_convenience` | `routine` **+** `convenience` — two distinct levers conflated |
| `urgency` | `urgency` |
| `greed_reward` | `greed` |
| `curiosity` | `curiosity` |
| `romance_attraction` | **none — this is not a lever.** It is an attack *family* (`relationship_grooming_fraud`), and belongs on the family axis |

EVI covers **9 of the 22** canonical triggers. **13 have no EVI equivalent at all**:
`familiarity`, `scarcity`, `flattery`, `pride`, `helpfulness`, `isolation_secrecy`,
`reciprocity`, `social_proof`, `commitment`, `expert_status`, `duty_compliance`,
`shame_embarrassment`, `confusion`.

The most damaging omission is **`isolation_secrecy`** — the lever that most directly
opposes the client's central defence behaviour (`TRUSTED_VERIFY`, +3). An EVI-based report
could not tell an instructor that a learner is susceptible to "don't tell anyone" pressure,
which is precisely the finding the product exists to surface.

### Three further reasons EVI does not survive

1. **Provenance.** EVI comes from the *superseded draft* proposal. `PROJECT_MASTER_PLAN.md`
   §12 item 15 already records that the approved proposal removed the EVI category table,
   and the new client specification never mentions EVI. It requires `trigger` (§6
   `ScenarioDefinition`), trigger variety (§5) and a trigger breakdown (§7).
2. **Zero migration cost.** `eviTags` lives on the `Scenario` model, which §15.16 already
   classifies **D — replace**. EVI dies with it. No computed EVI data exists to migrate.
3. **The name conflicts with the client's own safeguards.** §5: *"Do not label a learner
   psychologically vulnerable from a single mistake."* §7: *"do not diagnose personality or
   emotional state."* An "Emotional **Vulnerability** Index" asserts exactly the framing
   both clauses prohibit.

### Decision

**EVI is RETIRED as a data model, as a selection input, and as an analytics dimension.**
`EVI_CATEGORIES` and `evaluation.eviTags` are superseded and are removed with the legacy
`Scenario` model in Phase 1. Canonical trigger analytics replaces EVI entirely and
strictly supersets it.

**One point is explicitly *not* ours to close.** "EVI" was a **user-chosen label** for the
results profile (recorded 1 September 2026), selected over the client PRD's own suggested
"Manipulation Susceptibility Profile". Retiring the *model* is an engineering decision and
is made here. Keeping or dropping the *word* on the results screen is a naming decision
for the user.

- **Recommendation:** drop it, on the client's own §5 and §7 safeguard grounds, and title
  the §7 section something behavioural such as **"Trigger response profile"**.
- **If the user wants the EVI name retained**, it can be a pure presentation alias over the
  canonical trigger breakdown — a label on a report section, never a field, never a
  separate taxonomy, and never a selection input. That costs nothing architecturally.
- What must **not** happen is EVI surviving as a second, coarser taxonomy alongside
  triggers. That is the conceptual confusion this decision exists to prevent.

## 9. Architecture

| Concern | Field | Notes |
|---|---|---|
| Client content | `trigger` | The raw string, **verbatim**, including the `\| FICTIONAL MILITARY CONTEXT` suffix. Never overwritten. Authoritative provenance |
| Implementation metadata | `canonical_triggers` | Ordered array of canonical ids. Derived at import |
| Versioning | `trigger_taxonomy_version` | `1.0.0`. Stamped on each scenario **and** on each `Attempt` |
| Military flag | `military_flag` | Derived from the same raw string during decomposition — one parse, two outputs |

**Visibility.** `canonical_triggers` is **server-only**, exactly like `level`,
`disposition`, `family` and `canonical_family`. Revealing the psychological lever before
resolution would tell the learner what kind of manipulation to expect, defeating the
assessment. It must never appear in any learner-facing payload — including the §7 results
screen *during* an attempt.

| Consumer | Field used |
|---|---|
| Selection diversity (`>= 5` rule) | `canonical_triggers` |
| Results analytics, §7 trigger breakdown, remediation | `canonical_triggers` |
| Admin scenario manager and attempt viewer | both — raw `trigger` for authoring fidelity, canonical for filtering and aggregation |
| Learner-facing UI **during** an attempt | **neither** |
| Learner-facing results **after** resolution | display labels only (`LABELS`), never raw ids |

**Re-mapping is a versioned event**, identical to the attack-family rule: any change to
`ALIAS` or to the vocabulary requires a new `trigger_taxonomy_version`; attempts keep the
version they were selected under. This is what makes §7's "compare only when mode and
content version are comparable" enforceable for trigger analytics.

## 10. Complete mapping — 100 scenarios

`Mil` = the `| FICTIONAL MILITARY CONTEXT` suffix was present. The **Raw trigger** column
is reproduced verbatim from the client's `Primary trigger` field (suffix shown separately)
and is the value that must be preserved in the data model.

| ID | Title | Raw trigger (preserved verbatim) | Mil | Canonical triggers (ours) | n |
|---|---|---|---|---|---|
| `W01` | The Accidental Login Code | Helpfulness + urgency |  | `helpfulness`, `urgency` | 2 |
| `W02` | Parcel Redelivery Fee | Urgency + curiosity |  | `urgency`, `curiosity` | 2 |
| `W03` | Known Sports Meet Group | Familiarity | Y | `familiarity` | 1 |
| `W04` | Friend on a New Number | Empathy + urgency |  | `empathy`, `urgency` | 2 |
| `W05` | KYC Suspension Warning | Fear + urgency |  | `fear`, `urgency` | 2 |
| `W06` | Unit Clerk ID Photo Request | Authority | Y | `authority` | 1 |
| `W07` | Expected Family Document | Familiarity |  | `familiarity` | 1 |
| `W08` | Festival Reward QR | Greed + scarcity |  | `greed`, `scarcity` | 2 |
| `W09` | Compromised Colleague Gift Cards | Authority + urgency | Y | `authority`, `urgency` | 2 |
| `W10` | Survey Device-Link QR | Convenience + authority |  | `convenience`, `authority` | 2 |
| `W11` | Expected Welfare Appointment | Authority + routine |  | `authority`, `routine` | 2 |
| `W12` | Digital Arrest Escalation | Fear + authority + isolation |  | `fear`, `authority`, `isolation_secrecy` | 3 |
| `W13` | Guaranteed IPO Group | Greed + social proof |  | `greed`, `social_proof` | 2 |
| `W14` | Movement Order APK | Authority + urgency | Y | `authority`, `urgency` | 2 |
| `W15` | Senior's Urgent Voice Note | Authority + familiarity | Y | `authority`, `familiarity` | 2 |
| `W16` | Verified Vehicle-Pool Change | Authority + time pressure | Y | `authority`, `urgency` | 2 |
| `W17` | Part-Time Rating Tasks | Greed + commitment |  | `greed`, `commitment` | 2 |
| `W18` | Hijacked Group Admin Roster Link | Authority + routine | Y | `authority`, `routine` | 2 |
| `W19` | Commander Clone Requests Location | Authority + secrecy | Y | `authority`, `isolation_secrecy` | 2 |
| `W20` | Supplier Bank-Detail Change | Routine + urgency |  | `routine`, `urgency` | 2 |
| `W21` | Verified Senior Requests Secure Follow-Up | Authority | Y | `authority` | 1 |
| `W22` | Long-Game Online Friendship | Trust + reciprocity |  | `trust`, `reciprocity` | 2 |
| `W23` | Family Welfare Pretext | Empathy + authority | Y | `empathy`, `authority` | 2 |
| `W24` | Remote Support Screen Share | Fear + helpfulness |  | `fear`, `helpfulness` | 2 |
| `W25` | Known Contact Sends a Linking Code | Trust + reciprocity |  | `trust`, `reciprocity` | 2 |
| `I01` | Flash Giveaway Winner | Greed + scarcity |  | `greed`, `scarcity` | 2 |
| `I02` | Copyright Appeal Countdown | Fear + urgency |  | `fear`, `urgency` | 2 |
| `I03` | Published Blood-Donation Drive | Empathy | Y | `empathy` | 1 |
| `I04` | Cloned Friend in Distress | Empathy + urgency |  | `empathy`, `urgency` | 2 |
| `I05` | Friendly New Follower Questionnaire | Flattery + curiosity | Y | `flattery`, `curiosity` | 2 |
| `I06` | Where Was This Exercise? | Pride + social validation | Y | `pride` | 1 |
| `I07` | Known Friend Shares a Reel | Familiarity |  | `familiarity` | 1 |
| `I08` | Verification Badge Agent | Status + scarcity |  | `pride`, `scarcity` | 2 |
| `I09` | Deepfake Trading Advertisement | Greed + authority |  | `greed`, `authority` | 2 |
| `I10` | Brand Collaboration Shipping Fee | Flattery + reciprocity |  | `flattery`, `reciprocity` | 2 |
| `I11` | Official Welfare Helpline Update | Authority + care | Y | `authority`, `empathy` | 2 |
| `I12` | Account Recovery Backup Code | Fear + authority |  | `fear`, `authority` | 2 |
| `I13` | Deployed Officer Romance Profile | Trust + empathy | Y | `trust`, `empathy` | 2 |
| `I14` | Commendation Page Requests Documents | Pride + authority | Y | `pride`, `authority` | 2 |
| `I15` | You Are in This Video | Curiosity + embarrassment |  | `curiosity`, `shame_embarrassment` | 2 |
| `I16` | Approved Photo Release Request | Authority + pride | Y | `authority`, `pride` | 2 |
| `I17` | Morphed-Photo Blackmail | Fear + shame + isolation |  | `fear`, `shame_embarrassment`, `isolation_secrecy` | 3 |
| `I18` | High-Fidelity Teammate Clone | Familiarity + urgency | Y | `familiarity`, `urgency` | 2 |
| `I19` | Urgent Unit Incident Repost | Fear + duty | Y | `fear`, `duty_compliance` | 2 |
| `I20` | Researcher Asks Capability Questions | Expert status + flattery | Y | `expert_status`, `flattery` | 2 |
| `I21` | Post-Event Teammate Tag | Familiarity + pride | Y | `familiarity`, `pride` | 2 |
| `I22` | Live Support Video Call | Authority + fear |  | `authority`, `fear` | 2 |
| `I23` | Compromised Charity Influencer | Empathy + social proof |  | `empathy`, `social_proof` | 2 |
| `I24` | Institutional Trading App | Authority + greed |  | `authority`, `greed` | 2 |
| `I25` | Canteen Coupon Reel QR | Familiarity + scarcity | Y | `familiarity`, `scarcity` | 2 |
| `E01` | Password Expires Today | Urgency + authority |  | `urgency`, `authority` | 2 |
| `E02` | Invoice Spreadsheet Macro | Routine + urgency |  | `routine`, `urgency` | 2 |
| `E03` | Authenticated Internal Newsletter | Routine |  | `routine` | 1 |
| `E04` | Customs Parcel Hold | Fear + curiosity |  | `fear`, `curiosity` | 2 |
| `E05` | Mandatory HR Policy Login | Authority + compliance |  | `authority`, `duty_compliance` | 2 |
| `E06` | Adjutant Roster Request | Authority | Y | `authority` | 1 |
| `E07` | Expected Training Calendar Invite | Routine + authority | Y | `routine`, `authority` | 2 |
| `E08` | Instant Tax Refund | Greed + urgency |  | `greed`, `urgency` | 2 |
| `E09` | Executive Gift-Card Request | Authority + urgency + secrecy | Y | `authority`, `urgency`, `isolation_secrecy` | 3 |
| `E10` | Vendor Changes Bank Details | Routine + urgency |  | `routine`, `urgency` | 2 |
| `E11` | Leave Approval in Known Portal | Authority + anticipation |  | `authority`, `routine` | 2 |
| `E12` | Shared Document Sign-In | Curiosity + collaboration | Y | `curiosity`, `routine` | 2 |
| `E13` | Password-Protected ZIP | Curiosity + routine |  | `curiosity`, `routine` | 2 |
| `E14` | Revised Movement Order | Authority + urgency | Y | `authority`, `urgency` | 2 |
| `E15` | OAuth Consent for Mail Review | Convenience + authority |  | `convenience`, `authority` | 2 |
| `E16` | Signed Maintenance Notice | Authority + routine |  | `authority`, `routine` | 2 |
| `E17` | Invoice Callback Trap | Fear + urgency |  | `fear`, `urgency` | 2 |
| `E18` | Hijacked Reply-Chain Invoice | Trust + routine |  | `trust`, `routine` | 2 |
| `E19` | Academic Interview on Readiness | Expert status + flattery | Y | `expert_status`, `flattery` | 2 |
| `E20` | Legal Notice and Secrecy Order | Fear + authority + isolation |  | `fear`, `authority`, `isolation_secrecy` | 3 |
| `E21` | Verified Vendor Master Change | Routine + authority |  | `routine`, `authority` | 2 |
| `E22` | Senior Voice Memo Transfer | Authority + urgency | Y | `authority`, `urgency` | 2 |
| `E23` | DLP Alert HTML Attachment | Fear + compliance |  | `fear`, `duty_compliance` | 2 |
| `E24` | QR Code in Policy PDF | Authority + convenience |  | `authority`, `convenience` | 2 |
| `E25` | Payroll Direct-Deposit Redirect | Authority + routine | Y | `authority`, `routine` | 2 |
| `S01` | Bank KYC Suspension | Fear + urgency |  | `fear`, `urgency` | 2 |
| `S02` | Electricity Disconnect Tonight | Fear + urgency |  | `fear`, `urgency` | 2 |
| `S03` | Matching Debit Alert | Routine |  | `routine` | 1 |
| `S04` | Unpaid E-Challan Link | Fear + urgency |  | `fear`, `urgency` | 2 |
| `S05` | Parcel Address Fee | Curiosity + urgency |  | `curiosity`, `urgency` | 2 |
| `S06` | Service-Number Confirmation | Authority | Y | `authority` | 1 |
| `S07` | Expected Recharge Confirmation | Routine |  | `routine` | 1 |
| `S08` | Lottery Claim Text | Greed + scarcity |  | `greed`, `scarcity` | 2 |
| `S09` | Wrong Number Becomes an Investment Pitch | Curiosity + trust |  | `curiosity`, `trust` | 2 |
| `S10` | eSIM Upgrade OTP | Authority + convenience |  | `authority`, `convenience` | 2 |
| `S11` | Expected Clinic Reminder | Routine + care |  | `routine`, `empathy` | 2 |
| `S12` | Income-Tax Refund Form | Greed + authority |  | `greed`, `authority` | 2 |
| `S13` | Rating-Task Recruiter | Greed + commitment |  | `greed`, `commitment` | 2 |
| `S14` | Emergency Recall Location Link | Authority + urgency | Y | `authority`, `urgency` | 2 |
| `S15` | Canteen Subsidy MMS QR | Familiarity + scarcity | Y | `familiarity`, `scarcity` | 2 |
| `S16` | Learner-Initiated Login Code | Routine |  | `routine` | 1 |
| `S17` | New-Phone Family Emergency | Empathy + urgency |  | `empathy`, `urgency` | 2 |
| `S18` | Bank Header Thread Hijack | Trust + fear |  | `trust`, `fear` | 2 |
| `S19` | Network Survey Requests IMEI | Authority + helpfulness | Y | `authority`, `helpfulness` | 2 |
| `S20` | Parcel Text Plus Callback | Curiosity + urgency |  | `curiosity`, `urgency` | 2 |
| `S21` | Matching New-Login Alert | Fear + routine |  | `fear`, `routine` | 2 |
| `S22` | Synthetic Voice-Mail Link | Authority + curiosity | Y | `authority`, `curiosity` | 2 |
| `S23` | UPI Refund Collect Request | Greed + confusion |  | `greed`, `confusion` | 2 |
| `S24` | Fake Cybercrime Case Fee | Fear + authority |  | `fear`, `authority` | 2 |
| `S25` | FASTag Update APK | Convenience + urgency |  | `convenience`, `urgency` | 2 |
## 11. What happens next

This document is a **design record**. It is not implemented.

| Task | What it does with this taxonomy |
|---|---|
| `DATA-001` | Adds `trigger` (client, verbatim), `canonical_triggers` and `trigger_taxonomy_version` to `ScenarioDefinition`. `canonical_triggers` is server-only. Removes `eviTags` with the legacy model. |
| `DATA-002` | Materialises §4 as `backend/data/trigger-taxonomy.v1.json`; the importer decomposes the raw string, derives `military_flag` from the same parse, and **fails the import** on any unknown primitive or unexpected `\|` suffix. |
| `SELECT-002` | Applies `len(union(canonical_triggers)) >= 5`, reading the artifact. Must use constraint-directed construction, not rejection sampling (§6). |
| `RESULT-001` / `RESULT-004` | §7 trigger breakdown and weak-trigger remediation key off `canonical_triggers`. Replaces the retired EVI profile. |
| `SCORE-*` | Unaffected. Triggers are a classification dimension, never a scoring input. |

**If the client later supplies their own trigger vocabulary**, it replaces this one as
`trigger_taxonomy_version` 2.0.0. Because the raw client string is preserved untouched and
every attempt records the version it was selected under, that substitution costs a re-map
and a re-import — no scenario content changes, and historical attempts stay interpretable.

## 12. Acceptance criteria added

- All 100 scenarios decompose to at least one canonical trigger; an unknown primitive or an
  unexpected `|` suffix **fails the import**.
- The raw `trigger` string round-trips byte-identical through import and export.
- `military_flag` derived from the trigger suffix equals 35 across the bank, and matches
  each platform index page (WhatsApp 10, Instagram 12, Email 8, SMS 5).
- Every generated attempt satisfies `len(union(canonical_triggers)) >= 5`.
- Every persisted attempt records `trigger_taxonomy_version`.
- `canonical_triggers` never appears in any learner-facing payload during an attempt.
- No `EVI_CATEGORIES` / `eviTags` reference survives into the new data model.

---

**Content-preservation statement.** No scenario definition was created, altered, renamed,
re-levelled, re-scored, reworded or merged in producing this taxonomy. All 100 client
scenarios remain exactly as supplied in the specification PDF. Every value in the
*Raw trigger* column above is reproduced verbatim from the client's own `Primary trigger`
field. The `>= 5` threshold is the client's and is implemented unchanged.
