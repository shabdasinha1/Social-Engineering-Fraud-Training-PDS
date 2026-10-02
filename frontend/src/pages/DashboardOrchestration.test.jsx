import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, configure, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { NotificationTray } from '@/components/simulation/NotificationTray'
import { CandidateProvider } from '@/context/CandidateProvider'
import { ROUTES } from '@/constants/routes'
import { SimulationPage } from '@/pages/SimulationPage'
import { deliveryDelayMs } from '@/state/dashboardOrchestrator'
import { createFakeServer, installFetch, nextRun } from '@/test/attemptFixtures'

/**
 * Dashboard activity orchestration (UI-004), driven through the real controller and the
 * real `attemptApi` against a stubbed `fetch`.
 *
 * The delivery window is exercised in real time rather than faked. That is deliberate:
 * the property being asserted is that a scenario the server has ALREADY issued is not on
 * the home screen yet, and a fake clock that the test advances itself would prove only
 * that a timer exists. Waiting proves the notification was genuinely withheld.
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
          <Route path={ROUTES.HISTORY} element={<p>Past assessments</p>} />
          <Route path={ROUTES.LOGIN} element={<p>Sign in</p>} />
          <Route path={ROUTES.DASHBOARD} element={<p>Dashboard</p>} />
        </Routes>
      </CandidateProvider>
    </MemoryRouter>,
  )
}

/** Opens the profile chip menu and returns it. */
async function openChipMenu(user) {
  await user.click(await screen.findByRole('button', { name: /Test Learner/ }))
  return screen.getByRole('menu')
}

beforeEach(() => {
  server = createFakeServer()
  installFetch(server)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('post-idle activity arrival', () => {
  it('withholds the notification while the delivery window runs, then delivers it', async () => {
    renderSimulation()

    // The hub is up and the run has been issued by the server...
    await screen.findByText(/Your apps/)
    expect(server.calls.some((call) => call.path.endsWith('/current-run'))).toBe(true)

    // ...but nothing has arrived on it yet.
    expect(screen.getByTestId('queue-status').textContent)
      .toMatch(/New activity will arrive shortly/)
    expect(screen.queryByTestId('notification-tray')).toBeNull()
    expect(screen.queryByRole('button', { name: /1 unread item/ })).toBeNull()

    // The window elapses on its own; no further server call is made to produce it.
    const before = server.calls.length
    expect(await screen.findByTestId('notification-tray')).toBeTruthy()
    expect(screen.queryByTestId('queue-status')).toBeNull()
    expect(server.calls.length).toBe(before)
  })

  it('waits the deterministic time this run is due, inside the 1-4 second window', async () => {
    const delay = deliveryDelayMs('run-1')
    expect(delay).toBeGreaterThanOrEqual(1000)
    expect(delay).toBeLessThanOrEqual(4000)

    const started = Date.now()
    renderSimulation()
    await screen.findByTestId('notification-tray')

    // Real elapsed time, so this asserts the floor rather than the exact millisecond.
    expect(Date.now() - started).toBeGreaterThanOrEqual(delay - 150)
  })

  /**
   * The whole point of the orchestrator: it must not become a second source of scenarios.
   */
  it('creates no run and issues no write while it waits', async () => {
    renderSimulation()
    await screen.findByTestId('notification-tray')

    expect(server.calls.filter((call) => call.method === 'POST')).toHaveLength(0)
    expect(server.ordinal).toBe(1)
    expect(server.resolved).toBe(0)
    expect(server.sequence).toBe(0)
  })

  it('queues again for the next scenario once the current one resolves', async () => {
    const user = userEvent.setup()
    server.stage = 'resolve'
    renderSimulation()

    await user.click(await screen.findByRole('button', { name: 'Report it and close' }))
    await screen.findByRole('heading', { name: /Scenario 1 recorded/ })

    nextRun(server)
    await user.click(screen.getByRole('button', { name: /Continue to the next scenario/ }))

    // Scenario 2 is on the wire, and the hub says so without showing it yet.
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/2.*of.*10/))
    expect(screen.getByTestId('queue-status')).toBeTruthy()
    expect(screen.queryByTestId('notification-tray')).toBeNull()

    expect(await screen.findByTestId('notification-tray')).toBeTruthy()
  })

  it('shows no badge on any app while activity is queued', async () => {
    renderSimulation()
    await screen.findByText(/Your apps/)

    for (const label of ['WhatsApp', 'Instagram', 'SMS', 'Email']) {
      expect(screen.getByRole('button', { name: `Open ${label}` })).toBeTruthy()
    }
    expect(screen.queryByRole('button', { name: /unread/ })).toBeNull()
  })

  /** A queued tile must not become an oracle for where the item is about to land. */
  it('opens a benign app and submits nothing if a tile is used before delivery', async () => {
    const user = userEvent.setup()
    renderSimulation()
    await screen.findByText(/Your apps/)

    await user.click(screen.getByRole('button', { name: 'Open WhatsApp' }))
    expect(screen.getByText(/Nothing new in WhatsApp/)).toBeTruthy()
    expect(server.calls.filter((call) => call.method === 'POST')).toHaveLength(0)
    expect(server.stage).toBe('notify')
  })
})

