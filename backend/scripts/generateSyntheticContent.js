/**
 * Generates the structured synthetic content for all 100 client scenarios (DATA-003).
 *
 *   npm run generate:synthetic            regenerate backend/data/synthetic/v1/
 *   npm run generate:synthetic -- --check  verify the committed files are reproducible
 *
 * Input : backend/data/scenarios/v1/   (the validated, fingerprinted DATA-002 source)
 * Output: backend/data/synthetic/v1/   (+ MANIFEST.json)
 *
 * Deterministic: the same source always produces byte-identical output, on any machine.
 * Regenerate rather than hand-editing the JSON.
 *
 * WHAT THE CLIENT SPECIFICATION ACTUALLY SUPPLIES, per scenario:
 *   - an exact notification string, quoted at stage 1            (100/100)
 *   - a "Context presented:" narration at stage 2                (100/100)
 *   - a sender label inside that notification, "Sender: message" ( 61/100)
 *   - four literal file names, and the host training.example
 * It does NOT supply message dialogue, sender numbers, profile fields, subjects,
 * timestamps, page copy, QR payloads, call captions or directory entries. Every one of
 * those is a deterministic inert placeholder, marked `source: "placeholder"`.
 *
 * ANSWER-BEARING CLIENT TEXT IS NEVER USED. Stage 3 `expected_safe_behavior`
 * ("Check this decision signal: ..."), stage 5 ("Verification route: ...") and stage 6
 * ("Final expected resolution: ...") each state the answer and stay server-only.
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DATA_DIR = path.resolve(fileURLToPath(new URL('../data', import.meta.url)))
const SRC = path.join(DATA_DIR, 'scenarios', 'v1')
const OUT = path.join(DATA_DIR, 'synthetic', 'v1')

const FILES = {
  whatsapp: 'scenarios.whatsapp.json',
  instagram: 'scenarios.instagram.json',
  email: 'scenarios.email.json',
  sms: 'scenarios.sms.json',
}
const RESERVED_HOST = 'training.example'

const NOTIF = /Dashboard notification:\s*'([\s\S]+?)'/
/**
 * The colon must be followed by whitespace, and the label must not end in a digit.
 * Without both guards a time inside the message ("disconnect 21:30", "at 14:22") is
 * mistaken for a sender prefix and the client's own text is split - which corrupted
 * S02 and S21 before a fidelity test caught it.
 */
const SENDER_SPLIT = /^([A-Z][^:]{1,40}?):\s+([\s\S]+)$/
const CONTEXT = /Context presented:\s*([\s\S]+)$/

/**
 * Risky-surface keywords, matched against the BRANCH stage's scenario-specific prose only.
 * `ui_to_build` is deliberately excluded: it is per-platform boilerplate naming every
 * primitive, so matching it would hand every scenario every asset.
 */
const SURFACE = {
  browser_page: /\b(link|page|portal|site|sign-?in|login|form|dashboard|checkout|store)\b/i,
  file: /\b(file|attachment|APK|PDF|zip|archive|document|installer|spreadsheet|HTML|memo|voice note|audio)\b/i,
  qr_payload: /\bQR\b/i,
  call_screen: /\b(call|voice|caller)\b/i,
  payment_screen: /\b(payment|pay|UPI|card|deposit|transfer|fee|gift.?card|crypto|bond|bank)\b/i,
  install_screen: /\b(install|permission|device link|linked device|screen.?share|remote)\b/i,
}
const LITERAL_FILE = /\b[A-Za-z][\w-]{2,}\.(?:apk|xlsm|zip|pdf|html|docx)\b/

const ABBREV = {
  notification: 'notif', sender_profile: 'sender', message_thread: 'thread',
  trusted_directory_entry: 'dir', browser_page: 'browser', file: 'file',
  qr_payload: 'qr', call_screen: 'call', payment_screen: 'payment', install_screen: 'install',
}

const squash = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()

/** Deterministic integer from the scenario id - identical on every machine. */
const h = (sid, salt, mod) =>
  parseInt(createHash('sha256').update(`${sid}:${salt}`).digest('hex').slice(0, 8), 16) % mod

const slug = (t, limit = 18) => ((t ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '') || 'contact').slice(0, limit)

const initials = (name) => (String(name ?? '').split(/\s+/).filter((p) => p && /[a-z]/i.test(p[0]))
  .slice(0, 2).map((p) => p[0]).join('') || '?').toUpperCase()

const clock = (sid, salt) =>
  `${String(7 + h(sid, `${salt}hh`, 13)).padStart(2, '0')}:${String(h(sid, `${salt}mm`, 60)).padStart(2, '0')}`

const phone = (sid) => `+91 00000 ${h(sid, 'tel', 90000) + 10000}`

