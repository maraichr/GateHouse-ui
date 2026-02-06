# GateHouse Template Management — Specification

## Overview

Templates are the bridge between the abstract component tree and concrete framework output. Each template knows how to render one `ComponentKind` for one `TargetFramework`. The template system handles selection, composition, inheritance, and variable binding.

```
ComponentNode                  Template Registry              Output
(kind: entity_list)            ┌──────────────┐
(props: {columns, filters})───▶│ Lookup:       │
                               │  kind=entity_ │
                               │  list         │──────▶  React: EntityList.tsx
                               │  target=react │        (populated with props)
                               └──────────────┘
```

---

## 1. Template Directory Structure

```
templates/
├── manifest.yaml                 # Registry manifest — indexes all templates
│
├── core/                         # Framework-agnostic logic templates
│   ├── expressions/              # Expression evaluation helpers
│   │   ├── conditional.tmpl
│   │   └── template_string.tmpl
│   ├── routing/                  # Route generation logic
│   │   └── route_table.tmpl
│   └── data/                     # Data fetching patterns
│       ├── list_query.tmpl
│       └── mutation.tmpl
│
├── react/                        # React-specific templates
│   ├── _base/                    # Base templates that others extend
│   │   ├── page.tsx.tmpl
│   │   ├── component.tsx.tmpl
│   │   └── hook.ts.tmpl
│   ├── layout/
│   │   ├── app_shell.tsx.tmpl
│   │   ├── sidebar.tsx.tmpl
│   │   ├── header.tsx.tmpl
│   │   ├── tab_layout.tsx.tmpl
│   │   ├── section.tsx.tmpl
│   │   └── two_column.tsx.tmpl
│   ├── entity/
│   │   ├── entity_list.tsx.tmpl
│   │   ├── data_table.tsx.tmpl
│   │   ├── filter_panel.tsx.tmpl
│   │   ├── search_bar.tsx.tmpl
│   │   ├── entity_detail.tsx.tmpl
│   │   ├── detail_header.tsx.tmpl
│   │   ├── empty_state.tsx.tmpl
│   │   └── activity_feed.tsx.tmpl
│   ├── form/
│   │   ├── dynamic_form.tsx.tmpl
│   │   ├── stepped_form.tsx.tmpl
│   │   ├── form_section.tsx.tmpl
│   │   └── fields/
│   │       ├── string_field.tsx.tmpl
│   │       ├── enum_field.tsx.tmpl
│   │       ├── date_field.tsx.tmpl
│   │       ├── datetime_field.tsx.tmpl
│   │       ├── reference_field.tsx.tmpl
│   │       ├── currency_field.tsx.tmpl
│   │       ├── richtext_field.tsx.tmpl
│   │       ├── image_field.tsx.tmpl
│   │       ├── file_field.tsx.tmpl
│   │       ├── address_field.tsx.tmpl
│   │       ├── phone_field.tsx.tmpl
│   │       ├── boolean_field.tsx.tmpl
│   │       └── inline_table_field.tsx.tmpl
│   ├── display/
│   │   ├── string_display.tsx.tmpl
│   │   ├── enum_badge.tsx.tmpl
│   │   ├── date_display.tsx.tmpl
│   │   ├── currency_display.tsx.tmpl
│   │   ├── star_rating.tsx.tmpl
│   │   ├── avatar.tsx.tmpl
│   │   ├── badge.tsx.tmpl
│   │   └── progress_bar.tsx.tmpl
│   ├── action/
│   │   ├── action_button.tsx.tmpl
│   │   ├── state_transition.tsx.tmpl
│   │   ├── confirm_dialog.tsx.tmpl
│   │   ├── transition_form.tsx.tmpl
│   │   └── bulk_actions.tsx.tmpl
│   ├── widget/
│   │   ├── stat_cards.tsx.tmpl
│   │   ├── chart.tsx.tmpl
│   │   ├── entity_table_widget.tsx.tmpl
│   │   ├── report_builder.tsx.tmpl
│   │   └── settings_form.tsx.tmpl
│   ├── data/                     # Data layer templates
│   │   ├── api_client.ts.tmpl
│   │   ├── use_entity_list.ts.tmpl
│   │   ├── use_entity_detail.ts.tmpl
│   │   ├── use_entity_mutation.ts.tmpl
│   │   └── use_transition.ts.tmpl
│   ├── auth/
│   │   ├── auth_provider.tsx.tmpl
│   │   └── use_permissions.ts.tmpl
│   ├── config/                   # Project config file templates
│   │   ├── package.json.tmpl
│   │   ├── vite.config.ts.tmpl
│   │   ├── tailwind.config.ts.tmpl
│   │   ├── tsconfig.json.tmpl
│   │   └── index.html.tmpl
│   └── app.tsx.tmpl              # Root App component
│
├── svelte/                       # Svelte-specific templates
│   ├── _base/
│   │   ├── page.svelte.tmpl
│   │   └── component.svelte.tmpl
│   ├── layout/
│   │   ├── app_shell.svelte.tmpl
│   │   ├── sidebar.svelte.tmpl
│   │   └── ...
│   ├── entity/
│   │   ├── entity_list.svelte.tmpl
│   │   └── ...
│   └── ...                       # mirrors react/ structure
│
├── flutter/                      # Flutter-specific templates
│   ├── _base/
│   │   ├── page.dart.tmpl
│   │   └── widget.dart.tmpl
│   ├── layout/
│   │   └── ...
│   └── ...
│
└── shared/                       # Shared across frameworks
    ├── styles/
    │   ├── theme.css.tmpl
    │   └── tokens.css.tmpl
    └── assets/
        └── empty_states/
            └── ...
```

