/**
 * SECURITY-001 - scans the PRODUCTION bundle (`dist/`, after `npm run build`) for anything
 * that would let a learner read what a control means: canonical engine intents, scoring
 * event codes, verification sources, control ids tied to meaning, and the old data
 * attributes. Exits non-zero on a finding.
 *
 * The five resolve_* names are allowed ONLY inside the two outcome-label tables, which turn
 * the learner's own final act into words after the run is over; they map no control.
 *
 *   npm run build && npm run check:bundle
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DIST = join(process.cwd(), 'dist')
const files = []
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(js|html|css|map)$/.test(entry.name)) files.push(full)
  }
}
walk(DIST)

const FORBIDDEN = [
  'open_item', 'inspect_sender', 'inspect_profile', 'inspect_link', 'preview_file', 'inspect_qr',
  'read_thread', 'skip_inspection', 'safe_pivot', 'reject_ignore', 'open_link', 'open_file',
  'scan_qr', 'call_number', 'submit_data', 'attempt_payment', 'attempt_install',
  'approve_device_link', 'share_secret', 'share_location', 'verify_trusted_directory',
  'verify_known_app', 'verify_known_number', 'verify_in_message_contact', 'in_message_contact',
  'known_app', 'known_number', 'SAFE_PIVOT', 'CORRECT_USE', 'TRUSTED_VERIFY', 'RESOLVE_CORRECT',
  'VERIFY_THROUGH_MESSAGE', 'NEEDLESS_REJECT_IGNORE', 'RISKY_OPEN_REPLY',
  'SECRET_PAYMENT_INSTALL_DATA_RELEASE', 'FALSE_REPORT_BLOCK', 'REPORT_ONLY_WITHOUT_CHECK',
  'CONTRADICTORY_UNSAFE_FINAL', 'PREMATURE_REPLY', 'INSPECT_CONTEXT', 'UNSAFE_EXTERNAL_ACTION',
  'data-intent', 'data-affordance', 'branch-pivot', 'learner-actions',
]
const OUTCOME = /resolve_(report|block|continue|retain|ignore)/g
/**
 * The two tables are object literals that start with the five resolve_* keys (the result
 * page's also labels `resolve_expired`, a server outcome no control can produce).
 */
const OUTCOME_TABLE = /\{resolve_report:`[^`]*`,resolve_block:`[^`]*`,resolve_continue:`[^`]*`,resolve_retain:`[^`]*`,resolve_ignore:`[^`]*`[,}]/g

/**
 * Deployment check: nothing in the bundle may point the browser at a development machine
 * or reveal a server secret. A learner's browser resolves `localhost` to ITSELF, so an API
 * base URL baked in from `frontend/.env` (http://localhost:5000/api) breaks every client of
 * a networked server. React Router's own `new URL(path, "http://localhost")` base carries no
 * port and no path, so it does not match.
 */
const DEPLOYMENT = [
  [/https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+|\/api)/, 'development API URL (loopback host with a port or /api)'],
  [/mongodb(?:\+srv)?:\/\//, 'MongoDB connection string'],
  [/(?:ADMIN_)?SESSION_SECRET|LEARNER_ACTION_SECRET|MONGO_URI/, 'server environment variable name'],
]

const findings = []
for (const file of files) {
  const text = readFileSync(file, 'utf8')
  for (const [pattern, what] of DEPLOYMENT) {
    const hit = text.match(pattern)
    if (hit) findings.push(`${file}: ${what}: ${hit[0]}`)
  }
  for (const token of FORBIDDEN) {
    if (new RegExp(`(?<![A-Za-z0-9_])${token}(?![A-Za-z0-9_])`).test(text)) findings.push(`${file}: ${token}`)
  }
  const tables = text.match(OUTCOME_TABLE) ?? []
  const outside = (text.match(OUTCOME) ?? []).length - tables.length * 5
  if (tables.length > 2 || outside !== 0) {
    findings.push(`${file}: resolve_* outside the outcome-label tables (${outside}, ${tables.length} tables)`)
  }
}

if (!files.length) {
  console.error('dist/ is empty - run `npm run build` first')
  process.exit(2)
}
if (findings.length) {
  console.error(`SECURITY-001 bundle check FAILED\n${findings.join('\n')}`)
  process.exit(1)
}
console.log(`SECURITY-001 bundle check passed: ${files.length} files, no canonical vocabulary, no development URLs or server secrets.`)
