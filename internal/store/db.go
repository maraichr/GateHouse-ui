package store

import (
	"context"
	"embed"
	"fmt"
	"log/slog"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// DB wraps a pgxpool connection pool and provides typed database methods.
type DB struct {
	Pool *pgxpool.Pool
}

// New creates a new DB connection pool from a PostgreSQL DSN.
func New(ctx context.Context, dsn string) (*DB, error) {
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, fmt.Errorf("connecting to database: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("pinging database: %w", err)
	}
	return &DB{Pool: pool}, nil
}

// RunMigrations applies all pending database migrations.
func (db *DB) RunMigrations(dsn string) error {
	src, err := iofs.New(migrationsFS, "migrations")
	if err != nil {
		return fmt.Errorf("creating migration source: %w", err)
	}

	// golang-migrate uses pgx5:// scheme for the pgx/v5 driver
	migrateDSN := dsnToMigrateScheme(dsn)
	m, err := migrate.NewWithSourceInstance("iofs", src, migrateDSN)
	if err != nil {
		return fmt.Errorf("creating migrator: %w", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("running migrations: %w", err)
	}

	v, dirty, _ := m.Version()
	slog.Info("migrations applied", "version", v, "dirty", dirty)
	return nil
}

// Close closes the connection pool.
func (db *DB) Close() {
	db.Pool.Close()
}

// HealthCheck pings the database.
func (db *DB) HealthCheck(ctx context.Context) error {
	return db.Pool.Ping(ctx)
}

// dsnToMigrateScheme converts postgres:// to pgx5:// for golang-migrate.
func dsnToMigrateScheme(dsn string) string {
	if len(dsn) >= 11 && dsn[:11] == "postgres://" {
		return "pgx5://" + dsn[11:]
	}
	if len(dsn) >= 13 && dsn[:13] == "postgresql://" {
		return "pgx5://" + dsn[13:]
	}
	return dsn
}
