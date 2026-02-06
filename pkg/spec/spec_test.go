package spec_test

import (
	"os"
	"testing"

	"github.com/maraichr/GateHouse-ui/pkg/spec"
	"gopkg.in/yaml.v3"
)

func loadTestSpec(t *testing.T) *spec.AppSpec {
	t.Helper()
	data, err := os.ReadFile("../../docs/gatehouse-ui-spec-schema.yaml")
	if err != nil {
		t.Fatalf("failed to read spec: %v", err)
	}
	var s spec.AppSpec
	if err := yaml.Unmarshal(data, &s); err != nil {
		t.Fatalf("failed to unmarshal spec: %v", err)
	}
	return &s
}

func TestAppMetadata(t *testing.T) {
	s := loadTestSpec(t)
	if s.App.Name != "acme-contractor-portal" {
		t.Errorf("expected app name 'acme-contractor-portal', got %q", s.App.Name)
	}
	if s.App.DisplayName != "Acme Contractor Portal" {
		t.Errorf("expected display name 'Acme Contractor Portal', got %q", s.App.DisplayName)
	}
}

func TestEntities(t *testing.T) {
	s := loadTestSpec(t)
	if len(s.Entities) != 4 {
		t.Errorf("expected 4 entities, got %d", len(s.Entities))
	}

	names := make(map[string]bool)
	for _, e := range s.Entities {
		names[e.Name] = true
	}
	for _, expected := range []string{"Subcontractor", "Document", "WorkOrder", "Trade"} {
		if !names[expected] {
			t.Errorf("missing entity %q", expected)
		}
	}
}

func TestSubcontractorFields(t *testing.T) {
	s := loadTestSpec(t)
	var sub *spec.Entity
	for i := range s.Entities {
		if s.Entities[i].Name == "Subcontractor" {
			sub = &s.Entities[i]
			break
		}
	}
	if sub == nil {
		t.Fatal("Subcontractor entity not found")
	}
	if len(sub.Fields) != 16 {
		t.Errorf("expected 16 fields on Subcontractor, got %d", len(sub.Fields))
	}
	if sub.LabelField != "company_name" {
		t.Errorf("expected label_field 'company_name', got %q", sub.LabelField)
	}
	if sub.StatusField != "status" {
		t.Errorf("expected status_field 'status', got %q", sub.StatusField)
	}
}

func TestSubcontractorStateMachine(t *testing.T) {
	s := loadTestSpec(t)
	var sub *spec.Entity
	for i := range s.Entities {
		if s.Entities[i].Name == "Subcontractor" {
			sub = &s.Entities[i]
			break
		}
	}
	if sub == nil {
		t.Fatal("Subcontractor entity not found")
	}
	if sub.StateMachine == nil {
		t.Fatal("expected state machine on Subcontractor")
	}
	if len(sub.StateMachine.Transitions) != 4 {
		t.Errorf("expected 4 transitions, got %d", len(sub.StateMachine.Transitions))
	}
	if sub.StateMachine.Initial != "pending" {
		t.Errorf("expected initial state 'pending', got %q", sub.StateMachine.Initial)
	}
}

func TestSubcontractorViewColumns(t *testing.T) {
	s := loadTestSpec(t)
	var sub *spec.Entity
	for i := range s.Entities {
		if s.Entities[i].Name == "Subcontractor" {
			sub = &s.Entities[i]
			break
		}
	}
	if sub == nil {
		t.Fatal("Subcontractor entity not found")
	}
	if sub.Views.List == nil {
		t.Fatal("expected list view on Subcontractor")
	}
	if len(sub.Views.List.Columns) != 7 {
		t.Errorf("expected 7 list columns, got %d", len(sub.Views.List.Columns))
	}
}

func TestNavigationItems(t *testing.T) {
	s := loadTestSpec(t)
	if len(s.Navigation.Items) != 7 {
		t.Errorf("expected 7 navigation items, got %d", len(s.Navigation.Items))
	}

	// Check the compliance group has children
	var compliance *spec.NavItem
	for i := range s.Navigation.Items {
		if s.Navigation.Items[i].ID == "compliance" {
			compliance = &s.Navigation.Items[i]
			break
		}
	}
	if compliance == nil {
		t.Fatal("compliance nav item not found")
	}
	if len(compliance.Children) != 3 {
		t.Errorf("expected 3 compliance children, got %d", len(compliance.Children))
	}
}

func TestAuthRoles(t *testing.T) {
	s := loadTestSpec(t)
	if len(s.Auth.Roles) != 4 {
		t.Errorf("expected 4 roles, got %d", len(s.Auth.Roles))
	}
	admin, ok := s.Auth.Roles["admin"]
	if !ok {
		t.Fatal("admin role not found")
	}
	if admin.DisplayName != "Administrator" {
		t.Errorf("expected admin display name 'Administrator', got %q", admin.DisplayName)
	}
}

func TestPages(t *testing.T) {
	s := loadTestSpec(t)
	if len(s.Pages) != 4 {
		t.Errorf("expected 4 pages, got %d", len(s.Pages))
	}
}
