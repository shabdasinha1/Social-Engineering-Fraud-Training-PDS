# Instagram I01–I05 — real-world research and storyline reconstruction

**Task:** IMMERSIVE-004A — the first Instagram batch ("Instagram W01–W05" in the job brief)
**Naming:** the brief calls these "Instagram W01–W05"; the client's bank numbers every Instagram
scenario `I01`–`I25` (specification pages 36–61), so the five scenarios are **I01–I05** in the
data, the registry, the tests and this document. Nothing was renamed.
**Scope:** Instagram I01, I02, I03, I04, I05 only. WhatsApp W01–W25 is complete and unchanged;
Instagram I06+, Email and SMS are untouched. This is the first non-WhatsApp immersive batch.
**Status:** design record for the five Instagram scenes authored by this task.
**Companions:** the WhatsApp records
[`WHATSAPP_W01_W05_REAL_WORLD_RESEARCH.md`](WHATSAPP_W01_W05_REAL_WORLD_RESEARCH.md) …
[`WHATSAPP_W21_W25_REAL_WORLD_RESEARCH.md`](WHATSAPP_W21_W25_REAL_WORLD_RESEARCH.md) — the same
method, applied to the twenty-five WhatsApp scenarios.

---

## 0. How this document was produced, and what it is allowed to change

### 0.1 The transformation

