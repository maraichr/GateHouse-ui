package generate

import (
	"time"

	"github.com/brianvoe/gofakeit/v7"
	"github.com/maraichr/GateHouse-ui/pkg/spec"
)

// Config controls the generator behavior.
type Config struct {
	Count int   // records per entity
	Seed  int64 // 0 = random
}

// Generator produces mock data from parsed specs.
type Generator struct {
	cfg                  Config
	faker                *gofakeit.Faker
	now                  time.Time // fixed anchor for deterministic timestamps
	specs                []*spec.AppSpec
	idRegistry           IDRegistry
	collections          map[string][]any
	statusDistributions  map[string][]statusWeight
}

// NewGenerator creates a Generator from one or more parsed specs.
func NewGenerator(cfg Config, specs ...*spec.AppSpec) *Generator {
	if cfg.Count <= 0 {
		cfg.Count = 10
	}

	var f *gofakeit.Faker
	if cfg.Seed != 0 {
		f = gofakeit.New(uint64(cfg.Seed))
	} else {
		f = gofakeit.New(0)
	}

	// Use a fixed anchor when seed is set for deterministic output
	now := time.Now().Truncate(time.Minute)
	if cfg.Seed != 0 {
		now = time.Date(2026, 1, 15, 12, 0, 0, 0, time.UTC)
	}

	g := &Generator{
		cfg:                 cfg,
		faker:               f,
		now:                 now,
		specs:               specs,
		idRegistry:          IDRegistry{},
		collections:         map[string][]any{},
		statusDistributions: map[string][]statusWeight{},
	}

	// Pre-compute status distributions
	for _, s := range specs {
		for i := range s.Entities {
			entity := &s.Entities[i]
			if entity.StateMachine != nil {
				g.statusDistributions[entity.Name] = buildStatusDistribution(entity.StateMachine)
			}
		}
	}

	return g
}

// Generate produces the full mock data map ready for JSON serialization.
func (g *Generator) Generate() (map[string]any, error) {
	// 1. Build entity dependency graph and topological sort
	sorted := g.topologicalSort()

	// 2. Generate records for each entity in dependency order
	for _, entity := range sorted {
		g.generateEntityRecords(entity)
	}

	// 3. Post-process: wire foreign key labels
	g.wireRelationships()

	// 4. Assemble output
	result := map[string]any{}

	// Add collections
	for key, records := range g.collections {
		result[key] = records
	}

	// 5. Generate _widgets
	widgets := g.generateWidgets()
	if len(widgets) > 0 {
		result["_widgets"] = widgets
	}

	// 6. Generate _entity_stats
	entityStats := g.generateEntityStats()
	if len(entityStats) > 0 {
		result["_entity_stats"] = entityStats
	}

	// 7. Generate _sub_resources
	subResources := g.generateSubResources()
	if len(subResources) > 0 {
		result["_sub_resources"] = subResources
	}

	return result, nil
}

// generateEntityRecords creates records for a single entity.
func (g *Generator) generateEntityRecords(entity *spec.Entity) {
	resource := entityResourceKey(entity)
	var records []any

	// Identify which fields have conditional fake hints (need second pass)
	conditionalFields := map[int]bool{}
	for j := range entity.Fields {
		if entity.Fields[j].Fake != nil && entity.Fields[j].Fake.IsConditional() {
			conditionalFields[j] = true
		}
	}

	for i := 0; i < g.cfg.Count; i++ {
		record := map[string]any{}

		// First pass: generate all non-conditional fields
		for j := range entity.Fields {
			if conditionalFields[j] {
				continue
			}
			field := &entity.Fields[j]

			if field.Computed != nil && !field.PrimaryKey {
				record[field.Name] = g.generateFieldValue(entity, field, i)
				continue
			}

			if field.Generated {
				record[field.Name] = g.generateGeneratedField(entity, field, i)
				continue
			}

			record[field.Name] = g.generateFieldValue(entity, field, i)
		}

		// Second pass: generate conditional fields (they can now read dependency values)
		for j := range entity.Fields {
			if !conditionalFields[j] {
				continue
			}
			field := &entity.Fields[j]
			record[field.Name] = g.generateFieldValueWithRecord(entity, field, i, record)
		}

		// Register ID for cross-references
		id, _ := record["id"].(string)
		label := ""
		if entity.LabelField != "" {
			label, _ = record[entity.LabelField].(string)
		}
		if id != "" {
			g.idRegistry[entity.Name] = append(g.idRegistry[entity.Name], IDRecord{ID: id, Label: label})
		}

		records = append(records, record)
	}

	g.collections[resource] = records
}

