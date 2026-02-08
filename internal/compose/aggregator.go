package compose

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"sort"

	"github.com/maraichr/GateHouse-ui/internal/engine"
)

// Aggregator merges a host tree with service partial trees into a single ComponentTree.
type Aggregator struct {
	Config   *CompositionConfig
	Host     *ServiceState
	Services []*ServiceState
	Target   string
}

// NewAggregator creates an Aggregator from a composition config.
// It fetches specs and builds partial trees for the host and all services.
func NewAggregator(cfg *CompositionConfig, target string) (*Aggregator, error) {
	agg := &Aggregator{Config: cfg, Target: target}

	// Build host tree
	host, err := FetchAndBuild(cfg.Host, target)
	if err != nil {
		return nil, fmt.Errorf("building host spec %q: %w", cfg.Host.Name, err)
	}
	agg.Host = host

	// Build service trees
	for _, svc := range cfg.Services {
		state, err := FetchAndBuild(svc, target)
		if err != nil {
			if svc.Optional {
				slog.Warn("optional service unavailable", "service", svc.Name, "error", err)
				state = &ServiceState{Source: svc, Healthy: false, Error: err}
			} else {
				return nil, fmt.Errorf("building service spec %q: %w", svc.Name, err)
			}
		}
		agg.Services = append(agg.Services, state)
	}

	return agg, nil
}

// Compose merges all service trees into the host tree and returns a single ComponentTree.
func (a *Aggregator) Compose() (*engine.ComponentTree, error) {
	if a.Host == nil || a.Host.Tree == nil {
		return nil, fmt.Errorf("host tree is nil")
	}

	// Deep-clone host tree root so we don't mutate the original
	root := deepCloneNode(a.Host.Tree.Root)

	// Find sidebar in the cloned tree
	sidebar := findNodeByKind(root, engine.KindSidebar)
	if sidebar == nil {
		return nil, fmt.Errorf("host tree has no sidebar node")
	}

	// Sort services by NavOrder
	sorted := make([]*ServiceState, len(a.Services))
	copy(sorted, a.Services)
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].Source.NavOrder < sorted[j].Source.NavOrder
	})

	// Track entities and routes for collision detection
	entities := map[string]string{} // entity name → service name
	routes := map[string]string{}   // route path → service name
	sources := map[string]string{}  // entity name → service name

	// Register host entities/routes
	for _, name := range a.Host.Tree.Metadata.Entities {
		entities[name] = a.Host.Source.Name
		sources[name] = a.Host.Source.Name
	}
	registerRoutes(root, a.Host.Source.Name, routes)

	// Nav groups: group label → nav_group node
	navGroups := map[string]*engine.ComponentNode{}

	// Graft each service
	for _, state := range sorted {
		if state.Tree == nil || !state.Healthy {
			continue
		}

		svcName := state.Source.Name

		// Check for entity name collisions
		for _, name := range state.Tree.Metadata.Entities {
			if owner, exists := entities[name]; exists {
				return nil, fmt.Errorf("entity name collision: %q defined in both %q and %q", name, owner, svcName)
			}
			entities[name] = svcName
			sources[name] = svcName
		}

		// Extract nav items and entity/page nodes from service tree
		if state.Tree.Root != nil {
			svcSidebar := findNodeByKind(state.Tree.Root, engine.KindSidebar)
			svcRoot := state.Tree.Root

			// Graft nav items into host sidebar
			if svcSidebar != nil {
				graftNavItems(sidebar, svcSidebar, state.Source, navGroups)
			}

			// Graft entity/page nodes (children with scope.route) into host root
			for _, child := range svcRoot.Children {
				if child.Kind == engine.KindSidebar {
					continue // already handled above
				}
				// Check route collisions
				if child.Scope != nil && child.Scope.Route != "" {
					if owner, exists := routes[child.Scope.Route]; exists {
						return nil, fmt.Errorf("route collision: %q defined in both %q and %q", child.Scope.Route, owner, svcName)
					}
					routes[child.Scope.Route] = svcName
				}
				root.Children = append(root.Children, child)
			}
		}
	}

	// Build merged metadata
	allEntities := make([]string, 0, len(entities))
	for name := range entities {
		allEntities = append(allEntities, name)
	}
	sort.Strings(allEntities)

	return &engine.ComponentTree{
		Root: root,
		Metadata: engine.TreeMetadata{
			AppName:    a.Host.Tree.Metadata.AppName,
			Version:    a.Host.Tree.Metadata.Version,
			Entities:   allEntities,
			RouteCount: len(routes),
			Target:     a.Target,
			Sources:    sources,
		},
	}, nil
}

