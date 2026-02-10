import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, Shield, AlertTriangle, MessageSquare, FormInput } from 'lucide-react';
import type { Transition, Confirmation, Guard, Field } from '../../types';

const SEMANTIC_COLORS = ['success', 'danger', 'warning', 'info', 'primary', 'secondary'];
const CONFIRMATION_STYLES = ['default', 'destructive', 'warning'];

interface TransitionEditorProps {
  transition: Transition;
  index: number;
  onChange: (t: Transition) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  allStates: string[];
  roles: string[];
  isSelected?: boolean;
  onSelect?: () => void;
}

export function TransitionEditor({
  transition,
  index,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  allStates,
  roles,
  isSelected,
  onSelect,
}: TransitionEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(!!transition.confirmation);
  const [showGuards, setShowGuards] = useState(!!(transition.guards && transition.guards.length > 0));
  const [showForm, setShowForm] = useState(!!(transition.form?.fields && transition.form.fields.length > 0));

  const colorClass = transition.color
    ? `border-l-2 border-l-${transition.color === 'success' ? 'green' : transition.color === 'danger' ? 'red' : transition.color === 'warning' ? 'amber' : 'blue'}-500`
    : '';

  return (
    <div
      className={`border rounded-lg transition-all ${
        isSelected
          ? 'border-brand-400 dark:border-brand-600 ring-1 ring-brand-200 dark:ring-brand-800'
          : 'border-surface-200 dark:border-zinc-800'
      } ${colorClass}`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-surface-50 dark:bg-zinc-800/50 rounded-t-lg">
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className="p-0.5"
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-surface-400 dark:text-zinc-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-surface-400 dark:text-zinc-500" />
          )}
        </button>

        {transition.color && (
          <span className={`w-2.5 h-2.5 rounded-full ${
            transition.color === 'success' ? 'bg-green-500' :
            transition.color === 'danger' ? 'bg-red-500' :
            transition.color === 'warning' ? 'bg-amber-500' :
            transition.color === 'info' ? 'bg-blue-500' :
            'bg-brand-500'
          }`} />
        )}

        <span className="text-sm font-medium text-surface-700 dark:text-zinc-300 flex-1">
          {transition.label || transition.name || `Transition ${index + 1}`}
          <span className="ml-2 text-xs text-surface-400 dark:text-zinc-500 font-normal">
            {transition.from.join(', ') || '?'} &rarr; {transition.to || '?'}
          </span>
        </span>

        {/* Feature indicators */}
        <div className="flex items-center gap-1">
          {transition.confirmation && (
            <span title="Has confirmation" className="p-0.5"><MessageSquare className="w-3 h-3 text-amber-500" /></span>
          )}
          {transition.guards && transition.guards.length > 0 && (
            <span title="Has guards" className="p-0.5"><Shield className="w-3 h-3 text-indigo-500" /></span>
          )}
          {transition.permissions && transition.permissions.length > 0 && (
            <span title="Role-restricted" className="p-0.5"><AlertTriangle className="w-3 h-3 text-orange-500" /></span>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            disabled={!canMoveUp}
            className="p-1 text-surface-300 dark:text-zinc-600 hover:text-surface-500 dark:hover:text-zinc-400 disabled:opacity-30"
          >
            <span className="text-xs">&#x25B2;</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            disabled={!canMoveDown}
            className="p-1 text-surface-300 dark:text-zinc-600 hover:text-surface-500 dark:hover:text-zinc-400 disabled:opacity-30"
          >
            <span className="text-xs">&#x25BC;</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-1 text-surface-300 dark:text-zinc-600 hover:text-danger-500"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="p-3 space-y-4" onClick={(e) => e.stopPropagation()}>
          {/* Basics */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Name (slug)</label>
              <input
                type="text"
                value={transition.name}
                onChange={(e) => onChange({ ...transition, name: e.target.value })}
                className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
                placeholder="approve_submission"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Label</label>
              <input
                type="text"
                value={transition.label}
                onChange={(e) => onChange({ ...transition, label: e.target.value })}
                className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
                placeholder="Approve Submission"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Icon</label>
              <input
                type="text"
                value={transition.icon || ''}
                onChange={(e) => onChange({ ...transition, icon: e.target.value || undefined })}
                className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
                placeholder="check-circle"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Color</label>
              <select
                value={transition.color || ''}
                onChange={(e) => onChange({ ...transition, color: e.target.value || undefined })}
                className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
              >
                <option value="">default</option>
                {SEMANTIC_COLORS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* States */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">From States</label>
              <div className="flex flex-wrap gap-1.5">
                {allStates.map((state) => (
                  <button
                    key={state}
                    onClick={() => {
                      const from = transition.from.includes(state)
                        ? transition.from.filter((s) => s !== state)
                        : [...transition.from, state];
                      onChange({ ...transition, from });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      transition.from.includes(state)
                        ? 'bg-brand-100 dark:bg-brand-950 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-400'
                        : 'bg-white dark:bg-zinc-900 border-surface-200 dark:border-zinc-800 text-surface-500 dark:text-zinc-400 hover:bg-surface-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {state}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">To State</label>
              <select
                value={transition.to}
                onChange={(e) => onChange({ ...transition, to: e.target.value })}
                className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
              >
                <option value="">Select state...</option>
                {allStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Permissions */}
          {roles.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Permissions (roles)</label>
              <div className="flex flex-wrap gap-1.5">
                {roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      const perms = transition.permissions || [];
                      const next = perms.includes(role)
                        ? perms.filter((r) => r !== role)
                        : [...perms, role];
                      onChange({ ...transition, permissions: next.length > 0 ? next : undefined });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      (transition.permissions || []).includes(role)
                        ? 'bg-orange-100 dark:bg-orange-950 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-400'
                        : 'bg-white dark:bg-zinc-900 border-surface-200 dark:border-zinc-800 text-surface-500 dark:text-zinc-400 hover:bg-surface-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Confirmation toggle section */}
          <div className="border-t border-surface-200 dark:border-zinc-800 pt-3">
            <label className="flex items-center gap-2 text-sm text-surface-700 dark:text-zinc-300 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={showConfirmation}
                onChange={(e) => {
                  setShowConfirmation(e.target.checked);
                  if (!e.target.checked) {
                    onChange({ ...transition, confirmation: undefined });
                  } else if (!transition.confirmation) {
                    onChange({
                      ...transition,
                      confirmation: { title: `Confirm ${transition.label || 'action'}`, style: 'default' },
                    });
                  }
                }}
                className="rounded border-surface-300 dark:border-zinc-700"
              />
              <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
              Require Confirmation
            </label>

            {showConfirmation && transition.confirmation && (
              <ConfirmationEditor
                confirmation={transition.confirmation}
                onChange={(c) => onChange({ ...transition, confirmation: c })}
              />
            )}
          </div>

          {/* Guards toggle section */}
          <div className="border-t border-surface-200 dark:border-zinc-800 pt-3">
            <label className="flex items-center gap-2 text-sm text-surface-700 dark:text-zinc-300 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={showGuards}
                onChange={(e) => {
                  setShowGuards(e.target.checked);
                  if (!e.target.checked) {
                    onChange({ ...transition, guards: undefined });
                  }
                }}
                className="rounded border-surface-300 dark:border-zinc-700"
              />
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              Guards
            </label>

            {showGuards && (
              <GuardsEditor
                guards={transition.guards || []}
                onChange={(guards) => onChange({ ...transition, guards: guards.length > 0 ? guards : undefined })}
              />
            )}
          </div>

          {/* Form Fields toggle section */}
          <div className="border-t border-surface-200 dark:border-zinc-800 pt-3">
            <label className="flex items-center gap-2 text-sm text-surface-700 dark:text-zinc-300 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={showForm}
                onChange={(e) => {
                  setShowForm(e.target.checked);
                  if (!e.target.checked) {
                    onChange({ ...transition, form: undefined });
                  }
                }}
                className="rounded border-surface-300 dark:border-zinc-700"
              />
              <FormInput className="w-3.5 h-3.5 text-teal-500" />
              Collect Form Fields
            </label>

            {showForm && (
              <TransitionFormEditor
                fields={transition.form?.fields || []}
                onChange={(fields) =>
                  onChange({ ...transition, form: fields.length > 0 ? { fields } : undefined })
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Confirmation sub-editor ---

function ConfirmationEditor({
  confirmation,
  onChange,
}: {
  confirmation: Confirmation;
  onChange: (c: Confirmation) => void;
}) {
  return (
    <div className="pl-6 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-surface-500 dark:text-zinc-400 mb-0.5">Title</label>
          <input
            type="text"
            value={confirmation.title}
            onChange={(e) => onChange({ ...confirmation, title: e.target.value })}
            className="w-full px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="block text-xs text-surface-500 dark:text-zinc-400 mb-0.5">Style</label>
          <select
            value={confirmation.style || 'default'}
            onChange={(e) => onChange({ ...confirmation, style: e.target.value })}
            className="w-full px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
          >
            {CONFIRMATION_STYLES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-surface-500 dark:text-zinc-400 mb-0.5">Message Template</label>
        <input
          type="text"
          value={confirmation.message || ''}
          onChange={(e) => onChange({ ...confirmation, message: e.target.value || undefined })}
          className="w-full px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
          placeholder="Are you sure you want to {{action}}?"
        />
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-1.5 text-xs text-surface-600 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={confirmation.require_comment ?? false}
            onChange={(e) => onChange({ ...confirmation, require_comment: e.target.checked || undefined })}
            className="rounded border-surface-300 dark:border-zinc-700"
          />
          Require comment
        </label>
        <div className="flex-1">
          <input
            type="text"
            value={confirmation.type_to_confirm || ''}
            onChange={(e) => onChange({ ...confirmation, type_to_confirm: e.target.value || undefined })}
            className="w-full px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs bg-white dark:bg-zinc-900"
            placeholder="Type to confirm text (optional)"
          />
        </div>
      </div>
    </div>
  );
}

// --- Guards sub-editor ---

function GuardsEditor({
  guards,
  onChange,
}: {
  guards: Guard[];
  onChange: (g: Guard[]) => void;
}) {
  const addGuard = () => {
    onChange([...guards, { name: '', message: '' }]);
  };

  const updateGuard = (i: number, g: Guard) => {
    const next = [...guards];
    next[i] = g;
    onChange(next);
  };

  const removeGuard = (i: number) => {
    onChange(guards.filter((_, idx) => idx !== i));
  };

  return (
    <div className="pl-6 space-y-2">
      {guards.map((guard, i) => (
        <div key={i} className="p-2 bg-surface-50 dark:bg-zinc-800/50 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={guard.name}
              onChange={(e) => updateGuard(i, { ...guard, name: e.target.value })}
              className="flex-1 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
              placeholder="guard_name"
            />
            <button onClick={() => removeGuard(i)} className="p-1 text-surface-400 dark:text-zinc-500 hover:text-danger-500">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          <input
            type="text"
            value={guard.message}
            onChange={(e) => updateGuard(i, { ...guard, message: e.target.value })}
            className="w-full px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
            placeholder="Error message when guard fails"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={guard.field_check || ''}
              onChange={(e) => updateGuard(i, { ...guard, field_check: e.target.value || undefined })}
              className="px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs font-mono bg-white dark:bg-zinc-900"
              placeholder="field_check expression"
            />
            <input
              type="text"
              value={guard.api_check || ''}
              onChange={(e) => updateGuard(i, { ...guard, api_check: e.target.value || undefined })}
              className="px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs font-mono bg-white dark:bg-zinc-900"
              placeholder="/api/check/path"
            />
          </div>
        </div>
      ))}
      <button
        onClick={addGuard}
        className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
      >
        <Plus className="w-3 h-3" />
        Add Guard
      </button>
    </div>
  );
}

// --- Transition Form Fields sub-editor ---

const FORM_FIELD_TYPES = ['string', 'text', 'boolean', 'enum', 'date', 'integer'];

function TransitionFormEditor({
  fields,
  onChange,
}: {
  fields: Field[];
  onChange: (f: Field[]) => void;
}) {
  const addField = () => {
    onChange([...fields, { name: '', type: 'string' }]);
  };

  const updateFormField = (i: number, f: Field) => {
    const next = [...fields];
    next[i] = f;
    onChange(next);
  };

  const removeFormField = (i: number) => {
    onChange(fields.filter((_, idx) => idx !== i));
  };

  return (
    <div className="pl-6 space-y-2">
      {fields.map((field, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={field.name}
            onChange={(e) => updateFormField(i, { ...field, name: e.target.value })}
            className="flex-1 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
            placeholder="field_name"
          />
          <select
            value={field.type}
            onChange={(e) => updateFormField(i, { ...field, type: e.target.value })}
            className="w-24 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs bg-white dark:bg-zinc-900"
          >
            {FORM_FIELD_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-xs text-surface-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={field.required ?? false}
              onChange={(e) => updateFormField(i, { ...field, required: e.target.checked || undefined })}
              className="rounded border-surface-300 dark:border-zinc-700"
            />
            req
          </label>
          <button onClick={() => removeFormField(i)} className="p-1 text-surface-400 dark:text-zinc-500 hover:text-danger-500">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
      <button
        onClick={addField}
        className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
      >
        <Plus className="w-3 h-3" />
        Add Form Field
      </button>
    </div>
  );
}
