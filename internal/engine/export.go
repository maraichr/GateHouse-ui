package engine

import (
	"encoding/json"
	"fmt"

	"github.com/maraichr/GateHouse-ui/pkg/spec"
	"gopkg.in/yaml.v3"
)

// ExportSpecToYAML converts JSON-encoded spec data back to YAML.
func ExportSpecToYAML(specData json.RawMessage) ([]byte, error) {
	var appSpec spec.AppSpec
	if err := json.Unmarshal(specData, &appSpec); err != nil {
		return nil, fmt.Errorf("parsing spec JSON: %w", err)
	}

	yamlBytes, err := yaml.Marshal(&appSpec)
	if err != nil {
		return nil, fmt.Errorf("marshaling to YAML: %w", err)
	}
	return yamlBytes, nil
}
