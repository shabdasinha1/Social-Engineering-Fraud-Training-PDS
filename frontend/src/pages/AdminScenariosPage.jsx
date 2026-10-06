import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileSearch, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  EmptyState,
  ErrorState,
  FilterBar,
  InlineNotice,
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
  DISPOSITION_FILTERS,
  DISPOSITION_LABELS,
  LEVEL_FILTERS,
  LEVEL_LABELS,
  LIFECYCLE,
  LIFECYCLE_FILTERS,
  PLATFORM_FILTERS,
  PLATFORM_LABELS,
  formatDateTime,
  label,
} from '@/constants/admin'
import { adminScenarioPath } from '@/constants/routes'
import { useAdminDocumentTitle } from '@/hooks/useDocumentTitle'
import { adminApi } from '@/services/adminApi'

/**
 * The scenario bank (ADMIN-001, ADMIN-006; compacted and paged at ten by ENHANCEMENT-001B).
 *
 * A bounded, SERVER-paged list with the four filters ADMIN-001 accepts. The client sends
 * only those plus `page` and `page_size`, never a sort expression and never a raw query -
 * the API refuses anything else, and the filter controls are built from closed vocabularies
 * so an invalid value cannot be typed. A filter change returns to page 1, and the page
 * count always comes from the server's filtered total.
 *
 * **The list shows classification, not content.** Platform, level, disposition and family
 * are authoring metadata an instructor needs to find a scenario; the six stages, the
 * synthetic assets, the scoring table and the evaluation block are not summarised here.
 */

const EMPTY_FILTERS = { platform: '', level: '', disposition: '', lifecycle: '' }

export function AdminScenariosPage() {
  useAdminDocumentTitle()

  const [filters, setFilters] = useState(EMPTY_FILTERS)
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
      .listScenarios({ ...filters, page, page_size: ADMIN_PAGE_SIZE }, { signal })
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

  const clearFilters = () => {
    setLoading(true)
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  const filtered = Object.values(filters).some(Boolean)
  const scenarios = data?.scenarios ?? []

  return (
    <div className="space-y-section">
      <PageHeading
        eyebrow="Scenario bank"
        title="Scenarios"
        description="Publishing and deactivation are versioned: a published version is never rewritten."
      />

      <InlineNotice icon={Info} title="Creating a brand-new scenario is not available" className={enter} style={staggerStyle(1)}>
        Ids run 01–25 per platform and all 100 are in use. Cloning an existing version into a
        new draft is the supported way to author — a recorded backend limitation, not a fault.
      </InlineNotice>

      <SectionCard flush className={enter} style={staggerStyle(2)}>
        <FilterBar
          className="grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]"
          onClear={clearFilters}
          canClear={filtered}
          label="Scenario filters"
        >
          <SelectFilter
            id="filter-platform"
            label="Platform"
            value={filters.platform}
            options={PLATFORM_FILTERS}
            onChange={setFilter('platform')}
          />
          <SelectFilter
            id="filter-level"
            label="Level"
            value={filters.level}
            options={LEVEL_FILTERS}
            onChange={setFilter('level')}
          />
          <SelectFilter
            id="filter-disposition"
            label="Disposition"
            value={filters.disposition}
            options={DISPOSITION_FILTERS}
            onChange={setFilter('disposition')}
          />
          <SelectFilter
            id="filter-lifecycle"
            label="Lifecycle"
            value={filters.lifecycle}
            options={LIFECYCLE_FILTERS}
            onChange={setFilter('lifecycle')}
          />
        </FilterBar>

        {loading && !data && !error && <TableSkeleton columns={6} label="Loading scenarios" />}

        {error && (
          <div className="p-card">
            <ErrorState error={error} onRetry={() => { setLoading(true); load() }} />
          </div>
        )}

        {data && !error && scenarios.length === 0 && (
          <EmptyState
            title="No scenarios match these filters"
            icon={FileSearch}
            action={filtered && (
              <Button variant="outline" size="sm" className="min-h-11" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          >
            Clear a filter to widen the search. The bank holds 100 scenarios in total.
          </EmptyState>
        )}

        {data && !error && scenarios.length > 0 && (
          <>
            <TableScroll busy={loading}>
              <caption className="sr-only">
                Scenarios matching the current filters, newest version first
              </caption>
              <thead>
                <tr>
                  <Th>Scenario</Th>
                  <Th>Version</Th>
                  <Th>Lifecycle</Th>
                  <Th>Platform</Th>
                  <Th>Level</Th>
                  <Th>Disposition</Th>
                  <Th className="hidden lg:table-cell">Assets</Th>
                  <Th className="hidden md:table-cell">Updated</Th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((scenario) => (
                  <tr key={scenario.id} className={rowClass}>
                    <Td>
                      <Link
                        to={adminScenarioPath(scenario.scenario_id)}
                        className="-my-2 inline-flex min-h-11 items-center font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        {scenario.scenario_id}
                      </Link>
                    </Td>
                    <Td className="tabular-nums">v{scenario.version}</Td>
                    <Td>
                      <Pill tone={LIFECYCLE[scenario.lifecycle]?.tone}>
                        {LIFECYCLE[scenario.lifecycle]?.label ?? scenario.lifecycle}
                      </Pill>
                    </Td>
                    <Td>{label(PLATFORM_LABELS, scenario.platform)}</Td>
                    <Td>{label(LEVEL_LABELS, scenario.level)}</Td>
                    <Td>{label(DISPOSITION_LABELS, scenario.disposition)}</Td>
                    <Td className="hidden tabular-nums lg:table-cell">{scenario.asset_count}</Td>
                    <Td className="hidden whitespace-nowrap text-text-muted md:table-cell">
                      {formatDateTime(scenario.updated_at)}
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
              noun={data.total === 1 ? 'scenario' : 'scenarios'}
              onChange={(next) => { setLoading(true); setPage(next) }}
              busy={loading}
            />
          </>
        )}
      </SectionCard>

      <p className="flex items-start gap-2 text-xs text-text-muted">
        <Info size={14} className="mt-px shrink-0" aria-hidden="true" />
        Scenario answer keys — the expected actions, the scoring table and the feedback block —
        are not shown in this list. Open a version to review them deliberately.
      </p>
    </div>
  )
}
