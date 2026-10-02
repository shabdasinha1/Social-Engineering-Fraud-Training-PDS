import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, configure, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CandidateProvider } from '@/context/CandidateProvider'
import { ROUTES } from '@/constants/routes'
import { SimulationPage } from '@/pages/SimulationPage'
import { createFakeServer, installFetch } from '@/test/attemptFixtures'
import { FORBIDDEN_TOKENS } from '@/test/actionMap'

/**
 * SMS S01 to S05, end to end, through the real controller and the attempt API
 * (IMMERSIVE-010) - the first SMS batch.
 *
 * Same posture as the WhatsApp, Instagram and Email suites: the fake server owns the stage, so a
 * test advances a scenario only by making the server accept a control. What is new here is the
 * app. These tests are written against the phone's own Messages app rather than the messenger:
 * category tabs, a header that is only a number, the spam bar an unsaved sender gets, a link card
 * that shows an address exactly as written, a conversation-details screen with the registered
 * sender ID on it, and a composer with no free text in it.
 */

configure({ asyncUtilTimeout: 4000 })

const BANK = (() => {
  const path = resolve(process.cwd(), '../backend/data/synthetic/v1/synthetic.sms.json')
  const records = JSON.parse(readFileSync(path, 'utf8'))
  return Object.fromEntries(records.map((record) => [record.scenario_id, record]))
})()

function scenarioPayload(scenarioId) {
  const record = BANK[scenarioId]
  return {
    id: `def-${scenarioId}`,
    scenario_id: record.scenario_id,
    version: record.definition_version,
    platform: record.platform,
    synthetic: record.synthetic,
    stages: [],
  }
}

function renderSimulation() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.ASSESSMENT]}>
      <CandidateProvider>
        <Routes>
          <Route path={ROUTES.ASSESSMENT} element={<SimulationPage />} />
          <Route path={ROUTES.DASHBOARD} element={<p>Dashboard</p>} />
        </Routes>
      </CandidateProvider>
    </MemoryRouter>,
  )
}

let server

function startAt(scenarioId, stage) {
  server = createFakeServer({ scenario: scenarioPayload(scenarioId) })
  server.stage = stage
  installFetch(server)
  return renderSimulation()
}

const IDS = ['S01', 'S02', 'S03', 'S04', 'S05']
const posts = () => server.calls.filter((call) => call.method === 'POST')
const sentIntents = () => posts().map((call) => call.intent)
const openMenu = async (user) => user.click(await screen.findByRole('button', { name: 'More options' }))
const clickName = async (user, name) => user.click(await screen.findByRole('button', { name }))
const surface = () => screen.findByTestId('scene-surface')
const leaveSurface = async (user) => {
  const sheet = await surface()
  await user.click(within(sheet).getAllByRole('button')[0])
  await waitFor(() => expect(screen.queryByTestId('scene-surface')).toBeNull())
}

afterEach(() => {
  cleanup()
  server = undefined
})

const OPEN_ROW = {
  S01: 'Open the message',
  S02: 'Open the message',
  S03: 'Open the alert',
  S04: 'Open the notice',
  S05: 'Open the message',
}

describe('the Messages app renders for every S01-S05 scene', () => {
  it.each(IDS)('%s opens on the message list with the phone’s own categories', async (id) => {
    startAt(id, 'open')
    expect(await screen.findByTestId('sms-list')).toBeTruthy()
    expect(await screen.findByRole('button', { name: OPEN_ROW[id] })).toBeTruthy()
    // Personal / Transactions / Spam, not a messenger's Chats / Updates / Calls.
    const tabs = screen.getAllByRole('tab').map((tab) => tab.textContent)
    expect(tabs.some((label) => label.includes('Spam'))).toBe(true)
    expect(posts()).toHaveLength(0)
  })

  it.each(IDS)('%s draws a thread with no messenger chrome', async (id) => {
    startAt(id, 'branch')
    await screen.findByTestId('sms-thread')
    const html = document.body.innerHTML
    // No ticks, no "last seen", no reactions, no forwarding provenance, no avatars in bubbles.
    expect(html).not.toMatch(/last seen|Forwarded|online|typing/i)
    expect(screen.queryByTestId('voice-note')).toBeNull()
    cleanup()
  })
})

