import { forwardRef, type SelectHTMLAttributes } from 'react';
import clsx from 'clsx';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, options, placeholder, className, id, ...props },
  ref,
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-surface-700 dark:text-zinc-300">
          {label}
          {props.required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={errorId}
        className={clsx(
          'w-full rounded-lg border bg-white text-sm transition-colors py-2 pl-3 pr-8',
          'dark:bg-zinc-900 dark:text-zinc-100',
          error
            ? 'border-danger-300 focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 dark:border-danger-700'
            : 'border-surface-300 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:border-zinc-700 dark:focus:border-brand-500',
          'focus:outline-none',
          className,
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="text-xs text-danger-600 dark:text-danger-400" role="alert">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-surface-500 dark:text-zinc-400">{hint}</p>
      )}
    </div>
  );
});
