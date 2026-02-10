import clsx from 'clsx';

type BadgeVariant = 'soft' | 'solid' | 'outline';

const colorMap: Record<string, Record<BadgeVariant, string>> = {
  gray: {
    soft: 'bg-surface-100 text-surface-700 dark:bg-zinc-800 dark:text-zinc-300',
    solid: 'bg-surface-600 text-white dark:bg-zinc-500',
    outline: 'border border-surface-300 text-surface-600 dark:border-zinc-600 dark:text-zinc-400',
  },
  blue: {
    soft: 'bg-info-50 text-info-700 dark:bg-info-950 dark:text-info-400',
    solid: 'bg-info-600 text-white',
    outline: 'border border-info-300 text-info-700 dark:border-info-700 dark:text-info-400',
  },
  green: {
    soft: 'bg-success-50 text-success-700 dark:bg-success-950 dark:text-success-400',
    solid: 'bg-success-600 text-white',
    outline: 'border border-success-300 text-success-700 dark:border-success-700 dark:text-success-400',
  },
  amber: {
    soft: 'bg-warning-50 text-warning-700 dark:bg-warning-950 dark:text-warning-400',
    solid: 'bg-warning-600 text-white',
    outline: 'border border-warning-300 text-warning-700 dark:border-warning-700 dark:text-warning-400',
  },
  red: {
    soft: 'bg-danger-50 text-danger-700 dark:bg-danger-950 dark:text-danger-400',
    solid: 'bg-danger-600 text-white',
    outline: 'border border-danger-300 text-danger-700 dark:border-danger-700 dark:text-danger-400',
  },
  purple: {
    soft: 'bg-accent-50 text-accent-700 dark:bg-accent-950 dark:text-accent-400',
    solid: 'bg-accent-600 text-white',
    outline: 'border border-accent-300 text-accent-700 dark:border-accent-700 dark:text-accent-400',
  },
  indigo: {
    soft: 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-400',
    solid: 'bg-brand-600 text-white',
    outline: 'border border-brand-300 text-brand-700 dark:border-brand-700 dark:text-brand-400',
  },
};

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, color = 'gray', variant = 'soft', className }: BadgeProps) {
  const colors = colorMap[color] || colorMap.gray;
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        colors[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
