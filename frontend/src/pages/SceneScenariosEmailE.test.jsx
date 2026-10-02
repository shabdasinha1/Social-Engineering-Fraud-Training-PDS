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
 * Email E21 to E25, end to end, through the real controller and the attempt API
 * (IMMERSIVE-009) - the fifth and final Email batch.
 *
 * Same posture as the E01-E20 suites: the fake server owns the stage, so a test advances a
 * scenario only by making the server accept a control. The point here is the batch's new
 * Email-native decisions - a genuine portal case completed by a second approver, a recorded
 * instruction with a local player and a transcript, an attachment that opens as a page from the
 * device, a code seven pages into a document with the real task waiting beside it, and a
 * prefilled payroll form under a reused subject line - and that local navigation, recovery and
 * retries never score twice or leak an engine word.
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

const IDS = ['E21', 'E22', 'E23', 'E24', 'E25']
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
  E21: 'Open the VC-209 notice',
  E22: 'Open the memo',
  E23: 'Open the alert',
  E24: 'Open the circular',
  E25: 'Open the correction request',
}

describe('the mail app renders for every E21-E25 scene', () => {
  it.each(IDS)('%s opens on the inbox at the open stage', async (id) => {
    startAt(id, 'open')
    expect(await screen.findByTestId('mail-list')).toBeTruthy()
    expect(await screen.findByRole('button', { name: OPEN_ROW[id] })).toBeTruthy()
    expect(posts()).toHaveLength(0)
  })
})

describe('E21 - the verified vendor change, all six stages', () => {
  it('walks notify to resolve and completes the case', async () => {
    const user = userEvent.setup()
    startAt('E21', 'notify')

    // Notify: the toast routes into the scenario.
    await clickName(user, /^Open Northstar Supplies, in /)
    // Open: the inbox row opens the notice.
    await clickName(user, OPEN_ROW.E21)
    await screen.findByTestId('mail-thread')
    // Inspect: the sender line opens the details, where the link target is the unit's own portal.
    await user.click(await screen.findByTestId('mail-sender'))
    expect(await screen.findByText(/vendorportal\.unit\.training\.example\/cases\/VC-209/)).toBeTruthy()
    await leaveSurface(user)
    // Branch: open the case in the portal and record the second approval.
    await clickName(user, 'Open VC-209 in the vendor portal')
    const portal = await surface()
    expect(within(portal).getByText('Awaiting a second approver')).toBeTruthy()
    // Walking into the portal recorded nothing.
    expect(posts()).toHaveLength(3)
    await clickName(user, 'Record your approval as the second approver')
    await waitFor(() => expect(screen.queryByTestId('scene-surface')).toBeNull())
    // Verify: the vendor on the number the vendor master already holds.
    await openMenu(user)
    await clickName(user, /Call the vendor on the number in the vendor master/)
    expect(await screen.findByText(/we raised VC-209 in your portal/)).toBeTruthy()
    await leaveSurface(user)
    // Resolve: complete the case from the banner.
    await clickName(user, 'Complete the case and keep the evidence with it')

    await waitFor(() => expect(sentIntents()).toEqual([
      'open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_number', 'resolve_continue',
    ]))
    for (const call of posts()) {
      expect(call.body).not.toHaveProperty('intent')
      expect(String(call.body.action_code)).toMatch(/^ac_[0-9a-f]{20}$/)
    }
    // The full six-stage walk opens three pushed screens and backs out of two, so it needs more
    // than the default per-test budget; every other test in this suite runs inside it.
  }, 20000)

  it('shows the signed form and the audit trail as local navigation that records nothing', async () => {
    const user = userEvent.setup()
    startAt('E21', 'branch')
    await screen.findByTestId('mail-thread')

    await openMenu(user)
    await clickName(user, 'Show message details')
    await clickName(user, 'Open the attached signed form')
    // The fingerprint the notice printed is the one the portal recorded.
    // Printed on the form, and recorded by the portal - the screen shows both.
    expect((await screen.findAllByText(/4F 19 C0 7A 2B 8E 55 D3/)).length).toBeGreaterThanOrEqual(2)
    expect(posts()).toHaveLength(0)
    expect(server.stage).toBe('branch')
  })

  it('offers rejecting a genuine case, and it is an ordinary control like the rest', async () => {
    const user = userEvent.setup()
    startAt('E21', 'branch')
    await screen.findByTestId('mail-thread')

    await openMenu(user)
    await clickName(user, 'Open VC-209 in the portal')
    const reject = await screen.findByRole('button', { name: 'Reject VC-209 and close the case' })
    expect(reject.hasAttribute('disabled')).toBe(false)
    expect(reject.getAttribute('data-control')).toBe('act')
    await user.click(reject)
    await waitFor(() => expect(sentIntents()).toEqual(['reject_ignore']))
  })
})

