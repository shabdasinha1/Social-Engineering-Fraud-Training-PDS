import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { PhoneShell } from '@/components/simulation/PhoneShell'
import { actionsFor } from '@/constants/simulation'
import { GENERIC_ACTIONS } from '@/test/actionMap'

/**
 * The device shell, renderer selection and containment, checked against the **real**
 * DATA-003 content rather than a fixture.
 *
 * The generated files are read straight from `backend/data/synthetic/v1/`, so if a future
 * regeneration introduced an external host, a working link or an unrenderable block, this
 * suite fails rather than the learner finding out.
 */

const PLATFORMS = ['whatsapp', 'instagram', 'email', 'sms']

/**
 * Read from disk, not imported: `new URL(..., import.meta.url)` would make Vite treat
 * these as bundled assets, and they are backend data the frontend must never ship.
 */
function loadPlatform(platform) {
  const path = resolve(process.cwd(), `../backend/data/synthetic/v1/synthetic.${platform}.json`)
  const parsed = JSON.parse(readFileSync(path, 'utf8'))
  return Array.isArray(parsed) ? parsed : (parsed.scenarios ?? [])
}

const BANK = Object.fromEntries(PLATFORMS.map((platform) => [platform, loadPlatform(platform)]))

/** A scenario in the shape `/current-run` delivers it. */
function scenarioFrom(record) {
  return {
    scenario_id: record.scenario_id,
    version: record.definition_version,
    platform: record.platform,
    synthetic: record.synthetic,
    stages: [],
  }
}

afterEach(cleanup)

describe('the scenario bank the UI actually renders', () => {
  it('carries 25 scenarios for each of the four platforms', () => {
    for (const platform of PLATFORMS) {
      expect(BANK[platform]).toHaveLength(25)
    }
  })
})

describe('renderer selection', () => {
  it.each(PLATFORMS)('renders %s content in its own platform chrome', (platform) => {
    const record = BANK[platform][0]
    render(<PhoneShell scenario={scenarioFrom(record)} stage="open" />)

    const thread = record.synthetic.assets.find((asset) => asset.kind === 'message_thread')
    const label = {
      whatsapp: 'WhatsApp simulation',
      instagram: 'Instagram simulation',
      email: 'Email simulation',
      sms: 'SMS simulation',
    }[platform]

    expect(screen.getByLabelText(label)).toBeTruthy()

    // Every text block the scenario supplies reaches the screen.
    for (const block of thread.content.blocks) {
      if (typeof block.text === 'string' && block.text) {
        expect(screen.getAllByText(block.text).length).toBeGreaterThan(0)
      }
      if (block.type === 'emailHeader') {
        expect(screen.getAllByText(block.subject).length).toBeGreaterThan(0)
      }
    }
  })

  it('shows the home screen before the item is opened and the app after', () => {
    const record = BANK.whatsapp[0]
    const scenario = scenarioFrom(record)
    const notification = record.synthetic.assets.find((asset) => asset.kind === 'notification')

    const { unmount } = render(<PhoneShell scenario={scenario} stage="notify" />)
    expect(screen.getAllByText(notification.content.body).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Open WhatsApp/ })).toBeTruthy()
    expect(screen.queryByTestId('phone-app')).toBeNull()
    unmount()

    render(<PhoneShell scenario={scenario} stage="open" />)
    expect(screen.getByTestId('phone-app')).toBeTruthy()
    expect(screen.getByLabelText('WhatsApp simulation')).toBeTruthy()
  })

  it('falls back to the generic renderer for an unknown platform', () => {
    const scenario = { ...scenarioFrom(BANK.sms[0]), platform: 'telegram' }
    render(<PhoneShell scenario={scenario} stage="open" />)

    expect(screen.getByLabelText('Message simulation')).toBeTruthy()
  })

  it('draws the device chrome around every app', () => {
    render(<PhoneShell scenario={scenarioFrom(BANK.email[0])} stage="open" />)

    expect(screen.getByTestId('device-status-bar')).toBeTruthy()
    const screenEl = screen.getByTestId('device-screen')
    // The screen is the containment boundary: app content cannot escape it.
    expect(screenEl.className).toMatch(/overflow-hidden/)
    expect(screenEl.contains(screen.getByTestId('phone-app'))).toBe(true)
  })
})

