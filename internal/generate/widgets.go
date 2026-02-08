package generate

import (
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/maraichr/GateHouse-ui/pkg/spec"
)

func sortStrings(s []string) {
	sort.Strings(s)
}

// generateWidgets produces _widgets data from page widget definitions.
func (g *Generator) generateWidgets() map[string]any {
	widgets := map[string]any{}

	for _, appSpec := range g.specs {
		for _, page := range appSpec.Pages {
			for _, widget := range page.Widgets {
				switch widget.Type {
				case "stat_cards":
					g.generateStatCardWidgets(widgets, widget)
				case "chart":
					g.generateChartWidget(widgets, widget)
				// entity_table queries collections directly — no widget data needed
				}
			}
		}
	}

	return widgets
}

// generateStatCardWidgets generates the stats object for stat_card widgets.
func (g *Generator) generateStatCardWidgets(widgets map[string]any, widget spec.Widget) {
	// Group cards by source
	sourceGroups := map[string][]spec.StatCard{}
	for _, card := range widget.Cards {
		source := extractSource(card.Value)
		if source != "" {
			sourceGroups[source] = append(sourceGroups[source], card)
		}
	}

	for source, cards := range sourceGroups {
		data := map[string]any{}
		for _, card := range cards {
			fieldName := extractField(card.Value)
			if fieldName == "" {
				continue
			}
			// Generate a realistic count/value
			data[fieldName] = g.generateStatValue(card)
		}
		widgets[source] = data
	}
}

// generateChartWidget generates chart data for a chart widget.
func (g *Generator) generateChartWidget(widgets map[string]any, widget spec.Widget) {
	source := extractWidgetSource(widget.Source)
	if source == "" {
		return
	}

	switch widget.ChartType {
	case "donut", "pie":
		widgets[source] = g.generateDonutData(widget)
	case "area", "line":
		widgets[source] = g.generateTimeSeriesData(widget)
	case "bar", "stacked_bar":
		widgets[source] = g.generateBarData(widget)
	}
}

func (g *Generator) generateDonutData(widget spec.Widget) map[string]any {
	labelKey := "label"
	valueKey := "value"

	if widget.DataMapping != nil {
		if l, ok := widget.DataMapping["label"].(string); ok {
			labelKey = l
		}
		if v, ok := widget.DataMapping["value"].(string); ok {
			valueKey = v
		}
	}

	// If we have a color_map, use its keys as categories (sorted for determinism)
	var categories []string
	if widget.DataMapping != nil {
		if cm, ok := widget.DataMapping["color_map"].(map[string]any); ok {
			for k := range cm {
				categories = append(categories, k)
			}
			sortStrings(categories)
		}
	}

	if len(categories) == 0 {
		categories = []string{"Category A", "Category B", "Category C", "Category D"}
	}

	var data []map[string]any
	for _, cat := range categories {
		data = append(data, map[string]any{
			labelKey: cat,
			valueKey: 5 + g.faker.IntN(50),
		})
	}

	return map[string]any{"data": data}
}

func (g *Generator) generateTimeSeriesData(widget spec.Widget) map[string]any {
	xKey := "x"
	yKey := "y"
	seriesKey := ""

	if widget.DataMapping != nil {
		if x, ok := widget.DataMapping["x"].(string); ok {
			xKey = x
		}
		if y, ok := widget.DataMapping["y"].(string); ok {
			yKey = y
		}
		if s, ok := widget.DataMapping["series"].(string); ok {
			seriesKey = s
		}
	}

	var data []map[string]any
	now := g.now

	if seriesKey != "" {
		// Multi-series: generate data for several series over 6 months
		series := []string{"active", "completed", "pending"}
		for i := 5; i >= 0; i-- {
			month := now.AddDate(0, -i, 0).Format("2006-01")
			for _, s := range series {
				data = append(data, map[string]any{
					xKey:      month,
					yKey:      1 + g.faker.IntN(20),
					seriesKey: s,
				})
			}
		}
	} else {
		// Single series
		for i := 9; i >= 0; i-- {
			month := now.AddDate(0, -i, 0).Format("2006-01")
			data = append(data, map[string]any{
				xKey: month,
				yKey: 10 + g.faker.IntN(50),
			})
		}
	}

	return map[string]any{"data": data}
}

func (g *Generator) generateBarData(widget spec.Widget) map[string]any {
	labelKey := "label"
	valueKey := "value"

	if widget.DataMapping != nil {
		if l, ok := widget.DataMapping["label"].(string); ok {
			labelKey = l
		}
		if v, ok := widget.DataMapping["value"].(string); ok {
			valueKey = v
		}
	}

	categories := []string{"Q1", "Q2", "Q3", "Q4"}
	var data []map[string]any
	for _, cat := range categories {
		data = append(data, map[string]any{
			labelKey: cat,
			valueKey: 10 + g.faker.IntN(100),
		})
	}

	return map[string]any{"data": data}
}

func (g *Generator) generateStatValue(card spec.StatCard) any {
	name := strings.ToLower(card.Title)
	switch {
	case containsAny(name, "total", "count", "number"):
		return g.cfg.Count + g.faker.IntN(g.cfg.Count*2)
	case containsAny(name, "revenue", "amount", "mrr", "arr"):
		return 10000 + g.faker.IntN(990000)
	case containsAny(name, "pending", "expiring", "overdue"):
		return 1 + g.faker.IntN(g.cfg.Count/2+1)
	case containsAny(name, "active"):
		return g.faker.IntN(g.cfg.Count + 1)
	case containsAny(name, "rate", "percentage"):
		return fmt.Sprintf("%.1f%%", 50+g.faker.Float64()*50)
	default:
		return g.faker.IntN(100)
	}
}

