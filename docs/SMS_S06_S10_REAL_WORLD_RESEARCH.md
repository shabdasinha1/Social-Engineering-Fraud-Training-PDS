# SMS S06–S10 — real-world research and storyline reconstruction

**Task:** IMMERSIVE-011 — the second SMS batch
**Naming:** the client's bank numbers every SMS scenario `S01`–`S25` (specification pages 88–112);
this batch is **S06–S10** in the data, the registry, the tests and this document, and it corresponds
to specification **pages 94–98**.
**Scope:** SMS S06, S07, S08, S09, S10 only. WhatsApp W01–W25, Instagram I01–I25, Email E01–E25 and
SMS S01–S05 are complete and unchanged in behaviour; SMS S11–S25 stay on the generic path.
**Status:** design record for the five SMS scenes authored by this task. **IMMERSIVE-011 COMPLETE
(20 September 2026)** — implemented, tested and browser-validated; the validation totals are in
`PROJECT_MASTER_PLAN.md` §16.33.
**Companions:** the first SMS record
[`SMS_S01_S05_REAL_WORLD_RESEARCH.md`](SMS_S01_S05_REAL_WORLD_RESEARCH.md), the five Email records
and the WhatsApp and Instagram records, which use the same method.

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

What is taken from the real world is the shape of a phone's own Messages app and of the five things
that arrive in one: an administrative-sounding request for service identity data with nothing to
click; a transaction receipt that is exactly what it claims to be; an unsolicited prize text that a
dual-SIM handset shows was sent to a list; a wrong number that becomes, six days later, an
investment pitch; and a "SIM upgrade" that needs a code the carrier itself has told the learner not
to share.

What is deliberately **not** taken is infrastructure, tooling, real brands, real carriers, real
banks, real government bodies, real draws, real trading desks, real sender IDs, real accounts, real
people, real payment rails or any real capability. "Unit Falcon", `VM-FALCON`, "Unit Portal",
"TrainCell", `VM-TRNCEL`, "Grand Fortune Draw", "Consumer Desk", "ApexQuant", "Investor Register",
"NovaCell" and `VM-NOVCEL` are fictional and describe nothing real. Every host is
`*.training.example`; every phone number is in the reserved `+91 00000 xxxxx` range; every message
list, thread, details screen, spam folder, link-details screen, photo picker, browser page, payment
sheet, dial confirmation, call and application is local, inert and offline. No image file exists
anywhere. Nothing is fetched, dialled, attached, installed, paid, approved or transferred.

**Military safety (S06).** S06 is the batch's one military scenario, and every entity in it is
synthetic. There is no real unit, formation, establishment, personnel-record system, appointment,
rank, roster, posting, movement, schedule, procedure or capability anywhere in the scene. "Unit
Falcon", its records cell, its orderly room, its `VM-FALCON` sender ID and its Unit Portal are
invented for this simulation; the service number `TR-SVC-448210` and the date of birth on the
composer chip are invented and belong to nobody; and `sceneModel.test.js` asserts that the scene
names no rank, formation or operational term at all. The behaviour being taught — *a records system
already holds your service number, so nobody administering it needs to ask you for it by text* — is
generic administrative hygiene and depends on no real-world detail.

### 0.2 Source of the threat intelligence

Primary source: **MITRE ATT&CK, website version v19.2** (released 28 April 2026), re-confirmed as
the current version on the live versions page on 20 September 2026
(<https://attack.mitre.org/versions/>, which resolves to `/resources/versions/`; v18.1 ran
28 October 2025 – 27 April 2026, v17.1 before it). Like S01–S05, this batch's primary mappings sit
partly in the **Mobile** matrix, because the delivery channel is the handset. Technique pages read
live for this batch on 20 September 2026: T1598, T1598.004, T1660, T1657, T1451, T1589, T1417.002,
T1684.001, T1585, T1583.001, T1566.002, T1111 and T1636.004.

Version note carried forward: `T1656 Impersonation` no longer exists as a top-level technique; the
current page is **T1684.001** (Social Engineering: Impersonation, parent T1684). **T1219** is named
*Remote Access Tools*.

Secondary sources, for the real-world pattern behind each scenario (all read 20 September 2026):

