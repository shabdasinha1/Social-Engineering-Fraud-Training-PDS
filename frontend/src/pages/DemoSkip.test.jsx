import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, configure, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AssessmentReview } from '@/components/result/AssessmentReview'
import { ResultSummary } from '@/components/result/ResultSummary'
import { ScenarioResultCard } from '@/components/result/ScenarioResultCard'
import { CandidateProvider } from '@/context/CandidateProvider'
import { ROUTES } from '@/constants/routes'
import { SimulationPage } from '@/pages/SimulationPage'
import { createFakeServer, installFetch } from '@/test/attemptFixtures'

/**
 * ENHANCEMENT-003 - the Demo User's Skip, through the real controller and the real
 * `attemptApi` against the stubbed server.
 *
 * The server decides whether an attempt is a demo attempt (`is_demo`). These tests pin that
 * the page renders Skip only then, sends nothing but the stage it is showing, and moves on
 * only after the server accepted the skip.
 */

configure({ asyncUtilTimeout: 8000 })

let server

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

const skipPosts = () => server.calls.filter((c) => c.method === 'POST' && c.path.endsWith('/demo-skip'))

beforeEach(() => {
  server = createFakeServer()
  installFetch(server)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('who sees Skip', () => {
  it('a normal learner never gets the Skip control in the DOM', async () => {
    renderSimulation()
    expect(await screen.findByRole('heading', { level: 1, name: /Scenario 1 of 10/ })).toBeTruthy()
    expect(screen.queryByTestId('demo-skip')).toBeNull()
    expect(screen.queryByRole('button', { name: /Skip this scenario/ })).toBeNull()
    expect(document.body.innerHTML).not.toMatch(/demo/i)
    expect(skipPosts()).toHaveLength(0)
  })

  it('the Demo User sees Skip beside, not among, the scenario controls', async () => {
    server.isDemo = true
    renderSimulation()
    const control = await screen.findByTestId('demo-skip')
    expect(within(control).getByRole('button', { name: /Skip this scenario/ })).toBeTruthy()
    // Never inside the device or the action list.
    expect(within(screen.getByRole('region', { name: 'Simulation' })).queryByText(/Skip this scenario/)).toBeNull()
  })

  it('a client-side flag alone cannot produce Skip; only the server projection can', async () => {
    window.isDemo = true
    localStorage.setItem('isDemo', 'true')
    try {
      renderSimulation()
      await screen.findByRole('heading', { level: 1, name: /Scenario 1 of 10/ })
      expect(screen.queryByTestId('demo-skip')).toBeNull()
    } finally {
      delete window.isDemo
      localStorage.removeItem('isDemo')
    }
  })
})

describe('skipping', () => {
  it('confirms once, sends only the current stage, and loads the next scenario', async () => {
    server.isDemo = true
    const user = userEvent.setup()
    renderSimulation()

    await user.click(await screen.findByRole('button', { name: /Skip this scenario/ }))
    expect(screen.getByText(/Skip scenario/)).toBeTruthy()
    expect(skipPosts()).toHaveLength(0)
    // Focus moves to the confirming button, so a keyboard user confirms with Enter.
    expect(document.activeElement?.textContent).toBe('Skip')
    await user.keyboard('{Enter}')

    expect(await screen.findByRole('heading', { level: 1, name: /Scenario 2 of 10/ })).toBeTruthy()
    const posts = skipPosts()
    expect(posts).toHaveLength(1)
    expect(posts[0].path).toBe('/attempts/attempt-1/runs/run-1/demo-skip')
    expect(posts[0].body).toEqual({ expected_stage: 'notify' })
    // Neither the request nor the page names an intent, an event code or a verdict.
    expect(JSON.stringify(posts[0])).not.toMatch(/intent|action_code|RUN_DEMO_SKIPPED|resolve_/)
  })

  it('cancel and Escape both back out without sending anything', async () => {
    server.isDemo = true
    const user = userEvent.setup()
    renderSimulation()

    await user.click(await screen.findByRole('button', { name: /Skip this scenario/ }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('button', { name: /Skip this scenario/ })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /Skip this scenario/ }))
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: /Skip this scenario/ })).toBeTruthy()
    expect(skipPosts()).toHaveLength(0)
  })

  it('a refused skip resyncs from the server rather than moving on', async () => {
    server.isDemo = true
    server.failNextWith = { code: 'STALE_STATE', status: 409 }
    const user = userEvent.setup()
    renderSimulation()

    await user.click(await screen.findByRole('button', { name: /Skip this scenario/ }))
    await user.click(screen.getByRole('button', { name: 'Skip' }))

    expect(await screen.findByText(/This scenario moved on/)).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1, name: /Scenario 1 of 10/ })).toBeTruthy()
  })

  it('skipping the last scenario reaches the completion gateway', async () => {
    server.isDemo = true
    server.ordinal = 10
    server.resolved = 9
    const user = userEvent.setup()
    renderSimulation()

    await user.click(await screen.findByRole('button', { name: /Skip this scenario/ }))
    await user.click(screen.getByRole('button', { name: 'Skip' }))

    expect(await screen.findByRole('heading', { name: 'All scenarios resolved' })).toBeTruthy()
    expect(screen.queryByTestId('demo-skip')).toBeNull()
  })
})

