// --- AppSpec types (mirrors Go pkg/spec) ---

export interface AppSpec {
  app: AppMeta;
  studio?: StudioConfig;
  auth: AuthConfig;
  api: APIConfig;
  shell: ShellConfig;
  navigation: NavigationConfig;
  entities: Entity[];
  journeys?: Journey[];
  pages: Page[];
  behaviors?: BehaviorConfig;
}

export interface StudioConfig {
  schema_version?: string;
  mode_defaults?: {
    editor?: 'guided' | 'expert';
  };
}

export interface AppMeta {
  name: string;
  display_name: string;
  version: string;
  description?: string;
  theme: ThemeConfig;
  i18n: I18nConfig;
}

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
  font_scale?: string;
  motion_mode?: string;
  info_color?: string;
  warning_color?: string;
  elevation?: string;
  surface_style?: string;
  header_style?: string;
  chart_palette?: string[];
  logo?: LogoConfig;
}

export interface LogoConfig {
  light?: string;
  dark?: string;
  favicon?: string;
}

export interface I18nConfig {
  default_locale: string;
  supported_locales?: string[];
  date_format: string;
  time_format: string;
  currency: string;
  timezone: string;
}

export interface AuthConfig {
  provider: string;
  config: Record<string, unknown>;
  claims_mapping: Record<string, string>;
  roles: Record<string, RoleDefinition>;
  login?: Record<string, unknown>;
  logout?: Record<string, unknown>;
}

export interface RoleDefinition {
  display_name: string;
  description?: string;
}

export interface APIConfig {
  base_url?: string;
  [key: string]: unknown;
}

export interface ShellConfig {
  header?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface NavigationConfig {
  items: NavItem[];
}

export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  entity?: string;
  page?: string;
  target?: NavTarget;
  position?: string;
  permissions?: string[];
  badge?: NavBadge;
  children?: NavItem[];
}

export interface NavTarget {
  type: 'page' | 'entity' | 'external' | string;
  ref: string;
}

export interface NavBadge {
  type: string;
  filter?: Record<string, unknown>;
  color?: string;
  source?: string;
}

export interface Entity {
  name: string;
  api_resource: string;
  display_name: string;
  display_name_plural?: string;
  icon?: string;
  description?: string;
  label_field: string;
  subtitle_field?: string;
  status_field?: string;
  fields: Field[];
  state_machine?: StateMachine;
  relationships?: Relationship[];
  views: EntityViews;
  computed_fields?: ComputedField[];
}

export interface Field {
  name: string;
  type: string;
  path?: string;
  display_name?: string;
  required?: boolean;
  hidden?: boolean;
  primary_key?: boolean;
  immutable?: boolean;
  computed?: unknown;
  generated?: boolean;
  sensitive?: boolean;
  mask_pattern?: string;
  default?: unknown;
  placeholder?: string;
  help_text?: string;
  min_length?: number;
  max_length?: number;
  min?: unknown;
  max?: unknown;
  pattern?: string;
  pattern_message?: string;
  precision?: number;
  format?: string;
  currency?: string;
  future_only?: boolean;
  searchable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  values?: EnumValue[];
  show_in?: ShowIn;
  display_as?: string;
  display_rules?: DisplayRule[];
  permissions?: FieldPermissions;
  entity?: string;
  display_field?: string;
  items?: FieldItem;
  fields?: Field[];
  filter?: Record<string, unknown>;
  components?: Record<string, unknown>;
  toolbar?: string[];
  columns?: unknown[];
  fake?: string | FakeDepends;
}

export interface FieldItem {
  type: string;
  entity?: string;
  label_field?: string;
  fields?: Field[];
}

export interface FakeDepends {
  depends_on: string;
  map: Record<string, string>;
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

export interface FieldPermissions {
  view?: string[];
  edit?: string[];
}

export interface StateMachine {
  field: string;
  initial: string;
  transitions: Transition[];
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
  form?: { fields: Field[] };
}

export interface Confirmation {
  title: string;
  message?: string;
  style?: string;
  require_comment?: boolean;
  comment_label?: string;
  type_to_confirm?: string;
}

export interface Guard {
  name: string;
  message: string;
  field_check?: string;
  api_check?: string;
  expected?: Record<string, unknown>;
}

export interface Relationship {
  name: string;
  type: string;
  entity: string;
  foreign_key?: string;
  through?: string;
  display_name?: string;
  show_in_detail?: boolean;
  inline_create?: boolean;
  inline_edit?: boolean;
  default_sort?: { field: string; order: string };
}

export interface EntityViews {
  list?: ListView;
  detail?: DetailView;
  create?: FormView;
  edit?: FormView;
}

export interface ListView {
  title?: string;
  default_sort?: { field: string; order: string };
  columns: ListColumn[];
  filters?: FilterConfig;
  search?: SearchConfig;
  actions?: ActionConfig;
  bulk_actions?: BulkAction[];
  presets?: FilterPreset[];
  empty?: EmptyState;
}

export interface FilterPreset {
  label: string;
  values: Record<string, unknown>;
}

export interface ListColumn {
  field: string;
  width?: unknown;
  fixed?: string;
  link_to?: string;
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
}

export interface SearchConfig {
  placeholder?: string;
  fields: string[];
  debounce_ms?: number;
}

export interface ActionConfig {
  primary?: ActionButton[];
  secondary?: ActionButton[];
  row?: ActionButton[];
}

export interface ActionButton {
  label: string;
  icon?: string;
  action: unknown;
  permissions?: string[];
}

export interface BulkAction {
  label: string;
  icon?: string;
  action: unknown;
  permissions?: string[];
}

export interface EmptyState {
  icon?: string;
  title: string;
  message?: string;
  action?: { label: string; path: string };
}

export interface DetailView {
  layout: string;
  header?: DetailHeader;
  tabs?: DetailTab[];
  left?: DetailSection[];
  right?: { sections: DetailSection[] };
}

export interface DetailHeader {
  title: string;
  subtitle?: string;
  avatar?: string;
  status_badge?: string;
  stats?: HeaderStat[];
}

export interface HeaderStat {
  label: string;
  value: unknown;
  display_as?: string;
}

export interface DetailTab {
  id: string;
  label: string;
  icon?: string;
  sections?: DetailSection[];
  content?: { type: string; relationship?: string; columns?: string[] };
}

export interface DetailSection {
  title?: string;
  layout?: string;
  fields?: string[];
  permissions?: string[];
}

export interface FormView {
  title: string;
  layout: string;
  submit_label?: string;
  cancel_path?: string;
  steps?: FormStep[];
  sections?: FormSection[];
  field_overrides?: Record<string, Partial<Field>>;
}

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  type?: string;
  fields?: string[];
}

