# Immersive 50-scenario audit — WhatsApp W01–W25 and Instagram I01–I25

**Task:** IMMERSIVE-AUDIT-001 · **Date:** 17 September 2026 · **Type:** read / test / audit

**Scope:** the 50 authored immersive scenes (WhatsApp W01–W25, Instagram I01–I25), checked against
*Interactive_Social_Engineering_Scenario_UI_Development_Specification.pdf* v1.0 (2 September 2026),
the client scenario bank, the synthetic bank, the taxonomies, the engine, the review builder, the
scene model and registry, and the ten batch research documents. No new scenario was built. Email
and SMS were not touched.

This report lists facts. It does not rank, score or grade any scenario.

---

## 1. Executive verdict

**The 50 scenes work as a coherent half of the 100-scenario system. No blockers were found.**

- All 50 are registered, build from the payload the server sends, and are playable. Each has six
  stages, uses only engine-legal intents, names only assets its scenario declares, scores **10**
  on its safe path and **0 or 3** on the unsafe path played, and produces a review built from the
  ledger. This was checked in the engine in-process, over HTTP for all 50, and by playing
  representative scenes in a browser.
- **Five pre-resolution answer leaks were found in W01–W18 and fixed** (§15). The most serious:
  in W01–W15 the resolve banner under the conversation held *only* the two correct
  resolutions, so a button's position gave the answer. Earlier task reports had recorded this and
  deferred it. W09 and W10 also printed a narrator line that states the verdict ("A fake support
  account…"), and three Report labels and two directory entries named the verdict.
- A durable cross-50 regression block now covers these checks for every scene (202 assertions).
  The earlier checks ran per batch, and that is how early patterns went unchecked.
- **One architectural finding needs a decision; it does not block Email** (§6.4). Every scored
  control carries its engine intent in the DOM (`data-intent`), and the intent names describe the
  choice (`safe_pivot`, `share_secret`). Anyone with developer tools can see which control is the
  safe pivot. The same names are sent in each API request, so removing the attribute alone would
  not help. This dates from before the scenes (the generic action sheet does the same). It was
  reported, not changed.
- Privacy, engine authority, recovery, offline containment and responsive layout all held. **No
  production write:** the production database was byte-for-byte identical in its counts before and
  after, and all 19 bank, synthetic and taxonomy files hash identically.

**Recommendation:** the project can proceed to Email (§18). Decide the intent-exposure question
before or during Email so the new platform does not add more controls to the pattern.

---

## 2. Coverage table W01–W25 / I01–I25

How to read the table:

- **Def. valid:** `toScenarioDefinition` returns no errors.
- **Stages:** the evaluation stages in the definition compared with the stages in the bank.
- **Scored stages in scene:** Notify is the dashboard toast, which the page owns. The other five
  stages each offer at least one scored control in the scene.
- **Assets:** every `targetId` names an asset the pinned scenario declares.
- **Illegal intents:** scene controls the engine refuses at their stage.
- **Safe / worst path:** in-process walks through the real `resolveIntent`. At each stage the walk
  took the highest-scoring control (safe) or the lowest-scoring one (worst). The result is the
  clamped score and the `classifyOutcome` class.
- **Review:** `buildScenarioReview` status for both walks, and the number of mistake cards on the
  worst walk.
- **HTTP play:** `backend/scripts/playScenario.js` with `REVIEW=1` against the isolated API. It ran
  the named path and read the committed run back from the ledger.

| ID | Title | Def. valid | Stages (def / bank) | Scored stages in scene | Assets | Illegal intents | Safe path | Worst path | Review (safe / worst) | HTTP play (safe / unsafe) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| W01 | The Accidental Login Code | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / code 0/10 |
| W02 | Parcel Redelivery Fee | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / pay 0/10 |
| W03 | Known Sports Meet Group | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 false_positive | correct / mistake (6 cards) | safe 10/10 / falsepositive 0/10 |
| W04 | Friend on a New Number | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / pay 0/10 |
| W05 | KYC Suspension Warning | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / submit 0/10 |
| W06 | Unit Clerk ID Photo Request | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / release 0/10 |
| W07 | Expected Family Document | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 false_positive | correct / mistake (6 cards) | safe 10/10 / falsepositive 0/10 |
| W08 | Festival Reward QR | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / release 0/10 |
| W09 | Compromised Colleague Gift Cards | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / pay 0/10 |
| W10 | Survey Device-Link QR | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / link 0/10 |
| W11 | Expected Welfare Appointment | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 false_positive | correct / mistake (6 cards) | safe 10/10 / helpline 3/10 |
| W12 | Digital Arrest Escalation | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / pay 0/10 |
| W13 | Guaranteed IPO Group | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / deposit 0/10 |
| W14 | Movement Order APK | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / install 0/10 |
| W15 | Senior's Urgent Voice Note | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / phrase 0/10 |
| W16 | Verified Vehicle-Pool Change | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 false_positive | correct / mistake (6 cards) | safe 10/10 / overshare 3/10 |
| W17 | Part-Time Rating Tasks | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / recharge 0/10 |
| W18 | Hijacked Group Admin Roster Link | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / submit 0/10 |
| W19 | Commander Clone Requests Location | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / share 0/10 |
| W20 | Supplier Bank-Detail Change | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / release 0/10 |
| W21 | Verified Senior Requests Secure Follow-Up | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 false_positive | correct / mistake (6 cards) | safe 10/10 / ask 3/10 |
| W22 | Long-Game Online Friendship | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / deposit 0/10 |
| W23 | Family Welfare Pretext | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / submit 0/10 |
| W24 | Remote Support Screen Share | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / share 0/10 |
| W25 | Known Contact Sends a Linking Code | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / link 0/10 |
| I01 | Flash Giveaway Winner | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / login 0/10 |
| I02 | Copyright Appeal Countdown | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / appeal 0/10 |
| I03 | Published Blood-Donation Drive | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 false_positive | correct / mistake (6 cards) | safe 10/10 / falsepositive 0/10 |
| I04 | Cloned Friend in Distress | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / pay 0/10 |
| I05 | Friendly New Follower Questionnaire | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / route 0/10 |
| I06 | Where Was This Exercise? | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / tag 0/10 |
| I07 | Known Friend Shares a Reel | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 false_positive | correct / mistake (6 cards) | safe 10/10 / falsepositive 0/10 |
| I08 | Verification Badge Agent | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / apply 0/10 |
| I09 | Deepfake Trading Advertisement | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / install 0/10 |
| I10 | Brand Collaboration Shipping Fee | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / sign 0/10 |
| I11 | Official Welfare Helpline Update | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 false_positive | correct / mistake (6 cards) | safe 10/10 / comment 3/10 |
| I12 | Account Recovery Backup Code | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / code 0/10 |
| I13 | Deployed Officer Romance Profile | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / gift 0/10 |
| I14 | Commendation Page Requests Documents | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / files 0/10 |
| I15 | You Are in This Video | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / approve 0/10 |
| I16 | Approved Photo Release Request | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 false_positive | correct / mistake (6 cards) | safe 10/10 / caption 3/10 |
| I17 | Morphed-Photo Blackmail | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / pay 0/10 |
| I18 | High-Fidelity Teammate Clone | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / pin 0/10 |
| I19 | Urgent Unit Incident Repost | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / tag 0/10 |
| I20 | Researcher Asks Capability Questions | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / form 0/10 |
| I21 | Post-Event Teammate Tag | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 false_positive | correct / mistake (6 cards) | safe 10/10 / album 3/10 |
| I22 | Live Support Video Call | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / code 0/10 |
| I23 | Compromised Charity Influencer | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / pay 0/10 |
| I24 | Institutional Trading App | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / install 0/10 |
| I25 | Canteen Coupon Reel QR | yes | 6 / 6 | notify (toast) + 5 | all declared | 0 | 10 handled_safely | 0 missed_threat | correct / mistake (6 cards) | safe 10/10 / form 0/10 |

**Mismatches found: none.** Every row also had:

- a client `feedback` and `end_state`, and the feedback appears in the safe-walk review;
- `review leaks none` over HTTP (no event code, `points_delta`, `expected_actions` or
  `scoring_text` in the learner payload);
- metadata keys limited to `intent, transition, consequence, resolution_code`.

Two HTTP runs (I07 safe, I16 safe) first ended with Windows status `0xC0000409`. That is a crash of
the Node process itself, not a script error. The pinned pool was restored, and both scenes scored
10/10 on rerun.

**Offline compatibility:** see §10. **Review compatibility:** both walks of every scene produce a
review: `correct` with no mistake cards on the safe walk, and `mistake` on the worst walk.

---

## 3. Taxonomy distribution

The counts come from the definitions the import service builds (`canonical_family`,
`canonical_triggers`, `military_flag`) over the unchanged bank. The bank was not altered.

### 3.1 Totals

| | WhatsApp | Instagram | All 50 |
| --- | --- | --- | --- |
| Malicious / legitimate | 20 / 5 | 20 / 5 | 40 / 10 |
| Easy / Medium / Hard | 8 / 9 / 8 | 8 / 9 / 8 | 16 / 18 / 16 |
| Legitimate by level (E/M/H) | 2 / 2 / 1 | 2 / 2 / 1 | 4 / 4 / 2 |
| Military context | 10 | 12 | 22 |
| Canonical families used | 15 | 14 | 18 of 19 |
| Canonical triggers used | 16 | 17 | 21 of 22 (`confusion` unused) |
| Trigger count 1 / 2 / 3 | 4 / 20 / 1 | 3 / 21 / 1 | 7 / 41 / 2 |
| Raw client family strings | 25 distinct | 25 distinct | 50 distinct |

### 3.2 Canonical family

| Canonical family | W | I | Total | Scenarios |
| --- | --- | --- | --- | --- |
| operational_elicitation | 3 | 4 | **7** | W15, W19, W23, I05, I06, I18, I20 |
| legit_coordination_request | 3 | 2 | 5 | W03, W07, W16, I16, I21 |
| account_takeover_authorisation_abuse | 3 | 1 | 4 | W01, W10, W25, I12 |
| investment_and_task_fraud | 2 | 2 | 4 | W13, W17, I09, I24 |
| legit_routine_broadcast | 1 | 3 | 4 | W21, I03, I07, I11 |
| unsolicited_payment_lure | 0 | 4 | 4 | I01, I08, I10, I23 |
| identity_data_harvesting | 2 | 1 | 3 | W06, W18, I14 |
| financial_credential_phishing | 2 | 0 | 2 | W02, W05 |
| credential_phishing | 0 | 2 | 2 | I02, I15 |
| impersonation_emergency_payment | 1 | 1 | 2 | W04, I04 |
| qr_code_phishing | 1 | 1 | 2 | W08, I25 |
| payment_diversion | 2 | 0 | 2 | W09, W20 |
| coercion_and_extortion | 1 | 1 | 2 | W12, I17 |
| relationship_grooming_fraud | 1 | 1 | 2 | W22, I13 |
| tech_support_and_callback_fraud | 1 | 1 | 2 | W24, I22 |
| legit_system_confirmation | 1 | 0 | 1 | W11 |
| malware_delivery | 1 | 0 | 1 | W14 |
| disinformation_amplification | 0 | 1 | 1 | I19 |
| legit_verified_high_risk_change | 0 | 0 | 0 | — |

### 3.3 Canonical triggers

| Trigger | W | I | Total |
| --- | --- | --- | --- |
| authority | 12 | 7 | **19** |
| urgency | 8 | 3 | 11 |
| fear | 3 | 5 | 8 |
| familiarity | 3 | 4 | 7 |
| empathy | 2 | 5 | 7 |
| greed | 3 | 3 | 6 |
| pride | 0 | 5 | 5 |
| scarcity | 1 | 3 | 4 |
| curiosity, routine, isolation_secrecy, trust, reciprocity, flattery | — | — | 3 each |
| helpfulness, social_proof, shame_embarrassment | — | — | 2 each |
| convenience, commitment, duty_compliance, expert_status | — | — | 1 each |

Repeated trigger sets: `authority + urgency` ×3 (W09, W14, W16); `familiarity` alone ×3 (W03,
W07, I07, all legitimate). These sets appear twice each: `empathy + urgency` (W04, I04),
`fear + urgency` (W05, I02), `greed + scarcity` (W08, I01), `authority + routine` (W11, W18),
`trust + reciprocity` (W22, W25), `authority + empathy` (W23, I11), `authority + greed` (I09,
I24), `authority + fear` (I12, I22) and `authority + pride` (I14, I16).

### 3.4 Flags (audit only, no change made)

- **Concentration: `operational_elicitation`** has 7 of 50 scenes, 14 %. All seven are military
  context. This is the largest family.
- **Concentration: `authority`** appears in 19 of 50 scenes (38 %) and in 12 of the 25 WhatsApp
  scenes. `pride` appears only on Instagram (5 scenes).
- **Platform-exclusive families:** `unsolicited_payment_lure` (Instagram only, 4),
  `financial_credential_phishing` and `payment_diversion` (WhatsApp only, 2 each).
- **Military-context imbalance by disposition:** 7 of the 10 legitimate scenes are military
  (70 %), against 15 of 40 malicious scenes (37.5 %). A learner can find military framing weakly
  associated with legitimacy.
- **Legitimate × Hard** has two scenes (W21, I21).
- **Duplication check:** all 50 raw client family strings and all 50 titles are distinct. Two pairs
  share canonical family, trigger set *and* level: **W03 ↔ W07** (`legit_coordination_request`,
  `familiarity`, Easy — a group sports invite vs an expected family document) and **W04 ↔ I04**
  (§5.2 B). I09 ↔ I24 share family and triggers but differ in level. None of these is accidental:
  each is a separate client bank entry.
- All distributions follow from the authored bank. The per-platform level and disposition
  splits are identical (8/9/8, 20/5), which matches the bank's design.

---

## 4. ATT&CK audit

This covers the research documents, not the implementation. No scene, test or engine component
depends on an ATT&CK identifier, so none of the findings below is an incorrect implementation
claim. **No mapping was rewritten.**

### 4.1 Version consistency

All ten documents name **MITRE ATT&CK v19.2**. The documents from I06 onward also record the v18.1
window and the T1656 → T1684.001 change, and `sceneResearch.test.js` asserts it. Two technique
pages were re-read on the live site on 17 September 2026:

- **T1111** — v2.1, modified 12 May 2026. The description covers technical interception of MFA
  (tokens, smart cards, out-of-band interception). It does not cover a victim being persuaded to
  hand over a code.
- **T1676 Linked Devices** — Mobile, v1.0, modified 19 May 2025. It exists as cited.

### 4.2 Mapped and unmapped

| | Count | Scenarios |
| --- | --- | --- |
| Mapped | 40 | every malicious scene |
| Deliberately unmapped (NONE) | 10 | W03, W07, W11, W16, W21, I03, I07, I11, I16, I21 — all legitimate. Each section states why, and I11, I16 and I21 name a non-ATT&CK behavioural reference instead |

Each NONE is justified: a genuine coordination or broadcast item has no adversary behaviour to
map. Every mapped section has "Why this maps" and "What must NOT be copied", and cites a source
page for each technique it names (asserted by `sceneResearch.test.js`).

### 4.3 Findings (research-document consistency)

| # | Scenario | Finding |
| --- | --- | --- |
| A1 | W01 (Supporting), W05 (Primary, OTP field) | These claim **T1111** for a code the victim is persuaded to hand over. Five later scenes with the same mechanism (W25, I02, I12, I15, I22) **consider T1111 and reject it** for exactly that reason, and the live page supports the rejection. The W01 argument, "the interception channel is the victim themselves", matches the "related word" pattern this audit looks for. W05's argument (a phishing page that asks for the OTP alongside the PIN) is stronger but is also covered by T1598.003. **This is inconsistent across batches; the later reasoning is the better-supported one.** |
| A2 | W04 (Enabler) | Cites **T1586 Compromise Accounts** for a friend writing from a *new number*. The research also calls where the persona came from speculative. I04 has the same mechanism and **rejects T1586.001**, because it "would teach 'her account was hacked' — the wrong conclusion". The two are inconsistent. |
| A3 | W09 | Uses **T1586.002 (Email Accounts)** for a compromised WhatsApp account and marks it partial. W25, I15 and I23 use **T1586.001** for messaging and social accounts, and W25 says "a WhatsApp account is compromised the same way". The sub-technique choice is inconsistent; the partial fit is stated. |
| A4 | W01 | **T1621** is marked "partial only", which is appropriate. |
| A5 | W14 | T1636.004, T1417.001 and T1513 describe capabilities of the lure APK. They are supported by the permission list in the scene's asset (`sms`, `accessibility`, `screen_capture`). Nothing is executed. |
| A6 | W24 / I22 | W24 maps Mobile **T1663** and rejects Enterprise T1219. I22 rejects T1219 and T1113. Consistent. |
| A7 | I19 | States that influence operations fall outside ATT&CK and cites DISARM separately. Appropriate. |

**Suggested follow-up (not done here):** a short research-content pass on W01, W04, W05 and W09
to bring them in line with the rejection reasoning of the later batches.

---

## 5. Differentiation and overlap matrix

Columns:

- **Entry / conversation:** the list the scenario opens from and the kind of conversation.
- **Branch decision home(s):** where the scored branch controls sit (`conversation/slot` or
  `conversation/surface:page-view`).
- **Releases:** branch intents priced at −8.
- **Consequences:** the engine's rendering instructions for branch controls.
- **Verify routes:** the verify intents offered.

| ID | Disp. | Canonical family | Triggers | Mil. | Entry / conversation | Branch decision home(s) | Branch releases (intents priced −8) | Branch consequences | Verify routes | ATT&CK (research) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| W01 | M | account_takeover_authorisation_abuse | helpfulness + urgency | – | chatlist / direct | direct/composer, direct/menu | share_secret | call, data_submission, reply_sent | block, report, in_message_contact, known_app, trusted_directory | T1598.001, T1684.001, T1111, T1621, T1586 |
| W02 | M | financial_credential_phishing | urgency + curiosity | – | chatlist / direct | direct/browser:-, direct/composer, direct/inline, direct/menu, direct/paysheet:- | attempt_payment,submit_data | browser_open, call, data_submission, payment, reply_sent | block, report, in_message_contact, known_app, trusted_directory | T1598.003, T1598.001, T1566.003, T1684.001, T1583.001, T1657, T1660 |
| W03 | L | legit_coordination_request | familiarity | Y | chatlist / group | group/inline, group/menu | – | data_submission | block, report, in_message_contact, known_number, trusted_directory | none (deliberate) |
| W04 | M | impersonation_emergency_payment | empathy + urgency | – | chatlist / direct | direct/composer, direct/menu, direct/paysheet:- | attempt_payment | call, payment, reply_sent | block, report, in_message_contact, known_number, trusted_directory | T1684.001, T1684, T1657, T1598.001, T1586, T1598.004 |
| W05 | M | financial_credential_phishing | fear + urgency | – | chatlist / direct | direct/browser:-, direct/composer, direct/inline, direct/menu | submit_data | browser_open, call, data_submission, reply_sent | block, report, in_message_contact, known_app, known_number, trusted_directory | T1598.003, T1111, T1684.001, T1585.001, T1583.001, T1566.003, T1657, T1598.004 |
| W06 | M | identity_data_harvesting | authority | Y | chatlist / direct | direct/composer, direct/menu, direct/viewer:- | submit_data | call, data_submission, reply_sent | block, report, in_message_contact, known_number, trusted_directory | T1598.001, T1598, T1684.001, T1684, T1589 |
| W07 | L | legit_coordination_request | familiarity | – | chatlist / direct | direct/inline, direct/menu, direct/viewer:- | – | data_submission, install | block, report, in_message_contact, known_number, trusted_directory | none (deliberate) |
| W08 | M | qr_code_phishing | greed + scarcity | – | chatlist / group | group/browser:-, group/composer, group/inline, group/menu | submit_data | data_submission, qr_inspect, reply_sent | block, report, in_message_contact, known_app, trusted_directory | T1660, T1583.001, T1583, T1657 |
| W09 | M | payment_diversion | authority + urgency | Y | chatlist / direct | direct/composer, direct/paysheet:- | attempt_payment,share_secret | data_submission, payment, reply_sent | block, report, in_message_contact, known_number, trusted_directory | T1586.002, T1586, T1657, T1684.001, T1684 |
| W10 | M | account_takeover_authorisation_abuse | convenience + authority | – | chatlist / direct | direct/composer, direct/inline, direct/settings:- | approve_device_link | device_link, qr_inspect, reply_sent | block, report, in_message_contact, known_app, trusted_directory | T1676, T1660 |
| W11 | L | legit_system_confirmation | authority + routine | – | chatlist / direct | direct/browser:-, direct/inline, direct/menu | – | call | block, report, in_message_contact, known_app, trusted_directory | none (deliberate) |
| W12 | M | coercion_and_extortion | fear + authority + isolation_secrecy | – | chatlist / direct | direct/call:-, direct/composer, direct/paysheet:- | attempt_payment,submit_data | call, data_submission, payment, reply_sent | block, report, in_message_contact, known_number, trusted_directory | T1684.001, T1684, T1657 |
| W13 | M | investment_and_task_fraud | greed + social_proof | – | chatlist / group | group/menu, group/paysheet:- | attempt_payment | payment, reply_sent | block, report, in_message_contact, known_app, trusted_directory | T1657, T1585.001, T1585 |
| W14 | M | malware_delivery | authority + urgency | Y | chatlist / direct | direct/composer, direct/installer:- | attempt_install | install, reply_sent | block, report, in_message_contact, known_app, known_number, trusted_directory | T1660, T1636.004, T1636, T1417.001, T1417, T1513 |
| W15 | M | operational_elicitation | authority + familiarity | Y | chatlist / direct | direct/composer, direct/menu | share_secret,submit_data,submit_data | call, data_submission | block, report, in_message_contact, known_number, trusted_directory | T1588.007, T1588, T1598.004, T1598, T1684.001, T1684, T1585.001, T1585 |
| W16 | L | legit_coordination_request | authority + urgency | Y | chatlist / direct | direct/composer, direct/inline, direct/menu | – | data_submission, reply_sent | block, report, in_message_contact, known_app, trusted_directory | none (deliberate) |
| W17 | M | investment_and_task_fraud | greed + commitment | – | chatlist / direct | direct/browser:-, direct/composer, direct/paysheet:- | attempt_payment,submit_data | data_submission, payment, reply_sent | block, report, in_message_contact, known_app, trusted_directory | T1657, T1585.001, T1585 |
| W18 | M | identity_data_harvesting | authority + routine | Y | chatlist / group | group/browser:-, group/composer, group/menu | submit_data | data_submission, reply_sent | block, report, in_message_contact, known_app, known_number, trusted_directory | T1586.001, T1586, T1534, T1598.003, T1598 |
| W19 | M | operational_elicitation | authority + isolation_secrecy | Y | chatlist / direct | direct/composer, direct/installer:- | share_location,share_location,share_location,submit_data | data_submission, reply_sent | block, report, in_message_contact, known_number, trusted_directory | T1684.001, T1684, T1585.001, T1585, T1593.001, T1593, T1598 |
| W20 | M | payment_diversion | routine + urgency | – | chatlist / direct | direct/browser:-, direct/composer | attempt_payment,submit_data | data_submission, payment, reply_sent | block, report, in_message_contact, known_number, trusted_directory | T1657, T1684.001, T1684 |
| W21 | L | legit_routine_broadcast | authority | Y | chatlist / direct | direct/browser:-, direct/composer, direct/menu | – | call, reply_sent | block, report, in_message_contact, known_app, known_number, trusted_directory | none (deliberate) |
| W22 | M | relationship_grooming_fraud | trust + reciprocity | – | chatlist / direct | direct/browser:-, direct/composer, direct/menu, direct/paysheet:- | attempt_payment,submit_data | call, data_submission, payment, reply_sent | block, report, in_message_contact, known_app, trusted_directory | T1657, T1585.001, T1585 |
| W23 | M | operational_elicitation | empathy + authority | Y | chatlist / direct | direct/browser:-, direct/composer | submit_data,submit_data | data_submission, reply_sent | block, report, in_message_contact, known_number, trusted_directory | T1598.001, T1598, T1684.001, T1684, T1591 |
| W24 | M | tech_support_and_callback_fraud | fear + helpfulness | – | chatlist / direct | direct/call:-, direct/composer, direct/installer:- | attempt_install,share_secret | data_submission, install, reply_sent | block, report, in_message_contact, known_number, trusted_directory | T1660, T1663, T1513, T1516, T1684.001, T1684 |
| W25 | M | account_takeover_authorisation_abuse | trust + reciprocity | – | chatlist / direct | direct/composer, direct/installer:- | approve_device_link,share_secret | data_submission, device_link, reply_sent | block, report, in_message_contact, known_app, known_number, trusted_directory | T1676, T1586.001, T1586, T1684.001, T1684 |
| I01 | M | unsolicited_payment_lure | greed + scarcity | – | activity / post | post/browser:-, post/menu, post/paysheet:- | attempt_payment,submit_data | data_submission, payment, reply_sent | block, report, in_message_contact, known_app, trusted_directory | T1657, T1585.001, T1585, T1598.003, T1598 |
| I02 | M | credential_phishing | fear + urgency | – | dm / dm | dm/browser:-, dm/composer, dm/menu | submit_data | data_submission, reply_sent | block, report, in_message_contact, known_app, trusted_directory | T1598.003, T1598, T1684.001, T1684, T1585.001, T1585 |
| I03 | L | legit_routine_broadcast | empathy | Y | activity / post | post/inline, post/menu | – | browser_open, data_submission, reply_sent | block, report, in_message_contact, known_number, trusted_directory | none (deliberate) |
| I04 | M | impersonation_emergency_payment | empathy + urgency | – | dm / dm | dm/composer, dm/menu, dm/paysheet:- | attempt_payment | payment, reply_sent | block, report, in_message_contact, known_number, trusted_directory | T1684.001, T1684, T1585.001, T1585, T1657 |
| I05 | M | operational_elicitation | flattery + curiosity | Y | dm / dm | dm/composer, dm/menu | submit_data,submit_data,submit_data | data_submission, reply_sent | block, report, in_message_contact, known_number, trusted_directory | T1598, T1591.001, T1591, T1589, T1591.003, T1593.001, T1593 |
| I06 | M | operational_elicitation | pride | Y | activity / post | post/composer, post/menu, post/social:list | share_location,share_location,submit_data | data_submission, reply_sent | block, report, in_message_contact, known_number, trusted_directory | T1598, T1591.001, T1591, T1591.003, T1593.001, T1593, T1585.001, T1585 |
| I07 | L | legit_routine_broadcast | familiarity | – | dm / dm | dm/composer, dm/menu, dm/social:reel | – | browser_open | block, report, in_message_contact, known_app, known_number, trusted_directory | none (deliberate) |
| I08 | M | unsolicited_payment_lure | pride + scarcity | – | dm / dm | dm/browser:-, dm/composer, dm/menu, dm/paysheet:- | attempt_payment,submit_data | data_submission, payment, reply_sent | block, report, in_message_contact, known_app, trusted_directory | T1598.003, T1598, T1585.001, T1585, T1657 |
| I09 | M | investment_and_task_fraud | greed + authority | – | activity / post | post/browser:-, post/menu, post/paysheet:- | attempt_install,attempt_payment,submit_data | browser_open, data_submission, install, payment | block, report, in_message_contact, known_app, trusted_directory | T1583.008, T1583, T1684.001, T1684, T1585.001, T1585, T1598.003, T1598, T1657 |
| I10 | M | unsolicited_payment_lure | flattery + reciprocity | – | dm / dm | dm/browser:-, dm/composer, dm/menu, dm/paysheet:- | attempt_payment,submit_data | data_submission, payment, reply_sent | block, report, in_message_contact, known_app, trusted_directory | T1684.001, T1684, T1585.001, T1585, T1598.003, T1598, T1657 |
| I11 | L | legit_routine_broadcast | authority + empathy | Y | activity / post | post/composer, post/inline, post/menu, post/social:list | – | data_submission, reply_sent | block, report, in_message_contact, known_app, trusted_directory | none (deliberate) |
| I12 | M | account_takeover_authorisation_abuse | fear + authority | – | dm / dm | dm/browser:-, dm/composer, dm/menu | share_secret,submit_data | data_submission, reply_sent | block, report, in_message_contact, known_app, trusted_directory | T1598.001, T1598, T1585.001, T1585, T1684.001, T1684, T1621 |
| I13 | M | relationship_grooming_fraud | trust + empathy | Y | dm / dm | dm/browser:-, dm/composer, dm/menu, dm/paysheet:- | attempt_payment,submit_data,submit_data | data_submission, payment, reply_sent | block, report, in_message_contact, known_app, trusted_directory | T1585.001, T1585, T1684.001, T1684, T1657, T1598 |
| I14 | M | identity_data_harvesting | pride + authority | Y | dm / dm | dm/composer, dm/menu, dm/viewer:- | submit_data,submit_data | browser_open, data_submission, reply_sent | block, report, in_message_contact, known_app, trusted_directory | T1598.001, T1598, T1585.001, T1585, T1591.001, T1591, T1589, T1684.001, T1684 |
| I15 | M | credential_phishing | curiosity + shame_embarrassment | – | dm / dm | dm/browser:-, dm/composer, dm/installer:-, dm/menu | approve_device_link,submit_data | data_submission, device_link, reply_sent | block, report, in_message_contact, known_app, known_number, trusted_directory | T1586.001, T1586, T1598.003, T1598, T1621 |
| I16 | L | legit_coordination_request | authority + pride | Y | activity / dm | dm/composer, dm/menu, dm/social:status | – | data_submission, reply_sent | block, report, in_message_contact, known_app, known_number, trusted_directory | none (deliberate) |
| I17 | M | coercion_and_extortion | fear + shame_embarrassment + isolation_secrecy | – | dm / dm | dm/composer, dm/menu, dm/paysheet:-, dm/social:settings | attempt_payment,submit_data | data_submission, payment, reply_sent | block, report, in_message_contact, known_app, known_number, trusted_directory | T1585.001, T1585, T1657 |
| I18 | M | operational_elicitation | familiarity + urgency | Y | dm / dm | dm/composer, dm/menu, dm/social:list | share_location,submit_data | data_submission, reply_sent | block, report, in_message_contact, known_app, known_number, trusted_directory | T1585.001, T1585, T1684.001, T1684, T1593.001, T1593, T1598.001, T1598, T1591.001, T1591, T1591.003 |
| I19 | M | disinformation_amplification | fear + duty_compliance | Y | activity / post | post/composer, post/menu, post/social:settings, post/social:story | share_location,submit_data | data_submission, reply_sent | block, report, in_message_contact, known_app, known_number, trusted_directory | T1585.001, T1585, T1591.001, T1591, T1591.004 |
| I20 | M | operational_elicitation | expert_status + flattery | Y | dm / dm | dm/browser:-, dm/composer, dm/menu | submit_data,submit_data,submit_data | data_submission, reply_sent | block, report, in_message_contact, known_app, known_number, trusted_directory | T1598.001, T1598, T1598.003, T1585.001, T1585, T1591.003, T1591, T1591.004 |
| I21 | L | legit_coordination_request | familiarity + pride | Y | dm / dm | dm/composer, dm/menu, dm/social:post, dm/social:review | – | browser_open, data_submission | block, report, in_message_contact, known_app, known_number, trusted_directory | none (deliberate) |
| I22 | M | tech_support_and_callback_fraud | authority + fear | – | dm / dm | dm/call:-, dm/installer:-, dm/menu, dm/social:settings | share_secret,share_secret,submit_data | data_submission, reply_sent | block, report, in_message_contact, known_app, known_number, trusted_directory | T1684.001, T1684, T1585.001, T1585, T1598.001, T1598 |
| I23 | M | unsolicited_payment_lure | empathy + social_proof | – | dm / dm | dm/inline, dm/menu, dm/paysheet:- | attempt_payment | payment, reply_sent | block, report, in_message_contact, known_app, known_number, trusted_directory | T1586.001, T1586, T1657, T1684.001, T1684 |
| I24 | M | investment_and_task_fraud | authority + greed | – | activity / post | post/browser:-, post/composer, post/installer:-, post/menu, post/paysheet:- | attempt_install,attempt_payment,submit_data | data_submission, install, payment, reply_sent | block, report, in_message_contact, known_app, trusted_directory | T1583.008, T1583, T1585.001, T1585, T1660, T1657 |
| I25 | M | qr_code_phishing | familiarity + scarcity | Y | activity / post | post/browser:-, post/menu, post/paysheet:-, post/viewer:- | attempt_payment,submit_data | data_submission, payment, qr_inspect, reply_sent | block, report, in_message_contact, known_app, known_number, trusted_directory | T1585.001, T1585, T1598.003, T1598, T1589, T1591.004, T1591, T1657 |

### 5.1 Structural facts

| Dimension | Distinct values across 50 |
| --- | --- |
| Branch-stage control shape (`slot:intent` multiset) | **50 / 50** — no two scenes are the same |
| Branch decision home | 41 / 50 |
| Branch intent set | 31 / 50 |
| Surface-kind set | 36 / 50 |
| Branch consequence set | 24 / 50 |
| Verify decision home | **4 / 50**, one per conversation type: every scene verifies from the overflow menu |
| Verify intent set | **3 / 50** |
| Entry list | 3 (WhatsApp chat list; Instagram DM or activity) |

### 5.2 Classification

**A. Exact duplicates — none.** No two scenes share a branch shape. No two scenes on the same
platform share family, trigger set, level and interaction. W03 and W07 share taxonomy and level
but not interaction (see C).

**B. Near-duplicates.** The same mechanism and the same kind of release, told on a different
surface. Each pair below is client-authored as two bank entries.

| Pair | Shared mechanism | What differs |
| --- | --- | --- |
| **W04 ↔ I04** | Friend in distress asks for money; both Easy, `impersonation_emergency_payment`, `empathy + urgency`, and the client names the friend "Riya" in both | New number vs cloned profile; I04 lays the clone beside the real friend. Branch intent sets are nearly the same (W04 also offers a call) |
| **W06 ↔ I14** | Military ID or service-document request (`identity_data_harvesting`, authority); in both, the decision is a media picker (viewer) | Unit clerk "audit" vs commendation page "feature"; I14's page publishes what it collects |
| **W19 ↔ I18** | Cloned trusted military persona asks for location (`operational_elicitation`, `share_location`) | Commander vs teammate; the phone's location permission and share sheet vs a DM location card; I18 passes every numbers check |
| **W05 ↔ I02** (and I12) | Suspension countdown → credential page (`fear + urgency`) | KYC page (account, PIN, OTP) vs appeal login (password, backup code); I12 releases a code typed into the DM |
| **W08 ↔ I25** | Scarcity QR lure → claim or eligibility form | Forwarded group message vs code hidden in a reel and read from a screenshot; I25 adds the audio-credit trail and military-family data |
| **W10 ↔ W25** | Device-linking takeover | QR from a "survey desk" vs a linking code from a known contact (reciprocity); the device-link sheet vs the installer surface |
| **W24 ↔ I22** | Fake support pushes screen-share or remote access (recorded in 004E) | Installer and permission prompts vs an Instagram video call with camera, screen and backup-code asks |
| **W13 ↔ I09 ↔ I24** | Investment platform with early "profit" (`investment_and_task_fraud`) | Group-chat hype vs sponsored reel to group vs sponsored carousel to app store and dashboard with a withdrawal "tax" |
| **W09 ↔ I15 ↔ I23** | A compromised trusted account asks for something | Gift cards vs login code / login page vs donation; different release types |

**C. Intentional overlaps** (specification-mandated or recorded design decisions):

- **The verification surface is the same in all 50.** Stage 5 of the client's UI text is a
  "three-dot action sheet and independent Trusted Directory overlay", so every scene verifies
  from the overflow menu with one of three intent sets. What differs is the destination (saved
  number, own app, directory), not the surface. The fallback "Unit Falcon Support Desk" directory
  row comes from the synthetic directory asset and appears in most scenes.
- **Legitimate consent choices where both answers are correct:** W03 (poll yes/no), I07 (like or
  save), I16 (confirm or decline consent), I21 (approve or decline tag).
- **The same Release Register** in I16 and I21 (recorded in 004E).
- **The same decision home** for I02, I12 and I20 (recorded in 004D); I01 and I09; I08, I10 and
  I13; W01 and W15; W20 and W23.
- **Installer system chrome reused** for different system dialogs: W14 (APK), W19 (location
  permission), W25 (device link), W24 and I15 and I22 (permission or consent prompts).
- **`familiarity`-only legitimate items:** W03, W07, I07. W03 and W07 also share family and level;
  one decides on a group poll, the other keeps an expected document.
- **Seven operational-elicitation scenes** with different pretexts: voice-note CO (W15), location
  (W19), family welfare (W23), social profiling (I05), own post (I06), teammate clone (I18),
  researcher questionnaire (I20).

**D. Genuinely distinct (no near-duplicate partner):** W01, W02, W03, W07, W11, W12, W14, W15,
W16, W17, W18, W20, W21, W22, W23, I01, I03, I05, I06, I07, I08, I10, I11, I13, I16, I17,
I19, I20, I21. W01, W12, W17, I01, I17 and I20 share an intent set or family with another
scene but differ in mechanism, surface and release.

---

## 6. Pre-resolution answer-leak findings

### 6.1 Method

For every scene, the whole serialised scene (every label, beat, page, bio, directory row,
notification, consequence text and sheet) was searched for:

- the scenario's own disposition, raw family, trigger, end state, feedback and `prior_context`;
- all 19 canonical family ids;
- the union of the verdict word lists from the batch suites;
- grading words (`correct`, `incorrect`, `score`, `points`, `difficulty`, level names,
  `expected`, `trigger`);
- engine event codes.

Each hit was then read in context. Four scenes were also checked in the browser.

### 6.2 Findings fixed in this task

| # | Where | Leak | Visible at | Fix |
| --- | --- | --- | --- | --- |
| L1 | W01–W15 resolve banner | The banner under the thread held **only the two correct resolutions**; every wrong one was in the overflow menu, so position answered the question. First recorded in 003D and 003E and deferred | Resolve | The banner now holds one wrong and one right resolution, wrong first; the second right one moved to the menu. Scoring is unchanged. The banner's first button is now correct in 30 of 50 scenes (it was 45 of 50) |
| L2 | W09, W10 thread | The bank's narrator line was printed as a system notice: "A saved colleague's **genuine account** sends an **out-of-character** request…" and "A **fake** support account offers…". First recorded in 003C and deferred | Open | Line removed; the conversation still carries the context |
| L3 | W06, W09, W15 Report labels | "Report the **impersonation**…", "Report the **compromised** account…" | Resolve | "Report the number…", "Report the account…" |
| L4 | W15, W18 directory remit | "Report **impersonation** and…", "Report **compromised** accounts…". This is the same class as I17's "extortion" row fixed in 004D | Verify | "Report any request for access details." / "Report unexpected requests for personnel data." |
| L5 | All 50 (test coverage) | The verdict and banner checks were scoped per batch, so a pattern introduced early was never re-checked | — | New cross-50 block in `sceneModel.test.js` (§14) |

### 6.3 Observed and left in place (factual)

- **W01–W08 still print the bank's narrator line.** It contains no verdict word. Some lines still
  characterise the item: W03's "…no sensitive data or external link is requested" and W07's "…the
  learner requested earlier". A content pass is recommended; the lines were not changed because
  the client presents the text as "Context presented" and it is not a label.
- **In-world use of "genuine":** the learner's own question "Ask in the group whether this is
  genuine" (W03, W08, W11 — both legitimate and malicious items), and adversary claims such as
  "Yes, the order is genuine" (W12, W14, W17, W24). This is scenario content, not a label.
- **In-world advisories on trusted surfaces:** W08's retailer app shows a "Scam warning" notice,
  reached on the verify route. W09's gift-card store says gift-card requests "are common in
  fraud", reached from Branch, the way a real store's terms read.
- **I22 Report label** "Report the account for pretending to be Instagram…" uses Instagram's own
  report reason and is offered only at Resolve.
- **"Correct"** appears in in-world text (W03 "Correct, I made the group…"; I20 "Correct the
  figure in their note", which is an unsafe release).
- **Result and review pages** show disposition, case type, persuasion technique, the correct
  action and the score only after the attempt completes (verified in the browser). The page before
  results showed none of these words.
- **Notification text, bios, directory entries, sheet labels and consequence text:** no
  canonical family id, raw family string, trigger string, event code or `points_delta` in any
  scene (existing per-scene assertions, all 50).

### 6.4 Architectural finding — hidden evaluation vocabulary in the DOM (RESOLVED by SECURITY-001, 17 September 2026)

> **Resolved.** Controls now carry neutral ids only, the server maps them, and the client sends
> per-run opaque action codes. See [`NEUTRAL_LEARNER_ACTION_CONTRACT.md`](NEUTRAL_LEARNER_ACTION_CONTRACT.md).
> The finding as recorded by the audit follows.

Every scored control renders `data-intent="<engine intent>"`
(`SceneControl.jsx:30`, `InstagramScene.jsx:510/548/615`, `WhatsAppScene.jsx:157`, and
`ActionSheet.jsx:83` on the generic path), and `data-affordance="<control id>"`. The engine's
intent names describe the choice:

- `safe_pivot` is the +3 branch control in all 50 scenes, whether malicious or legitimate;
- `reject_ignore` is the −2 needless rejection on legitimate items;
- `share_secret` and `submit_data` are releases;
- 20 control ids end in `branch-pivot`.

Any learner with developer tools can therefore read the answer, and the same intent names travel
in each `POST …/events` request body.

**Why it was not fixed here:** removing the attribute does not remove the exposure, because the
network request and the JS bundle still carry the names. A real fix means replacing the
client-facing intent names with neutral per-run tokens that the server maps back, which changes
the client–engine contract (architecture). It also predates the scene layer and affects Email
and SMS the same way. **A decision is needed.** It is not a blocker for a supervised, kiosk-style
assessment.

---

## 7. Privacy and typed-data findings

| Check | Result |
| --- | --- |
| What the client sends per action | `intent`, `intent_key`, `expected_stage`, `synthetic_target_id`, and metadata limited to `open_latency_ms`, `dwell_ms` and `verify_source` (`useAttemptController.js:144–168`). The scene action object carries no field values |
| Server metadata allowlist | `METADATA_ALLOWLIST` (9 keys). A live request with `metadata: { typed_value: … }` was rejected with **422 INVALID_METADATA** |
| Form fields (browser) | Neutral names (`f0`, `f1`, `f2`), `type="text"` with CSS masking, `autocomplete="off"`. Values were discarded when the page changed: each new page's field started empty |
| Composer | Not an editable field; quick replies are authored text. No free-typed message content can exist |
| Synthetic values typed in the browser | I15 username `canaryuser7731`, password `CanaryPass5519`, login code `482913`; I20 questionnaire (6 fields) `CanaryAnswer…`; W09 payment PIN `739146` |
| Database | **None** of these values in any of the **5,438 documents** in the isolated database. Event metadata keys in use: `consequence, dwell_ms, intent, open_latency_ms, resolution_code, transition, verify_source` |
| Logs | The API log carries only run id, stage, next stage, event code and sequence. No canary value appears |
| Exports | `backend/exports` contains no file with a canary value |
| Local storage | `localStorage` and `sessionStorage` were **empty** after typing. No cookie is readable by page script |
| Analytics | No analytics code or third-party origin exists (§10) |
| By-design typed text | The optional 250-character resolve **rationale** (client specification §4) is stored when a learner enters it. It is a separate free-text box, not a simulated credential field |

Location and schedule details (W19, I18) are selected, not typed. Their release is recorded only
as `share_location` or `submit_data` with no value (HTTP ledgers in §2).

---

## 8. Engine and scoring findings

| Check | Result |
| --- | --- |
| Scene-local scoring | None. Scene packs contain no points, codes or score logic. The only matches are comments and the `endCallScored` rendering flag |
| Client-authoritative scoring | None. The client shows `score_0_10` and `total_score` from server payloads only (`attemptMachine.js:105`, result components) |
| Legal intents | 1,037 scored controls across 50 scenes, **0 refused** by `resolveIntent` at their stage |
| Stage-intent mirror | `sceneModel.STAGE_INTENTS` matches the engine (`sceneAffordance.test.js`) |
| Navigation creates no events | Verified live on I22: Back to list, reopen chat, open the profile page, About this account and the options sheet all left the run at Inspect. The ledger grows only through scored controls |
| Scoring authority | `ScenarioRun.score_0_10` and `outcome_code` come from the ledger. HTTP ledgers match the in-process walks exactly |
| Result and review | Built by `/complete` from the ledger. The run payload carries no score, disposition or family field (checked live) |
| New scoring rules | None. No engine, constant, definition or review file changed. The fixes moved presentation slots and wording only; `sceneAffordance.test.js` (108) still pins each control's event code |

---

## 9. Recovery findings

| Scenario | Check | Result |
| --- | --- | --- |
| I15 (Instagram) | Notify → Open → Inspect → Branch → Verify → Resolve through its own controls | Engine-committed at each step; 0/10 on the release route, as the engine prices it |
| I15 | Reload during **Branch** | Rebuilt at step 4, "place was kept" and Resume shown, thread intact, no pushed screen, no event replayed (ledger still 3 events) |
| I15 | Reload during **Verify**, just after a browser-form release | Rebuilt at step 5 with Resume; the browser page and typed values are gone |
| I22 (Instagram) | Reload during **Inspect** | Rebuilt at step 3 with Resume |
| W01 (WhatsApp) | Full safe walk in the browser | 10/10 |
| W15 (WhatsApp) | Advanced to Verify over the API (interruption), then reloaded | The browser resumed at step 5; the directory and Block-from-menu path worked |
| Duplicate event retry (live) | The same `intent_key` sent twice | 200 both times; the second carried the replay flag and added no event |
| Stale state (live) | `expected_stage: notify` sent while at Open | **409 STALE_STATE** |
| Premature action (live) | `attempt_payment` at Open | Accepted and priced by the engine (the specification's "acting from the preview") |

The DB-backed `scenarioEngineTransaction` and `attemptApi` suites cover idempotency and
concurrency (§14). Local navigation never changed the stage.

---

## 10. Offline findings

| Check | Result |
| --- | --- |
| Origins contacted by the browser | `http://localhost:5199` and `http://localhost:5055` only (resource timing, 210 entries), in both attempts |
| CDN or remote image | None; no absolute `src` or `href` in the DOM |
| External hosts in scene data | Only reserved `*.training.example` *display strings*, which are never navigated. Asserted for all 50 (`sceneModel.test.js`) |
| Containment suite (all 50, every stage and surface) | `SceneContainment.test.jsx` **201 / 201**: no `a[href]`, `form`, `iframe`, `embed` or `object`; guarded `fetch`, `open`, `XMLHttpRequest`, `WebSocket` and `EventSource` are never called |
| Camera, microphone, clipboard, protocol handler, `window.open`, `location.href =` | None in `frontend/src` outside tests |
| Calls | Captioned text; "Simulated call. No microphone, camera or dialer was used." |
| Payment, install, device link | Engine consequences marked `inert: true, executes: false`; no package, payment or link |
| Real social service | None; the header shows "TRAINING SIMULATION — OFFLINE · Network off" |

The existing test infrastructure has no network-disabled browser harness. Containment is
enforced by the guarded jsdom suite together with the browser origin audit above.

---

## 11. Accessibility and responsive findings

| Check | Result |
| --- | --- |
| 320 px (≈200 % of 640) | W01 resolve banner (two buttons, wrapped, no clipping), result page with a review card expanded: `scrollWidth` equals `innerWidth` |
| 375 px | W01 conversation: no horizontal overflow |
| 640 px | W15 and W01: no horizontal overflow |
| Controls reachable | Every control is a native `<button>` with an accessible name (containment suite "gives every control an accessible name", all 50). Moved resolutions are reachable from More options (verified in the browser: W15 Block) |
| Visible focus | Global `:focus-visible { outline: 2px solid var(--color-focus) }` (`styles/index.css:278`) |
| Dialog focus trap | Options sheet (I15): `aria-modal="true"`, focus moves to "Close Options", Tab from the last item wraps inside |
| Escape | Closes the sheet |
| Focus restoration | Returns to "More options" |
| Readable text / colour-only meaning | Every decision is a text label; the banner and menu carry no risk colour (`SceneControl` variants differ by position only) |
| Known, carried | Closing a pushed screen returns focus to the page body (recorded in 004E); the pane cannot send real key events under emulation, so Tab and Escape were dispatched as DOM events |

---

## 12. Production database before and after

The production database `cyber_awareness_training` was only read (`countDocuments`,
aggregations). All test writes went to `cyber_awareness_audit001_verify` and
`cyber_awareness_audit001_t_*`.

| Collection | Before | After |
| --- | --- | --- |
| attempts | 10 | 10 |
| candidates | 9 | 9 |
| scenarioruns | 100 (61 active / 39 resolved) | 100 (61 / 39) |
| scenarioevents | 209 | 209 |
| scenariodefinitions | 100 | 100 |
| scenarios (legacy) | 40 | 40 |
| assessments | 1 | 1 |
| progresssnapshots | 6 | 6 |
| auditevents | 0 | 0 |
| adminusers | 0 | 0 |
| configurations | 0 | 0 |
| Latest event `createdAt` | 2026-09-10T11:05:14.155Z | same |
| Event-code histogram (15 codes) | identical | identical |

Ports 5000 and 5173 were not listening during the task. The temporary API launch entry was removed
afterwards, and both preview servers were stopped.

**PRODUCTION MUTATED: NO**

---

## 13. Bank hashes

`sha256` of every file, taken before and after the task. **Identical. Nothing was regenerated.**

| File | sha256 |
| --- | --- |
| `backend/data/scenarios/v1/MANIFEST.json` | `1b6677142454dff09dfdf11219f08931a26c86692b3659c0c451db1fe1b04ecb` |
| `backend/data/scenarios/v1/scenarios.email.json` | `96023e4e548cbd1044bd48c8d0e7b1a6987068ac502af6bcafd10789c5b14fc1` |
| `backend/data/scenarios/v1/scenarios.instagram.json` | `7473e9cfe3bccf4bff8e2839bff8e9a4bd5a12ef8413fdec58084974f1d3aa99` |
| `backend/data/scenarios/v1/scenarios.sms.json` | `e28defea90cd16adeea1c79b913fd70ddba79b8042571037e08107bc9b511a78` |
| `backend/data/scenarios/v1/scenarios.whatsapp.json` | `30e29a4ab5ea041d2be3878790f2f7c9819379104a10c914660a33af6eb57e95` |
| `backend/data/synthetic/v1/MANIFEST.json` | `1f0ea03b32a4f5511fc34d0fd3b1d20354d3ea985b3c133cede59ebce63493d5` |
| `backend/data/synthetic/v1/synthetic.email.json` | `a6c75a4fa75b68ef242380a1982b90f678f7fa80d33856e7b3eb2228eaa1822b` |
| `backend/data/synthetic/v1/synthetic.instagram.json` | `d5f69bccbd7bb023cf444c1add8cb53bbbc35e27641ebc2c1fc5be710976e652` |
| `backend/data/synthetic/v1/synthetic.sms.json` | `e133718a1f2852a7546b5698e31c6bd2aaade6bf38cf2a110c8efc0648c5ff1c` |
| `backend/data/synthetic/v1/synthetic.whatsapp.json` | `bbeb59b838157af904e9c9326dd0b72705adbb66329c11a07c757f870d5f257a` |
| `backend/data/taxonomy/attack-family-taxonomy.v1.json` | `f6c62c89231102f606080c494fc2429e6eccc23da7bfabe96433096b434e3adc` |
| `backend/data/taxonomy/trigger-taxonomy.v1.json` | `46cb99d42fbe4cea02680ed0f7e5f8be8d55905a0000a54ac21fcc3378e8f711` |
| `backend/data/scenarios.dev-pool.json` | `37517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570` |
| `backend/data/scenarios.email.json` | `03bca2adc4f771f027a97a528acac94fc1b27e059bed0e9444e93ea0d73f61a2` |
| `backend/data/scenarios.instagram.json` | `c4777b58a17d12e6ae7490ec29ae9ef92eba54df8f67187511eb41296cc7e4ce` |
| `backend/data/scenarios.sample.json` | `d2a2ef3e8c4d183b8b66272cda81f497030b3d9a5f4924e9b8a923611dacd729` |
| `backend/data/scenarios.sms.json` | `16b238bc0dbe5b3163639b5ca53741d1b13af0e25fc02d3c2e600226198fde78` |
| `backend/data/scenarios.whatsapp.json` | `fac52db6c3ce7c1f5eb1fd1cc1f844cb056f69e8667639c34026620dc762a42f` |
| `docs/acceptance-scenario-bank.json` | `0bf46f98d1f84eef64eb2ce3ca2d3bb5c28a5fca48c9fd123148395cc6196d78` |

Reference fingerprints recorded earlier in `PROJECT_MASTER_PLAN.md` both reproduce:

- concatenated `scenarios/v1` content files: `7686687e0023ce0f6695a8856c3bccde5e6261395af98e10f3af9607c8013b1f`
- concatenated `synthetic/v1` content files: `5bf50b1a960d9611007e2cb579f04457c2be86c92fd4a54ccb5da0cab73ef105`

The manifest fingerprints (client bank `8e7a6c98…1038a7687`, synthetic `2779b039…8afde1`) are
re-verified by `scenarioDefinitionImport.test.js` and `syntheticContent.test.js`, which pass.

---

## 14. Tests

| Suite | Result |
| --- | --- |
| Full frontend `vitest run` | **2060 / 2060**, 31 files (1858 before; +202 audit assertions) |
| `sceneModel.test.js` | **969 / 969** (767 before) |
| `sceneResearch.test.js` | **125 / 125** |
| `SceneContainment.test.jsx` | **201 / 201** |
| `SceneForms.test.jsx` | **15 / 15** |
| `oxlint` | clean (exit 0) |
| `vite build` | clean; the long-standing chunk-size advisory only |
| Full backend `npm test` (no DB URI) | **563 pass, 0 fail**, 322 skipped (unchanged) |
| `backend/tests/sceneAffordance.test.js` | **108 / 108** |
| DB-backed suites, sequential, isolated `cyber_awareness_audit001_t_*` | **295 / 296 on the first pass**. `attemptTimer` failed at file level (0/1) on its brand-new database, a known flake unrelated to scenes. It then passed **27 / 27** on a fresh database and again on the original, giving **322 / 322** |
| HTTP play, all 50 (safe + one unsafe route) | **100 / 100 runs** as expected. Two first attempts crashed the Node process (`0xC0000409`) and passed on rerun |

The first-pass DB results per suite were: attemptApi 25, attemptCreation 20, attemptResultApi 40,
attemptTimer 0/1 (27 on rerun), attemptViewerApi 37, auditLogApi 25, candidateProfileApi 21,
exportApi 25, instructorControlsApi 28, progressApi 21, scenarioEngineTransaction 21,
scenarioManagerApi 32.

**New durable tests.** `frontend/src/simulation/sceneModel.test.js` gained the block "across all
fifty authored scenes, nothing before resolution gives the answer away" (202 cases):

- the resolve banner mixes a right and a wrong resolution, for each of the 50;
- no control label, hint or echo carries a verdict word (the union list, minus the neutral
  "genuine" and "legit"), for each of the 50;
- no verdict-bearing narrator line is printed, for each of the 50;
- no directory remit names the verdict, for each of the 50;
- two guards: the block covers 50 scenes, and the directory check actually finds rows.

**Tests updated for the fixes:**

- `WhatsAppScene.test.jsx`: the W01 banner test asserted the leaky layout and now asserts the
  mixed banner;
- `SceneScenariosB.test.jsx`: the W06 walk clicks the renamed Report label.

The dev script `backend/scripts/playScenario.js` gained W01 `code` and W02–W05 paths so that all
50 scenes can be played over HTTP.

---

## 15. Defects fixed

| # | Files | Change |
| --- | --- | --- |
| F1 | `scenes/whatsapp/w01.js` … `w15.js` | Resolve banner: one wrong resolution (keep the chat on malicious items, report on legitimate ones) placed first, next to one right one. The second right resolution moved to the overflow menu. Ids, intents and scoring unchanged |
| F2 | `w09.js`, `w10.js` | Verdict-bearing narrator line removed; unused `priorContext` and `system` imports dropped |
| F3 | `w06.js`, `w09.js`, `w15.js` | Report labels no longer name the verdict |
| F4 | `w15.js`, `w18.js` | Directory remit no longer names the verdict |
| F5 | `sceneModel.test.js` | Cross-50 regression block (§14) |
| — | `WhatsAppScene.test.jsx`, `SceneScenariosB.test.jsx` | Updated for F1 and F3 |
| — | `docs/SCENE_INTERACTION_LAYER.md` | Rules updated: narrator status and the banner rule |
| — | `backend/scripts/playScenario.js` | Dev-only paths for W01–W05 |

No engine, backend source, bank, synthetic, taxonomy, Instagram scene, Email or SMS file changed.

---

## 16. Known limitations

- ~~**Intent vocabulary exposed in the DOM and network (§6.4).** Decision needed.~~ Resolved by SECURITY-001.
- W01–W08 print a neutral narrator line (§6.3).
- In 30 of 50 scenes the banner's first button is the correct resolution (it was 45 of 50).
  Position is no longer the whole answer, but the order is not balanced across the set.
- ATT&CK consistency items A1–A3 are recorded, not rewritten (§4.3).
- Result and review cards show the bank's placeholder Instagram sender (`@unknownsender…`), and
  some bank headlines are cut at an apostrophe ("Is this you in the video?? I can"). Both are
  carried from the bank and recorded earlier.
- Closing a pushed screen returns focus to the page body (carried from 004E).
- Consequence banners belong to the session; a reload after a release shows the thread without
  them (carried).
- The browser pane scales emulated viewports, so the interactive checks used DOM clicks and
  dispatched key events rather than real input devices.
- A network-disabled browser harness does not exist. Offline behaviour rests on the containment
  suite and the origin audit.
- The first DB-backed pass on brand-new databases shows the known file-level `attemptTimer` flake.
  On Windows, Node occasionally ends with `0xC0000409` after a play script finishes.

---

## 17. Blockers

**None.** One architectural decision is open (§6.4); it does not block Email.

---

## 18. Recommendation — can the project proceed to Email?

**Yes.** The 50 WhatsApp and Instagram scenes are complete, consistent with the engine, private,
offline, recoverable and free of visible pre-resolution answer leaks. The cross-50 regression
checks will now catch those leaks for any new scene added to the registry, including Email.

Before or alongside Email, the project should:

1. decide whether to replace client-facing intent names with neutral tokens (§6.4), before Email
   and SMS add more controls to the pattern;
2. keep the new banner rule: a right and a wrong resolution together, applied to Email and SMS
   resolution controls from the start;
3. optionally run the small content passes: the W01–W08 narrator lines and the ATT&CK consistency
   items A1–A3.
