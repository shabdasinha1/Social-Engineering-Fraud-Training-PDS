# Canonical Attack-Family Taxonomy

**Status:** DESIGN RECORD — approved as an **implementation decision** on 4 September 2026 (ALIGN-005, resolving Question 10 in `PROJECT_MASTER_PLAN.md` §15.14).
**Taxonomy version:** `1.0.0`
**Applies to:** the 100-scenario client bank in `Interactive_Social_Engineering_Scenario_UI_Development_Specification.pdf` (v1.0, 02 September 2026).

> ## ⚠ THIS IS OUR DECISION, NOT A CLIENT REQUIREMENT
>
> The client specification does **not** define a canonical attack-family taxonomy. It
> supplies a free-text `Attack / case family` label per scenario and the selection rule
> *"no attack family more than twice"* (§5).
>
> This taxonomy is **derived by the implementation team** so that rule can actually
> function. It **must never be represented to the client as a client-specified
> requirement**, quoted back as though it came from the specification, or used to justify
> any change to scenario content. It is our implementation metadata, and the client may
> replace it at any time.
>
> Nothing in this document has been implemented. It is a design record only.

---

## 1. The problem this solves

The client bank contains **99 distinct `family` strings across 100 scenarios** — only
*Task/job scam* repeats (`W17` and `S13`). Applied literally, "no attack family more than
twice" can therefore almost never bind.

This was measured, not assumed. Over **20,000** randomly generated attempts that already
satisfied every other selection constraint (8+2 disposition, legitimate-platform
diversity, 3/3/2/2 platform allocation, 3E/4M/3H difficulty, 2–4 military context, ≥5
psychological triggers):

| Constraint applied to | Draws rejected by "max 2 per family" |
|---|---|
| **Raw client `family` string** | **0 of 20,000 — 0.0000%** |
| **Canonical family (this taxonomy)** | **2,741 of 20,000 — 13.71%** |

The raw label is provably inert. The canonical label makes the client's stated intent —
that one attempt should not be eight variations of the same attack — actually enforceable.

## 2. Decision

1. The client's `family` value is **preserved verbatim and never overwritten**, under its
   own field. It remains the authoritative client content.
2. A **separate** `canonical_family` field is added as implementation metadata.
3. Every scenario maps to **exactly one** canonical family.
4. `canonical_family` drives the **selection constraint** (max 2 per attempt) and
   **results analytics** by attack family.
5. The mapping is a **versioned data artifact**, not code. Phase 1 (`DATA-001` /
   `DATA-002`) will materialise this document as
   `backend/data/attack-family-taxonomy.v1.json`. It must never become a switch statement
   inside selection logic.
6. Every scenario record carries `family` (client), `canonical_family` (ours) and
   `taxonomy_version`, so any historical attempt remains auditable and re-derivable.

**Re-mapping is a versioned event.** Changing any assignment requires a new
`taxonomy_version`. Attempts scored under an older version keep that version's mapping —
this is what makes the §7 requirement to "compare only when mode and content version are
comparable" enforceable for family analytics.

## 3. Classification axis

A scenario's canonical family is the **underlying attack mechanism** — what the adversary
constructs or does, and correspondingly **the single defence skill that defeats it**.

Two scenarios share a family when defeating them requires the *same recognition and the
same response*, even if the platform, cover story, wording or emotional trigger differ.

### Deliberately NOT classification inputs

Per the task rules, and because each is already a separate dimension in the client's own
data model:

| Axis | Why it is not the family |
|---|---|
| Platform | Already `platform`; the 3/3/2/2 rule governs it |
| Psychological trigger | Already `trigger`; the ≥5-triggers rule governs it |
| Military context | Already `military_flag`; the 2–4 rule governs it |
| Difficulty | Already `level`; the 3E/4M/3H rule governs it |
| Disposition | Already `disposition`; the 8+2 rule governs it |

### Two axes deliberately rejected as families

These look like families but are **difficulty determinants**, and §1 of the specification
says so explicitly — difficulty reflects *"cue quality, premise alignment, **sender
familiarity** and number of verification steps"*:

