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

type SpecVersion struct {
	ID            uuid.UUID       `json:"id"                       db:"id"`
	SpecID        uuid.UUID       `json:"spec_id"                  db:"spec_id"`
	Version       string          `json:"version"                  db:"version"`
	SpecData      json.RawMessage `json:"spec_data"                db:"spec_data"`
	Status        string          `json:"status"                   db:"status"`
	CreatedBy     *uuid.UUID      `json:"created_by,omitempty"     db:"created_by"`
	CreatedAt     time.Time       `json:"created_at"               db:"created_at"`
	ParentID      *uuid.UUID      `json:"parent_id,omitempty"      db:"parent_id"`
	ChangeSummary string          `json:"change_summary,omitempty" db:"change_summary"`
}

// SpecVersionSummary is a lighter version without spec_data for listings.
type SpecVersionSummary struct {
	ID            uuid.UUID  `json:"id"                       db:"id"`
	SpecID        uuid.UUID  `json:"spec_id"                  db:"spec_id"`
	Version       string     `json:"version"                  db:"version"`
	Status        string     `json:"status"                   db:"status"`
	CreatedBy     *uuid.UUID `json:"created_by,omitempty"     db:"created_by"`
	CreatedAt     time.Time  `json:"created_at"               db:"created_at"`
	ParentID      *uuid.UUID `json:"parent_id,omitempty"      db:"parent_id"`
	ChangeSummary string     `json:"change_summary,omitempty" db:"change_summary"`
}

const versionCols = `id, spec_id, version, spec_data, status, created_by, created_at, parent_id, COALESCE(change_summary, '') AS change_summary`
const versionSummaryCols = `id, spec_id, version, status, created_by, created_at, parent_id, COALESCE(change_summary, '') AS change_summary`

type CreateVersionInput struct {
	SpecID        uuid.UUID       `json:"spec_id"`
	Version       string          `json:"version"`
	SpecData      json.RawMessage `json:"spec_data"`
	CreatedBy     uuid.UUID       `json:"created_by"`
	ParentID      *uuid.UUID      `json:"parent_id,omitempty"`
	ChangeSummary string          `json:"change_summary,omitempty"`
}

func (db *DB) CreateVersion(ctx context.Context, input CreateVersionInput) (*SpecVersion, error) {
	rows, _ := db.Pool.Query(ctx,
		`INSERT INTO spec_versions (spec_id, version, spec_data, created_by, parent_id, change_summary)
		 VALUES ($1, $2, $3, $4, $5, NULLIF($6, ''))
		 RETURNING `+versionCols,
		input.SpecID, input.Version, input.SpecData, input.CreatedBy, input.ParentID, input.ChangeSummary)
	v, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[SpecVersion])
	if err != nil {
		return nil, fmt.Errorf("create version: %w", err)
	}
	return v, nil
}

func (db *DB) GetVersion(ctx context.Context, id uuid.UUID) (*SpecVersion, error) {
	rows, _ := db.Pool.Query(ctx,
		`SELECT `+versionCols+` FROM spec_versions WHERE id = $1`, id)
	v, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[SpecVersion])
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get version: %w", err)
	}
	return v, nil
}

func (db *DB) GetLatestVersion(ctx context.Context, specID uuid.UUID) (*SpecVersion, error) {
	rows, _ := db.Pool.Query(ctx,
		`SELECT `+versionCols+` FROM spec_versions WHERE spec_id = $1 ORDER BY created_at DESC LIMIT 1`, specID)
	v, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[SpecVersion])
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get latest version: %w", err)
	}
	return v, nil
}

func (db *DB) GetLatestApprovedVersion(ctx context.Context, specID uuid.UUID) (*SpecVersion, error) {
	rows, _ := db.Pool.Query(ctx,
		`SELECT `+versionCols+`
		 FROM spec_versions WHERE spec_id = $1 AND status = 'approved'
		 ORDER BY created_at DESC LIMIT 1`, specID)
	v, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[SpecVersion])
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get latest approved version: %w", err)
	}
	return v, nil
}

func (db *DB) ListVersions(ctx context.Context, specID uuid.UUID, status string) ([]SpecVersionSummary, error) {
	query := `SELECT ` + versionSummaryCols + ` FROM spec_versions WHERE spec_id = $1`
	args := []any{specID}
	if status != "" {
		query += ` AND status = $2`
		args = append(args, status)
	}
	query += ` ORDER BY created_at DESC`

	rows, _ := db.Pool.Query(ctx, query, args...)
	versions, err := pgx.CollectRows(rows, pgx.RowToStructByName[SpecVersionSummary])
	if err != nil {
		return nil, fmt.Errorf("list versions: %w", err)
	}
	return versions, nil
}

// validTransitions defines allowed status transitions.
var validTransitions = map[string][]string{
	"draft":     {"in_review", "archived"},
	"in_review": {"approved", "draft", "archived"},
	"approved":  {"archived"},
	"archived":  {},
}

// UpdateVersionStatus transitions a version's status with validation.
func (db *DB) UpdateVersionStatus(ctx context.Context, id uuid.UUID, newStatus string) (*SpecVersion, error) {
	// Get current status — single-column scan stays manual
	var currentStatus string
	err := db.Pool.QueryRow(ctx,
		`SELECT status FROM spec_versions WHERE id = $1`, id,
	).Scan(&currentStatus)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("version not found")
	}
	if err != nil {
		return nil, fmt.Errorf("get current status: %w", err)
	}

	// Validate transition
	allowed, ok := validTransitions[currentStatus]
	if !ok {
		return nil, fmt.Errorf("unknown current status %q", currentStatus)
	}
	valid := false
	for _, s := range allowed {
		if s == newStatus {
			valid = true
			break
		}
	}
	if !valid {
		return nil, fmt.Errorf("invalid transition from %q to %q", currentStatus, newStatus)
	}

	rows, _ := db.Pool.Query(ctx,
		`UPDATE spec_versions SET status = $2
		 WHERE id = $1
		 RETURNING `+versionCols,
		id, newStatus)
	v, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[SpecVersion])
	if err != nil {
		return nil, fmt.Errorf("update version status: %w", err)
	}
	return v, nil
}
