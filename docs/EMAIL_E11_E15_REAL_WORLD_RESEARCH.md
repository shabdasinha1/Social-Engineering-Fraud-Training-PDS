# Email E11–E15 — real-world research and storyline reconstruction

**Task:** IMMERSIVE-007 — the third Email batch
**Naming:** the client's bank numbers every Email scenario `E01`–`E25` (specification pages 62–87);
this batch is **E11–E15** in the data, the registry, the tests and this document, and it corresponds
to specification **pages 73–77**.
**Scope:** Email E11, E12, E13, E14, E15 only. WhatsApp W01–W25, Instagram I01–I25 and Email E01–E10
are complete and unchanged in behaviour; SMS and Email E16–E25 are untouched.
**Status:** design record for the five Email scenes authored by this task.
**Companions:** [`EMAIL_E01_E05_REAL_WORLD_RESEARCH.md`](EMAIL_E01_E05_REAL_WORLD_RESEARCH.md),
[`EMAIL_E06_E10_REAL_WORLD_RESEARCH.md`](EMAIL_E06_E10_REAL_WORLD_RESEARCH.md) and the WhatsApp and
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

What is taken from the real world is the shape of a mail client and of the lures that arrive in one:
an automatic status notification that a workflow published in a portal; a "document shared with you"
that leads to a cloned sign-in and a push-approval prompt; a password-protected archive whose password
travels in the same message; a look-alike headquarters address sending a "revised order" behind a QR
code; and a "mandatory security app" that asks for consent rather than a password. What is deliberately
**not** taken is infrastructure, tooling, real brands' workflows, real accounts, real people, real
units, real formations, real locations, real schedules, real procedures, real payment rails or any real
capability. "Unit Falcon", the People Portal, "HQ Alpha Movements", "MailSafe Analyzer", "Case
Documents" and every other actor are fictional and describe nothing real. Every host is
`*.training.example`; every phone number is in the reserved `+91 00000 xxxxx` range; every inbox,
message, header, archive, PDF preview, QR inspector, browser form, consent screen, portal and settings
screen is local, inert and offline. No image file exists anywhere. Nothing is fetched, opened, executed,
extracted, decoded, approved, granted, paid or sent.

### 0.2 Source of the threat intelligence

Primary source: **MITRE ATT&CK, Enterprise matrix, website version v19.2** (released 28 April 2026),
re-confirmed as the current version on the live versions page on 18 September 2026
(<https://attack.mitre.org/versions/>, which resolves to `/resources/versions/`; v18.1 ran 28 October
2025 – 27 April 2026, v17.1 before it). Technique pages relied on: T1566.001, T1566.002, T1204.001,
T1204.002, T1027.013, T1528, T1621, T1671, T1550.001, T1684.001 and T1140, each read against the same
v19.2 release for this batch.

Version note carried forward: `T1656 Impersonation` no longer exists as a top-level technique and
resolves to **T1684.001** (parent T1684 Social Engineering). Older notes citing T1656 should not be
trusted.

Secondary sources, for the real-world pattern behind each scenario (all read 18 September 2026):