```
REAL-WORLD BEHAVIOUR
      |   observed in published threat intelligence and platform advisories
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

What is taken from the real world is timing, sequencing, social pressure, the shape of a profile,
the way a giveaway or a support scam is worded, and the realism of Instagram's own surfaces. What
is deliberately **not** taken is infrastructure, tooling, live hosts, real brands, real accounts,
real people, real numbers or anything operational. Every host is `*.training.example`; every phone
number is in the reserved `+91 00000 xxxxx` range; every UPI handle ends `@trainingpay`; every
profile, post, story, comment, page, form, payment sheet and settings screen is local, inert and
offline. No image file exists anywhere — avatars, posters, grids and story tiles are drawn from
CSS, exactly as the WhatsApp attachment tiles are.

### 0.2 Source of the threat intelligence

Primary source: **MITRE ATT&CK, Enterprise and PRE matrices, website version v19.2** (released
28 April 2026) — re-confirmed as the current version on the live versions page on 14 September 2026
(<https://attack.mitre.org/versions/>; v18.1 ran 28 October 2025 – 27 April 2026). Every technique
named below was read from its live page during this task; the ID, matrix, tactic, version, created
and last-modified dates are recorded per scenario.

Version note carried forward from the WhatsApp batches: `T1656 Impersonation` no longer exists as a
top-level technique and resolves to **T1684.001** (parent T1684 Social Engineering, created
14 April 2026). Older notes citing T1656 should not be trusted.

Secondary sources, for the real-world pattern behind each scenario (all read on 14 September 2026):
- **I01** — Bitdefender, "Instagram giveaway scams and how to spot & avoid them" (4 March 2026):
  brand-cloned accounts, look-alike handles with extra underscores or numbers, DM'd "winners", fake
  login pages and "shipping/processing" fees
  (<https://www.bitdefender.com/en-us/blog/hotforsecurity/instagram-giveaway-scams>). The spec's own
  research basis (page 115, source 16) cites the FTC's scam-signs guidance.
- **I02** — LevelBlue SpiderLabs, "Instagram Phishing Targets Backup Codes" (Diana Solomon,
  20 December 2023): a copyright-infringement notice with a 12-hour appeal deadline leading to a
  fake appeal portal that collects username, password, 2FA confirmation **and backup codes**
  (<https://www.levelblue.com/blogs/spiderlabs-blog/instagram-phishing-targets-backup-codes>);
  Instagram Help Center, "Check your Account Status on Instagram"
  (<https://help.instagram.com/338481628002750>), the in-app place enforcement actually appears.
- **I04** — AARP, "How to Avoid Facebook and Instagram Cloning Scams" (14 July 2025): copied name
  and photos, requests sent to the target's contacts, a "stranded, wallet stolen, send money" ask,
  and "call or text the person" as the check
  (<https://www.aarp.org/money/scams-fraud/instagram-facebook-cloning/>); Instagram Help Center,
  "Impersonation Accounts" (<https://help.instagram.com/446663175382270/192435014247952>).
- **I05** — US National Counterintelligence and Security Center, "Intelligence Threats & Social
  Media Deception" (fake personas building rapport, then eliciting work and contact details;
  validate connections through other channels)
  (<https://archive.dni.gov/index.php/ncsc-features/2780-ncsc-intelligence-threats-social-media-deception>);
  US Army, "Social Media Safety" and "Geotagging poses security risks" (location, routine and
  geotagged posts as targeting indicators) (<https://www.army.mil/socialmedia/safety/>,
  <https://www.army.mil/article/75165/geotagging_poses_security_risks>) — the spec's page 115
  source 18.

### 0.3 Interpretation rule

ATT&CK is used as a **behavioural reference, not a checklist**. A mapping is recorded only where the
technique's own description describes what the scenario does. **I03 has no mapping, and that is
stated** — it is a genuine public post, and there is no adversary to catalogue. Three techniques
were **considered and rejected**, each with its reason: T1566.003 (I01), T1111 (I02) and
T1586.001 (I04). Every mapping in this batch is a partial fit in at least one respect, and each
section says which.

### 0.4 What this document may and may not change

| Thing | May IMMERSIVE-004A change it? |
| --- | --- |
| Scenario IDs, platform, level, disposition, family, trigger, military flag, version | **No** |
| The six stages, their order, their text, expected actions, scoring semantics, feedback | **No** |
| `backend/data/scenarios/v1` and its fingerprint `8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687` | **No** |
| `backend/data/synthetic/v1` and its fingerprint `2779b03939e13cf11e0bee44493609f0c91e228f201f22f8c025a080509afde1` | **No** |
| The engine, the event ledger, the 90-minute deadline, the training-feedback review | **No** |
| Scene structure, conversation/post/DM beats, Instagram surfaces, forms, phone UI | **Yes — this is the whole task** |

**The client scenario remains authoritative** over everything in this document. Where the research
and the client's own stage text disagree, the client's text wins and the disagreement is recorded.

### 0.5 Content note carried forward — the placeholder Instagram sender

Every Instagram scenario in the bank writes its notification as `@handle: message` (for example
`@mega_rewards_help: You won! Claim in 10 minutes or we redraw.`), and pairs it with a generated
`sender_profile` asset that is a **placeholder** — `@unknownsender274`, `name_source:
"placeholder"`, with random follower/following counts that contradict the client's own sentence.
Handled the way the truncated WhatsApp notification bodies were (W06/W09/W15/W20/W22/W25): the bank
is left exactly as it is, the scene uses the **handle in the client's sentence** as the account and
carries the client's message **verbatim**, and the placeholder is never printed on the device.
Every inspection still names the bank's `sender_profile` **asset id**, so the ledger records what
was inspected against the pinned definition. `sceneModel.test.js` asserts the message survives
verbatim and the placeholder handle never appears.

Found in the browser run and fixed generically: the placeholder also reached the learner in two
**shared** places the scene did not draw — the notify-stage toast title (`@unknownsender274`
above "@mega_rewards_help: …") and the Trusted Directory's "Details taken from the message"
panel. A scene may now declare `notify.sender` and `messageSender`; `PhoneShell` uses the first for
the toast title and `SimulationPage` passes the second to `TrustedDirectory`. Both are optional,
presentation-only and unused by every WhatsApp scene, so W01–W25 render exactly as before
(`SceneScenariosInstagram.test.jsx` asserts no "unknownsender" on the toast or in the directory).

**Still visible, recorded as a known limitation:** the post-attempt result and review cards are
server-built from the bank's sender asset, so they title an Instagram scenario with the placeholder
(`@unknownsender274`) above the correct client sentence. Changing it means changing the result
projection or regenerating the bank, both outside this job. The bank was not regenerated.

### 0.6 Content note — the narrator line is not printed in this batch

The bank's `prior_context` sentence states the situation for each item ("A newly created account
tags the learner as a winner…", "A near-identical account…"). As in the WhatsApp batches from
W11 on, that line is not printed anywhere: each scene presents the context through the post, the DM
and the profile instead, and `sceneModel.test.js` asserts that neither the sentence nor any
labelling word (scam, phishing, fake, cloned, impostor and the rest) appears in I01–I05.

---

## 0.7 Differentiation from WhatsApp W01–W25

Before any code was written, the twenty-five WhatsApp scenes were tabulated by what the learner
actually does, and each Instagram concept was rejected if it reduced to "a WhatsApp scenario shown
in Instagram colours". The Instagram batch is built on a **new surface kind** the WhatsApp scenes
never had — `SURFACE.SOCIAL`, a page graph inside the app: a profile with its grid and follower
counts, an **"About this account"** history page (date joined, former usernames), a
follower/following/tagged list, a single post with its comments, in-app **search results**, and the
app's own **Settings / Account Status**. WhatsApp evidence sits on a contact sheet; Instagram
evidence is walked between pages.

### The comparison matrix

The twenty-five WhatsApp scenes, by what the learner learns and does (from the five WhatsApp
research records):

| | Behavioural lesson | Social mechanism | Primary evidence | Interaction pattern | Verification pattern | Unsafe temptation |
| --- | --- | --- | --- | --- | --- | --- |
| W01 | A code sent to you is yours alone | Helpfulness | Number with no history; registration log | Composer | Settings → Account | Send the code |
| W02 | Couriers don't collect fees by chat link | Urgency, small amount | Business with no history; host | Browser checkout + PIN | Courier's own site | Pay INR 25 |
| W03 | Genuine group — join normally | (legit) | Participants, directory match | Poll | Trusted directory | Exit / share location |
| W04 | A friend's new number is not the friend | Empathy | Saved contact vs new number, writing style | Pay sheet | Friend's saved number | Pay the clinic fee |
| W05 | KYC threats are not handled by link | Fear | Link host | Browser KYC form | Bank app | Submit wallet PIN/OTP |
| W06 | Clerks don't collect ID photos on chat | Authority | Unknown "clerk" | Gallery → send | Unit desk | Send ID card |
| W07 | Expected family document — keep | (legit) | Known sender, expected | Document viewer | Known number | Delete / install |
| W08 | QR target ≠ brand | Reward | Decoded QR host | QR inspector → claim site | Wallet app | Enter card on claim |
| W09 | Hijacked colleague buying gift cards | Authority, secrecy | Out-of-character ask | Pay sheet / codes | Colleague's number | Buy and send codes |
| W10 | A "survey" QR is a device link | Curiosity | Linked Devices confirm | QR → Linked Devices | Settings → Linked Devices | Approve link |
| W11 | Genuine welfare appointment | (legit) | Reference in portal | Business message buttons | Welfare portal app | Call a searched number |
| W12 | Digital arrest isolates you on a call | Fear, authority | Video caller, no court | Video call (End call) | Unit desk | Show ID / pay |
| W13 | Guaranteed-return groups are staged | Greed | Admins-only room | Group exit / deposit | Broker app | Deposit |
| W14 | Orders don't come as APKs | Authority, urgency | Package + permissions | OS installer | Orders DMS | Install |
| W15 | A senior's voice can be cloned | Authority | New account, voice note | Composer | Adjutant | Send access phrase |
| W16 | Genuine route change — acknowledge only | (legit) | Pinned plan, directory | Reaction on message | Movement Board | Over-share names |
| W17 | Paid "tasks" end in recharges | Greed, commitment | Balance you built | Task site / recharge | JobsBoard | Recharge / bank details |
| W18 | A real admin account can be hijacked | Trust in group | Security-code change log | Roster form | Coy Office | Submit roster |
| W19 | One letter separates commander and clone | Authority | About line, real CO row | Attach → permission → share | Duty office | Share live location |
| W20 | Bank-detail changes need call-back | Routine, authority | Revised invoice | Procurement portal | Contact on file | Release payment |
| W21 | Genuine senior points to the portal | (legit) | Nothing to press; REF in portal | Portal acknowledge | SecureDesk | Pull detail into chat |
| W22 | Weeks of friendship ≠ identity | Reciprocity, trust | Biography shifts; image search | Composer boundary / dashboard | Regulator register | Deposit INR 2,000 |
| W23 | Welfare pretext escalates to deployment | Empathy, authority | Form asks escalate | Four-step form | Call Ma / welfare office | Submit posting |
| W24 | Support calls coach you into sharing | Fear, helpfulness | Other phone's status bar | Call → screen-share consent | IT helpdesk | Share screen / install |
| W25 | A known contact's code request | Reciprocity | Code on your own screen | WhatsApp link request sheet | Phone call to friend | Send code / link |

The five Instagram scenes, measured the same way:

| | Behavioural lesson | Social mechanism | Primary evidence | Interaction pattern | Verification pattern | Unsafe temptation |
| --- | --- | --- | --- | --- | --- | --- |
| **I01** | You cannot win a giveaway you never entered; a brand's **own verified account** states its rules | Greed + scarcity, **social proof of being publicly tagged** | A **post** with comments off; profile **follower/following ratio**, a grid of only winner graphics, **About this account** (2 days old, two former usernames) | Activity → post → profile pages → bio link → claim site | **In-app search** for the brand → verified account → **pinned rules post** | "Continue with Instagram" (social login) or pay INR 49 delivery; share the post |
| **I02** | Enforcement lives in **Account Status**, never in a DM; backup codes are never asked for | Fear + urgency, platform authority | A **message request** from a 2-day-old "case team"; the appeal host; Account Status showing nothing | Requests → request thread → appeal login (username, **masked password**, **backup code**) | **Settings → Account Status / Security** inside the app | Submit the appeal with password and backup code |
| **I03** | A verified, directory-matched public post may be used — **don't over-report**; the risk is a **stranger in the comments** | Empathy (a blood drive) | Verified badge, years of release posts, never-renamed About page, release marker, **a commenter offering "pre-registration"** | Activity → public post → profile → comments → Save / Share | Official-account **directory** or the unit desk's directory number | Report/block the unit; mute; register via the commenter's form; reply with blood group + number |
| **I04** | Copied photos and **mutual followers** don't prove identity; the real friend is **still posting** | Empathy + urgency | Clone vs **the real account side by side**; clone's posts all uploaded this week; real friend's **story 25 minutes ago at a café**; third-party UPI payee | Requests → request → clone profile → search the real handle → her story → pay card → pay sheet | Call her **saved number**, or a **known mutual** on her number | Pay INR 4,500 to the payee |
| **I05** | Friendly questions about city, unit and route are a **targeting package**; your own public profile helps them | Flattery + curiosity | **Reply to your own story**; a week-old account following 3,908; its **comment history** asking other runners the same; a claimed mutual | Requests → story-reply thread → profile → "where this account comments" → quick replies | Phone the **claimed mutual (Karan)**; then **review your own privacy** | Tap a quick reply giving city, unit or route |

### Nearest WhatsApp scene, and what is genuinely new

| | Nearest WhatsApp | What that already taught | Why this is not the same scenario |
| --- | --- | --- | --- |
| I01 | W08 (reward QR), W02 (fee), W05 (login form) | Rewards and fees arrive by link | The lure is a **public post that tags you**, evidence is **profile metrics and account history**, and verification is **searching the app for the verified brand** and reading its **pinned rules**. No WhatsApp scene has a feed post, a follower ratio, former usernames or in-app search. |
| I02 | W01 (Settings), W10 (platform "desk"), W05 (threat + form) | Check your own account settings; platforms don't DM | The item is a **message request** (not a chat), the ask is a **password + backup code** on a platform-appeal page, and the check is **Account Status** — the specific enforcement surface. W01's lesson was "a code for you"; I02's is "enforcement is in-app". |
| I03 | W03, W07, W11, W16, W21 (genuine items) | Genuine items exist; verify, then use | The first genuine **public broadcast** rather than a message to the learner, with the danger displaced to a **third party in the comments**. The learner must both **trust the post** and **refuse the commenter** — a split judgement no WhatsApp scene asks for. |
| I04 | W04 (new number), W19 (one-letter clone), W09 (hijacked) | A familiar name on an unfamiliar identity | The social graph is the deception: **mutual followers appear because the clone followed them**, and the decisive evidence is the **real friend's live story** in the same app. W04 compared a number; I04 compares two living accounts. |
| I05 | W23 (welfare pretext), W19 (location), W22 (rapport) | Disclosure of posting/location is release | No pretext, no authority and no money: pure **flattery on the learner's own public content**, arriving as a **story reply**; the pattern is found in the account's **comments on other people's posts**; the resolution includes **reviewing the learner's own privacy** — the victim's profile is part of the attack surface. |

**Concepts rejected** before writing: "a DM from a stranger with a link" for I01 (that is W02/W08 in
Instagram colours — replaced by the tagged post and brand search); "a support chat asking for an OTP"
for I02 (W01/W10 — replaced by the request + Account Status); "a verified account's DM" for I03 (W21
— replaced by the public post with a commenter's pull); "friend's new account asks for money, check
the number" for I04 (W04 verbatim — replaced by the side-by-side accounts and the story); "a stranger
asks where you are posted" for I05 (W23 — replaced by story-reply flattery and the comment pattern).

Branch-stage shapes are asserted distinct from every WhatsApp scene (`sceneModel.test.js`, "never
repeats a WhatsApp branch decision shape").

### The Instagram-native surfaces

| | The Instagram-native interaction it adds |
| --- | --- |
| **I01** | The claim is made **in public, in a post** that tags the learner among nineteen others with **comments turned off**; the account has a **grid** of winner graphics and an **About page** two days old with former usernames; the settling comparison is the app's own **search**, where the brand's real **verified** account and its pinned giveaway rules are the first result. No WhatsApp scene has a feed post, a profile grid, or an in-app brand search. |
| **I02** | A **message request** (pending in Requests, not an ordinary chat) whose verification is the app's **own Account Status** screen in Settings — enforcement lives in the platform, not a DM. W01 used the phone's WhatsApp Account settings; here it is Instagram's Account Status, reached as a social surface. |
| **I03** | The legitimate control: a **verified public post** with a long history, a matching **official-account directory** row, and no link/login/fee/DM at all — the learner must notice an **absence**, and must not over-report a genuine unit account. Its decision surface is a **post with Save/Share**, not a chat. |
| **I04** | Two accounts that look identical, and the app **keeps both** — the clone (days old, reposted photos, followers/following inverted) laid **beside the real friend** the learner already follows (years old, years of mutual comments). Side-by-side profile comparison is only possible on a social graph. |
| **I05** | Elicitation that arrives as a **reply to the learner's own story** and escalates through **quick-reply chips** the app offers (city / unit / route); the tell is the account's **comment history** — the same questions asked on other service members' fitness posts — found by walking its activity. |

---

## 1. I01 — Flash Giveaway Winner

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Flash Giveaway Winner |
| Disposition | **Malicious** |
| Level | Easy |
| Family (client) | Giveaway / credential-payment scam |
| Canonical family | `unsolicited_payment_lure` |
| Trigger (client) | Greed + scarcity |
| Military flag | No |
| End state | Claim flow closes and the fake account is removed from the local feed. |
| Decision signal (stage 3) | The account imitates a brand, disables comments and uses a look-alike handle and urgent claim link. |

### MITRE ATT&CK alignment

| Technique | Name | Matrix / tactic | Version | Created / last modified |
| --- | --- | --- | --- | --- |
| [T1657](https://attack.mitre.org/techniques/T1657/) | Financial Theft | Enterprise / Impact | 1.2 | 18 Aug 2023 / 12 May 2026 |
| [T1585.001](https://attack.mitre.org/techniques/T1585/001/) | Establish Accounts: Social Media Accounts | Enterprise / Resource Development | 1.1 | 1 Oct 2020 / 12 May 2026 |
| [T1598.003](https://attack.mitre.org/techniques/T1598/003/) | Phishing for Information: Spearphishing Link | PRE / Reconnaissance | 1.7 | 2 Oct 2020 / 12 May 2026 |

**Why this maps.** T1657 is the objective — money and credentials taken by deception. T1585.001 is
the giveaway account itself: its description says adversaries "create and cultivate social media
accounts" with "public information, presence, history and appropriate affiliations", which is
exactly a two-day-old page filled with winner graphics and a borrowed brand name. T1598.003 is the
claim link — "spearphishing messages with a malicious link to elicit sensitive information" — here
"Continue with Instagram" on a look-alike login, followed by a delivery fee.

**Considered and rejected:** [T1566.003](https://attack.mitre.org/techniques/T1566/003/) Phishing:
Spearphishing via Service (Initial Access, version 2.0). It does name social-media messaging, but it
is an Initial Access technique — getting a foothold on a system. Nothing in I01 executes or lands on
the device; what the claim page takes is information (a login) and money, which is T1598.003 and
T1657.

**Partial fit, stated.** ATT&CK's phishing techniques are framed around email and enterprise
targeting; the consumer giveaway-and-advance-fee pattern (look-alike handle, tagged "winners",
"shipping" fee, credential capture) is sourced from Bitdefender's giveaway-scam guidance and the
FTC's prize-scam warnings rather than from ATT&CK.

### What must NOT be copied

No real brand, account, logo, photograph, giveaway, courier or payment handle. "Mega Rewards",
"Falcon Mart", "SwiftShip Logistics" and "@mega_rewards" are invented; the fee handle ends
`@trainingpay`; the winner graphics and grid are drawn.

### Client requirements preserved

Stage 2's "tagged giveaway post from a newly created account" is the post in the learner's Activity
that tags them among twenty accounts. Stage 3's "exact handle, account age, follower ratio,
comments and bio link" are the profile (2,140 followers against 7,480 following, six posts all this
week), the About page (joined two days ago, former usernames `cricket_highlights_4k` and
`rewardsdrop.daily`), comments turned off, and the bio link to a training host. Stage 4's "fake
prize page asking for social login and a small delivery fee" is the offline browser: a "Continue
with Instagram" login, an access-consent page, and an INR 49 delivery fee on a payment sheet.
Stage 5's "find the brand's official account independently and check its public promotion rules" is
the in-app search that surfaces the verified `@mega_rewards` and its pinned rules. Stage 6's "close
the claim; report the account/post; block" is the resolve banner.

### Enhanced synthetic storyline

An account calling itself Mega Rewards Giveaway tags the learner in a "20 winners" post and DMs
that a smart watch is reserved for ten minutes. Its grid is nothing but prize graphics from this
week; its About page is two days old and has already worn two other names. The claim page wants an
Instagram login and then a small "delivery" fee. The real Mega Rewards — Falcon Mart's loyalty
programme — is a verified account whose pinned post says it never tags winners, never asks for a
login, and never charges a fee.

### Conversation progression

1. Activity: the account "mentioned you in a post".
2. The post: winner carousel, caption tagging the learner and nineteen others, **comments off**.
3. The client's headline, carried verbatim as the mention line.
4. `branch` — a DM banner: "your watch is reserved for 10 minutes."
5. After a consequence — a share confirmation and a follow-up "log in now", a new-device login
   warning, or a "customs clearance" second fee.

### Evidence the learner can discover (progressive)

- **The post**: comments are turned off, so nobody can say "this is not real".
- **The profile**: 2,140 followers, 7,480 following, six posts all dated this week.
- **About this account**: joined two days ago; two former usernames unrelated to rewards.
- **Tagged**: twenty accounts, most of whom only follow each other or the learner.
- **Search "mega rewards"**: the verified account, and its pinned "how our giveaways work".

### Learner interaction journey

`activity → post → profile → grid / About / tagged → the bio-link claim page → login → consent →
delivery fee — or search the brand → its pinned rules → report and block`

### Simulation surfaces

Post view (`conversation.kind: 'post'`), profile (`SOCIAL`: profile / about / following), the
brand's account (`SOCIAL`: search / official-profile / pinned rules / about), tagged list
(`SOCIAL`), claim site (`BROWSER`: claim / login / consent / delivery / receipt), delivery fee
(`PAYSHEET`), one directory row.

### Verification mechanism

`verify_known_app` (searching Instagram for the brand and reading its rules) or
`verify_trusted_directory` (the loyalty programme's directory row). "Message the account and ask
for proof" is the 0-point in-message route; reporting without checking is +1; report/block are the
resolve.

### Safe resolution

Open (`ITEM_OPEN` 0) → profile (`INSPECT_CONTEXT` +2) → close the claim page (`SAFE_PIVOT` +3) →
search the brand (`TRUSTED_VERIFY` +3) → report (`RESOLVE_CORRECT` +2). Ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Log in on the claim page (allow access) | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Pay the INR 49 delivery fee | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Share the post to confirm your entry | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Reply "Yes! How do I claim?" from the preview | `reply` (open) | `PREMATURE_REPLY` | −1 |
| Message the account for proof | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |
| Go back and finish claiming (resolve) | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

`SAFE_PIVOT +3` / `RISKY_OPEN_REPLY −3` / `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`,
`TRUSTED_VERIFY +3` / `REPORT_ONLY_WITHOUT_CHECK +1` / `VERIFY_THROUGH_MESSAGE 0`,
`RESOLVE_CORRECT +2` / `CONTRADICTORY_UNSAFE_FINAL −4`.

### Realism decisions

Comments are off because that is the giveaway scammer's real move — it removes the crowd that would
call it out. Walking the claim page and reading the reserved-prize timer is navigation; the decision
is what the learner gives it.

### Known limitations

The in-app search result is authored, not a live search. One decision per stage: a run records the
login or the fee, not both. The post-attempt result card shows the placeholder sender line (§0.5).

### Why the final simulation stays faithful

The account handle and the headline are the client's; the payment event names the bank's payment
asset; the inspection names the bank's sender asset. No word on the device says the item is a scam;
the brand's own pinned post is what exposes it.

---

## 2. I02 — Copyright Appeal Countdown

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Copyright Appeal Countdown |
| Disposition | **Malicious** |
| Level | Easy |
| Family (client) | Fake platform support / credential phishing |
| Canonical family | `credential_phishing` |
| Trigger (client) | Fear + urgency |
| Military flag | No |
| End state | Account Status shows no violation and the DM is marked as phishing. |
| Decision signal (stage 3) | Platform enforcement is handled through in-app account status, not an unsolicited support DM. |

### MITRE ATT&CK alignment

| Technique | Name | Matrix / tactic | Version | Created / last modified |
| --- | --- | --- | --- | --- |
| [T1598.003](https://attack.mitre.org/techniques/T1598/003/) | Phishing for Information: Spearphishing Link | PRE / Reconnaissance | 1.7 | 2 Oct 2020 / 12 May 2026 |
| [T1684.001](https://attack.mitre.org/techniques/T1684/001/) | Social Engineering: Impersonation | Enterprise / (Stealth) | 1.0 | 14 Apr 2026 / 12 May 2026 |
| [T1585.001](https://attack.mitre.org/techniques/T1585/001/) | Establish Accounts: Social Media Accounts | Enterprise / Resource Development | 1.1 | 1 Oct 2020 / 12 May 2026 |

**Why this maps.** T1598.003 is the appeal link that elicits username, password and backup code.
T1684.001 is the impersonation of "Instagram Copyright Enforcement" — its description covers
adversaries who "impersonate a trusted person or organization" and press with words like "urgent".
T1585.001 is the two-day-old "@copyright_case_team" account created to send it.

**Considered and rejected:** [T1111](https://attack.mitre.org/techniques/T1111/) Multi-Factor
Authentication Interception. The lure does harvest a **backup code**, but T1111 is the technical
interception of MFA tokens (smart cards, token generators), not a human typing a code into a
phishing form. The behaviour here is social, so it maps to T1598.003, not T1111.

**Partial fit, stated.** The specifics — a "copyright appeal" countdown, backup-code capture on a
Bio-Sites-style redirect — come from SpiderLabs/LevelBlue's December 2023 write-up and Instagram's
Help Center, not from ATT&CK.

### What must NOT be copied

No real Meta/Instagram branding, no real appeals URL, no real case number. The appeals centre,
"@copyright_case_team", the case id and the host are invented; the host is a training domain.

### Client requirements preserved

Stage 2's "DM request and account-warning message" is a **message request** (in Requests, not the
inbox). Stage 3's "support handle, DM-request status, link domain and threat language" are the
request card, the profile (joined two days ago, 61 followers / 844 following, former username
`giveaway.help.desk`), and the training host on the link. Stage 4's "external-looking appeal login
requesting username, password and backup code" is the offline browser's appeal → login → confirm.
Stage 5's "open Settings > Account Status/Support directly inside the simulated app" is the Account
Status social surface, which shows no violations. Stage 6's "close the link; report/block; review
official account status" is the resolve banner plus the 250-character rationale box.

### Enhanced synthetic storyline

A message request from "Copyright Case Team" says the account will be deleted in thirty minutes for
copyright infringement unless the learner appeals on a link. The account is two days old with 61
followers. Instagram's own Account Status, opened from Settings, shows no violations, no removed
content and no copyright reports — which is where enforcement actually appears.

### Conversation progression

1. Request card: who this is, before anything is said.
2. `MESSAGE REQUEST` — "Official notice…", the client's headline, the appeal link.
3. `branch` — "Do not ignore this. The 30-minute window has started."
4. After a consequence — a final-warning reply, or a "your password was changed" alert.

### Evidence the learner can discover (progressive)

- **The request**: it is pending in Requests — the platform does not warn accounts this way.
- **The profile / About**: two days old, 61 followers, a former "help desk" username.
- **The link**: a training host, not instagram.com.
- **Settings › Account Status**: no violations, no removed content, no copyright reports.
- **Security**: backup codes carry the line "Instagram will never ask for one."

### Learner interaction journey

`messages → requests → the request → profile / About → the appeal link → login → confirm — or
Settings › Account Status → report and block`

### Simulation surfaces

DM request thread (`conversation.kind: 'dm'`, `request`), profile (`SOCIAL`: profile / about),
Account Status (`SOCIAL`: settings / account-status / security), appeal site (`BROWSER`: appeal /
login / confirm / done), one directory row.

### Verification mechanism

`verify_known_app` (opening Account Status inside the app) or `verify_trusted_directory`. "Ask the
account to prove they are Instagram" is the 0-point route; reporting without checking is +1.

### Safe resolution

Open (`ITEM_OPEN` 0) → profile (`INSPECT_CONTEXT` +2) → close the appeal page (`SAFE_PIVOT` +3) →
Account Status (`TRUSTED_VERIFY` +3) → report (`RESOLVE_CORRECT` +2). Ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Submit the appeal (username, password, backup code) | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Ask in the DM if this is really Instagram | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Reply "How do I appeal?" from the preview | `reply` (open) | `PREMATURE_REPLY` | −1 |
| Ask the account to prove it is Instagram | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |
| Go back and finish the appeal (resolve) | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Identical shape to I01.

### Realism decisions

The backup-code field is the point: it is the detail the real campaigns added to make accounts
unrecoverable, and Account Status is where a real enforcement notice would be — so the safe route
is a place, not a judgement call about wording.

### Known limitations

The in-app Account Status is authored, not a live account state. The post-attempt result card
shows the placeholder sender line (§0.5).

### Why the final simulation stays faithful

The handle and headline are the client's; the submission event names the bank's browser asset; the
typed password and backup code never leave the form component (asserted). No word on the device
calls the DM phishing; Account Status is what shows there is nothing wrong.

---

## 3. I03 — Published Blood-Donation Drive

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Published Blood-Donation Drive |
| Disposition | **Legitimate** |
| Level | Easy |
| Family (client) | Legitimate public announcement |
| Canonical family | `legit_routine_broadcast` |
| Trigger (client) | Empathy \| FICTIONAL MILITARY CONTEXT |
| Military flag | Yes |
| End state | Post remains in feed and the legitimate action is logged. |
| Decision signal (stage 3) | The account matches the local official-account list and the post contains only publicly releasable information. |

### MITRE ATT&CK alignment

**There is none, and none has been invented.**

ATT&CK catalogues adversary behaviour. A verified public-information account posting an approved
blood-donation drive is legitimate organisational communication. Mapping it to an impersonation or
phishing technique because it carries a crest and a call to action would be exactly the inversion
the batch was told not to perform, and would teach the learner to treat a genuine unit account as
an attack.

**Closest defensible behavioural reference:** the client's own discrimination pricing for a genuine
item — `FALSE_REPORT_BLOCK` −4 for reporting or blocking the verified account, `UNSAFE_EXTERNAL_ACTION`
−4 for moving it to an untrusted channel (reposting off-platform with unit and address),
`NEEDLESS_REJECT_IGNORE` −2 for muting an approved post. The underlying idea — a verified public
release may be used normally, within released information — is ordinary public-affairs practice and
needs no technique.

### Client requirements preserved

Stage 2's "verified public post with no external registration" is the post and its poster, with a
walk-in time, a photo-ID note and a public-release marker — and no link, login or form anywhere.
Stage 3's "verified badge context, exact handle, post history and approval label" are the verified
header, the profile (joined 2019, verified since 2020, 312 posts, a grid of past releases), the
About page ("this account has never changed its username"), and the `PA/FAL/2026/214` release
marker. Stage 4's "in-app poster viewer and Save/Share controls" is the post with Save (correct
use) and Share (only because the approved marker is present). Stage 5's "compare the handle with the
local official-account directory" is the directory row that matches. Stage 6's "save or like; share
only if the approved marker is present; do not report" is the resolve banner.

### Enhanced synthetic storyline

Unit Falcon's verified public-information account posts an approved blood-donation drive: date,
venue, walk-in hours, bring a photo ID, organised with the station hospital, marked approved for
public release. Other real unit accounts comment. Everything a scam would carry — a link, a login, a
fee, a countdown, a DM — is absent from the post, and the learner has to notice the absence rather
than a red flag, and must not over-react to a genuine sender. The temptation arrives where it does
in practice: at the branch stage a stranger, `donor_link_fast`, comments under the post offering to
"pre-register" anyone who replies with their blood group and number, "link in my bio for the form".

### Conversation progression

1. The post: poster, caption with the release marker and the tagged station hospital.
2. A marker line: "Approved for public release by its author."
3. Comments: the company clerk sharing it, the station hospital confirming beds, a colleague asking
   about blood groups, the account replying.
4. `branch` — `donor_link_fast`: "Skip the queue 🩸 reply with your blood group + number…".
5. After a reply consequence — the learner's public reply with a number, and the stranger asking for
   the unit and a photo ID by DM.

### Evidence the learner can discover (progressive)

- **The post**: only publicly releasable information; an explicit release reference; walk-in only.
- **The profile**: verified since 2020, 312 posts, a grid of past approved releases, followed by
  people the learner knows.
- **About this account**: joined 2019, never changed its username.
- **The comments**: other known unit accounts engaging normally — and one stranger who is not the
  unit offering a registration the post says does not exist.
- **The directory**: the handle matches the local official-account list.
- **The unit support desk (directory number)**: confirms the drive, walk-in only, and that the unit
  never asks for details in comments.

### Learner interaction journey

`activity → post → profile → grid / About → comments → save or share — or the commenter's form /
reply → compare with the directory or phone the desk → keep it`

### Simulation surfaces

Post view (`conversation.kind: 'post'`, verified), profile (`SOCIAL`: profile / about), the
commenter's pre-registration page (`BROWSER`, shown only after the unsafe open — it asks for name,
blood group, mobile, unit and service number), the support desk call (`CALL`), one matching
directory row.

### Verification mechanism

`verify_trusted_directory` (the handle against the official-account directory) or
`verify_known_number` (the unit support desk on the bank's directory number). "DM the account to
ask if the post is really theirs" is the 0-point route. Report/Block are the −4 false positive this
scenario exists to punish.

### Safe resolution

Open (`ITEM_OPEN` 0) → profile (`INSPECT_CONTEXT` +2) → save the post (`CORRECT_USE` +3) → compare
with the directory (`TRUSTED_VERIFY` +3) → keep and share normally (`RESOLVE_CORRECT` +2). Ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Mute the account so it stops posting | `reject_ignore` | `NEEDLESS_REJECT_IGNORE` | −2 |
| Register through the form `donor_link_fast` posted | `open_link` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Reply to `donor_link_fast` with your blood group and number | `reply` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Repost off-platform with your unit and address | `share_location` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Report / block the verified account | `report` / `block` | `FALSE_REPORT_BLOCK` | −4 |
| Comment "Count me in!" from the notification | `reply` (open) | `PREMATURE_REPLY` | −1 |
| Report the post (resolve) | `resolve_report` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

`CORRECT_USE +3` / `NEEDLESS_REJECT_IGNORE −2` / `UNSAFE_EXTERNAL_ACTION −4`, `TRUSTED_VERIFY +3` /
`FALSE_REPORT_BLOCK −4` / `VERIFY_THROUGH_MESSAGE 0`, `RESOLVE_CORRECT +2` /
`CONTRADICTORY_UNSAFE_FINAL −4`.

### Realism decisions

The legitimate item gets as much thread and as many screens as its malicious neighbours, because a
visibly thinner genuine post would be the tell. Its safety is shown by a verified badge, a matching
directory, a consistent history and only releasable content — never by a badge alone.

### Simulation surfaces note (faithfulness)

The post carries the client's headline; the directory row's handle is the account's own; no word on
the device says the item is genuine — the verified badge, the matching directory and the release
marker are what say it may be used.

### Why the final simulation stays faithful

The account handle and the headline are the client's. The genuine item is not made obvious: over-
reporting it costs the learner, which is the judgement the scenario tests.

---

## 4. I04 — Cloned Friend in Distress

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Cloned Friend in Distress |
| Disposition | **Malicious** |
| Level | Easy |
| Family (client) | Profile cloning / emergency payment |
| Canonical family | `impersonation_emergency_payment` |
| Trigger (client) | Empathy + urgency |
| Military flag | No |
| End state | Verified friend confirms the clone; no payment is attempted. |
| Decision signal (stage 3) | The account is new and copies old photos but lacks the friend's normal interactions. |

### MITRE ATT&CK alignment

| Technique | Name | Matrix / tactic | Version | Created / last modified |
| --- | --- | --- | --- | --- |
| [T1684.001](https://attack.mitre.org/techniques/T1684/001/) | Social Engineering: Impersonation | Enterprise / (Stealth) | 1.0 | 14 Apr 2026 / 12 May 2026 |
| [T1585.001](https://attack.mitre.org/techniques/T1585/001/) | Establish Accounts: Social Media Accounts | Enterprise / Resource Development | 1.1 | 1 Oct 2020 / 12 May 2026 |
| [T1657](https://attack.mitre.org/techniques/T1657/) | Financial Theft | Enterprise / Impact | 1.2 | 18 Aug 2023 / 12 May 2026 |

**Why this maps.** T1684.001 is impersonating a trusted person — the friend — to get "a target
into performing some action on their behalf". T1585.001 is the cloned account: a fresh social-media
persona built from copied photos and a near-identical handle. T1657 is the objective, money to a
third-party handle.

**Considered and rejected:** [T1586.001](https://attack.mitre.org/techniques/T1586/001/) Compromise
Accounts: Social Media Accounts (version 1.1, last modified 24 October 2025). Its description is the
alternative to building a persona — "rather than creating and cultivating social media profiles,
adversaries may compromise existing social media accounts". I04 is the opposite case: Riya's real
account is untouched and still posting, which is exactly the evidence the learner is meant to find.
Mapping T1586.001 would teach "her account was hacked" — the wrong conclusion, and AARP's advisory
makes the same distinction ("cloning isn't hacking").

**Partial fit, stated.** ATT&CK frames account creation/impersonation as adversary infrastructure
against organisations; the consumer "cloned friend, stranded, send money" pattern is sourced from
AARP's July 2025 cloning advisory and Instagram's impersonation-reporting guidance.

### What must NOT be copied

No real person, photo, handle or payment account. "Riya Kapoor", "@riya.kapoor_2", the third-party
payee "A. Nandi" and the handle are invented; the handle ends `@trainingpay`; the photos are drawn.

### Client requirements preserved

Stage 2's "near-identical account follows the learner and DMs asking for travel money" is the
request from a handle one character off the real one. Stage 3's "extra character in handle, recent
posts, follower overlap and account age" are the clone's profile (four days old, nine posts all this
week, 54 followers / 612 following) laid **beside the real Riya** the learner already follows (2018,
418 posts, years of mutual comments). Stage 4's "payment-handle card with a third-party synthetic
name" is the UPI card and the payment sheet, whose payee is not the friend. Stage 5's "call the
friend using the number already saved or ask a known mutual" is the saved-number call. Stage 6's
"decline; report the clone for impersonation; block after independent confirmation" is the banner.

### Enhanced synthetic storyline

A message request from an account that looks exactly like the learner's friend Riya — same photo,
same name, one extra character in the handle — says she has lost her wallet and phone and needs
travel money before the last bus, then sends a UPI card whose payee is a stranger. Her real account,
which the learner already follows, is years old, posted yesterday, and has a **story from 25 minutes
ago at a café** — phone in hand, by the look of it. Calling her saved number reaches her at that café
with Nisha; phoning Nisha, a mutual, reaches someone sitting across the table from her.

### Conversation progression

1. Request card: "Riya Kapoor", four days old, follows you.
2. `MESSAGE REQUEST` — "it's Riya, new account", the client's headline, "I'll pay you back".
3. `branch` — "the bus leaves in 15 minutes", a UPI card to "A. Nandi".
4. After a consequence — "just send it, I'll call after", a paid confirmation, or a second, larger
   ask.

### Evidence the learner can discover (progressive)

- **The request**: follows you; joined four days ago.
- **The clone's profile / About**: nine posts all added this week; 54 followers, 612 following.
- **The real Riya ("Search: riya.kapoor")**: 2018, 418 posts, followed by you and 180 others,
  posted yesterday.
- **Her story**: 25 minutes ago, a location sticker at a café — not a bus stand, and not a lost phone.
- **The payment card**: the UPI name is "A. Nandi", not the friend (nothing on the sheet says so).
- **Her saved number / Nisha's number**: she is at the café with her phone; the account followed
  Nisha too.

### Learner interaction journey

`messages → requests → the request → clone profile → search the real handle → her story — or the
payment card / sheet → or call her saved number / phone Nisha → report and block`

### Simulation surfaces

DM request thread (`dm`, `request`) with a UPI card beat, profile (`SOCIAL`: clone profile / About /
the real account / its About / **her story**), payment sheet (`PAYSHEET` with a PIN), two calls
(`CALL`: Riya's saved number, Nisha), one saved-contact directory row.

### Verification mechanism

`verify_known_number` — Riya's saved number, or Nisha (a known mutual) on her number, both outside
the DM, exactly the client's two routes. "Ask the account here to prove it's Riya" is the 0-point
route; reporting without checking is +1.

### Safe resolution

Open (`ITEM_OPEN` 0) → profile (`INSPECT_CONTEXT` +2) → don't send, check first (`SAFE_PIVOT` +3) →
call her saved number (`TRUSTED_VERIFY` +3) → report the clone (`RESOLVE_CORRECT` +2). Ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Pay INR 4,500 on the payment sheet | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Ask which bus and where she is | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Reply "Of course, sending now" from the preview | `reply` (open) | `PREMATURE_REPLY` | −1 |
| Ask the account here to prove it's Riya | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |
| Go back and send the money (resolve) | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Same shape as I01.

### Realism decisions

The two accounts are drawn to look the same on purpose; the difference is history and interaction,
not appearance, so the learner must open both. The payment sheet names a third party, which is the
detail people miss under time pressure.

### Known limitations

The two calls are scripted. One decision per stage. The two accounts share a drawn avatar rather
than a photograph, so "same photo" is represented by the same name, bio and art. The post-attempt
result card shows the placeholder sender line (§0.5).

### Why the final simulation stays faithful

The handle and headline are the client's; the payment event names the bank's payment asset; the PIN
never leaves the sheet component (asserted). No word on the device says "clone"; the real friend's
own account and her saved number are what expose it.

---

## 5. I05 — Friendly New Follower Questionnaire

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Friendly New Follower Questionnaire |
| Disposition | **Malicious** |
| Level | Easy |
| Family (client) | Social profiling / information elicitation |
| Canonical family | `operational_elicitation` |
| Trigger (client) | Flattery + curiosity \| FICTIONAL MILITARY CONTEXT |
| Military flag | Yes |
| End state | DM request is restricted and no personal detail is released. |
| Decision signal (stage 3) | The questions combine location, affiliation and routine details useful for targeting. |

### MITRE ATT&CK alignment

| Technique | Name | Matrix / tactic | Version | Created / last modified |
| --- | --- | --- | --- | --- |
| [T1598](https://attack.mitre.org/techniques/T1598/) | Phishing for Information | PRE / Reconnaissance | 1.4 | 2 Oct 2020 / 12 May 2026 |
| [T1591.001](https://attack.mitre.org/techniques/T1591/001/) | Gather Victim Org Information: Determine Physical Locations | PRE / Reconnaissance | 1.1 | 2 Oct 2020 / 24 Oct 2025 |
| [T1589](https://attack.mitre.org/techniques/T1589/) | Gather Victim Identity Information | PRE / Reconnaissance | 1.3 | 2 Oct 2020 / 12 May 2026 |
| [T1591.003](https://attack.mitre.org/techniques/T1591/003/) | Gather Victim Org Information: Identify Business Tempo | PRE / Reconnaissance | 1.0 | 2 Oct 2020 / 24 Oct 2025 |
| [T1593.001](https://attack.mitre.org/techniques/T1593/001/) | Search Open Websites/Domains: Social Media | PRE / Reconnaissance | 1.0 | 2 Oct 2020 / 24 Oct 2025 |

**Why this maps.** T1598 is elicitation itself: its description covers adversaries who "obtain
information directly through the exchange of emails, instant messages, or other electronic
conversation means" — a friendly DM asking questions. T1591.001 is the location the questions seek
(city, side of town, where the route runs); T1589 is the identity/affiliation (unit) they build up.
T1591.003 is the daily route and start time — its description notes tempo "may also be exposed to
adversaries via … Social Media". T1593.001 is how the account found the learner: it "may search
social media for information about victims" and use it "to create fake profiles/groups to elicit"
more. The escalation — compliment, then location, then unit, then routine — is textbook elicitation.

**Partial fit, stated.** ATT&CK's reconnaissance techniques are framed around organisational
targeting; the service-member-specific angle (fitness posts, daily route, unit, geotagging risk)
is sourced from the US NCSC/FBI social-media-deception material and the US Army's OPSEC/geotagging
guidance rather than from ATT&CK.

### What must NOT be copied

No real person, unit, base, route or account. "@trail_fan_87" and the running-club handles are
invented; no location is real; the story tile is drawn.

### Client requirements preserved

Stage 2's "new follower compliments the fitness posts and asks a sequence of personal questions" is
the story-reply opener and the DM. Stage 3's "account age, sparse original content, broad following
and escalating questions" are the profile (a week old, two reposts, 38 followers / 3,908 following)
and its comment history — the same questions on other service members' posts. Stage 4's "quick-reply
panel offering city/unit/route answers" is exactly the composer's quick replies; choosing any is the
release. Stage 5's "review the profile and, if identity is claimed, verify through a known mutual
outside the DM" is the mutual check. Stage 6's "do not answer; restrict/report; review privacy" is
the banner.

### Enhanced synthetic storyline

A week-old account replies to the learner's running story, compliments the posts, and — warmly —
asks which city, which unit, and the daily route. Nothing is demanded and nothing is urgent. Its
profile has almost no content of its own and follows thousands; its comment history is the same
three questions asked of other runners' fitness posts. To lower the learner's guard it claims a
mutual — "Karan from the Sunday run club" — which is exactly the identity claim the client's stage 5
says to check outside the DM. Karan has never heard of the account, and was asked where the club
starts from last week. Answering feels like friendliness; together the answers are a targeting
package, and the learner's own public profile (23 geotagged stories, anyone can reply) is part of
how the account found them.

### Conversation progression

1. Request card: "Trail Fan", a week old, started following you today.
2. `MESSAGE REQUEST` — a reply to the learner's own running story ("Your story · 6.2 km before work").
3. The compliment, the client's headline (city / unit / route), and the claimed mutual, Karan.
4. `branch` — "which side of the city are you?" and "what time do you head out?"
5. After a consequence — a neutral "you replied" line and his next question for the unit, whichever
   detail was given; or, after the friendly question back, a deflection and the same question.

### Evidence the learner can discover (progressive)

- **The request**: a week old; started following you today.
- **The profile / About**: two shared posts, 38 followers, 3,908 following, joined a week ago.
- **"See where this account comments"**: the same location/unit/time questions on other runners' posts.
- **The questions themselves**: location + affiliation + routine, the targeting triad.
- **Karan, on his own number**: does not know the account; was asked the same thing.
- **Settings › Account privacy (after resolving)**: the learner's account is public, location on 23 of
  the last 30 stories, anyone can reply to stories or send requests.

### Learner interaction journey

`messages → requests → the story-reply thread → profile → About / where it comments → don't reply —
or a quick reply with city/unit/route → phone Karan → restrict and report → review your own privacy`

### Simulation surfaces

DM request thread (`dm`, `request`) opening with a story reply, profile (`SOCIAL`: profile / about /
its comments elsewhere), the call to Karan (`CALL`), the learner's own account privacy (`SOCIAL`,
status view, local only), one security-cell directory row. No browser, no payment — the release is
words in the composer.

### Verification mechanism

`verify_known_number` (phoning Karan, the mutual the account claimed, on his own number) or
`verify_trusted_directory` (the unit security cell). "Ask the account itself who it really is" is the
0-point route; reporting without checking is +1. Reviewing privacy has no intent of its own, so it is
local navigation after the resolution — offered, never scored.

### Safe resolution

Open (`ITEM_OPEN` 0) → profile (`INSPECT_CONTEXT` +2) → don't reply to the questions (`SAFE_PIVOT`
+3) → phone Karan (`TRUSTED_VERIFY` +3) → restrict and report, or block (`RESOLVE_CORRECT` +2). Ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Send your city and side of town | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Send your unit | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Send your daily route and time | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Ask them a friendly question back (opens the door) | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Reply "Thanks! Pune, lake loop 🙂" from the preview | `reply` (open) | `PREMATURE_REPLY` | −1 |
| Ask the account itself who it really is | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |
| Accept the request and reply later (resolve) | `resolve_retain` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |
| Go back and answer their questions (resolve) | `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

