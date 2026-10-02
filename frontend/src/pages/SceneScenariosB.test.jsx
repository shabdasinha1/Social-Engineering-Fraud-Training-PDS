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

/**
 * W06 to W10, end to end, through the real controller and the real attempt API
 * (IMMERSIVE-003B).
 *
 * Same posture as the W01-W05 suite: the fake server owns the stage, so the only way a
 * test can move a scenario forward is to make the server accept an intent. What is proven
 * here is that the intent arrives from the DEVICE - from an attachment tray, a decoded QR,
 * a document viewer, a shop till, a settings screen - and that walking between those
 * screens sends nothing at all.
 *
 * The five are checked for the thing each was built to be, rather than five times for the
 * same thing: the gallery, the expected document, the crowd, the refused call and the
 * linked device.
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

/** Choose an authored reply, then press the Send button that names it. */
async function sendReply(user, label) {
  await click(user, label)
  await click(user, /^Send "/)
}

/**
 * Leave a pushed screen by its own Back affordance.
 *
 * Each surface names it differently - "Close", "Cancel", "Leave Canteen Store",
 * "Back from Linked Devices" - which is deliberate, so the control says where it goes.
 */
const leaveScreen = async (user, label) =>
  user.click(within(await screen.findByTestId('scene-surface'))
    .getByRole('button', { name: label }))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

beforeEach(() => {
  server = null
})

/* ------------------------------------------------------------------ *
 * W06 - the attachment tray
 * ------------------------------------------------------------------ */

describe('W06 - the unit clerk ID request', () => {
  it('walks notification to resolution entirely from the phone', async () => {
    const user = userEvent.setup()
    startAt('W06', 'open')

    await click(user, /Open the chat from Unit Clerk/)
    await waitFor(() => expect(server.stage).toBe('inspect'))

    // The header is the control that opens the contact sheet, as it is in the app.
    await click(user, /open contact info/)
    await waitFor(() => expect(server.stage).toBe('branch'))
    expect(await screen.findByText('Groups in common')).toBeTruthy()

    await sendReply(user, /ID documents go through the orderly room/)
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /Call the support desk on the approved number/)
    await waitFor(() => expect(server.stage).toBe('resolve'))

    await click(user, /Report the number and close the chat/)
    await waitFor(() => expect(server.stage).toBe('resolve'))

    expect(sentIntents()).toEqual([
      'read', 'inspect_sender', 'safe_pivot', 'verify_known_number', 'resolve_report',
    ])
  })

  it('puts the unsafe act on the device gallery, under the staged document', async () => {
    const user = userEvent.setup()
    startAt('W06', 'branch')

    await openMenu(user)
    await click(user, /Attach a document/)

    // The gallery is a screen the learner walks into. Nothing has been recorded yet.
    const tray = await screen.findByTestId('scene-surface')
    expect(within(tray).getByRole('button', { name: /Service card - front/ })).toBeTruthy()
    expect(sentIntents()).toEqual([])

    // Choosing between documents is local too.
    await user.click(within(tray).getByRole('button', { name: /Service card - back/ }))
    expect(sentIntents()).toEqual([])
    expect(await screen.findByText(/Date of birth, blood group/)).toBeTruthy()

    // Only Send reaches the engine.
    await click(user, /Send the selected document/)
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
  })

  it('says nothing about which file was staged when the document is sent', async () => {
    const user = userEvent.setup()
    startAt('W06', 'branch')

    await openMenu(user)
    await click(user, /Attach a document/)
    const tray = await screen.findByTestId('scene-surface')
    await user.click(within(tray).getByRole('button', { name: /Service card - back/ }))
    await click(user, /Send the selected document/)
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))

    const body = JSON.stringify(posts().map((call) => call.body))
    for (const leak of ['IMG_2292', 'IMG_2291', 'card-back', 'Service card']) {
      expect(body).not.toContain(leak)
    }
  })

  it('shows the notice as a picture with nothing behind it', async () => {
    const user = userEvent.setup()
    startAt('W06', 'inspect')

    await click(user, /Open the notice/)
    await waitFor(() => expect(sentIntents()).toEqual(['preview_file']))
    expect(await screen.findByText('Reference number')).toBeTruthy()
    expect(screen.getByText('None printed')).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ *
 * W07 - the legitimate document
 * ------------------------------------------------------------------ */

describe('W07 - the expected family document', () => {
  it('shows the learner their own request above the file, before any decision', async () => {
    const user = userEvent.setup()
    startAt('W07', 'open')

    await click(user, /Open the chat with Asha/)
    await waitFor(() => expect(server.stage).toBe('inspect'))

    const thread = await screen.findByTestId('wa-thread')
    // Twice: the learner's own message, and the quote Asha replied against.
    expect(within(thread).getAllByText(/can you send me the invitation card/)).toHaveLength(2)
    expect(within(thread).getByText('Meera_wedding_invite.pdf')).toBeTruthy()
  })

  it('opens the invitation and keeps it, which is the correct answer here', async () => {
    const user = userEvent.setup()
    startAt('W07', 'inspect')

    await click(user, /Preview/)
    await waitFor(() => expect(server.stage).toBe('branch'))
    expect(await screen.findByText(/Community hall, near the station/)).toBeTruthy()

    await leaveScreen(user, 'Close')
    await click(user, /Keep it in the chat and note the date/)
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /Call Asha on the saved number/)
    await waitFor(() => expect(server.stage).toBe('resolve'))

    await click(user, /Keep the invitation and close the chat/)
    expect(sentIntents()).toEqual([
      'preview_file', 'safe_pivot', 'verify_known_number', 'resolve_retain',
    ])
  })

  it('offers the reader install as a real temptation, reached from the viewer', async () => {
    const user = userEvent.setup()
    startAt('W07', 'branch')

    await openMenu(user)
    await click(user, /Suggested app for PDF files/)
    expect(await screen.findByText(/Read and change all documents/)).toBeTruthy()
    expect(sentIntents()).toEqual([])

    await click(user, /Install PDF Reader Pro/)
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_install']))
  })

  it('keeps deleting and reporting available, without labelling either as wrong', async () => {
    const user = userEvent.setup()
    startAt('W07', 'branch')

    await openMenu(user)
    const menu = await screen.findByTestId('wa-menu')
    const remove = within(menu).getByRole('button', { name: /Delete the file without opening it/ })
    expect(remove.textContent).not.toMatch(/wrong|unsafe|do not|careful|danger/i)
    await user.click(remove)
    await waitFor(() => expect(sentIntents()).toEqual(['reject_ignore']))
  })
})

/* ------------------------------------------------------------------ *
 * W08 - the crowd
 * ------------------------------------------------------------------ */

describe('W08 - the festival voucher QR', () => {
  it('shows other people already reacting, which is the pressure', async () => {
    const user = userEvent.setup()
    startAt('W08', 'open')

    await click(user, /Open Building 4B Residents/)
    const thread = await screen.findByTestId('wa-thread')
    expect(within(thread).getByText(/Got mine!! 5000 credited/)).toBeTruthy()
    expect(within(thread).getByText(/Is this genuine\?/)).toBeTruthy()
    expect(within(thread).getByText('Forwarded many times')).toBeTruthy()
  })

  it('decodes the code without opening it, and names a host that is not the retailer', async () => {
    const user = userEvent.setup()
    startAt('W08', 'inspect')

    await click(user, /Decode without opening/)
    await waitFor(() => expect(sentIntents()).toEqual(['inspect_qr']))

    expect(await screen.findByText('w08.training.example')).toBeTruthy()
    expect(screen.getByText('sahyogmart.training.example')).toBeTruthy()
    expect(screen.getByText('Registered')).toBeTruthy()
  })

  it('lets the learner reach the claim form without spending the branch on scanning', async () => {
    const user = userEvent.setup()
    startAt('W08', 'branch')

    // Walking to the page the code points at is navigation, not a decision.
    await openMenu(user)
    await click(user, /Open the address the code points to/)
    expect(await screen.findByText(/Your voucher is reserved/)).toBeTruthy()
    expect(sentIntents()).toEqual([])

    // The page's own step control is gated on its fields, never on risk.
    const claim = await screen.findByTestId('browser-primary')
    expect(claim.disabled).toBe(true)

    const [card, holder, expiry, cvv] = await screen.findAllByRole('textbox')
    await user.type(card, '4111111111111111')
    await user.type(holder, 'A Kumar')
    await user.type(expiry, '1229')
    await user.type(cvv, '737')

    await waitFor(() => expect(screen.getByTestId('browser-primary').disabled).toBe(false))
    await user.click(screen.getByTestId('browser-primary'))
    expect(await screen.findByText(/One last step/)).toBeTruthy()
    // Filling a page in is not a decision. Nothing has reached the engine yet.
    expect(sentIntents()).toEqual([])

    await click(user, /Confirm and release my voucher/)
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
  })

  it('checks the retailer in their own app, which says there is no campaign', async () => {
    const user = userEvent.setup()
    startAt('W08', 'verify')

    await openMenu(user)
    await click(user, /Open the Sahyog Mart app from your app list/)
    await waitFor(() => expect(sentIntents()).toEqual(['verify_known_app']))
    expect(await screen.findByText('No festival voucher campaign')).toBeTruthy()
    expect(screen.getByText(/We are not running a INR 5,000 voucher offer/)).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ *
 * W09 - the refused call
 * ------------------------------------------------------------------ */

describe('W09 - the compromised colleague', () => {
  it('shows a contact sheet where every identity check comes back clean', async () => {
    const user = userEvent.setup()
    startAt('W09', 'inspect')

    await click(user, /open contact info/)
    await waitFor(() => expect(server.stage).toBe('branch'))

    expect(await screen.findByText('Saved in your contacts.')).toBeTruthy()
    expect(screen.getByText('2 years ago')).toBeTruthy()
    // ...and the one row that is not reassuring is stated without being interpreted.
    expect(screen.getByText('Changed today at 13:41')).toBeTruthy()
  })

  it('settles it on the call the message said could not happen', async () => {
    const user = userEvent.setup()
    startAt('W09', 'verify')

    await openMenu(user)
    await click(user, /Call Maj. Arin on the saved number/)
    await waitFor(() => expect(sentIntents()).toEqual(['verify_known_number']))

    // The call screen is the saved number, not one supplied by the message.
    const call = await screen.findByTestId('scene-surface')
    expect(within(call).getByText(/Maj\. Arin \(saved\)/)).toBeTruthy()
    expect(within(call).getByText(BANK.W09.synthetic.sender.identifier)).toBeTruthy()
    // ...and what he says arrives on the call's own clock.
    expect(await within(call).findByText(/Arin here/)).toBeTruthy()
  })

  it('puts the purchase behind a till the learner has to walk to', async () => {
    const user = userEvent.setup()
    startAt('W09', 'branch')

    await openMenu(user)
    await click(user, /Canteen Store - gift cards/)
    expect(await screen.findByText(/cannot be stopped, traced or returned/)).toBeTruthy()
    expect(sentIntents()).toEqual([])

    await leaveScreen(user, 'Leave Canteen Store')
    await openMenu(user)
    await click(user, /Go to the till/)
    expect(await screen.findByText('INR 8,000.00')).toBeTruthy()
    expect(sentIntents()).toEqual([])

    // The commit control only appears once the PIN is the right length.
    const pin = (await screen.findAllByRole('textbox')).at(-1)
    await user.type(pin, '123456')
    await click(user, /Pay INR 8,000/)
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_payment']))
  })

  it('never sends the PIN that authorised the payment', async () => {
    const user = userEvent.setup()
    startAt('W09', 'branch')

    await openMenu(user)
    await click(user, /Go to the till/)
    const pin = (await screen.findAllByRole('textbox')).at(-1)
    await user.type(pin, '482913')
    await click(user, /Pay INR 8,000/)
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_payment']))

    expect(JSON.stringify(posts().map((call) => call.body))).not.toContain('482913')
  })
})

/* ------------------------------------------------------------------ *
 * W10 - the linked device
 * ------------------------------------------------------------------ */

describe('W10 - the survey device-link QR', () => {
  it('decodes the code as a linking credential rather than a web address', async () => {
    const user = userEvent.setup()
    startAt('W10', 'inspect')

    await click(user, /Decode without scanning/)
    await waitFor(() => expect(sentIntents()).toEqual(['inspect_qr']))

    expect(await screen.findByText('WhatsApp device-linking credential')).toBeTruthy()
    expect(screen.getByText(/Signs this account in on another device/)).toBeTruthy()
    expect(screen.getByText(/Web address, voucher or survey form/)).toBeTruthy()
  })

  it('shows a pending device that predates the conversation', async () => {
    const user = userEvent.setup()
    startAt('W10', 'verify')

    await openMenu(user)
    await click(user, /Open Settings > Linked Devices yourself/)
    await waitFor(() => expect(sentIntents()).toEqual(['verify_known_app']))

    expect(await screen.findByText('Waiting for confirmation')).toBeTruthy()
    expect(screen.getByText(/Today at 13:39, 11 minutes before the message/)).toBeTruthy()
    expect(screen.getByText(/Approximately 1,900 km away/)).toBeTruthy()
  })

  it('puts the approval on the settings screen, where the evidence also is', async () => {
    const user = userEvent.setup()
    startAt('W10', 'branch')

    await openMenu(user)
    await click(user, /Settings > Linked Devices/)
    expect(await screen.findByText('Waiting for confirmation')).toBeTruthy()
    expect(sentIntents()).toEqual([])

    await click(user, /Confirm the waiting device/)
    await waitFor(() => expect(sentIntents()).toEqual(['approve_device_link']))
  })

  it('walks the safe path from the notification to a report', async () => {
    const user = userEvent.setup()
    startAt('W10', 'open')

    await click(user, /Open the chat from WhatsApp Survey Desk/)
    await waitFor(() => expect(server.stage).toBe('inspect'))
    await click(user, /Decode without scanning/)
    await waitFor(() => expect(server.stage).toBe('branch'))
    await leaveScreen(user, 'Close')
    await sendReply(user, /A linking code is account access/)
    await waitFor(() => expect(server.stage).toBe('verify'))
    await openMenu(user)
    await click(user, /Open Settings > Linked Devices yourself/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    await leaveScreen(user, /^Back from/)
    await click(user, /Cancel the link, report the number and close/)

    expect(sentIntents()).toEqual([
      'read', 'inspect_qr', 'safe_pivot', 'verify_known_app', 'resolve_report',
    ])
  })
})

/* ------------------------------------------------------------------ *
 * What the device never does, across the new batch
 * ------------------------------------------------------------------ */

describe('what the device never does on W06-W10', () => {
  const IDS = ['W06', 'W07', 'W08', 'W09', 'W10']

  it.each(IDS)('%s sends no stage, score, event code or deadline with any action', async (id) => {
    const user = userEvent.setup()
    startAt(id, 'inspect')

    await openMenu(user)
    const menu = await screen.findByTestId('wa-menu')
    await user.click(within(menu).getAllByRole('button')[0])
    await waitFor(() => expect(posts().length).toBeGreaterThan(0))

    for (const call of posts()) {
      for (const forbidden of [
        'stage', 'current_stage', 'next_stage', 'score', 'points', 'points_delta',
        'event_code', 'outcome_code', 'expires_at', 'time_limit_ms', 'evaluation',
        'intent', 'verify_source',
      ]) {
        expect(call.body).not.toHaveProperty(forbidden)
      }
      expect(Object.keys(call.body).sort()).toEqual(
        expect.arrayContaining(['action_code', 'intent_key']),
      )
    }
  })

  it.each(IDS)('%s records nothing for local navigation between screens', async (id) => {
    const user = userEvent.setup()
    startAt(id, 'branch')

    await openMenu(user)
    const menu = await screen.findByTestId('wa-menu')
    const local = within(menu).getAllByRole('button')
      .filter((button) => /info|Open the|Settings|Attach|Store|till|Show the|Suggested/i
        .test(button.textContent))
    if (!local.length) return

    await user.click(local[0])
    // Walking into a screen is not a decision, so nothing was submitted.
    expect(sentIntents()).toEqual([])
  })

  it.each(IDS)('%s rebuilds from the server after a remount, replaying nothing', async (id) => {
    const user = userEvent.setup()
    const { unmount } = startAt(id, 'verify')
    await screen.findByTestId('phone-app')
    const before = posts().length

    unmount()
    installFetch(server)
    renderSimulation()
    await screen.findByTestId('phone-app')

    // The stage came back from the server; the local surface stack did not come back at all.
    expect(server.stage).toBe('verify')
    expect(posts().length).toBe(before)
    expect(screen.queryByTestId('scene-surface')).toBeNull()
    await openMenu(user)
    expect(await screen.findByTestId('wa-menu')).toBeTruthy()
  })
})
