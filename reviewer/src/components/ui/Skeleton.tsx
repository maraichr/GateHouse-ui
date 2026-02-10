import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}

export function Skeleton({ className, variant = 'text', width, height, style }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'bg-surface-200 dark:bg-zinc-800 skeleton-shimmer',
        variant === 'text' && 'h-4 rounded',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-lg',
        className,
      )}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('surface-card p-5 space-y-3', className)}>
      <Skeleton width="60%" className="h-5" />
      <Skeleton width="40%" />
      <div className="pt-2 flex gap-2">
        <Skeleton width={64} className="h-6 rounded-full" />
        <Skeleton width={48} className="h-6 rounded-full" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={clsx('surface-card overflow-hidden', className)}>
      <div className="border-b border-surface-200 dark:border-zinc-800 px-4 py-3 flex gap-4">
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} className="h-3" style={{ width: `${60 + Math.random() * 80}px` }} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="border-b border-surface-100 dark:border-zinc-800/50 px-4 py-3 flex gap-4">
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} className="h-4" style={{ width: `${40 + Math.random() * 100}px` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={clsx('grid gap-4', className)} style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="surface-card p-5 space-y-2">
          <Skeleton width="40%" className="h-3" />
          <Skeleton width="30%" className="h-8" />
        </div>
      ))}
    </div>
  );
}
