import { useParams, Link } from 'react-router';
import { ChevronRight, Lock } from 'lucide-react';
import { useSpec } from '../hooks/useSpec';
import { PageHeader } from '../components/layout/PageHeader';
import { PermissionMatrix } from '../components/permissions/PermissionMatrix';
import type { AppSpec } from '../types';

export function PermissionMatrixPage() {
  const { specId } = useParams<{ specId: string }>();
  const { data: specData } = useSpec(specId);
  const latestVersion = specData?.latest_version;

  const appSpec: AppSpec | null = latestVersion?.spec_data
    ? (typeof latestVersion.spec_data === 'string' ? JSON.parse(latestVersion.spec_data) : latestVersion.spec_data)
    : null;

  return (
    <div>
      <PageHeader
        title="Permission Matrix"
        subtitle="Roles and access control overview"
        breadcrumb={
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700">Specs</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to={`/specs/${specId}`} className="hover:text-gray-700">{specData?.spec.display_name}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900">Permissions</span>
          </nav>
        }
      />
      {appSpec && <PermissionMatrix appSpec={appSpec} />}
    </div>
  );
}
