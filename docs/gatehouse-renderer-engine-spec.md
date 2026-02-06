# GateHouse Renderer Engine — Architecture Specification

## Overview

The Renderer Engine is a Go service that sits between the UI YAML specification and the browser. It operates in **two modes**:

1. **Serve Mode** (development/review): Interprets the YAML at runtime and serves a fully functional application for rapid stakeholder review. No build step required.
2. **Generate Mode** (production): Reads the YAML and emits framework-specific source code (React, Svelte, or Flutter) that developers own, customize, and deploy.

Both modes share the same YAML parser, template resolution, and composition logic. The difference is the output target.

```
┌──────────────┐     ┌────────────────────────────────────────────┐
│              │     │           Renderer Engine (Go)              │
│  app.yaml    │────▶│                                            │
│  (UI Spec)   │     │  ┌──────────┐  ┌───────────┐  ┌────────┐ │
│              │     │  │  Parser   │─▶│  Resolver  │─▶│ Output │ │
└──────────────┘     │  └──────────┘  └───────────┘  └────────┘ │
                     │                                    │  │    │
┌──────────────┐     │  ┌──────────────────────────┐     │  │    │
│  Template    │────▶│  │  Template Registry        │─────┘  │    │
│  Library     │     │  └──────────────────────────┘        │    │
└──────────────┘     │                                       │    │
                     │  ┌──────────────┐  ┌──────────────┐  │    │
                     │  │ Serve Mode   │  │ Generate Mode │◀─┘    │
                     │  │ (Live App)   │  │ (Source Code) │       │
                     │  └──────┬───────┘  └──────┬───────┘       │
                     └─────────┼─────────────────┼───────────────┘
                               │                 │
                          Browser/App      ./output/src/
```

---

## 1. Service Architecture

### 1.1 Process Model

```
renderer/
├── cmd/
│   ├── serve/           # Serve mode entry point
│   │   └── main.go
│   └── generate/        # Generate mode entry point
│       └── main.go
├── internal/
│   ├── parser/          # YAML parsing and validation
│   │   ├── parser.go
│   │   ├── schema.go    # Go structs matching the YAML schema
│   │   └── validate.go
│   ├── resolver/        # Template resolution and composition
│   │   ├── resolver.go
│   │   ├── context.go   # Data context for template rendering
│   │   ├── expressions.go  # {{template}} expression evaluator
│   │   └── pipeline.go
│   ├── registry/        # Template storage and retrieval
│   │   ├── registry.go
│   │   ├── loader.go    # Loads from filesystem / embedded / remote
│   │   └── cache.go
│   ├── serve/           # HTTP server for serve mode
│   │   ├── server.go
│   │   ├── routes.go
│   │   ├── middleware.go
│   │   ├── sse.go       # Server-sent events for hot reload
│   │   └── proxy.go     # API proxy to backend
│   ├── generate/        # Code generation for generate mode
│   │   ├── generator.go
│   │   ├── react/       # React-specific output
│   │   ├── svelte/      # Svelte-specific output
│   │   └── flutter/     # Flutter-specific output
│   └── engine/          # Shared rendering engine
│       ├── engine.go
│       ├── component.go # Component tree abstraction
│       └── props.go     # Prop resolution and type coercion
├── templates/           # Built-in template library
│   ├── core/
│   ├── react/
│   ├── svelte/
│   └── flutter/
├── pkg/
│   └── spec/            # Public types for the UI spec schema
│       ├── app.go
│       ├── entity.go
│       ├── field.go
│       ├── view.go
│       └── page.go
└── go.mod
```

### 1.2 Core Interfaces