describe('S01 - the sender is the tell, all six stages', () => {
  it('walks notify to resolve and leaves the text for the banking app', async () => {
    const user = userEvent.setup()
    startAt('S01', 'notify')

    await clickName(user, /^Open \+91 00000 71088, in /)
    await clickName(user, OPEN_ROW.S01)
    await screen.findByTestId('sms-thread')
    // The app's own bar above an unsaved sender.
    expect(await screen.findByTestId('sms-spam-bar')).toBeTruthy()
    // Inspect: the details screen carries the registered-sender-ID row.
    await user.click(await screen.findByTestId('sms-header'))
    expect(await screen.findByText(/Registered sender ID/)).toBeTruthy()
    await leaveSurface(user)
    // Branch: leave it and open the banking app.
    await openMenu(user)
    await clickName(user, 'Leave it and open your banking app instead')
    expect(await screen.findByText('Active — no block')).toBeTruthy()
    await leaveSurface(user)
    // Verify: the same app, opened deliberately.
    await openMenu(user)
    await clickName(user, /Open your banking app and check the account/)
    await leaveSurface(user)
    // Resolve.
    await clickName(user, 'Report it as junk and leave the account alone')

    await waitFor(() => expect(sentIntents()).toEqual([
      'open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_report',
    ]))
    for (const call of posts()) {
      expect(call.body).not.toHaveProperty('intent')
      expect(String(call.body.action_code)).toMatch(/^ac_[0-9a-f]{20}$/)
    }
  }, 20000)

  it('shows the address as written, and where it goes only on the details screen', async () => {
    const user = userEvent.setup()
    startAt('S01', 'branch')
    await screen.findByTestId('sms-thread')

    // The link card carries the short form and not the destination.
    const card = await screen.findByTestId('sms-link-card')
    expect(within(card).getByText('bank-verify.training.example')).toBeTruthy()
    expect(card.textContent).not.toContain('s01.training.example')

    await openMenu(user)
    await clickName(user, 'Conversation details')
    await clickName(user, 'Where does this address go?')
    const details = await screen.findByTestId('sms-link-details')
    // The screen names the destination host in the "Goes to" row and again in the rows below it.
    expect(within(details).getAllByText(/s01\.training\.example/).length).toBeGreaterThanOrEqual(1)
    expect(details.textContent).toContain('Goes to')
    expect(posts()).toHaveLength(0)
    expect(server.stage).toBe('branch')
  })

  it('harvests nothing: the KYC values never reach the wire or storage', async () => {
    const user = userEvent.setup()
    startAt('S01', 'branch')
    await screen.findByTestId('sms-thread')

    await openMenu(user)
    await clickName(user, 'Open the address in the browser')
    const page = await surface()
    expect(within(page).getByTestId('browser-address').textContent).toContain('s01.training.example')

    const inputs = within(page).getAllByRole('textbox')
    expect(inputs.length).toBeGreaterThanOrEqual(2)
    await user.type(inputs[0], '441700229914')
    await user.type(inputs[1], '4417')
    await user.type(inputs[2], '882014')
    await clickName(user, 'Complete the re-verification')

    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    const body = JSON.stringify(posts()[0].body)
    for (const typed of ['441700229914', '4417', '882014']) expect(body).not.toContain(typed)
    expect(window.localStorage.length).toBe(0)
    expect(window.sessionStorage.length).toBe(0)
  }, 20000)
})

describe('S02 - no address at all, and the voice does the asking', () => {
  it('carries a number card and no link card', async () => {
    startAt('S02', 'branch')
    await screen.findByTestId('sms-thread')
    expect(await screen.findByTestId('sms-number-card')).toBeTruthy()
    expect(screen.queryByTestId('sms-link-card')).toBeNull()
  })

  it('tapping the number only raises the dialer; the call carries the decisions', async () => {
    const user = userEvent.setup()
    startAt('S02', 'branch')
    await screen.findByTestId('sms-thread')

    await clickName(user, /Call \+91 00000 12002/)
    const dialog = await surface()
    expect(within(dialog).getByText(/Call \+91 00000 12002\?/)).toBeTruthy()
    // Raising the dialog recorded nothing.
    expect(posts()).toHaveLength(0)

    await clickName(user, 'Call')
    expect(await screen.findByText('Power supply — disconnection desk')).toBeTruthy()
    // Connecting recorded nothing either: the decisions are what the operator then asks for.
    expect(posts()).toHaveLength(0)

    await clickName(user, 'End the call')
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
  }, 20000)

  it('installing what the desk sends is a release, and nothing is installed', async () => {
    const user = userEvent.setup()
    startAt('S02', 'branch')
    await screen.findByTestId('sms-thread')

    await openMenu(user)
    await clickName(user, 'Open the call already in progress')
    await clickName(user, 'Install the app the desk is sending')
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_install']))
    expect(document.body.innerHTML).not.toMatch(/<audio|<video|getUserMedia|navigator\.mediaDevices/)
  })
})

