# Structured Synthetic Content (DATA-003)

**Status:** IMPLEMENTED — 5 September 2026.
**Generator:** `backend/scripts/generateSyntheticContent.js` (`npm run generate:synthetic`)
**Data:** `backend/data/synthetic/v1/` · **Import:** `npm run import:definitions`
**Companions:** [`SCENARIO_DEFINITION_SCHEMA.md`](SCENARIO_DEFINITION_SCHEMA.md) · [`SCENARIO_IMPORT.md`](SCENARIO_IMPORT.md) · [`SCENARIO_ENGINE.md`](SCENARIO_ENGINE.md) · [`ATTEMPT_API.md`](ATTEMPT_API.md)

---

## 1. What the client specification actually provides

This is the single most important fact about DATA-003, and it shaped every decision below.

Per scenario, the PDF supplies:

| Content | Coverage | Nature |
|---|---|---|
| Notification string, quoted at stage 1 | **100 / 100** | **Literal** |
| Sender label inside that string (`"Sender: message"`) | **61 / 100** | **Literal** |
| `Context presented:` narration at stage 2 | **100 / 100** | **Literal** (third-person description) |
| Literal file names | 4 in the whole bank | **Literal** |
| Reserved host `training.example` | 4 scenarios | **Literal** |
| `ui_to_build` component list | 100 / 100 | **Per-platform boilerplate** — only 4 distinct strings per stage, identical for all 25 scenarios on a platform. Contains no scenario-specific rendering data |

It does **not** supply: message dialogue, sender numbers or handles, timestamps, profile
fields, email subjects or addresses, link display URLs, QR payloads, call captions,
browser page copy, or trusted-directory entries.

**Consequence.** Roughly a fifth of what a renderer needs is literal client content; the
rest does not exist in the specification. Inventing it would be inventing scenario
meaning, which is forbidden. So everything the client does not state is a **deterministic
inert placeholder**, marked `source: "placeholder"` in the data itself, and listed in §9.

## 2. What the renderers need

Confirmed by reading the four existing renderers. They consume `blocks[]` using the legacy
`BLOCK_TYPES` vocabulary:

| Renderer | Block types handled |
|---|---|
| WhatsApp | `message`, `listItem`, `image`, `linkPreview`, `attachment`, `note` |
| SMS | `message`, `image`, `linkPreview`, `attachment`, `note` |
| Instagram | `message`, `post`, `profileHeader`, `image`, `emailBody`, `linkPreview`, `attachment`, `note` |
| Email | `emailHeader`, `emailBody`, `message`, `linkPreview`, `attachment`, `note` |

Plus a `header` of `{ title, subtitle, avatarSeed }`.

**Synthetic content therefore reuses that exact vocabulary**, so the existing renderers can
consume it without being redesigned — which is what this task asked for.

## 3. Architecture decision: embed

Synthetic content is **embedded** in `ScenarioDefinition.synthetic`, not stored in a
separate collection.

DATA-001 already defined `synthetic { sender, prior_context, assets[] }` and
`stages[].asset_refs[]` for exactly this purpose, so embedding needs no new collection, no
new database and no join.

It also solves version pinning and orphaning for free: `ScenarioRun` pins
`(scenario_id, definition_version)`, and a definition version is immutable, so an in-flight
run can never have its content changed or orphaned by a republish or deactivation. A
separate collection would have required its own version, its own index, and its own
orphan-prevention rule — all to reproduce a property embedding already has.

**Schema change: one line.** `'notification'` was added to `ASSET_KINDS`. Nothing else in
the schema changed, and no migration was needed (existing documents had empty assets).

## 4. Data files

```
backend/data/synthetic/v1/
├── synthetic.whatsapp.json     W01-W25
├── synthetic.instagram.json    I01-I25
├── synthetic.email.json        E01-E25
├── synthetic.sms.json          S01-S25
└── MANIFEST.json               fingerprints + provenance
```

Each entry:

