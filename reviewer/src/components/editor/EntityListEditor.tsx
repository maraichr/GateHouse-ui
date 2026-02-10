import { Link, useParams } from 'react-router';
import { Plus, Database, Trash2, GripVertical } from 'lucide-react';
import { useState } from 'react';
import { useDraftEditor } from '../../context/DraftEditorContext';
import { useCompositionEditor } from '../../context/CompositionEditorContext';
import { ServiceBadge } from '../utility/ServiceBadge';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../utility/EmptyState';
import { ConfirmDialog } from '../ui/Dialog';
import type { Entity } from '../../types';

export function EntityListEditor() {
  const { specId, compId } = useParams<{ specId: string; compId: string }>();
  const { spec, addEntity, removeEntity } = useDraftEditor();
  const compositionCtx = useCompositionEditor();
  const [deleteTarget, setDeleteTarget] = useState<{ index: number; name: string } | null>(null);
  if (!spec) return null;

  const entities = spec.entities || [];

  // Determine the base path for entity links
  const basePath = compId && specId
    ? `/projects/${compId}/edit/services/${specId}`
    : `/projects/${specId}/edit`;

  // Service name for attribution when in composition context
  const serviceName = compositionCtx
    ? compositionCtx.isHostSpec
      ? compositionCtx.hostSpecName
      : compositionCtx.activeServiceName
    : null;

  const handleAddEntity = () => {
    const name = `Entity${entities.length + 1}`;
    const newEntity: Entity = {
      name,
      api_resource: `/${name.toLowerCase()}s`,
      display_name: name,
      display_name_plural: `${name}s`,
      label_field: 'name',
      fields: [
        { name: 'id', type: 'string', display_name: 'ID', primary_key: true, generated: true },
        { name: 'name', type: 'string', display_name: 'Name', required: true },
      ],
      views: {},
    };
    addEntity(newEntity);
  };

  const handleRemove = () => {
    if (!deleteTarget) return;
    removeEntity(deleteTarget.index);
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-zinc-100">
            Entities ({entities.length})
          </h2>
          {serviceName && <ServiceBadge service={serviceName} />}
        </div>
        <Button onClick={handleAddEntity} icon={<Plus className="w-4 h-4" />} size="sm">
          Add Entity
        </Button>
      </div>

      {entities.length === 0 ? (
        <EmptyState
          title="No entities yet"
          message="Create your first entity to define your data model"
          icon={<Database className="w-8 h-8 text-surface-400 dark:text-zinc-500" />}
          action={
            <Button variant="outlined" onClick={handleAddEntity} icon={<Plus className="w-4 h-4" />}>
              Create first entity
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {entities.map((entity, index) => (
            <Card key={index} hover className="group relative">
              <div className="flex items-start gap-2">
                <GripVertical className="w-4 h-4 text-surface-300 dark:text-zinc-600 mt-0.5 cursor-grab" />
                <Link
                  to={`${basePath}/entities/${index}`}
                  className="flex-1 min-w-0"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {entity.icon && <span className="text-sm">{entity.icon}</span>}
                    <h3 className="font-semibold text-surface-900 dark:text-zinc-100 truncate">{entity.name}</h3>
                    {serviceName && (
                      <ServiceBadge service={serviceName} className="ml-auto" />
                    )}
                  </div>
                  <p className="text-sm text-surface-500 dark:text-zinc-400 truncate">
                    {entity.display_name}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-surface-400 dark:text-zinc-500">
                    <span>{entity.fields?.length || 0} fields</span>
                    <span>{entity.relationships?.length || 0} relationships</span>
                  </div>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setDeleteTarget({ index, name: entity.name });
                  }}
                  className="p-1 text-surface-300 dark:text-zinc-600 hover:text-danger-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleRemove}
        title={`Remove "${deleteTarget?.name}"?`}
        description="This entity and all its fields will be removed. This cannot be undone."
        confirmLabel="Remove"
      />
    </div>
  );
}
