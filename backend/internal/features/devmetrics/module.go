package devmetrics

import (
	"net/http"
	"rkm-service-manager/backend/internal/shared/permissions"

	"gorm.io/gorm"
)

type Authorizer interface {
	RequirePermission(
		permission string,
		next http.HandlerFunc,
	) http.HandlerFunc

	RequireCSRF(
		next http.HandlerFunc,
	) http.HandlerFunc
}

type Module struct {
	database   *gorm.DB
	authorizer Authorizer
}

func New(
	databaseConnection *gorm.DB,
	authorizer Authorizer,
) (*Module, error) {
	module := &Module{
		database:   databaseConnection,
		authorizer: authorizer,
	}

	migrationError := module.database.
		AutoMigrate(&FeatureMetric{})

	if migrationError != nil {
		return nil, migrationError
	}

	return module, nil
}

func (module *Module) Register(
	mux *http.ServeMux,
) {
	mux.HandleFunc(
		"GET /api/dev/feature-metrics",
		module.authorizer.RequirePermission(
			permissions.DevMetrics,
			module.handleList,
		),
	)

	mux.HandleFunc(
		"POST /api/dev/feature-metrics/freeze",
		module.authorizer.RequirePermission(
			permissions.DevMetrics,
			module.authorizer.RequireCSRF(
				module.handleFreeze,
			),
		),
	)

	mux.HandleFunc(
		"POST /api/dev/feature-metrics/unlock",
		module.authorizer.RequirePermission(
			permissions.DevMetrics,
			module.authorizer.RequireCSRF(
				module.handleUnlock,
			),
		),
	)
}