describe('offline containment across the whole bank', () => {
  const EXTERNAL = /(^|\/\/|@)(?!.*\.example\b)[a-z0-9-]+\.(com|net|org|io|in|co|app|dev|cn|ru)\b/i

  it('renders no scenario with a working link, image or embedded frame', () => {
    for (const platform of PLATFORMS) {
      for (const record of BANK[platform]) {
        const { container, unmount } = render(
          <PhoneShell scenario={scenarioFrom(record)} stage="open" />,
        )

        expect(container.querySelectorAll('img, iframe, embed, object, video, audio, source'))
          .toHaveLength(0)
        expect(container.querySelectorAll('a[href], form, input, [onclick]')).toHaveLength(0)

        unmount()
      }
    }
  })

  it('names no host outside the reserved training domains', () => {
    for (const platform of PLATFORMS) {
      for (const record of BANK[platform]) {
        const serialised = JSON.stringify(record.synthetic)
        expect(serialised).not.toMatch(EXTERNAL)
        expect(serialised).not.toMatch(/data:image\//)
        expect(serialised).not.toMatch(/https?:\/\/(localhost|\d+\.\d+\.\d+\.\d+)/)
      }
    }
  })
})

describe('the controls each scenario offers', () => {
  it('derives branch controls from the scenario\'s own assets, never from a fixed list', () => {
    const withBrowser = BANK.whatsapp.find((record) =>
      record.synthetic.assets.some((asset) => asset.kind === 'browser_page'),
    )
    const withoutBrowser = BANK.whatsapp.find(
      (record) => !record.synthetic.assets.some((asset) => asset.kind === 'browser_page'),
    )

    const intentsFor = (record) =>
      actionsFor('branch', scenarioFrom(record)).map((action) => GENERIC_ACTIONS[action.id].intent)

    expect(intentsFor(withBrowser)).toContain('open_link')
    expect(intentsFor(withoutBrowser)).not.toContain('open_link')
  })

  it('offers the same three baseline decisions on every scenario', () => {
    for (const platform of PLATFORMS) {
      for (const record of BANK[platform]) {
        const intents = actionsFor('branch', scenarioFrom(record))
          .map((action) => GENERIC_ACTIONS[action.id].intent)
        expect(intents).toEqual(
          expect.arrayContaining(['safe_pivot', 'reply', 'share_secret']),
        )
      }
    }
  })

  /**
   * The engine accepts `reject_ignore` at the branch stage only on the twenty legitimate
   * scenarios. Offering it everywhere would let a learner read the disposition off
   * whether the button worked, so it is not offered at all. (SECURITY-001: the device holds
   * only neutral ids; what each submits is read here from the server's own map.)
   */
  it('never offers an action whose acceptance would reveal the disposition', () => {
    for (const platform of PLATFORMS) {
      for (const record of BANK[platform]) {
        const intents = actionsFor('branch', scenarioFrom(record))
          .map((action) => GENERIC_ACTIONS[action.id].intent)
        expect(intents).not.toContain('reject_ignore')
      }
    }
  })

  it('gives every scenario a trusted-directory entry that is not the sender', () => {
    for (const platform of PLATFORMS) {
      for (const record of BANK[platform]) {
        const entry = record.synthetic.assets.find(
          (asset) => asset.kind === 'trusted_directory_entry',
        )
        expect(entry).toBeTruthy()
        expect(entry.content.matches_message_sender).toBe(false)
        expect(entry.content.identifier).not.toBe(record.synthetic.sender.identifier)
      }
    }
  })
})