```jsonc
{
  "scenario_id": "W01",
  "definition_version": 1,
  "platform": "whatsapp",
  "synthetic": { "sender": {...}, "prior_context": "...", "assets": [...] },
  "stage_asset_refs": [["W01-notif-01"], ["W01-thread-01","W01-sender-01"], ...]
}
```

**Synthetic content fingerprint (v1):** `2779b03939e13cf11e0bee44493609f0c91e228f201f22f8c025a080509afde1`

## 5. Asset model and deterministic IDs

`<SCENARIO_ID>-<kind>-<nn>` — e.g. `W01-notif-01`, `S25-file-01`. Namespaced by scenario,
so ids are globally unique and a reference can never resolve across scenarios.

| Kind | Count | Purpose |
|---|---|---|
| `notification` | 100 | Dashboard toast — **literal client text** |
| `sender_profile` | 100 | Display identity, avatar initials, platform fields |
| `message_thread` | 100 | The message surface, in renderer block vocabulary |
| `trusted_directory_entry` | 100 | Independent official contact |
| `browser_page` | 42 | Local `.example` page |
| `payment_screen` | 38 | Inert payment request |
| `file` | 12 | Inert attachment |
| `call_screen` | 8 | Synthetic caller + captions |
| `install_screen` | 6 | Permission prompt |
| `qr_payload` | 5 | Locally decoded target |

**511 assets across 100 scenarios.**

### How risky surfaces are chosen

From the scenario's **own branch-stage prose only** (`stages[3].learner_flow`).
`ui_to_build` is deliberately excluded: it is per-platform boilerplate that names every
primitive, so matching against it would give every scenario every asset and mean nothing.
The result is a genuine per-scenario spread — 42 browser pages, 5 QR payloads — rather
than 100 of each.

### Stage mapping

| Stage | Referenced assets |
|---|---|
| notify | notification |
| open | message_thread, sender_profile |
| inspect | sender_profile (+ file / browser_page where present) |
| branch | whichever risky surfaces the scenario's prose calls for |
| verify | trusted_directory_entry |
| resolve | — |

Content describes **what the learner sees**. It never decides whether an action is safe:
that stays with the engine (`ENGINE-001`).

## 6. Platform structures

**WhatsApp / SMS** — `note` (client narration) + `message` bubble carrying the literal
notification body, with `header { title, subtitle, avatarSeed }`.

**Email** — `emailHeader { fromName, fromAddress, to, subject, time }` + `note` +
`emailBody { paragraphs }`. Addresses are `<slug>@<sid>.training.example`.

**Instagram** — `note` + `message`, and the sender profile additionally carries
`username`, `followers`, `following`, `post_count`, `bio`.