```go
// pkg/spec/spec.go — The parsed UI specification

package spec

type AppSpec struct {
    App           AppMeta           `yaml:"app"`
    Auth          AuthConfig        `yaml:"auth"`
    API           APIConfig         `yaml:"api"`
    Shell         ShellConfig       `yaml:"shell"`
    Navigation    NavigationConfig  `yaml:"navigation"`
    Entities      []Entity          `yaml:"entities"`
    Pages         []Page            `yaml:"pages"`
    Behaviors     BehaviorConfig    `yaml:"behaviors"`
    Responsive    ResponsiveConfig  `yaml:"responsive"`
    Accessibility A11yConfig        `yaml:"accessibility"`
}

type Entity struct {
    Name              string          `yaml:"name"`
    APIResource       string          `yaml:"api_resource"`
    DisplayName       string          `yaml:"display_name"`
    DisplayNamePlural string          `yaml:"display_name_plural"`
    Icon              string          `yaml:"icon"`
    LabelField        string          `yaml:"label_field"`
    SubtitleField     string          `yaml:"subtitle_field,omitempty"`
    StatusField       string          `yaml:"status_field,omitempty"`
    Fields            []Field         `yaml:"fields"`
    StateMachine      *StateMachine   `yaml:"state_machine,omitempty"`
    Relationships     []Relationship  `yaml:"relationships,omitempty"`
    Views             EntityViews     `yaml:"views"`
    ComputedFields    []ComputedField `yaml:"computed_fields,omitempty"`
}
```

```go
// internal/engine/engine.go — Core rendering engine interface

package engine

import "github.com/gatehouse/renderer/pkg/spec"

// Engine is the core abstraction that both serve and generate modes implement.
type Engine interface {
    // LoadSpec parses and validates the YAML specification.
    LoadSpec(path string) (*spec.AppSpec, error)

    // BuildComponentTree converts the spec into an abstract component tree.
    // This tree is framework-agnostic — it describes WHAT to render, not HOW.
    BuildComponentTree(appSpec *spec.AppSpec) (*ComponentTree, error)

    // Resolve applies template resolution to the component tree,
    // selecting concrete templates for each abstract component.
    Resolve(tree *ComponentTree, target TargetFramework) (*ResolvedTree, error)
}

// TargetFramework identifies the output framework.
type TargetFramework string

const (
    TargetReact   TargetFramework = "react"
    TargetSvelte  TargetFramework = "svelte"
    TargetFlutter TargetFramework = "flutter"
)

// ComponentTree is the framework-agnostic intermediate representation.
// Each node represents a UI concept (list view, form, nav item, chart)
// that will be resolved to a concrete template.
type ComponentTree struct {
    Root     *ComponentNode
    Metadata TreeMetadata
}

type ComponentNode struct {
    // What kind of component this is (determines which template to use)
    Kind       ComponentKind
    // Props derived from the YAML spec (field definitions, config, etc.)
    Props      map[string]any
    // Child components
    Children   []*ComponentNode
    // Which entity/page this component belongs to (for context)
    Scope      *Scope
    // Conditions for rendering (permissions, responsive rules)
    Conditions []RenderCondition
}

type ComponentKind string

const (
    // Layout components
    KindAppShell       ComponentKind = "app_shell"
    KindSidebar        ComponentKind = "sidebar"
    KindHeader         ComponentKind = "header"
    KindPage           ComponentKind = "page"
    KindTabLayout      ComponentKind = "tab_layout"
    KindTab            ComponentKind = "tab"
    KindSection        ComponentKind = "section"
    KindTwoColumn      ComponentKind = "two_column"

    // Entity view components
    KindEntityList     ComponentKind = "entity_list"
    KindDataTable      ComponentKind = "data_table"
    KindFilterPanel    ComponentKind = "filter_panel"
    KindSearchBar      ComponentKind = "search_bar"
    KindEntityDetail   ComponentKind = "entity_detail"
    KindDetailHeader   ComponentKind = "detail_header"
    KindStatBadge      ComponentKind = "stat_badge"
    KindActivityFeed   ComponentKind = "activity_feed"

    // Form components
    KindCreateForm     ComponentKind = "create_form"
    KindEditForm       ComponentKind = "edit_form"
    KindSteppedForm    ComponentKind = "stepped_form"
    KindFormStep       ComponentKind = "form_step"
    KindFormSection    ComponentKind = "form_section"

    // Field components (resolved per field type)
    KindFieldString    ComponentKind = "field_string"
    KindFieldEnum      ComponentKind = "field_enum"
    KindFieldDate      ComponentKind = "field_date"
    KindFieldReference ComponentKind = "field_reference"
    KindFieldCurrency  ComponentKind = "field_currency"
    KindFieldRichText  ComponentKind = "field_richtext"
    KindFieldImage     ComponentKind = "field_image"
    KindFieldFile      ComponentKind = "field_file"
    KindFieldAddress   ComponentKind = "field_address"
    KindFieldInlineTable ComponentKind = "field_inline_table"

    // Display components (read-only field rendering)
    KindDisplayString  ComponentKind = "display_string"
    KindDisplayEnum    ComponentKind = "display_enum"
    KindDisplayDate    ComponentKind = "display_date"
    KindDisplayCurrency ComponentKind = "display_currency"
    KindDisplayStarRating ComponentKind = "display_star_rating"
    KindDisplayBadge   ComponentKind = "display_badge"
    KindDisplayAvatar  ComponentKind = "display_avatar"

    // Action components
    KindActionButton   ComponentKind = "action_button"
    KindBulkActions    ComponentKind = "bulk_actions"
    KindStateTransition ComponentKind = "state_transition"
    KindConfirmDialog  ComponentKind = "confirm_dialog"
    KindTransitionForm ComponentKind = "transition_form"

    // Dashboard / widget components
    KindStatCards      ComponentKind = "stat_cards"
    KindChart          ComponentKind = "chart"
    KindEntityTable    ComponentKind = "entity_table_widget"
    KindReportBuilder  ComponentKind = "report_builder"
    KindSettingsForm   ComponentKind = "settings_form"

    // Navigation
    KindNavItem        ComponentKind = "nav_item"
    KindNavGroup       ComponentKind = "nav_group"
    KindBreadcrumbs    ComponentKind = "breadcrumbs"
)
```

