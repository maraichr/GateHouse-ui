import { Link } from 'react-router';
import { ChevronRight, Boxes, Search } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { useAppSpecContext } from '../context/AppSpecContext';
import { PageHeader } from '../components/layout/PageHeader';
import { CoverageBadge } from '../components/coverage/CoverageBadge';
import { CoverageBar } from '../components/coverage/CoverageBar';
import { Badge } from '../components/utility/Badge';
import { ServiceBadge } from '../components/utility/ServiceBadge';
import { Card } from '../components/ui/Card';
import type { EntityCoverage } from '../types';

export function EntityExplorer() {
  const { appSpec, specDisplayName, basePath, sources, coverage } = useAppSpecContext();
  const [filter, setFilter] = useState<'all' | 'complete' | 'attention'>('all');
  const [search, setSearch] = useState('');

  const coverageMap = new Map<string, EntityCoverage>();
  coverage?.entities.forEach((ec) => coverageMap.set(ec.name, ec));

  const entities = (appSpec?.entities || []).filter((e) => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.display_name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filter === 'complete') {
      const ec = coverageMap.get(e.name);
      return ec && ec.overall >= 80;
    }
    if (filter === 'attention') {
      const ec = coverageMap.get(e.name);
      return ec && ec.overall < 80;
    }
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Entities"
        subtitle={`${appSpec?.entities?.length ?? 0} entities defined`}
        breadcrumb={
          <nav className="flex items-center gap-1 text-sm text-surface-500 dark:text-zinc-400">
            <Link to="/" className="hover:text-surface-700 dark:hover:text-zinc-200 transition-colors">Specs</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to={basePath} className="hover:text-surface-700 dark:hover:text-zinc-200 transition-colors">{specDisplayName}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-surface-900 dark:text-zinc-100">Entities</span>
          </nav>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search entities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-surface-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-surface-900 dark:text-zinc-100 placeholder:text-surface-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:focus:border-brand-500"
          />
        </div>
        <div className="flex gap-1 bg-surface-100 dark:bg-zinc-900 rounded-lg p-0.5">
          {(['all', 'complete', 'attention'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                'px-3 py-1.5 text-xs rounded-md transition-all font-medium',
                filter === f
                  ? 'bg-white dark:bg-zinc-800 text-surface-900 dark:text-zinc-100 shadow-sm'
                  : 'text-surface-500 dark:text-zinc-400 hover:text-surface-700 dark:hover:text-zinc-300',
              )}
            >
              {f === 'all' ? 'All' : f === 'complete' ? 'Complete' : 'Needs Attention'}
            </button>
          ))}
        </div>
      </div>

      {/* Entity grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {entities.map((entity) => {
          const ec = coverageMap.get(entity.name);
          return (
            <Link key={entity.name} to={`${basePath}/entities/${entity.name}`}>
              <Card hover className="h-full">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-surface-400 dark:text-zinc-500" />
                    <h3 className="font-semibold text-surface-900 dark:text-zinc-100">{entity.display_name || entity.name}</h3>
                    {sources && sources[entity.name] && (
                      <ServiceBadge service={sources[entity.name]} />
                    )}
                  </div>
                  {ec && <CoverageBadge value={ec.overall} size="sm" />}
                </div>
                {entity.description && (
                  <p className="text-xs text-surface-500 dark:text-zinc-400 mb-3 line-clamp-2">{entity.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-surface-400 dark:text-zinc-500 mb-2">
                  <span>{(entity.fields || []).length} fields</span>
                  {entity.state_machine && <Badge color="purple">SM</Badge>}
                  {entity.relationships && entity.relationships.length > 0 && (
                    <span>{entity.relationships.length} rels</span>
                  )}
                </div>
                {ec && <CoverageBar value={ec.overall} size="sm" showLabel={false} />}
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
