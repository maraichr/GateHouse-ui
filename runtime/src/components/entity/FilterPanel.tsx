import { FilterConfig, Field } from '../../types';
import { DateRangeFilter } from './filters/DateRangeFilter';
import { NumericRangeFilter } from './filters/NumericRangeFilter';
import { MultiSelectFilter } from './filters/MultiSelectFilter';

interface FilterPanelProps {
  config?: FilterConfig;
  fields?: Field[];
  filters: Record<string, any>;
  onFilterChange: (filters: Record<string, any>) => void;
}

export function FilterPanel({ config, fields, filters, onFilterChange }: FilterPanelProps) {
  if (!config || !config.groups?.length) return null;

  const fieldMap = new Map(fields?.map((f) => [f.name, f]) || []);

  return (
    <div className="space-y-4">
      {config.groups.map((group, gi) => (
        <div key={gi}>
          {group.label && (
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {group.label}
            </h4>
          )}
          {group.fields.map((ff) => {
            const field = fieldMap.get(ff.field);
            if (!field) return null;

            if (ff.type === 'checkbox_group' && field.values) {
              return (
                <div key={ff.field} className="space-y-1">
                  {field.values.map((v) => (
                    <label key={v.value} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Array.isArray(filters[ff.field])
                          ? filters[ff.field].includes(v.value)
                          : false}
                        onChange={(e) => {
                          const current = Array.isArray(filters[ff.field]) ? [...filters[ff.field]] : [];
                          if (e.target.checked) {
                            current.push(v.value);
                          } else {
                            const idx = current.indexOf(v.value);
                            if (idx >= 0) current.splice(idx, 1);
                          }
                          onFilterChange({ ...filters, [ff.field]: current.length ? current : undefined });
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{v.label}</span>
                    </label>
                  ))}
                </div>
              );
            }

            if (ff.type === 'select' && field.values) {
              return (
                <select
                  key={ff.field}
                  value={filters[ff.field] || ''}
                  onChange={(e) =>
                    onFilterChange({ ...filters, [ff.field]: e.target.value || undefined })
                  }
                  className="w-full border border-gray-300 rounded-md text-sm py-1.5 px-2"
                >
                  <option value="">All</option>
                  {field.values.map((v) => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
              );
            }

            if (ff.type === 'multi_select' && field.values) {
              return (
                <MultiSelectFilter
                  key={ff.field}
                  field={ff.field}
                  values={field.values}
                  selected={Array.isArray(filters[ff.field]) ? filters[ff.field] : []}
                  onChange={(selected) =>
                    onFilterChange({ ...filters, [ff.field]: selected.length ? selected : undefined })
                  }
                  searchable={ff.searchable}
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

            if (ff.type === 'numeric_range' || ff.type === 'range') {
              return (
                <NumericRangeFilter
                  key={ff.field}
                  field={ff.field}
                  value={filters[ff.field]}
                  onChange={(val) => onFilterChange({ ...filters, [ff.field]: val })}
                  min={ff.min}
                  max={ff.max}
                  step={ff.step}
                />
              );
            }

            return (
              <div key={ff.field} className="text-xs text-gray-400">
                {ff.type} filter for {ff.field}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
