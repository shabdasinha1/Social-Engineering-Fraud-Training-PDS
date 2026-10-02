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
 * Email E16 to E20, end to end, through the real controller and the attempt API
 * (IMMERSIVE-008) - the fourth Email batch.
 *
 * Same posture as the E01-E15 suites: the fake server owns the stage, so a test advances a
 * scenario only by making the server accept a control. The point here is the batch's new
 * Email-native decisions - the signed notice's calendar file, the phone's own dial dialog, a
 * reply whose To line is the other Reply-To and the Payables app, a questionnaire released from
 * its document bar, and a portal whose upload and payment type nothing - and that local
 * navigation, recovery and retries never score twice or leak an engine word.
 */

configure({ asyncUtilTimeout: 4000 })

const BANK = (() => {
  const path = resolve(process.cwd(), '../backend/data/synthetic/v1/synthetic.email.json')
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

const IDS = ['E16', 'E17', 'E18', 'E19', 'E20']
const posts = () => server.calls.filter((call) => call.method === 'POST')
const sentIntents = () => posts().map((call) => call.intent)
const openMenu = async (user) => user.click(await screen.findByRole('button', { name: 'More options' }))
const clickName = async (user, name) => user.click(await screen.findByRole('button', { name }))
const surface = () => screen.findByTestId('scene-surface')
/** Walks back out of a pushed screen with its own Back / Close control. */
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
  E16: 'Open the IT Operations notice',
  E17: 'Open the renewal receipt',
  E18: 'Open the NS-104 thread',
  E19: 'Open Dr. Sen’s invitation',
  E20: 'Open the summons email',
}

describe('the mail app renders for every E16-E20 scene', () => {
  it.each(IDS)('%s opens on the inbox at the open stage', async (id) => {
    startAt(id, 'open')
    expect(await screen.findByTestId('mail-list')).toBeTruthy()
    expect(await screen.findByRole('button', { name: OPEN_ROW[id] })).toBeTruthy()
    expect(posts()).toHaveLength(0)
  })
})

describe('E16 - the signed maintenance notice, all six stages', () => {
  it('walks notify to resolve on the normal path and keeps the notice', async () => {
    const user = userEvent.setup()
    startAt('E16', 'notify')

    // Notify: the toast routes into the scenario.
    await clickName(user, /^Open IT Operations, in /)
    // Open: the inbox row opens the notice.
    await clickName(user, OPEN_ROW.E16)
    await screen.findByTestId('mail-thread')
    // Inspect: the sender line opens the details, with the signature row.
    await user.click(await screen.findByTestId('mail-sender'))
    expect(await screen.findByText('Digital signature')).toBeTruthy()
    await leaveSurface(user)
    // Branch: the calendar file's own Add reminder; the calendar opens after acceptance.
    await clickName(user, 'Add reminder')
    expect(await screen.findByText('Reminder added')).toBeTruthy()
    await leaveSurface(user)
    // Verify: the IT status board shows the same change number.
    await openMenu(user)
    await clickName(user, /Compare CHG-118 with the IT status board/)
    expect((await screen.findAllByText(/CHG-118/)).length).toBeGreaterThan(0)
    await leaveSurface(user)
    // Resolve: archive it from the banner.
    await clickName(user, 'Archive the notice')

    await waitFor(() => expect(sentIntents()).toEqual([
      'open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_continue',
    ]))
    for (const call of posts()) {
      expect(call.body).not.toHaveProperty('intent')
      expect(String(call.body.action_code)).toMatch(/^ac_[0-9a-f]{20}$/)
    }
  })

  it('shows the details and the original headers as local navigation that records nothing', async () => {
    const user = userEvent.setup()
    startAt('E16', 'branch')
    await screen.findByTestId('mail-thread')

    await openMenu(user)
    await clickName(user, 'Show message details')
    await clickName(user, /Show original/)
    expect(await screen.findByTestId('mail-original')).toBeTruthy()
    expect(posts()).toHaveLength(0)
    expect(server.stage).toBe('branch')
  })

  it('operates the Add reminder control from the keyboard', async () => {
    const user = userEvent.setup()
    startAt('E16', 'branch')
    await screen.findByTestId('mail-thread')

    const reminder = await screen.findByRole('button', { name: 'Add reminder' })
    reminder.focus()
    expect(document.activeElement).toBe(reminder)
    await user.keyboard('{Enter}')
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
  })
})

describe('E17 - the callback number decides on the phone’s own dialog', () => {
  it('tapping the number only raises the dialog; Cancel is the decision', async () => {
    const user = userEvent.setup()
    startAt('E17', 'branch')
    await screen.findByTestId('mail-thread')

    await clickName(user, /Call \+91 00000 17340/)
    const dialog = await surface()
    expect(within(dialog).getByText(/Call \+91 00000 17340\?/)).toBeTruthy()
    // Raising the dialog recorded nothing.
    expect(posts()).toHaveLength(0)

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
  })

  it('calling connects to a desk that asks for remote access, and nothing there can be pressed', async () => {
    const user = userEvent.setup()
    startAt('E17', 'branch')
    await screen.findByTestId('mail-thread')

    await clickName(user, /Call \+91 00000 17340/)
    await user.click(within(await surface()).getByRole('button', { name: 'Call' }))
    await waitFor(() => expect(sentIntents()).toEqual(['call_number']))
    expect(await screen.findByText('Cancellation desk')).toBeTruthy()
    expect(document.body.innerHTML).not.toMatch(/<audio|<video|getUserMedia/)
  })
})

describe('E18 - the reply fills its To line from the other Reply-To', () => {
  it('shows the Reply-To address in the compose sheet and sends only an opaque code', async () => {
    const user = userEvent.setup()
    startAt('E18', 'branch')
    await screen.findByTestId('mail-thread')

    await clickName(user, 'Reply')
    const head = await screen.findByTestId('mail-compose-head')
    expect(within(head).getByText('accounts.northstar@e18.training.example')).toBeTruthy()
    await clickName(user, /Reply that you will use the recovery account/)
    await clickName(user, /^Send "/)
    await waitFor(() => expect(sentIntents()).toEqual(['reply']))
  })

  it('opens Payables locally, then holds NS-104 there', async () => {
    const user = userEvent.setup()
    startAt('E18', 'branch')
    await screen.findByTestId('mail-thread')

    await openMenu(user)
    await clickName(user, 'Open NS-104 in Payables')
    const app = await surface()
    expect(within(app).getByText('INR 1,86,000')).toBeTruthy()
    expect(posts()).toHaveLength(0)

    await user.click(within(app).getByRole('button', { name: 'Put NS-104 on hold' }))
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
  })

  it('resyncs on a stale stage instead of replaying the hold', async () => {
    const user = userEvent.setup()
    startAt('E18', 'branch')
    await screen.findByTestId('mail-thread')

    server.stage = 'verify'
    server.failNextWith = { code: 'STALE_STATE', status: 409, details: { current_stage: 'verify', last_sequence: 4 } }
    await openMenu(user)
    await clickName(user, 'Open NS-104 in Payables')
    await user.click(within(await surface()).getByRole('button', { name: 'Put NS-104 on hold' }))

    expect(await screen.findByText(/This scenario moved on/)).toBeTruthy()
    expect(posts()).toHaveLength(1)
  })
})

describe('E19 - the questionnaire is released from its own document bar', () => {
  it('lists the questions and records the release without a single field', async () => {
    const user = userEvent.setup()
    startAt('E19', 'branch')
    await screen.findByTestId('mail-thread')

    await openMenu(user)
    await clickName(user, 'Open the questionnaire')
    const doc = await surface()
    expect(within(doc).getByText(/typical week/)).toBeTruthy()
    expect(within(doc).getByTestId('mail-bar')).toBeTruthy()
    expect(screen.queryAllByRole('textbox')).toHaveLength(0)

    await user.click(within(doc).getByRole('button', { name: 'Fill it in and send it back' }))
    await waitFor(() => expect(sentIntents()).toEqual(['share_secret']))
  })

  it('replays a lost response instead of scoring the open twice', async () => {
    const user = userEvent.setup()
    startAt('E19', 'open')

    server.dropNextResponse = true
    await clickName(user, OPEN_ROW.E19)
    expect(await screen.findByText(/Cannot reach the training server/)).toBeTruthy()
    await clickName(user, OPEN_ROW.E19)

    await screen.findByTestId('mail-thread')
    expect(server.sequence).toBe(1)
    const keys = posts().map((call) => call.body.intent_key)
    expect(keys).toHaveLength(2)
    expect(new Set(keys).size).toBe(1)
  })
})

describe('E20 - the bond portal types nothing', () => {
  it('walks to the upload page by link and records the upload with no field', async () => {
    const user = userEvent.setup()
    startAt('E20', 'branch')
    await screen.findByTestId('mail-thread')

    await openMenu(user)
    await clickName(user, 'Go to the case portal')
    await surface()
    await clickName(user, /Upload documents/)
    expect(await screen.findByText('Bank statements')).toBeTruthy()
    expect(screen.queryAllByRole('textbox')).toHaveLength(0)
    expect(posts()).toHaveLength(0)

    await clickName(user, 'Upload the documents')
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    expect(await screen.findByText('Documents received')).toBeTruthy()
    for (const call of posts()) expect(Object.keys(call.body.metadata ?? {})).not.toContain('file')
  })

  it('rebuilds at the verify stage after a remount, with no replay', async () => {
    startAt('E20', 'verify')
    await screen.findByTestId('mail-thread')
    const before = posts().length
    cleanup()
    renderSimulation()
    await screen.findByTestId('mail-thread')
    expect(posts()).toHaveLength(before)
  })
})

describe('no E16-E20 scene leaks what a control means', () => {
  it.each(IDS)('%s renders no engine vocabulary in the DOM at inspect or branch', async (id) => {
    for (const stage of ['inspect', 'branch']) {
      startAt(id, stage)
      await screen.findByTestId('mail-thread')
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
    await screen.findByTestId('mail-thread')
    for (const button of screen.getAllByRole('button')) {
      const name = (button.getAttribute('aria-label') || button.textContent || '').trim()
      expect(name.length, `${id} has an unnamed button`).toBeGreaterThan(0)
    }
  })
})
