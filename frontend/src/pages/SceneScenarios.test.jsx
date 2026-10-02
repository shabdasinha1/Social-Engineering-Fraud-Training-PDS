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
import {
  expectNeutralMarkup, expectNeutralRequests, expectNeutralStorage,
} from '@/test/neutrality'

/**
 * W01 to W05, end to end, through the real controller and the real attempt API
 * (IMMERSIVE-003A).
 *
 * The fake server owns the stage, so the only way a test can move a scenario forward is
 * to make the server accept an intent - which is the whole point. What these tests
 * establish is that the intent arrives from the DEVICE: from tapping a conversation, a
 * chat header, a poll option, a payment card, a link, or a menu item that reads like
 * something WhatsApp would offer.
 *
 * They also establish what is NOT sent. No request carries a stage, a score, an event
 * code or a deadline; walking into a browser page or a contact sheet sends nothing at
 * all; and a remount replays none of it.
 */

configure({ asyncUtilTimeout: 8000 })

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

/** Starts a run of one authored scenario, already inside the app at `stage`. */
function startAt(scenarioId, stage) {
  server = createFakeServer({ scenario: scenarioPayload(scenarioId) })
  server.stage = stage
  installFetch(server)
  return renderSimulation()
}

/** Every intent the client actually sent, in order. */
const sentIntents = () =>
  server.calls.filter((call) => call.method === 'POST').map((call) => call.intent)

const openMenu = async (user) =>
  user.click(await screen.findByRole('button', { name: 'More options' }))

const click = async (user, name) => user.click(await screen.findByRole('button', { name }))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

beforeEach(() => {
  server = null
})

describe('W01 - the accidental login code', () => {
  it('walks notification to resolution entirely from the phone', async () => {
    const user = userEvent.setup()
    server = createFakeServer({ scenario: scenarioPayload('W01') })
    installFetch(server)
    renderSimulation()

    // 1 Notify: the toast on the home screen is the way in.
    const tray = await screen.findByTestId('notification-tray')
    await user.click(within(tray).getByRole('button', { name: /^Open Unknown, in WhatsApp$/ }))

    // 2 Open: WhatsApp opens on the chat list, not inside the conversation.
    await screen.findByTestId('wa-chat-list')
    await click(user, /Open the chat with Unknown/)

    // 3 Inspect: the chat header is the control that opens contact info.
    await screen.findByTestId('wa-thread')
    await click(user, /open contact info/)
    const sheet = await screen.findByTestId('scene-surface')
    // The absence is behind a tab, so establishing it is something the learner did.
    await user.click(within(sheet).getByRole('tab', { name: /Groups in common/ }))
    expect(within(sheet).getByText(/not in any group with this number/)).toBeTruthy()
    await click(user, /Back from Contact info/)

    // 4 Branch: the conversation has moved on, and the safe route is a chat action.
    expect(await screen.findByText('348-201')).toBeTruthy()
    await openMenu(user)
    await click(user, /Do not reply, and open Account settings instead/)

    // 5 Verify: the learner's own account activity, reached from Settings.
    await openMenu(user)
    await click(user, /Settings > Account > Linked devices/)
    const settings = await screen.findByTestId('scene-surface')
    expect(within(settings).getByText(/registration code for your number was requested from another device/)).toBeTruthy()
    await click(user, /Back from Account/)

    // 6 Resolve: the app's own Report control.
    await click(user, 'Report and close the chat')

    await waitFor(() => expect(server.resolved).toBe(1))
    expect(sentIntents()).toEqual([
      'open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_report',
    ])
  }, 30_000)

  it('keeps the unsafe route selectable, as its own message in the composer', async () => {
    const user = userEvent.setup()
    startAt('W01', 'branch')

    // Choosing the reply puts it in the message field; Send is what submits it.
    await click(user, /Send the code/)
    expect(sentIntents()).toEqual([])
    await click(user, /^Send "348-201"$/)
    await waitFor(() => expect(sentIntents()).toContain('share_secret'))

    // The engine's consequence is what the conversation then shows.
    expect(await screen.findByText(/registered on a new device/)).toBeTruthy()
  }, 20_000)

  it('lists both account events logged at the same minute, without a key clash', async () => {
    const user = userEvent.setup()
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    startAt('W01', 'verify')

    await openMenu(user)
    await click(user, /Settings > Account > Linked devices/)
    const settings = await screen.findByTestId('scene-surface')

    expect(within(settings).getAllByText('Today, 11:32')).toHaveLength(2)
    expect(errors.mock.calls.flat().join(' ')).not.toMatch(/same key/)
    errors.mockRestore()
  }, 20_000)
})

