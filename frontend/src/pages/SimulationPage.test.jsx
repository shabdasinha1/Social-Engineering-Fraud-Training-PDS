import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, configure, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CandidateProvider } from '@/context/CandidateProvider'
import { ROUTES } from '@/constants/routes'
import { SimulationPage } from '@/pages/SimulationPage'
import { ResultPage } from '@/pages/ResultPage'
import { createFakeServer, installFetch, nextRun } from '@/test/attemptFixtures'
import {
  expectNeutralMarkup, expectNeutralRequests, expectNeutralStorage,
} from '@/test/neutrality'

/**
 * The assessment integration (UI-001), driven through the real controller and the real
 * `attemptApi` against a stubbed `fetch`.
 *
 * The fake server owns the stage and the ordinal, so a test can only move the UI forward
 * by making the server accept an intent - which is the property that matters: this screen
 * has no stage of its own to advance.
 */

/**
 * Section 3 delivers a scenario's notification 1-4 seconds after the dashboard becomes
 * idle, and this suite runs that timer for real rather than faking it - the wait is part
 * of the behaviour under test. The default 1s async timeout is therefore too short.
 */
configure({ asyncUtilTimeout: 8000 })

const TOAST_OPEN = /^Open QuickParcel Support, in WhatsApp$/
const TOAST_DISMISS = /^Dismiss QuickParcel Support, in WhatsApp$/

let server

function renderSimulation() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.ASSESSMENT]}>
      <CandidateProvider>
        <Routes>
          <Route path={ROUTES.ASSESSMENT} element={<SimulationPage />} />
          <Route path={ROUTES.RESULT} element={<ResultPage />} />
          <Route path={ROUTES.DASHBOARD} element={<p>Dashboard</p>} />
        </Routes>
      </CandidateProvider>
    </MemoryRouter>,
  )
}

/** Waits for the action sheet to show a stage, then clicks one of its controls. */
async function choose(user, name) {
  const control = await screen.findByRole('button', { name })
  await user.click(control)
}

