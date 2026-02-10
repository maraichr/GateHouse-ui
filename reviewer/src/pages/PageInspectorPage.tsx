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
          <nav className="flex items-center gap-1 text-sm text-surface-500 dark:text-zinc-400">
            <Link to="/" className="hover:text-surface-700 dark:hover:text-zinc-200 transition-colors">Specs</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to={basePath} className="hover:text-surface-700 dark:hover:text-zinc-200 transition-colors">{specDisplayName}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-surface-900 dark:text-zinc-100">Pages</span>
          </nav>
        }
      />
      {appSpec && <PageInspector pages={appSpec.pages} />}
    </div>
  );
}
