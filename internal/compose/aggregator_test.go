package compose

import (
	"os"
	"testing"

	"github.com/maraichr/GateHouse-ui/internal/engine"
)

func makeTree(appName string, entities []string, sidebar []*engine.ComponentNode, pages []*engine.ComponentNode) *engine.ComponentTree {
	sidebarNode := &engine.ComponentNode{
		ID:       "sidebar",
		Kind:     engine.KindSidebar,
		Children: sidebar,
	}
	root := &engine.ComponentNode{
		ID:       "root",
		Kind:     engine.KindAppShell,
		Children: append([]*engine.ComponentNode{sidebarNode}, pages...),
	}

	routeCount := 0
	for _, p := range pages {
		if p.Scope != nil && p.Scope.Route != "" {
			routeCount++
		}
	}

	return &engine.ComponentTree{
		Root: root,
		Metadata: engine.TreeMetadata{
			AppName:    appName,
			Entities:   entities,
			RouteCount: routeCount,
		},
	}
}

func makeNavItem(id, label, entity string) *engine.ComponentNode {
	return &engine.ComponentNode{
		ID:   "nav_" + id,
		Kind: engine.KindNavItem,
		Props: map[string]any{
			"id":     id,
			"label":  label,
			"entity": entity,
		},
	}
}

func makeEntityPage(entity, route string) *engine.ComponentNode {
	return &engine.ComponentNode{
		ID:   entity + "_list",
		Kind: engine.KindEntityList,
		Scope: &engine.Scope{
			Entity: entity,
			Route:  route,
		},
	}
}

func TestCompose_TwoServices(t *testing.T) {
	hostTree := makeTree("Portal", []string{"Customer"},
		[]*engine.ComponentNode{makeNavItem("customers", "Customers", "Customer")},
		[]*engine.ComponentNode{makeEntityPage("Customer", "/customers")},
	)

	ordersTree := makeTree("Orders", []string{"WorkOrder"},
		[]*engine.ComponentNode{makeNavItem("work_orders", "Work Orders", "WorkOrder")},
		[]*engine.ComponentNode{makeEntityPage("WorkOrder", "/work-orders")},
	)

	agg := &Aggregator{
		Config: &CompositionConfig{
			Host: ServiceSource{Name: "portal"},
			Services: []ServiceSource{
				{Name: "orders", NavGroup: "Operations", NavOrder: 10},
			},
		},
		Host: &ServiceState{
			Source:  ServiceSource{Name: "portal"},
			Tree:    hostTree,
			Healthy: true,
		},
		Services: []*ServiceState{
			{
				Source:  ServiceSource{Name: "orders", NavGroup: "Operations", NavOrder: 10},
				Tree:    ordersTree,
				Healthy: true,
			},
		},
		Target: "react",
	}

	tree, err := agg.Compose()
	if err != nil {
		t.Fatalf("Compose() error: %v", err)
	}

	// Should have both entities
	if len(tree.Metadata.Entities) != 2 {
		t.Errorf("expected 2 entities, got %d: %v", len(tree.Metadata.Entities), tree.Metadata.Entities)
	}

	// Should have sources map
	if tree.Metadata.Sources["Customer"] != "portal" {
		t.Errorf("expected Customer source=portal, got %q", tree.Metadata.Sources["Customer"])
	}
	if tree.Metadata.Sources["WorkOrder"] != "orders" {
		t.Errorf("expected WorkOrder source=orders, got %q", tree.Metadata.Sources["WorkOrder"])
	}

	// Root should have sidebar + 2 entity pages
	root := tree.Root
	if root == nil {
		t.Fatal("root is nil")
	}

	// Find sidebar
	sidebar := findNodeByKind(root, engine.KindSidebar)
	if sidebar == nil {
		t.Fatal("no sidebar in composed tree")
	}

	// Sidebar should have host nav items + nav group for orders
	hasNavGroup := false
	for _, child := range sidebar.Children {
		if child.Kind == engine.KindNavGroup {
			hasNavGroup = true
			if child.Props["label"] != "Operations" {
				t.Errorf("expected nav group label=Operations, got %v", child.Props["label"])
			}
			if len(child.Children) != 1 {
				t.Errorf("expected 1 nav item in group, got %d", len(child.Children))
			}
		}
	}
	if !hasNavGroup {
		t.Error("expected a nav_group for Operations")
	}
}

