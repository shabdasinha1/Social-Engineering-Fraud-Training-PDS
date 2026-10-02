import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CandidateProvider } from '@/context/CandidateProvider'
import { ROUTES } from '@/constants/routes'
import { DashboardPage } from '@/pages/DashboardPage'

/**
 * FINAL-PRE-CLIENT-FIX-001 - what the learner dashboard offers for each state of the
 * attempt `GET /attempts/current` reports.
 *
 * That endpoint returns the in-progress attempt, OR - when there is none - the learner's
 * most recent EXPIRED attempt, so the simulation screen can explain a timeout. Only the
 * first may be resumed. These tests pin that an expired attempt no longer strands the
 * learner on a Resume button that leads only to "Time is up".
 */

const CANDIDATE = {
  display_name: 'Asha Menon',
  service_no_masked: '••••••3210',
  created_at: '2026-09-01T09:00:00.000Z',
  last_seen_at: '2026-09-09T09:00:00.000Z',
  briefing: {
    required_version: 1, acknowledged_version: 1,
    acknowledged_at: '2026-09-01T09:01:00.000Z', acknowledged: true,
  },
}

const attempt = (over = {}) => ({
  attempt_id: 'a1',
  mode: 'assessment',
  status: 'in_progress',
  total_scenarios: 10,
  started_at: '2026-09-24T09:00:00.000Z',
  completed_at: null,
  total_score: null,
  expires_at: '2026-09-24T10:30:00.000Z',
  server_now: '2026-09-24T09:10:00.000Z',
  end_reason: null,
  progress: { resolved: 4, total: 10, all_resolved: false },
  current_run: { run_id: 'r5', ordinal: 5, platform: 'sms', current_stage: 'notify', status: 'active' },
  ...over,
})

/** The shape the server really sends for an attempt the 90-minute limit closed. */
const expired = (over = {}) => attempt({
  status: 'completed',
  completed_at: '2026-09-24T10:30:05.000Z',
  total_score: 22,
  end_reason: 'expired',
  progress: { resolved: 10, total: 10, all_resolved: true },
  current_run: null,
  ...over,
})

let server

function installFetch() {
  globalThis.fetch = async (url, options = {}) => {
    const path = String(url).replace(/^https?:\/\/[^/]+/, '').replace(/^\/api/, '')
    const method = options.method ?? 'GET'
    server.calls.push({ path, method, body: options.body ?? null })
    const ok = (data, status = 200) => ({ ok: true, status, json: async () => data })

    if (path === '/candidates/me') return ok({ candidate: CANDIDATE })
    if (path === '/progress') return ok({ progress: server.progress })
    if (path === '/attempts/current') return ok({ attempt: server.current })
    if (path === '/candidates/logout' && method === 'POST') return ok({ ok: true })
    if (path === '/attempts' && method === 'POST') {
      // As the real controller: nothing in progress, so a NEW attempt is created.
      return ok({ attempt: attempt({ attempt_id: 'a2', progress: { resolved: 0, total: 10 } }), created: true }, 201)
    }
    throw new Error(`unexpected request: ${method} ${path}`)
  }
}

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.DASHBOARD]}>
      <CandidateProvider>
        <Routes>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.ASSESSMENT} element={<p>Assessment screen</p>} />
          <Route path={ROUTES.LOGIN} element={<p>Login screen</p>} />
        </Routes>
      </CandidateProvider>
    </MemoryRouter>,
  )
}

const starts = () => server.calls.filter((c) => c.method === 'POST' && c.path === '/attempts')

beforeEach(() => {
  server = {
    calls: [],
    current: null,
    progress: {
      attempt_count: 1, scenarios_completed: 10, last_score: 22, best_score: 22, max_score: 100,
      by_platform: [], by_family: [], mixed_versions: false, generated_at: '2026-09-24T11:00:00.000Z',
    },
  }
  installFetch()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  delete globalThis.fetch
})

