# Email E01–E05 — real-world research and storyline reconstruction

**Task:** IMMERSIVE-005 — the first Email batch
**Naming:** the client's bank numbers every Email scenario `E01`–`E25` (specification pages
62–87); this batch is **E01–E05** in the data, the registry, the tests and this document, and it
corresponds to specification **pages 63–67**.
**Scope:** Email E01, E02, E03, E04, E05 only. WhatsApp W01–W25 and Instagram I01–I25 are complete
and unchanged in behaviour; SMS and Email E06–E25 are untouched.
**Status:** design record for the five Email scenes authored by this task.
**Companions:** the five WhatsApp records and the five Instagram records, which use the same method.

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
a password-expiry notice with a sign-in link, a macro-enabled invoice that asks to "Enable Content",
a routine authenticated internal newsletter, a customs "clearance fee" on an unexpected parcel, and
a compliance-flavoured HR acknowledgement with a countdown. What is deliberately **not** taken is
infrastructure, tooling, real brands' workflows, real accounts, real people, real units, real
formations, real locations, real payment rails or any real capability. "Unit Falcon", its "IT
Helpdesk", its "People Office" and its "Learning Office" are fictional and describe nothing. Every
host is `*.training.example`; every phone number is in the reserved `+91 00000 xxxxx` range; every
inbox, message, header, attachment preview, browser page, payment sheet, portal and settings screen
is local, inert and offline. No image file exists anywhere — avatars, brand mastheads, the drawn
spreadsheet grid and the file glyphs are drawn from CSS. Nothing is fetched, opened, executed,
extracted, installed or paid.

### 0.2 Source of the threat intelligence

Primary source: **MITRE ATT&CK, Enterprise matrix, website version v19.2** (released 28 April 2026),
re-confirmed as the current version on the live versions page on 17 September 2026
(<https://attack.mitre.org/versions/>, which resolves to `/resources/versions/`; v18.1 ran 28 October
2025 – 27 April 2026). Technique pages relied on: T1566.001, T1566.002, T1598.003, T1204.002,
T1684 (listing T1684.001), T1657, T1534, T1137 and T1111, each read against the same v19.2 release
for this batch.

Version note carried forward: `T1656 Impersonation` no longer exists as a top-level technique and
resolves to **T1684.001** (parent T1684 Social Engineering, created 14 April 2026; its only other
sub-technique is T1684.002 Email Spoofing). Older notes citing T1656 should not be trusted.

Secondary sources, for the real-world pattern behind each scenario (all read 17 September 2026):

