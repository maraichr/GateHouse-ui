import { LayoutDashboard, Columns2, User, Tag, BarChart3, Eye } from 'lucide-react';
import { Badge } from '../utility/Badge';
import type { DetailView } from '../../types';

interface DetailViewPreviewProps {
  detailView: DetailView;
}

export function DetailViewPreview({ detailView }: DetailViewPreviewProps) {
  return (
    <div className="space-y-4">
      {/* Layout indicator */}
      <div className="flex items-center gap-2 text-xs text-surface-500 dark:text-zinc-400">
        {detailView.layout === 'two_column' ? (
          <><Columns2 className="w-3.5 h-3.5" /><span>Two-column layout</span></>
        ) : (
          <><LayoutDashboard className="w-3.5 h-3.5" /><span>Tabbed layout</span></>
        )}
      </div>

      {/* Header schematic */}
      {detailView.header && (
        <div className="bg-surface-50 dark:bg-zinc-800/50 rounded-lg border border-surface-200 dark:border-zinc-800 p-3">
          <div className="text-[10px] uppercase tracking-wider text-surface-400 dark:text-zinc-500 mb-2">Detail Header</div>
          <div className="flex items-start gap-3">
            {detailView.header.avatar && (
              <div className="flex items-center gap-1 text-xs text-surface-600 dark:text-zinc-400">
                <User className="w-3 h-3" />
                <span className="font-mono">{detailView.header.avatar}</span>
              </div>
            )}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-surface-800 dark:text-zinc-200">Title: </span>
                <span className="text-xs font-mono text-surface-600 dark:text-zinc-400">{detailView.header.title}</span>
              </div>
              {detailView.header.subtitle && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-surface-800 dark:text-zinc-200">Subtitle: </span>
                  <span className="text-xs font-mono text-surface-600 dark:text-zinc-400">{detailView.header.subtitle}</span>
                </div>
              )}
              {detailView.header.status_badge && (
                <div className="flex items-center gap-2">
                  <Tag className="w-3 h-3 text-surface-400 dark:text-zinc-500" />
                  <span className="text-xs font-mono text-surface-600 dark:text-zinc-400">{detailView.header.status_badge}</span>
                </div>
              )}
            </div>
          </div>
          {detailView.header.stats && detailView.header.stats.length > 0 && (
            <div className="mt-2 pt-2 border-t border-surface-200 dark:border-zinc-800">
              <div className="flex items-center gap-1 text-[10px] uppercase text-surface-400 dark:text-zinc-500 mb-1">
                <BarChart3 className="w-3 h-3" />
                Header Stats ({detailView.header.stats.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {detailView.header.stats.map((stat, i) => (
                  <div key={i} className="text-xs bg-white dark:bg-zinc-900 border border-surface-200 dark:border-zinc-700 rounded px-2 py-1">
                    <span className="text-surface-500 dark:text-zinc-400">{stat.label}: </span>
                    <span className="font-mono text-surface-700 dark:text-zinc-300">{String(stat.value)}</span>
                    {stat.display_as && <Badge color="gray">{stat.display_as}</Badge>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs schematic */}
      {detailView.tabs && detailView.tabs.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-surface-400 dark:text-zinc-500 mb-2">Tabs ({detailView.tabs.length})</div>
          <div className="space-y-2">
            {detailView.tabs.map((tab) => (
              <div key={tab.id} className="bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-800 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-surface-800 dark:text-zinc-200">{tab.label}</span>
                  <span className="text-xs font-mono text-surface-400 dark:text-zinc-500">{tab.id}</span>
                  {tab.icon && <Badge color="gray">{tab.icon}</Badge>}
                </div>
                {tab.sections && tab.sections.length > 0 && (
                  <div className="space-y-1.5 ml-3">
                    {tab.sections.map((section, si) => (
                      <SectionSchematic key={si} title={section.title} fields={section.fields} layout={section.layout} permissions={section.permissions} />
                    ))}
                  </div>
                )}
                {tab.content && (
                  <div className="ml-3 text-xs">
                    <Badge color="purple">{tab.content.type}</Badge>
                    {tab.content.relationship && (
                      <span className="text-surface-500 dark:text-zinc-400 ml-1.5">→ {tab.content.relationship}</span>
                    )}
                    {tab.content.columns && tab.content.columns.length > 0 && (
                      <span className="text-surface-400 dark:text-zinc-500 ml-1.5">
                        ({tab.content.columns.join(', ')})
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two-column layout sections */}
      {detailView.layout === 'two_column' && (detailView.left || detailView.right) && (
        <div className="grid grid-cols-2 gap-4">
          {detailView.left && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-surface-400 dark:text-zinc-500 mb-2">Left Column</div>
              <div className="space-y-1.5">
                {detailView.left.map((section, i) => (
                  <SectionSchematic key={i} title={section.title} fields={section.fields} layout={section.layout} permissions={section.permissions} />
                ))}
              </div>
            </div>
          )}
          {detailView.right && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-surface-400 dark:text-zinc-500 mb-2">Right Column</div>
              <div className="space-y-1.5">
                {detailView.right.sections.map((section, i) => (
                  <SectionSchematic key={i} title={section.title} fields={section.fields} layout={section.layout} permissions={section.permissions} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionSchematic({
  title,
  fields,
  layout,
  permissions,
}: {
  title?: string;
  fields?: string[];
  layout?: string;
  permissions?: string[];
}) {
  return (
    <div className="text-xs bg-surface-50 dark:bg-zinc-800/50 border border-surface-200 dark:border-zinc-700 rounded px-2.5 py-1.5">
      <div className="flex items-center gap-2">
        {title && <span className="font-medium text-surface-700 dark:text-zinc-300">{title}</span>}
        {layout && <Badge color="gray">{layout}</Badge>}
        {permissions && permissions.length > 0 && (
          <div className="flex items-center gap-0.5">
            <Eye className="w-3 h-3 text-purple-400" />
            {permissions.map((p) => (
              <Badge key={p} color="purple">{p}</Badge>
            ))}
          </div>
        )}
      </div>
      {fields && fields.length > 0 && (
        <div className="mt-1 text-surface-500 dark:text-zinc-400 font-mono text-[11px]">
          {fields.join(' · ')}
        </div>
      )}
    </div>
  );
}
