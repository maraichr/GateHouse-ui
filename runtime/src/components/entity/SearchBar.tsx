import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { SearchConfig } from '../../types';

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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          placeholder={config?.placeholder || 'Search...'}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      {belowMin && (
        <p className="mt-1 text-xs text-gray-400">
          Type at least {minLength} characters to search
        </p>
      )}
      {config?.fields && config.fields.length > 0 && local.length >= minLength && local.length > 0 && (
        <div className="mt-1 flex items-center gap-1 flex-wrap">
          <span className="text-xs text-gray-400">Searching:</span>
          {config.fields.map((f) => (
            <span key={f} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
