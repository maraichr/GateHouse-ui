package generate

import (
	"github.com/brianvoe/gofakeit/v7"
)

// generateFromMask produces a string matching the given mask pattern.
// '#' → random digit, 'X' or '*' → random digit, other chars → literal.
func generateFromMask(f *gofakeit.Faker, pattern string) string {
	result := make([]byte, len(pattern))
	for i := 0; i < len(pattern); i++ {
		switch pattern[i] {
		case '#', 'X', '*':
			result[i] = byte('0' + f.IntN(10))
		default:
			result[i] = pattern[i]
		}
	}
	return string(result)
}
