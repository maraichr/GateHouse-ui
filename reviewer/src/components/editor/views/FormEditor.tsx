import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '../../ui/Card';
import type { Field, FormView, FormStep, FormSection } from '../../../types';
import { FieldMultiSelect } from './FieldMultiSelect';
import { SectionEditor } from './SectionEditor';

interface FormEditorProps {
  view: FormView;
  onChange: (view: FormView) => void;
  availableFields: string[];
  roles?: string[];
  viewKey: 'create' | 'edit';
}

const LAYOUT_OPTIONS = ['sectioned', 'stepped', 'single'];

export function FormEditor({
  view,
  onChange,
  availableFields,
  roles = [],
  viewKey,
}: FormEditorProps) {
  // Collect all fields currently assigned in steps/sections
  const allAssignedFields = [
    ...(view.steps || []).flatMap((s) => s.fields || []),
    ...(view.sections || []).flatMap((s) => s.fields || []),
  ];

  return (
    <div className="space-y-5">
      {/* Basics */}
      <Card padding="sm">
        <h4 className="font-medium text-surface-900 dark:text-zinc-100 text-sm mb-3">Basics</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Title</label>
            <input
              type="text"
              value={view.title || ''}
              onChange={(e) => onChange({ ...view, title: e.target.value })}
              className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
              placeholder={viewKey === 'create' ? 'Create Record' : 'Edit Record'}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Submit Label</label>
            <input
              type="text"
              value={view.submit_label || ''}
              onChange={(e) => onChange({ ...view, submit_label: e.target.value || undefined })}
              className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
              placeholder={viewKey === 'create' ? 'Create' : 'Save Changes'}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Cancel Path</label>
            <input
              type="text"
              value={view.cancel_path || ''}
              onChange={(e) => onChange({ ...view, cancel_path: e.target.value || undefined })}
              className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
              placeholder="e.g. /subcontractors"
            />
          </div>
        </div>
      </Card>

      {/* Layout */}
      <Card padding="sm">
        <h4 className="font-medium text-surface-900 dark:text-zinc-100 text-sm mb-3">Layout</h4>
        <div className="flex gap-4">
          {LAYOUT_OPTIONS.map((l) => (
            <label key={l} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`${viewKey}-form-layout`}
                checked={view.layout === l}
                onChange={() => onChange({ ...view, layout: l })}
                className="text-brand-600"
              />
              <span className="text-sm text-surface-700 dark:text-zinc-300">{l}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Content -- varies by layout */}
      {view.layout === 'stepped' && (
        <SteppedContent
          steps={view.steps || []}
          onChange={(steps) => onChange({ ...view, steps })}
          availableFields={availableFields}
        />
      )}
      {view.layout === 'sectioned' && (
        <SectionedContent
          sections={view.sections || []}
          onChange={(sections) => onChange({ ...view, sections })}
          availableFields={availableFields}
          roles={roles}
        />
      )}
      {view.layout === 'single' && (
        <SingleContent
          steps={view.steps || []}
          onChange={(steps) => onChange({ ...view, steps })}
          availableFields={availableFields}
        />
      )}

      {/* Field Overrides */}
      <FieldOverridesEditor
        overrides={view.field_overrides || {}}
        onChange={(field_overrides) =>
          onChange({ ...view, field_overrides: Object.keys(field_overrides).length > 0 ? field_overrides : undefined })
        }
        availableFields={availableFields}
      />
    </div>
  );
}

// --- Stepped Content ---

function SteppedContent({
  steps,
  onChange,
  availableFields,
}: {
  steps: FormStep[];
  onChange: (steps: FormStep[]) => void;
  availableFields: string[];
}) {
  const addStep = () => {
    const id = `step_${steps.length + 1}`;
    onChange([...steps, { id, title: 'New Step', fields: [] }]);
  };

  const moveStep = (i: number, dir: 'up' | 'down') => {
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= steps.length) return;
    const next = [...steps];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <Card padding="sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-surface-900 dark:text-zinc-100 text-sm">Steps ({steps.length})</h4>
        <button
          onClick={addStep}
          className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
        >
          <Plus className="w-3 h-3" />
          Add Step
        </button>
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <StepEditor
            key={i}
            step={step}
            index={i}
            onUpdate={(s) => {
              const next = [...steps];
              next[i] = s;
              onChange(next);
            }}
            onRemove={() => onChange(steps.filter((_, idx) => idx !== i))}
            onMoveUp={() => moveStep(i, 'up')}
            onMoveDown={() => moveStep(i, 'down')}
            canMoveUp={i > 0}
            canMoveDown={i < steps.length - 1}
            availableFields={availableFields}
          />
        ))}
      </div>
    </Card>
  );
}

