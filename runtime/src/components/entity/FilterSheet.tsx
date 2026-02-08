import { useEffect, useRef, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, RotateCcw } from 'lucide-react';
import { FilterPanel } from './FilterPanel';
import { SearchBar } from './SearchBar';
import { FilterConfig, Field, SearchConfig } from '../../types';

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  filterConfig?: FilterConfig;
  filterFields?: Field[];
  filters: Record<string, any>;
  onFilterChange: (filters: Record<string, any>) => void;
  searchConfig?: SearchConfig;
  search: string;
  onSearchChange: (value: string) => void;
}

export function FilterSheet({
  open,
  onClose,
  filterConfig,
  filterFields,
  filters,
  onFilterChange,
  searchConfig,
  search,
  onSearchChange,
}: FilterSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // Store and restore focus
  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement;
      requestAnimationFrame(() => {
        const el = sheetRef.current;
        if (!el) return;
        const focusable = el.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        (focusable || el).focus();
      });
    } else if (previousFocus.current) {
      previousFocus.current.focus();
      previousFocus.current = null;
    }
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const el = sheetRef.current;
    if (!el) return;
    const focusables = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  const handleReset = () => {
    onFilterChange({});
    onSearchChange('');
  };

  if (!open) return null;

  // Portal into the [data-theme] element so CSS custom properties are inherited.
  // Falls back to document.body if not found.
  const portalTarget = document.querySelector('[data-theme]') || document.body;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        onKeyDown={handleKeyDown}
        className="fixed bottom-0 inset-x-0 z-50 flex flex-col surface-card animate-slideUp"
        style={{
          maxHeight: '85vh',
          borderTopLeftRadius: 'var(--radius-lg, 12px)',
          borderTopRightRadius: 'var(--radius-lg, 12px)',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: 'var(--color-border)' }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3">
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            Filters
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded"
              style={{ color: 'var(--color-text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded"
              style={{ color: 'var(--color-text-muted)' }}
              aria-label="Close filters"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
          {searchConfig && (
            <SearchBar config={searchConfig} value={search} onChange={onSearchChange} />
          )}
          <FilterPanel
            config={filterConfig}
            fields={filterFields}
            filters={filters}
            onFilterChange={onFilterChange}
          />
        </div>
      </div>
    </>,
    portalTarget,
  );
}