- **E11** — the legitimate control; US NIST "Phish Scale" material on why not every message is a phish
  and the cost of false alarms (<https://www.nist.gov/publications/phish-scale-user-guide>); UK NCSC on
  a proportionate response (<https://www.ncsc.gov.uk/guidance/phishing>).
- **E12** — Microsoft and CISA guidance on OAuth/consent and MFA-fatigue ("push bombing") attacks
  (<https://www.cisa.gov/news-events/cybersecurity-advisories>); UK NCSC phishing guidance.
- **E13** — UK NCSC and US CISA guidance on password-protected archives used to bypass mail scanning
  (<https://www.ncsc.gov.uk/guidance/phishing>); US CISA on malicious attachments
  (<https://www.cisa.gov/news-events/cybersecurity-advisories>).
- **E14** — US/UK advisories on QR-code phishing ("quishing") in documents and the tailoring of
  military-themed lures from public information (<https://www.ncsc.gov.uk/guidance/phishing>); US Army
  OPSEC material (<https://www.army.mil/socialmedia/safety/>).
- **E15** — Microsoft/CISA guidance on illicit consent grants and reviewing connected apps
  (<https://www.cisa.gov/news-events/cybersecurity-advisories>); UK NCSC on cloud application security
  (<https://www.ncsc.gov.uk/guidance/phishing>).

**Source-confidence note.** Where a secondary source is cited by its landing page rather than by a dated
article, that is deliberate: the landing page is the one a reviewer can re-open. Nothing in this document
rests on a secondary source for a *behavioural* claim that ATT&CK is asked to carry. The ATT&CK citations
are the load-bearing ones, every one is linked to its own technique page, and `sceneResearch.test.js`
fails the build if a technique is named here without its page.

### 0.3 Interpretation rule

ATT&CK is used as a **behavioural reference, not a checklist**. A mapping is recorded only where the
technique's own description describes what the scenario does. **E11 has no mapping, and that is stated** —
an automatic portal notification about a request the learner themselves made involves no adversary. Every
mapping in this batch is a partial fit in at least one respect, and each section says which. Techniques
were **considered and rejected** where they nearly fit but do not, each with its reason (T1111 for E12,
T1140 for E13, T1566.002 for E14, T1550.001 and T1621 for E15). Two families in this batch — QR-code
phishing (E14) and MFA push-approval (E12) — have no dedicated ATT&CK technique in v19.2, and the
sections say so and map to the nearest documented behaviour instead.

### 0.4 What this document may and may not change

| Thing | May IMMERSIVE-007 change it? |
| --- | --- |
| Scenario IDs, platform, level, disposition, family, trigger, military flag, version | **No** |
| The six stages, their order, their text, expected actions, scoring semantics, feedback | **No** |
| `backend/data/scenarios/v1` and its fingerprint `8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687` | **No** |
| `backend/data/synthetic/v1` and its fingerprint `2779b03939e13cf11e0bee44493609f0c91e228f201f22f8c025a080509afde1` | **No** |
| The engine, the event ledger, the selection algorithm, the 90-minute deadline, the attempt API, the training-feedback review | **No** |
| Scene structure, beats, Email surfaces, forms, phone UI | **Yes — this is the whole task** |

**The client scenario remains authoritative** over everything in this document. Where the research and
the client's own stage text disagree, the client's text wins and the disagreement is recorded.

### 0.5 Content notes carried forward

**The placeholder sender identifier.** Every Email scenario carries a generated `sender_profile` asset
whose `identifier_source` is `placeholder`. Handled as in E01–E10: the scene uses the display name and
address the client's own content implies, carries the notification body verbatim where it is a complete
sentence, names the bank's sender **asset id** on the inspection control, and never invents a real
address.

**E12's fragmentary notification body.** The generator stored E12's notification body as the fragment
`"Docs Share:"` (it split the client's sentence at the colon). Like E09's parsed display name in the
previous batch, the scene does not print the fragment as a subject; it uses a complete subject built from
the client's own stage text — the shared-document title "Updated Deployment Photos" — and carries the
"Docs Share" branding as the HTML masthead. The bank asset is untouched.

**The narrator line is not printed.** Each `prior_context` sentence states the situation only; none is
displayed on the device. The verdict-word assertion applies the platform-wide list to every control
label, hint and echo, so no control names the verdict (report controls say "Report the message", never
"Report the spoof/impersonation/look-alike/phish").

**Answer-revealing asset prose is not displayed.** E11's, E12's and E14's `browser_page`/`file`/`qr`
assets carry the client's stage-4 sentences as their `body`/`preview`; the scenes use only their
`display_target`/`host`/`decoded_target`, never the narrating sentence. The archive and PDF are authored
scene content; the simulated executable named in E13's `file` asset is never opened by any control.

**The result card placeholder** (known limitation carried from earlier scenes) applies to all five.

---

## 0.6 Differentiation from Email E01–E10, WhatsApp W01–W25 and Instagram I01–I25

The five new scenes reach into Email-native mechanics none of the first ten used, and each decides in a
different place:

| | Behavioural lesson | Social mechanism | Primary evidence | Decision home | Verification pattern | Unsafe temptation |
| --- | --- | --- | --- | --- | --- | --- |
| **E11** *(legitimate)* | Handle expected status notifications by opening the portal you already use | Authority + anticipation | The learner's own request; a portal confirmation a week earlier; no link or attachment | **Opening the request in the known portal app** | The leave record and the HR helpdesk | A web search for the portal then signing in; deleting a real update |
| **E12** | Unexpected shares that ask you to sign in elsewhere, and push prompts, are the tell | Curiosity + collaboration | External sender; off-domain sign-in host; no such share in the portal | **A cloned sign-in, then a push-approval prompt** | The approved files portal and a call to the sharer | Sign in; approve the push; request access |
| **E13** | A password in the same mail as the archive is there to beat the scanner | Curiosity + routine | Encrypted archive; password in the body; a `.pdf.exe` inside | **An inert archive viewer (extract vs run)** | The records system and the records desk | Extract the files; run the executable |
| **E14** | Plausible military themes can be tailored from public detail; verify orders in-system | Authority + urgency | One-letter domain; wrong distribution route; a QR that decodes off-domain | **A QR inspector and a decrypt portal** | The orders system and a call to movement staff | Scan the QR; enter service credentials |
| **E15** | A consent screen grants access with no password; read the permissions and publisher | Convenience + authority | Unverified publisher; broad mailbox scopes; no approved change notice | **An OAuth consent screen (Grant vs Deny)** | The app catalogue and IT via the directory | Approve the app; grant the scopes |

**New Email-native mechanics this batch adds:** none that needed a new renderer. E11 is the first Email
scene whose message carries neither a link nor an attachment and whose safe branch is *opening a known
app*; E12 is the first to chain a cloned sign-in into a **push-approval** step; E13 is the first
**archive viewer with a double-extension executable**; E14 is the first **QR inspector** in Email; E15 is
the first **OAuth consent screen** in Email. Every one is a new *use* of the existing `MAIL`, `BROWSER`,
`VIEWER`, `APP` and `CALL` surfaces, so no shared component changed.

**Differentiation, asserted.** `sceneModel.test.js` asserts that the fifteen Email scenes E01–E15 each
have a distinct branch-stage shape, that E12 alone offers both a credential submit and a push approval on
one cloned surface, that E14 alone decides on a scanned QR, that E15 alone decides on an OAuth consent
screen with no typed field, and that the fifteen decide across at least ten distinct homes. The one
recorded overlap is that E09 and E10 both release on a browser surface; their branch shapes and stories
differ. `sceneAffordance.test.js` pins every control's event code and point value and that each safe path
sums to ten.

---

## 1. E11 — Leave Approval in Known Portal

### Client scenario (authoritative)

Specification page 73. Email, **Medium**, **Legitimate**, family *Legitimate workflow notification*,
trigger *Authority + anticipation*. Canonical identity computed by the import service: family
`legit_system_confirmation`, triggers `authority` + `routine`, military flag **false**, level `medium`,
legitimate control **true**.

- **Stage 1 (Event).** "People Portal: Request LV-204 status updated. View it from your portal
  dashboard."
- **Stage 2 (Open).** The learner recently submitted a leave request; an authenticated notification says
  the decision is available in the approved portal.
- **Stage 3 (Inspect).** Examine the request ID, the authenticated sender, the absence of an embedded
  login link, and a matching timeline. Decision signal: *the notification refers to an action the learner
  initiated and directs them to the known portal rather than collecting data.*
- **Stage 4 (Branch).** The dashboard's approved-portal launcher and the read-only leave status. Expected:
  *use the normal in-app path only after the details match; do not switch to an untrusted channel.*
- **Stage 5 (Verify).** Open the known HR portal from the dashboard and match request LV-204.
- **Stage 6 (Resolve).** View the result in the portal; archive the email; do not report.
- **End state / feedback.** Leave status matches and the email is archived normally; a legitimate status
  mail is specific, expected and verifiable in a portal you open independently.

### MITRE ATT&CK alignment

**There is none, and none has been invented.** ATT&CK catalogues adversary behaviour. In E11 there is no
adversary: an automatic workflow notifies the learner that a decision on *their own* leave request is
available, from the same authenticated address that acknowledged the request a week earlier, and carries
no link and no attachment. The only risks are the learner's own — searching the web for the portal and
signing in through whatever appears, or deleting a genuine status update — and ATT&CK does not model a
person's over-caution.

**Closest defensible behavioural reference** — deliberately not an ATT&CK technique:

- US NIST, "Phish Scale User Guide", on why not every message is a phish and the cost of false positives
  (<https://www.nist.gov/publications/phish-scale-user-guide>).
- UK NCSC phishing guidance on proportionate response (<https://www.ncsc.gov.uk/guidance/phishing>).

The defensive frame is a proportionate check — does the request number, the sender and the timeline match
something I did? — followed by using the portal I already have, and not treating a legitimate workflow as
hostile.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The inbox row preview and the message body |
| "Request ID, authenticated sender, no embedded login link, matching timeline" | The details sheet (headers, SPF/DKIM pass, "Links: none"), and the "No links or attachments" notice |
| "Approved-portal launcher and read-only leave status" | The People Portal app, opened from the branch, showing LV-204 approved |
| "Do not switch to an untrusted channel" | The "search the web for the portal and sign in" branch (`open_link` → `UNSAFE_EXTERNAL_ACTION`, −4) |
| "Open the known HR portal and match LV-204" | `verify_known_app` → the leave record; `verify_known_number` → the HR helpdesk |
| "View the result; archive; do not report" | Archive (`resolve_continue`) or keep (`resolve_retain`); reporting is `CONTRADICTORY_UNSAFE_FINAL` |

### Enhanced synthetic storyline

Last week the learner asked for three days' leave; the People Portal's automatic confirmation is already
in the thread and says decisions appear in the portal only. Today the same address says LV-204's status
has changed — and, pointedly, includes no decision and no link, directing the reader to the portal they
already use.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast |
| Open | The inbox; the People Portal row tagged HR |
| Inspect | The message, the "no links" notice, the earlier confirmation, and the details |
| Branch | The People Portal app with LV-204 approved |
| Verify | The leave record, or the HR helpdesk call |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. The message has no link and no attachment, and says so.
2. The details sheet: same sender as the 12 Sep confirmation; SPF/DKIM pass; the request is the learner's.
3. The earlier confirmation of the learner's own request.
4. The People Portal: LV-204 approved, decided today.
5. The leave record and the HR helpdesk: the same decision, reached independently.

### Learner interaction journey

Notify → open the update → the "no links" notice, the earlier confirmation and the details → open LV-204
in the People Portal → match it in the leave record or call HR → archive it.

### Simulation surfaces

- `details` (`MAIL`): sender, headers, authentication and "links: none".
- `portal` (`APP`): the People Portal with the approved request.
- `search` (`BROWSER`): what a web search leads to — not the app the learner has.
- `leave` (`APP`): the leave history that matches.
- `call` (`CALL`): the HR helpdesk.

### Verification mechanism

`verify_known_app` opens the leave record; `verify_known_number` calls the HR helpdesk;
`verify_trusted_directory` lists the desk. Replying to the no-monitor address is `0`; **reporting or
blocking a legitimate workflow is a false positive, −4.**

### Safe resolution

`resolve_continue` (archive) or `resolve_retain` (keep), `+2`. Full safe path: `open_item → read →
inspect_sender → safe_pivot (open the portal) → verify_known_app → resolve_continue` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Search the web for the portal and sign in | `open_link` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Delete the real update | `reject_ignore` | `NEEDLESS_REJECT_IGNORE` | −2 |
| Report or block the portal | `report` / `block` | `FALSE_REPORT_BLOCK` | −4 |
| Report it at the end | `resolve_report` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `CORRECT_USE +3`, `NEEDLESS_REJECT_IGNORE −2`, `UNSAFE_EXTERNAL_ACTION −4`; opening the
portal resolves to `CORRECT_USE`, the web-search sign-in to the `−4` code.

### Why the final simulation stays faithful

Every client element is present: the learner's own request, the authenticated linkless notification, the
matching timeline, the known-portal launcher with read-only status, the independent portal check, and the
archive-not-report rule. As the batch's legitimate control it is deliberately not thinner than its
malicious neighbours: two apps, a details sheet, a quoted confirmation and its own leave-record check.

---

## 2. E12 — Shared Document Sign-In

### Client scenario (authoritative)

Specification page 74. Email, **Medium**, **Malicious**, family *Cloud-document credential phishing*,
trigger *Curiosity + collaboration | FICTIONAL MILITARY CONTEXT*. Canonical identity: family
`credential_phishing`, triggers `curiosity` + `routine`, military flag **true**, level `medium`.

- **Stage 1 (Event).** "Docs Share: 'Updated Deployment Photos' was shared with you."
- **Stage 2 (Open).** An external collaborator shares a document with a generic title and prompts a fresh
  sign-in.
- **Stage 3 (Inspect).** Examine the sender identity, the unexpected title, the external banner, the
  target domain and the access scope. Decision signal: *the share is unexpected and the sign-in target is
  not the approved collaboration domain.*
- **Stage 4 (Branch).** A cloned cloud-login page followed by an MFA approval prompt. Expected: *do not
  enter credentials or approve the sign-in.*
- **Stage 5 (Verify).** Contact the supposed sender by a known channel and open the approved collaboration
  portal directly.
- **Stage 6 (Resolve).** Close; report the message; do not request access through the fake page.
- **End state / feedback.** The sender denies the share and credentials remain protected; document-sharing
  lures exploit collaboration habits — verify the share and sign in only from the known service.

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1566.002** Phishing: Spearphishing Link | <https://attack.mitre.org/techniques/T1566/002/> | Strong. A link to a cloned sign-in that captures the work account; the page also covers "a malicious OAuth 2.0 request URL". |
| **T1621** Multi-Factor Authentication Request Generation | <https://attack.mitre.org/techniques/T1621/> | **Partial fit, stated.** The push-approval step models a user accepting an authentication prompt; the technique's core is an adversary *generating* the request with valid credentials, whereas here the approval is tied to the phishing sign-in. |
| **T1684.001** Social Engineering: Impersonation | <https://attack.mitre.org/techniques/T1684/001/> | **Partial fit, stated.** The "Docs Share" service and the collaboration brand are impersonated to make the share credible. |

**Why this maps.** A spearphishing link (T1566.002) leads to a cloned sign-in that harvests credentials,
and the follow-on push-approval prompt is an authentication-request approval (T1621); the impersonated
sharing service (T1684.001) supplies the credibility. The curiosity of "deployment photos" is the social
engine, which ATT&CK does not model.

**Considered and rejected.** **T1111 Multi-Factor Authentication Interception**
(<https://attack.mitre.org/techniques/T1111/>) is the technical interception of an MFA token (for example
via a SIM swap or a proxy), not a user being tricked into approving a prompt. It is named only to say why
it does not apply: nothing is intercepted here; the learner is asked to approve.

**What must NOT be copied.** No real collaboration brand, sharing service, sign-in page, unit, deployment
or personnel imagery; no real address or token. "Docs Share", "MailSafe"-style branding, the file and the
collaborator are invented `*.training.example` content, and no photo, token or grant exists anywhere.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim intent | The inbox row and the HTML share body |
| "Sender identity, unexpected title, external banner, target domain, access scope" | The External tag, the details sheet (off-domain host, external), and the permission scopes on approval |
| "Cloned cloud-login page followed by an MFA approval prompt" | The `signin` browser: a login form, then a push-approval page |
| "Do not enter credentials or approve the sign-in" | Close the page (`safe_pivot`); signing in and approving are both `−8` |
| "Contact the sender by known channel; open the approved portal" | `verify_known_number` → the call; `verify_known_app` → the files portal |
| "Close; report; do not request access" | Report and close (`resolve_report`) |

### Enhanced synthetic storyline

An outside address the learner has never heard from "shares" a file titled *Updated Deployment Photos* and
insists on a fresh sign-in. The approved collaboration portal shows no such share; the sign-in host is a
look-alike, and after the password step a push prompt asks the learner to "approve" whoever started the
sign-in.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast |
| Open | The inbox; the external share row |
| Inspect | The HTML share, the External tag, and the details |
| Branch | The cloned sign-in, then the push-approval page |
| Verify | The files portal, or the call |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. The External tag and the first-contact sender.
2. The details sheet: the off-domain sign-in host versus the approved portal.
3. The consent/sign-in page's insecure host and its request to approve access.
4. The files portal: no such share exists.
5. The call: the sharer denies it.

### Learner interaction journey

Notify → open the share → the External tag and the details → close the sign-in without entering anything →
open the files portal or call the sharer → report and close.

### Simulation surfaces

- `details` (`MAIL`): sender, external status, sign-in host.
- `signin` (`BROWSER`): the cloned login and the push-approval page.
- `portal` (`APP`): the approved files portal.
- `call` (`CALL`): the collaboration desk.

### Verification mechanism

`verify_known_app` opens the files portal; `verify_known_number` calls the desk;
`verify_trusted_directory` lists it. Replying to the sender to confirm is `0`; reporting without checking
is `+1`.

### Safe resolution

`resolve_report`, `+2`. Full safe path: `open_item → read → inspect_sender → safe_pivot (close/delete) →
verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Sign in on the cloned page | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Approve the push | `approve_device_link` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Open the share link | `open_link` | `RISKY_OPEN_REPLY` | −3 |
| Request access at the end | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`; both the
sign-in and the push approval resolve to the `−8` code.

### Why the final simulation stays faithful

Every client element is present: the unexpected external share, the generic title, the cloned sign-in, the
follow-on push approval, the portal and sender checks, and the report. The two-step release (password
*or* push) is exactly the "collaboration habit" the client names.

---

## 3. E13 — Password-Protected ZIP

### Client scenario (authoritative)

Specification page 75. Email, **Medium**, **Malicious**, family *Archive-delivered malware*, trigger
*Curiosity + routine*. Canonical identity: family `malware_delivery`, triggers `curiosity` + `routine`,
military flag **false**, level `medium`.

- **Stage 1 (Event).** "Case Documents: Confidential scan attached. Password: 2468."
- **Stage 2 (Open).** An external sender provides a password-protected archive and places the password in
  the message to bypass inspection.
- **Stage 3 (Inspect).** Examine the sender identity, the unexpected case, the archive type and the
  separate password. Decision signal: *an unsolicited encrypted archive prevents normal inspection and the
  case context is not expected.*
- **Stage 4 (Branch).** An inert archive viewer with a simulated executable inside. Expected: *do not
  extract/run the file or disable protection.*
- **Stage 5 (Verify).** Verify the sender/case through the approved records system and a known contact.
- **Stage 6 (Resolve).** Do not extract; report the message; quarantine the archive.
- **End state / feedback.** The archive stays unopened and the email is quarantined; password-protected
  archives can conceal unsafe files — verify the business need before any extraction.

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1566.001** Phishing: Spearphishing Attachment | <https://attack.mitre.org/techniques/T1566/001/> | Strong. A password-protected archive attachment; the page explicitly covers "instructions on how to decrypt an attachment, such as a zip file password, in order to evade email boundary defenses." |
| **T1204.002** User Execution: Malicious File | <https://attack.mitre.org/techniques/T1204/002/> | Strong. The payload runs only when the learner extracts the archive and opens the file inside it. |
| **T1027.013** Obfuscation: Encrypted/Encoded File | <https://attack.mitre.org/techniques/T1027/013/> | **Partial fit, stated.** The password-protected archive is the encryption/encoding that hides the payload from scanning; the technique is the obfuscation itself rather than the delivery or the double extension. |

**Why this maps.** A spearphishing attachment (T1566.001) carries an encrypted archive (T1027.013) whose
password is placed in the mail to beat the gateway, and the payload executes only on user action
(T1204.002) — the document-shaped executable inside. The curiosity of a "confidential case scan" is the
social engine.

**Considered and rejected.** **T1140 Deobfuscate/Decode Files or Information**
(<https://attack.mitre.org/techniques/T1140/>) is an adversary's own code decoding a payload at runtime,
not a human typing an archive password. It is named only to say why it does not apply.

**What must NOT be copied.** No real case, records system, archive, executable or malware; no real
address. "Case Documents", the case and the files are invented `*.training.example` content; the archive
is a drawn list and the executable is a label — nothing is extracted, mounted or run.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The inbox row and the message body |
| "Sender identity, unexpected case, archive type, separate password" | The External tag, the details sheet (encrypted archive, "password in body"), and the body |
| "Inert archive viewer with a simulated executable inside" | The `preview` archive view with `Case_Scan.pdf.exe` and a decoy listed |
| "Do not extract/run the file or disable protection" | Close without extracting (`safe_pivot`); extract is `−3`, run is `−8` |
| "Approved records system and known contact" | `verify_known_app` → the records system; `verify_known_number` → the records desk |
| "Do not extract; report; quarantine" | Report and quarantine (`resolve_report`) |

### Enhanced synthetic storyline

An unknown "Case Documents" sender attaches an encrypted archive and puts the password — 2468 — in the
same message. Unlocking it reveals `Case_Scan.pdf.exe` beside a decoy read-me, a program wearing a
document's name.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast |
| Open | The inbox; the external "Case Documents" row |
| Inspect | The message, the details, and the archive listing |
| Branch | The archive viewer: extract, or open the executable |
| Verify | The records system, or the records desk call |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. The External tag and the password sitting in the message body.
2. The details sheet: an encrypted archive a scanner cannot inspect; no case assigned.
3. The archive listing: a `.pdf.exe` inside.
4. The records system: no case from this sender.
5. The call: the desk did not send it and never emails a password with a file.

### Learner interaction journey

Notify → open the case email → the details and the archive listing → close without extracting → check the
records system or call the desk → report and quarantine.

### Simulation surfaces

- `details` (`MAIL`): sender, the encrypted archive and the in-message password.
- `preview` (`MAIL`): the inert archive viewer with the double-extension executable.
- `records` (`APP`): the approved case store.
- `call` (`CALL`): the records desk.

### Verification mechanism

`verify_known_app` opens the records system; `verify_known_number` calls the desk;
`verify_trusted_directory` lists it. Replying to the sender is `0`; reporting without checking is `+1`.

### Safe resolution

`resolve_report`, `+2`. Full safe path: `open_item → read → inspect_sender → safe_pivot (close/delete) →
verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Open the executable inside | `attempt_install` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Extract the files | `open_file` | `RISKY_OPEN_REPLY` | −3 |
| Extract it at the end | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`;
extracting resolves to the `−3` code and running the executable to the `−8`.

### Why the final simulation stays faithful

Every client element is present: the encrypted archive, the in-message password, the inert viewer with a
simulated executable, the records-system and desk checks, and the quarantine. The split between extracting
(`−3`) and running (`−8`) is the "verify the business need before any extraction" lesson made concrete.

---

## 4. E14 — Revised Movement Order

### Client scenario (authoritative)

Specification page 76. Email, **Medium**, **Malicious**, family *Military spearphishing / attachment*,
trigger *Authority + urgency | FICTIONAL MILITARY CONTEXT*. Canonical identity: family
`qr_code_phishing`, triggers `authority` + `urgency`, military flag **true**, level `medium`.

- **Stage 1 (Event).** "HQ Alpha Movements: Urgent revision MOV-77 — open attached order now."
- **Stage 2 (Open).** A look-alike HQ address sends a revised movement order shortly before a fictional
  exercise.
- **Stage 3 (Inspect).** Examine the subtle domain change, the reply-to, the classification mismatch and
  the unexpected revision process. Decision signal: *premise alignment raises difficulty, but the sender
  and distribution route do not match the approved system.*
- **Stage 4 (Branch).** A PDF preview containing a QR to "decrypt" the order. Expected: *do not scan the
  QR, enter service credentials or disclose schedule details.*
- **Stage 5 (Verify).** Check MOV-77 in the approved orders system and call movement staff through the
  directory.
- **Stage 6 (Resolve).** Do not use the QR; report the message; preserve the email for unit security. Add
  a one-line reason without sensitive data.
- **End state / feedback.** The approved system shows no revision and the attachment remains inert;
  time-relevant military themes can be tailored from public information — verify orders only in approved
  channels.

### MITRE ATT&CK alignment

QR-code phishing ("quishing") has **no dedicated technique** in ATT&CK v19.2: the spearphishing and
user-execution techniques below do not name QR codes, and neither does the phishing-for-information
family. The behaviour is therefore mapped to its nearest documented parts, each a partial fit, and that
gap is stated rather than papered over.

| Technique | Page | Fit |
| --- | --- | --- |
| **T1566.001** Phishing: Spearphishing Attachment | <https://attack.mitre.org/techniques/T1566/001/> | Strong for delivery. The lure is a PDF attachment; the QR is the payload it carries. |
| **T1204.001** User Execution: Malicious Link | <https://attack.mitre.org/techniques/T1204/001/> | **Partial fit, stated.** Scanning the QR is a user following a link to a credential page; the technique does not name QR as the medium. |
| **T1684.001** Social Engineering: Impersonation | <https://attack.mitre.org/techniques/T1684/001/> | **Partial fit, stated.** A look-alike HQ movements address is impersonated to make the revision credible. |

**Why this maps.** A spearphishing attachment (T1566.001) delivers a QR that, when followed, is a
malicious link a user executes (T1204.001), from an impersonated authority (T1684.001). The urgency of an
"exercise revision" is the social engine.

**Considered and rejected.** **T1566.002 Spearphishing Link**
(<https://attack.mitre.org/techniques/T1566/002/>) is the closest single technique, but its behaviour is a
link *in the message body*; here the link is encoded in a QR printed on an attachment, which is why
delivery is mapped to the attachment technique and the follow-on to user execution of a link. It is named
to draw exactly that line.

**What must NOT be copied.** No real unit, headquarters, order, movement, exercise, location, schedule,
classification marking or procedure; no real address. "HQ Alpha", "MOV-77" and the exercise are invented
`*.training.example` content; the QR decodes locally to a training host and nothing is scanned or opened.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The inbox row and the message body |
| "Subtle domain change, reply-to, classification mismatch, unexpected revision process" | The details sheet (off-domain, "orders never arrive by email QR", marking mismatch) |
| "PDF preview containing a QR to 'decrypt' the order" | The `preview` PDF and the `qr` inspector that decodes it off-domain |
| "Do not scan the QR, enter service credentials or disclose schedule details" | Leave and verify (`safe_pivot`); scanning is `−3`, entering credentials is `−8` |
| "Check MOV-77 in the orders system; call movement staff" | `verify_known_app` → the orders system; `verify_known_number` → the call |
| "Do not use the QR; report; preserve the email" plus a one-line reason | Report and keep (`resolve_report`); the resolve-stage rationale box (≤250 chars) |

### Enhanced synthetic storyline

Shortly before an exercise, a one-letter-off "HQ Alpha Movements" address sends a "revised" MOV-77 as an
encrypted PDF and says to scan the QR to decrypt the timings. The QR decodes to a training host asking for
a service number and password; the orders system shows no revision.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast |
| Open | The inbox; the priority "HQ Alpha Movements" row |
| Inspect | The message, the details, and the order PDF |
| Branch | The QR inspector and the decrypt portal |
| Verify | The orders system, or the movement-staff call |
| Resolve | The outcome card, the rationale box and the review |

### Evidence the learner can discover (progressive)

1. The Priority tag and the one-letter domain difference.
2. The details sheet: off-domain sender, wrong distribution route, marking mismatch.
3. The PDF: an order that hides its timings behind a QR.
4. The QR inspector: the decoded target is off-system and asks for credentials.
5. The orders system and the call: no revision to MOV-77.

### Learner interaction journey

Notify → open the order → the details and the PDF → inspect the QR, see the off-domain target → leave it
and verify → check the orders system or call movement staff → report, preserve, and add a one-line reason.

### Simulation surfaces

- `details` (`MAIL`): the domain, reply-to and marking.
- `preview` (`MAIL`): the order PDF describing its QR.
- `qr` (`VIEWER`): the honest QR inspector, decoded target in words.
- `decrypt` (`BROWSER`): the credential-harvesting portal.
- `orders` (`APP`): the approved orders system.
- `call` (`CALL`): movement staff.

### Verification mechanism

`verify_known_app` opens the orders system; `verify_known_number` calls movement staff;
`verify_trusted_directory` lists the desk. Replying to the sender is `0`; reporting without checking is
`+1`.

### Safe resolution

`resolve_report`, `+2`. Full safe path: `open_item → read → inspect_sender → safe_pivot (leave) →
verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Enter service credentials on the decrypt portal | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Scan the QR and follow it | `scan_qr` | `RISKY_OPEN_REPLY` | −3 |
| Use the QR at the end | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`; scanning
the QR resolves to the `−3` code and entering credentials to the `−8`.

### Why the final simulation stays faithful

Every client element is present: the look-alike HQ, the plausible exercise premise, the PDF with a QR,
the honest QR inspector, the credential portal it points at, the orders-system and call checks, the report
and the one-line reason. The premise is deliberately convincing, which is the client's "premise alignment
raises difficulty" made real.

---

## 5. E15 — OAuth Consent for Mail Review

### Client scenario (authoritative)

Specification page 77. Email, **Medium**, **Malicious**, family *Consent phishing / cloud-app access*,
trigger *Convenience + authority*. Canonical identity: family `account_takeover_authorisation_abuse`,
triggers `convenience` + `authority`, military flag **false**, level `medium`.

- **Stage 1 (Event).** "Security Upgrade: Approve MailSafe Analyzer to complete mandatory protection."
- **Stage 2 (Open).** A message asks the learner to authorize an app that will supposedly scan the inbox
  for threats.
- **Stage 3 (Inspect).** Examine the publisher status, the broad permissions, the sender and the absence
  of an approved change notice. Decision signal: *the app requests read/send mailbox access and is not an
  approved publisher.*
- **Stage 4 (Branch).** A synthetic OAuth consent screen listing Mail.Read, Mail.Send and Contacts.
  Expected: *do not grant consent or approve broad access.*
- **Stage 5 (Verify).** Check the approved application catalogue and contact IT through the known
  directory.
- **Stage 6 (Resolve).** Deny consent; report the message; review/remove unapproved app grants.
- **End state / feedback.** Consent is denied and no mailbox permission is created; a consent screen can
  grant access without asking for a password — read permissions and verify the app publisher.

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1528** Steal Application Access Token | <https://attack.mitre.org/techniques/T1528/> | Strong. The page describes a malicious app "granted access to resources with the target user's OAuth token" after "a Spearphishing Link to the target user to entice them to grant access." |
| **T1566.002** Phishing: Spearphishing Link | <https://attack.mitre.org/techniques/T1566/002/> | Strong for delivery. The consent screen is reached by a malicious link; the page names "a malicious OAuth 2.0 request URL". |
| **T1671** Cloud Application Integration | <https://attack.mitre.org/techniques/T1671/> | **Partial fit, stated.** The granted app would persist as a connected integration; the technique's centre of gravity is SaaS persistence and adding integrations, of which the consent grant is the entry point. |

**Why this maps.** A spearphishing link (T1566.002) leads to an OAuth consent screen that, if granted,
steals an application access token (T1528) and would persist as a cloud application integration (T1671).
The lesson the scene teaches — consent grants access with no password — is precisely why T1528 sits apart
from the credential-phishing techniques.

**Considered and rejected.** **T1550.001 Application Access Token**
(<https://attack.mitre.org/techniques/T1550/001/>) is the *use* of an already-stolen token for access and
lateral movement, downstream of the grant this scene stops; it is named to mark that boundary.
**T1621 Multi-Factor Authentication Request Generation**
(<https://attack.mitre.org/techniques/T1621/>) does not apply: the whole point is that a consent grant
needs neither a password nor an MFA prompt.

**What must NOT be copied.** No real security product, publisher, consent screen, OAuth provider or
mailbox; no real address or token. "MailSafe Analyzer" and "Security Upgrade" are invented
`*.training.example` content; the consent screen is a drawn panel and nothing is authorised, tokenised or
connected.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The inbox row and the HTML body |
| "Publisher status, broad permissions, sender, absence of approved change notice" | The details sheet (publisher unverified, scopes, "no approved change") |
| "OAuth consent screen listing Mail.Read, Mail.Send and Contacts" | The `consent` browser page's permission summary |
| "Do not grant consent or approve broad access" | Deny/close (`safe_pivot`); opening is `−3`, granting is `−8` |
| "Approved application catalogue; contact IT through the known directory" | `verify_known_app` → the catalogue; `verify_trusted_directory`/`verify_known_number` → IT |
| "Deny; report; review/remove unapproved grants" | Deny and report (`resolve_report`); the catalogue shows connected apps as none |

### Enhanced synthetic storyline

A "Security Upgrade" message says a mandatory step needs the learner to authorise "MailSafe Analyzer" to
scan the inbox — no password required. The button leads to an OAuth consent screen requesting to read all
mail, send as the user, and read contacts, from an unverified publisher that no IT change announced.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast |
| Open | The inbox; the "Security Upgrade" row |
| Inspect | The HTML body, the details, and the permission list |
| Branch | The OAuth consent screen; Grant or Deny |
| Verify | The app catalogue, or IT |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. The External tag and the "no password needed" framing.
2. The details sheet: unverified publisher, broad scopes, no approved change.
3. The consent screen: Mail.Read, Mail.Send and Contacts, no field to type.
4. The app catalogue: not an approved app; no connected apps on the account.
5. IT: there is no such upgrade and MailSafe Analyzer is not theirs.

### Learner interaction journey

Notify → open the upgrade → the details and the permission list → deny the consent → check the catalogue
or call IT → deny and report.

### Simulation surfaces

- `details` (`MAIL`): publisher, permissions, change notice.
- `consent` (`BROWSER`): the OAuth consent screen — no form fields.
- `catalogue` (`APP`): the approved application catalogue and connected apps.
- `call` (`CALL`): the IT service desk.

### Verification mechanism

`verify_known_app` opens the app catalogue; `verify_known_number` calls IT; `verify_trusted_directory`
lists the desk. Replying to the sender is `0`; reporting without checking is `+1`.

### Safe resolution

`resolve_report`, `+2`. Full safe path: `open_item → read → inspect_sender → safe_pivot (deny/delete) →
verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Grant the app access | `approve_device_link` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Open the consent screen from the email | `open_link` | `RISKY_OPEN_REPLY` | −3 |
| Approve it at the end | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`;
granting the consent resolves to the `−8` code. No field is typed — the release is a consent, not a
credential — which is the client's whole point.

### Why the final simulation stays faithful

Every client element is present: the "mandatory" framing, the unverified publisher, the OAuth consent
screen listing the three scopes, the no-password release, the catalogue and IT checks, and the deny-and-
report. That granting needs no field typed is what distinguishes this from every login scene in the
batch.

---

## 6. Forms, inputs and data handling

Two screens in this batch accept typing: E12's cloned sign-in (work email, password) and E14's decrypt
portal (service number, password). E11's portal launch, E12's push approval, E13's extract/run, E14's QR
scan and E15's consent grant are decisions, not fields — E15 in particular releases access with **no field
typed at all**. Every field obeys the rules `SceneForms.test.jsx` and `SceneContainment.test.jsx` already
enforce on every earlier batch:

- **Local.** Every value lives in `useLocalForm` state inside the component that draws it. It is never
  lifted, never passed to an affordance, never put in an intent or in metadata.
- **Ephemeral.** Leaving the screen unmounts the component and the state is gone; walking to the next
  browser page discards the previous page's values by remount.
- **Never transmitted.** No `fetch`, no `<form>`, no action, no submit event. The commit control is an
  ordinary button carrying a scene affordance — an intent and an optional asset id, nothing else.
- **Never persisted.** No `localStorage`, `sessionStorage`, IndexedDB, cookie or cache holds a typed
  value; a reload rebuilds the run from the committed stage with the fields empty.
- **Never logged.** No console output, no analytics, no event payload. The engine's `METADATA_ALLOWLIST`
  rejects any metadata key it does not know.
- **No autofill surface.** Every input is `type="text"` with `autoComplete="off"` and a meaningless
  `name`; passwords are masked by CSS, never `type="password"`.
- **No form submission.** A page's `primary` control validates length and walks to the next page; it
  scores nothing.
- **Deterministic.** A field is satisfied by its character count. Same input, same result.
- **Not decorative.** The fields are real inputs, because declining to type is the decision.

No field accepts a real credential, card, wallet key, identity number, service number, account number or
document; the archive in E13 and the QR in E14 are never a real file, are never extracted, decoded
remotely or run, and no app is ever granted access in E15.

## 7. What is asserted, and where

| Claim | Test |
| --- | --- |
| Every E11–E15 control resolves to a legal transition on its own pinned definition | `backend/tests/sceneAffordance.test.js` |
| Each safe path scores exactly ten, in six stages, and produces the positive review card | `backend/tests/sceneAffordance.test.js` |
| Each named control keeps its event code and point value | `backend/tests/sceneAffordance.test.js` |
| E12, E13, E14 and E15 never offer `reject_ignore` (E11, legitimate, may) | `backend/tests/sceneAffordance.test.js` |
| The review leaks no scoring code or point value | `backend/tests/sceneAffordance.test.js` |
| The fifteen Email scenes each have a distinct branch shape; E12 alone chains submit + approve; E14 alone scans a QR; E15 alone decides on a consent screen with no field | `frontend/src/simulation/sceneModel.test.js` |
| No disposition, family, trigger, end state, feedback, narrator line or verdict word reaches the device | `frontend/src/simulation/sceneModel.test.js`, `SceneScenariosEmailC.test.jsx` |
| Every military host is `*.training.example`; every number is in the reserved range | `frontend/src/simulation/sceneModel.test.js` |
| No `href`, `src`, `iframe`, `form`, media element or host handler on any screen | `SceneContainment.test.jsx`, `SceneScenariosEmailC.test.jsx` |
| Typed values never leave the component | `SceneScenariosEmailC.test.jsx` |
| The five scenarios play end to end through the real controller and attempt API | `frontend/src/pages/SceneScenariosEmailC.test.jsx` |
| This document covers every authored scenario and cites every technique it names | `frontend/src/simulation/sceneResearch.test.js` |

## 8. Findings during verification

Recorded as they were found, with what was done about each.

1. **Two branch intents that resolve to the same −8 code.** E12 offers both a credential submit
   (`submit_data`) and a push approval (`approve_device_link`); E13 offers extract (`open_file`) and run
   (`attempt_install`). Each pair is two *alternatives* at the branch stage, not a sequence — the engine
   still takes exactly one branch decision — and the shared decision home is reached by a local, unscored
   navigation control so a learner can inspect before choosing. Confirmed by walking each route through the
   real engine (safe = 10; releases = −8; risky = −3).
2. **Consent as a release with no field.** E15 grants access via `approve_device_link` and types nothing;
   `sceneModel.test.js` asserts the consent page has zero form fields, so the "no password needed" lesson
   cannot regress into a login form.
3. **Quishing and MFA push have no dedicated ATT&CK technique.** Stated in §0.3 and in the E14/E12
   sections, and mapped to the nearest documented behaviour with the gap named, rather than forced.
4. **Recorded, not changed (pre-existing):** closing a pushed screen returns keyboard focus to the page
   body; the result and review cards show the bank's stored sender. Both are shared behaviour from earlier
   batches. Browser-play totals are in `PROJECT_MASTER_PLAN.md`.
