# GateHouse Component Mapping

Maps each abstract `ComponentKind` to concrete implementations in React and Flutter. When adding a new component, update this table and implement in both renderers.

## Layout Components

| ComponentKind | React Implementation | Flutter Implementation | Notes |
|---|---|---|---|
| `app_shell` | `<AppShell>` — flex container with sidebar + main | `Scaffold` with `Drawer` + body | React uses CSS grid/flex. Flutter uses Scaffold slots. |
| `sidebar` | `<aside>` with collapsible width transition | `NavigationDrawer` (Material 3) | Collapsible state stored in local state/provider |
| `header` | `<header>` sticky with flex row | `AppBar` or custom `PreferredSize` widget | React: sticky positioning. Flutter: SliverAppBar for scroll behavior. |
| `page` | Route component wrapping content | `StatefulWidget` registered in GoRouter | Each page is a route target |
| `tab_layout` | shadcn `<Tabs>` or headless tabs | `DefaultTabController` + `TabBar` + `TabBarView` | React: radix/headless UI. Flutter: Material TabBar. |
| `tab` | `<TabsContent>` child | `Tab` widget | Content rendered lazily in both |
| `section` | `<section>` with heading + content | `Column` with header `Text` + children | Semantic HTML in React |
| `two_column` | CSS grid `grid-cols-2` | `Row` with `Expanded` children | Responsive: collapses to single column below tablet breakpoint |

## Entity View Components

| ComponentKind | React Implementation | Flutter Implementation | Notes |
|---|---|---|---|
| `entity_list` | Page with DataTable + FilterPanel + SearchBar | Page with `DataTable2` or custom `ListView` + filters | Full page composition |
| `data_table` | TanStack Table (`@tanstack/react-table`) | `DataTable2` package or `PaginatedDataTable` | React: headless + custom render. Flutter: Material DataTable with extensions. |
| `filter_panel` | Sidebar/drawer with form controls | `ExpansionPanelList` or `Drawer` with form fields | Position from YAML: sidebar, toolbar, or drawer |
| `search_bar` | `<input>` with debounced onChange | `SearchBar` (Material 3) or `TextField` with debounce | Debounce: React uses `useDeferredValue` or lodash. Flutter uses `Timer`. |
| `entity_detail` | Page with header + tabs/sections | Page with `CustomScrollView` + slivers | Tabbed or sectioned per YAML config |
| `detail_header` | Flex row: avatar + title + status + stats + actions | `SliverAppBar` with flexible space or custom header | Stats rendered as inline chips/counters |
| `stat_badge` | `<span>` with icon + label + value | `Chip` or custom `Container` | Used in detail header stats row |
| `activity_feed` | Vertical timeline with avatars | `Timeline` package or custom `ListView` | Infinite scroll in both |
| `empty_state` | Centered column: icon + title + message + CTA | `Center` → `Column` with same structure | Illustration slot optional |

## Form Components

| ComponentKind | React Implementation | Flutter Implementation | Notes |
|---|---|---|---|
| `create_form` | react-hook-form + zod validation | `Form` widget with `GlobalKey<FormState>` | React: schema-based validation. Flutter: validator callbacks. |
| `edit_form` | Same as create_form with pre-populated values | Same as create with `initialValue` on controllers | Immutable fields rendered as read-only display |
| `stepped_form` | Multi-step with progress indicator, step validation | `Stepper` widget or custom step controller | Each step validates independently before advancing |
| `form_step` | Fieldset within stepped form | `Step` widget content | — |
| `form_section` | `<fieldset>` with legend | `Column` with section header | Groups related fields |

## Field Input Components

Each field type has an input component (forms) and a display component (read-only views).

| ComponentKind | React Implementation | Flutter Implementation | YAML `type` |
|---|---|---|---|
| `field_string` | `<input type="text">` with react-hook-form register | `TextFormField` | `string` |
| `field_enum` | `<select>` (>4 options) or radio group (≤4) | `DropdownButtonFormField` or `RadioListTile` group | `enum` |
| `field_date` | Date picker (react-day-picker or native) | `showDatePicker` → `TextFormField` | `date` |
| `field_datetime` | Combined date + time picker | `showDatePicker` + `showTimePicker` | `datetime` |
| `field_reference` | Async searchable select (react-select or combobox) | `Autocomplete` widget with API search | `reference` |
| `field_currency` | `<input type="number">` with currency prefix | `TextFormField` with `inputFormatters` | `currency` |
| `field_richtext` | TipTap or Lexical editor | `flutter_quill` | `richtext` |
| `field_image` | Dropzone with preview (react-dropzone) | `ImagePicker` + preview | `image` |
| `field_file` | Dropzone with file list | `FilePicker` + list display | `file`, `file_list` |
| `field_address` | Structured fields: street, city, state, zip, country | Column of `TextFormField` with state dropdown | `address` |
| `field_phone` | Masked input with country code | `TextFormField` with phone `inputFormatters` | `phone` |
| `field_boolean` | Toggle switch or checkbox | `Switch` or `Checkbox` | `boolean` |
| `field_inline_table` | Editable table with add/remove rows | `DataTable` with editable cells + row controls | `inline_table` |

