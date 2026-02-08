# Getting Started with GateHouse UI

This guide walks you through running GateHouse UI and creating your first spec in under 5 minutes.

## Prerequisites

- **Go 1.21+** — [install](https://go.dev/dl/)
- **Node.js 20+** with **pnpm** — `npm install -g pnpm`

## Step 1: Run an Example

```bash
# Clone the repo
git clone https://github.com/your-org/gatehouse-ui.git
cd gatehouse-ui

# Start the Go server with the SaaS admin example
go run ./cmd/serve --spec examples/saas-admin/spec.yaml --data examples/saas-admin/data.json
```

In a second terminal:

```bash
cd runtime
pnpm install
pnpm dev
```

Open **http://localhost:5174**. You should see a full admin panel with customers, subscriptions, invoices, and support tickets.

## Step 2: Understand the Spec

Open `examples/saas-admin/spec.yaml`. The key sections are:

- **`app`** — Name, theme, localization
- **`navigation`** — Sidebar items linking to entities/pages
- **`entities`** — Data models with fields, list/detail views, forms, state machines
- **`pages`** — Custom pages like dashboards with widget layouts

## Step 3: Create Your Own Spec

Create `my-app/spec.yaml`:

```yaml
app:
  name: "my-app"
  display_name: "My App"
  version: "1.0.0"
  theme:
    primary_color: "#2563EB"
    border_radius: md
    density: comfortable

auth:
  provider: oidc
  config:
    issuer: "https://auth.example.com"
    client_id: "my-app"
  roles:
    admin:
      display_name: "Admin"

api:
  base_url: "${API_BASE_URL}"
  version_prefix: "/api/v1"

shell:
  sidebar:
    position: left
    collapsible: true
    width: 260
  header:
    show_breadcrumbs: true
    show_search: true

navigation:
  items:
    - id: tasks
      label: "Tasks"
      icon: check-square
      route: /tasks
      entity: Task

entities:
  - name: Task
    display_name: "Tasks"
    api_resource: /tasks
    icon: check-square
    label_field: title

    fields:
      - { name: id, type: string, primary_key: true, generated: true }
      - { name: title, type: string, display_name: "Title", required: true }
      - { name: status, type: enum, display_name: "Status", values: [
          { value: "todo", label: "To Do", color: "gray" },
          { value: "in_progress", label: "In Progress", color: "blue" },
          { value: "done", label: "Done", color: "green" }
        ]}
      - { name: due_date, type: date, display_name: "Due Date" }

    list_view:
      columns:
        - { field: title, link_to: detail }
        - { field: status }
        - { field: due_date }
      search:
        fields: [title]

    detail_view:
      header:
        title: "{{title}}"
        status_badge: status
      tabs:
        - id: overview
          label: "Details"
          sections:
            - title: "Task Info"
              fields: [title, status, due_date]

    create_form:
      steps:
        - title: "New Task"
          fields: [title, status, due_date]

    state_machine:
      field: status
      initial: todo
      transitions:
        - { name: start, label: "Start", from: [todo], to: in_progress, color: blue }
        - { name: complete, label: "Complete", from: [in_progress], to: done, color: green }
        - { name: reopen, label: "Reopen", from: [done], to: todo, color: gray }
```

Create `my-app/data.json`:

```json
{
  "tasks": [
    { "id": "1", "title": "Set up CI pipeline", "status": "in_progress", "due_date": "2026-02-15" },
    { "id": "2", "title": "Write documentation", "status": "todo", "due_date": "2026-02-20" },
    { "id": "3", "title": "Design landing page", "status": "done", "due_date": "2026-02-01" }
  ]
}
```

Run it:

```bash
go run ./cmd/serve --spec my-app/spec.yaml --data my-app/data.json
```

## Step 4: Connect to a Real API

Replace the mock data with a real API by removing `--data` and setting your API base URL:

```bash
API_BASE_URL=https://api.example.com go run ./cmd/serve --spec my-app/spec.yaml
```

The runtime will call `GET /api/v1/tasks`, `POST /api/v1/tasks`, etc. based on your `api_resource` definitions.

## Next Steps

- Browse the [Spec Reference](spec-reference.md) for all available fields
- Try the [Construction example](../examples/construction/) for state machines and relationships
- Read [CONTRIBUTING.md](../CONTRIBUTING.md) to add custom components