beforeEach(() => {
  server = createFakeServer()
  installFetch(server)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('starting and resuming', () => {
  it('resumes the in-progress attempt without creating one', async () => {
    renderSimulation()

    // The attempt header, not the training panel: both now name the scenario.
    expect(await screen.findByRole('heading', { level: 1, name: /Scenario 1 of 10/ })).toBeTruthy()
    const posts = server.calls.filter((call) => call.method === 'POST')
    expect(posts).toHaveLength(0)
  })

  it('reads the current run rather than trusting anything stored locally', async () => {
    renderSimulation()
    await screen.findByText(/Your apps/)

    expect(server.calls.some((call) => call.path === '/attempts/current')).toBe(true)
    expect(server.calls.some((call) => call.path.endsWith('/current-run'))).toBe(true)
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })

  it('sends the learner to the dashboard when no attempt exists', async () => {
    server.status = 'completed'
    renderSimulation()

    expect(await screen.findByText(/No assessment in progress/)).toBeTruthy()
  })

  /** A reload is the same call path as first load: ask the server what is current. */
  it('restores mid-attempt state after a remount', async () => {
    server.ordinal = 4
    server.stage = 'branch'
    server.resolved = 3

    renderSimulation()

    expect(await screen.findByRole('heading', { level: 1, name: /Scenario 4 of 10/ })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/4.*of.*10/)
    expect(await screen.findByRole('button', { name: /Decline, and use an official/ })).toBeTruthy()
  })
})

describe('the six stages', () => {
  it('walks notify to resolve, taking every stage from the server', async () => {
    const user = userEvent.setup()
    renderSimulation()

    // 1 Notify - the toast and the badged tile both open the item.
    // The tile preview reads the same asset, so scope this to the tray itself.
    const tray = await screen.findByTestId('notification-tray')
    expect(within(tray).getByText(/Your parcel is held/)).toBeTruthy()
    await choose(user, TOAST_OPEN)

    // 2 Open
    expect(await screen.findByRole('heading', { name: 'Open' })).toBeTruthy()
    await choose(user, 'Read the message')

    // 3 Inspect
    expect(await screen.findByRole('heading', { name: 'Inspect' })).toBeTruthy()
    await choose(user, /Check the sender details/)
    const sheet = await screen.findByRole('dialog')
    expect(within(sheet).getByText('QuickParcel Support')).toBeTruthy()
    await user.click(within(sheet).getByRole('button', { name: /Close Sender details/ }))

    // 4 Branch
    expect(await screen.findByRole('heading', { name: 'Decide' })).toBeTruthy()
    await choose(user, 'Make the payment')

    // 5 Verify - the consequence panel shows what the engine said happened.
    expect(await screen.findByText(/simulated payment screen opened/i)).toBeTruthy()
    expect(await screen.findByRole('heading', { name: 'Verify' })).toBeTruthy()
    await choose(user, 'Use a number I already hold')

    // 6 Resolve
    expect(await screen.findByRole('heading', { name: 'Resolve' })).toBeTruthy()
    await choose(user, 'Report it and close')

    expect(await screen.findByRole('heading', { name: /Scenario 1 recorded/ })).toBeTruthy()
    expect(server.stage).toBe('resolve')
    expect(server.resolved).toBe(1)
  })

  it('sends the expected stage with every intent so the server can detect a stale view', async () => {
    const user = userEvent.setup()
    renderSimulation()

    await choose(user, TOAST_OPEN)
    await screen.findByRole('heading', { name: 'Open' })

    const event = server.calls.find((call) => call.path.endsWith('/events'))
    expect(event.body.expected_stage).toBe('notify')
    expect(event.intent).toBe('open_item')
    expect(typeof event.body.intent_key).toBe('string')
    expect(event.body.intent_key.length).toBeGreaterThan(8)
  })

  it('names the synthetic asset an action targets', async () => {
    const user = userEvent.setup()
    server.stage = 'branch'
    renderSimulation()

    await choose(user, 'Open the link')
    await waitFor(() => expect(server.stage).toBe('verify'))

    const event = server.calls.findLast((call) => call.path.endsWith('/events'))
    expect(event.body.synthetic_target_id).toBe('W99-browser-01')
  })

  it('dismissing the alert keeps the scenario in the attempt', async () => {
    const user = userEvent.setup()
    renderSimulation()

    await choose(user, TOAST_DISMISS)

    expect(await screen.findByText(/Alert dismissed/)).toBeTruthy()
    expect(server.stage).toBe('notify')
    expect(server.resolved).toBe(0)
    // The app tile still offers the item.
    expect(screen.getByRole('button', { name: /WhatsApp/ })).toBeTruthy()
  })

  it('offers a rationale field only at the resolve stage', async () => {
    const user = userEvent.setup()
    server.stage = 'verify'
    renderSimulation()

    await screen.findByRole('heading', { name: 'Verify' })
    expect(screen.queryByLabelText(/Why did you choose this/)).toBeNull()

    await choose(user, 'Report it')
    await screen.findByRole('heading', { name: 'Resolve' })

    const field = screen.getByLabelText(/Why did you choose this/)
    expect(field.maxLength).toBe(250)

    await user.type(field, 'Checked the directory first')
    await choose(user, 'Report it and close')

    const resolve = server.calls.findLast((call) => call.path.endsWith('/resolve'))
    expect(resolve.body.rationale).toBe('Checked the directory first')
    expect(resolve.intent).toBe('resolve_report')
  })

  it('advances to the next scenario only when the server issues one', async () => {
    const user = userEvent.setup()
    server.stage = 'resolve'
    renderSimulation()

    await choose(user, 'Report it and close')
    await screen.findByRole('heading', { name: /Scenario 1 recorded/ })

    nextRun(server)
    await user.click(screen.getByRole('button', { name: /Continue to the next scenario/ }))

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/2.*of.*10/),
    )
  })
})