- **Compromised-vs-spoofed sender.** Whether the sending account is genuinely
  compromised (`W09`, `W18`, `W25`, `I15`, `I23`, `E18`, `E25`, `S18`) or merely
  impersonated (`W20`, `E10`, `I04`) changes how hard the scenario is, not what the attack
  *is*. `E18` (hijacked invoice thread) and `W20` (spoofed supplier) are the same risk
  pattern — redirecting an existing payment relationship — and are graded Hard for
  precisely that reason. They therefore share a canonical family.
- **Synthetic media.** Deepfake video (`I09`), cloned voice (`W15`, `E22`) and morphed
  images (`I17`) are a *cue-quality* property. `E22` is a payment diversion that happens
  to arrive as a voice memo; `I09` is investment fraud that happens to use a deepfake.

### One deliberate exception: `qr_code_phishing`

QR delivery is, strictly, a delivery vector — and by the rule above a delivery vector
should not be a family. It is made an exception because the **defence action is
tool-specific and distinct**: the specification mandates a dedicated QR inspector (§4)
whose whole purpose is *"show the full synthetic target before an Open choice"*. No other
delivery vector has its own mandated inspection tool or its own inspection habit. This is
a reasoned exception, recorded rather than hidden.

## 4. The taxonomy — 19 families (15 malicious, 4 legitimate)

### Malicious (80 scenarios)

| Canonical family | n | Mechanism / defence skill |
|---|---|---|
| `operational_elicitation` | 10 | Protected operational, technical or capability detail is drawn out — location, movement, routine, equipment, device identifiers. *Never disclose operational detail over a messaging platform; route via the approved channel.* |
| `financial_credential_phishing` | 9 | A fake page impersonating a **known institution** (bank, courier, tax, toll, merchant) harvests card / account / PIN / UPI / OTP. *Open the issuer's own app; never enter payment data from a message link.* |
| `payment_diversion` | 7 | An **existing or expected** legitimate financial flow is redirected — vendor master, invoice thread, payroll, executive or colleague purchase request. *Verify any change of payee out of band, through a channel you already held.* |
| `account_takeover_authorisation_abuse` | 6 | No password is stolen: the learner is persuaded to **hand over or approve an authorisation artifact** — OTP, backup code, device link, SIM port, OAuth consent. *Never relay or approve an authorisation you did not initiate.* |
| `tech_support_and_callback_fraud` | 6 | The learner is pivoted **off-channel to a live operator** — a supplied number, a call, a remote/screen-share session. *Never call a number the message supplies; never grant remote access.* |
| `credential_phishing` | 6 | A fake authentication surface harvests **service or account** credentials (mail, social, cloud, HR portal). *Reach the service by its known route, not by the message's link.* |
| `identity_data_harvesting` | 5 | Identity documents or numbers are requested — service number, DOB, ID card, roster — enabling later impersonation or identity theft. *Identity data is released only through the approved personnel channel.* |
| `qr_code_phishing` | 5 | The destination is concealed inside a QR code. *Decode and read the full target before opening; a QR is not a source of authority.* |
| `investment_and_task_fraud` | 5 | A fake earning or trading platform shows fabricated profit, then demands a deposit or locks withdrawal. *Displayed profit is not money; a platform that must be topped up to pay out is fake.* |
| `malware_delivery` | 5 | An executable payload arrives as a file or app — APK, macro document, archive, smuggled HTML. *Do not install or enable content from a message; use the official store or issuer app.* |
| `unsolicited_payment_lure` | 5 | An **unsolicited** offer or appeal induces payment to a party with no prior relationship — prize, giveaway, brand gift, paid "verification", emergency donation. *A benefit that requires you to pay first is not a benefit.* |
| `coercion_and_extortion` | 4 | Compliance is driven by threat — digital arrest, legal or secrecy order, blackmail imagery. *No authority collects fees or demands secrecy over a messaging app; escalate rather than comply.* |
| `impersonation_emergency_payment` | 3 | Someone poses as a **known person in distress** and requests immediate money. *Call the person on the number you already hold before sending anything.* |
| `relationship_grooming_fraud` | 3 | Weeks of legitimate-seeming rapport precede the financial ask — romance, friendship, wrong number. *Relationship duration is not a trust credential.* |
| `disinformation_amplification` | 1 | The learner is induced to **reshare** false content and self-expose by tagging or geotagging. *Verify before amplifying; amplification is disclosure.* |

### Legitimate controls (20 scenarios)

Legitimate items are classified by **what the learner must correctly accept**, so that
false-positive analytics is meaningful. Because exactly 2 legitimate scenarios are drawn
per attempt, the max-2 rule can never bind here — these families exist for analytics.

