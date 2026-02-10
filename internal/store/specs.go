package store

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type Spec struct {
	ID             uuid.UUID        `json:"id"                              db:"id"`
	AppName        string           `json:"app_name"                        db:"app_name"`
	DisplayName    string           `json:"display_name"                    db:"display_name"`
	Description    string           `json:"description,omitempty"           db:"description"`
	OwnerID        *uuid.UUID       `json:"owner_id,omitempty"              db:"owner_id"`
	CreatedAt      time.Time        `json:"created_at"                      db:"created_at"`
	UpdatedAt      time.Time        `json:"updated_at"                      db:"updated_at"`
	DraftData      *json.RawMessage `json:"draft_data,omitempty"            db:"draft_data"`
	DraftUpdatedAt *time.Time       `json:"draft_updated_at,omitempty"      db:"draft_updated_at"`
}

const specCols = `id, app_name, display_name, COALESCE(description, '') AS description, owner_id, created_at, updated_at, draft_data, draft_updated_at`

type CreateSpecInput struct {
	AppName     string    `json:"app_name"`
	DisplayName string    `json:"display_name"`
	Description string    `json:"description,omitempty"`
	OwnerID     uuid.UUID `json:"owner_id"`
}

func (db *DB) CreateSpec(ctx context.Context, input CreateSpecInput) (*Spec, error) {
	rows, _ := db.Pool.Query(ctx,
		`INSERT INTO specs (app_name, display_name, description, owner_id)
		 VALUES ($1, $2, $3, $4)
		 RETURNING `+specCols,
		input.AppName, input.DisplayName, input.Description, input.OwnerID)
	s, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[Spec])
	if err != nil {
		return nil, fmt.Errorf("create spec: %w", err)
	}
	return s, nil
}

func (db *DB) GetSpec(ctx context.Context, id uuid.UUID) (*Spec, error) {
	rows, _ := db.Pool.Query(ctx,
		`SELECT `+specCols+` FROM specs WHERE id = $1`, id)
	s, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[Spec])
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get spec: %w", err)
	}
	return s, nil
}

func (db *DB) ListSpecs(ctx context.Context) ([]Spec, error) {
	rows, _ := db.Pool.Query(ctx,
		`SELECT `+specCols+` FROM specs ORDER BY display_name`)
	specs, err := pgx.CollectRows(rows, pgx.RowToStructByName[Spec])
	if err != nil {
		return nil, fmt.Errorf("list specs: %w", err)
	}
	return specs, nil
}

func (db *DB) DeleteSpec(ctx context.Context, id uuid.UUID) error {
	_, err := db.Pool.Exec(ctx, `DELETE FROM specs WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete spec: %w", err)
	}
	return nil
}

// Draft operations

func (db *DB) GetDraft(ctx context.Context, specID uuid.UUID) (json.RawMessage, *time.Time, error) {
	var draft *json.RawMessage
	var updatedAt *time.Time
	err := db.Pool.QueryRow(ctx,
		`SELECT draft_data, draft_updated_at FROM specs WHERE id = $1`, specID,
	).Scan(&draft, &updatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil, nil
	}
	if err != nil {
		return nil, nil, fmt.Errorf("get draft: %w", err)
	}
	if draft == nil {
		return nil, nil, nil
	}
	return *draft, updatedAt, nil
}

func (db *DB) SaveDraft(ctx context.Context, specID uuid.UUID, draftJSON json.RawMessage) error {
	tag, err := db.Pool.Exec(ctx,
		`UPDATE specs SET draft_data = $2, draft_updated_at = NOW() WHERE id = $1`,
		specID, draftJSON)
	if err != nil {
		return fmt.Errorf("save draft: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("spec not found")
	}
	return nil
}

func (db *DB) DiscardDraft(ctx context.Context, specID uuid.UUID) error {
	_, err := db.Pool.Exec(ctx,
		`UPDATE specs SET draft_data = NULL, draft_updated_at = NULL WHERE id = $1`,
		specID)
	if err != nil {
		return fmt.Errorf("discard draft: %w", err)
	}
	return nil
}

// Spec permissions

type SpecPermission struct {
	ID         uuid.UUID  `json:"id"`
	SpecID     uuid.UUID  `json:"spec_id"`
	UserID     uuid.UUID  `json:"user_id"`
	Permission string     `json:"permission"`
	GrantedBy  *uuid.UUID `json:"granted_by,omitempty"`
	GrantedAt  time.Time  `json:"granted_at"`
}

func (db *DB) GetSpecPermission(ctx context.Context, specID, userID uuid.UUID) (string, error) {
	var perm string
	err := db.Pool.QueryRow(ctx,
		`SELECT permission FROM spec_permissions WHERE spec_id = $1 AND user_id = $2`,
		specID, userID,
	).Scan(&perm)
	if err == pgx.ErrNoRows {
		return "", nil
	}
	if err != nil {
		return "", fmt.Errorf("get spec permission: %w", err)
	}
	return perm, nil
}

func (db *DB) SetSpecPermission(ctx context.Context, specID, userID uuid.UUID, permission string, grantedBy uuid.UUID) error {
	_, err := db.Pool.Exec(ctx,
		`INSERT INTO spec_permissions (spec_id, user_id, permission, granted_by)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT (spec_id, user_id) DO UPDATE SET permission = $3, granted_by = $4, granted_at = now()`,
		specID, userID, permission, grantedBy,
	)
	if err != nil {
		return fmt.Errorf("set spec permission: %w", err)
	}
	return nil
}
