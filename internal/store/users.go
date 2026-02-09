package store

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type User struct {
	ID           uuid.UUID `json:"id"            db:"id"`
	Email        string    `json:"email"         db:"email"`
	DisplayName  string    `json:"display_name"  db:"display_name"`
	Role         string    `json:"role"          db:"role"`
	AvatarURL    string    `json:"avatar_url,omitempty"  db:"avatar_url"`
	PasswordHash string    `json:"-"             db:"password_hash"`
	IsActive     bool      `json:"is_active"     db:"is_active"`
	CreatedAt    time.Time `json:"created_at"    db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"    db:"updated_at"`
}

const userCols = `id, email, display_name, role, COALESCE(avatar_url, '') AS avatar_url, COALESCE(password_hash, '') AS password_hash, is_active, created_at, updated_at`

func (db *DB) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	rows, _ := db.Pool.Query(ctx,
		`SELECT `+userCols+` FROM users WHERE email = $1 AND is_active = true`, email)
	u, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[User])
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get user by email: %w", err)
	}
	return u, nil
}

func (db *DB) GetUserByID(ctx context.Context, id uuid.UUID) (*User, error) {
	rows, _ := db.Pool.Query(ctx,
		`SELECT `+userCols+` FROM users WHERE id = $1`, id)
	u, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[User])
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get user by id: %w", err)
	}
	return u, nil
}

func (db *DB) ListUsers(ctx context.Context) ([]User, error) {
	rows, _ := db.Pool.Query(ctx,
		`SELECT `+userCols+` FROM users ORDER BY display_name`)
	users, err := pgx.CollectRows(rows, pgx.RowToStructByName[User])
	if err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}
	return users, nil
}

type CreateUserInput struct {
	Email       string `json:"email"`
	DisplayName string `json:"display_name"`
	Role        string `json:"role"`
	AvatarURL   string `json:"avatar_url,omitempty"`
}

func (db *DB) CreateUser(ctx context.Context, input CreateUserInput) (*User, error) {
	rows, _ := db.Pool.Query(ctx,
		`INSERT INTO users (email, display_name, role, avatar_url)
		 VALUES ($1, $2, $3, NULLIF($4, ''))
		 RETURNING `+userCols,
		input.Email, input.DisplayName, input.Role, input.AvatarURL)
	u, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[User])
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	return u, nil
}

func (db *DB) UpdateUserRole(ctx context.Context, id uuid.UUID, role string) (*User, error) {
	rows, _ := db.Pool.Query(ctx,
		`UPDATE users SET role = $2
		 WHERE id = $1
		 RETURNING `+userCols,
		id, role)
	u, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[User])
	if err != nil {
		return nil, fmt.Errorf("update user role: %w", err)
	}
	return u, nil
}

func (db *DB) UpdatePassword(ctx context.Context, id uuid.UUID, hash string) error {
	_, err := db.Pool.Exec(ctx,
		`UPDATE users SET password_hash = $2 WHERE id = $1`, id, hash)
	if err != nil {
		return fmt.Errorf("update password: %w", err)
	}
	return nil
}

// SeedDefaultAdmin ensures the admin user exists. The migration seeds users,
// but this provides a fallback if the admin email differs from the default.
func (db *DB) SeedDefaultAdmin(ctx context.Context, email string) (*User, error) {
	existing, err := db.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return existing, nil
	}
	return db.CreateUser(ctx, CreateUserInput{
		Email:       email,
		DisplayName: "Admin",
		Role:        "admin",
	})
}
