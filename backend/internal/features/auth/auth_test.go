package auth

import (
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
	test.Setenv("COOKIE_SECURE", "false")
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
	cookies []*http.Cookie,
	csrf string,
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

	for _, cookie := range cookies {
		request.AddCookie(cookie)
	}

	if csrf != "" {
		request.Header.Set(
			"X-CSRF-Token",
			csrf,
		)
	}

	recorder := httptest.NewRecorder()

	mux := http.NewServeMux()
	module.Register(mux)

	mux.ServeHTTP(recorder, request)

	return recorder
}

func findCookie(
	cookies []*http.Cookie,
	name string,
) *http.Cookie {
	for _, cookie := range cookies {
		if cookie.Name == name {
			return cookie
		}
	}

	return nil
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

	module.handleDevCredentials(
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

	login := performAuthRequest(
		module,
		http.MethodPost,
		"/api/auth/login",
		`{"email":"admin@rkm.com.br","password":"Rkm@123456"}`,
		nil,
		"",
	)

	if login.Code != http.StatusOK {
		test.Fatalf(
			"login expected 200, got %d: %s",
			login.Code,
			login.Body.String(),
		)
	}

	loginCookies := login.Result().Cookies()

	access := findCookie(
		loginCookies,
		accessCookie,
	)
	refresh := findCookie(
		loginCookies,
		refreshCookie,
	)
	csrf := findCookie(
		loginCookies,
		csrfCookie,
	)

	if access == nil ||
		refresh == nil ||
		csrf == nil {
		test.Fatal(
			"login did not return all auth cookies",
		)
	}

	currentUser := performAuthRequest(
		module,
		http.MethodGet,
		"/api/auth/me",
		"",
		[]*http.Cookie{access},
		"",
	)

	if currentUser.Code != http.StatusOK {
		test.Fatalf(
			"me expected 200, got %d",
			currentUser.Code,
		)
	}

	refreshResponse := performAuthRequest(
		module,
		http.MethodPost,
		"/api/auth/refresh",
		"",
		[]*http.Cookie{
			refresh,
			csrf,
		},
		csrf.Value,
	)

	if refreshResponse.Code != http.StatusOK {
		test.Fatalf(
			"refresh expected 200, got %d: %s",
			refreshResponse.Code,
			refreshResponse.Body.String(),
		)
	}

	rotatedCookies := refreshResponse.Result().Cookies()

	rotatedAccess := findCookie(
		rotatedCookies,
		accessCookie,
	)
	rotatedRefresh := findCookie(
		rotatedCookies,
		refreshCookie,
	)
	rotatedCSRF := findCookie(
		rotatedCookies,
		csrfCookie,
	)

	if rotatedAccess == nil ||
		rotatedRefresh == nil ||
		rotatedCSRF == nil {
		test.Fatal(
			"refresh did not rotate all auth cookies",
		)
	}

	reusedRefresh := performAuthRequest(
		module,
		http.MethodPost,
		"/api/auth/refresh",
		"",
		[]*http.Cookie{
			refresh,
			csrf,
		},
		csrf.Value,
	)

	if reusedRefresh.Code != http.StatusUnauthorized {
		test.Fatalf(
			"reused refresh expected 401, got %d",
			reusedRefresh.Code,
		)
	}

	logout := performAuthRequest(
		module,
		http.MethodPost,
		"/api/auth/logout",
		"",
		[]*http.Cookie{
			rotatedAccess,
			rotatedRefresh,
			rotatedCSRF,
		},
		rotatedCSRF.Value,
	)

	if logout.Code != http.StatusOK {
		test.Fatalf(
			"logout expected 200, got %d",
			logout.Code,
		)
	}

	refreshDeletion := findCookie(
		logout.Result().Cookies(),
		refreshCookie,
	)

	if refreshDeletion == nil {
		test.Fatal(
			"logout did not clear refresh cookie",
		)
	}

	if refreshDeletion.Path != "/api/auth" {
		test.Fatalf(
			"refresh cookie deletion path = %q",
			refreshDeletion.Path,
		)
	}

	if refreshDeletion.MaxAge >= 0 {
		test.Fatalf(
			"refresh cookie deletion MaxAge = %d",
			refreshDeletion.MaxAge,
		)
	}

	afterLogout := performAuthRequest(
		module,
		http.MethodGet,
		"/api/auth/me",
		"",
		[]*http.Cookie{rotatedAccess},
		"",
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
