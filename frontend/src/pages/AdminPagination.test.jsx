import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { pageItems } from '@/components/admin/adminUi'
import { ROUTES } from '@/constants/routes'
import { RequireAdmin } from '@/routes/RequireAdmin'
import { AdminAttemptsPage } from '@/pages/AdminAttemptsPage'
import { AdminAuditPage } from '@/pages/AdminAuditPage'
import { AdminScenariosPage } from '@/pages/AdminScenariosPage'
import {
  ATTEMPT_SUMMARY,
  AUDIT_ENTRY,
  SCENARIO_SUMMARY,
  createAdminServer,
  installAdminFetch,
  manyOf,
} from '@/test/adminFixtures'

/**
 * ENHANCEMENT-001B - one pagination pattern, ten rows a page, on every admin table.
 *
 * The fake server pages exactly as the three list APIs do (see `pageOf` in the fixtures),
 * so these tests check the real contract: the page size and page number SENT, the range
 * and controls SHOWN, and that a filter change goes back to page 1 while keeping the
 * filter on every later page.
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

function renderAdmin(path, element) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route path={path} element={element} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

const lastCall = (path) => server.calls.filter((call) => call.path === path).at(-1)
const paramsOf = (path) => new URLSearchParams(lastCall(path).search)
const pagination = () => screen.getByRole('navigation', { name: 'Pagination' })

describe('the page window', () => {
  it('shows every page up to seven, then the ends and the neighbours', () => {
    expect(pageItems(1, 1)).toEqual([1])
    expect(pageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(pageItems(1, 10)).toEqual([1, 2, 3, 4, 5, 'gap-end', 10])
    expect(pageItems(6, 10)).toEqual([1, 'gap-start', 5, 6, 7, 'gap-end', 10])
    expect(pageItems(10, 10)).toEqual([1, 'gap-start', 6, 7, 8, 9, 10])
  })
})

describe('scenarios', () => {
  beforeEach(() => {
    server.scenarios = manyOf(SCENARIO_SUMMARY, 23, 'id', (i) => `def-${i}`)
      .map((row, i) => ({ ...row, scenario_id: `W${String(i + 1).padStart(2, '0')}` }))
  })

  it('asks the server for ten, shows ten, and states the range', async () => {
    renderAdmin(ROUTES.ADMIN_SCENARIOS, <AdminScenariosPage />)
    const table = await screen.findByRole('table')

    expect(paramsOf('/admin/scenarios').get('page_size')).toBe('10')
    expect(within(table).getAllByRole('row')).toHaveLength(11) // header + 10
    expect(within(pagination()).getByText(/Showing/).textContent).toMatch(/Showing 1–10 of 23 scenarios/)
    expect(within(pagination()).getByRole('button', { name: 'Page 1' }).getAttribute('aria-current')).toBe('page')
    expect(within(pagination()).getByRole('button', { name: 'Previous page' }).disabled).toBe(true)
  })

  it('moves by number and by Next, and stops at the last page', async () => {
    const user = userEvent.setup()
    renderAdmin(ROUTES.ADMIN_SCENARIOS, <AdminScenariosPage />)
    await screen.findByRole('table')

    await user.click(within(pagination()).getByRole('button', { name: 'Page 2' }))
    await waitFor(() => expect(paramsOf('/admin/scenarios').get('page')).toBe('2'))
    await waitFor(() => expect(within(pagination()).getByText(/Showing/).textContent).toMatch(/11–20 of 23/))

    await user.click(within(pagination()).getByRole('button', { name: 'Next page' }))
    await waitFor(() => expect(within(pagination()).getByText(/Showing/).textContent).toMatch(/21–23 of 23/))
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(4)
    expect(within(pagination()).getByRole('button', { name: 'Next page' }).disabled).toBe(true)
    expect(within(pagination()).getByRole('button', { name: 'Page 3' }).getAttribute('aria-current')).toBe('page')
  })

  it('returns to page 1 when a filter changes, and keeps the filter when paging', async () => {
    const user = userEvent.setup()
    renderAdmin(ROUTES.ADMIN_SCENARIOS, <AdminScenariosPage />)
    await screen.findByRole('table')

    await user.click(within(pagination()).getByRole('button', { name: 'Page 3' }))
    await waitFor(() => expect(paramsOf('/admin/scenarios').get('page')).toBe('3'))

    await user.selectOptions(screen.getByLabelText('Platform'), 'whatsapp')
    await waitFor(() => {
      expect(paramsOf('/admin/scenarios').get('platform')).toBe('whatsapp')
      expect(paramsOf('/admin/scenarios').get('page')).toBe('1')
    })

    await user.click(await within(pagination()).findByRole('button', { name: 'Page 2' }))
    await waitFor(() => {
      expect(paramsOf('/admin/scenarios').get('page')).toBe('2')
      expect(paramsOf('/admin/scenarios').get('platform')).toBe('whatsapp')
    })
  })

  it('shows no page controls when everything fits on one page', async () => {
    server.scenarios = server.scenarios.slice(0, 10)
    renderAdmin(ROUTES.ADMIN_SCENARIOS, <AdminScenariosPage />)
    await screen.findByRole('table')

    expect(within(pagination()).getByText(/Showing/).textContent).toMatch(/1–10 of 10/)
    expect(within(pagination()).queryByRole('button')).toBeNull()
  })

  it('offers Clear filters only once a filter is set', async () => {
    const user = userEvent.setup()
    renderAdmin(ROUTES.ADMIN_SCENARIOS, <AdminScenariosPage />)
    await screen.findByRole('table')

    const clear = screen.getByRole('button', { name: /clear filters/i })
    expect(clear.disabled).toBe(true)
    await user.selectOptions(screen.getByLabelText('Level'), 'hard')
    expect(clear.disabled).toBe(false)
    await user.click(clear)
    await waitFor(() => expect(paramsOf('/admin/scenarios').has('level')).toBe(false))
  })
})

describe('attempts', () => {
  beforeEach(() => {
    server.attempts = manyOf(ATTEMPT_SUMMARY, 15, 'attempt_id', (i) => `attempt-${i}`)
  })

  it('pages at ten and keeps the status filter on every page', async () => {
    const user = userEvent.setup()
    renderAdmin(ROUTES.ADMIN_ATTEMPTS, <AdminAttemptsPage />)
    await screen.findByRole('table')
    expect(paramsOf('/admin/attempts').get('page_size')).toBe('10')
    expect(within(pagination()).getByText(/Showing/).textContent).toMatch(/1–10 of 15 attempts/)

    await user.selectOptions(screen.getByLabelText('Status'), 'completed')
    await user.click(await within(pagination()).findByRole('button', { name: 'Next page' }))

    await waitFor(() => {
      const params = paramsOf('/admin/attempts')
      expect(params.get('page')).toBe('2')
      expect(params.get('status')).toBe('completed')
      expect(params.get('page_size')).toBe('10')
    })
    await waitFor(() => expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(6))
  })

  it('returns to page 1 when a learner is chosen', async () => {
    const user = userEvent.setup()
    renderAdmin(ROUTES.ADMIN_ATTEMPTS, <AdminAttemptsPage />)
    await screen.findByRole('table')
    await user.click(within(pagination()).getByRole('button', { name: 'Page 2' }))
    await waitFor(() => expect(paramsOf('/admin/attempts').get('page')).toBe('2'))

    await user.type(screen.getByLabelText(/find a learner by name/i), 'Test')
    await user.click(screen.getByRole('button', { name: 'Search' }))
    await user.click(await screen.findByRole('button', { name: /test learner/i }))

    await waitFor(() => {
      const params = paramsOf('/admin/attempts')
      expect(params.get('profile_id')).toBe('profile-1')
      expect(params.get('page')).toBe('1')
    })
  })
})

describe('audit log', () => {
  beforeEach(() => {
    server.auditEntries = manyOf(AUDIT_ENTRY, 12, 'audit_id', (i) => `audit-${i}`)
  })

  it('pages at ten, keeps the action filter, and resets to page 1 on a new filter', async () => {
    const user = userEvent.setup()
    renderAdmin(ROUTES.ADMIN_AUDIT, <AdminAuditPage />)
    await screen.findByRole('table')
    expect(paramsOf('/admin/audit').get('page_size')).toBe('10')
    expect(within(pagination()).getByText(/Showing/).textContent).toMatch(/1–10 of 12 entries/)

    await user.selectOptions(screen.getByLabelText('Action'), 'ATTEMPT_RESET')
    await user.click(await within(pagination()).findByRole('button', { name: 'Page 2' }))
    await waitFor(() => {
      const params = paramsOf('/admin/audit')
      expect(params.get('page')).toBe('2')
      expect(params.get('action')).toBe('ATTEMPT_RESET')
    })

    await user.type(screen.getByLabelText('From'), '2026-09-01')
    await waitFor(() => {
      const params = paramsOf('/admin/audit')
      expect(params.get('from')).toBe('2026-09-01')
      expect(params.get('page')).toBe('1')
    })
  })
})