export interface FormSection {
  title: string;
  fields: string[];
  permissions?: string[];
}

export interface Page {
  id: string;
  path: string;
  title: string;
  purpose?: 'screen' | 'dashboard' | 'flow_step' | 'settings' | string;
  journey_id?: string;
  step_id?: string;
  primary_entity?: string;
  success_metric?: string;
  permissions?: string[];
  widgets: Widget[];
}

export interface Journey {
  id: string;
  name: string;
  goal?: string;
  primary_roles?: string[];
  entry?: boolean;
  steps?: JourneyStep[];
}

export interface JourneyStep {
  id: string;
  name: string;
  page_id?: string;
  entity_refs?: string[];
  service_scope?: string;
}

export interface Widget {
  type: string;
  title?: string;
  layout?: string;
  cards?: StatCard[];
  chart_type?: string;
  source?: string;
  data_mapping?: Record<string, unknown>;
  height?: number;
  entity?: string;
  query?: { filter?: Record<string, unknown>; sort?: { field: string; order: string }; limit?: number };
  columns?: unknown;
  link?: string;
}

export interface StatCard {
  title: string;
  value: unknown;
  icon?: string;
  color?: string;
  link?: string;
}

export interface ComputedField {
  name: string;
  display_name: string;
  type: string;
  expression: string;
}

export interface BehaviorConfig {
  notifications?: unknown;
}

// --- Reviewer-specific types ---

export interface ReviewerUser {
  id: string;
  email: string;
  display_name: string;
  role: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Spec {
  id: string;
  app_name: string;
  display_name: string;
  description?: string;
  owner_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SpecVersion {
  id: string;
  spec_id: string;
  version: string;
  spec_data: AppSpec;
  status: 'draft' | 'in_review' | 'approved' | 'archived';
  created_by?: string;
  created_at: string;
  parent_id?: string;
  change_summary?: string;
}

export interface SpecVersionSummary {
  id: string;
  spec_id: string;
  version: string;
  status: 'draft' | 'in_review' | 'approved' | 'archived';
  created_by?: string;
  created_at: string;
  parent_id?: string;
  change_summary?: string;
}

export interface Annotation {
  id: string;
  version_id: string;
  element_path: string;
  element_type: string;
  body: string;
  state: 'open' | 'resolved' | 'blocking';
  author_id: string;
  author_name?: string;
  parent_id?: string;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface Approval {
  id: string;
  version_id: string;
  reviewer_id: string;
  decision: 'approved' | 'rejected' | 'needs_changes';
  notes?: string;
  created_at: string;
}

export interface AuditEntry {
  id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface CoverageReport {
  overall: number;
  entities: EntityCoverage[];
  summary: CoverageSummary;
  gaps: CoverageGap[];
}

export interface EntityCoverage {
  name: string;
  overall: number;
  field_score: number;
  state_machine_score: number;
  view_score: number;
  permission_score: number;
  field_count: number;
  has_state_machine: boolean;
  has_list_view: boolean;
  has_detail_view: boolean;
  has_create_form: boolean;
  has_edit_form: boolean;
  relationship_count: number;
}

export interface CoverageSummary {
  entity_count: number;
  field_count: number;
  state_machine_count: number;
  view_count: number;
  page_count: number;
  nav_item_count: number;
  role_count: number;
  field_score: number;
  state_machine_score: number;
  view_score: number;
  permission_score: number;
  navigation_score: number;
}

export interface CoverageGap {
  entity: string;
  area: string;
  message: string;
  severity: 'warning' | 'info';
}

export interface SpecWithVersion extends Spec {
  latest_version?: SpecVersionSummary;
}

// --- Composition types ---

export interface Composition {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  host_spec_id: string;
  owner_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CompositionWithInfo extends Composition {
  host_spec_name: string;
  member_count: number;
}

export interface CompositionMember {
  id: string;
  composition_id: string;
  spec_id: string;
  service_name: string;
  prefix: string;
  nav_group: string;
  nav_order: number;
  optional: boolean;
  added_at: string;
}

export interface ComposedSpecResponse {
  composed_spec: AppSpec;
  sources: Record<string, string>;
  host_name: string;
  members: CompositionMember[];
}

export interface ComposedCoverageReport extends CoverageReport {
  sources: Record<string, string>;
  service_coverages: ServiceCoverage[];
}

export interface ServiceCoverage {
  service: string;
  entity_count: number;
  average: number;
}

export interface EnrichedEntityCoverage extends EntityCoverage {
  source: string;
}
