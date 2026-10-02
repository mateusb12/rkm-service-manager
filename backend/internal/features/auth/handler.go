package auth

import (
	"encoding/json"
	"net/http"
	"rkm-service-manager/backend/internal/shared/config"
	"rkm-service-manager/backend/internal/shared/httpx"
	"strings"
	"time"
)

func (module *Module) handleLogin(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodPost {
		httpx.WriteJSON(writer, http.StatusMethodNotAllowed, map[string]string{"error": "method_not_allowed"})
		return
	}
	var input struct{ Email, Password string }
	if json.NewDecoder(request.Body).Decode(&input) != nil || input.Email == "" || input.Password == "" {
		httpx.WriteJSON(writer, http.StatusBadRequest, map[string]string{"error": "email_and_password_required"})
		return
	}
	user, passwordHash, ok := module.findUser(strings.ToLower(strings.TrimSpace(input.Email)))
	if !ok || !verifyPassword(passwordHash, input.Password) {
		httpx.WriteJSON(writer, http.StatusUnauthorized, map[string]string{"error": "invalid_credentials"})
		return
	}
	if sessionError := module.startSession(writer, user); sessionError != nil {
		httpx.WriteJSON(writer, http.StatusInternalServerError, map[string]string{"error": "session_creation_failed"})
		return
	}
	httpx.WriteJSON(writer, http.StatusOK, user)
}

func (module *Module) handleRefresh(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodPost {
		httpx.WriteJSON(writer, http.StatusMethodNotAllowed, map[string]string{"error": "method_not_allowed"})
		return
	}
	if !module.validCSRF(request) {
		httpx.WriteJSON(writer, http.StatusForbidden, map[string]string{"error": "csrf_failed"})
		return
	}
	cookie, cookieError := request.Cookie(refreshCookie)
	if cookieError != nil {
		httpx.WriteJSON(writer, http.StatusUnauthorized, map[string]string{"error": "refresh_required"})
		return
	}
	old := sha256Hex(cookie.Value)
	var sessionID, userID string
	var expiresAt, absoluteAt, revokedAt int64
	refreshQueryError := module.db.QueryRow(`SELECT id,user_id,expires_at,absolute_expires_at,COALESCE(revoked_at,0) FROM sessions WHERE refresh_hash=?`, old).Scan(&sessionID, &userID, &expiresAt, &absoluteAt, &revokedAt)
	now := time.Now()
	if refreshQueryError != nil || revokedAt != 0 || now.After(time.Unix(expiresAt, 0)) || now.After(time.Unix(absoluteAt, 0)) {
		httpx.WriteJSON(writer, http.StatusUnauthorized, map[string]string{"error": "refresh_expired"})
		return
	}
	user, ok := module.findUserByID(userID)
	if !ok {
		httpx.WriteJSON(writer, http.StatusUnauthorized, map[string]string{"error": "user_not_found"})
		return
	}
	access, refresh, csrf := randomToken(), randomToken(), randomToken()
	newExpires := now.Add(module.sessionTTL)
	if max := time.Unix(absoluteAt, 0); newExpires.After(max) {
		newExpires = max
	}
	accessExpires := now.Add(module.accessTTL)
	_, refreshUpdateError := module.db.Exec(`UPDATE sessions SET access_hash=?,refresh_hash=?,last_used_at=?,access_expires_at=?,expires_at=? WHERE id=?`, sha256Hex(access), sha256Hex(refresh), now.Unix(), accessExpires.Unix(), newExpires.Unix(), sessionID)
	if refreshUpdateError != nil {
		httpx.WriteJSON(writer, http.StatusInternalServerError, map[string]string{"error": "refresh_failed"})
		return
	}
	module.setCookies(writer, access, refresh, csrf, accessExpires, newExpires, time.Unix(absoluteAt, 0))
	httpx.WriteJSON(writer, http.StatusOK, user)
}

func (module *Module) handleLogout(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodPost {
		httpx.WriteJSON(writer, http.StatusMethodNotAllowed, map[string]string{"error": "method_not_allowed"})
		return
	}
	if !module.validCSRF(request) {
		httpx.WriteJSON(writer, http.StatusForbidden, map[string]string{"error": "csrf_failed"})
		return
	}
	if cookie, cookieError := request.Cookie(accessCookie); cookieError == nil {
		_, _ = module.db.Exec(`UPDATE sessions SET revoked_at=? WHERE access_hash=?`, time.Now().Unix(), sha256Hex(cookie.Value))
	}
	module.clearCookies(writer)
	httpx.WriteJSON(writer, http.StatusOK, map[string]string{"status": "logged_out"})
}

func (module *Module) handleMe(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodGet {
		httpx.WriteJSON(writer, http.StatusMethodNotAllowed, map[string]string{"error": "method_not_allowed"})
		return
	}
	user, ok := module.authenticatedUser(request)
	if !ok {
		httpx.WriteJSON(writer, http.StatusUnauthorized, map[string]string{"error": "authentication_required"})
		return
	}
	httpx.WriteJSON(writer, http.StatusOK, user)
}

func (module *Module) handleDevCredentials(
	writer http.ResponseWriter, request *http.Request,
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
		{"admin@rkm.com.br",
			config.Env("DUMMY_PASSWORD_ADMIN", "Rkm@123456"),
			"admin", "Admin"},
		{"mecanico@rkm.com.br",
			config.Env("DUMMY_PASSWORD_MECHANIC", "Rkm@123456"),
			"mechanic", "Mecânico"},
		{"pcp@rkm.com.br",
			config.Env("DUMMY_PASSWORD_PCP", "Rkm@123456"),
			"pcp", "PCP"},
		{"comercial@rkm.com.br",
			config.Env("DUMMY_PASSWORD_COMMERCIAL", "Rkm@123456"),
			"commercial", "Comercial"},
	}

	httpx.WriteJSON(writer, http.StatusOK, result)
}
