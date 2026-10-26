package auth

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"rkm-service-manager/backend/internal/shared/database"
	"strings"
	"testing"
)

func newTestModule(test *testing.T) *Module {
	test.Helper()

	test.Setenv("APP_ENV", "development")
	test.Setenv(
		"DUMMY_PASSWORD_ADMIN",
		"Rkm@123456",
	)

	databaseConnection, databaseOpenError := database.OpenPath(
		filepath.Join(
			test.TempDir(),
			"auth.db",
		),
	)
	if databaseOpenError != nil {
		test.Fatal(databaseOpenError)
	}

	sqlDatabase, poolError := databaseConnection.DB()
	if poolError != nil {
		test.Fatal(poolError)
	}

	test.Cleanup(func() {
		_ = sqlDatabase.Close()
	})

	module, moduleError := New(databaseConnection)
	if moduleError != nil {
		test.Fatal(moduleError)
	}

	return module
}

func performAuthRequest(
	module *Module,
	method string,
	path string,
	body string,
	accessToken string,
) *httptest.ResponseRecorder {
	request := httptest.NewRequest(
		method,
		path,
		strings.NewReader(body),
	)

	if body != "" {
		request.Header.Set(
			"Content-Type",
			"application/json",
		)
	}

	if accessToken != "" {
		request.Header.Set("Authorization", "Bearer "+accessToken)
	}
	if path == "/api/auth/login" {
		request.Header.Set(authTransportHeader, bearerTransport)
	}

	recorder := httptest.NewRecorder()

	mux := http.NewServeMux()
	module.Register(mux)

	mux.ServeHTTP(recorder, request)

	return recorder
}

func TestBearerLoginAndRefreshRotation(test *testing.T) {
	test.Setenv("DUMMY_PASSWORD_PCP", "Rkm@123456")

	module := newTestModule(test)
	mux := http.NewServeMux()
	module.Register(mux)

	loginRequest := httptest.NewRequest(
		http.MethodPost,
		"/api/auth/login",
		strings.NewReader(`{"email":"pcp@rkm.com.br","password":"Rkm@123456"}`),
	)
	loginRequest.Header.Set("Content-Type", "application/json")
	loginRequest.Header.Set(authTransportHeader, bearerTransport)
	loginRecorder := httptest.NewRecorder()
	mux.ServeHTTP(loginRecorder, loginRequest)

	if loginRecorder.Code != http.StatusOK {
		test.Fatalf("bearer login expected 200, got %d", loginRecorder.Code)
	}

	var loginTokens tokenResponse
	if decodeError := json.NewDecoder(loginRecorder.Body).Decode(&loginTokens); decodeError != nil {
		test.Fatal(decodeError)
	}
	if loginTokens.AccessToken == "" || loginTokens.RefreshToken == "" {
		test.Fatal("bearer login returned incomplete token response")
	}

	refreshRequest := httptest.NewRequest(
		http.MethodPost,
		"/api/auth/refresh",
		nil,
	)
	refreshRequest.Header.Set(refreshTokenHeader, loginTokens.RefreshToken)
	refreshRecorder := httptest.NewRecorder()
	mux.ServeHTTP(refreshRecorder, refreshRequest)

	if refreshRecorder.Code != http.StatusOK {
		test.Fatalf("bearer refresh expected 200, got %d", refreshRecorder.Code)
	}

	var refreshedTokens tokenResponse
	if decodeError := json.NewDecoder(refreshRecorder.Body).Decode(&refreshedTokens); decodeError != nil {
		test.Fatal(decodeError)
	}
	if refreshedTokens.AccessToken == "" || refreshedTokens.RefreshToken == "" {
		test.Fatal("bearer refresh returned incomplete token response")
	}
	if refreshedTokens.AccessToken == loginTokens.AccessToken {
		test.Fatal("refresh did not rotate access token")
	}
	if refreshedTokens.RefreshToken == loginTokens.RefreshToken {
		test.Fatal("refresh did not rotate refresh token")
	}

	oldRefreshRequest := httptest.NewRequest(
		http.MethodPost,
		"/api/auth/refresh",
		nil,
	)
	oldRefreshRequest.Header.Set(refreshTokenHeader, loginTokens.RefreshToken)
	oldRefreshRecorder := httptest.NewRecorder()
	mux.ServeHTTP(oldRefreshRecorder, oldRefreshRequest)

	if oldRefreshRecorder.Code != http.StatusUnauthorized {
		test.Fatalf("reused refresh token expected 401, got %d", oldRefreshRecorder.Code)
	}
}

func TestPasswordHash(test *testing.T) {
	hash, hashError := hashPassword("Rkm@123456")
	if hashError != nil {
		test.Fatal(hashError)
	}

	if !verifyPassword(hash, "Rkm@123456") {
		test.Fatal("expected password to verify")
	}

	if verifyPassword(hash, "wrong") {
		test.Fatal("expected wrong password to fail")
	}

	malformedHashes := []string{
		"",
		"argon2id",
		"argon2id$v=19$m=x,t=3,p=2$bad$bad",
		"argon2id$v=18$m=65536,t=3,p=2$bad$bad",
	}

	for _, malformedHash := range malformedHashes {
		if verifyPassword(
			malformedHash,
			"Rkm@123456",
		) {
			test.Fatalf(
				"malformed hash accepted: %q",
				malformedHash,
			)
		}
	}
}

