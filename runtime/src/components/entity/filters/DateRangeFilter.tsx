import { useState } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Calendar } from 'lucide-react';
import 'react-day-picker/style.css';

interface DateRangeFilterProps {
  field: string;
  value?: { from?: string; to?: string };
  onChange: (value: { from?: string; to?: string } | undefined) => void;
  presets?: { label: string; range: any[] }[];
}

const DEFAULT_PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'This month', days: 0 },
];

export function DateRangeFilter({ field, value, onChange, presets }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);

  const selected: DateRange | undefined = value
    ? { from: value.from ? new Date(value.from) : undefined, to: value.to ? new Date(value.to) : undefined }
    : undefined;

  const handleSelect = (range: DateRange | undefined) => {
    if (!range) {
      onChange(undefined);
      return;
    }
    onChange({
      from: range.from ? format(range.from, 'yyyy-MM-dd') : undefined,
      to: range.to ? format(range.to, 'yyyy-MM-dd') : undefined,
    });
  };

  const handlePreset = (preset: typeof DEFAULT_PRESETS[number]) => {
    const now = new Date();
    if (preset.days === 0) {
      // "This month"
      onChange({
        from: format(startOfMonth(now), 'yyyy-MM-dd'),
        to: format(endOfMonth(now), 'yyyy-MM-dd'),
      });
    } else {
      onChange({
        from: format(subDays(now, preset.days), 'yyyy-MM-dd'),
        to: format(now, 'yyyy-MM-dd'),
      });
    }
    setOpen(false);
  };

  const displayValue = value?.from
    ? `${value.from}${value.to ? ` – ${value.to}` : ''}`
    : 'Any date';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm text-left"
        style={{ borderColor: 'var(--color-border)' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-hover, rgba(0,0,0,0.03))'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
      >
        <Calendar className="h-4 w-4" style={{ color: 'var(--color-text-faint, var(--color-text-muted))' }} />
        <span className="truncate" style={{ color: 'var(--color-text-secondary)' }}>{displayValue}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 surface-card rounded-lg p-3">
            <div className="flex gap-2 mb-2">
              {DEFAULT_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handlePreset(p)}
                  className="px-2 py-1 text-xs border rounded"
                  style={{ borderColor: 'var(--color-border-light, var(--color-border))' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-hover, rgba(0,0,0,0.03))'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <DayPicker
              mode="range"
              selected={selected}
              onSelect={handleSelect}
              numberOfMonths={1}
            />
            {value && (
              <button
                type="button"
                onClick={() => { onChange(undefined); setOpen(false); }}
                className="mt-1 w-full text-xs text-center"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
              >
                Clear
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