---

## 2. Template Manifest

The manifest indexes every template and defines its metadata, enabling the registry to perform fast lookups.

```yaml
# templates/manifest.yaml

version: "1.0.0"
description: "GateHouse built-in template library"

templates:

  # ------------------------------------------------------------------
  # React templates
  # ------------------------------------------------------------------

  # Layout
  - id: react/layout/app_shell
    path: react/layout/app_shell.tsx.tmpl
    kind: app_shell
    target: react
    extends: react/_base/component.tsx.tmpl
    version: "1.0.0"
    description: "Main application shell with sidebar and content area"
    props:
      required: [app_name, theme, shell, auth]
      optional: [notifications_config, shortcuts]
    outputs:
      generate:
        - path: "src/components/layout/AppShell.tsx"
          strategy: create_only       # only created once
      serve:
        component: AppShell

  - id: react/layout/sidebar
    path: react/layout/sidebar.tsx.tmpl
    kind: sidebar
    target: react
    extends: react/_base/component.tsx.tmpl
    version: "1.0.0"
    props:
      required: [navigation_items, sidebar_config]
      optional: [user_menu, branding]
    outputs:
      generate:
        - path: "src/components/layout/Sidebar.tsx"
          strategy: create_only

  # Entity views
  - id: react/entity/entity_list
    path: react/entity/entity_list.tsx.tmpl
    kind: entity_list
    target: react
    extends: react/_base/page.tsx.tmpl
    version: "1.0.0"
    description: "Full entity list page with table, filters, search, and actions"
    props:
      required: [entity, columns, api_resource]
      optional: [filters, search, actions, bulk_actions, empty_state, default_sort]
    children:
      - kind: data_table
      - kind: filter_panel
      - kind: search_bar
      - kind: bulk_actions
    outputs:
      generate:
        - path: "src/pages/{{entity.name | kebab}}/List.tsx"
          strategy: create_only
    dependencies:
      packages:
        "@tanstack/react-query": "^5.0.0"
        "@tanstack/react-table": "^8.0.0"

  - id: react/entity/entity_detail
    path: react/entity/entity_detail.tsx.tmpl
    kind: entity_detail
    target: react
    extends: react/_base/page.tsx.tmpl
    version: "1.0.0"
    props:
      required: [entity, layout, tabs_or_sections]
      optional: [header, actions, relationships]
    outputs:
      generate:
        - path: "src/pages/{{entity.name | kebab}}/Detail.tsx"
          strategy: create_only

  # Forms
  - id: react/form/dynamic_form
    path: react/form/dynamic_form.tsx.tmpl
    kind: [create_form, edit_form]     # handles both kinds
    target: react
    extends: react/_base/page.tsx.tmpl
    version: "1.0.0"
    props:
      required: [entity, fields, layout]
      optional: [steps, sections, field_overrides, submit_label, cancel_path]
    outputs:
      generate:
        - path: "src/pages/{{entity.name | kebab}}/Create.tsx"
          when: "kind == create_form"
          strategy: create_only
        - path: "src/pages/{{entity.name | kebab}}/Edit.tsx"
          when: "kind == edit_form"
          strategy: create_only
    dependencies:
      packages:
        "react-hook-form": "^7.0.0"
        "zod": "^3.0.0"
        "@hookform/resolvers": "^3.0.0"

  - id: react/form/stepped_form
    path: react/form/stepped_form.tsx.tmpl
    kind: stepped_form
    target: react
    extends: react/form/dynamic_form.tsx.tmpl
    version: "1.0.0"
    description: "Multi-step wizard form with progress indicator"
    props:
      required: [entity, steps]

  # Field templates (input mode)
  - id: react/form/fields/string
    path: react/form/fields/string_field.tsx.tmpl
    kind: field_string
    target: react
    version: "1.0.0"
    props:
      required: [name, display_name]
      optional: [placeholder, help_text, min_length, max_length, pattern, pattern_message]

  - id: react/form/fields/enum
    path: react/form/fields/enum_field.tsx.tmpl
    kind: field_enum
    target: react
    version: "1.0.0"
    props:
      required: [name, display_name, values]
      optional: [default, input_type]   # input_type: select | radio

  - id: react/form/fields/reference
    path: react/form/fields/reference_field.tsx.tmpl
    kind: field_reference
    target: react
    version: "1.0.0"
    description: "Searchable select that fetches options from a related entity's API"
    props:
      required: [name, display_name, entity, label_field]
      optional: [filter, multi, api_resource]

  - id: react/form/fields/address
    path: react/form/fields/address_field.tsx.tmpl
    kind: field_address
    target: react
    version: "1.0.0"
    description: "Structured address input with autocomplete support"
    props:
      required: [name, display_name, components]

  - id: react/form/fields/inline_table
    path: react/form/fields/inline_table_field.tsx.tmpl
    kind: field_inline_table
    target: react
    version: "1.0.0"
    description: "Editable table within a form (e.g., line items)"
    props:
      required: [name, display_name, columns]
      optional: [min_rows, max_rows, footer]

  # Display templates (read-only mode)
  - id: react/display/enum_badge
    path: react/display/enum_badge.tsx.tmpl
    kind: display_enum
    target: react
    version: "1.0.0"
    props:
      required: [value, values_config]
    description: "Colored badge with optional icon for enum values"

  - id: react/display/star_rating
    path: react/display/star_rating.tsx.tmpl
    kind: display_star_rating
    target: react
    version: "1.0.0"
    props:
      required: [value, max]

  # Action templates
  - id: react/action/state_transition
    path: react/action/state_transition.tsx.tmpl
    kind: state_transition
    target: react
    version: "1.0.0"
    description: "Button that executes a state machine transition with optional confirmation"
    props:
      required: [transition, entity, api_resource]
      optional: [confirmation, form_fields]
    children:
      - kind: confirm_dialog
      - kind: transition_form

  - id: react/action/confirm_dialog
    path: react/action/confirm_dialog.tsx.tmpl
    kind: confirm_dialog
    target: react
    version: "1.0.0"
    props:
      required: [title, message, style]
      optional: [require_comment, comment_label, type_to_confirm]

  # Widget templates
  - id: react/widget/stat_cards
    path: react/widget/stat_cards.tsx.tmpl
    kind: stat_cards
    target: react
    version: "1.0.0"
    props:
      required: [cards]
    description: "Row or grid of KPI stat cards with icons and links"

  - id: react/widget/chart
    path: react/widget/chart.tsx.tmpl
    kind: chart
    target: react
    version: "1.0.0"
    props:
      required: [chart_type, source, data_mapping]
      optional: [height, title]
    dependencies:
      packages:
        "recharts": "^2.0.0"

  # Data layer templates
  - id: react/data/api_client
    path: react/data/api_client.ts.tmpl
    kind: _infrastructure
    target: react
    version: "1.0.0"
    description: "Singleton API client configured from spec.api"
    outputs:
      generate:
        - path: "src/generated/apiClient.ts"
          strategy: always_overwrite

  - id: react/data/use_entity_list
    path: react/data/use_entity_list.ts.tmpl
    kind: _infrastructure
    target: react
    version: "1.0.0"
    description: "React Query hook for entity list with filters, sort, pagination"
    outputs:
      generate:
        - path: "src/generated/hooks/use{{entity.name}}s.ts"
          strategy: always_overwrite
          per_entity: true

  # Config file templates
  - id: react/config/package_json
    path: react/config/package.json.tmpl
    kind: _config
    target: react
    version: "1.0.0"
    outputs:
      generate:
        - path: "package.json"
          strategy: create_only
    description: "Aggregates all package dependencies from template tree"

# ------------------------------------------------------------------
# Template variables reference
# ------------------------------------------------------------------
#
# Every template receives a context object with these top-level keys:
#
#   .App           — app metadata (name, theme, i18n)
#   .Auth          — auth config (roles, claims)
#   .API           — api connection config
#   .Entity        — current entity (when rendering entity-scoped templates)
#   .Field         — current field (when rendering field-scoped templates)
#   .View          — current view config (list, detail, create, edit)
#   .Page          — current page config (for custom pages)
#   .Navigation    — navigation config
#   .Shell         — shell/layout config
#   .Behaviors     — global behavior config
#   .Responsive    — responsive rules
#   .Accessibility — a11y config
#   .AllEntities   — index of all entities (for cross-references)
#   .Analysis      — resolved analysis (route table, dependency graph)
```

