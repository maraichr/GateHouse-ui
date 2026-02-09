package store

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type Session struct {
	ID        uuid.UUID `json:"id"                       db:"id"`
	UserID    uuid.UUID `json:"user_id"                  db:"user_id"`
	Token     string    `json:"-"                        db:"token"`
	ExpiresAt time.Time `json:"expires_at"               db:"expires_at"`
	IPAddress string    `json:"ip_address,omitempty"     db:"ip_address"`
	UserAgent string    `json:"user_agent,omitempty"     db:"user_agent"`
	CreatedAt time.Time `json:"created_at"               db:"created_at"`
}

const sessionCols = `id, user_id, token, expires_at, COALESCE(ip_address, '') AS ip_address, COALESCE(user_agent, '') AS user_agent, created_at`

func (db *DB) CreateSession(ctx context.Context, userID uuid.UUID, token string, expiresAt time.Time, ip, ua string) (*Session, error) {
	rows, _ := db.Pool.Query(ctx,
		`INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING `+sessionCols,
		userID, token, expiresAt, ip, ua)
	s, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[Session])
	if err != nil {
		return nil, fmt.Errorf("create session: %w", err)
	}
	return s, nil
}

// GetSessionByToken returns the session if it exists and has not expired.
func (db *DB) GetSessionByToken(ctx context.Context, token string) (*Session, error) {
	rows, _ := db.Pool.Query(ctx,
		`SELECT `+sessionCols+` FROM sessions WHERE token = $1 AND expires_at > NOW()`,
		token)
	s, err := pgx.CollectExactlyOneRow(rows, pgx.RowToAddrOfStructByName[Session])
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get session by token: %w", err)
	}
	return s, nil
}

func (db *DB) DeleteSession(ctx context.Context, token string) error {
	_, err := db.Pool.Exec(ctx, `DELETE FROM sessions WHERE token = $1`, token)
	if err != nil {
		return fmt.Errorf("delete session: %w", err)
	}
	return nil
}

func (db *DB) DeleteUserSessions(ctx context.Context, userID uuid.UUID) error {
	_, err := db.Pool.Exec(ctx, `DELETE FROM sessions WHERE user_id = $1`, userID)
	if err != nil {
		return fmt.Errorf("delete user sessions: %w", err)
	}
	return nil
}

func (db *DB) CleanExpiredSessions(ctx context.Context) (int64, error) {
	tag, err := db.Pool.Exec(ctx, `DELETE FROM sessions WHERE expires_at <= NOW()`)
	if err != nil {
		return 0, fmt.Errorf("clean expired sessions: %w", err)
	}
	return tag.RowsAffected(), nil
}
