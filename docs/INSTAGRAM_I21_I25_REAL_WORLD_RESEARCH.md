# Instagram I21–I25 — real-world research and storyline reconstruction

**Task:** IMMERSIVE-004E — the fifth and final Instagram batch
**Naming:** the client's bank numbers every Instagram scenario `I01`–`I25` (specification pages
36–61); this batch is **I21–I25** in the data, the registry, the tests and this document, and it
corresponds to specification **pages 57–61**.
**Scope:** Instagram I21, I22, I23, I24, I25 only. WhatsApp W01–W25 and Instagram I01–I20 are
complete and unchanged in behaviour; Email and SMS are untouched. With this batch all twenty-five
Instagram scenarios have authored scenes.
**Status:** design record for the five Instagram scenes authored by this task.
**Companions:** [`INSTAGRAM_W01_W05_REAL_WORLD_RESEARCH.md`](INSTAGRAM_W01_W05_REAL_WORLD_RESEARCH.md)
(I01–I05), [`INSTAGRAM_I06_I10_REAL_WORLD_RESEARCH.md`](INSTAGRAM_I06_I10_REAL_WORLD_RESEARCH.md),
[`INSTAGRAM_I11_I15_REAL_WORLD_RESEARCH.md`](INSTAGRAM_I11_I15_REAL_WORLD_RESEARCH.md),
[`INSTAGRAM_I16_I20_REAL_WORLD_RESEARCH.md`](INSTAGRAM_I16_I20_REAL_WORLD_RESEARCH.md) and the five
WhatsApp records, which use the same method.

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
surfaces — a tag request on a post that is already public, a "support team" that rings through the
platform's own video chat, a trusted creator's real account posting a changed payment route, a paid
carousel whose app already shows you money, and a community reel with a code in the frame. What is
deliberately **not** taken is infrastructure, tooling, real brands' workflows, real accounts, real
people, real units, real formations, real locations, real schedules, real procedures, real equipment,
real wallets, real regulators' marks or any real capability. "Unit Falcon", its "inter-unit football
final", its "canteen" and its "welfare notices" are fictional and describe nothing. Every host is
`*.training.example`; every phone number is in the reserved `+91 00000 xxxxx` range; every profile,
post, comment, channel, call, store page, dashboard, form, scanner result, wallet sheet and settings
screen is local, inert and offline. No image file exists anywhere — avatars, grids, the video-call
agent, the ID-card frame and the QR code are drawn from CSS.

### 0.2 Source of the threat intelligence

Primary source: **MITRE ATT&CK, Enterprise, Mobile and PRE matrices, website version v19.2**
(released 28 April 2026), re-confirmed as the current version on the live versions page on
16 September 2026 (<https://attack.mitre.org/versions/>, which resolves to `/resources/versions/`;
v18.1 ran 28 October 2025 – 27 April 2026). Technique pages relied on: T1585.001, T1586.001,
T1684 (listing T1684.001), T1598 (listing T1598.001 and T1598.003), T1589, T1591.004, T1657,
T1583.008, T1660, T1111, T1219, T1113, T1204, T1036, T1491.002, T1566.002 and T1566.003. T1111,
T1219, T1204, T1491.002, T1566.003, T1585.001, T1586.001, T1591.004, T1598.001, T1598.003, T1657,
T1660 and T1684.001 are cited as read for the W21–W25, I06–I20 records; the remainder were checked
against the same v19.2 release for this one.

Version note carried forward: `T1656 Impersonation` no longer exists as a top-level technique and
resolves to **T1684.001** (parent T1684 Social Engineering, created 14 April 2026; its only other
sub-technique is T1684.002 Email Spoofing). Older notes citing T1656 should not be trusted.

Secondary sources, for the real-world pattern behind each scenario (all read 16 September 2026):

