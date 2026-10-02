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
 * Email E06 to E10, end to end, through the real controller and the attempt API
 * (IMMERSIVE-006) - the second Email batch.
 *
 * Same posture as the E01-E05 suite: the fake server owns the stage, so a test advances a
 * scenario only by making the server accept a control. The point here is the batch's new
 * Email-native mechanics - the calendar invite card, the reply composer with a roster
 * attachment, the gift-card codes surface and the vendor-master edit - and that nothing the
 * learner types or any engine word ever leaves the client.
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

const posts = () => server.calls.filter((call) => call.method === 'POST')
const sentIntents = () => posts().map((call) => call.intent)
const openMenu = async (user) => user.click(await screen.findByRole('button', { name: 'More options' }))
const clickName = async (user, name) => user.click(await screen.findByRole('button', { name }))
const surface = () => screen.findByTestId('scene-surface')

afterEach(() => {
  cleanup()
  server = undefined
})

const OPEN_ROW = {
  E06: 'Open the message from Unit Adjutant',
  E07: 'Open the training invite',
  E08: 'Open the refund email',
  E09: 'Open the message from Col. Dev',
  E10: 'Open the vendor email',
}

describe('the mail app renders for every E06-E10 scene', () => {
  it.each(['E06', 'E07', 'E08', 'E09', 'E10'])('%s opens on the inbox at the open stage', async (id) => {
    startAt(id, 'open')
    expect(await screen.findByTestId('mail-list')).toBeTruthy()
    expect(await screen.findByRole('button', { name: OPEN_ROW[id] })).toBeTruthy()
    expect(posts()).toHaveLength(0)
  })
})

describe('E07 - the legitimate calendar invite', () => {
  it('decides on the invite card and accepts, then keeps the response', async () => {
    const user = userEvent.setup()
    startAt('E07', 'open')
    await clickName(user, OPEN_ROW.E07)
    await screen.findByTestId('mail-thread')

    // The calendar card is drawn with its three responses.
    const invite = await screen.findByTestId('mail-invite')
    expect(within(invite).getByText('Social Engineering Lab')).toBeTruthy()

    await openMenu(user)
    await clickName(user, /Read the morning-briefing thread/)

    // Accept on the invite card.
    await user.click(within(await screen.findByTestId('mail-invite-actions')).getByRole('button', { name: 'Accept' }))
    await openMenu(user)
    await clickName(user, 'Report the invite')
    await clickName(user, 'Keep your response and carry on')

    await waitFor(() => expect(sentIntents()).toEqual([
      'read', 'read_thread', 'safe_pivot', 'report', 'resolve_continue',
    ]))
  })
})

describe('E06 - the roster reply composer', () => {
  it('shows the attachment chip on the roster draft and sends nothing typed', async () => {
    const user = userEvent.setup()
    startAt('E06', 'branch')
    await screen.findByTestId('mail-thread')

    await clickName(user, 'Reply')
    // Choose the "attach the roster" draft; its attachment chip appears.
    await clickName(user, /Attach the roster spreadsheet and send/)
    expect(await screen.findByTestId('mail-compose-attachment')).toBeTruthy()

    await clickName(user, /^Send/)
    await waitFor(() => expect(sentIntents()).toContain('submit_data'))
    // The attachment name is a drawn label; it is never on the wire.
    expect(JSON.stringify(server.calls)).not.toContain('Unit_Roster')
    for (const call of posts()) expect(call.body).not.toHaveProperty('intent')
  })
})

describe('E08 - the refund form keeps typed values in the client', () => {
  it('fills identity, card and OTP and none of it leaves', async () => {
    const user = userEvent.setup()
    startAt('E08', 'branch')
    await screen.findByTestId('mail-thread')

    await openMenu(user)
    await clickName(user, /Open the refund link/)
    await surface()
    await clickName(user, 'Continue')

    const pan = 'ABCDE1234F'
    const card = '4111111111111111'
    const otp = '778899'
    const inputs = await screen.findAllByRole('textbox')
    await user.type(inputs[0], pan)
    await user.type(inputs[1], card)
    await user.type(inputs[2], otp)

    await clickName(user, 'Release refund')
    await clickName(user, /^Release refund$/).catch(() => {})
    await waitFor(() => expect(sentIntents()).toContain('submit_data'))
    const wire = JSON.stringify(server.calls)
    expect(wire).not.toContain(pan)
    expect(wire).not.toContain(card)
    expect(wire).not.toContain(otp)
  })
})

describe('E10 - the vendor-master offers both a change and a payment', () => {
  it('approves payment on the vendor-master, sending no account typed', async () => {
    const user = userEvent.setup()
    startAt('E10', 'branch')
    await screen.findByTestId('mail-thread')

    await openMenu(user)
    await clickName(user, /Open the vendor master record/)
    await surface()
    await clickName(user, /Approve payment for this invoice/)
    await clickName(user, 'Approve the payment')

    await waitFor(() => expect(sentIntents()).toContain('attempt_payment'))
    expect(JSON.stringify(server.calls)).not.toContain('0044 5566 7788')
  })
})

describe('no E06-E10 scene leaks what a control means', () => {
  it.each(['E06', 'E07', 'E08', 'E09', 'E10'])('%s renders no engine vocabulary in the DOM', async (id) => {
    startAt(id, 'inspect')
    await screen.findByTestId('mail-thread')
    const html = document.body.innerHTML
    for (const token of FORBIDDEN_TOKENS) {
      expect(html.includes(token), `${id} DOM leaks ${token}`).toBe(false)
    }
    expect(html).not.toMatch(/data-intent|data-affordance/)
  })

  it('rebuilds E09 at the verify stage after a remount, with no replay', async () => {
    startAt('E09', 'verify')
    await screen.findByTestId('mail-thread')
    const before = posts().length
    cleanup()
    renderSimulation()
    await screen.findByTestId('mail-thread')
    expect(posts()).toHaveLength(before)
  })
})
