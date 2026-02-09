import { useParams, Link } from 'react-router';
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useAppSpecContext } from '../context/AppSpecContext';
import { PageHeader } from '../components/layout/PageHeader';
import { CoverageBadge } from '../components/coverage/CoverageBadge';
import { ServiceBadge } from '../components/utility/ServiceBadge';
import type { Entity, EntityCoverage } from '../types';

import { FieldTable } from '../components/fields/FieldTable';
import { StateMachineDiagram } from '../components/state-machine/StateMachineDiagram';
import { ViewsTab } from '../components/views/ViewsTab';

export function EntityDetail() {
  const { entityName } = useParams<{ entityName: string }>();
  const { appSpec, specDisplayName, basePath, sources, coverage } = useAppSpecContext();
  const [activeTab, setActiveTab] = useState('fields');

  const entity: Entity | undefined = appSpec?.entities?.find((e) => e.name === entityName);
  const ec: EntityCoverage | undefined = coverage?.entities.find((e) => e.name === entityName);

  if (!entity) {
    return <div className="text-gray-500">Entity not found</div>;
  }

  const tabs = [
    { id: 'fields', label: 'Fields', count: (entity.fields || []).length },
    ...(entity.state_machine ? [{ id: 'state-machine', label: 'State Machine', count: entity.state_machine.transitions.length }] : []),
    { id: 'views', label: 'Views' },
    ...(entity.relationships && entity.relationships.length > 0 ? [{ id: 'relationships', label: 'Relationships', count: entity.relationships.length }] : []),
  ];

  const subtitleParts = [entity.description || `API: ${entity.api_resource}`];
  const sourceService = sources?.[entity.name];

  return (
    <div>
      <PageHeader
        title={entity.display_name || entity.name}
        subtitle={
          <span className="flex items-center gap-2">
            {subtitleParts[0]}
            {sourceService && <ServiceBadge service={sourceService} />}
          </span>
        }
        breadcrumb={
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700">Specs</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to={basePath} className="hover:text-gray-700">{specDisplayName}</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to={`${basePath}/entities`} className="hover:text-gray-700">Entities</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900">{entity.display_name || entity.name}</span>
          </nav>
        }
        actions={ec && <CoverageBadge value={ec.overall} />}
      />

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-reviewer-600 text-reviewer-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {'count' in tab && tab.count !== undefined && (
                <span className="ml-1.5 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">{tab.count}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'fields' && (
        <FieldTable entity={entity} appSpec={appSpec!} />
      )}
      {activeTab === 'state-machine' && entity.state_machine && (
        <StateMachineDiagram stateMachine={entity.state_machine} />
      )}
      {activeTab === 'views' && (
        <ViewsTab entity={entity} />
      )}
      {activeTab === 'relationships' && entity.relationships && (
        <div className="space-y-3">
          {entity.relationships.map((rel, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-3 text-xs">
              <span className="font-medium text-gray-800">{rel.name}</span>
              <span className="text-gray-400 mx-2">-</span>
              <span className="text-gray-600">{rel.entity}</span>
              <span className="text-gray-400 ml-2">({rel.type})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
