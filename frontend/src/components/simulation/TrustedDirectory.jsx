import { useId, useMemo, useState } from 'react'
import { BookLock, MessageSquareWarning, Search } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ASSET_KIND, assetsOfKind } from '@/constants/simulation'

/**
 * The Trusted Directory overlay (client specification section 4).
 *
 * The containment rule is the whole point of this component: **numbers and links inside
 * the suspect message can never populate a trusted result.** Results come from one place
 * and one place only - the scenario's own `trusted_directory_entry` assets - and the
 * search box filters that list. Typing cannot create an entry, and the message's contact
 * details are never searched, matched or offered as a result.
 *
 * The sender's details are still shown, because the specification asks the learner to
 * compare them - but in a separate, explicitly labelled panel that is not a result and
 * carries no provenance.
 */
export function TrustedDirectory({
  open, scenario, extraEntries = null, messageSender = null, onClose, children,
}) {
  const [query, setQuery] = useState('')
  const searchId = useId()

  /**
   * Results come from the scenario's own directory assets, plus any additional approved
   * rows the authored scene supplies (IMMERSIVE-003A).
   *
   * The containment rule is unchanged and is what matters here: an entry exists because
   * the scenario or its scene declared it as an approved local record, never because it
   * appeared in the suspect message and never because the learner typed it. A scene entry
   * carries the same provenance line as every other row.
   */
  const entries = useMemo(() => [
    ...assetsOfKind(scenario, ASSET_KIND.DIRECTORY),
    ...(extraEntries ?? []).map((entry) => ({
      asset_id: entry.id,
      kind: ASSET_KIND.DIRECTORY,
      content: {
        name: entry.name,
        identifier: entry.identifier,
        provenance: entry.provenance,
        role: entry.role ?? null,
      },
    })),
  ], [scenario, extraEntries])
  /**
   * The details to compare against. An authored scene may state the identity the message
   * actually shows (IMMERSIVE-004A: an Instagram handle from the client's sentence) where the
   * bank's generated sender is a placeholder. Still never a result, still no provenance.
   */
  const sender = messageSender ?? scenario?.synthetic?.sender ?? null

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return entries
    return entries.filter((entry) => {
      const { name = '', identifier = '' } = entry.content ?? {}
      return `${name} ${identifier}`.toLowerCase().includes(needle)
    })
  }, [entries, query])

  return (
    <Modal
      open={open}
      contained
      title="Trusted directory"
      description="Official contacts held locally on this device."
      onClose={onClose}
    >
      <label htmlFor={searchId} className="text-sm font-semibold">
        Search official contacts
      </label>
      <div className="mt-1.5 flex items-center gap-2 rounded-md border border-border-strong bg-surface px-3 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus">
        <Search size={15} aria-hidden="true" className="shrink-0 text-text-muted" />
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name or number"
          autoComplete="off"
          className="min-h-11 w-full bg-transparent text-sm focus:outline-none"
        />
      </div>

      <h3 className="mt-4 text-sm font-bold">
        Directory results
        <span className="ml-1.5 font-normal text-text-muted tabular-nums">({results.length})</span>
      </h3>

      {results.length === 0 ? (
        <p className="mt-2 rounded-md border border-dashed border-border-strong p-3 text-sm text-text-muted">
          No official contact matches that search. Nothing you type is added to the directory.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {results.map((entry) => {
            const { name, identifier, provenance, role } = entry.content ?? {}
            return (
              <li
                key={entry.asset_id}
                className="rounded-md border border-border bg-surface p-3"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="grid size-8 shrink-0 place-items-center rounded-md bg-success-soft text-success"
                  >
                    <BookLock size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold break-words">{name}</p>
                    <p className="text-sm text-text-muted tabular-nums">{identifier}</p>
                    {role && <p className="text-xs text-text-muted">{role}</p>}
                    {provenance && (
                      <p className="mt-1 text-xs font-medium text-text-muted">
                        Source: {provenance}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {sender && (
        <section className="mt-5 rounded-md border border-warning/30 bg-warning-soft p-3">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-warning">
            <MessageSquareWarning size={15} aria-hidden="true" />
            Details taken from the message
          </h3>
          <p className="mt-1 text-xs text-warning">
            Shown only so you can compare. This is not a directory entry and has no source.
          </p>
          <p className="mt-2 text-sm font-semibold break-words">{sender.display_name}</p>
          <p className="text-sm break-words tabular-nums">{sender.identifier}</p>
        </section>
      )}

      {children && <div className="mt-5 border-t border-border pt-4">{children}</div>}
    </Modal>
  )
}
