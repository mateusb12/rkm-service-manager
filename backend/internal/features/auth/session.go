package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"fmt"
	"net/http"
	"time"
)

const (
	accessCookie  = "rkm_access"
	refreshCookie = "rkm_refresh"
	csrfCookie    = "rkm_csrf"
)

type sessionTokens struct {
	Access  string
	Refresh string
	CSRF    string
}

func generateSessionTokens() (sessionTokens, error) {
	accessToken, accessTokenError := randomToken()
	if accessTokenError != nil {
		return sessionTokens{}, fmt.Errorf(
			"generate access token: %w",
			accessTokenError,
		)
	}

	refreshToken, refreshTokenError := randomToken()
	if refreshTokenError != nil {
		return sessionTokens{}, fmt.Errorf(
			"generate refresh token: %w",
			refreshTokenError,
		)
	}

	csrfToken, csrfTokenError := randomToken()
	if csrfTokenError != nil {
		return sessionTokens{}, fmt.Errorf(
			"generate csrf token: %w",
			csrfTokenError,
		)
	}

	return sessionTokens{
		Access:  accessToken,
		Refresh: refreshToken,
		CSRF:    csrfToken,
	}, nil
}

func (module *Module) startSession(
	writer http.ResponseWriter,
	user authUser,
) error {
	now := time.Now()

	tokens, tokenGenerationError := generateSessionTokens()
	if tokenGenerationError != nil {
		return tokenGenerationError
	}

	sessionID, sessionIDError := randomToken()
	if sessionIDError != nil {
		return sessionIDError
	}

	refreshExpires := now.Add(module.sessionTTL)
	absoluteExpires := now.Add(module.absoluteTTL)
	accessExpires := now.Add(module.accessTTL)

	storedSession := sessionModel{
		ID:                sessionID,
		UserID:            user.ID,
		AccessHash:        sha256Hex(tokens.Access),
		RefreshHash:       sha256Hex(tokens.Refresh),
		CreatedAt:         now.Unix(),
		LastUsedAt:        now.Unix(),
		AccessExpiresAt:   accessExpires.Unix(),
		ExpiresAt:         refreshExpires.Unix(),
		AbsoluteExpiresAt: absoluteExpires.Unix(),
	}

	createError := module.database.
		Create(&storedSession).
		Error

	if createError != nil {
		return createError
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

	return nil
}

func (module *Module) authenticatedUser(
	request *http.Request,
) (authUser, bool) {
	cookie, cookieError := request.Cookie(accessCookie)
	if cookieError != nil {
		return authUser{}, false
	}

	var storedSession sessionModel

	sessionQueryError := module.database.
		Where(
			"access_hash = ? AND revoked_at IS NULL",
			sha256Hex(cookie.Value),
		).
		First(&storedSession).
		Error

	if sessionQueryError != nil {
		return authUser{}, false
	}

	now := time.Now()

	if now.After(time.Unix(storedSession.AccessExpiresAt, 0)) ||
		now.After(time.Unix(storedSession.AbsoluteExpiresAt, 0)) {
		return authUser{}, false
	}

	if now.Sub(time.Unix(storedSession.LastUsedAt, 0)) > time.Minute {
		module.database.
			Model(&sessionModel{}).
			Where("id = ?", storedSession.ID).
			Update("last_used_at", now.Unix())
	}

	return module.findUserByID(storedSession.UserID)
}

func (module *Module) revokeSession(
	request *http.Request,
) error {
	now := time.Now().Unix()

	if refresh, cookieError := request.Cookie(refreshCookie); cookieError == nil {
		updateResult := module.database.
			Model(&sessionModel{}).
			Where(
				"refresh_hash = ? AND revoked_at IS NULL",
				sha256Hex(refresh.Value),
			).
			Update("revoked_at", now)

		if updateResult.Error != nil {
			return updateResult.Error
		}

		if updateResult.RowsAffected > 0 {
			return nil
		}
	}

	if access, cookieError := request.Cookie(accessCookie); cookieError == nil {
		return module.database.
			Model(&sessionModel{}).
			Where(
				"access_hash = ? AND revoked_at IS NULL",
				sha256Hex(access.Value),
			).
			Update("revoked_at", now).
			Error
	}

	return nil
}

func (module *Module) validCSRF(
	request *http.Request,
) bool {
	cookie, cookieError := request.Cookie(csrfCookie)

	return cookieError == nil &&
		cookie.Value != "" &&
		subtle.ConstantTimeCompare(
			[]byte(cookie.Value),
			[]byte(request.Header.Get("X-CSRF-Token")),
		) == 1
}

func (module *Module) setCookies(
	writer http.ResponseWriter,
	access string,
	refresh string,
	csrf string,
	accessExpires time.Time,
	refreshExpires time.Time,
	absoluteExpires time.Time,
) {
	module.cookie(
		writer,
		accessCookie,
		access,
		accessExpires,
		true,
		"/",
	)

	module.cookie(
		writer,
		refreshCookie,
		refresh,
		refreshExpires,
		true,
		"/api/auth",
	)

	module.cookie(
		writer,
		csrfCookie,
		csrf,
		absoluteExpires,
		false,
		"/",
	)
}

func (module *Module) clearCookies(
	writer http.ResponseWriter,
) {
	expired := time.Unix(0, 0)

	module.cookie(
		writer,
		accessCookie,
		"",
		expired,
		true,
		"/",
	)

	module.cookie(
		writer,
		refreshCookie,
		"",
		expired,
		true,
		"/api/auth",
	)

	module.cookie(
		writer,
		csrfCookie,
		"",
		expired,
		false,
		"/",
	)
}

func (module *Module) cookie(
	writer http.ResponseWriter,
	name string,
	value string,
	expires time.Time,
	httpOnly bool,
	path string,
) {
	maxAge := int(time.Until(expires).Seconds())
	if !expires.After(time.Now()) {
		maxAge = -1
	}

	http.SetCookie(writer, &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     path,
		Expires:  expires,
		MaxAge:   maxAge,
		HttpOnly: httpOnly,
		Secure:   module.secure,
		SameSite: http.SameSiteLaxMode,
	})
}

func randomToken() (string, error) {
	tokenBytes := make([]byte, 32)

	if _, randomReadError := rand.Read(tokenBytes); randomReadError != nil {
		return "", randomReadError
	}

	return hex.EncodeToString(tokenBytes), nil
}

func sha256Hex(value string) string {
	hash := sha256.Sum256([]byte(value))
	return hex.EncodeToString(hash[:])
}
