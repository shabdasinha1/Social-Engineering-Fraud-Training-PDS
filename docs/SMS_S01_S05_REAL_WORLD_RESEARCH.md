# SMS S01–S05 — real-world research and storyline reconstruction

**Task:** IMMERSIVE-010 — the first SMS batch
**Naming:** the client's bank numbers every SMS scenario `S01`–`S25` (specification pages 88–112);
this batch is **S01–S05** in the data, the registry, the tests and this document, and it corresponds
to specification **pages 88–92**.
**Scope:** SMS S01, S02, S03, S04, S05 only. WhatsApp W01–W25, Instagram I01–I25 and Email E01–E25
are complete and unchanged in behaviour; SMS S06–S25 stay on the generic path.
**Status:** design record for the five SMS scenes authored by this task. **IMMERSIVE-010 COMPLETE (20 September 2026)** — implemented, tested and browser-validated; the validation totals are in `PROJECT_MASTER_PLAN.md` §16.32.
**Companions:** the Email records
[`EMAIL_E21_E25_REAL_WORLD_RESEARCH.md`](EMAIL_E21_E25_REAL_WORLD_RESEARCH.md) and its four
predecessors, and the WhatsApp and Instagram records, which use the same method.

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

What is taken from the real world is the shape of a phone's own Messages app and of what arrives in
one: a bank-impersonation text from an ordinary mobile rather than a registered sender header; a
late-evening disconnection threat with a number and no link; a genuine transaction alert that
matches a purchase made four minutes earlier; a traffic-fine notice quoting a registration that is
not quite yours; and a parcel "redelivery fee" of twenty rupees that is really a recurring mandate.
What is deliberately **not** taken is infrastructure, tooling, real brands, real banks, real
couriers, real utilities, real government bodies, real sender IDs, real accounts, real people, real
vehicle registrations, real payment rails or any real capability. "UnionX Bank", `BK-UNIONX`,
"Power Supply", `VM-TRNPWR`, "QuickParcel", `VM-QPARCL`, "TRAINING MART", `TR-RTOGOV` and the
transport office are fictional and describe nothing real. Every host is `*.training.example`; every
phone number is in the reserved `+91 00000 xxxxx` range; every message list, thread, details screen,
link-details screen, browser page, payment sheet, call and application is local, inert and offline.
No image file exists anywhere. Nothing is fetched, dialled, installed, paid, sent or mandated.

### 0.2 Source of the threat intelligence

Primary source: **MITRE ATT&CK, website version v19.2** (released 28 April 2026), re-confirmed as
the current version on the live versions page on 20 September 2026
(<https://attack.mitre.org/versions/>, which resolves to `/resources/versions/`; v18.1 ran 28 October 2025 – 27 April 2026, v17.1
before it). This is the first batch in the product whose primary mapping is in the **Mobile** matrix
rather than Enterprise, because the delivery channel is the handset. Technique pages read live for
this batch on 20 September 2026: T1660, T1417.002, T1636.004, T1582, T1684.001, T1657, T1585.002,
T1219 and T1598.

Version note carried forward: `T1656 Impersonation` no longer exists as a top-level technique; the
current page is **T1684.001** (Social Engineering: Impersonation, parent T1684). **T1219** is named
*Remote Access Tools*.

Secondary sources, for the real-world pattern behind each scenario (all read 20 September 2026):