// generateGeneratedField produces values for system-generated fields (like WO numbers).
func (g *Generator) generateGeneratedField(entity *spec.Entity, field *spec.Field, index int) any {
	prefix := entityPrefix(entity.Name)
	return prefix + "-" + padNumber(1000+index, 4)
}

func padNumber(n, width int) string {
	s := ""
	for n > 0 {
		s = string(rune('0'+n%10)) + s
		n /= 10
	}
	for len(s) < width {
		s = "0" + s
	}
	return s
}

// allEntities returns all entities across all specs.
func (g *Generator) allEntities() []*spec.Entity {
	var entities []*spec.Entity
	for _, s := range g.specs {
		for i := range s.Entities {
			entities = append(entities, &s.Entities[i])
		}
	}
	return entities
}

// entityByName finds an entity by name across all specs.
func (g *Generator) entityByName(name string) *spec.Entity {
	for _, s := range g.specs {
		for i := range s.Entities {
			if s.Entities[i].Name == name {
				return &s.Entities[i]
			}
		}
	}
	return nil
}

// topologicalSort returns entities ordered so that dependencies come first.
// Uses Kahn's algorithm. Entities with no dependencies come first.
func (g *Generator) topologicalSort() []*spec.Entity {
	entities := g.allEntities()
	if len(entities) == 0 {
		return nil
	}

	// Build name → entity map
	nameMap := map[string]*spec.Entity{}
	for _, e := range entities {
		nameMap[e.Name] = e
	}

	// Build adjacency list: entity depends on referenced entities
	inDegree := map[string]int{}
	deps := map[string][]string{} // entity → entities it depends on

	for _, e := range entities {
		inDegree[e.Name] = 0
	}

	for _, e := range entities {
		seen := map[string]bool{}
		for _, f := range e.Fields {
			if f.Type == "reference" && f.Entity != "" && nameMap[f.Entity] != nil && f.Entity != e.Name {
				if !seen[f.Entity] {
					seen[f.Entity] = true
					deps[e.Name] = append(deps[e.Name], f.Entity)
					inDegree[e.Name]++
				}
			}
		}
		// Also check array items with reference type
		for _, f := range e.Fields {
			if f.Type == "array" && f.Items != nil && f.Items.Type == "reference" && f.Items.Entity != "" {
				target := f.Items.Entity
				if nameMap[target] != nil && target != e.Name && !seen[target] {
					seen[target] = true
					deps[e.Name] = append(deps[e.Name], target)
					inDegree[e.Name]++
				}
			}
		}
	}

	// Kahn's algorithm
	var queue []string
	for _, e := range entities {
		if inDegree[e.Name] == 0 {
			queue = append(queue, e.Name)
		}
	}

	var sorted []*spec.Entity
	for len(queue) > 0 {
		name := queue[0]
		queue = queue[1:]
		sorted = append(sorted, nameMap[name])

		// Find entities that depend on this one
		for _, e := range entities {
			for _, dep := range deps[e.Name] {
				if dep == name {
					inDegree[e.Name]--
					if inDegree[e.Name] == 0 {
						queue = append(queue, e.Name)
					}
					break
				}
			}
		}
	}

	// Add any remaining entities (circular deps) at the end
	added := map[string]bool{}
	for _, e := range sorted {
		added[e.Name] = true
	}
	for _, e := range entities {
		if !added[e.Name] {
			sorted = append(sorted, e)
		}
	}

	return sorted
}