- **E01** — US CISA, "Avoiding Social Engineering and Phishing Attacks"
  (<https://www.cisa.gov/news-events/news/avoiding-social-engineering-and-phishing-attacks>); UK NCSC,
  "Phishing attacks: defending your organisation"
  (<https://www.ncsc.gov.uk/guidance/phishing>); the DMARC/SPF/DKIM authentication summary is the
  M3AAWG / RFC 7489 alignment concept a mail client surfaces.
- **E02** — US CISA on macro-enabled documents and "Enable Content"
  (<https://www.cisa.gov/news-events/news/avoiding-social-engineering-and-phishing-attacks>); UK NCSC
  guidance on macros in office documents (<https://www.ncsc.gov.uk/guidance/macro-security-for-microsoft-office>).
- **E03** — the legitimate control; no adversary. US NIST Phish Scale material on why not every
  message is a phish, and the value of a proportionate check
  (<https://www.nist.gov/publications/phish-scale-user-guide>).
- **E04** — US FTC, "delivery scam text/email" consumer advice
  (<https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams>); UK NCSC / Action
  Fraud on parcel-fee scams (<https://www.ncsc.gov.uk/collection/phishing-scams>).
- **E05** — US CISA and NCSC phishing guidance above on compliance/authority pressure and countdowns;
  US FTC on messages that threaten to suspend an account or pay.

**Source-confidence note.** Where a secondary source is cited by its landing page rather than by a
dated article, that is deliberate: the landing page is the one a reviewer can re-open. Nothing in this
document rests on a secondary source for a *behavioural* claim that ATT&CK is asked to carry. The
ATT&CK citations are the load-bearing ones, every one is linked to its own technique page, and
`sceneResearch.test.js` fails the build if a technique is named here without its page.

### 0.3 Interpretation rule

ATT&CK is used as a **behavioural reference, not a checklist**. A mapping is recorded only where the
technique's own description describes what the scenario does. **E03 has no mapping, and that is
stated** — a routine authenticated internal newsletter with no action request has no adversary. Five
techniques were **considered and rejected**, each with its reason: T1111 (E01), T1137 (E02), T1598.003
(E04), T1534 (E05), and T1204.002 is named for E01 only to say it does not apply there. Every mapping
in this batch is a partial fit in at least one respect, and each section says which.

### 0.4 What this document may and may not change

| Thing | May IMMERSIVE-005 change it? |
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
asset whose `identifier_source` is `placeholder`. Handled as in W01–W25 and I01–I25: the scene uses
the display name and address the client's own content implies, carries the notification body verbatim,
names the bank's sender **asset id** on the inspection control, and never invents a real address. Each
scene's sender address is a `*.training.example` host.

**No truncation in this batch.** All five stored notification bodies are complete sentences; the
truncated-headline list in `sceneModel.test.js` is unchanged.

**The narrator line is not printed.** Each `prior_context` sentence states the situation only; none is
displayed on the device. The verdict-word assertion applies the platform-wide list to every control
label, hint and echo; the word "phishing" (which appears in the scenarios' families) never appears on
a control.

**Answer-revealing asset prose is not displayed.** E01, E04 and E05's `browser_page` assets and E02's
`file` asset carry the client's stage-4 sentence as their `body`/`preview`. The scenes use only each
asset's `display_target`/`host`/name; no control opens the generic inspection sheet on them.

**The result card placeholder** (known limitation carried from W01–I25) applies to all five: the
result and review cards show the bank's stored sender for the item.

---

## 0.6 Differentiation from WhatsApp W01–W25 and Instagram I01–I25

Email is authored as a mail client, not a chat or a feed: an inbox with folders, a message opened
from its row, a sender line that expands into full headers and an authentication summary, a body with
the sender's own branded buttons and attachments, quoted history behind a toggle, and Reply/Forward
sheets with a To line. The five scenes decide in five different places, none of them a WhatsApp or
Instagram surface:

| | Behavioural lesson | Social mechanism | Primary evidence | Decision home | Verification pattern | Unsafe temptation |
| --- | --- | --- | --- | --- | --- | --- |
| **E01** | A familiar logo is not sender proof; change passwords from the portal, never a link | Urgency + authority | From/Reply-To on unrelated hosts; SPF/DKIM/DMARC fail; a genuine month-old reminder in the thread | **A cloned sign-in page in the browser** | The learner's own **Account portal** (nothing expiring) and the IT desk in the directory | Click the button; enter username, password and OTP |
| **E02** | An unexpected macro document is high risk; a spreadsheet needs no macros to show an invoice | Routine + urgency | Unknown sender; `.xlsm`; "Enable Content"; no prior thread | **The attachment preview's "Enable content" bar** | The **vendor system** (no such supplier) and a call to the saved finance desk | Enable content; save the file to a shared drive |
| **E03** *(legitimate)* | Routine authenticated mail can be handled normally after a proportionate check | Routine | Matching monthly cadence; SPF/DKIM/DMARC pass; no attachment, no login | **The in-message newsletter (read/archive)** | The internal **newsletter archive** (issue number matches) | Report or block it; forward it off-platform |
| **E04** | Unexpected parcel fees are a lure; verify tracking in the official service before paying | Fear + curiosity | Unrequested tracking number; look-alike host; a fee collected on a linked page | **A payment sheet reached from a fake tracking page** | The **courier's own app** (no such parcel) | Open the tracking link; pay the clearance fee |
| **E05** | Compliance language is weaponised; start from the known HR portal, not a message link | Authority + duty/compliance | Generic greeting; Reply-To off-domain; countdown; look-alike host | **A cloned HR login and acknowledgement page** | The approved **HR portal** (no task assigned) | Reply to confirm; enter password and payroll details |

**Concepts kept distinct within the batch.** E01 and E05 are both credential phishing, so their
decision homes and branch shapes are deliberately different: E01's tempting act is clicking a scored
link button (`open_link`) and its release is a sign-in form; E05's tempting act is a **reply** that
confirms before signing in (`reply`) and its release is a cloned HR acknowledgement reached by
ordinary navigation. E02's decision is an **attachment preview**, E04's is a **payment sheet**, and
E03 is the **legitimate control**. `sceneModel.test.js` asserts the five branch-stage shapes are
distinct from one another; `sceneAffordance.test.js` pins each control's event code and point value.

### The Email surface this batch adds (reusable, optional)

| Addition | Where | Used by |
| --- | --- | --- |
| The mail app itself: inbox with folders, message pane, sender line → details, Reply/Forward sheets | `components/simulation/email/EmailScene.jsx`, `MailBlocks.jsx` | E01–E05 |
| `MAIL` surface: a page graph for message details (From/Reply-To, authentication summary, "Show original", link targets), an attachment preview with an "Enable content" bar and a drawn spreadsheet grid, and an in-message reader | `components/simulation/surfaces/MailSurface.jsx` | E01–E05 |

Everything else is reused unchanged: `BROWSER` (the sign-in / tracking / acknowledgement pages and
their forms), `PAYSHEET` (E04's clearance fee), `APP` (the account portal, vendor system, newsletter
archive, courier app and HR portal), `CALL` (E02's finance desk), the trusted-directory overlay, the
local-form containment in `SceneForm.jsx`/`localForm.js`, and the neutral learner-action contract.

---

## 1. E01 — Password Expires Today

### Client scenario (authoritative)

Specification page 63. Email, **Easy**, **Malicious**, family *Credential phishing*, trigger
*Urgency + authority*. Canonical identity computed by the import service: family
`credential_phishing`, triggers `urgency` + `authority`, military flag **false**, level `easy`.

- **Stage 1 (Event).** "IT Service Desk: Password expires today — retain access by validating now."
- **Stage 2 (Open).** Open the unread IT-themed email. Context: a message using IT branding says the
  mailbox password expires today.
- **Stage 3 (Inspect).** Examine the full From/Reply-To, the authentication summary and the link
  target. Decision signal: *the display name looks official but the sender and Reply-To use unrelated
  reserved domains.*
- **Stage 4 (Branch).** A synthetic sign-in page that requests username, password and OTP. Expected:
  *do not enter credentials; use Back/Close or a safe preview only.*
- **Stage 5 (Verify).** Open the known account/security portal directly from the trusted directory.
- **Stage 6 (Resolve).** Close the page; report; verify account status in the official portal.
- **End state / feedback.** The official portal shows no expiry; a familiar logo is not sender proof.

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1566.002** Phishing: Spearphishing Link | <https://attack.mitre.org/techniques/T1566/002/> | Strong. The lure delivers a link to a credential-harvesting page. |
| **T1684.001** Social Engineering: Impersonation | <https://attack.mitre.org/techniques/T1684/001/> | **Partial fit, stated.** The message impersonates an internal IT desk; the technique frames impersonation broadly, not specifically an emailed sign-in link. |

**Why this maps.** The adversary sends a link (T1566.002) under an assumed identity (T1684.001) to
harvest a password and one-time code. The urgency — a same-day expiry — is the social engine, which
ATT&CK does not model.

**Considered and rejected.** **T1111 Multi-Factor Authentication Interception**
(<https://attack.mitre.org/techniques/T1111/>) is technical capture of a factor; here the person is
asked to type a one-time code into a page. It is named only to say why it does not apply.

**What must NOT be copied.** No real IT-desk name, ticketing format, SSO branding, portal layout or
password-reset workflow; no real authentication-server strings. The headers, the SPF/DKIM/DMARC
summary and the portal are drawn from invented `*.training.example` hosts.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The inbox row and the message subject/body |
| "Full From/Reply-To and authentication summary" | The `MAIL` details page: From, Reply-To, To, Mailed-by; SPF/DKIM/DMARC all fail |
| "Link target" | "Where does the button go?" lists the button's real `*.training.example` target against its shown text |
| "Synthetic sign-in page: username, password, OTP" | The `BROWSER` sign-in page's local form |
| "Do not enter credentials; Back/Close or safe preview only" | Close the sign-in page (`safe_pivot`); leaving without clicking (`safe_pivot`) |
| "Known account/security portal from the trusted directory" | `verify_known_app` → Account portal; `verify_trusted_directory` → the IT desk |
| Report/verify at resolve | Report and delete (`resolve_report`); the wrong option kept beside it |

### Enhanced synthetic storyline

A month ago the real IT helpdesk sent a routine maintenance notice from `helpdesk@falcon.unit…`,
saying password changes are made in the portal and it will never send a sign-in link. Today a message
branded "IT Service Desk" from an unrelated host says the password expires today and pushes a
"Validate password now" button. The two sit in the same thread, so the contrast is on screen.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast |
| Open | The inbox; the IT row among ordinary mail |
| Inspect | The message: brand band, body, countdown and the button; the details sheet behind the sender line |
| Branch | The sign-in page the button opens, or its consequence |
| Verify | The Account portal, or the directory |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. The month-old genuine reminder from a different address.
2. The details sheet: From and Reply-To on unrelated hosts; SPF/DKIM/DMARC fail.
3. "Show original": raw headers with `spf=fail dkim=fail dmarc=fail`.
4. The link targets page: the button opens a training host, not the portal.
5. The Account portal: password active, 47 days left, no pending action.

### Learner interaction journey

Notify → open the email → the sender details, original headers and link targets → close the sign-in
page (or refuse to click) → open the Account portal or the directory → report and delete.

### Simulation surfaces

- `details` (`MAIL`): details, original, targets.
- `login` (`BROWSER`): portal, signin (local form: username, password, OTP), done.
- `portal` (`APP`): the Account portal.
- The trusted-directory overlay, with the IT helpdesk row.

### Verification mechanism

`verify_known_app` opens the portal (the client's named route); `verify_trusted_directory` lists the
desk. Replying to the sender to ask is `0`; reporting without checking is `+1`.

### Safe resolution

`resolve_report`, `+2`. Full safe path: `open_item → read → inspect_sender → safe_pivot (close) →
verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Enter username, password and OTP | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Click the "Validate now" button | `open_link` | `RISKY_OPEN_REPLY` | −3 |
| Reply from the list before reading | `reply` at open | `PREMATURE_REPLY` | −1 |
| Keep it and validate later | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.

### Why the final simulation stays faithful

Every client element is present: the IT-branded expiry, the full headers and authentication summary,
the link target, the credential-harvesting sign-in page, the direct portal check and the report.

---

## 2. E02 — Invoice Spreadsheet Macro

### Client scenario (authoritative)

Specification page 64. Email, **Easy**, **Malicious**, family *Malicious attachment*, trigger
*Routine + urgency*. Canonical identity: family `malware_delivery`, triggers `routine` + `urgency`,
military flag **false**, level `easy`.

- **Stage 1 (Event).** "Accounts Notice: Overdue invoice — enable content to view payment lines."
- **Stage 2 (Open).** Open the inbox message with `Invoice_8841.xlsm`. Context: an unknown supplier
  sends an overdue invoice as a macro-enabled spreadsheet.
- **Stage 3 (Inspect).** Examine the sender domain, the unexpected supplier, the file extension and
  the "Enable Content" instruction. Decision signal: *a macro-enabled file from an unknown sender is
  not needed to view an invoice and may execute code.*
- **Stage 4 (Branch).** An inert spreadsheet preview followed by an "Enable Content" prompt. Expected:
  *do not enable macros, run content or upload the file elsewhere.*
- **Stage 5 (Verify).** Check the supplier in the approved vendor system and call the known finance
  contact.
- **Stage 6 (Resolve).** Do not enable; report; quarantine the attachment.
- **End state / feedback.** The attachment stays inert and is quarantined; treat unexpected
  macro-enabled documents as high risk.

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1566.001** Phishing: Spearphishing Attachment | <https://attack.mitre.org/techniques/T1566/001/> | Strong. The lure delivers a malicious document as an attachment. |
| **T1204.002** User Execution: Malicious File | <https://attack.mitre.org/techniques/T1204/002/> | Strong. "Enable Content" is the user action the technique describes. |
| **T1684.001** Social Engineering: Impersonation | <https://attack.mitre.org/techniques/T1684/001/> | **Partial fit, stated.** An "Accounts" persona is asserted, but the technique is broader than a fake supplier invoice. |

**Why this maps.** A malicious attachment (T1566.001) relies on the recipient enabling its macros
(T1204.002), sent under a plausible billing identity (T1684.001). The overdue-fee urgency is the
social engine.

**Considered and rejected.** **T1137 Office Application Startup**
(<https://attack.mitre.org/techniques/T1137/>) is persistence via Office features after execution;
this scenario is the delivery and the enable-content decision, and nothing runs or persists. It is
named only to say why it does not apply.

**What must NOT be copied.** No real supplier, invoice format, macro payload or office-suite dialog
text; no real file. The spreadsheet is a drawn grid whose amounts read "Enable content to view", and
nothing is opened, run, extracted or uploaded.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The inbox row and the message body |
| "Invoice_8841.xlsm" | The attachment card and the preview title |
| "Sender domain, unexpected supplier, file extension, Enable Content" | The details sheet (macro/new-sender/caution rows) and the preview's "Enable content" bar |
| "Inert spreadsheet preview followed by Enable Content" | The `MAIL` preview page: a drawn grid behind a protected-view bar |
| "Do not enable macros, run content or upload elsewhere" | Close without enabling / delete unopened (`safe_pivot`) |
| "Approved vendor system and call the known finance contact" | `verify_known_app` → vendor system; `verify_known_number` → the finance desk call |
| "Do not enable; report; quarantine" | Report and quarantine (`resolve_report`) |

### Enhanced synthetic storyline

An "Accounts Notice" sender the learner has never dealt with forwards an "overdue" invoice as a
macro-enabled spreadsheet, with a quoted "automated reminder" behind the toggle to look like a chain.
Opening the file shows an inert grid whose figures are hidden until content is enabled.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast |
| Open | The inbox; the Accounts row with a paperclip |
| Inspect | The message, the attachment card and the details/preview |
| Branch | The preview's "Enable content" bar |
| Verify | The vendor system, or the finance-desk call |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. The details sheet: first message from this address; Reply-To on an invoices host.
2. The attachment facts: macro-enabled `.xlsm`; the requested action is "Enable Content".
3. The preview: a protected-view bar; amounts hidden behind "Enable content to view".
4. The vendor system: not an approved supplier; no invoices assigned.
5. The finance desk: confirms it sent nothing and never sends macro files.

### Learner interaction journey

Notify → open the email → the sender details and the attachment preview → close without enabling (or
delete unopened) → check the vendor system or call the finance desk → report and quarantine.

### Simulation surfaces

- `details` (`MAIL`): the sender and attachment summary.
- `preview` (`MAIL`): the file card, the "Enable content" bar and the drawn grid; enabled/saved
  outcome pages.
- `vendor` (`APP`): the approved-supplier lookup.
- `finance` (`CALL`): the saved finance desk.
- The trusted-directory overlay, with the finance desk row.

### Verification mechanism

`verify_known_app` opens the vendor system; `verify_known_number` calls the finance desk;
`verify_trusted_directory` lists it. Replying to the sender is `0`; reporting without checking is `+1`.

### Safe resolution

`resolve_report`, `+2`. Full safe path: `open_item → read → inspect_sender → safe_pivot (delete) →
verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Save the file to the shared drive | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Enable content | `open_file` | `RISKY_OPEN_REPLY` | −3 |
| Reply from the list before reading | `reply` at open | `PREMATURE_REPLY` | −1 |
| Keep it and deal with it later | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.

### Why the final simulation stays faithful

Every client element is present: the unknown supplier, the `.xlsm`, the Enable-Content instruction,
the inert preview, the vendor-system and finance-contact checks and the quarantine.

---

## 3. E03 — Authenticated Internal Newsletter

### Client scenario (authoritative)

Specification page 65. Email, **Easy**, **Legitimate**, family *Legitimate internal communication*,
trigger *Routine*. Canonical identity: family `legit_routine_broadcast`, triggers `routine`, military
flag **false**, level `easy`, legitimate control **true**.

- **Stage 1 (Event).** "Learning Office: September safety newsletter — read-only edition."
- **Stage 2 (Open).** Open the unread newsletter. Context: the monthly training newsletter arrives
  from the expected authenticated internal domain with no action request.
- **Stage 3 (Inspect).** Examine the full sender, the authentication summary, the prior monthly thread
  and the absence of attachments or login requests. Decision signal: *it matches cadence and domain,
  passes the checks and asks for nothing sensitive.*
- **Stage 4 (Branch).** The in-message newsletter reader with Archive / Mark unread. Expected: *use
  the normal in-app path; do not switch to an untrusted channel.*
- **Stage 5 (Verify).** Compare the sender and issue number with the local internal directory/archive.
  If it matches, continue; do not report or block a legitimate sender.
- **Stage 6 (Resolve).** Read/archive normally; do not report or block.
- **End state / feedback.** The newsletter is read and archived; routine authenticated mail can be
  handled normally after a proportionate check.

### MITRE ATT&CK alignment

**There is none, and none has been invented.** ATT&CK catalogues adversary behaviour. In E03 there is
no adversary: an internal office sends its monthly newsletter from its usual authenticated address,
with nothing to click and nothing to send back. The only risks are the learner's own — reporting a
genuine sender, or forwarding internal communications off-platform — and ATT&CK does not model a
person's over-caution or mishandling.

**Closest defensible behavioural reference** — deliberately not an ATT&CK technique:

- US NIST, "Phish Scale User Guide", on why not every message is a phish and the cost of false
  positives (<https://www.nist.gov/publications/phish-scale-user-guide>).
- UK NCSC phishing guidance on proportionate response (<https://www.ncsc.gov.uk/guidance/phishing>).

The defensive frame is a proportionate check followed by normal handling, and not treating a
legitimate sender as hostile.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The inbox row and the message body |
| "Full sender and authentication summary" | The details sheet: From/Reply-To on the internal domain; SPF/DKIM/DMARC pass |
| "Prior monthly thread" | Last month's edition from the same address, in the thread |
| "Absence of attachments/login requests" | No attachment beat; the reader says there is nothing to sign in to |
| "In-message newsletter reader with Archive/Mark unread" | Read and archive / mark as read (`safe_pivot` → `CORRECT_USE`) |
| "Do not switch to an untrusted channel" | Forwarding it to a personal email (`reply` → `UNSAFE_EXTERNAL_ACTION`, −4) |
| "Compare sender and issue number with the internal archive" | `verify_known_app` → the archive, where the issue number matches |
| "Do not report or block a legitimate sender" | `report`/`block` at verify → `FALSE_REPORT_BLOCK`, −4 |

### Enhanced synthetic storyline

The Learning Office sends its September edition (Issue 09/2026) from the address it always uses, on
its usual cadence, with fire-drill dates, a phishing refresher and a reading list. August's edition
is in the same thread. Nothing asks for a sign-in or a reply.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast |
| Open | The inbox; the newsletter among ordinary mail |
| Inspect | The message, last month's edition, the details sheet and the reader |
| Branch | The reader; Archive / Mark unread |
| Verify | The archive, or the directory |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. Last month's edition, from the same address.
2. The details sheet: internal domain; SPF/DKIM/DMARC pass; matches the monthly cadence.
3. The reader: a read-only refresher, nothing to sign in to.
4. The archive: Issue 09/2026 published today; the number matches the message.

### Learner interaction journey

Notify → open the newsletter → last month's edition, the details and the reader → read and archive →
compare the issue number in the archive → keep it, mark as read.

### Simulation surfaces

- `details` (`MAIL`): sender and authentication (all pass).
- `reader` (`MAIL`): the newsletter reader.
- `archive` (`APP`): the internal newsletter archive.
- The trusted-directory overlay, with the Learning Office row.

### Verification mechanism

`verify_known_app` opens the archive (the client's named route); `verify_trusted_directory` lists the
Learning Office. Replying to check is `0`; **reporting or blocking a legitimate sender is a false
positive, −4.**

### Safe resolution

`resolve_continue` (or `resolve_retain`), `+2`. Full safe path: `open_item → read → inspect_sender →
safe_pivot (archive) → verify_known_app → resolve_continue` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Forward it to a personal email | `reply` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Delete it unread, just in case | `reject_ignore` | `NEEDLESS_REJECT_IGNORE` | −2 |
| Report or block the sender | `report` / `block` | `FALSE_REPORT_BLOCK` | −4 |
| Report it at the end | `resolve_report` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `CORRECT_USE +3`, `NEEDLESS_REJECT_IGNORE −2`, `UNSAFE_EXTERNAL_ACTION −4`;
`safe_pivot` resolves to `CORRECT_USE`; the risky intents resolve to the `−4` code.

### Why the final simulation stays faithful

Every client element is present: the authenticated internal sender, the matching cadence and thread,
the passing checks, no attachment or login, the in-app read/archive, the archive comparison and the
rule against reporting a legitimate sender. As the batch's legitimate control it is deliberately not
thinner than its four neighbours: three surfaces, a full thread and its own verification route.

---

## 4. E04 — Customs Parcel Hold

### Client scenario (authoritative)

Specification page 66. Email, **Easy**, **Malicious**, family *Delivery impersonation / fee phishing*,
trigger *Fear + curiosity*. Canonical identity: family `financial_credential_phishing`, triggers
`fear` + `curiosity`, military flag **false**, level `easy`.

- **Stage 1 (Event).** "RapidShip Customs: Parcel RS-441 held. Pay a small clearance fee today."
- **Stage 2 (Open).** Open the delivery email and its tracking button. Context: a courier-themed email
  claims a parcel is held for missing customs payment.
- **Stage 3 (Inspect).** Examine the sender domain, the unsolicited tracking number, the link target
  and the payment urgency. Decision signal: *the parcel is unexpected and the button leads to a
  look-alike reserved domain.*
- **Stage 4 (Branch).** A fake tracking page requesting card/UPI data. Expected: *do not enter payment
  information or identity documents.*
- **Stage 5 (Verify).** Open the known courier site/app independently and search the number.
- **Stage 6 (Resolve).** Close; report; retain the message as evidence.
- **End state / feedback.** The known courier mock reports no such parcel; verify tracking in the
  official service before paying anything.

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1566.002** Phishing: Spearphishing Link | <https://attack.mitre.org/techniques/T1566/002/> | Strong. The lure delivers a link to a look-alike tracking-and-payment page. |
| **T1684.001** Social Engineering: Impersonation | <https://attack.mitre.org/techniques/T1684/001/> | **Partial fit, stated.** The message impersonates a courier's customs desk; the technique frames impersonation broadly. |
| **T1657** Financial Theft | <https://attack.mitre.org/techniques/T1657/> | **Partial fit, stated.** The end goal is a fraudulent fee; ATT&CK's Impact technique covers the theft but not the delivery lure. |

**Why this maps.** A link (T1566.002) under a courier identity (T1684.001) drives the recipient to a
page that collects a fraudulent payment (T1657). The fear of a lost parcel and a same-day deadline is
the social engine.

**Considered and rejected.** **T1598.003 Phishing for Information: Spearphishing Link**
(<https://attack.mitre.org/techniques/T1598/003/>) is reconnaissance for information rather than
access or money; E04's page collects a payment, so the fit is T1566.002 plus T1657, and T1598.003 is
named only to say why it does not apply.

**What must NOT be copied.** No real courier name, tracking format, customs procedure, payment page or
fee schedule; no real payment rail. The tracking page and the payment sheet are drawn from invented
`*.training.example` hosts and no money can move.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The inbox row and the message body |
| "Sender domain, unsolicited tracking number, link target, payment urgency" | The details sheet (unrequested tracking, look-alike button target, fee-on-a-page) and the countdown |
| "Fake tracking page requesting card/UPI data" | The `BROWSER` tracking page → the `PAYSHEET` clearance fee |
| "Do not enter payment information or identity documents" | Close the tracking page / leave it (`safe_pivot`) |
| "Known courier site/app independently and search the number" | `verify_known_app` → the RapidShip app, where the number is not found |
| "Close; report; retain as evidence" | Report and keep as evidence (`resolve_report`) |

### Enhanced synthetic storyline

A courier-branded email says parcel RS-441 is held at customs pending a small clearance fee, with a
shipment timeline and a "Track & pay clearance" button and a release countdown. The button opens a
look-alike tracking page whose only action is a payment sheet.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast |
| Open | The inbox; the courier row |
| Inspect | The message, the timeline, the countdown, the button; the details/targets |
| Branch | The tracking page and its payment sheet |
| Verify | The RapidShip app, or the directory |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. The details sheet: not a saved contact; tracking not requested; the button's look-alike host.
2. The link targets page: the button opens a training host.
3. The tracking page: a clearance fee, then a payment sheet.
4. The RapidShip app: no parcel with that number; couriers never collect fees by an emailed link.

### Learner interaction journey

Notify → open the email → the sender details and link target → close the tracking page (or leave it)
→ open the RapidShip app or the directory → report and keep as evidence.

### Simulation surfaces

- `details` (`MAIL`): sender, tracking and link targets.
- `tracking` (`BROWSER`): the fake tracking page.
- `paysheet` (`PAYSHEET`): the clearance-fee sheet (PIN then Confirm; its Back cancels).
- `courier` (`APP`): the RapidShip app.
- The trusted-directory overlay, with the mail-room row.

### Verification mechanism

`verify_known_app` opens the courier app; `verify_trusted_directory` lists the mail room. Replying to
the sender is `0`; reporting without checking is `+1`.

### Safe resolution

`resolve_report`, `+2`. Full safe path: `open_item → read → inspect_sender → safe_pivot (close) →
verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Pay the clearance fee | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Open the tracking link | `open_link` | `RISKY_OPEN_REPLY` | −3 |
| Reply from the list before reading | `reply` at open | `PREMATURE_REPLY` | −1 |
| Pay the fee to release it | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.
The payment sheet reveals its Confirm control only after a PIN, so there is no safe control behind
the PIN: its Back cancels, matching the batch rule set in W16/I16.

### Why the final simulation stays faithful

Every client element is present: the held-parcel lure, the unrequested tracking number, the look-alike
link, the payment page, the independent courier check and the report-and-retain resolution.

---

## 5. E05 — Mandatory HR Policy Login

### Client scenario (authoritative)

Specification page 67. Email, **Easy**, **Malicious**, family *HR impersonation / credential
phishing*, trigger *Authority + compliance*. Canonical identity: family `credential_phishing`,
triggers `authority` + `duty_compliance`, military flag **false**, level `easy`.

- **Stage 1 (Event).** "People Office: Mandatory policy acknowledgement due in 60 minutes."
- **Stage 2 (Open).** Open the HR-themed email. Context: a message says pay access will be suspended
  unless a policy is acknowledged through a login button.
- **Stage 3 (Inspect).** Examine the sender domain, the Reply-To, the generic greeting, the countdown
  and the destination. Decision signal: *high-pressure, look-alike domain, bypasses the approved HR
  portal.*
- **Stage 4 (Branch).** A cloned HR login and acknowledgement screen. Expected: *do not enter
  password, OTP or payroll information.*
- **Stage 5 (Verify).** Open the approved HR portal from a bookmark/directory and check assigned
  tasks.
- **Stage 6 (Resolve).** Close; report; take no action in the message.
- **End state / feedback.** The approved portal shows no task; compliance language can be weaponised —
  start from the known HR portal, not a message link.

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1566.002** Phishing: Spearphishing Link | <https://attack.mitre.org/techniques/T1566/002/> | Strong. A link leads to a cloned HR login that harvests credentials. |
| **T1684.001** Social Engineering: Impersonation | <https://attack.mitre.org/techniques/T1684/001/> | **Partial fit, stated.** The message impersonates the People Office; the technique frames impersonation broadly. |
| **T1598.003** Phishing for Information: Spearphishing Link | <https://attack.mitre.org/techniques/T1598/003/> | **Partial fit, stated.** The page also collects payroll detail; the technique's focus is information gathering rather than the compliance login. |

**Why this maps.** A link (T1566.002) under an HR identity (T1684.001) drives a cloned login that
harvests a password and payroll data (T1598.003). The compliance pressure and a 60-minute countdown
are the social engine.

**Considered and rejected.** **T1534 Internal Spearphishing**
(<https://attack.mitre.org/techniques/T1534/>) is phishing sent from an **already-compromised
internal account**; here the message only impersonates HR and its SPF/DKIM/DMARC fail, so it is
external. It is named only to say why it does not apply.

**What must NOT be copied.** No real HR system, policy-acknowledgement workflow, payroll layout,
employee-ID format or portal branding. The acknowledgement page and the HR portal are drawn from
invented `*.training.example` hosts.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The inbox row and the message body |
| "Sender domain, reply-to, generic greeting, countdown, destination" | The details sheet (generic greeting, off-domain Reply-To, look-alike host, fail checks) and the countdown |
| "Cloned HR login and acknowledgement screen" | The `BROWSER` acknowledgement page → sign-in form (employee ID, password, payroll) |
| "Do not enter password, OTP or payroll information" | Close the acknowledgement page / leave it (`safe_pivot`) |
| "Approved HR portal from a bookmark/directory; check assigned tasks" | `verify_known_app` → the HR portal, no task assigned |
| "Close; report; take no action" | Report and take no action (`resolve_report`) |

### Enhanced synthetic storyline

A "People Office" message with a generic "Dear employee" greeting says a mandatory policy must be
acknowledged within 60 minutes or pay access is suspended, with an "Acknowledge policy now" button.
The button opens a cloned HR login that asks for the employee ID, password and payroll account.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast |
| Open | The inbox; the People Office row |
| Inspect | The message, the countdown, the button; the details/targets |
| Branch | The acknowledgement page, or the reply |
| Verify | The HR portal, or the directory |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. The details sheet: generic greeting; Reply-To off-domain; SPF/DKIM/DMARC fail.
2. The link targets page: the button opens a look-alike host.
3. The HR portal: no acknowledgement assigned; payroll active, nothing to do.

### Learner interaction journey

Notify → open the email → the sender details and link target → close the acknowledgement page (or
refuse) → open the HR portal or the directory → report and take no action.

### Simulation surfaces

- `details` (`MAIL`): sender, greeting, authentication and link targets.
- `portal` (`BROWSER`): the acknowledgement page → sign-in form (employee ID, password, payroll).
- `hr` (`APP`): the approved HR portal.
- The trusted-directory overlay, with the People Office row.

### Verification mechanism

`verify_known_app` opens the HR portal (the client's named route); `verify_trusted_directory` lists
the People Office. Replying to check is `0`; reporting without checking is `+1`.

### Safe resolution

`resolve_report`, `+2`. Full safe path: `open_item → read → inspect_sender → safe_pivot (close) →
verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Enter employee ID, password and payroll | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Reply to confirm before signing in | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Reply from the list before reading | `reply` at open | `PREMATURE_REPLY` | −1 |
| Acknowledge now to keep pay access | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.

### Why the final simulation stays faithful

Every client element is present: the compliance pressure and countdown, the generic greeting and
off-domain Reply-To, the cloned HR login, the direct portal check and the report with no action taken.

---

## 6. Forms, inputs and data handling

Four screens in this batch accept typing: E01's sign-in page (username, password, one-time code),
E04's clearance-fee sheet (a UPI PIN), and E05's acknowledgement sign-in (employee ID, password,
payroll account). E02's "Enable content" and "Save the file" are decisions, not fields. They obey the
rules `SceneForms.test.jsx` and `SceneContainment.test.jsx` already enforce on every earlier batch:

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
  `name`; PINs and passwords are masked by CSS, never `type="password"`.
- **No form submission.** A page's `primary` control validates length and walks to the next page; it
  scores nothing.
- **Deterministic.** A field is satisfied by its character count. Same input, same result.
- **Not decorative.** The fields are real inputs, because declining to type is the decision.

No field accepts a real credential, card, wallet key, identity number, employee number, payroll
account or document; the payment sheet moves no money and the attachment is never opened, run or
extracted.

## 7. What is asserted, and where

| Claim | Test |
| --- | --- |
| Every E01–E05 control resolves to a legal transition on its own pinned definition | `backend/tests/sceneAffordance.test.js` |
| Each safe path scores exactly ten, in six stages, and produces the positive review card | `backend/tests/sceneAffordance.test.js` |
| Each named control keeps its event code and point value | `backend/tests/sceneAffordance.test.js` |
| E01, E02, E04 and E05 never offer `reject_ignore` | `backend/tests/sceneAffordance.test.js` |
| The review leaks no scoring code or point value | `backend/tests/sceneAffordance.test.js` |
| No branch-stage shape repeats another in the batch | `frontend/src/simulation/sceneModel.test.js` |
| No disposition, family, trigger, end state, feedback, narrator line or verdict word reaches the device | `frontend/src/simulation/sceneModel.test.js`, `SceneScenariosEmail.test.jsx` |
| Every host is `*.training.example`; every number is in the reserved range | `frontend/src/simulation/sceneModel.test.js` |
| No `href`, `src`, `iframe`, `form`, media element or host handler on any screen | `SceneContainment.test.jsx`, `SceneScenariosEmail.test.jsx` |
| Typed values never leave the component | `SceneScenariosEmail.test.jsx` |
| The five scenarios play end to end through the real controller and attempt API | `frontend/src/pages/SceneScenariosEmail.test.jsx` |
| This document covers every authored scenario and cites every technique it names | `frontend/src/simulation/sceneResearch.test.js` |

## 8. Findings during verification

Recorded as they were found, with what was done about each.

1. **"phishing" in report labels.** The first draft used "Report phishing" on verify/resolve controls;
   the cross-scene verdict-word guard bans "phishing" on any control. Rewritten to "Report the
   message" / "Report and delete it" before testing.
2. **Two inspect controls without `skip_inspection`.** E02 and E03 offer sender inspection, a file
   preview / thread read, but no "skip" — deliberate; the affordance tests use the read-thread control
   for their unsafe walks instead.
3. **Recorded, not changed (pre-existing):** closing a pushed screen returns keyboard focus to the
   page body rather than to the control that opened it (the options sheet does restore focus); the
   result and review cards show the bank's stored sender. Both are shared behaviour from earlier
   batches. Browser-play totals are in `PROJECT_MASTER_PLAN.md`.