describe('W02 - WhatsApp to the browser and back', () => {
  it('opens the link into a page the learner can move around in, then returns', async () => {
    const user = userEvent.setup()
    startAt('W02', 'branch')

    await click(user, 'Open the redelivery link')

    const page = await screen.findByTestId('scene-surface')
    expect(within(page).getByTestId('browser-address').textContent)
      .toContain('https://w02.training.example/verify')

    /**
     * The page still states what it asks for - but it is no longer fillable, because
     * opening the link WAS this stage's decision and the engine takes exactly one. A live
     * field with no control left to press would be a dead end, so the page reverts to
     * showing what it wants. `SceneForms.test.jsx` covers the other half: reaching the
     * same page with the branch decision still unspent, and filling it in.
     */
    expect(within(page).getByText('Card number')).toBeTruthy()
    expect(page.querySelectorAll('input')).toHaveLength(0)
    expect(within(page).queryByTestId('browser-primary')).toBeNull()

    // Walking to a second page of the same site sends nothing.
    const before = server.calls.filter((call) => call.method === 'POST').length
    await click(user, /Terms and refunds/)
    expect(await screen.findByText(/independent delivery agent/)).toBeTruthy()
    expect(server.calls.filter((call) => call.method === 'POST')).toHaveLength(before)

    await click(user, /Back to the previous page/)
    await click(user, /Close the browser and go back/)
    expect(await screen.findByTestId('wa-thread')).toBeTruthy()

    expect(sentIntents()).toEqual(['open_link'])
    expect(server.calls.at(-1).body.synthetic_target_id).toBe('W02-browser-01')
  }, 20_000)

  it('verifies in the courier the learner already uses, which is also the browser', async () => {
    const user = userEvent.setup()
    startAt('W02', 'verify')

    await openMenu(user)
    await click(user, /Open the courier site I already use/)

    const page = await screen.findByTestId('scene-surface')
    expect(within(page).getByText('No consignment found')).toBeTruthy()
    expect(within(page).getByTestId('browser-address').textContent)
      .toContain('https://quickparcel.training.example/track')

    const event = server.calls.filter((call) => call.method === 'POST').at(-1)
    expect(event.intent).toBe('verify_known_app')
    // SECURITY-001: the source is the server's to record; the device no longer sends it.
    expect(event.body.metadata?.verify_source).toBeUndefined()
  }, 20_000)

  it('records a rationale from the panel with the resolving intent', async () => {
    const user = userEvent.setup()
    startAt('W02', 'resolve')

    await user.type(await screen.findByLabelText(/Why did you choose this/), 'Checked the courier')
    await click(user, 'Report and close the chat')

    const resolve = server.calls.filter((call) => call.path.endsWith('/resolve')).at(-1)
    expect(resolve.intent).toBe('resolve_report')
    expect(resolve.body.rationale).toBe('Checked the courier')
  }, 20_000)
})

describe('W03 - the legitimate group', () => {
  it('lets the learner confirm the coordinator against the trusted directory', async () => {
    const user = userEvent.setup()
    startAt('W03', 'verify')

    await openMenu(user)
    await click(user, /Check the coordinator in the trusted directory/)

    const dialog = await screen.findByRole('dialog')
    const results = within(dialog).getByRole('list')
    expect(within(results).getByText(/Recreation Coord, Unit Falcon/)).toBeTruthy()
    // The same number the group was created from, so the comparison actually resolves.
    expect(within(results).getAllByText(BANK.W03.synthetic.sender.identifier).length)
      .toBeGreaterThan(0)
  }, 20_000)

  it('answers the poll in the app and keeps the group', async () => {
    const user = userEvent.setup()
    startAt('W03', 'branch')

    await click(user, 'Yes, I will attend')
    await waitFor(() => expect(server.stage).toBe('verify'))
    expect(sentIntents()).toEqual(['safe_pivot'])
  }, 20_000)

  it('offers leaving and over-sharing as real group actions, not as wrong answers', async () => {
    const user = userEvent.setup()
    startAt('W03', 'branch')

    await openMenu(user)
    const menu = await screen.findByTestId('wa-menu')
    expect(within(menu).getByRole('button', { name: /Exit the group without answering/ })).toBeTruthy()
    expect(within(menu).getByRole('button', { name: /Share my live location with the group/ })).toBeTruthy()
  }, 20_000)
})

