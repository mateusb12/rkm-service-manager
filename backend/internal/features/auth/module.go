package auth

import (
	"net/http"
	"rkm-service-manager/backend/internal/shared/config"
	"time"

	"gorm.io/gorm"
)

type Module struct {
	database    *gorm.DB
	env         string
	accessTTL   time.Duration
	sessionTTL  time.Duration
	absoluteTTL time.Duration
	secure      bool
}

func New(databaseConnection *gorm.DB) (*Module, error) {
	environment := config.Env("APP_ENV", "development")

	secureDefault := "false"
	if environment == "production" {
		secureDefault = "true"
	}

	module := &Module{
		database:    databaseConnection,
		env:         environment,
		accessTTL:   config.EnvDuration("ACCESS_TTL", 15*time.Minute),
		sessionTTL:  config.EnvDuration("SESSION_TTL", 8*time.Hour),
		absoluteTTL: config.EnvDuration("SESSION_ABSOLUTE_TTL", 7*24*time.Hour),
		secure:      config.Env("COOKIE_SECURE", secureDefault) == "true",
	}

	if migrationError := module.migrate(); migrationError != nil {
		return nil, migrationError
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
