package generate

import (
	"strings"

	"github.com/maraichr/GateHouse-ui/pkg/spec"
)

// wireRelationships resolves denormalized label fields after all records are generated.
// Two strategies:
// 1. Convention: if field "customer_id" exists, inject "customer_name" from target's label_field
// 2. Display field: if a list column references display_field "company_name", inject that field
func (g *Generator) wireRelationships() {
	for _, entity := range g.allEntities() {
		resource := entityResourceKey(entity)
		records, ok := g.collections[resource]
		if !ok {
			continue
		}

		for j := range entity.Fields {
			field := &entity.Fields[j]
			if field.Type != "reference" || field.Entity == "" {
				continue
			}

			targetEntity := g.entityByName(field.Entity)
			if targetEntity == nil {
				continue
			}

			labelMap := g.buildLabelMap(targetEntity)
			if len(labelMap) == 0 {
				continue
			}

			// Strategy 1: Convention-based (customer_id → customer_name)
			labelFieldName := deriveLabelFieldName(field.Name)
			if labelFieldName != "" {
				g.injectLabels(records, field.Name, labelFieldName, labelMap)
			}

			// Strategy 2: display_field from list columns
			displayFields := findDisplayFields(entity, field.Name)
			for _, df := range displayFields {
				// Build a map using the specific display field from target
				dfMap := g.buildFieldMap(targetEntity, df)
				if len(dfMap) > 0 {
					g.injectLabels(records, field.Name, df, dfMap)
				}
			}
		}
	}
}

// injectLabels sets labelFieldName on each record by looking up the reference ID.
func (g *Generator) injectLabels(records []any, refFieldName, labelFieldName string, labelMap map[string]string) {
	for _, record := range records {
		rec, ok := record.(map[string]any)
		if !ok {
			continue
		}
		refID, ok := rec[refFieldName].(string)
		if !ok || refID == "" {
			continue
		}
		if label, exists := labelMap[refID]; exists {
			rec[labelFieldName] = label
		}
	}
}

// deriveLabelFieldName converts a reference field name to its expected label sibling.
func deriveLabelFieldName(refFieldName string) string {
	if !strings.HasSuffix(refFieldName, "_id") {
		return ""
	}
	base := strings.TrimSuffix(refFieldName, "_id")
	return base + "_name"
}

// findDisplayFields returns display_field values from list columns that reference the given field.
func findDisplayFields(entity *spec.Entity, refFieldName string) []string {
	var fields []string
	if entity.Views.List == nil {
		return fields
	}
	for _, col := range entity.Views.List.Columns {
		if col.Field == refFieldName && col.DisplayField != "" {
			fields = append(fields, col.DisplayField)
		}
	}
	return fields
}

// buildLabelMap creates a map of ID → label_field value for the given entity.
func (g *Generator) buildLabelMap(entity *spec.Entity) map[string]string {
	return g.buildFieldMap(entity, entity.LabelField)
}

// buildFieldMap creates a map of ID → field value for the given entity and field name.
func (g *Generator) buildFieldMap(entity *spec.Entity, fieldName string) map[string]string {
	result := map[string]string{}
	if fieldName == "" {
		return result
	}
	resource := entityResourceKey(entity)
	records, ok := g.collections[resource]
	if !ok {
		return result
	}

	for _, record := range records {
		rec, ok := record.(map[string]any)
		if !ok {
			continue
		}
		id, _ := rec["id"].(string)
		val, _ := rec[fieldName].(string)
		if id != "" && val != "" {
			result[id] = val
		}
	}
	return result
}

// entityResourceKey derives the API resource path used as the collection key.
func entityResourceKey(entity *spec.Entity) string {
	res := entity.APIResource
	if res == "" {
		res = "/" + toKebab(entity.Name)
	}
	if !strings.HasPrefix(res, "/") {
		res = "/" + res
	}
	return res
}

// toKebab converts PascalCase to kebab-case.
func toKebab(s string) string {
	var result strings.Builder
	for i, r := range s {
		if i > 0 && r >= 'A' && r <= 'Z' {
			result.WriteByte('-')
		}
		result.WriteRune(r)
	}
	return strings.ToLower(result.String())
}
