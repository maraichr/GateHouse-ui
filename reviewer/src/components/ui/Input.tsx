import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, iconRight, className, id, ...props },
  ref,
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-surface-700 dark:text-zinc-300">
          {label}
          {props.required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-surface-400 dark:text-zinc-500">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          className={clsx(
            'w-full rounded-lg border bg-white text-sm transition-colors',
            'placeholder:text-surface-400 dark:placeholder:text-zinc-500',
            'dark:bg-zinc-900 dark:text-zinc-100',
            error
              ? 'border-danger-300 focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 dark:border-danger-700'
              : 'border-surface-300 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:border-zinc-700 dark:focus:border-brand-500',
            'focus:outline-none',
            icon ? 'pl-10' : 'pl-3',
            iconRight ? 'pr-10' : 'pr-3',
            'py-2',
            className,
          )}
          {...props}
        />
        {iconRight && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-surface-400 dark:text-zinc-500">
            {iconRight}
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-xs text-danger-600 dark:text-danger-400" role="alert">{error}</p>
      )}
      {hint && !error && (
        <p id={hintId} className="text-xs text-surface-500 dark:text-zinc-400">{hint}</p>
      )}
    </div>
  );
});
