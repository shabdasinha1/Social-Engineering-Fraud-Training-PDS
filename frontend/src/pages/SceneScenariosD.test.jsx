import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, configure, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CandidateProvider } from '@/context/CandidateProvider'
import { ROUTES } from '@/constants/routes'
import { SimulationPage } from '@/pages/SimulationPage'
import { createFakeServer, installFetch } from '@/test/attemptFixtures'
import { normalise } from '@/simulation/localForm'
import { FIELD_KIND, field } from '@/simulation/sceneModel'

/**
 * W16 to W20, end to end, through the real controller and the real attempt API
 * (IMMERSIVE-003D).
 *
 * Same posture as the W01-W15 suites: the fake server owns the stage, so the only way a
 * test can move a scenario forward is to make the server accept an intent. Each scenario is
 * checked for the interaction it was built around: a pinned plan and a reaction, a task site
 * whose balance the learner builds, a group's own record of what changed, the phone's
 * location screens, and a procurement portal.
 */

configure({ asyncUtilTimeout: 4000 })

const BANK = (() => {
  const path = resolve(process.cwd(), '../backend/data/synthetic/v1/synthetic.whatsapp.json')
  const parsed = JSON.parse(readFileSync(path, 'utf8'))
  const records = Array.isArray(parsed) ? parsed : (parsed.scenarios ?? [])
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

const sentIntents = () =>
  server.calls.filter((call) => call.method === 'POST').map((call) => call.intent)

const posts = () => server.calls.filter((call) => call.method === 'POST')

const openMenu = async (user) =>
  user.click(await screen.findByRole('button', { name: 'More options' }))

const click = async (user, name) => user.click(await screen.findByRole('button', { name }))

async function sendReply(user, label) {
  await click(user, label)
  await click(user, /^Send "/)
}

const surface = () => screen.findByTestId('scene-surface')

const leaveScreen = async (user, label) =>
  user.click(within(await surface()).getByRole('button', { name: label }))

const pageLink = async (user, label) =>
  user.click(within(await surface()).getByRole('button', { name: label }))

async function fill(user, values) {
  const inputs = within(await surface()).getAllByRole('textbox')
  for (const [index, value] of values.entries()) await user.type(inputs[index], value)
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

beforeEach(() => {
  server = null
})

/* ------------------------------------------------------------------ *
 * W16 - the genuine vehicle-pool change
 * ------------------------------------------------------------------ */

describe('W16 - the verified vehicle-pool change', () => {
  it('walks notification to resolution on the plan, a reaction and the Movement Board', async () => {
    const user = userEvent.setup()
    startAt('W16', 'open')

    await click(user, /Open the chat with Transport Coord/)
    await waitFor(() => expect(server.stage).toBe('inspect'))

    // The plan from three weeks ago is in the thread, and it is what today's message follows.
    await click(user, 'Open')
    await waitFor(() => expect(server.stage).toBe('branch'))
    expect(await screen.findByText(/Para 4\. Main Gate closure/)).toBeTruthy()
    await leaveScreen(user, 'Close')

    // The acknowledgement is a reaction on the message itself.
    const thread = await screen.findByTestId('wa-thread')
    await user.click(within(thread).getByRole('button', { name: 'React 👍 to acknowledge' }))
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /Check the Movement Board app/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    expect(await screen.findByText('Main Gate closed 05:00-12:00')).toBeTruthy()
    await leaveScreen(user, 'Leave Movement Board')

    await click(user, /Keep the acknowledgement and use Gate B at 07:15/)
    expect(sentIntents()).toEqual([
      'read', 'preview_file', 'safe_pivot', 'verify_known_app', 'resolve_continue',
    ])
  })

  it('jumps back to the pinned contingency note without recording anything', async () => {
    const user = userEvent.setup()
    startAt('W16', 'inspect')

    const pinned = await screen.findByTestId('wa-pinned')
    expect(within(pinned).getByText(/Alternate Gate B at the same time/)).toBeTruthy()
    await user.click(pinned)
    await waitFor(() => {
      const target = document.querySelector('[data-beat="w16-para4"]')
      expect(target.className).toMatch(/bg-channel-whatsapp/)
    })
    expect(sentIntents()).toEqual([])
  })

  it('sends the over-long acknowledgement only as an intent, and the coordinator asks for it back', async () => {
    const user = userEvent.setup()
    startAt('W16', 'branch')

    await sendReply(user, /names and route/)
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    expect(await screen.findByText(/Please delete that/)).toBeTruthy()
    // The names are scene text drawn as the consequence; they are never sent.
    expect(JSON.stringify(posts().map((call) => call.body))).not.toMatch(/Rao|Menon|ring road/)
  })

  it('finds the coordinator’s own number in the trusted directory', async () => {
    const user = userEvent.setup()
    startAt('W16', 'verify')
    await openMenu(user)
    await click(user, /Look up the MT Section in the trusted directory/)
    await waitFor(() => expect(sentIntents()).toEqual(['verify_trusted_directory']))
    const dialog = await screen.findByRole('dialog', { name: 'Trusted directory' })
    expect(within(dialog).getByText('Transport Coordinator, MT Section')).toBeTruthy()
    expect(within(dialog).getAllByText(BANK.W16.synthetic.sender.identifier).length).toBeGreaterThan(1)
  })
})

/* ------------------------------------------------------------------ *
 * W17 - the task site the learner builds a balance on
 * ------------------------------------------------------------------ */

describe('W17 - the part-time rating tasks', () => {
  it('shows the advert as forwarded many times, and the gift in the learner’s own bank', async () => {
    const user = userEvent.setup()
    startAt('W17', 'inspect')

    const thread = await screen.findByTestId('wa-thread')
    expect(within(thread).getByText('Forwarded many times')).toBeTruthy()

    await openMenu(user)
    await click(user, /Open the Falcon Bank app/)
    expect(await screen.findByText('Individual savings account')).toBeTruthy()
    expect(screen.getByText(/sunil\.k4471@trainingpay/)).toBeTruthy()
    expect(sentIntents()).toEqual([])
  })

  it('lets three tasks be done locally, then reaches the recharge and never sends the PIN', async () => {
    const user = userEvent.setup()
    startAt('W17', 'branch')

    await click(user, 'Open')
    expect(await screen.findByText('Welcome bonus credited')).toBeTruthy()
    await pageLink(user, 'Start task 1')
    for (let n = 0; n < 3; n += 1) {
      // eslint-disable-next-line no-await-in-loop
      await pageLink(user, 'Submit ★★★★★ rating')
    }
    expect(await screen.findByText('Level 1 complete 🎉')).toBeTruthy()
    expect(screen.getByText('INR 1,250.00')).toBeTruthy()
    await pageLink(user, 'Open my premium order')
    expect(await screen.findByText('- INR 4,860.00')).toBeTruthy()
    expect(sentIntents()).toEqual([])

    await pageLink(user, 'Recharge INR 5,000')
    expect(await screen.findByText('RK ENTERPRISES')).toBeTruthy()
    const pin = (await screen.findAllByRole('textbox')).at(-1)
    await user.type(pin, '909090')
    await click(user, 'Recharge INR 5,000')
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_payment']))
    expect(JSON.stringify(posts().map((call) => call.body))).not.toContain('909090')
    // The far side of the recorded payment: the balance is frozen and there is a new charge.
    expect(await screen.findByText(/Pay the 12% unfreezing charge/)).toBeTruthy()
  }, 20_000)

  it('records linking a bank account as the decision, and sends none of it', async () => {
    const user = userEvent.setup()
    startAt('W17', 'branch')

    await click(user, 'Open')
    await pageLink(user, 'Withdraw')
    await fill(user, ['Asha Rao', '123456789012', 'ABCD0123456'])
    await click(user, 'Continue')
    await click(user, 'Link account')
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    expect(await screen.findByText('Account linked.')).toBeTruthy()
    const sent = JSON.stringify(posts().map((call) => call.body))
    for (const value of ['Asha Rao', '123456789012', 'ABCD0123456']) expect(sent).not.toContain(value)
  })

  it('checks the employer in the vacancy app the learner already has', async () => {
    const user = userEvent.setup()
    startAt('W17', 'verify')
    await openMenu(user)
    await click(user, /Look up BrightReach Digital on the JobsBoard app/)
    await waitFor(() => expect(sentIntents()).toEqual(['verify_known_app']))
    expect(await screen.findByText('None listed')).toBeTruthy()
    expect(screen.getByText('No employer listed under this name')).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ *
 * W18 - the group's own record of what changed
 * ------------------------------------------------------------------ */

describe('W18 - the hijacked group admin', () => {
  it('shows the security-code change, the deleted warning and the reactions in the thread', async () => {
    startAt('W18', 'inspect')
    const thread = await screen.findByTestId('wa-thread')
    expect(within(thread).getByText(/security code changed/)).toBeTruthy()
    expect(within(thread).getByText('This message was deleted by admin Admin')).toBeTruthy()
    expect(within(thread).getAllByTestId('message-reactions').length).toBeGreaterThan(1)
    expect(within(thread).getByText('31')).toBeTruthy()
  })

  it('walks from group info to the admin’s card, recording only the inspection', async () => {
    const user = userEvent.setup()
    startAt('W18', 'inspect')

    await click(user, /open group info/)
    await waitFor(() => expect(sentIntents()).toEqual(['inspect_profile']))
    expect(await screen.findByText(/Today at 19:24, by Admin/)).toBeTruthy()
    await user.click(await screen.findByRole('tab', { name: /Participants/ }))
    await user.click(within(await surface()).getByRole('button', { name: /^Admin/ }))
    expect(await screen.findByText('Changed today at 19:21')).toBeTruthy()
    await user.click(await screen.findByRole('tab', { name: /Recent messages/ }))
    expect(screen.getAllByText(/- Coy Office/).length).toBeGreaterThanOrEqual(3)
    expect(sentIntents()).toEqual(['inspect_profile'])
  })

  it('fills the roster form locally and records only the submission', async () => {
    const user = userEvent.setup()
    startAt('W18', 'branch')

    await click(user, 'Open')
    expect(await screen.findByText('Confirm your roster entry')).toBeTruthy()
    await fill(user, ['15432871', 'Section commander', 'Old depot lines'])
    // Free-text fields accept up to their `max`, not just their minimum length.
    const inputs = within(await surface()).getAllByRole('textbox')
    expect(inputs.map((input) => input.value)).toEqual(['15432871', 'Section commander', 'Old depot lines'])
    await click(user, 'Continue')
    expect(sentIntents()).toEqual([])
    await click(user, 'Submit entry')
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    expect(await screen.findByText('Entry received.')).toBeTruthy()
    const sent = JSON.stringify(posts().map((call) => call.body))
    for (const value of ['15432871', 'Section commander', 'Old depot lines']) {
      expect(sent).not.toContain(value)
    }
  })

  it('leaves the form, then hears from the real Coy Office on the directory line', async () => {
    const user = userEvent.setup()
    startAt('W18', 'branch')

    await openMenu(user)
    await click(user, /Leave the form and check the roster myself/)
    await waitFor(() => expect(server.stage).toBe('verify'))
    await openMenu(user)
    await click(user, /Call the Coy Office desk from the directory/)
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot', 'verify_known_number']))
    const call = await surface()
    expect(await within(call).findByText('Coy Office, Hav. Suresh.')).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ *
 * W19 - the phone's own location screens
 * ------------------------------------------------------------------ */

describe('W19 - the commander clone', () => {
  it('opens the real CO’s chat from the list without recording anything', async () => {
    const user = userEvent.setup()
    startAt('W19', 'open')

    await click(user, 'Open Col. Vikram Sehgal (CO)')
    await user.click(await screen.findByRole('tab', { name: /Recent messages/ }))
    expect(await screen.findByText(/nothing on WhatsApp, including to me/)).toBeTruthy()
    expect(sentIntents()).toEqual([])
  })

  it('shows the copied About line, one letter different', async () => {
    const user = userEvent.setup()
    startAt('W19', 'inspect')
    await click(user, /open contact info/)
    await waitFor(() => expect(sentIntents()).toEqual(['inspect_sender']))
    expect(await screen.findByText(/Col\. Vikram Seghal · CO, Unit Falcon/)).toBeTruthy()
    expect(screen.getByText('3 days ago')).toBeTruthy()
  })

  it('walks attach, permission and share sheet, and records only the share', async () => {
    const user = userEvent.setup()
    startAt('W19', 'branch')

    await click(user, 'Attach')
    await click(user, /^Location/)
    expect(await screen.findByText('Allow WhatsApp to access this device’s location?')).toBeTruthy()
    await pageLink(user, 'While using the app')
    expect(await screen.findByText('Share live location')).toBeTruthy()
    expect(sentIntents()).toEqual([])

    await click(user, '1 hour')
    await waitFor(() => expect(sentIntents()).toEqual(['share_location']))
    await waitFor(() => expect(screen.queryByTestId('scene-surface')).toBeNull())
    expect(await screen.findByText(/Your live location is being shared/)).toBeTruthy()
  })

  it('keeps the location screens as contained as every other surface', async () => {
    /**
     * `SceneContainment.test.jsx` walks every surface a menu or a thread control opens; this
     * one is behind the paperclip's attach sheet, so it is walked here instead.
     */
    const user = userEvent.setup()
    const { container } = startAt('W19', 'branch')
    const contained = () => {
      expect(container.querySelectorAll('a[href], form, iframe, embed, object')).toHaveLength(0)
      expect(container.querySelectorAll('img, video, audio, source, [src]')).toHaveLength(0)
      expect(container.querySelectorAll('input, textarea, select')).toHaveLength(0)
    }
    await click(user, 'Attach')
    await click(user, /^Location/)
    await screen.findByText('Allow WhatsApp to access this device’s location?')
    contained()
    await pageLink(user, 'Only this time')
    await screen.findByText('Share live location')
    contained()
    expect(screen.getByText('Simulated location screen. No location is read, granted or sent.'))
      .toBeTruthy()
    // Walking the screens asked the platform for nothing.
    expect(sentIntents()).toEqual([])
  })

  it('treats the phone’s own "Don’t allow" as the decision', async () => {
    const user = userEvent.setup()
    startAt('W19', 'branch')
    await click(user, 'Attach')
    await click(user, /^Location/)
    await click(user, 'Don’t allow')
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
    await waitFor(() => expect(screen.queryByTestId('scene-surface')).toBeNull())
  })

  it('confirms through the duty office, not through the account asking', async () => {
    const user = userEvent.setup()
    startAt('W19', 'verify')
    await openMenu(user)
    await click(user, /Call the duty office on the directory number/)
    await waitFor(() => expect(sentIntents()).toEqual(['verify_known_number']))
    expect(await within(await surface()).findByText('Duty office, Capt. Arora.')).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ *
 * W20 - the procurement portal
 * ------------------------------------------------------------------ */

describe('W20 - the supplier bank-detail change', () => {
  it('carries the client’s full sentence where the bank stored a truncated one', async () => {
    startAt('W20', 'inspect')
    const thread = await screen.findByTestId('wa-thread')
    expect(within(thread).getByText(
      "Our bank is under audit. Use this new account for today's invoice.",
    )).toBeTruthy()
  })

  it('opens the revised invoice at inspect and shows the changed bank block', async () => {
    const user = userEvent.setup()
    startAt('W20', 'inspect')
    await click(user, 'Open')
    await waitFor(() => expect(sentIntents()).toEqual(['preview_file']))
    expect(await screen.findByText('NORTHSTAR SUPPLY SERVICES')).toBeTruthy()
    expect(screen.getByText('Coastal Small Finance Bank, account ending 9082')).toBeTruthy()
  })

  it('reads the vendor record, then holds the invoice in the portal', async () => {
    const user = userEvent.setup()
    startAt('W20', 'branch')

    await openMenu(user)
    await click(user, /Open the procurement portal/)
    expect(await screen.findByText(/Beneficiary on file: Northstar Supplies Pvt Ltd/)).toBeTruthy()
    await pageLink(user, 'Vendor record')
    expect(await screen.findByText(/calls back the contact on file/)).toBeTruthy()
    await pageLink(user, 'Back to INV-NS-2291')
    expect(sentIntents()).toEqual([])

    await click(user, 'Put invoice on hold')
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
    expect(await screen.findByText('On hold.')).toBeTruthy()
  })

  it('edits the beneficiary and releases the payment, sending none of the details', async () => {
    const user = userEvent.setup()
    startAt('W20', 'branch')

    await openMenu(user)
    await click(user, /Open the procurement portal/)
    await pageLink(user, 'Edit beneficiary')
    await fill(user, ['Northstar Supply Services', '908200417766', 'CSFB0000417'])
    await click(user, 'Continue')
    await click(user, /Override and release INR 4,86,300 now/)
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_payment']))
    expect(await screen.findByText('Now holds the new account')).toBeTruthy()
    const sent = JSON.stringify(posts().map((call) => call.body))
    for (const value of ['Northstar Supply Services', '908200417766', 'CSFB0000417']) {
      expect(sent).not.toContain(value)
    }
  })

  it('calls the contact already on file', async () => {
    const user = userEvent.setup()
    startAt('W20', 'verify')
    await openMenu(user)
    await click(user, /Call Rohit Kapoor on the number in the vendor record/)
    await waitFor(() => expect(sentIntents()).toEqual(['verify_known_number']))
    expect(await within(await surface()).findByText('Rohit Kapoor.')).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ *
 * The shared form fix this batch needed
 * ------------------------------------------------------------------ */

describe('a field accepts up to its max, and needs only its length', () => {
  it('caps free text and digits at `max`, and secrets at `length`', () => {
    const text = field({ name: 'n', label: 'Name', length: 3, max: 26 })
    const digits = field({ name: 'a', label: 'Account', kind: FIELD_KIND.DIGITS, length: 9, max: 18 })
    const pin = field({ name: 'p', label: 'PIN', kind: FIELD_KIND.SECRET, length: 6 })
    expect(normalise(text, 'Asha Rao Kulkarni')).toBe('Asha Rao Kulkarni')
    expect(normalise(text, 'x'.repeat(40))).toHaveLength(26)
    expect(normalise(digits, '1234 5678 9012 3')).toBe('1234567890123')
    expect(normalise(digits, '9'.repeat(30))).toHaveLength(18)
    expect(normalise(pin, '12345678')).toBe('123456')
  })
})

/* ------------------------------------------------------------------ *
 * What the device never does, across the batch
 * ------------------------------------------------------------------ */

describe('what the device never does on W16-W20', () => {
  const IDS = ['W16', 'W17', 'W18', 'W19', 'W20']

  it.each(IDS)('%s sends no stage, score, event code or deadline with any action', async (id) => {
    const user = userEvent.setup()
    startAt(id, 'inspect')

    await openMenu(user)
    const menu = await screen.findByTestId('wa-menu')
    const scored = within(menu).getAllByRole('button')
      .filter((button) => button.getAttribute('data-control') !== 'nav')
    await user.click(scored[0])
    await waitFor(() => expect(posts().length).toBeGreaterThan(0))

    for (const call of posts()) {
      for (const forbidden of [
        'stage', 'current_stage', 'next_stage', 'score', 'points', 'points_delta',
        'event_code', 'outcome_code', 'expires_at', 'time_limit_ms', 'evaluation',
        'intent', 'verify_source',
      ]) {
        expect(call.body).not.toHaveProperty(forbidden)
      }
      for (const key of Object.keys(call.body.metadata ?? {})) {
        expect([
          // SECURITY-001: the only metadata a client may send; the rest is server-written.
          'dwell_ms', 'open_latency_ms', 'link_hover_ms',
        ]).toContain(key)
      }
    }
  })

  it.each(IDS)('%s records nothing for local navigation between screens', async (id) => {
    const user = userEvent.setup()
    startAt(id, 'branch')

    await openMenu(user)
    const menu = await screen.findByTestId('wa-menu')
    const local = within(menu).getAllByRole('button')
      .filter((button) => button.getAttribute('data-control') === 'nav')
    expect(local.length).toBeGreaterThan(0)
    await user.click(local[0])
    expect(await surface()).toBeTruthy()
    expect(sentIntents()).toEqual([])
  })

  it.each(IDS)('%s rebuilds from the server after a remount, replaying nothing', async (id) => {
    const user = userEvent.setup()
    const { unmount } = startAt(id, 'branch')
    await screen.findByTestId('phone-app')

    await openMenu(user)
    const menu = await screen.findByTestId('wa-menu')
    const local = within(menu).getAllByRole('button')
      .filter((button) => button.getAttribute('data-control') === 'nav')
    await user.click(local[0])
    await surface()
    const before = posts().length

    unmount()
    installFetch(server)
    renderSimulation()
    await screen.findByTestId('phone-app')

    expect(server.stage).toBe('branch')
    expect(posts().length).toBe(before)
    expect(screen.queryByTestId('scene-surface')).toBeNull()
  })

  it.each(IDS)('%s puts no disposition, family or verdict word on the page', async (id) => {
    startAt(id, 'resolve')
    await screen.findByTestId('phone-app')
    const text = document.body.textContent.toLowerCase()
    expect(text).not.toMatch(/\b(malicious|legitimate|scam|phishing|fraudulent|fake)\b/)
  })
})
