import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CandidateProvider } from '@/context/CandidateProvider'
import { ROUTES } from '@/constants/routes'
import { LoginPage } from '@/pages/LoginPage'

/**
 * Learner entry (LOGIN-001, specification section 2 - ACCEPTANCE-001 gap G4).
 *
 * Driven through the real `CandidateProvider` and the real `apiClient` against a stubbed
 * `fetch`, so the states are reached the way the product reaches them: by the status codes
 * the candidate API actually returns. Nothing about the page is mocked.
 */

const RAW_IDENTIFIER = '9876543210'
const MASKED_IDENTIFIER = '••••••3210'
const PROFILE_ID = '65f0a1b2c3d4e5f60718293a'

/**
 * A controllable candidate API. `me` and `signIn` are set per test to the outcome under
 * examination; every call is recorded so a test can assert what did and did not go out.
 */
function createServer() {
  return {
    calls: [],
    me: { status: 401, code: 'NO_SESSION', message: 'Please sign in to continue.' },
    signIn: { status: 201, created: true },
  }
}

function installFetch(server) {
  globalThis.fetch = async (url, options = {}) => {
    const path = String(url).replace(/^https?:\/\/[^/]+/, '').replace(/^\/api/, '')
    server.calls.push({ path, method: options.method ?? 'GET' })

    /**
     * The authoritative LearnerProfile projection (PROFILE-001): the server sends
     * `display_name` and `service_no_masked`, and never the ObjectId or the raw number.
     * `PROFILE_ID` and `RAW_IDENTIFIER` stay in this file precisely so the tests below can
     * assert they are nowhere on the wire and nowhere in the DOM.
     */
    const candidate = {
      display_name: 'Asha Menon',
      service_no_masked: MASKED_IDENTIFIER,
      created_at: '2026-09-01T09:00:00.000Z',
      last_seen_at: '2026-09-08T09:00:00.000Z',
      briefing: {
        required_version: 1,
        acknowledged_version: null,
        acknowledged_at: null,
        acknowledged: false,
      },
    }
    const reply = (spec) => {
      // status 0 is fetch itself failing - the server is not there to answer.
      if (spec.network) throw new TypeError('Failed to fetch')
      if (spec.status >= 400) {
        return {
          ok: false,
          status: spec.status,
          json: async () => ({
            error: { code: spec.code, message: spec.message, details: null },
          }),
        }
      }
      return {
        ok: true,
        status: spec.status,
        json: async () => ({ candidate, created: spec.created }),
      }
    }

    if (path === '/candidates/me') return reply(server.me)
    if (path === '/candidates') return reply(server.signIn)
    if (path === '/candidates/logout') return { ok: true, status: 200, json: async () => ({ ok: true }) }
    throw new Error(`unexpected request: ${path}`)
  }
}

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.LOGIN]}>
      <CandidateProvider>
        <Routes>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.BRIEFING} element={<p>Briefing screen</p>} />
        </Routes>
      </CandidateProvider>
    </MemoryRouter>,
  )
}

/** Fills the identity form and submits it. */
async function signInAs(user, name = 'Asha Menon', identifier = RAW_IDENTIFIER) {
  await user.type(await screen.findByLabelText(/Full Name/), name)
  await user.type(screen.getByLabelText(/Personal \/ Service Number/), identifier)
  await user.click(screen.getByRole('button', { name: /Start Training/ }))
}

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

describe('normal entry', () => {
  it('shows the identity form when nobody is signed in', async () => {
    renderLogin()
    expect(await screen.findByLabelText(/Full Name/)).toBeDefined()
    expect(screen.getByLabelText(/Personal \/ Service Number/)).toBeDefined()
    expect(screen.getByRole('button', { name: /Start Training/ })).toBeDefined()
  })

  it('a new profile goes straight to the briefing', async () => {
    const user = userEvent.setup()
    server.signIn = { status: 201, created: true }
    renderLogin()

    await signInAs(user)

    expect(await screen.findByText('Briefing screen')).toBeDefined()
    expect(server.calls.some((c) => c.path === '/candidates' && c.method === 'POST')).toBe(true)
  })

  it('refuses to submit an invalid identifier and keeps the learner on the form', async () => {
    const user = userEvent.setup()
    renderLogin()

    await signInAs(user, 'Asha Menon', 'abc')

    expect(await screen.findByText(/at least 6 characters/i)).toBeDefined()
    expect(server.calls.some((c) => c.method === 'POST')).toBe(false)
  })

  it('surfaces a rejected sign-in on the form rather than as a storage failure', async () => {
    const user = userEvent.setup()
    server.signIn = {
      status: 403,
      code: 'PROFILE_ARCHIVED',
      message: 'This profile is not available. Speak to your instructor.',
    }
    renderLogin()

    await signInAs(user)

    expect(await screen.findByText(/This profile is not available/)).toBeDefined()
    // A refusal is an answer, not an outage: no Retry is offered.
    expect(screen.queryByRole('button', { name: /^Retry$/ })).toBeNull()
  })
})

