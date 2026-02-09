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
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {detailView.layout === 'two_column' ? (
          <><Columns2 className="w-3.5 h-3.5" /><span>Two-column layout</span></>
        ) : (
          <><LayoutDashboard className="w-3.5 h-3.5" /><span>Tabbed layout</span></>
        )}
      </div>

      {/* Header schematic */}
      {detailView.header && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Detail Header</div>
          <div className="flex items-start gap-3">
            {detailView.header.avatar && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <User className="w-3 h-3" />
                <span className="font-mono">{detailView.header.avatar}</span>
              </div>
            )}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-800">Title: </span>
                <span className="text-xs font-mono text-gray-600">{detailView.header.title}</span>
              </div>
              {detailView.header.subtitle && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-800">Subtitle: </span>
                  <span className="text-xs font-mono text-gray-600">{detailView.header.subtitle}</span>
                </div>
              )}
              {detailView.header.status_badge && (
                <div className="flex items-center gap-2">
                  <Tag className="w-3 h-3 text-gray-400" />
                  <span className="text-xs font-mono text-gray-600">{detailView.header.status_badge}</span>
                </div>
              )}
            </div>
          </div>
          {detailView.header.stats && detailView.header.stats.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex items-center gap-1 text-[10px] uppercase text-gray-400 mb-1">
                <BarChart3 className="w-3 h-3" />
                Header Stats ({detailView.header.stats.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {detailView.header.stats.map((stat, i) => (
                  <div key={i} className="text-xs bg-white border border-gray-200 rounded px-2 py-1">
                    <span className="text-gray-500">{stat.label}: </span>
                    <span className="font-mono text-gray-700">{String(stat.value)}</span>
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
          <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Tabs ({detailView.tabs.length})</div>
          <div className="space-y-2">
            {detailView.tabs.map((tab) => (
              <div key={tab.id} className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-gray-800">{tab.label}</span>
                  <span className="text-xs font-mono text-gray-400">{tab.id}</span>
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
                      <span className="text-gray-500 ml-1.5">→ {tab.content.relationship}</span>
                    )}
                    {tab.content.columns && tab.content.columns.length > 0 && (
                      <span className="text-gray-400 ml-1.5">
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
              <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Left Column</div>
              <div className="space-y-1.5">
                {detailView.left.map((section, i) => (
                  <SectionSchematic key={i} title={section.title} fields={section.fields} layout={section.layout} permissions={section.permissions} />
                ))}
              </div>
            </div>
          )}
          {detailView.right && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Right Column</div>
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
    <div className="text-xs bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5">
      <div className="flex items-center gap-2">
        {title && <span className="font-medium text-gray-700">{title}</span>}
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
        <div className="mt-1 text-gray-500 font-mono text-[11px]">
          {fields.join(' · ')}
        </div>
      )}
    </div>
  );
}
