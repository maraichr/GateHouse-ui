package parser_test

import (
	"os"
	"testing"

	"github.com/maraichr/GateHouse-ui/internal/parser"
)

func TestParseValidSpec(t *testing.T) {
	s, err := parser.Parse("../../docs/gatehouse-ui-spec-schema.yaml")
	if err != nil {
		t.Fatalf("expected valid spec to parse, got: %v", err)
	}
	if s.App.Name != "acme-contractor-portal" {
		t.Errorf("unexpected app name: %s", s.App.Name)
	}
	if len(s.Entities) != 4 {
		t.Errorf("expected 4 entities, got %d", len(s.Entities))
	}
}

func TestParseMissingFile(t *testing.T) {
	_, err := parser.Parse("nonexistent.yaml")
	if err == nil {
		t.Fatal("expected error for missing file")
	}
}

func TestParseBrokenYAML(t *testing.T) {
	// Write a temp file with invalid YAML
	tmpFile := t.TempDir() + "/bad.yaml"
	if err := writeFile(tmpFile, "{{{{invalid"); err != nil {
		t.Fatal(err)
	}
	_, err := parser.Parse(tmpFile)
	if err == nil {
		t.Fatal("expected error for broken YAML")
	}
}

func TestParseValidationErrors(t *testing.T) {
	tmpFile := t.TempDir() + "/invalid.yaml"
	content := `
app:
  name: "test"
entities:
  - name: Foo
    label_field: nonexistent
    fields:
      - name: id
        type: uuid
    views:
      list:
        columns:
          - field: missing_field
`
	if err := writeFile(tmpFile, content); err != nil {
		t.Fatal(err)
	}
	_, err := parser.Parse(tmpFile)
	if err == nil {
		t.Fatal("expected validation errors")
	}
	verrs, ok := err.(*parser.ValidationErrors)
	if !ok {
		t.Fatalf("expected ValidationErrors, got %T: %v", err, err)
	}
	if len(verrs.Errors) == 0 {
		t.Fatal("expected at least one validation error")
	}
}

func writeFile(path, content string) error {
	return os.WriteFile(path, []byte(content), 0644)
}
