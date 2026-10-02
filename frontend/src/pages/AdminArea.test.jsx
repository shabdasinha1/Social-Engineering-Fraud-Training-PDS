import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { ROUTES } from '@/constants/routes'
import { RequireAdmin } from '@/routes/RequireAdmin'
import { AdminAttemptDetailPage } from '@/pages/AdminAttemptDetailPage'
import { AdminAttemptsPage } from '@/pages/AdminAttemptsPage'
import { AdminAuditPage } from '@/pages/AdminAuditPage'
import { AdminScenarioDetailPage } from '@/pages/AdminScenarioDetailPage'
import { AdminScenariosPage } from '@/pages/AdminScenariosPage'
import { AdminSettingsPage } from '@/pages/AdminSettingsPage'
import {
  ATTEMPT_DETAIL_COMPLETE,
  ATTEMPT_DETAIL_IN_PROGRESS,
  createAdminServer,
  installAdminFetch,
} from '@/test/adminFixtures'

/**
 * The instructor area (ADMIN-006), rendered against the real backend payload shapes through
 * the real `adminApi` and a stubbed `fetch`.
 *
 * These screens are a presentation layer over projections the server already decided, so
 * the tests check three things: that what the server sends is actually shown, that what it
 * withholds is never invented, and that a consequential action cannot happen without a
 * deliberate confirmation.
 */

let server

beforeEach(() => {
  server = createAdminServer()
  installAdminFetch(server)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  delete globalThis.fetch
})

