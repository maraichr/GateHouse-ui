import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEntityDetail } from '../../data/useEntityDetail';
import { usePermissions } from '../../auth/usePermissions';
import { useBreadcrumbs } from '../../context/BreadcrumbContext';
import { DetailHeader } from './DetailHeader';
import { Section } from '../layout/Section';
import { RelationshipTable } from './RelationshipTable';
import { ActivityFeed } from './ActivityFeed';
import { StateMachineTimeline } from './StateMachineTimeline';
import { Icon } from '../../utils/icons';
import { cn } from '../../utils/cn';
import { ArrowLeft } from 'lucide-react';
import { DetailSkeleton } from '../shared/Skeleton';
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
  label_field,
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
      const displayName = (label_field && record[label_field]) || record.name || record.company_name || record.title || record.display_name || id;
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
      <div role="status" aria-live="polite">
        <span className="sr-only">Loading record...</span>
        <DetailSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm"
          style={{ color: 'var(--color-text-muted)' }}
          aria-label={`Back to ${display_name || entity || 'list'}`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to {display_name || entity || 'list'}
        </button>
      </div>
      {record ? (
        <div className="animate-fadeIn">
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
            <div className="flex-1 p-6" style={{ color: 'var(--color-text-muted, #6b7280)' }}>No detail layout configured</div>
          )}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p style={{ color: 'var(--color-text-muted, #6b7280)' }}>
            Unable to load data. Check your API connection.
          </p>
        </div>
      ) : (
        <div className="flex-1 p-6">
          <p style={{ color: 'var(--color-text-muted, #6b7280)' }}>No record found</p>
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
      <div className="overflow-x-auto scrollbar-hide" style={{ borderBottom: '1px solid var(--color-border, #e5e7eb)' }}>
        <nav className="flex gap-0 px-6 min-w-max" role="tablist">
          {visibleTabs.map((tab, i) => (
            <button
              key={tab.props?.id || i}
              role="tab"
              aria-selected={i === activeTab}
              onClick={() => setActiveTab(i)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                i !== activeTab && 'border-transparent'
              )}
              style={i === activeTab ? { borderBottomColor: 'var(--color-primary)', color: 'var(--color-primary)' } : { color: 'var(--color-text-muted, #6b7280)' }}
            >
              {tab.props?.icon && <Icon name={tab.props.icon} className="h-4 w-4 flex-shrink-0" />}
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
      return <div className="text-sm" style={{ color: 'var(--color-text-faint, #9ca3af)' }}>Relationship "{content.relationship}" not found</div>;
    }

    if (content.type === 'activity_feed') {
      return (
        <ActivityFeed
          source={content.source || ''}
          parentId={parentId}
          item_template={content.item_template}
        />
      );
    }

    if (content.type === 'state_machine_timeline') {
      return (
        <StateMachineTimeline
          source={content.source || ''}
          parentId={parentId}
          show_current_state={content.show_current_state}
          currentState={record?.status}
        />
      );
    }

    return (
      <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-faint, #9ca3af)' }}>
        Content type "{content.type}" is not supported yet.
      </div>
    );
  }

  // Render section children with record + fields injected
  const sections = tab.children || [];
  if (sections.length === 0) {
    return <div className="text-sm" style={{ color: 'var(--color-text-faint, #9ca3af)' }}>No content configured for this tab</div>;
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
