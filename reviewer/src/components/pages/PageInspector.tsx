import { Badge } from '../utility/Badge';
import { InlineCode } from '../utility/InlineCode';
import type { Page, Widget } from '../../types';

interface PageInspectorProps {
  pages: Page[];
}

export function PageInspector({ pages }: PageInspectorProps) {
  if (!pages || pages.length === 0) {
    return <p className="text-sm text-surface-500 dark:text-zinc-400">No custom pages defined in this spec.</p>;
  }

  return (
    <div className="space-y-6">
      {pages.map((page) => (
        <div key={page.id} className="surface-card">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-zinc-100">{page.title}</h3>
              <span className="text-xs text-surface-400 dark:text-zinc-500 font-mono">{page.path}</span>
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
    stat_cards: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30',
    chart: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30',
    entity_table: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30',
    report_builder: 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30',
    settings_form: 'border-surface-200 dark:border-zinc-700 bg-surface-50 dark:bg-zinc-800/50',
  };

  const borderClass = typeColors[widget.type] || 'border-surface-200 dark:border-zinc-700 bg-surface-50 dark:bg-zinc-800/50';

  return (
    <div className={`rounded-lg border p-3 ${borderClass}`}>
      <div className="flex items-center justify-between mb-2">
        <Badge color={widget.type === 'stat_cards' ? 'blue' : widget.type === 'chart' ? 'green' : widget.type === 'entity_table' ? 'amber' : 'gray'}>
          {widget.type}
        </Badge>
        <span className="text-[10px] text-surface-400 dark:text-zinc-500">#{index + 1}</span>
      </div>
      {widget.title && <div className="text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">{widget.title}</div>}
      {widget.cards && (
        <div className="text-xs text-surface-500 dark:text-zinc-400">{widget.cards.length} stat cards</div>
      )}
      {widget.chart_type && (
        <div className="text-xs text-surface-500 dark:text-zinc-400">
          Chart: <InlineCode>{widget.chart_type}</InlineCode>
          {widget.source && <> from <InlineCode>{widget.source}</InlineCode></>}
        </div>
      )}
      {widget.entity && (
        <div className="text-xs text-surface-500 dark:text-zinc-400">
          Entity: <InlineCode>{widget.entity}</InlineCode>
          {widget.query?.limit && <span> (limit {widget.query.limit})</span>}
        </div>
      )}
    </div>
  );
}
