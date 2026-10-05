package auth

import (
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
) []*http.Cookie {
	test.Helper()

	loginResponse := performAuthRequest(
		module,
		http.MethodPost,
		"/api/auth/login",
		`{
			"email":"`+email+`",
			"password":"`+password+`"
		}`,
		nil,
		"",
	)

	if loginResponse.Code != http.StatusOK {
		test.Fatalf(
			"login for %s expected 200, got %d",
			email,
			loginResponse.Code,
		)
	}

	return loginResponse.Result().Cookies()
}

func addRequestCookies(
	request *http.Request,
	cookies []*http.Cookie,
) {
	for _, cookie := range cookies {
		request.AddCookie(cookie)
	}
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

	pcpCookies := loginTestUser(
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
	addRequestCookies(
		pcpRequest,
		pcpCookies,
	)

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

	mechanicCookies := loginTestUser(
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
	addRequestCookies(
		mechanicRequest,
		mechanicCookies,
	)

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

	adminCookies := loginTestUser(
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
	addRequestCookies(
		adminRequest,
		adminCookies,
	)

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

func TestRequireCSRF(
	test *testing.T,
) {
	test.Setenv(
		"DUMMY_PASSWORD_PCP",
		"Rkm@123456",
	)

	module := newTestModule(test)

	successHandler := func(
		writer http.ResponseWriter,
		request *http.Request,
	) {
		writer.WriteHeader(http.StatusNoContent)
	}

	protectedHandler := module.RequirePermission(
		permissions.ClientsManage,
		module.RequireCSRF(
			successHandler,
		),
	)

	pcpCookies := loginTestUser(
		test,
		module,
		"pcp@rkm.com.br",
		"Rkm@123456",
	)

	csrfCookieValue := findCookie(
		pcpCookies,
		csrfCookie,
	)

	if csrfCookieValue == nil {
		test.Fatal(
			"pcp login returned no csrf cookie",
		)
	}

	noCSRFRequest := httptest.NewRequest(
		http.MethodPost,
		"/api/clients",
		nil,
	)
	addRequestCookies(
		noCSRFRequest,
		pcpCookies,
	)

	noCSRFRecorder := httptest.NewRecorder()

	protectedHandler(
		noCSRFRecorder,
		noCSRFRequest,
	)

	if noCSRFRecorder.Code != http.StatusForbidden {
		test.Fatalf(
			"mutation without csrf expected 403, got %d",
			noCSRFRecorder.Code,
		)
	}

	csrfRequest := httptest.NewRequest(
		http.MethodPost,
		"/api/clients",
		nil,
	)
	addRequestCookies(
		csrfRequest,
		pcpCookies,
	)

	csrfRequest.Header.Set(
		"X-CSRF-Token",
		csrfCookieValue.Value,
	)

	csrfRecorder := httptest.NewRecorder()

	protectedHandler(
		csrfRecorder,
		csrfRequest,
	)

	if csrfRecorder.Code != http.StatusNoContent {
		test.Fatalf(
			"mutation with csrf expected access, got %d",
			csrfRecorder.Code,
		)
	}
}