"Restrict" has no engine intent of its own; "Restrict and report the account" is `resolve_report`,
the client's resolution wording mapped onto the engine's legal report resolution.

### Scoring / event mapping (unchanged)

Same shape as I01. The three quick replies all price as the release, because location, unit and
routine are each operationally sensitive on their own.

### Realism decisions

Nothing in the thread is hostile, and the questions are the kind a real runner might ask — which is
the point. The tell is the pattern (a week old, following thousands, the same questions elsewhere),
not any single rude message.

### Known limitations

The mutual check is scripted. One release recorded per stage. Reviewing privacy is shown, not
changeable. The result card shows the placeholder sender line (§0.5).

### Why the final simulation stays faithful

The handle and headline are the client's; the inspection names the bank's sender asset; the release
carries no target because the bank has no asset for what was said; the composer text is authored, so
no free text is ever typed into a chat. No word on the device calls the account hostile — the
escalating questions, the comment history and Karan are what the learner reads.

---

## 6. Forms, inputs and data handling

Two Instagram scenes carry real inputs — I01's claim login and delivery-fee PIN, and I02's appeal
login (username, password, backup code) — reusing the same infrastructure the WhatsApp forms use
(`frontend/src/simulation/localForm.js`, `components/simulation/surfaces/SceneForm.jsx`,
`PaySheetSurface`). IMMERSIVE-004A added one field kind, `MASKED` (a password: free text rendered as
dots by CSS, never `type="password"`), and nothing else about containment changed. The nine
guarantees hold exactly as they do for WhatsApp:

1. **Local.** Values live in `useLocalForm`'s `useState` inside the surface component; never lifted.
2. **Ephemeral.** Leaving a page unmounts it and React discards the values; a reload rebuilds from
   the committed stage with empty fields.
3. **Never transmitted.** No value reaches an affordance, the controller, `attemptApi` or metadata;
   the engine's `METADATA_ALLOWLIST` would reject it server-side even if something tried.
4. **Never persisted.** No `localStorage`, `sessionStorage`, cookie or backend record.
5. **Never logged or exported.** Nothing reaches `console`, the ledger, the export or the viewer.
6. **No autofill surface.** Every input is `type="text"`, `autoComplete="off"`, with a meaningless
   `name` (`f0`, `f1`…). Secret and masked fields are hidden with CSS, so no credential manager
   takes an interest.
7. **No form submission.** No `<form>`, no action, no method, no submit event; the commit control is
   an ordinary button carrying a scene affordance.
8. **Deterministic.** A field is satisfied at its declared `length`; `max` is how much it accepts.
9. **Not decorative — and never steering.** The learner really fills the login in, and no control is
   ever disabled because of what it would cost, only by incomplete input.

`SceneForms.test.jsx` and the batch's own page suite serialise everything the device hands the
controller and search it for the exact strings that were typed; none appear.