describe('W04 - the friend on a new number', () => {
  it('surfaces the evidence through investigation rather than in a briefing', async () => {
    const user = userEvent.setup()
    startAt('W04', 'inspect')

    // Nothing on the conversation screen says the sender is not who they claim.
    expect(screen.queryByText(/impersonat/i)).toBeNull()

    await click(user, /open contact info/)
    await click(user, /Open Riya \(saved\)/)

    const saved = await screen.findByTestId('scene-surface')
    // Her actual voice, which is what the client's stage 3 asks to be compared.
    expect(within(saved).getByText(/that stove is so heavy/)).toBeTruthy()
    await user.click(within(saved).getByRole('tab', { name: /Groups in common/ }))
    expect(within(saved).getByText('Family')).toBeTruthy()
    expect(within(saved).getByText('Sunday Trek Group')).toBeTruthy()

    // One scored event for the inspection; walking to the saved contact added none.
    expect(sentIntents()).toEqual(['inspect_sender'])
  }, 20_000)

  it('confirms the impersonation on a call to the number already held', async () => {
    const user = userEvent.setup()
    startAt('W04', 'verify')

    await openMenu(user)
    await click(user, /Call Riya on \+91 00000 44712/)

    const captions = await screen.findByTestId('call-captions')
    await waitFor(
      () => expect(within(captions).getByText(/I was in the other room/i)).toBeTruthy(),
      { timeout: 5000 },
    )

    const event = server.calls.filter((call) => call.method === 'POST').at(-1)
    expect(event.intent).toBe('verify_known_number')
    // SECURITY-001: the source is the server's to record; the device no longer sends it.
    expect(event.body.metadata?.verify_source).toBeUndefined()
  }, 20_000)

  it('shows the payment request as a card in the chat, with its own control', async () => {
    const user = userEvent.setup()
    startAt('W04', 'branch')

    expect(await screen.findByText('INR 8,000.00')).toBeTruthy()
    expect(screen.getByText(/S KUMAR ENTERPRISE/)).toBeTruthy()

    // Opening the sheet is local navigation and records nothing.
    await click(user, /^Pay INR 8,000\.00$/)
    const sheet = await screen.findByTestId('scene-surface')
    expect(within(sheet).getByText('skumar.ent@trainingpay')).toBeTruthy()
    expect(sentIntents()).toEqual([])

    await user.click(within(sheet).getByLabelText('UPI PIN'))
    await user.keyboard('246813')
    await click(user, 'Confirm payment')

    await waitFor(() => expect(sentIntents()).toContain('attempt_payment'))
    expect(server.calls.at(-1).body.synthetic_target_id).toBe('W04-payment-01')
    // The PIN went nowhere: nothing the device sent contains it.
    expect(JSON.stringify(server.calls)).not.toContain('246813')
  }, 20_000)
})

