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
 * Email E01 to E05, end to end, through the real controller and the attempt API
 * (IMMERSIVE-005) - the first Email batch.
 *
 * The fake server owns the stage, so the only way a test advances a scenario is to make the
 * server accept a control. The scoring itself is pinned by the backend suites and the DB and
 * browser runs; here the point is the mail app: opening a message from the inbox, expanding
 * the headers, walking the details, sign-in and payment pages, the attachment preview, and
 * that nothing the learner types or any engine word ever leaves the client.
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

const openMenu = async (user) =>
  user.click(await screen.findByRole('button', { name: 'More options' }))

const clickName = async (user, name) => user.click(await screen.findByRole('button', { name }))

const surface = () => screen.findByTestId('scene-surface')

afterEach(() => {
  cleanup()
  server = undefined
})

describe('the mail app renders for every Email scene', () => {
  it.each(['E01', 'E02', 'E03', 'E04', 'E05'])('%s opens on the inbox at the open stage', async (id) => {
    startAt(id, 'open')
    expect(await screen.findByTestId('mail-list')).toBeTruthy()
    // The row that opens the item is present; nothing scored has been sent yet.
    expect(await screen.findByTestId('mail-rows')).toBeTruthy()
    expect(posts()).toHaveLength(0)
  })
})

describe('E01 - password expiry', () => {
  it('walks notify-to-resolve through the message, the menu and the banner', async () => {
    const user = userEvent.setup()
    startAt('E01', 'open')

    await clickName(user, 'Open the email from IT Service Desk')
    await screen.findByTestId('mail-thread')

    await openMenu(user)
    await clickName(user, /Read the whole thread from the start/)

    await openMenu(user)
    await clickName(user, /Leave the email without clicking anything/)

    await openMenu(user)
    await clickName(user, 'Report the message')

    await clickName(user, 'Report and delete it')

    await waitFor(() => expect(sentIntents()).toEqual([
      'read', 'read_thread', 'safe_pivot', 'report', 'resolve_report',
    ]))
    // Every request carried an opaque code, never an engine intent.
    for (const call of posts()) {
      expect(call.body).toHaveProperty('action_code')
      expect(call.body).not.toHaveProperty('intent')
      expect(String(call.body.action_code)).toMatch(/^ac_[0-9a-f]{20}$/)
    }
  })

  it('shows the message details as local navigation that records nothing', async () => {
    const user = userEvent.setup()
    startAt('E01', 'branch')
    await screen.findByTestId('mail-thread')

    await openMenu(user)
    await clickName(user, /Show message details/)

    // The details surface opened, and no request was sent to open it.
    const sheet = await surface()
    expect(within(sheet).getAllByText('Message details').length).toBeGreaterThan(0)
    expect(within(sheet).getByText(/does not permit/i)).toBeTruthy()
    expect(posts()).toHaveLength(0)
  })

  it('keeps everything typed on the sign-in page inside the client', async () => {
    const user = userEvent.setup()
    startAt('E01', 'branch')
    await screen.findByTestId('mail-thread')

    await openMenu(user)
    await clickName(user, /Open the sign-in link/)
    await surface()
    await clickName(user, 'Continue to sign in')

    const secret = 'Sup3rSecretPw'
    const otp = '246813'
    const inputs = await screen.findAllByRole('textbox')
    await user.type(inputs[0], 'jdoe')
    await user.type(inputs[1], secret)
    await user.type(inputs[2], otp)

    // The form's own Continue walks to the confirmation step; the scored control is there.
    await clickName(user, 'Continue')
    await clickName(user, 'Validate')

    await waitFor(() => expect(sentIntents()).toContain('submit_data'))
    const wire = JSON.stringify(server.calls)
    expect(wire).not.toContain(secret)
    expect(wire).not.toContain('jdoe')
    expect(wire).not.toContain(otp)
  })
})

describe('E04 - the payment sheet is the decision', () => {
  it('reveals its commit control only after a PIN, and sends no typed PIN', async () => {
    const user = userEvent.setup()
    startAt('E04', 'branch')
    await screen.findByTestId('mail-thread')

    await openMenu(user)
    await clickName(user, /Open the tracking link/)
    await surface()
    await clickName(user, 'Pay the clearance fee')

    // The paysheet is up; before a PIN, there is no scene control to pay with.
    await screen.findByTestId('paysheet-commit')
    expect(screen.queryByRole('button', { name: /^Pay the clearance fee$/ })).toBeNull()

    const pin = '558193'
    const [pinField] = await screen.findAllByRole('textbox')
    await user.type(pinField, pin)
    await clickName(user, /^Pay the clearance fee$/)

    await waitFor(() => expect(sentIntents()).toContain('attempt_payment'))
    expect(JSON.stringify(server.calls)).not.toContain(pin)
  })
})

describe('E03 - the legitimate newsletter', () => {
  it('archives on the in-app path and keeps it, with no report', async () => {
    const user = userEvent.setup()
    startAt('E03', 'branch')
    await screen.findByTestId('mail-thread')

    await clickName(user, 'Read it and archive it normally')

    await openMenu(user)
    await clickName(user, /Compare the issue number in the newsletter archive/)
    // The archive opened as a pushed app; walking back returns to the thread.
    const sheet = await surface()
    await user.click(within(sheet).getAllByRole('button')[0])

    await clickName(user, 'Keep it — mark as read')

    await waitFor(() => expect(sentIntents()).toEqual([
      'safe_pivot', 'verify_known_app', 'resolve_continue',
    ]))
  })
})

describe('no Email scene leaks what a control means', () => {
  it.each(['E01', 'E02', 'E03', 'E04', 'E05'])('%s renders no engine vocabulary in the DOM', async (id) => {
    startAt(id, 'inspect')
    await screen.findByTestId('mail-thread')
    const html = document.body.innerHTML
    for (const token of FORBIDDEN_TOKENS) {
      expect(html.includes(token), `${id} DOM leaks ${token}`).toBe(false)
    }
    expect(html).not.toMatch(/data-intent|data-affordance/)
  })

  it('rebuilds E05 at the verify stage after a remount, with no replay', async () => {
    startAt('E05', 'verify')
    await screen.findByTestId('mail-thread')
    const before = posts().length
    cleanup()
    renderSimulation()
    await screen.findByTestId('mail-thread')
    // A remount reads the run; it does not resend anything.
    expect(posts()).toHaveLength(before)
  })
})
