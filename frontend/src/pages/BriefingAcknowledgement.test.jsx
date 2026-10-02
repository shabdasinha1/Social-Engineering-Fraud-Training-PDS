import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CandidateProvider } from '@/context/CandidateProvider'
import { ROUTES } from '@/constants/routes'
import { BriefingPage } from '@/pages/BriefingPage'

/**
 * Briefing acknowledgement (PROFILE-001, specification section 2 - ACCEPTANCE-001 gap G3).
 *
 * Driven through the real `CandidateProvider` and the real `apiClient` against a stubbed
 * `fetch`, so the acknowledgement travels the same path it does in the product: a POST that
 * the server answers with the stored profile.
 */

const BRIEFING_VERSION = 1

function profile({ acknowledgedVersion = null, acknowledgedAt = null } = {}) {
  return {
    display_name: 'Asha Menon',
    service_no_masked: '••••••3210',
    created_at: '2026-09-01T09:00:00.000Z',
    last_seen_at: '2026-09-08T09:00:00.000Z',
    briefing: {
      required_version: BRIEFING_VERSION,
      acknowledged_version: acknowledgedVersion,
      acknowledged_at: acknowledgedAt,
      acknowledged: acknowledgedVersion === BRIEFING_VERSION,
    },
  }
}

/** A fake candidate API that stores the acknowledgement the way the server would. */
function createServer() {
  return {
    calls: [],
    stored: { acknowledgedVersion: null, acknowledgedAt: null },
    failAcknowledgeWith: null,
  }
}

function installFetch(server) {
  globalThis.fetch = async (url, options = {}) => {
    const path = String(url).replace(/^https?:\/\/[^/]+/, '').replace(/^\/api/, '')
    const body = options.body ? JSON.parse(options.body) : null
    server.calls.push({ path, method: options.method ?? 'GET', body })

    const ok = (data) => ({ ok: true, status: 200, json: async () => data })
    const err = (status, code, message) => ({
      ok: false, status, json: async () => ({ error: { code, message, details: null } }),
    })

    if (path === '/candidates/me') return ok({ candidate: profile(server.stored) })

    if (path === '/candidates/me/briefing') {
      if (server.failAcknowledgeWith) {
        const { status, code, message } = server.failAcknowledgeWith
        return err(status, code, message)
      }
      if (body?.version !== BRIEFING_VERSION) {
        return err(422, 'BRIEFING_VERSION_MISMATCH', 'That briefing version is not in force.')
      }
      server.stored = {
        acknowledgedVersion: body.version,
        acknowledgedAt: '2026-09-09T10:00:00.000Z',
      }
      return ok({ candidate: profile(server.stored) })
    }

    throw new Error(`unexpected request: ${path}`)
  }
}

function renderBriefing() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.BRIEFING]}>
      <CandidateProvider>
        <Routes>
          <Route path={ROUTES.BRIEFING} element={<BriefingPage />} />
          <Route path={ROUTES.DASHBOARD} element={<p>Dashboard screen</p>} />
        </Routes>
      </CandidateProvider>
    </MemoryRouter>,
  )
}

const confirmBox = () => screen.getByRole('checkbox')
const continueButton = () => screen.getByRole('button', { name: /Continue to Dashboard/ })
const acknowledgeCalls = (server) =>
  server.calls.filter((c) => c.path === '/candidates/me/briefing')

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

