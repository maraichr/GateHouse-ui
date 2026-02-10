import clsx from 'clsx';
import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';

interface CoverageBadgeProps {
  value: number;
  size?: 'sm' | 'md';
}

export function CoverageBadge({ value, size = 'md' }: CoverageBadgeProps) {
  const iconSize = size === 'sm' ? 14 : 16;
  const Icon = value >= 80 ? ShieldCheck : value >= 50 ? ShieldAlert : ShieldQuestion;
  const color = value >= 80
    ? 'text-success-700 dark:text-success-400'
    : value >= 50
    ? 'text-warning-700 dark:text-warning-400'
    : 'text-danger-700 dark:text-danger-400';
  const bg = value >= 80
    ? 'bg-success-50 dark:bg-success-950'
    : value >= 50
    ? 'bg-warning-50 dark:bg-warning-950'
    : 'bg-danger-50 dark:bg-danger-950';

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium',
        color,
        bg,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
      )}
    >
      <Icon size={iconSize} />
      {Math.round(value)}%
    </span>
  );
}
