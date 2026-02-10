import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Plus, Trash2, BarChart3, Table2, LayoutGrid, ChevronDown, ChevronRight } from 'lucide-react';
import { useDraftEditor } from '../../context/DraftEditorContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/Dialog';
import { StatCardsWidgetEditor } from './widgets/StatCardsWidgetEditor';
import { ChartWidgetEditor } from './widgets/ChartWidgetEditor';
import { EntityTableWidgetEditor } from './widgets/EntityTableWidgetEditor';
import type { Page, Widget } from '../../types';

const WIDGET_TYPES = [
  { type: 'stat_cards', label: 'Stat Cards', icon: LayoutGrid, description: 'Key metric cards' },
  { type: 'chart', label: 'Chart', icon: BarChart3, description: 'Data visualization' },
  { type: 'entity_table', label: 'Entity Table', icon: Table2, description: 'Record list table' },
] as const;

export function PageEditor() {
  const { specId, compId, pageIndex: piStr } = useParams<{
    specId: string;
    compId: string;
    pageIndex: string;
  }>();
  const { spec, updatePage } = useDraftEditor();
  const [expandedWidget, setExpandedWidget] = useState<number | null>(null);
  const [confirmRemoveWidget, setConfirmRemoveWidget] = useState<number | null>(null);

  const pageIndex = parseInt(piStr || '0', 10);
  const basePath = compId && specId
    ? `/projects/${compId}/edit/services/${specId}`
    : `/projects/${specId}/edit`;

  if (!spec || pageIndex >= (spec.pages || []).length) {
    return <div className="text-surface-500 dark:text-zinc-400">Page not found</div>;
  }

  const page = spec.pages[pageIndex];
  const roles = Object.keys(spec.auth?.roles || {});
  const entityNames = spec.entities.map((e) => e.name);

  const setPage = (updates: Partial<Page>) => {
    updatePage(pageIndex, { ...page, ...updates });
  };

  const addWidget = (type: string) => {
    const widget: Widget = { type, title: `New ${type.replace(/_/g, ' ')}` };
    if (type === 'stat_cards') {
      widget.cards = [];
      widget.layout = '4';
    }
    if (type === 'chart') {
      widget.chart_type = 'bar';
      widget.source = '';
      widget.height = 300;
    }
    if (type === 'entity_table') {
      widget.entity = entityNames[0] || '';
      widget.query = { limit: 5 };
    }
    const widgets = [...page.widgets, widget];
    setPage({ widgets });
    setExpandedWidget(widgets.length - 1);
  };

  const updateWidget = (i: number, widget: Widget) => {
    const widgets = [...page.widgets];
    widgets[i] = widget;
    setPage({ widgets });
  };

  const removeWidget = () => {
    if (confirmRemoveWidget !== null) {
      setPage({ widgets: page.widgets.filter((_, i) => i !== confirmRemoveWidget) });
      setConfirmRemoveWidget(null);
      if (expandedWidget === confirmRemoveWidget) setExpandedWidget(null);
    }
  };

  const moveWidget = (i: number, dir: 'up' | 'down') => {
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= page.widgets.length) return;
    const widgets = [...page.widgets];
    [widgets[i], widgets[j]] = [widgets[j], widgets[i]];
    setPage({ widgets });
    if (expandedWidget === i) setExpandedWidget(j);
    else if (expandedWidget === j) setExpandedWidget(i);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={`${basePath}/pages`}
          className="p-1.5 text-surface-400 dark:text-zinc-500 hover:text-surface-600 dark:hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h2 className="text-lg font-semibold text-surface-900 dark:text-zinc-100">
          {page.title}
        </h2>
      </div>

      {/* Page settings */}
      <Card padding="sm">
        <h4 className="font-medium text-surface-900 dark:text-zinc-100 text-sm mb-3">Page Settings</h4>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">ID</label>
            <input
              type="text"
              value={page.id}
              onChange={(e) => setPage({ id: e.target.value })}
              className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Title</label>
            <input
              type="text"
              value={page.title}
              onChange={(e) => setPage({ title: e.target.value })}
              className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Path</label>
            <input
              type="text"
              value={page.path}
              onChange={(e) => setPage({ path: e.target.value })}
              className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Purpose</label>
            <select
              value={page.purpose || 'screen'}
              onChange={(e) => setPage({ purpose: e.target.value })}
              className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
            >
              <option value="screen">Screen</option>
              <option value="dashboard">Dashboard</option>
              <option value="flow_step">Flow Step</option>
              <option value="settings">Settings</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Journey ID</label>
            <input
              type="text"
              value={page.journey_id || ''}
              onChange={(e) => setPage({ journey_id: e.target.value || undefined })}
              className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
              placeholder="onboarding_journey"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Step ID</label>
            <input
              type="text"
              value={page.step_id || ''}
              onChange={(e) => setPage({ step_id: e.target.value || undefined })}
              className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
              placeholder="start"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Primary Entity</label>
            <input
              type="text"
              value={page.primary_entity || ''}
              onChange={(e) => setPage({ primary_entity: e.target.value || undefined })}
              className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
              placeholder="Application"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Success Metric</label>
            <input
              type="text"
              value={page.success_metric || ''}
              onChange={(e) => setPage({ success_metric: e.target.value || undefined })}
              className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
              placeholder="Application submitted"
            />
          </div>
        </div>
        {roles.length > 0 && (
          <div className="mt-3">
            <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Permissions</label>
            <div className="flex flex-wrap gap-1.5">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    const perms = page.permissions || [];
                    const next = perms.includes(role)
                      ? perms.filter((r) => r !== role)
                      : [...perms, role];
                    setPage({ permissions: next.length > 0 ? next : undefined });
                  }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    (page.permissions || []).includes(role)
                      ? 'bg-orange-100 dark:bg-orange-950 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-400'
                      : 'bg-white dark:bg-zinc-900 border-surface-200 dark:border-zinc-800 text-surface-500 dark:text-zinc-400 hover:bg-surface-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Widgets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-surface-700 dark:text-zinc-300">
            Widgets ({page.widgets.length})
          </h3>
          <div className="flex items-center gap-2">
            {WIDGET_TYPES.map(({ type, label, icon: Icon }) => (
              <Button
                key={type}
                variant="outlined"
                color="neutral"
                size="sm"
                onClick={() => addWidget(type)}
                icon={<Icon className="w-3.5 h-3.5" />}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {page.widgets.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-sm text-surface-400 dark:text-zinc-500 mb-3">
              No widgets yet. Add stat cards, charts, or entity tables to this page.
            </p>
            <div className="flex items-center justify-center gap-3">
              {WIDGET_TYPES.map(({ type, label, icon: Icon, description }) => (
                <button
                  key={type}
                  onClick={() => addWidget(type)}
                  className="flex flex-col items-center gap-1.5 p-4 rounded-lg border border-surface-200 dark:border-zinc-800 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors"
                >
                  <Icon className="w-6 h-6 text-surface-400 dark:text-zinc-500" />
                  <span className="text-sm font-medium text-surface-700 dark:text-zinc-300">{label}</span>
                  <span className="text-[10px] text-surface-400 dark:text-zinc-500">{description}</span>
                </button>
              ))}
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {page.widgets.map((widget, i) => {
              const typeInfo = WIDGET_TYPES.find((t) => t.type === widget.type);
              const Icon = typeInfo?.icon || LayoutGrid;
              const isExpanded = expandedWidget === i;

              return (
                <div
                  key={i}
                  className="border border-surface-200 dark:border-zinc-800 rounded-lg"
                >
                  {/* Widget header */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-surface-50 dark:bg-zinc-800/50 rounded-t-lg">
                    <button
                      onClick={() => setExpandedWidget(isExpanded ? null : i)}
                      className="p-0.5"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-surface-400 dark:text-zinc-500" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-surface-400 dark:text-zinc-500" />
                      )}
                    </button>

                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-200 dark:bg-zinc-700 text-surface-600 dark:text-zinc-400">
                      <Icon className="w-2.5 h-2.5" />
                      {widget.type}
                    </span>

                    <span className="text-sm font-medium text-surface-700 dark:text-zinc-300 flex-1">
                      {widget.title || `Widget ${i + 1}`}
                    </span>

                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => moveWidget(i, 'up')}
                        disabled={i === 0}
                        className="p-1 text-surface-300 dark:text-zinc-600 hover:text-surface-500 dark:hover:text-zinc-400 disabled:opacity-30"
                      >
                        <span className="text-xs">&#x25B2;</span>
                      </button>
                      <button
                        onClick={() => moveWidget(i, 'down')}
                        disabled={i === page.widgets.length - 1}
                        className="p-1 text-surface-300 dark:text-zinc-600 hover:text-surface-500 dark:hover:text-zinc-400 disabled:opacity-30"
                      >
                        <span className="text-xs">&#x25BC;</span>
                      </button>
                      <button
                        onClick={() => setConfirmRemoveWidget(i)}
                        className="p-1 text-surface-300 dark:text-zinc-600 hover:text-danger-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Widget editor */}
                  {isExpanded && (
                    <div className="p-3">
                      {widget.type === 'stat_cards' && (
                        <StatCardsWidgetEditor
                          widget={widget}
                          onChange={(w) => updateWidget(i, w)}
                          entityNames={entityNames}
                        />
                      )}
                      {widget.type === 'chart' && (
                        <ChartWidgetEditor
                          widget={widget}
                          onChange={(w) => updateWidget(i, w)}
                        />
                      )}
                      {widget.type === 'entity_table' && (
                        <EntityTableWidgetEditor
                          widget={widget}
                          onChange={(w) => updateWidget(i, w)}
                          entityNames={entityNames}
                          entities={spec.entities}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmRemoveWidget !== null}
        onClose={() => setConfirmRemoveWidget(null)}
        onConfirm={removeWidget}
        title="Remove widget"
        description={`Remove this widget from the page?`}
        confirmLabel="Remove"
        confirmColor="danger"
      />
    </div>
  );
}
