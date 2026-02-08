package serve

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"sync/atomic"

	"github.com/maraichr/GateHouse-ui/internal/engine"
	"github.com/maraichr/GateHouse-ui/internal/parser"
)

type Server struct {
	specPath    string
	dataPath    string
	apiBaseURL  string
	examplesDir string
	port        int
	watch       bool
	appTarget   string
	currentTree atomic.Pointer[engine.ComponentTree]
	sseHub      *SSEHub
	mockStore   *MockStore
	mockMu      sync.RWMutex // guards mockStore swaps
}

type Config struct {
	SpecPath    string
	APIBaseURL  string
	DataPath    string
	ExamplesDir string
	Port        int
	Watch       bool
	Target      string
}

type ExampleInfo struct {
	Name    string `json:"name"`
	SpecDir string `json:"-"`
}

func NewServer(cfg Config) (*Server, error) {
	s := &Server{
		specPath:    cfg.SpecPath,
		dataPath:    cfg.DataPath,
		apiBaseURL:  cfg.APIBaseURL,
		examplesDir: cfg.ExamplesDir,
		port:        cfg.Port,
		watch:       cfg.Watch,
		appTarget:   cfg.Target,
		sseHub:      NewSSEHub(),
	}

	// If examples-dir provided but no spec, default to the first example
	if s.specPath == "" && s.examplesDir != "" {
		examples := s.listExamples()
		if len(examples) > 0 {
			s.specPath = filepath.Join(examples[0].SpecDir, "spec.yaml")
			s.dataPath = filepath.Join(examples[0].SpecDir, "data.json")
			slog.Info("auto-selected example", "name", examples[0].Name)
		}
	}

	if s.dataPath != "" {
		store, err := LoadMockData(s.dataPath)
		if err != nil {
			return nil, fmt.Errorf("loading mock data: %w", err)
		}
		s.mockStore = store
	}

	if err := s.loadSpec(); err != nil {
		return nil, err
	}

	return s, nil
}

func (s *Server) Start() error {
	if s.watch {
		go s.watchSpec()
	}

	handler := s.Routes()
	addr := fmt.Sprintf(":%d", s.port)
	slog.Info("server starting", "addr", addr, "spec", s.specPath)
	return http.ListenAndServe(addr, handler)
}

func (s *Server) loadSpec() error {
	version, data, err := parser.DetectSchemaVersion(s.specPath)
	if err != nil {
		return fmt.Errorf("detecting schema version: %w", err)
	}

	if parser.IsResolvedSchema(version) {
		resolved, err := parser.ParseResolved(data)
		if err != nil {
			return fmt.Errorf("parsing resolved spec: %w", err)
		}
		tree, err := engine.BuildResolvedTree(resolved)
		if err != nil {
			return fmt.Errorf("building resolved component tree: %w", err)
		}
		tree.Metadata.Target = s.target()
		s.currentTree.Store(tree)
		slog.Info("resolved spec loaded", "entities", len(resolved.Entities), "routes", len(resolved.Routes))
		return nil
	}

	appSpec, err := parser.Parse(s.specPath)
	if err != nil {
		return fmt.Errorf("parsing spec: %w", err)
	}

	analysis := engine.Analyze(appSpec)
	builder := engine.NewBuilder()
	tree := builder.Build(appSpec, analysis)

	tree.Metadata.Target = s.target()
	s.currentTree.Store(tree)
	slog.Info("spec loaded", "entities", len(appSpec.Entities), "pages", len(appSpec.Pages))
	return nil
}

func (s *Server) target() string {
	return s.appTarget
}

func (s *Server) handleGetSpec(w http.ResponseWriter, r *http.Request) {
	tree := s.currentTree.Load()
	if tree == nil {
		http.Error(w, `{"error":"spec not loaded"}`, http.StatusServiceUnavailable)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tree)
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	tree := s.currentTree.Load()
	status := "ok"
	if tree == nil {
		status = "no_spec"
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": status})
}

// --- Example switching ---

func (s *Server) listExamples() []ExampleInfo {
	if s.examplesDir == "" {
		return nil
	}
	entries, err := os.ReadDir(s.examplesDir)
	if err != nil {
		slog.Warn("cannot read examples dir", "path", s.examplesDir, "err", err)
		return nil
	}
	var examples []ExampleInfo
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		dir := filepath.Join(s.examplesDir, entry.Name())
		specFile := filepath.Join(dir, "spec.yaml")
		if _, err := os.Stat(specFile); err == nil {
			examples = append(examples, ExampleInfo{
				Name:    entry.Name(),
				SpecDir: dir,
			})
		}
	}
	return examples
}

func (s *Server) currentExampleName() string {
	if s.examplesDir == "" || s.specPath == "" {
		return ""
	}
	// specPath is like "examples/hr-portal/spec.yaml" → extract "hr-portal"
	dir := filepath.Dir(s.specPath)
	return filepath.Base(dir)
}

func (s *Server) handleListExamples(w http.ResponseWriter, r *http.Request) {
	examples := s.listExamples()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"examples": examples,
		"current":  s.currentExampleName(),
	})
}

func (s *Server) handleSwitchExample(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("example")
	if name == "" {
		http.Error(w, `{"error":"example query param required"}`, http.StatusBadRequest)
		return
	}

	examples := s.listExamples()
	var found *ExampleInfo
	for i := range examples {
		if examples[i].Name == name {
			found = &examples[i]
			break
		}
	}
	if found == nil {
		http.Error(w, fmt.Sprintf(`{"error":"example %q not found"}`, name), http.StatusNotFound)
		return
	}

	specFile := filepath.Join(found.SpecDir, "spec.yaml")
	dataFile := filepath.Join(found.SpecDir, "data.json")

	// Update spec path and reload
	s.specPath = specFile
	s.dataPath = dataFile

	if err := s.loadSpec(); err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to load spec: %v"}`, err), http.StatusInternalServerError)
		return
	}

	// Reload mock data if data.json exists
	if _, err := os.Stat(dataFile); err == nil {
		store, err := LoadMockData(dataFile)
		if err != nil {
			slog.Warn("failed to load mock data for example", "example", name, "err", err)
		} else {
			s.mockMu.Lock()
			s.mockStore = store
			s.mockMu.Unlock()
		}
	}

	// Notify connected clients to reload
	s.sseHub.Broadcast(SSEEvent{Type: "spec-changed"})

	slog.Info("switched example", "name", name)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok", "example": name})
}

// GetMockStore returns the current mock store (thread-safe)
func (s *Server) GetMockStore() *MockStore {
	s.mockMu.RLock()
	defer s.mockMu.RUnlock()
	return s.mockStore
}
