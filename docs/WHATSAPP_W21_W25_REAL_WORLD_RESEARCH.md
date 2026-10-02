# WhatsApp W21–W25 — real-world research and storyline reconstruction

**Task:** IMMERSIVE-003E — the final WhatsApp batch
**Scope:** WhatsApp W21, W22, W23, W24, W25 only. W01–W20 are unchanged apart from the two
drawn attachment arts listed in §7; W26+ (which do not exist), Instagram, Email and SMS are
untouched. With this batch **WhatsApp W01–W25 is complete**.
**Status:** design record for the five scenes authored by this task.
**Companions:** [`WHATSAPP_W01_W05_REAL_WORLD_RESEARCH.md`](WHATSAPP_W01_W05_REAL_WORLD_RESEARCH.md),
[`WHATSAPP_W06_W10_REAL_WORLD_RESEARCH.md`](WHATSAPP_W06_W10_REAL_WORLD_RESEARCH.md),
[`WHATSAPP_W11_W15_REAL_WORLD_RESEARCH.md`](WHATSAPP_W11_W15_REAL_WORLD_RESEARCH.md) and
[`WHATSAPP_W16_W20_REAL_WORLD_RESEARCH.md`](WHATSAPP_W16_W20_REAL_WORLD_RESEARCH.md) — the same
method, applied to the first four batches.

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

What is taken from the real world is timing, sequencing, social pressure, conversation
progression, escalation, contextual evidence and the realism of the interfaces. What is
deliberately **not** taken is infrastructure, tooling, live hosts, real brands, real units, real
personnel, real numbers or anything operational. Every host is `*.training.example`; every number
is in the reserved `+91 00000 xxxxx` range; every UPI handle ends `@trainingpay`; every page, form,
call, consent dialog and portal is local, inert and offline.

### 0.2 Source of the threat intelligence