---

## 3. Template Anatomy

### 3.1 Template Syntax

Templates use Go's `text/template` package with custom functions. The file extension is always `.tmpl` appended to the output extension (e.g., `entity_list.tsx.tmpl`).

### 3.2 Example: Entity List Template

```go-template
{{/* react/entity/entity_list.tsx.tmpl */}}
{{/* Extends: react/_base/page.tsx.tmpl */}}

{{- define "imports" -}}
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../generated/apiClient';
import { DataTable } from '../../components/entity/DataTable';
import { FilterPanel } from '../../components/entity/FilterPanel';
import { SearchBar } from '../../components/entity/SearchBar';
import { EmptyState } from '../../components/entity/EmptyState';
import { PageHeader } from '../../components/layout/PageHeader';
{{- range .View.List.Columns }}
{{- if eq .Field.DisplayAs "star_rating" }}
import { StarRating } from '../../components/display/StarRating';
{{- end }}
{{- if eq .Field.Type "enum" }}
import { EnumBadge } from '../../components/display/EnumBadge';
{{- end }}
{{- end }}
{{- if .View.List.Actions.Primary }}
import { ActionButton } from '../../components/action/ActionButton';
{{- end }}
{{- if .View.List.BulkActions }}
import { BulkActions } from '../../components/action/BulkActions';
{{- end }}
{{- end -}}

{{- define "types" -}}
import type { {{ .Entity.Name }}, {{ .Entity.Name }}Filters } from '../../generated/types';
{{- end -}}

{{- define "component" -}}
export default function {{ .Entity.Name }}List() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<{{ .Entity.Name }}Filters>({});
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['{{ .Entity.Name | camel }}s', filters, search],
    queryFn: () => apiClient.get<{ items: {{ .Entity.Name }}[]; total: number }>(
      '{{ .Entity.APIResource }}',
      {
        params: {
          ...filters,
          {{- if .View.List.Search }}
          search: search || undefined,
          {{- end }}
          page_size: {{ .API.Pagination.DefaultPageSize }},
        },
      }
    ),
  });

  const columns = useMemo(() => [
    {{- range .View.List.Columns }}
    {
      id: '{{ .Field.Name }}',
      header: '{{ .Field.DisplayName }}',
      {{- if .Width }}
      size: {{ .Width }},
      {{- end }}
      {{- if .LinkTo }}
      cell: ({ row }) => (
        <a
          href={`{{ $.Entity.APIResource | toRoute }}/${row.original.id}`}
          onClick={(e) => { e.preventDefault(); navigate(`{{ $.Entity.APIResource | toRoute }}/${row.original.id}`); }}
          className="text-primary-600 hover:text-primary-800 font-medium"
        >
          {row.original.{{ .Field.Name }}}
        </a>
      ),
      {{- else if eq .Field.Type "enum" }}
      cell: ({ row }) => (
        <EnumBadge
          value={row.original.{{ .Field.Name }}}
          config={{ `{` }}{{ range .Field.Values }}
            {{ .Value }}: { label: '{{ .Label }}', color: '{{ .Color }}'{{ if .Icon }}, icon: '{{ .Icon }}'{{ end }} },
          {{- end }}{{ `}` }}
        />
      ),
      {{- else if eq .Field.DisplayAs "star_rating" }}
      cell: ({ row }) => <StarRating value={row.original.{{ .Field.Name }}} max={5} />,
      {{- else if eq .Field.Type "datetime" }}
      cell: ({ row }) => <time dateTime={row.original.{{ .Field.Name }}}>
        {new Date(row.original.{{ .Field.Name }}).toLocaleDateString()}
      </time>,
      {{- else if eq .Field.Type "reference" }}
      cell: ({ row }) => row.original.{{ .Field.Name | stripID }}?.{{ .DisplayField }},
      {{- end }}
      {{- if .Field.Sortable }}
      enableSorting: true,
      {{- end }}
    },
    {{- end }}
  ], [navigate]);

  if (error) return <div className="text-danger-600">Error loading {{ .Entity.DisplayNamePlural | lower }}</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="{{ .Entity.DisplayNamePlural }}">
        {{- range .View.List.Actions.Primary }}
        <ActionButton
          label="{{ .Label }}"
          icon="{{ .Icon }}"
          {{- if eq .Action.Type "navigate" }}
          onClick={() => navigate('{{ .Action.Path }}')}
          {{- end }}
          variant="primary"
        />
        {{- end }}
      </PageHeader>

      <div className="flex gap-6">
        {{- if .View.List.Filters }}
        {{- if eq .View.List.Filters.Layout "sidebar" }}
        <aside className="w-64 shrink-0">
          <FilterPanel
            groups={{ `{` }}{{ templateCall "filter_groups" .View.List.Filters.Groups }}{{ `}` }}
            value={filters}
            onChange={setFilters}
          />
        </aside>
        {{- end }}
        {{- end }}

        <main className="flex-1 space-y-4">
          {{- if .View.List.Search }}
          <SearchBar
            placeholder="{{ .View.List.Search.Placeholder }}"
            value={search}
            onChange={setSearch}
            debounceMs={{ .View.List.Search.DebounceMs }}
          />
          {{- end }}

          {data?.items.length === 0 && !isLoading ? (
            <EmptyState
              {{- with .View.List.Empty }}
              icon="{{ .Icon }}"
              title="{{ .Title }}"
              message="{{ .Message }}"
              {{- if .Action }}
              actionLabel="{{ .Action.Label }}"
              onAction={() => navigate('{{ .Action.Path }}')}
              {{- end }}
              {{- end }}
            />
          ) : (
            <DataTable
              data={data?.items ?? []}
              columns={columns}
              isLoading={isLoading}
              {{- if .View.List.BulkActions }}
              selectable
              selected={selected}
              onSelectionChange={setSelected}
              {{- end }}
              defaultSort={{ `{` }} id: '{{ .View.List.DefaultSort.Field }}', desc: {{ eq .View.List.DefaultSort.Order "desc" }} {{ `}` }}
            />
          )}

          {{- if .View.List.BulkActions }}
          {selected.length > 0 && (
            <BulkActions
              selected={selected}
              actions={[
                {{- range .View.List.BulkActions }}
                {
                  label: '{{ .Label }}',
                  icon: '{{ .Icon }}',
                  {{- if .Confirmation }}
                  confirmation: {
                    title: '{{ .Confirmation.Title }}',
                    style: '{{ .Confirmation.Style }}',
                  },
                  {{- end }}
                  onExecute: async (ids) => {
                    {{- if eq .Action.Type "api_call" }}
                    await apiClient.{{ .Action.Method | lower }}('{{ .Action.Path }}', { ids });
                    {{- else if eq .Action.Type "bulk_transition" }}
                    await Promise.all(ids.map(id =>
                      apiClient.post(`{{ $.Entity.APIResource }}/${id}/{{ .Action.Transition }}`)
                    ));
                    {{- end }}
                  },
                },
                {{- end }}
              ]}
            />
          )}
          {{- end }}
        </main>
      </div>
    </div>
  );
}
{{- end -}}

{{- /* Compose the final output using the base page template */ -}}
{{ template "page" . }}
```