describe('S03 - the legitimate alert, and what blocking it would cost', () => {
  it('shows a year of the same thread and no link or number anywhere', async () => {
    startAt('S03', 'branch')
    const thread = await screen.findByTestId('sms-thread')
    // Day dividers and earlier alerts, in the thread itself.
    expect(within(thread).getByText('Earlier this month')).toBeTruthy()
    expect(within(thread).getByText('Today')).toBeTruthy()
    expect(screen.queryByTestId('sms-link-card')).toBeNull()
    expect(screen.queryByTestId('sms-number-card')).toBeNull()
    // No spam bar: this sender is a registered header.
    expect(screen.queryByTestId('sms-spam-bar')).toBeNull()
  })

  it('marks the matching transaction reviewed in the banking app', async () => {
    const user = userEvent.setup()
    startAt('S03', 'branch')
    await screen.findByTestId('sms-thread')

    await clickName(user, 'Open this transaction in your banking app')
    const app = await surface()
    expect(within(app).getByText('TRAINING MART')).toBeTruthy()
    expect(posts()).toHaveLength(0)

    await clickName(user, 'Mark the transaction reviewed')
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
  })

  it('says on the phone’s own settings screen what blocking a registered sender costs', async () => {
    const user = userEvent.setup()
    startAt('S03', 'branch')
    await screen.findByTestId('sms-thread')

    await openMenu(user)
    await clickName(user, 'Spam protection settings')
    expect(await screen.findByText(/Fraud alerts from it/)).toBeTruthy()
    expect(posts()).toHaveLength(0)
  })
})

describe('S04 - the registration that does not match', () => {
  it('puts both registrations on the details screen', async () => {
    const user = userEvent.setup()
    startAt('S04', 'inspect')
    await screen.findByTestId('sms-thread')

    await user.click(await screen.findByTestId('sms-header'))
    expect(await screen.findByText('TR 08 AB 4419')).toBeTruthy()
    expect(await screen.findByText('TR 08 AB 4419H')).toBeTruthy()
    await waitFor(() => expect(sentIntents()).toEqual(['inspect_sender']))
  })

  it('finds neither registration in the portal the learner opens', async () => {
    const user = userEvent.setup()
    startAt('S04', 'branch')
    await screen.findByTestId('sms-thread')

    await openMenu(user)
    await clickName(user, 'Leave it and check the transport portal yourself')
    const portal = await surface()
    expect(within(portal).getByText('No such registration on record')).toBeTruthy()
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
  })
})

describe('S05 - twenty rupees, and the mandate underneath it', () => {
  it('shows the number under the display name', async () => {
    const user = userEvent.setup()
    startAt('S05', 'inspect')
    await screen.findByTestId('sms-thread')

    await user.click(await screen.findByTestId('sms-header'))
    expect(await screen.findByText(/set by the sender/)).toBeTruthy()
    expect(await screen.findByText('+91 00000 98499')).toBeTruthy()
  })

  it('states the mandate limit on the sheet, and Cancel sits beside Approve', async () => {
    const user = userEvent.setup()
    startAt('S05', 'branch')
    await screen.findByTestId('sms-thread')

    await openMenu(user)
    await clickName(user, 'Open the payment sheet')
    const sheet = await surface()
    expect(within(sheet).getByText('Up to INR 20,000 per month')).toBeTruthy()
    expect(within(sheet).getByText('Cancelled by you')).toBeTruthy()
    expect(posts()).toHaveLength(0)

    // The PIN gates both controls; neither is disabled by risk.
    await user.type(within(sheet).getByLabelText('UPI PIN'), '338104')
    await clickName(user, 'Cancel the mandate')
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
    expect(JSON.stringify(posts()[0].body)).not.toContain('338104')
  }, 20000)

  it('replays a lost response instead of scoring the open twice', async () => {
    const user = userEvent.setup()
    startAt('S05', 'open')

    server.dropNextResponse = true
    await clickName(user, OPEN_ROW.S05)
    expect(await screen.findByText(/Cannot reach the training server/)).toBeTruthy()
    await clickName(user, OPEN_ROW.S05)

    await screen.findByTestId('sms-thread')
    expect(server.sequence).toBe(1)
    const keys = posts().map((call) => call.body.intent_key)
    expect(keys).toHaveLength(2)
    expect(new Set(keys).size).toBe(1)
  })

  it('rebuilds at the verify stage after a remount, with no replay', async () => {
    startAt('S05', 'verify')
    await screen.findByTestId('sms-thread')
    const before = posts().length
    cleanup()
    renderSimulation()
    await screen.findByTestId('sms-thread')
    expect(posts()).toHaveLength(before)
  })
})

describe('no S01-S05 scene leaks what a control means', () => {
  it.each(IDS)('%s renders no engine vocabulary in the DOM at inspect or branch', async (id) => {
    for (const stage of ['inspect', 'branch']) {
      startAt(id, stage)
      await screen.findByTestId('sms-thread')
      const html = document.body.innerHTML
      for (const token of FORBIDDEN_TOKENS) {
        expect(html.includes(token), `${id} ${stage} DOM leaks ${token}`).toBe(false)
      }
      expect(html).not.toMatch(/data-intent|data-affordance|href=|<iframe|<form/)
      cleanup()
    }
  })

  it.each(IDS)('%s names every button for assistive technology', async (id) => {
    startAt(id, 'branch')
    await screen.findByTestId('sms-thread')
    for (const button of screen.getAllByRole('button')) {
      const name = (button.getAttribute('aria-label') || button.textContent || '').trim()
      expect(name.length, `${id} has an unnamed button`).toBeGreaterThan(0)
    }
  })
})
