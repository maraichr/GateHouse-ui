import React from 'react';
import { ComponentNode, ComponentKind } from './types';
import { AppShell } from './components/layout/AppShell';
import { Sidebar } from './components/layout/Sidebar';
import { NavItem } from './components/nav/NavItem';
import { NavGroup } from './components/nav/NavGroup';
import { usePermissions } from './auth/usePermissions';
import { TabLayout, Tab } from './components/layout/TabLayout';
import { Section } from './components/layout/Section';
import { DataTable } from './components/entity/DataTable';
import { FilterPanel } from './components/entity/FilterPanel';
import { SearchBar } from './components/entity/SearchBar';
import { DetailHeader } from './components/entity/DetailHeader';
import { EmptyState } from './components/entity/EmptyState';
import { FormSection } from './components/form/FormSection';
import {
  Page,
  TwoColumn,
  FormStep,
  Header,
  DisplayString,
  DisplayEnum,
  DisplayDate,
  DisplayCurrency,
  DisplayStarRating,
  DisplayBadge,
  DisplayAvatar,
} from './components/PassthroughComponents';
import {
  FieldString,
  FieldEnum,
  FieldDate,
  FieldReference,
  FieldCurrency,
  FieldRichtext,
  FieldAddress,
} from './components/FieldWrappers';

// Lazy-load heavy components
const EntityList = React.lazy(() => import('./components/entity/EntityList').then(m => ({ default: m.EntityList })));
const EntityDetail = React.lazy(() => import('./components/entity/EntityDetail').then(m => ({ default: m.EntityDetail })));
const DynamicForm = React.lazy(() => import('./components/form/DynamicForm').then(m => ({ default: m.DynamicForm })));
const SteppedForm = React.lazy(() => import('./components/form/SteppedForm').then(m => ({ default: m.SteppedForm })));
const CustomPage = React.lazy(() => import('./components/widgets/CustomPage').then(m => ({ default: m.CustomPage })));
const StatCards = React.lazy(() => import('./components/widgets/StatCards').then(m => ({ default: m.StatCards })));
const ChartWidget = React.lazy(() => import('./components/widgets/ChartWidget').then(m => ({ default: m.ChartWidget })));
const EntityTableWidget = React.lazy(() => import('./components/widgets/EntityTableWidget').then(m => ({ default: m.EntityTableWidget })));

type ComponentRenderer = React.ComponentType<any>;

const COMPONENT_MAP: Partial<Record<ComponentKind, ComponentRenderer>> = {
  // Layout
  app_shell: AppShell,
  sidebar: Sidebar,
  header: Header,
  page: Page,
  two_column: TwoColumn,
  tab_layout: TabLayout,
  tab: Tab,
  section: Section,

  // Navigation
  nav_item: NavItem,
  nav_group: NavGroup,

  // Entity views
  entity_list: EntityList,
  entity_detail: EntityDetail,
  data_table: DataTable,
  filter_panel: FilterPanel,
  search_bar: SearchBar,
  detail_header: DetailHeader,
  empty_state: EmptyState,

  // Forms
  create_form: DynamicForm,
  edit_form: DynamicForm,
  stepped_form: SteppedForm,
  form_step: FormStep,
  form_section: FormSection,

  // Display components
  display_string: DisplayString,
  display_enum: DisplayEnum,
  display_date: DisplayDate,
  display_currency: DisplayCurrency,
  display_star_rating: DisplayStarRating,
  display_badge: DisplayBadge,
  display_avatar: DisplayAvatar,

  // Field components
  field_string: FieldString,
  field_enum: FieldEnum,
  field_date: FieldDate,
  field_reference: FieldReference,
  field_currency: FieldCurrency,
  field_richtext: FieldRichtext,
  field_address: FieldAddress,

  // Widgets
  custom_page: CustomPage,
  stat_cards: StatCards,
  chart: ChartWidget,
  entity_table_widget: EntityTableWidget,
};

// Components that receive raw childNodes instead of rendered children
const CHILD_NODE_KINDS = new Set<ComponentKind>(['entity_list', 'entity_detail', 'create_form', 'edit_form']);

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

  // Special handling: pass raw child node data instead of rendered children
  if (CHILD_NODE_KINDS.has(node.kind)) {
    return <Component {...(node.props || {})} childNodes={node.children} />;
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
