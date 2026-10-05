package auth

import (
	"encoding/json"
	"errors"
	"net/http"
	"rkm-service-manager/backend/internal/shared/config"
	"rkm-service-manager/backend/internal/shared/httpx"
	"strings"
	"time"

	"gorm.io/gorm"
)

func (module *Module) handleLogin(
	writer http.ResponseWriter,
	request *http.Request,
) {
	if request.Method != http.MethodPost {
		httpx.WriteJSON(
			writer,
			http.StatusMethodNotAllowed,
			map[string]string{"error": "method_not_allowed"},
		)
		return
	}

	var input struct {
		Email    string
		Password string
	}

	decodeError := json.NewDecoder(request.Body).Decode(&input)

	if decodeError != nil ||
		input.Email == "" ||
		input.Password == "" {
		httpx.WriteJSON(
			writer,
			http.StatusBadRequest,
			map[string]string{
				"error": "email_and_password_required",
			},
		)
		return
	}

	user, passwordHash, found := module.findUser(
		strings.ToLower(strings.TrimSpace(input.Email)),
	)

	if !found || !verifyPassword(passwordHash, input.Password) {
		httpx.WriteJSON(
			writer,
			http.StatusUnauthorized,
			map[string]string{"error": "invalid_credentials"},
		)
		return
	}

	if sessionError := module.startSession(
		writer,
		user,
	); sessionError != nil {
		httpx.WriteJSON(
			writer,
			http.StatusInternalServerError,
			map[string]string{
				"error": "session_creation_failed",
			},
		)
		return
	}

	httpx.WriteJSON(writer, http.StatusOK, user)
}

func (module *Module) handleRefresh(
	writer http.ResponseWriter,
	request *http.Request,
) {
	if request.Method != http.MethodPost {
		httpx.WriteJSON(
			writer,
			http.StatusMethodNotAllowed,
			map[string]string{"error": "method_not_allowed"},
		)
		return
	}

	if !module.validCSRF(request) {
		httpx.WriteJSON(
			writer,
			http.StatusForbidden,
			map[string]string{"error": "csrf_failed"},
		)
		return
	}

	refreshCookieValue, cookieError := request.Cookie(refreshCookie)
	if cookieError != nil {
		httpx.WriteJSON(
			writer,
			http.StatusUnauthorized,
			map[string]string{"error": "refresh_required"},
		)
		return
	}

	oldRefreshHash := sha256Hex(refreshCookieValue.Value)

	var storedSession sessionModel

	refreshQueryError := module.database.
		Where(
			"refresh_hash = ? AND revoked_at IS NULL",
			oldRefreshHash,
		).
		First(&storedSession).
		Error

	if refreshQueryError != nil {
		if errors.Is(
			refreshQueryError,
			gorm.ErrRecordNotFound,
		) {
			httpx.WriteJSON(
				writer,
				http.StatusUnauthorized,
				map[string]string{"error": "refresh_expired"},
			)
			return
		}

		httpx.WriteJSON(
			writer,
			http.StatusInternalServerError,
			map[string]string{"error": "refresh_failed"},
		)
		return
	}

	now := time.Now()

	if now.After(time.Unix(storedSession.ExpiresAt, 0)) ||
		now.After(time.Unix(storedSession.AbsoluteExpiresAt, 0)) {
		httpx.WriteJSON(
			writer,
			http.StatusUnauthorized,
			map[string]string{"error": "refresh_expired"},
		)
		return
	}

	user, found := module.findUserByID(storedSession.UserID)
	if !found {
		httpx.WriteJSON(
			writer,
			http.StatusUnauthorized,
			map[string]string{"error": "user_not_found"},
		)
		return
	}

	tokens, tokenGenerationError := generateSessionTokens()
	if tokenGenerationError != nil {
		httpx.WriteJSON(
			writer,
			http.StatusInternalServerError,
			map[string]string{"error": "refresh_failed"},
		)
		return
	}

	refreshExpires := now.Add(module.sessionTTL)
	absoluteExpires := time.Unix(
		storedSession.AbsoluteExpiresAt,
		0,
	)

	if refreshExpires.After(absoluteExpires) {
		refreshExpires = absoluteExpires
	}

	accessExpires := now.Add(module.accessTTL)

	refreshUpdate := module.database.
		Model(&sessionModel{}).
		Where(
			"id = ? AND refresh_hash = ? AND revoked_at IS NULL",
			storedSession.ID,
			oldRefreshHash,
		).
		Updates(map[string]any{
			"access_hash":       sha256Hex(tokens.Access),
			"refresh_hash":      sha256Hex(tokens.Refresh),
			"last_used_at":      now.Unix(),
			"access_expires_at": accessExpires.Unix(),
			"expires_at":        refreshExpires.Unix(),
		})

	if refreshUpdate.Error != nil {
		httpx.WriteJSON(
			writer,
			http.StatusInternalServerError,
			map[string]string{"error": "refresh_failed"},
		)
		return
	}

	// Compare-and-swap:
	// outro refresh que ainda esteja usando o token antigo
	// não encontrará mais a linha.
	if refreshUpdate.RowsAffected != 1 {
		httpx.WriteJSON(
			writer,
			http.StatusUnauthorized,
			map[string]string{"error": "refresh_expired"},
		)
		return
	}

	module.setCookies(
		writer,
		tokens.Access,
		tokens.Refresh,
		tokens.CSRF,
		accessExpires,
		refreshExpires,
		absoluteExpires,
	)

	httpx.WriteJSON(writer, http.StatusOK, user)
}

