import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useSpec } from '../../hooks/useSpec';
import { buildSearchIndex, searchEntries } from '../../utils/searchIndex';
import { SearchResults } from './SearchResults';
import type { AppSpec } from '../../types';

export function GlobalSearch() {
  const { specId } = useParams<{ specId: string }>();
  const { data: specData } = useSpec(specId);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const appSpec: AppSpec | null = useMemo(() => {
    const sv = specData?.latest_version;
    if (!sv?.spec_data) return null;
    return typeof sv.spec_data === 'string' ? JSON.parse(sv.spec_data) : sv.spec_data;
  }, [specData]);

  const index = useMemo(() => (appSpec ? buildSearchIndex(appSpec) : []), [appSpec]);
  const results = useMemo(() => searchEntries(index, query), [index, query]);

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
    }
  }, [open]);

  const handleSelect = useCallback(
    (entry: { type: string; entityName?: string; path?: string }) => {
      setOpen(false);
      if (!specId) return;
      if (entry.type === 'entity' && entry.entityName) {
        navigate(`/specs/${specId}/entities/${entry.entityName}`);
      } else if ((entry.type === 'field' || entry.type === 'enum_value' || entry.type === 'transition') && entry.entityName) {
        navigate(`/specs/${specId}/entities/${entry.entityName}`);
      } else if (entry.type === 'page') {
        navigate(`/specs/${specId}/pages`);
      } else if (entry.type === 'nav_item') {
        navigate(`/specs/${specId}/navigation`);
      } else if (entry.type === 'permission') {
        navigate(`/specs/${specId}/permissions`);
      }
    },
    [specId, navigate],
  );

  if (!specId) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search...</span>
        <kbd className="hidden sm:inline text-[10px] bg-gray-200 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search entities, fields, transitions..."
                className="flex-1 text-sm outline-none bg-transparent"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-400">ESC</kbd>
            </div>
            <SearchResults results={results} onSelect={handleSelect} query={query} />
          </div>
        </div>
      )}
    </>
  );
}
