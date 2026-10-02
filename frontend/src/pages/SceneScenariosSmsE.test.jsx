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
 * SMS S21 to S25, end to end, through the real controller and the attempt API (IMMERSIVE-014) -
 * the fifth and final SMS batch.
 *
 * Same posture as the four earlier SMS page suites: the fake server owns the stage, so a test
 * advances a scenario only by making the server accept a control. What is new here is a correct use
 * taken in a portal's session list beside an unsafe act in the Spam folder (S21), a sign-in page and
 * a recording's transcript (S22), a payment app's notification with Decline beside Pay (S23), a file
 * picker and a keep-the-evidence safe branch (S24), and an app delivered as a picture message and
 * judged in Files (S25).
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

const IDS = ['S21', 'S22', 'S23', 'S24', 'S25']
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
  S21: 'Open the alert',
  S22: 'Open the message',
  S23: 'Open the message',
  S24: 'Open the conversation',
  S25: 'Open the message',
}

describe('the Messages app renders for every S21-S25 scene', () => {
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

  it.each(IDS)('%s scores a premature act from the list and nothing else', async (id) => {
    const user = userEvent.setup()
    startAt(id, 'open')
    await screen.findByTestId('sms-list')
    const extras = await screen.findByTestId('sms-row-actions')
    await user.click(within(extras).getAllByRole('button')[0])
    await waitFor(() => expect(posts()).toHaveLength(1))
    expect(['call_number', 'open_link', 'reply', 'attempt_install']).toContain(sentIntents()[0])
  }, 20000)
})

describe('S21 - sent at 14:22, delivered at 14:49', () => {
  it('walks notify to resolve, keeping DEV-204 in the portal’s own session list', async () => {
    const user = userEvent.setup()
    startAt('S21', 'notify')

    await clickName(user, /^Open VM-TPALRT, in /)
    await clickName(user, OPEN_ROW.S21)
    await screen.findByTestId('sms-thread')
    expect(screen.queryByTestId('sms-spam-bar')).toBeNull()
    expect(screen.getByText('Airplane mode turned off · 14:49')).toBeTruthy()
    await clickName(user, /^Message details/)
    const info = await surface()
    expect(within(info).getByText('Today, 14:22:41')).toBeTruthy()
    expect(within(info).getByText('Today, 14:49:06')).toBeTruthy()
    await leaveSurface(user)
    await settled(3)
    // Branch: the portal app is opened for free, and the decision is taken there.
    await openMenu(user)
    await clickName(user, 'Open Training Portal from the home screen')
    const app = await surface()
    expect(within(app).getByText('2 devices — this phone and DEV-204')).toBeTruthy()
    expect(posts()).toHaveLength(3)
    await user.click(within(app).getByRole('button', { name: 'This was me — keep DEV-204 signed in' }))
    await settled(4)
    await openMenu(user)
    await clickName(user, /^Open Training Portal and read the sign-in history/)
    await settled(5)
    expect(await screen.findByText('3 — all yours')).toBeTruthy()
    await leaveSurface(user)
    await clickName(user, 'Mark the alert reviewed: the sign-in was yours')

    await waitFor(() => expect(sentIntents()).toEqual([
      'open_item', 'read', 'read_thread', 'safe_pivot', 'verify_known_app', 'resolve_retain',
    ]))
    for (const call of posts()) {
      expect(call.body).not.toHaveProperty('intent')
      expect(String(call.body.action_code)).toMatch(/^ac_[0-9a-f]{20}$/)
    }
  }, 30000)

  it('prices opening the Spam text’s address, reached from the Spam folder', async () => {
    const user = userEvent.setup()
    startAt('S21', 'branch')
    await screen.findByTestId('sms-thread')
    await openMenu(user)
    await clickName(user, 'Spam and blocked')
    const folder = await surface()
    expect(within(folder).getByTestId('sms-bar')).toBeTruthy()
    expect(within(folder).getByText('https://tp-verify.training.example/signin')).toBeTruthy()
    expect(posts()).toHaveLength(0)
    await user.click(within(folder).getByRole('button', { name: 'Open tp-verify.training.example' }))
    await waitFor(() => expect(sentIntents()).toEqual(['open_link']))
  }, 20000)

  it('offers the needless end-session beside the correct use', async () => {
    const user = userEvent.setup()
    startAt('S21', 'branch')
    await screen.findByTestId('sms-thread')
    await openMenu(user)
    await clickName(user, 'Open Training Portal from the home screen')
    const app = await surface()
    await user.click(within(app).getByRole('button', { name: 'End the DEV-204 session' }))
    await waitFor(() => expect(sentIntents()).toEqual(['reject_ignore']))
  }, 20000)

  it('verifies with Meera on her saved number', async () => {
    const user = userEvent.setup()
    startAt('S21', 'verify')
    await screen.findByTestId('sms-thread')
    await openMenu(user)
    await clickName(user, 'Call Meera on her saved number')
    await waitFor(() => expect(sentIntents()).toEqual(['verify_known_number']))
    expect((await screen.findAllByText('+91 00000 26630')).length).toBeGreaterThan(0)
  }, 20000)
})

