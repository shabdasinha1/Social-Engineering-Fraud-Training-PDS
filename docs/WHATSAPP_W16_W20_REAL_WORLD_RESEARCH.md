# WhatsApp W16–W20 — real-world research and storyline reconstruction

**Task:** IMMERSIVE-003D
**Scope:** WhatsApp W16, W17, W18, W19, W20 only. W01–W15 are unchanged apart from the shared renderer additions listed in §7; W21–W25, Instagram, Email and SMS are untouched.
**Status:** design record for the five scenes authored by this task.
**Companions:** [`WHATSAPP_W01_W05_REAL_WORLD_RESEARCH.md`](WHATSAPP_W01_W05_REAL_WORLD_RESEARCH.md), [`WHATSAPP_W06_W10_REAL_WORLD_RESEARCH.md`](WHATSAPP_W06_W10_REAL_WORLD_RESEARCH.md) and [`WHATSAPP_W11_W15_REAL_WORLD_RESEARCH.md`](WHATSAPP_W11_W15_REAL_WORLD_RESEARCH.md) — the same method, applied to the first three batches.

---

## 0. How this document was produced, and what it is allowed to change

### 0.1 The transformation

```
REAL-WORLD BEHAVIOUR
      |   observed in published threat intelligence and public advisories
ATT&CK TECHNIQUE / DOCUMENTED PATTERN
      |   the behavioural abstraction, not the tooling
SOCIAL-ENGINEERING MECHANISM
      |   what actually moves the human being
CLIENT'S SCENARIO                     <- authoritative, never overridden
      |
SYNTHETIC STORY
      |
INTERACTIVE SIMULATION
```

What is taken from the real world is timing, sequencing, social pressure, impersonation
shape, conversation progression, escalation, contextual evidence and the realism of the
interfaces. What is deliberately **not** taken is infrastructure, tooling, live hosts, real
brands, real units, real personnel, real numbers or anything operational. Every host is
`*.training.example`; every number is in the reserved `+91 00000 xxxxx` range; every UPI
handle uses the project's `@trainingpay` suffix; every page, form, call, location screen and
portal is local, inert and offline.

### 0.2 Source of the threat intelligence

