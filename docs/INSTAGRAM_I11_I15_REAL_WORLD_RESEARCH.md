# Instagram I11–I15 — real-world research and storyline reconstruction

**Task:** IMMERSIVE-004C — the third Instagram batch
**Naming:** the client's bank numbers every Instagram scenario `I01`–`I25` (specification pages
36–61); this batch is **I11–I15** in the data, the registry, the tests and this document, and it
corresponds to specification **pages 47–51**.
**Scope:** Instagram I11, I12, I13, I14, I15 only. WhatsApp W01–W25 and Instagram I01–I10 are
complete and unchanged in behaviour; Instagram I16–I25, Email and SMS are untouched.
**Status:** design record for the five Instagram scenes authored by this task.
**Companions:** [`INSTAGRAM_W01_W05_REAL_WORLD_RESEARCH.md`](INSTAGRAM_W01_W05_REAL_WORLD_RESEARCH.md)
(I01–I05), [`INSTAGRAM_I06_I10_REAL_WORLD_RESEARCH.md`](INSTAGRAM_I06_I10_REAL_WORLD_RESEARCH.md)
(I06–I10) and the five WhatsApp records, which use the same method.

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
surfaces — a welfare page's comment thread, a "case" opened by somebody who is themselves causing
the alarm, four months of a relationship compressed into one screen, an attachment picker with the
learner's own documents in it, and a friend's real account behaving very slightly unlike its owner.
What is deliberately **not** taken is infrastructure, tooling, real brands, real accounts, real
people, real units, real formations, real locations, real schedules, real procedures or anything
operational. Every military element is fictional. Every host is `*.training.example`; every phone
number is in the reserved `+91 00000 xxxxx` range; every profile, post, comment, highlight, story,
page, form, picker, payment sheet, wallet, register, prompt and settings screen is local, inert and
offline. No image file exists anywhere — avatars, grids, covers, thumbnails, identity cards and
documents are drawn from CSS.

### 0.2 Source of the threat intelligence

