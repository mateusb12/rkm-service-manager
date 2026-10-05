package auth

import (
	"net/http"
	"rkm-service-manager/backend/internal/shared/httpx"
)

func (module *Module) RequirePermission(
	permission string,
	next http.HandlerFunc,
) http.HandlerFunc {
	return func(
		writer http.ResponseWriter,
		request *http.Request,
	) {
		user, authenticated :=
			module.authenticatedUser(request)

		if !authenticated {
			httpx.WriteJSON(
				writer,
				http.StatusUnauthorized,
				map[string]string{
					"error": "authentication_required",
				},
			)
			return
		}

		if !userHasPermission(user, permission) {
			httpx.WriteJSON(
				writer,
				http.StatusForbidden,
				map[string]string{
					"error": "permission_denied",
				},
			)
			return
		}

		next(writer, request)
	}
}

func (module *Module) RequireCSRF(
	next http.HandlerFunc,
) http.HandlerFunc {
	return func(
		writer http.ResponseWriter,
		request *http.Request,
	) {
		if !module.validCSRF(request) {
			httpx.WriteJSON(
				writer,
				http.StatusForbidden,
				map[string]string{
					"error": "csrf_failed",
				},
			)
			return
		}

		next(writer, request)
	}
}

func userHasPermission(
	user authUser,
	permission string,
) bool {
	for _, grantedPermission := range user.Permissions {
		if grantedPermission == "*" ||
			grantedPermission == permission {
			return true
		}
	}

	return false
}
