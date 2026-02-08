package serve

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"math"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

// MockStore holds mock data loaded from a JSON file and serves it via HTTP.
type MockStore struct {
	mu            sync.RWMutex
	collections   map[string][]map[string]any // keyed by resource path e.g. "/subcontractors"
	widgets       map[string]any              // keyed by widget path
	entityStats   map[string]any              // keyed by pattern path
	subResources  map[string][]map[string]any // keyed by "resource/id/sub" e.g. "/subcontractors/sub-001/activity"
}

// LoadMockData reads a data.json file and returns a MockStore.
func LoadMockData(path string) (*MockStore, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("reading mock data: %w", err)
	}

	var parsed map[string]json.RawMessage
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, fmt.Errorf("parsing mock data: %w", err)
	}

	ms := &MockStore{
		collections:  make(map[string][]map[string]any),
		widgets:      make(map[string]any),
		entityStats:  make(map[string]any),
		subResources: make(map[string][]map[string]any),
	}

	for key, raw := range parsed {
		switch {
		case key == "_widgets":
			var w map[string]any
			if err := json.Unmarshal(raw, &w); err != nil {
				return nil, fmt.Errorf("parsing _widgets: %w", err)
			}
			ms.widgets = w
		case key == "_entity_stats":
			var es map[string]any
			if err := json.Unmarshal(raw, &es); err != nil {
				return nil, fmt.Errorf("parsing _entity_stats: %w", err)
			}
			ms.entityStats = es
		case key == "_sub_resources":
			// Sub-resources keyed like "/subcontractors/sub-001/activity"
			var sr map[string]json.RawMessage
			if err := json.Unmarshal(raw, &sr); err != nil {
				return nil, fmt.Errorf("parsing _sub_resources: %w", err)
			}
			for subKey, subRaw := range sr {
				var items []map[string]any
				if err := json.Unmarshal(subRaw, &items); err != nil {
					return nil, fmt.Errorf("parsing sub_resource %s: %w", subKey, err)
				}
				ms.subResources[subKey] = items
			}
		default:
			var records []map[string]any
			if err := json.Unmarshal(raw, &records); err != nil {
				return nil, fmt.Errorf("parsing collection %s: %w", key, err)
			}
			ms.collections[key] = records
		}
	}

	slog.Info("mock data loaded",
		"collections", len(ms.collections),
		"widgets", len(ms.widgets),
		"entity_stats", len(ms.entityStats),
	)
	return ms, nil
}

func (ms *MockStore) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Strip /api/v1 prefix
	path := strings.TrimPrefix(r.URL.Path, "/api/v1")

	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case http.MethodGet:
		ms.handleGet(w, r, path)
	case http.MethodPost:
		ms.handlePost(w, r, path)
	case http.MethodPatch:
		ms.handlePatch(w, r, path)
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
	}
}

func (ms *MockStore) handleGet(w http.ResponseWriter, r *http.Request, path string) {
	// Check widget paths first (e.g. /dashboard/stats, /dashboard/charts/...)
	if data, ok := ms.widgets[path]; ok {
		writeJSON(w, http.StatusOK, data)
		return
	}

	// Check entity stats (e.g. /subcontractors/sub-001/stats)
	if strings.HasSuffix(path, "/stats") {
		ms.handleEntityStats(w, r, path)
		return
	}

	// Parse path segments: /{resource} or /{resource}/{id}
	segments := splitPath(path)
	if len(segments) == 0 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}

	resource := "/" + segments[0]

	if len(segments) == 1 {
		ms.handleList(w, r, resource)
		return
	}
	if len(segments) == 2 {
		ms.handleDetail(w, resource, segments[1])
		return
	}
	// /{resource}/{id}/{sub} — sub-resources like activity, transitions
	if len(segments) == 3 {
		ms.handleSubResource(w, resource, segments[1], segments[2])
		return
	}

	writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
}

