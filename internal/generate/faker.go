package generate

import (
	"fmt"
	"math"
	"sort"
	"strings"
	"time"

	"github.com/maraichr/GateHouse-ui/pkg/spec"
)

var industries = []string{
	"Technology", "Healthcare", "Finance", "Manufacturing", "Retail",
	"Construction", "Energy", "Transportation", "Education", "Real Estate",
	"Telecommunications", "Agriculture", "Hospitality", "Media", "Consulting",
}

// generateFieldValue produces a realistic fake value for the given field.
func (g *Generator) generateFieldValue(entity *spec.Entity, field *spec.Field, index int) any {
	// Non-required fields: ~20% chance of nil (but never for status/enum fields with state machines)
	isStatusField := entity.StatusField == field.Name && entity.StateMachine != nil
	if !field.Required && !field.PrimaryKey && !isStatusField && g.faker.Float64() < 0.2 {
		return nil
	}

	// Mask pattern takes precedence for strings
	if field.MaskPattern != "" && field.Type == "string" {
		return generateFromMask(g.faker, unmaskPattern(field.MaskPattern))
	}

	switch field.Type {
	case "uuid":
		return generateID(entity.Name, index)

	case "string":
		return g.generateString(entity, field, index)

	case "enum":
		return g.generateEnum(entity, field)

	case "email":
		return g.faker.Email()

	case "phone":
		return fmt.Sprintf("(%03d) %03d-%04d",
			200+g.faker.IntN(800),
			200+g.faker.IntN(800),
			g.faker.IntN(10000))

	case "date":
		return g.generateDate(field)

	case "datetime":
		return g.generateDatetime()

	case "currency":
		return g.generateCurrency(field)

	case "decimal":
		return g.generateDecimal(field)

	case "integer":
		return g.generateInteger(field)

	case "boolean":
		return g.faker.Bool()

	case "reference":
		return g.generateReference(field)

	case "address":
		return g.generateAddress(field)

	case "richtext":
		return fmt.Sprintf("<p>%s</p>", g.faker.Sentence(12))

	case "text":
		return g.faker.Sentence(10)

	case "image":
		return nil // images are file uploads, leave nil

	case "file", "file_list":
		return nil // file uploads, leave nil

	case "array":
		return g.generateArray(field)

	case "inline_table":
		return g.generateInlineTable(field)

	default:
		return g.faker.Word()
	}
}

// unmaskPattern converts a display mask pattern to a generation mask.
// In display: '#'=show digit, 'X'/'*'=mask. For generation we want all digits.
func unmaskPattern(pattern string) string {
	result := make([]byte, len(pattern))
	for i := 0; i < len(pattern); i++ {
		switch pattern[i] {
		case '#', 'X', '*':
			result[i] = '#'
		default:
			result[i] = pattern[i]
		}
	}
	return string(result)
}

func (g *Generator) generateString(entity *spec.Entity, field *spec.Field, index int) any {
	name := strings.ToLower(field.Name)

	switch {
	case name == "company_name" || name == "legal_name" || name == "business_name" || name == "organization_name":
		return g.faker.Company()

	case strings.HasSuffix(name, "_name") && containsAny(name, "contact", "person", "user", "officer", "agent"):
		return g.faker.Name()

	case name == "name":
		// Context-dependent: if entity looks like a person use Name(), else use Company() or Word()
		eName := strings.ToLower(entity.Name)
		if containsAny(eName, "contact", "person", "user", "employee", "officer") {
			return g.faker.Name()
		}
		return g.faker.BuzzWord() + " " + g.faker.BS()

	case name == "email" || strings.HasSuffix(name, "_email"):
		return g.faker.Email()

	case name == "phone" || strings.HasSuffix(name, "_phone"):
		return fmt.Sprintf("(%03d) %03d-%04d",
			200+g.faker.IntN(800),
			200+g.faker.IntN(800),
			g.faker.IntN(10000))

	case name == "website" || strings.HasSuffix(name, "_url") || name == "url":
		return "https://" + g.faker.DomainName()

	case name == "industry":
		return industries[g.faker.IntN(len(industries))]

	case containsAny(name, "description", "memo", "notes", "summary", "comment", "reason"):
		return g.faker.Sentence(8)

	case containsAny(name, "title", "subject"):
		return g.faker.Sentence(4)

	case containsAny(name, "reference", "ref_number", "number") && !strings.Contains(name, "phone"):
		return fmt.Sprintf("REF-%d-%04d", 2025+g.faker.IntN(2), 1000+g.faker.IntN(9000))

	case strings.HasSuffix(name, "_code") || name == "code":
		return strings.ToUpper(g.faker.LetterN(4))

	case name == "street1" || name == "street_address":
		return g.faker.Street()

	case name == "street2":
		if g.faker.Float64() < 0.3 {
			return fmt.Sprintf("Suite %d", 100+g.faker.IntN(900))
		}
		return ""

	case name == "city":
		return g.faker.City()

	case name == "state":
		return g.faker.StateAbr()

	case name == "zip" || name == "zip_code" || name == "postal_code":
		return g.faker.Zip()

	case name == "country":
		return "US"

	case strings.HasSuffix(name, "_by") || strings.HasSuffix(name, "_to"):
		return g.faker.Name()

	case strings.HasSuffix(name, "_at"):
		return g.generateDatetime()

	case name == "ein" || name == "tax_id":
		return fmt.Sprintf("%02d-%07d", 10+g.faker.IntN(90), g.faker.IntN(10000000))

	case name == "routing_number":
		return generateFromMask(g.faker, "####-####-#")

	case name == "account_number":
		return generateFromMask(g.faker, "####-####-####")

	default:
		if field.MaxLength > 0 && field.MaxLength < 50 {
			w := g.faker.Word()
			if len(w) > field.MaxLength {
				w = w[:field.MaxLength]
			}
			return w
		}
		return g.faker.Sentence(4)
	}
}