- **S01** — Indian regulator material on registered sender IDs and on banks never asking for a PIN
  or OTP by text (<https://cybercrime.gov.in/>); UK NCSC on smishing
  (<https://www.ncsc.gov.uk/guidance/phishing>).
- **S02** — UK NCSC and US FTC material on utility-disconnection threats and on callback fraud that
  ends in a remote-access install (<https://consumer.ftc.gov/articles/how-spot-avoid-and-report-tech-support-scams>).
- **S03** — the legitimate control; US NIST "Phish Scale" material on the cost of false alarms
  (<https://www.nist.gov/publications/phish-scale-user-guide>); UK NCSC on proportionate response
  (<https://www.ncsc.gov.uk/guidance/phishing>).
- **S04** — Indian CERT-In and national cybercrime-portal advisories on fake e-challan texts
  (<https://cybercrime.gov.in/>); US FTC on government-impersonation scams
  (<https://consumer.ftc.gov/articles/government-imposter-scams>).
- **S05** — UK NCSC and Europol material on parcel-redelivery smishing and on small-fee lures that
  set up recurring mandates (<https://www.ncsc.gov.uk/guidance/phishing>,
  <https://www.europol.europa.eu/>).

**Source-confidence note.** Where a secondary source is cited by its landing page rather than by a
dated article, that is deliberate: the landing page is the one a reviewer can re-open. Nothing in this
document rests on a secondary source for a *behavioural* claim that ATT&CK is asked to carry. The ATT&CK
citations are the load-bearing ones, every one is linked to its own technique page, and
`sceneResearch.test.js` fails the build if a technique is named here without its page. **ATT&CK research
does not affect scoring in any way**: the scores are the bank's, pinned by `sceneAffordance.test.js`.

### 0.3 Interpretation rule

ATT&CK is used as a **behavioural reference, not a checklist**. A mapping is recorded only where the
technique's own description describes what the scenario does, and each is marked **direct**,
**supporting** or **partial**. **S03 has no mapping, and that is stated** — a genuine bank alert for a
purchase the learner just made involves no adversary. Techniques were **considered and rejected**
where they nearly fit but do not, each with its reason. Two behaviours in this batch have **no
dedicated ATT&CK technique** and the sections say so rather than forcing one: the abuse of a
**registered sender ID / alphanumeric sender name** (ATT&CK models the phishing message, not the
carrier identity it wears), and the **recurring payment mandate** hidden under a small one-off charge.

### 0.4 What this document may and may not change

| Thing | May IMMERSIVE-010 change it? |
| --- | --- |
| Scenario IDs, platform, level, disposition, family, trigger, military flag, version | **No** |
| The six stages, their order, their text, expected actions, scoring semantics, feedback | **No** |
| `backend/data/scenarios/v1` and its fingerprint `8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687` | **No** |
| `backend/data/synthetic/v1` and its fingerprint `2779b03939e13cf11e0bee44493609f0c91e228f201f22f8c025a080509afde1` | **No** |
| The engine, the event ledger, the selection algorithm, the 90-minute deadline, the attempt API, the training-feedback review | **No** |
| Scene structure, beats, SMS surfaces, phone UI, the server-side control map | **Yes — this is the whole task** |

**The client scenario remains authoritative** over everything in this document. Where the research and
the client's own stage text disagree, the client's text wins and the disagreement is recorded.

### 0.5 Content notes carried forward

**Canonical identity.** Every family and trigger below is the bank's own, normalised by the existing
canonical taxonomy (`attack-family-taxonomy.v1.json`, `trigger-taxonomy.v1.json`); no identifier was
invented. S01 → `financial_credential_phishing`; S02 → `tech_support_and_callback_fraud`; S03 →
`legit_system_confirmation`; S04 → `financial_credential_phishing`; S05 →
`financial_credential_phishing`.

**The placeholder sender identifier.** Handled as in W01–E25: the scene uses the number and display
name the client's content implies, carries the notification body verbatim where it is a complete
sentence, names the bank's sender **asset id** on the inspection control, and never invents a real
number or sender ID.

**S05's display name.** The generator stored S05's sender display name as `"Parcel paused"`, which
reads as a fragment of the client's sentence. It is printed as stored, because on SMS that is exactly
what an abused alphanumeric sender name looks like — and the scene makes the point explicit: the
details screen shows the ordinary mobile number underneath it and says the name was set by the sender.

**The narrator line is not printed.** No `prior_context` sentence is displayed on the device. The
verdict-word assertion applies the platform-wide list to every control label, hint and echo, so no
control names the verdict; report controls say "Report the message as junk".

**Answer-revealing asset prose is not displayed.** S01's, S04's and S05's `browser_page` assets carry
the client's stage-4 sentence as their `body`; the scenes use only their `display_target` and `host`,
never the narrating sentence.

**The result card placeholder** (known limitation carried from earlier scenes) applies to all five.

---

## 0.6 Differentiation from Email E01–E25, WhatsApp W01–W25 and Instagram I01–I25

A comparison against all seventy-five earlier scenes was made **before** implementation, on story
archetype, attack family, trigger combination, difficulty, branch shape, verification method, decision
home, resolution sequence, surface sequence and psychological lever:

| | Behavioural lesson | Social mechanism | Primary evidence | Decision home | Verification pattern | Unsafe temptation |
| --- | --- | --- | --- | --- | --- | --- |
| **S01** | A bank does not text you from a phone | Fear + urgency | Ordinary mobile, not a registered header; the real bank's year of alerts is one tab away; the short address expands to a different host | **A mobile KYC page in the browser** | The banking app the learner already has; the bank on the number on the card | Open the address; complete the re-verification; reply |
| **S02** | What the voice asks for is the decision | Fear + urgency | No address and no consumer number; the utility's own header quoted one on every earlier text; the bill is paid | **The call itself — install, pay, or end it** | The utility app; the supplier on the number printed on the bill | Install the "support" app; pay the reconnection charge; reply |
| **S03** *(legitimate)* | A matching no-action alert is security information, not a threat | Routine | A year of identical alerts from the same registered header; no link and no number in any of them; the transaction matches on amount, merchant, card and time | **The banking app's transaction card (Mark reviewed)** | The transaction list in the banking app; the bank on the card's number | Block the header; ring the gateway number; reply to an alert you cannot reply to |
| **S04** | Check the detail, not the tone | Fear + urgency | The registration quoted is one character off the learner's; no challan number, no photograph reference; the portal finds neither registration | **A fake challan page (vehicle, handle, code)** | The transport portal opened by the learner; the helpline in the directory | Open the address; confirm and pay; ring the sender |
| **S05** | Twenty rupees is the wrapper, not the charge | Curiosity + urgency | A display name anyone can set over an unknown mobile; a tracking number that is not the learner's; the real parcel is out for delivery with nothing owed | **An address form, then a mandate on the payment sheet** | The courier app the learner already has; customer care in the directory | Open the address; confirm the address; approve the mandate |

**What makes these SMS and not the messenger.** The app itself is different, and the difference is
where the evidence lives. There is no profile, no "last seen", no delivery ticks, no reactions, no
forwarding provenance and no avatar in the thread — a text has none of those. What it has instead,
and what these five scenes are built on, is: **category tabs** (Personal / Transactions / Spam), so
which bucket a message landed in is itself evidence and the real bank's thread sits one tab from the
fake one; **a header that is often just a number**, with only a conversation-details screen behind it;
**the registered-sender-ID distinction**, which has no equivalent on any other platform in this
product and is the tell in three of the five; **a spam bar** above an unsaved sender, carrying the
app's own Block and Report controls; **link preview cards** that show an address exactly as written,
so a shortener stays a shortener until the learner opens the link-details screen; and **a spam
protection settings screen**, which is where S03's "block the header" mistake is made concrete.

**What S01–S05 are not.** None is a credential login reached from an email, a macro attachment, a QR
code, an OAuth consent, a group chat, a feed post or a DM. The nearest earlier scenes, and how they
differ:

- **S02 and E17** are both callback lures with no link. They differ in channel, in pretext (a
  same-night disconnection against a subscription refund), in check (the learner's own utility bill
  against their card statement) and — the structural difference — in **where the decision sits**. In
  E17 the scored act is *making the call*, and the remote-support screen is its consequence. In S02
  the call is reached by local navigation and the scored acts are the operator's two asks, so S02 is
  the only scene in the product whose `−8` routes are both things a voice asked for. Recorded as an
  intentional overlap of family, with distinct branch shapes.
- **S01, S04 and S05** share the `financial_credential_phishing` family the bank assigns them. They
  are separated by what the learner must notice — the *sender* (S01), a *detail that does not match*
  (S04), and *what a small charge actually is* (S05) — and by three different decision homes.
- **S03 and E03/E07/E11/E16/E21** are the legitimate controls of their platforms; S03 is the only one
  whose evidence is the **thread's own history**, and the only one where the priced mistake takes
  away a future safety net rather than merely wasting someone's time.

**Differentiation, asserted.** `sceneModel.test.js` asserts that **none of S01–S05 repeats a
branch-stage shape of any of the seventy-five earlier scenes, or of each other**; that **each of the
five has a decision home no other SMS scene shares**; that every SMS scene opens on the message list
with the phone's own categories including Spam; that the beats use only the SMS vocabulary and none of
the messenger's (no ticks, reactions, forwarding, voice notes, polls or typing strips); that S02
carries no address at all; that S03 alone offers `reject_ignore`; and that every scored branch surface
is reachable without spending the branch.

---

## 1. S01 — Bank KYC Suspension

### Client scenario (authoritative)

Specification page 88. SMS, **Easy**, **Malicious**, family *Smishing / bank impersonation*, trigger
*Fear + urgency*. Canonical identity: family `financial_credential_phishing`, triggers `fear` +
`urgency`, military flag **false**, level `easy`.

- **Stage 1 (Event).** "KYC overdue. Account blocks in 30 min. Update: bank-verify.training.example"
- **Stage 2 (Open).** The unread bank-themed conversation. A text from an ordinary mobile number says
  the account will be blocked unless KYC is updated.
- **Stage 3 (Inspect).** Full number/header, prior thread, shortened/look-alike link and countdown.
  Decision signal: *the message is unsolicited, uses pressure and asks the learner to leave the
  official banking app.*
- **Stage 4 (Branch).** A fake mobile KYC page requesting account, PIN and OTP.
- **Stage 5 (Verify).** Open the known banking app directly or call the card's known number.
- **Stage 6 (Resolve).** Close; report junk/block; verify account status independently.

### MITRE ATT&CK alignment

| Technique | Fit | Why this maps |
| --- | --- | --- |
| [T1660 Phishing (Mobile)](https://attack.mitre.org/techniques/T1660/) | **Direct** | The Mobile matrix's phishing technique names SMS explicitly and describes exactly this: a message to a handset carrying a link to a site configured with a fake login, to gain access. |
| [T1417.002 Input Capture: GUI Input Capture](https://attack.mitre.org/techniques/T1417/002/) | **Direct** | The page mimics the bank's own prompt to collect account credentials on a small screen — the sub-technique's own description, including its note about constrained display size making the imitation harder to spot. |
| [T1684.001 Social Engineering: Impersonation](https://attack.mitre.org/techniques/T1684/001/) | **Supporting** | The sender pretends to be the learner's bank to make them act. |
| [T1585.002 Establish Accounts: Email Accounts](https://attack.mitre.org/techniques/T1585/002/) | **Partial fit, stated** | The infrastructure half — an account and a host stood up for the approach — is what this covers, but the sub-technique is about *email* accounts and the channel here is a mobile number. Recorded as partial. |

**The gap, stated.** ATT&CK models the phishing message; it has **no technique for the carrier-level
sender identity** — the registered sender ID that a bank books and a fraudster cannot, which is the
single most useful tell on this platform and the one this scene is built on. The absence is recorded
rather than filled with a near-miss.

**Considered and rejected.**

- [T1598 Phishing for Information](https://attack.mitre.org/techniques/T1598/) — reconnaissance
  against an organisation to enable a later intrusion. Here the credentials *are* the objective, not
  a stepping stone, and the target is a private account.
- [T1636.004 Protected User Data: SMS Messages](https://attack.mitre.org/techniques/T1636/004/) —
  requires malware already on the device reading the message store. Nothing is installed in S01.

**What must NOT be copied.** No real bank, sender ID, account number, IFSC, KYC process or phone
number appears. The page collects nothing: the three fields are local, the PIN is `FIELD_KIND.SECRET`
masked by CSS and never `type="password"`, and no value reaches an affordance, a request, storage or
the ledger.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The list row preview and the message bubble |
| "An ordinary mobile number" | The thread header, the details screen's "Ten-digit mobile number" row and the app's unsaved-sender bar |
| "Full number/header" | The details screen: sender type, registered sender ID (none), in your contacts (no) |
| "Prior thread" | There is none from this number — and the Transactions tab holds a year of the real bank's alerts from `BK-UNIONX`, reachable from the details screen |
| "Shortened/look-alike link" | The link preview card shows `bank-verify.training.example`; the link-details screen expands it to `s01.training.example` |
| "Countdown" | "Account will be blocked in 00:27" on the page |
| "A fake mobile KYC page requesting account, PIN and OTP" | The `BROWSER` surface, in that order |
| "Open the known banking app directly or call the card's known number" | `verify_known_app` → the banking app; `verify_known_number` → the number on the card |
| "Close; report junk/block; verify independently" | The safe branch leaves the text and opens the app; `resolve_report` / `resolve_block` |

### Enhanced synthetic storyline

At 08:34 a text arrives from a ten-digit number the phone has never seen. The account will be blocked
in thirty minutes unless KYC is updated, and there is a short address to do it at. The phone has filed
it under Personal, because that is where texts from unknown mobiles go, and has put its own bar above
the thread. One tab away, under Transactions, sits the learner's actual bank: `BK-UNIONX`, a debit
alert from this morning, a salary credit from the first, a statement notice from August — none of them
carrying an address, all of them from the same six characters.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast: the sending number |
| Open | The message list, Personal selected, with the Transactions and Spam tabs beside it |
| Inspect | The thread, the spam bar, the link card; the conversation details; the link-details screen; the bank's own thread |
| Branch | Open the address, complete the re-verification, leave it and open the banking app, or reply |
| Verify | The banking app, the bank on the card's number, the directory |
| Resolve | Report as junk and leave the account alone; or update the KYC |

### Evidence the learner can discover (progressive)

1. The app's own bar: this number is not in the contacts.
2. The details screen: ten-digit mobile, no registered sender ID, not in contacts.
3. The comparison page: a year of the real bank's alerts, all from `BK-UNIONX`, none with a link.
4. The link-details screen: what is written is not where it goes, and the certificate is valid for the
   address rather than for the bank.
5. The banking app: no block, KYC complete until 2028, no pending request — and a line saying the bank
   never asks for a PIN or a one-time code.
6. The bank on the card's number, saying the same thing.

### Learner interaction journey

Notify → open the message → the details screen → the bank's own thread → the link details → back →
leave it and open the banking app → call the bank on the card's number → report it as junk.

### Simulation surfaces

- `details` (`SMS`): conversation details, with a page comparing the real bank's thread.
- `linkinfo` (`SMS`): what was written, and where it goes.
- `kyc` (`BROWSER`): the harvest page — account, PIN, one-time code.
- `bankapp` (`APP`): the learner's own banking app.
- `bankcall` (`CALL`): the bank on the number printed on the card.

### Verification mechanism

`verify_known_app` opens the banking app; `verify_known_number` calls the number on the card;
`verify_trusted_directory` lists the support desk, and the scene's directory extra names card services
with its provenance. Replying to the text to ask them to confirm is `verify_in_message_contact`, worth
`0`.

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_sender →
safe_pivot (leave it and open the banking app) → verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Complete the re-verification | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Open the address | `open_link` | `RISKY_OPEN_REPLY` | −3 |
| Reply asking which account it is | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Ask the sender to confirm, at verify | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |
| Update the KYC at the end | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.
Opening the address is the `−3` and submitting the three fields is the `−8`; both are reachable
without spending the other, because the page can also be opened from the app's own menu.

### Why the final simulation stays faithful

Every client element is present: the unsolicited text from a mobile number, the thirty-minute
pressure, the shortened link, the fake KYC page asking for account, PIN and OTP, the known banking app
and the card's own number as the checks, and the report-junk resolution. What the scene adds is the
comparison the platform makes available and no other does — the real bank's own thread, in the same
app, one tab away.

---

## 2. S02 — Electricity Disconnect Tonight

### Client scenario (authoritative)

Specification page 89. SMS, **Easy**, **Malicious**, family *Utility impersonation / callback scam*,
trigger *Fear + urgency*. Canonical identity: family `tech_support_and_callback_fraud`, triggers
`fear` + `urgency`, military flag **false**, level `easy`.

- **Stage 1 (Event).** "Power will disconnect 21:30 for unpaid bill. Call 00000 12002 now."
- **Stage 2 (Open).** A text threatens power disconnection and supplies a personal mobile number for
  immediate payment.
- **Stage 3 (Inspect).** Sender number, absent customer reference, supplied callback and late-hour
  pressure.
- **Stage 4 (Branch).** A call-confirmation sheet leading to a synthetic operator asking for remote
  access/payment.
- **Stage 5 (Verify).** Check the known utility app/bill or call the official number from the bill.
- **Stage 6 (Resolve).** Do not call; report junk/block; verify the account independently.

### MITRE ATT&CK alignment

| Technique | Fit | Why this maps |
| --- | --- | --- |
| [T1660 Phishing (Mobile)](https://attack.mitre.org/techniques/T1660/) | **Direct** | The delivery is a text to a handset carrying social-engineering pressure and a route to act on. The technique covers non-targeted mass smishing of exactly this kind. |
| [T1219 Remote Access Tools](https://attack.mitre.org/techniques/T1219/) | **Direct** | What the operator actually wants is an install that lets him onto the device — the objective this technique describes, named as the thing the caller asks for. |
| [T1657 Financial Theft](https://attack.mitre.org/techniques/T1657/) | **Direct** | The second ask is money: a "reconnection charge" paid while the caller holds the line. |
| [T1684.001 Social Engineering: Impersonation](https://attack.mitre.org/techniques/T1684/001/) | **Supporting** | The sender and the voice both pretend to be the learner's electricity supplier. |
| [T1566.004 Phishing: Spearphishing Voice](https://attack.mitre.org/techniques/T1566/004/) | **Partial fit, stated** | The decisive social engineering happens on a call, which is what this sub-technique is about — but it describes the *adversary* placing the call, and here the victim dials a number from a text. Recorded as partial, never as the primary mapping. |

**Considered and rejected.**

- [T1417.002 Input Capture: GUI Input Capture](https://attack.mitre.org/techniques/T1417/002/) — there
  is no imitation prompt and nothing is typed anywhere in S02. This is S01's and S04's mapping.
- [T1582 SMS Control](https://attack.mitre.org/techniques/T1582/) — requires malware with SMS
  permissions on the device. Nothing is installed in this scene; the install is refused or it is not.

**What must NOT be copied.** No real utility, consumer-number format, tariff, disconnection procedure,
remote-support product or phone number appears. No dialer exists: tapping the number raises a drawn
dialog, and the "call" is a caption list with a timer. Nothing can be installed and no money can move.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The list row preview and the message bubble |
| "A personal mobile number for immediate payment" | The number card under the message, and the details screen's "no registered sender ID" row |
| "Absent customer reference" | The details screen: "Consumer number quoted: None", against a year of the utility's own texts that all quote it |
| "Late-hour pressure" | Received 18:34, disconnection at 21:30, and the operator's "if you hang up the crew will be dispatched" |
| "A call-confirmation sheet" | The phone's own dial dialog, raised by tapping the number — local, recording nothing |
| "Leading to a synthetic operator asking for remote access/payment" | The `CALL` surface, whose two asks are the scene's two `−8` decisions |
| "Check the known utility app/bill or call the official number from the bill" | `verify_known_app` → the utility app; `verify_known_number` → the number printed on the bill |
| "Do not call; report junk/block" | Ending the call is the safe branch; `resolve_report` / `resolve_block` |

### Enhanced synthetic storyline

At 18:34, after the offices have shut, a text says the power goes off at 21:30 for an unpaid bill and
gives a mobile number. There is no link and no consumer number. The learner's own Transactions tab
holds the September bill from `VM-TRNPWR` — INR 1,840, due the 14th — and the receipt that settled it
on the 12th, both quoting consumer `TP-55-208841`. Tapping the number raises the phone's dial dialog;
connecting reaches a man who says the payment failed at his end, and who wants either an app installed
so he can "restore it from here", or INR 1,299 cleared while he waits.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast: the sending number |
| Open | The message list, with the utility's own thread under Transactions |
| Inspect | The thread and the number card; the details screen; the utility's own texts |
| Branch | The dial dialog, the call, and on it: install, pay, or end the call — or reply |
| Verify | The utility app, the supplier on the bill's number, the directory |
| Resolve | Report as junk and leave the connection alone; or settle it with the desk |

### Evidence the learner can discover (progressive)

1. No address anywhere in the message — only ten digits.
2. The details screen: ten-digit mobile, no registered sender ID, **no consumer number quoted**.
3. The utility's own texts, every one of which quotes the consumer number.
4. The utility app: no dues, September paid on the 12th, no disconnection notice — and a line saying
   they never ask anyone to install anything.
5. The supplier on the number printed on the bill, saying there is no disconnection desk on a mobile.

### Learner interaction journey

Notify → open the message → the details screen → the utility's own texts → tap the number → the dial
dialog → connect → hear the two asks → End call → the utility app → report it as junk.

### Simulation surfaces

- `details` (`SMS`): conversation details, with a page of the utility's own texts.
- `dial` (`INSTALLER`): the phone's own "Call this number?" dialog.
- `operator` (`CALL`): the scripted desk; its two asks are the scene's decisions.
- `billapp` (`APP`): the learner's own utility app.
- `utilitycall` (`CALL`): the supplier on the number printed on the bill.

### Verification mechanism

`verify_known_app` opens the utility app; `verify_known_number` calls the number on the bill;
`verify_trusted_directory` lists the support desk, and the scene's directory extra names customer care
with its provenance. Calling the number in the text back is `verify_in_message_contact`, worth `0`.

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_sender →
safe_pivot (End call) → verify_known_number → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Install the app the desk is sending | `attempt_install` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Pay the reconnection charge | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Reply asking for the consumer number | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Call the number back, at verify | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |
| Settle it with the desk at the end | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`. The
two `−8` routes and the `+3` all live on the call, which is reached by local navigation — so the
learner meets all three at once, which is the point of the scene.

### Why the final simulation stays faithful

Every client element is present: the disconnection threat, the personal mobile for immediate payment,
the missing customer reference, the late hour, the call-confirmation sheet, the operator asking for
remote access and payment, the utility app and the bill's own number as the checks, and the
do-not-call resolution. The one liberty is recorded in §8: the call is navigation and the operator's
asks are the decisions, which is the client's own stage-4 ordering and is what separates S02 from E17.

---

## 3. S03 — Matching Debit Alert

### Client scenario (authoritative)

Specification page 90. SMS, **Easy**, **Legitimate**, family *Legitimate transaction alert*, trigger
*Routine*. Canonical identity: family `legit_system_confirmation`, triggers `routine`, military flag
**false**, level `easy`.

- **Stage 1 (Event).** "INR 840 debited at TRAINING MART, card xx1042. No action needed."
- **Stage 2 (Open).** A no-link bank alert matches the synthetic purchase the learner completed
  moments earlier.
- **Stage 3 (Inspect).** Registered header, amount, masked card, timestamp and absence of
  links/callback.
- **Stage 4 (Branch).** The in-app transaction comparison card with Mark reviewed.
- **Stage 5 (Verify).** Compare with the known banking-app transaction list.
- **Stage 6 (Resolve).** Mark reviewed/archive; do not report or block.

### MITRE ATT&CK alignment

**There is none, and none has been invented.** ATT&CK catalogues adversary behaviour. In this
scenario there is no adversary: the learner's own bank has sent its own alert, from the registered
sender ID it has used for a year, about a purchase the learner made four minutes earlier, with no
link, no number and nothing to do. The scene exists to teach proportion — and, specifically, that the
over-reaction available here is *costly in a way SMS makes concrete*. Blocking a registered sender ID
does not block one message; it blocks everything that business sends, including the fraud alert that
would have caught a transaction the learner did not make. ATT&CK does not model a person's
over-caution, and it does not model the defensive value of a channel the learner might switch off.

**Closest defensible behavioural reference** — deliberately not an ATT&CK technique:

- US NIST, "Phish Scale User Guide", on the operational cost of false positives and why not every
  message is hostile (<https://www.nist.gov/publications/phish-scale-user-guide>).
- UK NCSC phishing guidance on proportionate response and on reporting without over-reporting
  (<https://www.ncsc.gov.uk/guidance/phishing>).
- Ordinary card-fraud practice: a transaction alert is a control, and keeping it switched on is the
  point of having it.

The defensive frame is: does the amount, the merchant, the masked card and the time match something
the account shows? If they do, the alert is doing its job — mark it reviewed and leave the channel
alone.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The list row preview and the message bubble |
| "A no-link bank alert" | No `link` and no `number` beat exists in the scene at all — asserted |
| "Registered header" | The thread header, and the details screen's "Registered sender ID" row |
| "Amount, masked card, timestamp" | The amount card: INR 840.00, TRAINING MART, card xx1042, today 08:27, "Action: None needed" |
| "Matches the purchase the learner completed moments earlier" | The purchase was at 08:27; the alert arrived at 08:31; the statement screen shows the posting at 08:29 |
| "Absence of links/callback" | The details screen's "In this message: No address, no phone number" row |
| "The in-app transaction comparison card with Mark reviewed" | The banking app's transaction section, with the scored **Mark the transaction reviewed** control on it |
| "Compare with the known banking-app transaction list" | `verify_known_app` → the same app's list |
| "Mark reviewed/archive; do not report or block" | `resolve_continue` / `resolve_retain`; report and block are the `−4` false positives |

### Enhanced synthetic storyline

The learner paid INR 840 at a shop four minutes ago. The alert for it has arrived from `ALERT`, the
registered sender the bank has used since September 2025, and the thread above it holds the rest of the
year: a fuel debit on the 14th, the salary credit on the 1st, the August statement notice — all the
same shape, none with an address. The phone filed it under Transactions. There is nothing to do, and
the message says so.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast: `ALERT` |
| Open | The message list, Transactions selected |
| Inspect | A year of thread above today's alert, the amount card; the details screen; the thread history page; the spam-protection screen |
| Branch | Mark the transaction reviewed in the app, block the header, ring the gateway number, or reply |
| Verify | The banking app's transaction list, the bank on the card's number, the directory |
| Resolve | Keep the alert and carry on; or report it as junk |

### Evidence the learner can discover (progressive)

1. The thread itself: three earlier alerts in the same format, visible without leaving the screen.
2. The details screen: registered sender ID, delivered through a carrier gateway, no address and no
   number in the message.
3. The history page: a year of the same, "including this one".
4. The banking app: the same amount, merchant, card and time, posted.
5. The card statement: the alert followed the posting by two minutes, which is when the bank sends
   them.
6. The spam-protection screen: what blocking a registered sender would actually cost.

### Learner interaction journey

Notify → open the alert → scroll the year of thread → the details screen → the history page → open the
transaction in the banking app → Mark reviewed → compare the transaction list → keep the alert.

### Simulation surfaces

- `details` (`SMS`): conversation details, with a page of the thread's history.
- `protection` (`SMS`): the phone's spam-protection settings, and what blocking a header costs.
- `bankapp` (`APP`): the transaction, and the **Mark reviewed** control.
- `statement` (`APP`): the card statement, with the merchant descriptor and the posting time.
- `bankcall` (`CALL`): the bank on the number printed on the card.

### Verification mechanism

`verify_known_app` opens the banking app's transaction list; `verify_known_number` calls the number on
the card; `verify_trusted_directory` lists the desk. Replying to an alert you cannot reply to is
`verify_in_message_contact`, worth `0`. Reporting or blocking a genuine alert is the `−4` false
positive.

### Safe resolution

`resolve_continue` (keep the alert) or `resolve_retain` (keep the thread as it is), `+2`. Full safe
path: `open_item → read → inspect_sender → safe_pivot (Mark reviewed) → verify_known_app →
resolve_continue` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Block this sender so it stops texting you | `reject_ignore` | `NEEDLESS_REJECT_IGNORE` | −2 |
| Call the number the alert was delivered from | `call_number` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Reply to confirm it was you | `reply` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Report / block at verify | `report` / `block` | `FALSE_REPORT_BLOCK` | −4 |
| Report it as junk at the end | `resolve_report` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `CORRECT_USE +3`, `NEEDLESS_REJECT_IGNORE −2`, `UNSAFE_EXTERNAL_ACTION −4`; marking
the transaction reviewed resolves to `CORRECT_USE` because the scenario is legitimate. The
block → report → report route scores 0 and reviews as a **false positive**.

### Why the final simulation stays faithful

Every client element is present: the no-link alert, the registered header, the amount, the masked
card, the timestamp, the match with a purchase just made, the in-app comparison card with Mark
reviewed, the banking-app transaction list as the check, and the do-not-report resolution. It is as
rich as its four malicious neighbours — five surfaces and a year of thread — so its legitimacy is not
given away by being thin, and the mistake it prices is made concrete on a screen the phone really has.

---

## 4. S04 — Unpaid E-Challan Link

### Client scenario (authoritative)

Specification page 91. SMS, **Easy**, **Malicious**, family *Government-service smishing*, trigger
*Fear + urgency*. Canonical identity: family `financial_credential_phishing`, triggers `fear` +
`urgency`, military flag **false**, level `easy`.

- **Stage 1 (Event).** "E-CHALLAN pending INR 500. Pay today to avoid court: challan-pay.training.example"
- **Stage 2 (Open).** A text claims an unpaid traffic fine will increase today and contains a
  look-alike payment link.
- **Stage 3 (Inspect).** Sender/header, vehicle/reference mismatch, link target and consequence
  language.
- **Stage 4 (Branch).** A fake challan page requesting vehicle, card/UPI and OTP.
- **Stage 5 (Verify).** Open the official challan portal/app independently and search a known
  vehicle/reference.
- **Stage 6 (Resolve).** Close; report junk/block; preserve the message.

### MITRE ATT&CK alignment

| Technique | Fit | Why this maps |
| --- | --- | --- |
| [T1660 Phishing (Mobile)](https://attack.mitre.org/techniques/T1660/) | **Direct** | A text to a handset carrying a link to a site configured to collect what the sender wants — the technique's own description of mobile phishing. |
| [T1417.002 Input Capture: GUI Input Capture](https://attack.mitre.org/techniques/T1417/002/) | **Direct** | The page imitates an official payment prompt to collect a payment handle and a one-time code on a small screen. |
| [T1684.001 Social Engineering: Impersonation](https://attack.mitre.org/techniques/T1684/001/) | **Direct** | The sender pretends to be a government transport authority, and the threat of court proceedings is the lever. |
| [T1657 Financial Theft](https://attack.mitre.org/techniques/T1657/) | **Supporting** | The money is the objective, taken through the handle and the code rather than as a transfer. |

**Considered and rejected.**

- [T1598 Phishing for Information](https://attack.mitre.org/techniques/T1598/) — organisational
  reconnaissance. The vehicle registration here is bait to make the message look researched, not
  intelligence being gathered.
- [T1566.002 Phishing: Spearphishing Link](https://attack.mitre.org/techniques/T1566/002/) — the
  Enterprise link sub-technique, which describes links in *email* bodies and is oriented towards
  compromising a system. The Mobile matrix's T1660 is the right home for a text.

**What must NOT be copied.** No real transport authority, challan numbering scheme, vehicle
registration format tied to a real region, portal, court process or phone number appears. Both
registrations are fictional and differ by one character on purpose. The page collects nothing: the
three fields are local and no value reaches an affordance, a request, storage or the ledger.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The list row preview and the first message bubble |
| "Vehicle/reference mismatch" | The second bubble quotes `TR 08 AB 4419`; the details screen sets it against the learner's `TR 08 AB 4419H`, and notes no challan number and no photograph reference |
| "Sender/header" | The details screen: ten-digit mobile, no registered sender ID, and a note that last year's notices came from `TR-RTOGOV` |
| "Look-alike payment link" | The link card shows `challan-pay.training.example`; the link-details screen expands it and dates the host at eleven days old |
| "Consequence language" | "Pay today to avoid court proceedings" |
| "A fake challan page requesting vehicle, card/UPI and OTP" | The `BROWSER` surface, in that order |
| "Open the official portal independently and search a known vehicle" | `verify_known_app` → the transport portal, which shows both searches already run |
| "Close; report junk/block; preserve the message" | `resolve_report` ("Report it as junk and keep the message") |

### Enhanced synthetic storyline

At 19:09 a text says a challan of INR 500 is pending and must be paid today to avoid court. It quotes
a registration — which is what makes it feel researched, and which is the whole scene, because it is
not quite the learner's. Last year the learner did get a challan, and it came from `TR-RTOGOV` with a
challan number and a photograph reference, both of which this message lacks. The portal, opened from
their own app list, finds nothing against their registration and no record of the one quoted.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast: the sending number |
| Open | The message list, with last year's genuine notices under Transactions |
| Inspect | The two bubbles and the link card; the details screen with both registrations; the link-details screen |
| Branch | Open the address, confirm and pay, ring the sender, or leave it and check the portal |
| Verify | The transport portal, the helpline from the directory, the directory |
| Resolve | Report as junk and keep the message; or pay before midnight |

### Evidence the learner can discover (progressive)

1. The app's bar: the number is not in the contacts.
2. The details screen: the registration quoted against the learner's own, one character apart.
3. The same screen: no challan number, no photograph reference — both of which last year's had.
4. The link-details screen: a host registered eleven days ago, against a portal that has been there
   for years.
5. The portal: nothing pending against the learner's registration, and no such registration as the one
   quoted.
6. The helpline, from the directory, saying the same and that payment is only in the portal.

### Learner interaction journey

Notify → open the notice → the details screen → compare the registrations → the link details → back →
leave it and open the transport portal → search both registrations → call the helpline → report it as
junk.

### Simulation surfaces

- `details` (`SMS`): conversation details, with both registrations side by side.
- `linkinfo` (`SMS`): what was written, where it goes, and how old the host is.
- `challan` (`BROWSER`): the harvest page — vehicle, card or UPI, one-time code.
- `portal` (`APP`): the transport portal, with both searches run and the learner's own history.
- `helpcall` (`CALL`): the transport helpline from the directory.

### Verification mechanism

`verify_known_app` opens the transport portal; `verify_known_number` calls the helpline listed in the
directory; `verify_trusted_directory` lists it, and the scene's directory extra names the challan
section with its provenance. Replying to the text to ask for the challan number is
`verify_in_message_contact`, worth `0`.

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_sender →
safe_pivot (leave it and check the portal) → verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Confirm and pay the challan | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Open the address | `open_link` | `RISKY_OPEN_REPLY` | −3 |
| Call the number the text came from | `call_number` | `RISKY_OPEN_REPLY` | −3 |
| Pay the challan at the end | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.
Opening the address is the `−3`; confirming and paying on it is the `−8`, and the page is also
reachable from the app's own menu so the two are alternatives rather than a sequence.

### Why the final simulation stays faithful

Every client element is present: the fine, the deadline, the court language, the look-alike link, the
page asking for vehicle, payment handle and one-time code, the official portal searched independently
and the report-junk resolution that keeps the message. What the scene adds is the detail that settles
it — a registration that is almost right, which is the thing a learner can actually check.

---

## 5. S05 — Parcel Address Fee

### Client scenario (authoritative)

Specification page 92. SMS, **Easy**, **Malicious**, family *Parcel smishing / payment phishing*,
trigger *Curiosity + urgency*. Canonical identity: family `financial_credential_phishing`, triggers
`curiosity` + `urgency`, military flag **false**, level `easy`.

- **Stage 1 (Event).** "confirm address and pay INR 20 within 6 hours."
- **Stage 2 (Open).** A text says a delivery address is incomplete and asks for a small redelivery
  fee.
- **Stage 3 (Inspect).** Unknown sender, unexpected parcel, shortened link and small-fee request.
- **Stage 4 (Branch).** A synthetic address form followed by card/UPI fields.
- **Stage 5 (Verify).** Check the known courier app/site with independently held tracking information.
- **Stage 6 (Resolve).** Close; report junk/block; do not reply.

### MITRE ATT&CK alignment

| Technique | Fit | Why this maps |
| --- | --- | --- |
| [T1660 Phishing (Mobile)](https://attack.mitre.org/techniques/T1660/) | **Direct** | Mass parcel smishing is the archetypal case this technique covers, and its own references cite SMS-distributed campaigns of exactly this shape. |
| [T1417.002 Input Capture: GUI Input Capture](https://attack.mitre.org/techniques/T1417/002/) | **Direct** | The address form and the payment prompt imitate legitimate flows to collect personally identifiable information and payment authorisation on a small screen. |
| [T1657 Financial Theft](https://attack.mitre.org/techniques/T1657/) | **Direct** | The objective is money — and more of it than the twenty rupees on the label, because what is approved is a recurring mandate. |
| [T1684.001 Social Engineering: Impersonation](https://attack.mitre.org/techniques/T1684/001/) | **Supporting** | The sender sets a display name so the message appears to come from a courier. |

**The gap, stated.** ATT&CK has **no technique for a recurring payment mandate obtained under a
one-off pretext**, which is the mechanism this scene exists to teach: T1657 describes the theft as an
outcome, not the authorisation trick that enables it. The absence is recorded rather than forced.
The **alphanumeric sender name** has the same gap as S01's registered sender ID.

**Considered and rejected.**

- [T1636.004 Protected User Data: SMS Messages](https://attack.mitre.org/techniques/T1636/004/) —
  requires malware reading the message store. Nothing is installed here.
- [T1582 SMS Control](https://attack.mitre.org/techniques/T1582/) — the same; the scene never gets
  near a permission.

**What must NOT be copied.** No real courier, tracking-number format, mandate product, payment rail or
phone number appears. The address form and the mandate collect nothing: every field is local, the UPI
PIN is `FIELD_KIND.SECRET` masked by CSS and never `type="password"`, no value reaches an affordance,
a request, storage or the ledger, and no mandate exists to approve.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The list row preview, and inside the first message bubble |
| "Unknown sender" | The display name over an unsaved mobile; the details screen shows the number underneath and says the name was set by the sender |
| "Unexpected parcel" | The tracking quoted is not the learner's; their real shipment is in the Transactions tab and out for delivery |
| "Shortened link" | The link card shows `redeliver.training.example`; the link-details screen expands it and dates the host at four days old |
| "Small-fee request" | INR 20, with six hours on it |
| "A synthetic address form followed by card/UPI fields" | The `BROWSER` surface's address page, then the `PAYSHEET` mandate — in that order |
| "Check the known courier app with independently held tracking information" | `verify_known_app` → the courier app, which holds the learner's real tracking number |
| "Close; report junk/block; do not reply" | The safe branches are cancelling the mandate and checking the courier app; `resolve_report` / `resolve_block` |

### Enhanced synthetic storyline

At 15:13 a message from "Parcel paused" says a parcel is held at the sorting centre: confirm the
address and pay INR 20 within six hours or it goes back. The learner *is* waiting for a parcel — the
courier's own header told them this morning that `QP-77-441902` is out for delivery — and that
coincidence is what the sender is counting on rather than arranging. The tracking number in this
message is a different one. Behind the twenty rupees, the payment sheet's own rows say what is
actually being approved: a mandate of up to INR 20,000 a month, running until cancelled.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast: "Parcel paused" |
| Open | The message list, with the courier's real texts under Transactions |
| Inspect | The two bubbles and the link card; the details screen with the number underneath the name; the link-details screen |
| Branch | Open the address, confirm the address, approve or cancel the mandate, or check the courier app |
| Verify | The courier app, customer care from the directory, the directory |
| Resolve | Report as junk and wait for the real delivery; or pay the INR 20 |

### Evidence the learner can discover (progressive)

1. The app's bar: this sender set its own name, and the number underneath is unsaved.
2. The details screen: ordinary mobile with a display name, no registered sender ID, and the tracking
   quoted set against the learner's own.
3. The link-details screen: a host registered four days ago.
4. The courier app: the real shipment is out for delivery with nothing owed, and there is no such
   shipment as the one quoted.
5. The payment sheet: "Mandate limit: up to INR 20,000 per month", "Runs until: cancelled by you".
6. Customer care, from the directory, saying charges are collected in the app and never by a link.

### Learner interaction journey

Notify → open the message → the details screen → the link details → back → open the courier app → find
the real shipment → report it as junk. (Or: open the address → fill the form → reach the sheet → read
the mandate rows → Cancel.)

### Simulation surfaces

- `details` (`SMS`): conversation details, with the number under the display name.
- `linkinfo` (`SMS`): what was written, where it goes, how old the host is.
- `redeliver` (`BROWSER`): the address page, then the fee page.
- `mandate` (`PAYSHEET`): the mandate, its limit and its duration, with Approve and Cancel on it.
- `courier` (`APP`): the learner's own courier app.
- `couriercall` (`CALL`): customer care from the directory.

### Verification mechanism

`verify_known_app` opens the courier app; `verify_known_number` calls customer care from the
directory; `verify_trusted_directory` lists it, and the scene's directory extra names it with its
provenance. Replying to the text to ask which parcel it is is `verify_in_message_contact`, worth `0`.

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_sender →
safe_pivot (leave it and check the courier app) → verify_known_app → resolve_report` = **10**.
Cancelling the mandate on the sheet is the second safe branch, for a learner who got that far.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Confirm the delivery address | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Approve the mandate | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Open the address | `open_link` | `RISKY_OPEN_REPLY` | −3 |
| Pay the INR 20 at the end | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`. The
two `−8` routes are on different surfaces and the sheet is reachable from the app's own menu, so
approving the mandate is not gated behind filling in the address.

### Why the final simulation stays faithful

Every client element is present: the unknown sender, the unexpected parcel, the shortened link, the
small fee, the address form followed by payment fields, the courier app checked with independently
held tracking information, and the report-and-do-not-reply resolution. What the scene adds is what the
twenty rupees is for — a mandate whose own small print, on the phone's own sheet, is the thing worth
reading.

---

## 6. Forms, inputs and data handling

**Three of the five scenes accept typing, and each needs to.** S01's KYC page takes an account number,
an ATM PIN and a one-time code; S04's challan page takes a registration, a payment handle and a code;
S05 takes a name, an address and a phone number, and then a UPI PIN on the mandate sheet. Refusing to
type those is the decision each of those scenes is about. **S02 and S03 have no field anywhere** —
their decisions are controls — and `sceneModel.test.js` asserts exactly which scenes have which
fields. The rules every field obeys:

- **Local.** The value lives in `useLocalForm` state inside the component that draws it, and nowhere
  else.
- **Ephemeral.** Leaving a screen unmounts it; the browser surface is keyed on the page, so walking
  from the address page to the fee page discards what was typed by remount rather than by a cleanup we
  could forget to write.
- **Never transmitted.** No `fetch`, no `<form>`, no action, no submit event. Each commit control is an
  ordinary button carrying a scene affordance — a neutral id and an optional asset id, nothing else.
- **Never persisted.** No `localStorage`, `sessionStorage`, IndexedDB, cookie or cache holds anything
  typed or chosen on these screens; a reload rebuilds the run from the committed stage.
- **Never logged.** No console output, no analytics, no event payload. The engine's
  `METADATA_ALLOWLIST` rejects any metadata key it does not know, and the ledger never stores an action
  code or a control id.
- **No autofill surface.** Every field carries `autoComplete="off"` and a neutral `name` (`f0`, `f1`,
  …); a PIN is `FIELD_KIND.SECRET`, masked by CSS and never `type="password"`, so no browser or
  password manager recognises it or offers to save it.
- **No form submission.** The pages move by local links and a local Continue; only the page-scoped
  scene control reaches the engine, and it is disabled only by incomplete input, never by risk.
- **Deterministic.** The same control always produces the same event; nothing depends on what was
  typed.
- **Not decorative.** Every screen that shows a release has the control that commits it, because
  choosing it is the decision.

No real credential, card, account number, UPI handle, identity document, address, vehicle
registration, one-time code, phone call, install or payment mandate exists anywhere in S01–S05.

## 7. What is asserted, and where

| Claim | Test |
| --- | --- |
| Every S01–S05 control resolves to a legal transition on its own pinned definition | `backend/tests/sceneAffordance.test.js` |
| Each safe path scores exactly ten; each pinned unsafe route scores as recorded and reviews as its mistake | `backend/tests/sceneAffordance.test.js` |
| The same routes, stale views, wrong-stage controls, cross-run codes, retries and reloads through a real MongoDB transaction | `backend/tests/smsS01S05Engine.test.js` (isolated DB) |
| S01, S02, S04 and S05 never offer `reject_ignore` (S03, legitimate, does) | `backend/tests/sceneAffordance.test.js`, `sceneModel.test.js` |
| No S01–S05 branch shape repeats any of the seventy-five earlier scenes; each has a decision home no other SMS scene shares | `frontend/src/simulation/sceneModel.test.js` |
| Every SMS scene opens on the message list with the phone's own categories; the beats use the SMS vocabulary and none of the messenger's | `frontend/src/simulation/sceneModel.test.js` |
| Every scored branch surface is reachable without spending the branch | `frontend/src/simulation/sceneModel.test.js` |
| No disposition, family, trigger, end state, feedback, narrator line or verdict word reaches the device | `frontend/src/simulation/sceneModel.test.js`, `SceneScenariosSms.test.jsx` |
| Every host is `*.training.example`; every number is in the reserved range | `frontend/src/simulation/sceneModel.test.js` |
| No `href`, `src`, `iframe`, `form`, media element or host handler on any screen | `SceneContainment.test.jsx`, `SceneScenariosSms.test.jsx` |
| Six stages end to end; local navigation records nothing; stale resync; lost-response replay; keyboard operation; remount | `frontend/src/pages/SceneScenariosSms.test.jsx` |
| This document covers every authored scenario and cites every technique it names | `frontend/src/simulation/sceneResearch.test.js` |

## 8. Findings during verification

1. **S02's scored decisions are the operator's asks, not the call.** The client's stage-4 text is "a
   call-confirmation sheet **leading to** a synthetic operator asking for remote access/payment", and
   the engine takes one branch decision per stage. Tapping the number and connecting are therefore
   local navigation, and installing, paying or ending the call are the three decisions. This is a
   deliberate contrast with E17, where calling itself is the scored act; recorded as a deviation, and
   the stage-4 scoring text is unchanged.
2. **One new surface kind and one new component family.** `SURFACE.SMS` (`surfaces/SmsSurface.jsx`)
   draws the Messages app's own screens — conversation details, link details, spam protection — and
   `components/simulation/sms/{SmsScene,SmsBubbles}.jsx` draw the app and its beats. No existing
   renderer changed, and no earlier scene's rendering is affected.
3. **S03 was thinner than its neighbours on the first pass** (three surfaces against five), which on a
   legitimate item risks giving the answer away. It gained the phone's spam-protection screen and the
   card statement — both of which carry evidence rather than filling space — and the assertion that
   holds the legitimate scene to its neighbours' richness now passes.
4. **Two branch intents that resolve to the same −8.** S02 (install / pay) and S05 (address / mandate)
   are alternatives on surfaces reached by local navigation, as in E10, E12, E18, E20, E23 and E25.
5. **A reply is a reply to the engine.** Replying to a text submits the existing `reply` intent; on the
   legitimate S03 it resolves to `UNSAFE_EXTERNAL_ACTION` (−4), on the malicious ones to
   `RISKY_OPEN_REPLY` (−3). No new intent was needed or invented.
6. **Recorded, not changed (pre-existing):** one scored decision per stage; consequence banners are
   session-only; the result and review cards show the bank's stored sender for the item. Browser-play
   totals are in `PROJECT_MASTER_PLAN.md`.