func (ms *MockStore) handleList(w http.ResponseWriter, r *http.Request, resource string) {
	ms.mu.RLock()
	records, ok := ms.collections[resource]
	ms.mu.RUnlock()

	if !ok {
		writeJSON(w, http.StatusOK, map[string]any{"data": []any{}, "total": 0, "page": 1})
		return
	}

	// Copy for filtering/sorting
	result := make([]map[string]any, len(records))
	copy(result, records)

	q := r.URL.Query()

	// Search: case-insensitive substring across all string fields
	if search := q.Get("search"); search != "" {
		search = strings.ToLower(search)
		var filtered []map[string]any
		for _, rec := range result {
			if matchesSearch(rec, search) {
				filtered = append(filtered, rec)
			}
		}
		result = filtered
	}

	// Filters
	result = applyFilters(result, q)

	// Sort
	if sortField := q.Get("sort"); sortField != "" {
		order := q.Get("order")
		sortRecords(result, sortField, order)
	}

	total := len(result)

	// Pagination
	pageSize := 25
	if ps := q.Get("page_size"); ps != "" {
		if v, err := strconv.Atoi(ps); err == nil && v > 0 {
			pageSize = v
		}
	}
	page := 1
	if p := q.Get("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}

	start := (page - 1) * pageSize
	if start > len(result) {
		start = len(result)
	}
	end := start + pageSize
	if end > len(result) {
		end = len(result)
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"data":  result[start:end],
		"total": total,
		"page":  page,
	})
}

func (ms *MockStore) handleDetail(w http.ResponseWriter, resource, id string) {
	ms.mu.RLock()
	records := ms.collections[resource]
	ms.mu.RUnlock()

	for _, rec := range records {
		if fmt.Sprintf("%v", rec["id"]) == id {
			writeJSON(w, http.StatusOK, rec)
			return
		}
	}
	writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
}

func (ms *MockStore) handleSubResource(w http.ResponseWriter, resource, id, sub string) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	// Try exact match: "/subcontractors/sub-001/activity"
	exactKey := resource + "/" + id + "/" + sub
	if items, ok := ms.subResources[exactKey]; ok {
		writeJSON(w, http.StatusOK, items)
		return
	}

	// Try wildcard pattern: "/subcontractors/*/activity"
	wildcardKey := resource + "/*/" + sub
	if items, ok := ms.subResources[wildcardKey]; ok {
		writeJSON(w, http.StatusOK, items)
		return
	}

	// Fallback: return empty array (sub-resource just has no data)
	writeJSON(w, http.StatusOK, []any{})
}

func (ms *MockStore) handleEntityStats(w http.ResponseWriter, r *http.Request, path string) {
	// Try to match pattern like /subcontractors/{id}/stats
	segments := splitPath(path)
	if len(segments) < 3 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	pattern := "/" + segments[0] + "/{id}/stats"
	if data, ok := ms.entityStats[pattern]; ok {
		writeJSON(w, http.StatusOK, data)
		return
	}
	writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
}

func (ms *MockStore) handlePost(w http.ResponseWriter, r *http.Request, path string) {
	segments := splitPath(path)

	// POST /{resource}/{id}/transitions/{name}
	if len(segments) == 4 && segments[2] == "transitions" {
		ms.handleTransition(w, r, "/"+segments[0], segments[1], segments[3])
		return
	}

	// POST /{resource} — create
	if len(segments) == 1 {
		ms.handleCreate(w, r, "/"+segments[0])
		return
	}

	writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
}

func (ms *MockStore) handleCreate(w http.ResponseWriter, r *http.Request, resource string) {
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	// Auto-generate ID
	body["id"] = fmt.Sprintf("new-%d", time.Now().UnixMilli())
	body["created_at"] = time.Now().UTC().Format(time.RFC3339)
	body["updated_at"] = body["created_at"]

	ms.mu.Lock()
	ms.collections[resource] = append(ms.collections[resource], body)
	ms.mu.Unlock()

	writeJSON(w, http.StatusCreated, body)
}

func (ms *MockStore) handleTransition(w http.ResponseWriter, r *http.Request, resource, id, transition string) {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	records := ms.collections[resource]
	for i, rec := range records {
		if fmt.Sprintf("%v", rec["id"]) == id {
			// Decode optional body for transition-specific fields
			var body map[string]any
			json.NewDecoder(r.Body).Decode(&body)

			// Apply transition name as a simple status-based lookup
			// In a real system this would validate from/to states
			statusMap := map[string]string{
				"approve":      "approved",
				"suspend":      "suspended",
				"reinstate":    "approved",
				"terminate":    "terminated",
				"start_review": "under_review",
				"verify":       "verified",
				"reject":       "rejected",
			}
			if newStatus, ok := statusMap[transition]; ok {
				records[i]["status"] = newStatus
			}
			records[i]["updated_at"] = time.Now().UTC().Format(time.RFC3339)

			writeJSON(w, http.StatusOK, records[i])
			return
		}
	}
	writeJSON(w, http.StatusNotFound, map[string]string{"error": "record not found"})
}

