import { useState, useEffect, useCallback } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Dialog } from './Dialog';

interface GlobalSearchProps {
  entities?: string[];
}

export function GlobalSearch({ entities = [] }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setOpen((o) => !o);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        aria-label="Open search (Ctrl+K)"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-gray-300 bg-gray-50 px-1.5 text-[10px] font-medium text-gray-400">
          <span>&#8984;</span>K
        </kbd>
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} aria-label="Search" className="relative w-full max-w-lg top-0">
        <Command className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center border-b border-gray-200 px-3">
            <Search className="h-4 w-4 text-gray-400 mr-2" />
            <Command.Input
              placeholder="Search across entities..."
              className="flex-1 py-3 text-sm outline-none bg-transparent"
              autoFocus
            />
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close search"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Command.List className="max-h-72 overflow-y-auto p-2">
            <Command.Empty className="p-4 text-sm text-gray-400 text-center">
              No results found.
            </Command.Empty>
            {entities.map((entity) => (
              <Command.Group key={entity} heading={entity}>
                <Command.Item
                  value={`go-to-${entity}`}
                  onSelect={() => {
                    navigate(`/${entity.toLowerCase().replace(/\s+/g, '-')}`);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer data-[selected]:bg-blue-50 data-[selected]:text-blue-700"
                >
                  Go to {entity}
                </Command.Item>
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </Dialog>
    </>
  );
}