### 3.3 Example: Base Page Template

```go-template
{{/* react/_base/page.tsx.tmpl */}}
{{/* Base template that all page templates extend */}}

{{ define "page" -}}
// Generated by GateHouse Renderer
// Entity: {{ .Entity.Name }}
// Template: {{ .TemplateMeta.ID }} v{{ .TemplateMeta.Version }}
// Generated at: {{ now | formatTime }}
//
// {{ if .TemplateMeta.Strategy | eq "create_only" -}}
// This file was generated once. You can safely modify it.
// Re-running the generator will NOT overwrite this file.
{{- else -}}
// ⚠️  This file is auto-generated. Do not edit directly.
// Changes will be overwritten on next generation.
{{- end }}

{{ template "imports" . }}
{{ template "types" . }}
{{ template "component" . }}
{{- end }}
```

### 3.4 Example: Field Template (Enum)

```go-template
{{/* react/form/fields/enum_field.tsx.tmpl */}}

{{- define "enum_field" -}}
<div className="space-y-1.5">
  <label htmlFor="{{ .Field.Name }}" className="block text-sm font-medium text-gray-700">
    {{ .Field.DisplayName }}
    {{- if .Field.Required }}
    <span className="text-danger-500">*</span>
    {{- end }}
  </label>

  {{- if and .Field.Values (le (len .Field.Values) 4) }}
  {{/* Radio group for ≤4 options */}}
  <div className="flex gap-4">
    {{- range .Field.Values }}
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        {...register('{{ $.Field.Name }}'{{ if $.Field.Required }}, { required: '{{ $.Field.DisplayName }} is required' }{{ end }})}
        value="{{ .Value }}"
        className="text-primary-600 focus:ring-primary-500"
      />
      <span className="text-sm">{{ .Label }}</span>
    </label>
    {{- end }}
  </div>
  {{- else }}
  {{/* Select dropdown for >4 options */}}
  <select
    id="{{ .Field.Name }}"
    {...register('{{ .Field.Name }}'{{ if .Field.Required }}, { required: '{{ .Field.DisplayName }} is required' }{{ end }})}
    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
  >
    <option value="">Select {{ .Field.DisplayName | lower }}...</option>
    {{- range .Field.Values }}
    <option value="{{ .Value }}">{{ .Label }}</option>
    {{- end }}
  </select>
  {{- end }}

  {{- if .Field.HelpText }}
  <p className="text-sm text-gray-500">{{ .Field.HelpText }}</p>
  {{- end }}

  {errors.{{ .Field.Name }} && (
    <p className="text-sm text-danger-600">{errors.{{ .Field.Name }}.message}</p>
  )}
</div>
{{- end -}}
```

