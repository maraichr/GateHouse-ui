package compose

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

// CompositionConfig defines a multi-service UI composition.
// A "host" spec owns the app shell (theme, auth, shell config).
// Remote/local "services" contribute entities, pages, and nav items.
type CompositionConfig struct {
	Host     ServiceSource   `yaml:"host"`
	Services []ServiceSource `yaml:"services"`
}

// ServiceSource describes where to load a UI spec from and how to route its API traffic.
type ServiceSource struct {
	Name      string `yaml:"name"`
	SpecURL   string `yaml:"spec_url,omitempty"`   // remote HTTP endpoint
	SpecPath  string `yaml:"spec_path,omitempty"`  // local file path
	DataURL   string `yaml:"data_url,omitempty"`   // remote API proxy target
	DataPath  string `yaml:"data_path,omitempty"`  // local mock data JSON
	Prefix    string `yaml:"prefix,omitempty"`     // API prefix routing (e.g. /orders)
	NavGroup  string `yaml:"nav_group,omitempty"`  // sidebar group label
	NavOrder  int    `yaml:"nav_order,omitempty"`  // sidebar sort order
	Optional  bool   `yaml:"optional,omitempty"`   // app works if this service is down
	Watch     bool   `yaml:"watch,omitempty"`      // watch local file for changes
	HealthURL string `yaml:"health_url,omitempty"` // custom health check URL
}

// LoadConfigFromBytes parses and validates a composition config from raw YAML bytes.
func LoadConfigFromBytes(data []byte) (*CompositionConfig, error) {
	var cfg CompositionConfig
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("parsing composition config: %w", err)
	}
	if err := cfg.validate(); err != nil {
		return nil, err
	}
	return &cfg, nil
}

// LoadConfig reads and validates a composition config YAML file.
func LoadConfig(path string) (*CompositionConfig, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("reading composition config: %w", err)
	}

	var cfg CompositionConfig
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("parsing composition config: %w", err)
	}

	if err := cfg.validate(); err != nil {
		return nil, err
	}

	return &cfg, nil
}

func (c *CompositionConfig) validate() error {
	if c.Host.Name == "" {
		return fmt.Errorf("compose: host.name is required")
	}
	if c.Host.SpecPath == "" && c.Host.SpecURL == "" {
		return fmt.Errorf("compose: host must have spec_path or spec_url")
	}

	seen := map[string]bool{c.Host.Name: true}
	seenPrefixes := map[string]bool{}

	for i, svc := range c.Services {
		if svc.Name == "" {
			return fmt.Errorf("compose: services[%d].name is required", i)
		}
		if seen[svc.Name] {
			return fmt.Errorf("compose: duplicate service name %q", svc.Name)
		}
		seen[svc.Name] = true

		if svc.SpecPath == "" && svc.SpecURL == "" {
			return fmt.Errorf("compose: service %q must have spec_path or spec_url", svc.Name)
		}
		if svc.Prefix != "" {
			if seenPrefixes[svc.Prefix] {
				return fmt.Errorf("compose: duplicate prefix %q", svc.Prefix)
			}
			seenPrefixes[svc.Prefix] = true
		}
	}

	return nil
}

// LocalSpecPaths returns all local spec file paths for file watching.
func (c *CompositionConfig) LocalSpecPaths() []string {
	var paths []string
	if c.Host.SpecPath != "" {
		paths = append(paths, c.Host.SpecPath)
	}
	for _, svc := range c.Services {
		if svc.SpecPath != "" && svc.Watch {
			paths = append(paths, svc.SpecPath)
		}
	}
	return paths
}
