import { useParams, Link } from 'react-router';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useDraftEditor } from '../../context/DraftEditorContext';
import { useCompositionEditor } from '../../context/CompositionEditorContext';
import { Card } from '../ui/Card';
import type { Field, EnumValue, DisplayRule, Entity, FakeDepends } from '../../types';
import { inferShowIn } from '../../utils/fieldAnalysis';
import { createDefaultListView, createDefaultDetailView, createDefaultFormView } from './views/viewDefaults';

const FIELD_TYPES = [
  'string', 'email', 'phone', 'integer', 'decimal', 'currency',
  'date', 'datetime', 'enum', 'reference', 'boolean', 'richtext', 'address',
];

export function FieldEditor() {
  const { specId, compId, entityIndex: eiStr, fieldIndex: fiStr } = useParams<{
    specId: string;
    compId: string;
    entityIndex: string;
    fieldIndex: string;
  }>();
  const { spec, updateField, updateEntity } = useDraftEditor();

  const entityIndex = parseInt(eiStr || '0', 10);
  const fieldIndex = parseInt(fiStr || '0', 10);

  const basePath = compId && specId
    ? `/projects/${compId}/edit/services/${specId}`
    : `/projects/${specId}/edit`;

  if (!spec || entityIndex >= spec.entities.length) {
    return <div className="text-surface-500 dark:text-zinc-400">Entity not found</div>;
  }

  const entity = spec.entities[entityIndex];
  if (fieldIndex >= entity.fields.length) {
    return <div className="text-surface-500 dark:text-zinc-400">Field not found</div>;
  }

  const field = entity.fields[fieldIndex];
  const compositionCtx = useCompositionEditor();
  const localEntityNames = spec.entities.map((e) => e.name);
  const entityGroups = buildEntityGroups(compositionCtx, localEntityNames);
  const allEntities = entityGroups.length > 0
    ? entityGroups.flatMap((g) => g.entities)
    : localEntityNames;
  const roles = Object.keys(spec.auth?.roles || {});

  const setField = (updates: Partial<Field>) => {
    updateField(entityIndex, fieldIndex, { ...field, ...updates });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={`${basePath}/entities/${entityIndex}`}
          className="p-1.5 text-surface-400 dark:text-zinc-500 hover:text-surface-600 dark:hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h2 className="text-lg font-semibold text-surface-900 dark:text-zinc-100">
          {entity.name} / <span className="font-mono">{field.name}</span>
        </h2>
      </div>

      {/* Common section */}
      <Section title="Field Settings">
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            label="Name"
            value={field.name}
            onChange={(v) => setField({ name: v })}
            placeholder="snake_case"
          />
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">Type</label>
            <select
              value={field.type}
              onChange={(e) => setField({ type: e.target.value })}
              className="w-full px-3 py-2 border border-surface-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900"
            >
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <TextInput
            label="Display Name"
            value={field.display_name || ''}
            onChange={(v) => setField({ display_name: v })}
          />
          <TextInput
            label="Placeholder"
            value={field.placeholder || ''}
            onChange={(v) => setField({ placeholder: v || undefined })}
          />
        </div>

        <div className="flex flex-wrap gap-6 mt-4">
          <Checkbox label="Required" checked={!!field.required} onChange={(v) => setField({ required: v })} />
          <Checkbox label="Primary Key" checked={!!field.primary_key} onChange={(v) => setField({ primary_key: v })} />
          <Checkbox label="Generated" checked={!!field.generated} onChange={(v) => setField({ generated: v })} />
          <Checkbox label="Hidden" checked={!!field.hidden} onChange={(v) => setField({ hidden: v })} />
          <Checkbox label="Sensitive" checked={!!field.sensitive} onChange={(v) => setField({ sensitive: v })} />
          <Checkbox label="Searchable" checked={!!field.searchable} onChange={(v) => setField({ searchable: v })} />
          <Checkbox label="Sortable" checked={!!field.sortable} onChange={(v) => setField({ sortable: v })} />
          <Checkbox label="Filterable" checked={!!field.filterable} onChange={(v) => setField({ filterable: v })} />
        </div>
      </Section>

      {/* Show In Views */}
      <ShowInToggles entity={entity} field={field} entityIndex={entityIndex} updateEntity={updateEntity} />

      {/* Enum values */}
      {field.type === 'enum' && (
        <Section title="Enum Values">
          <EnumValueEditor
            values={field.values || []}
            onChange={(values) => setField({ values })}
          />
        </Section>
      )}

      {/* Reference */}
      {field.type === 'reference' && (
        <Section title="Reference">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">Target Entity</label>
            <ReferenceEntitySelect
              value={field.entity || ''}
              onChange={(v) => setField({ entity: v })}
              entityGroups={entityGroups}
              localEntityNames={localEntityNames}
            />
          </div>
          <div className="mt-3">
            <ReferenceDisplayField
              value={field.display_field || ''}
              onChange={(v) => setField({ display_field: v || undefined })}
              targetEntity={field.entity || ''}
              compositionCtx={compositionCtx}
              localEntities={spec.entities}
            />
          </div>
        </Section>
      )}

      {/* Currency */}
      {field.type === 'currency' && (
        <Section title="Currency Settings">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">Currency</label>
              <select
                value={field.currency || 'USD'}
                onChange={(e) => setField({ currency: e.target.value })}
                className="w-full px-3 py-2 border border-surface-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900"
              >
                {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'BRL'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <TextInput
              label="Mask Pattern"
              value={field.mask_pattern || ''}
              onChange={(v) => setField({ mask_pattern: v || undefined })}
              placeholder="###-##-####"
            />
          </div>
        </Section>
      )}

      {/* Validation */}
      {['string', 'email', 'phone'].includes(field.type) && (
        <Section title="Validation">
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="Min Length"
              value={field.min_length}
              onChange={(v) => setField({ min_length: v })}
            />
            <NumberInput
              label="Max Length"
              value={field.max_length}
              onChange={(v) => setField({ max_length: v })}
            />
            <TextInput
              label="Pattern (regex)"
              value={field.pattern || ''}
              onChange={(v) => setField({ pattern: v || undefined })}
            />
            <TextInput
              label="Pattern Message"
              value={field.pattern_message || ''}
              onChange={(v) => setField({ pattern_message: v || undefined })}
            />
          </div>
        </Section>
      )}

      {/* Permissions */}
      {roles.length > 0 && (
        <Section title="Permissions">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">View</label>
              <MultiSelect
                options={roles}
                selected={field.permissions?.view || []}
                onChange={(view) =>
                  setField({ permissions: { ...field.permissions, view } })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">Edit</label>
              <MultiSelect
                options={roles}
                selected={field.permissions?.edit || []}
                onChange={(edit) =>
                  setField({ permissions: { ...field.permissions, edit } })
                }
              />
            </div>
          </div>
        </Section>
      )}

      {/* Display Rules */}
      <Section title="Display Rules">
        <DisplayRuleEditor
          rules={field.display_rules || []}
          onChange={(rules) => setField({ display_rules: rules })}
        />
      </Section>

      {/* Mock Data (Fake Hints) */}
      <Section title="Mock Data">
        <FakeHintEditor
          fake={field.fake}
          onChange={(fake) => setField({ fake })}
          fieldType={field.type}
          entityFields={entity.fields.map((f) => f.name)}
        />
      </Section>
    </div>
  );
}

// --- Sub-components ---

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <h3 className="font-medium text-surface-900 dark:text-zinc-100 mb-3">{title}</h3>
      {children}
    </Card>
  );
}

