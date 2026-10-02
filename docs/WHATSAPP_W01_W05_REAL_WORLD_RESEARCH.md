# WhatsApp W01–W05 — real-world research and storyline reconstruction

**Task:** IMMERSIVE-003A-R2
**Scope:** WhatsApp W01, W02, W03, W04, W05 only. W06–W25, Instagram, Email and SMS are untouched.
**Status:** design record for the R2 rebuild of the five authored scenes.

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
working kits, real brands, real numbers or anything operational. Every host in the product
is `*.training.example`; every number is in the reserved `+91 00000 xxxxx` range; every
page, form, call and app screen is local, inert and offline.

### 0.2 Source of the threat intelligence

Primary source: **MITRE ATT&CK, Enterprise and Mobile matrices, website version v19.2**
(current release, 28 April 2026 — <https://attack.mitre.org/versions/>). Every technique
below was read from the live technique page rather than recalled, and the ID, tactic,
technique version and last-modified date are recorded so a later reviewer can check the
same page.

One version note matters for anyone re-reading older notes: **T1656 Impersonation no longer
exists as a top-level technique.** `https://attack.mitre.org/techniques/T1656/` now resolves
to **T1684.001 Social Engineering: Impersonation**, a sub-technique of the new **T1684
Social Engineering** technique (created 14 April 2026, last modified 12 May 2026, Stealth
tactic). Anything that still cites T1656 should be read as T1684.001.

### 0.3 Interpretation rule

ATT&CK is a behavioural knowledge base for **adversary** behaviour. It is not a scenario
catalogue, and there is no obligation for a client scenario to have a one-to-one technique.
Each mapping below therefore records:

- the closest technique and sub-technique,
- genuinely applicable supporting techniques,
- **why** the behaviour maps,
- what must **not** be copied into the product,
- and, where there is no meaningful mapping, an explicit statement that there is none.

**W03 has no ATT&CK mapping and none has been invented for it.** See section 3.

**The client scenario remains authoritative.** MITRE research informs realism; it does not
override the specification. Wherever the two could be read as disagreeing, the client's stage
text wins and the disagreement is recorded (sections 3 and 4 both carry one).

### 0.4 What this document may and may not change

| Thing | May R2 change it? |
| --- | --- |
| Scenario IDs, platform, level, disposition, family, trigger, military flag, version | **No** |
| The six stages, their order, their text, expected actions, scoring semantics, feedback | **No** |
| `backend/data/scenarios/v1` and its fingerprint `8e7a6c98...a7687` | **No** |
| `backend/data/synthetic/v1` and its fingerprint `2779b039...afde1` | **No** |
| The engine, the event ledger, the 90-minute deadline | **No** |
| Scene structure, conversation beats, surfaces, forms, phone UI | **Yes — this is the whole task** |

Where the enhanced story needs a fact the bank does not carry (who else is in a group, what
the second page of a site says, what a callback sounds like, what a payee is called), the
**scene** supplies it as additional synthetic content. The scene never restates or contradicts
a fact the bank already owns; names, numbers, headline messages, link targets and directory
entries are read out of `scenario.synthetic` at build time.

Two places where the DATA-003 generated placeholder content and the client's own stage text
disagree are carried forward from IMMERSIVE-003A unchanged and are re-stated in sections 3
and 4. Neither is a scenario-definition change.

---

## 1. W01 — The Accidental Login Code

### Client scenario (authoritative)

- **Title / disposition / difficulty:** The Accidental Login Code / Malicious / Easy
- **Family:** Account takeover / OTP theft. **Trigger:** Helpfulness + urgency.
- **Stage 1 (Event):** notification `Unknown: I sent a 6-digit code to you by mistake. Please send it back now.`
- **Stage 2 (Open):** open the unread chat from an unsaved number; an unknown number apologizes for entering the learner's number by mistake. UI: chat list, unread pill, thread header, bubbles, delivery ticks, **prior-message history**.
- **Stage 3 (Inspect):** open details and examine the **full number, absent mutual groups and the system code warning**. Decision signal: *a genuine login code is secret and the requester cannot need a code delivered to someone else.*
- **Stage 4 (Branch):** advances to a **simulated system-code bubble followed by a reply composer**. Safe: do not type or forward the six digits.
- **Stage 5 (Verify):** **check account activity / linked devices from Settings**, not through the stranger.
- **Stage 6 (Resolve):** do not reply; report and block the number; review linked devices.
- **End state:** chat closes as Reported + Blocked; account-security checklist offered locally.

### MITRE ATT&CK alignment

| Role | Technique | Tactic | Version / last modified |
| --- | --- | --- | --- |
| **Primary** | **T1598.001 — Phishing for Information: Spearphishing Service** | Reconnaissance | v1.0, modified 24 Oct 2025 |
| Supporting | **T1684.001 — Social Engineering: Impersonation** | Stealth | v1.0, modified 12 May 2026 |
| Supporting | **T1111 — Multi-Factor Authentication Interception** | Credential Access | v2.1, modified 12 May 2026 |
| Partial only | **T1621 — Multi-Factor Authentication Request Generation** | Credential Access | v1.2, modified 24 Oct 2025 |
| Outcome | **T1586 — Compromise Accounts** | Resource Development | — |

Official sources:
<https://attack.mitre.org/techniques/T1598/001/> ·
<https://attack.mitre.org/techniques/T1598/> ·
<https://attack.mitre.org/techniques/T1684/001/> ·
<https://attack.mitre.org/techniques/T1111/> ·
<https://attack.mitre.org/techniques/T1621/> ·
<https://attack.mitre.org/techniques/T1586/> ·
ruled out: <https://attack.mitre.org/techniques/T1566/>

### Why this maps

- **T1598.001** is spearphishing *for information* delivered over a **third-party service**
  rather than enterprise mail — ATT&CK's own words are that adversaries send messages through
  social media services and other non-enterprise controlled services, which are more likely to
  have a less-strict security policy. A WhatsApp message asking the recipient to hand back a
  six-digit code is exactly that: the objective is to **elicit information**, not to execute
  code. That is also why T1566 (Phishing, Initial Access) is the wrong technique here —
  nothing runs.
- ATT&CK records a directly analogous procedure on the parent technique: under **T1598**,
  *Scattered Spider* used a combination of credential phishing and social engineering to
  capture one-time-password codes, and under **T1598.001** the same actor sent Telegram
  messages impersonating IT personnel to harvest credentials (campaign C0027). Messaging-app
  OTP elicitation is documented behaviour, not an invented lure.
- **T1111** is the technique that explains why a six-digit string is worth anything. ATT&CK
  states that one-time codes are commonly sent via out-of-band communications and that if the
  device or service is not secured they may be vulnerable to interception. In this pattern the
  *interception channel is the victim themselves*.
- **T1684.001** covers the pretext — a plausible person with a plausible reason.
- **T1621 is only a partial fit and is recorded as such.** The half that matches is that the
  adversary *causes* the code to be generated and delivered to the victim's handset. The half
  that does not is the documented behaviour, which is push-notification fatigue and
  bombardment until the user approves. W01 is a single, polite, well-explained code, not a
  flood. It is listed because the request-generation step is genuinely part of the behaviour;
  it is explicitly **not** claimed as the primary technique.

### Real-world behavioural pattern

Corroborated by published consumer-security advisories on the WhatsApp registration-code
takeover (Bitdefender HotForSecurity and equivalent national community advisories):

1. The adversary already controls a contact's account or has a plausible identity.
2. They enter the target's phone number into WhatsApp's own registration flow. **The code
   that arrives is genuine** — issued by the real service, not forged.
3. They message the target with a mundane, low-stakes explanation ("I typed one digit wrong")
   and ask for the digits back, with mild time pressure.
4. If the target relays the code, the adversary completes registration on their own device;
   the target is signed out.
5. The freshly stolen account becomes the next lure, because the *next* target sees a
   familiar name and photo (this is the T1586 loop, and it is why W04 exists).
6. The single control that defeats it is a two-step-verification PIN, found in the app's own
   **Settings > Account**.

### What must NOT be copied

No real registration flow, no code delivery, no code validation, no session, no device
linking, no working two-step-verification implementation, no real brand assets. The six
digits are scenario text: they are never generated, never checked, never stored and never
sent anywhere.

### Client requirements preserved

Prior-message history (stage 2) is now a real multi-day thread. The **full number, absent
mutual groups and the system code warning** (stage 3) are all present and all reached by
tapping the header. The **system-code bubble followed by a reply composer** (stage 4) is
built exactly as written: the WhatsApp verification-code notice arrives at the branch stage
and the composer wakes up with it. Verification (stage 5) is the phone's own
**Settings > Account > Linked devices** screen. Resolution (stage 6) is the app's own
Report/Block, and the end state offers the account-security checklist locally.

### Enhanced synthetic storyline

The stranger is not a caricature. They are apologetic, specific and slightly embarrassed,
and they never say anything a real person could not say. The pressure is applied once and
then softened, which is what makes helpfulness the trigger rather than fear.

### Conversation progression

| Stage reached | What the thread contains |
| --- | --- |
| open | Encryption notice; "not in your contacts" system line; **yesterday** divider with two messages that establish that this number tried to reach the learner before today; **today** divider; the apology, the mistyped-number explanation, the "code has gone to you" line, then the client's headline verbatim. |
| branch | The WhatsApp verification-code notice arrives as a system bubble ("**348-201** is your verification code. Do not share this code with anyone."), then two follow-ups: "It has arrived now", "my whole account is locked until I put it in". The composer becomes usable. |
| verify (consequence-scoped) | If the learner sent the code: the outgoing bubble, then a system line saying the number was registered on another device and this device has been signed out. If the learner replied instead: "A friend. Please hurry, the code expires in one minute." |

### Evidence the learner can discover (progressive)

1. **Chat list** — the row shows a number, not a name.
2. **Thread** — the sender knew to message *before* the code existed.
3. **Header tap > Contact info** — full number, "not in your contacts", on WhatsApp since
   today, no shared media.
4. **Contact info > Groups in common tab** — explicitly empty, with the count.
5. **The code notice itself** — the platform's own warning, in the platform's own words.
6. **Settings > Account > Linked devices** — only this phone is linked, **and** a
   registration-activity row timestamped one minute before the code arrived, from another
   device. This is the piece that converts suspicion into proof, and it is only reachable
   through the phone's own settings, never from the chat.
7. **Two-step verification: Off** — the remediation, discovered rather than narrated.

No single screen states a verdict. Together they state it plainly.

### Learner interaction journey

```
home badge -> chat list -> open the unread row -> read the thread
   -> tap the header -> Contact info -> Groups in common (empty)
   -> back -> code notice arrives -> composer wakes
   -> overflow -> Settings > Account > Linked devices -> registration activity
   -> back -> Report / Block banner under the thread -> resolution
```

### Simulation surfaces

Chat list · conversation · contact sheet (with tabs) · in-app **Settings > Account** screen ·
simulated call-back screen (the unsafe verification route).

### Escalation beats

Apology -> explanation -> "the code has gone to you" -> the client's ask -> the code lands ->
"just those 6 digits" -> "my whole account is locked". Three escalations, no shouting.

### Verification mechanism

`verify_known_app` opening **Settings > Account** — the learner's own account, not the
stranger's word. `verify_in_message_contact` (calling the number that messaged) is offered
and is worth zero, exactly as the client's table requires.

### Safe resolution

Do not reply -> report and block -> the chat closes reported and blocked and the
account-security checklist is offered.

### Unsafe paths

Quick-reply from the chat list before opening (premature); replying to ask "who is this?"
(risky reply); **sending the code** (secret release); calling the number in the message
(verification through message, zero).

### Realism improvements over IMMERSIVE-003A

Multi-day thread with a real day divider and prior contact attempts; grouped consecutive
bubbles with a single tail; delivery ticks; a contact sheet with real tabs instead of one long
list; registration activity presented as an account-activity log rather than a sentence; a
composer that shows the reply being placed into it before it is sent.

### Scoring / event mapping (unchanged)

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Open the chat row | `read` | ITEM_OPEN | 0 |
| Quick-reply from the list | `reply` @open | PREMATURE_REPLY | -1 |
| Tap the header > Contact info | `inspect_sender` | INSPECT_CONTEXT | +2 |
| Do not reply, open Account settings | `safe_pivot` | SAFE_PIVOT | +3 |
| Send `348-201` | `share_secret` | SECRET_PAYMENT_INSTALL_DATA_RELEASE | -8 |
| "Who is this?" | `reply` @branch | RISKY_OPEN_REPLY | -3 |
| Settings > Account > Linked devices | `verify_known_app` | TRUSTED_VERIFY | +3 |
| Call the number that messaged | `verify_in_message_contact` | VERIFY_THROUGH_MESSAGE | 0 |
| Report / Block (verify stage) | `report` / `block` | REPORT_ONLY_WITHOUT_CHECK | +1 |
| Report and close | `resolve_report` | RESOLVE_CORRECT | +2 |
| Carry on helping them | `resolve_continue` | CONTRADICTORY_UNSAFE_FINAL | -4 |

Safe path: 0 + 0 + 2 + 3 + 3 + 2 = **10**.

### Why the final simulation stays faithful

Every stage's `ui_to_build` element is present; the decision signal is the one the client
wrote; the verification route is the one the client named; the end state is the one the
client specified. Nothing was added that changes what is being assessed — only how much of
it the learner has to find for themselves.

---

## 2. W02 — Parcel Redelivery Fee

### Client scenario (authoritative)

- **Malicious / Easy.** Family: delivery impersonation / payment phishing. Trigger: urgency + curiosity.
- **Stage 1:** `QuickParcel Support: Delivery failed. Pay INR 25 today to avoid return.`
- **Stage 2:** open the **business chat and parcel card**.
- **Stage 3:** examine **business-account details, spelling, tracking number and preview domain**. Decision signal: the learner did not expect this parcel and the link uses a look-alike host rather than a known portal.
- **Stage 4:** advances to an **offline tracking page requesting card/UPI details**. Safe: do not enter payment information or approve a collect request.
- **Stage 5:** **open the known courier app/site from the Trusted Directory and search the tracking number.**
- **Stage 6:** close the page; report/block the sender; **retain the synthetic tracking evidence**. Stage 6 UI adds the **250-character rationale box**.
- **End state:** the fake checkout records no data and returns to a reported chat.

### MITRE ATT&CK alignment

| Role | Technique | Tactic | Version / last modified |
| --- | --- | --- | --- |
| **Primary** | **T1598.003 — Phishing for Information: Spearphishing Link** | Reconnaissance | parent v1.4, modified 12 May 2026 |
| Channel | **T1598.001 — Spearphishing Service** / **T1566.003 — Phishing: Spearphishing via Service** | Reconnaissance / Initial Access | v1.0 / v2.0, both modified 24 Oct 2025 |
| Supporting | **T1684.001 — Social Engineering: Impersonation** | Stealth | v1.0, modified 12 May 2026 |
| Supporting | **T1583.001 — Acquire Infrastructure: Domains** | Resource Development | — |
| Objective | **T1657 — Financial Theft** | Impact | v1.2, modified 12 May 2026 |
| Context | **T1660 — Phishing (Mobile)** | Initial Access (Mobile) | — |

Official sources:
<https://attack.mitre.org/techniques/T1598/003/> ·
<https://attack.mitre.org/techniques/T1598/001/> ·
<https://attack.mitre.org/techniques/T1598/> ·
<https://attack.mitre.org/techniques/T1566/003/> ·
<https://attack.mitre.org/techniques/T1566/> ·
<https://attack.mitre.org/techniques/T1684/001/> ·
<https://attack.mitre.org/techniques/T1583/001/> ·
<https://attack.mitre.org/techniques/T1657/> ·
<https://attack.mitre.org/techniques/T1660/>

### Why this maps

- **T1598.003** is the exact shape: a message carrying a link to a page that may be a clone of
  a legitimate site, or closely resemble one in appearance with a URL containing elements from
  the real site, whose purpose is to make the target type sensitive data into it. The data
  here is card / UPI details rather than a password, which is still "credentials or other
  actionable information" in ATT&CK's terms.
- **T1583.001** is the reason the address bar is the evidence: ATT&CK notes adversaries choose
  domains similar to legitimate ones, using homoglyphs or a different top-level domain. The
  scenario's own decision signal is a domain comparison, so the simulation has to show a
  domain the learner can compare.
- **T1660 (Mobile)** is worth citing precisely because it states the human factor the whole
  scenario turns on: on a phone, users may not be able to notice minor differences between
  genuine and phishing websites because of the smaller form factor. That is an argument for
  building the browser properly rather than describing it.
- **T1657** is the objective. ATT&CK's Financial Theft page describes exactly this
  arrangement: impersonation of a trusted entity, after which victims are deceived into
  sending money to accounts the adversary controls.

### Real-world behavioural pattern

1. A brand with a legitimate reason to contact strangers is chosen — a courier, because
   almost everyone is plausibly awaiting *something*.
2. The lure is **small**. A twenty-five-rupee fee is below the threshold at which people stop
   to think; the money is not the objective, the **card data** is.
3. The message arrives as an operational status update, not as a request: "out for delivery",
   then "delivery attempt failed", then the fee. The sequence manufactures a history the
   recipient did not witness but cannot disprove.
4. A deadline is attached to an outcome the recipient dislikes (return to sender) rather than
   to a punishment.
5. The destination is a page that looks like a courier's own checkout and asks for full card
   details plus, increasingly, an OTP step.
6. The genuine courier's own site is the disproof: the consignment number does not exist.

### What must NOT be copied

No real courier brand, no real domain, no real payment processor, no card tokenisation, no
3-D Secure flow, no network call of any kind. The card and UPI fields in the product accept
typed characters so that the *interaction* is real, but the values never leave the component
that holds them (section 6).

### Client requirements preserved

The business chat and parcel card; business-account details, spelling, tracking number and
preview domain at stage 3; an offline tracking page requesting card/UPI details at stage 4;
Trusted-Directory-routed verification of the **tracking number** at stage 5; close, report,
**retain the evidence** and write a one-line rationale at stage 6.

### Enhanced synthetic storyline

The chat opens as a delivery-status thread that has been running since the morning, so the
fee is the fourth message rather than the first. The link preview carries the consignment
number, so tapping it feels like continuing a task rather than starting one.

### Conversation progression

`08:51` out for delivery -> `11:44` attempt failed, nobody at the address -> `12:07` the
client's headline verbatim -> link preview card (`QuickParcel - Redelivery`, "Pay INR 25 to
release consignment QP-4417-2290"). At the branch stage a payment request card appears in
the chat and a closing line: "Parcels unpaid after today are returned to the sender."

### Evidence the learner can discover (progressive)

1. **Chat list** — a business row with no verified tick.
2. **Header tap > Business info** — not a verified business, no address, no category, first
   message today, website = the look-alike host.
3. **The link card's inspect chip** — the full display target, expanded, with the host on its
   own line rather than buried mid-URL.
4. **Inside the browser** — the address bar shows the same host; the fine print says the site
   is operated by an independent delivery agent and the fees are not connected to any courier
   company; the Terms sub-page repeats it.
5. **The form itself** — a redelivery fee page asking for the full card number, expiry, CVV
   *and* a UPI ID is asking for more than a 25-rupee charge needs.
6. **The courier's own site** (verification route) — the consignment number returns *no
   consignment found*; the Fees page states redelivery is free and that the courier never
   collects card details outside the app.

### Learner interaction journey (cross-surface)

```
notification -> chat list -> open the business chat -> read the delivery history
   -> tap the header -> Business info (unverified) -> back
   -> tap the link card's inspect chip -> see the host
   -> tap the link -> BROWSER OPENS (address bar, page loads)
        -> read the fee page -> open Terms -> back to the fee page
        -> type into the card / UPI fields (local, ephemeral)
        -> Continue -> local validation -> review step -> Pay INR 25.00   <- scored
        -> deterministic outcome screen
   -> Back -> WhatsApp
   -> overflow -> the courier site I already use -> search QP-4417-2290 -> "no consignment found"
        -> Fees and charges -> "redelivery is free"
   -> Back -> WhatsApp -> Report / Block -> rationale -> resolve
```

### Simulation surfaces

Chat list · business conversation · business-info sheet · **offline browser** with two
distinct sites (the suspect redelivery site and the real courier's tracking site), each with
its own multi-page graph, address bar, in-page links and Back · a simulated call to the
sender.

### Escalation beats

Status update -> failure -> fee -> deadline -> payment card in chat -> "returned to the sender".

### Verification mechanism

`verify_known_app` — the courier site the learner already uses, opened from the phone, with
the consignment number searched. `verify_trusted_directory` — the unit support desk. Calling
the number in the message is offered and scores zero.

### Safe resolution

Do not pay -> verify in the courier's own site -> return -> report and block -> keep the
tracking evidence -> one-line rationale.

### Unsafe paths

Opening the link straight from the notification preview (premature); opening the link at the
branch stage (risky open); **completing the payment form** (data release); calling the
number in the message (zero).

### Realism improvements

A real browser transition with a loading bar and an address bar; two different sites, so the
learner experiences the *contrast* rather than being told about it; a genuinely interactive
payment form with local field validation, a review step, a processing state and a
deterministic outcome; a link preview whose inspect chip expands the URL rather than
summarising it.

### Scoring / event mapping (unchanged)

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Open the chat row | `read` | ITEM_OPEN | 0 |
| Open the link from the preview | `open_link` @open | PREMATURE_REPLY | -1 |
| Business info | `inspect_sender` | INSPECT_CONTEXT | +2 |
| Check where this link goes | `inspect_link` | INSPECT_CONTEXT | +2 |
| Do not pay, check the courier myself | `safe_pivot` | SAFE_PIVOT | +3 |
| Open the redelivery link | `open_link` @branch | RISKY_OPEN_REPLY | -3 |
| Pay INR 25.00 (chat card) | `attempt_payment` | SECRET_PAYMENT_INSTALL_DATA_RELEASE | -8 |
| Pay INR 25.00 (browser form) | `submit_data` | SECRET_PAYMENT_INSTALL_DATA_RELEASE | -8 |
| Courier site I already use | `verify_known_app` | TRUSTED_VERIFY | +3 |
| Report and close | `resolve_report` | RESOLVE_CORRECT | +2 |

Safe path: 0 + 0 + 2 + 3 + 3 + 2 = **10**.

### Why the final simulation stays faithful

The client asked for an offline tracking page requesting card/UPI details, and this is one —
but one the learner can actually operate. Nothing about the scoring, stage machine, decision
signal or resolution changed; the fee, the brand name, the headline and the link target all
come from the pinned bank content.

---

## 3. W03 — Known Sports Meet Group

### Client scenario (authoritative)

- **Legitimate / Easy.** Family: legitimate group invitation. Trigger: familiarity | fictional military context.
- **Stage 1:** `Recreation Coord: Unit Falcon sports meet group is ready. Please confirm attendance in the poll.`
- **Stage 2:** open the new group thread from a **saved** coordinator; no sensitive data or external link is requested.
- **Stage 3:** examine **creator identity, known number, group participants and prior announcement**. Decision signal: the number matches the local directory, the event was expected, the poll stays inside the app.
- **Stage 4:** an **in-app attendance poll with Yes/No options**. Safe: use the normal in-app path.
- **Stage 5:** **compare the coordinator number with the local Trusted Directory.** If it matches, continue; do not report or block a legitimate sender.
- **Stage 6:** answer the poll and keep the group; do not report or block.
- **End state:** poll choice saved; group remains as legitimate background traffic.

### MITRE ATT&CK alignment

**There is none, and none has been invented.**

ATT&CK is a catalogue of **adversary** behaviour. W03 contains no adversary. A saved unit
coordinator creating an announced group and posting an attendance poll is ordinary
communication; there is no technique, sub-technique or campaign that describes it, and
attaching one — "impersonation, but benign", say — would be a false claim in a document whose
whole purpose is that its claims can be checked.

### Closest defensible behavioural reference (used instead)

The reference is **the discrimination problem**, not an attack.

- The client bank contains twenty legitimate items and prices a false report at **-4**
  (`FALSE_REPORT_BLOCK`). That is the client stating, in scoring, that over-reporting is a
  failure mode with a cost. W03 is where that is measured.
- The relevant real-world evidence is the operational cost of false positives in
  human-reported phishing: a workforce trained only on hostile examples learns to report, not
  to discriminate, and the reporting queue degrades. Any awareness programme that only
  rewards suspicion produces exactly that.
- The correct behavioural framing is therefore **signal detection**: the learner must be able
  to reach a *negative* conclusion using the same tools that produce a positive one on W01,
  W02, W04 and W05. The trusted-directory overlay is the same overlay in all five scenarios.
  Only the answer differs.

Consequently, the design goal for W03 is the opposite of the other four: **give it as much
texture as the malicious ones and none of the tells.** If W03 is visibly the safe one, the
whole instrument is broken, because the learner is then being taught "the short one is
legitimate", not judgment.

### Contrast anchor — what would have to be true for this to be W04

| Signal | W03 (legitimate) | W04 (impersonation) |
| --- | --- | --- |
| Sender saved | Yes, three years | No |
| Groups in common | Nine | None |
| Prior announcement | Notice board, last Tuesday | None |
| Directory match | **Matches** | Does not match |
| What is asked | A poll answer, inside the app | Money, out of band |
| Channel pressure | "Poll closes Friday" | "Before 20:00" |

### Client requirements preserved

Saved coordinator; prior announcement; group participants; in-app Yes/No poll; directory
comparison at stage 5; continue and keep the group at stage 6; no external link and nothing
sensitive requested at any point.

### Enhanced synthetic storyline

The group is alive before the learner arrives. It has a week of context (the notice-board
announcement), several participants who are already talking, an admin structure, a purpose
line, and a coordinator with a saved contact card. Two other people post before the poll —
one about kit, one asking a mundane logistics question — so the thread reads like a real unit
group rather than a stage set with one speaker.

### Conversation progression

**Last Tuesday:** the notice-board reminder from the coordinator. **Today:** system lines for
group creation and "added you"; the client's headline verbatim; the event detail message
(events, kit); PT Instr on water bottles; Coy Clerk asking about transport; the coordinator
answering with a quoted reply. At the branch stage the **poll** arrives with live counts
(other participants have already voted) and a closing line: "Poll closes Friday. No need to
message me separately."

### Evidence the learner can discover (progressive)

1. **Chat list** — a group row with a name the learner recognises.
2. **Header tap > Group info** — description and purpose, created by the coordinator today
   at 07:36, **10 participants** with admin badges, and the note that the event was announced
   on the notice board last Tuesday.
3. **Group info > participants** — named people, most already saved.
4. **Participant tap > the coordinator's contact card** — saved three years, **nine groups in
   common**, last message last month. This is the mirror image of W04's empty sheet and is
   deliberately reached the same way.
5. **Trusted Directory overlay** — the coordinator's approved-directory row **matches** the
   number in the group.
6. **The poll** — it stays inside the app; nothing is asked for.

### Learner interaction journey

```
notification -> chat list -> open the group -> read a week of context
   -> tap the header -> Group info -> participants -> open the coordinator's card
        -> saved, 9 groups in common -> back -> back
   -> poll appears -> vote Yes / No                                   <- scored
   -> overflow -> Trusted Directory -> coordinator row matches
   -> Stay in the group and take part -> resolution
```

### Simulation surfaces

Chat list · group conversation with multiple authors · **group info** with participants and
admin badges · a participant contact card reached from the participant list · the trusted
directory overlay · a call to the saved coordinator.

### Escalation beats

None, deliberately. A legitimate thread has no escalation, and manufacturing one would be a
tell. The rhythm is announcement -> detail -> chatter -> poll.

### Verification mechanism

`verify_trusted_directory` — the coordinator's number against the local approved directory,
which **matches**. `verify_known_number` — calling the saved coordinator, who confirms they
made the group. Both are +3, because both are genuinely independent.

### Safe resolution

Answer the poll, keep the group, take part. `resolve_continue` / `resolve_retain` -> +2.

### Unsafe paths

Exiting without answering (needless reject, -2); sharing live location with the group (unsafe
external action, -4); **reporting or blocking the coordinator** (false report, -4, and a
contradictory final resolution costs a further -4).

### Realism improvements

Multiple authors with distinct voices; a quoted reply; admin badges; participant list with
real names and numbers; a participant contact card that is a genuine second surface; a poll
with live vote counts that updates when the learner votes; group creation system lines; a
purpose/description block. Above all: **length and texture equal to the malicious scenarios**,
so scenario length is not a tell.

### Scoring / event mapping (unchanged)

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Open the group | `read` | ITEM_OPEN | 0 |
| Group info | `inspect_sender` | INSPECT_CONTEXT | +2 |
| Vote Yes / Vote No | `safe_pivot` | **CORRECT_USE** | +3 |
| Exit without answering | `reject_ignore` | NEEDLESS_REJECT_IGNORE | -2 |
| Share live location | `share_location` | UNSAFE_EXTERNAL_ACTION | -4 |
| Trusted Directory | `verify_trusted_directory` | TRUSTED_VERIFY | +3 |
| Report the group | `report` | **FALSE_REPORT_BLOCK** | -4 |
| Stay and take part | `resolve_continue` | RESOLVE_CORRECT | +2 |
| Report the group and close | `resolve_report` | CONTRADICTORY_UNSAFE_FINAL | -4 |

Safe path: 0 + 0 + 2 + 3 + 3 + 2 = **10**. Note that the *same control shape* that scores
`SAFE_PIVOT` on W01 scores `CORRECT_USE` here, and the *same* report control that scores +1 on
W01 scores -4 here. The scene does not decide that; the scenario's own scoring list does.

### Content note carried forward from IMMERSIVE-003A

The generated `trusted_directory_entry` asset for W03 is the unit support desk with an
unrelated number, so the comparison stage 5 requires could never resolve against it. The
scene supplies an **additional** approved-directory row for the coordinator, derived from the
scenario's own sender identifier, displayed beside the bank's row with the same provenance
line. The bank asset is untouched. This remains a scene-level addition, not a bank change.

### Why the final simulation stays faithful

Nothing was added that a real unit sports-meet group would not contain, and nothing was
removed that the client specified. The decision signal is still "the number matches the local
directory, the event was expected, and the poll stays inside the app" — the learner now has
to establish all three rather than read them.

---

## 4. W04 — Friend on a New Number

### Client scenario (authoritative)

- **Malicious / Easy.** Family: known-contact impersonation / emergency payment. Trigger: empathy + urgency.
- **Stage 1:** `Riya (new number): Phone broke. Please send INR 8,000 for the clinic before 20:00.`
- **Stage 2:** open the chat with a **familiar profile photo but no history**.
- **Stage 3:** examine **number, account age, mutual groups and writing style**. Decision signal: the number is new, there is no shared history, the payment request is urgent and unusual.
- **Stage 4:** a **UPI request card bearing an unrelated synthetic payee name**. Safe: do not approve the payment or ask only in the same chat.
- **Stage 5:** **call the saved old number or another known family contact.**
- **Stage 6:** decline; report/block the clone **after the known friend confirms impersonation**.
- **End state:** payment remains unexecuted; the verified friend call reveals the clone.

### MITRE ATT&CK alignment

| Role | Technique | Tactic | Version / last modified |
| --- | --- | --- | --- |
| **Primary** | **T1684.001 — Social Engineering: Impersonation** | Stealth | v1.0, modified 12 May 2026 |
| Parent | **T1684 — Social Engineering** | Stealth | v1.0, created 14 Apr 2026 |
| Objective | **T1657 — Financial Theft** | Impact | v1.2, modified 12 May 2026 |
| Channel | **T1598.001 — Spearphishing Service** | Reconnaissance | v1.0, modified 24 Oct 2025 |
| Enabler | **T1586 — Compromise Accounts** | Resource Development | — |
| Verification leg | **T1598.004 — Spearphishing Voice** | Reconnaissance | — |

Official sources:
<https://attack.mitre.org/techniques/T1684/001/> ·
<https://attack.mitre.org/techniques/T1684/> ·
<https://attack.mitre.org/techniques/T1657/> ·
<https://attack.mitre.org/techniques/T1586/> ·
<https://attack.mitre.org/techniques/T1598/001/> ·
<https://attack.mitre.org/techniques/T1598/004/>

### Why this maps

- **T1684.001** is not merely close, it is the definition. ATT&CK states that adversaries
  impersonate a trusted person or organization to persuade and trick a target into performing
  an action on their behalf, and that in business email compromise and email fraud they use
  impersonation to defraud victims, deceiving them into sending money. W04 is the
  consumer-scale instance of that sentence.
- ATT&CK also states the pressure mechanics explicitly: persuasive language using terms such
  as payment, request or urgent, to push the victim to act quickly. The client's own trigger
  is "empathy + urgency" and the message contains a deadline. The two descriptions match
  without adjustment.
- **T1586 Compromise Accounts** explains where the photo, the name and the knowledge of the
  relationship came from: ATT&CK notes that using an existing persona engenders trust where
  the victim has a relationship with, or knowledge of, the compromised persona. This closes
  the loop that W01 opens, which is why the two scenarios belong in the same batch.
- **T1657** is the objective, and the payee-name mismatch is the artefact of it — money must
  land in an account the adversary controls, and that account has a different name on it.
- **T1598.004** covers the *safe* leg rather than the attack: a phone call to a number the
  learner already holds. It is cited to be precise about the difference between calling a
  number **from** the message and calling a number **you already had**.

### Real-world behavioural pattern

1. The identity is copied, not compromised: display name and profile photo are trivially
   lifted from a previously stolen account (T1586) or from any public profile.
2. The opening move explains the anomaly *before* the target notices it — "my phone broke,
   this is my new number, please save it".
3. Familiarity is established with small talk before money is mentioned. The ask is never the
   first message.
4. The amount is specific, mid-sized and attached to a sympathetic reason and a deadline.
5. The request is pushed to a rail that cannot be reversed — a collect request rather than a
   transfer.
6. The **payee name does not match the claimed sender**, because the receiving account is not
   the friend's. This is the single most reliable artefact and it is visible in the payment
   sheet.
7. Every attempt is made to keep verification inside the same chat.
8. One out-of-band call to the number already in the contact list ends it.

### What must NOT be copied

No real UPI handle, VPA, PSP, collect-request mechanism, bank name, or payment rail. No real
person. No photograph — the simulation uses the synthetic design system's initials avatar.
The payment sheet accepts a typed UPI PIN so that the *moment of decision* is real, and that
value is discarded by the component that holds it and never transmitted (section 6).

### Client requirements preserved

Familiar profile with no history; number, account age, mutual groups and **writing style** at
stage 3; a UPI request card bearing an **unrelated synthetic payee name** at stage 4; a call
to the **saved old number** at stage 5; report/block **after** the friend confirms, at stage 6.

### Enhanced synthetic storyline

The evidence in W04 is an *absence*, and an absence cannot be handed over in a panel — it has
to be looked for. Nothing on the chat screen says the sender is not Riya. The learner is given
two contact sheets and has to put them next to each other.

The "writing style" signal the client names is built in properly: the impostor writes in
clipped, formal, slightly-off sentences with no shared references, while the **saved** Riya's
last messages — visible in her own contact sheet's message history — are casual and refer to a
trek they both went on. The learner can compare them directly.

### Conversation progression

`16:22` "Hi, it is Riya." -> `16:26` "My old phone fell in water this morning. This is my new
number, please save it." -> `16:31` the client's headline verbatim. At the branch stage:
`16:33` "The clinic will not start until the deposit is in" -> the **UPI collect request card**
(payee `S KUMAR ENTERPRISE`, INR 8,000.00, expires 20:00). If the learner replies asking
whether it is really her: "Yes yes it is me, please hurry, they are waiting at the counter."

### Evidence the learner can discover (progressive)

1. **At first** — a new number and a familiar display name. Nothing else.
2. **Header tap > Contact info** — on WhatsApp since **today**, first message today at 16:22,
   status is the WhatsApp default.
3. **Groups in common tab** — **none**.
4. **"Saved contacts with this name"** — one: *Riya*, `+91 00000 44712`, saved three years ago.
5. **Open Riya (saved)** — a second contact sheet: on WhatsApp since 2023, last message
   yesterday at 21:14, **four groups in common**, 148 shared items, and a **recent messages**
   block showing how she actually writes.
6. **Back to the impostor's sheet** — the contrast is now the learner's own observation.
7. **The payment card** — the payee is `S KUMAR ENTERPRISE`, which is nobody in this story.
8. **The call to the saved number** — Riya answers, her phone is fine, she has sent nothing
   and is not at any clinic. This is the confirmation the client's stage 6 requires *before*
   reporting.

### Learner interaction journey

```
notification -> chat list -> open the chat -> read
   -> tap the header -> Contact info -> Groups in common (none)
        -> Saved contacts with this name -> open Riya (saved)
        -> 4 groups in common, messages from yesterday, her actual voice
        -> back -> back
   -> UPI collect request appears (payee mismatch)
   -> overflow -> Call Riya on +91 00000 44712  -> CALL SCREEN
        -> ringing -> connected -> captions: "my phone is fine", "I have not sent you anything"
        -> End call -> back
   -> Report / Block -> resolution
```

### Simulation surfaces

Chat list · conversation · **impostor contact sheet** · **saved-contact sheet** (a genuine
second screen, reached from inside the first) · **UPI payment sheet** with a PIN step ·
**call screen** to the saved number · call screen to the new number (the unsafe route).

### Escalation beats

Identity claim -> explanation -> the ask -> "the clinic will not start" -> the collect request
with an expiry -> "they are waiting at the counter".

### Verification mechanism

`verify_known_number` — the number already in the contact list, which is the client's stage-5
route verbatim. `verify_in_message_contact` — calling the new number back, which reaches the
impostor and scores zero, which is exactly the lesson.

### Safe resolution

Decline -> call the saved number -> she confirms -> report and block.

### Unsafe paths

Quick-reply from the list (premature); replying in the same chat (risky reply); **approving
the collect request** (payment, -8); calling the new number (zero).

### Realism improvements

Two comparable contact sheets rather than one; a recent-messages block that makes "writing
style" an observable rather than an assertion; a payment sheet with a real PIN entry step
before the decision commits; a call screen with ringing, connection, a running timer and
captions that arrive over time.

### Scoring / event mapping (unchanged)

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Open the chat | `read` | ITEM_OPEN | 0 |
| Contact info | `inspect_sender` | INSPECT_CONTEXT | +2 |
| Do not send anything, check another way | `safe_pivot` | SAFE_PIVOT | +3 |
| Pay INR 8,000.00 | `attempt_payment` | SECRET_PAYMENT_INSTALL_DATA_RELEASE | -8 |
| "Riya? Is this really you?" | `reply` @branch | RISKY_OPEN_REPLY | -3 |
| Call Riya on the saved number | `verify_known_number` | TRUSTED_VERIFY | +3 |
| Call the new number back | `verify_in_message_contact` | VERIFY_THROUGH_MESSAGE | 0 |
| Report and close | `resolve_report` | RESOLVE_CORRECT | +2 |

Safe path: 0 + 0 + 2 + 3 + 3 + 2 = **10**.

### Content note carried forward from IMMERSIVE-003A

The client's stage-4 text requires "a UPI request card bearing an **unrelated** synthetic
payee name". The generated `payment_screen` placeholder carries the sender's own name and
`INR 0.00`. Where the two disagree the client's stage text wins: the card shows an unrelated
payee and the scenario's stated amount. The event still names the bank's asset id, so the
ledger records what was acted on. This remains a scene-level resolution, not a bank change.

### Why the final simulation stays faithful

Same disposition, same family, same trigger, same decision signal, same verification route,
same end state. What changed is that the learner now reaches the conclusion by comparing two
screens and making a phone call, instead of by reading a bullet list.

---

## 5. W05 — KYC Suspension Warning

### Client scenario (authoritative)

- **Malicious / Easy.** Family: bank impersonation / credential phishing. Trigger: fear + urgency.
- **Stage 1:** `NationalPay KYC: Your wallet will be blocked in 30 minutes. Update now.`
- **Stage 2:** open the business chat and warning card; a logo-bearing account threatens immediate suspension.
- **Stage 3:** examine **full number, business verification state and target domain**. Decision signal: the account is unverified, uses a countdown, and routes outside the known banking app.
- **Stage 4:** a **synthetic KYC form asking for account, PIN and OTP**. Safe: do not submit credentials, PIN, OTP or identity document.
- **Stage 5:** **open the known banking app directly, or call the number printed on the simulated card.**
- **Stage 6:** close the form; report/block; verify account status independently.
- **End state:** the official-app mock shows no KYC issue; the suspicious chat is quarantined.

### MITRE ATT&CK alignment

| Role | Technique | Tactic | Version / last modified |
| --- | --- | --- | --- |
| **Primary** | **T1598.003 — Phishing for Information: Spearphishing Link** | Reconnaissance | modified 12 May 2026 |
| **Primary (the OTP field)** | **T1111 — Multi-Factor Authentication Interception** | Credential Access | v2.1, modified 12 May 2026 |
| Supporting | **T1684.001 — Social Engineering: Impersonation** | Stealth | v1.0, modified 12 May 2026 |
| Supporting | **T1585.001 — Establish Accounts: Social Media Accounts** | Resource Development | — |
| Supporting | **T1583.001 — Acquire Infrastructure: Domains** | Resource Development | — |
| Channel | **T1566.003 — Phishing: Spearphishing via Service** | Initial Access | v2.0, modified 24 Oct 2025 |
| Objective | **T1657 — Financial Theft** | Impact | v1.2, modified 12 May 2026 |
| Escalation route | **T1598.004 — Spearphishing Voice** | Reconnaissance | — |

Official sources:
<https://attack.mitre.org/techniques/T1598/003/> ·
<https://attack.mitre.org/techniques/T1598/004/> ·
<https://attack.mitre.org/techniques/T1111/> ·
<https://attack.mitre.org/techniques/T1684/001/> ·
<https://attack.mitre.org/techniques/T1585/001/> ·
<https://attack.mitre.org/techniques/T1585/> ·
<https://attack.mitre.org/techniques/T1583/001/> ·
<https://attack.mitre.org/techniques/T1566/003/> ·
<https://attack.mitre.org/techniques/T1566/> ·
<https://attack.mitre.org/techniques/T1657/>

### Why this maps

- The page is a **clone of a login/verification portal** on a look-alike host, reached by a
  link in a message, whose purpose is to collect credentials — T1598.003 word for word.
- The OTP field is not decoration. ATT&CK's **T1111** exists precisely because one-time codes
  delivered out of band can be intercepted; a phishing page that asks for the OTP *at the same
  time* as the account number and PIN is an adversary-in-the-middle pattern in its simplest
  human form, and T1598.003 explicitly describes kits (EvilProxy, Evilginx2) that industrialise
  it. The training scenario stops at the human step, which is where the learner's decision is.
- **T1684.001** has a directly comparable documented procedure: **APT-C-36** has impersonated
  banks including Banco Davivienda, Bancolombia and BBVA, as well as Colombian government
  institutions. Financial-brand impersonation as a phishing pretext is documented behaviour at
  nation-state scale as well as at fraud scale.
- **T1585.001 / T1583.001** are the preparation the learner is asked to detect at stage 3: a
  business account that was *established* rather than verified, and a domain that was
  *acquired* to look like the brand.
- **T1598.004** is the fallback: if the page is abandoned, the operator calls, and this
  scenario offers that call. Calling **the number in the message** reaches the operator;
  calling **the number printed on the card** reaches support. The two calls are different
  screens with different scripts, and the learner has to notice which number they used.

### Real-world behavioural pattern

1. The pretext is a **regulatory obligation**, not a sale. Compliance language transfers
   authority to the sender and makes the demand feel non-negotiable.
2. The consequence is **loss of access**, not loss of money, so the emotion is fear rather
   than greed, and the remedy is framed as trivially easy.
3. A **countdown** is attached. Its function is to remove the interval in which the recipient
   would have opened the real app.
4. The message arrives on a channel the bank does not use for this, which is the entire tell.
5. The destination asks for more than any genuine re-verification would need: account number,
   registered mobile, **PIN**, **OTP** and an identity document, all on one screen.
6. If the form is abandoned, an operator calls, cites the countdown, and asks for the OTP by
   voice.
7. The disproof is trivial and the scenario's own stage 5 names it: open the app you already
   have. There is no notice, no pending action, the KYC is complete.

### What must NOT be copied

No real bank or wallet brand, no real domain, no real KYC flow, no document upload, no OTP
issuance or validation, no session. The form's fields accept typed characters — including a
masked PIN and an OTP — so that the learner experiences the moment of handing them over; the
values are held in component state for the life of the screen and are never read by anything
else (section 6).

### Client requirements preserved

Business chat and warning card; full number, business verification state and target domain at
stage 3; a synthetic KYC form asking for **account, PIN and OTP** at stage 4; verification via
**the known banking app** or **the number printed on the card** at stage 5; close the form,
report/block and verify independently at stage 6; and the end state — the official-app mock
shows no KYC issue.

### Enhanced synthetic storyline

Two surfaces that look like two different pieces of software: a **web page** that is trying
very hard to look like a bank, and the **bank's actual app**, which looks nothing like it.
The learner walks from one to the other and the contrast is the lesson.

### Conversation progression

`08:44` "NationalPay compliance notice: your wallet KYC record is incomplete as of this
quarter." -> `08:50` the client's headline verbatim -> link preview card. At the branch stage a
**countdown card** ("Wallet suspension in 29:41") and "After suspension, reactivation takes 7
working days and requires a branch visit."

### Evidence the learner can discover (progressive)

1. **Chat list** — a business row, no verified tick.
2. **Header tap > Business info** — **not** a verified business, **not** an official business
   account, no category, website = the look-alike host, first message today.
3. **The link card's inspect chip** — the target host, expanded.
4. **In the browser** — the address bar; the page asks for account number, registered mobile,
   **wallet PIN**, **OTP** and an ID document, on one screen; the fine print names the host;
   the "Why is this needed?" sub-page states that wallets which have not confirmed *a PIN and
   a one-time password* are suspended automatically — which is a claim no payment provider
   makes.
5. **The NationalPay app already on the phone** (verification route) — a different application
   entirely, with its own chrome and tab bar: **Wallet: Active. KYC: Complete — verified 2
   years ago. Pending actions: None. Inbox: no new notices.** Plus the standing statement that
   NationalPay never asks for a PIN or an OTP in chat, by call or on a web form, and the
   support number printed on the card.
6. **The two calls** — support (from the app) says there is no pending KYC action and that the
   link should not be used; the number in the message asks for the OTP.

### Learner interaction journey (cross-surface)

```
notification -> chat list -> open the business chat -> read the compliance notice
   -> tap the header -> Business info (unverified, unofficial) -> back
   -> inspect the link -> see the host
   -> tap the link -> BROWSER OPENS
        -> KYC page -> fill account number, mobile, PIN, OTP (local, ephemeral)
        -> "Why is this needed?" -> back
        -> Submit and keep my wallet active                          <- scored
        -> deterministic outcome screen
   -> Back -> WhatsApp
   -> overflow -> Open the NationalPay app on this phone -> APP SWITCH
        -> wallet Active, KYC Complete, no pending actions, no notices
        -> support number -> back
   -> Back -> WhatsApp -> Report / Block -> resolution
```

### Simulation surfaces

Chat list · business conversation with a countdown card · business-info sheet · **offline
browser** with the KYC site and its sub-page · **the NationalPay app** as a distinct
application surface with its own chrome · two different call screens.

### Escalation beats

Compliance notice -> suspension warning -> countdown -> "7 working days and a branch visit" ->
(if called) "the suspension is automatic, I cannot stop it without the OTP".

### Verification mechanism

`verify_known_app` — the app already on the phone. `verify_known_number` — the number printed
on the card. Both +3. `verify_in_message_contact` — the number in the message, 0.

### Safe resolution

Close the form -> open the app -> see the wallet is fine -> report and block.

### Unsafe paths

Opening the link from the notification preview (premature); opening the KYC link at the branch
stage (risky open); **submitting the form** (credential release, -8); calling the number in the
message (zero); completing the KYC as asked at resolve (-4).

### Realism improvements

A genuinely fillable KYC form with masked PIN entry, per-field local validation, a submit
state and a deterministic outcome; a trusted application that is visibly a *different app*
rather than another settings page; an app-switch transition; a countdown card in the chat.

### Scoring / event mapping (unchanged)

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Open the chat | `read` | ITEM_OPEN | 0 |
| Open the link from the preview | `open_link` @open | PREMATURE_REPLY | -1 |
| Business info | `inspect_sender` | INSPECT_CONTEXT | +2 |
| Do not open the link, check the app myself | `safe_pivot` | SAFE_PIVOT | +3 |
| Open the KYC link | `open_link` @branch | RISKY_OPEN_REPLY | -3 |
| Submit the KYC form | `submit_data` | SECRET_PAYMENT_INSTALL_DATA_RELEASE | -8 |
| Open the NationalPay app | `verify_known_app` | TRUSTED_VERIFY | +3 |
| Call the number on the card | `verify_known_number` | TRUSTED_VERIFY | +3 |
| Report and close | `resolve_report` | RESOLVE_CORRECT | +2 |

Safe path: 0 + 0 + 2 + 3 + 3 + 2 = **10**.

### Why the final simulation stays faithful

The client's stage-4 requirement was a synthetic KYC form asking for account, PIN and OTP.
It is now a form the learner can actually fill in, which makes the refusal a decision rather
than a reading-comprehension exercise. Nothing about the disposition, the scoring, the
verification routes or the end state moved.

---

## 6. Forms, inputs and data handling

This section is normative for the implementation.

### What is interactive

| Scenario | Surface | Fields the learner can actually type into |
| --- | --- | --- |
| W02 | redelivery site, step 1 | card number, name on card, expiry, CVV, **or** UPI ID (tabbed) |
| W02 | UPI collect sheet in chat | UPI PIN (masked) |
| W04 | UPI collect sheet | UPI PIN (masked) |
| W05 | KYC site | account number, registered mobile, wallet PIN (masked), OTP, ID document reference |
| — | anywhere else | nothing; W01 and W03 have no form by design |

### The rules the implementation must satisfy

1. **Local.** Field values live in React component state belonging to the surface, and
   nowhere else.
2. **Ephemeral.** Leaving the surface unmounts the component and the values are gone. They
   are never lifted into page state, controller state, the reducer or a context.
3. **Never transmitted.** No value is ever passed to `act()`, to the attempt controller, to
   `attemptApi`, or into an intent's metadata. The engine's `METADATA_ALLOWLIST`
   (`intent`, `transition`, `consequence`, `resolution_code`, `dwell_ms`, `open_latency_ms`,
   `link_hover_ms`, `verify_source`, `premature`) rejects anything else server-side, so this
   is enforced in two independent places.
4. **Never persisted.** No `localStorage`, no `sessionStorage`, no cookie, no IndexedDB, no
   backend record. Nothing about a typed value survives a reload; the *stage* survives,
   because the server owns it.
5. **Never logged or exported.** Values do not reach `console`, analytics, the event ledger,
   the attempt export or the admin viewer.
6. **No autofill surface.** Every input carries `autoComplete="off"`, no `name` attribute
   that a browser or password manager would recognise as a payment or credential field, and
   PIN/CVV fields are masked by the component itself rather than by `type="password"`, so no
   password manager offers to save anything.
7. **No form submission.** There is no `<form>` element with an action, no `method`, no
   `onSubmit` that could ever navigate. The submit control is an ordinary button that calls a
   scene affordance.
8. **Deterministic.** Validation, the review step, the processing state and the outcome screen
   are authored and produce the same result every time for the same input shape. Nothing is
   random and nothing is timed against the clock.
9. **Not decorative.** Fields accept keystrokes, show validation, and the submit control is
   disabled only by *incomplete input*, never by risk. The unwise option remains selectable at
   all times, which is the specification's own rule.
10. **No warning furniture.** No banner around each form telling the learner it is fake. The
    persistent product-level TRAINING SIMULATION rail is unchanged and is the only place the
    product speaks in its own voice.

### What the assessment records

Exactly what it recorded before: the intent, the stage, the event code, the points, the
synthetic target id and the allow-listed metadata. Typing into a field records nothing.
Pressing **Pay** or **Submit** records one `attempt_payment` / `submit_data` event, the same
one the action sheet recorded in IMMERSIVE-003A.

---

## 7. Cross-scenario contrast — why these are five stories, not one

### W01 vs W02

W01 never leaves WhatsApp. Its evidence lives in the learner's **own account settings** and
the secret is six digits the learner already has. W02 is a **cross-surface** journey: chat ->
browser -> form -> a second, different site, and the secret is card data the learner has to be
persuaded to type. W01's emotion is helpfulness; W02's is a small, cheap, almost-boring
urgency.

### W02 vs W03

W02 is a stranger with a link and a fee. W03 is a saved contact with a poll and nothing to
gain. W02's surfaces are two websites; W03 has **no browser at all**. W02 ends reported;
W03 ends *joined*, and reporting it costs four points. Structurally they are opposites:
W02 rewards refusal, W03 punishes it.

### W03 vs W04

Both are about a person. W03's person is **saved, matched and corroborated** by nine groups
in common and a directory row; W04's person is a **name and a photo with nothing behind
them**. Both are investigated through the same control — tap the header, read the contact
sheet, look at groups in common — and the control returns opposite answers. That is the
entire point of running them in the same batch: the learner cannot learn "check the contact
sheet and report", only "check the contact sheet".

### W04 vs W05

W04 is **personal**: one impersonated human, an emotional appeal, and a verification route
that is a phone call to somebody the learner knows. W05 is **institutional**: a brand, a
compliance pretext, a countdown, and a verification route that is a piece of software the
learner already has. W04's evidence is a comparison between two contact sheets; W05's is a
comparison between a web page and an app. W04 asks for money; W05 asks for credentials.

### Why they do not feel like five variants of the same scenario

| | W01 | W02 | W03 | W04 | W05 |
| --- | --- | --- | --- | --- | --- |
| Conversation | 1:1, stranger | 1:1, business | **group, 10 people** | 1:1, "known" person | 1:1, business |
| Branch interaction | code notice + composer | **browser + payment form** | **poll** | **UPI collect + PIN** | **browser + KYC form** |
| Distinct surfaces | settings, call | **2 browsers**, call | group info, participant card, directory | **2 contact sheets**, call | **browser + a second app**, 2 calls |
| Evidence type | account activity log | domain + tracking lookup | **corroboration** | absence + comparison | app state |
| Verification | own account settings | courier's own site | trusted directory | **saved number call** | **the app on the phone** |
| Emotion | helpfulness | curiosity, small stakes | familiarity | empathy, urgency | fear |
| Correct ending | report + block | report + block + retain evidence | **stay and vote** | report + block after a call | report + block |
| Text input present | none | card / UPI / PIN | none | PIN | account / PIN / OTP |

Five different chrome layouts, five different branch mechanics, five different evidence
types, five different verification instruments, and one of them ends by *participating*.

---

## 8. What the assessment engine still owns

Unchanged by this task, and re-asserted here because the scenes now do considerably more:

- The six stages, their order and their legal transitions.
- The event code, the point value, the next stage and the consequence for every intent.
- The resolution semantics, duplicate-intent handling, stale-state handling and clamping.
- The 90-minute deadline, its sweeper, its startup recovery and its timeout scoring.
- Which scenarios a learner is given and in what order.

The scene layer owns **only** local navigation and presentation. It cannot score, cannot
advance a stage, cannot resolve a run and cannot alter a timer. Opening a surface, walking to
a second page, typing into a field, voting in a poll's local UI or ending a call submits
nothing. Exactly one intent per stage reaches the server, exactly as before.

---

## 9. Provenance summary

| Fact | Comes from |
| --- | --- |
| Sender name, number, avatar initials | `scenario.synthetic.sender` (pinned bank) |
| Headline message and its timestamp | `notification` / `message_thread` assets |
| Prior-context narration | `message_thread` note block |
| Link display target and host | `browser_page` asset |
| Trusted directory row | `trusted_directory_entry` asset |
| Payment asset id named in the event | `payment_screen` asset |
| Everything else in this document | authored scene content: synthetic, local, inert |

Bank fingerprint expected before and after this task:
`8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687`

Synthetic fingerprint expected before and after this task:
`2779b03939e13cf11e0bee44493609f0c91e228f201f22f8c025a080509afde1`
