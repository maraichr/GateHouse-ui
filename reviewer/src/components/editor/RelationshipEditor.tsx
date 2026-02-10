import { useState } from 'react';
import { Plus, Trash2, GitBranch, ArrowRight, AlertTriangle, ExternalLink } from 'lucide-react';
import { useDraftEditor } from '../../context/DraftEditorContext';
import { useCompositionEditor } from '../../context/CompositionEditorContext';
import { ServiceBadge } from '../utility/ServiceBadge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ConfirmDialog } from '../ui/Dialog';
import type { Relationship, Entity } from '../../types';
import { useEditorMode } from '../../hooks/useEditorMode';

const REL_TYPES = ['has_many', 'belongs_to', 'has_one', 'many_to_many'] as const;

export function RelationshipEditor() {
  const { spec, updateSpec } = useDraftEditor();
  const compositionCtx = useCompositionEditor();
  const { mode } = useEditorMode();
  const isGuided = mode === 'guided';
  const [addingFor, setAddingFor] = useState<number | null>(null);

  if (!spec) return null;

  const entities = spec.entities || [];
  const localEntityNames = entities.map((e) => e.name);

  // Build composed entity groups for cross-service relationship selection
  const entityGroups = buildEntityGroups(compositionCtx, localEntityNames);
  const allEntityNames = entityGroups.length > 0
    ? entityGroups.flatMap((g) => g.entities.map((e) => e.name))
    : localEntityNames;

  // Flatten all relationships with source entity context
  const allRelationships = entities.flatMap((entity, entityIdx) =>
    (entity.relationships || []).map((rel, relIdx) => ({
      entityIdx,
      relIdx,
      entityName: entity.name,
      entityDisplayName: entity.display_name || entity.name,
      ...rel,
      isExternal: !allEntityNames.includes(rel.entity),
      isCrossService: !localEntityNames.includes(rel.entity) && allEntityNames.includes(rel.entity),
    })),
  );

  // Service name for composition context
  const serviceName = compositionCtx
    ? compositionCtx.isHostSpec
      ? compositionCtx.hostSpecName
      : compositionCtx.activeServiceName
    : null;

  const updateRelationship = (entityIdx: number, relIdx: number, rel: Relationship) => {
    updateSpec((s) => {
      const entities = [...s.entities];
      const rels = [...(entities[entityIdx].relationships || [])];
      rels[relIdx] = rel;
      entities[entityIdx] = { ...entities[entityIdx], relationships: rels };
      return { ...s, entities };
    });
  };

  const removeRelationship = (entityIdx: number, relIdx: number) => {
    updateSpec((s) => {
      const entities = [...s.entities];
      const rels = (entities[entityIdx].relationships || []).filter((_, i) => i !== relIdx);
      entities[entityIdx] = { ...entities[entityIdx], relationships: rels };
      return { ...s, entities };
    });
  };

  const addRelationship = (entityIdx: number, rel: Relationship) => {
    updateSpec((s) => {
      const entities = [...s.entities];
      const rels = [...(entities[entityIdx].relationships || []), rel];
      entities[entityIdx] = { ...entities[entityIdx], relationships: rels };
      return { ...s, entities };
    });
    setAddingFor(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-zinc-100">
            Relationships ({allRelationships.length})
          </h2>
          {serviceName && <ServiceBadge service={serviceName} />}
        </div>
      </div>

      {isGuided && (
        <Card>
          <p className="text-sm text-surface-600 dark:text-zinc-400">
            Guided mode is active. Expert relationship settings are hidden.
          </p>
        </Card>
      )}

      {/* Visual map */}
      <RelationshipMapView entities={entities} relationships={allRelationships} />

      {/* Per-entity relationship groups */}
      {entities.map((entity, entityIdx) => {
        const rels = entity.relationships || [];
        const incomingRels = allRelationships.filter(
          (r) => r.entity === entity.name && r.entityIdx !== entityIdx,
        );

        return (
          <Card key={entityIdx}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-surface-900 dark:text-zinc-100">{entity.display_name || entity.name}</h3>
                <span className="text-xs text-surface-400 dark:text-zinc-500 font-mono">{entity.name}</span>
                {rels.length > 0 && (
                  <span className="text-xs text-surface-400 dark:text-zinc-500">
                    {rels.length} outgoing
                  </span>
                )}
                {incomingRels.length > 0 && (
                  <span className="text-xs text-surface-400 dark:text-zinc-500">
                    {incomingRels.length} incoming
                  </span>
                )}
              </div>
              <button
                onClick={() => setAddingFor(addingFor === entityIdx ? null : entityIdx)}
                className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>

            {/* Outgoing relationships */}
            {rels.length === 0 && addingFor !== entityIdx && (
              <p className="text-sm text-surface-400 dark:text-zinc-500 text-center py-3">No relationships</p>
            )}

            <div className="space-y-2">
              {rels.map((rel, relIdx) => (
                <RelationshipCard
                  key={relIdx}
                  rel={rel}
                  allEntityNames={allEntityNames}
                  localEntityNames={localEntityNames}
                  entityGroups={entityGroups}
                  compositionCtx={compositionCtx}
                  localEntities={entities}
                  isExternal={!allEntityNames.includes(rel.entity)}
                  basicMode={isGuided}
                  onUpdate={(updated) => updateRelationship(entityIdx, relIdx, updated)}
                  onRemove={() => removeRelationship(entityIdx, relIdx)}
                />
              ))}
            </div>

            {/* Incoming (read-only) */}
            {incomingRels.length > 0 && (
              <div className="mt-3 pt-3 border-t border-surface-100 dark:border-zinc-800">
                <p className="text-xs text-surface-400 dark:text-zinc-500 mb-1">Referenced by:</p>
                <div className="flex flex-wrap gap-2">
                  {incomingRels.map((r, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-50 dark:bg-zinc-800/50 rounded text-xs text-surface-500 dark:text-zinc-400"
                    >
                      {r.entityName}
                      <span className="text-surface-300 dark:text-zinc-600">&rarr;</span>
                      <span className="font-mono">{r.type}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Add new relationship form */}
            {addingFor === entityIdx && (
              <NewRelationshipForm
                allEntityNames={allEntityNames}
                localEntityNames={localEntityNames}
                entityGroups={entityGroups}
                compositionCtx={compositionCtx}
                localEntities={entities}
                basicMode={isGuided}
                onAdd={(rel) => addRelationship(entityIdx, rel)}
                onCancel={() => setAddingFor(null)}
              />
            )}
          </Card>
        );
      })}
    </div>
  );
}

// --- Relationship Card (editable) ---

function RelationshipCard({
  rel,
  allEntityNames,
  localEntityNames,
  entityGroups,
  compositionCtx,
  localEntities,
  isExternal,
  basicMode,
  onUpdate,
  onRemove,
}: {
  rel: Relationship;
  allEntityNames: string[];
  localEntityNames: string[];
  entityGroups: EntityGroupOption[];
  compositionCtx: ReturnType<typeof useCompositionEditor>;
  localEntities: Entity[];
  isExternal: boolean;
  basicMode: boolean;
  onUpdate: (rel: Relationship) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const isCrossService = !isExternal && !localEntityNames.includes(rel.entity);
  const crossServiceName = isCrossService && compositionCtx
    ? compositionCtx.composedSources[rel.entity] || null
    : null;

  return (
    <div className="rounded-lg border border-surface-200 dark:border-zinc-800 p-3 hover:border-surface-300 dark:hover:border-zinc-700 transition-colors">
      {/* Summary row */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center gap-2 text-left min-w-0"
        >
          <GitBranch className="w-3.5 h-3.5 text-surface-400 dark:text-zinc-500 flex-shrink-0" />
          <span className="font-mono text-sm text-surface-700 dark:text-zinc-300 truncate">{rel.name}</span>
          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-[10px] font-medium">
            {rel.type}
          </span>
          <ArrowRight className="w-3 h-3 text-surface-300 dark:text-zinc-600 flex-shrink-0" />
          <span className={`text-sm truncate ${isExternal ? 'text-amber-600 italic' : isCrossService ? 'text-indigo-600 dark:text-indigo-400' : 'text-surface-700 dark:text-zinc-300'}`}>
            {rel.entity}
          </span>
          {isCrossService && crossServiceName && (
            <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 text-[9px] font-medium flex-shrink-0">
              {crossServiceName}
            </span>
          )}
          {isExternal && (
            <span title="External entity — not in any service"><AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" /></span>
          )}
        </button>
        <div className="flex items-center gap-1 flex-shrink-0">
          {rel.show_in_detail && (
            <span className="px-1 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-[9px]">detail</span>
          )}
          {rel.inline_create && (
            <span className="px-1 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-[9px]">create</span>
          )}
          {rel.inline_edit && (
            <span className="px-1 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 text-[9px]">edit</span>
          )}
          <button
            onClick={() => setConfirmRemove(true)}
            className="p-1 text-surface-300 dark:text-zinc-600 hover:text-danger-500 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Expanded edit form */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-surface-100 dark:border-zinc-800 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-500 dark:text-zinc-400 mb-1">Name</label>
              <input
                type="text"
                value={rel.name}
                onChange={(e) => onUpdate({ ...rel, name: e.target.value })}
                className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 dark:text-zinc-400 mb-1">Display Name</label>
              <input
                type="text"
                value={rel.display_name || ''}
                onChange={(e) => onUpdate({ ...rel, display_name: e.target.value || undefined })}
                className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 dark:text-zinc-400 mb-1">Type</label>
              <select
                value={rel.type}
                onChange={(e) => onUpdate({ ...rel, type: e.target.value })}
                className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
              >
                {REL_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 dark:text-zinc-400 mb-1">Target Entity</label>
              <div className="flex items-center gap-1">
                <select
                  value={allEntityNames.includes(rel.entity) ? rel.entity : '__custom__'}
                  onChange={(e) => {
                    if (e.target.value !== '__custom__') {
                      onUpdate({ ...rel, entity: e.target.value });
                    }
                  }}
                  className="flex-1 px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
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
                    allEntityNames.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))
                  )}
                  {isExternal && (
                    <option value="__custom__">{rel.entity} (external)</option>
                  )}
                </select>
                {isCrossService && crossServiceName && (
                  <span title={`From ${crossServiceName}`}><ExternalLink className="w-3.5 h-3.5 text-indigo-400" /></span>
                )}
                {isExternal && (
                  <span title="External entity reference"><ExternalLink className="w-3.5 h-3.5 text-amber-400" /></span>
                )}
              </div>
            </div>
            {!basicMode && (
              <>
                <ForeignKeyField
                  value={rel.foreign_key || ''}
                  targetEntity={rel.entity}
                  compositionCtx={compositionCtx}
                  localEntities={localEntities}
                  onChange={(v) => onUpdate({ ...rel, foreign_key: v || undefined })}
                />
                <div>
                  <label className="block text-xs font-medium text-surface-500 dark:text-zinc-400 mb-1">Through (join entity)</label>
                  <input
                    type="text"
                    value={rel.through || ''}
                    onChange={(e) => onUpdate({ ...rel, through: e.target.value || undefined })}
                    className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
                    placeholder="Optional join entity"
                  />
                </div>
              </>
            )}
          </div>

          {/* Boolean flags */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-surface-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={rel.show_in_detail ?? false}
                onChange={(e) => onUpdate({ ...rel, show_in_detail: e.target.checked || undefined })}
                className="rounded border-surface-300 dark:border-zinc-700"
              />
              Show in detail
            </label>
            {!basicMode && (
              <>
                <label className="flex items-center gap-2 text-sm text-surface-600 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={rel.inline_create ?? false}
                    onChange={(e) => onUpdate({ ...rel, inline_create: e.target.checked || undefined })}
                    className="rounded border-surface-300 dark:border-zinc-700"
                  />
                  Inline create
                </label>
                <label className="flex items-center gap-2 text-sm text-surface-600 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={rel.inline_edit ?? false}
                    onChange={(e) => onUpdate({ ...rel, inline_edit: e.target.checked || undefined })}
                    className="rounded border-surface-300 dark:border-zinc-700"
                  />
                  Inline edit
                </label>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={() => {
          onRemove();
          setConfirmRemove(false);
        }}
        title="Remove relationship"
        description={`Remove relationship "${rel.name}"?`}
        confirmLabel="Remove"
        confirmColor="danger"
      />
    </div>
  );
}

// --- New relationship inline form ---

function NewRelationshipForm({
  allEntityNames,
  localEntityNames,
  entityGroups,
  compositionCtx,
  localEntities,
  basicMode,
  onAdd,
  onCancel,
}: {
  allEntityNames: string[];
  localEntityNames: string[];
  entityGroups: EntityGroupOption[];
  compositionCtx: ReturnType<typeof useCompositionEditor>;
  localEntities: Entity[];
  basicMode: boolean;
  onAdd: (rel: Relationship) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('has_many');
  const [entity, setEntity] = useState(localEntityNames[0] || allEntityNames[0] || '');
  const [foreignKey, setForeignKey] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showInDetail, setShowInDetail] = useState(true);

  const isCrossService = !localEntityNames.includes(entity) && allEntityNames.includes(entity);
  const crossServiceName = isCrossService && compositionCtx
    ? compositionCtx.composedSources[entity] || null
    : null;

  const handleAdd = () => {
    if (!name.trim() || !entity) return;
    onAdd({
      name: name.trim(),
      type,
      entity,
      foreign_key: foreignKey || undefined,
      display_name: displayName || undefined,
      show_in_detail: showInDetail || undefined,
    });
  };

  return (
    <div className="mt-3 rounded-lg border-2 border-dashed border-brand-300 dark:border-brand-700 p-4">
      {isCrossService && crossServiceName && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-950 rounded-lg text-xs text-indigo-700 dark:text-indigo-300">
          <ExternalLink className="w-3.5 h-3.5" />
          Cross-service relationship targeting <strong>{crossServiceName}</strong>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-surface-500 dark:text-zinc-400 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
            placeholder="e.g. documents"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-500 dark:text-zinc-400 mb-1">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
            placeholder="e.g. Documents"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-500 dark:text-zinc-400 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
          >
            {REL_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-500 dark:text-zinc-400 mb-1">Target Entity</label>
          <select
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
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
              allEntityNames.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))
            )}
          </select>
        </div>
        {!basicMode && (
          <ForeignKeyField
            value={foreignKey}
            targetEntity={entity}
            compositionCtx={compositionCtx}
            localEntities={localEntities}
            onChange={setForeignKey}
          />
        )}
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-surface-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={showInDetail}
              onChange={(e) => setShowInDetail(e.target.checked)}
              className="rounded border-surface-300 dark:border-zinc-700"
            />
            Show in detail
          </label>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 mt-3">
        <Button
          variant="ghost"
          color="neutral"
          size="sm"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!name.trim() || !entity}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Relationship
        </Button>
      </div>
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
      <label className="block text-xs font-medium text-surface-500 dark:text-zinc-400 mb-1">Foreign Key</label>
      {fieldNames.length > 0 ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900 font-mono"
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
          className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
          placeholder="auto-inferred if empty"
        />
      )}
    </div>
  );
}

// --- Visual relationship map (compact, read-from-draft) ---

interface FlatRel {
  entityIdx: number;
  relIdx: number;
  entityName: string;
  entityDisplayName: string;
  name: string;
  type: string;
  entity: string;
  isExternal: boolean;
}

function RelationshipMapView({
  entities,
  relationships,
}: {
  entities: Entity[];
  relationships: FlatRel[];
}) {
  if (relationships.length === 0) {
    return (
      <Card className="text-center">
        <GitBranch className="w-8 h-8 text-surface-300 dark:text-zinc-600 mx-auto mb-2" />
        <p className="text-sm text-surface-400 dark:text-zinc-500">
          No relationships defined yet. Add relationships to entities below.
        </p>
      </Card>
    );
  }

  // Build adjacency for visual
  const entityNames = entities.map((e) => e.name);
  const entityMap = new Map(entities.map((e) => [e.name, e]));

  return (
    <Card>
      <h3 className="text-sm font-medium text-surface-700 dark:text-zinc-300 mb-3">Relationship Map</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {entities.map((entity) => {
          const outgoing = relationships.filter((r) => r.entityName === entity.name);
          const incoming = relationships.filter(
            (r) => r.entity === entity.name && r.entityName !== entity.name,
          );
          const hasConnections = outgoing.length > 0 || incoming.length > 0;

          return (
            <div
              key={entity.name}
              className={`rounded-lg p-3 text-sm ${
                hasConnections
                  ? 'border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50'
                  : 'border border-surface-200 dark:border-zinc-800 bg-surface-50/50 dark:bg-zinc-800/50'
              }`}
            >
              <div className="font-medium text-surface-900 dark:text-zinc-100 truncate mb-1">
                {entity.display_name || entity.name}
              </div>
              {outgoing.length > 0 && (
                <div className="space-y-0.5">
                  {outgoing.map((r, i) => (
                    <div key={i} className="flex items-center gap-1 text-[11px]">
                      <ArrowRight className="w-2.5 h-2.5 text-blue-400" />
                      <span className="text-blue-600 dark:text-blue-400">{r.type}</span>
                      <span className={r.isExternal ? 'text-amber-600 italic' : 'text-surface-600 dark:text-zinc-400'}>
                        {r.entity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {incoming.length > 0 && (
                <div className="space-y-0.5 mt-1 pt-1 border-t border-surface-200 dark:border-zinc-800">
                  {incoming.map((r, i) => (
                    <div key={i} className="flex items-center gap-1 text-[11px] text-surface-400 dark:text-zinc-500">
                      <span>&larr;</span>
                      <span>{r.entityName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