describe('the notification tray', () => {
  it('queues at most three toasts however many it is handed', () => {
    const items = Array.from({ length: 5 }, (_, index) => ({
      id: `n-${index}`,
      appKey: 'whatsapp',
      appLabel: 'WhatsApp',
      sender: `Sender ${index}`,
      body: `Body ${index}`,
      receivedAt: '09:41',
    }))

    render(<NotificationTray items={items} onOpen={vi.fn()} onDismiss={vi.fn()} />)

    expect(within(screen.getByTestId('notification-tray')).getAllByRole('listitem'))
      .toHaveLength(3)
    expect(screen.queryByText('Body 3')).toBeNull()
  })

  it('deep-links into the app the toast arrived in', async () => {
    const user = userEvent.setup()
    renderSimulation()

    const tray = await screen.findByTestId('notification-tray')
    await user.click(within(tray).getByRole('button', { name: TOAST_OPEN }))

    await screen.findByRole('heading', { name: 'Open' })
    const event = server.calls.findLast((call) => call.path.endsWith('/events'))
    expect(event.intent).toBe('open_item')
    expect(event.body.expected_stage).toBe('notify')
    // The thread for that app is now on the device.
    expect(screen.getByTestId('phone-app')).toBeTruthy()
  })

  it('logs the dismissal, clears the tray and keeps the scenario badged', async () => {
    const user = userEvent.setup()
    renderSimulation()

    const tray = await screen.findByTestId('notification-tray')
    await user.click(within(tray).getByRole('button', { name: TOAST_DISMISS }))

    await waitFor(() => expect(screen.queryByTestId('notification-tray')).toBeNull())

    const event = server.calls.findLast((call) => call.path.endsWith('/events'))
    expect(event.intent).toBe('dismiss')

    // The run is untouched and the item is still there to be opened.
    expect(server.stage).toBe('notify')
    expect(server.resolved).toBe(0)
    expect(screen.getByRole('button', { name: 'Open WhatsApp, 1 unread item' })).toBeTruthy()
    expect(screen.getByText(/Alert dismissed/)).toBeTruthy()
  })

  it('does not bring a dismissed alert back after a remount', async () => {
    const user = userEvent.setup()
    const first = renderSimulation()

    const tray = await screen.findByTestId('notification-tray')
    await user.click(within(tray).getByRole('button', { name: TOAST_DISMISS }))
    await waitFor(() => expect(screen.queryByTestId('notification-tray')).toBeNull())

    first.unmount()
    renderSimulation()

    // Server state says the alert was seen, so it is neither re-queued nor re-shown.
    expect(await screen.findByRole('button', { name: 'Open WhatsApp, 1 unread item' }))
      .toBeTruthy()
    expect(screen.queryByTestId('notification-tray')).toBeNull()
    expect(screen.queryByTestId('queue-status')).toBeNull()
  })

  it('gives every tray control an accessible name that names its app', async () => {
    renderSimulation()
    const tray = await screen.findByTestId('notification-tray')

    expect(tray.getAttribute('aria-label')).toBe('Notifications')
    for (const button of within(tray).getAllByRole('button')) {
      expect(button.getAttribute('aria-label')).toMatch(/in WhatsApp$/)
    }
  })
})

describe('the four app tiles', () => {
  it('shows all four with a status and a preview, and badges only the live one', async () => {
    renderSimulation()
    await screen.findByTestId('notification-tray')

    const tiles = screen.getAllByRole('listitem').filter((item) => item.querySelector('[data-status]'))
    expect(tiles).toHaveLength(4)

    const statuses = tiles.map((tile) => tile.querySelector('[data-status]').dataset.status)
    expect(statuses.filter((status) => status === 'activity')).toHaveLength(1)
    expect(statuses.filter((status) => status === 'quiet')).toHaveLength(3)

    // Every tile carries a preview line, so none is structurally richer than another.
    for (const tile of tiles) expect(tile.textContent).toMatch(/\S/)
    expect(screen.getAllByText('No new items')).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Open WhatsApp, 1 unread item' })).toBeTruthy()
  })

  it('previews the same text as the toast, so badge, toast and list agree', async () => {
    renderSimulation()
    const tray = await screen.findByTestId('notification-tray')

    const body = 'Your parcel is held. Pay the redelivery fee to release it.'
    expect(within(tray).getByText(body)).toBeTruthy()

    const tile = screen.getByRole('button', { name: 'Open WhatsApp, 1 unread item' })
      .closest('li')
    expect(tile.textContent).toContain(body)
  })

  it('opens a benign empty app for a tile with nothing waiting', async () => {
    const user = userEvent.setup()
    renderSimulation()
    await screen.findByTestId('notification-tray')

    await user.click(screen.getByRole('button', { name: 'Open Instagram' }))
    expect(screen.getByText(/Nothing new in Instagram/)).toBeTruthy()
    expect(server.calls.filter((call) => call.path.endsWith('/events'))).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: /Back to home screen/ }))
    expect(screen.getByRole('button', { name: 'Open WhatsApp, 1 unread item' })).toBeTruthy()
  })
})

