import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { FilterConfig, FilterField as FilterFieldConfig, Field, FilterValue } from '../../types';
import { DateRangeFilter } from './filters/DateRangeFilter';
import { NumericRangeFilter } from './filters/NumericRangeFilter';
import { MultiSelectFilter } from './filters/MultiSelectFilter';
import { semanticBadgeStyle } from '../../utils/semanticColor';
import { entityToResource } from '../../utils/entityResource';
import { useEntityList } from '../../data/useEntityList';

interface FilterPanelProps {
  config?: FilterConfig;
  fields?: Field[];
  filters: Record<string, FilterValue>;
  onFilterChange: (filters: Record<string, FilterValue>) => void;
  layout?: 'toolbar' | 'sidebar';
}

const pillActiveStyle = {
  ...semanticBadgeStyle('primary'),
  borderColor: 'color-mix(in srgb, var(--color-primary) 40%, transparent)',
};

const pillInactiveStyle = {
  color: 'var(--color-text-secondary, var(--color-text-muted))',
  borderColor: 'var(--color-border)',
  backgroundColor: 'color-mix(in srgb, var(--color-text-muted) 6%, transparent)',
};

export function FilterPanel({ config, fields, filters, onFilterChange, layout }: FilterPanelProps) {
  if (!config || !config.groups?.length) return null;

  const isToolbar = layout === 'toolbar';
  const fieldMap = new Map(fields?.map((f) => [f.name, f]) || []);

  return (
    <div className={isToolbar ? 'flex items-center gap-5 flex-wrap' : 'space-y-4'}>
      {config.groups.map((group, gi) => (
        <div key={gi} className={isToolbar ? 'flex items-center gap-3' : ''}>
          {group.label && !isToolbar && (
            <h4
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {group.label}
            </h4>
          )}
          {isToolbar ? (
            <div className="flex items-center gap-3 flex-wrap">
              {group.fields.map((ff) => {
                const field = fieldMap.get(ff.field);
                if (!field) return null;
                return (
                  <ToolbarFilterField
                    key={ff.field}
                    ff={ff}
                    field={field}
                    filters={filters}
                    onFilterChange={onFilterChange}
                  />
                );
              })}
            </div>
          ) : (
            group.fields.map((ff) => {
              const field = fieldMap.get(ff.field);
              if (!field) return null;
              return (
                <SidebarFilterField
                  key={ff.field}
                  ff={ff}
                  field={field}
                  filters={filters}
                  onFilterChange={onFilterChange}
                />
              );
            })
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Toolbar filter rendering ─────────────────────────────────────── */

function ToolbarFilterField({
  ff,
  field,
  filters,
  onFilterChange,
}: {
  ff: FilterFieldConfig;
  field: Field;
  filters: Record<string, FilterValue>;
  onFilterChange: (f: Record<string, FilterValue>) => void;
}) {
  // checkbox_group → toggle pills
  if (ff.type === 'checkbox_group' && field.values) {
    return <TogglePills field={ff.field} values={field.values} filters={filters} onFilterChange={onFilterChange} />;
  }

  // select → dropdown (static values, ff.options, or reference fetch)
  if (ff.type === 'select') {
    return (
      <SelectFilter
        ff={ff}
        field={field}
        filters={filters}
        onFilterChange={onFilterChange}
        isToolbar
      />
    );
  }

  // multi_select, date_range, numeric_range — render same as sidebar but with toolbar width
  return <SidebarFilterField ff={ff} field={field} filters={filters} onFilterChange={onFilterChange} />;
}

/* ── Toggle pills (toolbar checkbox_group replacement) ────────────── */

function TogglePills({
  field,
  values,
  filters,
  onFilterChange,
}: {
  field: string;
  values: { value: string; label: string }[];
  filters: Record<string, FilterValue>;
  onFilterChange: (f: Record<string, FilterValue>) => void;
}) {
  const selected: string[] = Array.isArray(filters[field]) ? (filters[field] as string[]) : [];

  const toggle = (value: string) => {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onFilterChange({ ...filters, [field]: next.length ? next : undefined });
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {values.map((v) => {
        const active = selected.includes(v.value);
        return (
          <button
            key={v.value}
            type="button"
            onClick={() => toggle(v.value)}
            aria-pressed={active}
            className="px-2.5 py-1 text-xs font-medium rounded-full border cursor-pointer interactive-hover"
            style={active ? pillActiveStyle : pillInactiveStyle}
          >
            {v.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Select filter (static values, ff.options, or reference fetch) ── */

function SelectFilter({
  ff,
  field,
  filters,
  onFilterChange,
  isToolbar,
}: {
  ff: FilterFieldConfig;
  field: Field;
  filters: Record<string, FilterValue>;
  onFilterChange: (f: Record<string, FilterValue>) => void;
  isToolbar?: boolean;
}) {
  // Static values from field definition
  if (field.values) {
    return (
      <select
        value={filters[ff.field] || ''}
        onChange={(e) => onFilterChange({ ...filters, [ff.field]: e.target.value || undefined })}
        className={`border rounded-md text-sm py-1.5 px-2 ${isToolbar ? 'w-auto min-w-[140px]' : 'w-full'}`}
        style={{ borderColor: 'var(--color-border)' }}
      >
        <option value="">All</option>
        {field.values.map((v) => (
          <option key={v.value} value={v.value}>{v.label}</option>
        ))}
      </select>
    );
  }

  // Options defined inline in filter config
  if (ff.options) {
    const options = ff.options.map((o) =>
      typeof o === 'string' ? { value: o, label: o } : { value: o.value ?? '', label: o.label ?? o.value ?? '' }
    );
    return (
      <select
        value={filters[ff.field] || ''}
        onChange={(e) => onFilterChange({ ...filters, [ff.field]: e.target.value || undefined })}
        className={`border rounded-md text-sm py-1.5 px-2 ${isToolbar ? 'w-auto min-w-[140px]' : 'w-full'}`}
        style={{ borderColor: 'var(--color-border)' }}
      >
        <option value="">All</option>
        {options.map((v) => (
          <option key={v.value} value={v.value}>{v.label}</option>
        ))}
      </select>
    );
  }

  // Reference field — fetch options from API
  if (field.type === 'reference' && field.entity) {
    return (
      <ReferenceSelectFilter
        field={field}
        filterField={ff.field}
        value={filters[ff.field]}
        onChange={(val) => onFilterChange({ ...filters, [ff.field]: val })}
        isToolbar={isToolbar}
      />
    );
  }

  // Fallback
  return (
    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
      {ff.type} filter for {ff.field}
    </div>
  );
}

/* ── Reference select (fetches options from API) ──────────────────── */

function ReferenceSelectFilter({
  field,
  filterField,
  value,
  onChange,
  isToolbar,
}: {
  field: Field;
  filterField: string;
  value: string | undefined;
  onChange: (val: string | undefined) => void;
  isToolbar?: boolean;
}) {
  const apiResource = entityToResource(field.entity!);
  const { data, isLoading } = useEntityList({ apiResource, pageSize: 100 });
  const records = data?.data ?? [];

  const getLabelValue = (record: Record<string, any>): string => {
    if (record.name) return String(record.name);
    if (record.company_name) return String(record.company_name);
    if (record.display_name) return String(record.display_name);
    if (record.title) return String(record.title);
    for (const val of Object.values(record)) {
      if (typeof val === 'string' && val.length > 0) return val;
    }
    return String(record.id ?? '—');
  };

  const placeholder = field.display_name || field.entity || filterField.replace(/_id$/, '').replace(/_/g, ' ');

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      disabled={isLoading}
      className={`border rounded-md text-sm py-1.5 px-2 ${isToolbar ? 'w-auto min-w-[140px]' : 'w-full'}`}
      style={{ borderColor: 'var(--color-border)' }}
    >
      <option value="">
        {isLoading ? 'Loading...' : `All ${placeholder}s`}
      </option>
      {records.map((record) => (
        <option key={record.id} value={record.id}>
          {getLabelValue(record)}
        </option>
      ))}
    </select>
  );
}

/* ── Reference multi-select (fetches options from API) ────────────── */

function ReferenceMultiSelectFilter({
  entity,
  labelField,
  filterField,
  selected,
  onChange,
  searchable,
}: {
  entity: string;
  labelField?: string;
  filterField: string;
  selected: string[];
  onChange: (selected: string[]) => void;
  searchable?: boolean;
}) {
  const apiResource = entityToResource(entity);
  const { data, isLoading } = useEntityList({ apiResource, pageSize: 200 });
  const records = data?.data ?? [];

  const options: { value: string; label: string }[] = records.map((rec) => {
    const label = labelField && rec[labelField]
      ? rec[labelField]
      : rec.name ?? rec.display_name ?? rec.title ?? rec.id ?? '';
    // Use code/abbreviation as value when available (parent records often store
    // the short code rather than the UUID — e.g. trade_codes: ["ELEC"] not ["trade-001"])
    const value = rec.code ?? rec.abbreviation ?? rec.id;
    return { value: String(value), label: String(label) };
  });

  if (isLoading) {
    return (
      <div className="text-xs py-1" style={{ color: 'var(--color-text-muted)' }}>
        Loading {filterField.replace(/_/g, ' ')}…
      </div>
    );
  }

  if (options.length > 0) {
    return (
      <MultiSelectFilter
        field={filterField}
        values={options}
        selected={selected}
        onChange={onChange}
        searchable={searchable}
      />
    );
  }

  return null;
}

/* ── Sidebar filter rendering ─────────────────────────────────────── */

function SidebarFilterField({
  ff,
  field,
  filters,
  onFilterChange,
}: {
  ff: FilterFieldConfig;
  field: Field;
  filters: Record<string, FilterValue>;
  onFilterChange: (f: Record<string, FilterValue>) => void;
}) {
  if (ff.type === 'checkbox_group' && field.values) {
    return <TogglePills field={ff.field} values={field.values} filters={filters} onFilterChange={onFilterChange} />;
  }

  if (ff.type === 'select') {
    return (
      <SelectFilter ff={ff} field={field} filters={filters} onFilterChange={onFilterChange} />
    );
  }

  if (ff.type === 'multi_select') {
    const options: { value: string; label: string }[] =
      field.values ??
      (ff.options?.map((o: any) =>
        typeof o === 'string' ? { value: o, label: o } : { value: o.value ?? '', label: o.label ?? o.value ?? '' }
      ) ?? []);

    if (options.length > 0) {
      return (
        <MultiSelectFilter
          key={ff.field}
          field={ff.field}
          values={options}
          selected={Array.isArray(filters[ff.field]) ? filters[ff.field] : []}
          onChange={(selected) =>
            onFilterChange({ ...filters, [ff.field]: selected.length ? selected : undefined })
          }
          searchable={ff.searchable}
        />
      );
    }

    // Reference array field — fetch options from API
    const refEntity = field.entity || field.items?.entity;
    if (refEntity) {
      return (
        <ReferenceMultiSelectFilter
          key={ff.field}
          entity={refEntity}
          labelField={field.items?.label_field}
          filterField={ff.field}
          selected={Array.isArray(filters[ff.field]) ? filters[ff.field] : []}
          onChange={(selected) =>
            onFilterChange({ ...filters, [ff.field]: selected.length ? selected : undefined })
          }
          searchable={ff.searchable}
        />
      );
    }

    return (
      <FreeformTagFilter
        key={ff.field}
        field={ff.field}
        selected={Array.isArray(filters[ff.field]) ? filters[ff.field] : []}
        onChange={(selected) =>
          onFilterChange({ ...filters, [ff.field]: selected.length ? selected : undefined })
        }
      />
    );
  }

  if (ff.type === 'date_range') {
    return (
      <DateRangeFilter
        key={ff.field}
        field={ff.field}
        value={filters[ff.field]}
        onChange={(val) => onFilterChange({ ...filters, [ff.field]: val })}
        presets={ff.presets}
      />
    );
  }

  if (ff.type === 'numeric_range' || ff.type === 'range' || ff.type === 'range_slider') {
    return (
      <NumericRangeFilter
        key={ff.field}
        field={ff.field}
        value={filters[ff.field]}
        onChange={(val) => onFilterChange({ ...filters, [ff.field]: val })}
        min={ff.min}
        max={ff.max}
        step={ff.step}
        slider={ff.type === 'range_slider'}
      />
    );
  }

  return (
    <div key={ff.field} className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
      {ff.type} filter for {ff.field}
    </div>
  );
}

/* ── Freeform tag filter (unchanged) ──────────────────────────────── */

function FreeformTagFilter({
  field,
  selected,
  onChange,
}: {
  field: string;
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    setInput('');
  };

  return (
    <div>
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          placeholder={`Add ${field.replace(/_/g, ' ')}…`}
          className="flex-1 border rounded-md text-sm py-1.5 px-2"
          style={{ borderColor: 'var(--color-border)' }}
        />
        <button
          type="button"
          onClick={addTag}
          className="p-1.5"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {selected.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded-full"
              style={semanticBadgeStyle('primary')}
            >
              {tag}
              <button type="button" onClick={() => onChange(selected.filter((t) => t !== tag))}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
