# Spec Reviewer — Experience Design

Page-by-page UX specification for the GateHouse Spec Reviewer. All wireframes use ASCII; implementation should follow [visual-design.md](visual-design.md).

## Table of Contents

1. [Information Architecture](#information-architecture)
2. [Spec Overview (Home)](#spec-overview)
3. [Entity Explorer](#entity-explorer)
4. [Entity Detail](#entity-detail)
5. [State Machine View](#state-machine-view)
6. [Permission Matrix](#permission-matrix)
7. [Relationship Map](#relationship-map)
8. [Navigation Blueprint](#navigation-blueprint)
9. [Page & Dashboard Inspector](#page--dashboard-inspector)
10. [Diff View](#diff-view)
11. [Annotation System](#annotation-system)
12. [Search](#search)

---

## Information Architecture

The reviewer has a flat, document-like navigation — not a deeply nested app. Business stakeholders should be able to reach any piece of information in 2 clicks maximum.

```
Spec Overview (home)
├── Entity Explorer
│   └── Entity Detail (per entity)
│       ├── Fields tab
│       ├── State Machine tab
│       ├── Views tab (list / detail / forms)
│       └── Relationships tab
├── Permission Matrix
├── Relationship Map
├── Navigation Blueprint
├── Pages & Dashboards
│   └── Page Inspector (per page)
└── Diff View (optional, when two specs loaded)
```

### Top Navigation

```
┌──────────────────────────────────────────────────────────────────┐
│ ◈ GateHouse Spec Reviewer          [Search...]     [v1.2.0 ▼]  │
├──────────────────────────────────────────────────────────────────┤
│  Overview  │  Entities  │  Permissions  │  Relationships  │     │
│            │            │               │                 │     │
│  Navigation│  Pages     │  Diff         │                 │     │
└──────────────────────────────────────────────────────────────────┘
```

- Horizontal tab bar, not sidebar (this is a review tool, not a working app)
- Version selector dropdown when multiple spec versions are loaded
- Global search searches across entity names, field names, enum values, page titles

---

## Spec Overview

The landing page. Gives an at-a-glance health check of the entire specification.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Acme Contractor Portal                           v1.0.0        │
│  Subcontractor management and compliance tracking                │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐│
│  │ 4 Entities │  │ 47 Fields  │  │ 3 State    │  │ 5 Pages    ││
│  │ ●●●○       │  │ ●●●●       │  │ Machines   │  │ ●●●●●      ││
│  │ 3 complete │  │ 44 config'd│  │ ●●●        │  │ all config ││
│  │ 1 partial  │  │ 3 partial  │  │ all valid  │  │             ││
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘│
│                                                                  │
│  Overall Coverage                                                │
│  ████████████████████████████░░░  92%                           │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Entities                                    Coverage            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ■ Subcontractor    12 fields  4 states  3 relations      │   │
│  │   ████████████████████████████████████  100%  ✓          │   │
│  │                                                          │   │
│  │ ■ Document          8 fields  4 states  1 relation       │   │
│  │   ██████████████████████████████████░░   94%  ✓          │   │
│  │                                                          │   │
│  │ ■ WorkOrder        10 fields  5 states  1 relation       │   │
│  │   ████████████████████████████░░░░░░░   82%  ▲          │   │
│  │   ⚠ Missing: edit view, detail header stats              │   │
│  │                                                          │   │
│  │ ■ Trade             3 fields  0 states  0 relations      │   │
│  │   ████████████████████████████████████  100%  ✓          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Attention Required                                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ⚠ WorkOrder: No edit view configured                     │   │
│  │ ⚠ WorkOrder: Detail header missing stats                 │   │
│  │ ⚠ Document: Field 'expiry_date' has no display_rules     │   │
│  │ ○ 2 annotations pending review                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Auth & Roles                                                    │
│  4 roles defined: Admin, Compliance Officer, Project Manager,    │
│  Viewer                                                          │
│  [View Permission Matrix →]                                      │
│                                                                  │
│  Theme                                                           │
│  Primary: ■ #1E40AF  Radius: md  Density: comfortable           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Key Interactions

- **Stat cards** link to their respective pages (click "4 Entities" → Entity Explorer)
- **Entity rows** are clickable → Entity Detail
- **Attention items** are clickable → jump directly to the element with the gap
- **Coverage bar** color: green ≥ 90%, amber 70-89%, red < 70%
- **Overall coverage** is computed from all entity/page/permission coverage scores

### Coverage Scoring

Each element contributes to the overall score. The formula is transparent — clicking any score shows the breakdown:

| Element | Weight | Criteria for 100% |
|---------|--------|--------------------|
| Entity fields | 30% | Every field has: display_name, type, show_in configured |
| State machines | 20% | All transitions defined, all guards documented, permissions set |
| Views | 25% | List (columns, filters, search, empty state), Detail (layout, tabs/sections), Create form, Edit form |
| Permissions | 15% | Every transition has permissions, every nav item has permissions or is explicitly public |
| Pages & navigation | 10% | Dashboard has widgets, all nav items link to valid targets |

---

## Entity Explorer

Grid of entity cards. The primary browsing view.

```
┌──────────────────────────────────────────────────────────────────┐
│  Entities (4)                          [Filter ▼]  [Search...]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐  │
│  │ ⬡ Subcontractor    ✓   │  │ ⬡ Document            ✓    │  │
│  │                         │  │                             │  │
│  │ "External contractors   │  │ "Uploaded compliance        │  │
│  │  who perform work"      │  │  documents"                 │  │
│  │                         │  │                             │  │
│  │ Fields      12          │  │ Fields       8              │  │
│  │ States       4          │  │ States       4              │  │
│  │ Relations    3          │  │ Relations    1              │  │
│  │ Endpoints    7          │  │ Endpoints    5              │  │
│  │                         │  │                             │  │
│  │ ■ pending               │  │ ■ uploaded                  │  │
│  │ ■ approved              │  │ ■ under_review              │  │
│  │ ■ suspended             │  │ ■ verified                  │  │
│  │ ■ terminated            │  │ ■ rejected                  │  │
│  │                         │  │                             │  │
│  │ ████████████ 100%       │  │ ██████████░░  94%           │  │
│  └─────────────────────────┘  └─────────────────────────────┘  │
│                                                                  │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐  │
│  │ ⬡ WorkOrder        ▲   │  │ ⬡ Trade              ✓    │  │
│  │                         │  │                             │  │
│  │ "Assigned work items"   │  │ "Trade specialties          │  │
│  │                         │  │  lookup"                    │  │
│  │ Fields      10          │  │ Fields       3              │  │
│  │ States       5          │  │ States       0              │  │
│  │ Relations    1          │  │ Relations    0              │  │
│  │ Endpoints    5          │  │ Endpoints    3              │  │
│  │                         │  │                             │  │
│  │ ■ draft                 │  │ (no state machine)          │  │
│  │ ■ assigned              │  │                             │  │
│  │ ■ in_progress           │  │                             │  │
│  │ ■ completed             │  │                             │  │
│  │ ■ cancelled             │  │                             │  │
│  │                         │  │                             │  │
│  │ ████████░░░░  82%       │  │ ████████████ 100%           │  │
│  └─────────────────────────┘  └─────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Card Design

- Icon from the entity's YAML `icon` field
- Coverage badge (✓ green, ▲ amber, ✗ red) in top-right corner
- Description from entity's YAML `description`
- Status values shown as colored dots matching their semantic colors
- Entire card is clickable → Entity Detail

### Filters

- Coverage status: All / Complete / Needs attention
- Has state machine: Yes / No
- Has relationships: Yes / No

---

## Entity Detail

The deepest view. Tabbed layout showing everything about one entity.

### Fields Tab

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Entities / Subcontractor                         ✓ 100%     │
│  "External contractors who perform work"                         │
│  Label: company_name  │  Status: status  │  Icon: hard-hat      │
├──────────────────────────────────────────────────────────────────┤
│  [Fields] [State Machine] [Views] [Relationships]               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Fields (12)                           [Show all ▼] [Search]    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ FIELD           TYPE        REQUIRED  LIST DET CRE EDT  │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │ company_name    string      ●         ✓   ✓   ✓   ✓    │   │
│  │ 2-200 chars │ searchable │ sortable                      │   │
│  │                                                          │   │
│  │ tax_id          string      ●         ·   ✓   ✓   ·    │   │
│  │ XX-XXXXXXX │ sensitive │ immutable                       │   │
│  │                                                          │   │
│  │ status          enum        ●         ✓   ✓   ·   ·    │   │
│  │ ■ pending  ■ approved  ■ suspended  ■ terminated        │   │
│  │ ↳ controlled by state machine                            │   │
│  │                                                          │   │
│  │ email           email       ●         ·   ✓   ✓   ✓    │   │
│  │                                                          │   │
│  │ phone           phone       ·         ·   ✓   ✓   ✓    │   │
│  │ format: national                                         │   │
│  │                                                          │   │
│  │ address         address     ●         ·   ✓   ✓   ✓    │   │
│  │ components: street1, street2, city, state, zip, country  │   │
│  │                                                          │   │
│  │ insurance_      date        ·         ✓   ✓   ✓   ✓    │   │
│  │ expiry_date                                              │   │
│  │ future only │ display rules: <30d danger, <90d warning   │   │
│  │                                                          │   │
│  │ trade_codes     reference[] ●         ✓   ✓   ✓   ✓    │   │
│  │ → Trade │ min 1 │ multi_select                           │   │
│  │                                                          │   │
│  │ rating          decimal     ·         ✓   ✓   ·   ·    │   │
│  │ 0-5 │ computed │ display: star_rating                    │   │
│  │                                                          │   │
│  │ annual_revenue  currency    ·         ·   ✓   ·   ✓    │   │
│  │ USD │ view: admin,compliance │ edit: admin                │   │
│  │                                                          │   │
│  │ notes           richtext    ·         ·   ✓   ·   ✓    │   │
│  │ max 5000 │ toolbar: bold, italic, lists, link            │   │
│  │                                                          │   │
│  │ logo            image       ·         ·   ✓   ✓   ✓    │   │
│  │ png,jpg,svg │ max 5MB │ 1:1 aspect │ display: avatar     │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Field Row Design

Each field row is an expandable card with two levels of detail:

**Collapsed (default):** Name, type badge, required indicator, show_in dots (✓/·), and a one-line summary of key constraints.

**Expanded (click to expand):** Full detail panel:

```
┌──────────────────────────────────────────────────────────────────┐
│ ▼ insurance_expiry_date                                          │
│                                                                  │
│   Type             date                                          │
│   Display Name     "Insurance Expiry"                            │
│   Required         No                                            │
│   Constraint       Future dates only                             │
│   Sortable         Yes                                           │
│   Filterable       Yes                                           │
│                                                                  │
│   Visibility       List ✓  Detail ✓  Create ✓  Edit ✓          │
│                                                                  │
│   Display Rules                                                  │
│   ┌────────────────────────────────────────────────────────┐    │
│   │  IF value < today + 30 days  →  🔴 danger             │    │
│   │     tooltip: "Insurance expiring within 30 days"       │    │
│   │  IF value < today + 90 days  →  🟡 warning            │    │
│   │     tooltip: "Insurance expiring within 90 days"       │    │
│   │  IF value ≥ today + 90 days  →  🟢 success            │    │
│   └────────────────────────────────────────────────────────┘    │
│                                                                  │
│   Annotations (1)                                                │
│   💬 Sarah (PM): "Should we also warn at 60 days?"  [Reply]     │
│                                                                  │
│   [+ Add annotation]                                             │
└──────────────────────────────────────────────────────────────────┘
```

### Show-In Columns

The four columns (List, Detail, Create, Edit) use a visual shorthand:

| Symbol | Meaning |
|--------|---------|
| ✓ (green) | Enabled |
| · (gray) | Disabled |
| 🔒 (lock) | Immutable (shown in edit column) |
| ⚡ (bolt) | Computed / generated (shown in create/edit) |
| 🔑 (key) | Permission-restricted (hover for roles) |

---

## State Machine View

Interactive diagram of the entity's state machine. This is the most important view for business stakeholders validating workflows.

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Entities / Subcontractor                                     │
├──────────────────────────────────────────────────────────────────┤
│  [Fields] [State Machine] [Views] [Relationships]               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│       ┌──────────┐                                              │
│       │ PENDING  │─────approve────▶┌──────────┐                │
│       │ (initial)│                  │ APPROVED │                │
│       └────┬─────┘◀──reinstate─────└─────┬────┘                │
│            │                              │                      │
│            │                          suspend                    │
│            │                              │                      │
│            │                        ┌─────▼────┐                │
│            │                        │SUSPENDED │                │
│            │                        └─────┬────┘                │
│            │                              │                      │
│            └──────────┬───────────────────┘                      │
│                       │                                          │
│                   terminate                                      │
│                       │                                          │
│                 ┌─────▼──────┐                                  │
│                 │ TERMINATED │                                  │
│                 │  (final)   │                                  │
│                 └────────────┘                                  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Transition Detail (click a transition arrow above)              │
│                                                                  │
│  ┌ approve ──────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  From         pending, suspended                           │  │
│  │  To           approved                                     │  │
│  │                                                            │  │
│  │  Guards       ┌──────────────────────────────────────────┐│  │
│  │               │ ✓ Insurance must not be expired          ││  │
│  │               │   checks: insurance_expiry_date > today  ││  │
│  │               │                                          ││  │
│  │               │ ✓ W-9 and Insurance Certificate must     ││  │
│  │               │   be verified                            ││  │
│  │               │   checks: API /compliance-status         ││  │
│  │               └──────────────────────────────────────────┘│  │
│  │                                                            │  │
│  │  Permissions  admin, compliance_officer                    │  │
│  │                                                            │  │
│  │  Confirmation "Approve Subcontractor?"                     │  │
│  │               style: success                               │  │
│  │               comment: not required                        │  │
│  │                                                            │  │
│  │  Collects     approval_notes (text, optional)              │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Diagram Interactions

- **Hover a state node:** Highlights all transitions to/from that state
- **Click a state node:** Shows which fields are required/validated for that state
- **Click a transition arrow:** Opens the transition detail panel below the diagram
- **Color coding:** State nodes use the same semantic colors as the enum values in the YAML
- **Initial state** has a small entry arrow (●→). **Final states** (no outgoing transitions) have a double border.

### Transition Detail Panel

Shows human-readable information:
- Guards are rendered as plain English sentences, not code
- The API check path is shown but de-emphasized (gray, smaller text)
- Permissions listed as role badges
- Confirmation dialog is previewed as a small card mockup
- Any form fields collected during transition are listed with types

---

## Permission Matrix

Roles × Actions grid showing who can do what across the entire spec.

```
┌──────────────────────────────────────────────────────────────────┐
│  Permission Matrix                                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                          Admin  Compliance  PM    Viewer         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ SUBCONTRACTOR                                             │  │
│  │   Create                ✓       ✓         ·      ·       │  │
│  │   Edit                  ✓       ✓         ·      ·       │  │
│  │   Delete                ✓       ·         ·      ·       │  │
│  │   → Approve             ✓       ✓         ·      ·       │  │
│  │   → Suspend             ✓       ✓         ·      ·       │  │
│  │   → Terminate           ✓       ·         ·      ·       │  │
│  │   View revenue          ✓       ✓         ·      ·       │  │
│  │   Edit revenue          ✓       ·         ·      ·       │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ DOCUMENT                                                  │  │
│  │   Upload                ✓       ✓         ✓      ·       │  │
│  │   → Start Review        ✓       ✓         ·      ·       │  │
│  │   → Verify              ·       ✓         ·      ·       │  │
│  │   → Reject              ·       ✓         ·      ·       │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ WORK ORDER                                                │  │
│  │   Create                ✓       ·         ✓      ·       │  │
│  │   Edit                  ✓       ·         ✓      ·       │  │
│  │   Delete                ✓       ·         ·      ·       │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ NAVIGATION                                                │  │
│  │   Documents page        ✓       ✓         ·      ·       │  │
│  │   Reports page          ✓       ·         ✓      ·       │  │
│  │   Settings page         ✓       ·         ·      ·       │  │
│  │   Compliance section    ✓       ✓         ·      ·       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Legend: ✓ permitted  · not permitted  ◐ conditional            │
│                                                                  │
│  ⚠ Gaps detected:                                               │
│  WorkOrder transitions have no permissions defined               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Interactions

- **Click a ✓ or · cell:** Shows the source — which YAML property defines this permission
- **Click a role column header:** Highlights only that role's permissions (dims others)
- **Click an entity section header:** Jumps to that entity's detail page
- **Gaps section:** Lists any actions that have no permissions defined (this catches specs where permissions were forgotten, which is different from "everyone can do it")
- **Transition actions** (prefixed with →) are visually distinct from CRUD actions

---

## Relationship Map

Visual entity-relationship diagram.

```
┌──────────────────────────────────────────────────────────────────┐
│  Relationship Map                                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│          ┌───────────────┐                                      │
│          │ Subcontractor │                                      │
│          │               │                                      │
│          │ company_name  │                                      │
│          │ status        │                                      │
│          └───┬───┬───┬───┘                                      │
│              │   │   │                                          │
│         1:N  │   │   │  M:N                                     │
│              │   │   │                                          │
│    ┌─────────┘   │   └──────────┐                              │
│    │             1:N             │                              │
│    ▼              │              ▼                              │
│ ┌──────────┐     │        ┌──────────┐                         │
│ │ Document │     │        │  Trade   │                         │
│ │          │     │        │          │                         │
│ │ name     │     │        │ name     │                         │
│ │ type     │     │        │ category │                         │
│ │ status   │     │        └──────────┘                         │
│ └──────────┘     │                                             │
│                  ▼                                              │
│           ┌───────────┐                                        │
│           │ WorkOrder │                                        │
│           │           │                                        │
│           │ title     │                                        │
│           │ status    │                                        │
│           └───────────┘                                        │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  Relationships                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Subcontractor ──1:N──▶ Document                          │   │
│  │   FK: subcontractor_id  │  cascade delete  │  inline_create│  │
│  │                                                          │   │
│  │ Subcontractor ──1:N──▶ WorkOrder                         │   │
│  │   FK: subcontractor_id                                   │   │
│  │                                                          │   │
│  │ Subcontractor ──M:N──▶ Trade                             │   │
│  │   through: subcontractor_trade_assignments               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Interactions

- **Click an entity node:** Navigates to its Entity Detail
- **Click a relationship line:** Shows relationship config (FK, cascade, inline_create)
- **Hover an entity:** Highlights all its connections
- Diagram is rendered with an auto-layout algorithm (dagre or ELK), not manually positioned

---

## Navigation Blueprint

Shows the complete nav tree with what each item links to.

```
┌──────────────────────────────────────────────────────────────────┐
│  Navigation Blueprint                   Layout: sidebar          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ Navigation Items ──────────────────────────────────────────┐│
│  │                                                              ││
│  │  📊 Dashboard                                                ││
│  │     → page: dashboard                                        ││
│  │     → permissions: all                                       ││
│  │                                                              ││
│  │  ⬡ Subcontractors                                           ││
│  │     → entity: Subcontractor                                  ││
│  │     → path: /subcontractors                                  ││
│  │     → badge: count where status=pending (warning)            ││
│  │     → permissions: all                                       ││
│  │                                                              ││
│  │  📋 Work Orders                                              ││
│  │     → entity: WorkOrder                                      ││
│  │     → path: /work-orders                                     ││
│  │     → permissions: all                                       ││
│  │                                                              ││
│  │  📄 Documents                                                ││
│  │     → entity: Document                                       ││
│  │     → path: /documents                                       ││
│  │     → permissions: admin, compliance_officer                 ││
│  │                                                              ││
│  │  📊 Reports                                                  ││
│  │     → page: reports                                          ││
│  │     → permissions: admin, project_manager                    ││
│  │                                                              ││
│  │  ▼ Compliance                                                ││
│  │     → permissions: admin, compliance_officer                 ││
│  │     │                                                        ││
│  │     ├── Pending Reviews                                      ││
│  │     │   → page: pending_reviews                              ││
│  │     │   → badge: count from API                              ││
│  │     │                                                        ││
│  │     ├── Audit Log                                            ││
│  │     │   → entity: AuditEntry                                 ││
│  │     │   → ⚠ Entity "AuditEntry" not defined in spec         ││
│  │     │                                                        ││
│  │     └── Expiring Insurance                                   ││
│  │         → page: expiring_insurance                           ││
│  │                                                              ││
│  │  ⚙ Settings  [pinned: bottom]                               ││
│  │     → page: settings                                         ││
│  │     → permissions: admin                                     ││
│  │                                                              ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ⚠ Issues (1)                                                   │
│  Nav item "Audit Log" references entity "AuditEntry"             │
│  which is not defined in the spec.                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Key Feature

Broken references (nav items pointing to undefined entities or pages) are highlighted with ⚠ warnings. This catches configuration drift early.

---

## Page & Dashboard Inspector

Shows custom pages (dashboard, reports, settings) and their widget composition.

```
┌──────────────────────────────────────────────────────────────────┐
│  Pages & Dashboards                                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ Dashboard (/dashboard) ──────────────────────────────────┐  │
│  │                                                            │  │
│  │  Widgets (4)                                               │  │
│  │                                                            │  │
│  │  1. stat_cards (row layout)                                │  │
│  │     ┌──────────┬──────────┬──────────┬──────────┐         │  │
│  │     │ Total    │ Pending  │ Expiring │ Active   │         │  │
│  │     │ Subcon.  │ Approval │ Insur.   │ WOs      │         │  │
│  │     │ ⬡ prim. │ ⏱ warn. │ ⚠ dang. │ 📋 info │         │  │
│  │     │ →/subcon │ →?pend. │ →/compl. │ →?active │         │  │
│  │     └──────────┴──────────┴──────────┴──────────┘         │  │
│  │     source: GET /dashboard/stats                           │  │
│  │                                                            │  │
│  │  2. chart (donut) — "Subcontractors by Status"             │  │
│  │     source: GET /dashboard/charts/status-breakdown         │  │
│  │     height: 300  │  color_map: pending→warn, approved→ok  │  │
│  │                                                            │  │
│  │  3. chart (area) — "Work Orders Over Time"                 │  │
│  │     source: GET /dashboard/charts/work-orders-timeline     │  │
│  │     height: 300  │  series: status                         │  │
│  │                                                            │  │
│  │  4. entity_table — "Recently Added Subcontractors"         │  │
│  │     entity: Subcontractor │ limit: 5 │ sort: created_at    │  │
│  │     columns: company_name, status, created_at              │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Widget Preview

Each widget type gets a schematic preview (not a live render, but a structural mockup showing what will appear). The stat_cards show card outlines with labels and link destinations. Charts show type + data source. Tables show column names.

---

## Diff View

When two spec versions are loaded, shows what changed.

```
┌──────────────────────────────────────────────────────────────────┐
│  Diff: v1.0.0 → v1.1.0                                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Summary: 3 added  │  2 modified  │  1 removed                  │
│                                                                  │
│  ┌─ ADDED ───────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  + Entity: Invoice (new)                                   │  │
│  │    8 fields, 3 states, 2 relationships                     │  │
│  │                                                            │  │
│  │  + Field: Subcontractor.payment_terms (enum)               │  │
│  │    values: net_30, net_60, net_90                           │  │
│  │                                                            │  │
│  │  + Transition: WorkOrder.complete                          │  │
│  │    from: in_progress → completed                           │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ MODIFIED ────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  ~ Subcontractor.insurance_expiry_date                     │  │
│  │    - required: false                                       │  │
│  │    + required: true                                        │  │
│  │                                                            │  │
│  │  ~ Transition: Subcontractor.approve                       │  │
│  │    + guard: minimum_rating_met                             │  │
│  │      "Rating must be at least 2.0"                         │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ REMOVED ─────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  - Field: Subcontractor.fax_number                         │  │
│  │    (was: string, optional)                                 │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Diff Interaction

- Each diff item is clickable → shows inline before/after
- Changes grouped by: Added (green), Modified (amber), Removed (red)
- Coverage impact shown: "Overall coverage: 92% → 88% (↓4%)"

---

## Annotation System

Annotations let stakeholders leave feedback directly on spec elements. They are the primary feedback mechanism — replacing email threads and meeting notes.

### Where Annotations Can Be Placed

- On any **field** (in the entity detail view)
- On any **transition** (in the state machine view)
- On any **permission cell** (in the permission matrix)
- On any **page widget** (in the page inspector)
- On the **entity itself** (on the entity card or detail header)

### Annotation Appearance

Annotations appear as a small comment icon (💬) with a count badge on the element. Clicking reveals the thread:

```
┌──────────────────────────────────────────────────┐
│ 💬 Annotations on: insurance_expiry_date         │
├──────────────────────────────────────────────────┤
│                                                   │
│  Sarah (Product Manager) · 2h ago                │
│  "Should we also warn at 60 days? Some insurers  │
│   take 45+ days to renew."                       │
│                                                   │
│  ├─ Alex (Engineering) · 1h ago                  │
│  │  "Easy to add another display_rule tier.       │
│  │   Will update in v1.1.0"                       │
│  │                                                │
│  ├─ Sarah (Product Manager) · 45m ago            │
│  │  "Perfect. Marking as resolved."               │
│  │  ✓ Resolved                                    │
│  │                                                │
│  [Reply...]                                       │
│                                                   │
└──────────────────────────────────────────────────┘
```

### Annotation States

| State | Badge | Meaning |
|-------|-------|---------|
| Open | 💬 (blue) | Active discussion, needs attention |
| Resolved | ✓ (green) | Addressed, no action needed |
| Blocked | 🔴 (red) | Blocks spec approval |

### Annotation Summary

The Spec Overview page shows a summary:
- "3 open annotations, 1 blocking"
- Clicking navigates to each annotation in context

---

## Search

Global search that finds anything in the spec.

```
┌──────────────────────────────────────────┐
│  🔍 insurance                            │
├──────────────────────────────────────────┤
│                                          │
│  Fields                                  │
│  ┌ insurance_expiry_date                │
│  │ Subcontractor · date · optional      │
│  │                                      │
│  Guards                                  │
│  ┌ insurance_not_expired                │
│  │ Subcontractor.approve · guard        │
│  │ "Insurance must not be expired"      │
│  │                                      │
│  Navigation                             │
│  ┌ Expiring Insurance                   │
│  │ /compliance/expiring · page          │
│  │                                      │
│  Pages                                   │
│  ┌ expiring_insurance                   │
│  │ Custom page · 1 widget              │
│  │                                      │
│  Enum Values                            │
│  ┌ insurance_cert                       │
│  │ Document.type · value               │
│  │                                      │
└──────────────────────────────────────────┘
```

### Search Scope

Search indexes: entity names, field names, display names, enum values, transition names, guard names, guard messages, page titles, widget titles, navigation labels.

Results are grouped by category and each result is clickable → navigates to the element in context.
