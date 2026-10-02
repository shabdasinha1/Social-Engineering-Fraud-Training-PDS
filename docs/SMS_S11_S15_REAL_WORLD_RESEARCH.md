# SMS S11–S15 — real-world research and storyline reconstruction

**Task:** IMMERSIVE-012 — the third SMS batch
**Naming:** the client's bank numbers every SMS scenario `S01`–`S25` (specification pages 88–112);
this batch is **S11–S15** in the data, the registry, the tests and this document, and it corresponds
to specification **pages 99–103**.
**Scope:** SMS S11, S12, S13, S14, S15 only. WhatsApp W01–W25, Instagram I01–I25, Email E01–E25 and
SMS S01–S10 are complete and unchanged in behaviour; SMS S16–S25 stay on the generic path.
**Status:** design record for the five SMS scenes authored by this task. **IMMERSIVE-012 COMPLETE
(21 September 2026)** — implemented, tested and browser-validated; the validation totals are in
`PROJECT_MASTER_PLAN.md` §16.34.
**Companions:** [`SMS_S01_S05_REAL_WORLD_RESEARCH.md`](SMS_S01_S05_REAL_WORLD_RESEARCH.md) and
[`SMS_S06_S10_REAL_WORLD_RESEARCH.md`](SMS_S06_S10_REAL_WORLD_RESEARCH.md), which use the same method.

---

## 0. How this document was produced, and what it is allowed to change

### 0.1 The transformation

