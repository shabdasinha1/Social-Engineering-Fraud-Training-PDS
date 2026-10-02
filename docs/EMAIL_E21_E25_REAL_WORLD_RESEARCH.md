# Email E21–E25 — real-world research and storyline reconstruction

**Task:** IMMERSIVE-009 — the fifth and final Email batch
**Naming:** the client's bank numbers every Email scenario `E01`–`E25` (specification pages 62–87);
this batch is **E21–E25** in the data, the registry, the tests and this document, and it corresponds
to specification **pages 83–87**.
**Scope:** Email E21, E22, E23, E24, E25 only. WhatsApp W01–W25, Instagram I01–I25 and Email E01–E20
are complete and unchanged in behaviour; all of SMS is untouched by this task.
**Status:** design record for the five Email scenes authored by this task. **IMMERSIVE-009 COMPLETE (20 September 2026)** — implemented, tested and browser-validated; the validation totals are in `PROJECT_MASTER_PLAN.md` §16.31.
**Companions:** [`EMAIL_E01_E05_REAL_WORLD_RESEARCH.md`](EMAIL_E01_E05_REAL_WORLD_RESEARCH.md),
[`EMAIL_E06_E10_REAL_WORLD_RESEARCH.md`](EMAIL_E06_E10_REAL_WORLD_RESEARCH.md),
[`EMAIL_E11_E15_REAL_WORLD_RESEARCH.md`](EMAIL_E11_E15_REAL_WORLD_RESEARCH.md),
[`EMAIL_E16_E20_REAL_WORLD_RESEARCH.md`](EMAIL_E16_E20_REAL_WORLD_RESEARCH.md) and the WhatsApp and
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

What is taken from the real world is the shape of a mail client and of what arrives in one: a vendor
bank-detail change that is genuine and has been through its own controls; a recorded instruction from a
senior officer attached to a message; a "data protection" alert whose attachment is a web page that runs
from the device; an annual policy circular whose acknowledgement is a code printed inside the attached
document; and a payroll correction for somebody else's salary account, sent under a reused subject line.
What is deliberately **not** taken is infrastructure, tooling, real brands, real products, real accounts,
real people, real units, real formations, real locations, real schedules, real procedures, real banks,
real payment rails or any real capability. "Northstar Supplies", the "Vendor Portal", the "Welfare Fund",
"Data Protection Monitor", "DP Secure Viewer", the "Policy Centre", the "Compliance Office", "Maj. A.
Iyer", "Nk R. Bose" and every other actor are fictional and describe nothing real. Every host is
`*.training.example`; every phone number is in the reserved `+91 00000 xxxxx` range; every inbox, header,
document, code inspector, portal, application, payment sheet, audio card and call is local, inert and
offline. No image file and no audio file exists anywhere. Nothing is fetched, played, dialled, installed,
downloaded, uploaded, paid, approved or sent.

### 0.2 Source of the threat intelligence

Primary source: **MITRE ATT&CK, Enterprise matrix, website version v19.2** (released 28 April 2026),
re-confirmed as the current version on the live versions page on 20 September 2026
(<https://attack.mitre.org/versions/>, which resolves to `/resources/versions/`; v18.1 ran 28 October 2025 – 27 April 2026, v17.1
before it). Technique pages read live for this batch on 20 September 2026: T1684.001, T1657, T1585.002,
T1566.001, T1566.002, T1566.004, T1027.006, T1036, T1204.002, T1219, T1534, T1586.002 and T1056.003.

Version note carried forward: `T1656 Impersonation` no longer exists as a top-level technique; the
current page is **T1684.001** (Social Engineering: Impersonation, parent T1684). **T1219** is named
*Remote Access Tools*. Read live for this batch and worth recording because two of these scenes turn on
it: **T1566.002 Spearphishing Link does not mention QR codes at all**, and there is no QR or "quishing"
technique anywhere in v19.2 — see §1 under E24.

Secondary sources, for the real-world pattern behind each scenario (all read 20 September 2026):

