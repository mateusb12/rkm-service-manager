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

type PasswordHasher func(password string) (string, error)

type Module struct {
	users        *userRepository
	authorizer   Authorizer
	hashPassword PasswordHasher
}

func New(
	databaseConnection *gorm.DB,
	authorizer Authorizer,
	hashPassword PasswordHasher,
) *Module {
	return &Module{
		users:        newUserRepository(databaseConnection),
		authorizer:   authorizer,
		hashPassword: hashPassword,
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
	mux.HandleFunc(
		"POST /api/admin/users",
		module.authorizer.RequirePermission(
			permissions.UsersManage,
			module.createUser,
		),
	)
	mux.HandleFunc(
		"GET /api/admin/users/{id}",
		module.authorizer.RequirePermission(
			permissions.UsersManage,
			module.getUser,
		),
	)
	mux.HandleFunc(
		"PATCH /api/admin/users/{id}",
		module.authorizer.RequirePermission(
			permissions.UsersManage,
			module.updateUser,
		),
	)
	mux.HandleFunc(
		"DELETE /api/admin/users/{id}",
		module.authorizer.RequirePermission(
			permissions.UsersManage,
			module.deactivateUser,
		),
	)
	mux.HandleFunc(
		"DELETE /api/admin/users/{id}/permanent",
		module.authorizer.RequirePermission(
			permissions.UsersManage,
			module.hardDeleteUser,
		),
	)
}
