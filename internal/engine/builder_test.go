package engine_test

import (
	"testing"

	"github.com/maraichr/GateHouse-ui/internal/engine"
	"github.com/maraichr/GateHouse-ui/internal/parser"
)

func buildTestTree(t *testing.T) *engine.ComponentTree {
	t.Helper()
	appSpec, err := parser.Parse("../../docs/gatehouse-ui-spec-schema.yaml")
	if err != nil {
		t.Fatalf("failed to parse spec: %v", err)
	}
	analysis := engine.Analyze(appSpec)
	builder := engine.NewBuilder()
	return builder.Build(appSpec, analysis)
}

func TestTreeRoot(t *testing.T) {
	tree := buildTestTree(t)
	if tree.Root.Kind != engine.KindAppShell {
		t.Errorf("expected root kind 'app_shell', got %q", tree.Root.Kind)
	}
}

func TestTreeMetadata(t *testing.T) {
	tree := buildTestTree(t)
	if tree.Metadata.AppName != "Acme Contractor Portal" {
		t.Errorf("unexpected app name: %s", tree.Metadata.AppName)
	}
	if len(tree.Metadata.Entities) != 4 {
		t.Errorf("expected 4 entities, got %d", len(tree.Metadata.Entities))
	}
}

func TestSidebarNavItems(t *testing.T) {
	tree := buildTestTree(t)
	var sidebar *engine.ComponentNode
	for _, child := range tree.Root.Children {
		if child.Kind == engine.KindSidebar {
			sidebar = child
			break
		}
	}
	if sidebar == nil {
		t.Fatal("sidebar not found")
	}
	if len(sidebar.Children) != 7 {
		t.Errorf("expected 7 nav items, got %d", len(sidebar.Children))
	}
}

func TestSubcontractorEntityPages(t *testing.T) {
	tree := buildTestTree(t)

	kinds := make(map[string]bool)
	for _, child := range tree.Root.Children {
		if child.Scope != nil && child.Scope.Entity == "Subcontractor" {
			kinds[string(child.Kind)] = true
		}
	}

	for _, expected := range []string{"entity_list", "entity_detail", "stepped_form", "edit_form"} {
		if !kinds[expected] {
			t.Errorf("missing Subcontractor page kind %q, have %v", expected, kinds)
		}
	}
}

func TestEntityListChildren(t *testing.T) {
	tree := buildTestTree(t)

	var listNode *engine.ComponentNode
	for _, child := range tree.Root.Children {
		if child.Kind == engine.KindEntityList && child.Scope != nil && child.Scope.Entity == "Subcontractor" {
			listNode = child
			break
		}
	}
	if listNode == nil {
		t.Fatal("Subcontractor list node not found")
	}

	childKinds := make(map[engine.ComponentKind]bool)
	for _, child := range listNode.Children {
		childKinds[child.Kind] = true
	}

	if !childKinds[engine.KindDataTable] {
		t.Error("missing data_table child")
	}
	if !childKinds[engine.KindFilterPanel] {
		t.Error("missing filter_panel child")
	}
	if !childKinds[engine.KindSearchBar] {
		t.Error("missing search_bar child")
	}
	if !childKinds[engine.KindEmptyState] {
		t.Error("missing empty_state child")
	}
}

func TestTreeJSON(t *testing.T) {
	tree := buildTestTree(t)
	data, err := tree.ToJSON()
	if err != nil {
		t.Fatalf("failed to serialize tree: %v", err)
	}
	if len(data) == 0 {
		t.Fatal("empty JSON output")
	}
}
