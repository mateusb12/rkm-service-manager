package clients

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
		AutoMigrate(&Client{})

	if migrationError != nil {
		return nil, migrationError
	}

	return module, nil
}

func (module *Module) Register(
	mux *http.ServeMux,
) {
	mux.HandleFunc(
		"GET /api/clients",
		module.authorizer.RequirePermission(
			permissions.ClientsView,
			module.handleList,
		),
	)

	mux.HandleFunc(
		"GET /api/clients/{id}",
		module.authorizer.RequirePermission(
			permissions.ClientsView,
			module.handleGet,
		),
	)

	mux.HandleFunc(
		"POST /api/clients",
		module.authorizer.RequirePermission(
			permissions.ClientsManage,
			module.authorizer.RequireCSRF(
				module.handleCreate,
			),
		),
	)

	mux.HandleFunc(
		"PUT /api/clients/{id}",
		module.authorizer.RequirePermission(
			permissions.ClientsManage,
			module.authorizer.RequireCSRF(
				module.handleUpdate,
			),
		),
	)

	mux.HandleFunc(
		"DELETE /api/clients/{id}",
		module.authorizer.RequirePermission(
			permissions.ClientsManage,
			module.authorizer.RequireCSRF(
				module.handleDelete,
			),
		),
	)
}
