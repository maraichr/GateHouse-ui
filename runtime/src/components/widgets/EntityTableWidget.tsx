import { Link } from 'react-router-dom';
import { useEntityList } from '../../data/useEntityList';
import { ArrowRight } from 'lucide-react';

interface WidgetQuery {
  filter?: Record<string, any>;
  sort?: { field: string; order: string };
  limit?: number;
}

interface EntityTableWidgetProps {
  title?: string;
  entity?: string;
  api_resource?: string;
  columns?: string[] | { field: string }[];
  query?: WidgetQuery;
  link?: string;
  children?: any;
}

function resolveApiResource(entity?: string, api_resource?: string): string {
  if (api_resource) return api_resource;
  if (!entity) return '';
  return '/' + entity
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/\s+/g, '-') + 's';
}

function normalizeColumns(columns?: string[] | { field: string }[]): string[] {
  if (!columns) return [];
  return columns.map((c) => (typeof c === 'string' ? c : c.field));
}

export function EntityTableWidget({
  title,
  entity,
  api_resource,
  columns,
  query,
  link,
}: EntityTableWidgetProps) {
  const resource = resolveApiResource(entity, api_resource);
  const { data, isLoading } = useEntityList({
    apiResource: resource,
    sort: query?.sort,
    filters: query?.filter,
    pageSize: query?.limit || 5,
  });

  const rows = data?.data || [];
  const displayColumns = normalizeColumns(columns);

  return (
    <div className="rounded-lg border surface-card" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{title || entity || 'Records'}</h3>
        {link && (
          <Link to={link} className="text-xs flex items-center gap-1" style={{ color: 'var(--color-primary)' }}>
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      {isLoading ? (
        <div className="p-4">
          <div className="animate-pulse space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 rounded" style={{ backgroundColor: 'var(--color-bg-alt)' }} />
            ))}
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className="p-4 text-sm text-center" style={{ color: 'var(--color-text-faint)' }}>No records</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--color-border-light)' }}>
                {displayColumns.map((col) => (
                  <th key={col} className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any, ri: number) => (
                <tr key={row.id || ri} className="border-b transition-colors"
                  style={{ borderColor: 'var(--color-border-light)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
                >
                  {displayColumns.map((col) => (
                    <td key={col} className="px-4 py-2" style={{ color: 'var(--color-text-secondary)' }}>
                      {formatCellValue(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatCellValue(value: any): string {
  if (value == null) return '\u2014';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