### 1.3 Rendering Pipeline

The pipeline is the same for both modes — the difference is only in the final output stage.

```
                      ┌─────────────────────────────────────────┐
                      │            Rendering Pipeline            │
                      │                                         │
  app.yaml ──────────▶│  1. Parse     Validate YAML, produce    │
                      │               spec.AppSpec struct        │
                      │                                         │
                      │  2. Analyze   Resolve references,       │
                      │               compute dependency graph,  │
                      │               validate cross-references  │
                      │                                         │
                      │  3. Build     Convert spec into abstract │
                      │               ComponentTree              │
                      │                                         │
                      │  4. Resolve   Select templates for each  │
                      │               ComponentNode based on     │
                      │               target framework + kind    │
                      │                                         │
                      │  5. Output    Serve mode: render to HTML │
                      │               Generate mode: emit files  │
                      └─────────────────────────────────────────┘
```

```go
// internal/resolver/pipeline.go

package resolver

import (
    "github.com/gatehouse/renderer/internal/engine"
    "github.com/gatehouse/renderer/internal/registry"
    "github.com/gatehouse/renderer/pkg/spec"
)

type Pipeline struct {
    registry *registry.Registry
    target   engine.TargetFramework
}

// Run executes the full rendering pipeline.
func (p *Pipeline) Run(appSpec *spec.AppSpec) (*engine.ResolvedTree, error) {
    // Step 1: Analyze — build entity index, resolve references
    analysis, err := p.analyze(appSpec)
    if err != nil {
        return nil, fmt.Errorf("analysis failed: %w", err)
    }

    // Step 2: Build abstract component tree
    tree, err := p.buildTree(appSpec, analysis)
    if err != nil {
        return nil, fmt.Errorf("tree build failed: %w", err)
    }

    // Step 3: Resolve templates for each node
    resolved, err := p.resolveTemplates(tree)
    if err != nil {
        return nil, fmt.Errorf("template resolution failed: %w", err)
    }

    return resolved, nil
}

// analyze creates an index of all entities, fields, relationships
// and validates cross-references.
func (p *Pipeline) analyze(appSpec *spec.AppSpec) (*Analysis, error) {
    a := &Analysis{
        EntityIndex:    make(map[string]*spec.Entity),
        FieldIndex:     make(map[string]map[string]*spec.Field),
        RelationIndex:  make(map[string][]spec.Relationship),
        RouteTable:     make(map[string]RouteEntry),
    }

    for i := range appSpec.Entities {
        entity := &appSpec.Entities[i]
        a.EntityIndex[entity.Name] = entity

        // Index fields
        a.FieldIndex[entity.Name] = make(map[string]*spec.Field)
        for j := range entity.Fields {
            field := &entity.Fields[j]
            a.FieldIndex[entity.Name][field.Name] = field
        }

        // Build routes
        a.RouteTable[entity.APIResource] = RouteEntry{
            Entity:   entity.Name,
            ListPath: fmt.Sprintf("/%s", toKebab(entity.DisplayNamePlural)),
            DetailPath: fmt.Sprintf("/%s/:id", toKebab(entity.DisplayNamePlural)),
            CreatePath: fmt.Sprintf("/%s/new", toKebab(entity.DisplayNamePlural)),
            EditPath: fmt.Sprintf("/%s/:id/edit", toKebab(entity.DisplayNamePlural)),
        }
    }

    // Validate all cross-references
    if errs := a.validateReferences(appSpec); len(errs) > 0 {
        return nil, &ValidationErrors{Errors: errs}
    }

    return a, nil
}

// buildTree creates the abstract component tree from the spec.
func (p *Pipeline) buildTree(appSpec *spec.AppSpec, analysis *Analysis) (*engine.ComponentTree, error) {
    root := &engine.ComponentNode{
        Kind: engine.KindAppShell,
        Props: map[string]any{
            "app_name":    appSpec.App.DisplayName,
            "theme":       appSpec.App.Theme,
            "shell":       appSpec.Shell,
            "auth":        appSpec.Auth,
        },
    }

    // Build navigation subtree
    navNode := p.buildNavigation(appSpec.Navigation, analysis)
    root.Children = append(root.Children, navNode)

    // Build page subtrees for each entity
    for _, entity := range appSpec.Entities {
        pages := p.buildEntityPages(&entity, analysis)
        root.Children = append(root.Children, pages...)
    }

    // Build custom page subtrees
    for _, page := range appSpec.Pages {
        pageNode := p.buildCustomPage(&page, analysis)
        root.Children = append(root.Children, pageNode)
    }

    return &engine.ComponentTree{Root: root}, nil
}
```