describe('E22 - the recorded instruction', () => {
  it('plays locally and shows the transcript without recording anything', async () => {
    const user = userEvent.setup()
    startAt('E22', 'branch')
    await screen.findByTestId('mail-thread')

    const card = await screen.findByTestId('mail-voice')
    await user.click(within(card).getByRole('button', { name: 'Play the audio attachment' }))
    await user.click(within(card).getByRole('button', { name: 'Show transcript' }))
    expect(await screen.findByTestId('mail-transcript')).toBeTruthy()
    // Nothing on this screen is a media element, and listening recorded nothing.
    expect(document.body.innerHTML).not.toMatch(/<audio|<video|getUserMedia|blob:/)
    expect(posts()).toHaveLength(0)
    expect(server.stage).toBe('branch')
  })

  it('takes the decision on the transfer sheet, and the PIN never leaves the screen', async () => {
    const user = userEvent.setup()
    startAt('E22', 'branch')
    await screen.findByTestId('mail-thread')

    await clickName(user, 'Open the transfer in the welfare account')
    const sheet = await surface()
    expect(within(sheet).getByText('Not recorded')).toBeTruthy()
    // Opening the sheet recorded nothing; Confirm appears only once the PIN is long enough.
    expect(posts()).toHaveLength(0)
    await user.type(within(sheet).getByLabelText('Fund PIN'), '445190')
    await clickName(user, 'Confirm the transfer')

    await waitFor(() => expect(sentIntents()).toEqual(['attempt_payment']))
    const body = JSON.stringify(posts()[0].body)
    expect(body).not.toContain('445190')
    expect(Object.keys(posts()[0].body.metadata ?? {})).not.toContain('pin')
    expect(window.localStorage.length).toBe(0)
    expect(window.sessionStorage.length).toBe(0)
  })

  it('states on the attachment screen what a recording cannot carry', async () => {
    const user = userEvent.setup()
    startAt('E22', 'inspect')
    await screen.findByTestId('mail-thread')

    await openMenu(user)
    await clickName(user, /Check the attachment’s details/)
    expect(await screen.findByText('Audio files carry none')).toBeTruthy()
    await waitFor(() => expect(sentIntents()).toEqual(['preview_file']))
  })
})

describe('E23 - the attachment that opens from the device', () => {
  it('refuses to render inline and offers only the browser, which shows a local path', async () => {
    const user = userEvent.setup()
    startAt('E23', 'branch')
    await screen.findByTestId('mail-thread')

    await openMenu(user)
    await clickName(user, 'Open the attachment preview')
    expect(await screen.findByTestId('mail-bar')).toBeTruthy()
    expect(screen.getByText(/Preview not available/)).toBeTruthy()
    expect(posts()).toHaveLength(0)

    await clickName(user, 'Open it in the browser')
    await waitFor(() => expect(sentIntents()).toEqual(['open_file']))
    const address = await screen.findByTestId('browser-address')
    expect(address.textContent).toContain('file:///storage/downloads/SecurityReport.html')
  })

  it('harvests nothing: the sign-in values never reach the wire or storage', async () => {
    const user = userEvent.setup()
    startAt('E23', 'branch')
    await screen.findByTestId('mail-thread')

    await openMenu(user)
    await clickName(user, 'Open the attachment preview')
    await clickName(user, 'Open it in the browser')
    await screen.findByTestId('browser-address')
    // The branch decision is spent, so the page states what it asks for rather than taking it.
    expect(screen.queryAllByRole('textbox')).toHaveLength(0)
    for (const call of posts()) {
      expect(JSON.stringify(call.body)).not.toMatch(/password|passphrase/i)
    }
    expect(window.localStorage.length).toBe(0)
  })

  it('leaves the attachment unopened from the message banner', async () => {
    const user = userEvent.setup()
    startAt('E23', 'branch')
    await screen.findByTestId('mail-thread')

    await openMenu(user)
    await clickName(user, 'Leave the attachment unopened and close the message')
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
  })
})

