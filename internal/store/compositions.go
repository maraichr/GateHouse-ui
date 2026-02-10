package store

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type Composition struct {
	ID          uuid.UUID  `json:"id"                    db:"id"`
	Name        string     `json:"name"                  db:"name"`
	DisplayName string     `json:"display_name"          db:"display_name"`
	Description string     `json:"description,omitempty" db:"description"`
	HostSpecID  uuid.UUID  `json:"host_spec_id"          db:"host_spec_id"`
	OwnerID     *uuid.UUID `json:"owner_id,omitempty"    db:"owner_id"`
	CreatedAt   time.Time  `json:"created_at"            db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"            db:"updated_at"`
}

type CompositionMember struct {
	ID            uuid.UUID `json:"id"             db:"id"`
	CompositionID uuid.UUID `json:"composition_id" db:"composition_id"`
	SpecID        uuid.UUID `json:"spec_id"        db:"spec_id"`
	ServiceName   string    `json:"service_name"   db:"service_name"`
	Prefix        string    `json:"prefix"         db:"prefix"`
	NavGroup      string    `json:"nav_group"      db:"nav_group"`
	NavOrder      int       `json:"nav_order"      db:"nav_order"`
	Optional      bool      `json:"optional"       db:"optional"`
	AddedAt       time.Time `json:"added_at"       db:"added_at"`
}

const compCols = `id, name, display_name, COALESCE(description, '') AS description, host_spec_id, owner_id, created_at, updated_at`
const memberCols = `id, composition_id, spec_id, service_name, COALESCE(prefix, '') AS prefix, COALESCE(nav_group, '') AS nav_group, nav_order, optional, added_at`

type CreateCompositionInput struct {
	Name        string    `json:"name"`
	DisplayName string    `json:"display_name"`
	Description string    `json:"description,omitempty"`
	HostSpecID  uuid.UUID `json:"host_spec_id"`
	OwnerID     uuid.UUID `json:"owner_id"`
}

func (db *DB) CreateComposition(ctx context.Context, input CreateCompositionInput) (*Composition, error) {
	rows, _ := db.Pool.Query(ctx,
		`INSERT INTO compositions (name, display_name, description, host_spec_id, owner_id)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING `+compCols,
		input.Name, input.DisplayName, input.Description, input.HostSpecID, input.OwnerID)
	c, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[Composition])
	if err != nil {
		return nil, fmt.Errorf("create composition: %w", err)
	}
	return c, nil
}

func (db *DB) GetComposition(ctx context.Context, id uuid.UUID) (*Composition, error) {
	rows, _ := db.Pool.Query(ctx,
		`SELECT `+compCols+` FROM compositions WHERE id = $1`, id)
	c, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[Composition])
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get composition: %w", err)
	}
	return c, nil
}

func (db *DB) ListCompositions(ctx context.Context) ([]Composition, error) {
	rows, _ := db.Pool.Query(ctx,
		`SELECT `+compCols+` FROM compositions ORDER BY display_name`)
	comps, err := pgx.CollectRows(rows, pgx.RowToStructByName[Composition])
	if err != nil {
		return nil, fmt.Errorf("list compositions: %w", err)
	}
	return comps, nil
}

func (db *DB) GetCompositionByHostSpec(ctx context.Context, specID uuid.UUID) (*Composition, error) {
	rows, _ := db.Pool.Query(ctx,
		`SELECT `+compCols+` FROM compositions WHERE host_spec_id = $1`, specID)
	c, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[Composition])
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get composition by host spec: %w", err)
	}
	return c, nil
}

type CompositionWithInfo struct {
	Composition
	HostSpecName string `json:"host_spec_name" db:"host_spec_name"`
	MemberCount  int    `json:"member_count"   db:"member_count"`
}

func (db *DB) ListCompositionsWithInfo(ctx context.Context) ([]CompositionWithInfo, error) {
	rows, _ := db.Pool.Query(ctx,
		`SELECT c.id, c.name, c.display_name, COALESCE(c.description, '') AS description,
		        c.host_spec_id, c.owner_id, c.created_at, c.updated_at,
		        COALESCE(s.display_name, '') AS host_spec_name,
		        COUNT(cm.id)::int AS member_count
		 FROM compositions c
		 LEFT JOIN specs s ON s.id = c.host_spec_id
		 LEFT JOIN composition_members cm ON cm.composition_id = c.id
		 GROUP BY c.id, c.name, c.display_name, c.description, c.host_spec_id,
		          c.owner_id, c.created_at, c.updated_at, s.display_name
		 ORDER BY c.display_name`)
	comps, err := pgx.CollectRows(rows, pgx.RowToStructByName[CompositionWithInfo])
	if err != nil {
		return nil, fmt.Errorf("list compositions with info: %w", err)
	}
	return comps, nil
}

func (db *DB) DeleteComposition(ctx context.Context, id uuid.UUID) error {
	_, err := db.Pool.Exec(ctx, `DELETE FROM compositions WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete composition: %w", err)
	}
	return nil
}

// --- Composition Members ---

type AddCompositionMemberInput struct {
	CompositionID uuid.UUID `json:"composition_id"`
	SpecID        uuid.UUID `json:"spec_id"`
	ServiceName   string    `json:"service_name"`
	Prefix        string    `json:"prefix,omitempty"`
	NavGroup      string    `json:"nav_group,omitempty"`
	NavOrder      int       `json:"nav_order"`
	Optional      bool      `json:"optional"`
}

func (db *DB) AddCompositionMember(ctx context.Context, input AddCompositionMemberInput) (*CompositionMember, error) {
	rows, _ := db.Pool.Query(ctx,
		`INSERT INTO composition_members (composition_id, spec_id, service_name, prefix, nav_group, nav_order, optional)
		 VALUES ($1, $2, $3, NULLIF($4, ''), NULLIF($5, ''), $6, $7)
		 RETURNING `+memberCols,
		input.CompositionID, input.SpecID, input.ServiceName, input.Prefix, input.NavGroup, input.NavOrder, input.Optional)
	m, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[CompositionMember])
	if err != nil {
		return nil, fmt.Errorf("add composition member: %w", err)
	}
	return m, nil
}

func (db *DB) ListCompositionMembers(ctx context.Context, compID uuid.UUID) ([]CompositionMember, error) {
	rows, _ := db.Pool.Query(ctx,
		`SELECT `+memberCols+` FROM composition_members WHERE composition_id = $1 ORDER BY nav_order, service_name`, compID)
	members, err := pgx.CollectRows(rows, pgx.RowToStructByName[CompositionMember])
	if err != nil {
		return nil, fmt.Errorf("list composition members: %w", err)
	}
	return members, nil
}

func (db *DB) RemoveCompositionMember(ctx context.Context, memberID uuid.UUID) error {
	_, err := db.Pool.Exec(ctx, `DELETE FROM composition_members WHERE id = $1`, memberID)
	if err != nil {
		return fmt.Errorf("remove composition member: %w", err)
	}
	return nil
}

func (db *DB) UpdateCompositionMember(ctx context.Context, memberID uuid.UUID, navGroup string, navOrder int, prefix string) (*CompositionMember, error) {
	rows, _ := db.Pool.Query(ctx,
		`UPDATE composition_members SET nav_group = NULLIF($2, ''), nav_order = $3, prefix = NULLIF($4, '')
		 WHERE id = $1
		 RETURNING `+memberCols,
		memberID, navGroup, navOrder, prefix)
	m, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[CompositionMember])
	if err != nil {
		return nil, fmt.Errorf("update composition member: %w", err)
	}
	return m, nil
}
