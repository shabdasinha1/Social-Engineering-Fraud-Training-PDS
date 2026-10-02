import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CandidateProvider } from '@/context/CandidateProvider'
import { ROUTES } from '@/constants/routes'
import { ResultPage } from '@/pages/ResultPage'
import { createFakeServer, installFetch } from '@/test/attemptFixtures'

/**
 * The learning review on the result screen (REVIEW-001).
 *
 * The screen is a presentation layer, so these check the two things a presentation layer
 * can get wrong: that everything the server sent about a mistake is actually shown, and
 * that nothing the server withheld - an event code, a point delta, a typed value, an
 * evaluation field - is invented, recomputed or leaked here.
 *
 * The fixture carries the projection in the shape the real server builds it, so a payload
 * key that changed name would fail here rather than in a browser.
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

/** Rewrites the result payload on its way through `fetch`, leaving every other call alone. */
function patchResult(mutate) {
  const original = globalThis.fetch
  globalThis.fetch = async (url, options) => {
    const response = await original(url, options)
    if (!String(url).includes('/result')) return response
    const data = await response.json()
    mutate(data.result)
    return { ok: true, status: 200, json: async () => data }
  }
}

async function openScenario(ordinal) {
  const user = userEvent.setup()
  await screen.findByRole('heading', { level: 1, name: /74/ })
  await user.click(screen.getByRole('button', { name: new RegExp(`Show what happened in scenario ${ordinal}$`) }))
  return screen.getByTestId(`scenario-review-${ordinal}`)
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

/* ------------------------------------------------------------------ *
 * The assessment review summary
 * ------------------------------------------------------------------ */

describe('the assessment review summary', () => {
  it('shows the server counts, never numbers summed on the client', async () => {
    renderResult()
    await screen.findByRole('heading', { level: 1, name: /74/ })

    const section = screen.getByTestId('assessment-review')
    expect(within(section).getByTestId('review-count-correct_decisions').textContent).toContain('9')
    expect(within(section).getByTestId('review-count-scenarios_with_mistakes').textContent).toContain('1')
    expect(within(section).getByTestId('review-count-missed_threats').textContent).toContain('1')
    expect(section.textContent.replace(/\s+/g, ' ')).toContain('10 scenarios completed')
  })

  it('omits a zero count that would only be noise', async () => {
    renderResult()
    await screen.findByRole('heading', { level: 1, name: /74/ })

    // The fixture has no false positives and no unresolved scenarios.
    expect(screen.queryByTestId('review-count-false_positives')).toBeNull()
    expect(screen.queryByTestId('review-count-not_resolved')).toBeNull()
  })

  it('publishes no second score of its own', async () => {
    renderResult()
    await screen.findByRole('heading', { level: 1, name: /74/ })

    const section = screen.getByTestId('assessment-review')
    expect(section.textContent).not.toMatch(/\/\s*100|out of 100|score/i)
  })

  it('says nothing at all when the server sends no review summary', async () => {
    patchResult((result) => { delete result.review_summary })
    renderResult()
    await screen.findByRole('heading', { level: 1, name: /74/ })
    expect(screen.queryByTestId('assessment-review')).toBeNull()
  })
})

/* ------------------------------------------------------------------ *
 * A. A correctly handled scenario
 * ------------------------------------------------------------------ */

describe('a scenario handled correctly', () => {
  it('gets the concise positive card, with no mistake in it', async () => {
    renderResult()
    const review = await openScenario(2)

    expect(review.dataset.status).toBe('correct')
    expect(within(review).getByText('Correct action')).toBeTruthy()
    expect(within(review).getByText(/You handled this one correctly/)).toBeTruthy()
    expect(within(review).getByText('Key cue')).toBeTruthy()
    expect(within(review).getByText('Safe habit')).toBeTruthy()
    expect(within(review).queryByText('What you did')).toBeNull()
    expect(within(review).queryByText('Why it mattered')).toBeNull()
  })

  it('shows the key cue even when the habit repeats it word for word', async () => {
    /**
     * Several scenarios were authored with one sentence serving as both the warning sign
     * and the prevention habit, so a card must show it once - and the heading it keeps has
     * to be one the card actually draws. A dedupe that claimed the sentence for a heading
     * this card does not render would delete it from the card altogether.
     */
    patchResult((result) => {
      const repeated = 'An unexpected fee for a parcel you did not send for.'
      result.scenarios[1].review = {
        ...result.scenarios[1].review,
        key_cue: repeated,
        missed_cues: [repeated],
        safe_response: repeated,
      }
    })

    renderResult()
    const review = await openScenario(2)

    expect(within(review).getByText('Key cue')).toBeTruthy()
    expect(within(review).getAllByText(/An unexpected fee for a parcel/)).toHaveLength(1)
    // The habit is the same sentence, so its heading is dropped rather than repeated.
    expect(within(review).queryByText('Safe habit')).toBeNull()
  })

  it('keeps both headings when the habit genuinely differs from the cue', async () => {
    renderResult()
    const review = await openScenario(2)

    expect(within(review).getByText('Key cue')).toBeTruthy()
    expect(within(review).getByText('Safe habit')).toBeTruthy()
  })

  it('carries no learning issue and no correct-path column', async () => {
    renderResult()
    const review = await openScenario(2)

    expect(within(review).queryByText('Missed threat')).toBeNull()
    expect(within(review).queryByText('Correct path')).toBeNull()
    expect(within(review).getByText('Your path')).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ *
 * B / D. A missed threat, with several mistakes
 * ------------------------------------------------------------------ */

describe('a scenario with mistakes', () => {
  it('shows every mistake the server sent, in the order it sent them', async () => {
    renderResult()
    const review = await openScenario(1)

    expect(review.dataset.status).toBe('mistake')
    const mistakes = within(review).getAllByRole('listitem')
      .filter((item) => item.querySelector('dt'))
    expect(mistakes).toHaveLength(2)
    expect(mistakes[0].textContent).toContain('Released details or paid')
    expect(mistakes[1].textContent).toContain('Checked using the message itself')
  })

  it('gives each mistake what was done, the correct action and why it mattered', async () => {
    renderResult()
    const review = await openScenario(1)

    const first = within(review).getAllByRole('listitem').find((i) => i.querySelector('dt'))
    expect(within(first).getByText('What you did')).toBeTruthy()
    expect(within(first).getByText('Correct action')).toBeTruthy()
    expect(within(first).getByText('Why it mattered')).toBeTruthy()
    // Scenario-specific, quoted from the stage the scenario's author wrote.
    expect(first.textContent).toContain('Do not open the redelivery link')
  })

  it('names the missed cue, the correct action, the consequence and the habit', async () => {
    renderResult()
    const review = await openScenario(1)

    expect(within(review).getByText('What you missed')).toBeTruthy()
    expect(within(review).getByText(/An unexpected fee for a parcel/)).toBeTruthy()
    expect(within(review).getByText(/Check the courier through an app/)).toBeTruthy()
    expect(within(review).getByText(/The fake checkout records no data/)).toBeTruthy()
    expect(within(review).getByText(/Never pay a fee from a link/)).toBeTruthy()
  })

  it('shows the mistake headline in the collapsed row, before anything is opened', async () => {
    renderResult()
    await screen.findByRole('heading', { level: 1, name: /74/ })

    const headline = screen.getByTestId('review-headline-1')
    expect(headline.textContent).toContain('released details, paid, installed or approved access')
    expect(screen.queryByTestId('scenario-review-1')).toBeNull()
  })

  it('labels the learning issue as a missed threat, not as a trait', async () => {
    renderResult()
    const review = await openScenario(1)

    expect(within(review).getByText('Missed threat')).toBeTruthy()
    for (const word of ['careless', 'vulnerable', 'gullible', 'susceptible', 'you are easily',
      'personality', 'weakness']) {
      expect(review.textContent.toLowerCase()).not.toContain(word)
    }
  })
})

/* ------------------------------------------------------------------ *
 * C. A false positive on a legitimate scenario
 * ------------------------------------------------------------------ */

describe('a genuine item that was rejected', () => {
  it('is labelled a false positive and told to keep the item', async () => {
    patchResult((result) => {
      const target = result.scenarios[0]
      target.outcome_class = 'false_positive'
      target.review = {
        ...target.review,
        headline: 'You reported or blocked an item that was genuine.',
        learning_issue: {
          key: 'false_positive',
          label: 'Genuine item rejected',
          description: 'This item was genuine and was reported, blocked or abandoned.',
        },
        what_it_was: 'Legitimate - genuine system confirmation',
        mistakes: [{
          kind: 'rejected_a_genuine_item',
          stage: 'verify',
          label: 'Rejected a genuine item',
          what_you_did: 'You reported or blocked the sender rather than checking the request and letting it stand.',
          correct_action: 'Confirm the change in the account settings you already use, then let it stand.',
          why_it_mattered: 'Rejecting genuine traffic stops real work.',
        }],
        correct_path: [
          { step: 1, stage: 'branch', action: 'used_the_official_path' },
          { step: 2, stage: 'resolve', action: 'kept_it_and_continued' },
        ],
      }
    })

    renderResult()
    const review = await openScenario(1)

    expect(within(review).getByText('Genuine item rejected')).toBeTruthy()
    expect(within(review).getByText(/Legitimate - genuine system confirmation/)).toBeTruthy()
    expect(within(review).getByText('Rejected a genuine item')).toBeTruthy()
    // The correct path tells them to keep it, never to report it.
    expect(within(review).getByText('Keep it and carry on')).toBeTruthy()
    expect(within(review).getByText('Used the official path')).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ *
 * E / F. Path replay
 * ------------------------------------------------------------------ */

describe('the path replay', () => {
  it('renders exactly the steps the ledger recorded, and no others', async () => {
    renderResult()
    const review = await openScenario(1)

    // The path columns are the lists under the two path headings, not the mistake list.
    const your = within(review).getAllByRole('list')
      .find((list) => list.textContent.includes('Used the contact in the message'))
    expect(your).toBeTruthy()
    expect(within(your).getAllByRole('listitem')).toHaveLength(5)
    // The learner never inspected in this fixture, so no inspect step may appear.
    expect(your.textContent).not.toContain('Inspected the details')
  })

  it('shows the correct path beside it, phrased for what the item actually was', async () => {
    renderResult()
    const review = await openScenario(1)

    expect(within(review).getByText('Correct path')).toBeTruthy()
    expect(within(review).getByText('Report and block it')).toBeTruthy()
  })

  it('says so plainly when the ledger recorded nothing', async () => {
    patchResult((result) => {
      result.scenarios[0].review = {
        ...result.scenarios[0].review,
        status: 'not_resolved',
        headline: 'The time limit closed this scenario before you reached a decision.',
        note: 'No decision was recorded here, so there is nothing to mark right or wrong.',
        learning_issue: null,
        mistakes: [],
        your_path: [],
      }
    })

    renderResult()
    const review = await openScenario(1)

    expect(review.dataset.status).toBe('not_resolved')
    expect(within(review).getByText('No actions were recorded.')).toBeTruthy()
    expect(within(review).getByText(/nothing to mark right or wrong/)).toBeTruthy()
    expect(within(review).queryByText('Missed threat')).toBeNull()
  })
})

/* ------------------------------------------------------------------ *
 * G / H. Privacy and evaluation leakage
 * ------------------------------------------------------------------ */

describe('what the review must never show', () => {
  it('renders no event code, point delta, identifier or metadata key', async () => {
    renderResult()
    const user = userEvent.setup()
    await screen.findByRole('heading', { level: 1, name: /74/ })
    for (const control of screen.getAllByRole('button', { name: /Show what happened/ })) {
      await user.click(control)
    }

    const markup = document.body.innerHTML
    for (const forbidden of [
      'NOTIFY_SEEN', 'ITEM_OPEN', 'INSPECT_CONTEXT', 'SAFE_PIVOT', 'TRUSTED_VERIFY',
      'RESOLVE_CORRECT', 'RISKY_OPEN_REPLY', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE',
      'STAGE_SKIPPED', 'RUN_ABANDONED', 'RUN_EXPIRED',
      'points_delta', 'event_code', 'event_id', 'intent_key', 'run_id', 'metadata',
      'score_running', 'scoring_text', 'learner_flow', 'expected_actions', 'severity',
      'expected_safe_behavior', 'canonical_family', 'disposition', 'rationale',
    ]) {
      expect(markup).not.toContain(forbidden)
    }
  })

  it('never renders a value a learner typed into a simulated form', async () => {
    renderResult()
    const user = userEvent.setup()
    await screen.findByRole('heading', { level: 1, name: /74/ })
    for (const control of screen.getAllByRole('button', { name: /Show what happened/ })) {
      await user.click(control)
    }

    // Card-shaped and code-shaped strings must not survive anywhere in the review.
    expect(document.body.textContent).not.toMatch(/\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/)
    expect(document.body.textContent).not.toMatch(/\b\d{6}\b/)
  })

  it('shows no external asset, frame or link inside a review', async () => {
    renderResult()
    await openScenario(1)

    expect(document.querySelectorAll('img, iframe, embed, object, video, audio')).toHaveLength(0)
    for (const anchor of document.querySelectorAll('a[href]')) {
      expect(anchor.getAttribute('href')).not.toMatch(/^https?:/)
    }
  })
})

/* ------------------------------------------------------------------ *
 * I / J. Compatibility with a result built before REVIEW-001
 * ------------------------------------------------------------------ */

describe('a result payload without a review block', () => {
  it('still renders the original feedback and path, rather than an empty panel', async () => {
    patchResult((result) => {
      delete result.review_summary
      for (const scenario of result.scenarios) delete scenario.review
    })

    renderResult()
    const user = userEvent.setup()
    await screen.findByRole('heading', { level: 1, name: /74/ })
    await user.click(screen.getByRole('button', { name: /Show what happened in scenario 1$/ }))

    expect(screen.getByText('Signs to notice')).toBeTruthy()
    expect(screen.getByText(/Malicious - Delivery impersonation/)).toBeTruthy()
    expect(screen.getByText('Your decision path')).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ *
 * Order
 * ------------------------------------------------------------------ */

describe('review order', () => {
  it('lists scenarios in the order they were met, never by score or outcome', async () => {
    renderResult()
    await screen.findByRole('heading', { level: 1, name: /74/ })

    const list = screen.getByRole('region', { name: /Scenario by scenario/ })
    const toggles = within(list).getAllByRole('button', { name: /Show what happened in scenario/ })
    const ordinals = toggles.map((t) => Number(t.textContent.match(/scenario (\d+)/)[1]))
    expect(ordinals).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })
})
