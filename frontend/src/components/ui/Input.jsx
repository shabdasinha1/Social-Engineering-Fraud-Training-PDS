import { cn } from '@/utils/cn'

/**
 * Plain text input. Use it inside <FormField> so it gets a label,
 * hint and error message.
 *
 * `tone="entry"` is the learner entry screen's treatment (ENHANCEMENT-002): a faintly
 * tinted field that lifts to white on focus, a signal-teal focus ring, and an icon that
 * takes the focus colour with the field. The default tone is unchanged, so every other
 * form in the product - the admin screens included - renders exactly as before.
 */
export function Input({ icon: Icon, invalid = false, tone = 'default', className, ...props }) {
  const entry = tone === 'entry'

  return (
    <div className={cn('relative', entry && 'group')}>
      {Icon && (
        <Icon
          size={18}
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2',
            !entry && 'text-text-muted',
            entry && 'transition-colors duration-200',
            entry && (invalid ? 'text-danger' : 'text-text-muted group-focus-within:text-signal'),
          )}
        />
      )}
      <input
        aria-invalid={invalid || undefined}
        className={cn(
          'field-ring h-12 w-full rounded-md border text-text',
          'px-3.5 text-base placeholder:text-text-muted/70',
          'focus:outline-none focus-visible:outline-none',
          Icon && 'pl-11',
          !entry && 'bg-surface',
          !entry &&
            (invalid
              ? 'border-danger focus:border-danger focus:shadow-[0_0_0_3px_var(--color-danger-soft)]'
              : 'border-border-strong focus:border-focus focus:shadow-[0_0_0_3px_var(--color-primary-soft)]'),
          entry && 'focus:bg-surface',
          entry &&
            (invalid
              ? 'border-danger bg-danger-soft/40 focus:border-danger focus:shadow-[0_0_0_4px_var(--color-danger-soft)]'
              : 'border-border-strong bg-background/70 hover:border-secondary/45 focus:border-signal focus:shadow-[0_0_0_4px_var(--color-signal-soft),0_1px_2px_rgb(16_32_54/0.06)]'),
          className,
        )}
        {...props}
      />
    </div>
  )
}
