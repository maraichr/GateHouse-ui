package parser

import (
	"fmt"
	"strings"

	"github.com/maraichr/GateHouse-ui/pkg/spec"
)

func Validate(s *spec.AppSpec) []ValidationError {
	var errs []ValidationError

	if s.App.Name == "" {
		errs = append(errs, ValidationError{Path: "app.name", Message: "required"})
	}

	entityIndex := make(map[string]*spec.Entity)
	fieldIndex := make(map[string]map[string]*spec.Field)

	for i := range s.Entities {
		e := &s.Entities[i]
		if _, exists := entityIndex[e.Name]; exists {
			errs = append(errs, ValidationError{
				Path:    fmt.Sprintf("entities[%d].name", i),
				Message: fmt.Sprintf("duplicate entity name %q", e.Name),
			})
		}
		entityIndex[e.Name] = e

		fIdx := make(map[string]*spec.Field)
		for j := range e.Fields {
			f := &e.Fields[j]
			fIdx[f.Name] = f
		}
		fieldIndex[e.Name] = fIdx
	}

	for i := range s.Entities {
		e := &s.Entities[i]
		fIdx := fieldIndex[e.Name]
		fieldPaths := buildFieldPathIndex(e.Fields, "")

		// label_field must exist
		if e.LabelField != "" {
			if _, ok := fIdx[e.LabelField]; !ok {
				errs = append(errs, ValidationError{
					Path:    fmt.Sprintf("entities[%s].label_field", e.Name),
					Message: fmt.Sprintf("field %q not found", e.LabelField),
				})
			}
		}

		// status_field must exist
		if e.StatusField != "" {
			if _, ok := fIdx[e.StatusField]; !ok {
				errs = append(errs, ValidationError{
					Path:    fmt.Sprintf("entities[%s].status_field", e.Name),
					Message: fmt.Sprintf("field %q not found", e.StatusField),
				})
			}
		}

		// state machine field must be an enum with matching values
		if e.StateMachine != nil {
			sf, ok := fIdx[e.StateMachine.Field]
			if !ok {
				errs = append(errs, ValidationError{
					Path:    fmt.Sprintf("entities[%s].state_machine.field", e.Name),
					Message: fmt.Sprintf("field %q not found", e.StateMachine.Field),
				})
			} else if sf.Type == "enum" {
				enumVals := make(map[string]bool)
				for _, v := range sf.Values {
					enumVals[v.Value] = true
				}
				// Check initial state
				if !enumVals[e.StateMachine.Initial] {
					errs = append(errs, ValidationError{
						Path:    fmt.Sprintf("entities[%s].state_machine.initial", e.Name),
						Message: fmt.Sprintf("initial state %q not in enum values", e.StateMachine.Initial),
					})
				}
				// Check transition from/to
				for _, t := range e.StateMachine.Transitions {
					for _, from := range t.From {
						if !enumVals[from] {
							errs = append(errs, ValidationError{
								Path:    fmt.Sprintf("entities[%s].state_machine.transitions[%s].from", e.Name, t.Name),
								Message: fmt.Sprintf("state %q not in enum values", from),
							})
						}
					}
					if !enumVals[t.To] {
						errs = append(errs, ValidationError{
							Path:    fmt.Sprintf("entities[%s].state_machine.transitions[%s].to", e.Name, t.Name),
							Message: fmt.Sprintf("state %q not in enum values", t.To),
						})
					}
				}
			}
		}

		// Note: relationship entity references are not strictly validated
		// because they may reference entities defined externally.
		for _, rel := range e.Relationships {
			if rel.Type == "many_to_many" && strings.TrimSpace(rel.Through) == "" {
				errs = append(errs, ValidationError{
					Path:    fmt.Sprintf("entities[%s].relationships[%s].through", e.Name, rel.Name),
					Message: "required for many_to_many relationships",
				})
			}
		}

		// Note: list column field references are not strictly validated
		// because they may reference computed fields or implicit timestamp fields.

		// Validate filter fields exist (filterable check is a warning, not error)
		if e.Views.List != nil && e.Views.List.Filters != nil {
			for _, group := range e.Views.List.Filters.Groups {
				for _, ff := range group.Fields {
					if !fieldPaths[ff.Field] {
						errs = append(errs, ValidationError{
							Path:    fmt.Sprintf("entities[%s].views.list.filters[%s]", e.Name, ff.Field),
							Message: fmt.Sprintf("field %q not found", ff.Field),
						})
					}
				}
			}
		}

		if e.Views.List != nil {
			if e.Views.List.DefaultSort != nil && isNestedPath(e.Views.List.DefaultSort.Field) && !fieldPaths[e.Views.List.DefaultSort.Field] {
				errs = append(errs, ValidationError{
					Path:    fmt.Sprintf("entities[%s].views.list.default_sort.field", e.Name),
					Message: fmt.Sprintf("field %q not found", e.Views.List.DefaultSort.Field),
				})
			}
			for idx, col := range e.Views.List.Columns {
				if col.Field != "" && isNestedPath(col.Field) && !fieldPaths[col.Field] {
					errs = append(errs, ValidationError{
						Path:    fmt.Sprintf("entities[%s].views.list.columns[%d].field", e.Name, idx),
						Message: fmt.Sprintf("field %q not found", col.Field),
					})
				}
			}
			if e.Views.List.Search != nil {
				for idx, name := range e.Views.List.Search.Fields {
					if isNestedPath(name) && !fieldPaths[name] {
						errs = append(errs, ValidationError{
							Path:    fmt.Sprintf("entities[%s].views.list.search.fields[%d]", e.Name, idx),
							Message: fmt.Sprintf("field %q not found", name),
						})
					}
				}
			}
		}

		if e.Views.Detail != nil {
			for ti, tab := range e.Views.Detail.Tabs {
				for si, section := range tab.Sections {
					for fi, name := range section.Fields {
						if isNestedPath(name) && !fieldPaths[name] {
							errs = append(errs, ValidationError{
								Path:    fmt.Sprintf("entities[%s].views.detail.tabs[%d].sections[%d].fields[%d]", e.Name, ti, si, fi),
								Message: fmt.Sprintf("field %q not found", name),
							})
						}
					}
				}
			}
			for si, section := range e.Views.Detail.Left {
				for fi, name := range section.Fields {
					if isNestedPath(name) && !fieldPaths[name] {
						errs = append(errs, ValidationError{
							Path:    fmt.Sprintf("entities[%s].views.detail.left[%d].fields[%d]", e.Name, si, fi),
							Message: fmt.Sprintf("field %q not found", name),
						})
					}
				}
			}
			if e.Views.Detail.Right != nil {
				for si, section := range e.Views.Detail.Right.Sections {
					for fi, name := range section.Fields {
						if isNestedPath(name) && !fieldPaths[name] {
							errs = append(errs, ValidationError{
								Path:    fmt.Sprintf("entities[%s].views.detail.right.sections[%d].fields[%d]", e.Name, si, fi),
								Message: fmt.Sprintf("field %q not found", name),
							})
						}
					}
				}
			}
		}

		for viewName, form := range map[string]*spec.FormView{
			"create": e.Views.Create,
			"edit":   e.Views.Edit,
		} {
			if form == nil {
				continue
			}
			for si, section := range form.Sections {
				for fi, name := range section.Fields {
					if isNestedPath(name) && !fieldPaths[name] {
						errs = append(errs, ValidationError{
							Path:    fmt.Sprintf("entities[%s].views.%s.sections[%d].fields[%d]", e.Name, viewName, si, fi),
							Message: fmt.Sprintf("field %q not found", name),
						})
					}
				}
			}
			for si, step := range form.Steps {
				for fi, name := range step.Fields {
					if isNestedPath(name) && !fieldPaths[name] {
						errs = append(errs, ValidationError{
							Path:    fmt.Sprintf("entities[%s].views.%s.steps[%d].fields[%d]", e.Name, viewName, si, fi),
							Message: fmt.Sprintf("field %q not found", name),
						})
					}
				}
			}
		}

		// Validate permissions reference defined roles
		if e.StateMachine != nil && len(s.Auth.Roles) > 0 {
			for _, t := range e.StateMachine.Transitions {
				for _, perm := range t.Permissions {
					if _, ok := s.Auth.Roles[perm]; !ok {
						errs = append(errs, ValidationError{
							Path:    fmt.Sprintf("entities[%s].state_machine.transitions[%s].permissions", e.Name, t.Name),
							Message: fmt.Sprintf("role %q not defined in auth.roles", perm),
						})
					}
				}
			}
		}
	}

	pageIndex := make(map[string]spec.Page, len(s.Pages))
	for i, page := range s.Pages {
		if strings.TrimSpace(page.ID) == "" {
			errs = append(errs, ValidationError{
				Path:    fmt.Sprintf("pages[%d].id", i),
				Message: "required",
			})
			continue
		}
		if _, exists := pageIndex[page.ID]; exists {
			errs = append(errs, ValidationError{
				Path:    fmt.Sprintf("pages[%d].id", i),
				Message: fmt.Sprintf("duplicate page id %q", page.ID),
			})
		}
		pageIndex[page.ID] = page
	}

	journeyIndex := make(map[string]spec.Journey, len(s.Journeys))
	journeyStepIndex := make(map[string]map[string]bool, len(s.Journeys))
	for i, journey := range s.Journeys {
		if strings.TrimSpace(journey.ID) == "" {
			errs = append(errs, ValidationError{
				Path:    fmt.Sprintf("journeys[%d].id", i),
				Message: "required",
			})
			continue
		}
		if _, exists := journeyIndex[journey.ID]; exists {
			errs = append(errs, ValidationError{
				Path:    fmt.Sprintf("journeys[%d].id", i),
				Message: fmt.Sprintf("duplicate journey id %q", journey.ID),
			})
		}
		journeyIndex[journey.ID] = journey

		stepIDs := make(map[string]bool, len(journey.Steps))
		for stepIdx, step := range journey.Steps {
			if strings.TrimSpace(step.ID) == "" {
				errs = append(errs, ValidationError{
					Path:    fmt.Sprintf("journeys[%d].steps[%d].id", i, stepIdx),
					Message: "required",
				})
				continue
			}
			if stepIDs[step.ID] {
				errs = append(errs, ValidationError{
					Path:    fmt.Sprintf("journeys[%d].steps[%d].id", i, stepIdx),
					Message: fmt.Sprintf("duplicate step id %q", step.ID),
				})
			}
			stepIDs[step.ID] = true
			if strings.TrimSpace(step.PageID) != "" {
				if _, ok := pageIndex[step.PageID]; !ok {
					errs = append(errs, ValidationError{
						Path:    fmt.Sprintf("journeys[%d].steps[%d].page_id", i, stepIdx),
						Message: fmt.Sprintf("page %q not found", step.PageID),
					})
				}
			}
		}
		journeyStepIndex[journey.ID] = stepIDs
	}

	for i, page := range s.Pages {
		if strings.TrimSpace(page.Purpose) == "flow_step" {
			if strings.TrimSpace(page.JourneyID) == "" {
				errs = append(errs, ValidationError{
					Path:    fmt.Sprintf("pages[%d].journey_id", i),
					Message: "required when purpose=flow_step",
				})
			}
			if strings.TrimSpace(page.StepID) == "" {
				errs = append(errs, ValidationError{
					Path:    fmt.Sprintf("pages[%d].step_id", i),
					Message: "required when purpose=flow_step",
				})
			}
		}
		if strings.TrimSpace(page.JourneyID) != "" {
			if _, ok := journeyIndex[page.JourneyID]; !ok {
				errs = append(errs, ValidationError{
					Path:    fmt.Sprintf("pages[%d].journey_id", i),
					Message: fmt.Sprintf("journey %q not found", page.JourneyID),
				})
			} else if strings.TrimSpace(page.StepID) != "" && !journeyStepIndex[page.JourneyID][page.StepID] {
				errs = append(errs, ValidationError{
					Path:    fmt.Sprintf("pages[%d].step_id", i),
					Message: fmt.Sprintf("step %q not found in journey %q", page.StepID, page.JourneyID),
				})
			}
		}
	}

	errs = append(errs, validateNavTargets(s.Navigation.Items)...)

	return errs
}

