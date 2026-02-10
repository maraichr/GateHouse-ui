import { Columns3, Search, Filter, ArrowUpDown, AlertCircle, MousePointer2 } from 'lucide-react';
import { Badge } from '../utility/Badge';
import type { ListView, Entity } from '../../types';

interface ListViewPreviewProps {
  listView: ListView;
  entity: Entity;
}

export function ListViewPreview({ listView, entity }: ListViewPreviewProps) {
  const fieldMap = new Map((entity.fields || []).map((f) => [f.name, f]));

  return (
    <div className="space-y-4">
      {/* Toolbar schematic */}
      <div className="bg-surface-50 dark:bg-zinc-800/50 rounded-lg border border-surface-200 dark:border-zinc-800 p-3">
        <div className="text-[10px] uppercase tracking-wider text-surface-400 dark:text-zinc-500 mb-2">Toolbar</div>
        <div className="flex items-center gap-3 flex-wrap">
          {listView.search && (
            <div className="flex items-center gap-1.5 text-xs text-surface-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-surface-200 dark:border-zinc-700 rounded px-2 py-1">
              <Search className="w-3 h-3" />
              <span>{listView.search.placeholder || 'Search...'}</span>
              <span className="text-surface-400 dark:text-zinc-500 ml-1">({listView.search.fields.length} fields)</span>
            </div>
          )}
          {listView.filters && (
            <div className="flex items-center gap-1.5 text-xs text-surface-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-surface-200 dark:border-zinc-700 rounded px-2 py-1">
              <Filter className="w-3 h-3" />
              <span>{listView.filters.layout} layout</span>
              <span className="text-surface-400 dark:text-zinc-500 ml-1">
                ({listView.filters.groups.reduce((a, g) => a + g.fields.length, 0)} filters)
              </span>
            </div>
          )}
          {listView.default_sort && (
            <div className="flex items-center gap-1.5 text-xs text-surface-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-surface-200 dark:border-zinc-700 rounded px-2 py-1">
              <ArrowUpDown className="w-3 h-3" />
              <span>{listView.default_sort.field}</span>
              <Badge color="gray">{listView.default_sort.order}</Badge>
            </div>
          )}
        </div>
      </div>

      {/* Columns schematic */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-surface-500 dark:text-zinc-400 mb-2">
          <Columns3 className="w-3.5 h-3.5" />
          Columns ({listView.columns.length})
        </div>
        <div className="surface-card overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface-50 dark:bg-zinc-800/50 border-b border-surface-200 dark:border-zinc-800">
                <th className="text-left px-3 py-1.5 font-medium text-surface-600 dark:text-zinc-400">#</th>
                <th className="text-left px-3 py-1.5 font-medium text-surface-600 dark:text-zinc-400">Field</th>
                <th className="text-left px-3 py-1.5 font-medium text-surface-600 dark:text-zinc-400">Type</th>
                <th className="text-left px-3 py-1.5 font-medium text-surface-600 dark:text-zinc-400">Width</th>
                <th className="text-left px-3 py-1.5 font-medium text-surface-600 dark:text-zinc-400">Fixed</th>
                <th className="text-left px-3 py-1.5 font-medium text-surface-600 dark:text-zinc-400">Link</th>
              </tr>
            </thead>
            <tbody>
              {listView.columns.map((col, i) => {
                const field = fieldMap.get(col.field);
                return (
                  <tr key={i} className="border-b border-surface-100 dark:border-zinc-800/50 last:border-0">
                    <td className="px-3 py-1.5 text-surface-400 dark:text-zinc-500">{i + 1}</td>
                    <td className="px-3 py-1.5 font-medium text-surface-800 dark:text-zinc-200">
                      {field?.display_name || col.field}
                      {!field && <span className="text-amber-500 ml-1" title="Computed / external field">*</span>}
                    </td>
                    <td className="px-3 py-1.5 text-surface-500 dark:text-zinc-400">{field?.type || '—'}</td>
                    <td className="px-3 py-1.5 text-surface-500 dark:text-zinc-400">{col.width ? String(col.width) : 'auto'}</td>
                    <td className="px-3 py-1.5 text-surface-500 dark:text-zinc-400">{col.fixed || '—'}</td>
                    <td className="px-3 py-1.5">
                      {col.link_to ? (
                        <Badge color="blue">{col.link_to}</Badge>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filters detail */}
      {listView.filters && listView.filters.groups.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-xs text-surface-500 dark:text-zinc-400 mb-2">
            <Filter className="w-3.5 h-3.5" />
            Filters — <Badge color="gray">{listView.filters.layout}</Badge>
            {listView.filters.persistent && <Badge color="blue">persistent</Badge>}
          </div>
          <div className="space-y-2">
            {listView.filters.groups.map((group, gi) => (
              <div key={gi} className="bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-800 p-3">
                {group.label && (
                  <div className="text-xs font-medium text-surface-700 dark:text-zinc-300 mb-1.5">{group.label}</div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {group.fields.map((ff, fi) => (
                    <div key={fi} className="text-xs bg-surface-50 dark:bg-zinc-800/50 border border-surface-200 dark:border-zinc-700 rounded px-2 py-1 flex items-center gap-1.5">
                      <span className="font-medium text-surface-700 dark:text-zinc-300">{ff.field}</span>
                      <Badge color="purple">{ff.type}</Badge>
                      {ff.show_counts && <Badge color="green">counts</Badge>}
                      {ff.searchable && <Badge color="blue">searchable</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {listView.actions && (
        <div>
          <div className="flex items-center gap-1.5 text-xs text-surface-500 dark:text-zinc-400 mb-2">
            <MousePointer2 className="w-3.5 h-3.5" />
            Actions
          </div>
          <div className="flex flex-wrap gap-3">
            {listView.actions.primary && listView.actions.primary.length > 0 && (
              <div>
                <div className="text-[10px] uppercase text-surface-400 dark:text-zinc-500 mb-1">Primary</div>
                <div className="flex gap-1">
                  {listView.actions.primary.map((a, i) => (
                    <Badge key={i} color="blue">{a.label}</Badge>
                  ))}
                </div>
              </div>
            )}
            {listView.actions.row && listView.actions.row.length > 0 && (
              <div>
                <div className="text-[10px] uppercase text-surface-400 dark:text-zinc-500 mb-1">Row</div>
                <div className="flex gap-1">
                  {listView.actions.row.map((a, i) => (
                    <Badge key={i} color="gray">{a.label}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bulk actions */}
      {listView.bulk_actions && listView.bulk_actions.length > 0 && (
        <div>
          <div className="text-[10px] uppercase text-surface-400 dark:text-zinc-500 mb-1">Bulk Actions</div>
          <div className="flex gap-1">
            {listView.bulk_actions.map((a, i) => (
              <Badge key={i} color="amber">{a.label}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {listView.empty && (
        <div className="bg-surface-50 dark:bg-zinc-800/50 rounded-lg border border-dashed border-surface-300 dark:border-zinc-700 p-3">
          <div className="flex items-center gap-1.5 text-xs text-surface-500 dark:text-zinc-400 mb-1">
            <AlertCircle className="w-3 h-3" />
            Empty State
          </div>
          <div className="text-xs">
            <span className="font-medium text-surface-700 dark:text-zinc-300">{listView.empty.title}</span>
            {listView.empty.message && (
              <span className="text-surface-500 dark:text-zinc-400 ml-1">— {listView.empty.message}</span>
            )}
            {listView.empty.action && (
              <span className="ml-2">
                <Badge color="blue">{listView.empty.action.label} → {listView.empty.action.path}</Badge>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
