package serve

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/maraichr/GateHouse-ui/internal/auth"
)

func (s *Server) Routes() http.Handler {
	r := chi.NewRouter()

	r.Use(corsMiddleware)
	r.Use(requestIDMiddleware)

	r.Route("/_renderer", func(r chi.Router) {
		r.Get("/spec", s.handleGetSpec)
		r.Get("/health", s.handleHealth)
		r.Get("/capabilities", s.handleCapabilities)
		r.Get("/events", s.sseHub.ServeHTTP)
		r.Get("/examples", s.handleListExamples)
		r.Post("/switch", s.handleSwitchExample)
		r.Get("/services", s.handleServices)
	})

	// Reviewer API — only available when database is configured
	if s.store != nil {
		r.Route("/_reviewer", func(r chi.Router) {
			r.Use(auth.Middleware(s.store))
			s.mountReviewerRoutes(r)
		})
	}

	// Mock data — try service router first (composition mode), then fall through to host
	r.Route("/api/v1", func(r chi.Router) {
		r.HandleFunc("/*", func(w http.ResponseWriter, req *http.Request) {
			// Preview mode: serve auto-generated mock data
			q := req.URL.Query()
			specID := q.Get("specId")
			versionID := q.Get("versionId")
			compID := q.Get("compId")
			if s.store != nil && (specID != "" || compID != "") {
				s.handlePreviewData(w, req, specID, versionID, compID)
				return
			}

			// In composition mode, try service router first
			if s.serviceRouter != nil && s.serviceRouter.Route(w, req) {
				return
			}

			// Fall through to host mock store
			store := s.GetMockStore()
			if store != nil {
				store.ServeHTTP(w, req)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte(`{"error":"no mock data loaded"}`))
		})
	})

	if s.apiBaseURL != "" {
		r.Handle("/api/*", s.apiProxy())
	}

	// SPA fallback — during dev, Vite handles this
	r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte(`<!doctype html><html><body><p>SPA served by Vite dev server in development</p></body></html>`))
	})

	return r
}
