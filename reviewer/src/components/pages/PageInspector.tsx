import { Badge } from '../utility/Badge';
import { InlineCode } from '../utility/InlineCode';
import type { Page, Widget } from '../../types';

interface PageInspectorProps {
  pages: Page[];
}

export function PageInspector({ pages }: PageInspectorProps) {
  if (!pages || pages.length === 0) {
    return <p className="text-sm text-gray-500">No custom pages defined in this spec.</p>;
  }

  return (
    <div className="space-y-6">
      {pages.map((page) => (
        <div key={page.id} className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">{page.title}</h3>
              <span className="text-xs text-gray-400 font-mono">{page.path}</span>
            </div>
            {page.permissions && page.permissions.length > 0 && (
              <div className="flex gap-1">
                {page.permissions.map((p) => (
                  <Badge key={p} color="gray">{p}</Badge>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {page.widgets.map((widget, i) => (
              <WidgetSchematic key={i} widget={widget} index={i} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function WidgetSchematic({ widget, index }: { widget: Widget; index: number }) {
  const typeColors: Record<string, string> = {
    stat_cards: 'border-blue-200 bg-blue-50',
    chart: 'border-green-200 bg-green-50',
    entity_table: 'border-amber-200 bg-amber-50',
    report_builder: 'border-purple-200 bg-purple-50',
    settings_form: 'border-gray-200 bg-gray-50',
  };

  const borderClass = typeColors[widget.type] || 'border-gray-200 bg-gray-50';

  return (
    <div className={`rounded-lg border p-3 ${borderClass}`}>
      <div className="flex items-center justify-between mb-2">
        <Badge color={widget.type === 'stat_cards' ? 'blue' : widget.type === 'chart' ? 'green' : widget.type === 'entity_table' ? 'amber' : 'gray'}>
          {widget.type}
        </Badge>
        <span className="text-[10px] text-gray-400">#{index + 1}</span>
      </div>
      {widget.title && <div className="text-sm font-medium text-gray-700 mb-1">{widget.title}</div>}
      {widget.cards && (
        <div className="text-xs text-gray-500">{widget.cards.length} stat cards</div>
      )}
      {widget.chart_type && (
        <div className="text-xs text-gray-500">
          Chart: <InlineCode>{widget.chart_type}</InlineCode>
          {widget.source && <> from <InlineCode>{widget.source}</InlineCode></>}
        </div>
      )}
      {widget.entity && (
        <div className="text-xs text-gray-500">
          Entity: <InlineCode>{widget.entity}</InlineCode>
          {widget.query?.limit && <span> (limit {widget.query.limit})</span>}
        </div>
      )}
    </div>
  );
}
