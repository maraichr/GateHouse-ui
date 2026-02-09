package engine

import (
	"encoding/json"
	"fmt"
	"sort"

	"github.com/maraichr/GateHouse-ui/pkg/spec"
)

// MemberSpec represents a service member's spec data for merging.
type MemberSpec struct {
	ServiceName string
	NavGroup    string
	NavOrder    int
	Prefix      string
	SpecData    json.RawMessage
}

// MergeResult holds the merged AppSpec and source attribution.
type MergeResult struct {
	Spec    *spec.AppSpec     `json:"composed_spec"`
	Sources map[string]string `json:"sources"` // entity name → service name
}

// MergeAppSpecs merges a host AppSpec with service member AppSpecs.
// It returns the merged AppSpec and a sources map (entity → service name).
func MergeAppSpecs(hostData json.RawMessage, hostName string, members []MemberSpec) (*spec.AppSpec, map[string]string, error) {
	// Deep-clone host via JSON round-trip
	var merged spec.AppSpec
	if err := json.Unmarshal(hostData, &merged); err != nil {
		return nil, nil, fmt.Errorf("parsing host spec: %w", err)
	}

	sources := make(map[string]string)
	entityNames := make(map[string]bool)

	// Register host entities
	for _, e := range merged.Entities {
		sources[e.Name] = hostName
		entityNames[e.Name] = true
	}

	// Sort members by NavOrder
	sorted := make([]MemberSpec, len(members))
	copy(sorted, members)
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].NavOrder < sorted[j].NavOrder
	})

	// Nav groups: group label → existing nav item index in merged.Navigation.Items
	navGroups := map[string]int{}

	for _, member := range sorted {
		var svcSpec spec.AppSpec
		if err := json.Unmarshal(member.SpecData, &svcSpec); err != nil {
			return nil, nil, fmt.Errorf("parsing service %q spec: %w", member.ServiceName, err)
		}

		// Check entity collisions and append
		for _, e := range svcSpec.Entities {
			if entityNames[e.Name] {
				return nil, nil, fmt.Errorf("entity name collision: %q already defined, also in service %q", e.Name, member.ServiceName)
			}
			entityNames[e.Name] = true
			sources[e.Name] = member.ServiceName
		}
		merged.Entities = append(merged.Entities, svcSpec.Entities...)

		// Append pages
		merged.Pages = append(merged.Pages, svcSpec.Pages...)

		// Merge nav items
		graftNavItemsToSpec(&merged, svcSpec.Navigation.Items, member.NavGroup, navGroups)
	}

	return &merged, sources, nil
}

// graftNavItemsToSpec adds service nav items to the merged spec's navigation.
func graftNavItemsToSpec(merged *spec.AppSpec, items []spec.NavItem, navGroup string, groups map[string]int) {
	if navGroup == "" {
		merged.Navigation.Items = append(merged.Navigation.Items, items...)
		return
	}

	idx, exists := groups[navGroup]
	if !exists {
		// Create a nav group item
		groupItem := spec.NavItem{
			ID:       "nav_group_" + toID(navGroup),
			Label:    navGroup,
			Children: items,
		}
		groups[navGroup] = len(merged.Navigation.Items)
		merged.Navigation.Items = append(merged.Navigation.Items, groupItem)
	} else {
		merged.Navigation.Items[idx].Children = append(merged.Navigation.Items[idx].Children, items...)
	}
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
