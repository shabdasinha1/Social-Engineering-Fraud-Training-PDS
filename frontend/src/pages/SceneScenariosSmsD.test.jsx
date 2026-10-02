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
 * SMS S16 to S20, end to end, through the real controller and the attempt API (IMMERSIVE-013) -
 * the fourth SMS batch.
 *
 * Same posture as the three earlier SMS page suites: the fake server owns the stage, so a test
 * advances a scenario only by making the server accept a control. What is new here is a correct use
 * taken in a second app (S16), a safe branch inside a saved contact's thread and a one-tap suggested
 * reply (S17), a call that rings and is itself the decision (S18), the Messages app's own
 * attach-location sheet (S19), and the operating system's install and screen-share dialogs (S20).
 *
 * Every scored release in the batch is reached here by clicking through the UI with the branch
 * unspent; a release that could only be reached by spending another decision fails these tests.
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

const IDS = ['S16', 'S17', 'S18', 'S19', 'S20']
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
/** Wait until the server has accepted `n` controls, so the next screen belongs to the next stage. */
const settled = (n) => waitFor(() => expect(posts()).toHaveLength(n))
const noTypedValueSent = (values) => {
  const wire = JSON.stringify(posts().map((call) => call.body))
  for (const value of values) expect(wire).not.toContain(value)
  expect(window.localStorage.length).toBe(0)
  expect(window.sessionStorage.length).toBe(0)
}

afterEach(() => {
  cleanup()
  server = undefined
})

const OPEN_ROW = {
  S16: 'Open the code message',
  S17: 'Open the message',
  S18: 'Open the conversation',
  S19: 'Open the message',
  S20: 'Open the conversation',
}

describe('the Messages app renders for every S16-S20 scene', () => {
  it.each(IDS)('%s opens on the message list with the phone’s own categories', async (id) => {
    startAt(id, 'open')
    expect(await screen.findByTestId('sms-list')).toBeTruthy()
    expect(await screen.findByRole('button', { name: OPEN_ROW[id] })).toBeTruthy()
    const tabs = screen.getAllByRole('tab').map((tab) => tab.textContent)
    expect(tabs.some((label) => label.includes('Spam'))).toBe(true)
    expect(posts()).toHaveLength(0)
  })

  it.each(IDS)('%s draws a thread with no messenger chrome', async (id) => {
    startAt(id, 'branch')
    await screen.findByTestId('sms-thread')
    expect(document.body.innerHTML).not.toMatch(/last seen|Forwarded|online|typing/i)
    expect(screen.queryByTestId('voice-note')).toBeNull()
  })
})

