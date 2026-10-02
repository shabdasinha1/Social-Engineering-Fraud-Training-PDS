import { useCallback, useEffect, useState } from 'react'
import { Lock, ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  EmptyState,
  ErrorState,
  FilterBar,
  InlineNotice,
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
  AUDIT_ACTION_FILTERS,
  AUDIT_ACTION_LABELS,
  AUDIT_RESOURCE_LABELS,
  formatDateTime,
  label,
} from '@/constants/admin'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { adminApi } from '@/services/adminApi'

/**
 * The append-only change log (ADMIN-005, ADMIN-006; ten-row server pages since
 * ENHANCEMENT-001B, because an append-only log only ever grows).
 *
 * ADMIN-005 already exposes a read route — `GET /api/admin/audit` — with its own safe
 * projection, so this screen consumes that and adds nothing. No new audit API was created
 * for this task and the `AuditEvent` model is never touched directly.
 *
 * **There are no controls here.** No edit, no delete, no "clear log", not even a disabled
 * one. The log is append-only server-side by four independent mechanisms, and a UI that
 * offered a mutation an instructor could not perform would misrepresent the guarantee that
 * makes it evidence.
 *
 * Entries record administrative CHANGES only — publications, resets, archives, exports and
 * configuration changes. Reading a scenario or opening an attempt is not a change and
 * writes nothing, which is why browsing does not fill this table with noise.
 */

const EMPTY_FILTERS = { action: '', from: '', to: '' }

/** Renders the entry's metadata as short labelled facts. Values are scalars by contract. */
function MetadataCell({ metadata }) {
  const entries = Object.entries(metadata ?? {})
  if (!entries.length) return <span className="text-text-muted">—</span>

  return (
    <ul className="space-y-0.5">
      {entries.map(([key, value]) => (
        <li key={key} className="whitespace-nowrap">
          <span className="text-text-muted">{key.replace(/_/g, ' ')}:</span>{' '}
          <span className="font-medium">{String(value)}</span>
        </li>
      ))}
    </ul>
  )
}

export function AdminAuditPage() {
  useDocumentTitle('Audit log')

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
      .listAuditEvents({ ...filters, page, page_size: ADMIN_PAGE_SIZE }, { signal })
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
  const entries = data?.entries ?? []

  return (
    <div className="space-y-section">
      <PageHeading
        eyebrow="Governance"
        title="Audit log"
        description="Every administrative change, newest first. Entries can be read but never edited or removed."
      />

      <InlineNotice icon={Lock} title="Append-only" className={enter} style={staggerStyle(1)}>
        Records scenario publications and deactivations, attempt resets, profile archives,
        exports and configuration changes — not ordinary reading, and never anything a
        learner did inside the simulation.
      </InlineNotice>

      <SectionCard flush className={enter} style={staggerStyle(2)}>
        <FilterBar
          className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))_auto]"
          onClear={clearFilters}
          canClear={filtered}
          label="Audit filters"
        >
          <SelectFilter
            className="col-span-2 sm:col-span-1"
            id="audit-action"
            label="Action"
            value={filters.action}
            options={AUDIT_ACTION_FILTERS}
            onChange={setFilter('action')}
          />
          <InputFilter
            id="audit-from"
            label="From"
            type="date"
            value={filters.from}
            onChange={setFilter('from')}
          />
          <InputFilter
            id="audit-to"
            label="To"
            type="date"
            value={filters.to}
            onChange={setFilter('to')}
          />
        </FilterBar>

        {loading && !data && !error && <TableSkeleton columns={5} label="Loading the audit log" />}

        {error && (
          <div className="p-card">
            <ErrorState error={error} onRetry={() => { setLoading(true); load() }} />
          </div>
        )}

        {data && !error && entries.length === 0 && (
          <EmptyState
            title={filtered ? 'No entries match these filters' : 'No entries yet'}
            icon={ScrollText}
            action={filtered && (
              <Button variant="outline" size="sm" className="min-h-11" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          >
            {filtered
              ? 'Choose a different action or widen the date range.'
              : 'Nothing has been published, reset, archived, exported or reconfigured on this installation.'}
          </EmptyState>
        )}

        {data && !error && entries.length > 0 && (
          <>
            <TableScroll busy={loading}>
              <caption className="sr-only">Administrative changes, newest first</caption>
              <thead>
                <tr>
                  <Th>When (UTC)</Th>
                  <Th>Action</Th>
                  <Th className="hidden md:table-cell">Resource</Th>
                  <Th className="hidden 2xl:table-cell">Identifier</Th>
                  <Th>By</Th>
                  <Th>Outcome</Th>
                  <Th className="hidden lg:table-cell">Details</Th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.audit_id} className={rowClass}>
                    <Td className="whitespace-nowrap text-text-muted tabular-nums">
                      {formatDateTime(entry.occurred_at)}
                    </Td>
                    <Td className="font-semibold">
                      {label(AUDIT_ACTION_LABELS, entry.action)}
                    </Td>
                    <Td className="hidden md:table-cell">{label(AUDIT_RESOURCE_LABELS, entry.resource_type)}</Td>
                    <Td className="hidden font-mono text-xs 2xl:table-cell">{entry.resource_id}</Td>
                    <Td>{entry.actor_username}</Td>
                    <Td>
                      {entry.status === 'succeeded'
                        ? <Pill tone="bg-success-soft text-success ring-success/25">Succeeded</Pill>
                        : <Pill tone="bg-danger-soft text-danger ring-danger/25">{`Failed — ${entry.error_code ?? 'unknown'}`}</Pill>}
                    </Td>
                    <Td className="hidden text-xs lg:table-cell">
                      <MetadataCell metadata={entry.metadata} />
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
              noun={data.total === 1 ? 'entry' : 'entries'}
              onChange={(next) => { setLoading(true); setPage(next) }}
              busy={loading}
            />
          </>
        )}
      </SectionCard>
    </div>
  )
}
