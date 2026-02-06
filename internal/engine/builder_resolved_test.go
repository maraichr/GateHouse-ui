package engine

import (
	"os"
	"testing"

	"github.com/maraichr/GateHouse-ui/internal/parser"
)

func TestBuildResolvedTree(t *testing.T) {
	data, err := os.ReadFile("../../docs/gatehouse-ui-spec-schema-v2.yaml")
	if err != nil {
		t.Fatalf("failed to read resolved spec: %v", err)
	}

	resolved, err := parser.ParseResolved(data)
	if err != nil {
		t.Fatalf("failed to parse resolved spec: %v", err)
	}

	tree, err := BuildResolvedTree(resolved)
	if err != nil {
		t.Fatalf("failed to build resolved tree: %v", err)
	}

	if tree.Root == nil || tree.Root.Kind != KindAppShell {
		t.Fatalf("expected root app_shell, got %#v", tree.Root)
	}

	if tree.Metadata.RouteCount == 0 {
		t.Fatalf("expected non-zero route count")
	}

	node := findNodeByID(tree.Root, "Subcontractor_list")
	if node == nil {
		t.Fatalf("expected Subcontractor_list node")
	}
	if node.Scope == nil || node.Scope.Route == "" {
		t.Fatalf("expected route on Subcontractor_list node scope")
	}
}

func findNodeByID(node *ComponentNode, id string) *ComponentNode {
	if node == nil {
		return nil
	}
	if node.ID == id {
		return node
	}
	for _, child := range node.Children {
		if found := findNodeByID(child, id); found != nil {
			return found
		}
	}
	return nil
}
