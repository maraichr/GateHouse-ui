import { useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { useQueries, useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, ChevronRight, CircleAlert, Filter, History, Layers } from 'lucide-react';
import { getComposition } from '../api/compositions';
import { listAudit } from '../api/specs';
import { useAppSpecContext } from '../context/AppSpecContext';
import type { AuditEntry } from '../types';

interface PublishEvent {
  id: string;
  createdAt: string;
  service: string;
  specId: string;
  version: string;
  warningCount: number;
  parityStatus: 'pass' | 'warn' | 'fail';
  parityBlockers: number;
}

export function PublishReportPage() {
  const { compId } = useParams<{ compId: string }>();
  const { specDisplayName, basePath } = useAppSpecContext();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pass' | 'warn' | 'fail'>('all');

  const compositionQuery = useQuery({
    queryKey: ['composition', compId],
    queryFn: () => getComposition(compId!),
    enabled: !!compId,
  });

  const specTargets = useMemo(() => {
    if (!compositionQuery.data) return [] as Array<{ specId: string; service: string }>;
    const targets: Array<{ specId: string; service: string }> = [
      {
        specId: compositionQuery.data.composition.host_spec_id,
        service: `${compositionQuery.data.host_spec_name} (Host)`,
      },
    ];
    for (const member of compositionQuery.data.members || []) {
      targets.push({ specId: member.spec_id, service: member.service_name });
    }
    return targets;
  }, [compositionQuery.data]);

  const auditQueries = useQueries({
    queries: specTargets.map((target) => ({
      queryKey: ['audit', target.specId],
      queryFn: () => listAudit(target.specId),
      enabled: !!target.specId,
    })),
  });

  const isLoading = compositionQuery.isLoading || auditQueries.some((q) => q.isLoading);
  const hasError = compositionQuery.isError || auditQueries.some((q) => q.isError);

  const publishEvents = useMemo(() => {
    const allEvents: PublishEvent[] = [];
    auditQueries.forEach((query, index) => {
      const target = specTargets[index];
      const entries = (query.data || []) as AuditEntry[];
      for (const entry of entries) {
        if (entry.action !== 'draft.publish') continue;
        const meta = (entry.metadata || {}) as Record<string, unknown>;
        const parityStatusRaw = typeof meta.parity_status === 'string' ? meta.parity_status : 'pass';
        const parityStatus = (parityStatusRaw === 'warn' || parityStatusRaw === 'fail') ? parityStatusRaw : 'pass';

        allEvents.push({
          id: entry.id,
          createdAt: entry.created_at,
          service: target?.service || 'Unknown',
          specId: target?.specId || entry.resource_id,
          version: typeof meta.version === 'string' ? meta.version : 'n/a',
          warningCount: typeof meta.warning_count === 'number' ? meta.warning_count : 0,
          parityStatus,
          parityBlockers: typeof meta.parity_blockers === 'number' ? meta.parity_blockers : 0,
        });
      }
    });

    allEvents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (statusFilter === 'all') return allEvents;
    return allEvents.filter((event) => event.parityStatus === statusFilter);
  }, [auditQueries, specTargets, statusFilter]);

  const summary = useMemo(() => {
    const all = publishEvents.length;
    const pass = publishEvents.filter((e) => e.parityStatus === 'pass').length;
    const warn = publishEvents.filter((e) => e.parityStatus === 'warn').length;
    const fail = publishEvents.filter((e) => e.parityStatus === 'fail').length;
    return { all, pass, warn, fail };
  }, [publishEvents]);

  if (isLoading) {
    return <div className="text-surface-500 dark:text-zinc-400">Loading publish report...</div>;
  }

  if (hasError) {
    return <div className="text-danger-600 dark:text-danger-400">Failed to load publish history.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <nav className="flex items-center gap-1 text-sm text-surface-500 dark:text-zinc-400 mb-2">
          <Link to={basePath} className="hover:text-surface-700 dark:hover:text-zinc-200 transition-colors">{specDisplayName}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-surface-900 dark:text-zinc-100">Publish Report</span>
        </nav>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-zinc-100 flex items-center gap-2">
          <History className="w-6 h-6 text-brand-500" />
          Publish Report
        </h1>
        <p className="text-sm text-surface-500 dark:text-zinc-400 mt-1">
          History of publish events with parity and warning signals across host and services.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Total" value={summary.all} icon={<Layers className="w-4 h-4" />} tone="neutral" />
        <SummaryCard label="Pass" value={summary.pass} icon={<CheckCircle2 className="w-4 h-4" />} tone="success" />
        <SummaryCard label="Warn" value={summary.warn} icon={<CircleAlert className="w-4 h-4" />} tone="warning" />
        <SummaryCard label="Fail" value={summary.fail} icon={<AlertTriangle className="w-4 h-4" />} tone="danger" />
      </div>

      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-surface-400 dark:text-zinc-500" />
        {(['all', 'pass', 'warn', 'fail'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
              statusFilter === status
                ? 'bg-brand-100 dark:bg-brand-950 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-400'
                : 'bg-white dark:bg-zinc-900 border-surface-200 dark:border-zinc-700 text-surface-500 dark:text-zinc-400 hover:bg-surface-50 dark:hover:bg-zinc-800'
            }`}
          >
            {status.toUpperCase()}
          </button>
        ))}
      </div>

      {publishEvents.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-surface-300 dark:border-zinc-700 rounded-lg text-surface-500 dark:text-zinc-400">
          No publish events found for this filter.
        </div>
      ) : (
        <div className="space-y-3">
          {publishEvents.map((event) => (
            <div key={event.id} className="rounded-lg border border-surface-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-surface-900 dark:text-zinc-100">{event.service}</span>
                    <span className="text-surface-400 dark:text-zinc-500">•</span>
                    <span className="font-mono text-surface-700 dark:text-zinc-300">v{event.version}</span>
                    <StatusBadge status={event.parityStatus} />
                  </div>
                  <div className="text-xs text-surface-400 dark:text-zinc-500 mt-1">
                    {formatDateTime(event.createdAt)} • spec {event.specId.slice(0, 8)}
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-surface-600 dark:text-zinc-400">Warnings: <span className="font-semibold">{event.warningCount}</span></div>
                  <div className="text-surface-600 dark:text-zinc-400">Parity blockers: <span className="font-semibold">{event.parityBlockers}</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: 'pass' | 'warn' | 'fail' }) {
  if (status === 'pass') {
    return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-success-100 dark:bg-success-950 text-success-700 dark:text-success-400">PASS</span>;
  }
  if (status === 'warn') {
    return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning-100 dark:bg-warning-950 text-warning-700 dark:text-warning-400">WARN</span>;
  }
  return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-danger-100 dark:bg-danger-950 text-danger-700 dark:text-danger-400">FAIL</span>;
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const toneClass: Record<typeof tone, string> = {
    neutral: 'border-surface-200 dark:border-zinc-800 text-surface-700 dark:text-zinc-300',
    success: 'border-success-200 dark:border-success-800 text-success-700 dark:text-success-400',
    warning: 'border-warning-200 dark:border-warning-800 text-warning-700 dark:text-warning-400',
    danger: 'border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400',
  };
  return (
    <div className={`rounded-lg border p-3 bg-white dark:bg-zinc-900 ${toneClass[tone]}`}>
      <div className="flex items-center justify-between text-xs mb-1">
        <span>{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
