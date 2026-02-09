package store

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type Approval struct {
	ID         uuid.UUID `json:"id"                  db:"id"`
	VersionID  uuid.UUID `json:"version_id"          db:"version_id"`
	ReviewerID uuid.UUID `json:"reviewer_id"         db:"reviewer_id"`
	Decision   string    `json:"decision"            db:"decision"`
	Notes      string    `json:"notes,omitempty"     db:"notes"`
	CreatedAt  time.Time `json:"created_at"          db:"created_at"`
}

const approvalCols = `id, version_id, reviewer_id, decision, COALESCE(notes, '') AS notes, created_at`

type CreateApprovalInput struct {
	VersionID  uuid.UUID `json:"version_id"`
	ReviewerID uuid.UUID `json:"reviewer_id"`
	Decision   string    `json:"decision"`
	Notes      string    `json:"notes,omitempty"`
}

func (db *DB) CreateApproval(ctx context.Context, input CreateApprovalInput) (*Approval, error) {
	rows, _ := db.Pool.Query(ctx,
		`INSERT INTO approvals (version_id, reviewer_id, decision, notes)
		 VALUES ($1, $2, $3, NULLIF($4, ''))
		 ON CONFLICT (version_id, reviewer_id) DO UPDATE SET decision = $3, notes = NULLIF($4, ''), created_at = now()
		 RETURNING `+approvalCols,
		input.VersionID, input.ReviewerID, input.Decision, input.Notes)
	a, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[Approval])
	if err != nil {
		return nil, fmt.Errorf("create approval: %w", err)
	}
	return a, nil
}

func (db *DB) ListApprovals(ctx context.Context, versionID uuid.UUID) ([]Approval, error) {
	rows, _ := db.Pool.Query(ctx,
		`SELECT `+approvalCols+` FROM approvals WHERE version_id = $1 ORDER BY created_at`, versionID)
	approvals, err := pgx.CollectRows(rows, pgx.RowToStructByName[Approval])
	if err != nil {
		return nil, fmt.Errorf("list approvals: %w", err)
	}
	return approvals, nil
}

func (db *DB) GetApproval(ctx context.Context, versionID, reviewerID uuid.UUID) (*Approval, error) {
	rows, _ := db.Pool.Query(ctx,
		`SELECT `+approvalCols+` FROM approvals WHERE version_id = $1 AND reviewer_id = $2`,
		versionID, reviewerID)
	a, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[Approval])
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get approval: %w", err)
	}
	return a, nil
}
