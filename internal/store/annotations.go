package store

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type Annotation struct {
	ID          uuid.UUID  `json:"id"                       db:"id"`
	VersionID   uuid.UUID  `json:"version_id"               db:"version_id"`
	ElementPath string     `json:"element_path"             db:"element_path"`
	ElementType string     `json:"element_type"             db:"element_type"`
	Body        string     `json:"body"                     db:"body"`
	State       string     `json:"state"                    db:"state"`
	AuthorID    uuid.UUID  `json:"author_id"                db:"author_id"`
	AuthorName  string     `json:"author_name,omitempty"    db:"author_name"`
	ParentID    *uuid.UUID `json:"parent_id,omitempty"      db:"parent_id"`
	CreatedAt   time.Time  `json:"created_at"               db:"created_at"`
	ResolvedAt  *time.Time `json:"resolved_at,omitempty"    db:"resolved_at"`
	ResolvedBy  *uuid.UUID `json:"resolved_by,omitempty"    db:"resolved_by"`
}

type CreateAnnotationInput struct {
	VersionID   uuid.UUID  `json:"version_id"`
	ElementPath string     `json:"element_path"`
	ElementType string     `json:"element_type"`
	Body        string     `json:"body"`
	State       string     `json:"state"`
	AuthorID    uuid.UUID  `json:"author_id"`
	ParentID    *uuid.UUID `json:"parent_id,omitempty"`
}

const annotationCols = `id, version_id, element_path, element_type, body, state, author_id, parent_id, created_at, resolved_at, resolved_by`

func (db *DB) CreateAnnotation(ctx context.Context, input CreateAnnotationInput) (*Annotation, error) {
	state := input.State
	if state == "" {
		state = "open"
	}
	rows, _ := db.Pool.Query(ctx,
		`INSERT INTO annotations (version_id, element_path, element_type, body, state, author_id, parent_id)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING `+annotationCols,
		input.VersionID, input.ElementPath, input.ElementType, input.Body, state, input.AuthorID, input.ParentID)
	a, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByNameLax[Annotation])
	if err != nil {
		return nil, fmt.Errorf("create annotation: %w", err)
	}
	return a, nil
}

func (db *DB) GetAnnotation(ctx context.Context, id uuid.UUID) (*Annotation, error) {
	rows, _ := db.Pool.Query(ctx,
		`SELECT `+annotationCols+` FROM annotations WHERE id = $1`, id)
	a, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByNameLax[Annotation])
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get annotation: %w", err)
	}
	return a, nil
}

// ListAnnotations returns annotations for a version with author display_name joined.
func (db *DB) ListAnnotations(ctx context.Context, versionID uuid.UUID) ([]Annotation, error) {
	rows, _ := db.Pool.Query(ctx,
		`SELECT a.id, a.version_id, a.element_path, a.element_type, a.body, a.state,
		        a.author_id, COALESCE(u.display_name, '') AS author_name,
		        a.parent_id, a.created_at, a.resolved_at, a.resolved_by
		 FROM annotations a
		 LEFT JOIN users u ON u.id = a.author_id
		 WHERE a.version_id = $1
		 ORDER BY a.created_at`, versionID)
	annotations, err := pgx.CollectRows(rows, pgx.RowToStructByNameLax[Annotation])
	if err != nil {
		return nil, fmt.Errorf("list annotations: %w", err)
	}
	return annotations, nil
}

func (db *DB) UpdateAnnotationState(ctx context.Context, id uuid.UUID, state string, resolvedBy *uuid.UUID) (*Annotation, error) {
	var query string
	var args []any
	if state == "resolved" {
		query = `UPDATE annotations SET state = $2, resolved_at = NOW(), resolved_by = $3
			 WHERE id = $1
			 RETURNING ` + annotationCols
		args = []any{id, state, resolvedBy}
	} else {
		query = `UPDATE annotations SET state = $2, resolved_at = NULL, resolved_by = NULL
			 WHERE id = $1
			 RETURNING ` + annotationCols
		args = []any{id, state}
	}
	rows, _ := db.Pool.Query(ctx, query, args...)
	a, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByNameLax[Annotation])
	if err != nil {
		return nil, fmt.Errorf("update annotation state: %w", err)
	}
	return a, nil
}

func (db *DB) DeleteAnnotation(ctx context.Context, id uuid.UUID) error {
	_, err := db.Pool.Exec(ctx, `DELETE FROM annotations WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete annotation: %w", err)
	}
	return nil
}

// HasBlockingAnnotations checks if a version has any unresolved blocking annotations.
func (db *DB) HasBlockingAnnotations(ctx context.Context, versionID uuid.UUID) (bool, error) {
	var count int
	err := db.Pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM annotations WHERE version_id = $1 AND state = 'blocking'`, versionID,
	).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("count blocking annotations: %w", err)
	}
	return count > 0, nil
}