const asset = (sid, kind, rest) => ({ asset_id: `${sid}-${ABBREV[kind]}-01`, kind, inert: true, ...rest })

function build(record) {
  const sid = record.scenario_id
  const platform = record.platform.toLowerCase()
  const stages = record.stages

  // ---- literal client content -------------------------------------------------
  const nm = NOTIF.exec(stages[0].learner_flow)
  const notifRaw = squash(nm ? nm[1] : '')
  let sm = SENDER_SPLIT.exec(notifRaw)
  if (sm && /\d$/.test(sm[1].trimEnd())) sm = null
  const senderLabel = sm ? squash(sm[1]) : null
  const notifBody = squash(sm ? sm[2] : notifRaw)

  const cm = CONTEXT.exec(stages[1].learner_flow)
  const priorContext = squash(cm ? cm[1] : '')

  const branchProse = stages[3].learner_flow
  const literalFile = LITERAL_FILE.exec(stages.map((s) => s.learner_flow).join(' '))

  // ---- deterministic synthetic identity (placeholder where the client is silent) ----
  const handle = `@${slug(senderLabel ?? 'unknown_sender')}${h(sid, 'hnd', 900) + 100}`
  const address = `${slug(senderLabel ?? 'sender')}@${sid.toLowerCase()}.${RESERVED_HOST}`
  const identifier = { whatsapp: phone(sid), sms: phone(sid), instagram: handle, email: address }[platform]
  const displayName = senderLabel ?? identifier
  const named = senderLabel !== null

  const assets = []

  assets.push(asset(sid, 'notification', {
    label: `${platform} notification`,
    content: {
      sender: displayName, body: notifBody, platform,
      received_at: clock(sid, 'notif'), source: 'client_specification',
    },
  }))

  const profile = {
    display_name: displayName, identifier,
    avatar_initials: initials(displayName), avatar_kind: 'initials',
    name_source: named ? 'client_specification' : 'placeholder',
    identifier_source: 'placeholder',
    verified: false, first_seen: clock(sid, 'seen'),
  }
  if (platform === 'instagram') {
    Object.assign(profile, {
      username: handle,
      followers: String(h(sid, 'fol', 9000) + 100),
      following: String(h(sid, 'flw', 900) + 50),
      post_count: h(sid, 'posts', 200),
      bio: '',
    })
  }
  assets.push(asset(sid, 'sender_profile', { label: displayName, content: profile }))

  /**
   * Blocks use the EXISTING renderer vocabulary (BLOCK_TYPES), so the current platform
   * renderers can consume this without being redesigned. The client's narration is a
   * `note` because it is third-person description, not dialogue; the only genuine message
   * text the specification gives is the notification body.
   */
  const when = clock(sid, 'msg')
  const blocks = platform === 'email'
    ? [
      { type: 'emailHeader', fromName: displayName, fromAddress: address,
        to: `learner@unit.${RESERVED_HOST}`, subject: notifBody.slice(0, 78), time: when },
      { type: 'note', text: priorContext },
      { type: 'emailBody', paragraphs: [notifBody] },
    ]
    : [
      { type: 'note', text: priorContext },
      { type: 'message', from: 'them', text: notifBody, time: when },
    ]
  assets.push(asset(sid, 'message_thread', {
    label: `${displayName} thread`,
    content: {
      header: { title: displayName, subtitle: identifier, avatarSeed: initials(displayName) },
      blocks,
    },
  }))

  /**
   * An INDEPENDENT official contact. Deliberately not derived from the sender: section 4
   * forbids message-supplied contact data from populating a trusted result.
   */
  assets.push(asset(sid, 'trusted_directory_entry', {
    label: 'Local approved directory',
    content: {
      name: 'Unit Falcon Support Desk',
      identifier: `+91 00000 ${h(sid, 'dir', 90000) + 10000}`,
      provenance: 'local approved directory',
      matches_message_sender: false,
      source: 'placeholder',
    },
  }))

  const surfaces = Object.keys(SURFACE).filter((k) => SURFACE[k].test(branchProse))
  for (const kind of surfaces) {
    if (kind === 'browser_page') {
      assets.push(asset(sid, kind, {
        label: 'Offline safe browser',
        display_target: `https://${sid.toLowerCase()}.${RESERVED_HOST}/verify`,
        content: { title: 'Training simulation page', host: `${sid.toLowerCase()}.${RESERVED_HOST}`,
          body: branchProse, fields: [], source: 'placeholder', network: 'blocked' },
      }))
    } else if (kind === 'file') {
      const name = literalFile ? literalFile[0] : `${sid}_attachment.pdf`
      assets.push(asset(sid, kind, {
        label: name,
        content: { file_name: name, file_kind: name.split('.').pop().toLowerCase(),
          file_size: `${h(sid, 'sz', 900) + 40} KB`, preview: branchProse,
          executes: false, macros_extracted: false, archive_mounted: false,
          source: literalFile ? 'client_specification' : 'placeholder' },
      }))
    } else if (kind === 'qr_payload') {
      assets.push(asset(sid, kind, {
        label: 'QR code',
        display_target: `https://${sid.toLowerCase()}.${RESERVED_HOST}/qr`,
        content: { decoded_target: `https://${sid.toLowerCase()}.${RESERVED_HOST}/qr`,
          decoded_locally: true, camera: false, clipboard: false, source: 'placeholder' },
      }))
    } else if (kind === 'call_screen') {
      assets.push(asset(sid, kind, {
        label: 'Incoming call',
        content: { caller: displayName, number: identifier, captions: [notifBody],
          timer_seconds: 0, choices: ['decline', 'accept', 'end', 'verify', 'report'],
          microphone: false, camera: false, real_dialer: false, source: 'placeholder' },
      }))
    } else if (kind === 'payment_screen') {
      assets.push(asset(sid, kind, {
        label: 'Payment request',
        content: { payee: displayName, amount_label: 'INR 0.00', reference: `TRAIN-${sid}`,
          real_payment: false, stores_card_data: false, source: 'placeholder' },
      }))
    } else if (kind === 'install_screen') {
      assets.push(asset(sid, kind, {
        label: 'Install / permission request',
        content: { app_name: `${sid} Training Mock`,
          permissions: ['sms', 'accessibility', 'screen_capture'],
          installs: false, grants_real_permission: false, source: 'placeholder' },
      }))
    }
  }

  const byKind = Object.fromEntries(assets.map((a) => [a.kind, a.asset_id]))
  const stageRefs = [
    [byKind.notification],
    [byKind.message_thread, byKind.sender_profile],
    [byKind.sender_profile, ...['file', 'browser_page'].filter((k) => byKind[k]).map((k) => byKind[k])],
    surfaces.map((k) => byKind[k]),
    [byKind.trusted_directory_entry],
    [],
  ]

  return {
    scenario_id: sid,
    definition_version: 1,
    platform,
    synthetic: { sender: profile, prior_context: priorContext, assets },
    stage_asset_refs: stageRefs,
  }
}

