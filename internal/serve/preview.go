package serve

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/maraichr/GateHouse-ui/internal/engine"
	"github.com/maraichr/GateHouse-ui/internal/generate"
	"github.com/maraichr/GateHouse-ui/pkg/spec"
)

// previewCacheEntry holds a cached MockStore and AppSpec for preview mode.
type previewCacheEntry struct {
	store     *MockStore
	appSpec   *spec.AppSpec
	createdAt time.Time
}

const previewCacheTTL = 60 * time.Second

var (
	previewCache   sync.Map // key: "specID:versionID" → *previewCacheEntry
	previewCacheMu sync.Mutex
)

// previewCacheKey returns a cache key for the given preview params.
func previewCacheKey(specID, versionID, compID string) string {
	if compID != "" {
		return "comp:" + compID
	}
	return specID + ":" + versionID
}

// buildSpecTree builds a ComponentTree from a DB-stored spec version.
func (s *Server) buildSpecTree(ctx context.Context, specID, versionID string) (*engine.ComponentTree, *spec.AppSpec, error) {
	var specData json.RawMessage

	if versionID != "" {
		vid, err := uuid.Parse(versionID)
		if err != nil {
			return nil, nil, fmt.Errorf("invalid versionId: %w", err)
		}
		version, err := s.store.GetVersion(ctx, vid)
		if err != nil {
			return nil, nil, fmt.Errorf("fetching version: %w", err)
		}
		if version == nil {
			return nil, nil, fmt.Errorf("no version found")
		}
		specData = version.SpecData
	} else {
		sid, err := uuid.Parse(specID)
		if err != nil {
			return nil, nil, fmt.Errorf("invalid specId: %w", err)
		}
		version, err := s.store.GetLatestVersion(ctx, sid)
		if err != nil {
			return nil, nil, fmt.Errorf("fetching version: %w", err)
		}
		if version == nil {
			return nil, nil, fmt.Errorf("no version found")
		}
		specData = version.SpecData
	}

	var appSpec spec.AppSpec
	if err := json.Unmarshal(specData, &appSpec); err != nil {
		return nil, nil, fmt.Errorf("unmarshaling spec: %w", err)
	}

	analysis := engine.Analyze(&appSpec)
	builder := engine.NewBuilder()
	tree := builder.Build(&appSpec, analysis)
	tree.Metadata.Target = s.target()

	return tree, &appSpec, nil
}

// buildComposedTree builds a ComponentTree from a DB-stored composition.
func (s *Server) buildComposedTree(ctx context.Context, compID string) (*engine.ComponentTree, *spec.AppSpec, error) {
	cid, err := uuid.Parse(compID)
	if err != nil {
		return nil, nil, fmt.Errorf("invalid compId: %w", err)
	}

	c, err := s.store.GetComposition(ctx, cid)
	if err != nil || c == nil {
		return nil, nil, fmt.Errorf("composition not found")
	}

	members, err := s.store.ListCompositionMembers(ctx, c.ID)
	if err != nil {
		return nil, nil, fmt.Errorf("listing members: %w", err)
	}

	hostVersion, err := s.store.GetLatestVersion(ctx, c.HostSpecID)
	if err != nil || hostVersion == nil {
		return nil, nil, fmt.Errorf("host spec has no version")
	}

	hostSpec, _ := s.store.GetSpec(ctx, c.HostSpecID)
	hostName := "host"
	if hostSpec != nil {
		hostName = hostSpec.AppName
	}

	var memberSpecs []engine.MemberSpec
	for _, m := range members {
		v, verr := s.store.GetLatestVersion(ctx, m.SpecID)
		if verr != nil || v == nil {
			slog.Warn("preview: member spec has no version", "member", m.ServiceName)
			continue
		}
		memberSpecs = append(memberSpecs, engine.MemberSpec{
			ServiceName: m.ServiceName,
			NavGroup:    m.NavGroup,
			NavOrder:    m.NavOrder,
			Prefix:      m.Prefix,
			SpecData:    v.SpecData,
		})
	}

	merged, _, err := engine.MergeAppSpecs(hostVersion.SpecData, hostName, memberSpecs)
	if err != nil {
		return nil, nil, fmt.Errorf("merging specs: %w", err)
	}

	analysis := engine.Analyze(merged)
	builder := engine.NewBuilder()
	tree := builder.Build(merged, analysis)
	tree.Metadata.Target = s.target()

	return tree, merged, nil
}

// getOrBuildPreviewCache returns a cached entry (mock store + appSpec), building from DB if needed.
func (s *Server) getOrBuildPreviewCache(ctx context.Context, specID, versionID, compID string) (*previewCacheEntry, error) {
	key := previewCacheKey(specID, versionID, compID)

	// Check cache
	if entry, ok := previewCache.Load(key); ok {
		ce := entry.(*previewCacheEntry)
		if time.Since(ce.createdAt) < previewCacheTTL {
			return ce, nil
		}
		previewCache.Delete(key)
	}

	// Build under lock to avoid duplicate generation
	previewCacheMu.Lock()
	defer previewCacheMu.Unlock()

	// Double-check after acquiring lock
	if entry, ok := previewCache.Load(key); ok {
		ce := entry.(*previewCacheEntry)
		if time.Since(ce.createdAt) < previewCacheTTL {
			return ce, nil
		}
	}

	// Build spec from DB
	var appSpec *spec.AppSpec
	var err error
	if compID != "" {
		_, appSpec, err = s.buildComposedTree(ctx, compID)
	} else {
		_, appSpec, err = s.buildSpecTree(ctx, specID, versionID)
	}
	if err != nil {
		return nil, err
	}

	// Generate mock data
	cfg := generate.Config{Count: 15, Seed: 42}
	gen := generate.NewGenerator(cfg, appSpec)
	data, genErr := gen.Generate()
	var ms *MockStore
	if genErr != nil {
		slog.Error("preview mock generation failed", "error", genErr)
		ms = NewMockStoreFromData(map[string]any{})
	} else {
		ms = NewMockStoreFromData(data)
	}

	ce := &previewCacheEntry{
		store:     ms,
		appSpec:   appSpec,
		createdAt: time.Now(),
	}
	previewCache.Store(key, ce)
	return ce, nil
}

// handleDynamicSpec serves a dynamically-built ComponentTree for preview mode.
func (s *Server) handleDynamicSpec(w http.ResponseWriter, r *http.Request, specID, versionID, compID string) {
	var tree *engine.ComponentTree
	var err error

	if compID != "" {
		tree, _, err = s.buildComposedTree(r.Context(), compID)
	} else {
		tree, _, err = s.buildSpecTree(r.Context(), specID, versionID)
	}

	if err != nil {
		slog.Error("preview spec build failed", "error", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tree)
}

// handlePreviewData serves auto-generated mock data for preview mode.
func (s *Server) handlePreviewData(w http.ResponseWriter, r *http.Request, specID, versionID, compID string) {
	ce, err := s.getOrBuildPreviewCache(r.Context(), specID, versionID, compID)
	if err != nil {
		slog.Error("preview data build failed", "error", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	ce.store.ServeHTTP(w, r)
}