## 7. What is asserted, and where

- `frontend/src/simulation/sceneModel.test.js` — the registry (25 WhatsApp + 5 Instagram, no id
  collision), Instagram intents legal per stage, assets/anchors/page-links declared, no
  classification or narrator-verdict leak, offline hosts and numbers, the client message carried
  verbatim and the placeholder handle never printed, and the five Instagram scenes being genuinely
  Instagram-native and distinct.
- `frontend/src/components/simulation/SceneContainment.test.jsx` — containment on every Instagram
  stage and surface.
- `frontend/src/pages/SceneScenariosInstagram.test.jsx` — I01–I05 through the real controller and
  the real attempt API, safe and unsafe routes, reload recovery, and what the device never sends.
- `backend/tests/sceneAffordance.test.js` — every Instagram control resolves legally against the
  real definition, the safe path sums to ten, the pinned event/point pairs, and the
  verification-source guard.
- `frontend/src/simulation/sceneResearch.test.js` — this document: a section per scenario, a linked
  source for every technique named, and the no-mapping statement for I03.

- `backend/tests/sceneAffordance.test.js` (IMMERSIVE-004A additions) — I01–I05 identity pinned
  (title, disposition, canonical family and triggers, military flag), safe walks through the real
  engine into the real review (ten, `handled_safely`, no mistakes, six stages in order), and unsafe
  walks reviewed with each scenario's own stage text (I01 login, I02 reply and appeal, I03 false
  positive and the stranger's form as `unsafe_handling`, I04 payment, I05 route disclosure), with no
  event code or point value in any review.
