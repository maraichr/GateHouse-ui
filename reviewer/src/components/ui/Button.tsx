import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

type ButtonVariant = 'filled' | 'outlined' | 'ghost' | 'soft';
type ButtonColor = 'primary' | 'danger' | 'success' | 'warning' | 'neutral';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

const colorMap: Record<ButtonColor, Record<ButtonVariant, string>> = {
  primary: {
    filled: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 dark:bg-brand-500 dark:hover:bg-brand-600',
    outlined: 'border border-brand-300 text-brand-700 hover:bg-brand-50 dark:border-brand-700 dark:text-brand-400 dark:hover:bg-brand-950',
    ghost: 'text-brand-700 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950',
    soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-400 dark:hover:bg-brand-900',
  },
  danger: {
    filled: 'bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800',
    outlined: 'border border-danger-300 text-danger-700 hover:bg-danger-50 dark:border-danger-700 dark:text-danger-400 dark:hover:bg-danger-950',
    ghost: 'text-danger-700 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-950',
    soft: 'bg-danger-50 text-danger-700 hover:bg-danger-100 dark:bg-danger-950 dark:text-danger-400 dark:hover:bg-danger-900',
  },
  success: {
    filled: 'bg-success-600 text-white hover:bg-success-700 active:bg-success-800',
    outlined: 'border border-success-300 text-success-700 hover:bg-success-50 dark:border-success-700 dark:text-success-400 dark:hover:bg-success-950',
    ghost: 'text-success-700 hover:bg-success-50 dark:text-success-400 dark:hover:bg-success-950',
    soft: 'bg-success-50 text-success-700 hover:bg-success-100 dark:bg-success-950 dark:text-success-400 dark:hover:bg-success-900',
  },
  warning: {
    filled: 'bg-warning-600 text-white hover:bg-warning-700 active:bg-warning-800',
    outlined: 'border border-warning-300 text-warning-700 hover:bg-warning-50 dark:border-warning-700 dark:text-warning-400 dark:hover:bg-warning-950',
    ghost: 'text-warning-700 hover:bg-warning-50 dark:text-warning-400 dark:hover:bg-warning-950',
    soft: 'bg-warning-50 text-warning-700 hover:bg-warning-100 dark:bg-warning-950 dark:text-warning-400 dark:hover:bg-warning-900',
  },
  neutral: {
    filled: 'bg-surface-800 text-white hover:bg-surface-900 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-100',
    outlined: 'border border-surface-300 text-surface-700 hover:bg-surface-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800',
    ghost: 'text-surface-700 hover:bg-surface-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
    soft: 'bg-surface-100 text-surface-700 hover:bg-surface-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700',
  },
};

const sizeMap: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1 text-xs gap-1.5 rounded-lg',
  md: 'px-3.5 py-2 text-sm gap-2 rounded-lg',
  lg: 'px-5 py-2.5 text-sm gap-2.5 rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'filled', color = 'primary', size = 'md', loading, icon, iconRight, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
        colorMap[color][variant],
        sizeMap[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
      {iconRight}
    </button>
  );
});
