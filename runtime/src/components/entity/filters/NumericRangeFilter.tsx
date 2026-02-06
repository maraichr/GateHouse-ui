interface NumericRangeFilterProps {
  field: string;
  value?: { min?: number; max?: number };
  onChange: (value: { min?: number; max?: number } | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function NumericRangeFilter({ field, value, onChange, min, max, step = 1 }: NumericRangeFilterProps) {
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
        className="w-full border border-gray-300 rounded-md text-sm py-1.5 px-2"
      />
      <span className="text-gray-400 text-xs">–</span>
      <input
        type="number"
        value={value?.max ?? ''}
        onChange={(e) => handleMax(e.target.value)}
        placeholder="Max"
        min={min}
        max={max}
        step={step}
        className="w-full border border-gray-300 rounded-md text-sm py-1.5 px-2"
      />
    </div>
  );
}