> **Why the client narration is a `note`, not a message bubble.** `Context presented:` is
> third-person description ("An unknown number apologizes for entering the learner's
> number by mistake"), not dialogue. Rendering it as a bubble would put words in the
> sender's mouth that the client never wrote. The only genuine message text the
> specification provides is the notification body, and that is what the bubble carries.

## 7. Simulation primitives

| Primitive | Guarantees encoded in the data |
|---|---|
| Browser | `host` on `training.example`, `network: "blocked"` |
| File | `executes: false`, `macros_extracted: false`, `archive_mounted: false` |
| QR | `decoded_locally: true`, `camera: false`, `clipboard: false` |
| Call | `microphone: false`, `camera: false`, `real_dialer: false`, choices `decline / accept / end / verify / report` |
| Payment | `real_payment: false`, `stores_card_data: false` |
| Install | `installs: false`, `grants_real_permission: false` |

**Trusted directory** is never derived from the sender: every entry carries
`matches_message_sender: false` and a different identifier from the message contact, and a
test asserts both. Section 4 requires that message-supplied contact data can never
populate a trusted result.

## 8. Offline guarantees

Every target is a reserved training domain (`*.training.example`). No CDN, image host,
`data:` URI, or external URL appears anywhere — asserted by test against a list of common
hosts. All avatars are **initials**, not image files, so there is nothing to fetch. Every
phone-like string uses the bank's own non-routable `00000 …` convention.

## 9. Placeholders — the explicit limitation

These fields are **not** in the client specification and are deterministic inert
placeholders. Each is marked in the data (`source: "placeholder"`,
`identifier_source: "placeholder"`):

sender phone numbers, handles and email addresses · avatar initials · all timestamps ·
Instagram follower/following/post counts and bio · email subject (derived from the
notification body) and recipient address · browser page title, host and fields · QR decoded
target · call captions beyond the notification body · payment payee, amount and reference ·
install app name and permission list · trusted-directory name and number · generated file
names for the 8 scenarios where the client names no file.

**39 of 100 scenarios have no sender name in the specification.** Those use the synthetic
identifier as the display name — which is also how an unsaved contact genuinely appears —
rather than a fabricated one.

If richer per-scenario visual content is wanted, it is content the client would need to
supply; it cannot be derived from the current PDF without inventing meaning.

## 10. Import and idempotency

Synthetic content is a **second versioned input to the same importer**, so one command
produces a complete document:

```bash
npm run generate:synthetic            # regenerate from the client source
npm run generate:synthetic -- --check # verify the committed files are reproducible
npm run import:definitions            # import definitions + synthetic content
```

Absent synthetic files are not an error — the importer then behaves exactly as it did in
DATA-002, with empty assets.

**Idempotent:** re-running reports `unchanged 100` and writes nothing. The importer's
change detection compares **both** the client-content fingerprint and a synthetic digest;
comparing only the former would have reported every scenario as unchanged and silently
skipped the write, which is exactly what happened before it was fixed.

**The DATA-002 client fingerprint is unaffected** —
`8e7a6c98bf938dc863df507f5d778e30eca0c9d59d966f47d7e57551038a7687` — because it covers
client content only and excludes `synthetic`. Verified after every import.

**Reversible:** deleting `backend/data/synthetic/v1/` and re-importing restores the
DATA-002 state exactly.

## 11. Candidate-safe projection

`ScenarioDefinition.toCandidateJSON()` already allowlists `synthetic`, so synthetic content
reaches the learner through the existing boundary with no change to it.

Answer-bearing client text is **never** used as synthetic content. Three columns state the
answer and stay server-only:

- stage 3 `expected_safe_behavior` — *"Check this decision signal: …"*
- stage 5 `learner_flow` — *"Verification route: …"*
- stage 6 `learner_flow` — *"Final expected resolution: …"*

A test asserts, for all 100 scenarios, that none of these — nor the title, family, end
state or feedback — appears anywhere in the synthetic content.

Scoring metadata is likewise absent: no `points_delta`, no event codes, no
`canonical_family`, `canonical_triggers`, `disposition` or `military_flag`.

## 12. Validation

`backend/tests/syntheticContent.test.js` — **31 tests, no database**, run against the real
generated content through the production import path.

Coverage: 100-scenario and 25-per-platform counts · the four base assets on every scenario
· asset-id uniqueness within and across scenarios · every stage reference resolving ·
dangling references failing schema validation · reserved-domain-only targets · no CDN or
external host · every asset inert · no introduced military entity · no credential, secret
or payment instrument · non-routable numbers only · file/call/QR/install inertness flags ·
the trusted directory never echoing the sender · client content unchanged · six stages
unchanged · no scoring duplication · no answer-bearing text · candidate projection carrying
content but no classification · verbatim notification and prior-context round-trip ·
placeholder marking · renderer block vocabulary · email headers and Instagram profile
fields · risky surfaces appearing only where the client's branch text calls for them.

## 13. Not in this task

The Assessment UI is **not** migrated. `frontend/src/services/attemptApi.js` (API-001)
already returns this content in `scenario.synthetic`; wiring it into `PhoneSimulator` and
the four renderers is the next task. No scoring, analytics, remediation, admin surface or
Electron work was done here.
