package auth

import (
	"context"

	"github.com/google/uuid"
	"github.com/maraichr/GateHouse-ui/internal/store"
)

// CanEditSpec checks if the user can edit a spec (admin, editor, or spec owner/editor).
func CanEditSpec(ctx context.Context, db *store.DB, specID uuid.UUID) bool {
	user := UserFromContext(ctx)
	if user == nil {
		return false
	}
	if user.Role == "admin" || user.Role == "editor" {
		return true
	}
	perm, err := db.GetSpecPermission(ctx, specID, user.ID)
	if err != nil {
		return false
	}
	return perm == "owner" || perm == "editor"
}

// CanReviewSpec checks if the user can review/annotate a spec.
func CanReviewSpec(ctx context.Context, db *store.DB, specID uuid.UUID) bool {
	user := UserFromContext(ctx)
	if user == nil {
		return false
	}
	if user.Role == "admin" || user.Role == "editor" || user.Role == "reviewer" {
		return true
	}
	perm, err := db.GetSpecPermission(ctx, specID, user.ID)
	if err != nil {
		return false
	}
	return perm == "owner" || perm == "editor" || perm == "reviewer"
}

// CanViewSpec checks if the user can view a spec (any authenticated role).
func CanViewSpec(ctx context.Context, db *store.DB, specID uuid.UUID) bool {
	user := UserFromContext(ctx)
	if user == nil {
		return false
	}
	// Any role can view
	return true
}

// CanApprove checks if the user can approve/reject a spec version.
func CanApprove(ctx context.Context, db *store.DB, specID uuid.UUID) bool {
	return CanReviewSpec(ctx, db, specID)
}

// IsAdmin checks if the current user has admin role.
func IsAdmin(ctx context.Context) bool {
	return RequireRole(ctx, "admin")
}