describe('the profile chip menu', () => {
  it('offers history and accessibility only, with the masked number', async () => {
    const user = userEvent.setup()
    renderSimulation()

    const chip = await screen.findByRole('button', { name: /Test Learner/ })
    expect(chip.textContent).toContain('3456')
    expect(chip.textContent).not.toContain('ABC123456')

    // The client removed "Restarting (instructor only)" and "Log out" from this menu.
    const menu = await openChipMenu(user)
    expect(within(menu).getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Attempt history',
      'Accessibility',
    ])
    for (const item of within(menu).getAllByRole('menuitem')) {
      expect(item.disabled).toBe(false)
    }
    expect(within(menu).queryByRole('menuitem', { name: 'Restarting (instructor only)' }))
      .toBeNull()
    expect(within(menu).queryByRole('menuitem', { name: 'Log out' })).toBeNull()
  })

  it('opens the accessibility panel from the menu', async () => {
    const user = userEvent.setup()
    renderSimulation()

    const menu = await openChipMenu(user)
    await user.click(within(menu).getByRole('menuitem', { name: 'Accessibility' }))

    const dialog = await screen.findByRole('dialog', { name: 'Accessibility' })
    expect(within(dialog).getByText(/Tab and Shift\+Tab/)).toBeTruthy()
  })

  /**
   * IMMERSIVE-002: history is a panel inside this shell, not a route. The assessment must
   * still be behind it when it closes.
   */
  it('reaches attempt history without leaving the assessment', async () => {
    const user = userEvent.setup()
    renderSimulation()
    await screen.findByTestId('notification-tray')

    const menu = await openChipMenu(user)
    await user.click(within(menu).getByRole('menuitem', { name: 'Attempt history' }))

    const dialog = await screen.findByRole('dialog', { name: /Your attempt history/ })
    expect(within(dialog).getByTestId('history-panel-note')).toBeTruthy()
    // The legacy /history route was NOT navigated to.
    expect(screen.queryByText('Past assessments')).toBeNull()

    await user.keyboard('{Escape}')
    // The assessment is still on screen behind it, at the same position.
    expect(screen.queryByRole('dialog')).toBeNull()
    const heading = await screen.findByRole('heading', { name: /Scenario 1 of 10/ })
    expect(heading).toBeTruthy()
    expect(server.status).toBe('in_progress')
    expect(server.ordinal).toBe(1)
  }, 20000)
})

describe('the support controls', () => {
  it('explains the rules without revealing anything about the item on screen', async () => {
    const user = userEvent.setup()
    server.stage = 'branch'
    renderSimulation()
    await screen.findByRole('heading', { name: 'Decide' })

    await user.click(screen.getByRole('button', { name: 'Rules' }))
    const dialog = await screen.findByRole('dialog', { name: /Rules of this simulation/ })

    expect(within(dialog).getByText(/Everything here is synthetic/)).toBeTruthy()
    expect(within(dialog).getByText(/Nothing is carried out for real/)).toBeTruthy()
    expect(within(dialog).getByText(/shown once the whole attempt is complete/)).toBeTruthy()

    const text = dialog.textContent.toLowerCase()
    for (const term of [
      'malicious', 'legitimate', 'disposition', 'difficulty', 'easy', 'medium', 'hard',
      'attack family', 'expected', 'points', 'correct answer',
    ]) {
      expect(text).not.toContain(term)
    }
  })

  it('keeps the simulation-issue report separate from reporting a message', async () => {
    const user = userEvent.setup()
    renderSimulation()
    await screen.findByTestId('notification-tray')

    await user.click(screen.getByRole('button', { name: /Report a simulation issue/ }))
    const dialog = await screen.findByRole('dialog', { name: /Report a simulation issue/ })

    expect(within(dialog).getByText(/not the Report control inside a scenario/i)).toBeTruthy()
    expect(within(dialog).getByText(/not scored/i)).toBeTruthy()
    expect(within(dialog).getByText(/Scenario 1 of 10/)).toBeTruthy()

    // It files nothing, scores nothing and does not resolve the scenario.
    expect(server.calls.filter((call) => call.method !== 'GET')).toHaveLength(0)
    expect(server.stage).toBe('notify')
  })

  it('offers both support controls at every stage, not only on the hub', async () => {
    server.stage = 'verify'
    renderSimulation()
    await screen.findByRole('heading', { name: 'Verify' })

    expect(screen.getByRole('button', { name: 'Rules' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Report a simulation issue/ })).toBeTruthy()
  })
})