// Recompose re-fetches all specs and rebuilds the composed tree.
func (a *Aggregator) Recompose() (*engine.ComponentTree, error) {
	// Re-fetch host
	host, err := FetchAndBuild(a.Config.Host, a.Target)
	if err != nil {
		return nil, fmt.Errorf("re-fetching host: %w", err)
	}
	a.Host = host

	// Re-fetch services
	for i, svc := range a.Config.Services {
		state, err := FetchAndBuild(svc, a.Target)
		if err != nil {
			if svc.Optional {
				slog.Warn("optional service unavailable on recompose", "service", svc.Name, "error", err)
				a.Services[i] = &ServiceState{Source: svc, Healthy: false, Error: err}
			} else {
				return nil, fmt.Errorf("re-fetching service %q: %w", svc.Name, err)
			}
		} else {
			a.Services[i] = state
		}
	}

	return a.Compose()
}

// ServiceStatuses returns health info for the /_renderer/services endpoint.
func (a *Aggregator) ServiceStatuses() []map[string]any {
	var statuses []map[string]any
	for _, state := range a.Services {
		status := map[string]any{
			"name":    state.Source.Name,
			"healthy": state.Healthy,
			"prefix":  state.Source.Prefix,
		}
		if state.Error != nil {
			status["error"] = state.Error.Error()
		}
		if state.Tree != nil {
			status["entities"] = state.Tree.Metadata.Entities
		}
		statuses = append(statuses, status)
	}
	return statuses
}

// graftNavItems adds a service's nav items to the host sidebar,
// optionally grouping them under a NavGroup.
func graftNavItems(hostSidebar, svcSidebar *engine.ComponentNode, src ServiceSource, groups map[string]*engine.ComponentNode) {
	if src.NavGroup == "" {
		// No grouping — append directly
		hostSidebar.Children = append(hostSidebar.Children, svcSidebar.Children...)
		return
	}

	// Find or create the nav group
	group, exists := groups[src.NavGroup]
	if !exists {
		group = &engine.ComponentNode{
			ID:   fmt.Sprintf("nav_group_%s", toID(src.NavGroup)),
			Kind: engine.KindNavGroup,
			Props: map[string]any{
				"label": src.NavGroup,
			},
		}
		groups[src.NavGroup] = group
		hostSidebar.Children = append(hostSidebar.Children, group)
	}

	group.Children = append(group.Children, svcSidebar.Children...)
}

// registerRoutes walks a tree and records all scope.route paths.
func registerRoutes(node *engine.ComponentNode, svcName string, routes map[string]string) {
	if node.Scope != nil && node.Scope.Route != "" {
		routes[node.Scope.Route] = svcName
	}
	for _, child := range node.Children {
		registerRoutes(child, svcName, routes)
	}
}

// findNodeByKind does a BFS to find the first node with the given kind.
func findNodeByKind(root *engine.ComponentNode, kind engine.ComponentKind) *engine.ComponentNode {
	if root.Kind == kind {
		return root
	}
	for _, child := range root.Children {
		if found := findNodeByKind(child, kind); found != nil {
			return found
		}
	}
	return nil
}

// deepCloneNode creates a deep copy of a ComponentNode tree via JSON round-trip.
func deepCloneNode(node *engine.ComponentNode) *engine.ComponentNode {
	data, err := json.Marshal(node)
	if err != nil {
		return node // fallback: return original
	}
	var clone engine.ComponentNode
	if err := json.Unmarshal(data, &clone); err != nil {
		return node
	}
	return &clone
}

func toID(s string) string {
	id := make([]byte, 0, len(s))
	for _, c := range s {
		if c >= 'a' && c <= 'z' || c >= '0' && c <= '9' {
			id = append(id, byte(c))
		} else if c >= 'A' && c <= 'Z' {
			id = append(id, byte(c-'A'+'a'))
		} else {
			id = append(id, '_')
		}
	}
	return string(id)
}
