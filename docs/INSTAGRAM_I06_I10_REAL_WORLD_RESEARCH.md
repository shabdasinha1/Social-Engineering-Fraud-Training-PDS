# Instagram I06–I10 — real-world research and storyline reconstruction

**Task:** IMMERSIVE-004B — the second Instagram batch
**Naming:** the client's bank numbers every Instagram scenario `I01`–`I25` (specification pages
36–61); this batch is **I06–I10** in the data, the registry, the tests and this document.
**Scope:** Instagram I06, I07, I08, I09, I10 only. WhatsApp W01–W25 and Instagram I01–I05 are
complete and unchanged in behaviour; Instagram I11+, Email and SMS are untouched.
**Status:** design record for the five Instagram scenes authored by this task.
**Companions:** [`INSTAGRAM_W01_W05_REAL_WORLD_RESEARCH.md`](INSTAGRAM_W01_W05_REAL_WORLD_RESEARCH.md)
(I01–I05) and the five WhatsApp records, which use the same method.

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
surfaces — a comment thread under your own post, a sponsored reel and its advertiser's ad history,
a "partner agency" selling badges, a brand-ambassador agreement. What is deliberately **not** taken
is infrastructure, tooling, real brands, real accounts, real people, real public figures or
anything operational. Every host is `*.training.example`; every phone number is in the reserved
`+91 00000 xxxxx` range; every UPI handle ends `@trainingpay`; every profile, post, reel, comment,
page, form, payment sheet, register and settings screen is local, inert and offline. No image file
exists anywhere — reels, grids, avatars and frames are drawn from CSS.

### 0.2 Source of the threat intelligence

