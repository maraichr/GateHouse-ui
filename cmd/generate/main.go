package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"

	"github.com/maraichr/GateHouse-ui/internal/compose"
	"github.com/maraichr/GateHouse-ui/internal/generate"
	"github.com/maraichr/GateHouse-ui/internal/parser"
	"github.com/maraichr/GateHouse-ui/pkg/spec"
)

func main() {
	specPath := flag.String("spec", "", "Path to a UI spec YAML file")
	composeFile := flag.String("compose", "", "Path to composition config YAML (multi-service mode)")
	output := flag.String("output", "", "Output file path (default: stdout)")
	flag.StringVar(output, "o", "", "Output file path (shorthand)")
	count := flag.Int("count", 10, "Number of records per entity")
	seed := flag.Int64("seed", 0, "Random seed (0 = random)")
	flag.Parse()

	if *specPath == "" && *composeFile == "" {
		fmt.Fprintln(os.Stderr, "Usage: generate --spec <path> | --compose <path> [--count N] [--seed N] [-o output.json]")
		os.Exit(1)
	}

	specs, err := loadSpecs(*specPath, *composeFile)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error loading specs: %v\n", err)
		os.Exit(1)
	}

	cfg := generate.Config{
		Count: *count,
		Seed:  *seed,
	}

	gen := generate.NewGenerator(cfg, specs...)
	data, err := gen.Generate()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error generating data: %v\n", err)
		os.Exit(1)
	}

	jsonBytes, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error marshaling JSON: %v\n", err)
		os.Exit(1)
	}

	if *output != "" {
		if err := os.WriteFile(*output, jsonBytes, 0644); err != nil {
			fmt.Fprintf(os.Stderr, "Error writing file: %v\n", err)
			os.Exit(1)
		}
		fmt.Fprintf(os.Stderr, "Generated %d bytes → %s\n", len(jsonBytes), *output)
	} else {
		fmt.Println(string(jsonBytes))
	}
}

func loadSpecs(specPath, composeFile string) ([]*spec.AppSpec, error) {
	if specPath != "" {
		appSpec, err := parser.Parse(specPath)
		if err != nil {
			return nil, err
		}
		return []*spec.AppSpec{appSpec}, nil
	}

	// Compose mode: load all service specs
	cfg, err := compose.LoadConfig(composeFile)
	if err != nil {
		return nil, err
	}

	var specs []*spec.AppSpec

	// Load host spec (paths in compose.yaml are relative to CWD)
	hostPath := cfg.Host.SpecPath
	hostSpec, err := parser.Parse(hostPath)
	if err != nil {
		return nil, fmt.Errorf("host spec %q: %w", hostPath, err)
	}
	specs = append(specs, hostSpec)

	// Load service specs
	for _, svc := range cfg.Services {
		svcPath := svc.SpecPath
		if svcPath == "" {
			continue // remote-only service, skip
		}
		svcSpec, err := parser.Parse(svcPath)
		if err != nil {
			return nil, fmt.Errorf("service %q spec %q: %w", svc.Name, svcPath, err)
		}
		specs = append(specs, svcSpec)
	}

	return specs, nil
}
