package admin

import (
	"net/http"
	"rkm-service-manager/backend/internal/shared/httpx"
)

var roleLabels = map[string]string{
	"admin":      "Administrador",
	"pcp":        "PCP",
	"mechanic":   "Mecânico",
	"commercial": "Comercial",
}

type userSummary struct {
	ID          string `json:"id"`
	Email       string `json:"email"`
	Name        string `json:"name"`
	Role        string `json:"role"`
	RoleLabel   string `json:"roleLabel"`
	Active      bool   `json:"active"`
	CreatedAt   int64  `json:"createdAt"`
	LastLoginAt *int64 `json:"lastLoginAt"`
}

func (module *Module) listUsers(writer http.ResponseWriter, request *http.Request) {
	storedUsers, queryError := module.users.list()
	if queryError != nil {
		httpx.WriteJSON(
			writer,
			http.StatusInternalServerError,
			map[string]string{"error": "users_query_failed"},
		)
		return
	}

	users := make([]userSummary, 0, len(storedUsers))
	for _, storedUser := range storedUsers {
		users = append(users, userSummary{
			ID:          storedUser.ID,
			Email:       storedUser.Email,
			Name:        storedUser.Name,
			Role:        storedUser.Role,
			RoleLabel:   roleLabels[storedUser.Role],
			Active:      storedUser.Active,
			CreatedAt:   storedUser.CreatedAt,
			LastLoginAt: storedUser.LastLoginAt,
		})
	}

	httpx.WriteJSON(writer, http.StatusOK, users)
}
