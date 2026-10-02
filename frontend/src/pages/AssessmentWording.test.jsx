import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CandidateProvider } from '@/context/CandidateProvider'
import { ROUTES } from '@/constants/routes'
import { SIMULATION_LABEL } from '@/constants/app'
import { BriefingPage } from '@/pages/BriefingPage'
import { LoginPage } from '@/pages/LoginPage'

/**
 * Serious assessment wording across the learner entry flow (CLIENT-POLISH-001).
 *
 * The client reviewed screenshots and asked for two things at once: language that reads as
 * a real assessment rather than optional practice, and the product's required simulation
 * identification left alone. Those pull in opposite directions if either is taken too far,
 * so both are pinned here together.
 */

const CANDIDATE = {
  display_name: 'Asha Menon',
  service_no_masked: '••••••3210',
  created_at: '2026-09-01T09:00:00.000Z',
  last_seen_at: '2026-09-09T09:00:00.000Z',
  briefing: {
    required_version: 1, acknowledged_version: null,
    acknowledged_at: null, acknowledged: false,
  },
}

/**
 * Wording the client asked to be removed. "Practice" on its own is deliberately NOT here:
 * section 7's remediation block legitimately recommends "practice scenarios", which is the
 * specification's own vocabulary for follow-up training and is not casual framing.
 */
const CASUAL_PHRASES = [
  /this is only practice/i,
  /only a practice/i,
  /just practice/i,
  /practice exercise/i,
  /for practice\b/i,
  /\bquiz\b/i,
  /\bgame\b/i,
  /have fun/i,
]

function installFetch({ signedIn = false } = {}) {
  globalThis.fetch = async (url) => {
    const path = String(url).replace(/^https?:\/\/[^/]+/, '').replace(/^\/api/, '')
    if (path === '/candidates/me') {
      return signedIn
        ? { ok: true, status: 200, json: async () => ({ candidate: CANDIDATE }) }
        : {
          ok: false,
          status: 401,
          json: async () => ({ error: { code: 'NO_SESSION', message: 'Please sign in.' } }),
        }
    }
    throw new Error(`unexpected request: ${path}`)
  }
}

const pageText = () => document.body.textContent.replace(/\s+/g, ' ')

function renderAt(route, element) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <CandidateProvider>
        <Routes>
          <Route path={route} element={element} />
          <Route path={ROUTES.DASHBOARD} element={<p>Dashboard</p>} />
          <Route path={ROUTES.BRIEFING} element={<p>Briefing</p>} />
        </Routes>
      </CandidateProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  delete globalThis.fetch
})

describe('the login screen', () => {
  beforeEach(() => installFetch({ signedIn: false }))

  it('frames the product as an assessment', async () => {
    renderAt(ROUTES.LOGIN, <LoginPage />)
    await screen.findByLabelText(/Full Name/)
    expect(pageText()).toMatch(/Assessment environment/i)
    expect(pageText()).toMatch(/evaluated across simulated communications/i)
  })

  it('carries no casual practice wording', async () => {
    renderAt(ROUTES.LOGIN, <LoginPage />)
    await screen.findByLabelText(/Full Name/)
    for (const phrase of CASUAL_PHRASES) {
      expect(pageText()).not.toMatch(phrase)
    }
  })

  it('still shows the required simulation identification', async () => {
    renderAt(ROUTES.LOGIN, <LoginPage />)
    await screen.findByLabelText(/Full Name/)
    expect(screen.getByText(SIMULATION_LABEL)).toBeTruthy()
  })
})

describe('the briefing screen', () => {
  beforeEach(() => installFetch({ signedIn: true }))

  it('replaces "This is only practice" with assessment framing', async () => {
    renderAt(ROUTES.BRIEFING, <BriefingPage />)
    await screen.findByRole('checkbox')

    // The exact line the client named.
    expect(pageText()).not.toMatch(/this is only practice/i)
    expect(pageText()).toMatch(/Assessment environment/i)
  })

  it('says the assessment is evaluated', async () => {
    renderAt(ROUTES.BRIEFING, <BriefingPage />)
    await screen.findByRole('checkbox')
    expect(pageText()).toMatch(/it is assessed/i)
    expect(pageText()).toMatch(/decisions are evaluated/i)
  })

  it('carries no casual practice wording anywhere', async () => {
    renderAt(ROUTES.BRIEFING, <BriefingPage />)
    await screen.findByRole('checkbox')
    for (const phrase of CASUAL_PHRASES) {
      expect(pageText()).not.toMatch(phrase)
    }
  })

  it('keeps every safety fact the panel always carried', async () => {
    renderAt(ROUTES.BRIEFING, <BriefingPage />)
    await screen.findByRole('checkbox')

    const text = pageText()
    expect(text).toMatch(/No real message is sent and no real person is contacted/i)
    expect(text).toMatch(/synthetic content generated for this assessment/i)
    expect(text).toMatch(/Never type a real password, OTP, bank or card detail/i)
  })

  it('still identifies the environment as a training simulation', async () => {
    renderAt(ROUTES.BRIEFING, <BriefingPage />)
    await screen.findByRole('checkbox')
    // The rail carries SIMULATION_LABEL; the prose keeps the words too.
    expect(pageText()).toMatch(/controlled training simulation/i)
  })

  it('does not overstate the environment as real', async () => {
    renderAt(ROUTES.BRIEFING, <BriefingPage />)
    await screen.findByRole('checkbox')

    const text = pageText()

    /**
     * Seriousness must never become a claim that real systems or people are involved. The
     * page states the opposite explicitly, and makes no affirmative delivery claim.
     */
    expect(text).toMatch(/No real message is sent and no real person is contacted/i)
    expect(text).toMatch(/synthetic/i)
    for (const claim of [
      /will be sent/i, /will be delivered/i, /will be charged/i,
      /real recipient/i, /actually sent/i, /live system/i,
    ]) {
      expect(text).not.toMatch(claim)
    }
  })
})

describe('the wording change is confined to framing', () => {
  beforeEach(() => installFetch({ signedIn: true }))

  it('does not alter what the learner is asked to acknowledge', async () => {
    renderAt(ROUTES.BRIEFING, <BriefingPage />)
    const checkbox = await screen.findByRole('checkbox')

    expect(pageText()).toMatch(/I have read this briefing and understand how this assessment works/i)
    expect(checkbox.checked).toBe(false)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Continue to Dashboard/ }).disabled).toBe(true))
  })
})
