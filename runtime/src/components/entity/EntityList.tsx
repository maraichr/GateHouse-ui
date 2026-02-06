import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../layout/PageHeader';
import { DataTable } from './DataTable';
import { SearchBar } from './SearchBar';
import { FilterPanel } from './FilterPanel';
import { EmptyState } from './EmptyState';
import { FilterPresets } from './filters/FilterPresets';
import { useEntityList } from '../../data/useEntityList';
import { usePermissions } from '../../auth/usePermissions';
import { Icon } from '../../utils/icons';
import { ComponentNode, ListColumn, Field, FilterConfig, SearchConfig, EmptyStateConfig, SortConfig } from '../../types';

interface FilterPresetConfig {
  label: string;
  filters: Record<string, any>;
}

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
  filter_presets?: FilterPresetConfig[];
  childNodes?: ComponentNode[];
}

export function EntityList({
  entity,
  api_resource,
  display_name,
  icon,
  title,
  default_sort,
  actions,
  filter_presets,
  childNodes,
}: EntityListProps) {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [page, setPage] = useState(1);

  // Extract config from child nodes
  let columns: ListColumn[] | undefined;
  let fields: Field[] | undefined;
  let filterConfig: FilterConfig | undefined;
  let filterFields: Field[] | undefined;
  let searchConfig: SearchConfig | undefined;
  let emptyConfig: EmptyStateConfig | undefined;

  if (childNodes) {
    for (const child of childNodes) {
      switch (child.kind) {
        case 'data_table':
          columns = child.props?.columns;
          fields = child.props?.fields;
          break;
        case 'filter_panel':
          filterConfig = child.props?.config;
          filterFields = child.props?.fields;
          break;
        case 'search_bar':
          searchConfig = child.props?.config;
          break;
        case 'empty_state':
          emptyConfig = child.props?.config;
          break;
      }
    }
  }

  const { data, isLoading, isError } = useEntityList({
    apiResource: api_resource || '',
    search,
    filters,
    sort: default_sort ? { field: default_sort.field, order: default_sort.order } : undefined,
    page,
  });

  const records = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 25;
  const totalPages = Math.ceil(total / pageSize);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((f: Record<string, any>) => {
    setFilters(f);
    setPage(1);
  }, []);

  const primaryActions = actions?.primary?.filter(
    (a: any) => !a.permissions || hasPermission(a.permissions)
  );

  // Derive entity route for DataTable detail links
  const entityRoute = api_resource || '';

  const hasSidebarFilters = filterConfig?.layout === 'sidebar';
  const hasToolbarFilters = filterConfig && filterConfig.layout !== 'sidebar';

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
                  className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(0.9)'}
                  onMouseLeave={(e) => e.currentTarget.style.filter = ''}
                >
                  {action.icon && <Icon name={action.icon} className="h-4 w-4" />}
                  {action.label}
                </button>
              ))}
            </>
          ) : undefined
        }
      />

      {filter_presets && filter_presets.length > 0 && (
        <div className="px-6 pt-3">
          <FilterPresets
            presets={filter_presets}
            activeFilters={filters}
            onSelect={handleFilterChange}
          />
        </div>
      )}

      {/* Toolbar: search + inline filters (skip search here when sidebar layout has it) */}
      {((!hasSidebarFilters && searchConfig) || hasToolbarFilters) && (
        <div className="px-6 pt-4 flex items-start gap-4">
          {searchConfig && !hasSidebarFilters && (
            <div className="flex-1 max-w-md">
              <SearchBar config={searchConfig} value={search} onChange={handleSearchChange} />
            </div>
          )}
          {hasToolbarFilters && (
            <FilterPanel
              config={filterConfig}
              fields={filterFields}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          )}
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        {/* Sidebar filters */}
        {hasSidebarFilters && (
          <div className="w-64 flex-shrink-0 border-r border-gray-200 p-4 overflow-y-auto">
            {searchConfig && (
              <div className="mb-4">
                <SearchBar config={searchConfig} value={search} onChange={handleSearchChange} />
              </div>
            )}
            <FilterPanel
              config={filterConfig}
              fields={filterFields}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>
        )}

        {/* Main content area */}
        <div className="flex-1 p-6 overflow-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-t-transparent rounded-full" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
            </div>
          ) : isError ? (
            <div className="text-center py-12 text-gray-400">
              <p>Unable to load data. Check your API connection.</p>
            </div>
          ) : records.length === 0 ? (
            emptyConfig ? (
              <EmptyState config={emptyConfig} />
            ) : (
              <div className="text-center py-12 text-gray-500">No records found</div>
            )
          ) : (
            <>
              <DataTable
                columns={columns}
                fields={fields}
                data={records}
                entityRoute={entityRoute}
              />
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                  <span>
                    Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span>
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
