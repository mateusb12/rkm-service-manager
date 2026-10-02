package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"net/http"
	"time"
)

const (
	accessCookie  = "rkm_access"
	refreshCookie = "rkm_refresh"
	csrfCookie    = "rkm_csrf"
)

type session struct {
	ID          string
	UserID      string
	AccessHash  string
	RefreshHash string
	CreatedAt   time.Time
	LastUsedAt  time.Time
	ExpiresAt   time.Time
	AbsoluteAt  time.Time
}

func (module *Module) startSession(writer http.ResponseWriter, user authUser) error {
	now := time.Now()
	access, refresh, csrf := randomToken(), randomToken(), randomToken()
	expires := now.Add(module.sessionTTL)
	absolute := now.Add(module.absoluteTTL)
	accessExpires := now.Add(module.accessTTL)
	_, sessionInsertError := module.db.Exec(`INSERT INTO sessions(id,user_id,access_hash,refresh_hash,created_at,last_used_at,access_expires_at,expires_at,absolute_expires_at) VALUES(?,?,?,?,?,?,?,?,?)`, randomToken(), user.ID, sha256Hex(access), sha256Hex(refresh), now.Unix(), now.Unix(), accessExpires.Unix(), expires.Unix(), absolute.Unix())
	if sessionInsertError == nil {
		module.setCookies(writer, access, refresh, csrf, accessExpires, expires, absolute)
	}
	return sessionInsertError
}

func (module *Module) authenticatedUser(request *http.Request) (authUser, bool) {
	cookie, cookieError := request.Cookie(accessCookie)
	if cookieError != nil {
		return authUser{}, false
	}
	var userID string
	var accessExpires, absolute, revoked, lastUsed int64
	sessionQueryError := module.db.QueryRow(`SELECT user_id,access_expires_at,absolute_expires_at,COALESCE(revoked_at,0),last_used_at FROM sessions WHERE access_hash=?`, sha256Hex(cookie.Value)).Scan(&userID, &accessExpires, &absolute, &revoked, &lastUsed)
	now := time.Now()
	if sessionQueryError != nil || revoked != 0 || now.After(time.Unix(accessExpires, 0)) || now.After(time.Unix(absolute, 0)) {
		return authUser{}, false
	}
	if now.Sub(time.Unix(lastUsed, 0)) > time.Minute {
		_, _ = module.db.Exec(`UPDATE sessions SET last_used_at=? WHERE access_hash=?`, now.Unix(), sha256Hex(cookie.Value))
	}
	return module.findUserByID(userID)
}

func (module *Module) validCSRF(request *http.Request) bool {
	cookie, cookieError := request.Cookie(csrfCookie)
	return cookieError == nil && cookie.Value != "" && subtle.ConstantTimeCompare([]byte(cookie.Value), []byte(request.Header.Get("X-CSRF-Token"))) == 1
}

func (module *Module) setCookies(writer http.ResponseWriter, access, refresh, csrf string, accessExpires, refreshExpires, absolute time.Time) {
	module.cookie(writer, accessCookie, access, accessExpires, true, "/")
	module.cookie(writer, refreshCookie, refresh, refreshExpires, true, "/api/auth")
	module.cookie(writer, csrfCookie, csrf, absolute, false, "/")
}

func (module *Module) clearCookies(writer http.ResponseWriter) {
	for _, name := range []string{accessCookie, refreshCookie, csrfCookie} {
		module.cookie(writer, name, "", time.Unix(0, 0), name != csrfCookie, "/")
	}
}

func (module *Module) cookie(writer http.ResponseWriter, name, value string, expires time.Time, httpOnly bool, path string) {
	http.SetCookie(writer, &http.Cookie{Name: name, Value: value, Path: path, Expires: expires, MaxAge: int(time.Until(expires).Seconds()), HttpOnly: httpOnly, Secure: module.secure, SameSite: http.SameSiteLaxMode})
}

func randomToken() string {
	tokenBytes := make([]byte, 32)
	if _, randomReadError := rand.Read(tokenBytes); randomReadError != nil {
		panic(randomReadError)
	}
	return hex.EncodeToString(tokenBytes)
}

func sha256Hex(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}
