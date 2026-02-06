package parser

import (
	"fmt"
	"os"

	"github.com/maraichr/GateHouse-ui/pkg/spec"
	"gopkg.in/yaml.v3"
)

func Parse(path string) (*spec.AppSpec, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("reading spec file: %w", err)
	}

	var appSpec spec.AppSpec
	if err := yaml.Unmarshal(data, &appSpec); err != nil {
		return nil, fmt.Errorf("parsing YAML: %w", err)
	}

	if errs := Validate(&appSpec); len(errs) > 0 {
		return nil, &ValidationErrors{Errors: errs}
	}

	return &appSpec, nil
}

type ValidationErrors struct {
	Errors []ValidationError
}

type ValidationError struct {
	Path    string
	Message string
}

func (e *ValidationErrors) Error() string {
	msg := fmt.Sprintf("%d validation error(s):", len(e.Errors))
	for _, err := range e.Errors {
		msg += fmt.Sprintf("\n  - %s: %s", err.Path, err.Message)
	}
	return msg
}
