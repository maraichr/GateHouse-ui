import { useParams, Link } from 'react-router';
import {
  Database, FileText, Layout, ChevronRight,
  Boxes, Workflow, Lock, GitBranch, Navigation, PanelLeft, Layers, ExternalLink, Eye,
  PenLine, Settings, Download, Box, Upload, Timer, History,
} from 'lucide-react';
import { toast } from 'sonner';
import { useComposition, useComposedCoverage } from '../hooks/useComposition';
import { exportComposition } from '../api/compositions';
import { getTimeToFirstSpecKPI } from '../api/specs';
import { useAppSpecContext } from '../context/AppSpecContext';
import { PageHeader } from '../components/layout/PageHeader';
import { CoverageBadge } from '../components/coverage/CoverageBadge';
import { CoverageBar } from '../components/coverage/CoverageBar';
import { CoverageBreakdown } from '../components/coverage/CoverageBreakdown';
import { AttentionList } from '../components/coverage/AttentionList';
import { ServiceBadge } from '../components/utility/ServiceBadge';
import { Badge } from '../components/utility/Badge';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatSkeleton, CardSkeleton } from '../components/ui/Skeleton';
import type { ComposedCoverageReport, ServiceCoverage } from '../types';
import { useQuery } from '@tanstack/react-query';

