# Micro Frontend Composition

GateHouse UI supports composing multiple UI specs into a single application. Each microservice publishes its own YAML spec defining entities, pages, and navigation items. A Go aggregator merges them into one `ComponentTree` that renderers consume unchanged.

## Why Spec-Level Composition?

Unlike traditional micro frontends (separate bundles, shared dependencies, framework conflicts), GateHouse composes at the **data layer** — YAML specs are merged, not JavaScript bundles. One unified renderer guarantees consistent UX across all services.

## Quick Start

```bash
go run cmd/serve/main.go --compose examples/composed/compose.yaml --watch
```

## Config Format (`compose.yaml`)

```yaml
host:
  name: portal
  spec_path: ./specs/host.yaml       # owns app shell, theme, auth
  data_path: ./data/host-data.json

services:
  - name: orders
    spec_url: http://orders-svc:8080/_ui/spec  # remote
    data_url: http://orders-svc:8080            # proxy target
    prefix: /orders                              # API prefix routing
    nav_group: Operations                        # sidebar group
    nav_order: 10
    optional: false

  - name: billing
    spec_path: ./specs/billing.yaml              # local file
    data_path: ./data/billing.json
    prefix: /billing
    nav_group: Operations
    nav_order: 15
    watch: true

  - name: users
    spec_url: http://users-svc:8081/_ui/spec
    data_url: http://users-svc:8081
    prefix: /users
    nav_group: Administration
    nav_order: 20
    optional: true                               # app works if this is down
```

### Host

The host spec owns the app shell — theme, auth config, shell layout, and any shared navigation items. Remote specs cannot override these.

### Services

Each service contributes:
- **Entities** — list views, detail views, forms
- **Pages** — custom dashboard pages, reports
- **Nav items** — grafted into the host's sidebar

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique service identifier |
| `spec_url` | One of spec_url/spec_path | URL returning JSON ComponentTree or YAML spec |
| `spec_path` | One of spec_url/spec_path | Local file path to YAML spec |
| `data_url` | No | Remote backend URL for API proxy |
| `data_path` | No | Local mock data JSON file |
| `prefix` | No | API prefix for routing (e.g. `/orders`) |
| `nav_group` | No | Sidebar group label |
| `nav_order` | No | Sort order within sidebar (lower = higher) |
| `optional` | No | If true, app works when service is unavailable |
| `watch` | No | Watch local spec file for changes |
| `health_url` | No | Custom health check endpoint |

## Architecture

```
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Host    │  │ Orders  │  │ Users   │
│ spec    │  │ spec    │  │ spec    │
└────┬────┘  └────┬────┘  └────┬────┘
     └─────┬──────┴────────────┘
           │
    ┌──────▼──────┐
    │  Aggregator  │  merge → one ComponentTree
    │  + Proxy     │  route /api/v1/* → backends
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │ ComponentTree│  identical shape to single-spec mode
    └──┬───────┬──┘
       │       │
   React    Flutter
```

## API Routing

In composition mode, API requests are routed by prefix:

- `GET /api/v1/orders/work-orders` → orders service (prefix `/orders`)
- `GET /api/v1/billing/invoices` → billing service (prefix `/billing`)
- `GET /api/v1/customers` → host (no prefix match → falls through)

For mock data, each service's `data_path` creates a separate MockStore. The service prefix is stripped before dispatching, so mock data files use the same resource paths as standalone mode.

## Cross-Service Entity References

Entity references across services (e.g., Orders referencing `Customer` from Users) resolve naturally after composition because all entities end up in the same tree. No additional configuration is needed.

## Health Checking

Remote services are polled every 30 seconds. When a service's health status changes:

- **Optional service goes down**: Its entities/nav items are removed from the tree, SSE notifies renderers
- **Optional service recovers**: Its entities/nav items are re-added, SSE notifies renderers
- **Required service goes down**: Error is logged (initial load would have failed)

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /_renderer/spec` | Composed ComponentTree (same as single-spec mode) |
| `GET /_renderer/services` | Service health status and entity ownership |
| `GET /_renderer/health` | Overall health |

### `/_renderer/services` Response

```json
{
  "mode": "composed",
  "host": "portal",
  "services": [
    {
      "name": "orders",
      "healthy": true,
      "prefix": "/orders",
      "entities": ["WorkOrder", "Trade"]
    },
    {
      "name": "users",
      "healthy": false,
      "prefix": "/users",
      "error": "connection refused"
    }
  ]
}
```

## Collision Detection

The aggregator rejects compositions with:
- **Duplicate entity names** across services
- **Duplicate route paths** across services
- **Duplicate service names** in config
- **Duplicate API prefixes** in config

## Backward Compatibility

- No `--compose` flag → server works exactly as today via `--spec`
- `TreeMetadata.Sources` is `omitempty` — absent in single-spec mode
- Renderers see an identical `ComponentTree` shape
- Existing examples, mock data, SSE, and file watching are unchanged
