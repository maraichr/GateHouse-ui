import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import {
  ArrowLeft, ArrowRight, Loader2, ChevronRight, Layers, Plus, Trash2,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listSpecs } from '../../api/specs';
import { createComposition, addMember } from '../../api/compositions';

type Step = 'basics' | 'members' | 'creating';

interface PendingMember {
  spec_id: string;
  service_name: string;
  nav_group: string;
  nav_order: number;
  prefix: string;
  optional: boolean;
}

export function NewCompositionWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('basics');
  const [error, setError] = useState<string | null>(null);

  // Step 1: basics
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [hostSpecId, setHostSpecId] = useState('');

  // Step 2: members
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);

  const { data: specs } = useQuery({
    queryKey: ['specs'],
    queryFn: listSpecs,
  });

  const availableSpecs = (specs || []).filter(
    (s) => s.id !== hostSpecId && !pendingMembers.some((m) => m.spec_id === s.id)
  );

  const addPendingMember = () => {
    if (availableSpecs.length === 0) return;
    setPendingMembers([
      ...pendingMembers,
      {
        spec_id: availableSpecs[0].id,
        service_name: availableSpecs[0].app_name || 'service',
        nav_group: '',
        nav_order: pendingMembers.length + 1,
        prefix: '',
        optional: false,
      },
    ]);
  };

  const updatePendingMember = (index: number, updates: Partial<PendingMember>) => {
    setPendingMembers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...updates } : m))
    );
  };

  const removePendingMember = (index: number) => {
    setPendingMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step === 'basics') {
      if (!name.trim()) {
        setError('Name is required');
        return;
      }
      if (!hostSpecId) {
        setError('Please select a host spec');
        return;
      }
      setError(null);
      setStep('members');
    }
  };

  const handleCreate = async () => {
    setStep('creating');
    setError(null);
    try {
      const composition = await createComposition({
        name: name.trim(),
        display_name: displayName.trim() || name.trim(),
        description: description.trim() || undefined,
        host_spec_id: hostSpecId,
      });

      // Add members sequentially
      for (const m of pendingMembers) {
        await addMember(composition.id, {
          spec_id: m.spec_id,
          service_name: m.service_name,
          prefix: m.prefix || undefined,
          nav_group: m.nav_group || undefined,
          nav_order: m.nav_order,
          optional: m.optional,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['compositions'] });
      navigate(`/compositions/${composition.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create composition');
      setStep('members');
    }
  };

  if (step === 'creating') {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        <span className="ml-2 text-surface-500 dark:text-zinc-400">Creating composition...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-surface-500 dark:text-zinc-400 mb-6">
        <Link to="/" className="hover:text-surface-700 dark:hover:text-zinc-200">Specs</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-surface-900 dark:text-zinc-100">New Composition</span>
      </nav>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-6">
        <StepDot label="1. Basics" active={step === 'basics'} completed={step !== 'basics'} />
        <div className="flex-1 h-px bg-surface-200 dark:bg-zinc-700" />
        <StepDot label="2. Services" active={step === 'members'} completed={false} />
      </div>

      {/* Step 1: Basics */}
      {step === 'basics' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-zinc-100">New Composition</h1>
          <p className="text-surface-500 dark:text-zinc-400">
            Create a multi-service composition by selecting a host spec and adding service members.
          </p>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-700 p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-surface-300 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-800 text-surface-900 dark:text-zinc-100"
                placeholder="b2b-payments"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-surface-300 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-800 text-surface-900 dark:text-zinc-100"
                placeholder="B2B Payments Platform"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-surface-300 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-800 text-surface-900 dark:text-zinc-100"
                placeholder="Optional description..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">Host Spec</label>
              <select
                value={hostSpecId}
                onChange={(e) => setHostSpecId(e.target.value)}
                className="w-full px-3 py-2 border border-surface-300 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-800 text-surface-900 dark:text-zinc-100"
              >
                <option value="">Select a host spec...</option>
                {(specs || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.display_name} ({s.app_name})
                  </option>
                ))}
              </select>
              <p className="text-xs text-surface-400 dark:text-zinc-500 mt-1">
                The host spec provides the theme, shell, and base navigation for the composed app.
              </p>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-surface-500 dark:text-zinc-400 hover:text-surface-700 dark:hover:text-zinc-200">
              <ArrowLeft className="w-4 h-4" />
              Cancel
            </Link>
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Members */}
      {step === 'members' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-zinc-100">Add Services</h1>
          <p className="text-surface-500 dark:text-zinc-400">
            Add member specs to the composition. You can always add more later from the composition settings.
          </p>

          {/* Host info */}
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center gap-3">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-1.5 py-0.5 rounded">HOST</span>
            <span className="text-sm font-medium text-surface-900 dark:text-zinc-100">
              {(specs || []).find((s) => s.id === hostSpecId)?.display_name || 'Host'}
            </span>
          </div>

          {/* Members list */}
          <div className="space-y-3">
            {pendingMembers.map((m, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-surface-700 dark:text-zinc-300">Service {i + 1}</span>
                  <button
                    onClick={() => removePendingMember(i)}
                    className="p-1 text-surface-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-surface-500 dark:text-zinc-400 mb-1">Spec</label>
                    <select
                      value={m.spec_id}
                      onChange={(e) => {
                        const sel = (specs || []).find((s) => s.id === e.target.value);
                        updatePendingMember(i, {
                          spec_id: e.target.value,
                          service_name: sel?.app_name || m.service_name,
                        });
                      }}
                      className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-surface-900 dark:text-zinc-100"
                    >
                      {/* Show current selection even if it's not in "available" */}
                      {(specs || [])
                        .filter((s) => s.id !== hostSpecId)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.display_name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-500 dark:text-zinc-400 mb-1">Service Name</label>
                    <input
                      type="text"
                      value={m.service_name}
                      onChange={(e) => updatePendingMember(i, { service_name: e.target.value })}
                      className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-surface-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-500 dark:text-zinc-400 mb-1">Nav Group</label>
                    <input
                      type="text"
                      value={m.nav_group}
                      onChange={(e) => updatePendingMember(i, { nav_group: e.target.value })}
                      className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-surface-900 dark:text-zinc-100"
                      placeholder="e.g. Payments"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-500 dark:text-zinc-400 mb-1">Nav Order</label>
                    <input
                      type="number"
                      value={m.nav_order}
                      onChange={(e) => updatePendingMember(i, { nav_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-surface-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-500 dark:text-zinc-400 mb-1">Prefix</label>
                    <input
                      type="text"
                      value={m.prefix}
                      onChange={(e) => updatePendingMember(i, { prefix: e.target.value })}
                      className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-surface-900 dark:text-zinc-100"
                      placeholder="e.g. /payments"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm text-surface-600 dark:text-zinc-400">
                      <input
                        type="checkbox"
                        checked={m.optional}
                        onChange={(e) => updatePendingMember(i, { optional: e.target.checked })}
                        className="rounded border-surface-300 dark:border-zinc-600"
                      />
                      Optional
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addPendingMember}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-brand-600 dark:text-brand-400 border border-brand-300 dark:border-brand-700 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/30"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </button>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('basics')}
              className="inline-flex items-center gap-1 text-sm text-surface-500 dark:text-zinc-400 hover:text-surface-700 dark:hover:text-zinc-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
            >
              <Layers className="w-4 h-4" />
              Create Composition
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepDot({
  label,
  active,
  completed,
}: {
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <span
      className={`text-xs font-medium px-2 py-1 rounded-full ${
        active
          ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300'
          : completed
          ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
          : 'bg-surface-100 dark:bg-zinc-800 text-surface-400 dark:text-zinc-500'
      }`}
    >
      {label}
    </span>
  );
}
