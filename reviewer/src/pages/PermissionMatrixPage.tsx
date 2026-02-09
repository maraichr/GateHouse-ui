import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { useAppSpecContext } from '../context/AppSpecContext';
import { PageHeader } from '../components/layout/PageHeader';
import { PermissionMatrix } from '../components/permissions/PermissionMatrix';

export function PermissionMatrixPage() {
  const { appSpec, specDisplayName, basePath } = useAppSpecContext();

  return (
    <div>
      <PageHeader
        title="Permission Matrix"
        subtitle="Roles and access control overview"
        breadcrumb={
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700">Specs</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to={basePath} className="hover:text-gray-700">{specDisplayName}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900">Permissions</span>
          </nav>
        }
      />
      {appSpec && <PermissionMatrix appSpec={appSpec} />}
    </div>
  );
}