- **I21** — US Army, "Social Media Safety", on what a caption may carry and on aggregation
  (<https://www.army.mil/socialmedia/safety/>); Instagram Help Center on tag review ("Manually
  approve tags"), removing yourself from a tag and who can see posts you are tagged in
  (<https://help.instagram.com/>); UK NCSC, "Social media: how to use it safely"
  (<https://www.ncsc.gov.uk/guidance/social-media-how-to-use-it-safely>).
- **I22** — Instagram Help Center on Account Status and Support requests, and on how the platform
  contacts people (<https://help.instagram.com/>); US FTC consumer advice on tech-support scams and
  on anyone who asks for a verification code (<https://consumer.ftc.gov/>); UK Action Fraud /
  NCSC guidance on account-recovery code theft
  (<https://www.ncsc.gov.uk/collection/top-tips-for-staying-secure-online>).
- **I23** — US FTC, "Before giving to a charity" and "Crypto scams"
  (<https://consumer.ftc.gov/articles/before-giving-charity>); Instagram Help Center on fundraisers
  and donations, and on a hacked account (<https://help.instagram.com/>); UK Charity Commission on
  checking a charity before giving (<https://www.gov.uk/government/organisations/charity-commission>).
- **I24** — SEBI investor-awareness material on unregistered advisers, "guaranteed allotment" and
  fake trading apps (<https://investor.sebi.gov.in/>); US SEC/FINRA investor alerts on fake
  "institutional access" and withdrawal fees (<https://www.investor.gov/>); Instagram Help Center on
  ads and "Hide ad" (<https://help.instagram.com/>).
- **I25** — US FTC, "Scammers hide harmful links in QR codes"
  (<https://consumer.ftc.gov/consumer-alerts/2023/12/scammers-hide-harmful-links-qr-codes-steal-your-information>);
  US Army CID on scams targeting service members and families (<https://www.cid.army.mil/>);
  Instagram Help Center on audio attribution and reels (<https://help.instagram.com/>).

**Source-confidence note.** Where a secondary source is cited by its landing page rather than by a
dated article, that is deliberate: the landing page is the one a reviewer can re-open. Nothing in this
document rests on a secondary source for a *behavioural* claim that ATT&CK is asked to carry. The
ATT&CK citations are the load-bearing ones, every one is linked to its own technique page, and
`sceneResearch.test.js` fails the build if a technique is named here without its page.

### 0.3 Interpretation rule

ATT&CK is used as a **behavioural reference, not a checklist**. A mapping is recorded only where the
technique's own description describes what the scenario does. **I21 has no mapping, and that is
stated** — a teammate asking to tag someone in an already-published, cleared photograph involves no
adversary. Nine techniques were **considered and rejected**, each with its reason: T1111, T1219 and
T1113 (I22); T1585.001 and T1491.002 (I23); T1204 and T1036 (I24); T1566.002 and T1583.008 (I25).
Every mapping in this batch is a partial fit in at least one respect, and each section says which.

### 0.4 What this document may and may not change

| Thing | May IMMERSIVE-004E change it? |
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

**The placeholder Instagram sender.** I21, I22, I23 and I25 carry the client's sentence as
`@handle: message` beside a generated `sender_profile` asset that is a placeholder
(`@unknownsender934`, `…457`, `…275`, `…410`). Handled exactly as in I01–I20: the scene uses the
handle in the client's sentence, carries the message verbatim, names the bank's sender **asset id**
on every inspection, and never prints the placeholder. `sceneModel.test.js` asserts both halves.

**I24 is a sponsored placement.** Like I09, its notification has no handle and its sender asset is
the client's word "Sponsored" with a placeholder identifier (`@sponsored126`). The toast says
"Sponsored", the advertiser is scene content, and the placeholder identifier is never printed
(asserted in `sceneModel.test.js`, and in the backend review-leak test).

**No truncation in this batch.** All five stored notifications are complete sentences; the
truncated-headline list in `sceneModel.test.js` is unchanged.

**The narrator line is not printed.** Each `prior_context` sentence states the situation and, for
four of the five, the verdict ("A fake support account…", "…after takeover", "…fabricated regulator
marks", "…over copied imagery"). None is printed. The verdict-word assertion for I21–I25 bans the
platform-wide list plus `clone`, `impersonat*`, `genuine`, `legit`, `look-alike`, `hoax`,
`unknownsender`, and — new for this batch — `compromised`, `hacked`, `takeover`, `coercion`,
`spoof*` and `quishing`. One I23 resolve label ("Report the post as a hacked account…") named the
verdict and was rewritten before testing (§8).

**Answer-revealing asset prose is not displayed.** I24's and I25's `browser_page` assets carry the
client's stage-4 sentence as their `body`. The scenes use only each asset's `display_target` and
`host`; no control opens the generic inspection sheet on them. I22's `call_screen` asset carries the
client's sentence as its caption and is named on the controls that act on the call; its
`install_screen` asset ("I22 Training Mock") is named on the screen-share consent, and its app name is
never shown. I21's and I23's generated `payment_screen` assets hold `INR 0.00`; only I23 has a
payment, and its sheet is authored — the asset id is named on Send so the ledger records it.

**The result card placeholder** (known limitation carried from I01–I20) applies to all five.

---

## 0.6 Differentiation from I01–I20 and WhatsApp W01–W25

The earlier records hold the rows for W01–W25 and I01–I20. The five new scenes, measured the same
way:

| | Behavioural lesson | Social mechanism | Primary evidence | Interaction pattern | Verification pattern | Unsafe temptation |
| --- | --- | --- | --- | --- | --- | --- |
| **I21** | **After the event, ordinary social use is fine — answer on the post, choose the audience, add nothing** | Familiarity + pride, peer to peer | A six-year thread; a teammate since 2015 with no renames; the unit page's published PF-311 shared into the chat; a post with no location | **Messages → an established DM → the published post's own tag-review sheet (Approve / Decline) with a local audience choice** | **Release Register** entry for PF-311 plus the learner's own lodged preferences; Arjun's saved number | Next fixture's date and ground "for the caption"; a stranger's "HD album" link in the comments; leaving it unanswered; reporting the teammate |
| **I22** | **A video call is not authority; support starts from Settings** | Authority + fear + secrecy ("don't change your password") | A request account, days old, renamed twice; a missed video chat; a case number nobody else can see | **An Instagram video chat that asks for three things through the phone's own controls: camera + ID, Share screen, Settings › Backup codes** | The learner's own **Account Status and Support requests**; the unit support desk | Show the ID; share the screen; read a backup code; stay on to ask for a case number |
| **I23** | **Verify the beneficiary, not the name — real accounts get taken over** | Empathy + social proof | A verified eight-year-old account (identity passes); a **fundraiser history always paid to one trust**; today's post with no fundraiser, comments off, three posts in an hour, a changed bio link | **A broadcast channel with no reply box**; a wallet sheet; "Share to your story" on the message itself | **The trust's own website from bookmarks** (which reports the takeover) and its saved helpline | Send crypto; share to story |
| **I24** | **Seals and testimonials can be manufactured; guaranteed allotment and withdrawal fees are impossible** | Authority + greed | A three-week-old advertiser with two renames; **identical top comments from accounts made this month within two minutes**; a download page that is not the app store | **A sponsored carousel → a download page (Install / Not now) → a web dashboard already showing a bonus → locked withdrawal → KYC and an 18% "tax"** | **The phone's own app store** (no such app) and **the learner's own broker** (no application; nobody confirms allotment) | Install; submit KYC; pay the tax; comment "Interested" |
| **I25** | **A familiar community theme does not authorise collecting service or payment data; read a code before opening it** | Familiarity + scarcity | A renamed "community" account; **the reel's audio credit leads to the welfare page's own 2025 notice using the same sound and counter photo**; scripted "Done ✅" comments beside a real question | **A code inside a reel, read from a screenshot by the phone's scanner (Open link / Close)**, an eligibility form, a ₹49 activation sheet | **Welfare Notices** (no coupon scheme) and the canteen office | Open the code; enter service number and family details; pay the activation; send the reel to the family group |

### Nearest existing scene, and what is genuinely new

| | Nearest | What that already taught | Why this is not the same scenario |
| --- | --- | --- | --- |
| I21 | **I16** (consent card, PF-204), I07 (friend's reel), W16/W21 | Genuine items exist; answer on the in-app path | **Intentional overlap, stated:** the client gives I16 and I21 the same verification route (release ID against the local register), so both use a Release Register app. Everything else differs: I16 is a unit page asking **before publication**, decided on a consent card in **Settings**; I21 is a **peer** after the event, decided on the **published post's own tag-review sheet**, with an **audience choice** no earlier scene has; its untrusted channel is a **stranger's comment link**, its register shows the learner's own **release preferences**, and its second check is the teammate's saved number. |
| I22 | W12 (video call), W24 (support call + screen share), I02/I12 (fake platform / codes) | Authority calls; screen sharing exposes codes; codes are never relayed | **Intentional overlap, stated:** the screen-share consent is the same system dialog shape as W24's, because the client names screen share. What is new: the call is **Instagram's own video chat** from a message request, the persona is **the platform**, and the asks are **identity on camera** and a **backup code read from the learner's real codes page** — each reached through a control on the call itself. W12 ended in money; W24 was a voice call about a virus; I02/I12 were pages and DMs. |
| I23 | W09 (compromised colleague, gift cards), I15 (friend's own account), I03 (legitimate donation drive), I13/I17 (wallets) | A real account can be used against you; pay nobody outside the known route | W09 and I15 are **one-to-one** asks; I23 is a **one-to-many broadcast channel** where replying is impossible, so "just ask them" is not on the screen. The evidence is a **beneficiary history** (Instagram fundraisers to one trust) rather than a login or a voice, and the second temptation is **amplification to the learner's own followers**. |
| I24 | **I09** (sponsored reel, APK, KYC, deposit), W13 (IPO group), W22 (investment friend) | Ads and groups sell impossible returns; registers settle it | I09 was a **borrowed face** and a **group funnel**; I24 is a **carousel of seals**, a **comment cohort**, and a **dashboard that already shows money** whose withdrawal is locked behind KYC and a tax. Its install is on a **download page** (an installer sheet), not a browser page; it has **no group route**; it adds a **public "Interested" comment**; its checks are the **phone's own store** and the **learner's own broker**, not a regulator register. |
| I25 | W08 (festival QR), W10 (device-link QR), I19/I18 (copied imagery) | QR codes hide destinations; copied content borrows trust | W08's code was a **photo in a group**; I25's is **inside a reel**, which Instagram cannot open, so the learner reads it from a **screenshot** with the phone's scanner before deciding. The copying is found through the **reel's audio attribution** — a navigation no earlier scene has — and the form asks for **service and family** details, then an activation fee. |

**Concepts rejected before writing:** for I21, "the unit asks for consent before publishing" (I16
again) — replaced by a post-event tag on the live post; for I22, "a support agent asks you to install
a remote-access app" (W24 again) — replaced by an in-app video chat and the learner's own codes page;
for I23, "a friend's hacked account asks you for money in a DM" (W09/I15 again) — replaced by a
broadcast channel and a beneficiary history; for I24, "a celebrity reel funnels you into a group"
(I09 again) — replaced by seals, a comment cohort and a pre-credited dashboard; for I25, "a QR photo in
a family group" (W08 again) — replaced by a code inside a reel and audio attribution.
`sceneModel.test.js` asserts that no I21–I25 branch-stage shape equals any of the forty-five earlier
scenes', that none of their decision homes ("where the scored controls sit") equals any earlier
scene's, and that the five are distinct from one another.

### The Instagram-native surface this batch adds (reusable, optional)

| Addition | Where | Used by |
| --- | --- | --- |
| A **`review` view**: a tag request's frame, facts, and a **local audience radio group** that is never sent | `SocialSurface.jsx` `ReviewPage` | I21 |
| **`conversation.readOnly`**: a broadcast channel's "only the owner can send" note in place of the composer | `InstagramScene.jsx` | I23 |
| **`conversation.commentNote`**: the public-comment note for a post that is not the learner's own (an ad) | `InstagramScene.jsx` | I24 |
| **`audio` anchor**: a reel's audio credit as local navigation to its audio page | `InstagramScene.jsx` `PostView` | I25 |
| **`remote.figure: 'agent'`**: a drawn headset-and-lanyard figure in the video call | `CallSurface.jsx` | I22 |

Everything else is reused unchanged: `SOCIAL` views `profile`, `about`, `people`, `post`, `story`,
`status`, `settings`, `list`, `search`; `BROWSER`; `PAYSHEET`; `APP`; `CALL` (video mode with
`endCallScored`, `links`, `countdown`); `INSTALLER` (`dialog`, `sheet`, `prompts`); `VIEWER` (the QR
scanner); the trusted-directory overlay; every beat kind in `scenes/instagram/shared.js`.

---

## 1. I21 — Post-Event Teammate Tag

### Client scenario (authoritative)

Specification page 57. Instagram, **Hard**, **Legitimate**, family *Legitimate post-event sharing*,
trigger *Familiarity + pride | FICTIONAL MILITARY CONTEXT*. Canonical identity computed by the import
service: family `legit_coordination_request`, triggers `familiarity` + `pride`, military flag
**true**, level `hard`.

- **Stage 1 (Event).** "@arjun.k.singh: Public-release photo PF-311 is up. May I tag you?"
- **Stage 2 (Open).** "Open the established DM and published post." Context: a known teammate asks
  to tag the learner in an approved photo after the event has concluded and the image is public.
- **Stage 3 (Inspect).** Exact handle, long history, public-release ID and absence of future
  schedule/location. Decision signal: *"The image and event are already approved for public
  release; the request is limited to a consent choice."*
- **Stage 4 (Branch).** "The tag-review card with Approve/Decline and privacy audience." Expected:
  *use the normal in-app path only after the details match; do not switch to an untrusted channel.*
- **Stage 5 (Verify).** "Compare PF-311 with the local release register and privacy preferences. If
  it matches, continue; do not report or block a legitimate sender."
- **Stage 6 (Resolve).** "Approve or decline the verified tag; do not report/block; add no sensitive
  caption."
- **End state / feedback.** Tag preference is applied only to the approved post; control audience
  and avoid adding extra detail.

### MITRE ATT&CK alignment

**There is none, and none has been invented.** ATT&CK catalogues adversary behaviour. In I21 there is
no adversary: a teammate asks, through the platform's own tag mechanism, whether the learner wants
to be named on a photograph the unit has already published. The only risks are the learner's own —
adding detail to a caption, or following an unrelated account's link — and ATT&CK does not model a
person's over-disclosure.

**Closest defensible behavioural reference** — deliberately not an ATT&CK technique:

- US Army, "Social Media Safety", on captions and aggregation
  (<https://www.army.mil/socialmedia/safety/>).
- Instagram Help Center on tag review, removing a tag and who sees tagged posts
  (<https://help.instagram.com/>) — the platform mechanism the review sheet is built on.
- UK NCSC, "Social media: how to use it safely"
  (<https://www.ncsc.gov.uk/guidance/social-media-how-to-use-it-safely>).

The defensive frame is disclosure discipline and audience control on the normal in-app path.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The inbox row's preview and today's first message |
| "Established DM and published post" | A main-inbox thread from 28 August and 13 September; the unit page's PF-311 post shared into it; the teammate's own post behind the review sheet |
| Exact handle, long history | Joined June 2015, no former usernames, 50 mutual follows, "Posts you're both tagged in" back to 2021 |
| Public-release ID | PF-311 in the shared post, the review sheet, the post, the register |
| Absence of future schedule/location | The review sheet's Location row ("None added"); the caption is the result only |
| "Tag-review card with Approve/Decline and privacy audience" | `tag` › `review` (`review` view), Approve and Decline, and a three-option audience choice |
| "Do not switch to an untrusted channel" | The stranger's "HD album" comment link: `open_link`, `−4` |
| "Add no sensitive caption" | "Suggest the next fixture's date and ground": `submit_data`, `−4` |
| "Compare PF-311 with the release register and privacy preferences" | `verify_known_app` → Release Register, with the learner's own preferences section |
| "Do not report/block" | `report` / `block` at verify `−4`; report/block/ignore at resolve `−4` |

### Enhanced synthetic storyline

In August Arjun said the unit would photograph the final and publish the cleared frames. The day
after, they talked about the match. Today the unit page's PF-311 post is shared into the chat, the
client's sentence follows, and Arjun adds that his caption is just the result and that declining is
fine. Instagram says tag approval is on. At the branch, Arjun asks whether the learner wants anything
added to the caption.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast |
| Open | Messages; Arjun's thread among ordinary chats |
| Inspect | The thread, the shared PF-311 post and the tag notice |
| Branch | "Writing the caption now - want me to add anything?"; the review sheet opens from the notice |
| Verify | The consequence: Arjun leaving the fixture out, or the album page asking for an Instagram password |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. The account: 2015, no renames, mostly teammates, tagged together since 2021.
2. The unit page's own PF-311 post, verified, "cleared for public release".
3. The review sheet: published, public, PF-311, result-only caption, no location; if declined, the
   post stays and the name is removed.
4. The post: a stranger's comment offering an "HD album" behind a sign-in.
5. The learner's own tag settings: approve manually; no location tags.
6. The register: PF-311 released after the event, tagging by name permitted with approval, captions
   result-only; the learner's preferences allow teammate tags on released images.

### Learner interaction journey

Notify → open the chat → profile, About, followers, tagged together → open the review sheet, the
post and the tag settings; choose an audience → **Approve or Decline** → open the Release Register
or ring Arjun → keep the choice and carry on.

### Simulation surfaces

- `profile` (`SOCIAL`): `profile`, `about`, `followers` (`people`), `together` (`list`).
- `tag` (`SOCIAL`): `review` (`review`), `post` (`post`), `prefs` (`settings`).
- `register` (`APP`): Release Register.
- `call` (`CALL`): Arjun's saved number.
- The trusted-directory overlay, with Arjun's saved contact as a row.

### Verification mechanism

`verify_known_app` opens the register (the client's named route); `verify_known_number` rings Arjun;
`verify_trusted_directory` lists the desk and the saved contact. Asking Arjun in the chat is `0`;
reporting or blocking him is `−4`.

### Safe resolution

`resolve_continue` or `resolve_retain`, `+2`. Full safe path: `open_item → read → inspect_profile →
safe_pivot (Approve) → verify_known_app → resolve_continue` = **10**. Declining scores identically.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Suggest the next fixture's date and ground for the caption | `submit_data` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Open the stranger's "HD album" link | `open_link` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Leave the tag request unanswered | `reject_ignore` | `NEEDLESS_REJECT_IGNORE` | −2 |
| Reply "sure, tag me" from the preview | `reply` at open | `PREMATURE_REPLY` | −1 |
| Report or block Arjun | `report` / `block` | `FALSE_REPORT_BLOCK` | −4 |
| Report, block, or remove him at the end | `resolve_report` / `resolve_block` / `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `CORRECT_USE +3`, `NEEDLESS_REJECT_IGNORE −2` and `UNSAFE_EXTERNAL_ACTION −4`.
`safe_pivot` resolves to `CORRECT_USE`; both risky intents resolve to the `−4` code.

### Realism decisions

- The audience choice is real and local: the learner can pick it, and it is presentation — what the
  engine records is the decision to approve or decline.
- The untrusted channel is a third party in the comments, because the teammate himself has no reason
  to send one.

### Known limitations

- One decision per stage: the sheet's answer is the branch decision.
- The chosen audience is not recorded anywhere, by design.
- The result and review cards show the bank's placeholder sender.

### Why the final simulation stays faithful

Every client element is present: the established DM and published post, the exact handle and long
history, the release ID, no schedule or location, the review card with both answers and an audience,
the register and preferences comparison, and the rule against reporting or adding detail.

---

## 2. I22 — Live Support Video Call

### Client scenario (authoritative)

Specification page 58. Instagram, **Hard**, **Malicious**, family *Fake platform support / call
coercion*, trigger *Authority + fear*. Canonical identity: family `tech_support_and_callback_fraud`,
triggers `authority` + `fear`, military flag **false**, level `hard`.

- **Stage 1 (Event).** "@security_live_case: Accept our video verification now to prevent account
  removal."
- **Stage 2 (Open).** "Open the DM request and incoming call screen."
- **Stage 3 (Inspect).** Unofficial handle, unsolicited call, secrecy and absence of an in-app case.
  Decision signal: *"Support does not require an unsolicited DM video call, screen share or spoken
  recovery code."*
- **Stage 4 (Branch).** "A synthetic call requesting face scan, screen share and backup code."
  Expected: *do not accept continued coercion, show ID, share screen or speak a code.*
- **Stage 5 (Verify).** "End the call and open Security/Support directly in app settings."
- **Stage 6 (Resolve).** "Decline/end; report/block the support impersonator; review account
  security."

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1684.001** Social Engineering: Impersonation | <https://attack.mitre.org/techniques/T1684/001/> | Strong. The account presents as the platform's own security team. |
| **T1585.001** Establish Accounts: Social Media Accounts | <https://attack.mitre.org/techniques/T1585/001/> | Strong. A days-old persona renamed through two "help" names. |
| **T1598.001** Phishing for Information: Spearphishing Service | <https://attack.mitre.org/techniques/T1598/001/> | **Partial fit, stated.** The request for credentials and identity is made through the platform's messaging and calling; the technique describes text messaging rather than a live video call. |

**Why this maps.** A persona is established for the purpose (T1585.001), poses as the platform
(T1684.001) and uses the platform's own channels to extract a recovery secret and identity material
(T1598.001). The coercion — a removal countdown — is the social engine, which ATT&CK does not model.

**Considered and rejected.** **T1111 Multi-Factor Authentication Interception**
(<https://attack.mitre.org/techniques/T1111/>) is technical capture of a factor; here the person is
asked to read a code aloud. **T1219 Remote Access Tools**
(<https://attack.mitre.org/techniques/T1219/>) is software installed for remote control; the screen
share here is the call's own feature and nothing is installed. **T1113 Screen Capture**
(<https://attack.mitre.org/techniques/T1113/>) is collection by code running on the victim's system;
here the learner would press Share. All three are named only to say why they do not apply.

**What must NOT be copied.** No real platform staff name, badge, case-number format, support script
or appeal workflow; no real identity-document layout. The ID card is a drawn rectangle; the backup
codes are invented eight-digit strings.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The request preview and the second message |
| "DM request and incoming call screen" | `request: true`; a missed video chat at open; "is calling you" at the branch |
| Unofficial handle, secrecy | About: joined September 2026, two former "help" usernames; "do not discuss this case… do not change your password" |
| Absence of an in-app case | Account Status: no issues; Support requests: none open |
| "Face scan, screen share and backup code" | The call's three links: camera prompt → ID frame; Share screen → system consent; Settings › Backup codes |
| "Do not accept continued coercion…" | Camera, share and code are `−8`; staying on to ask is `−3`; End call, Keep camera off, Don't share and Decline are `+3` |
| "End the call and open Security/Support directly in app settings" | `verify_known_app` → Settings (Account Status, Support requests, Password and security) |
| "Review account security" | The resolve label, and Password and security in Settings |

### Enhanced synthetic storyline

A request says the profile failed identity review and removal is scheduled today. The client's
sentence follows, then a case number, the instruction to show face and ID, and the secrecy lever.
A video chat was already missed. At the branch the account rings again and adds a 25-minute deadline.
On the call, "Agent R. Mehta" in a headset walks through the three asks and tells the learner not to
hang up.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast |
| Open | Messages; the item under **Requests** with a video-chat preview |
| Inspect | The request card, the notice, the sentence, the case and secrecy lines, the missed chat |
| Branch | "is calling you" with Join; the deadline message |
| Verify | "Video chat ended"; the consequence of a release or of asking for a case number |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. Two posts, 311 followers, not followed by anyone the learner knows.
2. About: this month, two renames through "help" names.
3. The call: an overlay and a countdown the caller controls.
4. The camera prompt: the other side can record what the camera shows.
5. The screen-share consent: codes and notifications would be visible.
6. The backup codes page: each code logs in once without the phone.
7. Settings: nothing removed, nothing at risk, no identity confirmation requested, no open cases.

### Learner interaction journey

Notify → open the request → profile and About → Join → listen, optionally open the three links →
**End call / Keep camera off / Don't share / Decline** → open Settings › Account Status → report,
block and run Security Checkup.

### Simulation surfaces

- `profile` (`SOCIAL`): `profile`, `about`.
- `call` (`CALL`, video, `endCallScored`, `links`, `countdown`, `remote.figure: 'agent'`).
- `camera` (`INSTALLER`): `ask` (`dialog`) → `frame` (`sheet`, final).
- `cast` (`INSTALLER`): `prompt` (`dialog`).
- `codes` (`SOCIAL` `settings`): the learner's backup codes.
- `status` (`SOCIAL`): `settings` → `status`, `support`, `security`.
- `call2` (`CALL`): the unit support desk.

### Verification mechanism

`verify_known_app` opens the learner's own Settings; `verify_known_number` rings the support desk;
`verify_trusted_directory` lists it. Asking the account for the agent's employee ID is `0`. Report or
block unchecked is `+1`.

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_profile →
safe_pivot (End call) → verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Turn on camera and hold up the ID | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Start sharing the screen | `share_secret` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Read backup code 1 aloud | `share_secret` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Stay on and ask for the case number in writing | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Join from the request list | `call_number` at open | `PREMATURE_REPLY` | −1 |
| Wait for a call-back / accept the request / delete and tell nobody | `resolve_continue` / `resolve_retain` / `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.
The three releases share `simulated_data_submission`, and the consequence banner is worded to be true
of each (§8).

### Realism decisions

- The call screen owns End call while the call is live, as in W12, so hanging up is the decision
  rather than a second, unscored way out.
- The codes page is the learner's own, because the lure is to make the learner fetch the secret.

### Known limitations

- Captions are timed text; nothing is heard or seen.
- Closing the camera or share prompt returns to the live call, which then offers only a local End
  call once the decision is spent.
- The result and review cards show the bank's placeholder sender.

### Why the final simulation stays faithful

Every client element is present: the request, the incoming call, the unofficial handle, the secrecy,
the missing in-app case, the three asks, the ban on each, the Settings route and the report.

---

## 3. I23 — Compromised Charity Influencer

### Client scenario (authoritative)

Specification page 59. Instagram, **Hard**, **Malicious**, family *Compromised trusted account /
donation diversion*, trigger *Empathy + social proof*. Canonical identity: family
`unsolicited_payment_lure`, triggers `empathy` + `social_proof`, military flag **false**, level
`hard`.

- **Stage 1 (Event).** "@carewithmaya: Emergency surgery fund - crypto only for the next two hours."
- **Stage 2 (Open).** "Open the story, profile and recent post history."
- **Stage 3 (Inspect).** Changed beneficiary, crypto-only method, disabled comments and abrupt content
  shift. Decision signal: *"A real account can be compromised; urgency and a changed payment route
  need independent confirmation."*
- **Stage 4 (Branch).** "A crypto payment screen and share-to-story button." Expected: *do not send
  funds or amplify before verification.*
- **Stage 5 (Verify).** "Use the charity's separately known website/contact and compare beneficiary
  details."
- **Stage 6 (Resolve).** "Do not donate/share; report the compromised story; notify the legitimate
  organization."

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1586.001** Compromise Accounts: Social Media Accounts | <https://attack.mitre.org/techniques/T1586/001/> | Strong. A real, verified creator account is used by someone else to reach its audience. |
| **T1657** Financial Theft | <https://attack.mitre.org/techniques/T1657/> | **Partial fit, stated.** Money is diverted to an irreversible wallet; the technique's examples are organisational rather than a public donation appeal. |
| **T1684.001** Social Engineering: Impersonation | <https://attack.mitre.org/techniques/T1684/001/> | **Partial fit, stated.** The operator speaks as Maya through her own account; the technique centres on posing as a trusted entity, which this is, but the channel is the real one. |

**Why this maps.** Take over an account whose audience already trusts it (T1586.001), speak as its
owner (T1684.001), and route money to yourself (T1657). The empathy lever and the audience's own
amplification are outside ATT&CK; the FTC and Charity Commission sources in §0.2 are the behavioural
reference.

**Considered and rejected.** **T1585.001 Establish Accounts**
(<https://attack.mitre.org/techniques/T1585/001/>) — no new account exists here; contrast I18.
**T1491.002 External Defacement** (<https://attack.mitre.org/techniques/T1491/002/>) — the posts are
changed, but the aim is theft from the audience, not defacing an organisation's public presence.

**What must NOT be copied.** No real creator, charity, hospital, patient, wallet format, chain or
network name. "CW" and the wallet string are invented; the trust's UPI handle uses the reserved
training domain.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The channel row's preview and today's first message |
| "Story, profile and recent post history" | Profile with a 40-minute story, a grid whose newest three posts break an eight-year pattern, and a Fundraisers page |
| Changed beneficiary | Fundraisers: every earlier one to Asha Care Trust through the Donate button; "today's emergency post has no fundraiser" |
| Crypto-only, disabled comments | The message; "Comments are turned off on the 3 newest posts" |
| Abrupt content shift | Grid: three notice-style posts in one hour after years of hospital visits; changed bio link |
| "Crypto payment screen" | `pay` (`PAYSHEET`), PIN then Send |
| "Share-to-story button" | "Share to your story" on the channel message, `reply`, `−3` |
| "Charity's separately known website/contact" | `verify_known_app` → the trust's site from bookmarks; `verify_known_number` → its saved helpline |
| "Notify the legitimate organization" | The resolve label |

### Enhanced synthetic storyline

In August the channel celebrated a fully funded surgery with a fundraiser post naming the trust. On
1 September Maya repeated that giving goes only through the fundraiser. Today the client's sentence
arrives, then "the trust account is frozen", a wallet address and "put this on your story". At the
branch, a running total and a shrinking deadline.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast |
| Open | Messages with a **Channels** section; the channel row |
| Inspect | The channel history, today's messages and the read-only footer |
| Branch | "₹1,40,000 in so far"; the wallet opens from the address |
| Verify | The consequence: an irreversible transfer and a higher target, or the address on the learner's story |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. Verified since 2021, joined 2016, no renames (identity passes).
2. The bio link has changed to an unfamiliar host.
3. The grid's newest three posts, and comments turned off on them.
4. The story: "crypto only, two hours".
5. Fundraisers: always the same trust, always the Donate button; none today.
6. The wallet sheet: no name, not reversible, no receipt.
7. The trust's website: "we do not accept cryptocurrency", and a notice that Maya's account was taken
   over this morning.

### Learner interaction journey

Notify → open the channel → profile, About, Fundraisers, story → optionally open the wallet (Back
cancels) → **send nothing, share nothing** → open the trust's website or ring its helpline → report and
tell the trust.

### Simulation surfaces

- `profile` (`SOCIAL`): `profile`, `about`, `fundraisers` (`list`), `story` (`story`).
- `pay` (`PAYSHEET`): the wallet transfer.
- `trust` (`BROWSER`): `donate`, `contact`.
- `call` (`CALL`): the trust helpline.

### Verification mechanism

`verify_known_app` opens the trust's website from bookmarks; `verify_known_number` rings its saved
helpline; `verify_trusted_directory` lists the desk and the helpline. Replying to Maya's story to ask
is `0`. Report or block unchecked is `+1`.

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_profile →
safe_pivot → verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Send ₹5,000 to the wallet | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Share to your story | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Send from the preview | `attempt_payment` at open | `PREMATURE_REPLY` | −1 |
| Donate later / keep the address / mute and say nothing | `resolve_continue` / `resolve_retain` / `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.
Amplification is priced as risky engagement, matching I19's plain repost.

### Realism decisions

- A broadcast channel was chosen because members genuinely cannot reply, which removes the "just ask
  her" route and makes the independent check the only check.
- The wallet sheet shows its Send only after a PIN; its Back is the cancel (the 004D rule).

### Known limitations

- The trust's notice is authored, not live.
- Reactions are not modelled; the footer only says they exist.
- The result and review cards show the bank's placeholder sender.

### Why the final simulation stays faithful

Every client element is present: the story, profile and post history, the changed beneficiary, the
crypto-only method, the disabled comments, the content shift, the payment screen, the share-to-story
button, the independent website and contact, and the report plus notification.

---

## 4. I24 — Institutional Trading App

### Client scenario (authoritative)

Specification page 60. Instagram, **Hard**, **Malicious**, family *Fake regulated investment
platform*, trigger *Authority + greed*. Canonical identity: family `investment_and_task_fraud`,
triggers `authority` + `greed`, military flag **false**, level `hard`.

- **Stage 1 (Event).** "Sponsored: Institutional account access for service professionals -
  confirmed IPO allotment."
- **Stage 2 (Open).** "Open the carousel, advertiser profile and comments."
- **Stage 3 (Inspect).** Misused marks, unverifiable registration, scripted comments and APK/download
  route. Decision signal: *"Official-looking marks and testimonials can be fabricated; special
  guaranteed access is implausible."*
- **Stage 4 (Branch).** "A fake app store/app dashboard with initial profit and withdrawal lock."
  Expected: *do not install, upload KYC, deposit or pay withdrawal tax.*
- **Stage 5 (Verify).** "Independently verify the entity/adviser and use only an approved
  store/broker."
- **Stage 6 (Resolve).** "Report the ad/account; do not install, deposit or upload documents", with
  the one-line rationale.

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1583.008** Acquire Infrastructure: Malvertising | <https://attack.mitre.org/techniques/T1583/008/> | Strong. A paid placement is bought to put the lure in front of a targeted audience and route it to an app download. |
| **T1585.001** Establish Accounts: Social Media Accounts | <https://attack.mitre.org/techniques/T1585/001/> | Strong. A three-week-old advertiser with two earlier names, and a cohort of new accounts commenting in unison. |
| **T1660** Phishing (Mobile) | <https://attack.mitre.org/techniques/T1660/> | **Partial fit, stated.** The ad leads to an app installed from outside the store; the scene installs nothing that runs, and its lesson is the decision, not the payload. |
| **T1657** Financial Theft | <https://attack.mitre.org/techniques/T1657/> | **Partial fit, stated.** The "tax" and "verification deposit" extract money; the technique's framing is organisational. |

**Why this maps.** Buy the placement (T1583.008), staff it with personas (T1585.001), deliver an
off-store app (T1660), and monetise through fees (T1657). The fake seals and the pre-credited balance
are social devices ATT&CK does not model; SEBI and SEC/FINRA advisories in §0.2 are the reference.

**Considered and rejected.** **T1204 User Execution** (<https://attack.mitre.org/techniques/T1204/>)
describes code execution on enterprise hosts; nothing here executes (as recorded for I09). **T1036
Masquerading** (<https://attack.mitre.org/techniques/T1036/>) is an artefact posing as a legitimate
one; "NivaCap" poses as no real app, and the borrowed authority is in the ad's seals, not in a file.

**What must NOT be copied.** No real regulator's name, seal, registration format or broker; no real
IPO, registrar or app store. "INV-00417", "NivaCap", "TradeDesk" and the "App Store" copy are
invented and describe nothing real.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The notification row ("Sponsored: …") and the caption |
| "Carousel, advertiser profile and comments" | A four-slide post; the advertiser's profile; five comments |
| Misused marks, unverifiable registration | Slide 3's seals and "Regd. INV-00417"; the advertiser repeating it in a reply |
| Scripted comments | The top two are the same sentence; "People who commented": this month's accounts, 17:01–17:03, 186 identical |
| APK/download route | Install app → a download page from a website, asking for SMS and overlay access |
| "Fake app store/app dashboard with initial profit and withdrawal lock" | `store` (download page) and `web` (dashboard with bonus and profit; withdrawal locked) |
| "Do not install, upload KYC, deposit or pay withdrawal tax" | Install, KYC and tax are `−8` |
| "Approved store/broker" | `verify_known_app` → the phone's own App Store; `verify_known_app` → TradeDesk |
| Rationale | The resolve stage's existing one-line rationale box |

### Enhanced synthetic storyline

A sponsored carousel promises institutional access and confirmed allotments, shows three seals and a
registration number, and ends on an app with an average first-week profit. The top comments thank
the desk; a real mutual asks how an allotment can be confirmed in advance; the advertiser replies with
the registration number. At the branch, a six-hour window.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast ("Sponsored") |
| Open | Notifications; the sponsored row |
| Inspect | The carousel, caption and comments |
| Branch | The window banner; Install app in the call-to-action strip |
| Verify | The consequence: SMS/overlay prompts, "KYC received", a new deposit demand, or replies to a public comment |
| Resolve | The outcome card, the rationale box and the review |

### Evidence the learner can discover (progressive)

1. Advertiser: August 2026, outside India, two renames, nine ads all this month.
2. Commenters: new accounts, two minutes, one sentence.
3. The download page: a website, not the phone's store, asking for SMS and overlay.
4. The dashboard: a bonus and profit the learner never paid in; withdrawal locked behind KYC and tax.
5. The phone's store: no such app.
6. The broker: no applications; allotment cannot be confirmed in advance; no fee before withdrawal.

### Learner interaction journey

Notify → open the post → step the slides, read the comments, open the advertiser and its commenters →
optionally open the download page and the web dashboard → **Not now / Hide ad** → search the store or
open the broker → report the ad with a one-line reason.

### Simulation surfaces

- `profile` (`SOCIAL`): `profile`, `about`, `commenters` (`people`).
- `store` (`INSTALLER`): `listing` (`sheet`) → `installed` (`prompts`, final).
- `web` (`BROWSER`): `dashboard`, `withdraw`, `kyc` (form), `kyc-review`, `kyc-done` (final).
- `tax` (`PAYSHEET`).
- `appstore` and `broker` (`APP`).

### Verification mechanism

Two `verify_known_app` routes (store, broker) and `verify_trusted_directory` (desk and investor
helpline). Messaging the advertiser for a certificate is `0`. Report or block unchecked is `+1`.

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_profile →
safe_pivot (Not now) → verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Install from the download page | `attempt_install` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Submit KYC | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Pay the 18% "tax" | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Comment "Interested" | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Tap Install from the notification | `open_link` at open | `PREMATURE_REPLY` | −1 |
| Save the ad / keep the dashboard / scroll on | `resolve_retain` / `resolve_continue` / `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.
Each release has its own consequence kind, so each banner describes only its own act.

### Realism decisions

- The dashboard is shown before any deposit because the pre-credited "bonus" is the hook.
- The comment composer carries "Comments on ads are public", not the own-post note.

### Known limitations

- The web dashboard's selfie step is named, not built.
- The seals are drawn words; nothing resembles a real mark.
- The result and review cards show the bank's "Sponsored" sender with its placeholder identifier
  hidden only on the device (carried from I09).

### Why the final simulation stays faithful

Every client element is present: the carousel, profile and comments, the marks and registration,
scripted comments, the download route, the store and dashboard with profit and withdrawal lock, the
bans on install/KYC/deposit/tax, the store/broker check, and the report with a rationale.

---

## 5. I25 — Canteen Coupon Reel QR

### Client scenario (authoritative)

Specification page 61. Instagram, **Hard**, **Malicious**, family *Military-themed QR phishing*,
trigger *Familiarity + scarcity | FICTIONAL MILITARY CONTEXT*. Canonical identity: family
`qr_code_phishing`, triggers `familiarity` + `scarcity`, military flag **true**, level `hard`.

- **Stage 1 (Event).** "@falcon_family_deals: Scan for the first 200 service-family coupon packs."
- **Stage 2 (Open).** "Open the reel and community account."
- **Stage 3 (Inspect).** Unofficial handle, copied posts, limited-quantity pressure and hidden QR
  destination. Decision signal: *"A community theme and copied photos do not authorize collection of
  service or payment data."*
- **Stage 4 (Branch).** "The QR inspector and a synthetic eligibility form." Expected: *do not open
  the target, enter service number/family details or pay an activation fee.*
- **Stage 5 (Verify).** "Check the known canteen/welfare notice route and official directory."
- **Stage 6 (Resolve).** "Close; report the account/reel; do not enter data or share the coupon",
  with the one-line rationale.

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1585.001** Establish Accounts: Social Media Accounts | <https://attack.mitre.org/techniques/T1585/001/> | Strong. A "community" account renamed twice, with a sibling account using the same audio. |
| **T1598.003** Phishing for Information: Spearphishing Link | <https://attack.mitre.org/techniques/T1598/003/> | **Partial fit, stated.** The collection page is reached through a link, but the link is carried in a QR code in a public reel rather than sent to a named target. |
| **T1589** Gather Victim Identity Information | <https://attack.mitre.org/techniques/T1589/> | **Partial fit, stated.** The form collects service numbers, family names and card numbers; the technique's examples centre on employees and credentials. |
| **T1591.004** Gather Victim Org Information: Identify Roles | <https://attack.mitre.org/techniques/T1591/004/> | **Partial fit, stated.** "Relationship to the service member" maps people to the organisation, as a by-product. |
| **T1657** Financial Theft | <https://attack.mitre.org/techniques/T1657/> | **Partial fit, stated.** The activation fee, and the next fee after it. |

**Why this maps.** A persona borrows a community's look (T1585.001), publishes a code that leads to
a collection page (T1598.003), and gathers identity and role data (T1589, T1591.004) plus small fees
(T1657). The FTC QR-code alert in §0.2 is the behavioural reference for the code itself.

**Considered and rejected.** **T1566.002 Spearphishing Link**
(<https://attack.mitre.org/techniques/T1566/002/>) is delivery for initial access; nothing executes
here, and the aim is information and money. **T1583.008 Malvertising**
(<https://attack.mitre.org/techniques/T1583/008/>) — the reel is organic and suggested, not a paid
placement (contrast I24).

**What must NOT be copied.** No real canteen, welfare body, card format, service-number format or
unit. "Unit Falcon Welfare", the counter photo and the card number field describe nothing real; the
QR is a drawn grid that encodes nothing.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The notification row and the caption |
| "Reel and community account" | A suggested reel with frames, audio credit, likes; the account's profile |
| Unofficial handle | About: August 2026, two former usernames; not verified; search shows the verified welfare page |
| Copied posts | Audio page: the welfare page's July 2025 notice used the sound first; its pinned post is the same counter photo |
| Limited-quantity pressure | "first 200", "58 packs left", "20 packs left" at the branch |
| Hidden QR destination | `inspect_qr` reads the code from a screenshot without opening it |
| "QR inspector and synthetic eligibility form" | `scanner` (`VIEWER`) and `coupon` › `eligibility` |
| "Do not open the target, enter service/family details or pay" | Open link `−3`; eligibility and fee `−8` |
| "Known canteen/welfare notice route and official directory" | `verify_known_app` → Welfare Notices; the canteen office in the directory |
| "Do not share the coupon" | "Send the reel to your family group chat", `−3` |
| Rationale | The resolve stage's existing one-line rationale box |

### Enhanced synthetic storyline

A suggested reel: coupon packs, groceries, a code filling the frame at 0:06, "ends tonight". The
account's pinned comment says to scan or use the bio link and that a service number confirms
eligibility. Two "Done ✅" comments; one member asks whether the canteen office knows; the account
answers "community partner, hurry". At the branch: "20 packs left".

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast |
| Open | Notifications; the reel row beside the welfare page's ordinary notice |
| Inspect | The reel, caption, pinned comment and comments; the audio credit |
| Branch | "20 packs left"; the scanner opens from the pinned comment |
| Verify | The consequence: a page asking for the service number first, an activation demand, a bigger fee, or the reel in the family group |
| Resolve | The outcome card, the rationale box and the review |

### Evidence the learner can discover (progressive)

1. The scanner: a web address on an unfamiliar host, read from a screenshot.
2. About: this summer, two renames.
3. Search: the verified welfare page, the account, and a zero-post sibling.
4. The welfare page: "offers are announced here and at the counter"; its pinned 2025 notice with the
   counter photo.
5. The audio page: the welfare notice first, then this reel and the sibling.
6. The claim page: fee to an individual's UPI ID; the form wants service and family details.
7. Welfare Notices: no coupon scheme; no online orders; the canteen office number.

### Learner interaction journey

Notify → open the reel → read the code without opening it, open the profile, About, search, the
welfare page and the audio page → **close the scanner without opening** → open Welfare Notices or ring
the canteen office → report with a one-line reason.

### Simulation surfaces

- `profile` (`SOCIAL`): `profile`, `about`, `search`, `official` (`profile`), `notice` (`post`).
- `audio` (`SOCIAL` `list`).
- `scanner` (`VIEWER`).
- `coupon` (`BROWSER`): `claim`, `eligibility` (form), `review`, `done` (final).
- `fee` (`PAYSHEET`).
- `notices` (`APP`), `call` (`CALL`).

### Verification mechanism

`verify_known_app` opens Welfare Notices; `verify_known_number` rings the canteen office;
`verify_trusted_directory` lists it. Asking the account in a comment is `0`. Report or block unchecked
is `+1`.

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. Full safe path: `open_item → read → inspect_qr →
safe_pivot (Close without opening) → verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Open the decoded link | `scan_qr` | `RISKY_OPEN_REPLY` | −3 |
| Confirm eligibility with service and family details | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Pay the ₹49 activation | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Send the reel to the family group | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Open the link from the notification | `open_link` at open | `PREMATURE_REPLY` | −1 |
| Save it / scan later / scroll on | `resolve_retain` / `resolve_continue` / `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`, `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`.
Reading the code at inspect is `inspect_qr` → `INSPECT_CONTEXT +2`; opening it at the branch is
`scan_qr` → `RISKY_OPEN_REPLY −3`.

### Realism decisions

- Instagram cannot open a code inside a reel, so the scene uses the screenshot-and-scan route people
  actually take, and the scanner shows the destination before anything opens.
- Copying is found through the app's own audio attribution rather than an external tool.

### Known limitations

- The bio link and the code lead to the same authored site.
- The audio page is a static list.
- The result and review cards show the bank's placeholder sender.

### Why the final simulation stays faithful

Every client element is present: the reel and community account, the unofficial handle, copied posts,
scarcity, the hidden destination, the QR inspector and eligibility form, the bans on opening, entering
data, paying and sharing, the notice route and directory, and the report with a rationale.

---

## 6. Forms, inputs and data handling

Five screens in this batch accept typing: I23's wallet sheet (a six-digit PIN), I24's KYC page (name,
ID number, bank account) and tax sheet (UPI PIN), and I25's eligibility page (service number,
relationship, family names, canteen card) and activation sheet (UPI PIN). I21's audience choice is a
local selection, not a field. They obey the rules `SceneForms.test.jsx` and
`SceneContainment.test.jsx` already enforce on every earlier batch:

- **Local.** Every value lives in `useLocalForm` state (or, for I21's audience, the review page's own
  `useState`) inside the component that draws it. It is never lifted, never passed to an affordance,
  never put in an intent or in metadata.
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

I22's camera, screen share and backup code involve no typing and no device access: the camera is
never turned on, nothing is shared, and the codes are invented text on an authored page. No field
accepts a real credential, card, wallet key, identity number, service number or document.

## 7. What is asserted, and where

| Claim | Test |
| --- | --- |
| Every I21–I25 control resolves to a legal transition on its own pinned definition | `backend/tests/sceneAffordance.test.js` |
| Each safe path scores exactly ten, in six stages, and produces the positive review card | `backend/tests/sceneAffordance.test.js` |
| Each named control keeps its event code and point value | `backend/tests/sceneAffordance.test.js` |
| I22–I25 never offer `reject_ignore` | `backend/tests/sceneAffordance.test.js`, `sceneModel.test.js` |
| The review explains the unsafe walks with each scenario's own correct action and leaks no scoring code, point value, placeholder or sponsored identifier | `backend/tests/sceneAffordance.test.js` |
| No branch-stage shape and no decision home repeats any of the forty-five earlier scenes, or another in the batch | `frontend/src/simulation/sceneModel.test.js` |
| No disposition, family, trigger, end state, feedback, narrator line or verdict word reaches the device | `frontend/src/simulation/sceneModel.test.js`, `SceneScenariosInstagramE.test.jsx` |
| Every host is `*.training.example`; every number is in the reserved range | `frontend/src/simulation/sceneModel.test.js` |
| I24's and I25's page addresses come from the pinned assets; I25's scanner shows the pinned decoded target | `frontend/src/simulation/sceneModel.test.js` |
| No `href`, `src`, `iframe`, `form`, media element or host handler on any screen | `SceneContainment.test.jsx`, `SceneScenariosInstagramE.test.jsx` |
| Typed values and the chosen audience never leave the component | `SceneScenariosInstagramE.test.jsx` |
| The five scenarios play end to end through the real controller and attempt API | `frontend/src/pages/SceneScenariosInstagramE.test.jsx` |
| This document covers every authored scenario and cites every technique it names | `frontend/src/simulation/sceneResearch.test.js` |

## 8. Findings during verification

Recorded as they were found, with what was done about each.

1. **A resolve label that named the verdict.** I23's first draft read "Report the post as a hacked
   account and tell Asha Care Trust". Rewritten to "Report the post, and let Asha Care Trust know
   what you saw"; the batch's verdict-word ban now includes `hacked`, `compromised` and `takeover`.
2. **An exclusivity assertion measured against a moving set.** The I11–I15 block asserted that no
   *earlier* Instagram scene decides on a viewer surface, but computed "earlier" as every scene not in
   that batch — so I25's QR scanner tripped it. Rescoped to the scenes that existed before I11, as
   004C did for the list view; I25's scanner is asserted in its own block.
3. **Shared consequences.** I22's camera, screen share and spoken code all resolve to
   `simulated_data_submission`; the banner is worded to be true of each ("what you showed or read
   out"), the rule 004C recorded.
4. **Intentional overlaps, stated rather than hidden:** I21's Release Register (client-mandated, as
   I16's) and I22's screen-share consent dialog (client-mandated, the same system shape as W24's).
   Branch shapes and decision homes remain unique for all fifty scenes.
5. **Clipped slide titles (browser play).** A drawn carousel slide does not wrap its title, so
   I24's "◉ Registered ◉ Licensed ◉ Insured" and I25's "SERVICE FAMILY COUPON PACKS" were cut off
   at the slide's edge. Titles shortened ("Registered · Insured", "Coupon packs") with the rest moved
   to the subtitle; every I24/I25 title was then measured in the browser at 640 and 320 px and fits.
   The renderer itself was not changed, because the same limitation applies to I01–I20 slides and
   none of those is clipped.
6. **A repeated app name (browser play).** I24's download sheet printed "NivaCap Pro" twice (the
   tile label and the title); the tile label is now "Download · 38 MB".
7. **Call icons on a channel (browser play).** I23's broadcast-channel header showed phone and video
   icons, which a channel does not have; `conversation.readOnly` now drops them.
8. **Recorded, not changed (pre-existing):** closing any pushed screen returns keyboard focus to the
   page body rather than to the control that opened it (the options sheet does restore focus); and
   re-entering a call from one of its own prompts restarts its drawn timer. Both are shared surface
   behaviour from earlier batches. Browser-play totals are in `PROJECT_MASTER_PLAN.md`.
