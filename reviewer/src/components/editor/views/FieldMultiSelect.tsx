import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';

interface FieldMultiSelectProps {
  availableFields: string[];
  selectedFields: string[];
  onChange: (fields: string[]) => void;
  label?: string;
  placeholder?: string;
}

export function FieldMultiSelect({
  availableFields,
  selectedFields,
  onChange,
  label,
  placeholder = 'Select fields...',
}: FieldMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unselected = availableFields.filter((f) => !selectedFields.includes(f));

  const toggleField = (field: string) => {
    if (selectedFields.includes(field)) {
      onChange(selectedFields.filter((f) => f !== field));
    } else {
      onChange([...selectedFields, field]);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...selectedFields];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  };

  const moveDown = (index: number) => {
    if (index >= selectedFields.length - 1) return;
    const next = [...selectedFields];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  };

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">{label}</label>
      )}

      {/* Selected chips */}
      {selectedFields.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedFields.map((field, i) => (
            <div
              key={field}
              className="inline-flex items-center gap-0.5 px-2 py-1 bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 rounded text-xs font-mono text-brand-700 dark:text-brand-300"
            >
              <span>{field}</span>
              <div className="flex items-center gap-0 ml-1">
                <button
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  className="p-0 text-brand-400 dark:text-brand-500 hover:text-brand-600 dark:hover:text-brand-300 disabled:opacity-30"
                  title="Move up"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => moveDown(i)}
                  disabled={i === selectedFields.length - 1}
                  className="p-0 text-brand-400 dark:text-brand-500 hover:text-brand-600 dark:hover:text-brand-300 disabled:opacity-30"
                  title="Move down"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>
              <button
                onClick={() => toggleField(field)}
                className="p-0 ml-0.5 text-brand-400 dark:text-brand-500 hover:text-red-500 dark:hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropdown trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 border border-surface-300 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-800 hover:bg-surface-50 dark:hover:bg-zinc-700/50 transition-colors"
      >
        <span className="text-surface-500 dark:text-zinc-400">
          {selectedFields.length === 0
            ? placeholder
            : `${selectedFields.length} field${selectedFields.length !== 1 ? 's' : ''} selected`}
        </span>
        <ChevronDown className={`w-4 h-4 text-surface-400 dark:text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-zinc-800 border border-surface-200 dark:border-zinc-700 rounded-lg shadow-lg dark:shadow-zinc-950/50 max-h-56 overflow-y-auto">
          {availableFields.length === 0 ? (
            <div className="px-3 py-2 text-sm text-surface-400 dark:text-zinc-500">No fields available</div>
          ) : (
            availableFields.map((field) => {
              const selected = selectedFields.includes(field);
              return (
                <label
                  key={field}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-50 dark:hover:bg-zinc-700/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleField(field)}
                    className="rounded border-surface-300 dark:border-zinc-600"
                  />
                  <span className={`text-sm font-mono ${selected ? 'text-brand-700 dark:text-brand-400 font-medium' : 'text-surface-700 dark:text-zinc-300'}`}>
                    {field}
                  </span>
                </label>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