/** Renders one admin page inside the guard and the shell, as the router really does. */
function renderAdmin(path, element, routePath) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route path={routePath} element={element} />
          </Route>
        </Route>
        <Route path={ROUTES.ADMIN_LOGIN} element={<p>Administrator sign in</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

/* ------------------------------------------------------------------ *
 * authentication
 * ------------------------------------------------------------------ */

describe('the admin boundary', () => {
  it('sends an unauthenticated visitor to the admin sign-in', async () => {
    server.authenticated = false
    renderAdmin(ROUTES.ADMIN_SCENARIOS, <AdminScenariosPage />, ROUTES.ADMIN_SCENARIOS)

    expect(await screen.findByText('Administrator sign in')).toBeTruthy()
    // No admin data was requested before the session was known to be valid.
    expect(server.calls.some((call) => call.path === '/admin/scenarios')).toBe(false)
  })

  it('sends a learner holding only a candidate session to the admin sign-in', async () => {
    // The server answers a candidate cookie on /admin/me exactly as it answers no cookie.
    server.authenticated = false
    renderAdmin(ROUTES.ADMIN_ATTEMPTS, <AdminAttemptsPage />, ROUTES.ADMIN_ATTEMPTS)

    expect(await screen.findByText('Administrator sign in')).toBeTruthy()
    expect(server.calls.some((call) => call.path === '/admin/attempts')).toBe(false)
  })

  it('lets an authenticated administrator in, and shows who they are', async () => {
    renderAdmin(ROUTES.ADMIN_SCENARIOS, <AdminScenariosPage />, ROUTES.ADMIN_SCENARIOS)

    expect(await screen.findByRole('heading', { level: 1, name: 'Scenarios' })).toBeTruthy()
    expect(screen.getByText('instructor')).toBeTruthy()
    expect(screen.getByRole('navigation', { name: /instructor sections/i })).toBeTruthy()
  })

  it('signs out through the existing admin endpoint', async () => {
    const user = userEvent.setup()
    renderAdmin(ROUTES.ADMIN_SCENARIOS, <AdminScenariosPage />, ROUTES.ADMIN_SCENARIOS)
    await screen.findByRole('heading', { level: 1, name: 'Scenarios' })

    await user.click(screen.getByRole('button', { name: /sign out/i }))

    await waitFor(() =>
      expect(server.calls.some((call) => call.path === '/admin/logout' && call.method === 'POST'))
        .toBe(true))
  })

  it('keeps no admin identity in browser storage', async () => {
    renderAdmin(ROUTES.ADMIN_SCENARIOS, <AdminScenariosPage />, ROUTES.ADMIN_SCENARIOS)
    await screen.findByRole('heading', { level: 1, name: 'Scenarios' })

    expect(globalThis.localStorage?.length ?? 0).toBe(0)
    expect(globalThis.sessionStorage?.length ?? 0).toBe(0)
  })
})

/* ------------------------------------------------------------------ *
 * scenario manager
 * ------------------------------------------------------------------ */

describe('the scenario manager', () => {
  it('lists scenarios with their lifecycle stated in words', async () => {
    renderAdmin(ROUTES.ADMIN_SCENARIOS, <AdminScenariosPage />, ROUTES.ADMIN_SCENARIOS)
    await screen.findByRole('heading', { level: 1, name: 'Scenarios' })

    const table = await screen.findByRole('table')
    expect(within(table).getByRole('link', { name: 'W01' })).toBeTruthy()
    expect(within(table).getByRole('link', { name: 'W02' })).toBeTruthy()
    // The state is readable without colour.
    expect(within(table).getByText('Published')).toBeTruthy()
    expect(within(table).getByText('Draft')).toBeTruthy()
  })

  it('sends only the filters the API accepts', async () => {
    const user = userEvent.setup()
    renderAdmin(ROUTES.ADMIN_SCENARIOS, <AdminScenariosPage />, ROUTES.ADMIN_SCENARIOS)
    await screen.findByRole('heading', { level: 1, name: 'Scenarios' })

    await user.selectOptions(screen.getByLabelText('Platform'), 'whatsapp')
    await user.selectOptions(screen.getByLabelText('Lifecycle'), 'draft')

    await waitFor(() => {
      const last = server.calls.filter((call) => call.path === '/admin/scenarios').at(-1)
      const params = new URLSearchParams(last.search)
      expect(params.get('platform')).toBe('whatsapp')
      expect(params.get('lifecycle')).toBe('draft')
      // Untouched filters are absent rather than sent empty.
      expect(params.has('level')).toBe(false)
      expect(params.has('sort')).toBe(false)
    })
  })

  it('surfaces the scenario-id limitation instead of offering a create button', async () => {
    renderAdmin(ROUTES.ADMIN_SCENARIOS, <AdminScenariosPage />, ROUTES.ADMIN_SCENARIOS)
    await screen.findByRole('heading', { level: 1, name: 'Scenarios' })

    expect(screen.getByText(/creating a brand-new scenario is not available/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /new scenario/i })).toBeNull()
  })

  it('shows an empty state rather than a blank table', async () => {
    server.scenarios = []
    renderAdmin(ROUTES.ADMIN_SCENARIOS, <AdminScenariosPage />, ROUTES.ADMIN_SCENARIOS)

    expect(await screen.findByText(/no scenarios match these filters/i)).toBeTruthy()
  })

  it('reports a server error with its own message', async () => {
    server.failNext = { status: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong.' }
    renderAdmin(ROUTES.ADMIN_SCENARIOS, <AdminScenariosPage />, ROUTES.ADMIN_SCENARIOS)

    expect(await screen.findByText('Something went wrong.')).toBeTruthy()
  })

  it('keeps the answer key hidden until it is deliberately revealed', async () => {
    const user = userEvent.setup()
    renderAdmin('/admin/scenarios/W01', <AdminScenarioDetailPage />, ROUTES.ADMIN_SCENARIO)
    await screen.findByRole('heading', { level: 2, name: /version 2/i })

    const safeAction = 'Confirm on the published number before paying anything.'
    expect(screen.queryByText(safeAction)).toBeNull()

    const toggle = screen.getByRole('button', { name: /show answer key/i })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    await user.click(toggle)

    expect(await screen.findByText(safeAction)).toBeTruthy()
    expect(screen.getByRole('button', { name: /hide answer key/i })).toBeTruthy()
  })

  it('publishes only after a confirmation, through the existing endpoint', async () => {
    const user = userEvent.setup()
    server.scenarioVersions = [{ ...server.scenarioVersions[0], lifecycle: 'draft', version: 3 }]
    renderAdmin('/admin/scenarios/W01', <AdminScenarioDetailPage />, ROUTES.ADMIN_SCENARIO)
    await screen.findByRole('heading', { level: 2, name: /version 3/i })

    await user.click(screen.getByRole('button', { name: 'Publish' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/whichever version is live now is retired/i)).toBeTruthy()
    // Nothing has been sent yet.
    expect(server.calls.some((call) => call.path.endsWith('/publish'))).toBe(false)

    await user.click(within(dialog).getByRole('button', { name: 'Publish' }))

    await waitFor(() =>
      expect(server.calls.some((call) =>
        call.path === '/admin/scenarios/W01/versions/3/publish' && call.method === 'POST'))
        .toBe(true))
    expect(await screen.findByText(/version 3 is now live/i)).toBeTruthy()
  })

  it('deactivates only after a confirmation that says it cannot be republished', async () => {
    const user = userEvent.setup()
    renderAdmin('/admin/scenarios/W01', <AdminScenarioDetailPage />, ROUTES.ADMIN_SCENARIO)
    await screen.findByRole('heading', { level: 2, name: /version 2/i })

    await user.click(screen.getByRole('button', { name: 'Deactivate' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/cannot be republished/i)).toBeTruthy()

    await user.click(within(dialog).getByRole('button', { name: 'Deactivate' }))
    await waitFor(() =>
      expect(server.calls.some((call) => call.path.endsWith('/deactivate'))).toBe(true))
  })

  it('clones a version into a new draft', async () => {
    const user = userEvent.setup()
    renderAdmin('/admin/scenarios/W01', <AdminScenarioDetailPage />, ROUTES.ADMIN_SCENARIO)
    await screen.findByRole('heading', { level: 2, name: /version 2/i })

    await user.click(screen.getByRole('button', { name: /clone to new draft/i }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: /create draft/i }))

    await waitFor(() => {
      const call = server.calls.find((entry) => entry.path.endsWith('/clone'))
      expect(call).toBeTruthy()
      // No target id was typed, so none is sent.
      expect(call.body).toEqual({})
    })
    // The clone succeeded and the page said so. (The dialog copy also mentions drafts,
    // so the success banner is matched specifically.)
    expect(await screen.findByText(/created W02 version 3 as a draft\./i)).toBeTruthy()
  })

  it('says when an edit branched a new version instead of rewriting a published one', async () => {
    const user = userEvent.setup()
    renderAdmin('/admin/scenarios/W01', <AdminScenarioDetailPage />, ROUTES.ADMIN_SCENARIO)
    await screen.findByRole('heading', { level: 2, name: /version 2/i })

    await user.click(screen.getByRole('button', { name: /edit metadata/i }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/will not be rewritten/i)).toBeTruthy()

    // The field is pre-filled from the version, so it is cleared before typing.
    await user.clear(within(dialog).getByLabelText('Owner'))
    await user.type(within(dialog).getByLabelText('Owner'), 'New owner')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      const call = server.calls.find((entry) => entry.method === 'PATCH')
      expect(call.body).toEqual({ owner: 'New owner', review_date: null })
    })
    expect(await screen.findByText(/created draft version 3/i)).toBeTruthy()
  })

  it('shows a validation failure inside the dialog and changes nothing', async () => {
    const user = userEvent.setup()
    renderAdmin('/admin/scenarios/W01', <AdminScenarioDetailPage />, ROUTES.ADMIN_SCENARIO)
    await screen.findByRole('heading', { level: 2, name: /version 2/i })

    await user.click(screen.getByRole('button', { name: 'Deactivate' }))
    const dialog = await screen.findByRole('dialog')

    server.failNext = {
      status: 422,
      code: 'SCENARIO_VALIDATION_FAILED',
      message: 'This scenario is not valid.',
      details: { problems: ['stage "verify" references unknown asset "W01-x"'] },
    }
    await user.click(within(dialog).getByRole('button', { name: 'Deactivate' }))

    expect(await within(dialog).findByText('This scenario is not valid.')).toBeTruthy()
    expect(within(dialog).getByText(/references unknown asset/i)).toBeTruthy()
    // The dialog stayed open so the instructor can retry or cancel deliberately.
    expect(screen.getByRole('dialog')).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ *
 * attempt viewer
 * ------------------------------------------------------------------ */

describe('the attempt viewer', () => {
  it('lists attempts and shows no score for an unfinished one', async () => {
    renderAdmin(ROUTES.ADMIN_ATTEMPTS, <AdminAttemptsPage />, ROUTES.ADMIN_ATTEMPTS)
    await screen.findByRole('heading', { level: 1, name: 'Attempts' })

    const table = await screen.findByRole('table')
    expect(within(table).getByText('67 / 100')).toBeTruthy()
    expect(within(table).getByText('Not available')).toBeTruthy()
    expect(within(table).getAllByText('••••4356').length).toBe(2)
  })

  it('sends the date range and status the instructor chose, and nothing else', async () => {
    const user = userEvent.setup()
    renderAdmin(ROUTES.ADMIN_ATTEMPTS, <AdminAttemptsPage />, ROUTES.ADMIN_ATTEMPTS)
    await screen.findByRole('heading', { level: 1, name: 'Attempts' })

    await user.selectOptions(screen.getByLabelText('Status'), 'completed')
    await user.type(screen.getByLabelText('Started from'), '2026-09-01')

    await waitFor(() => {
      const last = server.calls.filter((call) => call.path === '/admin/attempts').at(-1)
      const params = new URLSearchParams(last.search)
      expect(params.get('status')).toBe('completed')
      expect(params.get('started_from')).toBe('2026-09-01')
      expect(params.get('page_size')).toBe('10')
      expect(params.has('service_no')).toBe(false)
    })
  })

  it('filters by a learner found through the bounded lookup', async () => {
    const user = userEvent.setup()
    renderAdmin(ROUTES.ADMIN_ATTEMPTS, <AdminAttemptsPage />, ROUTES.ADMIN_ATTEMPTS)
    await screen.findByRole('heading', { level: 1, name: 'Attempts' })

    await user.type(screen.getByLabelText(/find a learner by name/i), 'Test')
    await user.click(screen.getByRole('button', { name: 'Search' }))

    const result = await screen.findByRole('button', { name: /test learner/i })
    await user.click(result)

    await waitFor(() => {
      const last = server.calls.filter((call) => call.path === '/admin/attempts').at(-1)
      expect(new URLSearchParams(last.search).get('profile_id')).toBe('profile-1')
    })
    // The lookup published the masked number only.
    expect(screen.getAllByText(/••••4356/).length).toBeGreaterThan(0)
  })

  it('shows difficulty and military context for each finished scenario (ADM-007)', async () => {
    renderAdmin('/admin/attempts/attempt-complete', <AdminAttemptDetailPage />, ROUTES.ADMIN_ATTEMPT)
    await screen.findByRole('heading', { level: 1, name: 'Test Learner' })

    expect(screen.getAllByText('Difficulty').length).toBe(2)
    expect(screen.getAllByText('Medium').length).toBe(2)
    expect(screen.getAllByText('Military context').length).toBe(2)
    expect(screen.getByText('Yes')).toBeTruthy()
    expect(screen.getByText('No')).toBeTruthy()
  })

  it('renders a completed attempt from the server result, recalculating nothing', async () => {
    renderAdmin('/admin/attempts/attempt-complete', <AdminAttemptDetailPage />, ROUTES.ADMIN_ATTEMPT)
    await screen.findByRole('heading', { level: 1, name: 'Test Learner' })

    // The server total, not the sum of the two fixture scenarios (14).
    expect(screen.getByText('67')).toBeTruthy()
    expect(screen.queryByText('14')).toBeNull()

    expect(screen.getAllByText('Payment diversion').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Reported').length).toBeGreaterThan(0)
    // Two scenarios in the fixture, each with the same first step.
    expect(screen.getAllByText('Opened the notification').length).toBe(2)
    expect(screen.getByText(/7 practice scenarios available/i)).toBeTruthy()
    expect(screen.getByText('+15')).toBeTruthy()
  })

  it('shows an incomplete attempt honestly, with no total and pending scenarios', async () => {
    server.attemptDetail = ATTEMPT_DETAIL_IN_PROGRESS
    renderAdmin('/admin/attempts/attempt-partial', <AdminAttemptDetailPage />, ROUTES.ADMIN_ATTEMPT)
    await screen.findByRole('heading', { level: 1, name: 'Test Learner' })

    expect(screen.getByText('No total score')).toBeTruthy()
    const points = screen.getByText('Points from resolved').closest('div')
    expect(within(points).getByText('7')).toBeTruthy()
    // No 0-100 total is shown anywhere for an unfinished attempt.
    expect(screen.queryByText('67')).toBeNull()

    expect(screen.getByText('Not resolved')).toBeTruthy()
    expect(screen.getByText(/no score, outcome, classification or feedback is reported/i))
      .toBeTruthy()

    expect(screen.getByText(/covers the 1 resolved scenario only/i)).toBeTruthy()
    expect(screen.getAllByText(/the attempt is not finished/i).length).toBeGreaterThan(0)
  })

  it('exposes no event ledger detail and no raw event viewer', async () => {
    const { container } = renderAdmin(
      '/admin/attempts/attempt-complete', <AdminAttemptDetailPage />, ROUTES.ADMIN_ATTEMPT,
    )
    await screen.findByRole('heading', { level: 1, name: 'Test Learner' })

    const text = container.textContent
    for (const forbidden of ['intent_key', 'event_code', 'points_delta', 'NOTIFY_SEEN',
      'RESOLVE_CORRECT', 'seed', 'scenario_sequence', 'rationale', 'metadata']) {
      expect(text).not.toContain(forbidden)
    }
    expect(screen.queryByRole('button', { name: /event/i })).toBeNull()
  })
})

/* ------------------------------------------------------------------ *
 * export
 * ------------------------------------------------------------------ */

describe('export', () => {
  it('requests a CSV and reports where the server put it', async () => {
    const user = userEvent.setup()
    renderAdmin('/admin/attempts/attempt-complete', <AdminAttemptDetailPage />, ROUTES.ADMIN_ATTEMPT)
    await screen.findByRole('heading', { level: 1, name: 'Test Learner' })

    await user.click(screen.getByRole('button', { name: /export csv/i }))

    await waitFor(() => {
      const call = server.calls.find((entry) => entry.path.startsWith('/admin/exports/attempts/'))
      expect(call.body).toEqual({ format: 'csv' })
    })

    expect(await screen.findByText(/csv export ready/i)).toBeTruthy()
    expect(screen.getByText(/TRAINING SIMULATION · OFFLINE/)).toBeTruthy()
    expect(screen.getByText(/written to the server's export folder/i)).toBeTruthy()
    expect(screen.getByText(/choosing a different folder needs the desktop integration/i))
      .toBeTruthy()
  })

  it('requests a PDF through the same contract', async () => {
    const user = userEvent.setup()
    renderAdmin('/admin/attempts/attempt-complete', <AdminAttemptDetailPage />, ROUTES.ADMIN_ATTEMPT)
    await screen.findByRole('heading', { level: 1, name: 'Test Learner' })

    await user.click(screen.getByRole('button', { name: /export pdf/i }))

    await waitFor(() => {
      const call = server.calls.find((entry) => entry.path.startsWith('/admin/exports/attempts/'))
      expect(call.body).toEqual({ format: 'pdf' })
    })
    expect(await screen.findByText(/pdf export ready/i)).toBeTruthy()
  })

  it('never sends a path, directory or filename', async () => {
    const user = userEvent.setup()
    renderAdmin('/admin/attempts/attempt-complete', <AdminAttemptDetailPage />, ROUTES.ADMIN_ATTEMPT)
    await screen.findByRole('heading', { level: 1, name: 'Test Learner' })

    await user.click(screen.getByRole('button', { name: /export csv/i }))

    await waitFor(() => {
      const call = server.calls.find((entry) => entry.path.startsWith('/admin/exports/attempts/'))
      expect(Object.keys(call.body)).toEqual(['format'])
    })
  })

  it('offers "Export learner" only once one learner is selected (ADM-007)', async () => {
    const user = userEvent.setup()
    renderAdmin(ROUTES.ADMIN_ATTEMPTS, <AdminAttemptsPage />, ROUTES.ADMIN_ATTEMPTS)
    await screen.findByRole('heading', { level: 1, name: 'Attempts' })

    expect(screen.queryByRole('heading', { name: 'Export learner' })).toBeNull()

    await user.type(screen.getByLabelText(/find a learner by name/i), 'Test')
    await user.click(screen.getByRole('button', { name: 'Search' }))
    await user.click(await screen.findByRole('button', { name: /test learner/i }))

    expect(await screen.findByRole('heading', { name: 'Export learner' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /export csv/i }))

    await waitFor(() => {
      const call = server.calls.find((entry) => entry.path.startsWith('/admin/exports/learners/'))
      expect(call.path).toBe('/admin/exports/learners/profile-1')
      expect(call.body).toEqual({ format: 'csv' })
    })
    expect(await screen.findByText(/csv export ready/i)).toBeTruthy()
    expect(screen.getByText('Completed attempts')).toBeTruthy()
    expect(screen.getByText(/TRAINING SIMULATION · OFFLINE/)).toBeTruthy()
    // No attempt export was made in its place.
    expect(server.calls.some((entry) => entry.path.startsWith('/admin/exports/attempts/')))
      .toBe(false)
  })

  it('reports an export failure without claiming a file exists', async () => {
    const user = userEvent.setup()
    renderAdmin('/admin/attempts/attempt-complete', <AdminAttemptDetailPage />, ROUTES.ADMIN_ATTEMPT)
    await screen.findByRole('heading', { level: 1, name: 'Test Learner' })

    server.failNext = {
      status: 500,
      code: 'EXPORT_WRITE_FAILED',
      message: 'The export could not be written to the export directory.',
    }
    await user.click(screen.getByRole('button', { name: /export csv/i }))

    expect(await screen.findByText(/could not be written/i)).toBeTruthy()
    expect(screen.queryByText(/export ready/i)).toBeNull()
  })
})

/* ------------------------------------------------------------------ *
 * instructor controls
 * ------------------------------------------------------------------ */

describe('instructor controls', () => {
  it('does not offer reset for a completed attempt, and says why', async () => {
    renderAdmin('/admin/attempts/attempt-complete', <AdminAttemptDetailPage />, ROUTES.ADMIN_ATTEMPT)
    await screen.findByRole('heading', { level: 1, name: 'Test Learner' })

    expect(screen.queryByRole('button', { name: /reset attempt/i })).toBeNull()
    expect(screen.getByText(/only an attempt that is still in progress can be reset/i))
      .toBeTruthy()
  })

  it('resets an in-progress attempt only after a confirmation that calls it terminal', async () => {
    const user = userEvent.setup()
    server.attemptDetail = ATTEMPT_DETAIL_IN_PROGRESS
    renderAdmin('/admin/attempts/attempt-partial', <AdminAttemptDetailPage />, ROUTES.ADMIN_ATTEMPT)
    await screen.findByRole('heading', { level: 1, name: 'Test Learner' })

    await user.click(screen.getByRole('button', { name: /reset attempt/i }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/cannot be undone/i)).toBeTruthy()
    expect(within(dialog).getByText(/nothing is deleted/i)).toBeTruthy()
    expect(server.calls.some((call) => call.path.endsWith('/reset'))).toBe(false)

    await user.selectOptions(within(dialog).getByLabelText(/reason/i), 'technical_fault')
    await user.click(within(dialog).getByRole('button', { name: 'Reset attempt' }))

    await waitFor(() => {
      const call = server.calls.find((entry) => entry.path.endsWith('/reset'))
      expect(call.method).toBe('POST')
      expect(call.body).toEqual({ reason_code: 'technical_fault' })
    })
    expect(await screen.findByText(/the attempt was reset/i)).toBeTruthy()
    // The screen re-read the attempt rather than updating optimistically.
    expect(server.calls.filter((call) => call.path === '/admin/attempts/attempt-partial').length)
      .toBeGreaterThan(1)
  })

  it('archives a profile after a confirmation that never uses delete language', async () => {
    const user = userEvent.setup()
    renderAdmin('/admin/attempts/attempt-complete', <AdminAttemptDetailPage />, ROUTES.ADMIN_ATTEMPT)
    await screen.findByRole('heading', { level: 1, name: 'Test Learner' })

    await user.click(screen.getByRole('button', { name: /archive learner profile/i }))
    const dialog = await screen.findByRole('dialog')

    expect(within(dialog).getByText(/archiving is not deletion/i)).toBeTruthy()
    expect(dialog.textContent).not.toMatch(/\bdelete\b/i)
    expect(within(dialog).getByText(/can no longer sign in/i)).toBeTruthy()

    await user.click(within(dialog).getByRole('button', { name: 'Archive profile' }))

    await waitFor(() => {
      const call = server.calls.find((entry) => entry.path === '/admin/learners/profile-1/archive')
      expect(call.method).toBe('POST')
    })
    expect(await screen.findByText(/the profile is archived/i)).toBeTruthy()
  })

  it('cancels without sending anything', async () => {
    const user = userEvent.setup()
    renderAdmin('/admin/attempts/attempt-complete', <AdminAttemptDetailPage />, ROUTES.ADMIN_ATTEMPT)
    await screen.findByRole('heading', { level: 1, name: 'Test Learner' })

    await user.click(screen.getByRole('button', { name: /archive learner profile/i }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(server.calls.some((call) => call.path.endsWith('/archive'))).toBe(false)
  })
})

/* ------------------------------------------------------------------ *
 * feedback configuration
 * ------------------------------------------------------------------ */

describe('feedback timing configuration', () => {
  it('reads the current values and the server enforcement note', async () => {
    renderAdmin(ROUTES.ADMIN_SETTINGS, <AdminSettingsPage />, ROUTES.ADMIN_SETTINGS)
    await screen.findByRole('heading', { level: 1, name: 'Settings' })

    expect(screen.getByLabelText('Training mode').value).toBe('on_completion')
    expect(screen.getByLabelText('Assessment mode').value).toBe('on_completion')
    expect(screen.getByText(/feedback card is released as it resolves/i)).toBeTruthy()
  })

  it('offers only the values the server allows', async () => {
    renderAdmin(ROUTES.ADMIN_SETTINGS, <AdminSettingsPage />, ROUTES.ADMIN_SETTINGS)
    await screen.findByRole('heading', { level: 1, name: 'Settings' })

    const options = within(screen.getByLabelText('Training mode')).getAllByRole('option')
    expect(options.map((option) => option.value)).toEqual(['immediate', 'on_completion'])
  })

  it('saves with the version it read, then renders what the server confirmed', async () => {
    const user = userEvent.setup()
    renderAdmin(ROUTES.ADMIN_SETTINGS, <AdminSettingsPage />, ROUTES.ADMIN_SETTINGS)
    await screen.findByRole('heading', { level: 1, name: 'Settings' })

    await user.selectOptions(screen.getByLabelText('Training mode'), 'immediate')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      const call = server.calls.find((entry) => entry.method === 'PATCH')
      expect(call.body).toEqual({
        training_feedback_timing: 'immediate',
        assessment_feedback_timing: 'on_completion',
        expected_config_version: 1,
      })
    })
    expect(await screen.findByText(/saved\./i)).toBeTruthy()
    expect(screen.getByLabelText('Training mode').value).toBe('immediate')
  })

  it('cannot save when nothing changed', async () => {
    renderAdmin(ROUTES.ADMIN_SETTINGS, <AdminSettingsPage />, ROUTES.ADMIN_SETTINGS)
    await screen.findByRole('heading', { level: 1, name: 'Settings' })

    expect(screen.getByRole('button', { name: /save changes/i }).disabled).toBe(true)
    expect(screen.getByText('No changes to save.')).toBeTruthy()
  })

  it('tells the instructor to reload when the configuration moved underneath them', async () => {
    const user = userEvent.setup()
    renderAdmin(ROUTES.ADMIN_SETTINGS, <AdminSettingsPage />, ROUTES.ADMIN_SETTINGS)
    await screen.findByRole('heading', { level: 1, name: 'Settings' })

    await user.selectOptions(screen.getByLabelText('Training mode'), 'immediate')
    server.failNext = {
      status: 409,
      code: 'CONFIG_VERSION_CONFLICT',
      message: 'This configuration has changed since it was read.',
    }
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByText(/this page is out of date/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /reload configuration/i })).toBeTruthy()
  })

  it('offers nothing for scoring, taxonomy, selection or security', async () => {
    const { container } = renderAdmin(
      ROUTES.ADMIN_SETTINGS, <AdminSettingsPage />, ROUTES.ADMIN_SETTINGS,
    )
    await screen.findByRole('heading', { level: 1, name: 'Settings' })

    // Exactly two controls exist, and they are the two timing selects. The page's prose
    // does mention scoring and the taxonomies - to say they are NOT configurable - so the
    // check is on the controls, which is what an instructor can actually change.
    const selects = [...container.querySelectorAll('select')]
    // ENHANCEMENT-001B lists the assessment timing first; the training value stays.
    expect(selects.map((element) => element.id)).toEqual(['assessment-timing', 'training-timing'])
    expect(container.querySelectorAll('input, textarea').length).toBe(0)
  })
})

/* ------------------------------------------------------------------ *
 * audit
 * ------------------------------------------------------------------ */

describe('the audit log', () => {
  it('reads the existing endpoint and offers no way to change an entry', async () => {
    renderAdmin(ROUTES.ADMIN_AUDIT, <AdminAuditPage />, ROUTES.ADMIN_AUDIT)
    await screen.findByRole('heading', { level: 1, name: 'Audit log' })

    expect(await screen.findByRole('table')).toBeTruthy()
    expect(screen.getAllByText('Attempt reset').length).toBeGreaterThan(0)
    // The actor is named in the row, as well as in the shell's "signed in as".
    const table = screen.getByRole('table')
    expect(within(table).getByText('instructor')).toBeTruthy()

    for (const forbidden of [/delete/i, /remove/i, /clear log/i, /edit entry/i]) {
      expect(screen.queryByRole('button', { name: forbidden })).toBeNull()
    }
  })

  it('shows an empty state when nothing has been changed yet', async () => {
    server.auditEntries = []
    renderAdmin(ROUTES.ADMIN_AUDIT, <AdminAuditPage />, ROUTES.ADMIN_AUDIT)

    expect(await screen.findByText(/no entries yet/i)).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ *
 * accessibility
 * ------------------------------------------------------------------ */

describe('accessibility', () => {
  it('gives every filter control a real label', async () => {
    renderAdmin(ROUTES.ADMIN_ATTEMPTS, <AdminAttemptsPage />, ROUTES.ADMIN_ATTEMPTS)
    await screen.findByRole('heading', { level: 1, name: 'Attempts' })

    // ENHANCEMENT-001B: no Mode filter - this is an assessment system.
    expect(screen.queryByLabelText('Mode')).toBeNull()
    for (const name of ['Find a learner by name', 'Status', 'Started from', 'Started to']) {
      expect(screen.getByLabelText(name)).toBeTruthy()
    }
  })

  it('names every table for a screen reader', async () => {
    renderAdmin(ROUTES.ADMIN_ATTEMPTS, <AdminAttemptsPage />, ROUTES.ADMIN_ATTEMPTS)
    await screen.findByRole('heading', { level: 1, name: 'Attempts' })

    expect((await screen.findByRole('table')).querySelector('caption')).toBeTruthy()
  })

  it('traps focus in a confirmation dialog and closes on Escape', async () => {
    const user = userEvent.setup()
    renderAdmin('/admin/attempts/attempt-complete', <AdminAttemptDetailPage />, ROUTES.ADMIN_ATTEMPT)
    await screen.findByRole('heading', { level: 1, name: 'Test Learner' })

    await user.click(screen.getByRole('button', { name: /archive learner profile/i }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(dialog.contains(document.activeElement)).toBe(true)

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('keeps every interactive target at least 44px tall', async () => {
    const { container } = renderAdmin(
      ROUTES.ADMIN_ATTEMPTS, <AdminAttemptsPage />, ROUTES.ADMIN_ATTEMPTS,
    )
    await screen.findByRole('table')

    // Every control carries an explicit height class of at least h-11 (44px).
    const controls = [...container.querySelectorAll('select, button, a[href], input')]
    const tooSmall = controls.filter((element) => {
      const classes = element.className
      if (typeof classes !== 'string') return false
      return /\bh-9\b|\bh-8\b|\bh-10\b/.test(classes) && !/min-h-11/.test(classes)
    })
    expect(tooSmall).toEqual([])
  })

  it('scrolls a wide table inside its own container rather than the page', async () => {
    const { container } = renderAdmin(
      ROUTES.ADMIN_ATTEMPTS, <AdminAttemptsPage />, ROUTES.ADMIN_ATTEMPTS,
    )
    await screen.findByRole('table')

    const table = container.querySelector('table')
    expect(table.parentElement.className).toContain('overflow-x-auto')
  })
})


/* ------------------------------------------------------------------ *
 * ENHANCEMENT-003-FINAL: demo skips are not time-limit closures
 * ------------------------------------------------------------------ */

describe('Attempt Detail outcome labels', () => {
  it('shows a demo skip as "Skipped (Demo)" and a time-limit closure as a time-limit closure', async () => {
    const [base] = ATTEMPT_DETAIL_COMPLETE.scenarios
    server.attemptDetail = {
      ...ATTEMPT_DETAIL_COMPLETE,
      scenarios: [
        { ...base, ordinal: 1, outcome_class: 'demo_skipped', outcome_code: 'resolve_demo_skipped', score_0_10: 0 },
        { ...base, ordinal: 2, outcome_class: 'not_resolved', outcome_code: 'resolve_expired', score_0_10: 0 },
      ],
    }
    renderAdmin('/admin/attempts/attempt-complete', <AdminAttemptDetailPage />, ROUTES.ADMIN_ATTEMPT)
    await screen.findByRole('heading', { level: 1, name: 'Test Learner' })

    // Outcome pill and final action for the demo skip; neither mentions the clock.
    expect(screen.getAllByText('Skipped (Demo)').length).toBe(2)
    // The time-limit closure keeps its own wording, unchanged.
    expect(screen.getByText('Not reached in time')).toBeTruthy()
    expect(screen.getByText('Not completed - time ran out')).toBeTruthy()
    // No raw slugs or engine codes reach the screen.
    const text = document.body.textContent
    expect(text).not.toMatch(/demo_skipped|resolve_demo_skipped|RUN_DEMO_SKIPPED/)
  })
})