---

## 4. Template Resolution

### 4.1 Resolution Algorithm

When the engine encounters a `ComponentNode`, it resolves it to a concrete template using this priority:

```
1. Project override     templates/overrides/{target}/{kind}.tsx.tmpl
2. Entity-specific      templates/{target}/entity/{entity_name}_{kind}.tsx.tmpl
3. Kind-specific        templates/{target}/{category}/{kind}.tsx.tmpl
4. Base fallback        templates/{target}/_base/{category}.tsx.tmpl
```

```go
// internal/registry/registry.go

package registry

import (
    "github.com/gatehouse/renderer/internal/engine"
)

type Registry struct {
    templates    map[string]*Template       // id → template
    kindIndex    map[engine.ComponentKind][]*Template  // kind → matching templates
    overrides    map[string]*Template       // override paths
    funcMap      template.FuncMap           // custom template functions
}

// Resolve finds the best template for a given component node.
func (r *Registry) Resolve(
    node *engine.ComponentNode,
    target engine.TargetFramework,
) (*Template, error) {
    // 1. Check project overrides first
    overrideKey := fmt.Sprintf("%s/%s", target, node.Kind)
    if tmpl, ok := r.overrides[overrideKey]; ok {
        return tmpl, nil
    }

    // 2. Check entity-specific templates
    if scope := node.Scope; scope != nil && scope.Entity != nil {
        entityKey := fmt.Sprintf("%s/entity/%s_%s",
            target, toSnake(scope.Entity.Name), node.Kind)
        if tmpl, ok := r.templates[entityKey]; ok {
            return tmpl, nil
        }
    }

    // 3. Find by kind + target
    candidates := r.kindIndex[node.Kind]
    for _, tmpl := range candidates {
        if tmpl.Target == target {
            return tmpl, nil
        }
    }

    return nil, fmt.Errorf("no template found for kind=%s target=%s", node.Kind, target)
}
```