describe('the dashboard action for each attempt state', () => {
  it('an in-progress attempt offers Resume, and resuming creates nothing', async () => {
    server.current = attempt()
    const user = userEvent.setup()
    renderDashboard()

    const resume = await screen.findByRole('button', { name: /Resume Assessment/ })
    expect(screen.queryByRole('button', { name: /Start Assessment/ })).toBeNull()
    expect(document.body.textContent).toMatch(/4 of 10 completed/)

    await user.click(resume)
    expect(await screen.findByText('Assessment screen')).toBeTruthy()
    expect(starts()).toHaveLength(0)
  })

  it('an EXPIRED attempt offers Start, not Resume', async () => {
    server.current = expired()
    renderDashboard()

    expect(await screen.findByRole('button', { name: /Start Assessment/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Resume Assessment/ })).toBeNull()
    // Nothing of the finished attempt is presented as work still to do.
    expect(document.body.textContent).toMatch(/0 of 10 completed/)
    expect(document.body.textContent).not.toMatch(/In progress/i)
  })

  it('Start after an expiry asks the server for a NEW attempt, then opens it', async () => {
    server.current = expired()
    const user = userEvent.setup()
    renderDashboard()

    await user.click(await screen.findByRole('button', { name: /Start Assessment/ }))
    expect(await screen.findByText('Assessment screen')).toBeTruthy()
    expect(starts()).toHaveLength(1)
    // The same request the Start button always sent: the server chooses everything.
    expect(starts()[0].body).toBeNull()
  })

  it('with no attempt in progress after a normal completion, the existing Start state is shown', async () => {
    // A normally completed attempt is never reported by /attempts/current - it is history.
    server.current = null
    renderDashboard()
    expect(await screen.findByRole('button', { name: /Start Assessment/ })).toBeTruthy()
    await waitFor(() => expect(document.body.textContent).toMatch(/1\s*assessment completed/))
    expect(screen.queryByRole('button', { name: /Resume Assessment/ })).toBeNull()
  })

  it('any other finished attempt - completed or reset - is not resumable either', async () => {
    for (const current of [
      expired({ end_reason: 'learner_completed' }),
      attempt({ status: 'abandoned', end_reason: 'instructor_reset', current_run: null }),
    ]) {
      server.current = current
      renderDashboard()
      expect(await screen.findByRole('button', { name: /Start Assessment/ })).toBeTruthy()
      expect(screen.queryByRole('button', { name: /Resume Assessment/ })).toBeNull()
      cleanup()
    }
  })

  it('a Demo User whose demo attempt expired can start a fresh one', async () => {
    server.current = expired({ is_demo: true })
    const user = userEvent.setup()
    renderDashboard()

    expect(screen.queryByRole('button', { name: /Resume Assessment/ })).toBeNull()
    await user.click(await screen.findByRole('button', { name: /Start Assessment/ }))
    expect(await screen.findByText('Assessment screen')).toBeTruthy()
    // No demo flag is ever sent: the server decides who is the Demo User.
    expect(starts()).toHaveLength(1)
    expect(starts()[0].body).toBeNull()
  })

  it('an in-progress demo attempt still offers Resume', async () => {
    server.current = attempt({ is_demo: true })
    renderDashboard()
    expect(await screen.findByRole('button', { name: /Resume Assessment/ })).toBeTruthy()
  })
})

describe('the dashboard logout', () => {
  it('shows a Logout control in the top header', async () => {
    renderDashboard()
    // The top app bar, the first <header> on the page (the welcome block is another).
    const [banner] = await screen.findAllByRole('banner')
    const logout = within(banner).getByRole('button', { name: 'Logout' })
    expect(logout.disabled).toBe(false)
  })

  it('uses the existing candidate sign-out, then returns to login', async () => {
    server.current = attempt()
    const user = userEvent.setup()
    renderDashboard()

    // The top app bar, the first <header> on the page (the welcome block is another).
    const [banner] = await screen.findAllByRole('banner')
    await user.click(within(banner).getByRole('button', { name: 'Logout' }))

    expect(await screen.findByText('Login screen')).toBeTruthy()
    // The ONLY write is the existing logout endpoint. No attempt is started or changed.
    const writes = server.calls.filter((c) => c.method !== 'GET')
    expect(writes.map((c) => `${c.method} ${c.path}`)).toEqual(['POST /candidates/logout'])
  })
})