func buildFieldPathIndex(fields []spec.Field, prefix string) map[string]bool {
	index := make(map[string]bool)

	for _, f := range fields {
		name := f.Name
		path := name
		if prefix != "" {
			path = prefix + "." + name
		}
		index[name] = true
		index[path] = true
		if f.Path != "" {
			index[f.Path] = true
		}

		if f.Type == "object" && len(f.Fields) > 0 {
			for k, v := range buildFieldPathIndex(f.Fields, path) {
				index[k] = v
			}
		}
		if f.Type == "array" && f.Items != nil && len(f.Items.Fields) > 0 {
			itemPrefix := path + "[]"
			for k, v := range buildFieldPathIndex(f.Items.Fields, itemPrefix) {
				index[k] = v
			}
		}
	}

	return index
}

func isNestedPath(name string) bool {
	return strings.Contains(name, ".") || strings.Contains(name, "[]")
}

func validateNavTargets(items []spec.NavItem) []ValidationError {
	var errs []ValidationError
	for _, item := range items {
		if item.Target != nil {
			if strings.TrimSpace(item.Target.Type) == "" {
				errs = append(errs, ValidationError{
					Path:    fmt.Sprintf("navigation.items[%s].target.type", item.ID),
					Message: "required",
				})
			}
			if strings.TrimSpace(item.Target.Ref) == "" {
				errs = append(errs, ValidationError{
					Path:    fmt.Sprintf("navigation.items[%s].target.ref", item.ID),
					Message: "required",
				})
			}
		}
		if len(item.Children) > 0 {
			errs = append(errs, validateNavTargets(item.Children)...)
		}
	}
	return errs
}