## Display Components (Read-Only)

| ComponentKind | React Implementation | Flutter Implementation | Triggered by |
|---|---|---|---|
| `display_string` | `<span>` with optional truncation | `Text` with `maxLines` | Default for `string` |
| `display_enum` | Colored badge: bg + text + optional icon | `Chip` with color from enum config | `enum` fields |
| `display_date` | `<time>` with relative or absolute format | `Text` with `intl` DateFormat | `date`, `datetime` |
| `display_currency` | Formatted with `Intl.NumberFormat` | `NumberFormat` from `intl` package | `currency` |
| `display_star_rating` | SVG stars (filled/half/empty) | Custom `Row` of `Icon` widgets | `display_as: star_rating` |
| `display_badge` | `<span>` styled badge | `Chip` or `Container` with decoration | `display_as: badge` |
| `display_avatar` | `<img>` in rounded container with fallback initials | `CircleAvatar` with `NetworkImage` + fallback | `display_as: avatar` |
| `display_progress_bar` | `<progress>` or styled `<div>` | `LinearProgressIndicator` | `display_as: progress_bar` |

## Action Components

| ComponentKind | React Implementation | Flutter Implementation | Notes |
|---|---|---|---|
| `action_button` | `<button>` with variant styling | `ElevatedButton`, `OutlinedButton`, or `TextButton` | Variant from `color` prop maps to semantic color |
| `bulk_actions` | Floating bar at bottom when items selected | `BottomSheet` or floating `Card` | Appears on multi-select |
| `state_transition` | Button that triggers confirmation → API call | Same pattern with `showDialog` | Wraps action_button + confirm_dialog |
| `confirm_dialog` | Modal dialog (radix Dialog) | `showDialog` → `AlertDialog` | Style from YAML: success/danger/warning |
| `transition_form` | Modal with form fields for transition data | `showModalBottomSheet` with `Form` | Collects additional data during state transition |

## Widget Components (Dashboard / Custom Pages)

| ComponentKind | React Implementation | Flutter Implementation | Notes |
|---|---|---|---|
| `stat_cards` | CSS grid of cards with icon + value + label | `GridView` of custom `Card` widgets | Responsive: 4-col → 2-col → 1-col |
| `chart` | Recharts (`LineChart`, `BarChart`, `PieChart`) | `fl_chart` package | Chart type from YAML: bar, line, donut, area |
| `entity_table_widget` | Compact DataTable with limited rows + "View all" link | Compact `DataTable` with "View all" | Used in dashboards, not full entity list |
| `report_builder` | Form to select report + parameters + export button | Form with dropdowns + export | Export calls API endpoint |
| `settings_form` | Sectioned form with auto-save or save button | Sectioned `Form` with controllers | Source/save from YAML `settings_form.sections[].fields[].source/save` |
| `activity_feed` | Vertical timeline list | `ListView` with timeline styling | Shared with entity detail activity tab |

## Navigation Components

| ComponentKind | React Implementation | Flutter Implementation | Notes |
|---|---|---|---|
| `nav_item` | `<NavLink>` with icon + label + optional badge | `NavigationDrawerDestination` or custom `ListTile` | Active state from route match |
| `nav_group` | Collapsible section with label + children | `ExpansionTile` with children | Expanded state persisted |
| `breadcrumbs` | `<nav>` with `<ol>` breadcrumb trail | `Row` of `TextButton` with separators | Auto-generated from route hierarchy |

## Adding a New Component

1. Choose a `ComponentKind` name (snake_case)
2. Add the kind to `engine/component.go`
3. Add a row to the relevant table above
4. Create templates: `react/{category}/{kind}.tsx.tmpl` and `flutter/{category}/{kind}.dart.tmpl`
5. Register in `manifest.yaml` with props contract
6. Write a shared test fixture that verifies equivalent output behavior
