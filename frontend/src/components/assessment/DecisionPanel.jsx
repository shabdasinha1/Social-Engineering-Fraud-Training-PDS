import { cn } from '@/utils/cn'

function OptionGroup({ name, legend, hint, options, value, onChange, columns = 1 }) {
  return (
    <fieldset>
      <legend className="font-semibold">{legend}</legend>
      {hint && <p className="mt-0.5 text-sm text-text-muted">{hint}</p>}

      <div
        className={cn(
          'mt-3 grid gap-2.5',
          columns === 2 && 'grid-cols-2',
          columns === 3 && 'sm:grid-cols-3',
        )}
      >
        {options.map((option) => {
          const selected = value === option.value

          return (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-md border p-3.5',
                'transition-[border-color,background-color,box-shadow] duration-200',
                'has-[:focus-visible]:outline has-[:focus-visible]:outline-2',
                'has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
                selected
                  ? 'border-primary bg-primary-soft shadow-xs'
                  : 'border-border-strong bg-surface hover:border-primary/50 hover:bg-secondary-soft',
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="size-4 shrink-0 accent-[var(--color-primary)] focus:outline-none"
              />
              <span
                className={cn(
                  'text-balance-pretty',
                  selected ? 'font-semibold text-primary' : 'text-text',
                )}
              >
                {option.label}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/**
 * The three parts of an answer set out in the proposal: judgement, action and
 * reason. The action and reason lists are supplied per scenario - the shell
 * passes mock lists until the question engine exists.
 */
export function DecisionPanel({
  answer,
  onChange,
  judgementOptions,
  actionOptions,
  reasonOptions,
}) {
  const set = (field) => (value) => onChange({ ...answer, [field]: value })

  return (
    <div className="space-y-7">
      <OptionGroup
        name="judgement"
        legend="What is this message?"
        hint="Choose genuine, fraud, or needs checking."
        options={judgementOptions}
        value={answer.judgement}
        onChange={set('judgement')}
        columns={3}
      />

      <OptionGroup
        name="action"
        legend="What would you do?"
        hint="Choose the safest action."
        options={actionOptions}
        value={answer.action}
        onChange={set('action')}
      />

      <OptionGroup
        name="reason"
        legend="Why did you choose that?"
        options={reasonOptions}
        value={answer.reason}
        onChange={set('reason')}
      />
    </div>
  )
}
