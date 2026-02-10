import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Check, Minus } from 'lucide-react';
import { useDraftEditor } from '../../../context/DraftEditorContext';
import { Button } from '../../ui/Button';
import { ConfirmDialog } from '../../ui/Dialog';
import type { Entity, EntityViews } from '../../../types';
import { createDefaultListView, createDefaultDetailView, createDefaultFormView } from './viewDefaults';
import { ListViewEditor } from './ListViewEditor';
import { DetailViewEditor } from './DetailViewEditor';
import { FormEditor } from './FormEditor';

type ViewTab = 'list' | 'detail' | 'create' | 'edit';

const VIEW_TABS: { key: ViewTab; label: string }[] = [
  { key: 'list', label: 'List View' },
  { key: 'detail', label: 'Detail View' },
  { key: 'create', label: 'Create Form' },
  { key: 'edit', label: 'Edit Form' },
];

export function ViewsEditor() {
  const { specId, compId, entityIndex: eiStr } = useParams<{
    specId: string;
    compId: string;
    entityIndex: string;
  }>();
  const { spec, updateEntity } = useDraftEditor();
  const [activeTab, setActiveTab] = useState<ViewTab>('list');
  const [confirmClear, setConfirmClear] = useState<ViewTab | null>(null);

  const entityIndex = parseInt(eiStr || '0', 10);

  const basePath = compId && specId
    ? `/compositions/${compId}/edit/services/${specId}`
    : `/specs/${specId}/edit`;

  if (!spec || entityIndex >= spec.entities.length) {
    return <div className="text-surface-500 dark:text-zinc-400">Entity not found</div>;
  }

  const entity = spec.entities[entityIndex];
  const views = entity.views || {};
  const availableFields = (entity.fields || []).map((f) => f.name);
  const roles = Object.keys(spec.auth?.roles || {});
  const relationships = (entity.relationships || []).map((r) => r.name);

  const setViews = (newViews: EntityViews) => {
    updateEntity(entityIndex, { ...entity, views: newViews });
  };

  const isConfigured = (tab: ViewTab) => !!views[tab];

  const handleInitialize = (tab: ViewTab) => {
    switch (tab) {
      case 'list':
        setViews({ ...views, list: createDefaultListView(entity) });
        break;
      case 'detail':
        setViews({ ...views, detail: createDefaultDetailView(entity) });
        break;
      case 'create':
        setViews({ ...views, create: createDefaultFormView(entity, true) });
        break;
      case 'edit':
        setViews({ ...views, edit: createDefaultFormView(entity, false) });
        break;
    }
  };

  const handleClear = (tab: ViewTab) => {
    const next = { ...views };
    delete next[tab];
    setViews(next);
    setConfirmClear(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={`${basePath}/entities/${entityIndex}`}
          className="p-1.5 text-surface-400 dark:text-zinc-500 hover:text-surface-600 dark:hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h2 className="text-lg font-semibold text-surface-900 dark:text-zinc-100">
          {entity.name} — Views
        </h2>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-surface-200 dark:border-zinc-800">
        {VIEW_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === key
                ? 'border-brand-600 text-brand-700 dark:text-brand-400'
                : 'border-transparent text-surface-500 dark:text-zinc-400 hover:text-surface-700 dark:hover:text-zinc-200 hover:border-surface-300 dark:hover:border-zinc-700'
            }`}
          >
            {label}
            {isConfigured(key) ? (
              <span className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
              </span>
            ) : (
              <span className="w-4 h-4 rounded-full bg-surface-100 dark:bg-zinc-800 flex items-center justify-center">
                <Minus className="w-3 h-3 text-surface-400 dark:text-zinc-500" />
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {!isConfigured(activeTab) ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-800">
          <p className="text-surface-500 dark:text-zinc-400 mb-1">
            No <span className="font-medium">{activeTab}</span> view configured
          </p>
          <p className="text-sm text-surface-400 dark:text-zinc-500 mb-4">
            Initialize with sensible defaults based on entity fields
          </p>
          <Button
            onClick={() => handleInitialize(activeTab)}
          >
            Initialize {activeTab === 'list' ? 'List View' : activeTab === 'detail' ? 'Detail View' : activeTab === 'create' ? 'Create Form' : 'Edit Form'}
          </Button>
        </div>
      ) : (
        <div>
          {/* Clear button */}
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setConfirmClear(activeTab)}
              className="text-xs text-surface-400 dark:text-zinc-500 hover:text-danger-500 transition-colors"
            >
              Remove view
            </button>
          </div>

          {activeTab === 'list' && views.list && (
            <ListViewEditor
              view={views.list}
              onChange={(list) => setViews({ ...views, list })}
              availableFields={availableFields}
              roles={roles}
            />
          )}
          {activeTab === 'detail' && views.detail && (
            <DetailViewEditor
              view={views.detail}
              onChange={(detail) => setViews({ ...views, detail })}
              availableFields={availableFields}
              roles={roles}
              relationships={relationships}
            />
          )}
          {activeTab === 'create' && views.create && (
            <FormEditor
              view={views.create}
              onChange={(create) => setViews({ ...views, create })}
              availableFields={availableFields}
              roles={roles}
              viewKey="create"
            />
          )}
          {activeTab === 'edit' && views.edit && (
            <FormEditor
              view={views.edit}
              onChange={(edit) => setViews({ ...views, edit })}
              availableFields={availableFields}
              roles={roles}
              viewKey="edit"
            />
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmClear}
        onClose={() => setConfirmClear(null)}
        onConfirm={() => confirmClear && handleClear(confirmClear)}
        title="Remove view configuration"
        description={`Remove ${confirmClear} view configuration?`}
        confirmLabel="Remove"
        confirmColor="danger"
      />
    </div>
  );
}
