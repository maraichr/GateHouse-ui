import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '../../ui/Card';
import type { ActionConfig, ActionButton, BulkAction } from '../../../types';

const ACTION_TYPES = ['navigate', 'create', 'transition', 'api_call'];

interface ActionsEditorProps {
  actions: ActionConfig | undefined;
  bulkActions: BulkAction[] | undefined;
  onChange: (actions: ActionConfig | undefined) => void;
  onBulkChange: (bulkActions: BulkAction[] | undefined) => void;
  roles: string[];
}

export function ActionsEditor({ actions, bulkActions, onChange, onBulkChange, roles }: ActionsEditorProps) {
  const primary = actions?.primary || [];
  const row = actions?.row || [];
  const bulk = bulkActions || [];

  const updateActions = (updates: Partial<ActionConfig>) => {
    const next = { ...actions, ...updates };
    const hasAny = (next.primary && next.primary.length > 0) ||
                   (next.secondary && next.secondary.length > 0) ||
                   (next.row && next.row.length > 0);
    onChange(hasAny ? next : undefined);
  };

  return (
    <Card padding="sm">
      <h4 className="font-medium text-surface-900 dark:text-zinc-100 text-sm mb-3">Actions</h4>

      {/* Primary Actions */}
      <ActionSection
        title="Primary Actions"
        description="Toolbar buttons (e.g. Create New, Export)"
        actions={primary}
        onChange={(items) => updateActions({ primary: items })}
        roles={roles}
      />

      {/* Row Actions */}
      <ActionSection
        title="Row Actions"
        description="Per-row dropdown menu items"
        actions={row}
        onChange={(items) => updateActions({ row: items })}
        roles={roles}
      />

      {/* Bulk Actions */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h5 className="text-xs font-medium text-surface-600 dark:text-zinc-400">Bulk Actions</h5>
            <p className="text-[10px] text-surface-400 dark:text-zinc-500">Multi-select operations</p>
          </div>
          <button
            onClick={() => onBulkChange([...bulk, { label: 'New Action', action: 'api_call' }])}
            className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>
        {bulk.map((action, i) => (
          <div key={i} className="flex items-center gap-2 mb-1.5">
            <input
              type="text"
              value={action.label}
              onChange={(e) => {
                const next = [...bulk];
                next[i] = { ...action, label: e.target.value };
                onBulkChange(next);
              }}
              className="flex-1 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
              placeholder="Label"
            />
            <input
              type="text"
              value={action.icon || ''}
              onChange={(e) => {
                const next = [...bulk];
                next[i] = { ...action, icon: e.target.value || undefined };
                onBulkChange(next);
              }}
              className="w-24 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs font-mono bg-white dark:bg-zinc-900"
              placeholder="icon"
            />
            <button
              onClick={() => onBulkChange(bulk.filter((_, idx) => idx !== i))}
              className="p-1 text-surface-400 dark:text-zinc-500 hover:text-danger-500"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ActionSection({
  title,
  description,
  actions,
  onChange,
  roles,
}: {
  title: string;
  description: string;
  actions: ActionButton[];
  onChange: (a: ActionButton[]) => void;
  roles: string[];
}) {
  const [expanded, setExpanded] = useState(actions.length > 0);

  const addAction = () => {
    onChange([...actions, { label: 'New Action', action: 'navigate' }]);
    setExpanded(true);
  };

  const updateAction = (i: number, a: ActionButton) => {
    const next = [...actions];
    next[i] = a;
    onChange(next);
  };

  const removeAction = (i: number) => {
    onChange(actions.filter((_, idx) => idx !== i));
  };

  const moveAction = (i: number, dir: 'up' | 'down') => {
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= actions.length) return;
    const next = [...actions];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs font-medium text-surface-600 dark:text-zinc-400"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          {title} ({actions.length})
        </button>
        <button
          onClick={addAction}
          className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
        >
          <Plus className="w-3 h-3" />
          Add
        </button>
      </div>
      {!expanded && actions.length === 0 && (
        <p className="text-[10px] text-surface-400 dark:text-zinc-500 pl-4">{description}</p>
      )}
      {expanded && actions.map((action, i) => (
        <div key={i} className="p-2 bg-surface-50 dark:bg-zinc-800/50 rounded-lg mb-1.5">
          <div className="flex items-center gap-2 mb-1">
            <input
              type="text"
              value={action.label}
              onChange={(e) => updateAction(i, { ...action, label: e.target.value })}
              className="flex-1 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
              placeholder="Label"
            />
            <input
              type="text"
              value={action.icon || ''}
              onChange={(e) => updateAction(i, { ...action, icon: e.target.value || undefined })}
              className="w-24 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs font-mono bg-white dark:bg-zinc-900"
              placeholder="icon"
            />
            <select
              value={typeof action.action === 'string' ? action.action : 'navigate'}
              onChange={(e) => updateAction(i, { ...action, action: e.target.value })}
              className="w-28 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs bg-white dark:bg-zinc-900"
            >
              {ACTION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => moveAction(i, 'up')}
                disabled={i === 0}
                className="p-0.5 text-surface-300 dark:text-zinc-600 hover:text-surface-500 dark:hover:text-zinc-400 disabled:opacity-30"
              >
                <span className="text-[10px]">&#x25B2;</span>
              </button>
              <button
                onClick={() => moveAction(i, 'down')}
                disabled={i === actions.length - 1}
                className="p-0.5 text-surface-300 dark:text-zinc-600 hover:text-surface-500 dark:hover:text-zinc-400 disabled:opacity-30"
              >
                <span className="text-[10px]">&#x25BC;</span>
              </button>
              <button
                onClick={() => removeAction(i)}
                className="p-0.5 text-surface-300 dark:text-zinc-600 hover:text-danger-500"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          {roles.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    const perms = action.permissions || [];
                    const next = perms.includes(role)
                      ? perms.filter((r) => r !== role)
                      : [...perms, role];
                    updateAction(i, { ...action, permissions: next.length > 0 ? next : undefined });
                  }}
                  className={`px-1.5 py-0.5 text-[10px] rounded-full border transition-colors ${
                    (action.permissions || []).includes(role)
                      ? 'bg-orange-100 dark:bg-orange-950 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-400'
                      : 'bg-white dark:bg-zinc-900 border-surface-200 dark:border-zinc-800 text-surface-400 dark:text-zinc-500'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
