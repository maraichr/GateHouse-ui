import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, LayoutGrid, Columns2, Rows3, GitBranch, FileText } from 'lucide-react';
import { Card } from '../../ui/Card';
import type { DetailView, DetailTab, DetailSection, HeaderStat } from '../../../types';
import { SectionEditor } from './SectionEditor';
import { useEditorMode } from '../../../hooks/useEditorMode';

interface DetailViewEditorProps {
  view: DetailView;
  onChange: (view: DetailView) => void;
  availableFields: string[];
  roles?: string[];
  relationships?: string[];
}

const LAYOUT_OPTIONS: { value: string; label: string; description: string; icon: typeof LayoutGrid }[] = [
  { value: 'tabbed', label: 'Tabbed', description: 'Multiple tabs -- each tab can hold field sections or a relationship table', icon: LayoutGrid },
  { value: 'two_column', label: 'Two Column', description: 'Side-by-side layout with left and right section lists', icon: Columns2 },
  { value: 'single_column', label: 'Single Column', description: 'Simple vertical stack of field sections', icon: Rows3 },
];

export function DetailViewEditor({
  view,
  onChange,
  availableFields,
  roles = [],
  relationships = [],
}: DetailViewEditorProps) {
  const { mode } = useEditorMode();
  const isBasic = mode === 'basic';

  return (
    <div className="space-y-5">
      {isBasic && (
        <Card padding="sm">
          <p className="text-sm text-surface-600 dark:text-zinc-400">
            Basic mode is active. Header stats and advanced tab controls are hidden.
          </p>
        </Card>
      )}

      {/* Layout */}
      <Card padding="sm">
        <h4 className="font-medium text-surface-900 dark:text-zinc-100 text-sm mb-3">Layout</h4>
        <div className="grid grid-cols-3 gap-3">
          {LAYOUT_OPTIONS.map(({ value, label, description, icon: Icon }) => (
            <label
              key={value}
              className={`flex flex-col gap-1.5 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                view.layout === value
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                  : 'border-surface-200 dark:border-zinc-800 hover:border-surface-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="detail-layout"
                  checked={view.layout === value}
                  onChange={() => onChange({ ...view, layout: value })}
                  className="text-brand-600"
                />
                <Icon className={`w-4 h-4 ${view.layout === value ? 'text-brand-600 dark:text-brand-400' : 'text-surface-400 dark:text-zinc-500'}`} />
                <span className={`text-sm font-medium ${view.layout === value ? 'text-brand-700 dark:text-brand-400' : 'text-surface-700 dark:text-zinc-300'}`}>{label}</span>
              </div>
              <p className="text-[11px] text-surface-500 dark:text-zinc-400 leading-tight pl-6">{description}</p>
            </label>
          ))}
        </div>
      </Card>

      {/* Header */}
      <Card padding="sm">
        <h4 className="font-medium text-surface-900 dark:text-zinc-100 text-sm mb-3">Header</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Title Template</label>
            <input
              type="text"
              value={view.header?.title || ''}
              onChange={(e) =>
                onChange({
                  ...view,
                  header: { ...view.header, title: e.target.value },
                })
              }
              className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
              placeholder="{{field_name}}"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Subtitle Template</label>
            <input
              type="text"
              value={view.header?.subtitle || ''}
              onChange={(e) =>
                onChange({
                  ...view,
                  header: {
                    ...view.header,
                    title: view.header?.title || '',
                    subtitle: e.target.value || undefined,
                  },
                })
              }
              className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
              placeholder="{{field_name}}"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Avatar Field</label>
            <select
              value={view.header?.avatar || ''}
              onChange={(e) =>
                onChange({
                  ...view,
                  header: {
                    ...view.header,
                    title: view.header?.title || '',
                    avatar: e.target.value || undefined,
                  },
                })
              }
              className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
            >
              <option value="">None</option>
              {availableFields.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Status Badge Field</label>
            <select
              value={view.header?.status_badge || ''}
              onChange={(e) =>
                onChange({
                  ...view,
                  header: {
                    ...view.header,
                    title: view.header?.title || '',
                    status_badge: e.target.value || undefined,
                  },
                })
              }
              className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
            >
              <option value="">None</option>
              {availableFields.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Header Stats */}
      {!isBasic && (
        <HeaderStatsEditor
          stats={view.header?.stats || []}
          onChange={(stats) =>
            onChange({
              ...view,
              header: {
                ...view.header,
                title: view.header?.title || '',
                stats: stats.length > 0 ? stats : undefined,
              },
            })
          }
          availableFields={availableFields}
        />
      )}

      {/* Content -- varies by layout */}
      {view.layout === 'tabbed' && (
        <TabbedContent
          tabs={view.tabs || []}
          onChange={(tabs) => onChange({ ...view, tabs })}
          availableFields={availableFields}
          roles={roles}
          relationships={relationships}
          basicMode={isBasic}
        />
      )}
      {view.layout === 'two_column' && (
        <TwoColumnContent
          left={view.left || []}
          right={view.right?.sections || []}
          onChangeLeft={(left) => onChange({ ...view, left })}
          onChangeRight={(sections) => onChange({ ...view, right: { sections } })}
          availableFields={availableFields}
          roles={roles}
        />
      )}
      {view.layout === 'single_column' && (
        <SingleColumnContent
          tabs={view.tabs || []}
          onChange={(tabs) => onChange({ ...view, tabs })}
          availableFields={availableFields}
          roles={roles}
        />
      )}
    </div>
  );
}

// --- Tabbed Content ---

function TabbedContent({
  tabs,
  onChange,
  availableFields,
  roles,
  relationships,
  basicMode,
}: {
  tabs: DetailTab[];
  onChange: (tabs: DetailTab[]) => void;
  availableFields: string[];
  roles: string[];
  relationships: string[];
  basicMode: boolean;
}) {
  // Find relationships not yet assigned to any tab
  const usedRelationships = new Set(
    tabs.filter((t) => t.content?.type === 'relationship_table' && t.content.relationship)
      .map((t) => t.content!.relationship!),
  );
  const unusedRelationships = relationships.filter((r) => !usedRelationships.has(r));

  const addFieldsTab = () => {
    const id = `tab_${tabs.length + 1}`;
    onChange([
      ...tabs,
      { id, label: 'New Tab', icon: 'info', sections: [{ title: 'Details', layout: 'grid', fields: [] }] },
    ]);
  };

  const addRelationshipTab = (relationship: string) => {
    const label = relationship.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    onChange([
      ...tabs,
      {
        id: relationship,
        label,
        icon: 'list',
        content: { type: 'relationship_table', relationship },
      },
    ]);
  };

  const updateTab = (i: number, tab: DetailTab) => {
    const next = [...tabs];
    next[i] = tab;
    onChange(next);
  };

  const removeTab = (i: number) => {
    onChange(tabs.filter((_, idx) => idx !== i));
  };

  const moveTab = (i: number, dir: 'up' | 'down') => {
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= tabs.length) return;
    const next = [...tabs];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <Card padding="sm">
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-medium text-surface-900 dark:text-zinc-100 text-sm">Tabs ({tabs.length})</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={addFieldsTab}
            className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
          >
            <FileText className="w-3 h-3" />
            Add Fields Tab
          </button>
          {!basicMode && unusedRelationships.length > 0 && (
            <div className="relative group">
              <button className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                <GitBranch className="w-3 h-3" />
                Add Relationship Tab
                <ChevronDown className="w-3 h-3" />
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-zinc-900 border border-surface-200 dark:border-zinc-800 rounded-lg shadow-lg z-10 hidden group-hover:block">
                {unusedRelationships.map((r) => (
                  <button
                    key={r}
                    onClick={() => addRelationshipTab(r)}
                    className="w-full text-left px-3 py-1.5 text-sm text-surface-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-700 dark:hover:text-indigo-300 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {basicMode && (
        <p className="text-[11px] text-surface-500 dark:text-zinc-400 mb-2">
          Advanced mode enables relationship tabs and header stats.
        </p>
      )}
      <p className="text-[11px] text-surface-400 dark:text-zinc-500 mb-3">
        Each tab appears as a switchable section in the detail view. Use "Fields" tabs for entity data and "Relationship" tabs to show related records.
      </p>

      {tabs.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-surface-300 dark:border-zinc-700 rounded-lg">
          <p className="text-sm text-surface-500 dark:text-zinc-400 mb-2">No tabs configured</p>
          <p className="text-xs text-surface-400 dark:text-zinc-500">Add a fields tab for entity data, or a relationship tab for related records</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tabs.map((tab, i) => (
            <TabEditor
              key={i}
              tab={tab}
              onUpdate={(t) => updateTab(i, t)}
              onRemove={() => removeTab(i)}
              onMoveUp={() => moveTab(i, 'up')}
              onMoveDown={() => moveTab(i, 'down')}
              canMoveUp={i > 0}
              canMoveDown={i < tabs.length - 1}
              availableFields={availableFields}
              roles={roles}
              relationships={relationships}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function TabEditor({
  tab,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  availableFields,
  roles,
  relationships,
}: {
  tab: DetailTab;
  onUpdate: (t: DetailTab) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  availableFields: string[];
  roles: string[];
  relationships: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const isRelationship = tab.content?.type === 'relationship_table';
  const sectionCount = tab.sections?.length || 0;
  const totalFields = (tab.sections || []).reduce((n, s) => n + (s.fields?.length || 0), 0);

  return (
    <div className={`border rounded-lg ${isRelationship ? 'border-indigo-200 dark:border-indigo-800' : 'border-surface-200 dark:border-zinc-800'}`}>
      {/* Tab header */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-t-lg ${isRelationship ? 'bg-indigo-50 dark:bg-indigo-950' : 'bg-surface-50 dark:bg-zinc-800/50'}`}>
        <button onClick={() => setExpanded(!expanded)} className="p-0.5">
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-surface-400 dark:text-zinc-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-surface-400 dark:text-zinc-500" />
          )}
        </button>

        {/* Type badge */}
        {isRelationship ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
            <GitBranch className="w-2.5 h-2.5" />
            Relationship
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-200 dark:bg-zinc-700 text-surface-600 dark:text-zinc-400">
            <FileText className="w-2.5 h-2.5" />
            Fields
          </span>
        )}

        <span className="text-sm font-medium text-surface-700 dark:text-zinc-300 flex-1">
          {tab.label || tab.id}
          <span className="ml-2 text-xs text-surface-400 dark:text-zinc-500">
            {isRelationship
              ? tab.content?.relationship ? `\u2192 ${tab.content.relationship}` : '(no relationship selected)'
              : `${totalFields} fields in ${sectionCount} section${sectionCount !== 1 ? 's' : ''}`}
          </span>
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="p-1 text-surface-300 dark:text-zinc-600 hover:text-surface-500 dark:hover:text-zinc-400 disabled:opacity-30"
          >
            <span className="text-xs">&#x25B2;</span>
          </button>
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="p-1 text-surface-300 dark:text-zinc-600 hover:text-surface-500 dark:hover:text-zinc-400 disabled:opacity-30"
          >
            <span className="text-xs">&#x25BC;</span>
          </button>
          <button onClick={onRemove} className="p-1 text-surface-300 dark:text-zinc-600 hover:text-danger-500">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tab body */}
      {expanded && (
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">ID</label>
              <input
                type="text"
                value={tab.id}
                onChange={(e) => onUpdate({ ...tab, id: e.target.value })}
                className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Label</label>
              <input
                type="text"
                value={tab.label}
                onChange={(e) => onUpdate({ ...tab, label: e.target.value })}
                className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Icon</label>
              <input
                type="text"
                value={tab.icon || ''}
                onChange={(e) => onUpdate({ ...tab, icon: e.target.value || undefined })}
                className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
                placeholder="lucide icon"
              />
            </div>
          </div>

          {/* Content type */}
          <div>
            <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Content Type</label>
            <div className="flex gap-3">
              <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer ${
                !isRelationship ? 'border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-950' : 'border-surface-200 dark:border-zinc-800'
              }`}>
                <input
                  type="radio"
                  checked={!isRelationship}
                  onChange={() => onUpdate({ ...tab, content: undefined, sections: tab.sections || [] })}
                  className="text-brand-600"
                />
                <FileText className="w-3.5 h-3.5 text-surface-500 dark:text-zinc-400" />
                <span className="text-sm text-surface-700 dark:text-zinc-300">Field Sections</span>
              </label>
              <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer ${
                isRelationship ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950' : 'border-surface-200 dark:border-zinc-800'
              }`}>
                <input
                  type="radio"
                  checked={isRelationship}
                  onChange={() =>
                    onUpdate({
                      ...tab,
                      sections: undefined,
                      content: { type: 'relationship_table', relationship: relationships[0] || '' },
                    })
                  }
                  className="text-indigo-600"
                />
                <GitBranch className="w-3.5 h-3.5 text-surface-500 dark:text-zinc-400" />
                <span className="text-sm text-surface-700 dark:text-zinc-300">Relationship Table</span>
              </label>
            </div>
          </div>

          {isRelationship ? (
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Relationship</label>
              <select
                value={tab.content?.relationship || ''}
                onChange={(e) =>
                  onUpdate({
                    ...tab,
                    content: { ...tab.content!, type: 'relationship_table', relationship: e.target.value },
                  })
                }
                className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
              >
                <option value="">Select relationship...</option>
                {relationships.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {relationships.length === 0 && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  No relationships defined on this entity. Add relationships in the entity editor first.
                </p>
              )}
            </div>
          ) : (
            <TabSectionsEditor
              sections={tab.sections || []}
              onChange={(sections) => onUpdate({ ...tab, sections })}
              availableFields={availableFields}
              roles={roles}
            />
          )}
        </div>
      )}
    </div>
  );
}

