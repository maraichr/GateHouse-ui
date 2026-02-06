package parser

import (
	"fmt"
	"os"

	"github.com/maraichr/GateHouse-ui/pkg/spec"
	"gopkg.in/yaml.v3"
)

const resolvedSchemaVersion = "gh.ui.v2"

type schemaProbe struct {
	Metadata struct {
		SchemaVersion string `yaml:"schema_version"`
	} `yaml:"metadata"`
}

func DetectSchemaVersion(path string) (string, []byte, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", nil, fmt.Errorf("reading spec file: %w", err)
	}

	var probe schemaProbe
	if err := yaml.Unmarshal(data, &probe); err != nil {
		return "", data, fmt.Errorf("parsing schema probe: %w", err)
	}

	return probe.Metadata.SchemaVersion, data, nil
}

func ParseResolved(data []byte) (*spec.ResolvedSpec, error) {
	var resolved spec.ResolvedSpec
	if err := yaml.Unmarshal(data, &resolved); err != nil {
		return nil, fmt.Errorf("parsing resolved YAML: %w", err)
	}
	if resolved.Metadata.SchemaVersion != resolvedSchemaVersion {
		return nil, fmt.Errorf("unsupported resolved schema version %q", resolved.Metadata.SchemaVersion)
	}
	return &resolved, nil
}

func IsResolvedSchema(version string) bool {
	return version == resolvedSchemaVersion
}
