import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CandidateProvider } from '@/context/CandidateProvider'
import { ROUTES } from '@/constants/routes'
import { ResultPage } from '@/pages/ResultPage'
import { createFakeServer, installFetch } from '@/test/attemptFixtures'

/**
 * The result screen (UI-003), rendered against the real RESULT-001 payload shape through
 * the real `attemptApi` and a stubbed `fetch`.
 *
 * The screen is a presentation layer, so these tests check two things: that everything the
 * server sends is actually shown, and that nothing the server withholds is invented or
 * recomputed here.
 */

let server

function renderResult(attemptId = 'attempt-1') {
  return render(
    <MemoryRouter initialEntries={[`/result/${attemptId}`]}>
      <CandidateProvider>
        <Routes>
          <Route path={ROUTES.RESULT} element={<ResultPage />} />
          <Route path={ROUTES.DASHBOARD} element={<p>Dashboard</p>} />
        </Routes>
      </CandidateProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  server = createFakeServer()
  server.status = 'completed'
  installFetch(server)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('the headline', () => {
  it('shows the server total, never a total summed on the client', async () => {
    renderResult()

    const headline = await screen.findByRole('heading', { level: 1, name: /74/ })
    expect(headline.textContent.replace(/\s+/g, '')).toContain('74/100')
    // The count is split across spans, so read the region's own text.
    const summary = screen.getByRole('region', { name: /74/ })
    expect(summary.textContent.replace(/\s+/g, ' ')).toContain('10 of 10 scenarios resolved')

    // The ten scenario scores sum to 67 in the fixture; the page must show the server's 74.
    expect(headline.textContent).not.toMatch(/67/)
  })

  it('shows the outcome mix exactly as the server classified it', async () => {
    renderResult()
    await screen.findByRole('heading', { level: 1, name: /74/ })

    const summary = screen.getByRole('region', { name: /74/ })
    expect(within(summary).getByText('Handled safely')).toBeTruthy()
    expect(within(summary).getByText('Threat missed')).toBeTruthy()
    expect(within(summary).getByText('Genuine item rejected')).toBeTruthy()
    expect(within(summary).getByText('Unsafe step taken')).toBeTruthy()
  })
})

describe('comparison', () => {
  it('explains the absence of a comparison without implying failure', async () => {
    renderResult()
    await screen.findByRole('heading', { level: 1, name: /74/ })

    const note = screen.getByText(/first completed attempt/i)
    expect(note).toBeTruthy()
    expect(note.textContent).not.toMatch(/fail|worse|poor/i)
  })

  it('shows the delta when a comparable previous attempt exists', async () => {
    server.previousScore = 60
    renderResult()
    await screen.findByRole('heading', { level: 1, name: /74/ })

    expect(screen.getByText(/\+14/)).toBeTruthy()
    expect(screen.getByText(/higher than your previous comparable attempt/i)).toBeTruthy()
  })
})

describe('the behaviour breakdown', () => {
  it('renders the server buckets and never rebuilds a taxonomy', async () => {
    renderResult()
    await screen.findByRole('heading', { level: 1, name: /74/ })

    const section = screen.getByRole('region', { name: /Where your marks came from/ })
    expect(within(section).getByText('WhatsApp')).toBeTruthy()
    expect(within(section).getByText('Payment diversion')).toBeTruthy()
    expect(within(section).getByText('Urgency')).toBeTruthy()

    // Stage names come from the server's four graded stages.
    for (const stage of ['Inspect', 'Branch', 'Verify', 'Resolve']) {
      expect(within(section).getByText(stage)).toBeTruthy()
    }
  })
})

describe('the ten scenarios', () => {
  it('lists every scenario with its score and outcome', async () => {
    renderResult()
    await screen.findByRole('heading', { level: 1, name: /74/ })

    const list = screen.getByRole('region', { name: /Scenario by scenario/ })
    expect(within(list).getAllByRole('listitem')).toHaveLength(10)
    expect(within(list).getAllByText('Handled safely').length).toBe(9)
    expect(within(list).getAllByText('Threat missed').length).toBe(1)
  })

  it('reveals the feedback and the path only when a scenario is opened', async () => {
    const user = userEvent.setup()
    renderResult()
    await screen.findByRole('heading', { level: 1, name: /74/ })

    expect(screen.queryByText(/What you missed/)).toBeNull()

    const toggle = screen.getAllByRole('button', { name: /Show what happened in scenario 1/ })[0]
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    await user.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')

    const review = screen.getByTestId('scenario-review-1')
    expect(within(review).getByText(/Malicious - Delivery impersonation/)).toBeTruthy()
    expect(within(review).getByText(/Check the courier through an app/)).toBeTruthy()
    expect(within(review).getByText(/Never pay a fee from a link/)).toBeTruthy()
    expect(within(review).getByText(/An unexpected fee for a parcel/)).toBeTruthy()

    // The path replay, in the server's ledger order.
    expect(within(review).getAllByText('Opened the notification').length).toBeGreaterThan(0)
    expect(within(review).getAllByText('Verified independently').length).toBeGreaterThan(0)
  })

  it('renders no event code, point delta, timestamp or metadata in a path step', async () => {
    const user = userEvent.setup()
    renderResult()
    await screen.findByRole('heading', { level: 1, name: /74/ })
    await user.click(screen.getAllByRole('button', { name: /Show what happened/ })[0])

    const markup = document.body.innerHTML
    for (const forbidden of [
      'NOTIFY_SEEN', 'ITEM_OPEN', 'INSPECT_CONTEXT', 'TRUSTED_VERIFY', 'RESOLVE_CORRECT',
      'points_delta', 'event_code', 'intent_key', 'run_id', 'metadata',
    ]) {
      expect(markup).not.toContain(forbidden)
    }
  })
})

describe('remediation', () => {
  it('recommends practice areas in blame-free language', async () => {
    renderResult()
    await screen.findByRole('heading', { level: 1, name: /74/ })

    const section = screen.getByRole('region', { name: /Recommended practice/ })
    expect(within(section).getByText('Payment diversion')).toBeTruthy()
    // The learner is never told how many bank scenarios exist.
    expect(section.textContent).not.toMatch(/scenarios available/i)

    // Never a trait, a susceptibility or an emotional state.
    for (const word of ['vulnerable', 'susceptible', 'manipulable', 'gullible',
      'personality', 'you are easily', 'weakness']) {
      expect(section.textContent.toLowerCase()).not.toContain(word)
    }
  })

  it('says so plainly when there is nothing to practise', async () => {
    const original = globalThis.fetch
    globalThis.fetch = async (url, options) => {
      const response = await original(url, options)
      if (!String(url).includes('/result')) return response
      const data = await response.json()
      data.result.remediation = []
      return { ok: true, status: 200, json: async () => data }
    }

    renderResult()
    await screen.findByRole('heading', { level: 1, name: /74/ })
    expect(screen.getByText(/Nothing stood out as needing focused practice/)).toBeTruthy()
  })
})

describe('what the result must never show', () => {
  it('renders no classification, scoring rule or selection metadata', async () => {
    const user = userEvent.setup()
    renderResult()
    await screen.findByRole('heading', { level: 1, name: /74/ })
    await user.click(screen.getAllByRole('button', { name: /Show what happened/ })[0])

    const markup = document.body.innerHTML.toLowerCase()
    for (const term of ['canonical_family', 'canonical_triggers', 'military_flag',
      'expected_safe_behavior', 'learner_flow', 'evaluation', 'seed', 'selection',
      'score_running', 'disposition"', 'level"']) {
      expect(markup).not.toContain(term)
    }
  })

  it('shows no external asset, frame or link', async () => {
    renderResult()
    await screen.findByRole('heading', { level: 1, name: /74/ })

    expect(document.querySelectorAll('iframe, embed, object, video, audio')).toHaveLength(0)
    // The only image is the bundled SATARK header logo: never a remote source.
    for (const image of document.querySelectorAll('img')) {
      expect(image.getAttribute('src')).not.toMatch(/^(https?:)?\/\//)
    }
    for (const anchor of document.querySelectorAll('a[href]')) {
      expect(anchor.getAttribute('href')).not.toMatch(/^https?:/)
    }
  })
})

describe('failure states', () => {
  it('reports a missing result without exposing internals', async () => {
    globalThis.fetch = async () => ({
      ok: false,
      status: 500,
      json: async () => ({ error: { code: 'RESULT_INTEGRITY', message: 'Something went wrong.' } }),
    })

    renderResult()
    expect(await screen.findByText(/Your result is not available/)).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/at .*\.js:|stack|Error:/i)
  })

  it('keeps every control keyboard reachable and named', async () => {
    renderResult()
    await screen.findByRole('heading', { level: 1, name: /74/ })

    for (const control of screen.getAllByRole('button')) {
      expect(control.tagName).toBe('BUTTON')
      const name = control.getAttribute('aria-label') || control.textContent.trim()
      expect(name.length).toBeGreaterThan(0)
    }
  })
})