describe('S22 - your voicemail is in the Phone app', () => {
  it('shows an empty Voicemail and the link’s real address without recording anything', async () => {
    const user = userEvent.setup()
    startAt('S22', 'branch')
    await screen.findByTestId('sms-thread')
    expect(screen.getByText(/^Secure Voice: Col\. Dev left 1 urgent message/)).toBeTruthy()
    await openMenu(user)
    await clickName(user, 'Open Voicemail in the Phone app')
    expect(await screen.findByText('No new messages')).toBeTruthy()
    expect(posts()).toHaveLength(0)
  }, 20000)

  it('keeps the mail address and password on the portal page', async () => {
    const user = userEvent.setup()
    startAt('S22', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Open the link')
    const page = await surface()
    expect(within(page).getByTestId('browser-address').textContent).toContain('s22.training.example')
    expect(posts()).toHaveLength(0)
    const inputs = within(page).getAllByRole('textbox')
    await user.type(inputs[0], 'learner@mail.falcon')
    await user.type(inputs[1], 'Hunter2Falcon')
    expect(inputs[1].getAttribute('type')).not.toBe('password')
    await clickName(user, 'Sign in and listen')
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    noTypedValueSent(['learner@mail.falcon', 'Hunter2Falcon'])
  }, 25000)

  it('reaches the recording from the page without signing in, and prices the call-back there', async () => {
    const user = userEvent.setup()
    startAt('S22', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Open the link')
    await clickName(user, 'Play a 10-second preview to check it is for you')
    const clip = await surface()
    expect(within(clip).getByText(/Call me back on 00000 46120/)).toBeTruthy()
    expect(posts()).toHaveLength(0)
    await user.click(within(clip).getByRole('button', { name: 'Call 00000 46120 as the message asks' }))
    await waitFor(() => expect(sentIntents()).toEqual(['call_number']))
    expect(document.body.innerHTML).not.toMatch(/<audio|<video|getUserMedia/)
  }, 20000)

  it('closes the page as the safe branch, on the page', async () => {
    const user = userEvent.setup()
    startAt('S22', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Open the link')
    await clickName(user, 'Close this page')
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
  }, 20000)
})

describe('S23 - read the direction, not the story', () => {
  it('declines in the payment app’s notification, where the request says what it is', async () => {
    const user = userEvent.setup()
    startAt('S23', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Open in TrainPay')
    const notif = await surface()
    expect(within(notif).getByText('SK REFUND DESK is requesting INR 2,499.00')).toBeTruthy()
    expect(posts()).toHaveLength(0)
    await user.click(within(notif).getByRole('button', { name: 'Decline' }))
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
  }, 20000)

  it('shows PAY on the collect sheet, and the PIN never leaves it', async () => {
    const user = userEvent.setup()
    startAt('S23', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Open in TrainPay')
    await clickName(user, 'Pay')
    const sheet = await surface()
    expect(within(sheet).getByText('PAY to SK REFUND DESK')).toBeTruthy()
    expect(within(sheet).getByText('Money leaves your account')).toBeTruthy()
    expect(posts()).toHaveLength(0)
    await user.type(within(sheet).getByLabelText('UPI PIN'), '415926')
    await clickName(user, 'Pay INR 2,499')
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_payment']))
    // Found by hand-play: the learner returns to the conversation, not to a notification still offering Pay.
    await waitFor(() => expect(screen.queryByTestId('scene-surface')).toBeNull())
    expect(screen.getByTestId('sms-thread')).toBeTruthy()
    noTypedValueSent(['415926'])
  }, 25000)

  it('prices a reply from the composer, which sends only after the learner presses Send', async () => {
    const user = userEvent.setup()
    startAt('S23', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, /^I accepted\. When will it arrive\?/)
    expect(posts()).toHaveLength(0)
    await clickName(user, 'Send "I accepted. When will it arrive?"')
    await waitFor(() => expect(sentIntents()).toEqual(['reply']))
  }, 20000)
})

describe('S24 - four texts before breakfast', () => {
  it('keeps the texts as the safe branch, on the notice itself', async () => {
    const user = userEvent.setup()
    startAt('S24', 'branch')
    await screen.findByTestId('sms-thread')
    expect(screen.getByText(/^CYBER CASE NOTICE: Pay verification fee/)).toBeTruthy()
    expect(screen.getByText(/This matter is confidential/)).toBeTruthy()
    await clickName(user, 'Open nothing and keep all four texts as they are')
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
  }, 20000)

  it('walks the countdown portal for free, then prices the fee on the payment sheet', async () => {
    const user = userEvent.setup()
    startAt('S24', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Open the case file')
    const portal = await surface()
    expect(within(portal).getByText('Warrant pending')).toBeTruthy()
    await clickName(user, 'Pay the clearance fee')
    const sheet = await surface()
    expect(posts()).toHaveLength(0)
    await user.type(within(sheet).getByLabelText('UPI PIN'), '271828')
    await clickName(user, 'Pay INR 9,800')
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_payment']))
    await waitFor(() => expect(screen.queryByTestId('scene-surface')).toBeNull())
    noTypedValueSent(['271828'])
  }, 25000)

  it('prices uploading the ID card and passbook from the phone’s own file picker', async () => {
    const user = userEvent.setup()
    startAt('S24', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Open the case file')
    await clickName(user, 'Upload ID and passbook for manual clearance')
    const picker = await surface()
    expect(within(picker).getAllByText(/ID card — front\.jpg/).length).toBeGreaterThan(0)
    expect(posts()).toHaveLength(0)
    await user.click(within(picker).getByRole('button', { name: 'Upload 2 files' }))
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    await waitFor(() => expect(screen.queryByTestId('scene-surface')).toBeNull())
    expect(document.body.innerHTML).not.toMatch(/type="file"/)
  }, 20000)

  it('prices calling the officer from the number card', async () => {
    const user = userEvent.setup()
    startAt('S24', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Call the officer')
    await waitFor(() => expect(sentIntents()).toEqual(['call_number']))
  }, 20000)

  it('verifies on the reporting portal opened from bookmarks, where the case does not exist', async () => {
    const user = userEvent.setup()
    startAt('S24', 'verify')
    await screen.findByTestId('sms-thread')
    await openMenu(user)
    await clickName(user, /^Open the reporting portal from your bookmarks/)
    await waitFor(() => expect(sentIntents()).toEqual(['verify_known_app']))
    expect(await screen.findByText('No complaint with this number exists.')).toBeTruthy()
  }, 20000)
})

describe('S25 - the app arrives as a picture message', () => {
  it('deletes the file in Files as the safe branch, reached without deciding', async () => {
    const user = userEvent.setup()
    startAt('S25', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Open in Files')
    const files = await surface()
    expect(within(files).getByText('Not listed')).toBeTruthy()
    expect(posts()).toHaveLength(0)
    await user.click(within(files).getByRole('button', { name: 'Delete the file without opening it' }))
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
  }, 20000)

  it('reaches the install warning from the attachment, where Install anyway is the release', async () => {
    const user = userEvent.setup()
    startAt('S25', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Install')
    const dialog = await surface()
    expect(within(dialog).getByText(/Become your default SMS app/)).toBeTruthy()
    expect(posts()).toHaveLength(0)
    await user.click(within(dialog).getByRole('button', { name: 'Install anyway' }))
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_install']))
  }, 20000)

  it('prices opening the download link', async () => {
    const user = userEvent.setup()
    startAt('S25', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Open the link')
    await waitFor(() => expect(sentIntents()).toEqual(['open_link']))
  }, 20000)

  it('walks the safe route through Files, the issuer app and resolve', async () => {
    const user = userEvent.setup()
    startAt('S25', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Open in Files')
    await user.click(within(await surface()).getByRole('button', { name: 'Delete the file without opening it' }))
    await settled(1)
    await openMenu(user)
    await clickName(user, /^Open the Meridian Bank app and check the tag/)
    await settled(2)
    expect(await screen.findByText('KYC completed on 14 Mar 2026. Nothing expires today. Balance INR 1,240.')).toBeTruthy()
    await leaveSurface(user)
    await clickName(user, 'Report the text as junk and delete the file')
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot', 'verify_known_app', 'resolve_report']))
  }, 25000)
})

describe('the engine still owns the run', () => {
  it('replays a lost response instead of scoring the open twice', async () => {
    const user = userEvent.setup()
    startAt('S23', 'open')
    server.dropNextResponse = true
    await clickName(user, OPEN_ROW.S23)
    expect(await screen.findByText(/Cannot reach the training server/)).toBeTruthy()
    await clickName(user, OPEN_ROW.S23)
    await screen.findByTestId('sms-thread')
    expect(server.sequence).toBe(1)
    const keys = posts().map((call) => call.body.intent_key)
    expect(keys).toHaveLength(2)
    expect(new Set(keys).size).toBe(1)
  }, 20000)

  it('rebuilds at the branch stage after a remount, with no replay and no pushed surface', async () => {
    const user = userEvent.setup()
    startAt('S24', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Open the case file')
    await clickName(user, 'Pay the clearance fee')
    await surface()
    cleanup()
    renderSimulation()
    await screen.findByTestId('sms-thread')
    expect(screen.queryByTestId('scene-surface')).toBeNull()
    expect(screen.getByText(/This matter is confidential/)).toBeTruthy()
    expect(posts()).toHaveLength(0)
  }, 20000)

  it('shows the stale notice when the run has moved on', async () => {
    const user = userEvent.setup()
    startAt('S25', 'branch')
    await screen.findByTestId('sms-thread')
    server.failNextWith = {
      code: 'STALE_STATE', status: 409, details: { current_stage: 'verify', last_sequence: 4 },
    }
    await clickName(user, 'Open the link')
    expect(await screen.findByText(/This scenario moved on/)).toBeTruthy()
  }, 20000)

  it('refuses a control prepared for another stage without moving the run', async () => {
    const user = userEvent.setup()
    startAt('S22', 'branch')
    await screen.findByTestId('sms-thread')
    server.stage = 'verify'
    await openMenu(user)
    await clickName(user, 'Leave the link unopened and check Voicemail in the Phone app')
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

describe('no S21-S25 scene leaks what a control means', () => {
  it.each(IDS)('%s renders no engine vocabulary in the DOM at inspect or branch', async (id) => {
    for (const stage of ['inspect', 'branch']) {
      startAt(id, stage)
      await screen.findByTestId('sms-thread')
      const html = document.body.innerHTML
      for (const token of FORBIDDEN_TOKENS) {
        expect(html.includes(token), `${id} ${stage} DOM leaks ${token}`).toBe(false)
      }
      expect(html).not.toMatch(/data-intent|data-affordance|href=|<iframe|<form|points|score_0_10/)
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
