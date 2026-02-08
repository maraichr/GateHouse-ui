import { useEntityList } from '../../data/useEntityList';
import { Relationship } from '../../types';
import { entityToResource } from '../../utils/entityResource';

interface RelationshipTableProps {
  relationship: Relationship;
  parentId: string;
  columns?: string[];
}

export function RelationshipTable({ relationship, parentId, columns }: RelationshipTableProps) {
  const foreignKey = relationship.foreign_key || '';
  const apiResource = entityToResource(relationship.entity);

  const { data, isLoading, isError } = useEntityList({
    apiResource,
    filters: foreignKey ? { [foreignKey]: parentId } : {},
  });

  const records = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-5 w-5 border-2 rounded-full" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (isError) {
    return <div className="text-center py-8" style={{ color: 'var(--color-text-faint)' }}>Unable to load related data</div>;
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
        No {relationship.display_name || relationship.name} found
      </div>
    );
  }

  const displayCols = columns && columns.length > 0
    ? columns
    : Object.keys(records[0]).filter((k) => k !== 'id' && !k.endsWith('_id'));

  return (
    <div className="overflow-x-auto border rounded-lg surface-card" style={{ borderColor: 'var(--color-border)' }}>
      <table className="min-w-full divide-y" style={{ '--tw-divide-color': 'var(--color-border)' } as React.CSSProperties}>
        <thead style={{ backgroundColor: 'var(--color-bg-alt)' }}>
          <tr>
            {displayCols.map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {col.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y" style={{ backgroundColor: 'var(--color-surface)', '--tw-divide-color': 'var(--color-border)' } as React.CSSProperties}>
          {records.map((rec: any, i: number) => (
            <tr key={rec.id || i} className="transition-colors" style={{ cursor: 'default' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
            >
              {displayCols.map((col) => (
                <td key={col} className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: 'var(--color-text)' }}>
                  {formatValue(rec[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatValue(val: any): string {
  if (val == null) return '—';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}
