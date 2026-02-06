import { useState, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../layout/PageHeader';
import { DataTable } from './DataTable';
import { SearchBar } from './SearchBar';
import { FilterPanel } from './FilterPanel';
import { EmptyState } from './EmptyState';
import { useEntityList } from '../../data/useEntityList';
import { usePermissions } from '../../auth/usePermissions';
import { Icon } from '../../utils/icons';
import { ListColumn, Field, FilterConfig, SearchConfig, EmptyStateConfig, SortConfig } from '../../types';

interface EntityListProps {
  entity?: string;
  api_resource?: string;
  display_name?: string;
  label_field?: string;
  icon?: string;
  title?: string;
  default_sort?: SortConfig;
  actions?: { primary?: any[]; secondary?: any[] };
  bulk_actions?: any[];
  children?: ReactNode;
  // From child nodes (extracted by renderer)
  columns?: ListColumn[];
  fields?: Field[];
  filters?: FilterConfig;
  search?: SearchConfig;
  empty?: EmptyStateConfig;
}

export function EntityList({
  entity,
  api_resource,
  display_name,
  icon,
  title,
  default_sort,
  actions,
  children,
}: EntityListProps) {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  const { data, isLoading, isError } = useEntityList({
    apiResource: api_resource || '',
    search,
    filters,
    sort: default_sort ? { field: default_sort.field, order: default_sort.order } : undefined,
  });

  const handleSearchChange = useCallback((value: string) => setSearch(value), []);
  const handleFilterChange = useCallback((f: Record<string, any>) => setFilters(f), []);

  const primaryActions = actions?.primary?.filter(
    (a: any) => !a.permissions || hasPermission(a.permissions)
  );

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={title || display_name || entity || 'List'}
        icon={icon}
        actions={
          primaryActions?.length ? (
            <>
              {primaryActions.map((action: any, i: number) => (
                <button
                  key={i}
                  onClick={() => {
                    if (action.action?.type === 'navigate') {
                      navigate(action.action.path);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  {action.icon && <Icon name={action.icon} className="h-4 w-4" />}
                  {action.label}
                </button>
              ))}
            </>
          ) : undefined
        }
      />
      <div className="flex-1 p-6">
        {children}
        {/* If no data is loaded yet and no children override, show loading / mock state */}
        {!children && (
          <div className="text-sm text-gray-500">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
              </div>
            ) : isError ? (
              <div className="text-center py-12 text-gray-400">
                <p>Connect to an API backend to see data here</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