Primary source: **MITRE ATT&CK, Enterprise and PRE matrices, website version v19.2** (released
28 April 2026) — re-confirmed as the current version on the live versions page on 16 September 2026
(<https://attack.mitre.org/versions/>; v18.1 ran 28 October 2025 – 27 April 2026). Techniques read or
re-read from their own pages on 16 September 2026: T1585.001, T1586.001, T1589, T1591.001, T1593.001,
T1598, T1598.001, T1598.003, T1621, T1657, T1684.001, T1111, T1566.001.

Version note carried forward: `T1656 Impersonation` no longer exists as a top-level technique and
resolves to **T1684.001** (parent T1684 Social Engineering, created 14 April 2026). Older notes
citing T1656 should not be trusted.

Secondary sources, for the real-world pattern behind each scenario (all read 16 September 2026):

- **I11** — US Army, "Social Media Safety", on what does and does not belong in a public post or a
  public reply, and on aggregation (<https://www.army.mil/socialmedia/safety/>); Instagram Help
  Center on professional accounts and the Call/Email/Address action buttons a business or government
  profile carries (<https://help.instagram.com/>); UK NCSC, "Social media: how to use it safely", on
  keeping personal and organisational detail out of public threads
  (<https://www.ncsc.gov.uk/guidance/social-media-how-to-use-it-safely>); US FTC consumer advice on
  accounts that watch an organisation's public comments and answer as if they were its support desk
  (<https://consumer.ftc.gov/>).
- **I12** — Instagram's own recovery route, which starts with the account owner and not with an
  inbound message (<https://www.instagram.com/hacked/>), and the Help Center's description of
  two-factor backup codes as credentials in their own right (<https://help.instagram.com/>); CISA on
  why approval-style and code-relay factors fall to social pressure and what phishing-resistant MFA
  means (<https://www.cisa.gov/resources-tools/resources/implementing-phishing-resistant-mfa>); UK
  NCSC as above, on account-recovery impersonation; BBB scam guidance on paid and unpaid "account
  recovery" services that begin with a direct message (<https://www.bbb.org/scamtips>).
- **I13** — FBI, "Romance Scams", on the persona built over weeks and the first request arriving as
  an emergency fee (<https://www.fbi.gov/how-we-can-help-you/scams-and-safety/common-frauds-and-scams/romance-scams>);
  US Army Criminal Investigation Division's long-standing advisory that photographs of service
  personnel are taken and reused by people posing as deployed soldiers, and that no deployed soldier
  needs a member of the public to pay a fee to release leave, baggage or a parcel
  (<https://www.cid.army.mil/>); FTC, "What You Need to Know About Romance Scams"
  (<https://consumer.ftc.gov/articles/what-you-need-know-about-romance-scams>); FTC on gift cards as
  a payment method used because it cannot be reversed
  (<https://consumer.ftc.gov/articles/gift-card-scams>); FBI IC3 annual reporting, where confidence
  fraud remains among the highest-loss categories (<https://www.ic3.gov/AnnualReport/Reports>).
- **I14** — US Army "Social Media Safety" as above, on identity documents and posting information;
  BBB scam guidance on "you have been selected to be featured" approaches that collect documents
  rather than money (<https://www.bbb.org/scamtips>); FTC consumer advice on identity theft assembled
  from documents handed over voluntarily (<https://www.identitytheft.gov/>); NCSC as above, on what a
  publication legitimately needs from an individual.
- **I15** — Instagram's own guidance on accounts taken over and on the messages they then send
  (<https://www.instagram.com/hacked/>); CISA as above, on approval-style login prompts; NCSC as
  above, on links arriving from people you actually know; BBB scam guidance on the "is this you in
  this video?" message sent from a contact's own account (<https://www.bbb.org/scamtips>).

**Source-confidence note.** Where a secondary source is cited by its landing page rather than by a
dated article, that is deliberate: the landing page is the one a reviewer can re-open and re-check
without depending on an article surviving at a particular address. Nothing in this document rests on
a secondary source for a *behavioural* claim. The ATT&CK citations are the load-bearing ones, every
one is linked to its own technique page, and `sceneResearch.test.js` fails the build if a technique
is named here without its page.

### 0.3 Interpretation rule

ATT&CK is used as a **behavioural reference, not a checklist**. A mapping is recorded only where the
technique's own description describes what the scenario does. **I11 has no mapping, and that is
stated** — it is a welfare cell publishing a telephone extension, and there is no adversary to
catalogue. Four techniques were **considered and rejected**, each with its reason: T1111 (I12 and
I15), T1593.001 (I13), T1566.001 (I14) and T1684.001 (I15, where the account is the friend's own
rather than an imitation of it). Every mapping in this batch is a partial fit in at least one
respect, and each section says which.

### 0.4 What this document may and may not change

| Thing | May IMMERSIVE-004C change it? |
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
(`@unknownsender254`, `…586`, `…644`, `…792`, `…613`) with random follower counts that contradict
the client's own text. Handled exactly as in I01–I10: the scene uses the handle in the client's
sentence, carries the message verbatim, names the bank's sender **asset id** on every inspection so
the ledger records what was inspected against the pinned definition, and never prints the
placeholder. `sceneModel.test.js` asserts both halves for every Instagram scenario.

**I15's stored notification is truncated, and it is left that way.** The DATA-003 generator captured
the client's sentence with a non-greedy match that stops at the first apostrophe, so the bank holds
`"@knownfriend: Is this you in the video?? I can"` — the client's page 51 reads "I can't believe
it." Regenerating the synthetic bank was explicitly out of scope for this task (and would rewrite
every platform in it), so I15 does what W06, W09, W15, W20, W22 and W25 already do: the scene's beat
**begins with the bank's exact stored string** and completes the client's own sentence after it.
A fix to the generator will therefore surface here rather than quietly outliving the bug.

**`@knownfriend` is used verbatim as the account's handle.** It reads as a stand-in rather than as
somebody's username, and it is still the client's own text on page 51. The same rule that produced
every other Instagram account name in I01–I10 — the handle in the client's sentence *is* the
account — is applied without exception, and the account is given an ordinary display name
(`Rohit Kamath`) beside it, which is how Instagram shows a handle and a name that do not match. This
is recorded rather than quietly "improved", because inventing a prettier handle would put the scene
and the pinned bank out of step for a cosmetic reason.

**The narrator line is not printed.** Each `prior_context` sentence states the situation and
sometimes the verdict ("A support-like account claims…", "A profile claiming to be a deployed
officer quickly builds intimacy…", "A fan page says the learner is shortlisted…"). None is printed;
the scene presents the context through the thread, the post, the profile and the highlights. The
verdict-word assertion bans the platform-wide list plus `clone`, `impersonat*`, `genuine`, `legit`,
`look-alike`, `hoax`, `unknownsender`, `deepfake`, `lip-sync` and `stolen photo` on I11–I15.

**Answer-revealing asset prose is not displayed.** The I12 and I15 `browser_page` assets carry the
client's stage-4 sentence as their `body` ("…a reply composer and fake security-check page", "…a
fake Instagram login page before the 'video'"). The scenes use only those assets' `display_target`
and `host`; no control opens the generic inspection sheet on them, because that sheet would print
the body. `sceneModel.test.js` asserts that no `inspect_link` affordance names either asset.

**The result card placeholder** (known limitation carried from I01–I05) applies to all five: the
result and review cards show the bank's placeholder Instagram sender, because those cards are built
from the pinned definition rather than from the scene.

---

## 0.6 Differentiation from I01–I10 and WhatsApp W01–W25

The twenty-five WhatsApp rows are in the I01–I05 record (§0.7 there) and the first ten Instagram rows
are in the I06–I10 record (§0.6 there); neither is repeated. The five new scenes, measured the same
way:

| | Behavioural lesson | Social mechanism | Primary evidence | Interaction pattern | Verification pattern | Unsafe temptation |
| --- | --- | --- | --- | --- | --- | --- |
| **I11** | **On an item that is exactly what it says it is, the risk left standing is your own mouth in a public thread** | **Authority + care, plus a friend's nudge to "just put it in the comments"** | The account's own pinned rule and its replies to other people's case numbers; a professional profile whose Call button carries the extension; **the learner's own Saved collection, holding the August notice with the OLD extension** | **A carousel notice, Save, and Saved › Unit notices as the comparison panel** | The approved directory, and the unit's own welfare application | A public comment carrying file number, service number and unit; the same sent as a message request; muting the cell |
| **I12** | **A code is a credential; the "rescue" is the attack, and it is happening because of the message** | Fear inverted into gratitude — they say they have already saved you | Six days old, two former names, followers created this month, the same sentence under three strangers' posts; **Login activity showing one reset request at the minute the DM arrived**; Support requests showing no case | **Six digits typed into the message box while the code is on the learner's own screen**; a security-check page as the second route | **Settings › Password and security** — Security Checkup, Where you're logged in, Login activity, Support requests | Send the code; username + password + backup code on the page |
| **I13** | **Four months of warmth is not identity, and a picture can be checked when a story cannot** | Trust + empathy, and a debt of guilt ("I have never asked you for anything") | A "good morning" at 03:12; a leave date that moves; no video call ever possible; no mutuals; two former usernames; **the same photograph indexed under three other names** | **A months-long thread with day separators; a release portal with gift-card and wallet routes; an ID sent from the chat** | **A local, offline Image Match index** (the client's own stage-5 allowance) and the welfare/legal cell | Gift-card numbers and PINs; a wallet transfer; a photograph of the learner's identity card |
| **I14** | **Pride is a collection method; a feature has no use for your documents** | Pride + authority + a 2100 hrs deadline | The DM says 3.3 lakh followers, the profile says 3,383; two former usernames; **the page's own story HIGHLIGHTS, where last month's "featured" personnel are on screen with their service cards**; a commenter still asking for theirs back | **The device's own attachment picker**: the learner's identity card, posting order and a trek photo, side by side, with Send under them | The administrative office on the directory number, and the unit's media desk standing instruction | Send the two files; type the service number instead; open the page's feature form |
| **I15** | **Every document check can come back clean, because the account really is your friend's** | Curiosity + embarrassment ("is this you?") | Joined 2015, no former usernames, 412 mutuals — all clean; yesterday's long message against today's two clipped ones; a host that is not the platform's; **another thread in the inbox asking whether he has messaged them** | **A login gate (password, then the code) and, needing nothing typed at all, the platform's own "is this you trying to log in?" prompt** | Ringing the friend on the number already saved for him, and the learner's own Login activity | Confirm and play; **approve the login request**; reply to the account |

### Nearest existing scene, and what is genuinely new

| | Nearest | What that already taught | Why this is not the same scenario |
| --- | --- | --- | --- |
| I11 | I03 (verified unit post), I07 (ordinary item), W16/W21 (genuine official change) | Genuine items exist; verify, then use normally | I03's danger was a **stranger in the comments** pulling the learner to a form; I11 has no stranger and no form. The only two unsafe acts are things the learner **says** — a public comment and a message request — and one of them is being encouraged by a friend. The correct action is Instagram's **Save**, and the client's "local directory comparison panel" is realised as the learner's own **Saved collection**, which already holds the same notice with the previous extension on it. No earlier scene compares the new fact against the learner's own stored copy of the old one. |
| I12 | I02 (copyright appeal + Settings), W01 (login code), W25 (linking code) | Platform matters are settled in the app; never pass a code on | I02 was a **threat** (deletion in 30 minutes) resolved by showing that nothing was wrong. I12 says it has **already rescued** the learner, and something really is happening: a reset has been triggered, so the six-digit code genuinely arrives on the phone while the learner is deciding. The release is therefore **the composer**, not a form, and the verification is a different part of Settings — Login activity and Support requests rather than Account Status. W01 and W25 are WhatsApp and have no security-settings surface at all. |
| I13 | W22 (long online friendship), I04 (a friend in distress, today), I05 (elicitation) | Relationships are cultivated; urgency ends in a payment | W22's payoff was a **trading deposit** and its check was a **regulator's register**; I04 was **one day old** and settled by ringing the real friend. I13 is the first scene whose evidence is the **photograph itself**, checked in a local, offline image index the client's own stage 5 authorises; the first with a **months-long thread** the learner scrolls; and the first where the payment surface offers **gift cards and a wallet** rather than UPI or a card. |
| I14 | W06 (unit clerk wants an ID photo), I06 (pride, own post), I08 (status for sale) | Documents and operational detail do not go to strangers | W06 was a photograph **described** in a chat; I06 was a **public comment box**. I14 is the first scene where the decision is made in the **device's own attachment picker**, with the learner's identity card and posting order sitting in a list beside an ordinary holiday photograph and a Send control under them. Its decisive evidence is a surface no earlier scene has used — **story highlights**, where the page has already published other people's documents. Nothing is sold and nothing is paid for. |
| I15 | I04 (a copied friend), I01/I02 (credential pages), W25 (a known contact's code) | Accounts that look like your friend's are not your friend's | I04 was a **copy** and the tell was the extra character in the handle. I15's account **is** his: eleven years old, no former usernames, 412 mutual followers — every documentary check the learner has been taught comes back clean, which is the lesson. The tells are behavioural, and the second release is one no earlier Instagram scene has offered: the platform's **own login-request prompt**, which hands the account over with a single tap and nothing typed. |

**Concepts rejected before writing** (the brief's list): for I11, "a stranger comments a registration
link under the official post" (I03 again) — replaced by the learner's own over-disclosure and the
Saved-collection comparison; for I12, "a support DM sends you to a login page" (I02 again) — replaced
by a code that genuinely arrives, relayed in the composer, with the page demoted to the second route;
for I13, "a cloned friend asks for money today" (I04 again) and "a long friendship ends in a deposit"
(W22 again) — replaced by a four-month thread and a reverse-image check; for I14, "a page offers a
paid feature" (I08 again) — replaced by a free feature that collects documents, decided in the
attachment picker; for I15, "a look-alike account sends a video link" (I04 again) — replaced by the
friend's own compromised account and the approve-this-login prompt. Not one of I11–I15 is "report
this profile" as its only lesson: I11's correct resolution is to keep the notice and use the new
extension.

`sceneModel.test.js` asserts that no I11–I15 branch-stage shape equals any W01–W25 or I01–I10 shape,
and that the five are distinct from one another.

### The Instagram-native surfaces this batch adds (all reusable)

| Addition | Where | Used by |
| --- | --- | --- |
| Professional-account **action buttons** on a profile (Call / Email / Address), each carrying the contact detail the learner is comparing, and optionally opening a page | `SocialSurface.jsx` `ProfilePage` | I11 |
| **Story highlights** row under the bio, with covers that open a `story` page | `SocialSurface.jsx` `ProfilePage` | I14 |
| A **cover thumbnail** on a `list` row, which is what turns the plain row list into a Saved collection | `SocialSurface.jsx` `ListPage` | I11 |
| A **link preview thumbnail** with a play badge on a DM link card | `IgBlocks.jsx` `IgBeat` | I15 |

Reused unchanged: `SOCIAL` views `profile`, `about`, `people`, `post`, `story`, `status`, `settings`,
`list`; `BROWSER` (security check, release portal, feature form, login gate); `PAYSHEET` (wallet
transfer); `VIEWER` (the attachment picker); `INSTALLER` page style `sheet` (the login-request
prompt); `APP` (the unit welfare application, the unit media desk, Image Match); `CALL` (ringing the
friend); the trusted-directory overlay; every beat kind in `scenes/instagram/shared.js`.

---

## 1. I11 — Official Welfare Helpline Update

### Client scenario (authoritative)

Specification page 47. Instagram, **Medium**, **Legitimate**, family *Legitimate official-account
update*, trigger *Authority + care | FICTIONAL MILITARY CONTEXT*. Canonical identity computed by the
import service: family `legit_routine_broadcast`, triggers `authority` + `empathy`, military flag
**true**, level `medium`.

- **Stage 1 (Event).** "@forces_welfare_official: Helpline extension updated. Use the contact in the
  approved directory."
- **Stage 2 (Open).** "Open the official post and profile." Context: a verified fictional welfare
  account posts a helpline change **already listed in the approved directory**.
- **Stage 3 (Inspect).** Exact handle, verified status, consistent history and directory match.
  Decision signal: *"The post directs users to an independently maintained directory and requests no
  private response."*
- **Stage 4 (Branch).** "The interaction advances to the post details and **local directory
  comparison panel**." Expected: *use the normal in-app path only after the details match the known
  context; do not switch to an untrusted channel.*
- **Stage 5 (Verify).** "Compare the account and extension with the Trusted Directory. If it matches,
  continue; do not report or block a legitimate sender."
- **Stage 6 (Resolve).** "Save the verified update; do not report/block; **do not post personal case
  details**."
- **End state.** "Directory match is confirmed and the post remains saved."
- **Feedback.** "Official updates should be cross-checked with an approved directory. Keep personal
  cases out of public comments."

### MITRE ATT&CK alignment

**There is none, and none has been invented.** ATT&CK catalogues adversary behaviour. In I11 there is
no adversary: a welfare cell publishes a change to a telephone extension, the change is real, and the
account is the one the directory names. Mapping a technique here would have meant mapping the
*learner's* own mistake, which ATT&CK does not model and which would misrepresent the matrix.

**Closest defensible behavioural reference** — deliberately not an ATT&CK technique:

- US Army, "Social Media Safety", on what does not belong in a public post or public reply, and on
  the way small disclosures aggregate (<https://www.army.mil/socialmedia/safety/>).
- UK NCSC, "Social media: how to use it safely", on keeping personal and organisational detail out of
  public threads (<https://www.ncsc.gov.uk/guidance/social-media-how-to-use-it-safely>).
- US FTC consumer advice on accounts that watch an organisation's public comments and reply as if
  they were its support desk (<https://consumer.ftc.gov/>) — which is why the scene shows a stranger
  answering the learner's public comment, but only as the *consequence* of having made one.

The defensive reference frame is therefore OPSEC and disclosure discipline, not adversary emulation,
and this is stated rather than quietly omitted.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The activity row's second line and the post's caption, which begins with it |
| Verified official account | `conversation.verified: true`; About says "Verified: Yes", joined March 2019, no former usernames |
| "Already listed in the approved directory" | `directoryExtras` carries the account and its extension; the trusted-directory overlay is the stage-5 route |
| "Requests no private response" | The account's pinned comment and its two replies in the thread say so in its own voice |
| "Local directory comparison panel" | **Saved › Unit notices**, which already holds the August notice with extension 4412, above today's 4477 |
| "Use the normal in-app path" | `safe_pivot` twice: Save the notice, and file it in the collection |
| "Do not switch to an untrusted channel" | The two `-4` routes: a public comment and a message request, both carrying a case |
| "Do not report or block a legitimate sender" | `report` and `block` are offered at verify and score `-4` |
| "Do not post personal case details" | The public comment is the client's own named failure, and the consequence banner shows what follows |
| Military content fictional | Unit Falcon welfare cell; no real formation, place, schedule or procedure |

### Enhanced synthetic storyline

A welfare cell the learner has followed since 2016 posts a three-slide carousel: **HELPLINE UPDATE**,
then **Extension 4412 → 4477** with "the number itself has not changed", then "take the contact from
the approved directory — not from a comment, not from a message". Pinned to the post, in the cell's
own voice: *please do not put case numbers, service numbers or family details in the comments.*

Underneath, the thread is doing what such threads do. Somebody asks whether the old extension still
works; the cell answers. Somebody else has begun typing an arrears file number into a public comment
and the cell has told them, politely, to ring instead. When the learner reaches the branch, a friend
adds the nudge that makes the wrong thing feel normal: *"weren't you chasing the same thing? put your
file no here, they answer fast."*

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | Dashboard toast and the Instagram tile, from the client's sentence |
| Open | Notifications, with the notice at the top and two ordinary items under it |
| Inspect | The carousel, the caption, the pinned rule, four comments including the cell answering somebody's file number |
| Branch | A friend's comment appears, telling the learner to post their case in public |
| Verify | The consequence of whichever route was taken — a public comment answered by a stranger, or a message request answered with "3–5 working days" |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. The account is verified, is followed, and has posted 214 times since **March 2019** (About).
2. It has **no former usernames** — the About page says so explicitly rather than leaving a gap.
3. Its professional-account **Call button carries the extension itself**: `+91 00000 71436 ext 4477`,
   and its Contact page shows the previous extension and the date it closes.
4. Its **pinned post** states the rule the whole scenario turns on: changes are published here *and*
   in the approved directory, and if the two disagree the directory wins.
5. The thread already contains a worked example of the failure — and the cell's own correction.
6. **Saved › Unit notices** holds the same notice from 12 August with extension **4412** on it, so the
   comparison the client asks for is made against the learner's own stored copy.
7. The unit welfare application, opened independently, carries the same number and extension.

### Learner interaction journey

Notify → open the notice → open the account and walk its Contact, About and pinned pages → open
Saved › Unit notices and read the August entry → **Save**, and file it above the August one → compare
with the trusted directory or the welfare application → keep it, and use 4477 next time.

### Simulation surfaces

- `profile` (`SOCIAL`): `profile` (with **action buttons** and a professional category), `contact`
  (`settings`), `about`, `pinned` (`post`).
- `saved` (`SOCIAL`): `collection` (`list` with **cover thumbnails**) — the comparison panel.
- `welfare` (`APP`): the unit welfare application, with the helpline, the cell's contact details and
  the standing rule about where a case is raised.
- The trusted-directory overlay, carrying the scenario's own directory asset plus the scene's row for
  the account.

### Verification mechanism

The client names one route and the scene offers two, both `TRUSTED_VERIFY +3`: the **approved
directory** (`verify_trusted_directory`, naming the scenario's `I11-dir-01` asset) and the **unit
welfare application** (`verify_known_app`). Asking the account to confirm the extension in a comment
is `verify_in_message_contact` and scores `0` — the item's own channel vouching for itself.
`report` and `block` are present and score `-4`, because a false positive has to be reachable for the
review to be able to name it.

### Safe resolution

Keep the saved notice (`resolve_retain`) or use the new extension next time (`resolve_continue`),
both `+2`. The full safe path is `open_item → read → inspect_profile → safe_pivot →
verify_trusted_directory → resolve_retain` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Comment with file number, service number and unit | `submit_data` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Message the cell the case, service number and a family member's hospital details | `reply` | `UNSAFE_EXTERNAL_ACTION` | −4 |
| Mute the account | `reject_ignore` | `NEEDLESS_REJECT_IGNORE` | −2 |
| Report or block the cell | `report` / `block` | `FALSE_REPORT_BLOCK` | −4 |
| Comment from the notification before opening | `reply` at open | `PREMATURE_REPLY` | −1 |
| Report, block or unfollow at the end | `resolve_report` / `resolve_block` / `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 on this scenario declares `CORRECT_USE +3`, `NEEDLESS_REJECT_IGNORE −2` and
`UNSAFE_EXTERNAL_ACTION −4` (critical) — the legitimate-item table — so `safe_pivot` resolves to
`CORRECT_USE` here and to `SAFE_PIVOT` on I12–I15. The scene chooses none of that: the pinned
definition does.

### Realism decisions

- The extension changes and the number does not. That is what such a notice usually says, and it is
  what makes "compare it with the directory" a real comparison rather than a formality.
- The cell replies to two comments in its own thread, because an account that only broadcasts reads
  as a prop.
- The professional action buttons print the extension under the label. A "Call" button that hid the
  number behind a dialler this simulation does not have would have hidden the evidence.
- The friend's nudge arrives at the branch, not before: the pressure to over-share should land when
  the learner is deciding, not while they are reading.

### Known limitations

- Saving is recorded as a decision, not as a state: the collection does not visibly gain the notice
  afterwards, because one decision per stage is the engine's rule and a second write would be a
  second event.
- The welfare application, the directory overlay and the collection are authored, not live.
- The result and review cards show the bank's placeholder Instagram sender.

### Why the final simulation stays faithful

Every client element is present and none is contradicted: the verified account, the directory match,
the comparison panel, the in-app path, the refusal to report a legitimate sender, and the client's
own named failure — personal case details in public comments. What the scene adds is the surface on
which those things happen.

---

## 2. I12 — Account Recovery Backup Code

### Client scenario (authoritative)

Specification page 48. Instagram, **Medium**, **Malicious**, family *Account-recovery phishing*,
trigger *Fear + authority*. Canonical identity: family `account_takeover_authorisation_abuse`,
triggers `fear` + `authority`, military flag **false**, level `medium`.

- **Stage 1 (Event).** "@meta_recovery_case: We stopped a hacker. Send one backup code to secure your
  account."
- **Stage 2 (Open).** "Open the DM request and recovery profile." Context: a support-like account
  claims to have recovered the learner's profile and asks for a backup code to finish.
- **Stage 3 (Inspect).** "Unofficial handle, request for a secret, no in-app case and suspicious
  link." Decision signal: *"Backup codes grant account access; legitimate support does not ask for
  them in DMs."*
- **Stage 4 (Branch).** "A reply composer and fake security-check page." Expected: *do not send a
  backup code, password or recovery link.*
- **Stage 5 (Verify).** "Open Security Checkup / Password and security directly from Settings."
- **Stage 6 (Resolve).** "Send nothing; report/block; review sessions and enable strong MFA."
- **End state.** "No code is revealed and the account-security mock shows controlled sessions."
- **Feedback.** "Recovery codes are secrets. Start recovery yourself through the platform, never
  through an inbound DM."

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1598.001** Phishing for Information: Spearphishing Service | <https://attack.mitre.org/techniques/T1598/001/> | Strong. The request for a credential is made over a social-media messaging service, which is exactly the sub-technique's scope. |
| **T1585.001** Establish Accounts: Social Media Accounts | <https://attack.mitre.org/techniques/T1585/001/> | Strong. Six days old, two former usernames, followers created this month, the same sentence left under three strangers' posts. |
| **T1684.001** Social Engineering: Impersonation | <https://attack.mitre.org/techniques/T1684/001/> | Strong. The account presents itself as the platform's own recovery desk. |
| **T1621** Multi-Factor Authentication Request Generation | <https://attack.mitre.org/techniques/T1621/> | **Partial fit, stated.** The code reaches the learner because the adversary started a reset — the technique's mechanism. ATT&CK frames T1621 around repeated prompts and fatigue; here a single request is generated and the second factor is relayed by the victim rather than approved. |

**Why this maps.** The behaviour being modelled is: create a service-side identity, establish contact
through the platform's own messaging, generate a real authentication event so the victim sees
corroborating evidence, and ask them to pass on the factor. Each of the four techniques above
describes one of those steps in its own words, and none of them is being stretched to cover the
whole.

**Considered and rejected.** **T1111 Multi-Factor Authentication Interception**
(<https://attack.mitre.org/techniques/T1111/>) describes intercepting the factor — smartcards, token
generators, capture of one-time values in transit. Nothing is intercepted here: the learner reads the
code on their own phone and types it into a message box. Recording T1111 would misdescribe a social
relay as a technical interception, so it is named only to say why it does not apply.

**What must NOT be copied.** No real Meta, Instagram or Facebook support workflow, case-reference
format, email template or URL; no real recovery endpoint; no real or realistic backup-code algorithm;
no working code delivery of any kind. The "SMS" is a beat of text in the thread, the page is four
inert local screens, and the eight-digit backup-code field accepts any eight digits and is never read
by anything.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The request row's preview, and the fourth beat of the thread |
| "Support-like account", "unofficial handle" | `@meta_recovery_case`, display name "Meta Account Recovery", not verified |
| "Claims to have recovered the profile" | "A login from another country was blocked 4 minutes ago. We have frozen that session for you" |
| "Asks for a backup code to finish" | The literal ask, and the composer control that sends it |
| "No in-app case" | Settings › **Support requests**: 0 open, 0 about this account |
| "Suspicious link" | The security-check page, whose address is the bank's `display_target` |
| "A reply composer and fake security-check page" | Both, as the two branch releases |
| "Security Checkup / Password and security directly from Settings" | The `verify_known_app` route, opening the learner's own security screens |
| "Review sessions" | **Where you're logged in** — two devices, both the learner's |
| "Enable strong MFA" | Security Checkup shows two-factor on an authentication app, and what a backup code is |
| End state: "controlled sessions" | The sessions page, reachable at verify and again after resolve |

### Enhanced synthetic storyline

The request opens with the learner's own name and a case reference, then the rescue: a login was
blocked four minutes ago, the session is frozen, the freeze lifts automatically in ten minutes. The
recovery email is quoted back with most of it starred out — enough to feel like a record, not enough
to be one. Then the ask: one unused backup code, from the learner's own Settings.

At the branch, the thread turns. A six-digit code genuinely arrives — *"SMS · Instagram: 419 302 is
your Instagram code. Don't share it with anyone."* — and the account writes: *"The confirmation code
has just gone to your phone. Send it here and case IG-44902 closes."* The corroboration is real. It
is real because they caused it.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast, from the client's sentence |
| Open | Messages, with the item under **Requests** and two ordinary chats below |
| Inspect | The request card, the case, the client's sentence, the blocked login, the starred email, the ask |
| Branch | The inbound code arrives as a system beat; the account asks for it by name |
| Verify | The consequence: the password and the email changed minutes apart, or the account holding the freeze "a little longer" |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. Joined **six days ago**; former usernames `@ig.helpdesk.team` and `@recovery.support.24x7` (About).
2. Not verified, and not followed by anyone the learner follows.
3. Its **followers** are accounts created this month.
4. **Where this account comments**: the same sentence — *"DM us, we can recover it in 10 minutes"* —
   under three strangers' posts in two days.
5. **Login activity** (the learner's own): a **password reset was requested today at 16:26 from a
   device that is not signed in**, three minutes before the message request arrived — and no login
   from outside the learner's city has been made or blocked at all.
6. **Support requests**: zero open, zero about this account, and the line that Instagram reaches you
   inside the app.
7. **Security Checkup**: two-factor is on, and a backup code is described for what it is.

### Learner interaction journey

Notify → open the request → open the profile, About, followers and where it comments → optionally
open the security-check page and walk its three steps → **close it, or send nothing** → open Settings
› Password and security and read Login activity → report and delete.

### Simulation surfaces

- `profile` (`SOCIAL`): `profile`, `about`, `followers` (`people`), `comments` (`people`).
- `check` (`BROWSER`): `gate` → `confirm` (username, password, backup code) → `review` → `done`.
- `security` (`SOCIAL`): `home` (`settings`) → `checkup`, `sessions`, `activity` (all `status`) and
  `requests` (`settings`).
- The trusted-directory overlay.

### Verification mechanism

`verify_known_app` opens the learner's **own** Password and security screens — the client's named
route. `verify_trusted_directory` reaches the unit support desk. Asking the account for proof is
`verify_in_message_contact` and scores `0`. `report` / `block` without checking score `+1`, as the
client's table requires on a malicious item.

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. The full safe path is `open_item → read → inspect_profile
→ safe_pivot → verify_known_app → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Send the six-digit code in the composer | `share_secret` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Username, password and backup code on the page | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Ask what exactly was blocked | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Reply from the notification | `reply` at open | `PREMATURE_REPLY` | −1 |
| Ask the account for proof | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |
| Keep it, finish the case, or swipe it away | `resolve_retain` / `resolve_continue` / `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3` and
`SECRET_PAYMENT_INSTALL_DATA_RELEASE −8` (critical). `share_secret` and `submit_data` both resolve to
the release code; `reply` to the engagement code.

### Realism decisions

- The code arrives, and it arrives at the branch and not before. A scenario that asks "would you pass
  on a code?" without ever showing one is asking a quiz question.
- The recovery email is starred, not shown. The pattern works because it looks like a record.
- The freeze has a countdown on the page and a deadline in the thread, because that is where the
  pressure lives.
- The security-check page asks for the password **and** the code on separate blocks of the same step,
  which is how these pages are built — one visit, everything.

### Known limitations

- One decision per stage: a learner who sends the code cannot then also submit the page.
- The "SMS" is a beat in the thread rather than a system notification, because the device shell draws
  one notification tray and it belongs to the scenario router.
- Login activity, Support requests and Security Checkup are authored screens, not live account state.
- The result and review cards show the bank's placeholder Instagram sender.

### Why the final simulation stays faithful

Every client element is present: the support-like account, the request for a secret, the absent
in-app case, the linked page, the reply composer, Settings as the verification route, sessions
reviewed, and nothing sent. The scene's addition is that the corroboration the learner is being asked
to trust is manufactured in front of them.

---

## 3. I13 — Deployed Officer Romance Profile

### Client scenario (authoritative)

Specification page 49. Instagram, **Medium**, **Malicious**, family *Romance scam / identity
fabrication*, trigger *Trust + empathy | FICTIONAL MILITARY CONTEXT*. Canonical identity: family
`relationship_grooming_fraud`, triggers `trust` + `empathy`, military flag **true**, level `medium`.

- **Stage 1 (Event).** "@captain_aarav_global: My baggage is held. Please pay the release fee; I will
  repay you tomorrow."
- **Stage 2 (Open).** "Open the multi-day DM and profile." Context: a profile claiming to be a
  deployed officer quickly builds intimacy and then requests emergency customs money.
- **Stage 3 (Inspect).** "Stolen-looking photos, inconsistent locations, rapid intimacy and money
  request." Decision signal: *"Military status is being used as credibility; the relationship cannot
  validate identity or financial need."*
- **Stage 4 (Branch).** "A customs-payment mock with **crypto/gift-card choices**." Expected: *do not
  send money, gift cards, identity documents or intimate media.*
- **Stage 5 (Verify).** "Verify identity independently; **reverse-image/search tools may be
  represented locally for training**."
- **Stage 6 (Resolve).** "Do not pay; preserve evidence; report/block the account." Plus the
  250-character rationale box.
- **End state.** "Fake customs case fails verification and the payment path closes."
- **Feedback.** "Uniform photos and emotional stories are not identity proof. Never finance an
  online-only relationship under pressure."

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1585.001** Establish Accounts: Social Media Accounts | <https://attack.mitre.org/techniques/T1585/001/> | Strong. A persona built over four months: 147 posts, two former usernames, a follower base with no overlap with the target's. |
| **T1684.001** Social Engineering: Impersonation | <https://attack.mitre.org/techniques/T1684/001/> | Strong. The persona claims a service identity it does not hold, and uses it as the reason for every constraint ("only text on the satellite link"). |
| **T1657** Financial Theft | <https://attack.mitre.org/techniques/T1657/> | Strong. The technique's own description names romance scams among the social-engineering routes to monetary theft, and the escalation after payment is the documented pattern. |
| **T1598** Phishing for Information | <https://attack.mitre.org/techniques/T1598/> | **Partial fit, stated.** The identity-card request is information-gathering by social engineering, but ATT&CK frames T1598 around targeting an organisation's information for later intrusion; here it is the individual's own document, collected for reuse. |

**Why this maps.** The behaviour is persona construction, sustained rapport, a claimed identity that
explains away every verification the victim might attempt, and then a one-way transfer of value. The
first three techniques describe those steps as written. The fourth is included because a document is
asked for as well as money, and is marked partial rather than presented as exact.

**Considered and rejected.** **T1593.001 Search Open Websites/Domains: Social Media**
(<https://attack.mitre.org/techniques/T1593/001/>) describes an *adversary* searching social media
for information about a target. The only searching in this scene is the **learner's** — the local
image index — and cataloguing defensive research as an adversary technique would be backwards.

**What must NOT be copied.** No real armed force, formation, rank structure, mission, deployment,
location, posting cycle or leave procedure; no real peacekeeping or coalition body; no real courier,
customs authority, carrier or consignment system; no real wallet address, gift-card brand, card
series or redemption mechanism; no real photograph of any person. The uniform in the profile is a
drawn field with a glyph; the wallet address is a string that belongs to no chain; the gift-card
fields accept any sixteen digits and are read by nothing.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The first beat of TODAY |
| "Multi-day DM" | Four dated blocks — 12 June, 3 August, yesterday, today — in one scrollable thread |
| "Quickly builds intimacy" | June acceptance to "I am coming to meet your family" by August |
| "Inconsistent locations" | "Good morning" sent at 03:12; a satellite link that allows only text |
| "Stolen-looking photos" | Never said. Shown: the local index finds the same photograph under three other names, and a commenter has already asked about it |
| "Rapid intimacy and money request" | The thread's shape, and the release fee arriving as the first ask in four months |
| "Customs-payment mock with crypto/gift-card choices" | The release portal's **methods** page: gift cards, or a wallet transfer |
| "Do not send money, gift cards, identity documents" | Three separate `-8` routes, one for each |
| "Reverse-image/search tools may be represented locally" | **Image Match** — an offline `APP` surface that searches a local index |
| "Preserve evidence" | The safe resolution is worded as keeping the conversation and reporting |
| Rationale box | The client's stage 6 asks for it; the simulation page provides it from the pinned definition |
| Military content fictional | A "multinational logistics detachment"; no real force, unit, place or procedure |

### Enhanced synthetic storyline

June: an accepted follow, warmth about the learner's ridge photographs, and a posting that cannot be
named. August: a message at 03:12 that does not fit the place he says he is, leave approved for
October, and a video call that the satellite link will never allow. Yesterday: a parcel sent ahead
through "a courier the detachment uses" — his mother's chain, his papers and his savings in cash,
sent by a route he admits it should not have gone by. Today: the consignment is held, and the release
fee is INR 21,500.

The portal will not take a card and will not take a bank transfer. It takes gift cards, read from a
photograph of the back of the card, or a wallet transfer on a network that cannot reverse one. If the
fee is paid, storage and insurance of INR 34,000 fall due before the consignment can move.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast, from the client's sentence |
| Open | Messages — the **main inbox**, not Requests, because the learner accepted him in June |
| Inspect | Four months of thread with day separators, the link card, and the amount |
| Branch | "If it is not cleared tonight the consignment goes to auction. I have never asked you for anything." |
| Verify | The consequence: a second document asked for, a second fee, or a screenshot demanded by 20:00 |
| Resolve | The outcome card, the rationale box and the review |

### Evidence the learner can discover (progressive)

1. Joined **May 2026**; former usernames `@capt.aarav.intl` and `@aarav_peacekeeper_2026` (About).
2. **Tagged in: no photos** — four months of posting and nobody has ever tagged him.
3. All 147 posts were added between May and September 2026.
4. Of 2,847 followers, **none** follow the learner and none are followed by anyone they follow.
5. Under his pinned post, a commenter: *"i have seen this exact photo on another page with a
   different name, is that you?"*
6. In the thread itself: 03:12, the satellite link, the moving leave date, the parcel sent by a route
   he says was wrong.
7. **Image Match** (independent): the same photograph is indexed under a stock listing from 2024, an
   account removed in January 2026, and an account still active under a different name and rank — and
   the tool says plainly what it cannot tell you.

### Learner interaction journey

Notify → open the conversation → scroll back to June → open the profile, About, followers and pinned
post → open the release portal and read the methods page → **close it, or say no and stop** → run the
photograph through Image Match → keep the conversation, report and block, with a one-line reason.

### Simulation surfaces

- `profile` (`SOCIAL`): `profile`, `about`, `followers` (`people`), `pinned` (`post`).
- `release` (`BROWSER`): `case` → `methods` → `giftcard` → `confirm` → `done`.
- `wallet` (`PAYSHEET`): the transfer, with a PIN and a note that the network cannot reverse one.
- `imagematch` (`APP`): the local index, its three matches, and its own limits.
- The trusted-directory overlay, plus the welfare and legal cell as a scene row.

### Verification mechanism

`verify_known_app` opens **Image Match** — the client's own stage-5 allowance, built as a local,
offline index that answers only about the photograph and says in as many words that it cannot tell
anyone who a person is. `verify_trusted_directory` reaches the welfare and legal cell. Asking him for
a service number and a video call is `verify_in_message_contact` and scores `0`, which is the point:
the relationship cannot validate the relationship.

### Safe resolution

`resolve_report` (keep the conversation as evidence and report) or `resolve_block`, `+2`. The full
safe path is `open_item → read → inspect_profile → safe_pivot → verify_known_app → resolve_report`
= **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Apply two gift cards to the case | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Send INR 21,500 from the wallet | `attempt_payment` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Send a photograph of the identity card | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| "I will arrange it tonight" | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Reply from the list | `reply` at open | `PREMATURE_REPLY` | −1 |
| Carry on, wait for October, or delete and tell nobody | `resolve_continue` / `resolve_retain` / `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`,
`SECRET_PAYMENT_INSTALL_DATA_RELEASE −8` (critical). The gift card, the wallet and the identity card
all resolve to the release code, because the client's table prices them identically and the scene
does not get a vote.

### Realism decisions

- Nothing intimate is written or asked for. The client's list includes intimate media; the scene
  expresses that boundary through the identity-document route instead, which teaches the same refusal
  without putting that content into a training product.
- The portal refuses cards and bank transfers before it offers gift cards. The refusal is the tell,
  and it is the portal's own words.
- Paying produces a second, larger demand rather than a receipt.
- Image Match reports matches and then states its limits, so the scene does not teach that a picture
  search is an identity check.

### Known limitations

- One decision per stage: the gift cards, the wallet, the identity card and the reply are
  alternatives, not a sequence.
- Image Match is an authored local index; no image is processed, hashed or searched, because no image
  exists.
- The thread is four dated blocks rather than four months of scrollback.
- The result and review cards show the bank's placeholder Instagram sender.

### Why the final simulation stays faithful

The client's persona, escalation, payment choices, verification allowance and resolution are all
present and unaltered. The scene's contribution is that the evidence is discoverable in three
different places — the thread's own timings, the account's history, and the photograph — and that
none of them requires believing or disbelieving him.

---

## 4. I14 — Commendation Page Requests Documents

### Client scenario (authoritative)

Specification page 50. Instagram, **Medium**, **Malicious**, family *Military-themed impersonation /
identity theft*, trigger *Pride + authority | FICTIONAL MILITARY CONTEXT*. Canonical identity: family
`identity_data_harvesting`, triggers `pride` + `authority`, military flag **true**, level `medium`.

- **Stage 1 (Event).** "@honour_roll_india: Send service card and posting proof to verify your feature
  today."
- **Stage 2 (Open).** "Open the DM request and fan page." Context: a fan page says the learner is
  shortlisted for a public commendation feature and requests service documents.
- **Stage 3 (Inspect).** "Non-official status, copied emblems, public bio and document request."
  Decision signal: *"A social-media feature has no legitimate need for service identity documents or
  posting proof."*
- **Stage 4 (Branch).** "A **media uploader** accepting synthetic ID and posting-order files."
  Expected: *do not upload identity, posting or family documents.*
- **Stage 5 (Verify).** "Check with the approved public-information/administrative office through
  known channels."
- **Stage 6 (Resolve).** "Upload nothing; report the impersonation/data solicitation; block the page."
- **End state.** "Uploader is cleared and the account is added to the local report queue."
- **Feedback.** "Pride and recognition can be used as bait. Protect service documents and verify
  through official channels."

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1598.001** Phishing for Information: Spearphishing Service | <https://attack.mitre.org/techniques/T1598/001/> | Strong. The solicitation is made over a social-media messaging service and asks directly for documents. |
| **T1585.001** Establish Accounts: Social Media Accounts | <https://attack.mitre.org/techniques/T1585/001/> | Strong. A page created in February 2026 under two earlier names, grown on reposted material. |
| **T1591.001** Gather Victim Org Information: Determine Physical Locations | <https://attack.mitre.org/techniques/T1591/001/> | Strong. A posting order names the station and the reporting date, which is precisely what this sub-technique describes collecting. |
| **T1589** Gather Victim Identity Information | <https://attack.mitre.org/techniques/T1589/> | **Partial fit, stated.** The identity card yields name, number, date of birth and next-of-kin. ATT&CK frames T1589 mainly around information used to target an organisation's systems; here it is collected for identity abuse. |
| **T1684.001** Social Engineering: Impersonation | <https://attack.mitre.org/techniques/T1684/001/> | **Partial fit, stated.** The page claims editorial standing it does not have, but it imitates a *category* — a tribute publication — rather than a specific named organisation. |

**Why this maps.** Establish a plausible account, contact the target through the platform's own
messaging, and request documents whose content is exactly the identity and location information the
two gathering techniques describe. The mechanism is the request itself; nothing is delivered to the
victim and nothing executes.

**Considered and rejected.** **T1566.001 Phishing: Spearphishing Attachment**
(<https://attack.mitre.org/techniques/T1566/001/>) describes an attachment sent **to** the victim.
The flow here is the exact reverse — the victim is the sender — and the presence of an attachment
picker is not a reason to reach for an attachment technique.

**What must NOT be copied.** No real publication, tribute page, media house, award, honour, citation
or commendation; no real emblem, crest, insignia or motto; no real service-card layout, field set,
numbering scheme or posting-order format; no real unit, station or posting cycle. The identity card
and the posting order in the picker are drawn tiles with invented field descriptions, and the
highlights show "as submitted" captions rather than any document content.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence, verbatim | The request row's preview, and the third beat of the thread |
| "Fan page", "non-official status" | Category "Digital creator", not verified, About says Verified: No |
| "Copied emblems" | The grid note: every photograph carries another account's watermark under the page's own crest |
| "Public bio and document request" | The bio invites DMs to be featured; the bio link describes the form |
| "Shortlisted for a public commendation feature" | "Five serving personnel, one post each", with last month's numbers |
| "A media uploader accepting synthetic ID and posting-order files" | The `VIEWER` attachment picker, holding exactly those two files plus a photograph |
| "Do not upload identity, posting or family documents" | `submit_data` on the picker, `-8`; the card's back carries next-of-kin |
| "Check with the approved public-information / administrative office through known channels" | `verify_trusted_directory` (the directory number) and `verify_known_app` (the unit media desk) |
| "Uploader is cleared" | `safe_pivot` is worded "Clear the selection and close" |
| "Report the impersonation / data solicitation; block the page" | `resolve_report` and `resolve_block`, both `+2` |
| Military content fictional | Unit Falcon; no real formation, station, document or procedure |

### Enhanced synthetic storyline

The page opens with a greeting, a number and a shortlist: five serving personnel, one post each, last
month's five crossed 1,200 shares. Then the client's sentence, then the specifics — the identity card,
both sides; any posting order or movement letter carrying the name. *Editorial verification only. We
blur everything before publishing.* At the branch, the deadline: 2100 hrs, or the slot passes to the
next name.

It does blur. Not enough. Last month's highlights are still on the profile, and the "featured"
service card is on screen with the name and photograph legible and the number partly covered. Under
the pinned post, somebody has been asking since July for theirs to be taken down.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast, from the client's sentence |
| Open | Messages, with the item under **Requests** |
| Inspect | The request card, the shortlist, the client's sentence, the two files named |
| Branch | The 2100 hrs deadline |
| Verify | The consequence: a selfie holding the card "for the editorial record", or the form submitted with service number, station and next-of-kin |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. The DM says **3.3 lakh followers**; the profile says **3,383**.
2. Joined **February 2026**; former usernames `@viral.army.status` and `@fauji.shayari.hub` (About).
3. Every grid photograph carries another account's watermark under the page's own crest.
4. **Story highlights — SEPT FEATURES**: last month's third feature, "service card as submitted", with
   the name and photograph legible.
5. **AUG FEATURES**: a posting order "as submitted", station and dates legible.
6. Under the pinned post: *"my card photo is still on your September highlight. i asked in July."* and
   *"why do you need a posting order for a photo post?"*
7. The bio link's description: the form wants service number, posting station and next-of-kin, and its
   fine print takes permission to publish anything provided, in any form, without further approval.
8. The unit media desk's standing instruction: identity cards, posting orders, service numbers and
   next-of-kin details are never released, and a publication writes to the public information cell
   rather than messaging an individual.

### Learner interaction journey

Notify → open the request → open the profile → open a highlight and see what "we blur everything"
produced → read the pinned post's comments → open the attachment picker, look at the two documents
sitting beside a holiday photograph → **clear the selection and close** → ring the administrative
office, or read the media desk's instruction → send nothing, and report.

### Simulation surfaces

- `profile` (`SOCIAL`): `profile` (with **highlights**), `about`, `highlight-sep` and `highlight-aug`
  (`story`), `pinned` (`post`), `formnote` (`settings`).
- `uploader` (`VIEWER`): the attachment picker — four files, each with its own description of what it
  shows.
- `form` (`BROWSER`): the page's own submission form, opened only by the `open_link` route.
- `publicity` (`APP`): the unit media desk and its standing instruction.
- The trusted-directory overlay, plus the public information cell as a scene row.

### Verification mechanism

`verify_trusted_directory` rings the administrative office on the directory number — the client's
"known channels". `verify_known_app` opens the unit media desk. Asking the page to prove it is a
publication is `verify_in_message_contact` and scores `0`. Reporting or blocking without checking
scores `+1`.

### Safe resolution

`resolve_report` or `resolve_block`, `+2`. The full safe path is `open_item → read → inspect_profile
→ safe_pivot → verify_trusted_directory → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Send the two selected files | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Type the service number and posting station instead | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Open the page's feature form | `open_link` | `RISKY_OPEN_REPLY` | −3 |
| Ask which publication this is for | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Reply from the notification | `reply` at open | `PREMATURE_REPLY` | −1 |
| Keep it, send the files later, or delete and tell nobody | `resolve_retain` / `resolve_continue` / `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`,
`SECRET_PAYMENT_INSTALL_DATA_RELEASE −8` (critical). Typing the details is priced the same as sending
the files, because the client's table prices the content and not the medium.

### Realism decisions

- The picker holds an ordinary photograph beside the two documents. A picker containing only
  documents would be a prompt, not a choice.
- Two files are already selected when it opens, because that is what "send these two" produces, and
  because clearing a selection is a more honest pivot than never making one.
- Nothing is paid for. The whole approach costs the learner nothing except what it is actually after.
- The page answers the complaint under its pinned post with "DM us 🙏", which is what such pages do.

### Known limitations

- Selecting a file is local and is never reported to the engine: the ledger records that documents
  were released, not which ones. That is deliberate — see §6.
- The picker is single-highlight: it shows one file's details at a time and states in a note that two
  are selected, rather than drawing checkboxes.
- Highlights are drawn covers, and the stories inside them are captions, not images.
- The result and review cards show the bank's placeholder Instagram sender.

### Why the final simulation stays faithful

The client's page, shortlist, document request, uploader, verification office and resolution are all
present. The scene's contribution is the evidence that the page has already done to somebody else
exactly what it is asking the learner to allow.

---

## 5. I15 — You Are in This Video

### Client scenario (authoritative)

Specification page 51. Instagram, **Medium**, **Malicious**, family *Compromised-contact link
phishing*, trigger *Curiosity + embarrassment*. Canonical identity: family `credential_phishing`,
triggers `curiosity` + `shame_embarrassment`, military flag **false**, level `medium`.

- **Stage 1 (Event).** "@knownfriend: Is this you in the video?? I can't believe it." (Stored
  truncated — see §0.5.)
- **Stage 2 (Open).** "Open the existing DM thread and video thumbnail." Context: a known account
  sends a short DM saying the learner appears in a shocking video.
- **Stage 3 (Inspect).** "Changed message style, external target, generic thumbnail and unusual
  timing." Decision signal: *"A real contact can be compromised; the lure creates curiosity and
  embarrassment to force a click."*
- **Stage 4 (Branch).** "A fake Instagram login page before the 'video'." Expected: *do not enter
  username/password **or approve a login prompt**.*
- **Stage 5 (Verify).** "Call/message the friend through another known route **and review login
  activity**."
- **Stage 6 (Resolve).** "Close the page; report the suspicious DM; alert the verified friend."
- **End state.** "Known friend confirms compromise; learner credentials remain untouched."
- **Feedback.** "Unexpected emotion-driven links from known accounts still require verification. Do
  not re-login from a DM link."

### MITRE ATT&CK alignment

| Technique | Page | Fit |
| --- | --- | --- |
| **T1586.001** Compromise Accounts: Social Media Accounts | <https://attack.mitre.org/techniques/T1586/001/> | Strong, and it is the scenario's whole premise: the messages come from an account the adversary has taken over rather than one they created. |
| **T1598.003** Phishing for Information: Spearphishing Link | <https://attack.mitre.org/techniques/T1598/003/> | Strong. A link leading to a page built to collect credentials, sent in a direct message. |
| **T1621** Multi-Factor Authentication Request Generation | <https://attack.mitre.org/techniques/T1621/> | Strong here. The learner's own device raises "someone is trying to log in — is this you?", and a single approval completes the takeover with nothing typed. |

**Why this maps.** Take over a trusted account; use the trust it carries to deliver a link; collect
the first factor on a page and the second by having the victim approve the request the adversary has
generated. Each step is described by the technique cited against it, and the account compromise is
the load-bearing one — it is what makes every documentary check come back clean.

**Considered and rejected — two.** **T1684.001 Social Engineering: Impersonation**
(<https://attack.mitre.org/techniques/T1684/001/>) is the obvious reach and is wrong here: nothing is
imitating the friend, because the account **is** the friend's. Recording impersonation would teach the
opposite of the scenario's lesson. **T1111 Multi-Factor Authentication Interception**
(<https://attack.mitre.org/techniques/T1111/>) is rejected for the same reason as in I12 — the second
factor is typed in or approved by the victim, not intercepted.

**What must NOT be copied.** No real Instagram login page markup, styling, asset or endpoint; no real
link-shortener, share host or video-hosting service; no real login-request notification payload; no
video, media element or player of any kind. The gate is four inert local pages, the "thumbnail" is a
drawn field with a play glyph, and the login-request prompt is a local dialog that approves nothing.

### Client requirements preserved

| Client requirement | Where it is in the scene |
| --- | --- |
| The client's sentence | The beat begins with the bank's exact stored string and completes the client's own sentence (§0.5) |
| "Existing DM thread" | The main inbox, with yesterday's conversation about trekking poles above today's message |
| "Known account" | Joined 2015, no former usernames, 412 mutual followers — every check clean |
| "Video thumbnail" | The link card carries a drawn thumbnail with a play badge |
| "Changed message style" | Yesterday's long, punctuated message against today's two clipped ones |
| "External target" | `ig-vid-share.training.example`, which is not the platform's host |
| "Generic thumbnail" | A drawn figure; nothing identifies anyone |
| "Unusual timing" | The message arrives three minutes before a login attempt appears in Login activity |
| "A fake Instagram login page before the 'video'" | `gate`: watch → login → code → confirm |
| "Do not enter username/password **or approve a login prompt**" | Two separate `-8` routes: `submit_data` and `approve_device_link` |
| "Call/message the friend through another known route" | `verify_known_number` opens a call to his saved number |
| "Review login activity" | `verify_known_app` opens the learner's own Login activity |
| "Alert the verified friend" | The safe resolution is worded as reporting **and** warning him on his number |
| End state: "known friend confirms compromise" | He says so on the call: locked out since this morning, Anjali rang about the same thing |

### Enhanced synthetic storyline

Yesterday he wrote a long, ordinary message about where to buy trekking poles and when the club sale
ends. Today: *"Is this you in the video?? I can't believe it 😳"*, a link card, and *"someone put it in
the group. open it fast"*. Nothing else — no follow-up, no joke, none of the way he usually writes.

Six minutes earlier, another thread in the inbox: Anjali, asking whether Rohit has messaged today.
She does not say why.

While the learner is deciding, their own phone raises the prompt: *someone is trying to log in to
your account from a device in another city. Is this you?* It is not a page and it asks for nothing.
One tap is enough.

### Conversation progression

| Stage | What is on screen |
| --- | --- |
| Notify | The toast, from the client's sentence |
| Open | Messages — the main inbox — with Anjali's thread two rows down |
| Inspect | Yesterday's conversation, today's two lines, the link card and its host |
| Branch | "?? are you seeing this", and the platform's login-request prompt |
| Verify | The consequence: the password and contact details changed, or a new device signed in and already messaging everyone the learner follows |
| Resolve | The outcome card and the review |

### Evidence the learner can discover (progressive)

1. Joined **June 2015**, **no former usernames**, based in India, 412 accounts in common — every
   documentary check passes.
2. His grid is his: ridges, a café, eleven years of ordinary posting.
3. Yesterday's message is four times the length of today's, and today's has no punctuation he uses.
4. The link's host is `ig-vid-share.training.example` — not the platform's.
5. The thumbnail could be anyone.
6. **Anjali's thread**, in the same inbox, asking whether he has messaged her today.
7. **Login activity** (the learner's own): an attempt from another city at 19:52, **waiting for
   approval**, three minutes after the message arrived.
8. On the call: he is locked out, he did not send it, and Anjali rang about the same thing.

### Learner interaction journey

Notify → open the chat → read back through yesterday → open his profile and About → open the link and
walk the gate → **close it** (or answer "It wasn't me" on the prompt) → ring him on the number saved
in the phone, and read Login activity → report the message and warn him.

### Simulation surfaces

- `profile` (`SOCIAL`): `profile`, `about`, `mutuals` (`people`).
- `gate` (`BROWSER`): `watch` → `login` → `code` → `confirm` → `done`.
- `request` (`INSTALLER`, page style `sheet`): the platform's own login-request prompt, with the
  device, the place and the time, and the two answers.
- `activity` (`SOCIAL`, `status`): the learner's own Login activity.
- `call` (`CALL`): ringing him on the saved number.
- The trusted-directory overlay, plus his saved contact as a scene row.

### Verification mechanism

Both of the client's halves are offered and both score `+3`: `verify_known_number` (his number,
saved in 2016, reached outside the account in question) and `verify_known_app` (the learner's own
Login activity). `verify_trusted_directory` reaches the unit support desk. Asking in the chat whether
it is really him is `verify_in_message_contact` and scores `0` — the account answers, and the answer
is yes.

### Safe resolution

`resolve_report` (report, and warn him on his number) or `resolve_block` until he has his account
back, `+2`. The full safe path is `open_item → read → inspect_profile → safe_pivot →
verify_known_number → resolve_report` = **10**.

### Unsafe paths

| Route | Intent | Event | Points |
| --- | --- | --- | --- |
| Confirm and play the clip (username, password, code) | `submit_data` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| "Yes, it was me" on the login prompt | `approve_device_link` | `SECRET_PAYMENT_INSTALL_DATA_RELEASE` | −8 |
| Ask where the video came from | `reply` | `RISKY_OPEN_REPLY` | −3 |
| Open the video from the list without reading the chat | `open_link` at open | `PREMATURE_REPLY` | −1 |
| Ask in the chat whether it is really him | `verify_in_message_contact` | `VERIFY_THROUGH_MESSAGE` | 0 |
| Watch it later, keep the chat, or delete and tell nobody | `resolve_continue` / `resolve_retain` / `resolve_ignore` | `CONTRADICTORY_UNSAFE_FINAL` | −4 |

### Scoring / event mapping (unchanged)

Stage 4 declares `SAFE_PIVOT +3`, `RISKY_OPEN_REPLY −3`,
`SECRET_PAYMENT_INSTALL_DATA_RELEASE −8` (critical). `approve_device_link` resolves to the release
code with consequence `simulated_device_link`, which is the same treatment W10 and W25 give it on
WhatsApp.

### Realism decisions

- Nothing about the account is wrong, and the About page says so in as many words ("nothing about
  this account has changed since you started following it in 2016"). A scene that quietly withheld
  the clean result would be teaching the learner to expect a tell that is not there.
- Anjali's thread asks a question and does not answer it. A preview reading "don't open the link from
  Rohit" would have ended the scenario in the inbox.
- The gate asks for the password although the learner is already signed in on this device, and then
  for the code. Two steps, because that is what these pages do.
- The login prompt has no page, no field and no fee. It is the shortest route to the account in the
  whole batch and it is one tap.

### Known limitations

- One decision per stage: the page and the prompt are alternatives.
- The prompt is drawn as a system sheet inside the device shell rather than as an operating-system
  notification, because the device draws one notification tray and the scenario router owns it.
- Login activity is authored, not live account state.
- The result and review cards show the bank's placeholder Instagram sender, and its handle
  `@knownfriend` is the client's own (§0.5).

### Why the final simulation stays faithful

Every client element is present: the existing thread, the thumbnail, the changed message style, the
external target, the unusual timing, the login page before the "video", the explicit ban on approving
a login prompt, both verification halves, and a friend who confirms the compromise. The scene's
contribution is that the inspection the learner has been trained to perform comes back clean, and the
run only turns on what they do next.

---

## 6. Forms, inputs and data handling

Six screens in this batch accept typing: I12's confirmation page (username, password, backup code),
I13's gift-card page (two card numbers and two scratch PINs) and wallet sheet (a PIN), and I15's
login and code pages (username, password, then a six-digit code). They obey the rules
`SceneForms.test.jsx` and `SceneContainment.test.jsx` already enforce on every earlier batch, and
nothing about them is new:

- **Local.** Every value lives in `useLocalForm` state inside the component that draws the field. It
  is never lifted, never passed to an affordance, never put in an intent or in metadata.
- **Ephemeral.** Leaving the screen unmounts the component and the state is gone. `BrowserSurface`
  is keyed on the page id, so walking to the next step discards the previous step's values by
  remount rather than by a cleanup that could be forgotten.
- **Never transmitted.** No `fetch`, no `<form>`, no action, no method, no submit event. The control
  that commits a decision is an ordinary button carrying a scene affordance, and the affordance
  carries an intent, an optional asset id and nothing else.
- **Never persisted.** No `localStorage`, `sessionStorage`, IndexedDB, cookie or cache holds a typed
  value; a reload rebuilds the run from the stage the server committed with the fields empty.
- **Never logged.** No console output, no analytics, no event payload. The server would refuse one
  anyway: the engine's `METADATA_ALLOWLIST` rejects any metadata key it does not know, so a value
  that somehow reached the API would not be written to the ledger.
- **No autofill surface.** Every input is `type="text"` with `autoComplete="off"`, `autoCorrect="off"`,
  `spellCheck={false}` and a meaningless `name` (`f0`, `f1`, …). Secret and masked fields are hidden
  with CSS `text-security`, never `type="password"`, so no browser or password manager recognises
  them as credentials and offers to save them.
- **No form submission.** A page's `primary` control is local: it validates length and walks to the
  next page. It scores nothing and cannot advance a stage.
- **Deterministic.** A field is satisfied when it holds the number of characters it asks for. Same
  input, same result, every time; no server, no clock, no randomness.
- **Not decorative.** The fields are real inputs and the learner really fills them in, because
  refusing to hand over a password is a decision and reading a picture of a form is not.

No field in this batch accepts a real credential, a real card, a real OTP, a real wallet key or a
real document. The gift-card numbers are sixteen arbitrary digits; the backup code is eight; the
wallet PIN is six; the identity card and posting order in I14 are drawn tiles with no content at all,
which is why the picker never needs a field in the first place.

## 7. What is asserted, and where

| Claim | Test |
| --- | --- |
| Every I11–I15 control resolves to a legal transition on its own pinned definition | `backend/tests/sceneAffordance.test.js` |
| Each safe path scores exactly ten, in six stages, and produces the positive review card | `backend/tests/sceneAffordance.test.js` |
| Each named control keeps its event code and point value | `backend/tests/sceneAffordance.test.js` |
| The review explains the unsafe walks and leaks no scoring code, point value or placeholder | `backend/tests/sceneAffordance.test.js` |
| No branch-stage shape repeats any of the earlier thirty-five scenes, or any other in the batch | `frontend/src/simulation/sceneModel.test.js` |
| No disposition, family, trigger, end state, feedback, narrator line or verdict word reaches the device | `frontend/src/simulation/sceneModel.test.js` |
| Every host is `*.training.example`; every number is in the reserved range | `frontend/src/simulation/sceneModel.test.js` |
| The client's handle and message survive verbatim; the placeholder sender never appears | `frontend/src/simulation/sceneModel.test.js` |
| I12's and I15's page addresses come from the pinned asset, and no control opens its stored body | `frontend/src/simulation/sceneModel.test.js` |
| Every social page, action button and highlight links only to something the scene declares | `frontend/src/simulation/sceneModel.test.js` |
| No `href`, `src`, `iframe`, `form`, media element or host handler on any screen | `frontend/src/components/simulation/SceneContainment.test.jsx` |
| Typed values never leave the component, the screen or the session | `frontend/src/components/simulation/SceneForms.test.jsx` |
| The five scenarios play end to end through the real controller and attempt API | `frontend/src/pages/SceneScenariosInstagramC.test.jsx` |
| This document covers every authored scenario and cites every technique it names | `frontend/src/simulation/sceneResearch.test.js` |

## 8. Findings during verification

Recorded here as they were found, with what was done about each.

1. **A `list` view was no longer unique to I06–I10.** I11's Saved collection is a `list` page, which
   broke an I06 assertion written as "no other scene has one". The claim was about novelty at the
   time it was made, so it was rescoped to the scenes that existed **before** I06–I10 rather than
   weakened.
2. **I15's stored notification is truncated in the bank** (§0.5). The scene extends the exact stored
   string rather than paraphrasing it, which is the workaround six WhatsApp scenarios already use,
   and the test that lists truncated WhatsApp bodies is left alone so a future bank fix still breaks
   loudly.
3. **`@knownfriend` reads as a stand-in.** Used verbatim anyway, with a display name beside it, and
   recorded (§0.5) rather than quietly improved.
4. Browser-play findings are recorded in `PROJECT_MASTER_PLAN.md` §16.22 alongside the test totals.
