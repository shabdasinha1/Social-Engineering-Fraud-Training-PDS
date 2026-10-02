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
 * SMS S06 to S10, end to end, through the real controller and the attempt API
 * (IMMERSIVE-011) - the second SMS batch.
 *
 * Same posture as `SceneScenariosSms.test.jsx`: the fake server owns the stage, so a test
 * advances a scenario only by making the server accept a control. What is new here is what the
 * five scenes ask of the phone - a composer and a photo picker with no page anywhere (S06), a
 * search-results page reached instead of the provider's own app (S07), a dual-SIM delivery and
 * the phone's own spam folder (S08), six days of thread with the learner's own replies in it
 * (S09), and a second SMS conversation - the carrier's - where both releases are made (S10).
 *
 * The reachability rule IMMERSIVE-009 found by hand-play is exercised here rather than assumed:
 * every scored `-8` in this batch is reached by clicking through the UI, with the branch
 * unspent, and the tests below fail if a release can only be arrived at by spending another.
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

const IDS = ['S06', 'S07', 'S08', 'S09', 'S10']
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
  S06: 'Open the message',
  S07: 'Open the receipt',
  S08: 'Open the message',
  S09: 'Open the conversation',
  S10: 'Open the message',
}

describe('the Messages app renders for every S06-S10 scene', () => {
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
    const html = document.body.innerHTML
    expect(html).not.toMatch(/last seen|Forwarded|online|typing/i)
    expect(screen.queryByTestId('voice-note')).toBeNull()
    cleanup()
  })
})