function StepEditor({
  step,
  index,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  availableFields,
}: {
  step: FormStep;
  index: number;
  onUpdate: (s: FormStep) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  availableFields: string[];
}) {
  const [expanded, setExpanded] = useState(true);
  const fieldCount = step.fields?.length || 0;

  return (
    <div className="border border-surface-200 dark:border-zinc-800 rounded-lg">
      <div className="flex items-center gap-2 px-3 py-2 bg-surface-50 dark:bg-zinc-800/50 rounded-t-lg">
        <button onClick={() => setExpanded(!expanded)} className="p-0.5">
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-surface-400 dark:text-zinc-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-surface-400 dark:text-zinc-500" />
          )}
        </button>

        <span className="text-sm font-medium text-surface-700 dark:text-zinc-300 flex-1">
          {step.title || `Step ${index + 1}`}
          <span className="ml-2 text-xs text-surface-400 dark:text-zinc-500">({fieldCount} fields)</span>
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

      {expanded && (
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">ID</label>
              <input
                type="text"
                value={step.id}
                onChange={(e) => onUpdate({ ...step, id: e.target.value })}
                className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Title</label>
              <input
                type="text"
                value={step.title}
                onChange={(e) => onUpdate({ ...step, title: e.target.value })}
                className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Type</label>
              <select
                value={step.type || 'regular'}
                onChange={(e) => onUpdate({ ...step, type: e.target.value === 'regular' ? undefined : e.target.value })}
                className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
              >
                <option value="regular">regular</option>
                <option value="summary">summary</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Description</label>
            <input
              type="text"
              value={step.description || ''}
              onChange={(e) => onUpdate({ ...step, description: e.target.value || undefined })}
              className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
              placeholder="Optional step description"
            />
          </div>

          <FieldMultiSelect
            label="Fields"
            availableFields={availableFields}
            selectedFields={step.fields || []}
            onChange={(fields) => onUpdate({ ...step, fields })}
          />
        </div>
      )}
    </div>
  );
}

// --- Sectioned Content ---

