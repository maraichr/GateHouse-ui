package engine

import (
	"encoding/json"
	"fmt"

	"github.com/maraichr/GateHouse-ui/pkg/spec"
)

// CoverageReport is the overall spec coverage analysis.
type CoverageReport struct {
	Overall  float64          `json:"overall"`
	Entities []EntityCoverage `json:"entities"`
	Summary  CoverageSummary  `json:"summary"`
	Gaps     []CoverageGap    `json:"gaps"`
}

type CoverageSummary struct {
	EntityCount      int     `json:"entity_count"`
	FieldCount       int     `json:"field_count"`
	StateMachineCount int    `json:"state_machine_count"`
	ViewCount        int     `json:"view_count"`
	PageCount        int     `json:"page_count"`
	NavItemCount     int     `json:"nav_item_count"`
	RoleCount        int     `json:"role_count"`
	FieldScore       float64 `json:"field_score"`
	StateMachineScore float64 `json:"state_machine_score"`
	ViewScore        float64 `json:"view_score"`
	PermissionScore  float64 `json:"permission_score"`
	NavigationScore  float64 `json:"navigation_score"`
}

type EntityCoverage struct {
	Name             string  `json:"name"`
	Overall          float64 `json:"overall"`
	FieldScore       float64 `json:"field_score"`
	StateMachineScore float64 `json:"state_machine_score"`
	ViewScore        float64 `json:"view_score"`
	PermissionScore  float64 `json:"permission_score"`
	FieldCount       int     `json:"field_count"`
	HasStateMachine  bool    `json:"has_state_machine"`
	HasListView      bool    `json:"has_list_view"`
	HasDetailView    bool    `json:"has_detail_view"`
	HasCreateForm    bool    `json:"has_create_form"`
	HasEditForm      bool    `json:"has_edit_form"`
	RelationshipCount int    `json:"relationship_count"`
}

type CoverageGap struct {
	Entity  string `json:"entity"`
	Area    string `json:"area"`
	Message string `json:"message"`
	Severity string `json:"severity"` // warning | info
}

// AnalyzeCoverage analyzes spec coverage from JSON-encoded spec data.
func AnalyzeCoverage(specData json.RawMessage) (*CoverageReport, error) {
	var appSpec spec.AppSpec
	if err := json.Unmarshal(specData, &appSpec); err != nil {
		return nil, fmt.Errorf("parsing spec data: %w", err)
	}
	return AnalyzeCoverageFromSpec(&appSpec), nil
}

// AnalyzeCoverageFromSpec analyzes spec coverage from an AppSpec.
func AnalyzeCoverageFromSpec(appSpec *spec.AppSpec) *CoverageReport {
	report := &CoverageReport{}

	totalFields := 0
	totalStateMachines := 0
	entities := make([]EntityCoverage, 0)

	for _, entity := range appSpec.Entities {
		ec := analyzeEntityCoverage(&entity)
		entities = append(entities, ec)
		totalFields += ec.FieldCount
		if ec.HasStateMachine {
			totalStateMachines++
		}
	}

	report.Entities = entities

	// Compute summary scores (weighted: fields 30%, state machines 20%, views 25%, permissions 15%, navigation 10%)
	var fieldScoreSum, smScoreSum, viewScoreSum, permScoreSum float64
	n := float64(len(entities))
	if n == 0 {
		n = 1
	}
	for _, ec := range entities {
		fieldScoreSum += ec.FieldScore
		smScoreSum += ec.StateMachineScore
		viewScoreSum += ec.ViewScore
		permScoreSum += ec.PermissionScore
	}

	fieldScore := fieldScoreSum / n
	smScore := smScoreSum / n
	viewScore := viewScoreSum / n
	permScore := permScoreSum / n
	navScore := analyzeNavigationCoverage(appSpec)

	report.Summary = CoverageSummary{
		EntityCount:       len(appSpec.Entities),
		FieldCount:        totalFields,
		StateMachineCount: totalStateMachines,
		ViewCount:         countViews(appSpec),
		PageCount:         len(appSpec.Pages),
		NavItemCount:      countNavItems(appSpec),
		RoleCount:         len(appSpec.Auth.Roles),
		FieldScore:        fieldScore,
		StateMachineScore: smScore,
		ViewScore:         viewScore,
		PermissionScore:   permScore,
		NavigationScore:   navScore,
	}

	report.Overall = fieldScore*0.30 + smScore*0.20 + viewScore*0.25 + permScore*0.15 + navScore*0.10
	report.Gaps = findGaps(appSpec, entities)

	return report
}