```
REAL-WORLD BEHAVIOUR
      |   observed in published threat intelligence, regulator and platform advisories
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

What is taken from the real world is the shape of a phone's own Messages app and of five things that
arrive in one: a genuine appointment reminder from a number the learner saved themselves; a refund
promise from a registered sender ID that is registered to send *offers*; a recruiter who writes from
a different mobile number every day; a "unit alert" recall that wants a live position through a web
page; and a picture message, sent to a readable list of twelve people, whose code leads to a page
that wants a canteen card PIN.

What is deliberately **not** taken is infrastructure, tooling, real brands, real clinics, real tax
authorities, real employers, real units, real canteens, real sender IDs, real accounts, real people,
real payment rails or any real capability. "Training Clinic", "Dr S. Rao", `AX-ITRFND`, `VM-ITDEPT`,
"e-Filing", "Nexa Staffing", "Task Centre", "Unit Falcon", `VM-FALCON`, `VM-FALCNT`, the Unit Portal
and the Canteen app are fictional and describe nothing real. Every host is `*.training.example`;
every phone number is in the reserved `+91 00000 xxxxx` range; every message list, thread, details
screen, link-details screen, picture viewer, browser page, permission prompt, payment sheet, call
and application is local, inert and offline. No image file exists. Nothing is fetched, dialled,
scanned, granted, paid or sent.

**Military safety (S14, S15).** S14 and S15 are the batch's two military scenarios, and every entity
in them is synthetic. There is no real unit, formation, establishment, appointment, rank, roster,
posting, movement, recall procedure, alerting system, schedule, canteen scheme or capability anywhere
in either scene. "Unit Falcon", its duty office, its Unit Portal and its Alerts page, the recall
exercise `RC-0812`, the canteen, `VM-FALCON` and `VM-FALCNT` are invented; the service number, route
and position fields are empty boxes whose contents never leave the component. The behaviours taught —
*a recall is recognised by where it comes from and by the official channel, never by a public page
that asks for your position*; *a benefit is recognised in the app you already use, never in a picture
from a stranger* — are generic hygiene and depend on no real-world detail. `sceneModel.test.js`
asserts neither scene names a rank, formation or operational term.

### 0.2 Source of the threat intelligence

Primary source: **MITRE ATT&CK, website version v19.2** (released 28 April 2026), re-confirmed as the
current version on the live versions page on 21 September 2026
(<https://attack.mitre.org/versions/>, which resolves to `/resources/versions/`; v18.1 ran
28 October 2025 – 27 April 2026, v17.1 before it). Technique pages read live for this batch on
21 September 2026: T1660, T1430, T1657, T1591.001, T1417.002, T1598.003, T1684.001 and T1585. T1598,
T1589, T1583.001, T1566.002 and T1636.004 were read live on 20 September 2026 for S06–S10 under the
same v19.2 release and are carried forward.

Two readings this batch relies on, stated because they change mappings the earlier SMS records made:

- **T1660 Phishing (Mobile)** names both **smishing** ("SMS messages") and **quishing** ("QR codes …
  to redirect users to a phishing website") in its own description. It is therefore a *direct*
  delivery mapping for S15's picture-message code, not an approximation.
- **T1417.002 GUI Input Capture** and **T1430 Location Tracking** are both described as behaviour of
  a **malicious or exploited application on the device** (WebView overlays; OS location APIs called
  by an installed app). Neither covers a standalone web page in the phone's browser, so both are
  **considered and rejected** in this batch rather than used as near-misses.

Version note carried forward: `T1656 Impersonation` no longer exists as a top-level technique; the
current page is **T1684.001** (Social Engineering: Impersonation, parent T1684).

Secondary sources, for the real-world pattern behind each scenario (landing pages, read 21 September
2026):

- **S11** — the legitimate control; US NIST "Phish Scale" material on the cost of false alarms
  (<https://www.nist.gov/publications/phish-scale-user-guide>); UK NCSC guidance on proportionate
  responses to genuine messages (<https://www.ncsc.gov.uk/guidance/phishing>).
- **S12** — US FTC and UK HMRC-style consumer advisories on tax-refund texts
  (<https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams>); Indian national
  cybercrime portal material on refund smishing (<https://cybercrime.gov.in/>).
- **S13** — US FTC data spotlight on "gamified" task-job scams and I4C advisories on task fraud
  (<https://consumer.ftc.gov/articles/job-scams>, <https://cybercrime.gov.in/>).
- **S14** — UK NCSC guidance on phishing that impersonates an organisation's own alerting
  (<https://www.ncsc.gov.uk/guidance/phishing>).
- **S15** — US FTC consumer alert on QR-code lures (<https://consumer.ftc.gov/consumer-alerts>).

**Source-confidence note.** Nothing in this document rests on a secondary source for a *behavioural*
claim that ATT&CK is asked to carry. Every ATT&CK citation is linked to its own technique page, and
`sceneResearch.test.js` fails the build if a technique is named without its page. **ATT&CK research
does not affect scoring in any way**: the scores are the bank's, pinned by `sceneAffordance.test.js`.

### 0.3 Interpretation rule

ATT&CK is used as a **behavioural reference, not a checklist**. A mapping is recorded only where the
technique's own description describes what the scenario does, and each is marked **direct**,
**supporting** or **partial**. **S11 has no mapping, and that is stated** — a clinic reminder for an
appointment the learner booked involves no adversary. Four behaviours in this batch have **no
dedicated ATT&CK technique**, and the sections say so: the **category of a registered sender ID**
(S12); **rotation of throwaway phone numbers** and the recruitment of a victim's bank account as a
payout account (S13); a **web page obtaining location through the browser's site permission** (S14);
and **list delivery exposed by a group MMS** (S15).

### 0.4 What this document may and may not change

| Thing | May IMMERSIVE-012 change it? |
| --- | --- |
| Scenario IDs, platform, level, disposition, family, trigger, military flag, version | **No** |
| The six stages, their order, their text, expected actions, scoring semantics, feedback | **No** |
| `backend/data/scenarios/v1` and its fingerprint `8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687` | **No** |
| `backend/data/synthetic/v1` and its fingerprint `2779b03939e13cf11e0bee44493609f0c91e228f201f22f8c025a080509afde1` | **No** |
| The engine, the event ledger, the selection algorithm, the 90-minute deadline, the attempt API, the training-feedback review | **No** |
| Scene structure, beats, SMS surfaces, phone UI, the server-side control map | **Yes — this is the whole task** |

**The client scenario remains authoritative** over everything in this document. Where the research
and the client's own stage text disagree, the client's text wins and the disagreement is recorded.

### 0.5 Content notes carried forward

**Canonical identity.** Every family and trigger is the bank's own, normalised by the existing
canonical taxonomy (`attack-family-taxonomy.v1.json`, `trigger-taxonomy.v1.json`); no identifier was
invented. S11 → `legit_system_confirmation` (`routine` + `empathy`); S12 →
`financial_credential_phishing` (`greed` + `authority`); S13 → `investment_and_task_fraud` (`greed` +
`commitment`); S14 → `operational_elicitation` (`authority` + `urgency`, military); S15 →
`qr_code_phishing` (`familiarity` + `scarcity`, military).

**Placeholder sender identifiers.** The generator stored S12's sender as the bare number
`+91 00000 28689`, which contradicts the client's stage-2 text ("A branded header promises a refund").
Handled as in S05 and S07: the scene prints the header the client's text requires (`AX-ITRFND`) as the
thread title and on the toast, and names the bank's sender **asset id** on the inspection control.
S11's sender is the bank's `Training Clinic` / `+91 00000 35413`, shown as a **saved contact** — the
clinic's reminder line, listed in its portal — which fits the client's "established clinic thread"
and lets the client's "Reply 1 confirm" work as an ordinary text reply.

**Split sender and body.** S13 (`Remote role`) and S14 (`UNIT ALERT`) store a display name and a body
separately; as in S06, the two are reassembled into one bubble (`UNIT ALERT: <body>`), because on SMS
a name that is not a registered sender ID is a signature inside the text, and the thread header is
therefore the ten-digit number.

**The narrator line is not printed.** No `prior_context` sentence is displayed on the device. The
verdict-word list applies to every label, hint and echo; report controls say "Report the message as
junk". The `browser_page` assets' narrating `body` is never shown; only `host` is used.

**The trigger word is not printed.** None of the five scenes prints its canonical trigger words; for
S14 and S15 `sceneModel.test.js` asserts it.

**Deliberate overlaps with earlier scenes are recorded, not hidden** — S12 with E08, S13 with W17,
S14 with W19 and S06, S15 with I25, and S11 with S03/S07/W11 share families or subjects with them.
§0.6 states what separates each.

**The result card placeholder** (known limitation carried from earlier scenes) applies to all five.

---

## 0.6 Differentiation from SMS S01–S10, Email E01–E25, WhatsApp W01–W25 and Instagram I01–I25

A comparison against all eighty-five earlier scenes was made **before** implementation, on story
archetype, attack family, trigger combination, difficulty, branch shape, verification method,
decision home, resolution sequence and psychological lever:

| | Behavioural lesson | Social mechanism | Primary evidence | Decision home | Verification pattern | Unsafe temptation |
| --- | --- | --- | --- | --- | --- | --- |
| **S11** *(legitimate)* | Reply with what was asked for, and nothing else | Caring about one's own health | A contact the learner saved from the booking page; the confirmation two messages up with the same reference and slot; the portal lists both | **The composer's quick replies, and the menu** | The clinic portal; reception on the appointment-card number | Add symptoms, date of birth and member number to the reply; delete and block the line |
| **S12** | A registered header is not a government one | Official-sounding reward | The header's **category** is Promotional and the phone filed it under Offers; the tax department's own Government header already said "no refund is due" | **The phone's link-details screen, and a two-page refund site** | The e-filing portal from bookmarks; the tax helpline in the directory | Open the address; confirm the refund account; release the refund with a card and code |
| **S13** | A company does not change its number every day | Easy money + steps "already done for you" | Three mobile numbers under one signature in four days, one already in Spam; the pay rose between them | **The app's one-tap suggested reply, the details screen, a payout page and a payment sheet** | The company's own careers page found by searching; its office number from that page | Tap YES; save the payout account; pay the "refundable" deposit |
| **S14** *(military)* | The unit has recalled you before, and it did not look like this | Claimed command + a deadline | The genuine August recall exercise in the Service tab — reference, portal, no link — beside today's unsaved mobile with a public address | **The link card, the browser's own location-permission prompt and a recall form** | The Unit Portal's Alerts page (official recall channel); the duty office on the directory number | Open the address; Allow location; submit service number, position, route and arrival time |
| **S15** *(military)* | Being on a list with colleagues is not being written to by the canteen | A familiar name + 200 slots | The group MMS lists twelve people: two saved colleagues and eight **consecutive** unsaved numbers; the picture viewer shows the code's host before opening; the canteen's own header has never sent a picture | **The picture viewer, a card-linking page, and a reply that goes to all twelve** | The canteen app; the canteen office on the directory number | Open the code; enter the canteen card PIN; reply to everyone |

**What makes these SMS and not the messenger.** The platform grammar S01–S10 established — category
tabs, a header that is often only a number, registered sender IDs, the unsaved-sender bar, link cards
showing an address as written — plus five things this batch uses for the first time:

- **A reply as the correct act (S11).** Every earlier SMS scene either had nothing to answer or
  priced answering. S11's `+3` is an ordinary text reply, taken from the composer's quick replies,
  and its `−4` is the same reply with health details added.
- **Sender-ID category (S12).** A *registered* header the learner has been taught to trust, filed by
  the phone under Offers because that is what it is registered to send.
- **Conversations are filed by number (S13).** One signature, three threads, three numbers — and the
  app's own suggested reply, which sends as soon as it is tapped.
- **The browser's site-permission prompt (S14).** The release is granted to a web page through a
  prompt that belongs to the phone, not the page.
- **The group-MMS recipient list (S15).** A picture message shows everyone it went to; eight numbers
  in sequence are what a typed-in list looks like, and a reply is never private.

**The nearest earlier scenes, and how they differ.**

- **S12 and E08** are both tax-refund lures that end on a form for identity, card and code. E08 is an
  email decided on its form; S12 is decided on the **sender category** and on the phone's link-details
  screen, where the scored open sits. S12 is also the inverse of **S01**: S01's tell was a bank writing
  from a *mobile*; S12's sender is a *registered header*, and the tell is what it is registered for.
- **S13 and W17** share family and triggers. W17's evidence is WhatsApp's "Forwarded many times",
  INR 150 already in the learner's bank, and ratings that end in a merged order. S13 uses none of
  them: number rotation, a pre-ticked onboarding checklist, a held bonus, a payout-account harvest and
  a deposit paid to an individual; its decision home and branch shape are unique across all ninety.
- **S14, W19 and S06.** W19 is a WhatsApp clone of a commander asking for live location through the
  messenger's own share sheet. S06 is an unsaved mobile asking for identity data by reply. S14 shares
  S06's sender type but not its lesson: the comparison is a **genuine earlier recall** in the same app,
  the verification is the **official recall channel**, and the release is a **browser site
  permission** plus an operational form. (S14 deliberately does **not** use sender-ID spoofing into
  the genuine thread; that mechanism belongs to the bank's S18.)
- **S15 and I25** share family, triggers, military flag and the canteen subject. I25's code sits in a
  reel read by screenshot, with an audio credit, an eligibility form and a ₹49 activation sheet, and
  its unsafe share is reposting the reel. S15's evidence is the **group-MMS recipient list**, its
  `−8` is a **card PIN** (a secret, not a form or a fee), and its `−3`s are opening the code from the
  picture viewer and a reply that reaches all twelve recipients.
- **S11, S03, S07, W11 and E11** are the legitimate confirmations. S03 prices blocking a sender, S07
  deleting a receipt and ringing a searched number, W11 a sponsored helpline, E11 nothing a phone
  shows. S11 prices **oversharing in a correct reply** — a mistake none of them can express.

**Differentiation, asserted.** `sceneModel.test.js` asserts that **none of S11–S15 repeats a
branch-stage shape of any of the eighty-five earlier scenes, or of each other**; that **each of the
fifteen SMS scenes has a decision home no other SMS scene shares**; that every scored branch surface
**and page** is reachable without spending the branch; and the per-scene properties listed in §7.

---

## 1. S11 — Expected Clinic Reminder

### Client scenario (authoritative)

Specification page 99. SMS, **Medium**, **Legitimate**, family *Legitimate appointment reminder*,
trigger *Routine + care*. Canonical identity: family `legit_system_confirmation`, triggers `routine`
+ `empathy`, military flag **false**, level `medium`.

- **Stage 1 (Event).** "Training Clinic: Appointment 03 Sep 09:20. Reply 1 confirm, 2 reschedule."
- **Stage 2 (Open).** The established clinic thread; a reminder for an appointment booked in the
  synthetic clinic portal.
- **Stage 3 (Inspect).** Registered sender, matching date/reference and limited reply options.
  Decision signal: *the reminder matches an initiated booking and requests only a low-risk
  confirmation.*
- **Stage 4 (Branch).** SMS quick-reply choices and local appointment comparison.
- **Stage 5 (Verify).** Compare with the known clinic portal / trusted directory; do not report or
  block a legitimate sender.
- **Stage 6 (Resolve).** Reply 1 or 2 as appropriate; retain the thread; do not report.

### MITRE ATT&CK alignment

**There is none, and none has been invented.** ATT&CK catalogues adversary behaviour. The item under
assessment is a genuine reminder, from the clinic's own reminder line, for an appointment the
learner booked themselves. There is no adversary, campaign, infrastructure or technique.

**Closest defensible behavioural reference.** What S11 prices is the learner's own reaction — a
needless rejection, and oversharing sensitive health data in an otherwise correct reply. The
reference material is defensive: NIST's work on the operational cost of false alarms, and NCSC's
guidance on proportionate responses, both cited in §0.2. No adversary behaviour is claimed and no
identifier appears in this section.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The list row preview and the reminder bubble; the toast carries "Training Clinic" |
| "Established clinic thread" | The thread holds the 26 August booking confirmation above today's reminder |
| "Matching date/reference" | The details screen's reference row and its "Compared with today" page |
| "Limited reply options" | The confirmation says "Reply to reminders with 1 or 2 only"; the details screen's "Replies asked for: 1 or 2" |
| "SMS quick-reply choices" | The composer offers "Reply 1 to confirm" and "Reply 2 to reschedule" |
| "Local appointment comparison" | The clinic portal and the phone's calendar, both opened by local navigation at the branch |
| "Do not switch to an untrusted channel" / "no health details are transmitted" | The priced reply that adds symptoms, date of birth and a member number (`−4`) |
| "Needless reject/ignore −2" | Delete the conversation and block the number |
| "Do not report or block a legitimate sender" | Report and block at verify are `−4`; reporting at resolve is `−4` |

### Enhanced synthetic storyline

On 26 August the learner booked a review with Dr S. Rao in the clinic portal, paid INR 300 (the bank
alert is in Transactions) and saved the reminder line the booking page gave them. Today at 17:37 the
reminder arrives on that saved contact, under the confirmation, and a second line asks them to bring
earlier reports. Their mother has texted asking what the doctor says; a friend asks whether their back
is up to a run. Everything invites them to say how they are — and the reminder line asked for one
character.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast from "Training Clinic" |
| Open | The message list, Personal selected, with Transactions and Spam beside it |
| Inspect | The thread with its two days; the details screen; the booking comparison page |
| Branch | Reply 1, reply 2, reply 1 with health details, or delete and block; the portal and calendar are free |
| Verify | The clinic portal, reception, the directory — or the in-message and report/block mistakes |
| Resolve | Keep the thread / keep the reminder; or report / ignore |

### Evidence the learner can discover (progressive)

1. No unsaved-sender bar: the number is in the contacts.
2. The confirmation two messages up: the same reference, doctor, date and time.
3. The details screen: saved from the booking page, listed in the portal as the reminder line, replies
   limited to 1 or 2 — and a note that whatever a reply says is read by whoever runs the line.
4. The clinic portal: the booking awaiting confirmation, and "never sent by text: symptoms, results,
   date of birth or member number".
5. The calendar: the visit, added by the learner, with nothing clashing.
6. Reception on the appointment-card number: reply 1, and nothing about how you feel.

### Learner interaction journey

Notify → open the reminder → the details screen → the booking comparison → back → open the clinic
portal (free) → reply 1 → Send → open the clinic portal and compare the booking → keep the thread and
go on Wednesday.

### Simulation surfaces

- `details` (`SMS`): conversation details, with a booking-comparison page.
- `clinicapp` (`APP`): the learner's own clinic portal.
- `calendar` (`APP`): the phone's calendar.
- `receptioncall` (`CALL`): reception, on the appointment-card number.

### Verification mechanism

`verify_known_app` opens the clinic portal; `verify_known_number` calls reception;
`verify_trusted_directory` opens the directory. Texting the reminder line to ask whether it is really
them is `verify_in_message_contact` (0). Report and block are `FALSE_REPORT_BLOCK` (−4).

### Safe resolution

`resolve_continue` or `resolve_retain`, `+2`. Full safe path: `open_item → read → inspect_sender →
safe_pivot (reply 1) → verify_known_app → resolve_continue` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Reply 1 and add symptoms, date of birth and member number | `submit_data` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Delete the conversation and block the number | `reject_ignore` | `NEEDLESS_REJECT_IGNORE` | −2 |
| Report or block at verify | `report` / `block` | `FALSE_REPORT_BLOCK` | −4 |
| Report the clinic's messages, or ignore, at resolve | `resolve_report` / `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |
| Reply 1 from the list before reading | `reply` (open) | `PREMATURE_REPLY` | −1 |

