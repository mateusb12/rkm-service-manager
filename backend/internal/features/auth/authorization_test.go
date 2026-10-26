package auth

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"rkm-service-manager/backend/internal/shared/permissions"
	"strings"
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

func TestAdminUserLifecycle(test *testing.T) {
	test.Setenv("DUMMY_PASSWORD_ADMIN", "Rkm@123456")
	test.Setenv("DUMMY_PASSWORD_PCP", "Rkm@123456")

	module := newTestModule(test)
	mux := http.NewServeMux()
	module.Register(mux)
	adminAccess := loginTestUser(test, module, "admin@rkm.com.br", "Rkm@123456")

	createRequest := httptest.NewRequest(
		http.MethodPost,
		"/api/admin/users",
		strings.NewReader(`{"name":"Ana Souza","email":"ana@rkm.com.br","role":"mechanic","password":"Senha@123"}`),
	)
	createRequest.Header.Set("Authorization", "Bearer "+adminAccess)
	createRequest.Header.Set("Content-Type", "application/json")
	createRecorder := httptest.NewRecorder()
	mux.ServeHTTP(createRecorder, createRequest)
	if createRecorder.Code != http.StatusCreated {
		test.Fatalf("create user expected 201, got %d", createRecorder.Code)
	}

	var createdUser struct {
		ID     string `json:"id"`
		Email  string `json:"email"`
		Active bool   `json:"active"`
	}
	if decodeError := json.NewDecoder(createRecorder.Body).Decode(&createdUser); decodeError != nil {
		test.Fatal(decodeError)
	}
	if createdUser.ID == "" || createdUser.Email != "ana@rkm.com.br" || !createdUser.Active {
		test.Fatalf("unexpected created user: %+v", createdUser)
	}

	getRequest := httptest.NewRequest(http.MethodGet, "/api/admin/users/"+createdUser.ID, nil)
	getRequest.Header.Set("Authorization", "Bearer "+adminAccess)
	getRecorder := httptest.NewRecorder()
	mux.ServeHTTP(getRecorder, getRequest)
	if getRecorder.Code != http.StatusOK {
		test.Fatalf("get user expected 200, got %d", getRecorder.Code)
	}

	updateRequest := httptest.NewRequest(
		http.MethodPatch,
		"/api/admin/users/"+createdUser.ID,
		strings.NewReader(`{"name":"Ana Souza Atualizada","role":"pcp"}`),
	)
	updateRequest.Header.Set("Authorization", "Bearer "+adminAccess)
	updateRequest.Header.Set("Content-Type", "application/json")
	updateRecorder := httptest.NewRecorder()
	mux.ServeHTTP(updateRecorder, updateRequest)
	if updateRecorder.Code != http.StatusOK {
		test.Fatalf("update user expected 200, got %d", updateRecorder.Code)
	}

	deactivateRequest := httptest.NewRequest(http.MethodDelete, "/api/admin/users/"+createdUser.ID, nil)
	deactivateRequest.Header.Set("Authorization", "Bearer "+adminAccess)
	deactivateRecorder := httptest.NewRecorder()
	mux.ServeHTTP(deactivateRecorder, deactivateRequest)
	if deactivateRecorder.Code != http.StatusOK {
		test.Fatalf("deactivate user expected 200, got %d", deactivateRecorder.Code)
	}

	var deactivatedUser struct {
		Active bool `json:"active"`
	}
	if decodeError := json.NewDecoder(deactivateRecorder.Body).Decode(&deactivatedUser); decodeError != nil {
		test.Fatal(decodeError)
	}
	if deactivatedUser.Active {
		test.Fatal("deactivated user remained active")
	}

	loginResponse := performAuthRequest(
		module,
		http.MethodPost,
		"/api/auth/login",
		`{"email":"ana@rkm.com.br","password":"Senha@123"}`,
		"",
	)
	if loginResponse.Code != http.StatusUnauthorized {
		test.Fatalf("deactivated user login expected 401, got %d", loginResponse.Code)
	}

	deleteRequest := httptest.NewRequest(
		http.MethodDelete,
		"/api/admin/users/"+createdUser.ID+"/permanent",
		nil,
	)
	deleteRequest.Header.Set("Authorization", "Bearer "+adminAccess)
	deleteRecorder := httptest.NewRecorder()
	mux.ServeHTTP(deleteRecorder, deleteRequest)
	if deleteRecorder.Code != http.StatusNoContent {
		test.Fatalf("hard delete expected 204, got %d", deleteRecorder.Code)
	}

	missingRequest := httptest.NewRequest(http.MethodGet, "/api/admin/users/"+createdUser.ID, nil)
	missingRequest.Header.Set("Authorization", "Bearer "+adminAccess)
	missingRecorder := httptest.NewRecorder()
	mux.ServeHTTP(missingRecorder, missingRequest)
	if missingRecorder.Code != http.StatusNotFound {
		test.Fatalf("deleted user lookup expected 404, got %d", missingRecorder.Code)
	}
}
