package compose

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"

	"github.com/maraichr/GateHouse-ui/internal/engine"
)

// projectRoot finds the project root by walking up from the test file.
func projectRoot() string {
	_, filename, _, _ := runtime.Caller(0)
	dir := filepath.Dir(filename)
	// internal/compose → project root (2 levels up)
	return filepath.Join(dir, "..", "..")
}

func TestB2BPaymentsComposition(t *testing.T) {
	root := projectRoot()
	composePath := filepath.Join(root, "examples", "b2b-payments", "compose.yaml")

	if _, err := os.Stat(composePath); os.IsNotExist(err) {
		t.Skip("b2b-payments example not found")
	}

	// Change to project root so relative paths in compose.yaml resolve
	origDir, _ := os.Getwd()
	if err := os.Chdir(root); err != nil {
		t.Fatalf("chdir: %v", err)
	}
	defer os.Chdir(origDir)

	// Load config
	cfg, err := LoadConfig(composePath)
	if err != nil {
		t.Fatalf("LoadConfig: %v", err)
	}

	if cfg.Host.Name != "paybridge" {
		t.Errorf("expected host name=paybridge, got %q", cfg.Host.Name)
	}
	if len(cfg.Services) != 5 {
		t.Errorf("expected 5 services, got %d", len(cfg.Services))
	}

	// Build aggregator
	agg, err := NewAggregator(cfg, "react")
	if err != nil {
		t.Fatalf("NewAggregator: %v", err)
	}

	// Compose
	tree, err := agg.Compose()
	if err != nil {
		t.Fatalf("Compose: %v", err)
	}

	// Verify entities from all 5 services are present
	entitySet := map[string]bool{}
	for _, e := range tree.Metadata.Entities {
		entitySet[e] = true
	}

	expectedEntities := []string{
		"Application",     // onboarding
		"KYCReview",       // kyc
		"SanctionsScreening", // kyc
		"Customer",        // customer
		"Contact",         // customer
		"Payee",           // payee
		"Payment",         // payments
		"PaymentBatch",    // payments
	}

	for _, name := range expectedEntities {
		if !entitySet[name] {
			t.Errorf("expected entity %q in composed tree, not found. Got: %v", name, tree.Metadata.Entities)
		}
	}

	t.Logf("Composed tree: %d entities, %d routes", len(tree.Metadata.Entities), tree.Metadata.RouteCount)

	// Verify sources map
	if tree.Metadata.Sources == nil {
		t.Fatal("expected non-nil Sources map")
	}
	if tree.Metadata.Sources["Application"] != "onboarding" {
		t.Errorf("expected Application source=onboarding, got %q", tree.Metadata.Sources["Application"])
	}
	if tree.Metadata.Sources["Customer"] != "customer" {
		t.Errorf("expected Customer source=customer, got %q", tree.Metadata.Sources["Customer"])
	}
	if tree.Metadata.Sources["Payment"] != "payments" {
		t.Errorf("expected Payment source=payments, got %q", tree.Metadata.Sources["Payment"])
	}

	// Verify sidebar has nav groups
	sidebar := findNodeByKind(tree.Root, engine.KindSidebar)
	if sidebar == nil {
		t.Fatal("no sidebar in composed tree")
	}

	groupLabels := map[string]bool{}
	for _, child := range sidebar.Children {
		if child.Kind == engine.KindNavGroup {
			if label, ok := child.Props["label"].(string); ok {
				groupLabels[label] = true
			}
		}
	}

	expectedGroups := []string{"Onboarding", "Compliance", "Accounts", "Payments"}
	for _, g := range expectedGroups {
		if !groupLabels[g] {
			t.Errorf("expected nav group %q, not found. Got groups: %v", g, groupLabels)
		}
	}

	t.Logf("Nav groups: %v", groupLabels)

	// Verify tree has valid root
	if tree.Root.Kind != engine.KindAppShell {
		t.Errorf("expected root kind=app_shell, got %q", tree.Root.Kind)
	}
	if tree.Metadata.AppName != "PayBridge" {
		t.Errorf("expected app name=PayBridge, got %q", tree.Metadata.AppName)
	}
}