describe('a briefing that has not been acknowledged', () => {
  it('starts pending, with the requirement stated and the version named', async () => {
    renderBriefing()

    expect(await screen.findByRole('checkbox')).toBeDefined()
    expect(screen.getByText(/recorded against briefing version 1/)).toBeDefined()
    expect(screen.queryByText(/You acknowledged this briefing/)).toBeNull()
  })

  it('does not acknowledge merely because the page loaded', async () => {
    renderBriefing()
    await screen.findByRole('checkbox')

    // Give any stray effect a chance to fire before asserting nothing was sent.
    await waitFor(() => expect(server.calls.length).toBeGreaterThan(0))
    expect(acknowledgeCalls(server)).toHaveLength(0)
  })

  it('will not let the learner continue until they confirm', async () => {
    renderBriefing()
    await screen.findByRole('checkbox')

    expect(continueButton().disabled).toBe(true)
    expect(screen.queryByText('Dashboard screen')).toBeNull()
  })

  it('records the acknowledgement, then continues', async () => {
    const user = userEvent.setup()
    renderBriefing()
    await screen.findByRole('checkbox')

    await user.click(confirmBox())
    expect(continueButton().disabled).toBe(false)
    await user.click(continueButton())

    expect(await screen.findByText('Dashboard screen')).toBeDefined()
    const posted = acknowledgeCalls(server)
    expect(posted).toHaveLength(1)
    expect(posted[0].method).toBe('POST')
    expect(posted[0].body).toEqual({ version: BRIEFING_VERSION })
  })

  it('sends the version the server asked for, not one of its own', async () => {
    const user = userEvent.setup()
    renderBriefing()
    await screen.findByRole('checkbox')

    await user.click(confirmBox())
    await user.click(continueButton())
    await screen.findByText('Dashboard screen')

    expect(acknowledgeCalls(server)[0].body.version)
      .toBe(profile().briefing.required_version)
  })

  it('does not continue when the acknowledgement could not be recorded', async () => {
    const user = userEvent.setup()
    server.failAcknowledgeWith = { status: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong.' }
    renderBriefing()
    await screen.findByRole('checkbox')

    await user.click(confirmBox())
    await user.click(continueButton())

    expect(await screen.findByRole('alert')).toBeDefined()
    expect(screen.queryByText('Dashboard screen')).toBeNull()
    // An unrecorded acknowledgement must not be able to look like a recorded one.
    expect(server.stored.acknowledgedVersion).toBeNull()
  })
})

describe('a briefing that has been acknowledged', () => {
  it('shows the acknowledgement instead of asking again, and continues directly', async () => {
    const user = userEvent.setup()
    server.stored = { acknowledgedVersion: BRIEFING_VERSION, acknowledgedAt: '2026-09-09T10:00:00.000Z' }
    renderBriefing()

    expect(await screen.findByText(/You acknowledged this briefing/)).toBeDefined()
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(continueButton().disabled).toBe(false)

    await user.click(continueButton())
    expect(await screen.findByText('Dashboard screen')).toBeDefined()
    expect(acknowledgeCalls(server)).toHaveLength(0)
  })

  it('is retained on reload, because it lives on the server and not in the browser', async () => {
    const user = userEvent.setup()
    renderBriefing()
    await screen.findByRole('checkbox')
    await user.click(confirmBox())
    await user.click(continueButton())
    await screen.findByText('Dashboard screen')

    // A reload: a brand-new provider, a fresh session read, nothing carried in memory.
    cleanup()
    renderBriefing()

    expect(await screen.findByText(/You acknowledged this briefing/)).toBeDefined()
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })

  it('is requested again when the required version moves on, keeping the earlier record', async () => {
    // The learner acknowledged version 1; the server now requires a later one.
    server.stored = { acknowledgedVersion: BRIEFING_VERSION - 1, acknowledgedAt: '2026-09-01T09:01:00.000Z' }
    renderBriefing()

    expect(await screen.findByRole('checkbox')).toBeDefined()
    expect(screen.queryByText(/You acknowledged this briefing/)).toBeNull()
    // Nothing was deleted to make that happen: the stored record is still the older one.
    expect(server.stored.acknowledgedVersion).toBe(BRIEFING_VERSION - 1)
    expect(server.stored.acknowledgedAt).toBe('2026-09-01T09:01:00.000Z')
  })
})

describe('what the briefing screen must never carry', () => {
  it('shows the learner their own name and no identifier at all', async () => {
    renderBriefing()
    await screen.findByRole('checkbox')

    expect(screen.getByText(/Welcome, Asha/)).toBeDefined()
    const text = document.body.textContent
    expect(text).not.toContain('9876543210')
    expect(text).not.toMatch(/[0-9a-f]{24}/)
  })

  it('reaches no destination outside the candidate API', async () => {
    const user = userEvent.setup()
    renderBriefing()
    await screen.findByRole('checkbox')
    await user.click(confirmBox())
    await user.click(continueButton())
    await screen.findByText('Dashboard screen')

    for (const call of server.calls) {
      expect(call.path.startsWith('/candidates')).toBe(true)
    }
    expect(document.querySelectorAll('a[href^="http"]').length).toBe(0)
  })
})