describe('S06 - the composer is the attack surface, all six stages', () => {
  it('walks notify to resolve and leaves the text for the unit portal', async () => {
    const user = userEvent.setup()
    startAt('S06', 'notify')

    await clickName(user, /^Open Unit Records, in /)
    await clickName(user, OPEN_ROW.S06)
    await screen.findByTestId('sms-thread')
    expect(await screen.findByTestId('sms-spam-bar')).toBeTruthy()
    // Inspect: the details screen names the unit's own registered sender ID.
    await user.click(await screen.findByTestId('sms-header'))
    expect(await screen.findByText(/VM-FALCON/)).toBeTruthy()
    await leaveSurface(user)
    // Branch: leave it and open the unit portal.
    await openMenu(user)
    await clickName(user, 'Leave it and open the unit portal instead')
    expect(await screen.findByText('Active — nothing outstanding')).toBeTruthy()
    await leaveSurface(user)
    // Verify: the approved directory.
    await openMenu(user)
    await clickName(user, /Look up .* in the trusted directory/)
    await user.click(await screen.findByRole('button', { name: 'Close Trusted directory' }))
    // Resolve.
    await clickName(user, 'Report it through unit security and send nothing')

    await waitFor(() => expect(sentIntents()).toEqual([
      'open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_trusted_directory', 'resolve_report',
    ]))
    for (const call of posts()) {
      expect(call.body).not.toHaveProperty('intent')
      expect(String(call.body.action_code)).toMatch(/^ac_[0-9a-f]{20}$/)
    }
  }, 25000)

  it('carries no address and no number anywhere in the thread', async () => {
    startAt('S06', 'branch')
    await screen.findByTestId('sms-thread')
    expect(screen.queryByTestId('sms-link-card')).toBeNull()
    expect(screen.queryByTestId('sms-number-card')).toBeNull()
  })

  it('sends the identity line from the composer in two steps, and nothing else', async () => {
    const user = userEvent.setup()
    startAt('S06', 'branch')
    await screen.findByTestId('sms-thread')

    // Choosing the chip is local: it only puts the text in the field.
    await clickName(user, /^Send the service number and date of birth/)
    expect((await screen.findByTestId('sms-compose-body')).textContent).toContain('TR-SVC-448210')
    expect(posts()).toHaveLength(0)

    await user.click(await screen.findByRole('button', { name: /^Send "Svc No/ }))
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
  }, 20000)

  it('reaches the photo picker without spending the branch, and attaching is the release', async () => {
    const user = userEvent.setup()
    startAt('S06', 'branch')
    await screen.findByTestId('sms-thread')

    // The picker is opened by local navigation from the app's own menu.
    await openMenu(user)
    await clickName(user, 'Attach a photo')
    const picker = await surface()
    expect(within(picker).getAllByText('Identity card, front').length).toBeGreaterThan(0)
    expect(posts()).toHaveLength(0)

    // Choosing a different photo is local too.
    await clickName(user, /Parking receipt/)
    expect(posts()).toHaveLength(0)

    await clickName(user, 'Attach this photograph and send it')
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    // Nothing loaded, nothing executed: the picker holds no image file.
    expect(document.body.innerHTML).not.toMatch(/<img|<video|<audio|src=/)
  }, 20000)

  it('offers the safe close on the same screen as the release', async () => {
    const user = userEvent.setup()
    startAt('S06', 'branch')
    await screen.findByTestId('sms-thread')
    await openMenu(user)
    await clickName(user, 'Attach a photo')
    const picker = await surface()
    expect(within(picker).getByRole('button', { name: 'Attach this photograph and send it' })).toBeTruthy()
    await clickName(user, 'Close the picker and attach nothing')
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
  }, 20000)
})

describe('S07 - the legitimate receipt, and what the learner does next', () => {
  it('shows a registered sender ID, a year of the same thread and no spam bar', async () => {
    startAt('S07', 'branch')
    const thread = await screen.findByTestId('sms-thread')
    expect(within(thread).getByText('Earlier this month')).toBeTruthy()
    expect(within(thread).getByText('Today')).toBeTruthy()
    expect(await screen.findByTestId('sms-amount-card')).toBeTruthy()
    expect(screen.queryByTestId('sms-link-card')).toBeNull()
    expect(screen.queryByTestId('sms-spam-bar')).toBeNull()
  })

  it('names the gateway number behind the header only on the details screen', async () => {
    const user = userEvent.setup()
    startAt('S07', 'inspect')
    await screen.findByTestId('sms-thread')

    await user.click(await screen.findByTestId('sms-header'))
    expect(await screen.findByText('+91 00000 88047')).toBeTruthy()
    expect(await screen.findByText(/Registered sender ID, six characters/)).toBeTruthy()
    await waitFor(() => expect(sentIntents()).toEqual(['inspect_sender']))
  })

  it('matches the receipt against the recharge in the provider app', async () => {
    const user = userEvent.setup()
    startAt('S07', 'branch')
    await screen.findByTestId('sms-thread')

    await clickName(user, 'Open this recharge in your provider app')
    const app = await surface()
    expect(within(app).getByText('TC-2609-77104')).toBeTruthy()
    expect(posts()).toHaveLength(0)

    await clickName(user, 'Match it against the recharge in your account')
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
  }, 20000)

  it('puts the priced switch on a page of paid listings, reachable without deciding', async () => {
    const user = userEvent.setup()
    startAt('S07', 'branch')
    await screen.findByTestId('sms-thread')

    await openMenu(user)
    await clickName(user, /Search the web for the provider/)
    const page = await surface()
    expect(within(page).getAllByText('Sponsored').length).toBeGreaterThanOrEqual(2)
    expect(posts()).toHaveLength(0)

    await clickName(user, 'Call +91 00000 51660')
    await waitFor(() => expect(sentIntents()).toEqual(['call_number']))
  }, 20000)
})

describe('S08 - the message that was sent to a list', () => {
  it('states the dual-SIM delivery in the thread and on the details screen', async () => {
    const user = userEvent.setup()
    startAt('S08', 'inspect')
    const thread = await screen.findByTestId('sms-thread')
    expect(within(thread).getByText(/delivered to SIM 2/i)).toBeTruthy()

    await user.click(await screen.findByTestId('sms-header'))
    expect(await screen.findByText('SIM 1 and SIM 2, both at 16:25:04')).toBeTruthy()
  })

  it('reaches the spam folder from the app’s own unsaved-sender bar', async () => {
    const user = userEvent.setup()
    startAt('S08', 'branch')
    await screen.findByTestId('sms-thread')

    const bar = await screen.findByTestId('sms-spam-bar')
    const compare = within(bar).getByRole('button', { name: /Compare it with the others/ })
    await user.click(compare)
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
    const folder = await surface()
    expect(within(folder).getAllByText(/CONGRATS!/).length).toBeGreaterThanOrEqual(4)
  }, 20000)

  it('reaches BOTH releases without spending the branch, and harvests nothing', async () => {
    const user = userEvent.setup()
    startAt('S08', 'branch')
    await screen.findByTestId('sms-thread')

    // The claim site is opened by local navigation, so the first page is free.
    await openMenu(user)
    await clickName(user, 'Open the address in the browser')
    const page = await surface()
    expect(within(page).getByTestId('browser-address').textContent).toContain('s08.training.example')

    // The fee page is an ordinary in-page link away - not behind the first release.
    await user.click(within(page).getByRole('button', { name: /Already sent your details/ }))
    const fee = await surface()
    expect(within(fee).getByText('INR 5,00,000')).toBeTruthy()
    expect(posts()).toHaveLength(0)

    const inputs = within(fee).getAllByRole('textbox')
    expect(inputs.length).toBeGreaterThanOrEqual(2)
    await user.type(inputs[0], 'winner@trainpay')
    await user.type(inputs[1], '774120')
    await clickName(user, 'Pay the INR 499 release fee')

    await waitFor(() => expect(sentIntents()).toEqual(['attempt_payment']))
    const body = JSON.stringify(posts()[0].body)
    for (const typed of ['winner@trainpay', '774120']) expect(body).not.toContain(typed)
    expect(window.localStorage.length).toBe(0)
    expect(window.sessionStorage.length).toBe(0)
  }, 25000)

  it('keeps the winner details on the page they are typed on', async () => {
    const user = userEvent.setup()
    startAt('S08', 'branch')
    await screen.findByTestId('sms-thread')

    await openMenu(user)
    await clickName(user, 'Open the address in the browser')
    const page = await surface()
    const inputs = within(page).getAllByRole('textbox')
    await user.type(inputs[0], 'Asha Menon')
    await user.type(inputs[1], 'TRNG9921')
    await user.type(inputs[2], '441700229914')
    await clickName(user, 'Submit the winner details')

    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    const body = JSON.stringify(posts()[0].body)
    for (const typed of ['Asha Menon', 'TRNG9921', '441700229914']) expect(body).not.toContain(typed)
  }, 25000)
})

describe('S09 - six days, and the learner’s own replies', () => {
  it('draws the learner’s own messages and three day dividers', async () => {
    startAt('S09', 'branch')
    const thread = await screen.findByTestId('sms-thread')
    expect(within(thread).getByText('Monday')).toBeTruthy()
    expect(within(thread).getByText('Wednesday')).toBeTruthy()
    expect(within(thread).getByText('Today')).toBeTruthy()
    expect(within(thread).getByText('Wrong number, I am afraid. No Rohan here.')).toBeTruthy()
  })

  it('lays the six days out, attributed, on the details screen', async () => {
    const user = userEvent.setup()
    startAt('S09', 'inspect')
    await screen.findByTestId('sms-thread')

    await user.click(await screen.findByTestId('sms-header'))
    expect(await screen.findByText('The other number')).toBeTruthy()
    await clickName(user, 'Read the six days in order')
    expect(await screen.findByText(/First mention of not needing to work/)).toBeTruthy()
    await waitFor(() => expect(sentIntents()).toEqual(['inspect_sender']))
  }, 20000)

  it('raises the payment sheet from the desk’s own button and pays a person', async () => {
    const user = userEvent.setup()
    startAt('S09', 'branch')
    await screen.findByTestId('sms-thread')

    // The desk is local navigation from the link card.
    await clickName(user, 'Open the address')
    const desk = await surface()
    expect(within(desk).getByText('+18.4%')).toBeTruthy()
    expect(posts()).toHaveLength(0)

    // Its Deposit link raises the phone's own sheet. Still nothing recorded.
    await user.click(within(desk).getByRole('button', { name: /Deposit and unlock withdrawal/ }))
    const sheet = await surface()
    expect(within(sheet).getByText('M R AGARWAL')).toBeTruthy()
    expect(within(sheet).getByText('Individual savings')).toBeTruthy()
    expect(posts()).toHaveLength(0)

    await user.type(within(sheet).getByLabelText('UPI PIN'), '338104')
    await clickName(user, 'Send the deposit')
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_payment']))
    expect(JSON.stringify(posts()[0].body)).not.toContain('338104')
  }, 25000)

  it('finds no such desk in the register the learner opens', async () => {
    const user = userEvent.setup()
    startAt('S09', 'branch')
    await screen.findByTestId('sms-thread')

    await openMenu(user)
    await clickName(user, /Leave the thread and look the desk up/)
    const register = await surface()
    expect(within(register).getByText('No registered intermediary found')).toBeTruthy()
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
  }, 20000)
})

describe('S10 - the warning is already on the phone', () => {
  it('carries a number card and no link card', async () => {
    startAt('S10', 'branch')
    await screen.findByTestId('sms-thread')
    expect(await screen.findByTestId('sms-number-card')).toBeTruthy()
    expect(screen.queryByTestId('sms-link-card')).toBeNull()
  })

  it('reaches the carrier’s own thread without deciding, and both releases are there', async () => {
    const user = userEvent.setup()
    startAt('S10', 'branch')
    await screen.findByTestId('sms-thread')

    await openMenu(user)
    await clickName(user, /Open the messages from VM-NOVCEL/)
    const carrier = await surface()
    expect(within(carrier).getByText(/DO NOT SHARE/)).toBeTruthy()
    expect(posts()).toHaveLength(0)
    // Both scored releases are on this screen, with the branch unspent.
    expect(within(carrier).getByRole('button', { name: /Send the six digits/ })).toBeTruthy()
    expect(within(carrier).getByRole('button', { name: /Reply YES to approve/ })).toBeTruthy()

    await clickName(user, /Send the six digits/)
    await waitFor(() => expect(sentIntents()).toEqual(['share_secret']))
  }, 20000)

  it('approves the transfer from the same screen, as its own decision', async () => {
    const user = userEvent.setup()
    startAt('S10', 'branch')
    await screen.findByTestId('sms-thread')
    await openMenu(user)
    await clickName(user, /Open the messages from VM-NOVCEL/)
    await clickName(user, /Reply YES to approve/)
    await waitFor(() => expect(sentIntents()).toEqual(['approve_device_link']))
  }, 20000)

  it('tapping the number raises the dialer; calling is the decision', async () => {
    const user = userEvent.setup()
    startAt('S10', 'branch')
    await screen.findByTestId('sms-thread')

    await clickName(user, /^Call \+91 00000 31010$/)
    const dialog = await surface()
    expect(within(dialog).getByText(/Call \+91 00000 31010\?/)).toBeTruthy()
    // Raising the dialog recorded nothing.
    expect(posts()).toHaveLength(0)

    await clickName(user, 'Call')
    await waitFor(() => expect(sentIntents()).toEqual(['call_number']))
    expect(await screen.findByText('SIM upgrade desk')).toBeTruthy()
    expect(document.body.innerHTML).not.toMatch(/<audio|<video|getUserMedia|navigator\.mediaDevices/)
  }, 20000)

  it('walks notify to resolve on the safe route', async () => {
    const user = userEvent.setup()
    startAt('S10', 'notify')

    await clickName(user, /^Open \+91 00000 87986, in /)
    await clickName(user, OPEN_ROW.S10)
    await screen.findByTestId('sms-thread')
    await user.click(await screen.findByTestId('sms-header'))
    expect((await screen.findAllByText(/VM-NOVCEL/)).length).toBeGreaterThan(0)
    await leaveSurface(user)
    await openMenu(user)
    await clickName(user, 'Leave it and open your carrier app instead')
    expect(await screen.findByText('Active — no change requested')).toBeTruthy()
    await leaveSurface(user)
    await openMenu(user)
    await clickName(user, /Open your carrier app and check for a SIM change/)
    await leaveSurface(user)
    await clickName(user, 'Report it as junk and keep the number locked')

    await waitFor(() => expect(sentIntents()).toEqual([
      'open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_report',
    ]))
  }, 25000)
})

describe('the engine still owns the run', () => {
  it('replays a lost response instead of scoring the open twice', async () => {
    const user = userEvent.setup()
    startAt('S08', 'open')

    server.dropNextResponse = true
    await clickName(user, OPEN_ROW.S08)
    expect(await screen.findByText(/Cannot reach the training server/)).toBeTruthy()
    await clickName(user, OPEN_ROW.S08)

    await screen.findByTestId('sms-thread')
    expect(server.sequence).toBe(1)
    const keys = posts().map((call) => call.body.intent_key)
    expect(keys).toHaveLength(2)
    expect(new Set(keys).size).toBe(1)
  }, 20000)

  it('rebuilds at the verify stage after a remount, with no replay', async () => {
    startAt('S09', 'verify')
    await screen.findByTestId('sms-thread')
    const before = posts().length
    cleanup()
    renderSimulation()
    await screen.findByTestId('sms-thread')
    expect(posts()).toHaveLength(before)
  })

  it('shows the stale notice and reloads the view when the run has moved on', async () => {
    const user = userEvent.setup()
    startAt('S07', 'branch')
    await screen.findByTestId('sms-thread')

    server.failNextWith = {
      code: 'STALE_STATE', status: 409, details: { current_stage: 'verify', last_sequence: 4 },
    }
    await clickName(user, 'Open this recharge in your provider app')
    await clickName(user, 'Match it against the recharge in your account')
    expect(await screen.findByText(/This scenario moved on/)).toBeTruthy()
  }, 20000)

  it('refuses a control prepared for another stage without moving the run', async () => {
    const user = userEvent.setup()
    startAt('S06', 'branch')
    await screen.findByTestId('sms-thread')

    // The server's own stage check: a verify control sent while the run is at branch.
    server.stage = 'verify'
    await openMenu(user)
    await clickName(user, 'Leave it and open the unit portal instead')
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
      // Opening and closing the overflow sheet, and walking to the details screen, are free.
      await user.keyboard('{Escape}')
      await openMenu(user)
      await clickName(user, 'Conversation details')
      await leaveSurface(user)
      expect(posts(), id).toHaveLength(0)
      cleanup()
    }
  }, 30000)
})

describe('no S06-S10 scene leaks what a control means', () => {
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