// generateEntityStats produces _entity_stats data.
func (g *Generator) generateEntityStats() map[string]any {
	stats := map[string]any{}

	for _, appSpec := range g.specs {
		for _, entity := range appSpec.Entities {
			if entity.Views.Detail == nil || entity.Views.Detail.Header == nil {
				continue
			}
			for _, stat := range entity.Views.Detail.Header.Stats {
				source := extractSource(stat.Value)
				if source != "" && stats[source] == nil {
					// Generate generic stats
					stats[source] = map[string]any{
						"count":            g.faker.IntN(50),
						"total":            10000 + g.faker.IntN(500000),
						"active":           g.faker.IntN(20),
						"completed":        g.faker.IntN(30),
						"active_work_orders": g.faker.IntN(10),
						"total_revenue":    50000 + g.faker.IntN(200000),
					}
				}
			}
		}
	}

	return stats
}

// generateSubResources produces _sub_resources data (activity feeds, timelines).
func (g *Generator) generateSubResources() map[string]any {
	subRes := map[string]any{}

	for _, appSpec := range g.specs {
		for _, entity := range appSpec.Entities {
			if entity.Views.Detail == nil {
				continue
			}
			for _, tab := range entity.Views.Detail.Tabs {
				if tab.Content == nil {
					continue
				}
				switch tab.Content.Type {
				case "activity_feed":
					source := extractWidgetSource(tab.Content.Source)
					if source != "" {
						// Use wildcard pattern
						key := wildcardSource(source)
						if subRes[key] == nil {
							subRes[key] = g.generateActivityFeed()
						}
					}
				case "state_machine_timeline":
					source := extractWidgetSource(tab.Content.Source)
					if source != "" {
						key := wildcardSource(source)
						if subRes[key] == nil {
							subRes[key] = g.generateTimeline(entity.StateMachine)
						}
					}
				}
			}
		}
	}

	return subRes
}

func (g *Generator) generateActivityFeed() []map[string]any {
	actions := []string{
		"updated documents", "changed status", "added a comment",
		"uploaded files", "modified record", "reviewed submission",
	}
	var items []map[string]any
	now := g.now
	for i := 0; i < 5; i++ {
		items = append(items, map[string]any{
			"id":         fmt.Sprintf("act-%d", i+1),
			"user_name":  g.faker.Name(),
			"action":     actions[g.faker.IntN(len(actions))],
			"details":    g.faker.Sentence(8),
			"created_at": now.AddDate(0, 0, -i*3).UTC().Format(time.RFC3339),
		})
	}
	return items
}

func (g *Generator) generateTimeline(sm *spec.StateMachine) []map[string]any {
	if sm == nil {
		return nil
	}

	var items []map[string]any
	now := g.now

	// Walk a plausible path through the state machine
	current := sm.Initial
	for i := 0; i < 3; i++ {
		// Find a transition from current state
		var validTransitions []spec.Transition
		for _, t := range sm.Transitions {
			for _, from := range t.From {
				if from == current {
					validTransitions = append(validTransitions, t)
					break
				}
			}
		}
		if len(validTransitions) == 0 {
			break
		}
		t := validTransitions[g.faker.IntN(len(validTransitions))]

		items = append([]map[string]any{{
			"id":              fmt.Sprintf("tr-%d", i+1),
			"from_state":      current,
			"to_state":        t.To,
			"transition_name": t.Name,
			"label":           t.Label,
			"user_name":       g.faker.Name(),
			"created_at":      now.AddDate(0, 0, -i*7).UTC().Format(time.RFC3339),
		}}, items...)

		current = t.To
	}

	// Add initial creation entry
	items = append(items, map[string]any{
		"id":              fmt.Sprintf("tr-%d", len(items)+1),
		"from_state":      nil,
		"to_state":        sm.Initial,
		"transition_name": "create",
		"label":           "Created",
		"user_name":       "System",
		"created_at":      now.AddDate(0, -6, 0).UTC().Format(time.RFC3339),
	})

	return items
}

// Source extraction helpers

// extractSource handles stat card value which can be string or map with source+field.
func extractSource(value interface{}) string {
	switch v := value.(type) {
	case string:
		return extractWidgetSource(v)
	case map[string]any:
		if s, ok := v["source"].(string); ok {
			return extractWidgetSource(s)
		}
	case map[interface{}]interface{}:
		if s, ok := v["source"].(string); ok {
			return extractWidgetSource(s)
		}
	}
	return ""
}

// extractField gets the field name from a stat card value map.
func extractField(value interface{}) string {
	switch v := value.(type) {
	case map[string]any:
		if f, ok := v["field"].(string); ok {
			return f
		}
	case map[interface{}]interface{}:
		if f, ok := v["field"].(string); ok {
			return f
		}
	}
	return ""
}

// extractWidgetSource parses "api:GET /path" → "/path".
func extractWidgetSource(source string) string {
	if source == "" {
		return ""
	}
	// Only handle "api:" prefixed sources
	if !strings.HasPrefix(source, "api:") {
		return ""
	}
	s := strings.TrimPrefix(source, "api:")
	// Strip HTTP method
	parts := strings.Fields(s)
	if len(parts) >= 2 {
		return parts[1]
	}
	if len(parts) == 1 {
		return parts[0]
	}
	return ""
}

// wildcardSource replaces {{id}} with * for sub-resource keys.
func wildcardSource(source string) string {
	s := source
	s = strings.ReplaceAll(s, "{{id}}", "*")
	// Also handle bare path segments that look like IDs
	return s
}
