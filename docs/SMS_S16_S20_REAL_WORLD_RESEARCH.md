# SMS S16–S20 — real-world research and storyline reconstruction

**Task:** IMMERSIVE-013 — the fourth SMS batch
**Naming:** the client's bank numbers every SMS scenario `S01`–`S25` (specification pages 88–112);
this batch is **S16–S20** in the data, the registry, the tests and this document, and it corresponds
to specification **pages 104–108**.
**Scope:** SMS S16, S17, S18, S19, S20 only. WhatsApp W01–W25, Instagram I01–I25, Email E01–E25 and
SMS S01–S15 are complete and unchanged in behaviour; SMS S21–S25 stay on the generic path.
**Status:** design record for the five SMS scenes authored by this task. **IMMERSIVE-013 COMPLETE
(21 September 2026)** — implemented, tested and browser-validated; the validation totals are in
`PROJECT_MASTER_PLAN.md` §16.36.
**Companions:** [`SMS_S01_S05_REAL_WORLD_RESEARCH.md`](SMS_S01_S05_REAL_WORLD_RESEARCH.md),
[`SMS_S06_S10_REAL_WORLD_RESEARCH.md`](SMS_S06_S10_REAL_WORLD_RESEARCH.md) and
[`SMS_S11_S15_REAL_WORLD_RESEARCH.md`](SMS_S11_S15_REAL_WORLD_RESEARCH.md), which use the same method.

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
arrive in one: a genuine sign-in code the learner asked for, printed in the origin-bound format a
phone reads; a "new number" text from someone calling the learner "Mum"; a text that lands inside the
bank's own registered thread, followed by a phone call; a "network survey" that wants the handset's
IMEI, position and model; and a parcel text that turns, three hours later, into a card-fraud desk
with an app to install.

What is deliberately **not** taken is infrastructure, tooling, real brands, real banks, real
couriers, real carriers, real units, real sender IDs, real accounts, real people, real payment rails,
real device identifiers or any real capability. "Training Portal", `VM-TRPRTL`, session TP-4471,
Kabir, Sunil, R DESHMUKH, Training Bank, `AX-TRBANK`, SR TRADERS, TrainNet, `VM-TRNNET`, Unit Falcon
and its communications office, ParcelNet, Harbour Bank, RemoteHelp and SUPPORT-7731 are fictional and
describe nothing real. Every host is `*.training.example`; every phone number is in the reserved
`+91 00000 xxxxx` range (bare numbers in texts are `00000 xxxxx`); the IMEIs start with `00`, the
reporting-body identifier reserved for test handsets. Every list, thread, details screen, app,
dialog, attach sheet, installer, screen-share consent, payment sheet and call is local, inert and
offline. Nothing is fetched, dialled, answered, installed, shared, located, paid or sent.

**Military safety (S19).** S19 is the batch's only military scenario (S11–S15 had two of five; this
batch has one of five), and every entity in it is synthetic. There is no real unit, formation,
establishment, appointment, rank, roster, posting, location, network, carrier, frequency, survey,
schedule or capability anywhere in the scene. "Unit Falcon", its communications office, the "east
gate" a colleague mentions, TrainNet and `VM-TRNNET` are invented; no coordinate appears anywhere;
the form's fields are empty boxes whose contents never leave the component. The behaviour taught —
*a handset's identifier, position and model are not answers to a text* — is generic hygiene.
`sceneModel.test.js` asserts the scene names no rank, formation or operational term and prints no
coordinate.

### 0.2 Source of the threat intelligence

Primary source: **MITRE ATT&CK, website version v19.2** (released 28 April 2026), re-confirmed as the
current version on the live versions page on 21 September 2026
(<https://attack.mitre.org/versions/>, which resolves to `/resources/versions/`; v18.1 ran
28 October 2025 – 27 April 2026, v17.1 before it). Technique pages read live for this batch on
21 September 2026: T1660, T1684.001, T1657, T1566.004, T1598.004, T1592, T1422, T1663, T1513,
T1219 and T1111, and the search result for T1684.002. T1586, T1585, T1598 and T1430 were read live
for earlier SMS batches under the same v19.2 release and are carried forward.

Three readings this batch relies on:

- **T1566.004 and T1598.004 both name callback phishing.** The live Spearphishing Voice pages
  describe messages that instruct a victim to call a number, where the adversary then collects
  information (T1598.004) or directs them to install remote-management tools (T1566.004). That makes
  both **direct** readings of a text-then-call, not approximations.
- **T1663 Remote Access Software is a Mobile technique**, and its live page is about legitimate
  remote-access applications on a handset used as a control channel — but written for
  post-compromise installation, not for a user talked into installing one. It is therefore a
  **partial** fit for S20, stated as such.
- **Email spoofing has moved.** The former top-level `T1672 Email Spoofing` now resolves to
  **T1684.002** (Social Engineering: Email Spoofing), exactly as `T1656 Impersonation` became
  **T1684.001**. Neither covers an SMS sender ID.

Version note carried forward: `T1656 Impersonation` no longer exists as a top-level technique; the
current page is **T1684.001** (Social Engineering: Impersonation, parent T1684).

Secondary sources, for the real-world pattern behind each scenario (landing pages, read 21 September
2026):

