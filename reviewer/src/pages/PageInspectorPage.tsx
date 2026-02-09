import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { useAppSpecContext } from '../context/AppSpecContext';
import { PageHeader } from '../components/layout/PageHeader';
import { PageInspector } from '../components/pages/PageInspector';

export function PageInspectorPage() {
  const { appSpec, specDisplayName, basePath } = useAppSpecContext();

  return (
    <div>
      <PageHeader
        title="Pages"
        subtitle="Custom pages and widget layouts"
        breadcrumb={
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700">Specs</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to={basePath} className="hover:text-gray-700">{specDisplayName}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900">Pages</span>
          </nav>
        }
      />
      {appSpec && <PageInspector pages={appSpec.pages} />}
    </div>
  );
}