- `frontend/src/simulation/sceneModel.test.js` (IMMERSIVE-004A additions) — no verdict word
  (clone, impersonation, genuine, look-alike, unknownsender) on any Instagram control, page or beat;
  no branch shape shared with any WhatsApp scene; every social-page link resolves; the toast and
  directory name the client's handle; I01/I02 links come from the bank asset; I03's pull to another
  channel is under the post, never in it; I04's real friend has a live story and two call routes;
  I05's claimed mutual is checkable outside the DM and privacy review is local.

## 8. Findings during verification

Every one of these was found by playing the scenes in a real browser, fixed, and pinned by a test.

1. **The delivered row was empty.** The Instagram list rows returned their `children` instead of their
   body when they were controls, so the one row that mattered drew as a blank strip while every
   jsdom suite passed (they find the row by its accessible name). Fixed; the page suite now asserts the
   row's visible text.
2. **Answer leakage in a resolve pill.** I04's banner read "Report the clone for impersonation", and a
   verify item "Report the account for impersonation". The WhatsApp verdict list catches "cloned" but
   not "clone". Relabelled to "Report riya.kapoor_2 and tell Riya"; a new Instagram-wide assertion
   bans clone/impersonation/genuine/look-alike. Also softened: "Share it to your story (it’s approved
   for release)", "DM … to ask if the post is genuine", "…before reading it fully", "Keep it friendly
   but share no location, unit or routine", "Open the Riya you already follow" (now "Search:
   riya.kapoor"), and a payment-sheet note saying the payee was not the sender (removed).
