# WhatsApp W11–W15 — real-world research and storyline reconstruction

**Task:** IMMERSIVE-003C
**Scope:** WhatsApp W11, W12, W13, W14, W15 only. W01–W10 are unchanged, W16–W25, Instagram, Email and SMS are untouched.
**Status:** design record for the five scenes authored by this task.
**Companions:** [`WHATSAPP_W01_W05_REAL_WORLD_RESEARCH.md`](WHATSAPP_W01_W05_REAL_WORLD_RESEARCH.md) and [`WHATSAPP_W06_W10_REAL_WORLD_RESEARCH.md`](WHATSAPP_W06_W10_REAL_WORLD_RESEARCH.md) — the same method, applied to the first two batches.

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

What is taken from the real world is **timing, sequencing, social pressure, impersonation
shape, conversation progression, escalation, contextual evidence and the realism of the
interfaces**. What is deliberately **not** taken is infrastructure, tooling, live hosts,
working kits, real brands, real units, real personnel, real numbers or anything
operational. Every host is `*.training.example`; every Indian number is in the reserved
`+91 00000 xxxxx` range; the one foreign number (W12) is in the UK regulator's block
reserved for drama, `+44 7700 900xxx`; every page, form, call, installer and voice note is
local, inert and offline.

### 0.2 Source of the threat intelligence

