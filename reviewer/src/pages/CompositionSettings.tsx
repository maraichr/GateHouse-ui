import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import {
  ArrowLeft, ChevronRight, Plus, Trash2, Loader2, Layers, Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getComposition, addMember, removeMember, updateMember,
} from '../api/compositions';
import { listSpecs } from '../api/specs';
import { ServiceBadge } from '../components/utility/ServiceBadge';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/Dialog';
import { Skeleton } from '../components/ui/Skeleton';
import type { CompositionMember } from '../types';

export function CompositionSettings() {
  const { compId } = useParams<{ compId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['composition', compId],
    queryFn: () => getComposition(compId!),
    enabled: !!compId,
  });

  const { data: specs } = useQuery({
    queryKey: ['specs'],
    queryFn: listSpecs,
  });

  const [addingMember, setAddingMember] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [newMember, setNewMember] = useState({
    spec_id: '',
    service_name: '',
    nav_group: '',
    nav_order: 0,
    prefix: '',
    optional: false,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['composition', compId] });
    queryClient.invalidateQueries({ queryKey: ['compositions'] });
  };

  const addMemberMutation = useMutation({
    mutationFn: () =>
      addMember(compId!, {
        spec_id: newMember.spec_id,
        service_name: newMember.service_name,
        nav_group: newMember.nav_group || undefined,
        nav_order: newMember.nav_order,
        prefix: newMember.prefix || undefined,
        optional: newMember.optional,
      }),
    onSuccess: () => {
      invalidate();
      setAddingMember(false);
      setNewMember({ spec_id: '', service_name: '', nav_group: '', nav_order: 0, prefix: '', optional: false });
      toast.success('Service added');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => removeMember(compId!, memberId),
    onSuccess: () => {
      invalidate();
      toast.success('Service removed');
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ memberId, data: d }: { memberId: string; data: { nav_group?: string; nav_order?: number; prefix?: string } }) =>
      updateMember(compId!, memberId, d),
    onSuccess: () => {
      invalidate();
      toast.success('Service updated');
    },
  });

  if (isLoading || !data) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton width="50%" className="h-8" />
        <div className="surface-card p-5 space-y-3">
          <Skeleton width="30%" className="h-5" />
          <Skeleton className="h-4" />
          <Skeleton width="60%" className="h-4" />
        </div>
      </div>
    );
  }

  const { composition, members, host_spec_name } = data;
  const usedSpecIds = new Set([composition.host_spec_id, ...members.map((m) => m.spec_id)]);
  const availableSpecs = (specs || []).filter((s) => !usedSpecIds.has(s.id));

  const inputClasses = "w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 text-surface-900 dark:text-zinc-100 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none";

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-surface-500 dark:text-zinc-400 mb-6">
        <Link to="/" className="hover:text-surface-700 dark:hover:text-zinc-200 transition-colors">Projects</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to={`/projects/${compId}`} className="hover:text-surface-700 dark:hover:text-zinc-200 transition-colors">
          {composition.display_name}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-surface-900 dark:text-zinc-100">Settings</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-zinc-100">Composition Settings</h1>
          <Badge color="indigo">
            <Layers className="w-3 h-3 mr-1" />
            {composition.display_name}
          </Badge>
        </div>
        <Button variant="ghost" color="neutral" onClick={() => navigate(`/projects/${compId}`)} icon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
      </div>

      {/* Composition Info */}
      <Card className="mb-6">
        <h2 className="font-semibold text-surface-900 dark:text-zinc-100 mb-3">General</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-surface-500 dark:text-zinc-400">Name</dt>
            <dd className="font-mono text-surface-900 dark:text-zinc-100">{composition.name}</dd>
          </div>
          <div>
            <dt className="text-surface-500 dark:text-zinc-400">Display Name</dt>
            <dd className="text-surface-900 dark:text-zinc-100">{composition.display_name}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-surface-500 dark:text-zinc-400">Description</dt>
            <dd className="text-surface-900 dark:text-zinc-100">{composition.description || <span className="text-surface-300 dark:text-zinc-600 italic">None</span>}</dd>
          </div>
        </dl>
      </Card>

      {/* Host spec */}
      <Card className="mb-6">
        <h2 className="font-semibold text-surface-900 dark:text-zinc-100 mb-3">Host Spec</h2>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 bg-brand-100 dark:bg-brand-900 px-1.5 py-0.5 rounded">HOST</span>
          <span className="text-sm font-medium text-surface-900 dark:text-zinc-100">{host_spec_name}</span>
          <Link
            to={`/specs/${composition.host_spec_id}`}
            className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
          >
            View
          </Link>
        </div>
        <p className="text-xs text-surface-400 dark:text-zinc-500 mt-2">
          The host spec provides the theme, shell, and base navigation. Theme from the host is applied to all services.
        </p>
      </Card>

      {/* Members */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-surface-900 dark:text-zinc-100">Service Members ({members.length})</h2>
          <Button variant="outlined" size="sm" onClick={() => setAddingMember(true)} icon={<Plus className="w-4 h-4" />}>
            Add Service
          </Button>
        </div>

        {members.length === 0 && !addingMember && (
          <p className="text-sm text-surface-400 dark:text-zinc-500 text-center py-6">
            No service members yet. Add specs to compose them with the host.
          </p>
        )}

        <div className="space-y-3">
          {members.map((m) => (
            <MemberRow
              key={m.id}
              member={m}
              onUpdate={(d) =>
                updateMemberMutation.mutate({ memberId: m.id, data: d })
              }
              onRemove={() => setRemoveTarget({ id: m.id, name: m.service_name })}
            />
          ))}

          {/* Add member inline form */}
          {addingMember && (
            <div className="rounded-xl border-2 border-dashed border-brand-300 dark:border-brand-700 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-surface-500 dark:text-zinc-400 mb-1">Spec</label>
                  <select
                    value={newMember.spec_id}
                    onChange={(e) => {
                      const s = (specs || []).find((sp) => sp.id === e.target.value);
                      setNewMember({
                        ...newMember,
                        spec_id: e.target.value,
                        service_name: s?.app_name || '',
                      });
                    }}
                    className={inputClasses}
                  >
                    <option value="">Select spec...</option>
                    {availableSpecs.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.display_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-500 dark:text-zinc-400 mb-1">Service Name</label>
                  <input type="text" value={newMember.service_name} onChange={(e) => setNewMember({ ...newMember, service_name: e.target.value })} className={inputClasses} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-500 dark:text-zinc-400 mb-1">Sidebar Group</label>
                  <input type="text" value={newMember.nav_group} onChange={(e) => setNewMember({ ...newMember, nav_group: e.target.value })} className={inputClasses} placeholder="e.g. Payments, Accounts" />
                  <p className="text-[10px] text-surface-400 dark:text-zinc-500 mt-0.5">Display label for the sidebar section header</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-500 dark:text-zinc-400 mb-1">Nav Order</label>
                  <input type="number" value={newMember.nav_order} onChange={(e) => setNewMember({ ...newMember, nav_order: parseInt(e.target.value) || 0 })} className={inputClasses} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-500 dark:text-zinc-400 mb-1">API Prefix</label>
                  <input type="text" value={newMember.prefix} onChange={(e) => setNewMember({ ...newMember, prefix: e.target.value })} className={inputClasses} placeholder="e.g. /payments" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-surface-600 dark:text-zinc-400">
                    <input type="checkbox" checked={newMember.optional} onChange={(e) => setNewMember({ ...newMember, optional: e.target.checked })} className="rounded border-surface-300 dark:border-zinc-700" />
                    Optional
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-3">
                <Button variant="ghost" color="neutral" size="sm" onClick={() => setAddingMember(false)}>Cancel</Button>
                <Button size="sm" onClick={() => addMemberMutation.mutate()} disabled={!newMember.spec_id || !newMember.service_name} loading={addMemberMutation.isPending} icon={<Plus className="w-3.5 h-3.5" />}>
                  Add
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (removeTarget) removeMemberMutation.mutate(removeTarget.id);
          setRemoveTarget(null);
        }}
        title={`Remove service "${removeTarget?.name}"?`}
        description="This service will be removed from the composition."
        confirmLabel="Remove"
      />
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    indigo: 'bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] || ''}`}>
      {children}
    </span>
  );
}

