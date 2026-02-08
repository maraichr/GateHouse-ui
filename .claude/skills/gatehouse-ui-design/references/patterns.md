# GateHouse Shared UI Patterns

Layout, interaction, and accessibility patterns that both React and Flutter renderers must implement equivalently. These are framework-agnostic behavioral specifications.

## Table of Contents

1. [Page Layout Patterns](#page-layout-patterns)
2. [Entity List Behavior](#entity-list-behavior)
3. [Entity Detail Behavior](#entity-detail-behavior)
4. [Form Behavior](#form-behavior)
5. [State Transition UX](#state-transition-ux)
6. [Dashboard Composition](#dashboard-composition)
7. [Empty States](#empty-states)
8. [Loading States](#loading-states)
9. [Error States](#error-states)
10. [Notification Behavior](#notification-behavior)
11. [Accessibility Requirements](#accessibility-requirements)

## Page Layout Patterns

### Sidebar Layout (default)

```
┌──────────────────────────────────────────────────┐
│ Header: breadcrumbs │ global search │ user menu  │
├────────────┬─────────────────────────────────────┤
│            │                                     │
│  Sidebar   │  Page Content Area                  │
│  260px     │  (padded by space-6 to space-8)     │
│            │                                     │
│  Nav items │                                     │
│  with      │                                     │
│  icons     │                                     │
│            │                                     │
│  ───────── │                                     │
│  [user]    │                                     │
│  [settings]│                                     │
└────────────┴─────────────────────────────────────┘
```

- Sidebar collapses to 64px icon-only on user action or below tablet breakpoint
- On mobile: sidebar becomes an overlay drawer, triggered by hamburger icon
- Content area scrolls independently of sidebar
- Active nav item highlighted with `primary-50` background + `primary-600` text + left border accent

### Entity List Page

```
┌──────────────────────────────────────────────────┐
│ Page Header: "Subcontractors"    [+ Add] [Export] │
├──────────────────────────────────────────────────┤
│ ┌──────────┐ ┌─────────────────────────────────┐ │
│ │ Filters  │ │ [Search bar                    ] │ │
│ │          │ │                                   │ │
│ │ Status   │ │ ┌─────┬──────┬──────┬──────┐   │ │
│ │ ☑ Pending│ │ │Name ▼│Status│Rating│Date  │   │ │
│ │ ☑ Active │ │ ├─────┼──────┼──────┼──────┤   │ │
│ │          │ │ │Acme  │ ● OK │ ★★★★ │Jan 5 │   │ │
│ │ Trades   │ │ │Beta  │ ● Pen│ ★★★  │Jan 8 │   │ │
│ │ [multi]  │ │ │...   │      │      │      │   │ │
│ │          │ │ └─────┴──────┴──────┴──────┘   │ │
│ │ Date     │ │                                   │ │
│ │ [range]  │ │ Showing 1-25 of 142    < 1 2 3 > │ │
│ └──────────┘ └─────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

- Filter panel position driven by YAML `filters.layout` (sidebar | toolbar | drawer)
- Filter sidebar is 240-260px, does not scroll with the table
- Toolbar filters render inline above the table as a horizontal row of controls
- Drawer filters open from the right edge as an overlay panel

### Entity Detail Page (Tabbed)

```
┌──────────────────────────────────────────────────┐
│ ← Back to Subcontractors                         │
├──────────────────────────────────────────────────┤
│ [avatar]  Acme Corp                              │
│           Tax ID: 12-***4567  ● Approved         │
│           ★★★★☆ 4.2  │  12 Active WOs  │  $1.2M │
│           [Suspend] [Terminate]                   │
├──────────────────────────────────────────────────┤
│ [Overview] [Documents] [Work Orders] [Activity]  │
├──────────────────────────────────────────────────┤
│                                                   │
│  Tab content area                                │
│  (scrollable, independent of header)             │
│                                                   │
└──────────────────────────────────────────────────┘
```

- Header is sticky (scrolls away only after a threshold)
- Action buttons derive from state machine — only valid transitions for current state shown
- Stats in header fetched from a dedicated stats endpoint
- Tab selection persisted in URL query param (`?tab=documents`)

## Entity List Behavior

### Column Interactions

- Sortable columns show a sort indicator (↑↓). Click toggles asc/desc/none.
- Only one sort column active at a time (server-side sorting).
- Column widths: `flex` columns take remaining space. Fixed widths are respected.
- Text overflow: truncate with ellipsis. Full value in tooltip on hover.
- `link_to: detail` columns render as clickable text links (`primary-600`, underline on hover).

### Row Selection (when bulk actions enabled)

- Checkbox column appears as first column
- "Select all" checkbox in header: selects visible page only
- Selection count badge appears in bulk action bar
- Bulk action bar is sticky at bottom of viewport

### Pagination

- Cursor-based: "Load more" or infinite scroll. No page numbers.
- Offset-based: Page numbers with prev/next. Show "Showing X-Y of Z".
- Always show items-per-page selector: 10 | 25 | 50 | 100.
- Remember page size preference in local storage (React) or shared prefs (Flutter).

### Search

- Debounced input (300ms default from YAML)
- Minimum character threshold (default 2)
- Clear button appears when text is present
- Search icon as leading adornment
- Results update inline in the table — no separate search results page

### Filter Behavior

- Filter changes trigger immediate re-fetch (no "Apply" button)
- Active filter count shown as badge on filter toggle (for drawer/toolbar modes)
- "Clear all" button when any filter is active
- `show_counts: true` on checkbox groups shows count of matching records per option
- `persistent: true` — remember filter state across navigation (URL params or local state)
- Date range presets (from YAML) appear as quick-select chips above the custom range picker

## Entity Detail Behavior

### Header Stats

- Stats are fetched from a separate API call (async, independent of main entity fetch)
- Show skeleton/shimmer while loading
- Stats that require specific permissions are hidden entirely (not shown as "—")

### Tab Navigation

- Tabs lazy-load content on first visit
- Tab content is cached after first load (not refetched on tab switch)
- Relationship tabs show a count badge: "Documents (7)"
- Deep-linking: URL includes tab ID as query param

### Relationship Tables

- Compact tables (fewer columns than the full entity list)
- "View all" link navigates to the full entity list with a pre-set filter for the parent
- `inline_create: true` — shows an "Add" button that opens a create form in a modal/drawer
- Default sort from YAML `relationships[].default_sort`

## Form Behavior

### Validation

- Validate on blur (field loses focus), not on every keystroke
- Show validation errors below the field, in `danger-600`
- Required field indicator: red asterisk after label
- Server-side validation errors: map `api.error_format.validation_field` to individual fields
- Disable submit button while form is submitting

### Stepped Form (Wizard)

- Progress indicator at top showing all steps + current position
- "Next" validates current step fields before advancing
- "Back" preserves entered data (no re-validation on back)
- Final "Review" step shows all entered data in read-only display format
- User can click any completed step to jump back and edit

### Dirty Form Protection

When `behaviors.dirty_form.enabled: true`:
- Track form dirty state (any field changed from initial value)
- Intercept navigation away from page when dirty
- Show confirmation dialog with YAML `behaviors.dirty_form.message`
- Submitting the form clears dirty state

### Field Layout

- `single_column`: Fields stack vertically, full width
- `two_column`: Fields in 2-column grid. Each field occupies one cell. Long fields (richtext, address, inline_table) span both columns.
- `sections`: Grouped by section title with a horizontal rule between sections
- Field order: exactly as specified in YAML `fields` array or `sections[].fields` array

## State Transition UX

### Button Placement

- Transition buttons appear in detail header, right-aligned
- On mobile: transition buttons move into an overflow menu (⋮)
- Button color from YAML `transition.color` maps to semantic palette

### Disabled Transitions

- If any guard fails: button is disabled (50% opacity)
- Tooltip on disabled button shows the first failing guard's `message`
- If guard has `api_check`: fetch guard status asynchronously, show spinner while checking

### Confirmation Dialog

- Modal dialog centered on screen with overlay backdrop
- Title and message from YAML with `{{template_expression}}` interpolation
- `style` determines header color: success=green banner, danger=red banner, warning=amber
- `require_comment: true` adds a required textarea
- `type_to_confirm: "TERMINATE"` adds an input that must exactly match the string. Submit button remains disabled until matched.
- Cancel and Confirm buttons in footer. Confirm button uses the transition's semantic color.

### Transition Form

- If transition has `form.fields`: render form fields inside the confirmation dialog, between message and buttons
- Validate form fields before allowing confirm

## Dashboard Composition

### Widget Grid Layout

- Stat cards: responsive grid. 4 columns on desktop, 2 on tablet, 1 on mobile.
- Charts: 2 columns on desktop, 1 on tablet/mobile. Equal height per row.
- Entity tables: full width, stacked vertically.
- Widget order: exactly as specified in YAML `pages[].widgets` array.

### Stat Cards

- Each card: icon (24px, semantic color) | value (text-2xl, font-bold) | label (text-sm, neutral-500)
- `link` prop: entire card is clickable, navigates to the linked page
- Value from `source: "api:..."` — fetch async, show "—" skeleton while loading
- Color from YAML maps to the icon and value text color

### Charts

- All charts have a title bar with the chart title in `text-lg font-semibold`
- Height from YAML `height` prop (default 300px)
- Responsive: chart reflows within its container width
- Tooltip on hover showing exact values
- Legend below chart for multi-series data
- `color_map` from YAML maps data values to semantic palette colors

## Empty States

Every entity list and relationship table must handle the zero-results case:

- Centered vertically in the content area
- Icon (48px, `neutral-400`) from YAML `empty.icon`
- Title (text-xl, font-semibold, neutral-900) from YAML `empty.title`
- Message (text-sm, neutral-500) from YAML `empty.message`
- Optional CTA button (primary variant) from YAML `empty.action`
- If filters are active and results are empty: show different message — "No results match your filters" with a "Clear filters" link

## Loading States

- **Initial page load**: Full-page skeleton matching the layout shape (skeleton table rows, skeleton cards)
- **List re-fetch** (filter/sort change): Keep previous data visible with 50% opacity overlay + spinner
- **Detail page**: Skeleton header + skeleton tabs. Each tab shows skeleton on first load.
- **Form submission**: Submit button shows inline spinner, all fields become read-only
- **Transition execution**: Transition button shows inline spinner, dialog buttons disabled
- **Dashboard stats**: Each stat card shows "—" with shimmer animation independently

Both renderers must implement skeleton/shimmer states — never show blank white space during loading.

## Error States

- **API fetch error**: Inline error message with retry button. Never navigate away.
- **Form submission error**: Toast notification with error message. Keep form data intact.
- **Transition error**: Toast notification. Dialog stays open. User can retry or cancel.
- **Network offline**: Banner at top of page — "You're offline. Changes will sync when reconnected." (only if `behaviors.offline.enabled: true`)
- **404**: "Not found" page with link back to entity list
- **403**: "You don't have permission to view this page" with link to dashboard

## Notification Behavior

Toast notifications from `behaviors.notifications`:

- Position from YAML (`top-right` default)
- Duration from YAML (`5000ms` default)
- Auto-dismiss with progress bar
- Manual dismiss via ✕ button
- Stack vertically (newest on top), max 3 visible at once
- Severity levels: success (green left border), error (red), warning (amber), info (blue)
- Message templates from YAML with `{{entity.display_name}}` interpolation

## Accessibility Requirements

### Keyboard Navigation

- All interactive elements reachable via Tab
- Enter/Space activates buttons and links
- Escape closes modals, drawers, dropdowns
- Arrow keys navigate within menus, tabs, table rows
- Focus trap inside modals (Tab doesn't escape to page behind)
- Visible focus ring: 2px `primary-500` outline with 2px offset

### Screen Reader Support

- Page title updates on navigation (`<title>` / accessibility label)
- Live regions announce: toast notifications, form validation errors, loading completion
- Data tables: proper `<th>` scope attributes (React) / semantics (Flutter)
- Form fields: associated `<label>` (React) / `InputDecoration.labelText` (Flutter)
- Status badges: `aria-label` includes the status text, not just the visual color
- Sort indicators: `aria-sort` attribute on table headers
- Icons: decorative icons have `aria-hidden="true"` / `excludeFromSemantics: true`. Functional icons have labels.

### Color Contrast

- `AA` (default): 4.5:1 for normal text, 3:1 for large text
- `AAA` (if configured): 7:1 for normal text, 4.5:1 for large text
- Never convey information through color alone — always pair with icon, text, or pattern
- Status badges: include icon + text label, not just colored dot

### Motion

- `respect_preference` (default): Check `prefers-reduced-motion` (React) / `MediaQuery.disableAnimations` (Flutter). If reduced motion preferred, disable all non-essential animations.
- Essential animations (loading spinners, progress bars) still animate but use simple opacity fades instead of transforms.
