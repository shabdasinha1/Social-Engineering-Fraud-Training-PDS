# Email E16–E20 — real-world research and storyline reconstruction

**Task:** IMMERSIVE-008 — the fourth Email batch
**Naming:** the client's bank numbers every Email scenario `E01`–`E25` (specification pages 62–87);
this batch is **E16–E20** in the data, the registry, the tests and this document, and it corresponds
to specification **pages 78–82**.
**Scope:** Email E16, E17, E18, E19, E20 only. WhatsApp W01–W25, Instagram I01–I25 and Email E01–E15
are complete and unchanged in behaviour; SMS and Email E21–E25 are untouched.
**Status:** design record for the five Email scenes authored by this task. **IMMERSIVE-008 COMPLETE (19 September 2026)** — implemented, tested and browser-validated; the validation totals are in `PROJECT_MASTER_PLAN.md` §16.30.
**Companions:** [`EMAIL_E01_E05_REAL_WORLD_RESEARCH.md`](EMAIL_E01_E05_REAL_WORLD_RESEARCH.md),
[`EMAIL_E06_E10_REAL_WORLD_RESEARCH.md`](EMAIL_E06_E10_REAL_WORLD_RESEARCH.md),
[`EMAIL_E11_E15_REAL_WORLD_RESEARCH.md`](EMAIL_E11_E15_REAL_WORLD_RESEARCH.md) and the WhatsApp and
Instagram records, which use the same method.

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

What is taken from the real world is the shape of a mail client and of what arrives in one: a signed,
unit-wide IT maintenance notice with a calendar file; a "renewal receipt" that carries no link and only
a phone number (the callback-phishing pattern built to pass mail filters); a real vendor thread
continued from the vendor's own compromised mailbox with a changed Reply-To; a courteous academic
questionnaire sent to a wide distribution list; and a legal-looking summons that demands a bond and
forbids telling anyone. What is deliberately **not** taken is infrastructure, tooling, real brands,
real remote-access products, real accounts, real people, real units, real formations, real locations,
real schedules, real procedures, real courts, real laws, real payment rails or any real capability.
"Unit Falcon", IT Operations, "Subscription Billing", "ProSuite", "SupportLink", "Northstar
Supplies", "Dr. Mira Sen", "Northfield University", the "National Inquiry Office" and every other actor
are fictional and describe nothing real. Every host is `*.training.example`; every phone number is in
the reserved `+91 00000 xxxxx` range; every inbox, header, calendar file, dial dialog, call, install
screen, Payables screen, questionnaire preview, case portal and case-status app is local, inert and
offline. No image file exists anywhere. Nothing is fetched, dialled, installed, uploaded, paid, sent or
added to a real calendar.

### 0.2 Source of the threat intelligence

Primary source: **MITRE ATT&CK, Enterprise matrix, website version v19.2** (released 28 April 2026),
re-confirmed as the current version on the live versions page on 18 September 2026
(<https://attack.mitre.org/versions/>, which resolves to `/resources/versions/`; v18.1 ran 28 October 2025 – 27 April 2026, v17.1
before it). Technique pages read live for this batch on 18 September 2026: T1566.004, T1219 (and its
sub-technique T1219.002), T1586.002, T1657, T1598.002, T1591, T1684.001, T1534 and T1114.003. Pages
cited from the previous Email batches' reading of the same release: T1566.001, T1566.002, T1598.003 and
T1585.002.

Version note carried forward: `T1656 Impersonation` no longer exists as a top-level technique; the
current page is **T1684.001** (Social Engineering: Impersonation, parent T1684, created 14 April 2026).
**T1219** is now named *Remote Access Tools* (v3.0) with sub-techniques T1219.001 IDE Tunneling,
T1219.002 Remote Desktop Software and T1219.003 Remote Access Hardware.

Secondary sources, for the real-world pattern behind each scenario (all read 18 September 2026):

