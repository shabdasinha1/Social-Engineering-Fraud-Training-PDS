import { Target } from 'lucide-react'

/**
 * The section 7 practice recommendations (UI-003).
 *
 * RESULT-001 returns families, not scenario ids, and this renders exactly that. The
 * wording is deliberately about the material, never the person: "area to strengthen", not
 * "you are vulnerable to". Nothing here diagnoses a trait, a susceptibility or an
 * emotional state, and the server's own `reason` strings are written the same way.
 *
 * There is no practice mode yet, so a recommendation says what to practise - it does not
 * link anywhere. How many bank scenarios exist is not shown to the learner.
 */
export function RemediationList({ remediation }) {
  if (!remediation?.length) {
    return (
      <section
        aria-labelledby="remediation-heading"
        className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8"
      >
        <h2 id="remediation-heading" className="text-lg font-bold">
          Recommended practice
        </h2>
        <p className="mt-2 text-balance-pretty text-text-muted">
          Nothing stood out as needing focused practice from this attempt.
        </p>
      </section>
    )
  }

  return (
    <section
      aria-labelledby="remediation-heading"
      className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      <h2 id="remediation-heading" className="text-lg font-bold">
        Recommended practice
      </h2>
      <p className="mt-1 text-sm text-balance-pretty text-text-muted">
        Areas to strengthen, based on where marks were lost in this attempt.
      </p>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {remediation.map((item) => (
          <li
            key={item.family_key}
            className="rounded-md border border-border bg-surface p-4"
          >
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-md bg-primary-soft text-primary"
            >
              <Target size={17} />
            </span>

            <h3 className="mt-2.5 text-sm font-bold text-balance-pretty">{item.label}</h3>
            <p className="mt-1 text-sm text-balance-pretty text-text-muted">{item.reason}</p>

            <p className="mt-3 border-t border-border pt-2.5 text-xs text-text-muted">
              <span className="font-semibold tabular-nums">
                {item.points}/{item.max_points}
              </span>{' '}
              in this attempt
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
