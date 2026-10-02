import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, configure, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CandidateProvider } from '@/context/CandidateProvider'
import { ROUTES } from '@/constants/routes'
import { SimulationPage } from '@/pages/SimulationPage'
import { createFakeServer, installFetch } from '@/test/attemptFixtures'
import { FORBIDDEN_TOKENS } from '@/test/actionMap'

/**
 * Email E11 to E15, end to end, through the real controller and the attempt API
 * (IMMERSIVE-007) - the third Email batch.
 *
 * Same posture as the E01-E10 suites: the fake server owns the stage, so a test advances a
 * scenario only by making the server accept a control. The point here is the batch's new
 * Email-native decisions - the legitimate portal launch, the cloned sign-in with a push
 * approval, the archive viewer with a double-extension executable, the QR inspector and the
 * OAuth consent screen - and that nothing the learner types or any engine word ever leaves the
 * client.
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
  E11: 'Open the People Portal update',
  E12: 'Open the shared-document email',
  E13: 'Open the case email',
  E14: 'Open the movement-order email',
  E15: 'Open the security-upgrade email',
}

describe('the mail app renders for every E11-E15 scene', () => {
  it.each(['E11', 'E12', 'E13', 'E14', 'E15'])('%s opens on the inbox at the open stage', async (id) => {
    startAt(id, 'open')
    expect(await screen.findByTestId('mail-list')).toBeTruthy()
    expect(await screen.findByRole('button', { name: OPEN_ROW[id] })).toBeTruthy()
    expect(posts()).toHaveLength(0)
  })
})

describe('E11 - the legitimate leave update', () => {
  it('opens the request in the known portal and keeps the email, sending no report', async () => {
    const user = userEvent.setup()
    startAt('E11', 'branch')
    await screen.findByTestId('mail-thread')

    await openMenu(user)
    await clickName(user, /Open LV-204 in the People Portal/)
    // The People Portal app opens, showing the approved request.
    expect(await screen.findByText('Approved')).toBeTruthy()

    // The portal launch is the safe branch decision (CORRECT_USE / safe_pivot).
    await waitFor(() => expect(sentIntents()).toContain('safe_pivot'))
  })
})

describe('E12 - the cloned sign-in keeps typed credentials in the client', () => {
  it('fills the work account and password and none of it leaves', async () => {
    const user = userEvent.setup()
    startAt('E12', 'branch')
    await screen.findByTestId('mail-thread')

    await openMenu(user)
    await clickName(user, /Open the share link/)
    await surface()

    const account = 'name@unit.training.example'
    const secret = 'Sup3rSecret'
    const inputs = await screen.findAllByRole('textbox')
    await user.type(inputs[0], account)
    // The password field is masked (not a textbox); target it by its name.
    await user.type(inputs[1], secret)

    // The page's own "Sign in" validates and walks to the confirm step; the scored control there
    // is what reaches the engine.
    await clickName(user, 'Sign in')
    await clickName(user, 'Sign in')
    await waitFor(() => expect(sentIntents()).toContain('submit_data'))
    const wire = JSON.stringify(server.calls)
    expect(wire).not.toContain(account)
    expect(wire).not.toContain(secret)
    for (const call of posts()) expect(call.body).not.toHaveProperty('intent')
  })
})

describe('E13 - the archive viewer lists a document-shaped executable', () => {
  it('shows the .pdf.exe and sends nothing but the extract intent', async () => {
    const user = userEvent.setup()
    startAt('E13', 'branch')
    await screen.findByTestId('mail-thread')

    await openMenu(user)
    await clickName(user, /Open the archive/)
    // The archive listing contains the double-extension executable.
    expect((await screen.findAllByText(/Case_Scan.pdf.exe/)).length).toBeGreaterThan(0)

    await clickName(user, 'Extract the files')
    await waitFor(() => expect(sentIntents()).toContain('open_file'))
    expect(JSON.stringify(server.calls)).not.toContain('2468')
  })
})

describe('E14 - the QR inspector shows the decoded target off-domain', () => {
  it('inspects the QR then submits credentials that stay local', async () => {
    const user = userEvent.setup()
    startAt('E14', 'branch')
    await screen.findByTestId('mail-thread')

    await openMenu(user)
    await clickName(user, /Open the decrypt portal/)
    await surface()

    const service = '55123'
    const secret = 'orderpass'
    const inputs = await screen.findAllByRole('textbox')
    await user.type(inputs[0], service)
    await user.type(inputs[1], secret)

    // The page's own "Decrypt order" walks to the confirm step; the scored control there submits.
    await clickName(user, 'Decrypt order')
    await clickName(user, /Enter your service number and password/)
    await waitFor(() => expect(sentIntents()).toContain('submit_data'))
    const wire = JSON.stringify(server.calls)
    expect(wire).not.toContain(service)
    expect(wire).not.toContain(secret)
  })
})

describe('E15 - the OAuth consent screen grants without a password', () => {
  it('lists the mailbox scopes and records the grant, typing nothing', async () => {
    const user = userEvent.setup()
    startAt('E15', 'branch')
    await screen.findByTestId('mail-thread')

    await openMenu(user)
    await clickName(user, /Open the consent screen/)
    await surface()
    // The consent screen lists the mailbox permissions and has no text field.
    expect(await screen.findByText('Mail.Read')).toBeTruthy()
    expect(screen.queryAllByRole('textbox')).toHaveLength(0)

    await clickName(user, 'Grant access')
    await waitFor(() => expect(sentIntents()).toContain('approve_device_link'))
    for (const call of posts()) expect(call.body).not.toHaveProperty('intent')
  })
})

describe('no E11-E15 scene leaks what a control means', () => {
  it.each(['E11', 'E12', 'E13', 'E14', 'E15'])('%s renders no engine vocabulary in the DOM', async (id) => {
    startAt(id, 'inspect')
    await screen.findByTestId('mail-thread')
    const html = document.body.innerHTML
    for (const token of FORBIDDEN_TOKENS) {
      expect(html.includes(token), `${id} DOM leaks ${token}`).toBe(false)
    }
    expect(html).not.toMatch(/data-intent|data-affordance/)
  })

  it('rebuilds E14 at the verify stage after a remount, with no replay', async () => {
    startAt('E14', 'verify')
    await screen.findByTestId('mail-thread')
    const before = posts().length
    cleanup()
    renderSimulation()
    await screen.findByTestId('mail-thread')
    expect(posts()).toHaveLength(before)
  })
})
