package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"time"
)

const (
	authTransportHeader = "X-Auth-Transport"
	bearerTransport     = "bearer"
	refreshTokenHeader  = "X-Refresh-Token"
)

type sessionTokens struct {
	Access  string
	Refresh string
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

	return sessionTokens{
		Access:  accessToken,
		Refresh: refreshToken,
	}, nil
}

func (module *Module) startSession(
	user authUser,
) (sessionTokens, error) {
	now := time.Now()

	tokens, tokenGenerationError := generateSessionTokens()
	if tokenGenerationError != nil {
		return sessionTokens{}, tokenGenerationError
	}

	accessExpires := now.Add(module.accessTTL)
	accessToken, accessTokenError := module.issueAccessToken(user, accessExpires)
	if accessTokenError != nil {
		return sessionTokens{}, fmt.Errorf("issue access jwt: %w", accessTokenError)
	}
	tokens.Access = accessToken

	sessionID, sessionIDError := randomToken()
	if sessionIDError != nil {
		return sessionTokens{}, sessionIDError
	}

	refreshExpires := now.Add(module.sessionTTL)
	absoluteExpires := now.Add(module.absoluteTTL)
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
		return sessionTokens{}, createError
	}

	return tokens, nil
}

func (module *Module) authenticatedUser(
	request *http.Request,
) (authUser, bool) {
	accessValue, bearerToken := accessTokenFromRequest(request)
	if accessValue == "" {
		return authUser{}, false
	}

	if !bearerToken {
		return authUser{}, false
	}

	claims, parseError := module.parseAccessToken(accessValue)
	if parseError != nil {
		return authUser{}, false
	}

	_, found := module.findUserByID(claims.Subject)
	if !found {
		return authUser{}, false
	}

	var storedSession sessionModel

	sessionQueryError := module.database.
		Where(
			"access_hash = ? AND revoked_at IS NULL",
			sha256Hex(accessValue),
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

func accessTokenFromRequest(request *http.Request) (string, bool) {
	authorization := request.Header.Get("Authorization")
	if len(authorization) > len("Bearer ") &&
		strings.EqualFold(authorization[:len("Bearer ")], "Bearer ") {
		return strings.TrimSpace(authorization[len("Bearer "):]), true
	}

	return "", false
}

func refreshTokenFromRequest(request *http.Request) (string, bool) {
	if value := strings.TrimSpace(request.Header.Get(refreshTokenHeader)); value != "" {
		return value, true
	}

	return "", false
}

func (module *Module) revokeSession(
	request *http.Request,
) error {
	now := time.Now().Unix()

	if access, bearerToken := accessTokenFromRequest(request); access != "" && bearerToken {
		return module.database.
			Model(&sessionModel{}).
			Where(
				"access_hash = ? AND revoked_at IS NULL",
				sha256Hex(access),
			).
			Update("revoked_at", now).
			Error
	}

	return nil
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