function TabSectionsEditor({
  sections,
  onChange,
  availableFields,
  roles,
}: {
  sections: DetailSection[];
  onChange: (sections: DetailSection[]) => void;
  availableFields: string[];
  roles: string[];
}) {
  const addSection = () => {
    onChange([...sections, { title: 'New Section', layout: 'grid', fields: [] }]);
  };

  const moveSection = (i: number, dir: 'up' | 'down') => {
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400">Sections</label>
      {sections.map((sec, i) => (
        <SectionEditor
          key={i}
          section={sec}
          index={i}
          onUpdate={(s) => {
            const next = [...sections];
            next[i] = s;
            onChange(next);
          }}
          onRemove={() => onChange(sections.filter((_, idx) => idx !== i))}
          availableFields={availableFields}
          roles={roles}
          canMoveUp={i > 0}
          canMoveDown={i < sections.length - 1}
          onMoveUp={() => moveSection(i, 'up')}
          onMoveDown={() => moveSection(i, 'down')}
        />
      ))}
      <button
        onClick={addSection}
        className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
      >
        <Plus className="w-3 h-3" />
        Add Section
      </button>
    </div>
  );
}

// --- Two-Column Content ---

function TwoColumnContent({
  left,
  right,
  onChangeLeft,
  onChangeRight,
  availableFields,
  roles,
}: {
  left: DetailSection[];
  right: DetailSection[];
  onChangeLeft: (sections: DetailSection[]) => void;
  onChangeRight: (sections: DetailSection[]) => void;
  availableFields: string[];
  roles: string[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card padding="sm">
        <h4 className="font-medium text-surface-900 dark:text-zinc-100 text-sm mb-3">Left Column</h4>
        <TabSectionsEditor
          sections={left}
          onChange={onChangeLeft}
          availableFields={availableFields}
          roles={roles}
        />
      </Card>
      <Card padding="sm">
        <h4 className="font-medium text-surface-900 dark:text-zinc-100 text-sm mb-3">Right Column</h4>
        <TabSectionsEditor
          sections={right}
          onChange={onChangeRight}
          availableFields={availableFields}
          roles={roles}
        />
      </Card>
    </div>
  );
}

// --- Single Column Content (reuses tab structure with one implicit tab) ---

function SingleColumnContent({
  tabs,
  onChange,
  availableFields,
  roles,
}: {
  tabs: DetailTab[];
  onChange: (tabs: DetailTab[]) => void;
  availableFields: string[];
  roles: string[];
}) {
  const sections = tabs[0]?.sections || [];

  const handleSectionsChange = (sections: DetailSection[]) => {
    if (tabs.length === 0) {
      onChange([{ id: 'main', label: 'Main', sections }]);
    } else {
      const next = [...tabs];
      next[0] = { ...next[0], sections };
      onChange(next);
    }
  };

  return (
    <Card padding="sm">
      <h4 className="font-medium text-surface-900 dark:text-zinc-100 text-sm mb-3">Sections</h4>
      <TabSectionsEditor
        sections={sections}
        onChange={handleSectionsChange}
        availableFields={availableFields}
        roles={roles}
      />
    </Card>
  );
}

// --- Header Stats Editor ---

const STAT_DISPLAY_TYPES = ['text', 'badge', 'currency', 'star_rating', 'number'];

function HeaderStatsEditor({
  stats,
  onChange,
  availableFields,
}: {
  stats: HeaderStat[];
  onChange: (s: HeaderStat[]) => void;
  availableFields: string[];
}) {
  const addStat = () => {
    onChange([...stats, { label: 'New Stat', value: '' }]);
  };

  const updateStat = (i: number, stat: HeaderStat) => {
    const next = [...stats];
    next[i] = stat;
    onChange(next);
  };

  const removeStat = (i: number) => {
    onChange(stats.filter((_, idx) => idx !== i));
  };

  return (
    <Card padding="sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-surface-900 dark:text-zinc-100 text-sm">Header Stats</h4>
        <button
          onClick={addStat}
          className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
        >
          <Plus className="w-3 h-3" />
          Add Stat
        </button>
      </div>
      <p className="text-[10px] text-surface-400 dark:text-zinc-500 mb-2">
        Key-value stats shown in the detail header area
      </p>

      {stats.length === 0 ? (
        <p className="text-sm text-surface-400 dark:text-zinc-500 text-center py-2">No header stats</p>
      ) : (
        <div className="space-y-1.5">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={stat.label}
                onChange={(e) => updateStat(i, { ...stat, label: e.target.value })}
                className="w-1/4 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
                placeholder="Label"
              />
              <input
                type="text"
                value={typeof stat.value === 'string' ? stat.value : String(stat.value ?? '')}
                onChange={(e) => updateStat(i, { ...stat, value: e.target.value })}
                className="flex-1 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
                placeholder="{{record.field}} or field name"
              />
              <select
                value={stat.display_as || ''}
                onChange={(e) => updateStat(i, { ...stat, display_as: e.target.value || undefined })}
                className="w-28 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs bg-white dark:bg-zinc-900"
              >
                <option value="">default</option>
                {STAT_DISPLAY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button
                onClick={() => removeStat(i)}
                className="p-1 text-surface-400 dark:text-zinc-500 hover:text-danger-500"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
