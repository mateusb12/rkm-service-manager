package database

import (
	"database/sql"
	_ "modernc.org/sqlite"
	"os"
	"rkm-service-manager/backend/internal/shared/config"
)

func Open() (*sql.DB, error) {
	dbPath := config.Env("DB_PATH", "rkm.db")

	if importPath := os.Getenv("DB_IMPORT_PATH"); importPath != "" {
		if _, statError := os.Stat(importPath); statError == nil {
			if renameError := os.Rename(importPath, dbPath); renameError != nil {
				return nil, renameError
			}
		} else if !os.IsNotExist(statError) {
			return nil, statError
		}
	}

	return sql.Open("sqlite", dbPath)
}
