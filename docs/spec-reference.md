# GateHouse UI Spec Reference

Complete reference for the YAML spec format consumed by GateHouse UI runtimes.

## Top-Level Structure

```yaml
app:            # Application metadata, theme, i18n
studio:         # Studio authoring metadata (schema_version, mode defaults)
auth:           # Authentication provider and roles
api:            # API connection settings
shell:          # Sidebar and header configuration
navigation:     # Sidebar navigation items
entities:       # Data entity definitions (fields, views, forms, state machines)
journeys:       # PM-friendly user journeys and steps
pages:          # Custom pages (dashboards, landing pages)
behaviors:      # App-level behaviors (notifications)
```

---

## `app`

| Field | Type | Description |
|---|---|---|
| `name` | string | Machine-readable app identifier |
| `display_name` | string | Human-readable name shown in UI |
| `version` | string | Spec version |
| `description` | string | App description |
| `theme` | object | Theme configuration (see below) |
| `i18n` | object | Localization settings |

### `app.theme`

| Field | Type | Default | Description |
|---|---|---|---|
| `mode` | `light` \| `dark` | `light` | Color mode |
| `primary_color` | hex string | `#1E40AF` | Primary brand color |
| `secondary_color` | hex string | `#7C3AED` | Secondary color |
| `accent_color` | hex string | `#F59E0B` | Accent/highlight color |
| `danger_color` | hex string | `#DC2626` | Error/danger color |
| `success_color` | hex string | `#16A34A` | Success color |
| `border_radius` | `none` \| `sm` \| `md` \| `lg` \| `full` | `md` | Border radius scale |
| `density` | `compact` \| `comfortable` \| `spacious` | `comfortable` | Spacing density |
| `font_scale` | `sm` \| `md` \| `lg` | `md` | Font size scale |
| `motion_mode` | `full` \| `reduced` \| `none` | `full` | Animation duration scale |
| `font_family` | string | `Inter, system-ui` | CSS font-family |
| `logo` | object | — | `{ light, dark, favicon }` image paths |

### `app.i18n`

| Field | Type | Description |
|---|---|---|
| `default_locale` | string | e.g. `en-US` |
| `date_format` | string | e.g. `MMM d, yyyy` |
| `time_format` | string | e.g. `h:mm a` |
| `currency` | string | e.g. `USD` |
| `timezone` | string | e.g. `America/New_York` |

---

## `auth`

| Field | Type | Description |
|---|---|---|
| `provider` | `oidc` \| `oauth2` \| `api_key` \| `custom` | Auth provider type |
| `config` | object | Provider-specific config (`issuer`, `client_id`, etc.) |
| `roles` | map | Role definitions keyed by role ID |

---

## `shell`

### `shell.sidebar`

| Field | Type | Default | Description |
|---|---|---|---|
| `position` | `left` \| `right` | `left` | Sidebar position |
| `collapsible` | boolean | `true` | Allow collapse toggle |
| `default_collapsed` | boolean | `false` | Start collapsed |
| `width` | number | `260` | Expanded width in pixels |
| `collapsed_width` | number | `64` | Collapsed width in pixels |

### `shell.header`

| Field | Type | Default | Description |
|---|---|---|---|
| `show_breadcrumbs` | boolean | `true` | Show breadcrumb navigation |
| `show_search` | boolean | `true` | Show global search (Ctrl+K) |
| `show_notifications` | boolean | `true` | Show notification bell |

---

## `navigation.items`

Each item:

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier |
| `label` | string | Display text |
| `icon` | string | Lucide icon name |
| `route` | string | URL path |
| `entity` | string | Entity name (auto-generates routes) |
| `page` | string | Custom page ID |
| `target` | object | Normalized target: `{ type: page\|entity\|external, ref }` |
| `badge` | object | Badge config: `{ type, filter, color, source }` |
| `children` | array | Nested nav items (nav groups) |

---

## `entities[]`

| Field | Type | Description |
|---|---|---|
| `name` | string | PascalCase entity name |
| `display_name` | string | Plural display name |
| `api_resource` | string | API path (e.g. `/products`) |
| `icon` | string | Lucide icon name |
| `label_field` | string | Field used as record label |
| `fields` | array | Field definitions |
| `list_view` | object | List page configuration |
| `detail_view` | object | Detail page configuration |
| `create_form` | object | Create form configuration |
| `edit_form` | object | Edit form configuration |
| `state_machine` | object | Workflow state machine |
| `relationships` | array | Entity relationships |

### Field Types

| Type | Description | Extra fields |
|---|---|---|
| `string` | Text input | `min_length`, `max_length`, `pattern` |
| `email` | Email input | — |
| `phone` | Phone input | `input_type: phone` |
| `integer` | Whole number | `min`, `max` |
| `decimal` | Decimal number | `min`, `max` |
| `currency` | Money amount | `currency` (ISO code) |
| `date` | Date picker | `future_only` |
| `datetime` | Date + time | — |
| `enum` | Select/radio | `values: [{ value, label, color, icon }]` |
| `boolean` | Checkbox | — |
| `reference` | Foreign key | `entity` (referenced entity name) |
| `array` | List of items | `items: { type, entity }` |
| `richtext` | HTML editor | — |
| `address` | Address composite | `components: { street, city, state, zip, country }` |
| `image` | Image URL | — |