3. **The bank's placeholder sender on shared screens** — toast title and directory comparison. Fixed
   generically (§0.5); the result card is the remaining limitation.
4. **A post opened scrolled to its last comment**, hiding the author row the inspection lives on; posts
   now open at the top, DMs at the newest message.
5. **Visual defects**: the carousel glyph drew through the slide title; the slides could not be
   changed (now previous/next, local); notifications repeated the handle ("nisha.bakes nisha.bakes
   and 12 others…"); Instagram chips wore WhatsApp green (new `ig` variant of `SceneControl`, position
   not risk); Follow buttons were filled on accounts already followed; a neutral privacy setting drew a
   tick; social pages had a grey ground; "Search" titled a post page.
6. **I05 echoed the wrong sentence**: all three quick replies share one consequence kind, so the thread
   echoed the city answer under the route chip. The echo is now a neutral "You replied" line followed
   by his next question.

### Tests

| Suite | Result |
| --- | --- |
| Full frontend `vitest run` | **1256 / 1256**, 27 files (1110 before this job) |
| `frontend/src/pages/SceneScenariosInstagram.test.jsx` (new) | **33 / 33** |
| `frontend/src/simulation/sceneModel.test.js` | **468 / 468** — all 30 scenes (386 before) |
| `SceneContainment` + `sceneResearch` | **198 / 198** (167 before) |
| `oxlint` | clean; `vite build` clean |
| Full backend `npm test` (no DB URI) | **509 pass, 0 fail**, 322 skipped (498 before) |
| `backend/tests/sceneAffordance.test.js` | **54 / 54** (43 before) |
| DB-backed suites, sequential, isolated `cyber_awareness_004a_t_*` | **322 / 322**, nothing else touching mongod |