function TextInput({
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
        className="w-full px-3 py-2 border border-surface-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900"
      />
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">{label}</label>
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
        className="w-full px-3 py-2 border border-surface-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900"
      />
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-surface-700 dark:text-zinc-300 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-surface-300 dark:border-zinc-700"
      />
      {label}
    </label>
  );
}

function MultiSelect({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => toggle(opt)}
          className={`px-2 py-1 text-xs rounded-full border transition-colors ${
            selected.includes(opt)
              ? 'bg-brand-100 dark:bg-brand-950 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-400'
              : 'bg-white dark:bg-zinc-900 border-surface-200 dark:border-zinc-800 text-surface-500 dark:text-zinc-400 hover:bg-surface-50 dark:hover:bg-zinc-800'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function EnumValueEditor({
  values,
  onChange,
}: {
  values: EnumValue[];
  onChange: (v: EnumValue[]) => void;
}) {
  const addValue = () => {
    onChange([...values, { value: '', label: '', color: '' }]);
  };

  const updateValue = (index: number, updates: Partial<EnumValue>) => {
    const newValues = [...values];
    newValues[index] = { ...newValues[index], ...updates };
    onChange(newValues);
  };

  const removeValue = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={v.value}
              onChange={(e) => updateValue(i, { value: e.target.value })}
              className="w-1/3 px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
              placeholder="value"
            />
            <input
              type="text"
              value={v.label}
              onChange={(e) => updateValue(i, { label: e.target.value })}
              className="flex-1 px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
              placeholder="Label"
            />
            <input
              type="text"
              value={v.color || ''}
              onChange={(e) => updateValue(i, { color: e.target.value || undefined })}
              className="w-24 px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
              placeholder="color"
            />
            <button onClick={() => removeValue(i)} className="p-1 text-surface-400 dark:text-zinc-500 hover:text-danger-500">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addValue}
        className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 mt-2"
      >
        <Plus className="w-3 h-3" />
        Add value
      </button>
    </div>
  );
}

function DisplayRuleEditor({
  rules,
  onChange,
}: {
  rules: DisplayRule[];
  onChange: (r: DisplayRule[]) => void;
}) {
  const addRule = () => {
    onChange([...rules, { condition: '', style: '' }]);
  };

  const updateRule = (index: number, updates: Partial<DisplayRule>) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], ...updates };
    onChange(newRules);
  };

  const removeRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  return (
    <div>
      {rules.length === 0 ? (
        <p className="text-sm text-surface-400 dark:text-zinc-500 text-center py-2">No display rules</p>
      ) : (
        <div className="space-y-2">
          {rules.map((rule, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-surface-50 dark:bg-zinc-800/50 rounded-lg">
              <input
                type="text"
                value={rule.condition}
                onChange={(e) => updateRule(i, { condition: e.target.value })}
                className="flex-1 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
                placeholder="value < today + 30d"
              />
              <input
                type="text"
                value={rule.style}
                onChange={(e) => updateRule(i, { style: e.target.value })}
                className="w-1/4 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
                placeholder="warning"
              />
              <input
                type="text"
                value={rule.tooltip || ''}
                onChange={(e) => updateRule(i, { tooltip: e.target.value || undefined })}
                className="w-1/4 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
                placeholder="Tooltip"
              />
              <button onClick={() => removeRule(i)} className="p-1 text-surface-400 dark:text-zinc-500 hover:text-danger-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={addRule}
        className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 mt-2"
      >
        <Plus className="w-3 h-3" />
        Add rule
      </button>
    </div>
  );
}

// --- Show In Views Toggle ---

function ShowInToggles({
  entity,
  field,
  entityIndex,
  updateEntity,
}: {
  entity: Entity;
  field: Field;
  entityIndex: number;
  updateEntity: (index: number, entity: Entity) => void;
}) {
  const showIn = inferShowIn(entity, field);
  const name = field.name;

  const toggle = (view: 'list' | 'detail' | 'create' | 'edit', on: boolean) => {
    let views = { ...entity.views };

    if (view === 'list') {
      if (!views.list) views = { ...views, list: createDefaultListView(entity) };
      const list = { ...views.list! };
      if (on) {
        if (!list.columns.some((c) => c.field === name)) {
          list.columns = [...list.columns, { field: name }];
        }
      } else {
        list.columns = list.columns.filter((c) => c.field !== name);
      }
      views.list = list;
    }

    if (view === 'detail') {
      if (!views.detail) views = { ...views, detail: createDefaultDetailView(entity) };
      const detail = { ...views.detail! };
      if (on) {
        // Add to first section of first tab
        if (detail.tabs && detail.tabs.length > 0) {
          const tabs = [...detail.tabs];
          const tab = { ...tabs[0] };
          const sections = [...(tab.sections || [])];
          if (sections.length === 0) {
            sections.push({ title: 'Details', layout: 'grid', fields: [name] });
          } else {
            const sec = { ...sections[0] };
            if (!sec.fields?.includes(name)) {
              sec.fields = [...(sec.fields || []), name];
            }
            sections[0] = sec;
          }
          tab.sections = sections;
          tabs[0] = tab;
          detail.tabs = tabs;
        } else if (detail.left) {
          const left = [...detail.left];
          if (left.length === 0) {
            left.push({ title: 'Details', layout: 'grid', fields: [name] });
          } else {
            const sec = { ...left[0] };
            if (!sec.fields?.includes(name)) {
              sec.fields = [...(sec.fields || []), name];
            }
            left[0] = sec;
          }
          detail.left = left;
        }
      } else {
        // Remove from all tabs/sections
        if (detail.tabs) {
          detail.tabs = detail.tabs.map((tab) => ({
            ...tab,
            sections: tab.sections?.map((sec) => ({
              ...sec,
              fields: sec.fields?.filter((f) => f !== name),
            })),
          }));
        }
        if (detail.left) {
          detail.left = detail.left.map((sec) => ({
            ...sec,
            fields: sec.fields?.filter((f) => f !== name),
          }));
        }
        if (detail.right?.sections) {
          detail.right = {
            ...detail.right,
            sections: detail.right.sections.map((sec) => ({
              ...sec,
              fields: sec.fields?.filter((f) => f !== name),
            })),
          };
        }
      }
      views.detail = detail;
    }

    if (view === 'create' || view === 'edit') {
      const key = view;
      if (!views[key]) views = { ...views, [key]: createDefaultFormView(entity, key === 'create') };
      const form = { ...views[key]! };
      if (on) {
        if (form.steps && form.steps.length > 0) {
          const steps = [...form.steps];
          const step = { ...steps[0] };
          if (!step.fields?.includes(name)) {
            step.fields = [...(step.fields || []), name];
          }
          steps[0] = step;
          form.steps = steps;
        } else if (form.sections && form.sections.length > 0) {
          const sections = [...form.sections];
          const sec = { ...sections[0] };
          if (!sec.fields.includes(name)) {
            sec.fields = [...sec.fields, name];
          }
          sections[0] = sec;
          form.sections = sections;
        }
      } else {
        if (form.steps) {
          form.steps = form.steps.map((step) => ({
            ...step,
            fields: step.fields?.filter((f) => f !== name),
          }));
        }
        if (form.sections) {
          form.sections = form.sections.map((sec) => ({
            ...sec,
            fields: sec.fields.filter((f) => f !== name),
          }));
        }
      }
      views[key] = form;
    }

    updateEntity(entityIndex, { ...entity, views });
  };

  const items: { key: 'list' | 'detail' | 'create' | 'edit'; label: string; short: string }[] = [
    { key: 'list', label: 'List View', short: 'L' },
    { key: 'detail', label: 'Detail View', short: 'D' },
    { key: 'create', label: 'Create Form', short: 'C' },
    { key: 'edit', label: 'Edit Form', short: 'E' },
  ];

  return (
    <Card>
      <h3 className="font-medium text-surface-900 dark:text-zinc-100 mb-3">Show In Views</h3>
      <div className="flex flex-wrap gap-3">
        {items.map(({ key, label, short }) => (
          <label
            key={key}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={showIn[key]}
              onChange={(e) => toggle(key, e.target.checked)}
              className="rounded border-surface-300 dark:border-zinc-700"
            />
            <span className="text-sm text-surface-700 dark:text-zinc-300">{label}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              showIn[key]
                ? 'bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-400'
                : 'bg-surface-100 dark:bg-zinc-800 text-surface-400 dark:text-zinc-500'
            }`}>
              {short}
            </span>
          </label>
        ))}
      </div>
    </Card>
  );
}

