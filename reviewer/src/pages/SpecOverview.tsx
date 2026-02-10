import { useParams, Link, useNavigate } from 'react-router';
import {
  Database, GitBranch, Shield, Layout, FileText, Eye, ChevronRight,
  Boxes, Workflow, Lock, Map, Navigation, PanelLeft, PenLine, Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSpec, useVersions } from '../hooks/useSpec';
import { exportVersion } from '../api/specs';
import { useAppSpecContext } from '../context/AppSpecContext';
import { PageHeader } from '../components/layout/PageHeader';
import { CoverageBadge } from '../components/coverage/CoverageBadge';
import { CoverageBar } from '../components/coverage/CoverageBar';
import { CoverageBreakdown } from '../components/coverage/CoverageBreakdown';
import { AttentionList } from '../components/coverage/AttentionList';
import { Badge } from '../components/utility/Badge';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatSkeleton, CardSkeleton } from '../components/ui/Skeleton';
import { statusColor, statusLabel } from '../utils/coverage';

export function SpecOverview() {
  const { specId } = useParams<{ specId: string }>();
  const navigate = useNavigate();
  const { data: specData, isLoading: specLoading } = useSpec(specId);
  const { data: versions } = useVersions(specId);
  const { appSpec, basePath, coverage } = useAppSpecContext();

  const latestVersion = specData?.latest_version;

  const handleExportYaml = async () => {
    if (!latestVersion) return;
    try {
      const yaml = await exportVersion(specId!, latestVersion.id);
      const blob = new Blob([yaml], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${specData?.spec.app_name || 'spec'}-v${latestVersion.version}.yaml`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('YAML exported');
    } catch {
      toast.error('Export failed');
    }
  };

  if (specLoading) {
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

  if (!specData?.spec) {
    return <div className="text-surface-500 dark:text-zinc-400">Spec not found</div>;
  }

  const { spec } = specData;

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
        title={spec.display_name}
        subtitle={spec.description || spec.app_name}
        breadcrumb={
          <nav className="flex items-center gap-1 text-sm text-surface-500 dark:text-zinc-400">
            <Link to="/" className="hover:text-surface-700 dark:hover:text-zinc-200 transition-colors">Specs</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-surface-900 dark:text-zinc-100">{spec.display_name}</span>
          </nav>
        }
        actions={
          <div className="flex items-center gap-2">
            {latestVersion && (
              <>
                <Badge color={statusColor(latestVersion.status)}>
                  {statusLabel(latestVersion.status)}
                </Badge>
                <span className="text-sm text-surface-500 dark:text-zinc-400 font-mono">v{latestVersion.version}</span>
              </>
            )}
            {coverage && <CoverageBadge value={coverage.overall} />}
            {latestVersion && (
              <Button variant="outlined" color="neutral" size="sm" onClick={handleExportYaml} icon={<Download className="w-3.5 h-3.5" />}>
                Export YAML
              </Button>
            )}
            <Button onClick={() => navigate(`/specs/${specId}/edit`)} icon={<PenLine className="w-3.5 h-3.5" />} size="sm">
              Edit
            </Button>
          </div>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Database} label="Entities" value={appSpec?.entities?.length ?? 0} color="brand" />
        <StatCard icon={FileText} label="Fields" value={coverage?.summary.field_count ?? 0} color="info" />
        <StatCard icon={Workflow} label="State Machines" value={coverage?.summary.state_machine_count ?? 0} color="accent" />
        <StatCard icon={Layout} label="Views" value={coverage?.summary.view_count ?? 0} color="success" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Coverage breakdown */}
          {coverage && (
            <Card>
              <h2 className="font-semibold text-surface-900 dark:text-zinc-100 mb-4">Coverage Breakdown</h2>
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

          {/* Entity grid */}
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
                      <span className="font-medium text-surface-900 dark:text-zinc-100 group-hover:text-brand-700 dark:group-hover:text-brand-400">
                        {ec.name}
                      </span>
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
          {/* Navigation sections */}
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

          {/* Versions */}
          {versions && versions.length > 0 && (
            <Card>
              <h2 className="font-semibold text-surface-900 dark:text-zinc-100 mb-3">Versions</h2>
              <ul className="space-y-2">
                {versions.slice(0, 5).map((v) => (
                  <li key={v.id} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-surface-700 dark:text-zinc-300">v{v.version}</span>
                    <Badge color={statusColor(v.status)} className="text-xs">
                      {statusLabel(v.status)}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Auth & Roles */}
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

          {/* Theme preview */}
          {appSpec?.app?.theme && (
            <Card>
              <h2 className="font-semibold text-surface-900 dark:text-zinc-100 mb-3">Theme</h2>
              <div className="flex gap-2 mb-2">
                {[appSpec.app.theme.primary_color, appSpec.app.theme.secondary_color, appSpec.app.theme.accent_color, appSpec.app.theme.success_color, appSpec.app.theme.danger_color]
                  .filter(Boolean)
                  .map((color, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border border-surface-200 dark:border-zinc-700 shadow-sm"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
              </div>
              <div className="text-xs text-surface-500 dark:text-zinc-400 space-y-1">
                <div>Mode: {appSpec.app.theme.mode}</div>
                <div>Radius: {appSpec.app.theme.border_radius}</div>
                <div>Density: {appSpec.app.theme.density}</div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = 'brand' }: { icon: React.FC<{ className?: string }>; label: string; value: number; color?: string }) {
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
