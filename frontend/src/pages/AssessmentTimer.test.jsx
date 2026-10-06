import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, configure, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CandidateProvider } from '@/context/CandidateProvider'
import { ROUTES } from '@/constants/routes'
import { SimulationPage } from '@/pages/SimulationPage'
import { ResultPage } from '@/pages/ResultPage'
import { formatRemaining, remainingFrom } from '@/utils/assessmentClock'
import { createFakeServer, installFetch } from '@/test/attemptFixtures'

/**
 * The 90-minute assessment timer, from the learner's side (IMMERSIVE-001).
 *
 * The single property every test here defends: **the browser never ends an assessment.**
 * The countdown is arithmetic over a server-supplied deadline, and the only thing it does
 * at zero is ask the server what is true.
 */

configure({ asyncUtilTimeout: 8000 })

/** The section 3 delivery window is real in these tests, so 5s is not enough. */
const TEST_TIMEOUT = 20000

const MINUTE = 60 * 1000
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

beforeEach(() => {
  server = createFakeServer()
  installFetch(server)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

/* ------------------------------------------------------------------ *
 * The arithmetic, with no DOM and no timers
 * ------------------------------------------------------------------ */

describe('remaining time', () => {
  it('is measured against the server deadline, not against a local start time', () => {
    const now = Date.parse('2026-09-09T12:00:00.000Z')
    const expires = '2026-09-09T12:30:00.000Z'
    expect(remainingFrom(expires, { now, offsetMs: 0 })).toBe(30 * MINUTE)
  })

  it('corrects for a wrong local clock instead of trusting it', () => {
    const expires = '2026-09-09T12:30:00.000Z'
    const trueNow = Date.parse('2026-09-09T12:00:00.000Z')

    // This machine's clock is five minutes fast. The server said so, so the offset says so.
    const localNow = trueNow + 5 * MINUTE
    const offsetMs = trueNow - localNow

    expect(remainingFrom(expires, { now: localNow, offsetMs })).toBe(30 * MINUTE)
  })

  it('never reports negative time, however far past the deadline', () => {
    const expires = '2026-09-09T12:00:00.000Z'
    expect(remainingFrom(expires, { now: Date.parse(expires) })).toBe(0)
    expect(remainingFrom(expires, { now: Date.parse(expires) + 5 * 60 * MINUTE })).toBe(0)
  })

  it('has no deadline to report when the attempt has none', () => {
    expect(remainingFrom(null)).toBeNull()
    expect(remainingFrom(undefined)).toBeNull()
    expect(remainingFrom('not-a-date')).toBeNull()
  })

  it('formats minutes and seconds, and hours only while they exist', () => {
    expect(formatRemaining(90 * MINUTE)).toBe('1:30:00')
    expect(formatRemaining(9 * MINUTE + 5000)).toBe('09:05')
    expect(formatRemaining(0)).toBe('00:00')
    expect(formatRemaining(-5000)).toBe('00:00')
  })
})

/* ------------------------------------------------------------------ *
 * The countdown on screen
 * ------------------------------------------------------------------ */

describe('the countdown', () => {
  it('renders from the deadline the server sent', async () => {
    const now = Date.now()
    server.serverNow = new Date(now).toISOString()
    server.expiresAt = new Date(now + 45 * MINUTE).toISOString()

    renderSimulation()
    const remaining = await screen.findByTestId('time-remaining')
    expect(remaining.textContent).toMatch(/44:5\d left|45:00 left/)
  })

  it('shows the time left on the attempt\'s own stored deadline, whatever duration it was given', async () => {
    // An attempt started 10 minutes ago under a 30-minute configured duration. The browser
    // knows nothing about the setting: it only has the server's deadline and clock, and
    // this machine's clock is 3 minutes slow - the server's clock is the one that counts.
    const serverNow = Date.now()
    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      vi.setSystemTime(serverNow - 3 * MINUTE)
      server.serverNow = new Date(serverNow).toISOString()
      server.expiresAt = new Date(serverNow - 10 * MINUTE + 30 * MINUTE).toISOString()

      renderSimulation()
      const remaining = await screen.findByTestId('time-remaining')
      expect(remaining.textContent).toMatch(/\b(19:5\d|20:00) left$/)
    } finally {
      vi.useRealTimers()
    }
  }, TEST_TIMEOUT)

  it('is the only clock in the header - no elapsed (count-up) timer is shown', async () => {
    const now = Date.now()
    server.serverNow = new Date(now).toISOString()
    server.expiresAt = new Date(now + 90 * MINUTE).toISOString()

    renderSimulation()
    const remaining = await screen.findByTestId('time-remaining')
    expect(screen.queryByText(/Elapsed time/i)).toBeNull()

    // The header's time line holds the countdown and nothing else.
    const timeLine = remaining.parentElement
    expect(timeLine.textContent.trim()).toBe(remaining.textContent.trim())
    expect(timeLine.textContent).not.toMatch(/·/)
  })

  it('is absent for an attempt that has no deadline', async () => {
    server.expiresAt = null
    renderSimulation()
    await screen.findByRole('button', { name: /^Open QuickParcel Support, in WhatsApp$/ })
    expect(screen.queryByTestId('time-remaining')).toBeNull()
  }, TEST_TIMEOUT)

  it('does not restart when the component remounts', async () => {
    /**
     * Deterministic by construction. Only `Date` is faked - every other timer, including the
     * section 3 delivery window, stays real - so the clock reads exactly what the test says.
     *
     * `serverNow = null` makes the fake server stamp `server_now` from that same clock on
     * every response, which is what the real API does. The previous version pinned
     * `server_now` to one instant, so each mount re-anchored to a server clock that never
     * moved and could read ONE SECOND MORE than the mount before it whenever the first
     * reading had already ticked past a second boundary - a fixture artefact that failed
     * under full-suite load, not a property of the countdown.
     */
    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      const start = Date.parse('2026-09-24T10:00:00.000Z')
      vi.setSystemTime(start)
      server.serverNow = null
      server.expiresAt = new Date(start + 20 * MINUTE).toISOString()

      const toMs = (text) => {
        const [, mm, ss] = text.match(/(\d+):(\d+) left/)
        return (Number(mm) * 60 + Number(ss)) * 1000
      }

      const first = renderSimulation()
      const before = toMs((await screen.findByTestId('time-remaining')).textContent)
      first.unmount()
      cleanup()

      // Seven seconds pass, then a fresh component reads the same server deadline.
      vi.setSystemTime(start + 7000)
      renderSimulation()
      const after = toMs((await screen.findByTestId('time-remaining')).textContent)

      /**
       * The property that matters: remounting does not hand the learner more time. The
       * countdown is anchored to the stored deadline, so it shows exactly the time that has
       * really elapsed - never a restart to the full 90 minutes the way a component-local
       * timer would, and never a second back.
       */
      expect(before).toBe(20 * MINUTE)
      expect(after).toBe(before - 7000)
      expect(after).toBeLessThan(90 * MINUTE)
    } finally {
      vi.useRealTimers()
    }
  }, TEST_TIMEOUT)

  it('warns as the deadline approaches, without stealing focus', async () => {
    const now = Date.now()
    server.serverNow = new Date(now).toISOString()
    server.expiresAt = new Date(now + 90 * 1000).toISOString()

    renderSimulation()
    const warning = await screen.findByText(/assessment time remain/i)
    expect(warning.getAttribute('role')).toBe('status')
    // A dialog here would interrupt the decision being assessed.
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

/* ------------------------------------------------------------------ *
 * Expiry is the server's decision
 * ------------------------------------------------------------------ */

describe('when the time runs out', () => {
  it('a refused action sends the learner to the timeout screen, not an error', async () => {
    server.failNextWith = { code: 'ATTEMPT_EXPIRED', status: 409, details: { result_available: true } }
    renderSimulation()
    await screen.findByTestId('time-remaining')

    const open = await screen.findByRole('button', { name: /^Open QuickParcel Support, in WhatsApp$/ })
    open.click()

    expect(await screen.findByText(/Time is up/i)).toBeDefined()
    expect(screen.getByText(/saved and counts towards your result/i)).toBeDefined()
    // Nothing suggests the learner can carry on or retry.
    expect(screen.queryByRole('button', { name: /Resume/i })).toBeNull()
  }, TEST_TIMEOUT)

  it('reopening after the deadline discovers the finalised attempt', async () => {
    // The state a browser reopened after expiry actually meets: already finalised.
    server.status = 'completed'
    server.endReason = 'expired'
    server.timedOut = true
    server.unresolvedAtExpiry = 7
    server.expiresAt = new Date(Date.now() - 5 * MINUTE).toISOString()

    renderSimulation()
    expect(await screen.findByText(/Time is up/i)).toBeDefined()
  }, TEST_TIMEOUT)

  it('the countdown reaching zero asks the server rather than ending anything', async () => {
    const now = Date.now()
    server.serverNow = new Date(now).toISOString()
    server.expiresAt = new Date(now - 1000).toISOString() // already past

    renderSimulation()
    await screen.findByRole('button', { name: /^Open QuickParcel Support, in WhatsApp$/ })

    /**
     * The point of this test: the client did NOT declare the attempt over. It re-read the
     * server, the fake server still says `in_progress`, so play continues. Only a server
     * that says otherwise can end an assessment.
     */
    await waitFor(() => {
      expect(server.calls.some((call) => call.path === '/attempts/current')).toBe(true)
    })
    expect(screen.queryByText(/Time is up/i)).toBeNull()
  }, TEST_TIMEOUT)

  it('does not poll the server once a second', async () => {
    const now = Date.now()
    server.serverNow = new Date(now).toISOString()
    server.expiresAt = new Date(now + 3 * MINUTE).toISOString()

    renderSimulation()
    await screen.findByTestId('time-remaining')
    const after1 = server.calls.length

    await new Promise((resolve) => { setTimeout(resolve, 3000) })
    const after4 = server.calls.length

    // Three seconds of ticking must not have produced three requests.
    expect(after4 - after1).toBeLessThan(2)
  })
})

/* ------------------------------------------------------------------ *
 * The result
 * ------------------------------------------------------------------ */

describe('the timed-out result', () => {
  function renderResult() {
    return render(
      <MemoryRouter initialEntries={[`/result/${server.attemptId}`]}>
        <CandidateProvider>
          <Routes>
            <Route path={ROUTES.RESULT} element={<ResultPage />} />
            <Route path={ROUTES.DASHBOARD} element={<p>Dashboard</p>} />
          </Routes>
        </CandidateProvider>
      </MemoryRouter>,
    )
  }

  it('states that the limit was reached, the limit itself, and what was missed', async () => {
    server.status = 'completed'
    server.endReason = 'expired'
    server.timedOut = true
    server.unresolvedAtExpiry = 3

    renderResult()
    const notice = await screen.findByTestId('timeout-notice')
    expect(notice.textContent).toMatch(/ended when the time limit was reached/i)
    expect(notice.textContent).toMatch(/90/)
    expect(notice.textContent).toMatch(/3 scenarios were not completed/i)
    expect(notice.textContent).toMatch(/Everything you did complete has been scored/i)
  })

  it('counts unreached scenarios separately, never as a wrong answer', async () => {
    server.status = 'completed'
    server.endReason = 'expired'
    server.timedOut = true
    server.unresolvedAtExpiry = 3

    renderResult()
    await screen.findByTestId('timeout-notice')
    expect(screen.getByText(/Not reached in time/i)).toBeDefined()
    expect(screen.getByText(/The time limit closed this scenario before you completed it/i))
      .toBeDefined()
  })

  it('says nothing about a time limit on a normally completed attempt', async () => {
    server.status = 'completed'
    server.endReason = 'learner_completed'
    server.timedOut = false

    renderResult()
    await screen.findByText(/Assessment result/i)
    expect(screen.queryByTestId('timeout-notice')).toBeNull()
    expect(screen.queryByText(/Not reached in time/i)).toBeNull()
  })

  it('never leaks a running score while the assessment is still live', async () => {
    const now = Date.now()
    server.serverNow = new Date(now).toISOString()
    server.expiresAt = new Date(now + 60 * MINUTE).toISOString()

    renderSimulation()
    await screen.findByTestId('time-remaining')
    // The timer must not have become a second channel for score information.
    expect(document.body.textContent).not.toMatch(/\b\d{1,3}\s*\/\s*100\b/)
    expect(document.body.textContent).not.toMatch(/points/i)
  })
})