// --- Composition-aware entity helpers ---

interface EntityGroupOption {
  service: string;
  isCurrent: boolean;
  entities: string[];
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

  const groups = new Map<string, string[]>();
  for (const entity of composedSpec.entities || []) {
    const service = composedSources[entity.name] || hostSpecName;
    if (!groups.has(service)) groups.set(service, []);
    groups.get(service)!.push(entity.name);
  }

  const result: EntityGroupOption[] = [];
  for (const [service, entities] of groups) {
    result.push({ service, isCurrent: service === currentServiceName, entities });
  }
  result.sort((a, b) => (a.isCurrent === b.isCurrent ? 0 : a.isCurrent ? -1 : 1));
  return result;
}

function ReferenceEntitySelect({
  value,
  onChange,
  entityGroups,
  localEntityNames,
}: {
  value: string;
  onChange: (v: string) => void;
  entityGroups: EntityGroupOption[];
  localEntityNames: string[];
}) {
  const allNames = entityGroups.length > 0
    ? entityGroups.flatMap((g) => g.entities)
    : localEntityNames;
  const isExternal = value && !allNames.includes(value);

  return (
    <select
      value={isExternal ? '__custom__' : value}
      onChange={(e) => {
        if (e.target.value !== '__custom__') onChange(e.target.value);
      }}
      className="w-full px-3 py-2 border border-surface-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900"
    >
      <option value="">Select entity...</option>
      {entityGroups.length > 0 ? (
        entityGroups.map((group) => (
          <optgroup key={group.service} label={`${group.service}${group.isCurrent ? ' (current)' : ''}`}>
            {group.entities.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </optgroup>
        ))
      ) : (
        localEntityNames.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))
      )}
      {isExternal && (
        <option value="__custom__">{value} (external)</option>
      )}
    </select>
  );
}

