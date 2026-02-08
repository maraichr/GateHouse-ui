package compose

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"time"

	"github.com/maraichr/GateHouse-ui/internal/engine"
	"github.com/maraichr/GateHouse-ui/internal/parser"
)

// ServiceState holds a fetched and built service's partial tree.
type ServiceState struct {
	Source  ServiceSource
	Tree    *engine.ComponentTree
	Healthy bool
	Error   error
}

var httpClient = &http.Client{Timeout: 10 * time.Second}

// FetchAndBuild loads a spec from the service source and builds its partial ComponentTree.
// It reuses the existing parser + engine pipeline — no new parsing code.
func FetchAndBuild(src ServiceSource, target string) (*ServiceState, error) {
	state := &ServiceState{Source: src, Healthy: true}

	if src.SpecPath != "" {
		return buildFromFile(state, src.SpecPath, target)
	}
	if src.SpecURL != "" {
		return buildFromURL(state, src.SpecURL, target)
	}
	return nil, fmt.Errorf("service %q: no spec_path or spec_url", src.Name)
}

func buildFromFile(state *ServiceState, path, target string) (*ServiceState, error) {
	version, data, err := parser.DetectSchemaVersion(path)
	if err != nil {
		state.Error = err
		state.Healthy = false
		return state, err
	}

	tree, err := buildTree(version, data, path, target)
	if err != nil {
		state.Error = err
		state.Healthy = false
		return state, err
	}
	state.Tree = tree
	return state, nil
}

func buildFromURL(state *ServiceState, specURL, target string) (*ServiceState, error) {
	resp, err := httpClient.Get(specURL)
	if err != nil {
		state.Error = fmt.Errorf("fetching spec from %s: %w", specURL, err)
		state.Healthy = false
		return state, state.Error
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		state.Error = fmt.Errorf("spec endpoint %s returned %d", specURL, resp.StatusCode)
		state.Healthy = false
		return state, state.Error
	}

	contentType := resp.Header.Get("Content-Type")

	// If the remote returns JSON (already a built ComponentTree), use it directly.
	if isJSON(contentType) {
		var tree engine.ComponentTree
		if err := json.NewDecoder(resp.Body).Decode(&tree); err != nil {
			state.Error = fmt.Errorf("decoding component tree from %s: %w", specURL, err)
			state.Healthy = false
			return state, state.Error
		}
		state.Tree = &tree
		return state, nil
	}

	// Otherwise treat as YAML spec and build through the pipeline.
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		state.Error = fmt.Errorf("reading spec body from %s: %w", specURL, err)
		state.Healthy = false
		return state, state.Error
	}

	tree, err := buildTreeFromData(data, target)
	if err != nil {
		state.Error = err
		state.Healthy = false
		return state, err
	}
	state.Tree = tree
	return state, nil
}

func buildTree(version string, data []byte, path, target string) (*engine.ComponentTree, error) {
	if parser.IsResolvedSchema(version) {
		resolved, err := parser.ParseResolved(data)
		if err != nil {
			return nil, fmt.Errorf("parsing resolved spec: %w", err)
		}
		tree, err := engine.BuildResolvedTree(resolved)
		if err != nil {
			return nil, fmt.Errorf("building resolved tree: %w", err)
		}
		tree.Metadata.Target = target
		return tree, nil
	}

	appSpec, err := parser.Parse(path)
	if err != nil {
		return nil, fmt.Errorf("parsing spec: %w", err)
	}

	analysis := engine.Analyze(appSpec)
	builder := engine.NewBuilder()
	tree := builder.Build(appSpec, analysis)
	tree.Metadata.Target = target
	return tree, nil
}

func buildTreeFromData(data []byte, target string) (*engine.ComponentTree, error) {
	// Probe for schema version
	version, _, _ := probeSchemaVersion(data)

	if parser.IsResolvedSchema(version) {
		resolved, err := parser.ParseResolved(data)
		if err != nil {
			return nil, fmt.Errorf("parsing resolved spec from remote: %w", err)
		}
		tree, err := engine.BuildResolvedTree(resolved)
		if err != nil {
			return nil, fmt.Errorf("building resolved tree from remote: %w", err)
		}
		tree.Metadata.Target = target
		return tree, nil
	}

	// For v1 YAML from remote, we can't use parser.Parse (needs file path).
	// Log a warning — remote YAML specs should use the resolved schema or
	// serve a pre-built ComponentTree as JSON.
	slog.Warn("remote YAML spec without resolved schema; prefer JSON ComponentTree or gh.ui.v2 format")
	return nil, fmt.Errorf("remote v1 YAML specs are not supported; use spec_url returning JSON tree or gh.ui.v2 YAML")
}

func probeSchemaVersion(data []byte) (string, []byte, error) {
	// Lightweight check: look for metadata.schema_version in the YAML data
	type probe struct {
		Metadata struct {
			SchemaVersion string `json:"schema_version" yaml:"schema_version"`
		} `json:"metadata" yaml:"metadata"`
	}
	var p probe
	// Try YAML first (covers both YAML and JSON since JSON is valid YAML)
	if err := json.Unmarshal(data, &p); err == nil && p.Metadata.SchemaVersion != "" {
		return p.Metadata.SchemaVersion, data, nil
	}
	return "", data, nil
}

func isJSON(contentType string) bool {
	return contentType == "application/json" ||
		len(contentType) > 16 && contentType[:16] == "application/json"
}
