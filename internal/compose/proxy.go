package compose

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"sort"
	"strings"
)

// routeEntry maps an API prefix to either a remote backend or a local http.Handler (MockStore).
type routeEntry struct {
	prefix     string       // e.g. "/orders"
	backendURL string       // remote backend URL (mutually exclusive with handler)
	handler    http.Handler // local mock store or any http.Handler
}

// ServiceRouter dispatches API requests to the correct backend based on path prefix.
type ServiceRouter struct {
	entries []routeEntry // sorted longest-prefix-first
}

// NewServiceRouter builds a router from the composition config.
// handlers maps service name → http.Handler (e.g. MockStore) for services with data_path.
func NewServiceRouter(cfg *CompositionConfig, handlers map[string]http.Handler) *ServiceRouter {
	var entries []routeEntry

	for _, svc := range cfg.Services {
		if svc.Prefix == "" {
			continue
		}
		entry := routeEntry{prefix: svc.Prefix}
		if h, ok := handlers[svc.Name]; ok {
			entry.handler = h
		} else if svc.DataURL != "" {
			entry.backendURL = svc.DataURL
		}
		entries = append(entries, entry)
	}

	// Sort by prefix length descending (longest match first)
	sort.Slice(entries, func(i, j int) bool {
		return len(entries[i].prefix) > len(entries[j].prefix)
	})

	return &ServiceRouter{entries: entries}
}

// Route tries to match the request path against service prefixes.
// If matched, it proxies the request and returns true.
// If no match, returns false (caller should fall through to host handler).
func (sr *ServiceRouter) Route(w http.ResponseWriter, r *http.Request) bool {
	if sr == nil || len(sr.entries) == 0 {
		return false
	}

	// Extract path after /api/v1
	path := r.URL.Path
	apiPrefix := "/api/v1"
	if !strings.HasPrefix(path, apiPrefix) {
		return false
	}
	resourcePath := strings.TrimPrefix(path, apiPrefix)

	for _, entry := range sr.entries {
		if strings.HasPrefix(resourcePath, entry.prefix) {
			if entry.handler != nil {
				// Rewrite path: strip the service prefix so handler sees its own resource paths
				// e.g. /api/v1/orders/work-orders → /api/v1/work-orders
				rewritten := apiPrefix + strings.TrimPrefix(resourcePath, entry.prefix)
				r2 := r.Clone(r.Context())
				r2.URL.Path = rewritten
				r2.RequestURI = rewritten
				if r.URL.RawQuery != "" {
					r2.RequestURI += "?" + r.URL.RawQuery
				}
				entry.handler.ServeHTTP(w, r2)
				return true
			}
			if entry.backendURL != "" {
				proxyToBackend(w, r, entry.backendURL)
				return true
			}
		}
	}

	return false
}

func proxyToBackend(w http.ResponseWriter, r *http.Request, backendURL string) {
	target, err := url.Parse(backendURL)
	if err != nil {
		http.Error(w, `{"error":"invalid backend URL"}`, http.StatusBadGateway)
		return
	}

	proxy := &httputil.ReverseProxy{
		Director: func(req *http.Request) {
			req.URL.Scheme = target.Scheme
			req.URL.Host = target.Host
			req.Host = target.Host
		},
	}
	proxy.ServeHTTP(w, r)
}
