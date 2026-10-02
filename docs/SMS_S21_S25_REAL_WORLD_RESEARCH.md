# SMS S21–S25 — real-world research and storyline reconstruction

**Task:** IMMERSIVE-014 — the fifth and final SMS batch
**Naming:** the client's bank numbers every SMS scenario `S01`–`S25`; this batch is **S21–S25** in the
data, the registry, the tests and this document, and it corresponds to specification **pages 109–113**.
**Scope:** SMS S21, S22, S23, S24, S25 only. WhatsApp W01–W25, Instagram I01–I25, Email E01–E25 and
SMS S01–S20 are complete and unchanged in behaviour. With this batch every one of the one hundred
scenarios in the bank has an authored scene.
**Status:** design record for the five SMS scenes authored by this task. **IMMERSIVE-014 COMPLETE
(22 September 2026)** — implemented, tested and browser-validated; the validation totals are in
`PROJECT_MASTER_PLAN.md` §16.37.
**Companions:** [`SMS_S01_S05_REAL_WORLD_RESEARCH.md`](SMS_S01_S05_REAL_WORLD_RESEARCH.md),
[`SMS_S06_S10_REAL_WORLD_RESEARCH.md`](SMS_S06_S10_REAL_WORLD_RESEARCH.md),
[`SMS_S11_S15_REAL_WORLD_RESEARCH.md`](SMS_S11_S15_REAL_WORLD_RESEARCH.md) and
[`SMS_S16_S20_REAL_WORLD_RESEARCH.md`](SMS_S16_S20_REAL_WORLD_RESEARCH.md), which use the same method.

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
arrive in one: a genuine new-device sign-in alert that was sent while the phone was in airplane mode
and so arrives half an hour after the sign-in it describes; a "secure voice" text that leads to a
sign-in page and a recorded voice; a refund text whose payment request, on every screen the phone
draws, says PAY; four texts before breakfast that announce a cybercrime case, a fee, an officer and a
secrecy order; and a toll-tag text that sends an Android app as a picture message.

What is deliberately **not** taken is infrastructure, tooling, real brands, real banks, real
merchants, real payment rails, real toll operators, real agencies, real portals, real carriers, real
units, real sender IDs, real people or any real capability. Training Portal, `VM-TPALRT`, DEV-204,
Lab 3, Meera, Secure Voice, Unit Falcon and its duty office, "Dev", ShopKart, TrainPay,
`skrefund.desk@trainpay`, complaint CC/2026/0417, the Cyber Case Clearance site, the Cyber Reporting
Portal (training), TollTag KYC, Meridian Bank, `AX-MRDTAG` and vehicle TR 00 AB 4471 are fictional
and describe nothing real. Every host is `*.training.example`; every phone number is in the reserved
`+91 00000 xxxxx` range (bare numbers in texts are `00000 xxxxx`). Every list, thread, details screen,
app, browser page, notification, payment sheet, file picker, installer and call is local, inert and
offline. Nothing is fetched, dialled, played, installed, uploaded, paid or sent.

**Military safety (S22).** S22 is the batch's only military scenario (S16–S20 also had one of five),
and every entity in it is synthetic. There is no real unit, formation, establishment, appointment,
rank, roster, posting, location, network, voice service, schedule or capability anywhere in the
scene. The client's own sentence contains the abbreviation "Col. Dev"; it is printed verbatim in the
bubble and nowhere else — the scene otherwise calls the person "Dev" and the office "the duty office".
"Unit Falcon", its duty office, its mail service and the fire-drill reminder are invented. The
behaviour taught — *a voice message for your number is in your phone's Voicemail, not behind a
sign-in page* — is generic hygiene. `sceneModel.test.js` asserts that, outside the client's sentence,
the scene names no rank, formation or operational term and prints no coordinate.

### 0.2 Source of the threat intelligence

Primary source: **MITRE ATT&CK, website version v19.2** (released 28 April 2026), re-confirmed as the
current version on the live versions page on 22 September 2026
(<https://attack.mitre.org/versions/>, which resolves to `/resources/versions/`; v18.1 ran
28 October 2025 – 27 April 2026, v17.1 before it). Technique pages read live for this batch on
22 September 2026: T1660, T1598.003, T1598.004, T1657, T1453, T1636.004, T1655.001, T1588.007 and
the deprecated T1476. T1684.001, T1566.004, T1111, T1417.002, T1513, T1219, T1589, T1204 and T1474
were read live for earlier SMS batches under the same v19.2 release and are carried forward.

Readings this batch relies on:

- **T1660 Phishing (Mobile) names smishing for all three of this batch's malicious outcomes** — "to
  install malware, navigate to a specific website" and to obtain credentials. It is the delivery
  mapping for S22–S25.
- **T1598.003 Spearphishing Link explicitly includes text messages** carrying links "designed to
  steal credentials". That makes it a **direct** reading of S22's sign-in page.
- **T1598.004 Spearphishing Voice includes callback phishing** — "phishing messages that direct them
  to call a phone number … where the adversary attempts to collect confidential information". It is
  direct for S24's "investigating officer" and supporting for the number S22's recording gives.
- **T1476 Deliver Malicious App via Other Means is deprecated.** The live page carries a deprecation
  warning and names no successor; delivery of an app outside a store by message is now read as T1660.
  It is recorded as considered and rejected for S25 so that older notes citing it are not trusted.
- **T1588.007 Obtain Capabilities: Artificial Intelligence** now names AI-generated audio for fraud
  and impersonation. It is resource development, not something a learner can observe, so it is a
  **partial** fit for S22's recorded voice, stated as such.

Version note carried forward: `T1656 Impersonation` no longer exists as a top-level technique; the
current page is **T1684.001** (Social Engineering: Impersonation, parent T1684), and the former
`T1672 Email Spoofing` is **T1684.002**.

Secondary sources, for the real-world pattern behind each scenario (landing pages, read 22 September
2026):

