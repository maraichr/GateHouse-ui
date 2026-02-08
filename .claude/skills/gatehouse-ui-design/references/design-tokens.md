# GateHouse Design Tokens

Canonical token definitions consumed by both React (CSS variables) and Flutter (ThemeData). All visual decisions flow from these tokens. Never hardcode values in component code.

## Token Resolution

The YAML spec `app.theme` block provides seed values. The renderer expands these into the full token set:

```yaml
# From app.yaml
app:
  theme:
    primary_color: "#1E40AF"
    border_radius: md
    density: comfortable
```

The renderer generates a complete palette from the seed via shade generation (50–950 scale).

## Color Tokens

### Semantic Palette

Every color has a scale from 50 (lightest) to 950 (darkest). The seed color maps to the 600 shade.

| Token | Purpose | Usage |
|-------|---------|-------|
| `primary-{50-950}` | Brand actions, links, focus rings | Buttons, links, active states |
| `secondary-{50-950}` | Secondary actions, accents | Secondary buttons, tags |
| `accent-{50-950}` | Highlights, callouts | Badges, promotions |
| `neutral-{50-950}` | Text, borders, backgrounds | Body text, cards, dividers |
| `danger-{50-950}` | Errors, destructive actions | Delete buttons, error messages |
| `warning-{50-950}` | Caution states | Expiring items, warnings |
| `success-{50-950}` | Positive states | Approved badges, success toast |
| `info-{50-950}` | Informational | Help text, info banners |

### Shade Usage Convention

| Shade | React (CSS var) | Flutter (ColorScheme) | Usage |
|-------|-----------------|----------------------|-------|
| 50 | `--color-primary-50` | `colorScheme.primary.shade50` | Tinted backgrounds |
| 100 | `--color-primary-100` | `.shade100` | Hover backgrounds |
| 200 | `--color-primary-200` | `.shade200` | Borders on active elements |
| 300 | `--color-primary-300` | `.shade300` | Disabled state on dark bg |
| 400 | `--color-primary-400` | `.shade400` | Placeholder text |
| 500 | `--color-primary-500` | `.shade500` | Icons, secondary text |
| 600 | `--color-primary-600` | `.shade600` | **Default interactive** (buttons, links) |
| 700 | `--color-primary-700` | `.shade700` | Hover on interactive |
| 800 | `--color-primary-800` | `.shade800` | Active/pressed on interactive |
| 900 | `--color-primary-900` | `.shade900` | High-contrast text |
| 950 | `--color-primary-950` | `.shade950` | Headings on light bg |

### Status Colors

Status enums from the YAML map to semantic colors:

```
approved, active, verified, completed, paid      → success
pending, expiring, under_review, processing      → warning
suspended, rejected, overdue, failed, expired    → danger
terminated, cancelled, archived, inactive        → neutral
assigned, in_progress, open, scheduled           → info
draft                                            → neutral
```

The YAML `values[].color` field is authoritative — always use it. These are fallback heuristics for unmapped values.

### Surface Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `surface-primary` | white | neutral-900 | Page background |
| `surface-secondary` | neutral-50 | neutral-800 | Card backgrounds |
| `surface-tertiary` | neutral-100 | neutral-700 | Nested containers, sidebar |
| `surface-overlay` | white @ 0.8 | neutral-800 @ 0.9 | Modals, drawers |
| `surface-inverse` | neutral-900 | neutral-50 | Tooltips, toasts |

## Spacing Tokens

Based on a 4px base unit. The `density` setting from the YAML theme scales the multiplier.

| Token | Compact (×0.75) | Comfortable (×1) | Spacious (×1.25) |
|-------|-----------------|-------------------|-------------------|
| `space-0` | 0 | 0 | 0 |
| `space-1` | 3px | 4px | 5px |
| `space-2` | 6px | 8px | 10px |
| `space-3` | 9px | 12px | 15px |
| `space-4` | 12px | 16px | 20px |
| `space-5` | 15px | 20px | 25px |
| `space-6` | 18px | 24px | 30px |
| `space-8` | 24px | 32px | 40px |
| `space-10` | 30px | 40px | 50px |
| `space-12` | 36px | 48px | 60px |
| `space-16` | 48px | 64px | 80px |