| Canonical family | n | Pattern |
|---|---|---|
| `legit_system_confirmation` | 7 | A system-generated confirmation matching an action the learner just took — transaction alert, receipt, OTP, login alert, appointment status |
| `legit_coordination_request` | 6 | An expected in-app action from a known party — poll, acknowledgement, calendar response, consent, tag review, expected document |
| `legit_routine_broadcast` | 6 | Informational, requesting no data or credential — newsletter, maintenance notice, public announcement, directory update, shared reel |
| `legit_verified_high_risk_change` | 1 | The one legitimate case that mirrors a high-risk attack pattern and must be accepted **only after** proper verification and dual approval (`E21`) |

## 5. Validation results

All figures computed against the actual client bank.

| Check | Result |
|---|---|
| Scenarios considered | **100 / 100** |
| Mapped to exactly one canonical family | **100 / 100** |
| Unmapped or duplicate-mapped | **none** |
| Client `family` strings altered | **none** — preserved verbatim |
| Scenario content altered | **none** |
| Feasible for all six 3/3/2/2 allocations | **yes — 0 failures** |
| Feasible with a recent-20 exclusion window | **0 failures / 200 trials** |
| Feasible with two attempts of realistic history excluded | **0 failures / 200 trials** |
| Max-2 rejection rate, canonical family | **13.71%** (constraint does real work) |
| Max-2 rejection rate, raw client family | **0.0000%** (constraint provably inert) |
| Distinct canonical families delivered per attempt | min 6, **mean 8.4**, max 10 |
| Malicious families spanning ≥2 platforms | **14 / 15** (only the singleton is single-platform) |
| Malicious families containing military scenarios | **8** — up to 16 military obtainable per attempt vs the 2–4 required |

**Not a proxy for another axis.** 14 of 15 malicious families span two to four platforms.
Difficulty is mixed within families. Six malicious families mix military and non-military
scenarios.

**One honest correlation.** `operational_elicitation` (10) and `identity_data_harvesting`
(5) are 100% military-context. This is a property of the client's content — military-context
attacks in this bank are predominantly elicitation-shaped — not an artifact of the
taxonomy. It does not constrain selection: military scenarios are spread across eight
malicious families, so the 2–4 military requirement is satisfiable many times over.

## 6. Edge cases and the rulings made

Where a scenario could defensibly sit in two families, the ruling below is the one applied.
Each is decided by the **decisive defence skill**, and the alternative is recorded so a
future reviewer can re-open it without re-deriving the analysis.

| ID | Tension | Ruling | Why |
|---|---|---|---|
| `W10` | QR delivery vs device linking | `account_takeover_authorisation_abuse` | The QR is only the carrier; the decisive act is approving a **Linked Devices** session, which is the far more dangerous and specific skill |
| `W08` | Prize lure vs QR | `qr_code_phishing` | The destination is concealed; QR inspection is what defeats it before the prize claim is ever reached |
| `E14` | Attachment vs QR | `qr_code_phishing` | The PDF is inert; the payload is a QR "to decrypt the order" |
| `E23` | Malicious attachment vs credential phishing | `malware_delivery` | The decisive habit is not trusting a locally-rendered HTML attachment; the credential prompt is what it renders |
| `S23` | Payment-request reversal vs payment fraud | `financial_credential_phishing` | Asset is UPI PIN and funds on a synthetic payment surface; the skill is reading a payment screen correctly. **Weakest fit in the taxonomy** — the only member with no fake *branded* page. Flagged for review if a `payment_authorisation_literacy` family is ever justified |
| `I08` | Fake service vs credential phishing | `unsolicited_payment_lure` | Requests password, ID **and** fee, but the entry mechanism is paying for a benefit that cannot be bought — that is what the learner must recognise first |
| `I10` | Brand impersonation vs fee lure | `unsolicited_payment_lure` | Same reasoning: a brand deal that asks you to pay is not a brand deal |
| `I23` | Compromised account vs payment lure | `unsolicited_payment_lure` | No prior financial relationship exists, so it is not diversion; it is an unsolicited appeal. Compromise is a difficulty factor (§3) |
| `W09`, `E09` | Gift cards vs BEC | `payment_diversion` | Both exploit an existing workplace relationship to redirect spend |
| `E22` | Synthetic media vs payment | `payment_diversion` | Voice cloning is cue quality; the attack is a confidential transfer |
| `W18` | Compromised admin vs data harvesting | `identity_data_harvesting` | The payload is a roster form (service number, role, location); compromise is a difficulty factor |
| `E18`, `S18`, `E25` | Thread hijack vs payload | payload family | Compromise is a difficulty factor per §3 |
| `I20` | Grooming vs elicitation | `operational_elicitation` | Rapport is the delivery; there is **no financial ask** — the defence is the elicitation refusal |
| `W22`, `S09` | Grooming vs investment | `relationship_grooming_fraud` | Both end in a fake platform, but weeks of cultivated rapport is what defeats ordinary scepticism and must be the taught signal |
| `S10` | Callback vs SIM swap | `account_takeover_authorisation_abuse` | A call is involved, but the loss is the SIM/OTP authorisation |
| `W24` | No callback, but support pretext | `tech_support_and_callback_fraud` | Chat-delivered, yet the mechanism is a fake support agent obtaining remote control |
| `I22` | Platform support vs coercion | `tech_support_and_callback_fraud` | Live "support" session extracting face scan, screen share and backup code |
| `I17` | Extortion vs image abuse | `coercion_and_extortion` | Threat-driven payment is the mechanism; the morphed image is the lever |
| `I19` | Singleton family | `disinformation_amplification` | Retained rather than merged: "verify before amplifying" is a genuinely different habit from refusing a direct question. Being a singleton, it can never bind the max-2 rule — it is retained for analytics value, per the rule against collapsing distinct mechanisms merely to shrink the taxonomy |

