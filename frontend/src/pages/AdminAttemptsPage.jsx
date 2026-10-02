import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Search, UserRound, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LearnerExportPanel } from '@/components/admin/AttemptExportPanel'
import {
  EmptyState,
  ErrorState,
  FilterBar,
  InputFilter,
  PageHeading,
  Pagination,
  Pill,
  SectionCard,
  SelectFilter,
  TableScroll,
  TableSkeleton,
  Td,
  Th,
} from '@/components/admin/AdminPrimitives'
import { enter, rowClass, staggerStyle } from '@/components/admin/adminUi'
import {
  ADMIN_PAGE_SIZE,
  ATTEMPT_STATUS,
  ATTEMPT_STATUS_FILTERS,
  formatDateTime,
  formatDuration,
} from '@/constants/admin'
import { adminAttemptPath } from '@/constants/routes'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { adminApi } from '@/services/adminApi'
import { cn } from '@/utils/cn'

/**
 * The attempt list (ADMIN-002, ADMIN-006; one toolbar and ten-row pages since
 * ENHANCEMENT-001B).
 *
 * Server-paged, deterministically ordered newest-started first. Every filter offered here
 * is one ADMIN-002 accepts — profile, status and a `started_at` date range — and nothing
 * else is sent: the API rejects an unknown filter rather than ignoring it. Any filter
 * change returns to page 1; the page count is the server's filtered total.
 *
 * **No mode filter.** This is an assessment system and the learner flow only creates
 * assessment attempts, so ENHANCEMENT-001B removed the Mode control and column. The API
 * still accepts `mode`; nothing was changed server-side.
 *
 * The learner lookup is the bounded ADMIN-002 `/admin/learners` search. It publishes the
 * **masked** service number only; the raw number never leaves the server.
 *
 * With one learner selected, "Export learner" (ADM-007) writes all of that learner's
 * completed attempts to one CSV or PDF.
 */

const EMPTY_FILTERS = {
  status: '',
  started_from: '',
  started_to: '',
  profile_id: '',
}

/**
 * The learner search, sized to sit in the filter toolbar. Results open in a small list
 * directly under the field; choosing one filters the table by that profile id.
 */
