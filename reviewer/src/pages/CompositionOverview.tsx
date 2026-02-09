import { useParams, Link } from 'react-router';
import {
  Database, FileText, Layout, ChevronRight,
  Boxes, Workflow, Lock, GitBranch, Navigation, PanelLeft, Layers, ExternalLink, Eye,
} from 'lucide-react';
import { useComposition, useComposedCoverage } from '../hooks/useComposition';
import { useAppSpecContext } from '../context/AppSpecContext';
import { PageHeader } from '../components/layout/PageHeader';
import { CoverageBadge } from '../components/coverage/CoverageBadge';
import { CoverageBar } from '../components/coverage/CoverageBar';
import { CoverageBreakdown } from '../components/coverage/CoverageBreakdown';
import { AttentionList } from '../components/coverage/AttentionList';
import { ServiceBadge } from '../components/utility/ServiceBadge';
import type { ComposedCoverageReport, ServiceCoverage } from '../types';

export function CompositionOverview() {
  const { compId } = useParams<{ compId: string }>();
  const { data: compData, isLoading: compLoading } = useComposition(compId);
  const { appSpec, basePath, sources, coverage } = useAppSpecContext();
  const { data: composedCoverage } = useComposedCoverage(compId);

  if (compLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="grid grid-cols-4 gap-4 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!compData?.composition) {
    return <div className="text-gray-500">Composition not found</div>;
  }

  const { composition, members, host_spec_name } = compData;
  const serviceCoverages = (composedCoverage as ComposedCoverageReport | undefined)?.service_coverages;

  const navSections = [
    { label: 'Entities', icon: Boxes, path: 'entities', count: appSpec?.entities?.length },
    { label: 'Permissions', icon: Lock, path: 'permissions', count: appSpec ? Object.keys(appSpec.auth?.roles || {}).length : 0 },
    { label: 'Relationships', icon: GitBranch, path: 'relationships' },
    { label: 'Navigation', icon: Navigation, path: 'navigation', count: appSpec?.navigation?.items?.length },
    { label: 'Pages', icon: PanelLeft, path: 'pages', count: appSpec?.pages?.length },
    { label: 'Live Preview', icon: Eye, path: 'preview' },
  ];

  return (
    <div>
      <PageHeader
        title={composition.display_name}
        subtitle={
          <span className="flex items-center gap-2">
            {composition.description || `${members.length + 1} services composed`}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
              <Layers className="w-3 h-3" />
              Composition
            </span>
          </span>
        }
        breadcrumb={
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700">Specs</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900">{composition.display_name}</span>
          </nav>
        }
        actions={coverage && <CoverageBadge value={coverage.overall} />}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Layers} label="Services" value={members.length + 1} />
        <StatCard icon={Database} label="Entities" value={appSpec?.entities?.length ?? 0} />
        <StatCard icon={FileText} label="Fields" value={coverage?.summary.field_count ?? 0} />
        <StatCard icon={Workflow} label="State Machines" value={coverage?.summary.state_machine_count ?? 0} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Architecture */}
          <section className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Service Architecture</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Host */}
              <div className="p-3 rounded-lg border-2 border-indigo-200 bg-indigo-50/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{host_spec_name}</span>
                  <span className="text-[10px] font-medium text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">HOST</span>
                </div>
                <div className="text-xs text-gray-500">
                  {countEntitiesForService(sources, host_spec_name)} entities
                </div>
                <Link
                  to={`/specs/${composition.host_spec_id}`}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                >
                  View spec <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* Members */}
              {members.map((m) => {
                const svcCov = serviceCoverages?.find((sc: ServiceCoverage) => sc.service === m.service_name);
                return (
                  <div key={m.id} className="p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <ServiceBadge service={m.service_name} />
                        {m.optional && <span className="text-[10px] text-gray-400">optional</span>}
                      </div>
                      {svcCov && <CoverageBadge value={svcCov.average} size="sm" />}
                    </div>
                    <div className="text-xs text-gray-500 space-y-0.5">
                      {m.nav_group && <div>Group: {m.nav_group}</div>}
                      {m.prefix && <div>Prefix: {m.prefix}</div>}
                      <div>{countEntitiesForService(sources, m.service_name)} entities</div>
                    </div>
                    <Link
                      to={`/specs/${m.spec_id}`}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      View spec <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Per-service coverage */}
          {serviceCoverages && serviceCoverages.length > 0 && (
            <section className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Coverage by Service</h2>
              <div className="space-y-3">
                {serviceCoverages.map((sc: ServiceCoverage) => (
                  <div key={sc.service}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-2 text-sm">
                        <ServiceBadge service={sc.service} />
                        <span className="text-xs text-gray-400">{sc.entity_count} entities</span>
                      </span>
                      <span className="text-sm font-bold">{Math.round(sc.average)}%</span>
                    </div>
                    <CoverageBar value={sc.average} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Overall coverage breakdown */}
          {coverage && (
            <section className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Overall Coverage</h2>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Overall</span>
                  <span className="text-sm font-bold">{Math.round(coverage.overall)}%</span>
                </div>
                <CoverageBar value={coverage.overall} />
              </div>
              <CoverageBreakdown summary={coverage.summary} />
            </section>
          )}

          {/* Entity grid with source badges */}
          {appSpec && coverage && (
            <section className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">
                Entities ({appSpec.entities?.length ?? 0})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(coverage.entities || []).map((ec) => (
                  <Link
                    key={ec.name}
                    to={`${basePath}/entities/${ec.name}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-reviewer-200 hover:bg-reviewer-50/50 transition-all group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 group-hover:text-reviewer-700">
                          {ec.name}
                        </span>
                        {sources?.[ec.name] && <ServiceBadge service={sources[ec.name]} />}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        <span>{ec.field_count} fields</span>
                        {ec.has_state_machine && <span>SM</span>}
                        {ec.relationship_count > 0 && <span>{ec.relationship_count} rels</span>}
                      </div>
                    </div>
                    <CoverageBadge value={ec.overall} size="sm" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Explore nav */}
          <section className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Explore</h2>
            <nav className="space-y-1">
              {navSections.map(({ label, icon: Icon, path, count }) => (
                <Link
                  key={path}
                  to={`${basePath}/${path}`}
                  className="flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gray-400 group-hover:text-reviewer-500" />
                    {label}
                  </span>
                  <span className="flex items-center gap-1">
                    {count !== undefined && (
                      <span className="text-xs text-gray-400">{count}</span>
                    )}
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                  </span>
                </Link>
              ))}
            </nav>
          </section>

          {/* Attention required */}
          {coverage && coverage.gaps && coverage.gaps.length > 0 && (
            <section className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Attention Required</h2>
              <AttentionList gaps={coverage.gaps} maxItems={5} />
            </section>
          )}

          {/* Roles */}
          {appSpec && Object.keys(appSpec.auth?.roles || {}).length > 0 && (
            <section className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Roles</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(appSpec.auth?.roles || {}).map(([key, role]) => (
                  <span key={key} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    {role.display_name || key}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.FC<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 text-gray-500 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function countEntitiesForService(sources: Record<string, string> | undefined, serviceName: string): number {
  if (!sources) return 0;
  return Object.values(sources).filter((s) => s === serviceName).length;
}