describe('verification', () => {
  it('never lets the message contact populate a trusted result', async () => {
    const user = userEvent.setup()
    server.stage = 'verify'
    renderSimulation()

    await choose(user, 'Check the trusted directory')
    const dialog = await screen.findByRole('dialog', { name: /Trusted directory/ })

    const results = within(dialog).getByRole('list')
    expect(within(results).getByText('Unit Falcon Support Desk')).toBeTruthy()
    expect(within(results).queryByText('+91 00000 31447')).toBeNull()

    // The sender is shown for comparison, explicitly labelled as message-supplied.
    expect(within(dialog).getByText(/Details taken from the message/)).toBeTruthy()
  })

  it('does not create a directory entry from what is typed', async () => {
    const user = userEvent.setup()
    server.stage = 'verify'
    renderSimulation()

    await choose(user, 'Check the trusted directory')
    const dialog = await screen.findByRole('dialog', { name: /Trusted directory/ })

    await user.type(within(dialog).getByRole('searchbox'), '+91 00000 31447')

    expect(within(dialog).getByText(/Nothing you type is added to the directory/)).toBeTruthy()
    expect(within(dialog).queryByText('Unit Falcon Support Desk')).toBeNull()
  })

  it('records the verification source the learner chose', async () => {
    const user = userEvent.setup()
    server.stage = 'verify'
    renderSimulation()

    await choose(user, 'Use the contact details in the message')
    await waitFor(() => expect(server.stage).toBe('resolve'))

    const event = server.calls.findLast((call) => call.path.endsWith('/events'))
    expect(event.intent).toBe('verify_in_message_contact')
    // SECURITY-001: the source is the server's to record; the device no longer sends it.
    expect(event.body.metadata?.verify_source).toBeUndefined()
  })

  /**
   * SECURITY-001. The generic action sheet is the path every unauthored scenario (Email
   * and SMS today) uses, so it is held to the same rule as the scenes: its markup and its
   * requests never say what a choice means.
   */
  it('keeps the generic action sheet neutral in the markup and on the wire', async () => {
    const user = userEvent.setup()
    server.stage = 'inspect'
    renderSimulation()

    await choose(user, 'Check the sender details')
    await screen.findByRole('dialog', { name: 'Sender details' })
    expectNeutralMarkup(document.body.innerHTML, 'inspect sheet')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(server.stage).toBe('branch'))
    expectNeutralMarkup(document.body.innerHTML, 'branch sheet')

    await choose(user, 'Decline, and use an official channel instead')
    await waitFor(() => expect(server.stage).toBe('verify'))
    expectNeutralMarkup(document.body.innerHTML, 'verify sheet')
    await choose(user, 'Check the trusted directory')
    await screen.findByRole('dialog', { name: /Trusted directory/ })

    const posts = server.calls.filter((call) => call.method === 'POST')
    expect(posts.map((call) => call.intent))
      .toEqual(['inspect_sender', 'safe_pivot', 'verify_trusted_directory'])
    expectNeutralRequests(server.calls)
    expectNeutralStorage()
  })
})