describe('the result of a skipped scenario', () => {
  const skipped = {
    ordinal: 3,
    platform: 'sms',
    platform_label: 'SMS',
    score_0_10: 0,
    max_score: 10,
    outcome_code: 'resolve_demo_skipped',
    outcome_class: 'demo_skipped',
    skipped: true,
    sender: 'VM-BANKCO',
    preview: 'Your code is 482913',
    path: [{ step: 1, stage: 'resolve', action: 'skipped_in_demonstration' }],
    feedback: { result: null, cues: [], safe_action: null, impact: null, prevention_habit: null },
    review: {
      status: 'skipped',
      headline: 'You skipped this scenario during the demonstration.',
      note: 'No decision was recorded, so nothing is marked right or wrong here.',
      learning_issue: null,
      mistakes: [],
      key_cue: null,
      missed_cues: [],
      what_it_was: null,
      correct_action: null,
      why_it_mattered: null,
      safe_response: null,
      your_path: [{ step: 1, stage: 'resolve', action: 'skipped_in_demonstration' }],
      correct_path: [],
    },
  }

  it('is labelled Skipped (Demo), neutrally, and shows nothing about what the item was', async () => {
    const user = userEvent.setup()
    render(<ul><ScenarioResultCard scenario={skipped} /></ul>)

    // The outcome chip and the final-action line both say so, in the demo wording.
    expect(screen.getAllByText('Skipped (Demo)').length).toBe(2)
    expect(screen.queryByText(/Not reached in time|time limit/i)).toBeNull()
    await user.click(screen.getByRole('button', { name: /Show what happened in scenario 3/ }))

    const review = screen.getByTestId('scenario-review-3')
    expect(review.dataset.status).toBe('skipped')
    expect(within(review).getAllByText('Skipped (Demo)').length).toBeGreaterThan(0)
    for (const heading of ['What it was', 'Correct action', 'Correct path', 'Key cue', 'Safe habit']) {
      expect(within(review).queryByText(heading)).toBeNull()
    }
    expect(document.body.textContent).not.toMatch(/malicious|legitimate|threat|genuine|scam|resolve_demo/i)
  })

  it('adds a Skipped count to the summary and the review only when the server sends one', () => {
    const summary = {
      total_score: 49, max_score: 100, scenarios: 10,
      handled_safely: 5, missed_threats: 1, false_positives: 1, unsafe_handling: 0,
      not_resolved: 0, skipped: 3,
    }
    const { unmount } = render(
      <ResultSummary result={{ summary, scenarios_resolved: 10, scenarios_total: 10, comparison: null }} />,
    )
    expect(screen.getByText('Skipped (Demo)')).toBeTruthy()
    unmount()

    render(
      <ResultSummary
        result={{ summary: { ...summary, skipped: undefined }, scenarios_resolved: 10, scenarios_total: 10, comparison: null }}
      />,
    )
    expect(screen.queryByText('Skipped (Demo)')).toBeNull()
    cleanup()

    render(<AssessmentReview summary={{ scenarios: 10, correct_decisions: 5, scenarios_with_mistakes: 2, skipped: 3, mistakes: 2, verification_successes: 5 }} />)
    expect(screen.getByTestId('review-count-skipped').textContent).toMatch(/3/)
    cleanup()

    render(<AssessmentReview summary={{ scenarios: 10, correct_decisions: 10, scenarios_with_mistakes: 0, mistakes: 0, verification_successes: 10 }} />)
    expect(screen.queryByTestId('review-count-skipped')).toBeNull()
  })
})
