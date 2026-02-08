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
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors"
        style={{ color: 'var(--color-text-faint)', backgroundColor: 'var(--color-bg-alt)' }}
        aria-label="Open search (Ctrl+K)"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border px-1.5 text-[10px] font-medium"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-alt)', color: 'var(--color-text-faint)' }}
        >
          <span>&#8984;</span>K
        </kbd>
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} aria-label="Search" className="relative w-full max-w-lg top-0">
        <Command className="rounded-xl shadow-2xl border overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center border-b px-3" style={{ borderColor: 'var(--color-border)' }}>
            <Search className="h-4 w-4 mr-2" style={{ color: 'var(--color-text-faint)' }} />
            <Command.Input
              placeholder="Search across entities..."
              className="flex-1 py-3 text-sm outline-none bg-transparent"
              autoFocus
            />
            <button
              onClick={() => setOpen(false)}
              style={{ color: 'var(--color-text-faint)' }}
              aria-label="Close search"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Command.List className="max-h-72 overflow-y-auto p-2">
            <Command.Empty className="p-4 text-sm text-center" style={{ color: 'var(--color-text-faint)' }}>
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
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer"
                  style={{ '--cmdk-selected-bg': 'var(--color-primary-50)', '--cmdk-selected-color': 'var(--color-primary-700)' } as React.CSSProperties}
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