describe('recovery', () => {
  it('resyncs on a stale stage instead of replaying the action', async () => {
    const user = userEvent.setup()
    renderSimulation()
    await screen.findByText(/Your apps/)

    // The server has moved on behind this view.
    server.stage = 'inspect'
    server.failNextWith = {
      code: 'STALE_STATE',
      status: 409,
      details: { current_stage: 'inspect', last_sequence: 2 },
    }

    await choose(user, TOAST_OPEN)

    expect(await screen.findByText(/This scenario moved on/)).toBeTruthy()
    expect(await screen.findByRole('heading', { name: 'Inspect' })).toBeTruthy()

    const events = server.calls.filter((call) => call.path.endsWith('/events'))
    expect(events).toHaveLength(1)
  })

  it('shows a refused action inline and leaves the attempt running', async () => {
    const user = userEvent.setup()
    server.stage = 'branch'
    renderSimulation()

    server.failNextWith = { code: 'INVALID_TRANSITION', status: 409 }
    await choose(user, 'Reply to the sender')

    expect(await screen.findByText(/That action was not accepted/)).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Decide' })).toBeTruthy()
  })

  it('reuses the idempotency key when the same action is retried', async () => {
    const user = userEvent.setup()
    renderSimulation()
    await screen.findByText(/Your apps/)

    server.failNextWith = { code: 'INVALID_TRANSITION', status: 409 }
    await choose(user, TOAST_OPEN)
    await screen.findByText(/That action was not accepted/)

    await choose(user, TOAST_OPEN)
    await screen.findByRole('heading', { name: 'Open' })

    const keys = server.calls
      .filter((call) => call.path.endsWith('/events'))
      .map((call) => call.body.intent_key)
    expect(keys).toHaveLength(2)
    expect(new Set(keys).size).toBe(1)
  })

  it('replays a lost response instead of scoring the action twice', async () => {
    const user = userEvent.setup()
    renderSimulation()
    await screen.findByText(/Your apps/)

    // The engine commits before it answers, so this action landed - the reply did not.
    server.dropNextResponse = true
    await choose(user, TOAST_OPEN)
    expect(await screen.findByText(/Cannot reach the training server/)).toBeTruthy()

    // The retry carries the same key, so the server replays the original outcome.
    await choose(user, TOAST_OPEN)

    expect(await screen.findByText(/already been recorded/)).toBeTruthy()
    expect(await screen.findByRole('heading', { name: 'Open' })).toBeTruthy()
    expect(server.sequence).toBe(1)
  })

  it('offers a resume path when the local API cannot be reached', async () => {
    globalThis.fetch = async () => {
      throw new TypeError('fetch failed')
    }
    renderSimulation()

    expect(await screen.findByText(/could not continue/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Resume' })).toBeTruthy()
  })
})

describe('completion', () => {
  it('completes after ten runs and shows the result', async () => {
    const user = userEvent.setup()
    server.resolved = 10
    renderSimulation()

    expect(await screen.findByText(/All scenarios resolved/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'View results' }))

    // The headline, not one of the breakdown rows: several now show a score out of 100.
    const total = await screen.findByRole('heading', { level: 1, name: /74/ })
    expect(total.textContent.replace(/\s+/g, '')).toContain('74/100')
    expect(server.status).toBe('completed')
  })
})

describe('what the candidate surface must never show', () => {
  const FORBIDDEN = [
    'malicious',
    'legitimate',
    'disposition',
    'canonical_family',
    'canonical_triggers',
    'military_flag',
    'expected_safe_behavior',
    'points_delta',
    'seed',
    'evaluation',
  ]

  it('renders no classification, scoring or selection metadata', async () => {
    server.stage = 'branch'
    renderSimulation()
    await screen.findByRole('heading', { name: 'Decide' })

    const markup = document.body.innerHTML.toLowerCase()
    for (const term of FORBIDDEN) {
      expect(markup).not.toContain(term)
    }
  })

  it('hides the running score in assessment mode', async () => {
    const user = userEvent.setup()
    server.stage = 'resolve'
    renderSimulation()

    await choose(user, 'Report it and close')
    await screen.findByRole('heading', { name: /Scenario 1 recorded/ })

    // The wire carries score_0_10: 8; assessment mode must not print it.
    expect(screen.queryByText(/out of\s+10 for this scenario/)).toBeNull()
  })

  it('shows the scenario score in training mode', async () => {
    const user = userEvent.setup()
    server = createFakeServer({ mode: 'training' })
    installFetch(server)
    server.stage = 'resolve'
    renderSimulation()

    await choose(user, 'Report it and close')
    expect(await screen.findByText(/for this scenario/)).toBeTruthy()
  })

  it('masks all but the last four characters of the service number', async () => {
    renderSimulation()
    await screen.findByText(/Your apps/)

    expect(screen.queryByText('ABC123456')).toBeNull()
    expect(screen.getByText(/3456$/)).toBeTruthy()
  })
})

describe('offline containment', () => {
  it('renders no external asset, link or embedded frame', async () => {
    const user = userEvent.setup()
    server.stage = 'branch'
    renderSimulation()

    await choose(user, 'Open the link')
    await screen.findByRole('heading', { name: 'Verify' })

    expect(document.querySelectorAll('img, iframe, embed, object, video, audio')).toHaveLength(0)
    for (const anchor of document.querySelectorAll('a[href]')) {
      expect(anchor.getAttribute('href')).not.toMatch(/^https?:/)
    }
    // The address is shown as text, on a reserved host, and is not navigable.
    expect(screen.getByText('https://w12.training.example/verify').tagName).not.toBe('A')
  })
})

describe('keyboard access', () => {
  it('completes a stage with the keyboard alone', async () => {
    const user = userEvent.setup()
    renderSimulation()
    await screen.findByText(/Your apps/)

    const open = await screen.findByRole('button', { name: TOAST_OPEN })
    open.focus()
    expect(document.activeElement).toBe(open)

    await user.keyboard('{Enter}')
    expect(await screen.findByRole('heading', { name: 'Open' })).toBeTruthy()
  })

  it('traps focus in a dialog and never loses it when the dialog closes', async () => {
    const user = userEvent.setup()
    server.stage = 'verify'
    renderSimulation()

    const trigger = await screen.findByRole('button', { name: 'Check the trusted directory' })
    await user.click(trigger)

    const dialog = await screen.findByRole('dialog', { name: /Trusted directory/ })
    expect(dialog.contains(document.activeElement)).toBe(true)

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    // The verify controls are gone by now - the stage advanced - so focus lands on the
    // main region rather than being lost to <body>.
    expect(document.activeElement).not.toBe(document.body)
    expect(document.querySelector('main').contains(document.activeElement)).toBe(true)
  })

  it('gives every control an accessible name', async () => {
    server.stage = 'branch'
    renderSimulation()
    await screen.findByRole('heading', { name: 'Decide' })

    for (const button of screen.getAllByRole('button')) {
      const name =
        button.getAttribute('aria-label') || button.textContent.trim()
      expect(name.length).toBeGreaterThan(0)
    }
  })
})
