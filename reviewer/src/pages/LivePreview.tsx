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
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700">Specs</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to={basePath} className="hover:text-gray-700">{specDisplayName}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900">Preview</span>
          </nav>
        }
        actions={
          <div className="flex items-center gap-3">
            {/* Runtime selector */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              {(['react', 'flutter'] as const).map((rt) => (
                <button
                  key={rt}
                  onClick={() => setRuntime(rt)}
                  className={clsx(
                    'px-3 py-1 text-xs rounded-md capitalize transition-colors',
                    runtime === rt ? 'bg-white shadow-sm font-medium' : 'text-gray-500',
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
                className="text-sm border border-gray-200 rounded-lg px-2 py-1"
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
              className="text-sm border border-gray-200 rounded-lg px-2 py-1"
            >
              {roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <a
              href={iframeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        }
      />

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
        <iframe
          src={iframeUrl}
          className="w-full h-full border-0"
          title="Live Preview"
        />
      </div>
    </div>
  );
}
