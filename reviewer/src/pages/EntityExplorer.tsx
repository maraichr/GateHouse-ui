import { useParams, Link } from 'react-router';
import { ChevronRight, Boxes, Search } from 'lucide-react';
import { useState } from 'react';
import { useSpec, useCoverage } from '../hooks/useSpec';
import { PageHeader } from '../components/layout/PageHeader';
import { CoverageBadge } from '../components/coverage/CoverageBadge';
import { CoverageBar } from '../components/coverage/CoverageBar';
import { Badge } from '../components/utility/Badge';
import type { AppSpec, EntityCoverage } from '../types';

export function EntityExplorer() {
  const { specId } = useParams<{ specId: string }>();
  const { data: specData } = useSpec(specId);
  const latestVersion = specData?.latest_version;
  const { data: coverage } = useCoverage(specId, latestVersion?.id);
  const [filter, setFilter] = useState<'all' | 'complete' | 'attention'>('all');
  const [search, setSearch] = useState('');

  const appSpec: AppSpec | null = latestVersion?.spec_data
    ? (typeof latestVersion.spec_data === 'string' ? JSON.parse(latestVersion.spec_data) : latestVersion.spec_data)
    : null;

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
        subtitle={`${appSpec?.entities.length ?? 0} entities defined`}
        breadcrumb={
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700">Specs</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to={`/specs/${specId}`} className="hover:text-gray-700">{specData?.spec.display_name}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900">Entities</span>
          </nav>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search entities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-reviewer-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'complete', 'attention'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                filter === f
                  ? 'bg-reviewer-100 text-reviewer-700 font-medium'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
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
            <Link
              key={entity.name}
              to={`/specs/${specId}/entities/${entity.name}`}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:border-reviewer-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-gray-400 group-hover:text-reviewer-500" />
                  <h3 className="font-semibold text-gray-900">{entity.display_name || entity.name}</h3>
                </div>
                {ec && <CoverageBadge value={ec.overall} size="sm" />}
              </div>
              {entity.description && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{entity.description}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                <span>{entity.fields.length} fields</span>
                {entity.state_machine && <Badge color="purple">SM</Badge>}
                {entity.relationships && entity.relationships.length > 0 && (
                  <span>{entity.relationships.length} rels</span>
                )}
              </div>
              {ec && <CoverageBar value={ec.overall} size="sm" showLabel={false} />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
