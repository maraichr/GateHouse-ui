# Spec Reviewer — Component Library

Every reusable component in the spec reviewer. Components are listed by category with props, states, and composition rules.

## Table of Contents

1. [Layout Components](#layout-components)
2. [Coverage Components](#coverage-components)
3. [Entity Components](#entity-components)
4. [Field Components](#field-components)
5. [State Machine Components](#state-machine-components)
6. [Permission Components](#permission-components)
7. [Annotation Components](#annotation-components)
8. [Navigation Components](#navigation-components)
9. [Search Components](#search-components)
10. [Diff Components](#diff-components)
11. [Utility Components](#utility-components)

---

## Layout Components

### `<ReviewerShell>`

Top-level layout wrapper.

```
Props:
  specName: string        — App name from spec
  specVersion: string     — Version string
  versions?: string[]     — Available versions for selector
  onVersionChange?: fn    — Callback when version changes

Structure:
  ┌─ TopNav ─────────────────────────────────────┐
  │  Logo │ TabBar │ Search │ VersionSelector     │
  ├───────────────────────────────────────────────┤
  │  PageContent (slot)                           │
  └───────────────────────────────────────────────┘
```

No sidebar. Horizontal tab navigation only.

### `<TopNav>`

Horizontal navigation bar.

```
Props:
  tabs: Array<{ id, label, badge? }>
  activeTab: string
  onTabChange: fn

Tab IDs:
  overview | entities | permissions | relationships |
  navigation | pages | diff
```

Badges on tabs show counts (e.g., "Entities (4)", "3 ⚠" on permissions if gaps exist).

### `<PageHeader>`

Consistent header for every page.

```
Props:
  title: string
  subtitle?: string
  breadcrumbs?: Array<{ label, href }>
  coverageBadge?: { score, breakdown }
  actions?: ReactNode       — Right-aligned action buttons
```

Breadcrumbs format: `Entities / Subcontractor / Fields`

### `<CardGrid>`

Responsive grid container for entity cards and widget cards.

```
Props:
  columns?: 2 | 3 | 4     — Default: auto-fill, min 280px
  gap?: number             — Default: 16px
  children: ReactNode
```

### `<DetailPanel>`

Expandable detail panel used below state machine diagrams and in field expansion.

```
Props:
  title: string
  borderColor?: SemanticColor
  open: boolean
  onToggle: fn
  children: ReactNode

States:
  collapsed: Shows title only with chevron
  expanded: Shows title + children with animated height
```

---

## Coverage Components

### `<CoverageBar>`

Horizontal progress bar showing coverage percentage.

```
Props:
  score: number            — 0-100
  size?: 'sm' | 'md'      — sm: 4px height, md: 6px height
  showLabel?: boolean      — Show percentage text, default true
  animate?: boolean        — Animate on first render, default true

Colors:
  score >= 90  → green fill
  score 70-89  → amber fill
  score < 70   → red fill
  unfilled     → #E5E5E5
```

### `<CoverageBadge>`

Small icon + score badge.

```
Props:
  score: number
  size?: 'sm' | 'md'      — sm: 16px icon, md: 20px icon
  showScore?: boolean      — Show percentage text beside icon

Rendering:
  100%     → ✓ green checkmark in circle
  90-99%   → ✓ green checkmark
  70-89%   → ▲ amber triangle
  < 70%    → ✗ red X in circle
```

### `<CoverageBreakdown>`

Expandable list of coverage sub-scores. Shown when a coverage score is clicked.

```
Props:
  items: Array<{
    label: string          — "Fields", "State machine", "List view", etc.
    status: 'complete' | 'partial' | 'missing'
    detail?: string        — "12/12 configured" or "missing: header stats"
  }>

Rendering:
  Each item: status icon + label + detail text
  complete → ✓ green
  partial  → ▲ amber + detail in amber text
  missing  → ✗ red + detail in red text
```

### `<AttentionList>`

List of spec gaps and issues requiring attention.

```
Props:
  items: Array<{
    severity: 'warning' | 'error'
    message: string
    target: { type, entityId?, fieldId?, transitionId? }  — Click target
    onClick: fn
  }>

Rendering:
  warning → ⚠ amber icon
  error   → ✗ red icon
  Each item is clickable, navigating to the element with the gap
```

---

## Entity Components

### `<EntityCard>`

Card in the Entity Explorer grid.

```
Props:
  entity: {
    name: string
    displayName: string
    description: string
    icon: string
    fieldCount: number
    stateCount: number
    relationCount: number
    endpointCount: number
    states: Array<{ name, color }>
    coverageScore: number
  }
  onClick: fn

Structure:
  ┌─────────────────────────────┐
  │ [icon] Name     [badge]     │
  │                             │
  │ "Description text..."       │
  │                             │
  │ Fields  12  │ States  4     │
  │ Rels    3   │ Endpts  7     │
  │                             │
  │ ■ state1  ■ state2  ■ ...  │
  │                             │
  │ ████████████░░  92%         │
  └─────────────────────────────┘

Entire card is clickable.
Hover: border darkens.
```

### `<EntityDetailHeader>`

Header section of the entity detail page.

```
Props:
  entity: EntitySpec
  coverageScore: number
  coverageBreakdown: CoverageItem[]

Structure:
  ← Back link (breadcrumb)
  Entity name + description + icon
  Meta: label field, status field, icon
  Coverage badge + expandable breakdown
```

### `<EntityTabBar>`

Tab navigation within entity detail.

```
Props:
  tabs: Array<{
    id: 'fields' | 'state_machine' | 'views' | 'relationships'
    label: string
    count?: number
    hasIssues?: boolean
  }>
  activeTab: string
  onTabChange: fn

Tabs with issues show a small amber dot indicator.
Tabs with counts show the count in parentheses.
```

---

## Field Components

### `<FieldTable>`

Table of entity fields in the Fields tab.

```
Props:
  fields: FieldSpec[]
  expandedFieldId?: string
  onToggle: fn
  onAnnotate: fn

Columns:
  [expand arrow] | Name | Type | Required | LIST | DET | CRE | EDT

Each row is an expandable <FieldRow>.
```

### `<FieldRow>`

Single field in the table — collapsed and expanded states.

```
Props:
  field: FieldSpec
  expanded: boolean
  onToggle: fn
  annotationCount?: number

Collapsed:
  Name (heading-sm) | TypeBadge | RequiredDot | ShowInDots × 4 |
  Constraint summary line (body-sm, text-secondary)

Expanded:
  Full detail panel with all field properties:
  - Type, display name, required, constraints
  - Validation rules (human-readable)
  - Show-in matrix with symbols
  - Display rules (rendered as condition → result cards)
  - Permissions (role badges)
  - Annotations thread
```

### `<TypeBadge>`

Colored badge for a field type.

```
Props:
  type: FieldType           — 'string' | 'enum' | 'date' | 'reference' | ...
  referenceTo?: string      — Entity name for reference types
  isArray?: boolean         — Shows [] suffix

Rendering:
  Pill shape, mono-sm font, colored background per type
  Reference types: "→ EntityName" with amber bg
  Arrays: "→ EntityName[]"
```

### `<RequiredIndicator>`

Simple dot indicating required status.

```
Props:
  required: boolean

Rendering:
  required=true  → ● filled red dot (8px)
  required=false → (nothing, empty space)
```

### `<ShowInMatrix>`

Four-column visibility indicator.

```
Props:
  showIn: {
    list: boolean
    detail: boolean
    create: boolean | 'computed' | 'generated'
    edit: boolean | 'immutable' | 'computed'
  }
  permissions?: { view?: string[], edit?: string[] }

Renders: Four cells with symbols per visual-design.md Show-In Matrix spec.
```

### `<DisplayRuleCard>`

Renders a display rule as a human-readable condition → effect card.

```
Props:
  rule: {
    condition: string       — Human-readable: "value < today + 30 days"
    effect: SemanticColor
    tooltip?: string
    icon?: string
  }

Structure:
  ┌──────────────────────────────────────┐
  │  IF condition  →  [color swatch] effect  │
  │  tooltip text (if present)                │
  └──────────────────────────────────────┘
```

### `<EnumValueList>`

Horizontal list of enum values with semantic color swatches.

```
Props:
  values: Array<{ value: string, color: SemanticColor, label?: string }>
  wrap?: boolean            — Wrap to multiple lines, default true

Rendering:
  ■ pending  ■ approved  ■ suspended  ■ terminated
  Each: colored dot (8px) + value text (mono-sm)
```

---

## State Machine Components

### `<StateMachineDiagram>`

Interactive state machine visualization. The most complex component.

```
Props:
  states: Array<{
    name: string
    isInitial: boolean
    isFinal: boolean
    color: SemanticColor
  }>
  transitions: Array<{
    name: string
    from: string[]
    to: string
    color: SemanticColor
    guards: Guard[]
    permissions: string[]
    confirmation?: ConfirmationSpec
    form?: FormSpec
  }>
  selectedTransition?: string
  onTransitionSelect: fn
  onStateSelect: fn

Implementation:
  Use a graph layout library (dagre, ELK, or d3-dag) for auto-positioning.
  Render as SVG for crisp lines and interactivity.
  Do NOT use canvas — SVG allows hover/click on individual elements.
```

### `<StateNode>`

Individual state in the diagram.

```
Props:
  name: string
  color: SemanticColor
  isInitial: boolean
  isFinal: boolean
  isHighlighted: boolean
  onClick: fn

Rendering:
  Rounded rect, 120×48px
  Border: 2px, semantic color
  Background: semantic color at 10% opacity
  Text: uppercase, centered
  Initial: ● → arrow pointing in
  Final: double border
  Highlighted: border 3px, slight glow/shadow
```

### `<TransitionArrow>`

Arrow between states.

```
Props:
  label: string
  isSelected: boolean
  isHighlighted: boolean
  onClick: fn

Rendering:
  Path with arrowhead
  Label positioned along path
  Selected: blue color, thicker line
  Highlighted (on state hover): emphasized
```

### `<TransitionDetailPanel>`

Detail panel that opens when a transition is clicked.

```
Props:
  transition: TransitionSpec
  onClose: fn

Structure:
  ┌ transition.name ────────────────────────┐
  │                                         │
  │  From:    [state badges]                │
  │  To:      [state badge]                 │
  │                                         │
  │  Guards:  <GuardList>                   │
  │  Roles:   <RoleBadgeList>              │
  │  Confirm: <ConfirmationPreview>         │
  │  Form:    <TransitionFormPreview>       │
  └─────────────────────────────────────────┘
```

### `<GuardList>`

Human-readable list of guard conditions.

```
Props:
  guards: Array<{
    name: string
    message: string         — Human readable description
    type: 'field_check' | 'api_check' | 'permission_check'
    expression?: string     — Technical expression (shown de-emphasized)
  }>

Rendering:
  Each guard: ✓ icon + message (body text)
  Technical expression below in mono-sm, text-tertiary
  API check guards show the endpoint path
```

---

## Permission Components

### `<PermissionMatrix>`

Full roles × actions grid.

```
Props:
  roles: string[]
  sections: Array<{
    entityName: string
    actions: Array<{
      name: string
      type: 'crud' | 'transition' | 'field' | 'navigation'
      permissions: Record<string, boolean | 'conditional'>
    }>
  }>
  gaps: Array<{ action, entity, message }>
  onCellClick: fn
  highlightedRole?: string

Rendering:
  Sticky header row with role names
  Sections grouped by entity with dividers
  Transition actions prefixed with → and italicized
  Conditional cells show ◐ half-fill
```

### `<PermissionCell>`

Single cell in the permission matrix.

```
Props:
  granted: boolean | 'conditional'
  onClick: fn
  annotation?: boolean

Rendering:
  true         → ✓ green
  false        → · light gray
  conditional  → ◐ amber half-circle
  Has annotation → small blue dot in corner
```

### `<RoleBadge>`

Badge for a role name.

```
Props:
  role: string
  size?: 'sm' | 'md'

Rendering:
  Pill shape, bg-subtle background, body-sm text
  Example: [admin] [compliance_officer]
```

---

## Annotation Components

### `<AnnotationIndicator>`

Small badge overlaid on an annotated element.

```
Props:
  count: number
  hasBlocking: boolean
  allResolved: boolean

Rendering:
  count > 0 && hasBlocking  → 🔴 red badge with count
  count > 0 && !allResolved → 💬 blue badge with count
  count > 0 && allResolved  → ✓ green badge
  count === 0               → (hidden)

Position: absolute, top-right corner of parent element
Size: 20×20px circle
```

### `<AnnotationThread>`

Thread of annotations on an element.

```
Props:
  elementPath: string       — "Subcontractor → insurance_expiry_date"
  annotations: Array<{
    id: string
    author: { name, role, avatarInitials }
    timestamp: Date
    body: string
    state: 'open' | 'resolved' | 'blocking'
    replies: Annotation[]
  }>
  onReply: fn
  onResolve: fn
  onBlock: fn

Structure:
  Header: element path
  List of comments (see AnnotationComment)
  Reply input at bottom
```

### `<AnnotationComment>`

Single comment in a thread.

```
Props:
  author: { name, role, avatarInitials }
  timestamp: Date
  body: string
  state: 'open' | 'resolved' | 'blocking'
  isReply: boolean
  onResolve: fn

Rendering:
  [Avatar circle] Name (role) · relative time
  Body text
  Resolved comments: 0.6 opacity, ✓ Resolved label
  Replies: indented with thin left border
```

### `<AddAnnotation>`

Button + popover for adding a new annotation.

```
Props:
  elementPath: string
  onSubmit: fn

Interaction:
  Click [+ Add annotation] → popover with:
  - Textarea for comment
  - State selector: Open | Blocking
  - Submit button
```

---

## Navigation Components

### `<NavBlueprint>`

Tree view of the navigation structure.

```
Props:
  items: NavItemSpec[]      — Recursive (items can have children)
  issues: Array<{ itemId, message }>

Rendering:
  Indented tree with:
  - Icon + label
  - Target info (→ entity, → page, → path)
  - Permission badges
  - Badge configuration
  - ⚠ warnings for broken references
  Groups are collapsible
```

### `<NavItem>`

Single navigation item in the blueprint.

```
Props:
  icon: string
  label: string
  target: { type: 'entity' | 'page', name, path }
  permissions: string[] | 'all'
  badge?: { source, color }
  hasIssue?: boolean
  issueMessage?: string
  depth: number

Rendering:
  Indent by depth * 24px
  [icon] Label
    → target.type: target.name
    → path: target.path
    → permissions: role badges or "all"
    ⚠ issueMessage (red text, if present)
```

---

## Search Components

### `<GlobalSearch>`

Search input in the top navigation.

```
Props:
  onSearch: fn
  placeholder?: string     — Default: "Search fields, entities, transitions..."

Interaction:
  Focus or Cmd+K → expands to dropdown
  Debounce: 150ms
  Results grouped by category in <SearchResults>
```

### `<SearchResults>`

Dropdown of search results.

```
Props:
  results: Array<{
    category: 'entity' | 'field' | 'transition' | 'guard' | 'nav' | 'page' | 'enum_value'
    title: string
    subtitle: string        — Context path
    onClick: fn
  }>
  query: string             — For highlighting matches

Rendering:
  Results grouped by category with category headers
  Query text highlighted in results
  Max 5 results per category, "Show all" link if more
  Keyboard navigation: arrow keys + Enter
```

---

## Diff Components

### `<DiffSummary>`

Summary bar at top of diff view.

```
Props:
  fromVersion: string
  toVersion: string
  added: number
  modified: number
  removed: number
  coverageChange?: { from: number, to: number }

Rendering:
  "v1.0.0 → v1.1.0"
  "3 added · 2 modified · 1 removed"
  Coverage impact: "92% → 88% (↓4%)" in red if decreased
```

### `<DiffSection>`

Grouped section of changes (added, modified, or removed).

```
Props:
  type: 'added' | 'modified' | 'removed'
  items: DiffItem[]

Rendering:
  Section header with colored left border per diff colors in visual-design
  List of <DiffItem> components
```

### `<DiffItem>`

Single change in the diff.

```
Props:
  type: 'added' | 'modified' | 'removed'
  category: string          — "Entity", "Field", "Transition"
  path: string              — "Subcontractor.insurance_expiry_date"
  summary: string           — Brief description of change
  before?: string           — For modified/removed
  after?: string            — For added/modified
  onClick: fn

Rendering:
  [+/~/- icon] category: path
  Summary text
  For modified: before → after with strikethrough/highlight
```

---

## Utility Components

### `<Tooltip>`

Hover tooltip for additional context.

```
Props:
  content: string | ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number            — Default: 300ms

Used on: permission cells, show-in symbols, coverage scores, guards
```

### `<Badge>`

Generic colored badge for labels.

```
Props:
  label: string
  color: SemanticColor | 'neutral'
  size?: 'sm' | 'md'
  variant?: 'filled' | 'outlined'

Used for: role badges, status indicators, type badges
```

### `<EmptyState>`

Shown when a section has no data.

```
Props:
  icon: string
  title: string
  message: string

Used in: entity relationships tab (no relationships), state machine tab (no state machine)
```

### `<InlineCode>`

Inline code formatting for technical values.

```
Props:
  children: string

Rendering:
  mono-sm font, bg-code background, 2px 6px padding, radius-sm
  Used for: API paths, regex patterns, field expressions
```
