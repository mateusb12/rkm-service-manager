package admin

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"rkm-service-manager/backend/internal/shared/httpx"
	"strings"
	"time"
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

type createUserInput struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	Password string `json:"password"`
}

type updateUserInput struct {
	Name     *string `json:"name"`
	Email    *string `json:"email"`
	Role     *string `json:"role"`
	Password *string `json:"password"`
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
		users = append(users, summarizeUser(storedUser))
	}

	httpx.WriteJSON(writer, http.StatusOK, users)
}

func (module *Module) createUser(writer http.ResponseWriter, request *http.Request) {
	var input createUserInput
	if !decodeUserInput(writer, request, &input) {
		return
	}

	input.Name = strings.TrimSpace(input.Name)
	input.Email = strings.ToLower(strings.TrimSpace(input.Email))
	input.Role = strings.TrimSpace(input.Role)
	validationErrors := validateUserInput(input.Name, input.Email, input.Role, input.Password, true)
	if len(validationErrors) > 0 {
		writeUserValidationError(writer, validationErrors)
		return
	}

	passwordHash, hashError := module.hashPassword(input.Password)
	if hashError != nil {
		httpx.WriteJSON(writer, http.StatusInternalServerError, map[string]string{"error": "user_creation_failed"})
		return
	}

	user := userRecord{
		ID:           newUserID(),
		Email:        input.Email,
		Name:         input.Name,
		Role:         input.Role,
		PasswordHash: passwordHash,
		Active:       true,
		CreatedAt:    time.Now().Unix(),
	}
	if createError := module.users.create(user); createError != nil {
		writeUserRepositoryError(writer, createError, "user_creation_failed")
		return
	}

	httpx.WriteJSON(writer, http.StatusCreated, summarizeUser(user))
}

func (module *Module) getUser(writer http.ResponseWriter, request *http.Request) {
	user, findError := module.users.find(request.PathValue("id"))
	if findError != nil {
		writeUserRepositoryError(writer, findError, "user_query_failed")
		return
	}
	httpx.WriteJSON(writer, http.StatusOK, summarizeUser(user))
}

func (module *Module) updateUser(writer http.ResponseWriter, request *http.Request) {
	var input updateUserInput
	if !decodeUserInput(writer, request, &input) {
		return
	}

	changes := map[string]any{}
	validationErrors := map[string]string{}
	if input.Name != nil {
		value := strings.TrimSpace(*input.Name)
		changes["name"] = value
		if value == "" {
			validationErrors["name"] = "Informe o nome."
		}
	}
	if input.Email != nil {
		value := strings.ToLower(strings.TrimSpace(*input.Email))
		changes["email"] = value
		if !isValidEmailil(value) {
			validationErrors["email"] = "Informe um e-mail válido."
		}
	}
	if input.Role != nil {
		value := strings.TrimSpace(*input.Role)
		changes["role"] = value
		if !isValidRolele(value) {
			validationErrors["role"] = "Informe um perfil válido."
		}
	}
	if input.Password != nil {
		if len(*input.Password) < 8 {
			validationErrors["password"] = "A senha deve ter pelo menos 8 caracteres."
		} else {
			passwordHash, hashError := module.hashPassword(*input.Password)
			if hashError != nil {
				httpx.WriteJSON(writer, http.StatusInternalServerError, map[string]string{"error": "user_update_failed"})
				return
			}
			changes["password_hash"] = passwordHash
		}
	}
	if len(changes) == 0 && len(validationErrors) == 0 {
		validationErrors["user"] = "Informe ao menos um campo para atualizar."
	}
	if len(validationErrors) > 0 {
		writeUserValidationError(writer, validationErrors)
		return
	}

	user, updateError := module.users.update(request.PathValue("id"), changes)
	if updateError != nil {
		writeUserRepositoryError(writer, updateError, "user_update_failed")
		return
	}
	httpx.WriteJSON(writer, http.StatusOK, summarizeUser(user))
}

func (module *Module) deactivateUser(writer http.ResponseWriter, request *http.Request) {
	user, deactivateError := module.users.deactivate(request.PathValue("id"))
	if deactivateError != nil {
		writeUserRepositoryError(writer, deactivateError, "user_deactivation_failed")
		return
	}
	httpx.WriteJSON(writer, http.StatusOK, summarizeUser(user))
}

func (module *Module) hardDeleteUser(writer http.ResponseWriter, request *http.Request) {
	if deleteError := module.users.hardDelete(request.PathValue("id")); deleteError != nil {
		writeUserRepositoryError(writer, deleteError, "user_deletion_failed")
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func decodeUserInput(writer http.ResponseWriter, request *http.Request, target any) bool {
	decoder := json.NewDecoder(request.Body)
	decoder.DisallowUnknownFields()
	if decodeError := decoder.Decode(target); decodeError != nil {
		httpx.WriteJSON(writer, http.StatusBadRequest, map[string]string{"error": "invalid_json"})
		return false
	}
	return true
}

func validateUserInput(name, email, role, password string, requirePassword bool) map[string]string {
	validationErrors := map[string]string{}
	if name == "" {
		validationErrors["name"] = "Informe o nome."
	}
	if !isValidEmailil(email) {
		validationErrors["email"] = "Informe um e-mail válido."
	}
	if !isValidRolele(role) {
		validationErrors["role"] = "Informe um perfil válido."
	}
	if requirePassword && len(password) < 8 {
		validationErrors["password"] = "A senha deve ter pelo menos 8 caracteres."
	}
	return validationErrors
}

func isValidEmailil(email string) bool {
	return strings.Contains(email, "@") && !strings.ContainsAny(email, " \t\r\n")
}

func isValidRolele(role string) bool {
	_, exists := roleLabels[role]
	return exists
}

func writeUserValidationError(writer http.ResponseWriter, fields map[string]string) {
	httpx.WriteJSON(writer, http.StatusBadRequest, map[string]any{"error": "validation_failed", "fields": fields})
}

func writeUserRepositoryError(writer http.ResponseWriter, repositoryError error, fallback string) {
	switch repositoryError {
	case userNotFound:
		httpx.WriteJSON(writer, http.StatusNotFound, map[string]string{"error": "user_not_found"})
	case userEmailTaken:
		httpx.WriteJSON(writer, http.StatusConflict, map[string]string{"error": "email_already_exists"})
	default:
		httpx.WriteJSON(writer, http.StatusInternalServerError, map[string]string{"error": fallback})
	}
}

func summarizeUser(storedUser userRecord) userSummary {
	return userSummary{
		ID:          storedUser.ID,
		Email:       storedUser.Email,
		Name:        storedUser.Name,
		Role:        storedUser.Role,
		RoleLabel:   roleLabels[storedUser.Role],
		Active:      storedUser.Active,
		CreatedAt:   storedUser.CreatedAt,
		LastLoginAt: storedUser.LastLoginAt,
	}
}

func newUserID() string {
	value := make([]byte, 12)
	if _, randomError := rand.Read(value); randomError != nil {
		return "u-" + hex.EncodeToString([]byte(time.Now().String()))
	}
	return "u-" + hex.EncodeToString(value)
}