/** Stable JSON: sorted keys, no whitespace, so a digest depends only on content. */
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

const sha = (v) => createHash('sha256').update(stable(v)).digest('hex')

async function main() {
  const check = process.argv.includes('--check')
  await mkdir(OUT, { recursive: true })

  const digests = {}
  const written = {}
  let total = 0

  for (const [platform, fname] of Object.entries(FILES)) {
    const records = JSON.parse(await readFile(path.join(SRC, fname), 'utf8'))
    const built = records.map(build)
    if (built.length !== 25) throw new Error(`${platform}: expected 25, got ${built.length}`)
    for (const b of built) digests[b.scenario_id] = sha(b)
    written[platform] = `synthetic.${platform}.json`
    total += built.length
    const body = `${JSON.stringify(built, null, 1)}\n`
    const target = path.join(OUT, written[platform])
    if (check) {
      const existing = await readFile(target, 'utf8')
      if (existing !== body) throw new Error(`${written[platform]} is not reproducible from source`)
    } else {
      await writeFile(target, body)
    }
    console.log(`${check ? 'verified' : 'wrote'} ${written[platform]}  (${built.length} scenarios)`)
  }

  const manifest = {
    dataset: 'synthetic-content',
    derived_from: 'backend/data/scenarios/v1 (DATA-002 validated source)',
    source_document: 'Interactive_Social_Engineering_Scenario_UI_Development_Specification.pdf',
    source_document_version: '1.0',
    content_version: 1,
    scenario_count: total,
    files: Object.values(written).sort(),
    content_sha256: sha(Object.keys(digests).sort().map((k) => digests[k])),
    scenario_content_sha256: Object.fromEntries(Object.keys(digests).sort().map((k) => [k, digests[k]])),
    note: ('Derived deterministically from the client source. Literal client text is '
      + 'preserved verbatim; every field the specification does not state is an inert '
      + 'placeholder marked source=placeholder. Regenerate, do not hand-edit.'),
  }
  const manifestBody = `${JSON.stringify(manifest, null, 1)}\n`
  const manifestPath = path.join(OUT, 'MANIFEST.json')
  if (check) {
    const existing = await readFile(manifestPath, 'utf8')
    if (existing !== manifestBody) throw new Error('MANIFEST.json is not reproducible from source')
    console.log('\nAll synthetic content files are reproducible from the client source.')
  } else {
    await writeFile(manifestPath, manifestBody)
  }
  console.log(`\nscenarios: ${total}`)
  console.log(`synthetic fingerprint: ${manifest.content_sha256}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
