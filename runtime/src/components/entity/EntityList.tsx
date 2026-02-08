import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { PageHeader } from '../layout/PageHeader';
import { DataTable } from './DataTable';
import { SearchBar } from './SearchBar';
import { FilterPanel } from './FilterPanel';
import { EmptyState } from './EmptyState';
import { FilterPresets } from './filters/FilterPresets';

import { FilterSheet } from './FilterSheet';
import { useEntityList } from '../../data/useEntityList';
import { usePermissions } from '../../auth/usePermissions';
import { useIsMobile } from '../../hooks/useIsMobile';
import { Icon } from '../../utils/icons';
import { TableSkeleton } from '../shared/Skeleton';
import { ComponentNode, ListColumn, Field, FilterConfig, SearchConfig, EmptyStateConfig, SortConfig, FilterValue, EntityAction } from '../../types';
import { Button } from '../shared/Button';

interface FilterPresetConfig {
  label: string;
  filters: Record<string, FilterValue>;
}

interface EntityListProps {
  entity?: string;
  api_resource?: string;
  display_name?: string;
  label_field?: string;
  icon?: string;
  title?: string;
  default_sort?: SortConfig;
  actions?: { primary?: EntityAction[]; secondary?: EntityAction[] };
  bulk_actions?: EntityAction[];
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
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, FilterValue>>({});
  const [page, setPage] = useState(1);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Reset local state when navigating to a different entity list
  const prevResource = useRef(api_resource);
  useEffect(() => {
    if (prevResource.current !== api_resource) {
      prevResource.current = api_resource;
      setSearch('');
      setFilters({});
      setPage(1);
      setFilterSheetOpen(false);
    }
  }, [api_resource]);

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

  const handleFilterChange = useCallback((f: Record<string, FilterValue>) => {
    setFilters(f);
    setPage(1);
  }, []);


  const primaryActions = actions?.primary?.filter(
    (a) => !a.permissions || hasPermission(a.permissions)
  );

  // Derive entity route for DataTable detail links
  const entityRoute = api_resource || '';

  const filterLayout = typeof filterConfig?.layout === 'object'
    ? (filterConfig.layout as { web?: string })?.web ?? filterConfig.layout
    : filterConfig?.layout;
  const hasSidebarFilters = filterLayout === 'sidebar';
  const hasToolbarFilters = filterConfig && filterLayout !== 'sidebar';

  const activeFilterCount = Object.keys(filters).filter((k) => filters[k] !== undefined).length;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={title || display_name || entity || 'List'}
        icon={icon}
        actions={
          (isMobile && filterConfig) || primaryActions?.length ? (
            <>
              {/* Mobile filter button */}
              {isMobile && filterConfig && (
                <Button
                  variant="outlined"
                  color="neutral"
                  size="sm"
                  icon={<Filter className="h-4 w-4" />}
                  onClick={() => setFilterSheetOpen(true)}
                >
                  Filters
                  {activeFilterCount > 0 && (
                    <span
                      className="ml-1 inline-flex items-center justify-center h-4 min-w-[16px] px-1 text-[10px] font-bold rounded-full"
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        color: '#fff',
                      }}
                    >
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              )}
              {primaryActions?.map((action, i) => (
                <Button
                  key={i}
                  variant="filled"
                  color="primary"
                  icon={action.icon ? <Icon name={action.icon} className="h-4 w-4" /> : undefined}
                  onClick={() => {
                    if (action.action?.type === 'navigate' && action.action.path) {
                      navigate(action.action.path);
                    }
                  }}
                >
                  {action.label}
                </Button>
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

      {/* Toolbar: search + inline filters */}
      {((!hasSidebarFilters && searchConfig && !isMobile) || (hasToolbarFilters && !isMobile)) && (
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
              layout="toolbar"
            />
          )}
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        {/* Sidebar filters — desktop only */}
        {hasSidebarFilters && !isMobile && (
          <div
            className="w-64 flex-shrink-0 border-r p-4 overflow-y-auto"
            style={{ borderColor: 'var(--color-border-light, var(--color-border))' }}
          >
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
              layout="sidebar"
            />
          </div>
        )}

        {/* Main content area */}
        <div className="flex-1 p-6 overflow-auto">
          {isLoading ? (
            <div role="status" aria-live="polite">
              <span className="sr-only">Loading...</span>
              <TableSkeleton rows={5} cols={columns?.length || 4} />
            </div>
          ) : isError ? (
            <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
              <p>Unable to load data. Check your API connection.</p>
            </div>
          ) : records.length === 0 ? (
            emptyConfig ? (
              <EmptyState config={emptyConfig} />
            ) : (
              <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>No records found</div>
            )
          ) : (
            <div className="animate-fadeIn">
              <div role="status" aria-live="polite" className="sr-only">
                Showing {records.length} of {total} results
              </div>
              <DataTable
                columns={columns}
                fields={fields}
                data={records}
                entityRoute={entityRoute}
              />
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  <span>
                    Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outlined"
                      color="neutral"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <span>
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outlined"
                      color="neutral"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter bottom sheet */}
      {isMobile && (
        <FilterSheet
          open={filterSheetOpen}
          onClose={() => setFilterSheetOpen(false)}
          filterConfig={filterConfig}
          filterFields={filterFields}
          filters={filters}
          onFilterChange={handleFilterChange}
          searchConfig={searchConfig}
          search={search}
          onSearchChange={handleSearchChange}
        />
      )}
    </div>
  );
}