describe('S16 - the code belongs to the app that asked for it', () => {
  it('walks notify to resolve, filling the code inside Training Portal', async () => {
    const user = userEvent.setup()
    startAt('S16', 'notify')

    await clickName(user, /^Open VM-TRPRTL, in /)
    await clickName(user, OPEN_ROW.S16)
    await screen.findByTestId('sms-thread')
    // A registered sender: no unsaved-sender bar, and no way to reply.
    expect(screen.queryByTestId('sms-spam-bar')).toBeNull()
    expect(screen.getByText('You can’t reply to this sender. It sends codes only.')).toBeTruthy()
    expect(screen.getAllByText(/@portal\.training\.example #482193/).length).toBeGreaterThan(0)
    await user.click(await screen.findByTestId('sms-header'))
    expect(await screen.findByText('Registered to Training Portal')).toBeTruthy()
    await clickName(user, 'Codes from this sender')
    expect((await screen.findAllByText(/You signed in on this phone/)).length).toBe(2)
    await user.click(within(await surface()).getAllByRole('button')[0])
    await leaveSurface(user)
    await settled(3)
    // Branch: back to the app, where the session and the keyboard suggestion are.
    await openMenu(user)
    await clickName(user, 'Switch back to the Training Portal app')
    const app = await surface()
    expect(within(app).getByText('Session TP-4471')).toBeTruthy()
    expect(within(app).getByText(/482193 · VM-TRPRTL/)).toBeTruthy()
    expect(posts()).toHaveLength(3)
    await user.click(within(app).getByRole('button', { name: 'Fill 482193 from Messages' }))
    await settled(4)
    await openMenu(user)
    await clickName(user, /^Open Training Portal and compare the sign-in under Security/)
    await settled(5)
    expect(await screen.findByText('1 waiting — this phone')).toBeTruthy()
    await leaveSurface(user)
    await clickName(user, 'Finish signing in and let the code run out')

    await waitFor(() => expect(sentIntents()).toEqual([
      'open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_continue',
    ]))
    for (const call of posts()) {
      expect(call.body).not.toHaveProperty('intent')
      expect(String(call.body.action_code)).toMatch(/^ac_[0-9a-f]{20}$/)
    }
  }, 30000)

  it('prices forwarding the code from the message itself', async () => {
    const user = userEvent.setup()
    startAt('S16', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Forward this text to the IT help desk')
    await waitFor(() => expect(sentIntents()).toEqual(['share_secret']))
    noTypedValueSent(['482193'])
  }, 20000)

  it('offers the needless cancel inside the app, beside the correct use', async () => {
    const user = userEvent.setup()
    startAt('S16', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Open Training Portal')
    const app = await surface()
    await user.click(within(app).getByRole('button', { name: 'Not now — cancel this sign-in' }))
    await waitFor(() => expect(sentIntents()).toEqual(['reject_ignore']))
  }, 20000)
})

describe('S17 - the saved thread is one tab away', () => {
  it('files the new number under Unknown senders and keeps Kabir under Known senders', async () => {
    const user = userEvent.setup()
    startAt('S17', 'open')
    await screen.findByTestId('sms-list')
    expect(screen.getAllByRole('tab')[0].textContent).toContain('Unknown senders')
    await user.click(screen.getByRole('tab', { name: /Known senders/ }))
    expect(await screen.findByText('You: OK. Take the bus, not the bike.')).toBeTruthy()
    expect(posts()).toHaveLength(0)
  })

  it('takes the safe branch inside the saved thread, reached without deciding', async () => {
    const user = userEvent.setup()
    startAt('S17', 'branch')
    await screen.findByTestId('sms-thread')
    await openMenu(user)
    await clickName(user, 'Open Kabir’s saved conversation')
    const saved = await surface()
    expect(within(saved).getByText('16:32 · Delivered')).toBeTruthy()
    expect(posts()).toHaveLength(0)
    await user.click(within(saved).getByRole('button', { name: /Leave the new number unanswered/ }))
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
  }, 20000)

  it('sends the suggested Done at one tap', async () => {
    const user = userEvent.setup()
    startAt('S17', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Done')
    await waitFor(() => expect(sentIntents()).toEqual(['reply']))
  }, 20000)

  it('raises the payment sheet from the text, names a person, and keeps the PIN on it', async () => {
    const user = userEvent.setup()
    startAt('S17', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Pay with UPI')
    const sheet = await surface()
    expect(within(sheet).getByText('R DESHMUKH')).toBeTruthy()
    expect(posts()).toHaveLength(0)
    await user.type(within(sheet).getByLabelText('UPI PIN'), '728391')
    await clickName(user, 'Pay INR 15,000')
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_payment']))
    noTypedValueSent(['728391'])
  }, 25000)

  it('verifies with Kabir on his own number', async () => {
    const user = userEvent.setup()
    startAt('S17', 'verify')
    await screen.findByTestId('sms-thread')
    await openMenu(user)
    await clickName(user, 'Call Kabir on his saved number')
    await waitFor(() => expect(sentIntents()).toEqual(['verify_known_number']))
    expect((await screen.findAllByText('+91 00000 27164')).length).toBeGreaterThan(0)
  }, 20000)
})

describe('S18 - the right thread, the wrong message', () => {
  it('shows the hijacking text under genuine alerts, and the details say grouping is by name', async () => {
    const user = userEvent.setup()
    startAt('S18', 'inspect')
    await screen.findByTestId('sms-thread')
    expect(screen.queryByTestId('sms-spam-bar')).toBeNull()
    expect(screen.getByText(/^SECURITY HOLD: Unusual transfer/)).toBeTruthy()
    await user.click(await screen.findByTestId('sms-header'))
    expect(await screen.findByText('By the sender name a text arrives with')).toBeTruthy()
    await clickName(user, 'Today’s message beside the last alert')
    expect(await screen.findByText('Same sender line, different message')).toBeTruthy()
    await waitFor(() => expect(sentIntents()).toEqual(['inspect_sender']))
  }, 20000)

  it('prices the call on the phone’s own confirmation, reached from the number', async () => {
    const user = userEvent.setup()
    startAt('S18', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Call 00000 41818')
    const dialog = await surface()
    expect(within(dialog).getByText('+91 00000 22110')).toBeTruthy()
    expect(posts()).toHaveLength(0)
    await user.click(within(dialog).getByRole('button', { name: 'Call' }))
    await waitFor(() => expect(sentIntents()).toEqual(['call_number']))
  }, 20000)

  it('rings, and reading out the card, PIN and code is the release on that call', async () => {
    const user = userEvent.setup()
    startAt('S18', 'branch')
    await screen.findByTestId('sms-thread')
    expect(screen.getByText(/add payee SR TRADERS/)).toBeTruthy()
    await clickName(user, 'Answer')
    const call = await surface()
    expect(posts()).toHaveLength(0)
    // While the call carries the decision, hanging up is the scene's control, not a local one.
    expect(within(call).queryByRole('button', { name: 'End call' })).toBeNull()
    // Found by hand-play: arriving captions must never push the call's controls under the pointer.
    // They live in a fixed-height, focusable log that scrolls itself instead.
    const log = within(call).getByTestId('call-captions')
    expect(log.className).toMatch(/\bh-44\b/)
    expect(log.className).toMatch(/\boverflow-y-auto\b/)
    expect(log.getAttribute('tabindex')).toBe('0')
    expect(log.compareDocumentPosition(within(call).getByTestId('call-controls')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await user.click(within(call).getByRole('button', { name: 'Read out the card number, PIN and the code' }))
    await waitFor(() => expect(sentIntents()).toEqual(['share_secret']))
    expect(document.body.innerHTML).not.toMatch(/getUserMedia|<audio|<video/)
  }, 20000)

  it('hangs up back to the thread, never onto a call that rings again, and the bank app shows no hold', async () => {
    const user = userEvent.setup()
    startAt('S18', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Answer')
    await user.click(within(await surface()).getByRole('button', { name: 'Hang up' }))
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
    // Found by hand-play: the call is closed, not left underneath another screen.
    await waitFor(() => expect(screen.queryByTestId('scene-surface')).toBeNull())
    expect(await screen.findByText(/^Call ended/)).toBeTruthy()
    await openMenu(user)
    await clickName(user, 'Open the bank app')
    expect(await screen.findByText('Active — no hold')).toBeTruthy()
    expect(posts()).toHaveLength(1)
  }, 20000)
})

describe('S19 - three things that identify one phone', () => {
  it('shows what *#06# returns without recording anything', async () => {
    const user = userEvent.setup()
    startAt('S19', 'branch')
    await screen.findByTestId('sms-thread')
    await openMenu(user)
    await clickName(user, 'Dial *#06#')
    const ids = await surface()
    expect(within(ids).getByText('00 440011 000573 2')).toBeTruthy()
    expect(within(ids).getByText(/permanent number for this handset/)).toBeTruthy()
    expect(posts()).toHaveLength(0)
  }, 20000)

  it('releases the location from the Messages app’s own attach sheet', async () => {
    const user = userEvent.setup()
    startAt('S19', 'branch')
    await screen.findByTestId('sms-thread')
    await openMenu(user)
    await clickName(user, 'Attach your location to a reply')
    const sheet = await surface()
    expect(within(sheet).getByText('A map link in a text message')).toBeTruthy()
    expect(posts()).toHaveLength(0)
    await user.click(within(sheet).getByRole('button', { name: 'Send current location' }))
    await waitFor(() => expect(sentIntents()).toEqual(['share_location']))
    expect(document.body.innerHTML).not.toMatch(/geolocation|getCurrentPosition/)
  }, 20000)

  it('keeps the survey form’s IMEI, place and model on the page', async () => {
    const user = userEvent.setup()
    startAt('S19', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Open the form')
    const form = await surface()
    expect(within(form).getByTestId('browser-address').textContent).toContain('s19.training.example')
    expect(posts()).toHaveLength(0)
    const inputs = within(form).getAllByRole('textbox')
    await user.type(inputs[0], '004400110005732')
    await user.type(inputs[1], 'Block C, room 12')
    await user.type(inputs[2], 'TR-X5')
    await clickName(user, 'Send survey')
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    noTypedValueSent(['004400110005732', '00440', 'Block C', 'room 12'])
  }, 25000)

  it('takes the safe branch from the unsaved-sender bar into the carrier’s own thread', async () => {
    const user = userEvent.setup()
    startAt('S19', 'branch')
    await screen.findByTestId('sms-thread')
    const bar = await screen.findByTestId('sms-spam-bar')
    await user.click(within(bar).getByRole('button', { name: 'Send nothing and read VM-TRNNET instead' }))
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
    expect(await screen.findByText('None of them asks for a reply, an IMEI or a location.')).toBeTruthy()
  }, 20000)
})

describe('S20 - one number, two companies, and your own reply', () => {
  it('shows both stories and the learner’s own delivered reply in one thread', async () => {
    startAt('S20', 'inspect')
    await screen.findByTestId('sms-thread')
    expect(screen.getByText('Which parcel? I am not expecting anything.')).toBeTruthy()
    expect(screen.getByText('10:50 · Delivered')).toBeTruthy()
    expect(screen.getByText(/^Parcel address failed\./)).toBeTruthy()
    expect(screen.getByText('Payment fraud detected - call support immediately.')).toBeTruthy()
  })

  it('reaches the installer from the link, where Install is the release', async () => {
    const user = userEvent.setup()
    startAt('S20', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Open the address')
    const dialog = await surface()
    expect(within(dialog).getByText('Read your text messages, including codes')).toBeTruthy()
    expect(posts()).toHaveLength(0)
    await user.click(within(dialog).getByRole('button', { name: 'Install' }))
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_install']))
  }, 20000)

  it('reaches the system screen-share consent from quick settings, without calling first', async () => {
    const user = userEvent.setup()
    startAt('S20', 'branch')
    await screen.findByTestId('sms-thread')
    await openMenu(user)
    await clickName(user, 'Open Screen share from quick settings')
    const dialog = await surface()
    expect(within(dialog).getByText(/any codes that arrive/)).toBeTruthy()
    expect(posts()).toHaveLength(0)
    await user.click(within(dialog).getByRole('button', { name: 'Start sharing' }))
    await waitFor(() => expect(sentIntents()).toEqual(['share_secret']))
    expect(document.body.innerHTML).not.toMatch(/getDisplayMedia|<video/)
  }, 20000)

  it('prices calling support from the number in the text', async () => {
    const user = userEvent.setup()
    startAt('S20', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Call support')
    await waitFor(() => expect(sentIntents()).toEqual(['call_number']))
  }, 20000)

  it('walks the safe route through the courier app and the card number', async () => {
    const user = userEvent.setup()
    startAt('S20', 'branch')
    await screen.findByTestId('sms-thread')
    await openMenu(user)
    await clickName(user, 'Stop here and open the courier app yourself')
    await settled(1)
    expect(await screen.findByText('Nothing on the way')).toBeTruthy()
    await leaveSurface(user)
    await openMenu(user)
    await clickName(user, 'Call your bank on the number printed on your card')
    await settled(2)
    await user.click(await screen.findByRole('button', { name: 'Back to the conversation' }))
    await waitFor(() => expect(screen.queryByTestId('scene-surface')).toBeNull())
    await clickName(user, 'Report both texts as junk and install nothing')
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot', 'verify_known_number', 'resolve_report']))
  }, 25000)
})

describe('the engine still owns the run', () => {
  it('replays a lost response instead of scoring the open twice', async () => {
    const user = userEvent.setup()
    startAt('S19', 'open')
    server.dropNextResponse = true
    await clickName(user, OPEN_ROW.S19)
    expect(await screen.findByText(/Cannot reach the training server/)).toBeTruthy()
    await clickName(user, OPEN_ROW.S19)
    await screen.findByTestId('sms-thread')
    expect(server.sequence).toBe(1)
    const keys = posts().map((call) => call.body.intent_key)
    expect(keys).toHaveLength(2)
    expect(new Set(keys).size).toBe(1)
  }, 20000)

  it('rebuilds at the verify stage after a remount, with no replay', async () => {
    startAt('S18', 'verify')
    await screen.findByTestId('sms-thread')
    const before = posts().length
    expect(screen.queryByRole('button', { name: 'Answer' })).toBeNull()
    cleanup()
    renderSimulation()
    await screen.findByTestId('sms-thread')
    expect(posts()).toHaveLength(before)
  })

  it('does not restore a pushed payment sheet after a remount', async () => {
    const user = userEvent.setup()
    startAt('S17', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Pay with UPI')
    await surface()
    cleanup()
    renderSimulation()
    await screen.findByTestId('sms-thread')
    expect(screen.queryByTestId('scene-surface')).toBeNull()
    expect(posts()).toHaveLength(0)
  }, 20000)

  it('shows the stale notice when the run has moved on', async () => {
    const user = userEvent.setup()
    startAt('S16', 'branch')
    await screen.findByTestId('sms-thread')
    server.failNextWith = {
      code: 'STALE_STATE', status: 409, details: { current_stage: 'verify', last_sequence: 4 },
    }
    await clickName(user, 'Forward this text to the IT help desk')
    expect(await screen.findByText(/This scenario moved on/)).toBeTruthy()
  }, 20000)

  it('refuses a control prepared for another stage without moving the run', async () => {
    const user = userEvent.setup()
    startAt('S20', 'branch')
    await screen.findByTestId('sms-thread')
    server.stage = 'verify'
    await openMenu(user)
    await clickName(user, 'Stop here and open the courier app yourself')
    await waitFor(() => expect(posts()).toHaveLength(1))
    expect(posts()[0].body.expected_stage).toBe('branch')
    expect(await screen.findByText(/This scenario moved on/)).toBeTruthy()
  }, 20000)

  it('records nothing for local navigation on any of the five', async () => {
    for (const id of IDS) {
      const user = userEvent.setup()
      startAt(id, 'branch')
      await screen.findByTestId('sms-thread')
      await openMenu(user)
      await user.keyboard('{Escape}')
      await user.click(await screen.findByTestId('sms-header'))
      await leaveSurface(user)
      expect(posts(), id).toHaveLength(0)
      cleanup()
    }
  }, 30000)
})

describe('no S16-S20 scene leaks what a control means', () => {
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
      expect(button.getAttribute('tabindex')).not.toBe('-1')
    }
  })

  it.each(IDS)('%s can be played from the keyboard alone', async (id) => {
    const user = userEvent.setup()
    startAt(id, 'open')
    const row = await screen.findByRole('button', { name: OPEN_ROW[id] })
    row.focus()
    expect(document.activeElement).toBe(row)
    await user.keyboard('{Enter}')
    await screen.findByTestId('sms-thread')
    await waitFor(() => expect(sentIntents()).toEqual(['read']))
  }, 20000)
})