export function CompositionOverview() {
  const { compId } = useParams<{ compId: string }>();
  const { data: compData, isLoading: compLoading } = useComposition(compId);
  const { appSpec, basePath, sources, coverage } = useAppSpecContext();
  const { data: composedCoverage } = useComposedCoverage(compId);
  const { data: ttfKpi } = useQuery({
    queryKey: ['kpi', 'time-to-first-spec'],
    queryFn: getTimeToFirstSpecKPI,
    staleTime: 60_000,
  });

  if (compLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-2">
          <div className="h-8 bg-surface-200 dark:bg-zinc-800 rounded w-1/3 skeleton-shimmer" />
          <div className="h-4 bg-surface-100 dark:bg-zinc-800/50 rounded w-2/3 skeleton-shimmer" />
        </div>
        <StatSkeleton count={4} />
        <CardSkeleton />
      </div>
    );
  }

  if (!compData?.composition) {
    return <div className="text-surface-500 dark:text-zinc-400">Composition not found</div>;
  }

  const { composition, members, host_spec_name } = compData;
  const isSingleService = members.length === 0;
  const serviceCoverages = (composedCoverage as ComposedCoverageReport | undefined)?.service_coverages;

  const handleExportCompose = async () => {
    try {
      const yaml = await exportComposition(compId!);
      const blob = new Blob([yaml], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${composition.name || 'compose'}.yaml`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('compose.yaml exported');
    } catch {
      toast.error('Export failed');
    }
  };

  const navSections = [
    { label: 'Entities', icon: Boxes, path: 'entities', count: appSpec?.entities?.length },
    { label: 'Permissions', icon: Lock, path: 'permissions', count: appSpec ? Object.keys(appSpec.auth?.roles || {}).length : 0 },
    { label: 'Relationships', icon: GitBranch, path: 'relationships' },
    { label: 'Navigation', icon: Navigation, path: 'navigation', count: appSpec?.navigation?.items?.length },
    { label: 'Pages', icon: PanelLeft, path: 'pages', count: appSpec?.pages?.length },
    { label: 'Publish Report', icon: History, path: 'publish-report' },
    { label: 'Live Preview', icon: Eye, path: 'preview' },
  ];

  return (
    <div>
      <PageHeader
        title={composition.display_name}
        subtitle={
          <span className="flex items-center gap-2">
            {composition.description || (isSingleService ? 'Single-service project' : `${members.length + 1} services composed`)}
            <Badge color={isSingleService ? 'blue' : 'indigo'}>
              {isSingleService ? <Box className="w-3 h-3 mr-1" /> : <Layers className="w-3 h-3 mr-1" />}
              {isSingleService ? 'Project' : 'Composition'}
            </Badge>
          </span>
        }
        breadcrumb={
          <nav className="flex items-center gap-1 text-sm text-surface-500 dark:text-zinc-400">
            <Link to="/" className="hover:text-surface-700 dark:hover:text-zinc-200 transition-colors">Projects</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-surface-900 dark:text-zinc-100">{composition.display_name}</span>
          </nav>
        }
        actions={
          <div className="flex items-center gap-2">
            {coverage && <CoverageBadge value={coverage.overall} />}
            {!isSingleService && (
              <Button variant="outlined" color="neutral" size="sm" onClick={handleExportCompose} icon={<Download className="w-3.5 h-3.5" />}>
                Export compose.yaml
              </Button>
            )}
          </div>
        }
      />

      {/* Stat cards */}
      <div className={`grid grid-cols-2 ${isSingleService ? 'sm:grid-cols-3' : 'sm:grid-cols-4'} gap-4 mb-6`}>
        {!isSingleService && <StatCard icon={Layers} label="Services" value={members.length + 1} color="brand" />}
        <StatCard icon={Database} label="Entities" value={appSpec?.entities?.length ?? 0} color="info" />
        <StatCard icon={FileText} label="Fields" value={coverage?.summary.field_count ?? 0} color="accent" />
        <StatCard icon={Workflow} label="State Machines" value={coverage?.summary.state_machine_count ?? 0} color="success" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Timer} label="Avg Time To First Spec" value={`${Math.round(ttfKpi?.average_minutes || 0)}m`} color="brand" />
        <StatCard icon={Timer} label="P50" value={`${Math.round(ttfKpi?.p50_minutes || 0)}m`} color="info" />
        <StatCard icon={Timer} label="P90" value={`${Math.round(ttfKpi?.p90_minutes || 0)}m`} color="accent" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Architecture (multi-service only) */}
          {!isSingleService && <Card>
            <h2 className="font-semibold text-surface-900 dark:text-zinc-100 mb-4">Service Architecture</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Host */}
              <div className="p-3 rounded-xl border-2 border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-950/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-surface-900 dark:text-zinc-100">{host_spec_name}</span>
                  <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 bg-brand-100 dark:bg-brand-900 px-1.5 py-0.5 rounded">HOST</span>
                </div>
                <div className="text-xs text-surface-500 dark:text-zinc-400">
                  {countEntitiesForService(sources, host_spec_name)} entities
                </div>
                <Link
                  to={`/specs/${composition.host_spec_id}`}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300"
                >
                  View spec <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* Members */}
              {members.map((m) => {
                const svcCov = serviceCoverages?.find((sc: ServiceCoverage) => sc.service === m.service_name);
                return (
                  <div key={m.id} className="p-3 rounded-xl border border-surface-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <ServiceBadge service={m.service_name} />
                        {m.optional && <span className="text-[10px] text-surface-400 dark:text-zinc-500">optional</span>}
                      </div>
                      {svcCov && <CoverageBadge value={svcCov.average} size="sm" />}
                    </div>
                    <div className="text-xs text-surface-500 dark:text-zinc-400 space-y-0.5">
                      {m.nav_group && <div>Sidebar: <span className="font-medium text-surface-700 dark:text-zinc-300">{m.nav_group}</span></div>}
                      {m.prefix && <div>Prefix: {m.prefix}</div>}
                      <div>{countEntitiesForService(sources, m.service_name)} entities</div>
                    </div>
                    <Link
                      to={`/specs/${m.spec_id}`}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-surface-500 dark:text-zinc-400 hover:text-surface-700 dark:hover:text-zinc-200"
                    >
                      View spec <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </Card>}

          {/* Per-service coverage */}
          {serviceCoverages && serviceCoverages.length > 0 && (
            <Card>
              <h2 className="font-semibold text-surface-900 dark:text-zinc-100 mb-4">Coverage by Service</h2>
              <div className="space-y-3">
                {serviceCoverages.map((sc: ServiceCoverage) => (
                  <div key={sc.service}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-2 text-sm">
                        <ServiceBadge service={sc.service} />
                        <span className="text-xs text-surface-400 dark:text-zinc-500">{sc.entity_count} entities</span>
                      </span>
                      <span className="text-sm font-bold text-surface-900 dark:text-zinc-100">{Math.round(sc.average)}%</span>
                    </div>
                    <CoverageBar value={sc.average} />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Overall coverage breakdown */}
          {coverage && (
            <Card>
              <h2 className="font-semibold text-surface-900 dark:text-zinc-100 mb-4">Overall Coverage</h2>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-surface-700 dark:text-zinc-300">Overall</span>
                  <span className="text-sm font-bold text-surface-900 dark:text-zinc-100">{Math.round(coverage.overall)}%</span>
                </div>
                <CoverageBar value={coverage.overall} />
              </div>
              <CoverageBreakdown summary={coverage.summary} />
            </Card>
          )}

          {/* Entity grid with source badges */}
          {appSpec && coverage && (
            <Card>
              <h2 className="font-semibold text-surface-900 dark:text-zinc-100 mb-4">
                Entities ({appSpec.entities?.length ?? 0})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(coverage.entities || []).map((ec) => (
                  <Link
                    key={ec.name}
                    to={`${basePath}/entities/${ec.name}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-surface-100 dark:border-zinc-800 hover:border-brand-200 dark:hover:border-brand-800 hover:bg-brand-50/50 dark:hover:bg-brand-950/30 transition-all group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-surface-900 dark:text-zinc-100 group-hover:text-brand-700 dark:group-hover:text-brand-400">
                          {ec.name}
                        </span>
                        {sources?.[ec.name] && <ServiceBadge service={sources[ec.name]} />}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-surface-400 dark:text-zinc-500 mt-0.5">
                        <span>{ec.field_count} fields</span>
                        {ec.has_state_machine && <span>SM</span>}
                        {ec.relationship_count > 0 && <span>{ec.relationship_count} rels</span>}
                      </div>
                    </div>
                    <CoverageBadge value={ec.overall} size="sm" />
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Manage */}
          <Card>
            <h2 className="font-semibold text-surface-900 dark:text-zinc-100 mb-3">Manage</h2>
            <nav className="space-y-1">
              <Link
                to={`/projects/${compId}/edit`}
                className="flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950 text-brand-700 dark:text-brand-400 font-medium transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-brand-500" />
                  Edit Project
                </span>
                <ChevronRight className="w-3 h-3 text-surface-300 dark:text-zinc-600" />
              </Link>
              <Link
                to={`/projects/${compId}/settings`}
                className="flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-surface-50 dark:hover:bg-zinc-800 text-surface-700 dark:text-zinc-300 hover:text-surface-900 dark:hover:text-zinc-100 transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-surface-400 dark:text-zinc-500 group-hover:text-brand-500 transition-colors" />
                  Settings
                </span>
                <ChevronRight className="w-3 h-3 text-surface-300 dark:text-zinc-600" />
              </Link>
            </nav>
          </Card>

          <Card>
            <h2 className="font-semibold text-surface-900 dark:text-zinc-100 mb-3">Explore</h2>
            <nav className="space-y-1">
              {navSections.map(({ label, icon: Icon, path, count }) => (
                <Link
                  key={path}
                  to={`${basePath}/${path}`}
                  className="flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-surface-50 dark:hover:bg-zinc-800 text-surface-700 dark:text-zinc-300 hover:text-surface-900 dark:hover:text-zinc-100 transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-surface-400 dark:text-zinc-500 group-hover:text-brand-500 transition-colors" />
                    {label}
                  </span>
                  <span className="flex items-center gap-1">
                    {count !== undefined && (
                      <span className="text-xs text-surface-400 dark:text-zinc-500">{count}</span>
                    )}
                    <ChevronRight className="w-3 h-3 text-surface-300 dark:text-zinc-600" />
                  </span>
                </Link>
              ))}
            </nav>
          </Card>

          {/* Attention required */}
          {coverage && coverage.gaps && coverage.gaps.length > 0 && (
            <Card>
              <h2 className="font-semibold text-surface-900 dark:text-zinc-100 mb-3">Attention Required</h2>
              <AttentionList gaps={coverage.gaps} maxItems={5} />
            </Card>
          )}

          {/* Roles */}
          {appSpec && Object.keys(appSpec.auth?.roles || {}).length > 0 && (
            <Card>
              <h2 className="font-semibold text-surface-900 dark:text-zinc-100 mb-3">Roles</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(appSpec.auth?.roles || {}).map(([key, role]) => (
                  <Badge key={key} color="purple">
                    {role.display_name || key}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = 'brand' }: { icon: React.FC<{ className?: string }>; label: string; value: number | string; color?: string }) {
  const borderColor: Record<string, string> = {
    brand: 'border-t-brand-500',
    info: 'border-t-info-500',
    accent: 'border-t-accent-500',
    success: 'border-t-success-500',
  };
  return (
    <div className={`surface-card border-t-2 ${borderColor[color] || 'border-t-brand-500'} p-4`}>
      <div className="flex items-center gap-2 text-surface-500 dark:text-zinc-400 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-2xl font-bold text-surface-900 dark:text-zinc-100">{value}</div>
    </div>
  );
}

function countEntitiesForService(sources: Record<string, string> | undefined, serviceName: string): number {
  if (!sources) return 0;
  return Object.values(sources).filter((s) => s === serviceName).length;
}
