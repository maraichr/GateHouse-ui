package store

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type AuditEntry struct {
	ID           uuid.UUID       `json:"id"                    db:"id"`
	UserID       *uuid.UUID      `json:"user_id,omitempty"     db:"user_id"`
	Action       string          `json:"action"                db:"action"`
	ResourceType string          `json:"resource_type"         db:"resource_type"`
	ResourceID   uuid.UUID       `json:"resource_id"           db:"resource_id"`
	Metadata     json.RawMessage `json:"metadata,omitempty"    db:"metadata"`
	IPAddress    string          `json:"ip_address,omitempty"  db:"ip_address"`
	CreatedAt    time.Time       `json:"created_at"            db:"created_at"`
}

type AuditInput struct {
	UserID       uuid.UUID      `json:"-"`
	Action       string         `json:"-"`
	ResourceType string         `json:"-"`
	ResourceID   uuid.UUID      `json:"-"`
	Metadata     map[string]any `json:"-"`
	IPAddress    string         `json:"-"`
}

func (db *DB) WriteAudit(ctx context.Context, input AuditInput) error {
	var metaJSON []byte
	if input.Metadata != nil {
		var err error
		metaJSON, err = json.Marshal(input.Metadata)
		if err != nil {
			return fmt.Errorf("marshal audit metadata: %w", err)
		}
	}
	_, err := db.Pool.Exec(ctx,
		`INSERT INTO audit_log (user_id, action, resource_type, resource_id, metadata, ip_address)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		input.UserID, input.Action, input.ResourceType, input.ResourceID, metaJSON, input.IPAddress,
	)
	if err != nil {
		return fmt.Errorf("write audit: %w", err)
	}
	return nil
}

func (db *DB) ListAuditBySpec(ctx context.Context, specID uuid.UUID, limit int) ([]AuditEntry, error) {
	if limit <= 0 {
		limit = 100
	}
	rows, _ := db.Pool.Query(ctx,
		`SELECT a.id, a.user_id, a.action, a.resource_type, a.resource_id, a.metadata, COALESCE(a.ip_address, '') AS ip_address, a.created_at
		 FROM audit_log a
		 WHERE (a.resource_type = 'spec' AND a.resource_id = $1)
		    OR (a.resource_type = 'version' AND a.resource_id IN (SELECT id FROM spec_versions WHERE spec_id = $1))
		    OR (a.resource_type = 'annotation' AND a.resource_id IN (SELECT ann.id FROM annotations ann JOIN spec_versions sv ON ann.version_id = sv.id WHERE sv.spec_id = $1))
		    OR (a.resource_type = 'approval' AND a.resource_id IN (SELECT ap.id FROM approvals ap JOIN spec_versions sv ON ap.version_id = sv.id WHERE sv.spec_id = $1))
		 ORDER BY a.created_at DESC LIMIT $2`, specID, limit)
	entries, err := pgx.CollectRows(rows, pgx.RowToStructByName[AuditEntry])
	if err != nil {
		return nil, fmt.Errorf("list audit: %w", err)
	}
	return entries, nil
}
