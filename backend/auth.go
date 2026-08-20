package main

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"golang.org/x/crypto/argon2"
	_ "modernc.org/sqlite"
)

const (
	accessCookie  = "rkm_access"
	refreshCookie = "rkm_refresh"
	csrfCookie    = "rkm_csrf"
)

var rolePermissions = map[string][]string{
	"admin":      {"*"},
	"operator":   {"service.view_assigned", "service.edit_assigned", "authorization.request", "dashboard.mybench"},
	"supervisor": {"service.view_technical", "authorization.decide_technical", "dashboard.supervisor", "service.export"},
	"quality":    {"service.view_quality", "authorization.decide_quality", "evidence.view", "dashboard.quality"},
	"pcp":        {"service.view_status", "service.close_administrative", "dashboard.pcp"},
}

var roleLabels = map[string]string{
	"admin": "Admin / SGI", "operator": "Operador / Técnico", "supervisor": "Supervisor", "quality": "Qualidade", "pcp": "PCP",
}

type AuthServer struct {
	db          *sql.DB
	env         string
	accessTTL   time.Duration
	sessionTTL  time.Duration
	absoluteTTL time.Duration
	secure      bool
}

type authUser struct {
	ID          string   `json:"id"`
	Email       string   `json:"email"`
	Name        string   `json:"name"`
	Role        string   `json:"role"`
	RoleLabel   string   `json:"roleLabel"`
	Permissions []string `json:"permissions"`
}

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

func NewAuthServer() (*AuthServer, error) {
	dbPath := env("DB_PATH", "rkm.db")
	if importPath := os.Getenv("DB_IMPORT_PATH"); importPath != "" {
		if _, err := os.Stat(importPath); err == nil {
			if err := os.Rename(importPath, dbPath); err != nil {
				return nil, err
			}
		} else if !os.IsNotExist(err) {
			return nil, err
		}
	}
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, err
	}

	server := &AuthServer{
		db:          db,
		env:         env("APP_ENV", "development"),
		accessTTL:   envDuration("ACCESS_TTL", 15*time.Minute),
		sessionTTL:  envDuration("SESSION_TTL", 8*time.Hour),
		absoluteTTL: envDuration("SESSION_ABSOLUTE_TTL", 7*24*time.Hour),
		secure:      env("COOKIE_SECURE", "false") == "true",
	}
	if err := server.initDB(); err != nil {
		db.Close()
		return nil, err
	}
	if err := server.seedUsers(); err != nil {
		db.Close()
		return nil, err
	}
	return server, nil
}

