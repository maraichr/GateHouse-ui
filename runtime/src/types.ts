export type ComponentKind =
  | 'app_shell'
  | 'sidebar'
  | 'header'
  | 'page'
  | 'tab_layout'
  | 'tab'
  | 'section'
  | 'two_column'
  | 'entity_list'
  | 'data_table'
  | 'filter_panel'
  | 'search_bar'
  | 'entity_detail'
  | 'detail_header'
  | 'empty_state'
  | 'create_form'
  | 'edit_form'
  | 'stepped_form'
  | 'form_step'
  | 'form_section'
  | 'display_string'
  | 'display_enum'
  | 'display_date'
  | 'display_currency'
  | 'display_star_rating'
  | 'display_badge'
  | 'display_avatar'
  | 'field_string'
  | 'field_enum'
  | 'field_date'
  | 'field_reference'
  | 'field_currency'
  | 'field_richtext'
  | 'field_address'
  | 'nav_item'
  | 'nav_group'
  | 'stat_cards'
  | 'chart'
  | 'entity_table_widget'
  | 'custom_page';

export interface ComponentNode {
  id?: string;
  kind: ComponentKind;
  props?: Record<string, any>;
  children?: ComponentNode[];
  scope?: Scope;
  conditions?: RenderCondition[];
}

export interface Scope {
  entity?: string;
  page?: string;
  route?: string;
}

export interface RenderCondition {
  type: string;
  roles?: string[];
}

export interface ComponentTree {
  root: ComponentNode;
  metadata: TreeMetadata;
}

export interface TreeMetadata {
  app_name: string;
  version: string;
  entities: string[];
  route_count: number;
  target?: string;
}

// Spec types used by components
export interface ThemeConfig {
  mode: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  danger_color: string;
  success_color: string;
  border_radius: string;
  density: string;
  font_family: string;
}

export interface SidebarConfig {
  position: string;
  collapsible: boolean;
  default_collapsed: boolean;
  width: number;
  collapsed_width: number;
  show_user_menu: boolean;
  show_search: boolean;
}

export interface NavBadge {
  type: string;
  filter?: Record<string, any>;
  color?: string;
  source?: string;
}

export interface Field {
  name: string;
  type: string;
  display_name?: string;
  required?: boolean;
  hidden?: boolean;
  primary_key?: boolean;
  immutable?: boolean;
  computed?: any;
  generated?: boolean;
  sensitive?: boolean;
  mask_pattern?: string;
  sortable?: boolean;
  filterable?: boolean;
  values?: EnumValue[];
  show_in?: ShowIn;
  display_as?: string;
  display_rules?: DisplayRule[];
  placeholder?: string;
  help_text?: string;
  min_length?: number;
  max_length?: number;
  min?: any;
  max?: any;
  pattern?: string;
  pattern_message?: string;
  future_only?: boolean;
  entity?: string;
  items?: { type: string; entity?: string; label_field?: string };
  input_type?: string;
  currency?: string;
  format?: string;
  components?: Record<string, any>;
  highlight?: boolean;
}

export interface EnumValue {
  value: string;
  label: string;
  color?: string;
  icon?: string;
}

export interface ShowIn {
  list: boolean;
  detail: boolean;
  create: boolean;
  edit: boolean;
}

export interface DisplayRule {
  condition: string;
  style: string;
  tooltip?: string;
  label?: string;
}

export interface ListColumn {
  field: string;
  width?: number | string;
  fixed?: string;
  link_to?: string;
  max_display?: number;
  display_field?: string;
}

export interface FilterConfig {
  layout: string;
  persistent?: boolean;
  groups: FilterGroup[];
}

export interface FilterGroup {
  label?: string;
  fields: FilterField[];
}

export interface FilterField {
  field: string;
  type: string;
  show_counts?: boolean;
  searchable?: boolean;
  min?: any;
  max?: any;
  step?: number;
  presets?: { label: string; range: any[] }[];
}

export interface SearchConfig {
  placeholder?: string;
  fields: string[];
  debounce_ms?: number;
  min_length?: number;
}

export interface SortConfig {
  field: string;
  order: string;
}

export interface EmptyStateConfig {
  icon?: string;
  title: string;
  message?: string;
  action?: { label: string; path: string };
}

export interface DetailHeader {
  title: string;
  subtitle?: string;
  avatar?: string;
  status_badge?: string;
  stats?: HeaderStat[];
  actions?: any;
}

export interface HeaderStat {
  label: string;
  value: any;
  icon?: string;
  display_as?: string;
  format?: string;
  permissions?: string[];
}

export interface StateMachine {
  field: string;
  initial: string;
  transitions: Transition[];
}

export interface Confirmation {
  message: string;
  type?: 'simple' | 'comment_required' | 'type_to_confirm';
  confirm_text?: string;
  confirm_value?: string;
}

export interface Guard {
  type: 'field_check' | 'role_check';
  field_check?: string;
  expected?: any;
  message?: string;
}

export interface TransitionFormField {
  name: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  values?: EnumValue[];
}

export interface Transition {
  name: string;
  label: string;
  from: string[];
  to: string;
  icon?: string;
  color?: string;
  confirmation?: Confirmation;
  guards?: Guard[];
  permissions?: string[];
  form?: TransitionFormField[];
}

export interface HeaderConfig {
  show_breadcrumbs?: boolean;
  show_search?: boolean;
  show_notifications?: boolean;
  actions?: HeaderAction[];
}

export interface HeaderAction {
  type: string;
  icon?: string;
  label?: string;
  target?: ActionTarget;
}

export interface ActionTarget {
  type: string;
  path?: string;
  url?: string;
}

export interface Relationship {
  name: string;
  type: string;
  entity: string;
  foreign_key?: string;
  display_name?: string;
  show_in_detail?: boolean;
}