func TestCompose_EntityCollision(t *testing.T) {
	hostTree := makeTree("Portal", []string{"Customer"},
		[]*engine.ComponentNode{},
		[]*engine.ComponentNode{makeEntityPage("Customer", "/customers")},
	)

	// Service also defines "Customer" — should collide
	conflictTree := makeTree("Orders", []string{"Customer"},
		[]*engine.ComponentNode{},
		[]*engine.ComponentNode{makeEntityPage("Customer", "/orders/customers")},
	)

	agg := &Aggregator{
		Config: &CompositionConfig{
			Host:     ServiceSource{Name: "portal"},
			Services: []ServiceSource{{Name: "orders"}},
		},
		Host: &ServiceState{
			Source:  ServiceSource{Name: "portal"},
			Tree:    hostTree,
			Healthy: true,
		},
		Services: []*ServiceState{
			{
				Source:  ServiceSource{Name: "orders"},
				Tree:    conflictTree,
				Healthy: true,
			},
		},
	}

	_, err := agg.Compose()
	if err == nil {
		t.Fatal("expected entity collision error, got nil")
	}
}

func TestCompose_RouteCollision(t *testing.T) {
	hostTree := makeTree("Portal", []string{"Customer"},
		[]*engine.ComponentNode{},
		[]*engine.ComponentNode{makeEntityPage("Customer", "/customers")},
	)

	conflictTree := makeTree("Orders", []string{"WorkOrder"},
		[]*engine.ComponentNode{},
		[]*engine.ComponentNode{makeEntityPage("WorkOrder", "/customers")}, // same route!
	)

	agg := &Aggregator{
		Config: &CompositionConfig{
			Host:     ServiceSource{Name: "portal"},
			Services: []ServiceSource{{Name: "orders"}},
		},
		Host: &ServiceState{
			Source:  ServiceSource{Name: "portal"},
			Tree:    hostTree,
			Healthy: true,
		},
		Services: []*ServiceState{
			{
				Source:  ServiceSource{Name: "orders"},
				Tree:    conflictTree,
				Healthy: true,
			},
		},
	}

	_, err := agg.Compose()
	if err == nil {
		t.Fatal("expected route collision error, got nil")
	}
}

func TestCompose_OptionalServiceNilTree(t *testing.T) {
	hostTree := makeTree("Portal", []string{"Customer"},
		[]*engine.ComponentNode{makeNavItem("customers", "Customers", "Customer")},
		[]*engine.ComponentNode{makeEntityPage("Customer", "/customers")},
	)

	agg := &Aggregator{
		Config: &CompositionConfig{
			Host:     ServiceSource{Name: "portal"},
			Services: []ServiceSource{{Name: "users", Optional: true}},
		},
		Host: &ServiceState{
			Source:  ServiceSource{Name: "portal"},
			Tree:    hostTree,
			Healthy: true,
		},
		Services: []*ServiceState{
			{
				Source:  ServiceSource{Name: "users", Optional: true},
				Tree:    nil,
				Healthy: false,
			},
		},
	}

	tree, err := agg.Compose()
	if err != nil {
		t.Fatalf("Compose() error: %v", err)
	}

	if len(tree.Metadata.Entities) != 1 {
		t.Errorf("expected 1 entity (host only), got %d", len(tree.Metadata.Entities))
	}
}

