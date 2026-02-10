import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { useDraftEditor } from '../../context/DraftEditorContext';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/Dialog';
import type { NavItem } from '../../types';

export function NavigationEditor() {
  const { spec, updateNavItem, addNavItem, removeNavItem, updateSpec } = useDraftEditor();
  if (!spec) return null;

  const items = spec.navigation?.items || [];
  const allEntities = spec.entities.map((e) => e.name);
  const roles = Object.keys(spec.auth?.roles || {});
  const pages = (spec.pages || []).map((p) => p.id);

  const handleAdd = () => {
    const id = `nav_${items.length + 1}`;
    addNavItem({
      id,
      label: 'New Item',
      icon: 'circle',
      path: `/${id}`,
    });
  };

  const moveItem = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= items.length) return;
    updateSpec((s) => {
      const newItems = [...(s.navigation?.items || [])];
      [newItems[fromIndex], newItems[toIndex]] = [newItems[toIndex], newItems[fromIndex]];
      return { ...s, navigation: { ...s.navigation, items: newItems } };
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-zinc-100">
          Navigation ({items.length} items)
        </h2>
        <Button
          onClick={handleAdd}
          size="sm"
          icon={<Plus className="w-4 h-4" />}
        >
          Add Item
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-800">
          <p className="text-surface-500 dark:text-zinc-400 mb-3">No navigation items</p>
          <Button
            variant="outlined"
            onClick={handleAdd}
            size="sm"
            icon={<Plus className="w-4 h-4" />}
          >
            Add first item
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <NavItemRow
              key={index}
              item={item}
              index={index}
              onUpdate={(updated) => updateNavItem(index, updated)}
              onRemove={() => removeNavItem(index)}
              onMoveUp={() => moveItem(index, 'up')}
              onMoveDown={() => moveItem(index, 'down')}
              canMoveUp={index > 0}
              canMoveDown={index < items.length - 1}
              entities={allEntities}
              roles={roles}
              pages={pages}
              allItems={items}
              onUpdateChildren={(children) => {
                updateNavItem(index, { ...item, children });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface NavItemRowProps {
  item: NavItem;
  index: number;
  onUpdate: (item: NavItem) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  entities: string[];
  roles: string[];
  pages: string[];
  allItems: NavItem[];
  onUpdateChildren: (children: NavItem[]) => void;
  depth?: number;
}

function NavItemRow({
  item,
  index,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  entities,
  roles,
  pages,
  allItems,
  onUpdateChildren,
  depth = 0,
}: NavItemRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const children = item.children || [];

  const addChild = () => {
    const id = `${item.id}_child_${children.length + 1}`;
    onUpdateChildren([...children, { id, label: 'New Child', path: `/${id}` }]);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-800" style={{ marginLeft: depth * 24 }}>
      <div className="flex items-center gap-2 p-3">
        <GripVertical className="w-4 h-4 text-surface-300 dark:text-zinc-600 cursor-grab flex-shrink-0" />

        {children.length > 0 ? (
          <button onClick={() => setExpanded(!expanded)} className="p-0.5">
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-surface-400 dark:text-zinc-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-surface-400 dark:text-zinc-500" />
            )}
          </button>
        ) : (
          <div className="w-4.5" />
        )}

        <input
          type="text"
          value={item.id}
          onChange={(e) => onUpdate({ ...item, id: e.target.value })}
          className="w-28 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs font-mono bg-white dark:bg-zinc-900"
          placeholder="id"
        />
        <input
          type="text"
          value={item.label}
          onChange={(e) => onUpdate({ ...item, label: e.target.value })}
          className="w-32 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
          placeholder="Label"
        />
        <input
          type="text"
          value={item.icon || ''}
          onChange={(e) => onUpdate({ ...item, icon: e.target.value || undefined })}
          className="w-24 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs font-mono bg-white dark:bg-zinc-900"
          placeholder="icon"
        />
        <input
          type="text"
          value={item.path || ''}
          onChange={(e) => onUpdate({ ...item, path: e.target.value || undefined })}
          className="w-32 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs font-mono bg-white dark:bg-zinc-900"
          placeholder="/path"
        />
        <select
          value={item.entity || ''}
          onChange={(e) => {
            const entity = e.target.value || undefined;
            onUpdate({ ...item, entity });
          }}
          className="w-28 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs bg-white dark:bg-zinc-900"
        >
          <option value="">entity...</option>
          {entities.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="p-1 text-surface-300 dark:text-zinc-600 hover:text-surface-500 dark:hover:text-zinc-400 disabled:opacity-30"
            title="Move up"
          >
            <span className="text-xs">&#x25B2;</span>
          </button>
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="p-1 text-surface-300 dark:text-zinc-600 hover:text-surface-500 dark:hover:text-zinc-400 disabled:opacity-30"
            title="Move down"
          >
            <span className="text-xs">&#x25BC;</span>
          </button>
          <button onClick={addChild} className="p-1 text-surface-300 dark:text-zinc-600 hover:text-brand-500" title="Add child">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setConfirmRemove(true)} className="p-1 text-surface-300 dark:text-zinc-600 hover:text-danger-500">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-surface-100 dark:border-zinc-800">
          {/* Permissions */}
          {roles.length > 0 && (
            <div className="mt-2">
              <label className="text-xs font-medium text-surface-500 dark:text-zinc-400 mb-1 block">Permissions</label>
              <div className="flex flex-wrap gap-1">
                {roles.map((role) => {
                  const selected = (item.permissions || []).includes(role);
                  return (
                    <button
                      key={role}
                      onClick={() => {
                        const perms = item.permissions || [];
                        onUpdate({
                          ...item,
                          permissions: selected
                            ? perms.filter((p) => p !== role)
                            : [...perms, role],
                        });
                      }}
                      className={`px-2 py-0.5 text-xs rounded-full border ${
                        selected
                          ? 'bg-brand-100 dark:bg-brand-950 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-400'
                          : 'bg-white dark:bg-zinc-900 border-surface-200 dark:border-zinc-800 text-surface-400 dark:text-zinc-500'
                      }`}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Badge */}
          <div className="mt-2 flex gap-2">
            <div>
              <label className="text-xs font-medium text-surface-500 dark:text-zinc-400 block">Badge Type</label>
              <select
                value={item.badge?.type || ''}
                onChange={(e) =>
                  onUpdate({
                    ...item,
                    badge: e.target.value
                      ? { ...item.badge, type: e.target.value }
                      : undefined,
                  })
                }
                className="px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs bg-white dark:bg-zinc-900 mt-0.5"
              >
                <option value="">None</option>
                <option value="count">count</option>
                <option value="source">source</option>
              </select>
            </div>
            {item.badge && (
              <div>
                <label className="text-xs font-medium text-surface-500 dark:text-zinc-400 block">Badge Color</label>
                <select
                  value={item.badge?.color || ''}
                  onChange={(e) =>
                    onUpdate({
                      ...item,
                      badge: { ...item.badge!, color: e.target.value || undefined },
                    })
                  }
                  className="px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs bg-white dark:bg-zinc-900 mt-0.5"
                >
                  <option value="">default</option>
                  <option value="warning">warning</option>
                  <option value="danger">danger</option>
                  <option value="success">success</option>
                  <option value="info">info</option>
                </select>
              </div>
            )}
          </div>

          {/* Children */}
          {children.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {children.map((child, ci) => (
                <NavItemRow
                  key={ci}
                  item={child}
                  index={ci}
                  onUpdate={(updated) => {
                    const newChildren = [...children];
                    newChildren[ci] = updated;
                    onUpdateChildren(newChildren);
                  }}
                  onRemove={() => {
                    onUpdateChildren(children.filter((_, i) => i !== ci));
                  }}
                  onMoveUp={() => {
                    if (ci === 0) return;
                    const newChildren = [...children];
                    [newChildren[ci - 1], newChildren[ci]] = [newChildren[ci], newChildren[ci - 1]];
                    onUpdateChildren(newChildren);
                  }}
                  onMoveDown={() => {
                    if (ci === children.length - 1) return;
                    const newChildren = [...children];
                    [newChildren[ci], newChildren[ci + 1]] = [newChildren[ci + 1], newChildren[ci]];
                    onUpdateChildren(newChildren);
                  }}
                  canMoveUp={ci > 0}
                  canMoveDown={ci < children.length - 1}
                  entities={entities}
                  roles={roles}
                  pages={pages}
                  allItems={allItems}
                  onUpdateChildren={(grandchildren) => {
                    const newChildren = [...children];
                    newChildren[ci] = { ...newChildren[ci], children: grandchildren };
                    onUpdateChildren(newChildren);
                  }}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={() => {
          onRemove();
          setConfirmRemove(false);
        }}
        title="Remove navigation item"
        description={`Remove "${item.label}"?`}
        confirmLabel="Remove"
        confirmColor="danger"
      />
    </div>
  );
}
