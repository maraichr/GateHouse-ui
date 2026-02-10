import { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { FieldMultiSelect } from './FieldMultiSelect';

interface SectionData {
  title?: string;
  layout?: string;
  fields?: string[];
  permissions?: string[];
}

interface SectionEditorProps {
  section: SectionData;
  onUpdate: (section: SectionData) => void;
  onRemove: () => void;
  availableFields: string[];
  roles?: string[];
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  index: number;
}

const LAYOUT_OPTIONS = ['grid', 'single_column', 'two_column'];

export function SectionEditor({
  section,
  onUpdate,
  onRemove,
  availableFields,
  roles = [],
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  index,
}: SectionEditorProps) {
  const [expanded, setExpanded] = useState(true);
  const fieldCount = section.fields?.length || 0;

  return (
    <div className="border border-surface-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-surface-50 dark:bg-zinc-800/50 rounded-t-lg">
        <button onClick={() => setExpanded(!expanded)} className="p-0.5">
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-surface-400 dark:text-zinc-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-surface-400 dark:text-zinc-500" />
          )}
        </button>

        <span className="text-sm font-medium text-surface-700 dark:text-zinc-300 flex-1">
          {section.title || `Section ${index + 1}`}
          <span className="ml-2 text-xs text-surface-400 dark:text-zinc-500">({fieldCount} fields)</span>
        </span>

        <div className="flex items-center gap-1">
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
          <button
            onClick={onRemove}
            className="p-1 text-surface-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400"
            title="Remove section"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Title</label>
              <input
                type="text"
                value={section.title || ''}
                onChange={(e) => onUpdate({ ...section, title: e.target.value || undefined })}
                className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-surface-900 dark:text-zinc-100"
                placeholder="Section title"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Layout</label>
              <select
                value={section.layout || 'grid'}
                onChange={(e) => onUpdate({ ...section, layout: e.target.value })}
                className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-surface-900 dark:text-zinc-100"
              >
                {LAYOUT_OPTIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <FieldMultiSelect
            label="Fields"
            availableFields={availableFields}
            selectedFields={section.fields || []}
            onChange={(fields) => onUpdate({ ...section, fields })}
          />

          {roles.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Permissions</label>
              <div className="flex flex-wrap gap-1">
                {roles.map((role) => {
                  const selected = (section.permissions || []).includes(role);
                  return (
                    <button
                      key={role}
                      onClick={() => {
                        const perms = section.permissions || [];
                        onUpdate({
                          ...section,
                          permissions: selected
                            ? perms.filter((p) => p !== role)
                            : [...perms, role],
                        });
                      }}
                      className={`px-2 py-0.5 text-xs rounded-full border ${
                        selected
                          ? 'bg-brand-100 dark:bg-brand-900/40 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300'
                          : 'bg-white dark:bg-zinc-800 border-surface-200 dark:border-zinc-700 text-surface-400 dark:text-zinc-500'
                      }`}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
