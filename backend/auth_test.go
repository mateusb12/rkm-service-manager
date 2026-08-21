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
