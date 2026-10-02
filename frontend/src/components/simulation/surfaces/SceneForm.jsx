import { FIELD_KIND } from '@/simulation/sceneModel'
import { displayValue } from '@/simulation/localForm'
import { cn } from '@/utils/cn'

/**
 * The only place in the simulation where a learner types (IMMERSIVE-003A-R2).
 *
 * The client asked for forms that are genuinely interactive, because a page that shows
 * what it *would* ask for teaches nothing about the moment of handing it over. So these
 * are real inputs, and the learner really does fill them in.
 *
 * Everything that makes that safe is in this file, in one place, so it can be read and
 * checked in one sitting:
 *
 * 1. **The value lives here and nowhere else.** `useLocalForm` holds it in `useState`
 *    inside the surface component. It is never lifted, never passed to an affordance,
 *    never put in metadata, never written to storage and never sent anywhere. The engine's
 *    own `METADATA_ALLOWLIST` would reject it server-side even if something tried.
 * 2. **It is ephemeral.** Leaving the screen unmounts the component and the state is gone.
 *    A reload rebuilds the run from the stage the server committed and the fields are
 *    empty, which is the correct behaviour: what the learner typed was never a decision,
 *    only the press that followed it was.
 * 3. **Nothing autofills and nothing is offered for saving.** Every input is
 *    `type="text"` with `autoComplete="off"` and a meaningless `name`, so no browser or
 *    password manager recognises it as a card or credential field. Secret fields are
 *    masked by CSS rather than by `type="password"`, for the same reason.
 * 4. **There is no `<form>`.** No action, no method, no submit event, nothing that could
 *    navigate. The control that commits the decision is an ordinary button carrying a
 *    scene affordance.
 * 5. **Validation is local and deterministic.** A field is satisfied when it holds the
 *    number of characters it asks for. Same input, same result, every time.
 *
 * The state itself and the formatting rules are in `simulation/localForm.js`, so that the
 * promise above is one small module rather than a habit spread across renderers.
 */

/**
 * One field.
 *
 * `index` becomes the input's `name`, which is deliberately meaningless: a field called
 * `f3` is not something a password manager or an autofill heuristic will recognise as a
 * card number, however it is labelled on screen.
 */
export function SceneField({ field, index, value = '', touched = false, onChange, onBlur, disabled }) {
  const id = `scene-field-${index}`
  const short = touched && value.length > 0 && value.length < field.length
  const secret = field.kind === FIELD_KIND.SECRET || field.kind === FIELD_KIND.MASKED
  const textual = field.kind === FIELD_KIND.TEXT || field.kind === FIELD_KIND.MASKED

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-[0.72rem] font-semibold text-text-muted">
        {field.label}
      </label>
      <input
        id={id}
        name={`f${index}`}
        type="text"
        inputMode={textual ? 'text' : 'numeric'}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="next"
        disabled={disabled}
        value={displayValue(field, value)}
        placeholder={field.placeholder ?? ''}
        aria-describedby={field.hint || short ? `${id}-hint` : undefined}
        aria-invalid={short || undefined}
        onChange={(event) => onChange(field, event.target.value)}
        onBlur={() => onBlur?.(field)}
        /**
         * Masking is CSS, not `type="password"`. The value stays exactly where it was -
         * in this component - and no credential manager takes an interest in a text field.
         */
        style={secret ? { WebkitTextSecurity: 'disc', textSecurity: 'disc' } : undefined}
        className={cn(
          'field-ring mt-1 min-h-11 w-full rounded-md border bg-surface px-3 text-[0.85rem]',
          'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-focus',
          'disabled:opacity-55',
          secret && 'tracking-[0.3em]',
          short ? 'border-danger' : 'border-border-strong',
        )}
      />
      {(field.hint || short) && (
        <p
          id={`${id}-hint`}
          className={cn('mt-1 text-[0.68rem]', short ? 'text-danger' : 'text-text-muted')}
        >
          {short ? `Enter ${field.length} characters.` : field.hint}
        </p>
      )}
    </div>
  )
}

/**
 * A group of fields with a heading, as a page declares it.
 *
 * A `<fieldset>` rather than a `<form>`: it groups and labels, and it cannot submit.
 */
export function SceneFieldset({ block, form, disabled, startIndex = 0 }) {
  return (
    <fieldset className="mt-3 min-w-0 rounded-md border border-border bg-surface p-3">
      {block.heading && (
        <legend className="px-1 text-[0.72rem] font-bold tracking-wide text-text-muted uppercase">
          {block.heading}
        </legend>
      )}
      <div className={cn('grid gap-3', block.columns === 2 && 'sm:grid-cols-2')}>
        {block.fields.map((field, offset) => (
          <SceneField
            key={field.name}
            field={field}
            index={startIndex + offset}
            value={form.values[field.name] ?? ''}
            touched={Boolean(form.touched[field.name])}
            onChange={form.set}
            onBlur={form.touch}
            disabled={disabled}
          />
        ))}
      </div>
      {block.note && (
        <p className="mt-2.5 text-[0.7rem] text-text-muted text-balance-pretty">{block.note}</p>
      )}
    </fieldset>
  )
}

/**
 * The same form, shown rather than offered.
 *
 * The engine accepts exactly one intent per stage, so a learner who has already spent
 * their decision - by opening the link, say - can still walk the page but can no longer
 * submit it. Leaving live fields there would be a dead end: something to fill in with
 * nothing to press. So the page states what it asks for instead, which is what the
 * previous build did everywhere and is still the honest thing to show here.
 */
export function SceneFieldList({ block }) {
  return (
    <fieldset className="mt-3 min-w-0 rounded-md border border-border bg-surface p-3">
      {block.heading && (
        <legend className="px-1 text-[0.72rem] font-bold tracking-wide text-text-muted uppercase">
          {block.heading}
        </legend>
      )}
      <ul className="space-y-2">
        {block.fields.map((item) => (
          <li
            key={item.name}
            className="rounded-md border border-dashed border-border-strong px-3 py-2 text-[0.8rem] text-text-muted"
          >
            {item.label}
          </li>
        ))}
      </ul>
    </fieldset>
  )
}
