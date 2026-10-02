# Instagram I16–I20 — real-world research and storyline reconstruction

**Task:** IMMERSIVE-004D — the fourth Instagram batch
**Naming:** the client's bank numbers every Instagram scenario `I01`–`I25` (specification pages
36–61); this batch is **I16–I20** in the data, the registry, the tests and this document, and it
corresponds to specification **pages 52–56**.
**Scope:** Instagram I16, I17, I18, I19, I20 only. WhatsApp W01–W25 and Instagram I01–I15 are
complete and unchanged in behaviour; Instagram I21–I25, Email and SMS are untouched.
**Status:** design record for the five Instagram scenes authored by this task.
**Companions:** [`INSTAGRAM_W01_W05_REAL_WORLD_RESEARCH.md`](INSTAGRAM_W01_W05_REAL_WORLD_RESEARCH.md)
(I01–I05), [`INSTAGRAM_I06_I10_REAL_WORLD_RESEARCH.md`](INSTAGRAM_I06_I10_REAL_WORLD_RESEARCH.md)
(I06–I10), [`INSTAGRAM_I11_I15_REAL_WORLD_RESEARCH.md`](INSTAGRAM_I11_I15_REAL_WORLD_RESEARCH.md)
(I11–I15) and the five WhatsApp records, which use the same method.

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

What is taken from the real world is timing, sequencing, social pressure and the shape of the
surfaces — a public-affairs consent workflow that runs through tag review, an extortion message that
arrives behind the platform's own sensitive-content screen, a copied profile whose numbers are all
right and whose history is all wrong, a crisis post that asks to be amplified, and a month of polite
professional rapport that ends in a questionnaire. What is deliberately **not** taken is
infrastructure, tooling, real brands' workflows, real accounts, real people, real units, real
formations, real locations, real schedules, real procedures, real equipment or any real capability.
"Unit Falcon" is fictional; the "sports day", the "pavilion", "MO-114" and "the mounts" are
deliberately generic and describe nothing. Every host is `*.training.example`; every phone number is
in the reserved `+91 00000 xxxxx` range; every profile, post, comment, story, card, page, form,
register, wallet sheet and settings screen is local, inert and offline. No image file exists anywhere
— avatars, grids, the consent-card frame and I17's screened photo are drawn from CSS.

### 0.2 Source of the threat intelligence

Primary source: **MITRE ATT&CK, Enterprise and PRE matrices, website version v19.2** (released
28 April 2026) — re-confirmed as the current version on the live versions page on 16 September 2026
(<https://attack.mitre.org/versions/>, which resolves to `/resources/versions/`; v18.1 ran
28 October 2025 – 27 April 2026). Techniques read from their own pages on 16 September 2026:
T1585.001, T1591 (listing T1591.004), T1591.001, T1591.003, T1592, T1593.001, T1598 (listing
T1598.001 and T1598.003), T1657, T1684 (listing T1684.001), T1565, T1491 (listing T1491.002) and
T1566.003. T1586.001 and T1430 are cited as read for the I11–I15 and W16–W20 records and were not
re-read for this one.

Version note carried forward: `T1656 Impersonation` no longer exists as a top-level technique and
resolves to **T1684.001** (parent T1684 Social Engineering, created 14 April 2026; its only other
sub-technique is T1684.002 Email Spoofing). Older notes citing T1656 should not be trusted.

Secondary sources, for the real-world pattern behind each scenario (all read 16 September 2026):