- **E16** — the legitimate control; US NIST "Phish Scale" material on proportionate response and the
  cost of false alarms (<https://www.nist.gov/publications/phish-scale-user-guide>); UK NCSC on
  reporting without over-reporting (<https://www.ncsc.gov.uk/guidance/phishing>).
- **E17** — US FTC and UK NCSC material on fake subscription-renewal ("callback") emails and refund
  scams that end in remote-access installs (<https://consumer.ftc.gov/articles/how-spot-avoid-and-report-tech-support-scams>,
  <https://www.ncsc.gov.uk/guidance/phishing>).
- **E18** — US FBI IC3 public service announcements on business email compromise and vendor
  impersonation (<https://www.ic3.gov/>); UK NCSC guidance on payment-change verification
  (<https://www.ncsc.gov.uk/guidance/phishing>).
- **E19** — US Army and NCSC material on elicitation by "researchers" and survey pretexts, and on
  OPSEC in answering questionnaires (<https://www.army.mil/socialmedia/safety/>); UK NPSA guidance on
  approaches to staff (<https://www.npsa.gov.uk/>).
- **E20** — Indian CERT-In / national cybercrime-portal advisories on "digital arrest" and fake
  law-enforcement notices demanding payment and secrecy (<https://cybercrime.gov.in/>); US FTC on
  government-impersonation scams (<https://consumer.ftc.gov/articles/government-imposter-scams>).

**Source-confidence note.** Where a secondary source is cited by its landing page rather than by a
dated article, that is deliberate: the landing page is the one a reviewer can re-open. Nothing in this
document rests on a secondary source for a *behavioural* claim that ATT&CK is asked to carry. The ATT&CK
citations are the load-bearing ones, every one is linked to its own technique page, and
`sceneResearch.test.js` fails the build if a technique is named here without its page. **ATT&CK research
does not affect scoring in any way**: the scores are the bank's, pinned by `sceneAffordance.test.js`.

### 0.3 Interpretation rule

ATT&CK is used as a **behavioural reference, not a checklist**. A mapping is recorded only where the
technique's own description describes what the scenario does, and each is marked **direct**,
**supporting** or **partial**. **E16 has no mapping, and that is stated** — a signed, expected
maintenance notice involves no adversary. Techniques were **considered and rejected** where they nearly
fit but do not, each with its reason (T1598.004-style "phishing for information by voice" and T1204 for
E17; T1534 and T1566.002 for E18; T1566.001 for E19; T1566.001 and T1598.003-as-primary for E20). Two
behaviours in this batch have **no dedicated ATT&CK technique** — the payment of a coerced "bond"
(E20's extortion lever is described by T1657 only as an outcome) and the *isolation/secrecy* instruction
itself — and the sections say so rather than forcing one.

### 0.4 What this document may and may not change

| Thing | May IMMERSIVE-008 change it? |
| --- | --- |
| Scenario IDs, platform, level, disposition, family, trigger, military flag, version | **No** |
| The six stages, their order, their text, expected actions, scoring semantics, feedback | **No** |
| `backend/data/scenarios/v1` and its fingerprint `8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687` | **No** |
| `backend/data/synthetic/v1` and its fingerprint `2779b03939e13cf11e0bee44493609f0c91e228f201f22f8c025a080509afde1` | **No** |
| The engine, the event ledger, the selection algorithm, the 90-minute deadline, the attempt API, the training-feedback review | **No** |
| Scene structure, beats, Email surfaces, phone UI, the server-side control map | **Yes — this is the whole task** |

**The client scenario remains authoritative** over everything in this document. Where the research and
the client's own stage text disagree, the client's text wins and the disagreement is recorded.

### 0.5 Content notes carried forward

**Canonical identity.** Every family and trigger below is the bank's own, normalised by the existing
canonical taxonomy (`attack-family-taxonomy.v1.json`, `trigger-taxonomy.v1.json`); no identifier was
invented. E16 → `legit_routine_broadcast`; E17 → `tech_support_and_callback_fraud`; E18 →
`payment_diversion`; E19 → `operational_elicitation`; E20 → `coercion_and_extortion`.

**The placeholder sender identifier.** Handled as in E01–E15: the scene uses the display name and address
the client's content implies, carries the notification body verbatim where it is a complete sentence,
names the bank's sender **asset id** on the inspection control, and never invents a real address.

**E18's parsed display name and fragmentary notification body.** The generator stored E18's sender
display name as `"Re"` and its notification body as `"NS-104 - Please use our recovery account for this
month"` — it split the client's sentence at the colon and at the apostrophe. Like E09's "From" and
E12's "Docs Share:", the scene does not print the fragments: the thread's sender is **Northstar Supplies
(Accounts)** (the vendor behind NS-104, already established by E10), and the inbox preview carries the
client's complete stage-1 sentence. The bank asset is untouched.

**The narrator line is not printed.** No `prior_context` sentence is displayed on the device (E18's
contains a verdict word). The verdict-word assertion applies the platform-wide list to every control
label, hint and echo, so no control names the verdict; report controls say "Report the message".

**Answer-revealing asset prose is not displayed.** E20's `browser_page`/`file` assets carry the client's
stage-4 sentence as their `body`/`preview`; the scene uses only their `display_target`, `host`,
`file_name` and `file_size`, never the narrating sentence.

**The result card placeholder** (known limitation carried from earlier scenes) applies to all five.

---

## 0.6 Differentiation from Email E01–E15, WhatsApp W01–W25 and Instagram I01–I25

A comparison against all sixty-five earlier scenes was made **before** implementation, on story
archetype, attack family, trigger combination, military context, difficulty, branch shape, verification
method, decision home, resolution sequence, surface sequence and psychological lever:

| | Behavioural lesson | Social mechanism | Primary evidence | Decision home | Verification pattern | Unsafe temptation |
| --- | --- | --- | --- | --- | --- | --- |
| **E16** *(legitimate)* | A verified no-action notice needs a proportionate response, not an alarm | Authority + routine | Valid digital signature; same sender and shape as last month; no link; change ID on the status board | **The notice's own calendar file (Add reminder) / archive** | The IT status board (change CHG-118) and the IT desk | Forward work mail to a personal address; move to Junk; report it |
| **E17** | No link is not the same as safe: a number in a mail is the payload | Fear + urgency | No order in your mail; no charge in your statement; undisclosed recipients; off-domain Reply-To | **The phone's own dial dialog (Call vs Cancel)** | Your own card statement and your bank on the card's number | Call the desk; reply to dispute |
| **E18** | A real thread from a real address is context, not authentication | Trust + routine | Authentication passes, but the Reply-To differs, the style and signature change, and a one-off exception | **The Payables app, and the reply/forward composer** | A call on the vendor-master number; the dual-control queue | Change beneficiary; release payment; reply; push the approver |
| **E19** *(military, fictional)* | Scholarly tone does not authorise disclosure; need-to-know does | Expert status + flattery | Domain ≠ university; 38 visible recipients; no approval reference; questions on systems, gaps, location and routine | **The questionnaire's own document bar, and the reply/forward composer** | The Public Information Office and the approved research register | Answer it; agree to a call; forward it round the section |
| **E20** | Threats, secrecy and a payment demand are the signal; break the isolation | Fear + authority + isolation | External domains; a seal that is only a picture; a case lookup on the demand's own portal | **A case portal (open / upload / pay)** | The official case-status app and unit legal support | Open the portal; upload ID and statements; pay the bond; reply |

**New Email-native mechanics this batch adds, with no new renderer:** E16 is the first Email scene whose
decision is on a **calendar-file attachment** (distinct from E07's invite card) and the first to show a
**digital-signature** result and **Show original** headers. E17 is the first Email scene with **no link
and no attachment whose decision is a phone number** — tapping it is local and only raises the phone's
own **dial dialog** (an `INSTALLER` dialog page), where Call or Cancel is the scored decision; it also
adds a **local mailbox search** for an earlier order. E18 is the first Email scene whose From line is
entirely genuine (authentication passes, same address as E10's "on file") and whose **reply sheet's To
line** exposes the altered Reply-To; its **Compare with earlier message** page and a **forward to the
second approver** make dual control the thing under attack; and it is the first Email scene to decide on
an **application surface** (`APP`). E19 releases from a **document bar** in the attachment preview and
shows the **recipient list** as evidence. E20 decides on a portal where **upload and payment type
nothing**, and its in-message "check" is a lookup on the demand's own portal.

**What E16–E20 are not.** None is a credential login, a macro attachment, a generic "click this link", a
look-alike vendor domain (E10), or an impersonated commander (E06/E09/E14). E18 and WhatsApp W20 share a
*risk pattern* (redirected payment), which the master plan already records; they differ in channel,
evidence (authentication *passes* in E18), decision home (Payables app vs procurement portal) and branch
shape. E19 and Instagram I05/I20 share the elicitation family; E19 is a formal email to a distribution
list with an attached form rather than a DM rapport chain. E20 and WhatsApp W21 share the coercion
family; E20's decision is a portal upload/payment rather than a chat with nothing to press.

**Differentiation, asserted.** `sceneModel.test.js` asserts that **none of E16–E20 repeats a branch-stage
shape of any of the sixty-five earlier scenes, or of each other**; that the twenty Email scenes decide
across at least fourteen coarse homes (E03/E16 and E09/E10 are the recorded pairs, each with distinct
shapes); that E17 alone in Email decides by calling a number, on the dial dialog; that E18 alone in Email
decides on an application surface; and that no E16–E20 screen has a single form field.

---

## 1. E16 — Signed Maintenance Notice

### Client scenario (authoritative)

Specification page 78. Email, **Medium**, **Legitimate**, family *Legitimate IT maintenance*, trigger
*Authority + routine*. Canonical identity: family `legit_routine_broadcast`, triggers `authority` +
`routine`, military flag **false**, level `medium`.

- **Stage 1 (Event).** "IT Operations: Planned mail maintenance 22:00-22:30; no action required."
- **Stage 2 (Open).** An authenticated, digitally signed notice announces planned downtime and asks for no
  credentials.
- **Stage 3 (Inspect).** Examine signature status, internal sender, maintenance calendar and no-action
  wording. Decision signal: *the signed sender and local change calendar match; the message does not ask
  for a link, file or secret.*
- **Stage 4 (Branch).** The in-message maintenance detail and **Add reminder** control. Expected: *use the
  normal in-app path only after the details match; do not switch to an untrusted channel.*
- **Stage 5 (Verify).** Compare change ID CHG-118 with the local IT status board; do not report or block.
- **Stage 6 (Resolve).** Add a reminder / archive normally; do not report or block.

### MITRE ATT&CK alignment

**There is none, and none has been invented.** ATT&CK catalogues adversary behaviour. A signed, expected,
no-action notice from the unit's own IT operations involves no adversary, so no technique applies. The
scene exists to teach proportion: the learner who reports a genuine operations notice, or moves work mail
to a personal account "to keep reading tonight", is the one who has done something unsafe — and ATT&CK
does not model a person's over-caution or their own data-handling slip.

**Closest defensible behavioural reference** — deliberately not an ATT&CK technique:

- US NIST, "Phish Scale User Guide", on why not every message is a phish and the cost of false positives
  (<https://www.nist.gov/publications/phish-scale-user-guide>).
- UK NCSC phishing guidance on proportionate response and on keeping work mail in approved channels
  (<https://www.ncsc.gov.uk/guidance/phishing>).

The defensive frame is a proportionate check — does the signature, the sender, the change number and the
window match what IT publishes? — followed by the normal in-app action, and not treating a routine
operations notice as hostile.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The first paragraph of the body and the subject after `CHG-118:` |
| "Signature status, internal sender, maintenance calendar, no-action wording" | The details sheet (Digital signature: valid; SPF/DKIM pass; Links: none), the `.ics` preview, the "You need to: Nothing" row |
| "In-message maintenance detail and Add reminder control" | The window table and the calendar file's anchored **Add reminder** |
| "Do not switch to an untrusted channel" | Forwarding it to a personal address is the unsafe external action (−4) |
| "Compare change ID CHG-118 with the local IT status board" | `verify_known_app` → the IT status board, which lists CHG-118 with the same window |
| "Add a reminder / archive normally; do not report or block" | Archive (`resolve_continue`) or keep (`resolve_retain`); report/block are the contradictory finals |

### Enhanced synthetic storyline

IT Operations sends the unit-wide notice it sends before every mail maintenance window: change CHG-118,
tonight 22:00–22:30, what users will notice, and "you do not need to sign in, reset anything or install
anything". Last month's notice for CHG-097 is already in the thread, in the same shape, from the same
signed address. The only attachment is a two-kilobyte calendar file for the window.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast: "IT Operations" |
| Open | The inbox, with the IT notices folder holding last month's notice and its completion message |
| Inspect | The notice; the details with the signature row and Show original; the calendar file preview |
| Branch | Add reminder on the calendar file, archive, Junk, or forward to a personal address |
| Verify | The IT status board, the IT desk, the directory |
| Resolve | Archive or keep; report/block available and wrong |

### Evidence the learner can discover (progressive)

1. Same sender, same shape and the same "digitally signed" footer as the CHG-097 notice on 14 Aug.
2. The details: signature valid (Unit Falcon CA), SPF/DKIM pass, no links; Show original has
   `multipart/signed` and `X-Change-Ref: CHG-118`.
3. The calendar file: one event, the same window, no link, no meeting address.
4. The IT status board: CHG-118 scheduled tonight 22:00–22:30, no user action.

### Learner interaction journey

Notify → open the notice → the details and the calendar file → Add reminder → compare CHG-118 on the
status board → archive.

### Simulation surfaces

- `details` (`MAIL`): signature and authentication, with an `original` page.
- `ics` (`MAIL`): the calendar-file preview.
- `calendar` (`APP`): the learner's own calendar once the reminder is added.
- `statusboard` (`APP`): the IT status board.
- `call` (`CALL`): the IT service desk on the saved number.

### Verification mechanism

`verify_known_app` opens the IT status board; `verify_known_number` calls the IT desk;
`verify_trusted_directory` lists the desk. Replying to IT Operations is `0`; reporting or blocking a real
notice is the `−4` false positive.

### Safe resolution

`resolve_continue` (archive) or `resolve_retain` (keep), `+2`. Full safe path: `open_item → read →
inspect_sender → safe_pivot (Add reminder) → verify_known_app → resolve_continue` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Forward it to a personal address for tonight | `reply` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Move it to Junk | `reject_ignore` | `NEEDLESS_REJECT_IGNORE` | −2 |
| Report / block it at verify | `report` / `block` | `FALSE_REPORT_BLOCK` | −4 |
| Report / block it at the end | `resolve_report` / `resolve_block` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `CORRECT_USE +3`, `NEEDLESS_REJECT_IGNORE −2`, `UNSAFE_EXTERNAL_ACTION −4`; the reminder
and archive resolve to `CORRECT_USE` because the scenario is legitimate. Forward = 3 in total; the Junk →
report → report route is 0 and reviews as a false positive.

### Why the final simulation stays faithful

Every client element is present: the signed internal sender, the maintenance window, the explicit
no-action wording, the Add reminder control inside the message, the CHG-118 check against the status
board and the instruction not to report or block. It is as rich as its malicious neighbours (five
surfaces, a thread with history) so its legitimacy is not given away by being thin.

---

## 2. E17 — Invoice Callback Trap

### Client scenario (authoritative)

Specification page 79. Email, **Medium**, **Malicious**, family *Callback phishing / tech-support fraud*,
trigger *Fear + urgency*. Canonical identity: family `tech_support_and_callback_fraud`, triggers `fear` +
`urgency`, military flag **false**, level `medium`.

- **Stage 1 (Event).** "Subscription Billing: INR 32,900 renewal processed. Call within 30 minutes to
  cancel."
- **Stage 2 (Open).** A renewal invoice says the learner will be charged unless they call a supplied
  number immediately.
- **Stage 3 (Inspect).** Unknown sender, no known subscription, supplied callback number and urgency.
  Decision signal: *the goal is to move the learner to a scam operator who can request remote access or
  payment details.*
- **Stage 4 (Branch).** A call-confirmation panel leading to a synthetic support script asking for remote
  access. Expected: *do not call the supplied number, share screen or install support software.*
- **Stage 5 (Verify).** Check statements/subscriptions directly and use a known vendor contact if needed.
- **Stage 6 (Resolve).** Do not call; report; monitor the simulated account independently — with the
  250-character rationale box.

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1566.004** Phishing: Spearphishing Voice | <https://attack.mitre.org/techniques/T1566/004/> | **Direct.** The page describes victims receiving "phishing messages that instruct them to call a phone number" where they are directed to download tools or "Install adversary-accessible remote management tools (Remote Access Tools) onto their computer" — callback phishing exactly. |
| **T1219** Remote Access Tools (**T1219.002** Remote Desktop Software) | <https://attack.mitre.org/techniques/T1219/>, <https://attack.mitre.org/techniques/T1219/002/> | **Supporting / partial fit, stated.** The desk's script asks the learner to install "SupportLink" and read its session code; the page describes desktop-support software that lets a user "control a computer remotely". The scene stops before any install, so this is the objective the call serves, not an action the learner can complete. |
| **T1684.001** Social Engineering: Impersonation | <https://attack.mitre.org/techniques/T1684/001/> | **Partial fit, stated.** "Subscription Billing" poses as a billing provider the learner never used; the page describes impersonating "a trusted person or organization"; here the trust is manufactured by fear of a charge rather than borrowed from a known brand. |

**Why this maps.** The email carries no link and no attachment — only a number — because the attack moves
to a voice channel where the operator talks the victim into installing a remote-access tool (T1566.004
leading to T1219). The simulation's decision is the moment the learner would dial.

**Considered and rejected.** **T1598.004 Phishing for Information: Spearphishing Voice**
(<https://attack.mitre.org/techniques/T1598/004/>) — the operator's aim in this script is access to the
device, not collecting information, so the access-oriented T1566.004 is the better fit. **T1204 User
Execution** (<https://attack.mitre.org/techniques/T1204/>) — nothing is executed in the scene; the
install screen is shown only as the consequence of the call.

**What must NOT be copied.** No real subscription brand, antivirus product, remote-access tool, bank,
phone number or call-centre script. "ProSuite Total Protection", "SupportLink" and the cancellation desk
are invented; the number is in the reserved range; nothing dials, installs or grants anything.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The inbox preview and the first body paragraph |
| "Unknown sender, no known subscription, supplied callback number, urgency" | The details (no earlier mail, off-domain Reply-To, undisclosed recipients), the mailbox search (no order), the 30-minute line |
| "Call-confirmation panel leading to a synthetic support script asking for remote access" | Tapping the number opens the phone's **dial dialog**; Call connects to the desk's script, which asks to install SupportLink and read its code; the install screen is shown with nothing to press |
| "Do not call, share screen or install support software" | Cancel / close is the safe pivot; Call is `−3` |
| "Check statements/subscriptions directly; known vendor contact" | `verify_known_app` → the card statement; `verify_known_number` → the bank on the card's number |
| "Do not call; report; one-line reason" | Report (`resolve_report`), with the platform's rationale box |

### Enhanced synthetic storyline

A branded "renewal receipt" for a three-device protection plan the learner never bought says INR 32,900
will be debited today, and that cancelling is only possible by calling within 30 minutes. It carries an
order table and a phone number and nothing else: no link a filter could scan, no attachment. It is sent
to undisclosed recipients, and its Reply-To points at a second domain.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast: "Subscription Billing" |
| Open | The inbox; the Receipts folder shows real purchases, none from this sender |
| Inspect | The receipt, the details, a local search of the mailbox for an earlier order |
| Branch | The tappable number → the dial dialog (Call / Cancel); reply; close |
| Verify | The card statement; the bank; the directory |
| Resolve | Report, with a one-line reason |

### Evidence the learner can discover (progressive)

1. The External tag and "to undisclosed recipients".
2. The details: no earlier mail, Reply-To on `e17-support.training.example`, links "None — one phone
   number".
3. The mailbox search: no ProSuite or Subscription Billing message except today's.
4. The dial dialog: the number is not in contacts and was tapped in an email.
5. The card statement: no renewal charge, pending or posted; the bank confirms it.

### Learner interaction journey

Notify → open the receipt → the details and the search → tap the number, read the dialog, Cancel → check
the card statement → report with a reason.

### Simulation surfaces

- `details`, `search` (`MAIL`): headers and a local mailbox search.
- `dial` (`INSTALLER`, dialog page): the phone's own "Call this number?" dialog — the decision home.
- `support` (`CALL`): the scripted desk; its local link opens `remote`.
- `remote` (`INSTALLER`, prompts page): the SupportLink install screen — shown, never actionable.
- `statement` (`APP`): the learner's card statement; `bank` (`CALL`): the bank.

### Verification mechanism

`verify_known_app` opens the card statement; `verify_known_number` calls the bank on the number printed on
the card; `verify_trusted_directory` lists the desk. "Ask the cancellation desk in the email" is `0`;
reporting without checking is `+1`.

### Safe resolution

`resolve_report`, `+2`. Full safe path: `open_item → read → inspect_sender → safe_pivot (Cancel) →
verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Call the number from the dial dialog | `call_number` | `RISKY_OPEN_REPLY` | −3 |
| Reply that you never ordered it | `reply` | `RISKY_OPEN_REPLY` | −3 |
| "Call to cancel before the deadline" at the end | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`. The
scene offers no `−8` branch: the client's own stage 4 places remote access *behind* the call, and the
engine takes one branch decision, so the call is the decision and the install is its consequence.
Recorded as a deviation (§8).

### Why the final simulation stays faithful

The client's call-confirmation panel is the phone's own dial dialog; its support script asks for remote
access; the checks are the statement and a known contact; the resolution is don't call and report with
a reason. The absence of any link is kept deliberately, because it is how these lures pass mail filters.

---

## 3. E18 — Hijacked Reply-Chain Invoice

### Client scenario (authoritative)

Specification page 80. Email, **Hard**, **Malicious**, family *Thread hijack / payment diversion*, trigger
*Trust + routine*. Canonical identity: family `payment_diversion`, triggers `trust` + `routine`, military
flag **false**, level `hard`.

- **Stage 1 (Event).** "Re: NS-104 - Please use our recovery account for this month's settlement."
- **Stage 2 (Open).** A compromised mailbox inserts a realistic message into an established invoice thread
  and changes payment details.
- **Stage 3 (Inspect).** New reply-to, changed writing style, beneficiary mismatch, unusual exception.
  Decision signal: *a genuine thread and prior attachments can be abused after compromise; payment
  changes still need independent confirmation.*
- **Stage 4 (Branch).** The existing invoice and vendor-master payment screen. Expected: *do not update
  beneficiary or approve payment based on the thread.*
- **Stage 5 (Verify).** Call the vendor on the pre-existing master-data contact and obtain dual approval.
- **Stage 6 (Resolve).** Hold payment; report the reply; alert vendor/security — with the rationale box.

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1586.002** Compromise Accounts: Email Accounts | <https://attack.mitre.org/techniques/T1586/002/> | **Direct.** The page: "Adversaries can use a compromised email account to hijack existing email threads with targets of interest", and a compromised persona "may engender a level of trust in a potential victim if they have a relationship with" it. |
| **T1657** Financial Theft | <https://attack.mitre.org/techniques/T1657/> | **Direct for the objective.** "Once the social engineering is successful, victims can be deceived into sending money to financial accounts controlled by an adversary" — business email compromise. |
| **T1114.003** Email Collection: Email Forwarding Rule | <https://attack.mitre.org/techniques/T1114/003/> | **Supporting / partial fit, stated.** On the verification call the vendor reports a rule forwarding their mail out — how the attacker watched the thread. It happens in the vendor's mailbox, off-screen, before the scene. |

**Why this maps.** The attacker is inside the vendor's real mailbox (T1586.002), watched the thread through
a forwarding rule (T1114.003), and replies at the natural moment in a routine monthly cycle to divert the
settlement (T1657). That the From line is genuine is precisely what makes this harder than E10.

**Considered and rejected.** **T1534 Internal Spearphishing** (<https://attack.mitre.org/techniques/T1534/>)
— the page is explicit that it covers accounts "within the same organization"; here the compromised
mailbox belongs to a third-party vendor. **T1566.002 Phishing: Spearphishing Link**
(<https://attack.mitre.org/techniques/T1566/002/>) — there is no link or attachment in the hijacked reply;
the lure is an instruction in text.

**What must NOT be copied.** No real vendor, bank, IFSC, account or ERP product. Northstar, NS-104, the
"recovery account" and the Payables app are invented; no money moves and nothing is typed.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, complete | The inbox preview (the bank fragment is not printed; §0.5) |
| "Authentic-looking reply chain" | Two earlier messages (your request, Anil's statement), quoted history, the same From address as the thread and as E10's "on file" |
| "New reply-to, changed writing style, beneficiary mismatch, unusual exception" | Details (Reply-To on `e18.training.example`, SPF/DKIM pass), **Compare with Anil's message of 05 Sep**, the "this month only" exception, the Payables vendor master |
| "Existing invoice and vendor-master payment screen" | The Payables app: NS-104, account on file ····4455, requested ····3391, with Change / Release / Hold |
| "Call on the master-data contact; dual approval" | `verify_known_number` → Anil on the vendor-master number; `verify_known_app` → the dual-control queue |
| "Hold; report; alert vendor/security; one-line reason" | Hold and report (`resolve_report`) with the rationale box |

### Enhanced synthetic storyline

NS-104 is a monthly maintenance contract settled every month to the account verified at onboarding. On
02 Sep the learner asked Anil for the September statement; on 05 Sep Anil sent it, signed with his name
and number. Today, in the same thread and from the same address, "Accounts Team" asks — kindly, today
itself — for this month only to go to a "recovery account" while the main account is "under routine
audit", and to send the remittance advice to this email.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast: "Northstar Supplies (Accounts)" |
| Open | The inbox; the Vendors folder shows July and August statements from Anil |
| Inspect | The thread; the details; the side-by-side comparison with 05 Sep |
| Branch | Payables (change / release / hold); Reply (To shows the other Reply-To); Forward to the second approver |
| Verify | Anil on the vendor-master number; the dual-control queue; the directory |
| Resolve | Hold and report, with a one-line reason |

### Evidence the learner can discover (progressive)

1. The preview's one-off exception to a routine settlement.
2. The details: SPF and DKIM pass for northstar — and a Reply-To on another domain.
3. The comparison: 05 Sep signed "Anil Mehra · number"; today "Accounts Team", no name, no number.
4. The reply sheet: its To line is the other address, not Anil's.
5. Payables: the account on file and the contact on file have not changed; changes need callback + second
   approver. Anil: "we have no recovery account … a rule in our mailbox forwarding mail out".

### Learner interaction journey

Notify → open the thread → the details and the comparison → open Payables, put NS-104 on hold → call Anil
on the vendor-master number → hold and report with a reason.

### Simulation surfaces

- `details` (`MAIL`): headers and the `compare` page.
- `payables` (`APP`): NS-104 and the vendor master — the decision home, with three scored controls.
- `approvals` (`APP`): the dual-control queue.
- `call` (`CALL`): Anil on the vendor-master number.

### Verification mechanism

`verify_known_number` calls Anil on the number from the vendor master; `verify_known_app` opens the
dual-control queue; `verify_trusted_directory` lists the desk. "Reply on the thread to confirm the
account" is `0` — it would go to the Reply-To.

### Safe resolution

`resolve_report`, `+2`. Full safe path: `open_item → read → inspect_sender → safe_pivot (hold) →
verify_known_number → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Release this month's settlement to the recovery account | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Change the beneficiary to the recovery account | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Reply that you will use the recovery account | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Forward it to the second approver for sign-off today | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Pay the recovery account at the end | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`. The
beneficiary change and the release are alternatives on the same Payables screen, reached by a local,
unscored navigation (the E10/E12 pattern), not a sequence.

### Why the final simulation stays faithful

The genuine thread, the passing authentication, the new Reply-To, the change of style, the beneficiary
mismatch and the one-off exception are all on screen; the decision is on the existing invoice and vendor
master; the checks are the master-data call and dual approval; the resolution holds and reports.

---

## 4. E19 — Academic Interview on Readiness

### Client scenario (authoritative)

Specification page 81. Email, **Hard**, **Malicious**, family *Military elicitation / research pretext*,
trigger *Expert status + flattery | FICTIONAL MILITARY CONTEXT*. Canonical identity: family
`operational_elicitation`, triggers `expert_status` + `flattery`, military flag **true**, level `hard`.

- **Stage 1 (Event).** "Dr. Mira Sen: Your field experience can improve our readiness study.
  Questionnaire attached."
- **Stage 2 (Open).** A polished academic request seeks an interview and attaches questions about
  readiness and equipment gaps.
- **Stage 3 (Inspect).** Institution domain mismatch, unverifiable publication, narrow operational
  questions and distribution list. Decision signal: *professional tone and public credentials do not
  authorize disclosure of protected capability information.*
- **Stage 4 (Branch).** An inert questionnaire requesting systems, limitations, locations and routines.
  Expected: *do not answer, correct assumptions with nonpublic facts, or forward internally without
  review.*
- **Stage 5 (Verify).** Route the inquiry to approved public-information/security staff for authorization.
- **Stage 6 (Resolve).** Do not answer; report internally; retain evidence — with the rationale box.

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1598.002** Phishing for Information: Spearphishing Attachment | <https://attack.mitre.org/techniques/T1598/002/> | **Direct.** The page: adversaries "may rely upon the recipient populating information, then returning the file" — the attached questionnaire exactly. |
| **T1591** Gather Victim Org Information | <https://attack.mitre.org/techniques/T1591/> | **Direct for the objective.** The questions target locations (T1591.001, <https://attack.mitre.org/techniques/T1591/001/>), tempo/routines (T1591.003, <https://attack.mitre.org/techniques/T1591/003/>) and roles (T1591.004, <https://attack.mitre.org/techniques/T1591/004/>); the page names "direct elicitation via Phishing for Information". |
| **T1585.002** Establish Accounts: Email Accounts | <https://attack.mitre.org/techniques/T1585/002/> | **Supporting / partial fit, stated.** The persona writes from a domain that is not the university's, consistent with an adversary-established address; the scene cannot show how the account was made. |

**Why this maps.** A persona with borrowed academic authority (T1585.002) sends a fillable questionnaire
(T1598.002) whose questions, answered by enough recipients, assemble organisation information — systems,
gaps, where sub-units are and their weekly tempo (T1591).

**Considered and rejected.** **T1566.001 Phishing: Spearphishing Attachment**
(<https://attack.mitre.org/techniques/T1566/001/>) — that technique is about gaining *access* through
the attachment; this document carries no payload and its value is the information returned.

**What must NOT be copied.** No real university, journal, researcher, unit, formation, equipment,
location, schedule or readiness data. The questions are generic categories written for this fiction;
"Unit Falcon", "Northfield University" and the "Journal of Applied Readiness" describe nothing real.
Nothing is typed, filled or sent.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The inbox preview and the first body paragraph |
| "Polished academic request; interview; questions on readiness and equipment gaps" | The flattering body, the offer of a call, the attached `.docx` |
| "Domain mismatch, unverifiable publication, narrow questions, distribution list" | Details (domain ≠ `northfield-univ`; no approval reference; the journal lists nothing) and the **38-recipient list** page |
| "Inert questionnaire requesting systems, limitations, locations and routines" | The preview's seven questions; its **Fillable form** bar carries "Fill it in and send it back" |
| "Do not answer, correct assumptions, or forward internally without review" | Answering is `−8`; agreeing to a call and forwarding to the section are `−3`; closing it / leaving it are safe |
| "Route to approved public-information/security staff" | `verify_known_number` → the Public Information Office; `verify_known_app` → the research-requests register |

### Enhanced synthetic storyline

A senior fellow says the learner is exactly the practitioner voice her study is missing, promises
anonymity and an acknowledgement in a journal, attaches a fifteen-minute questionnaire and offers a call.
The unit's own "Unit notices" folder holds a PIO reminder that research and survey requests go to PIO
before anyone replies.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast: "Dr. Mira Sen" |
| Open | The inbox; the PIO reminder in Unit notices |
| Inspect | The invitation; the details and recipient list; the questionnaire preview |
| Branch | The questionnaire bar (send back / close); reply agreeing to a call; forward to the section; leave it |
| Verify | PIO; the research register; the directory |
| Resolve | Report and keep, with a one-line reason |

### Evidence the learner can discover (progressive)

1. External tag; "to you and 37 others".
2. The details: a non-university domain, 38 recipients across four sub-units, no approval reference.
3. The questions, read one by one: systems in use, equipment gaps, where the sub-unit is and for how long,
   a typical week, time to be ready to move.
4. The register: nothing approved for Northfield or Dr. Sen. PIO: "don't answer or pass it round".

### Learner interaction journey

Notify → open the invitation → the details and the recipient list → preview the questionnaire and close it
→ call PIO → report and keep it, with a reason.

### Simulation surfaces

- `details` (`MAIL`): headers and the `recipients` page.
- `questionnaire` (`MAIL`): the document preview with its bar — the release home.
- `register` (`APP`): approved research and media requests.
- `pio` (`CALL`): the Public Information Office.

### Verification mechanism

`verify_known_number` calls PIO on the directory number; `verify_known_app` opens the register;
`verify_trusted_directory` lists the desk. Asking Dr. Sen for credentials is `0`.

### Safe resolution

`resolve_report`, `+2`. Full safe path: `open_item → read → preview_file → safe_pivot (close the
questionnaire) → verify_known_number → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Fill it in and send it back | `share_secret` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Reply agreeing to a short interview call | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Forward it to the section so others can take part | `reply` | `RISKY_OPEN_REPLY` | −3 |
| "Answer only the general questions" at the end | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`;
returning the questionnaire is the release (`share_secret`, no field typed).

### Why the final simulation stays faithful

The flattering academic register, the attached questionnaire, the domain mismatch, the distribution
list, the narrow operational questions, the "do not forward internally without review", the PIO route
and the retain-and-report ending are all present, in a fiction with no real military detail.

---

## 5. E20 — Legal Notice and Secrecy Order

### Client scenario (authoritative)

Specification page 82. Email, **Hard**, **Malicious**, family *Legal/government impersonation /
extortion*, trigger *Fear + authority + isolation*. Canonical identity: family `coercion_and_extortion`,
triggers `fear` + `authority` + `isolation_secrecy`, military flag **false**, level `hard`.

- **Stage 1 (Event).** "National Inquiry Office: Confidential summons - pay verification bond before
  17:00."
- **Stage 2 (Open).** An official-looking notice alleges criminal involvement, forbids discussion and
  requests a refundable bond.
- **Stage 3 (Inspect).** Sender domain, fabricated seal, secrecy demand, payment route and case lookup.
  Decision signal: *a legal-looking PDF and confidentiality language do not validate a demand for
  immediate payment.*
- **Stage 4 (Branch).** A synthetic warrant PDF and bond-payment portal. Expected: *do not pay, upload
  ID/bank statements or remain isolated.*
- **Stage 5 (Verify).** Verify with the relevant authority through an independently known official route
  and inform unit/legal support.
- **Stage 6 (Resolve).** Do not pay or reply; preserve and report through approved channels.

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1684.001** Social Engineering: Impersonation | <https://attack.mitre.org/techniques/T1684/001/> | **Direct.** The notice impersonates an authority "to persuade and trick a target into performing some action on their behalf", with the urgent, payment-centred language the page describes. |
| **T1657** Financial Theft | <https://attack.mitre.org/techniques/T1657/> | **Direct for the objective, partial for the lever.** The bond is the theft; the page's extortion examples are ransomware-centred, so the *coercion by legal threat and secrecy* is not itself described there — stated. |
| **T1598.003** Phishing for Information: Spearphishing Link | <https://attack.mitre.org/techniques/T1598/003/> | **Supporting / partial fit, stated.** The linked portal also asks for identity proof and bank statements; the payment, not the documents, is the primary aim. |

**Why this maps.** An impersonated authority (T1684.001) sends a link (T1598.003) to a portal that
collects documents and a "bond" (T1657). **The isolation instruction — "discussing it … will be treated as
obstruction" — has no ATT&CK technique**; it is a coercion lever, taught here by making *breaking the
isolation* (telling unit legal support) a trusted verification.

**Considered and rejected.** **T1566.001 Phishing: Spearphishing Attachment**
(<https://attack.mitre.org/techniques/T1566/001/>) — the "warrant" PDF carries no payload; it is a prop
whose seal is only a picture. T1598.003 was considered as the primary mapping and kept only as supporting.

**What must NOT be copied.** No real agency, court, statute, officer, case format, portal, account or
seal. The "National Inquiry Office", "Financial Crimes Cell", case NIO/FC/2026/0917 and "Insp. R. Kapoor"
are invented; nothing is uploaded or paid, and no document is chosen from any device.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The inbox preview and the first body paragraph |
| "Alleges criminal involvement, forbids discussion, requests a refundable bond" | The body, the case table, the 17:00 line and the "strictly confidential … obstruction" paragraph |
| "Sender domain, fabricated seal, secrecy demand, payment route, case lookup" | Details (external domains, Reply-To, "bond paid into a web portal", "no office, no phone"); the warrant preview's seal note; the lookup on the same portal |
| "Synthetic warrant PDF and bond-payment portal" | The `warrant` preview; the `portal` with Upload documents and Pay the bond |
| "Do not pay, upload ID/bank statements or remain isolated" | Pay and upload are `−8`; opening the portal and replying are `−3`; telling legal support is a trusted check |
| "Independently known official route; inform unit/legal support" | `verify_known_app` → the case-status app; `verify_known_number` → unit legal support |

### Enhanced synthetic storyline

A high-importance, confidential notice says the learner's accounts appear in a financial-crimes case, a
provisional warrant is attached, a refundable bond of INR 49,500 must be paid through the case portal
before 17:00, and discussing it with anyone — colleagues, family, employer or lawyer — will be treated as
obstruction. The portal "confirms" the case and asks for identity proof, three months of statements and a
selfie with the ID before payment.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast: "National Inquiry Office" |
| Open | The inbox; the notice flagged High importance |
| Inspect | The notice; the details; the warrant preview |
| Branch | Open the case portal; upload; pay; reply for more time; close without responding |
| Verify | The official case-status app; unit legal support; the directory |
| Resolve | Report and keep as evidence |

### Evidence the learner can discover (progressive)

1. High importance, "Confidential", "Do not forward", and a deadline today.
2. The details: an ordinary external domain, a Reply-To on another, payment into a portal, no office or
   phone.
3. The warrant: the seal is a picture in the PDF, and it repeats the secrecy order.
4. The portal's "case lookup" is on the same host the email links to.
5. The case-status app: no record; unit legal support: no authority takes a bond through an emailed link.

### Learner interaction journey

Notify → open the notice → the details and the warrant → close it without responding → look the case up in
the case-status app (or tell legal support) → report and keep the email.

### Simulation surfaces

- `details`, `warrant` (`MAIL`): headers; the warrant preview.
- `portal` (`BROWSER`): `case` → `upload` / `pay`, each with a `final` result page — no form fields.
- `lookup` (`APP`): the official case-status app.
- `legal` (`CALL`): unit legal support.

### Verification mechanism

`verify_known_app` opens the case-status app the learner already uses; `verify_known_number` calls unit
legal support; `verify_trusted_directory` lists the desk. "Check the case number on the portal in the
notice" is `0` — a lookup that can only agree with itself.

### Safe resolution

`resolve_report`, `+2`. Full safe path: `open_item → read → inspect_sender → safe_pivot (close) →
verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Pay INR 49,500 now | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Upload the documents | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Open the case portal from the email | `open_link` | `RISKY_OPEN_REPLY` | −3 |
| Reply asking for more time | `reply` | `RISKY_OPEN_REPLY` | −3 |
| "Delete it and tell no one" | `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.
Opening the portal from the email is `−3`; a learner who reaches it by the local "Go to the case portal"
route still has the decision to make on its upload and pay pages (the E12 pattern).

### Why the final simulation stays faithful

The official-looking notice, the fabricated seal, the secrecy demand, the bond, the portal with its
self-confirming lookup, the refusal to pay or upload and the instruction to break the isolation by telling
legal support are all present — and the "tell no one" ending is the wrong one.

---

## 6. Forms, inputs and data handling

**No screen in this batch accepts typing.** Every E16–E20 decision is a control: adding a reminder,
cancelling or placing a call, holding or releasing a settlement, returning a questionnaire, uploading
documents, paying a bond. `sceneModel.test.js` asserts that no E16–E20 surface has a single form field,
and `SceneScenariosEmailD.test.jsx` asserts no textbox appears on the questionnaire or the portal. This
was a design choice, not an omission: the client's lessons here are about *where* an action goes, and
none needs a learner to type a sensitive value for spectacle. The rules every earlier batch's fields obey
still hold for the platform:

- **Local.** Any value lives in `useLocalForm` state inside the component that draws it; none exists here.
- **Ephemeral.** Leaving a screen unmounts it; walking between portal pages remounts each page.
- **Never transmitted.** No `fetch`, no `<form>`, no action, no submit event. Each commit control is an
  ordinary button carrying a scene affordance — a neutral id and an optional asset id, nothing else.
- **Never persisted.** No `localStorage`, `sessionStorage`, IndexedDB, cookie or cache holds anything
  chosen on these screens; a reload rebuilds the run from the committed stage.
- **Never logged.** No console output, no analytics, no event payload. The engine's `METADATA_ALLOWLIST`
  rejects any metadata key it does not know, and the ledger never stores an action code or control id.
- **No autofill surface.** There are no inputs; the upload page lists document *kinds*, not files, and
  nothing is chosen from the device.
- **No form submission.** The portal's pages move by local links; only the page-scoped scene control
  reaches the engine.
- **Deterministic.** The same control always produces the same event; nothing depends on input.
- **Not decorative.** Every screen that shows a release has the control that commits it, because choosing
  it is the decision.

No real credential, card, account number, identity document, statement, questionnaire answer, phone call
or install exists anywhere in E16–E20.

## 7. What is asserted, and where

| Claim | Test |
| --- | --- |
| Every E16–E20 control resolves to a legal transition on its own pinned definition | `backend/tests/sceneAffordance.test.js` |
| Each safe path scores exactly ten; each pinned unsafe route scores as recorded and reviews as its mistake | `backend/tests/sceneAffordance.test.js` |
| The same routes, stale views, wrong-stage controls, cross-run codes, retries and reloads through a real MongoDB transaction | `backend/tests/emailE16E20Engine.test.js` (isolated DB) |
| E17–E20 never offer `reject_ignore` (E16, legitimate, does) | `backend/tests/sceneAffordance.test.js`, `sceneModel.test.js` |
| No E16–E20 branch shape repeats any of the sixty-five earlier scenes; E17 alone calls; E18 alone decides on an app; no field anywhere | `frontend/src/simulation/sceneModel.test.js` |
| No disposition, family, trigger, end state, feedback, narrator line or verdict word reaches the device | `frontend/src/simulation/sceneModel.test.js`, `SceneScenariosEmailD.test.jsx` |
| Every host is `*.training.example`; every number is in the reserved range (E19 military included) | `frontend/src/simulation/sceneModel.test.js` |
| No `href`, `src`, `iframe`, `form`, media element or host handler on any screen | `SceneContainment.test.jsx`, `SceneScenariosEmailD.test.jsx` |
| Six stages end to end; local navigation records nothing; stale resync; lost-response replay; keyboard operation; remount | `frontend/src/pages/SceneScenariosEmailD.test.jsx` |
| This document covers every authored scenario and cites every technique it names | `frontend/src/simulation/sceneResearch.test.js` |

## 8. Findings during verification

1. **No `−8` branch in E17.** The client places remote access *behind* the call ("a call-confirmation panel
   leading to a synthetic support script asking for remote access"), and the engine takes one branch
   decision per stage. Calling is therefore the scored decision (`−3`) and the install screen is its
   consequence, shown with nothing to press. Adding an unrelated "download the cancellation tool" link to
   manufacture a `−8` would have removed the scene's key property — a lure with no link at all. Recorded
   as a deviation; the stage-4 scoring text is unchanged.
2. **Two branch intents that resolve to the same −8.** E18 (beneficiary change / release) and E20 (upload /
   pay) are alternatives on one surface reached by local navigation, as in E10 and E12.
3. **A forward is a reply to the engine.** Forwarding (E16 to a personal address, E18 to the second
   approver, E19 to the section) submits `reply`; on the legitimate E16 that resolves to
   `UNSAFE_EXTERNAL_ACTION` (−4), on the malicious ones to `RISKY_OPEN_REPLY` (−3). No new intent was
   needed or invented.
4. **Coarse decision-home overlap recorded.** E16 and E03 (both legitimate, in-message) share a coarse
   home, with distinct branch shapes; asserted.
5. **Recorded, not changed (pre-existing):** one scored decision per stage; consequence banners are
   session-only; the result and review cards show the bank's stored sender (E18's shows "Re"). Browser-play
   totals are in `PROJECT_MASTER_PLAN.md`.
