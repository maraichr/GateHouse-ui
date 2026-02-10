import { Box, Type, ArrowRightLeft, FileText, Navigation2, Shield, Tag } from 'lucide-react';
import clsx from 'clsx';
import type { SearchEntry } from '../../utils/searchIndex';

interface SearchResultsProps {
  results: SearchEntry[];
  onSelect: (entry: SearchEntry) => void;
  query: string;
  selectedIndex?: number;
}

const typeConfig: Record<string, { icon: typeof Box; color: string; label: string }> = {
  entity: { icon: Box, color: 'text-brand-500', label: 'Entity' },
  field: { icon: Type, color: 'text-surface-500 dark:text-zinc-400', label: 'Field' },
  enum_value: { icon: Tag, color: 'text-accent-500', label: 'Enum' },
  transition: { icon: ArrowRightLeft, color: 'text-warning-500', label: 'Transition' },
  page: { icon: FileText, color: 'text-success-500', label: 'Page' },
  nav_item: { icon: Navigation2, color: 'text-info-500', label: 'Nav' },
  permission: { icon: Shield, color: 'text-danger-500', label: 'Role' },
};

export function SearchResults({ results, onSelect, query, selectedIndex = -1 }: SearchResultsProps) {
  if (!query || query.length < 2) {
    return (
      <div className="px-4 py-8 text-center text-sm text-surface-400 dark:text-zinc-500">
        Type at least 2 characters to search
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-surface-400 dark:text-zinc-500">
        No results for &ldquo;{query}&rdquo;
      </div>
    );
  }

  // Group by type
  const grouped = new Map<string, SearchEntry[]>();
  for (const entry of results) {
    const list = grouped.get(entry.type) || [];
    list.push(entry);
    grouped.set(entry.type, list);
  }

  let flatIndex = 0;

  return (
    <div className="max-h-[60vh] overflow-y-auto py-2">
      {Array.from(grouped.entries()).map(([type, entries]) => {
        const config = typeConfig[type] || { icon: Box, color: 'text-surface-500', label: type };
        const Icon = config.icon;
        return (
          <div key={type}>
            <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-surface-400 dark:text-zinc-500 font-semibold">
              {config.label}s
            </div>
            {entries.slice(0, 5).map((entry) => {
              const thisIndex = flatIndex++;
              const isSelected = thisIndex === selectedIndex;
              return (
                <button
                  key={thisIndex}
                  onClick={() => onSelect(entry)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors rounded-lg mx-0',
                    isSelected
                      ? 'bg-brand-50 dark:bg-brand-950'
                      : 'hover:bg-surface-50 dark:hover:bg-zinc-800/50',
                  )}
                >
                  <Icon className={clsx('w-4 h-4 shrink-0', config.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-surface-900 dark:text-zinc-100 truncate">{entry.label}</div>
                    <div className="text-xs text-surface-500 dark:text-zinc-400 truncate">{entry.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