---

## 2. Serve Mode

### 2.1 How It Works

Serve mode runs a Go HTTP server that:

1. Parses `app.yaml` on startup (and watches for changes)
2. Builds the component tree once
3. Serves a minimal SPA shell (HTML + JS runtime)
4. The JS runtime fetches the resolved component tree as JSON and renders it client-side
5. API requests are proxied through to the real backend

```
Browser                     Renderer (Go)                Backend API
  │                              │                            │
  │  GET /                       │                            │
  │─────────────────────────────▶│                            │
  │  ◀─── SPA shell (index.html) │                            │
  │       + runtime.js           │                            │
  │                              │                            │
  │  GET /_renderer/spec         │                            │
  │─────────────────────────────▶│                            │
  │  ◀─── resolved component     │                            │
  │       tree (JSON)            │                            │
  │                              │                            │
  │  GET /api/v1/subcontractors  │                            │
  │─────────────────────────────▶│  GET /api/v1/subcontractors│
  │                              │───────────────────────────▶│
  │                              │  ◀── JSON response         │
  │  ◀─── proxied response       │                            │
  │                              │                            │
  │  SSE /_renderer/events       │                            │
  │─────────────────────────────▶│                            │
  │  ◀─── (hot reload on YAML    │                            │
  │        file change)          │                            │
```

### 2.2 Server Implementation