func (module *Module) handleLogout(
	writer http.ResponseWriter,
	request *http.Request,
) {
	if request.Method != http.MethodPost {
		httpx.WriteJSON(
			writer,
			http.StatusMethodNotAllowed,
			map[string]string{"error": "method_not_allowed"},
		)
		return
	}

	if !module.validCSRF(request) {
		httpx.WriteJSON(
			writer,
			http.StatusForbidden,
			map[string]string{"error": "csrf_failed"},
		)
		return
	}

	revokeError := module.revokeSession(request)

	// O cliente deve perder os cookies mesmo se a persistência
	// da revogação falhar.
	module.clearCookies(writer)

	if revokeError != nil {
		httpx.WriteJSON(
			writer,
			http.StatusInternalServerError,
			map[string]string{"error": "logout_failed"},
		)
		return
	}

	httpx.WriteJSON(
		writer,
		http.StatusOK,
		map[string]string{"status": "logged_out"},
	)
}

func (module *Module) handleMe(
	writer http.ResponseWriter,
	request *http.Request,
) {
	if request.Method != http.MethodGet {
		httpx.WriteJSON(
			writer,
			http.StatusMethodNotAllowed,
			map[string]string{"error": "method_not_allowed"},
		)
		return
	}

	user, authenticated := module.authenticatedUser(request)
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

	httpx.WriteJSON(writer, http.StatusOK, user)
}

func (module *Module) handleDevCredentials(
	writer http.ResponseWriter,
	request *http.Request,
) {
	if module.env != "development" {
		http.NotFound(writer, request)
		return
	}

	if request.Method != http.MethodGet {
		writer.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	type credential struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
		Label    string `json:"label"`
	}

	result := []credential{
		{
			"admin@rkm.com.br",
			config.Env(
				"DUMMY_PASSWORD_ADMIN",
				"Rkm@123456",
			),
			"admin",
			"Admin",
		},
		{
			"mecanico@rkm.com.br",
			config.Env(
				"DUMMY_PASSWORD_MECHANIC",
				"Rkm@123456",
			),
			"mechanic",
			"Mecânico",
		},
		{
			"pcp@rkm.com.br",
			config.Env(
				"DUMMY_PASSWORD_PCP",
				"Rkm@123456",
			),
			"pcp",
			"PCP",
		},
		{
			"comercial@rkm.com.br",
			config.Env(
				"DUMMY_PASSWORD_COMMERCIAL",
				"Rkm@123456",
			),
			"commercial",
			"Comercial",
		},
	}

	httpx.WriteJSON(writer, http.StatusOK, result)
}
