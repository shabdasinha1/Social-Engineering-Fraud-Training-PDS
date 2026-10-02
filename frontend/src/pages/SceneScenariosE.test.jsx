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
 * W21 to W25, end to end, through the real controller and the real attempt API
 * (IMMERSIVE-003E) - the final WhatsApp batch.
 *
 * Same posture as the W01-W20 suites: the fake server owns the stage, so the only way a test
 * can move a scenario forward is to make the server accept an intent. Each scenario is checked
 * for the interaction it was built around: a message with nothing to press and an approved
 * portal, a four-week thread and checks outside the relationship, a grant form whose ask
 * grows page by page and a call to Ma, a support call whose Share screen leads to the phone's
 * consent dialog, and a linking code on the learner's own screen with its request sheet.
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

const inSurface = async (user, name) =>
  user.click(await within(await surface()).findByRole('button', { name }))

async function fill(user, values) {
  const inputs = within(await surface()).getAllByRole('textbox')
  for (const [index, value] of values.entries()) await user.type(inputs[index], value)
}

const contained = (container) => {
  expect(container.querySelectorAll('a[href], form, iframe, embed, object')).toHaveLength(0)
  expect(container.querySelectorAll('img, video, audio, source, [src]')).toHaveLength(0)
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

beforeEach(() => {
  server = null
})

/* ------------------------------------------------------------------ *
 * W21 - the genuine senior, and the portal the item lives in
 * ------------------------------------------------------------------ */

describe('W21 - the verified senior and the secure follow-up', () => {
  it('walks notification to resolution through the contact card, SecureDesk and the portal check', async () => {
    const user = userEvent.setup()
    startAt('W21', 'open')

    await click(user, /Open the chat with Col\. Dev/)
    await waitFor(() => expect(server.stage).toBe('inspect'))

    await click(user, /open contact info/)
    await waitFor(() => expect(server.stage).toBe('branch'))
    expect(await screen.findByText('90 days')).toBeTruthy()
    await user.click(await screen.findByRole('tab', { name: /Media/ }))
    expect(screen.getByText('No media, links or documents.')).toBeTruthy()
    await inSurface(user, 'Back from Contact info')

    // The chat has nothing to press; the item is found in the work profile's portal.
    const thread = await screen.findByTestId('wa-thread')
    expect(within(thread).queryAllByRole('button')).toHaveLength(0)
    await openMenu(user)
    await click(user, /Open SecureDesk \(work profile\)/)
    expect(await screen.findByText(/Exercise planning - revised timings/)).toBeTruthy()
    await inSurface(user, 'Open REF-ALPHA-17')
    expect(await screen.findByText('Restricted - respond in SecureDesk only')).toBeTruthy()
    expect(sentIntents()).toEqual(['read', 'inspect_sender'])

    await inSurface(user, 'Acknowledge in SecureDesk')
    await waitFor(() => expect(server.stage).toBe('verify'))
    expect(await screen.findByText('Acknowledged.')).toBeTruthy()
    await inSurface(user, 'Close the browser and go back')

    await openMenu(user)
    await click(user, /Open SecureDesk yourself and compare REF-ALPHA-17/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    await inSurface(user, 'Close the browser and go back')

    await click(user, /Reply "Seen, sir" and action it in SecureDesk/)
    expect(sentIntents()).toEqual([
      'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_continue',
    ])
  })

  it('shows his own earlier redirection and the disappearing-messages line in the thread', async () => {
    startAt('W21', 'inspect')
    const thread = await screen.findByTestId('wa-thread')
    expect(within(thread).getByText(/Upload it to SecureDesk and assign it to me/)).toBeTruthy()
    expect(within(thread).getByText(/turned on disappearing messages/)).toBeTruthy()
  })

  it('records asking for the detail on WhatsApp, and he declines to give it', async () => {
    const user = userEvent.setup()
    startAt('W21', 'branch')
    await sendReply(user, /can you tell me here what it is about/)
    await waitFor(() => expect(sentIntents()).toEqual(['reply']))
    expect(await screen.findByText(/Not here\. Everything you need is in the item on SecureDesk/))
      .toBeTruthy()
  })

  it('finds a directory row that matches the sender', async () => {
    const user = userEvent.setup()
    startAt('W21', 'verify')
    await openMenu(user)
    await click(user, /Look up Col\. Dev in the trusted directory/)
    await waitFor(() => expect(sentIntents()).toEqual(['verify_trusted_directory']))
    const dialog = await screen.findByRole('dialog', { name: 'Trusted directory' })
    expect(within(dialog).getByText('Col. Dev, GSO-1, HQ Falcon Bde')).toBeTruthy()
    expect(within(dialog).getAllByText(BANK.W21.synthetic.sender.identifier).length).toBeGreaterThan(1)
  })
})

/* ------------------------------------------------------------------ *
 * W22 - four weeks of friendship, and checks outside it
 * ------------------------------------------------------------------ */

describe('W22 - the long-game online friendship', () => {
  it('carries the client’s full sentence and the wrong-number start of the thread', async () => {
    startAt('W22', 'inspect')
    const thread = await screen.findByTestId('wa-thread')
    expect(within(thread).getByText(
      "My uncle's desk has a guaranteed window tonight. Start small so you can trust me.",
    )).toBeTruthy()
    expect(within(thread).getByText('Hi Kavya! Is Saturday dinner still on? 😊')).toBeTruthy()
    expect(within(thread).getByText(/Dental surgeon in Pune/)).toBeTruthy()
    expect(within(thread).getByText(/moved to Dubai/)).toBeTruthy()
  })

  it('searches her photos from the contact card without recording anything beyond the inspection', async () => {
    const user = userEvent.setup()
    startAt('W22', 'inspect')
    await click(user, /open contact info/)
    await waitFor(() => expect(sentIntents()).toEqual(['inspect_sender']))
    await user.click(await screen.findByRole('tab', { name: /Media/ }))
    await inSurface(user, /Search these photos with Photos/)
    expect(await screen.findByText('31 matching pages')).toBeTruthy()
    expect(screen.getByText('“Leg day done 💪” - in a gym')).toBeTruthy()
    expect(sentIntents()).toEqual(['inspect_sender'])
  })

  it('walks the trial dashboard and submits the ID details, sending none of them', async () => {
    const user = userEvent.setup()
    startAt('W22', 'branch')

    const thread = await screen.findByTestId('wa-thread')
    await user.click(within(thread).getByRole('button', { name: 'Open' }))
    expect(await screen.findByText('Welcome, friend of SAMIRA-VIP')).toBeTruthy()
    await inSurface(user, 'Open my trial dashboard')
    await inSurface(user, 'Withdraw')
    expect(await screen.findByText('15% tax clearance, paid in advance')).toBeTruthy()
    await inSurface(user, 'Back to dashboard')
    await inSurface(user, 'Verify identity')
    await fill(user, ['Asha Rao', 'ABCDE1234F', '998877665544'])
    await click(user, 'Continue')
    expect(sentIntents()).toEqual([])
    await click(user, 'Submit verification')
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    expect(await screen.findByText('Submitted.')).toBeTruthy()
    const sent = JSON.stringify(posts().map((call) => call.body))
    for (const value of ['Asha Rao', 'ABCDE1234F', '998877665544']) expect(sent).not.toContain(value)
  }, 20_000)

  it('pays the INR 2,000 start from the dashboard and never sends the PIN', async () => {
    const user = userEvent.setup()
    startAt('W22', 'branch')
    const thread = await screen.findByTestId('wa-thread')
    await user.click(within(thread).getByRole('button', { name: 'Open' }))
    await inSurface(user, 'Open my trial dashboard')
    await inSurface(user, 'Deposit INR 2,000')
    expect(await screen.findByText('priya.m88@trainingpay')).toBeTruthy()
    await user.type((await screen.findAllByRole('textbox')).at(-1), '424242')
    await click(user, 'Pay INR 2,000')
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_payment']))
    expect(JSON.stringify(posts().map((call) => call.body))).not.toContain('424242')
  })

  it('sets a boundary in the composer and checks the platform in the regulator’s register', async () => {
    const user = userEvent.setup()
    startAt('W22', 'branch')
    await sendReply(user, /I don’t invest through anyone I have only met online/)
    await waitFor(() => expect(server.stage).toBe('verify'))
    await openMenu(user)
    await click(user, /Look up Qorvex Global in the Investor Check app/)
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot', 'verify_known_app']))
    expect(await screen.findByText('No registered entity')).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ *
 * W23 - the grant form, and Ma
 * ------------------------------------------------------------------ */

describe('W23 - the family welfare pretext', () => {
  it('fills four escalating steps locally and records only the submission', async () => {
    const user = userEvent.setup()
    startAt('W23', 'branch')

    const thread = await screen.findByTestId('wa-thread')
    await user.click(within(thread).getByRole('button', { name: 'Open' }))
    expect(await screen.findByText('Issued after verification')).toBeTruthy()
    await click(user, 'Start application')
    const values = [
      ['Son', '12 Station Road 411001'],
      ['JC-45821', '14 Falcon', 'Northern post'],
      ['1 Sep - 30 Sep', '2 Oct'],
      ['Asha Rao', '123456789012', 'ABCD0123456'],
    ]
    const headings = ['Step 2 of 4 - Service details', 'Step 3 of 4 - Availability', 'Step 4 of 4 - Grant transfer']
    for (const [index, step] of values.entries()) {
      // eslint-disable-next-line no-await-in-loop
      await fill(user, step)
      // eslint-disable-next-line no-await-in-loop
      await click(user, index === 3 ? 'Continue to review' : 'Save and continue')
      // eslint-disable-next-line no-await-in-loop
      if (index < 3) expect(await screen.findByText(headings[index])).toBeTruthy()
    }
    expect(await screen.findByText('Review and submit')).toBeTruthy()
    expect(sentIntents()).toEqual([])
    await click(user, 'Submit application')
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    expect(await screen.findByText('Received.')).toBeTruthy()
    const sent = JSON.stringify(posts().map((call) => call.body))
    for (const value of values.flat()) expect(sent).not.toContain(value)
  }, 30_000)

  it('closes the form part-way through as the decision', async () => {
    const user = userEvent.setup()
    startAt('W23', 'branch')
    const thread = await screen.findByTestId('wa-thread')
    await user.click(within(thread).getByRole('button', { name: 'Open' }))
    await click(user, 'Start application')
    await fill(user, ['Son', '12 Station Road 411001'])
    await click(user, 'Save and continue')
    expect(await screen.findByText('Service number')).toBeTruthy()
    await click(user, 'Close the form without sending')
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
    await waitFor(() => expect(screen.queryByTestId('scene-surface')).toBeNull())
  })

  it('checks the family directly: Ma answers from home', async () => {
    const user = userEvent.setup()
    startAt('W23', 'verify')
    await openMenu(user)
    await click(user, /Call Ma on her saved number/)
    await waitFor(() => expect(sentIntents()).toEqual(['verify_known_number']))
    expect(await within(await surface()).findByText('Hello? Is everything all right?')).toBeTruthy()
  })

  it('shows the business account and the poster with no case number', async () => {
    const user = userEvent.setup()
    startAt('W23', 'inspect')
    const thread = await screen.findByTestId('wa-thread')
    await user.click(within(thread).getByRole('button', { name: 'View' }))
    await waitFor(() => expect(sentIntents()).toEqual(['preview_file']))
    expect(await screen.findByText('None shown')).toBeTruthy()
    await inSurface(user, 'Close')
    await openMenu(user)
    await click(user, /^Business info/)
    expect(await screen.findByText('9 days ago')).toBeTruthy()
    expect(sentIntents()).toEqual(['preview_file'])
  })
})

/* ------------------------------------------------------------------ *
 * W24 - the support call and the screen-share consent
 * ------------------------------------------------------------------ */

describe('W24 - the remote support screen share', () => {
  it('answers the call, walks to the consent dialog and records only Start now', async () => {
    const user = userEvent.setup()
    const { container } = startAt('W24', 'branch')

    const thread = await screen.findByTestId('wa-thread')
    await user.click(within(thread).getByRole('button', { name: 'Answer' }))
    const call = await surface()
    expect(await within(call).findByText(/Rahul from Mobile Security Desk/)).toBeTruthy()
    await user.click(await within(call).findByRole('button', { name: 'Share screen' }))
    expect(await screen.findByText('Start sharing your screen?')).toBeTruthy()
    expect(screen.getByText(/who is not in your contacts/)).toBeTruthy()
    contained(container)
    expect(sentIntents()).toEqual([])

    await click(user, 'Start now')
    await waitFor(() => expect(sentIntents()).toEqual(['share_secret']))
  })

  it('ends the call as the decision, on the call itself', async () => {
    const user = userEvent.setup()
    startAt('W24', 'branch')
    const thread = await screen.findByTestId('wa-thread')
    await user.click(within(thread).getByRole('button', { name: 'Answer' }))
    await inSurface(user, 'End call')
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
  })

  it('reaches the install dialog through the download warning and records the install', async () => {
    const user = userEvent.setup()
    startAt('W24', 'branch')
    const thread = await screen.findByTestId('wa-thread')
    await user.click(within(thread).getByRole('button', { name: 'Open' }))
    expect(await screen.findByText('This type of file can harm your device.')).toBeTruthy()
    await inSurface(user, 'Keep and open')
    expect(await screen.findByText('Do you want to install this app?')).toBeTruthy()
    expect(sentIntents()).toEqual([])
    await click(user, 'Install')
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_install']))
    expect(await screen.findByText(/Session code on screen/)).toBeTruthy()
  })

  it('compares the diagnosis with the phone’s own Device care screen, recording nothing', async () => {
    const user = userEvent.setup()
    startAt('W24', 'branch')
    await openMenu(user)
    await click(user, /View the diagnostic report again/)
    expect(await screen.findByText('Carrier “VIRTUO”, battery 19%, 10:48')).toBeTruthy()
    await inSurface(user, 'Close')
    await openMenu(user)
    await click(user, /Settings > Device care/)
    expect(await screen.findByText('No threats found')).toBeTruthy()
    expect(sentIntents()).toEqual([])
  })

  it('calls the IT helpdesk from the directory', async () => {
    const user = userEvent.setup()
    startAt('W24', 'verify')
    await openMenu(user)
    await click(user, /Call the IT helpdesk on the directory number/)
    await waitFor(() => expect(sentIntents()).toEqual(['verify_known_number']))
    expect(await within(await surface()).findByText('IT helpdesk, Cpl. Das.')).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ *
 * W25 - the linking code on the learner's own screen
 * ------------------------------------------------------------------ */

describe('W25 - the known contact and the linking code', () => {
  it('opens WhatsApp’s own link request from the chat list without recording anything', async () => {
    const user = userEvent.setup()
    startAt('W25', 'open')
    await click(user, 'Open WhatsApp')
    expect(await screen.findByText('A device wants to link to your account')).toBeTruthy()
    expect(screen.getByText('Approximately 1,400 km from you')).toBeTruthy()
    // Before the branch stage the sheet carries no decision.
    expect(within(await surface()).queryByRole('button', { name: 'Link device' })).toBeNull()
    expect(sentIntents()).toEqual([])
  })

  it('carries the full sentence, the favour and the out-of-character follow-up', async () => {
    startAt('W25', 'inspect')
    const thread = await screen.findByTestId('wa-thread')
    expect(within(thread).getByText(
      "I'm testing the team desktop. Send the linking code you just got so I can finish setup.",
    )).toBeTruthy()
    expect(within(thread).getByText('lifesaver. I owe you one')).toBeTruthy()
    expect(within(thread).getByText(/Remember you owe me one/)).toBeTruthy()
  })

  it('refuses the link on the request sheet reached from Linked devices', async () => {
    const user = userEvent.setup()
    startAt('W25', 'branch')
    await openMenu(user)
    await click(user, /Settings > Linked devices/)
    expect(await screen.findByText('Office laptop')).toBeTruthy()
    await inSurface(user, 'Review this request')
    expect(await within(await surface()).findByText('KX7P-49RT')).toBeTruthy()
    expect(sentIntents()).toEqual([])
    await click(user, 'Don’t link')
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
  })

  it('records linking the device, and the account goes on as if nothing happened', async () => {
    const user = userEvent.setup()
    startAt('W25', 'branch')
    await openMenu(user)
    await click(user, /WhatsApp link request/)
    await click(user, 'Link device')
    await waitFor(() => expect(sentIntents()).toEqual(['approve_device_link']))
    expect(await screen.findByText('Device linked')).toBeTruthy()
  })

  it('sends the code as an intent only; the code itself never reaches the wire', async () => {
    const user = userEvent.setup()
    startAt('W25', 'branch')
    await sendReply(user, /^KX7P-49RT/)
    await waitFor(() => expect(sentIntents()).toEqual(['share_secret']))
    expect(JSON.stringify(posts().map((call) => call.body))).not.toContain('KX7P')
    expect(await screen.findByText(/Setup done/)).toBeTruthy()
  })

  it('shows the learner’s own number in Neel’s "desktop" screenshot', async () => {
    const user = userEvent.setup()
    startAt('W25', 'branch')
    const thread = await screen.findByTestId('wa-thread')
    await user.click(within(thread).getByRole('button', { name: 'View' }))
    expect(await screen.findByText('+91 00000 50288 (your number)')).toBeTruthy()
    expect(sentIntents()).toEqual([])
  })

  it('phones Neel on his number, not on WhatsApp', async () => {
    const user = userEvent.setup()
    startAt('W25', 'verify')
    await openMenu(user)
    await click(user, /Phone Neel on his mobile number, not on WhatsApp/)
    await waitFor(() => expect(sentIntents()).toEqual(['verify_known_number']))
    expect(await within(await surface()).findByText(/There is a band playing here/)).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ *
 * What the device never does, across the batch
 * ------------------------------------------------------------------ */

describe('what the device never does on W21-W25', () => {
  const IDS = ['W21', 'W22', 'W23', 'W24', 'W25']

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
