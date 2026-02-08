package generate

import (
	"fmt"
	"strings"
	"unicode"
)

// IDRecord tracks a generated ID and its human-readable label.
type IDRecord struct {
	ID    string
	Label string
}

// IDRegistry maps entity names to their generated ID records.
type IDRegistry map[string][]IDRecord

// entityPrefix derives a 3-4 character abbreviation from a PascalCase entity name.
// Examples: Customer→CUST, PaymentBatch→BAT, KYCReview→KYC, Subcontractor→SUB
func entityPrefix(name string) string {
	// Split on uppercase boundaries
	var words []string
	start := 0
	for i := 1; i < len(name); i++ {
		if unicode.IsUpper(rune(name[i])) {
			words = append(words, name[start:i])
			start = i
		}
	}
	words = append(words, name[start:])

	switch len(words) {
	case 1:
		w := strings.ToUpper(words[0])
		if len(w) <= 4 {
			return w
		}
		// Take first 3 consonants + first letter
		return w[:3]
	case 2:
		// If first word is short acronym (<=3), use it as-is
		if len(words[0]) <= 3 {
			return strings.ToUpper(words[0])
		}
		// Otherwise take first 3 of last word
		last := strings.ToUpper(words[1])
		if len(last) > 3 {
			last = last[:3]
		}
		return last
	default:
		// 3+ words: take first letter of each, up to 4
		prefix := ""
		for _, w := range words {
			if len(prefix) >= 4 {
				break
			}
			prefix += string(unicode.ToUpper(rune(w[0])))
		}
		return prefix
	}
}

// generateID creates a zero-padded ID for the given entity and index.
func generateID(entity string, index int) string {
	prefix := entityPrefix(entity)
	return fmt.Sprintf("%s-%03d", prefix, index+1)
}