```go
// internal/serve/server.go

package serve

import (
    "context"
    "net/http"
    "github.com/go-chi/chi/v5"
    "github.com/fsnotify/fsnotify"
)

type Server struct {
    engine     *engine.Engine
    registry   *registry.Registry
    specPath   string
    apiBaseURL string
    port       int

    // Current resolved tree (swapped atomically on YAML change)
    currentTree atomic.Pointer[engine.ResolvedTree]

    // SSE hub for hot reload
    sseHub *SSEHub
}

type Config struct {
    SpecPath    string   // Path to app.yaml
    TemplateDir string   // Path to template library
    APIBaseURL  string   // Backend API to proxy to
    Port        int      // Port to serve on (default 3000)
    Target      string   // react | svelte (which runtime to serve)
    WatchMode   bool     // Watch for YAML changes and hot-reload
}

func NewServer(cfg Config) (*Server, error) {
    reg, err := registry.NewRegistry(cfg.TemplateDir)
    if err != nil {
        return nil, fmt.Errorf("failed to load templates: %w", err)
    }

    s := &Server{
        engine:     engine.New(reg),
        registry:   reg,
        specPath:   cfg.SpecPath,
        apiBaseURL: cfg.APIBaseURL,
        port:       cfg.Port,
        sseHub:     NewSSEHub(),
    }

    // Initial parse
    if err := s.loadSpec(); err != nil {
        return nil, err
    }

    // Watch for changes
    if cfg.WatchMode {
        go s.watchSpec()
    }

    return s, nil
}

func (s *Server) Routes() http.Handler {
    r := chi.NewRouter()

    // Middleware
    r.Use(corsMiddleware)
    r.Use(requestIDMiddleware)

    // Renderer API — consumed by the JS runtime
    r.Route("/_renderer", func(r chi.Router) {
        r.Get("/spec", s.handleGetSpec)           // Full resolved tree
        r.Get("/spec/{entity}", s.handleGetEntity) // Single entity spec
        r.Get("/events", s.sseHub.Handler)         // Hot reload SSE
        r.Get("/health", s.handleHealth)
    })

    // API proxy — forwards to the real backend
    r.Handle("/api/*", s.apiProxy())

    // SPA shell — serves index.html + runtime for all other routes
    r.Get("/*", s.serveSPA)

    return r
}

// handleGetSpec returns the full resolved component tree as JSON.
// The JS runtime uses this to know what to render.
func (s *Server) handleGetSpec(w http.ResponseWriter, r *http.Request) {
    tree := s.currentTree.Load()
    if tree == nil {
        http.Error(w, "spec not loaded", http.StatusServiceUnavailable)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(tree.ToJSON())
}

// watchSpec watches app.yaml for changes and hot-reloads.
func (s *Server) watchSpec() {
    watcher, err := fsnotify.NewWatcher()
    if err != nil {
        log.Fatal(err)
    }
    defer watcher.Close()

    watcher.Add(s.specPath)

    for {
        select {
        case event := <-watcher.Events:
            if event.Op&fsnotify.Write == fsnotify.Write {
                log.Info("spec changed, reloading...")
                if err := s.loadSpec(); err != nil {
                    log.Error("reload failed", "error", err)
                    s.sseHub.Broadcast(SSEEvent{
                        Type: "error",
                        Data: map[string]string{"message": err.Error()},
                    })
                } else {
                    s.sseHub.Broadcast(SSEEvent{
                        Type: "reload",
                        Data: map[string]string{"message": "spec updated"},
                    })
                }
            }
        }
    }
}

// loadSpec parses the YAML and rebuilds the component tree.
func (s *Server) loadSpec() error {
    appSpec, err := s.engine.LoadSpec(s.specPath)
    if err != nil {
        return fmt.Errorf("parse error: %w", err)
    }

    tree, err := s.engine.BuildComponentTree(appSpec)
    if err != nil {
        return fmt.Errorf("build error: %w", err)
    }

    resolved, err := s.engine.Resolve(tree, engine.TargetReact)
    if err != nil {
        return fmt.Errorf("resolve error: %w", err)
    }

    s.currentTree.Store(resolved)
    return nil
}
```

### 2.3 The JavaScript Runtime

The serve mode ships a small JS runtime that knows how to render the component tree. This is **not generated per-project** — it's a universal renderer that interprets the tree.