Primary source: **MITRE ATT&CK, Enterprise and Mobile matrices, website version v19.2**
(released 28 April 2026) — re-confirmed as the current version on the live versions page
during this task (<https://attack.mitre.org/versions/>, which serves
<https://attack.mitre.org/resources/versions/>). Every technique below was read from its live
page during this task; the ID, tactic, version, created and last-modified dates are
recorded so a later reviewer can check the same page.

Secondary sources, for the real-world pattern behind each scenario, are public advisories and
published research cited in each section: the US Federal Trade Commission's data spotlight on
task scams, the Indian Cyber Crime Coordination Centre (I4C) as reported by an Indian bank's
security advisory, the Singapore Police Force on WhatsApp account takeover, the FBI's Internet
Crime Complaint Center on business email compromise, and Indian reporting on the Army's
advisories about impersonation profiles.

Version note carried forward: `T1656 Impersonation` no longer exists as a top-level technique
and resolves to **T1684.001** (parent **T1684 Social Engineering**, created 14 April 2026).

### 0.3 Interpretation rule

ATT&CK is used as a **behavioural reference, not a checklist** — MITRE's own guidance is that
not every technique applies to every organisation. A mapping is recorded only where the
technique's own description describes what the scenario does. W16 has no mapping, and that is
stated. W19 records one technique that was **considered and rejected** (T1430) and says why.
Where a technique fits only partly, the section says which part.

### 0.4 What this document may and may not change

| Thing | May IMMERSIVE-003D change it? |
| --- | --- |
| Scenario IDs, platform, level, disposition, family, trigger, military flag, version | **No** |
| The six stages, their order, their text, expected actions, scoring semantics, feedback | **No** |
| `backend/data/scenarios/v1` and its fingerprint `8e7a6c98...a7687` | **No** |
| `backend/data/synthetic/v1` and its fingerprint `2779b039...afde1` | **No** |
| The engine, the event ledger, the 90-minute deadline, the training-feedback review | **No** |
| Scene structure, conversation beats, surfaces, forms, phone UI | **Yes — this is the whole task** |

**The client scenario remains authoritative** over everything in this document. Where the
research and the client's own stage text disagree, the client's text wins and the
disagreement is recorded.

### 0.5 Content note carried forward — the truncated notification bodies

The DATA-003 generator stops the client's notification text at the first apostrophe. **W20**
is the one in this batch: its stored body is `Our bank is under audit. Use this new account
for today`, from the client's "Our bank is under audit. Use this new account for today's
invoice." Handled exactly as W06, W09 and W15 were: the bank is left as it is, the scene states
the client's full sentence, and `sceneModel.test.js` now lists W20 beside W06, W09 and W15 and
asserts that the scene text starts with the stored string. The notify-stage toast is
server-driven and still shows the stored text — a visible defect, recorded as a known
limitation, left for the separate data clean-up task.

### 0.6 Content note — the narrator line is not printed in this batch

The bank's `prior_context` ("Context presented") sentence states the verdict for four of the
five: W16 "changes a routine pickup point to the **already published** alternate location";
W18 "a **real group admin account** posts a roster-update link that **conflicts subtly with
prior process**"; W19 "**a clone** closely matches a senior's photo"; W20 "requests payment to
**a new beneficiary**". So, as in W11–W15, the narrator line is not printed: each scene presents
that context through the conversation and its screens, and `sceneModel.test.js` asserts that
neither the sentence nor any labelling word appears anywhere in W16–W20.

### 0.7 Content note — placeholder assets the client's stage text overrides

| Scenario | Placeholder | Resolution |
| --- | --- | --- |
| W16, W18, W19, W20 | The directory asset is "Unit Falcon Support Desk" with an unrelated number. | Each scene adds approved-directory rows for the party the stage text names (the MT Section, the Coy Office desk, the duty office and the CO, the Procurement Cell), with the same provenance line, beside the bank's row — the W03 precedent. |
| W18 | The thread asset is a direct chat with "Admin"; stage 2 says "the long-standing Unit Falcon group thread". | The scene is the group; "Admin" (the bank's sender and number) is its admin. |
| W20 | The payment asset is `INR 0.00` with the sender as payee. | The portal shows the invoice amount and the changed beneficiary the stage text describes. The payment event still names the bank's payment asset. |
| W16, W20 | No file asset; stage 3 asks for the contingency note / the invoice to be examined. | The document is a thread attachment opened in the viewer; `preview_file` is sent with no target, which the engine accepts. |

---

## 0.8 Differentiation from W01–W15

Before any code was written, each W16–W20 concept was compared with the fifteen scenes already
built. A concept that reduced to "another suspicious message with a new name" was rejected.

| | Nearest earlier scene | What that scene already taught | What is new here |
| --- | --- | --- | --- |
| **W16** | W03 (poll), W07 (family PDF), W11 (business Confirm) | Genuine items look ordinary; verify and continue | The **old message sets the meaning of the new one** (a pinned contingency note three weeks old); the acknowledgement is a **reaction on the message itself**; the risk is what the learner **adds** (names, route) or **forwards**, not who is asking |
| **W17** | W13 (IPO group, deposit sheet) | Manufactured crowd, fake dashboard, deposit | One-to-one recruitment; the opener carries WhatsApp's **"Forwarded many times"** label; the bait has **already landed in the learner's own bank app**, from an individual's account; commitment built by the **learner's own taps** through three tasks; the **money-mule** ending (bank details for "payouts") and **recruit-your-friends** route; verification in a **vacancy app** |
| **W18** | W09 (compromised colleague) | A genuine account can make a bad request | A **group** and an **admin's powers**: the app's **security-code-changed** line, a **description changed** minutes before, the admin's own **pinned rule** contradicted, a member's warning **deleted by admin**, other members' **reactions**; the admin's card shows the **sign-off missing** from today's messages |
| **W19** | W04, W15 (new number) | Saved contact vs new number | A **one-character** difference in a copied About line; the **real CO's own chat, one row down**, contradicting the request; the phone's own **attach → location permission → live-location sheet**; the thing asked for is **where you are, continuously** |
| **W20** | W09 (payment), W02/W04 (pay sheets) | Do not pay on chat pressure | **Every detail is correct** (stolen, not guessed); a **revised copy** of a real invoice; the decision is taken in the **organisation's procurement portal** (vendor record, beneficiary edit, single-approver override, dual control), not in WhatsApp |

---

## 1. W16 — Verified Vehicle-Pool Change

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Verified Vehicle-Pool Change |
| Disposition | **Legitimate** |
| Level | Medium |
| Family (client) | Legitimate operational administration |
| Canonical family | `legit_coordination_request` |
| Trigger (client) | Authority + time pressure \| FICTIONAL MILITARY CONTEXT |
| Canonical triggers | `authority`, `urgency` |
| Military flag | Yes |
| End state | Acknowledgement is recorded; no route or roster information is exposed. |
| Decision signal (stage 3) | The alternate location is already listed in the synthetic plan and no sensitive information is requested. |

### MITRE ATT&CK alignment

**There is none, and none has been invented.**

ATT&CK catalogues adversary behaviour. A transport coordinator publishing a weather contingency
that was briefed three weeks earlier is not adversary behaviour, and mapping it to a phishing
or impersonation technique because it carries authority and a clock would be the inversion
this batch was told not to perform.

**Closest defensible behavioural reference:** the discrimination problem, priced by the client
three ways — `FALSE_REPORT_BLOCK` −4 for reporting the coordinator, `UNSAFE_EXTERNAL_ACTION` −4
for taking the change somewhere untrusted or adding sensitive detail to it, and
`NEEDLESS_REJECT_IGNORE` −2 for ignoring it. The operational-security idea behind "respond with
the minimum necessary" is ordinary need-to-know practice and needs no technique.

### Client requirements preserved

Stage 2's "saved coordinator thread with earlier schedule" is a saved contact of two years with
Monday's schedule and yesterday's "normal timings". Stage 3's "known number, matching
contingency note and limited acknowledgement" are the contact card (saved two years, number
never changed, three groups in common) and the pinned plan, whose para 4 says exactly what
today's message does. Stage 4's "in-chat Acknowledge button and read receipt" is a **reaction
control on the message itself** — the acknowledgement the coordinator asked for. Stage 5's
"compare with the local movement board / Trusted Directory" is the Movement Board app and the
coordinator's own directory row. Stage 6's "acknowledge without adding sensitive details; do
not report" is the resolve banner's "Keep the acknowledgement and use Gate B at 07:15".

### Enhanced synthetic storyline

On 21 August the MT Section's transport coordinator posted the monsoon contingency plan in the
pool chat and pinned the short version: if the Main Gate closes for weather, pickups move to
Alternate Gate B at the same time; the change will come here marked "acknowledge only"; react
👍, no names, routes or rosters. This week's schedule followed on Monday. Today, with the road
to the Main Gate going under water overnight, the change arrives — and a few minutes later the
coordinator repeats that a 👍 is enough. A residents' group in the chat list is already asking
about flooding.

### Conversation progression

1. `21 AUGUST` — the plan PDF, then the pinned "short version", then the learner's "Noted sir 👍".
2. `MONDAY` — the week's schedule. `YESTERDAY` — "Tomorrow normal timings."
3. `TODAY 10:00` — the client's headline; "Road to the Main Gate goes under water from tonight. Board is updated."
4. `branch` — "👍 on the message above is enough. No replies with names or timings please." (quoting the headline)
5. `verify` — "Gate B marshal will be at the barrier from 06:45."

### Evidence the learner can discover (progressive)

- **The pinned bar** under the header, which jumps back to the 21 August paragraph and highlights it.
- **The plan** (viewer): para 4, issued by the MT Section, also on the notice board and the Movement Board.
- **Contact info → About**: saved two years ago, number never changed, "MT Section - vehicle pool".
- **Groups in common**: Unit Falcon Notices, Pool 3 Riders, MT Conference.
- **The Movement Board app**: Main Gate closed 05:00–12:00 tomorrow; Pool 3 at Alternate Gate B, 07:15.
- **The trusted directory**: "Transport Coordinator, MT Section" with the same number that sent the message.

### Learner interaction journey

`notification → chat list → thread → pinned bar / plan viewer / contact info → react 👍 on the
message → Movement Board app (or directory) → keep the acknowledgement`

### Simulation surfaces

Contact sheet (`CONTACT`, 3 tabs), plan viewer (`VIEWER`), Movement Board (`APP`), trusted
directory with two scene rows. New thread elements: the **pinned-message bar** and **a control
anchored to a plain message** (the reaction).

### Verification mechanism

`verify_known_app` on the Movement Board, or `verify_trusted_directory` on the MT Section row.
"Ask in this chat whether it is really him" is the 0-point route. Report and Block are the −4
false positive.

### Safe resolution

Open (`ITEM_OPEN` 0) → the plan or the contact card (`INSPECT_CONTEXT` +2) → the reaction or a
plain "Acknowledged." (`CORRECT_USE` +3) → the board or the directory (`TRUSTED_VERIFY` +3) →
continue or retain (`RESOLVE_CORRECT` +2). Ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| "Ack. 6 of us from Block C - names and route" | `submit_data` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Forward this update to Block C Residents | `reply` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Mute the chat and use the Main Gate as usual | `reject_ignore` | `NEEDLESS_REJECT_IGNORE` | −2 |
| Report / Block the coordinator | `report` / `block` | `FALSE_REPORT_BLOCK` | −4 |
| Reply "Ack" from the notification | `reply` (open) | `PREMATURE_REPLY` | −1 |
| Report / block / leave it at resolve | `resolve_*` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

`NOTIFY_SEEN 0`, `ITEM_OPEN 0` / `PREMATURE_REPLY −1`, `INSPECT_CONTEXT +2`, `CORRECT_USE +3` /
`NEEDLESS_REJECT_IGNORE −2` / `UNSAFE_EXTERNAL_ACTION −4`, `TRUSTED_VERIFY +3` /
`FALSE_REPORT_BLOCK −4` / `VERIFY_THROUGH_MESSAGE 0`, `RESOLVE_CORRECT +2` /
`CONTRADICTORY_UNSAFE_FINAL −4`.

### Realism decisions

A reaction is how a genuine coordinator collects acknowledgements from forty riders without
forty replies, and it is the one control on the screen that says nothing at all. The over-share
reply is written the way a helpful person writes one. The residents' group is real traffic in
the chat list, not a prop.

### Known limitations

Thread beats after the branch are branch-neutral, so the marshal message at verify appears
whatever was chosen; the reaction does not remain drawn on the message after a reload (the
ledger holds it).

### Why the final simulation stays faithful

The genuine item gets as much thread and as many screens as the others (asserted). The
directory rows are scene additions with the bank's provenance line, as in W03. No word in the
scene says the item is genuine; the evidence does.

---

## 2. W17 — Part-Time Rating Tasks

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Part-Time Rating Tasks |
| Disposition | Malicious |
| Level | Medium |
| Family (client) | Task/job scam |
| Canonical family | `investment_and_task_fraud` |
| Trigger (client) | Greed + commitment |
| Canonical triggers | `greed`, `commitment` |
| Military flag | No |
| End state | Synthetic balance is exposed as non-withdrawable and no deposit is made. |
| Decision signal (stage 3) | Unexpected easy-income offers often escalate from small rewards to deposits and withdrawal fees. |

### MITRE ATT&CK alignment

| Technique | Name | Matrix / tactic | Version | Created / last modified |
| --- | --- | --- | --- | --- |
| [T1657](https://attack.mitre.org/techniques/T1657/) | Financial Theft | Enterprise / Impact | 1.2 | 18 August 2023 / 12 May 2026 |
| [T1585.001](https://attack.mitre.org/techniques/T1585/001/) | Establish Accounts: Social Media Accounts | Enterprise / Resource Development | 1.1 | 1 October 2020 / 12 May 2026 |

### Why this maps

T1657 is the objective: its description lists popular financial-theft campaign types including
"pig butchering", the investment cousin of this pattern. T1585.001 is "Recruiter Mia": an
account built "to build a persona", with a status line and a company name typed in.

**Partial fit, stated.** ATT&CK does not describe task scams. The mechanics — simple
repetitive tasks, commission on a platform, small real payouts, then a deposit to "complete the
next set" — come from the US FTC's December 2024 data spotlight "Paying to get paid: gamified
job scams drive record losses", which reports about 20,000 task-scam reports in the first half
of 2024 against about 5,000 in all of 2023
([FTC](https://www.ftc.gov/news-events/data-visualizations/data-spotlight/2024/12/paying-get-paid-gamified-job-scams-drive-record-losses)).
The Indian form — unsolicited WhatsApp messages, small payments "to gain their trust", then
"prepaid tasks" — is described in an I4C-referenced bank advisory
([UCO Bank security advisory](https://uco.bank.in/documents/d/guest/security-advisory-beware-of-task-based-job-scams)).
The account-for-payouts ending is the money-mule recruitment that follows the same schemes.

### What must NOT be copied

No real employer, job portal, task platform, bank, UPI handle or payment rail. "BrightReach
Digital", "TaskHub Rewards", "JobsBoard", "Falcon Bank", "SUNIL K" and "RK ENTERPRISES" are
invented; the handles end in `@trainingpay`; the products rated are generic.

### Client requirements preserved

Stage 2's "unsolicited recruiter chat… then displays small synthetic earnings" is the chat from
an unsaved number, the INR 150 "joining gift" and the payout screenshot. Stage 3's "unknown
number, unrealistic pay, generic company name and move-to-payment pressure" are the contact
card (not a business account, company named in the chat only), INR 3,000 a day, a task site
under a different brand, and the Level 2 messages. Stage 4's "task dashboard showing a bonus,
then a 'recharge to unlock' demand" is literal. Stage 5's "independently found corporate site
and known vacancy channel" is the JobsBoard app. Stage 6's "stop tasks; report/block; do not
pay to earn" is the resolve banner.

### Enhanced synthetic storyline

At 08:40 "Mia from the HR team at BrightReach Digital" says she found the learner's profile on a
job portal. At 08:41 the job advert arrives — marked "Forwarded many times". At 08:44 the
client's headline; at 08:46, "I have already sent INR 150 to your UPI number as a joining gift".
It is there, in the learner's bank app, from a personal account. Once the chat is being read, a
link to "TaskHub - member tasks" arrives with a mentor code. At the branch stage Level 2 is
announced — a "premium merged order" with 30% commission, a recharge that "comes back", and INR
500 for each friend invited.

### Conversation progression

1. `08:40–08:47` — the hello, the forwarded advert, the headline, the gift, a payout screenshot.
2. `inspect` — the TaskHub link and the mentor code.
3. `branch` — Level 2, the refundable recharge, the referral bonus.
4. `verify` — the typing strip.

### Evidence the learner can discover (progressive)

- **"Forwarded many times"** on the job advert — a bulk template, not a personal approach.
- **Contact info**: a personal account, company named only in the chat, on WhatsApp since last month, no groups in common.
- **The bank app**: INR 150 from "SUNIL K", an individual savings account, remark "gift" — not a company.
- **The task site**: three ratings add INR 150 each; Level 1 "complete"; withdrawal "after Level 2"; then a merged order at −INR 4,860 with a recharge of INR 5,000 and a 30-minute expiry.
- **The withdraw page**: bank details "so payouts arrive the same day", and fine print that payouts "may be routed through" the account.
- **JobsBoard**: the real BrightReach hires full-time office roles, never recruits on WhatsApp, never asks for payment, offers no rating tasks; "TaskHub Rewards" is not a listed employer.

### Learner interaction journey

`notification → chat list → thread (forwarded advert) → contact info / bank app → the task link →
three tasks → Level 1 → merged order → recharge sheet (or withdraw form) — or the refusal in the
composer → JobsBoard → report`

### Simulation surfaces

Contact sheet (`CONTACT`, 3 tabs), bank app (`APP`), task site (`BROWSER`, 9 pages, a bank-details
form), recharge sheet (`PAYSHEET` with a PIN), JobsBoard (`APP`). New thread element: the
**forwarded / forwarded-many-times** label.

### Verification mechanism

`verify_known_app` on JobsBoard — a vacancy channel the learner already uses, not a link from
the chat. "Ask Mia for an offer letter and the company registration" is the 0-point route.

### Safe resolution

The refusal in the composer (`SAFE_PIVOT` +3), JobsBoard (`TRUSTED_VERIFY` +3), then report or
block (+2). Ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Recharge INR 5,000 (on the recharge sheet) | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Link account (withdraw form) | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| "YES ✅ send me the next tasks" | `reply` | `RISKY_OPEN_REPLY` | −3 |
| "Sharing your invite with 3 friends now" | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Reply "YES" from the notification | `reply` (open) | `PREMATURE_REPLY` | −1 |
| Ask Mia for an offer letter | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |

Doing the tasks is navigation. That is deliberate: the free tasks are what builds commitment,
and scoring them would stop them working the way they work on people.

### Scoring / event mapping (unchanged)

Identical to W12 and W13: `SAFE_PIVOT +3` / `RISKY_OPEN_REPLY −3` /
`SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`, `TRUSTED_VERIFY +3` / `REPORT_ONLY_WITHOUT_CHECK +1` /
`VERIFY_THROUGH_MESSAGE 0`, `RESOLVE_CORRECT +2` / `CONTRADICTORY_UNSAFE_FINAL −4`.

### Realism decisions

The INR 150 is allowed to be persuasive: it really is in the account. What gives it away is
who sent it, and the learner has to open their own bank to see that. The negative balance is
the "merged order" device reported in these schemes.

### Known limitations

One decision per stage: a run records the recharge or the bank details, not both. The task
balance is authored per page and does not recompute.

### Why the final simulation stays faithful

The browser asset is the task site; events on it name the bank's own asset. The PIN and the bank
details are typed into local fields only and never reach the wire (asserted).

---

## 3. W18 — Hijacked Group Admin Roster Link

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Hijacked Group Admin Roster Link |
| Disposition | Malicious |
| Level | Hard |
| Family (client) | Compromised admin / group spearphishing |
| Canonical family | `identity_data_harvesting` |
| Trigger (client) | Authority + routine \| FICTIONAL MILITARY CONTEXT |
| Canonical triggers | `authority`, `routine` |
| Military flag | Yes |
| End state | The verified admin confirms takeover; the group post is locally marked removed. |
| Decision signal (stage 3) | A trusted account can be hijacked; the approved roster process never uses a public form. |

### MITRE ATT&CK alignment

| Technique | Name | Matrix / tactic | Version | Created / last modified |
| --- | --- | --- | --- | --- |
| [T1586.001](https://attack.mitre.org/techniques/T1586/001/) | Compromise Accounts: Social Media Accounts | Enterprise / Resource Development | 1.1 | 1 October 2020 / 24 October 2025 |
| [T1534](https://attack.mitre.org/techniques/T1534/) | Internal Spearphishing | Enterprise / Lateral Movement | 1.4 | 4 September 2019 / 12 May 2026 |
| [T1598.003](https://attack.mitre.org/techniques/T1598/003/) | Phishing for Information: Spearphishing Link | Enterprise / Reconnaissance | 1.7 | 2 October 2020 / 12 May 2026 |

### Why this maps

T1586.001 is the account: an existing persona whose use "may engender a level of trust in a
potential victim if they have a relationship… with the compromised persona". T1534 is the
delivery: a "trusted internal account" used against others "within the same organization" —
and its description now names internal chat apps explicitly. T1598.003 is the link: a page
where "information is gathered in web forms and sent to the adversary" — service number,
appointment and current location.

**Partial fit, stated.** T1586.001 names social-media profiles; a WhatsApp account is a
messaging account compromised the same way. The takeover method — reading out a verification
code to someone pretending to be a known contact or support — is the one police advisories are
still describing in 2026: the Singapore Police Force's advisory of 12 March 2026 on WhatsApp
account compromise
([SPF](https://www.police.gov.sg/Media-Hub/News/2026/03/20260312_police_advisory_involving_the_compromise_of_whatsapp_accounts)).

### What must NOT be copied

No real unit, company, roster system, form service or personnel. "Alpha Coy", "Hav. Suresh",
"Roster" and the form host are invented; no service number appears anywhere in the scene.

### Client requirements preserved

Stage 2's "long-standing Unit Falcon group thread" is a group created three years ago, with
January's rule and last Friday's roster. Stage 3's "admin's message history, changed tone,
unusual link domain and other members' reactions" are the admin's card (recent messages, all
signed "- Coy Office"), today's unsigned capitals, the first link to that host in the group's
history, and the reactions and replies around the post. Stage 4's "prefilled roster form asking
service number, role and current location" is literal. Stage 5's "call the admin via known
directory and check the approved roster system" is the Coy Office desk and the Roster app.
Stage 6's "report to group admins and unit security; warn without forwarding the link" is the
resolve banner. The 250-character rationale box is the existing one beside the phone.

### Enhanced synthetic storyline

At about seven the Coy Office clerk took a call from someone claiming to be from Bn signals and
read out a code. Nine minutes later the group shows that the admin's security code changed;
three minutes after that, the admin changes the group description. At 19:30 the post arrives
with a link; at 19:31, in capitals, the threat to leave. Nk Pillai replies "Done ✅". L/Nk Bhatt
quotes January's pinned rule and asks whether this is new. Hav. Joshi writes something — and it
is deleted by the admin. The admin answers Bhatt: "new system from Bn HQ".

### Conversation progression

1. `14 JANUARY` — the rule, pinned, 👍 31. `LAST FRIDAY` — the roster post, 👍 14.
2. `TODAY` — security code changed; description changed; the headline and the link; the capitals.
3. The reactions: "Done ✅", Bhatt's question, Joshi's deleted message, the admin's reply.
4. `branch` — "Filled 👍"; "23 of 48 done. Remaining confirm NOW."
5. `verify` — the admin typing.

### Evidence the learner can discover (progressive)

- **The pinned bar**: the same admin's own rule — never service numbers, appointments or locations on WhatsApp.
- **System lines**: the security code change and the description change, minutes before the post.
- **The deleted message**: "This message was deleted by admin Admin", right after a question.
- **Group info → About**: the description changed today at 19:24 by the admin; admins can delete anyone's messages.
- **Group info → Media**: the form host is the first link to that site in this group.
- **The admin's card**: the same saved number, security code changed today at 19:21, and recent messages all signed "- Coy Office".
- **The Roster app**: no correction window open; forms outside the app: none; location never part of the roster.

### Learner interaction journey

`notification → chat list → group → pinned bar / group info → participants → the admin's card →
the form (local) → leave it → the Coy Office desk → report`

### Simulation surfaces

Group sheet (`GROUP`, 3 tabs, navigable admin), the admin's card (`CONTACT` with a message
sample), roster form (`BROWSER`, form + review + receipt), Roster app (`APP`), Coy Office call
(`CALL`), two directory rows. New thread elements: **deleted-by-admin messages**, **reactions**,
and the **pinned bar**.

### Verification mechanism

`verify_known_number` on the Coy Office desk number from the directory — a different channel
from the account that posted — or `verify_known_app` on the Roster app. The clerk confirms the
takeover. Asking the admin in the group is the 0-point route: whoever holds the account answers.

### Safe resolution

Leaving the form (`SAFE_PIVOT` +3), the Coy Office desk (`TRUSTED_VERIFY` +3), then the report to
Coy 2IC and unit security (`RESOLVE_CORRECT` +2). Ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Submit entry (on the form's review page) | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| "Admin sir, is this link correct?" | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Forward the link to my section's group | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Open the form link from the preview | `open_link` (open) | `PREMATURE_REPLY` | −1 |
| Ask Admin in the group to confirm the link | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |

### Scoring / event mapping (unchanged)

Identical to W17.

### Realism decisions

Nothing about the account is wrong: same number, same avatar, same group. The only evidence is
what the group itself records about what changed, and how differently the admin writes today.
After a submission, the next message asks for "a 6-digit code by SMS" — the chain that turns
one hijacked account into many.

### Known limitations

"The group post is locally marked removed" is expressed through the Coy Office call and the
outcome card rather than a post-resolve thread change, because the run ends at resolve.

### Why the final simulation stays faithful

The admin is the bank's own sender and number; the form is the bank's browser asset. Typed
values never leave the form component (asserted).

---

## 4. W19 — Commander Clone Requests Location

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Commander Clone Requests Location |
| Disposition | Malicious |
| Level | Hard |
| Family (client) | Military impersonation / location collection |
| Canonical family | `operational_elicitation` |
| Trigger (client) | Authority + secrecy \| FICTIONAL MILITARY CONTEXT |
| Canonical triggers | `authority`, `isolation_secrecy` |
| Military flag | Yes |
| End state | Location permission remains off and the impersonating account is blocked. |
| Decision signal (stage 3) | The account is new, lacks expected mutual groups, and requests live location outside procedure. |

### MITRE ATT&CK alignment

| Technique | Name | Matrix / tactic | Version | Created / last modified |
| --- | --- | --- | --- | --- |
| [T1684.001](https://attack.mitre.org/techniques/T1684/001/) | Social Engineering: Impersonation | Enterprise / Stealth | 1.0 | 14 April 2026 / 12 May 2026 |
| [T1585.001](https://attack.mitre.org/techniques/T1585/001/) | Establish Accounts: Social Media Accounts | Enterprise / Resource Development | 1.1 | 1 October 2020 / 12 May 2026 |
| [T1593.001](https://attack.mitre.org/techniques/T1593/001/) | Search Open Websites/Domains: Social Media | Enterprise / Reconnaissance | 1.0 | 2 October 2020 / 24 October 2025 |
| [T1598](https://attack.mitre.org/techniques/T1598/) | Phishing for Information | Enterprise / Reconnaissance | 1.4 | 2 October 2020 / 12 May 2026 |

**Considered and rejected:** [T1430](https://attack.mitre.org/techniques/T1430/) Location Tracking
(Mobile, Collection / Discovery, v1.2). Its description is adversaries using OS location APIs
"through malicious or compromised applications". Nothing here is malware: a person is being
talked into pressing Share. Mapping it would be forcing a technique to cover the word
"location".

### Why this maps

T1684.001 is impersonating "a trusted person or organization in order to persuade and trick a
target into performing some action". T1585.001 is the account: a profile photo and an About
line copied onto a number created three days ago. T1593.001 is where the material came from —
the unit's public page, which the account quotes ("the photos on the unit page"); the technique
names information about "the roles, locations, and interests of staff". T1598 is the request:
information obtained "through the exchange of… instant messages".

**Real-world pattern.** Indian reporting on the Army's advisories describes profiles built from
officers' pictures taken from the internet, WhatsApp accounts on numbers the impersonator
controls, and engagement with personnel "for extracting information"
([Khatabook explainer](https://khatabook.com/blog/how-to-protect-yourself-from-fake-armyman-frauds/);
[Outlook India](https://www.outlookindia.com/national/india-news-isi-agents-posing-as-women-can-trap-you-on-social-media-army-warns-soldiers-news-341884)).

### What must NOT be copied

No real officer, unit, parade, convoy, route or position. "Col. Vikram Sehgal", "Capt. Arora",
the old depot and the river road are invented; the map is drawn blocks and a pin with no place
on it; no coordinates exist anywhere.

### Client requirements preserved

Stage 2's "direct chat from a near-identical account… references a public event" is the chat
that opens on the Raising Day parade photos. Stage 3's "exact number, account age, common groups
and small name-character difference" are the contact card (a different number, on WhatsApp
three days, no groups in common) and the About line "Seghal" against the real "Sehgal". Stage
4's "live-location share sheet with 15-minute/1-hour options" is the phone's own sheet, reached
through the attach menu and the location permission. Stage 5's "duty office or senior through
an approved known route" is the duty office's directory number or the CO's saved number. Stage
6's "cancel location share; report the clone; notify unit security" is the resolve banner.

### Enhanced synthetic storyline

The day after the Raising Day parade, whose photographs are on the unit's public page, a new
account with the CO's photo and About line messages the learner: well turned out yesterday;
"I am on this number for a few days, the other phone is with the move staff"; then the
client's headline, and "Share live location for 1 hour… for the convoy plan". At the branch
stage: "This move is close hold, so not a word in the officers' group." One row down in the
chat list, the real CO's chat from 15:10 says: convoy brief 1800 in the ops room, positions only
on the move control net — nothing on WhatsApp, including to him.

### Conversation progression

1. `16:30–16:33` — the parade, the "other phone".
2. `16:38` — the client's headline. `16:39` — "Share live location for 1 hour."
3. `branch` — the secrecy line. `verify` — the typing strip.

### Evidence the learner can discover (progressive)

- **The chat list**: the real CO, saved, a different number, a message at 15:10 — and the row opens.
- **The real CO's card → Recent messages**: "Positions only on the move control net - nothing on WhatsApp, including to me."
- **Contact info (new account)**: on WhatsApp since 3 days ago, no groups in common, and an About line one letter off.
- **The location screens**: WhatsApp does not have location permission on this phone; the sheet states who receives the location, how accurately and for how long.

### Learner interaction journey

`notification → chat list (the real CO's row) → thread → contact info → paperclip → Location →
permission → Don't allow (or through to the share sheet) → duty office → block`

### Simulation surfaces

Contact sheets for both accounts (`CONTACT`, same tabs), the location screens (`INSTALLER`
system chrome: a permission dialog and a new **share sheet** page style with a drawn map), two
calls (`CALL`), two directory rows. New interactions: the **attach sheet** behind the paperclip,
and **opening a second chat's details from the chat list**.

### Verification mechanism

`verify_known_number` on the duty office (directory) or the CO (saved for two years). Both say
the CO is in the ops room, has one number, and nobody sends positions on WhatsApp. "Ask this
number to prove who it is" is the 0-point route.

### Safe resolution

"Don't allow" on the permission, or Cancel on the share sheet (`SAFE_PIVOT` +3), the duty office
(`TRUSTED_VERIFY` +3), then block or report (+2). Ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| 15 minutes / 1 hour / Send your current location instead | `share_location` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| "Sir, we are at the old depot, moving 0500 by the river road" | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| "Sir, which detachment should I report with?" | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Reply "Yes sir" from the notification | `reply` (open) | `PREMATURE_REPLY` | −1 |
| Ask this number to prove who it is | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |

Granting the permission is navigation, deliberately: nothing leaves the phone until a share is
sent, and that is the decision scored.

### Scoring / event mapping (unchanged)

Identical to W17.

### Realism decisions

The name difference is two transposed letters in a line most people skim, and nothing points at
it. The strongest evidence is not on the account at all: it is the real CO's own instruction,
an hour earlier, in a chat the learner already has.

### Known limitations

The location permission is reset on every run (nothing is persisted); "remains off" is what the
safe path does, not a device setting the simulation stores.

### Why the final simulation stays faithful

The sender is the bank's "Commander" and number. No location is read, granted or sent — there
is no geolocation call anywhere in the product (checked by source search).

---

## 5. W20 — Supplier Bank-Detail Change

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Supplier Bank-Detail Change |
| Disposition | Malicious |
| Level | Hard |
| Family (client) | Procurement impersonation / payment diversion |
| Canonical family | `payment_diversion` |
| Trigger (client) | Routine + urgency |
| Canonical triggers | `routine`, `urgency` |
| Military flag | No |
| End state | Beneficiary change is rejected and the legitimate supplier confirms no request. |
| Decision signal (stage 3) | Accurate invoice details may be stolen; bank-detail changes require independent callback and approved workflow. |

### MITRE ATT&CK alignment

| Technique | Name | Matrix / tactic | Version | Created / last modified |
| --- | --- | --- | --- | --- |
| [T1657](https://attack.mitre.org/techniques/T1657/) | Financial Theft | Enterprise / Impact | 1.2 | 18 August 2023 / 12 May 2026 |
| [T1684.001](https://attack.mitre.org/techniques/T1684/001/) | Social Engineering: Impersonation | Enterprise / Stealth | 1.0 | 14 April 2026 / 12 May 2026 |

### Why this maps

T1657 names business email compromise and its detection guidance names "fraudulent invoices,
impersonation of vendors, or BEC-style payment redirections". T1684.001 is the supplier's logo
on a new business account — and its description notes that an adversary may compromise
accounts at one organisation "to support impersonation against other entities", which is how
the real invoice reached the impostor.

**Real-world pattern.** The FBI's IC3 reported 24,768 BEC complaints and about USD 3.05 billion
in losses in its 2025 annual report
([IC3 2025 report](https://www.ic3.gov/AnnualReport/Reports/2025_IC3Report.pdf)); its
September 2024 PSA puts exposed losses at USD 55.5 billion over a decade and advises using
"secondary channels" to verify any change in account information
([IC3 PSA240911](https://www.ic3.gov/PSA/2024/PSA240911)).

### What must NOT be copied

No real supplier, bank, IFSC, invoice scheme, ERP product or portal. "Northstar Supplies",
"Coastal Small Finance Bank", "State Co-operative Bank", NS-0142 and the portal are invented; no
full account number or IFSC appears on screen.

### Client requirements preserved

Stage 2's "supplier chat with copied invoice references… known supplier logo account… new
beneficiary" is the business account with the Northstar logo quoting the PO, the invoice and the
amount. Stage 3's "new number, beneficiary mismatch and deviation from change-control process"
are the business card, the revised invoice's bank block against the beneficiary on file, and the
vendor record's rule. Stage 4's "synthetic invoice plus beneficiary-edit/payment screen" is the
revised PDF and the procurement portal's Edit beneficiary / review screens. Stage 5's "call the
supplier contact already on file and obtain dual approval through procurement workflow" is Rohit
Kapoor on the vendor-record number, or the Procurement Cell. Stage 6's "hold payment; report the
impersonation; record the discrepancy" is the resolve banner; the rationale box is the existing
one.

### Enhanced synthetic storyline

Northstar's accounts mailbox was broken into last week. This morning an account with the
Northstar logo — a WhatsApp business account opened on Monday — says Rohit is on leave, quotes
the PO, the invoice and the amount exactly, and says the bank is under audit. It sends the
invoice again, "revised": identical except the bank block. The payment run closes today; the
portal already shows the invoice approved for payment, with a single-approver override for
payments due today.

### Conversation progression

1. `08:52–08:54` — "Rohit is on leave"; the exact PO, invoice and amount.
2. `09:00` — the client's sentence in full. `09:01` — the revised invoice PDF. `09:03` — dispatch pressure.
3. `branch` — "Our MD has asked me to confirm by 2 pm"; "do not use the old account".
4. `verify` — the typing strip.

### Evidence the learner can discover (progressive)

- **Business info**: business account, not verified, a logo anyone can upload, a billing website, on WhatsApp since Monday.
- **The revised invoice**: every reference correct; pay to NORTHSTAR SUPPLY SERVICES at another bank; file created today, no digital signature; the contact number is the WhatsApp number.
- **The portal → invoice**: received through the vendor portal on 3 Sep; beneficiary on file verified at onboarding.
- **The portal → vendor record**: the contact and number on file, the real website, no pending change requests, and the rule: letterhead via the vendor portal, callback to the contact on file, second-officer approval, nothing by messaging app.

### Learner interaction journey

`notification → chat list → thread → business info / revised invoice → procurement portal →
vendor record → Put invoice on hold (or Edit beneficiary → review → release / submit) → Rohit on
the vendor-record number → report`

### Simulation surfaces

Business card (`CONTACT`, 3 tabs), invoice viewer (`VIEWER`), procurement portal (`BROWSER`, 7
pages with a bank-details form and three page-scoped commit controls), two calls (`CALL`), a
Procurement Cell directory row.

### Verification mechanism

`verify_known_number` on the vendor-record number: Rohit is not on leave, nothing has changed, and
his mailbox was broken into. `verify_trusted_directory` on the Procurement Cell (the dual-control
route). Calling the number on the revised invoice is the 0-point route — it confirms itself.

### Safe resolution

Put invoice on hold (`SAFE_PIVOT` +3), Rohit on the number on file (`TRUSTED_VERIFY` +3), then the
report (`RESOLVE_CORRECT` +2). Ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Override and release INR 4,86,300 now | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Submit change for second approval | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| "Noted. I will update the account and pay today." | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Reply "Noted" from the notification | `reply` (open) | `PREMATURE_REPLY` | −1 |
| Call the number on the revised invoice | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |

Submitting the change for a colleague's approval is priced as a release, as the client's stage 4
says ("do not change stored bank details… from chat evidence"): dual control is a second person
checking evidence, not a way to pass unverified evidence along.

### Scoring / event mapping (unchanged)

Identical to W17.

### Realism decisions

Accurate detail is the attack, so every detail is accurate. The override for payments due today
exists because real payment systems have one, and it is exactly what the deadline is for.

### Known limitations

The portal is reached from the chat's overflow menu rather than from a home screen, because the
device has no launcher. W20's notify toast shows the truncated stored body (§0.5).

### Why the final simulation stays faithful

The payment event names the bank's own payment asset. The typed beneficiary details stay in the
form component and are never sent (asserted). The client's truncated sentence is carried in full,
and the bank is untouched.

---

## 6. Forms, inputs and data handling

Three scenes carry fields: W17 (a bank-details form and a UPI PIN), W18 (the roster form) and
W20 (the beneficiary form). The rules are unchanged from IMMERSIVE-003A-R2:

- **Local** — a value lives in `useLocalForm` inside the component that draws the field, and nowhere else.
- **Ephemeral** — it is discarded when the learner leaves the screen.
- **Never transmitted** — no affordance, intent, payload or header carries it.
- **Never persisted** — no storage, cookie, cache or file.
- **Never logged** — not to the console, not to an event, not to the ledger.
- **No autofill surface** — every input is `type="text"`, `autocomplete="off"`, with a meaningless `name` of the form `f0`.
- **No form submission** — there is no `<form>` element and no action anywhere.
- **Deterministic** — the same page always behaves the same way.
- **Not decorative** — a form exists only where refusing to fill it in is the decision being tested.

The engine's `METADATA_ALLOWLIST` is the second line of defence: an event may carry only
`intent`, `transition`, `consequence`, `resolution_code`, the duration measures, `verify_source`
and `premature`, and a key outside that list is rejected rather than dropped.

**A shared defect found and fixed during browser verification.** `localForm.normalise` capped
every field at its minimum `length` and ignored its `max`, so "Appointment / role" stopped at
three characters — and so, since IMMERSIVE-003A-R2, had W02's "Name on card" and UPI ID, W05's ID
number and W08's name on card. A field now accepts up to `max` (secrets and expiry still stop at
`length`); validation and every containment rule above are unchanged.

**W16 and W19 carry no form.** W16's decision is a reaction or a draft reply; W19's is a system
dialog and a share sheet whose choices are buttons. Adding fields to either would have been
decoration.

---

## 7. What is asserted, and where

| Claim | Test |
| --- | --- |
| Every W16–W20 control resolves to a legal transition on its own real definition; each safe path sums to ten; 56 new pinned event/point pairs | `backend/tests/sceneAffordance.test.js` |
| Each W16–W20 walk, resolved by the engine, produces the review JOB 1 shows — the scenario's own stage text as the correct action, the W16 false positive classified as such, no event code or point value | same |
| W01–W20 authored; W21–W25 stay generic | `sceneModel.test.js`, `sceneAffordance.test.js` |
| No narrator verdict or labelling word in W16–W20; W20 added to the truncation list | `frontend/src/simulation/sceneModel.test.js` |
| Each of W16–W20 carries the interaction it was built around, absent from W01–W15; five distinct branch shapes; a wrong answer beside a right one in every resolve banner | same |
| Containment at every stage and surface (W19's location screens walked explicitly) | `SceneContainment.test.jsx`, `pages/SceneScenariosD.test.jsx` |
| Each scenario end to end through the controller; local navigation records nothing; remount replays nothing; typed values and PINs never leave | `frontend/src/pages/SceneScenariosD.test.jsx` |
| This document covers every authored scenario and cites every technique it names | `frontend/src/simulation/sceneResearch.test.js` |

Bank fingerprint expected before and after this task:
`8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687`

Synthetic fingerprint expected before and after this task:
`2779b03939e13cf11e0bee44493609f0c91e228f201f22f8c025a080509afde1`
