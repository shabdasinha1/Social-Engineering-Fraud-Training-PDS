# Email E06–E10 — real-world research and storyline reconstruction

**Task:** IMMERSIVE-006 — the second Email batch
**Naming:** the client's bank numbers every Email scenario `E01`–`E25` (specification pages 62–87);
this batch is **E06–E10** in the data, the registry, the tests and this document, and it corresponds
to specification **pages 68–72**.
**Scope:** Email E06, E07, E08, E09, E10 only. WhatsApp W01–W25, Instagram I01–I25 and Email E01–E05
are complete and unchanged in behaviour; SMS and Email E11–E25 are untouched.
**Status:** design record for the five Email scenes authored by this task.
**Companions:** [`EMAIL_E01_E05_REAL_WORLD_RESEARCH.md`](EMAIL_E01_E05_REAL_WORLD_RESEARCH.md) and the
WhatsApp and Instagram records, which use the same method.

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

What is taken from the real world is the shape of a mail client and of the lures that arrive in one:
an authority figure asking, from outside, for personnel data; a routine calendar invitation from a
known organiser; a government "refund" that harvests identity and card data; a senior's gift-card
request wrapped in secrecy; and a vendor "banking migration" on a look-alike domain. What is
deliberately **not** taken is infrastructure, tooling, real brands' workflows, real accounts, real
people, real units, real formations, real locations, real schedules, real procedures, real payment
rails or any real capability. "Unit Falcon", its adjutant, its training office, "Col. Dev",
"Northstar Supplies" and "Revenue Refund Centre" are fictional and describe nothing real. Every host
is `*.training.example`; every phone number is in the reserved `+91 00000 xxxxx` range; every inbox,
message, header, invite, attachment preview, browser form, portal and settings screen is local, inert
and offline. No image file exists anywhere. Nothing is fetched, opened, executed, attached, paid or
sent.

### 0.2 Source of the threat intelligence

Primary source: **MITRE ATT&CK, Enterprise matrix, website version v19.2** (released 28 April 2026),
re-confirmed as the current version on the live versions page on 17 September 2026
(<https://attack.mitre.org/versions/>, which resolves to `/resources/versions/`; v18.1 ran 28 October
2025 – 27 April 2026). Technique pages relied on: T1684 (listing T1684.001), T1598 (listing
T1598.003), T1566.002, T1585.002, T1657, T1583.001, T1111, T1114 and T1534, each read against the
same v19.2 release for this batch.

Version note carried forward: `T1656 Impersonation` no longer exists as a top-level technique and
resolves to **T1684.001** (parent T1684 Social Engineering, created 14 April 2026; its only other
sub-technique is T1684.002 Email Spoofing). Older notes citing T1656 should not be trusted.

Secondary sources, for the real-world pattern behind each scenario (all read 17 September 2026):