describe('profile found', () => {
  beforeEach(() => {
    server.signIn = { status: 200, created: false }
  })

  it('stops on a profile-found card instead of continuing automatically', async () => {
    const user = userEvent.setup()
    renderLogin()

    await signInAs(user)

    expect(await screen.findByRole('heading', { name: /Existing record found/ })).toBeDefined()
    expect(screen.queryByText('Briefing screen')).toBeNull()
  })

  it('shows the display name and the masked service number', async () => {
    const user = userEvent.setup()
    renderLogin()
    await signInAs(user)

    await screen.findByRole('heading', { name: /Existing record found/ })
    expect(screen.getByText('Asha Menon')).toBeDefined()
    expect(screen.getByText(new RegExp(MASKED_IDENTIFIER))).toBeDefined()
  })

  it('never renders the unmasked service number or the profile id', async () => {
    const user = userEvent.setup()
    renderLogin()
    await signInAs(user)

    await screen.findByRole('heading', { name: /Existing record found/ })
    const text = document.body.textContent
    expect(text).not.toContain(RAW_IDENTIFIER)
    expect(text).not.toContain(PROFILE_ID)
    expect(document.body.innerHTML).not.toContain(PROFILE_ID)
  })

  it('continues to the briefing on confirmation', async () => {
    const user = userEvent.setup()
    renderLogin()
    await signInAs(user)

    await user.click(await screen.findByRole('button', { name: /Continue as this learner/ }))
    expect(await screen.findByText('Briefing screen')).toBeDefined()
  })

  it('returns to an empty form when this is not the learner', async () => {
    const user = userEvent.setup()
    renderLogin()
    await signInAs(user)

    await user.click(await screen.findByRole('button', { name: /Use different details/ }))

    const name = await screen.findByLabelText(/Full Name/)
    expect(name.value).toBe('')
    expect(screen.getByLabelText(/Personal \/ Service Number/).value).toBe('')
    // The session that the match had already started is ended.
    expect(server.calls.some((c) => c.path === '/candidates/logout')).toBe(true)
  })
})