- **E21** — the legitimate control; UK NCSC guidance on verifying payment-detail changes through an
  independent, already-held contact (<https://www.ncsc.gov.uk/guidance/phishing>); US NIST "Phish Scale"
  material on the cost of false alarms (<https://www.nist.gov/publications/phish-scale-user-guide>).
- **E22** — US FBI IC3 public service announcements on business email compromise and on the use of
  recorded and synthesised audio in fraudulent payment instructions (<https://www.ic3.gov/>); UK NCSC
  guidance on verifying instructions out of band (<https://www.ncsc.gov.uk/guidance/phishing>).
- **E23** — US CISA and UK NCSC advisories on HTML attachments that render a credential page locally and
  on fake security-tool notifications (<https://www.cisa.gov/news-events/cybersecurity-advisories>,
  <https://www.ncsc.gov.uk/guidance/phishing>).
- **E24** — UK NCSC and US FTC material on codes printed in documents and posters that route the reader
  to an unmanaged personal device (<https://www.ncsc.gov.uk/guidance/phishing>,
  <https://consumer.ftc.gov/articles/what-know-about-qr-codes>).
- **E25** — US FBI IC3 advisories on payroll diversion and direct-deposit change fraud
  (<https://www.ic3.gov/>); US FTC on business impersonation (<https://consumer.ftc.gov/articles/business-impersonation-scams>).

**Source-confidence note.** Where a secondary source is cited by its landing page rather than by a
dated article, that is deliberate: the landing page is the one a reviewer can re-open. Nothing in this
document rests on a secondary source for a *behavioural* claim that ATT&CK is asked to carry. The ATT&CK
citations are the load-bearing ones, every one is linked to its own technique page, and
`sceneResearch.test.js` fails the build if a technique is named here without its page. **ATT&CK research
does not affect scoring in any way**: the scores are the bank's, pinned by `sceneAffordance.test.js`.

### 0.3 Interpretation rule

ATT&CK is used as a **behavioural reference, not a checklist**. A mapping is recorded only where the
technique's own description describes what the scenario does, and each is marked **direct**,
**supporting** or **partial**. **E21 has no mapping, and that is stated** — a vendor completing an
approved change through its own controls involves no adversary. Techniques were **considered and
rejected** where they nearly fit but do not, each with its reason. Three behaviours in this batch have
**no dedicated ATT&CK technique** and the sections say so rather than forcing one: a *recorded or
synthesised voice* used as the instruction (E22), a *code printed inside an attachment* (E24), and the
reuse of a *subject line* to fake a reply chain without compromising any mailbox (E25).

### 0.4 What this document may and may not change

| Thing | May IMMERSIVE-009 change it? |
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
invented. E21 → `legit_verified_high_risk_change`; E22 → `payment_diversion`; E23 → `malware_delivery`;
E24 → `qr_code_phishing`; E25 → `payment_diversion`.

**The placeholder sender identifier.** Handled as in E01–E20: the scene uses the display name and address
the client's content implies, carries the notification body verbatim where it is a complete sentence,
names the bank's sender **asset id** on the inspection control, and never invents a real address.

**E25's parsed display name.** The generator stored E25's sender display name as `"Re"` — it split the
client's subject at the colon, exactly as it did for E18. The scene does not print the fragment: the
sender shown is **Maj. A. Iyer**, the officer the message claims to be from, and the inbox preview carries
the client's complete stage-1 sentence. The bank asset is untouched. E22's `"Col. Dev"` is a complete
name and is printed as stored.

**The narrator line is not printed.** No `prior_context` sentence is displayed on the device — E23's and
E25's contain judgement words ("DLP-themed", "compromised-looking"). The verdict-word assertion applies
the platform-wide list to every control label, hint and echo, so no control names the verdict; report
controls say "Report the message".

**Answer-revealing asset prose is not displayed.** E21's, E23's, E24's and E25's `browser_page` assets and
E22's/E23's/E24's `file` assets carry the client's stage-4 sentence as their `body`/`preview`; the scenes
use only their `display_target`, `host`, `file_name` and `file_size`, never the narrating sentence.

**The result card placeholder** (known limitation carried from earlier scenes) applies to all five.

---

## 0.6 Differentiation from Email E01–E20, WhatsApp W01–W25 and Instagram I01–I25

A comparison against all seventy earlier scenes was made **before** implementation, on story archetype,
attack family, trigger combination, military context, difficulty, branch shape, verification method,
decision home, resolution sequence, surface sequence and psychological lever:

| | Behavioural lesson | Social mechanism | Primary evidence | Decision home | Verification pattern | Unsafe temptation |
| --- | --- | --- | --- | --- | --- | --- |
| **E21** *(legitimate)* | A high-risk change with its controls completed is completed, not refused | Routine + authority | Signed form whose fingerprint matches the portal's; callback logged on the number already on file; Approval 1 of 2 by someone else | **The vendor portal's own case page (approve / reject)** | The vendor on the vendor-master number; the dual-control queue | Reject it "to be safe"; approve and release the payment in one step; ask for the account by email |
| **E22** *(military, fictional)* | A recording can be replayed but it cannot answer a question | Authority + urgency | External sending domain; file created four minutes before the mail; no case in the Welfare Fund; two-signature rule | **The fund's transfer sheet (PIN → Confirm vs Cancel)** | The Welfare Fund's own case list; the Adjutant's office on the directory number | Confirm the transfer; reply that it is done |
| **E23** | A page opened from a file has no address to check | Fear + duty/compliance | Reply-To off-domain; the console holds no alert for the account; the file runs script; "IT never attaches a finding" | **A local `file:///` page: its sign-in and its "secure viewer"** | The unit's Data Protection console; the IT security desk | Sign in to "unlock" it; install the viewer; open it at all |
| **E24** | The route the item asks for is not always the route the item has | Authority + convenience | Sending domain differs from last year's circular; short form and expansion are different hosts; the Policy Centre has the task waiting | **The code inspector, then the cloned sign-in — against the Policy Centre** | The Policy Centre itself; the compliance helpdesk | Open the decoded address; sign in on it |
| **E25** *(military, fictional)* | "Re:" is typed by whoever writes it | Authority + routine | Headers say it replies to nothing; the quoted text is a real 28 Aug message pasted in; no member request on file; the member is on the station | **The prefilled change form, and the Payroll run (hold vs release)** | The member's own pay record; the officer on the unit directory number | Approve the prefilled form; release the run; forward it to the clerk |

**New Email-native mechanics this batch adds:** E21 is the first scene in the product whose **safe branch
completes a high-risk change** rather than keeping, archiving or accepting something, and the first whose
**link is genuine** — the lesson is that a link is checkable, not that links are forbidden; it also adds a
**signed-form fingerprint** the learner can read against the portal's own record. E22 is the first scene
anywhere in the product whose payload is a **recording**: a voice attachment with a local player, a drawn
waveform and the mail app's own **transcript** (one new renderer beat, `voice`; WhatsApp's voice notes are
chat bubbles, not mail attachments, and no Email scene has had one). E23 is the first scene to open a page
**from a file on the device** (`file:///`, no host, no padlock), reached through an attachment preview that
**refuses to render** and offers only "Open in browser". E24 puts its code **seven pages into a paginated
document** rather than in the message, and is the only scene in which the item's own legitimate task —
acknowledging in the app the unit already uses — is offered as the safe branch. E25 fakes a reply chain by
**reusing a subject line** rather than a mailbox, and is the only scene in which the money at risk belongs
to **a third person**, so the learner's "would I pay this?" instinct never fires.

**What E21–E25 are not.** None is a generic "click this link", a macro attachment (E02), a look-alike
vendor domain (E10), a password-protected archive (E13), an OAuth consent (E15) or a commander
impersonation of the E06/E09/E14 kind. E21 and E18 both live in the vendor-payment world and are
deliberately opposite: E18's mail leaves the vendor's real mailbox and the change is fraudulent; E21's
change is real and the mistake is refusing it. E22 and W15/I22 share the "voice" idea and differ in
channel and in mechanism — W15 is a chat voice note in a cloned profile, I22 an Instagram video call;
E22 is an audio attachment to an email with no live person at all. E23 and E13 are both attachment
malware and differ in what the attachment *is* and where it opens. E24 and E14 are the two QR scenes and
are differentiated in `sceneModel.test.js` by page graph, decoding evidence and safe branch. E25 and E18
are the two reply-chain scenes and are differentiated by what was actually faked.

**Differentiation, asserted.** `sceneModel.test.js` asserts that **none of E21–E25 repeats a branch-stage
shape of any of the seventy earlier scenes, or of each other**; that **each of the five has a decision
home no other Email scene shares**; that E22 alone in the product carries a `voice` beat; that E23 alone
opens a `file:///` page; that only E14 and E24 decide on a scanned code and that their page graphs and
safe branches differ; and that exactly two of the five (E23, E24) have any form field at all.

---

## 1. E21 — Verified Vendor Master Change

### Client scenario (authoritative)

Specification page 83. Email, **Hard**, **Legitimate**, family *Legitimate high-risk business change*,
trigger *Routine + authority*. Canonical identity: family `legit_verified_high_risk_change`, triggers
`routine` + `authority`, military flag **false**, level `hard`.

- **Stage 1 (Event).** "Northstar Supplies: Signed beneficiary-change case VC-209 is available in the
  vendor portal."
- **Stage 2 (Open).** The established vendor thread. A real vendor initiates a bank-detail change through
  the approved signed form and expects independent callback and dual approval.
- **Stage 3 (Inspect).** Authenticated sender, signed form hash, portal case ID and the explicit callback
  instruction. Decision signal: *the request follows the approved high-risk process and invites
  independent verification; it is not safe to accept without those controls.*
- **Stage 4 (Branch).** The approved vendor portal case with side-by-side old/new details and Hold/Verify.
  Expected: *use the normal in-app path only after the details match the known context.*
- **Stage 5 (Verify).** Call the known vendor contact on file and obtain the required second approver; do
  not report or block a legitimate sender.
- **Stage 6 (Resolve).** After both checks match, approve in the vendor portal; retain audit evidence; do
  not report the legitimate sender.

### MITRE ATT&CK alignment

**There is none, and none has been invented.** ATT&CK catalogues adversary behaviour. In this scenario
there is no adversary: a real supplier is changing a real account through the process that exists for
exactly that purpose, having already completed the callback on the contact the buyer already held, and
one approver has already signed. Nothing is impersonated, nothing is delivered, nothing is stolen and
nothing is obfuscated. The scene exists to teach proportion in the other direction from a phishing
lesson: a learner who refuses a change that has passed every control has not been careful, they have
stopped the unit paying its supplier — and a learner who approves *and* releases the money in one step has
destroyed the dual control that made the change safe. ATT&CK models neither a person's over-caution nor
their collapsing of a two-person control into one.

**Closest defensible behavioural reference** — deliberately not an ATT&CK technique:

- UK NCSC guidance on verifying a payment-detail change through a contact you already hold rather than one
  supplied in the request (<https://www.ncsc.gov.uk/guidance/phishing>).
- US NIST, "Phish Scale User Guide", on the operational cost of false positives and why not every
  high-risk-looking message is hostile (<https://www.nist.gov/publications/phish-scale-user-guide>).
- Ordinary segregation-of-duties practice: a beneficiary change requires an independent callback and two
  approvers, and the approver who logged the callback may not be the one who signs second.

The defensive frame is: does the case exist in the portal, does the signed form's fingerprint match what
the portal recorded, was the callback made on the number already on file, and is the first approval
somebody else's? If all four hold, the correct action is to complete it and keep the evidence with the
case.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The inbox preview and the first paragraph of the body |
| "Authenticated sender" | The details sheet: SPF, DKIM and DMARC all pass for the unit's own portal domain |
| "Signed form hash" | The fingerprint is printed in the message table, shown on the signed-form screen and recorded on the portal case page — three places that must agree |
| "Portal case ID" | `VC-209` on the row, the table, the case page, the audit trail and the dual-control queue |
| "Explicit callback instruction" | The vendor's own 12 Sep message asks to be called on the number the buyer already holds, and says the account will not be sent by email |
| "Side-by-side old/new details and Hold/Verify" | The case page's summary: *Current on file* against *Requested*, with approve and reject controls on it |
| "Call the known vendor contact on file" | `verify_known_number` → the call surface, on the vendor-master number |
| "Obtain the required second approver" | The case page's *Approval 1 of 2* / *Approval 2 of 2* rows, and the dual-control queue (`verify_known_app`) |
| "Do not report or block a legitimate sender" | Report and block at verify are the `−4` false positives |
| "Approve in the vendor portal; retain audit evidence" | `resolve_continue` ("Complete the case and keep the evidence with it") or `resolve_retain` |

### Enhanced synthetic storyline

Northstar Supplies is moving banking partners on 1 October. On 11 September they opened case VC-209 in the
buyer's own vendor portal and uploaded a signed change form; the portal mailed the Payments approvers
group that day. On 12 September the vendor wrote to the learner directly asking them to call on the number
already in the vendor master so an approver could complete the callback step — and saying plainly that
they would not send the account details by email. K. Rao made that call the same morning and recorded the
first approval. Today the portal's automated notice says the case is waiting for a second approver. There
is no deadline, no threat and no urgency anywhere in it.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast: "Northstar Supplies" |
| Open | The inbox, with a Portal folder holding the 11 Sep case-opened notice and August's closed case VC-201 |
| Inspect | The thread (the portal's 11 Sep notice, the vendor's 12 Sep request, today's notice), the details sheet, the signed form |
| Branch | The portal case page: approve as second approver, reject, or approve-and-release; or ask the vendor for the account by email |
| Verify | The vendor on the vendor-master number, the dual-control queue, the directory |
| Resolve | Complete the case and keep the evidence, or keep the notice with the case file; report/ignore available and wrong |

### Evidence the learner can discover (progressive)

1. The Portal folder already holds two notices in the same shape from the same address, including one
   change case that closed normally in August.
2. The details sheet: From is the unit's own `vendorportal.unit.training.example`, no reply address is
   set, SPF/DKIM/DMARC all pass and the link target is the same internal host.
3. The signed form: certificate valid, signed 11 Sep, fingerprint `4F 19 C0 7A 2B 8E 55 D3` — and the note
   that the portal recorded the same fingerprint at upload.
4. The vendor's own 12 Sep message asks to be called on the number already held, and refuses to send
   account details by email — the opposite of what a diversion attempt does.
5. The case page: callback logged 12 Sep on that number by K. Rao; Approval 1 of 2 recorded; Approval 2 of
   2 awaiting; a notice that the second approver must be someone else.
6. The audit trail page: four timestamped entries, read-only, retained with the case.

### Learner interaction journey

Notify → open the notice → the details, then the signed form → open the case in the portal → read the two
account records side by side → record the second approval → call the vendor on the vendor-master number →
complete the case and keep the evidence with it.

### Simulation surfaces

- `details` (`MAIL`): headers, authentication, link target, with a link to the form.
- `form` (`MAIL`): the signed form — signature, date, fingerprint, and the two account records.
- `portal` (`BROWSER`): the vendor portal's case page and its audit trail, on the unit's own host.
- `approvals` (`APP`): the Payments dual-control queue.
- `call` (`CALL`): the vendor's accounts desk on the vendor-master number.

### Verification mechanism

`verify_known_number` calls the vendor on the number the vendor master already holds; `verify_known_app`
opens the dual-control queue; `verify_trusted_directory` lists the unit support desk, and the scene's own
directory extra names the vendor contact with its provenance ("vendor master record, verified at
onboarding"). Replying to the no-reply notice address is `verify_in_message_contact`, worth `0`. Reporting
or blocking the unit's own portal is the `−4` false positive.

### Safe resolution

`resolve_continue` (complete the case, evidence retained) or `resolve_retain` (keep the notice with the
case file), `+2`. Full safe path: `open_item → read → inspect_sender → safe_pivot (record the second
approval) → verify_known_number → resolve_continue` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Reject VC-209 and close the case | `reject_ignore` | `NEEDLESS_REJECT_IGNORE` | −2 |
| Approve and release the payment in one step | `attempt_payment` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Email the vendor for the account number in writing | `reply` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Report / block at verify | `report` / `block` | `FALSE_REPORT_BLOCK` | −4 |
| Report / block / ignore at the end | `resolve_report` / `resolve_block` / `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `CORRECT_USE +3`, `NEEDLESS_REJECT_IGNORE −2`, `UNSAFE_EXTERNAL_ACTION −4`; recording the
second approval resolves to `CORRECT_USE` because the scenario is legitimate. The reject → verify →
continue route scores 5 and reviews as `abandoned_without_checking`; the reject → report → report route
scores 0 and reviews as a **false positive**; approve → release → continue scores 3.

### Why the final simulation stays faithful

Every client element is present and in the place the client put it: the authenticated portal sender, the
signed form and its hash, the case ID, the explicit callback instruction, the side-by-side old and new
details with hold and approve on the case page, the call to the known vendor contact, the second approver,
the approval in the portal and the retained audit evidence. The scene is as rich as its four malicious
neighbours — five surfaces, a three-message thread and a folder of history — so its legitimacy is never
given away by being thin. And the one thing that would have made it easy has been removed: the link in the
notice is genuine, so "the link is the tell" does not work here.

---

## 2. E22 — Senior Voice Memo Transfer

### Client scenario (authoritative)

Specification page 84. Email, **Hard**, **Malicious**, family *Synthetic voice / executive impersonation*,
trigger *Authority + urgency*, **FICTIONAL MILITARY CONTEXT**. Canonical identity: family
`payment_diversion`, triggers `authority` + `urgency`, military flag **true**, level `hard`.

- **Stage 1 (Event).** "Col. Dev: Voice memo - process the welfare transfer now; do not call during the
  briefing."
- **Stage 2 (Open).** An external email contains a convincing voice memo directing a confidential transfer
  before a meeting.
- **Stage 3 (Inspect).** The sender, the sending domain and what the attachment itself carries.
- **Stage 4 (Branch).** An audio player with transfer instructions and a payment mock.
- **Stage 5 (Verify).** The unit's own records and an independent number.
- **Stage 6 (Resolve).** Report; do not make the transfer.

### MITRE ATT&CK alignment

| Technique | Fit | Why this maps |
| --- | --- | --- |
| [T1684.001 Social Engineering: Impersonation](https://attack.mitre.org/techniques/T1684/001/) | **Direct** | The whole message is one person persuading another by pretending to be a known senior figure. The technique's own text names impersonation of "an executive, colleague, or third-party vendor" to make a target act, and names business email compromise as the common case. |
| [T1657 Financial Theft](https://attack.mitre.org/techniques/T1657/) | **Direct** | The objective is the money itself: a single disbursement moved to an account the adversary controls. The technique covers fraudulent transfers obtained by deception rather than by intrusion. |
| [T1585.002 Establish Accounts: Email Accounts](https://attack.mitre.org/techniques/T1585/002/) | **Supporting** | The message comes from an address on a domain that is not the unit's, created for the approach. The technique covers creating mail accounts to carry a phishing approach. |
| [T1566.004 Phishing: Spearphishing Voice](https://attack.mitre.org/techniques/T1566/004/) | **Partial fit, stated** | The lure is a voice, which is what this sub-technique is about — but the sub-technique describes a *live call* to the victim. Here there is no call: the voice is an attachment, and the sender explicitly forbids calling back. Recorded as partial, never as the primary mapping. |

**Considered and rejected.**

- [T1566.001 Phishing: Spearphishing Attachment](https://attack.mitre.org/techniques/T1566/001/) — the
  message does have an attachment, but this sub-technique is about a file that *executes* to gain access to
  a system. Nothing in E22 executes; the attachment is the message, not a payload.
- [T1534 Internal Spearphishing](https://attack.mitre.org/techniques/T1534/) — requires the adversary to
  already hold an account inside the organisation. The address here is external and the details sheet says
  so; that is the tell.
- [T1586.002 Compromise Accounts: Email Accounts](https://attack.mitre.org/techniques/T1586/002/) — nothing
  is compromised. That is E18's mapping, not this one.

**What must NOT be copied.** No real officer, unit, formation, rank-holder, welfare scheme, bank, account
number, IFSC or phone number appears. No audio file, audio element, media API, object URL or MIME type
exists anywhere in the product; the "memo" is a drawn waveform, a local clock and authored text. No
technique for producing or detecting synthetic speech is described, and none is needed: **ATT&CK has no
technique for a recorded or synthesised voice used as an instruction**, and that gap is stated rather than
filled with a near-miss.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The inbox preview |
| "An external email" | The mail app's own external banner beat, and the details sheet's "Sending domain — not unit.training.example" row |
| "Contains a convincing voice memo" | The `voice` beat: file name, length, waveform, local play and the app's transcript |
| "Directing a confidential transfer" | The transcript and the table: amount, beneficiary, account, IFSC, reference, deadline |
| "Before a meeting" / "do not call during the briefing" | The body, the transcript ("I am in the briefing until five") and the absence of any callback route in the message |
| "An audio player with transfer instructions and a payment mock" | The player in the thread; the fund's transfer sheet (`PAYSHEET`) with PIN and Confirm |
| "Verify independently" | The Welfare Fund's own case list and the Adjutant's office on the unit directory number |
| "Report; do not make the transfer" | `resolve_report` / `resolve_block`; the transfer stays unmade |

### Enhanced synthetic storyline

A message arrives at 12:10 from a name the learner knows and an address they have never seen. The body is
two sentences: the instruction has been recorded because the sender is about to go into a briefing without
their phone, and the details are in the memo and repeated below. The memo is forty-one seconds. The voice
asks for one lakh twenty thousand to go from the welfare account to a named individual today, says the
paperwork will follow, says not to ring because of the briefing, and asks for discretion because "the
family has asked for it". Underneath, the beneficiary details sit in a neat table with a 17:00 deadline.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast: "Col. Dev" |
| Open | The inbox, with a Welfare folder holding August's disbursements and the 14 Aug standing instruction |
| Inspect | The external banner, the body, the player and the transcript, the table; the details sheet; the attachment-details screen |
| Branch | The fund's transfer sheet (Confirm / Cancel), a reply saying it is done, or leaving it until the briefing ends |
| Verify | The Welfare Fund app, the Adjutant's office, the directory |
| Resolve | Report and leave the transfer unmade; or put it through |

### Evidence the learner can discover (progressive)

1. The mail app's external banner, before anything is opened.
2. The details sheet: SPF and DKIM pass — for `e22.training.example`, which is not the unit's domain, and
   the note that everyone in the unit including the Commanding Officer has an address on it.
3. The attachment-details screen: the file was created four minutes before the mail, carries no device
   tag, and — the line that matters — "Audio files carry none" under *Signature*.
4. The Welfare Fund: no case raised this week; the standing rules require a written committee case and two
   recorded signatures, and say instructions are never acted on from a recording or a phone call.
5. The 14 Aug standing instruction sitting in the learner's own Welfare folder, saying the same thing.
6. The Adjutant's office: the officer is in the briefing, and has issued no welfare instruction today.

### Learner interaction journey

Notify → open the memo → play it and read the transcript → the details sheet → the attachment details →
open the transfer sheet from the table → read the payee and the "Second signature: Not recorded" row →
Cancel → call the Adjutant's office on the directory number → report.

### Simulation surfaces

- `details` (`MAIL`): headers, authentication, the external-domain row.
- `memo` (`MAIL`): what the file itself carries, and what it cannot.
- `paysheet` (`PAYSHEET`): payee, account, reference, the missing second signature, a PIN field and Confirm.
- `fund` (`APP`): the Welfare Fund's cases, standing rules and last disbursements.
- `adjt` (`CALL`): the Adjutant's office on the unit directory number.

### Verification mechanism

`verify_known_app` opens the Welfare Fund; `verify_known_number` calls the Adjutant's office on the unit
directory number; `verify_trusted_directory` lists the support desk and the scene's directory extra names
the Adjutant's office with its provenance. Replying to the memo to ask the sender to confirm is
`verify_in_message_contact`, worth `0` — asking the voice whether the voice is real.

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_sender →
safe_pivot (Cancel on the transfer sheet) → verify_known_number → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Confirm the transfer | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Reply that it has been put through | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Ask the sender to confirm at verify | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |
| Put the transfer through at the end | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`. The
confirm route scores 0 and reviews as `released_details_or_paid`; the reply route scores 4 and reviews as
`risky_engagement`. The PIN typed on the sheet is never read by the control that commits, and never leaves
the component.

### Why the final simulation stays faithful

Every client element is present: the external email, the convincing recorded memo, the confidential
transfer, the "before the meeting" pressure that also removes the callback, the audio player, the payment
mock, the independent verification and the reporting resolution. The one liberty taken is stated in §8:
the client's stage-4 text says "an audio player with transfer instructions and a payment mock", and the
scene makes the *payment sheet* the scored decision and the player a piece of the message — because
listening to a message is reading it, and the engine takes one decision per stage.

---

## 3. E23 — DLP Alert HTML Attachment

### Client scenario (authoritative)

Specification page 85. Email, **Hard**, **Malicious**, family *Security-tool impersonation / HTML
smuggling*, trigger *Fear + compliance*. Canonical identity: family `malware_delivery`, triggers `fear` +
`duty_compliance`, military flag **false**, level `hard`.

- **Stage 1 (Event).** "Data Protection Monitor: Potential exfiltration detected - open
  SecurityReport.html."
- **Stage 2 (Open).** A DLP-themed email claims a policy violation and attaches an HTML report for local
  review.
- **Stage 3 (Inspect).** The sender, the Reply-To and what kind of file the attachment is.
- **Stage 4 (Branch).** An inert local HTML page that renders a credential prompt and download button.
- **Stage 5 (Verify).** The organisation's own console and the security desk.
- **Stage 6 (Resolve).** Report; leave the attachment unopened.

### MITRE ATT&CK alignment

| Technique | Fit | Why this maps |
| --- | --- | --- |
| [T1566.001 Phishing: Spearphishing Attachment](https://attack.mitre.org/techniques/T1566/001/) | **Direct** | The delivery is an attachment the user is told to open, with social-engineering text around it. That is precisely this sub-technique. |
| [T1027.006 Obfuscated Files or Information: HTML Smuggling](https://attack.mitre.org/techniques/T1027/006/) | **Direct** | The payload is carried *inside* an HTML file so that what reaches the mail gateway is a document rather than a page fetched from a server. The technique names exactly this: the content is assembled on the host when the file is opened. |
| [T1036 Masquerading](https://attack.mitre.org/techniques/T1036/) | **Supporting** | The message and the page both dress themselves as a security tool, and the page draws an imitation of the organisation's own sign-in. |
| [T1204.002 User Execution: Malicious File](https://attack.mitre.org/techniques/T1204/002/) | **Supporting** | The attack cannot proceed unless the user opens the file. The branch control that opens it in the browser is the act this technique describes. |
| [T1219 Remote Access Tools](https://attack.mitre.org/techniques/T1219/) | **Partial fit, stated** | The "DP Secure Viewer" asks for file access, background activity and accessibility — the shape of a remote-access install. But the technique is about a *named, often legitimate* remote-access product being abused, and nothing here is named or installable. Recorded as partial. |

**Considered and rejected.**

- [T1056.003 Input Capture: Web Portal Capture](https://attack.mitre.org/techniques/T1056/003/) — describes
  capturing credentials by modifying a *legitimate* portal the adversary has already compromised. The page
  here is the adversary's own file; nothing of the organisation's has been touched.
- [T1566.002 Phishing: Spearphishing Link](https://attack.mitre.org/techniques/T1566/002/) — there is no
  link in the message at all. Naming it would misdescribe the central property of the scene.

**What must NOT be copied.** No real security product, vendor, console, rule name or case format appears.
The "HTML report" is a described surface, not a file: nothing is written to disk, nothing is downloaded,
no script exists, and the `file:///` address is drawn text in a read-only address bar. No real credential
is collected; the two fields are local, masked by CSS and discarded on unmount.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The inbox preview and the first paragraph of the body |
| "Claims a policy violation" | The brand band, the case table (`DLP-4471`, the learner's own account, the rule, the detection time) |
| "Attaches an HTML report" | The attachment card, `SecurityReport.html`, 867 KB |
| "For local review" | The preview's message bar: the app cannot display it and the file has been saved to Downloads |
| "An inert local HTML page" | The `BROWSER` surface on `file:///storage/downloads/SecurityReport.html`, marked not secure |
| "That renders a credential prompt" | The "Unlock the finding" form: work email and password, both local |
| "And download button" | The second page: DP Secure Viewer, unknown publisher, signed by nobody |
| "Verify independently" | The Data Protection console (no alert for the account) and the IT security desk |
| "Report; leave it unopened" | `resolve_report` / `resolve_block`; the safe branch leaves the attachment unopened |

### Enhanced synthetic storyline

At 12:19 an automated-looking alert says monitoring has flagged an outbound transfer from the learner's
account against rule DLP-4471 — bulk transfer of internal documents to an unapproved destination — detected
twenty-seven minutes ago. The finding is attached "as an offline report so that it can be reviewed without
sending anything further over the network", which is a plausible-sounding reason to open a file. The
learner is told to sign in with their work account to unlock the finding and confirm within 24 hours;
unreviewed findings escalate to the line manager and restrict the account. The footer adds a last touch:
do not forward this report — it contains the flagged content.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast: "Data Protection Monitor" |
| Open | The inbox, with an IT folder holding the refresher notice and August's "How we contact you about an alert" |
| Inspect | The alert, the case table, the attachment card; the details sheet; the attachment preview |
| Branch | Open it in the browser (from the preview's bar); then sign in, or install the viewer; or leave it unopened; or reply |
| Verify | The Data Protection console, the IT security desk, the directory |
| Resolve | Report and leave it unopened; or complete the review |

### Evidence the learner can discover (progressive)

1. The IT folder already holds a notice from IT Security saying alerts appear in the console and are never
   attached.
2. The details sheet: SPF and DKIM pass for `e23.training.example`, the Reply-To is a different
   `e23-alerts` host, and there are no links — only the attachment.
3. The preview: the mail app will not render it; the file has been saved to Downloads; it contains script
   it will run when opened; it is signed by nobody.
4. In the browser: no host, no padlock, an address that is a path in Downloads — and the page's own
   fineprint saying the bar shows where the file is, not who wrote it.
5. The viewer page: unknown publisher, asks for files, background activity and accessibility, signed by
   nobody.
6. The Data Protection console: no open alerts, nothing in 30 days, and no case with that reference.

### Learner interaction journey

Notify → open the alert → the details sheet → preview the attachment → read the bar → leave it unopened →
open the Data Protection console → report.

### Simulation surfaces

- `details` (`MAIL`): headers, the differing Reply-To, authentication.
- `preview` (`MAIL`): the file facts and the message bar that carries the only control on this screen.
- `local` (`BROWSER`): the report page and the viewer page, both on a `file:///` address, both not secure.
- `console` (`APP`): the unit's Data Protection console — alerts, history and how staff are told.
- `security` (`CALL`): the IT security desk on the directory number.

### Verification mechanism

`verify_known_app` opens the Data Protection console; `verify_known_number` calls the IT security desk;
`verify_trusted_directory` lists the desk, and the scene's directory extra names it with its provenance.
Replying to the alert address to ask whether it is real is `verify_in_message_contact`, worth `0`.

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_sender →
safe_pivot (leave the attachment unopened) → verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Unlock the finding (work email + password) | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Install the secure viewer | `attempt_install` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Open it in the browser | `open_file` | `RISKY_OPEN_REPLY` | −3 |
| Reply asking which files were flagged | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Report without checking, at verify | `report` | `REPORT_ONLY_WITHOUT_CHECK` | +1 |
| Complete the review at the end | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`. Both
`−8` routes live on the same local page and are reached by ordinary page navigation, as in E10, E12 and
E20; the engine still takes exactly one of them. Sign-in and install routes score 0 and review as
`released_details_or_paid`; opening the file scores 4 and reviews as `risky_engagement`.

### Why the final simulation stays faithful

Every client element is present: the DLP pretext, the claimed policy violation, the HTML attachment
offered for local review, the inert local page, the credential prompt, the download button, the
independent console check and the reporting resolution. What the scene adds is the reason the pretext
works — the learner's whole habit of checking the address bar is useless against a page that was never
fetched from anywhere — and it adds it without a single real file, script or download.

---

## 4. E24 — QR Code in Policy PDF

### Client scenario (authoritative)

Specification page 86. Email, **Hard**, **Malicious**, family *QR phishing / credential theft*, trigger
*Authority + convenience*. Canonical identity: family `qr_code_phishing`, triggers `authority` +
`convenience`, military flag **false**, level `hard`.

- **Stage 1 (Event).** "Compliance Office: Mobile acknowledgement required - scan the QR in attached
  policy."
- **Stage 2 (Open).** An otherwise polished policy email attaches a PDF that says scanning a QR is the only
  way to acknowledge.
- **Stage 3 (Inspect).** The sender, the recipients and the attached document.
- **Stage 4 (Branch).** The PDF QR inspector and a synthetic mobile sign-in.
- **Stage 5 (Verify).** The organisation's own policy system and the compliance helpdesk.
- **Stage 6 (Resolve).** Report; acknowledge through the normal route.

### MITRE ATT&CK alignment

| Technique | Fit | Why this maps |
| --- | --- | --- |
| [T1566.001 Phishing: Spearphishing Attachment](https://attack.mitre.org/techniques/T1566/001/) | **Direct** | The vehicle is an attached document the recipient is told to open, and the attachment is what carries the attack forward. The document itself is the delivery. |
| [T1036 Masquerading](https://attack.mitre.org/techniques/T1036/) | **Direct** | The circular imitates the organisation's own compliance office and the landing page imitates its Policy Centre, down to the monogram and the task wording. |
| [T1566.002 Phishing: Spearphishing Link](https://attack.mitre.org/techniques/T1566/002/) | **Partial fit, stated** | What the code encodes is a link, and the sub-technique's own text covers obfuscated and redirecting URLs. But there is no link *in the message*, which is the property that carries the scene: the sub-technique describes links in email bodies, and was read live for this batch to confirm it **does not mention QR codes at all**. |
| [T1204.002 User Execution: Malicious File](https://attack.mitre.org/techniques/T1204/002/) | **Supporting** | The document must be opened and walked through before the code can be reached; the attack depends entirely on that user action. |

**The gap, stated.** **ATT&CK v19.2 has no technique for a QR code**, and none for a lure that deliberately
routes the reader onto a second, unmanaged device. T1566.002 was read in full on 20 September 2026 and
contains no mention of codes, cameras or devices. That absence is recorded here rather than papered over
with a near-miss mapping, exactly as the E14 record did for the same reason.

**Considered and rejected.**

- [T1204.001 User Execution: Malicious Link](https://attack.mitre.org/techniques/T1204/001/) — describes a
  user being led to execute code by following a link. Nothing executes in E24; the destination is a
  credential page.
- [T1534 Internal Spearphishing](https://attack.mitre.org/techniques/T1534/) — the sender is external, and
  the details sheet contrasts it with last year's genuine circular from the internal address.

**What must NOT be copied.** No real compliance function, policy, circular numbering scheme, portal or
identity provider appears. No QR code is encoded or decoded anywhere: the inspector states in words what a
reader would have found, there is no camera permission, no image, no decoder and no clipboard access, and
the "short form" and the address it expands to are both drawn text. No real credential is collected.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The inbox preview and the second paragraph of the body |
| "An otherwise polished policy email" | The brand band, the circular number, the fortnight-long deadline, the "do not reply" footer, and real policy prose in the document |
| "Attaches a PDF" | The attachment card: `Policy_2026_Acceptable_Use.pdf`, 292 KB, eight pages |
| "That says scanning a QR is the only way to acknowledge" | Page 7 of the document: acknowledgement "must be completed on a mobile device"; desktop acknowledgement "has been withdrawn" |
| "The PDF QR inspector" | The `VIEWER` surface, reached from page 7's own bar link, stating the printed short form, the expansion, the host and what the page asks for |
| "A synthetic mobile sign-in" | The `BROWSER` page the code leads to: work account and password, both local |
| "The organisation's own policy system" | The Policy Centre (`APP`), which holds the acknowledgement task and the learner's two previous acknowledgements |
| "Report; acknowledge through the normal route" | `resolve_report` ("Report the circular and acknowledge in the Centre") |

### Enhanced synthetic storyline

The annual acceptable-use circular arrives at 12:58 addressed to all staff. It is short, polite and
unremarkable: the policy has been revised, it is attached, read it in full, acknowledgement instructions
are on the last page, the deadline is 30 September. The document is eight real pages — purpose and scope,
acceptable use, handling of information (unchanged from 2025), reporting — and then, on page 7, one new
sentence: from this year acknowledgement must be completed on a mobile device by scanning the code printed
below, because desktop acknowledgement has been withdrawn. That sentence is the entire attack, and it is
buried seven pages into a document nobody reads twice.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast: "Compliance Office" |
| Open | The inbox, with a Policy folder holding last year's circular and the Policy Centre's acknowledgement receipt |
| Inspect | The circular; the details sheet; the document, opened at page 1 |
| Branch | Walk to page 7, read the code with the device, open the address it contains, sign in — or acknowledge in the Policy Centre, or close the circular |
| Verify | The Policy Centre, the compliance helpdesk, the directory |
| Resolve | Report and acknowledge in the Centre; or keep it and scan before the deadline |

### Evidence the learner can discover (progressive)

1. The Policy folder: last year's circular came from `compliance@unit.training.example`, and the Policy
   Centre recorded the acknowledgement four days later.
2. The details sheet: SPF and DKIM pass — for `e24.training.example`, not the unit's domain — and there are
   no links in the message at all.
3. The document itself is real policy text for six pages, which is what makes page 7 land.
4. The code inspector: printed under the code is `ackn.training.example/p7`; it expands to a different
   host; that host is not the unit's; the page asks for a work account and password.
5. The Policy Centre: the acknowledgement task for this circular is already waiting, it works on any
   device, the learner is already signed in, and the Centre "has never used" a mobile code.
6. The compliance helpdesk: the circular is real and went out this morning — from the internal address,
   with no attachment — and nobody has ever been asked to scan anything.

### Learner interaction journey

Notify → open the circular → the details sheet → open the document → page 1, page 4, page 7 → read the
code with the device → see where it goes → back out → open the Policy Centre → acknowledge there → call
the compliance helpdesk → report.

### Simulation surfaces

- `details` (`MAIL`): headers, recipients, authentication, the external-domain row.
- `doc` (`MAIL`): the document, paginated `p1` → `p4` → `p7`, with a contents list and page links.
- `qr` (`VIEWER`): the code inspector — the printed short form, its expansion, the host, what it asks for.
- `signin` (`BROWSER`): the cloned Policy Centre sign-in.
- `centre` (`APP`): the real Policy Centre, with the task waiting and the learner's own history.
- `helpdesk` (`CALL`): the compliance helpdesk on the directory number.

### Verification mechanism

`verify_known_app` opens the Policy Centre; `verify_known_number` calls the compliance helpdesk;
`verify_trusted_directory` lists it, and the scene's directory extra names it with its provenance.
Replying to the circular address to confirm is `verify_in_message_contact`, worth `0`.

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_sender →
safe_pivot (acknowledge in the Policy Centre) → verify_known_number → resolve_report` = **10**. Closing
the circular without scanning is the second safe branch, for a learner who does not want to act at all.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Sign in to acknowledge on the page the code leads to | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Open the address the code contains | `scan_qr` | `RISKY_OPEN_REPLY` | −3 |
| Reply that you cannot scan it | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Ask the circular address to confirm, at verify | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |
| Keep it and scan before the deadline | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`. Reading
the code with the device is local navigation and scores nothing; *opening the address it contains* is the
`−3`, and signing in on that page is the `−8`. Acknowledging in the Policy Centre is the `+3`, which is
what makes this scene different from E14: the item's own task has a legitimate route, and taking it is the
safe branch.

### Why the final simulation stays faithful

Every client element is present: the polished circular, the attached policy, the instruction that scanning
is the only way to acknowledge, the QR inspector, the synthetic mobile sign-in, the organisation's own
policy system as the check and the reporting resolution with acknowledgement through the normal route.
What the scene adds is the work: the code is not handed to the learner, it is on page 7 of eight, behind
six pages of prose that are entirely real.

---

## 5. E25 — Payroll Direct-Deposit Redirect

### Client scenario (authoritative)

Specification page 87. Email, **Hard**, **Malicious**, family *HR/business email compromise / payroll
fraud*, trigger *Authority + routine*, **FICTIONAL MILITARY CONTEXT**. Canonical identity: family
`payment_diversion`, triggers `authority` + `routine`, military flag **true**, level `hard`.

- **Stage 1 (Event).** "Re: Allowance correction - use the new account before today."
- **Stage 2 (Open).** A compromised-looking manager thread asks payroll to redirect a service member's
  allowance using an attached form.
- **Stage 3 (Inspect).** The sender, the thread position and the quoted history.
- **Stage 4 (Branch).** A prefilled payroll change form and Approve button.
- **Stage 5 (Verify).** The member's own record and an independent number.
- **Stage 6 (Resolve).** Report; leave the account on file.

### MITRE ATT&CK alignment

| Technique | Fit | Why this maps |
| --- | --- | --- |
| [T1684.001 Social Engineering: Impersonation](https://attack.mitre.org/techniques/T1684/001/) | **Direct** | The message impersonates a named senior colleague to make a subordinate perform an action on their behalf — the technique's own description, and its named business-email-compromise case. |
| [T1657 Financial Theft](https://attack.mitre.org/techniques/T1657/) | **Direct** | The objective is a salary payment redirected to an adversary-controlled account. Payroll diversion is squarely inside this technique's scope. |
| [T1585.002 Establish Accounts: Email Accounts](https://attack.mitre.org/techniques/T1585/002/) | **Supporting** | The sending address exists only for this approach; the details sheet contrasts it with the officer's real internal address. |
| [T1036 Masquerading](https://attack.mitre.org/techniques/T1036/) | **Partial fit, stated** | The display name, the subject line and the pasted quotation are all dressed to look like a continuation of a real exchange. The technique is oriented towards files, tasks and services rather than message metadata, so it is recorded as partial. |

**Considered and rejected.**

- [T1586.002 Compromise Accounts: Email Accounts](https://attack.mitre.org/techniques/T1586/002/) — this is
  E18's mapping and is precisely what E25 is **not**. No mailbox has been compromised; the adversary copied
  a subject line and pasted a quotation. Naming it would erase the difference the two scenes exist to teach.
- [T1534 Internal Spearphishing](https://attack.mitre.org/techniques/T1534/) — requires an account the
  adversary already controls inside the organisation. The headers show an external domain and no
  `In-Reply-To`.
- [T1566.001 Phishing: Spearphishing Attachment](https://attack.mitre.org/techniques/T1566/001/) — the
  client's stage-2 text says "using an attached form", but the form the learner actually meets is the
  prefilled page behind the message's button (the bank's own asset for this scenario is a `browser_page`).
  Nothing is attached and nothing executes, so the attachment sub-technique is not claimed.

**The gap, stated.** ATT&CK models thread hijacking through **compromised** accounts. It has **no technique
for faking a reply chain by reusing a subject line and pasting a quotation** — an approach that needs no
access at all. That absence is recorded rather than forced into T1586.002.

**What must NOT be copied.** No real unit, officer, rank-holder, service number, pay section, allowance,
payroll system, bank, account number or IFSC appears. No form is submitted, no run is released, no money
moves, and nothing is typed anywhere in this scene.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The inbox preview and the first paragraph of the body |
| "A manager thread" | The 28 Aug message from the officer, expanded in the thread, and the quoted block under today's message |
| "Asks payroll to redirect a service member's allowance" | The body and the change table: member, reference, account on file, new account, IFSC, effective tonight |
| "Using an attached form" | The message's own button, "Open the completed form", which opens the prefilled change page (§8, deviation 3) |
| "A prefilled payroll change form and Approve button" | The `BROWSER` page: every field already filled, "Requested by … (typed on this form)", "Member's signature: Not required", and the approve control |
| "The member's own record" | The Pay records app: change history, bank-notice row and the member's contact and status |
| "An independent number" | The officer on the unit directory number |
| "Report; leave the account on file" | `resolve_report` ("Report it and leave the account on file") |

### Enhanced synthetic storyline

It is a Friday and the September run closes at 18:00. At 11:00 a message arrives from the officer
commanding the section, in what looks like a thread the learner is already part of: the soldier's salary
account has changed, his old one has been closed by his bank, and the allowance will bounce tonight if it
goes to the account on file. The officer has helpfully filled the change form in already — it is ready to
approve at the link — and adds that the soldier is on a course and out of contact this week, so there is no
point chasing him. Everything about the request is inside the learner's ordinary job.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast: "Maj. A. Iyer" |
| Open | The inbox, with a Pay section folder holding the run deadline and the account-changes reminder |
| Inspect | The 28 Aug message, today's message and its quoted block, the change table, the button; the details sheet; the comparison page |
| Branch | Open the completed form; approve it; or in Payroll, release the run or hold the member out of it; or forward it to the clerk |
| Verify | The member's pay record, the officer on the directory number, the directory |
| Resolve | Report and leave the account on file; or apply the correction |

### Evidence the learner can discover (progressive)

1. The Pay section folder already holds the reminder: a member's account is changed on the member's signed
   request only, "no exceptions for deadlines".
2. The details sheet: SPF and DKIM pass for `e25.training.example` — not the unit's domain — every earlier
   message from this name came from `a.iyer@unit.training.example`, and **In reply to: no earlier message —
   this thread starts here**.
3. The comparison page, side by side: the 28 Aug message was a real reply about leave dates; today's is a
   new message with "Re:" typed in, about a bank account, with a deadline.
4. The Payroll app: the account on file is unchanged since 2024, the requested account arrived by email,
   and there is no member request on file.
5. The Pay records app: one change ever, in March 2024, raised by the member in person with a signed
   request — and no bank closure notice, which is how a closed account is actually reported.
6. The record also holds the member's contact and his status: on the station this week, no course recorded.
7. The officer, on the directory number: he sent nothing, and the soldier is not on a course.

### Learner interaction journey

Notify → open the request → the details sheet → the comparison page → open tonight's run in Payroll → read
the member rows → hold the member out of the run → open the member's pay record → report.

### Simulation surfaces

- `details` (`MAIL`): headers, the missing `In-Reply-To`, authentication, with a comparison page.
- `portal` (`BROWSER`): the prefilled change form and its Approve control.
- `payroll` (`APP`): tonight's run, the member's rows, and the release/hold controls.
- `record` (`APP`): the member's pay record — change history, bank notice, contact and status.
- `call` (`CALL`): the officer on the unit directory number.

### Verification mechanism

`verify_known_app` opens the member's pay record; `verify_known_number` calls the officer on the unit
directory number; `verify_trusted_directory` lists the support desk, and the scene's directory extra names
the officer with the provenance "unit directory, printed and on the intranet". Replying on the thread to
ask him to confirm is `verify_in_message_contact`, worth `0`.

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_sender →
safe_pivot (hold the member out of tonight's run) → verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Approve the prefilled change | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Release tonight's run with the new account | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Open the completed form | `open_link` | `RISKY_OPEN_REPLY` | −3 |
| Forward it to the pay clerk to action | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Apply the correction at the end | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`. The two
`−8` routes are on different surfaces — the prefilled page and the Payroll run — and the engine takes one.
Forwarding submits `reply` and scores `−3`: handing the task to a colleague does not make it somebody
else's decision, and the review says so.

### Why the final simulation stays faithful

Every client element is present: the manager thread, the request to redirect a member's allowance, the
prefilled form with its Approve button, the member's own record as the check, the independent number and
the reporting resolution that leaves the account on file. What the scene adds is the reason the request
slips through — it is somebody else's money, arriving inside the learner's ordinary work, with a deadline
that is real and a "don't chase him" that removes the one person who could refuse it.

---

## 6. Forms, inputs and data handling

**Two screens in this batch accept typing, and both need to.** E23's local page and E24's cloned sign-in
draw a work email and a password, because refusing to type them is the decision those scenes are about.
E22's payment sheet takes a six-digit fund PIN, for the same reason. E21 and E25 have no field anywhere:
their decisions are controls, and `sceneModel.test.js` asserts both facts — which scenes have fields, which
have none, and that every field's kind is one of the five local kinds. The rules every field obeys:

- **Local.** The value lives in `useLocalForm` state inside the component that draws it, and nowhere else.
- **Ephemeral.** Leaving a screen unmounts it; the browser surface is keyed on the page, so walking between
  pages discards what was typed on the previous one by remount rather than by a cleanup we could forget.
- **Never transmitted.** No `fetch`, no `<form>`, no action, no submit event. Each commit control is an
  ordinary button carrying a scene affordance — a neutral id and an optional asset id, nothing else.
- **Never persisted.** No `localStorage`, `sessionStorage`, IndexedDB, cookie or cache holds anything typed
  or chosen on these screens; a reload rebuilds the run from the committed stage.
- **Never logged.** No console output, no analytics, no event payload. The engine's `METADATA_ALLOWLIST`
  rejects any metadata key it does not know, and the ledger never stores an action code or a control id.
- **No autofill surface.** Every field carries `autoComplete="off"` and a neutral `name`; a password is
  `FIELD_KIND.MASKED`, masked by CSS and never `type="password"`, so no browser or password manager
  recognises it or offers to save it.
- **No form submission.** The pages move by local links and a local Continue; only the page-scoped scene
  control reaches the engine, and it is disabled only by incomplete input, never by risk.
- **Deterministic.** The same control always produces the same event; nothing depends on what was typed.
- **Not decorative.** Every screen that shows a release has the control that commits it, because choosing
  it is the decision.

No real credential, card, account number, identity document, payroll record, policy acknowledgement,
audio file, phone call or install exists anywhere in E21–E25.

## 7. What is asserted, and where

| Claim | Test |
| --- | --- |
| Every E21–E25 control resolves to a legal transition on its own pinned definition | `backend/tests/sceneAffordance.test.js` |
| Each safe path scores exactly ten; each pinned unsafe route scores as recorded and reviews as its mistake | `backend/tests/sceneAffordance.test.js` |
| The same routes, stale views, wrong-stage controls, cross-run codes, retries and reloads through a real MongoDB transaction | `backend/tests/emailE21E25Engine.test.js` (isolated DB) |
| E22–E25 never offer `reject_ignore` (E21, legitimate, does) | `backend/tests/sceneAffordance.test.js`, `sceneModel.test.js` |
| No E21–E25 branch shape repeats any of the seventy earlier scenes; each has a decision home no other Email scene shares | `frontend/src/simulation/sceneModel.test.js` |
| E22 alone carries a `voice` beat; E23 alone opens a `file:///` page; only E14 and E24 decide on a code, with different page graphs and safe branches | `frontend/src/simulation/sceneModel.test.js` |
| No disposition, family, trigger, end state, feedback, narrator line or verdict word reaches the device | `frontend/src/simulation/sceneModel.test.js`, `SceneScenariosEmailE.test.jsx` |
| Every host is `*.training.example`; every number is in the reserved range (E22 and E25 military included) | `frontend/src/simulation/sceneModel.test.js` |
| No `href`, `src`, `iframe`, `form`, media element or host handler on any screen — including the audio card | `SceneContainment.test.jsx`, `SceneScenariosEmailE.test.jsx` |
| Six stages end to end; local navigation records nothing; stale resync; lost-response replay; keyboard operation; remount | `frontend/src/pages/SceneScenariosEmailE.test.jsx` |
| This document covers every authored scenario and cites every technique it names | `frontend/src/simulation/sceneResearch.test.js` |

## 8. Findings during verification

1. **E22's scored decision is the payment sheet, not the player.** The client's stage-4 text names "an audio
   player with transfer instructions and a payment mock". The engine takes one branch decision per stage,
   and listening to a message is reading it — so playing the memo and reading its transcript are local and
   score nothing, and the transfer sheet's Confirm is the `−8`. Recorded as a deviation; the stage-4 scoring
   text is unchanged.
2. **One new renderer beat.** `voice` (in `email/MailBlocks.jsx` and `scenes/email/shared.js`) draws an audio
   attachment with a local player, a drawn waveform and the mail app's transcript. It is the batch's only
   renderer addition, it is used by one scene, and no earlier scene's rendering changed.
3. **E25's "attached form" is the linked prefilled page.** The client's stage-2 text says "using an attached
   form" while its stage-4 text says "a prefilled payroll change form and Approve button", and the bank's
   own asset for this scenario is a `browser_page` with no `file` asset. The scene follows stage 4 and the
   asset: the message carries a button that opens the prefilled page. Recorded as a deviation; no bank data
   changed.
4. **Two branch intents that resolve to the same −8.** E23 (sign in / install) and E25 (approve / release)
   are alternatives reached by local navigation, as in E10, E12, E18 and E20.
5. **A forward is a reply to the engine.** Forwarding E25 to the pay clerk submits `reply` and resolves to
   `RISKY_OPEN_REPLY` (−3). No new intent was needed or invented.
6. **E21's link is genuine, deliberately.** It is the only authored scene whose message link points at the
   organisation's own host and is safe to follow, which is why the details sheet shows the link target
   rather than hiding it.
7. **Rejecting E21 reviews as `abandoned_without_checking`, not as a false positive**, unless the learner
   also reports or blocks it — the review service's existing classification, pinned rather than changed.
8. **Recorded, not changed (pre-existing):** one scored decision per stage; consequence banners are
   session-only; the result and review cards show the bank's stored sender (E25's shows "Re"). Browser-play
   totals are in `PROJECT_MASTER_PLAN.md`.
