import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { useAppSpecContext } from '../context/AppSpecContext';
import { PageHeader } from '../components/layout/PageHeader';
import { RelationshipMap } from '../components/relationships/RelationshipMap';

export function RelationshipMapPage() {
  const { appSpec, specDisplayName, basePath, sources } = useAppSpecContext();

  return (
    <div>
      <PageHeader
        title="Relationship Map"
        subtitle="Entity relationships and connections"
        breadcrumb={
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700">Specs</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to={basePath} className="hover:text-gray-700">{specDisplayName}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900">Relationships</span>
          </nav>
        }
      />
      {appSpec && <RelationshipMap appSpec={appSpec} sources={sources} />}
    </div>
  );
}
