package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestFrontendHandlerDoesNotServeAppForAPIBase(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api", nil)
	res := httptest.NewRecorder()
	(&AuthServer{}).httpServer().Handler.ServeHTTP(res, req)
	if res.Code != http.StatusOK || !strings.Contains(res.Body.String(), `"service":"rkm-service-manager"`) {
		t.Fatalf("/api must return API JSON, got %d %q", res.Code, res.Body.String())
	}
}

func TestPasswordHash(t *testing.T) {
	hash, err := hashPassword("Rkm@123456")
	if err != nil {
		t.Fatal(err)
	}
	if !verifyPassword(hash, "Rkm@123456") {
		t.Fatal("expected password to verify")
	}
	if verifyPassword(hash, "wrong") {
		t.Fatal("expected wrong password to fail")
	}
}

func TestFourRoles(t *testing.T) {
	expected := map[string]string{
		"admin":      "Admin",
		"mechanic":   "Mecânico",
		"pcp":        "PCP",
		"commercial": "Comercial",
	}

	if len(rolePermissions) != len(expected) {
		t.Fatalf("expected 4 roles, got %d", len(rolePermissions))
	}

	for role, label := range expected {
		if _, ok := rolePermissions[role]; !ok {
			t.Fatalf("role missing: %s", role)
		}
		if roleLabels[role] != label {
			t.Fatalf("wrong label for %s", role)
		}
	}
}

func TestDevCredentialsUnavailableInProduction(t *testing.T) {
	server := &AuthServer{env: "production"}
	req := httptest.NewRequest(
		http.MethodGet, "/api/auth/dev-credentials", nil,
	)
	recorder := httptest.NewRecorder()

	server.handleDevCredentials(recorder, req)

	if recorder.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", recorder.Code)
	}
}
