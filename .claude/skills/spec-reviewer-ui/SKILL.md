---
name: gatehouse-spec-reviewer
description: Design and build the GateHouse Spec Reviewer — a visual interface for business stakeholders to review, understand, and approve YAML UI specifications without reading YAML. Use this skill when building or modifying the spec reviewer app, its components, pages, or interactions. Triggers on work involving spec visualization, entity browsing, field inspection, state machine diagrams, permission matrices, coverage indicators, spec diffing, stakeholder annotations, or any "review mode" UI for GateHouse YAML specs. Also use when deciding how to present spec data visually to non-technical users.
---

# GateHouse Spec Reviewer — UI Design Skill

The Spec Reviewer is a standalone visual application that consumes a GateHouse YAML UI spec and presents it as an interactive, browsable document for business stakeholders. It answers the question: **"Is this spec correct and complete?"** without requiring anyone to read YAML.

## Design Philosophy

**The spec reviewer is a blueprint viewer, not a code editor.** Think architectural drawings, not IDE. The audience is product managers, compliance officers, and business analysts who defined the requirements — they need to verify the spec captures their intent.

Three principles:
1. **Show, don't describe.** State machines are diagrams. Permissions are matrices. Fields are annotated cards. Never show raw YAML.
2. **Completeness is visible.** Every entity, field, view, and permission has a coverage state (configured / partial / missing). Gaps are impossible to miss.
3. **Feedback is inline.** Stakeholders annotate directly on the element they're reviewing — a field, a transition, a permission — not in a separate document.

## Core Experience

Read [references/experience.md](references/experience.md) for the full page-by-page UX specification including wireframes, interaction patterns, and component details.

## Visual Design

Read [references/visual-design.md](references/visual-design.md) for typography, color system, iconography, status indicators, and the coverage badge system.

## Component Library

Read [references/components.md](references/components.md) for the component catalog — every reusable element in the reviewer with its props, states, and usage rules.

## Implementation Notes

The spec reviewer is a **read-only consumer** of the YAML spec. It does not modify the spec. It can be implemented as:
- A route within the renderer's serve mode (`/_reviewer/`)
- A standalone React/Svelte app
- A generated static site

The reviewer parses the YAML once and builds an in-memory model. All navigation, filtering, and inspection operates on this model — no API calls needed (except for persisting annotations if that feature is enabled).

### Data Flow

```
app.yaml ──parse──▶ SpecModel ──render──▶ Reviewer UI
                                              │
                        Annotations DB ◀──────┘ (optional)
```

### When building reviewer components

1. Always read [references/visual-design.md](references/visual-design.md) first for the design system
2. Read [references/components.md](references/components.md) for the specific component spec
3. Follow the coverage indicator patterns exactly — they are the core value proposition
4. Test with a complex spec (4+ entities, state machines, nested relationships) to verify layout
