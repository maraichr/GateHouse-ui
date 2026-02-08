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

func TestShowInInference(t *testing.T) {
	data, err := os.ReadFile("../../docs/gatehouse-ui-spec-schema-v2.yaml")
	if err != nil {
		t.Fatalf("read: %v", err)
	}
	resolved, err := parser.ParseResolved(data)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	tree, err := BuildResolvedTree(resolved)
	if err != nil {
		t.Fatalf("build: %v", err)
	}

	// EntityDetail gets fields injected; check that company_name has show_in
	detail := findNodeByID(tree.Root, "Subcontractor_detail")
	if detail == nil {
		t.Fatalf("expected Subcontractor_detail node")
	}
	fields, _ := detail.Props["fields"].([]map[string]any)
	if len(fields) == 0 {
		t.Fatalf("expected fields on detail node")
	}
	var companyField map[string]any
	for _, f := range fields {
		if f["name"] == "company_name" {
			companyField = f
			break
		}
	}
	if companyField == nil {
		t.Fatalf("expected company_name field")
	}
	showIn, ok := companyField["show_in"].(map[string]bool)
	if !ok {
		t.Fatalf("expected show_in on company_name, got %T", companyField["show_in"])
	}
	if !showIn["list"] {
		t.Errorf("expected company_name show_in.list=true")
	}
	if !showIn["detail"] {
		t.Errorf("expected company_name show_in.detail=true")
	}
	if !showIn["create"] {
		t.Errorf("expected company_name show_in.create=true")
	}
}

func TestPresentationHintsPreserved(t *testing.T) {
	data, err := os.ReadFile("../../docs/gatehouse-ui-spec-schema-v2.yaml")
	if err != nil {
		t.Fatalf("read: %v", err)
	}
	resolved, err := parser.ParseResolved(data)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	tree, err := BuildResolvedTree(resolved)
	if err != nil {
		t.Fatalf("build: %v", err)
	}

	// Filter panel should preserve layout as object {web: sidebar, flutter: bottom_sheet}
	filters := findNodeByID(tree.Root, "Subcontractor_filters")
	if filters == nil {
		t.Fatalf("expected Subcontractor_filters node")
	}
	config, _ := filters.Props["config"].(map[string]any)
	if config == nil {
		t.Fatalf("expected config on filter node")
	}
	layout, ok := config["layout"].(map[string]any)
	if !ok {
		t.Fatalf("expected layout to be an object, got %T", config["layout"])
	}
	if layout["web"] != "sidebar" {
		t.Errorf("expected layout.web=sidebar, got %v", layout["web"])
	}
	if layout["flutter"] != "bottom_sheet" {
		t.Errorf("expected layout.flutter=bottom_sheet, got %v", layout["flutter"])
	}

	// Columns should preserve link_to as object
	table := findNodeByID(tree.Root, "Subcontractor_table")
	if table == nil {
		t.Fatalf("expected Subcontractor_table node")
	}
	columns, _ := table.Props["columns"].([]any)
	if len(columns) == 0 {
		t.Fatalf("expected columns")
	}
	// company_name column has link_to object
	for _, col := range columns {
		colMap, ok := col.(map[string]any)
		if !ok {
			continue
		}
		if colMap["field"] == "company_name" {
			linkTo, ok := colMap["link_to"].(map[string]any)
			if !ok {
				t.Fatalf("expected link_to as object for company_name, got %T", colMap["link_to"])
			}
			if linkTo["type"] != "route" {
				t.Errorf("expected link_to.type=route, got %v", linkTo["type"])
			}
			break
		}
	}
}

func TestDisplayRulesDualFormat(t *testing.T) {
	data, err := os.ReadFile("../../docs/gatehouse-ui-spec-schema-v2.yaml")
	if err != nil {
		t.Fatalf("read: %v", err)
	}
	resolved, err := parser.ParseResolved(data)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	tree, err := BuildResolvedTree(resolved)
	if err != nil {
		t.Fatalf("build: %v", err)
	}

	detail := findNodeByID(tree.Root, "Subcontractor_detail")
	if detail == nil {
		t.Fatalf("expected Subcontractor_detail node")
	}
	fields, _ := detail.Props["fields"].([]map[string]any)
	var insuranceField map[string]any
	for _, f := range fields {
		if f["name"] == "insurance_expiry_date" {
			insuranceField = f
			break
		}
	}
	if insuranceField == nil {
		t.Fatalf("expected insurance_expiry_date field")
	}
	rules, ok := insuranceField["display_rules"].([]any)
	if !ok || len(rules) == 0 {
		t.Fatalf("expected display_rules on insurance field")
	}
	firstRule, _ := rules[0].(map[string]any)
	if firstRule == nil {
		t.Fatalf("expected rule map")
	}
	// Should have both "condition" (flattened) and "when" (structured)
	if _, ok := firstRule["condition"].(string); !ok {
		t.Errorf("expected condition string, got %T", firstRule["condition"])
	}
	if _, ok := firstRule["when"].(map[string]any); !ok {
		t.Errorf("expected when object, got %T", firstRule["when"])
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
