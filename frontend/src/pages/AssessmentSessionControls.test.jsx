import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, configure, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CandidateProvider } from '@/context/CandidateProvider'
import { ROUTES } from '@/constants/routes'
import { SimulationPage } from '@/pages/SimulationPage'
import { ResultPage } from '@/pages/ResultPage'
import { createFakeServer, installFetch } from '@/test/attemptFixtures'

/**
 * Active-assessment session controls (IMMERSIVE-002).
 *
 * The one property every test here defends: **using any part of the menu cannot end,
 * reset, abandon or extend the assessment behind it.**
 *
 * The chip menu contains attempt history and accessibility only. The client removed
 * "Restarting (instructor only)" and "Log out" from it, so the assessment screen offers
 * no sign-out; a test below asserts exactly that.
 */

configure({ asyncUtilTimeout: 8000 })

/** The section 3 delivery window runs for real in this shell, so 5s is not enough. */
const T = 20000
let server

function renderSimulation() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.ASSESSMENT]}>
      <CandidateProvider>
        <Routes>
          <Route path={ROUTES.ASSESSMENT} element={<SimulationPage />} />
          <Route path={ROUTES.RESULT} element={<ResultPage />} />
          <Route path={ROUTES.HISTORY} element={<p>LEGACY HISTORY ROUTE</p>} />
          <Route path={ROUTES.LOGIN} element={<p>LOGIN SCREEN</p>} />
          <Route path={ROUTES.DASHBOARD} element={<p>DASHBOARD</p>} />
        </Routes>
      </CandidateProvider>
    </MemoryRouter>,
  )
}

async function openMenu(user) {
  await user.click(await screen.findByRole('button', { name: /Test Learner/ }))
  return screen.getByRole('menu')
}

/** Everything the server would have to be asked to change an attempt. */
const writes = () => server.calls.filter((call) => call.method !== 'GET')

