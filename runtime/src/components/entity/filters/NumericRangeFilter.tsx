interface NumericRangeFilterProps {
  field: string;
  value?: { min?: number; max?: number };
  onChange: (value: { min?: number; max?: number } | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  slider?: boolean;
}

export function NumericRangeFilter({ field, value, onChange, min, max, step = 1, slider }: NumericRangeFilterProps) {
  // Use slider mode when explicitly requested and bounds are defined
  if (slider && min != null && max != null) {
    return (
      <RangeSlider
        min={min}
        max={max}
        step={step}
        valueMin={value?.min ?? min}
        valueMax={value?.max ?? max}
        onChange={(lo, hi) => {
          const isDefault = lo <= min && hi >= max;
          onChange(isDefault ? undefined : { min: lo, max: hi });
        }}
      />
    );
  }

  const handleMin = (raw: string) => {
    const num = raw === '' ? undefined : Number(raw);
    const next = { ...value, min: num };
    if (next.min === undefined && next.max === undefined) {
      onChange(undefined);
    } else {
      onChange(next);
    }
  };

  const handleMax = (raw: string) => {
    const num = raw === '' ? undefined : Number(raw);
    const next = { ...value, max: num };
    if (next.min === undefined && next.max === undefined) {
      onChange(undefined);
    } else {
      onChange(next);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={value?.min ?? ''}
        onChange={(e) => handleMin(e.target.value)}
        placeholder="Min"
        min={min}
        max={max}
        step={step}
        className="w-full border rounded-md text-sm py-1.5 px-2"
        style={{ borderColor: 'var(--color-border)' }}
      />
      <span className="text-xs" style={{ color: 'var(--color-text-faint, var(--color-text-muted))' }}>–</span>
      <input
        type="number"
        value={value?.max ?? ''}
        onChange={(e) => handleMax(e.target.value)}
        placeholder="Max"
        min={min}
        max={max}
        step={step}
        className="w-full border rounded-md text-sm py-1.5 px-2"
        style={{ borderColor: 'var(--color-border)' }}
      />
    </div>
  );
}

function RangeSlider({
  min,
  max,
  step,
  valueMin,
  valueMax,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  valueMin: number;
  valueMax: number;
  onChange: (lo: number, hi: number) => void;
}) {
  const range = max - min || 1;
  const loPercent = ((valueMin - min) / range) * 100;
  const hiPercent = ((valueMax - min) / range) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-medium">
        <span style={{ color: 'var(--color-text-secondary)' }}>{valueMin}</span>
        <span style={{ color: 'var(--color-text-muted)' }}>–</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>{valueMax}</span>
      </div>
      <div className="relative h-5 flex items-center">
        {/* Track background */}
        <div
          className="absolute left-0 right-0 h-1.5 rounded-full"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-text-muted) 20%, transparent)' }}
        />
        {/* Active range highlight */}
        <div
          className="absolute h-1.5 rounded-full"
          style={{
            left: `${loPercent}%`,
            right: `${100 - hiPercent}%`,
            backgroundColor: 'var(--color-primary)',
          }}
        />
        {/* Min thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={valueMin}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange(Math.min(v, valueMax), valueMax);
          }}
          className="range-thumb absolute w-full"
          style={{ pointerEvents: 'none' }}
        />
        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={valueMax}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange(valueMin, Math.max(v, valueMin));
          }}
          className="range-thumb absolute w-full"
          style={{ pointerEvents: 'none' }}
        />
      </div>
    </div>
  );
}
