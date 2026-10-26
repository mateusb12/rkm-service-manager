package auth

import (
	"errors"
	"net/http"
	authadmin "rkm-service-manager/backend/internal/features/auth/admin"
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
	jwtSecret   string
}

func New(databaseConnection *gorm.DB) (*Module, error) {
	environment := config.Env("APP_ENV", "development")
	jwtSecret := config.Env("AUTH_JWT_SECRET", "")
	if environment == "production" && jwtSecret == "" {
		return nil, errors.New("AUTH_JWT_SECRET is required in production")
	}
	if jwtSecret == "" {
		jwtSecret = "development-only-jwt-secret"
	}

	module := &Module{
		database:    databaseConnection,
		env:         environment,
		accessTTL:   config.EnvDuration("ACCESS_TTL", 15*time.Minute),
		sessionTTL:  config.EnvDuration("SESSION_TTL", 8*time.Hour),
		absoluteTTL: config.EnvDuration("SESSION_ABSOLUTE_TTL", 7*24*time.Hour),
		jwtSecret:   jwtSecret,
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
	mux.HandleFunc("/api/auth/login", module.login)
	mux.HandleFunc("/api/auth/refresh", module.refresh)
	mux.HandleFunc("/api/auth/logout", module.logout)
	mux.HandleFunc("/api/auth/me", module.currentUser)
	mux.HandleFunc("/api/auth/dev-credentials", module.devCredentials)
	authadmin.New(module.database, module).Register(mux)
}