// --- Fake Hint (Mock Data) Editor ---

const FAKER_TAGS: Record<string, string[]> = {
  string: ['company', 'full_name', 'first_name', 'last_name', 'job_title', 'department', 'paragraph', 'sentence', 'word', 'uuid', 'url', 'slug'],
  email: ['email', 'work_email'],
  phone: ['phone', 'mobile_phone'],
  integer: ['integer', 'age', 'year', 'count'],
  decimal: ['decimal', 'percentage', 'latitude', 'longitude'],
  currency: ['price', 'salary', 'amount'],
  date: ['date', 'past_date', 'future_date', 'recent_date'],
  datetime: ['datetime', 'past_datetime', 'recent_datetime'],
  boolean: ['boolean'],
  address: ['street_address', 'city', 'state', 'zip', 'country'],
  reference: ['uuid', 'integer'],
  enum: [],
  richtext: ['paragraph', 'paragraphs'],
};

function FakeHintEditor({
  fake,
  onChange,
  fieldType,
  entityFields,
}: {
  fake: Field['fake'];
  onChange: (v: Field['fake']) => void;
  fieldType: string;
  entityFields: string[];
}) {
  const isDepends = typeof fake === 'object' && fake !== null && fake !== undefined;
  const simpleValue = typeof fake === 'string' ? fake : '';
  const dependsValue = isDepends ? fake as FakeDepends : { depends_on: '', map: {} };
  const tags = FAKER_TAGS[fieldType] || FAKER_TAGS.string;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-1.5 text-xs text-surface-600 dark:text-zinc-400">
          <input
            type="radio"
            checked={!isDepends}
            onChange={() => onChange(simpleValue || tags[0] || '')}
            className="text-brand-600"
          />
          Simple tag
        </label>
        <label className="flex items-center gap-1.5 text-xs text-surface-600 dark:text-zinc-400">
          <input
            type="radio"
            checked={isDepends}
            onChange={() => onChange({ depends_on: '', map: {} })}
            className="text-brand-600"
          />
          Depends on field
        </label>
        {fake && (
          <button
            onClick={() => onChange(undefined)}
            className="text-xs text-surface-400 dark:text-zinc-500 hover:text-danger-500 ml-auto"
          >
            Clear
          </button>
        )}
      </div>

      {!isDepends ? (
        <div>
          <select
            value={simpleValue}
            onChange={(e) => onChange(e.target.value || undefined)}
            className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
          >
            <option value="">No fake hint</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
            {/* Allow custom if current value not in list */}
            {simpleValue && !tags.includes(simpleValue) && (
              <option value={simpleValue}>{simpleValue} (custom)</option>
            )}
          </select>
          {simpleValue && (
            <p className="mt-1 text-[10px] text-surface-400 dark:text-zinc-500">
              Mock data generator will use the "{simpleValue}" faker for this field
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-surface-500 dark:text-zinc-400 mb-0.5">Depends On Field</label>
            <select
              value={dependsValue.depends_on}
              onChange={(e) => onChange({ ...dependsValue, depends_on: e.target.value })}
              className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
            >
              <option value="">Select field...</option>
              {entityFields.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-surface-500 dark:text-zinc-400 mb-0.5">
              Value → Tag Map
            </label>
            {Object.entries(dependsValue.map).map(([key, val], i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => {
                    const newMap = { ...dependsValue.map };
                    delete newMap[key];
                    newMap[e.target.value] = val;
                    onChange({ ...dependsValue, map: newMap });
                  }}
                  className="w-1/3 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs font-mono bg-white dark:bg-zinc-900"
                  placeholder="field value"
                />
                <span className="text-xs text-surface-400">&rarr;</span>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => {
                    onChange({ ...dependsValue, map: { ...dependsValue.map, [key]: e.target.value } });
                  }}
                  className="flex-1 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs font-mono bg-white dark:bg-zinc-900"
                  placeholder="faker tag"
                />
                <button
                  onClick={() => {
                    const newMap = { ...dependsValue.map };
                    delete newMap[key];
                    onChange({ ...dependsValue, map: newMap });
                  }}
                  className="p-1 text-surface-400 dark:text-zinc-500 hover:text-danger-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                onChange({ ...dependsValue, map: { ...dependsValue.map, '': '' } });
              }}
              className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
            >
              <Plus className="w-3 h-3" />
              Add mapping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReferenceDisplayField({
  value,
  onChange,
  targetEntity,
  compositionCtx,
  localEntities,
}: {
  value: string;
  onChange: (v: string) => void;
  targetEntity: string;
  compositionCtx: ReturnType<typeof useCompositionEditor>;
  localEntities: Entity[];
}) {
  let fieldNames: string[] = [];
  if (compositionCtx?.composedSpec) {
    const target = (compositionCtx.composedSpec.entities || []).find((e) => e.name === targetEntity);
    if (target) fieldNames = (target.fields || []).map((f) => f.name);
  } else {
    const target = localEntities.find((e) => e.name === targetEntity);
    if (target) fieldNames = (target.fields || []).map((f) => f.name);
  }

  if (fieldNames.length > 0) {
    return (
      <div>
        <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">Display Field</label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-surface-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 font-mono"
        >
          <option value="">auto (label field)</option>
          {fieldNames.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">Display Field</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Field to display from referenced entity"
        className="w-full px-3 py-2 border border-surface-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900"
      />
    </div>
  );
}
