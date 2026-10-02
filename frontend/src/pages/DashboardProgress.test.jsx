import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CandidateProvider } from '@/context/CandidateProvider'
import { ROUTES } from '@/constants/routes'
import { DashboardPage } from '@/pages/DashboardPage'

/**
 * The learner-facing progress count (PROGRESS-001, section 7 - ACCEPTANCE-001 gap G2).
 *
 * Driven through the real `progressApi` and `apiClient` against a stubbed `fetch`, so the
 * dashboard reads the same payload the server actually publishes.
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

const progressPayload = (over = {}) => ({
  attempt_count: 3,
  scenarios_completed: 30,
  last_score: 72,
  best_score: 88,
  max_score: 100,
  by_platform: [{ key: 'whatsapp', label: 'WhatsApp', scenarios: 8, points: 56, max_points: 80 }],
  by_family: [{ key: 'credential_phishing', label: 'Credential phishing', scenarios: 6, points: 40, max_points: 60 }],
  mixed_versions: false,
  generated_at: '2026-09-09T10:00:00.000Z',
  ...over,
})

function createServer() {
  return {
    calls: [],
    activeAttempt: null,
    progress: progressPayload(),
    progressStatus: 200,
    holdProgress: null,
  }
}

function installFetch(server) {
  globalThis.fetch = async (url, options = {}) => {
    const path = String(url).replace(/^https?:\/\/[^/]+/, '').replace(/^\/api/, '')
    server.calls.push({ path, method: options.method ?? 'GET' })

    const ok = (data) => ({ ok: true, status: 200, json: async () => data })
    const err = (status, code) => ({
      ok: false, status, json: async () => ({ error: { code, message: 'failed', details: null } }),
    })

    if (path === '/candidates/me') return ok({ candidate: CANDIDATE })
    if (path === '/attempts/current') return ok({ attempt: server.activeAttempt })
    if (path === '/progress') {
      if (server.holdProgress) await server.holdProgress
      if (server.progressStatus !== 200) return err(server.progressStatus, 'INTERNAL_ERROR')
      return ok({ progress: server.progress })
    }
    throw new Error(`unexpected request: ${path}`)
  }
}

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.DASHBOARD]}>
      <CandidateProvider>
        <Routes>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.ASSESSMENT} element={<p>Assessment screen</p>} />
        </Routes>
      </CandidateProvider>
    </MemoryRouter>,
  )
}

/** The rendered page as one normalised string - the progress line spans several nodes. */
const pageText = () => document.body.textContent.replace(/\s+/g, ' ')

/** Waits until the rendered page matches `pattern`. */
const waitForText = (pattern) => waitFor(() => expect(pageText()).toMatch(pattern))

let server

beforeEach(() => {
  server = createServer()
  installFetch(server)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  delete globalThis.fetch
})

describe('the exposure count', () => {
  it('shows how many assessments the learner has completed', async () => {
    renderDashboard()
    await waitForText(/3 assessments completed/)
  })

  it('reads the count from the server rather than counting anything itself', async () => {
    server.progress = progressPayload({ attempt_count: 11 })
    renderDashboard()

    await waitForText(/11 assessments completed/)
    expect(server.calls.some((c) => c.path === '/progress' && c.method === 'GET')).toBe(true)
  })

  it('says "assessment" in the singular for exactly one', async () => {
    server.progress = progressPayload({ attempt_count: 1 })
    renderDashboard()
    await waitForText(/1 assessment completed/)
  })

  it('shows the last and best score once there is one', async () => {
    renderDashboard()
    await waitForText(/3 assessments completed/)
    expect(pageText()).toMatch(/Last score 72\/100/)
    expect(pageText()).toMatch(/Best score 88\/100/)
  })
})

describe('a learner with no completed assessment', () => {
  it('shows a zero count and no score at all', async () => {
    server.progress = progressPayload({
      attempt_count: 0, scenarios_completed: 0, last_score: null, best_score: null,
      by_platform: [], by_family: [],
    })
    renderDashboard()

    await waitForText(/0 assessments completed/)
    expect(pageText()).toMatch(/This will be your first/)
    // Nothing invents a zero score for a learner who has never been scored.
    expect(pageText()).not.toMatch(/0\/100/)
    expect(pageText()).not.toMatch(/Best score/)
    expect(pageText()).not.toMatch(/Last score/)
  })
})

describe('when progress is unavailable', () => {
  it('announces that it is loading first', async () => {
    let release
    server.holdProgress = new Promise((resolve) => { release = resolve })
    renderDashboard()

    await waitForText(/Loading your progress/)
    release()
    await waitForText(/3 assessments completed/)
  })

  it('drops the line rather than breaking the dashboard', async () => {
    server.progressStatus = 500
    renderDashboard()

    // The assessment card still renders and stays usable.
    expect(await screen.findByRole('button', { name: /Start Assessment/ })).toBeDefined()
    await waitFor(() => expect(pageText()).not.toMatch(/Loading your progress/))
    expect(pageText()).not.toMatch(/assessments completed/)
    // A progress failure is not the page's error.
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('a progress failure does not stop an assessment being started', async () => {
    server.progressStatus = 500
    renderDashboard()
    expect(await screen.findByRole('button', { name: /Start Assessment/ })).toBeDefined()
  })
})

describe('what the dashboard must never show', () => {
  it('shows no running score while an assessment is in progress', async () => {
    server.activeAttempt = {
      attempt_id: 'a1', status: 'in_progress', mode: 'assessment',
      progress: { resolved: 4, total: 10 },
    }
    // The snapshot counts only completed attempts, so the in-progress one is not in it.
    server.progress = progressPayload({ attempt_count: 2, last_score: 61, best_score: 74 })
    renderDashboard()

    await waitForText(/2 assessments completed/)
    expect(await screen.findByRole('button', { name: /Resume Assessment/ })).toBeDefined()

    // The only "of 10" figure is the scenario progress bar, never a score.
    expect(pageText()).toMatch(/4 of 10 completed/)
    const text = document.body.textContent
    expect(text).not.toMatch(/running score/i)
    expect(text).not.toMatch(/current score/i)
  })

  it('renders no scenario classification, family breakdown or chart', async () => {
    renderDashboard()
    await waitForText(/3 assessments completed/)

    const text = document.body.textContent.toLowerCase()
    for (const forbidden of ['malicious', 'legitimate', 'disposition', 'credential phishing',
      'attack family', 'trigger', 'difficulty', 'easy', 'medium', 'hard',
      'missed threat', 'false positive', 'vulnerab']) {
      expect(text).not.toContain(forbidden)
    }
    /**
     * The payload carries platform and family buckets; the dashboard deliberately renders
     * neither. The four app names DO appear - "Where the scenarios come from" has always
     * listed them - so the thing to assert is that no bucket's numbers reached the page.
     */
    expect(pageText()).not.toMatch(/56\/80/)
    expect(pageText()).not.toMatch(/40\/60/)
    expect(pageText()).not.toMatch(/8 scenarios/)
  })

  it('reaches no destination outside the training API', async () => {
    renderDashboard()
    await waitForText(/3 assessments completed/)

    for (const call of server.calls) {
      expect(/^\/(candidates|attempts|progress)/.test(call.path)).toBe(true)
    }
    expect(document.querySelectorAll('a[href^="http"]').length).toBe(0)
  })
})
