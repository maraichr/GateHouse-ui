import { useParams, Link } from 'react-router';
import { useState } from 'react';
import { ChevronRight, Monitor, Smartphone, ExternalLink } from 'lucide-react';
import { useSpec } from '../hooks/useSpec';
import { PageHeader } from '../components/layout/PageHeader';
import clsx from 'clsx';

export function LivePreview() {
  const { specId } = useParams<{ specId: string }>();
  const { data: specData } = useSpec(specId);
  const [runtime, setRuntime] = useState<'react' | 'flutter'>('react');
  const [role, setRole] = useState('admin');

  const appSpec = specData?.latest_version?.spec_data;
  const roles = appSpec ? Object.keys((appSpec as any).auth?.roles || {}) : ['admin'];

  const baseUrl = runtime === 'react' ? 'http://localhost:5174' : 'http://localhost:6175';
  const iframeUrl = `${baseUrl}?role=${role}`;

  return (
    <div>
      <PageHeader
        title="Live Preview"
        subtitle="See the spec rendered in real time"
        breadcrumb={
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700">Specs</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to={`/specs/${specId}`} className="hover:text-gray-700">{specData?.spec.display_name}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900">Preview</span>
          </nav>
        }
        actions={
          <div className="flex items-center gap-3">
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
