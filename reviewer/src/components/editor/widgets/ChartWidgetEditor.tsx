import type { Widget } from '../../../types';

const CHART_TYPES = [
  { value: 'bar', label: 'Bar', emoji: '📊' },
  { value: 'donut', label: 'Donut', emoji: '🍩' },
  { value: 'line', label: 'Line', emoji: '📈' },
  { value: 'area', label: 'Area', emoji: '📉' },
];

interface ChartWidgetEditorProps {
  widget: Widget;
  onChange: (w: Widget) => void;
}

export function ChartWidgetEditor({ widget, onChange }: ChartWidgetEditorProps) {
  const dataMapping = (widget.data_mapping || {}) as Record<string, string>;

  const setDataMapping = (key: string, value: string) => {
    const next = { ...dataMapping };
    if (value) {
      next[key] = value;
    } else {
      delete next[key];
    }
    onChange({ ...widget, data_mapping: Object.keys(next).length > 0 ? next : undefined });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Title</label>
          <input
            type="text"
            value={widget.title || ''}
            onChange={(e) => onChange({ ...widget, title: e.target.value })}
            className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
            placeholder="Chart title"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Height (px)</label>
          <input
            type="number"
            value={widget.height || 300}
            onChange={(e) => onChange({ ...widget, height: parseInt(e.target.value) || 300 })}
            className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
          />
        </div>
      </div>

      {/* Chart type picker */}
      <div>
        <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Chart Type</label>
        <div className="flex gap-2">
          {CHART_TYPES.map(({ value, label }) => (
            <label
              key={value}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 cursor-pointer transition-colors text-sm ${
                widget.chart_type === value
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-400 font-medium'
                  : 'border-surface-200 dark:border-zinc-800 hover:border-surface-300 dark:hover:border-zinc-700 text-surface-600 dark:text-zinc-400'
              }`}
            >
              <input
                type="radio"
                name="chart-type"
                checked={widget.chart_type === value}
                onChange={() => onChange({ ...widget, chart_type: value })}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Data source */}
      <div>
        <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Data Source Path</label>
        <input
          type="text"
          value={widget.source || ''}
          onChange={(e) => onChange({ ...widget, source: e.target.value })}
          className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
          placeholder="/dashboard/charts/revenue-by-plan"
        />
        <p className="mt-1 text-[10px] text-surface-400 dark:text-zinc-500">
          API path that returns chart data (served from _widgets in data.json)
        </p>
      </div>

      {/* Data mapping */}
      <div>
        <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Data Mapping</label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] text-surface-400 dark:text-zinc-500 mb-0.5">Label Field</label>
            <input
              type="text"
              value={dataMapping.label || ''}
              onChange={(e) => setDataMapping('label', e.target.value)}
              className="w-full px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs font-mono bg-white dark:bg-zinc-900"
              placeholder="label"
            />
          </div>
          <div>
            <label className="block text-[10px] text-surface-400 dark:text-zinc-500 mb-0.5">Value Field</label>
            <input
              type="text"
              value={dataMapping.value || ''}
              onChange={(e) => setDataMapping('value', e.target.value)}
              className="w-full px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs font-mono bg-white dark:bg-zinc-900"
              placeholder="value"
            />
          </div>
          <div>
            <label className="block text-[10px] text-surface-400 dark:text-zinc-500 mb-0.5">Series Field</label>
            <input
              type="text"
              value={dataMapping.series || ''}
              onChange={(e) => setDataMapping('series', e.target.value)}
              className="w-full px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs font-mono bg-white dark:bg-zinc-900"
              placeholder="series (optional)"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