- **S16** — the W3C Community Group specification *Origin-bound one-time codes delivered via SMS*
  (<https://wicg.github.io/sms-one-time-codes/>), which defines the `@host #code` last line a phone
  reads to offer a code only to the site it belongs to; UK NCSC guidance on proportionate responses
  to genuine messages (<https://www.ncsc.gov.uk/guidance/phishing>).
- **S17** — the Australian Competition and Consumer Commission's warnings on "Hi Mum" family
  impersonation texts
  (<https://www.accc.gov.au/media-release/accc-warning-of-suspicious-messages-as-hi-mum-scams-spike>);
  US FTC consumer material on family-emergency scams (<https://consumer.ftc.gov/>).
- **S18** — reporting on alphanumeric sender IDs being reused so fake texts land in genuine threads,
  and the resulting sender-ID registers
  (<https://theconversation.com/scammers-can-slip-fake-texts-into-legitimate-sms-threads-will-a-government-crackdown-stop-them-200644>).
- **S19** — UK NCSC guidance on phishing that uses technical pretexts
  (<https://www.ncsc.gov.uk/guidance/phishing>); the ATT&CK Mobile page for T1422, which documents how
  IMEIs are prized by adversaries.
- **S20** — US FTC consumer guidance on tech-support and refund scams that ask for remote access
  (<https://consumer.ftc.gov/articles/how-spot-avoid-and-report-tech-support-scams>).

**Source-confidence note.** Nothing in this document rests on a secondary source for a *behavioural*
claim that ATT&CK is asked to carry. Every ATT&CK citation is linked to its own technique page, and
`sceneResearch.test.js` fails the build if a technique is named without its page. **ATT&CK research
does not affect scoring in any way**: the scores are the bank's, pinned by `sceneAffordance.test.js`.

### 0.3 Interpretation rule

ATT&CK is used as a **behavioural reference, not a checklist**. A mapping is recorded only where the
technique's own description describes what the scenario does, and each is marked **direct**,
**supporting** or **partial**. **S16 has no mapping, and that is stated** — a code for a sign-in the
learner started involves no adversary. Four behaviours in this batch have **no dedicated ATT&CK
technique**, and the sections say so: the **"new number" pretext** built on a phone number rather
than a platform account (S17); **re-use of a registered SMS sender ID** so a text is filed into a
genuine thread (S18); **eliciting a handset's identifiers by asking its owner** rather than by code
on the device (S19); and **a story that changes company within one number's thread** after the victim
replies (S20).

### 0.4 What this document may and may not change

| Thing | May IMMERSIVE-013 change it? |
| --- | --- |
| Scenario IDs, platform, level, disposition, family, trigger, military flag, version | **No** |
| The six stages, their order, their text, expected actions, scoring semantics, feedback | **No** |
| `backend/data/scenarios/v1` and its fingerprint `8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687` | **No** |
| `backend/data/synthetic/v1` and its fingerprint `2779b03939e13cf11e0bee44493609f0c91e228f201f22f8c025a080509afde1` | **No** |
| The engine, the event ledger, the selection algorithm, the 90-minute deadline, the attempt API, the training-feedback review | **No** |
| Scene structure, beats, SMS surfaces, phone UI, the server-side control map | **Yes — this is the whole task** |

**The client scenario remains authoritative** over everything in this document. Where the research
and the client's own stage text disagree, the client's text wins and the disagreement is recorded.

**Difficulty is the bank's.** The task asked for medium difficulty "unless the existing client bank
explicitly requires otherwise". The bank does: S16 and S17 are **Medium**, S18, S19 and S20 are
**Hard** (specification pages 106–108). The levels were not changed.

### 0.5 Content notes carried forward

**Canonical identity.** Every family and trigger is the bank's own, normalised by the existing
canonical taxonomy (`attack-family-taxonomy.v1.json`, `trigger-taxonomy.v1.json`); no identifier was
invented. S16 → `legit_system_confirmation` (`routine`); S17 → `impersonation_emergency_payment`
(`empathy` + `urgency`); S18 → `tech_support_and_callback_fraud` (`trust` + `fear`); S19 →
`operational_elicitation` (`authority` + `helpfulness`, military); S20 →
`tech_support_and_callback_fraud` (`curiosity` + `urgency`). The raw bank strings ("Routine",
"Empathy + urgency", "Trust + fear", "Authority + helpfulness | FICTIONAL MILITARY CONTEXT",
"Curiosity + urgency") stay in the definition's `trigger` field beside `canonical_triggers`.

**Placeholder sender identifiers.** The generator stored S16's sender as the bare mobile
`+91 00000 70760`, which contradicts the client's "established security-code thread". Handled as in
S05, S07 and S12: the scene prints the registered header the stage text requires (`VM-TRPRTL`) as the
thread title and on the toast, and names the bank's sender **asset id** on the inspection control.

**Parsed display name, reassembled.** S18's sender display name is `SECURITY HOLD` and its body starts
"Unusual transfer"; the client's sentence is "SECURITY HOLD: Unusual transfer…". The bubble reassembles
it verbatim inside the bank's registered thread; the stored identifier `+91 00000 53944` becomes the
number that rings. S20's display name `Parcel address failed. Later` is the head of the client's
two-message sentence ("Parcel address failed. Later: Payment fraud detected…"); the scene makes it
what the client describes — a parcel text first, the stored body verbatim later — and the word
"Later" is the passage of time between them.

**The narrator line is not printed.** No `prior_context` sentence is displayed on the device. The
verdict-word list applies to every label, hint and echo; report controls say "Report the message as
junk". S19's `browser_page` asset's narrating `body` is never shown; only `host` and
`display_target` are used. S20's client sentence contains the adversary's own word "fraud"; it is
printed verbatim because it is the adversary's in-world claim, and the batch test measures everything
else the scene prints without it.

**The trigger word is not printed.** None of the five scenes prints its canonical trigger words;
`sceneModel.test.js` asserts it for all five (S16 never says "routine").

**Deliberate overlaps with earlier scenes are recorded, not hidden** — S16 with S03/S07, S17 with
W04/I04, S18 with S01/S12, S19 with S14/I20, S20 with S02/E17/W24. §0.6 states what separates each.

**The result card placeholder** (known limitation carried from earlier scenes) applies to all five.

---

## 0.6 Differentiation from SMS S01–S15, Email E01–E25, WhatsApp W01–W25 and Instagram I01–I25

A comparison against all ninety earlier scenes was made **before** implementation, on story
archetype, attack family, trigger combination, difficulty, branch shape, verification method,
decision home, resolution sequence and psychological lever:

| | Behavioural lesson | Social mechanism | Primary evidence | Decision home | Verification pattern | Unsafe temptation |
| --- | --- | --- | --- | --- | --- | --- |
| **S16** *(legitimate)* | A code is for the screen that asked for it | Wanting to be helpful and safe at once | A registered header that takes no replies; the `@portal.training.example #482193` line; every earlier code within a minute of a sign-in the learner made | **Inside another app** (the portal's code field, with the keyboard's "From Messages" suggestion) and **on the message** | The portal's own Security page; the directory | Forward the code "to be safe"; cancel the learner's own sign-in |
| **S17** | A new number starts under Unknown senders, whoever is using it | Love for a child + a hospital clock | The saved thread under Known senders — his last text 22 minutes earlier, your reply **Delivered**; the payee is an individual | **A saved contact's thread, the app's suggested-reply chip, a composer question and the payment sheet** | Kabir on his saved number; his father on his | Tap "Done"; ask in the new thread; pay R DESHMUKH |
| **S18** | A thread is grouped by name, not by who sent it | The bank's own header + a freeze | The genuine alerts above it name account, amount and reference; this one names nothing; a genuine OTP to add a payee arrives while the phone rings | **The phone's call confirmation, a call that rings, and the menu** | The bank app (no hold, a payee request waiting); the number on the card | Call the number; read out card, PIN and code |
| **S19** *(military)* | A handset's identity is not an answer to a text | A technical request in the unit's name | The phone's own `*#06#` screen says what an IMEI is; the carrier's own thread said no action was needed | **The survey form, the Messages attach-location sheet, a composer reply, the unsaved-sender bar** | The communications office on the directory number; the carrier app | Reply with "just the model"; submit IMEI/place/model; send current location |
| **S20** | A number that changes company after you reply is one story | A parcel you do not expect, then a payment you did not make | One thread, two companies, the learner's own delivered reply between them | **The phone's package installer, its screen-share consent, and the number in the text** | The courier app; the bank app; the number on the card | Call support; install the remote-help app; start screen share |

**What makes these SMS and not the messenger.** The platform grammar S01–S15 established — category
tabs, a header that is often only a number, registered sender IDs, the unsaved-sender bar, link cards,
number cards — plus five things this batch uses for the first time:

- **The origin-bound code line (S16).** The last line of a code text tells the phone which site it is
  for; the keyboard offers it only there. The correct use is taken in the other app.
- **Known and Unknown senders (S17).** The phone's own filter puts a new number in one tab and the
  child in the other; a **delivery report** on the learner's own text is evidence.
- **A registered thread that carries a stranger's text (S18).** The same header, the same SIM, the
  same thread — and a call that rings when the ten minutes are up.
- **The phone producing its own identifiers (S19).** `*#06#` and the Messages attach-location sheet
  are the two places the data comes from.
- **One number's thread across two stories (S20).** The change of company, and the learner's own
  delivered reply that caused it, are on one screen.

**The nearest earlier scenes, and how they differ.**

- **S16, S03 and S07** share family and trigger (`legit_system_confirmation` / `routine`). S03 is a
  transaction alert decided by marking it reviewed; S07 a recharge receipt matched in the provider's
  app. S16 is the first legitimate scene whose object is a **secret**, where the priced mistake is
  **sharing** the genuine item, and whose correct use is taken in **another app's code field**.
- **S17, W04 and I04** share family and triggers (`impersonation_emergency_payment` / `empathy` +
  `urgency`) — the one combination this batch could not avoid, because the bank fixes it. W04 is a
  WhatsApp contact on a new number (profile photo, "last seen"); I04 a cloned Instagram profile with
  followers and stories. S17 uses none of that: its evidence is the **Unknown/Known senders filter**,
  the **saved thread's delivery report**, and a **payee who is neither the child nor a hospital**; its
  safe branch is taken inside the saved thread.
- **S18, S01 and S12** are bank or government impersonations. S01 wrote from a mobile; S12 from a
  promotional header filed under Offers. S18 is the only one that arrives **inside the genuine
  registered thread** (S14's record reserved this mechanism for S18). Its release is on a **call that
  rings**, not on a page.
- **S19, S14 and I20** are elicitation. S14 wanted a live position through the **browser's site
  permission** and an operational form; I20 built rapport for a questionnaire. S19 wants **device
  identity** — IMEI, position and model — produced by the **phone itself** (`*#06#`, the Messages
  attach sheet), and its safe branch is the carrier's own thread from the unsaved-sender bar.
- **S20, S02, E17 and W24** are callback / remote-support scams. S02's decisions were on a call; E17's
  in a desktop dial dialog; W24's on a WhatsApp call and its screen-share sheet. S20 is the only
  **multi-stage** one — a courier turning into a card desk in one number's thread after the learner's
  own reply — and its releases are the **operating system's installer and screen-share consent**,
  reached from the thread without calling.

**Differentiation, asserted.** `sceneModel.test.js` asserts that **none of S16–S20 repeats a
branch-stage shape of any of the ninety earlier scenes, or of each other**; that **each of the twenty
SMS scenes has a decision home no other SMS scene shares**; that the five safe branches sit in five
different places; that every scored branch surface **and page** is reachable without spending the
branch; and the per-scene properties listed in §7.

---

## 1. S16 — Learner-Initiated Login Code

### Client scenario (authoritative)

Specification page 104. SMS, **Medium**, **Legitimate**, family *Legitimate OTP / security code*,
trigger *Routine*. Canonical identity: family `legit_system_confirmation`, trigger `routine`,
military flag **false**, level `medium`.

- **Stage 1 (Event).** "Your TRAINING PORTAL code is 482193. Do not share it. Expires in 5 minutes."
- **Stage 2 (Open).** The established security-code thread; the learner has just initiated a login in
  the synthetic official app.
- **Stage 3 (Inspect).** Service name, timing, no links, warning text and matching login session.
  Decision signal: *the code is expected and should be entered only into the session the learner
  initiated, never sent to another person.*
- **Stage 4 (Branch).** The already-open official-app code field with matching session ID.
- **Stage 5 (Verify).** Compare the service/session in the official app and SMS; no outside contact
  is needed; do not report or block a legitimate sender.
- **Stage 6 (Resolve).** Enter the code only in the matching official-app mock; retain no screenshot;
  do not report the SMS.

### MITRE ATT&CK alignment

**There is none, and none has been invented.** ATT&CK catalogues adversary behaviour. The item under
assessment is a genuine sign-in code, from the portal's own registered sender, for a sign-in the
learner started fifteen seconds earlier on the same phone. There is no adversary, campaign,
infrastructure or technique.

**Closest defensible behavioural reference.** What S16 prices is the learner's own reaction to a
genuine secret — forwarding it, and cancelling a sign-in they started. The reference material is
defensive and standards-based: the W3C Community Group's origin-bound one-time-code format, which
exists so a phone can offer a code only to the site it belongs to, and NCSC's guidance on
proportionate responses; both are cited in §0.2. No adversary behaviour is claimed and no identifier
appears in this section.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | List row preview and the code bubble; the toast carries `VM-TRPRTL` |
| "Established security-code thread" | Two earlier portal codes (02 and 14 September) above today's |
| "Service name, timing, no links, warning text" | The details screen: registered to Training Portal, three messages, no address in any |
| "Matching login session" | The details screen's code-to-sign-in page; the portal app's Session TP-4471 started 14:48 |
| "Already-open official-app code field" | The Training Portal app, open on the code field, with the keyboard's "From Messages" suggestion |
| "Never sent to another person" | Forwarding the text to the IT help desk is priced (`−4`) |
| "Needless reject/ignore −2" | "Not now — cancel this sign-in", inside the app |
| "Do not report or block a legitimate sender" | Report and block at verify are `−4`; report, block and ignore at resolve are `−4` |
| "Retain no screenshot" | The thread says codes are deleted automatically after 24 hours; nothing offers a screenshot |

### Enhanced synthetic storyline

At 14:48 the learner opens Training Portal on their phone and presses "Send code". At 14:49 the code
arrives from `VM-TRPRTL`, in the thread where the 2 and 14 September codes arrived, each within a
minute of a sign-in. The last line reads `@portal.training.example #482193`. The Messages app says
this sender takes no replies. Back in the portal, the keyboard offers "From Messages: 482193".

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast from `VM-TRPRTL` |
| Open | The list, OTPs tab first, with Personal, Transactions and Spam |
| Inspect | The thread with three codes; the details screen; the codes-and-sign-ins page; today's message details |
| Branch | Fill the code in the portal; cancel the sign-in in the portal; forward the text; the portal is free to open |
| Verify | The portal's Security page, the directory — or the in-message address and report/block mistakes |
| Resolve | Finish signing in / keep the thread; or report, block, ignore |

### Evidence the learner can discover (progressive)

1. No unsaved-sender bar; "You can't reply to this sender. It sends codes only."
2. The code line names `portal.training.example`.
3. The details screen: registered header, registered to Training Portal, no addresses ever.
4. The codes page: each earlier code arrived within a minute of the learner's own sign-in.
5. The portal: Session TP-4471, started 14:48 on this phone, code expires 14:54.
6. The Security page: one sign-in waiting — this phone — and "we never ask anyone to be told a code".

### Learner interaction journey

Notify → open the code message → header → details → codes from this sender → back → switch back to
the Training Portal app (free) → Fill 482193 from Messages → open Security and compare → finish
signing in.

### Simulation surfaces

- `details` (`SMS`): conversation details, codes-and-sign-ins page, today's message details.
- `portal` (`APP`): the Training Portal sign-in screen — the decision home.
- `security` (`APP`): Training Portal's sign-in activity.

### Verification mechanism

`verify_known_app` opens the portal's Security page; `verify_trusted_directory` opens the directory.
Looking up the help address the code line names is `verify_in_message_contact` (0). Report and block
are `FALSE_REPORT_BLOCK` (−4).

### Safe resolution

`resolve_continue` or `resolve_retain`, `+2`. Full safe path: `open_item → read → inspect_sender →
safe_pivot (fill from Messages) → verify_known_app → resolve_continue` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Forward the code text to the IT help desk | `share_secret` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Cancel the sign-in in the app | `reject_ignore` | `NEEDLESS_REJECT_IGNORE` | −2 |
| Report or block at verify | `report` / `block` | `FALSE_REPORT_BLOCK` | −4 |
| Report, block or ignore at resolve | `resolve_report` / `resolve_block` / `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |
| Copy the code from the list before reading | `submit_data` (open) | `PREMATURE_REPLY` | −1 |

### Scoring / event mapping (unchanged)

Stage 4 declares `CORRECT_USE +3`, `NEEDLESS_REJECT_IGNORE −2`, `UNSAFE_EXTERNAL_ACTION −4`. Filling
the code is `safe_pivot`, which the engine resolves to `CORRECT_USE` on a legitimate item; forwarding
is `share_secret`, which resolves to `UNSAFE_EXTERNAL_ACTION` because the scenario declares no release
code. Pinned: forward route **3**, cancel route **5**, false-report route **0**.

### Why the final simulation stays faithful

Every client element is present: the verbatim code, the established thread, the matching session, the
warning text, no links, the already-open official-app field, verification in the official app, and a
resolution that uses the code once and reports nothing. What the scene adds is how a phone actually
binds a code to the site that asked for it — and the one well-meant mistake that breaks it.

---

## 2. S17 — New-Phone Family Emergency

### Client scenario (authoritative)

Specification page 105. SMS, **Medium**, **Malicious**, family *Known-person impersonation /
emergency payment*, trigger *Empathy + urgency*. Canonical identity: family
`impersonation_emergency_payment`, triggers `empathy` + `urgency`, military flag **false**, level
`medium`.

- **Stage 1 (Event).** "Mum, this is my new number. Phone broke. Please send INR 15,000 to the hospital now."
- **Stage 2 (Open).** The unsaved emergency thread.
- **Stage 3 (Inspect).** Unknown number, generic relationship cue, urgent payment and third-party
  payee. Decision signal: *the relationship claim is unverified and the payment recipient does not
  match the supposed family member.*
- **Stage 4 (Branch).** A payment request plus quick reply "Done".
- **Stage 5 (Verify).** Call the family member's known old number or another trusted family contact.
- **Stage 6 (Resolve).** Decline; report junk/block after impersonation is confirmed.

### MITRE ATT&CK alignment

| Technique | Fit | Why this maps |
| --- | --- | --- |
| [T1660 Phishing (Mobile)](https://attack.mitre.org/techniques/T1660/) | **Direct** | The live page names SMS ("smishing") delivered to a handset to make the target act. |
| [T1684.001 Social Engineering: Impersonation](https://attack.mitre.org/techniques/T1684/001/) | **Direct** | The sender poses as a trusted person — the learner's child — to persuade them to act. |
| [T1657 Financial Theft](https://attack.mitre.org/techniques/T1657/) | **Direct** | Impersonation used to have the victim send money to an account the adversary controls. |
| [T1585 Establish Accounts](https://attack.mitre.org/techniques/T1585/) | **Partial fit, stated** | A fresh identity is set up for the pretext — but it is a phone number, which the technique's account types do not name. |

**The gap, stated.** ATT&CK has no technique for the **"new number" pretext** — a relationship claimed
from a number the victim has never seen, which the phone itself files under Unknown senders.

**Considered and rejected.**

- [T1586 Compromise Accounts](https://attack.mitre.org/techniques/T1586/) — the child's number and
  phone are untouched; nothing is compromised, which is exactly why the saved thread still works.
- [T1534 Internal Spearphishing](https://attack.mitre.org/techniques/T1534/) — needs a compromised
  internal account; there is none.

**What must NOT be copied.** No real person, family, hospital, payment handle, bank or UPI provider;
no real phone number; no method of obtaining a victim's family details. The payee and handle are
invented and inert.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | Row preview and the first bubble |
| "Unsaved emergency thread" | Unknown senders tab; the unsaved-sender bar; first message ever from the number |
| "Generic relationship cue" | Details: "Name used: None — only 'Mum'" |
| "Third-party payee" | The payment card and sheet: R DESHMUKH, an individual — not Kabir, not a hospital |
| "Payment request plus quick reply 'Done'" | The payment card's "Pay with UPI" → payment sheet; the app's "Done" suggestion chip |
| "Do not verify only in the new-number thread" | Asking "which hospital?" in the thread is priced (`−3`) |
| "Known old number or another trusted family contact" | `verify_known_number` → Kabir; → Sunil |
| "Decline; report/block after confirmed" | Resolve report and block; "send the money if he texts again" is the contradictory final |

### Enhanced synthetic storyline

The learner is Kabir's mother. At 16:31 Kabir texted from his saved number that practice was over and
he was going to Rahul's; at 16:32 she replied, and the phone shows it Delivered. At 16:53 an unsaved
number writes "Mum, this is my new number…", then asks her not to call because it is a nurse's phone,
gives a payee, R DESHMUKH, and asks her to reply Done. At 16:58 it chases.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast from the new number |
| Open | The list, Unknown senders first; Known senders holds Kabir |
| Inspect | The thread; details; Kabir's saved thread |
| Branch | Done chip; ask in the thread; pay; or stay with the saved number |
| Verify | Call Kabir or Sunil on saved numbers; directory; call the new number back |
| Resolve | Report / block; or send the money / do nothing |

### Evidence the learner can discover (progressive)

1. The Unknown senders tab and the unsaved-sender bar.
2. Details: no name, only "Mum"; money to an individual; asked not to call.
3. Kabir's saved thread: 16:31 from his phone; 16:32 Delivered.
4. The payment sheet: R DESHMUKH, not in contacts, never paid before.
5. Kabir on his number: phone in his hand, at Rahul's.

### Learner interaction journey

Notify → open → details → Kabir's saved conversation → back → keep to Kabir's saved number → call
Kabir on his saved number → report the number as junk.

### Simulation surfaces

- `details`, `kabir` (`SMS`); `upi` (`PAYSHEET`); `kabircall`, `suniltcall` (`CALL`).

### Verification mechanism

`verify_known_number` calls Kabir or Sunil on saved numbers; `verify_trusted_directory` opens the
directory. Calling the new number back is `verify_in_message_contact` (0).

### Safe resolution

`resolve_report` / `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_sender →
safe_pivot → verify_known_number → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Tap the suggested "Done" | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Ask which hospital in the thread | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Pay INR 15,000 on the payment sheet | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Send the money later, at resolve | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`. The
payment sheet is opened by a local control on the payment card, and the saved thread by a local menu
item, so neither is behind another scored control. Pinned: reply routes **4**, payment route **0**.

### Why the final simulation stays faithful

New number, broken-phone story, hospital, INR 15,000, a third-party payee, a "Done" quick reply,
verification on the known old number and another family member, and a report: all present. The scene
adds how the phone itself separates known from unknown senders.

---

## 3. S18 — Bank Header Thread Hijack

### Client scenario (authoritative)

Specification page 106. SMS, **Hard**, **Malicious**, family *Sender-ID spoofing / callback
phishing*, trigger *Trust + fear*. Canonical identity: family `tech_support_and_callback_fraud`,
triggers `trust` + `fear`, military flag **false**, level `hard`.

- **Stage 1 (Event).** "SECURITY HOLD: Unusual transfer. Call 00000 41818 in 10 minutes to prevent account freeze."
- **Stage 2 (Open).** The established-looking bank thread.
- **Stage 3 (Inspect).** Wording, supplied number, absence of transaction detail, official-app
  status. Decision signal: *thread placement or sender ID is not proof; the callback number is
  controlled by the message.*
- **Stage 4 (Branch).** A call-confirmation sheet leading to a synthetic operator requesting card/PIN/OTP.
- **Stage 5 (Verify).** Open the known banking app and call the number printed on the card.
- **Stage 6 (Resolve).** Do not call; report junk if confirmed; secure the account through known channels.

### MITRE ATT&CK alignment

| Technique | Fit | Why this maps |
| --- | --- | --- |
| [T1660 Phishing (Mobile)](https://attack.mitre.org/techniques/T1660/) | **Direct** | A text to a handset; the live page also notes manipulated message metadata. |
| [T1598.004 Phishing for Information: Spearphishing Voice](https://attack.mitre.org/techniques/T1598/004/) | **Direct** | The live page names callback phishing and calls that collect confidential information — here the card, PIN and OTP. |
| [T1684.001 Social Engineering: Impersonation](https://attack.mitre.org/techniques/T1684/001/) | **Direct** | The bank's own header and the "security desk" impersonate a trusted organisation. |
| [T1657 Financial Theft](https://attack.mitre.org/techniques/T1657/) | **Supporting** | The OTP adds a payee — the step before money leaves. |
| [T1566.004 Phishing: Spearphishing Voice](https://attack.mitre.org/techniques/T1566/004/) | **Partial fit, stated** | Same callback mechanism, but its object is system access, not a bank secret. |

**The gap, stated.** ATT&CK has no technique for **re-using a registered SMS sender ID** so a text is
filed into the genuine thread. That filing — by name, not by origin — is S18's primary evidence.

**Considered and rejected.**

- [T1684.002 Social Engineering: Email Spoofing](https://attack.mitre.org/techniques/T1684/002/)
  (formerly [T1672](https://attack.mitre.org/techniques/T1672/), which now resolves to it) — email
  headers only; an SMS sender ID is not an email header.
- [T1111 Multi-Factor Authentication Interception](https://attack.mitre.org/techniques/T1111/) —
  technical interception; here the learner is asked to read the code aloud.

**What must NOT be copied.** No real bank, header, account format, card number, helpline, SMS gateway
or method of sending under another's sender ID. The header, the numbers and the OTP are invented.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | Reassembled as `SECURITY HOLD: …` in the bubble and row preview |
| "Established-looking bank thread" | `AX-TRBANK` with genuine alerts of 12 and 18 September |
| "Absence of transaction detail" | The compare page: no account, amount or reference |
| "Thread placement or sender ID is not proof" | Details: grouped "by the sender name a text arrives with" |
| "Call-confirmation sheet" | The phone's dial dialog, where "Call" is priced (`−3`) |
| "Synthetic operator requesting card/PIN/OTP" | The desk on the number, and the call that rings from `+91 00000 53944` |
| "Known banking app; number printed on the card" | `verify_known_app`; `verify_known_number` |
| "Report junk; secure through known channels" | Resolve: report and decline the payee in the app |

### Enhanced synthetic storyline

The thread holds six months of Training Bank alerts, each with the account, amount and reference.
At 11:41 the SECURITY HOLD text arrives in it. At the branch the phone rings from an unsaved mobile —
the "security desk" calling because the learner did not — while a genuine OTP arrives above it:
"739104 is the OTP to add payee SR TRADERS… Do not share it with anyone, including bank staff."

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast from `AX-TRBANK` |
| Open | Transactions tab first |
| Inspect | The thread; details; the compare page |
| Branch | Dial dialog; the ringing call; or the bank app from the menu |
| Verify | Bank app; the number on the card; directory; calling the text's number back |
| Resolve | Report / block; or call before the ten minutes are up |

### Evidence the learner can discover (progressive)

1. Genuine alerts above: account, amount, reference, "use the app or the number on your card".
2. Details: registered header; grouping by name; no number to call in the bank's alerts.
3. The compare page: same sender line, different content.
4. The OTP arriving during the call names what it authorises: a new payee.
5. The bank app: no hold; one request open — the payee — not started by the learner.

### Learner interaction journey

Notify → open → compare with the earlier alerts → back → answer the ringing call (free) → Hang up →
call the number printed on the card (the bank app is one tap away in the menu) → report and decline
the payee.

### Simulation surfaces

- `details` (`SMS`, two pages); `dial` (`INSTALLER`); `desk`, `incoming`, `cardcall` (`CALL`);
  `bankapp` (`APP`).

### Verification mechanism

`verify_known_app` opens the bank app; `verify_known_number` calls the number on the card;
`verify_trusted_directory` opens the directory. Calling the text's number back is
`verify_in_message_contact` (0).

### Safe resolution

`resolve_report` / `resolve_block`, `+2`. Full safe path: `open_item → read → read_thread →
safe_pivot (hang up) → verify_known_number → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Call on the dial confirmation | `call_number` | `RISKY_OPEN_REPLY` | −3 |
| Read out card number, PIN and code on the call | `share_secret` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Call from the list before reading | `call_number` (open) | `PREMATURE_REPLY` | −1 |
| Call before the ten minutes are up, at resolve | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`. The
ringing call is answered by a local control, so the `−8` on it is never behind the `−3` on the dial
dialog. While the call carries scored controls, its local End call steps aside (`endCallScored`), so
hanging up is the scored safe branch rather than an unscored duplicate.

### Why the final simulation stays faithful

A text in the real bank thread, a supplied number, no transaction detail, a call confirmation, an
operator asking for card, PIN and OTP, and verification in the app and on the card number: all
present. The incoming call uses the bank's own `call_screen` asset (an "Incoming call" from the
stored identifier).

---

## 4. S19 — Network Survey Requests IMEI

### Client scenario (authoritative)

Specification page 107. SMS, **Hard**, **Malicious**, family *Military-targeted technical pretext /
device profiling*, trigger *Authority + helpfulness | FICTIONAL MILITARY CONTEXT*. Canonical
identity: family `operational_elicitation`, triggers `authority` + `helpfulness`, military flag
**true**, level `hard`.

- **Stage 1 (Event).** "Priority network survey for Unit Falcon area. Reply IMEI + location + device model."
- **Stage 2 (Open).** The technical survey thread.
- **Stage 3 (Inspect).** Unknown sender, targeted military reference, excessive device/location data
  and reply request.
- **Stage 4 (Branch).** A structured reply form with IMEI, GPS and device fields.
- **Stage 5 (Verify).** Contact approved communications/IT staff and the carrier through known channels.
- **Stage 6 (Resolve).** Send nothing; report through unit security; block.

### MITRE ATT&CK alignment

| Technique | Fit | Why this maps |
| --- | --- | --- |
| [T1660 Phishing (Mobile)](https://attack.mitre.org/techniques/T1660/) | **Direct** | A text to the handset asking the target to act. |
| [T1598 Phishing for Information](https://attack.mitre.org/techniques/T1598/) | **Direct** | A message that elicits information for targeting. |
| [T1592.001 Gather Victim Host Information: Hardware](https://attack.mitre.org/techniques/T1592/001/) | **Direct** | The live parent page names gathering host details via Phishing for Information; IMEI and model are the handset's hardware identity. |
| [T1591 Gather Victim Org Information](https://attack.mitre.org/techniques/T1591/) | **Partial fit, stated** | Tying a handset and position to "the Unit Falcon area" associates it with an organisation, but no org data is asked for. |

**The gap, stated.** ATT&CK has no technique for **eliciting a handset's identifiers from its owner by
message**; its Mobile identifier techniques are all behaviour of code on the device.

**Considered and rejected.**

- [T1422 System Network Configuration Discovery](https://attack.mitre.org/techniques/T1422/) — the
  live page is built around IMEI collection, but by malicious applications on the device.
- [T1430 Location Tracking](https://attack.mitre.org/techniques/T1430/) — OS location APIs called by
  an installed app; here a person attaches a location.

**What must NOT be copied.** No real unit, formation, establishment, appointment, rank, carrier,
network, frequency, coordinate, IMEI range or survey. No real unit, formation, establishment,
appointment, rank or location appears; the IMEIs use the `00` test prefix and no coordinate is drawn.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | Row preview and first bubble |
| "Technical survey thread" | Three texts, a quick-form link, a chaser at the branch |
| "Unknown sender, targeted military reference" | Unsaved mobile; "Unit Falcon area"; details name no office, person or reference |
| "Excessive device/location data" | Details: "Asked for — IMEI, current location and handset model" |
| "Structured reply form with IMEI, GPS and device fields" | The survey form (IMEI, where the phone is, model) and the attach-location sheet |
| "Approved communications/IT staff and the carrier" | `verify_known_number` → communications office; `verify_known_app` → carrier app |
| "Send nothing; report through unit security; block" | Resolve report and block |

### Enhanced synthetic storyline

A colleague complained at 14:40 about the signal near the east gate. At 15:55 an unsaved number asks
for a priority survey, tells the learner to dial `*#06#`, and threatens to leave the area off the
upgrade list. The carrier's own thread said on 16 September that work nearby was complete and no
action was needed.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast from the number |
| Open | The list; Updates holds the carrier |
| Inspect | Thread; details; link details |
| Branch | Reply with the model; the form; attach location; `*#06#`; or the carrier thread from the bar |
| Verify | Communications office; carrier app; directory |
| Resolve | Report through unit security; or answer before 18:00 |

### Evidence the learner can discover (progressive)

1. The unsaved-sender bar.
2. Details: the carrier writes as `VM-TRNNET`; three identifying items asked for.
3. Link details: the host is not the carrier's site.
4. `*#06#`: an IMEI is permanent to the handset.
5. The carrier's thread and app: no survey; never asks for IMEI or location.

### Learner interaction journey

Notify → open → header → details → back → send nothing and read the carrier's messages → call the
communications office → report through unit security.

### Simulation surfaces

- `details`, `linkinfo`, `carrier` (`SMS`); `imei`, `attach` (`INSTALLER`); `survey` (`BROWSER`);
  `carrierapp` (`APP`); `commscall` (`CALL`).

### Verification mechanism

`verify_known_number` calls the communications office; `verify_known_app` opens the carrier app;
`verify_trusted_directory` opens the directory. Replying to ask which office is
`verify_in_message_contact` (0).

### Safe resolution

`resolve_report` / `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_sender →
safe_pivot → verify_known_number → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Reply with just the model | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Submit IMEI, place and model on the form | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Send current location from the attach sheet | `share_location` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Answer before 18:00, at resolve | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`. The
form is opened from the link card by a local control and the attach sheet from the menu, so neither
`−8` is behind the `−3`.

### Why the final simulation stays faithful

Unknown sender, a unit-area reference, IMEI + location + model, a structured form, and verification
with the communications office and the carrier: all present. The scene adds where on a phone each of
those three things actually comes from.

---

## 5. S20 — Parcel Text Plus Callback

### Client scenario (authoritative)

Specification page 108. SMS, **Hard**, **Malicious**, family *Multi-stage parcel / callback / remote
access scam*, trigger *Curiosity + urgency*. Canonical identity: family
`tech_support_and_callback_fraud`, triggers `curiosity` + `urgency`, military flag **false**, level
`hard`.

- **Stage 1 (Event).** "Parcel address failed. Later: Payment fraud detected - call support immediately."
- **Stage 2 (Open).** The two-stage parcel thread.
- **Stage 3 (Inspect).** Unknown parcel, link/callback controlled by sender, escalating story and
  requested tools.
- **Stage 4 (Branch).** A call mock where "support" asks for screen share and a remote-help app.
- **Stage 5 (Verify).** Check the known courier account and bank statement independently.
- **Stage 6 (Resolve).** Do not engage; report junk/block.

### MITRE ATT&CK alignment

| Technique | Fit | Why this maps |
| --- | --- | --- |
| [T1660 Phishing (Mobile)](https://attack.mitre.org/techniques/T1660/) | **Direct** | Two texts to a handset, one with a link and one with a number. |
| [T1566.004 Phishing: Spearphishing Voice](https://attack.mitre.org/techniques/T1566/004/) | **Direct** | The live page describes messages that tell victims to call a number where they are told to install remote-management tools. |
| [T1663 Remote Access Software](https://attack.mitre.org/techniques/T1663/) | **Partial fit, stated** | A Mobile technique for legitimate remote-access apps used as a control channel — but written for post-compromise installation, not a user talked into it. |
| [T1657 Financial Theft](https://attack.mitre.org/techniques/T1657/) | **Supporting** | The "reversal" is the pretext for reaching money through the shared screen. |

**The gap, stated.** ATT&CK has no technique for **a story that changes company within one number's
thread** after the victim replies — the escalation that is S20's lesson.

**Considered and rejected.**

- [T1513 Screen Capture](https://attack.mitre.org/techniques/T1513/) — malicious apps capturing the
  screen; here the operating system asks the user to share it.
- [T1219 Remote Access Tools](https://attack.mitre.org/techniques/T1219/) — the Enterprise form, for
  command and control inside a network.

**What must NOT be copied.** No real courier, bank, remote-access product, device name or tracking
format; no installable package. RemoteHelp and SUPPORT-7731 are invented; no file exists.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence | The morning text starts "Parcel address failed."; the stored body is the 16:01 bubble verbatim |
| "Two-stage parcel thread" | 10:43 parcel, 10:50 the learner's delivered reply, 16:01 card desk |
| "Link/callback controlled by sender" | Address link, support number, app link — all in the texts |
| "Escalating story and requested tools" | Details: "A courier in the morning, a bank in the afternoon"; install and screen share |
| "Call mock: screen share and remote-help app" | The support call; the installer and the screen-share consent it pushes to |
| "Known courier account and bank statement" | `verify_known_app` → courier app, bank app; `verify_known_number` → card |
| "Do not engage; report/block" | Resolve report and block; "finish the reversal" is the contradictory final |

### Enhanced synthetic storyline

At 10:43 a parcel is on hold. At 10:50 the learner replies that they expect nothing — delivered. At
16:01 the same number reports a card payment of INR 24,999 "when the parcel fee was paid", gives a
support line, then asks the learner to install RemoteHelp and, when asked, share their screen with
SUPPORT-7731.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast from the number |
| Open | Personal tab ("conversations you have replied to") |
| Inspect | Thread; details |
| Branch | Call support; install; start sharing; or open the courier app |
| Verify | Courier app; bank app; card number; directory |
| Resolve | Report and install nothing; or finish the reversal |

### Evidence the learner can discover (progressive)

1. One thread, three hours, two companies.
2. The learner's own reply, delivered, between them.
3. The installer: the app would read texts, including codes, and control the screen.
4. The screen-share consent: codes that arrive while sharing are visible.
5. Courier app: nothing on the way; bank app: no such payment.

### Learner interaction journey

Notify → open → read back to the morning → details → back → stop and open the courier app → call the
bank on the card number → report both texts.

### Simulation surfaces

- `details` (`SMS`); `helper`, `cast` (`INSTALLER`); `support`, `cardcall` (`CALL`); `courier`,
  `bankapp` (`APP`).

### Verification mechanism

`verify_known_app` opens the courier app or the bank app; `verify_known_number` calls the card number;
`verify_trusted_directory` opens the directory. Calling the support line for a reference is
`verify_in_message_contact` (0).

### Safe resolution

`resolve_report` / `resolve_block`, `+2`. Full safe path: `open_item → read → read_thread →
safe_pivot → verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Call support from the number | `call_number` | `RISKY_OPEN_REPLY` | −3 |
| Install RemoteHelp | `attempt_install` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Start sharing the screen | `share_secret` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Finish the reversal, at resolve | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.
The installer opens from the app link and the screen-share consent from quick settings, both local,
so neither `−8` is behind the call's `−3`. Screen sharing uses `share_secret`, as W24 and I22 do.

### Why the final simulation stays faithful

A parcel text, a later fraud warning with a support number, a call asking for screen share and a
remote-help app, and independent checks with the courier and the bank: all present. The scene adds
the learner's own reply as the hinge of the escalation.

---

## 6. Forms, inputs and data handling

**Two of the five scenes accept typing, each because the screen is about refusing to.** S17's payment
sheet takes a UPI PIN; S19's survey form takes an IMEI, a place and a model. **S16, S18 and S20 have
no field anywhere** — their releases are forwarding, reading aloud, installing and sharing. The rules
every field obeys:

- **Local.** The value lives in `useLocalForm` state inside the component that draws it.
- **Ephemeral.** Leaving a screen unmounts it; browser pages are keyed on the page.
- **Never transmitted.** No `fetch`, no `<form>`, no submit event. Each commit control carries only a
  neutral id and an optional asset id.
- **Never persisted.** No `localStorage`, `sessionStorage`, IndexedDB, cookie or cache holds anything
  typed.
- **Never logged.** No console output or event payload; the engine's `METADATA_ALLOWLIST` rejects any
  unknown metadata key, and the ledger stores no action code or control id.
- **No autofill surface.** `autoComplete="off"` and neutral names; the PIN is `FIELD_KIND.SECRET`,
  masked by CSS, never `type="password"`.
- **No form submission.** Pages move by local links; only the page-scoped scene control reaches the
  engine, disabled only by incomplete input, never by risk.
- **Deterministic.** The same control always produces the same event.
- **Not decorative.** Every screen that shows a release has the control that commits it.

No real credential, card, account, OTP, PIN, IMEI, location, payment or device detail exists anywhere
in S16–S20.

## 7. What is asserted, and where

| Claim | Test |
| --- | --- |
| Every S16–S20 control resolves to a legal transition on its own pinned definition; safe paths score ten; unsafe routes score as recorded; canonical identity pinned | `backend/tests/sceneAffordance.test.js` |
| The same routes, premature acts, stale views, wrong-stage controls, cross-run codes, retries and reloads through a real MongoDB transaction; intent/points/metadata injection and cross-run codes over real HTTP | `backend/tests/smsS16S20Engine.test.js` (isolated DB) |
| No S16–S20 branch shape repeats any of the ninety earlier scenes; each of the twenty SMS scenes has a unique decision home; five different safe-branch homes | `frontend/src/simulation/sceneModel.test.js` |
| Every scored branch surface **and page** is reachable without spending the branch | `sceneModel.test.js`, `SceneScenariosSmsD.test.jsx` |
| S19 names no rank, formation, operational term or coordinate; no scene prints its trigger words | `sceneModel.test.js` |
| Only S16 offers `reject_ignore` | `sceneModel.test.js`, `sceneAffordance.test.js` |
| Nothing typed reaches the wire or storage; no `href`, `src`, `iframe`, `form` or media element | `SceneScenariosSmsD.test.jsx`, `SceneContainment.test.jsx` |
| This document covers every authored scenario and cites every technique it names | `sceneResearch.test.js` |

## 8. Findings during verification

1. **A system line cannot carry a control.** S18's incoming call was first a `system` beat with an
   "Answer" control anchored to it; the SMS renderer draws system lines without controls, so it would
   have been unreachable. Caught before any test run and changed to a number card, which draws them.
2. **A registered sender takes no replies.** S16's first draft priced "reply with the code"; a
   business sender ID cannot receive a reply, so that control would have been unrealistic. It was
   replaced by forwarding the text, and the thread now says so.
3. **S18's `−8` is reachable without the `−3`.** Calling from the dial confirmation (`−3`) leads to the
   desk; the release is on the call that rings, answered by a local control — the IMMERSIVE-009 rule.
4. **Found by hand-play and fixed — captions moved the call's controls.** On the live S18 call a
   caption arriving at 00:17 pushed the controls down between aiming and clicking, and a click meant
   for "Hang up" landed on the release (recorded in the isolated database as that learner's S18
   critical outcome). The shared `CallSurface` now keeps captions in a fixed-height, focusable log that
   scrolls itself to the newest line; the next browser run sampled the Hang up control once a second
   while all four captions arrived and it never moved (one position across 21 samples).
   `SceneScenariosSmsD.test.jsx` asserts the log's fixed height, focusability and order. Every call
   scene in the product benefits; no scoring changed.
5. **Found by hand-play and fixed — Back walked into a finished call.** S18's safe branch first opened
   the bank app on top of the call, so Back from the app returned to the call, which rang again. Hang
   up now closes the call; the bank app is in the menu and at Verify.
6. **Recorded, not changed (pre-existing):** `current-run` sends the bank's generic stage description
   (`scenario.stages`, identical transition labels for all one hundred scenarios); after a run is
   terminal the response carries its final score and the learner's own resolution; one scored
   decision per stage; consequence banners are session-only; result cards show the bank's stored
   sender.