func (ms *MockStore) handlePatch(w http.ResponseWriter, r *http.Request, path string) {
	segments := splitPath(path)
	if len(segments) != 2 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}

	resource := "/" + segments[0]
	id := segments[1]

	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	ms.mu.Lock()
	defer ms.mu.Unlock()

	records := ms.collections[resource]
	for i, rec := range records {
		if fmt.Sprintf("%v", rec["id"]) == id {
			for k, v := range body {
				records[i][k] = v
			}
			records[i]["updated_at"] = time.Now().UTC().Format(time.RFC3339)
			writeJSON(w, http.StatusOK, records[i])
			return
		}
	}
	writeJSON(w, http.StatusNotFound, map[string]string{"error": "record not found"})
}

// --- helpers ---

func splitPath(path string) []string {
	path = strings.Trim(path, "/")
	if path == "" {
		return nil
	}
	return strings.Split(path, "/")
}

func matchesSearch(rec map[string]any, search string) bool {
	for _, v := range rec {
		switch val := v.(type) {
		case string:
			if strings.Contains(strings.ToLower(val), search) {
				return true
			}
		}
	}
	return false
}

func applyFilters(records []map[string]any, q map[string][]string) []map[string]any {
	result := records
	for key, vals := range q {
		if !strings.HasPrefix(key, "filter[") {
			continue
		}
		// Parse filter[field] or filter[field][op]
		inner := strings.TrimPrefix(key, "filter[")
		inner = strings.TrimSuffix(inner, "]")

		parts := strings.SplitN(inner, "][", 2)
		field := parts[0]
		op := ""
		if len(parts) == 2 {
			op = parts[1]
		}
		value := vals[0]

		var filtered []map[string]any
		for _, rec := range result {
			if matchesFilter(rec, field, op, value) {
				filtered = append(filtered, rec)
			}
		}
		result = filtered
	}
	return result
}

func matchesFilter(rec map[string]any, field, op, value string) bool {
	rv, ok := rec[field]
	if !ok {
		return false
	}

	switch op {
	case "from":
		return compareStrings(fmt.Sprintf("%v", rv), value) >= 0
	case "to":
		return compareStrings(fmt.Sprintf("%v", rv), value) <= 0
	case "min":
		return toFloat(rv) >= toFloat(value)
	case "max":
		return toFloat(rv) <= toFloat(value)
	default:
		// If the record value is an array, check if any element matches any filter value
		if arr, ok := rv.([]any); ok {
			filterVals := strings.Split(value, ",")
			for _, elem := range arr {
				elemStr := fmt.Sprintf("%v", elem)
				for _, fv := range filterVals {
					if elemStr == strings.TrimSpace(fv) {
						return true
					}
				}
			}
			return false
		}

		// Exact match, with comma-separated multi-value support
		recStr := fmt.Sprintf("%v", rv)
		if strings.Contains(value, ",") {
			for _, v := range strings.Split(value, ",") {
				if recStr == strings.TrimSpace(v) {
					return true
				}
			}
			return false
		}
		return recStr == value
	}
}

func compareStrings(a, b string) int {
	if a < b {
		return -1
	}
	if a > b {
		return 1
	}
	return 0
}

func toFloat(v any) float64 {
	switch val := v.(type) {
	case float64:
		return val
	case int:
		return float64(val)
	case string:
		f, _ := strconv.ParseFloat(val, 64)
		return f
	case json.Number:
		f, _ := val.Float64()
		return f
	default:
		return 0
	}
}

func sortRecords(records []map[string]any, field, order string) {
	asc := order != "desc"
	n := len(records)
	// Simple insertion sort — fine for mock data sizes
	for i := 1; i < n; i++ {
		for j := i; j > 0; j-- {
			cmp := compareAny(records[j-1][field], records[j][field])
			if asc && cmp > 0 || !asc && cmp < 0 {
				records[j-1], records[j] = records[j], records[j-1]
			} else {
				break
			}
		}
	}
}

func compareAny(a, b any) int {
	fa, aNum := numericValue(a)
	fb, bNum := numericValue(b)
	if aNum && bNum {
		if fa < fb {
			return -1
		}
		if fa > fb {
			return 1
		}
		return 0
	}
	return compareStrings(fmt.Sprintf("%v", a), fmt.Sprintf("%v", b))
}

func numericValue(v any) (float64, bool) {
	switch val := v.(type) {
	case float64:
		if math.IsNaN(val) {
			return 0, false
		}
		return val, true
	case int:
		return float64(val), true
	case json.Number:
		f, err := val.Float64()
		return f, err == nil
	default:
		return 0, false
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