Primary source: **MITRE ATT&CK, Enterprise and Mobile matrices, website version v19.2**
(released 28 April 2026) — re-confirmed as the current version on the live versions page on
14 September 2026 (<https://attack.mitre.org/versions/>, which serves
<https://attack.mitre.org/resources/versions/>; v18.1 ran 28 October 2025 – 27 April 2026). Every
technique named below was read from its live page during this task; the ID, matrix, tactic,
version, created and last-modified dates are recorded.

Secondary sources, for the real-world pattern behind each scenario: the FBI Internet Crime
Complaint Center's public service announcement on cryptocurrency investment schemes (W22); US
Army intelligence reporting on adversaries approaching servicemembers and their families, and the
Indian reporting on Army impersonation-profile advisories already cited in the W16–W20 record
(W23); ESET's November 2025 analysis of the WhatsApp screen-sharing scam and the Reserve Bank of
India's warning about remote-access apps (W24); Gen Digital's December 2025 "GhostPairing"
research on WhatsApp device linking (W25).

Version note carried forward: `T1656 Impersonation` no longer exists as a top-level technique and
resolves to **T1684.001** (parent T1684 Social Engineering, created 14 April 2026).

### 0.3 Interpretation rule

ATT&CK is used as a **behavioural reference, not a checklist**. A mapping is recorded only where
the technique's own description describes what the scenario does. W21 has no mapping, and that is
stated. W24 and W25 each record a technique that was **considered and rejected**, and say why.
Every mapping in this batch is a partial fit in at least one respect, and each section says which.

### 0.4 What this document may and may not change

| Thing | May IMMERSIVE-003E change it? |
| --- | --- |
| Scenario IDs, platform, level, disposition, family, trigger, military flag, version | **No** |
| The six stages, their order, their text, expected actions, scoring semantics, feedback | **No** |
| `backend/data/scenarios/v1` and its fingerprint `8e7a6c98...a7687` | **No** |
| `backend/data/synthetic/v1` and its fingerprint `2779b039...afde1` | **No** |
| The engine, the event ledger, the 90-minute deadline, the training-feedback review | **No** |
| Scene structure, conversation beats, surfaces, forms, phone UI | **Yes — this is the whole task** |

**The client scenario remains authoritative** over everything in this document. Where the research
and the client's own stage text disagree, the client's text wins and the disagreement is recorded
(W25's code direction, §5).

### 0.5 Content note carried forward — the truncated notification bodies

The DATA-003 generator stops the client's notification text at the first apostrophe. Two of this
batch are affected, and one of them is the most severe case in the bank:

| Scenario | Stored body | Client's sentence |
| --- | --- | --- |
| W22 | `My uncle` | "My uncle's desk has a guaranteed window tonight. Start small so you can trust me." |
| W25 | `I` | "I'm testing the team desktop. Send the linking code you just got so I can finish setup." |

Handled exactly as W06, W09, W15 and W20 were: the bank is left as it is, the scene states the
client's full sentence (thread and chat-list preview), and `sceneModel.test.js` now lists W22 and
W25 beside the other four and asserts that the scene text starts with the stored string. The
notify-stage toast and the result card are server-driven and still show the stored text — for W25
that is the single letter "I". A visible defect, recorded as a known limitation, left for the
separate data clean-up task. The bank was not regenerated.

### 0.6 Content note — the narrator line is not printed in this batch

The bank's `prior_context` sentence states the verdict for four of the five: W22 "a contact
**cultivated** over several synthetic weeks"; W23 "an account **posing as** a welfare volunteer";
W24 "a support agent **claims**"; W25 "a saved contact's **compromised account**". W21's is not a
verdict but describes the scene's own evidence. So, as in W11–W20, the narrator line is not
printed anywhere: each scene presents that context through the conversation and its screens, and
`sceneModel.test.js` asserts that neither the sentence nor any labelling word (scam, fraud, fake,
suspicious, impostor and the rest) appears in W21–W25.

### 0.7 Content note — placeholder assets the client's stage text overrides

| Scenario | Placeholder | Resolution |
| --- | --- | --- |
| W21–W25 | The directory asset is "Unit Falcon Support Desk" with an unrelated number. | Each scene adds approved-directory rows for the party the stage text names (Col. Dev's GSO-1 row and the brigade exchange; the bank's customer-protection desk; the Unit Welfare Office and Security Cell; the IT Helpdesk twice), with the same provenance line, beside the bank's row — the W03 precedent. |
| W21 | The browser asset body is the stage text ("local approved-portal launcher"). | SecureDesk is authored as three portal pages; the acknowledgement names the bank's browser asset. |
| W22 | The payment asset is `INR 0.00` with Samira as payee. | The sheet shows the INR 2,000 start and the "payment partner" the platform routes it to; the payment event still names the bank's asset. |
| W23 | The payment asset exists at stage 4. | Not used: the scene's decision is disclosure, and a fee step would bury it. The "processing fee" appears only on the far side of a submission. |
| W24 | The install asset is "W24 Training Mock" with `sms`, `accessibility`, `screen_capture`. | The app is "AssistNow" (the client's name); the three permissions are exactly the asset's three. The install event names the bank's asset. |
| W25 | The browser asset body is the stage text. | The "device-link code and approval sheet" is WhatsApp's own request sheet (`INSTALLER`, sheet style), not a browser page. |

---

## 0.8 Differentiation from W01–W20

Before any code was written, the twenty existing scenes were tabulated by what the learner
actually does, and each W21–W25 concept was rejected if it reduced to a row already present.

### The twenty existing scenes

| | Archetype | Sender / identity problem | Decision surface | Verification |
| --- | --- | --- | --- | --- |
| W01 | Login code "sent by mistake" | Unknown number | Composer (send code) | Settings → Account |
| W02 | Parcel redelivery fee | Unverified business | Offline browser checkout + pay sheet | Courier's own site |
| W03 | Genuine sports-meet group | Genuine group | Poll | Trusted directory |
| W04 | Friend on a new number | Saved contact vs new number | Pay sheet | Friend's saved number |
| W05 | KYC suspension | Unverified business | Browser KYC form | Bank app |
| W06 | Clerk asks for ID photo | Unknown | Gallery → send | Unit desk |
| W07 | Expected family document | Genuine family | Document viewer | Known number |
| W08 | Festival reward QR | Neighbour forwarding | QR inspector → claim site | Wallet app |
| W09 | Compromised colleague, gift cards | Hijacked saved account | Pay sheet / codes | Colleague's number |
| W10 | Survey device-link QR | Unknown "support" | Linked Devices confirm | Settings → Linked Devices |
| W11 | Genuine welfare appointment | Genuine business | Business message buttons | Welfare portal app |
| W12 | Digital-arrest video call | Unknown "officer" | Video call (End call) | Unit desk |
| W13 | Guaranteed IPO group | Admins-only room | Group Exit / deposit | Broker app |
| W14 | Movement-order APK | Unknown "HQ" | OS installer | Orders DMS |
| W15 | Senior's voice note | Cloned senior | Composer | Adjutant |
| W16 | Genuine vehicle-pool change | Genuine coordinator | Reaction on a message | Movement Board |
| W17 | Part-time rating tasks | Recruiter | Task site, recharge, bank details | JobsBoard app |
| W18 | Hijacked group admin | Genuine admin account, hijacked | Roster form | Coy Office desk |
| W19 | Commander clone, live location | Near-identical clone | Attach → permission → share sheet | Duty office |
| W20 | Supplier bank-detail change | Vendor impersonation | Procurement portal | Contact on file |

### What each W21–W25 adds

| | Nearest earlier scene | What that scene already taught | What is new here |
| --- | --- | --- | --- |
| **W21** | W15, W19 (senior), W16 / W11 (genuine) | A senior can be cloned; a genuine item can carry authority | **A message with nothing to press** — no link, file, code, button or reaction; the learner must **find the item themselves** in the approved portal by reference. The risk is **the learner pulling Restricted detail into WhatsApp** (ask here, call about it, forward the reference), not the sender. **Disappearing messages** and the senior's own earlier redirection are the context |
| **W22** | W13, W17 (investment / task) | A stranger's platform shows gains you cannot withdraw | **Time**: a thread spanning four weeks that **begins with a wrong number** at the top; **reciprocity** built from the learner's own "I owe you one"; a **biography that only fails across weeks** (Pune dentist → Dubai trading desk, video never possible); **checks outside the relationship** — image search of her photos, the regulator's register; a **boundary-setting reply** that separates friendship from money |
| **W23** | W06 (ID harvesting), W11 (genuine welfare) | Unknown accounts ask for identity; genuine welfare has a case reference | **Pressure through the learner's family**, named correctly; a **four-step form whose ask escalates page by page** (family → service → deployment → bank); the verification is **calling Ma** — who reveals she was approached too — as well as the welfare office |
| **W24** | W14 (APK), W12 (call) | Apps from chats ask for dangerous permissions; calls isolate | **A live support call that coaches the learner through their own phone**, with **Share screen** leading to the phone's **screen-share consent dialog** (its unsaved-contact warning included); a **diagnosis image with another phone's status bar**, contradicted by the phone's own **Device care** screen; **fear aimed at helpfulness** ("your phone is infecting your contacts") |
| **W25** | W01 (code), W10 (device link), W09 / W18 (hijacked account) | Codes are secrets; linking gives access; accounts get hijacked | **The genuine history is used against the learner** (last week's favour cashed in); **the linking code is on the learner's own screen**, in WhatsApp's own chat-list notice with a request sheet naming device and distance; **the "desktop screenshot" shows the learner's number**; out-of-character evidence is **outside the chat** (About line, team group's leave notice); verification is **an ordinary phone call** to the same number |

Branch-stage shapes are asserted distinct across all twenty-five (`sceneModel.test.js`, "gives each
of them a different branch-stage interaction").

---

## 1. W21 — Verified Senior Requests Secure Follow-Up

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Verified Senior Requests Secure Follow-Up |
| Disposition | **Legitimate** |
| Level | Hard |
| Family (client) | Legitimate minimal notification |
| Canonical family | `legit_routine_broadcast` |
| Trigger (client) | Authority \| FICTIONAL MILITARY CONTEXT |
| Canonical triggers | `authority` |
| Military flag | Yes |
| End state | The secure-portal task is opened and WhatsApp retains no sensitive follow-up. |
| Decision signal (stage 3) | The message avoids operational detail and asks the learner to use the correct protected channel. |

### MITRE ATT&CK alignment

**There is none, and none has been invented.**

ATT&CK catalogues adversary behaviour. A staff officer creating a task in the approved portal and
sending the reference on WhatsApp is correct organisational practice. Mapping it to an
impersonation or phishing technique because it carries seniority and a deadline would be exactly
the inversion the batch was told not to perform.

**Closest defensible behavioural reference:** the client's own discrimination pricing for a
genuine item — `FALSE_REPORT_BLOCK` −4 for reporting or blocking the senior,
`UNSAFE_EXTERNAL_ACTION` −4 for taking the item to an untrusted channel, `NEEDLESS_REJECT_IGNORE`
−2 for leaving it. The underlying idea — detail stays in the protected system and the personal
messenger carries only a pointer — is ordinary need-to-know handling and needs no technique.

### Client requirements preserved

Stage 2's "established saved-contact thread" is a contact saved three years with a congratulation
in August and Tuesday's exchange about the exercise brief. Stage 3's "known number, matching
directory record, minimal content and approved portal reference" is the contact card (saved,
number never changed, GSO-1, disappearing messages, **no media or links ever**), the directory row
with the same number, and REF-ALPHA-17. Stage 4's "local approved-portal launcher without an
embedded login link" is SecureDesk opened from the work profile — the chat has no link to open.
Stage 5's "open the approved portal from the dashboard and compare reference REF-ALPHA-17" is the
learner's own route into SecureDesk. Stage 6's "review the item in the approved mock portal; send
only a minimal acknowledgement if required; do not report" is the resolve banner's "Reply 'Seen,
sir' and action it in SecureDesk". The 250-character rationale box is the existing one.

### Enhanced synthetic storyline

Col. Dev, GSO-1 at brigade HQ, turned on 90-day disappearing messages in this chat long ago. In
August he congratulated the learner on a course grading. On Tuesday the learner offered to send the
draft exercise brief on WhatsApp; he said no — upload it to SecureDesk and assign it to him,
nothing from the brief on WhatsApp. At 08:29 today he created REF-ALPHA-17 in SecureDesk, revised
exercise timings for the learner's detachment; at 08:31 he sent the reference and "No reply details
here." At the branch stage he adds only the deadline, 1600. In the chat list, the officers' group
and a colleague the learner might be tempted to ask are ordinary traffic.

### Conversation progression

1. System line: disappearing messages on (90 days).
2. `14 AUGUST` — the congratulation; the learner's thanks.
3. `TUESDAY` — "Shall I send it here?" → "No. Upload it to SecureDesk… Nothing from the brief on WhatsApp." → "done on SecureDesk" → "Seen 👍".
4. `TODAY 08:31` — the client's headline.
5. `branch` — "For action by 1600."
6. After a consequence — "Not here. Everything you need is in the item on SecureDesk." (asking) or a voice-call entry and "please do not discuss the item on calls" (calling).

### Evidence the learner can discover (progressive)

- **The thread history**: his own redirection on Tuesday, in the same terms as today.
- **Contact info → About**: saved three years, number never changed, GSO-1, disappearing messages 90 days.
- **Contact info → Media**: none — nothing in this chat has ever been a file or a link.
- **SecureDesk → Inbox**: REF-ALPHA-17 from Col. Dev, GSO-1, created 08:29, two minutes before the message.
- **SecureDesk → the item**: originator's number on record matches the WhatsApp number; handling Restricted, respond in SecureDesk only; screenshots and forwarding off.
- **Trusted directory**: Col. Dev's GSO-1 row with the same number; the brigade exchange.
- **The exchange call**: the GSO-1 office clerk confirms the item and that he only sends references on WhatsApp.

### Learner interaction journey

`notification → chat list → thread (nothing to press) → contact info / read from the start →
overflow → SecureDesk (work profile) → inbox → REF-ALPHA-17 → Acknowledge in SecureDesk →
SecureDesk again to compare (or the exchange, or the directory) → "Seen, sir"`

### Simulation surfaces

Contact sheet (`CONTACT`, 3 tabs), SecureDesk (`BROWSER`, inbox / item / acknowledged), GSO-1 office
through the exchange (`CALL`), two directory rows. New thread element: none — the absence is the
point; the disappearing-messages system line.

### Verification mechanism

`verify_known_app` (SecureDesk opened by the learner), `verify_known_number` (the brigade exchange
from the directory) or `verify_trusted_directory` (the GSO-1 row). "Ask in this chat whether it is
really him" is the 0-point route. Report and Block are the −4 false positive.

### Safe resolution

Open (`ITEM_OPEN` 0) → contact card or thread (`INSPECT_CONTEXT` +2) → Acknowledge in SecureDesk
(`CORRECT_USE` +3) → SecureDesk, exchange or directory (`TRUSTED_VERIFY` +3) → continue or retain
(`RESOLVE_CORRECT` +2). Ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| "Sir, can you tell me here what it is about?" | `reply` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Voice call Col. Dev on WhatsApp to ask about the item | `call_number` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Forward the message to Maj. Rana and ask what it is | `reply` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Mute the chat and look at it on Monday | `reject_ignore` | `NEEDLESS_REJECT_IGNORE` | −2 |
| Report / Block Col. Dev | `report` / `block` | `FALSE_REPORT_BLOCK` | −4 |
| Reply "Yes sir" from the notification | `reply` (open) | `PREMATURE_REPLY` | −1 |
| Report / block / leave it at resolve | `resolve_*` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Identical to W16: `CORRECT_USE +3` / `NEEDLESS_REJECT_IGNORE −2` / `UNSAFE_EXTERNAL_ACTION −4`,
`TRUSTED_VERIFY +3` / `FALSE_REPORT_BLOCK −4` / `VERIFY_THROUGH_MESSAGE 0`, `RESOLVE_CORRECT +2` /
`CONTRADICTORY_UNSAFE_FINAL −4`.

### Realism decisions

A staff officer who puts tasking in the system and sends only a reference is how a disciplined
headquarters behaves, and it is exactly what makes the message look thin. The unsafe options are
the ones people actually take when away from a terminal — "just tell me". The deadline is real
pressure and is not a tell.

### Known limitations

The work profile is represented by SecureDesk's own notice rather than a separate launcher screen
(the device has no home-screen launcher inside the scene). Post-branch thread beats are
branch-neutral apart from the consequence beats.

### Why the final simulation stays faithful

The sender, number and headline are the bank's. The genuine item gets as much thread and as many
screens as its neighbours (asserted: ≥ 10 beats at branch, 3 surfaces). No word on the device says
the item is genuine; the portal says the reference is real.

---

## 2. W22 — Long-Game Online Friendship

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Long-Game Online Friendship |
| Disposition | Malicious |
| Level | Hard |
| Family (client) | Relationship grooming / investment fraud |
| Canonical family | `relationship_grooming_fraud` |
| Trigger (client) | Trust + reciprocity |
| Canonical triggers | `trust`, `reciprocity` |
| Military flag | No |
| End state | Fake profit display is exposed and the payment route is closed. |
| Decision signal (stage 3) | Time and friendliness do not validate identity or investment claims; the relationship is being used to lower caution. |

### MITRE ATT&CK alignment

| Technique | Name | Matrix / tactic | Version | Created / last modified |
| --- | --- | --- | --- | --- |
| [T1657](https://attack.mitre.org/techniques/T1657/) | Financial Theft | Enterprise / Impact | 1.2 | 18 August 2023 / 12 May 2026 |
| [T1585.001](https://attack.mitre.org/techniques/T1585/001/) | Establish Accounts: Social Media Accounts | Enterprise / Resource Development | 1.1 | 1 October 2020 / 12 May 2026 |

### Why this maps

T1657 is the objective, and its references include reporting on "pig butchering" — the
relationship-first investment pattern. T1585.001 is Samira: its description says adversaries
"create and cultivate social media accounts", that "persona development consists of the
development of public information, presence, history and appropriate affiliations", and that a
developed persona is used "to create connections to targets of interest".

**Partial fit, stated.** ATT&CK does not describe grooming. The shape — a wrong-number or social
approach, trust built over weeks, then a platform that shows returns and demands fees to withdraw —
comes from the FBI IC3 public service announcement of 3 October 2022 on cryptocurrency investment
schemes, which describes fraudsters who "invest time" earning trust, platforms that show fictitious
growth, and taxes or fees demanded at withdrawal
([IC3 PSA221003](https://www.ic3.gov/PSA/2022/psa221003)). T1585.001 names social-media accounts; a
WhatsApp persona is a messaging account built the same way.

### What must NOT be copied

No real person, profile, photograph, platform, exchange, regulator, bank or payment handle.
"Samira" is the bank's name; "Qorvex Global", "noor.fitlife", "Investor Check", "Falcon Bank" and
"PRIYA M" are invented; the handle ends `@trainingpay`; no photograph exists — the tiles are drawn.

### Client requirements preserved

Stage 2's "multi-week chat history" spans 19 August to today with seven day dividers. Stage 3's
"rapid intimacy, inconsistent biography, investment pivot and guaranteed-return language" are the
daily good-mornings and the prayer before surgery, Pune dentist against Dubai trading desk, the
uncle's desk, and "guaranteed window". Stage 4's "polished fake exchange showing profit after a
tiny trial deposit" is Qorvex's invite page and trial dashboard (+18.4% today) with the INR 2,000
start. Stage 5's "verify identity independently and research the platform/regulatory status outside
the relationship" is the image search and the regulator's register. Stage 6's "do not invest;
preserve and report the account; block after evidence capture" is "Export the chat, then report and
block".

### Enhanced synthetic storyline

On 19 August a message for "Kavya" about Saturday dinner reaches the learner, who politely says it
is the wrong number. Samira apologises, compliments the reply, introduces herself as a dental
surgeon in Pune. Good-morning messages follow, a clinic photo. When the learner mentions their
mother's knee surgery she sends recovery advice and a blessing, and the learner writes "You're too
kind. I owe you one." A video call is never possible — the network, the camera. On 4 September she
has moved to Dubai to help at her uncle's private trading desk. Yesterday: the desk made her four
lakh, and she feels bad keeping it from someone so good to her. Today: the client's headline, "only
for family and close friends", INR 2,000 to begin. At the branch stage: her account screenshot, an
invite link with her code, and a 9 pm deadline.

### Conversation progression

1. `19 AUGUST` — the wrong number, the introduction.
2. `21 AUGUST` — good morning, the clinic photo.
3. `26 AUGUST` — the surgery, the advice, "I owe you one".
4. `30 AUGUST` — the video call that cannot happen.
5. `4 SEPTEMBER` — Dubai, the uncle's desk, the marina photo.
6. `YESTERDAY` — four lakh, and the guilt of keeping it.
7. `TODAY` — the headline; "INR 2,000 to begin". `branch` — the screenshot, the invite, 9 pm.

### Evidence the learner can discover (progressive)

- **The top of the thread**: the relationship began with a message meant for someone else.
- **The middle of the thread**: a clinic in Pune, then a trading desk in Dubai, and no explanation.
- **Contact info**: saved by the learner four weeks ago; no groups in common; two photos.
- **Photos → search with an image**: both photos first appeared in 2021–22 on a fitness coach's public profile in Kuala Lumpur; the "clinic" was a gym.
- **Her screenshot**: a balance and a percentage; no account holder, no withdrawals.
- **Qorvex → Withdraw**: minimum balance INR 50,000 and a 15% "tax clearance" paid in advance.
- **Deposit sheet**: the INR 2,000 goes to an individual savings account.
- **Investor Check**: no registered entity; on the caution list since 2 September.

### Learner interaction journey

`notification → chat list → thread (scroll to the beginning) → contact info → Photos search →
the invite → trial dashboard → withdraw / verify identity / deposit — or the boundary in the
composer → Investor Check → export, report and block`

### Simulation surfaces

Contact sheet (`CONTACT`, 3 tabs, a link into Photos), Photos search (`APP`), screenshot viewer
(`VIEWER`), Qorvex (`BROWSER`, 6 pages, an ID form), deposit sheet (`PAYSHEET` with a PIN), Investor
Check (`APP`), two directory rows.

### Verification mechanism

`verify_known_app` on Investor Check — the regulator's register in an app installed from the
official store, not a link from her — or `verify_trusted_directory` on the bank's customer-protection
desk. "Ask Samira to prove the desk is real" is the 0-point route: four weeks of rapport answers it.

### Safe resolution

The boundary in the composer (`SAFE_PIVOT` +3), Investor Check (`TRUSTED_VERIFY` +3), then report or
block (+2). Ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Pay INR 2,000 (deposit sheet) | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Submit verification (name, ID number, bank account) | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| "Send me your withdrawal proof first" | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Video call Samira to talk it through | `call_number` | `RISKY_OPEN_REPLY` | −3 |
| Reply "Tell me more 😊" from the notification | `reply` (open) | `PREMATURE_REPLY` | −1 |
| Ask Samira to prove the desk is real | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |
| Keep chatting, just don't invest (resolve) | `resolve_retain` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

Walking the invite, the dashboard and the withdraw page is navigation, deliberately: seeing the
balance is what the platform is for, and the decision is what the learner gives it.

### Scoring / event mapping (unchanged)

`SAFE_PIVOT +3` / `RISKY_OPEN_REPLY −3` / `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`,
`TRUSTED_VERIFY +3` / `REPORT_ONLY_WITHOUT_CHECK +1` / `VERIFY_THROUGH_MESSAGE 0`,
`RESOLVE_CORRECT +2` / `CONTRADICTORY_UNSAFE_FINAL −4`.

### Realism decisions

Nothing in the thread is hostile, and most of it is kind. The inconsistency is never pointed at.
"Keep chatting, just don't invest" is priced as the contradictory final because the relationship
is the delivery mechanism; the safe composer line still lets the learner be kind while refusing.

### Known limitations

The image search is an authored result, not a search. One decision per stage: a run records the
ID details or the deposit, not both.

### Why the final simulation stays faithful

The sender and number are the bank's; the payment event names the bank's payment asset. The typed
name, ID number, account number and PIN never leave their components (asserted).

---

## 3. W23 — Family Welfare Pretext

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Family Welfare Pretext |
| Disposition | Malicious |
| Level | Hard |
| Family (client) | Military-family targeting / operational elicitation |
| Canonical family | `operational_elicitation` |
| Trigger (client) | Empathy + authority \| FICTIONAL MILITARY CONTEXT |
| Canonical triggers | `empathy`, `authority` |
| Military flag | Yes |
| End state | Form is discarded and the verified welfare office shows no case. |
| Decision signal (stage 3) | The request combines family concern with operational and identity questions that a real process would already handle securely. |

### MITRE ATT&CK alignment

| Technique | Name | Matrix / tactic | Version | Created / last modified |
| --- | --- | --- | --- | --- |
| [T1598.001](https://attack.mitre.org/techniques/T1598/001/) | Phishing for Information: Spearphishing Service | Enterprise / Reconnaissance | 1.0 | 2 October 2020 / 24 October 2025 |
| [T1684.001](https://attack.mitre.org/techniques/T1684/001/) | Social Engineering: Impersonation | Enterprise / Stealth | 1.0 | 14 April 2026 / 12 May 2026 |
| [T1591](https://attack.mitre.org/techniques/T1591/) | Gather Victim Org Information | Enterprise / Reconnaissance | 1.1 | 2 October 2020 / 12 May 2026 |

### Why this maps

T1598.001 is the delivery: messages "via third-party services to elicit sensitive information",
including "social media services, personal webmail, and other non-enterprise controlled services".
T1684.001 is the welfare organisation and its volunteer: impersonating "a trusted person or
organization in order to persuade and trick a target". T1591 is what the form collects — details
of the organisation, and its sub-technique for physical locations; the parent page names "direct
elicitation via Phishing for Information" as a way it is gathered.

**Partial fit, stated.** T1591 describes an organisation's information; here it is gathered
through one member and their family, and it includes personal data (home address, bank account)
that is not organisational at all. The family-targeting pattern is sourced outside ATT&CK: the US
Army's deputy chief of staff for intelligence warned on 13 November 2025 that foreign adversaries
target "servicemembers, civilians, and their families", with questions that increase in sensitivity
over time ([Nextgov/FCW](https://www.nextgov.com/defense/2025/11/foreign-spies-are-targeting-army-soldiers-civilians-and-families-official-warns/409751/));
the Indian reporting on Army advisories about impersonation profiles used to engage personnel "for
extracting information" is cited in the W16–W20 record
([Outlook India](https://www.outlookindia.com/national/india-news-isi-agents-posing-as-women-can-trap-you-on-social-media-army-warns-soldiers-news-341884)).

### What must NOT be copied

No real welfare body, charity, hospital, unit, post, deployment or person. "Forces Family Welfare",
"Rekha", "Mr. Menon", "Smt. Sunita Rao", "14 Falcon", "Nb Sub Rawat" and the host are invented; no
service number, place or date is real.

### Client requirements preserved

Stage 2's "business-style chat with copied welfare imagery" is a business account with a crest and a
poster. Stage 3's "unknown number, broad data request, urgency and lack of case reference" is the
business card (not verified, on WhatsApp nine days), the headline, "within 1 hour", and the grant
page's "Case reference: issued after verification". Stage 4's "synthetic grant form requesting unit,
location, schedule, family and bank data" is literal, split into four steps. Stage 5's "contact the
known welfare office through the unit directory and check the family directly" is the Welfare Office
call and the call to Ma. Stage 6's "submit nothing; report the impersonation through unit security;
block the account" is the resolve banner; the rationale box is the existing one.

### Enhanced synthetic storyline

On Monday a man rang the learner's mother, said he was from "the army office", and asked where her
child is posted and when they are coming home; she said she did not know. Today at 11:52 "Rekha" of
Forces Family Welfare writes, with a crest poster; at 12:04, that Smt. Sunita Rao — the learner's
mother, by name — was brought to the district hospital with chest pain and a volunteer is with her;
at 12:06 that INR 50,000 is sanctioned; at 12:10 the client's headline; at 12:11 the form, "within
1 hour or the grant lapses". At the branch stage: the hospital is waiting, and a "case officer"
number for anyone who finds the form difficult. Last night the learner told Ma they would call.

### Conversation progression

1. `11:52` — introduction and poster. `12:04–12:06` — the mother, the grant.
2. `12:10` — the headline. `12:11` — the form link.
3. `branch` — "The hospital is asking for the grant papers"; the case officer's number.
4. After a consequence — "also confirm your next leave dates and when your unit moves" (submission), or "just fill the form, don't delay" (reply).

### Evidence the learner can discover (progressive)

- **The chat list**: Ma's chat, last night, ordinary — and she is reachable.
- **Business info**: not verified, crest profile photo, on WhatsApp nine days, no groups in common.
- **The poster**: no registration or case number; this WhatsApp number is the only contact.
- **The grant page**: "Case reference: issued after verification".
- **The steps**: the ask grows from relationship and address to service number, unit and post, then deployment and move dates, then a bank account.
- **Ma**: at home, fine — and approached on Monday for the learner's posting.
- **Unit Welfare Office**: no case; grants have a reference from this office and go to the account on record; nobody asks posting or movement dates.

### Learner interaction journey

`notification → chat list → thread → business info / poster → the form → step 1 → step 2 → …
close it on any page (or submit on review) → call Ma / the Welfare Office → report and block`

### Simulation surfaces

Business card (`CONTACT`, 3 tabs), poster viewer (`VIEWER`), grant application (`BROWSER`, 7 pages,
four form steps), three calls (`CALL`: Ma, Welfare Office, "case officer"), two directory rows.

### Verification mechanism

`verify_known_number` on Ma's saved number or on the Welfare Office's directory number, or
`verify_trusted_directory`. Calling "Mr. Menon" on the number from the chat is the 0-point route —
he confirms the emergency and asks for the unit and location.

### Safe resolution

Close the form on any page, or say so in the composer (`SAFE_PIVOT` +3), call Ma or the Welfare
Office (`TRUSTED_VERIFY` +3), then report or block (+2). Ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Submit application (review page) | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| "I am with 14 Falcon at the northern post, deployed till 30 Sep" | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| "Is my mother okay? Which hospital is she in?" | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Reply "Is my mother okay?" from the notification | `reply` (open) | `PREMATURE_REPLY` | −1 |
| Call Mr. Menon on the number from the chat | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |

### Scoring / event mapping (unchanged)

Identical to W22.

### Realism decisions

The most human reply — asking whether your mother is all right — is priced as engagement, not
release, because it gives the attacker a conversation and nothing more yet. The mother's real name is
what makes the pretext work; knowing it proves nothing. Ma's call reflects the documented pattern of
families being approached in parallel.

### Known limitations

The form's pages are fixed; the review page describes the categories entered rather than echoing
values (nothing typed is ever read). Calls' later captions arrive over twenty seconds.

### Why the final simulation stays faithful

The sender, number and headline are the bank's; the submission names the bank's browser asset. No
typed value leaves the form component (asserted by typing all ten fields and searching the wire).

---

## 4. W24 — Remote Support Screen Share

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Remote Support Screen Share |
| Disposition | Malicious |
| Level | Hard |
| Family (client) | Tech-support scam / remote access |
| Canonical family | `tech_support_and_callback_fraud` |
| Trigger (client) | Fear + helpfulness |
| Canonical triggers | `fear`, `helpfulness` |
| Military flag | No |
| End state | No app is installed and all simulated permissions remain denied. |
| Decision signal (stage 3) | Legitimate support does not discover an infection by cold message or require an unknown remote-access app. |

### MITRE ATT&CK alignment

| Technique | Name | Matrix / tactic | Version | Created / last modified |
| --- | --- | --- | --- | --- |
| [T1660](https://attack.mitre.org/techniques/T1660/) | Phishing | Mobile / Initial Access | 1.2 | 21 September 2023 / 12 May 2026 |
| [T1663](https://attack.mitre.org/techniques/T1663/) | Remote Access Software | Mobile / Command and Control | 1.0 | 25 September 2023 / 16 April 2025 |
| [T1513](https://attack.mitre.org/techniques/T1513/) | Screen Capture | Mobile / Collection | 1.3 | 8 August 2019 / 12 May 2026 |
| [T1516](https://attack.mitre.org/techniques/T1516/) | Input Injection | Mobile / Defense Evasion, Impact | 1.2 | 15 September 2019 / 12 May 2026 |
| [T1684.001](https://attack.mitre.org/techniques/T1684/001/) | Social Engineering: Impersonation | Enterprise / Stealth | 1.0 | 14 April 2026 / 12 May 2026 |

**Considered and rejected:** [T1219](https://attack.mitre.org/techniques/T1219/) Remote Access Tools
(Enterprise, Command and Control, v3.0). Its description is remote-access tools used "within a
network" between trusted hosts, post-compromise. The target here is a personal phone, and the Mobile
matrix has the precise counterpart, T1663; mapping both would be counting one behaviour twice.

### Why this maps

T1660 is the delivery: "All forms of phishing are electronically delivered social engineering", with
a procedure example delivering applications "via… WhatsApp". T1663 is AssistNow: "legitimate remote
access software, such as VNC, TeamViewer, AirDroid" used "to establish an interactive remote session
with the target device". T1513 is the screen-share consent, and its description notes that
MediaProjection capture "generally requires the device user to grant consent" — the dialog this scene
draws. T1516 is the Accessibility "full control" the installed app asks for: input injected "through
the abuse of Android's accessibility APIs". T1684.001 is the "Mobile Security Desk".

**Partial fit, stated.** T1663, T1513 and T1516 describe what software does after the fact; the
scene stops at the consent. The call-and-share pattern is sourced outside ATT&CK: ESET's analysis of
5 November 2025 describes a WhatsApp video call from a "support" or bank impostor, a fabricated
urgent problem, a request to share the screen or install remote-access apps, and codes read off the
shared screen ([WeLiveSecurity](https://www.welivesecurity.com/en/scams/sharing-is-scaring-whatsapp-screen-sharing-scam/));
India's banking regulator warned that remote-access apps were being used by fraudsters to take over
customers' accounts ([CIO.inc report](https://www.cio.inc/rbi-warns-fraud-that-leverages-anydesk-app-a-12035)).
The dialog's "who is not in your contacts" line is an authored addition modelled on the app's own
unsaved-contact banners; it was not verified against a live WhatsApp build and is not claimed as a
copy of one.

### What must NOT be copied

No real remote-access product, security vendor, carrier, phone model or malware family. "AssistNow",
"Mobile Security Desk", "VIRTUO", "Falcon Mobile", "Falcon A52" and the threat names on the picture
are invented; there is no package, no permission and no capture anywhere in the product.

### Client requirements preserved

Stage 2's "support chat and diagnostic image" is the alert and the drawn scan screenshot. Stage 3's
"unverified account, unsolicited diagnosis, APK link and remote-control request" are the business
card (not verified, two days on WhatsApp), the picture, the `.apk` link and "share screen". Stage 4's
"install mock followed by accessibility and screen-share permission prompts" is the download warning
and install dialog (accessibility, screen, SMS — the asset's three permissions), whose far side lists
the prompts; and the call's Share screen consent. Stage 5's "close chat and contact approved IT
support using the local directory" is the IT Helpdesk call and directory row. Stage 6's "cancel all
permissions; report/block the account; request an approved device check if needed" is "Report and
block; ask IT for a device check".

### Enhanced synthetic storyline

At 10:52 an account called Mobile Security Desk tells the learner their number has been flagged for
sending infected links to contacts, and sends a scan screenshot with three threats. Three contacts
have "already reported" it; the bank app is at risk. At 11:01 the client's headline; a download link
for AssistNow_v4.apk; "do not restart, it spreads to your SIM". At 11:09 "Technician Rahul" rings on
video with his camera off. On the call he is calm and fast: he will not ask for a password, just tap
Share screen; the warning the phone shows is "normal, because of the virus".

### Conversation progression

1. `10:52–10:55` — the alert, the scan picture, the contacts, the bank app.
2. `11:01–11:03` — the headline, the APK link, "do not restart".
3. `branch` — "Technician Rahul is calling you now"; the ringing video call.
4. `verify` — the ringing strip becomes the app's neutral "Video call" entry (not "missed": the learner may have answered); the typing strip.
5. After a consequence — "open your bank app so I can scan it; read me the code" (share), or "read me the 9-digit session code" (install).

### Evidence the learner can discover (progressive)

- **Business info**: not verified, shield picture, on WhatsApp two days, no groups in common.
- **The scan picture**: its status bar shows carrier "VIRTUO" at 19% battery; this phone is on Falcon Mobile at 76%; the scan names no model.
- **Settings → Device care**: no threats at today's 09:00 scan; no unknown-source apps; no accessibility service; no screen sharing.
- **The link**: an `.apk` from a support site, not a store.
- **The download warning**: "This type of file can harm your device."
- **The install dialog**: full control through Accessibility, screen recording, SMS including one-time codes.
- **The consent dialog**: the person is not in contacts; they would see passwords, payment details, messages and notifications.
- **IT Helpdesk**: nobody monitors phones through WhatsApp; never install a remote app or share a screen on a call.

### Learner interaction journey

`notification → chat list → thread → business info / scan picture → Device care → Answer the call →
Share screen → consent dialog → Cancel (or End call) — or the APK link → download warning → install
dialog → Cancel → IT Helpdesk → report and block`

### Simulation surfaces

Business card (`CONTACT`), scan viewer (`VIEWER`, new drawn `scan` art), Device care (`APP`), the
support call (`CALL` with `endCallScored` and a local link), the consent dialog and the installer
(`INSTALLER`, dialog and prompts styles), two further calls (`CALL`), one directory row.

### Verification mechanism

`verify_known_number` on the IT Helpdesk's directory number, or `verify_trusted_directory`. Calling
the Security Desk back is the 0-point route — "the alert is genuine".

### Safe resolution

End call, Cancel on the consent dialog or on either install dialog, or the composer line
(`SAFE_PIVOT` +3), IT Helpdesk (`TRUSTED_VERIFY` +3), then report or block (+2). Ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Start now (screen-share consent) | `share_secret` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Install (install dialog) | `attempt_install` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| "Which contacts reported me? What do I do first?" | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Tap the download link in the preview | `open_link` (open) | `PREMATURE_REPLY` | −1 |
| Call the Security Desk number back | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |

Answering the call is navigation, deliberately — picking up is not the harm; what is shared is.
Screen sharing is priced through `share_secret` because what a shared screen releases is exactly what
that intent names: codes, credentials and messages as they arrive.

### Scoring / event mapping (unchanged)

Identical to W22.

### Realism decisions

The caller pre-empts the consent warning, which is what makes these calls work. The camera is off
because a support agent has no reason to be seen. The download goes straight to the install dialog;
W14 already walks the unknown-apps settings chain, and repeating it would have made this W14 again.

### Known limitations

The install route skips the per-source "install unknown apps" switch (see above). The call is video
with the remote camera off, drawn as the voice-call layout. Share screen is a link on the call screen
rather than a control in a call toolbar. Closing the consent dialog returns to a call screen that
remounts and replays its captions from the start (the call surface is keyed per mount).

### Why the final simulation stays faithful

The sender, number and headline are the bank's; the install event names the bank's install asset,
whose three permissions are the three the dialog lists. No capture, permission or package exists in
the product (containment asserted on the call, the consent dialog and both installer pages).

---

## 5. W25 — Known Contact Sends a Linking Code

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Known Contact Sends a Linking Code |
| Disposition | Malicious |
| Level | Hard |
| Family (client) | Compromised-contact device linking |
| Canonical family | `account_takeover_authorisation_abuse` |
| Trigger (client) | Trust + reciprocity |
| Canonical triggers | `trust`, `reciprocity` |
| Military flag | No |
| End state | The account remains controlled by the learner and the compromised-contact warning is recorded. |
| Decision signal (stage 3) | A linking code authorizes access to the learner's account; a colleague never needs it to test their own device. |

### MITRE ATT&CK alignment

| Technique | Name | Matrix / tactic | Version | Created / last modified |
| --- | --- | --- | --- | --- |
| [T1676](https://attack.mitre.org/techniques/T1676/) | Linked Devices | Mobile / Collection, Persistence | 1.0 | 19 May 2025 / 19 May 2025 |
| [T1586.001](https://attack.mitre.org/techniques/T1586/001/) | Compromise Accounts: Social Media Accounts | Enterprise / Resource Development | 1.1 | 1 October 2020 / 24 October 2025 |
| [T1684.001](https://attack.mitre.org/techniques/T1684/001/) | Social Engineering: Impersonation | Enterprise / Stealth | 1.0 | 14 April 2026 / 12 May 2026 |

**Considered and rejected:** [T1111](https://attack.mitre.org/techniques/T1111/) Multi-Factor
Authentication Interception (Enterprise, Credential Access, v2.1). Its description is interception of
MFA mechanisms — smart cards, token generators, keylogging, SMS service compromise. The learner here
is asked to hand over a code; nothing is intercepted, and the code is a device-linking authorisation
rather than a second factor for a login.

### Why this maps

T1676 is the objective: adversaries "abuse the 'linked devices' feature on messaging applications,
such as Signal and WhatsApp, to register the user's account to an adversary-controlled device", to
collect messages and "send future messages from the linked device". T1586.001 is Neel's account:
"utilizing an existing persona may engender a level of trust in a potential victim if they have a
relationship… with the compromised persona". T1684.001 is whoever is typing: impersonating "a known
sender such as… colleague".

**Partial fit, stated.** T1676's description centres on scanning QR codes; this scene uses the
phone-number pairing code. That form is documented by Gen Digital's "GhostPairing" research of 15
December 2025: messages from genuinely compromised contacts, a phone number used to start a real
linking request, and WhatsApp's own pairing code completing it, with Settings → Linked Devices as the
place to find the rogue device ([Gen Digital](https://www.gendigital.com/blog/insights/research/ghostpairing-whatsapp-attack)).
T1586.001 names social-media profiles; a WhatsApp account is compromised the same way.

**Content note — the client's code direction.** In the real pairing flow the code is shown on the
device being linked and entered on the owner's phone. The client's scenario has the learner "just
get" a code and be asked to send it, with an "approval sheet". The client text is authoritative, so
the scene puts the code in WhatsApp's notice on the learner's phone and the approval on WhatsApp's
request sheet; both releases — sending the code and approving the device — end in the same place.

### What must NOT be copied

No real person, team, organisation, device, browser session or location. "Neel", "Team Delta",
"Maj. Kulkarni" and the code are invented; the code matches no real format and is checked nowhere.

### Client requirements preserved

Stage 2's "authentic-looking saved-contact thread" is four years saved, last week's favour and
Saturday's cricket. Stage 3's "request purpose, code warning, linked-device context and
out-of-character behavior" are "testing the team desktop", WhatsApp's "don't share this code",
the request sheet and Linked devices, and "Kindly", the About line and the team group. Stage 4's
"simulated device-link code and approval sheet" is literal. Stage 5's "call the contact through a
known alternate route and review Linked Devices" is a phone call to Neel's number and Settings →
Linked devices. Stage 6's "deny linking; remove unknown devices; report the compromised message and
alert the real contact" is "Don't link; report the chat and warn Neel".

### Enhanced synthetic storyline

Yesterday someone posing as WhatsApp support got a code out of Neel, and this afternoon his WhatsApp
logged him out; he is at his cousin's wedding and has not noticed why. His About line, set before,
still says so; the team group says he is on leave. Last Thursday he covered the learner's 0600 duty
and the learner wrote "I owe you one". At 19:31 his account writes "Hi, hope you are doing well."; at
19:33 WhatsApp tells the learner a device wants to link, with a code; at 19:34 the client's headline;
at 19:35 "Kindly do it fast. Remember you owe me one 😊". At the branch stage a "screenshot" of the
desktop login arrives — with the learner's own number typed in — and "It expires in 3 minutes."

### Conversation progression

1. `LAST THURSDAY` — the favour and "I owe you one". `SATURDAY` — the match.
2. `TODAY 19:31–19:35` — the formal hello, the headline, the favour called in.
3. `branch` — the screenshot; "Just type it here".
4. After a consequence — "Setup done. You can ignore any notification about a new login."

### Evidence the learner can discover (progressive)

- **The chat list**: WhatsApp's own notice, one row down, at 19:33 — a linking code and "don't share".
- **The request sheet**: Chrome on Windows, requested with the learner's number, about 1,400 km away.
- **The thread**: lowercase "done da 👍" last week against "Kindly do it fast" today.
- **Contact info → About**: "At my cousin's wedding 💍 back Wednesday", updated yesterday.
- **The team group's row**: Neel is on leave till Wednesday.
- **The screenshot**: the phone number typed into the login is the learner's.
- **Linked devices**: the waiting request, beside the learner's own office laptop as it really looks.
- **The phone call**: Neel, at the wedding, logged out, and how it happened.

### Learner interaction journey

`notification → chat list (WhatsApp notice) → thread → contact info → screenshot → Linked devices →
request sheet → Don't link (or the composer line) → phone Neel → report and warn him`

### Simulation surfaces

Contact sheet (`CONTACT`, 3 tabs), screenshot viewer (`VIEWER`, new drawn `desktop` art), WhatsApp's
request sheet (`INSTALLER`, sheet style), Linked devices (`SETTINGS`, with a link to the request),
the phone call (`CALL`), one directory row. New use: a chat-list row that opens WhatsApp's own screen.

### Verification mechanism

`verify_known_number` — an ordinary phone call to Neel's number, which reaches the person even though
his WhatsApp does not — or `verify_known_app` on the learner's own Linked devices, or
`verify_trusted_directory` on the IT Helpdesk. "Ask Neel in this chat to prove it is him" is the
0-point route: the account holds the real history and can quote it.

### Safe resolution

Don't link, or the composer line (`SAFE_PIVOT` +3), phone Neel or Linked devices (`TRUSTED_VERIFY`
+3), then report or block (+2). Ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Send the code in the chat | `share_secret` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Link device (request sheet) | `approve_device_link` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| "Why do you need my code for your desktop?" | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Reply "ok wait" from the notification | `reply` (open) | `PREMATURE_REPLY` | −1 |
| Ask Neel in this chat to prove it is him | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |

### Scoring / event mapping (unchanged)

Identical to W22.

### Realism decisions

Everything about the account is right, because it is Neel's account. The favour is real, which is
why cashing it in works. The composer's safe line tells the account the learner is calling Neel — a
real person would say that, and the attacker cannot stop the call.

### Known limitations

Linked devices shows the waiting request whatever was chosen at branch (branch-neutral surface).
W25's notify toast and result card show the bank's one-letter truncated body (§0.5).

### Why the final simulation stays faithful

The sender, number and (full) headline are the client's. The code is scene text; sending it submits
only the intent, and the code string never reaches the wire (asserted).

---

## 6. Forms, inputs and data handling

Two scenes in this batch carry fields: **W22** (Qorvex identity form: name, ID number, bank account;
the deposit sheet's UPI PIN) and **W23** (the four-step grant application: relationship, home
address, service number, unit, present post, deployment dates, next leave or move, account holder,
account number, IFSC). The rules are unchanged from IMMERSIVE-003A-R2:

- **Local** — a value lives in `useLocalForm` inside the component that draws the field, and nowhere else.
- **Ephemeral** — it is discarded when the learner leaves the page (the browser surface is keyed on the page).
- **Never transmitted** — no affordance, intent, payload or header carries it.
- **Never persisted** — no storage, cookie, cache or file.
- **Never logged** — not to the console, not to an event, not to the ledger.
- **No autofill surface** — every input is `type="text"`, `autocomplete="off"`, with a meaningless `name`.
- **No form submission** — there is no `<form>` element and no action anywhere.
- **Deterministic** — the same page always behaves the same way.
- **Not decorative** — a form exists only where refusing to fill it in is the decision being tested.

The engine's `METADATA_ALLOWLIST` is the second line of defence: an event may carry only `intent`,
`transition`, `consequence`, `resolution_code`, the duration measures, `verify_source` and
`premature`, and a key outside that list is rejected rather than dropped.

**W21, W24 and W25 carry no form.** W21's decision is an acknowledgement in a portal; W24's are a call
button and system dialogs; W25's code is scene text sent by choosing it, and its approval is a sheet
of buttons. Adding fields to any of them would have been decoration.

## 7. What is asserted, and where

| Claim | Test |
| --- | --- |
| Every W21–W25 control legal on its real definition; each safe path exactly ten; 65 new pinned event/point pairs; canonical family, triggers and military flag as recorded here | `backend/tests/sceneAffordance.test.js` |
| W21–W25 walks resolved by the engine and fed to the real review — W21's false positive and unsafe step classified as such; each correct action is the scenario's own stage text; no event code or point value | same |
| W01–W25 authored, no id collision; Instagram, Email and SMS generic | `sceneModel.test.js`, `sceneAffordance.test.js` |
| No narrator verdict or labelling word in W21–W25; W22 and W25 added to the truncation list | `frontend/src/simulation/sceneModel.test.js` |
| Each of W21–W25 carries the interaction it was built around; five distinct branch shapes; a right and a wrong option in every resolve banner | same |
| Containment at every stage and surface (W24's call → consent dialog walked explicitly) | `SceneContainment.test.jsx`, `pages/SceneScenariosE.test.jsx` |
| Each scenario end to end through the controller; local navigation records nothing; remount replays nothing; typed values, PIN and the linking code never leave | `frontend/src/pages/SceneScenariosE.test.jsx` |
| This document covers every authored scenario and cites every technique it names | `frontend/src/simulation/sceneResearch.test.js` |

Shared renderer additions (generic, optional, used by no earlier scene): two drawn attachment arts,
`scan` and `desktop`, in `components/simulation/whatsapp/AttachmentTile.jsx`. No other shared file
changed.

Bank fingerprint expected before and after this task:
`8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687`

Synthetic fingerprint expected before and after this task:
`2779b03939e13cf11e0bee44493609f0c91e228f201f22f8c025a080509afde1`

## 8. Findings during verification

1. **Cross-cutting defect, fixed: the in-message verification route was refused in a real browser.**
   Every client surface — the generic action sheet and all twenty-five scenes — sends
   `verify_source: "in_message_contact"` with `verify_in_message_contact`. The `ScenarioEvent`
   metadata schema listed only `in_message`, so that route failed with a 422 ("The simulation could
   not continue") for every scenario, W01–W20 included. No stubbed suite could see it (the jsdom fake
   server does not validate, and `playScenario.js` sends no metadata). Found by playing W23's "call
   the case officer from the chat" in the browser. Fixed narrowly in
   `backend/src/models/ScenarioEvent.js` by accepting `in_message_contact` beside `in_message`
   (metadata only, no score reads it, nothing stored becomes invalid); pinned by a new test in
   `sceneAffordance.test.js` that checks every source the scenes and the action sheet send against
   the real schema enum (it fails without the fix). Re-verified in the browser on W22, W23, W24 and
   W25.
2. **W24's post-call entry said "Missed video call" even after the learner answered.** Changed to the
   neutral call entry.
3. **The typing strip was drawn above a consequence message** in W22–W25; it now follows it.
4. **Concurrent load:** two DB-backed suites (`auditLogApi`, `candidateProfileApi`) failed once while
   HTTP scenario play ran in parallel on the same `mongod`; both pass alone and in a clean sequential
   batch (322 / 322). Not a product defect; recorded so the numbers are not mistaken for clean.

### Browser verification (isolated)

Isolated database `cyber_awareness_003e_verify`, API **5055**, frontend **5199** (verify mode); the
production-facing 5000 / 5173 were not running at any point. Non-target runs in each attempt were
closed through the same HTTP API `playScenario.js` uses; W21–W25 were played by hand.

| Scenario | Safe path in the browser | Unsafe path in the browser | Also seen |
| --- | --- | --- | --- |
| W21 | 10/10 continue (contact → SecureDesk → acknowledge → compare) | skip → mute → block → report: 0/10, reviewed as "Genuine item rejected" | desktop |
| W22 | 10/10 report (read thread → boundary reply → Investor Check) | INR 2,000 deposit with PIN → ask Samira → keep chatting: 0/10; an accidental quick-reply start gave 7/10 with "premature" in the review | 640 px (≈200%) run, Photos search |
| W23 | 10/10 report (business info → form step 1 → close → call Ma) | four-step form submitted → call "Mr. Menon" → finish form: 0/10 "Threat missed" | 375 px mobile, no overflow |
| W24 | 10/10 report (scan picture → answer → Share screen → Cancel → IT helpdesk) | Share screen → Start now → call desk back → let technician: 0/10 | consent dialog |
| W25 | 10/10 report (WhatsApp notice peek → contact → Linked devices → Don't link → phone Neel) | read thread → Link device → ask Neel in chat → keep chatting: 0/10 | reload on a pushed surface at Decide rebuilt from the server with the timer running |

Every ledger was read back from the isolated database and matched the engine; event metadata keys
were confined to the allowlist; none of the typed values (address, service number, unit, post,
dates, account holder, account number, IFSC, PIN) or the linking code appear anywhere in the stored
events, runs or attempts. **Offline:** the only origins the page contacted were
`http://localhost:5199` and `http://localhost:5055`.
