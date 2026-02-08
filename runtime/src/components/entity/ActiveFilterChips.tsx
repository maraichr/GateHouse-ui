import { X } from 'lucide-react';
import { semanticBadgeStyle } from '../../utils/semanticColor';

interface ActiveFilterChipsProps {
  filters: Record<string, any>;
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

function formatValue(val: any): string {
  if (Array.isArray(val)) return val.join(', ');
  if (val && typeof val === 'object') {
    // date range: { from, to } or numeric range: { min, max }
    if (val.from || val.to) return `${val.from ?? '…'} – ${val.to ?? '…'}`;
    if (val.min !== undefined || val.max !== undefined) return `${val.min ?? '…'} – ${val.max ?? '…'}`;
    return JSON.stringify(val);
  }
  return String(val);
}

function humanizeKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ActiveFilterChips({ filters, onRemove, onClearAll }: ActiveFilterChipsProps) {
  const entries = Object.entries(filters).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return null;

  const chipStyle = semanticBadgeStyle('primary');

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {entries.map(([key, val]) => (
        <span
          key={key}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full"
          style={chipStyle}
        >
          <span className="font-medium">{humanizeKey(key)}:</span>
          <span className="max-w-[120px] truncate">{formatValue(val)}</span>
          <button
            type="button"
            onClick={() => onRemove(key)}
            className="ml-0.5 rounded-full p-0.5 hover:opacity-70"
            aria-label={`Remove ${humanizeKey(key)} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {entries.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
        >
          Clear all
        </button>
      )}
    </div>
  );
}
