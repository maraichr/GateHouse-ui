import { AlertTriangle, Info } from 'lucide-react';
import type { CoverageGap } from '../../types';

interface AttentionListProps {
  gaps: CoverageGap[];
  maxItems?: number;
}

export function AttentionList({ gaps, maxItems = 10 }: AttentionListProps) {
  const items = gaps.slice(0, maxItems);

  if (items.length === 0) {
    return (
      <p className="text-sm text-surface-500 dark:text-zinc-400 py-4 text-center">
        No attention items — looking good!
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((gap, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          {gap.severity === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
          )}
          <div>
            <span className="font-medium text-surface-700 dark:text-zinc-300">{gap.entity}</span>
            <span className="text-surface-400 dark:text-zinc-500 mx-1">&middot;</span>
            <span className="text-surface-500 dark:text-zinc-400">{gap.message}</span>
          </div>
        </li>
      ))}
      {gaps.length > maxItems && (
        <li className="text-xs text-surface-400 dark:text-zinc-500 pl-6">
          +{gaps.length - maxItems} more items
        </li>
      )}
    </ul>
  );
}