```
runtime/
├── src/
│   ├── index.ts              # Entry point, fetches spec, bootstraps app
│   ├── renderer.ts           # Walks component tree, renders React components
│   ├── components/           # Library of renderable components
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TabLayout.tsx
│   │   │   └── PageHeader.tsx
│   │   ├── entity/
│   │   │   ├── EntityList.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── FilterPanel.tsx
│   │   │   ├── EntityDetail.tsx
│   │   │   ├── DetailHeader.tsx
│   │   │   └── EmptyState.tsx
│   │   ├── form/
│   │   │   ├── DynamicForm.tsx
│   │   │   ├── SteppedForm.tsx
│   │   │   ├── FormSection.tsx
│   │   │   └── fields/       # One component per field type
│   │   │       ├── StringField.tsx
│   │   │       ├── EnumField.tsx
│   │   │       ├── DateField.tsx
│   │   │       ├── ReferenceField.tsx
│   │   │       ├── CurrencyField.tsx
│   │   │       ├── RichTextField.tsx
│   │   │       ├── ImageField.tsx
│   │   │       ├── FileField.tsx
│   │   │       ├── AddressField.tsx
│   │   │       └── InlineTableField.tsx
│   │   ├── display/          # Read-only display per field type
│   │   │   ├── StringDisplay.tsx
│   │   │   ├── EnumBadge.tsx
│   │   │   ├── DateDisplay.tsx
│   │   │   ├── CurrencyDisplay.tsx
│   │   │   ├── StarRating.tsx
│   │   │   └── Avatar.tsx
│   │   ├── action/
│   │   │   ├── ActionButton.tsx
│   │   │   ├── StateTransition.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── BulkActions.tsx
│   │   └── widget/
│   │       ├── StatCards.tsx
│   │       ├── Chart.tsx
│   │       ├── EntityTableWidget.tsx
│   │       ├── ActivityFeed.tsx
│   │       └── ReportBuilder.tsx
│   ├── data/
│   │   ├── apiClient.ts      # Generic API client using spec.api config
│   │   ├── useEntityList.ts  # Generic hook: fetches list with filters/sort/pagination
│   │   ├── useEntityDetail.ts
│   │   ├── useEntityMutation.ts
│   │   └── useTransition.ts  # Executes state machine transitions
│   ├── auth/
│   │   ├── provider.ts       # OIDC/OAuth2 provider from spec.auth config
│   │   └── usePermissions.ts # Checks role-based visibility
│   └── router/
│       └── specRouter.ts     # Generates routes from spec entities + pages
├── package.json
└── vite.config.ts
```

The key pattern in the runtime:

```typescript
// runtime/src/renderer.ts

import { ComponentNode, ComponentKind } from './types';

// Registry of React components keyed by ComponentKind
const COMPONENT_MAP: Record<ComponentKind, React.ComponentType<any>> = {
  app_shell: AppShell,
  sidebar: Sidebar,
  entity_list: EntityList,
  data_table: DataTable,
  filter_panel: FilterPanel,
  entity_detail: EntityDetail,
  create_form: DynamicForm,
  edit_form: DynamicForm,
  stepped_form: SteppedForm,
  field_string: StringField,
  field_enum: EnumField,
  field_date: DateField,
  // ... all component kinds
};

/**
 * Recursively renders a component tree node.
 * This is the core of the runtime renderer.
 */
export function renderNode(node: ComponentNode): React.ReactNode {
  const Component = COMPONENT_MAP[node.kind];
  if (!Component) {
    console.warn(`Unknown component kind: ${node.kind}`);
    return null;
  }

  // Check render conditions (permissions, responsive)
  if (!shouldRender(node.conditions)) {
    return null;
  }

  // Render children recursively
  const children = node.children?.map((child, i) => (
    <React.Fragment key={child.id || i}>
      {renderNode(child)}
    </React.Fragment>
  ));

  return <Component {...node.props}>{children}</Component>;
}
```

---

## 3. Generate Mode

### 3.1 How It Works

Generate mode walks the same component tree but instead of rendering at runtime, it emits source files that developers compile and deploy.

```
$ gatehouse generate --spec app.yaml --target react --output ./frontend

Parsing app.yaml...                     ✓
Validating specification...             ✓
Building component tree...              ✓
Resolving templates (react)...          ✓

Generating files:
  src/App.tsx                           ✓
  src/routes.tsx                        ✓
  src/components/layout/AppShell.tsx    ✓
  src/components/layout/Sidebar.tsx     ✓
  src/pages/Dashboard.tsx               ✓
  src/pages/subcontractors/List.tsx     ✓
  src/pages/subcontractors/Detail.tsx   ✓
  src/pages/subcontractors/Create.tsx   ✓
  src/pages/subcontractors/Edit.tsx     ✓
  src/pages/work-orders/List.tsx        ✓
  src/pages/work-orders/Detail.tsx      ✓
  ...
  src/hooks/useSubcontractors.ts        ✓
  src/hooks/useWorkOrders.ts            ✓
  src/lib/apiClient.ts                  ✓
  src/lib/auth.ts                       ✓
  package.json                          ✓
  vite.config.ts                        ✓
  tailwind.config.ts                    ✓

Generated 47 files in ./frontend
```

