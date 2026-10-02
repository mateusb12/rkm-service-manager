package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

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
}

func TestFourRoles(test *testing.T) {
	expected := map[string]string{
		"admin":      "Admin",
		"mechanic":   "Mecânico",
		"pcp":        "PCP",
		"commercial": "Comercial",
	}

	if len(rolePermissions) != len(expected) {
		test.Fatalf("expected 4 roles, got %d", len(rolePermissions))
	}

	for role, label := range expected {
		if _, ok := rolePermissions[role]; !ok {
			test.Fatalf("role missing: %s", role)
		}
		if roleLabels[role] != label {
			test.Fatalf("wrong label for %s", role)
		}
	}
}

func TestDevCredentialsUnavailableInProduction(test *testing.T) {
	server := &Module{env: "production"}
	req := httptest.NewRequest(
		http.MethodGet, "/api/auth/dev-credentials", nil,
	)
	recorder := httptest.NewRecorder()

	server.handleDevCredentials(recorder, req)

	if recorder.Code != http.StatusNotFound {
		test.Fatalf("expected 404, got %d", recorder.Code)
	}
}
