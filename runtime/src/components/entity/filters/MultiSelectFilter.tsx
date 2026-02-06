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
        className="w-full flex items-center justify-between px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
      >
        <span className="truncate text-gray-700">
          {selected.length === 0
            ? 'All'
            : `${selected.length} selected`}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
      </button>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {selected.map((val) => {
            const item = values.find((v) => v.value === val);
            return (
              <span
                key={val}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full"
              >
                {item?.label || val}
                <button type="button" onClick={() => toggle(val)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-7 pr-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>
          )}
          <div className="overflow-y-auto max-h-48 p-1">
            {filtered.map((v) => (
              <label
                key={v.value}
                className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-50 rounded"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(v.value)}
                  onChange={() => toggle(v.value)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">{v.label}</span>
              </label>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">No options</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