func (s *AuthServer) initDB() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  access_hash TEXT NOT NULL UNIQUE,
  refresh_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER NOT NULL,
  access_expires_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  absolute_expires_at INTEGER NOT NULL,
  revoked_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_sessions_access ON sessions(access_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh ON sessions(refresh_hash);
UPDATE users SET name='Osmar Lamarck' WHERE email='admin@rkm.com.br' AND role='admin';
`)
	return err
}

func (s *AuthServer) seedUsers() error {
	if s.env != "development" {
		return nil
	}
	users := []struct{ id, email, name, role, password string }{
		{"u5", "admin@rkm.com.br", "Osmar Lamarck", "admin", env("DUMMY_PASSWORD_ADMIN", "Rkm@123456")},
		{"u1", "operador@rkm.com.br", "Carlos M.", "operator", env("DUMMY_PASSWORD_OPERATOR", "Rkm@123456")},
		{"u2", "supervisor@rkm.com.br", "Jeferson N.", "supervisor", env("DUMMY_PASSWORD_SUPERVISOR", "Rkm@123456")},
		{"u3", "qualidade@rkm.com.br", "Qualidade RKM", "quality", env("DUMMY_PASSWORD_QUALITY", "Rkm@123456")},
		{"u4", "pcp@rkm.com.br", "PCP RKM", "pcp", env("DUMMY_PASSWORD_PCP", "Rkm@123456")},
	}
	for _, user := range users {
		hash, err := hashPassword(user.password)
		if err != nil {
			return err
		}
		_, err = s.db.Exec(`INSERT INTO users(id,email,name,role,password_hash,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(email) DO NOTHING`, user.id, user.email, user.name, user.role, hash, time.Now().Unix())
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *AuthServer) httpServer() *http.Server {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", s.handleHealth)
	mux.HandleFunc("/api/health", s.handleHealth)
	mux.HandleFunc("/api/auth/login", s.handleLogin)
	mux.HandleFunc("/api/auth/refresh", s.handleRefresh)
	mux.HandleFunc("/api/auth/logout", s.handleLogout)
	mux.HandleFunc("/api/auth/me", s.handleMe)
	mux.HandleFunc("/api/auth/dev-credentials", s.handleDevCredentials)
	mux.Handle("/", frontendHandler(env("WEB_DIR", "public")))
	return &http.Server{Addr: ":" + env("PORT", "8787"), Handler: s.withCORS(mux)}
}

func frontendHandler(root string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}
		file := filepath.Join(root, strings.TrimPrefix(path.Clean(r.URL.Path), "/"))
		if info, err := os.Stat(file); err == nil && !info.IsDir() {
			http.ServeFile(w, r, file)
			return
		}
		http.ServeFile(w, r, filepath.Join(root, "index.html"))
	})
}

func (s *AuthServer) handleHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *AuthServer) handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method_not_allowed"})
		return
	}
	var input struct{ Email, Password string }
	if json.NewDecoder(r.Body).Decode(&input) != nil || input.Email == "" || input.Password == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "email_and_password_required"})
		return
	}
	user, passwordHash, ok := s.findUser(strings.ToLower(strings.TrimSpace(input.Email)))
	if !ok || !verifyPassword(passwordHash, input.Password) {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid_credentials"})
		return
	}
	if err := s.startSession(w, user); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "session_creation_failed"})
		return
	}
	writeJSON(w, http.StatusOK, user)
}

func (s *AuthServer) handleRefresh(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method_not_allowed"})
		return
	}
	if !s.validCSRF(r) {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "csrf_failed"})
		return
	}
	cookie, err := r.Cookie(refreshCookie)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "refresh_required"})
		return
	}
	old := sha256Hex(cookie.Value)
	var sessionID, userID string
	var expiresAt, absoluteAt, revokedAt int64
	err = s.db.QueryRow(`SELECT id,user_id,expires_at,absolute_expires_at,COALESCE(revoked_at,0) FROM sessions WHERE refresh_hash=?`, old).Scan(&sessionID, &userID, &expiresAt, &absoluteAt, &revokedAt)
	now := time.Now()
	if err != nil || revokedAt != 0 || now.After(time.Unix(expiresAt, 0)) || now.After(time.Unix(absoluteAt, 0)) {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "refresh_expired"})
		return
	}
	user, ok := s.findUserByID(userID)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "user_not_found"})
		return
	}
	access, refresh, csrf := randomToken(), randomToken(), randomToken()
	newExpires := now.Add(s.sessionTTL)
	if max := time.Unix(absoluteAt, 0); newExpires.After(max) {
		newExpires = max
	}
	accessExpires := now.Add(s.accessTTL)
	_, err = s.db.Exec(`UPDATE sessions SET access_hash=?,refresh_hash=?,last_used_at=?,access_expires_at=?,expires_at=? WHERE id=?`, sha256Hex(access), sha256Hex(refresh), now.Unix(), accessExpires.Unix(), newExpires.Unix(), sessionID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "refresh_failed"})
		return
	}
	s.setCookies(w, access, refresh, csrf, accessExpires, newExpires, time.Unix(absoluteAt, 0))
	writeJSON(w, http.StatusOK, user)
}

func (s *AuthServer) handleLogout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method_not_allowed"})
		return
	}
	if !s.validCSRF(r) {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "csrf_failed"})
		return
	}
	if cookie, err := r.Cookie(accessCookie); err == nil {
		_, _ = s.db.Exec(`UPDATE sessions SET revoked_at=? WHERE access_hash=?`, time.Now().Unix(), sha256Hex(cookie.Value))
	}
	s.clearCookies(w)
	writeJSON(w, http.StatusOK, map[string]string{"status": "logged_out"})
}

func (s *AuthServer) handleMe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method_not_allowed"})
		return
	}
	user, ok := s.authenticatedUser(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "authentication_required"})
		return
	}
	writeJSON(w, http.StatusOK, user)
}

func (s *AuthServer) handleDevCredentials(w http.ResponseWriter, r *http.Request) {
	if s.env != "development" {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not_found"})
		return
	}
	type credential struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
		Label    string `json:"label"`
	}
	passwords := map[string]string{"admin": env("DUMMY_PASSWORD_ADMIN", "Rkm@123456"), "operator": env("DUMMY_PASSWORD_OPERATOR", "Rkm@123456"), "supervisor": env("DUMMY_PASSWORD_SUPERVISOR", "Rkm@123456"), "quality": env("DUMMY_PASSWORD_QUALITY", "Rkm@123456"), "pcp": env("DUMMY_PASSWORD_PCP", "Rkm@123456")}
	emails := map[string]string{"admin": "admin@rkm.com.br", "operator": "operador@rkm.com.br", "supervisor": "supervisor@rkm.com.br", "quality": "qualidade@rkm.com.br", "pcp": "pcp@rkm.com.br"}
	result := make([]credential, 0, len(emails))
	for _, role := range []string{"admin", "operator", "supervisor", "quality", "pcp"} {
		result = append(result, credential{emails[role], passwords[role], role, roleLabels[role]})
	}
	writeJSON(w, http.StatusOK, result)
}

func (s *AuthServer) startSession(w http.ResponseWriter, user authUser) error {
	now := time.Now()
	access, refresh, csrf := randomToken(), randomToken(), randomToken()
	expires := now.Add(s.sessionTTL)
	absolute := now.Add(s.absoluteTTL)
	accessExpires := now.Add(s.accessTTL)
	_, err := s.db.Exec(`INSERT INTO sessions(id,user_id,access_hash,refresh_hash,created_at,last_used_at,access_expires_at,expires_at,absolute_expires_at) VALUES(?,?,?,?,?,?,?,?,?)`, randomToken(), user.ID, sha256Hex(access), sha256Hex(refresh), now.Unix(), now.Unix(), accessExpires.Unix(), expires.Unix(), absolute.Unix())
	if err == nil {
		s.setCookies(w, access, refresh, csrf, accessExpires, expires, absolute)
	}
	return err
}

func (s *AuthServer) authenticatedUser(r *http.Request) (authUser, bool) {
	cookie, err := r.Cookie(accessCookie)
	if err != nil {
		return authUser{}, false
	}
	var userID string
	var accessExpires, absolute, revoked, lastUsed int64
	err = s.db.QueryRow(`SELECT user_id,access_expires_at,absolute_expires_at,COALESCE(revoked_at,0),last_used_at FROM sessions WHERE access_hash=?`, sha256Hex(cookie.Value)).Scan(&userID, &accessExpires, &absolute, &revoked, &lastUsed)
	now := time.Now()
	if err != nil || revoked != 0 || now.After(time.Unix(accessExpires, 0)) || now.After(time.Unix(absolute, 0)) {
		return authUser{}, false
	}
	if now.Sub(time.Unix(lastUsed, 0)) > time.Minute {
		_, _ = s.db.Exec(`UPDATE sessions SET last_used_at=? WHERE access_hash=?`, now.Unix(), sha256Hex(cookie.Value))
	}
	return s.findUserByID(userID)
}

func (s *AuthServer) findUser(email string) (authUser, string, bool) {
	var user authUser
	var hash string
	err := s.db.QueryRow(`SELECT id,email,name,role,password_hash FROM users WHERE email=? AND active=1`, email).Scan(&user.ID, &user.Email, &user.Name, &user.Role, &hash)
	if err != nil {
		return authUser{}, "", false
	}
	user.RoleLabel, user.Permissions = roleLabels[user.Role], rolePermissions[user.Role]
	return user, hash, true
}

func (s *AuthServer) findUserByID(id string) (authUser, bool) {
	var user authUser
	err := s.db.QueryRow(`SELECT id,email,name,role FROM users WHERE id=? AND active=1`, id).Scan(&user.ID, &user.Email, &user.Name, &user.Role)
	if err != nil {
		return authUser{}, false
	}
	user.RoleLabel, user.Permissions = roleLabels[user.Role], rolePermissions[user.Role]
	return user, true
}

func (s *AuthServer) validCSRF(r *http.Request) bool {
	cookie, err := r.Cookie(csrfCookie)
	return err == nil && cookie.Value != "" && subtle.ConstantTimeCompare([]byte(cookie.Value), []byte(r.Header.Get("X-CSRF-Token"))) == 1
}

func (s *AuthServer) setCookies(w http.ResponseWriter, access, refresh, csrf string, accessExpires, refreshExpires, absolute time.Time) {
	s.cookie(w, accessCookie, access, accessExpires, true, "/")
	s.cookie(w, refreshCookie, refresh, refreshExpires, true, "/api/auth")
	s.cookie(w, csrfCookie, csrf, absolute, false, "/")
}
func (s *AuthServer) clearCookies(w http.ResponseWriter) {
	for _, name := range []string{accessCookie, refreshCookie, csrfCookie} {
		s.cookie(w, name, "", time.Unix(0, 0), name != csrfCookie, "/")
	}
}
func (s *AuthServer) cookie(w http.ResponseWriter, name, value string, expires time.Time, httpOnly bool, path string) {
	http.SetCookie(w, &http.Cookie{Name: name, Value: value, Path: path, Expires: expires, MaxAge: int(time.Until(expires).Seconds()), HttpOnly: httpOnly, Secure: s.secure, SameSite: http.SameSiteLaxMode})
}

func (s *AuthServer) withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "http://localhost:4173" || origin == "http://127.0.0.1:4173" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-CSRF-Token")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
func randomToken() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return hex.EncodeToString(b)
}
func sha256Hex(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}
func envDuration(key string, fallback time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if parsed, err := time.ParseDuration(value); err == nil && parsed > 0 {
			return parsed
		}
	}
	return fallback
}

const argonMemory, argonTime, argonThreads, argonKeyLen = 64 * 1024, 3, 2, 32

func hashPassword(password string) (string, error) {
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	hash := argon2.IDKey([]byte(password), salt, argonTime, argonMemory, argonThreads, argonKeyLen)
	return fmt.Sprintf("argon2id$v=19$m=%d,t=%d,p=%d$%s$%s", argonMemory, argonTime, argonThreads, base64.RawStdEncoding.EncodeToString(salt), base64.RawStdEncoding.EncodeToString(hash)), nil
}
func verifyPassword(encoded, password string) bool {
	parts := strings.Split(encoded, "$")
	if len(parts) != 5 {
		return false
	}
	params := strings.Split(parts[2], ",")
	if len(params) != 3 {
		return false
	}
	memory, _ := strconv.ParseUint(strings.TrimPrefix(params[0], "m="), 10, 32)
	iterations, _ := strconv.ParseUint(strings.TrimPrefix(params[1], "t="), 10, 32)
	threads, _ := strconv.ParseUint(strings.TrimPrefix(params[2], "p="), 10, 8)
	salt, err1 := base64.RawStdEncoding.DecodeString(parts[3])
	expected, err2 := base64.RawStdEncoding.DecodeString(parts[4])
	if err1 != nil || err2 != nil {
		return false
	}
	actual := argon2.IDKey([]byte(password), salt, uint32(iterations), uint32(memory), uint8(threads), uint32(len(expected)))
	return subtle.ConstantTimeCompare(actual, expected) == 1
}
