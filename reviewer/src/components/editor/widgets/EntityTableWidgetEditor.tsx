import type { Widget, Entity } from '../../../types';

interface EntityTableWidgetEditorProps {
  widget: Widget;
  onChange: (w: Widget) => void;
  entityNames: string[];
  entities: Entity[];
}

export function EntityTableWidgetEditor({
  widget,
  onChange,
  entityNames,
  entities,
}: EntityTableWidgetEditorProps) {
  const query = widget.query || {};
  const selectedEntity = entities.find((e) => e.name === widget.entity);
  const fieldNames = selectedEntity ? selectedEntity.fields.map((f) => f.name) : [];

  // columns stored as string[] in the widget
  const columns = Array.isArray(widget.columns) ? widget.columns as string[] : [];

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
            placeholder="Table title"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Entity</label>
          <select
            value={widget.entity || ''}
            onChange={(e) => onChange({ ...widget, entity: e.target.value, columns: undefined })}
            className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
          >
            <option value="">Select entity...</option>
            {entityNames.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Columns */}
      {fieldNames.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">
            Columns ({columns.length} selected)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {fieldNames.map((field) => (
              <button
                key={field}
                onClick={() => {
                  const next = columns.includes(field)
                    ? columns.filter((c) => c !== field)
                    : [...columns, field];
                  onChange({ ...widget, columns: next.length > 0 ? next : undefined });
                }}
                className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                  columns.includes(field)
                    ? 'bg-brand-100 dark:bg-brand-950 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-400'
                    : 'bg-white dark:bg-zinc-900 border-surface-200 dark:border-zinc-800 text-surface-500 dark:text-zinc-400 hover:bg-surface-50 dark:hover:bg-zinc-800'
                }`}
              >
                {field}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Query settings */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Sort Field</label>
          <select
            value={query.sort?.field || ''}
            onChange={(e) => {
              const sort = e.target.value
                ? { field: e.target.value, order: query.sort?.order || 'desc' }
                : undefined;
              onChange({ ...widget, query: { ...query, sort } });
            }}
            className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
          >
            <option value="">Default</option>
            {fieldNames.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Sort Order</label>
          <select
            value={query.sort?.order || 'desc'}
            onChange={(e) => {
              if (query.sort) {
                onChange({
                  ...widget,
                  query: { ...query, sort: { ...query.sort, order: e.target.value } },
                });
              }
            }}
            disabled={!query.sort}
            className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900 disabled:opacity-50"
          >
            <option value="asc">asc</option>
            <option value="desc">desc</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Limit</label>
          <input
            type="number"
            value={query.limit || 5}
            onChange={(e) =>
              onChange({ ...widget, query: { ...query, limit: parseInt(e.target.value) || 5 } })
            }
            className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
            min={1}
            max={50}
          />
        </div>
      </div>

      {/* Link path */}
      <div>
        <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Link Path</label>
        <input
          type="text"
          value={widget.link || ''}
          onChange={(e) => onChange({ ...widget, link: e.target.value || undefined })}
          className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
          placeholder="/entity-path (optional)"
        />
        <p className="mt-1 text-[10px] text-surface-400 dark:text-zinc-500">
          "View all" link at the bottom of the table
        </p>
      </div>
    </div>
  );
}