function LearnerSearch({ onSelect }) {
  const [term, setTerm] = useState('')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)
  const boxRef = useRef(null)

  // Escape or a click elsewhere closes the result list.
  useEffect(() => {
    if (!results) return undefined
    const onKey = (event) => { if (event.key === 'Escape') setResults(null) }
    const onClick = (event) => { if (!boxRef.current?.contains(event.target)) setResults(null) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [results])

  const search = async (event) => {
    event.preventDefault()
    const value = term.trim()
    if (value.length < 2) return

    setSearching(true)
    setError(null)
    try {
      const data = await adminApi.lookupLearners({ display_name: value, limit: 10 })
      setResults(data.learners)
    } catch (searchError) {
      setError(searchError)
    } finally {
      setSearching(false)
    }
  }

  return (
    <div ref={boxRef} className="relative min-w-0">
      <form onSubmit={search} className="flex items-end gap-2">
        <InputFilter
          id="learner-search"
          label="Find a learner by name"
          value={term}
          onChange={setTerm}
          placeholder="Learner name"
          className="flex-1"
        />
        <Button type="submit" variant="outline" className="min-h-11 shrink-0 px-3.5" loading={searching}>
          {!searching && <Search size={16} aria-hidden="true" />}
          Search
        </Button>
      </form>

      {error && <div className="mt-2"><ErrorState error={error} /></div>}

      {results && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 rounded-md border border-border bg-surface p-1 shadow-lg motion-safe:animate-admin-enter">
          {results.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-text-muted">No learner matched that name.</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {results.map((learner) => (
                <li key={learner.profile_id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(learner)
                      setResults(null)
                      setTerm('')
                    }}
                    className="flex min-h-11 w-full items-center justify-between gap-3 rounded px-3 text-left text-sm transition-colors hover:bg-secondary-soft focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
                  >
                    <span className="font-semibold">{learner.display_name}</span>
                    <span className="text-text-muted tabular-nums">{learner.service_no_masked}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export function AdminAttemptsPage() {
  useDocumentTitle('Attempts')

  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [learner, setLearner] = useState(null)
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback((signal) => {
    /**
     * No state is set synchronously here: an effect that calls setState on the way in
     * starts a second render before the request has even left. `loading` starts true and
     * is cleared by whichever branch settles; a refetch raises it from the event that
     * caused it.
     */
    return adminApi
      .listAttempts({ ...filters, page, page_size: ADMIN_PAGE_SIZE }, { signal })
      .then((result) => {
        setData(result)
        setError(null)
        setLoading(false)
      })
      .catch((requestError) => {
        if (requestError.name === 'AbortError') return
        setError(requestError)
        setLoading(false)
      })
  }, [filters, page])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const setFilter = (key) => (value) => {
    setLoading(true)
    setPage(1)
    setFilters((previous) => ({ ...previous, [key]: value }))
  }

  const selectLearner = (selected) => {
    setLoading(true)
    setLearner(selected)
    setPage(1)
    setFilters((previous) => ({ ...previous, profile_id: selected?.profile_id ?? '' }))
  }

  const clearFilters = () => {
    setLoading(true)
    setFilters(EMPTY_FILTERS)
    setLearner(null)
    setPage(1)
  }

  const filtered = Object.values(filters).some(Boolean)
  const attempts = data?.attempts ?? []

  return (
    <div className="space-y-section">
      <PageHeading
        eyebrow="Attempt viewer"
        title="Attempts"
        description="Every assessment attempt, newest first. Scores come from the same result the learner is shown — nothing is recalculated here."
      />

      <SectionCard flush className={enter} style={staggerStyle(1)}>
        <FilterBar
          className="grid-cols-2 lg:grid-cols-[minmax(15rem,1.7fr)_repeat(3,minmax(0,1fr))_auto]"
          onClear={clearFilters}
          canClear={filtered}
          label="Attempt filters"
        >
          <div className="col-span-2 lg:col-span-1">
            <LearnerSearch onSelect={selectLearner} />
          </div>
          <SelectFilter
            className="col-span-2 sm:col-span-1"
            id="filter-status"
            label="Status"
            value={filters.status}
            options={ATTEMPT_STATUS_FILTERS}
            onChange={setFilter('status')}
          />
          <InputFilter
            id="filter-from"
            label="Started from"
            type="date"
            value={filters.started_from}
            onChange={setFilter('started_from')}
          />
          <InputFilter
            id="filter-to"
            label="Started to"
            type="date"
            value={filters.started_to}
            onChange={setFilter('started_to')}
          />
        </FilterBar>

        {learner && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-primary-soft/40 px-card py-2 text-sm">
            <UserRound size={15} aria-hidden="true" className="text-primary" />
            <span>
              Showing attempts for <strong>{learner.display_name}</strong>{' '}
              <span className="text-text-muted">({learner.service_no_masked})</span>
            </span>
            <Button variant="ghost" size="sm" className="-my-1.5 ml-auto min-h-11" onClick={() => selectLearner(null)}>
              <X size={15} aria-hidden="true" />
              Clear learner
            </Button>
          </div>
        )}

        {loading && !data && !error && <TableSkeleton columns={6} label="Loading attempts" />}

        {error && (
          <div className="p-card">
            <ErrorState error={error} onRetry={() => { setLoading(true); load() }} />
          </div>
        )}

        {data && !error && attempts.length === 0 && (
          <EmptyState
            title="No attempts match these filters"
            icon={ClipboardList}
            action={filtered && (
              <Button variant="outline" size="sm" className="min-h-11" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          >
            {filtered
              ? 'Widen the date range, clear the learner, or choose a different status.'
              : 'Attempts appear here as soon as a learner starts an assessment.'}
          </EmptyState>
        )}

        {data && !error && attempts.length > 0 && (
          <>
            <TableScroll busy={loading}>
              <caption className="sr-only">Attempts matching the current filters</caption>
              <thead>
                <tr>
                  <Th>Learner</Th>
                  <Th className="hidden sm:table-cell">Service no.</Th>
                  <Th>Status</Th>
                  <Th>Score</Th>
                  <Th className="hidden md:table-cell">Scenarios</Th>
                  <Th className="hidden md:table-cell">Started</Th>
                  <Th className="hidden xl:table-cell">Duration</Th>
                  <Th><span className="sr-only">Actions</span></Th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => (
                  <tr key={attempt.attempt_id} className={rowClass}>
                    <Td className="font-semibold">{attempt.profile?.display_name ?? '—'}</Td>
                    <Td className="hidden text-text-muted tabular-nums sm:table-cell">{attempt.profile?.service_no_masked ?? '—'}</Td>
                    <Td>
                      <Pill tone={ATTEMPT_STATUS[attempt.status]?.tone}>
                        {ATTEMPT_STATUS[attempt.status]?.label ?? attempt.status}
                      </Pill>
                    </Td>
                    <Td className="tabular-nums">
                      {attempt.result_available
                        ? `${attempt.total_score} / ${attempt.max_score}`
                        : (
                          <span className="text-text-muted">
                            <span aria-hidden="true" className="sm:hidden">—</span>
                            <span className="max-sm:sr-only">Not available</span>
                          </span>
                        )}
                    </Td>
                    <Td className="hidden tabular-nums md:table-cell">
                      {attempt.scenarios_resolved} of {attempt.scenarios_total}
                    </Td>
                    <Td className="hidden whitespace-nowrap text-text-muted md:table-cell">
                      {formatDateTime(attempt.started_at)}
                    </Td>
                    <Td className="hidden whitespace-nowrap text-text-muted tabular-nums xl:table-cell">
                      {formatDuration(attempt.duration_ms)}
                    </Td>
                    <Td className="text-right">
                      <Link
                        to={adminAttemptPath(attempt.attempt_id)}
                        className={cn(
                          '-my-2 inline-flex min-h-11 items-center gap-1 rounded-md px-2 font-semibold text-primary',
                          'transition-colors hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                        )}
                      >
                        Open
                        <span className="sr-only">
                          {' '}attempt for {attempt.profile?.display_name ?? 'this learner'}
                        </span>
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableScroll>

            <Pagination
              page={data.page}
              pageSize={data.page_size ?? ADMIN_PAGE_SIZE}
              totalPages={data.total_pages}
              total={data.total}
              noun={data.total === 1 ? 'attempt' : 'attempts'}
              onChange={(next) => { setLoading(true); setPage(next) }}
              busy={loading}
            />
          </>
        )}
      </SectionCard>

      {/* ADM-007: one learner selected, so their whole record can be exported. */}
      {learner && <LearnerExportPanel learner={learner} />}
    </div>
  )
}
