import { useState } from 'react';
import { Plus, X, GripVertical } from 'lucide-react';

const SEMANTIC_COLOR_OPTIONS = [
  'primary', 'secondary', 'accent', 'danger', 'success', 'info', 'warning',
];

interface TagListFieldProps {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  disabled?: boolean;
}

export function TagListField({
  label,
  value,
  onChange,
  suggestions = SEMANTIC_COLOR_OPTIONS,
  disabled = false,
}: TagListFieldProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInputValue('');
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const moveTag = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const unusedSuggestions = suggestions.filter((s) => !value.includes(s));

  return (
    <div className={disabled ? 'opacity-60 pointer-events-none' : ''}>
      <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">{label}</label>

      {/* Tag list */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-100 dark:bg-zinc-800 text-sm text-surface-700 dark:text-zinc-300 group"
            >
              <button
                type="button"
                onClick={() => moveTag(i, i - 1)}
                className="opacity-0 group-hover:opacity-60 hover:!opacity-100 cursor-grab"
                title="Drag to reorder"
              >
                <GripVertical className="w-3 h-3" />
              </button>
              <span className="font-mono text-xs">{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(i)}
                className="text-surface-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input + add */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag(inputValue);
            }
          }}
          placeholder="Add color name..."
          className="flex-1 px-2 py-1.5 border border-surface-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-surface-900 dark:text-zinc-100"
        />
        <button
          type="button"
          onClick={() => addTag(inputValue)}
          disabled={!inputValue.trim()}
          className="p-1.5 text-surface-400 dark:text-zinc-500 hover:text-brand-600 dark:hover:text-brand-400 disabled:opacity-30"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Quick-add suggestions */}
      {unusedSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {unusedSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="px-2 py-0.5 text-xs text-surface-500 dark:text-zinc-400 border border-dashed border-surface-300 dark:border-zinc-600 rounded hover:border-brand-400 dark:hover:border-brand-600 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
