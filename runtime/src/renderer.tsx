import React from 'react';
import { ComponentNode, ComponentKind } from './types';
import { AppShell } from './components/layout/AppShell';
import { Sidebar } from './components/layout/Sidebar';
import { NavItem } from './components/nav/NavItem';
import { NavGroup } from './components/nav/NavGroup';
import { usePermissions } from './auth/usePermissions';
import { TabLayout, Tab } from './components/layout/TabLayout';
import { Section } from './components/layout/Section';

// Lazy-load heavy components
const EntityList = React.lazy(() => import('./components/entity/EntityList').then(m => ({ default: m.EntityList })));
const EntityDetail = React.lazy(() => import('./components/entity/EntityDetail').then(m => ({ default: m.EntityDetail })));
const DynamicForm = React.lazy(() => import('./components/form/DynamicForm').then(m => ({ default: m.DynamicForm })));
const SteppedForm = React.lazy(() => import('./components/form/SteppedForm').then(m => ({ default: m.SteppedForm })));

type ComponentRenderer = React.ComponentType<any>;

const COMPONENT_MAP: Partial<Record<ComponentKind, ComponentRenderer>> = {
  app_shell: AppShell,
  sidebar: Sidebar,
  nav_item: NavItem,
  nav_group: NavGroup,
  entity_list: EntityList,
  entity_detail: EntityDetail,
  create_form: DynamicForm,
  edit_form: DynamicForm,
  stepped_form: SteppedForm,
  tab_layout: TabLayout,
  tab: Tab,
  section: Section,
};

export function renderNode(node: ComponentNode): React.ReactNode {
  const { hasPermission } = usePermissions();

  // Check render conditions
  if (node.conditions) {
    for (const cond of node.conditions) {
      if (cond.type === 'permission' && cond.roles) {
        if (!hasPermission(cond.roles)) {
          return null;
        }
      }
    }
  }

  const Component = COMPONENT_MAP[node.kind];
  if (!Component) {
    return <PlaceholderNode node={node} />;
  }

  const children = node.children?.map((child, i) => (
    <RenderNodeWrapper key={child.id || `${node.id}_${i}`} node={child} />
  ));

  return <Component {...(node.props || {})}>{children}</Component>;
}

export function RenderNodeWrapper({ node }: { node: ComponentNode }) {
  return (
    <React.Suspense fallback={<div className="animate-pulse bg-gray-100 rounded h-8" />}>
      <RenderNodeInner node={node} />
    </React.Suspense>
  );
}

function RenderNodeInner({ node }: { node: ComponentNode }) {
  return <>{renderNode(node)}</>;
}

function PlaceholderNode({ node }: { node: ComponentNode }) {
  return (
    <div className="p-4 border border-dashed border-gray-300 rounded-md bg-gray-50">
      <p className="text-sm text-gray-500">
        Component: <code className="text-xs bg-gray-200 px-1 rounded">{node.kind}</code>
        {node.id && <span className="ml-2">({node.id})</span>}
      </p>
      {node.children?.map((child, i) => (
        <RenderNodeWrapper key={child.id || i} node={child} />
      ))}
    </div>
  );
}
