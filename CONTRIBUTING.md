# Contributing to GateHouse UI

Thanks for your interest in contributing! This guide covers how to add components, runtimes, and run the project locally.

## Development Setup

### Prerequisites

- Go 1.21+
- Node.js 20+ with pnpm
- (Optional) Flutter 3.x for the Flutter runtime
- (Optional) Docker + Docker Compose for containerized development

### Quick Start

```bash
# Start the Go server with an example spec
go run ./cmd/serve --spec examples/construction/spec.yaml --data examples/construction/data.json

# In another terminal, start the React runtime
cd runtime && pnpm install && pnpm dev
```

The React app runs at `http://localhost:5174` and the Go server at `http://localhost:3000`.

## Project Structure

```
cmd/serve/          Go server entry point
internal/
  engine/           Spec → ComponentTree builder
  parser/           YAML parser
  serve/            HTTP server, SSE, mock data
pkg/spec/           Go struct definitions matching the YAML spec
runtime/            React runtime (Vite + React 18 + TailwindCSS)
flutter_runtime/    Flutter runtime (Riverpod + GoRouter)
examples/           Example specs with mock data
docs/               Spec schema reference
```

## Adding a Component

1. **Define the kind** in `pkg/spec/` if it introduces new YAML fields
2. **Add builder logic** in `internal/engine/builder.go` to emit the component node
3. **Register in React runtime**:
   - Create `runtime/src/components/<category>/<Name>.tsx`
   - Add the kind to `ComponentKind` union in `runtime/src/types.ts`
   - Register in `COMPONENT_MAP` in `runtime/src/renderer.tsx`
4. **Register in Flutter runtime** (optional):
   - Create `flutter_runtime/lib/components/<category>/<name>_widget.dart`
   - Register in `COMPONENT_MAP` in `flutter_runtime/lib/renderer/renderer.dart`

## Adding a New Runtime

A runtime must:
1. Fetch the component tree from `GET /_renderer/spec`
2. Recursively render nodes using a component registry
3. Handle the `CHILD_NODE_KINDS` pattern (pass raw child nodes, not rendered children)
4. Connect to `/_renderer/events` SSE for hot reload

## Running Tests

```bash
# Go tests
go test ./...

# React build check
cd runtime && pnpm build
```

## Code Style

- Go: standard `gofmt`
- TypeScript: no special config, just keep it consistent with existing code
- Prefer small, focused PRs over large changes

## Reporting Issues

Open an issue on GitHub with:
- Steps to reproduce
- Expected vs actual behavior
- Which runtime (React/Flutter) and example spec you're using
