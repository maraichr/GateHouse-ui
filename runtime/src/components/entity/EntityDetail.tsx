import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEntityDetail } from '../../data/useEntityDetail';
import { usePermissions } from '../../auth/usePermissions';
import { useBreadcrumbs } from '../../context/BreadcrumbContext';
import { DetailHeader } from './DetailHeader';
import { Section } from '../layout/Section';
import { RelationshipTable } from './RelationshipTable';
import { Icon } from '../../utils/icons';
import { cn } from '../../utils/cn';
import { ArrowLeft } from 'lucide-react';
import {
  ComponentNode,
  Field,
  StateMachine,
  Relationship,
  DetailHeader as DetailHeaderConfig,
} from '../../types';

interface EntityDetailProps {
  entity?: string;
  api_resource?: string;
  display_name?: string;
  label_field?: string;
  status_field?: string;
  fields?: Field[];
  state_machine?: StateMachine | null;
  relationships?: Relationship[];
  layout?: string;
  childNodes?: ComponentNode[];
}

export function EntityDetail({
  entity,
  api_resource,
  display_name,
  fields,
  state_machine,
  relationships,
  childNodes,
}: EntityDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { setOverride } = useBreadcrumbs();
  const { data: record, isLoading, isError } = useEntityDetail(api_resource || '', id);

  // Set breadcrumb override with record's display name
  useEffect(() => {
    if (record && id) {
      const displayName = record.name || record.company_name || record.title || record.display_name || id;
      setOverride(id, String(displayName));
    }
  }, [record, id, setOverride]);

  // Extract header config and tab structure from child nodes
  let headerConfig: DetailHeaderConfig | undefined;
  let headerStateMachine: StateMachine | null | undefined;
  let tabNodes: ComponentNode[] = [];

  if (childNodes) {
    for (const child of childNodes) {
      if (child.kind === 'detail_header') {
        headerConfig = child.props?.config;
        headerStateMachine = child.props?.state_machine;
      }
      if (child.kind === 'tab_layout') {
        tabNodes = child.children || [];
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-t-transparent rounded-full" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {display_name || entity || 'list'}
        </button>
      </div>
      {record ? (
        <>
          <DetailHeader
            config={headerConfig}
            record={record}
            fields={fields}
            state_machine={headerStateMachine ?? state_machine}
            api_resource={api_resource}
          />
          {tabNodes.length > 0 ? (
            <DetailTabLayout
              tabs={tabNodes}
              record={record}
              fields={fields}
              relationships={relationships}
              parentId={id}
              hasPermission={hasPermission}
            />
          ) : (
            <div className="flex-1 p-6 text-gray-500">No detail layout configured</div>
          )}
        </>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-gray-500">
            Unable to load data. Check your API connection.
          </p>
        </div>
      ) : (
        <div className="flex-1 p-6">
          <p className="text-gray-500">No record found</p>
        </div>
      )}
    </div>
  );
}

interface DetailTabLayoutProps {
  tabs: ComponentNode[];
  record: Record<string, any>;
  fields?: Field[];
  relationships?: Relationship[];
  parentId?: string;
  hasPermission: (roles: string[]) => boolean;
}

function DetailTabLayout({ tabs, record, fields, relationships, parentId, hasPermission }: DetailTabLayoutProps) {
  const [activeTab, setActiveTab] = useState(0);

  // Filter tabs by permissions
  const visibleTabs = tabs.filter((tab) => {
    if (tab.conditions) {
      for (const cond of tab.conditions) {
        if (cond.type === 'permission' && cond.roles) {
          if (!hasPermission(cond.roles)) return false;
        }
      }
    }
    return true;
  });

  const currentTab = visibleTabs[activeTab];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="border-b border-gray-200">
        <nav className="flex gap-0 px-6" role="tablist">
          {visibleTabs.map((tab, i) => (
            <button
              key={tab.props?.id || i}
              role="tab"
              aria-selected={i === activeTab}
              onClick={() => setActiveTab(i)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                i !== activeTab && 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
              style={i === activeTab ? { borderBottomColor: 'var(--color-primary)', color: 'var(--color-primary)' } : undefined}
            >
              {tab.props?.icon && <Icon name={tab.props.icon} className="h-4 w-4" />}
              {tab.props?.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex-1 p-6 overflow-auto">
        {currentTab && (
          <TabContent
            tab={currentTab}
            record={record}
            fields={fields}
            relationships={relationships}
            parentId={parentId}
            hasPermission={hasPermission}
          />
        )}
      </div>
    </div>
  );
}

interface TabContentProps {
  tab: ComponentNode;
  record: Record<string, any>;
  fields?: Field[];
  relationships?: Relationship[];
  parentId?: string;
  hasPermission: (roles: string[]) => boolean;
}

function TabContent({ tab, record, fields, relationships, parentId, hasPermission }: TabContentProps) {
  // If this tab has a content type (e.g. relationship_table), render that
  if (tab.props?.content) {
    const content = tab.props.content;
    if (content.type === 'relationship_table' && relationships) {
      const rel = relationships.find((r) => r.name === content.relationship);
      if (rel && parentId) {
        return (
          <RelationshipTable
            relationship={rel}
            parentId={parentId}
            columns={content.columns}
          />
        );
      }
      return <div className="text-gray-400 text-sm">Relationship "{content.relationship}" not found</div>;
    }
    // Other content types (activity_feed, state_machine_timeline, etc.)
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        Content type "{content.type}" — coming soon
      </div>
    );
  }

  // Render section children with record + fields injected
  const sections = tab.children || [];
  if (sections.length === 0) {
    return <div className="text-gray-400 text-sm">No content configured for this tab</div>;
  }

  return (
    <div>
      {sections.map((sectionNode, i) => {
        // Check section-level permissions
        if (sectionNode.conditions) {
          for (const cond of sectionNode.conditions) {
            if (cond.type === 'permission' && cond.roles) {
              if (!hasPermission(cond.roles)) return null;
            }
          }
        }

        return (
          <Section
            key={sectionNode.id || i}
            title={sectionNode.props?.title}
            layout={sectionNode.props?.layout}
            fields={sectionNode.props?.fields}
            allFields={fields}
            record={record}
          />
        );
      })}
    </div>
  );
}
