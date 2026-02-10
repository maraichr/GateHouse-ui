import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { useSpec } from '../../hooks/useSpec';
import { useComposedSpec } from '../../hooks/useComposition';
import { buildSearchIndex, searchEntries } from '../../utils/searchIndex';
import { SearchResults } from './SearchResults';
import type { AppSpec } from '../../types';

export function GlobalSearch() {
  const { specId, compId } = useParams<{ specId?: string; compId?: string }>();
  const { data: specData } = useSpec(specId);
  const { data: composedData } = useComposedSpec(compId);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine the base path for navigation
  const basePath = compId ? `/projects/${compId}` : specId ? `/specs/${specId}` : null;

  const appSpec: AppSpec | null = useMemo(() => {
    // Prefer composed spec if available
    if (composedData?.composed_spec) return composedData.composed_spec;
    const sv = specData?.latest_version;
    if (!sv?.spec_data) return null;
    return typeof sv.spec_data === 'string' ? JSON.parse(sv.spec_data) : sv.spec_data;
  }, [composedData, specData]);

  const index = useMemo(() => (appSpec ? buildSearchIndex(appSpec) : []), [appSpec]);
  const results = useMemo(() => searchEntries(index, query), [index, query]);

  // Reset selection when results change
  useEffect(() => setSelectedIndex(0), [results]);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  const handleSelect = useCallback(
    (entry: { type: string; entityName?: string; path?: string }) => {
      setOpen(false);
      if (!basePath) return;
      if (entry.type === 'entity' && entry.entityName) {
        navigate(`${basePath}/entities/${entry.entityName}`);
      } else if ((entry.type === 'field' || entry.type === 'enum_value' || entry.type === 'transition') && entry.entityName) {
        navigate(`${basePath}/entities/${entry.entityName}`);
      } else if (entry.type === 'page') {
        navigate(`${basePath}/pages`);
      } else if (entry.type === 'nav_item') {
        navigate(`${basePath}/navigation`);
      } else if (entry.type === 'permission') {
        navigate(`${basePath}/permissions`);
      }
    },
    [basePath, navigate],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    },
    [results, selectedIndex, handleSelect],
  );

  if (!basePath) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-surface-500 dark:text-zinc-400 bg-surface-100 dark:bg-zinc-800 border border-surface-200 dark:border-zinc-700 rounded-lg hover:bg-surface-200 dark:hover:bg-zinc-700 transition-colors"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search...</span>
        <kbd className="hidden sm:inline text-[10px] bg-surface-200 dark:bg-zinc-700 text-surface-500 dark:text-zinc-400 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-elevation-xl border border-surface-200 dark:border-zinc-800 w-full max-w-lg mx-4 overflow-hidden animate-scale-in">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-surface-200 dark:border-zinc-800">
              <Search className="w-5 h-5 text-surface-400 dark:text-zinc-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search entities, fields, transitions..."
                className="flex-1 text-base outline-none bg-transparent text-surface-900 dark:text-zinc-100 placeholder:text-surface-400 dark:placeholder:text-zinc-500"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-surface-400 hover:text-surface-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="text-[10px] bg-surface-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono text-surface-400 dark:text-zinc-500">ESC</kbd>
            </div>
            <SearchResults results={results} onSelect={handleSelect} query={query} selectedIndex={selectedIndex} />
          </div>
        </div>
      )}
    </>
  );
}
