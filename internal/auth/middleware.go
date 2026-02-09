package auth

import (
	"net/http"

	"github.com/maraichr/GateHouse-ui/internal/store"
)

// Middleware creates an HTTP middleware that extracts user identity from the request.
// Priority: session cookie → X-User-Email header (dev/API fallback).
func Middleware(db *store.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// 1. Try session cookie
			if token := GetSessionToken(r); token != "" {
				session, _ := db.GetSessionByToken(r.Context(), token)
				if session != nil {
					user, _ := db.GetUserByID(r.Context(), session.UserID)
					if user != nil && user.IsActive {
						ctx := WithUser(r.Context(), user)
						next.ServeHTTP(w, r.WithContext(ctx))
						return
					}
				}
			}

			// 2. Fallback: X-User-Email header (dev/API testing)
			if email := r.Header.Get("X-User-Email"); email != "" {
				user, _ := db.GetUserByEmail(r.Context(), email)
				if user != nil && user.IsActive {
					ctx := WithUser(r.Context(), user)
					next.ServeHTTP(w, r.WithContext(ctx))
					return
				}
			}

			// 3. No auth — continue (RequireAuth middleware blocks if needed)
			next.ServeHTTP(w, r)
		})
	}
}

// RequireAuth is a middleware that rejects unauthenticated requests.
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if UserFromContext(r.Context()) == nil {
			http.Error(w, `{"error":"authentication required"}`, http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// RequireRoleMiddleware creates a middleware requiring specific roles.
func RequireRoleMiddleware(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !RequireRole(r.Context(), roles...) {
				http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