### Scoring / event mapping (unchanged)

Stage 4 declares `CORRECT_USE +3`, `NEEDLESS_REJECT_IGNORE −2`, `UNSAFE_EXTERNAL_ACTION −4`. The two
quick replies are `safe_pivot`, which the engine resolves to `CORRECT_USE` on a legitimate item; the
overshare is `submit_data`, which resolves to `UNSAFE_EXTERNAL_ACTION` because the scenario declares no
release code. Pinned: overshare route **3**, delete/block route **5**, false report route **0**.

### Why the final simulation stays faithful

Every client element is present: the verbatim reminder, the established thread, the matching
reference and date, the limited reply options, the quick replies, the local portal comparison, the
verification against the portal and directory, and a resolution that replies and keeps the thread.
What the scene adds is the one realistic way a genuine reminder goes wrong — the learner telling a
reminder line far more than it asked for.

---

## 2. S12 — Income-Tax Refund Form

### Client scenario (authoritative)

Specification page 100. SMS, **Medium**, **Malicious**, family *Government impersonation / refund
smishing*, trigger *Greed + authority*. Canonical identity: family `financial_credential_phishing`,
triggers `greed` + `authority`, military flag **false**, level `medium`.

- **Stage 1 (Event).** "Tax refund INR 12,480 approved. Confirm bank before 18:00:
  tx-rf.training.example"