describe('W05 - the KYC warning', () => {
  it('shows the business is unverified before the learner decides anything', async () => {
    const user = userEvent.setup()
    startAt('W05', 'inspect')

    await click(user, /open business info/)
    const sheet = await screen.findByTestId('scene-surface')
    expect(within(sheet).getByText('Business details')).toBeTruthy()
    expect(within(sheet).getAllByText('No').length).toBeGreaterThan(0)
  }, 20_000)

  it('runs the credential journey without ever collecting a credential', async () => {
    const user = userEvent.setup()
    const { container } = startAt('W05', 'open')

    // The premature route: opening the link from the preview lands on the branch stage
    // with the page already open, which is where its own controls become available.
    await click(user, 'Open the link from the preview')
    const page = await screen.findByTestId('scene-surface')
    expect(within(page).getByLabelText('Wallet PIN')).toBeTruthy()

    // The form is real, and filling it in records nothing.
    for (const [label, value] of [
      ['Account number', '505511220099'],
      ['Registered mobile', '9000011122'],
      ['Wallet PIN', '4417'],
      ['OTP just sent to you', '907214'],
      ['ID document number', 'XZ4471QQ'],
    ]) {
      await user.click(within(page).getByLabelText(label))
      await user.keyboard(value)
    }
    expect(sentIntents()).toEqual(['open_link'])

    await user.click(screen.getByTestId('browser-primary'))
    await click(user, /Submit and keep my wallet active/)
    await waitFor(() => expect(sentIntents()).toContain('submit_data'))

    // No credential left the device, and none is anywhere in the DOM the page keeps.
    const body = JSON.stringify(server.calls)
    for (const secret of ['505511220099', '4417', '907214', 'XZ4471QQ', '9000011122']) {
      expect(body).not.toContain(secret)
    }
    expect(container.querySelectorAll('form')).toHaveLength(0)
  }, 20_000)

  it('checks the wallet in the bank app, which says there is nothing pending', async () => {
    const user = userEvent.setup()
    startAt('W05', 'verify')

    await openMenu(user)
    await click(user, /Open the NationalPay app on this phone/)

    const app = await screen.findByTestId('scene-surface')
    expect(within(app).getByText('Complete - verified 2 years ago')).toBeTruthy()
    expect(within(app).getAllByText('None').length).toBeGreaterThan(0)
    // It is an application, not another web page: no address bar on it anywhere.
    expect(within(app).queryByTestId('browser-address')).toBeNull()
  }, 20_000)
})

describe('what the device never does', () => {
  it('sends no stage, score, event code or deadline with any action', async () => {
    const user = userEvent.setup()
    startAt('W01', 'inspect')

    await click(user, /open contact info/)
    await waitFor(() => expect(server.stage).toBe('branch'))

    for (const call of server.calls.filter((item) => item.method === 'POST')) {
      for (const forbidden of [
        'score', 'points_delta', 'event_code', 'next_stage', 'current_stage',
        'expires_at', 'time_limit_ms', 'outcome_code',
      ]) {
        expect(call.body).not.toHaveProperty(forbidden)
      }
      // `expected_stage` is the one stage field it may send: it is a precondition.
      expect(call.body.expected_stage).toBeDefined()
    }
  }, 20_000)

  it('records nothing for local navigation between screens', async () => {
    const user = userEvent.setup()
    startAt('W03', 'inspect')

    await click(user, /open group info/)
    const after = server.calls.filter((call) => call.method === 'POST').length

    await click(user, /Back from Group info/)
    await click(user, 'Back to chats')

    expect(server.calls.filter((call) => call.method === 'POST')).toHaveLength(after)
  }, 20_000)

  it('rebuilds the scenario from the server after a remount, replaying nothing', async () => {
    const user = userEvent.setup()
    const first = startAt('W02', 'inspect')

    await click(user, /open business info/)
    await waitFor(() => expect(server.stage).toBe('branch'))
    const posted = server.calls.filter((call) => call.method === 'POST').length

    first.unmount()
    cleanup()
    renderSimulation()

    // The stage the engine committed, the conversation it implies, and no new events.
    expect(await screen.findByText(/Parcels unpaid after today/)).toBeTruthy()
    expect(server.calls.filter((call) => call.method === 'POST')).toHaveLength(posted)
    expect(screen.queryByTestId('scene-surface')).toBeNull()
  }, 20_000)

  it('offers no further in-phone action once the scenario is recorded', async () => {
    const user = userEvent.setup()
    startAt('W01', 'resolve')

    // Before resolution the reply chips are live.
    const keep = await screen.findByRole('button', { name: 'Keep the chat, no further action' })
    expect(keep.disabled).toBe(false)

    await click(user, 'Report and close the chat')
    await waitFor(() => expect(server.resolved).toBe(1))

    // After it, the remaining chip is disabled, and pressing it sends and reports nothing.
    const after = screen.getByRole('button', { name: 'Keep the chat, no further action' })
    await waitFor(() => expect(after.disabled).toBe(true))
    const posted = server.calls.filter((call) => call.method === 'POST').length
    await user.click(after)
    expect(server.calls.filter((call) => call.method === 'POST')).toHaveLength(posted)
    expect(screen.queryByText('That action was not accepted')).toBeNull()
  }, 20_000)
})

