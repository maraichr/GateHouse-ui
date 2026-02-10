import { useState, useEffect } from 'react';
import clsx from 'clsx';

interface CoverageBarProps {
  value: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

function barGradient(v: number): string {
  if (v >= 80) return 'bg-gradient-to-r from-success-500 to-success-400';
  if (v >= 50) return 'bg-gradient-to-r from-warning-500 to-warning-400';
  return 'bg-gradient-to-r from-danger-500 to-danger-400';
}

export function CoverageBar({ value, size = 'md', showLabel = true }: CoverageBarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Delay to trigger CSS transition from 0 → actual width
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const h = size === 'sm' ? 'h-1.5' : 'h-2.5';
  const width = mounted ? Math.min(value, 100) : 0;

  return (
    <div className="flex items-center gap-2">
      <div className={clsx('flex-1 rounded-full bg-surface-200 dark:bg-zinc-800 overflow-hidden', h)}>
        <div
          className={clsx('rounded-full transition-all duration-700 ease-out', h, barGradient(value))}
          style={{ width: `${width}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-surface-600 dark:text-zinc-400 tabular-nums w-10 text-right">
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}
