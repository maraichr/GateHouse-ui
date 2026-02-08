package generate

import (
	"encoding/json"
	"testing"

	"github.com/maraichr/GateHouse-ui/internal/compose"
	"github.com/maraichr/GateHouse-ui/internal/parser"
	"github.com/maraichr/GateHouse-ui/pkg/spec"
)

const constructionSpec = "../../examples/construction/spec.yaml"
const b2bCompose = "../../examples/b2b-payments/compose.yaml"

func loadConstructionSpec(t *testing.T) *Generator {
	t.Helper()
	spec, err := parser.Parse(constructionSpec)
	if err != nil {
		t.Fatalf("failed to parse construction spec: %v", err)
	}
	return NewGenerator(Config{Count: 10, Seed: 42}, spec)
}

func TestGenerateSimple(t *testing.T) {
	gen := loadConstructionSpec(t)
	data, err := gen.Generate()
	if err != nil {
		t.Fatalf("Generate() error: %v", err)
	}

	expected := []string{"/subcontractors", "/documents", "/work-orders", "/trades"}
	for _, key := range expected {
		records, ok := data[key]
		if !ok {
			t.Errorf("missing collection %q", key)
			continue
		}
		slice, ok := records.([]any)
		if !ok {
			t.Errorf("collection %q is not a slice", key)
			continue
		}
		if len(slice) != 10 {
			t.Errorf("collection %q: got %d records, want 10", key, len(slice))
		}
	}

	// Check meta sections exist
	if _, ok := data["_widgets"]; !ok {
		t.Error("missing _widgets")
	}
	if _, ok := data["_entity_stats"]; !ok {
		t.Error("missing _entity_stats")
	}
	if _, ok := data["_sub_resources"]; !ok {
		t.Error("missing _sub_resources")
	}
}

func TestReferenceIntegrity(t *testing.T) {
	gen := loadConstructionSpec(t)
	data, err := gen.Generate()
	if err != nil {
		t.Fatalf("Generate() error: %v", err)
	}

	// Build ID set for subcontractors
	subIDs := map[string]bool{}
	subs, _ := data["/subcontractors"].([]any)
	for _, r := range subs {
		rec, _ := r.(map[string]any)
		if id, ok := rec["id"].(string); ok {
			subIDs[id] = true
		}
	}

	// Check documents reference valid subcontractors
	docs, _ := data["/documents"].([]any)
	for _, r := range docs {
		rec, _ := r.(map[string]any)
		refID, ok := rec["subcontractor_id"].(string)
		if !ok {
			continue // nil reference is ok for non-required
		}
		if !subIDs[refID] {
			t.Errorf("document %v references non-existent subcontractor %q", rec["id"], refID)
		}
	}

	// Check work orders reference valid subcontractors
	wos, _ := data["/work-orders"].([]any)
	for _, r := range wos {
		rec, _ := r.(map[string]any)
		refID, ok := rec["subcontractor_id"].(string)
		if !ok {
			continue
		}
		if !subIDs[refID] {
			t.Errorf("work order %v references non-existent subcontractor %q", rec["id"], refID)
		}
	}
}

func TestStatusDistribution(t *testing.T) {
	gen := loadConstructionSpec(t)
	data, err := gen.Generate()
	if err != nil {
		t.Fatalf("Generate() error: %v", err)
	}

	// Subcontractor statuses should span multiple values
	subs, _ := data["/subcontractors"].([]any)
	statusCounts := map[string]int{}
	for _, r := range subs {
		rec, _ := r.(map[string]any)
		if s, ok := rec["status"].(string); ok {
			statusCounts[s]++
		}
	}

	if len(statusCounts) < 2 {
		t.Errorf("expected multiple status values, got %d: %v", len(statusCounts), statusCounts)
	}

	// Verify all statuses are valid enum values
	validStatuses := map[string]bool{"pending": true, "approved": true, "suspended": true, "terminated": true}
	for s := range statusCounts {
		if !validStatuses[s] {
			t.Errorf("invalid status value: %q", s)
		}
	}
}

func TestDeterministic(t *testing.T) {
	spec, err := parser.Parse(constructionSpec)
	if err != nil {
		t.Fatalf("failed to parse spec: %v", err)
	}

	gen1 := NewGenerator(Config{Count: 5, Seed: 123}, spec)
	data1, err := gen1.Generate()
	if err != nil {
		t.Fatalf("Generate() 1 error: %v", err)
	}

	gen2 := NewGenerator(Config{Count: 5, Seed: 123}, spec)
	data2, err := gen2.Generate()
	if err != nil {
		t.Fatalf("Generate() 2 error: %v", err)
	}

	json1, _ := json.Marshal(data1)
	json2, _ := json.Marshal(data2)

	if string(json1) != string(json2) {
		t.Error("same seed produced different output")
	}
}