/* ------------------------------------------------------------------ *
 * SECURITY-001 - what developer tools can see on a WhatsApp scene
 * ------------------------------------------------------------------ */

describe('SECURITY-001 - W01 exposes no evaluation vocabulary', () => {
  it('walks the safe route with neutral markup, opaque codes on the wire and nothing stored', async () => {
    const user = userEvent.setup()
    server = createFakeServer({ scenario: scenarioPayload('W01') })
    installFetch(server)
    renderSimulation()
    const snaps = []
    const snap = () => snaps.push(document.body.innerHTML)

    const tray = await screen.findByTestId('notification-tray')
    snap()
    await user.click(within(tray).getByRole('button', { name: /^Open Unknown, in WhatsApp$/ }))
    await screen.findByTestId('wa-chat-list')
    snap()
    await click(user, /Open the chat with Unknown/)
    await screen.findByTestId('wa-thread')
    snap()
    await click(user, /open contact info/)
    await screen.findByTestId('scene-surface')
    snap()
    await click(user, /Back from Contact info/)
    expect(await screen.findByText('348-201')).toBeTruthy()
    await openMenu(user)
    snap()
    await click(user, /Do not reply, and open Account settings instead/)
    await openMenu(user)
    snap()
    await click(user, /Settings > Account > Linked devices/)
    await screen.findByTestId('scene-surface')
    snap()
    await click(user, /Back from Account/)
    snap()
    await click(user, 'Report and close the chat')
    await waitFor(() => expect(server.resolved).toBe(1))
    snap()

    // The server, and only the server, turned those codes into the safe route.
    expect(sentIntents()).toEqual([
      'open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_report',
    ])
    snaps.forEach((html, index) => expectNeutralMarkup(html, `W01 snapshot ${index}`))
    expectNeutralRequests(server.calls)
    expectNeutralStorage()

    // Each request carried the code issued for that control on this run, and no other.
    const issued = server.actionCodes()
    const posts = server.calls.filter((call) => call.method === 'POST')
    for (const call of posts) expect(call.body.action_code).toBe(issued[call.controlId])
    expect(new Set(posts.map((call) => call.body.action_code)).size).toBe(posts.length)
  }, 30_000)

  it('walks an unsafe route the same way, and the server still scores what was chosen', async () => {
    const user = userEvent.setup()
    startAt('W01', 'branch')

    await click(user, /Send the code/)
    await click(user, /^Send "348-201"$/)
    await waitFor(() => expect(server.stage).toBe('verify'))
    await openMenu(user)
    const menu = await screen.findByTestId('wa-menu')
    expectNeutralMarkup(menu.outerHTML, 'verify menu')
    await user.click(within(menu).getByRole('button', { name: 'Report' }))
    await waitFor(() => expect(server.stage).toBe('resolve'))
    expectNeutralMarkup(document.body.innerHTML, 'resolve banner')
    await click(user, 'Keep the chat, no further action')
    await waitFor(() => expect(server.resolved).toBe(1))

    expect(sentIntents()).toEqual(['share_secret', 'report', 'resolve_retain'])
    expectNeutralRequests(server.calls)
    expectNeutralStorage()
  }, 30_000)

  it('names a control only through the code issued for it, and a missing code sends nothing', async () => {
    const user = userEvent.setup()
    startAt('W01', 'branch')
    await screen.findByTestId('wa-thread')

    // A run whose codes were never issued for this control: nothing reaches the server.
    const original = server.actionCodes
    server.actionCodes = () => {
      const codes = original()
      delete codes['w01-c08']
      return codes
    }
    cleanup()
    renderSimulation()
    await openMenu(user)
    await click(user, /Do not reply, and open Account settings instead/)
    expect(await screen.findByText(/That action was not accepted/)).toBeTruthy()
    expect(sentIntents()).toEqual([])
    expect(server.stage).toBe('branch')
  }, 20_000)
})
