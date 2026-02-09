import clsx from 'clsx';

interface CoverageBarProps {
  value: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

function barColor(v: number): string {
  if (v >= 80) return 'bg-green-500';
  if (v >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

export function CoverageBar({ value, size = 'md', showLabel = true }: CoverageBarProps) {
  const h = size === 'sm' ? 'h-1.5' : 'h-2.5';
  return (
    <div className="flex items-center gap-2">
      <div className={clsx('flex-1 rounded-full bg-gray-200', h)}>
        <div
          className={clsx('rounded-full transition-all', h, barColor(value))}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-gray-600 tabular-nums w-10 text-right">
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}