beforeEach(() => {
  server = createFakeServer()
  installFetch(server)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

/* ================================================================== *
 * The menu itself
 * ================================================================== */

describe('the active-assessment menu', () => {
  it('offers attempt history and accessibility only, in order, none disabled', async () => {
    const user = userEvent.setup()
    renderSimulation()

    const menu = await openMenu(user)
    const items = within(menu).getAllByRole('menuitem')

    expect(items.map((i) => i.textContent)).toEqual(['Attempt history', 'Accessibility'])
    for (const item of items) expect(item.disabled).toBe(false)
  }, T)

  it('no longer offers restart or log out', async () => {
    const user = userEvent.setup()
    renderSimulation()

    const menu = await openMenu(user)
    expect(within(menu).queryByRole('menuitem', { name: 'Restarting (instructor only)' }))
      .toBeNull()
    expect(within(menu).queryByRole('menuitem', { name: 'Log out' })).toBeNull()
    // The assessment screen offers no sign-out control anywhere.
    expect(screen.queryByRole('menuitem', { name: /log ?out|sign out/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /log ?out|sign out/i })).toBeNull()
  }, T)

  it('no menu action can complete, reset or abandon the attempt', async () => {
    const user = userEvent.setup()
    renderSimulation()

    for (const name of ['Attempt history', 'Accessibility']) {
      const menu = await openMenu(user)
      await user.click(within(menu).getByRole('menuitem', { name }))
      await screen.findByRole('dialog')
      await user.keyboard('{Escape}')
    }

    const paths = writes().map((call) => call.path)
    expect(paths).toHaveLength(0)
    for (const forbidden of ['/complete', '/reset', '/abandon']) {
      expect(paths.some((path) => path.includes(forbidden))).toBe(false)
    }
    expect(server.status).toBe('in_progress')
  }, T)

  it('is reachable and operable from the keyboard alone', async () => {
    const user = userEvent.setup()
    renderSimulation()
    await screen.findByRole('button', { name: /Test Learner/ })

    const chip = screen.getByRole('button', { name: /Test Learner/ })
    chip.focus()
    expect(document.activeElement).toBe(chip)
    expect(chip.getAttribute('aria-haspopup')).toBe('menu')

    await user.keyboard('{Enter}')
    const menu = await screen.findByRole('menu')
    expect(chip.getAttribute('aria-expanded')).toBe('true')
    for (const item of within(menu).getAllByRole('menuitem')) {
      expect(item.tagName).toBe('BUTTON')
    }
  }, T)

  it('closes on Escape without touching the assessment', async () => {
    const user = userEvent.setup()
    renderSimulation()

    await openMenu(user)
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).toBeNull()
    expect(writes()).toHaveLength(0)
    expect(server.status).toBe('in_progress')
  }, T)

  it('opening the menu submits nothing', async () => {
    const user = userEvent.setup()
    renderSimulation()
    await screen.findByTestId('notification-tray')

    const before = server.calls.length
    await openMenu(user)

    expect(server.calls.length).toBe(before)
    expect(writes()).toHaveLength(0)
  }, T)
})

/* ================================================================== *
 * Attempt history
 * ================================================================== */

describe('attempt history', () => {
  it('opens in the assessment shell and does not navigate to the history route', async () => {
    const user = userEvent.setup()
    server.completedAttempts = 2
    renderSimulation()

    const menu = await openMenu(user)
    await user.click(within(menu).getByRole('menuitem', { name: 'Attempt history' }))

    const dialog = await screen.findByRole('dialog', { name: /Your attempt history/ })
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(screen.queryByText('LEGACY HISTORY ROUTE')).toBeNull()
    expect(await within(dialog).findByText('Assessments completed')).toBeTruthy()
  }, T)

  it('leaves the attempt, its stage and its deadline untouched', async () => {
    const user = userEvent.setup()
    renderSimulation()
    await screen.findByTestId('notification-tray')

    const deadlineBefore = server.expiresAt
    const countdownBefore = screen.getByTestId('time-remaining').textContent

    const menu = await openMenu(user)
    await user.click(within(menu).getByRole('menuitem', { name: 'Attempt history' }))
    await screen.findByRole('dialog', { name: /Your attempt history/ })
    await user.keyboard('{Escape}')

    expect(writes()).toHaveLength(0)
    expect(server.status).toBe('in_progress')
    expect(server.ordinal).toBe(1)
    expect(server.stage).toBe('notify')
    expect(server.sequence).toBe(0)
    expect(server.expiresAt).toBe(deadlineBefore)
    // The countdown kept counting; it did not reset to the full limit.
    expect(screen.getByTestId('time-remaining').textContent).not.toBe('Time remaining 1:30:00 left')
    expect(countdownBefore).toBeTruthy()
  }, T)

  it('says the current assessment is still running and was not paused', async () => {
    const user = userEvent.setup()
    renderSimulation()

    const menu = await openMenu(user)
    await user.click(within(menu).getByRole('menuitem', { name: 'Attempt history' }))

    const note = await screen.findByTestId('history-panel-note')
    expect(note.textContent).toMatch(/still running/i)
    expect(note.textContent).toMatch(/not been paused/i)
  }, T)

  it('exposes no scenario, classification, event or seed data', async () => {
    const user = userEvent.setup()
    server.completedAttempts = 3
    renderSimulation()

    const menu = await openMenu(user)
    await user.click(within(menu).getByRole('menuitem', { name: 'Attempt history' }))
    const dialog = await screen.findByRole('dialog', { name: /Your attempt history/ })

    const text = dialog.textContent
    for (const forbidden of ['W0', 'I0', 'E0', 'S0', 'malicious', 'legitimate', 'seed',
      'points_delta', 'intent_key', 'attempt_id', 'run_id', 'easy', 'medium', 'hard']) {
      expect(text).not.toContain(forbidden)
    }
  }, T)
})

/* ================================================================== *
 * Accessibility
 * ================================================================== */

describe('accessibility', () => {
  it('opens immediately, with no confirmation and no gate', async () => {
    const user = userEvent.setup()
    renderSimulation()

    const menu = await openMenu(user)
    await user.click(within(menu).getByRole('menuitem', { name: 'Accessibility' }))

    // Straight to the panel - no intermediate "are you sure".
    const dialog = await screen.findByRole('dialog', { name: 'Accessibility' })
    expect(within(dialog).getByText(/Tab and Shift\+Tab/)).toBeTruthy()
    expect(within(dialog).queryByRole('button', { name: /confirm|continue|yes/i })).toBeNull()
  }, T)

  it('mutates no attempt, stage, score or deadline', async () => {
    const user = userEvent.setup()
    renderSimulation()
    await screen.findByTestId('notification-tray')

    const deadlineBefore = server.expiresAt
    const menu = await openMenu(user)
    await user.click(within(menu).getByRole('menuitem', { name: 'Accessibility' }))
    await screen.findByRole('dialog', { name: 'Accessibility' })
    await user.keyboard('{Escape}')

    expect(writes()).toHaveLength(0)
    expect(server.status).toBe('in_progress')
    expect(server.stage).toBe('notify')
    expect(server.sequence).toBe(0)
    expect(server.expiresAt).toBe(deadlineBefore)
  }, T)
})

/* ================================================================== *
 * Scope: the restrictions belong to a LIVE assessment only
 * ================================================================== */

describe('after the assessment has ended', () => {
  it('a timed-out attempt shows the timeout screen, not the menu', async () => {
    server.status = 'completed'
    server.endReason = 'expired'
    server.timedOut = true
    server.unresolvedAtExpiry = 4
    renderSimulation()

    expect(await screen.findByText(/Time is up/i)).toBeTruthy()
    // No live-assessment chip menu on a terminal screen.
    expect(screen.queryByRole('button', { name: /Test Learner/ })).toBeNull()
  }, T)

  it('a normally completed attempt carries no live-assessment controls', async () => {
    server.status = 'completed'
    server.endReason = 'learner_completed'
    renderSimulation()

    /**
     * The learner has no attempt in flight, so this shell offers no chip menu and no
     * confirmation of any kind. The point of the test is scope: the restrictions this task
     * introduced belong to a LIVE assessment and must not leak onto a terminal state.
     */
    await screen.findByText(/No assessment in progress|Attempt complete/i)
    expect(screen.queryByRole('button', { name: /Test Learner/ })).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByTestId('time-remaining')).toBeNull()
  }, T)
})