- **S21** — UK NCSC guidance on responding proportionately to genuine security messages
  (<https://www.ncsc.gov.uk/guidance/phishing>); the store-and-forward behaviour of SMS, by which a
  text sent to a phone that is off or in airplane mode is held by the network and delivered when the
  phone returns (3GPP TS 23.040, <https://www.3gpp.org/>).
- **S22** — US FTC consumer material on voicemail and "missed message" phishing texts
  (<https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams>); the ATT&CK T1588.007
  page for AI-generated audio.
- **S23** — the Reserve Bank of India's consumer awareness material on UPI collect-request frauds and
  the rule that a PIN is never needed to receive money (<https://rbikehtahai.rbi.org.in/>).
- **S24** — India's Ministry of Home Affairs / I4C public advisories on "digital arrest" and fake
  case-clearance demands (<https://www.mha.gov.in/>); the ATT&CK T1657 page.
- **S25** — public warnings about toll-tag "KYC" texts carrying Android packages, and Android's own
  guidance on permissions and the default SMS app role
  (<https://developer.android.com/guide/topics/permissions/overview>).

**Source-confidence note.** Nothing in this document rests on a secondary source for a *behavioural*
claim that ATT&CK is asked to carry. Every ATT&CK citation is linked to its own technique page, and
`sceneResearch.test.js` fails the build if a technique is named without its page. **ATT&CK research
does not affect scoring in any way**: the scores are the bank's, pinned by `sceneAffordance.test.js`.

### 0.3 Interpretation rule

ATT&CK is used as a **behavioural reference, not a checklist**. A mapping is recorded only where the
technique's own description describes what the scenario does, and each is marked **direct**,
**supporting** or **partial**. **S21 has no mapping, and that is stated** — a sign-in alert for a
sign-in the learner made involves no adversary. Four behaviours in this batch have **no dedicated
ATT&CK technique**, and the sections say so: a **fake voicemail notification** that routes a voice
message through a sign-in page (S22); the **direction reversal of a payment request** — a debit
presented as a refund (S23); **coercion by threat of arrest and an order of secrecy** (S24); and the
request that an app become the **default SMS app** as the price of a service (S25), which ATT&CK
models only as what malware does once installed.

### 0.4 What this document may and may not change

| Thing | May IMMERSIVE-014 change it? |
| --- | --- |
| Scenario IDs, platform, level, disposition, family, trigger, military flag, version | **No** |
| The six stages, their order, their text, expected actions, scoring semantics, feedback | **No** |
| `backend/data/scenarios/v1` and its fingerprint `8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687` | **No** |
| `backend/data/synthetic/v1` and its fingerprint `2779b03939e13cf11e0bee44493609f0c91e228f201f22f8c025a080509afde1` | **No** |
| The engine, the event ledger, the selection algorithm, the 90-minute deadline, the attempt API, the training-feedback review | **No** |
| Scene structure, beats, SMS surfaces, phone UI, the server-side control map | **Yes — this is the whole task** |

**The client scenario remains authoritative** over everything in this document. Where the research
and the client's own stage text disagree, the client's text wins and the disagreement is recorded.

**Difficulty is the bank's.** All five are **Hard** in the bank (specification pages 109–113), and
none was changed.

### 0.5 Content notes carried forward

**Canonical identity.** Every family and trigger is the bank's own, normalised by the existing
canonical taxonomy (`attack-family-taxonomy.v1.json`, `trigger-taxonomy.v1.json`); no identifier was
invented. S21 → `legit_system_confirmation` (`fear` + `routine`); S22 → `credential_phishing`
(`authority` + `curiosity`, military); S23 → `financial_credential_phishing` (`greed` + `confusion`);
S24 → `coercion_and_extortion` (`fear` + `authority`); S25 → `malware_delivery` (`convenience` +
`urgency`). The raw bank strings ("Fear + routine", "Authority + curiosity | FICTIONAL MILITARY
CONTEXT", "Greed + confusion", "Fear + authority", "Convenience + urgency") and the raw families
("Legitimate security alert", "Voice phishing / link lure", "Payment-request reversal scam",
"Government/I4C impersonation / digital arrest", "Road-toll impersonation / malicious app") stay in
the definition beside the canonical ids.

**Placeholder sender identifiers.** The generator stored S21's sender as the bare mobile
`+91 00000 72744`, which contradicts the client's "registered security alert" in an "established
security-alert thread". Handled as in S05, S07, S12 and S16: the scene prints the registered header
the stage text requires (`VM-TPALRT`) as the thread title and on the toast, and names the bank's
sender **asset id** on the inspection control.

**Placeholder received time, explained rather than changed.** S21's stored `received_at` is 14:49 and
the client's sentence names a login "at 14:22". Rather than altering either, the scene makes the gap
the evidence: the phone was in airplane mode during the lab; the Messages app's message details show
**sent 14:22, delivered 14:49**, and the thread carries the phone's own "Airplane mode turned off"
line.

**Parsed display names, reassembled.** S22's display name `Secure Voice` and S24's `CYBER CASE NOTICE`
are the heads of the client's sentences ("Secure Voice: Col. Dev left…", "CYBER CASE NOTICE: Pay
verification fee…"). A text from a ten-digit mobile cannot carry a sender name, so each bubble
reassembles the sentence verbatim under the stored mobile identifier, and the details screen says
"Calls itself — the first words of the text".

**Placeholder file asset.** S25's stored `file` asset is `S25_attachment.pdf` with a narrating preview.
The client's stage text is an APK; the scene shows `TollTag_KYC_Verify.apk` and names the bank's file
**asset id** on the inspection and install controls. The narrating preview is not printed.

**The narrator line is not printed.** No `prior_context` sentence is displayed on the device. The
verdict-word list applies to every label, hint and echo; report controls say "Report the message as
junk". The `browser_page` assets' narrating `body` (S22, S24) is never shown; only `host` and
`display_target` are used. S22's client sentence contains the word "urgent" and S24's "warrant"; both
are printed verbatim because they are the adversary's in-world claims, and the batch test measures
everything else the scene prints without the client's sentence.

**The trigger word is not printed.** None of the five scenes prints its canonical trigger words
outside the client's sentence; `sceneModel.test.js` asserts it for all five (S21 never says "fear"
or "routine").

**Deliberate overlaps with earlier scenes are recorded, not hidden** — S21 with S16/S03, S22 with
W15/E22, S23 with W04/S17, S24 with W12/E20/S12, S25 with W14/S20. §0.6 states what separates each.

**The result card placeholder** (known limitation carried from earlier scenes) applies to all five.

---

## 0.6 Differentiation from SMS S01–S20, Email E01–E25, WhatsApp W01–W25 and Instagram I01–I25

A comparison against all ninety-five earlier scenes was made **before** implementation, on story
archetype, attack family, trigger combination, difficulty, branch shape, verification method,
decision home, resolution sequence and psychological lever:

| | Behavioural lesson | Social mechanism | Primary evidence | Decision home | Verification pattern | Unsafe temptation |
| --- | --- | --- | --- | --- | --- | --- |
| **S21** *(legitimate)* | A matching alert needs nothing — not even the time on the bubble | Alarm at "login on DEV-204", and a habit of reporting everything | Message details: sent 14:22, delivered 14:49; the portal's session list shows DEV-204 from Lab 3; Meera's text assigning the laptop | **The portal app's session list** and **the Spam folder page** | Sign-in history in the portal app; Meera on her saved number; the directory | End the session; open the Spam text's "verify" address; report or block the alerts header |
| **S22** *(military)* | Your voicemail is in the Phone app | A senior's name + a message you are curious to hear | A service name at the front of a mobile's text; the link expands to a site that is not unit mail; Voicemail shows nothing | **The voice portal's sign-in page, the recording's transcript viewer, and the menu** | The duty office on the contacts number; the approved mail app | Sign in to listen; call the number the recording gives |
| **S23** | Read the direction, not the story | A refund you did not expect, explained confusingly | The amount card names an order you never placed; the notification says "is requesting"; the collect screen says PAY and "Money leaves your account" | **The payment app's notification (Decline), the collect payment sheet, and the composer** | The ShopKart app; TrainPay history | Reply "I accepted"; enter the UPI PIN |
| **S24** | No case is settled by a fee in a text | Threat of arrest + an official-sounding order to tell nobody | Four texts in two minutes from a mobile; a countdown portal; the case number does not exist on the reporting portal | **The notice itself (keep the texts), the officer's number card, the payment sheet and the phone's file picker** | The legal and security desk; the reporting portal from bookmarks | Call the officer; pay the fee; upload ID and passbook |
| **S25** | Apps never come by text | "Two minutes" to keep the tag working today | An APK as a picture message; Files says no publisher and not in the store; the installer names default SMS app, accessibility and screen capture | **Files (delete), the install warning, and the link card** | The issuer's app (tag active); tag support on the app's number | Open the download link; install anyway |

**What makes these SMS and not the messenger.** The platform grammar S01–S20 established — category
tabs, a header that is often only a number, registered sender IDs, the unsaved-sender bar, link, number
and amount cards — plus five things this batch uses for the first time:

- **Store-and-forward delivery (S21).** The time in a text and the time it arrived differ when the
  phone was off; the Messages app's message details show both.
- **The Spam folder as a page (S21).** The phone's own filter already holds the opportunistic text,
  and the unsafe act is taken there.
- **The phone's Voicemail (S22).** A voice message for a number lives in the Phone app; a link to one
  is not how the carrier delivers it.
- **A payment-app notification over Messages (S23).** "Is requesting" with Decline beside Pay.
- **An MMS attachment that is an app (S25).** The file is already on the phone; Files describes it.

**The nearest earlier scenes, and how they differ.**

- **S21, S16 and S03** are legitimate items. S16 was a sign-in *code* whose correct use was taken in
  the portal's code field; S03 a debit alert marked reviewed. S21 is the only legitimate scene whose
  item is an **alert about a completed event**, whose surface anomaly (the arrival time) is itself
  benign, and whose unsafe external act sits in **a different text in Spam**.
- **S22, W15 and E22** are a senior's voice. W15 was a WhatsApp voice note in a cloned chat; E22 a
  memo attached to an email ordering a transfer. S22 never delivers a voice at all: its lure is the
  **promise** of a voice behind a **sign-in page**, and its evidence is the phone's **Voicemail**.
- **S23, W04 and S17** end on a UPI payment sheet. W04 and S17 are emergencies from someone the
  learner loves; the payment direction is honest. S23 is a **refund**, and the lesson is that the
  request's **direction** is the opposite of the story. Its safe branch is taken in the payment app's
  **notification**, not in a thread.
- **S24, W12, E20 and S12** are authority impersonations. W12 escalated to a WhatsApp video "arrest";
  E20 was a summons in an inbox; S12 a tax refund form under a promotional header. S24 is the **SMS
  opening** of the con — four texts, a countdown and a secrecy order — and its safe branch is
  **preserving the texts**, the one scene in the product where keeping evidence is the decision.
- **S25, W14 and S20** end at an installer. W14's package came from a messenger link and was decided
  in the unknown-apps **settings**; S20's was a remote-help app from a link. S25's arrives **as a
  picture message**, is judged in **Files**, and its installer names the **default SMS app** role.

**Differentiation, asserted.** `sceneModel.test.js` asserts that **none of S21–S25 repeats a
branch-stage shape of any of the ninety-five earlier scenes, or of each other**; that **each of the
twenty-five SMS scenes has a decision home no other SMS scene shares**; that the five safe branches
sit in five different places; that every list's category set is new; that every scored branch
surface **and page** is reachable without spending the branch; and the per-scene properties listed
in §7.

---

## 1. S21 — Matching New-Login Alert

### Client scenario (authoritative)

Specification page 109. SMS, **Hard**, **Legitimate**, family *Legitimate security alert*, trigger
*Fear + routine*. Canonical identity: family `legit_system_confirmation`, triggers `fear` + `routine`,
military flag **false**, level `hard`.

- **Stage 1 (Event).** "TRAINING PORTAL login on DEV-204 at 14:22. If this was you, no action is needed."
- **Stage 2 (Open).** The established security-alert thread; the alert matches a login the learner
  just completed on a synthetic issued device.
- **Stage 3 (Inspect).** Device ID, exact time, no link or callback, and a matching active session.
  Decision signal: *the alert matches the learner's action and gives a clear no-action state without
  requesting secrets.*
- **Stage 4 (Branch).** The official-app session list showing DEV-204 and End session.
- **Stage 5 (Verify).** Compare with the session list opened directly in the official app; do not
  report or block a legitimate sender.
- **Stage 6 (Resolve).** Mark reviewed and keep the session if recognised; do not report or block.

### Real-world analogue and mechanism

New-device sign-in alerts are sent by most online services. The failure modes are human: alarm at a
device name, a reflex to "lock everything", and reporting a genuine sender as junk — which trains
filters against the very alerts that protect the account. Opportunistic criminals exploit the same
moment with generic "unusual sign-in" texts that happen to land near a genuine alert. **Observable cues:**
 a registered header with a history of alerts that each matched a real sign-in; a device the
learner was assigned; no link or number; a sent time matching the sign-in. **Psychological trigger:**
fear at the device name, and the routine of reporting anything security-shaped. **Why the cues matter:**
 they separate a notification about the learner's own act from a demand; the arrival time
is a property of the network, not the sender. **Synthetic-data safety:** every name, device, header
and number is fictional; nothing is signed in to or ended.

### MITRE ATT&CK alignment

**There is none, and none has been invented.** ATT&CK catalogues adversary behaviour. The item under
assessment is a genuine sign-in alert, from the portal's own registered sender, about a sign-in the
learner made on a laptop they were assigned. The unrelated text in the Spam folder is scenery for the
unsafe external act; it is not the item assessed and is not mapped.

**Closest defensible behavioural reference.** What S21 prices is the learner's reaction to a genuine
alert — ending their own session, opening an unrelated "verify" address, or reporting the portal's
sender. The references are defensive: NCSC's guidance on proportionate responses to genuine security
messages and the network's store-and-forward delivery of texts (§0.2). No adversary behaviour is
claimed and no identifier appears in this section.

**Mappings considered and rejected.** Every phishing, impersonation and credential-access technique
was considered and rejected for the assessed item, because the item has no adversary.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | List row preview and the alert bubble; the toast carries `VM-TPALRT` |
| "Established security-alert thread" | Two earlier alerts (18 August, 2 September) above today's |
| "Device ID, exact time" | Message details: DEV-204, sent 14:22, delivered 14:49; the alerts page lists each device |
| "No link/callback" | Details screen: no address and no number in any of the three |
| "Matching active session" | The portal app: DEV-204 active since 14:22, Lab 3 network |
| "Official-app session list showing DEV-204 and End session" | The portal's session list, with "This was me" and "End the DEV-204 session" |
| "Needless reject/ignore −2" | End the session |
| "Unsafe external action −4" | Opening the Spam text's address |
| "Do not report or block" | Report and block at verify are `−4`; report, block and ignore at resolve are `−4` |

### Enhanced synthetic storyline

At 14:04 Meera, the lab coordinator, texts: "Lab 3 today. You're on laptop DEV-204." The learner's
phone goes into airplane mode for the lab at 13:58. At 14:22 they sign in to Training Portal on
DEV-204, approving the sign-in in the portal app over the lab Wi-Fi. At 14:49 airplane mode goes off
and the alert arrives. A minute later an unsaved number texts "unusual sign-in, verify within 2
hours", which the phone files in Spam.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast from `VM-TPALRT` |
| Open | The list: Security, Personal (Meera), Updates, Spam (one text) |
| Inspect | The thread; details; alerts from this sender; message details with both times |
| Branch | The portal's session list (keep / end); the Spam folder page (open the address) |
| Verify | Sign-in history, Meera, the directory — or the Spam text's address, report, block |
| Resolve | Mark reviewed and keep the session; or report, block, ignore |

### Evidence the learner can discover (progressive)

1. No unsaved-sender bar; "You can't reply to this sender. It sends sign-in alerts only."
2. "Airplane mode turned off · 14:49" above the alert.
3. Details: registered header; each earlier alert named a device the learner used.
4. Message details: sent 14:22, delivered 14:49, and why.
5. The portal app: DEV-204 active since 14:22, approved in this app.
6. Sign-in history: three new-device sign-ins this year, all the learner's.

### Learner interaction journey

Notify → open the alert → message details → back → open Training Portal from the home screen (free)
→ This was me — keep DEV-204 → read the sign-in history → mark reviewed and keep DEV-204.

### Simulation surfaces

- `details`, `msginfo`, `spam` (`SMS`): conversation details and alerts; message details; the Spam folder.
- `sessions` (`APP`): the portal's device and session list — the decision home.
- `history` (`APP`): sign-in history. `labcall` (`CALL`): Meera on her saved number.

### Verification mechanism

`verify_known_app` opens the sign-in history; `verify_known_number` calls Meera; `verify_trusted_directory`
opens the directory. Looking up the Spam text's address is `verify_in_message_contact` (0). Report and
block are `FALSE_REPORT_BLOCK` (−4).

### Safe resolution

`resolve_retain` or `resolve_continue`, `+2`. Full safe path: `open_item → read → read_thread →
safe_pivot (keep DEV-204) → verify_known_app → resolve_retain` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Open the Spam text's address | `open_link` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| End the DEV-204 session | `reject_ignore` | `NEEDLESS_REJECT_IGNORE` | −2 |
| Report or block at verify | `report` / `block` | `FALSE_REPORT_BLOCK` | −4 |
| Report, block or ignore at resolve | `resolve_report` / `resolve_block` / `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |
| Call the IT desk from the list before reading | `call_number` (open) | `PREMATURE_REPLY` | −1 |

### Scoring / event mapping (unchanged)

Stage 4 declares `CORRECT_USE +3`, `NEEDLESS_REJECT_IGNORE −2`, `UNSAFE_EXTERNAL_ACTION −4`. Keeping the
session is `safe_pivot`, which the engine resolves to `CORRECT_USE` on a legitimate item; opening the
Spam address is `open_link`, which resolves to `UNSAFE_EXTERNAL_ACTION` because the scenario declares
no risky-open code. Pinned: Spam-link route **3**, end-session route **5**, false-report route **0**.

### Why the final simulation stays faithful

Every client element is present: the verbatim alert, the established thread, the device and time, no
link or callback, the matching session, the official-app session list with End session, verification
in the app, and a resolution that keeps the session and reports nothing. The scene adds the one
feature of SMS that makes a genuine alert look odd — delayed delivery — and shows where the phone
explains it.

---

## 2. S22 — Synthetic Voice-Mail Link

### Client scenario (authoritative)

Specification page 110. SMS, **Hard**, **Malicious**, family *Voice phishing / link lure*, trigger
*Authority + curiosity | FICTIONAL MILITARY CONTEXT*. Canonical identity: family `credential_phishing`,
triggers `authority` + `curiosity`, military flag **true**, level `hard`.

- **Stage 1 (Event).** "Secure Voice: Col. Dev left 1 urgent message. Listen before 18:00."
- **Stage 2 (Open).** A text claims a senior left a secure voice message reachable only by a short link.
- **Stage 3 (Inspect).** Unknown service, link target, sender identity and artificial expiry.
- **Stage 4 (Branch).** A voice portal that asks for mail credentials, then plays a synthetic instruction.
- **Stage 5 (Verify).** Contact the senior/duty office through known channels; check approved messaging.
- **Stage 6 (Resolve).** Close; report junk and impersonation; do not act on the audio.

### Real-world analogue and mechanism

"You have a new voicemail — listen here" texts and emails are a long-running credential-phishing
lure; the page asks for a work mailbox password "to listen". Generative audio now lets the "message"
itself sound like a known person, and the recording asks the victim to call a different number.
**Observable cues:** a service name at the front of a text from a ten-digit mobile; a short link to a
site that is not the organisation's mail; an expiry; nothing in the phone's own Voicemail.
**Psychological trigger:** authority (a senior's name) and curiosity (what did he say?). **Why the cues matter:**
 voicemail belongs to the carrier and the Phone app; no genuine voice message needs a
mail password. **Synthetic-data safety:** Unit Falcon, Dev, Secure Voice and all numbers and hosts are
fictional; no audio exists — the recording is a transcript. No real unit, formation, establishment, appointment, rank, roster, posting, location or capability appears anywhere in the scene (§0.1, Military safety).

### MITRE ATT&CK alignment

**Direct — [T1660 Phishing (Mobile)](https://attack.mitre.org/techniques/T1660/).** A text to a
handset whose link leads to a credential page. **Direct —
[T1598.003 Spearphishing Link](https://attack.mitre.org/techniques/T1598/003/).** The live page covers
SMS links "designed to steal credentials"; the portal's mail-and-password form is exactly that.
**Supporting — [T1684.001 Impersonation](https://attack.mitre.org/techniques/T1684/001/).** The text and
the recording speak as a named senior (the current page; the retired top-level id is not used). **Supporting —
[T1598.004 Spearphishing Voice](https://attack.mitre.org/techniques/T1598/004/).** The recording
directs the learner to call a number where a code is asked for: callback phishing.

**Partial fit, stated — [T1588.007 Obtain Capabilities: Artificial Intelligence](https://attack.mitre.org/techniques/T1588/007/).**
The bank calls the audio "synthetic"; ATT&CK records acquiring AI audio as resource development, which
the learner never sees. It explains the recording; it is not an observable behaviour in the scene.

**Considered and rejected.** [T1566.004 Spearphishing Voice (Initial Access)](https://attack.mitre.org/techniques/T1566/004/)
— nobody calls the learner, and nothing is installed; the information-gathering sub-technique above is
the right one. [T1111 Multi-Factor Authentication Interception](https://attack.mitre.org/techniques/T1111/)
— the callback asks a person to read a code aloud; that is social engineering, not technical
interception. [T1417.002 GUI Input Capture](https://attack.mitre.org/techniques/T1417/002/) — requires an
app on the device drawing over another; the portal is a web page.

**The gap, stated.** There is no dedicated ATT&CK technique for a **fake voicemail notification** that
routes a voice message through a sign-in page.

**Why this maps.** The mechanism is a text that moves the learner to a credential page (T1660,
T1598.003) using a senior's identity (T1684.001), with a callback fallback (T1598.004).

**What must NOT be copied.** No real voice service, voicemail system, unit mail domain, rank structure
or recording. No real person's voice or name.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The first bubble ("Secure Voice: …") and the list row |
| "Short link" | The link card `sv-msg.training.example/l/7Q2`, expanded on link details |
| "Unknown service, sender identity, artificial expiry" | Details: a mobile calling itself Secure Voice; "stops working at 18:00" |
| "Fake voice portal asks for mail credentials" | The portal's sign-in form (address, masked password) — `−8` |
| "Then plays a synthetic instruction" | The 10-second preview transcript asking for a call-back on another number — `−3` |
| "Back/Close or safe preview only" | "Close this page" on the portal; or leave the link for Voicemail |
| "Known channels, approved messaging" | The duty office on the contacts number; Unit Falcon Mail |
| "Report junk and impersonation" | Resolve: report the text and tell the duty office |

### Enhanced synthetic storyline

At 15:16 a mobile the learner has never saved texts "Secure Voice: Col. Dev left 1 urgent message.
Listen before 18:00." with a short link, and a second line: length 0:41, office line withheld, sign in
with your unit mail. The Phone app's Voicemail says no new messages. The carrier's own thread says new
voicemail appears in the Phone app.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast from `+91 00000 38373` |
| Open | The list: Not in contacts, Contacts (duty office), Carrier, Spam |
| Inspect | The thread with the unsaved-sender bar; details; link details; Voicemail (free) |
| Branch | The portal (sign in / close); the preview transcript (call back); leave for Voicemail |
| Verify | Duty office, Unit Falcon Mail, directory — or call back the sender, report, block |
| Resolve | Report and tell the duty office / block; or sign in, ignore |

### Evidence the learner can discover (progressive)

1. The unsaved-sender bar: first text from this number.
2. Details: a ten-digit mobile; "Secure Voice" is the first words of the text.
3. Link details: the short link goes to `s22.training.example`, not `mail.falcon.training.example`.
4. Voicemail: no new messages.
5. The preview transcript: "Call me back on 00000 46120 — not the office … keep it between us."
6. Unit Falcon Mail: nothing from Dev today; voice messages never arrive behind a sign-in.

### Learner interaction journey

Notify → open → see where the link goes → open the link (free) → read the page → close this page →
call the duty office → report the text and tell the duty office.

### Simulation surfaces

- `details`, `linkinfo` (`SMS`). `portal` (`BROWSER`) — sign-in page. `clip` (`VIEWER`, voice art) —
  the preview transcript. `voicemail`, `mailapp` (`APP`). `office`, `callback` (`CALL`).

### Verification mechanism

`verify_known_number` calls the duty office; `verify_known_app` opens Unit Falcon Mail;
`verify_trusted_directory` opens the directory. Calling the sender back is `verify_in_message_contact`
(0). Report or block without checking is `REPORT_ONLY_WITHOUT_CHECK` (+1).

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_link →
safe_pivot (close the page) → verify_known_number → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Sign in and listen | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Call the number the recording gives | `call_number` | `RISKY_OPEN_REPLY` | −3 |
| Call back the sender at verify | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |
| Sign in before 18:00 / ignore at resolve | `resolve_continue` / `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |
| Open the link from the list before reading | `open_link` (open) | `PREMATURE_REPLY` | −1 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.
Pinned: call-back route **4**, sign-in route **0**.

### Why the final simulation stays faithful

A voice-message text, a short link, a senior's name, an expiry, a credential page and a recorded
instruction are all present; verification is through known channels and the approved mail app. The
scene adds the phone's own Voicemail as the thing that settles it.

---

## 3. S23 — UPI Refund Collect Request

### Client scenario (authoritative)

Specification page 111. SMS, **Hard**, **Malicious**, family *Payment-request reversal scam*, trigger
*Greed + confusion*. Canonical identity: family `financial_credential_phishing`, triggers `greed` +
`confusion`, military flag **false**, level `hard`.

- **Stage 1 (Event).** "Refund INR 2,499 ready. Accept collect request and enter UPI PIN to receive."
- **Stage 2 (Open).** A merchant-themed text says a refund requires accepting a collect request and
  entering the PIN.
- **Stage 3 (Inspect).** Unrecognised order, collect direction, payee name and the PIN request.
- **Stage 4 (Branch).** A UPI collect screen clearly showing PAY and the amount.
- **Stage 5 (Verify).** Check the original order/refund in the official app and bank statement.
- **Stage 6 (Resolve).** Decline; report junk/block; contact the merchant through known support.

### Real-world analogue and mechanism

UPI collect-request fraud relies on a single confusion: the victim is told that approving a request
will *receive* money, when approving any collect request with a PIN *sends* it. Regulators repeat that
a PIN is never needed to receive money. **Observable cues:** a mobile number speaking for a merchant
that has its own sender ID; an order the learner never placed; "is requesting"; PAY; "Money leaves your
account"; the payee is not the merchant. **Psychological trigger:** greed (an unexpected refund) and
confusion (the instructions invert the direction). **Why the cues matter:** every screen the payment
app draws states the direction; only the text says otherwise. **Synthetic-data safety:** ShopKart,
TrainPay, the VPA, order and account are fictional; no PIN is kept, no money moves.

### MITRE ATT&CK alignment

**Direct — [T1660 Phishing (Mobile)](https://attack.mitre.org/techniques/T1660/).** A text to a handset
inducing a payment. **Direct — [T1657 Financial Theft](https://attack.mitre.org/techniques/T1657/).**
The objective is money moved to an adversary-controlled account by social engineering.

**Partial fit, stated — [T1684.001 Impersonation](https://attack.mitre.org/techniques/T1684/001/).** The
text speaks for ShopKart only in words; there is no brand asset, no look-alike page and no cloned
account, so impersonation is present but thin.

**Considered and rejected.** [T1417.002 GUI Input Capture](https://attack.mitre.org/techniques/T1417/002/)
— the PIN would be typed into the learner's own payment app, not captured by an overlay.
[T1598.003 Spearphishing Link](https://attack.mitre.org/techniques/T1598/003/) — there is no link; the
request arrives inside the payment system itself.

**The gap, stated.** ATT&CK has no technique for the **direction reversal of a payment request** — an
authorised debit presented as a refund.

**Why this maps.** Delivery by text (T1660) and a financial objective (T1657) are the whole mechanism;
the merchant name is window-dressing.

**What must NOT be copied.** No real merchant, UPI handle, bank, PSP or payment screen.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The first bubble and the list row |
| "Unrecognised order, payee name" | The amount card (order SK-58213, `skrefund.desk@trainpay`); details: not in ShopKart's messages |
| "Collect direction" | Card details: "A collect request asks you to pay"; the notification "is requesting" |
| "UPI collect screen clearly showing PAY and amount" | The collect payment sheet: "INR 2,499.00 · PAY to SK REFUND DESK", "Money leaves your account" |
| "Do not approve or enter the PIN" | Entering the PIN and pressing Pay is `−8` |
| "Official app and bank statement" | The ShopKart app; TrainPay history |
| "Decline" | Decline on the notification (the safe branch); "leave the request declined" at resolve |

### Enhanced synthetic storyline

At 17:19 an unsaved mobile texts the refund message, followed by an amount card and a line saying the
request is already in TrainPay: "Tap PAY and enter UPI PIN — the refund is credited at once. After 19:00
it goes back to the seller." ShopKart's own texts come from `VM-SHPKRT`; its last order was delivered
on 4 September.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast from `+91 00000 93599` |
| Open | The list: All, Payments, Offers, Spam |
| Inspect | The thread with the amount card; details; card details |
| Branch | The TrainPay notification (Decline / Pay link); the collect sheet (PIN, Pay); a composer reply |
| Verify | ShopKart app, TrainPay history, directory — or call the sender, report, block |
| Resolve | Leave declined and report / block; or approve, ignore |

### Evidence the learner can discover (progressive)

1. The unsaved-sender bar notes ShopKart has texted from `VM-SHPKRT` before.
2. The amount card names an order the learner never placed.
3. Card details: the learner pays, if they approve.
4. The notification: "SK REFUND DESK is requesting INR 2,499.00"; "Approving sends money".
5. The collect sheet: PAY, "Money leaves your account", PIN note.
6. ShopKart: no order SK-58213, refunds go back automatically with nothing to approve.

### Learner interaction journey

Notify → open → card details → open in TrainPay (free) → Decline → open ShopKart → leave the request
declined and report the text.

### Simulation surfaces

- `details`, `reqinfo` (`SMS`). `notif` (`INSTALLER`, dialog) — the payment app's notification.
  `collect` (`PAYSHEET`). `shopapp`, `payhistory` (`APP`).

### Verification mechanism

Two `verify_known_app` routes (ShopKart, TrainPay history) and the directory; calling the sender is
`verify_in_message_contact` (0); report/block without checking is `+1`.

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. Full safe path: `open_item → read → read_thread →
safe_pivot (Decline) → verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Enter the UPI PIN and Pay | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Reply "I accepted. When will it arrive?" | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Approve before 19:00 / ignore at resolve | `resolve_continue` / `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |
| Reply from the list before reading | `reply` (open) | `PREMATURE_REPLY` | −1 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.
Pinned: reply route **4**, payment route **0**.

### Why the final simulation stays faithful

The refund text, the collect request, the PIN, the PAY screen, the unrecognised order and verification
in the merchant and payment apps are all present. The scene adds the payment app's notification as
the place Decline naturally sits.

---

## 4. S24 — Fake Cybercrime Case Fee

### Client scenario (authoritative)

Specification page 112. SMS, **Hard**, **Malicious**, family *Government/I4C impersonation / digital
arrest*, trigger *Fear + authority*. Canonical identity: family `coercion_and_extortion`, triggers
`fear` + `authority`, military flag **false**, level `hard`.

- **Stage 1 (Event).** "CYBER CASE NOTICE: Pay verification fee to avoid warrant. Case closes today."
- **Stage 2 (Open).** A text claims a cybercrime complaint names the learner and demands a fee.
- **Stage 3 (Inspect).** Sender/header, payment demand, secrecy, case link and official guidance.
- **Stage 4 (Branch).** A case portal and payment timer.
- **Stage 5 (Verify).** Independently known official/unit legal/security contacts and the official portal only.
- **Stage 6 (Resolve).** Do not pay or reply; preserve; report/block through approved channels.

### Real-world analogue and mechanism

"Digital arrest" and fake case-clearance frauds open with a text or call claiming a complaint, a
warrant or a parcel of contraband; they demand a fee, identity documents or bank details, and forbid
the victim to tell anyone. Public advisories stress that no agency settles a case by payment and none
orders secrecy from family or employer. **Observable cues:** a mobile number, not a registered
government header; a countdown; a fee; an "officer" number; a secrecy order. **Psychological trigger:**
 fear of arrest and deference to authority, compounded by isolation. **Why the cues matter:**
the secrecy order exists to prevent the one check — asking someone — that ends the con.
**Synthetic-data safety:** the case number, sites, portal and numbers are fictional.

### MITRE ATT&CK alignment

**Direct — [T1660 Phishing (Mobile)](https://attack.mitre.org/techniques/T1660/).** Text delivery to a
handset. **Direct — [T1684.001 Impersonation](https://attack.mitre.org/techniques/T1684/001/).** The
texts speak as a cybercrime authority (the current page; the retired top-level id is not used). **Direct —
[T1657 Financial Theft](https://attack.mitre.org/techniques/T1657/).** The live page includes extortion
and impersonation-based fraud of individuals.

**Supporting — [T1598.004 Spearphishing Voice](https://attack.mitre.org/techniques/T1598/004/).** The
"officer" number is callback phishing. **Supporting —
[T1598.003 Spearphishing Link](https://attack.mitre.org/techniques/T1598/003/).** The case link leads to a
page that collects identity and bank documents.

**Partial fit, stated.** T1657 covers the payment; it does not model the *coercion* — threat of arrest
and an order of secrecy — that drives it.

**Considered and rejected.** [T1589 Gather Victim Identity Information](https://attack.mitre.org/techniques/T1589/)
— a reconnaissance technique for targeting; here collection is the objective and is covered above.
[T1219 Remote Access Tools](https://attack.mitre.org/techniques/T1219/) — nothing asks for remote access
in this opening, unlike W12's later escalation.

**The gap, stated.** ATT&CK has no technique for **coercion of an individual by threat of arrest and
an order of secrecy**.

**Why this maps.** Delivery (T1660), the authority claim (T1684.001) and the money (T1657) are the core;
the callback and the upload are the two other ways the same texts extract value.

**What must NOT be copied.** No real agency, portal, case format, statute, officer or reporting number.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The first bubble ("CYBER CASE NOTICE: …") and the list row |
| "Sender/header" | Details: a ten-digit mobile; government senders on this phone use `VM-GOVTRN` |
| "Payment demand, secrecy, case link" | The second and fourth texts; the link card |
| "Fake case portal and payment timer" | The case portal: warrant pending, 10 h 54 min left, fee |
| "Do not pay, upload identity/bank data or call the supplied officer" | Pay `−8`, upload `−8`, call `−3` |
| "Official/unit legal/security contacts and the official portal" | Legal and security desk; the reporting portal from bookmarks |
| "Preserve" | The safe branch is keeping all four texts; resolve keeps them and reports |

### Enhanced synthetic storyline

Between 07:03 and 07:05 four texts arrive from one mobile: the notice; the complaint number and fee
with a case link; an officer's number; and an order that discussing it is an offence. The case portal
counts down to 18:00 and offers two ways out: pay the fee, or upload ID card and passbook for "manual
clearance".

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast from `+91 00000 97400` |
| Open | The list: Inbox, Government, Bank, Spam |
| Inspect | The thread; details; link details |
| Branch | Keep the texts (on the notice); call the officer (number card); the portal → fee sheet or file picker |
| Verify | Legal desk, reporting portal, directory — or call the officer, report, block |
| Resolve | Keep and report / block; or pay, ignore |

### Evidence the learner can discover (progressive)

1. The unsaved-sender bar: first text from this number.
2. Details: a mobile calling itself CYBER CASE NOTICE; four texts in two minutes; "tell nobody".
3. The Government tab: genuine government texts come from a registered header.
4. Link details: the case site is not the reporting portal in the bookmarks.
5. The portal: a countdown and a fee — or documents.
6. The reporting portal: "No complaint with this number exists."

### Learner interaction journey

Notify → open → sender details → keep all four texts → call the legal and security desk → keep the
texts and report them through the reporting portal.

### Simulation surfaces

- `details`, `linkinfo` (`SMS`). `portal`, `official` (`BROWSER`). `fee` (`PAYSHEET`). `upload`
  (`VIEWER`, file picker). `officercall`, `legal` (`CALL`).

### Verification mechanism

`verify_known_number` calls the legal and security desk; `verify_known_app` opens the reporting portal
from bookmarks; the directory. Calling the officer is `verify_in_message_contact` (0).

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_sender →
safe_pivot (keep the texts) → verify_known_number → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Pay the fee with a PIN | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Upload ID card and passbook | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Call the officer | `call_number` | `RISKY_OPEN_REPLY` | −3 |
| Pay before 18:00 / ignore at resolve | `resolve_continue` / `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |
| Call the officer from the list | `call_number` (open) | `PREMATURE_REPLY` | −1 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.
Pinned: officer route **4**, fee route **0**, upload route **0**.

### Why the final simulation stays faithful

The notice, fee, warrant threat, secrecy, case link, portal with timer, officer number and
verification through independent contacts and the official portal are all present. The scene adds
preservation as a first-class safe act.

---

## 5. S25 — FASTag Update APK

### Client scenario (authoritative)

Specification page 113. SMS, **Hard**, **Malicious**, family *Road-toll impersonation / malicious app*,
trigger *Convenience + urgency*. Canonical identity: family `malware_delivery`, triggers `convenience` +
`urgency`, military flag **false**, level `hard`.

- **Stage 1 (Event).** "FASTag KYC expiring. Install verification app now to avoid deactivation."
- **Stage 2 (Open).** A text says a toll tag stops unless an attached Android app is installed.
- **Stage 3 (Inspect).** Unregistered sender, APK delivery, broad permission need and short deadline.
- **Stage 4 (Branch).** An APK installer requesting SMS, accessibility and screen-capture permissions.
- **Stage 5 (Verify).** Open the known issuer/bank app or call its known support number.
- **Stage 6 (Resolve).** Cancel installation; report junk/block; verify tag status independently.

### Real-world analogue and mechanism

Banking-trojan campaigns send Android packages by SMS under the name of a routine service — toll tags,
electricity, parcels — and ask the victim to allow the permissions that let the app read incoming
texts (including one-time codes), act through accessibility and record the screen. **Observable cues:**
 an unsaved mobile; an app delivered as a file; no publisher; not in the store; a toll app
asking to become the default SMS app. **Psychological trigger:** convenience ("two minutes") and
urgency (23:59). **Why the cues matter:** issuers do KYC in their own app or branch; no toll service
needs to read the learner's texts. **Synthetic-data safety:** no package exists; the issuer, header,
vehicle and numbers are fictional.

### MITRE ATT&CK alignment

**Direct — [T1660 Phishing (Mobile)](https://attack.mitre.org/techniques/T1660/).** The live page names
smishing "to install malware". **Supporting —
[T1655.001 Masquerading: Match Legitimate Name or Location](https://attack.mitre.org/techniques/T1655/001/).**
The package is named after the toll service.

**Partial fit, stated.** What the install warning names are post-install Mobile behaviours the scene
never reaches: [T1636.004 Protected User Data: SMS Messages](https://attack.mitre.org/techniques/T1636/004/)
(default SMS app, `RECEIVE_SMS`), [T1453 Abuse Accessibility Features](https://attack.mitre.org/techniques/T1453/)
and [T1513 Screen Capture](https://attack.mitre.org/techniques/T1513/). They explain *why* the prompts
matter; the learner only sees them requested.

**Considered and rejected.** [T1476 Deliver Malicious App via Other Means](https://attack.mitre.org/techniques/T1476/)
— deprecated (live page, deprecation warning); delivery by message is now T1660.
[T1204 User Execution](https://attack.mitre.org/techniques/T1204/) — an Enterprise technique for code
run on hosts; the Mobile matrix is the right frame. [T1474 Supply Chain Compromise](https://attack.mitre.org/techniques/T1474/)
— no store or legitimate app is involved.

**The gap, stated.** ATT&CK models the **default SMS app** role only as what malware does once
installed; it has no technique for asking a person to grant it as the price of a service.

**Why this maps.** A text delivering a masquerading app (T1660, T1655.001) whose permissions would
enable SMS collection, accessibility abuse and screen capture.

**What must NOT be copied.** No real toll programme, issuer, package name, permission flow or store.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The first bubble and the list row |
| "Toll-service thread and APK link" | The MMS attachment `TollTag_KYC_Verify.apk` and the download link card |
| "Unregistered sender, APK delivery, broad permissions, short deadline" | Details; Files; the 23:59 text |
| "APK installer requesting SMS, accessibility and screen-capture" | The install warning — Install anyway is `−8` |
| "Do not install or grant any permission" | Delete the file in Files (safe branch) |
| "Known issuer/bank app or known support number" | The Meridian Bank app (tag active); tag support on the app's number |
| "Verify tag status independently" | The issuer app: KYC completed 14 Mar 2026 |

### Enhanced synthetic storyline

At 10:15 an unsaved mobile sends the text as a picture message with the package attached, then:
"Tag for vehicle TR 00 AB 4471 stops at 23:59 today. Install, allow what the app asks, and verify with
your debit card." A download link follows "if the file does not open". The learner's father texted
that morning that the tag was recharged last week; the issuer's genuine toll texts are under
Transactions from `AX-MRDTAG`.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast from `+91 00000 20845` |
| Open | The list: Conversations, Transactions, Pictures, Spam |
| Inspect | The thread with the attachment; details; Files |
| Branch | Files (delete); the install warning (install anyway); the link card (open) |
| Verify | Issuer app, tag support, directory — or reply HELP, report, block |
| Resolve | Report with the file deleted / block; or install, ignore |

### Evidence the learner can discover (progressive)

1. The unsaved-sender bar: "It sent you a file."
2. Details: the issuer writes as `AX-MRDTAG`; none of its texts carries a file.
3. Files: no publisher, not listed in the store, will ask for default SMS app, accessibility, capture.
4. The install warning names each permission in plain words.
5. The issuer app: tag active, KYC done in March, nothing due.

### Learner interaction journey

Notify → open → file details → delete the file without opening it → open the Meridian Bank app →
report the text with the file deleted.

### Simulation surfaces

- `details` (`SMS`). `apkfile` (`VIEWER`, apk art) — the decision's safe home. `pkg` (`INSTALLER`,
  dialog). `dlpage` (`BROWSER`). `issuer` (`APP`). `tagcall` (`CALL`).

### Verification mechanism

`verify_known_app` opens the issuer app; `verify_known_number` calls tag support on the app's number;
the directory. Replying HELP to the sender is `verify_in_message_contact` (0).

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. Full safe path: `open_item → read → preview_file →
safe_pivot (delete the file) → verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Install anyway | `attempt_install` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Open the download link | `open_link` | `RISKY_OPEN_REPLY` | −3 |
| Install before 23:59 / ignore at resolve | `resolve_continue` / `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |
| Install from the list before reading | `attempt_install` (open) | `PREMATURE_REPLY` | −1 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.
Pinned: link route **4**, install route **0**.

### Why the final simulation stays faithful

The toll-tag text, the APK, the deadline, the broad permissions, the installer and verification in
the issuer's app and on its known number are all present. The scene adds the MMS attachment and Files
as the natural place to refuse.

---

## 6. Forms, inputs and data handling

**Three of the five scenes accept typing, each because the screen is about refusing to.** S22's portal
takes a mail address and a masked password; S23's and S24's payment sheets take a UPI PIN. **S21 and
S25 have no field anywhere**, and S24's upload is a picker of drawn tiles, not files. The rules every
field obeys:

- **Local.** The value lives in `useLocalForm` state inside the component that draws it.
- **Ephemeral.** Leaving a screen unmounts it; browser pages are keyed on the page.
- **Never transmitted.** No `fetch`, no `<form>`, no submit event. Each commit control carries only a
  neutral id and an optional asset id.
- **Never persisted.** No `localStorage`, `sessionStorage`, IndexedDB, cookie or cache holds anything
  typed.
- **Never logged.** No console output or event payload; the engine's `METADATA_ALLOWLIST` rejects any
  unknown metadata key, and the ledger stores no action code or control id.
- **No autofill surface.** `autoComplete="off"` and neutral names; the PIN is `FIELD_KIND.SECRET` and
  the password `FIELD_KIND.MASKED`, masked by CSS, never `type="password"`.
- **No form submission.** Pages move by local links; only the page-scoped scene control reaches the
  engine; the payment sheet's control is disabled only by incomplete input, never by risk.
- **Deterministic.** The same control always produces the same event.
- **Not decorative.** Every screen that shows a release has the control that commits it.

No real credential, card, account, OTP, PIN, identity document, payment, package or device detail
exists anywhere in S21–S25.

## 7. What is asserted, and where

| Claim | Test |
| --- | --- |
| Every S21–S25 control resolves to a legal transition on its own pinned definition; safe paths score ten; unsafe routes score as recorded; canonical identity pinned | `backend/tests/sceneAffordance.test.js` |
| The same routes, premature acts, stale views, wrong-stage controls, cross-run codes, retries, replay after completion and reloads through a real MongoDB transaction; intent/points/metadata injection, malformed and cross-run codes over real HTTP | `backend/tests/smsS21S25Engine.test.js` (isolated DB) |
| No S21–S25 branch shape repeats any of the ninety-five earlier scenes; each of the twenty-five SMS scenes has a unique decision home; five different safe-branch homes; new category sets | `frontend/src/simulation/sceneModel.test.js` |
| Every scored branch surface **and page** is reachable without spending the branch; six stages each carry scored controls | `sceneModel.test.js`, `SceneScenariosSmsE.test.jsx` |
| S22 names no rank, formation, operational term or coordinate outside the client's sentence; no scene prints its trigger words | `sceneModel.test.js` |
| Only S21 offers `reject_ignore` | `sceneModel.test.js`, `sceneAffordance.test.js` |
| Nothing typed reaches the wire or storage; no `href`, `src`, `iframe`, `form` or media element | `SceneScenariosSmsE.test.jsx`, `SceneContainment.test.jsx` |
| This document covers every authored scenario and cites every technique it names | `sceneResearch.test.js` |

## 8. Findings during verification

Findings from implementation, tests and hand-play are recorded in `PROJECT_MASTER_PLAN.md` §16.37.

1. **A verdict word on a control.** S22's first resolve label said "report … as impersonation"; the
   product-wide verdict guard refused it. It now reads "Report the text as junk and tell the duty
   office".
2. **Found by hand-play and fixed — a paid sheet returned to the screen that offered it.** S23's
   collect sheet is opened from the payment notification, and S24's fee sheet and file picker from the
   case portal. `closes: true` popped only the sheet, so after paying the learner stood on the
   notification (or portal) still showing its Pay link. These three releases now use `closes: 'all'`,
   an additive option (`nav.reset()` in `SimulationPage`) that returns to the conversation; every other
   scene keeps `closes: true` unchanged. `SceneScenariosSmsE.test.jsx` and `sceneModel.test.js` assert it,
   and the next browser run returned straight to the thread after the upload and the fee.
3. **Found by hand-play and fixed — resolve labels that assumed the safe branch.** "Leave the request
   declined…" (S23), "…the file stays deleted" (S25) and "…keep DEV-204 signed in" (S21) read wrongly
   after a learner had paid, installed or ended the session. They now read "Report the text as junk and
   approve nothing from this sender", "Report the text as junk and delete the file" and "Mark the alert
   reviewed: the sign-in was yours". Scoring is unchanged (the same neutral ids).
4. **Found by hand-play and fixed — an inaccurate Back label.** S22's call-back screen is pushed from the
   recording, so the call's default "Back to the conversation" actually returned to the preview. The
   call now says "Back to the preview".
5. **Recorded, not changed (pre-existing):** `current-run` sends the bank's generic stage description
   (`scenario.stages`, identical transition labels for all one hundred scenarios); after a run is
   terminal the response carries its final score and the learner's own resolution; one scored
   decision per stage; consequence banners are session-only; result cards show the bank's stored
   sender.