func TestCompose_NavOrdering(t *testing.T) {
	hostTree := makeTree("Portal", nil, nil, nil)
	svc1Tree := makeTree("A", []string{"Alpha"},
		[]*engine.ComponentNode{makeNavItem("alpha", "Alpha", "Alpha")},
		[]*engine.ComponentNode{makeEntityPage("Alpha", "/alpha")},
	)
	svc2Tree := makeTree("B", []string{"Beta"},
		[]*engine.ComponentNode{makeNavItem("beta", "Beta", "Beta")},
		[]*engine.ComponentNode{makeEntityPage("Beta", "/beta")},
	)

	agg := &Aggregator{
		Config: &CompositionConfig{
			Host: ServiceSource{Name: "portal"},
			Services: []ServiceSource{
				{Name: "b", NavOrder: 20},
				{Name: "a", NavOrder: 10},
			},
		},
		Host: &ServiceState{
			Source: ServiceSource{Name: "portal"}, Tree: hostTree, Healthy: true,
		},
		Services: []*ServiceState{
			{Source: ServiceSource{Name: "b", NavOrder: 20}, Tree: svc2Tree, Healthy: true},
			{Source: ServiceSource{Name: "a", NavOrder: 10}, Tree: svc1Tree, Healthy: true},
		},
	}

	tree, err := agg.Compose()
	if err != nil {
		t.Fatalf("Compose() error: %v", err)
	}

	sidebar := findNodeByKind(tree.Root, engine.KindSidebar)
	if sidebar == nil {
		t.Fatal("no sidebar")
	}

	// Service "a" (order 10) should come before "b" (order 20)
	if len(sidebar.Children) < 2 {
		t.Fatalf("expected at least 2 sidebar children, got %d", len(sidebar.Children))
	}
	first := sidebar.Children[0]
	second := sidebar.Children[1]
	if first.Props["entity"] != "Alpha" {
		t.Errorf("expected first nav item entity=Alpha, got %v", first.Props["entity"])
	}
	if second.Props["entity"] != "Beta" {
		t.Errorf("expected second nav item entity=Beta, got %v", second.Props["entity"])
	}
}

func TestLoadConfig_Valid(t *testing.T) {
	// Create a temp config file
	dir := t.TempDir()
	cfgPath := dir + "/compose.yaml"

	content := `
host:
  name: portal
  spec_path: ./host.yaml
services:
  - name: orders
    spec_url: http://localhost:8080/_ui/spec
    prefix: /orders
    nav_group: Operations
    nav_order: 10
  - name: billing
    spec_path: ./billing.yaml
    prefix: /billing
    nav_order: 15
    watch: true
`
	if err := writeFile(cfgPath, []byte(content)); err != nil {
		t.Fatal(err)
	}

	cfg, err := LoadConfig(cfgPath)
	if err != nil {
		t.Fatalf("LoadConfig() error: %v", err)
	}

	if cfg.Host.Name != "portal" {
		t.Errorf("expected host name=portal, got %q", cfg.Host.Name)
	}
	if len(cfg.Services) != 2 {
		t.Errorf("expected 2 services, got %d", len(cfg.Services))
	}
	if cfg.Services[0].NavGroup != "Operations" {
		t.Errorf("expected first service nav_group=Operations, got %q", cfg.Services[0].NavGroup)
	}
}

func TestLoadConfig_DuplicateName(t *testing.T) {
	dir := t.TempDir()
	cfgPath := dir + "/compose.yaml"

	content := `
host:
  name: portal
  spec_path: ./host.yaml
services:
  - name: orders
    spec_url: http://localhost:8080/_ui/spec
  - name: orders
    spec_url: http://localhost:8081/_ui/spec
`
	if err := writeFile(cfgPath, []byte(content)); err != nil {
		t.Fatal(err)
	}

	_, err := LoadConfig(cfgPath)
	if err == nil {
		t.Fatal("expected duplicate name error")
	}
}

func TestLoadConfig_DuplicatePrefix(t *testing.T) {
	dir := t.TempDir()
	cfgPath := dir + "/compose.yaml"

	content := `
host:
  name: portal
  spec_path: ./host.yaml
services:
  - name: orders
    spec_url: http://localhost:8080/_ui/spec
    prefix: /ops
  - name: billing
    spec_url: http://localhost:8081/_ui/spec
    prefix: /ops
`
	if err := writeFile(cfgPath, []byte(content)); err != nil {
		t.Fatal(err)
	}

	_, err := LoadConfig(cfgPath)
	if err == nil {
		t.Fatal("expected duplicate prefix error")
	}
}

func writeFile(path string, data []byte) error {
	return os.WriteFile(path, data, 0644)
}
