package admin

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
}

type Module struct {
	users      *userRepository
	authorizer Authorizer
}

func New(databaseConnection *gorm.DB, authorizer Authorizer) *Module {
	return &Module{
		users:      newUserRepository(databaseConnection),
		authorizer: authorizer,
	}
}

func (module *Module) Register(mux *http.ServeMux) {
	mux.HandleFunc(
		"GET /api/admin/users",
		module.authorizer.RequirePermission(
			permissions.UsersManage,
			module.listUsers,
		),
	)
}