- **S06** — UK NCSC guidance on phishing and on organisations never asking for identity data by
  unsolicited message (<https://www.ncsc.gov.uk/guidance/phishing>); Indian national cybercrime
  portal material on identity-data collection by SMS (<https://cybercrime.gov.in/>).
- **S07** — the legitimate control; US NIST "Phish Scale" material on the cost of false alarms
  (<https://www.nist.gov/publications/phish-scale-user-guide>); US FTC material on fake
  customer-service numbers found through search
  (<https://consumer.ftc.gov/articles/how-spot-avoid-and-report-tech-support-scams>).
- **S08** — US FTC material on prize and lottery scams and advance fees
  (<https://consumer.ftc.gov/articles/prize-scams>); Europol material on mass SMS lures
  (<https://www.europol.europa.eu/>).
- **S09** — US FBI/IC3 and FTC material on "pig butchering" relationship-investment fraud that
  begins with an accidental-looking message (<https://www.ic3.gov/>,
  <https://consumer.ftc.gov/articles/what-know-about-romance-scams>).
- **S10** — UK NCSC and US FCC material on SIM-swap and port-out fraud and on never relaying a
  one-time code (<https://www.ncsc.gov.uk/guidance/phishing>, <https://www.fcc.gov/>).

**Source-confidence note.** Where a secondary source is cited by its landing page rather than by a
dated article, that is deliberate: the landing page is the one a reviewer can re-open. Nothing in
this document rests on a secondary source for a *behavioural* claim that ATT&CK is asked to carry.
The ATT&CK citations are the load-bearing ones, every one is linked to its own technique page, and
`sceneResearch.test.js` fails the build if a technique is named here without its page. **ATT&CK
research does not affect scoring in any way**: the scores are the bank's, pinned by
`sceneAffordance.test.js`.

### 0.3 Interpretation rule

ATT&CK is used as a **behavioural reference, not a checklist**. A mapping is recorded only where the
technique's own description describes what the scenario does, and each is marked **direct**,
**supporting** or **partial**. **S07 has no mapping, and that is stated** — a genuine recharge
receipt for a recharge the learner made themselves involves no adversary. Techniques were
**considered and rejected** where they nearly fit but do not, each with its reason. Three behaviours
in this batch have **no dedicated ATT&CK technique** and the sections say so rather than forcing
one: the abuse of a **registered sender ID / carrier sender identity** (carried forward from
S01–S05); **bulk SMS delivery to a list**, which a dual-SIM handset exposes and which ATT&CK models
only as "non-targeted phishing" without a delivery-pattern technique; and **long-game relationship
grooming**, the multi-day rapport build that precedes S09's financial ask.

### 0.4 What this document may and may not change

| Thing | May IMMERSIVE-011 change it? |
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

**Canonical identity.** Every family and trigger below is the bank's own, normalised by the existing
canonical taxonomy (`attack-family-taxonomy.v1.json`, `trigger-taxonomy.v1.json`); no identifier was
invented. S06 → `identity_data_harvesting`; S07 → `legit_system_confirmation`; S08 →
`unsolicited_payment_lure`; S09 → `relationship_grooming_fraud`; S10 →
`account_takeover_authorisation_abuse`.

**S06's split sender and body.** The generator stored the client's stage-1 sentence as a `sender` of
`"Unit Records"` and a `body` of `"Reply SERVICE NO + DOB to keep your personnel file active."` The
toast shows both, which reconstructs the client's sentence exactly. In the thread the two are
reassembled into one bubble, `Unit Records: <body>`, because on SMS a name that is not a registered
sender ID is a **signature inside the text**, not an identity the network supplies — and the thread
header therefore shows the ten-digit number, which is what the client's stage-2 text calls it ("An
unknown number claims to be the unit clerk").

**S07's placeholder sender identifier.** The generator stored S07's sender as the bare number
`+91 00000 88047`, which contradicts the client's own stage-2 text ("A registered telecom header
confirms the exact recharge"). Handled as in I15, E09, E12, E18, E25 and S05: the scene prints the
header the client's text requires (`VM-TRNCEL`) as the thread title and on the toast, keeps the
generated number as the **gateway number behind the header** on the details screen — which is what a
registered sender ID actually has behind it — and names the bank's sender **asset id** on the
inspection control. No real sender ID or number is invented.

**S09's elided notification body.** The bank stores S09's notification body as
`"Sorry, is this Rohan? ... You seem kind. My analyst has a guaranteed trade tonight."` — an elision
of two messages days apart, with the client's own ellipsis in it. It is carried **verbatim** as the
conversation-list preview, because that is where a one-line summary belongs, and the thread itself
carries the two halves in their own places, six days apart, with the learner's own replies between
them. Nothing is paraphrased and nothing is invented.

**The narrator line is not printed.** No `prior_context` sentence is displayed on the device for any
of the five. The verdict-word assertion applies the platform-wide list to every control label, hint
and echo, so no control names the verdict; report controls say "Report the message as junk".

**Answer-revealing asset prose is not displayed.** S08's and S09's `browser_page` assets carry the
client's stage-4 sentence as their `body`; the scenes use only their `display_target` and `host`,
never the narrating sentence.

**The trigger word is not printed.** S06's canonical trigger primitive is a single common English
word, and `sceneModel.test.js` asserts that word appears nowhere in the scene — the same rule the
disposition, family and end state have always had.

**The result card placeholder** (known limitation carried from earlier scenes) applies to all five.

---

## 0.6 Differentiation from SMS S01–S05, Email E01–E25, WhatsApp W01–W25 and Instagram I01–I25

A comparison against all eighty earlier scenes was made **before** implementation, on story
archetype, attack family, trigger combination, difficulty, branch shape, verification method,
decision home, resolution sequence, surface sequence and psychological lever:

| | Behavioural lesson | Social mechanism | Primary evidence | Decision home | Verification pattern | Unsafe temptation |
| --- | --- | --- | --- | --- | --- | --- |
| **S06** *(military)* | A records system already holds what it is asking you for | Claimed position + a closing time | Ten-digit mobile, not the unit's own sender ID; the unit's real texts all point at the portal and ask nothing; the file is active with nothing outstanding | **The composer and the phone's photo picker — nothing else** | The unit portal; the orderly room on the approved-directory number | Send the identity line; attach the photograph of the card; reply |
| **S07** *(legitimate)* | The receipt is fine; what you do next is the risk | Reflex | Sixty-one messages from the same registered sender ID, none with a link; the app shows the same amount, method, time and reference | **The provider app, against a searched-for care number** | The provider app's own recharge line; the care number printed on the SIM pack | Delete the receipt; reply with the account number; ring the first search result |
| **S08** | A message sent to a list is not a message to you | Greed + a deadline | The identical text on both SIM cards in the same second; four of the same sentence in the phone's spam folder; a host registered nine days ago | **A claim page: identity first, the 499 second** | The Consumer Desk register; the consumer helpline in the directory | Open the address; submit the winner details; pay the release fee |
| **S09** | The rapport was the product | Six days of being pleasant | The learner's own replies, in the thread; nine messages counted and attributed; a register with no such desk; a payee who is a person | **The composer, and a payment sheet raised by the desk** | The investor register; the helpline published in it | Reply again; send the account details; send the deposit |
| **S10** | The code is not a login — it is the number itself | Claimed position + convenience | The carrier's own thread, two minutes later, saying DO NOT SHARE and naming what the code authorises; the carrier app shows no request | **The carrier's own conversation, and the dial confirmation** | The carrier app; the carrier on the number printed on the bill | Ring the desk; read the code out; reply YES to the transfer |

**What makes these SMS and not the messenger.** The same platform grammar S01–S05 established —
category tabs, a header that is often only a number, the registered-sender-ID distinction, the
unsaved-sender bar, link preview cards that show an address as written — plus four things this batch
uses for the first time in the product:

- **The composer as the only attack surface (S06).** No address, no attachment, no call. The single
  scene in eighty-five whose two `−8` routes are both things the learner would *type or attach into
  the reply field*, with the phone's own photo picker as the second one.
- **Dual-SIM delivery and the phone's own spam folder (S08).** A handset can prove a blast in a way
  no mailbox can: the same text, on both of your numbers, in the same second — and four more of the
  same sentence already filed under Spam. The safe branch is reached from the app's own
  unsaved-sender bar, which no earlier scene has used for a scored control.
- **The learner's own outgoing messages as evidence (S09).** Three blue bubbles in the thread, six
  days of turns counted and attributed on the details screen. No earlier scene makes what the
  learner already did part of the evidence.
- **A scored decision taken inside another SMS thread (S10).** The releases sit on the *carrier's*
  conversation — the screen that is simultaneously the temptation and the warning. S10 is the only
  scene in the product whose branch controls live on an `SMS`-kind surface.

**What S06–S10 are not.** None is a credential login page reached from an email, a macro attachment,
a QR code, an OAuth consent, a group chat, a feed post, a DM or an installed package. The nearest
earlier scenes, and how they differ:

- **S07 and S03** are both matching-receipt legitimate controls on SMS. They are separated by the
  priced mistake. S03's is **blocking the registered sender**, which removes a future safety net.
  S07's are **deleting the receipt** (losing proof of a payment), replying to a sender ID that
  cannot receive replies, and — the one that actually happens — **searching for a care number and
  ringing the first result**, which on this phone is a paid aggregator listing. Different branch
  shape, different decision home, different lesson. Recorded as an intentional overlap of family.
- **S09, W22 and I16** all involve a stranger who builds rapport. W22 spans weeks on WhatsApp with a
  biography that moves; I16 is a DM inside a social app. S09 differs in channel, in the fact that
  **the learner already answered** and those answers are on screen, and in the ask: a deposit to a
  named individual's account, raised from the desk's own page onto the phone's payment sheet.
- **S10 and S02** are both SMS scenes with a voice at the end of a number in the text. S02's two
  `−8` routes are things the **operator asks for on the call**, and reaching the call is free. S10
  inverts it: **ringing the number is itself the `−3`**, taken on the phone's dial confirmation, and
  the two `−8` routes are in the carrier's own conversation, reachable without calling at all.
- **S06 and E19** both collect identity data by direct request. E19 is a questionnaire attachment on
  an enterprise mailbox; S06 has no attachment inbound at all and no page anywhere. Recorded as an
  intentional overlap of mechanism with distinct branch shapes and decision homes.
- **S08, S01, S04 and S05** all end on a page in the offline browser. They are separated by what the
  learner must notice — the *sender* (S01), a *detail that does not match* (S04), *what a small
  charge really is* (S05) and *who else got the same message* (S08) — and by four different decision
  homes and four different safe branches.

**Differentiation, asserted.** `sceneModel.test.js` asserts that **none of S06–S10 repeats a
branch-stage shape of any of the eighty earlier scenes, or of each other**; that **each of the ten
SMS scenes has a decision home no other SMS scene shares**; that every SMS scene opens on the
message list with the phone's own categories including Spam; that the beats use only the SMS
vocabulary and none of the messenger's; that S07 alone offers `reject_ignore`; that S06 names no
rank, formation or operational term; and that **every scored branch surface *and page* is reachable
without spending the branch**.

---

## 1. S06 — Service-Number Confirmation

### Client scenario (authoritative)

Specification page 94. SMS, **Easy**, **Malicious**, family *Military impersonation / identity
collection*, trigger *Authority | FICTIONAL MILITARY CONTEXT*. Canonical identity: family
`identity_data_harvesting`, trigger the single canonical primitive the bank normalises that string
to, military flag **true**, level `easy`.

- **Stage 1 (Event).** "Unit Records: Reply SERVICE NO + DOB to keep your personnel file active."
- **Stage 2 (Open).** The unsaved administrative-looking thread. An unknown number claims to be the
  unit clerk and asks for a service number and a date of birth.
- **Stage 3 (Inspect).** Full number, generic sender, absent case reference, excessive data request.
  Decision signal: *a personal SMS number is not the approved personnel-record channel and the data
  request is excessive.*
- **Stage 4 (Branch).** A quick-reply composer with synthetic identity chips.
- **Stage 5 (Verify).** Contact the unit clerk through the approved directory or in person.
- **Stage 6 (Resolve).** Do not reply; report through unit security; block the number.

### MITRE ATT&CK alignment

| Technique | Fit | Why this maps |
| --- | --- | --- |
| [T1598 Phishing for Information](https://attack.mitre.org/techniques/T1598/) | **Direct** | The technique's own description covers exactly this shape: a message whose objective is *gathering data from the victim rather than executing malicious code*, obtained "directly through the exchange of emails, instant messages, or other electronic conversation means". There is no link, no attachment and no payload in S06 — the reply is the payload. |
| [T1589 Gather Victim Identity Information](https://attack.mitre.org/techniques/T1589/) | **Supporting** | What is being collected is exactly what this technique enumerates — personal data and identity details — and the page names "direct elicitation via Phishing for Information" as a way of gathering it. |
| [T1684.001 Social Engineering: Impersonation](https://attack.mitre.org/techniques/T1684/001/) | **Supporting** | The sender claims a position it does not hold — the unit clerk — to make the request answerable. |
| [T1660 Phishing (Mobile)](https://attack.mitre.org/techniques/T1660/) | **Partial fit, stated** | The channel is a text message to a handset, which this technique covers, but its description is about sending *malicious content* to gain access to the device — a link, an attachment, code. S06 sends none of those, so the Mobile technique is recorded as the delivery half only. |

**The gap, stated.** ATT&CK models the phishing message; it still has **no technique for the
carrier-level sender identity** — the registered sender ID an organisation books and an impostor
cannot, which is the tell this scene turns on. The absence is recorded rather than filled with a
near-miss.

**Considered and rejected.**

- [T1636.004 Protected User Data: SMS Messages](https://attack.mitre.org/techniques/T1636/004/) —
  requires malware already installed and reading the message store. Nothing is installed in S06 and
  nothing reads anything; the learner is asked to type.
- [T1566.002 Phishing: Spearphishing Link](https://attack.mitre.org/techniques/T1566/002/) — there is
  no link anywhere in this scenario, which is the point of it.

**What must NOT be copied.** No real unit, formation, establishment, appointment, rank, roster,
posting, location, schedule, procedure, capability, personnel-record system or sender ID appears.
The service number and date of birth on the composer chip are invented strings that identify nobody.
Nothing is attached: the photo picker holds three rows of text describing photographs, there is no
image file in the product, and the picker's own note says so.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The list row preview and the message bubble, reassembled from the bank's split sender and body |
| "An unknown number claims to be the unit clerk" | The thread header is the ten-digit number; the details screen's "Signs itself" row carries the claimed name |
| "Full number, generic sender" | The details screen: sender type, registered sender ID (none), in your contacts (no) |
| "Absent case reference" | The details screen's "Case or reference quoted: None" row |
| "Prior thread" | There is none from this number — and the Service tab holds the unit's own texts from `VM-FALCON`, reachable from the menu |
| "SIM label" | "Received on: SIM 2 · TRAINING NET" |
| "A quick-reply composer with synthetic identity chips" | The composer, with the identity chip and a neutral reply chip beside it |
| "Do not send service number, date of birth **or document photo**" | The photo picker is the second release, and closing it is a safe branch on the same screen |
| "Contact the unit clerk through the approved directory/in person" | `verify_trusted_directory` → the approved directory; `verify_known_number` → the orderly room; the portal says records are amended at the counter |
| "Do not reply; report through unit security; block the number" | `resolve_report` / `resolve_block` |

### Enhanced synthetic storyline

At 11:18 a text arrives on SIM 2 from a ten-digit number the phone has never seen. It signs itself
"Unit Records" and asks for a service number and a date of birth so the personnel file stays active;
three minutes later it adds that a photograph of the identity card is also accepted, and that the
cell closes at 1800. One tab away, under Service, sit the unit's actual messages — a leave approval,
a pay slip notice, a medical reminder — every one from `VM-FALCON`, every one pointing at the unit
portal, and not one of them asking a question.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast: the claimed name and the client's sentence |
| Open | The message list, Personal selected, with the Service and Spam tabs beside it |
| Inspect | The thread, the unsaved-sender bar; the conversation details; how a file is updated; the unit's own messages |
| Branch | Send the identity line, attach the photograph, close the picker, reply, or leave it for the portal |
| Verify | The approved directory, the orderly room, the portal |
| Resolve | Report through unit security; or send the details before the cell closes |

### Evidence the learner can discover (progressive)

1. The app's own bar: this number is not in the contacts.
2. The details screen: ten-digit mobile, no registered sender ID, no case reference, a claimed name.
3. "How a personnel file is updated": in the portal, or at the counter — never by text.
4. The unit's own thread: four messages from `VM-FALCON`, all pointing at the portal, none asking
   anything.
5. The portal: file active, last updated 2 September, actions needed none — and a line saying the
   records cell never asks for a service number, a date of birth or a photograph of the card.
6. The orderly room, on the approved-directory number, saying the same thing.

### Learner interaction journey

Notify → open the message → the details screen → how a file is updated → the unit's own messages →
back → leave it and open the unit portal → look up the support desk in the trusted directory →
report it through unit security.

### Simulation surfaces

- `details` (`SMS`): conversation details, with a page on how a file is actually updated.
- `history` (`SMS`): everything `VM-FALCON` has sent.
- `gallery` (`VIEWER`): the phone's photo picker — the second release, and the safe close beside it.
- `unitapp` (`APP`): the learner's own unit portal.
- `roomcall` (`CALL`): the orderly room, on the approved-directory number.

### Verification mechanism

`verify_trusted_directory` lists the support desk and the scene's directory extra names the orderly
room with its provenance; `verify_known_number` calls it; `verify_known_app` opens the portal.
Replying to the number to ask them to confirm is `verify_in_message_contact`, worth `0`.

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_sender →
safe_pivot (leave it and open the unit portal) → verify_trusted_directory → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Send the service number and date of birth | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Attach the photograph and send it | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Reply asking who this is | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Ask the sender to confirm, at verify | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |
| Send the details at the end | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`,
`SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`. Both releases are the `−8`; the reply is the `−3`; closing
the picker and opening the portal are the two `+3`s. The picker is opened from the menu by local
navigation, so neither release is hidden behind the other.

### Why the final simulation stays faithful

Every client element is present: the unsolicited administrative text from a mobile number, the
excessive data request, the absent case reference, the quick-reply composer with identity chips, the
document photograph the client's stage-4 text names, the approved directory and the clerk as the
checks, and the report-through-unit-security resolution. What the scene adds is the comparison the
platform makes available — the unit's own registered sender ID and its four messages, in the same
app, one tab away — and a portal that answers the question the text pretends to be asking.

---

## 2. S07 — Expected Recharge Confirmation

### Client scenario (authoritative)

Specification page 95. SMS, **Easy**, **Legitimate**, family *Legitimate service receipt*, trigger
*Routine*. Canonical identity: family `legit_system_confirmation`, the single canonical primitive the
bank normalises that trigger to, military flag **false**, level `easy`.

- **Stage 1 (Event).** "Recharge of INR 299 successful for xx7710. Validity 28 days. No action
  required."
- **Stage 2 (Open).** The established provider thread. A registered telecom header confirms the exact
  recharge the learner initiated in the synthetic provider app.
- **Stage 3 (Inspect).** Registered header, masked number, amount, timing and no-action text.
  Decision signal: *the alert matches the learner-initiated transaction and asks for no link, reply
  or personal information.*
- **Stage 4 (Branch).** The provider-app receipt comparison card. Expected: *use the normal in-app
  path only after the details match the known context. Do not switch to an untrusted channel.*
- **Stage 5 (Verify).** Compare the transaction in the known provider app; do not report or block a
  legitimate sender.
- **Stage 6 (Resolve).** Mark reviewed; retain or archive; do not report or block.

### MITRE ATT&CK alignment

**There is none, and none has been invented.** ATT&CK catalogues adversary behaviour. The item under
assessment in S07 is a genuine transactional receipt for a recharge the learner made themselves
fifteen seconds earlier, from the provider's own application, on their own account. There is no
adversary, no campaign, no infrastructure and no technique, and no mapping has been forced.

**Closest defensible behavioural reference.** The behaviour this scene actually prices is the
**learner's own reaction**, and the reference material for it is defensive rather than adversarial:
NIST's work on the operational cost of false alarms, and the consumer-protection advisories on
paid-placement "customer care" listings that appear above official ones in search results. Both are
cited in §0.2. The paid-listing screen in this scene depicts that documented pattern so that the
costed branch is a realistic one — but the *message being assessed* is genuine, so no adversary
technique is claimed for the scenario, and none is named anywhere in this section.

**What is deliberately not claimed.** Nothing in this section should be read as asserting that a
legitimate receipt corresponds to an adversary behaviour, and the guard suite enforces the absence:
`sceneResearch.test.js` fails if any technique identifier appears in an unmapped scenario's section.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The list row preview and the message bubble |
| "A registered telecom header" | The thread title and the toast are `VM-TRNCEL`; the details screen's first check names it |
| "Masked number" | The amount card and the details screen both show the account as `xx7710` |
| "The exact recharge the learner initiated in the synthetic provider app" | The provider app's "Last recharge" section: the same amount, time, method and reference |
| "Prior thread" | A year of the same receipts, in the thread and on its own screen |
| "SIM label" | "Received on: SIM 1 · TRAINING NET" |
| "Report-junk controls" | In the verify sheet, where reporting a genuine sender costs |
| "The provider-app receipt comparison card" | The `APP` surface, with the scored control on it |
| "Do not switch to an untrusted channel" | The searched-for care number is the priced switch |
| "Compare the transaction in the known provider app" | `verify_known_app`; `verify_known_number` calls the number on the SIM pack |
| "Mark reviewed; retain/archive; do not report/block" | `resolve_continue` / `resolve_retain` `+2`; `resolve_report` `−4` |

### Enhanced synthetic storyline

At 15:06 the learner recharged their own number from the TrainCell app. At 15:07 the receipt
arrives, from the sender ID that has been sending them receipts since March 2025 — sixty-one of
them, the same masked account on every one, not one carrying an address or a number. Under Spam,
filed by the phone, is a text from an unknown mobile saying the recharge *failed* and offering a
retry link; it is not the item under assessment, and it is there because that is what a real inbox
looks like on the day you recharge.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast: the sender ID and the client's sentence |
| Open | The message list, Transactions selected, the Personal and Spam tabs beside it |
| Inspect | The thread with a month of receipts, the amount card, the details screen, the sender's whole history |
| Branch | Match it in the app, delete the receipt, reply with the account number, or ring a searched-for number |
| Verify | The provider app, the care number on the SIM pack, the directory |
| Resolve | Keep the receipt and carry on; archive it; or report it |

### Evidence the learner can discover (progressive)

1. The thread itself: three earlier receipts in the same shape, and a day divider above today's.
2. The amount card: account, plan, method and reference, laid out as the alert sends them.
3. The details screen: a registered six-character sender ID, the gateway number behind it, and
   "asks you to do anything: no".
4. The sender's whole history: sixty-one messages, one sender ID, no address in any of them.
5. The provider app: the same INR 299 at 15:06, by UPI from that app, reference `TC-2609-77104`.
6. The care number printed on the SIM pack — and, if the learner searches instead, two paid listings
   that print the same unrelated number.

### Learner interaction journey

Notify → open the receipt → the details screen → the sender's history → back → open the recharge in
the provider app → match it against the receipt → compare the recharge history → keep the receipt
and carry on.

### Simulation surfaces

- `details` (`SMS`): conversation details for a registered sender ID.
- `history` (`SMS`): everything `VM-TRNCEL` has ever sent.
- `telecom` (`APP`): the learner's own provider app, with the recharge on it.
- `search` (`BROWSER`): what a search for a care number actually returns — two paid placements.
- `carecall` (`CALL`): the provider, on the number printed on the SIM pack.

### Verification mechanism

`verify_known_app` opens the provider app and compares the recharge; `verify_known_number` calls the
number printed on the SIM pack; `verify_trusted_directory` lists the support desk, and the scene's
directory extra names customer care with its provenance. Replying to the sender ID is
`verify_in_message_contact`, worth `0`. Reporting or blocking is `FALSE_REPORT_BLOCK`, `−4`.

### Safe resolution

`resolve_continue` or `resolve_retain`, `+2`. Full safe path: `open_item → read → inspect_sender →
safe_pivot (match it against the recharge in your account) → verify_known_app → resolve_continue` =
**10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Delete the receipt from this thread | `reject_ignore` | `NEEDLESS_REJECT_IGNORE` | −2 |
| Reply with the account number | `reply` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Call the number in the first search result | `call_number` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Report or block the sender, at verify | `report` / `block` | `FALSE_REPORT_BLOCK` | −4 |
| Report it as junk at the end | `resolve_report` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `CORRECT_USE +3`, `NEEDLESS_REJECT_IGNORE −2`, `UNSAFE_EXTERNAL_ACTION −4`. Matching
the receipt in the app is the `+3`; deleting it is the `−2`; replying and ringing the aggregator are
the two `−4`s. The app and the search page are both opened by local navigation, so every branch is
reachable without spending another.

### Why the final simulation stays faithful

Every client element is present: the registered header, the masked account, the amount, the timing,
the no-action wording, the matching transaction in the provider app, the comparison card as the
stage-4 decision, the in-app verification route, and the instruction not to report or block a
legitimate sender. What the scene adds is the client's own warning made concrete — "do not switch to
an untrusted channel" is not an abstraction once the untrusted channel is two paid listings above
the fold.

---

## 3. S08 — Lottery Claim Text

### Client scenario (authoritative)

Specification page 96. SMS, **Easy**, **Malicious**, family *Prize/advance-fee scam*, trigger *Greed
+ scarcity*. Canonical identity: family `unsolicited_payment_lure`, triggers the two canonical
primitives the bank normalises that string to, military flag **false**, level `easy`.

- **Stage 1 (Event).** "CONGRATS! You won INR 5 lakh. Pay INR 499 processing before midnight."
- **Stage 2 (Open).** The unsolicited prize thread. An unknown sender says the learner won a lottery
  they never entered and must pay a processing fee.
- **Stage 3 (Inspect).** Unknown number, no entry history, fee demand, urgent deadline. Decision
  signal: *a genuine prize cannot arise without entry and should not require payment to release
  winnings.*
- **Stage 4 (Branch).** A claim form with identity and payment fields.
- **Stage 5 (Verify).** Verify any promotion through an independently found official organiser.
- **Stage 6 (Resolve).** Do not reply or pay; report junk or block.

### MITRE ATT&CK alignment

| Technique | Fit | Why this maps |
| --- | --- | --- |
| [T1660 Phishing (Mobile)](https://attack.mitre.org/techniques/T1660/) | **Direct** | The technique names non-targeted mass campaigns delivered to handsets and the use of text messages to make victims act quickly. That is this message exactly, and the dual-SIM delivery is the "non-targeted" half made visible. |
| [T1657 Financial Theft](https://attack.mitre.org/techniques/T1657/) | **Direct** | The objective is money taken by social engineering "aimed at their own financial gain at the expense of the availability of these resources for victims" — the release fee is the whole scheme, and the identity page in front of it is what makes the second payment possible. |
| [T1684.001 Social Engineering: Impersonation](https://attack.mitre.org/techniques/T1684/001/) | **Supporting** | The sender poses as a prize-release desk with a named claim officer so that the fee reads as administration. |
| [T1583.001 Acquire Infrastructure: Domains](https://attack.mitre.org/techniques/T1583/001/) | **Supporting** | A host stood up for the approach and nothing else; the link-details screen shows it was registered nine days ago. |
| [T1417.002 Input Capture: GUI Input Capture](https://attack.mitre.org/techniques/T1417/002/) | **Partial fit, stated** | The sub-technique is about prompting for sensitive information on a constrained mobile display, which the claim page does — but its description is about *mimicking* an existing operating-system or application component, and there is no genuine "Grand Fortune" interface to mimic. Recorded as partial. |

**The gap, stated.** ATT&CK describes non-targeted phishing, but it has
**no technique for the bulk delivery pattern** itself — the list, the blast, the same sentence to
four numbers and to both of one
handset's SIM cards, which is the single most decisive piece of evidence on this platform and the one
this scene is built on. It is recorded as a gap rather than mapped to a near-miss.

**Considered and rejected.**

- [T1598 Phishing for Information](https://attack.mitre.org/techniques/T1598/) — reconnaissance to
  enable later targeting. Here the identity page exists to complete a payment, not to prepare an
  intrusion, and the money is the objective.
- [T1566.002 Phishing: Spearphishing Link](https://attack.mitre.org/techniques/T1566/002/) — the
  Enterprise link sub-technique is email-borne and targeted; this is an untargeted SMS blast, which
  is what the Mobile technique covers.

**What must NOT be copied.** No real draw, lottery, organiser, regulator, consumer body, bank, prize
or claim process appears. The page collects nothing: the five fields are local, the account and the
bank code are `FIELD_KIND.DIGITS`, no value reaches an affordance, a request, storage or the ledger,
and no payment rail exists anywhere in the product.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The list row preview and the message bubble |
| "Unknown number" | The thread header, the details screen and the unsaved-sender bar |
| "No entry history" | The details screen's "Draw or ticket quoted: None"; the Consumer Desk register finds no scheme |
| "Fee demand" and "urgent deadline" | The second bubble names the claim officer and midnight; the fee page states INR 499 |
| "Prior thread" | There is none from this number — and four of the same sentence sit in the phone's spam folder |
| "SIM label" | "Delivered to: SIM 1 and SIM 2, both at 16:25:04" |
| "A claim form with identity and payment fields" | The `BROWSER` surface: winner details on one page, the release fee on the next |
| "Verify any promotion through an independently found official organiser" | The Consumer Desk app the learner opens, and the helpline in the directory |
| "Do not reply/pay; report junk/block" | `resolve_report` / `resolve_block` |

### Enhanced synthetic storyline

At 16:25 the text arrives — and arrives twice, once on each SIM, in the same second. Two minutes
later a second message names a claim officer and says the release desk closes at midnight. The phone
has filed four of the same sentence under Spam over the last month: INR 8 lakh, INR 3 lakh, INR 5
lakh, INR 12 lakh, from four different numbers, the wording identical every time. The address in the
message is short; the link-details screen expands it to a host registered nine days ago.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast: the sending number and the client's sentence |
| Open | The message list, Personal selected, with the Transactions and Spam tabs beside it |
| Inspect | The thread, the unsaved-sender bar, the link card; the details screen; the spam folder; the link details |
| Branch | Open the address, submit the winner details, pay the fee, reply, or compare it with the spam folder |
| Verify | The directory, the consumer helpline, the Consumer Desk app |
| Resolve | Report it as junk and claim nothing; or complete the claim before midnight |

### Evidence the learner can discover (progressive)

1. The app's own bar: this number is not in the contacts.
2. The thread: the same message reached SIM 2 at the same time.
3. The details screen: both SIMs at 16:25:04, no registered sender ID, no draw or ticket quoted.
4. The spam folder: four numbers, four amounts, one sentence.
5. The link-details screen: a host registered nine days ago, and no organiser named anywhere.
6. The Consumer Desk register: no scheme of that name, forty-one complaints about the same wording —
   and the rule that nothing is ever charged to release a prize.

### Learner interaction journey

Notify → open the message → the details screen → the spam folder → the link details → back → compare
it with the others in the spam folder → open the Consumer Desk app and search for the draw → report
it as junk.

### Simulation surfaces

- `details` (`SMS`): conversation details, including the dual-SIM delivery.
- `linkinfo` (`SMS`): what was written, where it goes, and how old the host is.
- `spamfolder` (`SMS`): the phone's own spam folder — four of the same sentence.
- `claim` (`BROWSER`): winner details, then the release fee; each page links to the other.
- `consumer` (`APP`): the Consumer Desk register.
- `officecall` (`CALL`): the consumer helpline, on the directory's number.

### Verification mechanism

`verify_trusted_directory` lists the support desk and the scene's directory extra names the consumer
helpline with its provenance; `verify_known_number` calls it; `verify_known_app` opens the register.
Replying to the number is `verify_in_message_contact`, worth `0`.

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_sender →
safe_pivot (compare it with the others in the spam folder) → verify_known_app → resolve_report` =
**10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Submit the winner details | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Pay the INR 499 release fee | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Open the address | `open_link` | `RISKY_OPEN_REPLY` | −3 |
| Reply to start the claim | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Complete the claim at the end | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.
The two releases sit on two pages of the same site, and **each page links to the other**, so a
learner who refuses the identity page can still walk to the fee page and refuse that one too —
neither `−8` is hidden behind the other, and the site itself is opened from the menu.

### Why the final simulation stays faithful

Every client element is present: the unsolicited prize, the fee, the midnight deadline, the unknown
number, the absence of any entry, the claim form with identity and payment fields, the independently
found organiser as the check, and the report-junk resolution. What the scene adds is the proof the
platform can supply and no other can — the same sentence on both SIM cards in the same second, and
four more of it already filed under Spam.

---

## 4. S09 — Wrong Number Becomes an Investment Pitch

### Client scenario (authoritative)

Specification page 97. SMS, **Medium**, **Malicious**, family *Wrong-number grooming / investment
fraud*, trigger *Curiosity + trust*. Canonical identity: family `relationship_grooming_fraud`,
triggers the two canonical primitives the bank normalises that string to, military flag **false**,
level `medium`.

- **Stage 1 (Event).** "Sorry, is this Rohan? ... You seem kind. My analyst has a guaranteed trade
  tonight."
- **Stage 2 (Open).** The multi-day wrong-number thread. A polite wrong-number exchange develops over
  several synthetic days before pivoting to private investments.
- **Stage 3 (Inspect).** Unsolicited start, rapid rapport, lifestyle claims, investment pivot.
  Decision signal: *the accidental contact and relationship are engineered to establish trust before
  the financial request.*
- **Stage 4 (Branch).** A fake trading dashboard showing a trial profit and a Deposit button.
- **Stage 5 (Verify).** Research the person and platform independently; check regulator or official
  sources.
- **Stage 6 (Resolve).** Stop responding; report junk or block; do not invest.

### MITRE ATT&CK alignment

| Technique | Fit | Why this maps |
| --- | --- | --- |
| [T1657 Financial Theft](https://attack.mitre.org/techniques/T1657/) | **Direct** | The technique's own description names **"pig butchering"** among the campaign types whose ultimate objective is financial theft, and describes victims being "deceived into sending money to financial accounts controlled by an adversary" after successful social engineering. That is precisely the deposit, and precisely who the payee is. |
| [T1660 Phishing (Mobile)](https://attack.mitre.org/techniques/T1660/) | **Supporting** | The approach and the link to the desk are both delivered as text messages to the handset; the technique covers non-targeted messages that lead a victim to act. |
| [T1585 Establish Accounts](https://attack.mitre.org/techniques/T1585/) | **Partial fit, stated** | The persona work the technique describes — "development of public information, presence, history and appropriate affiliations" — is exactly what six days of small talk does. But the technique is about accounts created *with services*, and what is established here is a phone number and a story. Recorded as partial. |

**The gap, stated.** ATT&CK has **no technique for long-game relationship grooming**. It models the
message that carries the lure and the theft at the end, but not the five days of nothing in
particular in between, which is the part that does the work and the part this scene is built to make
visible. The absence is recorded rather than filled.

**Considered and rejected.**

- [T1684.001 Social Engineering: Impersonation](https://attack.mitre.org/techniques/T1684/001/) —
  named here only to reject it. "Meera" impersonates nobody: she is an invented person, not a trusted
  entity being spoofed, and impersonation is the one social-engineering technique that does not apply
  to this scenario. (It is the mapping most likely to be assumed, which is why it is stated.)
- [T1598 Phishing for Information](https://attack.mitre.org/techniques/T1598/) — the objective is the
  deposit, not information for later targeting; the account details the composer can send are there
  to make the payout story work, not to enable an intrusion.
- [T1583.001 Acquire Infrastructure: Domains](https://attack.mitre.org/techniques/T1583/001/) — the
  desk's host exists, but nothing in the scene turns on the infrastructure; the payee is a personal
  account and the site is a display.

**What must NOT be copied.** No real person, trading platform, broker, regulator, register, adviser,
instrument or account appears. "Meera", "ApexQuant" and the Investor Register are invented; the trial
balance is drawn text; the payee name on the payment sheet is fictional; the account and branch code
on the composer chip identify nothing. The payment sheet's PIN is local, `FIELD_KIND.SECRET`, masked
by CSS and never `type="password"`, and no value reaches an affordance, a request, storage or the
ledger.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's notification body, verbatim | The list row preview, exactly as the bank stores it, ellipsis and all |
| "A polite wrong-number exchange over several synthetic days" | Nine beats across three day dividers — Monday, Wednesday, today |
| "Unsolicited start" | The details screen's "Who wrote first: the other number" |
| "Rapid rapport" | The learner's own two replies are in the thread, in blue |
| "Lifestyle claims" | Wednesday's "I only work mornings now"; today's "4.2 lakh since April" |
| "Investment pivot" | Today's two messages and the link card under them |
| "Prior thread" | The six-days page on the details screen, every turn attributed |
| "SIM label" | "Received on: SIM 1 · TRAINING NET" |
| "A fake trading dashboard showing a trial profit and a Deposit button" | The `BROWSER` surface, with the trial balance and a Deposit that raises the phone's payment sheet |
| "Research the person/platform independently; check regulator/official sources" | `verify_known_app` → the Investor Register; `verify_known_number` → the helpline it publishes |
| "Stop responding; report junk/block; do not invest" | `resolve_report` / `resolve_block` |

### Enhanced synthetic storyline

Monday, 09:39: "Sorry, is this Rohan?" The learner said it was the wrong number; she thanked them for
replying, because most people do not. Wednesday evening she wrote again, and the learner answered in
one line. She mentioned, in passing, that she only works mornings now. Today at 15:04 there is an
analyst and a guaranteed trade and a figure, and at 15:06 a desk with a trial in the learner's name
on it. The register has no intermediary of that name; the deposit sheet pays an individual.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast: the sending number and the bank's stored body |
| Open | The message list, Personal selected, with the Transactions and Spam tabs beside it |
| Inspect | Six days of thread, the learner's own replies, the link card; the details screen; the six-days page; the link details |
| Branch | Reply again, send the account details, send the deposit, or look the desk up in the register |
| Verify | The register, the investor helpline, the directory |
| Resolve | Stop replying and report; or take the trade tonight |

### Evidence the learner can discover (progressive)

1. The app's own bar: six days in, this number is still not saved.
2. The thread: the learner's own two replies, and what came after each of them.
3. The details screen: nine messages over six days, three of them the learner's, and who wrote first.
4. The six-days page: five messages of nothing in particular, then money.
5. The link-details screen: a host registered five weeks ago, no firm number and no address on it.
6. The desk's own terms: operator not stated, registration not stated, deposits to an individual
   account, withdrawals reviewed manually and possibly requiring a further deposit.
7. The Investor Register: no match, nine published warnings about desks collecting to individual
   accounts — and the rule that client money is never held in an individual's account.

### Learner interaction journey

Notify → open the conversation → the details screen → the six days in order → the link details →
back → open the address and read the desk's terms → leave the thread and look the desk up in the
register → call the investor helpline → stop replying and report the conversation.

### Simulation surfaces

- `details` (`SMS`): conversation details, with a page laying out all six days.
- `linkinfo` (`SMS`): what was written, and where it goes.
- `trading` (`BROWSER`): the desk, its trial balance, and its terms page.
- `deposit` (`PAYSHEET`): the phone's own payment sheet, paying an individual.
- `register` (`APP`): the Investor Register.
- `regcall` (`CALL`): the investor helpline, on the number the register publishes.

### Verification mechanism

`verify_known_app` opens the register and searches the desk; `verify_known_number` calls the helpline
the register publishes; `verify_trusted_directory` lists the support desk, and the scene's directory
extra names the investor helpline with its provenance. Replying and asking her to prove the profits
is `verify_in_message_contact`, worth `0`.

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_sender →
safe_pivot (leave the thread and look the desk up in the investor register) → verify_known_app →
resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Send the account details | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Send the deposit | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Reply asking how the trade works | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Ask her to prove the profits, at verify | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |
| Take the trade at the end | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.
The two releases are in two different places on purpose — one out of the composer, one off the
payment sheet — and the sheet is reachable both from the desk's own Deposit button and from the
menu, so neither is behind the other.

### Why the final simulation stays faithful

Every client element is present: the accidental first contact, the days of rapport, the lifestyle
claims, the pivot to a private investment, the dashboard with its trial profit and its Deposit
button, the independent regulator check, and the stop-responding resolution. What the scene adds is
the part the client's stage-3 text asks the learner to see — that the relationship was engineered —
made checkable, by putting the learner's own replies in front of them and counting the turns.

---

## 5. S10 — eSIM Upgrade OTP

### Client scenario (authoritative)

Specification page 98. SMS, **Medium**, **Malicious**, family *SIM-swap / OTP theft*, trigger
*Authority + convenience*. Canonical identity: family `account_takeover_authorisation_abuse`,
triggers the two canonical primitives the bank normalises that string to, military flag **false**,
level `medium`.

- **Stage 1 (Event).** "SIM upgrade pending. Call 00000 31010 and quote the OTP sent next."
- **Stage 2 (Open).** The telecom-themed thread. A text claims a required eSIM upgrade and directs
  the learner to call a mobile number and share an OTP.
- **Stage 3 (Inspect).** Unregistered sender, call number, OTP instruction, account-takeover
  implications. Decision signal: *an OTP can authorise SIM/eSIM changes; it must never be relayed to
  an inbound contact.*
- **Stage 4 (Branch).** A call-confirmation sheet and a synthetic OTP message.
- **Stage 5 (Verify).** Open the known carrier app or store contact and check for a requested SIM
  change.
- **Stage 6 (Resolve).** Do not call or share; report junk or block; secure the carrier account.

### MITRE ATT&CK alignment

| Technique | Fit | Why this maps |
| --- | --- | --- |
| [T1451 SIM Card Swap](https://attack.mitre.org/techniques/T1451/) | **Direct** | The technique describes transferring a victim's phone number to an adversary-controlled SIM, notes that adversaries first gather information "through Phishing, social engineering, data breaches, or other avenues", and states the consequence the scene teaches: the victim loses their text messages and calls, and the adversary uses the intercepted SMS to log into accounts that rely on SMS authentication. |
| [T1660 Phishing (Mobile)](https://attack.mitre.org/techniques/T1660/) | **Direct** | The lure is a text message to the handset that uses urgency to make the learner act — the technique's own example of social engineering "in text messages to trick the victims into acting quickly". |
| [T1684.001 Social Engineering: Impersonation](https://attack.mitre.org/techniques/T1684/001/) | **Supporting** | The sender and the desk both pose as the carrier, and the desk explains away the carrier's own DO-NOT-SHARE wording as "standard". |
| [T1598.004 Phishing for Information: Spearphishing Voice](https://attack.mitre.org/techniques/T1598/004/) | **Partial fit, stated** | The elicitation of the code happens in a voice conversation, which is this sub-technique — but the sub-technique describes the adversary placing the call, and here the learner is induced to place it. Recorded as partial, as S02's voice mapping was. |

**The gap, stated.** Two things this scene turns on have no technique. The first is the
**registered sender ID** distinction, carried forward from S01–S05: the carrier's own messages arrive
from a booked six-character sender, and the lure cannot. The second is the **approve-by-reply
mechanism** — a transfer authorised by answering the carrier's own message — which ATT&CK's
account-manipulation and MFA techniques do not describe.

**Considered and rejected.**

- [T1111 Multi-Factor Authentication Interception](https://attack.mitre.org/techniques/T1111/) —
  rejected for the same reason it was rejected for E08, E12, I12, I15 and I22: T1111 is *technical*
  interception (smartcard proxying, keylogging, intercepting the token in transit). Here a person
  reads six digits out loud, and the code is not an authentication factor for a login — it authorises
  a carrier account change.
- [T1636.004 Protected User Data: SMS Messages](https://attack.mitre.org/techniques/T1636/004/) —
  requires malware on the handset reading the message store. Nothing is installed in S10; the whole
  point is that the attacker cannot read the message and must ask the learner to.

**What must NOT be copied.** No real carrier, store, sender ID, account, SIM, eSIM profile, port
process, one-time code or phone number appears. "NovaCell", `VM-NOVCEL`, the account `xx4188`, the
code `481920` and every number are invented. Nothing is dialled — the dial confirmation is a drawn
dialog and there is no dialer in the product — no code is transmitted anywhere, and there is no field
to type one into: both releases are ordinary scene controls.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The list row preview and the message bubble |
| "Unregistered sender" | The thread header, the details screen and the unsaved-sender bar; the carrier's own sender ID is named beside it |
| "Call number" | The number card the app builds under the text, and the dial confirmation behind it |
| "OTP instruction" | The second bubble: ring the desk and read the code to the adviser |
| "Synthetic OTP message" | The carrier's own thread, two minutes later, with the DO-NOT-SHARE wording and what the code authorises |
| "Account-takeover implications" | The carrier thread's note: every code your bank, your email and this phone send you is delivered to that number |
| "Prior thread" | The carrier's earlier messages, on the same screen |
| "SIM label" | "Received on: SIM 1 · TRAINING NET" |
| "A call-confirmation sheet" | The `INSTALLER` dialog, with the carrier's own number printed beside the one being dialled |
| "Open the known carrier app/store contact and check for a requested SIM change" | `verify_known_app` → the carrier app; `verify_known_number` → the number on the bill |
| "Do not call/share; report junk/block; secure the carrier account" | `resolve_report` / `resolve_block`; the carrier puts a port lock on the number when called |

### Enhanced synthetic storyline

At 12:51 a text from an unknown mobile says a SIM upgrade is pending and gives a number to call. At
12:53 the code arrives — from `VM-NOVCEL`, where everything the carrier has ever sent comes from —
saying in capitals that it must not be shared, naming exactly what it approves, and offering the
learner a way to stop it. At 12:54 the first number writes again: ring the desk, read it out, do not
let the upgrade lapse. The carrier app shows a physical SIM active since March 2024, no eSIM
profiles, and no open requests.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast: the sending number and the client's sentence |
| Open | The message list, Personal selected, with the Transactions and Spam tabs beside it |
| Inspect | The thread, the unsaved-sender bar, the number card; the details screen; the carrier's own conversation |
| Branch | Ring the desk from the dial confirmation, send the six digits, reply YES to the transfer, reply, or open the carrier app |
| Verify | The carrier app, the carrier on the bill's number, the directory |
| Resolve | Report it as junk and keep the number locked; or finish the upgrade |

### Evidence the learner can discover (progressive)

1. The app's own bar: this number is not in the contacts.
2. The details screen: ten-digit mobile, no registered sender ID — and the carrier's own sender ID
   named one row below it.
3. The carrier's conversation: the code, in capitals, saying DO NOT SHARE, naming an eSIM transfer on
   the learner's own account, and offering "reply NO or call the number on your bill".
4. The same screen's note: an eSIM transfer moves the number, and every code the learner receives is
   delivered to that number.
5. The dial confirmation: the number being dialled, and the carrier's own number printed beside it.
6. The carrier app: SIM active since March 2024, zero eSIM profiles, no open requests — and a line
   saying the carrier never asks anyone to read a code out.
7. The carrier on the bill's number, which puts a port lock on the number.

### Learner interaction journey

Notify → open the message → the details screen → the carrier's own conversation → back → leave it and
open the carrier app → call the carrier on the number printed on the bill → report it as junk and
keep the number locked.

### Simulation surfaces

- `details` (`SMS`): conversation details, and the route to the carrier's thread.
- `carriermsg` (`SMS`): the carrier's own conversation — the warning, and both releases.
- `dial` (`INSTALLER`): the phone's own call confirmation.
- `desk` (`CALL`): the "upgrade desk" the number reaches.
- `carrier` (`APP`): the learner's own carrier app.
- `storecall` (`CALL`): the carrier, on the number printed on the bill.

### Verification mechanism

`verify_known_app` opens the carrier app and checks for a requested SIM change; `verify_known_number`
calls the carrier on the number printed on the bill; `verify_trusted_directory` lists the support
desk, and the scene's directory extra names carrier account security with its provenance. Replying to
the number is `verify_in_message_contact`, worth `0`.

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_sender →
safe_pivot (leave it and open your carrier app) → verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Send the six digits to the number that texted you | `share_secret` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Reply YES to approve the eSIM transfer | `approve_device_link` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Call the number in the message | `call_number` | `RISKY_OPEN_REPLY` | −3 |
| Reply asking what this upgrade is | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Ignore it at the end | `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.
The client's own stage-4 instruction is "do not call the supplied number **or** share the OTP", so
the call is the `−3` and the two things done in the carrier's thread are the `−8`s. Because the
carrier thread is reached by local navigation — from the details screen or the menu — neither `−8` is
behind the `−3`, and a learner who never rings the desk can still reach, and refuse, both of them.

### Why the final simulation stays faithful

Every client element is present: the unregistered sender, the number to call, the OTP instruction,
the call-confirmation sheet, the synthetic OTP message, the account-takeover implication, the carrier
app as the check, and the report-and-secure resolution. What the scene adds is the thing that makes
the lesson land on this platform: the warning is already on the phone, in the carrier's own
conversation, two minutes old, and the scored decisions are taken on that very screen.

---

## 6. Forms, inputs and data handling

**Only one of the five scenes accepts typing, and it needs to.** S08's claim site takes a name, an ID
number and a bank account number on its first page, and a payment handle and a code on its second;
S09's payment sheet takes a UPI PIN. Refusing to type those is the decision each of those screens is
about. **S06, S07 and S10 have no field anywhere** — every decision in them is a control, and S06 in
particular demonstrates the release without collecting a sensitive value at all, because the identity
line is an authored chip the learner presses rather than a form they fill. `sceneModel.test.js`
asserts exactly which scenes have which fields. The rules every field obeys:

- **Local.** The value lives in `useLocalForm` state inside the component that draws it, and nowhere
  else.
- **Ephemeral.** Leaving a screen unmounts it; the browser surface is keyed on the page, so walking
  from the winner-details page to the fee page discards what was typed by remount rather than by a
  cleanup we could forget to write.
- **Never transmitted.** No `fetch`, no `<form>`, no action, no submit event. Each commit control is
  an ordinary button carrying a scene affordance — a neutral id and an optional asset id, nothing
  else.
- **Never persisted.** No `localStorage`, `sessionStorage`, IndexedDB, cookie or cache holds anything
  typed or chosen on these screens; a reload rebuilds the run from the committed stage.
- **Never logged.** No console output, no analytics, no event payload. The engine's
  `METADATA_ALLOWLIST` rejects any metadata key it does not know, and the ledger never stores an
  action code or a control id.
- **No autofill surface.** Every field carries `autoComplete="off"` and a neutral `name` (`f0`, `f1`,
  …); the PIN is `FIELD_KIND.SECRET`, masked by CSS and never `type="password"`, so no browser or
  password manager recognises it or offers to save it.
- **No form submission.** The pages move by local links and a local Continue; only the page-scoped
  scene control reaches the engine, and it is disabled only by incomplete input, never by risk.
- **Deterministic.** The same control always produces the same event; nothing depends on what was
  typed.
- **Not decorative.** Every screen that shows a release has the control that commits it, because
  choosing it is the decision.

No real credential, card, account number, UPI handle, identity document, service number, date of
birth, photograph, one-time code, phone call, SIM change, install or payment exists anywhere in
S06–S10.

## 7. What is asserted, and where

| Claim | Test |
| --- | --- |
| Every S06–S10 control resolves to a legal transition on its own pinned definition | `backend/tests/sceneAffordance.test.js` |
| Each safe path scores exactly ten; each pinned unsafe route scores as recorded and reviews as its mistake | `backend/tests/sceneAffordance.test.js` |
| The same routes, stale views, wrong-stage controls, cross-run codes, retries and reloads through a real MongoDB transaction | `backend/tests/smsS06S10Engine.test.js` (isolated DB) |
| S06, S08, S09 and S10 never offer `reject_ignore` (S07, legitimate, does) | `backend/tests/sceneAffordance.test.js`, `sceneModel.test.js` |
| No S06–S10 branch shape repeats any of the eighty earlier scenes; each of the ten SMS scenes has a decision home no other SMS scene shares | `frontend/src/simulation/sceneModel.test.js` |
| Every scored branch surface **and page** is reachable without spending the branch | `frontend/src/simulation/sceneModel.test.js`, `SceneScenariosSmsB.test.jsx` |
| S06 names no rank, formation or operational term, and no real military entity | `frontend/src/simulation/sceneModel.test.js` |
| No disposition, family, trigger, end state, feedback, narrator line or verdict word reaches the device | `frontend/src/simulation/sceneModel.test.js`, `SceneScenariosSmsB.test.jsx` |
| Every host is `*.training.example`; every number is in the reserved range | `frontend/src/simulation/sceneModel.test.js` |
| No `href`, `src`, `iframe`, `form`, media element or host handler on any screen | `SceneContainment.test.jsx`, `SceneScenariosSmsB.test.jsx` |
| Six stages end to end; local navigation records nothing; stale resync; lost-response replay; keyboard operation; remount | `frontend/src/pages/SceneScenariosSmsB.test.jsx` |
| Nothing typed on S08's claim pages or S09's payment sheet reaches the wire or storage | `SceneScenariosSmsB.test.jsx` |
| This document covers every authored scenario and cites every technique it names | `frontend/src/simulation/sceneResearch.test.js` |

## 8. Findings during verification

1. **S10's call is the `−3`, and the releases are not behind it.** The client's stage-4 text says "Do
   not call the supplied number **or** share the OTP", and the engine takes one branch decision per
   stage — so if the code could only be read out *on the call*, a learner would have to spend the
   branch on the `−3` to reach the `−8`, which is the reachability defect IMMERSIVE-009 found by
   hand-play. The scene resolves it by putting both releases in the carrier's own conversation, which
   is reached by local navigation, and leaving the call as the consequence of the `−3`. This is the
   deliberate inverse of S02, where connecting is free and the operator's asks are the decisions.
2. **Page-level reachability is now asserted, not just surface-level.** S08's fee page is reachable
   from its winner-details page by an ordinary in-page link, and `sceneModel.test.js` now walks page
   links, in-page list rows and each page's own local Continue to prove that every page carrying a
   scored control can be reached without spending the branch. The earlier suite checked surfaces
   only.
3. **One new anchor, no new component.** `anchor: 'spam'` puts S08's safe branch in the Messages
   app's own unsaved-sender bar — a place `SmsScene` already draws and no scene had used for a scored
   control. `sceneModel.test.js` was extended to accept it exactly as it accepts `header`, `cta` and
   `audio`, and it asserts the scene actually draws the bar. No renderer changed, and no earlier
   scene's rendering is affected.
4. **Two branch intents that resolve to the same `−8`, three times.** S06 (identity line / photo),
   S08 (winner details / release fee), S09 (account details / deposit) and S10 (code / approval) each
   offer two `−8` routes on surfaces reached by local navigation, as in E10, E12, E18, E20, E23, E25,
   S02 and S05.
5. **S07 needed a third costed move to be worth its slot.** Deleting the receipt and replying to a
   sender ID are both mistakes, but neither is the one people actually make. The searched-for care
   number was added so the client's own stage-4 instruction — "do not switch to an untrusted channel"
   — has something concrete to refuse, and the paid-listing screen is drawn from the documented
   pattern in §0.2.
6. **A reply is a reply to the engine.** Replying to a text submits the existing `reply` intent; on
   the legitimate S07 it resolves to `UNSAFE_EXTERNAL_ACTION` (−4), on the malicious ones to
   `RISKY_OPEN_REPLY` (−3). No new intent was needed or invented, and no scoring constant, engine
   rule, `ScenarioDefinition`, taxonomy identifier or bank file was changed by this task.
7. **Recorded, not changed (pre-existing):** one scored decision per stage; consequence banners are
   session-only; the result and review cards show the bank's stored sender for the item; the
   `stages[].transitions[].on` vocabulary is still visible in the `/current-run` payload
   (SECURITY-001 §8). Browser-play totals are in `PROJECT_MASTER_PLAN.md`.