func TestMaskPattern(t *testing.T) {
	gen := loadConstructionSpec(t)
	data, err := gen.Generate()
	if err != nil {
		t.Fatalf("Generate() error: %v", err)
	}

	subs, _ := data["/subcontractors"].([]any)
	for _, r := range subs {
		rec, _ := r.(map[string]any)
		taxID, ok := rec["tax_id"].(string)
		if !ok {
			continue
		}
		// Should match XX-XXXXXXX pattern (all digits since we generate from unmask)
		if len(taxID) != 10 || taxID[2] != '-' {
			t.Errorf("tax_id %q doesn't match expected format NN-NNNNNNN", taxID)
		}
	}
}

func TestWidgetGeneration(t *testing.T) {
	gen := loadConstructionSpec(t)
	data, err := gen.Generate()
	if err != nil {
		t.Fatalf("Generate() error: %v", err)
	}

	widgets, ok := data["_widgets"].(map[string]any)
	if !ok {
		t.Fatal("_widgets is not a map")
	}

	// Construction spec has dashboard stats + 2 charts
	expectedKeys := []string{"/dashboard/stats", "/dashboard/charts/status-breakdown", "/dashboard/charts/work-orders-timeline"}
	for _, key := range expectedKeys {
		if _, ok := widgets[key]; !ok {
			t.Errorf("missing widget data for %q", key)
		}
	}

	// Stats should have numeric values
	stats, _ := widgets["/dashboard/stats"].(map[string]any)
	if stats == nil {
		t.Fatal("missing /dashboard/stats")
	}
	for _, field := range []string{"total_subcontractors", "pending_approvals", "expiring_insurance_30d", "active_work_orders"} {
		if _, ok := stats[field]; !ok {
			t.Errorf("missing stat field %q", field)
		}
	}

	// Donut chart should have data array
	donut, _ := widgets["/dashboard/charts/status-breakdown"].(map[string]any)
	if donut == nil {
		t.Fatal("missing donut chart data")
	}
	// Data can be []any or []map[string]any depending on generation
	if donut["data"] == nil {
		t.Error("donut chart has no data")
	} else {
		// Serialize and deserialize to check structure
		raw, _ := json.Marshal(donut["data"])
		var items []map[string]any
		if err := json.Unmarshal(raw, &items); err != nil {
			t.Errorf("donut chart data is not an array of objects: %v", err)
		} else if len(items) == 0 {
			t.Error("donut chart has no data points")
		}
	}
}

func TestComposeGeneration(t *testing.T) {
	cfg, err := compose.LoadConfig(b2bCompose)
	if err != nil {
		t.Fatalf("failed to load compose config: %v", err)
	}

	// Paths in compose.yaml are relative to project root; tests run from internal/generate/
	prefix := "../../"
	specPaths := []string{prefix + cfg.Host.SpecPath}
	for _, svc := range cfg.Services {
		if svc.SpecPath != "" {
			specPaths = append(specPaths, prefix+svc.SpecPath)
		}
	}

	var appSpecs []*spec.AppSpec
	for _, path := range specPaths {
		s, err := parser.Parse(path)
		if err != nil {
			t.Fatalf("failed to parse %q: %v", path, err)
		}
		appSpecs = append(appSpecs, s)
	}

	gen := NewGenerator(Config{Count: 5, Seed: 99}, appSpecs...)
	data, err := gen.Generate()
	if err != nil {
		t.Fatalf("Generate() error: %v", err)
	}

	// B2B payments has 8 entities across 5 services
	expectedEntities := []string{
		"/applications", "/kyc-reviews", "/sanctions-screenings",
		"/customers", "/contacts", "/payees",
		"/payments", "/payment-batches",
	}
	for _, key := range expectedEntities {
		records, ok := data[key]
		if !ok {
			t.Errorf("missing collection %q", key)
			continue
		}
		slice, _ := records.([]any)
		if len(slice) != 5 {
			t.Errorf("collection %q: got %d records, want 5", key, len(slice))
		}
	}

	// Verify JSON serialization works
	jsonBytes, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		t.Fatalf("JSON marshal error: %v", err)
	}
	if len(jsonBytes) < 1000 {
		t.Errorf("JSON output too small: %d bytes", len(jsonBytes))
	}
}

func TestEntityPrefix(t *testing.T) {
	tests := []struct {
		name   string
		expect string
	}{
		{"Customer", "CUS"},
		{"Payment", "PAY"},
		{"PaymentBatch", "BAT"},
		{"KYCReview", "KYCR"},
		{"Subcontractor", "SUB"},
		{"Trade", "TRA"},
		{"WorkOrder", "ORD"},
		{"Document", "DOC"},
		{"Application", "APP"},
		{"Contact", "CON"},
	}

	for _, tt := range tests {
		got := entityPrefix(tt.name)
		if got != tt.expect {
			t.Errorf("entityPrefix(%q) = %q, want %q", tt.name, got, tt.expect)
		}
	}
}