func (g *Generator) generateEnum(entity *spec.Entity, field *spec.Field) any {
	if len(field.Values) == 0 {
		return ""
	}

	// For status fields with a state machine, use the status distribution
	if entity.StatusField == field.Name && entity.StateMachine != nil {
		dist := g.statusDistributions[entity.Name]
		if len(dist) > 0 {
			return g.pickFromDistribution(dist)
		}
	}

	// Otherwise random pick
	return field.Values[g.faker.IntN(len(field.Values))].Value
}

func (g *Generator) generateDate(field *spec.Field) string {
	var t time.Time
	if field.FutureOnly {
		days := 1 + g.faker.IntN(365)
		t = g.now.AddDate(0, 0, days)
	} else {
		days := g.faker.IntN(270) - 180
		t = g.now.AddDate(0, 0, days)
	}
	return t.Format("2006-01-02")
}

func (g *Generator) generateDatetime() string {
	days := g.faker.IntN(365)
	hours := g.faker.IntN(24)
	mins := g.faker.IntN(60)
	t := g.now.AddDate(0, 0, -days).Add(-time.Duration(hours)*time.Hour - time.Duration(mins)*time.Minute)
	return t.UTC().Format(time.RFC3339)
}

func (g *Generator) generateCurrency(field *spec.Field) any {
	minVal := 100.0
	maxVal := 100000.0

	if field.Min != nil {
		if v, ok := toFloat64(field.Min); ok {
			minVal = v
		}
	}
	if field.Max != nil {
		if v, ok := toFloat64(field.Max); ok {
			maxVal = v
		}
	}

	val := minVal + g.faker.Float64()*float64(maxVal-minVal)
	precision := 2
	if field.Precision > 0 {
		precision = field.Precision
	}
	mult := math.Pow(10, float64(precision))
	return math.Round(val*mult) / mult
}

func (g *Generator) generateDecimal(field *spec.Field) any {
	minVal := 0.0
	maxVal := 100.0

	if field.Min != nil {
		if v, ok := toFloat64(field.Min); ok {
			minVal = v
		}
	}
	if field.Max != nil {
		if v, ok := toFloat64(field.Max); ok {
			maxVal = v
		}
	}

	val := minVal + g.faker.Float64()*(maxVal-minVal)
	precision := 2
	if field.Precision > 0 {
		precision = field.Precision
	}
	mult := math.Pow(10, float64(precision))
	return math.Round(val*mult) / mult
}

func (g *Generator) generateInteger(field *spec.Field) any {
	minVal := 0
	maxVal := 1000

	if field.Min != nil {
		if v, ok := toFloat64(field.Min); ok {
			minVal = int(v)
		}
	}
	if field.Max != nil {
		if v, ok := toFloat64(field.Max); ok {
			maxVal = int(v)
		}
	}

	if maxVal <= minVal {
		return minVal
	}
	return minVal + g.faker.IntN(maxVal-minVal+1)
}

func (g *Generator) generateReference(field *spec.Field) any {
	targetEntity := field.Entity
	if targetEntity == "" {
		return nil
	}
	ids := g.idRegistry[targetEntity]
	if len(ids) == 0 {
		return nil
	}
	return ids[g.faker.IntN(len(ids))].ID
}

func (g *Generator) generateAddress(field *spec.Field) any {
	addr := map[string]any{
		"street1": g.faker.Street(),
		"city":    g.faker.City(),
		"state":   g.faker.StateAbr(),
		"zip":     g.faker.Zip(),
		"country": "US",
	}
	if g.faker.Float64() < 0.3 {
		addr["street2"] = fmt.Sprintf("Suite %d", 100+g.faker.IntN(900))
	}
	return addr
}

