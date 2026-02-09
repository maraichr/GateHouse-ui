import { Box, Type, ArrowRightLeft, FileText, Navigation2, Shield, Tag } from 'lucide-react';
import type { SearchEntry } from '../../utils/searchIndex';

interface SearchResultsProps {
  results: SearchEntry[];
  onSelect: (entry: SearchEntry) => void;
  query: string;
}

const typeConfig: Record<string, { icon: typeof Box; color: string; label: string }> = {
  entity: { icon: Box, color: 'text-blue-500', label: 'Entity' },
  field: { icon: Type, color: 'text-gray-500', label: 'Field' },
  enum_value: { icon: Tag, color: 'text-purple-500', label: 'Enum' },
  transition: { icon: ArrowRightLeft, color: 'text-amber-500', label: 'Transition' },
  page: { icon: FileText, color: 'text-green-500', label: 'Page' },
  nav_item: { icon: Navigation2, color: 'text-indigo-500', label: 'Nav' },
  permission: { icon: Shield, color: 'text-red-500', label: 'Role' },
};

export function SearchResults({ results, onSelect, query }: SearchResultsProps) {
  if (!query || query.length < 2) {
    return (
      <div className="px-4 py-8 text-center text-sm text-gray-400">
        Type at least 2 characters to search
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-gray-400">
        No results for "{query}"
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

  return (
    <div className="max-h-[60vh] overflow-y-auto py-2">
      {Array.from(grouped.entries()).map(([type, entries]) => {
        const config = typeConfig[type] || { icon: Box, color: 'text-gray-500', label: type };
        const Icon = config.icon;
        return (
          <div key={type}>
            <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-gray-400 font-medium">
              {config.label}s
            </div>
            {entries.slice(0, 5).map((entry, i) => (
              <button
                key={i}
                onClick={() => onSelect(entry)}
                className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
              >
                <Icon className={`w-4 h-4 shrink-0 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900 truncate">{entry.label}</div>
                  <div className="text-xs text-gray-500 truncate">{entry.description}</div>
                </div>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}
