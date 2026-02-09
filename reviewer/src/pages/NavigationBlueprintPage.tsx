import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { useAppSpecContext } from '../context/AppSpecContext';
import { PageHeader } from '../components/layout/PageHeader';
import { NavBlueprint } from '../components/navigation/NavBlueprint';

export function NavigationBlueprintPage() {
  const { appSpec, specDisplayName, basePath } = useAppSpecContext();

  return (
    <div>
      <PageHeader
        title="Navigation Blueprint"
        subtitle="Sidebar navigation structure and targets"
        breadcrumb={
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700">Specs</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to={basePath} className="hover:text-gray-700">{specDisplayName}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900">Navigation</span>
          </nav>
        }
      />
      {appSpec && <NavBlueprint appSpec={appSpec} />}
    </div>
  );
}