- **Stage 2 (Open).** A branded header promises a refund but uses a shortened link and requests bank
  credentials.
- **Stage 3 (Inspect).** Header anomalies, generic reference, target domain and urgency.
- **Stage 4 (Branch).** A synthetic refund form asking identity, account, card and OTP.
- **Stage 5 (Verify).** Open the known tax portal directly and check account/refund status.
- **Stage 6 (Resolve).** Close; report junk / block; do not submit.

### MITRE ATT&CK alignment

| Technique | Fit | Why this maps |
| --- | --- | --- |
| [T1660 Phishing (Mobile)](https://attack.mitre.org/techniques/T1660/) | **Direct** | The technique names SMS delivery ("smishing") of content that redirects the user to a phishing site. That is the whole delivery of S12. |
| [T1598.003 Phishing for Information: Spearphishing Link](https://attack.mitre.org/techniques/T1598/003/) | **Supporting** | A link that leads to a page harvesting identity, account and card data; the page cites SMS links used to steal credentials. |
| [T1684.001 Social Engineering: Impersonation](https://attack.mitre.org/techniques/T1684/001/) | **Supporting** | The sender presents itself as the tax authority's refund cell. |
| [T1657 Financial Theft](https://attack.mitre.org/techniques/T1657/) | **Supporting** | The card, expiry and one-time code are the means to take money. |
| [T1583.001 Acquire Infrastructure: Domains](https://attack.mitre.org/techniques/T1583/001/) | **Supporting** | The expanded host was registered three days ago, as the link-details screen shows. |
| [T1585 Establish Accounts](https://attack.mitre.org/techniques/T1585/) | **Partial fit, stated** | Registering a business sender ID under a misleading name is persona infrastructure in spirit, but the technique's sub-techniques cover social-media, email and cloud accounts, not carrier sender IDs. |

**The gap, stated.** ATT&CK has no technique for the **category of a registered sender ID** — that a
header can be genuinely registered, yet registered to send *offers*, which is S12's tell.

**Considered and rejected.**

- [T1417.002 Input Capture: GUI Input Capture](https://attack.mitre.org/techniques/T1417/002/) — the
  live page describes deceptive prompts produced by a malicious application (WebView overlays). S12's
  form is a standalone page in the phone's own browser; nothing is installed.
- [T1566.002 Phishing: Spearphishing Link](https://attack.mitre.org/techniques/T1566/002/) — initial
  access to an enterprise; nothing executes and the aim is information and money.

**What must NOT be copied.** No real tax authority, portal, header, refund cell, tax-ID format or
bank. `AX-ITRFND`, `VM-ITDEPT`, e-Filing and every host and number are invented; the form fields are
local and inert.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | List row preview and bubble; the address as written on the link card |
| "A branded header" | The thread title `AX-ITRFND`, a registered business sender ID |
| "Header anomalies" | Details: category Promotional, filed under Offers; the department writes from `VM-ITDEPT`, category Government |
| "Generic reference" | "Ref: REFUND/2026/APPROVED"; details' "Return or PAN quoted: None" |
| "Target domain" / "shortened link" | The link-details screen expands the short form to a host registered three days ago |
| "Urgency" | "Confirm bank before 18:00", "returned to the treasury at 18:00" |
| "Refund form asking identity, account, card and OTP" | Page one: name, tax ID, account; page two: card, expiry, code |
| "Open the known tax portal directly" | `verify_known_app` → e-Filing from bookmarks: no refund due |

### Enhanced synthetic storyline

At 12:54 a registered header, `AX-ITRFND`, tells the learner INR 12,480 is approved and must be
confirmed by 18:00. The phone has filed it under Offers, between a pizza deal and a sale. Under
Transactions sits the department's own `VM-ITDEPT` thread; on 12 August it said the return was
processed and no refund is due. A friend has just texted asking whether their refund ever came.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast from `AX-ITRFND` |
| Open | The list on Offers, with Transactions, Personal and Spam beside it |
| Inspect | The thread and link card; details; the department's own thread; link details |
| Branch | Open the address from link details; confirm the account; release with card and code; or close and open e-Filing |
| Verify | e-Filing, the helpline, the directory |
| Resolve | Report and submit nothing; or finish the form |

### Evidence the learner can discover (progressive)

1. The system line: "Filed under Offers by the Messages app."
2. Details: registered sender ID, category Promotional; the tax department writes from `VM-ITDEPT`,
   category Government.
3. The department's own thread: "No refund is due", with no address and no question.
4. Link details: the short form expands to a host registered three days ago, not the portal.
5. e-Filing: refund determined INR 0; refunds go only to the pre-validated account; never a card or
   code.

### Learner interaction journey

Notify → open → the header → the department's thread → back → close it and open the e-filing portal
yourself → open the portal from bookmarks and check the refund → report it as junk.

### Simulation surfaces

- `details`, `taxthread`, `linkinfo` (`SMS`).
- `refund` (`BROWSER`): two pages, each linked from the other.
- `taxportal` (`APP`); `taxcall` (`CALL`).

### Verification mechanism

`verify_known_app` opens e-Filing; `verify_known_number` calls the helpline;
`verify_trusted_directory` opens the directory. The site's help chat is `verify_in_message_contact`
(0); report/block alone is `REPORT_ONLY_WITHOUT_CHECK` (+1).

### Safe resolution

`resolve_report` / `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_sender →
safe_pivot → verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Open the address from link details | `open_link` | `RISKY_OPEN_REPLY` | −3 |
| Confirm the refund account | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Release the refund with card and code | `share_secret` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Finish the form at resolve | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`. The
refund site is also reachable from link details by a local "Load the page" link, so neither release
sits behind the scored open.

### Why the final simulation stays faithful

Every client element is present — the branded header, shortened link, generic reference, deadline,
the identity/account/card/OTP form, the known portal and the report resolution. The scene adds the
phone's own categorisation of the sender, which is the realistic way a registered header is told
apart from a government one.

---

## 3. S13 — Rating-Task Recruiter

### Client scenario (authoritative)

Specification page 101. SMS, **Medium**, **Malicious**, family *Task/job scam*, trigger *Greed +
commitment*. Canonical identity: family `investment_and_task_fraud`, triggers `greed` + `commitment`,
military flag **false**, level `medium`.

- **Stage 1 (Event).** "Remote role: earn INR 4,000/day rating products. Reply YES for instant
  joining."
- **Stage 2 (Open).** An unsolicited recruiter offers high pay for ratings and quickly asks for a
  deposit to unlock tasks.
- **Stage 3 (Inspect).** Unexpected contact, unrealistic earnings, no interview, personal number.
- **Stage 4 (Branch).** A task dashboard showing bonus earnings followed by a recharge demand.
- **Stage 5 (Verify).** Verify the employer through a separately found corporate site and known
  vacancy channel.
- **Stage 6 (Resolve).** Stop; report junk / block; do not pay to earn.

### MITRE ATT&CK alignment

| Technique | Fit | Why this maps |
| --- | --- | --- |
| [T1657 Financial Theft](https://attack.mitre.org/techniques/T1657/) | **Direct** | The objective is the deposit; the technique covers social engineering that deceives victims into sending money to accounts the adversary controls. |
| [T1660 Phishing (Mobile)](https://attack.mitre.org/techniques/T1660/) | **Supporting** | Unsolicited SMS delivery with a link to the task site. |
| [T1684.001 Social Engineering: Impersonation](https://attack.mitre.org/techniques/T1684/001/) | **Supporting** | "Priya, HR — Nexa Staffing" borrows the name of a real (fictional) company that has no such role. |
| [T1585 Establish Accounts](https://attack.mitre.org/techniques/T1585/) | **Partial fit, stated** | A recruiter persona is established, but on throwaway phone numbers, which the technique's sub-techniques do not cover. |

**The gap, stated.** ATT&CK has no technique for **rotating throwaway numbers** under one persona, nor
for recruiting a victim's bank account as a **payout account** that other money can move through.

**Considered and rejected.**

- [T1598 Phishing for Information](https://attack.mitre.org/techniques/T1598/) — the payout form
  collects an account, but the aim is money and mule onboarding, not reconnaissance for targeting.
- [T1566.002 Phishing: Spearphishing Link](https://attack.mitre.org/techniques/T1566/002/) — nothing
  executes; no enterprise access is sought.

**What must NOT be copied.** No real employer, job board, payee or task platform. Nexa Staffing, Task
Centre, "Priya", K SHARMA and every host and number are invented.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | Row preview and bubble, reassembled as `Remote role: <body>` |
| "Reply YES" | The app's suggested reply "YES" under the message, and "Reply YES from the list" at open |
| "Unexpected contact, personal number" | Unsaved-sender bar; details: ten-digit mobile, no header |
| "Unrealistic earnings, no interview" | The recruiter's second message; the company's careers page: every role has an interview |
| "Bonus earnings followed by a recharge demand" | The task centre: INR 800 bonus held until activation, and a INR 1,499 deposit |
| "Do not reply with personal data, deposit or recruit others" | The payout page (`−8`), the deposit sheet (`−8`), YES (`−3`) |
| "Separately found corporate site and known vacancy channel" | A search result for the company's own site and its JobsBoard listing |

### Enhanced synthetic storyline

Friday, a rating job from one number, now in Spam. Yesterday, "profile shortlisted" from another.
Today, from a third, INR 4,000 a day and "Reply YES", followed by "two of your three onboarding steps
are already done for you" and a link. The task centre shows the ticked steps, an INR 800 bonus held
until step 3, and step 3 is a payout account plus a refundable deposit to a named individual.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast from the number |
| Open | The list; yesterday's thread from another number beside it; Friday's in Spam |
| Inspect | The thread; details with all three conversations; link details |
| Branch | Tap YES; open the site (free); save the payout account; pay the deposit; or leave from details |
| Verify | The careers page, the office, the directory |
| Resolve | Report and pay nothing; or activate |

### Evidence the learner can discover (progressive)

1. The unsaved-sender bar and the Spam tab.
2. Details: three numbers under one signature in four days; the pay went up.
3. Link details: a six-day-old host, no company named.
4. The task centre: steps done "for you", a held bonus, a deposit to an individual's account.
5. The careers page found by search: no rating roles, never texts, never charges.

### Learner interaction journey

Notify → open → the header → the three conversations → leave this and look the company up yourself →
search for Nexa Staffing and open its careers page → report it as junk.

### Simulation surfaces

- `details`, `linkinfo` (`SMS`); `tasks` (`BROWSER`, two pages); `deposit` (`PAYSHEET`);
  `careers` (`BROWSER`, search and site); `officecall` (`CALL`).

### Verification mechanism

`verify_known_app` opens the careers search; `verify_known_number` calls the office number from the
site; `verify_trusted_directory` opens the directory. Asking "Priya" for the registration is
`verify_in_message_contact` (0).

### Safe resolution

`resolve_report` / `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_sender →
safe_pivot → verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Tap the suggested YES | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Save the payout account | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Pay INR 1,499 to activate | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Activate at resolve | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`. The
task site is opened by local navigation and its two releases are page links from the dashboard, so
neither is behind another scored control.

### Why the final simulation stays faithful

Unsolicited recruitment, unrealistic pay, no interview, a personal number, bonus-then-deposit, and an
employer checked through its own site: every client element is present. The scene adds the evidence a
Messages app keeps — conversations filed by number — and the suggested reply that makes answering the
easiest thing on the screen.

---

## 4. S14 — Emergency Recall Location Link

### Client scenario (authoritative)

Specification page 102. SMS, **Medium**, **Malicious**, family *Military smishing / location
collection*, trigger *Authority + urgency | FICTIONAL MILITARY CONTEXT*. Canonical identity: family
`operational_elicitation`, the two canonical trigger primitives the bank normalises that string to,
military flag **true**, level `medium`.

- **Stage 1 (Event).** "UNIT ALERT: Immediate recall. Confirm live location and ETA at
  recall.training.example."
- **Stage 2 (Open).** A spoofed sender announces an emergency recall and asks for current location via
  a link.
- **Stage 3 (Inspect).** Sender/header, absent authentication code, public link, request for live
  location.
- **Stage 4 (Branch).** A synthetic map form asking location, route and service number.
- **Stage 5 (Verify).** Contact the duty office through the approved directory and check the official
  recall channel.
- **Stage 6 (Resolve).** Submit nothing; report through unit security; block; one-line rationale.

### MITRE ATT&CK alignment

| Technique | Fit | Why this maps |
| --- | --- | --- |
| [T1598 Phishing for Information](https://attack.mitre.org/techniques/T1598/) | **Direct** | The objective is information — position, route, arrival time, service number — gathered through an electronic message rather than code. |
| [T1598.003 Phishing for Information: Spearphishing Link](https://attack.mitre.org/techniques/T1598/003/) | **Supporting** | The information is collected on a page reached by a link in a text. |
| [T1660 Phishing (Mobile)](https://attack.mitre.org/techniques/T1660/) | **Supporting** | SMS delivery to a handset. |
| [T1589 Gather Victim Identity Information](https://attack.mitre.org/techniques/T1589/) | **Supporting** | The service number field. |
| [T1684.001 Social Engineering: Impersonation](https://attack.mitre.org/techniques/T1684/001/) | **Supporting** | "UNIT ALERT" presents itself as the unit's alerting. |
| [T1591.001 Gather Victim Org Information: Determine Physical Locations](https://attack.mitre.org/techniques/T1591/001/) | **Partial fit, stated** | The technique is about an organisation's locations; S14 collects individual members' positions and routes, which reveal the organisation's movements only in aggregate. |

**The gap, stated.** ATT&CK has no technique for a **web page obtaining location through the
browser's site-permission prompt**.

**Considered and rejected.**

- [T1430 Location Tracking](https://attack.mitre.org/techniques/T1430/) — the live page describes a
  malicious or exploited **application** calling OS location APIs. S14 installs nothing; a page asks
  the browser.
- [T1636.004 Protected User Data: SMS Messages](https://attack.mitre.org/techniques/T1636/004/) —
  needs malware reading the message store.

**What must NOT be copied.** No real unit, formation, establishment, appointment, rank, roster,
recall procedure, alerting system, location, route or schedule. "Unit Falcon", its duty office, its
portal, `VM-FALCON` and exercise `RC-0812` are invented; the form's fields are empty and local.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | Row and bubble, reassembled as `UNIT ALERT: <body>`; the address on the link card |
| "Sender/header" | Details: unsaved mobile; unit alerts come from `VM-FALCON` |
| "Absent authentication code" | "Recall reference quoted: None", against the exercise's `RC-0812` |
| "Public link" | Link details: a public host registered today, no sign-in |
| "Map form asking location, route and service number" | The recall map (location via the browser prompt) and its form |
| "Duty office through the approved directory" | `verify_known_number` → the duty office |
| "Check the official recall channel" | `verify_known_app` → the Unit Portal's Alerts page: no active recall |
| "Report through unit security; block"; rationale box | `resolve_report` / `resolve_block`; the resolve panel's one-line reason |

### Enhanced synthetic storyline

At 15:45 an unsaved mobile texts "UNIT ALERT: Immediate recall", with a link and a threat to mark
absentees. Under Service sits the unit's real August recall exercise from `VM-FALCON`: a reference,
"acknowledge in the Unit Portal under Alerts", no address, nothing asked. The page wants the learner's
live position through the browser, or their service number, position, route and arrival time.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast from the number |
| Open | The list; the Service tab with the unit's own messages |
| Inspect | Thread; details; the unit's thread with the August comparison; link details |
| Branch | Open the address; Allow location; submit the form; or check Alerts in the portal |
| Verify | The duty office, the portal, the directory |
| Resolve | Report through unit security (with a reason); or confirm on the page |

### Evidence the learner can discover (progressive)

1. The unsaved-sender bar.
2. Details: a mobile, no unit sender ID, no reference, a link asking for position.
3. The unit's own thread: the August recall beside today's, row by row.
4. Link details: public host registered today.
5. The browser prompt itself: "Opened from: a link in a text message".
6. The portal's Alerts: no active recall. The duty office: nothing went out.

### Learner interaction journey

Notify → open → the header → messages from `VM-FALCON` → back → leave it and check Alerts in the Unit
Portal → call the duty office → report through unit security and share nothing.

### Simulation surfaces

- `details`, `unitthread`, `linkinfo` (`SMS`); `recall` (`BROWSER`, map and form);
  `geo` (`INSTALLER`, the browser's site-permission dialog); `unitapp` (`APP`); `dutycall` (`CALL`).

### Verification mechanism

`verify_known_number` calls the duty office; `verify_known_app` opens Alerts;
`verify_trusted_directory` opens the directory. Calling the number that sent the alert is
`verify_in_message_contact` (0).

### Safe resolution

`resolve_report` / `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_sender →
safe_pivot → verify_known_number → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Open the address | `open_link` | `RISKY_OPEN_REPLY` | −3 |
| Allow the site to use location | `share_location` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Confirm my recall (the form) | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Confirm the recall at resolve | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`. The
page is also opened by a local menu item, and the permission prompt and form are page links from the
map, so neither release is behind the scored open.

### Why the final simulation stays faithful

Every client element is present, including the rationale box. The scene adds the realistic
comparison a phone keeps — a genuine earlier recall in the same app — and makes the location release
the browser's own permission prompt.

---

## 5. S15 — Canteen Subsidy MMS QR

### Client scenario (authoritative)

Specification page 103. SMS, **Medium**, **Malicious**, family *Military-themed QR smishing*, trigger
*Familiarity + scarcity | FICTIONAL MILITARY CONTEXT*. Canonical identity: family `qr_code_phishing`,
the two canonical trigger primitives the bank normalises that string to, military flag **true**,
level `medium`.

- **Stage 1 (Event).** "Service family subsidy - scan today to activate INR 2,000 benefit."
- **Stage 2 (Open).** The MMS thread and poster image; the destination hidden in a QR code.
- **Stage 3 (Inspect).** Unknown number, generic eligibility, expiry pressure and QR target.
- **Stage 4 (Branch).** The QR inspector and synthetic eligibility form.
- **Stage 5 (Verify).** Check the known canteen/welfare portal or directory.
- **Stage 6 (Resolve).** Close; report junk and unit-themed impersonation; do not forward.

### MITRE ATT&CK alignment

| Technique | Fit | Why this maps |
| --- | --- | --- |
| [T1660 Phishing (Mobile)](https://attack.mitre.org/techniques/T1660/) | **Direct** | The live page names QR codes ("quishing") used to redirect users to a phishing website, delivered to a handset. |
| [T1684.001 Social Engineering: Impersonation](https://attack.mitre.org/techniques/T1684/001/) | **Supporting** | The picture borrows the unit canteen's name and colours. |
| [T1657 Financial Theft](https://attack.mitre.org/techniques/T1657/) | **Supporting** | The canteen card number and PIN are the means to spend the card. |
| [T1598.003 Phishing for Information: Spearphishing Link](https://attack.mitre.org/techniques/T1598/003/) | **Partial fit, stated** | The collection page is reached by a link, but inside a picture sent to a list rather than a message to a named target. |

**The gap, stated.** ATT&CK has no technique for **list delivery exposed by a group MMS** — the
recipient list with consecutive numbers that is S15's primary evidence.

**Considered and rejected.**

- [T1417.002 Input Capture: GUI Input Capture](https://attack.mitre.org/techniques/T1417/002/) —
  requires a malicious application's overlay; the card page is a standalone browser page.
- [T1566.002 Phishing: Spearphishing Link](https://attack.mitre.org/techniques/T1566/002/) — initial
  access; nothing executes.

**What must NOT be copied.** No real unit, formation, establishment, appointment, rank, canteen,
welfare body, card format or benefit. The
picture viewer draws a tile and describes the poster in words; no image file exists and the code
encodes nothing.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | Row preview and the text under the picture |
| "MMS thread and poster image" | The picture-message card (`subsidy_poster.jpg`, 212 KB) |
| "Unknown number" | Group details: the starter is unsaved; the canteen writes from `VM-FALCNT` |
| "Generic eligibility, expiry pressure" | "First 200 families", "closes at 20:00"; the page says "You are eligible" without asking who you are |
| "QR target" / "QR inspector" | The picture viewer reads the code and states its host before opening |
| "Eligibility form" | The subsidy page and its card-linking page |
| "Known canteen/welfare portal or directory" | `verify_known_app` → the Canteen app; `verify_known_number` → the canteen office |
| "Report junk and unit-themed impersonation; do not forward" | The resolve report tells unit security the canteen name is being used; "send it on" is the contradictory final; replying to all twelve is priced at the branch |

### Enhanced synthetic storyline

At 17:16 a picture message arrives from an unsaved number to twelve people. Two are colleagues —
Vikram has already asked whether the learner got it too. Eight are numbers 40011 to 40018, in order.
The poster offers INR 2,000 to the first 200 service families. The canteen's own sender has only ever
sent balances and opening times.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast from the number |
| Open | The list; the Service tab with the canteen's own messages |
| Inspect | Thread; group details and the twelve people; the picture viewer |
| Branch | Open the code; link the card with its PIN; reply to everyone; or open the canteen app |
| Verify | Canteen app, canteen office, directory |
| Resolve | Report and name the canteen misuse; or send it on |

### Evidence the learner can discover (progressive)

1. The system line: a reply goes to all twelve.
2. Group details: two saved colleagues, nine unsaved numbers, eight consecutive.
3. The canteen's own thread: text only, no picture, no code.
4. The picture viewer: the code's host is not the canteen app or portal.
5. The Canteen app: no subsidy running; PIN never asked for.

### Learner interaction journey

Notify → open → group details → all twelve people → back → leave it and open the canteen app → check
benefits → report it and tell unit security.

### Simulation surfaces

- `details` (two pages), `canteenthread` (`SMS`); `mms` (`VIEWER`); `subsidy` (`BROWSER`, two
  pages); `canteen` (`APP`); `canteencall` (`CALL`).

### Verification mechanism

`verify_known_app` opens the Canteen app; `verify_known_number` calls the canteen office;
`verify_trusted_directory` opens the directory. Asking the sender is `verify_in_message_contact` (0).

### Safe resolution

`resolve_report` / `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_qr →
safe_pivot → verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Open the address in the code | `scan_qr` | `RISKY_OPEN_REPLY` | −3 |
| Link the card with its PIN | `share_secret` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Reply to everyone | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Send it on at resolve | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`. The
picture viewer is opened by a local control on the picture card, and the subsidy site is reachable
both from the viewer's scored open and from a local menu item, so the card PIN release is never
behind the `−3`.

### Why the final simulation stays faithful

MMS poster, unknown number, generic eligibility, expiry pressure, a QR inspector, an eligibility
form, the canteen app and directory, and a report that names the impersonation: all present. The
scene adds the group-MMS recipient list, which is how a handset shows that a message went to a list.

---

## 6. Forms, inputs and data handling

**Four of the five scenes accept typing, each because the screen is about refusing to.** S12's refund
site takes a name, a tax ID and a bank account, then a card number, expiry and code; S13's payout page
takes a name, account and payment handle, and its payment sheet a UPI PIN; S14's recall form takes a
service number, position, route and arrival time; S15's card page takes a canteen card number and
PIN. **S11 has no field anywhere** — even its overshare is an authored chip. The rules every field
obeys:

- **Local.** The value lives in `useLocalForm` state inside the component that draws it.
- **Ephemeral.** Leaving a screen unmounts it; browser pages are keyed on the page.
- **Never transmitted.** No `fetch`, no `<form>`, no submit event. Each commit control carries only a
  neutral id and an optional asset id.
- **Never persisted.** No `localStorage`, `sessionStorage`, IndexedDB, cookie or cache holds anything
  typed.
- **Never logged.** No console output or event payload; the engine's `METADATA_ALLOWLIST` rejects any
  unknown metadata key, and the ledger stores no action code or control id.
- **No autofill surface.** `autoComplete="off"` and neutral names (`f0`, `f1`, …); PINs and codes are
  `FIELD_KIND.SECRET`, masked by CSS, never `type="password"`.
- **No form submission.** Pages move by local links; only the page-scoped scene control reaches the
  engine, disabled only by incomplete input, never by risk.
- **Deterministic.** The same control always produces the same event.
- **Not decorative.** Every screen that shows a release has the control that commits it.

No real credential, card, account, tax ID, service number, location, route, PIN, code, payment or
health detail exists anywhere in S11–S15.

## 7. What is asserted, and where

| Claim | Test |
| --- | --- |
| Every S11–S15 control resolves to a legal transition on its own pinned definition; safe paths score ten; unsafe routes score as recorded | `backend/tests/sceneAffordance.test.js` |
| The same routes, stale views, wrong-stage controls, cross-run codes, retries and reloads through a real MongoDB transaction | `backend/tests/smsS11S15Engine.test.js` (isolated DB) |
| No S11–S15 branch shape repeats any of the eighty-five earlier scenes; each of the fifteen SMS scenes has a unique decision home | `frontend/src/simulation/sceneModel.test.js` |
| Every scored branch surface **and page** is reachable without spending the branch | `sceneModel.test.js`, `SceneScenariosSmsC.test.jsx` |
| S14 and S15 name no rank, formation or operational term, nor their trigger words | `sceneModel.test.js` |
| Only S11 offers `reject_ignore` | `sceneModel.test.js`, `sceneAffordance.test.js` |
| Nothing typed reaches the wire or storage; no `href`, `src`, `iframe`, `form` or media element | `SceneScenariosSmsC.test.jsx`, `SceneContainment.test.jsx` |
| This document covers every authored scenario and cites every technique it names | `sceneResearch.test.js` |

## 8. Findings during verification

1. **A legitimate reply is a `safe_pivot`.** On a legitimate item the engine resolves `reply` to
   `UNSAFE_EXTERNAL_ACTION`; S11's "Reply 1" and "Reply 2" therefore submit `safe_pivot`, which the
   engine resolves to `CORRECT_USE`. The overshare submits `submit_data`, which resolves to
   `UNSAFE_EXTERNAL_ACTION` (−4). No new intent was needed and no scoring rule changed.
2. **S15's `−8` was first reachable only through the `−3`.** The subsidy site opened only from the
   picture viewer's scored "Open the address in the code", so the card-PIN release sat behind another
   scored control — the IMMERSIVE-009 defect. It was caught while writing this record, before any
   test run, and fixed by a local menu item that opens the same site (the S08 pattern);
   `sceneModel.test.js`'s reachability walk now proves the card page is reachable with the branch
   unspent.
3. **S14 does not use sender-ID spoofing into the genuine thread**, because that is the bank's S18
   ("Bank Header Thread Hijack"). S14's comparison is a genuine earlier recall instead.
4. **S11's resolve banner** initially offered two correct resolutions; the guard that every banner
   pairs a right and a wrong answer caught it, and "Report the clinic's messages as junk" was moved
   inline.
5. **Recorded, not changed (pre-existing):** one scored decision per stage; consequence banners are
   session-only; result cards show the bank's stored sender.