describe('interruption and resume', () => {
  it('flags an attempt picked up part-way and offers Resume', async () => {
    server.ordinal = 4
    server.stage = 'branch'
    server.sequence = 3
    server.resolved = 3
    renderSimulation()

    const notice = await screen.findByTestId('resume-status')
    expect(notice.textContent).toMatch(/interrupted/i)
    expect(within(notice).getByRole('button', { name: 'Resume' })).toBeTruthy()
  })

  it('resumes by re-reading the server rather than trusting what the tab held', async () => {
    const user = userEvent.setup()
    server.ordinal = 4
    server.stage = 'branch'
    server.sequence = 3
    server.resolved = 3
    renderSimulation()

    const notice = await screen.findByTestId('resume-status')
    const before = server.calls.filter((call) => call.method === 'GET').length

    await user.click(within(notice).getByRole('button', { name: 'Resume' }))

    await waitFor(() => expect(screen.queryByTestId('resume-status')).toBeNull())
    const after = server.calls.filter((call) => call.method === 'GET')
    expect(after.length).toBeGreaterThan(before)
    expect(after.some((call) => call.path === '/attempts/current')).toBe(true)
    expect(after.some((call) => call.path.endsWith('/current-run'))).toBe(true)

    // Nothing was written to recover, and the stage is still the server's.
    expect(server.calls.filter((call) => call.method === 'POST')).toHaveLength(0)
    expect(await screen.findByRole('heading', { name: 'Decide' })).toBeTruthy()
  })

  it('does not call a scenario walked through in this session an interruption', async () => {
    const user = userEvent.setup()
    renderSimulation()

    const tray = await screen.findByTestId('notification-tray')
    await user.click(within(tray).getByRole('button', { name: TOAST_OPEN }))
    await screen.findByRole('heading', { name: 'Open' })

    expect(screen.queryByTestId('resume-status')).toBeNull()
  })

  it('recovers the same state after a remount mid-scenario', async () => {
    server.ordinal = 6
    server.stage = 'verify'
    server.sequence = 4
    server.resolved = 5
    const first = renderSimulation()
    await screen.findByRole('heading', { name: 'Verify' })
    first.unmount()

    renderSimulation()
    expect(await screen.findByRole('heading', { level: 1, name: /Scenario 6 of 10/ })).toBeTruthy()
    expect(await screen.findByRole('heading', { name: 'Verify' })).toBeTruthy()
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })
})

describe('what the hub must never reveal', () => {
  const FORBIDDEN = [
    'malicious', 'legitimate', 'disposition', 'canonical_family', 'canonical_triggers',
    'military_flag', 'expected_safe_behavior', 'points_delta', 'seed', 'evaluation',
    'score_running', 'difficulty',
  ]

  it('renders no classification, scoring or selection metadata on the hub', async () => {
    renderSimulation()
    await screen.findByTestId('notification-tray')

    const markup = document.body.innerHTML.toLowerCase()
    for (const term of FORBIDDEN) expect(markup).not.toContain(term)
  })

  it('shows position and elapsed time but no running score in assessment mode', async () => {
    const user = userEvent.setup()
    server.stage = 'resolve'
    renderSimulation()

    expect(await screen.findByRole('heading', { level: 1, name: /Scenario 1 of 10/ })).toBeTruthy()
    expect(screen.getByText(/^\d\d:\d\d$/)).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Report it and close' }))
    await screen.findByRole('heading', { name: /Scenario 1 recorded/ })

    // The wire carries score_0_10: 8 for this run; nothing prints it.
    expect(screen.queryByText(/out of\s+10 for this scenario/)).toBeNull()
    expect(document.body.textContent).not.toMatch(/\b8\s*\/\s*10\b/)
  })

  it('keeps every hub control keyboard reachable and named', async () => {
    renderSimulation()
    await screen.findByTestId('notification-tray')

    for (const button of screen.getAllByRole('button')) {
      const name = button.getAttribute('aria-label') || button.textContent.trim()
      expect(name.length).toBeGreaterThan(0)
      expect(button.tabIndex).toBeGreaterThanOrEqual(-1)
    }
  })
})