### 4.2 Template Context Building

Each template receives a rich context object built from the spec and the current render scope:

```go
// internal/resolver/context.go

package resolver

import "github.com/gatehouse/renderer/pkg/spec"

// TemplateContext is the data object passed to every template.
type TemplateContext struct {
    // Global context — always available
    App           spec.AppMeta          `json:"app"`
    Auth          spec.AuthConfig       `json:"auth"`
    API           spec.APIConfig        `json:"api"`
    Shell         spec.ShellConfig      `json:"shell"`
    Navigation    spec.NavigationConfig `json:"navigation"`
    Behaviors     spec.BehaviorConfig   `json:"behaviors"`
    Responsive    spec.ResponsiveConfig `json:"responsive"`
    Accessibility spec.A11yConfig       `json:"accessibility"`
    AllEntities   map[string]*spec.Entity `json:"all_entities"`
    Analysis      *Analysis             `json:"analysis"`

    // Scoped context — set based on what's being rendered
    Entity        *spec.Entity          `json:"entity,omitempty"`
    Field         *spec.Field           `json:"field,omitempty"`
    View          *ViewContext          `json:"view,omitempty"`
    Page          *spec.Page            `json:"page,omitempty"`

    // Template metadata
    TemplateMeta  TemplateMeta          `json:"template_meta"`
}

type ViewContext struct {
    List   *spec.ListView   `json:"list,omitempty"`
    Detail *spec.DetailView `json:"detail,omitempty"`
    Create *spec.FormView   `json:"create,omitempty"`
    Edit   *spec.FormView   `json:"edit,omitempty"`
}

type TemplateMeta struct {
    ID       string `json:"id"`
    Version  string `json:"version"`
    Strategy string `json:"strategy"`
}

// BuildContext creates the template context for a given component node.
func BuildContext(
    appSpec *spec.AppSpec,
    analysis *Analysis,
    node *engine.ComponentNode,
    tmpl *Template,
) *TemplateContext {
    ctx := &TemplateContext{
        App:           appSpec.App,
        Auth:          appSpec.Auth,
        API:           appSpec.API,
        Shell:         appSpec.Shell,
        Navigation:    appSpec.Navigation,
        Behaviors:     appSpec.Behaviors,
        Responsive:    appSpec.Responsive,
        Accessibility: appSpec.Accessibility,
        AllEntities:   analysis.EntityIndex,
        Analysis:      analysis,
        TemplateMeta: TemplateMeta{
            ID:       tmpl.ID,
            Version:  tmpl.Version,
            Strategy: string(tmpl.Strategy),
        },
    }

    // Add scoped context from the node
    if scope := node.Scope; scope != nil {
        ctx.Entity = scope.Entity
        ctx.Field = scope.Field
        ctx.View = scope.View
        ctx.Page = scope.Page
    }

    return ctx
}
```

### 4.3 Custom Template Functions

```go
// internal/registry/funcmap.go

package registry

import (
    "strings"
    "text/template"
)

func DefaultFuncMap() template.FuncMap {
    return template.FuncMap{
        // Case conversion
        "camel":     toCamelCase,     // "company_name" → "companyName"
        "pascal":    toPascalCase,    // "company_name" → "CompanyName"
        "kebab":     toKebabCase,     // "CompanyName" → "company-name"
        "snake":     toSnakeCase,     // "CompanyName" → "company_name"
        "upper":     strings.ToUpper,
        "lower":     strings.ToLower,
        "title":     strings.Title,

        // String manipulation
        "stripID":   func(s string) string { return strings.TrimSuffix(s, "_id") },
        "quote":     func(s string) string { return fmt.Sprintf("%q", s) },
        "join":      strings.Join,
        "contains":  strings.Contains,
        "hasPrefix": strings.HasPrefix,
        "hasSuffix": strings.HasSuffix,
        "replace":   strings.ReplaceAll,

        // Collection helpers
        "first":     func(a []any) any { if len(a) > 0 { return a[0] }; return nil },
        "last":      func(a []any) any { if len(a) > 0 { return a[len(a)-1] }; return nil },
        "len":       func(a any) int { /* reflect-based length */ },
        "in":        func(val any, collection []any) bool { /* membership check */ },
        "filter":    func(items []any, key string, val any) []any { /* filter slice */ },

        // Conditional helpers
        "default":   func(def, val any) any { if val == nil || val == "" { return def }; return val },
        "ternary":   func(cond bool, t, f any) any { if cond { return t }; return f },
        "eq":        func(a, b any) bool { return a == b },
        "ne":        func(a, b any) bool { return a != b },

        // Field type helpers
        "isRequired":   func(f *spec.Field) bool { return f.Required },
        "isSearchable": func(f *spec.Field) bool { return f.Searchable },
        "isSortable":   func(f *spec.Field) bool { return f.Sortable },
        "isFilterable": func(f *spec.Field) bool { return f.Filterable },
        "isComputed":   func(f *spec.Field) bool { return f.Computed },
        "isImmutable":  func(f *spec.Field) bool { return f.Immutable },
        "isSensitive":  func(f *spec.Field) bool { return f.Sensitive },
        "isHidden":     func(f *spec.Field) bool { return f.Hidden },

        // Field filtering by view context
        "fieldsForList":   func(e *spec.Entity) []*spec.Field { /* show_in.list == true */ },
        "fieldsForDetail": func(e *spec.Entity) []*spec.Field { /* show_in.detail == true */ },
        "fieldsForCreate": func(e *spec.Entity) []*spec.Field { /* show_in.create == true */ },
        "fieldsForEdit":   func(e *spec.Entity) []*spec.Field { /* show_in.edit == true */ },

        // Route helpers
        "toRoute": func(apiResource string) string {
            // "/subcontractors" → "/subcontractors"
            // "/work-orders"    → "/work-orders"
            return apiResource
        },
        "entityRoute": func(entity *spec.Entity, view string) string {
            // Looks up the route table for the entity + view combination
        },

        // Template composition
        "templateCall": func(name string, data any) (string, error) {
            // Renders a named sub-template and returns its output as a string
        },

        // Timestamp
        "now":        time.Now,
        "formatTime": func(t time.Time) string { return t.Format(time.RFC3339) },

        // Dependency tracking (used by package.json generation)
        "collectDeps": func(tree *engine.ResolvedTree) map[string]string {
            // Walks the tree, collects all template dependencies.packages
        },
    }
}
```

