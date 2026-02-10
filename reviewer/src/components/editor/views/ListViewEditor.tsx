import { Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import { Card } from '../../ui/Card';
import type { ListView, ListColumn, FilterConfig, FilterGroup, FilterField, SearchConfig, FilterPreset } from '../../../types';
import { FieldMultiSelect } from './FieldMultiSelect';
import { ActionsEditor } from './ActionsEditor';

interface ListViewEditorProps {
  view: ListView;
  onChange: (view: ListView) => void;
  availableFields: string[];
  roles?: string[];
}

const FILTER_TYPES = ['checkbox_group', 'select', 'multi_select', 'date_range', 'numeric_range'];

export function ListViewEditor({ view, onChange, availableFields, roles = [] }: ListViewEditorProps) {
  // --- Columns ---
  const columns = view.columns || [];

  const addColumn = () => {
    const unused = availableFields.filter((f) => !columns.some((c) => c.field === f));
    const field = unused[0] || availableFields[0] || '';
    if (!field) return;
    onChange({ ...view, columns: [...columns, { field }] });
  };

  const updateColumn = (i: number, col: ListColumn) => {
    const next = [...columns];
    next[i] = col;
    onChange({ ...view, columns: next });
  };

  const removeColumn = (i: number) => {
    onChange({ ...view, columns: columns.filter((_, idx) => idx !== i) });
  };

  const moveColumn = (i: number, dir: 'up' | 'down') => {
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= columns.length) return;
    const next = [...columns];
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ ...view, columns: next });
  };

  // --- Sort ---
  const sort = view.default_sort;

  // --- Search ---
  const search = view.search;

  const setSearch = (s: SearchConfig | undefined) => {
    onChange({ ...view, search: s });
  };

  // --- Filters ---
  const filters = view.filters;

  const setFilters = (f: FilterConfig | undefined) => {
    onChange({ ...view, filters: f });
  };

  return (
    <div className="space-y-5">
      {/* Columns */}
      <Card padding="sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-surface-900 dark:text-zinc-100 text-sm">Columns ({columns.length})</h4>
          <button
            onClick={addColumn}
            className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
          >
            <Plus className="w-3 h-3" />
            Add Column
          </button>
        </div>

        {columns.length === 0 ? (
          <p className="text-sm text-surface-400 dark:text-zinc-500 text-center py-3">No columns configured</p>
        ) : (
          <div className="space-y-1.5">
            {/* Column header labels */}
            <div className="flex items-center gap-2 px-2 text-[10px] font-medium text-surface-400 dark:text-zinc-500 uppercase tracking-wider">
              <span className="flex-1">Field</span>
              <span className="w-16">Width</span>
              <span className="w-20">Fixed</span>
              <span className="w-24">Link</span>
              <span className="w-[76px]"></span>
            </div>
            {columns.map((col, i) => (
              <div key={i} className={`flex items-center gap-2 p-2 rounded ${col.link_to === 'detail' ? 'bg-blue-50 dark:bg-blue-950 ring-1 ring-blue-200 dark:ring-blue-800' : 'bg-surface-50 dark:bg-zinc-800/50'}`}>
                <select
                  value={col.field}
                  onChange={(e) => updateColumn(i, { ...col, field: e.target.value })}
                  className="flex-1 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900 font-mono"
                >
                  {availableFields.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={typeof col.width === 'number' ? String(col.width) : (col.width as string) || ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    const num = parseInt(v, 10);
                    updateColumn(i, { ...col, width: v ? (isNaN(num) ? v : num) : undefined });
                  }}
                  className="w-16 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs bg-white dark:bg-zinc-900"
                  placeholder="auto"
                />
                <select
                  value={col.fixed || ''}
                  onChange={(e) => updateColumn(i, { ...col, fixed: e.target.value || undefined })}
                  className="w-20 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs bg-white dark:bg-zinc-900"
                >
                  <option value="">&mdash;</option>
                  <option value="left">left</option>
                  <option value="right">right</option>
                </select>
                <select
                  value={col.link_to || ''}
                  onChange={(e) => updateColumn(i, { ...col, link_to: e.target.value || undefined })}
                  className={`w-24 px-2 py-1 border rounded text-xs bg-white dark:bg-zinc-900 ${col.link_to === 'detail' ? 'border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 font-medium' : 'border-surface-300 dark:border-zinc-700'}`}
                >
                  <option value="">&mdash;</option>
                  <option value="detail">detail</option>
                </select>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => moveColumn(i, 'up')}
                    disabled={i === 0}
                    className="p-0.5 text-surface-300 dark:text-zinc-600 hover:text-surface-500 dark:hover:text-zinc-400 disabled:opacity-30"
                  >
                    <span className="text-[10px]">&#x25B2;</span>
                  </button>
                  <button
                    onClick={() => moveColumn(i, 'down')}
                    disabled={i === columns.length - 1}
                    className="p-0.5 text-surface-300 dark:text-zinc-600 hover:text-surface-500 dark:hover:text-zinc-400 disabled:opacity-30"
                  >
                    <span className="text-[10px]">&#x25BC;</span>
                  </button>
                  <button
                    onClick={() => removeColumn(i)}
                    className="p-0.5 text-surface-300 dark:text-zinc-600 hover:text-danger-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {columns.length > 0 && !columns.some((c) => c.link_to === 'detail') && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <LinkIcon className="w-3 h-3" />
            No column links to detail -- set Link to "detail" on one column to highlight it as a clickable link
          </p>
        )}
      </Card>

      {/* Default Sort */}
      <Card padding="sm">
        <h4 className="font-medium text-surface-900 dark:text-zinc-100 text-sm mb-3">Default Sort</h4>
        <div className="flex items-center gap-3">
          <select
            value={sort?.field || ''}
            onChange={(e) =>
              onChange({
                ...view,
                default_sort: e.target.value
                  ? { field: e.target.value, order: sort?.order || 'asc' }
                  : undefined,
              })
            }
            className="flex-1 px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900 font-mono"
          >
            <option value="">No default sort</option>
            {availableFields.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          {sort?.field && (
            <select
              value={sort.order}
              onChange={(e) =>
                onChange({
                  ...view,
                  default_sort: { ...sort, order: e.target.value },
                })
              }
              className="w-24 px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
            >
              <option value="asc">asc</option>
              <option value="desc">desc</option>
            </select>
          )}
        </div>
      </Card>

      {/* Search */}
      <Card padding="sm">
        <div className="flex items-center gap-3 mb-3">
          <h4 className="font-medium text-surface-900 dark:text-zinc-100 text-sm">Search</h4>
          <label className="flex items-center gap-1.5 text-xs text-surface-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={!!search}
              onChange={(e) => {
                if (e.target.checked) {
                  setSearch({ fields: [], placeholder: 'Search...' });
                } else {
                  setSearch(undefined);
                }
              }}
              className="rounded border-surface-300 dark:border-zinc-700"
            />
            Enable
          </label>
        </div>
        {search && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Placeholder</label>
              <input
                type="text"
                value={search.placeholder || ''}
                onChange={(e) => setSearch({ ...search, placeholder: e.target.value || undefined })}
                className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
                placeholder="Search..."
              />
            </div>
            <FieldMultiSelect
              label="Searchable Fields"
              availableFields={availableFields}
              selectedFields={search.fields}
              onChange={(fields) => setSearch({ ...search, fields })}
            />
          </div>
        )}
      </Card>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex items-center gap-3 mb-3">
          <h4 className="font-medium text-surface-900 dark:text-zinc-100 text-sm">Filters</h4>
          <label className="flex items-center gap-1.5 text-xs text-surface-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={!!filters}
              onChange={(e) => {
                if (e.target.checked) {
                  setFilters({ layout: 'sidebar', groups: [{ fields: [] }] });
                } else {
                  setFilters(undefined);
                }
              }}
              className="rounded border-surface-300 dark:border-zinc-700"
            />
            Enable
          </label>
        </div>
        {filters && (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Layout</label>
                <select
                  value={filters.layout}
                  onChange={(e) => setFilters({ ...filters, layout: e.target.value })}
                  className="px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
                >
                  <option value="sidebar">sidebar</option>
                  <option value="toolbar">toolbar</option>
                </select>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-surface-600 dark:text-zinc-400 mt-4">
                <input
                  type="checkbox"
                  checked={filters.persistent ?? false}
                  onChange={(e) => setFilters({ ...filters, persistent: e.target.checked || undefined })}
                  className="rounded border-surface-300 dark:border-zinc-700"
                />
                Persistent
              </label>
            </div>

            {/* Filter groups */}
            {(filters.groups || []).map((group, gi) => (
              <FilterGroupEditor
                key={gi}
                group={group}
                groupIndex={gi}
                availableFields={availableFields}
                onChange={(g) => {
                  const groups = [...(filters.groups || [])];
                  groups[gi] = g;
                  setFilters({ ...filters, groups });
                }}
                onRemove={() => {
                  setFilters({
                    ...filters,
                    groups: (filters.groups || []).filter((_, i) => i !== gi),
                  });
                }}
              />
            ))}
            <button
              onClick={() =>
                setFilters({
                  ...filters,
                  groups: [...(filters.groups || []), { fields: [] }],
                })
              }
              className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
            >
              <Plus className="w-3 h-3" />
              Add Filter Group
            </button>
          </div>
        )}
      </Card>

      {/* Actions */}
      <ActionsEditor
        actions={view.actions}
        bulkActions={view.bulk_actions}
        onChange={(actions) => onChange({ ...view, actions })}
        onBulkChange={(bulk_actions) => onChange({ ...view, bulk_actions: bulk_actions && bulk_actions.length > 0 ? bulk_actions : undefined })}
        roles={roles}
      />

      {/* Filter Presets */}
      {filters && (
        <FilterPresetsEditor
          presets={view.presets || []}
          onChange={(presets) => onChange({ ...view, presets: presets.length > 0 ? presets : undefined })}
          filterFields={(filters.groups || []).flatMap((g) => g.fields.map((f) => f.field))}
        />
      )}

      {/* Empty State */}
      <Card padding="sm">
        <h4 className="font-medium text-surface-900 dark:text-zinc-100 text-sm mb-3">Empty State</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Icon</label>
            <input
              type="text"
              value={view.empty?.icon || ''}
              onChange={(e) =>
                onChange({
                  ...view,
                  empty: { ...view.empty, title: view.empty?.title || '', icon: e.target.value || undefined },
                })
              }
              className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
              placeholder="lucide icon"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Title</label>
            <input
              type="text"
              value={view.empty?.title || ''}
              onChange={(e) =>
                onChange({
                  ...view,
                  empty: e.target.value
                    ? { ...view.empty, title: e.target.value }
                    : undefined,
                })
              }
              className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
              placeholder="No records found"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Message</label>
            <input
              type="text"
              value={view.empty?.message || ''}
              onChange={(e) =>
                onChange({
                  ...view,
                  empty: view.empty
                    ? { ...view.empty, message: e.target.value || undefined }
                    : undefined,
                })
              }
              className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
              placeholder="Optional description"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

// --- Filter Group sub-editor ---

function FilterGroupEditor({
  group,
  groupIndex,
  availableFields,
  onChange,
  onRemove,
}: {
  group: FilterGroup;
  groupIndex: number;
  availableFields: string[];
  onChange: (g: FilterGroup) => void;
  onRemove: () => void;
}) {
  const fields = group.fields || [];

  const addFilterField = () => {
    const unused = availableFields.filter((f) => !fields.some((ff) => ff.field === f));
    const field = unused[0] || '';
    if (!field) return;
    onChange({ ...group, fields: [...fields, { field, type: 'checkbox_group' }] });
  };

  return (
    <div className="border border-surface-200 dark:border-zinc-800 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={group.label || ''}
            onChange={(e) => onChange({ ...group, label: e.target.value || undefined })}
            className="px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs bg-white dark:bg-zinc-900"
            placeholder={`Group ${groupIndex + 1} label`}
          />
          <span className="text-xs text-surface-400 dark:text-zinc-500">({fields.length} filters)</span>
        </div>
        <button onClick={onRemove} className="p-1 text-surface-300 dark:text-zinc-600 hover:text-danger-500">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-1.5">
        {fields.map((ff, fi) => (
          <div key={fi} className="flex items-center gap-2">
            <select
              value={ff.field}
              onChange={(e) => {
                const next = [...fields];
                next[fi] = { ...ff, field: e.target.value };
                onChange({ ...group, fields: next });
              }}
              className="flex-1 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900 font-mono"
            >
              {availableFields.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <select
              value={ff.type}
              onChange={(e) => {
                const next = [...fields];
                next[fi] = { ...ff, type: e.target.value };
                onChange({ ...group, fields: next });
              }}
              className="w-36 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs bg-white dark:bg-zinc-900"
            >
              {FILTER_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button
              onClick={() =>
                onChange({ ...group, fields: fields.filter((_, i) => i !== fi) })
              }
              className="p-0.5 text-surface-300 dark:text-zinc-600 hover:text-danger-500"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addFilterField}
        className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 mt-2"
      >
        <Plus className="w-3 h-3" />
        Add Filter
      </button>
    </div>
  );
}

// --- Filter Presets Editor ---

function FilterPresetsEditor({
  presets,
  onChange,
  filterFields,
}: {
  presets: FilterPreset[];
  onChange: (p: FilterPreset[]) => void;
  filterFields: string[];
}) {
  const addPreset = () => {
    onChange([...presets, { label: 'New Preset', values: {} }]);
  };

  const updatePreset = (i: number, preset: FilterPreset) => {
    const next = [...presets];
    next[i] = preset;
    onChange(next);
  };

  const removePreset = (i: number) => {
    onChange(presets.filter((_, idx) => idx !== i));
  };

  return (
    <Card padding="sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-surface-900 dark:text-zinc-100 text-sm">Filter Presets</h4>
        <button
          onClick={addPreset}
          className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
        >
          <Plus className="w-3 h-3" />
          Add Preset
        </button>
      </div>
      <p className="text-[10px] text-surface-400 dark:text-zinc-500 mb-2">
        Quick filter buttons shown above the list. Each preset applies a set of filter values.
      </p>

      {presets.length === 0 ? (
        <p className="text-sm text-surface-400 dark:text-zinc-500 text-center py-2">No presets</p>
      ) : (
        <div className="space-y-2">
          {presets.map((preset, i) => (
            <div key={i} className="p-2 bg-surface-50 dark:bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={preset.label}
                  onChange={(e) => updatePreset(i, { ...preset, label: e.target.value })}
                  className="flex-1 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
                  placeholder="Preset label"
                />
                <button
                  onClick={() => removePreset(i)}
                  className="p-1 text-surface-400 dark:text-zinc-500 hover:text-danger-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-1">
                {filterFields.map((field) => (
                  <div key={field} className="flex items-center gap-2">
                    <span className="text-xs font-mono text-surface-500 dark:text-zinc-400 w-28 truncate">{field}</span>
                    <input
                      type="text"
                      value={String(preset.values[field] ?? '')}
                      onChange={(e) => {
                        const values = { ...preset.values };
                        if (e.target.value) {
                          values[field] = e.target.value;
                        } else {
                          delete values[field];
                        }
                        updatePreset(i, { ...preset, values });
                      }}
                      className="flex-1 px-2 py-0.5 border border-surface-300 dark:border-zinc-700 rounded text-xs bg-white dark:bg-zinc-900"
                      placeholder="filter value"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