- **E06** — US Army "Social Media Safety" and OPSEC material on protecting personnel data
  (<https://www.army.mil/socialmedia/safety/>); UK NCSC on spotting requests for sensitive information
  (<https://www.ncsc.gov.uk/guidance/phishing>).
- **E07** — the legitimate control; US NIST Phish Scale material on why not every message is a phish
  and the cost of false alarms (<https://www.nist.gov/publications/phish-scale-user-guide>).
- **E08** — US FTC on government-impersonation and refund scams
  (<https://consumer.ftc.gov/features/government-impersonation-scams>); UK NCSC phishing guidance.
- **E09** — US FBI/IC3 Business Email Compromise advisories and the gift-card variant
  (<https://www.ic3.gov/>); US FTC "Scammers demand gift cards"
  (<https://consumer.ftc.gov/articles/gift-card-scams>).
- **E10** — US FBI/IC3 BEC and vendor/invoice-diversion advisories (<https://www.ic3.gov/>); UK NCSC
  on invoice fraud and supplier bank-detail changes
  (<https://www.ncsc.gov.uk/collection/small-business-guidance-actions-fraud>).

**Source-confidence note.** Where a secondary source is cited by its landing page rather than by a
dated article, that is deliberate: the landing page is the one a reviewer can re-open. Nothing in this
document rests on a secondary source for a *behavioural* claim that ATT&CK is asked to carry. The
ATT&CK citations are the load-bearing ones, every one is linked to its own technique page, and
`sceneResearch.test.js` fails the build if a technique is named here without its page.

### 0.3 Interpretation rule

ATT&CK is used as a **behavioural reference, not a checklist**. A mapping is recorded only where the
technique's own description describes what the scenario does. **E07 has no mapping, and that is
stated** — a known training officer sending an announced calendar invite involves no adversary. Four
techniques were **considered and rejected**, each with its reason: T1114 (E06), T1111 (E08) and
T1534 (E09 and E10). Every mapping in this batch is a partial fit in at least one respect, and each
section says which.

### 0.4 What this document may and may not change

| Thing | May IMMERSIVE-006 change it? |
| --- | --- |
| Scenario IDs, platform, level, disposition, family, trigger, military flag, version | **No** |
| The six stages, their order, their text, expected actions, scoring semantics, feedback | **No** |
| `backend/data/scenarios/v1` and its fingerprint `8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687` | **No** |
| `backend/data/synthetic/v1` and its fingerprint `2779b03939e13cf11e0bee44493609f0c91e228f201f22f8c025a080509afde1` | **No** |
| The engine, the event ledger, the selection algorithm, the 90-minute deadline, the attempt API, the training-feedback review | **No** |
| Scene structure, beats, Email surfaces, forms, phone UI | **Yes — this is the whole task** |

**The client scenario remains authoritative** over everything in this document. Where the research
and the client's own stage text disagree, the client's text wins and the disagreement is recorded.

### 0.5 Content notes carried forward

**The placeholder sender identifier.** Every Email scenario carries a generated `sender_profile`
asset whose `identifier_source` is `placeholder`. Handled as in E01–E05: the scene uses the display
name and address the client's own content implies, carries the notification body verbatim, names the
bank's sender **asset id** on the inspection control, and never invents a real address.

**E09's parsed display name.** The generator stored E09's sender display name as the literal word
"From" (it split the client's "From: Col. Dev — …" sentence). Like the WhatsApp truncations and the
Instagram placeholder handles, the scene uses the name from the client's own sentence — **Col. Dev** —
carries the message verbatim, and never prints the "From" artefact. The bank asset is untouched.

**No truncation elsewhere in this batch.** The other four stored notification bodies are complete
sentences; the truncated-headline list in `sceneModel.test.js` is unchanged.

**The narrator line is not printed.** Each `prior_context` sentence states the situation only; none is
displayed on the device. The verdict-word assertion applies the platform-wide list to every control
label, hint and echo, so no control names the verdict (report controls say "Report the message", never
"Report the spoof/impersonation/look-alike").

**Answer-revealing asset prose is not displayed.** E08's `browser_page` asset carries the client's
stage-4 sentence as its `body`; the scene uses only its `display_target` and `host`. E06's and E10's
generated `file` and `payment_screen` placeholders are not opened by any control; the roster, the
invoice and the beneficiary letter are authored scene content.

**The result card placeholder** (known limitation carried from earlier scenes) applies to all five.

---

## 0.6 Differentiation from Email E01–E05, WhatsApp W01–W25 and Instagram I01–I25

The five new scenes reach further into Email-native mechanics than E01–E05 did, and each decides in a
different place:

| | Behavioural lesson | Social mechanism | Primary evidence | Decision home | Verification pattern | Unsafe temptation |
| --- | --- | --- | --- | --- | --- | --- |
| **E06** | Display names can be copied; keep personnel data in approved systems | Authority (military) | External-sender banner; outside domain; a genuine earlier note from the real adjutant | **The reply composer, with a roster attachment chip** | The Personnel Records System and a call to the adjutant's saved number | Attach the roster; a bare reply |
| **E07** *(legitimate)* | Handle expected invitations from verified organisers normally | Routine + authority | The morning-briefing thread; organiser matches the directory; time and room match the schedule | **A calendar invite card (Accept / Tentative / Decline)** | The course schedule and the directory | Leave it unanswered; an external "add to my calendar" link; reporting the organiser |
| **E08** | Refunds do not need secret codes through unsolicited mail | Greed + urgency | Unexpected refund, generic reference; look-alike host | **A browser refund form (identity + card + OTP)** | The official tax portal from a bookmark | Open the link; reply with details; submit the form |
| **E09** | Authority plus secrecy is the warning sign; verify unusual money requests | Authority + urgency + secrecy | Personal domain; "can't call"; gift cards outside procurement | **A gift-card codes surface** | A call to the duty office and the procurement system | Buy and send codes; reply "on it" |
| **E10** | Independently verify all payment-detail changes; apply dual control | Routine + urgency | One-character domain difference; real invoice reference; changed beneficiary | **The vendor-master edit / payment screen** | A call to the vendor on file and change control | Save the new beneficiary; approve payment; reply confirming |

**New Email-native mechanics this batch adds (reusable, optional):**

| Addition | Where | Used by |
| --- | --- | --- |
| A **calendar invitation card** (`invite` beat) with Accept / Tentative / Decline anchored controls | `email/MailBlocks.jsx`, `scenes/email/shared.js` | E07 |
| A **compose attachment chip** (a draft that carries `compose.attachment`) | `email/EmailScene.jsx` | E06 |
| An **external-sender banner** and a data-classification cue (a `notice` beat plus `conversation.labels`) | reused | E06 |
| A **vendor-master edit / payment portal** and a **gift-card codes surface** (new *uses* of the `BROWSER` surface) | reused | E09, E10 |

**Differentiation, asserted.** `sceneModel.test.js` asserts that the ten Email scenes E01–E10 each
have a distinct branch-stage shape, that E06 attaches from the composer and no other Email scene does,
that E07 is the only one with an invite card, and that the ten decide across at least eight distinct
homes. The one recorded overlap is that E09 and E10 both release on a browser surface (a gift-card
store and a vendor-master portal); their branch shapes and stories differ. `sceneAffordance.test.js`
pins every control's event code and point value and that each safe path sums to ten.

---

## 1. E06 — Adjutant Roster Request

### Client scenario (authoritative)

Specification page 68. Email, **Easy**, **Malicious**, family *Military display-name spoofing / data
request*, trigger *Authority | FICTIONAL MILITARY CONTEXT*. Canonical identity computed by the import
service: family `identity_data_harvesting`, trigger `authority`, military flag **true**, level `easy`.

- **Stage 1 (Event).** "Unit Adjutant: Send the latest personnel roster before the commander's brief."
- **Stage 2 (Open).** A display name resembling the unit adjutant asks for the current personnel
  roster in spreadsheet form.
- **Stage 3 (Inspect).** Examine the full sender address, Reply-To, the external banner and the data
  classification cue. Decision signal: *the external address does not match the approved domain and
  the requested roster is protected.*
- **Stage 4 (Branch).** A reply composer with a synthetic roster attachment chip. Expected: *do not
  attach or summarise roster/personnel information.*
- **Stage 5 (Verify).** Contact the adjutant through the approved internal directory and document
  system.
- **Stage 6 (Resolve).** Cancel the reply; report the spoof through unit security; do not attach data.
- **End state / feedback.** No roster is attached; display names can be copied — verify the full
  address and keep personnel data in approved systems.

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1684.001** Social Engineering: Impersonation | <https://attack.mitre.org/techniques/T1684/001/> | Strong. The message impersonates the unit adjutant to extract data. |
| **T1598** Phishing for Information | <https://attack.mitre.org/techniques/T1598/> | **Partial fit, stated.** A plain email asking the recipient to reply with the roster elicits information, but the technique's sub-techniques name a service, an attachment or a link rather than a bare reply request. |

**Why this maps.** An assumed identity (T1684.001) is used to elicit sensitive information by email
(T1598). The authority pressure — the commander's brief — is the social engine, which ATT&CK does not
model.

**Considered and rejected.** **T1114 Email Collection**
(<https://attack.mitre.org/techniques/T1114/>) is an adversary reading the victim's own mailbox; here
the learner is asked to send a roster, not have their mail harvested. It is named only to say why it
does not apply.

**What must NOT be copied.** No real unit, adjutant, rank, personnel record, roster format or brief
schedule; no real address. "Unit Falcon", the Records System and the roster are drawn from invented
`*.training.example` content, and no personnel data exists anywhere.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The inbox row and the message body |
| "Full sender address, Reply-To, external banner, classification" | The details sheet, the "External sender" notice, and the "Protected" label |
| "Reply composer with a synthetic roster attachment chip" | The composer's "Attach the roster spreadsheet and send" draft, with a drawn attachment chip |
| "Do not attach or summarise roster/personnel information" | Discard the draft (`safe_pivot`); a bare reply is `−3`, attaching is `−8` |
| "Approved internal directory and document system" | `verify_known_app` → the Personnel Records System; `verify_known_number` → the adjutant's call |
| "Cancel the reply; report the spoof" | Report and cancel the reply (`resolve_report`) |

### Enhanced synthetic storyline

The real adjutant's earlier note is in the same thread: the roster stays in the Records System and is
never emailed. Today an "Unit Adjutant" on an outside domain demands the roster spreadsheet before the
commander's brief. The reply composer offers to attach it.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast |
| Open | The inbox; the adjutant row marked External |
| Inspect | The message, the external banner, the earlier real note, and the details sheet |
| Branch | The reply composer with the roster attachment |
| Verify | The Records System, or the adjutant call |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. The external-sender banner and the "Protected" label.
2. The details sheet: the outside domain, and the approved adjutant address on file.
3. The earlier genuine note from the real adjutant.
4. The Records System: the adjutant's address on file, and that the roster is never emailed.
5. The call: the adjutant confirms he did not send it.

### Learner interaction journey

Notify → open the email → the external banner, the earlier note and the details → discard the reply
draft → open the Records System or call the adjutant → report and cancel.

### Simulation surfaces

- `details` (`MAIL`): sender, Reply-To and classification.
- `records` (`APP`): the Personnel Records System.
- `call` (`CALL`): the adjutant's saved number.
- The trusted-directory overlay, with the adjutant's approved address.

### Verification mechanism

`verify_known_app` opens the Records System; `verify_known_number` calls the adjutant;
`verify_trusted_directory` lists him. Replying to the external address to confirm is `0`; reporting
without checking is `+1`.

### Safe resolution

`resolve_report`, `+2`. Full safe path: `open_item → read → inspect_sender → safe_pivot (discard) →
verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Attach the roster and send | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Reply to ask which format | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Reply from the list first | `reply` at open | `PREMATURE_REPLY` | −1 |
| Send the roster to be safe | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.

### Why the final simulation stays faithful

Every client element is present: the copied display name, the external address and banner, the
protected-data cue, the reply composer with the roster attachment, the Records System and adjutant
checks, and the report.

---

## 2. E07 — Expected Training Calendar Invite

### Client scenario (authoritative)

Specification page 69. Email, **Easy**, **Legitimate**, family *Legitimate calendar invitation*,
trigger *Routine + authority | FICTIONAL MILITARY CONTEXT*. Canonical identity: family
`legit_coordination_request`, triggers `routine` + `authority`, military flag **true**, level `easy`,
legitimate control **true**.

- **Stage 1 (Event).** "Training Office: Invite — Social Engineering Lab, 04 Sep, Training Room C."
- **Stage 2 (Open).** A known training officer sends the calendar invite announced in the morning
  briefing.
- **Stage 3 (Inspect).** Examine the organiser address, the expected time/location, the attendee list
  and the absence of external login. Decision signal: *the invitation matches the prior announcement
  and organiser directory entry.*
- **Stage 4 (Branch).** The in-app calendar card with Accept / Tentative / Decline. Expected: *use the
  normal in-app path; do not switch to an untrusted channel.*
- **Stage 5 (Verify).** Compare the organiser with the Trusted Directory and the local course
  schedule. If it matches, continue; do not report or block a legitimate sender.
- **Stage 6 (Resolve).** Accept / tentative / decline normally; do not report the sender.
- **End state / feedback.** The response is stored locally; expected invitations from verified
  organisers are handled normally without a false alarm.

### MITRE ATT&CK alignment

**There is none, and none has been invented.** ATT&CK catalogues adversary behaviour. In E07 there is
no adversary: the training office sends the calendar invite it announced that morning, from its usual
address, for a session on the published schedule. The only risks are the learner's own — ignoring an
expected invite, jumping to an external link, or reporting a legitimate organiser — and ATT&CK does
not model a person's over-caution.

**Closest defensible behavioural reference** — deliberately not an ATT&CK technique:

- US NIST, "Phish Scale User Guide", on why not every message is a phish and the cost of false
  positives (<https://www.nist.gov/publications/phish-scale-user-guide>).
- UK NCSC phishing guidance on proportionate response (<https://www.ncsc.gov.uk/guidance/phishing>).

The defensive frame is a proportionate check followed by the normal in-app response, and not treating
a legitimate organiser as hostile.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The inbox row and the invite title |
| "Organiser address, expected time/location, attendee list, no external login" | The details sheet and the invite card's when/where/organiser/attendees |
| "Calendar card with Accept/Tentative/Decline" | The `invite` beat's three anchored controls (all `CORRECT_USE`) |
| "Do not switch to an untrusted channel" | The external "add to my personal calendar" link (`open_link` → `UNSAFE_EXTERNAL_ACTION`, −4) |
| "Compare with the Trusted Directory and the course schedule" | `verify_known_app` → the course schedule; `verify_trusted_directory` |
| "Do not report or block a legitimate sender" | `report`/`block` at verify → `FALSE_REPORT_BLOCK`, −4 |

### Enhanced synthetic storyline

This morning's briefing thread announced the Social Engineering Lab for Thursday. The Training Office
now sends the calendar invite from its usual address, with the same date, time and room, and nothing
to sign in to.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast |
| Open | The inbox; the invite among ordinary mail |
| Inspect | The briefing thread, the invite card and the details |
| Branch | The invite card; Accept / Tentative / Decline |
| Verify | The course schedule, or the directory |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. The morning-briefing thread announcing this exact session.
2. The details sheet: organiser matches the directory; time and room match the schedule; no sign-in.
3. The invite card: when, where, organiser and attendees.
4. The course schedule: the same session, room and organiser.

### Learner interaction journey

Notify → open the invite → the briefing thread, the card and the details → Accept (or Tentative /
Decline) → compare with the course schedule or the directory → keep the response.

### Simulation surfaces

- `details` (`MAIL`): organiser, time and room.
- `schedule` (`APP`): the course schedule.
- The trusted-directory overlay, with the Training Office.

### Verification mechanism

`verify_known_app` opens the course schedule; `verify_trusted_directory` lists the organiser. Replying
to confirm is `0`; **reporting or blocking a legitimate organiser is a false positive, −4.**

### Safe resolution

`resolve_continue` (or `resolve_retain`), `+2`. Full safe path: `open_item → read → inspect_sender →
safe_pivot (Accept) → verify_known_app → resolve_continue` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Open the external "add to my calendar" link | `open_link` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Leave the invite unanswered | `reject_ignore` | `NEEDLESS_REJECT_IGNORE` | −2 |
| Report or block the organiser | `report` / `block` | `FALSE_REPORT_BLOCK` | −4 |
| Report it at the end | `resolve_report` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `CORRECT_USE +3`, `NEEDLESS_REJECT_IGNORE −2`, `UNSAFE_EXTERNAL_ACTION −4`; Accept,
Tentative and Decline all resolve to `CORRECT_USE`; the external link resolves to the `−4` code.

### Why the final simulation stays faithful

Every client element is present: the announced invite, the matching organiser/time/room, the calendar
card with all three responses, the schedule and directory comparison, and the rule against reporting a
legitimate organiser. As the batch's legitimate control it is deliberately not thinner than its
malicious neighbours: an invite card, a details sheet, the briefing thread and its own schedule check.

---

## 3. E08 — Instant Tax Refund

### Client scenario (authoritative)

Specification page 70. Email, **Easy**, **Malicious**, family *Government impersonation / refund
phishing*, trigger *Greed + urgency*. Canonical identity: family `financial_credential_phishing`,
triggers `greed` + `urgency`, military flag **false**, level `easy`.

- **Stage 1 (Event).** "Revenue Refund Centre: INR 7,840 refund expires today — complete release."
- **Stage 2 (Open).** A tax-themed email promises a refund but asks for card and identity details
  through a button.
- **Stage 3 (Inspect).** Examine the sender domain, the generic reference, the urgency and the link
  destination. Decision signal: *unexpected refunds and expiry pressure do not justify submitting
  financial/identity data to a message link.*
- **Stage 4 (Branch).** A fake refund form requesting PAN-like ID, card and OTP. Expected: *do not
  enter identity, account, card or OTP data.*
- **Stage 5 (Verify).** Open the official portal using a known address and check filed-return status.
- **Stage 6 (Resolve).** Close; report; do not submit or reply.
- **End state / feedback.** The portal shows no refund case; check status in the official portal you
  open yourself.

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1566.002** Phishing: Spearphishing Link | <https://attack.mitre.org/techniques/T1566/002/> | Strong. The lure delivers a link to a data-harvesting refund form. |
| **T1684.001** Social Engineering: Impersonation | <https://attack.mitre.org/techniques/T1684/001/> | **Partial fit, stated.** The message impersonates a revenue authority; the technique frames impersonation broadly. |
| **T1598.003** Phishing for Information: Spearphishing Link | <https://attack.mitre.org/techniques/T1598/003/> | **Partial fit, stated.** The form gathers identity, card and OTP; the technique's focus is information gathering rather than a refund lure. |

**Why this maps.** A link (T1566.002) under a government identity (T1684.001) drives a form that
harvests identity and card data (T1598.003). The greed of an "instant refund" plus a same-day expiry
is the social engine.

**Considered and rejected.** **T1111 Multi-Factor Authentication Interception**
(<https://attack.mitre.org/techniques/T1111/>) is technical capture of a factor; here the person is
asked to type a one-time code into a form. It is named only to say why it does not apply.

**What must NOT be copied.** No real revenue authority, refund workflow, portal branding, reference
format or card page. The refund form and the tax portal are drawn from invented
`*.training.example` hosts and no money moves.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The inbox row and the message body |
| "Sender domain, generic reference, urgency, link destination" | The details sheet and the countdown; the link-targets page |
| "Fake refund form: PAN-like ID, card and OTP" | The `BROWSER` form's local fields |
| "Do not enter identity, account, card or OTP data" | Close the refund page (`safe_pivot`) |
| "Official portal using a known address; filed-return status" | `verify_known_app` → the tax portal (no refund case) |
| "Close; report; do not submit or reply" | Report and delete (`resolve_report`) |

### Enhanced synthetic storyline

A "Revenue Refund Centre" mail says a refund of INR 7,840 expires today and pushes a "Release my
refund" button to a form that asks for an identity number, a card number and a one-time code.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast |
| Open | The inbox; the refund row |
| Inspect | The message, the countdown, the button; the details/targets |
| Branch | The refund form |
| Verify | The tax portal, or the directory |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. The details sheet: unexpected refund, generic reference, look-alike host.
2. The link-targets page: the button opens a training host.
3. The refund form: identity, card and one-time code.
4. The tax portal: no open refund case; the last return had no refund due.

### Learner interaction journey

Notify → open the email → the sender details and link target → close the refund page → open the tax
portal or the directory → report and delete.

### Simulation surfaces

- `details` (`MAIL`): sender, reference and link targets.
- `refund` (`BROWSER`): the refund form (identity, card, OTP).
- `portal` (`BROWSER`): the official tax portal.
- The trusted-directory overlay.

### Verification mechanism

`verify_known_app` opens the tax portal; `verify_trusted_directory` lists the desk. Replying to the
sender is `0`; reporting without checking is `+1`.

### Safe resolution

`resolve_report`, `+2`. Full safe path: `open_item → read → inspect_sender → safe_pivot (close) →
verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Submit identity, card and OTP | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Open the refund link | `open_link` | `RISKY_OPEN_REPLY` | −3 |
| Reply with the details | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Complete the refund release | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.

### Why the final simulation stays faithful

Every client element is present: the expiring refund, the generic reference, the harvesting form, the
independent portal check showing no case, and the report.

---

## 4. E09 — Executive Gift-Card Request

### Client scenario (authoritative)

Specification page 71. Email, **Medium**, **Malicious**, family *Business email compromise*, trigger
*Authority + urgency + secrecy | FICTIONAL MILITARY CONTEXT*. Canonical identity: family
`payment_diversion`, triggers `authority` + `urgency` + `isolation_secrecy`, military flag **true**,
level `medium`.

- **Stage 1 (Event).** "From: Col. Dev — Need six gift cards for visitors. Keep this confidential."
- **Stage 2 (Open).** A senior's display name appears on a personal email asking for gift cards while
  claiming to be in a meeting.
- **Stage 3 (Inspect).** Examine the full sender, Reply-To, the unusual channel, the secrecy and the
  payment method. Decision signal: *the personal domain and gift-card request contradict normal
  procurement controls.*
- **Stage 4 (Branch).** A reply/purchase mock asking for gift-card images and codes. Expected: *do not
  buy cards, send codes or conceal the request.*
- **Stage 5 (Verify).** Call the senior/duty office through the known directory and check procurement
  authorisation.
- **Stage 6 (Resolve).** Do not purchase; report the impersonation; notify the verified senior/security
  route.
- **End state / feedback.** The senior denies the request; authority plus secrecy is a warning sign —
  verify unusual financial requests with a known contact and approved workflow.

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1684.001** Social Engineering: Impersonation | <https://attack.mitre.org/techniques/T1684/001/> | Strong. The message impersonates a senior officer. |
| **T1585.002** Establish Accounts: Email Accounts | <https://attack.mitre.org/techniques/T1585/002/> | **Partial fit, stated.** A personal look-alike address is used to send the request; whether it was newly created is inferred from the story. |
| **T1657** Financial Theft | <https://attack.mitre.org/techniques/T1657/> | **Partial fit, stated.** The goal is gift-card fraud; the Impact technique covers the theft but not the impersonation channel. |

**Why this maps.** A senior is impersonated (T1684.001) from a personal email account (T1585.002) to
commit gift-card fraud (T1657). The authority, urgency and secrecy are the social engine.

**Considered and rejected.** **T1534 Internal Spearphishing**
(<https://attack.mitre.org/techniques/T1534/>) is phishing from an already-compromised **internal**
account; here the sender is an external personal look-alike, not the officer's real mailbox. It is
named only to say why it does not apply.

**What must NOT be copied.** No real officer, rank, name, unit or procurement process; no real gift-card
brand or store. "Col. Dev", the gift-card store and the procurement system are drawn from invented
`*.training.example` content, and no card code the learner types leaves the component.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The inbox row and the message body |
| "Full sender, Reply-To, unusual channel, secrecy, payment method" | The details sheet's identity, headers and signals |
| "Reply/purchase mock asking for gift-card images and codes" | The gift-card store's codes form |
| "Do not buy cards, send codes or conceal the request" | Don't reply or buy (`safe_pivot`); a reply is `−3`, sending codes is `−8` |
| "Call the senior/duty office; check procurement authorisation" | `verify_known_number` → the duty office; `verify_known_app` → procurement |
| "Do not purchase; report the impersonation" | Report and buy nothing (`resolve_report`) |

### Enhanced synthetic storyline

A short message from "Col. Dev" on a personal look-alike address says he is in a meeting and can't
call, needs six gift cards for visitors, wants the codes photographed and kept confidential, and will
reimburse later.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast |
| Open | The inbox; the "Col. Dev" row |
| Inspect | The short message and the details sheet |
| Branch | The gift-card store and its codes form |
| Verify | The duty-office call, or procurement |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. The details sheet: the personal domain versus the official address.
2. The signals: "can't call", keep it confidential, gift cards.
3. Procurement: no authorisation; gift cards are not an approved method.
4. The call: the duty office confirms the Colonel asked for nothing.

### Learner interaction journey

Notify → open the email → the personal domain and secrecy signals → don't reply or buy → call the duty
office or check procurement → report and buy nothing.

### Simulation surfaces

- `details` (`MAIL`): sender, channel and payment method.
- `purchase` (`BROWSER`): the gift-card store and codes form.
- `call` (`CALL`): the duty office.
- `procure` (`APP`): the procurement system.
- The trusted-directory overlay.

### Verification mechanism

`verify_known_number` calls the duty office; `verify_known_app` opens procurement;
`verify_trusted_directory` lists it. Replying to the personal address is `0`; reporting without
checking is `+1`.

### Safe resolution

`resolve_report`, `+2`. Full safe path: `open_item → read → inspect_sender → safe_pivot (refuse) →
verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Send the card codes | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Reply that you'll get them | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Reply from the list first | `reply` at open | `PREMATURE_REPLY` | −1 |
| Buy the cards to be safe | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.

### Why the final simulation stays faithful

Every client element is present: the senior's display name on a personal address, the secrecy and the
gift-card method, the codes form, the duty-office call and procurement check, and the report.

---

## 5. E10 — Vendor Changes Bank Details

### Client scenario (authoritative)

Specification page 72. Email, **Medium**, **Malicious**, family *Invoice/payment diversion*, trigger
*Routine + urgency*. Canonical identity: family `payment_diversion`, triggers `routine` + `urgency`,
military flag **false**, level `medium`.

- **Stage 1 (Event).** "Northstar Supplies: Banking migration — use the attached new beneficiary for
  invoice NS-104."
- **Stage 2 (Open).** A look-alike vendor domain replies with a real project reference and a new
  beneficiary account.
- **Stage 3 (Inspect).** Examine the one-character domain difference, Reply-To, the changed
  beneficiary and the approval gap. Decision signal: *stolen context can make fraud convincing;
  beneficiary changes require independent callback and dual control.*
- **Stage 4 (Branch).** An invoice preview and vendor-master edit screen. Expected: *do not change
  bank details or approve payment from the email alone.*
- **Stage 5 (Verify).** Call the known vendor contact on file and use the approved change-control
  process.
- **Stage 6 (Resolve).** Hold payment; report the look-alike sender; record the attempted change.
- **End state / feedback.** The update is rejected and the real vendor confirms no change;
  independently verify all payment-detail changes and apply dual approval.

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1684.001** Social Engineering: Impersonation | <https://attack.mitre.org/techniques/T1684/001/> | Strong. The message impersonates the vendor on a look-alike domain. |
| **T1583.001** Acquire Infrastructure: Domains | <https://attack.mitre.org/techniques/T1583/001/> | **Partial fit, stated.** A one-character look-alike domain is used; whether it was registered by the adversary is inferred from the story. |
| **T1657** Financial Theft | <https://attack.mitre.org/techniques/T1657/> | **Partial fit, stated.** The goal is diverting an invoice payment; the Impact technique covers the theft but not the invoice-thread channel. |

**Why this maps.** A look-alike domain (T1583.001) impersonates the vendor (T1684.001) to divert an
invoice payment (T1657). The stolen invoice context and the "move quickly" urgency are the social
engine.

**Considered and rejected.** **T1534 Internal Spearphishing**
(<https://attack.mitre.org/techniques/T1534/>) is phishing from a compromised **internal** account;
here the sender is an external look-alike vendor domain, not a hijacked internal mailbox. It is named
only to say why it does not apply.

**What must NOT be copied.** No real vendor, invoice, project, bank, account number or IFSC. "Northstar
Supplies", the invoice and the accounts are drawn from invented `*.training.example` content, no money
moves, and no account number the learner types leaves the component.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The inbox row and the message body |
| "One-character domain difference, Reply-To, changed beneficiary, approval gap" | The details sheet's signals |
| "Invoice preview and vendor-master edit screen" | The attachment preview and the `BROWSER` vendor-master pages |
| "Do not change bank details or approve payment from the email alone" | Hold and change nothing (`safe_pivot`); saving and approving are both `−8` |
| "Call the known vendor contact; approved change-control process" | `verify_known_number` → the vendor call; `verify_known_app` → change control |
| "Hold payment; report the look-alike sender" | Hold and report (`resolve_report`) |

### Enhanced synthetic storyline

The genuine invoice NS-104 thread from the real vendor domain is quoted below. A reply from a domain
one character different announces a "banking migration" and a new beneficiary in an attached letter,
asking that the change be applied and the invoice settled today.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast |
| Open | The inbox; the vendor row with an attachment |
| Inspect | The quoted invoice thread, the beneficiary letter and the details |
| Branch | The vendor-master record, edit and payment pages |
| Verify | The vendor call, or change control |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. The earlier genuine invoice from the real domain.
2. The details sheet: the one-character difference and the approval gap.
3. The beneficiary letter, which cannot verify a change on its own.
4. The vendor master: the account on file versus the requested one.
5. Change control: no approved change; the process needs a callback and dual approval.
6. The call: the vendor confirms no change.

### Learner interaction journey

Notify → open the email → the quoted thread, the attachment and the details → hold and change nothing →
call the vendor or check change control → hold payment and report.

### Simulation surfaces

- `details` (`MAIL`): sender domain, Reply-To and the change.
- `preview` (`MAIL`): the beneficiary letter.
- `vendormaster` (`BROWSER`): the record, edit and payment pages.
- `call` (`CALL`): the vendor on file.
- `changecontrol` (`APP`): the approved change process.
- The trusted-directory overlay.

### Verification mechanism

`verify_known_number` calls the vendor on file; `verify_known_app` opens change control;
`verify_trusted_directory` lists the vendor on file. Replying to the look-alike is `0`; reporting
without checking is `+1`.

### Safe resolution

`resolve_report`, `+2`. Full safe path: `open_item → read → inspect_sender → safe_pivot (hold) →
verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Save the new beneficiary | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Approve the payment | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Reply confirming the change | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Apply the change to keep the vendor happy | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`; both
the beneficiary save and the payment approval resolve to the `−8` code.

### Why the final simulation stays faithful

Every client element is present: the quoted invoice thread, the one-character domain, the changed
beneficiary, the vendor-master edit and payment screens, the vendor call and change-control checks, and
the hold-and-report resolution.

---

## 6. Forms, inputs and data handling

Three screens in this batch accept typing: E08's refund form (identity number, card, one-time code),
E09's gift-card codes form (code, PIN), and E10's beneficiary edit (account number, IFSC). E06's
roster attachment and E07's calendar responses are decisions, not fields. They obey the rules
`SceneForms.test.jsx` and `SceneContainment.test.jsx` already enforce on every earlier batch:

- **Local.** Every value lives in `useLocalForm` state inside the component that draws it. It is never
  lifted, never passed to an affordance, never put in an intent or in metadata.
- **Ephemeral.** Leaving the screen unmounts the component and the state is gone; walking to the next
  browser page discards the previous page's values by remount.
- **Never transmitted.** No `fetch`, no `<form>`, no action, no submit event. The commit control is an
  ordinary button carrying a scene affordance — an intent and an optional asset id, nothing else.
- **Never persisted.** No `localStorage`, `sessionStorage`, IndexedDB, cookie or cache holds a typed
  value; a reload rebuilds the run from the committed stage with the fields empty.
- **Never logged.** No console output, no analytics, no event payload. The engine's
  `METADATA_ALLOWLIST` rejects any metadata key it does not know.
- **No autofill surface.** Every input is `type="text"` with `autoComplete="off"` and a meaningless
  `name`; PINs are masked by CSS, never `type="password"`.
- **No form submission.** A page's `primary` control validates length and walks to the next page; it
  scores nothing.
- **Deterministic.** A field is satisfied by its character count. Same input, same result.
- **Not decorative.** The fields are real inputs, because declining to type is the decision.

The roster in E06 is never a real file and is never attached to anything; no field accepts a real
credential, card, wallet key, identity number, service number, account number or document.

## 7. What is asserted, and where

| Claim | Test |
| --- | --- |
| Every E06–E10 control resolves to a legal transition on its own pinned definition | `backend/tests/sceneAffordance.test.js` |
| Each safe path scores exactly ten, in six stages, and produces the positive review card | `backend/tests/sceneAffordance.test.js` |
| Each named control keeps its event code and point value | `backend/tests/sceneAffordance.test.js` |
| E06, E08, E09 and E10 never offer `reject_ignore` | `backend/tests/sceneAffordance.test.js` |
| The review leaks no scoring code or point value | `backend/tests/sceneAffordance.test.js` |
| The ten Email scenes each have a distinct branch shape; E06 attaches from the composer; E07 uses an invite card | `frontend/src/simulation/sceneModel.test.js` |
| No disposition, family, trigger, end state, feedback, narrator line or verdict word reaches the device | `frontend/src/simulation/sceneModel.test.js`, `SceneScenariosEmailB.test.jsx` |
| Every host is `*.training.example`; every number is in the reserved range | `frontend/src/simulation/sceneModel.test.js` |
| No `href`, `src`, `iframe`, `form`, media element or host handler on any screen | `SceneContainment.test.jsx`, `SceneScenariosEmailB.test.jsx` |
| Typed values never leave the component | `SceneScenariosEmailB.test.jsx` |
| The five scenarios play end to end through the real controller and attempt API | `frontend/src/pages/SceneScenariosEmailB.test.jsx` |
| This document covers every authored scenario and cites every technique it names | `frontend/src/simulation/sceneResearch.test.js` |

## 8. Findings during verification

Recorded as they were found, with what was done about each.

1. **Verdict words in report labels.** First drafts read "Report the spoof", "Report the organiser as
   suspicious", "Report the impersonation" and "report the look-alike"; the cross-scene verdict-word
   guard bans `spoof*`, `suspicious`, `impersonat*` and `look-?alike` on any control. Reworded to
   "Report the message" / "Report the organiser" before testing.
2. **Cross-platform branch-shape collisions.** A `slot:intent` branch shape is a small space, so an
   Email scene will occasionally share one with a WhatsApp or Instagram scene; the distinctness
   guarantee is asserted **within** the ten Email scenes (all unique), and the E09/E10 shared decision
   home is recorded rather than hidden.
3. **Recorded, not changed (pre-existing):** closing a pushed screen returns keyboard focus to the
   page body; the result and review cards show the bank's stored sender. Both are shared behaviour from
   earlier batches. Browser-play totals are in `PROJECT_MASTER_PLAN.md`.
