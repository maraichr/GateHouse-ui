package parser

import (
	"fmt"

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

		// Note: list column field references are not strictly validated
		// because they may reference computed fields or implicit timestamp fields.

		// Validate filter fields exist (filterable check is a warning, not error)
		if e.Views.List != nil && e.Views.List.Filters != nil {
			for _, group := range e.Views.List.Filters.Groups {
				for _, ff := range group.Fields {
					if _, ok := fIdx[ff.Field]; !ok {
						errs = append(errs, ValidationError{
							Path:    fmt.Sprintf("entities[%s].views.list.filters[%s]", e.Name, ff.Field),
							Message: fmt.Sprintf("field %q not found", ff.Field),
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

	// Note: navigation entity/page references are not strictly validated
	// because they may reference external entities or pages not in this spec.

	return errs
}
