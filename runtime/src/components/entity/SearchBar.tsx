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

  useEffect(() => {
    const timer = setTimeout(() => onChange(local), debounceMs);
    return () => clearTimeout(timer);
  }, [local, debounceMs, onChange]);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
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
  );
}
