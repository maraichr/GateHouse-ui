import { useParams, Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { useSpec } from '../hooks/useSpec';
import { PageHeader } from '../components/layout/PageHeader';
import { NavBlueprint } from '../components/navigation/NavBlueprint';
import type { AppSpec } from '../types';

export function NavigationBlueprintPage() {
  const { specId } = useParams<{ specId: string }>();
  const { data: specData } = useSpec(specId);
  const latestVersion = specData?.latest_version;

  const appSpec: AppSpec | null = latestVersion?.spec_data
    ? (typeof latestVersion.spec_data === 'string' ? JSON.parse(latestVersion.spec_data) : latestVersion.spec_data)
    : null;

  return (
    <div>
      <PageHeader
        title="Navigation Blueprint"
        subtitle="Sidebar navigation structure and targets"
        breadcrumb={
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700">Specs</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to={`/specs/${specId}`} className="hover:text-gray-700">{specData?.spec.display_name}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900">Navigation</span>
          </nav>
        }
      />
      {appSpec && <NavBlueprint appSpec={appSpec} />}
    </div>
  );
}
