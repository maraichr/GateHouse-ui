import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { ArrowLeft, Plus, Trash2, GitBranch, ArrowRight, AlertTriangle, LayoutGrid, Zap } from 'lucide-react';
import { useDraftEditor } from '../../context/DraftEditorContext';
import { useCompositionEditor } from '../../context/CompositionEditorContext';
import { ConfirmDialog } from '../ui/Dialog';
import { Card } from '../ui/Card';
import type { Entity, Relationship } from '../../types';
import { countConfiguredViews } from './views/viewDefaults';

const REL_TYPES = ['has_many', 'belongs_to', 'has_one', 'many_to_many'] as const;

export function EntityEditor() {
  const { specId, compId, entityIndex: indexStr } = useParams<{ specId: string; compId: string; entityIndex: string }>();
  const navigate = useNavigate();
  const { spec, updateEntity, addField, removeField } = useDraftEditor();

  const basePath = compId && specId
    ? `/projects/${compId}/edit/services/${specId}`
    : `/projects/${specId}/edit`;

  const entityIndex = parseInt(indexStr || '0', 10);
  if (!spec || entityIndex >= spec.entities.length) {
    return <div className="text-surface-500 dark:text-zinc-400">Entity not found</div>;
  }

  const entity = spec.entities[entityIndex];
  const compositionCtx = useCompositionEditor();
  const localEntityNames = spec.entities.map((e) => e.name);
  const roles = Object.keys(spec.auth?.roles || {});

  // Build composed entity groups for cross-service relationship selection
  const entityGroups = buildEntityGroups(compositionCtx, localEntityNames);
  const allEntityNames = entityGroups.length > 0
    ? entityGroups.flatMap((g) => g.entities.map((e) => e.name))
    : localEntityNames;

  const setEntityField = (key: keyof Entity, value: unknown) => {
    updateEntity(entityIndex, { ...entity, [key]: value } as Entity);
  };

  const handleAddField = () => {
    const name = `field_${(entity.fields?.length || 0) + 1}`;
    addField(entityIndex, {
      name,
      type: 'string',
      display_name: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    });
  };

  // Confirm dialog state for removing fields
  const [confirmRemoveField, setConfirmRemoveField] = useState<{ index: number; name: string } | null>(null);

  const handleRemoveField = (fieldIndex: number) => {
    setConfirmRemoveField({ index: fieldIndex, name: entity.fields[fieldIndex].name });
  };

  const doRemoveField = () => {
    if (confirmRemoveField) {
      removeField(entityIndex, confirmRemoveField.index);
      setConfirmRemoveField(null);
    }
  };

  // Relationships
  const relationships = entity.relationships || [];

  const addRelationship = () => {
    const newRel: Relationship = {
      name: `relation_${relationships.length + 1}`,
      type: 'has_many',
      entity: localEntityNames[0] || '',
      display_name: 'New Relation',
    };
    setEntityField('relationships', [...relationships, newRel]);
  };

  const updateRelationship = (relIndex: number, rel: Relationship) => {
    const rels = [...relationships];
    rels[relIndex] = rel;
    setEntityField('relationships', rels);
  };

  const removeRelationship = (relIndex: number) => {
    setEntityField(
      'relationships',
      relationships.filter((_, i) => i !== relIndex),
    );
  };

  // Determine which fields are enums for status_field
  const enumFields = (entity.fields || []).filter((f) => f.type === 'enum');
  const allFieldNames = (entity.fields || []).map((f) => f.name);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={`${basePath}/entities`}
          className="p-1.5 text-surface-400 dark:text-zinc-500 hover:text-surface-600 dark:hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h2 className="text-lg font-semibold text-surface-900 dark:text-zinc-100">{entity.name}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Entity metadata */}
        <Card className="space-y-4">
          <h3 className="font-medium text-surface-900 dark:text-zinc-100">Entity Settings</h3>

          <div className="space-y-3">
            <FieldInput
              label="Name"
              value={entity.name}
              onChange={(v) => setEntityField('name', v)}
              placeholder="PascalCase"
            />
            <FieldInput
              label="Display Name"
              value={entity.display_name}
              onChange={(v) => setEntityField('display_name', v)}
            />
            <FieldInput
              label="Display Name (Plural)"
              value={entity.display_name_plural || ''}
              onChange={(v) => setEntityField('display_name_plural', v)}
            />
            <FieldInput
              label="API Resource"
              value={entity.api_resource}
              onChange={(v) => setEntityField('api_resource', v)}
              placeholder="/kebab-case-plural"
            />
            <FieldInput
              label="Icon"
              value={entity.icon || ''}
              onChange={(v) => setEntityField('icon', v)}
              placeholder="lucide icon name"
            />

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">Label Field</label>
              <select
                value={entity.label_field}
                onChange={(e) => setEntityField('label_field', e.target.value)}
                className="w-full px-3 py-2 border border-surface-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900"
              >
                {allFieldNames.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">Status Field</label>
              <select
                value={entity.status_field || ''}
                onChange={(e) => setEntityField('status_field', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-surface-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900"
              >
                <option value="">None</option>
                {enumFields.map((f) => (
                  <option key={f.name} value={f.name}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Right: Fields table */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-surface-900 dark:text-zinc-100">Fields ({entity.fields?.length || 0})</h3>
            <button
              onClick={handleAddField}
              className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
            >
              <Plus className="w-3 h-3" />
              Add Field
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 dark:border-zinc-800">
                  <th className="text-left py-2 px-2 font-medium text-surface-500 dark:text-zinc-400">Name</th>
                  <th className="text-left py-2 px-2 font-medium text-surface-500 dark:text-zinc-400">Type</th>
                  <th className="text-left py-2 px-2 font-medium text-surface-500 dark:text-zinc-400">Req</th>
                  <th className="py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {(entity.fields || []).map((field, fieldIndex) => (
                  <tr key={fieldIndex} className="border-b border-surface-100 dark:border-zinc-800 hover:bg-surface-50 dark:hover:bg-zinc-800 group">
                    <td className="py-1.5 px-2">
                      <Link
                        to={`${basePath}/entities/${entityIndex}/fields/${fieldIndex}`}
                        className="text-brand-600 dark:text-brand-400 hover:underline font-mono text-xs"
                      >
                        {field.name}
                      </Link>
                    </td>
                    <td className="py-1.5 px-2">
                      <span className="inline-block px-1.5 py-0.5 bg-surface-100 dark:bg-zinc-800 rounded text-xs">
                        {field.type}
                      </span>
                    </td>
                    <td className="py-1.5 px-2">
                      {field.required && <span className="text-amber-500 text-xs">req</span>}
                    </td>
                    <td className="py-1.5 px-2 text-right">
                      <button
                        onClick={() => handleRemoveField(fieldIndex)}
                        className="p-1 text-surface-300 dark:text-zinc-600 hover:text-danger-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Workflows */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-surface-400 dark:text-zinc-500" />
            <h3 className="font-medium text-surface-900 dark:text-zinc-100">Workflows</h3>
            {entity.state_machine ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                {entity.state_machine.transitions.length} transitions
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-100 dark:bg-zinc-800 text-surface-500 dark:text-zinc-400">
                not configured
              </span>
            )}
          </div>
          <Link
            to={`${basePath}/entities/${entityIndex}/state-machine`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-600 dark:text-brand-400 border border-brand-300 dark:border-brand-700 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            Configure Workflows
          </Link>
        </div>
      </Card>

      {/* Configure Views */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-surface-400 dark:text-zinc-500" />
            <h3 className="font-medium text-surface-900 dark:text-zinc-100">Views</h3>
            {(() => {
              const { configured, total } = countConfiguredViews(entity);
              return (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  configured === total
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : configured > 0
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                    : 'bg-surface-100 dark:bg-zinc-800 text-surface-500 dark:text-zinc-400'
                }`}>
                  {configured}/{total} configured
                </span>
              );
            })()}
          </div>
          <Link
            to={`${basePath}/entities/${entityIndex}/views`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-600 dark:text-brand-400 border border-brand-300 dark:border-brand-700 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Configure Views
          </Link>
        </div>
      </Card>

      {/* Relationships */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-surface-900 dark:text-zinc-100">
            <span className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-surface-400 dark:text-zinc-500" />
              Relationships ({relationships.length})
            </span>
          </h3>
          <button
            onClick={addRelationship}
            className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
          >
            <Plus className="w-3 h-3" />
            Add Relationship
          </button>
        </div>

        {relationships.length === 0 ? (
          <p className="text-sm text-surface-400 dark:text-zinc-500 text-center py-4">No relationships</p>
        ) : (
          <div className="space-y-3">
            {relationships.map((rel, relIndex) => {
              const isExternal = !allEntityNames.includes(rel.entity);
              const isCrossService = !isExternal && !localEntityNames.includes(rel.entity);
              const crossServiceName = isCrossService && compositionCtx
                ? compositionCtx.composedSources[rel.entity] || null
                : null;
              return (
                <div key={relIndex} className="rounded-lg border border-surface-200 dark:border-zinc-800 p-3">
                  {/* Summary header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-surface-700 dark:text-zinc-300">{rel.name || 'unnamed'}</span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-[10px] font-medium">
                        {rel.type}
                      </span>
                      <ArrowRight className="w-3 h-3 text-surface-300 dark:text-zinc-600" />
                      <span className={isExternal ? 'text-amber-600 italic' : isCrossService ? 'text-indigo-600 dark:text-indigo-400' : 'text-surface-700 dark:text-zinc-300'}>
                        {rel.entity}
                      </span>
                      {isCrossService && crossServiceName && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 text-[9px] font-medium">
                          {crossServiceName}
                        </span>
                      )}
                      {isExternal && (
                        <span title="External entity — not in any service"><AlertTriangle className="w-3 h-3 text-amber-400" /></span>
                      )}
                    </div>
                    <button
                      onClick={() => removeRelationship(relIndex)}
                      className="p-1 text-surface-300 dark:text-zinc-600 hover:text-danger-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Edit fields */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-surface-500 dark:text-zinc-400 mb-0.5">Name</label>
                      <input
                        type="text"
                        value={rel.name}
                        onChange={(e) => updateRelationship(relIndex, { ...rel, name: e.target.value })}
                        className="w-full px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-surface-500 dark:text-zinc-400 mb-0.5">Display Name</label>
                      <input
                        type="text"
                        value={rel.display_name || ''}
                        onChange={(e) => updateRelationship(relIndex, { ...rel, display_name: e.target.value || undefined })}
                        className="w-full px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-surface-500 dark:text-zinc-400 mb-0.5">Type</label>
                      <select
                        value={rel.type}
                        onChange={(e) => updateRelationship(relIndex, { ...rel, type: e.target.value })}
                        className="w-full px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
                      >
                        {REL_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-surface-500 dark:text-zinc-400 mb-0.5">Target Entity</label>
                      <select
                        value={allEntityNames.includes(rel.entity) ? rel.entity : '__custom__'}
                        onChange={(e) => {
                          if (e.target.value !== '__custom__') {
                            updateRelationship(relIndex, { ...rel, entity: e.target.value });
                          }
                        }}
                        className="w-full px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
                      >
                        {entityGroups.length > 0 ? (
                          entityGroups.map((group) => (
                            <optgroup key={group.service} label={`${group.service}${group.isCurrent ? ' (current)' : ''}`}>
                              {group.entities.map((e) => (
                                <option key={e.name} value={e.name}>{e.name}</option>
                              ))}
                            </optgroup>
                          ))
                        ) : (
                          localEntityNames.map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))
                        )}
                        {isExternal && (
                          <option value="__custom__">{rel.entity} (external)</option>
                        )}
                      </select>
                    </div>
                    <ForeignKeyField
                      value={rel.foreign_key || ''}
                      targetEntity={rel.entity}
                      compositionCtx={compositionCtx}
                      localEntities={spec.entities}
                      onChange={(v) => updateRelationship(relIndex, { ...rel, foreign_key: v || undefined })}
                    />
                    <div>
                      <label className="block text-xs text-surface-500 dark:text-zinc-400 mb-0.5">Through (join entity)</label>
                      <input
                        type="text"
                        value={rel.through || ''}
                        onChange={(e) => updateRelationship(relIndex, { ...rel, through: e.target.value || undefined })}
                        className="w-full px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  {/* Boolean flags */}
                  <div className="flex items-center gap-4 mt-2 pt-2 border-t border-surface-100 dark:border-zinc-800">
                    <label className="flex items-center gap-1.5 text-xs text-surface-600 dark:text-zinc-400">
                      <input
                        type="checkbox"
                        checked={rel.show_in_detail ?? false}
                        onChange={(e) => updateRelationship(relIndex, { ...rel, show_in_detail: e.target.checked || undefined })}
                        className="rounded border-surface-300 dark:border-zinc-700"
                      />
                      Show in detail
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-surface-600 dark:text-zinc-400">
                      <input
                        type="checkbox"
                        checked={rel.inline_create ?? false}
                        onChange={(e) => updateRelationship(relIndex, { ...rel, inline_create: e.target.checked || undefined })}
                        className="rounded border-surface-300 dark:border-zinc-700"
                      />
                      Inline create
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-surface-600 dark:text-zinc-400">
                      <input
                        type="checkbox"
                        checked={rel.inline_edit ?? false}
                        onChange={(e) => updateRelationship(relIndex, { ...rel, inline_edit: e.target.checked || undefined })}
                        className="rounded border-surface-300 dark:border-zinc-700"
                      />
                      Inline edit
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Confirm remove field dialog */}
      <ConfirmDialog
        open={!!confirmRemoveField}
        onClose={() => setConfirmRemoveField(null)}
        onConfirm={doRemoveField}
        title="Remove field"
        description={`Remove field "${confirmRemoveField?.name}"?`}
        confirmLabel="Remove"
        confirmColor="danger"
      />
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-surface-300 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white dark:bg-zinc-900"
      />
    </div>
  );
}

// --- Composition-aware helpers ---

interface EntityGroupOption {
  service: string;
  isCurrent: boolean;
  entities: Array<{ name: string; fieldNames: string[] }>;
}

function buildEntityGroups(
  compositionCtx: ReturnType<typeof useCompositionEditor>,
  localEntityNames: string[],
): EntityGroupOption[] {
  if (!compositionCtx?.composedSpec) return [];

  const { composedSpec, composedSources, specIdToServiceName, activeSpecId, hostSpecId, hostSpecName } = compositionCtx;
  const currentServiceName = activeSpecId === hostSpecId
    ? hostSpecName
    : specIdToServiceName[activeSpecId] || 'Current';

  const groups = new Map<string, Array<{ name: string; fieldNames: string[] }>>();
  for (const entity of composedSpec.entities || []) {
    const service = composedSources[entity.name] || hostSpecName;
    if (!groups.has(service)) groups.set(service, []);
    groups.get(service)!.push({
      name: entity.name,
      fieldNames: (entity.fields || []).map((f) => f.name),
    });
  }

  const result: EntityGroupOption[] = [];
  for (const [service, entities] of groups) {
    result.push({ service, isCurrent: service === currentServiceName, entities });
  }
  result.sort((a, b) => (a.isCurrent === b.isCurrent ? 0 : a.isCurrent ? -1 : 1));
  return result;
}

function ForeignKeyField({
  value,
  targetEntity,
  compositionCtx,
  localEntities,
  onChange,
}: {
  value: string;
  targetEntity: string;
  compositionCtx: ReturnType<typeof useCompositionEditor>;
  localEntities: Entity[];
  onChange: (v: string) => void;
}) {
  let fieldNames: string[] = [];
  if (compositionCtx?.composedSpec) {
    const target = (compositionCtx.composedSpec.entities || []).find((e) => e.name === targetEntity);
    if (target) fieldNames = (target.fields || []).map((f) => f.name);
  } else {
    const target = localEntities.find((e) => e.name === targetEntity);
    if (target) fieldNames = (target.fields || []).map((f) => f.name);
  }

  return (
    <div>
      <label className="block text-xs text-surface-500 dark:text-zinc-400 mb-0.5">Foreign Key</label>
      {fieldNames.length > 0 ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900 font-mono"
        >
          <option value="">auto-inferred</option>
          {fieldNames.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
          placeholder="auto-inferred if empty"
        />
      )}
    </div>
  );
}
