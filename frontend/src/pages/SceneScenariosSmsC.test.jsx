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
 * SMS S11 to S15, end to end, through the real controller and the attempt API (IMMERSIVE-012) -
 * the third SMS batch.
 *
 * Same posture as the two earlier SMS page suites: the fake server owns the stage, so a test
 * advances a scenario only by making the server accept a control. What is new here is a reply that
 * is the correct act (S11), a scored open on the phone's link-details screen (S12), a one-tap
 * suggested reply and a safe branch on the details screen (S13), the browser's own location prompt
 * (S14) and a picture viewer on a group MMS (S15).
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

const IDS = ['S11', 'S12', 'S13', 'S14', 'S15']
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
  S11: 'Open the reminder',
  S12: 'Open the message',
  S13: 'Open the message',
  S14: 'Open the message',
  S15: 'Open the picture message',
}

describe('the Messages app renders for every S11-S15 scene', () => {
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

describe('S11 - the correct act is a reply', () => {
  it('walks notify to resolve with a reply of 1 and the clinic portal', async () => {
    const user = userEvent.setup()
    startAt('S11', 'notify')

    await clickName(user, /^Open Training Clinic, in /)
    await clickName(user, OPEN_ROW.S11)
    await screen.findByTestId('sms-thread')
    // A saved contact: no unsaved-sender bar.
    expect(screen.queryByTestId('sms-spam-bar')).toBeNull()
    await user.click(await screen.findByTestId('sms-header'))
    expect(await screen.findByText(/Saved to your contacts/)).toBeTruthy()
    await leaveSurface(user)
    // Branch: compare in the portal (free), then reply 1.
    await openMenu(user)
    await clickName(user, 'Open the clinic portal')
    expect(await screen.findByText('03 Sep, 09:20 — awaiting your confirmation')).toBeTruthy()
    await leaveSurface(user)
    await clickName(user, /^Reply 1 to confirm/)
    expect((await screen.findByTestId('sms-compose-body')).textContent).toBe('1')
    await clickName(user, 'Send "1"')
    await settled(4)
    // Verify and resolve.
    await openMenu(user)
    await clickName(user, /^Open the clinic portal and compare the booking/)
    await settled(5)
    await leaveSurface(user)
    await clickName(user, 'Keep the thread and go on Wednesday')

    await waitFor(() => expect(sentIntents()).toEqual([
      'open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_continue',
    ]))
    for (const call of posts()) {
      expect(call.body).not.toHaveProperty('intent')
      expect(String(call.body.action_code)).toMatch(/^ac_[0-9a-f]{20}$/)
    }
  }, 25000)

  it('prices the reply that adds health details, and sends none of that text', async () => {
    const user = userEvent.setup()
    startAt('S11', 'branch')
    await screen.findByTestId('sms-thread')

    await clickName(user, /^Reply 1 and tell them how you have been/)
    expect(posts()).toHaveLength(0)
    await user.click(await screen.findByRole('button', { name: /^Send "1\. The pain/ }))
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    noTypedValueSent(['lower back', 'TC-55102', '14-03-1994'])
  }, 20000)

  it('offers the needless delete-and-block in the menu', async () => {
    const user = userEvent.setup()
    startAt('S11', 'branch')
    await screen.findByTestId('sms-thread')
    await openMenu(user)
    await clickName(user, 'Delete the conversation and block this number')
    await waitFor(() => expect(sentIntents()).toEqual(['reject_ignore']))
  }, 20000)
})

describe('S12 - a registered header in the Offers category', () => {
  it('shows the sender category and the department’s own thread', async () => {
    const user = userEvent.setup()
    startAt('S12', 'inspect')
    await screen.findByTestId('sms-thread')
    expect(screen.getByText('Filed under Offers by the Messages app.')).toBeTruthy()
    await user.click(await screen.findByTestId('sms-header'))
    expect(await screen.findByText('Promotional — registered to send offers')).toBeTruthy()
    await clickName(user, 'Messages from VM-ITDEPT')
    expect((await screen.findAllByText(/No refund is due/)).length).toBeGreaterThan(0)
    await waitFor(() => expect(sentIntents()).toEqual(['inspect_sender']))
  }, 20000)

  it('scores the open on the link-details screen, reached without deciding', async () => {
    const user = userEvent.setup()
    startAt('S12', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'See where this address goes')
    const details = await surface()
    expect(within(details).getByTestId('sms-link-details').textContent).toContain('s12.training.example')
    expect(posts()).toHaveLength(0)
    await user.click(within(details).getByRole('button', { name: 'Open the address' }))
    await waitFor(() => expect(sentIntents()).toEqual(['open_link']))
  }, 20000)

  it('reaches the card-and-code page by local links, and nothing typed leaves it', async () => {
    const user = userEvent.setup()
    startAt('S12', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'See where this address goes')
    await clickName(user, 'Load the page in the browser')
    const page = await surface()
    expect(within(page).getByTestId('browser-address').textContent).toContain('s12.training.example')
    await user.click(within(page).getByRole('button', { name: /debit card instead/ }))
    const card = await surface()
    expect(posts()).toHaveLength(0)
    const inputs = within(card).getAllByRole('textbox')
    await user.type(inputs[0], '4111222233334444')
    await user.type(inputs[1], '0829')
    await user.type(inputs[2], '908172')
    await clickName(user, 'Release the refund with the code')
    await waitFor(() => expect(sentIntents()).toEqual(['share_secret']))
    noTypedValueSent(['4111222233334444', '908172'])
  }, 25000)
})

describe('S13 - one recruiter, three numbers', () => {
  it('lists all three conversations on the details screen, where the safe branch is', async () => {
    const user = userEvent.setup()
    startAt('S13', 'branch')
    await screen.findByTestId('sms-thread')
    await user.click(await screen.findByTestId('sms-header'))
    const details = await surface()
    for (const number of ['+91 00000 61204', '+91 00000 73390']) {
      expect(within(details).getAllByText(number).length).toBeGreaterThan(0)
    }
    expect(posts()).toHaveLength(0)
    await user.click(within(details).getByRole('button', { name: 'Leave this and look the company up yourself' }))
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
    expect(await screen.findByText('Nexa Staffing — Careers')).toBeTruthy()
  }, 20000)

  it('sends the suggested YES at one tap', async () => {
    const user = userEvent.setup()
    startAt('S13', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'YES')
    await waitFor(() => expect(sentIntents()).toEqual(['reply']))
  }, 20000)

  it('raises the deposit sheet from the task site and pays a person', async () => {
    const user = userEvent.setup()
    startAt('S13', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Open the address')
    const site = await surface()
    expect(within(site).getByText('INR 800 — held until step 3')).toBeTruthy()
    await user.click(within(site).getByRole('button', { name: 'Pay the refundable deposit' }))
    const sheet = await surface()
    expect(within(sheet).getByText('K SHARMA')).toBeTruthy()
    expect(posts()).toHaveLength(0)
    await user.type(within(sheet).getByLabelText('UPI PIN'), '551903')
    await clickName(user, 'Pay INR 1,499 to activate')
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_payment']))
    noTypedValueSent(['551903'])
  }, 25000)

  it('keeps the payout account on the page it is typed on', async () => {
    const user = userEvent.setup()
    startAt('S13', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Open the address')
    const site = await surface()
    await user.click(within(site).getByRole('button', { name: 'Add your payout account' }))
    const page = await surface()
    const inputs = within(page).getAllByRole('textbox')
    await user.type(inputs[0], 'Meera Pillai')
    await user.type(inputs[1], '550011223344')
    await user.type(inputs[2], 'meera@trainpay')
    await clickName(user, 'Save the payout account')
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    noTypedValueSent(['Meera Pillai', '550011223344', 'meera@trainpay'])
  }, 25000)
})

describe('S14 - the unit has recalled you before', () => {
  it('walks notify to resolve through Alerts and the duty office, with a rationale', async () => {
    const user = userEvent.setup()
    startAt('S14', 'notify')
    await clickName(user, /^Open \+91 00000 35758, in /)
    await clickName(user, OPEN_ROW.S14)
    await screen.findByTestId('sms-thread')
    await user.click(await screen.findByTestId('sms-header'))
    await clickName(user, 'Messages from VM-FALCON')
    expect((await screen.findAllByText(/RC-0812/)).length).toBeGreaterThan(0)
    // The unit's thread was pushed on top of the details screen: Back twice.
    await user.click(within(await surface()).getAllByRole('button')[0])
    await leaveSurface(user)
    await openMenu(user)
    await clickName(user, 'Leave it and check Alerts in the Unit Portal')
    await settled(4)
    expect(await screen.findByText('No active recall')).toBeTruthy()
    await leaveSurface(user)
    await openMenu(user)
    await clickName(user, 'Call the duty office on the number in the unit directory')
    await settled(5)
    expect((await screen.findAllByText('Unit Falcon — duty office')).length).toBeGreaterThan(0)
    await user.click(await screen.findByRole('button', { name: 'Back to the conversation' }))
    await waitFor(() => expect(screen.queryByTestId('scene-surface')).toBeNull())
    const reason = await screen.findByRole('textbox')
    await user.type(reason, 'No reference and the portal has no recall')
    await clickName(user, 'Report it through unit security and share nothing')

    await waitFor(() => expect(sentIntents()).toEqual([
      'open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_number', 'resolve_report',
    ]))
  }, 30000)

  it('reaches the browser’s own location prompt without deciding, and Allow is the release', async () => {
    const user = userEvent.setup()
    startAt('S14', 'branch')
    await screen.findByTestId('sms-thread')
    await openMenu(user)
    await clickName(user, 'Open the address in the browser')
    const page = await surface()
    await user.click(within(page).getByRole('button', { name: 'Share live position' }))
    const prompt = await surface()
    expect(within(prompt).getByText(/use this device’s location\?/)).toBeTruthy()
    expect(posts()).toHaveLength(0)
    await clickName(user, 'Allow')
    await waitFor(() => expect(sentIntents()).toEqual(['share_location']))
    expect(document.body.innerHTML).not.toMatch(/geolocation|getCurrentPosition/)
  }, 20000)

  it('keeps the recall form’s position and route on the page', async () => {
    const user = userEvent.setup()
    startAt('S14', 'branch')
    await screen.findByTestId('sms-thread')
    await openMenu(user)
    await clickName(user, 'Open the address in the browser')
    await user.click(within(await surface()).getByRole('button', { name: 'Confirm by form instead' }))
    const form = await surface()
    const inputs = within(form).getAllByRole('textbox')
    await user.type(inputs[0], 'TR-SVC-7710')
    await user.type(inputs[1], 'Near the old market')
    await user.type(inputs[2], 'Ring road north')
    await user.type(inputs[3], '1730')
    await clickName(user, 'Confirm my recall')
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    noTypedValueSent(['TR-SVC-7710', 'old market', 'Ring road'])
  }, 25000)

  it('scores the open from the link card', async () => {
    const user = userEvent.setup()
    startAt('S14', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Open the address')
    await waitFor(() => expect(sentIntents()).toEqual(['open_link']))
  }, 20000)
})

describe('S15 - a picture message sent to a list you can read', () => {
  it('lists twelve people, eight of them in order', async () => {
    const user = userEvent.setup()
    startAt('S15', 'branch')
    await screen.findByTestId('sms-thread')
    expect(await screen.findByTestId('sms-attachment-card')).toBeTruthy()
    await user.click(await screen.findByTestId('sms-header'))
    await clickName(user, 'Show all 12 people')
    for (const number of ['+91 00000 40011', '+91 00000 40018']) expect(await screen.findByText(number)).toBeTruthy()
    expect(posts()).toHaveLength(0)
  }, 20000)

  it('reads the code in the picture viewer, where opening it is the decision', async () => {
    const user = userEvent.setup()
    startAt('S15', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'View the picture')
    const viewer = await surface()
    expect(within(viewer).getAllByText(/s15\.training\.example/).length).toBeGreaterThan(0)
    expect(posts()).toHaveLength(0)
    await user.click(within(viewer).getByRole('button', { name: 'Open the address in the code' }))
    await waitFor(() => expect(sentIntents()).toEqual(['scan_qr']))
    expect(document.body.innerHTML).not.toMatch(/<img|<video|getUserMedia/)
  }, 20000)

  it('reaches the card PIN page without spending the branch, and nothing typed leaves it', async () => {
    const user = userEvent.setup()
    startAt('S15', 'branch')
    await screen.findByTestId('sms-thread')
    await openMenu(user)
    await clickName(user, 'Open the address from the picture in the browser')
    await user.click(within(await surface()).getByRole('button', { name: 'Link my canteen card' }))
    const card = await surface()
    expect(posts()).toHaveLength(0)
    const inputs = within(card).getAllByRole('textbox')
    await user.type(inputs[0], '7788990011')
    await user.type(inputs[1], '4821')
    await clickName(user, 'Link the card and activate INR 2,000')
    await waitFor(() => expect(sentIntents()).toEqual(['share_secret']))
    noTypedValueSent(['7788990011', '4821'])
  }, 25000)

  it('prices a reply that goes to all twelve', async () => {
    const user = userEvent.setup()
    startAt('S15', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, /^Reply to everyone asking if it worked/)
    await user.click(await screen.findByRole('button', { name: /^Send "Has anyone/ }))
    await waitFor(() => expect(sentIntents()).toEqual(['reply']))
  }, 20000)

  it('walks the safe route through the canteen app', async () => {
    const user = userEvent.setup()
    startAt('S15', 'inspect')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'Look at the picture')
    await settled(1)
    await leaveSurface(user)
    await openMenu(user)
    await clickName(user, 'Leave it and open your canteen app instead')
    await settled(2)
    expect(await screen.findByText('No subsidy running')).toBeTruthy()
    await leaveSurface(user)
    await openMenu(user)
    await clickName(user, /^Open your canteen app and check benefits/)
    await settled(3)
    await leaveSurface(user)
    await clickName(user, 'Report it and tell unit security the canteen name is being used')
    await waitFor(() => expect(sentIntents()).toEqual([
      'inspect_qr', 'safe_pivot', 'verify_known_app', 'resolve_report',
    ]))
  }, 25000)
})

describe('the engine still owns the run', () => {
  it('replays a lost response instead of scoring the open twice', async () => {
    const user = userEvent.setup()
    startAt('S13', 'open')
    server.dropNextResponse = true
    await clickName(user, OPEN_ROW.S13)
    expect(await screen.findByText(/Cannot reach the training server/)).toBeTruthy()
    await clickName(user, OPEN_ROW.S13)
    await screen.findByTestId('sms-thread')
    expect(server.sequence).toBe(1)
    const keys = posts().map((call) => call.body.intent_key)
    expect(keys).toHaveLength(2)
    expect(new Set(keys).size).toBe(1)
  }, 20000)

  it('rebuilds at the verify stage after a remount, with no replay', async () => {
    startAt('S14', 'verify')
    await screen.findByTestId('sms-thread')
    const before = posts().length
    cleanup()
    renderSimulation()
    await screen.findByTestId('sms-thread')
    expect(posts()).toHaveLength(before)
  })

  it('does not restore a pushed browser surface after a remount', async () => {
    const user = userEvent.setup()
    startAt('S12', 'branch')
    await screen.findByTestId('sms-thread')
    await clickName(user, 'See where this address goes')
    await clickName(user, 'Load the page in the browser')
    await surface()
    cleanup()
    renderSimulation()
    await screen.findByTestId('sms-thread')
    expect(screen.queryByTestId('scene-surface')).toBeNull()
    expect(posts()).toHaveLength(0)
  }, 20000)

  it('shows the stale notice when the run has moved on', async () => {
    const user = userEvent.setup()
    startAt('S11', 'branch')
    await screen.findByTestId('sms-thread')
    server.failNextWith = {
      code: 'STALE_STATE', status: 409, details: { current_stage: 'verify', last_sequence: 4 },
    }
    await clickName(user, /^Reply 1 to confirm/)
    await clickName(user, 'Send "1"')
    expect(await screen.findByText(/This scenario moved on/)).toBeTruthy()
  }, 20000)

  it('refuses a control prepared for another stage without moving the run', async () => {
    const user = userEvent.setup()
    startAt('S15', 'branch')
    await screen.findByTestId('sms-thread')
    server.stage = 'verify'
    await openMenu(user)
    await clickName(user, 'Leave it and open your canteen app instead')
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

describe('no S11-S15 scene leaks what a control means', () => {
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
