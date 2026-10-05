package database

import (
	"os"
	"rkm-service-manager/backend/internal/shared/config"
	"strings"

	"github.com/libtnb/sqlite"
	"gorm.io/gorm"
)

func Open() (*gorm.DB, error) {
	databasePath := config.Env("DB_PATH", "rkm.db")

	if importPath := os.Getenv("DB_IMPORT_PATH"); importPath != "" {
		if _, statError := os.Stat(importPath); statError == nil {
			if renameError := os.Rename(importPath, databasePath); renameError != nil {
				return nil, renameError
			}
		} else if !os.IsNotExist(statError) {
			return nil, statError
		}
	}

	return OpenPath(databasePath)
}

func OpenPath(databasePath string) (*gorm.DB, error) {
	separator := "?"
	if strings.Contains(databasePath, "?") {
		separator = "&"
	}

	dataSourceName := databasePath +
		separator +
		"_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)"

	databaseConnection, openError := gorm.Open(
		sqlite.Open(dataSourceName),
		&gorm.Config{},
	)
	if openError != nil {
		return nil, openError
	}

	sqlDatabase, poolError := databaseConnection.DB()
	if poolError != nil {
		return nil, poolError
	}

	if pingError := sqlDatabase.Ping(); pingError != nil {
		_ = sqlDatabase.Close()
		return nil, pingError
	}

	return databaseConnection, nil
}
