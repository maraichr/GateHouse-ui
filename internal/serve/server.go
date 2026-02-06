package serve

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"sync/atomic"

	"github.com/maraichr/GateHouse-ui/internal/engine"
	"github.com/maraichr/GateHouse-ui/internal/parser"
)

type Server struct {
	specPath    string
	apiBaseURL  string
	port        int
	watch       bool
	target      string
	currentTree atomic.Pointer[engine.ComponentTree]
	sseHub      *SSEHub
	mockStore   *MockStore
}

type Config struct {
	SpecPath   string
	APIBaseURL string
	DataPath   string
	Port       int
	Watch      bool
	Target     string
}

func NewServer(cfg Config) (*Server, error) {
	s := &Server{
		specPath:   cfg.SpecPath,
		apiBaseURL: cfg.APIBaseURL,
		port:       cfg.Port,
		watch:      cfg.Watch,
		target:     cfg.Target,
		sseHub:     NewSSEHub(),
	}

	if cfg.DataPath != "" {
		store, err := LoadMockData(cfg.DataPath)
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
	return s.target
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