### 3.2 Generator Interface

```go
// internal/generate/generator.go

package generate

import (
    "github.com/gatehouse/renderer/internal/engine"
)

// Generator emits source files for a specific framework.
type Generator interface {
    // Generate walks the resolved tree and produces output files.
    Generate(tree *engine.ResolvedTree, outputDir string) (*GenerateResult, error)
}

type GenerateResult struct {
    Files    []GeneratedFile
    Warnings []string
}

type GeneratedFile struct {
    Path     string          // Relative path within output dir
    Content  []byte          // File content
    Source   FileSource      // What generated this file
    Editable bool            // If true, won't be overwritten on re-generate
}

type FileSource string

const (
    SourceTemplate  FileSource = "template"   // From a template
    SourceGenerated FileSource = "generated"  // Programmatically generated (routes, hooks)
    SourceStatic    FileSource = "static"     // Copied as-is (config files, assets)
)
```

### 3.3 File Ownership Model

Generated files follow a two-tier ownership model:

```
src/
├── generated/                # ⚠️ REGENERATED — do not edit
│   ├── types.ts              # Entity types from spec
│   ├── apiClient.ts          # API client from spec.api
│   ├── routes.generated.tsx  # Route definitions
│   └── hooks/                # Data hooks per entity
│       ├── useSubcontractors.ts
│       └── useWorkOrders.ts
├── components/               # ✅ EDITABLE — your customizations
│   ├── layout/
│   │   └── AppShell.tsx      # Generated once, then yours
│   └── overrides/            # Override any generated component
│       └── SubcontractorDetail.tsx
├── pages/                    # ✅ EDITABLE — generated scaffolds
│   ├── Dashboard.tsx
│   └── subcontractors/
│       ├── List.tsx
│       ├── Detail.tsx
│       └── Create.tsx
└── lib/                      # ✅ EDITABLE — utilities
    └── auth.ts
```

The `generated/` directory is fully owned by the renderer and can be re-generated at any time. Everything outside it is scaffolded once and then belongs to the developer.

### 3.4 Re-generation Safety

```go
// internal/generate/safety.go

// When re-generating, the generator:
// 1. Always overwrites files in generated/
// 2. Never overwrites files outside generated/ that already exist
// 3. Creates new files outside generated/ only if they don't exist
// 4. Produces a diff report showing what changed

type RegenStrategy string

const (
    RegenAlwaysOverwrite RegenStrategy = "always"   // generated/ directory
    RegenCreateOnly      RegenStrategy = "create"   // scaffolded files
    RegenNever           RegenStrategy = "never"     // user-created files
)

func (g *ReactGenerator) fileStrategy(path string) RegenStrategy {
    if strings.HasPrefix(path, "src/generated/") {
        return RegenAlwaysOverwrite
    }
    return RegenCreateOnly
}
```

---

## 4. Expression Evaluator

The YAML spec contains template expressions (`{{record.company_name}}`) and conditional expressions (`value < today + 30d`). The engine evaluates these.