### Common Field Properties

| Property | Type | Description |
|---|---|---|
| `name` | string | Field identifier |
| `type` | string | One of the field types above |
| `display_name` | string | Label shown in UI |
| `required` | boolean | Validation required |
| `primary_key` | boolean | Marks the ID field |
| `generated` | boolean | Auto-generated (hidden in forms) |
| `hidden` | boolean | Never shown |
| `sensitive` | boolean | Value masked by default |
| `mask_pattern` | string | Masking pattern (`#`=show, `*`=hide) |
| `sortable` | boolean | Sortable in list view |
| `filterable` | boolean | Filterable |
| `placeholder` | string | Input placeholder text |
| `help_text` | string | Help text below input |
| `display_rules` | array | Conditional styling rules |
| `permissions` | array | Role restrictions |

### Display Rules

```yaml
display_rules:
  - condition: "value < today + 30d"
    style: warning          # warning | danger | success | info | muted
    tooltip: "Expiring soon"
    label: "Expiring"       # Optional override label
```

### List View

```yaml
list_view:
  default_sort: { field: created_at, order: desc }
  columns:
    - { field: name, link_to: detail }
    - { field: status }
    - { field: amount, width: 120 }
  search:
    fields: [name, email]
    placeholder: "Search..."
    debounce_ms: 300
  filters:
    layout: toolbar | sidebar
    groups:
      - label: "Status"
        fields:
          - { field: status, type: checkbox_group }
          - { field: amount, type: numeric_range, min: 0, max: 10000 }
          - { field: created_at, type: date_range }
  filter_presets:
    - { label: "Active", filters: { status: "active" } }
  actions:
    primary:
      - label: "Add New"
        icon: plus
        action: { type: navigate, path: /entities/new }
  empty_state:
    icon: inbox
    title: "No records yet"
    message: "Create your first record to get started."
    action: { label: "Create", path: /entities/new }
```

### Detail View

```yaml
detail_view:
  header:
    title: "{{name}}"           # Template expression
    subtitle: "{{department}}"
    avatar: avatar_field
    status_badge: status
    stats:
      - { label: "Revenue", value: "{{revenue}}", icon: dollar-sign, display_as: currency }
  tabs:
    - id: overview
      label: "Overview"
      icon: info
      sections:
        - title: "Details"
          layout: two_column     # single_column | two_column
          fields: [name, email, phone, status]
    - id: related
      label: "Related Items"
      content:
        type: relationship_table
        relationship: orders
        columns: [...]
```

### State Machine

```yaml
state_machine:
  field: status
  initial: draft
  transitions:
    - name: submit
      label: "Submit for Review"
      from: [draft]
      to: pending
      color: blue
      icon: send
      permissions: [editor]
      guards:
        - type: field_check
          field_check: "title"
          expected: true           # Must be non-empty
          message: "Title is required"
      confirmation:
        message: "Submit this for review?"
        type: simple              # simple | comment_required | type_to_confirm
      form:                        # Optional fields collected on transition
        - { name: notes, type: string, label: "Notes" }
```

### Relationships

```yaml
relationships:
  - name: orders
    type: has_many
    entity: Order
    foreign_key: customer_id
    display_name: "Orders"
    show_in_detail: true
```

---

## `pages[]`

| Field | Type | Description |
|---|---|---|
| `id` | string | Page identifier (referenced by navigation) |
| `title` | string | Page title |
| `purpose` | string | `screen` \| `dashboard` \| `flow_step` \| `settings` |
| `journey_id` | string | Journey reference for guided authoring |
| `step_id` | string | Journey step reference for guided authoring |
| `layout` | string | `grid` for widget layout |
| `widgets` | array | Widget configurations |

---

## `journeys[]`

| Field | Type | Description |
|---|---|---|
| `id` | string | Journey identifier |
| `name` | string | Human-friendly journey name |
| `goal` | string | What the journey is trying to achieve |
| `primary_roles` | array | Roles primarily responsible for this journey |
| `entry` | boolean | Marks default starting journey |
| `steps` | array | Ordered steps containing `page_id` and related entity refs |

### Widget Types

```yaml
widgets:
  - type: stat_cards
    columns: 4
    cards:
      - title: "Revenue"
        value: { source: "api:GET /dashboard/stats", field: "revenue" }
        icon: dollar-sign
        color: success
        trend: { direction: up, value: "12%" }
        link: /invoices

  - type: chart
    config:
      type: bar              # bar | line | pie | area
      data_source: "api:GET /dashboard/chart"
      x_axis: month
      y_axis: amount

  - type: entity_table_widget
    entity: RecentOrders
    columns: [...]
    limit: 5
```