- **I16** — US Army, "Social Media Safety", on what a public post may and may not carry and on
  aggregation (<https://www.army.mil/socialmedia/safety/>); Instagram Help Center on tag review
  ("Manually approve tags") and on who can tag and mention you (<https://help.instagram.com/>); UK
  NCSC, "Social media: how to use it safely"
  (<https://www.ncsc.gov.uk/guidance/social-media-how-to-use-it-safely>).
- **I17** — FBI, "Sextortion" guidance: stop contact, do not pay, keep the messages, report, and the
  explicit message that the victim is not the one in trouble
  (<https://www.fbi.gov/how-we-can-help-you/scams-and-safety/common-frauds-and-scams/sextortion>);
  US National Center for Missing & Exploited Children, "Take It Down"
  (<https://takeitdown.ncmec.org/>); UK Revenge Porn Helpline / StopNCII on edited and composite
  images (<https://stopncii.org/>); Instagram Help Center on Restrict, on sensitive-content screens and
  on reporting a threat to share images (<https://help.instagram.com/>).
- **I18** — US Army CID's advisory that service members' photographs and profiles are copied and
  reused (<https://www.cid.army.mil/>); Instagram Help Center on "About this account" (date joined,
  former usernames, accounts based in) (<https://help.instagram.com/>); FTC consumer advice on
  messages from a "new account" of someone you know (<https://consumer.ftc.gov/>).
- **I19** — CISA, "Tactics of Disinformation" and its guidance to pause, check the source and not
  amplify (<https://www.cisa.gov/topics/election-security/foreign-influence-operations-and-disinformation>);
  the DISARM framework for influence operations, cited by its landing page as a non-ATT&CK
  behavioural reference (<https://www.disarm.foundation/>); US Army "Social Media Safety" as above, on
  tagging and location in posts about units.
- **I20** — UK NPSA (formerly CPNI), "Think Before You Link", on approaches through social media by
  people presenting as researchers, recruiters and consultants
  (<https://www.npsa.gov.uk/think-you-link-app>); US NCSC (ODNI), "Think Before You Link" and its
  guidance on online elicitation (<https://www.dni.gov/index.php/ncsc-how-we-work/ncsc-know-the-risk-raise-your-shield>);
  FBI, "Elicitation Techniques" (<https://www.fbi.gov/file-repository/elicitation-brochure.pdf/view>).

**Source-confidence note.** Where a secondary source is cited by its landing page rather than by a
dated article, that is deliberate: the landing page is the one a reviewer can re-open. Nothing in this
document rests on a secondary source for a *behavioural* claim that ATT&CK is asked to carry. The
ATT&CK citations are the load-bearing ones, every one is linked to its own technique page, and
`sceneResearch.test.js` fails the build if a technique is named here without its page.

### 0.3 Interpretation rule

ATT&CK is used as a **behavioural reference, not a checklist**. A mapping is recorded only where the
technique's own description describes what the scenario does. **I16 has no mapping, and that is
stated** — it is a unit's public-information page asking for consent to publish a cleared photograph,
and there is no adversary to catalogue. Six techniques were **considered and rejected**, each with its
reason: T1565 and T1491 (I17), T1586.001 and T1430 (I18), T1566.003 and T1491.002 (I19), T1592 and
T1684.001 (I20). Every mapping in this batch is a partial fit in at least one respect, and each
section says which. Two scenarios are dominated by behaviour ATT&CK does not model well — extortion
of a private individual (I17) and amplification of a false claim (I19) — and their sections say so
rather than stretching a technique to cover it.

### 0.4 What this document may and may not change

| Thing | May IMMERSIVE-004D change it? |
| --- | --- |
| Scenario IDs, platform, level, disposition, family, trigger, military flag, version | **No** |
| The six stages, their order, their text, expected actions, scoring semantics, feedback | **No** |
| `backend/data/scenarios/v1` and its fingerprint `8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687` | **No** |
| `backend/data/synthetic/v1` and its fingerprint `2779b03939e13cf11e0bee44493609f0c91e228f201f22f8c025a080509afde1` | **No** |
| The engine, the event ledger, the selection algorithm, the 90-minute deadline, the attempt API, the training-feedback review | **No** |
| Scene structure, beats, Instagram surfaces, forms, phone UI | **Yes — this is the whole task** |

**The client scenario remains authoritative** over everything in this document. Where the research
and the client's own stage text disagree, the client's text wins and the disagreement is recorded.

### 0.5 Content notes carried forward

**The placeholder Instagram sender.** All five scenarios carry the client's sentence as
`@handle: message` beside a generated `sender_profile` asset that is a placeholder
(`@unknownsender485`, `…170`, `…713`, `…259`, `…506`). Handled exactly as in I01–I15: the scene uses
the handle in the client's sentence, carries the message verbatim, names the bank's sender **asset
id** on every inspection, and never prints the placeholder. `sceneModel.test.js` asserts both halves.

**I18's stored notification is truncated in the bank, and it is left that way.** The DATA-003
generator stops at the first apostrophe, so the bank holds `"@arjun.k_singh: New private account.
Send tomorrow"` — the client's page 54 reads "Send tomorrow's assembly point so I don't miss it."
Regenerating the synthetic bank was out of scope, so I18 does what W06, W09, W15, W20, W22, W25 and
I15 already do: its beat **begins with the bank's exact stored string** and completes the client's
own sentence after it. `sceneModel.test.js` asserts the stored text still ends at "tomorrow", so a
fix to the generator surfaces here.

**The narrator line is not printed.** Each `prior_context` sentence states the situation and, for
four of the five, the verdict ("An account sends a blurred synthetic composite…", "A clone has bought
followers…", "A dramatic post falsely claims…", "A credible-looking researcher…"). None is printed.
The verdict-word assertion for I16–I20 bans the platform-wide list plus `clone`, `impersonat*`,
`genuine`, `legit`, `look-alike`, `hoax`, `unknownsender`, and — new for this batch —
`misinformation`, `disinformation`, `blackmail`, `extortion`, `morphed`, `elicitation` and
`espionage`. One directory-row description in I17 used "extortion" and was rewritten during
verification (§8).

**Answer-revealing asset prose is not displayed.** I20's `browser_page` asset carries the client's
stage-4 sentence as its `body`. The scene uses only the asset's `display_target` and `host`; no
control opens the generic inspection sheet on it. I16, I17 and I18 carry a generated
`payment_screen` asset with `INR 0.00`; only I17 has a payment, and its sheet is authored — the asset
id is named on the Send control so the ledger records it, and its placeholder payee is never shown.

**The result card placeholder** (known limitation carried from I01–I15) applies to all five.

---

## 0.6 Differentiation from I01–I15 and WhatsApp W01–W25

The WhatsApp rows are in the I01–I05 record (§0.7 there); I01–I10 in the I06–I10 record; I11–I15 in
the I11–I15 record. The five new scenes, measured the same way:

| | Behavioural lesson | Social mechanism | Primary evidence | Interaction pattern | Verification pattern | Unsafe temptation |
| --- | --- | --- | --- | --- | --- | --- |
| **I16** | **A real request is specific and limited — answer it where it lives, and give it nothing extra** | Authority + pride (you are in the unit's photograph) | Months of the same consent workflow in the thread; the page's pinned "how we publish"; a release log with an earlier withdrawn frame; the card naming one ID and one scope | **Notifications → an established DM → Settings › Tags and mentions → a consent card with Confirm and Decline** | **A local Release Register app** holding PF-204, and the public-information desk on the directory number | Volunteer date, place and sub-unit "for the caption"; ask for a link instead; leave it pending; report the page |
| **I17** | **Paying or pleading does not end it; keeping evidence and getting help does, and you are not at fault** | Fear + shame + isolation ("tell nobody") | A request from an account with no posts, six followers and two renames this week; **a photo already behind Instagram's sensitive-content screen**; a wallet address and a countdown | **A screened photo, a wallet sheet with a PIN, and Instagram's Restrict** | **A Support & Reporting app** and the welfare desk, who stays on the line | Pay; send a "real" photo to prove it is edited; plead; delete everything and tell nobody |
| **I18** | **Numbers can be bought; history cannot** | Familiarity + urgency | 4,588 followers and 40 mutuals — all right; **About: nine days old, two renames, based outside India**; followers from this month; **the pinned post is the other account's March caption, word for word** | **The DM's own location card**, holding the pin saved in the learner's notes | Arjun on the number saved since 2019, and **Unit Orders**, where Arjun has already acknowledged tomorrow | Send the pin; type time and place; ask "is it you?" in the same chat |
| **I19** | **Speed is not confirmation; do not become the amplifier** | Fear + duty, and a friend asking "is it true?" | An eleven-day-old "news" page that has been a cricket page and a finance page; **its own April post with the same frame and a different disaster**; the unit page silent; a comment asking for anything official | **Instagram's share tray and the learner's own story composer**, with location and mention stickers | **The Unit Bulletin** (no statement today) and the public-information cell | Post it as it is; comment "praying"; add the area sticker; mention the people on duty |
| **I20** | **A plausible professional does not create authorisation** | Expert status + flattery, built over a month | No institution Instagram can confirm; managed from three countries; a renamed account; **a pinned post where one person asks which university and another never got the promised note**; questions that walk from harmless to specific | **A month-long professional thread and a three-page questionnaire**, with two typed ways to answer | **The public-information/security contact** and the **Research & Media Requests register** | Submit the form; answer in the chat; "correct" their figure with yours; a polite general answer |

### Nearest existing scene, and what is genuinely new

| | Nearest | What that already taught | Why this is not the same scenario |
| --- | --- | --- | --- |
| I16 | I03 (verified unit post), I11 (welfare update), W16/W21 (genuine official requests) | Genuine items exist; verify, then use normally | I03 and I11 are **posts** the learner reads; I16 is a **decision the learner is asked to make about themselves**, made on a surface no earlier scene has used — **Settings › Tags and mentions** and its consent card. Both answers on the card are the normal path, so the scene does not collapse into "accept". Its check is a **release register** comparing an ID, not a directory row, and the -4 route is the learner over-helping with caption detail rather than a stranger's form. |
| I17 | W12 (digital-arrest call), I04/I13 (payments to a persona) | Coercion ends in a payment; verify outside the channel | W12 is a **video call** with an authority persona; I13 is **affection**. I17 is **shame**: the first scene where the item arrives behind the platform's **sensitive-content screen**, the first whose safe routes include Instagram's **Restrict**, and the first whose verification is a **support route** that tells the learner they are not in trouble rather than a register or a number that proves the sender wrong. Deleting everything is priced as a contradictory resolution, because evidence matters. |
| I18 | I04 (copied friend, one day old), W19 (commander clone, live location), I15 (friend's own account) | Copies exist; locations are released by sharing | I04's copy was **thin** and its tell was the handle; W19 is WhatsApp's live-location sheet; I15's account was **real**. I18 is the one where **every quick check passes** — thousands of followers, forty mutuals, the teammate's photographs — and only history fails: account age, renames, follower cohort, and a **pinned caption copied from the other account's March post**. The release is the **DM's location card**, and the check is an **orders app** showing the teammate needs nothing. |
| I19 | I06 (own post, location tag), I11 (public comment), I01 (share a giveaway) | Public acts disclose; location tags release | Every earlier scene asks the learner to **give** something to someone. I19 asks them to **publish** something to everyone. It is the first scene whose decision is made in the **share tray and story composer**, the first whose evidence is **the account re-using its own old frame under an earlier name**, and the first whose check is an **approved statements board** that says nothing has happened. |
| I20 | I05 (story-reply questions), I06 (comment questions), W23 (welfare pretext), I13 (long thread), I02/I12 (DM + page) | Elicitation is friendly; long threads lower guard | I05 and I06 are **Easy**, one-shot and personal (city, route); I13's long thread ends in **money**. I20's month is **professional and reciprocal**, the ask is about **equipment limitations**, and the scene offers **three different releases** — a questionnaire, a typed answer and a "correction" — plus a polite general answer that still counts as engagement. It shares the coarse "DM + browser form + composer" home with I02 and I12 (§8), and differs from both in branch shape, content and history. |

**Concepts rejected before writing:** for I16, "the unit shares a post, save it" (I03/I11 again) —
replaced by a consent decision in tag review; for I17, "a stranger asks for money on a payment card"
(I04 again) — replaced by a screened photo, Restrict and a support route; for I18, "a copied friend
with nine posts" (I04 again) and "a live-location sheet" (W19 again) — replaced by a high-fidelity
copy and the DM's location card; for I19, "a stranger comments under your post" (I06 again) —
replaced by the share tray; for I20, "a stranger asks where you are posted" (I05 again) — replaced by
a month of rapport and a structured form. `sceneModel.test.js` asserts that no I16–I20 branch-stage
shape equals any earlier scene's and that the five are distinct from one another.

### The Instagram-native surface this batch adds (reusable)

| Addition | Where | Used by |
| --- | --- | --- |
| A **`photo` beat** in a DM, behind the app's sensitive-content screen; "See photo" is local and reveals only a drawn frame and a one-line description | `IgBlocks.jsx` `PhotoBeat` | I17 |

Everything else is reused unchanged: `SOCIAL` views `profile`, `about`, `people`, `post`, `story`,
`status`, `settings`, `list`; profile `actions`, `pinnedTo`, `compareTo`, `bioLink`; `BROWSER` (the
questionnaire); `PAYSHEET` (the wallet transfer); `APP` (Release Register, Support & Reporting, Unit
Orders, Unit Bulletin, Research & Media Requests); `CALL`; the trusted-directory overlay; every beat
kind in `scenes/instagram/shared.js`. The consent card is a `status` page, the tag-review list a
`settings` page, the location card a `list` page and the story composer a `story` page — each a new
*use* of an existing view.

---

## 1. I16 — Approved Photo Release Request

### Client scenario (authoritative)

Specification page 52. Instagram, **Medium**, **Legitimate**, family *Legitimate public-affairs
workflow*, trigger *Authority + pride | FICTIONAL MILITARY CONTEXT*. Canonical identity computed by the
import service: family `legit_coordination_request`, triggers `authority` + `pride`, military flag
**true**, level `medium`.

- **Stage 1 (Event).** "@unitfalcon_public: Approved image PF-204 is ready. Confirm your consent in
  the in-app card."
- **Stage 2 (Open).** "Open the established admin DM and tagged draft." Context: a known
  public-information admin asks the learner to approve a previously reviewed, non-sensitive photo.
- **Stage 3 (Inspect).** Known admin handle, local approval ID, image status and consent scope.
  Decision signal: *"The request matches the synthetic release register and asks only for in-app
  consent, not operational data."*
- **Stage 4 (Branch).** "A consent card showing the approved image, scope and Confirm/Decline."
  Expected: *use the normal in-app path only after the details match; do not switch to an untrusted
  channel.*
- **Stage 5 (Verify).** "Compare image ID PF-204 with the local public-release register. If it
  matches, continue; do not report or block a legitimate sender."
- **Stage 6 (Resolve).** "Confirm or decline the matching consent card; do not report the verified
  admin."
- **End state / feedback.** Consent is recorded against the approved image only; a legitimate
  publication request is specific, verifiable and limited.

### MITRE ATT&CK alignment

**There is none, and none has been invented.** ATT&CK catalogues adversary behaviour. In I16 there is
no adversary: the unit's own public-information page asks a person who appears in a cleared
photograph whether they agree to appear, through the platform's own consent mechanism. Mapping a
technique would mean mapping the learner's own over-disclosure, which ATT&CK does not model.

**Closest defensible behavioural reference** — deliberately not an ATT&CK technique:

- US Army, "Social Media Safety", on what belongs in a caption and how small details aggregate
  (<https://www.army.mil/socialmedia/safety/>).
- Instagram Help Center on tag review and "Manually approve tags" (<https://help.instagram.com/>) —
  the platform mechanism the consent card is built on.
- UK NCSC, "Social media: how to use it safely"
  (<https://www.ncsc.gov.uk/guidance/social-media-how-to-use-it-safely>).

The defensive frame is disclosure discipline and using the normal in-app path, stated rather than
quietly omitted.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The notification row's second line and the fifth message of the thread |
| "Established admin DM" | A main-inbox thread with August and September messages about PF-198 and PF-201 |
| "Tagged draft" | Tags and mentions › Preview the tagged post (`post` page, "Draft · not published") and a system beat saying tag review is holding it |
| Known admin handle, image status, consent scope | Verified since 2019, joined 2017, no former usernames; the card's Image / Where it will appear / What you are asked rows |
| "Local approval ID" | PF-204 on the card, in the thread and in the register |
| "Consent card … Confirm/Decline" | `tags` › `card`, with both controls |
| "Use the normal in-app path" | Both card answers are `safe_pivot` → `CORRECT_USE` |
| "Do not switch to an untrusted channel" | Asking for a link to sign, and sending date/place/sub-unit, both `-4` |
| "Compare PF-204 with the local public-release register" | `verify_known_app` opens the Release Register |
| "Do not report or block" | `report` / `block` at verify score `-4`; report/block/ignore at resolve score `-4` |
| Military content fictional | Unit Falcon, a sports day, a pavilion — nothing real |

### Enhanced synthetic storyline

In August the page's admin told the learner the sports-day set had been cleared and that nobody would
appear without answering a card. In September PF-198 went up after the learner confirmed. Today the
client's sentence arrives, followed by what the card will show and an explicit "decline and we will
crop you out, no need to explain". Instagram adds a line that tag review is holding the post. At the
branch, the admin adds that the card stays open until Friday.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast, from the client's sentence |
| Open | Notifications: the consent/tag row among ordinary activity |
| Inspect | The established thread and the tag-review notice |
| Branch | "No rush — the card stays open until Friday"; the tag request is openable from the notice |
| Verify | The consequence: no link exists, or the typed detail sitting in a thread it was never needed in |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. Verified, joined March 2017, no former usernames, 214 mutual follows (About).
2. The profile's Call action carries the same number as the trusted directory's desk.
3. The pinned "How we publish": release ID, consent card, never links, never locations or dates.
4. "Recently published": PF-201 and PF-198 confirmed on cards; PF-190 withdrawn when one person
   declined — declining is a normal outcome.
5. The card: one image, one ID, one scope, one question.
6. The register: PF-204 cleared 14 September, scope this page only, consent 2 of 3 — the learner's
   outstanding.

### Learner interaction journey

Notify → open the thread → open the page's profile, About, pinned post and release log → open the tag
request, preview the draft, open the card → **Confirm or Decline** → open the Release Register → keep
following the page.

### Simulation surfaces

- `profile` (`SOCIAL`): `profile` (with Call/Email actions), `about`, `pinned` (`post`),
  `releases` (`list`).
- `tags` (`SOCIAL`): `pending` (`settings`) → `card` (`status`), `draft` (`post`).
- `register` (`APP`): Release Register.
- `call` (`CALL`): the public-information desk on the directory number.
- The trusted-directory overlay, with the page's own handle as an approved row.

### Verification mechanism

`verify_known_app` opens the register (the client's named route); `verify_trusted_directory` and
`verify_known_number` are the other independent routes. Asking in the thread is
`verify_in_message_contact` (`0`); reporting or blocking a genuine sender is `-4`.

### Safe resolution

`resolve_continue` or `resolve_retain`, `+2`. Full safe path: `open_item → read → inspect_profile →
safe_pivot (Confirm) → verify_known_app → resolve_continue` = **10**. Declining on the card scores
identically.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Send date, place and sub-unit for the caption | `submit_data` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Ask for a link to sign instead | `reply` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Leave the request pending | `reject_ignore` | `NEEDLESS_REJECT_IGNORE` | −2 |
| Reply "ok" from the notification | `reply` at open | `PREMATURE_REPLY` | −1 |
| Report or block the page | `report` / `block` | `FALSE_REPORT_BLOCK` | −4 |
| Report, block, or delete and unfollow at the end | `resolve_report` / `resolve_block` / `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `CORRECT_USE +3`, `NEEDLESS_REJECT_IGNORE −2` and `UNSAFE_EXTERNAL_ACTION −4`.
`safe_pivot` resolves to `CORRECT_USE` because the scenario declares it; every other risky intent
resolves to the `−4` code, as on I03, I07 and I11.

### Realism decisions

- Declining is offered as a first-class answer, because a consent card that can only be accepted is
  not a consent card, and the page's own history shows a withdrawn frame.
- The over-disclosure is the learner being helpful, which is the realistic failure on a genuine item.

### Known limitations

- One decision per stage: the card's answer is the branch decision, so the thread cannot also be
  replied to at that stage.
- The register is an authored screen, not live data.
- The result and review cards show the bank's placeholder sender.

### Why the final simulation stays faithful

Every client element is present: the established DM, the tagged draft, the ID, the scope, the card
with both answers, the register comparison and the rule against reporting. The scene's addition is
putting the decision where Instagram actually puts it.

---

## 2. I17 — Morphed-Photo Blackmail

### Client scenario (authoritative)

Specification page 53. Instagram, **Medium**, **Malicious**, family *Image-based extortion*, trigger
*Fear + shame + isolation*. Canonical identity: family `coercion_and_extortion`, triggers `fear` +
`shame_embarrassment` + `isolation_secrecy`, military flag **false**, level `medium`.

- **Stage 1 (Event).** "@private_case_404: Pay tonight or this edited image goes to everyone you
  follow."
- **Stage 2 (Open).** "Open the DM request with safety-blurred image."
- **Stage 3 (Inspect).** Unknown account, extortion demand, countdown and crypto payment handle.
  Decision signal: *"Paying or negotiating does not guarantee removal and may increase demands;
  evidence and support matter."*
- **Stage 4 (Branch).** "A payment panel and threatening follow-up timer." Expected: *do not pay, send
  more images, negotiate alone or delete all evidence.*
- **Stage 5 (Verify).** "Use the platform report path and approved unit/law-enforcement support
  route."
- **Stage 6 (Resolve).** "Do not pay or respond; preserve evidence; report/block; seek approved
  support promptly."
- **Feedback.** "You are not at fault. Do not pay or comply; preserve evidence, report the account and
  seek trusted support."

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1585.001** Establish Accounts: Social Media Accounts | <https://attack.mitre.org/techniques/T1585/001/> | Strong. A throwaway account created this month, renamed twice, following 1,204 accounts to find targets. |
| **T1657** Financial Theft | <https://attack.mitre.org/techniques/T1657/> | **Partial fit, stated.** The technique names extortion as a means of theft, which is the objective here. Its description and procedure examples are organisational (ransomware, BEC, employees of victim organisations); it does not describe extortion of a private individual with an edited image. |

**Why this maps.** The account is established for the purpose (T1585.001) and the objective is money
extracted by threat (T1657). Neither technique describes the shame lever or the image, and this
section does not pretend otherwise: the behavioural core of I17 is documented by the FBI and NCMEC
sources in §0.2, not by ATT&CK.

**Considered and rejected.** **T1565 Data Manipulation**
(<https://attack.mitre.org/techniques/T1565/>) is manipulation of data inside a victim's systems to
affect its decisions; the edited image is made outside anything the learner owns. **T1491
Defacement** (<https://attack.mitre.org/techniques/T1491/>) mentions disturbing images used to
pressure compliance, but defacement modifies an organisation's own visual content; nothing of the
learner's is modified. Both are named only to say why they do not apply.

**What must NOT be copied.** No real image, likeness or explicit content of any kind — the "photo" is
a drawn frame behind a screen, and its revealed caption says only that a profile picture was pasted
onto another picture. No real wallet address format, chain or exchange; no real reporting portal
workflow. The scene contains no victim-blaming language, and a test asserts it.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The request row's preview, and the third message |
| "DM request with safety-blurred image" | `request: true`; the `photo` beat behind "Sensitive content" |
| Unknown account | Request card: 0 posts, 6 followers; About: joined this month, two renames |
| Extortion demand, countdown | The sentence, "tell nobody", the follower-list threat, the timer beat, "the clock is running" at the branch |
| Crypto payment handle | A wallet address in the thread, and the wallet sheet it opens |
| "Payment panel" | `pay` (`PAYSHEET`), PIN then Send |
| "Do not pay, send more images, negotiate alone" | Pay and send-a-photo are `−8`; plead is `−3` |
| "Delete all evidence" | Priced at resolve: "Delete the whole chat and tell nobody" → `−4` |
| Platform report path and support route | `verify_known_app` → Support & Reporting; `verify_known_number` → welfare desk |
| "Seek approved support promptly" | The desk says it will stay on the line while the learner reports |

### Enhanced synthetic storyline

A message request opens with "Don't ignore this. I have something with your face on it." A photo sits
under Instagram's own sensitive-content screen. Then the client's sentence, then the lever: the
follower list, "your family is in it", "tell nobody and don't report — that only makes it faster".
Then the price, a wallet address and a doubling deadline, and a timer. At the branch: "I can see you
have read it. The clock is running."

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast |
| Open | Messages; the item is under **Requests** |
| Inspect | The request card, the photo behind its screen, the demand, the wallet, the timer |
| Branch | The follow-up pressure |
| Verify | The consequence: the amount rises after a reply; more photos are demanded; the transfer is irreversible and a second demand follows |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. No posts, six followers, following 1,204 (request card and profile).
2. Joined this month; former usernames `case_file_221` and `private_case_318` (About).
3. Followers are this month's empty accounts; none of the learner's follows follow it.
4. The photo is already screened by the platform; revealing it shows a profile picture pasted onto
   another picture.
5. The wallet sheet: no name, not reversible, no reference.
6. The Details screen: Restrict hides them without telling them and keeps the chat.
7. Support & Reporting: keep, stop, report — and "you are not the one in trouble".

### Learner interaction journey

Notify → open the request → open the profile, About and followers → optionally reveal the screened
photo and open the wallet sheet (Back cancels) → **don't engage, or Restrict** → open Support &
Reporting or ring the welfare desk → report, keeping the chat.

### Simulation surfaces

- `profile` (`SOCIAL`): `profile`, `about`, `followers` (`people`).
- `pay` (`PAYSHEET`): the wallet transfer, PIN then Send.
- `safety` (`SOCIAL`): `controls` (`settings`), carrying the Restrict control.
- `support` (`APP`): Support & Reporting.
- `call` (`CALL`): the welfare desk.

### Verification mechanism

`verify_known_app` opens Support & Reporting; `verify_known_number` rings the welfare desk on the
directory number; `verify_trusted_directory` lists the desk and a cyber-crime reporting line. Asking
the account to prove what it has is `0`. Reporting or blocking without checking is `+1`.

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_profile →
safe_pivot → verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Send the money | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Send a "real" photo to prove it is edited | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Plead for time | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Pay without opening | `attempt_payment` at open | `PREMATURE_REPLY` | −1 |
| Ask them to prove it | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |
| Wait and see / accept the request / delete everything and tell nobody | `resolve_continue` / `resolve_retain` / `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3` and `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.
`reject_ignore` is not declared on this malicious item and is not offered.

### Realism decisions

- The platform's own sensitive-content screen is how such an image arrives, so the scene shows it
  that way and never shows an image.
- Restrict is offered because it is the platform tool that stops the pressure without destroying the
  record.
- The support voice is the one the FBI and NCMEC guidance uses: not your fault, not in trouble.

### Known limitations

- The payment sheet's Send appears only after a PIN is typed, as on every payment sheet in the
  product; its Back is the local cancel.
- The countdown is text; nothing on the device runs a timer.
- The result and review cards show the bank's placeholder sender.

### Why the final simulation stays faithful

Every client element is present: the request, the blurred image, the unknown account, the demand,
countdown and crypto handle, the payment panel, the ban on paying, sending more or deleting evidence,
the report path and the support route. The scene adds the platform's own tools and a voice that does
not blame.

---

## 3. I18 — High-Fidelity Teammate Clone

### Client scenario (authoritative)

Specification page 54. Instagram, **Hard**, **Malicious**, family *Profile cloning / location
elicitation*, trigger *Familiarity + urgency | FICTIONAL MILITARY CONTEXT*. Canonical identity:
family `operational_elicitation`, triggers `familiarity` + `urgency`, military flag **true**, level
`hard`.

- **Stage 1 (Event).** "@arjun.k_singh: New private account. Send tomorrow's assembly point so I
  don't miss it." (Stored truncated; §0.5.)
- **Stage 2 (Open).** "Open the DM and highly copied profile." Context: bought followers, copied
  posts, many mutuals, then a meetup-location request.
- **Stage 3 (Inspect).** Username history, creation date, mutual timing, copied captions and the
  private request. Decision signal: *"Follower count and mutuals can be manufactured; a new account
  still cannot receive protected schedule/location details."*
- **Stage 4 (Branch).** "A map/location reply card." Expected: *do not send assembly point, live
  location, schedule or roster detail.*
- **Stage 5 (Verify).** "Contact the teammate through the previously known account/number and check
  the approved schedule channel."
- **Stage 6 (Resolve).** "Send nothing; report the clone; notify the real teammate and unit security."

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1585.001** Establish Accounts: Social Media Accounts | <https://attack.mitre.org/techniques/T1585/001/> | Strong. The technique describes personas that impersonate real people, with developed history and connections made "through others" — the forty mutuals. |
| **T1684.001** Social Engineering: Impersonation | <https://attack.mitre.org/techniques/T1684/001/> | Strong. The account presents as a specific teammate. |
| **T1593.001** Search Open Websites/Domains: Social Media | <https://attack.mitre.org/techniques/T1593/001/> | Strong. The copied photographs and captions could only come from searching the teammate's own account. |
| **T1598.001** Phishing for Information: Spearphishing Service | <https://attack.mitre.org/techniques/T1598/001/> | Strong. The request for information is made over the platform's messaging. |
| **T1591.001** Gather Victim Org Information: Determine Physical Locations | <https://attack.mitre.org/techniques/T1591/001/> | **Partial fit, stated.** An assembly point is a physical location of the organisation's activity rather than of its infrastructure, which is the technique's emphasis. |
| **T1591.003** Gather Victim Org Information: Identify Business Tempo | <https://attack.mitre.org/techniques/T1591/003/> | **Partial fit, stated.** "The time" is operational tempo, but for one event rather than routine hours. |

**Why this maps.** Build a persona matching a real person, seed it with their public content, attach
it to their network, then ask a colleague for where and when. Each step is one technique's own
description.

**Considered and rejected.** **T1586.001 Compromise Accounts: Social Media Accounts**
(<https://attack.mitre.org/techniques/T1586/001/>) — the teammate's own account is untouched; this is
a new account, not a compromised one (contrast I15). **T1430 Location Tracking**
(<https://attack.mitre.org/techniques/T1430/>) is collection through device APIs or malware; here a
person would press Send.

**What must NOT be copied.** No real person's name pattern, photograph, unit, assembly practice,
timing or place. "05:00 at the old pavilion gate" is the scene's only operational-sounding string,
exists only as the unsafe echo, and describes nothing real.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence | The list preview and the first message today, beginning with the stored text |
| "Highly copied profile", bought followers | 4,588 followers, 49 posts all posted three to four days ago, followers from this month |
| Many mutuals | "Followed by anjali.m, dev_fit and 38 others you follow" |
| Username history, creation date | About: joined 8 September 2026, two former usernames |
| Mutual timing | Followers page: every known mutual followed it in the last two days |
| Copied captions | Pinned post's caption equals the other account's 14 March post; a mutual asks "wasn't this the March run?" |
| "Map/location reply card" | `map` (`SOCIAL` `list`), opened from the map the account shared |
| "Previously known account/number" | `@arjun.ks` (compare page) and the saved number |
| "Approved schedule channel" | Unit Orders: Arjun acknowledged MO-114 on 15 September |
| "Notify the real teammate and unit security" | The call, and the resolve banner's report label |

### Enhanced synthetic storyline

Yesterday the learner followed the new account back — mutuals everywhere — and chatted about the lost
login. Today it asks for tomorrow's assembly point, says it will not pass the office, and shares a map
asking "is it near here?". At the branch: "leaving in 10".

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast |
| Open | Messages, main inbox, with the older `arjun.ks` thread from March lower down |
| Inspect | Yesterday's follow-back and chat; today's ask and the map |
| Branch | The ten-minute pressure; the location card is openable from the map |
| Verify | The consequence: "mic is broken, just send the pin", or the account unfollowing and emptying |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. Numbers that look right (followers, mutuals, photographs).
2. About: nine days old, based outside India, renamed twice.
3. Followers: this month's empty accounts; known mutuals only since yesterday.
4. The pinned post: a caption word-for-word from `@arjun.ks`'s 14 March post, with a mutual's comment.
5. `@arjun.ks`: joined 2014, no renames, last post 14 March — the account the learner has followed
   since 2019, and the older thread in the inbox.
6. Unit Orders: the teammate already has tomorrow's details.

### Learner interaction journey

Notify → open the chat → profile, About, followers, pinned post, the other account → open the
location card → **close it, or send nothing** → ring Arjun or open Unit Orders → report and tell him
and security.

### Simulation surfaces

- `profile` (`SOCIAL`): `profile`, `about`, `followers` (`people`), `pinned` (`post`), `other`
  (`profile`), `otherpost` (`post`).
- `map` (`SOCIAL` `list`): the DM location card.
- `schedule` (`APP`): Unit Orders.
- `call` (`CALL`): Arjun's saved number.

### Verification mechanism

`verify_known_number` rings the saved number; `verify_known_app` opens Unit Orders;
`verify_trusted_directory` lists the support desk and the saved contact. Asking the account "a
question only Arjun would know" is `0`. Report or block unchecked is `+1`.

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_profile →
safe_pivot → verify_known_number → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Send the assembly-point pin | `share_location` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Type the time and place | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Ask whether it is really him | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Reply from the list | `reply` at open | `PREMATURE_REPLY` | −1 |
| Keep following / carry on / unfollow quietly | `resolve_retain` / `resolve_continue` / `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.
`share_location` and `submit_data` both resolve to the release code, and their shared consequence beat
describes both (§8).

### Realism decisions

- The copy is placed in the main inbox because the learner followed it back — that is how
  high-fidelity copies get past request filtering.
- The comparison account is a page the learner can walk to, because comparing is the lesson.

### Known limitations

- "Based outside India" is authored; the scene does not model VPNs or how the platform derives it.
- The result and review cards show the bank's placeholder sender.

### Why the final simulation stays faithful

Every client element is present — the copied profile, manufactured social proof, username history,
creation date, mutual timing, copied captions, the location card, both verification routes and the
report. The scene's addition is making every numeric check pass so only history decides it.

---

## 4. I19 — Urgent Unit Incident Repost

### Client scenario (authoritative)

Specification page 55. Instagram, **Hard**, **Malicious**, family *Disinformation / amplification
lure*, trigger *Fear + duty | FICTIONAL MILITARY CONTEXT*. Canonical identity: family
`disinformation_amplification`, triggers `fear` + `duty_compliance`, military flag **true**, level
`hard`.

- **Stage 1 (Event).** "@breaking_defence_now: URGENT incident at Unit Falcon - repost before it is
  deleted."
- **Stage 2 (Open).** "Open the viral post and reshare tray."
- **Stage 3 (Inspect).** Source history, absent official confirmation, recycled image and urgency to
  amplify. Decision signal: *"Unverified crisis content can expose, misinform or amplify manipulation;
  speed is not a substitute for confirmation."*
- **Stage 4 (Branch).** "A reshare composer with Add location/Tag personnel options." Expected: *do
  not repost, speculate, tag personnel or add location.*
- **Stage 5 (Verify).** "Check approved official statements and alert the unit public-information/
  security route."
- **Stage 6 (Resolve).** "Do not repost; report misinformation/impersonation if applicable; preserve
  link for review."

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1585.001** Establish Accounts: Social Media Accounts | <https://attack.mitre.org/techniques/T1585/001/> | Strong. An eleven-day-old persona recycled through a cricket name and a finance name. |
| **T1591.001** Gather Victim Org Information: Determine Physical Locations | <https://attack.mitre.org/techniques/T1591/001/> | **Partial fit, stated.** The composer invites a location sticker for the unit's area; the post's primary aim is amplification, and location collection is a side effect the client names. |
| **T1591.004** Gather Victim Org Information: Identify Roles | <https://attack.mitre.org/techniques/T1591/004/> | **Partial fit, stated.** "Mention the people you know were on duty" surfaces who holds which role, again as a by-product. |

**Why this maps.** ATT&CK does not model influence operations; the behaviour at the centre of I19 —
fabricating a crisis and recruiting the audience to spread it — is outside the matrix, and the
closest behavioural reference is the DISARM framework and CISA's disinformation guidance (§0.2),
cited as non-ATT&CK references. What ATT&CK does describe is the recycled account and the
information the amplification would leak.

**Considered and rejected.** **T1491.002 External Defacement**
(<https://attack.mitre.org/techniques/T1491/002/>) — nothing belonging to the unit is modified; the
false post is on the adversary's own page. **T1566.003 Spearphishing via Service**
(<https://attack.mitre.org/techniques/T1566/003/>) is payload delivery for initial access; there is no
link or attachment to execute here.

**What must NOT be copied.** No real outlet's name or layout, no real incident, unit, place or
casualty language, no real sticker text beyond "URGENT". The "April fuel depot" post is invented.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence | The notification row and the start of the caption |
| "Viral post" | 18,402 likes; "Shared 12,400 times in the last hour"; comments reposting |
| "Reshare tray" | Share… → `share` › `tray` |
| Source history | About: joined 5 September, two former usernames |
| Absent official confirmation | A comment asking for anything official; the unit page's last post three hours ago; the bulletin |
| Recycled image | The page's own April post (under an earlier name) with the same frame; a commenter saying so |
| Urgency to amplify | "before the page is taken down"; the page telling a commenter official statements come late |
| "Reshare composer with Add location/Tag personnel" | `share` › `story`, with the location and mention controls |
| "Check approved official statements" | Unit Bulletin — no statement today |
| "Alert the public-information/security route" | The cell's call; the resolve label sends it the link |
| "Preserve link for review" | Bulletin: keep the link unshared; resolve labels |

### Enhanced synthetic storyline

A page mentions the learner among dozens under a dramatic three-slide post. Comments split between
"reposted, share!" and "is there anything official?" — and the page replies that official statements
always come late. At the branch, a friend tags the learner: "you'd know — is this true?? my mother
keeps calling me".

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast |
| Open | Notifications, with the unit page's ordinary sports-day post below |
| Inspect | The post, caption, share count and comments |
| Branch | The friend's question; Share… is available in the options |
| Verify | The consequence: public, under the learner's name; or live with detail the post did not have |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. "News & media website", not verified, 11 days old, two former usernames about other topics.
2. The grid: alarmist posts every few days.
3. The pinned April post, under `breaking_finance_now`, with the same frame and a different disaster.
4. The unit page: last post three hours ago, sports-day results.
5. The Unit Bulletin: no statement issued; how statements are made; who to call.

### Learner interaction journey

Notify → open the post → read the comments, open the page's profile, About and April post, and the
unit page → optionally open Share…, the story composer → **close without sharing, or don't share** →
open the Unit Bulletin or ring the cell → report and send the link to the cell.

### Simulation surfaces

- `profile` (`SOCIAL`): `profile`, `about`, `april` (`post`), `unit` (`profile`).
- `share` (`SOCIAL`): `tray` (`settings`) → `story` (`story`).
- `bulletin` (`APP`): Unit Bulletin.
- `call` (`CALL`): the public-information cell.

### Verification mechanism

`verify_known_app` opens the Unit Bulletin; `verify_known_number` rings the cell;
`verify_trusted_directory` lists the desk and the unit page. Asking the page for its source is `0`.
Report or block unchecked is `+1`.

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_profile →
safe_pivot → verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Add a location sticker and post | `share_location` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Mention people on duty and post | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Post to story as it is | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Comment "praying for everyone" | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Share from the notification | `reply` at open | `PREMATURE_REPLY` | −1 |
| Follow for updates / save it / scroll on | `resolve_continue` / `resolve_retain` / `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3` and `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.
A plain repost is priced as risky engagement; adding location or personnel is priced as the release,
matching the client's list ("repost, speculate, tag personnel or add location").

### Realism decisions

- The learner is mentioned rather than messaged, because that is how amplification pages recruit.
- The friend's question makes "I'll just correct it" tempting; the scene offers no correction route
  that is safe in public.

### Known limitations

- The share counts are static text; nothing grows in real time.
- One decision per stage: posting and commenting are alternatives.
- The result and review cards show the bank's placeholder sender.

### Why the final simulation stays faithful

Every client element is present: the viral post, the reshare tray and composer with location and
personnel options, the source history, the missing official statement, the recycled image, the
official-statements check, the security route and the report with the link preserved.

---

## 5. I20 — Researcher Asks Capability Questions

### Client scenario (authoritative)

Specification page 56. Instagram, **Hard**, **Malicious**, family *Rapport-based elicitation /
espionage pretext*, trigger *Expert status + flattery | FICTIONAL MILITARY CONTEXT*. Canonical
identity: family `operational_elicitation`, triggers `expert_status` + `flattery`, military flag
**true**, level `hard`.

- **Stage 1 (Event).** "@defence_research_lab: Your experience is valuable. Which system fails most
  often in field conditions?"
- **Stage 2 (Open).** "Open the long-running DM and researcher profile." Context: a credible-looking
  researcher interacted normally for weeks, then asks about equipment limitations.
- **Stage 3 (Inspect).** Institution mismatch, unverifiable publications, narrow capability questions
  and gradual escalation. Decision signal: *"A plausible professional identity does not create
  authorization to discuss capabilities or limitations."*
- **Stage 4 (Branch).** "A structured interview form requesting equipment, readiness and routine
  details." Expected: *do not answer, correct public speculation with nonpublic facts, or upload
  photos.*
- **Stage 5 (Verify).** "Route the request to the approved public-information/security contact for
  authorization."
- **Stage 6 (Resolve).** "Decline to discuss; report the elicitation attempt internally;
  restrict/block per policy."

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1598.001** Phishing for Information: Spearphishing Service | <https://attack.mitre.org/techniques/T1598/001/> | Strong. Information is elicited through a month of messaging. |
| **T1598.003** Phishing for Information: Spearphishing Link | <https://attack.mitre.org/techniques/T1598/003/> | Strong. A link to a page built to collect the information. |
| **T1585.001** Establish Accounts: Social Media Accounts | <https://attack.mitre.org/techniques/T1585/001/> | Strong. A fictitious research persona with developed history, a renamed account and affiliations it will not state. |
| **T1591.003** Gather Victim Org Information: Identify Business Tempo | <https://attack.mitre.org/techniques/T1591/003/> | **Partial fit, stated.** "Days per month out of use" is readiness tempo rather than business hours. |
| **T1591.004** Gather Victim Org Information: Identify Roles | <https://attack.mitre.org/techniques/T1591/004/> | **Partial fit, stated.** The form's first page asks role, unit and years of service. |

**Why this maps.** Build a credible persona, cultivate a target over weeks, then deliver a collection
page and ask directly. The equipment-limitation questions themselves have no exact ATT&CK home (see
below); the US NCSC, NPSA and FBI elicitation guidance in §0.2 is the behavioural reference for them.

**Considered and rejected.** **T1592 Gather Victim Host Information**
(<https://attack.mitre.org/techniques/T1592/>) is about computers — names, OS, software, hardware and
user agents. "Which system fails" is about field equipment, and mapping it here would confuse the two
meanings of "system". **T1684.001 Impersonation** (<https://attack.mitre.org/techniques/T1684/001/>)
— the persona does not pose as a specific trusted entity; it is fictitious, which T1585.001 already
describes.

**What must NOT be copied.** No real equipment names, failure modes, rates, readiness figures or
routines; no real research institution, journal or ethics body. "The mounts crack in dust" and "one
in ten" exist only as the unsafe echoes and describe nothing real.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence | The list preview and today's first message |
| "Long-running DM" | Four day separators from 17 August; the learner's own replies |
| "Interacted normally for weeks" | Permission to quote, a harmless note, anonymous citation, compliments |
| Institution mismatch | "Independent" in its pinned reply vs "Instagram has not confirmed any organisation"; managed from three countries |
| Unverifiable publications | The note is its own; a contributor never received the promised note |
| Narrow questions, gradual escalation | Years → role → unit → which system → failures → days out of use; then "photos of wear" |
| "Structured interview form" | `interview` (`BROWSER`), three pages and a review, address from the bank asset |
| "Do not answer / correct … / upload photos" | Submit, answer and correct are `−8`; the photo page is named on the review |
| "Approved public-information/security contact" | `verify_known_number`; and the Research & Media Requests register |
| "Decline; report internally; restrict/block" | The resolve banner label and the block option |

### Enhanced synthetic storyline

In August the account asked, politely, to quote a caption. Later it shared a note, quoted the learner
anonymously and said real field experience is rare. In September it mentioned a short form. Today it
asks the client's question and points to the form and a page for photographs. At the branch: "Even one
line here would help."

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast |
| Open | Messages, main inbox |
| Inspect | Four dated sections of an ordinary-looking professional thread |
| Branch | The soft follow-up; the questionnaire is openable from the message |
| Verify | The consequence: "General is perfect — which generation…?", or a request to be introduced to colleagues |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. Joined January 2026, renamed in March, not verified, no mutual follows.
2. "Managed from 3 countries"; no organisation confirmed.
3. The pinned call for contributors: "which university?" answered with "shared with contributors
   only"; "filled this in July, never received any note".
4. The bio link opens the same questionnaire.
5. The questionnaire's escalation and its review row naming everything it receives.
6. The register: no request on record; four similar approaches this year, none authorised.

### Learner interaction journey

Notify → open the chat → read back through August and September → profile, About, pinned post →
optionally open the questionnaire and walk it → **close it, or decline to discuss** → ring the
security contact or check the register → decline, report internally, restrict.

### Simulation surfaces

- `profile` (`SOCIAL`): `profile` (bio link to the form), `about`, `followers` (`people`), `pinned`
  (`post`).
- `interview` (`BROWSER`): `intro` → `about` → `kit` → `review` → `done`.
- `requests` (`APP`): Research & Media Requests.
- `call` (`CALL`): the public-information/security contact.

### Verification mechanism

`verify_known_number` rings the contact; `verify_known_app` opens the register;
`verify_trusted_directory` lists the contact. Asking the account for its university and ethics
approval is `0`. Report or block unchecked is `+1`.

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_profile →
safe_pivot → verify_known_number → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Submit the questionnaire | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Answer the question in the chat | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Correct their figure with yours | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| "Only in general terms" | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Answer from the list | `reply` at open | `PREMATURE_REPLY` | −1 |
| Keep chatting / keep it open / stop replying and tell nobody | `resolve_continue` / `resolve_retain` / `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.
All three releases share `simulated_data_submission`, and the consequence beat is worded to be true of
each.

### Realism decisions

- The general answer is priced as engagement, and its consequence shows why: it invites a narrower
  follow-up.
- The form is anonymous in its words and identifying in its fields.

### Known limitations

- The photo page is named, not built; the release is decided before it.
- The result and review cards show the bank's placeholder sender.

### Why the final simulation stays faithful

Every client element is present: the long-running DM, the credible profile, the institution mismatch,
the unverifiable publications, the narrow and escalating questions, the structured form, the
correction trap, the photo request, the authorisation route and the internal report.

---

## 6. Forms, inputs and data handling

Three screens in this batch accept typing: I17's wallet sheet (a six-digit PIN) and I20's two
questionnaire pages (years, role, unit; system, failures, days out of use). They obey the rules
`SceneForms.test.jsx` and `SceneContainment.test.jsx` already enforce on every earlier batch:

- **Local.** Every value lives in `useLocalForm` state inside the component that draws the field. It
  is never lifted, never passed to an affordance, never put in an intent or in metadata.
- **Ephemeral.** Leaving the screen unmounts the component and the state is gone; walking to the next
  browser page discards the previous page's values by remount.
- **Never transmitted.** No `fetch`, no `<form>`, no action, no submit event. The commit control is an
  ordinary button carrying a scene affordance — an intent and an optional asset id, nothing else.
- **Never persisted.** No `localStorage`, `sessionStorage`, IndexedDB, cookie or cache holds a typed
  value; a reload rebuilds the run from the committed stage with the fields empty.
- **Never logged.** No console output, no analytics, no event payload. The engine's
  `METADATA_ALLOWLIST` rejects any metadata key it does not know.
- **No autofill surface.** Every input is `type="text"` with `autoComplete="off"` and a meaningless
  `name`; the PIN is masked by CSS, never `type="password"`.
- **No form submission.** A page's `primary` control validates length and walks to the next page; it
  scores nothing.
- **Deterministic.** A field is satisfied by its character count. Same input, same result.
- **Not decorative.** The fields are real inputs, because declining to type an answer is the decision.

I16, I18 and I19 have no typed fields at all: their decisions are a consent card, a location card and
a story composer. I17's revealed "photo" is a drawn frame. No field accepts a real credential, card,
wallet key, capability figure or document.

## 7. What is asserted, and where

| Claim | Test |
| --- | --- |
| Every I16–I20 control resolves to a legal transition on its own pinned definition | `backend/tests/sceneAffordance.test.js` |
| Each safe path scores exactly ten, in six stages, and produces the positive review card | `backend/tests/sceneAffordance.test.js` |
| Each named control keeps its event code and point value | `backend/tests/sceneAffordance.test.js` |
| I17–I20 never offer `reject_ignore`, which the engine refuses on them | `backend/tests/sceneAffordance.test.js`, `sceneModel.test.js` |
| The review explains the unsafe walks with each scenario's own correct action, and leaks no scoring code, point value or placeholder | `backend/tests/sceneAffordance.test.js` |
| No branch-stage shape repeats any of the earlier forty scenes, or any other in the batch | `frontend/src/simulation/sceneModel.test.js` |
| No disposition, family, trigger, end state, feedback, narrator line or verdict word reaches the device | `frontend/src/simulation/sceneModel.test.js` |
| Every host is `*.training.example`; every number is in the reserved range | `frontend/src/simulation/sceneModel.test.js` |
| I18's truncated sentence is extended from the stored text, never paraphrased | `frontend/src/simulation/sceneModel.test.js` |
| I20's form address comes from the pinned asset, and no control opens its stored body | `frontend/src/simulation/sceneModel.test.js` |
| No `href`, `src`, `iframe`, `form`, media element or host handler on any screen | `SceneContainment.test.jsx`, `SceneScenariosInstagramD.test.jsx` |
| Typed values never leave the component, the screen or the session | `SceneForms.test.jsx`, `SceneScenariosInstagramD.test.jsx` |
| The five scenarios play end to end through the real controller and attempt API | `frontend/src/pages/SceneScenariosInstagramD.test.jsx` |
| This document covers every authored scenario and cites every technique it names | `frontend/src/simulation/sceneResearch.test.js` |

## 8. Findings during verification

Recorded as they were found, with what was done about each.

1. **A close control hidden behind a PIN.** I17's first draft put "Close the transfer without
   sending" on the payment sheet, where every control appears only once a PIN is typed. A safe action
   that requires typing a PIN first is a trap, so it was removed; the sheet's Back is the local
   cancel, and Restrict and not engaging remain the safe routes.
2. **Shared consequences described one route.** I18's pin and typed place, and I19's story repost and
   comment, share a consequence; the first drafts' banners described only one of each pair. Reworded
   to be true of both — the rule 004C recorded.
3. **A label on the item before resolution.** I17's directory row described the reporting line as
   covering "extortion". The directory is visible before resolution, so the word was removed; the
   batch's verdict-word ban now includes it.
4. **A coarser differentiation signature than branch shape.** A new assertion compared *where* each
   branch decision is made. I20 shares "DM + browser form + composer" with I02 and I12 — which already
   share it with each other. The assertion now requires I16–I19 to be new, the five to differ from
   one another, and records I20's overlap explicitly rather than loosening the signature to hide it.
5. Browser-play findings are recorded in `PROJECT_MASTER_PLAN.md` alongside the test totals.