describe('E24 - the code seven pages in', () => {
  it('walks the document to page 7 before the code can be read, and reading it records nothing', async () => {
    const user = userEvent.setup()
    startAt('E24', 'branch')
    await screen.findByTestId('mail-thread')

    await openMenu(user)
    await clickName(user, 'Open the policy document')
    expect((await screen.findAllByText('1. Purpose and scope')).length).toBeGreaterThan(0)
    await clickName(user, 'Next page')
    await clickName(user, 'Go to the acknowledgement page')
    expect(await screen.findByText('5. Acknowledgement')).toBeTruthy()
    await clickName(user, 'Read the code with your device')
    // The inspector names both hosts, and none of this walk recorded anything.
    expect(await screen.findByText(/ackn\.training\.example\/p7/)).toBeTruthy()
    expect(posts()).toHaveLength(0)
    expect(server.stage).toBe('branch')
  })

  it('acknowledging in the Policy Centre is the safe branch, and the task is already waiting', async () => {
    const user = userEvent.setup()
    startAt('E24', 'branch')
    await screen.findByTestId('mail-thread')

    await openMenu(user)
    await clickName(user, 'Open the Policy Centre')
    const centre = await surface()
    expect(within(centre).getByText('1 acknowledgement')).toBeTruthy()
    await clickName(user, 'Acknowledge the policy here')
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
  })

  it('opening the decoded address is the risky route, and no camera is ever touched', async () => {
    const user = userEvent.setup()
    startAt('E24', 'branch')
    await screen.findByTestId('mail-thread')

    await openMenu(user)
    await clickName(user, 'Read the code on page 7 with your device')
    await clickName(user, 'Open the address the code contains')
    await waitFor(() => expect(sentIntents()).toEqual(['scan_qr']))
    expect(document.body.innerHTML).not.toMatch(/getUserMedia|<video|<canvas|navigator\.clipboard/)
  })
})

describe('E25 - the reused subject line', () => {
  it('shows that the message replies to nothing, beside the real 28 Aug exchange', async () => {
    const user = userEvent.setup()
    startAt('E25', 'inspect')
    await screen.findByTestId('mail-thread')

    await user.click(await screen.findByTestId('mail-sender'))
    expect(await screen.findByText(/No earlier message/)).toBeTruthy()
    await clickName(user, /Compare with Maj\. A\. Iyer's message of 28 Aug/)
    expect(await screen.findByText(/a\.iyer@unit\.training\.example/)).toBeTruthy()
    await waitFor(() => expect(sentIntents()).toEqual(['inspect_sender']))
  })

  it('holds the member out of the run from the Payroll app', async () => {
    const user = userEvent.setup()
    startAt('E25', 'branch')
    await screen.findByTestId('mail-thread')

    await openMenu(user)
    await clickName(user, 'Open tonight’s run in Payroll')
    const payroll = await surface()
    expect(within(payroll).getByText('None on file')).toBeTruthy()
    expect(posts()).toHaveLength(0)
    await clickName(user, 'Hold PAY-3342 out of tonight’s run')
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
  })

  it('forwards to the clerk through the compose sheet, sending only an opaque code', async () => {
    const user = userEvent.setup()
    startAt('E25', 'branch')
    await screen.findByTestId('mail-thread')

    await clickName(user, 'Forward')
    const head = await screen.findByTestId('mail-compose-head')
    expect(within(head).getByText('pay.clerk@unit.training.example')).toBeTruthy()
    await clickName(user, /Forward it to the pay clerk to action before 18:00/)
    await clickName(user, /^Send "/)
    await waitFor(() => expect(sentIntents()).toEqual(['reply']))
    expect(posts()[0].body).not.toHaveProperty('intent')
  })

  it('replays a lost response instead of scoring the open twice', async () => {
    const user = userEvent.setup()
    startAt('E25', 'open')

    server.dropNextResponse = true
    await clickName(user, OPEN_ROW.E25)
    expect(await screen.findByText(/Cannot reach the training server/)).toBeTruthy()
    await clickName(user, OPEN_ROW.E25)

    await screen.findByTestId('mail-thread')
    expect(server.sequence).toBe(1)
    const keys = posts().map((call) => call.body.intent_key)
    expect(keys).toHaveLength(2)
    expect(new Set(keys).size).toBe(1)
  })

  it('rebuilds at the verify stage after a remount, with no replay', async () => {
    startAt('E25', 'verify')
    await screen.findByTestId('mail-thread')
    const before = posts().length
    cleanup()
    renderSimulation()
    await screen.findByTestId('mail-thread')
    expect(posts()).toHaveLength(before)
  })
})

describe('no E21-E25 scene leaks what a control means', () => {
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
