import { cn } from '../../../utils/cn';

interface FilterPreset {
  label: string;
  filters: Record<string, any>;
}

interface FilterPresetsProps {
  presets: FilterPreset[];
  activeFilters: Record<string, any>;
  onSelect: (filters: Record<string, any>) => void;
}

export function FilterPresets({ presets, activeFilters, onSelect }: FilterPresetsProps) {
  if (!presets.length) return null;

  const isActive = (preset: FilterPreset) => {
    return Object.entries(preset.filters).every(
      ([k, v]) => JSON.stringify(activeFilters[k]) === JSON.stringify(v),
    );
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => onSelect({})}
        className={cn(
          'px-3 py-1 text-xs font-medium rounded-full border transition-colors',
          Object.keys(activeFilters).length === 0
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'text-gray-600 border-gray-200 hover:bg-gray-50',
        )}
      >
        All
      </button>
      {presets.map((preset) => (
        <button
          key={preset.label}
          type="button"
          onClick={() => onSelect(preset.filters)}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-full border transition-colors',
            isActive(preset)
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'text-gray-600 border-gray-200 hover:bg-gray-50',
          )}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
