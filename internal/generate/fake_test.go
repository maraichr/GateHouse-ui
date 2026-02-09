package generate

import (
	"encoding/json"
	"os"
	"testing"

	"github.com/maraichr/GateHouse-ui/internal/parser"
)

func TestFakeHintsConstruction(t *testing.T) {
	appSpec, err := parser.Parse("../../examples/construction/spec.yaml")
	if err != nil {
		t.Fatalf("parse: %v", err)
	}

	// Verify fake hints parsed
	sub := appSpec.Entities[0] // Subcontractor
	var companyField, taxField *fieldInfo
	for _, f := range sub.Fields {
		if f.Name == "company_name" && f.Fake != nil {
			companyField = &fieldInfo{f.Fake.Tag}
		}
		if f.Name == "tax_id" && f.Fake != nil {
			taxField = &fieldInfo{f.Fake.Tag}
		}
	}
	if companyField == nil || companyField.tag != "company" {
		t.Fatal("company_name should have fake: company")
	}
	if taxField == nil || taxField.tag != "ein" {
		t.Fatal("tax_id should have fake: ein")
	}

	// Generate and verify values look realistic
	cfg := Config{Count: 5, Seed: 42}
	gen := NewGenerator(cfg, appSpec)
	data, err := gen.Generate()
	if err != nil {
		t.Fatalf("generate: %v", err)
	}

	records := data["/subcontractors"].([]any)
	for i, r := range records {
		rec := r.(map[string]any)
		name := rec["company_name"].(string)
		// Company names from gofakeit contain spaces or have real patterns
		if name == "" {
			t.Errorf("record %d: empty company_name", i)
		}
		t.Logf("record %d: company_name=%q tax_id=%v", i, name, rec["tax_id"])
	}
}

func TestFakeHintsConditional(t *testing.T) {
	appSpec, err := parser.Parse("../../examples/b2b-payments/kyc/spec.yaml")
	if err != nil {
		t.Fatalf("parse: %v", err)
	}

	// Verify conditional fake hint
	var sanctions *struct{}
	for _, e := range appSpec.Entities {
		if e.Name == "SanctionsScreening" {
			for _, f := range e.Fields {
				if f.Name == "entity_name" && f.Fake != nil && f.Fake.IsConditional() {
					sanctions = &struct{}{}
					if f.Fake.DependsOn != "entity_type" {
						t.Fatalf("expected depends_on=entity_type, got %s", f.Fake.DependsOn)
					}
					if f.Fake.Map["business"] != "company" {
						t.Fatalf("expected map[business]=company, got %s", f.Fake.Map["business"])
					}
					if f.Fake.Map["individual"] != "full_name" {
						t.Fatalf("expected map[individual]=full_name, got %s", f.Fake.Map["individual"])
					}
				}
			}
		}
	}
	if sanctions == nil {
		t.Fatal("SanctionsScreening.entity_name should have conditional fake hint")
	}

	// Generate and verify conditional values work
	cfg := Config{Count: 10, Seed: 42}
	gen := NewGenerator(cfg, appSpec)
	data, err := gen.Generate()
	if err != nil {
		t.Fatalf("generate: %v", err)
	}

	records := data["/sanctions-screenings"].([]any)
	for i, r := range records {
		rec := r.(map[string]any)
		entityType, _ := rec["entity_type"].(string)
		entityName, _ := rec["entity_name"].(string)
		t.Logf("record %d: entity_type=%q entity_name=%q", i, entityType, entityName)
		if entityType != "" && entityName == "" {
			t.Errorf("record %d: empty entity_name for type=%s", i, entityType)
		}
	}
}

func TestFakeHintsPayee(t *testing.T) {
	appSpec, err := parser.Parse("../../examples/b2b-payments/payee/spec.yaml")
	if err != nil {
		t.Fatalf("parse: %v", err)
	}

	cfg := Config{Count: 10, Seed: 42}
	gen := NewGenerator(cfg, appSpec)
	data, err := gen.Generate()
	if err != nil {
		t.Fatalf("generate: %v", err)
	}

	records := data["/payees"].([]any)
	for i, r := range records {
		rec := r.(map[string]any)
		payeeType := rec["payee_type"].(string)
		payeeName, _ := rec["payee_name"].(string)
		bankName, _ := rec["bank_name"].(string)
		t.Logf("record %d: type=%q name=%q bank=%q", i, payeeType, payeeName, bankName)
		// payee_name is required, should never be empty
		if payeeName == "" {
			t.Errorf("record %d: empty payee_name", i)
		}
		// bank_name is not required, ~20% nil is expected
	}
}

// Dump full JSON for manual inspection
func TestFakeHintsDump(t *testing.T) {
	if os.Getenv("DUMP") == "" {
		t.Skip("set DUMP=1 to run")
	}
	appSpec, err := parser.Parse("../../examples/b2b-payments/payee/spec.yaml")
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	cfg := Config{Count: 3, Seed: 42}
	gen := NewGenerator(cfg, appSpec)
	data, err := gen.Generate()
	if err != nil {
		t.Fatalf("generate: %v", err)
	}
	b, _ := json.MarshalIndent(data, "", "  ")
	t.Logf("\n%s", string(b))
}

type fieldInfo struct{ tag string }