describe('storage error and retry', () => {
  it('shows a storage failure when the session check cannot complete', async () => {
    server.me = { status: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong.' }
    renderLogin()

    expect(
      await screen.findByRole('heading', { name: /Cannot reach your training record/ }),
    ).toBeDefined()
    expect(screen.getByRole('button', { name: /^Retry$/ })).toBeDefined()
    // The form is withheld, so a learner with an existing profile is not asked to re-register.
    expect(screen.queryByLabelText(/Full Name/)).toBeNull()
  })

  it('treats an unreachable server the same way', async () => {
    server.me = { network: true }
    renderLogin()

    expect(
      await screen.findByRole('heading', { name: /Cannot reach your training record/ }),
    ).toBeDefined()
  })

  it('a 401 is not a storage failure - it is the ordinary logged-out state', async () => {
    renderLogin()
    expect(await screen.findByLabelText(/Full Name/)).toBeDefined()
    expect(screen.queryByRole('heading', { name: /Cannot reach/ })).toBeNull()
  })

  it('announces the retry status in a live region', async () => {
    server.me = { status: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong.' }
    renderLogin()

    await screen.findByRole('heading', { name: /Cannot reach your training record/ })
    const status = screen.getByRole('status')
    expect(status.getAttribute('aria-live')).toBe('polite')
    expect(status.textContent).toMatch(/3 of 3 attempts remaining/)
  })

  it('Retry recovers the screen when the store comes back', async () => {
    const user = userEvent.setup()
    server.me = { status: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong.' }
    renderLogin()

    await screen.findByRole('heading', { name: /Cannot reach your training record/ })
    server.me = { status: 401, code: 'NO_SESSION', message: 'Please sign in to continue.' }
    await user.click(screen.getByRole('button', { name: /^Retry$/ }))

    expect(await screen.findByLabelText(/Full Name/)).toBeDefined()
    expect(screen.queryByRole('heading', { name: /Cannot reach/ })).toBeNull()
  })

  it('marks the Retry button busy while it is running', async () => {
    const user = userEvent.setup()
    server.me = { status: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong.' }
    renderLogin()
    await screen.findByRole('heading', { name: /Cannot reach your training record/ })

    // Hold the retry open so the busy state is observable.
    let release
    const held = new Promise((resolve) => { release = resolve })
    const realFetch = globalThis.fetch
    globalThis.fetch = async (...args) => { await held; return realFetch(...args) }

    const retry = screen.getByRole('button', { name: /^Retry$/ })
    await user.click(retry)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Retrying/ }).getAttribute('aria-busy')).toBe('true')
    })
    release()
    await waitFor(() => expect(screen.getByRole('button', { name: /^Retry$/ })).toBeDefined())
  })

  it('stops after three attempts instead of looping, and names the instructor', async () => {
    const user = userEvent.setup()
    server.me = { status: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong.' }
    renderLogin()
    await screen.findByRole('heading', { name: /Cannot reach your training record/ })

    for (let i = 0; i < 3; i += 1) {
      await user.click(screen.getByRole('button', { name: /^Retry$/ }))
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /^Retry$/ }).getAttribute('aria-busy')).toBeNull(),
      )
    }

    const retry = screen.getByRole('button', { name: /^Retry$/ })
    expect(retry.disabled).toBe(true)
    expect(screen.getByRole('status').textContent).toMatch(/Ask the instructor/)
  })

  it('preserves the entered details when the sign-in itself hits a storage failure', async () => {
    const user = userEvent.setup()
    server.signIn = { status: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong.' }
    renderLogin()

    await signInAs(user)
    await screen.findByRole('heading', { name: /Cannot reach your training record/ })

    // Retry replays the same sign-in, so the values must still be there to replay.
    server.signIn = { status: 201, created: true }
    await user.click(screen.getByRole('button', { name: /^Retry$/ }))

    expect(await screen.findByText('Briefing screen')).toBeDefined()
    const posts = server.calls.filter((c) => c.path === '/candidates' && c.method === 'POST')
    expect(posts.length).toBe(2)
  })
})

