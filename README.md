# GateHouse UI

A spec-driven enterprise UI renderer. Define your application in YAML — get a fully functional admin panel with navigation, CRUD, filters, state machines, and dashboards.

```
┌─────────────────────────────────────────────────────────────┐
│                    YAML Spec (spec.yaml)                     │
│  Entities, fields, views, forms, state machines, navigation  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Go Server  │
                    │  (Builder)  │
                    └──────┬──────┘
                           │ Component Tree (JSON)
                    ┌──────┴──────┐
              ┌─────▼─────┐ ┌────▼──────┐
              │   React   │ │  Flutter  │
              │  Runtime  │ │  Runtime  │
              └───────────┘ └───────────┘
```

## Quick Start

```bash
# 1. Start the Go server with an example spec
go run ./cmd/serve --spec examples/construction/spec.yaml --data examples/construction/data.json

# 2. Start the React runtime
cd runtime && pnpm install && pnpm dev

# 3. Open http://localhost:5174
```

## How It Works

1. **Write a YAML spec** describing entities, fields, views, navigation, and workflows
2. **The Go server** parses the spec and builds a component tree
3. **The React (or Flutter) runtime** fetches the tree and renders a complete application

No frontend code required. Change the YAML, refresh the page.

## Features

- **41 component kinds**: data tables, detail views, forms, filters, charts, stat cards, and more
- **State machines**: Define workflows with guards, confirmations, and role-based transitions
- **Responsive**: Mobile drawer sidebar, tablet-friendly data tables
- **Accessible**: WCAG 2.1 AA — skip links, ARIA landmarks, focus management, screen reader announcements
- **Themeable**: Design tokens for colors, spacing, font scale, border radius, and motion preferences
- **Skeleton loading**: Shimmer placeholders for tables, detail views, and stat cards
- **Two runtimes**: React (production-ready) and Flutter (feature-complete)
- **Hot reload**: Edit the spec YAML, see changes instantly via SSE
- **Renderer capability contract**: `GET /_renderer/capabilities` exposes runtime support matrix
- **Parity checker**: `go run ./cmd/parity --strict` validates runtime coverage against engine kinds

## Examples

| Example | Vertical | What it demonstrates |
|---|---|---|
| [`examples/construction/`](examples/construction/) | Construction Management | State machines, guards, relationships, dashboards, stepped forms |
| [`examples/saas-admin/`](examples/saas-admin/) | SaaS Admin Panel | Subscriptions, invoices, currency fields, support tickets |
| [`examples/hr-portal/`](examples/hr-portal/) | HR Portal | Reference fields, two-column layouts, leave request workflows |

Run any example:
```bash
go run ./cmd/serve --spec examples/saas-admin/spec.yaml --data examples/saas-admin/data.json
```

## Spec Overview

```yaml
app:
  name: "my-app"
  theme:
    primary_color: "#1E40AF"
    density: comfortable        # compact | comfortable | spacious
    font_scale: md              # sm | md | lg
    motion_mode: full           # full | reduced | none

entities:
  - name: Product
    api_resource: /products
    fields:
      - { name: name, type: string, required: true }
      - { name: price, type: currency, currency: USD }
      - { name: status, type: enum, values: [...] }
    list_view:
      columns: [...]
      filters: [...]
    detail_view:
      header: { title: "{{name}}" }
      tabs: [...]
    state_machine:
      transitions: [...]
```

See [`docs/spec-reference.md`](docs/spec-reference.md) for the complete field reference.

## Docker

```bash
# Start all services (Go server + React + Flutter)
docker compose up

# Or use Taskfile
task up
```

## Project Structure

```
cmd/serve/            Go server entry point
cmd/parity/           Runtime parity checker (engine vs React/Flutter maps)
internal/engine/      Spec → ComponentTree builder
internal/serve/       HTTP server, SSE hub, mock data store
pkg/spec/             Go structs matching the YAML spec schema
runtime/              React runtime (Vite + React 18 + TailwindCSS)
flutter_runtime/      Flutter runtime (Riverpod + GoRouter)
examples/             Example specs with mock data
docs/                 Spec schema and reference docs
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and how to add components or runtimes.

## License

Apache 2.0 — see [LICENSE](LICENSE).
