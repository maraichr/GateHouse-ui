# Spec Reviewer — Visual Design

The reviewer has its own design language, separate from the generated app's theme. It should feel like a **documentation site** (think Notion, Linear's changelog, Stripe's API docs) — clean, scannable, information-dense but not overwhelming.

## Design Principles

1. **Scannable over pretty.** Stakeholders are reviewing, not admiring. Optimize for information density and quick scanning, not visual delight.
2. **Structure is visible.** The hierarchy of spec → entity → field → constraint should be expressed through indentation, grouping, and typography — never just color alone.
3. **Completeness is the hero metric.** The coverage system is the most important visual element. It must be impossible to miss gaps.
4. **Neutral chrome.** The reviewer's own UI uses neutral grays. Color is reserved for semantic meaning (status indicators, coverage, annotations, diff highlights).

## Color System

The reviewer uses a minimal palette — not the app's theme colors:

### Chrome Colors (reviewer UI itself)

| Token | Value | Usage |
|-------|-------|-------|
| `bg-page` | `#FAFAFA` | Page background |
| `bg-card` | `#FFFFFF` | Cards, panels |
| `bg-subtle` | `#F5F5F5` | Hover states, nested areas |
| `bg-code` | `#F0F0F0` | Inline code, technical values |
| `border-default` | `#E5E5E5` | Card borders, dividers |
| `border-focus` | `#3B82F6` | Focus rings |
| `text-primary` | `#171717` | Headings, primary text |
| `text-secondary` | `#525252` | Descriptions, metadata |
| `text-tertiary` | `#A3A3A3` | Placeholders, disabled |
| `text-link` | `#2563EB` | Clickable links, navigation |

### Semantic Colors (for spec content)

Used to represent the app's semantic colors in a standardized way:

| Semantic | Swatch | Hex | Usage in reviewer |
|----------|--------|-----|-------------------|
| `success` | 🟢 | `#16A34A` | Approved, verified, complete, enabled |
| `warning` | 🟡 | `#CA8A04` | Pending, partial, expiring |
| `danger` | 🔴 | `#DC2626` | Suspended, rejected, missing, blocking |
| `info` | 🔵 | `#2563EB` | Assigned, in progress, informational |
| `neutral` | ⚫ | `#737373` | Terminated, archived, disabled |

These are used for status badges, enum value swatches, and coverage indicators. They do **not** come from the reviewed spec's theme — they are the reviewer's own standardized palette to ensure consistency across different specs being reviewed.

### Coverage Colors

| Coverage | Color | Bar | Badge |
|----------|-------|-----|-------|
| 100% | `#16A34A` green | Solid green | ✓ green circle |
| 70-99% | `#CA8A04` amber | Amber remainder | ▲ amber triangle |
| < 70% | `#DC2626` red | Red remainder | ✗ red X |

### Diff Colors

| Change | Background | Text | Left border |
|--------|-----------|------|-------------|
| Added | `#F0FDF4` | `#16A34A` | 3px green |
| Modified | `#FFFBEB` | `#CA8A04` | 3px amber |
| Removed | `#FEF2F2` | `#DC2626` | 3px red |

## Typography

The reviewer uses a single font family — a clean monospace for technical values and a readable sans-serif for everything else.

| Token | Font | Size | Weight | Usage |
|-------|------|------|--------|-------|
| `heading-xl` | System sans | 24px | 700 | Page title (spec name) |
| `heading-lg` | System sans | 20px | 600 | Section headings (entity name) |
| `heading-md` | System sans | 16px | 600 | Card titles, tab labels |
| `heading-sm` | System sans | 14px | 600 | Field names, transition names |
| `body` | System sans | 14px | 400 | Descriptions, annotations |
| `body-sm` | System sans | 13px | 400 | Metadata, constraints, help text |
| `caption` | System sans | 12px | 400 | Timestamps, secondary labels |
| `mono` | JetBrains Mono / Fira Code | 13px | 400 | API paths, field values, patterns, expressions |
| `mono-sm` | JetBrains Mono / Fira Code | 12px | 400 | Inline code, enum values |

