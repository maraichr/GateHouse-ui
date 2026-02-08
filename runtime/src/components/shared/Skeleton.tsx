import { cn } from '../../utils/cn';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({ variant = 'text', width, height, className }: SkeletonProps) {
  const baseClass = 'skeleton-shimmer';

  const variantClass =
    variant === 'circular'
      ? 'rounded-full'
      : variant === 'rectangular'
        ? 'rounded-lg'
        : 'rounded h-4';

  return (
    <div
      aria-hidden="true"
      className={cn(baseClass, variantClass, className)}
      style={{
        width: width ?? (variant === 'circular' ? '40px' : '100%'),
        height: height ?? (variant === 'circular' ? '40px' : variant === 'text' ? '16px' : undefined),
      }}
    />
  );
}

/** Pre-built skeleton for a data table with N rows and M columns */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div aria-hidden="true" className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} width={`${60 + Math.random() * 40}%`} height={12} className="flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-4 py-3 flex gap-4 border-t border-gray-100">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} width={`${50 + Math.random() * 50}%`} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Pre-built skeleton for an entity detail header + tabs */
export function DetailSkeleton() {
  return (
    <div aria-hidden="true" className="animate-fadeIn">
      {/* Header area */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" width={64} height={64} />
          <div className="flex-1 space-y-2">
            <Skeleton width="40%" height={20} />
            <Skeleton width="30%" height={14} />
          </div>
        </div>
      </div>
      {/* Tab bar */}
      <div className="border-b border-gray-200 px-6 py-3 flex gap-6">
        <Skeleton width={60} height={14} />
        <Skeleton width={80} height={14} />
        <Skeleton width={70} height={14} />
      </div>
      {/* Content - 2x2 grid of label/value pairs */}
      <div className="p-6 grid grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton width="30%" height={12} />
            <Skeleton width="70%" height={16} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Pre-built skeleton for stat cards */
export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
          <Skeleton width="60%" height={12} />
          <Skeleton width="40%" height={24} className="mt-2" />
        </div>
      ))}
    </div>
  );
}