describe('entry card footer', () => {
  it('offers no Instructor help or Exit control on the form', async () => {
    renderLogin()
    await screen.findByLabelText(/Full Name/)
    expect(screen.queryByRole('button', { name: /Instructor help/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Exit$/ })).toBeNull()
  })

  it('offers no Instructor help or Exit control on the storage-error state', async () => {
    server.me = { status: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong.' }
    renderLogin()

    await screen.findByRole('heading', { name: /Cannot reach your training record/ })
    expect(screen.queryByRole('button', { name: /Instructor help/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Exit$/ })).toBeNull()
  })
})

describe('safety of the entry screen', () => {
  it('asks for no credential of any kind', async () => {
    renderLogin()
    await screen.findByLabelText(/Full Name/)

    expect(document.querySelector('input[type="password"]')).toBeNull()
    const labels = [...document.querySelectorAll('label')].map((l) => l.textContent.toLowerCase())
    /**
     * `phone` joined this list in IMMERSIVE-000. Section 2's login data contract has always
     * said "Do not add password, Aadhaar, phone, email, rank or real unit fields", but
     * `phone` was the one prohibited word missing from this assertion - which is precisely
     * how the label "Phone / Service Number" survived LOGIN-001, PROFILE-001 and a full
     * acceptance audit.
     */
    for (const forbidden of ['password', 'otp', 'aadhaar', 'pin', 'email', 'rank', 'unit', 'phone']) {
      expect(labels.some((l) => l.includes(forbidden))).toBe(false)
    }
  })

  /**
   * IMMERSIVE-000 regression guard.
   *
   * Section 2 names the identity field "Personal / Service Number field". The label is
   * asserted literally, because a paraphrase is what the specification is not.
   */
  it('names the identity field exactly as section 2 does', async () => {
    renderLogin()
    await screen.findByLabelText(/Full Name/)

    expect(screen.getByLabelText(/Personal \/ Service Number/)).toBeDefined()
    expect(screen.queryByLabelText(/Phone \/ Service Number/)).toBeNull()
  })

  it('never invites a phone number anywhere the learner can read', async () => {
    renderLogin()
    await screen.findByLabelText(/Full Name/)

    // Label, hint, placeholder and every other visible string on the entry screen.
    expect(document.body.textContent).not.toMatch(/phone/i)
    const placeholders = [...document.querySelectorAll('input')]
      .map((input) => input.getAttribute('placeholder') ?? '')
    expect(placeholders.some((p) => /phone/i.test(p))).toBe(false)
  })

  it('does not invite a phone number on the profile-found card either', async () => {
    const user = userEvent.setup()
    server.signIn = { status: 200, created: false }
    renderLogin()
    await signInAs(user)
    await screen.findByRole('heading', { name: /Existing record found/ })

    expect(document.body.textContent).not.toMatch(/phone/i)
    expect(screen.getByText('Personal / Service Number')).toBeDefined()
  })

  it('carries the persistent training-simulation treatment', async () => {
    renderLogin()
    await screen.findByLabelText(/Full Name/)
    expect(screen.getByText('TRAINING SIMULATION')).toBeDefined()
  })

  it('uses assessment wording rather than casual practice language', async () => {
    renderLogin()
    await screen.findByLabelText(/Full Name/)

    const text = document.body.textContent
    expect(text).not.toMatch(/only a practice/i)
    expect(text).not.toMatch(/this is a practice exercise/i)
    expect(text).toMatch(/Assessment environment/i)
  })

  it('reaches no destination outside the training API', async () => {
    const user = userEvent.setup()
    server.signIn = { status: 200, created: false }
    renderLogin()
    await signInAs(user)
    await screen.findByRole('heading', { name: /Existing record found/ })

    for (const call of server.calls) {
      expect(call.path.startsWith('/candidates')).toBe(true)
    }
    expect(document.querySelectorAll('a[href^="http"]').length).toBe(0)
  })
})

/**
 * ENHANCEMENT-002 - the redesigned entry screen.
 *
 * The redesign is presentation only. These guard the promises it makes about that: the
 * decoration is invisible to assistive technology and adds no live region, every movement
 * is opt-in to motion, and a sign-in still goes out once however often it is triggered.
 */
describe('entry screen presentation', () => {
  it('keeps every decorative graphic hidden from assistive technology', async () => {
    renderLogin()
    await screen.findByLabelText(/Full Name/)

    for (const svg of document.querySelectorAll('svg')) {
      expect(svg.closest('[aria-hidden="true"]')).not.toBeNull()
    }
  })

  it('adds no live region of its own to the identity form', async () => {
    renderLogin()
    await screen.findByLabelText(/Full Name/)

    // The panel readout restates the state visually only; the form has nothing to announce.
    expect(screen.queryAllByRole('status')).toHaveLength(0)
    expect(screen.queryAllByRole('alert')).toHaveLength(0)
  })

  it('animates nothing unless motion is welcome', async () => {
    renderLogin()
    await screen.findByLabelText(/Full Name/)

    const unguarded = [...document.querySelectorAll('[class*="animate-"]')].flatMap((element) =>
      [...element.classList].filter((name) => name.startsWith('animate-')),
    )
    expect(unguarded).toEqual([])
  })

  it('sends one sign-in however many times Enter is pressed while it is in flight', async () => {
    const user = userEvent.setup()
    let release
    const gate = new Promise((resolve) => {
      release = resolve
    })
    const answer = globalThis.fetch
    globalThis.fetch = async (url, options = {}) => {
      if (String(url).endsWith('/candidates') && options.method === 'POST') await gate
      return answer(url, options)
    }

    renderLogin()
    await user.type(await screen.findByLabelText(/Full Name/), 'Asha Menon')
    const identifier = screen.getByLabelText(/Personal \/ Service Number/)
    await user.type(identifier, RAW_IDENTIFIER)
    await user.keyboard('{Enter}{Enter}{Enter}')

    expect(screen.getByRole('button', { name: /Start Training/ }).getAttribute('aria-busy')).toBe('true')
    release()
    expect(await screen.findByText('Briefing screen')).toBeDefined()
    expect(server.calls.filter((call) => call.path === '/candidates')).toHaveLength(1)
  })

  it('presents the four simulated channels as a list', async () => {
    renderLogin()
    await screen.findByLabelText(/Full Name/)

    const channels = screen.getByRole('list', { name: 'Simulated channels' })
    expect(within(channels).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'WhatsApp',
      'Instagram',
      'SMS',
      'Email',
    ])
  })
})
