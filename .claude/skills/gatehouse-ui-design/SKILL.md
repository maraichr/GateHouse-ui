---
name: gatehouse-ui-design
description: Enforce consistent UI design across GateHouse React and Flutter renderers. Use this skill when working on any GateHouse renderer component, template, widget, page layout, form, data table, or design token — in either the React renderer runtime, the Flutter renderer runtime, or Go template files that generate output for either framework. Also use when creating new ComponentKind templates, modifying existing renderer components, implementing field display/input components, building dashboard widgets, or ensuring visual consistency between the two renderer targets. Triggers on any work touching templates/, runtime/, or renderer component code in the GateHouse codebase.
---

# GateHouse UI Design Skill

Maintain visual and behavioral consistency across the React and Flutter GateHouse renderers. Both renderers consume the same YAML UI spec and must produce visually equivalent applications despite different underlying frameworks.

## Core Principle

The YAML spec is the **single source of truth**. Both renderers interpret the same spec and must produce the same user experience. Differences in implementation are acceptable; differences in behavior or visual output are bugs.

## Design System Architecture

```
YAML UI Spec (app.yaml)
        │
        ▼
Shared Design Tokens ──────────────── references/design-tokens.md
        │
   ┌────┴────┐
   ▼         ▼
React       Flutter
Renderer    Renderer
   │         │
   ▼         ▼
Tailwind    Theme
  CSS       Data
```

## Workflow

1. **Determine target**: Identify whether working on React, Flutter, or both
2. **Load shared tokens**: Read [references/design-tokens.md](references/design-tokens.md) for the canonical token system
3. **Load component mapping**: Read [references/component-map.md](references/component-map.md) to find the abstract-to-concrete mapping for the component
4. **Load framework reference**: Read the framework-specific file:
   - React renderer work → [references/react.md](references/react.md)
   - Flutter renderer work → [references/flutter.md](references/flutter.md)
5. **Load layout patterns**: For page-level layout, dashboard, or navigation work → [references/patterns.md](references/patterns.md)

## Decision Framework

### When creating a new ComponentKind template

1. Read [references/component-map.md](references/component-map.md) — add the new kind to the mapping table
2. Implement in **both** renderers unless explicitly single-target
3. Verify the same YAML props produce equivalent output

### When modifying an existing component

1. Identify the ComponentKind from the template manifest
2. Load the framework-specific reference for the target
3. Check [references/component-map.md](references/component-map.md) for the counterpart in the other framework
4. Ensure the change is reflected in both renderers or documented as framework-specific

### When working on design tokens or theming

1. Always start with [references/design-tokens.md](references/design-tokens.md)
2. Tokens are defined abstractly — each framework reference explains how to consume them
3. Never hardcode colors, spacing, radii, or typography values — always use tokens

## Critical Rules

- **No framework-specific visual decisions in templates**. If a template chooses a border radius, shadow, or color, it must come from the token system, not a hardcoded value.
- **Semantic color names only**. Use `primary`, `danger`, `success`, `warning`, `neutral`, `info` — never hex values in component code.
- **Field types dictate input/display components**. The YAML field `type` + `display_as` determines which component renders. Do not add conditional rendering logic that bypasses this mapping.
- **Responsive rules come from the spec**. The YAML `responsive` block defines breakpoint behavior. Renderers implement the rules; they don't invent their own.
- **Accessibility is non-negotiable**. Every interactive element has keyboard support and ARIA labels. Read the accessibility section in [references/patterns.md](references/patterns.md).
