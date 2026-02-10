package serve

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"sync/atomic"

	"github.com/maraichr/GateHouse-ui/internal/compose"
	"github.com/maraichr/GateHouse-ui/internal/engine"
	"github.com/maraichr/GateHouse-ui/internal/parser"
	"github.com/maraichr/GateHouse-ui/internal/store"
)

type Server struct {
	specPath    string
	dataPath    string
	apiBaseURL  string
	examplesDir string
	composeFile string
	databaseURL string
	adminEmail  string
	port        int
	watch       bool
	appTarget   string
	currentTree atomic.Pointer[engine.ComponentTree]
	sseHub      *SSEHub
	mockStore   *MockStore
	mockMu      sync.RWMutex // guards mockStore swaps

	// Database (for spec reviewer)
	store *store.DB

	// Composition mode fields
	aggregator    *compose.Aggregator
	serviceRouter *compose.ServiceRouter
	healthChecker *compose.HealthChecker
}

type Config struct {
	SpecPath    string
	APIBaseURL  string
	DataPath    string
	ExamplesDir string
	ComposeFile string
	DatabaseURL string
	AdminEmail  string
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
		composeFile: cfg.ComposeFile,
		databaseURL: cfg.DatabaseURL,
		adminEmail:  cfg.AdminEmail,
		port:        cfg.Port,
		watch:       cfg.Watch,
		appTarget:   cfg.Target,
		sseHub:      NewSSEHub(),
	}

	// Initialize database if configured
	if s.databaseURL != "" {
		if err := s.initDatabase(); err != nil {
			return nil, fmt.Errorf("initializing database: %w", err)
		}
	}

	// Composition mode
	if s.composeFile != "" {
		return s.initComposed()
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
		ms, err := LoadMockData(s.dataPath)
		if err != nil {
			return nil, fmt.Errorf("loading mock data: %w", err)
		}
		s.mockStore = ms
	}

	// Load spec from file if provided (DB-only mode doesn't require a spec file)
	if s.specPath != "" {
		if err := s.loadSpec(); err != nil {
			return nil, err
		}
	}

	return s, nil
}

// initDatabase connects to PostgreSQL, runs migrations, and seeds the default admin.
func (s *Server) initDatabase() error {
	ctx := context.Background()
	db, err := store.New(ctx, s.databaseURL)
	if err != nil {
		return err
	}
	s.store = db

	if err := db.RunMigrations(s.databaseURL); err != nil {
		return fmt.Errorf("running migrations: %w", err)
	}

	email := s.adminEmail
	if email == "" {
		email = "admin@gatehouse.local"
	}
	admin, err := db.SeedDefaultAdmin(ctx, email)
	if err != nil {
		return fmt.Errorf("seeding admin: %w", err)
	}
	slog.Info("database initialized", "admin", admin.Email)
	return nil
}

// GetStore returns the database store (nil if database not configured).
func (s *Server) GetStore() *store.DB {
	return s.store
}

// initComposed loads composition config, builds all partial trees, and composes them.
func (s *Server) initComposed() (*Server, error) {
	cfg, err := compose.LoadConfig(s.composeFile)
	if err != nil {
		return nil, fmt.Errorf("loading composition config: %w", err)
	}

	agg, err := compose.NewAggregator(cfg, s.target())
	if err != nil {
		return nil, fmt.Errorf("creating aggregator: %w", err)
	}
	s.aggregator = agg

	tree, err := agg.Compose()
	if err != nil {
		return nil, fmt.Errorf("composing trees: %w", err)
	}
	s.currentTree.Store(tree)

	// Load mock stores for services with data_path
	mockStores := s.loadServiceMockStores(cfg)

	// Also load host mock data
	if cfg.Host.DataPath != "" {
		store, err := LoadMockData(cfg.Host.DataPath)
		if err != nil {
			slog.Warn("failed to load host mock data", "error", err)
		} else {
			s.mockStore = store
		}
	}

	// Build service router for API dispatch
	s.serviceRouter = compose.NewServiceRouter(cfg, mockStores)

	slog.Info("composition loaded",
		"host", cfg.Host.Name,
		"services", len(cfg.Services),
		"entities", len(tree.Metadata.Entities),
		"routes", tree.Metadata.RouteCount,
	)

	return s, nil
}

func (s *Server) loadServiceMockStores(cfg *compose.CompositionConfig) map[string]http.Handler {
	stores := make(map[string]http.Handler)
	for _, svc := range cfg.Services {
		if svc.DataPath != "" {
			store, err := LoadMockData(svc.DataPath)
			if err != nil {
				slog.Warn("failed to load mock data for service", "service", svc.Name, "error", err)
				continue
			}
			stores[svc.Name] = store
		}
	}
	return stores
}

func (s *Server) Start() error {
	if s.composeFile != "" {
		// Composition mode: watch local spec files + health check remotes
		if s.watch {
			go s.watchComposed()
		}
		if s.aggregator != nil {
			s.healthChecker = compose.NewHealthChecker(s.aggregator, func() {
				s.recompose()
			})
			s.healthChecker.Start()
		}
	} else if s.watch {
		go s.watchSpec()
	}

	handler := s.Routes()
	addr := fmt.Sprintf(":%d", s.port)
	slog.Info("server starting", "addr", addr, "spec", s.specPath)
	return http.ListenAndServe(addr, handler)
}

// recompose re-fetches all specs and rebuilds the composed tree.
func (s *Server) recompose() {
	if s.aggregator == nil {
		return
	}
	tree, err := s.aggregator.Recompose()
	if err != nil {
		slog.Error("recomposition failed", "error", err)
		s.sseHub.Broadcast(SSEEvent{
			Type: "error",
			Data: map[string]string{"message": err.Error()},
		})
		return
	}
	s.currentTree.Store(tree)
	slog.Info("recomposition complete", "entities", len(tree.Metadata.Entities))
	s.sseHub.Broadcast(SSEEvent{
		Type: "reload",
		Data: map[string]string{"message": "composed spec updated"},
	})
}

// IsComposed returns whether the server is running in composition mode.
func (s *Server) IsComposed() bool {
	return s.aggregator != nil
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
	// Dynamic preview: build tree from DB when preview params are present
	specID := r.URL.Query().Get("specId")
	versionID := r.URL.Query().Get("versionId")
	compID := r.URL.Query().Get("compId")

	if s.store != nil && (specID != "" || compID != "") {
		s.handleDynamicSpec(w, r, specID, versionID, compID)
		return
	}

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

func (s *Server) handleCapabilities(w http.ResponseWriter, r *http.Request) {
	report := engine.BuildCapabilitiesReport()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(report)
}

func (s *Server) handleServices(w http.ResponseWriter, r *http.Request) {
	if s.aggregator == nil {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"services":[],"mode":"single"}`))
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"mode":     "composed",
		"host":     s.aggregator.Config.Host.Name,
		"services": s.aggregator.ServiceStatuses(),
	})
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
	dir := filepath.Dir(s.specPath)
	return filepath.Base(dir)
}

func (s *Server) handleListExamples(w http.ResponseWriter, r *http.Request) {
	examples := s.listExamples()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
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

	s.specPath = specFile
	s.dataPath = dataFile

	if err := s.loadSpec(); err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to load spec: %v"}`, err), http.StatusInternalServerError)
		return
	}

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