## 7. Complete mapping — 100 scenarios

`L` = level (E/M/H) · `D` = disposition (M/L) · `Mil` = military context.
The **Client family** column is reproduced verbatim from the specification and is the
field that must be preserved in the data model.

| ID | Title | Platform | L | D | Mil | Client family (preserved verbatim) | Canonical family (ours) |
|---|---|---|---|---|---|---|---|
| `W01` | The Accidental Login Code | WhatsApp | E | M |  | Account takeover / OTP theft | `account_takeover_authorisation_abuse` |
| `W02` | Parcel Redelivery Fee | WhatsApp | E | M |  | Delivery impersonation / payment phishing | `financial_credential_phishing` |
| `W03` | Known Sports Meet Group | WhatsApp | E | L | Y | Legitimate group invitation | `legit_coordination_request` |
| `W04` | Friend on a New Number | WhatsApp | E | M |  | Known-contact impersonation / emergency payment | `impersonation_emergency_payment` |
| `W05` | KYC Suspension Warning | WhatsApp | E | M |  | Bank impersonation / credential phishing | `financial_credential_phishing` |
| `W06` | Unit Clerk ID Photo Request | WhatsApp | E | M | Y | Military impersonation / information collection | `identity_data_harvesting` |
| `W07` | Expected Family Document | WhatsApp | E | L |  | Legitimate document exchange | `legit_coordination_request` |
| `W08` | Festival Reward QR | WhatsApp | E | M |  | Prize scam / QR phishing | `qr_code_phishing` |
| `W09` | Compromised Colleague Gift Cards | WhatsApp | M | M | Y | Compromised-contact fraud | `payment_diversion` |
| `W10` | Survey Device-Link QR | WhatsApp | M | M |  | Linked-device takeover / QR deception | `account_takeover_authorisation_abuse` |
| `W11` | Expected Welfare Appointment | WhatsApp | M | L |  | Legitimate appointment confirmation | `legit_system_confirmation` |
| `W12` | Digital Arrest Escalation | WhatsApp | M | M |  | Government impersonation / digital arrest | `coercion_and_extortion` |
| `W13` | Guaranteed IPO Group | WhatsApp | M | M |  | Investment-group fraud | `investment_and_task_fraud` |
| `W14` | Movement Order APK | WhatsApp | M | M | Y | Military spearphishing / malicious app | `malware_delivery` |
| `W15` | Senior's Urgent Voice Note | WhatsApp | M | M | Y | Synthetic-media impersonation / data request | `operational_elicitation` |
| `W16` | Verified Vehicle-Pool Change | WhatsApp | M | L | Y | Legitimate operational administration | `legit_coordination_request` |
| `W17` | Part-Time Rating Tasks | WhatsApp | M | M |  | Task/job scam | `investment_and_task_fraud` |
| `W18` | Hijacked Group Admin Roster Link | WhatsApp | H | M | Y | Compromised admin / group spearphishing | `identity_data_harvesting` |
| `W19` | Commander Clone Requests Location | WhatsApp | H | M | Y | Military impersonation / location collection | `operational_elicitation` |
| `W20` | Supplier Bank-Detail Change | WhatsApp | H | M |  | Procurement impersonation / payment diversion | `payment_diversion` |
| `W21` | Verified Senior Requests Secure Follow-Up | WhatsApp | H | L | Y | Legitimate minimal notification | `legit_routine_broadcast` |
| `W22` | Long-Game Online Friendship | WhatsApp | H | M |  | Relationship grooming / investment fraud | `relationship_grooming_fraud` |
| `W23` | Family Welfare Pretext | WhatsApp | H | M | Y | Military-family targeting / operational elicitation | `operational_elicitation` |
| `W24` | Remote Support Screen Share | WhatsApp | H | M |  | Tech-support scam / remote access | `tech_support_and_callback_fraud` |
| `W25` | Known Contact Sends a Linking Code | WhatsApp | H | M |  | Compromised-contact device linking | `account_takeover_authorisation_abuse` |
| `I01` | Flash Giveaway Winner | Instagram | E | M |  | Giveaway / credential-payment scam | `unsolicited_payment_lure` |
| `I02` | Copyright Appeal Countdown | Instagram | E | M |  | Fake platform support / credential phishing | `credential_phishing` |
| `I03` | Published Blood-Donation Drive | Instagram | E | L | Y | Legitimate public announcement | `legit_routine_broadcast` |
| `I04` | Cloned Friend in Distress | Instagram | E | M |  | Profile cloning / emergency payment | `impersonation_emergency_payment` |
| `I05` | Friendly New Follower Questionnaire | Instagram | E | M | Y | Social profiling / information elicitation | `operational_elicitation` |
| `I06` | Where Was This Exercise? | Instagram | E | M | Y | Operational-information elicitation | `operational_elicitation` |
| `I07` | Known Friend Shares a Reel | Instagram | E | L |  | Legitimate social sharing | `legit_routine_broadcast` |
| `I08` | Verification Badge Agent | Instagram | E | M |  | Fake verification service | `unsolicited_payment_lure` |
| `I09` | Deepfake Trading Advertisement | Instagram | M | M |  | Investment fraud / synthetic endorsement | `investment_and_task_fraud` |
| `I10` | Brand Collaboration Shipping Fee | Instagram | M | M |  | Influencer/brand impersonation | `unsolicited_payment_lure` |
| `I11` | Official Welfare Helpline Update | Instagram | M | L | Y | Legitimate official-account update | `legit_routine_broadcast` |
| `I12` | Account Recovery Backup Code | Instagram | M | M |  | Account-recovery phishing | `account_takeover_authorisation_abuse` |
| `I13` | Deployed Officer Romance Profile | Instagram | M | M | Y | Romance scam / identity fabrication | `relationship_grooming_fraud` |
| `I14` | Commendation Page Requests Documents | Instagram | M | M | Y | Military-themed impersonation / identity theft | `identity_data_harvesting` |
| `I15` | You Are in This Video | Instagram | M | M |  | Compromised-contact link phishing | `credential_phishing` |
| `I16` | Approved Photo Release Request | Instagram | M | L | Y | Legitimate public-affairs workflow | `legit_coordination_request` |
| `I17` | Morphed-Photo Blackmail | Instagram | M | M |  | Image-based extortion | `coercion_and_extortion` |
| `I18` | High-Fidelity Teammate Clone | Instagram | H | M | Y | Profile cloning / location elicitation | `operational_elicitation` |
| `I19` | Urgent Unit Incident Repost | Instagram | H | M | Y | Disinformation / amplification lure | `disinformation_amplification` |
| `I20` | Researcher Asks Capability Questions | Instagram | H | M | Y | Rapport-based elicitation / espionage pretext | `operational_elicitation` |
| `I21` | Post-Event Teammate Tag | Instagram | H | L | Y | Legitimate post-event sharing | `legit_coordination_request` |
| `I22` | Live Support Video Call | Instagram | H | M |  | Fake platform support / call coercion | `tech_support_and_callback_fraud` |
| `I23` | Compromised Charity Influencer | Instagram | H | M |  | Compromised trusted account / donation diversion | `unsolicited_payment_lure` |
| `I24` | Institutional Trading App | Instagram | H | M |  | Fake regulated investment platform | `investment_and_task_fraud` |
| `I25` | Canteen Coupon Reel QR | Instagram | H | M | Y | Military-themed QR phishing | `qr_code_phishing` |
| `E01` | Password Expires Today | Email | E | M |  | Credential phishing | `credential_phishing` |
| `E02` | Invoice Spreadsheet Macro | Email | E | M |  | Malicious attachment | `malware_delivery` |
| `E03` | Authenticated Internal Newsletter | Email | E | L |  | Legitimate internal communication | `legit_routine_broadcast` |
| `E04` | Customs Parcel Hold | Email | E | M |  | Delivery impersonation / fee phishing | `financial_credential_phishing` |
| `E05` | Mandatory HR Policy Login | Email | E | M |  | HR impersonation / credential phishing | `credential_phishing` |
| `E06` | Adjutant Roster Request | Email | E | M | Y | Military display-name spoofing / data request | `identity_data_harvesting` |
| `E07` | Expected Training Calendar Invite | Email | E | L | Y | Legitimate calendar invitation | `legit_coordination_request` |
| `E08` | Instant Tax Refund | Email | E | M |  | Government impersonation / refund phishing | `financial_credential_phishing` |
| `E09` | Executive Gift-Card Request | Email | M | M | Y | Business email compromise | `payment_diversion` |
| `E10` | Vendor Changes Bank Details | Email | M | M |  | Invoice/payment diversion | `payment_diversion` |
| `E11` | Leave Approval in Known Portal | Email | M | L |  | Legitimate workflow notification | `legit_system_confirmation` |
| `E12` | Shared Document Sign-In | Email | M | M | Y | Cloud-document credential phishing | `credential_phishing` |
| `E13` | Password-Protected ZIP | Email | M | M |  | Archive-delivered malware | `malware_delivery` |
| `E14` | Revised Movement Order | Email | M | M | Y | Military spearphishing / attachment | `qr_code_phishing` |
| `E15` | OAuth Consent for Mail Review | Email | M | M |  | Consent phishing / cloud-app access | `account_takeover_authorisation_abuse` |
| `E16` | Signed Maintenance Notice | Email | M | L |  | Legitimate IT maintenance | `legit_routine_broadcast` |
| `E17` | Invoice Callback Trap | Email | M | M |  | Callback phishing / tech-support fraud | `tech_support_and_callback_fraud` |
| `E18` | Hijacked Reply-Chain Invoice | Email | H | M |  | Thread hijack / payment diversion | `payment_diversion` |
| `E19` | Academic Interview on Readiness | Email | H | M | Y | Military elicitation / research pretext | `operational_elicitation` |
| `E20` | Legal Notice and Secrecy Order | Email | H | M |  | Legal/government impersonation / extortion | `coercion_and_extortion` |
| `E21` | Verified Vendor Master Change | Email | H | L |  | Legitimate high-risk business change | `legit_verified_high_risk_change` |
| `E22` | Senior Voice Memo Transfer | Email | H | M | Y | Synthetic voice / executive impersonation | `payment_diversion` |
| `E23` | DLP Alert HTML Attachment | Email | H | M |  | Security-tool impersonation / HTML smuggling | `malware_delivery` |
| `E24` | QR Code in Policy PDF | Email | H | M |  | QR phishing / credential theft | `qr_code_phishing` |
| `E25` | Payroll Direct-Deposit Redirect | Email | H | M | Y | HR/business email compromise / payroll fraud | `payment_diversion` |
| `S01` | Bank KYC Suspension | SMS | E | M |  | Smishing / bank impersonation | `financial_credential_phishing` |
| `S02` | Electricity Disconnect Tonight | SMS | E | M |  | Utility impersonation / callback scam | `tech_support_and_callback_fraud` |
| `S03` | Matching Debit Alert | SMS | E | L |  | Legitimate transaction alert | `legit_system_confirmation` |
| `S04` | Unpaid E-Challan Link | SMS | E | M |  | Government-service smishing | `financial_credential_phishing` |
| `S05` | Parcel Address Fee | SMS | E | M |  | Parcel smishing / payment phishing | `financial_credential_phishing` |
| `S06` | Service-Number Confirmation | SMS | E | M | Y | Military impersonation / identity collection | `identity_data_harvesting` |
| `S07` | Expected Recharge Confirmation | SMS | E | L |  | Legitimate service receipt | `legit_system_confirmation` |
| `S08` | Lottery Claim Text | SMS | E | M |  | Prize/advance-fee scam | `unsolicited_payment_lure` |
| `S09` | Wrong Number Becomes an Investment Pitch | SMS | M | M |  | Wrong-number grooming / investment fraud | `relationship_grooming_fraud` |
| `S10` | eSIM Upgrade OTP | SMS | M | M |  | SIM-swap / OTP theft | `account_takeover_authorisation_abuse` |
| `S11` | Expected Clinic Reminder | SMS | M | L |  | Legitimate appointment reminder | `legit_system_confirmation` |
| `S12` | Income-Tax Refund Form | SMS | M | M |  | Government impersonation / refund smishing | `financial_credential_phishing` |
| `S13` | Rating-Task Recruiter | SMS | M | M |  | Task/job scam | `investment_and_task_fraud` |
| `S14` | Emergency Recall Location Link | SMS | M | M | Y | Military smishing / location collection | `operational_elicitation` |
| `S15` | Canteen Subsidy MMS QR | SMS | M | M | Y | Military-themed QR smishing | `qr_code_phishing` |
| `S16` | Learner-Initiated Login Code | SMS | M | L |  | Legitimate OTP / security code | `legit_system_confirmation` |
| `S17` | New-Phone Family Emergency | SMS | M | M |  | Known-person impersonation / emergency payment | `impersonation_emergency_payment` |
| `S18` | Bank Header Thread Hijack | SMS | H | M |  | Sender-ID spoofing / callback phishing | `tech_support_and_callback_fraud` |
| `S19` | Network Survey Requests IMEI | SMS | H | M | Y | Military-targeted technical pretext / device profiling | `operational_elicitation` |
| `S20` | Parcel Text Plus Callback | SMS | H | M |  | Multi-stage parcel / callback / remote access scam | `tech_support_and_callback_fraud` |
| `S21` | Matching New-Login Alert | SMS | H | L |  | Legitimate security alert | `legit_system_confirmation` |
| `S22` | Synthetic Voice-Mail Link | SMS | H | M | Y | Voice phishing / link lure | `credential_phishing` |
| `S23` | UPI Refund Collect Request | SMS | H | M |  | Payment-request reversal scam | `financial_credential_phishing` |
| `S24` | Fake Cybercrime Case Fee | SMS | H | M |  | Government/I4C impersonation / digital arrest | `coercion_and_extortion` |
| `S25` | FASTag Update APK | SMS | H | M |  | Road-toll impersonation / malicious app | `malware_delivery` |
## 8. What happens next