func analyzeEntityCoverage(entity *spec.Entity) EntityCoverage {
	ec := EntityCoverage{
		Name:              entity.Name,
		FieldCount:        len(entity.Fields),
		HasStateMachine:   entity.StateMachine != nil,
		HasListView:       entity.Views.List != nil,
		HasDetailView:     entity.Views.Detail != nil,
		HasCreateForm:     entity.Views.Create != nil,
		HasEditForm:       entity.Views.Edit != nil,
		RelationshipCount: len(entity.Relationships),
	}

	// Field score: based on display_name, type, and constraints
	if len(entity.Fields) > 0 {
		fieldComplete := 0
		for _, f := range entity.Fields {
			score := 0
			if f.DisplayName != "" {
				score++
			}
			if f.Type != "" {
				score++
			}
			if f.Type == "enum" && len(f.Values) > 0 {
				score++
			}
			if f.HelpText != "" {
				score++
			}
			// Max score of 4 per field
			if score >= 2 {
				fieldComplete++
			}
		}
		ec.FieldScore = float64(fieldComplete) / float64(len(entity.Fields)) * 100
	}

	// State machine score
	if entity.StateMachine != nil {
		sm := entity.StateMachine
		score := 50.0 // base for having one
		if sm.Initial != "" {
			score += 10
		}
		if len(sm.Transitions) > 0 {
			score += 20
			// Check transition quality
			guardCount := 0
			for _, t := range sm.Transitions {
				if len(t.Guards) > 0 {
					guardCount++
				}
			}
			if guardCount > 0 {
				score += 20
			}
		}
		ec.StateMachineScore = min(score, 100)
	} else {
		ec.StateMachineScore = 100 // No SM needed = full coverage
	}

	// View score
	viewScore := 0.0
	viewCount := 0.0
	if entity.Views.List != nil {
		viewScore += 25
		viewCount++
		if len(entity.Views.List.Columns) > 0 {
			viewScore += 10
		}
		if entity.Views.List.Filters != nil {
			viewScore += 5
		}
		if entity.Views.List.Search != nil {
			viewScore += 5
		}
	}
	if entity.Views.Detail != nil {
		viewScore += 25
		viewCount++
	}
	if entity.Views.Create != nil {
		viewScore += 15
		viewCount++
	}
	if entity.Views.Edit != nil {
		viewScore += 15
		viewCount++
	}
	ec.ViewScore = min(viewScore, 100)

	// Permission score (based on having permissions defined on transitions/sections)
	permDefined := 0
	permTotal := 0
	if entity.StateMachine != nil {
		for _, t := range entity.StateMachine.Transitions {
			permTotal++
			if len(t.Permissions) > 0 {
				permDefined++
			}
		}
	}
	if permTotal > 0 {
		ec.PermissionScore = float64(permDefined) / float64(permTotal) * 100
	} else {
		ec.PermissionScore = 100
	}

	// Overall = weighted average of sub-scores
	_ = viewCount
	ec.Overall = ec.FieldScore*0.30 + ec.StateMachineScore*0.20 + ec.ViewScore*0.25 + ec.PermissionScore*0.25

	return ec
}

func analyzeNavigationCoverage(appSpec *spec.AppSpec) float64 {
	if len(appSpec.Navigation.Items) == 0 {
		return 0
	}
	entitySet := make(map[string]bool)
	for _, e := range appSpec.Entities {
		entitySet[e.Name] = true
	}

	// Count how many entities have nav items
	navEntities := countNavEntities(appSpec.Navigation.Items)
	if len(entitySet) == 0 {
		return 100
	}
	coverage := float64(navEntities) / float64(len(entitySet)) * 100
	return min(coverage, 100)
}

func countNavEntities(items []spec.NavItem) int {
	count := 0
	for _, item := range items {
		if item.Entity != "" {
			count++
		}
		count += countNavEntities(item.Children)
	}
	return count
}

func countViews(appSpec *spec.AppSpec) int {
	count := 0
	for _, e := range appSpec.Entities {
		if e.Views.List != nil {
			count++
		}
		if e.Views.Detail != nil {
			count++
		}
		if e.Views.Create != nil {
			count++
		}
		if e.Views.Edit != nil {
			count++
		}
	}
	return count
}

func countNavItems(appSpec *spec.AppSpec) int {
	return countNavItemsRecursive(appSpec.Navigation.Items)
}

func countNavItemsRecursive(items []spec.NavItem) int {
	count := len(items)
	for _, item := range items {
		count += countNavItemsRecursive(item.Children)
	}
	return count
}

func findGaps(appSpec *spec.AppSpec, entities []EntityCoverage) []CoverageGap {
	gaps := make([]CoverageGap, 0)

	for _, ec := range entities {
		if !ec.HasListView {
			gaps = append(gaps, CoverageGap{
				Entity:   ec.Name,
				Area:     "views",
				Message:  "Missing list view",
				Severity: "warning",
			})
		}
		if !ec.HasDetailView {
			gaps = append(gaps, CoverageGap{
				Entity:   ec.Name,
				Area:     "views",
				Message:  "Missing detail view",
				Severity: "warning",
			})
		}
		if !ec.HasCreateForm {
			gaps = append(gaps, CoverageGap{
				Entity:   ec.Name,
				Area:     "views",
				Message:  "Missing create form",
				Severity: "info",
			})
		}
		if ec.FieldScore < 50 {
			gaps = append(gaps, CoverageGap{
				Entity:   ec.Name,
				Area:     "fields",
				Message:  "Low field coverage — many fields missing display_name or help_text",
				Severity: "warning",
			})
		}
		if ec.PermissionScore < 50 {
			gaps = append(gaps, CoverageGap{
				Entity:   ec.Name,
				Area:     "permissions",
				Message:  "Many transitions missing permission definitions",
				Severity: "warning",
			})
		}
	}

	// Check navigation gaps
	entitySet := make(map[string]bool)
	for _, e := range appSpec.Entities {
		entitySet[e.Name] = true
	}
	navEntities := make(map[string]bool)
	collectNavEntities(appSpec.Navigation.Items, navEntities)
	for name := range entitySet {
		if !navEntities[name] {
			gaps = append(gaps, CoverageGap{
				Entity:   name,
				Area:     "navigation",
				Message:  "Entity not reachable via navigation",
				Severity: "info",
			})
		}
	}

	return gaps
}

func collectNavEntities(items []spec.NavItem, m map[string]bool) {
	for _, item := range items {
		if item.Entity != "" {
			m[item.Entity] = true
		}
		collectNavEntities(item.Children, m)
	}
}
