package auth

import (
	"database/sql"
	"net/http"
	"rkm-service-manager/backend/internal/shared/config"
	"time"
)

type Module struct {
	db          *sql.DB
	env         string
	accessTTL   time.Duration
	sessionTTL  time.Duration
	absoluteTTL time.Duration
	secure      bool
}

func New(db *sql.DB) (*Module, error) {
	module := &Module{
		db:          db,
		env:         config.Env("APP_ENV", "development"),
		accessTTL:   config.EnvDuration("ACCESS_TTL", 15*time.Minute),
		sessionTTL:  config.EnvDuration("SESSION_TTL", 8*time.Hour),
		absoluteTTL: config.EnvDuration("SESSION_ABSOLUTE_TTL", 7*24*time.Hour),
		secure:      config.Env("COOKIE_SECURE", "false") == "true",
	}

	if schemaError := module.initDB(); schemaError != nil {
		return nil, schemaError
	}

	if seedError := module.seedUsers(); seedError != nil {
		return nil, seedError
	}

	return module, nil
}

func (module *Module) Register(mux *http.ServeMux) {
	mux.HandleFunc("/api/auth/login", module.handleLogin)
	mux.HandleFunc("/api/auth/refresh", module.handleRefresh)
	mux.HandleFunc("/api/auth/logout", module.handleLogout)
	mux.HandleFunc("/api/auth/me", module.handleMe)
	mux.HandleFunc("/api/auth/dev-credentials", module.handleDevCredentials)
}
