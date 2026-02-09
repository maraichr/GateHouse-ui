package auth

import (
	"context"

	"github.com/maraichr/GateHouse-ui/internal/store"
)

type contextKey string

const userContextKey contextKey = "auth_user"

// WithUser attaches a user to the context.
func WithUser(ctx context.Context, user *store.User) context.Context {
	return context.WithValue(ctx, userContextKey, user)
}

// UserFromContext retrieves the authenticated user from the context.
func UserFromContext(ctx context.Context) *store.User {
	u, _ := ctx.Value(userContextKey).(*store.User)
	return u
}

// RequireRole checks if the user has one of the specified roles.
func RequireRole(ctx context.Context, roles ...string) bool {
	user := UserFromContext(ctx)
	if user == nil {
		return false
	}
	for _, r := range roles {
		if user.Role == r {
			return true
		}
	}
	return false
}