function MemberRow({
  member,
  onUpdate,
  onRemove,
}: {
  member: CompositionMember;
  onUpdate: (data: { nav_group?: string; nav_order?: number; prefix?: string }) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [navGroup, setNavGroup] = useState(member.nav_group);
  const [navOrder, setNavOrder] = useState(member.nav_order);
  const [prefix, setPrefix] = useState(member.prefix);

  const handleSave = () => {
    onUpdate({
      nav_group: navGroup || undefined,
      nav_order: navOrder,
      prefix: prefix || undefined,
    });
    setEditing(false);
  };

  const inputClasses = "w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 text-surface-900 dark:text-zinc-100 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none";

  return (
    <div className="rounded-xl border border-surface-200 dark:border-zinc-800 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ServiceBadge service={member.service_name} />
          {member.optional && (
            <span className="text-[9px] text-surface-400 dark:text-zinc-500 italic">optional</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditing(!editing)}
            className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 px-2 py-1"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={onRemove}
            className="p-1 text-surface-400 dark:text-zinc-500 hover:text-danger-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!editing && (
        <div className="flex items-center gap-4 mt-2 text-xs text-surface-500 dark:text-zinc-400">
          {member.nav_group ? (
            <span>Sidebar: <span className="text-surface-700 dark:text-zinc-300 font-medium">{member.nav_group}</span></span>
          ) : (
            <span className="italic">No sidebar group</span>
          )}
          <span>Order: {member.nav_order}</span>
          {member.prefix && <span>Prefix: {member.prefix}</span>}
        </div>
      )}

      {editing && (
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div>
            <label className="block text-xs text-surface-500 dark:text-zinc-400 mb-1">Sidebar Group</label>
            <input type="text" value={navGroup} onChange={(e) => setNavGroup(e.target.value)} className={inputClasses} placeholder="e.g. Payments, Accounts" />
            <p className="text-[10px] text-surface-400 dark:text-zinc-500 mt-0.5">Display label shown in sidebar</p>
          </div>
          <div>
            <label className="block text-xs text-surface-500 dark:text-zinc-400 mb-1">Nav Order</label>
            <input type="number" value={navOrder} onChange={(e) => setNavOrder(parseInt(e.target.value) || 0)} className={inputClasses} />
          </div>
          <div>
            <label className="block text-xs text-surface-500 dark:text-zinc-400 mb-1">API Prefix</label>
            <input type="text" value={prefix} onChange={(e) => setPrefix(e.target.value)} className={inputClasses} placeholder="e.g. /payments" />
          </div>
          <div className="col-span-3 flex justify-end">
            <Button size="sm" onClick={handleSave} icon={<Save className="w-3.5 h-3.5" />}>Save</Button>
          </div>
        </div>
      )}
    </div>
  );
}
