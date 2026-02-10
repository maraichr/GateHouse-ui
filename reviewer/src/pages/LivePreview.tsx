import { Link, useParams } from 'react-router';
import { useState } from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { useAppSpecContext } from '../context/AppSpecContext';
import { useVersions } from '../hooks/useSpec';
import { PageHeader } from '../components/layout/PageHeader';
import clsx from 'clsx';

export function LivePreview() {
  const { specId, compId } = useParams<{ specId?: string; compId?: string }>();
  const { appSpec, specDisplayName, basePath, isComposition } = useAppSpecContext();
  const [runtime, setRuntime] = useState<'react' | 'flutter'>('react');
  const [role, setRole] = useState('admin');
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');

  const roles = appSpec ? Object.keys((appSpec as any).auth?.roles || {}) : ['admin'];

  // Fetch versions for the version selector (single specs only)
  const { data: versions } = useVersions(isComposition ? undefined : specId);

  const baseUrl = runtime === 'react' ? 'http://localhost:5174' : 'http://localhost:6175';

  // Build iframe URL with preview params
  const previewParams = new URLSearchParams({ role });
  if (isComposition && compId) {
    previewParams.set('compId', compId);
  } else if (specId) {
    previewParams.set('specId', specId);
    if (selectedVersionId) {
      previewParams.set('versionId', selectedVersionId);
    }
  }
  const iframeUrl = `${baseUrl}?${previewParams}`;

  return (
    <div>
      <PageHeader
        title="Live Preview"
        subtitle="See the spec rendered in real time"
        breadcrumb={
          <nav className="flex items-center gap-1 text-sm text-surface-500 dark:text-zinc-400">
            <Link to="/" className="hover:text-surface-700 dark:hover:text-zinc-200 transition-colors">Specs</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to={basePath} className="hover:text-surface-700 dark:hover:text-zinc-200 transition-colors">{specDisplayName}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-surface-900 dark:text-zinc-100">Preview</span>
          </nav>
        }
        actions={
          <div className="flex items-center gap-3">
            {/* Runtime selector */}
            <div className="flex gap-1 bg-surface-100 dark:bg-zinc-800 rounded-lg p-0.5">
              {(['react', 'flutter'] as const).map((rt) => (
                <button
                  key={rt}
                  onClick={() => setRuntime(rt)}
                  className={clsx(
                    'px-3 py-1 text-xs rounded-md capitalize transition-all',
                    runtime === rt
                      ? 'bg-white dark:bg-zinc-700 shadow-sm font-medium text-surface-900 dark:text-zinc-100'
                      : 'text-surface-500 dark:text-zinc-400 hover:text-surface-700 dark:hover:text-zinc-300',
                  )}
                >
                  {rt}
                </button>
              ))}
            </div>

            {/* Version selector (single specs only) */}
            {!isComposition && versions && versions.length > 1 && (
              <select
                value={selectedVersionId}
                onChange={(e) => setSelectedVersionId(e.target.value)}
                className="text-sm border border-surface-200 dark:border-zinc-700 rounded-lg px-2 py-1 bg-white dark:bg-zinc-900 text-surface-900 dark:text-zinc-100 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
              >
                <option value="">Latest</option>
                {versions.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    v{v.version} ({v.status})
                  </option>
                ))}
              </select>
            )}

            {/* Role selector */}
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="text-sm border border-surface-200 dark:border-zinc-700 rounded-lg px-2 py-1 bg-white dark:bg-zinc-900 text-surface-900 dark:text-zinc-100 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
            >
              {roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <a
              href={iframeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-surface-400 dark:text-zinc-500 hover:text-surface-600 dark:hover:text-zinc-300 transition-colors"
              aria-label="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        }
      />

      <div
        className="surface-card overflow-hidden rounded-xl shadow-elevation-md dark:shadow-none"
        style={{ height: 'calc(100vh - 220px)' }}
      >
        <iframe
          src={iframeUrl}
          className="w-full h-full border-0"
          title="Live Preview"
        />
      </div>
    </div>
  );
}
