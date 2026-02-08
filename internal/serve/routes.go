package serve

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (s *Server) Routes() http.Handler {
	r := chi.NewRouter()

	r.Use(corsMiddleware)
	r.Use(requestIDMiddleware)

	r.Route("/_renderer", func(r chi.Router) {
		r.Get("/spec", s.handleGetSpec)
		r.Get("/health", s.handleHealth)
		r.Get("/events", s.sseHub.ServeHTTP)
		r.Get("/examples", s.handleListExamples)
		r.Post("/switch", s.handleSwitchExample)
	})

	// Mock data — use GetMockStore() for thread-safe access after example switching
	r.Route("/api/v1", func(r chi.Router) {
		r.HandleFunc("/*", func(w http.ResponseWriter, req *http.Request) {
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