function SectionedContent({
  sections,
  onChange,
  availableFields,
  roles,
}: {
  sections: FormSection[];
  onChange: (sections: FormSection[]) => void;
  availableFields: string[];
  roles: string[];
}) {
  const addSection = () => {
    onChange([...sections, { title: 'New Section', fields: [] }]);
  };

  const moveSection = (i: number, dir: 'up' | 'down') => {
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <Card padding="sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-surface-900 dark:text-zinc-100 text-sm">Sections ({sections.length})</h4>
        <button
          onClick={addSection}
          className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
        >
          <Plus className="w-3 h-3" />
          Add Section
        </button>
      </div>

      <div className="space-y-2">
        {sections.map((sec, i) => (
          <SectionEditor
            key={i}
            section={sec}
            index={i}
            onUpdate={(s) => {
              const next = [...sections];
              next[i] = { ...s, fields: s.fields || [] } as FormSection;
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
      </div>
    </Card>
  );
}

// --- Field Overrides ---

function FieldOverridesEditor({
  overrides,
  onChange,
  availableFields,
}: {
  overrides: Record<string, Partial<Field>>;
  onChange: (overrides: Record<string, Partial<Field>>) => void;
  availableFields: string[];
}) {
  const [expanded, setExpanded] = useState(Object.keys(overrides).length > 0);
  const overrideEntries = Object.entries(overrides);
  const fieldsWithoutOverrides = availableFields.filter((f) => !overrides[f]);

  const addOverride = (field: string) => {
    onChange({ ...overrides, [field]: {} });
  };

  const updateOverride = (field: string, patch: Partial<Field>) => {
    onChange({ ...overrides, [field]: patch });
  };

  const removeOverride = (field: string) => {
    const next = { ...overrides };
    delete next[field];
    onChange(next);
  };

  return (
    <Card padding="sm">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-sm font-medium text-surface-900 dark:text-zinc-100"
        >
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          Field Overrides ({overrideEntries.length})
        </button>
        {fieldsWithoutOverrides.length > 0 && (
          <select
            value=""
            onChange={(e) => { if (e.target.value) addOverride(e.target.value); }}
            className="text-xs px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-brand-600 dark:text-brand-400"
          >
            <option value="">+ Add override</option>
            {fieldsWithoutOverrides.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        )}
      </div>

      {!expanded && overrideEntries.length === 0 && (
        <p className="text-xs text-surface-400 dark:text-zinc-500 pl-5">
          Override placeholder, help text, or required status per field
        </p>
      )}

      {expanded && (
        <div className="space-y-2">
          {overrideEntries.length === 0 && (
            <p className="text-xs text-surface-400 dark:text-zinc-500 py-2 text-center">
              No field overrides. Select a field above to customize.
            </p>
          )}
          {overrideEntries.map(([field, ov]) => (
            <div key={field} className="p-2.5 bg-surface-50 dark:bg-zinc-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-surface-700 dark:text-zinc-300 font-mono">{field}</span>
                <button
                  onClick={() => removeOverride(field)}
                  className="p-0.5 text-surface-300 dark:text-zinc-600 hover:text-danger-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-surface-500 dark:text-zinc-500 mb-0.5">Placeholder</label>
                  <input
                    type="text"
                    value={ov.placeholder || ''}
                    onChange={(e) => updateOverride(field, { ...ov, placeholder: e.target.value || undefined })}
                    className="w-full px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs bg-white dark:bg-zinc-900"
                    placeholder="Custom placeholder"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-surface-500 dark:text-zinc-500 mb-0.5">Help Text</label>
                  <input
                    type="text"
                    value={ov.help_text || ''}
                    onChange={(e) => updateOverride(field, { ...ov, help_text: e.target.value || undefined })}
                    className="w-full px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs bg-white dark:bg-zinc-900"
                    placeholder="Custom help text"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-1.5 text-xs text-surface-600 dark:text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ov.required === true}
                    onChange={(e) => updateOverride(field, { ...ov, required: e.target.checked || undefined })}
                    className="rounded"
                  />
                  Required
                </label>
                <label className="flex items-center gap-1.5 text-xs text-surface-600 dark:text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ov.hidden === true}
                    onChange={(e) => updateOverride(field, { ...ov, hidden: e.target.checked || undefined })}
                    className="rounded"
                  />
                  Hidden
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// --- Single page (flat field list) ---

function SingleContent({
  steps,
  onChange,
  availableFields,
}: {
  steps: FormStep[];
  onChange: (steps: FormStep[]) => void;
  availableFields: string[];
}) {
  const fields = steps[0]?.fields || [];

  const handleFieldsChange = (newFields: string[]) => {
    if (steps.length === 0) {
      onChange([{ id: 'main', title: 'Fields', fields: newFields }]);
    } else {
      const next = [...steps];
      next[0] = { ...next[0], fields: newFields };
      onChange(next);
    }
  };

  return (
    <Card padding="sm">
      <h4 className="font-medium text-surface-900 dark:text-zinc-100 text-sm mb-3">Fields</h4>
      <FieldMultiSelect
        availableFields={availableFields}
        selectedFields={fields}
        onChange={handleFieldsChange}
      />
    </Card>
  );
}