```go
// internal/resolver/expressions.go

package resolver

import "time"

// ExpressionContext holds the variables available during expression evaluation.
type ExpressionContext struct {
    Record     map[string]any  // Current entity record
    Auth       AuthContext      // Current user info
    Entity     EntityContext    // Entity metadata
    Transition *TransitionCtx  // Set during state transitions
    Today      time.Time
}

// TemplateExpression handles {{double_brace}} interpolation.
// Used in: labels, titles, confirmation messages, tooltip text.
//
// Syntax:
//   {{record.field_name}}           — field value
//   {{record.field_name | mask}}    — piped through filter
//   {{entity.display_name}}         — entity metadata
//   {{auth.claims.tenant_id}}       — auth context
//   {{count}}                       — bulk action count
//
// Filters:
//   mask       — applies sensitive field masking ("12-***4567")
//   lowercase  — lowercases the string
//   uppercase  — uppercases the string
//   truncate:N — truncates to N characters with ellipsis
//   date:FMT   — formats a date value
//   currency   — formats as currency using app.i18n.currency
type TemplateExpression struct {
    Raw string
}

func (te *TemplateExpression) Evaluate(ctx *ExpressionContext) (string, error) {
    // Parse {{...}} blocks, resolve dot paths, apply filters
    // ...
}

// ConditionalExpression handles boolean conditions.
// Used in: display_rules, guards.field_check, computed_fields.expression
//
// Syntax:
//   field > value               — comparison
//   field == 'string'           — equality
//   field < today + 30d         — date arithmetic
//   field != null               — null check
//   expr1 && expr2              — logical AND
//   expr1 || expr2              — logical OR
type ConditionalExpression struct {
    Raw string
}

func (ce *ConditionalExpression) Evaluate(ctx *ExpressionContext) (bool, error) {
    // Parse, evaluate with context
    // ...
}

// ComputeExpression handles arithmetic for computed/virtual fields.
// Used in: computed_fields.expression, inline_table footer aggregates
//
// Syntax:
//   quantity * unit_price       — arithmetic
//   SUM(line_items.total)       — aggregation
//   dateDiff(field, today, 'days') — date functions
type ComputeExpression struct {
    Raw string
}

func (ce *ComputeExpression) Evaluate(ctx *ExpressionContext) (any, error) {
    // ...
}
```

---

## 5. API Proxy (Serve Mode)

The proxy forwards all `/api/*` requests to the real backend, injecting auth headers.

```go
// internal/serve/proxy.go

package serve

import (
    "net/http"
    "net/http/httputil"
    "net/url"
)

func (s *Server) apiProxy() http.Handler {
    target, _ := url.Parse(s.apiBaseURL)

    proxy := &httputil.ReverseProxy{
        Director: func(req *http.Request) {
            req.URL.Scheme = target.Scheme
            req.URL.Host = target.Host
            req.Host = target.Host

            // Forward auth headers from the browser
            // The runtime JS client handles token acquisition
        },
        ModifyResponse: func(resp *http.Response) error {
            // Add CORS headers for serve mode
            resp.Header.Set("Access-Control-Allow-Origin", "*")
            return nil
        },
    }

    return proxy
}
```

---

## 6. CLI Interface

```
gatehouse-renderer

COMMANDS:
  serve       Start the development renderer server
  generate    Generate framework source code from spec
  validate    Validate a UI spec YAML without generating

SERVE:
  gatehouse-renderer serve \
    --spec ./app.yaml \
    --templates ./templates \
    --api-url http://localhost:8080 \
    --port 3000 \
    --target react \
    --watch

GENERATE:
  gatehouse-renderer generate \
    --spec ./app.yaml \
    --templates ./templates \
    --target react \
    --output ./frontend \
    --force          # overwrite editable files too

VALIDATE:
  gatehouse-renderer validate \
    --spec ./app.yaml \
    --templates ./templates \
    --target react
```

---

## 7. Extension Points

### 7.1 Custom Components

Developers can register custom components that the YAML spec can reference:

```yaml
# In app.yaml, a custom widget on the dashboard
pages:
  - id: dashboard
    widgets:
      - type: custom
        component: ProjectMap     # matches a registered custom component
        props:
          height: 400
          zoom: 12
```

In serve mode, custom components are loaded from a user directory. In generate mode, they produce a stub file the developer implements.

### 7.2 Template Overrides

Any built-in template can be overridden per-project:

```
project/
├── app.yaml
└── templates/
    └── overrides/
        └── react/
            └── entity_list.tsx.tmpl   # overrides the built-in list template
```

### 7.3 Plugin System

Plugins can add new field types, component kinds, and display modes:

```go
// A plugin that adds a "map_view" component kind
type MapViewPlugin struct{}

func (p *MapViewPlugin) Register(reg *registry.Registry) {
    reg.RegisterKind("map_view", registry.KindConfig{
        Category:    "widget",
        Description: "Interactive map display",
        Props: []registry.PropDef{
            {Name: "latitude_field", Type: "string", Required: true},
            {Name: "longitude_field", Type: "string", Required: true},
            {Name: "zoom", Type: "integer", Default: 12},
        },
        Templates: map[engine.TargetFramework]string{
            engine.TargetReact:  "plugins/map_view/react.tmpl",
            engine.TargetSvelte: "plugins/map_view/svelte.tmpl",
        },
    })
}
```