Primary source: **MITRE ATT&CK, Enterprise and PRE matrices, website version v19.2** (released
28 April 2026) — re-confirmed as the current version on the live versions page on 15 September 2026
(<https://attack.mitre.org/versions/>; v18.1 ran 28 October 2025 – 27 April 2026). Techniques
first read for I01–I05 on 14 September 2026 were re-checked where this batch relies on a different
part of the description; T1583.008, T1598.001, T1204, T1591.003, T1585.001, T1598 and T1684.001
were read from their live pages on 15 September 2026.

Version note carried forward: `T1656 Impersonation` no longer exists as a top-level technique and
resolves to **T1684.001** (parent T1684 Social Engineering, created 14 April 2026). Older notes
citing T1656 should not be trusted.

Secondary sources, for the real-world pattern behind each scenario (all read 15 September 2026):

- **I06** — US Army, "OPSEC Awareness Month: Avoid oversharing on social media, practice OPSEC"
  (7 May 2025): "small bits of information can be assembled to make big pictures", review photos
  before posting, do not announce locations and times, know who you are talking to online
  (<https://www.army.mil/article/285316/opsec_awareness_month_avoid_oversharing_on_social_media_practice_opsec>);
  US Army, "Social Media Safety" — geotagging as the equivalent of a grid reference on every post
  (<https://www.army.mil/socialmedia/safety/>).
- **I07** — Avast research reported by IT Pro, "Malware found on popular Facebook, Instagram and
  Vimeo browser extensions" (17 December 2020): third-party "downloader" tools for social video that
  redirected traffic and harvested personal data
  (<https://www.itpro.com/security/malware/358165/malware-found-on-browser-extensions>). The
  scenario itself is ordinary social sharing; this source is only for its one untrusted-channel
  temptation.
- **I08** — F-Secure, "A complete guide to Instagram scams" (verification-badge offers for a fee
  through official-looking forms asking for personal and payment details)
  (<https://www.f-secure.com/en/scam-protection/instagram-scams>); MailGuard, "Instagram verification
  phishing scam targets business accounts" (July 2025: "verified badge" lures ending on a fake login)
  (<https://www.mailguard.com.au/blog/instagram-verification-phishing-scam-targets-business-accounts>);
  Instagram Help Center, "Requirements to apply for a verified badge"
  (<https://help.instagram.com/312685272613322>) — the request is made in the app.
- **I09** — Kaspersky, "How users are losing money to deepfake ads on Instagram" (Alanna
  Titterington, 4 August 2025): paid ads with AI-generated videos of real financial commentators,
  an "exclusive" WhatsApp group, a trading-app link, fabricated gains, then fees to withdraw
  (<https://www.kaspersky.com/blog/scam-with-deepfakes-in-instagram-facebook-whatsapp/54025/>);
  FINRA, "Social Media Investment Group Imposter Scams" (9 December 2025): the move from an
  Instagram/Facebook ad to an encrypted group, deepfaked professionals, and "check BrokerCheck"
  (<https://www.finra.org/investors/insights/investment-group-imposter-scams>); SEBI's May 2025
  caution on unregistered entities impersonating public figures and "VIP" WhatsApp groups, and on
  verifying registration on the regulator's own site
  (<https://www.business-standard.com/amp/markets/news/sebi-warns-investors-about-stock-market-scams-via-social-media-platforms-125052101619_1.html>).
- **I10** — BBB Scam Alert, "Aspiring social media influencers fall for phony sponsorships"
  (23 July 2024): a "brand ambassador" offer of free product that costs the victim shipping or a fee
  (<https://www.bbb.org/article/scams/18288-scam-alert-instagram-users-fall-for-phony-offers-from-brands>);
  Norton LifeLock, "13 Instagram scams" (brand-ambassador "shipping fee" pattern and
  `@Brand_Ambassador` secondary accounts)
  (<https://lifelock.norton.com/learn/fraud/instagram-scams>); US FTC, "Influence peddling: bogus
  brand ambassador managers scam prospective influencers" (October 2023)
  (<https://ftc.gov/business-guidance/blog/2023/10/influence-peddling-bogus-brand-ambassador-managers-scam-prospective-influencers>).

### 0.3 Interpretation rule

ATT&CK is used as a **behavioural reference, not a checklist**. A mapping is recorded only where
the technique's own description describes what the scenario does. **I07 has no mapping, and that
is stated** — it is a friend sharing a recipe, and there is no adversary to catalogue. Four
techniques were **considered and rejected**, each with its reason: T1598.003 (I06), T1684.001
(I08), T1204 (I09) and T1566.003 (I10). Every mapping in this batch is a partial fit in at least
one respect, and each section says which.

### 0.4 What this document may and may not change

| Thing | May IMMERSIVE-004B change it? |
| --- | --- |
| Scenario IDs, platform, level, disposition, family, trigger, military flag, version | **No** |
| The six stages, their order, their text, expected actions, scoring semantics, feedback | **No** |
| `backend/data/scenarios/v1` and its fingerprint `8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687` | **No** |
| `backend/data/synthetic/v1` and its fingerprint `2779b03939e13cf11e0bee44493609f0c91e228f201f22f8c025a080509afde1` | **No** |
| The engine, the event ledger, the 90-minute deadline, the training-feedback review | **No** |
| Scene structure, beats, Instagram surfaces, forms, phone UI | **Yes — this is the whole task** |

**The client scenario remains authoritative** over everything in this document. Where the research
and the client's own stage text disagree, the client's text wins and the disagreement is recorded.

### 0.5 Content notes carried forward

**The placeholder Instagram sender.** I06, I07, I08 and I10 carry the client's sentence as
`@handle: message` beside a generated `sender_profile` asset that is a placeholder
(`@unknownsender844`, `…257`, `…120`, `…397`). Handled exactly as in I01–I05: the scene uses the
handle in the client's sentence, carries the message verbatim, names the bank's sender **asset id**
on every inspection, and never prints the placeholder.

**I09 is different, and is recorded rather than forced into the same shape.** Its notification is
a sponsored placement: the body is "Exclusive AI trading window - join the private group before
midnight." with **no handle**, the sender asset's display name is the client's own word
`Sponsored` (`name_source: "client_specification"`), and only the identifier (`@sponsored829`) is a
placeholder. The scene therefore titles the toast "Sponsored", shows the row as
"Sponsored: Exclusive AI trading window…" (the client's stage-1 wording), authors the advertiser
account (`alphaedge.trading`) as scene content, and never prints `@sponsored829`.
`sceneModel.test.js` asserts both halves.

**The narrator line is not printed.** Each `prior_context` sentence states the situation and
sometimes the verdict ("A sponsored reel shows a synthetic public figure…", "A supposed sports
brand…"). None is printed; the scene presents the context through the post, reel, thread or
profile, and the verdict-word assertion now also bans `deepfake` and `lip-sync` wording on I06–I10.

**Answer-revealing asset prose is not displayed.** The I09 and I10 `browser_page` assets carry the
client's stage-4 sentence as their `body` ("…moves the learner to a fake WhatsApp group…", "…a fake
creator-contract page…"). The scenes use only the assets' `display_target` and `host`; no control
opens the generic inspection sheet for those assets, because that sheet would print the body. I09's
link inspection opens a scene-authored "About this ad" screen instead.

**The result card placeholder** (known limitation from I01–I05) applies to I06, I07, I08 and I10;
I09's result card shows the client's "Sponsored".

---

## 0.6 Differentiation from I01–I05 and WhatsApp W01–W25

The twenty-five WhatsApp rows are in the I01–I05 record (§0.7 there) and are not repeated. The ten
Instagram scenes, measured the same way:

| | Behavioural lesson | Social mechanism | Primary evidence | Interaction pattern | Verification pattern | Unsafe temptation |
| --- | --- | --- | --- | --- | --- | --- |
| I01 | You cannot win what you never entered | Greed + scarcity, public tag | Post with comments off, follower ratio, About (2 days) | Post → profile → claim site | In-app brand search → pinned rules | Social login / delivery fee |
| I02 | Enforcement lives in Account Status | Fear + urgency | Message request, appeal host | Request → appeal login | Settings › Account Status | Password + backup code |
| I03 | Use a verified public post; refuse the commenter | Empathy | Verified history, release marker | Post Save/Share | Official-account directory | Report the unit; stranger's form |
| I04 | Copied photos and mutuals don't prove identity | Empathy + urgency | Clone beside the real friend, her story | Request → pay card → sheet | Friend's saved number / mutual | Pay INR 4,500 |
| I05 | Friendly questions build a targeting package | Flattery + curiosity | Story reply, its comments elsewhere | Quick-reply chips | Call the claimed mutual; own privacy | City / unit / route chip |
| **I06** | **Your own post is the leak surface: public replies and location tags add up to an operational picture** | **Pride + social validation (likes on the question, a friend joining in)** | The question has likes; a friend answers dates in the thread; the account's grid is **other people's photos re-captioned with place and dates**; its pinned **"season map"** compiles them | **Comment box under your own post; Edit post › Add location with the app's own suggestions** | The post's **release note**; the unit public-information cell | Public reply with range + dates; tagging the range; "DM me" |
| **I07** | **Ordinary shared content from a known friend should be used normally — don't over-react** | Familiarity | Main inbox (not Requests), years of chat, **yesterday's conversation about this recipe**, reel by a long-running creator, no link or ask | **Reel player with Like / Save; reply in the chat** | **Search inside the existing conversation** ("recipe") | Report/block/mute a friend; paste the link into a **reel-downloader site** |
| **I08** | **A badge can't be bought from a third party; the official route is inside the app** | Status + scarcity (score 94/100, 2 slots left) | **A ✔️ emoji typed into a display name** vs the platform badge; About says not verified; "clients" whose names also end in ✔️; paying clients complaining in the pinned post's comments | Link card → pre-approval → ID → login "so we can apply from inside" → priority fee | **Settings › Account type and tools › Request verification** and the **Help Center** | Submit ID + password; pay INR 2,999 |
| **I09** | **A famous face in a paid ad is not an endorsement; check registration, not the video** | Greed + authority | **"Sponsored" label**, advertiser 3 weeks old with 3 former names, **ad transparency** (14 ads, same script, different faces), **audio credited to the advertiser**, a **frame where the voice runs and the mouth is closed** | **Sponsored reel in the feed → call-to-action strip → landing page → group invite / app / KYC / deposit** | The **markets regulator's Investor Register** app | Join the group; install the APK; KYC with PAN/Aadhaar; deposit |
| **I10** | **Flattering "free" collaborations that cost you money — read the clauses** | Flattery + reciprocity | Handle and bio, 11-day-old account with unrelated former names, **the pinned post's comments** (it is the brand's own photo; someone paid shipping and got nothing), **agreement clauses**: share your Instagram password; card charged INR 1,499/month after 30 days | **Bio link → creator agreement with terms → details (address, card, Instagram login) → sign** | The brand's **own website, typed in**: Creators page and "check an account" | Sign and pay; UPI shipping; reply YES |

### Nearest existing scene, and what is genuinely new

| | Nearest | What that already taught | Why this is not the same scenario |
| --- | --- | --- | --- |
| I06 | I05 (elicitation), W19 (location), W23 (posting) | Don't answer where/who/when to a stranger | I05 was a **private** DM from a stranger with quick replies. I06 happens **in public, on the learner's own post**, where the release is a **public comment or a location tag the app itself suggests**, and the evidence is how the account **re-publishes** answers into a compiled map. The unsafe act changes content the learner owns. No WhatsApp scene edits the learner's own public content. |
| I07 | I03 (legit public post), W07 (expected document), W16 (legit change) | Genuine items exist; verify, then use | I03 was a verified **public broadcast** with a stranger in the comments; I07 is a **private share from a friend** where the only "check" is the conversation's own history, and the only risk is the learner's own habit (a downloader site). It is the first Instagram item whose correct verification is **no new source at all** — the client's "use the existing thread context". |
| I08 | I02 (request + Settings), I01 (look-alike) | Platform matters are handled in-app | I02 was a **threat** (deletion) settled by showing nothing is wrong. I08 is an **aspiration** settled by showing how the thing really works; the discrimination skill is **a ✔️ emoji in a name versus the platform's badge**, and the resolution explicitly allows using the official route. No earlier scene has a fee for status, a pre-approval score or a scarcity counter on a badge. |
| I09 | W13 (IPO group), W22 (register), W15 (voice) | Guaranteed-return groups; check the register; voices can be faked | W13 and W22 started from a person in a chat. I09 is the first **paid placement**: nobody contacts the learner. The investigation is **ad transparency** (who paid, how many ads, which faces), **audio attribution** and **stepping through frames**; the funnel crosses from Instagram to a group, an APK and KYC in one landing page. |
| I10 | I01 (brand + fee), W17 (task scam), W20 (terms) | Fees for prizes; brands have official accounts | I01 was a **win** announced in public and settled by a pinned rules post. I10 is a **job-like offer** made privately to a creator, where the decisive evidence is **in the agreement's clauses** (password sharing, a recurring charge) and the verification is the **brand's own website** reached by typing its address — not in-app search. |

**Concepts rejected before writing** (the brief's list): for I06, "a stranger DMs asking where you
are posted" (I05 again) — replaced by the public comment on the learner's own post and the Add
location sheet; for I07, "a friend's account sends a reel with a link" (would turn the genuine item
into a trap) — replaced by a reel with no link and a history that matches; for I08, "a support DM
asks you to log in to keep your badge" (I02 again) — replaced by a **sale** of status, an emoji
check mark and the in-app request page; for I09, "a stranger adds you to an investment group" (W13)
— replaced by the sponsored reel, ad transparency and frame stepping; for I10, "a brand account says
you won free kit, search the brand" (I01) — replaced by a creator agreement whose clauses carry the
turn, verified on the brand's own website. No I06–I10 scene is "report this profile": the correct
resolution of I07 is to keep using the content.

`sceneModel.test.js` asserts that no I06–I10 branch-stage shape equals any W01–W25 or I01–I05 shape,
and that the five are distinct from one another.

### The Instagram-native surfaces this batch adds (all reusable)

| Addition | Where | Used by |
| --- | --- | --- |
| `conversation.own` — the learner's own post: the author row is the learner, and the commenter's profile opens from their comment | `InstagramScene.jsx` | I06 |
| A comment composer under a post (only when the scene offers comment replies) with "Comments on your post are public." | `InstagramScene.jsx` | I06 |
| Anchored controls under a comment | `IgBlocks.jsx` `IgComment` | I06 |
| `conversation.media: 'reel'` (4:5 feed crop, Reel badge, frame stepping), `audio`, `cta` strip with a control anchored to `cta` | `InstagramScene.jsx`, `IgBlocks.jsx` `PostMedia` | I09 |
| Social view `reel` — the full-screen reel player (frames, account, audio, counts, link to the author's profile) | `SocialSurface.jsx` | I07 |
| Social view `list` — plain rows (Add location suggestions; search inside a conversation) | `SocialSurface.jsx` | I06, I07 |
| `sharedPost` beat with `reel` and a title | `IgBlocks.jsx` | I07 |
| Drawn art: `field`, `food`, `chart`, `gear`, `award` | `IgBlocks.jsx` `ArtFill` | I06–I10 |

Reused unchanged: `BROWSER` (application, landing page, agreement, brand site, downloader),
`PAYSHEET` (fee, deposit, shipping), `CALL` (public-information cell, Neel), `APP` (Investor
Register), `social` views `profile`, `about`, `people`, `post`, `status`, `settings`.

---

## 1. I06 — Where Was This Exercise?

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Where Was This Exercise? |
| Disposition | **Malicious** |
| Level | Easy |
| Family (client) | Operational-information elicitation |
| Canonical family | `operational_elicitation` |
| Trigger (client) | Pride + social validation \| FICTIONAL MILITARY CONTEXT |
| Canonical triggers | `pride` |
| Military flag | Yes |
| End state | No reply or geotag is added; the comment is routed to moderation. |
| Decision signal (stage 3) | Public enthusiasm does not create a need to know; the request seeks operational context. |

### MITRE ATT&CK alignment

| Technique | Name | Matrix / tactic | Version | Created / last modified |
| --- | --- | --- | --- | --- |
| [T1598](https://attack.mitre.org/techniques/T1598/) | Phishing for Information | PRE / Reconnaissance | 1.4 | 2 Oct 2020 / 12 May 2026 |
| [T1591.001](https://attack.mitre.org/techniques/T1591/001/) | Gather Victim Org Information: Determine Physical Locations | PRE / Reconnaissance | 1.1 | 2 Oct 2020 / 24 Oct 2025 |
| [T1591.003](https://attack.mitre.org/techniques/T1591/003/) | Gather Victim Org Information: Identify Business Tempo | PRE / Reconnaissance | 1.0 | 2 Oct 2020 / 24 Oct 2025 |
| [T1593.001](https://attack.mitre.org/techniques/T1593/001/) | Search Open Websites/Domains: Social Media | PRE / Reconnaissance | 1.0 | 2 Oct 2020 / 24 Oct 2025 |
| [T1585.001](https://attack.mitre.org/techniques/T1585/001/) | Establish Accounts: Social Media Accounts | Enterprise / Resource Development | 1.1 | 1 Oct 2020 / 12 May 2026 |

**Why this maps.** T1598 is the elicitation: "phishing messages to elicit sensitive information",
here a public comment. T1591.001 is what "which base" and the location tag seek; T1591.003 is
"which dates", "back Friday" and "which gate… at 06:00" — the tempo of an exercise. T1593.001 is how
the account works: it searches social media for service members' posts and re-publishes what it
learns. T1585.001 is the fan-page persona itself — "create and cultivate social media accounts…
to build a persona", with former names unrelated to its current one.

**Considered and rejected:** [T1598.003](https://attack.mitre.org/techniques/T1598/003/) Spearphishing
Link. Nothing in I06 is a link; the ask is words in a comment and a tag the learner adds to their own
post. Mapping a link technique would teach the learner to look for a URL that is not there.

**Partial fit, stated.** ATT&CK's reconnaissance techniques are framed around an organisation; the
public-post aggregation pattern (small answers and geotags compiled into a picture) is sourced from
the US Army's OPSEC guidance, which states it directly.

### What must NOT be copied

No real unit, base, range, exercise, route, date or account. "Unit Falcon", "Range 3", "Lake
sector", "defence_fan_archive", "ranger_fanpage_in" and the release reference `PA/FAL/2026/188` are
invented; the photo is drawn; the location suggestions name nowhere real.

### Client requirements preserved

Stage 2's "comment thread and commenter's profile" is the learner's own post with its comments and
the commenter's profile, opened from the comment. Stage 3's "unknown identity, military-themed
reposts and specific location/schedule questions" are the profile (a fan page followed by one of the
learner's friends), its About page (joined six months ago, two unrelated former usernames), its grid
of reposts captioned with places and dates, and the question itself. Stage 4's "reply composer and
location-tag selector" is the comment box under the post and **Edit post › Add location**. Stage 5's
"check the post's approved-release note and consult the unit public-information route" is the
release note (local navigation) and the call to the public-information cell. Stage 6's "do not
disclose details; hide/report the eliciting comment" is the resolve banner, with the rationale box.

### Enhanced synthetic storyline

The learner posted a generic training photo yesterday, cleared for release. Friends liked it.
Today `defence_fan_archive` comments: "Impressive! Which base and what dates was this taken? DM me
the route." Fourteen people have liked the question, a fan page adds "+1 which range is this?", and
at the branch stage a friend replies for everyone — "we were out there six days, back Friday" —
and the account asks him which gate they came in by. Its pinned post is a "season map" thanking
everyone who told it where they trained, with dates and a convoy time. The release note on the
learner's own post clears the image only.

### Conversation progression

1. The post and caption; the release-note line.
2. Friends' comments; the client's question (with likes); the fan page's "+1".
3. `branch` — the friend's reply with dates; the account's follow-up about the gate.
4. After a consequence — "Your post was updated" and the account asking how the convoy came in
   (release), or the learner's "DM me" and a message request (engagement).

### Evidence the learner can discover (progressive)

- **The thread**: the question is specific (base, dates, route) and moves to DM.
- **The profile**: a fan page, followed by a friend; posts are other people's photos re-captioned
  with a place and date.
- **About this account**: six months old, two unrelated former usernames.
- **Pinned "season map"**: the compiled picture — the thing small answers become.
- **Following**: the other fan page from the comments, and the learner.
- **Release note**: cleared for the image; not for place, dates, routes, timings or people.
- **Public-information cell**: don't answer anywhere; hide and report; the account is known.

### Learner interaction journey

`activity → your post → comments → the commenter's profile → grid / About / pinned map → leave it,
or reply in the comment box, or Edit post › Add location → release note → call the cell → hide and
report`

### Simulation surfaces

Post view (`conversation.kind: 'post'`, `own: true`, comment composer), profile (`SOCIAL`: profile /
about / season-map post / following), Add location (`SOCIAL` `list`), release note (`SOCIAL`
`status`), public-information cell (`CALL`), one directory row.

### Verification mechanism

`verify_known_number` (the unit public-information cell on the directory number) or
`verify_trusted_directory`. Reading the release note is local navigation, offered from inspect on.
"Ask them in the comments why they want to know" is the 0-point route; reporting without checking
is +1.

### Safe resolution

Open (`ITEM_OPEN` 0) → the commenter's profile (`INSPECT_CONTEXT` +2) → leave the question
unanswered, or Cancel on Add location (`SAFE_PIVOT` +3) → call the cell (`TRUSTED_VERIFY` +3) → hide
and report the comment (`RESOLVE_CORRECT` +2). Ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Reply with the range and the dates (comment box) | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Add "Falcon Cantonment · Range 3" / "Lake Sector Training Area" | `share_location` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Tell them to DM you | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Reply "Thanks bro 🙏 DM me" from the notification | `reply` (open) | `PREMATURE_REPLY` | −1 |
| Ask them in the comments why they want to know | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |
| Leave the comment up / answer them by DM (resolve) | `resolve_retain` / `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

`SAFE_PIVOT +3` / `RISKY_OPEN_REPLY −3` / `SECRET_PAYMENT_INSTALL_DATA_RELEASE −8`,
`TRUSTED_VERIFY +3` / `REPORT_ONLY_WITHOUT_CHECK +1` / `VERIFY_THROUGH_MESSAGE 0`,
`RESOLVE_CORRECT +2` / `CONTRADICTORY_UNSAFE_FINAL −4`.

### Realism decisions

The location suggestions are the app's own ("Suggested from where the photo was taken"), because
the real risk is a helpful default, not a hostile form. A friend leaking dates in the thread is
deliberate: the lesson is aggregation, and the learner sees it happen. "Hide" has no engine intent;
"Hide the comment and report it" is `resolve_report`, the client's wording on the engine's legal
report resolution (as "Restrict" was in I05).

### Known limitations

The public-information call is scripted. One decision per stage: a run records the reply or the
tag, not both. Hiding a comment is represented through the report resolution. The result card shows
the placeholder sender line (§0.5).

### Why the final simulation stays faithful

The handle and the question are the client's, verbatim; the inspection names the bank's sender
asset; no word on the device says the account is hostile — its own pinned map is what shows what it
does with answers.

---

## 2. I07 — Known Friend Shares a Reel

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Known Friend Shares a Reel |
| Disposition | **Legitimate** |
| Level | Easy |
| Family (client) | Legitimate social sharing |
| Canonical family | `legit_routine_broadcast` |
| Trigger (client) | Familiarity |
| Canonical triggers | `familiarity` |
| Military flag | No |
| End state | Reel closes normally and the message is marked read. |
| Decision signal (stage 3) | The context matches the prior conversation and the reel stays within the app. |

### MITRE ATT&CK alignment

**There is none, and none has been invented.**

A friend sending the recipe reel he said he would send is ordinary social behaviour. Mapping it to
an impersonation or phishing technique because it is a DM with media in it would be the inversion
this batch was told not to perform, and would teach the learner that every shared reel is an attack.

**Closest defensible behavioural reference:** the client's own discrimination pricing for a genuine
item — `FALSE_REPORT_BLOCK` −4 for reporting or blocking the friend, `NEEDLESS_REJECT_IGNORE` −2 for
muting him and leaving it unwatched, `UNSAFE_EXTERNAL_ACTION` −4 for moving the content to an
untrusted channel (a third-party downloader site, the pattern Avast documented in social-video
"downloader" tools). None of these needs an adversary technique.

### Client requirements preserved

Stage 2's "established DM thread and shared reel" is Neel's chat in the main inbox — yesterday's
messages about the dal and today's shared reel. Stage 3's "exact handle, long message history,
public source and absence of external action" are the header handle (unchanged since 2016 on About
this account), the thread, the creator's profile (years of cooking reels) and the absence of any
link, request or payment. Stage 4's "in-app reel player with Like/Save/Reply" is the reel view with
Like and Save, and the reply in the chat composer. Stage 5's "use the existing thread context" is a
search inside the conversation. Stage 6's "view/save or reply normally; do not report or block" is
the resolve banner.

### Enhanced synthetic storyline

Last night the learner told Neel the dal at a friend's house was unreal; Neel said he'd seen a reel
that looked exactly like it and would find it. Today he sends it: "This is the recipe we discussed
yesterday." The reel is from a cooking account that has posted twice a week since 2019 and that the
learner's friends already follow; its audio is the creator's own. Searching the chat for "recipe"
shows yesterday's exchange and years of Neel sharing reels from the same creator, none with a link.
The only risky idea is the learner's: to keep the video, paste its link into a "reel downloader"
site that immediately wants notifications and an app install.

### Conversation progression

1. `YESTERDAY` — the learner's question, Neel's promise, "Sunday lunch plan".
2. `TODAY` — the shared reel card; the client's sentence.
3. `branch` — "the tadka bit at 0:40 is the trick".
4. After the downloader — the site asking for notifications and an app install.

### Evidence the learner can discover (progressive)

- **The inbox**: the chat is in Messages, not Requests; the handle is the one the learner knows.
- **The thread**: yesterday's conversation predicts today's message.
- **Neel's profile / About**: joined 2016, never renamed, 38 mutual friends.
- **The reel and its creator**: public, years old, audio credited to the creator, no link.
- **Search in conversation**: the same pattern going back to 2021.

### Learner interaction journey

`messages → Neel's chat → his profile or the history → watch the reel → Like / Save, or reply →
search the chat for "recipe" → save it and reply`

### Simulation surfaces

DM thread (`dm`, not a request) with a `sharedPost` reel card, reel player and creator profile
(`SOCIAL`: reel / creator / creator-about), Neel's profile (`SOCIAL`: profile / about), search in
conversation (`SOCIAL` `list`), downloader site (`BROWSER`, opened only by the unsafe choice), call
to Neel (`CALL`), one saved-contact directory row.

### Verification mechanism

`verify_known_app` — searching the existing conversation inside the app, the client's "existing
thread context". Calling Neel on his saved number is also independent (+3) but not required.
"Ask Neel here if he really sent it" is the 0-point route. Report and Block are the −4 false
positive this scenario exists to price.

### Safe resolution

Open (`ITEM_OPEN` 0) → Neel's profile (`INSPECT_CONTEXT` +2) → Like the reel (`CORRECT_USE` +3) →
search the chat (`TRUSTED_VERIFY` +3) → save the recipe and reply (`RESOLVE_CORRECT` +2). Ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Copy the link into a reel-downloader site | `open_link` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Mute Neel and leave it unwatched | `reject_ignore` | `NEEDLESS_REJECT_IGNORE` | −2 |
| Report the message / block neel.verma | `report` / `block` | `FALSE_REPORT_BLOCK` | −4 |
| Reply "thanks!!" from the notification | `reply` (open) | `PREMATURE_REPLY` | −1 |
| Report as spam / block / delete the chat (resolve) | `resolve_report` / `resolve_block` / `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

`CORRECT_USE +3` / `NEEDLESS_REJECT_IGNORE −2` / `UNSAFE_EXTERNAL_ACTION −4`, `TRUSTED_VERIFY +3` /
`FALSE_REPORT_BLOCK −4` / `VERIFY_THROUGH_MESSAGE 0`, `RESOLVE_CORRECT +2` /
`CONTRADICTORY_UNSAFE_FINAL −4`.

### Realism decisions

The genuine item gets as many screens as its neighbours (reel, creator, friend, history, call,
site). A reply to a friend is `safe_pivot` (correct use), never `reply`, because on a legitimate item
the engine prices `reply` as the untrusted channel.

### Known limitations

Search in the conversation is authored, not live. One decision per stage: Like, Save or reply are
each the one correct use.

### Why the final simulation stays faithful

The handle and the sentence are the client's; the inspection names the bank's sender asset; no word
on the device says the item is safe — the chat's own history and the reel's own page are what say it.

---

## 3. I08 — Verification Badge Agent

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Verification Badge Agent |
| Disposition | **Malicious** |
| Level | Easy |
| Family (client) | Fake verification service |
| Canonical family | `unsolicited_payment_lure` |
| Trigger (client) | Status + scarcity |
| Canonical triggers | `pride`, `scarcity` |
| Military flag | No |
| End state | Fake application is discarded and account remains secure. |
| Decision signal (stage 3) | A private agent cannot guarantee platform verification; official options are available through in-app settings. |

### MITRE ATT&CK alignment

| Technique | Name | Matrix / tactic | Version | Created / last modified |
| --- | --- | --- | --- | --- |
| [T1598.003](https://attack.mitre.org/techniques/T1598/003/) | Phishing for Information: Spearphishing Link | PRE / Reconnaissance | 1.7 | 2 Oct 2020 / 12 May 2026 |
| [T1585.001](https://attack.mitre.org/techniques/T1585/001/) | Establish Accounts: Social Media Accounts | Enterprise / Resource Development | 1.1 | 1 Oct 2020 / 12 May 2026 |
| [T1657](https://attack.mitre.org/techniques/T1657/) | Financial Theft | Enterprise / Impact | 1.2 | 18 Aug 2023 / 12 May 2026 |

**Why this maps.** T1598.003 is the application link that elicits an ID number and the Instagram
login. T1585.001 is the "agent" account — nine days old, cultivated with "client results" and tagged
"clients". T1657 is the priority fee and the "refundable deposit" that follows it.

**Considered and rejected:** [T1684.001](https://attack.mitre.org/techniques/T1684/001/)
Impersonation. The agent never claims to *be* Instagram or a known person; it claims to be a partner
that can obtain what Instagram gives. The deception is the promise and the ✔️ in its name, not an
identity — and treating it as impersonation would blur exactly the distinction from I02 this scene
exists to teach.

**Partial fit, stated.** The sale of badges, pre-approval scores and "turn off two-factor so we can
apply" are sourced from F-Secure's and MailGuard's verification-scam material and Instagram's
verified-badge help pages rather than from ATT&CK.

### What must NOT be copied

No real agency, account, form, UPI handle or Meta product page. "Badge Priority Agent",
`badgepriority.training.example`, the "clients" and `bpverify.desk@trainingpay` are invented. The
in-app pages are authored summaries, not reproductions of Instagram's help text.

### Client requirements preserved

Stage 2's "DM request and agent profile" is the message request and the profile. Stage 3's
"third-party claim, recent account, guaranteed outcome and payment request" are the bio ("Partner
agency… guaranteed"), About (nine days, former names `followers.boost.india`, `insta.growth.hacks`),
the pinned "client results" and the fee in the thread. Stage 4's "synthetic badge application
requesting password, ID and payment" is the application: pre-approval, identity (ID number), account
access (username and masked password) and the priority fee on a payment sheet. Stage 5's "platform's
own verification settings and Help Center locally" is Settings › Account type and tools › Request
verification and Help Center › Verified badges. Stage 6's "close; report/block; use only official
in-app verification if desired" is the banner's "Report the account; request a badge in Settings if
you want one".

### Enhanced synthetic storyline

A request from "Badge Priority Agent ✔️" congratulates the learner: their trek reels scored 94/100
and the profile is pre-approved for the blue badge — a one-time INR 2,999, badge in 24 hours or a
refund, two slots left today. The ✔️ is an emoji at the end of a display name; About this account
says the account is not verified. Its pinned "client results" are screenshots, and in the comments a
client who paid two weeks ago has no badge and another was asked for their password. Its tagged
"clients" are days old and have also typed ✔️ into their names. The app's own Request verification
page says requests are reviewed by Instagram, are free to request, and cannot be submitted, sped up
or guaranteed by anyone else.

### Conversation progression

1. Request card: nine days old, 7,480 following.
2. `MESSAGE REQUEST` — congratulations, the client's sentence, the score, the application link card,
   the fee.
3. `branch` — "Only 2 priority slots left today… expires at 6 PM".
4. After a consequence — "official partner, 100% success" (engagement), "your password was changed
   and two-factor turned off" (application), or a "refundable review deposit" (fee).

### Evidence the learner can discover (progressive)

- **The name**: a ✔️ emoji where a badge would be.
- **About this account**: not verified; nine days old; growth-hack former usernames.
- **Pinned post**: paying clients without badges, one asked for a password.
- **Tagged "clients"**: accounts days old with ✔️ typed into their names.
- **The application**: asks for the password and two-factor off "so we can apply from inside".
- **Settings › Request verification / Help Center**: who reviews, what it costs, no third parties.

### Learner interaction journey

`messages → requests → the request → profile → About / pinned / tagged → leave it, or open the
application → ID → login → review / fee → Settings › Request verification → report`

### Simulation surfaces

DM request thread (`dm`, `request`, `link` beat), profile (`SOCIAL`: profile / about / pinned results
/ clients), official route (`SOCIAL`: settings / request / help), application (`BROWSER`: apply /
identity / access / review / done), priority fee (`PAYSHEET`), one directory row.

### Verification mechanism

`verify_known_app` (the app's own Request verification page and Help Center) or
`verify_trusted_directory`. "Ask for proof they are a partner" is the 0-point route; reporting or
blocking without checking is +1.

### Safe resolution

Open (`ITEM_OPEN` 0) → profile (`INSPECT_CONTEXT` +2) → close the application, or leave the request
(`SAFE_PIVOT` +3) → Settings › Request verification (`TRUSTED_VERIFY` +3) → report
(`RESOLVE_CORRECT` +2). Ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Submit the application (ID number, Instagram login) | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Pay the INR 2,999 priority fee | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Ask how they can guarantee a badge | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Reply "Yes, I want the badge!" from the preview | `reply` (open) | `PREMATURE_REPLY` | −1 |
| Ask for proof they are a partner | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |
| Keep the request until 6 PM / take the slot (resolve) | `resolve_retain` / `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Identical shape to I01.

### Realism decisions

The wish for a badge is treated as legitimate: the resolution points to the official request rather
than implying the learner should not want one. The ID photo is deferred "to your agent on WhatsApp
after payment", which is how these sellers move victims off-platform.

### Known limitations

The Request verification page and Help Center are authored summaries. One decision per stage: a run
records the application or the fee, not both. The result card shows the placeholder sender line.

### Why the final simulation stays faithful

The handle and the sentence are the client's; the payment event names the bank's payment asset;
the typed ID number and password never leave the form (asserted). No word on the device calls the
agent anything; the app's own pages are what settle it.

---

## 4. I09 — Deepfake Trading Advertisement

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Deepfake Trading Advertisement |
| Disposition | **Malicious** |
| Level | Medium |
| Family (client) | Investment fraud / synthetic endorsement |
| Canonical family | `investment_and_task_fraud` |
| Trigger (client) | Greed + authority |
| Canonical triggers | `greed`, `authority` |
| Military flag | No |
| End state | Ad is removed locally and the synthetic portfolio remains empty. |
| Decision signal (stage 3) | A polished or familiar face does not prove endorsement; guaranteed returns and private groups are warning signs. |

### MITRE ATT&CK alignment

| Technique | Name | Matrix / tactic | Version | Created / last modified |
| --- | --- | --- | --- | --- |
| [T1583.008](https://attack.mitre.org/techniques/T1583/008/) | Acquire Infrastructure: Malvertising | Enterprise / Resource Development | 1.0 | 21 Feb 2023 / 15 Apr 2025 |
| [T1684.001](https://attack.mitre.org/techniques/T1684/001/) | Social Engineering: Impersonation | Enterprise / (Stealth) | 1.0 | 14 Apr 2026 / 12 May 2026 |
| [T1585.001](https://attack.mitre.org/techniques/T1585/001/) | Establish Accounts: Social Media Accounts | Enterprise / Resource Development | 1.1 | 1 Oct 2020 / 12 May 2026 |
| [T1598.003](https://attack.mitre.org/techniques/T1598/003/) | Phishing for Information: Spearphishing Link | PRE / Reconnaissance | 1.7 | 2 Oct 2020 / 12 May 2026 |
| [T1657](https://attack.mitre.org/techniques/T1657/) | Financial Theft | Enterprise / Impact | 1.2 | 18 Aug 2023 / 12 May 2026 |

**Why this maps.** T1583.008: adversaries "purchase online advertisements… to plant as well as
favorably position artifacts" — a paid reel placed in the feed that leads to a download page.
T1684.001: posing as a trusted figure — the commentator's face and an edited voice. T1585.001: the
advertiser account, three weeks old with three unrelated former names. T1598.003: the landing page's
KYC form collecting PAN, Aadhaar and mobile. T1657: the deposit and the "release fee".

**Considered and rejected:** [T1204](https://attack.mitre.org/techniques/T1204/) User Execution
(Execution, version 1.8; platforms Containers, IaaS, Linux, Windows, macOS). The landing page does
ask the learner to install an app, but T1204 concerns executing malicious code on enterprise hosts,
and nothing in this simulation executes; the harm modelled is money and identity documents.

**Partial fit, stated.** T1583.008's description centres on distributing malware; I09's ad
distributes a fraudulent investment funnel (group, app, KYC, deposit). The funnel and the deepfaked
commentator are sourced from Kaspersky's August 2025 analysis, FINRA's December 2025 alert and
SEBI's May 2025 caution.

### What must NOT be copied

No real public figure, programme, broker, regulator, app or group. "Prof. K. Raghavan", "Market
Hour", "AlphaEdge AI", `alphaedge.trading`, "AlphaEdge VIP 88", "Investor Register" and
`aecapital.desk@trainingpay` are invented; the frames are drawn. No real face, voice or video is
used, and the scene never names or implies a real person.

### Client requirements preserved

Stage 2's "sponsored reel and advertiser profile" is the reel in the feed (`Sponsored` subline) and
the advertiser's profile. Stage 3's "paid-ad label, advertiser history, altered lip sync, promised
returns and destination" are the Sponsored label and About this ad, About this account (three former
names) and Ads from this account (14 ads, same script, three faces), the frame at 0:07 where the
voice says "guaranteed" and the mouth stays closed, "3% daily, guaranteed" in the caption, and the
destination host. Stage 4's "offline ad landing page that moves the learner to a fake WhatsApp group
and trading app" is the landing page with its group invite, APK, KYC and deposit. Stage 5's
"regulator/official sources" is the Investor Register app searched for the commentator and the
platform. Stage 6's "close and report the ad/account" is the banner, with the rationale box.

### Enhanced synthetic storyline

A sponsored reel shows a TV markets commentator in a studio saying his AI strategy makes 3% a day,
guaranteed, and inviting viewers into a private group before midnight. Comments are limited; the two
visible are "₹38,000 profit" testimonials, and a friend wonders aloud whether that is the TV guy.
The advertiser joined three weeks ago as an IPO-alerts page, then a part-time-jobs page, then a
crypto club; it runs fourteen ads in four languages with a cricket captain and a film actor reading
the same script. The reel's audio is credited to the advertiser. At 0:07 the voice says
"guaranteed" and his mouth is closed. The call to action leads to a landing page promising 12 seats,
then a WhatsApp group where only admins speak, an APK "not listed — install the file directly", KYC
with PAN and Aadhaar, and a INR 10,000 deposit. The regulator's register lists the commentator as
not registered, has no platform by that name, and carries an alert about exactly these ads.

### Conversation progression

1. The reel, caption with the client's sentence, "Comments on this ad have been limited".
2. Two testimonial comments and a friend's question.
3. `branch` — "⏰ 3 hours left · 12 seats remaining".
4. After a consequence — added to the group; KYC received; app installed asking for a deposit; or a
   dashboard "+INR 2,140" with a release fee.

### Evidence the learner can discover (progressive)

- **The reel**: Sponsored; audio credited to the advertiser; frames stepped by hand.
- **About this ad**: targeting, destination host, ad age, audio credit.
- **Advertiser profile / About**: 3 weeks old; former usernames `ipo.alerts.daily`,
  `parttime.jobs.hub`, `crypto.gains.club`.
- **Ads from this account**: 14 ads, the same script, different famous faces, payer not declared.
- **Landing page**: guaranteed returns, seats, a group, an APK outside the store, KYC, a deposit.
- **Investor Register**: not registered; no platform; an investor alert.

### Learner interaction journey

`activity → the sponsored reel → step the frames → advertiser / About this ad / Ads from this account
→ Hide ad, or Join the group › landing page → group / app / KYC / deposit → Investor Register →
report the ad`

### Simulation surfaces

Post view with `media: 'reel'`, `audio`, `cta` strip; advertiser (`SOCIAL`: profile / about / ads
`status`); About this ad (`SOCIAL` `status`); landing page (`BROWSER`: landing / group / app / kyc /
kyc-review / kyc-done); deposit (`PAYSHEET`); Investor Register (`APP`); one directory row.

### Verification mechanism

`verify_known_app` (the regulator's Investor Register, an official source the learner opens) or
`verify_trusted_directory`. "Message the advertiser for its registration number" is the 0-point
route; reporting without checking is +1.

### Safe resolution

Open (`ITEM_OPEN` 0) → About this ad (`INSPECT_CONTEXT` +2) → close the landing page or Hide ad
(`SAFE_PIVOT` +3) → Investor Register (`TRUSTED_VERIFY` +3) → report and hide the ad
(`RESOLVE_CORRECT` +2). Ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Install the app (APK) | `attempt_install` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Submit KYC (PAN, Aadhaar, mobile) | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Pay INR 10,000 deposit | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Join the WhatsApp group | `open_link` | `RISKY_OPEN_REPLY` | −3 |
| Tap "Join the group" from the notification | `open_link` (open) | `PREMATURE_REPLY` | −1 |
| Message the advertiser for its registration number | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |
| Save it to decide / join before the seats go (resolve) | `resolve_retain` / `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Same shape as I01, with `attempt_install` added at the same −8 weight.

### Realism decisions

The tell in the video is shown as an observation on a paused frame, not as a label: nothing on the
reel, the advertiser's pages or the landing page says "deepfake", "synthetic" or "fake" (asserted).
The pattern is named only by the regulator's investor alert, which the learner reaches by verifying. Joining a group is engagement (−3),
because on its own it releases nothing; the app, the documents and the money are releases. The
learner's friend in the comments is curious, not warning — the scene does not hand out verdicts
through characters.

### Known limitations

Ad transparency pages and the register are authored summaries. Frames are drawn, not video. One
decision per stage: a run records the group, the install, the KYC or the deposit, not a sequence of
them.

### Why the final simulation stays faithful

The notification sentence and "Sponsored" are the client's; the landing page URL comes from the
bank's browser asset and the KYC submission names it; the asset's answer-bearing body text is never
shown (§0.5).

---

## 5. I10 — Brand Collaboration Shipping Fee

### Client scenario (authoritative)

| Field | Value |
| --- | --- |
| Title | Brand Collaboration Shipping Fee |
| Disposition | **Malicious** |
| Level | Medium |
| Family (client) | Influencer/brand impersonation |
| Canonical family | `unsolicited_payment_lure` |
| Trigger (client) | Flattery + reciprocity |
| Canonical triggers | `flattery`, `reciprocity` |
| Military flag | No |
| End state | No shipping fee or data submission occurs. |
| Decision signal (stage 3) | Unsolicited selection, cloned branding and upfront fees contradict a normal documented collaboration. |

### MITRE ATT&CK alignment

| Technique | Name | Matrix / tactic | Version | Created / last modified |
| --- | --- | --- | --- | --- |
| [T1684.001](https://attack.mitre.org/techniques/T1684/001/) | Social Engineering: Impersonation | Enterprise / (Stealth) | 1.0 | 14 Apr 2026 / 12 May 2026 |
| [T1585.001](https://attack.mitre.org/techniques/T1585/001/) | Establish Accounts: Social Media Accounts | Enterprise / Resource Development | 1.1 | 1 Oct 2020 / 12 May 2026 |
| [T1598.003](https://attack.mitre.org/techniques/T1598/003/) | Phishing for Information: Spearphishing Link | PRE / Reconnaissance | 1.7 | 2 Oct 2020 / 12 May 2026 |
| [T1657](https://attack.mitre.org/techniques/T1657/) | Financial Theft | Enterprise / Impact | 1.2 | 18 Aug 2023 / 12 May 2026 |

**Why this maps.** T1684.001: posing as a trusted entity — a sports brand's collaborations team.
T1585.001: the `peakgear_collabs` account, eleven days old, reposting the brand's own photos.
T1598.003: the bio-link agreement collecting address, card and the Instagram login. T1657: the
shipping fee, the "customs and insurance" follow-up and the recurring "kit club" charge.

**Considered and rejected:** [T1566.003](https://attack.mitre.org/techniques/T1566/003/) Phishing:
Spearphishing via Service (Initial Access, version 2.0) — as in I01, it is about gaining a foothold on
a system; nothing here lands on a device. Also not [T1586.001](https://attack.mitre.org/techniques/T1586/001/)
(Compromise Accounts: Social Media Accounts): the brand's real account is untouched, which is why
its website can be used to check.

**Partial fit, stated.** The creator-specific pattern — flattery about specific content, a free kit,
a shipping fee, "post and tag us", password sharing and a subscription hidden in the terms — is
sourced from BBB's July 2024 alert, Norton's Instagram-scam guidance and the FTC's October 2023
brand-ambassador warning rather than from ATT&CK.

### What must NOT be copied

No real brand, product, website, creator or payment handle. "PeakGear", `peakgear_collabs`,
`peakgear.training.example`, the Summit jacket, the clause numbers and `pgcreator.ship@trainingpay`
are invented.

### Client requirements preserved

Stage 2's "DM and brand-look-alike profile" is the message request and `peakgear_collabs`'s profile.
Stage 3's "handle spelling, account age, copied posts, private payment link and pressure" are the
handle beside the brand's name, About (eleven days; former names `fitness.giveaway.hub`,
`trekgear.deals`), the pinned post whose comments say it is the brand's March 2025 photo, the
bio link to a non-brand host, and "3 kits left… closes tonight". Stage 4's "fake creator-contract
page requesting address, card and social password" is the agreement → details (address, card,
expiry, CVV, Instagram username and masked password) → review. Stage 5's "contact the brand through
its separately found official site/account" is the brand website typed by the learner, its Creators
page and its account check. Stage 6's "decline; report the impersonating account and link; block it"
is the banner.

### Enhanced synthetic storyline

"PeakGear Collabs" tells the learner their Sahyadri trek reel was shortlisted from 2,000 creators
for a Trail Ambassador programme: a jacket and shoes worth INR 8,999, free — only INR 199 shipping,
and in return two stories and a reel tagging the account. The agreement is in the bio link. Its
summary is generous; its clauses are not: 4.2 has the ambassador share their Instagram username and
password with the "creator team", and 7.1 charges the shipping card INR 1,499 a month from day
thirty. The account is eleven days old and used to be a fitness-giveaway page; under its pinned
jacket photo someone points out it is the brand's own launch photo, and someone else paid shipping
three weeks ago and has no tracking number. PeakGear's own website — typed in, not followed — says
it only contacts creators from its verified account or its creators address, never charges fees or
asks for passwords, isn't running that programme this year, and that `@peakgear_collabs` is not
theirs.

### Conversation progression

1. Request card: eleven days old, 7,112 following.
2. `MESSAGE REQUEST` — praise for a specific reel, the shortlist, the client's sentence, the kit and
   "the link in our bio".
3. `branch` — "Only 3 kits left in your size".
4. After a consequence — "YES!" and "sign and pay so we can dispatch today"; a card charge and a
   new login; or a "customs and insurance" fee.

### Evidence the learner can discover (progressive)

- **The request**: unsolicited, specific flattery, "pay only shipping".
- **Profile / About**: eleven days old; unrelated former usernames; bio link to a non-brand host.
- **Pinned post comments**: the photo is the brand's own; a paid-shipping victim is still waiting.
- **The agreement's clauses**: password sharing (4.2) and a monthly charge (7.1).
- **Review page**: the charge today and from day 30, and the login shared.
- **The brand's website**: who contacts creators, what it never asks, "Not a PeakGear account".

### Learner interaction journey

`messages → requests → the request → profile → About / pinned comments → don't reply, or the bio
link → agreement terms → details → review → type the brand's site → Creators → check an account →
decline and report`

### Simulation surfaces

DM request thread (`dm`, `request`), profile (`SOCIAL`: profile / about / pinned post), agreement
(`BROWSER`: agreement / details / review / signed), UPI shipping (`PAYSHEET`), brand website
(`BROWSER`: home / creators / check), one directory row.

### Verification mechanism

`verify_known_app` (the brand's own website, reached by typing its address) or
`verify_trusted_directory` (the brand's care line and handles). "Ask them to prove they work for
PeakGear" is the 0-point route; reporting without checking is +1.

### Safe resolution

Open (`ITEM_OPEN` 0) → profile (`INSPECT_CONTEXT` +2) → close the agreement, or don't reply and
don't open the link (`SAFE_PIVOT` +3) → the brand's website (`TRUSTED_VERIFY` +3) → decline and
report (`RESOLVE_CORRECT` +2). Ten.

### Unsafe paths

| Control | Intent | Event | Points |
| --- | --- | --- | --- |
| Sign and pay INR 199 (address, card, Instagram login) | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Pay INR 199 shipping by UPI | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Reply "YES! I'm in 🙌" | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Reply "YES! 🙌" without opening it | `reply` (open) | `PREMATURE_REPLY` | −1 |
| Ask them to prove they work for PeakGear | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |
| Keep the request / sign before the kits run out (resolve) | `resolve_retain` / `resolve_continue` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Same shape as I01.

### Realism decisions

The terms are real clauses in the page, not a warning banner; the review page restates them as a
real checkout would. The brand's site is reached by typing its address, the independence the client
asks for, and it answers the specific question ("is this account ours?") the way brands' creator
pages do.

### Known limitations

The brand site's account check is authored. One decision per stage: a run records the signature or
the UPI payment, not both. The result card shows the placeholder sender line.

### Why the final simulation stays faithful

The handle and sentence are the client's; the agreement URL is the bank's browser asset and the
signature names it; the payment names the bank's payment asset; every typed value stays in the form
(asserted). The word "impersonating" is the client's stage text and is never shown on the device.

---

## 6. Forms, inputs and data handling

Three scenes carry real inputs — I08's application (full name, government ID number, date of birth,
Instagram username, masked password) and priority-fee PIN, I09's KYC (full name, PAN, Aadhaar,
mobile) and deposit PIN, and I10's agreement (name, delivery address, card number, expiry, CVV,
Instagram username and masked password) and shipping PIN. They reuse the infrastructure the WhatsApp
and I01–I05 forms use (`frontend/src/simulation/localForm.js`,
`components/simulation/surfaces/SceneForm.jsx`, `PaySheetSurface`). No field kind was added. The
nine guarantees hold exactly as before:

1. **Local.** Values live in `useLocalForm`'s `useState` inside the surface component; never lifted.
2. **Ephemeral.** Leaving a page unmounts it and React discards the values; a reload rebuilds from
   the committed stage with empty fields.
3. **Never transmitted.** No value reaches an affordance, the controller, `attemptApi` or metadata;
   the engine's `METADATA_ALLOWLIST` would reject it server-side even if something tried.
4. **Never persisted.** No `localStorage`, `sessionStorage`, cookie or backend record.
5. **Never logged or exported.** Nothing reaches `console`, the ledger, the export or the viewer.
6. **No autofill surface.** Every input is `type="text"`, `autoComplete="off"`, with a meaningless
   `name` (`f0`, `f1`…). Secret and masked fields are hidden with CSS.
7. **No form submission.** No `<form>`, no action, no method, no submit event; the commit control is
   an ordinary button carrying a scene affordance.
8. **Deterministic.** A field is satisfied at its declared `length`; `max` is how much it accepts.
9. **Not decorative — and never steering.** The learner really fills the page in, and no control is
   disabled because of what it would cost, only by incomplete input.

I06's comment replies and I07's reply are **authored** composer text: nothing is typed into a chat or
a comment, so no free text exists to leak. `SceneScenariosInstagramB.test.jsx` serialises everything
the device hands the controller and searches it for the exact strings typed into I08, I09 and I10.

## 7. What is asserted, and where

- `frontend/src/simulation/sceneModel.test.js` — the registry (25 WhatsApp + 10 Instagram, no id
  collision across all 35), legal intents per stage, declared assets/anchors/pages, no classification
  or narrator leak, offline hosts and numbers, the client sentence verbatim (I09's handle-less
  "Sponsored" form included) and no placeholder, and a new I06–I10 block: branch shapes distinct from
  every earlier scene and from each other, About pages, the extended verdict-word ban, each scene's
  own interaction (own-post comment box and Add location; inbox thread, reel player and chat search;
  ✔️-in-a-name against Request verification; sponsored reel, ad history and register; agreement
  clauses and the brand website), mixed resolve banners, and page links.
- `frontend/src/pages/SceneScenariosInstagramB.test.jsx` — I06–I10 through the real controller and
  the fake API: safe routes, unsafe routes, typed values never on the wire, allowlisted metadata,
  remount recovery, toast and directory naming, containment.
- `frontend/src/components/simulation/SceneContainment.test.jsx` — containment on every I06–I10 stage
  and surface (automatic from the registry).
- `backend/tests/sceneAffordance.test.js` — every I06–I10 control legal against the real definitions;
  safe paths sum to ten; 61 pinned event/point pairs; consequence inertness; identity pinned; safe and
  unsafe walks through the real engine into the real review, with no event code, point value or
  placeholder in any review.
- `frontend/src/simulation/sceneResearch.test.js` — this document: a section per scenario, a linked
  source for every technique, the no-mapping statement for I07.

## 8. Findings during verification

Found by playing the scenes in a real browser on the isolated stack, fixed, and (where testable)
pinned:

1. **Controls under a short social page were pushed off-screen.** `SocialSurface` gave every page
   `min-h-full`, so the "Add location" choices sat below an empty screen. A page that carries
   controls now sizes to its content; pages without controls (all of I01–I05) are unchanged.
2. **"1 likes"** under a comment. `IgComment` now writes "1 like".
3. **A flag emoji drew as the letters "IN"** on Windows in I06's account name; removed.
4. **A friend's reply was indented under the wrong comment** in I06 (reply indentation follows the
   previous comment); the branch-stage comments are no longer drawn as replies.
5. **Meta text on a page**: I10's agreement said "Terms (scroll)" (now "Terms and conditions"), and
   one row of the brand's account check lacked its `@`.
6. **Not a defect, recorded**: the Browser pane's screenshots occasionally lagged the DOM (a filled
   form drew empty); the DOM held the typed values, and every step was re-checked from the page.

### Tests

| Suite | Result |
| --- | --- |
| Full frontend `vitest run` | **1406 / 1406**, 28 files (1256 before this job); `oxlint` clean; `vite build` clean (existing chunk-size warning) |
| `frontend/src/pages/SceneScenariosInstagramB.test.jsx` (new) | **40 / 40** |
| `frontend/src/simulation/sceneModel.test.js` | **546 / 546** — all 35 scenes (468 before) |
| `SceneContainment` + `sceneResearch` | **230 / 230** (198 before) |
| `frontend/src/pages/SceneScenariosInstagram.test.jsx` (I01–I05, unchanged) | **33 / 33** |
| `backend/tests/sceneAffordance.test.js` | **65 / 65** (54 before) |
| Full backend `npm test` (no DB URI) | **520 pass, 0 fail**, 322 skipped (509 before) |
| DB-backed suites, sequential, isolated `cyber_awareness_004b_t_*` | **322 / 322**; `instructorControlsApi` failed at file level once on its first database and passed 28/28 on a fresh one, with nothing else touching mongod |

One pre-existing timing test (`AssessmentTimer.test.jsx`, a 20-minute bound) failed once while the
full suite ran in parallel with file edits, and passed 18/18 alone and in both later full runs; no
timer file was touched.

### Scoring and review, through the real engine over HTTP

`playScenario.js` (I06–I10 paths added), `REVIEW=1`, `PIN_INSTAGRAM=I06,…,I10`, on
`cyber_awareness_004b_verify`, API 5055: I06 safe **10** · location tag **0** · "DM me" + unchecked
report + answer by DM **0**; I07 safe **10** · mute + block + report **0** (`false_positive`) · downloader
site **3** (`unsafe_handling`); I08 safe **10** · premature reply + application **0** · priority fee **0**;
I09 safe **10** · install **0** · join the group + ask the advertiser **1**; I10 safe **10** · sign **0** ·
reply YES **4**. Every review used the scenario's own stage text; `review leaks none` on all fifteen.
Regression on the same stack: I01 safe **10** / login **0**, I03 safe **10** / false positive **0**, I05 safe
**10**, W01 **10**, W10 **10**, W15 **10**, W20 safe **10** / release **0**, W25 **10** — identical to earlier batches.

### Browser verification (isolated)

Isolated DB `cyber_awareness_004b_verify` (imported from `scenarios/v1`, content sha `8e7a6c98…`), API
**5055** with `MONGO_URI` in its own process, frontend **5199** (`--mode verify`); 5000/5173 not running.
The isolated Instagram pool was pinned for the run and restored (0 inactive); non-target runs were closed
through the HTTP API from the page.

| | Safe path (by hand) | Unsafe path (by hand) | Also checked |
| --- | --- | --- | --- |
| I06 | **10/10** — comment → View defence_fan_archive → pinned season map → Add location → Cancel → call the cell → release note → hide and report | **0/10** — skip → reply with range and dates (comment box) → ask in comments → leave the comment up | played at **640 px** (≈200 %): no horizontal overflow |
| I07 | **10/10** — chat → yesterday's thread → Watch the reel → Save → search chat "recipe" → save and reply | **0/10** — skip → mute → block → report as spam (`false_positive`) | played at **375 px** (mobile): no horizontal overflow |
| I08 | **10/10** — request → profile → leave the request → Settings › Request verification → report | **0/10** — skip → application: ID number, username, masked password typed → submit → ask for proof → keep until 6 PM | reload on the pushed final page returned to the thread at verify |
| I09 | **10/10** — reel frames stepped to 0:07 → About this ad → Join the group › → app page → Close the page → Investor Register → report and hide, with a rationale | **0/10** — "Join the group" from the notification → app → KYC with PAN, Aadhaar, mobile typed → submit → ask the advertiser → join before the seats go | reload at verify rebuilt the reel with Resume; toast titled "Sponsored" |
| I10 | **10/10** — request → profile → pinned post comments → bio link → agreement clauses → close → brand website → Creators → check an account → decline and report | **0/10** — reply from the list → bio link → name, address, card, expiry, CVV, Instagram login typed → sign and pay → report unchecked → sign before the kits run out | consequence banner after signing |

Result pages and reviews were opened for three of the four attempts: I09/I10 "Handled safely", I08 and
I06 "Threat missed" with their own correct actions, I07 "Genuine item rejected" with four cards ending
"This item was genuine. It needed to be kept…". The ledgers read back from the isolated DB matched the
engine; metadata keys were only `consequence, dwell_ms, intent, open_latency_ms, resolution_code,
transition, verify_source`; a search of **every document in every collection** for the fourteen typed
strings (names, ID number, username, password, card, CVV context, PAN, Aadhaar, mobile, address) found **0**
— the only learner text stored was the optional rationale, stored as designed. **Offline:** resource
timing and the request log showed only `http://localhost:5199` and `http://localhost:5055`; no `https://`
request was made. A WhatsApp scene (W20) and I03 were opened in the same session: unchanged.

**Production was not mutated.** `cyber_awareness_training` identical before and after: attempts 10,
candidates 9, runs 100, events 209, definitions 100 (none inactive), legacy scenarios 40, assessments 1,
progress snapshots 6. All eighteen bank and taxonomy files hash identically before and after.
