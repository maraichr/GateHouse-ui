import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Search } from 'lucide-react';
import { EnumValue } from '../../../types';

interface MultiSelectFilterProps {
  field: string;
  values: EnumValue[];
  selected: string[];
  onChange: (selected: string[]) => void;
  searchable?: boolean;
}

export function MultiSelectFilter({ field, values, selected, onChange, searchable }: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = search
    ? values.filter((v) => v.label.toLowerCase().includes(search.toLowerCase()))
    : values;

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-1.5 border rounded-md text-sm"
        style={{ borderColor: 'var(--color-border)' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-hover, rgba(0,0,0,0.03))'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
      >
        <span className="truncate" style={{ color: selected.length > 0 ? 'var(--color-text)' : 'var(--color-text-secondary)' }}>
          {selected.length === 0
            ? 'All'
            : selected.length <= 2
              ? selected.map((s) => values.find((v) => v.value === s)?.label ?? s).join(', ')
              : `${selected.length} selected`}
        </span>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange([]); }}
            className="flex-shrink-0 ml-1 rounded-full p-0.5"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
            aria-label="Clear selection"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        <ChevronDown className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-text-faint, var(--color-text-muted))' }} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-full surface-card rounded-lg max-h-60 overflow-hidden">
          {searchable && (
            <div className="p-2" style={{ borderBottom: '1px solid var(--color-border-light, var(--color-border))' }}>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: 'var(--color-text-faint, var(--color-text-muted))' }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-7 pr-2 py-1 text-sm border rounded focus:outline-none"
                  style={{ borderColor: 'var(--color-border-light, var(--color-border))' }}
                  autoFocus
                />
              </div>
            </div>
          )}
          <div className="overflow-y-auto max-h-48 p-1">
            {filtered.map((v) => (
              <label
                key={v.value}
                className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer rounded"
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-hover, rgba(0,0,0,0.03))'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(v.value)}
                  onChange={() => toggle(v.value)}
                  className="rounded"
                />
                <span style={{ color: 'var(--color-text-secondary)' }}>{v.label}</span>
              </label>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-center py-2" style={{ color: 'var(--color-text-muted)' }}>No options</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
