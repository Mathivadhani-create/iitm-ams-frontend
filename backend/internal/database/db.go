package database

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"time"

	_ "github.com/lib/pq"
)

type DB struct {
	Conn *sql.DB
}

func Connect(dbURL string) (*DB, error) {
	conn, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := conn.PingContext(ctx); err != nil {
		conn.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	db := &DB{Conn: conn}
	if err := db.RunMigrations(); err != nil {
		fmt.Printf("[PostgreSQL] Migration auto-run note: %v\n", err)
	}

	return db, nil
}

func (db *DB) RunMigrations() error {
	// Look for 000001_init.up.sql in relative paths or standard location
	paths := []string{
		"migrations/000001_init.up.sql",
		"../migrations/000001_init.up.sql",
		"../../migrations/000001_init.up.sql",
		"/backend/migrations/000001_init.up.sql",
	}

	var sqlBytes []byte
	var err error
	for _, p := range paths {
		if abs, e := filepath.Abs(p); e == nil {
			if data, e := os.ReadFile(abs); e == nil {
				sqlBytes = data
				break
			}
		}
	}

	if len(sqlBytes) == 0 {
		return fmt.Errorf("migration file 000001_init.up.sql not found in standard paths")
	}

	_, err = db.Conn.Exec(string(sqlBytes))
	if err != nil {
		return fmt.Errorf("failed executing migration SQL: %w", err)
	}

	return nil
}

func (db *DB) Close() error {
	if db.Conn != nil {
		return db.Conn.Close()
	}
	return nil
}


