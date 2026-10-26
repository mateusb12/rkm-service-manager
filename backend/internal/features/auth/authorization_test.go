package auth

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"rkm-service-manager/backend/internal/shared/permissions"
	"testing"
)

func loginTestUser(
	test *testing.T,
	module *Module,
	email string,
	password string,
) string {
	test.Helper()

	loginResponse := performAuthRequest(
		module,
		http.MethodPost,
		"/api/auth/login",
		`{
			"email":"`+email+`",
			"password":"`+password+`"
		}`,
		"",
	)

	if loginResponse.Code != http.StatusOK {
		test.Fatalf(
			"login for %s expected 200, got %d",
			email,
			loginResponse.Code,
		)
	}

	var tokens tokenResponse
	if decodeError := json.NewDecoder(loginResponse.Body).Decode(&tokens); decodeError != nil {
		test.Fatal(decodeError)
	}
	return tokens.AccessToken
}

func TestRequirePermission(
	test *testing.T,
) {
	test.Setenv(
		"DUMMY_PASSWORD_ADMIN",
		"Rkm@123456",
	)
	test.Setenv(
		"DUMMY_PASSWORD_PCP",
		"Rkm@123456",
	)
	test.Setenv(
		"DUMMY_PASSWORD_MECHANIC",
		"Rkm@123456",
	)

	module := newTestModule(test)

	successHandler := func(
		writer http.ResponseWriter,
		request *http.Request,
	) {
		writer.WriteHeader(http.StatusNoContent)
	}

	permissionHandler := module.RequirePermission(
		permissions.ClientsView,
		successHandler,
	)

	unauthenticatedRequest :=
		httptest.NewRequest(
			http.MethodGet,
			"/api/clients",
			nil,
		)

	unauthenticatedRecorder :=
		httptest.NewRecorder()

	permissionHandler(
		unauthenticatedRecorder,
		unauthenticatedRequest,
	)

	if unauthenticatedRecorder.Code !=
		http.StatusUnauthorized {
		test.Fatalf(
			"unauthenticated expected 401, got %d",
			unauthenticatedRecorder.Code,
		)
	}

	pcpAccess := loginTestUser(
		test,
		module,
		"pcp@rkm.com.br",
		"Rkm@123456",
	)

	pcpRequest := httptest.NewRequest(
		http.MethodGet,
		"/api/clients",
		nil,
	)
	pcpRequest.Header.Set("Authorization", "Bearer "+pcpAccess)

	pcpRecorder := httptest.NewRecorder()

	permissionHandler(
		pcpRecorder,
		pcpRequest,
	)

	if pcpRecorder.Code != http.StatusNoContent {
		test.Fatalf(
			"pcp expected access, got %d",
			pcpRecorder.Code,
		)
	}

	mechanicAccess := loginTestUser(
		test,
		module,
		"mecanico@rkm.com.br",
		"Rkm@123456",
	)

	mechanicRequest := httptest.NewRequest(
		http.MethodGet,
		"/api/clients",
		nil,
	)
	mechanicRequest.Header.Set("Authorization", "Bearer "+mechanicAccess)

	mechanicRecorder := httptest.NewRecorder()

	permissionHandler(
		mechanicRecorder,
		mechanicRequest,
	)

	if mechanicRecorder.Code != http.StatusForbidden {
		test.Fatalf(
			"mechanic expected 403, got %d",
			mechanicRecorder.Code,
		)
	}

	adminAccess := loginTestUser(
		test,
		module,
		"admin@rkm.com.br",
		"Rkm@123456",
	)

	adminRequest := httptest.NewRequest(
		http.MethodGet,
		"/api/clients",
		nil,
	)
	adminRequest.Header.Set("Authorization", "Bearer "+adminAccess)

	adminRecorder := httptest.NewRecorder()

	permissionHandler(
		adminRecorder,
		adminRequest,
	)

	if adminRecorder.Code != http.StatusNoContent {
		test.Fatalf(
			"admin wildcard expected access, got %d",
			adminRecorder.Code,
		)
	}
}