func TestFourRoles(test *testing.T) {
	expected := map[string]string{
		"admin":      "Admin",
		"mechanic":   "Mecânico",
		"pcp":        "PCP",
		"commercial": "Comercial",
	}

	if len(rolePermissions) != len(expected) {
		test.Fatalf(
			"expected 4 roles, got %d",
			len(rolePermissions),
		)
	}

	for role, label := range expected {
		if _, exists := rolePermissions[role]; !exists {
			test.Fatalf(
				"role missing: %s",
				role,
			)
		}

		if roleLabels[role] != label {
			test.Fatalf(
				"wrong label for %s",
				role,
			)
		}
	}
}

func TestDevCredentialsUnavailableInProduction(
	test *testing.T,
) {
	module := &Module{env: "production"}

	request := httptest.NewRequest(
		http.MethodGet,
		"/api/auth/dev-credentials",
		nil,
	)

	recorder := httptest.NewRecorder()

	module.devCredentials(
		recorder,
		request,
	)

	if recorder.Code != http.StatusNotFound {
		test.Fatalf(
			"expected 404, got %d",
			recorder.Code,
		)
	}
}

func TestAuthenticationLifecycle(test *testing.T) {
	module := newTestModule(test)
	mux := http.NewServeMux()
	module.Register(mux)

	loginRequest := httptest.NewRequest(http.MethodPost, "/api/auth/login", strings.NewReader(`{"email":"admin@rkm.com.br","password":"Rkm@123456"}`))
	loginRequest.Header.Set("Content-Type", "application/json")
	loginRequest.Header.Set(authTransportHeader, bearerTransport)
	loginRecorder := httptest.NewRecorder()
	mux.ServeHTTP(loginRecorder, loginRequest)

	if loginRecorder.Code != http.StatusOK {
		test.Fatalf(
			"login expected 200, got %d: %s",
			loginRecorder.Code,
			loginRecorder.Body.String(),
		)
	}

	var loginTokens tokenResponse
	if decodeError := json.NewDecoder(loginRecorder.Body).Decode(&loginTokens); decodeError != nil {
		test.Fatal(decodeError)
	}
	if loginTokens.AccessToken == "" || loginTokens.RefreshToken == "" {
		test.Fatal("login did not return bearer tokens")
	}

	currentUser := performAuthRequest(
		module,
		http.MethodGet,
		"/api/auth/me",
		"",
		loginTokens.AccessToken,
	)

	if currentUser.Code != http.StatusOK {
		test.Fatalf(
			"me expected 200, got %d",
			currentUser.Code,
		)
	}

	refreshRequest := httptest.NewRequest(http.MethodPost, "/api/auth/refresh", nil)
	refreshRequest.Header.Set(refreshTokenHeader, loginTokens.RefreshToken)
	refreshRecorder := httptest.NewRecorder()
	mux.ServeHTTP(refreshRecorder, refreshRequest)

	if refreshRecorder.Code != http.StatusOK {
		test.Fatalf(
			"refresh expected 200, got %d: %s",
			refreshRecorder.Code,
			refreshRecorder.Body.String(),
		)
	}

	var refreshedTokens tokenResponse
	if decodeError := json.NewDecoder(refreshRecorder.Body).Decode(&refreshedTokens); decodeError != nil {
		test.Fatal(decodeError)
	}
	if refreshedTokens.AccessToken == "" || refreshedTokens.RefreshToken == "" {
		test.Fatal("refresh did not return bearer tokens")
	}

	reusedRefreshRequest := httptest.NewRequest(http.MethodPost, "/api/auth/refresh", nil)
	reusedRefreshRequest.Header.Set(refreshTokenHeader, loginTokens.RefreshToken)
	reusedRefreshRecorder := httptest.NewRecorder()
	mux.ServeHTTP(reusedRefreshRecorder, reusedRefreshRequest)

	if reusedRefreshRecorder.Code != http.StatusUnauthorized {
		test.Fatalf(
			"reused refresh expected 401, got %d",
			reusedRefreshRecorder.Code,
		)
	}

	logout := performAuthRequest(
		module,
		http.MethodPost,
		"/api/auth/logout",
		"",
		refreshedTokens.AccessToken,
	)

	if logout.Code != http.StatusOK {
		test.Fatalf(
			"logout expected 200, got %d",
			logout.Code,
		)
	}

	afterLogout := performAuthRequest(
		module,
		http.MethodGet,
		"/api/auth/me",
		"",
		refreshedTokens.AccessToken,
	)

	if afterLogout.Code != http.StatusUnauthorized {
		test.Fatalf(
			"me after logout expected 401, got %d",
			afterLogout.Code,
		)
	}
}

func TestLegacySchemaMigratesToGORM(
	test *testing.T,
) {
	test.Setenv("APP_ENV", "development")

	databaseConnection, databaseOpenError := database.OpenPath(
		filepath.Join(
			test.TempDir(),
			"legacy.db",
		),
	)
	if databaseOpenError != nil {
		test.Fatal(databaseOpenError)
	}

	sqlDatabase, poolError := databaseConnection.DB()
	if poolError != nil {
		test.Fatal(poolError)
	}
	defer sqlDatabase.Close()

	legacySchema := `
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE TABLE sessions (
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

CREATE INDEX idx_sessions_access
ON sessions(access_hash);

CREATE INDEX idx_sessions_refresh
ON sessions(refresh_hash);
`

	if schemaError := databaseConnection.
		Exec(legacySchema).
		Error; schemaError != nil {
		test.Fatal(schemaError)
	}

	module, moduleError := New(databaseConnection)
	if moduleError != nil {
		test.Fatal(moduleError)
	}

	var userCount int64

	countError := module.database.
		Model(&userModel{}).
		Count(&userCount).
		Error

	if countError != nil {
		test.Fatal(countError)
	}

	if userCount != 4 {
		test.Fatalf(
			"expected 4 seeded users, got %d",
			userCount,
		)
	}
}