func (g *Generator) generateArray(field *spec.Field) any {
	count := 1 + g.faker.IntN(3)
	if field.MinItems > 0 && count < field.MinItems {
		count = field.MinItems
	}
	if field.MaxItems > 0 && count > field.MaxItems {
		count = field.MaxItems
	}

	// Reference arrays: pick random IDs
	if field.Items != nil && field.Items.Type == "reference" {
		targetEntity := field.Items.Entity
		ids := g.idRegistry[targetEntity]
		if len(ids) == 0 {
			return []any{}
		}
		// Pick unique random IDs
		picked := map[string]bool{}
		var result []any
		for i := 0; i < count && i < len(ids); i++ {
			for attempts := 0; attempts < 10; attempts++ {
				id := ids[g.faker.IntN(len(ids))].ID
				if !picked[id] {
					picked[id] = true
					result = append(result, id)
					break
				}
			}
		}
		return result
	}

	// String arrays
	var result []any
	for i := 0; i < count; i++ {
		result = append(result, g.faker.Word())
	}
	return result
}

func (g *Generator) generateInlineTable(field *spec.Field) any {
	rowCount := 1 + g.faker.IntN(3)
	if field.MinRows > 0 && rowCount < field.MinRows {
		rowCount = field.MinRows
	}
	if field.MaxRows > 0 && rowCount > field.MaxRows {
		rowCount = field.MaxRows
	}

	var rows []map[string]any
	for i := 0; i < rowCount; i++ {
		row := map[string]any{}
		for _, col := range field.Columns {
			switch col.Type {
			case "string":
				row[col.Name] = g.faker.Sentence(3)
			case "decimal":
				row[col.Name] = math.Round(g.faker.Float64()*100*100) / 100
			case "currency":
				row[col.Name] = math.Round(g.faker.Float64()*1000*100) / 100
			case "integer":
				row[col.Name] = 1 + g.faker.IntN(100)
			default:
				row[col.Name] = g.faker.Word()
			}
		}
		rows = append(rows, row)
	}
	return rows
}

// Status distribution helpers

type statusWeight struct {
	Value  string
	Weight float64
}

func buildStatusDistribution(sm *spec.StateMachine) []statusWeight {
	if sm == nil {
		return nil
	}

	// Collect all states
	stateSet := map[string]bool{sm.Initial: true}
	outgoing := map[string]bool{} // states that have outgoing transitions
	for _, t := range sm.Transitions {
		for _, from := range t.From {
			stateSet[from] = true
			outgoing[from] = true
		}
		stateSet[t.To] = true
	}

	// Classify states (sort for determinism)
	var initial, terminal, intermediate []string
	for s := range stateSet {
		switch {
		case s == sm.Initial:
			initial = append(initial, s)
		case !outgoing[s]:
			terminal = append(terminal, s)
		default:
			intermediate = append(intermediate, s)
		}
	}
	sort.Strings(terminal)
	sort.Strings(intermediate)

	var dist []statusWeight

	// Initial: 30%
	for _, s := range initial {
		dist = append(dist, statusWeight{s, 0.30 / float64(len(initial))})
	}
	// Terminal: 25% each (capped at 50%)
	termWeight := 0.25
	if float64(len(terminal))*termWeight > 0.50 {
		termWeight = 0.50 / float64(len(terminal))
	}
	for _, s := range terminal {
		dist = append(dist, statusWeight{s, termWeight})
	}
	// Intermediate: remaining weight split evenly
	remaining := 1.0
	for _, d := range dist {
		remaining -= d.Weight
	}
	if remaining < 0 {
		remaining = 0
	}
	if len(intermediate) > 0 {
		w := remaining / float64(len(intermediate))
		for _, s := range intermediate {
			dist = append(dist, statusWeight{s, w})
		}
	}

	return dist
}

func (g *Generator) pickFromDistribution(dist []statusWeight) string {
	r := g.faker.Float64()
	cumulative := 0.0
	for _, d := range dist {
		cumulative += d.Weight
		if r < cumulative {
			return d.Value
		}
	}
	return dist[len(dist)-1].Value
}

// Helpers

func containsAny(s string, substrs ...string) bool {
	for _, sub := range substrs {
		if strings.Contains(s, sub) {
			return true
		}
	}
	return false
}

func toFloat64(v interface{}) (float64, bool) {
	switch n := v.(type) {
	case float64:
		return n, true
	case float32:
		return float64(n), true
	case int:
		return float64(n), true
	case int64:
		return float64(n), true
	default:
		return 0, false
	}
}
