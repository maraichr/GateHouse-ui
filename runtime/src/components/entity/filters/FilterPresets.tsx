import { semanticBadgeStyle } from '../../../utils/semanticColor';

interface FilterPreset {
  label: string;
  filters: Record<string, any>;
}

interface FilterPresetsProps {
  presets: FilterPreset[];
  activeFilters: Record<string, any>;
  onSelect: (filters: Record<string, any>) => void;
}

const activeStyle = {
  ...semanticBadgeStyle('primary'),
  borderColor: 'color-mix(in srgb, var(--color-primary) 40%, transparent)',
};

const inactiveStyle = {
  color: 'var(--color-text-muted)',
  borderColor: 'var(--color-border-light, var(--color-border))',
  backgroundColor: 'transparent',
};

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
        className="px-3 py-1 text-xs font-medium rounded-full border transition-colors"
        style={Object.keys(activeFilters).length === 0 ? activeStyle : inactiveStyle}
        onMouseEnter={(e) => {
          if (Object.keys(activeFilters).length !== 0)
            e.currentTarget.style.backgroundColor = 'var(--color-surface-hover, rgba(0,0,0,0.03))';
        }}
        onMouseLeave={(e) => {
          if (Object.keys(activeFilters).length !== 0)
            e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        All
      </button>
      {presets.map((preset) => {
        const active = isActive(preset);
        return (
          <button
            key={preset.label}
            type="button"
            onClick={() => onSelect(preset.filters)}
            className="px-3 py-1 text-xs font-medium rounded-full border transition-colors"
            style={active ? activeStyle : inactiveStyle}
            onMouseEnter={(e) => {
              if (!active)
                e.currentTarget.style.backgroundColor = 'var(--color-surface-hover, rgba(0,0,0,0.03))';
            }}
            onMouseLeave={(e) => {
              if (!active)
                e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
