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
 * W11 to W15, end to end, through the real controller and the real attempt API
 * (IMMERSIVE-003C).
 *
 * Same posture as the W01-W10 suites: the fake server owns the stage, so the only way a
 * test can move a scenario forward is to make the server accept an intent. Each scenario is
 * checked for the interaction it was built around rather than five times for the same thing:
 * a business message's own buttons, a video call that has to be ended, a room only admins
 * can speak in, the phone's own installer, and a voice.
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

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

beforeEach(() => {
  server = null
})

/* ------------------------------------------------------------------ *
 * W11 - the genuine appointment
 * ------------------------------------------------------------------ */

describe('W11 - the expected welfare appointment', () => {
  it('walks notification to resolution on the office’s own button and the portal app', async () => {
    const user = userEvent.setup()
    startAt('W11', 'open')

    await click(user, /Open the chat with Welfare Office/)
    await waitFor(() => expect(server.stage).toBe('inspect'))

    // Last year's confirmation is in the same thread, in the same shape.
    const thread = await screen.findByTestId('wa-thread')
    expect(within(thread).getByText(/WLF-2511-0142 is confirmed/)).toBeTruthy()

    await click(user, /open business info/)
    await waitFor(() => expect(server.stage).toBe('branch'))
    expect(await screen.findByText('Business details')).toBeTruthy()
    await leaveScreen(user, 'Back from Business info')

    await click(user, 'Confirm')
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /Open the Welfare Portal app and find the booking/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    // The reference in the portal is the one in the message.
    expect(await screen.findByText('WLF-2609-0317')).toBeTruthy()
    expect(screen.getByText('Requested by you')).toBeTruthy()
    await leaveScreen(user, 'Leave Welfare Portal')

    await click(user, /Confirm the appointment and keep the chat/)
    expect(sentIntents()).toEqual([
      'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_continue',
    ])
  })

  it('shows the reply buttons as spent text once the stage has moved past them', async () => {
    startAt('W11', 'verify')
    const thread = await screen.findByTestId('wa-thread')
    expect(within(thread).getAllByText('Reschedule').length).toBeGreaterThan(0)
    expect(within(thread).queryByRole('button', { name: 'Reschedule' })).toBeNull()
    expect(within(thread).queryByRole('button', { name: 'Confirm' })).toBeNull()
  })

  it('walks Reschedule into the portal without recording anything', async () => {
    const user = userEvent.setup()
    startAt('W11', 'branch')
    await click(user, 'Reschedule')
    expect(await screen.findByText('Waiting for your confirmation')).toBeTruthy()
    expect(sentIntents()).toEqual([])
  })

  it('puts the untrusted channel in a paid search result, reached by the learner’s own hand', async () => {
    const user = userEvent.setup()
    startAt('W11', 'branch')

    await openMenu(user)
    await click(user, /Search the web for the office number/)
    expect(await screen.findByText('Sponsored')).toBeTruthy()
    expect(screen.getByText('Welfare Appointment Helpline - 24x7 Confirmation')).toBeTruthy()
    expect(sentIntents()).toEqual([])

    await click(user, /Call \+91 00000 11947/)
    await waitFor(() => expect(sentIntents()).toEqual(['call_number']))
    const call = await surface()
    expect(within(call).getByText('Welfare Appointment Helpline')).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ *
 * W12 - the call you have to leave
 * ------------------------------------------------------------------ */

describe('W12 - the digital arrest call', () => {
  it('lets the call be answered straight from the chat list, which is the premature route', async () => {
    const user = userEvent.setup()
    startAt('W12', 'open')

    // The secure line is already there, calling, beside the chat.
    expect(await screen.findByText('+44 7700 900417')).toBeTruthy()
    await click(user, /Answer the incoming video call/)
    await waitFor(() => expect(sentIntents()).toEqual(['call_number']))
    await waitFor(() => expect(server.stage).toBe('branch'))

    const call = await surface()
    expect(within(call).getByTestId('call-video')).toBeTruthy()
    expect(await within(call).findByTestId('call-countdown')).toBeTruthy()
  })

  it('makes End call the scored decision, with no second unscored way to hang up', async () => {
    const user = userEvent.setup()
    startAt('W12', 'branch')

    await click(user, 'Answer')
    expect(sentIntents()).toEqual([])
    const call = await surface()
    expect(await within(call).findByText(/you are under digital arrest/, {}, { timeout: 8000 }))
      .toBeTruthy()

    const controls = within(call).getByTestId('call-controls')
    const hangUps = within(controls).getAllByRole('button', { name: 'End call' })
    expect(hangUps).toHaveLength(1)
    // SECURITY-001: the markup says only that this records an action; what it means is the server's.
    expect(hangUps[0].getAttribute('data-control')).toBe('act')

    await user.click(hangUps[0])
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
    await waitFor(() => expect(screen.queryByTestId('scene-surface')).toBeNull())
  }, 15_000)

  it('reaches the deposit from inside the call and never sends the PIN', async () => {
    const user = userEvent.setup()
    startAt('W12', 'branch')

    await click(user, 'Answer')
    await click(user, /Open the deposit request he has sent/)
    expect(await screen.findByText('INR 1,85,000.00')).toBeTruthy()
    expect(sentIntents()).toEqual([])

    const pin = (await screen.findAllByRole('textbox')).at(-1)
    await user.type(pin, '613377')
    await click(user, /Pay INR 1,85,000/)
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_payment']))
    expect(JSON.stringify(posts().map((call) => call.body))).not.toContain('613377')
  })

  it('opens the notice at inspect, and it names no court and only a video number', async () => {
    const user = userEvent.setup()
    startAt('W12', 'inspect')
    await click(user, /Open the notice/)
    await waitFor(() => expect(sentIntents()).toEqual(['preview_file']))
    expect(await screen.findByText('None named')).toBeTruthy()
    expect(screen.getByText(/\+44 7700 900417 \(WhatsApp video\)/)).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ *
 * W13 - the room you cannot speak in
 * ------------------------------------------------------------------ */

describe('W13 - the guaranteed IPO group', () => {
  it('has no message field, only the line that says who can post', async () => {
    const user = userEvent.setup()
    startAt('W13', 'open')
    await click(user, /Open Alpha Wealth VIP/)
    await waitFor(() => expect(server.stage).toBe('inspect'))
    expect(await screen.findByTestId('wa-admins-only')).toBeTruthy()
    expect(screen.queryByTestId('wa-composer-field')).toBeNull()
  })

  it('shows, in group info, that everyone who posted a profit is an admin', async () => {
    const user = userEvent.setup()
    startAt('W13', 'inspect')

    await click(user, /open group info/)
    await waitFor(() => expect(sentIntents()).toEqual(['inspect_profile']))
    await user.click(await screen.findByRole('tab', { name: /Participants/ }))
    expect(screen.getByText('~ Rakesh')).toBeTruthy()
    expect(screen.getByText('~ Sunita')).toBeTruthy()
    expect(screen.getAllByText('Group admin')).toHaveLength(6)
  })

  it('walks into the member page locally and only the deposit reaches the engine', async () => {
    const user = userEvent.setup()
    startAt('W13', 'branch')

    await click(user, 'Open')
    expect(await screen.findByText('Welcome bonus credited')).toBeTruthy()
    await user.click(await screen.findByRole('button', { name: /Withdraw my bonus/ }))
    expect(await screen.findByText(/10% processing tax/)).toBeTruthy()
    expect(sentIntents()).toEqual([])

    await user.click(await screen.findByRole('button', { name: 'Back to the previous page' }))
    await user.click(await screen.findByRole('button', { name: /Deposit to lock my IPO slot/ }))
    expect(await screen.findByText('R. K. Traders')).toBeTruthy()
    const pin = (await screen.findAllByRole('textbox')).at(-1)
    await user.type(pin, '445566')
    await click(user, /Deposit INR 50,000/)
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_payment']))
  })

  it('leaves, then finds nothing in the regulator’s register', async () => {
    const user = userEvent.setup()
    startAt('W13', 'branch')

    await openMenu(user)
    await click(user, 'Exit group')
    await waitFor(() => expect(server.stage).toBe('verify'))
    await openMenu(user)
    await click(user, /Search the adviser in the Investor Check app/)
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot', 'verify_known_app']))
    expect(await screen.findByText(/No registered adviser, research analyst or broker/)).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ *
 * W14 - the phone's own installer
 * ------------------------------------------------------------------ */

describe('W14 - the movement order APK', () => {
  it('walks the phone’s screens to the install, recording only Install', async () => {
    const user = userEvent.setup()
    startAt('W14', 'branch')

    await click(user, 'Open')
    expect(await screen.findByText(/not allowed to install unknown apps from this source/))
      .toBeTruthy()
    await click(user, 'Settings')
    await user.click(await screen.findByRole('switch', { name: /Allow from this source/ }))
    expect(await screen.findByText('Do you want to install this app?')).toBeTruthy()
    expect(screen.getByText(/Read and send SMS, including one-time codes/)).toBeTruthy()
    expect(sentIntents()).toEqual([])

    await click(user, 'Install')
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_install']))
    // The far side of the recorded decision: what the app now asks for.
    expect(await screen.findByText(/Allow MoveOrder Viewer to send and view SMS messages\?/))
      .toBeTruthy()
  })

  it('treats Cancel on the first dialog as the decision, and closes the installer', async () => {
    const user = userEvent.setup()
    startAt('W14', 'branch')
    await click(user, 'Open')
    await click(user, 'Cancel')
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
    await waitFor(() => expect(screen.queryByTestId('scene-surface')).toBeNull())
  })

  it('opens the installer when the file is tapped straight from the preview', async () => {
    const user = userEvent.setup()
    startAt('W14', 'open')
    await click(user, /Tap the file in the preview to open it/)
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_install']))
    await waitFor(() => expect(server.stage).toBe('branch'))
    expect(await screen.findByText(/not allowed to install unknown apps/)).toBeTruthy()
  })

  it('says what the file is before anything opens it', async () => {
    const user = userEvent.setup()
    startAt('W14', 'inspect')
    await click(user, 'File info')
    await waitFor(() => expect(sentIntents()).toEqual(['preview_file']))
    expect(await screen.findByText('Package installer')).toBeTruthy()
    expect(screen.getByText(/This file cannot be previewed; it can only be installed/)).toBeTruthy()
  })

  it('checks the order in the unit’s own document system', async () => {
    const user = userEvent.setup()
    startAt('W14', 'verify')
    await openMenu(user)
    await click(user, /Check the order in the Orders DMS app/)
    await waitFor(() => expect(sentIntents()).toEqual(['verify_known_app']))
    expect(await screen.findByText('No revision issued')).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ *
 * W15 - the voice
 * ------------------------------------------------------------------ */

describe('W15 - the senior’s voice note', () => {
  it('plays and transcribes the voice note locally, recording nothing', async () => {
    const user = userEvent.setup()
    startAt('W15', 'inspect')

    const thread = await screen.findByTestId('wa-thread')
    await user.click(within(thread).getAllByRole('button', { name: 'Play voice message' })[0])
    expect(within(thread).getByRole('button', { name: 'Pause voice message' })).toBeTruthy()
    await user.click(within(thread).getAllByRole('button', { name: 'View transcript' })[0])
    expect(within(thread).getByTestId('voice-transcript').textContent)
      .toMatch(/Send me the phrase on this number/)
    expect(sentIntents()).toEqual([])
    // No audio element exists anywhere to have been played.
    expect(document.querySelectorAll('audio, video, source, [src]')).toHaveLength(0)
  })

  it('carries the client’s full sentence where the bank stored a truncated one', async () => {
    startAt('W15', 'inspect')
    const thread = await screen.findByTestId('wa-thread')
    expect(within(thread).getByText(
      "Voice note - Send today's access phrase here; official phone is unavailable.",
    )).toBeTruthy()
  })

  it('finds the real colonel one tap away, saying the Adjutant briefs the secure room', async () => {
    const user = userEvent.setup()
    startAt('W15', 'inspect')

    await click(user, /open contact info/)
    await waitFor(() => expect(sentIntents()).toEqual(['inspect_sender']))
    expect(await screen.findByText('Yesterday at 21:40')).toBeTruthy()
    await user.click(await screen.findByRole('tab', { name: /Also in contacts/ }))
    await user.click(within(await surface()).getByRole('button', { name: /^Col\. Dev/ }))
    await user.click(await screen.findByRole('tab', { name: /Recent messages/ }))
    expect(await screen.findByText(/Adjt will brief the secure room staff/)).toBeTruthy()
    // Walking to the saved contact is navigation.
    expect(sentIntents()).toEqual(['inspect_sender'])
  })

  it('offers the client’s three chips and the refusal, and sends only the intent', async () => {
    const user = userEvent.setup()
    startAt('W15', 'branch')

    const replies = await screen.findByTestId('wa-quick-replies')
    for (const label of [/access phrase/, /access roster/, /entry procedure/, /confirm through the Adjutant/]) {
      expect(within(replies).getByRole('button', { name: label })).toBeTruthy()
    }
    await sendReply(user, /Send today’s access phrase/)
    await waitFor(() => expect(sentIntents()).toEqual(['share_secret']))
    expect(JSON.stringify(posts().map((call) => call.body))).not.toMatch(/phrase|••/)
  })

  it('settles it through the chain of command', async () => {
    const user = userEvent.setup()
    startAt('W15', 'verify')
    await openMenu(user)
    await click(user, /Call the Adjutant on his saved number/)
    await waitFor(() => expect(sentIntents()).toEqual(['verify_known_number']))
    const call = await surface()
    expect(await within(call).findByText('Adjutant.')).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ *
 * What the device never does, across the batch
 * ------------------------------------------------------------------ */

describe('what the device never does on W11-W15', () => {
  const IDS = ['W11', 'W12', 'W13', 'W14', 'W15']

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

    // Stand on a pushed screen, then lose the page.
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

    // The stage came back from the server; the local surface stack did not come back at all.
    expect(server.stage).toBe('branch')
    expect(posts().length).toBe(before)
    expect(screen.queryByTestId('scene-surface')).toBeNull()
  })
})
