import { useEntityList } from '../../data/useEntityList';
import { Relationship } from '../../types';

interface RelationshipTableProps {
  relationship: Relationship;
  parentId: string;
  columns?: string[];
}

// Map entity names to API resource paths
// This handles cases like "WorkOrder" -> "/work-orders"
function entityToResource(entityName: string): string {
  // Convert PascalCase to kebab-case and pluralize
  const kebab = entityName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
  return `/${kebab}s`;
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
        <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isError) {
    return <div className="text-center py-8 text-gray-400">Unable to load related data</div>;
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No {relationship.display_name || relationship.name} found
      </div>
    );
  }

  // Determine which columns to display
  const displayCols = columns && columns.length > 0
    ? columns
    : Object.keys(records[0]).filter((k) => k !== 'id' && !k.endsWith('_id'));

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {displayCols.map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {records.map((rec: any, i: number) => (
            <tr key={rec.id || i} className="hover:bg-gray-50">
              {displayCols.map((col) => (
                <td key={col} className="px-4 py-3 text-sm whitespace-nowrap text-gray-900">
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