This document is a **design record**. It is not implemented.

| Task | What it does with this taxonomy |
|---|---|
| `DATA-001` | Adds `family` (client, verbatim), `canonical_family` and `taxonomy_version` to the `ScenarioDefinition` schema. `canonical_family` is **server-only** — never sent to a learner, since it would reveal the attack type. |
| `DATA-002` | Materialises §7 as `backend/data/attack-family-taxonomy.v1.json` and validates that every imported scenario resolves to exactly one canonical family; an unmapped scenario fails the import. |
| `SELECT-002` | Applies `max 2 per canonical_family per attempt`, reading the data artifact — never a hardcoded switch. |
| `RESULT-001` | Reports the attack-family breakdown required by §7 using `canonical_family`, and drives `RESULT-004` remediation ("2–3 targeted practice scenarios from weak families"). |

**If the client later supplies their own taxonomy**, it replaces this one wholesale as
`taxonomy_version` 2.0.0. Because the client `family` string is preserved untouched and
every attempt records the version it was selected under, that substitution costs a
re-map and a re-import — no scenario content changes, and historical attempts stay
interpretable under the version they used.

---

**Content-preservation statement.** No scenario definition was created, altered, renamed,
re-levelled, re-scored or reworded in producing this taxonomy. All 100 client scenarios
remain exactly as supplied in the specification PDF. Every value in the *Client family*
column above is reproduced verbatim from the client's own `Attack / case family` field.