### Scoring and review, through the real engine over HTTP

`playScenario.js` (I01–I05 paths added; `PIN_INSTAGRAM` added beside `PIN_WHATSAPP`), `REVIEW=1`, on
`cyber_awareness_004a_verify`, API 5055: I01 safe **10** · login **0** · premature reply + fee **0**;
I02 safe **10** · appeal submission **0** · reply + report unchecked **2**; I03 safe **10** · mute +
report **0** (`false_positive`) · stranger's form **3** (`unsafe_handling`); I04 safe **10** · pay **0**
· premature + ask + report **0**; I05 safe **10** · route disclosure **0** · friendly question back
**4**. Every review used the scenario's own stage text; `review leaks none` on all fifteen.
WhatsApp regression on the same stack: W07 safe **10**, W12 safe **10** / pay **0**, W17 safe **10**,
W22 safe **10** / deposit **0** — identical to IMMERSIVE-003B–E.

### Browser verification (isolated)

Isolated DB `cyber_awareness_004a_verify` (imported from `scenarios/v1`, content sha `8e7a6c98…`),
API **5055** with `MONGO_URI` set in its own process, frontend **5199** (`--mode verify`); 5000/5173 not
running. The isolated Instagram pool was pinned to I01–I05 for the run and restored (0 inactive);
non-Instagram runs in the browser attempts were closed through the HTTP API from the page.

| | Safe path (by hand) | Unsafe path (by hand) | Also checked |
| --- | --- | --- | --- |
| I01 | **10/10** — post → profile → About → bio link → close claim page → search → pinned rules → report | **0/10** — skip → bio link → login typed → Allow → ask for proof → finish claiming | reload on the resolve stage rebuilt the post with no surface; consequence banner after login |
| I02 | **10/10** — request → profile → leave the request → Settings › Account Status → report | **0/10** — read → appeal → username, masked password, backup code typed → submit → ask for proof → leave in Requests | reload on a pushed final page returned to the thread at verify |
| I03 | **10/10** — post → profile → About → save → directory (row matches, "details from the message" shows `@unitfalcon_public`) → keep | **0/10** — profile → stranger's form (shown, not fillable) → report → report | the stranger's comment appears only at branch |
| I04 | **10/10** — request → clone profile → Search: riya.kapoor → her story → don't send → call Riya (captions) → report | **0/10** — profile → pay card → PIN typed → pay → report unchecked → leave it | played at **640 px** (≈ 200 % zoom): no horizontal overflow |
| I05 | **10/10** — story-reply thread → profile → where it comments → don't reply → phone Karan → Account privacy → restrict and report | **0/10** — profile → "daily route and time" → Send → ask the account → answer their questions | played at **375 px** (mobile) |

Result pages and the post-attempt review were opened for every attempt: I01/I05 "Handled safely",
I03 "Genuine item rejected" with its three cards, I02/I04 "Threat missed" with their own correct
actions. Ledgers read back from the isolated DB matched the engine exactly; metadata keys were only
`dwell_ms, intent, open_latency_ms, resolution_code, transition, verify_source, consequence`; a search
of **every document in every collection** for the seven typed strings (usernames, passwords, backup
code, PIN, the quick-reply text) found **0**. **Offline:** `performance` resource entries and the
request log showed only `http://localhost:5199` and `http://localhost:5055`; no `https://` request was
made. A WhatsApp scene (W06) was opened in the same browser session: toast, chat and contact info
unchanged.

**Production was not mutated.** `cyber_awareness_training` identical before and after: attempts 10,
candidates 9, runs 100, events 209, definitions 100 (none inactive), legacy scenarios 40, assessments 1,
snapshots 6. All ten bank files hash identically before and after.