### Component-Level Spacing

| Context | Padding | Gap |
|---------|---------|-----|
| Page content area | `space-6` to `space-8` | — |
| Card | `space-4` to `space-6` | — |
| Form section | `space-6` | `space-4` (between fields) |
| Table cell | `space-2` horizontal, `space-3` vertical | — |
| Button | `space-2` vertical, `space-4` horizontal | `space-2` (icon gap) |
| Toolbar | `space-3` | `space-2` to `space-3` |
| Modal | `space-6` | `space-4` |
| Stat card | `space-4` to `space-5` | `space-2` |

## Border Radius Tokens

Controlled by `app.theme.border_radius`:

| Token | none | sm | md | lg | full |
|-------|------|-----|-----|-----|------|
| `radius-sm` | 0 | 2px | 4px | 6px | 4px |
| `radius-md` | 0 | 4px | 6px | 8px | 8px |
| `radius-lg` | 0 | 6px | 8px | 12px | 12px |
| `radius-xl` | 0 | 8px | 12px | 16px | 16px |
| `radius-full` | 0 | 9999px | 9999px | 9999px | 9999px |

### Usage Convention

| Element | Radius Token |
|---------|-------------|
| Buttons | `radius-md` |
| Cards | `radius-lg` |
| Inputs, selects | `radius-md` |
| Badges, chips | `radius-full` |
| Modals, drawers | `radius-xl` |
| Avatars | `radius-full` |
| Tables | `radius-lg` (container), `0` (cells) |
| Tooltips | `radius-md` |

## Typography Tokens

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `text-xs` | 12px | 16px | 400 | Captions, timestamps |
| `text-sm` | 14px | 20px | 400 | Secondary text, help text |
| `text-base` | 16px | 24px | 400 | Body text, form labels |
| `text-lg` | 18px | 28px | 500 | Subheadings, card titles |
| `text-xl` | 20px | 28px | 600 | Section titles |
| `text-2xl` | 24px | 32px | 600 | Page titles |
| `text-3xl` | 30px | 36px | 700 | Hero headings |

### Weight Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Labels, nav items, table headers |
| `font-semibold` | 600 | Headings, buttons, emphasis |
| `font-bold` | 700 | Page titles, strong emphasis |

## Shadow Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift (inputs, chips) |
| `shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1)` | Cards, dropdowns |
| `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` | Modals, popovers |
| `shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1)` | Drawers, command palette |

## Z-Index Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `z-base` | 0 | Normal content |
| `z-dropdown` | 10 | Dropdown menus, popovers |
| `z-sticky` | 20 | Sticky headers, sidebar |
| `z-overlay` | 30 | Modal backdrop |
| `z-modal` | 40 | Modal content |
| `z-toast` | 50 | Toast notifications |
| `z-tooltip` | 60 | Tooltips |

## Transition Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `duration-fast` | 100ms | Hover states, focus rings |
| `duration-normal` | 200ms | Dropdowns, accordions |
| `duration-slow` | 300ms | Modals, page transitions |
| `easing-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | General transitions |
| `easing-in` | `cubic-bezier(0.4, 0, 1, 1)` | Elements entering |
| `easing-out` | `cubic-bezier(0, 0, 0.2, 1)` | Elements leaving |

## Icon Conventions

- Icon set: **Lucide** (React: `lucide-react`, Flutter: custom Lucide port or Material fallback)
- Icon names are always `kebab-case` in the YAML spec
- Default size: 20px (matches `text-base` line height)
- In buttons: 16px with `space-2` gap
- In nav items: 20px with `space-3` gap
- In stat cards: 24px
- Icon color inherits from text color unless overridden by semantic color
