/**
 * DEVELOPMENT ONLY.
 *
 * Writes data/scenarios.dev-pool.json - 40 scenarios (10 per channel, 7
 * malicious + 3 legitimate each) derived from the 8 hand-written samples.
 *
 * This exists because the question engine builds 10-question assessments and
 * cannot be exercised against an 8-scenario pool. The content is padding, not
 * training material: every entry is marked DEVELOPMENT SAMPLE and the whole
 * file is replaced by the client's scenario pack.
 *
 *   node scripts/generateDevPool.js
 *   npm run import:scenarios -- data/scenarios.dev-pool.json
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { CHANNELS, SCENARIOS_PER_CHANNEL } from '../src/constants/assessment.js'

const MALICIOUS_PER_CHANNEL = 7
const CODES = { whatsapp: 'WA', instagram: 'IG', sms: 'SMS', email: 'EM' }

/**
 * Channels with a hand-authored scenario file are skipped, so regenerating the
 * padding never overwrites real content. Instagram is authored in
 * data/scenarios.instagram.json (FE-009), SMS in
 * data/scenarios.sms.json (FE-010), Email in data/scenarios.email.json
 * (FE-011) and WhatsApp in data/scenarios.whatsapp.json (FE-017). Every
 * channel is now authored, so this script currently produces nothing - it is
 * kept until the full authored pool has been validated in use.
 */
const AUTHORED_CHANNELS = new Set(['instagram', 'sms', 'email', 'whatsapp'])

const THEMES = {
  malicious: [
    ['otp-misdirection', 'urgency', 'A request to share a one-time password'],
    ['lottery-prize', 'greed_reward', 'A prize claim that asks for a fee'],
    ['kyc-freeze', 'authority_fear', 'A threat to freeze the account today'],
    ['family-urgency', 'empathy_trust', 'A relative in distress on a new number'],
    ['parcel-customs', 'curiosity', 'A parcel held for a small customs fee'],
    ['honey-trap', 'romance_attraction', 'A friendly stranger who turns to money'],
    ['fake-support', 'routine_convenience', 'A support agent asking to verify details'],
  ],
  legitimate: [
    ['appointment-notice', 'An ordinary appointment confirmation'],
    ['team-message', 'A routine message from a known contact'],
    ['order-receipt', 'A receipt for something actually ordered'],
  ],
}

const samples = JSON.parse(
  await readFile(path.resolve(process.cwd(), 'data/scenarios.sample.json'), 'utf8'),
)

const templateFor = (channel, type) =>
  samples.find((entry) => entry.channel === channel && entry.type === type)

const pool = []

for (const channel of CHANNELS) {
  if (AUTHORED_CHANNELS.has(channel)) continue

  const legitimateCount = SCENARIOS_PER_CHANNEL - MALICIOUS_PER_CHANNEL

  for (let i = 0; i < SCENARIOS_PER_CHANNEL; i += 1) {
    const type = i < MALICIOUS_PER_CHANNEL ? 'malicious' : 'legitimate'
    const template = templateFor(channel, type)
    if (!template) throw new Error(`No ${type} sample for ${channel}`)

    const index = type === 'malicious' ? i : i - MALICIOUS_PER_CHANNEL
    const theme = THEMES[type][index % THEMES[type].length]
    const [themeKey, ...rest] = theme
    const evi = type === 'malicious' ? rest[0] : null
    const description = type === 'malicious' ? rest[1] : rest[0]

    const copy = JSON.parse(JSON.stringify(template))
    copy.scenarioCode = `${CODES[channel]}-${String(i + 1).padStart(2, '0')}`
    copy.instruction = `Development placeholder: ${description}.`
    copy.evaluation.fraudTheme = type === 'malicious' ? themeKey : null
    copy.evaluation.eviTags = evi ? [evi] : []
    copy.evaluation.authorNotes =
      'DEVELOPMENT SAMPLE - generated padding so the question engine can be tested. Replace with client content.'

    pool.push(copy)
  }

  const built = pool.filter((entry) => entry.channel === channel)
  if (built.filter((e) => e.type === 'legitimate').length !== legitimateCount) {
    throw new Error(`${channel}: legitimate count is wrong`)
  }
}

const target = path.resolve(process.cwd(), 'data/scenarios.dev-pool.json')
await writeFile(target, `${JSON.stringify(pool, null, 2)}\n`, 'utf8')

console.log(`Wrote ${pool.length} development scenarios to ${target}`)
console.log(`  skipped authored channels: ${[...AUTHORED_CHANNELS].join(', ')}`)
console.log(`  ${MALICIOUS_PER_CHANNEL} malicious + ${SCENARIOS_PER_CHANNEL - MALICIOUS_PER_CHANNEL} legitimate per channel`)
