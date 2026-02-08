import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { SearchConfig } from '../../types';
import { semanticBadgeStyle } from '../../utils/semanticColor';

interface SearchBarProps {
  config?: SearchConfig;
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ config, value, onChange }: SearchBarProps) {
  const [local, setLocal] = useState(value);
  const debounceMs = config?.debounce_ms ?? 300;
  const minLength = config?.min_length ?? 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (local.length === 0 || local.length >= minLength) {
        onChange(local);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [local, debounceMs, minLength, onChange]);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const belowMin = local.length > 0 && local.length < minLength;

  return (
    <div>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
          style={{ color: 'var(--color-text-faint, var(--color-text-muted))' }}
        />
        <input
          type="text"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          placeholder={config?.placeholder || 'Search...'}
          className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none"
          style={{ borderColor: 'var(--color-border)' }}
        />
      </div>
      {belowMin && (
        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Type at least {minLength} characters to search
        </p>
      )}
      {config?.fields && config.fields.length > 0 && local.length >= minLength && local.length > 0 && (
        <div className="mt-1 flex items-center gap-1 flex-wrap">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Searching:</span>
          {config.fields.map((f) => (
            <span
              key={f}
              className="text-xs px-1.5 py-0.5 rounded"
              style={semanticBadgeStyle('neutral')}
            >
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