**Font loading**: Use system sans-serif as base (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`). Load monospace from CDN for technical values only.

## Type Badges

Every field type is shown as a small colored badge. The color helps stakeholders scan field lists quickly.

| Type | Badge color | Example |
|------|------------|---------|
| `string` | Gray bg | `string` |
| `enum` | Purple bg | `enum` |
| `date` / `datetime` | Blue bg | `date` |
| `integer` / `decimal` | Teal bg | `decimal` |
| `boolean` | Indigo bg | `boolean` |
| `reference` | Amber bg | `→ Trade` |
| `currency` | Green bg | `currency` |
| `email` / `phone` / `url` | Gray bg | `email` |
| `richtext` | Pink bg | `richtext` |
| `image` / `file` | Orange bg | `image` |
| `address` | Gray bg | `address` |
| `array` | Badge of inner type + `[]` | `→ Trade[]` |
| `inline_table` | Cyan bg | `table` |
| `uuid` | Gray bg, dimmed | `uuid` |

Badge style: `font: mono-sm`, `padding: 2px 6px`, `border-radius: 4px`, `opacity: 0.9`.

## Coverage Indicators

The coverage system has three visual expressions:

### 1. Coverage Bar

Horizontal bar showing percentage. Used on entity cards and overview page.

```
████████████████████████████░░░  92%
```

- Height: 6px
- Border radius: 3px (pill)
- Background: `#E5E5E5` (unfilled portion)
- Fill: green (≥90%), amber (70-89%), red (<70%)
- Percentage label right-aligned, `mono-sm` font

### 2. Coverage Badge

Small icon badge. Used on entity cards and in headers.

| Score | Icon | Color | Label |
|-------|------|-------|-------|
| 100% | ✓ checkmark in circle | Green | "Complete" |
| 90-99% | ✓ checkmark | Green | Score percentage |
| 70-89% | ▲ triangle | Amber | Score percentage |
| < 70% | ✗ X in circle | Red | Score percentage |

Badge style: 20×20px icon, with percentage text to the right in `body-sm`.

### 3. Coverage Breakdown (expandable)

Shown when clicking a coverage score. Lists every sub-component and its status.

```
Coverage: 82% ▲

  Fields           ✓  12/12 configured
  State machine    ✓  all transitions defined
  List view        ✓  columns, filters, search, empty
  Detail view      ▲  missing: header stats
  Create form      ✓  all fields present
  Edit view        ✗  not configured
  Permissions      ✓  all transitions have permissions
```

Each line shows: item name, status icon, and either "complete" or what's missing.

## Show-In Matrix

The four-column visibility matrix for fields is a critical UI element. Design:

```
         LIST  DET  CRE  EDT
         ┌────┬────┬────┬────┐
field_a  │ ✓  │ ✓  │ ✓  │ ✓  │
field_b  │ ·  │ ✓  │ ✓  │ 🔒 │
field_c  │ ✓  │ ✓  │ ⚡ │ ⚡ │
         └────┴────┴────┴────┘
```

| Symbol | Color | Size | Meaning |
|--------|-------|------|---------|
| ✓ | `#16A34A` green | 14px | Enabled / shown |
| · | `#D4D4D4` light gray | 14px | Disabled / hidden |
| 🔒 | `#A3A3A3` gray | 12px | Immutable (can't edit) |
| ⚡ | `#CA8A04` amber | 12px | Computed / generated (auto-filled) |
| 🔑 | `#2563EB` blue | 12px | Permission-gated (hover for roles) |

Column headers: `caption` font, uppercase, `text-tertiary` color.
Cell size: 32×28px, centered.

## State Machine Diagram Styling

The state machine diagram is the highest-impact visual. It must be immediately understandable by non-technical stakeholders.

### State Nodes

- Shape: Rounded rectangle, 120×48px
- Border: 2px solid
- Border color: The semantic color for that state (from enum value color)
- Background: The semantic color at 10% opacity
- Text: `heading-sm`, centered, uppercase
- Initial state: Small filled circle (●) with arrow pointing to the node
- Final state: Double border (4px outer, 2px inner)

### Transition Arrows

- Line: 2px, `#737373` gray
- Arrow head: Filled triangle
- Label: `body-sm`, positioned above/beside the line
- On hover: Line thickens to 3px, color changes to `text-link` blue, label becomes bold

### Selected Transition

When a transition arrow is clicked, it highlights in blue and the detail panel opens below the diagram. The detail panel has:

- Left border: 3px in the transition's semantic color
- Background: `bg-card` white
- Contents: From/To states, guards (as sentences), permissions (as role badges), confirmation preview, form fields

## Annotation Styling

### Indicator (on element)

A small circular badge overlaid on the top-right corner of the annotated element:

| State | Background | Icon | Border |
|-------|-----------|------|--------|
| Has open annotations | `#2563EB` blue | 💬 count | none |
| Has blocking annotations | `#DC2626` red | 🔴 count | none |
| All resolved | `#16A34A` green | ✓ | none |

Size: 20×20px circle. Count text: `caption` font, white.

### Thread Panel

- Width: 360px popover or right-side panel
- Header: Element path (e.g., "Subcontractor → insurance_expiry_date")
- Each comment: Avatar (initials circle) + name + timestamp + body
- Reply indented with thin left border
- Resolved comments have reduced opacity (0.6) with a ✓ Resolved label

## Card Design

Cards are the primary container for entities, fields (expanded), and widgets.

| Property | Value |
|----------|-------|
| Background | `bg-card` white |
| Border | 1px solid `border-default` |
| Border radius | 8px |
| Shadow | none (flat design — borders, not shadows) |
| Padding | 16px (compact cards), 20px (detail cards) |
| Hover | Border color darkens to `#D4D4D4` |
| Click target | Entire card (when navigable) |

### Entity Card (Explorer view)

- Width: min 280px, responsive grid (auto-fill)
- Header: Entity icon + name + coverage badge
- Body: Description (2 lines max, truncated), stats row, status values
- Footer: Coverage bar

### Field Card (Expanded detail)

- Full width within detail view
- Alternating row background: white / `bg-subtle`
- Expanded state has a light blue left border (3px, `#BFDBFE`) to indicate selection

## Responsive Behavior

The reviewer is primarily a desktop tool, but should be usable on tablets.

| Breakpoint | Layout |
|------------|--------|
| ≥ 1280px | Full layout, entity cards 3-4 per row |
| ≥ 1024px | Condensed, entity cards 2-3 per row |
| ≥ 768px | Stacked layout, entity cards 1-2 per row, permission matrix scrollable |
| < 768px | Single column, simplified views, state machine diagram scrollable |

## Animation

Minimal — this is a review tool, not a consumer app.

- **Page transitions**: None (instant navigation)
- **Card hover**: 100ms border color transition
- **Expand/collapse**: 150ms height transition with `ease-out`
- **Coverage bar**: 300ms fill animation on initial load only
- **Annotations**: 150ms fade-in for popover
- **Search results**: Instant, no animation

## Dark Mode

Optional. If implemented:

| Token | Light | Dark |
|-------|-------|------|
| `bg-page` | `#FAFAFA` | `#0A0A0A` |
| `bg-card` | `#FFFFFF` | `#171717` |
| `bg-subtle` | `#F5F5F5` | `#262626` |
| `bg-code` | `#F0F0F0` | `#1E1E1E` |
| `border-default` | `#E5E5E5` | `#333333` |
| `text-primary` | `#171717` | `#FAFAFA` |
| `text-secondary` | `#525252` | `#A3A3A3` |

Semantic colors remain the same in both modes (green, amber, red maintain their meaning).
