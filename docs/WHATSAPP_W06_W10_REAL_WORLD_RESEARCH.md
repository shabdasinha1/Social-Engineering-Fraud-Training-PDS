# WhatsApp W06–W10 — real-world research and storyline reconstruction

**Task:** IMMERSIVE-003B
**Scope:** WhatsApp W06, W07, W08, W09, W10 only. W01–W05 are unchanged, W11–W25, Instagram, Email and SMS are untouched.
**Status:** design record for the five scenes authored by this task.
**Companion:** [`WHATSAPP_W01_W05_REAL_WORLD_RESEARCH.md`](WHATSAPP_W01_W05_REAL_WORLD_RESEARCH.md) — the same method, applied to the first batch.

---

## 0. How this document was produced, and what it is allowed to change

### 0.1 The transformation

```
REAL-WORLD BEHAVIOUR
      |   observed in published threat intelligence
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
operational. Every host is `*.training.example`; every number is in the reserved
`+91 00000 xxxxx` range; every page, form, call, gallery and settings screen is local,
inert and offline.

### 0.2 Source of the threat intelligence

Primary source: **MITRE ATT&CK, Enterprise and Mobile matrices, website version v19.2**
(current release, 28 April 2026 — <https://attack.mitre.org/versions/>). Every technique
below was read from the live technique page rather than recalled, and the ID, tactic,
technique version and last-modified date are recorded so a later reviewer can check the
same page.

Two version notes for anyone re-reading older material. `T1656 Impersonation` no longer
exists as a top-level technique and now resolves to **T1684.001**. And ATT&CK gained a
technique in May 2025 that did not exist when the first batch was written —
**T1676 Linked Devices** — which is the exact mechanism W10 is about.

### 0.3 Interpretation rule

ATT&CK is used as a **behavioural reference, not a requirement**. A mapping is recorded
only where the technique's own description actually describes what the scenario does. Where
it does not, the section says so in as many words rather than reaching for the nearest
plausible ID: W07 has no mapping, and that is stated rather than quietly omitted.

The direction of the work is always `REALISTIC THREAT PATTERN -> AUTHORED STORY ->
REALISTIC WHATSAPP INTERACTION`, never `MITRE TECHNIQUE -> artificial story`.

### 0.4 What this document may and may not change

| Thing | May IMMERSIVE-003B change it? |
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

The DATA-003 generator captures the client's notification with a non-greedy match that
stops at the **first apostrophe** (`/Dashboard notification:\s*'([\s\S]+?)'/`). Any client
sentence containing one loses everything after it. **Twelve of the hundred scenarios are
affected** across all four platforms — W06, W09, W15, W20, W22, W25, I15, I18, E06, E12,
E18, E25 — and the worst is W09, whose stored body is literally `Can`, from
"Can't talk. Buy four gift cards...".

Two of the twelve are in this batch. This task could not fix them: regenerating rewrites
the production synthetic bank and every platform file in it, which IMMERSIVE-003B was
explicitly forbidden to touch. So:

- the bank is **left exactly as it is**, and its fingerprint is unchanged;
- the W06 and W09 scenes state the client's own full sentence in the conversation;
- `sceneModel.test.js` names those two scenarios explicitly and asserts that the scene text
  **starts with** the stored string, so a paraphrase still fails and fixing the bank breaks
  the test and sends whoever fixed it to the workaround.

The **notification toast** at the notify stage is server-driven and still shows the stored
body, so a learner sees the truncated text there. That is a real, visible defect and it is
recorded as a known limitation rather than worked around twice.

---

## 1. W06 — Unit Clerk ID Photo Request

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Unit Clerk ID Photo Request |
| Disposition | Malicious |
| Level | Easy |
| Family (client) | Military impersonation / information collection |
| Canonical family | `identity_data_harvesting` |
| Trigger (client) | Authority \| FICTIONAL MILITARY CONTEXT |
| Canonical triggers | `authority` |
| Military flag | Yes |
| End state | No image leaves the device; the event is marked as protected-information refusal. |
| Decision signal (stage 3) | The request bypasses the approved administrative channel and asks for sensitive identity material in chat. |

### MITRE ATT&CK alignment

| Technique | Name | Matrix / tactic | Version | Last modified |
| --- | --- | --- | --- | --- |
| [T1598.001](https://attack.mitre.org/techniques/T1598/001/) | Phishing for Information: Spearphishing Service | Enterprise / Reconnaissance | 1.0 | 24 October 2025 |
| [T1684.001](https://attack.mitre.org/techniques/T1684/001/) | Social Engineering: Impersonation | Enterprise / Stealth | 1.0 | 12 May 2026 |
| [T1589](https://attack.mitre.org/techniques/T1589/) | Gather Victim Identity Information | Enterprise / Reconnaissance | — | — |

### Why this maps

T1598.001 is information sought **through a service the organisation does not control** —
its own description is "adversaries send messages through various social media services,
personal webmail, and other non-enterprise controlled services" in order to "trick targets
into divulging information". That is precisely the shape here: the request is not for money
or a credential, it is for a document, and the whole attack is that it arrives on WhatsApp
instead of at a counter.

T1684.001 supplies the pressure. Its description names impersonating "a trusted person or
organization", explicitly includes internal functions such as IT support, help desk and HR,
and notes the use of urgency language "to push the victim to act quickly". The scenario's
canonical trigger is `authority` and its stage text says the request "bypasses the approved
administrative channel", which is the same behaviour stated in the client's vocabulary.

T1589 is the objective rather than the method: a service card carries name, service number,
rank, unit, date of birth and a photograph, which is the identity information the technique
describes collecting.

### What must NOT be copied

No real unit, formation, establishment, appointment, crest, service-number format,
personnel-record system or administrative procedure. "Unit Falcon", the orderly room, the
support desk and every number are invented. The drawn crest is a generic roundel with no
resemblance to any real insignia, and the service card in the gallery is a drawn rectangle
with grey bars where text would be.

### Client requirements preserved

Stage 4's "media composer preloaded with a synthetic service-card image" is implemented
literally: the device's own attachment picker, with the service card already staged and a
Send control under it. Stage 5's verification route — "contact the unit clerk through the
approved internal directory or in person" — is the trusted-directory row and the support
desk call. Stage 6's resolution — "cancel the upload; report the impersonation; block the
account" — is the resolve stage's three controls.

### Enhanced synthetic storyline

An unsaved number opens with a greeting, states that the annual personnel database audit is
running, and sends an official-looking notice image. Then it asks for both sides of the
service ID. When the learner does not answer immediately, it applies two kinds of pressure
in sequence — a deadline, then social proof — and if the learner reaches the verify stage
it pre-empts the orderly room by claiming it is cleared to collect the documents itself.

### Conversation progression

1. `08:11` — "Good morning. This is the unit clerk desk."
2. `08:12` — the audit claim, then the crest image.
3. `08:13` — the request, then "Front and back, both sides readable."
4. `branch` — "the return goes up at 09:00", then "Everyone else in your company has already sent theirs."
5. `verify` — "no need to go through the orderly room, that will take days."
6. after a release — "Also send your pay account number so I can match the record."

### Evidence the learner can discover (progressive)

- **Contact info → About**: not saved, on WhatsApp since this week, no business account, and a note that a display name is chosen by whoever owns the number.
- **Contact info → Groups in common**: none — and the orderly room group does not contain it.
- **The notice, opened**: no reference number, no issuing office, no signature.
- **Trusted directory**: the orderly room's real number is different, and its row states that identity documents are collected in person only.
- **The gallery**: both sides of the card together carry everything needed to open an account in the learner's name.

### Learner interaction journey

`notification → chat list → thread → contact sheet (3 tabs) → notice viewer → back →
attachment tray → back → directory / support-desk call → resolve`

### Simulation surfaces

Contact sheet (`CONTACT`, 3 tabs), image viewer (`VIEWER`), attachment gallery (`VIEWER`,
3 items), support-desk call (`CALL`), trusted directory overlay.

### Verification mechanism

`verify_known_number` on the approved support-desk number. The desk states that no audit is
running, that identity documents are only taken at the counter, and asks for the number so a
warning can be circulated.

### Safe resolution

Decline in the composer (`safe_pivot`, +3), verify with the desk (`TRUSTED_VERIFY`, +3),
then `resolve_report` (+2). With `ITEM_OPEN` and `INSPECT_CONTEXT` this is the full ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Send the selected document (on the gallery) | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Call this number | `call_number` | `RISKY_OPEN_REPLY` | −3 |
| "Which office are you calling from?" | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Reply from the preview | `reply` (open stage) | `PREMATURE_REPLY` | −1 |

### Scoring / event mapping (unchanged)

`NOTIFY_SEEN 0`, `ITEM_OPEN 0` / `PREMATURE_REPLY −1`, `INSPECT_CONTEXT +2`,
`SAFE_PIVOT +3` / `RISKY_OPEN_REPLY −3` / `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`,
`TRUSTED_VERIFY +3` / `REPORT_ONLY_WITHOUT_CHECK +1` / `VERIFY_THROUGH_MESSAGE 0`,
`RESOLVE_CORRECT +2` / `CONTRADICTORY_UNSAFE_FINAL −4`.

### Why the final simulation stays faithful

Every scored control resolves against the pinned definition through the real engine, which
`backend/tests/sceneAffordance.test.js` proves. The scene adds conversation, screens and
evidence; it changes no classification, no stage, no point value and no client sentence
except by extending the truncated notification body recorded in §0.5.

---

## 2. W07 — Expected Family Document

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Expected Family Document |
| Disposition | **Legitimate** |
| Level | Easy |
| Family (client) | Legitimate document exchange |
| Canonical family | `legit_coordination_request` |
| Trigger (client) | Familiarity |
| Canonical triggers | `familiarity` |
| Military flag | No |
| End state | Viewer closes normally and the chat is marked read. |
| Decision signal (stage 3) | The file is expected, the sender matches the saved contact, and the preview requests no sign-in or installation. |

### MITRE ATT&CK alignment

**There is none, and none has been invented.**

ATT&CK catalogues adversary behaviour. A cousin sending the invitation PDF she was asked
for two days earlier is not adversary behaviour, and mapping it to a phishing technique
because it involves an attachment would be exactly the `MITRE TECHNIQUE -> artificial story`
inversion this batch was told not to perform.

**Closest defensible behavioural reference:** the discrimination problem, not a technique.
The client's own scoring prices it — `FALSE_REPORT_BLOCK` is −4, more than half the marks
available for the scenario — because a workforce that reports everything is as expensive as
one that reports nothing, and the reporting channel that gets flooded is the one that has to
work when something really is wrong.

### Client requirements preserved

Stage 4's "inert PDF preview showing only event details" is the document viewer, and its
expected safe behaviour — "use the normal in-app path only after the details match the known
context; do not switch to an untrusted channel" — is implemented as the `safe_pivot` control
on the file card, with the untrusted channel present as a real temptation. Stage 5's route,
"use the existing thread context; optional known-number call if anything differs", is the
saved-number call. Stage 6's "preview the PDF and retain it; do not report or block the
sender" is `resolve_retain` / `resolve_continue`.

### Enhanced synthetic storyline

A family thread with a fortnight of ordinary conversation. Last Sunday the cousin mentioned
the wedding date; the learner asked her to send the card when it was printed, for a leave
application. Today it arrives, as a one-page PDF, quoted against that request.

### Conversation progression

1. `LAST SUNDAY` — the date is fixed; the learner replies; small talk.
2. `13:02` — **the learner's own request**, outgoing, with read ticks.
3. `13:24` — "It came back from the printer this morning", quoting that request.
4. `13:25` — the PDF, then the client's headline sentence.
5. `branch` — the venue, unprompted and consistent.
6. `verify` — "Tell me by Sunday so Ma can give the count."

### Evidence the learner can discover (progressive)

- **The learner's own message**, three beats above the file, asking for exactly this.
- **Contact info → About**: saved six years, number never changed.
- **Contact info → Groups in common**: four, including a wedding group.
- **Contact info → Media**: 198 photos and 16 documents since 2018.
- **The document, opened**: date, time, venue, dress, and an RSVP number that is the saved contact's own — no sign-in, no payment, no download.

### Learner interaction journey

`notification → chat list → thread (with the learner's own request visible) → contact sheet
(3 tabs) → document viewer → back → saved-number call → resolve`

### Simulation surfaces

Contact sheet (`CONTACT`, 3 tabs), document viewer (`VIEWER`), app listing for the reader
(`VIEWER`), saved-number call (`CALL`).

### Verification mechanism

`verify_known_number` on the number already in the contact list. She confirms she sent it,
repeats the venue, and asks for nothing. **Verification here confirms legitimacy** — which is
the half of verification a threat-only simulator never teaches.

### Safe resolution

`safe_pivot` on the file card (`CORRECT_USE`, +3), the known-number call
(`TRUSTED_VERIFY`, +3), then `resolve_retain` (+2). Full ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Delete the file without opening it | `reject_ignore` | `NEEDLESS_REJECT_IGNORE` | −2 |
| Install PDF Reader Pro | `attempt_install` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Share my live location | `share_location` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Report / block the sender | `report` / `block` | `FALSE_REPORT_BLOCK` | −4 |
| Report or block at resolve | `resolve_report` / `resolve_block` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

The reader listing is the sharper of the two −4 routes, and it is placed deliberately: it is
reached **from the document viewer**, so it is found by a learner who has already satisfied
themselves the file is safe and stopped paying attention. The file is safe. The install is
not. A learner taught only "attachments are dangerous" gets the wrong half of that.

### Scoring / event mapping (unchanged)

`NOTIFY_SEEN 0`, `ITEM_OPEN 0` / `PREMATURE_REPLY −1`, `INSPECT_CONTEXT +2`,
`CORRECT_USE +3` / `NEEDLESS_REJECT_IGNORE −2` / `UNSAFE_EXTERNAL_ACTION −4`,
`TRUSTED_VERIFY +3` / `FALSE_REPORT_BLOCK −4` / `VERIFY_THROUGH_MESSAGE 0`,
`RESOLVE_CORRECT +2` / `CONTRADICTORY_UNSAFE_FINAL −4`.

### Why the final simulation stays faithful

Same guarantee as W06: every control is resolved through the real engine against the pinned
definition. The legitimate scenario is given **more** conversation, evidence and surface
depth than its malicious neighbours, not less, so that length can never become the answer —
the rule W03 established and this scene follows.

---

## 3. W08 — Festival Reward QR

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Festival Reward QR |
| Disposition | Malicious |
| Level | Easy |
| Family (client) | Prize scam / QR phishing |
| Canonical family | `qr_code_phishing` |
| Trigger (client) | Greed + scarcity |
| Canonical triggers | `greed`, `scarcity` |
| Military flag | No |
| End state | The claim is rejected locally and the forwarded item is flagged as deceptive. |
| Decision signal (stage 3) | The reward is unsolicited, scarce, and the QR hides a synthetic credential/payment site. |

### MITRE ATT&CK alignment

| Technique | Name | Matrix / tactic | Version | Last modified |
| --- | --- | --- | --- | --- |
| [T1660](https://attack.mitre.org/techniques/T1660/) | Phishing | Mobile / Initial Access | 1.2 | 12 May 2026 |
| [T1583.001](https://attack.mitre.org/techniques/T1583/001/) | Acquire Infrastructure: Domains | Enterprise / Resource Development | — | — |
| [T1657](https://attack.mitre.org/techniques/T1657/) | Financial Theft | Enterprise / Impact | 1.2 | 12 May 2026 |

### Why this maps

T1660 is the mobile phishing technique and it names both halves of this scenario in its own
description: "quishing" — QR codes used to redirect users to phishing websites — and
distribution of malicious links "through SMS, WhatsApp, and various social media platforms".
It is the Mobile matrix's technique rather than Enterprise
[T1566](https://attack.mitre.org/techniques/T1566/) because the delivery, the camera, the
browser and the victim are all the phone.

T1583.001 is the claim host: registered six days ago, not the retailer's domain, and named
in the decoded result so the learner can compare it with the brand in the message. T1657 is
the objective — card details and a bank one-time code, which its description covers as
financial theft through social engineering.

### What must NOT be copied

No real retailer, brand, festival promotion, voucher scheme, payment processor or domain.
"Sahyog Mart" is invented, its app is a local screen, and the claim host is
`w08.training.example` as the pinned scenario asset states it.

### Client requirements preserved

Stage 4's "local QR inspector and then a claim form" is implemented as both: the inspector
decodes locally at the inspect stage, and the claim form is a two-page browser flow behind
it. Stage 5's route — "check the retailer's known app/site from the Trusted Directory" — is
the retailer app surface. Stage 6's "close the QR flow; report the message; do not forward
it" is the resolve stage, with forwarding present as a scored temptation at branch.

### Enhanced synthetic storyline

A twenty-two person building group that normally carries water-tanker and lift notices. A
chain message arrives, forwarded many times, with a QR and a counter. Two neighbours say it
worked. One asks whether it is genuine. The person who posted it did not write it and says
so — "my cousin sent it, he is in Pune."

### Conversation progression

1. `YESTERDAY` / `07:05` — the group being an ordinary building group.
2. `07:19` — the forwarding label, the offer, the QR, the counter at twelve.
3. `07:26` – `07:34` — two neighbours claim success, one doubts, the poster deflects.
4. `branch` — "Only 6 left now, hurry."
5. `verify` — "It asked me for card details at the end, is that normal? I closed it."

### Evidence the learner can discover (progressive)

- **The forwarding label** — forwarded through at least five chats before this one.
- **Group info → This message**: the number it reached the group from is not saved, not in the group and not known to anyone here.
- **Group info → Participants**: twenty-two neighbours; nobody works for the retailer.
- **The QR, decoded**: a host registered six days ago that is not the retailer's site, on a connection that is not secure.
- **The claim page**: a "free" voucher that wants a card number, then a bank one-time code.
- **The retailer's own app**: no voucher campaign, and a scam notice posted two days ago.

### Learner interaction journey (cross-surface)

`notification → chat list → group thread → QR inspector → back → group info (3 tabs) →
[optionally] browser: claim → OTP → back → retailer app → resolve`

### Simulation surfaces

Group info (`GROUP`, 3 tabs), QR inspector (`VIEWER`), claim site (`BROWSER`, 4 pages, two
of them with real fields), retailer app (`APP`).

### Verification mechanism

`verify_known_app` — the retailer's own app, opened from the app list rather than from the
message. Its offers screen carries no voucher campaign and its notice says the company never
asks for card or OTP details to give one.

### Safe resolution

`safe_pivot` in the composer (+3), the retailer app (`TRUSTED_VERIFY`, +3), then
`resolve_report` (+2). Full ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Confirm and release my voucher (on the OTP page) | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Scan the code | `scan_qr` | `RISKY_OPEN_REPLY` | −3 |
| Forward it to my family group | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Reply from the preview | `reply` (open stage) | `PREMATURE_REPLY` | −1 |

**Improvement on W02's known limitation.** The client prices two depths here — scanning at
−3 and releasing card details at −8 — but the engine takes exactly one decision per stage.
In W02 the only route to the form ran through a scored control, so opening the page consumed
the branch and the −8 route could not be reached in the same run. Here the walk to the claim
page is **local navigation** from the decoded result ("Open the address the code points to")
and only the commit is scored, so both depths are genuinely reachable and neither half of
the scenario's scoring is dead.

### Scoring / event mapping (unchanged)

Identical table to W06.

### Why the final simulation stays faithful

The decoded target and the claim host both come from the pinned `qr_payload` and
`browser_page` assets rather than from the scene, and the forwarding label and origin number
are the bank's own `sender` record used as what it is. Asserted by `sceneModel.test.js`.

---

## 4. W09 — Compromised Colleague Gift Cards

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Compromised Colleague Gift Cards |
| Disposition | Malicious |
| Level | **Medium** |
| Family (client) | Compromised-contact fraud |
| Canonical family | `payment_diversion` |
| Trigger (client) | Authority + urgency \| FICTIONAL MILITARY CONTEXT |
| Canonical triggers | `authority`, `urgency` |
| Military flag | Yes |
| End state | Known-channel verification shows the colleague did not send the request. |
| Decision signal (stage 3) | A genuine account can be compromised; gift-card codes and refusal of voice confirmation are strong warning signs. |

### MITRE ATT&CK alignment

| Technique | Name | Matrix / tactic | Version | Last modified |
| --- | --- | --- | --- | --- |
| [T1586.002](https://attack.mitre.org/techniques/T1586/002/) | Compromise Accounts: Email Accounts | Enterprise / Resource Development | 1.1 | 12 May 2026 |
| [T1657](https://attack.mitre.org/techniques/T1657/) | Financial Theft | Enterprise / Impact | 1.2 | 12 May 2026 |
| [T1684.001](https://attack.mitre.org/techniques/T1684/001/) | Social Engineering: Impersonation | Enterprise / Stealth | 1.0 | 12 May 2026 |

### Why this maps

T1586.002 is recorded as a **partial fit, and deliberately so.** Its mechanism is exactly
this scenario's — its description reads "utilizing an existing persona with a compromised
email account may engender a level of trust in a potential victim if they have a
relationship with, or knowledge of, the compromised persona" — but the sub-technique names
**email** accounts, and this is a messaging account. The behaviour is the same and the
sub-technique's scope is narrower than the scenario, so it is cited with that stated rather
than presented as exact.

T1657 names business email compromise explicitly as a campaign type where victims are
"deceived into sending money to financial accounts controlled by an adversary". The
gift-card variant is the low-value entry form of it: the FBI's 2025 IC3 report counts 24,768
BEC complaints and $3.05bn in losses. T1684.001 is the delivery — impersonating "a known
sender such as an executive, colleague, or third-party vendor", with urgency language "to
push the victim to act quickly".

### What must NOT be copied

No real appointment, unit, visitor programme, canteen, gift-card brand or payment rail. The
colleague, the duty office and the store are invented, and the store screen cannot buy
anything.

### Client requirements preserved

Stage 4's "gift-card purchase mock followed by an image/code composer" is the store surface
and the till; the code composer is present as the `share_secret` reply. Stage 5's route —
"call the colleague through the known directory or confirm with the duty office" — is both,
and both are implemented as calls. Stage 6's "stop the transaction; report the
compromised-account message and alert the verified colleague" is the resolve stage.

### Enhanced synthetic storyline

**The hardest scenario in the batch, because every identity check comes back clean.** The
number is saved and correct. There is a year of real duty conversation above the request.
Nine groups in common. The account is not an impostor's — it is the colleague's, and someone
else is using it.

So the evidence is entirely **behavioural**: the register changes mid-thread and never
changes back, the request is for a payment instrument that cannot be reversed, secrecy is
asked for, and voice is refused pre-emptively. A learner who checks identity here gets the
right answer to the wrong question.

### Conversation progression

1. `LAST WEEK` — an ordinary duty exchange, in the colleague's normal register.
2. `11:31` – `11:38` — the learner asks about the visitor programme; a two-word reply.
3. `14:02` — the request, then denominations, then "photograph the back of each card".
4. `branch` — "cannot take calls", then "do not discuss this with the adjutant".
5. `verify` — a typing strip, then "Have you got them?"

### Evidence the learner can discover (progressive)

- **Contact info → About**: everything genuine — *except* a security code that changed at 13:41, twenty-one minutes before the request.
- **Contact info → This thread**: money has never been mentioned in two years; 38 voice calls; no call ever refused before.
- **The store**: gift-card value behaves like cash and cannot be stopped, traced or returned once a code has been viewed.
- **The trusted directory**: purchases are raised through the duty office, never by personal request.

### Learner interaction journey

`notification → chat list → thread → contact sheet (3 tabs, all clean) → [optionally] store
→ till → back → saved-number call → resolve`

### Simulation surfaces

Contact sheet (`CONTACT`, 3 tabs), gift-card store (`APP`), payment sheet (`PAYSHEET`, with
a local PIN field), colleague call (`CALL`), duty-office call (`CALL`).

### Verification mechanism

`verify_known_number` on the saved number — **the thing the message told the learner not to
do.** He answers. He has been in the visitors brief since one o'clock, his phone has been in
his pocket, and he did not send it.

### Safe resolution

`safe_pivot` in the composer (+3), the saved-number call (`TRUSTED_VERIFY`, +3), then
`resolve_report` (+2). Full ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Pay INR 8,000 (on the till) | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| "Sending the codes now, I have not told anyone." | `share_secret` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| "On my way to the canteen now sir." | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Reply from the preview | `reply` (open stage) | `PREMATURE_REPLY` | −1 |

Both −8 routes are reachable without spending the branch on the other, for the same reason
as W08: the store and the till are local navigation, and only the commit is scored.

### Scoring / event mapping (unchanged)

Identical table to W06.

### Why the final simulation stays faithful

The contact sheet is deliberately clean because the client's own decision signal says the
account is genuine. Nothing in the scene contradicts the bank; the security-code row is the
one piece of evidence that is consistent with both a compromise and an ordinary reinstall,
and the sheet says so.

---

## 5. W10 — Survey Device-Link QR

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Survey Device-Link QR |
| Disposition | Malicious |
| Level | **Medium** |
| Family (client) | Linked-device takeover / QR deception |
| Canonical family | `account_takeover_authorisation_abuse` |
| Trigger (client) | Convenience + authority |
| Canonical triggers | `convenience`, `authority` |
| Military flag | No |
| End state | Pending device is rejected and the mock account remains under learner control. |
| Decision signal (stage 3) | Linked-device QR codes authorize another device; surveys do not need account linking. |

### MITRE ATT&CK alignment

| Technique | Name | Matrix / tactic | Version | Created / modified |
| --- | --- | --- | --- | --- |
| [T1676](https://attack.mitre.org/techniques/T1676/) | Linked Devices | Mobile / Collection, Persistence | 1.0 | created 19 May 2025 |
| [T1660](https://attack.mitre.org/techniques/T1660/) | Phishing | Mobile / Initial Access | 1.2 | 12 May 2026 |

### Why this maps

**T1676 is an exact fit, and it is the newest technique in either matrix used by this
project.** Its description is the scenario: adversaries "exploit the linked devices feature
in messaging applications to register victim accounts on attacker-controlled devices,
enabling account persistence, information collection, and unauthorized message sending". It
names WhatsApp and Signal by name, and it names the delivery — "adversaries may use Phishing
techniques to trick the user into scanning a quick-response (QR) code". Its one listed
mitigation (M1011 User Guidance) is "avoid scanning suspicious QR codes or clicking
suspicious links masquerading as device-linking instructions", which is the safe behaviour
the client's stage 4 asks for, and its detection (DET0716) is the OS notification that an
account has been linked to a new device — the pending row this scene puts on screen.

T1660 is the delivery channel, as in W08.

**Real-world instance.** Microsoft Threat Intelligence reported the Russian actor **Star
Blizzard / COLDRIVER** using this exact mechanism in a campaign observed from mid-November
2024 and published on 16 January 2025: targets were sent to a page asking them to scan a QR
code to "join a WhatsApp group", where the code was in fact WhatsApp's own device-linking
credential, giving the operators access to the account's messages. ATT&CK now carries T1676
on that group ([G1033](https://attack.mitre.org/groups/G1033/), v2.0, 31 July 2026). This
scenario moves the delivery inside WhatsApp itself, where a support account is more
plausible than an email — the mechanism is the documented one, the pretext is not copied.

### What must NOT be copied

No real campaign, actor, target set, lure page, group name or infrastructure, and no part of
the Star Blizzard pretext. The scenario's own pretext — a service-quality survey with a
recharge — is invented, and the "WhatsApp Survey Desk" is an ordinary unsaved number, which
is itself one of the tells.

### Client requirements preserved

Stage 4's "faithful local Linked Devices screen with a pending link confirmation" is
implemented as a `SETTINGS` surface with exactly that. Stage 5's route — "open Settings >
Linked Devices independently and compare the request origin" — is a separate control that
reaches the same screen by the learner's own route. Stage 6's "cancel linking; report/block
the sender; review and remove unknown linked devices" is the resolve stage.

### Enhanced synthetic storyline

An unsaved number opens as the "WhatsApp service quality desk", offers a two-minute survey
with a small recharge, and sends a QR with step-by-step instructions to open Settings >
Linked Devices and scan it. When the learner hesitates it reassures — "this does not give us
access to anything" — then applies a deadline, then offers to stay on chat and guide them
through it.

### Conversation progression

1. `13:44` — the survey pretext and the incentive.
2. `13:50` — the client's headline sentence, then the QR with the linking instructions.
3. `branch` — "It does not give us access to anything", then "the survey slot expires at 14:30".
4. `verify` — "I can stay on chat and guide you through the steps."
5. after a link — "Please do not remove the linked device for 24 hours."

### Evidence the learner can discover (progressive)

- **Contact info → About**: not an official account, not a business account, on WhatsApp this month — and a note that an official account carries a verified badge and cannot be an ordinary mobile number.
- **The QR, decoded**: not a web address at all. A device-linking credential, generated by a browser session eleven minutes ago, granting read and send on every chat.
- **Settings → Linked Devices → Waiting for confirmation**: Chrome on Windows, approximately 1,900 km away, **requested at 13:39 — before the message arrived**.
- **Settings → What linking does**: a linked device can read every conversation, send as you, stay connected while the phone is offline, and be noticed only by looking at this screen.

### Learner interaction journey

`notification → chat list → thread → QR inspector → back → contact sheet → back →
Settings > Linked Devices (by the learner's own route) → resolve`

### Simulation surfaces

Contact sheet (`CONTACT`, 2 tabs), QR inspector (`VIEWER`), Linked Devices
(`SETTINGS`, 2 tabs, carrying both the pending row and the confirm control), support-desk
call (`CALL`).

**The same screen carries the unsafe control and the evidence that condemns it**, reached
two different ways: the message's route pushes it with the pending link ready to confirm,
and the learner's own route through settings shows what is actually being asked. That
symmetry is the scenario.

### Verification mechanism

`verify_known_app` — opening Settings > Linked Devices through the app rather than through
the message. The pending request predates the conversation, which is the single fact that
settles it.

### Safe resolution

`safe_pivot` in the composer (+3), Settings > Linked Devices opened independently
(`TRUSTED_VERIFY`, +3), then `resolve_report` (+2). Full ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Confirm the waiting device | `approve_device_link` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Scan the code | `scan_qr` | `RISKY_OPEN_REPLY` | −3 |
| "Which steps do I follow?" | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Reply from the preview | `reply` (open stage) | `PREMATURE_REPLY` | −1 |

### Scoring / event mapping (unchanged)

Identical table to W06.

### Why the final simulation stays faithful

The scene adds the settings screen, the decoded result and the conversation; the
classification, the stages, the scoring and the client's own sentences are untouched. The
consequence of `approve_device_link` is `simulated_device_link`, a rendering instruction the
engine returns — nothing is linked, because there is no account and no session anywhere in
the product.

---

## 6. Forms, inputs and data handling

W08's claim pages and W09's payment sheet carry real fields. The rules are unchanged from
IMMERSIVE-003A-R2 and are restated here because this batch added new ones:

- **Local** — a value lives in `useLocalForm` inside the component that draws the field, and nowhere else.
- **Ephemeral** — it is discarded when the learner leaves the screen.
- **Never transmitted** — no affordance, intent, payload or header carries it.
- **Never persisted** — no storage, cookie, cache or file.
- **Never logged** — not to the console, not to an event, not to the ledger.
- **No autofill surface** — every input is `type="text"`, `autocomplete="off"`, with a meaningless `name` of the form `f0`, `f1`, so no browser or password manager offers to save it.
- **No form submission** — there is no `<form>` element and no action anywhere.
- **Deterministic** — the same page always behaves the same way.
- **Not decorative** — a form exists only where refusing to fill it in is the decision being tested.

The engine's `METADATA_ALLOWLIST` is the second line of defence: an event may carry only
`intent`, `transition`, `consequence`, `resolution_code`, four duration measures,
`verify_source` and `premature`, and a key outside that list is rejected rather than
dropped. There is therefore no shape in which a typed value could reach the ledger even if
a scene tried.

**W10 carries no form at all.** Approving a device link is a confirmation, not a data entry,
and adding fields to it would have been the "forms for interactivity's sake" the batch was
told to avoid.

**W06's gallery holds a selection, not a value.** Which document is staged is component
state and is never passed to an affordance: the engine is told that a document was released,
which is the decision, and *which* file was chosen is presentation.

---

## 7. What is asserted, and where

| Claim | Test |
| --- | --- |
| Every scene control resolves to a legal transition on its own scenario | `backend/tests/sceneAffordance.test.js` |
| Each safe path sums to exactly ten | same |
| Each control keeps its scenario's own scoring meaning | same |
| No scene names a disposition, family, trigger, end state or feedback | `frontend/src/simulation/sceneModel.test.js` |
| No scene names a scoring event or a point value | same |
| Client headline and sender identity survive into the scene | same |
| The two truncated notification bodies are named, and only those two | same |
| No `href`, `src`, `img`, `iframe`, `form`, `fetch` or `window.open` on any screen | `frontend/src/components/simulation/SceneContainment.test.jsx` |
| Typed values never leave the component that holds them | `frontend/src/components/simulation/SceneForms.test.jsx` |
| This document covers every authored scenario and cites every technique it names | `frontend/src/simulation/sceneResearch.test.js` |

Bank fingerprint expected before and after this task:
`8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687`

Synthetic fingerprint expected before and after this task:
`2779b03939e13cf11e0bee44493609f0c91e228f201f22f8c025a080509afde1`