func TestRequirePermissionWithBearerAccessToken(
	test *testing.T,
) {
	test.Setenv("DUMMY_PASSWORD_PCP", "Rkm@123456")

	module := newTestModule(test)
	permissionHandler := module.RequirePermission(
		permissions.ClientsView,
		func(writer http.ResponseWriter, request *http.Request) {
			writer.WriteHeader(http.StatusNoContent)
		},
	)

	access := loginTestUser(test, module, "pcp@rkm.com.br", "Rkm@123456")
	bearerRequest := httptest.NewRequest(http.MethodGet, "/api/clients", nil)
	bearerRequest.Header.Set("Authorization", "Bearer "+access)
	bearerRecorder := httptest.NewRecorder()
	permissionHandler(bearerRecorder, bearerRequest)

	if bearerRecorder.Code != http.StatusNoContent {
		test.Fatalf("valid bearer token expected 204, got %d", bearerRecorder.Code)
	}

	invalidRequest := httptest.NewRequest(http.MethodGet, "/api/clients", nil)
	invalidRequest.Header.Set("Authorization", "Bearer invalid-token")
	invalidRecorder := httptest.NewRecorder()
	permissionHandler(invalidRecorder, invalidRequest)

	if invalidRecorder.Code != http.StatusUnauthorized {
		test.Fatalf("invalid bearer token expected 401, got %d", invalidRecorder.Code)
	}
}

func TestListUsersIsAdminOnly(test *testing.T) {
	test.Setenv("DUMMY_PASSWORD_ADMIN", "Rkm@123456")
	test.Setenv("DUMMY_PASSWORD_PCP", "Rkm@123456")

	module := newTestModule(test)
	mux := http.NewServeMux()
	module.Register(mux)

	unauthenticatedRequest := httptest.NewRequest(http.MethodGet, "/api/admin/users", nil)
	unauthenticatedRecorder := httptest.NewRecorder()
	mux.ServeHTTP(unauthenticatedRecorder, unauthenticatedRequest)
	if unauthenticatedRecorder.Code != http.StatusUnauthorized {
		test.Fatalf("unauthenticated users request expected 401, got %d", unauthenticatedRecorder.Code)
	}

	pcpAccess := loginTestUser(test, module, "pcp@rkm.com.br", "Rkm@123456")
	pcpRequest := httptest.NewRequest(http.MethodGet, "/api/admin/users", nil)
	pcpRequest.Header.Set("Authorization", "Bearer "+pcpAccess)
	pcpRecorder := httptest.NewRecorder()
	mux.ServeHTTP(pcpRecorder, pcpRequest)
	if pcpRecorder.Code != http.StatusForbidden {
		test.Fatalf("pcp users request expected 403, got %d", pcpRecorder.Code)
	}

	adminAccess := loginTestUser(test, module, "admin@rkm.com.br", "Rkm@123456")
	adminRequest := httptest.NewRequest(http.MethodGet, "/api/admin/users", nil)
	adminRequest.Header.Set("Authorization", "Bearer "+adminAccess)
	adminRecorder := httptest.NewRecorder()
	mux.ServeHTTP(adminRecorder, adminRequest)
	if adminRecorder.Code != http.StatusOK {
		test.Fatalf("admin users request expected 200, got %d", adminRecorder.Code)
	}

	var users []struct {
		ID          string `json:"id"`
		Email       string `json:"email"`
		Name        string `json:"name"`
		Role        string `json:"role"`
		Active      bool   `json:"active"`
		LastLoginAt *int64 `json:"lastLoginAt"`
	}
	if decodeError := json.NewDecoder(adminRecorder.Body).Decode(&users); decodeError != nil {
		test.Fatal(decodeError)
	}
	if len(users) != 4 {
		test.Fatalf("expected 4 users, got %d", len(users))
	}
	if users[0].ID == "" || users[0].Email == "" || users[0].Name == "" || users[0].Role == "" {
		test.Fatal("user response is missing persisted fields")
	}

	var adminUser *int64
	for _, user := range users {
		if user.Email == "admin@rkm.com.br" {
			adminUser = user.LastLoginAt
		}
	}
	if adminUser == nil || *adminUser <= 0 {
		test.Fatal("admin last login was not persisted")
	}
}
