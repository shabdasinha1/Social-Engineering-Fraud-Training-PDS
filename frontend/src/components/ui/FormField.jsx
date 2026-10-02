import { AlertCircle } from 'lucide-react'

/**
 * Label + hint + error wrapper. Children receive the ids they need through
 * the render props so the field stays accessible.
 */
export function FormField({ id, label, hint, error, required = false, children }) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-text">
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>

      {children({ id, describedBy: [hintId, errorId].filter(Boolean).join(' ') || undefined })}

      {hint && !error && (
        <p id={hintId} className="text-sm text-text-muted">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-sm font-medium text-danger"
        >
          <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}
