import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { ArrowLeft, Plus, Trash2, FileText, BarChart3, Table2, LayoutGrid } from 'lucide-react';
import { useDraftEditor } from '../../context/DraftEditorContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/Dialog';
import type { Page } from '../../types';

const WIDGET_ICON_MAP: Record<string, typeof BarChart3> = {
  stat_cards: LayoutGrid,
  chart: BarChart3,
  entity_table: Table2,
};

export function PagesEditor() {
  const { specId, compId } = useParams<{ specId: string; compId: string }>();
  const navigate = useNavigate();
  const { spec, addPage, removePage } = useDraftEditor();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newId, setNewId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newPath, setNewPath] = useState('');
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);

  const basePath = compId && specId
    ? `/compositions/${compId}/edit/services/${specId}`
    : `/specs/${specId}/edit`;

  if (!spec) return null;

  const pages = spec.pages || [];

  const handleAdd = () => {
    if (!newId.trim()) return;
    const page: Page = {
      id: newId.trim(),
      title: newTitle.trim() || newId.trim().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      path: newPath.trim() || `/${newId.trim().replace(/_/g, '-')}`,
      widgets: [],
    };
    addPage(page);
    setNewId('');
    setNewTitle('');
    setNewPath('');
    setShowAddForm(false);
    // Navigate to new page editor
    navigate(`${basePath}/pages/${pages.length}`);
  };

  const handleRemove = () => {
    if (confirmRemove !== null) {
      removePage(confirmRemove);
      setConfirmRemove(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-zinc-100">
          Pages ({pages.length})
        </h2>
        <Button
          size="sm"
          onClick={() => setShowAddForm(true)}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Page
        </Button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <Card padding="sm">
          <h4 className="font-medium text-surface-900 dark:text-zinc-100 text-sm mb-3">New Page</h4>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">ID</label>
              <input
                type="text"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
                placeholder="dashboard"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
                placeholder="Dashboard"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Path</label>
              <input
                type="text"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
                placeholder="/dashboard"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleAdd} disabled={!newId.trim()}>
              Create
            </Button>
            <Button variant="ghost" color="neutral" size="sm" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Page grid */}
      {pages.length === 0 && !showAddForm ? (
        <Card className="text-center py-12">
          <FileText className="w-10 h-10 mx-auto text-surface-300 dark:text-zinc-600 mb-3" />
          <h3 className="text-lg font-medium text-surface-700 dark:text-zinc-300 mb-1">
            No pages yet
          </h3>
          <p className="text-sm text-surface-400 dark:text-zinc-500 mb-4">
            Create custom pages like dashboards with charts, stat cards, and entity tables.
          </p>
          <Button onClick={() => setShowAddForm(true)} icon={<Plus className="w-4 h-4" />}>
            Add Page
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page, index) => {
            const widgetTypes = page.widgets.map((w) => w.type);
            const uniqueTypes = [...new Set(widgetTypes)];
            return (
              <Card key={index} hover className="group relative">
                <Link
                  to={`${basePath}/pages/${index}`}
                  className="block"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-brand-500" />
                    <h3 className="font-medium text-surface-900 dark:text-zinc-100 text-sm">
                      {page.title}
                    </h3>
                  </div>
                  <p className="text-xs text-surface-400 dark:text-zinc-500 font-mono mb-2">
                    {page.path}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-surface-500 dark:text-zinc-400">
                      {page.widgets.length} widget{page.widgets.length !== 1 ? 's' : ''}
                    </span>
                    {uniqueTypes.map((type) => {
                      const Icon = WIDGET_ICON_MAP[type] || FileText;
                      return (
                        <span
                          key={type}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-surface-100 dark:bg-zinc-800 rounded text-[10px] text-surface-500 dark:text-zinc-400"
                        >
                          <Icon className="w-2.5 h-2.5" />
                          {type}
                        </span>
                      );
                    })}
                    {page.permissions && page.permissions.length > 0 && (
                      <span className="text-[10px] text-orange-600 dark:text-orange-400">
                        {page.permissions.length} role{page.permissions.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </Link>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmRemove(index); }}
                  className="absolute top-3 right-3 p-1 text-surface-300 dark:text-zinc-600 hover:text-danger-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirmRemove !== null}
        onClose={() => setConfirmRemove(null)}
        onConfirm={handleRemove}
        title="Remove page"
        description={`Remove page "${confirmRemove !== null ? pages[confirmRemove]?.title : ''}"?`}
        confirmLabel="Remove"
        confirmColor="danger"
      />
    </div>
  );
}