Primary source: **MITRE ATT&CK, Enterprise and Mobile matrices, website version v19.2**
— confirmed as the current version on the live site during this task
(<https://attack.mitre.org/versions/>). Every technique below was read from the live
technique page rather than recalled, and the ID, tactic, version, created and last-modified
dates are recorded so a later reviewer can check the same page.

Secondary sources, for the real-world pattern each scenario is built from, are public
advisories and published research, cited in each section: the Indian Cyber Crime
Coordination Centre (I4C) on "digital arrest", the market regulator SEBI on WhatsApp
investment groups, SentinelOne on Transparent Tribe's Android spyware, the FBI's public
service announcements on AI-generated voice messages, and a state police advisory on fake
helpline numbers in search results.

Version notes for anyone re-reading older material. `T1656 Impersonation` no longer exists
as a top-level technique and resolves to **T1684.001**. Its new parent, **T1684 Social
Engineering** (created 14 April 2026), is used in this batch for the first time, because
its own description now names the two things W12 and W15 are about: scare tactics that
"threaten repercussions for non-compliance", and "AI-enabled voice interactions".

### 0.3 Interpretation rule

ATT&CK is used as a **behavioural reference, not a requirement**. A mapping is recorded
only where the technique's own description actually describes what the scenario does. Where
it does not, the section says so in as many words rather than reaching for the nearest
plausible ID: W11 has no mapping, and that is stated rather than quietly omitted. Where a
technique fits only partly, the section says which part.

The direction of the work is always `REALISTIC THREAT PATTERN -> AUTHORED STORY ->
REALISTIC WHATSAPP INTERACTION`, never `MITRE TECHNIQUE -> artificial story`.

### 0.4 What this document may and may not change

| Thing | May IMMERSIVE-003C change it? |
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

The DATA-003 generator captures the client's notification with a non-greedy match that stops
at the **first apostrophe**. Twelve of the hundred scenarios are affected; **W15** is the one
in this batch. Its stored body is `Voice note - Send today`, from the client's
"Voice note - Send today's access phrase here; official phone is unavailable."

Handled exactly as W06 and W09 were in IMMERSIVE-003B: the bank is left as it is, the scene
states the client's full sentence, and `sceneModel.test.js` lists W15 beside W06 and W09 and
asserts that the scene text **starts with** the stored string. The notification toast at the
notify stage is server-driven and still shows the stored text — a visible defect, recorded
as a known limitation, and not worked around twice.

### 0.6 Content note — the narrator line is not printed in this batch

Every scenario in the bank carries a `prior_context` sentence, the client's "Context
presented" text, and the W01–W10 scenes print it as a grey notice at the top of the thread.
For this batch it states the verdict outright:

| Scenario | The stored sentence contains |
| --- | --- |
| W13 | "fabricated profits and a supposed adviser" |
| W15 | "a cloned profile sends a convincing synthetic voice note" |
| W11 | "the saved office account confirms a time" |

Printing those on the device would be exactly the answer leakage this task forbids. So
W11–W15 **present the same context through the conversation** — W13's learner is shown being
added to a group full of profit posts and an adviser offering allotments; W15's learner hears
the voice note from the new account — and `sceneModel.test.js` asserts that neither the
sentence nor any word that labels the item appears anywhere in the five scenes.

Recorded, not changed: two already-shipped scenes print verdict-bearing narrator lines of the
same kind — W09 ("a saved colleague's genuine account sends an out-of-character request") and
W10 ("a fake support account"). They are outside this task's scope and are listed as a finding
for the next content pass.

### 0.7 Content note — placeholder assets the client's stage text overrides

Carried forward in the same way as W03 and W04 in IMMERSIVE-003A:

| Scenario | Placeholder | Resolution |
| --- | --- | --- |
| W11 | The sender record says `verified: false`; stage 2 says "the verified business chat". | The scene shows a **saved business account** with a year of history and shows no verification badge. A badge would become the answer; the learner's own save and the portal reference are the verification. |
| W12 | The call asset names the chat's own number; stage 3 requires an "unknown country code". | The video call comes from a separate "secure line" in the UK drama range. The chat keeps the bank's sender. The event still names the bank's call asset. |
| W12, W13 | The payment asset is `INR 0.00` with the sender as payee. | The sheets show the amount and the unrelated payee the stage text describes. The event still names the bank's payment asset. |

---

## 1. W11 — Expected Welfare Appointment

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Expected Welfare Appointment |
| Disposition | **Legitimate** |
| Level | Medium |
| Family (client) | Legitimate appointment confirmation |
| Canonical family | `legit_system_confirmation` |
| Trigger (client) | Authority + routine |
| Canonical triggers | `authority`, `routine` |
| Military flag | No |
| End state | Appointment is marked Confirmed and no other data is requested. |
| Decision signal (stage 3) | The request is expected, contains no external link, and asks only for a low-risk confirmation. |

### MITRE ATT&CK alignment

**There is none, and none has been invented.**

ATT&CK catalogues adversary behaviour. A welfare office confirming an appointment the
learner booked in its own portal is not adversary behaviour, and mapping it to a phishing
technique because the message says "Reply C to confirm" would be the inversion this batch
was told not to perform.

**Closest defensible behavioural reference:** the discrimination problem, not a technique.
The client prices it twice. `FALSE_REPORT_BLOCK` is −4, and so is `UNSAFE_EXTERNAL_ACTION` —
the cost of taking a genuine request somewhere untrusted to "check" it.

That second cost is the scene's trap, and its real-world pattern is well documented without
needing ATT&CK: fake helpline numbers placed in search results and sponsored listings. A
state police advisory in India describes the pattern and an I4C case in which a retired
officer lost nearly INR 12 lakh after ringing a number found through a web search
([The Tribune](https://www.tribuneindia.com/news/himachal/police-issue-advisory-on-fake-customer-care-numbers/)).
The adversary in that pattern is the search result, not the office — which is exactly why
the genuine office stays unmapped.

### Client requirements preserved

Stage 2's "verified business chat with prior reference number" is a saved business account
whose thread opens on last year's appointment, in the same shape. Stage 4's "in-chat quick
reply with Confirm/Reschedule" is literal: a business message with two buttons attached to
its bottom edge, Confirm being the scored control and Reschedule walking into the portal.
Stage 5's route — "match the reference in the local appointment portal or Trusted
Directory" — is both: the Welfare Portal app, and a directory row for the office. Stage 6's
"send the in-app confirmation; retain the chat; do not report it" is the resolve stage's
Confirm-and-keep and Keep controls.

### Enhanced synthetic storyline

Last November the learner booked an appointment through the portal and the office confirmed
it here with a "Reply C" message; they replied C. On Monday they booked again, for an
education-grant session, and the same account acknowledged the portal request by reference.
Today the confirmation arrives: the reference, the slot, "Reply C to confirm", and two
buttons. It is deliberately the shape a cautious person is taught to distrust — and every
feature of it is also how genuine appointment systems work.

### Conversation progression

1. `LAST NOVEMBER` — the prior confirmation (buttons now spent), the learner's `C`, the office's thanks.
2. `MONDAY 19:14` — "We have received your request WLF-2609-0317 from the Welfare Portal."
3. `TODAY` — the business message: header with reference and slot, the client's headline, footer, Confirm / Reschedule.
4. `verify` — a routine reminder to bring the welfare card; documents are checked at the counter.

### Evidence the learner can discover (progressive)

- **The thread itself**: last year's appointment, confirmed by the same account in the same shape.
- **Business info → About**: saved last November from the portal's own contact page; an address and opening hours.
- **Business info → This chat**: used only for receipts and confirmations; no links sent; documents or payment never asked for.
- **Business info → Groups in common**: none — and a note that business accounts are not usually in your groups, so an absence here is not the tell it was in W04 and W06.
- **The Welfare Portal app**: reference WLF-2609-0317, requested by you on Monday, allotted 10:30, confirmation "by WhatsApp from the Welfare Office" on the same number, and "what you send back: a one-letter reply".

### Learner interaction journey

`notification → chat list → thread (with last year's confirmation) → business info (3 tabs)
→ Confirm on the message → Welfare Portal app → resolve`, with the search trap available
from the overflow menu at the branch stage.

### Simulation surfaces

Business info (`CONTACT`, 3 tabs), Welfare Portal (`APP`), a search-results page
(`BROWSER`, a query bar and three listings, one of them sponsored), the helpline call
(`CALL`), and a directory row.

### Verification mechanism

`verify_known_app` — the Welfare Portal app, opened from the phone. It shows the same
reference, the same slot and the same sending number. **Verification here confirms
legitimacy**, which is the half of verification a threat-only simulator never teaches.

### Safe resolution

Confirm on the office's message (`CORRECT_USE`, +3), the portal (`TRUSTED_VERIFY`, +3), then
`resolve_continue` or `resolve_retain` (+2). With `ITEM_OPEN` and `INSPECT_CONTEXT`, ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Call the sponsored "helpline" (on the search page) | `call_number` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Leave it unanswered and just turn up | `reject_ignore` | `NEEDLESS_REJECT_IGNORE` | −2 |
| Report / Block the office | `report` / `block` | `FALSE_REPORT_BLOCK` | −4 |
| Reply C from the notification | `reply` (open) | `PREMATURE_REPLY` | −1 |
| Report, block or ignore at resolve | `resolve_*` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

The helpline call opens a call in which the "helpline" asks for the welfare card number and a
INR 99 "processing charge". The genuine item was fine; the learner took it somewhere that was
not.

### Scoring / event mapping (unchanged)

`NOTIFY_SEEN 0`, `ITEM_OPEN 0` / `PREMATURE_REPLY −1`, `INSPECT_CONTEXT +2`,
`CORRECT_USE +3` / `NEEDLESS_REJECT_IGNORE −2` / `UNSAFE_EXTERNAL_ACTION −4`,
`TRUSTED_VERIFY +3` / `FALSE_REPORT_BLOCK −4` / `VERIFY_THROUGH_MESSAGE 0`,
`RESOLVE_CORRECT +2` / `CONTRADICTORY_UNSAFE_FINAL −4`.

### Why the final simulation stays faithful

The genuine item is given **more** thread and more screens than its four neighbours — four
surfaces, two days of history — so that length can never become the answer, the rule W03 and
W07 established. `sceneModel.test.js` asserts it. The reply the office asks for is sent from
the office's own button, which is the "normal in-app path" the client's stage 4 names.

---

## 2. W12 — Digital Arrest Escalation

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Digital Arrest Escalation |
| Disposition | Malicious |
| Level | Medium |
| Family (client) | Government impersonation / digital arrest |
| Canonical family | `coercion_and_extortion` |
| Trigger (client) | Fear + authority + isolation |
| Canonical triggers | `fear`, `authority`, `isolation_secrecy` |
| Military flag | No |
| End state | Call ends; no payment occurs; evidence card is stored in the simulated report queue. |
| Decision signal (stage 3) | There is no lawful 'digital arrest'; agencies do not settle allegations or demand money by WhatsApp video. |

### MITRE ATT&CK alignment

| Technique | Name | Matrix / tactic | Version | Created / last modified |
| --- | --- | --- | --- | --- |
| [T1684.001](https://attack.mitre.org/techniques/T1684/001/) | Social Engineering: Impersonation | Enterprise / Stealth | 1.0 | 14 April 2026 / 12 May 2026 |
| [T1684](https://attack.mitre.org/techniques/T1684/) | Social Engineering | Enterprise / Stealth | 1.0 | 14 April 2026 / 12 May 2026 |
| [T1657](https://attack.mitre.org/techniques/T1657/) | Financial Theft | Enterprise / Impact | 1.2 | 18 August 2023 / 12 May 2026 |

### Why this maps

T1684.001 is the uniform, the desk, the case notice and the "Investigation Desk" name:
impersonating "a trusted person or organization" to make the target act. Its parent, T1684,
supplies the mechanism the client's triggers name — its description now includes scare
tactics that "threaten repercussions for non-compliance", which is the warrant, the
countdown and the threat that anyone told will be "made an accused".

T1657 is the objective. Its description names **extortion** as a method of financial theft;
the "refundable security deposit" to a private savings account is extortion wearing the
vocabulary of procedure.

**Real-world pattern.** India's Indian Cyber Crime Coordination Centre describes "digital
arrest" as impersonation, intimidation, *digital confinement* on a video call, and then
extortion; its advisory of 6 March 2025 states that there is no concept of a digital arrest
under any Indian law, and I4C reports blocking over 83,000 WhatsApp accounts used in these
scams ([ISACA summary](https://www.isaca.org/resources/news-and-trends/industry-news/2025/trapped-virtually-understanding-digital-arrest-scams);
[All India Radio, Supreme Court notice, October 2025](https://www.newsonair.gov.in/sc-takes-strong-note-of-rising-digital-arrest-scams-seeks-centre-and-cbi-response)).
The opening pretext — a parcel stopped with passports and narcotics in it — is the one most
often reported.

### What must NOT be copied

No real agency, court, police force, officer, uniform, badge, case-numbering scheme, cargo
terminal or payment rail. "Investigation Desk", "Parcel Interdiction Cell", "Insp. R.
Rathore", case IDX-2291 and the receiving account are invented. The uniform is a drawn
figure in an olive block with a cap shape and a yellow dot — deliberately not any real
insignia — and the notice's seal is a drawn roundel.

### Client requirements preserved

Stage 2's "open the chat followed by an incoming video-call screen" is the chat list with the
secure line's missed video call already on it, and the call can be answered from the list —
the engine's own premature route. Stage 3's "unknown country code, fabricated case PDF and
demand for secrecy" are the secure line's `+44` number (in the status line, on the notice and
on the call), the notice itself, and the chat's instruction not to tell anyone. Stage 4's
"synthetic video call with a uniformed avatar, countdown and 'security deposit' demand" is
implemented literally. Stage 5's "end the call and use a known official number/unit security
route; never the supplied case contact" is the support-desk call, with the notice's own line
present as the 0-point route. Stage 6's "terminate; preserve evidence; report/block" is the
resolve stage.

### Enhanced synthetic storyline

An unsaved "Investigation Desk" says a parcel booked against the learner's ID was stopped with
passports, bank cards and narcotics in it, sends a case notice, and says the investigating
officer will video call from a secure line — and that the learner must not disconnect or tell
anyone, including family. The secure line is already calling. On the call, an officer in
uniform keeps the camera on the learner, declares a "digital arrest", repeats the secrecy
demand, puts a countdown in the frame and asks for a refundable security deposit and a view
of the ID card.

### Conversation progression

1. `13:47`–`13:48` — the desk introduces itself and the parcel.
2. `13:52` — the case notice PDF.
3. `13:58` — the client's headline, then the secure line and the secrecy instruction.
4. `branch` — the video call ringing in the thread, and "Answer now. If you disconnect it will be recorded as non-cooperation."
5. `verify` — "Case IDX-2291 remains open. Do not share this chat with anyone."

### Evidence the learner can discover (progressive)

- **The chat list**: a missed video call from a `+44` number, beside a chat that says it is an Indian investigation desk.
- **Contact info → About**: not an official or business account, on WhatsApp since last week, and a status line naming the `+44` "verification line".
- **The notice**: no court named, a typed name for a signature, a WhatsApp video number as the only contact, and a deposit demand.
- **The call**: the countdown, the "do not disconnect", the "whoever you tell will also be made an accused".
- **The deposit sheet**: the account is a private savings account in a trader's name, and UPI transfers cannot be recalled.

### Learner interaction journey

`notification → chat list (missed video call) → thread → contact sheet / notice → Answer →
video call → End call (or the deposit sheet, or the ID) → support-desk call → resolve`

### Simulation surfaces

Contact sheet (`CONTACT`, 3 tabs), notice viewer (`VIEWER`), **video call** (`CALL` in its new
video mode: drawn remote party, countdown overlay, captions, a local link to the deposit),
deposit sheet (`PAYSHEET` with a local PIN field), support-desk call (`CALL`), notice-line call
(`CALL`).

**The distinct interaction is the call you have to leave.** In W09 the learner had to place a
call the message forbade; here they have to *end* one the caller forbids. So End call on this
screen is the scored decision (`endCallScored`), and the phone's own End call steps aside
while the stage offers it, rather than giving a second, unscored way to do the same thing.
Once the stage has moved on, the phone's button returns.

### Verification mechanism

`verify_known_number` on the support desk's approved number from the directory. The desk
says there is no such thing as a digital arrest, that nobody settles a case by taking a
deposit, and to keep the chat and the notice as evidence and report both numbers.

### Safe resolution

End call on the video call — or the composer's refusal — (`SAFE_PIVOT`, +3), the support desk
(`TRUSTED_VERIFY`, +3), then `resolve_report` or `resolve_block` (+2). Ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Pay INR 1,85,000 (on the deposit sheet, reached from the call) | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Hold my ID card up to the camera | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Stay on the call with the camera on | `call_number` | `RISKY_OPEN_REPLY` | −3 |
| "Please, I have not sent any parcel. I will cooperate." | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Answer the incoming video call from the chat list | `call_number` (open) | `PREMATURE_REPLY` | −1 |
| Call the line printed on the notice | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |

Answering the call is **navigation**, not a decision — picking up a phone is not the failure;
staying isolated on it, showing the ID or paying is. That keeps both the −3 and the −8 routes
reachable in the same run, the W08 / W09 improvement applied to a call.

### Scoring / event mapping (unchanged)

`NOTIFY_SEEN 0`, `ITEM_OPEN 0` / `PREMATURE_REPLY −1`, `INSPECT_CONTEXT +2`,
`SAFE_PIVOT +3` / `RISKY_OPEN_REPLY −3` / `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`,
`TRUSTED_VERIFY +3` / `REPORT_ONLY_WITHOUT_CHECK +1` / `VERIFY_THROUGH_MESSAGE 0`,
`RESOLVE_CORRECT +2` / `CONTRADICTORY_UNSAFE_FINAL −4`.

### Why the final simulation stays faithful

Content note: the two-number design and the deposit amount override placeholder assets, as
recorded in §0.7, and the events still name the bank's own call and payment assets. Nothing
in the call is played or recorded: the "camera" is a drawn tile the simulation never turns
on, and the countdown is a number derived from the call's own local clock.

---

## 3. W13 — Guaranteed IPO Group

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Guaranteed IPO Group |
| Disposition | Malicious |
| Level | Medium |
| Family (client) | Investment-group fraud |
| Canonical family | `investment_and_task_fraud` |
| Trigger (client) | Greed + social proof |
| Canonical triggers | `greed`, `social_proof` |
| Military flag | No |
| End state | Group disappears from inbox and synthetic deposit remains zero. |
| Decision signal (stage 3) | Guaranteed returns, private deposits and unsolicited group additions are incompatible with regulated advice. |

### MITRE ATT&CK alignment

| Technique | Name | Matrix / tactic | Version | Created / last modified |
| --- | --- | --- | --- | --- |
| [T1657](https://attack.mitre.org/techniques/T1657/) | Financial Theft | Enterprise / Impact | 1.2 | 18 August 2023 / 12 May 2026 |
| [T1585.001](https://attack.mitre.org/techniques/T1585/001/) | Establish Accounts: Social Media Accounts | Enterprise / Resource Development | 1.1 | 1 October 2020 / 12 May 2026 |

### Why this maps

T1657's description lists **"pig butchering"** among the campaign types it covers — the
pattern of building trust with fabricated gains before taking a deposit the victim will never
see again. That is this scenario: a welcome bonus that shows on a dashboard, profits that
cannot be withdrawn, and a "processing tax" to release them.

T1585.001 is the cast. Its description is persona development — "public information,
presence, history and appropriate affiliations" — and its detection guidance mentions
"recently created/modified accounts". The professor, the assistant and the four grateful
members are six admin accounts on consecutive numbers in a group created four days ago.

**Partial fit, stated:** neither technique describes the *group* mechanics — admin-only
posting, shills as admins — which come from the regulator's descriptions rather than from
ATT&CK.

**Real-world pattern.** SEBI's advisories describe WhatsApp "VIP" groups that give trading
calls with deceptive testimonials, promise assured returns, and push fake trading apps
offering "IPO allotments at discounts" and "sure shot allocation of IPOs"; registered
intermediaries cannot promise assured returns, and registration can be checked on the
regulator's own intermediary search
([Business Standard](https://www.business-standard.com/amp/finance/personal-finance/fake-mf-redemptions-fraudulent-trade-apps-sebi-s-big-warning-to-investors-125082500244_1.html)).

### What must NOT be copied

No real regulator, register, exchange, broker, adviser, registration-number format, trading
app, IPO or bank. "Alpha Wealth", "Prof. V. Sethi", `RA-2291-0457`, "Investor Check" and "R.
K. Traders" are invented; the registration number deliberately avoids any real regulator's
format; the member site is the bank's own `w13.training.example`.

### Client requirements preserved

Stage 2's "newly joined investment group" opens on the system line recording who added the
learner. Stage 3's "who added the learner, admin numbers, repetitive testimonials and profit
claims" are all on the group-info screen and in the thread. Stage 4's "fake trading-app page
showing a small bonus and Deposit button" is the member dashboard, reached from the group's
link, with a withdraw page and a deposit sheet behind it. Stage 5's "check adviser
registration and the broker through independently known official sources" is the regulator's
Investor Check app. Stage 6's "leave/report the group; block admins" is the resolve stage.

### Enhanced synthetic storyline

On Wednesday evening a number the learner does not know added them to "Alpha Wealth VIP" and
set it so only admins can post. The "professor" welcomes everyone with eleven weeks of 18%
weekly returns. Yesterday, profit screenshots and three members thanking the professor in the
same sentence with the same emoji. Today: the client's headline, a link to claim a INR 2,000
welcome bonus, and a INR 50,000 minimum deposit to lock a guaranteed allotment. At the branch
stage a slot counter appears and a member says he has deposited.

### Conversation progression

1. `WEDNESDAY` — "+91 00000 70411 added you"; "Only admins can send messages to this group"; the welcome.
2. `YESTERDAY` — a profit screenshot, three near-identical testimonials, another screenshot.
3. `TODAY` — the client's headline from the professor, the member link and the deposit condition from the assistant.
4. `branch` — "IPO slots remaining 7 / 50"; "Deposited ✅ slot locked".

### Evidence the learner can discover (progressive)

- **The thread**: three "members" writing the same sentence within a minute.
- **Group info → About**: created four days ago by the number that added you; only admins can post; the description promises guaranteed allotment and 18% a week.
- **Group info → Participants**: six admins on consecutive numbers — **every account that has ever posted is an admin**; 208 members, none in your contacts, none able to post.
- **Group info → Media**: 38 of 41 images are the same app screen with different amounts.
- **Link details**: the site was registered six days ago and has no app-store listing.
- **The member page**: a bonus you cannot withdraw until you deposit, and a 10% "processing tax" on withdrawals paid in advance.
- **The deposit sheet**: the account being paid is in a different name from the one on the page.
- **Investor Check**: no registered adviser, analyst or broker holds the number or the names; IPO allotment is by lottery and nobody can guarantee it.

### Learner interaction journey

`notification → chat list → group thread (no composer) → group info (3 tabs) → Open the link
→ member dashboard → withdraw page / deposit sheet → back → Exit group → Investor Check →
resolve`

### Simulation surfaces

Group info (`GROUP`, 3 tabs with admin badges), link details (`VIEWER`), member site
(`BROWSER`, 2 pages), deposit sheet (`PAYSHEET` with a local PIN field), regulator app
(`APP`).

**The distinct interaction is a room you cannot speak in.** The composer is replaced by the
app's own line, "Only admins can send messages", so the learner's choices are the group's own
controls: read the room, open the member page, message an admin privately, or leave.

### Verification mechanism

`verify_known_app` — the market regulator's Investor Check app, opened from the phone. The
search for the group's registration number and names comes back empty.

### Safe resolution

Exit group (`SAFE_PIVOT`, +3), Investor Check (`TRUSTED_VERIFY`, +3), then `resolve_report`
or `resolve_block` (+2). Ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Deposit INR 50,000 (on the deposit sheet) | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Message the assistant: "Interested, please reserve my IPO slot" | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Open the member link from the preview | `open_link` (open) | `PREMATURE_REPLY` | −1 |
| Ask the assistant for the registration certificate | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |

The dashboard, the withdraw page and the deposit sheet are **local navigation**, so the −3 and
−8 routes are both reachable in one scene.

### Scoring / event mapping (unchanged)

Identical table to W12.

### Why the final simulation stays faithful

The member link and host are the bank's own `browser_page` asset (`display_target` and
`host`), read through `shared.js`. The deposit amount overrides the `INR 0.00` placeholder as
recorded in §0.7. Nothing on the dashboard moves or updates; the "balance" is authored text.

---

## 4. W14 — Movement Order APK

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Movement Order APK |
| Disposition | Malicious |
| Level | Medium |
| Family (client) | Military spearphishing / malicious app |
| Canonical family | `malware_delivery` |
| Trigger (client) | Authority + urgency \| FICTIONAL MILITARY CONTEXT |
| Canonical triggers | `authority`, `urgency` |
| Military flag | Yes |
| End state | Installer is closed before permission grant; the inert file is quarantined locally. |
| Decision signal (stage 3) | A movement order would not require installing an unknown app from a chat account. |

### MITRE ATT&CK alignment

| Technique | Name | Matrix / tactic | Version | Created / last modified |
| --- | --- | --- | --- | --- |
| [T1660](https://attack.mitre.org/techniques/T1660/) | Phishing | Mobile / Initial Access | 1.2 | 21 September 2023 / 12 May 2026 |
| [T1636.004](https://attack.mitre.org/techniques/T1636/004/) | Protected User Data: SMS Messages | Mobile / Collection | 1.1 | 1 April 2022 / 12 May 2026 |
| [T1417.001](https://attack.mitre.org/techniques/T1417/001/) | Input Capture: Keylogging | Mobile / Collection, Credential Access | 1.1 | 5 April 2022 / 12 May 2026 |
| [T1513](https://attack.mitre.org/techniques/T1513/) | Screen Capture | Mobile / Collection | 1.3 | 8 August 2019 / 12 May 2026 |

### Why this maps

T1660 is the delivery. Its description covers sending "malicious content to users in order to
gain access to their mobile devices" through "third-party services, like social media
platforms", and its own procedure example is a group that "delivered malicious applications
to victims via shortened URLs distributed through SMS, WhatsApp".

The other three are what the app would do with the permissions the bank's `install_screen`
asset lists (`sms`, `accessibility`, `screen_capture`): T1636.004 reads SMS, including
one-time codes; T1417.001 describes Android malware registering an `AccessibilityService` to
record what is typed — and one of its procedure examples, DocSwap, was "disguised as security
document viewer"; T1513 is screen capture through Android's `MediaProjectionManager`, which
"generally requires the device user to grant consent". The scene puts that consent on screen.

**Real-world pattern.** ATT&CK tracks **Transparent Tribe**
([G0134](https://attack.mitre.org/groups/G0134/), v1.2, last modified 31 July 2026) as
"primarily targeting diplomatic, defense, and research organizations in India". Its ATT&CK
page lists enterprise techniques only, so the Android half of the pattern is from published
research instead: SentinelOne's reporting on **CapraRAT**, an Android spyware framework hidden
inside apps distributed outside the Play Store by social engineering, used against Indian
government and military personnel
([SentinelOne, 2023](https://www.sentinelone.com/labs/capratube-transparent-tribes-caprarat-mimics-youtube-to-hijack-android-phones/)).
The shape is always the same: an app arrives where a document was expected, the phone's own
guard against unknown apps has to be switched off, and the app then asks for exactly the
permissions that let it read messages and watch the screen.

### What must NOT be copied

No real formation, headquarters, operation, order-numbering scheme, document system, app name,
package name, signing certificate or distribution site, and nothing from any real CapraRAT
lure. "HQ Alpha Ops", "Unit Falcon", MO 17/26, "Orders DMS" and "MoveOrder Viewer" are
invented. The installer's wording is paraphrased, not copied, from the operating system.

### Client requirements preserved

Stage 2's "file chip MoveOrder_Viewer.apk" is the file card, drawn with the package glyph and
`APK` as its type. Stage 3's "file extension, unsaved number, missing official reference and
install request" are the file details, the contact sheet, the thread (no order number, no
issuing office) and the headline. Stage 4's "simulated Android install-permission screen
requesting SMS, files and accessibility" is the installer's confirmation dialog, which lists
all four, and the permission prompts after an install. Stage 5's "contact the operations staff
through the approved internal channel and check the document system" is both the ops-room call
and the Orders DMS app. Stage 6's "cancel installation; report via unit cyber/security route;
block the sender" is the resolve stage and a cyber-cell directory row.

### Enhanced synthetic storyline

An unsaved number named "HQ Alpha Ops" says the detachment's movement order has been revised
for 0600 tomorrow, sends `MoveOrder_Viewer.apk`, and says the order is encrypted and opens only
in that viewer, which must be installed before 18:00. At the branch stage it asks for an
acknowledgement and says the detachment is the only one yet to reply. In the background, the
Det Orders Room group's last message — visible on the chat list before anything is opened —
says any revision will be on the DMS as usual.

### Conversation progression

1. `13:20`–`13:21` — the revision claim.
2. `13:24` — the APK file card.
3. `13:25` — the client's headline, then "opens only in this viewer. Do not forward it."
4. `branch` — the acknowledgement demand, then "Your detachment is the only one yet to acknowledge."
5. `verify` — "Acknowledgement still pending. Confirm immediately."

### Evidence the learner can discover (progressive)

- **The chat list**: the orders-room group says revisions come through the DMS.
- **File info**: an Android package that opens with the package installer, from an unidentified developer, and "cannot be previewed; it can only be installed".
- **Contact info**: not official, on WhatsApp this week, no groups in common — Det Orders Room does not include it.
- **The installer**: the phone blocks the source; the setting that lifts it warns the phone becomes more exposed; the confirmation lists SMS, accessibility, screen recording and files.
- **Orders DMS**: MO 17/26 as issued, no amendment, orders are never sent by messaging app and need no viewer.

### Learner interaction journey

`notification → chat list → thread → file info / contact → Open → "not allowed" dialog →
Settings → Allow from this source → install confirmation → Cancel (or Install → permission
prompts) → Orders DMS / ops room → resolve`

### Simulation surfaces

Contact sheet (`CONTACT`, 3 tabs), file info (`VIEWER`), **package installer** (`INSTALLER`,
new in this batch: system dialog, settings switch, confirmation, permission prompts), Orders
DMS (`APP`), ops-room call (`CALL`), sender call (`CALL`).

**The distinct interaction is the operating system.** Every other scenario keeps the learner
inside an app; this one walks them out of WhatsApp onto the phone's own screens, and the
decision is taken on the phone's dialog.

### Verification mechanism

`verify_known_app` — the Orders DMS, opened from the phone — or `verify_known_number` on the
ops room's approved number. Both say there is no revision and orders are never sent as apps.

### Safe resolution

Cancel on either installer dialog, or the composer's refusal (`SAFE_PIVOT`, +3); the DMS or the
ops room (`TRUSTED_VERIFY`, +3); then `resolve_report` or `resolve_block` (+2). Ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Install (on the installer's confirmation) | `attempt_install` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| "The viewer will not install. Can you send the order as a PDF?" | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Tap the file from the preview | `attempt_install` (open) | `PREMATURE_REPLY` | −1 |
| Call the number that sent the file | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |

The route to Install — Open, Settings, the switch — is **local navigation**, so the learner
has to walk the whole of it before anything is recorded, exactly as a real phone makes them.

### Scoring / event mapping (unchanged)

Identical table to W12.

### Why the final simulation stays faithful

The Install control names the bank's `install_screen` asset, and the consequence the engine
returns is `simulated_install`, a rendering instruction. There is no package, file, intent to
the operating system or permission anywhere in the product; after Install the scene shows what
the app *would* ask for, and the thread says no order was displayed.

---

## 5. W15 — Senior's Urgent Voice Note

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Senior's Urgent Voice Note |
| Disposition | Malicious |
| Level | Medium |
| Family (client) | Synthetic-media impersonation / data request |
| Canonical family | `operational_elicitation` |
| Trigger (client) | Authority + familiarity \| FICTIONAL MILITARY CONTEXT |
| Canonical triggers | `authority`, `familiarity` |
| Military flag | Yes |
| End state | Voice note is tagged as unverified synthetic media and the disclosure path closes. |
| Decision signal (stage 3) | A familiar voice can be synthesized; protected access data must never move to personal chat. |

### MITRE ATT&CK alignment

| Technique | Name | Matrix / tactic | Version | Created / last modified |
| --- | --- | --- | --- | --- |
| [T1588.007](https://attack.mitre.org/techniques/T1588/007/) | Obtain Capabilities: Artificial Intelligence | Enterprise / Resource Development | 1.1 | 11 March 2024 / 12 May 2026 |
| [T1598.004](https://attack.mitre.org/techniques/T1598/004/) | Phishing for Information: Spearphishing Voice | Enterprise / Reconnaissance | 1.0 | 7 September 2023 / 12 May 2026 |
| [T1684.001](https://attack.mitre.org/techniques/T1684/001/) | Social Engineering: Impersonation | Enterprise / Stealth | 1.0 | 14 April 2026 / 12 May 2026 |
| [T1585.001](https://attack.mitre.org/techniques/T1585/001/) | Establish Accounts: Social Media Accounts | Enterprise / Resource Development | 1.1 | 1 October 2020 / 12 May 2026 |

### Why this maps

T1588.007 is the voice. Its description states that AI-generated audio "may be used for fraud,
Impersonation, and other malicious activities", and its references cover voice spoofing for
vishing. T1598.004 is the method — voice communications used "to elicit sensitive
information", posing as "a source with a reason to collect information".

**Partial fit, stated:** T1598.004 is framed around calls; a recorded voice message is the
asynchronous form of the same behaviour. T1684.001 is the impersonation of a senior the learner knows, and
T1585.001 is the account: created last night, carrying a copied profile photo.

**Real-world pattern.** The FBI's public service announcements of 15 May 2025 and December 2025
describe a campaign, running since at least 2023, of texts and AI-generated voice messages
claiming to come from senior officials, sent to officials and their contacts to establish
rapport and then move the conversation to another messaging app
([IC3 PSA250515](https://www.ic3.gov/PSA/2025/PSA250515);
[IC3 PSA251219](https://www.ic3.gov/PSA/2025/PSA251219)). This scene moves that pattern into a
unit: a voice the learner knows, from a number they do not, asking for something that never
moves by chat at all.

### What must NOT be copied

No real officer, voice, unit, secure room, access procedure, access phrase, roster or standing
order. "Col. Dev", the Adjutant, "Unit Falcon" and the inspection are invented; no access phrase
is ever shown — the draft reads `••••••••` — and no audio exists anywhere.

### Client requirements preserved

Stage 2's "new-account thread and voice note" is the thread from "Col. Dev (new account)" with a
0:41 voice message. Stage 3's "new number, profile creation date, request content and no shared
history" are the contact sheet's About tab (on WhatsApp since yesterday at 21:40, no earlier
chats, the same photo as the saved contact) and the transcript. Stage 4's "reply composer with
quick chips for phrase/photo/document" is literal: three chips — the access phrase, the access
roster photo, the entry procedure — beside the refusal. Stage 5's "confirm via the established
chain and approved communications channel" is the Adjutant on his saved number. Stage 6's "send
nothing; report the impersonation; preserve the synthetic voice-note evidence" is the resolve
stage's "Report the impersonation and keep the voice note as evidence".

### Enhanced synthetic storyline

At 07:20 a new number says it is Col. Dev's personal number and that his official phone has
been with the signals workshop since last night. At 07:24 a voice note, in his voice: he is
stuck at the airport, the inspection party reaches the secure room at nine, the duty NCO will
not let them in without today's access phrase — send it here and he will pass it on. At the
branch stage: "Boarding in fifteen minutes. Please." and a second, nine-second voice note, "It is
me, do not worry… nobody else needs to know." A little further down the chat list, the real
Col. Dev's saved chat from yesterday evening says the Adjutant will brief the secure room.

### Conversation progression

1. `07:20`–`07:21` — the new number and the reason for it.
2. `07:24` — the voice note (0:41), with the app's transcript.
3. `07:26` — the client's sentence, in full.
4. `branch` — the boarding line and the second voice note.
5. `verify` — the typing strip: he is waiting for the answer.

### Evidence the learner can discover (progressive)

- **The chat list**: the saved Col. Dev, a different chat, saying something ordinary about the same inspection.
- **Contact info → About**: on WhatsApp since yesterday 21:40, first message today, no earlier chats, a copied profile photo.
- **Contact info → Also in contacts**: the saved Col. Dev, on a different number, saved three years ago — one tap away.
- **The saved contact → Recent messages**: "Adjt will brief the secure room staff", "Access procedure as per standing orders. No changes."
- **Message details**: recorded in this chat, not forwarded, no earlier voice messages from this number, and the transcript.
- **The Adjutant**: the CO is in the building, his official phone works, and the phrase is only ever issued at the guard room.

### Learner interaction journey

`notification → chat list → thread → play the voice note / transcript → contact info → the
saved Col. Dev → back → the refusal in the composer → the Adjutant's call → resolve`

### Simulation surfaces

**Voice note** (a new thread element: play, waveform, transcript — all local), contact sheet
(`CONTACT`, 3 tabs), the saved contact (`CONTACT`, 3 tabs with a message sample), message details
(`VIEWER`), the call back to the new number (`CALL`), the Adjutant's call (`CALL`), directory
rows for the Adjutant and the security cell.

**The distinct interaction is the voice.** Every earlier scenario gave the learner something to
read; this one gives them something to listen to, and the voice is right. The scene never says
it sounds wrong — `sceneModel.test.js` asserts the absence of every word that would — because a
cloned voice does not, and teaching people to listen for artefacts is teaching them to trust
the recordings that have none.

### Verification mechanism

`verify_known_number` on the Adjutant's saved number — the chain of command, not the person
the message names. He was with the CO ten minutes ago, the CO's official phone works, and the
access phrase is never passed by phone or WhatsApp.

### Safe resolution

The refusal in the composer (`SAFE_PIVOT`, +3), the Adjutant (`TRUSTED_VERIFY`, +3), then
`resolve_report` or `resolve_block` (+2). Ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Send today's access phrase | `share_secret` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Send the photo of the access roster | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Send the secure-room entry procedure | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Voice call this number | `call_number` | `RISKY_OPEN_REPLY` | −3 |
| Reply from the preview | `reply` (open) | `PREMATURE_REPLY` | −1 |
| Call the new number back and ask him to confirm | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |

Calling the new number back is the realistic trap: it *feels* like verification, and the same
voice answers, briefly, from a "bad line at the gate".

### Scoring / event mapping (unchanged)

Identical table to W12.

### Why the final simulation stays faithful

The voice note's details target the bank's own `file` asset. The client's headline is carried in
full where the bank truncated it (§0.5). Nothing is recorded, played or stored: the play control
moves a line across a drawn waveform on the authored clock, and there is no `audio` element or
media API anywhere, which `SceneContainment.test.jsx` asserts on every screen.

---

## 6. Forms, inputs and data handling

W12's and W13's deposit sheets carry the only fields in this batch — a masked UPI PIN. The rules
are unchanged from IMMERSIVE-003A-R2:

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

**W11, W14 and W15 carry no form at all.** W11's confirmation is a button, W14's decision is a
system dialog, and W15's chips are authored replies — the access phrase is never typed, and the
draft shows only dots. Adding fields to any of them would have been decoration.

---

## 7. What is asserted, and where

| Claim | Test |
| --- | --- |
| Every scene control resolves to a legal transition on its own scenario | `backend/tests/sceneAffordance.test.js` |
| Each safe path sums to exactly ten, and each control keeps its scoring meaning | same |
| Each W11–W15 walk, resolved by the engine, produces the review JOB 1 shows — with the scenario's own stage text as the correct action and no event code or point value | same |
| No scene names a disposition, family, trigger, end state, feedback, scoring event or point value | `frontend/src/simulation/sceneModel.test.js` |
| W11–W15 print no narrator verdict and no word that labels the item | same |
| Foreign numbers come only from a range reserved for fiction | same |
| Each of W11–W15 carries the interaction it was built around, absent from W01–W10 | same |
| The genuine item is not thinner than its neighbours | same |
| The three truncated notification bodies are named, and only those | same |
| No `href`, `src`, `img`, `audio`, `video`, `iframe`, `form` or network primitive on any screen | `frontend/src/components/simulation/SceneContainment.test.jsx` |
| Each scenario end to end through the controller; local navigation records nothing; remount replays nothing; the PIN never leaves | `frontend/src/pages/SceneScenariosC.test.jsx` |
| This document covers every authored scenario and cites every technique it names | `frontend/src/simulation/sceneResearch.test.js` |

Bank fingerprint expected before and after this task:
`8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687`

Synthetic fingerprint expected before and after this task:
`2779b03939e13cf11e0bee44493609f0c91e228f201f22f8c025a080509afde1`