---

## 5. Template Versioning

### 5.1 Semantic Versioning

Every template carries a version. When the template library is updated, the renderer tracks which version was used to generate each file.

```yaml
# .gatehouse/generation_manifest.json
# Written by the generator, tracks what was generated and from what template version

{
  "generated_at": "2025-02-06T10:30:00Z",
  "spec_hash": "sha256:abc123...",
  "template_library_version": "1.0.0",
  "files": {
    "src/pages/subcontractors/List.tsx": {
      "template_id": "react/entity/entity_list",
      "template_version": "1.0.0",
      "strategy": "create_only",
      "generated_at": "2025-02-06T10:30:00Z",
      "content_hash": "sha256:def456..."
    },
    "src/generated/hooks/useSubcontractors.ts": {
      "template_id": "react/data/use_entity_list",
      "template_version": "1.0.0",
      "strategy": "always_overwrite",
      "generated_at": "2025-02-06T10:30:00Z",
      "content_hash": "sha256:ghi789..."
    }
  }
}
```

### 5.2 Upgrade Detection

When template versions change, the generator can diff and report:

```
$ gatehouse generate --spec app.yaml --target react --output ./frontend

Template upgrades available:
  react/entity/entity_list    1.0.0 → 1.1.0  (improved pagination)
  react/form/fields/address   1.0.0 → 1.1.0  (autocomplete support)

Files affected:
  src/pages/subcontractors/List.tsx     [create_only — manual merge required]
  src/pages/work-orders/List.tsx        [create_only — manual merge required]
  src/pages/subcontractors/Create.tsx   [create_only — manual merge required]

Run with --show-diff to see template changes.
Run with --force-upgrade to overwrite editable files.
```

---

## 6. Template Composition Patterns

### 6.1 Inheritance (`extends`)

Templates can extend a base template, providing block overrides:

```
page.tsx.tmpl (base)
  └── entity_list.tsx.tmpl (extends page, overrides "imports", "types", "component")
        └── subcontractor_list.tsx.tmpl (entity-specific override, optional)
```

### 6.2 Inclusion (`templateCall`)

Templates can include other templates inline:

```go-template
{{/* entity_detail.tsx.tmpl includes field renderers dynamically */}}

{{- range .View.Detail.Fields }}
  {{- $fieldTemplate := printf "display_%s" .Type }}
  {{ templateCall $fieldTemplate (dict "Field" . "Entity" $.Entity) }}
{{- end }}
```

### 6.3 Slot Pattern

For layout templates that wrap content:

```go-template
{{/* tab_layout.tsx.tmpl */}}
{{- define "tab_layout" -}}
<Tabs defaultValue="{{ (index .Tabs 0).ID }}">
  <TabsList>
    {{- range .Tabs }}
    <TabsTrigger value="{{ .ID }}">
      {{- if .Icon }}<Icon name="{{ .Icon }}" className="mr-2 h-4 w-4" />{{ end }}
      {{ .Label }}
    </TabsTrigger>
    {{- end }}
  </TabsList>

  {{- range .Tabs }}
  <TabsContent value="{{ .ID }}">
    {{ templateCall .ContentTemplate .ContentProps }}
  </TabsContent>
  {{- end }}
</Tabs>
{{- end -}}
```

### 6.4 Conditional Blocks

Templates handle optional features with conditional rendering:

```go-template
{{/* Only render permission checks if auth is configured */}}
{{- if .Auth.Roles }}
import { usePermissions } from '../../auth/usePermissions';

{{- end }}

{{/* Inside the component */}}
{{- if .Auth.Roles }}
const { hasPermission } = usePermissions();
{{- end }}

{{- range .View.List.Actions.Primary }}
{{- if .Permissions }}
{hasPermission({{ .Permissions | toJSArray }}) && (
{{- end }}
  <ActionButton label="{{ .Label }}" icon="{{ .Icon }}" ... />
{{- if .Permissions }}
)}
{{- end }}
{{- end }}
```

