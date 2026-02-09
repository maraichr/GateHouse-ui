import { useParams, Link } from 'react-router';
import {
  Database, GitBranch, Shield, Layout, FileText, Eye, ChevronRight,
  Boxes, Workflow, Lock, Map, Navigation, PanelLeft,
} from 'lucide-react';
import { useSpec, useVersions, useCoverage } from '../hooks/useSpec';
import { PageHeader } from '../components/layout/PageHeader';
import { CoverageBadge } from '../components/coverage/CoverageBadge';
import { CoverageBar } from '../components/coverage/CoverageBar';
import { CoverageBreakdown } from '../components/coverage/CoverageBreakdown';
import { AttentionList } from '../components/coverage/AttentionList';
import { Badge } from '../components/utility/Badge';
import { statusColor, statusLabel } from '../utils/coverage';
import type { AppSpec } from '../types';

export function SpecOverview() {
  const { specId } = useParams<{ specId: string }>();
  const { data: specData, isLoading: specLoading } = useSpec(specId);
  const { data: versions } = useVersions(specId);

  const latestVersion = specData?.latest_version;
  const versionId = latestVersion?.id;
  const { data: coverage } = useCoverage(specId, versionId);

  // Parse spec_data if available
  const appSpec: AppSpec | null = latestVersion?.spec_data
    ? (typeof latestVersion.spec_data === 'string'
        ? JSON.parse(latestVersion.spec_data)
        : latestVersion.spec_data)
    : null;

  if (specLoading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-100 rounded w-2/3" />
      <div className="grid grid-cols-4 gap-4 mt-6">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-lg" />)}
      </div>
    </div>;
  }

  if (!specData?.spec) {
    return <div className="text-gray-500">Spec not found</div>;
  }

  const { spec } = specData;

  const navSections = [
    { label: 'Entities', icon: Boxes, path: 'entities', count: appSpec?.entities.length },
    { label: 'Permissions', icon: Lock, path: 'permissions', count: appSpec ? Object.keys(appSpec.auth.roles || {}).length : 0 },
    { label: 'Relationships', icon: GitBranch, path: 'relationships' },
    { label: 'Navigation', icon: Navigation, path: 'navigation', count: appSpec?.navigation.items.length },
    { label: 'Pages', icon: PanelLeft, path: 'pages', count: appSpec?.pages.length },
    { label: 'Live Preview', icon: Eye, path: 'preview' },
  ];

  return (
    <div>
      <PageHeader
        title={spec.display_name}
        subtitle={spec.description || spec.app_name}
        breadcrumb={
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700">Specs</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900">{spec.display_name}</span>
          </nav>
        }
        actions={
          <div className="flex items-center gap-2">
            {latestVersion && (
              <>
                <Badge color={statusColor(latestVersion.status)}>
                  {statusLabel(latestVersion.status)}
                </Badge>
                <span className="text-sm text-gray-500 font-mono">v{latestVersion.version}</span>
              </>
            )}
            {coverage && <CoverageBadge value={coverage.overall} />}
          </div>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Database} label="Entities" value={appSpec?.entities.length ?? 0} />
        <StatCard icon={FileText} label="Fields" value={coverage?.summary.field_count ?? 0} />
        <StatCard icon={Workflow} label="State Machines" value={coverage?.summary.state_machine_count ?? 0} />
        <StatCard icon={Layout} label="Views" value={coverage?.summary.view_count ?? 0} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Coverage breakdown */}
          {coverage && (
            <section className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Coverage Breakdown</h2>
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

          {/* Entity grid */}
          {appSpec && coverage && (
            <section className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">
                Entities ({appSpec.entities.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {coverage.entities.map((ec) => (
                  <Link
                    key={ec.name}
                    to={`/specs/${specId}/entities/${ec.name}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-reviewer-200 hover:bg-reviewer-50/50 transition-all group"
                  >
                    <div>
                      <span className="font-medium text-gray-900 group-hover:text-reviewer-700">
                        {ec.name}
                      </span>
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
          {/* Navigation sections */}
          <section className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Explore</h2>
            <nav className="space-y-1">
              {navSections.map(({ label, icon: Icon, path, count }) => (
                <Link
                  key={path}
                  to={`/specs/${specId}/${path}`}
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
          {coverage && coverage.gaps.length > 0 && (
            <section className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Attention Required</h2>
              <AttentionList gaps={coverage.gaps} maxItems={5} />
            </section>
          )}

          {/* Versions */}
          {versions && versions.length > 0 && (
            <section className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Versions</h2>
              <ul className="space-y-2">
                {versions.slice(0, 5).map((v) => (
                  <li key={v.id} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-gray-700">v{v.version}</span>
                    <Badge color={statusColor(v.status)} className="text-xs">
                      {statusLabel(v.status)}
                    </Badge>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Auth & Roles */}
          {appSpec && Object.keys(appSpec.auth.roles || {}).length > 0 && (
            <section className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Roles</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(appSpec.auth.roles).map(([key, role]) => (
                  <Badge key={key} color="purple">
                    {role.display_name || key}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Theme preview */}
          {appSpec?.app.theme && (
            <section className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Theme</h2>
              <div className="flex gap-2 mb-2">
                {[appSpec.app.theme.primary_color, appSpec.app.theme.secondary_color, appSpec.app.theme.accent_color, appSpec.app.theme.success_color, appSpec.app.theme.danger_color]
                  .filter(Boolean)
                  .map((color, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border border-gray-200"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <div>Mode: {appSpec.app.theme.mode}</div>
                <div>Radius: {appSpec.app.theme.border_radius}</div>
                <div>Density: {appSpec.app.theme.density}</div>
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
