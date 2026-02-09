import clsx from 'clsx';
import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';

interface CoverageBadgeProps {
  value: number;
  size?: 'sm' | 'md';
}

export function CoverageBadge({ value, size = 'md' }: CoverageBadgeProps) {
  const iconSize = size === 'sm' ? 14 : 16;
  const Icon = value >= 80 ? ShieldCheck : value >= 50 ? ShieldAlert : ShieldQuestion;
  const color = value >= 80 ? 'text-green-600' : value >= 50 ? 'text-amber-600' : 'text-red-600';
  const bg = value >= 80 ? 'bg-green-50' : value >= 50 ? 'bg-amber-50' : 'bg-red-50';

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