---

## 7. Adding New Templates

### 7.1 Workflow

```
1. Create the template file in the appropriate directory
2. Add an entry to manifest.yaml
3. If introducing a new ComponentKind, register it in engine/component.go
4. Write a test fixture (YAML spec → expected output)
5. Run the test suite
```

### 7.2 Template Testing

```go
// internal/registry/registry_test.go

func TestEntityListTemplate(t *testing.T) {
    reg := loadTestRegistry(t)

    spec := loadFixture(t, "testdata/subcontractor_spec.yaml")
    entity := spec.Entities[0]

    ctx := &resolver.TemplateContext{
        App:    spec.App,
        API:    spec.API,
        Entity: &entity,
        View:   &resolver.ViewContext{List: &entity.Views.List},
    }

    tmpl, err := reg.Resolve(&engine.ComponentNode{
        Kind: engine.KindEntityList,
        Scope: &engine.Scope{Entity: &entity},
    }, engine.TargetReact)
    require.NoError(t, err)

    output, err := tmpl.Execute(ctx)
    require.NoError(t, err)

    // Snapshot test
    golden := loadGolden(t, "testdata/golden/SubcontractorList.tsx")
    assert.Equal(t, golden, output)

    // Structural assertions
    assert.Contains(t, output, "useQuery")
    assert.Contains(t, output, "'company_name'")
    assert.Contains(t, output, "EnumBadge")
    assert.NotContains(t, output, "TODO")
    assert.NotContains(t, output, "undefined")
}
```

### 7.3 Template Linting

```go
// Templates are linted for:

type TemplateLintRule struct {
    Name    string
    Check   func(tmpl *Template, output string) []LintError
}

var DefaultLintRules = []TemplateLintRule{
    {
        Name: "no_hardcoded_api_paths",
        // API paths should come from Entity.APIResource, not hardcoded
    },
    {
        Name: "no_missing_error_handling",
        // Every useQuery must have error state handling
    },
    {
        Name: "no_missing_loading_state",
        // Every data fetch must have loading state handling
    },
    {
        Name: "no_unused_imports",
        // All imports must be used in the output
    },
    {
        Name: "permission_checks_present",
        // Actions with permissions must have permission guards
    },
    {
        Name: "accessibility_labels",
        // Interactive elements must have aria labels or visible labels
    },
}
```

---

## 8. Dependency Management

### 8.1 Dependency Aggregation

Each template declares its npm/pub dependencies. The config template (`package.json.tmpl`) aggregates them:

```go
// internal/generate/deps.go

// CollectDependencies walks the resolved tree and aggregates all
// package dependencies declared by templates.
func CollectDependencies(tree *engine.ResolvedTree) map[string]string {
    deps := make(map[string]string)

    tree.Walk(func(node *engine.ResolvedNode) {
        if node.Template.Dependencies.Packages != nil {
            for pkg, version := range node.Template.Dependencies.Packages {
                // Use the highest version if there's a conflict
                if existing, ok := deps[pkg]; ok {
                    deps[pkg] = higherSemver(existing, version)
                } else {
                    deps[pkg] = version
                }
            }
        }
    })

    return deps
}
```

### 8.2 Generated package.json

```go-template
{{/* react/config/package.json.tmpl */}}
{
  "name": "{{ .App.Name }}",
  "version": "{{ .App.Version }}",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.0.0",
    {{- range $pkg, $ver := collectDeps .Analysis.ResolvedTree }}
    {{ $pkg | quote }}: {{ $ver | quote }},
    {{- end }}
    "lucide-react": "^0.300.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

---

## 9. Summary: How It All Fits Together

```
app.yaml                    Template Library                Output
────────                    ────────────────                ──────

  ┌─ entities ──────┐       ┌─ manifest.yaml ────┐
  │  Subcontractor  │       │  indexes all        │
  │  WorkOrder      │       │  templates by       │
  │  Document       │       │  kind + target      │
  └─────────────────┘       └─────────────────────┘
          │                          │
          ▼                          ▼
  ┌─────────────────────────────────────────────┐
  │              Rendering Pipeline              │
  │                                             │
  │  1. Parse YAML → spec.AppSpec               │
  │  2. Analyze → EntityIndex, RouteTable       │
  │  3. Build → ComponentTree (abstract)        │
  │  4. Resolve → match nodes to templates      │
  │  5. Build context → TemplateContext per node │
  │  6. Execute templates → output              │
  └─────────────┬──────────────────┬────────────┘
                │                  │
         Serve Mode          Generate Mode
                │                  │
    ┌───────────▼──────┐  ┌───────▼───────────┐
    │ JSON tree sent   │  │ Files written to   │
    │ to JS runtime    │  │ output directory   │
    │ which renders    │  │                    │
    │ dynamically      │  │ src/generated/     │
    │                  │  │ src/pages/         │
    │ Hot-reloads on   │  │ src/components/    │
    │ YAML change      │  │ package.json       │
    └──────────────────┘  └────────────────────┘
```
